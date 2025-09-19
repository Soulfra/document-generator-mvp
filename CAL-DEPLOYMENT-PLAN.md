# CAL Integrated System - Production Deployment Plan

## 🚀 Deployment Overview

This plan outlines the steps to deploy the CAL Integrated System to production, including infrastructure setup, configuration, and monitoring.

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] **Server Requirements**
  - Minimum: 4 CPU cores, 8GB RAM, 100GB SSD
  - Recommended: 8 CPU cores, 16GB RAM, 500GB SSD
  - OS: Ubuntu 20.04 LTS or similar

- [ ] **Domain & SSL**
  - Domain registered (e.g., cal-system.io)
  - SSL certificates obtained (Let's Encrypt recommended)
  - DNS configured for subdomains

- [ ] **Database Setup**
  - PostgreSQL 13+ installed
  - Redis 6+ for caching
  - Backup strategy configured

- [ ] **Container Runtime**
  - Docker 20.10+ installed
  - Docker Compose 1.29+ installed
  - Container registry access configured

## 🏗️ Architecture Overview

```
                          ┌─────────────────┐
                          │  Load Balancer  │
                          │   (Nginx/HAProxy)│
                          └────────┬─────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐        ┌───────▼────────┐        ┌───────▼────────┐
│  Web Server 1  │        │  Web Server 2  │        │  Web Server 3  │
│  Port: 7890    │        │  Port: 7891    │        │  Port: 7892    │
└───────┬────────┘        └───────┬────────┘        └───────┬────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                          ┌────────▼─────────┐
                          │   Shared Cache   │
                          │     (Redis)      │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │    Database      │
                          │  (PostgreSQL)    │
                          └──────────────────┘
```

## 🔧 Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nodejs npm git nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/cal-system/integrated.git /opt/cal-system
cd /opt/cal-system

# Install dependencies
npm install --production

# Create environment file
cp .env.production.example .env
```

### 3. Environment Configuration

Edit `.env` file:
```bash
# Production Environment Variables
NODE_ENV=production
PORT=7890

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cal_system
REDIS_URL=redis://localhost:6379

# Services
CAPSULE_SYSTEM_URL=http://localhost:4900
OBSIDIAN_VAULT_PATH=/opt/cal-system/vault
PHP_FORUM_URL=http://localhost:7777
CAL_SECURE_OS_URL=http://localhost:8890

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# External APIs (if using)
ANTHROPIC_API_KEY=your-api-key
OPENAI_API_KEY=your-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 4. Database Setup

```bash
# Create database
sudo -u postgres createdb cal_system
sudo -u postgres createuser cal_user -P

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cal_system TO cal_user;"

# Run migrations
npm run migrate:production
```

### 5. Docker Compose Configuration

Create `docker-compose.production.yml`:
```yaml
version: '3.8'

services:
  cal-search:
    build: .
    ports:
      - "7890-7892:7890"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    
  capsule-system:
    image: cal-system/capsule:latest
    ports:
      - "4900:4900"
    volumes:
      - capsule-data:/data
    
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: cal_system
      POSTGRES_USER: cal_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  capsule-data:
  redis-data:
  postgres-data:
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/cal-system`:
```nginx
upstream cal_backend {
    least_conn;
    server 127.0.0.1:7890;
    server 127.0.0.1:7891;
    server 127.0.0.1:7892;
}

server {
    listen 80;
    server_name cal-system.io www.cal-system.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cal-system.io www.cal-system.io;
    
    ssl_certificate /etc/letsencrypt/live/cal-system.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cal-system.io/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    location / {
        proxy_pass http://cal_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ws {
        proxy_pass http://cal_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/cal-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Setup

```bash
# Obtain SSL certificate
sudo certbot --nginx -d cal-system.io -d www.cal-system.io

# Auto-renewal
sudo certbot renew --dry-run
```

### 8. PM2 Process Management

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'cal-search',
    script: './cal-integrated-search.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 7890
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }, {
    name: 'cal-capsule-bridge',
    script: './cal-context-capsule-bridge.js',
    instances: 1,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 9. Monitoring Setup

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cal-integrated'
    static_configs:
      - targets: ['localhost:7890', 'localhost:7891', 'localhost:7892']
    metrics_path: '/metrics'
```

#### Grafana Dashboard
Import dashboard from `monitoring/grafana-dashboard.json`

#### Health Check Script
```bash
#!/bin/bash
# health-check.sh

# Check main service
if ! curl -f http://localhost:7890/api/health; then
    echo "Health check failed"
    pm2 restart cal-search
fi

# Check capsule system
if ! curl -f http://localhost:4900/api/health; then
    echo "Capsule system unhealthy"
    docker-compose restart capsule-system
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/cal-system/scripts/health-check.sh
```

### 10. Backup Strategy

Create backup script:
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/cal-system"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump cal_system > $BACKUP_DIR/db_$DATE.sql

# Backup capsules
tar -czf $BACKUP_DIR/capsules_$DATE.tar.gz /opt/cal-system/data/capsules

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/cal-system/.env /opt/cal-system/config

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/cal-system/scripts/backup.sh
```

## 🔒 Security Hardening

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Application Security
```javascript
// Add rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📊 Performance Optimization

### 1. Enable Clustering
Already configured in PM2 ecosystem file

### 2. Cache Configuration
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});
```

### 3. Database Indexing
```sql
-- Add indexes for common queries
CREATE INDEX idx_capsules_timestamp ON capsules(timestamp);
CREATE INDEX idx_search_query ON search_history(query);
CREATE INDEX idx_todos_file ON todos(file_path);
```

## 🚨 Rollback Plan

### Quick Rollback
```bash
# Revert to previous version
pm2 stop all
git checkout previous-version-tag
npm install
pm2 restart all
```

### Database Rollback
```bash
# Restore from backup
psql cal_system < /backups/cal-system/db_20250827_020000.sql
```

## 📈 Post-Deployment Verification

### 1. Functional Tests
```bash
# Run smoke tests
npm run test:smoke

# Check all endpoints
curl https://cal-system.io/api/health
curl https://cal-system.io/api/status
```

### 2. Performance Tests
```bash
# Load test with Artillery
artillery run tests/load/production-load-test.yml
```

### 3. Security Scan
```bash
# Run security audit
npm audit
docker scan cal-system/integrated:latest
```

## 🎯 Success Criteria

- [ ] All health checks passing
- [ ] Response time < 500ms for 95% of requests
- [ reasonable error rate < 0.1%
- [ ] All monitoring dashboards showing green
- [ ] Backup verification successful
- [ ] Security scan shows no critical issues

## 📞 Support Contacts

- **DevOps Lead**: devops@cal-system.io
- **On-Call**: +1-xxx-xxx-xxxx
- **Escalation**: escalation@cal-system.io

## 📝 Deployment Log

| Date | Version | Deployer | Status | Notes |
|------|---------|----------|--------|-------|
| 2025-08-27 | 1.0.0 | System | Planned | Initial deployment |

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-27  
**Next Review**: 2025-09-27