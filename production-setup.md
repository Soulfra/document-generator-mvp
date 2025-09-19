# Document Generator Production Setup Guide

## 🚀 Overview

The Document Generator is a comprehensive AI-powered system that transforms documents into working MVPs using a character-based AI orchestration system. This guide provides step-by-step instructions for production deployment.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
│              (Web Dashboard & API Endpoints)                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Character System Layer                      │
│    (Ralph, Alice, Bob, Charlie, Diana, Eve, Frank)         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│   │Template │  │   AI    │  │Analytics│  │Platform │      │
│   │Processor│  │   API   │  │ Service │  │   Hub   │      │
│   │  :3000  │  │  :3001  │  │  :3002  │  │  :8080  │      │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│   │PostgreSQL│ │  Redis  │  │  MinIO  │  │ Ollama  │      │
│   │  :5432  │  │  :6379  │  │  :9000  │  │ :11434  │      │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS 10.15+, or Windows with WSL2
- **CPU**: 4+ cores recommended
- **RAM**: 16GB minimum, 32GB recommended
- **Disk**: 50GB free space minimum
- **Docker**: Version 20.10+ with Docker Compose v2+
- **Node.js**: Version 18+ (for development)
- **Git**: Version 2.25+

### Required Software
```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js
node --version
npm --version

# Check Git
git --version
```

## 🔧 Environment Configuration

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/document-generator.git
cd document-generator
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your preferred editor
nano .env
```

### Required Environment Variables:
```env
# Database Configuration
POSTGRES_USER=docgen
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=document_generator
DATABASE_URL=postgresql://docgen:your_secure_password_here@localhost:5432/document_generator

# Redis Configuration
REDIS_URL=redis://localhost:6379

# MinIO (S3-compatible storage)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_secure_minio_password
MINIO_ENDPOINT=localhost:9000

# AI Service Keys (for cloud fallback)
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Application Configuration
NODE_ENV=production
PORT=8080
WS_PORT=8081

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Character System Configuration
CHARACTER_SYSTEM_ENABLED=true
CHARACTER_DEBUG_MODE=false
```

## 🚀 Installation & Deployment

### Option 1: Automated Setup (Recommended)
```bash
# Make the setup script executable
chmod +x setup-document-generator.sh

# Run the automated setup
./setup-document-generator.sh
```

This script will:
1. Check all prerequisites
2. Create necessary directories
3. Configure environment variables
4. Build Docker images
5. Initialize databases
6. Start all services
7. Run health checks

### Option 2: Manual Setup

#### Step 1: Create Required Directories
```bash
mkdir -p data/postgres data/redis data/minio logs
```

#### Step 2: Build Docker Images
```bash
docker-compose build
```

#### Step 3: Initialize Database
```bash
# Start only PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Run database schema
docker-compose exec postgres psql -U docgen -d document_generator -f /docker-entrypoint-initdb.d/schema.sql

# Stop PostgreSQL
docker-compose down
```

#### Step 4: Pull Ollama Models
```bash
# Start Ollama service
docker-compose up -d ollama

# Pull required models
docker exec document-generator-ollama ollama pull codellama:7b
docker exec document-generator-ollama ollama pull mistral
docker exec document-generator-ollama ollama pull llama2
```

#### Step 5: Start All Services
```bash
docker-compose up -d
```

## 🔍 Service Health Checks

### Verify All Services Are Running
```bash
# Check container status
docker-compose ps

# Check service health
curl http://localhost:8080/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Check Character System
```bash
# Test character availability
curl http://localhost:8080/api/characters/status

# Test a character interaction
curl -X POST http://localhost:8080/api/characters/ralph/analyze \
  -H "Content-Type: application/json" \
  -d '{"document": "Test document content"}'
```

## 📊 Service Endpoints

### Main Services
- **Platform Hub**: http://localhost:8080
- **Template Processor (MCP)**: http://localhost:3000
- **AI API Service**: http://localhost:3001
- **Analytics Dashboard**: http://localhost:3002
- **WebSocket**: ws://localhost:8081

### Infrastructure Services
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001
- **Ollama API**: http://localhost:11434

## 🔒 Security Considerations

### Production Hardening
1. **Use Strong Passwords**: Generate secure passwords for all services
2. **Enable HTTPS**: Configure SSL/TLS certificates
3. **Firewall Rules**: Only expose necessary ports
4. **API Rate Limiting**: Configure rate limits in production
5. **Authentication**: Enable proper authentication for all endpoints

### SSL/TLS Configuration
```nginx
# Example Nginx configuration for HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Performance Optimization

### Resource Allocation
```yaml
# docker-compose.override.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
          
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
          
  ollama:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
```

### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_analyses_document_id ON analyses(document_id);
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Compose Fails to Start
```bash
# Check Docker daemon
sudo systemctl status docker

# Check for port conflicts
sudo lsof -i :8080
sudo lsof -i :5432

# View detailed logs
docker-compose logs -f
```

#### 2. Database Connection Errors
```bash
# Test PostgreSQL connection
docker-compose exec postgres psql -U docgen -c "SELECT 1"

# Check database logs
docker-compose logs postgres
```

#### 3. Ollama Model Loading Issues
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Manually pull models
docker exec -it document-generator-ollama ollama pull codellama:7b
```

#### 4. Character System Not Responding
```bash
# Check character service logs
docker-compose logs app | grep -i character

# Test character endpoint
curl http://localhost:8080/api/characters/health
```

## 🔄 Maintenance

### Backup Procedures
```bash
# Backup database
docker-compose exec postgres pg_dump -U docgen document_generator > backup.sql

# Backup MinIO data
docker-compose exec minio mc mirror /data backup/

# Backup Redis
docker-compose exec redis redis-cli SAVE
```

### Update Procedures
```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build

# Apply database migrations
docker-compose exec app npm run migrate

# Restart services
docker-compose down && docker-compose up -d
```

## 📊 Monitoring

### Basic Monitoring Commands
```bash
# View real-time logs
docker-compose logs -f

# Monitor resource usage
docker stats

# Check API metrics
curl http://localhost:3002/metrics
```

### Recommended Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Loki**: Log aggregation
- **AlertManager**: Alert notifications

## 🎯 Next Steps

1. **Review Character Integration**: See `character-integration-guide.md`
2. **Run Tests**: See `test-suite-guide.md`
3. **Configure Monitoring**: Set up production monitoring
4. **Enable Backups**: Configure automated backups
5. **Scale Services**: Adjust resources based on load

## 📞 Support

- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Community**: Discord/Slack channel
- **Email**: support@your-domain.com

---

*Last Updated: [Current Date]*
*Version: 1.0.0*