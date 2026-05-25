# Deployment Plan: Firebase Hosting on Google Cloud

## Context

This repo (`abpiv/abpiv-personal-brand`) contains a Docusaurus v3 static site in `content-site/`. It currently deploys to GitHub Pages at `https://abpiv.github.io/info/` via `.github/workflows/deploy.yml`.

**Goal:** Add production deployment to Firebase Hosting on Google Cloud at `https://allanbpediniv.com/info/` while keeping GitHub Pages as a staging environment.

## Decisions (locked in)

| Item | Value |
| --- | --- |
| Production host | Firebase Hosting (GCP) |
| GCP project ID | `abpiv-personal-brand` |
| Production domain | `allanbpediniv.com` |
| DNS registrar / manager | Cloudflare |
| `baseUrl` | Stays `/info/` (room for other frontends later) |
| Staging | GitHub Pages at `abpiv.github.io/info/` (unchanged) |
| Auth to GCP | Workload Identity Federation (no long-lived keys) |

## Open questions for the implementing agent

Before executing, confirm with the user:

1. **Production trigger** — `workflow_dispatch` only, or also auto-deploy on git tags `v*.*.*`? (Default assumption: `workflow_dispatch` only, gated by a `production` GitHub environment for an approval click.)
2. **Repo slug** — confirm it is `abpiv/abpiv-personal-brand` (used in the WIF attribute condition).
3. **`www` subdomain** — should `www.allanbpediniv.com` also work (redirecting to apex), or apex only?

---

## Architecture

```
                  push to main                    manual dispatch
                                                  (or tag vX.Y.Z)
                       |                                 |
                       v                                 v
              +----------------+              +------------------+
              |  GitHub Pages  |              | Firebase Hosting |
              |    STAGING     |              |   PRODUCTION     |
              |  abpiv.github  |              | allanbpediniv.com|
              |   .io/info/    |              |      /info/      |
              +----------------+              +------------------+
```

Both targets serve the same build artifact (`content-site/build/`) produced by `npm run build` with `baseUrl: '/info/'`. Only the deploy job differs.

---

## Phase 1 — GCP / Firebase setup (one-time, manual)

1. Create the project: https://console.cloud.google.com/welcome/new?project=abpiv-personal-brand
2. Enable Firebase on the project: https://console.firebase.google.com -> Add project -> "Use existing GCP project" -> select `abpiv-personal-brand`. Decline Google Analytics (Plausible already configured).
3. In Firebase console -> **Hosting** -> Get started. Accept the default site ID `abpiv-personal-brand` (gives a free `*.web.app` URL).
4. Enable required APIs in Cloud Shell:
   ```bash
   gcloud services enable \
     firebasehosting.googleapis.com \
     iamcredentials.googleapis.com \
     iam.googleapis.com \
     sts.googleapis.com \
     --project=abpiv-personal-brand
   ```

---

## Phase 2 — Workload Identity Federation (one-time, manual)

Eliminates storing service-account JSON keys in GitHub secrets. Run in Cloud Shell:

```bash
PROJECT_ID=abpiv-personal-brand
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
REPO=abpiv/abpiv-personal-brand   # CONFIRM THIS

# Service account used only for deploys
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer" \
  --project=$PROJECT_ID

SA_EMAIL=github-deployer@$PROJECT_ID.iam.gserviceaccount.com

# Minimum roles for Firebase Hosting deploys
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/firebasehosting.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/serviceusage.serviceUsageConsumer"

# Workload Identity Pool + GitHub OIDC Provider
gcloud iam workload-identity-pools create github-pool \
  --location=global --project=$PROJECT_ID

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${REPO}'" \
  --project=$PROJECT_ID

# Allow the GitHub repo to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$REPO" \
  --project=$PROJECT_ID

# Print values to put in GitHub
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "GCP_SERVICE_ACCOUNT=$SA_EMAIL"
```

Add these as **GitHub repository variables** (Settings -> Secrets and variables -> Actions -> Variables tab). They are non-sensitive identifiers, not secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

Also create a GitHub **environment** named `production` (Settings -> Environments -> New environment). Optionally require manual approval on it — this turns `workflow_dispatch` deploys into a "click to approve" gate.

---

## Phase 3 — Repo changes (agent writes these)

### File: `content-site/firebase.json` (new)

```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "cleanUrls": true,
    "trailingSlash": false,
    "redirects": [
      { "source": "/", "destination": "/info/", "type": 301 }
    ],
    "headers": [
      {
        "source": "/info/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ]
  }
}
```

Notes:
- `public: "build"` matches Docusaurus's output directory.
- The redirect makes bare apex `allanbpediniv.com/` land on `/info/` since that is where Docusaurus renders.
- `/info/assets/**` are fingerprinted by Docusaurus, safe for long immutable caching.

### File: `content-site/.firebaserc` (new)

```json
{ "projects": { "default": "abpiv-personal-brand" } }
```

### File: `.github/workflows/deploy.yml` (replace)

Replace the entire file with the structure below. Keeps the existing staging behavior and adds a gated production job.

```yaml
name: Deploy

on:
  push:
    branches: [main]
    paths: ['content-site/**', '.github/workflows/deploy.yml']
  workflow_dispatch:
    inputs:
      target:
        description: 'Where to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: content-site/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: content-site

      - name: Build website
        run: npm run build
        working-directory: content-site

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: content-site/build

      - name: Upload build artifact (for Firebase job)
        uses: actions/upload-artifact@v4
        with:
          name: site-build
          path: content-site/build
          retention-days: 7

  deploy-staging:
    # Runs on every main push, and on manual dispatch when target=staging
    if: >-
      github.event_name == 'push' ||
      (github.event_name == 'workflow_dispatch' && inputs.target == 'staging')
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  deploy-production:
    # Manual only. Gated by 'production' GitHub Environment (set approvals there).
    if: github.event_name == 'workflow_dispatch' && inputs.target == 'production'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://allanbpediniv.com/info/
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4
        with:
          name: site-build
          path: content-site/build

      - name: Authenticate to Google Cloud (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          projectId: abpiv-personal-brand
          channelId: live
          entryPoint: content-site
```

Notes:
- Build happens exactly once. Staging and production deploy the same artifact.
- GitHub Pages continues to deploy automatically on every push to `main` (staging).
- Production requires `workflow_dispatch` with `target=production`. Adding required reviewers on the `production` environment makes every prod deploy a one-click approval.
- The Firebase deploy action reads Google ADC credentials from the `auth` step via the `GOOGLE_APPLICATION_CREDENTIALS` env var that action sets.

### Optional: tag-based production trigger

If the user confirms tag-based prod deploys, add this to the `on:` block and update the production `if:`:

```yaml
on:
  push:
    branches: [main]
    tags: ['v*.*.*']
    paths: ['content-site/**', '.github/workflows/deploy.yml']
```

And the production job condition becomes:

```yaml
if: >-
  startsWith(github.ref, 'refs/tags/v') ||
  (github.event_name == 'workflow_dispatch' && inputs.target == 'production')
```

---

## Phase 4 — DNS on Cloudflare (manual)

1. In Firebase console -> Hosting -> **Add custom domain** -> enter `allanbpediniv.com`. Firebase returns:
   - One TXT record for domain verification
   - Two A records (apex) pointing at Firebase anycast IPs (use whatever values the console shows; do NOT hardcode from this doc — they change).
2. In Cloudflare DNS for `allanbpediniv.com`:
   - Add the TXT record exactly as shown.
   - Add both A records for `@`.
   - **Set proxy status to DNS only (gray cloud) for all three records initially.** Cloudflare proxy can interfere with Firebase's managed-cert HTTP-01 challenge.
   - If `www` requested: add `www` as CNAME to `allanbpediniv.com`, proxy status DNS only.
3. Wait for Firebase verification (usually minutes) and managed SSL cert provisioning (up to 24h, typically <1h).
4. Once `https://allanbpediniv.com/info/` loads cleanly and the cert is valid:
   - Optional: flip Cloudflare records to **Proxied (orange cloud)**. In that case set Cloudflare SSL/TLS mode to **Full (strict)** to avoid a redirect loop or cert mismatch. Skipping Cloudflare proxy is fine — Firebase CDN is already global and this is the lowest-friction option.

---

## Phase 5 — Cutover & verification

1. Merge repo changes (Phase 3) to `main`.
2. Confirm staging still works: `https://abpiv.github.io/info/` builds and loads as before.
3. Run `workflow_dispatch` with `target=production`. Approve the production environment prompt (if enabled).
4. Verify the Firebase default URL first: `https://abpiv-personal-brand.web.app/info/`.
5. After DNS + cert are live: verify `https://allanbpediniv.com/info/`.
6. Verify apex redirect: `https://allanbpediniv.com/` -> `/info/`.
7. Verify 404 behavior on an unknown path matches the Docusaurus 404 page.

---

## Rollback

- GitHub Pages staging is untouched at all times; it IS the rollback path.
- Firebase Hosting keeps release history: Firebase Console -> Hosting -> select site -> "Rollback" on any prior release.

---

## Cost expectations

- Firebase Hosting free tier: 10 GB storage, 360 MB/day egress. A Docusaurus site like this is well under both. Expected cost: **$0/month**.
- No load balancer, no Cloud Run, no GCS bucket. If traffic ever exceeds the free tier, Blaze plan is pay-as-you-go at pennies.

---

## Summary of files the next agent must create or modify

| Path | Action |
| --- | --- |
| `content-site/firebase.json` | Create (contents in Phase 3) |
| `content-site/.firebaserc` | Create (contents in Phase 3) |
| `.github/workflows/deploy.yml` | Replace with new multi-job version in Phase 3 |

All GCP, Firebase console, Cloudflare DNS, and GitHub variable/environment setup is manual and must be completed by a human with appropriate console access. The commands in Phases 1 and 2 are ready to copy-paste into Cloud Shell.
