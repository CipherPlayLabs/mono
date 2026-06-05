import copy
import json
from datetime import date
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "2026-06-05"
SENSITIVE_INLINE_KEYS = {
    "access_token",
    "api_key",
    "bearer_token",
    "client_secret",
    "password",
    "refresh_token",
    "token",
}


class ConfigValidationError(ValueError):
    pass


def load_collection_config(uri: str) -> dict[str, Any]:
    if uri.startswith("gs://"):
        bucket_name, object_name = _split_gcs_uri(uri)
        from google.cloud import storage  # type: ignore

        client = storage.Client()
        text = client.bucket(bucket_name).blob(object_name).download_as_text()
        raw = json.loads(text)
    else:
        raw = json.loads(Path(uri).read_text())
    return validate_collection_config(raw)


def validate_collection_config(config: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(config, dict):
        raise ConfigValidationError("collection run config must be a JSON object")

    normalized = copy.deepcopy(config)
    _reject_inline_secrets(normalized)

    _require(normalized, "schema_version")
    _require(normalized, "provider")
    _require(normalized, "community")
    _require(normalized, "lookback")
    _require(normalized, "collection")
    _require(normalized, "query_modes")
    _require(normalized, "triage")
    _require(normalized, "analysis")
    _require(normalized, "secrets")

    if normalized["schema_version"] != SCHEMA_VERSION:
        raise ConfigValidationError(f"schema_version must be {SCHEMA_VERSION}")
    if normalized["provider"] != "reddit":
        raise ConfigValidationError("provider must be reddit for v1")

    community = normalized["community"]
    if community.get("platform") != "reddit":
        raise ConfigValidationError("community.platform must be reddit")
    if not isinstance(community.get("name"), str) or not community["name"].strip():
        raise ConfigValidationError("community.name is required")
    community["name"] = community["name"].strip().lstrip("r/")

    lookback = normalized["lookback"]
    if lookback.get("mode") != "one_year":
        raise ConfigValidationError("lookback.mode must be one_year")
    start_date = _parse_date(lookback.get("start_date"), "lookback.start_date")
    end_date = _parse_date(lookback.get("end_date"), "lookback.end_date")
    if start_date > end_date:
        raise ConfigValidationError("lookback.start_date must be before lookback.end_date")

    collection = normalized["collection"]
    if collection.get("goal") != "provider_accessible_backfill":
        raise ConfigValidationError("collection.goal must be provider_accessible_backfill")
    if collection.get("include_full_comment_tree") is not True:
        raise ConfigValidationError("collection must request the full comment tree")
    if collection.get("respect_rate_limits") is not True:
        raise ConfigValidationError("collection must respect provider rate limits")
    if int(collection.get("max_requests_per_batch", 0)) <= 0:
        raise ConfigValidationError("collection.max_requests_per_batch must be positive")
    if int(collection.get("batch_pause_seconds", 0)) < 0:
        raise ConfigValidationError("collection.batch_pause_seconds cannot be negative")

    query_modes = normalized["query_modes"]
    if not isinstance(query_modes, list) or not query_modes:
        raise ConfigValidationError("query_modes must be a non-empty list")
    valid_modes = {"new", "top", "search"}
    if not any(mode.get("enabled") for mode in query_modes):
        raise ConfigValidationError("at least one query mode must be enabled")
    for mode in query_modes:
        if mode.get("mode") not in valid_modes:
            raise ConfigValidationError(f"unsupported query mode {mode.get('mode')}")
        if "enabled" not in mode:
            raise ConfigValidationError("every query mode must include enabled")
        if mode.get("mode") == "search" and mode.get("enabled") and not isinstance(mode.get("queries", []), list):
            raise ConfigValidationError("enabled search mode must provide a queries list")

    triage = normalized["triage"]
    if triage.get("enabled") is not True:
        raise ConfigValidationError("triage.enabled must be true")
    if triage.get("language") != "en":
        raise ConfigValidationError("v1 triage only supports language en")

    analysis = normalized["analysis"]
    if analysis.get("mode") != "jtbd_first":
        raise ConfigValidationError("analysis.mode must be jtbd_first")
    if analysis.get("thread_level_only") is not True:
        raise ConfigValidationError("analysis.thread_level_only must be true")
    if analysis.get("allow_chunking") is not True:
        raise ConfigValidationError("analysis.allow_chunking must be true")
    if analysis.get("allow_truncation") is not False:
        raise ConfigValidationError("analysis must not allow truncation")

    secret_ref = normalized["secrets"].get("provider_credentials_secret")
    if not isinstance(secret_ref, str) or not secret_ref.startswith("projects/"):
        raise ConfigValidationError("secrets.provider_credentials_secret must be a Secret Manager resource reference")

    return normalized


def _require(config: dict[str, Any], key: str) -> None:
    if key not in config:
        raise ConfigValidationError(f"missing required key {key}")


def _parse_date(value: Any, label: str) -> date:
    if not isinstance(value, str):
        raise ConfigValidationError(f"{label} must be an ISO date string")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ConfigValidationError(f"{label} must be an ISO date string") from exc


def _reject_inline_secrets(value: Any, path: tuple[str, ...] = ()) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = path + (str(key),)
            if child_path == ("secrets", "provider_credentials_secret"):
                continue
            if str(key).lower() in SENSITIVE_INLINE_KEYS:
                raise ConfigValidationError(f"inline secret value is not allowed at {'.'.join(child_path)}")
            _reject_inline_secrets(child, child_path)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _reject_inline_secrets(child, path + (str(index),))


def _split_gcs_uri(uri: str) -> tuple[str, str]:
    stripped = uri.removeprefix("gs://")
    bucket, _, object_name = stripped.partition("/")
    if not bucket or not object_name:
        raise ConfigValidationError(f"invalid GCS URI: {uri}")
    return bucket, object_name
