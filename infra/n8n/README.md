# CipherPlay n8n Infrastructure

This directory contains the isolated infrastructure for CipherPlay's self-hosted n8n Community Edition instance. It is a sibling to `infra/analytics` and does not share OpenTofu state, modules, workflows, or provisioning scripts with analytics.

## Architecture

```text
Public user
  -> Cloudflare DNS/WAF/rate limiting
  -> GCP external HTTPS load balancer
  -> Cloud Run n8n service
  -> Cloud SQL PostgreSQL private IP
```

The public forms hostname is `forms.cipherplay.net`. During the GCP-first bootstrap, Cloudflare resources can remain disabled while the domain migrates. When `N8N_ENABLE_CLOUDFLARE_EDGE=true`, OpenTofu manages Cloudflare DNS plus hostname-specific WAF and rate-limit rules.

The future editor/admin hostname is optional. When configured through OpenTofu variables, it points to the same backend but is protected by Cloudflare Access before n8n's own login.

## Runtime Contract

- Image: `docker.io/n8nio/n8n:stable`
- Cloud Run CPU: 1 vCPU
- Cloud Run memory: 2 GiB
- CPU allocation: always allocated
- Cloud Run instances: min 1, max 1
- Concurrency: 10
- Database: Cloud SQL PostgreSQL over private IP
- Binary data mode: n8n filesystem mode at `/mnt/n8n-binary-data`
- Binary data backing store: mounted Cloud Storage bucket

The service is capped at one instance because Cloud Storage FUSE is not a fully POSIX multi-writer filesystem and should not be treated as a shared locking disk.

## Workflows

- `.github/workflows/n8n-validate.yml`: validates formatting and OpenTofu configuration for n8n changes.
- `.github/workflows/n8n-apply.yml`: manual production-approved OpenTofu plan and apply.
- `.github/workflows/n8n-redeploy.yml`: manual production-approved Cloud Run redeploy to the current Cloud Run-compatible stable n8n image.
- `workflows/crm-website-shopify-enrichment.md`: repo-owned contract for Website/email-domain discovery and Shopify enrichment workflows. It reads Website identity from `business.websites`, email identity from `person.email_addresses`, and current Shopify status from `web_enrichment.website_shopify_status`.
- `workflows/http-archive-shopify-daily-pipeline.md`: repo-owned contract for the `CipherPlay Public Sources - HTTP Archive Shopify Daily` workflow. It runs HTTP Archive BigQuery directly on a daily schedule and writes `business.websites`, `public_sources.http_archive_runs`, `public_sources.http_archive_observations`, and `web_enrichment.website_shopify_status`.

All GCP authentication uses GitHub OIDC for deploys and Cloud Run runtime identity for the n8n service. Do not add service account JSON keys.

## Required GitHub Settings

Repository variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID_CIPHERPLAY`
- `N8N_GCP_PROJECT_ID`
- `N8N_GCP_REGION`
- `N8N_GCP_SERVICE_ACCOUNT`
- `N8N_GCP_WORKLOAD_IDENTITY_PROVIDER`

Optional repository variables:

- `N8N_EDITOR_HOSTNAME`
- `N8N_EDITOR_ACCESS_ALLOWED_EMAILS` as a JSON list, for example `["operator@example.com"]`
- `N8N_EDITOR_ACCESS_ALLOWED_GROUP_IDS` as a JSON list
- `N8N_GITHUB_OIDC_PRINCIPAL_SET`
- `N8N_CLOUD_RUN_SERVICE`
- `N8N_ENABLE_CLOUDFLARE_EDGE`, set to `true` when `cipherplay.net` is ready in Cloudflare

Repository secrets:

- `CLOUDFLARE_API_TOKEN`

## Verification

```bash
tofu fmt -check -recursive infra/n8n/opentofu
tofu -chdir=infra/n8n/opentofu init -input=false
tofu -chdir=infra/n8n/opentofu validate
```

Post-deploy checks should confirm that `forms.cipherplay.net` resolves through Cloudflare, loads a public n8n-created form, uses the public forms hostname in generated production URLs, writes binary data to the mounted path, and does not expose secret values in logs.

Before the first successful Cloud Run startup, create the `n8n` Cloud SQL user out of band and populate the `cipherplay-n8n-postgres-password` and `cipherplay-n8n-encryption-key` Secret Manager secrets. Keep a separate personal recovery copy of the n8n encryption key and bootstrap credentials outside this repo and outside GitHub.

## CRM And Public Source Automation

n8n should connect to the CRM Cloud SQL database as `crm_writer`. The schema-native CRM boundary is:

- `business.websites`: the only canonical domain registry.
- `person.people`: human identities.
- `person.email_addresses`: observed personal, role, and unknown email identities.
- `crm.groups` and `crm.campaigns`: people-only V1 campaign workflow tables.
- `public_sources.http_archive_observations`: source evidence for HTTP Archive Website observations.
- `web_enrichment.website_shopify_status`: current live Shopify status and evidence.

The old `public.crm_*` names are read-only compatibility views during migration. n8n workflows must write schema-native tables only.

For HTTP Archive Shopify collection, the n8n Cloud Run runtime service account is `n8n-cloud-run@cipherplay-production.iam.gserviceaccount.com` and should use `roles/bigquery.jobUser` on `cipherplay-production`. The HTTP Archive dataset is public; no dataset-specific secret is committed. If a future n8n BigQuery node requires a JSON key instead of runtime identity, create a dedicated minimal service account, store the key in Secret Manager, import it into n8n credentials, and never commit it.
