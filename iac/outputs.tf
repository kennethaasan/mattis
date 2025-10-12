output "lambda_function_name" {
  description = "Name of the deployed Lambda function"
  value       = module.opennext.lambda_function_name
}

output "lambda_function_url" {
  description = "Public URL for the Lambda function"
  value       = module.opennext.lambda_function_url
}

output "app_domain" {
  description = "Application domain name"
  value       = module.opennext.route53_record_fqdn
}

output "cdn_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.opennext.cloudfront_domain_name
}

output "assets_bucket_name" {
  description = "S3 bucket that stores Next.js static assets"
  value       = module.opennext.assets_bucket_name
}

output "database_url" {
  description = "PostgreSQL connection string for the Neon database"
  value       = data.neon_connection_uri.app.uri
  sensitive   = true
}
