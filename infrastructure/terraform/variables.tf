# ─────────────────────────────────────────────────────────────────────────────
# Cloud provider selection
# ─────────────────────────────────────────────────────────────────────────────
variable "cloud" {
  description = "Target cloud provider: aws | gcp | azure"
  type        = string
  default     = "aws"
  validation {
    condition     = contains(["aws", "gcp", "azure"], var.cloud)
    error_message = "cloud must be one of: aws, gcp, azure"
  }
}

variable "environment" {
  description = "Deployment environment: dev | staging | prod"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "signaldesk"
}

# ─────────────────────────────────────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────────────────────────────────────
variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "signaldesk"
}

variable "db_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "signaldesk"
}

variable "db_password" {
  description = "PostgreSQL password (use a secret manager in production)"
  type        = string
  sensitive   = true
}

# ─────────────────────────────────────────────────────────────────────────────
# Container images
# ─────────────────────────────────────────────────────────────────────────────
variable "api_image" {
  description = "Docker image for the API server (e.g. ghcr.io/user/signaldesk-api:latest)"
  type        = string
  default     = "ghcr.io/thinkTinkerGreen/signal-desk/api:latest"
}

variable "web_image" {
  description = "Docker image for the web frontend (e.g. ghcr.io/user/signaldesk-web:latest)"
  type        = string
  default     = "ghcr.io/thinkTinkerGreen/signal-desk/web:latest"
}

# ─────────────────────────────────────────────────────────────────────────────
# AWS-specific
# ─────────────────────────────────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_vpc_cidr" {
  description = "CIDR block for the AWS VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ─────────────────────────────────────────────────────────────────────────────
# GCP-specific
# ─────────────────────────────────────────────────────────────────────────────
variable "gcp_project" {
  description = "GCP project ID"
  type        = string
  default     = ""
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

# ─────────────────────────────────────────────────────────────────────────────
# Azure-specific
# ─────────────────────────────────────────────────────────────────────────────
variable "azure_location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "azure_subscription_id" {
  description = "Azure subscription ID"
  type        = string
  default     = ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Application secrets
# ─────────────────────────────────────────────────────────────────────────────
variable "session_secret" {
  description = "Session secret for the API server"
  type        = string
  sensitive   = true
  default     = ""
}
