#!/usr/bin/env node

/**
 * 🔧 ISOLATION & REPAIR CONTROLLER
 * 
 * Manages safe isolation of services for repair without breaking the entire system.
 * Prevents cascade failures and manages the compactor to avoid it going wild.
 * 
 * Features:
 * - Service dependency tracking
 * - Safe isolation procedures
 * - Graceful degradation during repairs
 * - Compactor behavior management
 * - Service reintroduction protocols
 * - Health verification before bringing services back online
 */

const express = require('express');
const { EventEmitter } = require('events');
const crypto = require('crypto');

console.log('\n🔧 ISOLATION & REPAIR CONTROLLER INITIALIZING...');
console.log('===========================================');
console.log('🏥 Service isolation management');
console.log('🛡️ Cascade failure prevention');
console.log('🔄 Safe reintroduction protocols');
console.log('🎮 Compactor behavior control');

class IsolationRepairController extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.port = options.port || 10002;
        this.app = express();
        
        // Configuration
        this.config = {
            healthCheckInterval: options.healthCheckInterval || 10000, // 10 seconds
            isolationTimeout: options.isolationTimeout || 300000, // 5 minutes max isolation
            compactorThreshold: options.compactorThreshold || 0.7, // 70% health before compactor runs
            calOptimizerUrl: options.calOptimizerUrl || 'http://localhost:10001'
        };
        
        // Service registry with dependencies
        this.services = new Map();
        this.initializeServiceRegistry();
        
        // Isolation state tracking
        this.isolatedServices = new Map(); // service -> isolation info
        this.repairQueue = [];
        this.activeRepairs = new Map();
        
        // Compactor state
        this.compactorState = {
            enabled: true,
            mode: 'conservative', // conservative, normal, aggressive
            lastRun: null,
            runsToday: 0,
            blockedReason: null
        };
        
        // System health metrics
        this.systemHealth = {
            overall: 1.0, // 0-1 scale
            services: new Map(),
            lastCheck: new Date()
        };
        
        // Cal's sysadmin personality for monitoring
        this.calPersonality = {
            blameCount: 0,
            coffeeLevel: 100,
            mood: 'cautiously optimistic',
            sarcasmLevel: 1,
            lastComment: null,
            comments: [
                "Another service down? Must be DNS.",
                "Have you tried turning it off and on again?",
                "Working as intended™",
                "That's not a bug, it's a feature",
                "I'm sure this won't cause any problems...",
                "Oh great, another fire to put out"
            ]
        };
        
        this.initializeController();
    }
    
    initializeServiceRegistry() {
        // Define services and their dependencies
        this.services.set('universal-brain', {
            name: 'Universal Brain',
            url: 'http://localhost:9999',
            critical: true,
            dependencies: ['respawn-memory', 'verification-layer'],
            health: 'unknown',
            canIsolate: false // Never isolate the brain
        });
        
        this.services.set('respawn-memory', {
            name: 'Respawn Memory System',
            url: 'http://localhost:9998',
            critical: true,
            dependencies: [],
            health: 'unknown',
            canIsolate: true
        });
        
        this.services.set('verification-layer', {
            name: 'Verification Layer',
            url: 'http://localhost:9997',
            critical: false,
            dependencies: [],
            health: 'unknown',
            canIsolate: true
        });
        
        this.services.set('context-engine', {
            name: 'Context Understanding Engine',
            url: 'http://localhost:10000',
            critical: false,
            dependencies: ['universal-brain'],
            health: 'unknown',
            canIsolate: true
        });
        
        this.services.set('cal-optimizer', {
            name: 'Cal Runtime Optimizer',
            url: 'http://localhost:10001',
            critical: false,
            dependencies: [],
            health: 'unknown',
            canIsolate: true
        });
        
        this.services.set('forum-bridge', {
            name: 'Forum-Orchestration Bridge',
            url: 'http://localhost:22200',
            critical: false,
            dependencies: ['universal-brain'],
            health: 'unknown',
            canIsolate: true
        });
        
        this.services.set('unified-orchestration', {
            name: 'Unified Orchestration System',
            url: 'http://localhost:20000',
            critical: true,
            dependencies: [],
            health: 'unknown',
            canIsolate: true
        });
        
        this.services.set('database', {
            name: 'PostgreSQL Database',
            url: 'http://localhost:5432',
            critical: true,
            dependencies: [],
            health: 'unknown',
            canIsolate: false // Never isolate the database
        });
    }
    
    async initializeController() {
        console.log('🔧 Setting up Isolation & Repair Controller...');
        
        // Setup routes
        this.setupRoutes();
        
        // Start health monitoring
        await this.startHealthMonitoring();
        
        // Initialize compactor management
        this.initializeCompactorControl();
        
        // Setup repair queue processing
        this.startRepairQueueProcessor();
        
        console.log('✅ Isolation & Repair Controller ready');
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Isolate a service for repair
        this.app.post('/isolate', async (req, res) => {
            try {
                const result = await this.isolateService(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    error: error.message,
                    suggestion: "Check service dependencies first"
                });
            }
        });
        
        // Bring service back online
        this.app.post('/reintroduce', async (req, res) => {
            try {
                const result = await this.reintroduceService(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get isolation status
        this.app.get('/status', (req, res) => {
            res.json({
                isolated_services: Array.from(this.isolatedServices.keys()),
                repair_queue: this.repairQueue,
                active_repairs: Array.from(this.activeRepairs.keys()),
                system_health: this.systemHealth,
                compactor_state: this.compactorState
            });
        });
        
        // Compactor control
        this.app.post('/compactor/control', (req, res) => {
            const { action, mode } = req.body;
            const result = this.controlCompactor(action, mode);
            res.json(result);
        });
        
        // Emergency stop
        this.app.post('/emergency/stop', async (req, res) => {
            const result = await this.emergencyStop();
            res.json(result);
        });
        
        // Health endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'operational',
                system_health: this.systemHealth.overall,
                isolated_count: this.isolatedServices.size,
                compactor_enabled: this.compactorState.enabled
            });
        });
    }
    
    async startHealthMonitoring() {
        console.log('🏥 Starting service health monitoring...');
        
        // Initial health check
        await this.checkAllServices();
        
        // Periodic health checks
        setInterval(async () => {
            await this.checkAllServices();
            this.updateSystemHealth();
            this.checkCompactorBehavior();
        }, this.config.healthCheckInterval);
    }
    
    async checkAllServices() {
        for (const [serviceId, service] of this.services) {
            // Skip isolated services
            if (this.isolatedServices.has(serviceId)) {
                this.systemHealth.services.set(serviceId, {
                    status: 'isolated',
                    healthy: false,
                    lastCheck: new Date()
                });
                continue;
            }
            
            try {
                const healthUrl = service.url + '/health';
                const response = await fetch(healthUrl, { timeout: 5000 });
                
                if (response.ok) {
                    service.health = 'healthy';
                    this.systemHealth.services.set(serviceId, {
                        status: 'healthy',
                        healthy: true,
                        lastCheck: new Date()
                    });
                } else {
                    service.health = 'unhealthy';
                    this.systemHealth.services.set(serviceId, {
                        status: 'unhealthy',
                        healthy: false,
                        lastCheck: new Date(),
                        httpStatus: response.status
                    });
                }
            } catch (error) {
                service.health = 'unreachable';
                this.systemHealth.services.set(serviceId, {
                    status: 'unreachable',
                    healthy: false,
                    lastCheck: new Date(),
                    error: error.message
                });
            }
        }
    }
    
    updateSystemHealth() {
        const healthyCount = Array.from(this.systemHealth.services.values())
            .filter(s => s.healthy).length;
        const totalCount = this.services.size;
        
        this.systemHealth.overall = healthyCount / totalCount;
        this.systemHealth.lastCheck = new Date();
        
        // Emit health event
        this.emit('health_update', {
            overall: this.systemHealth.overall,
            healthy: healthyCount,
            total: totalCount
        });
    }
    
    async isolateService(request) {
        const { service_id, reason, estimated_repair_time = 300000 } = request;
        
        console.log(`🏥 Isolating service: ${service_id} for ${reason}`);
        
        // Validate service exists
        const service = this.services.get(service_id);
        if (!service) {
            throw new Error('Unknown service: ' + service_id);
        }
        
        // Check if service can be isolated
        if (!service.canIsolate) {
            throw new Error('Service cannot be isolated: ' + service_id);
        }
        
        // Check if already isolated
        if (this.isolatedServices.has(service_id)) {
            throw new Error('Service already isolated: ' + service_id);
        }
        
        // Check dependencies
        const dependents = this.findDependentServices(service_id);
        const criticalDependents = dependents.filter(d => 
            this.services.get(d).critical && !this.isolatedServices.has(d)
        );
        
        if (criticalDependents.length > 0) {
            throw new Error('Cannot isolate: critical services depend on this: ' + criticalDependents.join(', '));
        }
        
        // Perform isolation
        const isolationInfo = {
            id: crypto.randomUUID(),
            service_id: service_id,
            reason: reason,
            isolated_at: new Date(),
            estimated_duration: estimated_repair_time,
            dependent_services: dependents,
            isolation_strategy: this.determineIsolationStrategy(service_id, dependents)
        };
        
        // Execute isolation strategy
        await this.executeIsolation(isolationInfo);
        
        // Record isolation
        this.isolatedServices.set(service_id, isolationInfo);
        
        // Add to repair queue
        this.repairQueue.push({
            service_id: service_id,
            priority: service.critical ? 'high' : 'normal',
            added_at: new Date()
        });
        
        // Notify Cal if needed
        if (service.critical) {
            this.notifyCal(service_id, reason);
        }
        
        return {
            isolation_id: isolationInfo.id,
            service_isolated: service_id,
            affected_services: dependents,
            strategy_used: isolationInfo.isolation_strategy,
            estimated_repair_time: estimated_repair_time,
            cal_notified: service.critical
        };
    }
    
    findDependentServices(serviceId) {
        const dependents = [];
        
        for (const [id, service] of this.services) {
            if (service.dependencies.includes(serviceId)) {
                dependents.push(id);
            }
        }
        
        return dependents;
    }
    
    determineIsolationStrategy(serviceId, dependents) {
        if (dependents.length === 0) {
            return 'simple_isolation';
        } else if (dependents.length <= 2) {
            return 'graceful_degradation';
        } else {
            return 'cascading_isolation';
        }
    }
    
    async executeIsolation(isolationInfo) {
        const { service_id, isolation_strategy, dependent_services } = isolationInfo;
        
        switch (isolation_strategy) {
            case 'simple_isolation':
                // Just stop routing to the service
                console.log(`🔌 Simple isolation of ${service_id}`);
                break;
                
            case 'graceful_degradation':
                // Notify dependent services to use fallback behavior
                console.log(`⚡ Graceful degradation for ${service_id}`);
                for (const dependent of dependent_services) {
                    await this.notifyServiceOfDegradation(dependent, service_id);
                }
                break;
                
            case 'cascading_isolation':
                // May need to isolate dependent services too
                console.log(`🌊 Cascading isolation starting from ${service_id}`);
                // Implement careful cascading logic
                break;
        }
        
        // Update routing tables to bypass isolated service
        this.updateRoutingTable(service_id, 'isolated');
    }
    
    async notifyServiceOfDegradation(serviceId, isolatedDependency) {
        const service = this.services.get(serviceId);
        if (service && service.url) {
            try {
                await fetch(service.url + '/degraded-mode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        isolated_dependency: isolatedDependency,
                        use_fallback: true
                    })
                });
            } catch (error) {
                console.error(`Failed to notify ${serviceId} of degradation:`, error);
            }
        }
    }
    
    updateRoutingTable(serviceId, status) {
        // In a real system, this would update load balancers, service mesh, etc.
        console.log(`📡 Routing table updated: ${serviceId} → ${status}`);
    }
    
    async reintroduceService(request) {
        const { service_id, force = false } = request;
        
        console.log(`🔄 Reintroducing service: ${service_id}`);
        
        // Check if service is isolated
        const isolationInfo = this.isolatedServices.get(service_id);
        if (!isolationInfo) {
            throw new Error('Service not isolated: ' + service_id);
        }
        
        // Verify service health unless forced
        if (!force) {
            const health = await this.verifyServiceHealth(service_id);
            if (!health.healthy) {
                throw new Error('Service not healthy. Use force=true to override.');
            }
        }
        
        // Execute reintroduction strategy
        const reintroductionResult = await this.executeReintroduction(service_id, isolationInfo);
        
        // Remove from isolated services
        this.isolatedServices.delete(service_id);
        
        // Remove from repair queue
        this.repairQueue = this.repairQueue.filter(r => r.service_id !== service_id);
        
        // Update routing
        this.updateRoutingTable(service_id, 'active');
        
        return {
            service_reintroduced: service_id,
            isolation_duration: Date.now() - isolationInfo.isolated_at.getTime(),
            health_verified: !force,
            dependent_services_notified: reintroductionResult.notified,
            warnings: reintroductionResult.warnings
        };
    }
    
    async verifyServiceHealth(serviceId) {
        const service = this.services.get(serviceId);
        
        try {
            const response = await fetch(service.url + '/health');
            const health = await response.json();
            
            return {
                healthy: response.ok && health.status === 'operational',
                details: health
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }
    
    async executeReintroduction(serviceId, isolationInfo) {
        const result = {
            notified: [],
            warnings: []
        };
        
        // Gradually reintroduce based on strategy
        switch (isolationInfo.isolation_strategy) {
            case 'simple_isolation':
                console.log(`✅ Simple reintroduction of ${serviceId}`);
                break;
                
            case 'graceful_degradation':
                // Notify dependent services to resume normal operation
                for (const dependent of isolationInfo.dependent_services) {
                    try {
                        await this.notifyServiceOfRestoration(dependent, serviceId);
                        result.notified.push(dependent);
                    } catch (error) {
                        result.warnings.push(`Failed to notify ${dependent}: ${error.message}`);
                    }
                }
                break;
                
            case 'cascading_isolation':
                // Carefully restore in correct order
                console.log(`🔄 Cascading restoration for ${serviceId}`);
                // Would implement dependency order restoration
                break;
        }
        
        return result;
    }
    
    async notifyServiceOfRestoration(serviceId, restoredDependency) {
        const service = this.services.get(serviceId);
        if (service && service.url) {
            await fetch(service.url + '/normal-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restored_dependency: restoredDependency,
                    resume_normal: true
                })
            });
        }
    }
    
    initializeCompactorControl() {
        console.log('🎮 Initializing compactor behavior control...');
        
        // Set initial compactor mode based on system health
        this.updateCompactorMode();
        
        // Monitor compactor behavior
        this.on('compactor_run', (data) => {
            this.compactorState.lastRun = new Date();
            this.compactorState.runsToday++;
            
            // Check if compactor is going wild
            if (this.compactorState.runsToday > 10) {
                console.log('⚠️ Compactor running too frequently!');
                this.controlCompactor('pause', 'conservative');
            }
        });
    }
    
    checkCompactorBehavior() {
        // Prevent compactor from running when system health is low
        if (this.systemHealth.overall < this.config.compactorThreshold) {
            if (this.compactorState.enabled) {
                this.compactorState.enabled = false;
                this.compactorState.blockedReason = 'System health below threshold';
                console.log('🛑 Compactor disabled due to low system health');
            }
        } else if (!this.compactorState.enabled && !this.compactorState.blockedReason) {
            // Re-enable if health recovered
            this.compactorState.enabled = true;
            console.log('✅ Compactor re-enabled - system health recovered');
        }
        
        // Reset daily counter at midnight
        const now = new Date();
        if (this.compactorState.lastRun && 
            now.getDate() !== this.compactorState.lastRun.getDate()) {
            this.compactorState.runsToday = 0;
        }
    }
    
    updateCompactorMode() {
        if (this.systemHealth.overall > 0.9) {
            this.compactorState.mode = 'normal';
        } else if (this.systemHealth.overall > 0.7) {
            this.compactorState.mode = 'conservative';
        } else {
            this.compactorState.mode = 'disabled';
            this.compactorState.enabled = false;
        }
    }
    
    controlCompactor(action, mode) {
        const previousState = { ...this.compactorState };
        
        switch (action) {
            case 'enable':
                this.compactorState.enabled = true;
                this.compactorState.blockedReason = null;
                break;
                
            case 'disable':
                this.compactorState.enabled = false;
                this.compactorState.blockedReason = 'Manually disabled';
                break;
                
            case 'pause':
                this.compactorState.enabled = false;
                this.compactorState.blockedReason = 'Temporarily paused';
                setTimeout(() => {
                    if (this.compactorState.blockedReason === 'Temporarily paused') {
                        this.compactorState.enabled = true;
                        this.compactorState.blockedReason = null;
                    }
                }, 300000); // 5 minutes
                break;
                
            case 'reset':
                this.compactorState.runsToday = 0;
                this.compactorState.lastRun = null;
                break;
        }
        
        if (mode) {
            this.compactorState.mode = mode;
        }
        
        return {
            action_taken: action,
            previous_state: previousState,
            current_state: this.compactorState,
            message: `Compactor ${action}d${mode ? ' in ' + mode + ' mode' : ''}`
        };
    }
    
    startRepairQueueProcessor() {
        console.log('🔄 Starting repair queue processor...');
        
        setInterval(async () => {
            if (this.repairQueue.length > 0 && this.activeRepairs.size < this.config.maxConcurrentRepairs) {
                const nextRepair = this.repairQueue.shift();
                if (nextRepair) {
                    await this.processRepair(nextRepair);
                }
            }
        }, 5000); // Check every 5 seconds
    }
    
    async processRepair(repair) {
        const { service_id } = repair;
        
        console.log(`🔧 Processing repair for ${service_id}`);
        
        this.activeRepairs.set(service_id, {
            started_at: new Date(),
            status: 'in_progress'
        });
        
        // Notify Cal about the repair
        try {
            await fetch(this.config.calOptimizerUrl + '/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `Repair needed for ${service_id}`,
                    context: { service_id, isolated: true },
                    urgency: repair.priority === 'high' ? 'high' : 'medium'
                })
            });
        } catch (error) {
            console.error('Failed to notify Cal:', error);
        }
        
        // Simulate repair process
        setTimeout(() => {
            this.activeRepairs.delete(service_id);
            console.log(`✅ Repair completed for ${service_id}`);
        }, 30000); // 30 seconds
    }
    
    async emergencyStop() {
        console.log('🚨 EMERGENCY STOP INITIATED!');
        
        // Disable compactor immediately
        this.compactorState.enabled = false;
        this.compactorState.blockedReason = 'Emergency stop';
        
        // Pause all repairs
        this.repairQueue = [];
        this.activeRepairs.clear();
        
        // Notify all services
        const notifications = [];
        for (const [serviceId, service] of this.services) {
            if (!this.isolatedServices.has(serviceId)) {
                notifications.push(this.notifyEmergencyStop(serviceId, service));
            }
        }
        
        await Promise.allSettled(notifications);
        
        return {
            emergency_stop: true,
            compactor_disabled: true,
            repairs_halted: true,
            services_notified: notifications.length,
            timestamp: new Date()
        };
    }
    
    async notifyEmergencyStop(serviceId, service) {
        try {
            await fetch(service.url + '/emergency-stop', {
                method: 'POST',
                timeout: 2000
            });
        } catch (error) {
            // Best effort notification
        }
    }
    
    notifyCal(serviceId, reason) {
        // In real implementation, would send to Cal Runtime Optimizer
        console.log(`\n📟 PAGING CAL: Service ${serviceId} needs attention!`);
        console.log(`   Reason: ${reason}`);
        
        // Cal's sarcastic response
        this.calPersonality.blameCount++;
        this.calPersonality.coffeeLevel = Math.max(0, this.calPersonality.coffeeLevel - 10);
        
        const calResponse = this.getCalResponse('critical_failure');
        console.log(`   Cal: "${calResponse}"`);
        
        // Update Cal's mood
        this.updateCalMood();
    }
    
    makeCalComment(event, details) {
        const comment = this.getCalResponse(event);
        console.log(`💭 Cal: ${comment}`);
        this.calPersonality.lastComment = comment;
        
        // Increase sarcasm with each comment
        this.calPersonality.sarcasmLevel = Math.min(10, this.calPersonality.sarcasmLevel + 0.1);
    }
    
    getCalResponse(event) {
        const responses = {
            isolation: [
                "Oh great, another service to babysit",
                "Let me guess... it worked fine yesterday?",
                "Isolating services is my favorite hobby",
                "This is why we can't have nice things"
            ],
            critical_failure: [
                "Of course it's broken. Everything is always broken.",
                "Critical? Everything is critical when it breaks",
                "I'm sure this has nothing to do with the last deploy",
                "Have I mentioned it's always DNS?"
            ],
            repair_success: [
                "Don't get used to it working",
                "Give it 5 minutes...",
                "I'm as surprised as you are",
                "Quick, take a screenshot!"
            ],
            health_check: [
                "Checking if things are still on fire",
                "Let's see what's broken today",
                "Health check? More like death check",
                "Schrodinger's services - both alive and dead"
            ]
        };
        
        const eventResponses = responses[event] || this.calPersonality.comments;
        return eventResponses[Math.floor(Math.random() * eventResponses.length)];
    }
    
    updateCalMood() {
        const blame = this.calPersonality.blameCount;
        const coffee = this.calPersonality.coffeeLevel;
        
        if (blame > 20 || coffee < 10) {
            this.calPersonality.mood = 'existential crisis';
        } else if (blame > 10 || coffee < 30) {
            this.calPersonality.mood = 'very cranky';
        } else if (blame > 5 || coffee < 50) {
            this.calPersonality.mood = 'mildly annoyed';
        } else {
            this.calPersonality.mood = 'cautiously optimistic';
        }
    }
    
    generateDashboard() {
        const isolatedCount = this.isolatedServices.size;
        const healthyCount = Array.from(this.systemHealth.services.values())
            .filter(s => s.healthy).length;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🔧 Isolation & Repair Controller</title>
    <style>
        body {
            background: #1a1a2e;
            color: #eee;
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            background: #16213e;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .title {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .health-bar {
            width: 100%;
            height: 30px;
            background: #333;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }
        .health-fill {
            height: 100%;
            background: ${this.systemHealth.overall > 0.7 ? '#4caf50' : this.systemHealth.overall > 0.4 ? '#ff9800' : '#f44336'};
            width: ${this.systemHealth.overall * 100}%;
            transition: width 0.5s;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            color: #0f4c75;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .service-card {
            background: #16213e;
            padding: 15px;
            border-radius: 8px;
            border-left: 5px solid #333;
        }
        .healthy { border-left-color: #4caf50; }
        .unhealthy { border-left-color: #ff9800; }
        .unreachable { border-left-color: #f44336; }
        .isolated { border-left-color: #9c27b0; }
        .compactor-status {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .compactor-enabled { color: #4caf50; }
        .compactor-disabled { color: #f44336; }
        button {
            background: #0f4c75;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #1e5f8e;
        }
        .repair-queue {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
        }
        .queue-item {
            background: #1a1a2e;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
        }
    </style>
    <script>
        // Auto-refresh
        setTimeout(() => location.reload(), 5000);
        
        async function controlCompactor(action, mode) {
            await fetch('/compactor/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, mode })
            });
            location.reload();
        }
        
        async function emergencyStop() {
            if (confirm('Are you sure? This will halt all operations!')) {
                await fetch('/emergency/stop', { method: 'POST' });
                alert('Emergency stop initiated!');
                location.reload();
            }
        }
    </script>
</head>
<body>
    <div class="header">
        <div class="title">🔧 Isolation & Repair Controller</div>
        <div>Safe service isolation and repair management</div>
    </div>
    
    <div>
        <div>System Health: ${(this.systemHealth.overall * 100).toFixed(1)}%</div>
        <div class="health-bar">
            <div class="health-fill"></div>
        </div>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div>Total Services</div>
            <div class="stat-value">${this.services.size}</div>
        </div>
        <div class="stat-card">
            <div>Healthy</div>
            <div class="stat-value">${healthyCount}</div>
        </div>
        <div class="stat-card">
            <div>Isolated</div>
            <div class="stat-value">${isolatedCount}</div>
        </div>
        <div class="stat-card">
            <div>In Repair</div>
            <div class="stat-value">${this.activeRepairs.size}</div>
        </div>
    </div>
    
    <div class="compactor-status">
        <h3>🎮 Compactor Control</h3>
        <div>
            Status: <span class="${this.compactorState.enabled ? 'compactor-enabled' : 'compactor-disabled'}">
                ${this.compactorState.enabled ? 'ENABLED' : 'DISABLED'}
            </span>
        </div>
        <div>Mode: ${this.compactorState.mode}</div>
        <div>Runs Today: ${this.compactorState.runsToday}</div>
        ${this.compactorState.blockedReason ? '<div>Blocked: ' + this.compactorState.blockedReason + '</div>' : ''}
        <div style="margin-top: 10px;">
            <button onclick="controlCompactor('enable')">Enable</button>
            <button onclick="controlCompactor('disable')">Disable</button>
            <button onclick="controlCompactor('pause')">Pause 5min</button>
            <button onclick="controlCompactor('reset')">Reset Counter</button>
        </div>
    </div>
    
    <h3>🔗 Service Status</h3>
    <div class="services-grid">
        ${Array.from(this.services).map(([id, service]) => {
            const health = this.systemHealth.services.get(id);
            const isolated = this.isolatedServices.has(id);
            const statusClass = isolated ? 'isolated' : (health?.status || 'unknown');
            
            return `
                <div class="service-card ${statusClass}">
                    <strong>${service.name}</strong><br>
                    Status: ${isolated ? 'ISOLATED' : (health?.status || 'unknown').toUpperCase()}<br>
                    Critical: ${service.critical ? 'Yes' : 'No'}<br>
                    Can Isolate: ${service.canIsolate ? 'Yes' : 'No'}
                </div>
            `;
        }).join('')}
    </div>
    
    <div class="repair-queue">
        <h3>🔧 Repair Queue</h3>
        ${this.repairQueue.length === 0 ? 
            '<div class="queue-item">No services awaiting repair</div>' :
            this.repairQueue.map(item => `
                <div class="queue-item">
                    ${item.service_id} - Priority: ${item.priority}
                </div>
            `).join('')
        }
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <button onclick="emergencyStop()" style="background: #f44336;">
            🚨 EMERGENCY STOP
        </button>
    </div>
    
    <div style="margin-top: 20px; text-align: center; opacity: 0.7;">
        <small>Dashboard refreshes every 5 seconds</small>
    </div>
</body>
</html>`;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('\n🔧 ISOLATION & REPAIR CONTROLLER STARTED!');
            console.log('====================================');
            console.log('🌐 Dashboard: http://localhost:' + this.port);
            console.log('📡 API Endpoints:');
            console.log('   POST /isolate - Isolate service for repair');
            console.log('   POST /reintroduce - Bring service back online');
            console.log('   GET  /status - Current isolation status');
            console.log('   POST /compactor/control - Control compactor behavior');
            console.log('   POST /emergency/stop - Emergency halt');
            console.log('');
            console.log('🛡️ Protecting system integrity during repairs');
        });
    }
}

// Start the controller
const controller = new IsolationRepairController();
controller.start();

module.exports = IsolationRepairController;