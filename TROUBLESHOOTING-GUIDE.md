# TROUBLESHOOTING GUIDE
*Complete Problem-Solving Manual for Your Enterprise Document Generator*

## 🚨 EMERGENCY QUICK FIXES

**System Down? Start Here:**

```bash
# 1. Check overall system status
./scripts/status.sh

# 2. Restart everything if needed
docker-compose down && docker-compose up -d

# 3. Check health status
node deathtodata-health-monitor.js --quick-check

# 4. If still failing, check logs
docker-compose logs --tail=50
```

## 🔍 DIAGNOSTIC COMMAND REFERENCE

### System Status Commands:
```bash
# Overall system health
./scripts/status.sh

# Docker container status
docker-compose ps

# Router orchestration status
node unified-router-orchestrator.js --status

# Health monitor dashboard
curl http://localhost:9200/health

# Prometheus metrics
curl http://localhost:9090/metrics

# Check specific service
curl http://localhost:3000/health    # Template Processor
curl http://localhost:3001/health    # AI API
curl http://localhost:3002/health    # Analytics
```

### Log Analysis Commands:
```bash
# View all logs (live)
docker-compose logs -f

# Service-specific logs
docker-compose logs template-processor --tail=100
docker-compose logs ai-api --tail=100
docker-compose logs postgres --tail=100

# Error-only logs
docker-compose logs | grep -i error

# Router orchestrator logs
node unified-router-orchestrator.js --logs

# Health monitor logs
node deathtodata-health-monitor.js --show-logs
```

## 🔧 COMMON PROBLEMS & SOLUTIONS

### 1. Services Won't Start

#### Problem: Docker containers failing to start
```bash
# Diagnosis
docker-compose ps
docker-compose logs [service-name]

# Common causes & fixes:
```

**Port conflicts:**
```bash
# Find what's using ports
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :6379

# Kill conflicting processes
sudo kill -9 [PID]

# Or use different ports in docker-compose.yml
```

**Insufficient resources:**
```bash
# Check system resources
docker stats
df -h
free -m

# Clean up Docker resources
docker system prune -f
docker volume prune -f
```

**Environment variables missing:**
```bash
# Check .env file exists
ls -la .env

# Validate required variables
grep -E "(DATABASE_URL|REDIS_URL)" .env

# Copy from example if needed
cp .env.example .env
```

### 2. Database Connection Issues

#### Problem: PostgreSQL connection failures
```bash
# Diagnosis commands
docker-compose logs postgres
docker exec -it document-generator-postgres psql -U postgres
```

**Database not ready:**
```bash
# Wait for postgres to be ready
docker-compose exec postgres pg_isready -U postgres

# Check health endpoint
curl http://localhost:5432  # Should get connection
```

**Connection pool exhaustion:**
```bash
# Check active connections
docker exec -it document-generator-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Restart services to clear connections
docker-compose restart template-processor ai-api analytics
```

**Schema issues:**
```bash
# Run database migrations
docker-compose exec template-processor npm run prisma:migrate

# Reset database if needed (WARNING: deletes data)
docker-compose exec template-processor npm run prisma:reset
```

### 3. AI Service Problems

#### Problem: AI models not responding
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check available models
docker exec -it document-generator-ollama ollama list
```

**Models not loaded:**
```bash
# Pull required models
docker exec -it document-generator-ollama ollama pull codellama:7b
docker exec -it document-generator-ollama ollama pull mistral
docker exec -it document-generator-ollama ollama pull llama2
```

**Out of memory:**
```bash
# Check Ollama memory usage
docker stats document-generator-ollama

# Restart with more memory
docker-compose down ollama
docker-compose up -d ollama
```

**API key issues:**
```bash
# Check API keys in environment
env | grep -E "(ANTHROPIC|OPENAI|CLAUDE)_API_KEY"

# Test API connectivity
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
```

### 4. Router Orchestration Issues

#### Problem: Routers failing to start in order
```bash
# Check router status
node unified-router-orchestrator.js --status

# Test dependency resolution
node unified-router-orchestrator.js --test-deps

# View router logs
node unified-router-orchestrator.js --logs
```

**Dependency conflicts:**
```bash
# Check for circular dependencies
node unified-router-orchestrator.js --check-cycles

# View dependency graph
node unified-router-orchestrator.js --deps --graph
```

**Port conflicts:**
```bash
# Check port allocation
node unified-router-orchestrator.js --ports

# Find conflicting processes
node unified-router-orchestrator.js --port-conflicts

# Auto-resolve conflicts
node unified-router-orchestrator.js --resolve-ports
```

**Process management issues:**
```bash
# Check running processes
node unified-router-orchestrator.js --processes

# Clean up orphaned processes
node unified-router-orchestrator.js --cleanup

# Force restart all
node unified-router-orchestrator.js --restart-all --force
```

### 5. Health Monitoring Issues

#### Problem: Health monitor showing false positives
```bash
# Check health monitor configuration
node deathtodata-health-monitor.js --config

# Test individual health endpoints
node deathtodata-health-monitor.js --test [service-name]

# Adjust sensitivity
node deathtodata-health-monitor.js --tune-thresholds
```

**Alert fatigue:**
```bash
# Review alert history
node deathtodata-health-monitor.js --alert-history

# Adjust alert cooldown
node deathtodata-health-monitor.js --set-cooldown 300000  # 5 minutes

# Disable non-critical alerts temporarily
node deathtodata-health-monitor.js --mute-warnings
```

### 6. Storage Issues

#### Problem: MinIO/S3 storage not working
```bash
# Check MinIO status
curl http://localhost:9000/minio/health/live

# Check MinIO console
open http://localhost:9001  # minioadmin/minioadmin123
```

**Bucket creation issues:**
```bash
# Create bucket manually
docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123
docker-compose exec minio mc mb myminio/document-generator-uploads
```

**Permission issues:**
```bash
# Check bucket permissions
docker-compose exec minio mc ls myminio/
docker-compose exec minio mc policy get myminio/document-generator-uploads

# Fix permissions
docker-compose exec minio mc policy set public myminio/document-generator-uploads
```

### 7. Network & SSL Issues

#### Problem: HTTPS/SSL certificate issues
```bash
# Check nginx configuration
docker-compose logs nginx

# Validate SSL certificates
openssl x509 -in nginx/ssl/cert.pem -text -noout
```

**Self-signed certificate warnings:**
```bash
# Generate new certificates
./scripts/generate-ssl-certs.sh

# Or use development flag
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Subdomain routing issues:**
```bash
# Test subdomain resolution
nslookup app.documentgenerator.app
nslookup api.documentgenerator.app

# Check nginx proxy configuration
docker exec -it document-generator-nginx nginx -t
```

## 📊 PERFORMANCE TROUBLESHOOTING

### Slow Response Times

#### Diagnosis:
```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:3000/health

# Load testing
node deathtodata-test-suite.js load --users=10 --duration=60

# Profile specific endpoint
node --prof app.js
```

#### Solutions:
```bash
# Check resource usage
docker stats

# Scale up resources
docker-compose up -d --scale template-processor=2

# Enable Redis caching
docker-compose restart redis

# Optimize database
docker-compose exec postgres psql -U postgres -c "VACUUM ANALYZE;"
```

### Memory Leaks

#### Diagnosis:
```bash
# Monitor memory over time
watch 'docker stats --no-stream'

# Node.js memory profiling
node --inspect=0.0.0.0:9229 app.js

# Check for memory leaks in router orchestrator
node unified-router-orchestrator.js --memory-profile
```

#### Solutions:
```bash
# Restart services with memory issues
docker-compose restart [service-name]

# Increase memory limits in docker-compose.yml
mem_limit: 1g

# Enable garbage collection logging
NODE_OPTIONS="--max-old-space-size=1024" docker-compose up -d
```

### High CPU Usage

#### Diagnosis:
```bash
# Check CPU usage by service
docker stats

# Profile CPU usage
docker exec -it [container] top

# Check for infinite loops
node unified-router-orchestrator.js --cpu-profile
```

## 🔄 RECOVERY PROCEDURES

### Complete System Recovery

#### When everything is broken:
```bash
# 1. Stop everything
docker-compose down -v  # WARNING: removes volumes

# 2. Clean Docker
docker system prune -f -a
docker volume prune -f

# 3. Rebuild from scratch
./setup-document-generator.sh

# 4. Restore from backup (if available)
./scripts/restore-from-backup.sh
```

### Partial Service Recovery

#### Single service issues:
```bash
# Restart specific service
docker-compose restart [service-name]

# Rebuild specific service
docker-compose build --no-cache [service-name]
docker-compose up -d [service-name]

# Restore service dependencies
node unified-router-orchestrator.js --restart [service-name] --deps
```

### Database Recovery

#### PostgreSQL issues:
```bash
# Backup current state
docker exec document-generator-postgres pg_dump -U postgres > backup.sql

# Reset database
docker-compose down postgres
docker volume rm document-generator_postgres-data
docker-compose up -d postgres

# Wait for startup then restore
sleep 30
docker exec -i document-generator-postgres psql -U postgres < backup.sql

# Run migrations
docker-compose exec template-processor npm run prisma:migrate
```

## 🧪 TESTING & VALIDATION

### Verify System Health After Fixes

#### Run comprehensive tests:
```bash
# 1. Unit tests
npm test unit/

# 2. Integration tests
npm test integration/

# 3. E2E tests
node deathtodata-test-suite.js run

# 4. Health validation
node deathtodata-health-monitor.js --comprehensive

# 5. Load test
node deathtodata-test-suite.js load --light
```

#### Validate specific components:
```bash
# Test router orchestration
node unified-router-orchestrator.js --test-all

# Test AI services
curl -X POST http://localhost:3001/ai/test

# Test template processing
curl -X POST http://localhost:3000/api/test-template

# Test analytics
curl http://localhost:3002/analytics/health
```

## 📋 PREVENTIVE MAINTENANCE

### Daily Checks:
```bash
#!/bin/bash
# daily-health-check.sh

echo "Daily Health Check - $(date)"

# System status
./scripts/status.sh

# Health monitor
node deathtodata-health-monitor.js --quick-check

# Router status  
node unified-router-orchestrator.js --status

# Resource usage
docker stats --no-stream

# Check logs for errors
docker-compose logs --since=24h | grep -i error | wc -l

echo "Health check complete"
```

### Weekly Maintenance:
```bash
#!/bin/bash
# weekly-maintenance.sh

# Clean up Docker resources
docker system prune -f

# Vacuum database
docker-compose exec postgres psql -U postgres -c "VACUUM ANALYZE;"

# Rotate logs
docker-compose exec nginx logrotate /etc/logrotate.conf

# Update AI models
docker exec document-generator-ollama ollama pull codellama:7b

# Comprehensive test suite
node unified-auditable-testing-framework.js test

# Performance analysis
node deathtodata-test-suite.js performance --duration=300
```

## 🔍 ADVANCED DEBUGGING

### Debug Mode Activation:
```bash
# Enable debug logging
export DEBUG=document-generator:*
export LOG_LEVEL=debug

# Start services with debug
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up -d

# Router orchestrator debug
node unified-router-orchestrator.js --debug --verbose

# Health monitor debug
node deathtodata-health-monitor.js --debug --trace
```

### Production Debugging:
```bash
# Create debug snapshot
./scripts/create-debug-snapshot.sh

# Analyze performance
node --prof-process isolate-0x[id]-v8.log > profile.txt

# Memory heap snapshot
node --inspect app.js
# Then use Chrome DevTools

# Network debugging
docker-compose exec nginx tcpdump -i eth0
```

## 📞 ESCALATION PROCEDURES

### When to Escalate:

1. **Critical System Down** (>30 minutes)
2. **Data Loss Detected**
3. **Security Breach Suspected**
4. **Performance Degraded** (>50% for >24 hours)
5. **Recovery Procedures Failed**

### Escalation Information to Gather:
```bash
# System information
./scripts/generate-incident-report.sh

# Include:
- Current system status
- Error logs (last 24 hours)
- Performance metrics
- Recent changes
- Failed recovery attempts
- Impact assessment
```

## 🔧 USEFUL ALIASES

Add these to your `.bashrc` or `.zshrc`:
```bash
# Document Generator aliases
alias dg-status='./scripts/status.sh'
alias dg-logs='docker-compose logs -f'
alias dg-health='node deathtodata-health-monitor.js --quick-check'
alias dg-routers='node unified-router-orchestrator.js --status'
alias dg-restart='docker-compose restart'
alias dg-rebuild='docker-compose down && docker-compose build && docker-compose up -d'
alias dg-test='npm test'
alias dg-clean='docker system prune -f'
```

## 🆘 EMERGENCY CONTACTS

**When automated recovery fails:**

1. **Check documentation**: This guide and related docs
2. **Review logs**: Look for specific error patterns
3. **Test components**: Isolate the failing component
4. **Apply fixes**: Use appropriate recovery procedures
5. **Validate**: Run tests to confirm resolution
6. **Document**: Update this guide with new solutions

---

**Remember: Your system has sophisticated auto-recovery. Most issues resolve automatically. Use this guide when manual intervention is needed.**

*Troubleshooting: When things break, we fix them fast*