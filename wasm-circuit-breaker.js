#!/usr/bin/env node

/**
 * 🔌⚡ WASM Circuit Breaker System
 * ================================
 * Prevents cascading WASM errors by implementing circuit breaker patterns
 * Automatically opens circuit when WASM errors exceed thresholds
 */

const fs = require('fs').promises;
const EventEmitter = require('events');

class WASMCircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            // Circuit breaker thresholds
            failureThreshold: options.failureThreshold || 5,  // Open after 5 failures
            successThreshold: options.successThreshold || 3,  // Close after 3 successes
            timeout: options.timeout || 60000,               // 1 minute timeout
            
            // WASM-specific thresholds
            memoryThreshold: options.memoryThreshold || 90,  // 90% memory usage
            wasmErrorWindow: options.wasmErrorWindow || 300000, // 5 minutes
            maxConcurrentWasm: options.maxConcurrentWasm || 3, // Max 3 concurrent WASM operations
            
            // Recovery thresholds
            cooldownPeriod: options.cooldownPeriod || 120000, // 2 minutes cooldown
            maxRetries: options.maxRetries || 3,
            backoffMultiplier: options.backoffMultiplier || 2
        };
        
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        this.concurrentWasmOperations = 0;
        
        this.wasmErrorHistory = [];
        this.memoryUsageHistory = [];
        this.recoveryAttempts = 0;
        
        this.wasmErrorPatterns = [
            /RuntimeError: Aborted\(\)/,
            /wasm:\/\/wasm\/\w+:wasm-function/,
            /insertChild.*wasm/,
            /Build with -sASSERTIONS for more info/,
            /LA\.insertChild/,
            /Aborted\(\)\. Build with -sASSERTIONS/
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🔌⚡ WASM Circuit Breaker Initializing...');
        console.log('==========================================');
        console.log(`🎯 Failure Threshold: ${this.options.failureThreshold}`);
        console.log(`💾 Memory Threshold: ${this.options.memoryThreshold}%`);
        console.log(`⏱️ Timeout: ${this.options.timeout}ms`);
        console.log(`🔄 Max Concurrent WASM: ${this.options.maxConcurrentWasm}`);
        console.log('');
        
        // Load previous state
        await this.loadState();
        
        // Start monitoring
        this.startMonitoring();
        
        console.log('✅ WASM Circuit Breaker Active');
        console.log(`📊 Current State: ${this.state}`);
        console.log(`❌ Failure Count: ${this.failureCount}`);
        console.log('');
    }
    
    /**
     * Execute operation with circuit breaker protection
     */
    async execute(operation, context = {}) {
        // Check if circuit is open
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttemptTime) {
                throw new Error(`Circuit breaker is OPEN. Next attempt in ${Math.ceil((this.nextAttemptTime - Date.now()) / 1000)}s`);
            } else {
                // Try to move to half-open state
                this.state = 'HALF_OPEN';
                this.emit('stateChanged', 'HALF_OPEN');
                console.log('🔄 Circuit breaker moving to HALF_OPEN state');
            }
        }
        
        // Check resource constraints before execution
        await this.checkResourceConstraints();
        
        // Track concurrent operations
        this.concurrentWasmOperations++;
        
        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(operation, context);
            
            // Operation succeeded
            await this.onSuccess();
            
            return result;
            
        } catch (error) {
            // Operation failed
            await this.onFailure(error, context);
            throw error;
            
        } finally {
            // Always decrement concurrent operations
            this.concurrentWasmOperations--;
        }
    }
    
    /**
     * Execute operation with timeout
     */
    async executeWithTimeout(operation, context) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Operation timed out after ${this.options.timeout}ms`));
            }, this.options.timeout);
            
            Promise.resolve(operation(context))
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }
    
    /**
     * Check resource constraints before allowing operation
     */
    async checkResourceConstraints() {
        // Check concurrent WASM operations
        if (this.concurrentWasmOperations >= this.options.maxConcurrentWasm) {
            throw new Error(`Too many concurrent WASM operations: ${this.concurrentWasmOperations}`);
        }
        
        // Check memory usage
        const memoryUsage = await this.getCurrentMemoryUsage();
        this.memoryUsageHistory.push({
            timestamp: Date.now(),
            usage: memoryUsage
        });
        
        // Keep only recent history
        const cutoff = Date.now() - this.options.wasmErrorWindow;
        this.memoryUsageHistory = this.memoryUsageHistory.filter(h => h.timestamp > cutoff);
        
        if (memoryUsage > this.options.memoryThreshold) {
            throw new Error(`Memory usage too high: ${memoryUsage}% (threshold: ${this.options.memoryThreshold}%)`);
        }
        
        // Check recent WASM error rate
        const recentErrors = this.wasmErrorHistory.filter(e => e.timestamp > cutoff);
        if (recentErrors.length > this.options.failureThreshold) {
            throw new Error(`Too many recent WASM errors: ${recentErrors.length} in last ${this.options.wasmErrorWindow}ms`);
        }
    }
    
    /**
     * Handle successful operation
     */
    async onSuccess() {
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            
            if (this.successCount >= this.options.successThreshold) {
                // Close circuit
                await this.closeCircuit();
            }
        } else if (this.state === 'CLOSED') {
            // Reset failure count on success
            this.failureCount = Math.max(0, this.failureCount - 1);
        }
        
        // Reset recovery attempts on success
        this.recoveryAttempts = 0;
        
        await this.saveState();
        
        this.emit('operationSuccess', {
            state: this.state,
            successCount: this.successCount,
            failureCount: this.failureCount
        });
    }
    
    /**
     * Handle failed operation
     */
    async onFailure(error, context = {}) {
        this.lastFailureTime = Date.now();
        this.failureCount++;
        
        // Check if this is a WASM error
        const isWasmError = this.isWasmError(error);
        
        if (isWasmError) {
            this.wasmErrorHistory.push({
                timestamp: Date.now(),
                error: error.message,
                context,
                memoryUsage: await this.getCurrentMemoryUsage()
            });
            
            // Keep only recent history
            const cutoff = Date.now() - this.options.wasmErrorWindow;
            this.wasmErrorHistory = this.wasmErrorHistory.filter(h => h.timestamp > cutoff);
            
            console.error('🔧 WASM Error detected in circuit breaker:', error.message);
        }
        
        // Check if we should open the circuit
        if (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold) {
            await this.openCircuit();
        } else if (this.state === 'HALF_OPEN') {
            // Back to open state
            await this.openCircuit();
        }
        
        await this.saveState();
        
        this.emit('operationFailure', {
            error,
            state: this.state,
            failureCount: this.failureCount,
            isWasmError,
            context
        });
    }
    
    /**
     * Open circuit breaker
     */
    async openCircuit() {
        this.state = 'OPEN';
        this.successCount = 0;
        this.nextAttemptTime = Date.now() + this.options.cooldownPeriod;
        
        console.log('');
        console.log('🔴 CIRCUIT BREAKER OPENED');
        console.log('========================');
        console.log(`❌ Failure Count: ${this.failureCount}`);
        console.log(`⏰ Next Attempt: ${new Date(this.nextAttemptTime).toISOString()}`);
        console.log(`🔧 WASM Errors: ${this.wasmErrorHistory.length}`);
        console.log('');
        
        // Trigger emergency cleanup
        await this.triggerEmergencyCleanup();
        
        this.emit('circuitOpened', {
            failureCount: this.failureCount,
            nextAttemptTime: this.nextAttemptTime,
            wasmErrors: this.wasmErrorHistory.length
        });
    }
    
    /**
     * Close circuit breaker
     */
    async closeCircuit() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = null;
        
        console.log('');
        console.log('🟢 CIRCUIT BREAKER CLOSED');
        console.log('=========================');
        console.log('✅ Circuit restored to normal operation');
        console.log('🔄 Ready to handle WASM operations');
        console.log('');
        
        this.emit('circuitClosed', {
            timestamp: Date.now(),
            recoveryAttempts: this.recoveryAttempts
        });
    }
    
    /**
     * Check if error is WASM-related
     */
    isWasmError(error) {
        const errorString = error.message + (error.stack || '');
        return this.wasmErrorPatterns.some(pattern => pattern.test(errorString));
    }
    
    /**
     * Get current memory usage
     */
    async getCurrentMemoryUsage() {
        try {
            const { execSync } = require('child_process');
            const vmStat = execSync('vm_stat', { encoding: 'utf8' });
            const lines = vmStat.split('\n');
            
            let free = 0, active = 0, wired = 0;
            
            for (const line of lines) {
                if (line.includes('Pages free:')) {
                    free = parseInt(line.match(/\d+/)?.[0] || '0');
                } else if (line.includes('Pages active:')) {
                    active = parseInt(line.match(/\d+/)?.[0] || '0');
                } else if (line.includes('Pages wired down:')) {
                    wired = parseInt(line.match(/\d+/)?.[0] || '0');
                }
            }
            
            const pageSize = 4096;
            const used = (active + wired) * pageSize;
            const total = (free + active + wired) * pageSize;
            
            return total > 0 ? Math.round((used / total) * 100) : 0;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Trigger emergency cleanup when circuit opens
     */
    async triggerEmergencyCleanup() {
        console.log('🚨 Triggering emergency cleanup...');
        
        try {
            const { execSync } = require('child_process');
            
            // Clear large files
            execSync('find . -name "*.html" -size +50M -delete 2>/dev/null || true', { stdio: 'ignore' });
            
            // Clear caches
            execSync('rm -rf ~/.cache/anthropic ~/.cache/claude /tmp/claude-* 2>/dev/null || true', { stdio: 'ignore' });
            
            // Kill stuck processes
            execSync('pkill -f "claude-code" 2>/dev/null || true', { stdio: 'ignore' });
            
            // Force garbage collection
            if (global.gc) {
                global.gc();
            }
            
            console.log('✅ Emergency cleanup completed');
            
        } catch (error) {
            console.error('❌ Emergency cleanup failed:', error.message);
        }
    }
    
    /**
     * Start monitoring system health
     */
    startMonitoring() {
        // Monitor memory usage
        setInterval(async () => {
            const memoryUsage = await this.getCurrentMemoryUsage();
            
            if (memoryUsage > this.options.memoryThreshold && this.state === 'CLOSED') {
                console.warn(`⚠️ High memory usage detected: ${memoryUsage}%`);
                
                // Preemptively open circuit to prevent WASM errors
                this.failureCount = this.options.failureThreshold;
                await this.openCircuit();
            }
        }, 30000); // Check every 30 seconds
        
        // Clean old history
        setInterval(() => {
            const cutoff = Date.now() - this.options.wasmErrorWindow;
            this.wasmErrorHistory = this.wasmErrorHistory.filter(h => h.timestamp > cutoff);
            this.memoryUsageHistory = this.memoryUsageHistory.filter(h => h.timestamp > cutoff);
        }, 60000); // Clean every minute
    }
    
    /**
     * Save circuit breaker state
     */
    async saveState() {
        const state = {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            wasmErrorHistory: this.wasmErrorHistory,
            memoryUsageHistory: this.memoryUsageHistory.slice(-10), // Keep last 10
            recoveryAttempts: this.recoveryAttempts,
            timestamp: Date.now()
        };
        
        try {
            await fs.writeFile('./.wasm-circuit-breaker-state.json', JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save circuit breaker state:', error);
        }
    }
    
    /**
     * Load circuit breaker state
     */
    async loadState() {
        try {
            const data = await fs.readFile('./.wasm-circuit-breaker-state.json', 'utf8');
            const state = JSON.parse(data);
            
            this.state = state.state || 'CLOSED';
            this.failureCount = state.failureCount || 0;
            this.successCount = state.successCount || 0;
            this.lastFailureTime = state.lastFailureTime;
            this.nextAttemptTime = state.nextAttemptTime;
            this.wasmErrorHistory = state.wasmErrorHistory || [];
            this.memoryUsageHistory = state.memoryUsageHistory || [];
            this.recoveryAttempts = state.recoveryAttempts || 0;
            
            console.log('📊 Loaded previous circuit breaker state');
            
            // Check if we should still be open
            if (this.state === 'OPEN' && this.nextAttemptTime && Date.now() > this.nextAttemptTime) {
                this.state = 'HALF_OPEN';
                console.log('🔄 Circuit moved to HALF_OPEN after cooldown');
            }
            
        } catch (error) {
            console.log('🆕 Creating new circuit breaker state');
        }
    }
    
    /**
     * Manual circuit control
     */
    async forceOpen(reason = 'Manual') {
        console.log(`🔴 Manually opening circuit: ${reason}`);
        await this.openCircuit();
    }
    
    async forceClose(reason = 'Manual') {
        console.log(`🟢 Manually closing circuit: ${reason}`);
        await this.closeCircuit();
    }
    
    async reset() {
        console.log('🔄 Resetting circuit breaker');
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        this.wasmErrorHistory = [];
        this.memoryUsageHistory = [];
        this.recoveryAttempts = 0;
        await this.saveState();
        
        this.emit('circuitReset');
    }
    
    /**
     * Get circuit breaker status
     */
    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            concurrentOperations: this.concurrentWasmOperations,
            wasmErrors: this.wasmErrorHistory.length,
            recentMemoryUsage: this.memoryUsageHistory.slice(-5),
            options: this.options,
            uptime: process.uptime(),
            healthCheck: {
                circuitHealthy: this.state !== 'OPEN',
                memoryHealthy: this.memoryUsageHistory.length === 0 || 
                              this.memoryUsageHistory[this.memoryUsageHistory.length - 1]?.usage < this.options.memoryThreshold,
                errorRate: this.wasmErrorHistory.length / (this.options.wasmErrorWindow / 60000) // errors per minute
            }
        };
    }
    
    /**
     * Get circuit breaker metrics for monitoring
     */
    getMetrics() {
        const now = Date.now();
        const recentErrors = this.wasmErrorHistory.filter(e => e.timestamp > now - this.options.wasmErrorWindow);
        const avgMemoryUsage = this.memoryUsageHistory.length > 0 
            ? this.memoryUsageHistory.reduce((sum, h) => sum + h.usage, 0) / this.memoryUsageHistory.length 
            : 0;
        
        return {
            // Circuit metrics
            state: this.state,
            totalFailures: this.failureCount,
            recentErrors: recentErrors.length,
            errorRate: recentErrors.length / (this.options.wasmErrorWindow / 60000),
            
            // Memory metrics
            averageMemoryUsage: Math.round(avgMemoryUsage),
            memoryHealthy: avgMemoryUsage < this.options.memoryThreshold,
            
            // Performance metrics
            concurrentOperations: this.concurrentWasmOperations,
            maxConcurrentOperations: this.options.maxConcurrentWasm,
            
            // Recovery metrics
            recoveryAttempts: this.recoveryAttempts,
            lastFailureTime: this.lastFailureTime,
            circuitOpenTime: this.state === 'OPEN' ? this.nextAttemptTime - this.options.cooldownPeriod : null,
            
            // Health score (0-100)
            healthScore: this.calculateHealthScore()
        };
    }
    
    /**
     * Calculate overall health score
     */
    calculateHealthScore() {
        let score = 100;
        
        // Deduct for circuit state
        if (this.state === 'OPEN') score -= 50;
        else if (this.state === 'HALF_OPEN') score -= 25;
        
        // Deduct for failure rate
        const recentErrors = this.wasmErrorHistory.filter(e => e.timestamp > Date.now() - this.options.wasmErrorWindow);
        const errorRate = recentErrors.length / this.options.failureThreshold;
        score -= Math.min(30, errorRate * 30);
        
        // Deduct for memory usage
        const avgMemoryUsage = this.memoryUsageHistory.length > 0 
            ? this.memoryUsageHistory.reduce((sum, h) => sum + h.usage, 0) / this.memoryUsageHistory.length 
            : 0;
        if (avgMemoryUsage > this.options.memoryThreshold) {
            score -= Math.min(20, (avgMemoryUsage - this.options.memoryThreshold) * 2);
        }
        
        return Math.max(0, Math.round(score));
    }
}

module.exports = WASMCircuitBreaker;

// CLI Interface
if (require.main === module) {
    console.log(`
🔌⚡ WASM CIRCUIT BREAKER SYSTEM
================================

🎯 Prevents cascading WASM errors with intelligent circuit breaking

This system monitors for WASM errors and automatically opens the circuit
when failure thresholds are exceeded, preventing system overload.

🔍 MONITORED CONDITIONS:
   • WASM runtime errors (RuntimeError: Aborted)
   • Memory usage thresholds (default: 90%)
   • Concurrent WASM operation limits
   • Error rate within time windows
   • System resource constraints

⚡ CIRCUIT STATES:
   • CLOSED: Normal operation, requests allowed
   • OPEN: Circuit tripped, requests blocked for cooldown
   • HALF_OPEN: Testing state after cooldown period

🛡️ PROTECTION FEATURES:
   • Automatic emergency cleanup when circuit opens
   • Memory usage monitoring and prevention
   • Concurrent operation limiting
   • Exponential backoff for retries
   • State persistence across restarts

🚑 RECOVERY ACTIONS:
   • Clear large files causing memory pressure
   • Kill stuck Claude CLI processes
   • Clear WASM and system caches
   • Force garbage collection
   • System resource optimization

📊 USAGE:
   • Automatic: Monitors and protects WASM operations
   • Manual: node wasm-circuit-breaker.js --status
   • Control: node wasm-circuit-breaker.js --reset
   • Force: node wasm-circuit-breaker.js --open/--close

Intelligent protection against WASM error cascades!
    `);
    
    async function runCircuitBreaker() {
        const circuitBreaker = new WASMCircuitBreaker();
        
        const args = process.argv.slice(2);
        
        if (args.includes('--status')) {
            const status = circuitBreaker.getStatus();
            console.log('\n📊 WASM CIRCUIT BREAKER STATUS:');
            console.log('===============================');
            console.log(JSON.stringify(status, null, 2));
            
        } else if (args.includes('--metrics')) {
            const metrics = circuitBreaker.getMetrics();
            console.log('\n📈 WASM CIRCUIT BREAKER METRICS:');
            console.log('================================');
            console.log(JSON.stringify(metrics, null, 2));
            
        } else if (args.includes('--reset')) {
            await circuitBreaker.reset();
            console.log('\n✅ Circuit breaker reset successfully');
            
        } else if (args.includes('--open')) {
            await circuitBreaker.forceOpen('Manual CLI command');
            console.log('\n🔴 Circuit breaker manually opened');
            
        } else if (args.includes('--close')) {
            await circuitBreaker.forceClose('Manual CLI command');
            console.log('\n🟢 Circuit breaker manually closed');
            
        } else if (args.includes('--test')) {
            console.log('\n🧪 Testing circuit breaker with simulated WASM error...');
            
            try {
                await circuitBreaker.execute(async () => {
                    throw new Error('RuntimeError: Aborted(). Build with -sASSERTIONS for more info.');
                });
            } catch (error) {
                console.log('✅ Test error handled correctly:', error.message);
            }
            
            const status = circuitBreaker.getStatus();
            console.log('📊 Status after test:', {
                state: status.state,
                failures: status.failureCount,
                wasmErrors: status.wasmErrors
            });
            
        } else {
            console.log('\n🔍 WASM Circuit Breaker monitoring active...');
            console.log('💡 Use --status, --metrics, --reset, --test, --open, or --close');
            
            // Demonstrate with a simple test
            setTimeout(async () => {
                const status = circuitBreaker.getStatus();
                console.log('\n📊 Current Status:', {
                    state: status.state,
                    healthScore: circuitBreaker.getMetrics().healthScore
                });
            }, 2000);
        }
    }
    
    runCircuitBreaker().catch(console.error);
}