output "app_url" { value = google_cloud_run_v2_service.web.uri }
output "api_url" { value = "${google_cloud_run_v2_service.api.uri}/api" }
output "db_host" {
  value     = google_sql_database_instance.postgres.public_ip_address
  sensitive = true
}
