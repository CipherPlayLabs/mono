# Analytics OpenTofu

This OpenTofu project provisions the shared Plausible CE analytics infrastructure:

- A private Google Compute Engine `e2-small` VM in `us-east1`.
- A dedicated VM service account.
- A custom VPC with no external VM IP, IAP/OS Login SSH ingress, and restricted egress for HTTPS, DNS, and NTP.
- A private GCS backup bucket with uniform access, public access prevention, versioning, retention, and lifecycle cleanup.
- A Cloudflare Tunnel and DNS record for `analytics.lobst3rs.com`.
- A Cloudflare Access application with an inline allow policy for `allanblankpedin@gmail.com`.
- A placeholder Cloudflare Worker and route for `allanbpediniv.com/_analytics/*`.

## Authentication

The Google provider uses Application Default Credentials locally or GitHub Actions Workload Identity Federation in CI. Do not commit service account JSON keys.

The Cloudflare provider reads `CLOUDFLARE_API_TOKEN` from the environment. In GitHub Actions, map the encrypted repository secret `CLOUDFLARE_ANALYTICS_API_TOKEN` to `CLOUDFLARE_API_TOKEN` for the OpenTofu step.

## Required Variables

Set these values from repository variables, a local uncommitted `.tfvars` file, or CI environment variables:

- `cloudflare_account_id`
- `lobst3rs_zone_id`
- `allanbpediniv_zone_id`

Defaults are provided for:

- `gcp_project_id = "abpiv-personal-brand"`
- `gcp_region = "us-east1"`
- `gcp_zone = "us-east1-b"`
- `plausible_hostname = "analytics.lobst3rs.com"`
- `access_allowed_email = "allanblankpedin@gmail.com"`
- `analytics_sites = [{ domain = "allanbpediniv.com", route_pattern = "allanbpediniv.com/_analytics/*" }]`

## Commands

```bash
tofu fmt -recursive infra/analytics/opentofu
tofu -chdir=infra/analytics/opentofu init
tofu -chdir=infra/analytics/opentofu validate
```

Do not run `tofu apply` until the generated plan, provider permissions, and VM provisioning tasks have been reviewed.

## Caveats

The Worker script is a tiny placeholder proxy because the production Worker implementation belongs to Task 4. The placeholder keeps this infrastructure project wired while avoiding public site changes.

Additional analytics sites need zone mapping in `locals.tf` before they can use a different Cloudflare zone. The initial `allanbpediniv.com/_analytics/*` route is fully configured.

Cloudflare Tunnel runtime installation and Plausible service configuration are handled by the later Ansible task. The tunnel token is intentionally not output because it is sensitive.
