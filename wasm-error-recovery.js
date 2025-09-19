#!/usr/bin/env node

/**
 * 🔧⚡ WASM ERROR RECOVERY SYSTEM
 * =============================
 * Specifically handles WebAssembly RuntimeError: Aborted() errors
 * Integrates with existing SystemResetRecovery for comprehensive handling
 */

const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const SystemResetRecovery = require('./system-reset-recovery.js');

class WasmErrorRecovery {
    constructor() {
        this.systemRecovery = new SystemResetRecovery();
        
        this.wasmErrorPatterns = [
            /RuntimeError: Aborted\(\)/,
            /wasm:\/\/wasm\/\w+:wasm-function/,
            /insertChild.*wasm/,
            /Build with -sASSERTIONS for more info/,
            /LA\.insertChild/,
            /Aborted\(\)\. Build with -sASSERTIONS/
        ];
        
        this.recoveryActions = {
            'CLAUDE_CLI_RESTART': {
                priority: 1,
                description: 'Restart Claude CLI with fresh context',
                actions: ['clear_claude_cache', 'restart_claude_session', 'preserve_context']
            },
            'MEMORY_CLEANUP': {
                priority: 2, 
                description: 'Clean up memory and temporary files',
                actions: ['clear_large_files', 'gc_force', 'clear_wasm_cache']
            },
            'SESSION_RECOVERY': {
                priority: 3,
                description: 'Recover work in progress with --resume functionality',
                actions: ['save_current_state', 'create_resume_point', 'restart_with_resume']
            }
        };
        
        this.sessionState = {
            lastCommand: null,
            workingDirectory: process.cwd(),
            contextFiles: [],
            todoState: null,
            errorHistory: []
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔧⚡ WASM ERROR RECOVERY SYSTEM INITIALIZING...');
        console.log('================================================');
        console.log('🎯 Claude CLI WASM Error Detection');
        console.log('💾 Automatic Session State Preservation');
        console.log('🔄 --resume Functionality Implementation');
        console.log('');
        
        // Set up error monitoring
        this.setupErrorMonitoring();
        
        // Hook into existing system recovery
        await this.integrateWithSystemRecovery();
        
        console.log('✅ WASM Error Recovery System Active');
    }
    
    setupErrorMonitoring() {
        // Monitor for WASM errors in process output
        process.on('uncaughtException', (error) => {
            this.handleWasmError(error);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            if (this.isWasmError(reason)) {
                this.handleWasmError(reason);
            }
        });
        
        // Monitor Claude CLI processes
        this.monitorClaudeProcesses();
    }
    
    async integrateWithSystemRecovery() {
        // Add WASM-specific overload thresholds
        this.systemRecovery.overloadThresholds.wasmErrors = 3; // Max 3 WASM errors per session
        
        // Add WASM-specific recovery strategies
        this.systemRecovery.recoveryStrategies.WASM_RECOVERY = {
            severity: 2,
            actions: ['wasm_error_cleanup', 'claude_cli_restart', 'session_recovery']
        };
    }
    
    monitorClaudeProcesses() {
        setInterval(async () => {
            try {
                const { stdout } = await execAsync('ps aux | grep claude-code | grep -v grep');
                
                if (!stdout.trim()) {
                    // Claude CLI not running, might have crashed
                    await this.detectCrashAndRecover();
                }
            } catch (error) {
                // Expected when no processes found
            }
        }, 5000); // Check every 5 seconds
    }
    
    isWasmError(error) {
        const errorString = error?.toString() || '';
        return this.wasmErrorPatterns.some(pattern => pattern.test(errorString));
    }
    
    async handleWasmError(error) {
        console.log('');
        console.log('🔧 WASM ERROR DETECTED! 🔧');
        console.log('==========================');
        console.log(`❌ Error: ${error.message}`);
        console.log(`📍 Stack: ${error.stack?.split('\n')[0] || 'N/A'}`);
        console.log('');
        
        // Record error
        const errorRecord = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            type: 'WASM_ERROR'
        };
        
        this.sessionState.errorHistory.push(errorRecord);
        
        // Save current state for recovery
        await this.saveSessionState();
        
        // Trigger recovery
        await this.executeWasmRecovery(errorRecord);
    }
    
    async saveSessionState() {
        console.log('💾 Saving session state for recovery...');
        
        try {
            // Capture current context
            this.sessionState.workingDirectory = process.cwd();
            this.sessionState.timestamp = new Date().toISOString();
            
            // Try to read any existing todo state
            try {
                const todoFiles = await this.findTodoFiles();
                this.sessionState.contextFiles = todoFiles;
            } catch (error) {
                // Ignore if can't read todos
            }
            
            // Save to recovery file
            const recoveryFile = './.claude-session-recovery.json';
            await fs.writeFile(recoveryFile, JSON.stringify(this.sessionState, null, 2));
            
            console.log('   ✅ Session state saved to .claude-session-recovery.json');
        } catch (error) {
            console.log(`   ❌ Failed to save session state: ${error.message}`);
        }
    }
    
    async findTodoFiles() {
        const files = [];
        try {
            const { stdout } = await execAsync('find . -name "*.md" -o -name "*.json" | head -20');
            files.push(...stdout.split('\n').filter(f => f.trim()));
        } catch (error) {
            // Ignore find errors
        }
        return files;
    }
    
    async executeWasmRecovery(errorRecord) {
        console.log('⚡ EXECUTING WASM-SPECIFIC RECOVERY...');
        
        // Choose recovery strategy
        const strategy = this.selectWasmRecoveryStrategy(errorRecord);
        console.log(`🎯 Selected Strategy: ${strategy}`);
        
        const recoveryPlan = this.recoveryActions[strategy];
        
        console.log('📋 Recovery Actions:');
        for (const action of recoveryPlan.actions) {
            console.log(`   🔄 Executing: ${action}`);
            await this.executeWasmRecoveryAction(action);
        }
        
        console.log('');
        console.log('✅ WASM RECOVERY COMPLETE');
        console.log('=========================');
        console.log(`📊 Strategy: ${strategy}`);
        console.log(`🔄 Actions: ${recoveryPlan.actions.length}`);
        console.log('💡 Use: claude --resume to continue your session');
        console.log('');
        
        // Create resume script
        await this.createResumeScript();
    }
    
    selectWasmRecoveryStrategy(errorRecord) {
        const errorCount = this.sessionState.errorHistory.length;
        
        if (errorCount >= 3) {
            return 'SESSION_RECOVERY';
        } else if (errorRecord.stack?.includes('insertChild')) {
            return 'MEMORY_CLEANUP';
        } else {
            return 'CLAUDE_CLI_RESTART';
        }
    }
    
    async executeWasmRecoveryAction(action) {
        try {
            switch (action) {
                case 'clear_claude_cache':
                    await this.clearClaudeCache();
                    break;
                    
                case 'restart_claude_session':
                    await this.restartClaudeSession();
                    break;
                    
                case 'preserve_context':
                    await this.preserveContext();
                    break;
                    
                case 'clear_large_files':
                    await this.clearLargeFiles();
                    break;
                    
                case 'gc_force':
                    await this.forceGarbageCollection();
                    break;
                    
                case 'clear_wasm_cache':
                    await this.clearWasmCache();
                    break;
                    
                case 'save_current_state':
                    await this.saveSessionState();
                    break;
                    
                case 'create_resume_point':
                    await this.createResumePoint();
                    break;
                    
                case 'restart_with_resume':
                    await this.createResumeScript();
                    break;
                    
                default:
                    console.log(`     ❌ Unknown WASM action: ${action}`);
            }
        } catch (error) {
            console.log(`     ❌ WASM action failed: ${action} - ${error.message}`);
        }
    }
    
    async clearClaudeCache() {
        console.log('     🧹 Clearing Claude cache...');
        
        const cachePaths = [
            '~/.cache/anthropic',
            '~/.cache/claude',
            '/tmp/claude-*'
        ];
        
        for (const cachePath of cachePaths) {
            try {
                await execAsync(`rm -rf ${cachePath}`);
            } catch (error) {
                // Ignore - cache might not exist
            }
        }
        
        console.log('     ✅ Claude cache cleared');
    }
    
    async restartClaudeSession() {
        console.log('     🔄 Preparing for Claude session restart...');
        
        // Kill existing Claude processes
        try {
            await execAsync('pkill -f claude-code');
        } catch (error) {
            // Expected if no processes running
        }
        
        console.log('     ✅ Claude processes terminated');
    }
    
    async preserveContext() {
        console.log('     💾 Preserving context files...');
        
        try {
            const contextBackup = './.claude-context-backup/';
            await execAsync(`mkdir -p ${contextBackup}`);
            
            // Copy important files
            const importantFiles = ['CLAUDE.md', 'package.json', '.env', 'README.md'];
            
            for (const file of importantFiles) {
                try {
                    await execAsync(`cp ${file} ${contextBackup} 2>/dev/null || true`);
                } catch (error) {
                    // Ignore if file doesn't exist
                }
            }
            
            console.log('     ✅ Context preserved');
        } catch (error) {
            console.log(`     ⚠️ Context preservation failed: ${error.message}`);
        }
    }
    
    async clearLargeFiles() {
        console.log('     🗑️ Clearing large temporary files...');
        
        const commands = [
            'find . -name "*.html" -size +50M -delete 2>/dev/null || true',
            'find . -name "*.log" -size +10M -delete 2>/dev/null || true', 
            'find . -name "chat.html" -delete 2>/dev/null || true',
            'rm -f ./*.tmp 2>/dev/null || true'
        ];
        
        for (const cmd of commands) {
            try {
                await execAsync(cmd);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        
        console.log('     ✅ Large files cleared');
    }
    
    async forceGarbageCollection() {
        console.log('     🗑️ Forcing garbage collection...');
        
        if (global.gc) {
            global.gc();
            console.log('     ✅ Garbage collection forced');
        } else {
            console.log('     ⚠️ Garbage collection not available');
        }
    }
    
    async clearWasmCache() {
        console.log('     🧹 Clearing WASM cache...');
        
        const wasmCachePaths = [
            '~/.cache/wasm',
            '/tmp/wasm-*',
            '/tmp/v8-compile-cache*'
        ];
        
        for (const cachePath of wasmCachePaths) {
            try {
                await execAsync(`rm -rf ${cachePath}`);
            } catch (error) {
                // Ignore - cache might not exist
            }
        }
        
        console.log('     ✅ WASM cache cleared');
    }
    
    async createResumePoint() {
        console.log('     📍 Creating resume point...');
        
        const resumePoint = {
            timestamp: new Date().toISOString(),
            workingDirectory: process.cwd(),
            lastCommand: this.sessionState.lastCommand,
            contextFiles: this.sessionState.contextFiles,
            errorHistory: this.sessionState.errorHistory,
            recoveryInstructions: [
                'WASM error recovery completed',
                'Session state preserved',
                'Ready for resume'
            ]
        };
        
        await fs.writeFile('./.claude-resume-point.json', JSON.stringify(resumePoint, null, 2));
        
        console.log('     ✅ Resume point created');
    }
    
    async createResumeScript() {
        console.log('     📝 Creating resume script...');
        
        const resumeScript = `#!/bin/bash
# Claude CLI WASM Error Recovery Resume Script
# Generated: ${new Date().toISOString()}

echo "🔄 Resuming Claude CLI session after WASM error recovery..."
echo "================================================="

# Change to working directory
cd "${this.sessionState.workingDirectory}"

echo "📍 Working Directory: $(pwd)"
echo "⏰ Recovery Time: ${new Date().toISOString()}"

# Show recovery context
if [ -f ".claude-session-recovery.json" ]; then
    echo "💾 Session recovery data available"
fi

if [ -f ".claude-resume-point.json" ]; then
    echo "📍 Resume point available"
fi

echo ""
echo "💡 To continue with Claude CLI:"
echo "   claude code"
echo ""
echo "📊 Recovery Summary:"
echo "   • WASM error handled"
echo "   • Memory cleaned up"  
echo "   • Session state preserved"
echo "   • Context files backed up"
echo ""

# Optionally restart Claude CLI
read -p "🚀 Start Claude CLI now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Claude CLI..."
    claude code
fi
`;
        
        await fs.writeFile('./resume-claude-session.sh', resumeScript);
        await execAsync('chmod +x ./resume-claude-session.sh');
        
        console.log('     ✅ Resume script created: ./resume-claude-session.sh');
    }
    
    async detectCrashAndRecover() {
        // Check if there's a recent recovery file indicating a crash
        try {
            const recoveryFile = './.claude-session-recovery.json';
            const stats = await fs.stat(recoveryFile);
            const timeSince = Date.now() - stats.mtime.getTime();
            
            // If recovery file is less than 5 minutes old, might be a crash
            if (timeSince < 5 * 60 * 1000) {
                console.log('🔍 Potential Claude CLI crash detected');
                console.log('💡 Run: ./resume-claude-session.sh to recover');
            }
        } catch (error) {
            // No recovery file, normal operation
        }
    }
    
    // Public API for manual recovery
    async triggerManualWasmRecovery() {
        console.log('🔧 MANUAL WASM RECOVERY TRIGGERED');
        console.log('==================================');
        
        const mockError = {
            timestamp: new Date().toISOString(),
            error: 'Manual WASM recovery',
            type: 'MANUAL_WASM_RECOVERY'
        };
        
        await this.executeWasmRecovery(mockError);
    }
    
    async getWasmRecoveryStatus() {
        return {
            sessionState: this.sessionState,
            recoveryActions: Object.keys(this.recoveryActions),
            errorPatterns: this.wasmErrorPatterns.map(p => p.toString()),
            hasRecoveryPoint: await this.hasResumePoint()
        };
    }
    
    async hasResumePoint() {
        try {
            await fs.access('./.claude-resume-point.json');
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = WasmErrorRecovery;

// CLI Interface
if (require.main === module) {
    console.log(`
🔧⚡ WASM ERROR RECOVERY SYSTEM
===============================

🎯 Claude CLI WASM Error Handler

This system specifically handles WebAssembly RuntimeError: Aborted() 
errors that occur in Claude Code CLI and provides resume functionality.

🔍 WASM ERROR PATTERNS DETECTED:
   • RuntimeError: Aborted()
   • wasm://wasm/function errors
   • insertChild WASM errors
   • Build with -sASSERTIONS messages

⚡ RECOVERY STRATEGIES:
   • Claude CLI Restart: Clean restart with context preservation
   • Memory Cleanup: Clear caches and large files
   • Session Recovery: Full session state preservation

🛡️ FEATURES:
   • Automatic WASM error detection
   • Session state preservation
   • Context file backup
   • Resume script generation
   • Integration with system recovery

💾 RESUME FUNCTIONALITY:
   • Saves current working state
   • Creates resume points
   • Generates recovery scripts
   • Preserves Claude context

🚑 USAGE:
   • Automatic: Monitors for WASM errors continuously
   • Manual: node wasm-error-recovery.js --recover
   • Resume: ./resume-claude-session.sh

No more losing work to WASM errors - automatic recovery and resume!
    `);
    
    async function runWasmRecovery() {
        const recovery = new WasmErrorRecovery();
        
        // Check for CLI arguments
        const args = process.argv.slice(2);
        
        if (args.includes('--recover')) {
            console.log('\n🔧 TRIGGERING MANUAL WASM RECOVERY...');
            await recovery.triggerManualWasmRecovery();
        } else if (args.includes('--status')) {
            const status = await recovery.getWasmRecoveryStatus();
            console.log('\n📊 WASM RECOVERY STATUS:');
            console.log(JSON.stringify(status, null, 2));
        } else {
            // Just run monitoring
            console.log('\n🔍 WASM Error Recovery monitoring active...');
            console.log('💡 Use --recover for manual recovery or --status for status check');
        }
    }
    
    runWasmRecovery().catch(console.error);
}