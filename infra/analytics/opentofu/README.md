# CipherPlay Analytics OpenTofu

This OpenTofu project provisions CipherPlay's private Plausible CE analytics infrastructure:

- A private Google Compute Engine VM.
- A dedicated VM service account.
- A custom VPC with no external VM IP, IAP/OS Login SSH ingress, and restricted egress.
- A private GCS backup bucket with uniform access, public access prevention, versioning, retention, and lifecycle cleanup.
- A Cloudflare Tunnel and DNS record for the private Plausible dashboard hostname.
- A Cloudflare Access application with an inline operator allow policy.
- A Cloudflare Worker and same-origin public route for `/_analytics/*`.

## Authentication

The Google provider uses Application Default Credentials locally or GitHub Actions Workload Identity Federation in CI. Do not commit service account JSON keys.

The Cloudflare provider reads `CLOUDFLARE_API_TOKEN` from the environment. In GitHub Actions, map the encrypted repository secret `CLOUDFLARE_ANALYTICS_API_TOKEN` to `CLOUDFLARE_API_TOKEN` for the OpenTofu step.

OpenTofu state is stored in a private GCS bucket under the `infra/analytics` prefix. The bucket is intentionally managed outside this OpenTofu project to avoid a bootstrap cycle.

## Required Variables

Set these values from repository variables, a local uncommitted `.tfvars` file, or CI environment variables:

- `cloudflare_account_id`
- `analytics_dashboard_zone_name`, defaults to `cipherinternal.com`
- `analytics_dashboard_zone_id`, optional when the dashboard zone should not be looked up by name
- `public_site_zone_id` for the current public CipherPlay content-site domain
- `gcp_project_id`
- `access_allowed_email`

Defaults are provided for:

- `gcp_region = "us-east1"`
- `gcp_zone = "us-east1-b"`
- `plausible_hostname = "analytics.cipherinternal.com"`
- `analytics_sites = []`

Set `analytics_sites` explicitly when a public CipherPlay domain is ready.

## Commands

```bash
tofu fmt -recursive infra/analytics/opentofu
tofu -chdir=infra/analytics/opentofu init
tofu -chdir=infra/analytics/opentofu validate
```

Do not run `tofu apply` until the generated plan, provider permissions, hostname choices, and VM provisioning tasks have been reviewed.

## Caveats

The Worker script is deployed from `../worker/dist/index.js`, which is generated from the tested TypeScript Worker source in `../worker/src/index.ts`.

Additional analytics sites need a public-site Cloudflare zone ID before they can use a different Cloudflare zone. Public browser requests must remain same-origin through `/_analytics/*`.

Cloudflare Tunnel runtime installation and Plausible service configuration are handled by the later provisioning task. The tunnel token is intentionally not output because it is sensitive.
