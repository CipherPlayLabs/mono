# Reddit JTBD Database Pipeline Workflow Contract

This contract defines the n8n workflow boundary for Reddit customer-discovery JTBD extraction and normalization. The database is the source of truth: current Reddit thread content lives in `research_data.source_threads`, source-grounded evidence lives in Source Passage and Evidence Claim tables, and normalized JTBD wording is produced by staged full-corpus normalization runs.

Do not put Reddit credentials, Google credentials, service-account keys, raw source-thread exports, or copied thread content in this file or exported workflow JSON.

## Runtime Boundary

- Database surface: BigQuery dataset `research_data`
- Source of truth: `source_threads.source_thread_json` and `source_threads.raw_json`
- Trigger style: manual trigger only for v1
- Extraction scope: one bounded batch of Source Threads per manual run
- Normalization scope: full corpus, all active Evidence Claims, all JTBD component categories
- Promotion style: staged normalization output first, then promote after validation

## Workflow: reddit-jtbd-thread-extraction

Purpose: create or replace thread-level customer-discovery evidence for current `jtbd_eligible` Source Threads.

Run manually. Select a bounded batch of eligible Source Threads whose active Thread-Level JTBD Record is missing or stale:

```sql
SELECT
  s.source_thread_id,
  s.latest_snapshot_id AS source_thread_snapshot_id,
  s.source_thread_json,
  s.latest_fetched_at,
  s.score AS thread_score,
  s.comment_count AS thread_comment_count
FROM `cipherplay-production.research_data.source_threads` s
JOIN `cipherplay-production.research_data.source_thread_triage` t
  ON s.source_thread_id = t.source_thread_id
LEFT JOIN `cipherplay-production.research_data.thread_level_jtbd_records` r
  ON s.source_thread_id = r.source_thread_id
WHERE t.triage_status = 'jtbd_eligible'
  AND (
    r.source_thread_id IS NULL
    OR s.latest_fetched_at > r.created_at
  )
ORDER BY s.latest_fetched_at ASC
LIMIT 25;
```

For each selected Source Thread:

1. Parse `source_thread_json`; do not fetch raw source content from GCS.
2. Mark existing active Source Passages, Evidence Claims, source-quality notes, and Thread-Level JTBD Record for that `source_thread_id` as stale or inactive.
3. Create exact Source Passage rows with locator metadata, passage text, passage score, thread score, and thread comment count.
4. Create Evidence Claim rows for jobs, criteria, contexts, pains, workarounds, solutions, and people roles. Include low-confidence evidence when labeled.
5. Create one Thread-Level JTBD Record that summarizes and links the Evidence Claim IDs by component type.
6. Keep the output thread-level only: no opportunity scoring, RBO, segment validation, market sizing, or cross-thread claims.

## Workflow: reddit-jtbd-normalization-rewrite

Purpose: rewrite the active normalized JTBD layer from all current active evidence.

Run manually only. Read all active Evidence Claims and their linked Source Passages and Source Threads:

```sql
SELECT
  c.evidence_claim_id,
  c.claim_type,
  c.claim_text,
  c.inference_level,
  c.confidence_level,
  c.source_thread_id,
  c.source_passage_ids,
  c.claim_json,
  s.score AS thread_score,
  s.comment_count AS thread_comment_count
FROM `cipherplay-production.research_data.evidence_claims` c
JOIN `cipherplay-production.research_data.source_threads` s
  ON c.source_thread_id = s.source_thread_id
WHERE c.active = TRUE;
```

The workflow must:

1. Normalize wording across all active Evidence Claims and all JTBD component categories in one full-corpus pass.
2. Maintain separate JTBD Taxonomies by component type: jobs, criteria, contexts, pains, workarounds, solutions, and people roles.
3. Use Reddit engagement as weighting only. Keep claim-local passage scores separate from thread-level scores and comment counts.
4. Write staged rows to `normalization_runs`, `normalized_jtbd_entities`, and `evidence_relationships`.
5. Link Evidence Claims to Normalized JTBD Entities. Do not require a separate written rationale for each grouping.
6. Store Evidence Support metrics, not universal rankings.

## Promotion Checks

Before promoting a staged normalization run:

```sql
SELECT COUNT(*) AS orphan_normalized_entities
FROM `cipherplay-production.research_data.normalized_jtbd_entities` e
LEFT JOIN `cipherplay-production.research_data.evidence_relationships` r
  ON e.normalized_jtbd_entity_id = r.normalized_jtbd_entity_id
WHERE e.normalization_run_id = @normalization_run_id
  AND r.normalized_jtbd_entity_id IS NULL;
```

```sql
SELECT COUNT(*) AS relationships_to_inactive_claims
FROM `cipherplay-production.research_data.evidence_relationships` r
JOIN `cipherplay-production.research_data.evidence_claims` c
  ON r.evidence_claim_id = c.evidence_claim_id
WHERE r.normalization_run_id = @normalization_run_id
  AND c.active IS NOT TRUE;
```

```sql
SELECT
  e.normalized_jtbd_entity_id,
  e.evidence_claim_count,
  COUNT(r.evidence_claim_id) AS linked_claim_count
FROM `cipherplay-production.research_data.normalized_jtbd_entities` e
LEFT JOIN `cipherplay-production.research_data.evidence_relationships` r
  ON e.normalized_jtbd_entity_id = r.normalized_jtbd_entity_id
WHERE e.normalization_run_id = @normalization_run_id
GROUP BY e.normalized_jtbd_entity_id, e.evidence_claim_count
HAVING e.evidence_claim_count != linked_claim_count;
```

Promotion is allowed only when these checks return zero rows or zero counts, and a spot-check can trace:

```text
Normalized JTBD Entity -> Evidence Relationship -> Evidence Claim -> Source Passage -> Source Thread
```

## Test Expectations

Each workflow must be tested manually before activation or promotion:

- Run extraction against a tiny bounded batch and verify Source Passage, Evidence Claim, and Thread-Level JTBD Record counts.
- Run normalization into staging and verify relationship counts reconcile to entity support counts.
- Verify a sample lineage chain from a normalized entity back to the source thread.
- Confirm rerunning normalization rewrites the full staged normalized layer rather than incrementally patching it.
