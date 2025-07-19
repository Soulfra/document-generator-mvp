/**
 * FinishThisIdea Complete Infrastructure
 * Main Terraform configuration for AWS deployment
 * Adapted from soulfra-agentzero patterns
 */

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  backend "s3" {
    bucket = "finishthisidea-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "finishthisidea-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "FinishThisIdea"
      ManagedBy   = "Terraform"
      CostCenter  = var.cost_center
    }
  }
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = "FinishThisIdea"
    CreatedAt   = timestamp()
  }
  
  name_prefix = "${var.project_name}-${var.environment}"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix          = local.name_prefix
  cidr_block          = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  single_nat_gateway   = var.environment != "production"
  enable_vpn_gateway   = var.enable_vpn_gateway
  
  tags = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  
  allowed_cidr_blocks = var.allowed_cidr_blocks
  
  tags = local.common_tags
}

# EKS Cluster Module
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "${local.name_prefix}-cluster"
  cluster_version = var.eks_cluster_version
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  
  node_groups = var.eks_node_groups
  
  enable_cluster_autoscaler = true
  enable_metrics_server     = true
  enable_aws_load_balancer_controller = true
  
  tags = local.common_tags
}

# RDS Aurora PostgreSQL Module
module "rds" {
  source = "./modules/rds"
  
  cluster_identifier = "${local.name_prefix}-db"
  engine_version     = var.rds_engine_version
  
  database_name   = var.database_name
  master_username = var.database_username
  master_password = var.database_password
  
  vpc_id               = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_security_groups = [module.security_groups.rds_security_group_id]
  
  instance_class = var.rds_instance_class
  instance_count = var.rds_instance_count
  
  backup_retention_period = var.backup_retention_days
  preferred_backup_window = var.backup_window
  
  enable_performance_insights = var.environment == "production"
  
  tags = local.common_tags
}

# ElastiCache Redis Module
module "redis" {
  source = "./modules/elasticache"
  
  cluster_id           = "${local.name_prefix}-redis"
  engine_version       = var.redis_engine_version
  node_type           = var.redis_node_type
  number_cache_nodes  = var.redis_node_count
  
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_security_groups = [module.security_groups.redis_security_group_id]
  
  parameter_group_family = var.redis_parameter_group_family
  
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
  
  tags = local.common_tags
}

# S3 Buckets Module
module "s3" {
  source = "./modules/s3"
  
  name_prefix = local.name_prefix
  
  buckets = {
    assets = {
      versioning = true
      lifecycle_rules = [{
        id      = "expire-old-versions"
        status  = "Enabled"
        expiration = {
          days = 90
        }
      }]
    }
    backups = {
      versioning = true
      lifecycle_rules = [{
        id      = "transition-to-glacier"
        status  = "Enabled"
        transition = [{
          days          = 30
          storage_class = "GLACIER"
        }]
      }]
    }
    logs = {
      lifecycle_rules = [{
        id      = "expire-logs"
        status  = "Enabled"
        expiration = {
          days = var.log_retention_days
        }
      }]
    }
  }
  
  tags = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"
  
  name_prefix = local.name_prefix
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.public_subnet_ids
  security_groups = [module.security_groups.alb_security_group_id]
  
  certificate_arn = var.ssl_certificate_arn
  
  enable_deletion_protection = var.environment == "production"
  enable_http2              = true
  
  access_logs_bucket = module.s3.bucket_ids["logs"]
  
  tags = local.common_tags
}

# CloudFront CDN Module
module "cloudfront" {
  source = "./modules/cloudfront"
  
  name_prefix = local.name_prefix
  
  origin_domain_name = module.alb.dns_name
  s3_bucket_domain   = module.s3.bucket_regional_domain_names["assets"]
  
  aliases         = var.cloudfront_aliases
  certificate_arn = var.cloudfront_certificate_arn
  
  price_class = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"
  
  tags = local.common_tags
}

# KMS Encryption Keys Module
module "kms" {
  source = "./modules/kms"
  
  name_prefix = local.name_prefix
  
  key_aliases = {
    rds    = "rds-encryption"
    s3     = "s3-encryption"
    secrets = "secrets-manager"
  }
  
  tags = local.common_tags
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets-manager"
  
  name_prefix = local.name_prefix
  kms_key_id  = module.kms.key_ids["secrets"]
  
  secrets = {
    database_url = {
      description = "Database connection string"
      secret_string = jsonencode({
        url = "postgresql://${var.database_username}:${var.database_password}@${module.rds.endpoint}/${var.database_name}"
      })
    }
    redis_url = {
      description = "Redis connection string"
      secret_string = jsonencode({
        url = "redis://${module.redis.primary_endpoint}"
      })
    }
    api_keys = {
      description = "API keys and secrets"
      secret_string = jsonencode({
        anthropic_api_key = var.anthropic_api_key
        stripe_secret_key = var.stripe_secret_key
        jwt_secret       = var.jwt_secret
      })
    }
  }
  
  tags = local.common_tags
}

# IAM Roles and Policies Module
module "iam" {
  source = "./modules/iam"
  
  name_prefix = local.name_prefix
  
  eks_cluster_name = module.eks.cluster_name
  s3_bucket_arns   = values(module.s3.bucket_arns)
  kms_key_arns     = values(module.kms.key_arns)
  
  tags = local.common_tags
}

# Route53 DNS Module (optional)
module "route53" {
  count = var.create_dns_zone ? 1 : 0
  
  source = "./modules/route53"
  
  domain_name = var.domain_name
  
  records = {
    "www" = {
      type = "CNAME"
      ttl  = 300
      records = [module.cloudfront.domain_name]
    }
    "api" = {
      type = "CNAME"
      ttl  = 300
      records = [module.alb.dns_name]
    }
  }
  
  tags = local.common_tags
}

# Monitoring and Alerting Module
module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix = local.name_prefix
  
  alarm_email = var.alarm_email
  
  # RDS Alarms
  rds_cluster_id = module.rds.cluster_id
  rds_high_cpu_threshold = 80
  rds_high_connections_threshold = 80
  
  # Redis Alarms
  redis_cluster_id = module.redis.cluster_id
  redis_high_cpu_threshold = 75
  redis_high_memory_threshold = 80
  
  # ALB Alarms
  alb_arn_suffix = module.alb.arn_suffix
  alb_target_response_time_threshold = 1.0
  alb_unhealthy_host_count_threshold = 1
  
  tags = local.common_tags
}

# Backup Module
module "backup" {
  source = "./modules/backup"
  
  name_prefix = local.name_prefix
  
  backup_vault_name = "${local.name_prefix}-vault"
  
  # Resources to backup
  resources = {
    rds = {
      arn = module.rds.cluster_arn
      schedule = "cron(0 3 * * ? *)" # Daily at 3 AM
      retention_days = var.backup_retention_days
    }
  }
  
  tags = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.primary_endpoint
  sensitive   = true
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "s3_bucket_names" {
  description = "Names of the S3 buckets"
  value       = module.s3.bucket_ids
}