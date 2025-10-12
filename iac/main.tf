###########################
# Neon - PostgreSQL setup
###########################

resource "neon_project" "this" {
  name       = var.neon_project_name
  region_id  = var.neon_region
  pg_version = var.neon_pg_version

  history_retention_seconds = var.neon_retention_days * 24 * 60 * 60
}

resource "neon_branch" "primary" {
  project_id = neon_project.this.id
  name       = "main"
}

resource "random_password" "db" {
  length  = 24
  special = true
}

resource "neon_role" "app" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.primary.id
  name       = "app_role"
  password   = random_password.db.result
}

resource "neon_database" "app" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.primary.id
  name       = "app_db"
  owner_name = neon_role.app.name
}

data "neon_connection_uri" "app" {
  project_id    = neon_project.this.id
  branch_id     = neon_branch.primary.id
  role_name     = neon_role.app.name
  database_name = neon_database.app.name
  sslmode       = "require"
}

###########################
# AWS Infrastructure
###########################

data "aws_route53_zone" "parent" {
  name         = var.parent_domain
  private_zone = false
}

module "opennext" {
  source  = "nhs-england-tools/opennext/aws"
  version = "~> 0.6.0"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name                = var.app_name
  environment         = var.environment
  hosted_zone_id      = data.aws_route53_zone.parent.zone_id
  domain_name         = var.app_domain
  lambda_source_dir   = var.lambda_source_dir
  lambda_runtime      = var.lambda_runtime
  lambda_handler      = var.lambda_handler
  lambda_memory_size  = var.lambda_memory_size
  lambda_timeout      = var.lambda_timeout
  lambda_layers       = var.lambda_layers
  lambda_architecture = var.lambda_architecture
  lambda_publish      = var.lambda_publish
  lambda_description  = var.lambda_description
  log_retention       = var.lambda_log_retention_days
  cloudfront_comment  = var.cloudfront_comment
  cloudfront_price_class = var.cloudfront_price_class
  tags                   = local.default_tags

  lambda_environment = merge(
    var.lambda_environment,
    {
      DATABASE_URL = data.neon_connection_uri.app.uri
    }
  )
}
