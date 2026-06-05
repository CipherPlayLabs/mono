# Research Data Jobs

This package runs the private Reddit customer discovery v1 pipeline:

- `collect`: reads a JSON collection config, fetches provider-accessible source threads, stores full raw snapshots in GCS, and writes BigQuery indexes/checkpoints/coverage rows.
- `triage`: reads untriaged source-thread snapshots and writes source-thread triage rows.
- `analyze`: reads JTBD-eligible threads and writes excerpts, evidence claims, JTBD entities, source-quality notes, and thread-level JTBD records.

It does not create aggregate analysis, opportunity scores, RBO results, segment validation, charts, or report claims.

## Local Checks

```bash
PYTHONPATH=infra/research-data/jobs python3 -m unittest discover -s infra/research-data/jobs/tests -p 'test*.py' -v
PYTHONPATH=infra/research-data/jobs python3 -m research_data validate-config --config-uri infra/research-data/examples/collection-run-config.example.json
```

## Runtime Environment

Cloud Run Jobs require:

- `GCP_PROJECT_ID`
- `BIGQUERY_DATASET`
- `SNAPSHOT_BUCKET`
- `COLLECTION_CONFIG_URI` for collector runs

The collector reads provider credentials from the Secret Manager resource referenced inside the JSON config. The secret payload should be JSON with `client_id`, `client_secret`, and `user_agent`; optional `username` and `password` can be supplied for a script-style Reddit OAuth flow. Do not commit secret payloads or active configs.
