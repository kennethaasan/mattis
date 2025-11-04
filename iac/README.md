# Mattis Terraform Infrastructure

This directory contains the Terraform configuration that provisions the Mattis production stack using AWS and Neon. It targets free-tier friendly services that are geographically close to Norway and stores state in Terraform Cloud.

## What gets created

- Neon project, branch, database, and role in the `aws-eu-central-1` region with 7 days of PITR retention.
- AWS Lambda (ZIP runtime) using the [`terraform-aws-modules/lambda/aws`](https://registry.terraform.io/modules/terraform-aws-modules/lambda/aws/latest) module. The function runs the standalone Next.js server behind the AWS Lambda Web Adapter layer and exposes a Function URL that CloudFront calls with SigV4.
- An ACM certificate in `us-east-1` using [`terraform-aws-modules/acm/aws`](https://registry.terraform.io/modules/terraform-aws-modules/acm/aws/latest) and DNS validation records in Route53 for the `mattis.aws.aasan.dev` domain.
- A CloudFront distribution with Origin Access Control (OAC) secured to the Lambda Function URL and Route53 alias records for IPv4/IPv6.

## Required variables

The configuration expects the following values (see `variables.tf` for defaults):

| Variable        | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| `neon_api_key`  | Neon API key with permissions to manage projects.                          |
| `aws_region`    | Region for Lambda (defaults to `eu-north-1`).                              |
| `parent_domain` | Public Route53 hosted zone (defaults to `aws.aasan.dev`).                  |
| `app_domain`    | Application domain (defaults to `mattis.aws.aasan.dev`).                   |
| `lwa_layer_arn` | AWS Lambda Web Adapter layer ARN (defaults to the eu-north-1 Arm64 layer). |

Other settings—such as Lambda runtime parameters, CloudFront pricing tier, and resource tagging—can be overridden as needed.

## Usage

1. Build the standalone Next.js output and package the Lambda artifact: `npm run build:lambda`. The resulting ZIP lives at `build/function.zip`. On Windows, set the `ZIP_PATH` environment variable to the absolute path of the `zip` executable before running the script.
2. Authenticate with Terraform Cloud (`terraform login`) and ensure the `mattis` workspace exists in the `aasan_dev` organisation.
3. Run `terraform init` from the `iac` directory. Terraform will use the remote backend configured in [`versions.tf`](./versions.tf).
4. Apply the configuration: `TF_VAR_neon_api_key=... terraform apply`. Override `TF_VAR_lwa_layer_arn` if you deploy outside `eu-north-1`.
5. Use the CloudFront domain or Route53 record for application traffic, and run `npm run db:migrate` with the generated `database_url` output.

> **Note**: If you use a different Terraform Cloud organisation or workspace, update [`versions.tf`](./versions.tf) accordingly.
