resource "google_service_account" "runtime" {
  account_id   = "research-data-runtime"
  display_name = "Research data Cloud Run Jobs runtime"
  description  = "Runtime identity for private Reddit customer discovery collection, triage, and thread-level JTBD jobs."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_service_account" "scheduler" {
  account_id   = "research-data-scheduler"
  display_name = "Research data scheduler"
  description  = "Cloud Scheduler identity that starts slow resumable research data collection jobs."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_service_account" "github_deployer" {
  account_id   = "research-data-github"
  display_name = "Research data GitHub deployer"
  description  = "Dedicated service account for GitHub Actions OIDC deployments of the research data stack."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_bigquery_dataset_iam_member" "runtime_data_editor" {
  project    = var.gcp_project_id
  dataset_id = google_bigquery_dataset.research_data.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_project_iam_member" "runtime_bigquery_job_user" {
  project = var.gcp_project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_storage_bucket_iam_member" "runtime_snapshot_object_admin" {
  bucket = google_storage_bucket.source_thread_snapshots.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_reddit_secret_accessor" {
  project   = var.gcp_project_id
  secret_id = google_secret_manager_secret.reddit_credentials.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_project_iam_member" "scheduler_run_developer" {
  project = var.gcp_project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.scheduler.email}"
}

resource "google_service_account_iam_member" "scheduler_runtime_service_account_user" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.scheduler.email}"
}

resource "google_project_iam_member" "github_deployer_project_roles" {
  for_each = local.github_deployer_project_roles

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_service_account_iam_member" "github_deployer_runtime_service_account_user" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_service_account_iam_member" "github_deployer_scheduler_service_account_user" {
  service_account_id = google_service_account.scheduler.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_service_account_iam_member" "github_oidc_workload_identity_user" {
  count = trimspace(var.github_oidc_principal_set) == "" ? 0 : 1

  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = var.github_oidc_principal_set
}

resource "google_service_account_iam_member" "github_oidc_service_account_token_creator" {
  count = trimspace(var.github_oidc_principal_set) == "" ? 0 : 1

  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = var.github_oidc_principal_set
}
