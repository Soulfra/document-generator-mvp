#!/usr/bin/env node

/**
 * ❤️📊 DEATHTODATA HEALTH MONITOR
 * 
 * Real-time health monitoring for all deathtodata components
 * Provides status dashboard and alert system
 * Integrates with existing service discovery infrastructure
 */

const EventEmitter = require('events');
const http = require('http');
const fs = require('fs').promises;

class DeathtodataHealthMonitor extends EventEmitter {
    constructor() {
        super();
        
        console.log('❤️📊 DEATHTODATA HEALTH MONITOR');
        console.log('===============================');
        console.log('Monitoring all deathtodata components...');
        console.log('');
        
        // Services to monitor
        this.services = {
            'search-engine': {
                name: 'Search Engine',
                url: 'http://localhost:3456',
                port: 3456,
                script: 'deathtodata-search-boss-connector.js',
                critical: true,
                expectedEndpoints: ['/health', '/api/status', '/api/raids']
            },
            'bpm-system': {
                name: 'BPM Risk/Reward System', 
                url: 'http://localhost:7777',
                port: 7777,
                script: 'deathtodata-bpm-risk-reward.js',
                critical: true,
                expectedEndpoints: ['/health', '/api/bpm', '/api/risk']
            },
            'character-forums': {
                name: 'Character Forums',
                url: 'http://localhost:5001',
                port: 5001,
                script: 'deathtodata-character-forums.js',
                critical: false,
                expectedEndpoints: ['/health', '/forums', '/api/posts']
            },
            'npc-layer': {
                name: 'NPC Gaming Layer',
                url: 'http://localhost:8889',
                port: 8889,
                script: 'npc-gaming-layer.js',
                critical: false,
                expectedEndpoints: ['/health', '/api/agents', '/api/actions']
            },
            'service-registry': {
                name: 'Service Registry',
                url: 'http://localhost:9996',
                port: 9996,
                script: 'deathtodata-service-registry.js',
                critical: true,
                expectedEndpoints: ['/health', '/api/services', '/api/report']
            }
        };
        
        // Health status tracking
        this.healthStatus = new Map();
        this.alertHistory = [];
        this.monitoringActive = false;
        
        // Configuration
        this.config = {
            checkInterval: 15000,     // 15 seconds
            timeout: 5000,           // 5 second timeout
            maxRetries: 3,           // 3 retries before marking unhealthy
            alertCooldown: 60000,    // 1 minute between alerts for same service
            dashboardPort: 9995      // Health dashboard port (avoiding Docker conflicts)
        };
        
        // Statistics
        this.stats = {
            totalChecks: 0,
            healthyChecks: 0,
            unhealthyChecks: 0,
            startTime: Date.now()
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Health Monitor...\n');
        
        try {
            // Initialize health status for all services
            this.initializeHealthStatus();
            
            // Start monitoring
            this.startMonitoring();
            
            // Start dashboard server
            await this.startDashboard();
            
            console.log('✅ Health Monitor initialized!');
            console.log(`📊 Monitoring ${Object.keys(this.services).length} services`);
            console.log(`⏰ Check interval: ${this.config.checkInterval / 1000}s`);
            console.log(`🌐 Dashboard: http://localhost:${this.config.dashboardPort}\n`);
            
            this.emit('monitor:ready');
            
        } catch (error) {
            console.error('❌ Health Monitor initialization failed:', error);
            throw error;
        }
    }
    
    initializeHealthStatus() {
        for (const [serviceId, config] of Object.entries(this.services)) {
            this.healthStatus.set(serviceId, {
                name: config.name,
                healthy: false,
                lastCheck: null,
                lastHealthy: null,
                consecutiveFailures: 0,
                totalChecks: 0,
                uptime: 0,
                responseTime: null,
                error: null,
                endpoints: new Map()
            });
        }
        
        console.log(`📋 Initialized health tracking for ${this.services.length} services`);
    }
    
    startMonitoring() {
        console.log('❤️ Starting health monitoring...');
        
        this.monitoringActive = true;
        
        // Initial check after 3 seconds
        setTimeout(() => {
            this.performHealthChecks();
        }, 3000);
        
        // Continuous monitoring
        this.monitoringInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.config.checkInterval);
        
        console.log('  ✅ Monitoring started');
    }
    
    async performHealthChecks() {
        if (!this.monitoringActive) return;
        
        console.log(`🔍 Performing health checks... (${new Date().toLocaleTimeString()})`);
        
        const checks = Object.keys(this.services).map(serviceId => 
            this.checkServiceHealth(serviceId)
        );
        
        try {
            await Promise.allSettled(checks);
            this.updateStatistics();
            this.emit('health:update', this.getHealthSummary());
        } catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }
    
    async checkServiceHealth(serviceId) {
        const service = this.services[serviceId];
        const status = this.healthStatus.get(serviceId);
        
        const startTime = Date.now();
        let healthy = false;
        let error = null;
        let responseTime = null;
        
        try {
            // Check main service health
            const response = await this.httpRequest(`${service.url}/health`);
            responseTime = Date.now() - startTime;
            healthy = response.statusCode >= 200 && response.statusCode < 300;
            
            // Check additional endpoints
            for (const endpoint of service.expectedEndpoints) {
                try {
                    const epResponse = await this.httpRequest(`${service.url}${endpoint}`);
                    status.endpoints.set(endpoint, {
                        healthy: epResponse.statusCode >= 200 && epResponse.statusCode < 300,
                        statusCode: epResponse.statusCode,
                        responseTime: Date.now() - startTime
                    });
                } catch (epError) {
                    status.endpoints.set(endpoint, {
                        healthy: false,
                        error: epError.message,
                        responseTime: null
                    });
                }
            }
            
        } catch (err) {
            healthy = false;
            error = err.message;
            responseTime = Date.now() - startTime;
        }
        
        // Update status
        this.updateServiceStatus(serviceId, healthy, error, responseTime);
        
        // Handle alerts
        if (!healthy && service.critical) {
            await this.handleUnhealthyService(serviceId, error);
        }
        
        const icon = healthy ? '✅' : '❌';
        const time = responseTime ? `${responseTime}ms` : 'timeout';
        console.log(`  ${icon} ${service.name}: ${healthy ? 'healthy' : 'unhealthy'} (${time})`);
    }
    
    updateServiceStatus(serviceId, healthy, error, responseTime) {
        const status = this.healthStatus.get(serviceId);
        const now = Date.now();
        
        status.lastCheck = now;
        status.totalChecks++;
        status.responseTime = responseTime;
        status.error = error;
        
        if (healthy) {
            status.healthy = true;
            status.lastHealthy = now;
            status.consecutiveFailures = 0;
            
            // Update uptime
            if (status.lastHealthy) {
                const uptimeMs = now - status.lastHealthy;
                status.uptime = uptimeMs;
            }
        } else {
            status.healthy = false;
            status.consecutiveFailures++;
        }
    }
    
    async handleUnhealthyService(serviceId, error) {
        const service = this.services[serviceId];
        const status = this.healthStatus.get(serviceId);
        
        // Check cooldown
        const lastAlert = this.alertHistory.find(alert => 
            alert.serviceId === serviceId && 
            Date.now() - alert.timestamp < this.config.alertCooldown
        );
        
        if (!lastAlert && status.consecutiveFailures >= this.config.maxRetries) {
            const alert = {
                serviceId,
                serviceName: service.name,
                error,
                timestamp: Date.now(),
                consecutiveFailures: status.consecutiveFailures,
                critical: service.critical
            };
            
            this.alertHistory.push(alert);
            this.emit('service:unhealthy', alert);
            
            console.log(`🚨 ALERT: ${service.name} unhealthy (${status.consecutiveFailures} failures)`);
            console.log(`   Error: ${error}`);
            
            // Attempt service restart for critical services
            if (service.critical && status.consecutiveFailures >= 5) {
                await this.attemptServiceRestart(serviceId);
            }
        }
    }
    
    async attemptServiceRestart(serviceId) {
        const service = this.services[serviceId];
        console.log(`🔄 Attempting to restart ${service.name}...`);
        
        try {
            const { spawn } = require('child_process');
            
            // Kill existing process
            const { exec } = require('child_process');
            exec(`pkill -f "${service.script}"`, (error) => {
                if (error) console.log(`  ⚠️ Could not kill existing process: ${error.message}`);
            });
            
            // Wait 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start new process
            const process = spawn('node', [service.script], {
                detached: true,
                stdio: 'ignore'
            });
            
            process.unref();
            
            console.log(`  🚀 Restart attempted for ${service.name} (PID: ${process.pid})`);
            
            // Wait 5 seconds then check health
            setTimeout(async () => {
                await this.checkServiceHealth(serviceId);
                const status = this.healthStatus.get(serviceId);
                if (status.healthy) {
                    console.log(`  ✅ ${service.name} successfully restarted`);
                } else {
                    console.log(`  ❌ ${service.name} restart failed`);
                }
            }, 5000);
            
        } catch (error) {
            console.log(`  ❌ Restart failed: ${error.message}`);
        }
    }
    
    httpRequest(url) {
        return new Promise((resolve, reject) => {
            const request = http.get(url, {
                timeout: this.config.timeout
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body
                    });
                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
    
    updateStatistics() {
        this.stats.totalChecks++;
        
        let healthy = 0;
        for (const status of this.healthStatus.values()) {
            if (status.healthy) healthy++;
        }
        
        if (healthy === this.healthStatus.size) {
            this.stats.healthyChecks++;
        } else {
            this.stats.unhealthyChecks++;
        }
    }
    
    getHealthSummary() {
        const summary = {
            timestamp: Date.now(),
            monitoring: this.monitoringActive,
            uptime: Date.now() - this.stats.startTime,
            totalServices: Object.keys(this.services).length,
            healthyServices: 0,
            unhealthyServices: 0,
            criticalUnhealthy: 0,
            services: {},
            statistics: this.stats,
            alerts: this.alertHistory.slice(-10) // Last 10 alerts
        };
        
        for (const [serviceId, status] of this.healthStatus) {
            if (status.healthy) {
                summary.healthyServices++;
            } else {
                summary.unhealthyServices++;
                if (this.services[serviceId].critical) {
                    summary.criticalUnhealthy++;
                }
            }
            
            summary.services[serviceId] = {
                name: status.name,
                healthy: status.healthy,
                lastCheck: status.lastCheck,
                lastHealthy: status.lastHealthy,
                consecutiveFailures: status.consecutiveFailures,
                responseTime: status.responseTime,
                uptime: status.uptime,
                error: status.error,
                endpoints: Object.fromEntries(status.endpoints)
            };
        }
        
        return summary;
    }
    
    async startDashboard() {
        console.log('🌐 Starting health dashboard...');
        
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        
        // Health endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'deathtodata-health-monitor',
                monitoring: this.monitoringActive
            });
        });
        
        // Main dashboard
        app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // API endpoints
        app.get('/api/health', (req, res) => {
            res.json(this.getHealthSummary());
        });
        
        app.get('/api/services/:serviceId', (req, res) => {
            const status = this.healthStatus.get(req.params.serviceId);
            if (status) {
                res.json({
                    serviceId: req.params.serviceId,
                    service: this.services[req.params.serviceId],
                    status
                });
            } else {
                res.status(404).json({ error: 'Service not found' });
            }
        });
        
        // Control endpoints
        app.post('/api/check/:serviceId', async (req, res) => {
            const serviceId = req.params.serviceId;
            if (this.services[serviceId]) {
                await this.checkServiceHealth(serviceId);
                res.json({ message: `Health check triggered for ${serviceId}` });
            } else {
                res.status(404).json({ error: 'Service not found' });
            }
        });
        
        app.post('/api/restart/:serviceId', async (req, res) => {
            const serviceId = req.params.serviceId;
            if (this.services[serviceId]) {
                await this.attemptServiceRestart(serviceId);
                res.json({ message: `Restart attempted for ${serviceId}` });
            } else {
                res.status(404).json({ error: 'Service not found' });
            }
        });
        
        app.listen(this.config.dashboardPort, () => {
            console.log(`  ✅ Dashboard running on http://localhost:${this.config.dashboardPort}`);
        });
    }
    
    generateDashboardHTML() {
        const health = this.getHealthSummary();
        const healthPercentage = health.totalServices > 0 ? 
            Math.round((health.healthyServices / health.totalServices) * 100) : 0;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>❤️ Deathtodata Health Monitor</title>
    <style>
        body {
            margin: 0;
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff41;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            padding: 30px 20px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 2px solid #00ff41;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .stat-card {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #00ff41;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .service-card {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 20px;
        }
        
        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .status-healthy { color: #00ff41; }
        .status-unhealthy { color: #ff4444; }
        .status-critical { color: #ff0000; font-weight: bold; }
        
        .service-details {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .action-buttons {
            margin-top: 15px;
        }
        
        .action-button {
            background: #00ff41;
            color: #000;
            border: none;
            padding: 8px 16px;
            margin-right: 10px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
        }
        
        .action-button:hover {
            background: #00cc33;
        }
        
        .alerts {
            background: rgba(255, 68, 68, 0.1);
            border: 2px solid #ff4444;
            border-radius: 15px;
            padding: 20px;
            margin: 20px;
        }
    </style>
    <script>
        function checkService(serviceId) {
            fetch(\`/api/check/\${serviceId}\`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    setTimeout(() => location.reload(), 2000);
                });
        }
        
        function restartService(serviceId) {
            if (confirm(\`Are you sure you want to restart \${serviceId}?\`)) {
                fetch(\`/api/restart/\${serviceId}\`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        setTimeout(() => location.reload(), 5000);
                    });
            }
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</head>
<body>
    <div class="header">
        <h1>❤️ Deathtodata Health Monitor</h1>
        <p>Real-time monitoring for search engine components</p>
        <p>Last Updated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${health.totalServices}</div>
            <div>Total Services</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${health.healthyServices}</div>
            <div>Healthy Services</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${healthPercentage}%</div>
            <div>System Health</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${health.criticalUnhealthy}</div>
            <div>Critical Issues</div>
        </div>
    </div>
    
    <div class="services-grid">
        ${Object.entries(health.services).map(([serviceId, status]) => {
            const service = this.services[serviceId];
            const statusClass = status.healthy ? 'status-healthy' : 
                (service?.critical ? 'status-critical' : 'status-unhealthy');
            const statusIcon = status.healthy ? '✅' : '❌';
            const lastCheck = status.lastCheck ? 
                new Date(status.lastCheck).toLocaleTimeString() : 'Never';
            const responseTime = status.responseTime ? `${status.responseTime}ms` : 'N/A';
            
            return `
            <div class="service-card">
                <div class="service-header">
                    <h3>${status.name}</h3>
                    <span class="${statusClass}">${statusIcon} ${status.healthy ? 'Healthy' : 'Unhealthy'}</span>
                </div>
                <div class="service-details">
                    <p><strong>Port:</strong> ${service?.port || 'N/A'}</p>
                    <p><strong>Last Check:</strong> ${lastCheck}</p>
                    <p><strong>Response Time:</strong> ${responseTime}</p>
                    <p><strong>Failures:</strong> ${status.consecutiveFailures}</p>
                    ${status.error ? `<p><strong>Error:</strong> ${status.error}</p>` : ''}
                </div>
                <div class="action-buttons">
                    <button class="action-button" onclick="checkService('${serviceId}')">Check Now</button>
                    <button class="action-button" onclick="restartService('${serviceId}')">Restart</button>
                </div>
            </div>
            `;
        }).join('')}
    </div>
    
    ${health.alerts.length > 0 ? `
    <div class="alerts">
        <h3>🚨 Recent Alerts</h3>
        ${health.alerts.map(alert => `
            <p><strong>${alert.serviceName}:</strong> ${alert.error} (${new Date(alert.timestamp).toLocaleTimeString()})</p>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;
    }
    
    stop() {
        console.log('🛑 Stopping health monitor...');
        
        this.monitoringActive = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        console.log('✅ Health monitor stopped');
    }
}

// Export for use
module.exports = DeathtodataHealthMonitor;

// Run if called directly
if (require.main === module) {
    const monitor = new DeathtodataHealthMonitor();
    
    monitor.initialize()
        .then(() => {
            console.log('\n❤️ DEATHTODATA HEALTH MONITOR ACTIVE');
            console.log('===================================');
            console.log('📊 All services monitored');
            console.log('🚨 Alerts enabled for critical services');
            console.log('🔄 Auto-restart for failed critical services');
            console.log(`🌐 Dashboard: http://localhost:${monitor.config.dashboardPort}`);
        })
        .catch(error => {
            console.error('Failed to start health monitor:', error);
            process.exit(1);
        });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
    });
}