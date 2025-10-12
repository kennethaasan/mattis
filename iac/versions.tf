terraform {
  required_version = ">= 1.7.0"

  cloud {
    organization = "aasan_dev"

    workspaces {
      name = "mattis"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }

    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.9"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
