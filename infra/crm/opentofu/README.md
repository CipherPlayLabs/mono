# CipherPlay CRM OpenTofu

This OpenTofu project provisions CipherPlay's self-hosted NocoDB CRM infrastructure in the existing `cipherplay-production` GCP project. It is intentionally separate from `infra/n8n`, `infra/analytics`, and `infra/research-data`.

## Managed Resources

- Cloud Run v2 service running `docker.io/nocodb/nocodb:latest`.
- One always-warm Cloud Run instance with 1 vCPU, 2 GiB memory, always-allocated CPU, max concurrency 20, and max instances 1.
- Private VPC, Serverless VPC Access connector, and private services access for private-IP Cloud SQL.
- Cloud SQL PostgreSQL instance with separate `nocodb` metadata and `crm` data databases.
- Secret Manager secret containers for NocoDB runtime secrets and downstream CRM database credentials.
- Global external HTTPS load balancer with a serverless NEG pointing at Cloud Run.
- Certificate Manager DNS-authorized Google-managed certificate.
- Optional Cloudflare DNS and Cloudflare Access protection for the CRM hostname.
- Dedicated runtime and GitHub deployer service accounts plus IAM bindings.

## Authentication

The Google provider uses Application Default Credentials locally or GitHub Actions Workload Identity Federation in CI. Do not commit service account JSON keys.

The Cloudflare provider reads `CLOUDFLARE_API_TOKEN` from the environment.

OpenTofu state is stored in the private GCS bucket `cipherplay-production-opentofu-state` under the `infra/crm` prefix. The state bucket is a bootstrap prerequisite and is not created by this project.

## Required Variables

Defaults are provided for:

- `gcp_project_id = "cipherplay-production"`
- `gcp_region = "us-east1"`
- `crm_hostname = "crm.cipherinternal.com"`
- `crm_zone_name = "cipherinternal.com"`
- `nocodb_image = "docker.io/nocodb/nocodb:latest"`
- `enable_cloudflare_edge = false`

Set these values from repository variables, a local uncommitted `.tfvars` file, or CI environment variables when `enable_cloudflare_edge = true`:

- `cloudflare_account_id`
- `crm_zone_id` or `crm_zone_name`
- `crm_access_allowed_emails` or `crm_access_allowed_group_ids`

## Commands

```bash
tofu fmt -recursive infra/crm/opentofu
tofu -chdir=infra/crm/opentofu init -input=false
tofu -chdir=infra/crm/opentofu validate
```

Do not run `tofu apply` until the generated plan, Cloudflare Access policy, Certificate Manager DNS authorization record, and Secret Manager bootstrap steps have been reviewed.

## Secret Bootstrap

OpenTofu creates secret containers only. It does not commit, generate, or store runtime secret values in code.

Before first successful startup, populate:

- `cipherplay-crm-nocodb-nc-db`
- `cipherplay-crm-nocodb-auth-jwt-secret`
- `cipherplay-crm-nocodb-connection-encrypt-key`
- `cipherplay-crm-postgres-password`

Create the Cloud SQL users out of band:

```bash
gcloud sql users create nocodb \
  --project=cipherplay-production \
  --instance=cipherplay-crm-postgres \
  --password='REPLACE_WITH_PRIVATE_PASSWORD'

gcloud sql users create crm_writer \
  --project=cipherplay-production \
  --instance=cipherplay-crm-postgres \
  --password='REPLACE_WITH_PRIVATE_PASSWORD'
```

Store the NocoDB metadata connection string as the `NC_DB` secret value:

```bash
printf '%s' 'pg://PRIVATE_CLOUD_SQL_IP:5432?u=nocodb&p=REPLACE_WITH_PRIVATE_PASSWORD&d=nocodb' | \
  gcloud secrets versions add cipherplay-crm-nocodb-nc-db \
    --project=cipherplay-production \
    --data-file=-
```

Generate and store stable NocoDB runtime secrets separately:

```bash
openssl rand -hex 32 | \
  gcloud secrets versions add cipherplay-crm-nocodb-auth-jwt-secret \
    --project=cipherplay-production \
    --data-file=-

openssl rand -hex 32 | \
  gcloud secrets versions add cipherplay-crm-nocodb-connection-encrypt-key \
    --project=cipherplay-production \
    --data-file=-

printf '%s' 'REPLACE_WITH_PRIVATE_CRM_WRITER_PASSWORD' | \
  gcloud secrets versions add cipherplay-crm-postgres-password \
    --project=cipherplay-production \
    --data-file=-
```

Keep a separate personal recovery copy of the NocoDB JWT secret, connection encryption key, and bootstrap credentials in private storage outside this repo and outside GitHub.

## CRM Database

After the Cloud SQL instance and CRM database exist, apply `../schema/001-crm.sql` from an approved environment with Cloud SQL access. The SQL file only creates structure and the initial `potential-investors` group; real contacts remain outside git.

## Notes

Cloudflare resources are disabled by default. Set `enable_cloudflare_edge = true`, `cloudflare_account_id`, `crm_zone_id` or `crm_zone_name`, an allowed Access identity, and `CLOUDFLARE_API_TOKEN` when the private CRM hostname is ready.

Cloud Run ingress remains limited to the internal/external load balancer path. The service disables the Invoker IAM check instead of granting `allUsers` the Invoker role, which avoids customer-domain restricted sharing policies while keeping traffic routed through the HTTPS load balancer.

NocoDB first-run admin setup is intentionally not automated in OpenTofu. Create the first admin account through the Cloudflare Access-protected UI after the service is reachable.
