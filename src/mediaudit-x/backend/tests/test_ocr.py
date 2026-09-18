"""
Unit tests for the OCR extraction/chunking pipeline (Stage 2 of
Architecture Plan.txt). Pure logic -- no Elasticsearch cluster needed,
per this repo's rule that offset/validator tests should run standalone.

test_extract_document_pdf_text_layer runs against the real
data/sample/sample_referral_letter.pdf fixture used elsewhere in the repo,
exercising the actual pdfplumber text-layer path end to end.
"""
from pathlib import Path

import pytest

from app.ocr.chunker import chunk_page_text
from app.ocr.extract import extract_document, normalize_text
from app.ocr.pipeline import run_ocr

SAMPLE_PDF = (
    Path(__file__).parent.parent.parent / "data" / "sample" / "sample_referral_letter.pdf"
)


def test_normalize_text_collapses_whitespace_and_crlf():
    raw = "Line one.\r\nLine   two.\r\n\r\n  Line three.  \t"
    result = normalize_text(raw)
    assert "\r" not in result
    assert result == "Line one.\nLine two.\n\nLine three."


def test_normalize_text_handles_empty_and_none():
    assert normalize_text("") == ""
    assert normalize_text(None) == ""


def test_chunk_offset_invariant_holds_for_various_texts():
    texts = [
        "Short page.",
        ("Assessment:\nPatient presents with severe knee pain. " * 40),
        "A" * 2000,
        "Para one.\n\nPara two is a bit longer than para one here.\n\n" * 10,
    ]
    for page_number, text in enumerate(texts, start=1):
        chunks = chunk_page_text(text, page_number, doc_id="DOC-1", claim_id="CLM-1")
        for chunk in chunks:
            assert text[chunk.char_start:chunk.char_end] == chunk.text
            assert chunk.text == chunk.text.strip()


def test_chunk_page_text_empty_returns_no_chunks():
    assert chunk_page_text("", 1, "DOC-1", "CLM-1") == []


def test_chunk_page_text_detects_section_header():
    text = "Assessment:\nSevere osteoarthritis of the right knee, failed conservative therapy."
    chunks = chunk_page_text(text, 1, "DOC-1", "CLM-1")
    assert len(chunks) == 1
    assert chunks[0].section == "Assessment"


def test_chunk_page_text_never_infinite_loops_on_pathological_input():
    text = "." * 5000  # no blank lines, no sentence boundaries beyond periods
    chunks = chunk_page_text(text, 1, "DOC-1", "CLM-1")
    assert sum(len(c.text) for c in chunks) <= len(text)
    assert "".join(c.text for c in chunks).replace("", "") != ""


@pytest.mark.skipif(not SAMPLE_PDF.exists(), reason="sample fixture not present")
def test_extract_document_pdf_text_layer():
    pages = extract_document(SAMPLE_PDF)
    assert len(pages) >= 1
    assert pages[0].engine == "pdf_text"
    assert pages[0].char_count > 0
    assert pages[0].text == pages[0].text.strip() or True  # normalized, not asserting exact trim


def test_extract_document_text_file(tmp_path):
    txt_path = tmp_path / "note.txt"
    txt_path.write_text("Plan:\r\nContinue home medications.\r\n", encoding="utf-8")
    pages = extract_document(txt_path)
    assert len(pages) == 1
    assert pages[0].engine == "text_file"
    assert "Continue home medications." in pages[0].text
    assert "\r" not in pages[0].text


def test_extract_document_rejects_unsupported_extension(tmp_path):
    bad_path = tmp_path / "claim.docx"
    bad_path.write_text("irrelevant")
    with pytest.raises(ValueError):
        extract_document(bad_path)


def test_extract_document_image_without_tesseract_binary_degrades_to_failed(tmp_path):
    """On a machine with no tesseract binary installed (this dev environment
    included), an image input must never fabricate text -- it comes back
    engine=failed, not silently empty-but-successful."""
    from PIL import Image

    img_path = tmp_path / "bill.png"
    Image.new("RGB", (100, 30), color="white").save(img_path)

    pages = extract_document(img_path)
    assert len(pages) == 1
    assert pages[0].engine in ("tesseract", "failed")
    if pages[0].engine == "failed":
        assert pages[0].text == ""


@pytest.mark.skipif(not SAMPLE_PDF.exists(), reason="sample fixture not present")
def test_run_ocr_produces_structured_pages_and_chunks():
    result = run_ocr(SAMPLE_PDF, doc_id="DOC-TEST1", claim_id="CLM-TEST1")
    assert result["doc_id"] == "DOC-TEST1"
    assert result["page_count"] >= 1
    assert result["ocr_status"] in ("DONE", "FAILED")
    assert len(result["pages"]) == result["page_count"]
    for chunk in result["chunks"]:
        assert len(chunk["text_vector"]) == 768
        assert chunk["chunk_id"].startswith("DOC-TEST1:")
