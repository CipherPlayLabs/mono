variable "gcp_project_id" {
  description = "Existing Google Cloud project that hosts the CRM. This OpenTofu project never creates the project."
  type        = string
  default     = "cipherplay-production"
}

variable "gcp_region" {
  description = "Google Cloud region for Cloud Run, Cloud SQL, and networking."
  type        = string
  default     = "us-east1"
}

variable "opentofu_state_bucket_name" {
  description = "Existing GCS bucket used by the CRM OpenTofu remote backend. Defaults to <gcp_project_id>-opentofu-state."
  type        = string
  default     = ""
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

variable "enable_cloudflare_edge" {
  description = "Whether to manage Cloudflare DNS and Access for the CRM hostname."
  type        = bool
  default     = false

  validation {
    condition = (
      !var.enable_cloudflare_edge ||
      length(var.crm_access_allowed_emails) > 0 ||
      length(var.crm_access_allowed_group_ids) > 0
    )
    error_message = "Set crm_access_allowed_emails or crm_access_allowed_group_ids when enable_cloudflare_edge is true."
  }
}

variable "cloudflare_access_organization_name" {
  description = "Cloudflare Zero Trust organization display name used for the CRM Access app."
  type        = string
  default     = "CipherPlay Internal"
}

variable "cloudflare_access_auth_domain" {
  description = "Unique Cloudflare Access auth domain used when CRM Cloudflare Access is enabled."
  type        = string
  default     = "cipherplay.cloudflareaccess.com"

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.cloudflareaccess\\.com$", var.cloudflare_access_auth_domain))
    error_message = "cloudflare_access_auth_domain must be a lowercase cloudflareaccess.com hostname."
  }
}

variable "manage_cloudflare_access_organization" {
  description = "Whether OpenTofu should manage the account-level Cloudflare Zero Trust organization. Leave false when Access is enabled manually in the dashboard."
  type        = bool
  default     = false
}

variable "crm_hostname" {
  description = "Cloudflare Access-protected hostname for the CRM UI."
  type        = string
  default     = "crm.cipherinternal.com"

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$", var.crm_hostname))
    error_message = "crm_hostname must be a lowercase DNS hostname."
  }
}

variable "crm_zone_id" {
  description = "Optional Cloudflare zone ID for the CRM hostname. When empty, crm_zone_name is used to look up the zone."
  type        = string
  default     = ""
}

variable "crm_zone_name" {
  description = "Cloudflare zone name for the CRM hostname, used when crm_zone_id is empty."
  type        = string
  default     = "cipherinternal.com"

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$", var.crm_zone_name))
    error_message = "crm_zone_name must be a lowercase DNS zone name."
  }
}

variable "crm_access_allowed_emails" {
  description = "Email addresses allowed through Cloudflare Access for the CRM hostname."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for email in var.crm_access_allowed_emails :
      can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", email))
    ])
    error_message = "Each crm_access_allowed_emails value must look like an email address."
  }
}

variable "crm_access_allowed_group_ids" {
  description = "Cloudflare Access group IDs allowed through the CRM hostname."
  type        = list(string)
  default     = []
}

variable "github_oidc_principal_set" {
  description = "Optional Workload Identity principalSet member allowed to impersonate the CRM GitHub deployer service account."
  type        = string
  default     = ""
}

variable "nocodb_image" {
  description = "Cloud Run-compatible NocoDB container image."
  type        = string
  default     = "docker.io/nocodb/nocodb:latest"

  validation {
    condition     = length(split("/", var.nocodb_image)) >= 3
    error_message = "nocodb_image must include a registry host and repository path, for example docker.io/nocodb/nocodb:latest."
  }
}

variable "postgres_version" {
  description = "Cloud SQL PostgreSQL engine version."
  type        = string
  default     = "POSTGRES_16"
}

variable "nocodb_metadata_database" {
  description = "PostgreSQL database used by NocoDB for its internal metadata."
  type        = string
  default     = "nocodb"
}

variable "nocodb_metadata_user" {
  description = "PostgreSQL user used by NocoDB for its internal metadata. Create this user out of band and mirror the full NC_DB string into Secret Manager."
  type        = string
  default     = "nocodb"
}

variable "crm_database" {
  description = "PostgreSQL database that stores CRM contacts, groups, campaigns, and email events."
  type        = string
  default     = "crm"
}

variable "crm_database_user" {
  description = "PostgreSQL user intended for n8n and approved operators to read/write CRM data. Create this user out of band and mirror its password into Secret Manager."
  type        = string
  default     = "crm_writer"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier for the CRM PostgreSQL instance."
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
