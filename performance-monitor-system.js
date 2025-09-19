#!/usr/bin/env node
/**
 * Performance Monitor System
 * 
 * Diagnoses the 20x slowdown issue where 2.5 minutes = 1 hour
 * Monitors all Docker services, timing intervals, memory usage, and system health
 * Provides real-time alerts and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');
const execAsync = promisify(exec);

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.monitoring = true;
        this.metricsHistory = [];
        this.alertThresholds = {
            cpuUsage: 80,
            memoryUsage: 80,
            responseTime: 5000, // 5 seconds
            timingMismatch: 5.0, // 5x slowdown threshold
            diskIO: 90
        };
        
        this.services = [
            'document-generator-postgres',
            'document-generator-redis', 
            'document-generator-minio',
            'document-generator-ollama',
            'document-generator-template-processor',
            'document-generator-ai-api',
            'document-generator-platform-hub',
            'document-generator-sovereign-agents',
            'document-generator-analytics',
            'document-generator-gif-processor'
        ];
        
        this.timingTests = [];
        this.performanceBaseline = null;
        
        console.log('🔍 Performance Monitor initialized');
        console.log('📊 Monitoring for 20x slowdown issues...');
        
        this.startMonitoring();
        this.startTimingAnalysis();
        this.setupWebInterface();
    }
    
    async startMonitoring() {
        // Monitor every 10 seconds for real-time detection
        setInterval(async () => {
            if (!this.monitoring) return;
            
            try {
                const metrics = await this.collectMetrics();
                this.analyzeMetrics(metrics);
                this.metricsHistory.push(metrics);
                
                // Keep only last 100 entries (about 16 minutes of history)
                if (this.metricsHistory.length > 100) {
                    this.metricsHistory.shift();
                }
                
                this.emit('metrics', metrics);
            } catch (error) {
                console.error('❌ Error collecting metrics:', error.message);
            }
        }, 10000);
        
        console.log('✅ Performance monitoring started (10s intervals)');
    }
    
    async collectMetrics() {
        const timestamp = Date.now();
        const metrics = {
            timestamp,
            system: await this.getSystemMetrics(),
            docker: await this.getDockerMetrics(),
            services: await this.getServiceMetrics(),
            timing: await this.runTimingTests(),
            network: await this.getNetworkMetrics(),
            disk: await this.getDiskMetrics()
        };
        
        return metrics;
    }
    
    async getSystemMetrics() {
        try {
            const loadavg = require('os').loadavg();
            const freemem = require('os').freemem();
            const totalmem = require('os').totalmem();
            const uptime = require('os').uptime();
            
            // Get CPU usage via top command
            const { stdout: topOutput } = await execAsync('top -l 1 -s 0 | grep "CPU usage"');
            const cpuMatch = topOutput.match(/(\d+\.\d+)% user.*?(\d+\.\d+)% sys/);
            const cpuUsage = cpuMatch ? parseFloat(cpuMatch[1]) + parseFloat(cpuMatch[2]) : 0;
            
            return {
                loadAverage: loadavg,
                memoryUsage: ((totalmem - freemem) / totalmem) * 100,
                freeMemory: freemem,
                totalMemory: totalmem,
                uptime,
                cpuUsage
            };
        } catch (error) {
            console.warn('⚠️ Could not get system metrics:', error.message);
            return { error: error.message };
        }
    }
    
    async getDockerMetrics() {
        try {
            const { stdout } = await execAsync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.MemPerc}}\\t{{.NetIO}}\\t{{.BlockIO}}"');
            const lines = stdout.trim().split('\n').slice(1); // Skip header
            
            const containers = lines.map(line => {
                const parts = line.split('\t');
                if (parts.length >= 6) {
                    const [name, cpu, memUsage, memPerc, netIO, blockIO] = parts;
                    return {
                        name: name.trim(),
                        cpu: parseFloat(cpu.replace('%', '')) || 0,
                        memoryUsage: memUsage.trim(),
                        memoryPercent: parseFloat(memPerc.replace('%', '')) || 0,
                        networkIO: netIO.trim(),
                        blockIO: blockIO.trim()
                    };
                }
                return null;
            }).filter(Boolean);
            
            return { containers, totalContainers: containers.length };
        } catch (error) {
            console.warn('⚠️ Could not get Docker metrics:', error.message);
            return { error: error.message, containers: [] };
        }
    }
    
    async getServiceMetrics() {
        const serviceMetrics = {};
        
        for (const service of this.services) {
            try {
                // Test HTTP response time for web services
                if (service.includes('template-processor')) {
                    serviceMetrics[service] = await this.testServiceResponse('http://localhost:3000/health');
                } else if (service.includes('ai-api')) {
                    serviceMetrics[service] = await this.testServiceResponse('http://localhost:3001/health');
                } else if (service.includes('platform-hub')) {
                    serviceMetrics[service] = await this.testServiceResponse('http://localhost:8080/health');
                } else if (service.includes('analytics')) {
                    serviceMetrics[service] = await this.testServiceResponse('http://localhost:3002/health');
                } else if (service.includes('gif-processor')) {
                    serviceMetrics[service] = await this.testServiceResponse('http://localhost:8093/health');
                } else {
                    // For database services, check if container is running
                    serviceMetrics[service] = await this.checkContainerHealth(service);
                }
            } catch (error) {
                serviceMetrics[service] = { 
                    error: error.message, 
                    responseTime: null, 
                    status: 'error' 
                };
            }
        }
        
        return serviceMetrics;
    }
    
    async testServiceResponse(url) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(url, { 
                method: 'GET',
                timeout: 10000 // 10 second timeout
            });
            
            const responseTime = Date.now() - startTime;
            
            return {
                status: response.ok ? 'healthy' : 'unhealthy',
                responseTime,
                statusCode: response.status,
                url
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'error',
                responseTime,
                error: error.message,
                url
            };
        }
    }
    
    async checkContainerHealth(containerName) {
        try {
            const { stdout } = await execAsync(`docker inspect ${containerName} --format='{{.State.Health.Status}}'`);
            const healthStatus = stdout.trim();
            
            return {
                status: healthStatus === 'healthy' ? 'healthy' : 'unhealthy',
                healthStatus,
                containerName
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                containerName
            };
        }
    }
    
    async runTimingTests() {
        const timingTests = {
            jsEventLoop: await this.testEventLoopLag(),
            fileSystem: await this.testFileSystemSpeed(),
            networkLatency: await this.testNetworkLatency(),
            dockerOverhead: await this.testDockerOverhead()
        };
        
        // Calculate timing ratios to detect 20x slowdowns
        timingTests.slowdownFactors = this.calculateSlowdownFactors(timingTests);
        
        return timingTests;
    }
    
    async testEventLoopLag() {
        const start = process.hrtime.bigint();
        await new Promise(resolve => setImmediate(resolve));
        const end = process.hrtime.bigint();
        
        const lagNs = Number(end - start);
        const lagMs = lagNs / 1000000;
        
        return {
            lagMs,
            status: lagMs > 100 ? 'warning' : 'ok'
        };
    }
    
    async testFileSystemSpeed() {
        const testFile = '/tmp/perf-test-' + Date.now();
        const testData = Buffer.alloc(1024 * 1024); // 1MB test
        
        try {
            const start = Date.now();
            fs.writeFileSync(testFile, testData);
            const readData = fs.readFileSync(testFile);
            const end = Date.now();
            
            fs.unlinkSync(testFile);
            
            const duration = end - start;
            return {
                duration,
                throughputMBps: 1 / (duration / 1000),
                status: duration > 1000 ? 'warning' : 'ok'
            };
        } catch (error) {
            return {
                error: error.message,
                status: 'error'
            };
        }
    }
    
    async testNetworkLatency() {
        try {
            // Test localhost latency (should be near-zero)
            const start = Date.now();
            await execAsync('ping -c 1 127.0.0.1');
            const end = Date.now();
            
            const latency = end - start;
            return {
                latency,
                status: latency > 50 ? 'warning' : 'ok'
            };
        } catch (error) {
            return {
                error: error.message,
                status: 'error'
            };
        }
    }
    
    async testDockerOverhead() {
        try {
            // Compare direct Redis vs Docker Redis response time
            const directStart = Date.now();
            await execAsync('echo "PING" | nc localhost 6379');
            const directEnd = Date.now();
            
            const dockerStart = Date.now();
            await execAsync('docker exec document-generator-redis redis-cli ping');
            const dockerEnd = Date.now();
            
            const directTime = directEnd - directStart;
            const dockerTime = dockerEnd - dockerStart;
            const overhead = dockerTime - directTime;
            const overheadRatio = dockerTime / directTime;
            
            return {
                directTime,
                dockerTime,
                overhead,
                overheadRatio,
                status: overheadRatio > 5 ? 'warning' : 'ok'
            };
        } catch (error) {
            return {
                error: error.message,
                status: 'error'
            };
        }
    }
    
    calculateSlowdownFactors(timingTests) {
        const expected = {
            eventLoopLag: 1, // Expected ~1ms
            fileSystemSpeed: 100, // Expected ~100ms for 1MB
            networkLatency: 1, // Expected ~1ms for localhost
            dockerOverhead: 10 // Expected ~10ms overhead
        };
        
        const factors = {};
        
        if (timingTests.jsEventLoop && !timingTests.jsEventLoop.error) {
            factors.eventLoop = timingTests.jsEventLoop.lagMs / expected.eventLoopLag;
        }
        
        if (timingTests.fileSystem && !timingTests.fileSystem.error) {
            factors.fileSystem = timingTests.fileSystem.duration / expected.fileSystemSpeed;
        }
        
        if (timingTests.networkLatency && !timingTests.networkLatency.error) {
            factors.network = timingTests.networkLatency.latency / expected.networkLatency;
        }
        
        if (timingTests.dockerOverhead && !timingTests.dockerOverhead.error) {
            factors.docker = timingTests.dockerOverhead.dockerTime / expected.dockerOverhead;
        }
        
        // Find maximum slowdown factor
        const maxSlowdown = Math.max(...Object.values(factors).filter(f => !isNaN(f)));
        factors.maximum = maxSlowdown;
        factors.is20xSlowdown = maxSlowdown > 15; // Flag if >15x (close to 20x)
        
        return factors;
    }
    
    async getNetworkMetrics() {
        try {
            const { stdout } = await execAsync('netstat -i | grep -E "(en0|eth0|lo0)"');
            const lines = stdout.trim().split('\n');
            
            const interfaces = lines.map(line => {
                const parts = line.split(/\s+/);
                if (parts.length >= 7) {
                    return {
                        interface: parts[0],
                        packetsIn: parseInt(parts[4]) || 0,
                        packetsOut: parseInt(parts[6]) || 0
                    };
                }
                return null;
            }).filter(Boolean);
            
            return { interfaces };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getDiskMetrics() {
        try {
            const { stdout } = await execAsync('df -h /');
            const lines = stdout.trim().split('\n');
            const diskInfo = lines[1].split(/\s+/);
            
            return {
                filesystem: diskInfo[0],
                size: diskInfo[1],
                used: diskInfo[2],
                available: diskInfo[3],
                usePercent: parseInt(diskInfo[4]) || 0
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    analyzeMetrics(metrics) {
        const alerts = [];
        const timestamp = new Date(metrics.timestamp).toISOString();
        
        // Check for 20x slowdown in timing tests
        if (metrics.timing.slowdownFactors.is20xSlowdown) {
            alerts.push({
                level: 'CRITICAL',
                message: `🚨 20x SLOWDOWN DETECTED! Maximum factor: ${metrics.timing.slowdownFactors.maximum.toFixed(2)}x`,
                component: 'timing',
                factor: metrics.timing.slowdownFactors.maximum
            });
        }
        
        // Check system CPU usage
        if (metrics.system.cpuUsage > this.alertThresholds.cpuUsage) {
            alerts.push({
                level: 'WARNING',
                message: `High CPU usage: ${metrics.system.cpuUsage.toFixed(1)}%`,
                component: 'system'
            });
        }
        
        // Check system memory usage
        if (metrics.system.memoryUsage > this.alertThresholds.memoryUsage) {
            alerts.push({
                level: 'WARNING', 
                message: `High memory usage: ${metrics.system.memoryUsage.toFixed(1)}%`,
                component: 'system'
            });
        }
        
        // Check Docker container health
        if (metrics.docker.containers) {
            metrics.docker.containers.forEach(container => {
                if (container.cpu > this.alertThresholds.cpuUsage) {
                    alerts.push({
                        level: 'WARNING',
                        message: `Container ${container.name} high CPU: ${container.cpu}%`,
                        component: 'docker'
                    });
                }
                
                if (container.memoryPercent > this.alertThresholds.memoryUsage) {
                    alerts.push({
                        level: 'WARNING',
                        message: `Container ${container.name} high memory: ${container.memoryPercent}%`,
                        component: 'docker'
                    });
                }
            });
        }
        
        // Check service response times
        Object.entries(metrics.services).forEach(([service, serviceMetrics]) => {
            if (serviceMetrics.responseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    level: 'WARNING',
                    message: `Service ${service} slow response: ${serviceMetrics.responseTime}ms`,
                    component: 'services'
                });
            }
            
            if (serviceMetrics.status === 'error' || serviceMetrics.status === 'unhealthy') {
                alerts.push({
                    level: 'ERROR',
                    message: `Service ${service} is ${serviceMetrics.status}`,
                    component: 'services'
                });
            }
        });
        
        // Log alerts
        if (alerts.length > 0) {
            console.log(`\n⚠️  ${timestamp} - ${alerts.length} alerts:`);
            alerts.forEach(alert => {
                const icon = alert.level === 'CRITICAL' ? '🚨' : alert.level === 'ERROR' ? '❌' : '⚠️';
                console.log(`${icon} ${alert.level}: ${alert.message}`);
            });
            console.log('');
        }
        
        // Store alerts for web interface
        metrics.alerts = alerts;
        
        // Emit alerts for real-time notifications
        if (alerts.length > 0) {
            this.emit('alerts', alerts);
        }
    }
    
    setupWebInterface() {
        // Create simple HTTP server for real-time monitoring
        const http = require('http');
        
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateDashboardHTML());
            } else if (req.url === '/api/metrics') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    current: this.metricsHistory[this.metricsHistory.length - 1],
                    history: this.metricsHistory.slice(-20), // Last 20 entries
                    alerts: this.getRecentAlerts()
                }));
            } else if (req.url === '/api/stream') {
                // Server-sent events for real-time updates
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                
                const listener = (metrics) => {
                    res.write(`data: ${JSON.stringify(metrics)}\n\n`);
                };
                
                this.on('metrics', listener);
                
                req.on('close', () => {
                    this.off('metrics', listener);
                });
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(3010, () => {
            console.log('📊 Performance Dashboard available at http://localhost:3010');
        });
    }
    
    generateDashboardHTML() {
        const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
        const alerts = this.getRecentAlerts();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Monitor - 20x Slowdown Detection</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: #2a2a2a; padding: 20px; border-radius: 8px; border: 1px solid #444; }
        .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #4ecca3; }
        .metric-value { font-size: 24px; margin: 10px 0; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert-critical { background: #e94560; color: white; }
        .alert-error { background: #f47068; color: white; }
        .alert-warning { background: #ffd700; color: black; }
        .status-good { color: #4ecca3; }
        .status-warning { color: #ffd700; }
        .status-error { color: #e94560; }
        .timing-factor { font-size: 20px; font-weight: bold; }
        .timing-factor.critical { color: #e94560; animation: blink 1s infinite; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.5; } }
        .refresh-note { text-align: center; margin-top: 20px; color: #888; }
    </style>
    <meta http-equiv="refresh" content="10">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Performance Monitor</h1>
            <h2>20x Slowdown Detection System</h2>
            <p>Real-time monitoring for timing issues where 2.5 minutes = 1 hour</p>
        </div>
        
        ${alerts.length > 0 ? `
        <div class="metric-card">
            <div class="metric-title">🚨 Active Alerts (${alerts.length})</div>
            ${alerts.map(alert => `
                <div class="alert alert-${alert.level.toLowerCase()}">
                    ${alert.message}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">⏱️ Timing Analysis</div>
                ${currentMetrics ? `
                    <div class="metric-value timing-factor ${currentMetrics.timing.slowdownFactors.is20xSlowdown ? 'critical' : ''}">
                        Max Slowdown: ${currentMetrics.timing.slowdownFactors.maximum ? currentMetrics.timing.slowdownFactors.maximum.toFixed(2) : 'N/A'}x
                    </div>
                    <div>Event Loop: ${currentMetrics.timing.slowdownFactors.eventLoop ? currentMetrics.timing.slowdownFactors.eventLoop.toFixed(2) : 'N/A'}x</div>
                    <div>File System: ${currentMetrics.timing.slowdownFactors.fileSystem ? currentMetrics.timing.slowdownFactors.fileSystem.toFixed(2) : 'N/A'}x</div>
                    <div>Network: ${currentMetrics.timing.slowdownFactors.network ? currentMetrics.timing.slowdownFactors.network.toFixed(2) : 'N/A'}x</div>
                    <div>Docker: ${currentMetrics.timing.slowdownFactors.docker ? currentMetrics.timing.slowdownFactors.docker.toFixed(2) : 'N/A'}x</div>
                ` : '<div>Loading...</div>'}
            </div>
            
            <div class="metric-card">
                <div class="metric-title">💻 System Health</div>
                ${currentMetrics ? `
                    <div class="metric-value ${currentMetrics.system.cpuUsage > 80 ? 'status-error' : currentMetrics.system.cpuUsage > 60 ? 'status-warning' : 'status-good'}">
                        CPU: ${currentMetrics.system.cpuUsage ? currentMetrics.system.cpuUsage.toFixed(1) : 'N/A'}%
                    </div>
                    <div class="metric-value ${currentMetrics.system.memoryUsage > 80 ? 'status-error' : currentMetrics.system.memoryUsage > 60 ? 'status-warning' : 'status-good'}">
                        Memory: ${currentMetrics.system.memoryUsage ? currentMetrics.system.memoryUsage.toFixed(1) : 'N/A'}%
                    </div>
                    <div>Load Avg: ${currentMetrics.system.loadAverage ? currentMetrics.system.loadAverage[0].toFixed(2) : 'N/A'}</div>
                    <div>Uptime: ${currentMetrics.system.uptime ? Math.floor(currentMetrics.system.uptime / 3600) : 'N/A'}h</div>
                ` : '<div>Loading...</div>'}
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🐳 Docker Services</div>
                ${currentMetrics && currentMetrics.docker.containers ? `
                    <div class="metric-value">Active: ${currentMetrics.docker.totalContainers}</div>
                    ${currentMetrics.docker.containers.slice(0, 5).map(container => `
                        <div class="${container.cpu > 80 ? 'status-error' : container.cpu > 60 ? 'status-warning' : 'status-good'}">
                            ${container.name.replace('document-generator-', '')}: ${container.cpu}% CPU, ${container.memoryPercent}% RAM
                        </div>
                    `).join('')}
                ` : '<div>Loading...</div>'}
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🌐 Service Status</div>
                ${currentMetrics && currentMetrics.services ? Object.entries(currentMetrics.services).slice(0, 6).map(([service, metrics]) => `
                    <div class="${metrics.status === 'healthy' ? 'status-good' : metrics.status === 'error' ? 'status-error' : 'status-warning'}">
                        ${service.replace('document-generator-', '')}: ${metrics.status}
                        ${metrics.responseTime ? ` (${metrics.responseTime}ms)` : ''}
                    </div>
                `).join('') : '<div>Loading...</div>'}
            </div>
        </div>
        
        <div class="refresh-note">
            Page auto-refreshes every 10 seconds | Last update: ${new Date().toLocaleTimeString()}
        </div>
    </div>
</body>
</html>`;
    }
    
    getRecentAlerts() {
        const recentMetrics = this.metricsHistory.slice(-10);
        const allAlerts = recentMetrics.flatMap(m => m.alerts || []);
        
        // Group similar alerts and keep only the most recent
        const uniqueAlerts = [];
        const seen = new Set();
        
        for (const alert of allAlerts.reverse()) {
            const key = `${alert.level}-${alert.component}-${alert.message.split(':')[0]}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueAlerts.push(alert);
            }
        }
        
        return uniqueAlerts.slice(0, 10); // Max 10 alerts
    }
    
    async generateReport() {
        const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
        const alerts = this.getRecentAlerts();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                monitoring: this.monitoring,
                totalMetrics: this.metricsHistory.length,
                activeAlerts: alerts.filter(a => a.level === 'CRITICAL' || a.level === 'ERROR').length,
                maxSlowdownFactor: latestMetrics?.timing?.slowdownFactors?.maximum || 0,
                is20xSlowdown: latestMetrics?.timing?.slowdownFactors?.is20xSlowdown || false
            },
            currentMetrics: latestMetrics,
            recentAlerts: alerts,
            recommendations: this.generateRecommendations(latestMetrics, alerts)
        };
        
        return report;
    }
    
    generateRecommendations(metrics, alerts) {
        const recommendations = [];
        
        if (metrics?.timing?.slowdownFactors?.is20xSlowdown) {
            recommendations.push({
                priority: 'CRITICAL',
                issue: '20x Slowdown Detected',
                action: 'Immediate investigation required. Check Docker resource limits, memory leaks, and polling intervals.',
                details: `Maximum slowdown factor: ${metrics.timing.slowdownFactors.maximum.toFixed(2)}x`
            });
        }
        
        if (metrics?.system?.cpuUsage > 80) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'High CPU Usage',
                action: 'Investigate CPU-intensive processes. Consider scaling or optimization.',
                details: `Current usage: ${metrics.system.cpuUsage.toFixed(1)}%`
            });
        }
        
        if (metrics?.system?.memoryUsage > 80) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'High Memory Usage',
                action: 'Check for memory leaks. Consider increasing available memory.',
                details: `Current usage: ${metrics.system.memoryUsage.toFixed(1)}%`
            });
        }
        
        const unhealthyServices = alerts.filter(a => a.component === 'services' && a.level === 'ERROR');
        if (unhealthyServices.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'Unhealthy Services',
                action: 'Restart failed services and check logs for errors.',
                details: `Affected services: ${unhealthyServices.length}`
            });
        }
        
        return recommendations;
    }
    
    stop() {
        this.monitoring = false;
        console.log('🛑 Performance monitoring stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping performance monitor...');
        monitor.stop();
        process.exit(0);
    });
    
    // Generate report every 5 minutes
    setInterval(async () => {
        try {
            const report = await monitor.generateReport();
            const reportFile = path.join(__dirname, 'logs', `performance-report-${Date.now()}.json`);
            
            // Ensure logs directory exists
            const logsDir = path.dirname(reportFile);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            console.log(`📄 Performance report saved: ${reportFile}`);
        } catch (error) {
            console.error('❌ Error generating report:', error.message);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

module.exports = PerformanceMonitor;