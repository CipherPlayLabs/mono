resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.gcp_project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_compute_network" "n8n" {
  name                    = "${local.name_prefix}-network"
  auto_create_subnetworks = false

  depends_on = [
    google_project_service.required["compute.googleapis.com"],
  ]
}

resource "google_compute_subnetwork" "n8n" {
  name                     = "${local.name_prefix}-subnet"
  ip_cidr_range            = local.network_cidr
  network                  = google_compute_network.n8n.id
  region                   = var.gcp_region
  private_ip_google_access = true
}

resource "google_compute_global_address" "private_services" {
  name          = "${local.name_prefix}-private-services"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.n8n.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.n8n.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]

  depends_on = [
    google_project_service.required["servicenetworking.googleapis.com"],
  ]
}

resource "google_vpc_access_connector" "n8n" {
  name          = "${local.name_prefix}-connector"
  region        = var.gcp_region
  network       = google_compute_network.n8n.name
  ip_cidr_range = local.connector_cidr
  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 3

  depends_on = [
    google_project_service.required["vpcaccess.googleapis.com"],
  ]
}

resource "google_sql_database_instance" "n8n" {
  name                = local.sql_instance_name
  database_version    = var.postgres_version
  region              = var.gcp_region
  deletion_protection = var.cloud_sql_deletion_protection

  settings {
    tier              = var.cloud_sql_tier
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.cloud_sql_disk_size_gb
    disk_autoresize   = true
    edition           = "ENTERPRISE"
    user_labels       = local.labels

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "07:00"
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.n8n.id
      enable_private_path_for_google_cloud_services = true
    }
  }

  depends_on = [
    google_project_service.required["sqladmin.googleapis.com"],
    google_service_networking_connection.private_services,
  ]
}

resource "google_sql_database" "n8n" {
  name     = var.postgres_database
  instance = google_sql_database_instance.n8n.name
}

resource "google_storage_bucket" "binary_data" {
  name                        = local.binary_data_bucket_name
  project                     = var.gcp_project_id
  location                    = var.gcp_region
  storage_class               = "STANDARD"
  labels                      = local.labels
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  depends_on = [
    google_project_service.required["storage.googleapis.com"],
  ]
}

resource "google_secret_manager_secret" "runtime" {
  for_each = local.runtime_secrets

  secret_id = each.value.secret_id
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [
    google_project_service.required["secretmanager.googleapis.com"],
  ]
}

resource "google_cloud_run_v2_service" "n8n" {
  provider = google-beta

  name                = local.cloud_run_service_name
  location            = var.gcp_region
  description         = "n8n Community Edition for CipherPlay public forms and automation workflows."
  ingress             = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
  deletion_protection = false
  labels              = local.labels

  template {
    labels                           = local.labels
    execution_environment            = "EXECUTION_ENVIRONMENT_GEN2"
    max_instance_request_concurrency = local.cloud_run_concurrency
    service_account                  = google_service_account.n8n_runtime.email

    scaling {
      min_instance_count = 1
      max_instance_count = 1
    }

    vpc_access {
      connector = google_vpc_access_connector.n8n.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      name  = "n8n"
      image = var.n8n_image

      ports {
        name           = "http1"
        container_port = local.cloud_run_container_port
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }

        cpu_idle          = false
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = local.n8n_static_env

        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.editor_enabled ? [1] : []

        content {
          name  = "N8N_EDITOR_BASE_URL"
          value = "https://${var.editor_hostname}/"
        }
      }

      dynamic "env" {
        for_each = local.runtime_secrets

        content {
          name = env.value.env_name

          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.runtime[env.key].secret_id
              version = "latest"
            }
          }
        }
      }

      volume_mounts {
        name       = "n8n-binary-data"
        mount_path = local.binary_data_mount_path
      }
    }

    volumes {
      name = "n8n-binary-data"

      gcs {
        bucket        = google_storage_bucket.binary_data.name
        read_only     = false
        mount_options = ["implicit-dirs"]
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.required["run.googleapis.com"],
    google_project_service.required["secretmanager.googleapis.com"],
    google_secret_manager_secret_iam_member.runtime_secret_accessor,
    google_storage_bucket_iam_member.runtime_binary_data_object_user,
  ]
}

resource "google_compute_region_network_endpoint_group" "n8n" {
  name                  = "${local.name_prefix}-neg"
  region                = var.gcp_region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = google_cloud_run_v2_service.n8n.name
  }

  depends_on = [
    google_project_service.required["compute.googleapis.com"],
  ]
}

resource "google_compute_backend_service" "n8n" {
  name                  = "${local.name_prefix}-backend"
  description           = "External HTTPS load balancer backend for n8n Cloud Run."
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 300

  backend {
    group = google_compute_region_network_endpoint_group.n8n.id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_url_map" "n8n" {
  name            = "${local.name_prefix}-url-map"
  description     = "Routes n8n HTTPS load balancer traffic to Cloud Run."
  default_service = google_compute_backend_service.n8n.id
}

resource "google_certificate_manager_dns_authorization" "n8n" {
  for_each = local.hostnames

  name        = "${local.name_prefix}-${each.key}-dns-auth"
  description = "DNS authorization for ${each.value}."
  domain      = each.value
  labels      = local.labels

  depends_on = [
    google_project_service.required["certificatemanager.googleapis.com"],
  ]
}

resource "google_certificate_manager_certificate" "n8n" {
  name        = "${local.name_prefix}-certificate"
  description = "Google-managed certificate for n8n public hostnames."
  labels      = local.labels

  managed {
    domains            = values(local.hostnames)
    dns_authorizations = [for authorization in google_certificate_manager_dns_authorization.n8n : authorization.id]
  }

  depends_on = [
    google_project_service.required["certificatemanager.googleapis.com"],
  ]
}

resource "google_certificate_manager_certificate_map" "n8n" {
  name        = "${local.name_prefix}-cert-map"
  description = "Certificate map for n8n HTTPS load balancer."
  labels      = local.labels

  depends_on = [
    google_project_service.required["certificatemanager.googleapis.com"],
  ]
}

resource "google_certificate_manager_certificate_map_entry" "n8n" {
  for_each = local.hostnames

  name         = "${local.name_prefix}-${each.key}"
  description  = "Certificate map entry for ${each.value}."
  map          = google_certificate_manager_certificate_map.n8n.name
  labels       = local.labels
  certificates = [google_certificate_manager_certificate.n8n.id]
  hostname     = each.value
}

resource "google_compute_target_https_proxy" "n8n" {
  name            = "${local.name_prefix}-https-proxy"
  url_map         = google_compute_url_map.n8n.id
  certificate_map = "//certificatemanager.googleapis.com/${google_certificate_manager_certificate_map.n8n.id}"
}

resource "google_compute_global_address" "n8n_lb" {
  name         = "${local.name_prefix}-lb-ip"
  address_type = "EXTERNAL"
  ip_version   = "IPV4"

  depends_on = [
    google_project_service.required["compute.googleapis.com"],
  ]
}

resource "google_compute_global_forwarding_rule" "https" {
  name                  = "${local.name_prefix}-https"
  ip_address            = google_compute_global_address.n8n_lb.address
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.n8n.id
}
