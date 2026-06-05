from typing import Any

from .ids import research_id
from .time_utils import iso_from_utc_seconds


def flatten_reddit_thread_nodes(snapshot_envelope: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    raw = snapshot_envelope["raw"]
    source_thread_id = snapshot_envelope["source_thread_id"]
    snapshot_id = snapshot_envelope["source_thread_snapshot_id"]
    post = raw.get("thread_listing", {}).get("data", {})
    post_fullname = post.get("name") or f"t3_{post.get('id')}"
    nodes: list[dict[str, Any]] = [_build_post_node(snapshot_envelope, post)]
    gaps: list[dict[str, Any]] = []
    seen = {post_fullname}

    def add_comment(kind: str, data: dict[str, Any], depth: int) -> None:
        fullname = data.get("name") or f"{kind}_{data.get('id')}"
        if not fullname or fullname in seen:
            return
        seen.add(fullname)
        nodes.append(_build_comment_node(source_thread_id, snapshot_id, kind, data, depth))
        replies = data.get("replies")
        if isinstance(replies, dict):
            for child in replies.get("data", {}).get("children", []):
                walk_child(child, depth + 1)

    def walk_child(child: dict[str, Any], depth: int) -> None:
        kind = child.get("kind")
        data = child.get("data", {})
        if kind == "t1":
            add_comment(kind, data, depth)
        elif kind == "more":
            children = data.get("children") or []
            expanded = _morechildren_expanded(raw, children)
            if not expanded:
                gaps.append(
                    {
                        "gap_type": "comment_tree_expansion_missing",
                        "description": "Provider returned a morechildren placeholder that was not expanded.",
                        "severity": "warning",
                        "provider_native_json": data,
                    }
                )

    for child in raw.get("comments_listing", {}).get("data", {}).get("children", []):
        walk_child(child, 1)

    parent_depth = {node["provider_fullname"]: node["node_depth"] for node in nodes}
    for response in raw.get("morechildren", []):
        things = response.get("response", {}).get("json", {}).get("data", {}).get("things", [])
        if not things:
            gaps.append(
                {
                    "gap_type": "comment_tree_expansion_empty",
                    "description": "Provider morechildren expansion returned no comment things.",
                    "severity": "warning",
                    "provider_native_json": response.get("request", {}),
                }
            )
        for thing in things:
            data = thing.get("data", {})
            parent = data.get("parent_id")
            add_comment(thing.get("kind", "t1"), data, parent_depth.get(parent, 0) + 1)

    return nodes, gaps


def _build_post_node(snapshot_envelope: dict[str, Any], post: dict[str, Any]) -> dict[str, Any]:
    source_thread_id = snapshot_envelope["source_thread_id"]
    snapshot_id = snapshot_envelope["source_thread_snapshot_id"]
    fullname = post.get("name") or f"t3_{post.get('id')}"
    body = post.get("selftext") or ""
    title = post.get("title") or ""
    return {
        "thread_node_id": research_id("thread_node", source_thread_id, fullname),
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "node_type": "post",
        "provider_kind": "t3",
        "provider_native_id": post.get("id"),
        "provider_fullname": fullname,
        "provider_parent_fullname": None,
        "provider_link_fullname": fullname,
        "node_depth": 0,
        "title": title,
        "body": body,
        "text": "\n\n".join(part for part in [title, body] if part),
        "author_label": _author_label(post.get("author")),
        "created_at": iso_from_utc_seconds(post.get("created_utc")),
        "score": post.get("score"),
        "permalink": post.get("permalink"),
        "raw_json": post,
    }


def _build_comment_node(
    source_thread_id: str,
    snapshot_id: str,
    kind: str,
    data: dict[str, Any],
    depth: int,
) -> dict[str, Any]:
    fullname = data.get("name") or f"{kind}_{data.get('id')}"
    return {
        "thread_node_id": research_id("thread_node", source_thread_id, fullname),
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "node_type": "comment",
        "provider_kind": kind,
        "provider_native_id": data.get("id"),
        "provider_fullname": fullname,
        "provider_parent_fullname": data.get("parent_id"),
        "provider_link_fullname": data.get("link_id"),
        "node_depth": depth,
        "title": None,
        "body": data.get("body") or "",
        "text": data.get("body") or "",
        "author_label": _author_label(data.get("author")),
        "created_at": iso_from_utc_seconds(data.get("created_utc")),
        "score": data.get("score"),
        "permalink": data.get("permalink"),
        "raw_json": data,
    }


def _morechildren_expanded(raw: dict[str, Any], child_ids: list[str]) -> bool:
    requested = set(child_ids)
    for response in raw.get("morechildren", []):
        response_ids = set(response.get("request", {}).get("children", []))
        if requested and requested.issubset(response_ids):
            return True
    return False


def _author_label(author: Any) -> str | None:
    if author in (None, "", "[deleted]"):
        return None
    return str(author)
