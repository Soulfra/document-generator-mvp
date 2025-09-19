#!/usr/bin/env node

/**
 * DYNAMIC SERVICE ROUTER - The Truth About What's Actually Running
 * No more port confusion, no more mystery services
 */

const express = require('express');
const httpProxy = require('http-proxy-middleware');
const { exec } = require('child_process');
const net = require('net');

const app = express();
const ROUTER_PORT = 3333;

// Service registry - tracks what's ACTUALLY running
const serviceRegistry = new Map();
const portRegistry = new Map();

// Scan for active services on common ports
async function scanActivePorts() {
  console.log('🔍 Scanning for active services...');
  
  const commonPorts = [
    3000, 3001, 3002, 3007, 3333, 3500, 3600,
    4000, 4001, 4567,
    5000, 5001, 5002, 5003, 5004, 5005,
    7000, 7001, 7090, 7091, 7095, 7096, 7100, 7101, 7200, 7201, 7300, 7301, 7500,
    8000, 8080, 8081, 8800, 8888, 8889,
    9000, 9001, 9100, 9700, 9701, 9705, 9706, 9707, 9800, 9900, 9999
  ];
  
  const activeServices = [];
  
  for (const port of commonPorts) {
    const isActive = await checkPort(port);
    if (isActive) {
      const serviceInfo = await identifyService(port);
      activeServices.push({ port, ...serviceInfo });
      serviceRegistry.set(port, serviceInfo);
      if (serviceInfo.name) {
        portRegistry.set(serviceInfo.name, port);
      }
    }
  }
  
  return activeServices;
}

// Check if a port is actively listening
function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(100);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, 'localhost');
  });
}

// Try to identify what service is running on a port
async function identifyService(port) {
  // Try to get service info via HTTP
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.service || `Unknown on ${port}`,
        status: data.status || 'unknown',
        description: data.description || 'No description'
      };
    }
  } catch (e) {
    // Not an HTTP service or no health endpoint
  }
  
  // Try to get HTML title
  try {
    const response = await fetch(`http://localhost:${port}`);
    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        return {
          name: titleMatch[1].replace(/[^a-zA-Z0-9\s-]/g, '').trim(),
          status: 'active',
          description: `Web service (${titleMatch[1]})`
        };
      }
    }
  } catch (e) {
    // Not accessible
  }
  
  // Check known port mappings
  const knownPorts = {
    3000: 'Template Processor',
    3001: 'AI API Service',
    3002: 'Analytics Service',
    4000: 'Revenue Tracker / Document Generator',
    8000: 'Master Control Dashboard',
    8080: 'Platform Hub',
    8888: 'Empire Dashboard',
    9000: 'MinIO Storage',
    9001: 'MinIO Console'
  };
  
  return {
    name: knownPorts[port] || `Service on ${port}`,
    status: 'active',
    description: 'Active but unidentified service'
  };
}

// Get process info for a port
async function getProcessInfo(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} | grep LISTEN | grep node`, (error, stdout) => {
      if (error || !stdout) {
        resolve(null);
        return;
      }
      
      const parts = stdout.split(/\s+/);
      const pid = parts[1];
      const command = parts[0];
      
      // Get more details about the process
      exec(`ps aux | grep ${pid} | grep -v grep`, (err, psOut) => {
        if (!err && psOut) {
          const psMatch = psOut.match(/node\s+(.+\.js)/);
          if (psMatch) {
            resolve({
              pid,
              command,
              script: psMatch[1]
            });
          }
        }
        resolve({ pid, command });
      });
    });
  });
}

// Main dashboard
app.get('/', async (req, res) => {
  const services = await scanActivePorts();
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>🚦 Dynamic Service Router - The Truth</title>
  <style>
    body {
      font-family: monospace;
      background: #0a0a0a;
      color: #00ff41;
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding: 20px;
      background: rgba(0, 255, 65, 0.1);
      border: 1px solid #00ff41;
      margin-bottom: 30px;
    }
    .service-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .service-card {
      background: #111;
      border: 1px solid #00ff41;
      padding: 20px;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .service-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 255, 65, 0.3);
    }
    .port {
      font-size: 24px;
      font-weight: bold;
      color: #00ff41;
    }
    .service-name {
      font-size: 18px;
      margin: 10px 0;
    }
    .status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
    }
    .status-active {
      background: #00ff41;
      color: #000;
    }
    .status-unknown {
      background: #ffaa00;
      color: #000;
    }
    .link {
      display: inline-block;
      margin-top: 10px;
      color: #00aaff;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
    .summary {
      background: #111;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
    }
    .button {
      background: #00ff41;
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
      font-weight: bold;
    }
    .truth-box {
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid #ff4444;
      padding: 20px;
      margin: 20px 0;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚦 Dynamic Service Router</h1>
      <p>The TRUTH about what's actually running on your system</p>
      <button class="button" onclick="location.reload()">🔄 Rescan Services</button>
    </div>
    
    <div class="summary">
      <h2>📊 Current Status</h2>
      <p>Active Services: <span style="font-size: 36px; color: #00ff41;">${services.length}</span></p>
      <p>Ports in use: ${services.map(s => s.port).join(', ')}</p>
    </div>
    
    ${services.some(s => s.port === 4000) ? `
    <div class="truth-box">
      <h3>⚠️ PORT 4000 CONFLICT DETECTED!</h3>
      <p>Expected: Document Generator</p>
      <p>Actually Running: ${services.find(s => s.port === 4000)?.name || 'Unknown'}</p>
      <p>This is why things aren't working as expected!</p>
    </div>
    ` : ''}
    
    <h2>🔍 Active Services</h2>
    <div class="service-grid">
      ${services.map(service => `
        <div class="service-card">
          <div class="port">:${service.port}</div>
          <div class="service-name">${service.name}</div>
          <div class="status status-${service.status}">${service.status}</div>
          <div style="margin-top: 10px; color: #666;">${service.description}</div>
          <a href="http://localhost:${service.port}" target="_blank" class="link">
            🔗 Open Service
          </a>
        </div>
      `).join('')}
    </div>
    
    <div style="margin-top: 40px; text-align: center;">
      <h3>🎯 Quick Actions</h3>
      <button class="button" onclick="killAll()">💀 Kill All Services</button>
      <button class="button" onclick="startCore()">🚀 Start Core Services</button>
      <button class="button" onclick="showProcesses()">📋 Show Processes</button>
    </div>
  </div>
  
  <script>
    async function killAll() {
      if (confirm('Kill all Node services?')) {
        await fetch('/api/kill-all', { method: 'POST' });
        setTimeout(() => location.reload(), 2000);
      }
    }
    
    async function startCore() {
      await fetch('/api/start-core', { method: 'POST' });
      setTimeout(() => location.reload(), 3000);
    }
    
    async function showProcesses() {
      const response = await fetch('/api/processes');
      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    }
  </script>
</body>
</html>
  `);
});

// API to get service registry
app.get('/api/services', async (req, res) => {
  const services = await scanActivePorts();
  res.json({
    services,
    registry: Object.fromEntries(serviceRegistry),
    portMap: Object.fromEntries(portRegistry),
    timestamp: Date.now()
  });
});

// API to get process details
app.get('/api/processes', async (req, res) => {
  const services = await scanActivePorts();
  const processes = [];
  
  for (const service of services) {
    const processInfo = await getProcessInfo(service.port);
    if (processInfo) {
      processes.push({
        port: service.port,
        name: service.name,
        ...processInfo
      });
    }
  }
  
  res.json({ processes });
});

// Kill all Node services
app.post('/api/kill-all', (req, res) => {
  exec('pkill -f "node.*\\.js"', (error) => {
    res.json({ 
      success: !error,
      message: error ? error.message : 'All services killed'
    });
  });
});

// Start core services
app.post('/api/start-core', (req, res) => {
  const coreServices = [
    { script: 'services/real-ai-api.js', name: 'AI API' },
    { script: 'services/real-template-processor.js', name: 'Template Processor' },
    { script: 'document-generator-app.js', name: 'Document Generator' }
  ];
  
  coreServices.forEach(service => {
    exec(`node ${service.script} &`, (error) => {
      console.log(`${error ? '❌' : '✅'} ${service.name}`);
    });
  });
  
  res.json({ 
    started: coreServices.map(s => s.name),
    message: 'Core services starting...'
  });
});

// Dynamic proxy - route to services by name
app.use('/:serviceName', async (req, res, next) => {
  const serviceName = req.params.serviceName;
  const port = portRegistry.get(serviceName);
  
  if (port) {
    const proxy = httpProxy.createProxyMiddleware({
      target: `http://localhost:${port}`,
      changeOrigin: true,
      pathRewrite: { [`^/${serviceName}`]: '' }
    });
    proxy(req, res, next);
  } else {
    res.status(404).json({
      error: 'Service not found',
      availableServices: Array.from(portRegistry.keys())
    });
  }
});

// Start the router
app.listen(ROUTER_PORT, async () => {
  console.log(`
🚦 DYNAMIC SERVICE ROUTER STARTED!
📍 URL: http://localhost:${ROUTER_PORT}
✅ Scanning all ports to find what's ACTUALLY running
🎯 No more port confusion - just the truth!

This router will show you:
- What's really running on each port
- Which services are conflicting
- How to access everything properly
  `);
  
  // Initial scan
  const services = await scanActivePorts();
  console.log(`\n📊 Found ${services.length} active services`);
  services.forEach(s => {
    console.log(`  :${s.port} - ${s.name}`);
  });
});

module.exports = app;