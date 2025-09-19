#!/usr/bin/env node

/**
 * WebSocket Bridge for Frogger Visual Dashboard
 * Connects the real API router to the visual game interface
 */

const WebSocket = require('ws');
const express = require('express');
const { EventEmitter } = require('events');

class FroggerWebSocketBridge extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Set();
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      endpoints: new Map(),
      startTime: Date.now()
    };
  }

  start(port = 8081) {
    // Create WebSocket server
    this.wss = new WebSocket.Server({ port });
    
    this.wss.on('connection', (ws) => {
      console.log('🎮 New dashboard connected');
      this.clients.add(ws);
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'init',
        stats: this.getStats(),
        endpoints: Array.from(this.stats.endpoints.entries())
      }));
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('Dashboard disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
    
    console.log(`🌐 WebSocket bridge listening on port ${port}`);
  }

  // Broadcast to all connected dashboards
  broadcast(data) {
    const message = JSON.stringify(data);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Track API call
  trackAPICall(endpoint, success, responseTime, error = null) {
    this.stats.totalCalls++;
    
    if (success) {
      this.stats.successfulCalls++;
    } else {
      this.stats.failedCalls++;
    }
    
    // Update endpoint stats
    if (!this.stats.endpoints.has(endpoint)) {
      this.stats.endpoints.set(endpoint, {
        calls: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
        lastUsed: null
      });
    }
    
    const endpointStats = this.stats.endpoints.get(endpoint);
    endpointStats.calls++;
    
    if (success) {
      endpointStats.successes++;
      endpointStats.avgResponseTime = 
        (endpointStats.avgResponseTime * (endpointStats.successes - 1) + responseTime) / 
        endpointStats.successes;
    } else {
      endpointStats.failures++;
    }
    
    endpointStats.lastUsed = new Date();
    
    // Broadcast the event
    this.broadcast({
      type: 'api-call',
      endpoint,
      success,
      responseTime,
      error,
      timestamp: Date.now(),
      stats: this.getStats()
    });
  }

  // Get current statistics
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const successRate = this.stats.totalCalls > 0 
      ? (this.stats.successfulCalls / this.stats.totalCalls * 100).toFixed(2)
      : 0;
    
    return {
      totalCalls: this.stats.totalCalls,
      successfulCalls: this.stats.successfulCalls,
      failedCalls: this.stats.failedCalls,
      successRate: parseFloat(successRate),
      callsPerSecond: (this.stats.totalCalls / (uptime / 1000)).toFixed(2),
      uptime: Math.floor(uptime / 1000),
      activeEndpoints: this.stats.endpoints.size
    };
  }

  // Integrate with existing Frogger router
  attachToRouter(froggerRouter) {
    // Hook into router events
    const originalProxyHandler = froggerRouter.app._router.stack
      .find(layer => layer.name === 'bound dispatch')?.handle;
    
    if (originalProxyHandler) {
      // Wrap the proxy handler
      froggerRouter.app._router.stack
        .find(layer => layer.name === 'bound dispatch').handle = (req, res, next) => {
          const startTime = Date.now();
          const endpoint = req.selectedEndpoint?.name || 'unknown';
          
          // Track request start
          this.broadcast({
            type: 'request-start',
            endpoint,
            path: req.path,
            method: req.method
          });
          
          // Wrap response handlers
          const originalSend = res.send;
          const originalJson = res.json;
          
          const trackResponse = (success) => {
            const responseTime = Date.now() - startTime;
            this.trackAPICall(endpoint, success, responseTime);
          };
          
          res.send = function(data) {
            trackResponse(res.statusCode < 400);
            return originalSend.call(this, data);
          };
          
          res.json = function(data) {
            trackResponse(res.statusCode < 400);
            return originalJson.call(this, data);
          };
          
          // Call original handler
          originalProxyHandler(req, res, next);
        };
    }
  }
}

// CLI interface for the visual dashboard
class FroggerCLI {
  constructor(bridge) {
    this.bridge = bridge;
    this.setupKeybindings();
  }

  setupKeybindings() {
    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    console.log('\n🎮 Frogger Dashboard Controls:');
    console.log('================================');
    console.log('V - Open visual dashboard');
    console.log('S - Show stats');
    console.log('R - Reset stats');
    console.log('T - Trigger test sequence');
    console.log('Q - Quit');
    console.log('================================\n');
    
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit();
      }
      
      switch(key.name) {
        case 'v':
          this.openDashboard();
          break;
        case 's':
          this.showStats();
          break;
        case 'r':
          this.resetStats();
          break;
        case 't':
          this.triggerTestSequence();
          break;
        case 'q':
          console.log('\n👋 Goodbye!');
          process.exit();
          break;
      }
    });
  }

  openDashboard() {
    const { exec } = require('child_process');
    const path = require('path');
    
    const dashboardPath = path.join(__dirname, 'frogger-visual-dashboard.html');
    
    // Open in default browser
    const openCommand = process.platform === 'darwin' ? 'open' :
                       process.platform === 'win32' ? 'start' :
                       'xdg-open';
    
    exec(`${openCommand} ${dashboardPath}`, (error) => {
      if (error) {
        console.error('Failed to open dashboard:', error);
      } else {
        console.log('🌐 Dashboard opened in browser!');
      }
    });
  }

  showStats() {
    const stats = this.bridge.getStats();
    console.log('\n📊 Current Statistics:');
    console.log('====================');
    console.log(`Total Calls: ${stats.totalCalls}`);
    console.log(`Successful: ${stats.successfulCalls} (${stats.successRate}%)`);
    console.log(`Failed: ${stats.failedCalls}`);
    console.log(`Calls/sec: ${stats.callsPerSecond}`);
    console.log(`Active Endpoints: ${stats.activeEndpoints}`);
    console.log(`Uptime: ${stats.uptime}s`);
    console.log('====================\n');
  }

  resetStats() {
    this.bridge.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      endpoints: new Map(),
      startTime: Date.now()
    };
    
    this.bridge.broadcast({
      type: 'stats-reset',
      stats: this.bridge.getStats()
    });
    
    console.log('📊 Stats reset!');
  }

  triggerTestSequence() {
    console.log('🧪 Triggering test sequence...');
    
    const endpoints = [
      'bronze-1', 'bronze-2', 'bronze-3',
      'iron-1', 'iron-2',
      'steel-1',
      'mithril-1'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      const endpoint = endpoints[index % endpoints.length];
      const success = Math.random() > 0.2; // 80% success rate
      const responseTime = Math.floor(Math.random() * 200 + 50);
      
      this.bridge.trackAPICall(endpoint, success, responseTime);
      
      index++;
      if (index >= 20) {
        clearInterval(interval);
        console.log('✅ Test sequence complete!');
      }
    }, 500);
  }
}

// Integration module
module.exports = {
  FroggerWebSocketBridge,
  FroggerCLI,
  
  // Helper to integrate with existing router
  integrateWithRouter: (router, port = 8081) => {
    const bridge = new FroggerWebSocketBridge();
    bridge.start(port);
    bridge.attachToRouter(router);
    
    const cli = new FroggerCLI(bridge);
    
    return { bridge, cli };
  }
};

// Standalone mode
if (require.main === module) {
  const bridge = new FroggerWebSocketBridge();
  bridge.start(8081);
  
  const cli = new FroggerCLI(bridge);
  
  console.log('🐸 Frogger WebSocket Bridge running!');
  console.log('🎮 Press V to open the visual dashboard');
  
  // Simulate some activity if no router connected
  setTimeout(() => {
    console.log('\n📡 Running in demo mode - generating test data...');
    cli.triggerTestSequence();
  }, 2000);
}