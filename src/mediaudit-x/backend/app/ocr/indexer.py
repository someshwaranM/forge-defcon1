"""
Writes OCR pipeline output (pipeline.run_ocr's result dict) into the
document-pages and document-chunks indices.

Indexed with an explicit _id (page_id / chunk_id) rather than letting
Elasticsearch generate one, so re-running OCR on the same document (e.g.
a re-upload after REQUEST_INFO) overwrites the same records instead of
accumulating duplicates.
"""
from elasticsearch import Elasticsearch

from app.es_client import get_es_client


def index_ocr_result(result: dict, es: Elasticsearch | None = None) -> dict:
    es = es or get_es_client()

    for page in result["pages"]:
        es.index(index="document-pages", id=page["page_id"], document=page)

    for chunk in result["chunks"]:
        es.index(index="document-chunks", id=chunk["chunk_id"], document=chunk)

    es.indices.refresh(index="document-pages")
    es.indices.refresh(index="document-chunks")

    return {
        "doc_id": result["doc_id"],
        "claim_id": result["claim_id"],
        "pages_indexed": len(result["pages"]),
        "chunks_indexed": len(result["chunks"]),
        "ocr_status": result["ocr_status"],
    }
