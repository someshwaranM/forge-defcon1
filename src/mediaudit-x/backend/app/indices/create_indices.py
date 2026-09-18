"""
Idempotent index creation.

Reads every *.json mapping file in this directory and creates the matching
index name (filename with underscores -> hyphens) in Elasticsearch.

Run with:  python -m app.indices.create_indices
"""
import json
from pathlib import Path

from app.es_client import get_es_client

MAPPINGS_DIR = Path(__file__).parent / "mappings"


def index_name_from_filename(filename: str) -> str:
    return filename.replace(".json", "").replace("_", "-")


def create_all_indices() -> None:
    es = get_es_client()

    for mapping_file in sorted(MAPPINGS_DIR.glob("*.json")):
        index_name = index_name_from_filename(mapping_file.name)
        body = json.loads(mapping_file.read_text())

        if es.indices.exists(index=index_name):
            print(f"[skip]   {index_name} already exists")
            continue

        es.indices.create(index=index_name, body=body)
        print(f"[create] {index_name}")

    print("\nDone. Indices in cluster:")
    for name in sorted(es.indices.get_alias(index="*").keys()):
        if not name.startswith("."):
            print(f"  - {name}")


if __name__ == "__main__":
    create_all_indices()
