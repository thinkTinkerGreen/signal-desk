variable "prefix" { type = string }
variable "location" { type = string }
variable "api_image" { type = string }
variable "web_image" { type = string }
variable "db_name" { type = string }
variable "db_user" { type = string }
variable "db_password" { type = string; sensitive = true }
variable "session_secret" { type = string; sensitive = true; default = "" }
