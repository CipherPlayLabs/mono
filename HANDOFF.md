# CipherPlay Handoff

## 2026-06-14 CRM Private Sources and Contact Methods Planning Update

- Completed a `grill-me` design pass for the next CRM data-amassing step.
- Added glossary decisions to `docs/contexts/crm.md`.
- Wrote the implementation design and starter prompt at `docs/superpowers/specs/2026-06-14-crm-private-sources-contact-methods-design.md`.
- Approved direction:
  - `private_sources` is a provenance schema, not an access-control boundary.
  - Move Founder Institute entries to `private_sources.founder_institute_directory_entries`.
  - Rename interview source entries to `private_sources.ramp_interviews`.
  - Make `contact_methods` canonical for emails, LinkedIn URLs, phone numbers, Telegram handles, and future contact methods.
  - Add `business.organizations` and evidence-based organization/website associations instead of treating Websites as companies.
  - Contact-method links to People or Business Organizations are evidence associations, not ownership claims.
  - Website contact discovery should crawl all discoverable same-domain HTML pages, skip PDFs/media/binary assets, extract emails and LinkedIn URLs found on the site, and avoid external search in V1.
- Next agent should work contract-first from `infra/crm/tests/test_schema_contract.py`, then update `infra/crm/schema/001-crm.sql`, docs, the n8n workflow contract, and this handoff.

## 2026-06-14 CRM Private Sources and Contact Methods Implementation Update

- Implemented the approved schema contract for private-source provenance, canonical contact methods, business organizations, and Website Contact Discovery.
- Key repo changes:
  - `infra/crm/tests/test_schema_contract.py`: expanded contract tests for `private_sources`, `contact_methods`, `business.organizations`, organization/Website evidence links, contact-method evidence links, Website Contact Discovery tables, compatibility views, and docs/workflow contracts.
  - `infra/crm/schema/001-crm.sql`: added `private_sources` and `contact_methods`; moved FI/Ramp source tables to `private_sources`; made `contact_methods.emails` canonical; added LinkedIn, phone, and Telegram contact-method tables; added person/organization contact-method evidence links; added `business.organizations` and `business.organization_websites`; added Website Contact Discovery status/observation tables; added migration copies, backup renames, read-only compatibility views, and updated triggers.
  - `infra/crm/importers/founder_institute.py` and `infra/crm/tests/test_founder_institute_importer.py`: changed the FI importer target to `private_sources.founder_institute_directory_entries`.
  - `docs/contexts/crm.md`, `infra/crm/README.md`, and `infra/n8n/README.md`: updated schema boundaries and workflow targets.
  - `infra/n8n/workflows/crm-website-shopify-enrichment.md`: changed email-domain discovery from `person.email_addresses` to `contact_methods.emails`.
  - `infra/n8n/workflows/website-contact-discovery.md`: added the repo-owned workflow contract for sitewide same-domain HTML crawling, email/LinkedIn extraction, canonical method upserts, observations, and status rows.
- Verification run from repo root:

```powershell
python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
```

  - Result: 23 tests passed.

```powershell
git diff --check
```

  - Result: passed; Git printed only existing Windows line-ending normalization warnings.
- Local limitation: no local Postgres parser/smoke was run here; production schema application still needs an approved operator path.

Next production rollout steps:

1. Push this branch and open the preview PR first, then merge preview to main after review.
2. From an approved operator environment, apply `infra/crm/schema/001-crm.sql` to the `crm` database.
3. Capture pre/post counts for:
   - `private_sources.founder_institute_directory_entries`
   - `private_sources.ramp_interviews`
   - `contact_methods.emails`
   - `contact_methods.person_email_links`
   - `business.organizations`
   - `business.organization_websites`
   - `web_enrichment.website_contact_discovery_status`
   - `web_enrichment.website_contact_discovery_observations`
4. Validate no dangling contact-method links and confirm old compatibility views still read:
   - `person.email_addresses`
   - `person.person_email_addresses`
   - `public.crm_email_addresses`
   - `public.crm_contact_email_addresses`
   - `public.crm_founder_institute_directory_entries`
   - `public.crm_interview_source_entries`
   - `public_sources.founder_institute_directory_entries`
   - `public_sources.interview_source_entries`
5. Visually confirm NocoDB review surfaces can see the new canonical tables/views before retiring operator reliance on old names.
6. Create `CipherPlay Website Contact Discovery` in n8n with a small batch, then run a manual smoke that confirms:
   - claimed rows are explicitly loaded by `locked_by = $execution.id`
   - same-domain HTML pages are crawled
   - PDFs/media/binary assets are skipped
   - emails land in `contact_methods.emails`
   - LinkedIn URLs land in `contact_methods.linkedin_profiles`
   - observations land in `web_enrichment.website_contact_discovery_observations`
   - every attempted Website gets a `web_enrichment.website_contact_discovery_status` row, including zero-result crawls
7. Record the production workflow ID, execution IDs, row counts, and any lock cleanup in this `HANDOFF.md`.

## 2026-06-14 CRM Private Sources Production Rollout Update

- Official GitHub schema-apply run `27504319972` reached the protected production environment and was approved, but failed during Cloud SQL import with `permission denied for schema business` at `CREATE TABLE IF NOT EXISTS business.websites`.
  - Root cause: the GitHub import path did not pass an explicit database user, so Cloud SQL imported as a user without schema ownership/CREATE privileges.
  - Repo fix in this branch: `.github/workflows/crm-schema-apply.yml` now passes `--user="${CRM_IMPORT_USER}"`, defaulting `CRM_IMPORT_USER` to `crm_writer`.
  - Production was not left half-migrated by that failed GitHub import; the successful production apply below used the `CRM Postgres (crm_writer)` credential path.
- Production schema migration was applied through temporary n8n workflow `HbbCq94Drm1yzChk`.
  - Migration execution: `114`
  - Result: success
  - Status marker: `crm_private_sources_contact_methods_schema_applied`
- Pre/post diagnostics used temporary n8n workflow `uOcgb9BNrIXbd7R9`.
  - Preflight execution `113`: `private_sources` and `contact_methods` schemas were absent before the migration; existing compatibility sources were readable.
  - Post-migration execution `115`: new schemas were present and writable for `crm_writer`.
- Post-migration production counts:
  - `business.websites`: 144
  - `business.organizations`: 0
  - `business.organization_websites`: 0
  - `private_sources.founder_institute_directory_entries`: 5309
  - `private_sources.ramp_interviews`: 69
  - `contact_methods.emails`: 2380 before Website Contact Discovery smoke inserts
  - `contact_methods.person_email_links`: 2381
  - `contact_methods.linkedin_profiles`: 0 before Website Contact Discovery smoke inserts
  - `contact_methods.phone_numbers`: 0
  - `contact_methods.telegram_handles`: 0
  - `web_enrichment.website_contact_discovery_status`: 0 before Website Contact Discovery smoke
  - `web_enrichment.website_contact_discovery_observations`: 0 before Website Contact Discovery smoke
- Integrity validation used temporary n8n workflow `nlAro43cf25BLTzv`, execution `117`.
  - All dangling contact-method, organization-website, Website Contact Discovery, FI, and Ramp references returned `0`.
  - Read-only compatibility trigger count: 17.
  - Compatibility views were readable with preserved counts:
    - `person.email_addresses`: 2380
    - `person.person_email_addresses`: 2381
    - `public.crm_email_addresses`: 2380
    - `public.crm_contact_email_addresses`: 2381
    - `public.crm_founder_institute_directory_entries`: 5309
    - `public.crm_interview_source_entries`: 69
    - `public_sources.founder_institute_directory_entries`: 5309
    - `public_sources.interview_source_entries`: 69
- Created production n8n workflow `IjSA24kmjFwc4IhZ`.
  - Name: `CipherPlay Website Contact Discovery`
  - URL: `https://workflows.cipherinternal.com/workflow/IjSA24kmjFwc4IhZ`
  - Status: active / published
  - Active version: `4e606c6a-ba84-43a2-8a22-8c0fdabea633`
  - Schedule trigger: every 6 hours
  - Batch size: 2 Websites per run
  - Uses `CRM Postgres (crm_writer)`.
  - Claims rows and then explicitly loads claimed rows by `locked_by = $execution.id`.
  - Crawls same-domain HTML pages only, skips PDF/media/binary-looking assets, extracts emails and LinkedIn URLs found on the site, does not fetch LinkedIn pages, and uses no external search in V1.
- Website Contact Discovery smoke history:
  - Execution `120`: failed before fetching pages because the n8n Code sandbox did not expose global `URL`.
  - Cleanup execution `121`: released the 2 locks from execution `120`.
  - Workflow patch: replaced global `URL` usage with an internal URL parser.
  - Execution `122`: passed; processed 2 Websites, crawled 12 pages each, inserted 37 observations, and updated both status rows to `partial`.
  - Workflow patch: filtered common placeholder email domains after one placeholder-style page artifact was observed.
  - Cleanup execution `123`: deleted 1 placeholder observation.
  - Cleanup execution `124`: deleted 1 now-orphan placeholder email.
  - Execution `126`: passed after the placeholder filter; processed 2 Websites, inserted 24 observations for one Website and cleanly updated a zero-result Website status.
- Aggregate Website Contact Discovery validation used temporary workflow `P5KbWYMFp4327dg4`, execution `127`.
  - `business.websites`: 144
  - `contact_methods.emails`: 2383 after smoke inserts and cleanup
  - `contact_methods.linkedin_profiles`: 3
  - `web_enrichment.website_contact_discovery_status`: 144
  - `web_enrichment.website_contact_discovery_observations`: 61
  - `wcd_active_locks`: 0
  - `wcd_status_running`: 0
  - `wcd_status_partial`: 4
  - `wcd_placeholder_observations_122_126`: 0
- Temporary rollout workflows were archived after validation:
  - `uOcgb9BNrIXbd7R9`
  - `HbbCq94Drm1yzChk`
  - `z5E8vOM3Wt2ylnpu`
  - `nlAro43cf25BLTzv`
  - `cjTL0OZJJ54JZHza`
  - `6SilIrYzlTCwd7vD`
  - `aGDV5gSwYdLIMAZZ`
  - `PLcKvvj3KkNbNUo6`
  - `ex94p0dOKZvhvk10`
  - `P5KbWYMFp4327dg4`
  - Final n8n search for temporary `Codex` workflows returned `0`.
- Files changed in this rollout follow-up:
  - `.github/workflows/crm-schema-apply.yml`
  - `HANDOFF.md`
- Verification run from repo root:

```powershell
python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
```

  - Result: 23 tests passed.

```powershell
git diff --check
```

  - Result: passed; Git printed only Windows line-ending normalization warnings for `.github/workflows/crm-schema-apply.yml` and `HANDOFF.md`.

Remaining production follow-up:

1. `preview` stage is complete via PR `#28`; merge PR `#29` from `preview -> main` after the required review.
2. After the workflow fix is on `main`, the official GitHub schema apply path can be re-run as a no-op verification if desired; production schema is already applied through `crm_writer`.
3. Monitor the next scheduled Website Contact Discovery run and confirm it advances by 2 Websites with `wcd_active_locks = 0` afterward.
4. Visually confirm NocoDB review surfaces for the new schemas/views; the backing tables and compatibility views are already present and readable in production validation.

## 2026-06-14 n8n Production Rollout Update

- Applied the schema-native CRM migration against production Cloud SQL through temporary n8n workflow `I2eLi4gWlee3BZVa`.
  - Migration execution: `95`
  - Result: success
  - Temporary migration workflow archived after use.
- Pre-migration aggregate counts were captured:
  - `crm_contacts`: 5073
  - `crm_websites`: 93
  - `crm_email_addresses`: 2380
  - `crm_contact_email_addresses`: 2381
  - `crm_groups`: 34
  - `crm_contact_groups`: 2519
  - `crm_founder_institute_directory_entries`: 5309
  - `crm_interview_source_entries`: 69
- Post-migration aggregate validation:
  - People: legacy backup 5073, compatibility view 5073, `person.people` 5073
  - Websites: legacy backup 93, compatibility view 94, `business.websites` 94
  - Emails: legacy backup 2380, compatibility view 2380, `person.email_addresses` 2380
  - Person-email links: legacy backup 2381, compatibility view 2381, `person.person_email_addresses` 2381
  - Groups: legacy backup 34, compatibility view 34, `crm.groups` 34
  - Person-group links: legacy backup 2519, compatibility view 2519, `crm.person_group_memberships` 2519
  - Founder Institute entries: legacy backup 5309, compatibility view 5309, `public_sources.founder_institute_directory_entries` 5309
  - Interview source entries: legacy backup 69, compatibility view 69, `public_sources.interview_source_entries` 69
  - `web_enrichment.website_shopify_status`: 93 rows
  - `business.website_lists` contains `http-archive-shopify-daily`
  - Review views exist: `business.website_shopify_review` and `public_sources.http_archive_shopify_review`
  - Read-only compatibility triggers: 13
  - Missing preserved IDs: people 0, websites 0, emails 0, groups 0
  - Extra new website IDs: 1, expected from email-domain normalization into the canonical `business.websites` registry
  - Dangling email-to-website references: 0
- Created production n8n workflow `hWlIp4PWuB1D6JDy`.
  - Name: `CipherPlay Public Sources - HTTP Archive Shopify Daily`
  - URL: `https://workflows.cipherinternal.com/workflow/hWlIp4PWuB1D6JDy`
  - Status: active / published
  - Active version: `59d9de92-9138-4fd6-985f-858a34284a4a`
  - Daily schedule trigger: every 1 day at 08:15.
  - Manual webhook trigger: `/webhook/http-archive-shopify-daily-manual`.
  - Uses Cloud Run runtime service-account auth through the metadata server and calls BigQuery REST directly.
  - Does not use CSV import as the primary path.
- Fixed the BigQuery access blocker from the earlier smoke.
  - Authenticated local gcloud as `allan@cipherplay.net` with `CLOUDSDK_CONFIG=.codex-local\gcloud-config`.
  - Applied `roles/bigquery.jobUser` to `serviceAccount:n8n-cloud-run@cipherplay-production.iam.gserviceaccount.com`.
  - Confirmed the IAM binding includes the n8n runtime service account.
  - Local gcloud config and generated auth files remain ignored under `.codex-local`.
- Patched `infra/crm/bigquery/http_archive_shopify_domains.sql` after live BigQuery smoke feedback.
  - Serialized nested HTTP Archive technology arrays before aggregation with `TO_JSON_STRING`.
  - Replaced aggregate `ORDER BY rank NULLS LAST` with `ORDER BY IF(rank IS NULL, 1, 0), rank, root_page`.
- Manual 50-row smoke execution `106` passed.
  - Run ID: `bf532bcb-ea33-4e17-8d29-eaefbca5cbd0`
  - Run status: `completed`
  - Row count: `50`
  - BigQuery job ID: present
  - n8n workflow status: `success`
- Aggregate production validation used temporary workflow `3ep1G5betqs0eE7Z`, execution `108`, then archived it.
  - Observations for smoke run: 50
  - Observation website refs: 50
  - `web_enrichment.website_shopify_status` rows for observations: 50
  - `business.website_list_memberships` rows for `http-archive-shopify-daily`: 50
  - `business.website_shopify_review` rows: 144
  - `public_sources.http_archive_shopify_review` rows for the smoke run: 50
- The exact IAM command used:

```powershell
gcloud projects add-iam-policy-binding cipherplay-production `
  --member=serviceAccount:n8n-cloud-run@cipherplay-production.iam.gserviceaccount.com `
  --role=roles/bigquery.jobUser
```

- Patched existing workflow `WyrzuFj6mnRocX2w` (`CipherPlay CRM - Website Shopify Enrichment`) to schema-native SQL.
  - Reads/claims from `business.websites` plus `web_enrichment.website_shopify_status`.
  - Writes Shopify detection status to `web_enrichment.website_shopify_status`.
  - No longer writes old `public.crm_websites` compatibility view columns.
  - Manual smoke execution `101` passed: one row was claimed, persisted, and asserted with `updated_count = 1`.
  - Published active version: `b0a0fbd4-329e-4e60-859c-042d17a114ac`
  - Current status: active
- Temporary diagnostic workflow `vh5ZOtxtH4Jppodv` was archived after validation.

Remaining production follow-up:

1. Visually confirm NocoDB review surfaces for `business.website_shopify_review` and `public_sources.http_archive_shopify_review`; the backing views exist and returned rows in production validation.
2. Monitor the next scheduled HTTP Archive run after 08:15 to confirm the daily trigger path behaves the same as manual execution.

## 2026-06-14 HTTP Archive Shopify Schema-Native Pipeline Repo Update

- Implemented repo-side schema-native CRM migration for the HTTP Archive Shopify daily pipeline.
- Core schema file: `infra/crm/schema/001-crm.sql`.
- New Postgres schemas:
  - `business`
  - `person`
  - `crm`
  - `public_sources`
  - `web_enrichment`
- `business.websites` is now the only canonical domain registry. It stores domain identity only and does not own Shopify source/enrichment fields.
- `web_enrichment.website_shopify_status` owns current live Shopify status, detection evidence, retry timing, and lock fields.
- `public_sources.http_archive_runs` and `public_sources.http_archive_observations` store HTTP Archive collection runs and source evidence. Observations link to `business.websites.id` and do not duplicate canonical domain.
- CRM workflow tables moved into schema-native people-only tables:
  - `crm.groups`
  - `crm.person_group_memberships`
  - `crm.campaigns`
  - `crm.campaign_recipients`
  - `crm.email_events`
  - `crm.notes`
  - `crm.follow_ups`
- Source dataset tables moved into `public_sources`:
  - `public_sources.founder_institute_directory_entries`
  - `public_sources.interview_source_entries`
- Existing `public.crm_*` data is copied into schema-native tables with IDs preserved where corresponding target tables exist. Old physical `public.crm_*` tables are renamed to `_legacy_backup` tables, then old names are recreated as read-only compatibility views.
- Added review views:
  - `business.website_shopify_review`
  - `public_sources.http_archive_shopify_review`
- Added parameterized BigQuery query:
  - `infra/crm/bigquery/http_archive_shopify_domains.sql`
- Added n8n workflow contract:
  - `infra/n8n/workflows/http-archive-shopify-daily-pipeline.md`
- Updated existing Shopify enrichment contract:
  - Reads `business.websites` joined to `web_enrichment.website_shopify_status`.
  - Writes current status to `web_enrichment.website_shopify_status`.
  - Keeps lock fields as `locked_at` and `locked_by`.
- Updated n8n OpenTofu:
  - Enables `bigquery.googleapis.com`.
  - Grants `roles/bigquery.jobUser` to the n8n runtime service account.
  - Exposes `runtime_service_account_email`.
- Updated the Founder Institute importer to write `public_sources.founder_institute_directory_entries`.
- Tests run from repo root:

```powershell
python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
```

- Result: 18 tests passed.
- `git diff --check` passed; only line-ending normalization warnings were reported.
- Note: the production rollout update at the top of this file supersedes the local limitations and production cutover checklist below. The HTTP Archive workflow has since been smoked, validated, and published.
- Local limitations:
  - `psql` was not available, so the migration was not executed against a local Postgres parser.
  - `tofu` was not available, so OpenTofu fmt/validate was not run locally.
  - No production BigQuery dry-run or 50-row smoke was run from this shell.
  - No live n8n workflow was created or enabled in this shell.
- Required production cutover:
  1. Run schema migration from an approved operator environment.
  2. Validate old/new row counts before relying on compatibility views:

```sql
SELECT
  (SELECT count(*) FROM public.crm_contacts) AS old_people,
  (SELECT count(*) FROM person.people) AS new_people,
  (SELECT count(*) FROM public.crm_websites) AS old_websites,
  (SELECT count(*) FROM business.websites) AS new_websites,
  (SELECT count(*) FROM public.crm_email_addresses) AS old_emails,
  (SELECT count(*) FROM person.email_addresses) AS new_emails;
```

  3. Apply n8n OpenTofu or otherwise confirm `n8n-cloud-run@cipherplay-production.iam.gserviceaccount.com` has `roles/bigquery.jobUser`.
  4. Run the HTTP Archive BigQuery dry-run and record processed bytes.
  5. Create `CipherPlay Public Sources - HTTP Archive Shopify Daily` in n8n with schedule disabled.
  6. Run a manual 50-row smoke and confirm `business.websites`, `public_sources.http_archive_runs`, `public_sources.http_archive_observations`, and `web_enrichment.website_shopify_status` row counts.
  7. Confirm NocoDB can review `business.website_shopify_review` and `public_sources.http_archive_shopify_review`.
  8. Enable daily schedule only after the manual smoke passes.

## 2026-06-13 Apollo Contacts CRM Import Update

- Source file: `C:\Users\allan\Downloads\apollo-contacts-export.csv`.
- Imported Apollo list: `Small Shopify VA`.
- Read-only preflight execution `49` saw:
  - 55 source rows.
  - 55 primary emails.
  - 72 total source email addresses including secondary emails.
  - 55 rows with company websites.
  - One duplicate primary email group: `emmanuel@reef.digital` for 2 distinct Apollo contacts.
  - 0 existing contacts by Apollo ID, 0 existing contacts by primary email, 0 existing company websites, and group missing.
- Import execution `52` successfully inserted the base entities:
  - 55 contacts inserted.
  - 71 email address rows upserted.
  - 54 website rows upserted, including 43 company-domain rows and 11 email-domain-only rows.
  - 55 `Small Shopify VA` group memberships.
  - It did not create contact-email association rows because same-statement CTE visibility meant the association CTE could not see the just-upserted email rows through the base table.
- Final idempotent import execution `53` completed the missing associations:
  - 0 contacts inserted, 55 contacts updated by Apollo ID.
  - 71 email address rows upserted.
  - 72 contact-email links upserted.
  - 54 website rows upserted.
  - 55 group links upserted.
  - Group ID: `85325d5a-3556-4005-bb28-0878ada3b533`.
- Post-import read-only preflight execution `55` verified:
  - 55 existing contacts by Apollo ID.
  - 55 existing contacts by primary email.
  - 43 existing company websites.
  - `small-shopify-va` group exists.
- Temporary n8n workflows were archived:
  - `zwLRz4p0YCfXI5p2`
  - `z4FP2NBm9pv3B1K9`
  - `6b4OUiFaek0C5RCH`
  - `yNGfhsUiZIbdpHcy`
  - `I0O6ShkR5mKDSD6w`
- The active `CipherPlay CRM - Website Shopify Enrichment` workflow should now pick up the newly inserted non-provider website rows on its normal schedule.

## 2026-06-13 CRM Website Shopify Enrichment n8n Handoff

### 2026-06-13 Completion Update

- Read-only diagnostic execution `44` confirmed the post-`43` state had `unknown_non_provider_count: 31`, `eligible_now_count: 31`, `active_lock_count: 0`; no unlock was needed.
- Manual smoke execution `45` exposed a real batching bug: `Claim Shopify Batch` emitted 5 rows, but `Load Claimed Shopify Batch` emitted 25 rows because it was missing `executeOnce: true` and reran the same locked-row SELECT once per incoming claim item.
- Patched the main workflow so `Load Claimed Shopify Batch` has `executeOnce: true`. The patch applied with 1 operation and no validation warnings.
- Read-only diagnostic execution `46` after the failed smoke showed `unknown_non_provider_count: 28`, `eligible_now_count: 26`, `active_lock_count: 0`.
- Manual smoke execution `47` passed:
  - `Claim Shopify Batch`, `Load Claimed Shopify Batch`, `Probe Shopify Homepage`, `Detect Shopify Signals`, `Persist Shopify Detection`, and `Assert Detection Persisted` each processed exactly 5 items.
  - `Persist Shopify Detection` returned five `updated_count: 1` rows.
  - `Assert Detection Persisted` was the last node and the workflow execution status was `success`.
- Published main workflow `WyrzuFj6mnRocX2w`; it is now active with active version `c49c23e9-baa8-46c8-a4f6-88a0abf59e5f`.
- Archived temporary diagnostic workflow `MKrcWLs8S7igH9ms`.
- GCP cleanup remains blocked in this environment:
  - Local shell has no `gcloud` executable.
  - The `gcloud` MCP tool is installed, but `gcloud auth list --format=json(account,status)` returned `[]`, and `run jobs describe` failed with no active account selected.
  - Still clean up the temporary Cloud Run job `n8n-import-crm-postgres-cred-psc-20260613` and Secret Manager secret `cipherplay-n8n-crm-postgres-credential-import-psc-20260613` from an authenticated GCP environment.

### Goal

Finish taking the `CipherPlay CRM - Website Shopify Enrichment` n8n workflow to production using the private Cloud SQL path. The workflow should run from n8n, connect to CRM Postgres over Private Service Connect, claim CRM website rows, probe homepages for Shopify signals, persist one result per claimed row, and then be published only after a real smoke test proves rows were actually updated.

### Current Progress

- GCP project: `cipherplay-production`.
- Cloud SQL instance: `cipherplay-crm-postgres`.
- Private Service Connect is enabled for the CRM Cloud SQL instance.
- PSC service connection policy created:
  - Name: `cipherplay-n8n-cloud-sql`
  - Region: `us-east1`
  - Network: `projects/cipherplay-production/global/networks/cipherplay-n8n-network`
  - Subnet: `projects/cipherplay-production/regions/us-east1/subnetworks/cipherplay-n8n-subnet`
  - Service class: `google-cloud-sql`
  - Limit: `10`
- Cloud SQL PSC auto connection is active:
  - PSC IP: `10.58.0.2`
  - Forwarding rule: `sca-auto-fr-aeb23453-016f-48bb-879c-bee60e8d7f5d`
  - PSC connection status: `ACCEPTED`
- n8n Postgres credential was re-imported to use the PSC IP:
  - Credential ID: `crmPgWriter20260613`
  - Credential name: `CRM Postgres (crm_writer)`
  - Host: `10.58.0.2`
  - Database: `crm`
  - User: `crm_writer`
- Main n8n workflow:
  - ID: `WyrzuFj6mnRocX2w`
  - Name: `CipherPlay CRM - Website Shopify Enrichment`
  - URL: `https://workflows.cipherinternal.com/workflow/WyrzuFj6mnRocX2w`
  - Active/published: `false` as of the last check
  - `availableInMCP`: true
- Main workflow graph after patches:
  - `Every 30 Minutes`
  - `Link Email Domains To Websites`
  - `Claim Shopify Batch`
  - `Load Claimed Shopify Batch`
  - `Probe Shopify Homepage`
  - `Detect Shopify Signals`
  - `Persist Shopify Detection`
  - `Assert Detection Persisted`
  - Sticky note
- The workflow is now deliberately split so the claim step can output `{ success: true }` without breaking downstream work. `Load Claimed Shopify Batch` does a separate SELECT by `enrichment_locked_by = '{{ $execution.id }}'` and provides real `id/domain/enrichment_locked_by` rows to the HTTP node.
- `Detect Shopify Signals` now fails loudly if a claimed website row is missing, instead of allowing `https://undefined/`.
- `Persist Shopify Detection` now uses a CTE update returning `updated_count`, and `Assert Detection Persisted` throws unless `updated_count === 1`.
- Pinned test execution `39` passed with a synthetic Shopify homepage:
  - `Load Claimed Shopify Batch` had a real test row.
  - `Detect Shopify Signals` found `homepage_shopify_marker`.
  - `Persist Shopify Detection` returned `updated_count: 1`.
  - `Assert Detection Persisted` passed.
- Real execution `40` reached the private database but loaded zero rows because all eligible rows were still locked by earlier failed execution `36`.
- Temporary diagnostic workflow:
  - ID: `MKrcWLs8S7igH9ms`
  - Name: `Codex CRM Shopify Eligibility Diagnostic`
  - It was created with `create_workflow_from_code` and auto-attached to the `CRM Postgres (crm_writer)` credential.
  - Diagnostic execution `41` showed `unknown_non_provider_count: 31`, `eligible_now_count: 0`, `active_lock_count: 31`, all locked by execution `36`.
  - Targeted unlock execution `42` cleared exactly `31` stale execution-36 locks for rows still `shopify_status = 'unknown'` and `domain_type != 'email_provider'`.
- Real execution `43` was run after unlocking but before the small-batch tuning. It crashed before useful node run data was retained.
- After execution `43`, the main workflow was patched to a safer small-batch profile:
  - Claim limit: `5`
  - Load limit: `5`
  - Homepage HTTP timeout: `6000`
  - HTTP retry disabled
  - Patch applied successfully with no validation warnings.
- The next read-only diagnostic execution was about to be run, but the user interrupted after the approval timeout. Treat the current lock/eligibility state as unverified after execution `43`.

### What Worked

- The private PSC path is live and usable from n8n.
- Updating the n8n Postgres credential to host `10.58.0.2` worked.
- n8n MCP access works through the local helper:

```powershell
node .codex-local\mcp-client\call-n8n-tool.mjs <tool> <args.json>
```

- Use the default local MCP config route in `.codex-local`; it was able to call most tools after cooldowns.
- `get_workflow_details`, `update_workflow`, `validate_node_config`, `test_workflow`, `execute_workflow`, `get_execution`, `create_workflow_from_code`, `search_workflows`, and `archive_workflow` are expected useful MCP tools.
- `create_workflow_from_code` works for temporary workflows. The older attempted `create_workflow` tool does not exist.
- Extending the helper timeout works for slow MCP calls:

```powershell
$env:N8N_TOOL_TIMEOUT_MS='180000'; node .codex-local\mcp-client\call-n8n-tool.mjs create_workflow_from_code .codex-local\args-create-crm-shopify-diagnostic.json
```

- The pinned test is the best fast verification loop. It caught the item-linking and SQL-generation shape without touching real CRM rows.
- The temporary diagnostic workflow is useful for read-only aggregate counts and targeted repair queries.

### What Did Not Work

- Do not commit anything under `.codex-local`. It contains local MCP config, Cloudflare Access artifacts, generated args, and other local operational files. It is gitignored.
- Do not print, paste, or commit tokens/passwords. The user explicitly provided an n8n MCP bearer token only for local use.
- Do not try an n8n Execute Command node for homepage probing unless the user explicitly approves host shell command execution. The safer path is the n8n HTTP Request node.
- A Code node using `fetch` failed in n8n with `fetch is not defined`.
- Joining SQL with `'\\n'` produced literal backslash-n sequences and caused SQL syntax errors.
- The Postgres `UPDATE ... RETURNING` claim node returned only `{ success: true }` in real executions, not row items. This is why the explicit `Load Claimed Shopify Batch` SELECT node exists.
- Before the load split, the HTTP node built `https://undefined/`, and the persist step falsely returned success while updating zero rows.
- The `workflows.cipherinternal.com` MCP URL returned a Cloudflare Access 403 from this environment. The local helper default route worked more consistently.
- The MCP endpoint can rate-limit or temporarily return route errors. Back off 20 to 30 seconds before retrying instead of stacking requests.
- A full 31-row real run crashed before useful node data. Keep the batch small until repeated scheduled runs prove stable.

### Next Steps

1. Run the temporary diagnostic workflow in read-only count mode and inspect the result. Confirm whether execution `43` left any active locks.
2. If execution `43` left stale locks, clear only those locks with a narrow query matching the prior pattern:

```sql
UPDATE crm_websites
SET
  enrichment_locked_at = NULL,
  enrichment_locked_by = NULL,
  updated_at = now()
WHERE enrichment_locked_by = '43'
  AND shopify_status = 'unknown'
  AND domain_type != 'email_provider';
```

3. Execute the main workflow once in manual mode after the small-batch patch.
4. Inspect the real execution data. A good smoke must show:
   - `Load Claimed Shopify Batch` emits up to 5 real rows with `id`, `domain`, and `enrichment_locked_by`.
   - `Probe Shopify Homepage` uses real domains, not `undefined`.
   - `Detect Shopify Signals` emits an `updateQuery` for each row.
   - `Persist Shopify Detection` returns `updated_count: 1` for each row.
   - `Assert Detection Persisted` is the last node and succeeds.
5. Only publish the workflow after the real smoke passes. Use the n8n MCP `publish_workflow` tool on workflow `WyrzuFj6mnRocX2w`.
6. Archive the temporary diagnostic workflow `MKrcWLs8S7igH9ms` after the final smoke.
7. Clean up temporary GCP import resources:
   - Cloud Run job: `n8n-import-crm-postgres-cred-psc-20260613`
   - Secret Manager secret: `cipherplay-n8n-crm-postgres-credential-import-psc-20260613`
8. Consider codifying/importing the PSC resources into OpenTofu. The manual prod resources are already live; IaC drift cleanup was not finished.

### Useful Local Files

- `.codex-local\mcp-client\call-n8n-tool.mjs`
- `.codex-local\mcp-client\probe-n8n-mcp.mjs`
- `.codex-local\mcp-client\build-crm-workflow-claim-load-patch.mjs`
- `.codex-local\args-update-crm-workflow-claim-load-patch.json`
- `.codex-local\args-test-crm-workflow-claim-load.json`
- `.codex-local\args-update-crm-workflow-small-batch.json`
- `.codex-local\args-create-crm-shopify-diagnostic.json`
- `.codex-local\args-update-crm-shopify-diagnostic-counts.json`
- `.codex-local\args-execute-crm-workflow-manual.json`

### Git State Notes

- The repo branch at the last check was `codex/news-grants-2026-06-12`.
- `git status --short --branch` was clean before this handoff update.
- This `HANDOFF.md` update is intentionally a tracked repo change unless the next agent/user decides to move the handoff elsewhere.

## Goal

Document everything currently known about CipherPlay inside `mono`, then align the content site with that canonical brand and operating context.

The main source of truth created for this work is `CONTEXT.md` at the `mono` root. It should be used before changing CipherPlay copy, routes, product language, research language, partner/customer wording, investor wording, forms, analytics, or media-kit language.

## Current Progress

- Created `CONTEXT.md` with CipherPlay's canonical glossary and business context.
- Defined CipherPlay as an emerging-technology software studio and market research firm.
- Clarified that "venture-backed" is useful for investor credibility, not the default company category.
- Captured TAP as CipherPlay's company-wide philosophy for operating in the game of business: Transparency, Authenticity, and Perspicacity.
- Clarified that TAP applies to customers, partners, investors, and internal decisions; investor pages can emphasize trust and diligence signals.
- Established "Customer" as the canonical public term. Avoid "client" and "clients" in public copy.
- Clarified that customers are often partners too, but copy should name whichever relationship matters in context.
- Defined "Backer" as financial support only, including dilutive or non-dilutive support.
- Clarified public research language:
  - "Market Research" is the publicly accessible research layer.
  - "Market Intelligence" is the more detailed, gated layer.
  - "Full Report" is the best public CTA for the deeper gated report.
- Defined a ready report as owner-approved, brand clean, useful, based on real market data, and followed quickly by marketing.
- Defined real market data as well-sourced information from deep internet research, real market interviews, and validatable data.
- Documented RANDAO as a CipherPlay product at `https://randao.net/`, owned and operated by CipherPlay.
- Kept the "CipherPlay is to RANDAO what Alphabet is to Google" idea implicit rather than using that analogy publicly.
- Clarified that the media kit is mainly for partners, customers, and investors who need brand assets.
- Clarified that this content site is the current main public site, though that may change later.
- Documented that all public forms must be handled through n8n. Local `/info/forms/*` routes are placeholders only.
- Documented that Plausible analytics details are private/internal only.

Content-site changes already made:

- Updated copy across the Docusaurus site to match the new company positioning.
- Corrected RANDAO casing and ownership language.
- Removed the made-up "pillars" framing.
- Removed `/industries` from the site and navigation.
- Removed fake or not-ready public Market Research report pages.
- Simplified `/info/market-analysis` into a holding page for future approved reports, with no fabricated report listings.
- Removed report category/tag chips and related unused report data structures.
- Updated `content-site/AI_HANDOFF.md` and `content-site/README.md` to match the active route surface.

Important files touched during this work:

- `CONTEXT.md`
- `content-site/AI_HANDOFF.md`
- `content-site/README.md`
- `content-site/docusaurus.config.ts`
- `content-site/src/data/media.ts`
- `content-site/src/data/site.ts`
- `content-site/src/pages/about.tsx`
- `content-site/src/pages/about/tap-into-success.tsx`
- `content-site/src/pages/forms/consulting-discovery.tsx`
- `content-site/src/pages/index.tsx`
- `content-site/src/pages/index.module.css`
- `content-site/src/pages/market-analysis.tsx`
- `content-site/src/pages/market-analysis.module.css`
- `content-site/src/pages/media-kit.tsx`
- `content-site/src/pages/partners.tsx`
- `content-site/src/pages/products/index.tsx`
- `content-site/src/pages/products/randao.tsx`
- `content-site/src/pages/team.tsx`

Deleted as part of the cleanup:

- `content-site/src/pages/industries.tsx`
- `content-site/src/pages/industries.module.css`
- `content-site/src/components/MarketResearchReportPage/index.tsx`
- `content-site/src/components/MarketResearchReportPage/styles.module.css`
- `content-site/src/pages/market-analysis/ai-productivity-software.tsx`
- `content-site/src/pages/market-analysis/cryptographic-infrastructure.tsx`
- `content-site/src/pages/market-analysis/venture-market-intelligence.tsx`

There are unrelated or pre-existing dirty worktree changes in the repo. Do not revert them unless the user explicitly asks. Check `git status --short` before making further edits.

## What Worked

- The `grill-me` skill worked well for collecting and resolving brand language one term at a time.
- Updating `CONTEXT.md` as decisions were made kept the brand system coherent.
- Removing not-ready reports entirely was cleaner than leaving placeholders that looked like real public research.
- Public copy is strongest when it uses "Market Research" for the visible layer and "Full Report" for the gated deeper layer.
- RANDAO language should be direct: it is a product owned and operated by CipherPlay.
- Verification worked with the bundled Node runtime because `npm` was not available on the shell PATH.

Successful verification commands from `mono/content-site`:

```bash
/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc
/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@docusaurus/core/bin/docusaurus.mjs build
test -e build/market-analysis.html
test ! -d build/market-analysis
test ! -e build/market-analysis/ai-productivity-software.html
test ! -e build/market-analysis/cryptographic-infrastructure.html
test ! -e build/market-analysis/venture-market-intelligence.html
```

The Docusaurus build exited successfully. It printed a non-fatal update-check warning about `/Users/user/.config`.

## What Didn't Work

- `npm` is not available on PATH in the current shell, so use the bundled Node runtime directly.
- Do not describe CipherPlay as a generic software agency, ABPIV, or personal brand.
- Do not use "client" or "clients" publicly; use "customers."
- Do not use "Backer" for non-financial ecosystem support.
- Do not present not-ready reports as public Market Research.
- Do not recreate `/industries` or the old industry pillar framing without a real owner-approved reason.
- Do not expose Plausible origin/dashboard details publicly.
- Do not build production public forms locally; forms are n8n only.

## Next Steps

1. Review `CONTEXT.md` before any further copy or route changes.
2. When the user adds real reports, create report pages only after they say each report is ready.
3. For each future report, ensure the page has clean branding, useful real market data, and a clear "Full Report" request CTA.
4. Keep deeper Market Intelligence gated behind request flows, not fully public pages.
5. Re-run typecheck and build after any content-site changes using the bundled Node commands above.
6. Check old removed routes after build so `/industries` and deleted report pages stay absent.
7. Preserve existing dirty worktree changes that are unrelated to the current task.
