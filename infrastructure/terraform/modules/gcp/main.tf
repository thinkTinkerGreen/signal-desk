# ─────────────────────────────────────────────────────────────────────────────
# GCP module — Cloud Run + Cloud SQL (PostgreSQL)
# ─────────────────────────────────────────────────────────────────────────────

resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "sqladmin" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_sql_database_instance" "postgres" {
  name             = "${var.prefix}-postgres"
  database_version = "POSTGRES_16"
  region           = var.gcp_region
  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10
    backup_configuration {
      enabled = true
    }
  }
  deletion_protection = false
  depends_on          = [google_project_service.sqladmin]
}

resource "google_sql_database" "signaldesk" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app" {
  name     = var.db_user
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# Cloud Run — API
resource "google_cloud_run_v2_service" "api" {
  name     = "${var.prefix}-api"
  location = var.gcp_region
  template {
    containers {
      image = var.api_image
      ports { container_port = 8080 }
      env {
        name  = "DATABASE_URL"
        value = "postgres://${var.db_user}:${var.db_password}@/${var.db_name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
      }
      env { name = "PORT"; value = "8080" }
      env { name = "NODE_ENV"; value = "production" }
      env { name = "SESSION_SECRET"; value = var.session_secret }
      resources { limits = { memory = "512Mi"; cpu = "1" } }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance { instances = [google_sql_database_instance.postgres.connection_name] }
    }
  }
  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.gcp_project
  location = var.gcp_region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run — Web
resource "google_cloud_run_v2_service" "web" {
  name     = "${var.prefix}-web"
  location = var.gcp_region
  template {
    containers {
      image = var.web_image
      ports { container_port = 80 }
      resources { limits = { memory = "256Mi"; cpu = "1" } }
    }
  }
  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  project  = var.gcp_project
  location = var.gcp_region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
