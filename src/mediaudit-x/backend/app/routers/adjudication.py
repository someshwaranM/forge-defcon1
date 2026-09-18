"""
Adjudication endpoint — wired to the real agent orchestrator.

BUILT LIVE (18 Sept): replaces the placeholder event stream with the real
multi-step loop in app.agent.orchestrator. Each yielded (event, data) pair
from the orchestrator becomes one SSE event; the frontend distinguishes
"reasoning_step" / "interaction_alert" / "done" event names exactly as
specified in the build spec's API reference.

Every stream ends in either "done" or "error" -- never silently. Before the
orchestrator runs, _adjudication_blocker() refuses claims that aren't ready:
  - a DRAFT (or any non-adjudicable) status: codes haven't been extracted
    and signed off by a coder yet, so there is nothing to evaluate;
  - a claim a human reviewer has already decided (latest_review set):
    re-running would overwrite the reviewer's status with the agent's;
  - a missing patient_id / payer_name / cpt_code / icd10_code: every tool
    filters on these, and Elasticsearch rejects a term query on null.
An AI-only decision (APPROVED/DENIED/REQUEST_INFO with no human review)
can still be re-run, which the seeded demo claims and scripts/e2e_check.py
rely on.
"""
import json
import logging

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.es_client import get_es_client
from app.indices.names import ALL_CLAIMS
from app.agent.orchestrator import adjudicate_claim

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/claims", tags=["adjudication"])

# PENDING = coded and signed off. The others are prior agent decisions,
# re-runnable only while no human reviewer has decided (see below).
ADJUDICABLE_STATUSES = frozenset({"PENDING", "APPROVED", "DENIED", "REQUEST_INFO"})

REQUIRED_FIELDS = {
    "patient_id": "patient ID",
    "payer_name": "payer / insurance company",
    "cpt_code": "CPT procedure code",
    "icd10_code": "ICD-10 diagnosis code",
}


def _load_claim(claim_id: str) -> dict:
    es = get_es_client()
    result = es.search(
        index=ALL_CLAIMS,
        query={"term": {"claim_id": claim_id}},
        size=1,
        ignore_unavailable=True,
    )
    hits = result["hits"]["hits"]
    if not hits:
        raise HTTPException(status_code=404, detail="Claim not found")
    return hits[0]["_source"]


def _adjudication_blocker(claim: dict) -> dict | None:
    """Returns an error payload ({detail, code, ...}) if this claim can't be
    adjudicated yet, or None if it can."""
    status = claim.get("status")
    review = claim.get("latest_review")
    if review:
        return {
            "code": "already_reviewed",
            "detail": (
                f"Claim was already decided by a human reviewer "
                f"({review.get('reviewer_name', 'reviewer')}: {review.get('status', status)}). "
                "Re-running the AI analysis would overwrite that decision."
            ),
            "status": status,
        }
    if status not in ADJUDICABLE_STATUSES:
        return {
            "code": "claim_not_ready",
            "detail": (
                f"Claim is {status or 'missing a status'}; only a coded, signed-off claim (PENDING) can be "
                "adjudicated. Its codes must be extracted from the documents and confirmed by a coder first."
            ),
            "status": status,
        }
    missing = [label for field, label in REQUIRED_FIELDS.items() if not str(claim.get(field) or "").strip()]
    if missing:
        return {
            "code": "missing_fields",
            "detail": f"Claim can't be adjudicated without: {', '.join(missing)}.",
            "missing": missing,
            "status": status,
        }
    return None


async def _event_stream(claim_id: str):
    try:
        claim = _load_claim(claim_id)
    except HTTPException as e:
        yield {"event": "error", "data": json.dumps({"detail": e.detail, "code": "claim_not_found"})}
        return

    blocker = _adjudication_blocker(claim)
    if blocker:
        yield {"event": "error", "data": json.dumps(blocker)}
        return

    try:
        async for event_name, data in adjudicate_claim(claim):
            yield {"event": event_name, "data": json.dumps(data, default=str)}
    except Exception as e:  # noqa: BLE001 - surface to the client instead of dropping the stream
        logger.exception("Adjudication failed for claim %s", claim_id)
        yield {"event": "error", "data": json.dumps({
            "detail": f"Adjudication failed: {e}", "code": "adjudication_failed",
        })}


@router.post("/{claim_id}/adjudicate")
async def adjudicate(claim_id: str):
    return EventSourceResponse(_event_stream(claim_id))
