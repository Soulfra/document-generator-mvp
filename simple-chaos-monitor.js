#!/usr/bin/env node

/**
 * SIMPLE CHAOS MONITOR
 * Lightweight chaos monitoring without runtime overhead
 * Discord/Telegram alerts • OBS streaming • Cloudflare-ready
 */

console.log(`
🚨 SIMPLE CHAOS MONITOR ACTIVE 🚨
Lightweight monitoring • External alerts • Stream-ready
`);

const fs = require('fs').promises;

class SimpleChaosMonitor {
  constructor() {
    this.chaosLevel = 0;
    this.warnings = [];
    this.calState = 'sleeping';
    this.lastAlert = 0;
    this.alertCooldown = 5000; // 5 second cooldown
    
    this.setupLightweightMonitoring();
  }

  setupLightweightMonitoring() {
    console.log('📊 Setting up lightweight monitoring...');
    
    // Simple chaos detection
    this.monitor = {
      check: () => {
        const now = Date.now();
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        
        // Simple thresholds
        if (memUsage > 100) this.chaosLevel += 5;
        if (this.chaosLevel > 50 && now - this.lastAlert > this.alertCooldown) {
          this.sendAlert(`Chaos level: ${this.chaosLevel}, Memory: ${memUsage.toFixed(1)}MB`);
          this.lastAlert = now;
        }
        
        return {
          chaos: this.chaosLevel,
          memory: memUsage.toFixed(1),
          cal: this.calState,
          timestamp: new Date().toISOString()
        };
      },
      
      bash: (intensity = 1) => {
        this.chaosLevel += intensity * 10;
        console.log(`💥 Bash intensity ${intensity} - chaos now ${this.chaosLevel}`);
        return { chaos: this.chaosLevel, intensity };
      },
      
      wake: () => {
        this.calState = 'awake';
        console.log('🎯 Cal awakened');
        return { cal: this.calState };
      },
      
      reset: () => {
        this.chaosLevel = 0;
        this.calState = 'sleeping';
        this.warnings = [];
        console.log('🔄 System reset');
        return { reset: true };
      }
    };

    // Start simple monitoring loop
    setInterval(() => {
      const status = this.monitor.check();
      this.writeStatus(status);
    }, 3000);
    
    console.log('📊 Lightweight monitoring ready');
  }

  async sendAlert(message) {
    console.log(`🚨 ALERT: ${message}`);
    
    // Write alert to file for external pickup
    const alert = {
      message,
      level: 'warning',
      timestamp: new Date().toISOString(),
      chaos: this.chaosLevel
    };
    
    try {
      await fs.writeFile('chaos-alert.json', JSON.stringify(alert, null, 2));
      
      // Simple webhook call (if configured)
      if (process.env.WEBHOOK_URL) {
        this.sendWebhook(alert);
      }
    } catch (error) {
      console.log('Alert write failed:', error.message);
    }
  }

  async sendWebhook(alert) {
    try {
      const fetch = require('node-fetch');
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 Chaos Alert: ${alert.message}`,
          embeds: [{
            color: 0xff6b6b,
            fields: [
              { name: 'Chaos Level', value: alert.chaos.toString(), inline: true },
              { name: 'Time', value: alert.timestamp, inline: true }
            ]
          }]
        })
      });
      console.log('📡 Alert sent to webhook');
    } catch (error) {
      console.log('Webhook failed:', error.message);
    }
  }

  async writeStatus(status) {
    // Write simple status for OBS/external tools
    const simpleStatus = `CHAOS: ${status.chaos} | MEM: ${status.memory}MB | CAL: ${status.cal}`;
    
    try {
      await fs.writeFile('chaos-status.txt', simpleStatus);
      await fs.writeFile('chaos-data.json', JSON.stringify(status, null, 2));
    } catch (error) {
      // Silent fail to avoid spam
    }
  }

  // Simple web interface
  generateSimpleHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🚨 Simple Chaos Monitor</title>
    <style>
        body { 
            font-family: monospace; 
            background: #0c0c0c; 
            color: #00ff88; 
            padding: 20px;
            text-align: center;
        }
        .chaos-display {
            font-size: 3em;
            margin: 30px 0;
            text-shadow: 0 0 20px #ff6b6b;
        }
        .status {
            font-size: 1.5em;
            margin: 20px 0;
        }
        .controls {
            margin: 40px 0;
        }
        button {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 15px 30px;
            margin: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #ff5555; }
        .cal-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border: 2px solid #00ff88;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <h1>🚨 SIMPLE CHAOS MONITOR</h1>
    
    <div id="chaos" class="chaos-display">0</div>
    <div id="status" class="status">Monitoring...</div>
    
    <div class="controls">
        <button onclick="bash()">💥 BASH</button>
        <button onclick="wake()">🎯 WAKE CAL</button>
        <button onclick="reset()">🔄 RESET</button>
    </div>
    
    <div class="cal-status">
        <div>🎯 Cal: <span id="cal-state">sleeping</span></div>
    </div>

    <script>
        async function bash() {
            const response = await fetch('/api/bash', { method: 'POST' });
            const data = await response.json();
            document.getElementById('chaos').textContent = data.chaos;
        }
        
        async function wake() {
            const response = await fetch('/api/wake', { method: 'POST' });
            const data = await response.json();
            document.getElementById('cal-state').textContent = data.cal;
        }
        
        async function reset() {
            const response = await fetch('/api/reset', { method: 'POST' });
            location.reload();
        }
        
        // Auto-refresh status
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                document.getElementById('chaos').textContent = data.chaos;
                document.getElementById('status').textContent = 
                    \`Memory: \${data.memory}MB | Time: \${new Date(data.timestamp).toLocaleTimeString()}\`;
                document.getElementById('cal-state').textContent = data.cal;
            } catch (e) {}
        }, 2000);
    </script>
</body>
</html>`;
  }

  // Minimal Express server
  startSimpleServer() {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // Serve simple interface
    app.get('/', (req, res) => {
      res.send(this.generateSimpleHTML());
    });
    
    // Simple API endpoints
    app.post('/api/bash', (req, res) => {
      const result = this.monitor.bash();
      res.json(result);
    });
    
    app.post('/api/wake', (req, res) => {
      const result = this.monitor.wake();
      res.json(result);
    });
    
    app.post('/api/reset', (req, res) => {
      const result = this.monitor.reset();
      res.json(result);
    });
    
    app.get('/api/status', (req, res) => {
      const status = this.monitor.check();
      res.json(status);
    });
    
    // Serve status files for OBS
    app.get('/chaos-status.txt', async (req, res) => {
      try {
        const content = await fs.readFile('chaos-status.txt', 'utf8');
        res.type('text/plain').send(content);
      } catch (e) {
        res.send('CHAOS: 0 | MEM: 0MB | CAL: sleeping');
      }
    });
    
    const server = app.listen(3338, () => {
      console.log('🌐 Simple Chaos Monitor: http://localhost:3338');
      console.log('📄 OBS Text Source: http://localhost:3338/chaos-status.txt');
    });
    
    return server;
  }

  // CLI
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'start':
        console.log('\n🚨 Starting simple chaos monitor...');
        this.startSimpleServer();
        break;

      case 'bash':
        const intensity = parseInt(args[1]) || 1;
        const result = this.monitor.bash(intensity);
        console.log(`Chaos level: ${result.chaos}`);
        break;

      case 'wake':
        const wakeResult = this.monitor.wake();
        console.log(`Cal: ${wakeResult.cal}`);
        break;

      case 'reset':
        this.monitor.reset();
        break;

      case 'status':
        const status = this.monitor.check();
        console.log(JSON.stringify(status, null, 2));
        break;

      default:
        console.log(`
🚨 Simple Chaos Monitor

Usage:
  node simple-chaos-monitor.js start    # Start lightweight server
  node simple-chaos-monitor.js bash     # Increase chaos
  node simple-chaos-monitor.js wake     # Wake Cal
  node simple-chaos-monitor.js reset    # Reset everything
  node simple-chaos-monitor.js status   # Show current status

🌐 Web Interface: http://localhost:3338
📄 OBS Text Source: http://localhost:3338/chaos-status.txt
📡 Webhook Alerts: Set WEBHOOK_URL environment variable

Files Created:
  chaos-status.txt    # Simple text for OBS
  chaos-data.json     # JSON data for tools
  chaos-alert.json    # Latest alert info

Lightweight and Cloudflare-ready! 🚀
        `);
    }
  }
}

// Export for use as module
module.exports = SimpleChaosMonitor;

// Run CLI if called directly
if (require.main === module) {
  const monitor = new SimpleChaosMonitor();
  monitor.cli().catch(console.error);
}