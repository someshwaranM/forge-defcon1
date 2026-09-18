# OCR — what exists, and how to build Claim Draft Generation on top

OCR is stage 2 of the pipeline in `ARCHITECTURE.md`: ingestion (stage 1)
validates and stores documents, creates a claim in `DRAFT`, and registers
each document in `claim-documents` with `ocr_status: PENDING`. OCR picks
up from there, extracts text, and writes offset-addressable chunks. Claim
Draft Generation (stage 3) picks up from *this* hand-off.

This doc is written the same way `INGESTION.md` was written for us:
endpoints, where OCR's output lives, the fields you can rely on, the
invariant you can build on without re-checking it, and exactly what's
known to be imperfect so you don't get surprised by it mid-implementation.

---

## 1. Flow

```
claim-documents (ocr_status=PENDING)  ──POST /claims/{claim_id}/ocr──▶  per document:
                                                                          read bytes (LocalBlobStore)
                                                                          extract text (pdfplumber / Tesseract)
                                                                          chunk text (~500-800 chars, offset-exact)
                                                                          embed each chunk (skip if all-zero)
                                                                              │
                                                                              ▼
                                                        document-pages (one row per page)
                                                        document-chunks (one row per chunk, with spans)
                                                        claim-documents.ocr_status → DONE | FAILED
                                                        audit-ledger: OCR_COMPLETED
                                                                              │
                                                                              ▼
                                                        Claim Draft Generation reads document-pages
                                                        (regex pass) + document-chunks (dictionary/RxNorm
                                                        pass), cites spans back into page text
```

A claim can have several documents; OCR processes every `PENDING`
document for the claim in one call and reports per-document results. A
document that fails doesn't block the others.

---

## 2. Endpoints

Router: `backend/app/routers/ocr.py`.

| Method | Path | What it does |
|---|---|---|
| POST | `/claims/{claim_id}/ocr` | Runs OCR on every `PENDING` document for the claim |
| GET | `/claims/{claim_id}/documents/{doc_id}/pages/{page_number}` | One page's extracted text (for a review UI) |

```bash
curl -X POST localhost:8000/claims/CLM-TEST-1/ocr
```

Response `200`:
```json
{
  "claim_id": "CLM-TEST-1",
  "documents": [
    {"doc_id": "DOC-02576759", "ocr_status": "DONE", "page_count": 1, "ocr_engine": "pdf_text"}
  ]
}
```

A document that errors comes back `{"doc_id": ..., "ocr_status": "FAILED", "error": "..."}`
in the same list rather than failing the whole request. Calling this
again on a claim whose documents are already `DONE` is a safe no-op —
`documents: []` — since it only looks at `PENDING` ones. To force
re-processing a specific document (e.g. after fixing something), the
document's `ocr_status` would need to be reset to `PENDING` first; there
is no endpoint for that yet.

---

## 3. What actually happens per document

`backend/app/pipeline/ocr/extract.py`, dispatched on `detected_type`
(trusted from ingestion's magic-byte sniffing — never re-derived here):

1. **PDF** — `pdfplumber`'s embedded text layer, per page. A page counts
   as "typed" if it yields ≥ 20 non-whitespace characters
   (`engine: "pdf_text"`, `ocr_confidence: null`).
2. **Scanned PDF page, or a standalone PNG/JPEG/TIFF** — Tesseract OCR
   (`engine: "tesseract"`, `ocr_confidence`: Tesseract's own mean word
   confidence, 0–100). TIFF can carry multiple frames; each frame is its
   own page, same as `claim-documents.page_count` already counts them.
3. **Nothing available or nothing readable** — `engine: "failed"`, empty
   text. The document's overall `ocr_status` is `FAILED` only if *every*
   page failed; if at least one page produced text, the document is
   `DONE` and `ocr_engine` on `claim-documents` is `"mixed"` when pages
   used different engines.

**Text is normalized exactly once** before anything else touches it: NFC
unicode, `\r\n`/`\r` → `\n`, runs of spaces/tabs collapsed to one, line
breaks preserved. All chunk offsets are computed against this normalized
text and it is never re-normalized afterward — don't run your own
whitespace cleanup on `document-pages.text` before citing offsets into
it, you'll break the correspondence.

**Chunking** (`chunker.py`) splits each page's text into ~500–800
character windows, preferring blank-line/sentence boundaries, never
crossing a page. Each chunk gets a best-effort `section` label (first
line matched against `Assessment|Plan|Medications?|Procedure|History of
Present Illness|HPI|Impression|Diagnosis|Allergies`, else `null`) — useful
for prioritizing which chunks to scan first for medications, per
`ARCHITECTURE.md`'s stage 3 spec ("Medications / Plan sections first").

**Engine choice note:** `ARCHITECTURE.md` and `INGESTION.md` both spec
AWS Textract as the scanned-page engine. What's actually implemented is
Tesseract — `extract.py` only branches on the literal string
`settings.ocr_provider == "tesseract"`, so setting `OCR_PROVIDER=textract`
today silently behaves exactly like `"none"` (every scanned page/image
comes back `engine: "failed"`), not an error and not real Textract calls.
This was a deliberate call made earlier for zero AWS setup dependency,
not an oversight — if you need different scanned-page accuracy than
what's described in §6 below, that's the first place to look.

---

## 4. Where things are stored

### `claim-documents` (updated by OCR, not created by it — ingestion owns creation)

OCR adds three fields via a partial `es.update`, `_id` = `doc_id`:

| Field | Example | Notes |
|---|---|---|
| `ocr_status` | `DONE` | `PENDING` (set by ingestion) → `DONE` \| `FAILED` |
| `page_count` | `1` | Pages actually produced by OCR (should match ingestion's own count, but is OCR's own count — the source of truth for "how many document-pages rows exist") |
| `ocr_engine` | `pdf_text` | `pdf_text` \| `tesseract` \| `failed` \| `mixed` |

Everything else on this record (`doc_id`, `claim_id`, `source_uri`,
`detected_type`, `sha256`, …) is ingestion's — see `INGESTION.md` §4.

### `document-pages` — one row per page

| Field | Example |
|---|---|
| `page_id` | `DOC-02576759:p1` |
| `doc_id`, `claim_id` | |
| `page_number` | `1` (1-based) |
| `text` | full normalized page text |
| `engine` | `pdf_text` \| `tesseract` \| `failed` |
| `ocr_confidence` | `92.9` or `null` |
| `char_count` | `599` |

### `document-chunks` — search/citation units (`_id` = `chunk_id`)

| Field | Example | Notes |
|---|---|---|
| `chunk_id` | `DOC-02576759:p1:c0` | `{doc_id}:p{page_number}:c{index}`, 0-based |
| `doc_id`, `claim_id`, `page_number` | | |
| `char_start`, `char_end` | `0`, `615` | Offsets into that **page's** `document-pages.text`, not the whole document |
| `text` | chunk text | **Guaranteed:** `page.text[char_start:char_end] == chunk.text` exactly — see §5 |
| `section` | `"Assessment"` or `null` | Heuristic, first line of the chunk only |
| `text_vector` | 768 floats, or **absent** | See the null-handling note below |

**`text_vector` is sometimes not present on the document at all** — it's
omitted (not indexed as a zero vector) when `embed_text()` returns an
all-zero vector for that chunk's text (e.g. a chunk that's mostly
punctuation/symbols with no recognizable tokens), because Elasticsearch 9
rejects an all-zero vector for `dot_product` similarity outright. If you
do a `knn` query against `text_vector`, that's transparent (those chunks
just aren't candidates); if you ever read chunks back and expect the
field to always exist, it won't. Handle it as optional, not required.

**Also worth knowing, independent of the above:** on this project's real
Elastic Cloud Serverless cluster, `dense_vector` fields never come back in
`_source`/`GET` even when they were indexed successfully — confirmed via
a direct `knn` query that ranked results correctly by real similarity, so
search itself works. Don't be alarmed if you fetch a chunk and its vector
key is missing even on ones that should have one; query it, don't expect
to read it back.

### `audit-ledger`

One `OCR_COMPLETED` event per document (success or failure), same
hash-chained shape as ingestion's events (`INGESTION.md` §4):

```json
{"doc_id": "...", "page_count": 1, "engine": "pdf_text", "ocr_status": "DONE", "text_sha256": "..."}
```

`text_sha256` is the SHA-256 of the concatenated page text — if you ever
need to verify a draft was generated from the text that's actually still
in `document-pages` (not edited or corrupted since), this is what to hash
and compare.

---

## 5. The invariant Claim Draft Generation gets to rely on

For every `document-chunks` row:

```
document-pages.text[chunk.char_start:chunk.char_end] == chunk.text
```

exactly, with `document-pages` matched by `(doc_id, page_number)`. This
holds by construction (the chunker computes offsets from direct slicing,
not a post-hoc string search) and is asserted in
`backend/tests/test_ocr.py` and `test_ocr_fixtures.py` across a range of
inputs, including the real fixtures in `data/sample/documents/`. Build
span citation on top of this without re-verifying it per-request; do
re-verify it if you ever see it fail, since that would mean either OCR's
normalization changed or something upstream edited page text after the
fact — both would be bugs.

The regex pass in `ARCHITECTURE.md` §3a runs over **page** text
(`document-pages.text`), not chunk text — a regex match's span is
`(doc_id, page_number, char_start, char_end)` directly into the page,
which is a strict subset of chunk offsets (a match won't cross a chunk
boundary in practice since chunks are ~500-800 chars and codes are short,
but nothing enforces that — don't assume a regex match falls inside
exactly one chunk if you need to attribute it to a `chunk_id`).

---

## 6. Known limitations (real findings from testing this stage, not guesses)

- **Tesseract misreads the digit `0` as `@` on at least one tested font**
  (`2026-@9-15`, `6@@mg` instead of `2026-09-15`, `600mg`). This is
  exactly the kind of corruption that could quietly wreck a regex match
  on a scanned CPT/ICD code or a date. Two things already exist to lean
  on: `document-pages.ocr_confidence` (flag/deprioritize low-confidence
  pages) and `ARCHITECTURE.md`'s own rule that every regex hit must exist
  in the code dictionary before being trusted — don't relax that rule for
  Tesseract-sourced pages, it's precisely the safety net this failure
  mode needs.
- **Tabular data (hospital bills) loses row alignment on the image OCR
  path.** `pytesseract.image_to_string` on a billing statement image
  returned "all descriptions, then all codes, then all charges" instead
  of per-row groupings — the PDF-text path preserves rows correctly, only
  the image/Tesseract path doesn't. If candidate generation assumes a CPT
  code and its adjacent charge/description are near each other in the
  page text, that assumption holds for `pdf_text` pages and can silently
  fail for `tesseract` pages from tabular documents. Check `engine` before
  relying on positional proximity.
- **TIFF multi-frame support is implemented but only tested against a
  synthetic single-frame TIFF equivalent (PNG).** The frame-iteration
  code path (`ImageSequence.Iterator`) hasn't been exercised against a
  real multi-page TIFF fixture. If a real multi-frame TIFF behaves
  differently, that's in `extract.py`'s `_extract_image_frames`.
- **`ocr_engine: "mixed"` on `claim-documents`** means different pages of
  the same document used different engines (e.g. a PDF with some typed
  pages and some scanned ones) — check each page's own `engine` in
  `document-pages` rather than assuming uniform quality across a
  multi-page document.
- Sample test data for all of the above is real and reusable:
  `data/sample/documents/` (`manifest.json` explains what's synthetic vs.
  real) has a clinical note and a hospital bill as both a text-layer PDF
  and a Tesseract-OCR'd image, specifically so a "regex/dictionary
  candidate generation" implementation has something concrete to run
  against without needing new fixtures.

---

## 7. Code map

```
backend/app/
  pipeline/ocr/
    extract.py      PageResult, extract_document(data: bytes, detected_type) -> list[PageResult]
    chunker.py       Chunk, chunk_page_text(text, page_number, doc_id, claim_id) -> list[Chunk]
    repository.py    all ES/blob reads+writes for this stage
    service.py       OCRService.process_claim() / process_document()
    __init__.py      get_ocr_service()
  routers/ocr.py             HTTP endpoints above
  indices/names.py           DOCUMENT_PAGES, DOCUMENT_CHUNKS constants
  indices/mappings/          document_pages.json, document_chunks.json (auto-created on startup)
backend/tests/
  test_ocr.py                pure extract/chunk unit tests, no cluster needed
  test_ocr_fixtures.py       real-fixture regression tests + service-level tests (fake repo, no cluster)
data/sample/documents/       clinical_note.{pdf,png}, hospital_bill.{pdf,png}, scanned_clinical_note.pdf
```

---

## 8. Building Claim Draft Generation on top — suggested contract

Matches `ARCHITECTURE.md` §Stage 3. Put it in its own package, same
layout as the two stages before it: `backend/app/pipeline/drafting/`
(`candidates.py`, `rxnorm.py`, `draft_generator.py`, `repository.py`,
`service.py`) and a router `backend/app/routers/drafting.py`.

**Read (input)**

```python
from app.es_client import get_es_client
from app.indices.names import DOCUMENT_PAGES, DOCUMENT_CHUNKS

es = get_es_client()

pages = es.search(index=DOCUMENT_PAGES, query={"term": {"claim_id": claim_id}},
                   sort=[{"page_number": "asc"}], size=1000)["hits"]["hits"]
chunks = es.search(index=DOCUMENT_CHUNKS, query={"term": {"claim_id": claim_id}},
                    sort=[{"page_number": "asc"}], size=1000)["hits"]["hits"]
```

Only claims with at least one `claim-documents` row at `ocr_status: DONE`
have anything usable; a claim with only `FAILED`/`PENDING` documents
should surface a warning rather than silently producing an empty draft.
`ARCHITECTURE.md`'s state machine expects `DRAFT → PROCESSING →
READY_FOR_REVIEW`, so this stage's endpoint is the thing that would move
a claim out of `DRAFT` (nothing does that automatically today).

**Rules to carry forward from this stage**

- Every span you produce (`{doc_id, page_number, char_start, char_end,
  text}`) should be re-verifiable the same way OCR's own invariant is:
  `page_text[char_start:char_end] == text`. If you shift a dictionary
  match's local offset by `chunk.char_start` to get a page-level offset
  (per `ARCHITECTURE.md`'s own instruction), re-check the slice — don't
  trust the arithmetic blindly, chunk boundaries plus multi-byte
  normalization edge cases are exactly where an off-by-one hides.
  (No multi-byte issue has actually been observed here — offsets are
  Python code-point indices throughout, not UTF-16/UTF-8 byte offsets —
  but this is the boundary where a future one would surface.)
- Check `document-pages.engine` and `ocr_confidence` before trusting a
  regex/dictionary hit at face value on a Tesseract-sourced page — see
  the digit-misread finding in §6.
- Don't re-normalize `document-pages.text`; it's already NFC/whitespace
  normalized and offsets depend on it staying exactly as-is.
- `document-chunks.text_vector` may be absent on a given chunk (see §4)
  — code defensively if this stage does any vector search over chunks.

**Suggested endpoint**, matching `ARCHITECTURE.md`'s spec:

| Method | Path | |
|---|---|---|
| POST | `/claims/{claim_id}/process` | Run candidate generation + LLM draft selection, `DRAFT → PROCESSING → READY_FOR_REVIEW` |

---

## 9. Run and test

```bash
cd src/mediaudit-x
docker compose up            # or the non-Docker Quickstart in README.md

curl -X POST localhost:8000/claims/intake \
  -F patient_id=PAT-883910 -F payer_name=UnitedHealthcare -F claim_id=CLM-TEST-1 \
  -F files=@data/sample/documents/clinical_note.pdf \
  -F files=@data/sample/documents/hospital_bill.png

curl -X POST localhost:8000/claims/CLM-TEST-1/ocr

curl localhost:8000/claims/CLM-TEST-1/documents          # ocr_status/page_count/ocr_engine per doc
curl localhost:8000/claims/CLM-TEST-1/documents/DOC-.../pages/1
```

```bash
cd backend && python -m pytest tests/test_ocr.py tests/test_ocr_fixtures.py -v
```

Tesseract-dependent tests skip (not fail) if the `tesseract` binary isn't
on `PATH` — see README.md "Known limitations" for installing it per OS.
