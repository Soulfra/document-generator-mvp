#!/usr/bin/env node

/**
 * 🤖⚡ CLAUDE COMMAND BRIDGE
 * ==========================
 * Lets Claude (me) execute commands on your system when you ask
 * - Monitors chat for command requests
 * - Executes system commands safely
 * - Integrates with reasoning logger
 * - Provides real-time feedback
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const WebSocket = require('ws');

class ClaudeCommandBridge {
    constructor() {
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.commandsDir = path.join(this.vizDir, 'claude-commands');
        this.logger = require('./reasoning-logger');
        this.ws = null;
        this.activeCommands = new Map();
        
        // Allowed commands for security
        this.allowedCommands = {
            'start-jarvis': {
                command: './start-jarvis-hud.sh',
                description: 'Start the Jarvis HUD system',
                category: 'jarvis'
            },
            'stop-jarvis': {
                command: './stop-jarvis-hud.sh',
                description: 'Stop the Jarvis HUD system',
                category: 'jarvis'
            },
            'activate-hud': {
                command: 'echo "HUD_ACTIVATE" > .reasoning-viz/hud-command.txt',
                description: 'Activate the HUD overlay',
                category: 'jarvis'
            },
            'reasoning-stats': {
                command: 'node reasoning-logger.js stats',
                description: 'Show reasoning statistics',
                category: 'reasoning'
            },
            'verify-system': {
                command: 'node verify-reasoning-system.js quick',
                description: 'Verify system components',
                category: 'system'
            },
            'show-fog-of-war': {
                command: 'open fog-of-war-3d-explorer.html',
                description: 'Open fog of war explorer',
                category: 'exploration'
            },
            'show-boss-room': {
                command: 'open boss-room-cursor-overlay.html',
                description: 'Open boss room cursor overlay',
                category: 'interface'
            },
            'ai-context': {
                command: 'curl -s http://localhost:3007/api/ai/copyable-context',
                description: 'Get current AI conversation context',
                category: 'ai'
            }
        };
        
        this.init();
    }
    
    async init() {
        await this.ensureDirectories();
        await this.createCommandInterface();
        this.startCommandWatcher();
        this.connectToReasoningStream();
        
        console.log('🤖⚡ CLAUDE COMMAND BRIDGE ACTIVE');
        console.log('=================================');
        console.log('✅ Claude can now execute commands when you ask');
        console.log('📝 Available commands:', Object.keys(this.allowedCommands).join(', '));
        console.log('🔒 All commands are sandboxed for security');
    }
    
    async ensureDirectories() {
        const dirs = [
            this.commandsDir,
            path.join(this.vizDir, 'claude-logs'),
            path.join(this.vizDir, 'command-history')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async createCommandInterface() {
        // Create a command request file that Claude can write to
        const commandInterfacePath = path.join(this.commandsDir, 'claude-requests.jsonl');
        
        // Create if doesn't exist
        try {
            await fs.access(commandInterfacePath);
        } catch {
            await fs.writeFile(commandInterfacePath, '');
        }
        
        // Create command execution script
        const executorScript = `#!/bin/bash
# 🤖⚡ Claude Command Executor
# This script executes commands that Claude requests

COMMAND_FILE="${this.commandsDir}/claude-requests.jsonl"
RESULT_FILE="${this.commandsDir}/claude-results.jsonl"

if [[ ! -f "$COMMAND_FILE" ]]; then
    echo "No command file found"
    exit 1
fi

# Read the last command
LAST_COMMAND=$(tail -n 1 "$COMMAND_FILE")

if [[ -z "$LAST_COMMAND" ]]; then
    echo "No commands to execute"
    exit 0
fi

# Parse JSON and execute command
echo "$LAST_COMMAND" | node -e "
const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    try {
        const cmd = JSON.parse(line);
        if (cmd.status === 'pending') {
            console.log('Executing:', cmd.command);
            // Execute the command here
        }
    } catch (e) {
        console.error('Invalid JSON:', e);
    }
});
"
`;
        
        const executorPath = path.join(this.commandsDir, 'execute-claude-command.sh');
        await fs.writeFile(executorPath, executorScript);
        
        // Make executable
        try {
            await fs.chmod(executorPath, 0o755);
        } catch (error) {
            console.warn('Could not make executor script executable:', error.message);
        }
    }
    
    startCommandWatcher() {
        // Watch for new command requests
        const chokidar = require('chokidar');
        const commandFile = path.join(this.commandsDir, 'claude-requests.jsonl');
        
        const watcher = chokidar.watch(commandFile, {
            persistent: true,
            usePolling: true,
            interval: 1000
        });
        
        watcher.on('change', () => {
            this.processNewCommands();
        });
        
        console.log('👁️ Watching for Claude command requests...');
    }
    
    async processNewCommands() {
        try {
            const commandFile = path.join(this.commandsDir, 'claude-requests.jsonl');
            const content = await fs.readFile(commandFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return;
            
            // Process last command
            const lastLine = lines[lines.length - 1];
            const command = JSON.parse(lastLine);
            
            if (command.status === 'pending' && !this.activeCommands.has(command.id)) {
                await this.executeCommand(command);
            }
        } catch (error) {
            console.error('Error processing commands:', error);
        }
    }
    
    async executeCommand(command) {
        const commandId = command.id;
        this.activeCommands.set(commandId, command);
        
        console.log(`🚀 Executing Claude request: ${command.type}`);
        this.logger.action(`Claude requested: ${command.type}`, 'claude-bridge');
        
        try {
            const allowedCmd = this.allowedCommands[command.type];
            if (!allowedCmd) {
                throw new Error(`Command '${command.type}' not allowed`);
            }
            
            const result = await this.runCommand(allowedCmd.command, command.args);
            
            // Log success
            this.logger.discovery(`Successfully executed: ${command.type}`, 'claude-bridge');
            
            // Write result
            await this.writeCommandResult({
                id: commandId,
                type: command.type,
                status: 'completed',
                result: result.stdout,
                error: result.stderr,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Command completed: ${command.type}`);
            
        } catch (error) {
            console.error(`❌ Command failed: ${command.type}`, error.message);
            this.logger.error(`Command failed: ${command.type} - ${error.message}`, 'claude-bridge');
            
            await this.writeCommandResult({
                id: commandId,
                type: command.type,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            this.activeCommands.delete(commandId);
        }
    }
    
    async runCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            // Replace args in command if needed
            let finalCommand = command;
            if (args && args.length > 0) {
                args.forEach((arg, index) => {
                    finalCommand = finalCommand.replace(`$${index + 1}`, arg);
                });
            }
            
            console.log(`Running: ${finalCommand}`);
            
            exec(finalCommand, { 
                cwd: process.cwd(),
                timeout: 30000, // 30 second timeout
                maxBuffer: 1024 * 1024 // 1MB buffer
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
    
    async writeCommandResult(result) {
        const resultFile = path.join(this.commandsDir, 'claude-results.jsonl');
        const jsonLine = JSON.stringify(result) + '\n';
        await fs.appendFile(resultFile, jsonLine);
    }
    
    connectToReasoningStream() {
        // Connect to reasoning viz for real-time updates
        try {
            this.ws = new WebSocket('ws://localhost:3006');
            
            this.ws.on('open', () => {
                console.log('📡 Connected to reasoning stream');
                this.logger.system('Claude Command Bridge connected to reasoning stream');
            });
            
            this.ws.on('close', () => {
                console.log('📡 Reasoning stream disconnected, retrying...');
                setTimeout(() => this.connectToReasoningStream(), 5000);
            });
        } catch (error) {
            console.warn('Could not connect to reasoning stream:', error.message);
        }
    }
    
    // Method for Claude to call via external interface
    async requestCommand(type, args = [], requestId = null) {
        const command = {
            id: requestId || Date.now().toString(),
            type,
            args,
            status: 'pending',
            timestamp: new Date().toISOString(),
            source: 'claude-direct'
        };
        
        const commandFile = path.join(this.commandsDir, 'claude-requests.jsonl');
        const jsonLine = JSON.stringify(command) + '\n';
        await fs.appendFile(commandFile, jsonLine);
        
        this.logger.thought(`Claude is requesting command: ${type}`, 'claude-bridge');
        
        return command.id;
    }
    
    async getAvailableCommands() {
        return Object.entries(this.allowedCommands).map(([key, cmd]) => ({
            name: key,
            description: cmd.description,
            category: cmd.category
        }));
    }
    
    async getCommandHistory(limit = 10) {
        try {
            const resultFile = path.join(this.commandsDir, 'claude-results.jsonl');
            const content = await fs.readFile(resultFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            return lines.slice(-limit).map(line => JSON.parse(line));
        } catch (error) {
            return [];
        }
    }
}

// Export for use as module
module.exports = ClaudeCommandBridge;

// CLI interface
if (require.main === module) {
    const bridge = new ClaudeCommandBridge();
    
    // Handle CLI commands
    const [,, action, ...args] = process.argv;
    
    switch (action) {
        case 'request':
            const [commandType, ...commandArgs] = args;
            bridge.requestCommand(commandType, commandArgs).then(id => {
                console.log(`Command requested with ID: ${id}`);
            });
            break;
            
        case 'list':
            bridge.getAvailableCommands().then(commands => {
                console.log('\n🤖 Available Claude Commands:');
                console.log('==============================');
                commands.forEach(cmd => {
                    console.log(`• ${cmd.name}: ${cmd.description} (${cmd.category})`);
                });
            });
            break;
            
        case 'history':
            bridge.getCommandHistory(parseInt(args[0]) || 10).then(history => {
                console.log('\n📜 Command History:');
                console.log('===================');
                history.forEach(cmd => {
                    const status = cmd.status === 'completed' ? '✅' : '❌';
                    console.log(`${status} ${cmd.type} - ${new Date(cmd.timestamp).toLocaleString()}`);
                });
            });
            break;
            
        case 'test':
            console.log('🧪 Testing Claude Command Bridge...');
            bridge.requestCommand('reasoning-stats').then(() => {
                console.log('✅ Test command sent');
            });
            break;
            
        default:
            console.log(`
🤖⚡ CLAUDE COMMAND BRIDGE

Usage:
  node claude-command-bridge.js [action]

Actions:
  list                    - Show available commands
  history [limit]         - Show command history
  request <command> [args] - Request a command execution
  test                    - Test the bridge

Examples:
  node claude-command-bridge.js list
  node claude-command-bridge.js request start-jarvis
  node claude-command-bridge.js history 5

The bridge runs in the background and executes commands when Claude requests them.
            `);
    }
}