###########################
# Neon - PostgreSQL setup
###########################

resource "neon_project" "this" {
  name                      = var.neon_project_name
  region_id                 = var.neon_region
  pg_version                = var.neon_pg_version
  org_id                    = var.neon_organization_id
  history_retention_seconds = var.neon_retention_seconds

  default_endpoint_settings {
    autoscaling_limit_min_cu = 0.25
    autoscaling_limit_max_cu = 1
  }

  branch {
    name          = "main"
    database_name = var.app_name
    role_name     = "app_role"
  }
}

locals {
  database_url = neon_project.this.connection_uri
}

###########################
# AWS Infrastructure
###########################

data "aws_route53_zone" "zone" {
  name         = var.parent_domain
  private_zone = false
}

module "acm" {
  source    = "terraform-aws-modules/acm/aws"
  version   = "6.1.0"
  providers = { aws = aws.us_east_1 }

  domain_name            = var.app_domain
  validation_method      = "DNS"
  create_route53_records = true
  zone_id                = data.aws_route53_zone.zone.zone_id
  tags                   = local.default_tags
}

module "fn" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "8.1.0"

  function_name = local.stack_name
  description   = "Next.js on Lambda via AWS Lambda Web Adapter"
  runtime       = var.lambda_runtime
  handler       = var.lambda_handler
  architectures = [var.lambda_architecture]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  publish       = true

  # use pre-built artifact supplied by CI
  create_package         = false
  local_existing_package = var.package_path
  layers                 = compact([var.lwa_layer_arn])

  environment_variables = merge(
    var.lambda_environment,
    {
      AWS_LAMBDA_EXEC_WRAPPER    = "/opt/bootstrap"
      AWS_LWA_ASYNC_INIT         = "true"
      AWS_LWA_ENABLE_COMPRESSION = "true"
      NODE_ENV                   = "production"
      PORT                       = "3000"
      DATABASE_URL               = local.database_url
      BETTER_AUTH_SECRET         = var.better_auth_secret
    }
  )

  create_lambda_function_url        = true
  authorization_type                = "NONE"
  cloudwatch_logs_retention_in_days = var.lambda_log_retention_days
  tags                              = local.default_tags
}

locals {
  lambda_origin_domain = replace(replace(module.fn.lambda_function_url, "https://", ""), "/", "")
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${local.stack_name}-oac"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = [var.app_domain]
  price_class     = var.cloudfront_price_class

  origin {
    domain_name              = local.lambda_origin_domain
    origin_id                = "lambda-url"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 443
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id         = "lambda-url"
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  ordered_cache_behavior {
    path_pattern             = "/_next/static/*"
    target_origin_id         = "lambda-url"
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = module.acm.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.default_tags

  depends_on = [module.acm]
}

resource "aws_lambda_permission" "allow_cloudfront" {
  statement_id           = "AllowCloudFrontInvokeFunctionURL"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = module.fn.lambda_function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.cdn.arn
  function_url_auth_type = "NONE"
}

resource "aws_route53_record" "app_a" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.app_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "app_aaaa" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.app_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
