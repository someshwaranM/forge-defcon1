"""
Top-level OCR entry point: a file on disk -> normalized page text -> search
chunks with embeddings, structured for the next pipeline stage (candidate
generation) to consume, or for indexing into document-pages /
document-chunks.

Deliberately pure (no Elasticsearch calls, no ledger writes): whichever
router eventually calls this controls persistence, retries, and the
OCR_COMPLETED ledger event. This module only produces the result.
"""
from pathlib import Path

from app.embeddings.embed import embed_text
from app.ocr.chunker import chunk_page_text
from app.ocr.extract import extract_document


def run_ocr(path: Path, doc_id: str, claim_id: str) -> dict:
    pages = extract_document(path)

    page_docs = []
    chunk_docs = []
    for page in pages:
        page_docs.append({
            "page_id": f"{doc_id}:p{page.page_number}",
            "doc_id": doc_id,
            "claim_id": claim_id,
            "page_number": page.page_number,
            "text": page.text,
            "engine": page.engine,
            "ocr_confidence": page.ocr_confidence,
            "char_count": page.char_count,
        })

        for chunk in chunk_page_text(page.text, page.page_number, doc_id, claim_id):
            chunk_docs.append({
                "chunk_id": chunk.chunk_id,
                "doc_id": chunk.doc_id,
                "claim_id": chunk.claim_id,
                "page_number": chunk.page_number,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
                "text": chunk.text,
                "section": chunk.section,
                "text_vector": embed_text(chunk.text),
            })

    ocr_status = "FAILED" if all(p.engine == "failed" for p in pages) else "DONE"

    return {
        "doc_id": doc_id,
        "claim_id": claim_id,
        "page_count": len(pages),
        "ocr_status": ocr_status,
        "pages": page_docs,
        "chunks": chunk_docs,
    }
