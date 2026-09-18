"""
FastAPI application entrypoint.

Run with: uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.pipeline.ingestion.storage import upload_root
from app.routers import claims, adjudication, intake, patients

UPLOAD_DIR = upload_root()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="MediAudit-X API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router)
app.include_router(claims.router)
app.include_router(adjudication.router)
app.include_router(patients.router)

# Serves files stored by the ingestion stage. Local disk, not an object
# store -- see app/pipeline/ingestion/storage.py for the swap-to-S3 note.
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


@app.get("/health")
def health():
    return {"status": "ok"}
