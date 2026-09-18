# MediAudit-X

Forge the Future Hackathon 2026 · Elastic + AWS + Sarvam

**Claims you can cite, not just trust.**

A zero-hallucination clinical claims auditor. Every adjudication decision
is grounded in real Elasticsearch search results — hybrid BM25 + vector
search with RRF, and ES|QL temporal queries — and cited back to its
source, rather than left to LLM inference alone.

## Core capabilities

- **Clinical trajectory search** (`trajectory_tool.py`) — a real ES|QL
  bi-temporal query (with a DSL aggregation fallback) that verifies
  step-therapy timelines against actual longitudinal patient history,
  computing `step_therapy_met` from real encounter data rather than
  asserting it.
- **Hybrid policy matcher** (`policy_matcher_tool.py` +
  `embeddings/embed.py`) — RRF hybrid search (BM25 + a 768-dim vector)
  over payer policy documents, so exact code matches and semantically
  similar language (e.g. "Toradol" vs. "Ketorolac") both surface.
- **Drug interaction auditor** (`drug_interaction_tool.py`) — RxNorm
  brand/generic name resolution against FDA-flagged interaction pairs,
  so a brand-name/generic-name mismatch doesn't hide a real
  contraindication.
- **Agent orchestrator** (`agent/orchestrator.py`) — a multi-round Claude
  tool-use loop (via AWS Bedrock by default, direct Anthropic API as a
  local-dev fallback) that streams its reasoning live over SSE, assembles
  cited evidence with real source IDs, and writes to a hash-chained audit
  ledger. The final APPROVE/DENY/REQUEST_INFO decision is computed
  deterministically from tool results (`_decide()`), never left to the
  LLM to state, to preserve the zero-hallucination property. Falls back
  to a deterministic no-LLM tool sweep if the LLM call fails for any
  reason, so adjudication still completes end-to-end.
- **Letter + FHIR generation** (`actuators/letter_generator.py`) —
  template-based, not LLM-freeform, built entirely from cited tool
  results.
- **Audit ledger** (`tools/audit_ledger.py`) — SHA-256 hash-chained,
  tamper-evident record of every adjudication.

## Data

- `data/sample/` — hand-built fixture claims, patients, and two
  drug-interaction pairs (Warfarin+Fluconazole, Apixaban+Ketorolac) with
  verified real RXCUI codes and FDA label citations.
- `data/synthea_samples/` — real Synthea-generated patient data (FHIR
  bundles from a synthetic Massachusetts population), with five curated
  demo claims:
  - **CLM-2001 / CLM-2003** — real knee/hip osteoarthritis patients with
    no documented conservative-therapy history, so the trajectory tool
    correctly reports zero evidence rather than a fabricated "almost
    enough" duration. CLM-2003's payer is set to
    `Medicare (CMS Local Coverage Determination)` to exactly match the
    real CMS policy data below, so it's the one claim that demonstrates a
    real Medicare policy match end-to-end.
  - **CLM-2002** — a real Warfarin + Ciprofloxacin overlap (`INT-3`).
  - **CLM-2004** — a real Warfarin (atrial fibrillation) + Aspirin
    (post-MI) overlap (`INT-4`) between two independently reasonable
    prescriptions.
  - **CLM-2005** — a real Lisinopril + Losartan dual RAAS-blockade
    combination (`INT-5`, severity `Moderate` — the set's first
    non-`Major`/`Contraindicated` pair).
  - Load with `python -m app.ingestion.ingest_synthea_samples` (after
    `load_sample_data`).
- `data/real_cms_lcd_policies.json` — two real, currently active Medicare
  LCDs: **L36575 "Total Knee Arthroplasty"** (CPT 27447) and **L34163
  "Total Hip Arthroplasty"** (CPT 27130), both adopted by Noridian
  Healthcare Solutions, LLC. Extracted from CMS's own bulk LCD database
  export via `extract_real_cms_lcds.py`, which takes the unzipped CSV
  directory as an argument, so pulling additional real LCDs is a config
  change (add the `lcd_id` to `TARGET_LCD_IDS`), not new plumbing. Load
  with `python -m app.ingestion.load_real_cms_policies`.
  - **Worth knowing:** unlike the hand-authored sample policy (which
    specifies "6 months of physical therapy"), the real Medicare LCD does
    *not* specify a fixed therapy duration — it requires only that
    "unsuccessful conservative therapy" be "clearly addressed in the
    pre-procedure medical record." `step_therapy_required` correctly
    computes to `False` for both real LCDs as a result — Medicare's
    national policy is genuinely less prescriptive here than commercial
    payer policy, not a bug.
  - ICD-10 codes are deliberately left blank on these two docs — that
    field isn't present in this CSV export (CMS ships it separately) —
    left empty rather than guessed.

## Known limitations

- **Policy matcher's payer-name filter is exact-match.** The two real
  Medicare policies are indexed with
  `payer_name: "Medicare (CMS Local Coverage Determination)"`; most
  sample claims use commercial payer names (UnitedHealthcare, Aetna,
  Cigna, Humana), so only claims using the exact Medicare payer name
  (CLM-2003) will match those two policies. Fixing this — normalizing
  payer names or relaxing the filter — is a known open item.
- **Bedrock model ID needs verifying per AWS account.** `BEDROCK_MODEL_ID`
  in `.env.example` is a best-effort default; Bedrock requires explicit
  per-model access approval (AWS Console → Bedrock → Model access) and
  exact model ID strings can differ by account/region. Confirm it works
  against a live Bedrock call before relying on it — the deterministic
  no-LLM fallback covers you if it doesn't.
- **Claim document storage is local disk**, not an object store — files
  uploaded via `POST /claims/{claim_id}/documents` are written under
  `backend/uploads/` (gitignored) and won't survive a redeploy. Swapping
  the local-disk write for an S3 `put_object` call is a contained change
  if needed (`attached_documents`'s shape doesn't need to change).
- **The embedding function is hashing-based, not a real transformer
  model** — dependency-light by design; see `embeddings/embed.py`'s
  docstring for the one-function swap path if a real model is available.
- **`eval/run_benchmark.py` is still a skeleton** — needs real test cases
  with known ground truth and real metric computation wired in; don't
  cite benchmark numbers that aren't produced by this script.
- **Elastic Agent Builder vs. the current hand-rolled Claude loop** is
  still undecided.
- **No Elastic webhook/email action wired up yet.**

## Quickstart — Docker (recommended)

Needs Docker Desktop. Runs the backend and frontend against the
Elasticsearch configured in `backend/.env`; missing indices are created
automatically.

```bash
cd src/mediaudit-x
cp backend/.env.example backend/.env   # then set ELASTIC_URL or ELASTIC_CLOUD_ID + ELASTIC_API_KEY
docker compose up --build              # first run; later runs: docker compose up
```

- UI: http://localhost:3000 · API docs: http://localhost:8000/docs
- Stop: `Ctrl+C`, or `docker compose down`
- Elasticsearch running on your Mac itself? Use
  `ELASTIC_URL=http://host.docker.internal:9200` in `backend/.env`
- Sample data loads only when `insurance-claims` is empty; set
  `SEED_SAMPLE_DATA=false` in `backend/.env` to skip it
- Port already in use? `BACKEND_PORT=8001 docker compose up` (also
  `FRONTEND_PORT`)
- Code in `backend/app` and `frontend/app` hot-reloads; rebuild with
  `--build` after changing `requirements.txt` or `package.json`

Where data goes:

| What | Where |
|---|---|
| Claims created by uploading documents | `claim-files` index |
| Manual and sample claims | `insurance-claims` index |
| Uploaded document details (doc_id, name, type, pages, size, sha256, path) | `claim-documents` index |
| Hash-chained history of every upload | `audit-ledger` index |
| The uploaded files themselves | `uploads` Docker volume (`/app/uploads/{claim_id}/{doc_id}.pdf`) |

## Quickstart — running locally without Docker

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # fill in Elastic + AWS/Anthropic credentials
```

### 2. Create indices

```bash
python -m app.indices.create_indices
```

### 3. Load sample data

```bash
python -m app.ingestion.load_sample_data
python -m app.ingestion.load_real_cms_policies
python -m app.ingestion.ingest_synthea_samples   # CLM-2001 through CLM-2005
```

All three backfill `notes_vector` / `policy_vector` with the real
embedding function before indexing.

### 4. Run the backend

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 5. Run the tests

```bash
cd backend && python -m pytest tests/ -v
```

Requires steps 2-3 to have run first against the same cluster.

### 6. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000 — click into a claim (e.g. CLM-1001) and run
adjudication to see the live agent reasoning stream, timeline, interaction
alert, and citation panel. Use "+ New Claim" to create and adjudicate a
new claim, optionally attaching supporting documents.

## Project layout

```
backend/app/
  routers/       FastAPI endpoints (claims, adjudication, patients)
  agent/          orchestrator.py — the agent loop
  tools/          trajectory / policy matcher / drug interaction / audit ledger
  actuators/      letter + FHIR ClaimResponse generation
  embeddings/     embed.py — vector embedding function
  ingestion/      one script per data source
  indices/        Elasticsearch index mappings
frontend/app/      Next.js dashboard, claim detail, new-claim form
data/               sample/ and synthea_samples/ fixture data
eval/               benchmark harness (skeleton)
```

See `data/sample/` for the fixture claim/patient (CLM-1001 / PAT-883910)
built to trigger both the step-therapy denial path and a drug interaction
alert.
