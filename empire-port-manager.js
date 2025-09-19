#!/usr/bin/env node

/**
 * EMPIRE PORT MANAGER
 * Manages ports for all empire game systems to prevent conflicts
 */

const net = require('net');

class EmpirePortManager {
  constructor() {
    // Reserve port ranges for different empire systems
    this.portRanges = {
      'cannabis-tycoon': { start: 7000, end: 7099 },
      'space-exploration': { start: 7100, end: 7199 },
      'galactic-federation': { start: 7200, end: 7299 },
      'civilization-builder': { start: 7300, end: 7399 },
      'enterprise-command': { start: 7400, end: 7499 },
      'depths-empire': { start: 7500, end: 7599 },
      'gaming-platforms': { start: 7600, end: 7699 }
    };
    
    this.allocatedPorts = new Map();
    this.runningServices = new Map();
  }

  async findAvailablePort(theme = 'general', preferredPort = null) {
    // If a preferred port is given and available, use it
    if (preferredPort && await this.isPortAvailable(preferredPort)) {
      return preferredPort;
    }

    // Use theme-specific range if available
    const range = this.portRanges[theme];
    if (range) {
      for (let port = range.start; port <= range.end; port++) {
        if (await this.isPortAvailable(port)) {
          this.allocatedPorts.set(port, theme);
          return port;
        }
      }
    }

    // Fallback to general range 8000-8999
    for (let port = 8000; port < 9000; port++) {
      if (await this.isPortAvailable(port)) {
        this.allocatedPorts.set(port, theme);
        return port;
      }
    }

    throw new Error('No available ports found');
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  allocatePortsForEmpireGame(theme, portsNeeded = 1) {
    const ports = [];
    const range = this.portRanges[theme] || { start: 8000, end: 8999 };
    
    for (let port = range.start; port <= range.end && ports.length < portsNeeded; port++) {
      if (!this.allocatedPorts.has(port)) {
        ports.push(port);
        this.allocatedPorts.set(port, theme);
      }
    }

    return ports;
  }

  registerRunningService(theme, port, pid, name) {
    this.runningServices.set(port, {
      theme,
      pid,
      name,
      startTime: new Date()
    });
  }

  unregisterService(port) {
    this.runningServices.delete(port);
    this.allocatedPorts.delete(port);
  }

  getServiceStatus() {
    const status = {
      allocatedPorts: Array.from(this.allocatedPorts.entries()).map(([port, theme]) => ({
        port,
        theme,
        running: this.runningServices.has(port)
      })),
      runningServices: Array.from(this.runningServices.entries()).map(([port, service]) => ({
        port,
        ...service
      })),
      availableRanges: Object.entries(this.portRanges).map(([theme, range]) => ({
        theme,
        range: `${range.start}-${range.end}`,
        allocated: Array.from(this.allocatedPorts.entries())
          .filter(([port, allocatedTheme]) => allocatedTheme === theme)
          .map(([port]) => port)
      }))
    };

    return status;
  }

  async createEmpireGameConfig(theme, originalConfig = {}) {
    // Find available ports for this empire game
    const mainPort = await this.findAvailablePort(theme);
    const wsPort = await this.findAvailablePort(theme);
    
    // Create safe configuration
    const config = {
      ...originalConfig,
      ports: {
        main: mainPort,
        websocket: wsPort,
        api: mainPort + 1
      },
      theme,
      empireMode: true,
      managedByPortManager: true
    };

    console.log(`🎮 ${theme} allocated ports: main=${mainPort}, ws=${wsPort}`);
    
    return config;
  }

  async killConflictingServices() {
    const problematicPorts = [5000, 5001, 9000, 3000, 8080];
    
    console.log('🔍 Checking for port conflicts...');
    
    for (const port of problematicPorts) {
      if (!(await this.isPortAvailable(port))) {
        console.log(`⚠️  Port ${port} is in use (likely by system service)`);
      }
    }
  }
}

// Test port manager
async function testPortManager() {
  const manager = new EmpirePortManager();
  
  console.log('🏛️ EMPIRE PORT MANAGER TEST');
  console.log('============================\n');

  // Test port allocation for each theme
  const themes = [
    'cannabis-tycoon',
    'space-exploration', 
    'galactic-federation',
    'civilization-builder',
    'enterprise-command'
  ];

  for (const theme of themes) {
    try {
      const config = await manager.createEmpireGameConfig(theme);
      console.log(`✅ ${theme}: ports ${config.ports.main}-${config.ports.api}`);
    } catch (error) {
      console.log(`❌ ${theme}: ${error.message}`);
    }
  }

  console.log('\n📊 Port Manager Status:');
  const status = manager.getServiceStatus();
  
  status.availableRanges.forEach(range => {
    console.log(`   ${range.theme}: ${range.range} (${range.allocated.length} allocated)`);
  });

  await manager.killConflictingServices();
}

if (require.main === module) {
  testPortManager().catch(console.error);
}

module.exports = EmpirePortManager;