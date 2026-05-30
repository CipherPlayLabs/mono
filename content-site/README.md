# CipherPlay Content Site

CipherPlay's local Docusaurus v3 site for `/info/`.

## Current Routes

| Route | Purpose |
| --- | --- |
| `/` | CipherPlay overview and main site sections |
| `/about` | Company overview, leadership, backers, TAP values, and investor information |
| `/about/tap-into-success` | Expanded TAP operating principle |
| `/market-analysis` | Market Research and Full Report request path |
| `/products` | Products & Services |
| `/products/randao` | RANDAO product page |
| `/partners` | Partner ecosystem and collaboration page |
| `/media-kit` | Approved CipherPlay brand assets |
| `/newsroom` | CipherPlay announcements |
| `/forms/*` | Legacy local placeholders; active CTAs link to n8n forms on `forms.cipherplay.net` |

The old research, insights, featured, investors, customers, industries, and market-analysis report routes are intentionally not part of the active site.

## Configuration

- `baseUrl`: `/info/`
- `url`: `SITE_URL` environment variable, falling back to `https://cipherplay.local` for local builds.
- Preview URL: `https://content-site.cipherplay.net/info/`.
- Production URL: `https://cipherplay.net/info/`.
- Analytics script: same-origin `/_analytics/js/script.js`.
- Analytics event endpoint: same-origin `/_analytics/api/event`.
- Analytics domain: `PLAUSIBLE_SITE_DOMAIN` environment variable, falling back to the hostname in `SITE_URL`.

The public site must not expose the private Plausible dashboard or origin hostname.

## CTA Forms

The content site does not render production request forms. CTA links point to n8n-hosted
forms on `https://forms.cipherplay.net/form/*`:

- `https://forms.cipherplay.net/form/investor-materials`
- `https://forms.cipherplay.net/form/partnership`
- `https://forms.cipherplay.net/form/consulting-discovery`
- `https://forms.cipherplay.net/form/report-request`

## Commands

```bash
npm run typecheck
npm run build
npm run start
```

GitHub Actions deploys pushes to `preview` through the `preview` environment. Production deploys run through the `production` environment by manually dispatching the workflow from `main`.
