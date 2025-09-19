#!/usr/bin/env node

/**
 * 🎯 UNIFIED ROUTER ORCHESTRATOR
 * 
 * Coordinates all 24+ routers with proper health checks, dependencies,
 * and automatic recovery when issues are detected
 */

const EventEmitter = require('events');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const http = require('http');
const WebSocket = require('ws');

class UnifiedRouterOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Router definitions with proper dependencies
        this.routers = new Map([
            // Core Infrastructure (must start first)
            ['postgres', {
                name: 'PostgreSQL',
                command: 'docker-compose up -d postgres',
                port: 5432,
                healthCheck: async () => this.checkPostgres(),
                priority: 1,
                dependencies: []
            }],
            ['redis', {
                name: 'Redis',
                command: 'docker-compose up -d redis',
                port: 6379,
                healthCheck: async () => this.checkRedis(),
                priority: 1,
                dependencies: []
            }],
            
            // MCP and Core Services
            ['mcp-connector', {
                name: 'MCP Connector',
                command: 'node MCP-CONNECTOR.js',
                port: 6666,
                wsPort: 6667,
                healthCheck: '/health',
                priority: 2,
                dependencies: ['postgres', 'redis']
            }],
            ['dungeon-master', {
                name: 'Dungeon Master Router',
                command: 'node DUNGEON-MASTER-ROUTER.js',
                port: 7777,
                wsPort: 7778,
                healthCheck: '/health',
                priority: 2,
                dependencies: ['mcp-connector']
            }],
            
            // Agent Services
            ['agent-economy', {
                name: 'Agent Economy Forum',
                command: 'node AGENT-ECONOMY-FORUM.js',
                port: 8080,
                wsPort: 8081,
                healthCheck: '/health',
                priority: 3,
                dependencies: ['postgres', 'redis']
            }],
            ['agent-blockchain', {
                name: 'Agent Blockchain',
                command: 'node AGENT-BLOCKCHAIN.js',
                port: 8082,
                wsPort: 8082,
                healthCheck: '/health',
                priority: 3,
                dependencies: ['agent-economy']
            }],
            
            // Documentation and AI Services
            ['sphinx-doc', {
                name: 'Sphinx Documentation',
                command: 'node SPHINX-DOC-GENERATOR.js',
                port: 9090, // Changed from 9000 to avoid MinIO conflict
                wsPort: 9001,
                healthCheck: '/health',
                priority: 3,
                dependencies: ['mcp-connector']
            }],
            ['cal-riven', {
                name: 'Cal Riven Assistant',
                command: 'node CAL-RIVEN-ASSISTANT.js',
                port: 9999,
                wsPort: 9998,
                healthCheck: '/health',
                priority: 3,
                dependencies: ['mcp-connector']
            }],
            ['cal-3d', {
                name: 'Cal Riven 3D Workspace',
                command: 'node CAL-RIVEN-3D-WORKSPACE.js',
                port: 8888,
                wsPort: 8889,
                healthCheck: '/health',
                priority: 3,
                dependencies: ['cal-riven']
            }],
            
            // System Services
            ['system-verification', {
                name: 'System Verification',
                command: 'node COMPREHENSIVE-SYSTEM-VERIFICATION.js',
                port: 7999,
                healthCheck: '/health',
                priority: 4,
                dependencies: ['mcp-connector', 'agent-economy']
            }],
            ['emergency-system', {
                name: 'Emergency Notification',
                command: 'node emergency-notification-system.js',
                port: 8090,
                healthCheck: '/health',
                priority: 4,
                dependencies: ['system-verification']
            }],
            ['loot-drop', {
                name: 'Emergency Loot Drop',
                command: 'node emergency-loot-drop-system.js',
                port: null, // No dedicated port
                healthCheck: null,
                priority: 4,
                dependencies: ['emergency-system']
            }],
            
            // Flow and Monitoring
            ['flow-orchestrator', {
                name: 'Unified Flow Orchestrator',
                command: 'node unified-flow-orchestrator.js',
                port: null,
                healthCheck: null,
                priority: 5,
                dependencies: ['agent-economy', 'agent-blockchain']
            }],
            ['flow-monitor', {
                name: 'Flow Monitor Dashboard',
                command: 'node flow-monitor-dashboard.js',
                port: 8091,
                wsPort: 8092,
                healthCheck: '/',
                priority: 5,
                dependencies: ['flow-orchestrator']
            }],
            
            // Character Class Routers
            ['html-master', {
                name: 'HTML Master',
                command: 'node HTML-MASTER-ROUTER.js',
                port: 7001,
                healthCheck: '/health',
                priority: 6,
                dependencies: ['dungeon-master']
            }],
            ['css-mage', {
                name: 'CSS Mage',
                command: 'node CSS-MAGE-ROUTER.js',
                port: 7002,
                healthCheck: '/health',
                priority: 6,
                dependencies: ['dungeon-master']
            }],
            ['js-wizard', {
                name: 'JS Wizard',
                command: 'node JS-WIZARD-ROUTER.js',
                port: 7003,
                healthCheck: '/health',
                priority: 6,
                dependencies: ['dungeon-master']
            }],
            ['design-paladin', {
                name: 'Design Paladin',
                command: 'node DESIGN-PALADIN-ROUTER.js',
                port: 7004,
                healthCheck: '/health',
                priority: 6,
                dependencies: ['dungeon-master']
            }],
            ['seo-rogue', {
                name: 'SEO Rogue',
                command: 'node SEO-ROGUE-ROUTER.js',
                port: 7005,
                healthCheck: '/health',
                priority: 6,
                dependencies: ['dungeon-master']
            }],
            ['db-cleric', {
                name: 'DB Cleric',
                command: 'node DB-CLERIC-ROUTER.js',
                port: 7006,
                healthCheck: '/health',
                priority: 6,
                dependencies: ['postgres']
            }],
            
            // Additional Services
            ['infinity-router', {
                name: 'Infinity Router',
                command: 'node infinity-router-server.js',
                port: 3333,
                healthCheck: '/health',
                priority: 7,
                dependencies: ['flow-orchestrator']
            }],
            ['master-unified', {
                name: 'Master Unified Launcher',
                command: 'node MASTER-UNIFIED-LAUNCHER.js',
                port: 8085,
                healthCheck: '/health',
                priority: 7,
                dependencies: ['flow-orchestrator']
            }],
            ['auth-foundation', {
                name: 'Auth Foundation',
                command: 'node AUTH-FOUNDATION-SYSTEM.js',
                port: 8086,
                healthCheck: '/health',
                priority: 3,
                dependencies: ['postgres', 'redis']
            }],
            ['wallet-manager', {
                name: 'Wallet Address Manager',
                command: 'node wallet-address-manager.js',
                port: 8087,
                healthCheck: '/health',
                priority: 4,
                dependencies: ['auth-foundation']
            }]
        ]);
        
        // Router state tracking
        this.routerStates = new Map();
        this.processes = new Map();
        this.healthCheckIntervals = new Map();
        
        // Orchestration state
        this.isStarting = false;
        this.isStopping = false;
        
        // Statistics
        this.stats = {
            startTime: Date.now(),
            restarts: new Map(),
            failures: new Map(),
            healthChecks: {
                total: 0,
                passed: 0,
                failed: 0
            }
        };
    }
    
    async start() {
        if (this.isStarting) {
            console.log('⚠️ Already starting routers...');
            return;
        }
        
        this.isStarting = true;
        console.log('🚀 Starting Unified Router Orchestrator...\n');
        
        // Group routers by priority
        const priorityGroups = new Map();
        for (const [id, router] of this.routers) {
            const priority = router.priority || 99;
            if (!priorityGroups.has(priority)) {
                priorityGroups.set(priority, []);
            }
            priorityGroups.get(priority).push({ id, ...router });
        }
        
        // Start routers in priority order
        const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => a - b);
        
        for (const priority of sortedPriorities) {
            console.log(`\n📦 Starting Priority ${priority} services...`);
            const group = priorityGroups.get(priority);
            
            // Start all routers in this priority group in parallel
            const startPromises = group.map(router => this.startRouter(router.id, router));
            await Promise.all(startPromises);
            
            // Wait a bit between priority groups
            if (priority < Math.max(...sortedPriorities)) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        this.isStarting = false;
        
        // Start monitoring
        this.startHealthMonitoring();
        
        console.log('\n✅ All routers started successfully!');
        this.emit('orchestrator:ready');
    }
    
    async startRouter(id, router) {
        try {
            console.log(`  🔧 Starting ${router.name}...`);
            
            // Check dependencies first
            for (const dep of router.dependencies) {
                const depState = this.routerStates.get(dep);
                if (!depState || depState.status !== 'running') {
                    throw new Error(`Dependency ${dep} is not running`);
                }
            }
            
            // Update state
            this.routerStates.set(id, {
                status: 'starting',
                startTime: Date.now(),
                lastHealthCheck: null,
                restarts: 0
            });
            
            // Start the process
            const [cmd, ...args] = router.command.split(' ');
            const proc = spawn(cmd, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, PORT: router.port }
            });
            
            this.processes.set(id, proc);
            
            // Handle process events
            proc.on('error', (error) => {
                console.error(`  ❌ ${router.name} error:`, error.message);
                this.handleRouterFailure(id, router, error);
            });
            
            proc.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`  ❌ ${router.name} exited with code ${code}`);
                    this.handleRouterFailure(id, router, new Error(`Exit code ${code}`));
                }
            });
            
            // Log output
            proc.stdout.on('data', (data) => {
                if (process.env.DEBUG) {
                    console.log(`[${router.name}] ${data.toString().trim()}`);
                }
            });
            
            proc.stderr.on('data', (data) => {
                console.error(`[${router.name}] ERROR: ${data.toString().trim()}`);
            });
            
            // Wait for service to be ready
            await this.waitForReady(id, router);
            
            // Update state
            this.routerStates.get(id).status = 'running';
            
            console.log(`  ✅ ${router.name} started successfully`);
            this.emit('router:started', { id, router });
            
        } catch (error) {
            console.error(`  ❌ Failed to start ${router.name}:`, error.message);
            this.routerStates.set(id, { status: 'failed', error: error.message });
            throw error;
        }
    }
    
    async waitForReady(id, router, maxAttempts = 30) {
        if (!router.port && !router.healthCheck) {
            // No health check needed
            return true;
        }
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                if (router.healthCheck === null) {
                    // Service doesn't need health check
                    return true;
                } else if (typeof router.healthCheck === 'function') {
                    // Custom health check
                    const healthy = await router.healthCheck();
                    if (healthy) return true;
                } else if (router.healthCheck && router.port) {
                    // HTTP health check
                    const healthy = await this.checkHttpHealth(router.port, router.healthCheck);
                    if (healthy) return true;
                }
            } catch (error) {
                // Not ready yet
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Service failed to become ready');
    }
    
    async checkHttpHealth(port, path) {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}${path}`, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(2000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }
    
    async checkPostgres() {
        // Check if PostgreSQL is accepting connections
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: 'localhost',
                port: 5432,
                user: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'postgres'
            });
            
            await client.connect();
            await client.end();
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async checkRedis() {
        // Check if Redis is accepting connections
        try {
            const redis = require('redis');
            const client = redis.createClient({ port: 6379 });
            
            await new Promise((resolve, reject) => {
                client.on('ready', resolve);
                client.on('error', reject);
            });
            
            client.quit();
            return true;
        } catch (error) {
            return false;
        }
    }
    
    startHealthMonitoring() {
        console.log('\n🏥 Starting health monitoring...');
        
        for (const [id, router] of this.routers) {
            if (router.healthCheck && router.port) {
                const interval = setInterval(async () => {
                    await this.performHealthCheck(id, router);
                }, 30000); // Check every 30 seconds
                
                this.healthCheckIntervals.set(id, interval);
            }
        }
    }
    
    async performHealthCheck(id, router) {
        this.stats.healthChecks.total++;
        
        try {
            let healthy = false;
            
            if (typeof router.healthCheck === 'function') {
                healthy = await router.healthCheck();
            } else if (router.healthCheck && router.port) {
                healthy = await this.checkHttpHealth(router.port, router.healthCheck);
            }
            
            const state = this.routerStates.get(id);
            if (state) {
                state.lastHealthCheck = {
                    timestamp: Date.now(),
                    healthy
                };
            }
            
            if (healthy) {
                this.stats.healthChecks.passed++;
            } else {
                this.stats.healthChecks.failed++;
                console.warn(`⚠️ ${router.name} health check failed`);
                await this.handleUnhealthyRouter(id, router);
            }
            
        } catch (error) {
            this.stats.healthChecks.failed++;
            console.error(`❌ Health check error for ${router.name}:`, error.message);
        }
    }
    
    async handleUnhealthyRouter(id, router) {
        const state = this.routerStates.get(id);
        
        // Try to restart if not recently restarted
        const lastRestart = this.stats.restarts.get(id) || 0;
        const timeSinceRestart = Date.now() - lastRestart;
        
        if (timeSinceRestart > 60000) { // Don't restart more than once per minute
            console.log(`🔄 Attempting to restart ${router.name}...`);
            
            // Stop the router
            await this.stopRouter(id);
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Restart
            try {
                await this.startRouter(id, router);
                this.stats.restarts.set(id, Date.now());
                state.restarts++;
            } catch (error) {
                console.error(`❌ Failed to restart ${router.name}:`, error.message);
                this.emit('router:failed', { id, router, error });
            }
        }
    }
    
    async handleRouterFailure(id, router, error) {
        const failures = this.stats.failures.get(id) || 0;
        this.stats.failures.set(id, failures + 1);
        
        this.emit('router:error', { id, router, error });
        
        // Update state
        const state = this.routerStates.get(id);
        if (state) {
            state.status = 'failed';
            state.error = error.message;
        }
        
        // Try to restart after a delay
        setTimeout(() => {
            if (state && state.restarts < 3) {
                console.log(`🔄 Attempting restart ${state.restarts + 1}/3 for ${router.name}...`);
                this.startRouter(id, router).catch(console.error);
            }
        }, 5000);
    }
    
    async stopRouter(id) {
        const proc = this.processes.get(id);
        if (proc) {
            proc.kill('SIGTERM');
            this.processes.delete(id);
        }
        
        const interval = this.healthCheckIntervals.get(id);
        if (interval) {
            clearInterval(interval);
            this.healthCheckIntervals.delete(id);
        }
        
        this.routerStates.set(id, { status: 'stopped' });
    }
    
    async stop() {
        if (this.isStopping) return;
        
        this.isStopping = true;
        console.log('\n🛑 Stopping all routers...');
        
        // Stop health monitoring
        for (const interval of this.healthCheckIntervals.values()) {
            clearInterval(interval);
        }
        this.healthCheckIntervals.clear();
        
        // Stop all processes
        const stopPromises = [];
        for (const id of this.processes.keys()) {
            stopPromises.push(this.stopRouter(id));
        }
        
        await Promise.all(stopPromises);
        
        this.isStopping = false;
        console.log('✅ All routers stopped');
        this.emit('orchestrator:stopped');
    }
    
    getStatus() {
        const statuses = {};
        
        for (const [id, router] of this.routers) {
            const state = this.routerStates.get(id) || { status: 'not_started' };
            const proc = this.processes.get(id);
            
            statuses[id] = {
                name: router.name,
                status: state.status,
                port: router.port,
                wsPort: router.wsPort,
                uptime: state.startTime ? Date.now() - state.startTime : 0,
                restarts: state.restarts || 0,
                lastHealthCheck: state.lastHealthCheck,
                pid: proc?.pid,
                error: state.error
            };
        }
        
        return {
            orchestrator: {
                uptime: Date.now() - this.stats.startTime,
                totalRouters: this.routers.size,
                running: Array.from(this.routerStates.values()).filter(s => s.status === 'running').length,
                failed: Array.from(this.routerStates.values()).filter(s => s.status === 'failed').length
            },
            routers: statuses,
            healthChecks: this.stats.healthChecks,
            restarts: Object.fromEntries(this.stats.restarts),
            failures: Object.fromEntries(this.stats.failures)
        };
    }
}

// Export
module.exports = UnifiedRouterOrchestrator;

// Start if run directly
if (require.main === module) {
    const orchestrator = new UnifiedRouterOrchestrator();
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
        console.log('\n\nReceived SIGINT, shutting down gracefully...');
        await orchestrator.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n\nReceived SIGTERM, shutting down gracefully...');
        await orchestrator.stop();
        process.exit(0);
    });
    
    // Start orchestrator
    orchestrator.start().catch(console.error);
    
    // Status API
    const statusServer = http.createServer((req, res) => {
        if (req.url === '/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(orchestrator.getStatus(), null, 2));
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    
    statusServer.listen(7000, () => {
        console.log('\n📊 Orchestrator status available at http://localhost:7000/status');
    });
}