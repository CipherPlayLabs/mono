output "cloud_run_service_name" {
  description = "Cloud Run service name for the NocoDB CRM."
  value       = google_cloud_run_v2_service.crm.name
}

output "cloud_run_service_uri" {
  description = "Cloud Run service URI. Ingress is load-balancer-only; public traffic should use Cloudflare and the HTTPS load balancer."
  value       = google_cloud_run_v2_service.crm.uri
}

output "crm_hostname" {
  description = "Cloudflare Access-protected CRM hostname."
  value       = var.crm_hostname
}

output "load_balancer_ip_address" {
  description = "External IPv4 address for the CRM HTTPS load balancer."
  value       = google_compute_global_address.crm_lb.address
}

output "cloud_sql_instance_name" {
  description = "Cloud SQL PostgreSQL instance name."
  value       = google_sql_database_instance.crm.name
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name."
  value       = google_sql_database_instance.crm.connection_name
}

output "cloud_sql_private_ip_address" {
  description = "Private IP address used by Cloud Run to reach Cloud SQL."
  value       = google_sql_database_instance.crm.private_ip_address
}

output "nocodb_metadata_database" {
  description = "PostgreSQL database used by NocoDB for metadata."
  value       = google_sql_database.nocodb_metadata.name
}

output "crm_database" {
  description = "PostgreSQL database used for CRM data."
  value       = google_sql_database.crm.name
}

output "app_secret_ids" {
  description = "Secret Manager secret IDs that must receive out-of-band secret versions before NocoDB can start successfully."
  value       = { for key, secret in google_secret_manager_secret.app : key => secret.secret_id }
}

output "operator_secret_ids" {
  description = "Secret Manager secret IDs reserved for operator and downstream workflow credentials."
  value       = { for key, secret in google_secret_manager_secret.operator : key => secret.secret_id }
}

output "nc_db_secret_template" {
  description = "Template for the NC_DB secret value. Replace the password placeholder before storing it in Secret Manager."
  value       = "pg://${google_sql_database_instance.crm.private_ip_address}:5432?u=${var.nocodb_metadata_user}&p=REPLACE_WITH_PRIVATE_PASSWORD&d=${var.nocodb_metadata_database}"
}

output "crm_data_source" {
  description = "Connection details for the CRM data database. Store the password in the operator Secret Manager secret."
  value = {
    host     = google_sql_database_instance.crm.private_ip_address
    port     = 5432
    database = var.crm_database
    user     = var.crm_database_user
  }
}

output "certificate_dns_authorization_record" {
  description = "DNS authorization CNAME for the Google-managed certificate. This is also managed in Cloudflare DNS when enable_cloudflare_edge is true."
  value = {
    name = google_certificate_manager_dns_authorization.crm.dns_resource_record[0].name
    type = google_certificate_manager_dns_authorization.crm.dns_resource_record[0].type
    data = google_certificate_manager_dns_authorization.crm.dns_resource_record[0].data
  }
}

output "github_deployer_service_account_email" {
  description = "Dedicated service account intended for GitHub Actions OIDC CRM deployments after bootstrap."
  value       = google_service_account.github_deployer.email
}
