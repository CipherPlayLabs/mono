locals {
  name_prefix = "cipherplay-research-data"

  labels = {
    app         = "research-data"
    component   = "customer-discovery"
    environment = "production"
    managed_by  = "opentofu"
  }

  snapshot_bucket_name = var.snapshot_bucket_name != "" ? var.snapshot_bucket_name : "${var.gcp_project_id}-research-source-thread-snapshots"

  required_services = toset([
    "bigquery.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
  ])

  bigquery_tables = toset([
    "analysis_batches",
    "collection_checkpoints",
    "collection_run_configs",
    "collection_runs",
    "community_sources",
    "coverage_gaps",
    "evidence_claims",
    "jtbd_entities",
    "source_quality_notes",
    "source_thread_snapshots",
    "source_thread_triage",
    "source_threads",
    "thread_excerpts",
    "thread_level_jtbd_records",
    "thread_nodes",
  ])

  job_base_env = {
    BIGQUERY_DATASET = var.bigquery_dataset_id
    GCP_PROJECT_ID   = var.gcp_project_id
    SNAPSHOT_BUCKET  = google_storage_bucket.source_thread_snapshots.name
  }

  collector_env = merge(
    local.job_base_env,
    var.collection_config_uri != "" ? {
      COLLECTION_CONFIG_URI = var.collection_config_uri
    } : {},
    var.collection_run_id != "" ? {
      COLLECTION_RUN_ID = var.collection_run_id
    } : {},
    var.collection_query_mode != "" ? {
      COLLECTION_QUERY_MODE = var.collection_query_mode
    } : {}
  )

  job_env = {
    collector = local.collector_env
    triage = merge(local.job_base_env, {
      TRIAGE_BATCH_LIMIT = tostring(var.triage_batch_limit)
    })
    analysis = merge(local.job_base_env, {
      ANALYSIS_BATCH_LIMIT = tostring(var.analysis_batch_limit)
      MAX_CHUNK_CHARS      = tostring(var.max_chunk_chars)
    })
  }

  job_args = {
    collector = ["collect"]
    triage    = ["triage"]
    analysis  = ["analyze"]
  }

  github_deployer_project_roles = toset([
    "roles/bigquery.admin",
    "roles/cloudscheduler.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/run.admin",
    "roles/secretmanager.admin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/storage.admin",
  ])
}
