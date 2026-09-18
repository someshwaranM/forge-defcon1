"""
Hybrid lexical-semantic policy matcher — BM25 + DiskBBQ via RRF.

BUILT LIVE (18 Sept): wired to the real embed_text() implementation
(see app/embeddings/embed.py) and tuned field boosts based on the CMS
LCD/NCD policy text actually ingested (cpt_codes/icd10_codes weighted
highest since exact-code precision is the whole thesis of this tool —
semantic similarity alone would conflate "Type 1" and "Type 2" diabetes,
which is the exact failure mode this project exists to fix).
"""
from app.es_client import get_es_client
from app.embeddings.embed import embed_text


def match_payer_coverage_policy(
    payer: str,
    cpt_code: str,
    icd10_code: str,
    clinical_summary: str,
) -> dict:
    es = get_es_client()
    query_vector = embed_text(f"{cpt_code} {icd10_code} {clinical_summary}")

    query_text = f"{cpt_code} {icd10_code} {clinical_summary}"

    response = es.search(
        index="medical-policies",
        retriever={
            "rrf": {
                "retrievers": [
                    {
                        "standard": {
                            "query": {
                                "bool": {
                                    "must": [
                                        {
                                            "multi_match": {
                                                "query": query_text,
                                                "fields": [
                                                    "cpt_codes^4",
                                                    "icd10_codes^3",
                                                    "clinical_indications^2",
                                                    "title",
                                                ],
                                                "type": "best_fields",
                                            }
                                        }
                                    ],
                                    "filter": [{"term": {"payer_name": payer}}],
                                }
                            }
                        }
                    },
                    {
                        "standard": {
                            "query": {
                                "knn": {
                                    "field": "policy_vector",
                                    "query_vector": query_vector,
                                    "k": 10,
                                    "num_candidates": 50,
                                    "filter": {"term": {"payer_name": payer}},
                                }
                            }
                        }
                    },
                ],
                "rank_window_size": 20,
                "rank_constant": 60,
            }
        },
        size=3,
    )
    return response.body


def match_payer_coverage_policy_fallback(
    payer: str, cpt_code: str, icd10_code: str, clinical_summary: str
) -> dict:
    """
    Plain BM25 fallback (no RRF/knn retriever) for Elasticsearch clusters
    that don't support the retriever API used above (e.g. some older local
    Docker images). The orchestrator tries the RRF path first and falls
    back to this on a 400 so a demo doesn't die on a version mismatch.
    """
    es = get_es_client()
    response = es.search(
        index="medical-policies",
        query={
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": f"{cpt_code} {icd10_code} {clinical_summary}",
                            "fields": [
                                "cpt_codes^4",
                                "icd10_codes^3",
                                "clinical_indications^2",
                                "title",
                            ],
                        }
                    }
                ],
                "filter": [{"term": {"payer_name": payer}}],
            }
        },
        size=3,
    )
    return response.body
