resource "google_service_account" "plausible_vm" {
  account_id   = "plausible-analytics-vm"
  display_name = "Plausible analytics VM"
  description  = "Runs the self-hosted Plausible CE analytics stack."
}

resource "google_compute_network" "analytics" {
  name                    = "${local.name_prefix}-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "analytics" {
  name                     = "${local.name_prefix}-subnet"
  ip_cidr_range            = local.network_cidr
  network                  = google_compute_network.analytics.id
  region                   = var.gcp_region
  private_ip_google_access = true
}

resource "google_compute_router" "analytics" {
  name    = "${local.name_prefix}-router"
  network = google_compute_network.analytics.id
  region  = var.gcp_region
}

resource "google_compute_router_nat" "analytics" {
  name                               = "${local.name_prefix}-nat"
  router                             = google_compute_router.analytics.name
  region                             = var.gcp_region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.analytics.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }
}

resource "google_compute_firewall" "allow_iap_ssh" {
  name      = "${local.name_prefix}-allow-iap-ssh"
  network   = google_compute_network.analytics.name
  direction = "INGRESS"
  priority  = 1000

  source_ranges = ["35.235.240.0/20"]
  target_tags   = [local.vm_tag]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "allow_required_egress" {
  name      = "${local.name_prefix}-allow-required-egress"
  network   = google_compute_network.analytics.name
  direction = "EGRESS"
  priority  = 1000

  destination_ranges = ["0.0.0.0/0"]
  target_tags        = [local.vm_tag]

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  allow {
    protocol = "tcp"
    ports    = ["53"]
  }

  allow {
    protocol = "udp"
    ports    = ["53", "123"]
  }
}

resource "google_compute_firewall" "deny_other_egress" {
  name      = "${local.name_prefix}-deny-other-egress"
  network   = google_compute_network.analytics.name
  direction = "EGRESS"
  priority  = 2000

  destination_ranges = ["0.0.0.0/0"]
  target_tags        = [local.vm_tag]

  deny {
    protocol = "all"
  }
}

data "google_compute_image" "ubuntu" {
  family  = "ubuntu-2404-lts-amd64"
  project = "ubuntu-os-cloud"
}

resource "google_compute_instance" "plausible" {
  name         = local.vm_name
  machine_type = "e2-small"
  zone         = var.gcp_zone
  tags         = [local.vm_tag]
  labels       = local.labels

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 80
      type  = "pd-balanced"
      labels = merge(local.labels, {
        role = "boot"
      })
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.analytics.id
  }

  service_account {
    email  = google_service_account.plausible_vm.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  metadata = {
    enable-oslogin         = "TRUE"
    block-project-ssh-keys = "TRUE"
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  allow_stopping_for_update = true

  depends_on = [
    google_compute_router_nat.analytics,
  ]
}

resource "google_storage_bucket" "backups" {
  name                        = local.backup_bucket
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

  retention_policy {
    retention_period = 2592000
    is_locked        = false
  }

  lifecycle_rule {
    condition {
      age = 180
    }

    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age                   = 30
      num_newer_versions    = 3
      with_state            = "ARCHIVED"
      matches_storage_class = ["STANDARD"]
    }

    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_member" "plausible_vm_backup_writer" {
  bucket = google_storage_bucket.backups.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.plausible_vm.email}"
}
