resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.gcp_project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "source_thread_snapshots" {
  name                        = local.snapshot_bucket_name
  project                     = var.gcp_project_id
  location                    = var.gcp_region
  storage_class               = "STANDARD"
  labels                      = local.labels
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  versioning {
    enabled = true
  }

  depends_on = [
    google_project_service.required["storage.googleapis.com"],
  ]
}

resource "google_bigquery_dataset" "research_data" {
  dataset_id                 = var.bigquery_dataset_id
  project                    = var.gcp_project_id
  location                   = var.bigquery_location
  description                = "Private Reddit customer discovery collection, triage, evidence, and thread-level JTBD records."
  labels                     = local.labels
  delete_contents_on_destroy = false

  depends_on = [
    google_project_service.required["bigquery.googleapis.com"],
  ]
}

resource "google_bigquery_table" "research_data" {
  for_each = local.bigquery_tables

  dataset_id          = google_bigquery_dataset.research_data.dataset_id
  project             = var.gcp_project_id
  table_id            = each.value
  deletion_protection = var.bigquery_table_deletion_protection
  labels              = local.labels
  schema              = file("${path.module}/schemas/${each.value}.json")
}

resource "google_secret_manager_secret" "reddit_credentials" {
  secret_id = var.reddit_credentials_secret_id
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [
    google_project_service.required["secretmanager.googleapis.com"],
  ]
}

resource "google_cloud_run_v2_job" "research_data" {
  for_each = local.job_args
  provider = google-beta

  name                = "${local.name_prefix}-${each.key}"
  location            = var.gcp_region
  labels              = local.labels
  deletion_protection = false

  template {
    task_count = 1

    template {
      service_account = google_service_account.runtime.email
      timeout         = "${var.job_timeout_seconds}s"
      max_retries     = var.job_max_retries

      containers {
        image   = var.research_data_jobs_image
        command = ["python", "-m", "research_data"]
        args    = each.value

        resources {
          limits = {
            cpu    = var.job_cpu
            memory = var.job_memory
          }
        }

        dynamic "env" {
          for_each = local.job_env[each.key]

          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }

  depends_on = [
    google_project_service.required["run.googleapis.com"],
  ]
}

resource "google_cloud_scheduler_job" "collection" {
  name        = "${local.name_prefix}-collector"
  project     = var.gcp_project_id
  region      = var.gcp_region
  description = "Slow resumable Reddit source-thread collection for private customer discovery research."
  schedule    = var.collection_schedule
  time_zone   = "America/New_York"
  paused      = var.collection_scheduler_paused

  http_target {
    http_method = "POST"
    uri         = "https://${var.gcp_region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.gcp_project_id}/jobs/${google_cloud_run_v2_job.research_data["collector"].name}:run"
    body        = base64encode("{}")

    headers = {
      Content-Type = "application/json"
    }

    oauth_token {
      service_account_email = google_service_account.scheduler.email
    }
  }

  depends_on = [
    google_project_service.required["cloudscheduler.googleapis.com"],
  ]
}
