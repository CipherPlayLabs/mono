locals {
  name_prefix = "cipherplay-crm"

  labels = {
    app         = "nocodb"
    component   = "crm"
    company     = "cipherplay"
    environment = "production"
    managed_by  = "opentofu"
  }

  network_cidr   = "10.62.0.0/24"
  connector_cidr = "10.62.16.0/28"

  cloud_run_service_name   = local.name_prefix
  cloud_run_container_port = 8080
  cloud_run_concurrency    = 20

  sql_instance_name = "${local.name_prefix}-postgres"
  state_bucket_name = (
    var.opentofu_state_bucket_name != "" ?
    var.opentofu_state_bucket_name :
    "${var.gcp_project_id}-opentofu-state"
  )

  crm_cloudflare_zone_id = (
    var.crm_zone_id != "" ?
    var.crm_zone_id :
    (var.enable_cloudflare_edge ? data.cloudflare_zones.crm[0].result[0].id : "")
  )

  access_include_rules = concat(
    [
      for email in var.crm_access_allowed_emails : {
        email = {
          email = email
        }
      }
    ],
    [
      for group_id in var.crm_access_allowed_group_ids : {
        group = {
          id = group_id
        }
      }
    ]
  )

  required_services = toset([
    "certificatemanager.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "servicenetworking.googleapis.com",
    "serviceusage.googleapis.com",
    "sqladmin.googleapis.com",
    "vpcaccess.googleapis.com",
  ])

  app_secrets = {
    nc_db = {
      secret_id = "${local.name_prefix}-nocodb-nc-db"
      env_name  = "NC_DB"
    }
    auth_jwt_secret = {
      secret_id = "${local.name_prefix}-nocodb-auth-jwt-secret"
      env_name  = "NC_AUTH_JWT_SECRET"
    }
    connection_encrypt_key = {
      secret_id = "${local.name_prefix}-nocodb-connection-encrypt-key"
      env_name  = "NC_CONNECTION_ENCRYPT_KEY"
    }
  }

  operator_secrets = {
    crm_postgres_password = {
      secret_id = "${local.name_prefix}-postgres-password"
      purpose   = "Password for the CRM data database user used by n8n and approved operators."
    }
  }

  nocodb_static_env = {
    NC_CONNECT_TO_EXTERNAL_DB_DISABLED = "false"
    NC_DISABLE_ERR_REPORTS             = "true"
    NC_DISABLE_PG_DATA_REFLECTION      = "false"
    NC_DISABLE_SUPPORT_CHAT            = "true"
    NC_DISABLE_TELE                    = "true"
    NC_PUBLIC_URL                      = "https://${var.crm_hostname}"
    NODE_ENV                           = "production"
    NUXT_PUBLIC_NC_BACKEND_URL         = "https://${var.crm_hostname}"
  }

  github_deployer_project_roles = toset([
    "roles/certificatemanager.editor",
    "roles/cloudsql.admin",
    "roles/compute.loadBalancerAdmin",
    "roles/compute.networkAdmin",
    "roles/iam.serviceAccountAdmin",
    "roles/run.admin",
    "roles/secretmanager.admin",
    "roles/servicenetworking.networksAdmin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/vpcaccess.admin",
  ])
}
