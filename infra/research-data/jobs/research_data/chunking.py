from typing import Any

from .ids import research_id


def chunk_thread_nodes(nodes: list[dict[str, Any]], max_chars: int = 12000) -> list[dict[str, Any]]:
    if max_chars <= 0:
        raise ValueError("max_chars must be positive")
    chunks: list[dict[str, Any]] = []
    current: list[dict[str, Any]] = []
    current_chars = 0

    for node in nodes:
        node_chars = len(_node_text(node))
        if current and current_chars + node_chars > max_chars:
            chunks.append(_build_chunk(chunks, current, current_chars))
            current = []
            current_chars = 0
        current.append(node)
        current_chars += node_chars

    if current:
        chunks.append(_build_chunk(chunks, current, current_chars))

    return chunks


def _build_chunk(existing: list[dict[str, Any]], nodes: list[dict[str, Any]], char_count: int) -> dict[str, Any]:
    source_thread_id = nodes[0]["source_thread_id"]
    index = len(existing)
    return {
        "analysis_chunk_id": research_id("analysis_chunk", source_thread_id, index, [n["thread_node_id"] for n in nodes]),
        "source_thread_id": source_thread_id,
        "chunk_index": index,
        "nodes": list(nodes),
        "thread_node_ids": [node["thread_node_id"] for node in nodes],
        "char_count": char_count,
        "truncated": False,
    }


def _node_text(node: dict[str, Any]) -> str:
    return "\n".join(str(node.get(key) or "") for key in ("title", "body", "text")).strip()
