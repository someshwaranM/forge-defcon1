#!/usr/bin/env bash
# Starts MediAudit-X locally: backend (FastAPI :8000) + frontend (Next.js :3000).
#
#   ./run.sh            install deps if missing, set up indices, seed sample
#                       data if the cluster is empty, start both servers
#   ./run.sh --no-seed  same, but never load sample data
#
# Elasticsearch: uses backend/.env if present, otherwise ELASTIC_URL from
# your shell, otherwise http://localhost:9200. Ctrl+C stops both servers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
SEED=1
[[ "${1:-}" == "--no-seed" ]] && SEED=0

log()  { printf '\033[1;34m[run]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[run]\033[0m %s\n' "$*" >&2; exit 1; }

# ── Elasticsearch ────────────────────────────────────────────────────
if [[ -f "$BACKEND/.env" ]]; then
  log "Using Elasticsearch settings from backend/.env"
else
  export ELASTIC_URL="${ELASTIC_URL:-http://localhost:9200}"
  log "No backend/.env — using ELASTIC_URL=$ELASTIC_URL"
fi

# ── Backend deps ─────────────────────────────────────────────────────
# The marker is written only after a successful install, so an install
# interrupted with Ctrl+C is retried next run instead of skipped; it is
# also redone when requirements.txt changes.
# Pinned deps (pydantic 2.9) have no wheels for Python 3.14+, so pick a
# supported interpreter explicitly rather than whatever python3 is.
py_ok() { "$1" -c 'import sys; sys.exit(not ((3, 10) <= sys.version_info[:2] <= (3, 13)))' 2>/dev/null; }

MARKER="$BACKEND/venv/.requirements-installed"
if [[ -x "$BACKEND/venv/bin/python" ]] && ! py_ok "$BACKEND/venv/bin/python"; then
  log "backend/venv was built with an unsupported Python — rebuilding it"
  rm -rf "$BACKEND/venv"
fi
if [[ ! -f "$MARKER" || "$BACKEND/requirements.txt" -nt "$MARKER" ]]; then
  BASE_PY=""
  for candidate in ${PYTHON:-} python3.12 python3.13 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null && py_ok "$candidate"; then BASE_PY="$candidate"; break; fi
  done
  [[ -n "$BASE_PY" ]] || fail "No Python 3.10-3.13 found (python3 is $(python3 --version 2>&1)). Install one: brew install python@3.12"
  log "Installing backend requirements with $("$BASE_PY" --version) (first run takes a few minutes)..."
  [[ -x "$BACKEND/venv/bin/python" ]] || "$BASE_PY" -m venv "$BACKEND/venv"
  # Old pips miss prebuilt wheels and compile from source, which looks like a hang.
  "$BACKEND/venv/bin/python" -m pip install --upgrade pip
  "$BACKEND/venv/bin/python" -m pip install --prefer-binary -r "$BACKEND/requirements.txt"
  touch "$MARKER"
fi
PY="$BACKEND/venv/bin/python"

# ── Frontend deps ────────────────────────────────────────────────────
if [[ ! -d "$FRONTEND/node_modules" ]]; then
  log "Installing frontend packages (first run only)..."
  (cd "$FRONTEND" && npm ci)
fi

# ── Indices + sample data ────────────────────────────────────────────
cd "$BACKEND"
"$PY" -c "from app.es_client import get_es_client; get_es_client().info()" >/dev/null 2>&1 \
  || fail "Can't reach Elasticsearch. Start it (e.g. docker start mediaudit-es) or set ELASTIC_URL / backend/.env."

log "Creating/updating indices..."
"$PY" -m app.indices.create_indices >/dev/null

if [[ $SEED -eq 1 ]]; then
  CLAIMS=$("$PY" -c "from app.es_client import get_es_client; print(get_es_client().count(index='insurance-claims')['count'])")
  if [[ "$CLAIMS" == "0" ]]; then
    # The loaders index without ids, so running them twice duplicates data.
    log "Cluster is empty — loading sample data..."
    for loader in load_sample_data load_real_cms_policies ingest_synthea_samples; do
      "$PY" -m "app.ingestion.$loader" >/dev/null 2>&1 \
        || log "WARNING: $loader failed (run: cd backend && venv/bin/python -m app.ingestion.$loader) — continuing"
    done
  else
    log "Found $CLAIMS claims — skipping sample data."
  fi
fi

# ── Start servers ────────────────────────────────────────────────────
PIDS=()
cleanup() {
  log "Stopping..."
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

log "Starting backend on :$BACKEND_PORT"
"$BACKEND/venv/bin/uvicorn" app.main:app --reload --port "$BACKEND_PORT" &
PIDS+=($!)

for _ in $(seq 30); do
  curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null && break
  sleep 0.5
done
curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null || fail "Backend didn't start — see output above."

log "Starting frontend on :$FRONTEND_PORT"
(cd "$FRONTEND" && NEXT_PUBLIC_API_BASE_URL="http://localhost:$BACKEND_PORT" npx next dev -p "$FRONTEND_PORT") &
PIDS+=($!)

log "Ready:  UI  http://localhost:$FRONTEND_PORT   API docs  http://localhost:$BACKEND_PORT/docs"
log "Upload test: UI → + New Claim → attach data/sample/sample_referral_letter.pdf"
wait
