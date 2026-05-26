output "vm_name" {
  description = "Name of the Plausible analytics VM."
  value       = google_compute_instance.plausible.name
}

output "vm_zone" {
  description = "Zone of the Plausible analytics VM."
  value       = google_compute_instance.plausible.zone
}

output "plausible_dashboard_hostname" {
  description = "Cloudflare Access-protected Plausible dashboard hostname."
  value       = var.plausible_hostname
}

output "backup_bucket_name" {
  description = "Private GCS bucket used for encrypted Plausible backup artifacts."
  value       = google_storage_bucket.backups.name
}

output "worker_route_patterns" {
  description = "Cloudflare Worker route patterns for same-origin analytics proxying."
  value       = [for route in cloudflare_workers_route.analytics_proxy : route.pattern]
}

output "cloudflare_tunnel_id" {
  description = "Cloudflare Tunnel ID for the Plausible origin."
  value       = cloudflare_zero_trust_tunnel_cloudflared.plausible.id
}
