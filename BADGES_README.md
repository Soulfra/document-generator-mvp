# 🛡️ Document Generator Status Badges

Real-time status badges for all Document Generator services - perfect for GitHub README files!

## 🚀 Quick Start

Add these badges to your README to show real-time service status:

```markdown
![Template Processor](http://localhost:3333/badge/template-processor/status)
![AI API](http://localhost:3333/badge/ai-api/status)
![PostgreSQL](http://localhost:3333/badge/postgres/status)
![Redis](http://localhost:3333/badge/redis/status)
```

## 📊 Live Status Badges

### Core Services

![Template Processor Status](http://localhost:3333/badge/template-processor/status)
![Template Processor Uptime](http://localhost:3333/badge/template-processor/uptime)
![Template Processor Response](http://localhost:3333/badge/template-processor/response)

![AI API Status](http://localhost:3333/badge/ai-api/status)
![AI API Uptime](http://localhost:3333/badge/ai-api/uptime)
![AI API Response](http://localhost:3333/badge/ai-api/response)

![Analytics Status](http://localhost:3333/badge/analytics/status)
![Platform Hub Status](http://localhost:3333/badge/platform-hub/status)

### Infrastructure

![PostgreSQL Status](http://localhost:3333/badge/postgres/status)
![PostgreSQL Connection](http://localhost:3333/badge/postgres/database)

![Redis Status](http://localhost:3333/badge/redis/status)
![Redis Connection](http://localhost:3333/badge/redis/database)

![MinIO Status](http://localhost:3333/badge/minio/status)
![Ollama Status](http://localhost:3333/badge/ollama/status)

## 🎨 Badge Types

### Status Badge
Shows operational status of the service
```markdown
![Service Status](http://localhost:3333/badge/{service}/status)
```

### Uptime Badge
Shows uptime percentage
```markdown
![Service Uptime](http://localhost:3333/badge/{service}/uptime)
```

### Response Time Badge
Shows average response time
```markdown
![Service Response](http://localhost:3333/badge/{service}/response)
```

### Docker Badge
Shows Docker container status
```markdown
![Service Docker](http://localhost:3333/badge/{service}/docker)
```

### Database Connection Badge
Shows database connection status (PostgreSQL/Redis only)
```markdown
![Database Connection](http://localhost:3333/badge/{service}/database)
```

## 🎯 Available Services

| Service | Key | Description |
|---------|-----|-------------|
| Template Processor | `template-processor` | MCP Template processing service |
| AI API | `ai-api` | AI integration service |
| Analytics | `analytics` | Analytics and metrics |
| Platform Hub | `platform-hub` | Main platform interface |
| PostgreSQL | `postgres` | Primary database |
| Redis | `redis` | Cache layer |
| MinIO | `minio` | Object storage |
| Ollama | `ollama` | Local AI models |

## 🎨 Badge Styles

Add `?style=` parameter to customize badge appearance:

### Flat (Default)
```markdown
![Status](http://localhost:3333/badge/template-processor/status?style=flat)
```
![Flat Style](http://localhost:3333/badge/template-processor/status?style=flat)

### Flat Square
```markdown
![Status](http://localhost:3333/badge/template-processor/status?style=flat-square)
```
![Flat Square Style](http://localhost:3333/badge/template-processor/status?style=flat-square)

### For The Badge
```markdown
![Status](http://localhost:3333/badge/template-processor/status?style=for-the-badge)
```
![For The Badge Style](http://localhost:3333/badge/template-processor/status?style=for-the-badge)

## 🔗 Shields.io Integration

Use our JSON endpoints with shields.io for dynamic badges:

```markdown
![Dynamic Badge](https://img.shields.io/endpoint?url=http://localhost:3333/badge/template-processor/status/json)
```

## 📋 Badge Examples for README

### Complete Service Status Row
```markdown
## 🚦 Service Status

![Template Processor](http://localhost:3333/badge/template-processor/status)
![AI API](http://localhost:3333/badge/ai-api/status)
![Analytics](http://localhost:3333/badge/analytics/status)
![PostgreSQL](http://localhost:3333/badge/postgres/status)
![Redis](http://localhost:3333/badge/redis/status)
```

### Detailed Service Card
```markdown
### Template Processor
![Status](http://localhost:3333/badge/template-processor/status)
![Uptime](http://localhost:3333/badge/template-processor/uptime)
![Response Time](http://localhost:3333/badge/template-processor/response)
![Docker](http://localhost:3333/badge/template-processor/docker)
```

### Infrastructure Health
```markdown
### 🏗️ Infrastructure Health
| Service | Status | Connection | Response Time |
|---------|--------|------------|---------------|
| PostgreSQL | ![Status](http://localhost:3333/badge/postgres/status) | ![Connection](http://localhost:3333/badge/postgres/database) | ![Response](http://localhost:3333/badge/postgres/response) |
| Redis | ![Status](http://localhost:3333/badge/redis/status) | ![Connection](http://localhost:3333/badge/redis/database) | ![Response](http://localhost:3333/badge/redis/response) |
```

## 🌐 Production Deployment

For production use, replace `localhost:3333` with your domain:

```markdown
![Status](https://status.yourdomain.com/badge/template-processor/status)
```

### GitHub Pages Integration
1. Set up reverse proxy or CORS for your health check API
2. Update badge URLs to use your production domain
3. Badges will update in real-time on GitHub

### CDN Caching
Add cache-busting parameter for always-fresh badges:
```markdown
![Status](http://localhost:3333/badge/service/status?t=timestamp)
```

## 📊 API Endpoints

### Badge Endpoints
- `GET /badge/:service/:type` - Generate SVG badge
- `GET /badge/:service/:type/json` - Shields.io compatible JSON
- `GET /badges` - List all available badges
- `GET /badges/showcase` - Visual badge showcase

### Health Check Endpoints
- `GET /health` - Overall system health
- `GET /health/:service` - Individual service health
- `GET /metrics` - System metrics
- `GET /status-data` - Complete status data

## 🛠️ Custom Badge Creation

Create custom badges using the API:

```javascript
// Example: Custom metric badge
fetch('http://localhost:3333/badge/custom/metric', {
  method: 'POST',
  body: JSON.stringify({
    label: 'Custom Metric',
    message: '42',
    color: 'blue'
  })
})
```

## 🔧 Running the Badge Service

```bash
# Start the health check API with badge support
node api/health-check.js

# Or use the all-in-one startup script
./start-status-page.sh
```

## 📈 SEO & GitHub Benefits

Using status badges in your README:
- ✅ Shows project is actively maintained
- ✅ Demonstrates professional infrastructure
- ✅ Increases trust and credibility
- ✅ Improves GitHub repository ranking
- ✅ Makes your project stand out in search results

## 🎯 Best Practices

1. **Place badges at the top** of your README for maximum visibility
2. **Group related badges** together (e.g., all database badges)
3. **Use consistent styling** across all badges
4. **Update badge URLs** when deploying to production
5. **Monitor badge performance** to ensure they load quickly

## 🔍 Troubleshooting

### Badges showing "unknown" or "error"
- Ensure health check API is running: `http://localhost:3333/health`
- Check if services are accessible from the health check API
- Verify service names match the expected keys

### Badges not updating
- Badges have cache headers disabled for real-time updates
- Add `?t=${Date.now()}` for cache busting if needed
- Check WebSocket connection for real-time updates

### Custom domain issues
- Configure CORS headers in health-check.js
- Set up proper reverse proxy for HTTPS
- Update badge URLs to use your domain

---

**Note**: These badges provide real-time status monitoring for all Document Generator services. They're perfect for GitHub READMEs, documentation, and status dashboards!