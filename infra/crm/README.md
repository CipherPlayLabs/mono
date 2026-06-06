# CipherPlay CRM Infrastructure

This directory contains the isolated infrastructure for CipherPlay's self-hosted CRM surface. It follows the same OpenTofu-first shape as `infra/n8n`: dedicated state, dedicated networking, a Cloud Run application, Cloud SQL PostgreSQL, Secret Manager bootstrap placeholders, and optional Cloudflare DNS plus Access protection.

## Architecture

```text
Operator
  -> Cloudflare Access on crm.cipherinternal.com
  -> GCP external HTTPS load balancer
  -> Cloud Run NocoDB service
  -> Cloud SQL PostgreSQL private IP
```

PostgreSQL is the source of truth for CRM data. NocoDB provides the Airtable-like operator UI and stores its own metadata in a separate database on the same Cloud SQL instance. n8n should read and write the CRM database directly for campaign workflows, then NocoDB reflects that data for review and manual edits.

## Runtime Contract

- Image: `docker.io/nocodb/nocodb:latest`
- Cloud Run CPU: 1 vCPU
- Cloud Run memory: 2 GiB
- CPU allocation: always allocated
- Cloud Run instances: min 1, max 1
- Concurrency: 20
- Database: Cloud SQL PostgreSQL over private IP
- CRM UI hostname: `crm.cipherinternal.com`
- Public access model: Cloudflare Access-protected internal tool

NocoDB attachment/file-field storage is not configured in this MVP. Treat the CRM as structured relationship, campaign, and email-event data until object storage is added.

## Workflows

- `.github/workflows/crm-validate.yml`: validates formatting and OpenTofu configuration for CRM changes.
- `.github/workflows/crm-apply.yml`: manual production-approved OpenTofu plan and apply.
- `.github/workflows/crm-redeploy.yml`: manual production-approved Cloud Run redeploy to the configured NocoDB image.

All GCP authentication uses GitHub OIDC. Do not add service account JSON keys.

## Required GitHub Settings

Repository variables:

- `CRM_GCP_PROJECT_ID`
- `CRM_GCP_REGION`
- `CRM_GCP_SERVICE_ACCOUNT`
- `CRM_GCP_WORKLOAD_IDENTITY_PROVIDER`

Optional repository variables:

- `CRM_CLOUD_RUN_SERVICE`
- `CRM_ENABLE_CLOUDFLARE_EDGE`, set to `true` when the hostname is ready in Cloudflare
- `CRM_HOSTNAME`
- `CRM_ZONE_ID`
- `CRM_ZONE_NAME`
- `CRM_ACCESS_ALLOWED_EMAILS` as a JSON list, for example `["operator@example.com"]`
- `CRM_ACCESS_ALLOWED_GROUP_IDS` as a JSON list
- `CRM_GITHUB_OIDC_PRINCIPAL_SET`
- `CRM_NOCODB_IMAGE`
- `CRM_CLOUDFLARE_ACCESS_AUTH_DOMAIN`
- `CRM_CLOUDFLARE_ACCESS_ORGANIZATION_NAME`
- `CRM_MANAGE_CLOUDFLARE_ACCESS_ORGANIZATION`

Repository secrets:

- `CLOUDFLARE_API_TOKEN`, required only when `CRM_ENABLE_CLOUDFLARE_EDGE=true`

## Verification

```bash
tofu fmt -check -recursive infra/crm/opentofu
tofu -chdir=infra/crm/opentofu init -input=false
tofu -chdir=infra/crm/opentofu validate
```

Post-deploy checks should confirm that the CRM hostname resolves through Cloudflare, Cloudflare Access gates the UI, the NocoDB dashboard loads, NocoDB can connect to the CRM data database as an external PostgreSQL source, and n8n can connect to the CRM database with its own least-privilege user.

## Secret Bootstrap

OpenTofu creates secret containers only. It does not commit, generate, or store runtime secret values in code.

Before first successful startup, create the Cloud SQL users out of band and populate:

- `cipherplay-crm-nocodb-nc-db`
- `cipherplay-crm-nocodb-auth-jwt-secret`
- `cipherplay-crm-nocodb-connection-encrypt-key`
- `cipherplay-crm-postgres-password`

The `cipherplay-crm-nocodb-nc-db` secret value should be the full NocoDB metadata connection string:

```text
pg://PRIVATE_CLOUD_SQL_IP:5432?u=nocodb&p=PRIVATE_PASSWORD&d=nocodb
```

Use the OpenTofu outputs for the private IP and instance name. Keep a separate personal recovery copy of the NocoDB JWT secret, connection encryption key, and database credentials outside this repo and outside GitHub. Losing the NocoDB connection encryption key can make stored external database credentials unrecoverable.

## CRM Schema

`schema/001-crm.sql` defines the initial CRM data contract:

- contacts
- groups
- contact-group membership
- campaigns
- campaign recipients
- email events
- notes
- follow-up tasks

The seed creates a `potential-investors` group for the first investor-campaign MVP, but it does not store contact data in git.

Apply the schema after the Cloud SQL database and users exist, from an approved operator environment with Cloud SQL access:

```bash
cloud-sql-proxy "$(tofu -chdir=infra/crm/opentofu output -raw cloud_sql_connection_name)"
psql "host=127.0.0.1 port=5432 dbname=crm user=CRM_OWNER_USER" \
  -f infra/crm/schema/001-crm.sql
```

## n8n Contract

n8n should use the CRM data database, not the NocoDB metadata database. The first automation layer should:

- read eligible contacts by group and campaign status,
- generate per-recipient drafts,
- wait for operator approval before sending,
- write send/reply/bounce events back into `crm_email_events`,
- update `crm_campaign_recipients` and `crm_follow_ups`.

This keeps NocoDB as the pleasant review/edit UI while n8n remains the campaign engine.
