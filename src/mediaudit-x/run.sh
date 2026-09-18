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
if [[ ! -x "$BACKEND/venv/bin/python" ]]; then
  log "Creating Python venv and installing requirements (first run only)..."
  python3 -m venv "$BACKEND/venv"
  "$BACKEND/venv/bin/pip" install -q -r "$BACKEND/requirements.txt"
fi
PY="$BACKEND/venv/bin/python"

# ── Frontend deps ────────────────────────────────────────────────────
if [[ ! -d "$FRONTEND/node_modules" ]]; then
  log "Installing frontend packages (first run only)..."
  (cd "$FRONTEND" && npm ci --silent)
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
