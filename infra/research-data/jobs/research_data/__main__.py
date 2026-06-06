import argparse
import json
import os
from typing import Any

from .bigquery_store import BigQueryResearchStore
from .collector import run_collection_batch
from .config import load_collection_config, validate_collection_config
from .ids import research_id
from .pipeline import run_analysis_batch, run_triage_batch
from .reddit_provider import RedditProvider
from .secrets import load_secret_json
from .snapshots import GcsSnapshotStore


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="CipherPlay research data jobs")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate-config")
    validate_parser.add_argument("--config-uri", required=True)

    collect_parser = subparsers.add_parser("collect")
    collect_parser.add_argument("--config-uri", default=os.getenv("COLLECTION_CONFIG_URI"))
    collect_parser.add_argument("--collection-run-id", default=os.getenv("COLLECTION_RUN_ID"))
    collect_parser.add_argument("--query-mode", default=os.getenv("COLLECTION_QUERY_MODE"))

    triage_parser = subparsers.add_parser("triage")
    triage_parser.add_argument("--limit", type=int, default=int(os.getenv("TRIAGE_BATCH_LIMIT", "25")))

    analyze_parser = subparsers.add_parser("analyze")
    analyze_parser.add_argument("--limit", type=int, default=int(os.getenv("ANALYSIS_BATCH_LIMIT", "10")))
    analyze_parser.add_argument("--max-chunk-chars", type=int, default=int(os.getenv("MAX_CHUNK_CHARS", "12000")))

    args = parser.parse_args(argv)

    if args.command == "validate-config":
        config = load_collection_config(args.config_uri)
        print(json.dumps({"valid": True, "provider": config["provider"], "community": config["community"]}))
        return 0

    if args.command == "collect":
        if not args.config_uri:
            raise SystemExit("--config-uri or COLLECTION_CONFIG_URI is required")
        config = load_collection_config(args.config_uri)
        collection_run_id = args.collection_run_id or _default_collection_run_id(
            config_uri=args.config_uri,
            config=config,
            query_mode_name=args.query_mode,
        )
        credentials = load_secret_json(config["secrets"]["provider_credentials_secret"])
        provider = RedditProvider(credentials)
        result = run_collection_batch(
            config=config,
            collection_run_id=collection_run_id,
            provider=provider,
            snapshot_store=_snapshot_store(),
            research_store=_research_store(),
            query_mode_name=args.query_mode,
        )
        print(json.dumps(result, sort_keys=True))
        return 0

    if args.command == "triage":
        result = run_triage_batch(
            research_store=_research_store(),
            snapshot_store=_snapshot_store(),
            limit=args.limit,
        )
        print(json.dumps(result, sort_keys=True))
        return 0

    if args.command == "analyze":
        result = run_analysis_batch(
            research_store=_research_store(),
            snapshot_store=_snapshot_store(),
            limit=args.limit,
            max_chunk_chars=args.max_chunk_chars,
        )
        print(json.dumps(result, sort_keys=True))
        return 0

    raise SystemExit(f"unsupported command {args.command}")


def _research_store() -> BigQueryResearchStore:
    return BigQueryResearchStore(
        project_id=_required_env("GCP_PROJECT_ID"),
        dataset_id=_required_env("BIGQUERY_DATASET"),
    )


def _snapshot_store() -> GcsSnapshotStore:
    return GcsSnapshotStore(_required_env("SNAPSHOT_BUCKET"))


def _default_collection_run_id(*, config_uri: str, config: dict[str, Any], query_mode_name: str | None) -> str:
    query_mode = query_mode_name or _first_enabled_query_mode(config)
    return research_id(
        "collection_run",
        config_uri,
        config["provider"],
        config["community"]["platform"],
        config["community"]["name"],
        query_mode,
    )


def _first_enabled_query_mode(config: dict[str, Any]) -> str:
    for mode in config["query_modes"]:
        if mode.get("enabled"):
            return mode["mode"]
    raise ValueError("no enabled query mode")


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


if __name__ == "__main__":
    raise SystemExit(main())
