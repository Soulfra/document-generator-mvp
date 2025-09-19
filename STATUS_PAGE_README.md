# Document Generator Status Page

A professional, real-time status monitoring page for your Document Generator system - similar to services like Kener, Cachet, and Uptime Kuma.

## 🚀 Features

- **Real-time Monitoring**: Live updates via WebSocket
- **Service Health Checks**: Monitor all Document Generator services
- **Uptime Tracking**: 30-day uptime history with visual charts
- **Incident Management**: Track and display service incidents
- **Response Time Metrics**: Monitor API performance
- **Beautiful Dark UI**: Professional status page design
- **Mobile Responsive**: Works on all devices
- **Auto-refresh**: Updates every 30 seconds

## 📊 What It Monitors

- **Template Processor** (MCP) - Port 3000
- **AI API Service** - Port 3001
- **Analytics Service** - Port 3002
- **Platform Hub** - Port 8080
- **PostgreSQL Database** - Port 5432
- **Redis Cache** - Port 6379
- **MinIO Storage** - Port 9000
- **Ollama AI** - Port 11434

## 🛠️ Quick Start

### Option 1: Standalone (No Docker)

```bash
# Simple one-command start
./start-status-page.sh
```

This will:
1. Install required npm packages
2. Start the health check API (port 3333)
3. Start the status monitoring service (port 3334)
4. Start a web server for the status page (port 8888)
5. Open the status page in your browser

### Option 2: Docker Compose

```bash
# Start all services including status monitoring
docker-compose up -d

# View status page
open http://localhost:8888/status.html
```

### Option 3: Manual Start

```bash
# Install dependencies
npm install express axios ws ioredis

# Start health check API
node api/health-check.js &

# Start status monitor
node services/status-monitor.js &

# Serve the status page
npx http-server -p 8888 . &

# Open in browser
open http://localhost:8888/status.html
```

## 🔗 Endpoints

- **Status Page**: http://localhost:8888/status.html
- **Health Check API**: http://localhost:3333/health
- **Status Monitor API**: http://localhost:3334/status
- **WebSocket**: ws://localhost:3335

## 📡 API Usage

### Get Overall Health
```bash
curl http://localhost:3333/health
```

### Get Specific Service Health
```bash
curl http://localhost:3333/health/template-processor
```

### Get Service History
```bash
curl http://localhost:3334/status/template-processor/history?hours=24
```

### Get Uptime Statistics
```bash
curl http://localhost:3334/uptime/ai-api?days=30
```

## 🎨 Customization

### Modify Services
Edit the service definitions in `status.html`:

```javascript
const services = {
    core: [
        {
            name: 'Your Service',
            endpoint: 'http://localhost:port/health',
            port: 3000,
            description: 'Service description'
        }
    ]
};
```

### Change Monitoring Interval
In `services/status-monitor.js`:

```javascript
const serviceConfig = {
    checkInterval: 30000, // 30 seconds
    historyRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
};
```

### Customize UI
The status page uses CSS variables for easy theming:

```css
:root {
    --bg-primary: #0a0a0a;
    --status-operational: #10b981;
    --status-degraded: #f59e0b;
    --status-down: #ef4444;
}
```

## 🔄 Real-time Updates

The status page uses WebSocket for real-time updates:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3335');

// Listen for updates
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle status updates
};
```

## 📊 Data Storage

Status data is stored in Redis with the following structure:
- Current status: `status:current:{service}`
- History: `status:history:{service}:{hour}`
- Uptime: `status:uptime:{service}:{date}`
- Incidents: `status:incidents`

## 🚨 Incident Tracking

Incidents are automatically created when:
- A service goes down
- Response time exceeds thresholds
- Multiple consecutive failures occur

## 🔧 Health Check Configuration

Each service can define its own health check in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 📈 Metrics Available

- **Uptime Percentage**: Last 24h, 7d, 30d
- **Response Time**: Average, P95, P99
- **Request Count**: Per service
- **Error Rate**: Failures vs successes
- **Active Incidents**: Current issues

## 🔒 Security

- All endpoints use CORS headers
- No authentication required for read-only access
- WebSocket connections are local-only by default
- Health endpoints expose minimal information

## 🎯 Why Build Your Own?

As you correctly observed, many status pages are just reskinned versions of open-source projects. By building your own:

1. **Full Control**: Customize everything to your needs
2. **No Vendor Lock-in**: Own your monitoring data
3. **Cost Effective**: No monthly SaaS fees
4. **Privacy**: Keep your status data internal
5. **Integration**: Deep integration with your specific stack

## 🚀 Deploy to Production

### Option 1: Subdomain
```nginx
server {
    server_name status.yourdomain.com;
    location / {
        proxy_pass http://localhost:8888;
    }
}
```

### Option 2: GitHub Pages
1. Copy `status.html` to your GitHub Pages repo
2. Update WebSocket URL to use your production endpoints
3. Enable GitHub Pages in repo settings

### Option 3: Vercel/Netlify
1. Create `public/` directory with `status.html`
2. Deploy as static site
3. Use environment variables for API endpoints

## 📝 License

This status page is part of the Document Generator project and follows the same license terms.

---

Built with ❤️ as a modern alternative to expensive status page services.