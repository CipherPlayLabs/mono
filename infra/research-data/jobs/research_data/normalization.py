import re
from collections import defaultdict
from typing import Any

from .ids import research_id


def build_normalization_rewrite(
    *,
    run_id: str,
    evidence_claims: list[dict[str, Any]],
    generated_at: str,
) -> dict[str, Any]:
    active_claims = [claim for claim in evidence_claims if claim.get("active", True)]
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for claim in active_claims:
        groups[(claim["claim_type"], _canonical_key(claim["claim_text"]))].append(claim)

    normalized_entities: list[dict[str, Any]] = []
    relationships: list[dict[str, Any]] = []
    for (entity_type, canonical_key), claims in sorted(groups.items()):
        representative = _representative_statement(claims)
        entity_id = research_id("normalized_jtbd_entity", run_id, entity_type, canonical_key)
        support = _support_metrics(claims)
        normalized_entities.append(
            {
                "normalized_jtbd_entity_id": entity_id,
                "normalization_run_id": run_id,
                "entity_type": entity_type,
                "normalized_statement": representative,
                "evidence_claim_count": len(claims),
                "source_thread_count": len({claim["source_thread_id"] for claim in claims}),
                "passage_score_sum": support["passage_score_sum"],
                "thread_score_sum": support["thread_score_sum"],
                "thread_comment_count_sum": support["thread_comment_count_sum"],
                "created_at": generated_at,
                "active": False,
                "entity_json": {
                    "canonical_key": canonical_key,
                    "status": "staged",
                },
            }
        )
        for claim in claims:
            claim_json = claim.get("claim_json") or {}
            relationships.append(
                {
                    "evidence_relationship_id": research_id(
                        "evidence_relationship",
                        run_id,
                        entity_id,
                        claim["evidence_claim_id"],
                    ),
                    "normalization_run_id": run_id,
                    "normalized_jtbd_entity_id": entity_id,
                    "evidence_claim_id": claim["evidence_claim_id"],
                    "source_thread_id": claim["source_thread_id"],
                    "relationship_type": "primary",
                    "passage_score": _safe_int(claim_json.get("passage_score")),
                    "thread_score": _safe_int(claim_json.get("thread_score")),
                    "thread_comment_count": _safe_int(claim_json.get("thread_comment_count")),
                    "created_at": generated_at,
                    "active": False,
                    "relationship_json": {
                        "source_passage_ids": claim.get("source_passage_ids", []),
                    },
                }
            )

    normalization_run = {
        "normalization_run_id": run_id,
        "created_at": generated_at,
        "status": "staged",
        "evidence_claim_count": len(active_claims),
        "normalized_entity_count": len(normalized_entities),
        "relationship_count": len(relationships),
        "run_json": {
            "rewrite_scope": "full_corpus_all_entity_categories",
            "only_active_evidence": True,
            "engagement_weighting": "passage_and_thread_signals_kept_separate",
        },
    }
    return {
        "normalization_run": normalization_run,
        "normalized_jtbd_entities": normalized_entities,
        "evidence_relationships": relationships,
    }


def _canonical_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _representative_statement(claims: list[dict[str, Any]]) -> str:
    return min((str(claim["claim_text"]).strip() for claim in claims), key=lambda text: (len(text), text.lower()))


def _support_metrics(claims: list[dict[str, Any]]) -> dict[str, int]:
    passage_score_sum = 0
    thread_score_sum = 0
    thread_comment_count_sum = 0
    for claim in claims:
        claim_json = claim.get("claim_json") or {}
        passage_score_sum += _safe_int(claim_json.get("passage_score"))
        thread_score_sum += _safe_int(claim_json.get("thread_score"))
        thread_comment_count_sum += _safe_int(claim_json.get("thread_comment_count"))
    return {
        "passage_score_sum": passage_score_sum,
        "thread_score_sum": thread_score_sum,
        "thread_comment_count_sum": thread_comment_count_sum,
    }


def _safe_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0
