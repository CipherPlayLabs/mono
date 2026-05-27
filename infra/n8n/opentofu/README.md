# CipherPlay n8n OpenTofu

This OpenTofu project provisions CipherPlay's self-hosted n8n Community Edition infrastructure in the existing `cipherplay-production` GCP project. It is intentionally separate from `infra/analytics`.

## Managed Resources

- Cloud Run v2 service running `docker.n8n.io/n8nio/n8n:stable` through an Artifact Registry remote Docker repository.
- One always-warm Cloud Run instance with 1 vCPU, 2 GiB memory, always-allocated CPU, max concurrency 10, and max instances 1.
- Private VPC, Serverless VPC Access connector, and private services access for private-IP Cloud SQL.
- Cloud SQL PostgreSQL instance and database.
- Secret Manager secret containers for the n8n encryption key and PostgreSQL password.
- Private GCS bucket mounted into Cloud Run for filesystem binary data.
- Global external HTTPS load balancer with a serverless NEG pointing at Cloud Run.
- Certificate Manager DNS-authorized Google-managed certificate.
- Optional Cloudflare DNS, forms WAF/rate-limit rules, and optional Cloudflare Access protection for the editor hostname.
- Dedicated runtime and GitHub deployer service accounts plus IAM bindings.

## Authentication

The Google provider uses Application Default Credentials locally or GitHub Actions Workload Identity Federation in CI. Do not commit service account JSON keys.

The Cloudflare provider reads `CLOUDFLARE_API_TOKEN` from the environment.

OpenTofu state is stored in the private GCS bucket `cipherplay-production-opentofu-state` under the `infra/n8n` prefix. The state bucket is a bootstrap prerequisite and is not created by this project.

## Required Variables

Set these values from repository variables, a local uncommitted `.tfvars` file, or CI environment variables when `enable_cloudflare_edge = true`:

- `cloudflare_account_id`
- `cipherplay_zone_id`

Defaults are provided for:

- `gcp_project_id = "cipherplay-production"`
- `gcp_region = "us-east1"`
- `forms_hostname = "forms.cipherplay.net"`
- `n8n_image = "docker.n8n.io/n8nio/n8n:stable"`
- `enable_cloudflare_edge = false`

Optional editor variables:

- `editor_hostname`
- `editor_access_allowed_emails`
- `editor_access_allowed_group_ids`

When `editor_hostname` is set, at least one allowed email or Cloudflare Access group ID must also be set.

## Commands

```bash
tofu fmt -recursive infra/n8n/opentofu
tofu -chdir=infra/n8n/opentofu init -input=false
tofu -chdir=infra/n8n/opentofu validate
```

Do not run `tofu apply` until the generated plan, Cloudflare ruleset ownership, Certificate Manager DNS authorization records, and Secret Manager bootstrap steps have been reviewed.

## Secret Bootstrap

OpenTofu creates secret containers only. It does not commit, generate, or store runtime secret values in code.

Before first successful startup, populate:

- `cipherplay-n8n-encryption-key`
- `cipherplay-n8n-postgres-password`

Create the Cloud SQL PostgreSQL user out of band and keep its password in sync with `cipherplay-n8n-postgres-password`:

```bash
gcloud sql users create n8n \
  --project=cipherplay-production \
  --instance=cipherplay-n8n-postgres \
  --password='REPLACE_WITH_PRIVATE_PASSWORD'

printf '%s' 'REPLACE_WITH_PRIVATE_PASSWORD' | \
  gcloud secrets versions add cipherplay-n8n-postgres-password \
    --project=cipherplay-production \
    --data-file=-
```

Generate and store the n8n encryption key separately:

```bash
openssl rand -hex 32 | \
  gcloud secrets versions add cipherplay-n8n-encryption-key \
    --project=cipherplay-production \
    --data-file=-
```

Keep a separate personal recovery copy of the n8n encryption key and bootstrap credentials in private storage outside this repo and outside GitHub. Losing the n8n encryption key can make stored credentials unrecoverable.

## Notes

Cloudflare resources are disabled by default while `cipherplay.net` is still migrating. Set `enable_cloudflare_edge = true`, `cloudflare_account_id`, `cipherplay_zone_id`, and `CLOUDFLARE_API_TOKEN` when the zone is ready.

Cloudflare allows only one zone entry-point ruleset per phase. If `cipherplay.net` already has Terraform-managed or manually-created `http_request_firewall_custom` or `http_ratelimit` rulesets, import and merge them instead of applying duplicate zone rulesets.

n8n basic auth is not configured. n8n 1.x uses built-in user management for application login, and the optional editor hostname adds Cloudflare Access in front of that login. Public forms on `forms.cipherplay.net` stay available without Cloudflare Access.
