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
- `.github/workflows/n8n-redeploy.yml`: manual production-approved Cloud Run redeploy to the current stable n8n image.

All GCP authentication uses GitHub OIDC. Do not add service account JSON keys.

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
