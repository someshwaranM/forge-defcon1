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
- Document upload moved to routers/intake.py (backed by
  app.pipeline.ingestion), which validates files before storing them and
  also serves POST /claims/{claim_id}/documents.
- Elasticsearch documents here are indexed without an explicit id, same
  as every ingestion script in this repo (see their `es.index(...)`
  calls) -- the app's own claim_id is the identity clients use; the
  ES-internal _id is an implementation detail this router looks up by
  searching on claim_id, same pattern list_claims/get_claim already use.
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.es_client import get_es_client
from app.pipeline.ingestion.models import CLAIM_ID_PATTERN

router = APIRouter(prefix="/claims", tags=["claims"])


class ClaimCreate(BaseModel):
    patient_id: str
    payer_name: str
    cpt_code: str
    icd10_code: str
    claim_amount: float = Field(gt=0)
    claim_type: str = "professional"
    # auto-generated if not supplied; restricted so it is safe as a
    # storage path segment for uploaded documents
    claim_id: str | None = Field(default=None, pattern=CLAIM_ID_PATTERN)


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
        "source": "manual",
        "attached_documents": [],
    }
    result = es.index(index="insurance-claims", document=doc)
    es.indices.refresh(index="insurance-claims")

    return {"id": result["_id"], **doc}
