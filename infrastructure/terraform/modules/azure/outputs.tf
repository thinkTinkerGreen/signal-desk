output "app_url" { value = "https://${azurerm_container_app.web.ingress[0].fqdn}" }
output "api_url" { value = "https://${azurerm_container_app.api.ingress[0].fqdn}/api" }
output "db_host" {
  value     = azurerm_postgresql_flexible_server.postgres.fqdn
  sensitive = true
}
