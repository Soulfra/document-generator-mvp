# Deployment Overview

## Deployment Philosophy

- **Local First**: Everything works on your laptop
- **Container Ready**: Docker images for consistency
- **Cloud Agnostic**: Deploy anywhere (Railway, Vercel, AWS)
- **Zero Downtime**: Blue-green deployments
- **Auto-scaling**: Handle growth automatically

## Quick Start Deployment

### Option 1: One-Click Deploy (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/finishthisidea/finishthisidea)

This will:
1. Create all required services
2. Set up environment variables
3. Deploy the application
4. Give you a URL in ~3 minutes

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/finishthisidea/finishthisidea.git
cd finishthisidea

# Copy environment variables
cp .env.example .env

# Start everything with Docker
docker-compose up -d

# Access at http://localhost:3000
```

## Deployment Environments

### Development
- **Purpose**: Local development and testing
- **Services**: All in Docker Compose
- **Data**: Local PostgreSQL and Redis
- **Cost**: $0 (runs on your machine)

### Staging  
- **Purpose**: Test before production
- **Services**: Same as production
- **Data**: Separate database
- **Cost**: ~$20/month

### Production
- **Purpose**: Live customer traffic
- **Services**: Distributed across regions
- **Data**: Managed databases with backups
- **Cost**: ~$100-500/month (scales with usage)

## Service Requirements

### Minimum Requirements
```yaml
API Server:
  CPU: 1 vCPU
  RAM: 512MB
  Disk: 10GB

Worker Nodes:
  CPU: 2 vCPU
  RAM: 2GB
  Disk: 20GB

Database:
  PostgreSQL: 11+
  Storage: 10GB+
  Connections: 100+

Cache:
  Redis: 6+
  RAM: 512MB
```

### Recommended Production
```yaml
API Servers: 2-4 instances
Workers: 3-10 instances
Database: Managed PostgreSQL with replica
Cache: Managed Redis cluster
Storage: S3 or compatible
CDN: Cloudflare
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Monitoring alerts set up
- [ ] Backup system tested

### Deployment Steps
1. **Build images**: `docker build -t finishthisidea .`
2. **Run migrations**: `npm run db:migrate`
3. **Deploy API**: Update API servers
4. **Deploy workers**: Update job processors
5. **Verify health**: Check `/health` endpoints
6. **Enable traffic**: Update load balancer
7. **Monitor**: Watch metrics for 30 minutes

### Post-deployment
- [ ] Verify all services healthy
- [ ] Test critical user flows
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Update status page
- [ ] Notify team

## Infrastructure as Code

### Terraform Configuration
```hcl
resource "aws_ecs_service" "api" {
  name            = "finishthisidea-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_count

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
}
```

### Kubernetes Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finishthisidea-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: finishthisidea/api:latest
        ports:
        - containerPort: 3001
```

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis  
REDIS_URL=redis://host:6379

# Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=finishthisidea-uploads
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Providers (at least one required)
OLLAMA_URL=http://ollama:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional Variables
```bash
# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Analytics
PLAUSIBLE_DOMAIN=finishthisidea.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG...

# Feature Flags
ENABLE_SWAGGER_UI=true
ENABLE_BULL_DASHBOARD=true
```

## Platform-Specific Guides

### [Railway Deployment](railway-deployment.md)
Best for: Quick start, automatic scaling, built-in databases

### [Docker Deployment](docker-deployment.md)  
Best for: Any VPS, full control, cost optimization

### [AWS Deployment](aws-deployment.md)
Best for: Enterprise scale, global distribution, compliance

### [Vercel Deployment](vercel-deployment.md)
Best for: Frontend only, serverless functions, edge network

## Monitoring Setup

### Health Checks
```http
GET /health
GET /api/health
GET /admin/health
```

### Key Metrics
- Request rate
- Error rate  
- Response time (p50, p95, p99)
- Queue depth
- Worker utilization
- Database connections
- Cache hit rate

### Alerts
```yaml
Critical:
  - API down for 2 minutes
  - Error rate > 5%
  - Queue depth > 1000
  - Disk usage > 90%

Warning:
  - Response time > 1s
  - Error rate > 2%  
  - Queue depth > 500
  - Disk usage > 80%
```

## Security Hardening

### Network Security
- Use VPC with private subnets
- API servers in public subnet
- Database/Redis in private subnet
- Security groups restrict access

### Application Security
- Enable rate limiting
- Use API keys for access
- Implement CORS properly
- Keep dependencies updated
- Run security scans

### Data Security
- Encrypt data at rest
- Use SSL/TLS everywhere
- Rotate credentials regularly
- Implement proper backups

## Backup & Recovery

### Backup Schedule
- **Database**: Every 6 hours
- **File storage**: Real-time sync
- **Configuration**: Git repository
- **Secrets**: Secure vault

### Recovery Procedures
1. **Data corruption**: Restore from backup
2. **Service failure**: Auto-restart or scale
3. **Region failure**: Failover to secondary
4. **Complete failure**: Rebuild from IaC

## Cost Optimization

### Tips to Reduce Costs
1. **Use Ollama**: 70% of requests free
2. **Cache aggressively**: Reduce API calls
3. **Auto-scale down**: During low traffic
4. **Use spot instances**: For workers
5. **Compress files**: Reduce storage
6. **Set TTLs**: Auto-delete old data

### Estimated Monthly Costs
- **Hobby**: $0-20 (local + free tier)
- **Startup**: $100-300 (small scale)
- **Growth**: $500-2000 (scaling up)
- **Enterprise**: $2000+ (high availability)

## Troubleshooting Deployment

### Common Issues

**"Database connection refused"**
- Check DATABASE_URL format
- Verify network connectivity
- Ensure database is running

**"Cannot connect to Redis"**
- Check REDIS_URL format
- Verify Redis is running
- Check firewall rules

**"S3 upload failed"**
- Verify credentials
- Check bucket permissions
- Ensure bucket exists

**"Stripe webhook failed"**
- Update webhook endpoint URL
- Verify webhook secret
- Check SSL certificate

## Next Steps

1. Choose your deployment platform
2. Set up environment variables  
3. Deploy using platform guide
4. Configure monitoring
5. Test with real data
6. Go live! 🚀

---

Need help? Check our [troubleshooting guide](../09-troubleshooting/) or [contact support](mailto:support@finishthisidea.com).