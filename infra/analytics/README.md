# Shared Analytics Infrastructure

This directory contains operator documentation and configuration examples for the shared Plausible Community Edition analytics stack.

## Architecture

- Plausible CE dashboard: `https://analytics.lobst3rs.com`
- Public collector route convention: `https://<site-domain>/_analytics/*`
- Initial site domain: `allanbpediniv.com`
- Initial public analytics route: `https://allanbpediniv.com/_analytics/*`
- GCP project: `abpiv-personal-brand`
- GCP VM: `us-east1`, `e2-small`
- Access email: `allanblankpedin@gmail.com`
- SMTP: not configured in v1
- Backups: daily encrypted backups to Google Cloud Storage

The dashboard is an operator-only surface served at `analytics.lobst3rs.com` behind Cloudflare Access. Public website analytics requests should stay same-origin through each site's `/_analytics/*` route and be proxied to Plausible by Cloudflare Worker routing.

## Required GitHub Settings

Repository variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID_ALLANBPEDINIV`
- `CLOUDFLARE_ZONE_ID_LOBST3RS`
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SERVICE_ACCOUNT`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `PLAUSIBLE_HOSTNAME`
- `ANALYTICS_ACCESS_ALLOWED_EMAIL`
- `ANALYTICS_PRIMARY_SITE_DOMAIN`
- `ANALYTICS_PROXY_ROUTE`

Repository secrets:

- `CLOUDFLARE_ANALYTICS_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`

Future repository secrets:

- `SOPS_AGE_KEY`, only if GitHub Actions needs to decrypt SOPS-managed files.

GCP authentication uses Workload Identity Federation through `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT`. Do not add a `GOOGLE_APPLICATION_CREDENTIALS_JSON` repository secret for this infrastructure.

Analytics validation runs from the `Site and Analytics` GitHub Actions workflow when `infra/analytics/**`, `content-site/**`, or the workflow file changes.

The GitHub deployer service account also needs standing VM provisioning access so `Provision Analytics Host` can rebuild or repair the private Plausible host through IAP:

- `roles/compute.viewer`
- `roles/compute.osAdminLogin`
- `roles/iap.tunnelResourceAccessor`
- `roles/iam.serviceAccountUser` on `plausible-analytics-vm@abpiv-personal-brand.iam.gserviceaccount.com`

These roles let the workflow locate the VM, SSH through IAP with OS Login, act as only the analytics VM service account during SSH, and install or restart Docker, Plausible CE, and `cloudflared`. They do not grant broad Compute Admin rights.

## First Admin Setup

1. Apply the analytics infrastructure.
2. Visit `https://analytics.lobst3rs.com` through Cloudflare Access.
3. Create the first Plausible admin user.
4. Disable public registration through the configured Plausible environment setting.

Because SMTP is not configured in v1, account and recovery flows that depend on email delivery are not available initially.

## Future Website Onboarding

1. Add a site entry to the OpenTofu locals or configuration for the new site domain.
2. Apply the Cloudflare Worker route for `https://<site-domain>/_analytics/*`.
3. Add the site manually in Plausible CE.
4. Add the tiny same-origin script adapter to the website.
5. Verify in browser DevTools that analytics requests use only the site domain, for example `https://allanbpediniv.com/_analytics/*` for the initial site.

There should be no browser-visible analytics requests to non-site domains from public websites.

## Restore Procedure

At a high level:

1. Stop the Plausible services on the analytics VM.
2. Restore Postgres data from the encrypted GCS backup artifact.
3. Restore ClickHouse data from the encrypted GCS backup artifact.
4. Start the Plausible services.
5. Confirm the dashboard loads and pageview ingestion works through the same-origin `/_analytics/*` route.

Keep restore runbooks and exact commands aligned with the deployed OpenTofu, service manager, and backup implementation once those files exist.
