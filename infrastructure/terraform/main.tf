# ─────────────────────────────────────────────────────────────────────────────
# SignalDesk — Cloud-agnostic Terraform entrypoint
#
# Usage:
#   terraform init
#   terraform apply -var="cloud=aws" -var="db_password=secret"
#   terraform apply -var="cloud=gcp" -var="gcp_project=my-project"
#   terraform apply -var="cloud=azure" -var="azure_subscription_id=xxxx"
# ─────────────────────────────────────────────────────────────────────────────

locals {
  prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# AWS deployment (ECS Fargate + RDS PostgreSQL + ALB)
# ─────────────────────────────────────────────────────────────────────────────
module "aws" {
  source = "./modules/aws"
  count  = var.cloud == "aws" ? 1 : 0

  prefix         = local.prefix
  tags           = local.common_tags
  aws_region     = var.aws_region
  vpc_cidr       = var.aws_vpc_cidr
  api_image      = var.api_image
  web_image      = var.web_image
  db_name        = var.db_name
  db_user        = var.db_user
  db_password    = var.db_password
  session_secret = var.session_secret
}

# ─────────────────────────────────────────────────────────────────────────────
# GCP deployment (Cloud Run + Cloud SQL)
# ─────────────────────────────────────────────────────────────────────────────
module "gcp" {
  source = "./modules/gcp"
  count  = var.cloud == "gcp" ? 1 : 0

  prefix         = local.prefix
  gcp_project    = var.gcp_project
  gcp_region     = var.gcp_region
  api_image      = var.api_image
  web_image      = var.web_image
  db_name        = var.db_name
  db_user        = var.db_user
  db_password    = var.db_password
  session_secret = var.session_secret
}

# ─────────────────────────────────────────────────────────────────────────────
# Azure deployment (Container Apps + Azure DB for PostgreSQL)
# ─────────────────────────────────────────────────────────────────────────────
module "azure" {
  source = "./modules/azure"
  count  = var.cloud == "azure" ? 1 : 0

  prefix         = local.prefix
  location       = var.azure_location
  api_image      = var.api_image
  web_image      = var.web_image
  db_name        = var.db_name
  db_user        = var.db_user
  db_password    = var.db_password
  session_secret = var.session_secret
}
