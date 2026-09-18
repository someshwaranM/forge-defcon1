"""
Data shapes for the ingestion stage.

Framework-free on purpose: the router converts FastAPI UploadFiles into
IncomingFile, and everything below the router (checks, service, storage)
only sees these types, so the stage can be driven from a script, a test,
or a queue consumer later without touching HTTP.
"""
from dataclasses import dataclass, field

from pydantic import BaseModel, Field, field_validator

# Extension -> the content type the file's magic bytes must match.
ALLOWED_EXTENSIONS: dict[str, str] = {
    ".pdf": "pdf",
    ".png": "png",
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".tif": "tiff",
    ".tiff": "tiff",
}

# "supporting_document" is what the existing frontend sends.
DOC_TYPES = frozenset({
    "referral_letter",
    "op_note",
    "discharge_summary",
    "lab_report",
    "prescription",
    "imaging_report",
    "supporting_document",
    "other",
})

# Claims can only take new documents while they are still open.
# REQUEST_INFO moves back to DRAFT once new documents arrive.
UPLOADABLE_STATUSES = frozenset({"DRAFT", "PENDING", "REQUEST_INFO"})

CLAIM_ID_PATTERN = r"^[A-Za-z0-9_-]{1,64}$"


@dataclass(frozen=True)
class Limits:
    max_file_bytes: int
    max_files_per_upload: int
    max_pdf_pages: int
    min_image_side_px: int

    @classmethod
    def from_settings(cls, settings) -> "Limits":
        return cls(
            max_file_bytes=settings.max_upload_mb * 1024 * 1024,
            max_files_per_upload=settings.max_files_per_upload,
            max_pdf_pages=settings.max_pdf_pages,
            min_image_side_px=settings.min_image_side_px,
        )


@dataclass
class IncomingFile:
    filename: str
    data: bytes
    client_mime_type: str | None = None
    # True when the reader stopped at the size limit, i.e. `data` is only
    # a prefix of what was sent.
    truncated: bool = False


@dataclass
class FileInspection:
    """Facts established about one file as it passes through the checks."""
    safe_filename: str = ""
    extension: str = ""
    detected_type: str = ""
    size_bytes: int = 0
    sha256: str = ""
    page_count: int | None = None
    image_width: int | None = None
    image_height: int | None = None
    warnings: list[str] = field(default_factory=list)


@dataclass
class RejectedFile:
    filename: str
    code: str
    message: str


class CheckFailed(Exception):
    """Raised by a check to reject a single file."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class IngestionError(Exception):
    """Rejects the whole request (nothing was stored)."""

    def __init__(self, http_status: int, code: str, message: str, rejected: list[RejectedFile] | None = None):
        super().__init__(message)
        self.http_status = http_status
        self.code = code
        self.message = message
        self.rejected = rejected or []


class ClaimIntake(BaseModel):
    patient_id: str = Field(min_length=1, max_length=64)
    payer_name: str = Field(min_length=1, max_length=200)
    claim_type: str = Field(default="professional", min_length=1, max_length=64)
    submitted_by: str = Field(default="unknown", min_length=1, max_length=128)
    claim_amount: float | None = Field(default=None, gt=0)
    claim_id: str | None = Field(default=None, pattern=CLAIM_ID_PATTERN)

    @field_validator("patient_id", "payer_name", "claim_type", "submitted_by", mode="before")
    @classmethod
    def _strip(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("claim_id", mode="before")
    @classmethod
    def _blank_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value.strip() if isinstance(value, str) else value


@dataclass
class IngestionResult:
    claim: dict
    accepted: list[dict]
    rejected: list[RejectedFile]
    created_claim: bool
