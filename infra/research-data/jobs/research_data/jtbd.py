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
    passages: list[dict[str, Any]] = []
    claims: list[dict[str, Any]] = []
    now = utc_now_iso()

    for chunk in chunks:
        for node in chunk["nodes"]:
            for sentence in _sentences(node):
                for entity_type, pattern in ENTITY_CUES:
                    if not pattern.search(sentence):
                        continue
                    passage = _build_passage(snapshot_envelope, node, sentence, now)
                    if passage["source_passage_id"] not in {item["source_passage_id"] for item in passages}:
                        passages.append(passage)
                    claim = _build_claim(snapshot_envelope, passage, entity_type, sentence, now)
                    claims.append(claim)

    source_quality_note = _source_quality_note(snapshot_envelope, now)
    record = {
        "jtbd_record_id": research_id("jtbd_record", source_thread_id, snapshot_id, analysis_batch_id),
        "analysis_batch_id": analysis_batch_id,
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "created_at": now,
        "thread_summary": _thread_summary(nodes),
        "jobs": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "job"],
        "criteria": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "criterion"],
        "contexts": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "context"],
        "pains": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "pain"],
        "workarounds": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "workaround"],
        "solutions": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "solution"],
        "people_roles": [claim["evidence_claim_id"] for claim in claims if claim["claim_type"] == "people_role"],
        "source_quality_note_ids": [source_quality_note["source_quality_note_id"]],
        "unanswered_follow_up_questions": _follow_up_questions(claims),
        "record_json": {
            "chunk_count": len(chunks),
            "chunk_ids": [chunk["analysis_chunk_id"] for chunk in chunks],
            "lineage_complete": True,
            "thread_level_only": True,
            "link_type": "evidence_claim_ids",
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
        "source_passages": passages,
        "thread_excerpts": passages,
        "evidence_claims": claims,
        "thread_level_jtbd_record": record,
    }


def _build_passage(
    snapshot_envelope: dict[str, Any],
    node: dict[str, Any],
    sentence: str,
    observed_at: str,
) -> dict[str, Any]:
    passage_id = research_id("source_passage", node["thread_node_id"], sentence)
    thread_data = snapshot_envelope.get("raw", {}).get("thread_listing", {}).get("data", {})
    return {
        "source_passage_id": passage_id,
        "source_thread_id": snapshot_envelope["source_thread_id"],
        "source_thread_snapshot_id": snapshot_envelope["source_thread_snapshot_id"],
        "thread_node_id": node["thread_node_id"],
        "provider_fullname": node["provider_fullname"],
        "passage_text": sentence,
        "passage_score": node.get("score"),
        "thread_score": thread_data.get("score"),
        "thread_comment_count": thread_data.get("num_comments"),
        "created_at": observed_at,
        "active": True,
        "locator_json": {
            "permalink": node.get("permalink"),
            "node_depth": node.get("node_depth"),
            "provider_parent_fullname": node.get("provider_parent_fullname"),
        },
    }


def _build_claim(
    snapshot_envelope: dict[str, Any],
    passage: dict[str, Any],
    entity_type: str,
    sentence: str,
    observed_at: str,
) -> dict[str, Any]:
    return {
        "evidence_claim_id": research_id("evidence_claim", passage["source_passage_id"], entity_type),
        "source_thread_id": snapshot_envelope["source_thread_id"],
        "source_thread_snapshot_id": snapshot_envelope["source_thread_snapshot_id"],
        "source_passage_ids": [passage["source_passage_id"]],
        "claim_type": entity_type,
        "claim_text": sentence,
        "inference_level": "direct" if entity_type in {"pain", "workaround", "solution"} else "strong_inference",
        "confidence_level": "medium" if entity_type in {"pain", "workaround", "solution"} else "low",
        "created_at": observed_at,
        "active": True,
        "claim_json": {
            "source": "thread_level_extraction",
            "requires_human_review_before_rollup": True,
            "passage_score": passage.get("passage_score"),
            "thread_score": passage.get("thread_score"),
            "thread_comment_count": passage.get("thread_comment_count"),
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


def _follow_up_questions(claims: list[dict[str, Any]]) -> list[str]:
    questions = [
        "Which context makes this job urgent enough to change behavior?",
        "What current solution is being replaced, extended, or worked around?",
        "What criteria would make a solution good enough?",
    ]
    if not any(claim["claim_type"] == "criterion" for claim in claims):
        questions.append("What explicit evaluation criteria did participants use?")
    return questions
