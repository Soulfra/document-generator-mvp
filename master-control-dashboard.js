#!/usr/bin/env node

/**
 * MASTER CONTROL DASHBOARD
 * Central command center for the entire Document Generator ecosystem
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8000;

app.use(express.json());

// Service registry with real services
const services = {
  'empire-dashboard': {
    name: 'Empire Dashboard',
    port: 8888,
    path: 'empire-dashboard-fixed.js',
    process: null,
    status: 'stopped',
    health: '/api/status'
  },
  'ai-api': {
    name: 'AI API Service',
    port: 3001,
    path: 'services/real-ai-api.js',
    process: null,
    status: 'stopped',
    health: '/health'
  },
  'template-processor': {
    name: 'Template Processor',
    port: 3000,
    path: 'services/real-template-processor.js',
    process: null,
    status: 'stopped',
    health: '/health'
  },
  'ai-agents': {
    name: 'AI Agents System',
    port: 7500,
    path: 'services/real-ai-agents.js',
    process: null,
    status: 'stopped',
    health: '/health'
  },
  'gaming-websocket': {
    name: 'Gaming WebSocket',
    port: 7301,
    path: 'services/gaming-websocket.js',
    process: null,
    status: 'stopped',
    health: '/health'
  }
};

// MVP registry
const mvps = [];

// Start a service
async function startService(serviceId) {
  const service = services[serviceId];
  if (!service || service.status === 'running') return false;
  
  console.log(`🚀 Starting ${service.name} on port ${service.port}...`);
  
  const servicePath = path.join(__dirname, service.path);
  service.process = spawn('node', [servicePath], {
    detached: true,
    stdio: 'ignore'
  });
  
  service.status = 'starting';
  
  // Wait for service to be ready
  setTimeout(async () => {
    const isHealthy = await checkHealth(service);
    service.status = isHealthy ? 'running' : 'failed';
    console.log(`${isHealthy ? '✅' : '❌'} ${service.name} ${service.status}`);
  }, 3000);
  
  return true;
}

// Stop a service
async function stopService(serviceId) {
  const service = services[serviceId];
  if (!service || service.status !== 'running') return false;
  
  if (service.process) {
    try {
      process.kill(-service.process.pid);
    } catch (e) {
      // Process might already be dead
    }
    service.process = null;
  }
  
  service.status = 'stopped';
  console.log(`⏹️ Stopped ${service.name}`);
  return true;
}

// Check service health
async function checkHealth(service) {
  try {
    const response = await fetch(`http://localhost:${service.port}${service.health}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Process a business idea into MVP
async function processBusinessIdea(ideaPath) {
  console.log(`🔄 Processing business idea: ${ideaPath}`);
  
  try {
    // Read the business idea
    const content = fs.readFileSync(ideaPath, 'utf8');
    
    // Call template processor to generate MVP
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: content,
        outputPath: `/tmp/mvp-${Date.now()}`,
        autoStart: true
      })
    });
    
    if (response.ok) {
      const mvp = await response.json();
      mvps.push(mvp);
      return mvp;
    }
  } catch (error) {
    console.error('MVP generation failed:', error);
    return null;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Master Control Dashboard',
    timestamp: Date.now()
  });
});

// API: Get all service statuses
app.get('/api/services', async (req, res) => {
  const statuses = {};
  
  for (const [id, service] of Object.entries(services)) {
    const isHealthy = await checkHealth(service);
    statuses[id] = {
      ...service,
      healthy: isHealthy,
      process: undefined // Don't send process object
    };
  }
  
  res.json(statuses);
});

// API: Start a service
app.post('/api/services/:id/start', async (req, res) => {
  const success = await startService(req.params.id);
  res.json({ success });
});

// API: Stop a service
app.post('/api/services/:id/stop', async (req, res) => {
  const success = await stopService(req.params.id);
  res.json({ success });
});

// API: Start all services
app.post('/api/services/start-all', async (req, res) => {
  const results = [];
  for (const serviceId of Object.keys(services)) {
    results.push({
      service: serviceId,
      started: await startService(serviceId)
    });
    // Wait between starts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  res.json({ results });
});

// API: Process business idea
app.post('/api/process-idea', async (req, res) => {
  const { ideaPath } = req.body;
  const mvp = await processBusinessIdea(ideaPath);
  res.json({ success: !!mvp, mvp });
});

// API: Get MVPs
app.get('/api/mvps', (req, res) => {
  res.json(mvps);
});

// Main dashboard interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>🎛️ Master Control Dashboard</title>
  <style>
    body { 
      font-family: -apple-system, system-ui, monospace; 
      background: #0a0a0a; 
      color: #00ff41; 
      margin: 0;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
      border-bottom: 2px solid #00ff41;
      padding: 20px;
      text-align: center;
    }
    .container { 
      max-width: 1400px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .card {
      background: #111;
      border: 1px solid #00ff41;
      border-radius: 10px;
      padding: 20px;
      transition: all 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 255, 65, 0.3);
    }
    .service-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      margin: 10px 0;
      background: rgba(0, 255, 65, 0.05);
      border: 1px solid #333;
      border-radius: 5px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 10px;
    }
    .status-running { background: #00ff41; box-shadow: 0 0 10px #00ff41; }
    .status-stopped { background: #666; }
    .status-starting { background: #ffaa00; animation: pulse 1s infinite; }
    .status-failed { background: #ff4444; }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .button {
      background: #00ff41;
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s;
      margin: 5px;
    }
    .button:hover {
      background: #00cc33;
      transform: scale(1.05);
    }
    .button:disabled {
      background: #666;
      cursor: not-allowed;
      transform: none;
    }
    .button-stop {
      background: #ff4444;
    }
    .button-stop:hover {
      background: #cc0000;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      background: rgba(0, 255, 65, 0.1);
      border: 1px solid #00ff41;
      border-radius: 10px;
      min-width: 150px;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #00ff41;
    }
    .console {
      background: #000;
      border: 1px solid #00ff41;
      border-radius: 5px;
      padding: 15px;
      font-family: monospace;
      height: 200px;
      overflow-y: auto;
      margin-top: 20px;
    }
    .log-entry {
      margin: 2px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎛️ MASTER CONTROL DASHBOARD</h1>
    <p>Central Command for Document Generator Ecosystem</p>
    <div>
      <button class="button" onclick="startAll()">🚀 Start All Services</button>
      <button class="button" onclick="refreshStatus()">🔄 Refresh</button>
      <button class="button" onclick="emergencyStop()">🛑 Emergency Stop</button>
    </div>
  </div>
  
  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value" id="running-count">0</div>
        <div>Running Services</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="mvp-count">0</div>
        <div>Generated MVPs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="ideas-count">7137</div>
        <div>Business Ideas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="uptime">0m</div>
        <div>Uptime</div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>🔧 Core Services</h3>
        <div id="services-list"></div>
      </div>
      
      <div class="card">
        <h3>🚀 Quick Actions</h3>
        <button class="button" onclick="openService('empire-dashboard')">📊 Empire Dashboard</button>
        <button class="button" onclick="openService('ai-api')">🤖 AI API</button>
        <button class="button" onclick="openService('template-processor')">🎨 Templates</button>
        <button class="button" onclick="openService('ai-agents')">🤖 AI Agents</button>
        <button class="button" onclick="processIdea()">💡 Process Business Idea</button>
      </div>
      
      <div class="card">
        <h3>📈 System Health</h3>
        <div id="health-status"></div>
      </div>
    </div>
    
    <div class="console">
      <h3>📋 System Console</h3>
      <div id="console-output"></div>
    </div>
  </div>
  
  <script>
    let services = {};
    let startTime = Date.now();
    
    function log(message) {
      const console = document.getElementById('console-output');
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      console.appendChild(entry);
      console.scrollTop = console.scrollHeight;
    }
    
    async function refreshStatus() {
      try {
        const response = await fetch('/api/services');
        services = await response.json();
        updateUI();
      } catch (error) {
        log('Error fetching status: ' + error.message);
      }
    }
    
    function updateUI() {
      // Update services list
      const servicesList = document.getElementById('services-list');
      servicesList.innerHTML = Object.entries(services).map(([id, service]) => \`
        <div class="service-item">
          <div>
            <span class="status-indicator status-\${service.status}"></span>
            <strong>\${service.name}</strong>
            <span style="color: #666">:\${service.port}</span>
          </div>
          <div>
            \${service.status === 'running' 
              ? \`<button class="button button-stop" onclick="stopService('\${id}')">Stop</button>\`
              : \`<button class="button" onclick="startService('\${id}')">Start</button>\`
            }
          </div>
        </div>
      \`).join('');
      
      // Update counts
      const runningCount = Object.values(services).filter(s => s.status === 'running').length;
      document.getElementById('running-count').textContent = runningCount;
      
      // Update uptime
      const uptime = Math.floor((Date.now() - startTime) / 60000);
      document.getElementById('uptime').textContent = uptime + 'm';
      
      // Update health status
      const healthStatus = document.getElementById('health-status');
      const totalServices = Object.keys(services).length;
      const healthPercent = Math.floor((runningCount / totalServices) * 100);
      
      healthStatus.innerHTML = \`
        <div style="margin: 10px 0;">
          <div>System Health: <strong>\${healthPercent}%</strong></div>
          <div style="background: #333; height: 20px; border-radius: 10px; margin-top: 10px;">
            <div style="background: #00ff41; height: 100%; width: \${healthPercent}%; border-radius: 10px; transition: width 0.5s;"></div>
          </div>
        </div>
      \`;
    }
    
    async function startService(id) {
      log(\`Starting \${services[id].name}...\`);
      const response = await fetch(\`/api/services/\${id}/start\`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        log(\`✅ \${services[id].name} started\`);
      } else {
        log(\`❌ Failed to start \${services[id].name}\`);
      }
      
      setTimeout(refreshStatus, 2000);
    }
    
    async function stopService(id) {
      log(\`Stopping \${services[id].name}...\`);
      const response = await fetch(\`/api/services/\${id}/stop\`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        log(\`⏹️ \${services[id].name} stopped\`);
      }
      
      refreshStatus();
    }
    
    async function startAll() {
      log('🚀 Starting all services...');
      const response = await fetch('/api/services/start-all', { method: 'POST' });
      const result = await response.json();
      
      result.results.forEach(r => {
        log(\`\${r.started ? '✅' : '❌'} \${services[r.service].name}\`);
      });
      
      setTimeout(refreshStatus, 3000);
    }
    
    function emergencyStop() {
      if (confirm('Stop all services?')) {
        Object.keys(services).forEach(id => {
          if (services[id].status === 'running') {
            stopService(id);
          }
        });
      }
    }
    
    function openService(id) {
      const service = services[id];
      if (service && service.status === 'running') {
        window.open(\`http://localhost:\${service.port}\`, '_blank');
      } else {
        alert('Service not running. Start it first!');
      }
    }
    
    async function processIdea() {
      const ideaPath = prompt('Enter path to business idea document:');
      if (!ideaPath) return;
      
      log(\`Processing business idea: \${ideaPath}\`);
      
      const response = await fetch('/api/process-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaPath })
      });
      
      const result = await response.json();
      
      if (result.success) {
        log(\`✅ MVP generated: \${result.mvp.name}\`);
        document.getElementById('mvp-count').textContent = 
          parseInt(document.getElementById('mvp-count').textContent) + 1;
      } else {
        log('❌ Failed to generate MVP');
      }
    }
    
    // Auto-refresh every 5 seconds
    setInterval(refreshStatus, 5000);
    
    // Initial load
    refreshStatus();
    log('🎛️ Master Control Dashboard initialized');
  </script>
</body>
</html>
  `);
});

// Start the dashboard
app.listen(PORT, () => {
  console.log(`
🎛️ Master Control Dashboard Started!
📍 URL: http://localhost:${PORT}
✅ Managing ${Object.keys(services).length} services
🚀 Ready to orchestrate your business empire
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Shutting down Master Control...');
  
  // Stop all services
  Object.keys(services).forEach(id => {
    if (services[id].status === 'running') {
      stopService(id);
    }
  });
  
  process.exit(0);
});

module.exports = app;