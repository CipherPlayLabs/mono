import re
from typing import Any

from .ids import research_id
from .time_utils import utc_now_iso


CUSTOMER_DISCOVERY_CUES = (
    "i need",
    "we need",
    "trying to",
    "looking for",
    "pain",
    "frustrat",
    "workaround",
    "considering",
    "switch",
    "reduce",
    "improve",
    "cannot",
    "can't",
    "using",
    "we use",
)


def triage_source_thread(
    snapshot_envelope: dict[str, Any],
    nodes: list[dict[str, Any]],
    *,
    minimum_total_text_characters: int = 500,
    minimum_non_deleted_comments: int = 2,
) -> dict[str, Any]:
    observed_at = utc_now_iso()
    source_thread_id = snapshot_envelope["source_thread_id"]
    snapshot_id = snapshot_envelope["source_thread_snapshot_id"]
    text = "\n".join(_node_text(node) for node in nodes).strip()
    post = nodes[0] if nodes else {}
    non_deleted_comments = [
        node
        for node in nodes
        if node.get("node_type") == "comment" and not _is_deleted_or_removed(_node_text(node))
    ]

    if not nodes or _is_removed_post(post):
        status = "deleted_or_removed"
        reason = "Starting post is deleted or removed."
        eligible = False
        confidence = 0.95
        flags = ["removed_content"]
    elif _looks_non_english(text):
        status = "non_english"
        reason = "Thread text does not look like English customer discovery material."
        eligible = False
        confidence = 0.65
        flags = ["language_uncertain"]
    elif len(text) < minimum_total_text_characters and len(non_deleted_comments) < minimum_non_deleted_comments:
        status = "low_signal"
        reason = "Thread has too little provider-accessible text and too few non-deleted comments."
        eligible = False
        confidence = 0.8
        flags = ["below_minimum_signal"]
    elif _looks_mostly_news_link(post, text):
        status = "mostly_news_link"
        reason = "Starting post appears to be a link/news reaction rather than customer experience."
        eligible = False
        confidence = 0.7
        flags = ["link_or_news_signal"]
    elif _has_customer_discovery_signal(text):
        status = "jtbd_eligible"
        reason = "Thread contains job, pain, workaround, solution, or criteria signals."
        eligible = True
        confidence = 0.78
        flags = ["customer_job_signal"]
    else:
        status = "needs_review"
        reason = "Deterministic checks did not find enough signal; semantic review should decide."
        eligible = False
        confidence = 0.45
        flags = ["semantic_review_needed"]

    return {
        "source_thread_triage_id": research_id("source_thread_triage", source_thread_id, snapshot_id, status),
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "triage_status": status,
        "eligible_for_jtbd": eligible,
        "triage_reason": reason,
        "confidence": confidence,
        "deterministic_flags": flags,
        "semantic_flags": flags,
        "observed_at": observed_at,
        "triage_json": {
            "total_text_characters": len(text),
            "non_deleted_comment_count": len(non_deleted_comments),
            "source_quality_factors": _source_quality_factors(nodes, text),
        },
    }


def _node_text(node: dict[str, Any]) -> str:
    return "\n".join(str(node.get(key) or "") for key in ("title", "body", "text")).strip()


def _is_deleted_or_removed(text: str) -> bool:
    compact = text.strip().lower()
    return compact in {"[deleted]", "[removed]", "deleted", "removed", ""}


def _is_removed_post(node: dict[str, Any]) -> bool:
    body = str(node.get("body") or "").strip()
    title = str(node.get("title") or "").strip()
    if _is_deleted_or_removed(body):
        return True
    return not title and _is_deleted_or_removed(_node_text(node))


def _looks_non_english(text: str) -> bool:
    if not text:
        return False
    ascii_letters = len(re.findall(r"[A-Za-z]", text))
    return ascii_letters < max(20, len(text) * 0.2)


def _looks_mostly_news_link(post: dict[str, Any], text: str) -> bool:
    body = str(post.get("body") or "")
    urlish = "http://" in body or "https://" in body
    return urlish and len(text) < 500


def _has_customer_discovery_signal(text: str) -> bool:
    lower = text.lower()
    return any(cue in lower for cue in CUSTOMER_DISCOVERY_CUES)


def _source_quality_factors(nodes: list[dict[str, Any]], text: str) -> list[str]:
    factors = ["self_selection_bias", "community_culture_bias", "provider_accessible_sampling"]
    if any("[deleted]" in _node_text(node).lower() or "[removed]" in _node_text(node).lower() for node in nodes):
        factors.append("moderation_or_removal_effects")
    if "lol" in text.lower() or "/s" in text.lower():
        factors.append("possible_joking_or_sarcasm")
    return factors
