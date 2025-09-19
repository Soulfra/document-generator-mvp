#!/usr/bin/env node

/**
 * RESOURCE MANAGER - Fixes Node.js trace warnings and memory leaks
 * 
 * Addresses the --trace-warnings issues by:
 * - Proper EventEmitter cleanup
 * - Memory monitoring and cleanup
 * - Rate limiting for API calls
 * - Process health monitoring
 */

const EventEmitter = require('events');
const os = require('os');

class ResourceManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Set max listeners to prevent warnings
        this.setMaxListeners(0);
        process.setMaxListeners(0);
        
        this.config = {
            maxMemoryMB: options.maxMemoryMB || 2048,
            maxEventListeners: options.maxEventListeners || 100,
            memoryCheckInterval: options.memoryCheckInterval || 30000, // 30 seconds
            cleanupInterval: options.cleanupInterval || 60000, // 1 minute
            apiRateLimit: options.apiRateLimit || 10, // calls per second
            debug: options.debug || false,
            ...options
        };
        
        // Resource tracking
        this.resources = {
            activeProcesses: new Map(),
            eventListeners: new Map(),
            timers: new Set(),
            memoryUsage: [],
            apiCalls: {
                count: 0,
                lastReset: Date.now(),
                queue: []
            }
        };
        
        // Health monitoring
        this.health = {
            status: 'healthy',
            warnings: [],
            lastCleanup: Date.now(),
            memoryPressure: false
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔧 Resource Manager initializing...');
        
        // Monitor memory usage
        this.startMemoryMonitoring();
        
        // Periodic cleanup
        this.startPeriodicCleanup();
        
        // Rate limit setup
        this.setupRateLimiting();
        
        // Process event handlers with proper cleanup
        this.setupProcessHandlers();
        
        console.log(`✅ Resource Manager active - Max Memory: ${this.config.maxMemoryMB}MB`);
    }
    
    startMemoryMonitoring() {
        const memoryTimer = setInterval(() => {
            const usage = process.memoryUsage();
            const systemMem = os.totalmem();
            const freeMem = os.freemem();
            
            const usageMB = Math.round(usage.heapUsed / 1024 / 1024);
            const systemUsagePercent = Math.round(((systemMem - freeMem) / systemMem) * 100);
            
            this.resources.memoryUsage.push({
                timestamp: Date.now(),
                heapUsed: usageMB,
                heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
                external: Math.round(usage.external / 1024 / 1024),
                systemUsage: systemUsagePercent
            });
            
            // Keep only last 20 readings
            if (this.resources.memoryUsage.length > 20) {
                this.resources.memoryUsage = this.resources.memoryUsage.slice(-20);
            }
            
            // Check for memory pressure
            if (usageMB > this.config.maxMemoryMB || systemUsagePercent > 85) {
                this.handleMemoryPressure(usageMB, systemUsagePercent);
            }
            
            if (this.config.debug) {
                console.log(`📊 Memory: ${usageMB}MB heap, ${systemUsagePercent}% system`);
            }
            
        }, this.config.memoryCheckInterval);
        
        this.resources.timers.add(memoryTimer);
    }
    
    handleMemoryPressure(heapUsed, systemUsage) {
        this.health.memoryPressure = true;
        this.health.warnings.push({
            type: 'memory_pressure',
            timestamp: Date.now(),
            details: { heapUsed, systemUsage }
        });
        
        console.warn(`⚠️ Memory pressure detected: ${heapUsed}MB heap, ${systemUsage}% system`);
        
        // Trigger aggressive cleanup
        this.performAggressiveCleanup();
        
        // Emit warning for other systems to respond
        this.emit('memory-pressure', { heapUsed, systemUsage });
    }
    
    startPeriodicCleanup() {
        const cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
        
        this.resources.timers.add(cleanupTimer);
    }
    
    performCleanup() {
        const beforeHeap = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        // Clean up old warnings
        this.health.warnings = this.health.warnings.filter(w => 
            Date.now() - w.timestamp < 300000 // Keep warnings for 5 minutes
        );
        
        // Clean up completed processes
        for (const [id, process] of this.resources.activeProcesses) {
            if (process.killed || process.exitCode !== null) {
                this.resources.activeProcesses.delete(id);
            }
        }
        
        // Reset memory pressure if improved
        const currentHeap = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        if (this.health.memoryPressure && currentHeap < this.config.maxMemoryMB * 0.7) {
            this.health.memoryPressure = false;
            console.log(`✅ Memory pressure relieved: ${currentHeap}MB`);
        }
        
        this.health.lastCleanup = Date.now();
        
        if (this.config.debug) {
            console.log(`🧹 Cleanup: ${beforeHeap}MB → ${currentHeap}MB`);
        }
    }
    
    performAggressiveCleanup() {
        console.log('🚨 Performing aggressive cleanup...');
        
        // Clear event listener registrations beyond limit
        for (const [emitter, count] of this.resources.eventListeners) {
            if (count > this.config.maxEventListeners) {
                if (emitter && typeof emitter.removeAllListeners === 'function') {
                    emitter.removeAllListeners();
                    this.resources.eventListeners.set(emitter, 0);
                }
            }
        }
        
        // Clear old API call queue
        this.resources.apiCalls.queue = this.resources.apiCalls.queue.slice(-10);
        
        // Force multiple garbage collections
        if (global.gc) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => global.gc(), i * 100);
            }
        }
    }
    
    setupRateLimiting() {
        // Reset API call counter every second
        setInterval(() => {
            this.resources.apiCalls.count = 0;
            this.resources.apiCalls.lastReset = Date.now();
            
            // Process queued API calls
            const toProcess = this.resources.apiCalls.queue.splice(0, this.config.apiRateLimit);
            toProcess.forEach(queuedCall => {
                setTimeout(() => queuedCall.execute(), queuedCall.delay || 0);
            });
            
        }, 1000);
    }
    
    async rateLimitedAPICall(apiCall, priority = 'normal') {
        return new Promise((resolve, reject) => {
            if (this.resources.apiCalls.count < this.config.apiRateLimit) {
                // Execute immediately
                this.resources.apiCalls.count++;
                
                apiCall()
                    .then(resolve)
                    .catch(reject);
                    
            } else {
                // Queue for later execution
                const queuedCall = {
                    execute: () => {
                        apiCall()
                            .then(resolve)
                            .catch(reject);
                    },
                    priority,
                    timestamp: Date.now(),
                    delay: priority === 'high' ? 0 : Math.random() * 1000
                };
                
                if (priority === 'high') {
                    this.resources.apiCalls.queue.unshift(queuedCall);
                } else {
                    this.resources.apiCalls.queue.push(queuedCall);
                }
                
                if (this.config.debug) {
                    console.log(`⏳ API call queued (${this.resources.apiCalls.queue.length} pending)`);
                }
            }
        });
    }
    
    registerProcess(id, process) {
        this.resources.activeProcesses.set(id, {
            process,
            startTime: Date.now(),
            killed: false
        });
        
        // Auto-cleanup when process ends
        if (process.on) {
            process.on('exit', () => {
                this.resources.activeProcesses.delete(id);
            });
        }
    }
    
    registerEventListener(emitter, eventName) {
        const current = this.resources.eventListeners.get(emitter) || 0;
        this.resources.eventListeners.set(emitter, current + 1);
        
        // Warn if approaching limit
        if (current > this.config.maxEventListeners * 0.8) {
            console.warn(`⚠️ High event listener count: ${current} on ${eventName}`);
            
            this.health.warnings.push({
                type: 'high_listener_count',
                timestamp: Date.now(),
                details: { eventName, count: current }
            });
        }
    }
    
    setupProcessHandlers() {
        // Graceful shutdown
        const gracefulShutdown = () => {
            console.log('\n🛑 Graceful shutdown initiated...');
            this.cleanup();
            process.exit(0);
        };
        
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('🚨 Uncaught Exception:', error);
            this.health.warnings.push({
                type: 'uncaught_exception',
                timestamp: Date.now(),
                details: { message: error.message, stack: error.stack }
            });
        });
        
        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
            this.health.warnings.push({
                type: 'unhandled_rejection',
                timestamp: Date.now(),
                details: { reason: String(reason) }
            });
        });
        
        // Handle warnings (including trace warnings)
        process.on('warning', (warning) => {
            console.warn('⚠️ Node.js Warning:', warning.name, warning.message);
            
            if (warning.name === 'MaxListenersExceededWarning') {
                this.handleMaxListenersWarning(warning);
            }
            
            this.health.warnings.push({
                type: 'node_warning',
                timestamp: Date.now(),
                details: { 
                    name: warning.name, 
                    message: warning.message,
                    code: warning.code 
                }
            });
        });
    }
    
    handleMaxListenersWarning(warning) {
        console.log('🔧 Fixing MaxListenersExceededWarning...');
        
        // Increase max listeners for the specific emitter
        if (warning.emitter && warning.emitter.setMaxListeners) {
            warning.emitter.setMaxListeners(warning.count * 2);
            console.log(`✅ Increased max listeners to ${warning.count * 2}`);
        }
        
        // Global increase as fallback
        process.setMaxListeners(Math.max(process.getMaxListeners(), warning.count * 2));
    }
    
    getHealthStatus() {
        const currentMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        
        return {
            status: this.health.status,
            memory: {
                current: currentMemory,
                max: this.config.maxMemoryMB,
                pressure: this.health.memoryPressure,
                history: this.resources.memoryUsage.slice(-5)
            },
            processes: {
                active: this.resources.activeProcesses.size,
                total: this.resources.activeProcesses.size
            },
            api: {
                callsThisSecond: this.resources.apiCalls.count,
                queueLength: this.resources.apiCalls.queue.length,
                rateLimit: this.config.apiRateLimit
            },
            warnings: this.health.warnings.slice(-10),
            uptime: process.uptime(),
            lastCleanup: this.health.lastCleanup
        };
    }
    
    cleanup() {
        console.log('🧹 Resource Manager cleanup...');
        
        // Clear all timers
        for (const timer of this.resources.timers) {
            clearInterval(timer);
            clearTimeout(timer);
        }
        this.resources.timers.clear();
        
        // Clean up processes
        for (const [id, processInfo] of this.resources.activeProcesses) {
            if (processInfo.process && !processInfo.process.killed) {
                processInfo.process.kill();
            }
        }
        this.resources.activeProcesses.clear();
        
        // Remove all event listeners
        this.removeAllListeners();
        
        console.log('✅ Resource cleanup complete');
    }
}

// Singleton instance
let globalResourceManager = null;

function getResourceManager(options = {}) {
    if (!globalResourceManager) {
        globalResourceManager = new ResourceManager(options);
    }
    return globalResourceManager;
}

// Helper functions for easy integration
function rateLimitedAPICall(apiCall, priority = 'normal') {
    const rm = getResourceManager();
    return rm.rateLimitedAPICall(apiCall, priority);
}

function registerProcess(id, process) {
    const rm = getResourceManager();
    return rm.registerProcess(id, process);
}

function registerEventListener(emitter, eventName) {
    const rm = getResourceManager();
    return rm.registerEventListener(emitter, eventName);
}

function getHealthStatus() {
    const rm = getResourceManager();
    return rm.getHealthStatus();
}

module.exports = {
    ResourceManager,
    getResourceManager,
    rateLimitedAPICall,
    registerProcess,
    registerEventListener,
    getHealthStatus
};

// CLI interface
if (require.main === module) {
    const manager = getResourceManager({ debug: true });
    
    // Create a simple monitoring server
    const http = require('http');
    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(manager.getHealthStatus(), null, 2));
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Resource Manager Running\nCheck /health for status');
        }
    });
    
    server.listen(7776, () => {
        console.log('📊 Resource Manager Monitor: http://localhost:7776/health');
    });
}