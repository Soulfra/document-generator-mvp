# Deployment Guide - FinishThisIdea Phase2 + Soulfra Services

## 🚀 Overview

This guide covers deploying the complete FinishThisIdea platform with 33 integrated services (5 original + 28 from Soulfra).

## 📋 Prerequisites

### System Requirements
- Node.js 18+ 
- Python 3.9+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- 8GB+ RAM recommended
- 20GB+ disk space

### Required Services
- AWS S3 (or compatible storage)
- Stripe account
- LLM providers (optional):
  - Ollama (local)
  - OpenAI API
  - Anthropic API

## 🛠️ Installation Steps

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd FinishThisIdea-Phase2

# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy example environment
cp .env.example .env

# Edit with your settings
nano .env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finishthisidea

# Redis
REDIS_URL=redis://localhost:6379

# Storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=finishthisidea-storage

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM Providers (optional)
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
PORT=3002
NODE_ENV=production
```

### 3. Database Setup

```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 4. Python Environment

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install Python packages
pip install -r requirements.txt
```

### 5. Build Application

```bash
# TypeScript compilation
npm run build

# Verify build
ls -la dist/
```

## 🐳 Docker Deployment

### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src/soulfra-scripts:/app/src/soulfra-scripts
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finishthisidea
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY requirements.txt ./
COPY src/soulfra-scripts ./src/soulfra-scripts
COPY scripts/soulfra-service-wrapper.py ./scripts/
RUN pip3 install -r requirements.txt
EXPOSE 3002
CMD ["node", "dist/server.js"]
```

### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Scale workers
docker-compose up -d --scale app=3
```

## ☁️ Cloud Deployment

### AWS EC2

```bash
# Install dependencies on EC2
sudo apt update
sudo apt install -y nodejs npm python3-pip postgresql redis-server nginx

# Clone and setup
git clone <repo>
cd FinishThisIdea-Phase2
npm install
pip3 install -r requirements.txt

# Use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### Heroku

```bash
# Create Heroku app
heroku create finishthisidea-app

# Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=<your-db-url>

# Deploy
git push heroku main
```

## 🔍 Testing Deployment

### 1. Health Check
```bash
curl http://localhost:3002/health
```

### 2. Test Service
```bash
# Run service tests
npm run test:services
```

### 3. Test Payment Flow
```bash
# Use Stripe test card
curl -X POST http://localhost:3002/api/payments/test
```

## 📊 Monitoring

### Application Logs
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f

# Application logs
tail -f logs/app.log
```

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

## 🔧 Troubleshooting

### Common Issues

1. **Python services not working**
   ```bash
   # Check Python installation
   python3 --version
   pip3 list
   
   # Test wrapper directly
   python3 scripts/soulfra-service-wrapper.py --help
   ```

2. **Database connection issues**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1"
   
   # Check migrations
   npx prisma migrate status
   ```

3. **Redis connection issues**
   ```bash
   # Test Redis
   redis-cli ping
   ```

4. **S3 upload failures**
   ```bash
   # Test S3 access
   aws s3 ls s3://$S3_BUCKET
   ```

## 🚨 Production Checklist

- [ ] SSL certificates configured
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Stripe webhooks verified
- [ ] Python dependencies installed
- [ ] All services tested
- [ ] Monitoring dashboards setup

## 📈 Scaling Considerations

1. **Horizontal Scaling**
   - Use Redis for session management
   - Configure sticky sessions for WebSocket
   - Use S3 for file storage (not local disk)

2. **Database Optimization**
   - Add indexes for job queries
   - Use read replicas for dashboards
   - Implement connection pooling

3. **Queue Management**
   - Monitor queue sizes
   - Add workers for busy services
   - Implement priority queues

## 🔄 Updates and Maintenance

```bash
# Update dependencies
npm update
pip install -r requirements.txt --upgrade

# Database migrations
npx prisma migrate dev

# Restart services
pm2 restart all
# or
docker-compose restart
```

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify all environment variables
3. Test each service individually
4. Review this guide

---

**Remember**: The platform includes both Node.js and Python services. Ensure both runtimes are properly configured in your deployment environment.