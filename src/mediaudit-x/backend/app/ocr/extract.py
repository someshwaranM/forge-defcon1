"""
OCR extraction: turns an uploaded document (PDF, image, or plain text) into
per-page text, tagged with which engine produced it.

Engine order per page, in keeping with this repo's zero-hallucination rule
(never invent text that isn't really on the page):

  1. A PDF's embedded text layer via pdfplumber -- exact, free, no OCR
     needed. Used whenever a page yields at least MIN_TEXT_CHARS.
  2. Tesseract OCR (via pytesseract) for scanned PDF pages and image files
     with no usable text layer.
  3. If Tesseract's binary isn't installed, or OCR still yields nothing,
     the page is marked engine="failed" with empty text rather than
     guessed content -- the pipeline continues, just with less to draft
     from on that page.

Tesseract note: pytesseract is only a wrapper that shells out to the
`tesseract` binary, which is a separate OS-level install (not pip). If it
isn't on PATH, set `tesseract_cmd` in .env. See backend/README for the
per-OS install step.
"""
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

import pdfplumber

from app.config import settings

MIN_TEXT_CHARS = 20  # below this, a PDF page is treated as scanned/image-only

PDF_EXTENSIONS = {".pdf"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}
TEXT_EXTENSIONS = {".txt"}

_WS_RUN_RE = re.compile(r"[ \t]+")


@dataclass
class PageResult:
    page_number: int  # 1-based
    text: str
    engine: str  # "pdf_text" | "tesseract" | "text_file" | "failed"
    ocr_confidence: float | None  # Tesseract mean word confidence (0-100)
    char_count: int = field(init=False)

    def __post_init__(self):
        self.char_count = len(self.text)


def normalize_text(text: str) -> str:
    """NFC unicode, CRLF/CR -> LF, collapse horizontal whitespace runs to a
    single space. Line breaks are preserved. Do this exactly once per page:
    every downstream offset (chunking, spans) is computed against this
    normalized text and must never be recomputed against a re-normalized
    copy later."""
    text = unicodedata.normalize("NFC", text or "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [_WS_RUN_RE.sub(" ", line).strip() for line in text.split("\n")]
    return "\n".join(lines)


def _ocr_image_via_tesseract(image) -> tuple[str, float | None] | None:
    """Returns (text, mean_confidence), or None if Tesseract itself is
    unavailable (package not installed or binary missing) -- distinct from
    a successful run that just found no text."""
    try:
        import pytesseract
    except ImportError:
        return None

    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

    try:
        text = pytesseract.image_to_string(image)
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    except pytesseract.TesseractNotFoundError:
        return None

    confidences = [float(c) for c in data["conf"] if str(c) not in ("-1", "")]
    mean_conf = round(sum(confidences) / len(confidences), 1) if confidences else None
    return text, mean_conf


def _extract_pdf(path: Path) -> list[PageResult]:
    try:
        pdf = pdfplumber.open(path)
    except Exception:
        return [PageResult(1, "", "failed", None)]

    pages: list[PageResult] = []
    with pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = normalize_text(page.extract_text() or "")
            if len(text.strip()) >= MIN_TEXT_CHARS:
                pages.append(PageResult(i, text, "pdf_text", None))
                continue

            ocr_result = None
            if settings.ocr_provider == "tesseract":
                image = page.to_image(resolution=200).original
                ocr_result = _ocr_image_via_tesseract(image)

            if ocr_result is None:
                pages.append(PageResult(i, "", "failed", None))
            else:
                ocr_text, confidence = ocr_result
                pages.append(PageResult(i, normalize_text(ocr_text), "tesseract", confidence))
    return pages


def _extract_image(path: Path) -> list[PageResult]:
    if settings.ocr_provider != "tesseract":
        return [PageResult(1, "", "failed", None)]

    try:
        from PIL import Image
        image = Image.open(path)
    except Exception:
        return [PageResult(1, "", "failed", None)]

    ocr_result = _ocr_image_via_tesseract(image)
    if ocr_result is None:
        return [PageResult(1, "", "failed", None)]
    text, confidence = ocr_result
    return [PageResult(1, normalize_text(text), "tesseract", confidence)]


def _extract_text_file(path: Path) -> list[PageResult]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    return [PageResult(1, normalize_text(raw), "text_file", None)]


def extract_document(path: Path) -> list[PageResult]:
    """Dispatches on file extension. Returns one PageResult per PDF page, or
    a single-page result for an image or text file. A page that can't be
    read comes back as engine="failed" with empty text rather than raising,
    so one bad page never aborts the rest of the document; an unsupported
    file type still raises ValueError so the upload boundary can reject it
    (415) before it ever reaches here."""
    ext = path.suffix.lower()
    if ext in PDF_EXTENSIONS:
        return _extract_pdf(path)
    if ext in IMAGE_EXTENSIONS:
        return _extract_image(path)
    if ext in TEXT_EXTENSIONS:
        return _extract_text_file(path)
    raise ValueError(f"Unsupported document type: {ext}")
