"""
Elasticsearch client singleton.

Supports three connection shapes:
  1. Classic Elastic Cloud (hosted deployments): cloud_id + api_key.
  2. Elastic Cloud Serverless: url (the project's https://...es....elastic.cloud
     endpoint) + api_key. Serverless projects don't expose a classic
     base64 Cloud ID and don't support basic auth — API key over the
     endpoint URL is the only supported auth method.
  3. Self-managed / local Docker cluster: url + basic auth
     (username/password), or url with no auth at all for a local dev
     cluster running with security disabled.

BUILT LIVE (18 Sept) — fixed after discovering during local setup that a
Serverless project's "connection details" panel gives you a URL endpoint,
not a Cloud ID, and the original url-only branch only supported basic
auth, which Serverless rejects. Put the project's endpoint URL in
ELASTIC_URL and its API key in ELASTIC_API_KEY (leave ELASTIC_CLOUD_ID
blank) to connect to Serverless with this client.
"""
from elasticsearch import Elasticsearch
from functools import lru_cache

from app.config import settings


@lru_cache
def get_es_client() -> Elasticsearch:
    if settings.elastic_cloud_id and settings.elastic_api_key:
        return Elasticsearch(
            cloud_id=settings.elastic_cloud_id,
            api_key=settings.elastic_api_key,
        )

    if settings.elastic_url and settings.elastic_api_key:
        # Elastic Cloud Serverless (or any URL-based cluster using API
        # key auth instead of basic auth).
        return Elasticsearch(
            settings.elastic_url,
            api_key=settings.elastic_api_key,
        )

    if settings.elastic_url:
        auth = None
        if settings.elastic_username and settings.elastic_password:
            auth = (settings.elastic_username, settings.elastic_password)
        return Elasticsearch(settings.elastic_url, basic_auth=auth)

    raise RuntimeError(
        "No Elasticsearch connection configured. Set either "
        "ELASTIC_CLOUD_ID + ELASTIC_API_KEY (classic Elastic Cloud), or "
        "ELASTIC_URL + ELASTIC_API_KEY (Elastic Cloud Serverless / API-key "
        "auth), or ELASTIC_URL (+ ELASTIC_USERNAME/ELASTIC_PASSWORD for "
        "basic auth) for a self-managed cluster, in your .env file."
    )
