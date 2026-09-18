"""
Loads the small hand-built fixture set from data/sample/ into Elasticsearch.
Useful for testing queries end-to-end before you have real Synthea output.

BUILT LIVE (18 Sept): now backfills notes_vector / policy_vector via the
real embed_text() before indexing, since the tools no longer accept an
all-zero placeholder vector as meaningful input.

Run with: python -m app.ingestion.load_sample_data
"""
import json
from pathlib import Path

from app.es_client import get_es_client
from app.embeddings.embed import embed_text

SAMPLE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "sample"

FILE_TO_INDEX = {
    "sample_claims.json": "insurance-claims",
    "sample_fhir_encounters.json": "fhir-clinical-ehr",
    "sample_policies.json": "medical-policies",
    "sample_drug_interactions.json": "fda-drug-interactions",
}


def _backfill_vector(index: str, doc: dict) -> dict:
    if index == "fhir-clinical-ehr":
        text = " ".join(filter(None, [doc.get("code_display"), doc.get("clinician_notes")]))
        vector = embed_text(text)
        # dot_product fields reject the all-zero vector embed_text returns
        # for empty text; leave the field out for those docs instead.
        if any(vector):
            doc["notes_vector"] = vector
    elif index == "medical-policies":
        text = " ".join(filter(None, [
            doc.get("title"), doc.get("clinical_indications"), doc.get("contraindications"),
        ]))
        doc["policy_vector"] = embed_text(text)
    return doc


def load_all():
    es = get_es_client()
    for filename, index in FILE_TO_INDEX.items():
        path = SAMPLE_DIR / filename
        if not path.exists():
            print(f"[skip] {filename} not found")
            continue
        docs = json.loads(path.read_text())
        for doc in docs:
            doc = _backfill_vector(index, doc)
            es.index(index=index, document=doc)
        print(f"[loaded] {len(docs)} docs -> {index}")
    es.indices.refresh(index=",".join(FILE_TO_INDEX.values()))
    print("[refreshed] all indices — data is immediately searchable")


if __name__ == "__main__":
    load_all()
