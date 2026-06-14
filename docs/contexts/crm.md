# CRM Context (`@crm`)

When the user says `@crm`, read this file first. It is the fast context pack for the CipherPlay CRM and database setup in `CipherPlayLabs/mono`.

## What This Is

CipherPlay CRM is a self-hosted NocoDB deployment backed by Cloud SQL PostgreSQL. NocoDB gives the Airtable-like operator UI. PostgreSQL remains the source of truth. n8n is expected to drive campaign workflows by reading/writing the CRM data database directly, while NocoDB reflects the same tables for review and manual edits.

Architecture:

```text
Operator
  -> Cloudflare Access on crm.cipherinternal.com
  -> GCP external HTTPS load balancer
  -> Cloud Run NocoDB service
  -> Serverless VPC connector
  -> Cloud SQL PostgreSQL private IP
```

Do not store investor/contact data or passwords in git.

## Repo Anchors

- `infra/crm/README.md`: operator overview, bootstrap, schema, and n8n contract.
- `infra/crm/opentofu/`: OpenTofu project for GCP and Cloudflare resources.
- `infra/crm/opentofu/README.md`: IaC-specific commands and bootstrap notes.
- `infra/crm/schema/001-crm.sql`: CRM schema and seed group.
- `.github/workflows/crm-validate.yml`: CRM OpenTofu validation.
- `.github/workflows/crm-apply.yml`: production-gated OpenTofu apply.
- `.github/workflows/crm-redeploy.yml`: production-gated Cloud Run image redeploy.
- `.github/workflows/crm-origin-cert.yml`: fallback Cloudflare Origin CA certificate installer.

## Live Deployment Facts

Last verified: 2026-06-06.

- UI: `https://crm.cipherinternal.com`
- GCP project: `cipherplay-production`
- Region: `us-east1`
- NocoDB image: `docker.io/nocodb/nocodb:latest`
- Cloud Run service: `cipherplay-crm`
- Latest verified Cloud Run revision: `cipherplay-crm-00002-s8l`
- Cloud Run ingress: internal/external load balancer only
- Cloud Run VPC egress: private ranges only
- Load balancer IP: `8.232.27.138`
- Cloudflare zone: `cipherinternal.com`
- Cloudflare Access app: `CipherPlay CRM`
- Cloudflare Access allowed emails: `developer@randao.net`, `allan@cipherplay.net`
- Google-managed origin certificate: `cipherplay-crm-certificate`
- Certificate state at last check: `ACTIVE`
- Certificate map: `cipherplay-crm-cert-map`
- Certificate map entry: `cipherplay-crm`

Cloud Run must include these NocoDB external DB settings:

- `NC_CONNECT_TO_EXTERNAL_DB_DISABLED=false`
- `NC_ALLOW_LOCAL_EXTERNAL_DBS=true`

`NC_ALLOW_LOCAL_EXTERNAL_DBS=true` is required because the CRM data source is a private Cloud SQL host. Without it, NocoDB rejects the connection with `Connection to internal hosts is not allowed`.

## Cloud SQL

- Instance: `cipherplay-crm-postgres`
- Connection name: `cipherplay-production:us-east1:cipherplay-crm-postgres`
- Engine: `POSTGRES_16`
- Tier: `db-g1-small`
- Private IP: `10.216.0.3`
- Public IPv4: disabled
- State at last check: `RUNNABLE`
- Backups: enabled
- Point-in-time recovery: enabled
- Retained backups: 7
- Transaction log retention: 7 days

Databases:

- `nocodb`: NocoDB internal metadata database.
- `crm`: shared operational data database for separate Postgres schemas such as `business`, `person`, `crm`, `public_sources`, and `web_enrichment`.
- `postgres`: default admin database.

Users:

- `nocodb`: used only by NocoDB for its internal metadata database.
- `crm_writer`: used by NocoDB external data-source connections, n8n, and approved operators for CRM data.
- `postgres`: default admin user.

## Secret Manager

Secret containers are managed by OpenTofu. Secret values are populated out of band and must not be committed.

- `cipherplay-crm-nocodb-nc-db`: full `NC_DB` metadata connection string for NocoDB.
- `cipherplay-crm-nocodb-auth-jwt-secret`: stable NocoDB auth JWT secret.
- `cipherplay-crm-nocodb-connection-encrypt-key`: stable NocoDB connection encryption key.
- `cipherplay-crm-postgres-password`: password for `crm_writer`.

To retrieve the CRM database password from an approved operator shell:

```bash
gcloud secrets versions access latest \
  --project=cipherplay-production \
  --secret=cipherplay-crm-postgres-password
```

Never print or paste secret values into chat, docs, git, GitHub Actions logs, or NocoDB screenshots.

## Connecting NocoDB To The CRM Database

Inside the NocoDB UI, add an external PostgreSQL data source for the CRM data database:

- Host: `10.216.0.3`
- Port: `5432`
- Database: `crm`
- Schema: `public`
- User: `crm_writer`
- Password: Secret Manager value for `cipherplay-crm-postgres-password`
- SSL: off/disabled

Use the `crm` database, not the `nocodb` database. `nocodb` is only for NocoDB's internal metadata.

The `crm` database should use Postgres schemas for domain boundaries. Do not create separate Cloud SQL databases for `business`, `person`, `crm`, `public_sources`, or `web_enrichment` unless a future isolation requirement justifies the extra operational complexity.

## CRM Schema

`infra/crm/schema/001-crm.sql` defines the schema-native data contract:

- `business.websites`: the only canonical domain registry.
- `business.website_lists` and `business.website_list_memberships`: domain review cohorts.
- `person.people`: human identities migrated from contacts.
- `person.email_addresses` and `person.person_email_addresses`: observed email identity and Person associations.
- `crm.groups`, `crm.person_group_memberships`, `crm.campaigns`, `crm.campaign_recipients`, `crm.email_events`, `crm.notes`, and `crm.follow_ups`: people-only V1 CRM workflows.
- `public_sources.founder_institute_directory_entries` and `public_sources.interview_source_entries`: low-coupled source datasets.
- `public_sources.http_archive_runs` and `public_sources.http_archive_observations`: HTTP Archive collection runs and source evidence.
- `web_enrichment.website_shopify_status`: current live Shopify status and evidence.
- `public.crm_*`: temporary read-only compatibility views after migration; new writes must use schema-native tables.

## CRM Data Terms

**Founder Institute Data**:
Low-coupled source data collected from the Founder Institute network directory for CRM enrichment. Founder Institute Data lives first in `public_sources.founder_institute_directory_entries`, preserving FI-specific source URLs, specializations, mentor notes, page/filter provenance, collection timestamps, and raw card payloads without making FI fields first-class person fields. Entries can later be linked to `person.people` through nullable `person_id` after the source dataset has been cleaned.
_Avoid_: Founders Institute Data, generic contact fields, one CRM group per FI specialization

**Founder Institute Contact Import**:
After the Founder Institute source dataset is collected and cleaned, each FI person should create or update a canonical `person.people` row with standard identity information such as display name, first name, last name, organization, role title, and reachable public profile fields where available. LinkedIn profile URL is the primary dedupe and identity key for promoted FI people. When LinkedIn is missing, the promotion step should use normalized display name, organization, and role title as a weaker fallback identity key.
_Avoid_: direct-to-contact scraping, FI-only contacts, duplicating standard contact fields only in FI tables after promotion

**Interview Source Data**:
Low-coupled source data exported from Allan's interview sheet for CRM enrichment and customer-discovery follow-up. Interview Source Data lives first in `public_sources.interview_source_entries`, preserving source row numbers, Airtable-style attachment/profile fields, interview status/date text, notes, transcripts, JTBD analysis, and raw row payloads without making interview-specific fields first-class person fields. Entries can later be linked to `person.people` through nullable `person_id` after the source dataset has been cleaned.
_Avoid_: direct-to-contact CSV imports, losing raw interview notes, treating the misspelled source column `Ecosytstem Role` as canonical CRM terminology

**Website**:
A canonical registrable domain tracked as a shared business web identity, such as `example.com`, with any raw submitted URL or host preserved separately as input provenance. In V1, Website means domain identity only, not an organization, company, brand, storefront, or account.
Website rows can exist for unreviewed observed domains because they are neutral identities, not prospect approvals or outreach intent.
_Avoid_: CRM-only row, approved prospect, company, brand, account, duplicate canonical domain field, URL, page, arbitrary host, one row per subdomain, source-dataset record, enrichment-result record

**Website Domain Type**:
A small operational classification for Website rows: `unknown`, `business`, or `email_provider`. Email-provider Websites preserve email-domain associations but should not be treated as ecommerce prospects.
Website Domain Type belongs on Website because it describes the domain identity itself, not a public source observation or enrichment result.
_Avoid_: broad industry taxonomy, one type per source, Shopify status as domain type

**Email Address**:
A canonical observed email address tracked separately from CRM contacts and People, because seeing an address is not the same as confirming the person identity behind it. Email Address can represent a personal inbox, role inbox, or unknown address kind, and can link to a Website without requiring a Person.
_Avoid_: contact field, person, automatic contact promotion, assuming role inboxes are people

**Email Domain Website Discovery**:
The CRM enrichment rule that every new Email Address should derive its canonical email domain and link to a Website row, creating the Website when it does not already exist. Common inbox-provider domains still get Website rows for association, but they should be classified as email providers and skipped for Shopify enrichment.
_Avoid_: manual-only domain creation, contact promotion from email domain alone, Shopify checks for Gmail-style provider domains

**Contact Email Address**:
A trusted or candidate link between a Person and an Email Address, allowing one Person to have multiple observed addresses while keeping email identity outside CRM workflow rows. Contact Email Address replaces `crm_contacts.email` as the source of truth for contact email identity.
_Avoid_: one email per person, unverified contact email, `crm_contacts.email`, overwriting person identity from observed email alone

**CRM Campaign Target**:
In V1, a CRM Campaign targets People through trusted or candidate email identity. Business or Website-targeted campaigns may be added later, but current campaigns should not send directly to Website rows.
_Avoid_: website as email recipient, automatic business campaign, inferred recipient from domain alone

**CRM Group**:
In V1, a CRM Group is a people-only grouping used for review, outreach, and campaign workflows. Website or domain review cohorts should live outside CRM groups until business-targeted CRM workflows are deliberately added.
_Avoid_: website group, domain cohort, mixed person-and-website group

**Schema-Native Migration**:
The migration of existing flat `crm_*` tables into domain-oriented Postgres schemas while preserving existing data, IDs, associations, and operator meaning. Schema-Native Migration should move data without loss before old table names or workflow references are retired.
Temporary read-only compatibility views may preserve old names during transition, but old flat table names should be deprecated once n8n and NocoDB are schema-native.
_Avoid_: destructive rename, partial copy, losing existing row IDs, breaking associations silently, writable compatibility views, permanent compatibility layer

**Shopify Website Status**:
A ternary operator-facing projection for a Website: `unknown`, `true`, or `false`, derived from Web Enrichment Results. Unknown means Shopify detection has not produced a conclusion yet, not that the Website is known to be non-Shopify.
_Avoid_: source observation, raw enrichment payload, confidence score as the primary status, DNS-only Shopify proof, treating failed checks as false

**Website Enrichment**:
An n8n-driven process that evaluates Website rows and produces separate enrichment results. Website Enrichment can relate its results to a Website, but the canonical Website row should not store raw live-check evidence or source-dataset payloads.
_Avoid_: manual-only website review, database-trigger automation, one-time imports, NocoDB metadata automation, source data on Website rows

**Public Source Observation**:
An observed public-dataset or public-API record that may identify or describe a Website, such as an HTTP Archive technology observation. Source-specific observation tables should be organized by source, query-scoped by fields or metadata, and rolled up to the source grain useful for review, such as one HTTP Archive row per Website per crawl/query.
_Avoid_: Website, duplicate canonical domain, query-named source table, raw page mirror, live enrichment result, contact, final truth

**Public Source Collection**:
An n8n-run collection process that queries a public source directly, such as running HTTP Archive BigQuery from n8n, and writes normalized observations into source-specific tables. Public Source Collection should be scheduled, repeatable, and idempotent without relying on manual CSV handoffs.
_Avoid_: manual-only import, source scraping, one-off spreadsheet upload, user-auth-only run

**Operator Review View**:
A read-oriented Postgres view designed for NocoDB review workflows, combining schema-native tables without making one table own another schema's facts. Operator Review Views can join Website identity, public source observations, and web enrichment status for review convenience.
_Avoid_: denormalized source of truth, writable workflow table, hidden data migration

**Web Enrichment Result**:
A live or scheduled current-state result about a Website, such as current Shopify detection evidence. V1 Web Enrichment Results should preserve the latest accurate status and evidence separately from the canonical Website row without requiring full attempt history.
_Avoid_: Website, public source observation, CRM contact field, mandatory attempt log

The seed group is:

- slug: `potential-investors`
- name: `Potential Investors`
- purpose: MVP group for the first 20 potential-investor email campaign.

The intended workflow is:

1. Put people in `person.people`.
2. Assign them to `crm.groups` through `crm.person_group_memberships`.
3. Create a campaign in `crm.campaigns`.
4. Track per-person state in `crm.campaign_recipients`.
5. Record sends, replies, bounces, skips, and manual notes in `crm.email_events`.
6. Track next actions in `crm.follow_ups`.

## n8n Contract

n8n should connect directly to Cloud SQL/Postgres as `crm_writer` and use the `crm` database. n8n should not write to the `nocodb` metadata database.

First useful workflows:

- Read eligible people by group and campaign status.
- Generate per-recipient email drafts.
- Wait for operator approval before sending.
- Write draft/send/reply/bounce/manual-note events into `crm.email_events`.
- Update `crm.campaign_recipients.status`, `sent_at`, `replied_at`, `last_event_at`, and `n8n_execution_id`.
- Create or close `crm.follow_ups`.
- Run `website-email-domain-discovery` every 30 minutes to link `person.email_addresses` to `business.websites`.
- Run `website-shopify-enrichment` every 30 minutes to update `web_enrichment.website_shopify_status` without writing to the `nocodb` metadata database.
- Run the HTTP Archive Shopify daily pipeline by querying BigQuery directly from n8n and writing `business.websites`, `public_sources.http_archive_runs`, `public_sources.http_archive_observations`, and `web_enrichment.website_shopify_status`.

Keep the first investor-campaign MVP in operator-approved mode. Do not send fully automatic campaigns until deliverability, approval, and logging are proven.

The repo-owned workflow contracts are `infra/n8n/workflows/crm-website-shopify-enrichment.md` and `infra/n8n/workflows/http-archive-shopify-daily-pipeline.md`.

## GitHub Variables And Secrets

Repository variables used by CRM workflows:

- `CLOUDFLARE_ACCOUNT_ID`
- `CRM_ACCESS_ALLOWED_EMAILS`
- `CRM_CLOUD_RUN_SERVICE`
- `CRM_ENABLE_CLOUDFLARE_EDGE`
- `CRM_GCP_PROJECT_ID`
- `CRM_GCP_REGION`
- `CRM_GCP_SERVICE_ACCOUNT`
- `CRM_GCP_WORKLOAD_IDENTITY_PROVIDER`
- `CRM_GITHUB_OIDC_PRINCIPAL_SET`
- `CRM_HOSTNAME`
- `CRM_ZONE_NAME`
- Optional: `CRM_NOCODB_IMAGE`
- Optional: `CRM_ORIGIN_CERTIFICATE_OVERRIDE`
- Optional: `CRM_CLOUDFLARE_ACCESS_AUTH_DOMAIN`
- Optional: `CRM_CLOUDFLARE_ACCESS_ORGANIZATION_NAME`
- Optional: `CRM_MANAGE_CLOUDFLARE_ACCESS_ORGANIZATION`

Repository secret:

- `CLOUDFLARE_API_TOKEN`

The current Cloudflare token is sufficient for DNS and Access management. The `crm-origin-cert.yml` fallback requires Cloudflare Origin CA permission; a prior attempt failed with HTTP 401 when that permission was missing.

## Common Commands

Validate CRM IaC locally:

```bash
tofu fmt -check -recursive infra/crm/opentofu
tofu -chdir=infra/crm/opentofu init -backend=false -input=false
tofu -chdir=infra/crm/opentofu validate
```

Run production apply from `main`:

```bash
gh workflow run crm-apply.yml --ref main -f confirm_apply=apply
```

Redeploy the configured NocoDB image:

```bash
gh workflow run crm-redeploy.yml --ref main -f confirm_redeploy=redeploy
```

Check the live Cloud Run environment:

```bash
gcloud run services describe cipherplay-crm \
  --project=cipherplay-production \
  --region=us-east1 \
  --format='yaml(spec.template.spec.containers[0].env,status.latestReadyRevisionName,status.conditions)'
```

Check Cloud SQL:

```bash
gcloud sql instances describe cipherplay-crm-postgres \
  --project=cipherplay-production \
  --format='yaml(name,connectionName,region,databaseVersion,state,ipAddresses,settings.tier,settings.backupConfiguration)'
```

Check the origin certificate:

```bash
gcloud certificate-manager certificates describe cipherplay-crm-certificate \
  --project=cipherplay-production \
  --location=global \
  --format='yaml(name,managed.state,managed.domains,managed.authorizationAttemptInfo)'
```

Check pending production approvals for a workflow run:

```bash
gh api repos/CipherPlayLabs/mono/actions/runs/RUN_ID/pending_deployments
```

Approve the production gate by API when appropriate:

```bash
gh api repos/CipherPlayLabs/mono/actions/runs/RUN_ID/pending_deployments \
  -X POST \
  -F 'environment_ids[]=15892864673' \
  -f state=approved \
  -f comment='Approve CRM infrastructure change'
```

## Operational Notes

- The CRM is self-hosted: NocoDB runs on Cloud Run, and data lives in Cloud SQL.
- The operator UI is Cloudflare Access-protected, not public.
- Cloud SQL is private-IP only, so NocoDB and n8n need VPC-connected runtime paths.
- NocoDB attachment/file-field storage is not configured yet.
- OpenTofu creates secret containers only; it does not generate or store secret values.
- GitHub Actions authenticate to GCP through Workload Identity Federation/OIDC. Do not add service account JSON keys.
- Production apply and redeploy workflows require the GitHub `production` environment gate.
- Direct pushes to `main` may show branch-protection bypass warnings for admin users; prefer PRs unless the production workflow must exist on `main` before it can run.
- A previous Cloudflare 525 came from origin TLS/certificate mismatch while the Google-managed cert was provisioning. As of 2026-06-06, the Google-managed certificate and certificate map entry were active.
