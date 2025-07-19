# 📊 FinishThisIdea Prometheus Monitoring Stack

Complete monitoring solution with Prometheus, Grafana, and AlertManager for the FinishThisIdea Platform.

## 🎯 Overview

This monitoring stack provides:
- **Real-time metrics collection** with Prometheus
- **Beautiful dashboards** with Grafana
- **Intelligent alerting** with AlertManager
- **Business metrics tracking** for key KPIs
- **Performance monitoring** for all services

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Application    │───▶│   Prometheus     │───▶│   Grafana       │
│  (Metrics)      │    │   (Collection)   │    │   (Visualization│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  AlertManager    │
                       │  (Notifications) │
                       └──────────────────┘
```

## 📈 Metrics Categories

### HTTP Metrics
- Request duration percentiles (p50, p95, p99)
- Request rate by endpoint
- Error rates and status codes
- Request/response size distributions

### Business Metrics
- Job processing rates and success ratios
- User registrations by tier
- Payment processing metrics
- API key usage statistics
- AI request volumes
- Social sharing engagement
- Achievement unlock rates

### System Metrics
- Memory usage and trends
- CPU utilization
- Event loop lag
- Database connection pools
- Redis connection status

### Custom Application Metrics
- QR code generation rates
- File upload statistics
- Viral growth indicators
- Revenue tracking

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start all monitoring services
npm run monitoring:prometheus

# Or start individually
docker-compose up -d prometheus grafana alertmanager node-exporter
```

### 2. Access Interfaces

| Service | URL | Purpose |
|---------|-----|---------|
| **Prometheus** | http://localhost:9090 | Metrics collection & queries |
| **Grafana** | http://localhost:3003 | Dashboards & visualization |
| **AlertManager** | http://localhost:9093 | Alert management |
| **Node Exporter** | http://localhost:9100 | System metrics |

### 3. Application Metrics

Metrics are automatically exposed at:
- http://localhost:3001/metrics (Standard Prometheus format)
- http://localhost:3001/api/metrics (JSON with health info)

## 📊 Available Dashboards

### FinishThisIdea Platform Overview
- Service status overview
- User distribution by tier
- Request rate and response times
- Job processing metrics
- System resource usage

*More dashboards available in `/monitoring/grafana/provisioning/dashboards/`*

## 🔥 Alerting Rules

### Critical Alerts (Immediate Action)
- **ServiceDown**: Service unavailable for > 1 minute
- **HighErrorRate**: API error rate > 10% for 2 minutes
- **JobProcessingFailure**: Job failure rate > 20% for 3 minutes
- **HighMemoryUsage**: Memory usage > 90% for 2 minutes
- **DatabaseConnectionsExhausted**: DB connections > 80 for 1 minute

### Warning Alerts (Investigation Needed)
- **SlowAPIResponse**: p95 response time > 2s for 5 minutes
- **EventLoopLag**: Node.js event loop lag > 100ms for 3 minutes
- **LowJobSuccessRate**: Job success rate < 95% for 5 minutes
- **HighPaymentFailureRate**: Payment failures > 5% for 5 minutes

### Info Alerts (Business Intelligence)
- **UserGrowthSpike**: > 100 new users in 1 hour
- **HighAIUsage**: AI request rate > 1000/hour
- **SocialEngagementSpike**: Social shares > 50/hour

## 🛠️ Configuration

### Recording Rules
Pre-computed metrics for better performance:
```yaml
# Example: Job completion rate
- record: finishthisidea:job_completion_rate_5m
  expr: rate(finishthisidea_jobs_total{status="COMPLETED"}[5m])
```

### Alert Routing
Alerts are routed based on severity:
- **Critical** → DevOps team (immediate)
- **Warning** → Development team (2 hour grouping)
- **Info** → Business team (daily digest)

### Business-Specific Routing
- **Growth alerts** → Growth & CEO teams
- **Payment alerts** → Finance team
- **AI usage** → AI development team

## 📝 Custom Metrics Implementation

### Recording Business Events

```typescript
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics.service';

// Record job completion
prometheusMetrics.recordJobCompleted('COMPLETED', 'PREMIUM');

// Record payment
prometheusMetrics.recordPayment('succeeded', 2500);

// Record AI usage
prometheusMetrics.recordAiRequest('anthropic', 'claude-3', 'success');

// Record social sharing
prometheusMetrics.recordSocialShare('twitter', 'achievement');
```

### Adding New Metrics

1. **Define the metric** in `prometheus-metrics.service.ts`:
```typescript
this.customMetric = new client.Counter({
  name: 'finishthisidea_custom_metric_total',
  help: 'Description of the metric',
  labelNames: ['label1', 'label2'],
  registers: [this.registry],
});
```

2. **Record the metric** in your code:
```typescript
prometheusMetrics.customMetric.inc({ label1: 'value1', label2: 'value2' });
```

3. **Create alerts** in `alerting-rules.yml`:
```yaml
- alert: CustomMetricThreshold
  expr: finishthisidea_custom_metric_total > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom metric exceeded threshold"
```

## 🎨 Dashboard Creation

### Adding New Dashboards

1. Create dashboard JSON in `/monitoring/grafana/provisioning/dashboards/`
2. Use Prometheus queries like:
```promql
# Request rate
rate(http_requests_total[5m])

# Error percentage
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# Business metrics
rate(finishthisidea_jobs_total{status="COMPLETED"}[5m])
```

### Best Practices
- Use consistent time ranges (5m, 1h, 24h)
- Include both rate and absolute values
- Add meaningful thresholds and alerts
- Use appropriate visualization types

## 🔧 Troubleshooting

### Common Issues

#### Metrics Not Appearing
```bash
# Check if metrics endpoint is accessible
curl http://localhost:3001/metrics

# Check Prometheus targets
# Go to http://localhost:9090/targets
```

#### High Memory Usage
```bash
# Check Prometheus retention settings
docker logs finishthisidea-prometheus

# Reduce retention period if needed
--storage.tsdb.retention.time=30d
```

#### Missing Alerts
```bash
# Check AlertManager configuration
docker logs finishthisidea-alertmanager

# Validate YAML syntax
docker exec finishthisidea-alertmanager amtool config routes test
```

### Performance Optimization

#### Reduce Metric Cardinality
- Avoid high-cardinality labels (user IDs, timestamps)
- Use recording rules for complex queries
- Group similar labels together

#### Optimize Queries
- Use recording rules for dashboard queries
- Implement proper rate() functions
- Add appropriate time ranges

## 📚 Reference

### Key PromQL Queries

```promql
# Service availability
up

# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Job success rate
rate(finishthisidea_jobs_total{status="COMPLETED"}[5m]) / 
rate(finishthisidea_jobs_total[5m])

# Memory usage percentage
(process_memory_usage_bytes{type="rss"} / (1024 * 1024 * 1024)) * 100
```

### Useful Commands

```bash
# View all metrics
curl -s http://localhost:3001/metrics | grep finishthisidea

# Test AlertManager config
docker exec finishthisidea-alertmanager amtool config routes show

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload

# Check Grafana logs
docker logs finishthisidea-grafana
```

## 🎯 Production Checklist

- [ ] Configure external email/Slack for alerts
- [ ] Set up proper authentication for Grafana
- [ ] Configure persistent storage volumes
- [ ] Implement proper backup strategy
- [ ] Set appropriate retention policies
- [ ] Configure reverse proxy for external access
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Test disaster recovery procedures
- [ ] Document runbooks for common alerts

## 🤝 Contributing

To add new metrics or dashboards:

1. **Create the metric** in the Prometheus service
2. **Add recording rules** if needed for performance
3. **Create Grafana dashboard** with meaningful visualizations
4. **Add alerting rules** with appropriate thresholds
5. **Update documentation** with examples and usage

## 📞 Support

For monitoring issues:
- Check service logs: `docker-compose logs [service-name]`
- Review Prometheus targets: http://localhost:9090/targets
- Validate AlertManager config: `amtool config routes test`
- Test metrics endpoint: `curl http://localhost:3001/metrics`

---

🎉 **Complete monitoring solution for production-ready FinishThisIdea Platform!**