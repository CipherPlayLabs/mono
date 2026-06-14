# HTTP Archive Shopify Daily Pipeline Workflow Contract

Workflow name: `CipherPlay Public Sources - HTTP Archive Shopify Daily`.

Do not use CSV import as the primary path. The production workflow runs the HTTP Archive BigQuery query directly from n8n and writes schema-native rows into the `crm` Cloud SQL database.

Do not commit service account keys, n8n credentials, Cloud SQL passwords, private domains, or sampled contact data.

## Trigger And Parameters

- Daily schedule, disabled until manual smoke testing passes.
- manual run is allowed with overrides for `crawl_date`, `client`, and `max_rows`.
- Default `client`: `desktop`
- Default `query_name`: `shopify_domains`
- Default `query_version`: `v1`
- Default initial `max_rows`: `5000`

V1 can use a configured safe `crawl_date`. Future work can query HTTP Archive crawl availability and choose the latest completed monthly crawl.

## BigQuery Execution

The workflow uses `infra/crm/bigquery/http_archive_shopify_domains.sql` and passes:

- `crawl_date`
- `client`
- `max_rows`

Run the BigQuery query directly from n8n using production service account credentials. Prefer the n8n Cloud Run runtime service account:

- Service account: `n8n-cloud-run@cipherplay-production.iam.gserviceaccount.com`
- Required project role: `roles/bigquery.jobUser` on `cipherplay-production`
- Public dataset read path: `httparchive.crawl.pages`

If the n8n BigQuery credential cannot use runtime identity and requires a JSON key, create a dedicated minimal service account, store the key in Secret Manager, import it into n8n credentials, and never commit the key or paste it into docs.

Before enabling the schedule, run a dry-run from an approved operator shell:

```bash
bq query --use_legacy_sql=false --dry_run \
  --parameter=crawl_date:DATE:2026-05-01 \
  --parameter=client:STRING:desktop \
  --parameter=max_rows:INT64:50 \
  < infra/crm/bigquery/http_archive_shopify_domains.sql
```

Record the processed-byte estimate from that dry run in this document or in `HANDOFF.md` after the live operator run. This repository change does not include a live BigQuery dry-run result because no production BigQuery credentials are committed here.

## Postgres Writes

The workflow writes to the `crm` database as `crm_writer`.

High-level steps:

1. Insert or upsert `public_sources.http_archive_runs` with status `running`.
2. Execute BigQuery directly from n8n.
3. For each returned domain row:
   - Upsert `business.websites` by `lower(domain)`.
   - Ensure `web_enrichment.website_shopify_status` exists with status `unknown`.
   - Upsert `public_sources.http_archive_observations`.
   - Ensure `business.website_lists` contains `http-archive-shopify-daily`.
   - Add the Website to `business.website_list_memberships`.
4. Update the run to status `completed` and set `row_count`.
5. On failure, update the run to status `failed` and record a concise `error_message`.

## Idempotency Keys

- `business.websites`: `lower(domain)`
- `public_sources.http_archive_runs`: `crawl_date + client + lower(query_name) + lower(query_version)`
- `public_sources.http_archive_observations`: `website_id + crawl_date + client + lower(query_name)`
- `business.website_lists`: `slug`
- `business.website_list_memberships`: `website_id + list_id`

## SQL Shapes

Start or reuse a run:

```sql
INSERT INTO public_sources.http_archive_runs (
  crawl_date,
  client,
  query_name,
  query_version,
  n8n_execution_id,
  status,
  query_params
)
VALUES ($1, $2, $3, $4, $5, 'running', $6::jsonb)
ON CONFLICT (crawl_date, client, lower(query_name), lower(query_version)) DO UPDATE
SET
  n8n_execution_id = EXCLUDED.n8n_execution_id,
  status = 'running',
  error_message = NULL,
  started_at = now(),
  completed_at = NULL,
  query_params = EXCLUDED.query_params,
  updated_at = now()
RETURNING id;
```

Upsert Website:

```sql
INSERT INTO business.websites AS website (domain, raw_input, domain_type)
VALUES ($1, $2, 'unknown')
ON CONFLICT (lower(domain)) DO UPDATE
SET
  raw_input = COALESCE(website.raw_input, EXCLUDED.raw_input),
  updated_at = now()
RETURNING id;
```

Ensure current Shopify status row:

```sql
INSERT INTO web_enrichment.website_shopify_status (website_id, status)
VALUES ($1, 'unknown')
ON CONFLICT (website_id) DO NOTHING;
```

Upsert HTTP Archive observation:

```sql
INSERT INTO public_sources.http_archive_observations (
  run_id,
  website_id,
  query_name,
  crawl_date,
  client,
  primary_root_page_url,
  best_rank,
  detected_origins,
  detected_pages,
  technologies,
  technology_categories,
  technology_info,
  sample_root_pages,
  sample_pages,
  evidence,
  observed_at
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10::text[],
  $11::jsonb,
  $12::jsonb,
  $13::jsonb,
  $14::jsonb,
  $15::jsonb,
  now()
)
ON CONFLICT (website_id, crawl_date, client, lower(query_name)) DO UPDATE
SET
  run_id = EXCLUDED.run_id,
  primary_root_page_url = EXCLUDED.primary_root_page_url,
  best_rank = EXCLUDED.best_rank,
  detected_origins = EXCLUDED.detected_origins,
  detected_pages = EXCLUDED.detected_pages,
  technologies = EXCLUDED.technologies,
  technology_categories = EXCLUDED.technology_categories,
  technology_info = EXCLUDED.technology_info,
  sample_root_pages = EXCLUDED.sample_root_pages,
  sample_pages = EXCLUDED.sample_pages,
  evidence = EXCLUDED.evidence,
  observed_at = EXCLUDED.observed_at,
  updated_at = now();
```

Complete run:

```sql
UPDATE public_sources.http_archive_runs
SET
  status = 'completed',
  row_count = $2,
  completed_at = now(),
  updated_at = now()
WHERE id = $1;
```

Fail run:

```sql
UPDATE public_sources.http_archive_runs
SET
  status = 'failed',
  error_message = left($2, 2000),
  completed_at = now(),
  updated_at = now()
WHERE id = $1;
```

## Smoke Gate

Create the n8n workflow with its daily schedule disabled first. Then run a manual 50-row smoke:

1. Confirm BigQuery returns at most 50 rolled-up domains.
2. Confirm `business.websites` upserts one canonical domain row per unique returned domain.
3. Confirm `public_sources.http_archive_runs` reaches `completed`.
4. Confirm `public_sources.http_archive_observations` row count equals unique returned Websites.
5. Confirm `web_enrichment.website_shopify_status` rows exist with `unknown` for newly observed Websites.
6. Confirm `business.website_shopify_review` and `public_sources.http_archive_shopify_review` show rows in NocoDB.
7. Enable the daily schedule only after the manual smoke passes.
