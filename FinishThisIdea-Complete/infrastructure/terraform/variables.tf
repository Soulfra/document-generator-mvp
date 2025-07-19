/**
 * FinishThisIdea Infrastructure Variables
 * Terraform variable definitions
 */

# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "finishthisidea"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
  default     = false
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access resources"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# EKS Configuration
variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "Configuration for EKS node groups"
  type = map(object({
    instance_types = list(string)
    scaling_config = object({
      desired_size = number
      min_size     = number
      max_size     = number
    })
    disk_size = number
    labels    = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    general = {
      instance_types = ["t3.medium"]
      scaling_config = {
        desired_size = 2
        min_size     = 1
        max_size     = 4
      }
      disk_size = 50
      labels = {
        role = "general"
      }
      taints = []
    }
  }
}

# RDS Configuration
variable "rds_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "finishthisidea"
}

variable "database_username" {
  description = "Master username for database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "database_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "Instance class for RDS"
  type        = string
  default     = "db.t4g.medium"
}

variable "rds_instance_count" {
  description = "Number of RDS instances"
  type        = number
  default     = 2
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

# Redis Configuration
variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  description = "Node type for Redis"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_node_count" {
  description = "Number of Redis nodes"
  type        = number
  default     = 1
}

variable "redis_parameter_group_family" {
  description = "Redis parameter group family"
  type        = string
  default     = "redis7"
}

# S3 Configuration
variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 90
}

# SSL/TLS Configuration
variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for ALB"
  type        = string
  default     = ""
}

variable "cloudfront_certificate_arn" {
  description = "ARN of SSL certificate for CloudFront (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "cloudfront_aliases" {
  description = "Aliases for CloudFront distribution"
  type        = list(string)
  default     = []
}

# DNS Configuration
variable "create_dns_zone" {
  description = "Create Route53 hosted zone"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
}

# Application Secrets
variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

# Performance Tier Configuration (from soulfra patterns)
variable "performance_tier" {
  description = "Performance tier for resource sizing"
  type        = string
  default     = "standard"
  validation {
    condition     = contains(["minimal", "standard", "performance", "enterprise"], var.performance_tier)
    error_message = "Performance tier must be minimal, standard, performance, or enterprise."
  }
}

# Resource sizing based on performance tier
locals {
  tier_configs = {
    minimal = {
      eks_instance_types    = ["t3.small"]
      eks_min_size         = 1
      eks_max_size         = 2
      rds_instance_class   = "db.t4g.micro"
      rds_instance_count   = 1
      redis_node_type      = "cache.t4g.micro"
      redis_node_count     = 1
    }
    standard = {
      eks_instance_types    = ["t3.medium"]
      eks_min_size         = 2
      eks_max_size         = 4
      rds_instance_class   = "db.t4g.medium"
      rds_instance_count   = 2
      redis_node_type      = "cache.t4g.small"
      redis_node_count     = 1
    }
    performance = {
      eks_instance_types    = ["t3.large", "t3.xlarge"]
      eks_min_size         = 3
      eks_max_size         = 10
      rds_instance_class   = "db.r6g.large"
      rds_instance_count   = 3
      redis_node_type      = "cache.r6g.large"
      redis_node_count     = 3
    }
    enterprise = {
      eks_instance_types    = ["m6i.xlarge", "m6i.2xlarge"]
      eks_min_size         = 5
      eks_max_size         = 20
      rds_instance_class   = "db.r6g.xlarge"
      rds_instance_count   = 5
      redis_node_type      = "cache.r6g.xlarge"
      redis_node_count     = 5
    }
  }
  
  selected_tier = local.tier_configs[var.performance_tier]
}