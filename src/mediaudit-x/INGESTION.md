# Ingestion — what exists, and how to build OCR on top of it

Ingestion is stage 1 of the pipeline in `ARCHITECTURE.md`: a hospital uploads
documents → each file is checked → good files are stored → a claim is
created in `DRAFT`. OCR (stage 2) picks up from here.

This doc is the hand-off: endpoints, where files and records live, the
fields you can rely on, and exactly what OCR should read and write.

---

## 1. Flow

```
UI /claims/new  ──POST /claims/intake──▶  checks (per file)
                                            │  rejected → reason code returned
                                            ▼
                                   file saved to uploads/{claim_id}/{doc_id}.ext
                                   claim record      → claim-files        (status DRAFT)
                                   document record   → claim-documents    (ocr_status PENDING)
                                   history           → audit-ledger       (CLAIM_CREATED, DOCUMENT_UPLOADED)
                                            │
                                            ▼
                                   OCR picks up every document with ocr_status = PENDING
```

---

## 2. Endpoints

Base URL: `http://localhost:8000` (Swagger: `/docs`). Router:
`backend/app/routers/intake.py`.

| Method | Path | What it does |
|---|---|---|
| POST | `/claims/intake` | New claim (DRAFT) from uploaded files |
| POST | `/claims/{claim_id}/documents` | Add files to an existing open claim |
| GET | `/claims/{claim_id}/documents` | List a claim's document records |
| GET | `/claims/{claim_id}` | Claim record (searches `claim-files` + `insurance-claims`) |
| GET | `/claims` | All claims, newest first |
| GET | `/files/{claim_id}/{doc_id}.{ext}` | Download the stored file |

### POST /claims/intake (multipart form)

| Field | Required | Notes |
|---|---|---|
| `patient_id` | yes | |
| `payer_name` | yes | |
| `files` | yes | repeat the field for several files |
| `claim_type` | no | default `professional` |
| `doc_type` | no | `supporting_document` (default), `referral_letter`, `op_note`, `discharge_summary`, `lab_report`, `prescription`, `imaging_report`, `other` |
| `claim_id` | no | auto `CLM-XXXXXXXX`; letters, digits, `-`, `_` only |
| `submitted_by` | no | default `unknown` |

```bash
curl -X POST localhost:8000/claims/intake \
  -F patient_id=PAT-883910 -F payer_name=UnitedHealthcare -F claim_id=CLM-TEST-1 \
  -F files=@data/sample/sample_referral_letter.pdf
```

Response `201`:
```json
{
  "claim":    { "claim_id": "CLM-TEST-1", "status": "DRAFT", "patient_id": "...", "attached_documents": [...] },
  "accepted": [ { "doc_id": "DOC-02576759", "source_uri": "/files/CLM-TEST-1/DOC-02576759.pdf", "ocr_status": "PENDING", ... } ],
  "rejected": [ { "filename": "notes.docx", "code": "unsupported_extension", "message": "..." } ]
}
```

Errors are `{ "detail": "<message>", "code": "<code>", "rejected": [...] }`:
`422 no_valid_files | no_files | too_many_files | invalid_doc_type | invalid_claim_fields`,
`409 claim_exists | claim_not_open`, `404 claim_not_found`.

### POST /claims/{claim_id}/documents

Same checks. Form fields: `files` (or `file`), `doc_type`, `uploaded_by`.
Only allowed while the claim is `DRAFT`, `PENDING` or `REQUEST_INFO`
(`REQUEST_INFO` moves back to `DRAFT`).

---

## 3. Checks every file goes through

`backend/app/pipeline/ingestion/checks.py`, in order; first failure rejects the file.

| Check | Rejection code |
|---|---|
| usable file name | `invalid_filename` |
| extension is `.pdf .png .jpg .jpeg .tif .tiff` | `unsupported_extension` |
| size 1 byte – 20 MB | `empty_file`, `file_too_large` |
| real content (magic bytes) matches extension | `unrecognized_content`, `extension_mismatch` |
| PDF opens, not encrypted, 1–200 pages, no JavaScript | `pdf_unreadable`, `pdf_encrypted`, `pdf_no_pages`, `pdf_too_many_pages`, `pdf_active_content` |
| image decodes, ≥ 300 px shorter side, not a pixel bomb | `image_unreadable`, `image_too_small`, `image_too_many_pixels` |
| not a duplicate (same sha256) in this upload / on this claim | `duplicate_in_upload`, `duplicate_on_claim` |

Same file on a *different* claim is accepted with warning `also_attached_to:{claim_id}`.
Limits are in `backend/app/config.py` (`MAX_UPLOAD_MB`, `MAX_FILES_PER_UPLOAD`,
`MAX_PDF_PAGES`, `MIN_IMAGE_SIDE_PX`).

---

## 4. Where things are stored

### Files

| Where | Path |
|---|---|
| Docker | `uploads` volume → `/app/uploads/{claim_id}/{doc_id}{ext}` in the backend container |
| Without Docker | `backend/uploads/{claim_id}/{doc_id}{ext}` |

- File is renamed to its `doc_id`; the original name is only in the record.
- Write-once: never overwrite a stored file (its sha256 is in the ledger).
- See them: `docker compose exec backend ls -R /app/uploads`

### Elasticsearch indices

Connection comes from `backend/.env` (`ELASTIC_URL` + `ELASTIC_API_KEY`).
Names are constants in `backend/app/indices/names.py`; mappings in
`backend/app/indices/mappings/*.json` (file `a_b.json` → index `a-b`).
**Any mapping file you add is created automatically** on backend startup.

**`claim-files`** — one record per claim created by upload

| Field | Example |
|---|---|
| `claim_id` | `CLM-TEST-1` |
| `patient_id`, `payer_name`, `claim_type` | |
| `status` | `DRAFT` |
| `source` | `intake` |
| `submitted_by`, `submitted_date` | |
| `cpt_code`, `icd10_code`, `claim_amount` | `null` until later stages |
| `attached_documents[]` | `{doc_id, doc_type, source_uri}` |

(`insurance-claims` has the same shape and holds manual/sample claims.
Always look claims up with `index=ALL_CLAIMS` from `names.py`.)

**`claim-documents`** — one record per stored file (ES `_id` = `doc_id`)

| Field | Example | Notes |
|---|---|---|
| `doc_id` | `DOC-02576759` | |
| `claim_id` | `CLM-TEST-1` | |
| `original_filename` | `referral.pdf` | |
| `doc_type` | `referral_letter` | |
| `extension` | `.pdf` | |
| `detected_type` | `pdf` \| `png` \| `jpeg` \| `tiff` | from magic bytes — trust this |
| `client_mime_type` | `application/pdf` | from the browser, informational |
| `size_bytes` | `3196` | |
| `sha256` | `bd9e19…` | |
| `source_uri` | `/files/CLM-TEST-1/DOC-02576759.pdf` | use to read the bytes |
| `page_count` | `1` | PDFs: pages; TIFF: frames; PNG/JPEG: 1 |
| `image_width`, `image_height` | | images only |
| `ocr_status` | `PENDING` | **OCR owns this field** |
| `warnings[]` | `also_attached_to:CLM-9` | |
| `uploaded_at`, `uploaded_by` | | |

**`audit-ledger`** — hash-chained history per claim

| Field | Notes |
|---|---|
| `claim_id`, `sequence_number` | 0, 1, 2… per claim |
| `event_type` | `CLAIM_CREATED`, `DOCUMENT_UPLOADED`, `STATUS_CHANGED` |
| `ref_id` | e.g. the `doc_id` |
| `record_hash`, `prev_hash` | chain; `GENESIS` for the first entry |

---

## 5. Code map

```
backend/app/
  pipeline/ingestion/
    models.py       data shapes, allowed extensions, DOC_TYPES, limits
    checks.py       per-file checks (FILE_CHECKS list)
    storage.py      LocalBlobStore: put / read / delete, upload_root()
    repository.py   all ES reads/writes for ingestion
    service.py      intake() / add_documents() / list_documents()
    __init__.py     get_ingestion_service()
  routers/intake.py         HTTP endpoints above
  indices/names.py          index name constants
  indices/mappings/         index mappings (auto-created)
  indices/create_indices.py ensure_indices() on startup
  tools/audit_ledger.py     append_event(claim_id, event_type, payload, ref_id)
frontend/app/
  claims/new/page.tsx             upload page
  components/DocumentsPanel.tsx   documents list on the claim page (shows OCR badge)
```

---

## 6. Building OCR on top — the contract

Put it in its own package, same layout: `backend/app/pipeline/ocr/`
(`extract.py`, `chunker.py`, `repository.py`, `service.py`, `__init__.py`)
and a router `backend/app/routers/ocr.py` registered in `main.py`.

**Read (input)**

```python
from app.es_client import get_es_client
from app.indices.names import CLAIM_DOCUMENTS
from app.pipeline.ingestion.storage import LocalBlobStore

es = get_es_client()
docs = es.search(index=CLAIM_DOCUMENTS, query={"bool": {"filter": [
    {"term": {"claim_id": claim_id}},
    {"term": {"ocr_status": "PENDING"}},
]}}, size=1000)["hits"]["hits"]

for hit in docs:
    doc = hit["_source"]
    data = LocalBlobStore().read(doc["source_uri"])   # the file bytes
    kind = doc["detected_type"]                      # pdf | png | jpeg | tiff
```

**Write (output)**

1. New indices — add mapping files, they are created automatically:
   - `mappings/document_pages.json` → `document-pages`: `page_id` (`{doc_id}:p{n}`),
     `doc_id`, `claim_id`, `page_number`, `text`, `engine`, `ocr_confidence`, `char_count`
   - `mappings/document_chunks.json` → `document-chunks`: `chunk_id`
     (`{doc_id}:p{n}:c{k}`), `doc_id`, `claim_id`, `page_number`, `char_start`,
     `char_end`, `text`, `section`, `text_vector` (768-dim `dense_vector`,
     `dot_product`, like `medical_policies.json`)
   - add `DOCUMENT_PAGES` / `DOCUMENT_CHUNKS` to `indices/names.py`
2. Update the document record when done (ES `_id` is the `doc_id`):
   ```python
   es.update(index=CLAIM_DOCUMENTS, id=doc["doc_id"], refresh="wait_for",
             doc={"ocr_status": "DONE", "page_count": n, "ocr_engine": "pdf_text"})
   ```
   Use `FAILED` (and keep going with the next document) when a file can't be read.
3. Ledger entry per document:
   ```python
   from app.tools.audit_ledger import append_event
   append_event(claim_id, "OCR_COMPLETED",
                {"doc_id": ..., "page_count": ..., "engine": ..., "text_sha256": ...},
                ref_id=doc_id)
   ```

**Rules**

- Use deterministic ids (`{doc_id}:p{n}`, `{doc_id}:p{n}:c{k}`) and delete a
  document's old pages/chunks before re-writing, so re-running is safe.
- Normalize page text once (NFC, `\r\n`→`\n`, collapse spaces), then never
  change it — later stages cite `char_start`/`char_end` into it.
- Must hold for every chunk: `page_text[char_start:char_end] == chunk_text`.
- Skip `text_vector` when `embed_text()` returns all zeros (Elasticsearch 9
  rejects zero vectors for `dot_product`).
- Don't change the ingestion code; add an optional auto-trigger after upload
  in `routers/intake.py` only if needed (FastAPI `BackgroundTasks`).
- Engines: `pdfplumber` text layer for typed PDFs (page has ≥ 20
  non-space chars); AWS Textract `detect_document_text` for scanned pages
  and images (AWS settings already in `config.py`).

**Suggested endpoints**

| Method | Path | |
|---|---|---|
| POST | `/claims/{claim_id}/ocr` | run OCR on the claim's `PENDING` documents |
| GET | `/claims/{claim_id}/documents/{doc_id}/pages/{n}` | page text (for the review UI) |

**UI**: `DocumentsPanel.tsx` already shows an `OCR pending / done / failed`
badge per document; add a "Run OCR" button calling the endpoint above.

---

## 7. Run and test

```bash
cd src/mediaudit-x
cp backend/.env.example backend/.env   # set ELASTIC_URL + ELASTIC_API_KEY
docker compose up --build              # later: docker compose up
```

UI http://localhost:3000 · API http://localhost:8000/docs

```bash
# upload
curl -X POST localhost:8000/claims/intake \
  -F patient_id=PAT-883910 -F payer_name=UnitedHealthcare -F claim_id=CLM-TEST-1 \
  -F files=@data/sample/sample_referral_letter.pdf

# records
curl localhost:8000/claims/CLM-TEST-1
curl localhost:8000/claims/CLM-TEST-1/documents

# files on disk
docker compose exec backend ls -R /app/uploads

# logs / stop
docker compose logs -f backend
docker compose down
```
