resource "cloudflare_zero_trust_tunnel_cloudflared" "plausible" {
  account_id = var.cloudflare_account_id
  name       = "plausible-analytics-origin"
  config_src = "cloudflare"
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "plausible" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.plausible.id

  config = {
    ingress = [
      {
        hostname = var.plausible_hostname
        service  = local.plausible_origin_service
      },
      {
        service = "http_status:404"
      }
    ]
  }
}

resource "cloudflare_dns_record" "plausible_dashboard" {
  zone_id = var.lobst3rs_zone_id
  name    = var.plausible_hostname
  content = "${cloudflare_zero_trust_tunnel_cloudflared.plausible.id}.cfargotunnel.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

resource "cloudflare_zero_trust_access_service_token" "analytics_proxy" {
  account_id = var.cloudflare_account_id
  name       = "Analytics proxy Worker"
  duration   = "8760h"
}

resource "cloudflare_zero_trust_access_application" "plausible_dashboard" {
  account_id                = var.cloudflare_account_id
  name                      = "Plausible analytics dashboard"
  domain                    = var.plausible_hostname
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = false
  app_launcher_visible      = false
  options_preflight_bypass  = true

  policies = [
    {
      name       = "Allow analytics proxy Worker"
      decision   = "non_identity"
      precedence = 1
      include = [
        {
          service_token = {
            token_id = cloudflare_zero_trust_access_service_token.analytics_proxy.id
          }
        }
      ]
    },
    {
      name       = "Allow analytics operator"
      decision   = "allow"
      precedence = 2
      include = [
        {
          email = {
            email = var.access_allowed_email
          }
        }
      ]
    }
  ]
}

resource "cloudflare_workers_script" "analytics_proxy" {
  account_id         = var.cloudflare_account_id
  script_name        = "analytics-proxy"
  compatibility_date = "2026-05-26"
  content            = file("${path.module}/../worker/dist/index.js")
  main_module        = "worker.js"

  bindings = [
    {
      name = "PLAUSIBLE_ORIGIN_HOSTNAME"
      text = var.plausible_hostname
      type = "plain_text"
    },
    {
      name = "CF_ACCESS_CLIENT_ID"
      text = cloudflare_zero_trust_access_service_token.analytics_proxy.client_id
      type = "plain_text"
    },
    {
      name = "CF_ACCESS_CLIENT_SECRET"
      text = cloudflare_zero_trust_access_service_token.analytics_proxy.client_secret
      type = "secret_text"
    }
  ]
}

resource "cloudflare_workers_route" "analytics_proxy" {
  for_each = local.analytics_routes

  zone_id = each.value.zone_id
  pattern = each.value.route_pattern
  script  = cloudflare_workers_script.analytics_proxy.script_name
}
