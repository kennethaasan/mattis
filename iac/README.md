# Mattis Terraform Infrastructure

This directory contains the Terraform configuration that provisions the Mattis production stack using AWS and Neon. It targets free-tier friendly services that are geographically close to Norway and stores state in Terraform Cloud.

## What gets created

- Neon project, branch, database, and role in the `aws-eu-central-1` region with 7 days of PITR retention.
- AWS resources deployed through the published [`nhs-england-tools/opennext/aws`](https://registry.terraform.io/modules/nhs-england-tools/opennext/aws/latest) module. The module packages the OpenNext server function for Lambda, provisions CloudFront, Route53, and an S3 bucket for static assets, and wires the database connection string into the runtime environment.
- Route53 validation records and an ACM certificate in `us-east-1` for the `mattis.aasan.dev` domain.

## Required variables

The configuration expects the following values (see `variables.tf` for defaults):

| Variable | Description |
| --- | --- |
| `neon_api_key` | Neon API key with permissions to manage projects. |
| `aws_region` | Region for Lambda (defaults to `eu-north-1`). |
| `parent_domain` | Public Route53 hosted zone (defaults to `aasan.dev`). |
| `app_domain` | Application domain (defaults to `mattis.aasan.dev`). |

Other settings—such as Lambda runtime parameters, CloudFront pricing tier, and resource tagging—can be overridden as needed.

## Usage

1. Build the application with OpenNext so that `.open-next/server-function` exists.
2. Authenticate with Terraform Cloud (`terraform login`) and ensure the `mattis` workspace exists in the `aasan_dev` organisation.
3. Run `terraform init` from the `iac` directory. Terraform will use the remote backend configured in [`versions.tf`](./versions.tf).
4. Apply the configuration: `TF_VAR_neon_api_key=... terraform apply`.
5. Sync `.open-next/assets` to the provisioned S3 bucket (`terraform output -raw assets_bucket_name`).
6. Use the CloudFront domain or Route53 record for application traffic, and run `npm run db:migrate` with the generated `database_url` output.

> **Note**: If you use a different Terraform Cloud organisation or workspace, update [`versions.tf`](./versions.tf) accordingly.

