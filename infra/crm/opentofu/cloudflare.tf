data "cloudflare_zones" "crm" {
  count = var.enable_cloudflare_edge && var.crm_zone_id == "" ? 1 : 0

  account = {
    id = var.cloudflare_account_id
  }
  name      = var.crm_zone_name
  max_items = 1
}

resource "cloudflare_dns_record" "certificate_authorization" {
  count = var.enable_cloudflare_edge ? 1 : 0

  zone_id = local.crm_cloudflare_zone_id
  name    = trimsuffix(google_certificate_manager_dns_authorization.crm.dns_resource_record[0].name, ".")
  content = trimsuffix(google_certificate_manager_dns_authorization.crm.dns_resource_record[0].data, ".")
  type    = google_certificate_manager_dns_authorization.crm.dns_resource_record[0].type
  ttl     = 60
  proxied = false
}

resource "cloudflare_dns_record" "crm" {
  count = var.enable_cloudflare_edge ? 1 : 0

  zone_id = local.crm_cloudflare_zone_id
  name    = var.crm_hostname
  content = google_compute_global_address.crm_lb.address
  type    = "A"
  ttl     = 1
  proxied = true
}

resource "cloudflare_zero_trust_organization" "crm" {
  count = var.enable_cloudflare_edge && var.manage_cloudflare_access_organization ? 1 : 0

  account_id              = var.cloudflare_account_id
  name                    = var.cloudflare_access_organization_name
  auth_domain             = var.cloudflare_access_auth_domain
  session_duration        = "24h"
  deny_unmatched_requests = false
}

resource "cloudflare_zero_trust_access_application" "crm" {
  count = var.enable_cloudflare_edge ? 1 : 0

  account_id                = var.cloudflare_account_id
  name                      = "CipherPlay CRM"
  domain                    = var.crm_hostname
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = false
  app_launcher_visible      = false
  options_preflight_bypass  = true

  policies = [
    {
      name       = "Allow CRM operators"
      decision   = "allow"
      precedence = 1
      include    = local.access_include_rules
    }
  ]

  lifecycle {
    precondition {
      condition     = length(local.access_include_rules) > 0
      error_message = "Set crm_access_allowed_emails or crm_access_allowed_group_ids when enable_cloudflare_edge is true."
    }
  }

  depends_on = [
    cloudflare_zero_trust_organization.crm,
  ]
}
