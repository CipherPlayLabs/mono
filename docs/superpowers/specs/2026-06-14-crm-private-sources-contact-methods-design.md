# CRM Private Sources and Contact Methods Design

Date: 2026-06-14

## Goal

Extend the CipherPlay CRM schema so source provenance, business identities, and contact methods are modeled cleanly before more business-data collection lands.

This design covers three related changes:

- Move selected source datasets into a new `private_sources` schema as provenance, not as an access-control boundary.
- Make `contact_methods` the canonical home for emails, LinkedIn URLs, phone numbers, Telegram handles, and future reachable identities.
- Add a sitewide n8n workflow that discovers emails and LinkedIn URLs from company websites and records both canonical identities and evidence.

PostgreSQL remains the source of truth. NocoDB remains the operator UI. n8n reads and writes the `crm` database directly as the automation layer.

## Findings

- The current schema already split flat `public.crm_*` tables into domain schemas: `business`, `person`, `crm`, `public_sources`, and `web_enrichment`.
- `business.websites` is intentionally domain identity only. It should not become the company/brand/business table.
- `person.email_addresses` and `person.person_email_addresses` currently normalize emails, but the next model wants contact methods to attach to people, businesses, and possibly websites. Keeping emails in `person` would make the model lopsided.
- Founder Institute entries and interview rows are source datasets, not canonical People. They should keep raw/source-specific fields and link to canonical identities only after review or promotion.
- The current `public_sources.interview_source_entries` name is too generic. The canonical name should be `private_sources.ramp_interviews`.
- Website-contact discovery needs to be sitewide over same-domain HTML pages, not a homepage/contact-page probe. It should skip PDFs, media, and binary assets.
- LinkedIn discovery is first-class for V1, but only for LinkedIn URLs found from pages in the website crawl scope. External search is out of scope for V1.

## Approved Decisions

- `private_sources` is a provenance schema, not an access-control boundary.
- Move `founder_institute_directory_entries` into `private_sources`.
- Rename `interview_source_entries` to `private_sources.ramp_interviews`.
- Keep read-only compatibility views for old `public.crm_*` names during transition.
- Make `contact_methods.emails` canonical and retire `person.email_addresses` behind compatibility views.
- Use typed contact-method tables rather than one generic `method_type` table.
- Initial typed tables:
  - `contact_methods.emails`
  - `contact_methods.phone_numbers`
  - `contact_methods.linkedin_profiles`
  - `contact_methods.telegram_handles`
- Add `business.organizations` for companies, brands, storefront operators, investor firms, and similar non-person entities.
- Keep Website-to-Organization links as evidence associations, not `organization_id` on `business.websites`.
- Keep contact-method-to-person and contact-method-to-business links as evidence associations, not ownership claims.
- Email kinds should be `person`, `role_inbox`, and `unknown`.
- Store discovery attempts even when no contact methods are found.
- Store discovery observations separately from canonical contact-method rows.
- V1 website contact discovery should crawl all discoverable same-domain HTML pages and skip PDFs, media, and binary assets.

## Glossary Terms

These terms are now captured in `docs/contexts/crm.md` and should guide implementation:

- `Private Source Data`
- `Contact Method`
- `Contact Method Association`
- `Business Organization`
- `Organization Website Association`
- `LinkedIn Profile`
- `Role Inbox`
- `Website Contact Discovery Status`
- `Website Crawl Scope`
- `Contact Discovery Observation`
- `Ramp Interview Data`

## Schema Design

### `private_sources`

Create a new schema:

```sql
CREATE SCHEMA IF NOT EXISTS private_sources;
```

Move source datasets:

- `public_sources.founder_institute_directory_entries` -> `private_sources.founder_institute_directory_entries`
- `public_sources.interview_source_entries` -> `private_sources.ramp_interviews`

Preserve IDs, timestamps, raw payloads, source row numbers, and nullable `person_id` links.

Compatibility:

- Keep `public.crm_founder_institute_directory_entries` as a read-only compatibility view over `private_sources.founder_institute_directory_entries`.
- Keep `public.crm_interview_source_entries` as a read-only compatibility view over `private_sources.ramp_interviews`.
- Consider a temporary `public_sources.interview_source_entries` compatibility view only if current NocoDB/n8n references require it.

### `business.organizations`

Add a canonical business identity table. Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `display_name text NOT NULL`
- `legal_name text`
- `organization_kind text NOT NULL DEFAULT 'unknown'`
- `relationship_type text`
- `relationship_stage text`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `owner text NOT NULL DEFAULT 'Allan'`
- `notes text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Suggested `organization_kind` values:

- `company`
- `brand`
- `storefront_operator`
- `investor_firm`
- `agency`
- `unknown`

### `business.organization_websites`

Add evidence associations between organizations and websites. Suggested columns:

- `organization_id uuid NOT NULL REFERENCES business.organizations(id) ON DELETE CASCADE`
- `website_id uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE`
- `relationship_status text NOT NULL DEFAULT 'candidate'`
- `is_primary boolean NOT NULL DEFAULT false`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `association_notes text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints:

- Primary key on `(organization_id, website_id)`.
- Partial unique index for one primary website per organization where `is_primary = true` and status is not rejected.

### `contact_methods`

Create a new schema:

```sql
CREATE SCHEMA IF NOT EXISTS contact_methods;
```

#### `contact_methods.emails`

Canonical email identities. Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `email text NOT NULL`
- `local_part text NOT NULL`
- `website_id uuid REFERENCES business.websites(id) ON DELETE SET NULL`
- `address_kind text NOT NULL DEFAULT 'unknown'`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `raw_source text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Checks:

- `address_kind IN ('person', 'role_inbox', 'unknown')`
- `source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')`

Indexes:

- Unique index on `lower(email)`.
- Index on `website_id` where not null.

Compatibility:

- Recreate `person.email_addresses` as a read-only view over `contact_methods.emails`.
- Recreate `public.crm_email_addresses` as a read-only compatibility view over `contact_methods.emails`.

#### Contact Email Associations

Replace `person.person_email_addresses` with evidence links. Suggested table:

- `contact_methods.person_email_links`

Suggested columns:

- `person_id uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE`
- `email_id uuid NOT NULL REFERENCES contact_methods.emails(id) ON DELETE CASCADE`
- `relationship_status text NOT NULL DEFAULT 'candidate'`
- `is_primary boolean NOT NULL DEFAULT false`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `association_notes text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Add the matching business association table:

- `contact_methods.organization_email_links`

Use the same evidence-link pattern, replacing `person_id` with `organization_id`.

Compatibility:

- Recreate `person.person_email_addresses` as a read-only view over `contact_methods.person_email_links`.
- Recreate `public.crm_contact_email_addresses` as a read-only view over `contact_methods.person_email_links`.

#### `contact_methods.linkedin_profiles`

Canonical LinkedIn URLs. Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `linkedin_url text NOT NULL`
- `normalized_url text NOT NULL`
- `profile_kind text NOT NULL DEFAULT 'unknown'`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `raw_source text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Suggested `profile_kind` values:

- `person`
- `organization`
- `unknown`

Associations:

- `contact_methods.person_linkedin_profile_links`
- `contact_methods.organization_linkedin_profile_links`
- Optionally `contact_methods.website_linkedin_profile_links` if site-derived association evidence needs to link directly to a Website before organization review.

#### `contact_methods.phone_numbers`

Canonical phone numbers. Use normalized E.164 where possible, but preserve raw observed text.

Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `phone_number text NOT NULL`
- `normalized_phone_number text`
- `country_hint text`
- `phone_kind text NOT NULL DEFAULT 'unknown'`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `raw_source text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Associations:

- `contact_methods.person_phone_number_links`
- `contact_methods.organization_phone_number_links`

#### `contact_methods.telegram_handles`

Canonical Telegram handles or URLs.

Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `telegram_handle text NOT NULL`
- `normalized_handle text NOT NULL`
- `telegram_url text`
- `handle_kind text NOT NULL DEFAULT 'unknown'`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `raw_source text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Associations:

- `contact_methods.person_telegram_handle_links`
- `contact_methods.organization_telegram_handle_links`

### Website Contact Discovery Tables

Add current-state workflow tracking:

- `web_enrichment.website_contact_discovery_status`

Suggested columns:

- `website_id uuid PRIMARY KEY REFERENCES business.websites(id) ON DELETE CASCADE`
- `status text NOT NULL DEFAULT 'unknown'`
- `checked_at timestamptz`
- `crawl_started_at timestamptz`
- `crawl_finished_at timestamptz`
- `page_count integer NOT NULL DEFAULT 0`
- `found_email_count integer NOT NULL DEFAULT 0`
- `found_linkedin_count integer NOT NULL DEFAULT 0`
- `check_attempts integer NOT NULL DEFAULT 0`
- `last_attempt_at timestamptz`
- `next_check_at timestamptz`
- `crawl_scope jsonb NOT NULL DEFAULT '{}'::jsonb`
- `discovery_summary jsonb NOT NULL DEFAULT '{}'::jsonb`
- `discovery_error text`
- `locked_at timestamptz`
- `locked_by text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Suggested `status` values:

- `unknown`
- `running`
- `completed`
- `partial`
- `failed`

Add evidence observations:

- `web_enrichment.website_contact_discovery_observations`

Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `website_id uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE`
- `email_id uuid REFERENCES contact_methods.emails(id) ON DELETE SET NULL`
- `linkedin_profile_id uuid REFERENCES contact_methods.linkedin_profiles(id) ON DELETE SET NULL`
- `source_url text NOT NULL`
- `observation_kind text NOT NULL`
- `observed_value text NOT NULL`
- `classification text NOT NULL DEFAULT 'unknown'`
- `classification_reason text`
- `n8n_execution_id text`
- `observed_at timestamptz NOT NULL DEFAULT now()`
- `evidence jsonb NOT NULL DEFAULT '{}'::jsonb`

Suggested `observation_kind` values:

- `email`
- `linkedin_profile`

## n8n Workflow Design

Workflow name:

- `CipherPlay Website Contact Discovery`

Purpose:

- Claim `business.websites` rows that need contact discovery.
- Crawl all discoverable same-domain HTML pages.
- Skip PDFs, images, video, audio, archives, fonts, scripts, stylesheets, and other binary/media assets.
- Extract emails and LinkedIn URLs from crawled pages.
- Upsert canonical Contact Methods.
- Create evidence observations for each found method and source URL.
- Link role inbox/person email evidence to organizations or websites where possible, without inventing People.
- Persist a status row even if no methods are found.

V1 crawl scope:

- Start from `https://domain/` and optionally `https://www.domain/` when relevant.
- Follow same registrable-domain HTML links.
- Normalize URL fragments and query strings where safe.
- Skip external domains except to record LinkedIn URLs as discovered values.
- Do not use external search queries in V1.
- Do not fetch LinkedIn pages. Store the URL found on the website.
- Do not parse PDFs in V1.

Email classification:

- Classify common functional local parts as `role_inbox`.
- Classify strong human-name patterns as `person` only when confidence is strong.
- Otherwise classify as `unknown`.
- Never create a Person from an email address alone.

Recommended node shape:

1. Schedule/manual trigger.
2. Claim contact-discovery batch.
3. Load claimed rows by `locked_by = $execution.id`.
4. Crawl website HTML pages.
5. Extract and classify emails and LinkedIn URLs.
6. Upsert `contact_methods.emails`.
7. Upsert `contact_methods.linkedin_profiles`.
8. Insert/update discovery observations.
9. Update `web_enrichment.website_contact_discovery_status`.
10. Assert persistence and release/advance locks.

Operational lessons from prior n8n work:

- Do not rely on an n8n Postgres claim node returning row items; explicitly load claimed rows after claim.
- Keep real execution batches small until the workflow has passed repeated production smokes.
- Add assert nodes that fail loudly when zero rows are persisted unexpectedly.
- Record execution IDs and counts in `HANDOFF.md` after production work.

## Migration Plan

1. Extend schema contract tests first in `infra/crm/tests/test_schema_contract.py`.
2. Add `private_sources`, `contact_methods`, and new business/web enrichment tables in `infra/crm/schema/001-crm.sql`.
3. Migrate existing rows:
   - Copy `public_sources.founder_institute_directory_entries` to `private_sources.founder_institute_directory_entries`.
   - Copy `public_sources.interview_source_entries` to `private_sources.ramp_interviews`.
   - Copy `person.email_addresses` to `contact_methods.emails` preserving IDs.
   - Copy `person.person_email_addresses` to `contact_methods.person_email_links`.
4. Replace old physical tables with read-only compatibility views where needed.
5. Update `docs/contexts/crm.md`, `infra/crm/README.md`, and `infra/n8n/README.md`.
6. Add a repo-owned workflow contract under `infra/n8n/workflows/website-contact-discovery.md`.
7. Apply schema migration from an approved operator environment.
8. Create and smoke the n8n workflow with a small batch.
9. Update `HANDOFF.md` with workflow ID, execution IDs, row counts, and remaining production follow-up.

## Verification Plan

Run from `mono`:

```powershell
python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
```

Schema contract should verify:

- `private_sources` and `contact_methods` schemas exist.
- `private_sources.founder_institute_directory_entries` exists.
- `private_sources.ramp_interviews` exists.
- `contact_methods.emails` exists and has `address_kind IN ('person', 'role_inbox', 'unknown')`.
- `contact_methods.linkedin_profiles`, `phone_numbers`, and `telegram_handles` exist.
- Person and organization association tables use evidence-link fields.
- `business.organizations` and `business.organization_websites` exist.
- `web_enrichment.website_contact_discovery_status` and `web_enrichment.website_contact_discovery_observations` exist.
- Compatibility views preserve old `public.crm_*` names.
- Docs mention the new schema boundaries.

Production verification should capture:

- Pre/post counts for moved source tables.
- Pre/post counts for email rows and person-email links.
- Count of dangling contact-method links.
- Count of contact-discovery status rows processed in smoke.
- Count of discovered emails and LinkedIn URLs from smoke.
- Confirmation that no PDFs/media assets were fetched.

## Open Follow-Ups

- Decide exact allowed `organization_kind` values during implementation if the proposed set is too broad.
- Decide whether `website_linkedin_profile_links` is needed in V1 or whether observations are enough before organization review.
- Decide whether HTML crawl implementation should run entirely inside n8n nodes or call a dedicated Cloud Run helper for crawling. For reliability, a dedicated helper may be better if n8n becomes brittle.

## Starter Prompt For Next Agent

```text
We are in C:\Users\allan\Documents\CipherPlay\mono. Read AGENTS.md, HANDOFF.md, docs/contexts/crm.md, infra/crm/schema/001-crm.sql, infra/crm/tests/test_schema_contract.py, and docs/superpowers/specs/2026-06-14-crm-private-sources-contact-methods-design.md.

Goal: implement the approved CRM schema design for private source provenance, canonical contact methods, business organizations, and website contact discovery. Work contract-first.

Key decisions already approved:
- private_sources is provenance, not access control.
- Move public_sources.founder_institute_directory_entries to private_sources.founder_institute_directory_entries.
- Rename public_sources.interview_source_entries to private_sources.ramp_interviews.
- Make contact_methods.emails canonical and keep person/public CRM email compatibility views.
- Use typed contact method tables: emails, phone_numbers, linkedin_profiles, telegram_handles.
- Add business.organizations and business.organization_websites; do not overload business.websites as companies.
- Contact-method links and organization-website links are evidence associations, not ownership fields.
- Email address_kind values are person, role_inbox, unknown.
- Website contact discovery crawls all discoverable same-domain HTML pages, skips PDFs/media/binary assets, extracts emails and LinkedIn URLs found from the site, and does not use external search in V1.
- Store canonical contact methods separately from web_enrichment website_contact_discovery_status and website_contact_discovery_observations.

Implementation order:
1. Update infra/crm/tests/test_schema_contract.py with failing contract tests for the new schemas/tables/views/docs.
2. Update infra/crm/schema/001-crm.sql to add schemas, tables, triggers, indexes, migration/copy SQL, and read-only compatibility views.
3. Update docs/contexts/crm.md, infra/crm/README.md, and infra/n8n/README.md if implementation details require tightening.
4. Add infra/n8n/workflows/website-contact-discovery.md as the repo-owned workflow contract.
5. Run python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer.
6. Run git diff --check.
7. Update HANDOFF.md with exact files changed, tests run, and next production rollout steps.

Important prior n8n lesson: when a workflow claims rows, do not assume the Postgres claim node emits row payloads. Explicitly load claimed rows by locked_by/execution ID before downstream HTTP/crawl work. Keep batches small for production smoke and assert persistence counts.
```
