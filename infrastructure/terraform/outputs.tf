output "app_url" {
  description = "Public URL of the deployed application"
  value = (
    var.cloud == "aws"   ? try(module.aws[0].app_url, "")   :
    var.cloud == "gcp"   ? try(module.gcp[0].app_url, "")   :
    var.cloud == "azure" ? try(module.azure[0].app_url, "") :
    "unknown cloud"
  )
}

output "api_url" {
  description = "Public URL of the API"
  value = (
    var.cloud == "aws"   ? try(module.aws[0].api_url, "")   :
    var.cloud == "gcp"   ? try(module.gcp[0].api_url, "")   :
    var.cloud == "azure" ? try(module.azure[0].api_url, "") :
    "unknown cloud"
  )
}

output "db_host" {
  description = "PostgreSQL host (private)"
  sensitive   = true
  value = (
    var.cloud == "aws"   ? try(module.aws[0].db_host, "")   :
    var.cloud == "gcp"   ? try(module.gcp[0].db_host, "")   :
    var.cloud == "azure" ? try(module.azure[0].db_host, "") :
    "unknown cloud"
  )
}
