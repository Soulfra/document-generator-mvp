#!/usr/bin/env node

/**
 * 🛡️ PROACTIVE ERROR PREVENTION SYSTEM
 * 
 * Like a Linux startup sequence that actually verifies services work,
 * this system prevents errors BEFORE they happen by:
 * - Monitoring system health indicators
 * - Detecting pre-error conditions
 * - Taking preventive actions automatically
 * - Learning from past failures to predict future ones
 * 
 * "An ounce of prevention is worth a pound of cure."
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');
const http = require('http');
const MetaLearningErrorSystem = require('./meta-learning-error-system');

class ProactiveErrorPrevention extends EventEmitter {
    constructor() {
        super();
        
        // Initialize meta-learning system
        this.metaLearning = new MetaLearningErrorSystem();
        
        // Service health tracking
        this.services = new Map();
        this.healthChecks = new Map();
        this.startupSequence = [];
        
        // Prevention strategies
        this.preventionStrategies = new Map();
        this.activePreventions = new Map();
        
        // System metrics
        this.metrics = {
            memory: [],
            cpu: [],
            diskSpace: [],
            networkLatency: [],
            openConnections: []
        };
        
        // Thresholds for intervention
        this.thresholds = {
            memoryWarning: 0.75,      // 75% memory usage
            memoryCritical: 0.85,     // 85% memory usage
            cpuWarning: 0.80,         // 80% CPU usage
            cpuCritical: 0.90,        // 90% CPU usage
            diskWarning: 0.85,        // 85% disk usage
            diskCritical: 0.95,       // 95% disk usage
            responseTime: 5000,       // 5 second response time
            connectionLimit: 1000     // Max connections
        };
        
        // Linux-style service verification
        this.verificationLevels = {
            basic: ['process_exists'],
            standard: ['process_exists', 'port_listening', 'responds_to_ping'],
            deep: ['process_exists', 'port_listening', 'responds_to_ping', 
                   'api_health_check', 'data_flow_check', 'dependency_check'],
            paranoid: ['process_exists', 'port_listening', 'responds_to_ping',
                      'api_health_check', 'data_flow_check', 'dependency_check',
                      'performance_baseline', 'error_rate_check', 'memory_leak_check']
        };
        
        console.log('🛡️ Proactive Error Prevention System initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Load service configurations
            await this.loadServiceConfigurations();
            
            // Initialize prevention strategies
            this.initializePreventionStrategies();
            
            // Start monitoring
            this.startSystemMonitoring();
            
            // Set up meta-learning integration
            await this.integrateMetaLearning();
            
            // Create startup verification sequence
            await this.createStartupSequence();
            
            console.log('✅ Proactive Error Prevention ready!');
            console.log(`   📋 Monitoring ${this.services.size} services`);
            console.log(`   🛡️ ${this.preventionStrategies.size} prevention strategies loaded`);
            console.log(`   🔍 Verification levels: basic, standard, deep, paranoid`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Prevention system initialization failed:', error);
            throw error;
        }
    }
    
    async loadServiceConfigurations() {
        // Define critical services to monitor
        const services = [
            {
                name: 'unified-substrate-query',
                port: 4000,
                critical: true,
                dependencies: ['postgres', 'redis'],
                healthEndpoint: '/health',
                startCommand: 'node unified-substrate-query-engine.js',
                verificationLevel: 'deep'
            },
            {
                name: 'verification-bus',
                port: 9876,
                critical: true,
                dependencies: [],
                healthEndpoint: '/verify',
                startCommand: 'node verification-bus.js',
                verificationLevel: 'standard'
            },
            {
                name: 'postgres',
                port: 5432,
                critical: true,
                dependencies: [],
                healthCheck: async () => {
                    // Custom health check for PostgreSQL
                    try {
                        execSync('pg_isready -h localhost -p 5432', { timeout: 5000 });
                        return true;
                    } catch {
                        return false;
                    }
                },
                startCommand: 'docker-compose up -d postgres',
                verificationLevel: 'standard'
            },
            {
                name: 'redis',
                port: 6379,
                critical: true,
                dependencies: [],
                healthCheck: async () => {
                    // Custom health check for Redis
                    return new Promise((resolve) => {
                        const client = net.createConnection(6379, 'localhost');
                        client.on('connect', () => {
                            client.end();
                            resolve(true);
                        });
                        client.on('error', () => resolve(false));
                        setTimeout(() => {
                            client.destroy();
                            resolve(false);
                        }, 1000);
                    });
                },
                startCommand: 'docker-compose up -d redis',
                verificationLevel: 'standard'
            },
            {
                name: 'ipfs',
                port: 5001,
                critical: false,
                dependencies: [],
                healthEndpoint: '/api/v0/version',
                startCommand: 'ipfs daemon',
                verificationLevel: 'basic'
            }
        ];
        
        for (const service of services) {
            this.services.set(service.name, service);
            this.healthChecks.set(service.name, {
                lastCheck: null,
                status: 'unknown',
                history: [],
                failures: 0
            });
        }
    }
    
    initializePreventionStrategies() {
        // Memory pressure prevention
        this.preventionStrategies.set('memory_pressure', {
            detect: () => {
                const usage = process.memoryUsage();
                return usage.heapUsed / usage.heapTotal;
            },
            prevent: async (level) => {
                console.log(`🧹 Preventing memory pressure (${(level * 100).toFixed(1)}% usage)`);
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    console.log('   ✓ Forced garbage collection');
                }
                
                // Clear caches
                this.emit('cache:clear', { reason: 'memory_pressure' });
                
                // Restart high-memory services if critical
                if (level > this.thresholds.memoryCritical) {
                    await this.restartHighMemoryServices();
                }
            }
        });
        
        // Timeout prevention
        this.preventionStrategies.set('timeout_prevention', {
            detect: (service) => {
                const health = this.healthChecks.get(service.name);
                if (!health || !health.history.length) return false;
                
                // Check if response times are increasing
                const recent = health.history.slice(-5);
                const avgRecent = recent.reduce((a, b) => a + b.responseTime, 0) / recent.length;
                const baseline = health.history.slice(0, 5).reduce((a, b) => a + b.responseTime, 0) / 5;
                
                return avgRecent > baseline * 1.5;
            },
            prevent: async (service) => {
                console.log(`⏱️ Preventing timeout for ${service.name}`);
                
                // Increase timeout dynamically
                this.emit('config:update', {
                    service: service.name,
                    setting: 'timeout',
                    value: service.timeout * 1.5
                });
                
                // Add connection pooling if not present
                this.emit('connection:pool', {
                    service: service.name,
                    size: 10
                });
                
                // Pre-warm connections
                await this.prewarmConnections(service);
            }
        });
        
        // Connection refused prevention
        this.preventionStrategies.set('connection_refused', {
            detect: (service) => {
                const health = this.healthChecks.get(service.name);
                return health && health.status === 'down';
            },
            prevent: async (service) => {
                console.log(`🔌 Preventing connection refused for ${service.name}`);
                
                // Check if process is running
                const isRunning = await this.isProcessRunning(service);
                
                if (!isRunning) {
                    console.log(`   ⚡ Starting ${service.name}...`);
                    await this.startService(service);
                } else {
                    // Process is running but not responding
                    console.log(`   🔄 Restarting unresponsive ${service.name}...`);
                    await this.restartService(service);
                }
            }
        });
        
        // Cascade failure prevention
        this.preventionStrategies.set('cascade_prevention', {
            detect: () => {
                // Check if multiple services are failing
                const failingServices = Array.from(this.healthChecks.entries())
                    .filter(([_, health]) => health.status === 'down' || health.failures > 2);
                
                return failingServices.length > 2;
            },
            prevent: async () => {
                console.log('🌊 Preventing cascade failure!');
                
                // Enter protection mode
                this.emit('mode:protection', { reason: 'cascade_risk' });
                
                // Circuit break non-critical services
                for (const [name, service] of this.services) {
                    if (!service.critical) {
                        console.log(`   🔒 Circuit breaking ${name}`);
                        this.emit('circuit:break', { service: name });
                    }
                }
                
                // Restart critical services in dependency order
                await this.restartInDependencyOrder();
            }
        });
    }
    
    async integrateMetaLearning() {
        // Listen for meta-learning events
        this.metaLearning.on('pre-error:detected', async (condition) => {
            console.log(`\n⚠️ Pre-error condition detected: ${condition.type}`);
            
            // Take preventive action based on condition
            const strategy = this.preventionStrategies.get(condition.type);
            if (strategy) {
                await strategy.prevent(condition.metric);
            }
        });
        
        this.metaLearning.on('prevention:triggered', async (event) => {
            console.log(`\n🛡️ Meta-learning triggered prevention for: ${event.pattern.error_type}`);
            
            // Apply learned prevention rules
            for (const rule of event.rules) {
                await this.applyPreventionRule(rule);
            }
        });
        
        // Share our health data with meta-learning
        setInterval(() => {
            for (const [name, health] of this.healthChecks) {
                if (health.history.length > 0) {
                    const recent = health.history[health.history.length - 1];
                    this.metaLearning.monitoring.responseTime.set(name, 
                        [...(this.metaLearning.monitoring.responseTime.get(name) || []), recent.responseTime]
                    );
                }
            }
        }, 10000);
    }
    
    async createStartupSequence() {
        // Create Linux-style startup sequence
        this.startupSequence = [
            {
                name: 'System Prerequisites',
                checks: [
                    { name: 'Docker running', fn: () => this.checkDocker() },
                    { name: 'Network connectivity', fn: () => this.checkNetwork() },
                    { name: 'Disk space', fn: () => this.checkDiskSpace() },
                    { name: 'Memory available', fn: () => this.checkMemory() }
                ]
            },
            {
                name: 'Core Services',
                checks: [
                    { name: 'PostgreSQL', fn: () => this.verifyService('postgres') },
                    { name: 'Redis', fn: () => this.verifyService('redis') }
                ]
            },
            {
                name: 'Application Services',
                checks: [
                    { name: 'Verification Bus', fn: () => this.verifyService('verification-bus') },
                    { name: 'Unified Substrate Query', fn: () => this.verifyService('unified-substrate-query') }
                ]
            },
            {
                name: 'Distributed Services',
                checks: [
                    { name: 'IPFS', fn: () => this.verifyService('ipfs') }
                ]
            }
        ];
    }
    
    /**
     * Run full startup verification sequence
     */
    async runStartupSequence() {
        console.log('\n🚀 SYSTEM STARTUP SEQUENCE');
        console.log('==========================\n');
        
        let allPassed = true;
        
        for (const phase of this.startupSequence) {
            console.log(`📋 ${phase.name}`);
            
            for (const check of phase.checks) {
                process.stdout.write(`   Checking ${check.name}...`);
                
                try {
                    const result = await check.fn();
                    if (result) {
                        console.log(' ✅ OK');
                    } else {
                        console.log(' ❌ FAILED');
                        allPassed = false;
                        
                        // Try to fix the issue
                        await this.attemptAutoFix(check.name);
                    }
                } catch (error) {
                    console.log(` ❌ ERROR: ${error.message}`);
                    allPassed = false;
                }
            }
            
            console.log('');
        }
        
        if (allPassed) {
            console.log('✅ All systems operational!\n');
        } else {
            console.log('⚠️ Some systems need attention\n');
        }
        
        return allPassed;
    }
    
    /**
     * Verify a service is working properly
     */
    async verifyService(serviceName, level = null) {
        const service = this.services.get(serviceName);
        if (!service) return false;
        
        const verificationLevel = level || service.verificationLevel || 'standard';
        const checks = this.verificationLevels[verificationLevel];
        
        console.log(`\n🔍 Verifying ${serviceName} (${verificationLevel} level)`);
        
        let allPassed = true;
        
        for (const check of checks) {
            const result = await this.runVerificationCheck(service, check);
            console.log(`   ${check}: ${result ? '✅' : '❌'}`);
            
            if (!result) {
                allPassed = false;
                
                // Record failure for meta-learning
                await this.metaLearning.recordError({
                    type: 'verification_failure',
                    service: serviceName,
                    message: `Verification check failed: ${check}`,
                    check,
                    level: verificationLevel
                });
            }
        }
        
        // Update health status
        const health = this.healthChecks.get(serviceName);
        health.status = allPassed ? 'healthy' : 'unhealthy';
        health.lastCheck = new Date();
        
        return allPassed;
    }
    
    async runVerificationCheck(service, checkType) {
        switch (checkType) {
            case 'process_exists':
                return this.isProcessRunning(service);
                
            case 'port_listening':
                return this.isPortListening(service.port);
                
            case 'responds_to_ping':
                return this.pingService(service);
                
            case 'api_health_check':
                return this.checkAPIHealth(service);
                
            case 'data_flow_check':
                return this.checkDataFlow(service);
                
            case 'dependency_check':
                return this.checkDependencies(service);
                
            case 'performance_baseline':
                return this.checkPerformance(service);
                
            case 'error_rate_check':
                return this.checkErrorRate(service);
                
            case 'memory_leak_check':
                return this.checkMemoryLeak(service);
                
            default:
                return true;
        }
    }
    
    async isProcessRunning(service) {
        try {
            if (service.name === 'postgres' || service.name === 'redis') {
                // Check Docker containers
                const result = execSync(`docker ps --format "table {{.Names}}" | grep -q ${service.name}`, 
                    { encoding: 'utf-8', stdio: 'pipe' });
                return true;
            } else {
                // Check regular processes
                const result = execSync(`pgrep -f "${service.name}"`, { encoding: 'utf-8', stdio: 'pipe' });
                return result.trim().length > 0;
            }
        } catch {
            return false;
        }
    }
    
    async isPortListening(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true); // Port is in use (good)
                } else {
                    resolve(false);
                }
            });
            
            server.once('listening', () => {
                server.close();
                resolve(false); // Port is free (bad - nothing listening)
            });
            
            server.listen(port, 'localhost');
        });
    }
    
    async pingService(service) {
        if (service.healthCheck) {
            return service.healthCheck();
        }
        
        return new Promise((resolve) => {
            const client = net.createConnection(service.port, 'localhost');
            
            client.on('connect', () => {
                client.end();
                resolve(true);
            });
            
            client.on('error', () => {
                resolve(false);
            });
            
            setTimeout(() => {
                client.destroy();
                resolve(false);
            }, 1000);
        });
    }
    
    async checkAPIHealth(service) {
        if (!service.healthEndpoint) return true;
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            http.get(`http://localhost:${service.port}${service.healthEndpoint}`, (res) => {
                const responseTime = Date.now() - startTime;
                
                // Record response time
                const health = this.healthChecks.get(service.name);
                health.history.push({ 
                    timestamp: new Date(), 
                    responseTime,
                    statusCode: res.statusCode 
                });
                
                // Keep only last 100 entries
                if (health.history.length > 100) {
                    health.history = health.history.slice(-100);
                }
                
                resolve(res.statusCode === 200);
            }).on('error', () => {
                resolve(false);
            });
        });
    }
    
    async checkDataFlow(service) {
        // Verify data is actually flowing through the service
        // This is service-specific and would need custom implementation
        return true; // Placeholder
    }
    
    async checkDependencies(service) {
        if (!service.dependencies || service.dependencies.length === 0) return true;
        
        for (const dep of service.dependencies) {
            const depService = this.services.get(dep);
            if (!depService) continue;
            
            const isHealthy = await this.pingService(depService);
            if (!isHealthy) return false;
        }
        
        return true;
    }
    
    async checkPerformance(service) {
        const health = this.healthChecks.get(service.name);
        if (!health.history || health.history.length < 10) return true;
        
        // Check if performance is degrading
        const recent = health.history.slice(-5);
        const baseline = health.history.slice(0, 5);
        
        const avgRecent = recent.reduce((a, b) => a + b.responseTime, 0) / recent.length;
        const avgBaseline = baseline.reduce((a, b) => a + b.responseTime, 0) / baseline.length;
        
        return avgRecent < avgBaseline * 2; // Allow up to 2x degradation
    }
    
    async checkErrorRate(service) {
        const health = this.healthChecks.get(service.name);
        return health.failures < 5; // Less than 5 recent failures
    }
    
    async checkMemoryLeak(service) {
        // Would need process-specific memory tracking
        // For now, just check system memory
        const usage = process.memoryUsage();
        return usage.heapUsed / usage.heapTotal < 0.9;
    }
    
    /**
     * Start monitoring system health
     */
    startSystemMonitoring() {
        // Monitor system metrics every 10 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 10000);
        
        // Check service health every 30 seconds
        setInterval(() => {
            this.checkAllServices();
        }, 30000);
        
        // Run prevention checks every minute
        setInterval(() => {
            this.runPreventionChecks();
        }, 60000);
        
        console.log('   👁️ System monitoring started');
    }
    
    async collectSystemMetrics() {
        // Memory usage
        const memUsage = process.memoryUsage();
        const memoryPercent = memUsage.heapUsed / memUsage.heapTotal;
        this.metrics.memory.push({ timestamp: new Date(), value: memoryPercent });
        
        // CPU usage (simplified)
        const cpuUsage = process.cpuUsage();
        this.metrics.cpu.push({ timestamp: new Date(), value: cpuUsage });
        
        // Keep only last 100 metrics
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > 100) {
                this.metrics[key] = this.metrics[key].slice(-100);
            }
        });
        
        // Check thresholds
        if (memoryPercent > this.thresholds.memoryWarning) {
            this.emit('threshold:exceeded', {
                type: 'memory',
                level: memoryPercent > this.thresholds.memoryCritical ? 'critical' : 'warning',
                value: memoryPercent
            });
        }
    }
    
    async checkAllServices() {
        for (const [name, service] of this.services) {
            const isHealthy = await this.pingService(service);
            const health = this.healthChecks.get(name);
            
            if (!isHealthy && health.status === 'healthy') {
                // Service just went down
                health.failures++;
                console.log(`\n⚠️ Service ${name} is down!`);
                
                // Trigger prevention
                const strategy = this.preventionStrategies.get('connection_refused');
                if (strategy && strategy.detect(service)) {
                    await strategy.prevent(service);
                }
            }
            
            health.status = isHealthy ? 'healthy' : 'down';
        }
    }
    
    async runPreventionChecks() {
        // Check each prevention strategy
        for (const [name, strategy] of this.preventionStrategies) {
            try {
                const shouldPrevent = await strategy.detect();
                if (shouldPrevent) {
                    console.log(`\n🛡️ Running prevention: ${name}`);
                    await strategy.prevent(shouldPrevent);
                }
            } catch (error) {
                console.error(`Prevention check failed for ${name}:`, error);
            }
        }
    }
    
    async startService(service) {
        console.log(`   Starting ${service.name}...`);
        
        try {
            if (service.startCommand) {
                execSync(service.startCommand, { stdio: 'inherit' });
                
                // Wait for service to start
                await this.waitForService(service);
                
                return true;
            }
        } catch (error) {
            console.error(`   Failed to start ${service.name}:`, error.message);
            return false;
        }
    }
    
    async restartService(service) {
        console.log(`   Restarting ${service.name}...`);
        
        // Stop service first
        try {
            if (service.name.includes('docker')) {
                execSync(`docker-compose restart ${service.name}`, { stdio: 'inherit' });
            } else {
                execSync(`pkill -f "${service.name}"`, { stdio: 'pipe' });
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.startService(service);
            }
        } catch (error) {
            console.error(`   Failed to restart ${service.name}:`, error.message);
        }
    }
    
    async waitForService(service, timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await this.pingService(service)) {
                console.log(`   ✅ ${service.name} is ready!`);
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`   ❌ ${service.name} failed to start within ${timeout}ms`);
        return false;
    }
    
    async restartHighMemoryServices() {
        // Find services using high memory
        // In real implementation, would check actual process memory
        console.log('   🔄 Restarting high-memory services...');
        
        for (const [name, service] of this.services) {
            if (!service.critical) {
                await this.restartService(service);
            }
        }
    }
    
    async prewarmConnections(service) {
        console.log(`   🔥 Pre-warming connections for ${service.name}`);
        
        // Create multiple connections to warm up the service
        const connections = [];
        for (let i = 0; i < 5; i++) {
            connections.push(this.pingService(service));
        }
        
        await Promise.all(connections);
    }
    
    async restartInDependencyOrder() {
        console.log('   🔄 Restarting services in dependency order...');
        
        // Build dependency graph
        const sorted = this.topologicalSort();
        
        // Restart in order
        for (const serviceName of sorted) {
            const service = this.services.get(serviceName);
            if (service && service.critical) {
                await this.restartService(service);
                await this.waitForService(service);
            }
        }
    }
    
    topologicalSort() {
        const visited = new Set();
        const stack = [];
        
        const visit = (name) => {
            if (visited.has(name)) return;
            visited.add(name);
            
            const service = this.services.get(name);
            if (service && service.dependencies) {
                for (const dep of service.dependencies) {
                    visit(dep);
                }
            }
            
            stack.push(name);
        };
        
        for (const [name] of this.services) {
            visit(name);
        }
        
        return stack;
    }
    
    async attemptAutoFix(checkName) {
        console.log(`   🔧 Attempting auto-fix for ${checkName}...`);
        
        switch (checkName) {
            case 'Docker running':
                try {
                    execSync('docker info', { stdio: 'pipe' });
                } catch {
                    console.log('      Starting Docker...');
                    execSync('open -a Docker || sudo systemctl start docker', { stdio: 'pipe' });
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                break;
                
            case 'PostgreSQL':
                await this.startService(this.services.get('postgres'));
                break;
                
            case 'Redis':
                await this.startService(this.services.get('redis'));
                break;
        }
    }
    
    async checkDocker() {
        try {
            execSync('docker info', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }
    
    async checkNetwork() {
        // Simple network check
        return new Promise((resolve) => {
            require('dns').lookup('google.com', (err) => {
                resolve(!err);
            });
        });
    }
    
    async checkDiskSpace() {
        try {
            const result = execSync('df -h . | tail -1', { encoding: 'utf-8' });
            const match = result.match(/(\d+)%/);
            if (match) {
                const usage = parseInt(match[1]);
                return usage < 85; // Less than 85% disk usage
            }
        } catch {}
        return true;
    }
    
    async checkMemory() {
        const usage = process.memoryUsage();
        return usage.heapUsed / usage.heapTotal < 0.85;
    }
    
    /**
     * Apply a prevention rule from meta-learning
     */
    async applyPreventionRule(rule) {
        console.log(`   Applying rule: ${rule.type}`);
        
        switch (rule.type) {
            case 'increase_timeout':
                // Already handled by meta-learning
                break;
                
            case 'add_retry':
                this.emit('retry:configure', {
                    service: rule.target,
                    strategy: rule.action,
                    maxRetries: rule.maxRetries
                });
                break;
                
            case 'health_check':
                await this.verifyService(rule.target, 'deep');
                break;
                
            case 'auto_restart':
                const service = this.services.get(rule.target);
                if (service && !await this.pingService(service)) {
                    await this.restartService(service);
                }
                break;
                
            case 'memory_limit':
                this.emit('memory:limit', {
                    service: rule.target,
                    limit: rule.limit
                });
                break;
                
            case 'periodic_restart':
                this.schedulePeriodicRestart(rule.target, rule.interval);
                break;
                
            case 'deep_health_check':
                await this.verifyService(rule.target, 'paranoid');
                break;
        }
    }
    
    schedulePeriodicRestart(serviceName, interval) {
        console.log(`   📅 Scheduling periodic restart for ${serviceName} every ${interval}`);
        
        // Parse interval (e.g., "24h" -> 24 * 60 * 60 * 1000)
        const ms = this.parseInterval(interval);
        
        setInterval(async () => {
            console.log(`\n🔄 Periodic restart for ${serviceName}`);
            const service = this.services.get(serviceName);
            if (service) {
                await this.restartService(service);
            }
        }, ms);
    }
    
    parseInterval(interval) {
        const match = interval.match(/(\d+)([hms])/);
        if (!match) return 3600000; // Default 1 hour
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'm': return value * 60 * 1000;
            case 's': return value * 1000;
            default: return 3600000;
        }
    }
    
    /**
     * Get prevention system status
     */
    async getStatus() {
        const status = {
            services: {},
            metrics: {
                memory: this.metrics.memory.slice(-1)[0]?.value || 0,
                errors: 0,
                uptime: process.uptime()
            },
            preventions: {
                active: this.activePreventions.size,
                triggered: 0
            }
        };
        
        // Service status
        for (const [name, health] of this.healthChecks) {
            status.services[name] = {
                status: health.status,
                lastCheck: health.lastCheck,
                failures: health.failures,
                avgResponseTime: health.history.length > 0 
                    ? health.history.reduce((a, b) => a + b.responseTime, 0) / health.history.length
                    : 0
            };
        }
        
        return status;
    }
}

// Export for use
module.exports = ProactiveErrorPrevention;

// Run if executed directly
if (require.main === module) {
    const prevention = new ProactiveErrorPrevention();
    
    prevention.on('ready', async () => {
        console.log('\n🛡️ PROACTIVE ERROR PREVENTION DEMO');
        console.log('=====================================\n');
        
        // Run startup sequence
        console.log('1. Running startup verification...');
        const startupOk = await prevention.runStartupSequence();
        
        // Check system status
        console.log('\n2. System Status:');
        const status = await prevention.getStatus();
        console.log(JSON.stringify(status, null, 2));
        
        // Listen for threshold events
        prevention.on('threshold:exceeded', (event) => {
            console.log(`\n⚠️ Threshold exceeded: ${event.type} at ${(event.value * 100).toFixed(1)}%`);
        });
        
        // Simulate memory pressure
        console.log('\n3. Simulating memory pressure...');
        const arrays = [];
        let i = 0;
        const interval = setInterval(() => {
            arrays.push(new Array(1000000).fill(Math.random()));
            i++;
            
            if (i > 50) {
                clearInterval(interval);
                console.log('   Memory pressure test complete');
                
                // Clean up
                arrays.length = 0;
                if (global.gc) global.gc();
            }
        }, 100);
        
        console.log('\n✅ Proactive Error Prevention is monitoring your system!');
        console.log('   Press Ctrl+C to stop\n');
    });
}