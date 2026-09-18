#!/bin/sh
# One-shot setup run by docker compose before the backend starts:
# create/sync indices, then load sample data only if the cluster has no
# claims yet (the loaders index without ids, so re-running duplicates).
set -e

python -m app.indices.create_indices

CLAIMS=$(python -c "from app.es_client import get_es_client; print(get_es_client().count(index='insurance-claims')['count'])")
if [ "$CLAIMS" = "0" ]; then
  echo "[setup] empty cluster, loading sample data"
  for loader in load_sample_data load_real_cms_policies ingest_synthea_samples; do
    python -m "app.ingestion.$loader" || echo "[setup] WARNING: $loader failed, continuing"
  done
else
  echo "[setup] $CLAIMS claims already loaded, skipping sample data"
fi
