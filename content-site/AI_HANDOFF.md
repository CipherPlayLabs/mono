# CipherPlay Content-Site Handoff

## Current State

- Docusaurus app: `content-site/`
- Base URL: `/info/`
- Site title: `CipherPlay`
- Preview URL: `https://content-site.cipherinternal.com/info/`
- Production URL: `https://cipherplay.com/info/`
- Analytics domain: supplied by `PLAUSIBLE_SITE_DOMAIN`
- Forms: local stub routes only

## Active Public Routes

- `/info/`
- `/info/about`
- `/info/about/tap-into-success`
- `/info/market-analysis`
- `/info/market-analysis/ai-productivity-software`
- `/info/market-analysis/cryptographic-infrastructure`
- `/info/market-analysis/venture-market-intelligence`
- `/info/products`
- `/info/products/randao`
- `/info/partners`
- `/info/media-kit`
- `/info/newsroom`
- `/info/team`
- `/info/industries`
- `/info/forms/*`

Removed routes should resolve to the Docusaurus not-found page, including `/info/research`, `/info/insights`, `/info/featured`, `/info/investors`, and `/info/customers`.

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
```

Public analytics requests must stay same-origin through `/_analytics/*`. The private Plausible dashboard/origin hostname must not appear in public HTML or browser-visible JavaScript.

Deployment uses GitHub Environments: `preview` for the live preview branch and `production` for reviewer-approved production deploys from `main`.
