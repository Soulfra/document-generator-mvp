# HEALTH MONITORING & TRACING GUIDE
*Your Real-Time System Intelligence & Auto-Recovery Arsenal*

## 🎯 EXECUTIVE SUMMARY

**YOU HAVE ENTERPRISE-GRADE MONITORING**

Your system includes sophisticated health monitoring that rivals Fortune 500 companies:
- Real-time health monitoring with 15-second intervals
- Automatic service recovery with intelligent backoff
- Web-based monitoring dashboards
- Comprehensive alert system with escalation
- Performance metrics with historical tracking
- Distributed tracing across all services

## 🏗️ MONITORING ARCHITECTURE

```
                    COMPREHENSIVE MONITORING ECOSYSTEM
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        MONITORING GATEWAY                               │
    │  monitor.documentgenerator.app → Health Dashboard (Port 9200)          │
    └─────────────────────────────────────────────────────────────────────────┘
                                        │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                     HEALTH MONITORING LAYER                            │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
    │  │ Health Monitor  │ │  Router Monitor │ │  Service Health │          │
    │  │ (DeathtoData)   │ │  (Orchestrator) │ │  (Individual)   │          │
    │  │                 │ │                 │ │                 │          │
    │  │ • 15s Intervals │ │ • Dependency    │ │ • Endpoint Test │          │
    │  │ • Auto Recovery │ │   Health Checks │ │ • Resource Mon  │          │  
    │  │ • Alert System  │ │ • Port Conflicts│ │ • Error Rates   │          │
    │  │ • Web Dashboard │ │ • PID Tracking  │ │ • Response Time │          │
    │  └─────────────────┘ └─────────────────┘ └─────────────────┘          │
    └─────────────────────────────────────────────────────────────────────────┘
                                        │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                    METRICS & TRACING LAYER                             │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
    │  │ Prometheus      │ │  Grafana        │ │  Custom Metrics │          │
    │  │ :9090           │ │  :3003          │ │  Collection     │          │
    │  │                 │ │                 │ │                 │          │
    │  │ • Metrics Store │ │ • Dashboards    │ │ • Business KPIs │          │
    │  │ • Time Series   │ │ • Visualizations│ │ • Performance   │          │
    │  │ • Alerting      │ │ • Historical    │ │ • Error Tracking│          │
    │  │ • Aggregation   │ │ • Real-time     │ │ • User Analytics│          │
    │  └─────────────────┘ └─────────────────┘ └─────────────────┘          │
    └─────────────────────────────────────────────────────────────────────────┘
                                        │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                      ALERTING & RECOVERY LAYER                         │
    ├─────────────────────────────────────────────────────────────────────────┤
    │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
    │  │ Alert Manager   │ │  Auto Recovery  │ │  Notification   │          │
    │  │                 │ │  System         │ │  System         │          │
    │  │ • Smart Routing │ │                 │ │                 │          │
    │  │ • Escalation    │ │ • Service       │ │ • Email/Slack   │          │
    │  │ • Deduplication │ │   Restart       │ │ • Webhooks      │          │
    │  │ • Cooldown      │ │ • Backoff Logic │ │ • PagerDuty     │          │
    │  │ • Context       │ │ • Dep. Handling │ │ • SMS/Voice     │          │
    │  └─────────────────┘ └─────────────────┘ └─────────────────┘          │
    └─────────────────────────────────────────────────────────────────────────┘
```

## 🔍 CORE MONITORING SYSTEMS

### 1. DeathtoData Health Monitor

**Location**: `deathtodata-health-monitor.js`  
**Port**: 9200  
**Dashboard**: http://localhost:9200/dashboard

#### Features:
```javascript
// Real-time monitoring configuration
const config = {
  healthCheckInterval: 15000,        // 15 seconds
  alertCooldownPeriod: 300000,      // 5 minutes
  maxRestartAttempts: 3,            // Auto-recovery limit
  criticalThresholds: {
    memory: 90,                     // % memory usage
    cpu: 85,                        // % CPU usage
    responseTime: 5000,             // milliseconds
    errorRate: 5                    // % error rate
  }
}
```

#### Usage:
```bash
# Start continuous monitoring
node deathtodata-health-monitor.js

# Quick health check
node deathtodata-health-monitor.js --quick-check

# Check specific service
curl http://localhost:9200/health/template-processor

# View monitoring dashboard
open http://localhost:9200/dashboard

# Get alert status
curl http://localhost:9200/alerts
```

#### Monitored Services:
- **Template Processor** (Port 3000): /health endpoint
- **AI API Service** (Port 3001): /health endpoint  
- **Analytics Service** (Port 3002): /health endpoint
- **Platform Hub** (Port 8080): HTTP response check
- **PostgreSQL** (Port 5432): Connection test
- **Redis** (Port 6379): PING command
- **MinIO** (Port 9000): Health check endpoint
- **Ollama** (Port 11434): Model availability

### 2. Unified Router Orchestrator Monitoring

**Location**: `unified-router-orchestrator.js`  
**Built-in Health System**: Comprehensive router health tracking

#### Features:
```bash
# Check router orchestration status
node unified-router-orchestrator.js --status

# Test all routers
node unified-router-orchestrator.js --test-all

# Test specific router
node unified-router-orchestrator.js --test postgres

# View router statistics
node unified-router-orchestrator.js --stats

# Monitor dependency health
node unified-router-orchestrator.js --deps
```

#### Router Health Checks:
- **HTTP Health Endpoints**: GET /health for web services
- **Process Monitoring**: PID tracking and process state
- **Dependency Validation**: Ensures prerequisites are running
- **Port Conflict Detection**: Prevents port collisions
- **Memory Leak Detection**: Tracks resource usage over time
- **Auto-Recovery**: Restarts failed services with backoff

### 3. Service-Specific Health Systems

#### Each service includes built-in health endpoints:

**Template Processor Health**:
```bash
curl http://localhost:3000/health
# Response: { "status": "healthy", "uptime": 3600, "services": {...} }
```

**AI API Service Health**:
```bash
curl http://localhost:3001/health  
# Response: { "status": "healthy", "models": ["ollama", "claude"], "queue": 0 }
```

**Analytics Service Health**:
```bash
curl http://localhost:3002/health
# Response: { "status": "healthy", "metrics": {...}, "storage": "ok" }
```

## 📊 METRICS COLLECTION

### Prometheus Metrics (Port 9090)

**Automatic Metrics Collection**:
```yaml
# Service metrics
- http_requests_total{service, method, status}
- http_request_duration_seconds{service, endpoint}
- service_up{service}
- process_cpu_usage{service}
- process_memory_usage{service}

# Business metrics  
- documents_processed_total{type, status}
- ai_requests_total{provider, model}
- user_sessions_total{type}
- mvp_generations_total{template, success}

# Infrastructure metrics
- database_connections{service, state}
- cache_hits_total{service}
- queue_size{service, queue}
- disk_usage{service, mount}
```

### Custom Business Metrics

**Analytics Service Integration**:
```javascript
// Track document processing
await analytics.track('document_processed', {
  type: 'business_plan',
  size_mb: 2.5,
  processing_time: 45000,
  success: true,
  user_id: 'user_123'
});

// Track AI usage
await analytics.track('ai_request', {
  provider: 'ollama',
  model: 'codellama:7b', 
  tokens: 1500,
  cost: 0.0,
  response_time: 3200
});
```

## 🚨 ALERTING SYSTEM

### Alert Configuration

**Alert Types & Thresholds**:
```yaml
Critical Alerts (Immediate):
  - service_down: Any core service unavailable
  - high_error_rate: >5% error rate for 2 minutes  
  - memory_exhaustion: >90% memory usage
  - disk_full: >95% disk usage
  - database_connection_loss: DB unavailable

Warning Alerts (5 minute delay):
  - high_response_time: >3s average response time
  - elevated_cpu: >80% CPU for 5 minutes
  - queue_backup: >100 items in processing queue
  - cache_miss_rate: >50% cache misses

Info Alerts (15 minute delay):
  - unusual_traffic: 200% increase in requests
  - model_switching: Ollama → Cloud AI fallback
  - storage_growth: Rapid storage consumption
```

### Notification Channels

**Email Notifications**:
```bash
# Configure in .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ALERT_EMAIL=admin@yourdomain.com
ESCALATION_EMAIL=cto@yourdomain.com
```

**Slack Integration**:
```bash
# Webhook configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SLACK_CHANNEL=#alerts
SLACK_CRITICAL_CHANNEL=#incidents
```

**Webhook Notifications**:
```bash
# Custom webhook endpoint
ALERT_WEBHOOK_URL=https://your-monitoring.com/webhook
WEBHOOK_SECRET=your-secret-key
```

## 🔄 AUTO-RECOVERY SYSTEM

### Intelligent Recovery Logic

**Service Restart Strategy**:
```javascript
const recoveryConfig = {
  // Progressive backoff for restarts
  restartDelays: [1000, 5000, 15000, 60000],  // 1s, 5s, 15s, 1m
  
  // Maximum restart attempts before giving up
  maxRestartAttempts: 3,
  
  // Dependency handling
  restartDependents: true,
  
  // Health check before marking as recovered
  healthCheckTimeout: 30000,
  
  // Circuit breaker pattern
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 300000
}
```

**Recovery Scenarios**:

1. **Service Crash**: Automatic restart with dependency check
2. **Memory Leak**: Process restart with memory monitoring
3. **Database Connection Loss**: Connection pool restart
4. **High Error Rate**: Circuit breaker activation
5. **Port Conflicts**: Automatic port reassignment
6. **Disk Full**: Automatic log rotation and cleanup

### Recovery Commands:
```bash
# Manual recovery trigger
node deathtodata-health-monitor.js --recover [service-name]

# Force restart all services
node unified-router-orchestrator.js --restart-all

# Restart with dependency order
node unified-router-orchestrator.js --restart --deps

# Recovery from backup state
node comprehensive-verification-reasoning-system.js pets --restore
```

## 📈 PERFORMANCE MONITORING

### Real-Time Performance Dashboards

**Grafana Dashboards** (http://localhost:3003):

1. **System Overview Dashboard**:
   - Service status grid
   - Request rate graphs
   - Error rate trends
   - Response time distributions

2. **Infrastructure Dashboard**:
   - CPU, Memory, Disk usage
   - Database performance
   - Cache hit rates
   - Network traffic

3. **Business Metrics Dashboard**:
   - Document processing volume
   - User engagement metrics
   - AI usage and costs
   - Revenue tracking

4. **Alert Status Dashboard**:
   - Active alerts
   - Alert history
   - Recovery success rates
   - Escalation tracking

### Performance Analysis Tools:

```bash
# Generate performance report
node deathtodata-test-suite.js performance --duration=300

# Benchmark specific endpoint
node deathtodata-test-suite.js benchmark /api/process-document

# Load testing
node deathtodata-test-suite.js load --users=100 --duration=600

# Memory profiling
node --inspect deathtodata-health-monitor.js
```

## 🔍 DISTRIBUTED TRACING

### Request Tracing System

**Trace ID Generation**:
```javascript
// Each request gets unique trace ID
const traceId = `trace_${Date.now()}_${Math.random().toString(36)}`;

// Propagated through all services
headers['X-Trace-ID'] = traceId;
headers['X-Parent-Span-ID'] = spanId;
```

**Service Correlation**:
```javascript
// Log format includes trace context
logger.info('Processing document', {
  traceId: req.headers['x-trace-id'],
  service: 'template-processor',
  operation: 'extract_requirements',
  duration: 1250,
  success: true
});
```

### Trace Analysis:
```bash
# Find traces for specific request
grep "trace_1673123456789" logs/*.log

# Trace request through all services  
node trace-analyzer.js --trace-id=trace_1673123456789

# Performance analysis by trace
node trace-analyzer.js --slow-queries --min-duration=5000
```

## 🛠️ MONITORING ADMINISTRATION

### Daily Monitoring Tasks:
```bash
# Morning health check routine
./scripts/morning-health-check.sh

# Check overnight alerts
curl http://localhost:9200/alerts?since=yesterday

# Performance summary
node deathtodata-health-monitor.js --summary --period=24h

# Verify all services
npm test integration/
```

### Weekly Monitoring Tasks:
```bash
# Comprehensive health report
node unified-auditable-testing-framework.js audit --full

# Performance trend analysis
node performance-analyzer.js --trend --days=7

# Capacity planning review
node capacity-planner.js --project=7days

# Alert tuning review
node alert-tuner.js --review --effectiveness
```

### Monthly Monitoring Tasks:
```bash
# Historical performance analysis
node performance-analyzer.js --monthly-report

# Resource usage trends
node capacity-planner.js --monthly --forecast=3months

# Alert effectiveness review
node alert-effectiveness-analyzer.js --month

# Monitoring system self-assessment
node monitoring-health-check.js --comprehensive
```

## 🔧 TROUBLESHOOTING MONITORING

### Common Monitoring Issues:

#### 1. Prometheus Not Collecting Metrics:
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service /metrics endpoints
curl http://localhost:3000/metrics
curl http://localhost:3001/metrics
curl http://localhost:3002/metrics

# Restart Prometheus
docker-compose restart prometheus
```

#### 2. Grafana Dashboards Not Loading:
```bash
# Check Grafana data source
curl -u admin:admin http://localhost:3003/api/datasources

# Test Prometheus connection
curl -u admin:admin http://localhost:3003/api/datasources/proxy/1/api/v1/query?query=up

# Restart Grafana with clean state
docker-compose down grafana && docker-compose up -d grafana
```

#### 3. Health Monitor False Positives:
```bash
# Adjust health check sensitivity
node deathtodata-health-monitor.js --tune-thresholds

# Check health endpoint responses
curl -v http://localhost:3000/health
curl -v http://localhost:3001/health

# Review alert history
node alert-analyzer.js --false-positives --days=7
```

#### 4. Missing Alerts:
```bash
# Test alert delivery
node deathtodata-health-monitor.js --test-alerts

# Check notification configuration
env | grep -E "(SMTP|SLACK|WEBHOOK)"

# Verify alert rules
node alert-validator.js --check-rules
```

## 💡 MONITORING BEST PRACTICES

### 1. **Proactive Monitoring**:
   - Monitor trends, not just current state
   - Use predictive alerting for capacity planning
   - Track business metrics alongside technical metrics

### 2. **Alert Fatigue Prevention**:
   - Use smart alert grouping and deduplication
   - Implement alert cooldown periods
   - Focus on actionable alerts only

### 3. **Performance Optimization**:
   - Monitor monitoring system performance
   - Use sampling for high-volume metrics
   - Archive historical data appropriately

### 4. **Incident Response**:
   - Maintain runbooks for common issues
   - Practice incident response procedures
   - Learn from post-incident analysis

## 🔥 IMMEDIATE MONITORING COMMANDS

**Start Full Monitoring Stack**:
```bash
# Start all monitoring services
docker-compose up -d prometheus grafana
node deathtodata-health-monitor.js &
node unified-router-orchestrator.js --monitor &

# Access dashboards
open http://localhost:3003  # Grafana
open http://localhost:9200  # Health Dashboard
open http://localhost:9090  # Prometheus
```

**Quick Health Status**:
```bash
# System health overview
./scripts/status.sh

# Detailed health check
node deathtodata-health-monitor.js --quick-check

# Router orchestration status  
node unified-router-orchestrator.js --status
```

---

**Your monitoring system provides enterprise-grade visibility and auto-recovery capabilities. Use it to maintain 99.9% uptime.**

*Health Monitoring: Know everything, fix automatically*