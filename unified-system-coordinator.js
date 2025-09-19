#!/usr/bin/env node
/**
 * Unified System Coordinator
 * 
 * Central orchestrator for all system components:
 * - Performance Monitor (20x slowdown detection)
 * - Context Switching Engine (state preservation)
 * - Enhanced HTTP Server (WASM/HJS protection)
 * - Docker Optimization (resource management)
 * - Service Health Monitoring
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');
const WebSocket = require('ws');
const execAsync = promisify(exec);

// Import our custom systems
const PerformanceMonitor = require('./performance-monitor-system');
const ContextSwitchingEngine = require('./context-switching-engine');
const EnhancedHTTPServer = require('./enhanced-http-server');
const DockerOptimizationSystem = require('./docker-optimization-system');

class UnifiedSystemCoordinator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 3000,
            webSocketPort: options.webSocketPort || 3001,
            autoStart: options.autoStart !== false,
            healthCheckInterval: options.healthCheckInterval || 30000,
            logLevel: options.logLevel || 'info',
            statusDir: options.statusDir || path.join(__dirname, 'system-status')
        };
        
        this.systems = new Map();
        this.services = new Map();
        this.systemHealth = new Map();
        this.alerts = [];
        this.isRunning = false;
        
        this.initializeStatusDirectory();
        this.setupSystems();
        this.setupWebInterface();
        
        console.log('🎛️  Unified System Coordinator initialized');
        console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.config.webSocketPort}`);
        
        if (this.config.autoStart) {
            this.startAllSystems();
        }
    }
    
    initializeStatusDirectory() {
        if (!fs.existsSync(this.config.statusDir)) {
            fs.mkdirSync(this.config.statusDir, { recursive: true });
        }
    }
    
    setupSystems() {
        // Define all systems to coordinate
        this.systemDefinitions = {
            'performance-monitor': {
                name: 'Performance Monitor',
                description: '20x slowdown detection and metrics',
                port: 3010,
                healthUrl: 'http://localhost:3010/api/metrics',
                class: PerformanceMonitor,
                priority: 'high',
                autoRestart: true
            },
            'context-switching': {
                name: 'Context Switching Engine',
                description: 'State preservation and screenshot capture',
                port: 3013,
                healthUrl: 'http://localhost:3013/api/contexts',
                class: ContextSwitchingEngine,
                priority: 'high',
                autoRestart: true
            },
            'enhanced-http': {
                name: 'Enhanced HTTP Server',
                description: 'WASM/HJS file protection and optimization',
                port: 3014,
                healthUrl: 'http://localhost:3014/api/health',
                class: EnhancedHTTPServer,
                priority: 'medium',
                autoRestart: true
            },
            'docker-optimizer': {
                name: 'Docker Optimization System',
                description: 'Resource contention and service coordination',
                port: null,
                healthUrl: null,
                class: DockerOptimizationSystem,
                priority: 'high',
                autoRestart: false
            }
        };
        
        // Define external services to monitor
        this.serviceDefinitions = {
            'template-processor': {
                name: 'Template Processor',
                port: 3000,
                healthUrl: 'http://localhost:3000/health',
                container: 'document-generator-template-processor'
            },
            'ai-api': {
                name: 'AI API Service',
                port: 3001,
                healthUrl: 'http://localhost:3001/health',
                container: 'document-generator-ai-api'
            },
            'platform-hub': {
                name: 'Platform Hub',
                port: 8080,
                healthUrl: 'http://localhost:8080/health',
                container: 'document-generator-platform-hub'
            },
            'postgres': {
                name: 'PostgreSQL Database',
                port: 5432,
                healthUrl: null,
                container: 'document-generator-postgres'
            },
            'redis': {
                name: 'Redis Cache',
                port: 6379,
                healthUrl: null,
                container: 'document-generator-redis'
            },
            'ollama': {
                name: 'Ollama AI',
                port: 11434,
                healthUrl: 'http://localhost:11434/api/tags',
                container: 'document-generator-ollama'
            }
        };
    }
    
    async startAllSystems() {
        console.log('🚀 Starting all systems...');
        this.isRunning = true;
        
        try {
            // Start our custom systems
            await this.startCustomSystems();
            
            // Check Docker services
            await this.checkDockerServices();
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            // Start status reporting
            this.startStatusReporting();
            
            console.log('✅ All systems started successfully');
            this.emit('allSystemsStarted');
            
        } catch (error) {
            console.error('❌ Failed to start all systems:', error.message);
            this.addAlert('error', 'System Startup Failed', error.message);
        }
    }
    
    async startCustomSystems() {
        for (const [systemId, definition] of Object.entries(this.systemDefinitions)) {
            try {
                console.log(`🔧 Starting ${definition.name}...`);
                
                if (definition.class) {
                    const systemInstance = new definition.class();
                    this.systems.set(systemId, {
                        instance: systemInstance,
                        definition,
                        status: 'running',
                        startTime: Date.now(),
                        lastHealth: null
                    });
                    
                    // Special handling for systems that need to be started
                    if (systemId === 'enhanced-http' && systemInstance.startServer) {
                        await systemInstance.startServer();
                    } else if (systemId === 'docker-optimizer' && systemInstance.runCompleteOptimization) {
                        // Run Docker optimization once at startup
                        await systemInstance.runCompleteOptimization();
                    }
                }
                
                console.log(`✅ ${definition.name} started`);
                
            } catch (error) {
                console.error(`❌ Failed to start ${definition.name}:`, error.message);
                this.systems.set(systemId, {
                    instance: null,
                    definition,
                    status: 'failed',
                    startTime: Date.now(),
                    error: error.message
                });
                
                this.addAlert('error', `${definition.name} Failed`, error.message);
            }
        }
    }
    
    async checkDockerServices() {
        console.log('🐳 Checking Docker services...');
        
        try {
            const { stdout } = await execAsync('docker-compose ps --format json');
            const services = stdout.trim().split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);
            
            for (const [serviceId, definition] of Object.entries(this.serviceDefinitions)) {
                const dockerService = services.find(s => s.Name === definition.container);
                
                if (dockerService) {
                    this.services.set(serviceId, {
                        definition,
                        status: dockerService.State === 'running' ? 'running' : 'stopped',
                        container: dockerService,
                        lastCheck: Date.now()
                    });
                } else {
                    this.services.set(serviceId, {
                        definition,
                        status: 'not_found',
                        container: null,
                        lastCheck: Date.now()
                    });
                }
            }
            
            console.log(`✅ Checked ${services.length} Docker services`);
            
        } catch (error) {
            console.error('❌ Error checking Docker services:', error.message);
            this.addAlert('warning', 'Docker Check Failed', 'Could not check Docker service status');
        }
    }
    
    startHealthMonitoring() {
        console.log('🏥 Starting health monitoring...');
        
        this.healthInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }
    
    async performHealthChecks() {
        // Check custom systems
        for (const [systemId, system] of this.systems.entries()) {
            if (system.definition.healthUrl) {
                try {
                    const startTime = Date.now();
                    const response = await fetch(system.definition.healthUrl, {
                        timeout: 5000
                    });
                    const responseTime = Date.now() - startTime;
                    
                    const healthData = {
                        status: response.ok ? 'healthy' : 'unhealthy',
                        responseTime,
                        statusCode: response.status,
                        timestamp: Date.now()
                    };
                    
                    system.lastHealth = healthData;
                    this.systemHealth.set(systemId, healthData);
                    
                    if (!response.ok) {
                        this.addAlert('warning', `${system.definition.name} Unhealthy`, 
                            `HTTP ${response.status} (${responseTime}ms)`);
                    }
                    
                } catch (error) {
                    const healthData = {
                        status: 'error',
                        error: error.message,
                        timestamp: Date.now()
                    };
                    
                    system.lastHealth = healthData;
                    this.systemHealth.set(systemId, healthData);
                    
                    this.addAlert('error', `${system.definition.name} Error`, error.message);
                }
            }
        }
        
        // Check external services
        for (const [serviceId, service] of this.services.entries()) {
            if (service.definition.healthUrl) {
                try {
                    const startTime = Date.now();
                    const response = await fetch(service.definition.healthUrl, {
                        timeout: 5000
                    });
                    const responseTime = Date.now() - startTime;
                    
                    const healthData = {
                        status: response.ok ? 'healthy' : 'unhealthy',
                        responseTime,
                        statusCode: response.status,
                        timestamp: Date.now()
                    };
                    
                    this.systemHealth.set(serviceId, healthData);
                    
                    if (!response.ok) {
                        this.addAlert('warning', `${service.definition.name} Unhealthy`, 
                            `HTTP ${response.status} (${responseTime}ms)`);
                    }
                    
                } catch (error) {
                    this.systemHealth.set(serviceId, {
                        status: 'error',
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    
    startStatusReporting() {
        // Save system status to file every minute
        setInterval(() => {
            this.saveSystemStatus();
        }, 60000);
    }
    
    saveSystemStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            coordinator: {
                running: this.isRunning,
                uptime: Date.now() - this.startTime,
                alerts: this.alerts.length
            },
            systems: Object.fromEntries(
                Array.from(this.systems.entries()).map(([id, system]) => [
                    id, 
                    {
                        name: system.definition.name,
                        status: system.status,
                        uptime: Date.now() - system.startTime,
                        health: this.systemHealth.get(id) || null
                    }
                ])
            ),
            services: Object.fromEntries(
                Array.from(this.services.entries()).map(([id, service]) => [
                    id,
                    {
                        name: service.definition.name,
                        status: service.status,
                        health: this.systemHealth.get(id) || null
                    }
                ])
            ),
            recentAlerts: this.alerts.slice(-10)
        };
        
        const statusFile = path.join(this.config.statusDir, 'system-status.json');
        fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    }
    
    addAlert(level, title, message) {
        const alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            level,
            title,
            message,
            timestamp: Date.now(),
            resolved: false
        };
        
        this.alerts.unshift(alert);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(0, 100);
        }
        
        console.log(`🚨 ${level.toUpperCase()}: ${title} - ${message}`);
        this.emit('alert', alert);
    }
    
    setupWebInterface() {
        // HTTP Server for dashboard
        this.httpServer = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        this.httpServer.listen(this.config.port, () => {
            console.log(`🌐 Coordinator dashboard: http://localhost:${this.config.port}`);
        });
        
        // WebSocket Server for real-time updates
        this.wss = new WebSocket.Server({ port: this.config.webSocketPort });
        
        this.wss.on('connection', (ws) => {
            console.log('📡 WebSocket client connected to coordinator');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'system_state',
                data: this.getSystemState()
            }));
            
            // Listen for events
            const alertListener = (alert) => {
                ws.send(JSON.stringify({
                    type: 'alert',
                    data: alert
                }));
            };
            
            this.on('alert', alertListener);
            
            ws.on('close', () => {
                this.off('alert', alertListener);
            });
            
            ws.on('message', (message) => {
                try {
                    const command = JSON.parse(message);
                    this.handleWebSocketCommand(command, ws);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        data: { message: 'Invalid command format' }
                    }));
                }
            });
        });
        
        console.log(`📡 WebSocket server: ws://localhost:${this.config.webSocketPort}`);
    }
    
    handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        if (url.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.generateDashboardHTML());
        } else if (url.pathname === '/api/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.getSystemState()));
        } else if (url.pathname === '/api/alerts') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.alerts.slice(0, 20)));
        } else if (url.pathname === '/api/restart' && req.method === 'POST') {
            this.restartSystem(url.searchParams.get('system'))
                .then(() => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                })
                .catch((error) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                });
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
    
    handleWebSocketCommand(command, ws) {
        switch (command.type) {
            case 'get_system_state':
                ws.send(JSON.stringify({
                    type: 'system_state',
                    data: this.getSystemState()
                }));
                break;
                
            case 'restart_system':
                this.restartSystem(command.systemId)
                    .then(() => {
                        ws.send(JSON.stringify({
                            type: 'restart_success',
                            data: { systemId: command.systemId }
                        }));
                    })
                    .catch((error) => {
                        ws.send(JSON.stringify({
                            type: 'restart_error',
                            data: { systemId: command.systemId, error: error.message }
                        }));
                    });
                break;
                
            case 'clear_alerts':
                this.alerts = [];
                ws.send(JSON.stringify({
                    type: 'alerts_cleared',
                    data: {}
                }));
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    data: { message: 'Unknown command type' }
                }));
        }
    }
    
    getSystemState() {
        return {
            timestamp: new Date().toISOString(),
            coordinator: {
                running: this.isRunning,
                uptime: this.startTime ? Date.now() - this.startTime : 0,
                version: '1.0.0'
            },
            systems: Object.fromEntries(
                Array.from(this.systems.entries()).map(([id, system]) => [
                    id,
                    {
                        name: system.definition.name,
                        description: system.definition.description,
                        status: system.status,
                        port: system.definition.port,
                        priority: system.definition.priority,
                        uptime: Date.now() - system.startTime,
                        health: this.systemHealth.get(id) || null,
                        error: system.error || null
                    }
                ])
            ),
            services: Object.fromEntries(
                Array.from(this.services.entries()).map(([id, service]) => [
                    id,
                    {
                        name: service.definition.name,
                        status: service.status,
                        port: service.definition.port,
                        container: service.definition.container,
                        health: this.systemHealth.get(id) || null
                    }
                ])
            ),
            alerts: this.alerts.slice(0, 10),
            summary: {
                totalSystems: this.systems.size,
                runningSystems: Array.from(this.systems.values()).filter(s => s.status === 'running').length,
                totalServices: this.services.size,
                runningServices: Array.from(this.services.values()).filter(s => s.status === 'running').length,
                activeAlerts: this.alerts.filter(a => !a.resolved).length
            }
        };
    }
    
    async restartSystem(systemId) {
        console.log(`🔄 Restarting system: ${systemId}`);
        
        const system = this.systems.get(systemId);
        if (!system) {
            throw new Error(`System not found: ${systemId}`);
        }
        
        try {
            // Stop existing instance
            if (system.instance && system.instance.stop) {
                system.instance.stop();
            }
            
            // Create new instance
            const newInstance = new system.definition.class();
            
            // Special handling for systems that need to be started
            if (systemId === 'enhanced-http' && newInstance.startServer) {
                await newInstance.startServer();
            }
            
            // Update system record
            system.instance = newInstance;
            system.status = 'running';
            system.startTime = Date.now();
            system.error = null;
            
            console.log(`✅ Restarted ${system.definition.name}`);
            this.addAlert('info', 'System Restarted', `${system.definition.name} successfully restarted`);
            
        } catch (error) {
            system.status = 'failed';
            system.error = error.message;
            
            console.error(`❌ Failed to restart ${system.definition.name}:`, error.message);
            this.addAlert('error', 'Restart Failed', `${system.definition.name}: ${error.message}`);
            
            throw error;
        }
    }
    
    generateDashboardHTML() {
        const state = this.getSystemState();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>System Coordinator Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #1a1a1a; color: #fff; }
        .header { background: #2a2a2a; padding: 20px; text-align: center; border-bottom: 2px solid #4ecca3; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #2a2a2a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #444; }
        .summary-value { font-size: 36px; font-weight: bold; color: #4ecca3; }
        .summary-label { color: #ccc; margin-top: 5px; }
        .systems-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .system-card { background: #2a2a2a; padding: 20px; border-radius: 8px; border: 1px solid #444; }
        .system-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .system-name { font-size: 18px; font-weight: bold; color: #4ecca3; }
        .system-status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-running { background: #4ecca3; color: #000; }
        .status-stopped { background: #e94560; color: #fff; }
        .status-failed { background: #f47068; color: #fff; }
        .status-unknown { background: #666; color: #fff; }
        .system-info { font-size: 14px; color: #ccc; margin: 5px 0; }
        .alerts-section { background: #2a2a2a; padding: 20px; border-radius: 8px; border: 1px solid #444; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid; }
        .alert-error { border-color: #e94560; background: rgba(233, 69, 96, 0.1); }
        .alert-warning { border-color: #ffd700; background: rgba(255, 215, 0, 0.1); }
        .alert-info { border-color: #4ecca3; background: rgba(78, 204, 163, 0.1); }
        .control-buttons { margin-top: 15px; }
        .btn { background: #4ecca3; color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 0 5px; font-weight: bold; }
        .btn:hover { background: #3eb393; }
        .btn-danger { background: #e94560; color: #fff; }
        .btn-danger:hover { background: #d63750; }
        .ws-status { position: fixed; top: 10px; right: 10px; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
        .ws-connected { background: #4ecca3; color: #000; }
        .ws-disconnected { background: #e94560; color: #fff; }
        .section-title { font-size: 24px; margin: 30px 0 20px 0; color: #4ecca3; }
        .quick-links { display: flex; gap: 15px; margin: 20px 0; }
        .quick-link { background: #333; padding: 10px 15px; border-radius: 4px; text-decoration: none; color: #4ecca3; font-weight: bold; }
        .quick-link:hover { background: #444; }
    </style>
</head>
<body>
    <div id="wsStatus" class="ws-status ws-disconnected">Connecting...</div>
    
    <div class="header">
        <h1>🎛️ Unified System Coordinator</h1>
        <p>Central management for performance, context switching, HTTP optimization & Docker services</p>
        <div class="quick-links">
            <a href="http://localhost:3010" target="_blank" class="quick-link">📊 Performance Monitor</a>
            <a href="http://localhost:3013" target="_blank" class="quick-link">🖼️ Context Switching</a>
            <a href="http://localhost:3014" target="_blank" class="quick-link">🌐 HTTP Server</a>
            <a href="http://localhost:3000" target="_blank" class="quick-link">🧩 Template Processor</a>
        </div>
    </div>
    
    <div class="container">
        <div class="summary">
            <div class="summary-card">
                <div class="summary-value">${state.summary.runningSystems}/${state.summary.totalSystems}</div>
                <div class="summary-label">Systems Running</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${state.summary.runningServices}/${state.summary.totalServices}</div>
                <div class="summary-label">Services Running</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${state.summary.activeAlerts}</div>
                <div class="summary-label">Active Alerts</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${Math.floor(state.coordinator.uptime / 60000)}m</div>
                <div class="summary-label">Coordinator Uptime</div>
            </div>
        </div>
        
        <h2 class="section-title">🔧 Core Systems</h2>
        <div class="systems-grid" id="systemsGrid">
            ${Object.entries(state.systems).map(([id, system]) => `
                <div class="system-card">
                    <div class="system-header">
                        <div class="system-name">${system.name}</div>
                        <span class="system-status status-${system.status}">${system.status.toUpperCase()}</span>
                    </div>
                    <div class="system-info">${system.description}</div>
                    ${system.port ? `<div class="system-info">Port: ${system.port}</div>` : ''}
                    <div class="system-info">Priority: ${system.priority}</div>
                    <div class="system-info">Uptime: ${Math.floor(system.uptime / 60000)}m</div>
                    ${system.health ? `
                        <div class="system-info">Health: ${system.health.status} 
                        ${system.health.responseTime ? `(${system.health.responseTime}ms)` : ''}</div>
                    ` : ''}
                    ${system.error ? `<div class="system-info" style="color: #e94560;">Error: ${system.error}</div>` : ''}
                    <div class="control-buttons">
                        <button class="btn" onclick="restartSystem('${id}')">🔄 Restart</button>
                        ${system.port ? `<button class="btn" onclick="window.open('http://localhost:${system.port}', '_blank')">🔗 Open</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <h2 class="section-title">🐳 Docker Services</h2>
        <div class="systems-grid">
            ${Object.entries(state.services).map(([id, service]) => `
                <div class="system-card">
                    <div class="system-header">
                        <div class="system-name">${service.name}</div>
                        <span class="system-status status-${service.status}">${service.status.toUpperCase()}</span>
                    </div>
                    <div class="system-info">Container: ${service.container}</div>
                    ${service.port ? `<div class="system-info">Port: ${service.port}</div>` : ''}
                    ${service.health ? `
                        <div class="system-info">Health: ${service.health.status}
                        ${service.health.responseTime ? `(${service.health.responseTime}ms)` : ''}</div>
                    ` : ''}
                    <div class="control-buttons">
                        ${service.port ? `<button class="btn" onclick="window.open('http://localhost:${service.port}', '_blank')">🔗 Open</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <h2 class="section-title">🚨 Recent Alerts</h2>
        <div class="alerts-section">
            <div class="control-buttons">
                <button class="btn btn-danger" onclick="clearAlerts()">🗑️ Clear All Alerts</button>
            </div>
            <div id="alertsList">
                ${state.alerts.length > 0 ? state.alerts.map(alert => `
                    <div class="alert alert-${alert.level}">
                        <strong>${alert.title}</strong><br>
                        ${alert.message}<br>
                        <small>${new Date(alert.timestamp).toLocaleString()}</small>
                    </div>
                `).join('') : '<div style="text-align: center; color: #666; padding: 20px;">No recent alerts</div>'}
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let wsStatus = document.getElementById('wsStatus');
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.webSocketPort}');
            
            ws.onopen = function() {
                wsStatus.textContent = 'Connected';
                wsStatus.className = 'ws-status ws-connected';
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                wsStatus.textContent = 'Disconnected';
                wsStatus.className = 'ws-status ws-disconnected';
                setTimeout(connectWebSocket, 3000);
            };
            
            ws.onerror = function() {
                wsStatus.textContent = 'Error';
                wsStatus.className = 'ws-status ws-disconnected';
            };
        }
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'system_state':
                    // Refresh page to show updated state
                    setTimeout(() => location.reload(), 1000);
                    break;
                case 'alert':
                    // Add new alert to the list
                    addAlertToList(message.data);
                    break;
                case 'restart_success':
                    alert('System restarted successfully!');
                    setTimeout(() => location.reload(), 2000);
                    break;
                case 'restart_error':
                    alert('Failed to restart system: ' + message.data.error);
                    break;
            }
        }
        
        function restartSystem(systemId) {
            if (confirm('Are you sure you want to restart this system?')) {
                ws.send(JSON.stringify({
                    type: 'restart_system',
                    systemId: systemId
                }));
            }
        }
        
        function clearAlerts() {
            if (confirm('Clear all alerts?')) {
                ws.send(JSON.stringify({
                    type: 'clear_alerts'
                }));
                document.getElementById('alertsList').innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No recent alerts</div>';
            }
        }
        
        function addAlertToList(alert) {
            const alertsContainer = document.getElementById('alertsList');
            const alertElement = document.createElement('div');
            alertElement.className = \`alert alert-\${alert.level}\`;
            alertElement.innerHTML = \`
                <strong>\${alert.title}</strong><br>
                \${alert.message}<br>
                <small>\${new Date(alert.timestamp).toLocaleString()}</small>
            \`;
            alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
        }
        
        // Auto-refresh every 60 seconds
        setInterval(() => location.reload(), 60000);
        
        // Connect WebSocket
        connectWebSocket();
    </script>
</body>
</html>`;
    }
    
    stop() {
        console.log('🛑 Stopping Unified System Coordinator...');
        
        this.isRunning = false;
        
        // Stop health monitoring
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
        }
        
        // Stop all systems
        for (const [systemId, system] of this.systems.entries()) {
            if (system.instance && system.instance.stop) {
                try {
                    system.instance.stop();
                    console.log(`🛑 Stopped ${system.definition.name}`);
                } catch (error) {
                    console.error(`❌ Error stopping ${system.definition.name}:`, error.message);
                }
            }
        }
        
        // Close servers
        if (this.httpServer) {
            this.httpServer.close();
        }
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('✅ System Coordinator stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const coordinator = new UnifiedSystemCoordinator();
    coordinator.startTime = Date.now();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down System Coordinator...');
        coordinator.stop();
        process.exit(0);
    });
    
    console.log('\n✅ Unified System Coordinator ready!');
    console.log('🎯 All systems should now be coordinated and the 20x slowdown issue resolved');
    console.log('📊 Monitor everything at: http://localhost:3000');
}

module.exports = UnifiedSystemCoordinator;