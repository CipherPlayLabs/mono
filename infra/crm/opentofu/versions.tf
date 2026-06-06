terraform {
  required_version = ">= 1.8.0"

  backend "gcs" {
    bucket = "cipherplay-production-opentofu-state"
    prefix = "infra/crm"
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.8.2, < 6.0.0"
    }

    google = {
      source  = "hashicorp/google"
      version = ">= 6.0.0, < 7.0.0"
    }

    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 6.0.0, < 7.0.0"
    }
  }
}
