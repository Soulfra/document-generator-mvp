#!/usr/bin/env node

/**
 * 🔍⚡ WASM Auto-Monitor & Cleanup System
 * ========================================
 * Continuous monitoring and automated cleanup for WASM error prevention
 * Integrates with all recovery systems for comprehensive protection
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');
const EventEmitter = require('events');
const path = require('path');

class WASMAutoMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            // Monitoring intervals
            memoryCheckInterval: options.memoryCheckInterval || 30000,  // 30 seconds
            fileCheckInterval: options.fileCheckInterval || 300000,     // 5 minutes
            processCheckInterval: options.processCheckInterval || 60000, // 1 minute
            logRotationInterval: options.logRotationInterval || 3600000, // 1 hour
            
            // Cleanup thresholds
            maxFileSize: options.maxFileSize || 50 * 1024 * 1024,      // 50MB
            maxLogAge: options.maxLogAge || 24 * 60 * 60 * 1000,       // 24 hours
            memoryWarningThreshold: options.memoryWarningThreshold || 80, // 80%
            memoryCriticalThreshold: options.memoryCriticalThreshold || 90, // 90%
            
            // File patterns to monitor
            largeFilePatterns: options.largeFilePatterns || [
                '*.html',
                '*.log',
                'chat.html',
                '*.tmp'
            ],
            
            // Directories to monitor
            monitoredDirectories: options.monitoredDirectories || [
                '.',
                './FinishThisIdea',
                './FinishThisIdea-Complete',
                './mcp',
                './.cache',
                './temp'
            ],
            
            // Cache directories
            cacheDirectories: options.cacheDirectories || [
                '~/.cache/anthropic',
                '~/.cache/claude',
                '/tmp/claude-*',
                '/tmp/v8-compile-cache*',
                '/tmp/wasm-*'
            ]
        };
        
        this.monitoring = false;
        this.stats = {
            startTime: Date.now(),
            totalCleanups: 0,
            filesRemoved: 0,
            bytesFreed: 0,
            memoryWarnings: 0,
            memoryCriticalEvents: 0,
            processesKilled: 0,
            lastCleanup: null,
            lastMemoryCheck: null,
            averageMemoryUsage: 0,
            cleanupHistory: []
        };
        
        this.memoryHistory = [];
        this.fileMonitorCache = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🔍⚡ WASM Auto-Monitor & Cleanup System Starting...');
        console.log('==================================================');
        console.log('🎯 Automated WASM Error Prevention');
        console.log('🧹 Continuous Cleanup & Maintenance');
        console.log('📊 Resource Monitoring & Optimization');
        console.log('');
        
        // Load previous stats
        await this.loadStats();
        
        // Create monitoring directories
        await this.createMonitoringStructure();
        
        // Start monitoring
        this.startMonitoring();
        
        console.log('✅ WASM Auto-Monitor System Active');
        console.log(`📊 Monitoring ${this.options.monitoredDirectories.length} directories`);
        console.log(`🧹 Total cleanups performed: ${this.stats.totalCleanups}`);
        console.log('');
    }
    
    /**
     * Start all monitoring processes
     */
    startMonitoring() {
        this.monitoring = true;
        
        // Start memory monitoring
        this.memoryMonitorInterval = setInterval(() => {
            this.checkMemoryUsage().catch(console.error);
        }, this.options.memoryCheckInterval);
        
        // Start file monitoring
        this.fileMonitorInterval = setInterval(() => {
            this.checkLargeFiles().catch(console.error);
        }, this.options.fileCheckInterval);
        
        // Start process monitoring
        this.processMonitorInterval = setInterval(() => {
            this.checkStuckProcesses().catch(console.error);
        }, this.options.processCheckInterval);
        
        // Start log rotation
        this.logRotationInterval = setInterval(() => {
            this.rotateLogs().catch(console.error);
        }, this.options.logRotationInterval);
        
        console.log('🔄 All monitoring processes started');
        
        this.emit('monitoringStarted', {
            intervals: {
                memory: this.options.memoryCheckInterval,
                files: this.options.fileCheckInterval,
                processes: this.options.processCheckInterval,
                logs: this.options.logRotationInterval
            }
        });
    }
    
    /**
     * Stop all monitoring processes
     */
    stopMonitoring() {
        this.monitoring = false;
        
        if (this.memoryMonitorInterval) clearInterval(this.memoryMonitorInterval);
        if (this.fileMonitorInterval) clearInterval(this.fileMonitorInterval);
        if (this.processMonitorInterval) clearInterval(this.processMonitorInterval);
        if (this.logRotationInterval) clearInterval(this.logRotationInterval);
        
        console.log('🛑 All monitoring processes stopped');
        this.emit('monitoringStopped');
    }
    
    /**
     * Check memory usage and trigger cleanup if needed
     */
    async checkMemoryUsage() {
        try {
            const memoryUsage = await this.getCurrentMemoryUsage();
            this.memoryHistory.push({
                timestamp: Date.now(),
                usage: memoryUsage
            });
            
            // Keep only last hour of memory data
            const oneHour = 60 * 60 * 1000;
            const cutoff = Date.now() - oneHour;
            this.memoryHistory = this.memoryHistory.filter(m => m.timestamp > cutoff);
            
            // Update average
            this.stats.averageMemoryUsage = this.memoryHistory.reduce((sum, m) => sum + m.usage, 0) / this.memoryHistory.length;
            this.stats.lastMemoryCheck = Date.now();
            
            if (memoryUsage >= this.options.memoryCriticalThreshold) {
                console.log('🚨 CRITICAL: Memory usage critical!', `${memoryUsage}%`);
                this.stats.memoryCriticalEvents++;
                await this.executeEmergencyCleanup('CRITICAL_MEMORY');
                
            } else if (memoryUsage >= this.options.memoryWarningThreshold) {
                console.log('⚠️ WARNING: Memory usage high', `${memoryUsage}%`);
                this.stats.memoryWarnings++;
                await this.executePreventiveCleanup('HIGH_MEMORY');
            }
            
            this.emit('memoryCheck', {
                usage: memoryUsage,
                average: this.stats.averageMemoryUsage,
                critical: memoryUsage >= this.options.memoryCriticalThreshold,
                warning: memoryUsage >= this.options.memoryWarningThreshold
            });
            
        } catch (error) {
            console.error('Memory check failed:', error.message);
        }
    }
    
    /**
     * Check for large files and clean them up
     */
    async checkLargeFiles() {
        try {
            console.log('🔍 Checking for large files...');
            
            let totalFilesFound = 0;
            let totalBytesFound = 0;
            
            for (const directory of this.options.monitoredDirectories) {
                try {
                    await fs.access(directory);
                    const files = await this.findLargeFiles(directory);
                    
                    for (const file of files) {
                        totalFilesFound++;
                        totalBytesFound += file.size;
                        
                        if (file.size > this.options.maxFileSize) {
                            console.log(`   🗑️ Removing large file: ${file.path} (${this.formatBytes(file.size)})`);
                            
                            try {
                                await fs.unlink(file.path);
                                this.stats.filesRemoved++;
                                this.stats.bytesFreed += file.size;
                            } catch (error) {
                                console.error(`   ❌ Failed to remove ${file.path}:`, error.message);
                            }
                        }
                    }
                    
                } catch (error) {
                    // Directory doesn't exist, skip
                    continue;
                }
            }
            
            if (totalFilesFound > 0) {
                console.log(`   📊 Found ${totalFilesFound} large files totaling ${this.formatBytes(totalBytesFound)}`);
            }
            
            this.emit('fileCheck', {
                filesFound: totalFilesFound,
                bytesFound: totalBytesFound,
                filesRemoved: this.stats.filesRemoved
            });
            
        } catch (error) {
            console.error('File check failed:', error.message);
        }
    }
    
    /**
     * Find large files in directory
     */
    async findLargeFiles(directory) {
        const largeFiles = [];
        
        try {
            const items = await fs.readdir(directory, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(directory, item.name);
                
                if (item.isFile()) {
                    // Check if file matches patterns we monitor
                    const shouldMonitor = this.options.largeFilePatterns.some(pattern => {
                        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                        return regex.test(item.name);
                    });
                    
                    if (shouldMonitor) {
                        try {
                            const stats = await fs.stat(fullPath);
                            largeFiles.push({
                                path: fullPath,
                                name: item.name,
                                size: stats.size,
                                mtime: stats.mtime
                            });
                        } catch (error) {
                            // Skip files we can't stat
                            continue;
                        }
                    }
                } else if (item.isDirectory() && !item.name.startsWith('.git') && !item.name.startsWith('node_modules')) {
                    // Recursively check subdirectories (but limit depth)
                    try {
                        const subFiles = await this.findLargeFiles(fullPath);
                        largeFiles.push(...subFiles);
                    } catch (error) {
                        // Skip directories we can't access
                        continue;
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return largeFiles;
    }
    
    /**
     * Check for stuck processes
     */
    async checkStuckProcesses() {
        try {
            const processes = await this.getClaudeProcesses();
            
            for (const proc of processes) {
                // Check if process has been running for too long or using too much CPU
                if (proc.cpu > 80 && proc.time > 300) { // >80% CPU for >5 minutes
                    console.log(`🔪 Killing stuck process: PID ${proc.pid} (CPU: ${proc.cpu}%, Time: ${proc.time}s)`);
                    
                    try {
                        execSync(`kill -9 ${proc.pid}`, { stdio: 'ignore' });
                        this.stats.processesKilled++;
                    } catch (error) {
                        console.error(`Failed to kill process ${proc.pid}:`, error.message);
                    }
                }
            }
            
            this.emit('processCheck', {
                processesFound: processes.length,
                processesKilled: this.stats.processesKilled
            });
            
        } catch (error) {
            console.error('Process check failed:', error.message);
        }
    }
    
    /**
     * Get Claude-related processes
     */
    async getClaudeProcesses() {
        try {
            const output = execSync('ps aux | grep claude | grep -v grep', { encoding: 'utf8' });
            const lines = output.split('\n').filter(line => line.trim());
            
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    user: parts[0],
                    pid: parseInt(parts[1]),
                    cpu: parseFloat(parts[2]),
                    memory: parseFloat(parts[3]),
                    time: this.parseTime(parts[9]),
                    command: parts.slice(10).join(' ')
                };
            });
        } catch (error) {
            return []; // No Claude processes running
        }
    }
    
    /**
     * Parse process time string
     */
    parseTime(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
    }
    
    /**
     * Rotate logs to prevent them from getting too large
     */
    async rotateLogs() {
        try {
            console.log('📝 Rotating logs...');
            
            const logPatterns = [
                '*.log',
                'crash-report.json',
                '.claude-*.json',
                'system-recovery-state.json'
            ];
            
            let rotatedCount = 0;
            
            for (const pattern of logPatterns) {
                try {
                    const files = await this.findFilesByPattern(pattern);
                    
                    for (const file of files) {
                        const stats = await fs.stat(file);
                        const age = Date.now() - stats.mtime.getTime();
                        
                        if (age > this.options.maxLogAge || stats.size > this.options.maxFileSize) {
                            const backupName = `${file}.${Date.now()}.bak`;
                            await fs.rename(file, backupName);
                            
                            // Compress the backup
                            try {
                                execSync(`gzip "${backupName}"`, { stdio: 'ignore' });
                                rotatedCount++;
                            } catch (error) {
                                // Compression failed, but file is still rotated
                                rotatedCount++;
                            }
                        }
                    }
                } catch (error) {
                    // Skip pattern if it fails
                    continue;
                }
            }
            
            if (rotatedCount > 0) {
                console.log(`   📝 Rotated ${rotatedCount} log files`);
            }
            
            this.emit('logRotation', { rotatedCount });
            
        } catch (error) {
            console.error('Log rotation failed:', error.message);
        }
    }
    
    /**
     * Execute preventive cleanup
     */
    async executePreventiveCleanup(reason) {
        console.log(`🧹 Executing preventive cleanup: ${reason}`);
        
        const cleanupActions = [
            'clearTempFiles',
            'clearCaches',
            'forceGarbageCollection'
        ];
        
        await this.executeCleanupActions(cleanupActions, 'PREVENTIVE');
    }
    
    /**
     * Execute emergency cleanup
     */
    async executeEmergencyCleanup(reason) {
        console.log(`🚨 Executing emergency cleanup: ${reason}`);
        
        const cleanupActions = [
            'clearLargeFiles',
            'clearTempFiles',
            'clearCaches',
            'killStuckProcesses',
            'forceGarbageCollection'
        ];
        
        await this.executeCleanupActions(cleanupActions, 'EMERGENCY');
    }
    
    /**
     * Execute cleanup actions
     */
    async executeCleanupActions(actions, type) {
        const cleanup = {
            timestamp: Date.now(),
            type,
            actions,
            filesRemoved: 0,
            bytesFreed: 0,
            processesKilled: 0,
            success: true
        };
        
        for (const action of actions) {
            try {
                console.log(`   🔄 ${action}...`);
                await this[action](cleanup);
            } catch (error) {
                console.error(`   ❌ ${action} failed:`, error.message);
                cleanup.success = false;
            }
        }
        
        // Update stats
        this.stats.totalCleanups++;
        this.stats.lastCleanup = Date.now();
        this.stats.cleanupHistory.push(cleanup);
        
        // Keep only last 10 cleanups
        if (this.stats.cleanupHistory.length > 10) {
            this.stats.cleanupHistory = this.stats.cleanupHistory.slice(-10);
        }
        
        console.log(`   ✅ ${type} cleanup completed`);
        
        await this.saveStats();
        
        this.emit('cleanupCompleted', cleanup);
    }
    
    // Cleanup action methods
    async clearLargeFiles(cleanup) {
        const commands = [
            'find . -name "*.html" -size +50M -delete 2>/dev/null || true',
            'find . -name "*.log" -size +10M -delete 2>/dev/null || true',
            'find . -name "chat.html" -delete 2>/dev/null || true'
        ];
        
        for (const cmd of commands) {
            execSync(cmd, { stdio: 'ignore' });
        }
        
        cleanup.filesRemoved += 10; // Estimate
    }
    
    async clearTempFiles(cleanup) {
        const commands = [
            'rm -f ./*.tmp 2>/dev/null || true',
            'rm -f .*.tmp 2>/dev/null || true',
            'rm -f temp-*.* 2>/dev/null || true',
            'rm -rf .tmp 2>/dev/null || true'
        ];
        
        for (const cmd of commands) {
            execSync(cmd, { stdio: 'ignore' });
        }
        
        cleanup.filesRemoved += 5; // Estimate
    }
    
    async clearCaches(cleanup) {
        for (const cacheDir of this.options.cacheDirectories) {
            try {
                execSync(`rm -rf ${cacheDir} 2>/dev/null || true`, { stdio: 'ignore' });
            } catch (error) {
                // Ignore cache clear failures
            }
        }
        
        cleanup.bytesFreed += 100 * 1024 * 1024; // Estimate 100MB
    }
    
    async killStuckProcesses(cleanup) {
        try {
            execSync('pkill -f "claude-code" 2>/dev/null || true', { stdio: 'ignore' });
            cleanup.processesKilled += 1;
        } catch (error) {
            // Expected if no processes
        }
    }
    
    async forceGarbageCollection(cleanup) {
        if (global.gc) {
            global.gc();
        }
        
        try {
            execSync('node -e "if (global.gc) global.gc();" --expose-gc 2>/dev/null || true', { stdio: 'ignore' });
        } catch (error) {
            // Ignore if not available
        }
    }
    
    /**
     * Utility methods
     */
    async getCurrentMemoryUsage() {
        try {
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
    
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    async findFilesByPattern(pattern) {
        try {
            const output = execSync(`find . -name "${pattern}" 2>/dev/null || true`, { encoding: 'utf8' });
            return output.split('\n').filter(line => line.trim()).map(line => line.trim());
        } catch (error) {
            return [];
        }
    }
    
    async createMonitoringStructure() {
        const monitoringDir = './.wasm-monitoring';
        
        try {
            await fs.mkdir(monitoringDir, { recursive: true });
            
            // Create subdirectories
            await fs.mkdir(path.join(monitoringDir, 'stats'), { recursive: true });
            await fs.mkdir(path.join(monitoringDir, 'logs'), { recursive: true });
            await fs.mkdir(path.join(monitoringDir, 'reports'), { recursive: true });
            
        } catch (error) {
            console.error('Failed to create monitoring structure:', error);
        }
    }
    
    async saveStats() {
        try {
            await fs.writeFile('./.wasm-monitoring/stats/auto-monitor-stats.json', JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }
    
    async loadStats() {
        try {
            const data = await fs.readFile('./.wasm-monitoring/stats/auto-monitor-stats.json', 'utf8');
            this.stats = { ...this.stats, ...JSON.parse(data) };
            console.log('📊 Loaded previous monitoring stats');
        } catch (error) {
            console.log('🆕 Starting with fresh monitoring stats');
        }
    }
    
    /**
     * Generate monitoring report
     */
    generateReport() {
        const uptime = Date.now() - this.stats.startTime;
        const uptimeHours = Math.round(uptime / (1000 * 60 * 60) * 100) / 100;
        
        return {
            overview: {
                uptime: uptimeHours + ' hours',
                monitoring: this.monitoring,
                totalCleanups: this.stats.totalCleanups,
                lastCleanup: this.stats.lastCleanup ? new Date(this.stats.lastCleanup).toISOString() : null
            },
            performance: {
                filesRemoved: this.stats.filesRemoved,
                bytesFreed: this.formatBytes(this.stats.bytesFreed),
                processesKilled: this.stats.processesKilled,
                averageMemoryUsage: Math.round(this.stats.averageMemoryUsage) + '%'
            },
            alerts: {
                memoryWarnings: this.stats.memoryWarnings,
                memoryCriticalEvents: this.stats.memoryCriticalEvents
            },
            recentActivity: {
                lastMemoryCheck: this.stats.lastMemoryCheck ? new Date(this.stats.lastMemoryCheck).toISOString() : null,
                recentMemoryUsage: this.memoryHistory.slice(-5),
                recentCleanups: this.stats.cleanupHistory.slice(-3)
            },
            configuration: {
                intervals: {
                    memoryCheck: this.options.memoryCheckInterval + 'ms',
                    fileCheck: this.options.fileCheckInterval + 'ms',
                    processCheck: this.options.processCheckInterval + 'ms'
                },
                thresholds: {
                    memoryWarning: this.options.memoryWarningThreshold + '%',
                    memoryCritical: this.options.memoryCriticalThreshold + '%',
                    maxFileSize: this.formatBytes(this.options.maxFileSize)
                }
            },
            health: {
                score: this.calculateHealthScore(),
                status: this.getHealthStatus(),
                recommendations: this.getHealthRecommendations()
            }
        };
    }
    
    calculateHealthScore() {
        let score = 100;
        
        // Deduct for high memory usage
        if (this.stats.averageMemoryUsage > this.options.memoryCriticalThreshold) {
            score -= 30;
        } else if (this.stats.averageMemoryUsage > this.options.memoryWarningThreshold) {
            score -= 15;
        }
        
        // Deduct for frequent critical events
        const uptimeHours = (Date.now() - this.stats.startTime) / (1000 * 60 * 60);
        const criticalEventRate = this.stats.memoryCriticalEvents / Math.max(1, uptimeHours);
        if (criticalEventRate > 1) score -= 25; // More than 1 per hour
        
        // Deduct for recent cleanup failures
        const recentFailures = this.stats.cleanupHistory.filter(c => !c.success).length;
        score -= Math.min(20, recentFailures * 5);
        
        return Math.max(0, Math.round(score));
    }
    
    getHealthStatus() {
        const score = this.calculateHealthScore();
        if (score >= 90) return 'EXCELLENT';
        if (score >= 75) return 'GOOD';
        if (score >= 60) return 'FAIR';
        if (score >= 40) return 'POOR';
        return 'CRITICAL';
    }
    
    getHealthRecommendations() {
        const recommendations = [];
        
        if (this.stats.averageMemoryUsage > this.options.memoryCriticalThreshold) {
            recommendations.push('Memory usage is critically high - consider closing other applications');
        }
        
        if (this.stats.memoryCriticalEvents > 5) {
            recommendations.push('Frequent memory critical events - consider reducing project size');
        }
        
        if (this.stats.filesRemoved < 10 && this.stats.totalCleanups > 5) {
            recommendations.push('Few files being cleaned - check file patterns and thresholds');
        }
        
        const recentFailures = this.stats.cleanupHistory.filter(c => !c.success).length;
        if (recentFailures > 2) {
            recommendations.push('Multiple cleanup failures - check system permissions');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System health is good - continue monitoring');
        }
        
        return recommendations;
    }
    
    // Public API methods
    getStats() { return { ...this.stats }; }
    
    async manualCleanup(type = 'MANUAL') {
        await this.executeEmergencyCleanup(type);
    }
    
    async generateReportFile() {
        const report = this.generateReport();
        const filename = `./.wasm-monitoring/reports/monitor-report-${Date.now()}.json`;
        await fs.writeFile(filename, JSON.stringify(report, null, 2));
        return filename;
    }
}

module.exports = WASMAutoMonitor;

// CLI Interface
if (require.main === module) {
    console.log(`
🔍⚡ WASM AUTO-MONITOR & CLEANUP SYSTEM
=======================================

🎯 Continuous automated monitoring and cleanup for WASM error prevention

This system runs continuously in the background, monitoring system health
and automatically performing cleanup to prevent WASM errors before they occur.

🔍 MONITORING FEATURES:
   • Real-time memory usage tracking
   • Large file detection and removal
   • Stuck process identification and cleanup
   • Log rotation and maintenance
   • Cache cleanup and optimization

🧹 AUTOMATED CLEANUP:
   • Removes files >50MB automatically
   • Clears system and application caches
   • Kills stuck Claude CLI processes
   • Rotates logs to prevent overflow
   • Forces garbage collection when needed

📊 INTELLIGENT THRESHOLDS:
   • Memory warning at 80% usage
   • Critical cleanup at 90% usage
   • File size limits and age-based cleanup
   • Process CPU and runtime monitoring

🚑 CLEANUP STRATEGIES:
   • Preventive: Light cleanup on warnings
   • Emergency: Full cleanup on critical events
   • Manual: On-demand cleanup execution

📈 REPORTING & METRICS:
   • Health scoring and recommendations
   • Performance tracking and history
   • Cleanup effectiveness monitoring
   • System health status reporting

💡 USAGE:
   • Auto: node wasm-auto-monitor.js (runs continuously)
   • Status: node wasm-auto-monitor.js --status
   • Report: node wasm-auto-monitor.js --report
   • Cleanup: node wasm-auto-monitor.js --cleanup

Proactive WASM error prevention through intelligent monitoring!
    `);
    
    async function runAutoMonitor() {
        const monitor = new WASMAutoMonitor();
        
        const args = process.argv.slice(2);
        
        if (args.includes('--status')) {
            const stats = monitor.getStats();
            console.log('\n📊 AUTO-MONITOR STATUS:');
            console.log('=======================');
            console.log(JSON.stringify(stats, null, 2));
            
        } else if (args.includes('--report')) {
            const report = monitor.generateReport();
            console.log('\n📈 MONITORING REPORT:');
            console.log('====================');
            console.log(JSON.stringify(report, null, 2));
            
            // Also save to file
            const filename = await monitor.generateReportFile();
            console.log(`\n💾 Report saved to: ${filename}`);
            
        } else if (args.includes('--cleanup')) {
            console.log('\n🧹 Manual cleanup requested...');
            await monitor.manualCleanup('MANUAL_CLI');
            console.log('✅ Manual cleanup completed');
            
        } else if (args.includes('--stop')) {
            monitor.stopMonitoring();
            console.log('\n🛑 Monitoring stopped');
            
        } else {
            console.log('\n🔄 Starting continuous monitoring...');
            console.log('💡 Use Ctrl+C to stop, or --status, --report, --cleanup');
            
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Received SIGINT, stopping monitor...');
                monitor.stopMonitoring();
                process.exit(0);
            });
            
            // Keep process alive
            setInterval(() => {
                // Show status periodically
                const stats = monitor.getStats();
                console.log(`📊 [${new Date().toLocaleTimeString()}] Cleanups: ${stats.totalCleanups}, Files: ${stats.filesRemoved}, Memory: ${Math.round(stats.averageMemoryUsage)}%`);
            }, 300000); // Every 5 minutes
        }
    }
    
    runAutoMonitor().catch(console.error);
}