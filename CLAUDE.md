# CLAUDE.md — MediAudit-X

This file is read automatically by Claude Code (and other Claude-based tools) when working in this repo. It's project memory for the team, not user-facing documentation — see `README.md` for that.

## What this project is

Zero-hallucination clinical claims auditor for **Forge the Future Hackathon 2026** (Elastic × AWS × Sarvam), 18–19 Sept, Bengaluru. Tagline: "Claims you can cite, not just trust." Every adjudication decision must be grounded in real Elasticsearch search results (BM25 + vector + RRF hybrid search, ES|QL temporal queries) and cited back to source, never left to LLM inference alone.

Full project context, judging rubric, and build history: see this project's `MediAudit-X_Context_Summary.md` doc (ask whoever has access to the Claude project, or check with the team lead).

## Important: disclosure rule — read before committing anything

The hackathon's build spec expects feature logic to be built live on 18–19 Sept, with only infrastructure pre-built. The team made an explicit decision to build real feature logic ahead of the event and **disclose that clearly** rather than hide it — this is why the first commit is large and labeled "pre-event build" instead of many small "live" commits. If you're adding new pre-built logic before/during a judging checkpoint, keep following this pattern: commit it honestly, don't retroactively make it look like it happened live.

## Golden rule: no fabricated data

This repo has a hard-won habit of catching and rejecting hallucinated specifics — RXCUI drug codes that were initially hand-typed wrong, benchmark numbers that were originally illustrative rather than real, an interaction "finding" that turned out to be a keyword false-positive (drug names containing the word "potassium" being misread as potassium-sparing agents). **Any drug code, policy citation, FDA warning text, or benchmark number must be verifiable against a real source** — RxNav, openFDA, the CMS LCD database, or an actual test run — not generated from memory. If you can't verify something live, say so explicitly in a `_source_note` / comment rather than presenting it as verified. Judges are expected to probe every claim in Q&A.

## Architecture (backend/app/)

- `routers/` — FastAPI endpoints. `claims.py` (create/list/get claim, document upload), `adjudication.py` (the SSE-streaming adjudicate endpoint), `patients.py`.
- `agent/orchestrator.py` — the core agent loop. `_make_llm_client()` picks Anthropic direct API or AWS Bedrock based on `LLM_PROVIDER` in `.env` (Bedrock is default). Multi-round Claude tool-use loop streams reasoning over SSE, calls the three tools below, then **`_decide()`** — a fixed deterministic function, not the LLM — turns tool results into APPROVED/DENIED/REQUEST_INFO. `_deterministic_tool_sweep()` is a no-LLM fallback that runs all three tools in fixed order if the LLM call fails for any reason.
- `tools/` — `trajectory_tool.py` (ES|QL bi-temporal query for step-therapy history, with a DSL aggregation fallback), `policy_matcher_tool.py` (RRF hybrid BM25+vector search over `medical-policies`, filtered by exact `payer_name` term — see Known gap below), `drug_interaction_tool.py` (RxNorm brand/generic resolution against `fda-drug-interactions`), `audit_ledger.py` (SHA-256 hash-chained tamper-evidence writes).
- `actuators/letter_generator.py` — template-based (not LLM-freeform) decision letter + FHIR `ClaimResponse`, built only from cited tool results.
- `embeddings/embed.py` — hashing-based 768-dim embedding (dependency-light placeholder, not a real transformer model — see its docstring for the one-function swap path if venue wifi allows a real model).
- `ingestion/` — one script per data source. Run order: `create_indices.py` → `load_sample_data.py` → `load_real_cms_policies.py` → `ingest_synthea_samples.py`. `extract_real_cms_lcds.py` is a standalone CLI, not run at load time — see Data below.
- `indices/mappings/*.json` — the six Elasticsearch index mappings (source of truth for schema; also summarized in the Claude Docs "MediAudit-X Database Schema" doc if you have project access).

Frontend (`frontend/app/`): Next.js 15, Tailwind. Home/Claims/Claim Detail (5 tabs)/New Claim are real and wired to the backend. Patient Timeline/Policy Lookup/Audit Trail/Reports/Settings are honest stub pages — don't present them as functional in a demo.

## Data — what's real vs. hand-built

- `data/sample/` — hand-built fixtures (2 policies, 2 drug interaction pairs with verified real RXCUI codes, sample claims/encounters). Used for baseline coverage.
- `data/synthea_samples/` — real Synthea-generated patient data (197-patient MA batch, seed 42). **5 curated demo claims** (CLM-2001 through CLM-2005) pulled from real generated patients, not invented — each file's `_source_note` explains exactly what's real and what's authored on top. CLM-2003 is the one claim whose `payer_name` is set to match the real CMS policy exactly (see Known gap below).
- `data/real_cms_lcd_policies.json` — two real, currently-active Medicare LCDs (L36575 knee, L34163 hip), extracted from CMS's own bulk CSV export via `extract_real_cms_lcds.py`. Loaded with `payer_name: "Medicare (CMS Local Coverage Determination)"`.

**Known gap:** `policy_matcher_tool.py` filters on an *exact* `payer_name` term match. The two real Medicare policies use `"Medicare (CMS Local Coverage Determination)"`; every claim except CLM-2003 uses a commercial payer name (UnitedHealthcare, Aetna, Cigna, Humana) — so only CLM-2003 will actually match a real policy through this tool. This is a known, flagged limitation, not a bug to silently work around before mentioning it to the team.

## Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real Elasticsearch Cloud endpoint/API key + AWS creds
python -m app.indices.create_indices
python -m app.ingestion.load_sample_data
python -m app.ingestion.load_real_cms_policies
python -m app.ingestion.ingest_synthea_samples
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/docs

cd ../frontend
npm install
npm run dev   # http://localhost:3000
```

Tests: `cd backend && pytest` (runs against real Elasticsearch, not mocked — needs a live `.env`).

## Known environment gotchas

- **`.env.example` must never contain a real secret.** One was accidentally committed as a live-looking Anthropic key before the first push and had to be fixed — double check before every commit that touches `.env.example`.
- **AWS Bedrock model ID is unverified.** `BEDROCK_MODEL_ID` in `.env.example` is a best-effort default — Bedrock requires per-model access approval per AWS account/region (Console → Bedrock → Model access). Confirm it against the team's real account before depending on it live; the deterministic no-LLM fallback covers you if it's wrong.
- **Direct RxNorm/openFDA/CMS API access may be blocked** depending on your network (sandboxed dev environments and some proxied networks hit this). If `curl`/`requests` to `rxnav.nlm.nih.gov`, `api.fda.gov`, or `cms.gov` fail outright, that's a known pattern — verify codes/citations through an actual browser instead rather than skipping verification.
- **`git index.lock` / permission errors on some sandboxed setups.** If git operations fail with "Operation not permitted" on `.git/objects/*` or `.git/index.lock`, it's a delete-permission issue in that environment, not a corrupted repo — don't `rm -rf .git`.

## Current status (updated 18 Sept)

Real, working: all three adjudication tools, the agent loop (Bedrock + Anthropic fallback + deterministic no-LLM fallback), the audit ledger, claim intake/upload (backend confirmed working against a live cluster — see `backend/uploads/` for a real test upload), the 5-claim Synthea dataset, the 2 real CMS Medicare policies.

Not yet done — see the project's Open Items list for the full picture, but the two the rubric calls out by name are: **Elastic Agent Builder** (still using a hand-rolled Claude loop, not decided whether/how to route through Agent Builder) and **a real Elastic webhook/email action** (not started). `eval/run_benchmark.py` is still a skeleton needing 15–30 real test cases with real metrics — don't cite benchmark numbers that aren't computed by this script.
