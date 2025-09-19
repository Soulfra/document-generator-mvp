#!/usr/bin/env node

/**
 * 💬🤖 ASK CLAUDE INTERFACE
 * =========================
 * Simple command-line interface to ask Claude for commands
 * This simulates the user asking Claude in a natural way
 */

const ClaudeInteractionHelper = require('./claude-interaction-helper');
const readline = require('readline');

class AskClaudeInterface {
    constructor() {
        this.helper = new ClaudeInteractionHelper();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.setupInterface();
    }
    
    setupInterface() {
        console.log(`
🗣️🤖 ASK CLAUDE INTERFACE
=========================

This simulates asking me (Claude) to execute commands on your system.
Just type what you'd normally say to me!

Examples:
  "start jarvis"
  "hey claude, activate the hud"
  "can you show me the fog of war?"
  "check system status"
  "open boss room cursor"

Type 'help' for more commands, 'quit' to exit
        `);
        
        this.askQuestion();
    }
    
    askQuestion() {
        this.rl.question('\n💬 Ask Claude: ', async (input) => {
            const message = input.trim();
            
            if (message.toLowerCase() === 'quit' || message.toLowerCase() === 'exit') {
                console.log('\n👋 Goodbye! Claude Command Bridge is still running in the background.');
                this.rl.close();
                return;
            }
            
            if (message.toLowerCase() === 'help') {
                this.showHelp();
                this.askQuestion();
                return;
            }
            
            if (message.toLowerCase() === 'status') {
                await this.showStatus();
                this.askQuestion();
                return;
            }
            
            if (message.toLowerCase() === 'history') {
                await this.showHistory();
                this.askQuestion();
                return;
            }
            
            if (!message) {
                console.log('🤖 Claude: Please ask me something! Try "start jarvis" or "help"');
                this.askQuestion();
                return;
            }
            
            // Process the request through Claude interaction helper
            await this.processClaudeRequest(message);
            this.askQuestion();
        });
    }
    
    async processClaudeRequest(message) {
        console.log(`\n🤖 Claude: Let me help you with that...`);
        
        try {
            const result = await this.helper.parseUserMessage(message);
            
            if (result.hasCommand) {
                console.log(`🤖 ${result.response}`);
                console.log(`⚡ Executing command: ${result.command.command}`);
                
                // Show real-time feedback
                this.showExecutionFeedback(result.commandId);
            } else {
                console.log(`🤖 I understand your message, but I don't see a specific command to execute.`);
                console.log(`🤖 Try asking me to:`);
                console.log(`   • "start jarvis" - Launch the HUD system`);
                console.log(`   • "activate hud" - Show the overlay`);
                console.log(`   • "show fog of war" - Open 3D explorer`);
                console.log(`   • "check system" - Verify everything is working`);
            }
        } catch (error) {
            console.log(`🤖 I encountered an error: ${error.message}`);
            console.log(`🤖 The command bridge might not be running. Try: ./start-claude-bridge.sh`);
        }
    }
    
    async showExecutionFeedback(commandId) {
        // Wait and show result
        setTimeout(async () => {
            try {
                const history = await this.helper.bridge.getCommandHistory(5);
                const commandResult = history.find(h => h.id === commandId);
                
                if (commandResult) {
                    if (commandResult.status === 'completed') {
                        console.log(`✅ Command completed successfully!`);
                        if (commandResult.result && commandResult.result.trim()) {
                            console.log(`📄 Output:`);
                            console.log(commandResult.result.slice(0, 500));
                            if (commandResult.result.length > 500) {
                                console.log('... (truncated)');
                            }
                        }
                    } else if (commandResult.status === 'failed') {
                        console.log(`❌ Command failed: ${commandResult.error}`);
                    } else {
                        console.log(`⏳ Command is still running...`);
                    }
                } else {
                    console.log(`⏳ Command is being processed...`);
                }
            } catch (error) {
                console.log(`🤖 I'm still working on your request...`);
            }
        }, 3000);
    }
    
    showHelp() {
        console.log(`
🤖 CLAUDE HELP
===============

Available Commands:
  start jarvis        → Start the Jarvis HUD system
  stop jarvis         → Stop the Jarvis HUD system  
  activate hud        → Turn on the HUD overlay
  show fog of war     → Open 3D website explorer
  show boss room      → Open cursor overlay
  reasoning stats     → Show thought statistics
  check system        → Verify system health
  ai context          → Get reasoning context for AIs

System Commands:
  help               → Show this help
  status             → Show system status
  history            → Show recent commands
  quit/exit          → Exit this interface

Natural Language:
You can ask in natural ways like:
  "hey claude, can you start jarvis for me?"
  "show me the hud overlay"
  "i want to see the fog of war explorer"
  "check if everything is working"
        `);
    }
    
    async showStatus() {
        console.log(`\n📊 SYSTEM STATUS`);
        console.log(`================`);
        
        try {
            const availableCommands = await this.helper.bridge.getAvailableCommands();
            console.log(`🤖 Available commands: ${availableCommands.length}`);
            
            const recentHistory = await this.helper.bridge.getCommandHistory(5);
            console.log(`📜 Recent executions: ${recentHistory.length}`);
            
            const conversations = await this.helper.getRecentConversations(5);
            console.log(`💬 Recent conversations: ${conversations.length}`);
            
            // Check if bridge is running
            const fs = require('fs');
            const path = require('path');
            const pidFile = path.join('.reasoning-viz', 'claude-bridge.pid');
            
            if (fs.existsSync(pidFile)) {
                const pid = fs.readFileSync(pidFile, 'utf8').trim();
                try {
                    process.kill(pid, 0); // Check if process exists
                    console.log(`🔄 Command bridge: ✅ Running (PID: ${pid})`);
                } catch {
                    console.log(`🔄 Command bridge: ❌ Not running`);
                }
            } else {
                console.log(`🔄 Command bridge: ❌ Not started`);
            }
            
        } catch (error) {
            console.log(`❌ Error checking status: ${error.message}`);
        }
    }
    
    async showHistory() {
        console.log(`\n📜 RECENT COMMAND HISTORY`);
        console.log(`=========================`);
        
        try {
            const history = await this.helper.bridge.getCommandHistory(10);
            
            if (history.length === 0) {
                console.log(`No commands executed yet.`);
                return;
            }
            
            history.forEach((cmd, index) => {
                const status = cmd.status === 'completed' ? '✅' : 
                              cmd.status === 'failed' ? '❌' : '⏳';
                const time = new Date(cmd.timestamp).toLocaleString();
                console.log(`${status} ${cmd.type} - ${time}`);
                
                if (cmd.error) {
                    console.log(`    Error: ${cmd.error}`);
                }
            });
        } catch (error) {
            console.log(`❌ Error getting history: ${error.message}`);
        }
    }
}

// Start the interface
new AskClaudeInterface();