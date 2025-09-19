#!/usr/bin/env node

/**
 * 🚨 SYSTEM SCREAMER - Alert & Notification Workflow
 * 
 * SCREAMS when services are down, failing, or not responding
 * Automated recovery, notifications, and emergency procedures
 */

const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const { EventEmitter } = require('events');

class SystemScreamer extends EventEmitter {
    constructor() {
        super();
        
        this.alertPort = 4444;
        this.wsPort = 4445;
        
        // CRITICAL SERVICES TO MONITOR
        this.criticalServices = new Map([
            ['master-router', { 
                port: 5555, 
                path: '/', 
                critical: true,
                restartCommand: 'node master-gaming-router.js',
                expectedKeyword: 'Master Gaming Router'
            }],
            ['spatial-router', { 
                port: 8800, 
                path: '/', 
                critical: true,
                restartCommand: 'node spatial-arpanet-router.js',
                expectedKeyword: 'Spatial ARPANET Router'
            }],
            ['character-theater', { 
                port: 9950, 
                path: '/', 
                critical: true,
                restartCommand: 'node character-mascot-world-builder.js',
                expectedKeyword: 'MAaaS'
            }],
            ['gaming-engine', { 
                port: 8888, 
                path: '/api/status', 
                critical: true,
                restartCommand: 'node WORKING-GAMING-ENGINE.js',
                expectedKeyword: 'gaming'
            }],
            ['gaming-port-router', { 
                port: 9999, 
                path: '/', 
                critical: false,
                restartCommand: 'node gaming-port-router.js',
                expectedKeyword: 'Gaming Port Router'
            }],
            ['blamechain-api', { 
                port: 7777, 
                path: '/api/universal-status', 
                critical: false,
                restartCommand: null,
                expectedKeyword: 'BlameChain'
            }]
        ]);
        
        // ALERT LEVELS
        this.alertLevels = {
            WHISPER: { level: 1, icon: '🔇', color: '\x1b[37m' },
            NORMAL: { level: 2, icon: '🔔', color: '\x1b[33m' },
            LOUD: { level: 3, icon: '📢', color: '\x1b[31m' },
            SCREAM: { level: 4, icon: '🚨', color: '\x1b[41m\x1b[37m' },
            EMERGENCY: { level: 5, icon: '💥', color: '\x1b[45m\x1b[37m' }
        };
        
        // MONITORING STATE
        this.serviceStates = new Map();
        this.alertHistory = [];
        this.activeAlerts = new Set();
        this.emergencyMode = false;
        this.restartAttempts = new Map();
        
        // NOTIFICATION CHANNELS
        this.notificationChannels = [];
        this.connections = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🚨 STARTING SYSTEM SCREAMER...');
        console.log('🔥 Ready to SCREAM when things break!');
        
        // Start monitoring immediately
        this.startMonitoring();
        
        // Start alert dashboard
        this.startAlertDashboard();
        
        // Start WebSocket alert feed
        this.startWebSocketAlerts();
        
        // Emergency shutdown handler
        this.setupEmergencyHandlers();
        
        console.log(`🚨 System Screamer online at port ${this.alertPort}`);
        console.log(`📡 Alert feed at ws://localhost:${this.wsPort}`);
        console.log('🔊 MONITORING ALL CRITICAL SERVICES...');
    }
    
    startMonitoring() {
        // AGGRESSIVE monitoring - check every 5 seconds
        setInterval(() => {
            this.checkAllServices();
        }, 5000);
        
        // DEEP health check every 30 seconds
        setInterval(() => {
            this.deepHealthCheck();
        }, 30000);
        
        // System recovery check every minute
        setInterval(() => {
            this.attemptSystemRecovery();
        }, 60000);
        
        console.log('👁️ AGGRESSIVE MONITORING STARTED');
        console.log('⚡ Checking every 5 seconds, deep check every 30s');
    }
    
    async checkAllServices() {
        const timestamp = new Date().toISOString();
        let criticalFailures = 0;
        let totalFailures = 0;
        
        for (const [serviceName, config] of this.criticalServices) {
            try {
                const startTime = Date.now();
                const response = await fetch(`http://localhost:${config.port}${config.path}`, {
                    timeout: 3000,
                    headers: { 'User-Agent': 'SystemScreamer/1.0' }
                });
                
                const responseTime = Date.now() - startTime;
                const responseText = await response.text();
                
                if (response.ok) {
                    // Check if response contains expected content
                    if (config.expectedKeyword && !responseText.toLowerCase().includes(config.expectedKeyword.toLowerCase())) {
                        this.alertServiceProblem(serviceName, 'WRONG_RESPONSE', `Response missing keyword: ${config.expectedKeyword}`);
                    } else if (responseTime > 5000) {
                        this.alertServiceProblem(serviceName, 'SLOW_RESPONSE', `Response time: ${responseTime}ms`);
                    } else {
                        this.serviceRecovered(serviceName);
                    }
                } else {
                    this.alertServiceDown(serviceName, response.status, `HTTP ${response.status}`);
                    if (config.critical) criticalFailures++;
                    totalFailures++;
                }
                
            } catch (error) {
                this.alertServiceDown(serviceName, 0, error.message);
                if (config.critical) criticalFailures++;
                totalFailures++;
            }
        }
        
        // SYSTEM-WIDE ALERTS
        if (criticalFailures > 0) {
            this.SCREAM(`🚨 ${criticalFailures} CRITICAL SERVICES DOWN!`, 'EMERGENCY');
        } else if (totalFailures > 2) {
            this.SCREAM(`📢 ${totalFailures} services failing`, 'LOUD');
        }
        
        // Update system state
        this.updateSystemState(criticalFailures, totalFailures);
    }
    
    alertServiceDown(serviceName, statusCode, reason) {
        const alertKey = `${serviceName}-down`;
        
        if (!this.activeAlerts.has(alertKey)) {
            const config = this.criticalServices.get(serviceName);
            const level = config.critical ? 'SCREAM' : 'LOUD';
            
            this.SCREAM(`🚨 SERVICE DOWN: ${serviceName.toUpperCase()}`, level);
            this.SCREAM(`   Port: ${config.port}`, level);
            this.SCREAM(`   Reason: ${reason}`, level);
            
            this.activeAlerts.add(alertKey);
            
            // Attempt automatic restart if possible
            if (config.restartCommand) {
                this.scheduleServiceRestart(serviceName);
            }
        }
    }
    
    alertServiceProblem(serviceName, problemType, details) {
        const alertKey = `${serviceName}-${problemType}`;
        
        if (!this.activeAlerts.has(alertKey)) {
            this.SCREAM(`⚠️ SERVICE PROBLEM: ${serviceName.toUpperCase()}`, 'NORMAL');
            this.SCREAM(`   Issue: ${problemType}`, 'NORMAL');
            this.SCREAM(`   Details: ${details}`, 'NORMAL');
            
            this.activeAlerts.add(alertKey);
        }
    }
    
    serviceRecovered(serviceName) {
        const downAlert = `${serviceName}-down`;
        const problemAlerts = Array.from(this.activeAlerts).filter(alert => alert.startsWith(serviceName));
        
        if (problemAlerts.length > 0) {
            this.SCREAM(`✅ SERVICE RECOVERED: ${serviceName.toUpperCase()}`, 'NORMAL');
            
            problemAlerts.forEach(alert => this.activeAlerts.delete(alert));
            this.restartAttempts.delete(serviceName);
        }
        
        // Update service state
        this.serviceStates.set(serviceName, {
            status: 'healthy',
            lastCheck: Date.now(),
            consecutiveFailures: 0
        });
    }
    
    scheduleServiceRestart(serviceName) {
        const attempts = this.restartAttempts.get(serviceName) || 0;
        
        if (attempts >= 3) {
            this.SCREAM(`💥 GIVING UP ON ${serviceName.toUpperCase()} - TOO MANY RESTART ATTEMPTS`, 'EMERGENCY');
            return;
        }
        
        this.restartAttempts.set(serviceName, attempts + 1);
        
        setTimeout(() => {
            this.attemptServiceRestart(serviceName);
        }, 10000); // Wait 10 seconds before restart
    }
    
    async attemptServiceRestart(serviceName) {
        const config = this.criticalServices.get(serviceName);
        const attempts = this.restartAttempts.get(serviceName) || 0;
        
        this.SCREAM(`🔄 ATTEMPTING RESTART: ${serviceName.toUpperCase()} (Attempt ${attempts}/3)`, 'LOUD');
        
        try {
            // Kill existing process on port
            await this.killProcessOnPort(config.port);
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start new process
            const process = spawn('bash', ['-c', config.restartCommand], {
                detached: true,
                stdio: 'ignore'
            });
            
            process.unref();
            
            this.SCREAM(`🚀 RESTART INITIATED: ${serviceName.toUpperCase()}`, 'NORMAL');
            
            // Check if restart worked after 5 seconds
            setTimeout(() => {
                this.verifyRestartSuccess(serviceName);
            }, 5000);
            
        } catch (error) {
            this.SCREAM(`💥 RESTART FAILED: ${serviceName.toUpperCase()} - ${error.message}`, 'EMERGENCY');
        }
    }
    
    async killProcessOnPort(port) {
        return new Promise((resolve) => {
            const process = spawn('lsof', ['-ti', `:${port}`]);
            let pids = '';
            
            process.stdout.on('data', (data) => {
                pids += data.toString();
            });
            
            process.on('close', (code) => {
                if (pids.trim()) {
                    const pidList = pids.trim().split('\n');
                    pidList.forEach(pid => {
                        try {
                            spawn('kill', ['-9', pid]);
                        } catch (error) {
                            // Ignore kill errors
                        }
                    });
                }
                resolve();
            });
        });
    }
    
    async verifyRestartSuccess(serviceName) {
        const config = this.criticalServices.get(serviceName);
        
        try {
            const response = await fetch(`http://localhost:${config.port}${config.path}`, {
                timeout: 5000
            });
            
            if (response.ok) {
                this.SCREAM(`✅ RESTART SUCCESSFUL: ${serviceName.toUpperCase()}`, 'NORMAL');
                this.serviceRecovered(serviceName);
            } else {
                this.SCREAM(`❌ RESTART FAILED: ${serviceName.toUpperCase()} - Still returning ${response.status}`, 'LOUD');
            }
        } catch (error) {
            this.SCREAM(`❌ RESTART FAILED: ${serviceName.toUpperCase()} - Still unreachable`, 'LOUD');
        }
    }
    
    async deepHealthCheck() {
        this.SCREAM('🔍 PERFORMING DEEP HEALTH CHECK...', 'WHISPER');
        
        // Check system resources
        const systemStats = await this.getSystemStats();
        
        if (systemStats.memoryUsage > 90) {
            this.SCREAM(`🚨 HIGH MEMORY USAGE: ${systemStats.memoryUsage}%`, 'SCREAM');
        }
        
        if (systemStats.cpuUsage > 90) {
            this.SCREAM(`🚨 HIGH CPU USAGE: ${systemStats.cpuUsage}%`, 'SCREAM');
        }
        
        // Check disk space
        if (systemStats.diskUsage > 90) {
            this.SCREAM(`🚨 LOW DISK SPACE: ${systemStats.diskUsage}% used`, 'SCREAM');
        }
        
        // Check for zombie processes
        const zombieProcesses = await this.findZombieProcesses();
        if (zombieProcesses.length > 0) {
            this.SCREAM(`🧟 ZOMBIE PROCESSES FOUND: ${zombieProcesses.length}`, 'LOUD');
        }
    }
    
    async getSystemStats() {
        // Mock system stats - replace with real monitoring
        return {
            memoryUsage: Math.floor(Math.random() * 100),
            cpuUsage: Math.floor(Math.random() * 100),
            diskUsage: Math.floor(Math.random() * 100)
        };
    }
    
    async findZombieProcesses() {
        return new Promise((resolve) => {
            const process = spawn('ps', ['aux']);
            let output = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.on('close', () => {
                const zombies = output.split('\n').filter(line => line.includes('<defunct>'));
                resolve(zombies);
            });
        });
    }
    
    SCREAM(message, level = 'NORMAL') {
        const alert = this.alertLevels[level];
        const timestamp = new Date().toISOString();
        
        // Console output with colors
        console.log(`${alert.color}${alert.icon} [${level}] ${timestamp}: ${message}\x1b[0m`);
        
        // Store in history
        const alertRecord = {
            timestamp,
            level,
            message,
            id: Date.now().toString(36)
        };
        
        this.alertHistory.unshift(alertRecord);
        
        // Keep only last 100 alerts
        if (this.alertHistory.length > 100) {
            this.alertHistory = this.alertHistory.slice(0, 100);
        }
        
        // Broadcast to WebSocket connections
        this.broadcastAlert(alertRecord);
        
        // Emit event for external handlers
        this.emit('alert', alertRecord);
    }
    
    startAlertDashboard() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            
            if (url.pathname === '/') {
                this.showAlertDashboard(res);
            } else if (url.pathname === '/api/alerts') {
                this.showAlertsAPI(res);
            } else if (url.pathname === '/api/services') {
                this.showServicesAPI(res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.alertPort);
    }
    
    startWebSocketAlerts() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            const connectionId = Date.now().toString(36);
            this.connections.set(connectionId, ws);
            
            // Send recent alerts
            ws.send(JSON.stringify({
                type: 'alert-history',
                alerts: this.alertHistory.slice(0, 10)
            }));
            
            ws.on('close', () => {
                this.connections.delete(connectionId);
            });
        });
    }
    
    broadcastAlert(alertRecord) {
        const message = JSON.stringify({
            type: 'new-alert',
            alert: alertRecord
        });
        
        for (const [connectionId, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }
    
    showAlertDashboard(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🚨 System Screamer Dashboard</title>
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; padding: 20px; }
        .alert-EMERGENCY { background: #ff00ff; color: white; }
        .alert-SCREAM { background: #ff0000; color: white; }
        .alert-LOUD { background: #ff8800; color: black; }
        .alert-NORMAL { background: #ffff00; color: black; }
        .alert-WHISPER { background: #888; color: white; }
        .alert { padding: 10px; margin: 5px 0; border-left: 5px solid #00ff00; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
        .service { padding: 10px; border: 1px solid #333; }
        .healthy { border-color: #00ff00; }
        .unhealthy { border-color: #ff0000; }
    </style>
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new-alert') {
                addAlert(data.alert);
            }
        };
        
        function addAlert(alert) {
            const alertsDiv = document.getElementById('alerts');
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-' + alert.level;
            alertDiv.innerHTML = alert.icon + ' [' + alert.level + '] ' + alert.timestamp + ': ' + alert.message;
            alertsDiv.insertBefore(alertDiv, alertsDiv.firstChild);
        }
    </script>
</head>
<body>
    <h1>🚨 SYSTEM SCREAMER DASHBOARD</h1>
    <h2>🔊 LIVE ALERTS</h2>
    <div id="alerts">
        ${this.alertHistory.slice(0, 10).map(alert => 
            `<div class="alert alert-${alert.level}">${alert.icon} [${alert.level}] ${alert.timestamp}: ${alert.message}</div>`
        ).join('')}
    </div>
    
    <h2>📊 SERVICE STATUS</h2>
    <div class="services">
        ${Array.from(this.criticalServices.entries()).map(([name, config]) => {
            const state = this.serviceStates.get(name) || { status: 'unknown' };
            return `<div class="service ${state.status === 'healthy' ? 'healthy' : 'unhealthy'}">
                <strong>${name.toUpperCase()}</strong><br>
                Port: ${config.port}<br>
                Status: ${state.status}<br>
                Critical: ${config.critical ? 'YES' : 'NO'}
            </div>`;
        }).join('')}
    </div>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    showAlertsAPI(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            alerts: this.alertHistory,
            activeAlerts: Array.from(this.activeAlerts),
            emergencyMode: this.emergencyMode
        }));
    }
    
    showServicesAPI(res) {
        const services = {};
        for (const [name, config] of this.criticalServices) {
            services[name] = {
                ...config,
                state: this.serviceStates.get(name) || { status: 'unknown' },
                restartAttempts: this.restartAttempts.get(name) || 0
            };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(services));
    }
    
    updateSystemState(criticalFailures, totalFailures) {
        if (criticalFailures >= 2) {
            this.emergencyMode = true;
            this.SCREAM('💥 ENTERING EMERGENCY MODE - MULTIPLE CRITICAL SERVICES DOWN', 'EMERGENCY');
        } else if (this.emergencyMode && criticalFailures === 0) {
            this.emergencyMode = false;
            this.SCREAM('✅ EXITING EMERGENCY MODE - CRITICAL SERVICES RESTORED', 'LOUD');
        }
    }
    
    attemptSystemRecovery() {
        if (this.emergencyMode) {
            this.SCREAM('🔄 ATTEMPTING FULL SYSTEM RECOVERY...', 'EMERGENCY');
            
            // Try to restart all critical services
            for (const [serviceName, config] of this.criticalServices) {
                if (config.critical && config.restartCommand) {
                    const state = this.serviceStates.get(serviceName);
                    if (!state || state.status !== 'healthy') {
                        this.scheduleServiceRestart(serviceName);
                    }
                }
            }
        }
    }
    
    setupEmergencyHandlers() {
        process.on('SIGINT', () => {
            this.SCREAM('🛑 SYSTEM SCREAMER SHUTTING DOWN', 'EMERGENCY');
            process.exit(0);
        });
        
        process.on('uncaughtException', (error) => {
            this.SCREAM(`💥 UNCAUGHT EXCEPTION: ${error.message}`, 'EMERGENCY');
            console.error(error.stack);
        });
    }
}

// Start the screamer
if (require.main === module) {
    const screamer = new SystemScreamer();
    
    // Test alerts
    setTimeout(() => {
        screamer.SCREAM('🔥 System Screamer is ONLINE and MONITORING!', 'LOUD');
    }, 2000);
}

module.exports = SystemScreamer;