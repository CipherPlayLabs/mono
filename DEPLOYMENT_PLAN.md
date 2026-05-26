# Deployment Plan: Cloudflare Pages

## Context

This repo contains a Docusaurus v3 static site in `content-site/`. Production is served from Cloudflare Pages at `https://allanbpediniv.com/info/`.

## Cloudflare

| Item | Value |
| --- | --- |
| Account ID | `c4641560f98108d80fe5dd892cd2ef14` |
| Zone | `allanbpediniv.com` |
| Pages project | `abpiv-personal-brand` |
| Pages subdomain | `abpiv-personal-brand.pages.dev` |
| Production branch | `main` |
| Build command | `npm run build` |
| Build root | `content-site` |
| Output directory | `content-site/build` |

The Cloudflare Pages project and `allanbpediniv.com` custom domain have been created. DNS has an apex CNAME from `allanbpediniv.com` to `abpiv-personal-brand.pages.dev` with Cloudflare proxying enabled.

## GitHub Actions

`.github/workflows/deploy.yml` builds and typechecks the site on pull requests and pushes that touch the site or workflow.

- Pull requests from the same repository deploy Cloudflare Pages previews.
- Pushes to `main` deploy production.
- `workflow_dispatch` can redeploy the selected branch manually.

The workflow expects these repository settings:

| Name | Type | Value |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions variable | `c4641560f98108d80fe5dd892cd2ef14` |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions secret | Cloudflare API token with Account / Cloudflare Pages / Edit |

The GitHub `production` environment is restricted to the `main` branch and has the existing `BrewDogDev` required-reviewer gate. The `preview` environment has no protection rules.

## Routing

Docusaurus keeps `baseUrl: '/info/'`, so Cloudflare Pages serves the site under `/info/`. The static `_redirects` file redirects the apex path `/` to `/info/`. The static `_headers` file applies long-lived immutable caching to Docusaurus fingerprinted assets under `/info/assets/*`.

## Verification

1. Ensure the GitHub secret `CLOUDFLARE_API_TOKEN` exists.
2. Run the `Deploy to Cloudflare Pages` workflow on `main`, or push a site change to `main`.
3. Confirm the deployment URL emitted by the workflow loads.
4. Confirm `https://allanbpediniv.com/info/` loads after Cloudflare marks the custom domain active.
5. Confirm `https://allanbpediniv.com/` redirects to `/info/`.

## Rollback

Use Cloudflare Pages deployment history for the `abpiv-personal-brand` project and roll back to a previous production deployment.
