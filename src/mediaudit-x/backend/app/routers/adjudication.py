"""
Adjudication endpoint — wired to the real agent orchestrator.

BUILT LIVE (18 Sept): replaces the placeholder event stream with the real
multi-step loop in app.agent.orchestrator. Each yielded (event, data) pair
from the orchestrator becomes one SSE event; the frontend distinguishes
"reasoning_step" / "interaction_alert" / "done" event names exactly as
specified in the build spec's API reference.
"""
import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.es_client import get_es_client
from app.agent.orchestrator import adjudicate_claim

router = APIRouter(prefix="/claims", tags=["adjudication"])


def _load_claim(claim_id: str) -> dict:
    es = get_es_client()
    result = es.search(
        index="insurance-claims",
        query={"term": {"claim_id": claim_id}},
        size=1,
    )
    hits = result["hits"]["hits"]
    if not hits:
        raise HTTPException(status_code=404, detail="Claim not found")
    return hits[0]["_source"]


async def _event_stream(claim_id: str):
    try:
        claim = _load_claim(claim_id)
    except HTTPException as e:
        yield {"event": "error", "data": json.dumps({"detail": e.detail})}
        return

    async for event_name, data in adjudicate_claim(claim):
        yield {"event": event_name, "data": json.dumps(data, default=str)}


@router.post("/{claim_id}/adjudicate")
async def adjudicate(claim_id: str):
    return EventSourceResponse(_event_stream(claim_id))
