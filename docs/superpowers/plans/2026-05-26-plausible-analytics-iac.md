# Plausible Analytics IaC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up self-hosted Plausible Community Edition as shared analytics infrastructure for the personal-brand repo while keeping public website analytics requests same-origin.

**Architecture:** Plausible CE runs on a Google Compute Engine VM managed by OpenTofu and configured by Ansible. Cloudflare provides DNS, Tunnel, Access, and a Worker-based same-origin proxy so visitors to `allanbpediniv.com` only see requests to `allanbpediniv.com/_analytics/*`, never `analytics.lobst3rs.com`.

**Tech Stack:** OpenTofu, Ansible, Google Compute Engine, Google Cloud Storage, Cloudflare DNS/Tunnel/Access/Workers, Docker Compose, Plausible Community Edition, SOPS with age.

---

## Existing GitHub And Cloud Setup

- GitHub repository: `BrewDogDev/abpiv-personal-brand`.
- Existing GitHub variables:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `GCP_PROJECT_ID=abpiv-personal-brand`
  - `GCP_REGION=us-east1`
  - `GCP_SERVICE_ACCOUNT=github-deployer@abpiv-personal-brand.iam.gserviceaccount.com`
  - `GCP_WORKLOAD_IDENTITY_PROVIDER=projects/382660711984/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
  - `PLAUSIBLE_HOSTNAME=analytics.lobst3rs.com`
  - `ANALYTICS_ACCESS_ALLOWED_EMAIL=allanblankpedin@gmail.com`
  - `ANALYTICS_PRIMARY_SITE_DOMAIN=allanbpediniv.com`
  - `ANALYTICS_PROXY_ROUTE=allanbpediniv.com/_analytics/*`
- User has added these GitHub settings; verify their presence before depending on them:
  - `CLOUDFLARE_ZONE_ID_ALLANBPEDINIV`
  - `CLOUDFLARE_ZONE_ID_LOBST3RS`
  - Secret `CLOUDFLARE_ANALYTICS_API_TOKEN`
- GCP Workload Identity Federation exists, but the provider was observed with `attributeCondition: assertion.repository=='abpiv/abpiv-personal-brand'`. Before any GitHub Actions workflow uses GCP, update or replace that condition so it accepts `BrewDogDev/abpiv-personal-brand`.
- GitHub Actions must authenticate to GCP with OIDC and `google-github-actions/auth`; do not use local `gcloud auth` assumptions or a long-lived service account JSON key.
- The existing `github-deployer` service account was observed with Firebase-era roles only. Do not run GCP `tofu apply` in CI until required least-privilege roles for Compute, Storage, and service account usage are explicitly reviewed and granted.

## Constraints And Decisions

- Keep analytics infrastructure low-coupled from `content-site`; future sites in this repo should reuse shared infra patterns.
- Do not expose `lobst3rs.com` in public site HTML, JavaScript, or browser network requests.
- Host Plausible dashboard at `https://analytics.lobst3rs.com`.
- Protect the dashboard with Cloudflare Access plus Plausible login.
- Allow Cloudflare Access for `allanblankpedin@gmail.com`.
- Use GCP project `abpiv-personal-brand`.
- Use a `us-east1` `e2-small` VM for v1.
- Use Google IAP/OS Login for administrator access; do not expose public SSH.
- Use OpenTofu + Ansible, not manual dashboard-only setup.
- Store only SOPS age-encrypted secrets in git; never commit plaintext secrets.
- Do not configure SMTP in v1.
- Use daily encrypted backups to a private GCS bucket.
- Future Plausible site creation is a manual dashboard step in Plausible CE.

## File Structure

- Create `infra/analytics/README.md` for operator documentation, first-admin setup, future-site onboarding, backup restore, and verification.
- Create `infra/analytics/opentofu/` for GCP and Cloudflare infrastructure.
- Create `infra/analytics/ansible/` for VM hardening, Docker, Plausible CE, `cloudflared`, and backup jobs.
- Create `infra/analytics/secrets/` for SOPS age-encrypted secret files and a non-secret example file.
- Create `infra/analytics/worker/` for the Cloudflare Worker that proxies `/_analytics/*`.
- Create a GitHub Actions workflow only for validation unless the user explicitly approves CI `tofu apply`.
- Modify `content-site/docusaurus.config.ts` or add a small Docusaurus plugin/module to inject the production-only Plausible script from `/_analytics/js/script.js`.
- Update `content-site/AI_HANDOFF.md` with analytics behavior and verification notes.

## Task 0: Verify GitHub And GCP Authentication Prerequisites

**Files:**
- Modify: `docs/superpowers/plans/2026-05-26-plausible-analytics-iac.md` only if the verified repo/provider values differ from this plan.

- [ ] Verify GitHub variables:

```bash
gh variable list --repo BrewDogDev/abpiv-personal-brand
```

- [ ] Expected variables include:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_ZONE_ID_ALLANBPEDINIV`
  - `CLOUDFLARE_ZONE_ID_LOBST3RS`
  - `GCP_PROJECT_ID`
  - `GCP_REGION`
  - `GCP_SERVICE_ACCOUNT`
  - `GCP_WORKLOAD_IDENTITY_PROVIDER`
  - `PLAUSIBLE_HOSTNAME`
  - `ANALYTICS_ACCESS_ALLOWED_EMAIL`
  - `ANALYTICS_PRIMARY_SITE_DOMAIN`
  - `ANALYTICS_PROXY_ROUTE`
- [ ] Verify the Cloudflare analytics secret exists without printing its value:

```bash
gh secret list --repo BrewDogDev/abpiv-personal-brand
```

- [ ] Expected secret includes `CLOUDFLARE_ANALYTICS_API_TOKEN`.
- [ ] Verify the GCP Workload Identity provider:

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --workload-identity-pool=github-pool \
  --location=global \
  --project=abpiv-personal-brand
```

- [ ] If `attributeCondition` is still `assertion.repository=='abpiv/abpiv-personal-brand'`, update it to this repo before relying on GitHub Actions GCP auth:

```bash
gcloud iam workload-identity-pools providers update-oidc github-provider \
  --workload-identity-pool=github-pool \
  --location=global \
  --project=abpiv-personal-brand \
  --attribute-condition="assertion.repository=='BrewDogDev/abpiv-personal-brand'"
```

- [ ] Verify the service account can be impersonated by the current repo:

```bash
gcloud iam service-accounts get-iam-policy \
  github-deployer@abpiv-personal-brand.iam.gserviceaccount.com \
  --project=abpiv-personal-brand
```

- [ ] Expected policy includes `principalSet://iam.googleapis.com/projects/382660711984/locations/global/workloadIdentityPools/github-pool/attribute.repository/BrewDogDev/abpiv-personal-brand` with `roles/iam.workloadIdentityUser`.
- [ ] Do not grant broad owner/editor permissions to the GitHub service account. Document any missing least-privilege roles required for the OpenTofu resources before adding them.

## Task 1: Add Shared Analytics Documentation Skeleton

**Files:**
- Create: `infra/analytics/README.md`
- Create: `infra/analytics/secrets/README.md`
- Create: `infra/analytics/secrets/plausible.enc.yaml.example`

- [ ] Create `infra/analytics/README.md` explaining the architecture:
  - Plausible CE dashboard: `https://analytics.lobst3rs.com`
  - Public collector route convention: `https://<site-domain>/_analytics/*`
  - Initial site: `allanbpediniv.com`
  - GCP project: `abpiv-personal-brand`
  - VM: `us-east1`, `e2-small`
  - Access email: `allanblankpedin@gmail.com`
  - No SMTP in v1
  - Daily encrypted backups to GCS
- [ ] Document required GitHub settings:
  - Repo variables listed in `Existing GitHub And Cloud Setup`.
  - Secret `CLOUDFLARE_ANALYTICS_API_TOKEN`.
  - Future secret `SOPS_AGE_KEY` only if GitHub Actions needs to decrypt SOPS files.
  - GCP uses Workload Identity Federation via `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT`, not a `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret.
- [ ] Document first-admin setup:
  - Apply infra.
  - Visit `https://analytics.lobst3rs.com` through Cloudflare Access.
  - Create the first Plausible admin.
  - Disable public registration through the configured Plausible environment setting.
- [ ] Document future website onboarding:
  - Add a site entry to the OpenTofu locals/config.
  - Apply Cloudflare Worker route for `<site-domain>/_analytics/*`.
  - Add the site manually in Plausible CE.
  - Add the tiny same-origin script adapter to the website.
  - Verify no non-site-domain analytics requests appear in browser DevTools.
- [ ] Document restore procedure at a high level:
  - Stop Plausible services.
  - Restore Postgres and ClickHouse data from GCS backup artifacts.
  - Start services.
  - Confirm dashboard and pageview ingestion.
- [ ] Create `infra/analytics/secrets/README.md` listing required secret names:
  - Plausible `SECRET_KEY_BASE`
  - Cloudflare API token with least privilege for DNS, Tunnel, Access, and Workers
  - Cloudflare account ID and zone IDs if not read from variables
  - SOPS age recipient information
  - GCS backup encryption secret or key reference
- [ ] Create `infra/analytics/secrets/plausible.enc.yaml.example` with fake encrypted-looking placeholder values clearly marked as examples, not real secrets.
- [ ] Run `git diff -- infra/analytics/README.md infra/analytics/secrets/README.md infra/analytics/secrets/plausible.enc.yaml.example` and verify no secret values are present.

## Task 2: Add OpenTofu Project

**Files:**
- Create: `infra/analytics/opentofu/versions.tf`
- Create: `infra/analytics/opentofu/providers.tf`
- Create: `infra/analytics/opentofu/variables.tf`
- Create: `infra/analytics/opentofu/locals.tf`
- Create: `infra/analytics/opentofu/gcp.tf`
- Create: `infra/analytics/opentofu/cloudflare.tf`
- Create: `infra/analytics/opentofu/outputs.tf`
- Create: `infra/analytics/opentofu/README.md`

- [ ] Configure providers:
  - Google provider for project `abpiv-personal-brand`.
  - Cloudflare provider using token from environment or encrypted secret workflow.
- [ ] Define variables:
  - `gcp_project_id`
  - `gcp_region`
  - `gcp_zone`
  - `cloudflare_account_id`
  - `lobst3rs_zone_id`
  - `allanbpediniv_zone_id`
  - `access_allowed_email`
  - `plausible_hostname`
  - `analytics_sites`
- [ ] Set defaults:
  - `gcp_project_id = "abpiv-personal-brand"`
  - `gcp_region = "us-east1"`
  - `plausible_hostname = "analytics.lobst3rs.com"`
  - `access_allowed_email = "allanblankpedin@gmail.com"`
  - `analytics_sites = [{ domain = "allanbpediniv.com", route_pattern = "allanbpediniv.com/_analytics/*" }]`
- [ ] Provision GCP resources:
  - Dedicated service account for the VM.
  - Compute instance using `e2-small`.
  - Boot disk sized conservatively for Plausible, Postgres, ClickHouse, Docker images, and logs.
  - Firewall rules allowing only required egress and IAP/OS Login administration.
  - Private GCS bucket for encrypted backups with retention/lifecycle policy.
- [ ] Provision Cloudflare resources:
  - Cloudflare Tunnel for the Plausible VM origin.
  - DNS for `analytics.lobst3rs.com` routed through the tunnel.
  - Cloudflare Access application for `analytics.lobst3rs.com`.
  - Access policy allowing `allanblankpedin@gmail.com`.
  - Worker script resource for the analytics proxy.
  - Worker route for `allanbpediniv.com/_analytics/*`.
- [ ] Output non-secret connection details:
  - VM name.
  - VM zone.
  - Plausible dashboard hostname.
  - Backup bucket name.
  - Worker route patterns.
- [ ] Run `tofu fmt -recursive infra/analytics/opentofu`.
- [ ] Run `tofu -chdir=infra/analytics/opentofu init`.
- [ ] Run `tofu -chdir=infra/analytics/opentofu validate`.
- [ ] Do not run `tofu apply` until the plan has been reviewed.

## Task 3: Add Ansible Provisioning

**Files:**
- Create: `infra/analytics/ansible/inventory.example.yml`
- Create: `infra/analytics/ansible/playbook.yml`
- Create: `infra/analytics/ansible/group_vars/plausible.yml`
- Create: `infra/analytics/ansible/templates/docker-compose.yml.j2`
- Create: `infra/analytics/ansible/templates/plausible.env.j2`
- Create: `infra/analytics/ansible/templates/cloudflared.service.j2`
- Create: `infra/analytics/ansible/templates/backup-plausible.sh.j2`
- Create: `infra/analytics/ansible/templates/backup-plausible.service.j2`
- Create: `infra/analytics/ansible/templates/backup-plausible.timer.j2`

- [ ] Configure the playbook to install:
  - Docker.
  - Docker Compose plugin.
  - `cloudflared`.
  - OS security updates.
  - Required backup tooling for GCS uploads.
- [ ] Configure host hardening:
  - No public SSH assumption.
  - Minimal firewall.
  - Unattended security updates.
  - Service user for Plausible runtime files.
- [ ] Add Docker Compose template for Plausible CE:
  - Plausible CE app.
  - Postgres.
  - ClickHouse.
  - Persistent volumes.
  - Restart policies.
  - Local-only binding where Cloudflare Tunnel fronts the dashboard.
- [ ] Add Plausible environment template:
  - `BASE_URL=https://analytics.lobst3rs.com`
  - `SECRET_KEY_BASE` from SOPS-managed secret.
  - Registration disabled after first-admin bootstrap.
  - SMTP unset for v1.
- [ ] Add `cloudflared` service template pointing the Cloudflare Tunnel to the local Plausible app.
- [ ] Add backup script and systemd timer:
  - Dump Postgres.
  - Snapshot/export ClickHouse data using a documented command.
  - Encrypt backup artifacts before upload.
  - Upload to the private GCS bucket.
  - Log success/failure to systemd journal.
- [ ] Run `ansible-playbook --syntax-check infra/analytics/ansible/playbook.yml -i infra/analytics/ansible/inventory.example.yml`.
- [ ] Do not run the playbook against production until OpenTofu outputs and secrets are ready.

## Task 4: Add Cloudflare Worker Analytics Proxy

**Files:**
- Create: `infra/analytics/worker/package.json`
- Create: `infra/analytics/worker/tsconfig.json`
- Create: `infra/analytics/worker/wrangler.jsonc`
- Create: `infra/analytics/worker/src/index.ts`
- Create: `infra/analytics/worker/test/proxy.test.ts`

- [ ] Implement Worker routes for:
  - `GET /_analytics/js/script.js`
  - `POST /_analytics/api/event`
- [ ] Proxy script requests to the Plausible origin through a server-side hostname binding or non-public origin setting.
- [ ] Proxy event requests to the Plausible event endpoint.
- [ ] Preserve visitor-identifying request headers required by Plausible:
  - `User-Agent`
  - `X-Forwarded-For`
  - `Accept-Language`
  - `Referer`
- [ ] Ensure browser-visible URLs remain same-origin:
  - The injected script URL is `https://allanbpediniv.com/_analytics/js/script.js`.
  - The event endpoint is `https://allanbpediniv.com/_analytics/api/event`.
  - No response body or redirect exposes `analytics.lobst3rs.com`.
- [ ] Return appropriate errors for unsupported methods and paths.
- [ ] Add tests covering:
  - Script proxy path.
  - Event proxy path.
  - Header preservation.
  - Unsupported route handling.
  - No `analytics.lobst3rs.com` in public response bodies.
- [ ] Run Worker tests with the package script.
- [ ] Run Worker typecheck.

## Task 5: Add GitHub Actions Validation Workflow

**Files:**
- Create: `.github/workflows/analytics-infra.yml`

- [ ] Create a validation-only workflow named `Analytics Infrastructure`.
- [ ] Trigger it on:
  - Pull requests touching `infra/analytics/**`, `.github/workflows/analytics-infra.yml`, or `content-site/**`.
  - Manual `workflow_dispatch`.
- [ ] Give it only the permissions it needs:

```yaml
permissions:
  contents: read
  id-token: write
```

- [ ] Add GCP OIDC authentication:

```yaml
- id: auth
  uses: google-github-actions/auth@v3
  with:
    workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}

- uses: google-github-actions/setup-gcloud@v3
```

- [ ] Make the workflow fail fast if required variables or secrets are missing without printing secret values:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_ZONE_ID_ALLANBPEDINIV`
  - `CLOUDFLARE_ZONE_ID_LOBST3RS`
  - `GCP_PROJECT_ID`
  - `GCP_REGION`
  - `GCP_SERVICE_ACCOUNT`
  - `GCP_WORKLOAD_IDENTITY_PROVIDER`
  - `PLAUSIBLE_HOSTNAME`
  - `ANALYTICS_ACCESS_ALLOWED_EMAIL`
  - `ANALYTICS_PRIMARY_SITE_DOMAIN`
  - `ANALYTICS_PROXY_ROUTE`
  - `CLOUDFLARE_ANALYTICS_API_TOKEN`
- [ ] Run validation only:
  - OpenTofu format check.
  - OpenTofu init and validate.
  - Worker install, typecheck, and tests.
  - Content site typecheck and production build.
  - Build-output scan proving `lobst3rs` and `analytics.lobst3rs.com` do not appear in `content-site/build`.
- [ ] Do not include `tofu apply`, Ansible production execution, or Cloudflare deployment in this workflow unless the user explicitly approves a separate deploy workflow.

## Task 6: Add Minimal Content Site Adapter

**Files:**
- Modify: `content-site/docusaurus.config.ts`
- Optionally create: `content-site/src/plugins/plausibleSameOriginPlugin.ts`

- [ ] Do not enable `docusaurus-plugin-plausible` if doing so would expose `analytics.lobst3rs.com`.
- [ ] Add a production-only Docusaurus injection for:

```html
<script defer data-domain="allanbpediniv.com" src="/_analytics/js/script.js"></script>
```

- [ ] Confirm the script is not injected during local development unless explicitly building production.
- [ ] Keep the adapter generic enough that future sites can copy the pattern using only:
  - Public site domain.
  - Same-origin analytics path.
- [ ] Run from `content-site/`:

```bash
npm run typecheck
npm run build
```

- [ ] Inspect `content-site/build/` output and confirm:
  - `/_analytics/js/script.js` appears.
  - `analytics.lobst3rs.com` does not appear.
  - No `lobst3rs.com` string appears in public built assets.

## Task 7: Update Handoff Documentation

**Files:**
- Modify: `content-site/AI_HANDOFF.md`
- Modify: `README.md`

- [ ] Update `content-site/AI_HANDOFF.md` with:
  - Analytics is same-origin proxied through `/_analytics/*`.
  - Public site must not expose `lobst3rs.com`.
  - Verification commands for build output string checks.
  - Browser DevTools expected network behavior.
- [ ] Update root `README.md` with:
  - Pointer to `infra/analytics/README.md`.
  - Reminder that analytics infra is shared, not content-site-specific.
- [ ] Document that `.github/workflows/analytics-infra.yml` validates GCP authentication through GitHub OIDC, but does not apply infrastructure.
- [ ] Run `git diff -- README.md content-site/AI_HANDOFF.md infra/analytics/README.md`.

## Task 8: Final Verification

**Files:**
- No new files unless fixing issues discovered by verification.

- [ ] Run:

```bash
git status --short
```

- [ ] Confirm no plaintext secret files are present:

```bash
rg -n "SECRET_KEY_BASE|CLOUDFLARE_API_TOKEN|BEGIN AGE ENCRYPTED FILE|password|token" infra/analytics
```

- [ ] Confirm the only secret-like values are encrypted SOPS content or documentation labels.
- [ ] Run:

```bash
npm run typecheck
npm run build
```

from `content-site/`.
- [ ] Run:

```bash
rg -n "lobst3rs|analytics\\.lobst3rs\\.com" content-site/build
```

- [ ] Expected result: no matches.
- [ ] Run OpenTofu validation:

```bash
tofu -chdir=infra/analytics/opentofu validate
```

- [ ] Run Ansible syntax check:

```bash
ansible-playbook --syntax-check infra/analytics/ansible/playbook.yml -i infra/analytics/ansible/inventory.example.yml
```

- [ ] Run Worker tests and typecheck from `infra/analytics/worker/`.
- [ ] Run the GitHub Actions validation workflow on a branch or PR and confirm the GCP auth step succeeds with Workload Identity Federation.
- [ ] Prepare a final implementation summary listing:
  - Files changed.
  - Validation commands and results.
  - Manual steps remaining: SOPS key setup if CI decryption is needed, real Plausible secret creation, least-privilege GCP role review, OpenTofu review/apply, first Plausible admin creation, registration lock-down, live browser verification.

## Exact Prompt To Start Implementation

Use this prompt in a fresh Codex implementation session:

```text
Implement the Plausible Analytics IaC setup described in docs/superpowers/plans/2026-05-26-plausible-analytics-iac.md.

Use superpowers:subagent-driven-development or superpowers:executing-plans and work task-by-task. Start with Task 0 and verify the existing GitHub variables, Cloudflare secret, and GCP Workload Identity Federation setup. If the WIF provider still only allows abpiv/abpiv-personal-brand, update or replace it so BrewDogDev/abpiv-personal-brand can authenticate.

Keep analytics infrastructure under infra/analytics/. Add a validation-only GitHub Actions workflow that uses google-github-actions/auth with GCP_WORKLOAD_IDENTITY_PROVIDER and GCP_SERVICE_ACCOUNT; do not use GOOGLE_APPLICATION_CREDENTIALS_JSON and do not assume local gcloud auth exists in CI. Do not add tofu apply, production Ansible execution, or deploy-side effects to GitHub Actions without explicit approval.

Do not commit plaintext secrets. Do not expose analytics.lobst3rs.com in public site HTML, JavaScript, or browser network requests. Public analytics requests for allanbpediniv.com must go to allanbpediniv.com/_analytics/*.

After each task, show the git diff summary and verification result before moving to the next task.
```
