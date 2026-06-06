resource "google_service_account" "crm_runtime" {
  account_id   = "crm-cloud-run"
  display_name = "CRM Cloud Run runtime"
  description  = "Runtime identity for the NocoDB CRM Cloud Run service."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_service_account" "github_deployer" {
  account_id   = "crm-github-deployer"
  display_name = "CRM GitHub deployer"
  description  = "Dedicated service account for GitHub Actions OIDC deployments of the CRM stack."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
}

resource "google_project_iam_member" "runtime_cloudsql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.crm_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_secret_accessor" {
  for_each = google_secret_manager_secret.app

  project   = var.gcp_project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.crm_runtime.email}"
}

resource "google_project_iam_member" "github_deployer_project_roles" {
  for_each = local.github_deployer_project_roles

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_service_account_iam_member" "github_deployer_runtime_service_account_user" {
  service_account_id = google_service_account.crm_runtime.name
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
