output "snapshot_bucket_name" {
  description = "Private GCS bucket for full provider-available raw source-thread snapshots."
  value       = google_storage_bucket.source_thread_snapshots.name
}

output "bigquery_dataset_id" {
  description = "BigQuery dataset ID for private research data."
  value       = google_bigquery_dataset.research_data.dataset_id
}

output "reddit_credentials_secret_id" {
  description = "Secret Manager secret ID that must receive a Reddit/API provider credential version out of band."
  value       = google_secret_manager_secret.reddit_credentials.secret_id
}

output "cloud_run_job_names" {
  description = "Cloud Run Job names for collection, triage, and thread-level JTBD analysis."
  value       = { for key, job in google_cloud_run_v2_job.research_data : key => job.name }
}

output "collection_scheduler_name" {
  description = "Cloud Scheduler job that starts the collector Cloud Run Job."
  value       = google_cloud_scheduler_job.collection.name
}

output "triage_scheduler_name" {
  description = "Cloud Scheduler job that starts the triage Cloud Run Job."
  value       = google_cloud_scheduler_job.triage.name
}

output "runtime_service_account_email" {
  description = "Runtime service account for the research data Cloud Run Jobs."
  value       = google_service_account.runtime.email
}

output "github_deployer_service_account_email" {
  description = "Dedicated service account intended for GitHub Actions OIDC research-data deployments after bootstrap."
  value       = google_service_account.github_deployer.email
}
