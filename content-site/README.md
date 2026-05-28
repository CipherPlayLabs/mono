# CipherPlay Content Site

CipherPlay's local Docusaurus v3 site for the `/info/` surface.

## Current Routes

| Route | Purpose |
| --- | --- |
| `/` | CipherPlay overview and primary site sections |
| `/about` | Company overview, leadership, backers, TAP values, and investor diligence signals |
| `/about/tap-into-success` | Expanded TAP operating principle |
| `/market-analysis` | Market Research report index |
| `/market-analysis/*` | Public Market Research report pages |
| `/products` | Products & Services |
| `/products/randao` | RANDAO product page |
| `/partners` | Partner ecosystem and collaboration page |
| `/media-kit` | Approved CipherPlay brand assets |
| `/newsroom` | CipherPlay announcements |
| `/forms/*` | Stub routes for upcoming forms |

The old research, insights, featured, investors, and customers routes are intentionally not part of the active site.

## Configuration

- `baseUrl`: `/info/`
- `url`: `SITE_URL` environment variable, falling back to `https://cipherplay.local` for local builds.
- Preview URL: `https://content-site.cipherinternal.com/info/`.
- Production URL: `https://cipherplay.com/info/`.
- Analytics script: same-origin `/_analytics/js/script.js`.
- Analytics event endpoint: same-origin `/_analytics/api/event`.
- Analytics domain: `PLAUSIBLE_SITE_DOMAIN` environment variable, falling back to the hostname in `SITE_URL`.

The public site must not expose the private Plausible dashboard or origin hostname.

## Commands

```bash
npm run typecheck
npm run build
npm run start
```

GitHub Actions deploys pushes to `preview` through the `preview` environment and pushes to `main` through the reviewer-gated `production` environment.
