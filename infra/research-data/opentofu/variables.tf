variable "gcp_project_id" {
  description = "Existing Google Cloud project that hosts the private research data store. This project never creates the GCP project."
  type        = string
  default     = "cipherplay-production"
}

variable "gcp_region" {
  description = "Google Cloud region for Cloud Run Jobs, Cloud Scheduler, Secret Manager metadata, and the snapshot bucket."
  type        = string
  default     = "us-east1"
}

variable "bigquery_location" {
  description = "BigQuery dataset location."
  type        = string
  default     = "US"
}

variable "bigquery_dataset_id" {
  description = "BigQuery dataset ID for private research collection state, indexes, triage, evidence, and thread-level JTBD records."
  type        = string
  default     = "research_data"

  validation {
    condition     = length(var.bigquery_dataset_id) <= 1024 && can(regex("^[A-Za-z_][A-Za-z0-9_]*$", var.bigquery_dataset_id))
    error_message = "bigquery_dataset_id must be a valid BigQuery dataset ID."
  }
}

variable "snapshot_bucket_name" {
  description = "Optional explicit GCS bucket name for full provider-available raw source-thread snapshots."
  type        = string
  default     = ""
}

variable "reddit_credentials_secret_id" {
  description = "Secret Manager secret ID that will hold Reddit/API provider credentials. OpenTofu creates the container only, not secret versions."
  type        = string
  default     = "reddit-api-credentials"
}

variable "research_data_jobs_image" {
  description = "Container image for the research_data Cloud Run Jobs."
  type        = string
}

variable "collection_config_uri" {
  description = "Private gs:// URI for the active JSON collection run config. Do not point this at a committed file."
  type        = string
  default     = ""
}

variable "collection_run_id" {
  description = "Optional operator-provided collection_run_id. When empty, the job creates one from config URI and current time."
  type        = string
  default     = ""
}

variable "collection_query_mode" {
  description = "Optional enabled query mode for the scheduled collector batch, such as new, top, or search."
  type        = string
  default     = ""
}

variable "collection_schedule" {
  description = "Cloud Scheduler cron expression for slow resumable collection."
  type        = string
  default     = "*/30 * * * *"
}

variable "collection_scheduler_paused" {
  description = "Whether the collection scheduler starts paused. Keep true until the active JSON config and Reddit credentials are ready."
  type        = bool
  default     = true
}

variable "job_timeout_seconds" {
  description = "Per-task timeout for research data Cloud Run Jobs."
  type        = number
  default     = 3600
}

variable "job_max_retries" {
  description = "Cloud Run Job retry count for each task."
  type        = number
  default     = 1
}

variable "job_cpu" {
  description = "CPU limit for each research data job container."
  type        = string
  default     = "1"
}

variable "job_memory" {
  description = "Memory limit for each research data job container."
  type        = string
  default     = "1Gi"
}

variable "triage_batch_limit" {
  description = "Default number of untriaged source threads each triage job should process."
  type        = number
  default     = 25
}

variable "analysis_batch_limit" {
  description = "Default number of JTBD-eligible source threads each analysis job should process."
  type        = number
  default     = 10
}

variable "max_chunk_chars" {
  description = "Maximum source-thread characters per JTBD processing chunk. Large nodes become their own non-truncated chunk."
  type        = number
  default     = 12000
}

variable "bigquery_table_deletion_protection" {
  description = "Whether BigQuery tables should require deletion protection to be disabled before destroy."
  type        = bool
  default     = true
}

variable "github_oidc_principal_set" {
  description = "Optional Workload Identity principalSet member allowed to impersonate the research-data GitHub deployer service account."
  type        = string
  default     = ""
}
