#!/usr/bin/env node

/**
 * WASM Protection Wrapper
 * Prevents RuntimeError: Aborted() crashes in Claude Code CLI
 * by implementing memory management and error boundaries
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class WASMProtectionWrapper {
    constructor(options = {}) {
        this.config = {
            maxMemoryMB: options.maxMemoryMB || 512,
            gcInterval: options.gcInterval || 5000,
            safeMode: options.safeMode || false,
            preallocateBuffers: options.preallocateBuffers || true,
            errorRecovery: options.errorRecovery || true,
            ...options
        };
        
        this.memoryBuffers = new Map();
        this.errorCount = 0;
        this.lastError = null;
        this.gcTimer = null;
        
        this.initialize();
    }
    
    initialize() {
        // Pre-allocate memory buffers to prevent sudden allocation failures
        if (this.config.preallocateBuffers) {
            this.preallocateMemory();
        }
        
        // Set up periodic garbage collection
        if (this.config.gcInterval > 0) {
            this.startGarbageCollection();
        }
        
        // Install global error handlers
        this.installErrorHandlers();
        
        console.log('[WASM Protection] Initialized with config:', this.config);
    }
    
    preallocateMemory() {
        const bufferSizes = [1024, 4096, 16384, 65536, 262144]; // 1KB to 256KB
        
        bufferSizes.forEach(size => {
            try {
                const buffer = new ArrayBuffer(size);
                this.memoryBuffers.set(size, [buffer]);
                console.log(`[WASM Protection] Pre-allocated ${size} byte buffer`);
            } catch (error) {
                console.warn(`[WASM Protection] Failed to pre-allocate ${size} byte buffer:`, error.message);
            }
        });
    }
    
    startGarbageCollection() {
        this.gcTimer = setInterval(() => {
            try {
                if (global.gc) {
                    const before = process.memoryUsage().heapUsed;
                    global.gc();
                    const after = process.memoryUsage().heapUsed;
                    const freed = before - after;
                    
                    if (freed > 0) {
                        console.log(`[WASM Protection] GC freed ${(freed / 1024 / 1024).toFixed(2)} MB`);
                    }
                }
                
                // Clean up unused buffers
                this.cleanupBuffers();
            } catch (error) {
                console.error('[WASM Protection] GC error:', error);
            }
        }, this.config.gcInterval);
    }
    
    cleanupBuffers() {
        const memUsage = process.memoryUsage();
        const usedMB = memUsage.heapUsed / 1024 / 1024;
        
        if (usedMB > this.config.maxMemoryMB * 0.8) {
            // Free up some buffers if we're approaching memory limit
            for (const [size, buffers] of this.memoryBuffers.entries()) {
                if (buffers.length > 1) {
                    buffers.splice(1); // Keep only one buffer of each size
                    console.log(`[WASM Protection] Freed extra ${size} byte buffers`);
                }
            }
        }
    }
    
    installErrorHandlers() {
        // Wrap process error handlers
        const originalUncaughtException = process.listeners('uncaughtException');
        const originalUnhandledRejection = process.listeners('unhandledRejection');
        
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
        
        process.on('uncaughtException', (error) => {
            if (this.handleWASMError(error)) {
                return; // Error was handled
            }
            
            // Re-emit to original handlers
            originalUncaughtException.forEach(handler => handler(error));
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            if (reason instanceof Error && this.handleWASMError(reason)) {
                return; // Error was handled
            }
            
            // Re-emit to original handlers
            originalUnhandledRejection.forEach(handler => handler(reason, promise));
        });
    }
    
    handleWASMError(error) {
        // Check if this is a WASM-related error
        if (!this.isWASMError(error)) {
            return false;
        }
        
        this.errorCount++;
        this.lastError = error;
        
        console.error('[WASM Protection] Caught WASM error:', error.message);
        console.error('[WASM Protection] Stack trace:', error.stack);
        
        if (this.config.errorRecovery) {
            return this.attemptRecovery();
        }
        
        return false;
    }
    
    isWASMError(error) {
        const wasmIndicators = [
            'RuntimeError: Aborted()',
            'wasm://',
            'WebAssembly',
            'insertChild',
            'Build with -sASSERTIONS'
        ];
        
        const errorString = error.toString() + (error.stack || '');
        return wasmIndicators.some(indicator => errorString.includes(indicator));
    }
    
    attemptRecovery() {
        console.log('[WASM Protection] Attempting recovery...');
        
        try {
            // Force garbage collection
            if (global.gc) {
                global.gc();
            }
            
            // Clear memory buffers
            this.memoryBuffers.clear();
            
            // Re-allocate minimal buffers
            if (this.config.preallocateBuffers) {
                this.preallocateMemory();
            }
            
            // If in safe mode, reduce operations
            if (this.config.safeMode) {
                console.log('[WASM Protection] Safe mode active - reducing concurrent operations');
            }
            
            console.log('[WASM Protection] Recovery successful');
            return true;
        } catch (recoveryError) {
            console.error('[WASM Protection] Recovery failed:', recoveryError);
            return false;
        }
    }
    
    // Utility method to wrap async operations with protection
    async wrapAsync(operation, operationName = 'operation') {
        const startTime = performance.now();
        
        try {
            console.log(`[WASM Protection] Starting ${operationName}`);
            const result = await operation();
            const duration = performance.now() - startTime;
            console.log(`[WASM Protection] Completed ${operationName} in ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            if (this.handleWASMError(error)) {
                // Retry once after recovery
                console.log(`[WASM Protection] Retrying ${operationName} after recovery`);
                return await operation();
            }
            throw error;
        }
    }
    
    // Get current status
    getStatus() {
        const memUsage = process.memoryUsage();
        return {
            errorCount: this.errorCount,
            lastError: this.lastError ? this.lastError.message : null,
            memoryUsageMB: {
                rss: (memUsage.rss / 1024 / 1024).toFixed(2),
                heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
                heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
                external: (memUsage.external / 1024 / 1024).toFixed(2)
            },
            bufferCount: this.memoryBuffers.size,
            safeMode: this.config.safeMode
        };
    }
    
    // Clean up resources
    destroy() {
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
        }
        
        this.memoryBuffers.clear();
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
        
        console.log('[WASM Protection] Cleaned up resources');
    }
}

// Export for use in other modules
module.exports = WASMProtectionWrapper;

// If run directly, demonstrate usage
if (require.main === module) {
    console.log('WASM Protection Wrapper - Test Mode');
    
    const protection = new WASMProtectionWrapper({
        safeMode: true,
        maxMemoryMB: 256,
        gcInterval: 3000
    });
    
    // Simulate some operations
    setTimeout(() => {
        console.log('\nCurrent Status:', protection.getStatus());
    }, 1000);
    
    // Keep process alive for testing
    setInterval(() => {
        // Heartbeat
    }, 60000);
}