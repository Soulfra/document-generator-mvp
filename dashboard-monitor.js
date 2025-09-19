// Real-time Dashboard Monitor for Document Generator System
// This creates a web-based dashboard to monitor all system components

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import our system components
const ContextMemoryStreamManager = require('./context-memory-stream-manager');
const SSHTerminalRuntimeRingSystem = require('./ssh-terminal-runtime-ring-system');
const SymlinkManagerService = require('./symlink-manager.service');

class DashboardMonitor {
    constructor(port = 8888) {
        this.port = port;
        this.app = express();
        this.server = null;
        this.wss = null;
        
        // System components
        this.contextManager = null;
        this.sshSystem = null;
        this.symlinkManager = null;
        
        // Status tracking
        this.systemStatus = {
            startTime: Date.now(),
            components: {
                contextManager: { status: 'initializing', health: null },
                sshSystem: { status: 'initializing', health: null },
                symlinkManager: { status: 'initializing', health: null }
            },
            errors: [],
            metrics: {
                uptime: 0,
                totalRequests: 0,
                activeConnections: 0
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎮 Dashboard Monitor Starting...');
        
        // Setup web server
        this.setupWebServer();
        
        // Initialize components (with error handling)
        await this.initializeComponents();
        
        // Start monitoring
        this.startMonitoring();
        
        console.log(`📊 Dashboard available at http://localhost:${this.port}`);
    }
    
    setupWebServer() {
        // Serve static files
        this.app.use(express.static('public'));
        
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            this.systemStatus.metrics.totalRequests++;
            res.json(this.getFullStatus());
        });
        
        this.app.get('/api/health', (req, res) => {
            const health = this.checkOverallHealth();
            res.status(health.healthy ? 200 : 503).json(health);
        });
        
        // Serve dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
        
        // Start server
        this.server = http.createServer(this.app);
        
        // Setup WebSocket for real-time updates
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            this.systemStatus.metrics.activeConnections++;
            console.log('🔌 New dashboard connection');
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'status',
                data: this.getFullStatus()
            }));
            
            ws.on('close', () => {
                this.systemStatus.metrics.activeConnections--;
            });
        });
        
        this.server.listen(this.port);
    }
    
    async initializeComponents() {
        // Initialize Context Manager
        try {
            console.log('🧠 Initializing Context Manager...');
            this.contextManager = new ContextMemoryStreamManager();
            this.systemStatus.components.contextManager.status = 'running';
            
            // Listen for events
            this.contextManager.on('context-stream-update', (data) => {
                this.broadcast({
                    type: 'context-update',
                    component: 'contextManager',
                    data
                });
            });
        } catch (error) {
            console.error('❌ Context Manager failed:', error.message);
            this.systemStatus.components.contextManager.status = 'error';
            this.systemStatus.errors.push({
                component: 'contextManager',
                error: error.message,
                timestamp: Date.now()
            });
        }
        
        // Initialize SSH System
        try {
            console.log('🔐 Initializing SSH System...');
            this.sshSystem = new SSHTerminalRuntimeRingSystem();
            this.systemStatus.components.sshSystem.status = 'running';
            
            // Listen for events
            this.sshSystem.on('ring_switched', (data) => {
                this.broadcast({
                    type: 'ring-switch',
                    component: 'sshSystem',
                    data
                });
            });
            
            this.sshSystem.on('database_switched', (data) => {
                this.broadcast({
                    type: 'database-switch',
                    component: 'sshSystem',
                    data
                });
            });
        } catch (error) {
            console.error('❌ SSH System failed:', error.message);
            this.systemStatus.components.sshSystem.status = 'error';
            this.systemStatus.errors.push({
                component: 'sshSystem',
                error: error.message,
                timestamp: Date.now()
            });
        }
        
        // Initialize Symlink Manager
        try {
            console.log('🔗 Initializing Symlink Manager...');
            this.symlinkManager = new SymlinkManagerService();
            this.systemStatus.components.symlinkManager.status = 'running';
        } catch (error) {
            console.error('❌ Symlink Manager failed:', error.message);
            this.systemStatus.components.symlinkManager.status = 'error';
            this.systemStatus.errors.push({
                component: 'symlinkManager',
                error: error.message,
                timestamp: Date.now()
            });
        }
    }
    
    startMonitoring() {
        // Update system metrics every second
        setInterval(() => {
            this.updateSystemMetrics();
        }, 1000);
        
        // Update component health every 5 seconds
        setInterval(() => {
            this.updateComponentHealth();
        }, 5000);
    }
    
    updateSystemMetrics() {
        this.systemStatus.metrics.uptime = Date.now() - this.systemStatus.startTime;
        
        // Broadcast update
        this.broadcast({
            type: 'metrics',
            data: this.systemStatus.metrics
        });
    }
    
    async updateComponentHealth() {
        // Update Context Manager health
        if (this.contextManager && this.systemStatus.components.contextManager.status === 'running') {
            try {
                const health = this.contextManager.getSystemHealth();
                this.systemStatus.components.contextManager.health = health;
            } catch (error) {
                this.systemStatus.components.contextManager.status = 'error';
            }
        }
        
        // Update SSH System health
        if (this.sshSystem && this.systemStatus.components.sshSystem.status === 'running') {
            try {
                const status = this.sshSystem.getDatabaseStatus();
                this.systemStatus.components.sshSystem.health = {
                    runtimeRings: Object.values(this.sshSystem.runtimeRings),
                    databaseStatus: status,
                    currentRing: this.sshSystem.currentRing
                };
            } catch (error) {
                this.systemStatus.components.sshSystem.status = 'error';
            }
        }
        
        // Update Symlink Manager health
        if (this.symlinkManager && this.systemStatus.components.symlinkManager.status === 'running') {
            try {
                const status = await this.symlinkManager.getStatus();
                this.systemStatus.components.symlinkManager.health = status;
            } catch (error) {
                this.systemStatus.components.symlinkManager.status = 'error';
            }
        }
        
        // Broadcast health update
        this.broadcast({
            type: 'health',
            data: this.systemStatus.components
        });
    }
    
    getFullStatus() {
        return {
            ...this.systemStatus,
            timestamp: Date.now()
        };
    }
    
    checkOverallHealth() {
        const components = Object.values(this.systemStatus.components);
        const runningCount = components.filter(c => c.status === 'running').length;
        const errorCount = components.filter(c => c.status === 'error').length;
        
        return {
            healthy: errorCount === 0,
            running: runningCount,
            errors: errorCount,
            total: components.length,
            uptime: this.systemStatus.metrics.uptime
        };
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Document Generator - System Dashboard</title>
    <style>
        body {
            font-family: 'Monaco', monospace;
            background: #0a0a0a;
            color: #00ff88;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 10px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .metric {
            background: rgba(26, 26, 46, 0.8);
            padding: 20px;
            border: 1px solid #00ff88;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            color: #88ff00;
        }
        .component {
            margin: 20px 0;
            padding: 20px;
            background: rgba(16, 33, 62, 0.8);
            border-left: 4px solid #00ccff;
            border-radius: 5px;
        }
        .component.running { border-left-color: #00ff00; }
        .component.error { border-left-color: #ff0000; }
        .component.initializing { border-left-color: #ffcc00; }
        .status { font-weight: bold; }
        .error-log {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff0000;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        #terminal {
            background: #000;
            padding: 15px;
            border-radius: 8px;
            height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.9em;
            border: 1px solid #333;
            margin: 20px 0;
        }
        .log-entry {
            margin: 2px 0;
        }
        .log-time {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Document Generator System Dashboard</h1>
        <p>Real-time monitoring of all system components</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <div>Uptime</div>
            <div class="metric-value" id="uptime">0s</div>
        </div>
        <div class="metric">
            <div>Active Connections</div>
            <div class="metric-value" id="connections">0</div>
        </div>
        <div class="metric">
            <div>Total Requests</div>
            <div class="metric-value" id="requests">0</div>
        </div>
        <div class="metric">
            <div>System Health</div>
            <div class="metric-value" id="health">--</div>
        </div>
    </div>
    
    <h2>📊 Component Status</h2>
    
    <div id="components">
        <div class="component initializing">
            <h3>🧠 Context Memory Stream Manager</h3>
            <div class="status">Status: <span id="contextManager-status">Initializing...</span></div>
            <div id="contextManager-details"></div>
        </div>
        
        <div class="component initializing">
            <h3>🔐 SSH Terminal Runtime Ring System</h3>
            <div class="status">Status: <span id="sshSystem-status">Initializing...</span></div>
            <div id="sshSystem-details"></div>
        </div>
        
        <div class="component initializing">
            <h3>🔗 Symlink Manager Service</h3>
            <div class="status">Status: <span id="symlinkManager-status">Initializing...</span></div>
            <div id="symlinkManager-details"></div>
        </div>
    </div>
    
    <h2>📝 System Log</h2>
    <div id="terminal"></div>
    
    <div id="errors"></div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8888');
        const terminal = document.getElementById('terminal');
        
        function log(message, type = 'info') {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const time = new Date().toLocaleTimeString();
            entry.innerHTML = '<span class="log-time">' + time + '</span> ' + message;
            terminal.appendChild(entry);
            terminal.scrollTop = terminal.scrollHeight;
            
            // Keep only last 100 entries
            while (terminal.children.length > 100) {
                terminal.removeChild(terminal.firstChild);
            }
        }
        
        ws.onopen = () => {
            log('✅ Connected to dashboard monitor');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'status':
                    updateFullStatus(message.data);
                    break;
                case 'metrics':
                    updateMetrics(message.data);
                    break;
                case 'health':
                    updateComponentHealth(message.data);
                    break;
                case 'context-update':
                    log('🧠 Context stream update: ' + message.data.stream);
                    break;
                case 'ring-switch':
                    log('🔄 Runtime ring switched: ' + message.data.oldRing + ' → ' + message.data.newRing);
                    break;
                case 'database-switch':
                    log('💾 Database switched: ' + message.data.oldPrimary + ' → ' + message.data.newPrimary);
                    break;
            }
        };
        
        ws.onclose = () => {
            log('❌ Disconnected from dashboard monitor', 'error');
        };
        
        function updateFullStatus(status) {
            updateMetrics(status.metrics);
            
            // Update component statuses
            for (const [name, component] of Object.entries(status.components)) {
                updateComponentStatus(name, component);
            }
            
            // Update errors
            if (status.errors.length > 0) {
                const errorsDiv = document.getElementById('errors');
                errorsDiv.innerHTML = '<h2>❌ Errors</h2>';
                status.errors.forEach(error => {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-log';
                    errorDiv.textContent = error.component + ': ' + error.error;
                    errorsDiv.appendChild(errorDiv);
                });
            }
        }
        
        function updateMetrics(metrics) {
            document.getElementById('uptime').textContent = formatUptime(metrics.uptime);
            document.getElementById('connections').textContent = metrics.activeConnections;
            document.getElementById('requests').textContent = metrics.totalRequests;
        }
        
        function updateComponentStatus(name, component) {
            const statusEl = document.getElementById(name + '-status');
            const detailsEl = document.getElementById(name + '-details');
            const componentEl = statusEl.closest('.component');
            
            if (statusEl) {
                statusEl.textContent = component.status;
                componentEl.className = 'component ' + component.status;
            }
            
            if (detailsEl && component.health) {
                detailsEl.innerHTML = formatComponentHealth(name, component.health);
            }
        }
        
        function updateComponentHealth(components) {
            let healthyCount = 0;
            let totalCount = 0;
            
            for (const [name, component] of Object.entries(components)) {
                totalCount++;
                if (component.status === 'running') healthyCount++;
                updateComponentStatus(name, component);
            }
            
            const healthEl = document.getElementById('health');
            healthEl.textContent = healthyCount + '/' + totalCount;
            healthEl.style.color = healthyCount === totalCount ? '#00ff00' : 
                                  healthyCount > 0 ? '#ffcc00' : '#ff0000';
        }
        
        function formatComponentHealth(name, health) {
            let html = '';
            
            if (name === 'contextManager') {
                html += '<div>Streams: ' + Object.keys(health.contextStreams || {}).length + '</div>';
                html += '<div>Memory Pools: ' + Object.keys(health.memoryPools || {}).length + '</div>';
                html += '<div>Layer States: ' + Object.keys(health.layerStates || {}).length + '</div>';
            } else if (name === 'sshSystem') {
                if (health.currentRing) {
                    html += '<div>Current Ring: ' + health.currentRing + '</div>';
                }
                if (health.databaseStatus) {
                    html += '<div>Primary DB: ' + health.databaseStatus.current_primary + '</div>';
                    html += '<div>Secondary DB: ' + health.databaseStatus.current_secondary + '</div>';
                }
            } else if (name === 'symlinkManager') {
                html += '<div>Version: ' + (health.version || 'unknown') + '</div>';
                html += '<div>Links: ' + Object.keys(health.links || {}).length + '</div>';
                html += '<div>Cloud Mounts: ' + (health.cloud_mounts || []).length + '</div>';
            }
            
            return html;
        }
        
        function formatUptime(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                return hours + 'h ' + (minutes % 60) + 'm';
            } else if (minutes > 0) {
                return minutes + 'm ' + (seconds % 60) + 's';
            } else {
                return seconds + 's';
            }
        }
        
        // Auto-refresh status every 5 seconds
        setInterval(() => {
            fetch('/api/status')
                .then(res => res.json())
                .then(status => updateFullStatus(status))
                .catch(err => log('Failed to fetch status: ' + err.message, 'error'));
        }, 5000);
    </script>
</body>
</html>`;
    }
    
    async shutdown() {
        console.log('🛑 Shutting down dashboard monitor...');
        
        // Close WebSocket connections
        this.wss.clients.forEach((client) => {
            client.close();
        });
        
        // Stop server
        if (this.server) {
            this.server.close();
        }
        
        // Cleanup components
        if (this.sshSystem && this.sshSystem.server) {
            this.sshSystem.server.close();
        }
    }
}

// Run the dashboard
if (require.main === module) {
    const dashboard = new DashboardMonitor();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await dashboard.shutdown();
        process.exit(0);
    });
}

module.exports = DashboardMonitor;