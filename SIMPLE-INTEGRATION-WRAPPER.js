#!/usr/bin/env node

/**
 * SIMPLE INTEGRATION WRAPPER
 * Connects all your existing working services without the bullshit
 * Just makes everything work together as one unified system
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs').promises;
const axios = require('axios');

console.log(`
🔗 SIMPLE INTEGRATION WRAPPER
============================
Connecting all your working shit together
`);

class SimpleIntegrationWrapper {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.services = {
      forum: { url: 'http://localhost:4000', status: 'unknown' },
      navigation: { url: 'http://localhost:3500', status: 'unknown' },
      vault: { url: 'http://localhost:8888', status: 'unknown' },
      postgres: { url: 'postgresql://localhost:5432', status: 'unknown' },
      redis: { url: 'redis://localhost:6379', status: 'unknown' }
    };
    
    this.integrationPort = 7001;
    this.init();
  }
  
  async init() {
    console.log('🔗 Initializing simple integration wrapper...');
    
    // Setup express middleware
    this.app.use(express.json());
    this.app.use(express.static('.'));
    
    // Check all services
    await this.checkAllServices();
    
    // Setup routes
    this.setupRoutes();
    
    // Setup WebSocket
    this.setupWebSocket();
    
    // Start server
    this.startServer();
  }
  
  async checkAllServices() {
    console.log('🔍 Checking all services...');
    
    for (const [name, config] of Object.entries(this.services)) {
      try {
        if (name === 'postgres' || name === 'redis') {
          // Skip database checks for now
          config.status = 'assumed-working';
          continue;
        }
        
        const response = await axios.get(config.url, { timeout: 2000 });
        config.status = 'working';
        console.log(`  ✅ ${name}: WORKING`);
      } catch (error) {
        config.status = 'broken';
        console.log(`  ❌ ${name}: BROKEN`);
      }
    }
  }
  
  setupRoutes() {
    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboard());
    });
    
    // Service status
    this.app.get('/api/status', (req, res) => {
      res.json({
        services: this.services,
        integration: 'working',
        timestamp: new Date().toISOString()
      });
    });
    
    // Forum proxy
    this.app.all('/forum/*', async (req, res) => {
      await this.proxyRequest('forum', req, res);
    });
    
    // Navigation proxy
    this.app.all('/nav/*', async (req, res) => {
      await this.proxyRequest('navigation', req, res);
    });
    
    // Vault proxy
    this.app.all('/vault/*', async (req, res) => {
      await this.proxyRequest('vault', req, res);
    });
    
    // Test all systems
    this.app.post('/api/test-all', async (req, res) => {
      const results = await this.testAllSystems();
      res.json(results);
    });
    
    // Quick actions
    this.app.post('/api/action/:action', async (req, res) => {
      const result = await this.executeAction(req.params.action);
      res.json(result);
    });
  }
  
  async proxyRequest(serviceName, req, res) {
    const service = this.services[serviceName];
    
    if (service.status !== 'working') {
      return res.status(503).json({ error: `${serviceName} service not available` });
    }
    
    try {
      const url = req.originalUrl.replace(`/${serviceName === 'navigation' ? 'nav' : serviceName}`, '');
      const targetUrl = service.url + url;
      
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: req.headers,
        timeout: 10000
      });
      
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({ error: `Proxy error: ${error.message}` });
    }
  }
  
  async testAllSystems() {
    console.log('🧪 Testing all systems...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test services
    for (const [name, config] of Object.entries(this.services)) {
      results.tests[name] = {
        status: config.status,
        url: config.url
      };
    }
    
    // Test file system
    const criticalFiles = [
      'package.json',
      'YOUR-TESTING-SUITE.py',
      'crypto-key-vault-layer.js',
      'SOULFRA-FORUM-VERIFICATION-SYSTEM.js'
    ];
    
    results.tests.filesystem = { files: {} };
    for (const file of criticalFiles) {
      try {
        await fs.access(file);
        results.tests.filesystem.files[file] = 'exists';
      } catch {
        results.tests.filesystem.files[file] = 'missing';
      }
    }
    
    return results;
  }
  
  async executeAction(action) {
    console.log(`🎯 Executing action: ${action}`);
    
    switch (action) {
      case 'restart-services':
        return this.restartServices();
      
      case 'run-tests':
        return this.runTestSuite();
      
      case 'backup':
        return this.createBackup();
      
      case 'check-health':
        return this.checkHealth();
      
      default:
        return { error: 'Unknown action' };
    }
  }
  
  async restartServices() {
    // Kill and restart problematic services
    const commands = [
      'pkill -f "SOULFRA-FORUM-VERIFICATION-SYSTEM.js" || true',
      'pkill -f "SOULFRA-TREASURE-MAP-NAVIGATION.js" || true', 
      'pkill -f "crypto-key-vault-layer.js" || true',
      'sleep 2',
      'node SOULFRA-FORUM-VERIFICATION-SYSTEM.js &',
      'node SOULFRA-TREASURE-MAP-NAVIGATION.js &',
      'node crypto-key-vault-layer.js &'
    ];
    
    try {
      for (const cmd of commands) {
        await new Promise((resolve, reject) => {
          exec(cmd, (error, stdout, stderr) => {
            if (error && !cmd.includes('pkill')) reject(error);
            else resolve({ stdout, stderr });
          });
        });
      }
      
      // Wait for services to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Recheck services
      await this.checkAllServices();
      
      return { success: true, message: 'Services restarted' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async runTestSuite() {
    return new Promise((resolve) => {
      exec('python3 YOUR-TESTING-SUITE.py', (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr
        });
      });
    });
  }
  
  async createBackup() {
    return new Promise((resolve) => {
      exec('node SOULFRA-COMPREHENSIVE-BACKUP-REHYDRATION-SYSTEM.js backup', (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr
        });
      });
    });
  }
  
  async checkHealth() {
    await this.checkAllServices();
    const testResults = await this.testAllSystems();
    
    const workingServices = Object.values(this.services)
      .filter(s => s.status === 'working').length;
    const totalServices = Object.keys(this.services).length;
    
    return {
      overall: workingServices === totalServices ? 'healthy' : 'degraded',
      services: this.services,
      working: workingServices,
      total: totalServices,
      percentage: Math.round((workingServices / totalServices) * 100),
      tests: testResults
    };
  }
  
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('📡 WebSocket client connected');
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        services: this.services
      }));
      
      // Handle messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.action) {
            const result = await this.executeAction(data.action);
            ws.send(JSON.stringify({
              type: 'action-result',
              action: data.action,
              result
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
    });
    
    // Broadcast status updates every 30 seconds
    setInterval(async () => {
      await this.checkAllServices();
      
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'status-update',
            services: this.services,
            timestamp: new Date().toISOString()
          }));
        }
      });
    }, 30000);
  }
  
  generateDashboard() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🔗 Simple Integration Wrapper</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #111;
            color: #0f0;
            font-family: 'Courier New', monospace;
        }
        
        .header {
            text-align: center;
            font-size: 36px;
            margin-bottom: 30px;
            text-shadow: 0 0 10px #0f0;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .service-card {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #0f0;
            border-radius: 10px;
            padding: 20px;
        }
        
        .service-card.working {
            border-color: #0f0;
            background: rgba(0, 255, 0, 0.2);
        }
        
        .service-card.broken {
            border-color: #f00;
            background: rgba(255, 0, 0, 0.1);
            color: #f00;
        }
        
        .service-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .service-url {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 10px;
        }
        
        .service-status {
            font-size: 16px;
            font-weight: bold;
        }
        
        .actions {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .action-btn {
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #0f0;
            color: #0f0;
            padding: 15px 30px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
        }
        
        .action-btn:hover {
            background: rgba(0, 255, 0, 0.4);
            transform: translateY(-2px);
        }
        
        .output {
            background: #000;
            border: 1px solid #0f0;
            border-radius: 5px;
            padding: 20px;
            min-height: 200px;
            white-space: pre-wrap;
            font-size: 12px;
            overflow-y: auto;
            max-height: 400px;
        }
        
        .quick-links {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .quick-link {
            background: rgba(0, 0, 255, 0.2);
            border: 2px solid #00f;
            color: #00f;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
        }
        
        .quick-link:hover {
            background: rgba(0, 0, 255, 0.4);
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="header">🔗 SIMPLE INTEGRATION WRAPPER</div>
    
    <div class="quick-links">
        <a href="/forum/" class="quick-link">🏛️ Forum</a>
        <a href="/nav/" class="quick-link">🗺️ Navigation</a>
        <a href="/vault/status" class="quick-link">🔐 Vault</a>
        <a href="/api/status" class="quick-link">📊 API Status</a>
    </div>
    
    <div class="services-grid" id="services">
        <!-- Services will be populated here -->
    </div>
    
    <div class="actions">
        <button class="action-btn" onclick="executeAction('check-health')">🏥 Check Health</button>
        <button class="action-btn" onclick="executeAction('run-tests')">🧪 Run Tests</button>
        <button class="action-btn" onclick="executeAction('restart-services')">🔄 Restart Services</button>
        <button class="action-btn" onclick="executeAction('backup')">💾 Create Backup</button>
    </div>
    
    <div class="output" id="output">
🔗 Simple Integration Wrapper Online
📡 Connecting to services...
⚡ Ready to integrate everything!

This wrapper connects all your working services:
• Forum system on port 4000
• Navigation on port 3500  
• Crypto vault on port 8888
• All your 46+ Node processes
• Databases and file systems

Click actions above to test and manage everything.
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:7001');
        const output = document.getElementById('output');
        const servicesDiv = document.getElementById('services');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status' || data.type === 'status-update') {
                updateServices(data.services);
            }
            
            if (data.type === 'action-result') {
                output.textContent += \`\\n[\\${new Date().toLocaleTimeString()}] \\${data.action}: \\${JSON.stringify(data.result, null, 2)}\`;
                output.scrollTop = output.scrollHeight;
            }
        };
        
        function updateServices(services) {
            servicesDiv.innerHTML = '';
            
            for (const [name, config] of Object.entries(services)) {
                const card = document.createElement('div');
                card.className = \`service-card \\${config.status}\`;
                card.innerHTML = \`
                    <div class="service-name">\\${name.toUpperCase()}</div>
                    <div class="service-url">\\${config.url}</div>
                    <div class="service-status">\\${config.status.toUpperCase()}</div>
                \`;
                servicesDiv.appendChild(card);
            }
        }
        
        function executeAction(action) {
            ws.send(JSON.stringify({ action }));
            output.textContent += \`\\n[\\${new Date().toLocaleTimeString()}] Executing \\${action}...\`;
            output.scrollTop = output.scrollHeight;
        }
        
        // Initial status check
        fetch('/api/status')
            .then(r => r.json())
            .then(data => updateServices(data.services));
    </script>
</body>
</html>`;
  }
  
  startServer() {
    this.server.listen(this.integrationPort, () => {
      console.log(`
✅ SIMPLE INTEGRATION WRAPPER READY!
=====================================

🌐 Dashboard: http://localhost:${this.integrationPort}
📡 WebSocket: ws://localhost:${this.integrationPort}

🔗 Service Proxies:
• Forum: http://localhost:${this.integrationPort}/forum/
• Navigation: http://localhost:${this.integrationPort}/nav/
• Vault: http://localhost:${this.integrationPort}/vault/

🎯 This wrapper connects all your existing services.
   No complex orchestration, just practical integration.
      `);
    });
  }
}

// Start the wrapper
if (require.main === module) {
  new SimpleIntegrationWrapper();
}

module.exports = SimpleIntegrationWrapper;