# Backend dev image: pinned to Python 3.12 because the pinned deps
# (pydantic 2.9) have no wheels for 3.14.
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    # Slow connections: wait longer per read and retry instead of failing.
    PIP_DEFAULT_TIMEOUT=300 PIP_RETRIES=10 PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
# The cache mount keeps downloaded packages between builds, so a build
# that fails halfway doesn't re-download everything on the next try.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
