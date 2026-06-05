terraform {
  required_version = ">= 1.8.0"

  backend "gcs" {
    bucket = "cipherplay-production-opentofu-state"
    prefix = "infra/research-data"
  }

  required_providers {
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
