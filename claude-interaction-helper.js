#!/usr/bin/env node

/**
 * 🗣️🤖 CLAUDE INTERACTION HELPER
 * ===============================
 * Makes it easy for users to ask Claude to execute commands
 * - Natural language command parsing
 * - Safe command execution
 * - Real-time feedback to user
 */

const fs = require('fs').promises;
const path = require('path');
const ClaudeCommandBridge = require('./claude-command-bridge');

class ClaudeInteractionHelper {
    constructor() {
        this.bridge = new ClaudeCommandBridge();
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.conversationFile = path.join(this.vizDir, 'claude-conversations.jsonl');
        this.logger = require('./reasoning-logger');
        
        // Command patterns that users might say
        this.commandPatterns = {
            'start-jarvis': [
                /start.*jarvis/i,
                /launch.*hud/i,
                /activate.*jarvis/i,
                /turn.*on.*jarvis/i,
                /open.*jarvis/i,
                /boot.*up.*jarvis/i
            ],
            'stop-jarvis': [
                /stop.*jarvis/i,
                /shutdown.*jarvis/i,
                /turn.*off.*jarvis/i,
                /quit.*jarvis/i,
                /close.*jarvis/i
            ],
            'activate-hud': [
                /activate.*hud/i,
                /show.*hud/i,
                /turn.*on.*hud/i,
                /enable.*overlay/i,
                /display.*hud/i
            ],
            'show-fog-of-war': [
                /show.*fog.*war/i,
                /open.*fog.*war/i,
                /fog.*war.*explorer/i,
                /3d.*explorer/i,
                /website.*exploration/i
            ],
            'show-boss-room': [
                /show.*boss.*room/i,
                /open.*boss.*room/i,
                /cursor.*overlay/i,
                /boss.*room.*cursor/i,
                /environmental.*cursor/i
            ],
            'reasoning-stats': [
                /reasoning.*stats/i,
                /show.*stats/i,
                /reasoning.*statistics/i,
                /thought.*stats/i,
                /how.*many.*thoughts/i
            ],
            'verify-system': [
                /verify.*system/i,
                /check.*system/i,
                /system.*status/i,
                /test.*system/i,
                /system.*health/i
            ],
            'ai-context': [
                /ai.*context/i,
                /get.*context/i,
                /reasoning.*context/i,
                /copy.*context/i,
                /share.*context/i
            ]
        };
        
        this.init();
    }
    
    async init() {
        await fs.mkdir(path.dirname(this.conversationFile), { recursive: true });
        
        console.log('🗣️🤖 CLAUDE INTERACTION HELPER READY');
        console.log('=====================================');
        console.log('💬 Users can now ask Claude to execute commands naturally');
        console.log('🎯 Example: "Hey Claude, start Jarvis for me"');
        console.log('🔍 Monitoring for command requests...');
    }
    
    async parseUserMessage(message, userId = 'user') {
        const timestamp = new Date().toISOString();
        
        // Log the conversation
        await this.logConversation({
            id: Date.now(),
            timestamp,
            role: 'user',
            userId,
            message: message.trim(),
            type: 'user_request'
        });
        
        this.logger.userMessage(message);
        
        // Check if message contains a command request
        const detectedCommand = this.detectCommand(message);
        
        if (detectedCommand) {
            console.log(`🎯 Detected command request: ${detectedCommand.command}`);
            this.logger.discovery(`User requested command: ${detectedCommand.command}`, 'claude-interaction');
            
            // Execute the command
            const commandId = await this.bridge.requestCommand(detectedCommand.command, detectedCommand.args);
            
            // Prepare Claude's response
            const response = await this.generateClaudeResponse(detectedCommand, commandId);
            
            // Log Claude's response
            await this.logConversation({
                id: Date.now() + 1,
                timestamp: new Date().toISOString(),
                role: 'claude',
                userId,
                message: response,
                type: 'command_response',
                commandId,
                command: detectedCommand.command
            });
            
            this.logger.aiResponse(response, 'claude');
            
            return {
                hasCommand: true,
                command: detectedCommand,
                commandId,
                response
            };
        }
        
        return {
            hasCommand: false,
            message: message
        };
    }
    
    detectCommand(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check each command pattern
        for (const [command, patterns] of Object.entries(this.commandPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return {
                        command,
                        confidence: this.calculateConfidence(message, pattern),
                        matchedPattern: pattern.source,
                        args: this.extractArgs(message, command)
                    };
                }
            }
        }
        
        // Check for direct command mentions
        const availableCommands = Object.keys(this.commandPatterns);
        for (const command of availableCommands) {
            if (lowerMessage.includes(command.replace('-', ' '))) {
                return {
                    command,
                    confidence: 0.7,
                    matchedPattern: 'direct_mention',
                    args: []
                };
            }
        }
        
        return null;
    }
    
    calculateConfidence(message, pattern) {
        // Simple confidence calculation based on pattern match
        const matches = message.match(pattern);
        if (!matches) return 0;
        
        const matchLength = matches[0].length;
        const messageLength = message.length;
        
        return Math.min(0.9, (matchLength / messageLength) * 2);
    }
    
    extractArgs(message, command) {
        // Extract arguments based on command type
        const args = [];
        
        switch (command) {
            case 'reasoning-stats':
                // Look for time periods
                const timeMatch = message.match(/(?:last|past)\s+(\d+)\s+(minutes?|hours?|days?)/i);
                if (timeMatch) {
                    args.push(`${timeMatch[1]}${timeMatch[2][0]}`); // e.g., "5m", "2h", "1d"
                }
                break;
                
            case 'ai-context':
                // Look for entry count
                const countMatch = message.match(/(\d+)\s+(?:entries|thoughts|items)/i);
                if (countMatch) {
                    args.push(countMatch[1]);
                }
                break;
        }
        
        return args;
    }
    
    async generateClaudeResponse(detectedCommand, commandId) {
        const command = detectedCommand.command;
        const confidence = detectedCommand.confidence;
        
        // Create natural responses based on command
        const responses = {
            'start-jarvis': [
                '🦾🤖 Absolutely! Starting up the Jarvis HUD system for you right now...',
                '🚀 Firing up Jarvis! Give me a moment to initialize all the systems...',
                '⚡ On it! Booting up your Iron Man HUD interface...'
            ],
            'stop-jarvis': [
                '🛑 Roger that! Shutting down Jarvis HUD gracefully...',
                '👋 Powering down the Jarvis system as requested...',
                '⚡ Deactivating all Jarvis components...'
            ],
            'activate-hud': [
                '🎯 Activating the holographic HUD overlay on all your screens!',
                '👁️ Bringing up the heads-up display interface...',
                '🌟 HUD overlay incoming! You should see it appear shortly...'
            ],
            'show-fog-of-war': [
                '🌫️ Opening the 3D fog of war explorer! Time for some website exploration...',
                '🎮 Launching the fog of war interface - prepare for adventure!',
                '🗺️ Fog of war explorer is loading up for you...'
            ],
            'show-boss-room': [
                '👑 Opening the boss room cursor overlay! Your cursor is about to get an upgrade...',
                '🎭 Activating environmental cursor themes...',
                '⚔️ Boss room interface loading - choose your cursor destiny!'
            ],
            'reasoning-stats': [
                '📊 Pulling up your reasoning statistics right now...',
                '🧠 Let me check your thought patterns and stats...',
                '📈 Gathering your reasoning data - interesting insights coming up!'
            ],
            'verify-system': [
                '🔍 Running a full system verification check...',
                '⚙️ Checking all components and integrations...',
                '🛡️ System health check in progress...'
            ],
            'ai-context': [
                '🤖 Generating your current reasoning context for AI sharing...',
                '📋 Preparing your thought context - this will help AIs understand you better!',
                '🧠 Extracting your reasoning patterns for AI conversation context...'
            ]
        };
        
        const commandResponses = responses[command] || [
            `🤖 Executing ${command} command for you...`
        ];
        
        const response = commandResponses[Math.floor(Math.random() * commandResponses.length)];
        
        // Add confidence indicator if low
        if (confidence < 0.8) {
            return response + '\\n\\n(If this isn\\'t what you meant, just let me know!)';
        }
        
        return response;
    }
    
    async logConversation(entry) {
        const jsonLine = JSON.stringify(entry) + '\\n';
        await fs.appendFile(this.conversationFile, jsonLine);
    }
    
    async getRecentConversations(limit = 10) {
        try {
            const content = await fs.readFile(this.conversationFile, 'utf8');
            const lines = content.trim().split('\\n').filter(line => line.trim());
            
            return lines.slice(-limit).map(line => JSON.parse(line));
        } catch (error) {
            return [];
        }
    }
    
    // Method to simulate Claude processing a user message
    async simulateClaudeInteraction(userMessage, userId = 'user') {
        console.log(`\\n👤 User: ${userMessage}`);
        
        const result = await this.parseUserMessage(userMessage, userId);
        
        if (result.hasCommand) {
            console.log(`🤖 Claude: ${result.response}`);
            console.log(`⚡ Command ID: ${result.commandId}`);
            
            // Wait a moment and check result
            setTimeout(async () => {
                const history = await this.bridge.getCommandHistory(1);
                if (history.length > 0) {
                    const lastResult = history[0];
                    if (lastResult.status === 'completed') {
                        console.log(`✅ Command completed successfully!`);
                        if (lastResult.result) {
                            console.log(`📄 Output: ${lastResult.result.slice(0, 200)}...`);
                        }
                    } else {
                        console.log(`❌ Command failed: ${lastResult.error}`);
                    }
                }
            }, 5000);
        } else {
            console.log(`🤖 Claude: I understand, but I don't see a specific command to execute. You can ask me to start Jarvis, show the HUD, or run other system commands!`);
        }
        
        return result;
    }
    
    // Create a simple CLI interface for testing
    async startInteractiveCLI() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log(`\\n🗣️🤖 CLAUDE INTERACTION SIMULATOR`);
        console.log(`=================================`);
        console.log(`Type messages as if you're talking to Claude!`);
        console.log(`Examples:`);
        console.log(`  "Hey Claude, start Jarvis for me"`);
        console.log(`  "Can you activate the HUD?"`);
        console.log(`  "Show me the fog of war explorer"`);
        console.log(`  "Check system status"`);
        console.log(`\\nType 'quit' to exit\\n`);
        
        const askQuestion = () => {
            rl.question('You: ', async (message) => {
                if (message.toLowerCase() === 'quit') {
                    rl.close();
                    return;
                }
                
                await this.simulateClaudeInteraction(message);
                console.log(''); // Empty line
                askQuestion();
            });
        };
        
        askQuestion();
    }
}

// Export for use as module
module.exports = ClaudeInteractionHelper;

// CLI interface
if (require.main === module) {
    const helper = new ClaudeInteractionHelper();
    
    const [,, action, ...args] = process.argv;
    
    switch (action) {
        case 'test':
            const testMessage = args.join(' ') || 'start jarvis for me';
            helper.simulateClaudeInteraction(testMessage);
            break;
            
        case 'interactive':
        case 'chat':
            helper.startInteractiveCLI();
            break;
            
        case 'history':
            helper.getRecentConversations(parseInt(args[0]) || 10).then(conversations => {
                console.log('\\n💬 Recent Conversations:');
                console.log('=========================');
                conversations.forEach(conv => {
                    const role = conv.role === 'user' ? '👤' : '🤖';
                    const time = new Date(conv.timestamp).toLocaleTimeString();
                    console.log(`${role} [${time}] ${conv.message.slice(0, 100)}...`);
                });
            });
            break;
            
        case 'patterns':
            console.log('\\n🎯 Command Patterns:');
            console.log('=====================');
            Object.entries(helper.commandPatterns).forEach(([command, patterns]) => {
                console.log(`\\n• ${command}:`);
                patterns.forEach(pattern => {
                    console.log(`  - ${pattern.source}`);
                });
            });
            break;
            
        default:
            console.log(`
🗣️🤖 CLAUDE INTERACTION HELPER

Usage:
  node claude-interaction-helper.js [action]

Actions:
  test [message]     - Test command detection with a message
  interactive        - Start interactive chat simulation
  history [limit]    - Show recent conversations
  patterns          - Show command patterns

Examples:
  node claude-interaction-helper.js test "start jarvis"
  node claude-interaction-helper.js interactive
  node claude-interaction-helper.js history 5

This lets users naturally ask Claude to execute system commands.
            `);
    }
}