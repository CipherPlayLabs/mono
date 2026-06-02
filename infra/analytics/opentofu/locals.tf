locals {
  name_prefix = "cipherplay-analytics"

  labels = {
    app         = "plausible"
    component   = "analytics"
    company     = "cipherplay"
    environment = "production"
    managed_by  = "opentofu"
  }

  network_cidr = "10.42.0.0/24"

  vm_name       = "${local.name_prefix}-vm"
  vm_tag        = "plausible-analytics-vm"
  backup_bucket = "${var.gcp_project_id}-plausible-backups"

  plausible_origin_service = "http://localhost:8000"

  analytics_dashboard_zone_id = (
    var.analytics_dashboard_zone_id != "" ?
    var.analytics_dashboard_zone_id :
    data.cloudflare_zones.analytics_dashboard[0].result[0].id
  )

  analytics_routes = {
    for site in var.analytics_sites : site.route_pattern => merge(site, {
      zone_id = var.public_site_zone_id
    })
  }
}
