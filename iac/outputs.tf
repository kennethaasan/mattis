output "database_url" {
  value     = "postgresql://${neon_role.production_app.name}:${neon_role.production_app.password}@${neon_endpoint.production.host}/${neon_database.production_database.name}"
  sensitive = true
}
