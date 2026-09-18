# Logging & Monitoring

Not part of `ARCHITECTURE.md`'s original stage plan — added afterward so
issues in any stage (intake, OCR, adjudication, ...) are actually visible
somewhere, instead of a router either converting an error to an
`HTTPException` (fine) or, in a couple of places the initial build survey
found, discarding it silently.

Deliberately **not** the same thing as `ARCHITECTURE.md`'s planned
`alerts` index (Stage 10) — that's a business-domain concept (a drug
interaction fired, the audit ledger is broken, a claim needs manual
review) meant for claims staff. This is infrastructure/application
observability meant for whoever is running the service. Don't conflate
the two indices or route one's data into the other.

---

## 1. What it does

Every request gets logged once, on completion, with method/path/status/
duration. Every `logger.info/warning/error(...)` call anywhere in
`app/` — a route, a pipeline service, anything — goes through the same
pipeline. Two destinations, always the same shape:

1. **stdout**, one JSON object per line — always on, zero setup,
   `docker compose logs backend` or plain `uvicorn` output is already
   structured.
2. **Elasticsearch** (`app-logs` index) — optional
   (`LOG_TO_ELASTICSEARCH`, default `true`), queryable/dashboard-able in
   Kibana.

Both are driven off a background thread
(`logging.handlers.QueueHandler`/`QueueListener`, the standard library's
own pattern for this): a `logger.info(...)` call anywhere in the app
pushes onto an in-memory queue and returns immediately — the
Elasticsearch write (a real network round-trip, sometimes 100s of ms on
this project's Serverless cluster) never blocks the request the log line
was describing.

---

## 2. Where it lives

`backend/app/observability/`:

| File | What |
|---|---|
| `context.py` | `ContextVar`s for `request_id`/`claim_id`, propagated onto every log record via a `logging.Filter` — this is how a log line three calls deep inside `pipeline/ocr/service.py` ends up tagged with the same `request_id` as the HTTP request that triggered it, with no parameter threaded through every function signature. |
| `formatting.py` | `record_to_dict` — the one schema both stdout and Elasticsearch use; `JsonFormatter` wraps it for stdout. |
| `es_handler.py` | `ElasticsearchLogHandler` — indexes into `app-logs`. Failures here print a one-line stderr warning and are otherwise swallowed: a logging failure must never crash the app, and must never re-enter the logging system (infinite recursion). |
| `logging_config.py` | `configure_logging()` — wires the "app" logger (parent of every `logging.getLogger(__name__)` call in this codebase, since every module is `app.something`) to the queue/stdout/Elasticsearch handlers. Called once, at import time, in `main.py`. Deliberately scoped to the `"app"` logger, not the root logger — uvicorn/elasticsearch-py/boto3 configure their own loggers and are noisy at INFO (every HTTP call, connection pool churn); left alone. |
| `middleware.py` | `RequestLoggingMiddleware` (times + logs every request, stamps `X-Request-ID` on the response) and `unhandled_exception_handler` (catches anything not already turned into an `HTTPException` by a router, logs the full traceback, returns a clean `{"detail": "Internal server error", "request_id": ...}` instead of a raw traceback reaching the client). |

`backend/app/indices/mappings/app_logs.json` → `app-logs` (auto-created,
same mechanism as every other index).

`GET /health/es` (new, `main.py`) — an actual Elasticsearch connectivity
check, separate from the pre-existing `GET /health` (kept as a pure,
unconditional liveness check so Docker's `HEALTHCHECK` doesn't flap just
because Elasticsearch is briefly slow — that's a different failure mode
than "the backend process itself is dead").

---

## 3. `app-logs` schema

| Field | Example | Notes |
|---|---|---|
| `@timestamp` | `2026-09-18T08:37:52.9Z` | |
| `level` | `INFO` \| `WARNING` \| `ERROR` | Request logs: INFO <400, WARNING 4xx, ERROR 5xx |
| `logger` | `app.observability.middleware` | Python logger name — traces back to the module that logged it |
| `message` | `"request completed"` | |
| `request_id` | `f85361a5...` | Same value as the `X-Request-ID` response header; also accepted as an *incoming* request header if the caller already has one (e.g. a frontend-generated trace id) |
| `claim_id` | `CLM-1001` or `null` | Auto-extracted from `/claims/{claim_id}/...` paths by the middleware; settable explicitly via `context.set_claim_id()` from anywhere else (a CLI script, a background job) |
| `method`, `path`, `status_code`, `duration_ms` | `"POST"`, `"/claims/CLM-1/ocr"`, `200`, `842.1` | Only present on the per-request "request completed" log line |
| `error_type`, `error_message`, `traceback` | `"ValueError"`, `"..."`, `"Traceback ..."` | Only present when the log call included exception info (`logger.exception(...)` or `exc_info=...`) |
| *(anything else)* | | Any `extra={...}` passed to a `logger.x(...)` call is merged in as-is — the mapping doesn't need updating for a new field, Elasticsearch dynamic-maps it |

---

## 4. Querying it (Kibana / Dev Tools)

Everything that happened for one claim, across every stage:
```json
GET app-logs/_search
{ "query": { "term": { "claim_id": "CLM-1001" } }, "sort": [{"@timestamp": "asc"}] }
```

Everything that went wrong recently:
```json
GET app-logs/_search
{ "query": { "terms": { "level": ["WARNING", "ERROR"] } }, "sort": [{"@timestamp": "desc"}] }
```

Follow one request end-to-end (only useful if something inside the
request also logged its own lines with the same `request_id`):
```json
GET app-logs/_search
{ "query": { "term": { "request_id": "f85361a515b94adea512a9f72dc59e35" } } }
```

Slowest endpoints:
```json
GET app-logs/_search
{ "query": { "exists": { "field": "duration_ms" } }, "sort": [{"duration_ms": "desc"}], "size": 20 }
```

A Kibana Discover view or a dashboard (request volume over time, status
code breakdown, p95 latency, error rate) is just those same queries
visualized — nothing extra to build for that, it's the same index.

---

## 5. Writing logs from new code

```python
from app.observability.logging_config import get_app_logger

logger = get_app_logger(__name__)

logger.info("processed document", extra={"doc_id": doc_id, "page_count": n})
logger.warning("low OCR confidence", extra={"doc_id": doc_id, "confidence": conf})

try:
    ...
except Exception:
    logger.exception("OCR failed for document", extra={"doc_id": doc_id})
    raise  # or handle -- logging and error-handling are separate concerns
```

If code runs outside a request (a CLI ingestion script, a background
job) and you still want `claim_id` on its log lines:
```python
from app.observability.context import claim_context

with claim_context(claim_id):
    ...  # anything logged in here is tagged with claim_id
```

Don't call `print()` for anything that represents real application
state (progress, warnings, errors) in request-serving code going
forward — the one-off `print()`s already in `app/ingestion/*.py` (the
CLI seed-data scripts, distinct from `app/pipeline/ingestion/`) are
fine as-is, they're interactive setup scripts a human runs and watches,
not part of the request path.

---

## 6. Known limitations

- **Logs can be lost if the process exits without a clean shutdown.**
  The background listener thread is a daemon thread by design (so it
  never blocks process exit) and only drains its queue on
  `stop_logging()`, wired to FastAPI's `shutdown` lifespan event. A
  graceful `uvicorn` stop (SIGTERM, `docker compose down`) flushes
  correctly — verified directly in this session (log lines that
  reached Elasticsearch reliably when the app shut down cleanly via
  FastAPI's lifespan, and were lost when a short test script exited
  without triggering it). A hard kill (`kill -9`, a crash) can drop
  whatever was still queued. This is the standard trade-off of
  non-blocking async logging, not a bug — but it means don't rely on
  `app-logs` as a source of truth for something that must never go
  missing (that's what `audit-ledger`'s hash chain is for).
- **Request duration on the SSE adjudication endpoint
  (`POST /claims/{id}/adjudicate`) only measures time-to-first-byte, not
  the full streamed session.** `RequestLoggingMiddleware` is built on
  Starlette's `BaseHTTPMiddleware`, whose `call_next()` returns once a
  `StreamingResponse` starts, not once it finishes — an SSE connection
  that stays open through a multi-round LLM tool loop will log a
  `duration_ms` far shorter than how long the client was actually
  connected. Not fixed here; would need a lower-level ASGI middleware
  wrapping `send` directly to time the actual close.
- **Stdout log line order can differ slightly from real call order**
  under concurrent requests, since the listener thread processes one
  shared queue — use `@timestamp` (or `request_id` to group by request),
  not line position, if ordering matters.
- No sampling/rate-limiting: every request becomes one `app-logs`
  document. Fine at hackathon-demo traffic levels; would need to add
  sampling before this could take real production volume without
  becoming an Elasticsearch cost/volume problem.

---

## 7. Config

| Setting (`.env`) | Default | |
|---|---|---|
| `LOG_LEVEL` | `INFO` | Threshold for the `"app.*"` logger namespace only |
| `LOG_TO_ELASTICSEARCH` | `true` | `false` to keep logs on stdout only (e.g. local dev against a shared cluster you don't want per-request docs landing on) |

No new dependencies — everything here is Python's standard library
(`logging`, `logging.handlers`, `queue`, `contextvars`).
