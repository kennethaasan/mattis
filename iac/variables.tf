variable "environment" {
  description = "Deployment environment identifier"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name used for tagging"
  type        = string
  default     = "mattis"
}

variable "aws_region" {
  description = "AWS region to deploy Lambda and supporting services"
  type        = string
  default     = "eu-north-1"
}

variable "parent_domain" {
  description = "Base Route53 hosted zone domain name"
  type        = string
  default     = "aasan.dev"
}

variable "app_domain" {
  description = "Fully qualified domain name for the application"
  type        = string
  default     = "mattis.aasan.dev"
}

variable "neon_api_key" {
  description = "Neon API key used by the Terraform provider"
  type        = string
  sensitive   = true
}

variable "neon_project_name" {
  description = "Name for the Neon project"
  type        = string
  default     = "mattis"
}

variable "neon_region" {
  description = "Neon region identifier close to Norway"
  type        = string
  default     = "aws-eu-central-1"
}

variable "neon_pg_version" {
  description = "PostgreSQL version for Neon"
  type        = number
  default     = 16
}

variable "neon_retention_days" {
  description = "Point-in-time backup retention in days (free tier maximum is 7 days)"
  type        = number
  default     = 7
}

variable "lambda_source_dir" {
  description = "Path to the compiled OpenNext server function"
  type        = string
  default     = "../.open-next/server-function"
}

variable "lambda_runtime" {
  description = "Runtime for the Lambda function"
  type        = string
  default     = "nodejs22.x"
}

variable "lambda_handler" {
  description = "Handler for the Lambda function"
  type        = string
  default     = "index.handler"
}

variable "lambda_memory_size" {
  description = "Memory size for the Lambda function"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_layers" {
  description = "Additional Lambda layers to attach"
  type        = list(string)
  default     = []
}

variable "lambda_architecture" {
  description = "Lambda architecture"
  type        = string
  default     = "arm64"
}

variable "lambda_publish" {
  description = "Whether to publish a new version on each deployment"
  type        = bool
  default     = true
}

variable "lambda_description" {
  description = "Optional description for the Lambda function"
  type        = string
  default     = null
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention in days for the Lambda function"
  type        = number
  default     = 14
}

variable "lambda_environment" {
  description = "Base environment variables for the Lambda function"
  type        = map(string)
  default = {
    NODE_ENV = "production"
  }
}

variable "cloudfront_comment" {
  description = "Optional comment for the CloudFront distribution"
  type        = string
  default     = null
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "tags" {
  description = "Additional resource tags"
  type        = map(string)
  default     = {}
}
