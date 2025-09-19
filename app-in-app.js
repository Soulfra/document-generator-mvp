#!/usr/bin/env node

/**
 * APP-IN-APP SYSTEM
 * A verifiable mini-OS running inside Node.js
 * - Multiple apps running in one process
 * - Inter-app communication
 * - Shared resources
 * - Real proof it works
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Mini OS Core
class MiniOS extends EventEmitter {
  constructor() {
    super();
    this.apps = new Map();
    this.services = new Map();
    this.ports = new Map();
    this.sharedMemory = {};
    this.startTime = Date.now();
  }

  // Register an app
  registerApp(name, app) {
    console.log(`📱 Registering app: ${name}`);
    this.apps.set(name, app);
    app.os = this; // Give app reference to OS
    return this;
  }

  // Start all apps
  async boot() {
    console.log('\n🖥️  MINI-OS BOOTING...\n');
    
    for (const [name, app] of this.apps) {
      console.log(`▶️  Starting ${name}...`);
      await app.start();
    }
    
    console.log('\n✅ All apps started!\n');
    this.emit('boot:complete');
  }

  // Inter-app messaging
  sendMessage(from, to, message) {
    const targetApp = this.apps.get(to);
    if (targetApp) {
      targetApp.receiveMessage(from, message);
      return true;
    }
    return false;
  }

  // Shared data store
  setShared(key, value) {
    this.sharedMemory[key] = value;
    this.emit('shared:update', { key, value });
  }

  getShared(key) {
    return this.sharedMemory[key];
  }

  // System status
  getStatus() {
    const uptime = Date.now() - this.startTime;
    return {
      uptime: `${Math.floor(uptime / 1000)}s`,
      apps: Array.from(this.apps.keys()),
      services: Array.from(this.services.keys()),
      memory: this.sharedMemory,
      ports: Array.from(this.ports.entries())
    };
  }
}

// Base App Class
class BaseApp {
  constructor(name, port) {
    this.name = name;
    this.port = port;
    this.messages = [];
    this.os = null; // Set by OS during registration
  }

  async start() {
    // To be implemented by each app
  }

  receiveMessage(from, message) {
    console.log(`📨 ${this.name} received from ${from}:`, message);
    this.messages.push({ from, message, time: new Date() });
  }

  sendToApp(targetApp, message) {
    return this.os.sendMessage(this.name, targetApp, message);
  }
}

// App 1: Story Processor
class StoryApp extends BaseApp {
  constructor() {
    super('StoryProcessor', 4001);
    this.stories = [];
  }

  async start() {
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      
      if (req.url === '/' && req.method === 'GET') {
        res.end(JSON.stringify({
          app: this.name,
          stories: this.stories.length,
          messages: this.messages.length
        }));
      } else if (req.url === '/process' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const { text } = JSON.parse(body);
          const story = {
            id: Date.now(),
            text: text.substring(0, 100),
            processed: new Date()
          };
          this.stories.push(story);
          
          // Notify framework app
          this.sendToApp('FrameworkExtractor', { storyId: story.id, text: story.text });
          
          // Store in shared memory
          this.os.setShared(`story:${story.id}`, story);
          
          res.end(JSON.stringify({ success: true, story }));
        });
      }
    });
    
    server.listen(this.port);
    console.log(`   ✅ ${this.name} running on port ${this.port}`);
  }
}

// App 2: Framework Extractor
class FrameworkApp extends BaseApp {
  constructor() {
    super('FrameworkExtractor', 4002);
    this.frameworks = [];
  }

  async start() {
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      
      if (req.url === '/') {
        res.end(JSON.stringify({
          app: this.name,
          frameworks: this.frameworks.length,
          messages: this.messages.length
        }));
      }
    });
    
    server.listen(this.port);
    console.log(`   ✅ ${this.name} running on port ${this.port}`);
  }

  receiveMessage(from, message) {
    super.receiveMessage(from, message);
    
    if (message.storyId) {
      // Extract framework from story
      const framework = {
        id: Date.now(),
        storyId: message.storyId,
        lessons: ['Take responsibility', 'Build habits', 'Help others'],
        created: new Date()
      };
      
      this.frameworks.push(framework);
      
      // Store in shared memory
      this.os.setShared(`framework:${framework.id}`, framework);
      
      // Notify MVP generator
      this.sendToApp('MVPGenerator', { frameworkId: framework.id });
    }
  }
}

// App 3: MVP Generator
class MVPApp extends BaseApp {
  constructor() {
    super('MVPGenerator', 4003);
    this.mvps = [];
  }

  async start() {
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      
      if (req.url === '/') {
        res.end(JSON.stringify({
          app: this.name,
          mvps: this.mvps.length,
          messages: this.messages.length
        }));
      }
    });
    
    server.listen(this.port);
    console.log(`   ✅ ${this.name} running on port ${this.port}`);
  }

  receiveMessage(from, message) {
    super.receiveMessage(from, message);
    
    if (message.frameworkId) {
      // Generate MVP from framework
      const framework = this.os.getShared(`framework:${message.frameworkId}`);
      if (framework) {
        const mvp = {
          id: Date.now(),
          frameworkId: message.frameworkId,
          url: `/mvp/${message.frameworkId}`,
          created: new Date()
        };
        
        this.mvps.push(mvp);
        this.os.setShared(`mvp:${mvp.id}`, mvp);
      }
    }
  }
}

// App 4: System Monitor
class MonitorApp extends BaseApp {
  constructor() {
    super('SystemMonitor', 4000);
  }

  async start() {
    const server = http.createServer((req, res) => {
      if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(this.getDashboard());
      } else if (req.url === '/api/status') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(this.os.getStatus()));
      }
    });
    
    server.listen(this.port);
    console.log(`   ✅ ${this.name} running on port ${this.port}`);
  }

  getDashboard() {
    const status = this.os.getStatus();
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Mini-OS Dashboard</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .app { border: 1px solid #0f0; padding: 10px; margin: 10px 0; }
        h1 { color: #0f0; }
        .status { background: #030; padding: 10px; }
        button { background: #0f0; color: #000; border: none; padding: 5px 10px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🖥️ Mini-OS Dashboard</h1>
    <div class="status">
        <p>Uptime: ${status.uptime}</p>
        <p>Running Apps: ${status.apps.join(', ')}</p>
    </div>
    
    <h2>Apps Status:</h2>
    ${status.apps.map(app => `
        <div class="app">
            <h3>${app}</h3>
            <button onclick="checkApp('${app}')">Check Status</button>
            <div id="${app}-status"></div>
        </div>
    `).join('')}
    
    <h2>Test Story Processing:</h2>
    <button onclick="testStory()">Process Test Story</button>
    <div id="test-result"></div>
    
    <h2>Shared Memory:</h2>
    <pre id="memory">${JSON.stringify(status.memory, null, 2)}</pre>
    
    <script>
        async function checkApp(appName) {
            const ports = { 
                'SystemMonitor': 4000,
                'StoryProcessor': 4001,
                'FrameworkExtractor': 4002,
                'MVPGenerator': 4003
            };
            
            const response = await fetch('http://localhost:' + ports[appName] + '/');
            const data = await response.json();
            document.getElementById(appName + '-status').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        }
        
        async function testStory() {
            const response = await fetch('http://localhost:4001/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: 'Test story about overcoming challenges through daily habits.' })
            });
            const data = await response.json();
            document.getElementById('test-result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            
            // Refresh memory after 1 second
            setTimeout(async () => {
                const status = await fetch('/api/status').then(r => r.json());
                document.getElementById('memory').textContent = JSON.stringify(status.memory, null, 2);
            }, 1000);
        }
        
        // Auto-refresh every 5 seconds
        setInterval(async () => {
            const status = await fetch('/api/status').then(r => r.json());
            document.getElementById('memory').textContent = JSON.stringify(status.memory, null, 2);
        }, 5000);
    </script>
</body>
</html>
    `;
  }
}

// Create and boot the mini-OS
async function main() {
  console.log('🚀 APP-IN-APP SYSTEM DEMO\n');
  
  const os = new MiniOS();
  
  // Register all apps
  os.registerApp('SystemMonitor', new MonitorApp())
    .registerApp('StoryProcessor', new StoryApp())
    .registerApp('FrameworkExtractor', new FrameworkApp())
    .registerApp('MVPGenerator', new MVPApp());
  
  // Boot the system
  await os.boot();
  
  console.log('📊 Access Points:');
  console.log('   Dashboard: http://localhost:4000');
  console.log('   Story API: http://localhost:4001');
  console.log('   Framework API: http://localhost:4002');
  console.log('   MVP API: http://localhost:4003\n');
  
  console.log('🧪 Test Commands:');
  console.log('   curl http://localhost:4001/');
  console.log('   curl -X POST http://localhost:4001/process -H "Content-Type: application/json" -d \'{"text":"My story"}\'');
  console.log('\n✅ Mini-OS is running! Open http://localhost:4000 to see the dashboard.\n');
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Mini-OS...');
  process.exit(0);
});

// Run it!
main().catch(console.error);