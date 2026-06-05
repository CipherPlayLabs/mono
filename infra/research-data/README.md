# CipherPlay Research Data Infrastructure

This area provisions and packages the private Reddit customer discovery v1 data system. It is separate from the public content site and from n8n.

## V1 Scope

Included:

- JSON collection run config validation.
- Slow, resumable Reddit source-thread collection through Cloud Run Jobs and Cloud Scheduler.
- GCS storage for full provider-available raw source-thread snapshots.
- BigQuery state, indexes, thread nodes, coverage gaps, source-thread triage, excerpts, evidence claims, normalized JTBD entities, source-quality notes, and thread-level JTBD records.
- Secret Manager container references for provider credentials.

Excluded:

- Aggregate analysis.
- RBO.
- Opportunity scoring.
- Segment validation.
- Charts.
- Report claims.
- Public content-site features.

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

Do not commit active config files, raw source-thread snapshots, provider tokens, service-account keys, or operator notes.

## Job Commands

```bash
python -m research_data collect --config-uri gs://PRIVATE_BUCKET/path/config.json
python -m research_data triage --limit 25
python -m research_data analyze --limit 10
```

Collection and analysis are intentionally separate. The collector writes raw snapshots, indexes, checkpoints, and coverage gaps only. Triage reviews every collected source thread. Analysis processes only `jtbd_eligible` threads and writes thread-level JTBD rows with excerpt lineage.
