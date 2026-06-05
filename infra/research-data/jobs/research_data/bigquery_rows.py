from typing import Any

from .ids import research_id
from .reddit_mapping import flatten_reddit_thread_nodes


def build_collection_rows(
    *,
    collection_run_id: str,
    config: dict[str, Any],
    snapshot_envelope: dict[str, Any],
    snapshot_gcs_uri: str,
    byte_size: int,
    coverage_gaps: list[dict[str, Any]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    community = config["community"]
    community_source_id = research_id("community_source", community["platform"], community["name"])
    raw = snapshot_envelope["raw"]
    post = raw.get("thread_listing", {}).get("data", {})
    source_thread_id = snapshot_envelope["source_thread_id"]
    snapshot_id = snapshot_envelope["source_thread_snapshot_id"]
    nodes, mapping_gaps = flatten_reddit_thread_nodes(snapshot_envelope)
    all_gaps = list(coverage_gaps or []) + mapping_gaps

    source_thread = {
        "source_thread_id": source_thread_id,
        "community_source_id": community_source_id,
        "collection_run_id": collection_run_id,
        "provider": snapshot_envelope["provider"],
        "community_name": community["name"],
        "provider_thread_id": post.get("id") or snapshot_envelope["provider_native"]["thread_id"],
        "provider_thread_fullname": post.get("name") or snapshot_envelope["provider_native"]["thread_fullname"],
        "title": post.get("title"),
        "author_label": post.get("author"),
        "created_at": nodes[0]["created_at"],
        "score": post.get("score"),
        "comment_count": post.get("num_comments"),
        "permalink": post.get("permalink"),
        "source_url": post.get("url"),
        "latest_snapshot_id": snapshot_id,
        "latest_fetched_at": snapshot_envelope["fetched_at"],
        "provider_native_json": post,
    }

    snapshot_row = {
        "source_thread_snapshot_id": snapshot_id,
        "source_thread_id": source_thread_id,
        "collection_run_id": collection_run_id,
        "provider": snapshot_envelope["provider"],
        "gcs_uri": snapshot_gcs_uri,
        "raw_checksum_sha256": snapshot_envelope["raw_checksum_sha256"],
        "byte_size": byte_size,
        "fetched_at": snapshot_envelope["fetched_at"],
        "fetch_metadata_json": raw.get("fetch_metadata", {}),
        "processing_json": snapshot_envelope["processing"],
    }

    thread_nodes = []
    for node in nodes:
        row = dict(node)
        row["collection_run_id"] = collection_run_id
        thread_nodes.append(row)

    coverage_rows = []
    for gap in all_gaps:
        coverage_rows.append(
            {
                "coverage_gap_id": research_id("coverage_gap", collection_run_id, source_thread_id, gap),
                "collection_run_id": collection_run_id,
                "community_source_id": community_source_id,
                "source_thread_id": source_thread_id,
                "source_thread_snapshot_id": snapshot_id,
                "provider": snapshot_envelope["provider"],
                "gap_type": gap.get("gap_type", "provider_accessible_gap"),
                "severity": gap.get("severity", "note"),
                "description": gap.get("description", ""),
                "observed_at": snapshot_envelope["fetched_at"],
                "details_json": gap,
            }
        )

    return {
        "source_threads": [source_thread],
        "source_thread_snapshots": [snapshot_row],
        "thread_nodes": thread_nodes,
        "coverage_gaps": coverage_rows,
    }
