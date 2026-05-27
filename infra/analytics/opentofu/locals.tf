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

  analytics_zone_ids_by_domain = {
    "allanbpediniv.com" = var.allanbpediniv_zone_id
  }

  analytics_routes = {
    for site in var.analytics_sites : site.route_pattern => merge(site, {
      zone_id = lookup(local.analytics_zone_ids_by_domain, site.domain, var.allanbpediniv_zone_id)
    })
  }
}
