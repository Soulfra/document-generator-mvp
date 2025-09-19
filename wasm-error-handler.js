/**
 * WASM Error Handler and Recovery System
 * Addresses the runtime errors in Claude Code CLI and other WASM-dependent components
 */

class WASMErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        this.isHandlerActive = false;
        
        this.setupErrorHandlers();
        this.setupNodeJSHandlers();
        
        console.log('🛡️  WASM Error Handler initialized');
    }

    setupErrorHandlers() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            if (this.isWasmError(error)) {
                console.error('🚨 WASM Uncaught Exception:', error.message);
                this.handleWasmError(error);
                return;
            }
            
            // Re-throw non-WASM errors
            throw error;
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            if (this.isWasmRejection(reason)) {
                console.error('🚨 WASM Promise Rejection:', reason);
                this.handleWasmRejection(reason, promise);
                return;
            }
            
            // Log but don't crash for other rejections
            console.error('Unhandled Rejection:', reason);
        });

        // Handle SIGTERM gracefully
        process.on('SIGTERM', () => {
            console.log('📡 Received SIGTERM, cleaning up WASM resources...');
            this.cleanup();
            process.exit(0);
        });
    }

    setupNodeJSHandlers() {
        // Override require to catch WASM module loading errors
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        
        Module.prototype.require = function(id) {
            try {
                return originalRequire.apply(this, arguments);
            } catch (error) {
                if (id.includes('quickjs') || id.includes('wasm') || error.message.includes('abort')) {
                    console.warn(`⚠️  WASM module loading failed: ${id}`, error.message);
                    
                    // Try to provide a fallback or graceful degradation
                    if (id.includes('quickjs-emscripten')) {
                        return {
                            getQuickJS: () => Promise.reject(new Error('WASM module unavailable, using fallback')),
                            newQuickJSWASMModule: () => Promise.reject(new Error('WASM module unavailable'))
                        };
                    }
                }
                throw error;
            }
        };
    }

    isWasmError(error) {
        if (!error) return false;
        
        const errorString = error.toString().toLowerCase();
        const stackString = (error.stack || '').toLowerCase();
        
        return (
            errorString.includes('abort') ||
            errorString.includes('wasm') ||
            errorString.includes('webassembly') ||
            errorString.includes('quickjs') ||
            stackString.includes('wasm') ||
            stackString.includes('emscripten') ||
            error.message?.includes('RuntimeError: Aborted()')
        );
    }

    isWasmRejection(reason) {
        if (!reason) return false;
        
        const reasonString = reason.toString().toLowerCase();
        return (
            reasonString.includes('wasm') ||
            reasonString.includes('abort') ||
            reasonString.includes('quickjs') ||
            reasonString.includes('emscripten')
        );
    }

    handleWasmError(error) {
        this.errorCount++;
        console.error(`🔥 WASM Error #${this.errorCount}:`, error.message);
        
        if (this.recoveryAttempts < this.maxRecoveryAttempts) {
            console.log(`🔄 Attempting recovery (${this.recoveryAttempts + 1}/${this.maxRecoveryAttempts})`);
            this.attemptRecovery(error);
        } else {
            console.error('💥 Maximum recovery attempts reached, entering safe mode');
            this.enterSafeMode();
        }
    }

    handleWasmRejection(reason, promise) {
        console.warn('⚠️  WASM Promise Rejection:', reason);
        
        // Mark the promise as handled
        promise.catch(() => {
            // Silently handle to prevent crash
        });
    }

    attemptRecovery(error) {
        this.recoveryAttempts++;
        
        try {
            // Clear module cache for WASM-related modules
            this.clearWasmModuleCache();
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                console.log('♻️  Garbage collection triggered');
            }
            
            // Set environment variables for better WASM handling
            process.env.WASM_BINARY_FILE = '';
            process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=4096';
            
            console.log('✅ Recovery attempt completed');
            
            // Emit recovery event for other components
            process.emit('wasm-recovery', {
                attempt: this.recoveryAttempts,
                error: error.message
            });
            
        } catch (recoveryError) {
            console.error('❌ Recovery attempt failed:', recoveryError.message);
        }
    }

    clearWasmModuleCache() {
        const moduleCache = require.cache;
        const keysToDelete = [];
        
        for (const key in moduleCache) {
            if (key.includes('quickjs') || 
                key.includes('wasm') || 
                key.includes('emscripten') ||
                key.includes('.wasm')) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            try {
                delete require.cache[key];
                console.log(`🗑️  Cleared module cache: ${key.split('/').pop()}`);
            } catch (e) {
                // Ignore deletion errors
            }
        });
        
        console.log(`📦 Cleared ${keysToDelete.length} WASM-related modules from cache`);
    }

    enterSafeMode() {
        console.log('🛡️  Entering WASM Safe Mode');
        
        // Disable WASM-dependent features
        process.env.WASM_SAFE_MODE = 'true';
        process.env.DISABLE_WASM = 'true';
        
        // Create minimal error-free environment
        this.setupSafeModeEnvironment();
        
        console.log('✅ Safe mode activated - WASM features disabled');
    }

    setupSafeModeEnvironment() {
        // Mock WASM modules to prevent further errors
        const mockWasmModule = {
            ready: Promise.resolve(),
            getQuickJS: () => Promise.reject(new Error('WASM disabled in safe mode')),
            newQuickJSWASMModule: () => Promise.reject(new Error('WASM disabled in safe mode'))
        };
        
        // Intercept common WASM module imports
        require.cache['@tootallnate/quickjs-emscripten'] = {
            exports: mockWasmModule,
            loaded: true
        };
    }

    cleanup() {
        console.log('🧹 Cleaning up WASM Error Handler');
        this.isHandlerActive = false;
        
        // Remove all listeners
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
    }

    // Health check method
    healthCheck() {
        return {
            errorCount: this.errorCount,
            recoveryAttempts: this.recoveryAttempts,
            safeMode: process.env.WASM_SAFE_MODE === 'true',
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }

    // Static method to initialize globally
    static initialize() {
        if (!global._wasmErrorHandler) {
            global._wasmErrorHandler = new WASMErrorHandler();
        }
        return global._wasmErrorHandler;
    }
}

// Auto-initialize if running directly
if (require.main === module) {
    const handler = WASMErrorHandler.initialize();
    
    // Test the handler
    console.log('🧪 Testing WASM Error Handler...');
    console.log('Health check:', JSON.stringify(handler.healthCheck(), null, 2));
    
    // Simulate a WASM error for testing
    if (process.argv.includes('--test')) {
        setTimeout(() => {
            console.log('🎯 Simulating WASM error...');
            const testError = new Error('RuntimeError: Aborted(). Build with -sASSERTIONS for more info.');
            testError.stack = 'wasm://wasm/test:function[1]:0x123';
            handler.handleWasmError(testError);
        }, 1000);
    }
}

module.exports = WASMErrorHandler;