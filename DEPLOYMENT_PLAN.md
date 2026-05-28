# CipherPlay Deployment Notes

The content site deploys through GitHub Actions and Cloudflare Pages.

| Target | Branch | URL | GitHub Environment |
| --- | --- | --- | --- |
| Preview | `preview` | `https://content-site.cipherinternal.com/info/` | `preview` |
| Production | `main` | `https://cipherplay.com/info/` | `production` |

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
- Pushes to `main` deploy production after the `production` environment approval gate.
- Manual dispatch can deploy either target.

`.github/workflows/content-site-setup.yml` is a manual bootstrap workflow that uses the `production` environment token to create or update the Cloudflare Pages project, attach the production and preview custom domains, and point Cloudflare DNS at the Pages aliases.

## Environment Settings

Production:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `PRODUCTION_DOMAIN=cipherplay.com`
- `PREVIEW_DOMAIN=content-site.cipherinternal.com`
- `SITE_URL=https://cipherplay.com`
- `PLAUSIBLE_SITE_DOMAIN=cipherplay.com`
- secret: `CLOUDFLARE_API_TOKEN`

Preview:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `SITE_URL=https://content-site.cipherinternal.com`
- `PLAUSIBLE_SITE_DOMAIN=content-site.cipherinternal.com`
- secret: `CLOUDFLARE_API_TOKEN`

Analytics variables remain same-origin through `/_analytics/*`.

## Verification

- Confirm `https://content-site.cipherinternal.com/info/` loads after the `preview` workflow deploys.
- Confirm `https://cipherplay.com/info/` loads after the production environment deployment is approved.
- Confirm `/` redirects to `/info/` for both domains.
- Confirm public HTML references only same-origin analytics paths.
