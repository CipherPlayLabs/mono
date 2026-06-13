# Research Data Jobs

This package runs the private Reddit customer discovery v1 pipeline:

- `collect`: reads a JSON collection config, fetches provider-accessible source threads, and upserts the current full raw thread plus BigQuery current indexes/checkpoints/coverage rows.
- `triage`: reads untriaged current source threads and writes current source-thread triage rows.
- `analyze`: reads JTBD-eligible threads and writes Source Passages, Evidence Claims, source-quality notes, and Thread-Level JTBD Records.

It does not create aggregate analysis, opportunity scores, RBO results, segment validation, charts, or report claims.

Collection keeps one live provider-available Source Thread row. Re-fetches overwrite the current `source_threads.source_thread_json` and `source_threads.raw_json`, then replace current `thread_nodes` for that Source Thread. The legacy `source_thread_snapshots` table may remain managed for compatibility, but current jobs do not use it as the source of truth.

## Local Checks

```bash
PYTHONPATH=infra/research-data/jobs python3 -m unittest discover -s infra/research-data/jobs/tests -p 'test*.py' -v
PYTHONPATH=infra/research-data/jobs python3 -m research_data validate-config --config-uri infra/research-data/examples/collection-run-config.example.json
```

## Runtime Environment

Cloud Run Jobs require:

- `GCP_PROJECT_ID`
- `BIGQUERY_DATASET`
- `COLLECTION_CONFIG_URI` for collector runs

The collector reads provider credentials from the Secret Manager resource referenced inside the JSON config. The secret payload should be JSON with `client_id`, `client_secret`, and `user_agent`; optional `username` and `password` can be supplied for a script-style Reddit OAuth flow. Do not commit secret payloads or active configs.
