###########################
# Neon - PostgreSQL setup
###########################

resource "neon_project" "this" {
  name                      = var.neon_project_name
  region_id                 = var.neon_region
  pg_version                = var.neon_pg_version
  org_id                    = var.neon_organization_id
  history_retention_seconds = var.neon_retention_seconds

  branch {
    name          = "production"
    database_name = var.app_name
    role_name     = "app_role"
  }
}

resource "neon_branch" "production" {
  project_id = neon_project.this.id
  name       = "production"
}

resource "neon_endpoint" "production" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.production.id

  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 1
  suspend_timeout_seconds  = 10
}

resource "neon_role" "production_app" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.production.id
  name       = "app_role"
}

resource "neon_database" "production_database" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.production.id
  name       = var.app_name
  owner_name = neon_role.production_app.name
}

###########################
# AWS Infrastructure
###########################

data "aws_route53_zone" "zone" {
  name         = var.parent_domain
  private_zone = false
}

resource "aws_acm_certificate" "ssl_certificate" {
  provider          = aws.us_east_1
  domain_name       = var.app_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "ssl_certificate_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ssl_certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.zone.zone_id
}

resource "aws_acm_certificate_validation" "ssl_certificate" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.ssl_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.ssl_certificate_validation : record.fqdn]
}

module "opennext" {
  source  = "nhs-england-tools/opennext/aws"
  version = "~> 1.0.6"

  prefix              = local.stack_name
  opennext_build_path = var.opennext_build_path
  region              = var.aws_region
  hosted_zone_id      = data.aws_route53_zone.zone.zone_id

  cloudfront = {
    aliases             = [var.app_domain]
    acm_certificate_arn = aws_acm_certificate_validation.ssl_certificate.certificate_arn
    price_class         = var.cloudfront_price_class
  }

  server_options = {
    function = {
      handler      = var.lambda_handler
      runtime      = var.lambda_runtime
      architecture = [var.lambda_architecture]
      memory_size  = var.lambda_memory_size
      timeout      = var.lambda_timeout
    }
    environment_variables = merge(
      var.lambda_environment,
      {
        DATABASE_URL = output.database_url.value
      }
    )
    log_group = {
      retention_in_days = var.lambda_log_retention_days
    }
  }
}
