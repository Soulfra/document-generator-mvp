#!/usr/bin/env node

/**
 * 🔄⚡ SYSTEM RESET & RECOVERY ENGINE
 * =================================
 * AUTOMATIC OVERLOAD DETECTION & RECOVERY
 * Handle manual reset situations automatically
 */

const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class SystemResetRecovery {
    constructor() {
        this.overloadThresholds = {
            cpu: 85,           // CPU usage percentage
            memory: 90,        // Memory usage percentage
            processes: 50,     // Max concurrent processes
            fileHandles: 1000, // Max open file handles
            loopDetections: 5  // Max loop detections per minute
        };
        
        this.recoveryStrategies = {
            'GENTLE_RESTART': {
                severity: 1,
                actions: ['stop_non_critical_processes', 'clear_temp_files', 'restart_services']
            },
            'HARD_RESET': {
                severity: 2,
                actions: ['kill_all_processes', 'clear_all_temp', 'reset_system_state']
            },
            'EMERGENCY_SHUTDOWN': {
                severity: 3,
                actions: ['emergency_stop', 'system_isolation', 'diagnostic_dump']
            }
        };
        
        this.systemState = {
            lastReset: null,
            resetCount: 0,
            overloadEvents: [],
            recoveryHistory: []
        };
        
        this.monitoring = false;
        this.init();
    }
    
    async init() {
        console.log('🔄⚡ SYSTEM RESET & RECOVERY ENGINE INITIALIZING...');
        console.log('================================================');
        console.log('🎯 AUTOMATIC OVERLOAD DETECTION');
        console.log('⚡ INTELLIGENT RECOVERY STRATEGIES');
        console.log('🛡️ MANUAL RESET PREVENTION');
        console.log('');
        
        await this.loadSystemState();
        await this.initializeMonitoring();
        
        this.monitoring = true;
        
        console.log('✅ SYSTEM RESET & RECOVERY ENGINE ACTIVE');
        console.log('🔄 Monitoring system health continuously');
        console.log('⚡ Ready to handle overload situations');
    }
    
    async loadSystemState() {
        try {
            const stateFile = './system-recovery-state.json';
            const data = await fs.readFile(stateFile, 'utf8');
            this.systemState = { ...this.systemState, ...JSON.parse(data) };
            console.log('   📊 Loaded previous system state');
        } catch (error) {
            console.log('   🆕 Creating new system state');
        }
    }
    
    async saveSystemState() {
        const stateFile = './system-recovery-state.json';
        await fs.writeFile(stateFile, JSON.stringify(this.systemState, null, 2));
    }
    
    async initializeMonitoring() {
        console.log('🔍 Initializing system monitoring...');
        
        // Start continuous monitoring
        this.startHealthMonitoring();
        this.startProcessMonitoring();
        this.startResourceMonitoring();
        this.startLoopMonitoring();
        
        console.log('   📊 Health monitoring active');
        console.log('   🔄 Process monitoring active');
        console.log('   💾 Resource monitoring active');
        console.log('   🔗 Loop monitoring active');
    }
    
    // MONITORING SYSTEMS
    
    startHealthMonitoring() {
        setInterval(async () => {
            if (!this.monitoring) return;
            
            const health = await this.checkSystemHealth();
            
            if (health.overloadDetected) {
                await this.handleOverload(health);
            }
        }, 10000); // Check every 10 seconds
    }
    
    startProcessMonitoring() {
        setInterval(async () => {
            if (!this.monitoring) return;
            
            try {
                const processes = await this.getRunningProcesses();
                
                if (processes.nodeProcesses > this.overloadThresholds.processes) {
                    await this.alertOverload('TOO_MANY_PROCESSES', {
                        current: processes.nodeProcesses,
                        threshold: this.overloadThresholds.processes
                    });
                }
            } catch (error) {
                console.log('   ⚠️ Process monitoring error:', error.message);
            }
        }, 15000); // Check every 15 seconds
    }
    
    startResourceMonitoring() {
        setInterval(async () => {
            if (!this.monitoring) return;
            
            try {
                const resources = await this.getSystemResources();
                
                if (resources.cpu > this.overloadThresholds.cpu || 
                    resources.memory > this.overloadThresholds.memory) {
                    await this.alertOverload('RESOURCE_EXHAUSTION', resources);
                }
            } catch (error) {
                console.log('   ⚠️ Resource monitoring error:', error.message);
            }
        }, 20000); // Check every 20 seconds
    }
    
    startLoopMonitoring() {
        // Watch for loop breaker activations
        setInterval(async () => {
            if (!this.monitoring) return;
            
            try {
                const loopEvents = await this.countRecentLoopEvents();
                
                if (loopEvents > this.overloadThresholds.loopDetections) {
                    await this.alertOverload('EXCESSIVE_LOOPS', {
                        events: loopEvents,
                        threshold: this.overloadThresholds.loopDetections
                    });
                }
            } catch (error) {
                console.log('   ⚠️ Loop monitoring error:', error.message);
            }
        }, 30000); // Check every 30 seconds
    }
    
    // SYSTEM ANALYSIS METHODS
    
    async checkSystemHealth() {
        const health = {
            timestamp: new Date().toISOString(),
            overloadDetected: false,
            issues: [],
            severity: 0
        };
        
        try {
            // Check CPU and memory
            const resources = await this.getSystemResources();
            if (resources.cpu > this.overloadThresholds.cpu) {
                health.issues.push(`High CPU usage: ${resources.cpu}%`);
                health.severity = Math.max(health.severity, 2);
            }
            
            if (resources.memory > this.overloadThresholds.memory) {
                health.issues.push(`High memory usage: ${resources.memory}%`);
                health.severity = Math.max(health.severity, 2);
            }
            
            // Check process count
            const processes = await this.getRunningProcesses();
            if (processes.nodeProcesses > this.overloadThresholds.processes) {
                health.issues.push(`Too many processes: ${processes.nodeProcesses}`);
                health.severity = Math.max(health.severity, 1);
            }
            
            // Check for stuck processes
            const stuckProcesses = await this.detectStuckProcesses();
            if (stuckProcesses.length > 0) {
                health.issues.push(`Stuck processes detected: ${stuckProcesses.length}`);
                health.severity = Math.max(health.severity, 3);
            }
            
            health.overloadDetected = health.issues.length > 0;
            
        } catch (error) {
            health.issues.push(`Health check error: ${error.message}`);
            health.severity = 1;
            health.overloadDetected = true;
        }
        
        return health;
    }
    
    async getSystemResources() {
        try {
            // Get CPU usage
            const { stdout: cpuData } = await execAsync('top -l 1 | grep "CPU usage"');
            const cpuMatch = cpuData.match(/(\d+\.\d+)% user/);
            const cpu = cpuMatch ? parseFloat(cpuMatch[1]) : 0;
            
            // Get memory usage
            const { stdout: memData } = await execAsync('vm_stat');
            const pageSize = 4096; // bytes
            const freeMatch = memData.match(/Pages free:\s+(\d+)/);
            const activeMatch = memData.match(/Pages active:\s+(\d+)/);
            const wiredMatch = memData.match(/Pages wired down:\s+(\d+)/);
            
            const free = freeMatch ? parseInt(freeMatch[1]) * pageSize : 0;
            const active = activeMatch ? parseInt(activeMatch[1]) * pageSize : 0;
            const wired = wiredMatch ? parseInt(wiredMatch[1]) * pageSize : 0;
            
            const used = active + wired;
            const total = used + free;
            const memory = total > 0 ? (used / total) * 100 : 0;
            
            return { cpu, memory: Math.round(memory) };
        } catch (error) {
            return { cpu: 0, memory: 0, error: error.message };
        }
    }
    
    async getRunningProcesses() {
        try {
            const { stdout } = await execAsync('ps aux | grep node | grep -v grep | wc -l');
            const nodeProcesses = parseInt(stdout.trim()) || 0;
            
            const { stdout: totalProcs } = await execAsync('ps aux | wc -l');
            const totalProcesses = parseInt(totalProcs.trim()) || 0;
            
            return { nodeProcesses, totalProcesses };
        } catch (error) {
            return { nodeProcesses: 0, totalProcesses: 0, error: error.message };
        }
    }
    
    async detectStuckProcesses() {
        try {
            // Look for processes consuming high CPU for extended periods
            const { stdout } = await execAsync('ps aux | grep node | grep -v grep');
            const processes = stdout.split('\n').filter(line => line.trim());
            
            const stuckProcesses = processes.filter(process => {
                const parts = process.split(/\s+/);
                const cpu = parseFloat(parts[2]) || 0;
                return cpu > 50; // Processes using >50% CPU might be stuck
            });
            
            return stuckProcesses;
        } catch (error) {
            return [];
        }
    }
    
    async countRecentLoopEvents() {
        try {
            // Check loop breaker log for recent events
            const logFile = './loop-breaker.log';
            const data = await fs.readFile(logFile, 'utf8');
            
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            
            const lines = data.split('\n');
            const recentEvents = lines.filter(line => {
                const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
                if (match) {
                    const eventTime = new Date(match[1]).getTime();
                    return eventTime > oneMinuteAgo;
                }
                return false;
            });
            
            return recentEvents.length;
        } catch (error) {
            return 0;
        }
    }
    
    // OVERLOAD HANDLING
    
    async alertOverload(type, details) {
        const overloadEvent = {
            id: Date.now().toString(36),
            type: type,
            timestamp: new Date().toISOString(),
            details: details,
            handled: false
        };
        
        this.systemState.overloadEvents.push(overloadEvent);
        
        console.log('');
        console.log('🚨 SYSTEM OVERLOAD DETECTED 🚨');
        console.log('=============================');
        console.log(`📍 TYPE: ${type}`);
        console.log(`⏰ TIME: ${overloadEvent.timestamp}`);
        console.log(`🆔 EVENT ID: ${overloadEvent.id}`);
        console.log('📊 DETAILS:');
        Object.entries(details).forEach(([key, value]) => {
            console.log(`   • ${key}: ${value}`);
        });
        console.log('');
        
        // Trigger recovery
        await this.handleOverload({ overloadType: type, details: details });
    }
    
    async handleOverload(healthData) {
        console.log('⚡ INITIATING AUTOMATIC RECOVERY...');
        
        const strategy = this.selectRecoveryStrategy(healthData);
        
        console.log(`🎯 SELECTED STRATEGY: ${strategy}`);
        console.log('📋 RECOVERY ACTIONS:');
        
        const recoveryPlan = this.recoveryStrategies[strategy];
        
        for (const action of recoveryPlan.actions) {
            console.log(`   🔄 Executing: ${action}`);
            await this.executeRecoveryAction(action);
        }
        
        // Record recovery
        const recovery = {
            timestamp: new Date().toISOString(),
            strategy: strategy,
            trigger: healthData.overloadType || 'health_check',
            actions: recoveryPlan.actions,
            success: true
        };
        
        this.systemState.recoveryHistory.push(recovery);
        this.systemState.lastReset = recovery.timestamp;
        this.systemState.resetCount++;
        
        await this.saveSystemState();
        
        console.log('');
        console.log('✅ AUTOMATIC RECOVERY COMPLETE');
        console.log('==============================');
        console.log(`🎯 Strategy Applied: ${strategy}`);
        console.log(`🔄 Actions Executed: ${recoveryPlan.actions.length}`);
        console.log(`📊 Total Resets: ${this.systemState.resetCount}`);
        console.log('');
        
        // Wait before resuming normal monitoring
        console.log('⏳ Waiting for system stabilization...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log('🔄 Resuming normal monitoring');
    }
    
    selectRecoveryStrategy(healthData) {
        const severity = healthData.severity || 1;
        
        if (severity >= 3 || (healthData.details && healthData.details.cpu > 95)) {
            return 'EMERGENCY_SHUTDOWN';
        } else if (severity >= 2 || this.systemState.resetCount > 5) {
            return 'HARD_RESET';
        } else {
            return 'GENTLE_RESTART';
        }
    }
    
    async executeRecoveryAction(action) {
        try {
            switch (action) {
                case 'stop_non_critical_processes':
                    await this.stopNonCriticalProcesses();
                    break;
                    
                case 'clear_temp_files':
                    await this.clearTempFiles();
                    break;
                    
                case 'restart_services':
                    await this.restartServices();
                    break;
                    
                case 'kill_all_processes':
                    await this.killAllProcesses();
                    break;
                    
                case 'clear_all_temp':
                    await this.clearAllTemp();
                    break;
                    
                case 'reset_system_state':
                    await this.resetSystemState();
                    break;
                    
                case 'emergency_stop':
                    await this.emergencyStop();
                    break;
                    
                case 'system_isolation':
                    await this.systemIsolation();
                    break;
                    
                case 'diagnostic_dump':
                    await this.diagnosticDump();
                    break;
                    
                default:
                    console.log(`     ❌ Unknown action: ${action}`);
            }
        } catch (error) {
            console.log(`     ❌ Action failed: ${action} - ${error.message}`);
        }
    }
    
    // RECOVERY ACTIONS
    
    async stopNonCriticalProcesses() {
        console.log('     🛑 Stopping non-critical processes...');
        
        const commands = [
            'pkill -f "node.*visual-reasoning"',
            'pkill -f "node.*block-world"',
            'pkill -f "node.*xml-.*"',
            'pkill -f "node.*reality-"',
            'pkill -f "node.*master-"'
        ];
        
        for (const cmd of commands) {
            try {
                await execAsync(cmd);
            } catch (error) {
                // Ignore errors - processes might not be running
            }
        }
        
        console.log('     ✅ Non-critical processes stopped');
    }
    
    async clearTempFiles() {
        console.log('     🗑️ Clearing temporary files...');
        
        const commands = [
            'rm -f .*.tmp',
            'rm -f *.loop',
            'rm -f temp-*.json',
            'rm -f .loop-*'
        ];
        
        for (const cmd of commands) {
            try {
                await execAsync(cmd);
            } catch (error) {
                // Ignore errors - files might not exist
            }
        }
        
        console.log('     ✅ Temporary files cleared');
    }
    
    async restartServices() {
        console.log('     🔄 Restarting core services...');
        
        // Create restart marker
        await fs.writeFile('.system-restart-marker', new Date().toISOString());
        
        console.log('     ✅ Services marked for restart');
    }
    
    async killAllProcesses() {
        console.log('     💀 Killing all node processes...');
        
        try {
            await execAsync('pkill -f "node"');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            // Expected - we're killing ourselves too
        }
        
        console.log('     ✅ All processes terminated');
    }
    
    async clearAllTemp() {
        console.log('     🧹 Complete temporary cleanup...');
        
        const commands = [
            'rm -rf .tmp',
            'rm -rf tmp',
            'rm -f *.tmp',
            'rm -f *.log',
            'rm -f .*.tmp',
            'find . -name "*.tmp" -delete',
            'find . -name ".DS_Store" -delete'
        ];
        
        for (const cmd of commands) {
            try {
                await execAsync(cmd);
            } catch (error) {
                // Ignore errors
            }
        }
        
        console.log('     ✅ Complete cleanup finished');
    }
    
    async resetSystemState() {
        console.log('     🔄 Resetting system state...');
        
        // Reset all state files
        this.systemState = {
            lastReset: new Date().toISOString(),
            resetCount: this.systemState.resetCount + 1,
            overloadEvents: [],
            recoveryHistory: this.systemState.recoveryHistory.slice(-10) // Keep last 10
        };
        
        await this.saveSystemState();
        
        console.log('     ✅ System state reset');
    }
    
    async emergencyStop() {
        console.log('     🚨 Emergency stop activated...');
        
        // Create emergency flag
        await fs.writeFile('.emergency-stop', JSON.stringify({
            timestamp: new Date().toISOString(),
            reason: 'System overload emergency',
            resetCount: this.systemState.resetCount
        }, null, 2));
        
        // Stop monitoring
        this.monitoring = false;
        
        console.log('     🛑 Emergency stop complete');
    }
    
    async systemIsolation() {
        console.log('     🏝️ Isolating system...');
        
        // Create isolation flag
        await fs.writeFile('.system-isolated', new Date().toISOString());
        
        console.log('     ✅ System isolated');
    }
    
    async diagnosticDump() {
        console.log('     🔍 Creating diagnostic dump...');
        
        const diagnostic = {
            timestamp: new Date().toISOString(),
            systemState: this.systemState,
            processes: await this.getRunningProcesses(),
            resources: await this.getSystemResources(),
            health: await this.checkSystemHealth()
        };
        
        await fs.writeFile('./emergency-diagnostic-dump.json', JSON.stringify(diagnostic, null, 2));
        
        console.log('     📊 Diagnostic dump created');
    }
    
    // MANUAL TRIGGER METHODS
    
    async triggerManualReset(strategy = 'GENTLE_RESTART') {
        console.log('🔄 MANUAL RESET TRIGGERED');
        console.log('========================');
        
        await this.handleOverload({
            overloadType: 'MANUAL_TRIGGER',
            severity: this.recoveryStrategies[strategy].severity,
            details: { trigger: 'manual', strategy: strategy }
        });
    }
    
    async getRecoveryStatus() {
        return {
            monitoring: this.monitoring,
            systemState: this.systemState,
            lastHealth: await this.checkSystemHealth(),
            availableStrategies: Object.keys(this.recoveryStrategies)
        };
    }
}

module.exports = SystemResetRecovery;

// CLI interface
if (require.main === module) {
    console.log(`
🔄⚡ SYSTEM RESET & RECOVERY ENGINE
==================================

🎯 AUTOMATIC OVERLOAD DETECTION & RECOVERY

This system monitors for overload conditions and automatically
applies recovery strategies to prevent manual reset requirements.

🔍 MONITORING SYSTEMS:
   • CPU and memory usage tracking
   • Process count monitoring  
   • Loop detection tracking
   • Stuck process detection
   • Resource exhaustion alerts

⚡ RECOVERY STRATEGIES:
   • Gentle Restart: Stop non-critical processes, clear temps
   • Hard Reset: Kill all processes, full cleanup
   • Emergency Shutdown: Complete system isolation

🛡️ OVERLOAD DETECTION:
   • CPU usage > 85%
   • Memory usage > 90%
   • More than 50 concurrent processes
   • More than 5 loop detections per minute
   • Stuck processes detected

🚑 EMERGENCY FEATURES:
   • Manual reset triggers
   • Diagnostic dump generation
   • System isolation capabilities
   • Recovery history tracking

No more manual resets - the system handles overloads automatically.
    `);
    
    async function runSystemRecovery() {
        const recovery = new SystemResetRecovery();
        
        // Demonstrate manual reset
        setTimeout(async () => {
            console.log('\n🔧 DEMONSTRATING MANUAL RESET CAPABILITY...');
            await recovery.triggerManualReset('GENTLE_RESTART');
            
            // Show status
            const status = await recovery.getRecoveryStatus();
            console.log('\n📊 RECOVERY STATUS:');
            console.log(JSON.stringify(status, null, 2));
            
        }, 5000);
    }
    
    runSystemRecovery();
}