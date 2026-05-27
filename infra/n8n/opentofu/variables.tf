variable "gcp_project_id" {
  description = "Existing Google Cloud project that hosts n8n. This OpenTofu project never creates the project."
  type        = string
  default     = "cipherplay-production"
}

variable "gcp_region" {
  description = "Google Cloud region for Cloud Run, Cloud SQL, networking, and the binary-data bucket."
  type        = string
  default     = "us-east1"
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns Zero Trust Access resources."
  type        = string
  default     = ""

  validation {
    condition     = !var.enable_cloudflare_edge || var.cloudflare_account_id != ""
    error_message = "cloudflare_account_id is required when enable_cloudflare_edge is true."
  }
}

variable "cipherplay_zone_id" {
  description = "Cloudflare zone ID for cipherplay.net."
  type        = string
  default     = ""

  validation {
    condition     = !var.enable_cloudflare_edge || var.cipherplay_zone_id != ""
    error_message = "cipherplay_zone_id is required when enable_cloudflare_edge is true."
  }
}

variable "enable_cloudflare_edge" {
  description = "Whether to manage Cloudflare DNS, public forms protection, and optional editor Access resources. Leave false until cipherplay.net is ready in Cloudflare."
  type        = bool
  default     = false
}

variable "forms_hostname" {
  description = "Public hostname used by n8n-generated forms and production webhooks."
  type        = string
  default     = "forms.cipherplay.net"

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$", var.forms_hostname))
    error_message = "forms_hostname must be a lowercase DNS hostname."
  }
}

variable "editor_hostname" {
  description = "Optional editor/admin hostname. When empty, editor DNS and Cloudflare Access resources are not created."
  type        = string
  default     = ""

  validation {
    condition = (
      var.editor_hostname == "" ||
      can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$", var.editor_hostname))
    )
    error_message = "editor_hostname must be empty or a lowercase DNS hostname."
  }
}

variable "editor_access_allowed_emails" {
  description = "Email addresses allowed through Cloudflare Access for the optional editor hostname."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for email in var.editor_access_allowed_emails :
      can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", email))
    ])
    error_message = "Each editor_access_allowed_emails value must look like an email address."
  }
}

variable "editor_access_allowed_group_ids" {
  description = "Cloudflare Access group IDs allowed through the optional editor hostname."
  type        = list(string)
  default     = []
}

variable "github_oidc_principal_set" {
  description = "Optional Workload Identity principalSet member allowed to impersonate the n8n GitHub deployer service account."
  type        = string
  default     = ""
}

variable "n8n_image" {
  description = "Upstream n8n container image. Cloud Run uses this through the managed Artifact Registry remote repository."
  type        = string
  default     = "docker.n8n.io/n8nio/n8n:stable"

  validation {
    condition     = length(split("/", var.n8n_image)) >= 3
    error_message = "n8n_image must include a registry host and repository path, for example docker.n8n.io/n8nio/n8n:stable."
  }
}

variable "postgres_version" {
  description = "Cloud SQL PostgreSQL engine version."
  type        = string
  default     = "POSTGRES_16"
}

variable "postgres_database" {
  description = "PostgreSQL database used by n8n."
  type        = string
  default     = "n8n"
}

variable "postgres_user" {
  description = "PostgreSQL user used by n8n. Create this user out of band and mirror its password into Secret Manager."
  type        = string
  default     = "n8n"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier for the n8n PostgreSQL instance."
  type        = string
  default     = "db-g1-small"
}

variable "cloud_sql_disk_size_gb" {
  description = "Initial Cloud SQL disk size in GiB. Autoresize remains enabled."
  type        = number
  default     = 20

  validation {
    condition     = var.cloud_sql_disk_size_gb >= 10
    error_message = "cloud_sql_disk_size_gb must be at least 10."
  }
}

variable "cloud_sql_deletion_protection" {
  description = "Whether Cloud SQL deletion protection is enabled."
  type        = bool
  default     = true
}

variable "binary_data_bucket_name" {
  description = "Optional explicit GCS bucket name for n8n filesystem binary data."
  type        = string
  default     = ""
}

variable "forms_rate_limit_period_seconds" {
  description = "Cloudflare public forms rate-limit counting period."
  type        = number
  default     = 60
}

variable "forms_rate_limit_requests_per_period" {
  description = "Requests per IP and Cloudflare colo allowed during the forms rate-limit period before managed challenge."
  type        = number
  default     = 120
}

variable "forms_rate_limit_mitigation_seconds" {
  description = "How long Cloudflare keeps rate-limit mitigation active."
  type        = number
  default     = 600
}

variable "forms_threat_score_challenge_threshold" {
  description = "Cloudflare threat score above which public forms requests receive a managed challenge."
  type        = number
  default     = 10

  validation {
    condition     = var.forms_threat_score_challenge_threshold >= 0 && var.forms_threat_score_challenge_threshold <= 100
    error_message = "forms_threat_score_challenge_threshold must be between 0 and 100."
  }
}
