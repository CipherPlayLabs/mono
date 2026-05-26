provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

provider "cloudflare" {
  # The provider reads CLOUDFLARE_API_TOKEN by default. In GitHub Actions,
  # map CLOUDFLARE_ANALYTICS_API_TOKEN to CLOUDFLARE_API_TOKEN for this step.
}
