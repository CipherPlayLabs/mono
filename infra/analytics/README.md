# CipherPlay Analytics Infrastructure

This directory contains operator documentation and configuration for CipherPlay's private Plausible Community Edition analytics stack.

## Architecture

- Plausible CE is an operator-only service protected by Cloudflare Access.
- Public website analytics requests stay same-origin through `https://<site-domain>/_analytics/*`.
- The browser script is served from `/_analytics/js/script.js`.
- Event ingestion is proxied through `/_analytics/api/event`.
- The private Plausible dashboard/origin hostname is supplied through infrastructure configuration and the `PLAUSIBLE_ORIGIN_HOSTNAME` Worker binding.

Do not expose the private Plausible dashboard or origin hostname in public site HTML or browser-visible JavaScript. The content site should only reference same-origin `/_analytics/*` paths.

## Current Public Contract

The Docusaurus site injects Plausible only in production with:

```ts
src: '/_analytics/js/script.js'
data-api: '/_analytics/api/event'
```

The `data-api` attribute is required. Without it, the Plausible script posts to `/api/event` on the site origin instead of the same-origin analytics proxy route.

## Required GitHub Settings

Repository variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID_PUBLIC_SITE`
- `ANALYTICS_DASHBOARD_ZONE_NAME`, defaults to `cipherinternal.com`
- `CLOUDFLARE_ZONE_ID_CIPHERINTERNAL`, optional when the dashboard zone should not be looked up by name
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_ZONE`, defaults to `us-east1-b`
- `GCP_SERVICE_ACCOUNT`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `PLAUSIBLE_HOSTNAME`, defaults to `analytics.cipherinternal.com`
- `ANALYTICS_ACCESS_ALLOWED_EMAIL`
- `ANALYTICS_PRIMARY_SITE_DOMAIN`
- `ANALYTICS_PROXY_ROUTE`

Optional repository variables:

- `ANALYTICS_CLOUDFLARE_TUNNEL_NAME`, defaults to `plausible-analytics-origin` for host provisioning
- `ANALYTICS_CLOUDFLARE_TUNNEL_ID`, skips the tunnel-name lookup when set
- `ANALYTICS_GCP_INSTANCE_NAME`, defaults to `cipherplay-analytics-vm` for host provisioning

Repository secrets:

- `CLOUDFLARE_ANALYTICS_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`

Future repository secrets:

- `SOPS_AGE_KEY`, only if GitHub Actions needs to decrypt SOPS-managed files.

GCP authentication uses Workload Identity Federation through `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT`. Do not add a long-lived `GOOGLE_APPLICATION_CREDENTIALS_JSON` repository secret for this infrastructure.

## Worker Route Contract

The analytics Worker should answer only these public routes:

- `/_analytics/js/script.js`
- `/_analytics/api/event`

All other public paths should return `404`. The Worker forwards requests to the private Plausible origin using the `PLAUSIBLE_ORIGIN_HOSTNAME` binding and optional Cloudflare Access service-token bindings.

## Future Website Onboarding

1. Add the public site domain and same-origin route pattern to `analytics_sites`.
2. Ensure the domain maps to a Cloudflare zone ID in `locals.tf`.
3. Apply the Cloudflare Worker route for `https://<site-domain>/_analytics/*`.
4. Add the site in Plausible CE.
5. Verify browser requests use only `https://<site-domain>/_analytics/*`.

There should be no browser-visible analytics requests to non-site domains from public websites.

## Local Verification

```bash
cd infra/analytics/worker
npm ci
npm run typecheck
npm run build
npm test
```

Expected result: typecheck, build, and Worker tests pass. Event POSTs to `/_analytics/api/event` should proxy to Plausible and return the upstream status without exposing the private origin hostname.

## Restore Procedure

At a high level:

1. Stop the Plausible services on the analytics VM.
2. Restore Postgres data from the encrypted backup artifact.
3. Restore ClickHouse data from the encrypted backup artifact.
4. Start the Plausible services.
5. Confirm the dashboard loads and pageview ingestion works through the same-origin `/_analytics/*` route.

Keep restore runbooks and exact commands aligned with the deployed OpenTofu, service manager, and backup implementation.
