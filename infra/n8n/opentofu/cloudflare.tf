data "cloudflare_zones" "editor" {
  count = var.enable_cloudflare_edge && local.editor_enabled && var.editor_zone_id == "" ? 1 : 0

  account = {
    id = var.cloudflare_account_id
  }
  name      = var.editor_zone_name
  max_items = 1
}

resource "cloudflare_dns_record" "certificate_authorization" {
  for_each = var.enable_cloudflare_edge ? google_certificate_manager_dns_authorization.n8n : {}

  zone_id = local.hostname_zone_ids[each.key]
  name    = trimsuffix(each.value.dns_resource_record[0].name, ".")
  content = trimsuffix(each.value.dns_resource_record[0].data, ".")
  type    = each.value.dns_resource_record[0].type
  ttl     = 60
  proxied = false
}

resource "cloudflare_dns_record" "forms" {
  count = var.enable_cloudflare_edge ? 1 : 0

  zone_id = var.cipherplay_zone_id
  name    = var.forms_hostname
  content = google_compute_global_address.n8n_lb.address
  type    = "A"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "editor" {
  count = var.enable_cloudflare_edge && local.editor_enabled ? 1 : 0

  zone_id = local.editor_cloudflare_zone_id
  name    = var.editor_hostname
  content = google_compute_global_address.n8n_lb.address
  type    = "A"
  ttl     = 1
  proxied = true
}

resource "cloudflare_ruleset" "forms_firewall_custom" {
  count = var.enable_cloudflare_edge ? 1 : 0

  zone_id     = var.cipherplay_zone_id
  name        = "n8n public forms bot protection"
  description = "Managed challenge suspicious traffic to the public n8n forms hostname."
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules = [{
    ref         = "n8n_forms_suspicious_clients"
    description = "Managed challenge suspicious non-verified-bot requests to public n8n forms."
    expression  = "(http.host eq \"${var.forms_hostname}\" and not cf.client.bot and cf.threat_score gt ${var.forms_threat_score_challenge_threshold})"
    action      = "managed_challenge"
  }]
}

resource "cloudflare_ruleset" "forms_rate_limit" {
  count = var.enable_cloudflare_edge ? 1 : 0

  zone_id     = var.cipherplay_zone_id
  name        = "n8n public forms rate limiting"
  description = "Rate limits public n8n forms traffic by client IP and Cloudflare colo."
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [{
    ref         = "n8n_forms_ip_rate_limit"
    description = "Block clients that exceed public forms request thresholds."
    expression  = "(http.host eq \"${var.forms_hostname}\")"
    action      = "block"

    ratelimit = {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = var.forms_rate_limit_period_seconds
      requests_per_period = var.forms_rate_limit_requests_per_period
      mitigation_timeout  = var.forms_rate_limit_mitigation_seconds
    }
  }]
}

resource "cloudflare_zero_trust_organization" "n8n" {
  count = var.enable_cloudflare_edge && local.editor_enabled && var.manage_cloudflare_access_organization ? 1 : 0

  account_id              = var.cloudflare_account_id
  name                    = var.cloudflare_access_organization_name
  auth_domain             = var.cloudflare_access_auth_domain
  session_duration        = "24h"
  deny_unmatched_requests = false
}

resource "cloudflare_zero_trust_access_application" "editor" {
  count = var.enable_cloudflare_edge && local.editor_enabled ? 1 : 0

  account_id                = var.cloudflare_account_id
  name                      = "n8n editor"
  domain                    = var.editor_hostname
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = false
  app_launcher_visible      = false
  options_preflight_bypass  = true

  policies = [
    {
      name       = "Allow n8n operators"
      decision   = "allow"
      precedence = 1
      include    = local.editor_access_include_rules
    }
  ]

  lifecycle {
    precondition {
      condition     = length(local.editor_access_include_rules) > 0
      error_message = "Set editor_access_allowed_emails or editor_access_allowed_group_ids when editor_hostname is set."
    }
  }

  depends_on = [
    cloudflare_zero_trust_organization.n8n,
  ]
}
