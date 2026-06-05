from datetime import date
from typing import Any

from .bigquery_rows import build_collection_rows
from .config import validate_collection_config
from .ids import research_id
from .snapshots import build_snapshot_envelope
from .time_utils import date_from_utc_seconds, utc_now_iso


def run_collection_batch(
    *,
    config: dict[str, Any],
    collection_run_id: str,
    provider: Any,
    snapshot_store: Any,
    research_store: Any,
    fetched_at: str | None = None,
    query_mode_name: str | None = None,
) -> dict[str, Any]:
    config = validate_collection_config(config)
    fetched_at = fetched_at or utc_now_iso()
    query_mode = _select_query_mode(config, query_mode_name)
    max_requests = int(config["collection"]["max_requests_per_batch"])
    checkpoint = research_store.get_latest_checkpoint(collection_run_id, query_mode["mode"])
    page = provider.list_thread_refs(config, checkpoint, max_requests)
    refs = page.get("refs", [])
    page_gaps = page.get("coverage_gaps", [])
    threads_fetched = 0
    rows_written = 0
    skipped_outside_window = 0

    for index, thread_ref in enumerate(refs):
        if not _thread_in_lookback(thread_ref, config):
            skipped_outside_window += 1
            continue

        raw_thread = provider.fetch_thread(thread_ref)
        envelope = build_snapshot_envelope(
            provider=config["provider"],
            community_name=config["community"]["name"],
            provider_thread_id=thread_ref["provider_thread_id"],
            raw_thread=raw_thread,
            fetched_at=fetched_at,
        )
        saved = snapshot_store.save_snapshot(envelope)
        coverage_gaps = page_gaps if index == 0 else []
        rows = build_collection_rows(
            collection_run_id=collection_run_id,
            config=config,
            snapshot_envelope=envelope,
            snapshot_gcs_uri=saved["gcs_uri"],
            byte_size=saved["byte_size"],
            coverage_gaps=coverage_gaps,
        )
        research_store.write_collection_rows(rows)
        rows_written += sum(len(value) for value in rows.values())
        threads_fetched += 1

    checkpoint_row = {
        "collection_checkpoint_id": research_id(
            "collection_checkpoint",
            collection_run_id,
            query_mode["mode"],
            page.get("checkpoint", {}),
            fetched_at,
        ),
        "collection_run_id": collection_run_id,
        "provider": config["provider"],
        "query_mode": query_mode["mode"],
        "checkpoint_json": page.get("checkpoint", {}),
        "recorded_at": fetched_at,
        "coverage_json": {
            "coverage_gaps": page_gaps,
            "skipped_outside_window": skipped_outside_window,
        },
    }
    research_store.write_checkpoint(checkpoint_row)

    return {
        "collection_run_id": collection_run_id,
        "query_mode": query_mode["mode"],
        "threads_seen": len(refs),
        "threads_fetched": threads_fetched,
        "rows_written": rows_written,
        "skipped_outside_window": skipped_outside_window,
    }


def _select_query_mode(config: dict[str, Any], query_mode_name: str | None) -> dict[str, Any]:
    enabled = [mode for mode in config["query_modes"] if mode.get("enabled")]
    if query_mode_name:
        for mode in enabled:
            if mode["mode"] == query_mode_name:
                return mode
        raise ValueError(f"query mode is not enabled: {query_mode_name}")
    return enabled[0]


def _thread_in_lookback(thread_ref: dict[str, Any], config: dict[str, Any]) -> bool:
    created = thread_ref.get("created_date") or date_from_utc_seconds(thread_ref.get("created_utc"))
    if not created:
        return True
    start = date.fromisoformat(config["lookback"]["start_date"])
    end = date.fromisoformat(config["lookback"]["end_date"])
    created_date = date.fromisoformat(created)
    return start <= created_date <= end
