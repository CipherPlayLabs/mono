# Reddit Customer Discovery Data System Design

Date: 2026-06-05

## Goal

Build a provider-agnostic research data system that can point at a Reddit community, slowly collect provider-accessible source threads from the previous one-year lookback window, preserve the current intact raw provider-available thread, filter noisy threads, and create thread-level Jobs-to-be-Done records for customer discovery.

The v1 system stops at JTBD creation for individual threads. It does not produce aggregate conclusions, opportunity scores, RBO comparisons, validated segments, charts, or final report claims.

## Source Inputs

- `mono/CONTEXT.md`
- `abpiv-agents/skills/grill-me/`
- `abpiv-agents/skills/customer-discovery/`
- `abpiv-agents/tools/google-cloud/`
- Reddit API and search documentation reviewed on 2026-06-05
- Google Cloud product documentation for Cloud Storage, BigQuery, Cloud Run Jobs, Cloud Scheduler, and Secret Manager

## Approved Decisions

- Use the `customer-discovery` skill as the analysis methodology.
- Use JTBD Analysis First.
- Adapt the transcript pipeline to Reddit threads without changing the evidence discipline.
- Treat a Reddit thread as the preserved source unit.
- Treat post/comment passages as Source Passages.
- Preserve the full provider-available comment tree.
- Do not silently truncate large threads; chunk them when needed.
- Keep collection and analysis separate.
- Add source-thread triage between collection and JTBD analysis.
- Triage every collected source thread, but only run full JTBD extraction on eligible threads.
- Store raw Reddit content as one current full source-thread object per canonical source thread. Re-fetches overwrite/upsert the current version rather than accumulating historical snapshots.
- Keep removal capability for provider-required, legal, or operator-required cases.
- Use provider-accessible completeness, not a literal guarantee of all Reddit history.
- Target a one-year lookback window. For work started on 2026-06-05, that means threads created from 2025-06-05 through collection time.
- Use official or approved Reddit API/provider access within rate limits.
- Keep the provider interface low-coupled so a future Reddit data provider can replace the initial adapter.
- Use versioned JSON collection run configs, not YAML.
- Use Google Cloud for v1 storage and scheduled execution.
- Manage infrastructure as code with OpenTofu.
- Use BigQuery Source Thread rows as the current raw source-thread source of truth.
- Use BigQuery for collection state, indexes, triage rows, Source Passages, Evidence Claims, Thread-Level JTBD Records, staged Normalization Runs, Normalized JTBD Entities, and Evidence Relationships.
- Use Cloud Run Jobs plus Cloud Scheduler for slow, resumable collection.
- Do not store raw community data in git or the public content site.
- Do not put secrets in collection run configs; use Secret Manager references.

## Non-Goals

- No public website feature in v1.
- No operator UI in v1.
- No aggregate customer discovery report in v1.
- No opportunity scoring, RBO, segment validation, or cross-thread claims in v1.
- No provider-terms-violating scraping path.
- No model training on Reddit content.
- No raw Reddit data checked into the repository.
- No hidden manual state outside the Research data store.

## Methodology Adaptation

The `customer-discovery` skill is transcript-oriented. V1 keeps the same evidence-first discipline while replacing interview-specific units with thread-specific units.

| Transcript Methodology Unit | Reddit Thread Unit |
|---|---|
| Source file | Current Source Thread database row |
| Canonical interview | Source thread |
| Transcript excerpt | Thread excerpt |
| Atomic evidence claim | Atomic evidence claim |
| Normalized entity | Normalized JTBD entity |
| Bias review | Source-quality and bias note |
| Derived rollup | Deferred |
| Report claim | Deferred |

The required v1 lineage is:

```text
community
  -> collection run
  -> current Source Thread database row
  -> source thread
  -> thread node
  -> thread excerpt
  -> atomic evidence claim
  -> normalized JTBD entity
  -> thread-level JTBD record
```

Every material JTBD item must trace back to one or more Source Passages and the current Source Thread database row used for analysis.

## V1 Analysis Boundary

V1 analysis creates thread-level JTBD records only.

Each eligible source thread should produce a structured record containing:

- Canonical research IDs and provider-native IDs.
- Current Source Thread database row that owns the provider-available raw thread content.
- Thread metadata: community, title, author label, creation time, score/comment counts where available, permalink, fetched-at timestamp.
- Short thread summary for orientation.
- Extracted jobs.
- Extracted criteria.
- Extracted contexts.
- Extracted pains.
- Extracted workarounds.
- Extracted current or considered solutions.
- Extracted people/stakeholder roles only when the thread supports them.
- Source Passages linked to every extracted item.
- Inference level for each item: `direct`, `strong_inference`, `weak_inference`, or `unsupported`.
- Confidence level for each item: `high`, `medium`, `low`, or `none`.
- Source-quality and bias notes.
- Unanswered follow-up questions.

The record must not claim cross-thread prevalence, segment validation, importance scores, satisfaction scores, opportunity scores, or market conclusions.

## Bias Handling

Reddit removes interviewer-leading bias from the collection source, but it does not remove bias from the evidence. V1 should replace interview-bias review with source/data-bias review.

Bias and quality factors to capture:

- Self-selection bias.
- Sampling bias from provider-accessible data.
- Moderation and removal effects.
- Algorithmic visibility and sort/search effects.
- Community culture and subreddit norms.
- Performative commenting, joking, sarcasm, or status signaling.
- Duplicate/crosspost discussion.
- Off-topic drift.
- News/link reactions rather than customer experience.
- Recall bias in user stories.
- Strategic bias when posters are vendors, promoters, competitors, or advocates.
- Interpretation bias from the analyst or model.

Bias notes affect confidence. Low/no-confidence evidence can stay in the data model for lineage, but it should not support later aggregate reporting unless a future layer explicitly reviews and promotes it.

## Source-Thread Triage

Source-thread triage is a required layer between collection and JTBD creation.

Every collected source thread gets a triage row. Triage preserves rejected threads; it does not delete them.

Recommended triage statuses:

- `jtbd_eligible`
- `low_signal`
- `off_topic`
- `duplicate_discussion`
- `mostly_news_link`
- `mostly_jokes`
- `deleted_or_removed`
- `insufficient_context`
- `non_english`
- `needs_review`

Use hybrid triage:

1. Deterministic checks for obvious exclusions.
2. AI semantic triage for customer-discovery usefulness.

Deterministic checks should handle time window, deleted/removed body, empty or very short threads, missing comments, duplicate/crosspost indicators, language constraints, and link-only/news-only patterns.

AI triage should look for evidence of real customer jobs, pain, workarounds, current solutions, evaluation criteria, usage context, switching behavior, or buying/decision context.

## Collection Scope

The collector should slowly gather every provider-accessible source thread in the configured one-year lookback window for a target community.

The system must record coverage limits rather than pretending completeness when the provider cannot expose all history. Coverage notes should include:

- API listing/search mode used.
- Time window requested.
- Last successful cursor or provider token.
- Provider rate-limit events.
- Missing or inaccessible thread/comment counts if known.
- Comment tree expansion failures.
- Deleted, removed, locked, quarantined, private, or unavailable content encountered.
- Search/listing limitations observed during the run.

## Lossless Thread Handling

Current raw source-thread objects should preserve the full provider-available thread:

- Starting post.
- Full provider-available comment tree.
- Parent/child relationships.
- Provider-native IDs.
- Provider-native timestamps and metadata.
- Fetch metadata.
- Permalink and source URL.
- API/provider response metadata.

Large threads may be chunked for JTBD processing. Chunking must preserve tree locators and parent/child context. Omitted content is a processing failure or explicit coverage gap, not normal behavior.

## Provider-Agnostic Data Model

The system stores both provider-native identity and canonical research identity.

Provider-native fields include Reddit fullnames, short IDs, subreddit names, permalinks, parent IDs, comment IDs, API response fields, and provider cursors.

Canonical research IDs should be used across the Research data store and analysis layers:

- `community_source_id`
- `collection_run_id`
- `source_thread_id`
- `source_thread_snapshot_id` (legacy schema name for the current raw-thread version)
- `thread_node_id`
- `thread_excerpt_id`
- `evidence_claim_id`
- `jtbd_entity_id`
- `jtbd_record_id`
- `analysis_batch_id`

Customer discovery analysis should link through canonical IDs so the Reddit adapter can be replaced later.

## Collection Run Config

Collection runs use versioned JSON.

Example:

```json
{
  "schema_version": "2026-06-05",
  "provider": "reddit",
  "community": {
    "platform": "reddit",
    "name": "smallbusiness",
    "display_name": "r/smallbusiness"
  },
  "lookback": {
    "mode": "one_year",
    "start_date": "2025-06-05",
    "end_date": "2026-06-05"
  },
  "collection": {
    "goal": "provider_accessible_backfill",
    "include_full_comment_tree": true,
    "respect_rate_limits": true,
    "max_requests_per_batch": 100,
    "batch_pause_seconds": 60
  },
  "query_modes": [
    {
      "mode": "new",
      "enabled": true
    },
    {
      "mode": "top",
      "time_filter": "year",
      "enabled": true
    },
    {
      "mode": "search",
      "time_filter": "year",
      "sort": "new",
      "queries": [],
      "enabled": false
    }
  ],
  "triage": {
    "enabled": true,
    "language": "en",
    "minimum_signal": {
      "minimum_total_text_characters": 500,
      "minimum_non_deleted_comments": 2,
      "allow_ai_review_below_threshold": true
    }
  },
  "analysis": {
    "mode": "jtbd_first",
    "run_automatically_after_collection": false,
    "thread_level_only": true,
    "allow_chunking": true,
    "allow_truncation": false
  },
  "secrets": {
    "provider_credentials_secret": "projects/cipherplay-production/secrets/reddit-api-credentials"
  }
}
```

Reusable examples and JSON schema may live in git. Active run configs, run state, and operator notes should live in private storage and BigQuery. Configs must not contain API secrets.

## Google Cloud Architecture

Recommended v1 resources:

- BigQuery dataset for Source Threads, collection state, provider-neutral indexes, triage, Source Passages, Evidence Claims, Thread-Level JTBD Records, Normalization Runs, Normalized JTBD Entities, and Evidence Relationships.
- Secret Manager secrets for Reddit/API provider credentials.
- Cloud Run Job for collection batches.
- Cloud Run Job or separate task for triage and JTBD analysis batches.
- Cloud Scheduler triggers for slow resumable collection.
- Service accounts with least-privilege IAM.
- Cloud Logging for job diagnostics.

Suggested repo location:

```text
infra/research-data/
  README.md
  opentofu/
    versions.tf
    providers.tf
    variables.tf
    locals.tf
    gcp.tf
    iam.tf
    outputs.tf
  jobs/
    collector/
    analysis/
```

Suggested workflows:

- `.github/workflows/research-data-validate.yml`
- `.github/workflows/research-data-apply.yml`

Mutating infrastructure workflows should use production approval, following the existing repo pattern for n8n and analytics.

## BigQuery Tables

The exact schema can be refined during implementation, but v1 should include these table concepts:

- `community_sources`: provider-neutral community/source registry.
- `collection_run_configs`: versioned JSON configs and validation status.
- `collection_runs`: run lifecycle and operator metadata.
- `collection_checkpoints`: provider cursors, query modes, and resume state.
- `source_threads`: one row per canonical thread.
- `source_thread_snapshots`: legacy compatibility table; current jobs should not use it as the source of truth.
- `thread_nodes`: current post/comment tree nodes with canonical IDs and provider-native IDs.
- `coverage_gaps`: explicit missing/incomplete/provider-limited data notes.
- `source_thread_triage`: eligibility status, reason, confidence, deterministic and AI flags.
- `analysis_batches`: explicit analysis run metadata.
- `source_passages`: exact source passages selected for evidence.
- `evidence_claims`: atomic JTBD-relevant claims linked to Source Passages.
- `thread_level_jtbd_records`: per-thread extraction summaries and links to Evidence Claim IDs.
- `normalization_runs`: staged or active full-corpus normalization rewrite metadata.
- `normalized_jtbd_entities`: normalized jobs, criteria, contexts, pains, workarounds, solutions, and people roles.
- `evidence_relationships`: links from Evidence Claims to Normalized JTBD Entities.
- `source_quality_notes`: bias and quality notes that affect confidence.

Do not add aggregate rollup, RBO, opportunity scoring, segment, chart, or report-claim tables in v1. Future migrations can add those layers after thread-level JTBD creation is working.

## Data Flow

1. Operator prepares or selects a versioned JSON collection run config.
2. Config is validated and stored privately.
3. Cloud Scheduler triggers the collector Cloud Run Job.
4. Collector reads the config and latest BigQuery checkpoint.
5. Collector calls the provider adapter under rate limits.
6. Collector writes the full current source-thread object into the Source Thread database row.
7. Collector upserts source thread and thread node rows; writes checkpoint and coverage rows to BigQuery.
8. Collector exits.
9. Repeat scheduled batches until the provider-accessible one-year backfill is complete or blocked.
10. Operator or scheduler starts source-thread triage.
11. Triage writes eligibility rows and source-quality notes.
12. Operator starts an analysis batch for eligible threads.
13. Analysis reads current full Source Thread database rows, chunks large trees if needed, creates Source Passages, Evidence Claims, and Thread-Level JTBD Records.
14. Manual n8n normalization reads all active Evidence Claims across all JTBD component categories, writes a staged full-corpus Normalization Run, and promotes it only after lineage and support checks pass.

## Security And Compliance

- Keep raw Reddit/community data private.
- Do not expose the Research data store through the public content site.
- Do not commit raw source-thread exports.
- Do not commit API credentials or provider tokens.
- Use Secret Manager for provider credentials.
- Use least-privilege service accounts.
- Store provider-native IDs and the current raw object for audit and replay.
- Keep deletion/removal capability for provider-required, legal, or operator-required removal even though the normal retention posture has no voluntary expiry.
- Respect provider rate limits and access rules.
- Record coverage gaps and provider limitations.

## Verification Expectations

Implementation should include local and CI checks for:

- JSON config schema validation.
- Provider adapter unit tests with fixture data.
- Snapshot object path generation.
- BigQuery row mapping from provider-native JSON to canonical IDs.
- Checkpoint/resume behavior.
- Deterministic triage rules.
- Chunking without truncation for large thread fixtures.
- JTBD extraction output shape with lineage back to Source Passages and Source Threads.
- OpenTofu formatting and validation.

Example infrastructure checks:

```bash
tofu fmt -check -recursive infra/research-data/opentofu
tofu -chdir=infra/research-data/opentofu init -input=false
tofu -chdir=infra/research-data/opentofu validate
```

## Risks And Mitigations

- Provider APIs may not expose exhaustive one-year history for high-volume communities. Mitigate by storing coverage gaps and keeping the provider adapter swappable.
- Large comment trees may exceed model context limits. Mitigate with deterministic chunking and no truncation.
- Reddit discussion is not interview data. Mitigate by using source/data-bias notes and avoiding aggregate claims in v1.
- AI triage can discard useful evidence. Mitigate by preserving current Source Thread database rows, recording triage reasons, and supporting `needs_review`.
- Raw community data creates privacy and terms risk. Mitigate with private storage, least privilege, deletion capability, and no public-site integration.
- Provider coupling can leak into analysis. Mitigate by using canonical research IDs and provider-neutral BigQuery schemas.

## Implementation Outline

1. Add `infra/research-data` documentation and OpenTofu scaffolding.
2. Define BigQuery schemas for v1 tables.
3. Define and test the JSON collection run config schema.
4. Build a provider interface with a Reddit adapter as the first implementation.
5. Build current raw-thread persistence into Source Thread database rows.
6. Build BigQuery indexing, checkpoints, and coverage-gap writes.
7. Add Cloud Run Job packaging for the collector.
8. Add Cloud Scheduler and IAM through OpenTofu.
9. Build source-thread triage as a separate job or command.
10. Build thread-level JTBD extraction as a separate analysis job or command using the `customer-discovery` methodology.
11. Add fixture-based tests for full-depth thread preservation, chunking, triage, and JTBD lineage.
12. Add validation workflows.

## Next Agent Prompt

```text
You are working in /Users/user/Documents/CipherPlay Content Site/mono. Implement the Reddit customer discovery research data system described in docs/superpowers/specs/2026-06-05-reddit-customer-discovery-data-system-design.md.

Use the local skills/guidance:
- /Users/user/Documents/CipherPlay Content Site/abpiv-agents/skills/customer-discovery/
- /Users/user/Documents/CipherPlay Content Site/abpiv-agents/tools/google-cloud/

Important constraints:
- V1 is collection, source-thread triage, and thread-level JTBD creation only.
- Do not build aggregate analysis, RBO, opportunity scoring, segment validation, charts, or report claims.
- Use JSON collection run configs, not YAML.
- Keep raw Reddit/community data out of git and out of the public content site.
- Use BigQuery Source Thread rows for full provider-available current raw source-thread content.
- Use BigQuery for run state, indexes, triage, Source Passages, Evidence Claims, Normalized JTBD Entities, Evidence Relationships, source-quality notes, and Thread-Level JTBD Records.
- Use Cloud Run Jobs plus Cloud Scheduler for slow resumable collection.
- Manage GCP resources with OpenTofu under a new infra/research-data area.
- Keep collection and analysis separate.
- Add source-thread triage between collection and JTBD extraction.
- Preserve full provider-available comment trees. Chunk large threads if needed, but do not truncate.
- Use provider-neutral canonical research IDs while preserving Reddit-native IDs and raw JSON for audit/replay.
- Respect Reddit/API provider rate limits and record provider-accessible coverage gaps.
- Do not store API credentials in config files; use Secret Manager references.
- Leave unrelated local changes alone, especially any existing edits in infra/n8n/opentofu/locals.tf.

Start by reading the design spec and current mono/CONTEXT.md, then create a concrete implementation plan before editing code.
```
