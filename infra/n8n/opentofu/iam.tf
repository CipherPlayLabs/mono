resource "google_service_account" "n8n_runtime" {
  account_id   = "n8n-cloud-run"
  display_name = "n8n Cloud Run runtime"
  description  = "Runtime identity for the n8n Cloud Run service."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_service_account" "github_deployer" {
  account_id   = "n8n-github-deployer"
  display_name = "n8n GitHub deployer"
  description  = "Dedicated service account for GitHub Actions OIDC deployments of the n8n stack."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_project_iam_member" "runtime_cloudsql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.n8n_runtime.email}"
}

resource "google_storage_bucket_iam_member" "runtime_binary_data_object_user" {
  bucket = google_storage_bucket.binary_data.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.n8n_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_secret_accessor" {
  for_each = google_secret_manager_secret.runtime

  project   = var.gcp_project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.n8n_runtime.email}"
}

resource "google_project_iam_member" "github_deployer_project_roles" {
  for_each = local.github_deployer_project_roles

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_service_account_iam_member" "github_deployer_runtime_service_account_user" {
  service_account_id = google_service_account.n8n_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_service_account_iam_member" "github_oidc_workload_identity_user" {
  count = trimspace(var.github_oidc_principal_set) == "" ? 0 : 1

  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = var.github_oidc_principal_set
}
