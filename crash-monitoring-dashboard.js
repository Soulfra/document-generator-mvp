#!/usr/bin/env node
/**
 * Real-Time Crash Monitoring Dashboard
 * 
 * Provides real-time monitoring, error boundaries, and crash visualization
 * Integrates with emergency-logging-system.js for comprehensive monitoring
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { logger, createErrorBoundary } = require('./emergency-logging-system');

class CrashMonitoringDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = process.env.CRASH_MONITOR_PORT || 8090;
        this.clients = new Set();
        this.errorBoundaries = new Map();
        this.componentStatus = new Map();
        this.alerts = [];
        
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorBoundaries();
        this.startMonitoring();
        
        logger.log('SYSTEM', 'Crash Monitoring Dashboard initialized', { port: this.port });
    }
    
    setupRoutes() {
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        
        // Serve dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // API endpoints
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                components: Array.from(this.componentStatus.entries())
            });
        });
        
        this.app.get('/api/logs', (req, res) => {
            const logs = this.getRecentLogs();
            res.json(logs);
        });
        
        this.app.get('/api/crashes', (req, res) => {
            const crashes = this.getRecentCrashes();
            res.json(crashes);
        });
        
        this.app.post('/api/report-error', (req, res) => {
            const { component, error, context } = req.body;
            this.reportComponentError(component, error, context);
            res.json({ status: 'recorded' });
        });
        
        // Component registration endpoint
        this.app.post('/api/register-component', (req, res) => {
            const { name, port, health_endpoint } = req.body;
            this.registerComponent(name, port, health_endpoint);
            res.json({ status: 'registered' });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            logger.log('INFO', 'New dashboard client connected');
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    components: Array.from(this.componentStatus.entries()),
                    alerts: this.alerts.slice(-10),
                    systemInfo: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage()
                    }
                }
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
                logger.log('INFO', 'Dashboard client disconnected');
            });
            
            ws.on('error', (error) => {
                logger.logError('WebSocket error', error);
                this.clients.delete(ws);
            });
        });
        
        // Listen to logger events
        logger.on('log', (logEntry) => {
            this.broadcastToClients({
                type: 'log',
                data: logEntry
            });
        });
        
        logger.on('crash', (crashData) => {
            this.handleCrashEvent(crashData);
        });
        
        logger.on('emergency', (emergencyData) => {
            this.handleEmergencyEvent(emergencyData);
        });
    }
    
    setupErrorBoundaries() {
        // Create error boundaries for common components
        const components = [
            'three-js-renderer',
            'spatial-matrix',
            'sound-processor',
            'dimension-mapper',
            'ai-services',
            'database-layer',
            'websocket-server',
            'auth-system'
        ];
        
        components.forEach(component => {
            const boundary = createErrorBoundary(component);
            this.errorBoundaries.set(component, boundary);
            this.componentStatus.set(component, {
                status: 'unknown',
                lastCheck: null,
                errorCount: 0,
                lastError: null
            });
        });
    }
    
    // Wrapper for protecting function calls
    protect(componentName, fn) {
        const boundary = this.errorBoundaries.get(componentName);
        if (!boundary) {
            logger.log('WARNING', `No error boundary for component: ${componentName}`);
            return fn;
        }
        
        return async (...args) => {
            try {
                this.updateComponentStatus(componentName, 'running');
                const result = await fn.apply(this, args);
                this.updateComponentStatus(componentName, 'healthy');
                return result;
            } catch (error) {
                this.reportComponentError(componentName, error);
                this.updateComponentStatus(componentName, 'error');
                throw error;
            }
        };
    }
    
    updateComponentStatus(componentName, status, additionalData = {}) {
        const current = this.componentStatus.get(componentName) || {};
        const updated = {
            ...current,
            status,
            lastCheck: new Date().toISOString(),
            ...additionalData
        };
        
        this.componentStatus.set(componentName, updated);
        
        // Broadcast status update
        this.broadcastToClients({
            type: 'component_status',
            data: {
                component: componentName,
                status: updated
            }
        });
    }
    
    reportComponentError(componentName, error, context = {}) {
        const current = this.componentStatus.get(componentName) || {};
        const errorCount = (current.errorCount || 0) + 1;
        
        this.updateComponentStatus(componentName, 'error', {
            errorCount,
            lastError: {
                message: error.message || error,
                timestamp: new Date().toISOString(),
                context
            }
        });
        
        // Create alert
        const alert = {
            id: Date.now(),
            type: 'component_error',
            component: componentName,
            message: `Error in ${componentName}: ${error.message || error}`,
            timestamp: new Date().toISOString(),
            severity: errorCount > 5 ? 'critical' : 'warning'
        };
        
        this.alerts.push(alert);
        this.alerts = this.alerts.slice(-50); // Keep last 50 alerts
        
        logger.logError(`Component error in ${componentName}`, error, context);
        
        // Broadcast alert
        this.broadcastToClients({
            type: 'alert',
            data: alert
        });
    }
    
    registerComponent(name, port, healthEndpoint) {
        logger.log('INFO', `Registering component: ${name}`, { port, healthEndpoint });
        
        const boundary = createErrorBoundary(name);
        this.errorBoundaries.set(name, boundary);
        this.componentStatus.set(name, {
            status: 'registered',
            port,
            healthEndpoint,
            lastCheck: new Date().toISOString(),
            errorCount: 0,
            lastError: null
        });
        
        // Start health checking if endpoint provided
        if (healthEndpoint) {
            this.startComponentHealthCheck(name, healthEndpoint);
        }
    }
    
    startComponentHealthCheck(componentName, healthEndpoint) {
        const checkHealth = async () => {
            try {
                const response = await fetch(healthEndpoint, { timeout: 5000 });
                if (response.ok) {
                    this.updateComponentStatus(componentName, 'healthy');
                } else {
                    this.updateComponentStatus(componentName, 'unhealthy', {
                        healthResponse: response.status
                    });
                }
            } catch (error) {
                this.updateComponentStatus(componentName, 'unreachable', {
                    healthError: error.message
                });
            }
        };
        
        // Check immediately, then every 30 seconds
        checkHealth();
        setInterval(checkHealth, 30000);
    }
    
    handleCrashEvent(crashData) {
        const alert = {
            id: Date.now(),
            type: 'crash',
            message: `System crash: ${crashData.type}`,
            timestamp: crashData.timestamp,
            severity: 'critical',
            details: crashData
        };
        
        this.alerts.push(alert);
        this.broadcastToClients({
            type: 'crash',
            data: crashData
        });
        
        // Update all components to warning status
        for (const [componentName] of this.componentStatus) {
            this.updateComponentStatus(componentName, 'warning', {
                reason: 'system_crash_detected'
            });
        }
    }
    
    handleEmergencyEvent(emergencyData) {
        const alert = {
            id: Date.now(),
            type: 'emergency',
            message: `EMERGENCY: ${emergencyData.reason}`,
            timestamp: new Date().toISOString(),
            severity: 'critical',
            details: emergencyData
        };
        
        this.alerts.push(alert);
        this.broadcastToClients({
            type: 'emergency',
            data: emergencyData
        });
    }
    
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageStr);
                } catch (error) {
                    logger.logError('Failed to send message to client', error);
                    this.clients.delete(client);
                }
            }
        });
    }
    
    startMonitoring() {
        // System health monitoring
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            this.broadcastToClients({
                type: 'system_health',
                data: {
                    memory: memUsage,
                    cpu: cpuUsage,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                }
            });
            
            // Check for memory leaks
            if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
                this.reportComponentError('system', new Error('Memory usage exceeding 1GB'), {
                    memoryUsage: memUsage
                });
            }
            
        }, 10000); // Every 10 seconds
    }
    
    getRecentLogs() {
        try {
            const logPath = path.join(__dirname, 'logs', 'system.log');
            if (!fs.existsSync(logPath)) return [];
            
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.trim().split('\n');
            
            return lines.slice(-100).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            });
        } catch (error) {
            return [{ error: 'Failed to read logs', message: error.message }];
        }
    }
    
    getRecentCrashes() {
        try {
            const crashDir = path.join(__dirname, 'logs', 'crashes');
            if (!fs.existsSync(crashDir)) return [];
            
            const crashFiles = fs.readdirSync(crashDir)
                .filter(file => file.endsWith('.json'))
                .sort()
                .slice(-10); // Last 10 crashes
            
            return crashFiles.map(file => {
                try {
                    const content = fs.readFileSync(path.join(crashDir, file), 'utf8');
                    return JSON.parse(content);
                } catch {
                    return { file, error: 'Failed to parse crash dump' };
                }
            });
        } catch (error) {
            return [{ error: 'Failed to read crash dumps', message: error.message }];
        }
    }
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚨 Crash Monitoring Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ff00; 
            overflow: hidden;
        }
        .dashboard { 
            display: grid; 
            grid-template-rows: auto 1fr; 
            height: 100vh; 
        }
        .header { 
            background: #1a1a1a; 
            padding: 10px 20px; 
            border-bottom: 2px solid #00ff00; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
        }
        .title { 
            font-size: 24px; 
            font-weight: bold; 
        }
        .status { 
            display: flex; 
            gap: 20px; 
        }
        .status-item { 
            padding: 5px 10px; 
            background: #333; 
            border-radius: 3px; 
        }
        .main { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            grid-template-rows: 1fr 1fr; 
            gap: 10px; 
            padding: 10px; 
            height: 100%;
        }
        .panel { 
            background: #1a1a1a; 
            border: 1px solid #333; 
            border-radius: 5px; 
            padding: 15px; 
            overflow: hidden;
        }
        .panel-title { 
            font-size: 18px; 
            margin-bottom: 10px; 
            border-bottom: 1px solid #333; 
            padding-bottom: 5px; 
        }
        .panel-content { 
            height: calc(100% - 35px); 
            overflow-y: auto; 
        }
        .component { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px; 
            margin: 5px 0; 
            background: #2a2a2a; 
            border-radius: 3px; 
        }
        .status-healthy { color: #00ff00; }
        .status-warning { color: #ffaa00; }
        .status-error { color: #ff4444; }
        .status-critical { color: #ff0000; background: #330000; }
        .log-entry { 
            margin: 5px 0; 
            padding: 5px; 
            font-size: 12px; 
            border-left: 3px solid #333; 
            padding-left: 10px; 
        }
        .log-error { border-color: #ff4444; }
        .log-warning { border-color: #ffaa00; }
        .log-crash { border-color: #ff0000; background: #330000; }
        .alert { 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 3px; 
            animation: pulse 2s infinite; 
        }
        .alert-critical { background: #330000; border: 1px solid #ff0000; }
        .alert-warning { background: #332200; border: 1px solid #ffaa00; }
        @keyframes pulse { 
            0% { opacity: 1; } 
            50% { opacity: 0.7; } 
            100% { opacity: 1; } 
        }
        .metrics { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
        }
        .metric { 
            background: #2a2a2a; 
            padding: 10px; 
            border-radius: 3px; 
            text-align: center; 
        }
        .metric-value { 
            font-size: 20px; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <div class="title">🚨 Crash Monitoring Dashboard</div>
            <div class="status">
                <div class="status-item">
                    Uptime: <span id="uptime">--</span>
                </div>
                <div class="status-item">
                    Memory: <span id="memory">--</span>
                </div>
                <div class="status-item">
                    Status: <span id="system-status">Connecting...</span>
                </div>
            </div>
        </div>
        
        <div class="main">
            <div class="panel">
                <div class="panel-title">🔧 Component Status</div>
                <div class="panel-content" id="components"></div>
            </div>
            
            <div class="panel">
                <div class="panel-title">🚨 Recent Alerts</div>
                <div class="panel-content" id="alerts"></div>
            </div>
            
            <div class="panel">
                <div class="panel-title">📊 System Metrics</div>
                <div class="panel-content">
                    <div class="metrics" id="metrics"></div>
                </div>
            </div>
            
            <div class="panel">
                <div class="panel-title">📋 Live Logs</div>
                <div class="panel-content" id="logs"></div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.port}');
        const components = document.getElementById('components');
        const alerts = document.getElementById('alerts');
        const logs = document.getElementById('logs');
        const metrics = document.getElementById('metrics');
        
        ws.onopen = () => {
            document.getElementById('system-status').textContent = 'Connected';
            document.getElementById('system-status').className = 'status-healthy';
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'status':
                    updateStatus(message.data);
                    break;
                case 'component_status':
                    updateComponentStatus(message.data);
                    break;
                case 'log':
                    addLogEntry(message.data);
                    break;
                case 'alert':
                    addAlert(message.data);
                    break;
                case 'system_health':
                    updateMetrics(message.data);
                    break;
                case 'crash':
                case 'emergency':
                    handleCriticalEvent(message.data);
                    break;
            }
        };
        
        function updateStatus(data) {
            updateComponents(data.components);
            updateAlerts(data.alerts);
            document.getElementById('uptime').textContent = formatUptime(data.systemInfo.uptime);
            document.getElementById('memory').textContent = formatBytes(data.systemInfo.memory.heapUsed);
        }
        
        function updateComponents(componentData) {
            components.innerHTML = componentData.map(([name, status]) => 
                \`<div class="component">
                    <span>\${name}</span>
                    <span class="status-\${getStatusClass(status.status)}">\${status.status}</span>
                </div>\`
            ).join('');
        }
        
        function updateComponentStatus(data) {
            // Update individual component
            const existing = components.querySelector(\`[data-component="\${data.component}"]\`);
            if (existing) {
                existing.outerHTML = \`<div class="component" data-component="\${data.component}">
                    <span>\${data.component}</span>
                    <span class="status-\${getStatusClass(data.status.status)}">\${data.status.status}</span>
                </div>\`;
            }
        }
        
        function addLogEntry(logData) {
            const logDiv = document.createElement('div');
            logDiv.className = \`log-entry log-\${logData.level.toLowerCase()}\`;
            logDiv.innerHTML = \`
                <div style="font-weight: bold;">[\${new Date(logData.timestamp).toLocaleTimeString()}] \${logData.level}</div>
                <div>\${logData.message}</div>
            \`;
            logs.insertBefore(logDiv, logs.firstChild);
            
            // Keep only last 50 entries
            while (logs.children.length > 50) {
                logs.removeChild(logs.lastChild);
            }
        }
        
        function addAlert(alertData) {
            const alertDiv = document.createElement('div');
            alertDiv.className = \`alert alert-\${alertData.severity}\`;
            alertDiv.innerHTML = \`
                <div style="font-weight: bold;">[\${new Date(alertData.timestamp).toLocaleTimeString()}] \${alertData.type.toUpperCase()}</div>
                <div>\${alertData.message}</div>
            \`;
            alerts.insertBefore(alertDiv, alerts.firstChild);
            
            // Keep only last 20 alerts
            while (alerts.children.length > 20) {
                alerts.removeChild(alerts.lastChild);
            }
        }
        
        function updateMetrics(data) {
            metrics.innerHTML = \`
                <div class="metric">
                    <div>Heap Used</div>
                    <div class="metric-value">\${formatBytes(data.memory.heapUsed)}</div>
                </div>
                <div class="metric">
                    <div>Heap Total</div>
                    <div class="metric-value">\${formatBytes(data.memory.heapTotal)}</div>
                </div>
                <div class="metric">
                    <div>External</div>
                    <div class="metric-value">\${formatBytes(data.memory.external)}</div>
                </div>
                <div class="metric">
                    <div>Uptime</div>
                    <div class="metric-value">\${formatUptime(data.uptime)}</div>
                </div>
            \`;
        }
        
        function getStatusClass(status) {
            if (['healthy', 'running'].includes(status)) return 'healthy';
            if (['warning', 'unhealthy'].includes(status)) return 'warning';
            if (['error', 'unreachable'].includes(status)) return 'error';
            return 'warning';
        }
        
        function formatBytes(bytes) {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${hours}h \${minutes}m \${secs}s\`;
        }
        
        function handleCriticalEvent(data) {
            document.body.style.animation = 'pulse 1s infinite';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 5000);
        }
        
        // Update uptime every second
        setInterval(() => {
            const uptimeEl = document.getElementById('uptime');
            if (uptimeEl.textContent !== '--') {
                const current = uptimeEl.textContent;
                const parts = current.match(/(\\d+)h (\\d+)m (\\d+)s/);
                if (parts) {
                    let seconds = parseInt(parts[3]) + 1;
                    let minutes = parseInt(parts[2]);
                    let hours = parseInt(parts[1]);
                    
                    if (seconds >= 60) {
                        seconds = 0;
                        minutes++;
                    }
                    if (minutes >= 60) {
                        minutes = 0;
                        hours++;
                    }
                    
                    uptimeEl.textContent = \`\${hours}h \${minutes}m \${seconds}s\`;
                }
            }
        }, 1000);
    </script>
</body>
</html>
        `;
    }
    
    start() {
        this.server.listen(this.port, () => {
            logger.log('SYSTEM', `Crash Monitoring Dashboard started on port ${this.port}`);
            console.log(`🚨 Crash Monitoring Dashboard: http://localhost:${this.port}`);
        });
    }
}

// Export for use in other modules
module.exports = {
    CrashMonitoringDashboard,
    
    // Convenience method to create protected function wrapper
    createProtectedFunction: (componentName, dashboard) => {
        return dashboard.protect.bind(dashboard, componentName);
    }
};

// If run directly, start the dashboard
if (require.main === module) {
    const dashboard = new CrashMonitoringDashboard();
    dashboard.start();
}