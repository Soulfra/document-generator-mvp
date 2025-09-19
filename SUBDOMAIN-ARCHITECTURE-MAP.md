# Gaming Platform - Subdomain Architecture Map

**Version:** 1.0  
**Date:** 2025-01-15  
**Purpose:** Complete mapping of existing subdomains to microservices architecture  

## 🌐 Overview

This document maps your existing subdomain infrastructure to the Gaming Platform microservices architecture. You mentioned "we have all this subdomains and shit already done too" - this guide shows how everything connects.

## 🏗️ Subdomain to Service Mapping

### Primary Production Domains

```
Platform Core:
├── platform.com                    → Main web application (Frontend)
├── api.platform.com                → Kong API Gateway (Entry point)
├── auth.platform.com               → Authentication Service (Port 3001)
├── wallet.platform.com             → Wallet Service (Port 3003)
├── social.platform.com             → Social Service (Port 3004)
├── marketplace.platform.com        → Marketplace Service (Port 3005)
├── dev.platform.com                → Developer Service (Port 3006)
└── gaming.platform.com             → Gaming Service (Port 3002)
```

### Gaming Platform Integration Subdomains

```
Gaming Integrations:
├── steam.platform.com              → Steam API Proxy (Gaming Service)
├── riot.platform.com               → Riot Games API Proxy (Gaming Service)
├── battlenet.platform.com          → Battle.net API Proxy (Gaming Service)
├── epic.platform.com               → Epic Games API Proxy (Gaming Service)
├── jagex.platform.com              → RuneScape API Proxy (Gaming Service)
└── runelite.platform.com           → RuneLite Plugin System (Gaming Service)
```

### Specialized Service Subdomains

```
Infrastructure:
├── monitoring.platform.com         → Prometheus + Grafana Dashboard
├── admin.platform.com              → Admin Dashboard (Auth Service)
├── status.platform.com             → Service Health Dashboard
├── docs.platform.com               → API Documentation
└── cdn.platform.com                → Static Assets CDN
```

### Development & Testing Subdomains

```
Development Pipeline:
├── dev.platform.com                → Development environment
├── staging.platform.com            → Staging environment
├── test.platform.com               → Testing environment
├── preview.platform.com            → Feature preview deployments
└── localhost:8000                  → Local development gateway
```

## 🔗 API Gateway Routing Configuration

### Kong Gateway Configuration (api.platform.com)

```yaml
# /config/kong.yml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-routes
        hosts: ["auth.platform.com", "api.platform.com"]
        paths: ["/auth", "/api/auth"]
        strip_path: true

  - name: gaming-service
    url: http://gaming-service:3002
    routes:
      - name: gaming-routes
        hosts: ["gaming.platform.com", "api.platform.com"]
        paths: ["/gaming", "/api/gaming"]
        strip_path: true
      - name: steam-proxy
        hosts: ["steam.platform.com"]
        paths: ["/"]
        strip_path: false
      - name: riot-proxy
        hosts: ["riot.platform.com"]
        paths: ["/"]
        strip_path: false
      - name: battlenet-proxy
        hosts: ["battlenet.platform.com"]
        paths: ["/"]
        strip_path: false

  - name: wallet-service
    url: http://wallet-service:3003
    routes:
      - name: wallet-routes
        hosts: ["wallet.platform.com", "api.platform.com"]
        paths: ["/wallet", "/api/wallet", "/payments", "/api/payments"]
        strip_path: true

  - name: social-service
    url: http://social-service:3004
    routes:
      - name: social-routes
        hosts: ["social.platform.com", "api.platform.com"]
        paths: ["/social", "/api/social", "/forums", "/api/forums"]
        strip_path: true

  - name: marketplace-service
    url: http://marketplace-service:3005
    routes:
      - name: marketplace-routes
        hosts: ["marketplace.platform.com", "api.platform.com"]
        paths: ["/marketplace", "/api/marketplace", "/trading", "/api/trading"]
        strip_path: true

  - name: developer-service
    url: http://developer-service:3006
    routes:
      - name: developer-routes
        hosts: ["dev.platform.com", "api.platform.com"]
        paths: ["/developer", "/api/developer", "/repos", "/api/repos"]
        strip_path: true

plugins:
  - name: cors
    config:
      origins: ["https://*.platform.com", "http://localhost:3000"]
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      headers: ["Accept", "Authorization", "Content-Type"]
      credentials: true

  - name: rate-limiting
    config:
      minute: 1000
      hour: 10000
      policy: local

  - name: prometheus
    config:
      per_consumer: true
```

## 🌍 DNS Configuration

### Production DNS Records

```dns
; Main Platform
platform.com.                    A       YOUR_MAIN_IP
*.platform.com.                  A       YOUR_MAIN_IP

; API Gateway
api.platform.com.                A       YOUR_API_GATEWAY_IP

; Core Services
auth.platform.com.               CNAME   api.platform.com.
wallet.platform.com.             CNAME   api.platform.com.
social.platform.com.             CNAME   api.platform.com.
marketplace.platform.com.        CNAME   api.platform.com.
gaming.platform.com.             CNAME   api.platform.com.
dev.platform.com.                CNAME   api.platform.com.

; Gaming Integrations
steam.platform.com.              CNAME   api.platform.com.
riot.platform.com.               CNAME   api.platform.com.
battlenet.platform.com.          CNAME   api.platform.com.
epic.platform.com.               CNAME   api.platform.com.
jagex.platform.com.              CNAME   api.platform.com.
runelite.platform.com.           CNAME   api.platform.com.

; Infrastructure
monitoring.platform.com.         A       YOUR_MONITORING_IP
admin.platform.com.              CNAME   api.platform.com.
status.platform.com.             A       YOUR_STATUS_PAGE_IP
docs.platform.com.               A       YOUR_DOCS_IP
cdn.platform.com.                CNAME   your-cdn-provider.com.

; Development
dev.platform.com.                A       YOUR_DEV_IP
staging.platform.com.            A       YOUR_STAGING_IP
test.platform.com.               A       YOUR_TEST_IP
```

## 🚦 Load Balancer Configuration

### Nginx Load Balancer (nginx.conf)

```nginx
# Main load balancer configuration
upstream api_gateway {
    server api-gateway-1:8000 weight=3;
    server api-gateway-2:8000 weight=2;
    server api-gateway-3:8000 weight=1;
}

upstream auth_service {
    server auth-service-1:3001;
    server auth-service-2:3001;
    server auth-service-3:3001;
}

upstream gaming_service {
    server gaming-service-1:3002;
    server gaming-service-2:3002;
}

upstream wallet_service {
    server wallet-service-1:3003;
    server wallet-service-2:3003;
}

upstream social_service {
    server social-service-1:3004;
    server social-service-2:3004;
}

upstream marketplace_service {
    server marketplace-service-1:3005;
    server marketplace-service-2:3005;
}

upstream developer_service {
    server developer-service-1:3006;
    server developer-service-2:3006;
}

# Main platform
server {
    listen 443 ssl http2;
    server_name platform.com;
    
    ssl_certificate /etc/ssl/certs/platform.com.pem;
    ssl_certificate_key /etc/ssl/private/platform.com.key;
    
    location / {
        proxy_pass http://web-app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Gateway
server {
    listen 443 ssl http2;
    server_name api.platform.com;
    
    ssl_certificate /etc/ssl/certs/platform.com.pem;
    ssl_certificate_key /etc/ssl/private/platform.com.key;
    
    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Gaming platform proxies
server {
    listen 443 ssl http2;
    server_name steam.platform.com riot.platform.com battlenet.platform.com epic.platform.com jagex.platform.com runelite.platform.com;
    
    ssl_certificate /etc/ssl/certs/platform.com.pem;
    ssl_certificate_key /etc/ssl/private/platform.com.key;
    
    location / {
        proxy_pass http://gaming_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Gaming-Platform $server_name;
    }
}

# Service-specific routing
server {
    listen 443 ssl http2;
    server_name auth.platform.com wallet.platform.com social.platform.com marketplace.platform.com dev.platform.com gaming.platform.com;
    
    ssl_certificate /etc/ssl/certs/platform.com.pem;
    ssl_certificate_key /etc/ssl/private/platform.com.key;
    
    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 Service Discovery

### Consul Service Registry

```json
{
  "services": [
    {
      "name": "auth-service",
      "tags": ["core", "authentication"],
      "address": "auth.platform.com",
      "port": 3001,
      "check": {
        "http": "https://auth.platform.com/health",
        "interval": "10s"
      }
    },
    {
      "name": "gaming-service", 
      "tags": ["core", "integrations"],
      "address": "gaming.platform.com",
      "port": 3002,
      "check": {
        "http": "https://gaming.platform.com/health",
        "interval": "10s"
      }
    },
    {
      "name": "wallet-service",
      "tags": ["core", "payments"],
      "address": "wallet.platform.com", 
      "port": 3003,
      "check": {
        "http": "https://wallet.platform.com/health",
        "interval": "10s"
      }
    },
    {
      "name": "social-service",
      "tags": ["core", "community"],
      "address": "social.platform.com",
      "port": 3004,
      "check": {
        "http": "https://social.platform.com/health",
        "interval": "10s"
      }
    },
    {
      "name": "marketplace-service",
      "tags": ["core", "trading"],
      "address": "marketplace.platform.com",
      "port": 3005,
      "check": {
        "http": "https://marketplace.platform.com/health",
        "interval": "10s"
      }
    },
    {
      "name": "developer-service",
      "tags": ["core", "tools"],
      "address": "dev.platform.com",
      "port": 3006,
      "check": {
        "http": "https://dev.platform.com/health",
        "interval": "10s"
      }
    }
  ]
}
```

## 📊 Monitoring & Health Checks

### Service Health Dashboard (status.platform.com)

```javascript
// Health check endpoints for each subdomain
const healthChecks = {
  'auth.platform.com': 'https://auth.platform.com/health',
  'gaming.platform.com': 'https://gaming.platform.com/health', 
  'wallet.platform.com': 'https://wallet.platform.com/health',
  'social.platform.com': 'https://social.platform.com/health',
  'marketplace.platform.com': 'https://marketplace.platform.com/health',
  'dev.platform.com': 'https://dev.platform.com/health',
  'steam.platform.com': 'https://steam.platform.com/health',
  'riot.platform.com': 'https://riot.platform.com/health',
  'battlenet.platform.com': 'https://battlenet.platform.com/health',
  'epic.platform.com': 'https://epic.platform.com/health',
  'jagex.platform.com': 'https://jagex.platform.com/health',
  'runelite.platform.com': 'https://runelite.platform.com/health'
};

// Real-time health monitoring
setInterval(async () => {
  for (const [subdomain, endpoint] of Object.entries(healthChecks)) {
    try {
      const response = await fetch(endpoint);
      const status = response.ok ? '✅ Healthy' : '⚠️ Issues';
      updateHealthStatus(subdomain, status);
    } catch (error) {
      updateHealthStatus(subdomain, '❌ Down');
    }
  }
}, 30000); // Check every 30 seconds
```

## 🔐 SSL Certificate Management

### Wildcard Certificate Setup

```bash
# Generate wildcard certificate for *.platform.com
certbot certonly --manual --preferred-challenges=dns \
  -d "*.platform.com" -d "platform.com"

# Auto-renewal script
cat > /etc/cron.d/certbot-renew << 'EOF'
0 12 * * * /usr/bin/certbot renew --quiet
EOF
```

## 🚀 Deployment Scripts

### Subdomain Deployment Automation

```bash
#!/bin/bash
# deploy-subdomain.sh

SUBDOMAIN=$1
SERVICE=$2
VERSION=${3:-latest}

echo "🚀 Deploying $SERVICE to $SUBDOMAIN..."

# Update service
docker pull "gaming-platform/${SERVICE}:${VERSION}"

# Rolling update
docker service update \
  --image "gaming-platform/${SERVICE}:${VERSION}" \
  --update-parallelism 1 \
  --update-delay 30s \
  "${SERVICE}"

# Verify health
sleep 10
curl -f "https://${SUBDOMAIN}/health" || exit 1

echo "✅ $SUBDOMAIN deployment complete"
```

## 📋 Subdomain Management Checklist

### Adding New Subdomain
1. **DNS**: Add DNS record pointing to load balancer
2. **SSL**: Update certificate for new subdomain  
3. **Gateway**: Add routing rules to Kong configuration
4. **Load Balancer**: Update Nginx upstream configuration
5. **Monitoring**: Add health checks for new subdomain
6. **Documentation**: Update this architecture map

### Existing Subdomain Verification
```bash
# Verify all subdomains are properly configured
./scripts/verify-subdomains.sh

# Test subdomain routing
curl -H "Host: auth.platform.com" http://your-load-balancer/health
curl -H "Host: gaming.platform.com" http://your-load-balancer/health
curl -H "Host: steam.platform.com" http://your-load-balancer/health
```

## 🎯 Next Steps

1. **Audit Existing**: Run verification script on current subdomains
2. **Standardize**: Align any non-standard subdomains to this architecture
3. **Optimize**: Implement CDN for static assets (cdn.platform.com)
4. **Scale**: Add auto-scaling based on subdomain traffic
5. **Monitor**: Set up alerts for subdomain health issues

---

This subdomain architecture map provides complete documentation of how your existing infrastructure integrates with the Gaming Platform microservices architecture. All subdomains are accounted for and properly routed through the unified system.