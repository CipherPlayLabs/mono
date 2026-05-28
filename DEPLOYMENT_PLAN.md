# CipherPlay Deployment Notes

The content site deploys through GitHub Actions and Cloudflare Pages.

| Target | Branch | URL | GitHub Environment |
| --- | --- | --- | --- |
| Preview | `preview` | `https://content-site.cipherplay.net/info/` | `preview` |
| Production | `main` | `https://cipherplay.net/info/` | `production` |

## Current Local Build

```bash
cd content-site
npm run typecheck
npm run build
```

The Cloudflare Pages artifact convention remains:

```text
content-site/cloudflare-pages/
  _headers
  _redirects
  info/
    index.html
    assets/
    img/
```

## GitHub Actions

`.github/workflows/deploy.yml` runs typecheck/build on pull requests into `main`, pushes to `preview`, pushes to `main`, and manual dispatches.

- Pushes to `preview` deploy the live preview site.
- Pushes to `main` run CI only.
- Manual dispatch from `main` deploys production from the `production` environment.
- Manual dispatch from `preview` or pushes to `preview` deploy the live preview site.

`.github/workflows/content-site-setup.yml` is a manual bootstrap workflow that uses the `production` environment token to create or update the Cloudflare Pages project, attach the production and preview custom domains, and point Cloudflare DNS at the Pages aliases.

## Environment Settings

Production:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `PRODUCTION_DOMAIN=cipherplay.net`
- `PREVIEW_DOMAIN=content-site.cipherplay.net`
- `SITE_URL=https://cipherplay.net`
- `PLAUSIBLE_SITE_DOMAIN=cipherplay.net`
- secret: `CLOUDFLARE_API_TOKEN`

The Cloudflare token must be scoped to the `7124a79b31e09b96266ca90975022711` account with Cloudflare Pages edit access. The hosting setup workflow also needs DNS edit access for `cipherplay.net` if it is expected to create or update the custom-domain CNAME records.

Preview:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `SITE_URL=https://content-site.cipherplay.net`
- `PLAUSIBLE_SITE_DOMAIN=content-site.cipherplay.net`
- secret: `CLOUDFLARE_API_TOKEN`

Analytics variables remain same-origin through `/_analytics/*`.

## Verification

- Confirm `https://content-site.cipherplay.net/info/` loads after the `preview` workflow deploys.
- Confirm `https://cipherplay.net/info/` loads after a production dispatch from `main`.
- Confirm `/` redirects to `/info/` for both domains.
- Confirm public HTML references only same-origin analytics paths.
