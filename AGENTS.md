# Agent Handoff

This repo hosts the public Docusaurus site for `allanbpediniv.com` and the shared Plausible Community Edition analytics infrastructure that serves it.

## Production Snapshot

- Repository: `BrewDogDev/abpiv-personal-brand`
- Production branch: `main`
- Public site: `https://allanbpediniv.com/info/`
- Domain root: `https://allanbpediniv.com/` redirects to `/info/`
- Cloudflare Pages project: `abpiv-personal-brand`
- Analytics dashboard: `https://analytics.lobst3rs.com`
- Plausible site domain: `allanbpediniv.com`
- Public analytics route: `https://allanbpediniv.com/_analytics/*`
- GCP project: `abpiv-personal-brand`
- Analytics VM: `plausible-analytics-vm` in `us-east1-b`
- Analytics OpenTofu state bucket: `abpiv-personal-brand-opentofu-state`

Do not expose `analytics.lobst3rs.com` in public site HTML, JavaScript, or browser-visible network requests. Public website analytics must stay same-origin through `/_analytics/*`.

## High-Value Files

- `content-site/docusaurus.config.ts`: Docusaurus config, Cloudflare Pages URL/base URL, production analytics script injection.
- `content-site/AI_HANDOFF.md`: detailed site deployment notes and base URL gotchas.
- `infra/analytics/README.md`: analytics architecture, GitHub/GCP settings, operator workflow, verification.
- `infra/analytics/opentofu/`: GCP and Cloudflare infrastructure.
- `infra/analytics/worker/src/index.ts`: Cloudflare Worker that proxies same-origin analytics requests.
- `.github/workflows/deploy.yml`: combined site build/deploy plus analytics validation workflow. The workflow name is `Site and Analytics`.
- `.github/workflows/analytics-apply.yml`: manual OpenTofu apply workflow. The workflow name is `Apply Analytics Infrastructure`.
- `.github/workflows/analytics-provision.yml`: manual VM/Plausible/cloudflared convergence workflow. The workflow name is `Provision Analytics Host`.

## Recent Analytics Work Completed

The analytics stack has been brought up end to end:

- OpenTofu provisions the GCP VM, service accounts, firewall rules, backup bucket access, Cloudflare Tunnel, Cloudflare Access, DNS, Worker, and route.
- The private VM runs Plausible CE, Postgres, ClickHouse, Docker, and `cloudflared`.
- Cloudflare Access protects `analytics.lobst3rs.com`.
- The Worker authenticates to the Access-protected origin with a Cloudflare Access service token and exposes only same-origin public collection paths under `/_analytics/*`.
- Cloudflare Tunnel egress was fixed by allowing TCP and UDP `7844`.
- The live script endpoint `https://allanbpediniv.com/_analytics/js/script.js` returns `200`.
- The live event endpoint `https://allanbpediniv.com/_analytics/api/event` returns `202`.
- The production site now emits the critical Plausible script attribute:

```html
<script src="/_analytics/js/script.js" defer data-domain="allanbpediniv.com" data-api="/_analytics/api/event"></script>
```

That `data-api` attribute matters. Without it, Plausible derives the collector URL from the script origin and posts to `https://allanbpediniv.com/api/event`, which returns `405 Method Not Allowed`.

## GitHub Actions Flow

`Site and Analytics` runs on pushes to `main`, PRs, and manual dispatch when relevant site or analytics paths change.

On `main`, the deploy job uses the GitHub `production` environment. It can pause in `waiting` until `BrewDogDev` approves the environment deployment.

Useful commands:

```bash
gh run list --repo BrewDogDev/abpiv-personal-brand --limit 10
gh run watch <run-id> --repo BrewDogDev/abpiv-personal-brand --exit-status
gh api repos/BrewDogDev/abpiv-personal-brand/actions/runs/<run-id>/pending_deployments --jq '.'
```

To approve a waiting production deployment when the current GitHub user is allowed:

```bash
gh api repos/BrewDogDev/abpiv-personal-brand/actions/runs/<run-id>/pending_deployments \
  -X POST \
  -F 'environment_ids[]=<environment-id>' \
  -F state=approved \
  -F comment='Approve production deploy'
```

## Verification Checklist

Local checks for content-site changes:

```bash
cd content-site
npm run typecheck
npm run build
```

Local checks for analytics Worker changes:

```bash
cd infra/analytics/worker
npm run typecheck
npm run build
npm test
git diff --exit-code dist/index.js
```

OpenTofu checks:

```bash
tofu fmt -check -recursive infra/analytics/opentofu
tofu -chdir=infra/analytics/opentofu init -input=false
tofu -chdir=infra/analytics/opentofu validate
```

Live analytics checks:

```bash
curl -sS -L https://allanbpediniv.com/info/ -o /tmp/abpiv-info.html -w '%{http_code} %{url_effective}\n'
rg -n 'data-api=|_analytics/js/script.js|/api/event' /tmp/abpiv-info.html
curl -sS -o /tmp/abpiv-analytics-response.txt -w '%{http_code} %{content_type}\n' \
  -X POST https://allanbpediniv.com/_analytics/api/event \
  -H 'content-type: text/plain' \
  --data '{"n":"pageview","u":"https://allanbpediniv.com/info/","d":"allanbpediniv.com","r":null}'
cat /tmp/abpiv-analytics-response.txt
```

Expected live results:

- Site HTML returns `200`.
- HTML contains `src=/_analytics/js/script.js`, `data-domain=allanbpediniv.com`, and `data-api=/_analytics/api/event`.
- Synthetic event POST returns `202` and response body `ok`.
- Browser DevTools should show no analytics POST to `/api/event`.

## Known Build Warnings

These warnings were present during successful builds and are not currently deploy blockers:

- Docusaurus warns that the default `blog` directory does not exist.
- Some tags are undefined in `tags.yml`.
- Some RSS links appear broken to Docusaurus even though RSS files are generated.
- Local sandboxed builds may fail Docusaurus update-check writes under `/Users/user/.config`.
- GitHub annotates Node.js 20 action deprecation for some upstream actions.

## Permissions And Secrets Notes

Do not commit plaintext secrets or service account keys.

The GitHub deployer service account uses Workload Identity Federation. It has standing permissions needed to reproduce the analytics VM and infra through GitHub Actions, including Compute instance/network/security administration, OS Login through IAP, storage administration for backups/state-related work, and narrow `iam.serviceAccountUser` on the analytics VM service account.

The two Cloudflare token names are intentionally different by purpose:

- `CLOUDFLARE_API_TOKEN`: used by Pages deploy and analytics apply/provision where Cloudflare API access is required.
- `CLOUDFLARE_ANALYTICS_API_TOKEN`: used by analytics validation/OpenTofu paths where the workflow maps it to `CLOUDFLARE_API_TOKEN`.

When changing auth-sensitive code, verify the GitHub workflow environment rather than assuming local credentials match CI.
