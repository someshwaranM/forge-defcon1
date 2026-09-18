"""
Regression tests against the realistic fixtures in
data/sample/documents/ (see manifest.json there for what's real vs
fabricated in each file) -- a clinical note and a hospital bill, each as a
real-text PDF, a rendered image, and an image-only ("scanned") PDF.

Unlike tests/test_ocr.py (synthetic/minimal inputs), these exercise the
full pdf_text -> Tesseract fallback chain against documents shaped like the
real thing: multi-section clinical notes and a tabular billing statement.

The Tesseract-dependent cases are skipped, not failed, when the tesseract
binary isn't installed on the machine running the tests -- consistent with
extract.py's own "degrade to FAILED, don't fabricate" rule; this file just
avoids treating an environment gap as a code regression.
"""
import shutil
from pathlib import Path

import pytest

from app.ocr.pipeline import run_ocr

DOCS_DIR = Path(__file__).parent.parent.parent / "data" / "sample" / "documents"

TESSERACT_AVAILABLE = shutil.which("tesseract") is not None

CLINICAL_NOTE_MARKERS = [
    "chronic lower back pain",
    "L4-L5",
    "Gabapentin",
    "62323",
    "M51.36",
]

HOSPITAL_BILL_MARKERS = [
    "99213",
    "62323",
    "72100",
    "875.00",
]


def _assert_offset_invariant(result: dict):
    pages_by_number = {p["page_number"]: p["text"] for p in result["pages"]}
    for chunk in result["chunks"]:
        page_text = pages_by_number[chunk["page_number"]]
        assert page_text[chunk["char_start"]:chunk["char_end"]] == chunk["text"]


@pytest.mark.skipif(not DOCS_DIR.exists(), reason="fixtures not present")
def test_clinical_note_pdf_text_layer_extracts_key_facts():
    result = run_ocr(DOCS_DIR / "clinical_note.pdf", doc_id="DOC-CN-PDF", claim_id="CLM-FIX")
    assert result["ocr_status"] == "DONE"
    assert result["pages"][0]["engine"] == "pdf_text"
    full_text = result["pages"][0]["text"]
    for marker in CLINICAL_NOTE_MARKERS:
        assert marker in full_text
    _assert_offset_invariant(result)


@pytest.mark.skipif(not DOCS_DIR.exists(), reason="fixtures not present")
def test_hospital_bill_pdf_text_layer_extracts_line_items():
    result = run_ocr(DOCS_DIR / "hospital_bill.pdf", doc_id="DOC-HB-PDF", claim_id="CLM-FIX")
    assert result["ocr_status"] == "DONE"
    assert result["pages"][0]["engine"] == "pdf_text"
    full_text = result["pages"][0]["text"]
    for marker in HOSPITAL_BILL_MARKERS:
        assert marker in full_text
    _assert_offset_invariant(result)


@pytest.mark.skipif(not DOCS_DIR.exists(), reason="fixtures not present")
@pytest.mark.skipif(not TESSERACT_AVAILABLE, reason="tesseract binary not installed")
def test_clinical_note_image_ocr_extracts_key_facts():
    result = run_ocr(DOCS_DIR / "clinical_note.png", doc_id="DOC-CN-IMG", claim_id="CLM-FIX")
    assert result["ocr_status"] == "DONE"
    assert result["pages"][0]["engine"] == "tesseract"
    assert result["pages"][0]["ocr_confidence"] > 50
    full_text = result["pages"][0]["text"]
    # Real-OCR text, not exact -- assert on the markers unaffected by the
    # known digit/'@' misread rather than full-string equality.
    for marker in ["chronic lower back pain", "L4-L5", "Gabapentin", "62323"]:
        assert marker in full_text
    _assert_offset_invariant(result)


@pytest.mark.skipif(not DOCS_DIR.exists(), reason="fixtures not present")
@pytest.mark.skipif(not TESSERACT_AVAILABLE, reason="tesseract binary not installed")
def test_scanned_pdf_falls_back_to_tesseract_within_pdf():
    """The image-only PDF has no text layer at all -- extract.py must
    detect that inside pdfplumber and route the rendered page to
    Tesseract, the same path a real scanned upload would take."""
    result = run_ocr(
        DOCS_DIR / "scanned_clinical_note.pdf", doc_id="DOC-CN-SCAN", claim_id="CLM-FIX")
    assert result["ocr_status"] == "DONE"
    assert result["pages"][0]["engine"] == "tesseract"
    full_text = result["pages"][0]["text"]
    for marker in ["chronic lower back pain", "Gabapentin"]:
        assert marker in full_text
    _assert_offset_invariant(result)


@pytest.mark.skipif(not DOCS_DIR.exists(), reason="fixtures not present")
def test_image_without_tesseract_never_fabricates_text(monkeypatch):
    """Simulates a machine with no OCR provider configured: must degrade to
    FAILED/empty text, never invent plausible-looking content."""
    import app.ocr.extract as extract_module
    monkeypatch.setattr(extract_module.settings, "ocr_provider", "none")

    result = run_ocr(DOCS_DIR / "clinical_note.png", doc_id="DOC-CN-NOOCR", claim_id="CLM-FIX")
    assert result["ocr_status"] == "FAILED"
    assert result["pages"][0]["engine"] == "failed"
    assert result["pages"][0]["text"] == ""
