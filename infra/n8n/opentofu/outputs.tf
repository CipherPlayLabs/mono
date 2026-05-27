output "cloud_run_service_name" {
  description = "Cloud Run service name for n8n."
  value       = google_cloud_run_v2_service.n8n.name
}

output "cloud_run_service_uri" {
  description = "Cloud Run service URI. Ingress is load-balancer-only; public traffic should use Cloudflare and the HTTPS load balancer."
  value       = google_cloud_run_v2_service.n8n.uri
}

output "forms_hostname" {
  description = "Public n8n forms hostname."
  value       = var.forms_hostname
}

output "editor_hostname" {
  description = "Optional Cloudflare Access-protected n8n editor hostname."
  value       = local.editor_enabled ? var.editor_hostname : null
}

output "load_balancer_ip_address" {
  description = "External IPv4 address for the n8n HTTPS load balancer."
  value       = google_compute_global_address.n8n_lb.address
}

output "cloud_sql_instance_name" {
  description = "Cloud SQL PostgreSQL instance name."
  value       = google_sql_database_instance.n8n.name
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name."
  value       = google_sql_database_instance.n8n.connection_name
}

output "cloud_sql_private_ip_address" {
  description = "Private IP address used by Cloud Run to reach Cloud SQL."
  value       = google_sql_database_instance.n8n.private_ip_address
}

output "binary_data_bucket_name" {
  description = "GCS bucket mounted into Cloud Run for n8n filesystem binary data."
  value       = google_storage_bucket.binary_data.name
}

output "runtime_secret_ids" {
  description = "Secret Manager secret IDs that must receive out-of-band secret versions before n8n can start successfully."
  value       = { for key, secret in google_secret_manager_secret.runtime : key => secret.secret_id }
}

output "certificate_dns_authorization_records" {
  description = "DNS authorization CNAMEs for the Google-managed certificate. These are also managed in Cloudflare DNS."
  value = {
    for key, authorization in google_certificate_manager_dns_authorization.n8n : key => {
      name = authorization.dns_resource_record[0].name
      type = authorization.dns_resource_record[0].type
      data = authorization.dns_resource_record[0].data
    }
  }
}

output "github_deployer_service_account_email" {
  description = "Dedicated service account intended for GitHub Actions OIDC n8n deployments after bootstrap."
  value       = google_service_account.github_deployer.email
}
