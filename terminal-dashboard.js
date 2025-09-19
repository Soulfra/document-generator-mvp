#!/usr/bin/env node
// 🖥️ Terminal Dashboard - Real-time system monitoring in your terminal

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const axios = require('axios');
const chalk = require('chalk');

class TerminalDashboard {
  constructor() {
    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Economic Engine - System Monitor'
    });

    // Create grid
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });

    // State
    this.services = {};
    this.metrics = {
      cpu: [],
      memory: [],
      requests: []
    };
    this.activityLog = [];
    
    // Update intervals
    this.updateInterval = null;
    
    // Service endpoints
    this.endpoints = {
      'Economic Engine': 'http://localhost:3000/api/status',
      'Slam Layer': 'http://localhost:9999/slam/status',
      'Database': 'http://localhost:9999/api/database/status',
      'MCP Templates': 'http://localhost:9999/api/mcp/status',
      'Reasoning': 'http://localhost:9999/api/reasoning/status',
      'AI Economy': 'http://localhost:9999/api/economy/status'
    };

    this.setupUI();
    this.setupKeyBindings();
  }

  setupUI() {
    // Title
    this.titleBox = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: '{center}🚀 Economic Engine - Live System Monitor{/center}',
      tags: true,
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true
      }
    });

    // Service Status Table
    this.serviceTable = this.grid.set(1, 0, 4, 6, contrib.table, {
      keys: true,
      fg: 'white',
      selectedFg: 'white',
      selectedBg: 'blue',
      interactive: true,
      label: '📊 Service Status',
      width: '50%',
      height: '30%',
      border: { type: 'line', fg: 'cyan' },
      columnSpacing: 3,
      columnWidth: [20, 10, 10, 10]
    });

    // System Metrics Graphs
    this.cpuLine = this.grid.set(1, 6, 2, 3, contrib.line, {
      style: {
        line: 'yellow',
        text: 'green',
        baseline: 'black'
      },
      xLabelPadding: 3,
      xPadding: 5,
      showLegend: true,
      wholeNumbersOnly: false,
      label: '💻 CPU Usage %'
    });

    this.memoryGauge = this.grid.set(1, 9, 2, 3, contrib.gauge, {
      label: '🧠 Memory Usage',
      stroke: 'green',
      fill: 'white',
      percent: 0
    });

    // Request Rate
    this.requestsLine = this.grid.set(3, 6, 2, 6, contrib.line, {
      style: {
        line: 'cyan',
        text: 'green',
        baseline: 'black'
      },
      xLabelPadding: 3,
      xPadding: 5,
      label: '📈 Requests/min',
      showLegend: true
    });

    // Activity Log
    this.activityBox = this.grid.set(5, 0, 4, 6, blessed.log, {
      fg: 'green',
      selectedFg: 'green',
      label: '📝 Activity Log',
      border: { type: 'line', fg: 'cyan' },
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: true
    });

    // System Map
    this.systemMap = this.grid.set(5, 6, 4, 6, blessed.box, {
      label: '🗺️ System Architecture',
      border: { type: 'line', fg: 'cyan' },
      content: this.generateSystemMap()
    });

    // Progress Bars
    this.progressBars = this.grid.set(9, 0, 2, 12, blessed.box, {
      label: '📊 Service Health',
      border: { type: 'line', fg: 'cyan' },
      padding: 1
    });

    // Help/Commands
    this.helpBox = this.grid.set(11, 0, 1, 12, blessed.box, {
      content: '{center}Q: Quit | R: Refresh | S: Save Report | H: Help | Arrow Keys: Navigate{/center}',
      tags: true,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });

    // Initialize service table
    this.serviceTable.setData({
      headers: ['Service', 'Status', 'Health', 'Response'],
      data: []
    });

    this.screen.render();
  }

  setupKeyBindings() {
    // Quit
    this.screen.key(['q', 'C-c'], () => {
      return process.exit(0);
    });

    // Refresh
    this.screen.key(['r'], () => {
      this.log('Manual refresh triggered', 'info');
      this.updateDashboard();
    });

    // Save report
    this.screen.key(['s'], async () => {
      await this.saveReport();
    });

    // Help
    this.screen.key(['h'], () => {
      this.showHelp();
    });

    // Focus navigation
    this.screen.key(['tab'], () => {
      this.screen.focusNext();
    });
  }

  generateSystemMap() {
    return `
    ┌─────────────┐     ┌─────────────┐
    │   Engine    │────▶│    Slam     │
    │   (3000)    │     │   (9999)    │
    └──────┬──────┘     └──────┬──────┘
           │                   │
           ▼                   ▼
    ┌─────────────┐     ┌─────────────┐
    │  Database   │     │     MCP     │
    │   MySQL     │     │  Templates  │
    └─────────────┘     └─────────────┘
           │                   │
           ▼                   ▼
    ┌─────────────┐     ┌─────────────┐
    │  Reasoning  │     │ AI Economy  │
    │   Ollama    │     │   Agents    │
    └─────────────┘     └─────────────┘`;
  }

  async updateDashboard() {
    // Update service status
    const tableData = [];
    
    for (const [name, url] of Object.entries(this.endpoints)) {
      const status = await this.checkService(name, url);
      tableData.push([
        name,
        this.getStatusSymbol(status.status),
        `${status.health}%`,
        `${status.responseTime}ms`
      ]);
      
      this.services[name] = status;
    }
    
    this.serviceTable.setData({
      headers: ['Service', 'Status', 'Health', 'Response'],
      data: tableData
    });

    // Update metrics
    this.updateMetrics();
    
    // Update progress bars
    this.updateProgressBars();
    
    // Render
    this.screen.render();
  }

  async checkService(name, url) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, { timeout: 1000 });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        return {
          status: 'healthy',
          health: 100,
          responseTime,
          data: response.data
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNREFUSED') {
        return {
          status: 'disconnected',
          health: 0,
          responseTime,
          error: 'Connection refused'
        };
      }
      
      return {
        status: 'error',
        health: 50,
        responseTime,
        error: error.message
      };
    }
  }

  getStatusSymbol(status) {
    switch (status) {
      case 'healthy':
        return '{green-fg}● Healthy{/green-fg}';
      case 'error':
        return '{red-fg}● Error{/red-fg}';
      case 'disconnected':
        return '{yellow-fg}○ Offline{/yellow-fg}';
      default:
        return '{gray-fg}◌ Unknown{/gray-fg}';
    }
  }

  updateMetrics() {
    // Simulate CPU usage (in real app, get from system)
    const cpuUsage = Math.random() * 100;
    this.metrics.cpu.push(cpuUsage);
    if (this.metrics.cpu.length > 20) {
      this.metrics.cpu.shift();
    }
    
    // Update CPU graph
    this.cpuLine.setData([
      {
        title: 'CPU',
        x: Array.from({ length: this.metrics.cpu.length }, (_, i) => i.toString()),
        y: this.metrics.cpu
      }
    ]);
    
    // Update memory gauge
    const memoryUsage = Math.random() * 100;
    this.memoryGauge.setPercent(Math.round(memoryUsage));
    
    // Update request rate
    const healthyServices = Object.values(this.services)
      .filter(s => s.status === 'healthy').length;
    const requestRate = healthyServices * (10 + Math.random() * 20);
    
    this.metrics.requests.push(requestRate);
    if (this.metrics.requests.length > 20) {
      this.metrics.requests.shift();
    }
    
    this.requestsLine.setData([
      {
        title: 'Requests',
        x: Array.from({ length: this.metrics.requests.length }, (_, i) => i.toString()),
        y: this.metrics.requests
      }
    ]);
  }

  updateProgressBars() {
    let content = '';
    
    for (const [name, status] of Object.entries(this.services)) {
      const bar = this.generateProgressBar(status.health);
      const color = status.status === 'healthy' ? 'green' : 
                    status.status === 'error' ? 'red' : 'yellow';
      
      content += `{${color}-fg}${name.padEnd(15)}{/${color}-fg} ${bar} ${status.health}%\n`;
    }
    
    this.progressBars.setContent(content);
  }

  generateProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: 'cyan',
      success: 'green',
      warning: 'yellow',
      error: 'red'
    };
    
    const color = colors[level] || 'white';
    const logMessage = `{${color}-fg}[${timestamp}] ${message}{/${color}-fg}`;
    
    this.activityBox.log(logMessage);
    this.activityLog.push({ timestamp, message, level });
    
    // Limit log size
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      services: this.services,
      metrics: {
        avgCPU: this.metrics.cpu.reduce((a, b) => a + b, 0) / this.metrics.cpu.length,
        avgRequests: this.metrics.requests.reduce((a, b) => a + b, 0) / this.metrics.requests.length
      },
      activityLog: this.activityLog
    };
    
    const fs = require('fs').promises;
    const filename = `dashboard-report-${Date.now()}.json`;
    
    try {
      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      this.log(`Report saved to ${filename}`, 'success');
    } catch (error) {
      this.log(`Failed to save report: ${error.message}`, 'error');
    }
  }

  showHelp() {
    const helpContent = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: '50%',
      content: `
  {center}{bold}Economic Engine - Terminal Dashboard{/bold}{/center}
  
  {cyan-fg}Keyboard Commands:{/cyan-fg}
  
  Q, Ctrl+C    - Quit dashboard
  R            - Refresh all services
  S            - Save report to file
  H            - Show this help
  Tab          - Switch focus between panels
  Arrow Keys   - Navigate within panels
  
  {cyan-fg}Service Status Indicators:{/cyan-fg}
  
  {green-fg}●{/green-fg} Healthy    - Service is running normally
  {red-fg}●{/red-fg} Error      - Service has errors
  {yellow-fg}○{/yellow-fg} Offline    - Service is not responding
  
  {cyan-fg}Dashboard Panels:{/cyan-fg}
  
  • Service Status - Real-time service health
  • CPU Usage - System CPU utilization
  • Memory Usage - System memory usage
  • Request Rate - API requests per minute
  • Activity Log - System events and changes
  • System Map - Service architecture
  
  Press any key to close...`,
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'cyan'
        }
      }
    });
    
    helpContent.key(['escape', 'q', 'enter', 'space'], () => {
      helpContent.destroy();
      this.screen.render();
    });
    
    helpContent.focus();
    this.screen.render();
  }

  async start() {
    console.log(chalk.blue('Starting terminal dashboard...'));
    
    // Initial update
    await this.updateDashboard();
    this.log('Dashboard initialized', 'success');
    this.log('Monitoring all services...', 'info');
    
    // Set up auto-refresh
    this.updateInterval = setInterval(async () => {
      await this.updateDashboard();
    }, 2000); // Update every 2 seconds
    
    // Start monitoring service changes
    this.monitorServiceChanges();
  }

  monitorServiceChanges() {
    let previousStates = {};
    
    setInterval(() => {
      for (const [name, status] of Object.entries(this.services)) {
        const previous = previousStates[name];
        
        if (previous && previous.status !== status.status) {
          const message = `${name} status changed: ${previous.status} → ${status.status}`;
          const level = status.status === 'healthy' ? 'success' : 'warning';
          this.log(message, level);
        }
        
        previousStates[name] = { ...status };
      }
    }, 1000);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.screen.destroy();
    console.log(chalk.green('Dashboard stopped'));
  }
}

// Start the dashboard
if (require.main === module) {
  const dashboard = new TerminalDashboard();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    dashboard.stop();
    process.exit(0);
  });
  
  dashboard.start().catch(error => {
    console.error(chalk.red('Dashboard error:'), error);
    process.exit(1);
  });
}

module.exports = TerminalDashboard;