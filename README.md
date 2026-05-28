# CipherPlay Mono

This repository contains the local CipherPlay `/info/` content site and private analytics infrastructure.

## Project Layout

- `content-site/` - Docusaurus v3 site for CipherPlay company, Market Research, Products & Services, Partners, Media Kit, and form stubs.
- `infra/analytics/` - private Plausible Community Edition infrastructure and same-origin `/_analytics/*` proxy.
- `docs/superpowers/` - implementation notes and historical local plans.

## Local Review

```bash
cd content-site
npm run typecheck
npm run build
npm run start
```

The Docusaurus `baseUrl` stays `/info/`. The live preview branch is `preview` at `https://content-site.cipherinternal.com/info/`; production is `main` at `https://cipherplay.com/info/`.

Deployment configuration lives in GitHub Environments. `preview` deploys without a reviewer gate, while `production` requires environment approval before Cloudflare Pages receives a production deploy.
