output "app_url" {
  value = "http://${aws_lb.main.dns_name}"
}
output "api_url" {
  value = "http://${aws_lb.main.dns_name}/api"
}
output "db_host" {
  value     = aws_db_instance.postgres.address
  sensitive = true
}
