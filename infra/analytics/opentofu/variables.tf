variable "gcp_project_id" {
  description = "Google Cloud project that hosts the private CipherPlay Plausible analytics VM and backup bucket."
  type        = string
}

variable "gcp_region" {
  description = "Google Cloud region for analytics infrastructure."
  type        = string
  default     = "us-east1"
}

variable "gcp_zone" {
  description = "Google Cloud zone for the Plausible analytics VM."
  type        = string
  default     = "us-east1-b"
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the CipherPlay analytics Tunnel, Access application, and Worker."
  type        = string
}

variable "lobst3rs_zone_id" {
  description = "Cloudflare zone ID for the private Plausible dashboard hostname."
  type        = string
}

variable "allanbpediniv_zone_id" {
  description = "Cloudflare zone ID for the current public content-site domain."
  type        = string
}

variable "access_allowed_email" {
  description = "Operator email address allowed through Cloudflare Access for the private Plausible dashboard."
  type        = string
}

variable "plausible_hostname" {
  description = "Hostname for the private Plausible dashboard. Keep this operational hostname out of public site HTML and browser-visible JavaScript."
  type        = string
}

variable "analytics_sites" {
  description = "Public websites and same-origin /_analytics/* routes proxied to private Plausible."
  type = list(object({
    domain        = string
    route_pattern = string
  }))
  default = [
    {
      domain        = "allanbpediniv.com"
      route_pattern = "allanbpediniv.com/_analytics/*"
    }
  ]

  validation {
    condition = alltrue([
      for site in var.analytics_sites :
      strcontains(site.route_pattern, "${site.domain}/_analytics/")
    ])
    error_message = "Each analytics site route_pattern must be a same-origin /_analytics/* route for its domain."
  }
}
