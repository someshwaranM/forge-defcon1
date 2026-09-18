"""
FastAPI application entrypoint.

Run with: uvicorn app.main:app --reload --port 8000
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import claims, adjudication, patients

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="MediAudit-X API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(claims.router)
app.include_router(adjudication.router)
app.include_router(patients.router)

# Serves files uploaded via POST /claims/{claim_id}/documents. Local disk,
# not an object store -- see the docstring in routers/claims.py for the
# swap-to-S3 note.
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


@app.get("/health")
def health():
    return {"status": "ok"}
