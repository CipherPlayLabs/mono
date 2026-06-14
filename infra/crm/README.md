# CipherPlay CRM Infrastructure

This directory contains the isolated infrastructure for CipherPlay's self-hosted CRM surface. It follows the same OpenTofu-first shape as `infra/n8n`: dedicated state, dedicated networking, a Cloud Run application, Cloud SQL PostgreSQL, Secret Manager bootstrap placeholders, and optional Cloudflare DNS plus Access protection.

For fast agent handoff, especially when the user says `@crm`, start with `docs/contexts/crm.md`.

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
- NocoDB private external DB access: `NC_ALLOW_LOCAL_EXTERNAL_DBS=true`

NocoDB attachment/file-field storage is not configured in this MVP. Treat the CRM as structured relationship, campaign, and email-event data until object storage is added.

## Current Production Connection Details

These are non-secret operational details for the production CRM.

- GCP project: `cipherplay-production`
- Region: `us-east1`
- Cloud Run service: `cipherplay-crm`
- Cloud SQL instance: `cipherplay-crm-postgres`
- Cloud SQL connection name: `cipherplay-production:us-east1:cipherplay-crm-postgres`
- Cloud SQL private IP: `10.216.0.3`
- NocoDB metadata database: `nocodb`
- CRM data database: `crm`
- CRM data database user: `crm_writer`
- CRM data password secret: `cipherplay-crm-postgres-password`

To connect NocoDB to the CRM data database as an external PostgreSQL source:

- Host: `10.216.0.3`
- Port: `5432`
- Database: `crm`
- Schema: use schema-native tables in `business`, `person`, `crm`, `private_sources`, `public_sources`, `contact_methods`, and `web_enrichment`; `public.crm_*` names are read-only compatibility views during cutover
- User: `crm_writer`
- Password: Secret Manager value for `cipherplay-crm-postgres-password`
- SSL: off/disabled

Do not connect NocoDB external data sources to the `nocodb` database. That database is only for NocoDB's own metadata.

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

`schema/001-crm.sql` defines the schema-native CRM data contract:

- `business.websites`: the only canonical domain registry. A Website is domain identity only, not a company, brand, storefront, CRM account, source observation, or enrichment result.
- `business.website_lists` and `business.website_list_memberships`: domain review cohorts such as `http-archive-shopify-daily`.
- `business.organizations` and `business.organization_websites`: canonical business identities and evidence-based Website associations.
- `person.people`: human identities migrated from existing contacts.
- `contact_methods.emails`, `contact_methods.linkedin_profiles`, `contact_methods.phone_numbers`, and `contact_methods.telegram_handles`: canonical reachable identities.
- `contact_methods.person_email_links`, `contact_methods.organization_email_links`, and sibling link tables: evidence associations to People or Business Organizations.
- `crm.groups`, `crm.person_group_memberships`, `crm.campaigns`, `crm.campaign_recipients`, `crm.email_events`, `crm.notes`, and `crm.follow_ups`: people-only V1 CRM workflow tables.
- `private_sources.founder_institute_directory_entries` and `private_sources.ramp_interviews`: private-source provenance datasets, not an access-control boundary.
- `public_sources.http_archive_runs` and `public_sources.http_archive_observations`: public source collection evidence tables.
- `web_enrichment.website_shopify_status`: current live Shopify status and evidence for a Website.
- `web_enrichment.website_contact_discovery_status` and `web_enrichment.website_contact_discovery_observations`: sitewide same-domain website contact-discovery status and evidence.

The migration copies existing `public.crm_*` rows into schema-native tables while preserving IDs where corresponding tables exist. Current Shopify status columns move from the old Website table into `web_enrichment.website_shopify_status`. The old physical `public.crm_*` tables are renamed to `_legacy_backup` tables before the old names are recreated as read-only compatibility views. Keep those backups until row-count and association-count validation has passed in production.

Compatibility views are temporary. New n8n writes, importer writes, and NocoDB operator tables should use the schema-native names. This keeps `business.websites` canonical and prevents source observations or enrichment evidence from duplicating domain identity.

Common inbox-provider domains such as Gmail, Outlook, iCloud, Yahoo, and ProtonMail are classified as `email_provider` so they can preserve email-domain associations without being treated as Shopify enrichment targets.

The seed creates a `potential-investors` group for the first investor-campaign MVP, but it does not store contact data in git.

Apply the schema after the Cloud SQL database and users exist, from an approved operator environment with Cloud SQL access:

```bash
cloud-sql-proxy "$(tofu -chdir=infra/crm/opentofu output -raw cloud_sql_connection_name)"
psql "host=127.0.0.1 port=5432 dbname=crm user=CRM_OWNER_USER" \
  -f infra/crm/schema/001-crm.sql
```

## n8n Contract

n8n should use the CRM data database, not the NocoDB metadata database. The first automation layer should:

- read eligible people by group and campaign status,
- generate per-recipient drafts,
- wait for operator approval before sending,
- write send/reply/bounce events back into `crm.email_events`,
- update `crm.campaign_recipients` and `crm.follow_ups`,
- poll every 30 minutes for email-domain Website discovery and Shopify Website enrichment work,
- crawl same-domain HTML pages for Website Contact Discovery without external search, then write discovered emails and LinkedIn URLs to `contact_methods` plus `web_enrichment.website_contact_discovery_observations`,
- write Website enrichment results directly to `web_enrichment.website_shopify_status` as `crm_writer`,
- run the HTTP Archive Shopify daily workflow by querying BigQuery directly and writing `business.websites`, `public_sources.http_archive_runs`, `public_sources.http_archive_observations`, and `web_enrichment.website_shopify_status`.

This keeps NocoDB as the pleasant review/edit UI while n8n remains the campaign engine.

The website/email enrichment workflow contract lives at `../n8n/workflows/crm-website-shopify-enrichment.md`. Failed or partial Shopify checks should keep `web_enrichment.website_shopify_status.status = 'unknown'`, record error/retry metadata, and preserve compact detection evidence in `detection_signals`.

The sitewide Website Contact Discovery workflow contract lives at `../n8n/workflows/website-contact-discovery.md`. It must crawl all discoverable same-domain HTML pages, skip PDFs/media/binary assets, avoid external search, and persist a status row even when no contact methods are found.

The HTTP Archive Shopify daily workflow contract lives at `../n8n/workflows/http-archive-shopify-daily-pipeline.md`. It must use production service-account auth, not local user auth, and must not use CSV import as its primary path.
