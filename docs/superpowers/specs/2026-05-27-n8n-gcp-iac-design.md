# n8n GCP Infrastructure Design

Date: 2026-05-27

## Goal

Add a low-coupled `infra/n8n` section to this monorepo for a self-hosted n8n Community Edition instance on GCP. The instance primarily serves public n8n-created forms at `forms.cipherplay.net`, while the n8n editor UI uses a separate Cloudflare Access-protected hostname that will be supplied later.

The implementation should follow the repository's existing infrastructure style: OpenTofu-managed cloud resources, separate validation and manual apply workflows, GitHub OIDC for GCP authentication, and no long-lived service account JSON keys.

## Approved Decisions

- GCP project: `cipherplay-production`.
- OpenTofu links to the existing GCP project; it does not create the project.
- n8n runs on Cloud Run as one service for v1.
- Runtime image: official `docker.n8n.io/n8nio/n8n:stable`.
- Runtime sizing: 1 vCPU, 2 GiB memory, always-allocated CPU, concurrency around 10.
- Runtime scaling: min instances 1, max instances 1.
- Public form hostname: `forms.cipherplay.net`.
- Public forms are available to anyone with the link.
- Cloudflare should provide bot protection and rate limiting for the public forms hostname.
- Editor/admin hostname is supplied later and should be represented as an optional variable.
- The editor/admin hostname must be protected by Cloudflare Access and still require n8n login.
- Cloud SQL for PostgreSQL is required for n8n data.
- Cloud SQL should be private-IP only.
- n8n Community Edition is the target edition.
- Do not design around n8n Enterprise-only external binary storage.
- Configure n8n binary data in filesystem mode on a mounted volume.
- Keep Cloud Run capped to one instance because the mounted Cloud Storage volume is not a fully POSIX filesystem and does not provide multi-writer locking guarantees.
- Runtime secrets live in GCP Secret Manager.
- OpenTofu creates secret containers and IAM access, but secret values are set out of band.
- The operator must keep a separate personal recovery copy of the n8n encryption key and bootstrap credentials outside this repo and outside GitHub.
- n8n infrastructure and deployment workflows are separate from the content-site and analytics workflows.
- Mutating production workflows require the GitHub `production` environment approval gate.

## Architecture

The n8n stack should live under `infra/n8n` as a sibling to `infra/analytics`, not inside `content-site`.

Traffic flow:

```text
Public user
  -> Cloudflare DNS/WAF/bot protection
  -> GCP external HTTPS load balancer
  -> Cloud Run n8n service
  -> Cloud SQL PostgreSQL private IP
```

The Cloud Run service should use load-balancer-only ingress so the default `run.app` service URL is not the intended public entry point. Cloudflare remains the public edge for `forms.cipherplay.net`; GCP's external HTTPS load balancer is the origin boundary for the Cloud Run service.

The editor UI is the same n8n backend service, but it is exposed through a separate hostname controlled by a variable such as `editor_hostname`. When the variable is set, OpenTofu should create the relevant Cloudflare DNS and Access resources for that hostname. When the variable is empty, editor hostname resources should not be created.

## Repository Structure

Create:

- `infra/n8n/README.md`
- `infra/n8n/opentofu/`
- `.github/workflows/n8n-validate.yml`
- `.github/workflows/n8n-apply.yml`
- `.github/workflows/n8n-redeploy.yml`

Suggested OpenTofu files:

- `infra/n8n/opentofu/versions.tf`
- `infra/n8n/opentofu/providers.tf`
- `infra/n8n/opentofu/variables.tf`
- `infra/n8n/opentofu/locals.tf`
- `infra/n8n/opentofu/gcp.tf`
- `infra/n8n/opentofu/cloudflare.tf`
- `infra/n8n/opentofu/iam.tf`
- `infra/n8n/opentofu/outputs.tf`
- `infra/n8n/opentofu/README.md`

Keep this section independently runnable and independently validated from `infra/analytics`.

## GCP Resources

OpenTofu should manage resources inside `cipherplay-production`:

- Cloud Run service for n8n.
- Cloud SQL PostgreSQL instance and database.
- Private Service Connect or private services access resources required for private Cloud SQL connectivity.
- Serverless VPC connectivity or Direct VPC egress configuration required for Cloud Run to reach private Cloud SQL.
- External HTTPS load balancer with a serverless NEG pointing to Cloud Run.
- TLS certificate configuration that works with Cloudflare-proxied DNS. Prefer Certificate Manager with DNS authorization, or document an explicit Cloudflare-origin certificate path. Do not rely on a certificate flow that requires the public hostname to resolve directly to the GCP load balancer while Cloudflare is proxying the record.
- GCS bucket mounted into Cloud Run for n8n filesystem binary data.
- Secret Manager secret containers for runtime secrets.
- Dedicated Cloud Run runtime service account.
- Dedicated GitHub deployer service account and IAM bindings as needed.
- OpenTofu state backend should use a private GCS state bucket and `infra/n8n` prefix; the state bucket itself is a bootstrap prerequisite outside this OpenTofu project.

Use labels consistently, for example:

- `app = "n8n"`
- `component = "automation"`
- `environment = "production"`
- `managed_by = "opentofu"`

## Cloudflare Resources

OpenTofu should manage Cloudflare resources for the form edge:

- DNS for `forms.cipherplay.net` pointing to the GCP HTTPS load balancer.
- WAF/rate-limiting/bot protection rules suitable for public forms.
- Hostname-specific behavior that allows public form access without Cloudflare Access.

When `editor_hostname` is provided, OpenTofu should additionally manage:

- DNS for the editor hostname.
- Cloudflare Access application and policy for the editor hostname.
- Access policy values supplied through variables, such as allowed email addresses or groups.

The public forms hostname should not require user login. The editor hostname must require Cloudflare Access plus n8n's own application login.

## n8n Configuration

Set the Cloud Run environment for self-hosted n8n:

- Database: PostgreSQL via Cloud SQL.
- `DB_TYPE=postgresdb`.
- PostgreSQL host/port/database/user/password from Cloud SQL and Secret Manager.
- `N8N_ENCRYPTION_KEY` from Secret Manager.
- `N8N_EDITOR_BASE_URL` from the editor hostname when available.
- `WEBHOOK_URL=https://forms.cipherplay.net/` so generated production form/webhook URLs use the public forms domain.
- `GENERIC_TIMEZONE=America/New_York`.
- `N8N_DEFAULT_BINARY_DATA_MODE=filesystem`.
- `N8N_BINARY_DATA_STORAGE_PATH` set to the mounted bucket path, such as `/mnt/n8n-binary-data`.
- Execution data pruning enabled with conservative defaults.

Do not configure Enterprise-only S3 external storage for Community Edition.

## Secrets

Secret values must not be committed.

OpenTofu should create or reference Secret Manager secrets for:

- n8n encryption key.
- PostgreSQL password.
- Any n8n bootstrap or operational secret required by the final deployment.
- Future provider/API credentials used by workflows only if they are intended to be infrastructure-managed.

The implementation docs must include an operator reminder:

> Keep a separate personal recovery copy of the n8n encryption key and bootstrap credentials in private storage outside this repo and outside GitHub. Losing the n8n encryption key can make stored credentials unrecoverable.

## CI/CD

Use separate workflows:

### `n8n-validate.yml`

Runs on PRs and pushes touching:

- `infra/n8n/**`
- `.github/workflows/n8n-*.yml`

Expected checks:

- Check required GitHub variables are present.
- Authenticate to GCP through GitHub OIDC.
- Set up OpenTofu.
- `tofu fmt -check -recursive infra/n8n/opentofu`
- `tofu -chdir=infra/n8n/opentofu init -input=false`
- `tofu -chdir=infra/n8n/opentofu validate`

### `n8n-apply.yml`

Manual workflow:

- `workflow_dispatch` with a typed confirmation input, for example `confirm_apply=apply`.
- Uses the GitHub `production` environment.
- Authenticates to GCP through OIDC.
- Runs OpenTofu plan and apply.
- Prints non-secret outputs.

### `n8n-redeploy.yml`

Manual workflow:

- Uses the GitHub `production` environment.
- Redeploys Cloud Run with `docker.n8n.io/n8nio/n8n:stable`.
- Exists so upgrades to the current stable image are intentional and approved.

Do not use a service account JSON key in GitHub Actions.

## Bootstrap Requirements

Before OpenTofu apply can succeed, an operator must ensure:

- GCP project `cipherplay-production` exists.
- Billing is attached.
- Required APIs are enabled or the GitHub deployer has permission to enable them.
- A private GCS bucket exists for OpenTofu remote state, or a documented bootstrap command creates it.
- GitHub OIDC is configured for this repository against a dedicated deployer service account.
- The required GitHub repository variables and secrets are configured.
- Cloudflare account access is available for `cipherplay.net`.
- Secret Manager values for n8n runtime secrets are populated before first successful Cloud Run startup.

## Verification

Local/CI verification:

```bash
tofu fmt -check -recursive infra/n8n/opentofu
tofu -chdir=infra/n8n/opentofu init -input=false
tofu -chdir=infra/n8n/opentofu validate
```

Post-deploy verification:

- `forms.cipherplay.net` resolves through Cloudflare.
- `forms.cipherplay.net` can load an n8n-created public form.
- Bot/rate protection is active at Cloudflare.
- The editor hostname, once configured, requires Cloudflare Access before n8n login.
- Cloud Run has exactly one active instance target and does not scale above one.
- Cloud Run can connect to Cloud SQL over private networking.
- n8n can create, save, and execute a form workflow.
- n8n generated production form URLs use `https://forms.cipherplay.net/`.
- Binary uploads or generated binary data write to the configured mounted path.
- Runtime logs do not expose secret values.

## Risks And Mitigations

- **n8n stable image upgrades may run database migrations.** Mitigate by making redeploy manual and production-approved.
- **Cloud Storage FUSE is not a normal shared POSIX disk.** Mitigate by maxing Cloud Run at one instance and treating high file volume as a future architecture trigger.
- **A single Cloud Run service means forms and editor share one backend.** Mitigate with host-specific Cloudflare policies and keep the editor behind Cloudflare Access.
- **Losing the n8n encryption key can break stored credentials.** Mitigate with Secret Manager plus a personal recovery copy.
- **Cloud SQL private networking and GCP load balancer resources add IaC complexity.** Mitigate by keeping `infra/n8n` isolated and validating it independently.

## References

- n8n Community Edition feature limits: https://docs.n8n.io/hosting/community-edition-features/
- n8n database environment variables: https://docs.n8n.io/hosting/configuration/environment-variables/database/
- n8n binary data environment variables: https://docs.n8n.io/hosting/configuration/environment-variables/binary-data/
- n8n deployment environment variables: https://docs.n8n.io/hosting/configuration/environment-variables/deployment/
- n8n endpoint environment variables: https://docs.n8n.io/hosting/configuration/environment-variables/endpoints/
- Cloud Run Cloud Storage volume mounts: https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts

## Next Agent Prompt

Use this prompt to start the implementation session:

```text
You are working in /Users/user/Documents/CipherPlay Content Site/mono. Implement the n8n GCP infrastructure design documented at docs/superpowers/specs/2026-05-27-n8n-gcp-iac-design.md.

Important constraints:
- Do not touch unrelated content-site edits already present in the working tree.
- Create a low-coupled infra/n8n section, modeled after the existing infra/analytics separation but not coupled to it.
- Target GCP project cipherplay-production, assumed to exist. OpenTofu must not create the project.
- Use official docker.n8n.io/n8nio/n8n:stable on one Cloud Run service.
- Cloud Run sizing: 1 vCPU, 2 GiB memory, always-allocated CPU, min instances 1, max instances 1, concurrency about 10.
- Use Cloud SQL PostgreSQL private-IP only for n8n's database.
- Use Secret Manager for runtime secrets. Do not commit secret values.
- Configure n8n Community Edition only. Do not use Enterprise-only external binary storage.
- Configure filesystem binary mode on a mounted Cloud Storage volume path and keep max instances at one.
- Public forms must be served at forms.cipherplay.net, available to anyone with the link, with Cloudflare bot/rate protection.
- Model a future editor/admin hostname as an optional variable protected by Cloudflare Access plus n8n login.
- Add separate GitHub Actions workflows for n8n validation, manual production-approved OpenTofu apply, and manual production-approved Cloud Run redeploy.
- Use GitHub OIDC into GCP. Do not use service account JSON keys.

Start by reading mono/AGENTS.md, mono/README.md, existing .github/workflows/*, and infra/analytics/opentofu for repo patterns. Then create an implementation plan before editing code. Use apply_patch for manual edits, keep changes scoped, and run at least OpenTofu fmt/validate checks where possible.
```
