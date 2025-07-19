# FinishThisIdea Infrastructure as Code

This directory contains Terraform configurations for deploying the FinishThisIdea platform on AWS. The infrastructure is designed based on proven patterns from soulfra-agentzero, providing a scalable, secure, and production-ready environment.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ network with public and private subnets
- **EKS**: Kubernetes cluster for container orchestration
- **RDS Aurora**: PostgreSQL database cluster
- **ElastiCache**: Redis cluster for caching and queues
- **S3**: Object storage for assets and backups
- **ALB**: Application Load Balancer
- **CloudFront**: CDN for global content delivery
- **KMS**: Encryption key management
- **Secrets Manager**: Secure secrets storage
- **CloudWatch**: Monitoring and alerting

## Performance Tiers

The infrastructure supports multiple performance tiers:

| Tier | Use Case | EKS Nodes | RDS Instances | Redis Nodes |
|------|----------|-----------|---------------|-------------|
| Minimal | Development/Testing | 1-2 t3.small | 1 db.t4g.micro | 1 cache.t4g.micro |
| Standard | Small Production | 2-4 t3.medium | 2 db.t4g.medium | 1 cache.t4g.small |
| Performance | Medium Production | 3-10 t3.large | 3 db.r6g.large | 3 cache.r6g.large |
| Enterprise | Large Production | 5-20 m6i.xlarge | 5 db.r6g.xlarge | 5 cache.r6g.xlarge |

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0
3. **AWS CLI** configured with credentials
4. **kubectl** for Kubernetes management
5. **Domain name** (optional) for custom domain setup

## Quick Start

1. **Clone and navigate to the infrastructure directory:**
   ```bash
   cd infrastructure/terraform
   ```

2. **Create S3 bucket for Terraform state:**
   ```bash
   aws s3 mb s3://finishthisidea-terraform-state --region us-east-1
   aws dynamodb create-table \
     --table-name finishthisidea-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
     --region us-east-1
   ```

3. **Copy and configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Initialize Terraform:**
   ```bash
   terraform init
   ```

5. **Plan the deployment:**
   ```bash
   terraform plan
   ```

6. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Module Structure

```
terraform/
├── main.tf                 # Main configuration
├── variables.tf           # Variable definitions
├── terraform.tfvars.example # Example variables
└── modules/
    ├── vpc/              # Network infrastructure
    ├── security-groups/  # Security group rules
    ├── eks/              # Kubernetes cluster
    ├── rds/              # Database cluster
    ├── elasticache/      # Redis cluster
    ├── s3/               # Object storage
    ├── alb/              # Load balancer
    ├── cloudfront/       # CDN
    ├── kms/              # Encryption keys
    ├── secrets-manager/  # Secrets storage
    ├── iam/              # IAM roles and policies
    ├── route53/          # DNS management
    ├── monitoring/       # CloudWatch alarms
    └── backup/           # AWS Backup configuration
```

## Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `environment` | Environment name | `production` |
| `database_password` | RDS master password | `SecurePassword123!` |
| `anthropic_api_key` | Anthropic API key | `sk-ant-api03-...` |
| `stripe_secret_key` | Stripe secret key | `sk_test_...` |
| `jwt_secret` | JWT signing secret | `32+ character secret` |
| `alarm_email` | Email for alerts | `alerts@example.com` |

### Optional Configuration

- **Custom Domain**: Set `create_dns_zone = true` and provide `domain_name`
- **SSL Certificates**: Provide ACM certificate ARNs
- **Performance Tier**: Set `performance_tier` to adjust resource sizing

## Deployment Environments

### Development
```hcl
environment = "development"
performance_tier = "minimal"
```

### Staging
```hcl
environment = "staging"
performance_tier = "standard"
```

### Production
```hcl
environment = "production"
performance_tier = "performance"  # or "enterprise"
```

## Post-Deployment Steps

1. **Configure kubectl:**
   ```bash
   aws eks update-kubeconfig --name finishthisidea-production-cluster --region us-east-1
   ```

2. **Deploy application:**
   ```bash
   kubectl apply -f ../../k8s/
   ```

3. **Verify services:**
   ```bash
   kubectl get pods -A
   kubectl get services
   ```

4. **Access application:**
   - ALB URL: Check Terraform output `alb_dns_name`
   - CloudFront URL: Check Terraform output `cloudfront_domain_name`

## Monitoring and Maintenance

### CloudWatch Dashboards
- Automatically created for RDS, Redis, ALB, and EKS
- Access via AWS Console > CloudWatch > Dashboards

### Alarms
- CPU, memory, and connection alerts
- Email notifications to configured address
- Slack/PagerDuty integration available

### Backups
- RDS: Daily automated backups (30-day retention)
- S3: Versioning enabled, lifecycle policies configured
- EKS: Persistent volume snapshots

## Cost Optimization

1. **Use appropriate performance tier** for your workload
2. **Enable auto-scaling** for EKS nodes
3. **Use reserved instances** for predictable workloads
4. **Configure S3 lifecycle policies** for old data
5. **Monitor unused resources** with AWS Cost Explorer

## Security Best Practices

1. **Secrets Management**:
   - All secrets stored in AWS Secrets Manager
   - Automatic rotation enabled
   - KMS encryption at rest

2. **Network Security**:
   - Private subnets for databases and cache
   - Security groups with least privilege
   - VPC flow logs enabled

3. **Access Control**:
   - IAM roles for service accounts
   - RBAC for Kubernetes
   - MFA for AWS console access

## Troubleshooting

### Common Issues

1. **Terraform state lock**:
   ```bash
   terraform force-unlock <LOCK_ID>
   ```

2. **EKS authentication**:
   ```bash
   aws eks get-token --cluster-name finishthisidea-production-cluster
   ```

3. **RDS connection issues**:
   - Check security groups
   - Verify subnet routing
   - Check database credentials in Secrets Manager

### Useful Commands

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show module.eks.aws_eks_cluster.main

# Import existing resource
terraform import module.s3.aws_s3_bucket.main existing-bucket-name

# Destroy specific module
terraform destroy -target=module.redis
```

## Disaster Recovery

1. **RDS**: Point-in-time recovery available (up to 35 days)
2. **S3**: Cross-region replication can be enabled
3. **EKS**: Multi-AZ deployment, backup etcd regularly
4. **Terraform State**: Versioned in S3 with locking

## Contributing

1. Create feature branch
2. Test changes in development environment
3. Update documentation
4. Submit pull request

## Support

For issues or questions:
- Check CloudWatch logs
- Review Terraform output
- Contact DevOps team

## License

Copyright (c) 2024 FinishThisIdea. All rights reserved.