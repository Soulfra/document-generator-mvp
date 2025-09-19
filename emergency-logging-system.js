#!/usr/bin/env node
/**
 * Emergency Logging & Crash Detection System
 * 
 * Comprehensive logging system to diagnose crashes and system instability
 * Provides real-time crash detection, stack traces, and system health monitoring
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const os = require('os');

class EmergencyLogger extends EventEmitter {
    constructor() {
        super();
        this.logDir = path.join(__dirname, 'logs');
        this.crashDir = path.join(this.logDir, 'crashes');
        this.errorCount = 0;
        this.crashThreshold = 5; // Crashes per minute threshold
        this.crashTimestamps = [];
        this.isActive = true;
        
        this.initializeLogDirectories();
        this.setupProcessListeners();
        this.startHealthMonitoring();
        
        console.log(`🚨 Emergency Logger initialized at ${new Date().toISOString()}`);
        this.log('SYSTEM', 'Emergency Logger started', { pid: process.pid });
    }
    
    initializeLogDirectories() {
        try {
            if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
            if (!fs.existsSync(this.crashDir)) fs.mkdirSync(this.crashDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directories:', error);
        }
    }
    
    setupProcessListeners() {
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logCrash('UNCAUGHT_EXCEPTION', error);
        });
        
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logCrash('UNHANDLED_REJECTION', reason, { promise });
        });
        
        // SIGTERM/SIGINT handlers
        process.on('SIGTERM', () => {
            this.log('SYSTEM', 'Received SIGTERM, shutting down gracefully');
            this.shutdown();
        });
        
        process.on('SIGINT', () => {
            this.log('SYSTEM', 'Received SIGINT, shutting down gracefully');
            this.shutdown();
        });
        
        // Memory warnings
        process.on('warning', (warning) => {
            this.log('WARNING', warning.message, {
                name: warning.name,
                stack: warning.stack
            });
        });
    }
    
    log(level, message, data = {}) {
        if (!this.isActive) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            pid: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            ...data
        };
        
        // Console output with colors
        const colorCode = this.getLevelColor(level);
        console.log(`${colorCode}[${timestamp}] ${level}: ${message}${'\x1b[0m'}`);
        if (Object.keys(data).length > 0) {
            console.log('  Data:', JSON.stringify(data, null, 2));
        }
        
        // File logging
        this.writeToFile('system.log', logEntry);
        
        // Emit event for real-time monitoring
        this.emit('log', logEntry);
        
        // Check for error threshold
        if (['ERROR', 'CRASH', 'FATAL'].includes(level)) {
            this.errorCount++;
            this.checkErrorThreshold();
        }
    }
    
    logCrash(type, error, additionalData = {}) {
        const crashId = `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const crashData = {
            crashId,
            type,
            timestamp: new Date().toISOString(),
            error: {
                message: error.message || error,
                stack: error.stack || new Error().stack,
                name: error.name
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                loadAverage: os.loadavg(),
                freeMemory: os.freemem(),
                totalMemory: os.totalmem()
            },
            process: {
                pid: process.pid,
                cwd: process.cwd(),
                argv: process.argv,
                env: this.sanitizeEnv(process.env)
            },
            ...additionalData
        };
        
        // Log crash
        this.log('CRASH', `System crash detected: ${type}`, crashData);
        
        // Write detailed crash dump
        this.writeCrashDump(crashId, crashData);
        
        // Track crash timing
        this.trackCrashTiming();
        
        // Emit crash event
        this.emit('crash', crashData);
        
        // If too many crashes, trigger emergency mode
        if (this.isCrashStorm()) {
            this.enterEmergencyMode();
        }
    }
    
    trackCrashTiming() {
        const now = Date.now();
        this.crashTimestamps.push(now);
        
        // Keep only last minute of crashes
        this.crashTimestamps = this.crashTimestamps.filter(
            timestamp => now - timestamp < 60000
        );
    }
    
    isCrashStorm() {
        return this.crashTimestamps.length >= this.crashThreshold;
    }
    
    enterEmergencyMode() {
        this.log('EMERGENCY', 'Crash storm detected! Entering emergency mode', {
            crashCount: this.crashTimestamps.length,
            timeWindow: '1 minute',
            threshold: this.crashThreshold
        });
        
        // Emit emergency event
        this.emit('emergency', {
            reason: 'crash_storm',
            crashCount: this.crashTimestamps.length
        });
        
        // Create emergency report
        this.createEmergencyReport();
    }
    
    createEmergencyReport() {
        const reportPath = path.join(this.crashDir, `emergency_report_${Date.now()}.json`);
        const report = {
            timestamp: new Date().toISOString(),
            reason: 'Multiple crashes detected',
            crashCount: this.crashTimestamps.length,
            systemInfo: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                uptime: os.uptime(),
                loadAverage: os.loadavg(),
                memory: {
                    free: os.freemem(),
                    total: os.totalmem(),
                    process: process.memoryUsage()
                }
            },
            recentLogs: this.getRecentLogs(),
            recommendedActions: [
                'Check system resources (CPU, memory)',
                'Review recent code changes',
                'Check for infinite loops or memory leaks',
                'Verify all dependencies are properly installed',
                'Consider rolling back to last stable version'
            ]
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log('EMERGENCY', `Emergency report created: ${reportPath}`);
    }
    
    startHealthMonitoring() {
        setInterval(() => {
            if (!this.isActive) return;
            
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            // Memory leak detection
            if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
                this.log('WARNING', 'High memory usage detected', memUsage);
            }
            
            // Health check log
            this.log('HEALTH', 'System health check', {
                memory: memUsage,
                cpu: cpuUsage,
                uptime: process.uptime()
            });
            
        }, 30000); // Every 30 seconds
    }
    
    checkErrorThreshold() {
        if (this.errorCount > 10) { // 10 errors threshold
            this.log('WARNING', 'High error count detected', {
                errorCount: this.errorCount,
                recommendation: 'Check logs for patterns'
            });
        }
    }
    
    getLevelColor(level) {
        const colors = {
            'SYSTEM': '\x1b[36m',    // Cyan
            'INFO': '\x1b[32m',      // Green
            'WARNING': '\x1b[33m',   // Yellow
            'ERROR': '\x1b[31m',     // Red
            'CRASH': '\x1b[35m',     // Magenta
            'FATAL': '\x1b[41m',     // Red background
            'EMERGENCY': '\x1b[41m\x1b[37m', // Red background, white text
            'HEALTH': '\x1b[34m'     // Blue
        };
        return colors[level] || '\x1b[0m';
    }
    
    writeToFile(filename, data) {
        try {
            const logPath = path.join(this.logDir, filename);
            const logLine = JSON.stringify(data) + '\n';
            fs.appendFileSync(logPath, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    writeCrashDump(crashId, crashData) {
        try {
            const crashPath = path.join(this.crashDir, `${crashId}.json`);
            fs.writeFileSync(crashPath, JSON.stringify(crashData, null, 2));
            this.log('INFO', `Crash dump written: ${crashPath}`);
        } catch (error) {
            console.error('Failed to write crash dump:', error);
        }
    }
    
    sanitizeEnv(env) {
        const sanitized = { ...env };
        // Remove sensitive environment variables
        const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api'];
        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    
    getRecentLogs() {
        try {
            const logPath = path.join(this.logDir, 'system.log');
            if (!fs.existsSync(logPath)) return [];
            
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.trim().split('\n');
            
            // Return last 50 log entries
            return lines.slice(-50).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            });
        } catch (error) {
            return [{ error: 'Failed to read recent logs', message: error.message }];
        }
    }
    
    // Method to wrap functions with error logging
    wrapFunction(fn, context = 'unknown') {
        return (...args) => {
            try {
                const result = fn.apply(this, args);
                
                // Handle promises
                if (result && typeof result.catch === 'function') {
                    return result.catch(error => {
                        this.log('ERROR', `Promise rejection in ${context}`, {
                            error: error.message,
                            stack: error.stack,
                            context,
                            args: args.length
                        });
                        throw error;
                    });
                }
                
                return result;
            } catch (error) {
                this.log('ERROR', `Exception in ${context}`, {
                    error: error.message,
                    stack: error.stack,
                    context,
                    args: args.length
                });
                throw error;
            }
        };
    }
    
    // Method to create error boundaries for modules
    createErrorBoundary(moduleName) {
        return {
            try: (fn) => {
                try {
                    return fn();
                } catch (error) {
                    this.log('ERROR', `Error in ${moduleName}`, {
                        error: error.message,
                        stack: error.stack,
                        module: moduleName
                    });
                    return null;
                }
            },
            
            tryAsync: async (fn) => {
                try {
                    return await fn();
                } catch (error) {
                    this.log('ERROR', `Async error in ${moduleName}`, {
                        error: error.message,
                        stack: error.stack,
                        module: moduleName
                    });
                    return null;
                }
            }
        };
    }
    
    shutdown() {
        this.log('SYSTEM', 'Emergency Logger shutting down');
        this.isActive = false;
        
        // Create final report
        const shutdownReport = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            errorCount: this.errorCount,
            crashCount: this.crashTimestamps.length,
            finalMemory: process.memoryUsage()
        };
        
        this.writeToFile('shutdown.log', shutdownReport);
        console.log('🚨 Emergency Logger shutdown complete');
    }
}

// Create global instance
const emergencyLogger = new EmergencyLogger();

// Export for use in other modules
module.exports = {
    EmergencyLogger,
    logger: emergencyLogger,
    
    // Convenience methods
    log: (level, message, data) => emergencyLogger.log(level, message, data),
    logError: (message, error, data) => emergencyLogger.log('ERROR', message, { error: error.message, stack: error.stack, ...data }),
    logCrash: (type, error, data) => emergencyLogger.logCrash(type, error, data),
    wrapFunction: (fn, context) => emergencyLogger.wrapFunction(fn, context),
    createErrorBoundary: (moduleName) => emergencyLogger.createErrorBoundary(moduleName)
};

// If run directly, start monitoring
if (require.main === module) {
    console.log('🚨 Emergency Logging System is now active');
    console.log('📂 Logs directory:', emergencyLogger.logDir);
    console.log('💥 Crash dumps directory:', emergencyLogger.crashDir);
    
    // Test the system
    emergencyLogger.log('SYSTEM', 'Emergency logging test successful');
    
    // Keep process alive
    process.stdin.resume();
}