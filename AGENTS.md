# Agent Handoff

This repo hosts the local CipherPlay `/info/` content site and private analytics infrastructure.

If the user says `@crm`, read `docs/contexts/crm.md` first. That file is the fast handoff for the self-hosted NocoDB CRM, Cloud SQL database, Cloudflare Access hostname, GitHub workflows, and n8n/database contract.

## Current Direction

- Repository: `CipherPlayLabs/mono`
- Primary site app: `content-site/`
- Base URL: `/info/`
- Production URL: `https://cipherplay.net/info/`
- Live preview URL: `https://content-site.cipherplay.net/info/`
- Branch flow: push to `preview` for live preview, then merge reviewed changes from `preview` to `main` for production
- Local default site URL: `https://cipherplay.local`
- Public analytics route: same-origin `/_analytics/*`

Keep Plausible operational/private. Public HTML and browser-visible JavaScript should only reference same-origin analytics paths.

## High-Value Files

- `content-site/docusaurus.config.ts`: Docusaurus config and analytics script injection.
- `content-site/src/data/site.ts`: typed company, product, report, team, and organization data.
- `content-site/src/pages/`: route implementations.
- `infra/analytics/`: private Plausible infrastructure and Worker proxy.
- `infra/crm/`: private NocoDB CRM, Cloud SQL PostgreSQL database, Cloudflare Access, and related workflows.
- `docs/contexts/crm.md`: `@crm` context pack for future agents and operators.
- `.github/workflows/deploy.yml`: content-site CI plus Cloudflare Pages deploys gated by GitHub Environments.
- `.github/workflows/content-site-setup.yml`: manual hosting bootstrap for the Cloudflare Pages project, custom domains, and DNS aliases.

## Required Local Checks

For content-site changes:

```bash
cd content-site
npm run typecheck
npm run build
```

For analytics Worker changes:

```bash
cd infra/analytics/worker
npm run typecheck
npm run build
npm test
git diff --exit-code dist/index.js
```

## GitHub Environment Configuration

Production environment:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `PRODUCTION_DOMAIN`
- `PREVIEW_DOMAIN`
- `SITE_URL`
- `PLAUSIBLE_SITE_DOMAIN`
- `ANALYTICS_PRIMARY_SITE_DOMAIN`
- `ANALYTICS_PROXY_ROUTE`
- secret: `CLOUDFLARE_API_TOKEN`

Preview environment:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `SITE_URL`
- `PLAUSIBLE_SITE_DOMAIN`
- `ANALYTICS_PRIMARY_SITE_DOMAIN`
- `ANALYTICS_PROXY_ROUTE`
- secret: `CLOUDFLARE_API_TOKEN`

Do not publish go-to-market details or private research reports in the public site.
