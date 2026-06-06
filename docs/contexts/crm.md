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
- `crm_groups`
- `crm_contact_groups`
- `crm_campaigns`
- `crm_campaign_recipients`
- `crm_email_events`
- `crm_notes`
- `crm_follow_ups`

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

Keep the first investor-campaign MVP in operator-approved mode. Do not send fully automatic campaigns until deliverability, approval, and logging are proven.

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
