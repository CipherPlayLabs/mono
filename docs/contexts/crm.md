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
- `crm`: business CRM data database for contacts, groups, campaigns, email events, notes, and follow-ups.
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

## CRM Schema

`infra/crm/schema/001-crm.sql` defines the initial data contract:

- `crm_contacts`
- `crm_websites`
- `crm_email_addresses`
- `crm_contact_email_addresses`
- `crm_groups`
- `crm_contact_groups`
- `crm_campaigns`
- `crm_campaign_recipients`
- `crm_email_events`
- `crm_notes`
- `crm_interview_source_entries`
- `crm_follow_ups`
- `crm_founder_institute_directory_entries`

## CRM Data Terms

**Founder Institute Data**:
Low-coupled source data collected from the Founder Institute network directory for CRM enrichment. Founder Institute Data lives first in `crm_founder_institute_directory_entries`, preserving FI-specific source URLs, specializations, mentor notes, page/filter provenance, collection timestamps, and raw card payloads without making FI fields first-class contact fields. Entries can later be linked to `crm_contacts` through nullable `contact_id` after the source dataset has been cleaned.
_Avoid_: Founders Institute Data, generic contact fields, one CRM group per FI specialization

**Founder Institute Contact Import**:
After the Founder Institute source dataset is collected and cleaned, each FI person should create or update a canonical `crm_contacts` row with standard contact information such as display name, first name, last name, organization, role title, and reachable public profile fields where available. LinkedIn profile URL is the primary dedupe and identity key for promoted FI contacts. When LinkedIn is missing, the promotion step should use normalized display name, organization, and role title as a weaker fallback identity key.
_Avoid_: direct-to-contact scraping, FI-only contacts, duplicating standard contact fields only in FI tables after promotion

**Interview Source Data**:
Low-coupled source data exported from Allan's interview sheet for CRM enrichment and customer-discovery follow-up. Interview Source Data lives first in `crm_interview_source_entries`, preserving source row numbers, Airtable-style attachment/profile fields, interview status/date text, notes, transcripts, JTBD analysis, and raw row payloads without making interview-specific fields first-class contact fields. Entries can later be linked to `crm_contacts` through nullable `contact_id` after the source dataset has been cleaned.
_Avoid_: direct-to-contact CSV imports, losing raw interview notes, treating the misspelled source column `Ecosytstem Role` as canonical CRM terminology

**Website**:
A canonical registrable domain tracked as one CRM row, such as `example.com`, with any raw submitted URL or host preserved separately as input provenance. Website does not mean every observed subdomain or URL unless a later source table explicitly models hosts.
_Avoid_: URL, page, arbitrary host, one row per subdomain

**Website Domain Type**:
A small CRM classification for Website rows: `unknown`, `business`, or `email_provider`. Email-provider Websites preserve email-domain associations but should not be treated as ecommerce prospects.
_Avoid_: broad industry taxonomy, one type per source, Shopify status as domain type

**Email Address**:
A canonical observed email address tracked separately from `crm_contacts`, because seeing an address is not the same as confirming the person identity behind it. Email Address can link to a Website through its domain and to a Contact only after the identity match is trusted.
_Avoid_: contact field, person, automatic contact promotion

**Email Domain Website Discovery**:
The CRM enrichment rule that every new Email Address should derive its canonical email domain and link to a Website row, creating the Website when it does not already exist. Common inbox-provider domains still get Website rows for association, but they should be classified as email providers and skipped for Shopify enrichment.
_Avoid_: manual-only domain creation, contact promotion from email domain alone, Shopify checks for Gmail-style provider domains

**Contact Email Address**:
A trusted or candidate link between a Contact and an Email Address, allowing one Contact to have multiple observed addresses while keeping email identity outside the canonical Contact row. Contact Email Address replaces `crm_contacts.email` as the source of truth for contact email identity.
_Avoid_: one email per contact, unverified contact email, `crm_contacts.email`, overwriting contact identity from observed email alone

**Shopify Website Status**:
A ternary CRM enrichment result for a Website: `unknown`, `true`, or `false`. Unknown means Shopify detection has not produced a conclusion yet, not that the Website is known to be non-Shopify.
_Avoid_: confidence score as the primary status, DNS-only Shopify proof, treating failed checks as false

**Website Enrichment**:
An n8n-driven CRM process that evaluates newly created and unresolved Website rows on a 30-minute polling cadence. Website Enrichment should update the Website's ternary Shopify Website Status while preserving detection signals and errors as supporting evidence.
_Avoid_: manual-only website review, database-trigger automation, one-time imports, NocoDB metadata automation

The seed group is:

- slug: `potential-investors`
- name: `Potential Investors`
- purpose: MVP group for the first 20 potential-investor email campaign.

The intended workflow is:

1. Put people in `crm_contacts`.
2. Assign them to `crm_groups`.
3. Create a campaign in `crm_campaigns`.
4. Track per-person state in `crm_campaign_recipients`.
5. Record sends, replies, bounces, skips, and manual notes in `crm_email_events`.
6. Track next actions in `crm_follow_ups`.

## n8n Contract

n8n should connect directly to Cloud SQL/Postgres as `crm_writer` and use the `crm` database. n8n should not write to the `nocodb` metadata database.

First useful workflows:

- Read eligible contacts by group and campaign status.
- Generate per-recipient email drafts.
- Wait for operator approval before sending.
- Write draft/send/reply/bounce/manual-note events into `crm_email_events`.
- Update `crm_campaign_recipients.status`, `sent_at`, `replied_at`, `last_event_at`, and `n8n_execution_id`.
- Create or close `crm_follow_ups`.
- Run `website-email-domain-discovery` every 30 minutes to link `crm_email_addresses` to `crm_websites`.
- Run `website-shopify-enrichment` every 30 minutes to update `crm_websites.shopify_status` without writing to the `nocodb` metadata database.

Keep the first investor-campaign MVP in operator-approved mode. Do not send fully automatic campaigns until deliverability, approval, and logging are proven.

The repo-owned workflow contract for website/email-domain enrichment is `infra/n8n/workflows/crm-website-shopify-enrichment.md`.

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
