# CipherPlay Content-Site Handoff

## Current State

- Docusaurus app: `content-site/`
- Base URL: `/info/`
- Site title: `CipherPlay`
- Preview URL: `https://content-site.cipherplay.net/info/`
- Production URL: `https://cipherplay.net/info/`
- Analytics domain: supplied by `PLAUSIBLE_SITE_DOMAIN`
- Forms: active CTAs link to n8n-hosted forms on `forms.cipherplay.net`; local
  `/info/forms/*` routes are placeholders only

## Active Public Routes

- `/info/`
- `/info/about`
- `/info/about/tap-into-success`
- `/info/market-analysis`
- `/info/products`
- `/info/products/randao`
- `/info/partners`
- `/info/media-kit`
- `/info/newsroom`
- `/info/team`
- `/info/forms/*` placeholder routes, not active CTA destinations

Removed routes should resolve to the Docusaurus not-found page, including `/info/research`, `/info/insights`, `/info/featured`, `/info/investors`, `/info/customers`, `/info/industries`, `/info/market-analysis/ai-productivity-software`, `/info/market-analysis/cryptographic-infrastructure`, and `/info/market-analysis/venture-market-intelligence`.

## Verification

```bash
npm run typecheck
npm run build
```

Useful route checks after build:

```bash
test ! -e build/research.html
test ! -e build/insights.html
test ! -e build/featured.html
test ! -e build/investors.html
test ! -e build/customers.html
test ! -e build/industries.html
test ! -e build/market-analysis/ai-productivity-software.html
test ! -e build/market-analysis/cryptographic-infrastructure.html
test ! -e build/market-analysis/venture-market-intelligence.html
```

Public analytics requests must stay same-origin through `/_analytics/*`. The private Plausible dashboard/origin hostname must not appear in public HTML or browser-visible JavaScript.

Deployment uses GitHub Environments: `preview` for the live preview branch and `production` for manual production deploys dispatched from `main`.
