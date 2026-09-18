"""
FastAPI application entrypoint.

Run with: uvicorn app.main:app --reload --port 8000
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.logging_config import configure_logging
configure_logging()

from app.config import settings
from app.indices.create_indices import ensure_indices
from app.pipeline.ingestion.storage import upload_root
from app.routers import chat, claims, adjudication, intake, ocr, patients, audit

UPLOAD_DIR = upload_root()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="MediAudit-X API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router)
app.include_router(claims.router)
app.include_router(ocr.router)
app.include_router(chat.router)
app.include_router(adjudication.router)
app.include_router(patients.router)
app.include_router(audit.router)

# Serves files stored by the ingestion stage. Local disk, not an object
# store -- see app/pipeline/ingestion/storage.py for the swap-to-S3 note.
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


@app.on_event("startup")
def create_missing_indices():
    # Don't block startup if Elasticsearch is unreachable; requests will
    # surface the connection error instead.
    try:
        created = ensure_indices()
        if created:
            logging.getLogger("uvicorn.error").info("Created indices: %s", ", ".join(created))
    except Exception as e:  # noqa: BLE001
        logging.getLogger("uvicorn.error").warning("Could not check/create indices: %s", e)


@app.get("/health")
def health():
    return {"status": "ok"}
