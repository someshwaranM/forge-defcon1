"""
Claim intake endpoints.

BUILT LIVE (17 Sept): adds real claim creation + document upload on top of
the existing read-only CRUD. Before this, claims only entered the system
through the offline ingestion scripts (load_sample_data.py,
ingest_synthea_samples.py) -- there was no user-facing way to get a new
claim into insurance-claims. The frontend's "Upload Claim" quick action
pointed nowhere (labeled "coming soon", not wired to anything).

Design notes:
- POST /claims creates a real document in the insurance-claims index with
  status=PENDING, ready to be adjudicated through the existing
  POST /claims/{claim_id}/adjudicate flow -- no separate "upload" data
  path, this feeds the same pipeline everything else already uses.
- POST /claims/{claim_id}/documents accepts a real file upload (multipart)
  and stores it on local disk under UPLOAD_DIR, served back out through
  the /files static mount added in main.py. This is deliberately NOT S3
  or any object store -- there isn't one wired into this stack -- so
  don't rely on this surviving a redeploy; swap UPLOAD_DIR's local-disk
  write for an S3 client call in ingest-a-real-object-store work later,
  the interface (doc_id/doc_type/source_uri appended to
  attached_documents) doesn't need to change.
- Elasticsearch documents here are indexed without an explicit id, same
  as every ingestion script in this repo (see their `es.index(...)`
  calls) -- the app's own claim_id is the identity clients use; the
  ES-internal _id is an implementation detail this router looks up by
  searching on claim_id, same pattern list_claims/get_claim already use.
"""
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.es_client import get_es_client

router = APIRouter(prefix="/claims", tags=["claims"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
_SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


class ClaimCreate(BaseModel):
    patient_id: str
    payer_name: str
    cpt_code: str
    icd10_code: str
    claim_amount: float = Field(gt=0)
    claim_type: str = "professional"
    claim_id: str | None = None  # auto-generated if not supplied


def _find_claim(es, claim_id: str) -> dict:
    """Returns the raw ES hit ({"_id": ..., "_source": {...}}) or raises 404."""
    result = es.search(
        index="insurance-claims",
        query={"term": {"claim_id": claim_id}},
        size=1,
    )
    hits = result["hits"]["hits"]
    if not hits:
        raise HTTPException(status_code=404, detail="Claim not found")
    return hits[0]


@router.get("")
def list_claims(limit: int = 20):
    es = get_es_client()
    result = es.search(index="insurance-claims", query={"match_all": {}}, size=limit)
    return [
        {"id": hit["_id"], **hit["_source"]} for hit in result["hits"]["hits"]
    ]


@router.get("/{claim_id}")
def get_claim(claim_id: str):
    es = get_es_client()
    hit = _find_claim(es, claim_id)
    return {"id": hit["_id"], **hit["_source"]}


@router.get("/{claim_id}/adjudications")
def get_latest_adjudication(claim_id: str):
    """
    ADDED (18 Sept): the frontend previously only ever saw an adjudication
    result via the live SSE stream from POST /{claim_id}/adjudicate,
    stored in React state -- nothing persisted it for a page reload or a
    later visit, so a claim that was adjudicated an hour ago looked
    exactly like one that was never touched. This returns the most recent
    adjudication-results document for the claim (or 404 if none exists
    yet) so the frontend can pre-populate the Overview/Adjudication/Audit
    Trail tabs on load instead of showing them permanently blank after a
    refresh. Shape matches the "done" SSE event's data exactly, so the
    same frontend rendering code works for both a live run and a
    page-load restore.
    """
    es = get_es_client()
    result = es.search(
        index="adjudication-results",
        query={"term": {"claim_id": claim_id}},
        sort=[{"decided_at": "desc"}],
        size=1,
    )
    hits = result["hits"]["hits"]
    if not hits:
        raise HTTPException(status_code=404, detail="No adjudication has been run for this claim yet")
    doc = hits[0]["_source"]

    ledger_result = es.search(
        index="audit-ledger",
        query={"term": {"adjudication_id": doc.get("adjudication_id")}},
        size=1,
    )
    ledger_hits = ledger_result["hits"]["hits"]
    ledger_entry = ledger_hits[0]["_source"] if ledger_hits else None

    return {
        "status": doc.get("status"),
        "adjudication_id": doc.get("adjudication_id"),
        "cited_evidence": doc.get("cited_evidence", []),
        "generated_letter": doc.get("generated_letter"),
        "ledger_entry": ledger_entry,
        "decided_at": doc.get("decided_at"),
        "matched_policy": doc.get("matched_policy"),
        "trajectory_result": doc.get("trajectory_result"),
    }


@router.post("", status_code=201)
def create_claim(claim: ClaimCreate):
    es = get_es_client()

    claim_id = claim.claim_id or f"CLM-{uuid.uuid4().hex[:8].upper()}"

    existing = es.search(
        index="insurance-claims",
        query={"term": {"claim_id": claim_id}},
        size=1,
    )
    if existing["hits"]["hits"]:
        raise HTTPException(status_code=409, detail=f"Claim {claim_id} already exists")

    doc = {
        "claim_id": claim_id,
        "patient_id": claim.patient_id,
        "payer_name": claim.payer_name,
        "cpt_code": claim.cpt_code,
        "icd10_code": claim.icd10_code,
        "claim_amount": claim.claim_amount,
        "claim_type": claim.claim_type,
        "submitted_date": datetime.now(timezone.utc).isoformat(),
        "status": "PENDING",
        "attached_documents": [],
    }
    result = es.index(index="insurance-claims", document=doc)
    es.indices.refresh(index="insurance-claims")

    return {"id": result["_id"], **doc}


@router.post("/{claim_id}/documents", status_code=201)
async def upload_claim_document(
    claim_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("supporting_document"),
):
    es = get_es_client()
    hit = _find_claim(es, claim_id)
    es_id, source = hit["_id"], hit["_source"]

    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    safe_name = _SAFE_FILENAME_RE.sub("_", file.filename or "upload.bin")

    claim_dir = UPLOAD_DIR / claim_id
    claim_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{doc_id}_{safe_name}"
    dest_path = claim_dir / stored_name

    contents = await file.read()
    dest_path.write_bytes(contents)

    source_uri = f"/files/{claim_id}/{stored_name}"
    attachment = {"doc_id": doc_id, "doc_type": doc_type, "source_uri": source_uri}
    source.setdefault("attached_documents", []).append(attachment)

    es.index(index="insurance-claims", id=es_id, document=source)
    es.indices.refresh(index="insurance-claims")

    return {"doc_id": doc_id, "source_uri": source_uri, "claim": {"id": es_id, **source}}
