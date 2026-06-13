# CipherPlay Research Data Infrastructure

This area provisions and packages the private Reddit customer discovery v1 data system. It is separate from the public content site and exposes database tables that manual n8n workflows can use for thread extraction and normalization.

## V1 Scope

Included:

- JSON collection run config validation.
- Slow, resumable Reddit source-thread collection through Cloud Run Jobs and Cloud Scheduler.
- BigQuery source-thread rows that own the full current provider-available Reddit thread content.
- BigQuery state, indexes, thread nodes, coverage gaps, source-thread triage, source passages, evidence claims, source-quality notes, and thread-level JTBD records.
- BigQuery normalization run, normalized JTBD entity, and evidence relationship tables for staged full-corpus normalization rewrites.
- Secret Manager container references for provider credentials.

Excluded:

- Aggregate analysis.
- RBO.
- Opportunity scoring.
- Segment validation.
- Charts.
- Report claims.
- Public content-site features.
- Scheduled normalization automation.

## Layout

- `jobs/`: Python package and container for collector, triage, and thread-level JTBD analysis jobs.
- `examples/`: Safe example JSON configs only. Active configs should live in private storage.
- `opentofu/`: GCP resources and BigQuery table schemas.
- `private/` and `run-configs/`: ignored local-only areas for operator scratch files.

## OpenTofu

```bash
tofu fmt -recursive infra/research-data/opentofu
tofu -chdir=infra/research-data/opentofu init -input=false
tofu -chdir=infra/research-data/opentofu validate
```

State uses the private GCS backend bucket `cipherplay-production-opentofu-state` under prefix `infra/research-data`.

## Secret Bootstrap

OpenTofu creates the Secret Manager secret container only. Add a secret version out of band:

```bash
printf '%s' '{"client_id":"REPLACE","client_secret":"REPLACE","user_agent":"CipherPlayResearchData/0.1"}' | \
  gcloud secrets versions add reddit-api-credentials \
    --project=cipherplay-production \
    --data-file=-
```

Do not commit active config files, raw source-thread exports, provider tokens, service-account keys, or operator notes.

## Job Commands

```bash
python -m research_data collect --config-uri gs://PRIVATE_BUCKET/path/config.json
python -m research_data triage --limit 25
python -m research_data analyze --limit 10
```

Collection, thread extraction, and normalization are intentionally separate. The collector upserts the current full Source Thread into BigQuery along with indexes, checkpoints, and coverage gaps. Triage reviews every collected Source Thread. Thread extraction processes only `jtbd_eligible` threads and writes Source Passages, Evidence Claims, source-quality notes, and a Thread-Level JTBD Record. Manual n8n normalization runs perform a staged full-corpus rewrite over active Evidence Claims before promotion.
