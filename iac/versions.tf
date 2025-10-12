terraform {
  required_version = ">= 1.13.0"

  cloud {
    organization = "aasan_dev"

    workspaces {
      name = "mattis"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.74"
    }

    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.11"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
