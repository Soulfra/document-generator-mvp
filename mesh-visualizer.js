#!/usr/bin/env node

/**
 * MESH VISUALIZER - See all the shit happening
 */

console.log('🕸️  MESH VISUALIZER - SEE EVERYTHING');
console.log('===================================');

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

class MeshVisualizer {
  constructor() {
    this.connections = new Map();
    this.processes = new Map();
    this.failures = [];
    this.successes = [];
    this.realTimeEvents = [];
  }

  visualize() {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    // Serve visualization
    app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>🕸️ Document Generator Mesh</title>
  <style>
    body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .panel { border: 1px solid #0f0; padding: 10px; background: #001100; }
    .success { color: #0f0; }
    .failure { color: #f00; }
    .process { color: #ff0; }
    .event { margin: 5px 0; }
    .connection { color: #0ff; }
    #events { height: 400px; overflow-y: auto; }
  </style>
</head>
<body>
  <h1>🕸️ DOCUMENT GENERATOR MESH VISUALIZER</h1>
  
  <div class="grid">
    <div class="panel">
      <h2>🔗 Active Connections</h2>
      <div id="connections"></div>
    </div>
    
    <div class="panel">
      <h2>⚙️ Running Processes</h2>
      <div id="processes"></div>
    </div>
    
    <div class="panel">
      <h2>📊 System Status</h2>
      <div id="status"></div>
    </div>
    
    <div class="panel">
      <h2>🔄 Real-time Events</h2>
      <div id="events"></div>
    </div>
  </div>

  <script>
    const ws = new WebSocket('ws://localhost:9999');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connection') {
        updateConnections(data.connections);
      } else if (data.type === 'process') {
        updateProcesses(data.processes);
      } else if (data.type === 'event') {
        addEvent(data.event);
      } else if (data.type === 'status') {
        updateStatus(data.status);
      }
    };
    
    function updateConnections(connections) {
      const div = document.getElementById('connections');
      div.innerHTML = connections.map(conn => 
        '<div class="connection">🔗 ' + conn + '</div>'
      ).join('');
    }
    
    function updateProcesses(processes) {
      const div = document.getElementById('processes');
      div.innerHTML = processes.map(proc => 
        '<div class="process">⚙️ ' + proc + '</div>'
      ).join('');
    }
    
    function addEvent(event) {
      const div = document.getElementById('events');
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event ' + event.type;
      eventDiv.innerHTML = new Date().toLocaleTimeString() + ' - ' + event.message;
      div.appendChild(eventDiv);
      div.scrollTop = div.scrollHeight;
    }
    
    function updateStatus(status) {
      const div = document.getElementById('status');
      div.innerHTML = 
        '<div class="success">✅ Successes: ' + status.successes + '</div>' +
        '<div class="failure">❌ Failures: ' + status.failures + '</div>' +
        '<div class="process">⚙️ Active: ' + status.active + '</div>';
    }
  </script>
</body>
</html>
      `);
    });

    // WebSocket for real-time updates
    wss.on('connection', (ws) => {
      console.log('🔌 Client connected to mesh visualizer');
      
      // Send initial state
      this.sendUpdate(ws);
      
      // Send periodic updates
      const interval = setInterval(() => {
        this.sendUpdate(ws);
      }, 1000);
      
      ws.on('close', () => {
        clearInterval(interval);
        console.log('🔌 Client disconnected');
      });
    });

    server.listen(9999, () => {
      console.log('🕸️ Mesh visualizer running at http://localhost:9999');
    });
  }

  sendUpdate(ws) {
    const status = {
      successes: this.successes.length,
      failures: this.failures.length,
      active: this.processes.size
    };
    
    ws.send(JSON.stringify({
      type: 'status',
      status: status
    }));
    
    ws.send(JSON.stringify({
      type: 'connection',
      connections: Array.from(this.connections.keys())
    }));
    
    ws.send(JSON.stringify({
      type: 'process',
      processes: Array.from(this.processes.keys())
    }));
  }

  addConnection(name, details) {
    this.connections.set(name, details);
    this.addEvent('connection', `Connected: ${name}`);
  }

  addProcess(name, pid) {
    this.processes.set(name, pid);
    this.addEvent('process', `Started: ${name} (PID: ${pid})`);
  }

  addEvent(type, message) {
    this.realTimeEvents.push({
      type,
      message,
      timestamp: Date.now()
    });
    
    // Broadcast to all connected clients
    console.log(`📡 ${type.toUpperCase()}: ${message}`);
  }

  startMonitoring() {
    console.log('🔍 Starting mesh monitoring...');
    
    // Monitor file system
    this.monitorFiles();
    
    // Monitor processes
    this.monitorProcesses();
    
    // Monitor network
    this.monitorNetwork();
  }

  monitorFiles() {
    const files = [
      'character-system-max.js',
      'execute.js',
      'blamechain.js',
      'mesh-visualizer.js'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        this.addEvent('success', `File exists: ${file}`);
        
        fs.watchFile(file, (curr, prev) => {
          this.addEvent('change', `File changed: ${file}`);
        });
      } else {
        this.addEvent('failure', `File missing: ${file}`);
      }
    });
  }

  monitorProcesses() {
    // Check for running processes
    const { exec } = require('child_process');
    
    exec('ps aux | grep node', (error, stdout, stderr) => {
      if (stdout) {
        const nodeProcesses = stdout.split('\n')
          .filter(line => line.includes('node') && !line.includes('grep'))
          .length;
        
        this.addEvent('process', `${nodeProcesses} Node.js processes running`);
      }
    });
  }

  monitorNetwork() {
    const ports = [8888, 3001, 9999];
    
    ports.forEach(port => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(1000);
      socket.on('connect', () => {
        this.addConnection(`Port ${port}`, 'OPEN');
        socket.destroy();
      });
      
      socket.on('timeout', () => {
        this.addEvent('failure', `Port ${port} not responding`);
        socket.destroy();
      });
      
      socket.on('error', () => {
        this.addEvent('failure', `Port ${port} connection failed`);
      });
      
      socket.connect(port, '127.0.0.1');
    });
  }
}

// Start the mesh visualizer
if (require.main === module) {
  try {
    const visualizer = new MeshVisualizer();
    visualizer.startMonitoring();
    visualizer.visualize();
    
    console.log('🕸️ Mesh visualizer started');
    console.log('📊 View at: http://localhost:9999');
    
  } catch (error) {
    console.log('❌ Mesh visualizer failed:', error.message);
    console.log('💡 Run: npm install express ws');
  }
}

module.exports = MeshVisualizer;