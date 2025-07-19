# FinishThisIdea-Complete Deployment Guide 🚀

This guide covers production deployment options for FinishThisIdea-Complete.

## 🎯 Deployment Options

### 1. Docker Compose (Recommended)
- **Best for**: Single server deployments, development, small to medium scale
- **Pros**: Simple setup, all services included, easy to manage
- **Cons**: Single point of failure, limited scalability

### 2. Kubernetes
- **Best for**: Large scale, high availability, enterprise deployments
- **Pros**: Auto-scaling, high availability, robust orchestration
- **Cons**: Complex setup, requires Kubernetes knowledge

### 3. Cloud Services
- **Best for**: Managed infrastructure, quick deployment
- **Pros**: Managed databases, auto-scaling, global CDN
- **Cons**: Vendor lock-in, potential higher costs

## 🐳 Docker Compose Deployment

### Prerequisites
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose git

# CentOS/RHEL
sudo yum install docker docker-compose git
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### 1. Clone and Configure
```bash
# Clone repository
git clone https://github.com/yourusername/finishthisidea-complete.git
cd finishthisidea-complete

# Create production environment file
cp .env.example .env.production
```

### 2. Configure Environment Variables
Edit `.env.production`:
```bash
# ============================================================================
# 🌍 PRODUCTION ENVIRONMENT
# ============================================================================
NODE_ENV=production
PORT=3000

# ============================================================================
# 🗄️ DATABASE (Use managed database in production)
# ============================================================================
DATABASE_URL=postgresql://user:password@your-db-host:5432/finishthisidea

# ============================================================================
# 🔄 REDIS (Use managed Redis in production)
# ============================================================================
REDIS_URL=redis://your-redis-host:6379

# ============================================================================
# 🪣 STORAGE
# ============================================================================
# Use AWS S3 or similar in production
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=finishthisidea-prod
S3_REGION=us-east-1

# ============================================================================
# 🤖 AI PROVIDERS
# ============================================================================
ANTHROPIC_API_KEY=sk-ant-api03-your-production-key
OPENAI_API_KEY=sk-your-production-openai-key
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/

# ============================================================================
# 🔐 SECURITY
# ============================================================================
INTERNAL_API_KEY=fti_internal_$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)

# ============================================================================
# 💳 STRIPE (PRODUCTION KEYS)
# ============================================================================
STRIPE_SECRET_KEY=sk_live_your-live-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-live-webhook-secret

# ============================================================================
# 🌐 DOMAIN & SSL
# ============================================================================
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
ENABLE_HTTPS=true

# ============================================================================
# 📊 MONITORING
# ============================================================================
GRAFANA_PASSWORD=$(openssl rand -base64 32)
```

### 3. Create Production Docker Compose
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  # Main Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: finishthisidea-app-prod
    restart: unless-stopped
    env_file: .env.production
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - redis
    networks:
      - finishthisidea-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  # AI API Service
  ai-api:
    build:
      context: .
      dockerfile: Dockerfile.ai-api
    container_name: finishthisidea-ai-api-prod
    restart: unless-stopped
    env_file: .env.production
    ports:
      - "3001:3001"
    depends_on:
      - redis
    networks:
      - finishthisidea-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  # Analytics Service
  analytics:
    build:
      context: .
      dockerfile: Dockerfile.analytics
    container_name: finishthisidea-analytics-prod
    restart: unless-stopped
    env_file: .env.production
    ports:
      - "3002:3002"
    depends_on:
      - redis
    networks:
      - finishthisidea-network

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: finishthisidea-redis-prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks:
      - finishthisidea-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: finishthisidea-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
      - ai-api
      - analytics
    networks:
      - finishthisidea-network

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: finishthisidea-prometheus-prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - finishthisidea-network

  grafana:
    image: grafana/grafana:latest
    container_name: finishthisidea-grafana-prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:3003:3000"
    env_file: .env.production
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    networks:
      - finishthisidea-network

volumes:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  finishthisidea-network:
    driver: bridge
```

### 4. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Create nginx SSL config
mkdir -p nginx
```

Create `nginx/nginx.prod.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    upstream ai-api {
        server ai-api:3001;
    }

    upstream analytics {
        server analytics:3002;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        location /ai/ {
            rewrite ^/ai/(.*)$ /$1 break;
            proxy_pass http://ai-api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            limit_req zone=api burst=20 nodelay;
        }

        location /analytics/ {
            rewrite ^/analytics/(.*)$ /$1 break;
            proxy_pass http://analytics;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 5. Deploy
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

## ☸️ Kubernetes Deployment

### Prerequisites
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 1. Create Kubernetes Manifests
Create `k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: finishthisidea
```

Create `k8s/configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: finishthisidea-config
  namespace: finishthisidea
data:
  NODE_ENV: "production"
  REDIS_URL: "redis://redis:6379"
  # Add other non-sensitive config
```

Create `k8s/secret.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: finishthisidea-secrets
  namespace: finishthisidea
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  ANTHROPIC_API_KEY: <base64-encoded-anthropic-key>
  STRIPE_SECRET_KEY: <base64-encoded-stripe-key>
  # Add other secrets (base64 encoded)
```

### 2. Deploy to Kubernetes
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n finishthisidea
kubectl get services -n finishthisidea

# Check logs
kubectl logs -f deployment/finishthisidea-app -n finishthisidea
```

## ☁️ Cloud Deployment

### AWS Deployment
```bash
# Install AWS CLI
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name finishthisidea-prod

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier finishthisidea-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-secure-password \
  --allocated-storage 20

# Deploy using AWS App Runner or ECS
```

### Google Cloud Deployment
```bash
# Install gcloud CLI
gcloud auth login

# Create Cloud Run services
gcloud run deploy finishthisidea-app \
  --image gcr.io/your-project/finishthisidea-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Create Cloud SQL instance
gcloud sql instances create finishthisidea-db \
  --tier=db-f1-micro \
  --region=us-central1
```

## 🔧 Production Optimizations

### 1. Database Optimization
```sql
-- PostgreSQL optimizations
ANALYZE;
REINDEX;

-- Add appropriate indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_job_status ON jobs(status);
CREATE INDEX idx_payment_user ON payments(user_id);
```

### 2. Redis Configuration
```bash
# Add to redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_types text/plain application/json application/javascript text/css;

client_max_body_size 50M;
client_body_timeout 60s;
client_header_timeout 60s;
```

## 📊 Monitoring Setup

### 1. Health Checks
```bash
# Add health check endpoints
curl https://yourdomain.com/api/health
curl https://api.yourdomain.com/health
```

### 2. Log Aggregation
```bash
# Install log aggregation (ELK Stack or similar)
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  elasticsearch:7.17.0

docker run -d --name kibana \
  -p 5601:5601 \
  --link elasticsearch:elasticsearch \
  kibana:7.17.0
```

### 3. Alerts
```yaml
# prometheus/alerts.yml
groups:
- name: finishthisidea
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High error rate detected
```

## 🔒 Security Checklist

### Production Security
- [ ] All secrets in environment variables
- [ ] SSL/TLS certificates configured
- [ ] Database encrypted at rest
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup
- [ ] Access logs enabled

### Network Security
- [ ] Firewall rules configured
- [ ] Database not publicly accessible
- [ ] Internal services not exposed
- [ ] VPN access for admin functions
- [ ] Regular security audits

## 🔄 Maintenance

### Regular Updates
```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Update dependencies
npm update
npm audit fix

# Database maintenance
docker-compose exec postgres pg_dump finishthisidea > backup.sql
```

### Backup Strategy
```bash
# Daily automated backups
0 2 * * * docker-compose exec postgres pg_dump finishthisidea | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Cleanup old backups (keep 30 days)
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

## 🆘 Troubleshooting

### Common Issues
1. **Container won't start**: Check logs with `docker-compose logs service-name`
2. **Database connection fails**: Verify DATABASE_URL and network connectivity
3. **High memory usage**: Monitor with `docker stats` and adjust resource limits
4. **SSL certificate issues**: Check certificate expiry and renewal process

### Performance Issues
1. **Slow API responses**: Check AI API service logs and model performance
2. **High CPU usage**: Monitor with Grafana dashboards
3. **Memory leaks**: Check Node.js heap dumps and restart services

---

**Need help?** Contact support or check the main README for troubleshooting guides.