# HTTP Archive Shopify Daily Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily API-pure n8n pipeline that queries HTTP Archive BigQuery for Shopify-observed domains, stores canonical domains in `business.websites`, stores source evidence in `public_sources`, stores live Shopify checks in `web_enrichment`, and keeps CRM focused on people, groups, and campaigns.

**Architecture:** Keep one Cloud SQL database named `crm`, but split domain ownership with Postgres schemas: `business`, `person`, `crm`, `public_sources`, and `web_enrichment`. Migrate existing flat `public.crm_*` tables into schema-native tables without data loss, add temporary read-only compatibility views for old names, then update n8n workflows to write schema-native tables. The HTTP Archive workflow runs daily from n8n using a production service account, queries BigQuery directly, upserts `business.websites`, and records one `public_sources.http_archive_observations` row per Website per crawl/query.

**Tech Stack:** PostgreSQL 16 on Cloud SQL, self-hosted n8n on Cloud Run, Google BigQuery public `httparchive.crawl.pages`, Python standard-library schema tests, NocoDB as operator UI over Postgres schemas/views.

---

## Resolved Design Decisions

- One Cloud SQL database remains the operational database: `crm`.
- Domain separation happens with Postgres schemas, not separate databases.
- `business.websites` is the only canonical domain registry.
- `business.websites` means domain identity only, not company, brand, account, or storefront.
- Source and enrichment tables must link to `business.websites.id`; they should not duplicate canonical domain fields.
- `domain_type` stays on `business.websites` because it describes the domain identity.
- `person.email_addresses` stores personal, role, and unknown email addresses.
- `person.people` stores human identities.
- `crm.groups` is people-only in V1.
- `crm.campaigns` targets people only in V1; business/website campaigns are future work.
- HTTP Archive source tables are named by source, not by the current Shopify query.
- HTTP Archive observations are rolled up to one row per Website per crawl/query, not one row per raw page.
- Web enrichment stores current Shopify status and evidence only in V1; no attempt-history table yet.
- Old `public.crm_*` names may exist as temporary read-only compatibility views, but new writes must use schema-native names.
- n8n runs BigQuery directly as a daily production workflow; no CSV handoff as the primary path.
- BigQuery execution should use production service-account credentials, not Allan's local `gcloud` auth.

---

## Target Schemas

```text
business
  websites
  website_lists
  website_list_memberships
  website_shopify_review

person
  people
  email_addresses
  person_email_addresses

crm
  groups
  person_group_memberships
  campaigns
  campaign_recipients
  email_events
  notes
  follow_ups

public_sources
  http_archive_runs
  http_archive_observations

web_enrichment
  website_shopify_status

public
  read-only compatibility views for old crm_* names
```

---

## Target Data Model

### `business.websites`

Canonical domain identity only.

```sql
CREATE SCHEMA IF NOT EXISTS business;

CREATE TABLE IF NOT EXISTS business.websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  raw_input text,
  domain_type text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT websites_domain_type_check CHECK (
    domain_type IN ('unknown', 'business', 'email_provider')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS websites_domain_unique
  ON business.websites (lower(domain));
```

### `person.people`

Migrates from existing `public.crm_contacts`, preserving IDs.

```sql
CREATE SCHEMA IF NOT EXISTS person;

CREATE TABLE IF NOT EXISTS person.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  first_name text,
  last_name text,
  organization text,
  role_title text,
  relationship_type text NOT NULL DEFAULT 'investor',
  relationship_stage text NOT NULL DEFAULT 'prospect',
  source_confidence text NOT NULL DEFAULT 'confirmed-user',
  investor_fit text,
  check_size_range text,
  warm_intro_source text,
  last_touch_at timestamptz,
  next_follow_up_at timestamptz,
  personalization_notes text,
  private_notes text,
  do_not_contact boolean NOT NULL DEFAULT false,
  owner text NOT NULL DEFAULT 'Allan',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT people_relationship_stage_check CHECK (
    relationship_stage IN ('prospect', 'warm', 'active', 'committed', 'passed', 'paused')
  ),
  CONSTRAINT people_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);
```

### `person.email_addresses`

Canonical email identity, including role inboxes.

```sql
CREATE TABLE IF NOT EXISTS person.email_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  local_part text NOT NULL,
  website_id uuid REFERENCES business.websites(id) ON DELETE SET NULL,
  address_kind text NOT NULL DEFAULT 'unknown',
  source_confidence text NOT NULL DEFAULT 'needs-verification',
  raw_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_addresses_address_kind_check CHECK (
    address_kind IN ('personal', 'role', 'unknown')
  ),
  CONSTRAINT email_addresses_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS email_addresses_email_unique
  ON person.email_addresses (lower(email));

CREATE INDEX IF NOT EXISTS email_addresses_website_idx
  ON person.email_addresses (website_id)
  WHERE website_id IS NOT NULL;
```

### `person.person_email_addresses`

Person-to-email relationship. Replaces the old `crm_contact_email_addresses` table.

```sql
CREATE TABLE IF NOT EXISTS person.person_email_addresses (
  person_id uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE,
  email_address_id uuid NOT NULL REFERENCES person.email_addresses(id) ON DELETE CASCADE,
  relationship_status text NOT NULL DEFAULT 'candidate',
  is_primary boolean NOT NULL DEFAULT false,
  source_confidence text NOT NULL DEFAULT 'needs-verification',
  association_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, email_address_id),
  CONSTRAINT person_email_addresses_relationship_status_check CHECK (
    relationship_status IN ('candidate', 'likely', 'claimed', 'rejected')
  ),
  CONSTRAINT person_email_addresses_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);
```

### `crm` People Campaign Tables

CRM stays workflow-oriented and people-only for V1.

```sql
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  audience_type text NOT NULL DEFAULT 'investor',
  purpose text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.person_group_memberships (
  person_id uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES crm.groups(id) ON DELETE CASCADE,
  fit_score integer,
  membership_notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, group_id),
  CONSTRAINT person_group_memberships_fit_score_check CHECK (
    fit_score IS NULL OR (fit_score >= 1 AND fit_score <= 5)
  )
);
```

Existing `crm_campaigns`, `crm_campaign_recipients`, `crm_email_events`, `crm_notes`, and `crm_follow_ups` move into the `crm` schema and update their FKs from contact IDs to `person.people(id)`.

### `business.website_lists`

Domain review cohorts live outside CRM groups.

```sql
CREATE TABLE IF NOT EXISTS business.website_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  purpose text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.website_list_memberships (
  website_id uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES business.website_lists(id) ON DELETE CASCADE,
  fit_score integer,
  membership_notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (website_id, list_id),
  CONSTRAINT website_list_memberships_fit_score_check CHECK (
    fit_score IS NULL OR (fit_score >= 1 AND fit_score <= 100)
  )
);
```

### `public_sources.http_archive_runs`

One row per daily n8n BigQuery collection.

```sql
CREATE SCHEMA IF NOT EXISTS public_sources;

CREATE TABLE IF NOT EXISTS public_sources.http_archive_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_date date NOT NULL,
  client text NOT NULL DEFAULT 'desktop',
  query_name text NOT NULL,
  query_version text NOT NULL,
  bigquery_job_id text,
  n8n_execution_id text,
  status text NOT NULL DEFAULT 'running',
  row_count integer NOT NULL DEFAULT 0,
  query_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT http_archive_runs_client_check CHECK (
    client IN ('desktop', 'mobile')
  ),
  CONSTRAINT http_archive_runs_status_check CHECK (
    status IN ('running', 'completed', 'failed', 'archived')
  ),
  CONSTRAINT http_archive_runs_row_count_check CHECK (
    row_count >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS http_archive_runs_unique
  ON public_sources.http_archive_runs (crawl_date, client, lower(query_name), lower(query_version));
```

### `public_sources.http_archive_observations`

One row per Website per crawl/query. This table is source-named, not query-named; Shopify scope is represented by `query_name`, `technologies`, and evidence.

```sql
CREATE TABLE IF NOT EXISTS public_sources.http_archive_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public_sources.http_archive_runs(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE,
  query_name text NOT NULL,
  crawl_date date NOT NULL,
  client text NOT NULL DEFAULT 'desktop',
  primary_root_page_url text NOT NULL,
  best_rank integer,
  detected_origins integer NOT NULL DEFAULT 0,
  detected_pages integer NOT NULL DEFAULT 0,
  technologies text[] NOT NULL DEFAULT '{}'::text[],
  technology_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  technology_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_root_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT http_archive_observations_client_check CHECK (
    client IN ('desktop', 'mobile')
  ),
  CONSTRAINT http_archive_observations_counts_check CHECK (
    detected_origins >= 0 AND detected_pages >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS http_archive_observations_website_crawl_query_unique
  ON public_sources.http_archive_observations (
    website_id,
    crawl_date,
    client,
    lower(query_name)
  );
```

### `web_enrichment.website_shopify_status`

Current status only; no attempt history in V1.

```sql
CREATE SCHEMA IF NOT EXISTS web_enrichment;

CREATE TABLE IF NOT EXISTS web_enrichment.website_shopify_status (
  website_id uuid PRIMARY KEY REFERENCES business.websites(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unknown',
  checked_at timestamptz,
  check_attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  next_check_at timestamptz,
  detection_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  detection_error text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_shopify_status_check CHECK (
    status IN ('unknown', 'true', 'false')
  ),
  CONSTRAINT website_shopify_status_attempts_check CHECK (
    check_attempts >= 0
  )
);

CREATE INDEX IF NOT EXISTS website_shopify_status_poll_idx
  ON web_enrichment.website_shopify_status (status, next_check_at, locked_at);
```

---

## Daily BigQuery Query

Store this query in `mono/infra/crm/bigquery/http_archive_shopify_domains.sql`.

The workflow should pass `crawl_date`, `client`, and `max_rows` as BigQuery parameters. The query rolls up to one row per canonical domain.

```sql
WITH shopify_pages AS (
  SELECT
    @crawl_date AS crawl_date,
    @client AS client,
    page,
    root_page,
    NET.REG_DOMAIN(root_page) AS canonical_domain,
    rank,
    t.technology AS technology,
    t.categories AS technology_categories,
    t.info AS technology_info
  FROM
    `httparchive.crawl.pages`,
    UNNEST(technologies) AS t
  WHERE
    date = @crawl_date
    AND client = @client
    AND t.technology IN ('Shopify', 'Shopify Plus')
    AND NET.REG_DOMAIN(root_page) IS NOT NULL
),
domain_rollup AS (
  SELECT
    crawl_date,
    client,
    canonical_domain,
    ARRAY_AGG(DISTINCT root_page ORDER BY root_page LIMIT 5) AS sample_root_pages,
    ARRAY_AGG(DISTINCT page ORDER BY page LIMIT 10) AS sample_pages,
    MIN(rank) AS best_rank,
    COUNT(DISTINCT root_page) AS detected_origins,
    COUNT(DISTINCT page) AS detected_pages,
    ARRAY_AGG(DISTINCT technology ORDER BY technology) AS technologies,
    TO_JSON_STRING(ARRAY_AGG(DISTINCT technology_categories IGNORE NULLS LIMIT 20)) AS technology_categories_json,
    TO_JSON_STRING(ARRAY_AGG(DISTINCT technology_info IGNORE NULLS LIMIT 20)) AS technology_info_json,
    TO_JSON_STRING(
      ARRAY_AGG(
        STRUCT(
          page,
          root_page,
          rank,
          technology,
          technology_categories,
          technology_info
        )
        ORDER BY rank NULLS LAST, root_page
        LIMIT 10
      )
    ) AS evidence_json
  FROM shopify_pages
  GROUP BY crawl_date, client, canonical_domain
)
SELECT
  crawl_date,
  client,
  canonical_domain,
  sample_root_pages[SAFE_OFFSET(0)] AS primary_root_page_url,
  best_rank,
  detected_origins,
  detected_pages,
  technologies,
  TO_JSON_STRING(sample_root_pages) AS sample_root_pages_json,
  TO_JSON_STRING(sample_pages) AS sample_pages_json,
  technology_categories_json,
  technology_info_json,
  evidence_json
FROM domain_rollup
ORDER BY best_rank NULLS LAST, canonical_domain
LIMIT @max_rows;
```

---

## Daily n8n Workflow Contract

Create `mono/infra/n8n/workflows/http-archive-shopify-daily-pipeline.md`.

Workflow name: `CipherPlay Public Sources - HTTP Archive Shopify Daily`.

Trigger:

- Daily schedule.
- Also allow manual run with override parameters for `crawl_date`, `client`, and `max_rows`.

Default parameters:

- `client = desktop`
- `query_name = shopify_domains`
- `query_version = v1`
- `max_rows = 5000` for initial production, adjustable after cost and runtime are known.

High-level steps:

1. Determine latest safe HTTP Archive crawl date.
   - V1 can use a configured date parameter.
   - Future work can query available crawl dates and choose the latest completed monthly crawl.
2. Insert or upsert `public_sources.http_archive_runs` with status `running`.
3. Run the BigQuery query directly from n8n.
4. For each returned row:
   - Upsert `business.websites` by `lower(domain)`.
   - Ensure `web_enrichment.website_shopify_status` exists for that website with status `unknown`.
   - Upsert `public_sources.http_archive_observations` for `website_id + crawl_date + client + query_name`.
   - Add the website to `business.website_lists` list `http-archive-shopify-daily` if useful for review.
5. Update run status to `completed` with row count.
6. On failure, update run status to `failed` and record a concise error message.

Idempotency keys:

- `business.websites`: `lower(domain)`
- `public_sources.http_archive_runs`: `crawl_date + client + lower(query_name) + lower(query_version)`
- `public_sources.http_archive_observations`: `website_id + crawl_date + client + lower(query_name)`
- `business.website_lists`: `slug`
- `business.website_list_memberships`: `website_id + list_id`

---

## Service Account And Permissions

Target: n8n should run BigQuery using production service-account credentials, not a user token.

Plan:

1. Use the existing n8n Cloud Run service account if n8n can use runtime identity for BigQuery.
2. Grant that service account `roles/bigquery.jobUser` on `cipherplay-production`.
3. Read access to the public HTTP Archive dataset is public; no dataset-specific secret should be committed.
4. If n8n's BigQuery credential requires a JSON key, create a dedicated minimal service account, store the key in Secret Manager, import it into n8n credentials, and never commit it.
5. Document the chosen path in `infra/n8n/README.md` and the workflow contract doc.

---

## Migration Strategy

The migration must be safe and lossless.

1. Create schemas and schema-native tables.
2. Copy existing rows from old `public.crm_*` tables into schema-native tables with IDs preserved.
3. Copy existing associations with IDs/FKs remapped by preserved IDs.
4. Move current Shopify status columns from `public.crm_websites` into `web_enrichment.website_shopify_status`.
5. Verify row counts and association counts before retiring old tables.
6. Rename old tables to backup names or leave them untouched until validation is complete.
7. Create read-only compatibility views with old `public.crm_*` names after writes are moved.
8. Update n8n workflows to schema-native writes.
9. Update NocoDB operator views to schema-native tables and review views.

Compatibility views should be temporary and read-only.

---

## Operator Review Views

Create views for NocoDB review without making views the source of truth.

```sql
CREATE OR REPLACE VIEW business.website_shopify_review AS
SELECT
  website.id AS website_id,
  website.domain,
  website.domain_type,
  status.status AS shopify_status,
  status.checked_at AS shopify_checked_at,
  status.detection_error AS shopify_detection_error,
  observation.crawl_date AS http_archive_crawl_date,
  observation.best_rank AS http_archive_best_rank,
  observation.technologies AS http_archive_technologies,
  observation.primary_root_page_url AS http_archive_primary_root_page_url
FROM business.websites website
LEFT JOIN web_enrichment.website_shopify_status status
  ON status.website_id = website.id
LEFT JOIN public_sources.http_archive_observations observation
  ON observation.website_id = website.id;
```

```sql
CREATE OR REPLACE VIEW public_sources.http_archive_shopify_review AS
SELECT
  run.id AS run_id,
  run.crawl_date,
  run.client,
  run.query_name,
  website.id AS website_id,
  website.domain,
  observation.best_rank,
  observation.detected_pages,
  observation.technologies,
  shopify.status AS live_shopify_status,
  shopify.checked_at AS live_shopify_checked_at
FROM public_sources.http_archive_runs run
JOIN public_sources.http_archive_observations observation
  ON observation.run_id = run.id
JOIN business.websites website
  ON website.id = observation.website_id
LEFT JOIN web_enrichment.website_shopify_status shopify
  ON shopify.website_id = website.id;
```

---

## Tasks

### Task 1: Replace The Plan-Only BigQuery Query With A Parameterized Daily Query

**Files:**

- Create: `mono/infra/crm/bigquery/http_archive_shopify_domains.sql`

- [ ] Add the query from "Daily BigQuery Query".
- [ ] Dry-run the query in BigQuery with one known HTTP Archive crawl date.
- [ ] Save the processed-byte estimate in the workflow contract doc.
- [ ] Run a 50-row manual sample before enabling daily schedule.

Expected verification:

```bash
bq query --use_legacy_sql=false --dry_run \
  --parameter=crawl_date:DATE:2026-05-01 \
  --parameter=client:STRING:desktop \
  --parameter=max_rows:INT64:50 \
  < infra/crm/bigquery/http_archive_shopify_domains.sql
```

### Task 2: Add Schema-Native Migration Tests

**Files:**

- Modify: `mono/infra/crm/tests/test_schema_contract.py`

- [ ] Add tests that schemas `business`, `person`, `crm`, `public_sources`, and `web_enrichment` are created.
- [ ] Add tests for `business.websites`, `person.people`, `person.email_addresses`, `person.person_email_addresses`, `public_sources.http_archive_runs`, `public_sources.http_archive_observations`, and `web_enrichment.website_shopify_status`.
- [ ] Add tests that old Shopify columns are absent from `business.websites`.
- [ ] Add tests that `web_enrichment.website_shopify_status` owns current Shopify status.
- [ ] Add tests that `crm.groups` is people-only through `crm.person_group_memberships`.

Expected: tests fail before schema migration changes.

### Task 3: Implement Schema-Native Tables And Data-Preserving Migration

**Files:**

- Modify: `mono/infra/crm/schema/001-crm.sql`

- [ ] Create schemas.
- [ ] Create schema-native tables.
- [ ] Copy existing `public.crm_contacts` rows to `person.people` preserving `id`.
- [ ] Copy existing `public.crm_websites` rows to `business.websites` preserving `id`, `domain`, `raw_input`, and `domain_type`.
- [ ] Copy existing Shopify fields from `public.crm_websites` to `web_enrichment.website_shopify_status`.
- [ ] Copy existing `public.crm_email_addresses` rows to `person.email_addresses`, preserving `id` and `website_id`.
- [ ] Copy existing `public.crm_contact_email_addresses` rows to `person.person_email_addresses`.
- [ ] Copy existing CRM workflow tables to the `crm` schema preserving IDs and relationships.
- [ ] Seed `business.website_lists` with `http-archive-shopify-daily`.
- [ ] Create temporary read-only compatibility views for old names after migration.

Required validation SQL:

```sql
SELECT
  (SELECT count(*) FROM public.crm_contacts) AS old_people,
  (SELECT count(*) FROM person.people) AS new_people,
  (SELECT count(*) FROM public.crm_websites) AS old_websites,
  (SELECT count(*) FROM business.websites) AS new_websites,
  (SELECT count(*) FROM public.crm_email_addresses) AS old_emails,
  (SELECT count(*) FROM person.email_addresses) AS new_emails;
```

All old/new counts must match before old tables are deprecated.

### Task 4: Update Website Shopify Enrichment Workflow Contract

**Files:**

- Modify: `mono/infra/n8n/workflows/crm-website-shopify-enrichment.md`

- [ ] Change read source from `crm_websites` to `business.websites` joined to `web_enrichment.website_shopify_status`.
- [ ] Change write target from `crm_websites.shopify_*` columns to `web_enrichment.website_shopify_status`.
- [ ] Keep current-only status model.
- [ ] Preserve lock fields in `web_enrichment.website_shopify_status`.
- [ ] Update success/failure SQL shapes.

### Task 5: Add HTTP Archive Daily Workflow Contract

**Files:**

- Create: `mono/infra/n8n/workflows/http-archive-shopify-daily-pipeline.md`
- Modify: `mono/infra/n8n/README.md`

- [ ] Document daily trigger, manual override parameters, BigQuery credentials, idempotency keys, and status updates.
- [ ] Document production service-account permissions.
- [ ] Add workflow inventory entry in README.

### Task 6: Add Review Views

**Files:**

- Modify: `mono/infra/crm/schema/001-crm.sql`
- Modify: `mono/infra/crm/tests/test_schema_contract.py`

- [ ] Create `business.website_shopify_review`.
- [ ] Create `public_sources.http_archive_shopify_review`.
- [ ] Test the view definitions exist and join the expected schemas.

### Task 7: Update CRM Context And README Docs

**Files:**

- Modify: `mono/docs/contexts/crm.md`
- Modify: `mono/infra/crm/README.md`

- [ ] Document schema boundaries.
- [ ] Document schema-native migration safety.
- [ ] Document old-name compatibility view deprecation.
- [ ] Document that campaigns and groups are people-only in V1.
- [ ] Document that website lists are business/domain review cohorts.

### Task 8: Configure BigQuery Auth For n8n

**Files:**

- Modify: `mono/infra/n8n/opentofu/*.tf` if IaC owns the n8n service account permissions.
- Modify: `mono/infra/n8n/README.md`

- [ ] Identify the active n8n Cloud Run service account.
- [ ] Grant BigQuery job execution permission in `cipherplay-production`.
- [ ] Prefer runtime service account identity.
- [ ] If n8n requires JSON-key credentials, create a dedicated minimal service account and store/import the key through Secret Manager/n8n credentials only.
- [ ] Do not commit keys or credential JSON.

### Task 9: Build And Smoke The n8n Daily Workflow

**Files:**

- n8n workflow in live n8n, plus repo contract doc.

- [ ] Create the n8n workflow with schedule disabled first.
- [ ] Run manual 50-row BigQuery query.
- [ ] Confirm `business.websites` rows are upserted.
- [ ] Confirm `public_sources.http_archive_runs` is completed.
- [ ] Confirm `public_sources.http_archive_observations` row count equals unique returned websites.
- [ ] Confirm `web_enrichment.website_shopify_status` rows exist with `unknown` for new websites.
- [ ] Confirm review views show rows in NocoDB.
- [ ] Enable daily trigger only after manual smoke passes.

### Task 10: Verification And Cutover

**Files:**

- No new files.

- [ ] Run CRM schema tests:

```bash
python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
```

- [ ] Run a production read-only row-count validation before and after migration.
- [ ] Update the existing Shopify enrichment n8n workflow to schema-native SQL.
- [ ] Verify no active workflow writes to old `public.crm_*` names.
- [ ] Keep read-only compatibility views until NocoDB and workflows are fully schema-native.
- [ ] Update `mono/HANDOFF.md` with migration status, workflow IDs, and any remaining cutover steps.

---

## Acceptance Criteria

- Existing CRM/contact/website/email/campaign data migrates without row loss.
- Existing IDs are preserved where a corresponding schema-native table exists.
- `business.websites` contains canonical domains only, with no Shopify source/enrichment columns.
- `public_sources.http_archive_observations` links to `business.websites` by FK and does not duplicate canonical domain.
- `web_enrichment.website_shopify_status` stores current live Shopify status and evidence.
- n8n runs HTTP Archive BigQuery directly on a daily schedule.
- n8n uses production service-account auth, not local user auth.
- CRM groups and campaigns remain people-only in V1.
- NocoDB can review source/enrichment output through schema-native tables and review views.
- Old `public.crm_*` names are temporary read-only compatibility views, not write paths.
- All relevant tests pass.

---

## Next Agent Prompt

```text
You are working in C:\Users\allan\Documents\CipherPlay\mono.

Implement the schema-native HTTP Archive Shopify daily pipeline described in:
docs/superpowers/plans/2026-06-14-http-archive-shopify-domain-seeding.md

Use the Superpowers implementation workflow. Start by reading:
- AGENTS.md
- docs/contexts/crm.md
- infra/crm/README.md
- infra/crm/schema/001-crm.sql
- infra/crm/tests/test_schema_contract.py
- infra/n8n/README.md
- infra/n8n/workflows/crm-website-shopify-enrichment.md
- docs/superpowers/plans/2026-06-14-http-archive-shopify-domain-seeding.md

Critical decisions:
- Keep one Cloud SQL database named crm, but split data with Postgres schemas.
- Use schemas: business, person, crm, public_sources, web_enrichment.
- business.websites is the only canonical domain registry.
- business.websites means domain identity only, not company/brand/account.
- Source and enrichment tables must FK to business.websites; do not duplicate canonical domain fields there.
- person.email_addresses can store personal, role, and unknown emails.
- crm.groups and crm.campaigns are people-only in V1.
- Domain review cohorts belong in business.website_lists, not crm.groups.
- HTTP Archive source tables are source-named: public_sources.http_archive_runs and public_sources.http_archive_observations.
- HTTP Archive observations are one row per Website per crawl/query.
- Live Shopify status belongs in web_enrichment.website_shopify_status as current state only.
- Existing public.crm_* data must be migrated without loss and IDs preserved where possible.
- Old public.crm_* names may become temporary read-only compatibility views only.
- n8n should run BigQuery directly every day using production service-account auth.
- Do not use CSV import as the primary workflow.
- Do not commit secrets, n8n tokens, service account keys, contact data, or private domain samples.

Implementation approach:
1. Add or update schema contract tests first.
2. Implement schema-native migration in infra/crm/schema/001-crm.sql.
3. Add BigQuery SQL at infra/crm/bigquery/http_archive_shopify_domains.sql.
4. Update n8n workflow contract docs for both Shopify enrichment and HTTP Archive daily pipeline.
5. Add review views for NocoDB.
6. Configure BigQuery service-account permissions through IaC or documented operator steps.
7. Smoke the n8n workflow manually with a 50-row run before enabling daily schedule.
8. Run tests from the mono repo:
   python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
9. Update HANDOFF.md with exact workflow IDs, migration status, smoke-test counts, and any remaining cutover work.

Be very careful with existing data. This is a migration, not a fresh schema. Validate old/new row counts and associations before deprecating old names.
```

---

## Self-Review

- Spec coverage: Covers daily n8n BigQuery execution, schema separation, direct source observations, current-only web enrichment status, people-only CRM, safe migration, compatibility views, review views, service-account auth, and next-agent handoff.
- Placeholder scan: No TBD/TODO placeholders remain. Future work is explicitly labeled as future work, not required for V1.
- Type consistency: Schema names and table names are consistent across data model, tasks, and agent prompt.
