import hashlib
import json
import re
from datetime import datetime
from typing import Any

from .ids import research_id
from .time_utils import parse_timestamp


def build_snapshot_envelope(
    *,
    provider: str,
    community_name: str,
    provider_thread_id: str,
    raw_thread: dict[str, Any],
    fetched_at: str,
) -> dict[str, Any]:
    checksum = _json_checksum(raw_thread)
    source_thread_id = research_id("source_thread", provider, community_name, provider_thread_id)
    snapshot_id = research_id("source_thread_snapshot", source_thread_id, "current")
    thread_data = raw_thread.get("thread_listing", {}).get("data", {})
    return {
        "schema_version": "2026-06-05",
        "provider": provider,
        "community_name": community_name,
        "source_thread_id": source_thread_id,
        "source_thread_snapshot_id": snapshot_id,
        "provider_native": {
            "thread_id": provider_thread_id,
            "thread_fullname": thread_data.get("name") or f"t3_{provider_thread_id}",
            "subreddit": thread_data.get("subreddit") or community_name,
            "permalink": thread_data.get("permalink"),
            "source_url": thread_data.get("url"),
        },
        "fetched_at": fetched_at,
        "raw_checksum_sha256": checksum,
        "processing": {
            "include_full_comment_tree": True,
            "allow_chunking": True,
            "allow_truncation": False,
            "truncated": False,
        },
        "raw": raw_thread,
    }


def snapshot_object_path(
    *,
    provider: str,
    community_name: str,
    source_thread_id: str,
    snapshot_id: str,
    fetched_at: datetime,
) -> str:
    del snapshot_id, fetched_at
    safe_provider = _safe_path_component(provider)
    safe_community = _safe_path_component(community_name.strip().lstrip("r/"))
    safe_source_thread_id = _safe_path_component(source_thread_id)
    return f"current/{safe_provider}/{safe_community}/{safe_source_thread_id}.json"


class GcsSnapshotStore:
    def __init__(self, bucket_name: str):
        from google.cloud import storage  # type: ignore

        self.bucket_name = bucket_name
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

    def save_snapshot(self, envelope: dict[str, Any]) -> dict[str, Any]:
        payload = json.dumps(envelope, sort_keys=True, separators=(",", ":")).encode("utf-8")
        path = snapshot_object_path(
            provider=envelope["provider"],
            community_name=envelope["community_name"],
            source_thread_id=envelope["source_thread_id"],
            snapshot_id=envelope["source_thread_snapshot_id"],
            fetched_at=parse_timestamp(envelope["fetched_at"]),
        )
        blob = self.bucket.blob(path)
        blob.upload_from_string(payload, content_type="application/json")
        return {
            "gcs_uri": f"gs://{self.bucket_name}/{path}",
            "byte_size": len(payload),
        }

    def load_snapshot(self, gcs_uri: str) -> dict[str, Any]:
        bucket, object_name = _split_gcs_uri(gcs_uri)
        blob = self.client.bucket(bucket).blob(object_name)
        return json.loads(blob.download_as_text())


def _json_checksum(value: dict[str, Any]) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _split_gcs_uri(uri: str) -> tuple[str, str]:
    stripped = uri.removeprefix("gs://")
    bucket, _, object_name = stripped.partition("/")
    if not bucket or not object_name:
        raise ValueError(f"invalid GCS URI: {uri}")
    return bucket, object_name


def _safe_path_component(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_~-]+", "_", value)
