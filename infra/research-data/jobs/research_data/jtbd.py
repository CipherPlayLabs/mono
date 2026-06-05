import re
from typing import Any

from .chunking import chunk_thread_nodes
from .ids import research_id
from .time_utils import utc_now_iso


ENTITY_CUES = [
    ("job", re.compile(r"\b(i|we)\s+need\b|\btrying to\b|\blooking for\b", re.I)),
    ("pain", re.compile(r"\bpain\b|\bfrustrat\w*\b|\bcannot\b|\bcan't\b", re.I)),
    ("workaround", re.compile(r"\bworkaround\b|\bchecklist\b|\bmanual\b", re.I)),
    ("solution", re.compile(r"\bconsidering\b|\bwe use\b|\busing\b|\bsoftware\b|\btool\b", re.I)),
    ("criterion", re.compile(r"\breduce\b|\bminimi[sz]e\b|\bimprove\b|\bincrease\b|\bwithout\b", re.I)),
]


def extract_thread_level_jtbd(
    snapshot_envelope: dict[str, Any],
    nodes: list[dict[str, Any]],
    *,
    max_chunk_chars: int = 12000,
) -> dict[str, Any]:
    source_thread_id = snapshot_envelope["source_thread_id"]
    snapshot_id = snapshot_envelope["source_thread_snapshot_id"]
    analysis_batch_id = research_id("analysis_batch", snapshot_id, "thread_level_jtbd")
    chunks = chunk_thread_nodes(nodes, max_chunk_chars)
    excerpts: list[dict[str, Any]] = []
    claims: list[dict[str, Any]] = []
    entities: list[dict[str, Any]] = []
    now = utc_now_iso()

    for chunk in chunks:
        for node in chunk["nodes"]:
            for sentence in _sentences(node):
                for entity_type, pattern in ENTITY_CUES:
                    if not pattern.search(sentence):
                        continue
                    excerpt = _build_excerpt(snapshot_envelope, node, sentence, now)
                    if excerpt["thread_excerpt_id"] not in {item["thread_excerpt_id"] for item in excerpts}:
                        excerpts.append(excerpt)
                    claim = _build_claim(snapshot_envelope, excerpt, entity_type, sentence, now)
                    claims.append(claim)
                    entities.append(_build_entity(snapshot_envelope, claim, entity_type, sentence, now))

    source_quality_note = _source_quality_note(snapshot_envelope, now)
    record = {
        "jtbd_record_id": research_id("jtbd_record", source_thread_id, snapshot_id, analysis_batch_id),
        "analysis_batch_id": analysis_batch_id,
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "created_at": now,
        "thread_summary": _thread_summary(nodes),
        "jobs": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "job"],
        "criteria": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "criterion"],
        "contexts": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "context"],
        "pains": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "pain"],
        "workarounds": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "workaround"],
        "solutions": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "solution"],
        "people_roles": [entity["jtbd_entity_id"] for entity in entities if entity["entity_type"] == "people_role"],
        "source_quality_note_ids": [source_quality_note["source_quality_note_id"]],
        "unanswered_follow_up_questions": _follow_up_questions(entities),
        "record_json": {
            "chunk_count": len(chunks),
            "chunk_ids": [chunk["analysis_chunk_id"] for chunk in chunks],
            "lineage_complete": True,
            "thread_level_only": True,
        },
    }
    return {
        "analysis_batch": {
            "analysis_batch_id": analysis_batch_id,
            "analysis_mode": "jtbd_first",
            "source_thread_snapshot_id": snapshot_id,
            "source_thread_id": source_thread_id,
            "created_at": now,
            "batch_json": {
                "thread_level_only": True,
                "allow_truncation": False,
                "chunk_count": len(chunks),
            },
        },
        "source_quality_notes": [source_quality_note],
        "thread_excerpts": excerpts,
        "evidence_claims": claims,
        "jtbd_entities": entities,
        "thread_level_jtbd_record": record,
    }


def _build_excerpt(
    snapshot_envelope: dict[str, Any],
    node: dict[str, Any],
    sentence: str,
    observed_at: str,
) -> dict[str, Any]:
    excerpt_id = research_id("thread_excerpt", node["thread_node_id"], sentence)
    return {
        "thread_excerpt_id": excerpt_id,
        "source_thread_id": snapshot_envelope["source_thread_id"],
        "source_thread_snapshot_id": snapshot_envelope["source_thread_snapshot_id"],
        "thread_node_id": node["thread_node_id"],
        "provider_fullname": node["provider_fullname"],
        "excerpt_text": sentence,
        "created_at": observed_at,
        "locator_json": {
            "permalink": node.get("permalink"),
            "node_depth": node.get("node_depth"),
            "provider_parent_fullname": node.get("provider_parent_fullname"),
        },
    }


def _build_claim(
    snapshot_envelope: dict[str, Any],
    excerpt: dict[str, Any],
    entity_type: str,
    sentence: str,
    observed_at: str,
) -> dict[str, Any]:
    return {
        "evidence_claim_id": research_id("evidence_claim", excerpt["thread_excerpt_id"], entity_type),
        "source_thread_id": snapshot_envelope["source_thread_id"],
        "source_thread_snapshot_id": snapshot_envelope["source_thread_snapshot_id"],
        "thread_excerpt_ids": [excerpt["thread_excerpt_id"]],
        "claim_type": entity_type,
        "claim_text": sentence,
        "inference_level": "direct" if entity_type in {"pain", "workaround", "solution"} else "strong_inference",
        "confidence_level": "medium" if entity_type in {"pain", "workaround", "solution"} else "low",
        "created_at": observed_at,
        "claim_json": {
            "source": "thread_level_extraction",
            "requires_human_review_before_rollup": True,
        },
    }


def _build_entity(
    snapshot_envelope: dict[str, Any],
    claim: dict[str, Any],
    entity_type: str,
    sentence: str,
    observed_at: str,
) -> dict[str, Any]:
    return {
        "jtbd_entity_id": research_id("jtbd_entity", claim["evidence_claim_id"], entity_type),
        "source_thread_id": snapshot_envelope["source_thread_id"],
        "source_thread_snapshot_id": snapshot_envelope["source_thread_snapshot_id"],
        "evidence_claim_ids": [claim["evidence_claim_id"]],
        "entity_type": entity_type,
        "entity_statement": _normalize_statement(entity_type, sentence),
        "inference_level": claim["inference_level"],
        "confidence_level": claim["confidence_level"],
        "created_at": observed_at,
        "entity_json": {
            "thread_level_only": True,
            "source_sentence": sentence,
        },
    }


def _source_quality_note(snapshot_envelope: dict[str, Any], observed_at: str) -> dict[str, Any]:
    source_thread_id = snapshot_envelope["source_thread_id"]
    snapshot_id = snapshot_envelope["source_thread_snapshot_id"]
    return {
        "source_quality_note_id": research_id("source_quality_note", source_thread_id, snapshot_id),
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "note_type": "source_bias_review",
        "confidence_impact": "caution",
        "note_text": (
            "Reddit source evidence carries self-selection, provider-accessible sampling, "
            "community culture, moderation, and interpretation bias risks."
        ),
        "created_at": observed_at,
        "note_json": {
            "bias_factors": [
                "self_selection_bias",
                "provider_accessible_sampling",
                "moderation_and_removal_effects",
                "community_culture_and_norms",
                "performative_commenting_or_sarcasm",
                "analyst_interpretation_bias",
            ]
        },
    }


def _sentences(node: dict[str, Any]) -> list[str]:
    text = "\n".join(str(node.get(key) or "") for key in ("title", "body")).strip()
    if not text:
        text = str(node.get("text") or "")
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]


def _normalize_statement(entity_type: str, sentence: str) -> str:
    sentence = re.sub(r"\s+", " ", sentence).strip()
    if entity_type == "criterion" and not re.match(r"^(Minimize|Maximize|Reduce|Increase|Improve)\b", sentence):
        return f"Improve ability to satisfy criterion evidenced by: {sentence}"
    return sentence


def _thread_summary(nodes: list[dict[str, Any]]) -> str:
    if not nodes:
        return "Empty source thread."
    title = nodes[0].get("title") or "Untitled Reddit thread"
    body = nodes[0].get("body") or ""
    return f"{title}: {body[:240]}".strip()


def _follow_up_questions(entities: list[dict[str, Any]]) -> list[str]:
    questions = [
        "Which context makes this job urgent enough to change behavior?",
        "What current solution is being replaced, extended, or worked around?",
        "What criteria would make a solution good enough?",
    ]
    if not any(entity["entity_type"] == "criterion" for entity in entities):
        questions.append("What explicit evaluation criteria did participants use?")
    return questions
