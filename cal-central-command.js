#!/usr/bin/env node

/**
 * CAL CENTRAL COMMAND
 * 
 * The ACTUAL working dashboard where Cal can:
 * - See REAL logs from Docker and Node services
 * - Execute REAL commands to fix things
 * - Restart broken services
 * - Apply learned fixes
 * - Monitor everything in ONE place
 * 
 * No more wrappers. This actually does stuff.
 */

const express = require('express');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const PORT = 7777;

console.log(`
🎮 CAL CENTRAL COMMAND 🎮
The REAL dashboard that actually works
Port: ${PORT}
`);

class CalCentralCommand {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    // Cal's state
    this.cal = {
      mood: 'cautiously optimistic',
      coffeeLevel: 100,
      blameCount: 0,
      lastComment: null
    };

    // Track all services
    this.services = {
      docker: new Map(),
      node: new Map(),
      health: new Map()
    };

    // Learned fixes database
    this.fixes = new Map();
    this.loadLearnedFixes();

    this.setupServer();
    this.startMonitoring();
  }

  setupServer() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboard());
    });

    // API endpoints for REAL actions
    this.app.get('/api/services', async (req, res) => {
      res.json(await this.getAllServices());
    });

    this.app.post('/api/restart/:type/:name', async (req, res) => {
      const result = await this.restartService(req.params.type, req.params.name);
      res.json(result);
    });

    this.app.get('/api/logs/:type/:name', async (req, res) => {
      const logs = await this.getServiceLogs(req.params.type, req.params.name);
      res.json({ logs });
    });

    this.app.post('/api/fix/:service', async (req, res) => {
      const result = await this.applyFix(req.params.service);
      res.json(result);
    });

    this.app.get('/api/cal/status', (req, res) => {
      res.json(this.cal);
    });

    this.app.post('/api/cal/coffee', (req, res) => {
      this.cal.coffeeLevel = 100;
      this.cal.mood = 'ready to debug';
      res.json({ message: "☕ Coffee refilled! Cal is ready!" });
    });

    // WebSocket for real-time updates
    this.wss.on('connection', (ws) => {
      console.log('🔌 Dashboard connected');
      ws.send(JSON.stringify({ type: 'connected', cal: this.cal }));
    });

    this.server.listen(PORT, () => {
      console.log(`🌐 Cal Central Command running at http://localhost:${PORT}`);
      console.log('🎮 Open in browser to control everything!');
    });
  }

  async startMonitoring() {
    console.log('👀 Starting real-time monitoring...');
    
    // Monitor every 5 seconds
    setInterval(async () => {
      await this.checkDockerServices();
      await this.checkNodeServices();
      await this.updateHealthStatus();
      
      // Broadcast updates
      this.broadcast({
        type: 'update',
        services: await this.getAllServices(),
        cal: this.cal
      });
    }, 5000);
  }

  async checkDockerServices() {
    try {
      const { stdout } = await execAsync('docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}"');
      const lines = stdout.trim().split('\n').filter(Boolean);
      
      this.services.docker.clear();
      
      for (const line of lines) {
        const [name, status, ports] = line.split('|');
        this.services.docker.set(name, {
          name,
          status,
          ports,
          type: 'docker',
          healthy: status.includes('Up')
        });
      }
    } catch (error) {
      console.error('Docker check failed:', error.message);
      this.makeCalComment('Docker is being difficult again...');
    }
  }

  async checkNodeServices() {
    try {
      const { stdout } = await execAsync('ps aux | grep "node " | grep -v grep | awk \'{print $2 "|" $NF}\'');
      const lines = stdout.trim().split('\n').filter(Boolean);
      
      this.services.node.clear();
      
      for (const line of lines) {
        const [pid, script] = line.split('|');
        const scriptName = path.basename(script);
        
        // Find what port this service is using
        const port = await this.findServicePort(pid);
        
        // Check if service is responding
        const healthy = await this.checkNodeHealth(scriptName, port);
        
        this.services.node.set(scriptName, {
          name: scriptName,
          pid,
          port,
          type: 'node',
          healthy,
          status: healthy ? `Running on :${port}` : 'Not responding'
        });
      }
    } catch (error) {
      console.error('Node services check failed:', error.message);
    }
  }

  async findServicePort(pid) {
    try {
      // Use lsof to find what port this process is listening on
      const { stdout } = await execAsync(`lsof -Pan -p ${pid} -i | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1`);
      return stdout.trim() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async checkNodeHealth(scriptName, port) {
    // If we found a port, try to check health
    if (port && port !== 'unknown') {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health || echo "000"`, 
          { timeout: 2000 });
        return stdout.trim() === '200';
      } catch {
        // Try just checking if port is open
        try {
          await execAsync(`nc -z localhost ${port}`, { timeout: 1000 });
          return true;
        } catch {
          return false;
        }
      }
    }
    
    // If no port found, assume it's a background service
    return true;
  }

  async updateHealthStatus() {
    const totalServices = this.services.docker.size + this.services.node.size;
    const healthyServices = [...this.services.docker.values(), ...this.services.node.values()]
      .filter(s => s.healthy).length;

    const healthPercent = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

    // Update Cal's mood based on system health
    if (healthPercent < 50) {
      this.cal.mood = 'panicking';
      this.cal.blameCount++;
      this.makeCalComment("Everything is on fire! This is fine... 🔥");
    } else if (healthPercent < 80) {
      this.cal.mood = 'concerned';
      this.makeCalComment("Some services are misbehaving. Typical.");
    } else if (healthPercent === 100) {
      this.cal.mood = 'suspicious';
      this.makeCalComment("Everything is working? That can't be right...");
    }

    // Decrease coffee over time
    this.cal.coffeeLevel = Math.max(0, this.cal.coffeeLevel - 1);
    if (this.cal.coffeeLevel < 20) {
      this.makeCalComment("Need... more... coffee... ☕");
    }
  }

  async restartService(type, name) {
    console.log(`🔄 Restarting ${type} service: ${name}`);
    this.makeCalComment(`Here we go again... restarting ${name}`);

    try {
      if (type === 'docker') {
        await execAsync(`docker restart ${name}`);
        return { success: true, message: `Docker container ${name} restarted` };
      } else if (type === 'node') {
        // Find and kill the process
        const service = this.services.node.get(name);
        if (service && service.pid) {
          await execAsync(`kill ${service.pid}`);
          
          // Restart it
          const scriptPath = path.join(process.cwd(), name);
          spawn('node', [scriptPath], {
            detached: true,
            stdio: 'ignore'
          }).unref();
          
          return { success: true, message: `Node service ${name} restarted` };
        }
      }
    } catch (error) {
      this.cal.blameCount++;
      return { success: false, message: error.message };
    }
  }

  async getServiceLogs(type, name) {
    try {
      if (type === 'docker') {
        const { stdout } = await execAsync(`docker logs ${name} --tail 50`);
        return stdout;
      } else if (type === 'node') {
        // Try to find log files
        const logFile = `./logs/${name}.log`;
        try {
          return await fs.readFile(logFile, 'utf8');
        } catch {
          return "No log file found. Service might not be logging to file.";
        }
      }
    } catch (error) {
      return `Error getting logs: ${error.message}`;
    }
  }

  async applyFix(serviceName) {
    const fix = this.fixes.get(serviceName);
    if (!fix) {
      return { success: false, message: "No known fix for this service" };
    }

    console.log(`🔧 Applying fix for ${serviceName}`);
    this.makeCalComment(`Let's try fix #${fix.id}. It worked once before...`);

    try {
      // Execute the fix command
      await execAsync(fix.command);
      return { success: true, message: `Applied fix: ${fix.description}` };
    } catch (error) {
      this.cal.blameCount++;
      return { success: false, message: `Fix failed: ${error.message}` };
    }
  }

  async loadLearnedFixes() {
    // Load fixes from AI Error Debugger's learned solutions
    try {
      const data = await fs.readFile('.ai-debugger-solutions.json', 'utf8');
      const solutions = JSON.parse(data);
      
      // Convert to executable fixes
      for (const [pattern, solution] of Object.entries(solutions)) {
        if (solution.code) {
          this.fixes.set(pattern, {
            id: pattern,
            description: solution.description,
            command: this.convertToCommand(solution),
            confidence: solution.confidence
          });
        }
      }
      
      console.log(`📚 Loaded ${this.fixes.size} learned fixes`);
    } catch {
      console.log('📚 No learned fixes found yet');
    }
  }

  convertToCommand(solution) {
    // Convert solution to executable command
    if (solution.pattern === 'deprecated-crypto-method') {
      return 'find . -name "*.js" -exec sed -i "" "s/crypto.createCipher/crypto.createCipheriv/g" {} \\;';
    }
    // Add more conversions as needed
    return 'echo "Manual fix required"';
  }

  makeCalComment(comment) {
    this.cal.lastComment = comment;
    console.log(`💭 Cal: ${comment}`);
  }

  async getAllServices() {
    return {
      docker: Array.from(this.services.docker.values()),
      node: Array.from(this.services.node.values()),
      summary: {
        total: this.services.docker.size + this.services.node.size,
        healthy: [...this.services.docker.values(), ...this.services.node.values()]
          .filter(s => s.healthy).length
      }
    };
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  generateDashboard() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Cal Central Command</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0a0a0a;
            color: #fff;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }
        
        h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .cal-status {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            display: flex;
            justify-content: space-around;
            align-items: center;
        }
        
        .cal-stat {
            text-align: center;
        }
        
        .cal-stat h3 {
            margin: 0;
            color: #aaa;
            font-size: 0.9em;
        }
        
        .cal-stat p {
            margin: 5px 0;
            font-size: 1.5em;
            font-weight: bold;
        }
        
        .services {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }
        
        .service-group {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .service-group h2 {
            margin: 0 0 20px 0;
            color: #667eea;
        }
        
        .service {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .service.healthy {
            border-left: 4px solid #27ae60;
        }
        
        .service.unhealthy {
            border-left: 4px solid #e74c3c;
        }
        
        .service-name {
            font-weight: 600;
        }
        
        .service-actions {
            display: flex;
            gap: 10px;
        }
        
        button {
            background: #667eea;
            border: none;
            color: white;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        button:hover {
            background: #764ba2;
        }
        
        .coffee-button {
            background: #8b4513;
            font-size: 1.2em;
            padding: 10px 20px;
            margin: 20px auto;
            display: block;
        }
        
        .cal-comment {
            text-align: center;
            font-style: italic;
            color: #aaa;
            margin: 20px 0;
            min-height: 30px;
        }
        
        .logs-modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid #333;
        }
        
        .logs-content {
            background: #000;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 0.9em;
            color: #0f0;
        }
        
        .close {
            float: right;
            font-size: 1.5em;
            cursor: pointer;
            color: #aaa;
        }
        
        .close:hover {
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Cal Central Command</h1>
        <p>The REAL dashboard that actually works</p>
    </div>
    
    <div class="cal-status">
        <div class="cal-stat">
            <h3>Mood</h3>
            <p id="cal-mood">Loading...</p>
        </div>
        <div class="cal-stat">
            <h3>Coffee Level</h3>
            <p id="cal-coffee">0%</p>
        </div>
        <div class="cal-stat">
            <h3>Blame Count</h3>
            <p id="cal-blame">0</p>
        </div>
        <div class="cal-stat">
            <h3>System Health</h3>
            <p id="system-health">0%</p>
        </div>
    </div>
    
    <button class="coffee-button" onclick="refillCoffee()">☕ Refill Cal's Coffee</button>
    
    <div class="cal-comment" id="cal-comment"></div>
    
    <div class="services">
        <div class="service-group">
            <h2>🐳 Docker Services</h2>
            <div id="docker-services">Loading...</div>
        </div>
        
        <div class="service-group">
            <h2>📦 Node Services</h2>
            <div id="node-services">Loading...</div>
        </div>
    </div>
    
    <div class="logs-modal" id="logs-modal">
        <span class="close" onclick="closeLogs()">&times;</span>
        <h2>Service Logs</h2>
        <div class="logs-content" id="logs-content"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${PORT}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'update') {
                updateDashboard(data);
            }
        };
        
        ws.onerror = () => {
            console.error('WebSocket connection failed');
        };
        
        async function updateDashboard(data) {
            // Update Cal's status
            document.getElementById('cal-mood').textContent = data.cal.mood;
            document.getElementById('cal-coffee').textContent = data.cal.coffeeLevel + '%';
            document.getElementById('cal-blame').textContent = data.cal.blameCount;
            
            // Update system health
            const healthPercent = (data.services.summary.healthy / data.services.summary.total * 100).toFixed(0);
            document.getElementById('system-health').textContent = healthPercent + '%';
            
            // Update Cal's comment
            if (data.cal.lastComment) {
                document.getElementById('cal-comment').textContent = '"' + data.cal.lastComment + '"';
            }
            
            // Update services
            updateServiceList('docker-services', data.services.docker);
            updateServiceList('node-services', data.services.node);
        }
        
        function updateServiceList(elementId, services) {
            const container = document.getElementById(elementId);
            container.innerHTML = '';
            
            services.forEach(service => {
                const div = document.createElement('div');
                div.className = 'service ' + (service.healthy ? 'healthy' : 'unhealthy');
                
                div.innerHTML = \`
                    <div>
                        <div class="service-name">\${service.name}</div>
                        <small>\${service.status}</small>
                    </div>
                    <div class="service-actions">
                        <button onclick="showLogs('\${service.type}', '\${service.name}')">Logs</button>
                        <button onclick="restartService('\${service.type}', '\${service.name}')">Restart</button>
                        <button onclick="applyFix('\${service.name}')">Fix</button>
                    </div>
                \`;
                
                container.appendChild(div);
            });
        }
        
        async function restartService(type, name) {
            const response = await fetch(\`/api/restart/\${type}/\${name}\`, { method: 'POST' });
            const result = await response.json();
            alert(result.message);
        }
        
        async function showLogs(type, name) {
            const response = await fetch(\`/api/logs/\${type}/\${name}\`);
            const result = await response.json();
            
            document.getElementById('logs-content').textContent = result.logs;
            document.getElementById('logs-modal').style.display = 'block';
        }
        
        function closeLogs() {
            document.getElementById('logs-modal').style.display = 'none';
        }
        
        async function applyFix(service) {
            const response = await fetch(\`/api/fix/\${service}\`, { method: 'POST' });
            const result = await response.json();
            alert(result.message);
        }
        
        async function refillCoffee() {
            const response = await fetch('/api/cal/coffee', { method: 'POST' });
            const result = await response.json();
            alert(result.message);
        }
        
        // Initial load
        fetch('/api/services').then(r => r.json()).then(services => {
            fetch('/api/cal/status').then(r => r.json()).then(cal => {
                updateDashboard({ services, cal });
            });
        });
    </script>
</body>
</html>`;
  }
}

// Start Cal Central Command
new CalCentralCommand();

// Export for testing
module.exports = CalCentralCommand;