#!/usr/bin/env node

/**
 * 🤖📨 CLAUDE RESPONSE HANDLER
 * ============================
 * This is what actually gets triggered when I (Claude) want to execute a command
 * It parses my response and translates it into system actions
 */

const fs = require('fs').promises;
const path = require('path');
const ClaudeCommandBridge = require('./claude-command-bridge');

class ClaudeResponseHandler {
    constructor() {
        this.bridge = new ClaudeCommandBridge();
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.logger = require('./reasoning-logger');
        
        // Patterns to detect when I'm trying to execute commands
        this.executionPatterns = {
            'start-jarvis': [
                /starting.*jarvis/i,
                /firing.*up.*jarvis/i,
                /booting.*up.*jarvis/i,
                /initializing.*jarvis/i,
                /launching.*jarvis/i
            ],
            'activate-hud': [
                /activating.*hud/i,
                /bringing.*up.*hud/i,
                /hud.*overlay.*incoming/i,
                /displaying.*hud/i
            ],
            'show-fog-of-war': [
                /opening.*fog.*war/i,
                /launching.*fog.*war/i,
                /fog.*war.*loading/i
            ],
            'show-boss-room': [
                /opening.*boss.*room/i,
                /activating.*cursor/i,
                /boss.*room.*loading/i
            ],
            'reasoning-stats': [
                /pulling.*stats/i,
                /checking.*patterns/i,
                /gathering.*data/i
            ],
            'verify-system': [
                /running.*verification/i,
                /checking.*components/i,
                /system.*health.*check/i
            ],
            'ai-context': [
                /generating.*context/i,
                /extracting.*patterns/i,
                /preparing.*context/i
            ]
        };
        
        this.init();
    }
    
    async init() {
        console.log('🤖📨 CLAUDE RESPONSE HANDLER READY');
        console.log('===================================');
        console.log('📥 Waiting for Claude responses to process...');
    }
    
    // This is the main method that gets called when I respond
    async handleClaudeResponse(responseText, context = {}) {
        console.log('🤖 Processing Claude response...');
        this.logger.aiResponse(responseText, 'claude');
        
        const detectedActions = this.detectExecutionIntents(responseText);
        
        if (detectedActions.length > 0) {
            console.log(`⚡ Detected ${detectedActions.length} execution intent(s)`);
            
            for (const action of detectedActions) {
                await this.executeDetectedAction(action, context);
            }
            
            return {
                hasActions: true,
                actions: detectedActions,
                originalResponse: responseText
            };
        }
        
        return {
            hasActions: false,
            originalResponse: responseText
        };
    }
    
    detectExecutionIntents(responseText) {
        const detectedActions = [];
        
        for (const [command, patterns] of Object.entries(this.executionPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(responseText)) {
                    detectedActions.push({
                        command,
                        confidence: this.calculatePatternConfidence(responseText, pattern),
                        matchedText: this.extractMatchedText(responseText, pattern),
                        pattern: pattern.source
                    });
                    break; // Only match once per command
                }
            }
        }
        
        return detectedActions;
    }
    
    calculatePatternConfidence(text, pattern) {
        const matches = text.match(pattern);
        if (!matches) return 0;
        
        // Higher confidence for longer matches and specific keywords
        let confidence = 0.7;
        
        if (matches[0].length > 15) confidence += 0.1;
        if (text.includes('right now') || text.includes('immediately')) confidence += 0.1;
        if (text.includes('!')) confidence += 0.05;
        
        return Math.min(0.95, confidence);
    }
    
    extractMatchedText(text, pattern) {
        const match = text.match(pattern);
        return match ? match[0] : '';
    }
    
    async executeDetectedAction(action, context) {
        console.log(`🚀 Executing detected action: ${action.command} (confidence: ${action.confidence.toFixed(2)})`);
        
        this.logger.action(`Auto-executing: ${action.command}`, 'claude-response');
        
        try {
            const commandId = await this.bridge.requestCommand(
                action.command, 
                context.args || [], 
                `claude-auto-${Date.now()}`
            );
            
            console.log(`⚡ Command queued with ID: ${commandId}`);
            
            // Log the execution
            await this.logExecution({
                commandId,
                action: action.command,
                confidence: action.confidence,
                matchedText: action.matchedText,
                timestamp: new Date().toISOString(),
                status: 'queued'
            });
            
            return commandId;
            
        } catch (error) {
            console.error(`❌ Failed to execute action: ${error.message}`);
            this.logger.error(`Action execution failed: ${action.command}`, error);
        }
    }
    
    async logExecution(execution) {
        const logFile = path.join(this.vizDir, 'claude-executions.jsonl');
        const jsonLine = JSON.stringify(execution) + '\n';
        await fs.appendFile(logFile, jsonLine);
    }
    
    // Simulation method - this shows how Claude responses would be processed
    async simulateClaudeResponse(responseText, userContext = {}) {
        console.log(`\n🤖 Simulating Claude Response:`);
        console.log(`"${responseText}"`);
        console.log(`\n📥 Processing response...`);
        
        const result = await this.handleClaudeResponse(responseText, userContext);
        
        if (result.hasActions) {
            console.log(`\n⚡ Actions Detected:`);
            result.actions.forEach((action, index) => {
                console.log(`  ${index + 1}. ${action.command} (${(action.confidence * 100).toFixed(1)}% confidence)`);
                console.log(`     Matched: "${action.matchedText}"`);
            });
        } else {
            console.log(`\n💬 No executable actions detected in response.`);
        }
        
        return result;
    }
    
    // Method to integrate with actual Claude API responses
    async monitorClaudeResponses() {
        // This would integrate with the actual Claude conversation
        // For now, we'll simulate by watching a file
        const responseFile = path.join(this.vizDir, 'claude-responses.jsonl');
        
        try {
            await fs.access(responseFile);
        } catch {
            await fs.writeFile(responseFile, '');
        }
        
        const chokidar = require('chokidar');
        const watcher = chokidar.watch(responseFile, {
            persistent: true,
            usePolling: true,
            interval: 1000
        });
        
        watcher.on('change', async () => {
            await this.processNewResponses();
        });
        
        console.log('👁️ Monitoring Claude responses for execution intents...');
    }
    
    async processNewResponses() {
        try {
            const responseFile = path.join(this.vizDir, 'claude-responses.jsonl');
            const content = await fs.readFile(responseFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return;
            
            // Process only the last response
            const lastLine = lines[lines.length - 1];
            const response = JSON.parse(lastLine);
            
            if (response.processed) return; // Already processed
            
            await this.handleClaudeResponse(response.text, response.context || {});
            
            // Mark as processed
            response.processed = true;
            const updatedLines = [...lines.slice(0, -1), JSON.stringify(response)];
            await fs.writeFile(responseFile, updatedLines.join('\n') + '\n');
            
        } catch (error) {
            console.error('Error processing responses:', error);
        }
    }
    
    // Helper method to manually trigger Claude response
    async triggerClaudeResponse(responseText, context = {}) {
        const responseFile = path.join(this.vizDir, 'claude-responses.jsonl');
        
        const response = {
            id: Date.now(),
            text: responseText,
            context,
            timestamp: new Date().toISOString(),
            processed: false
        };
        
        const jsonLine = JSON.stringify(response) + '\n';
        await fs.appendFile(responseFile, jsonLine);
        
        console.log('📨 Claude response queued for processing');
    }
}

module.exports = ClaudeResponseHandler;

// CLI interface for testing
if (require.main === module) {
    const handler = new ClaudeResponseHandler();
    
    const [,, action, ...args] = process.argv;
    
    switch (action) {
        case 'test':
            const testResponse = args.join(' ') || '🦾🤖 Absolutely! Starting up the Jarvis HUD system for you right now...';
            handler.simulateClaudeResponse(testResponse);
            break;
            
        case 'monitor':
            handler.monitorClaudeResponses();
            console.log('Press Ctrl+C to stop monitoring');
            break;
            
        case 'trigger':
            const responseText = args.join(' ');
            if (responseText) {
                handler.triggerClaudeResponse(responseText).then(() => {
                    console.log('✅ Response triggered');
                });
            } else {
                console.log('Please provide response text');
            }
            break;
            
        case 'examples':
            console.log('\n🎭 Example Claude Responses:');
            console.log('============================');
            
            const examples = [
                '🦾🤖 Absolutely! Starting up the Jarvis HUD system for you right now...',
                '🎯 Activating the holographic HUD overlay on all your screens!',
                '🌫️ Opening the 3D fog of war explorer! Time for some website exploration...',
                '📊 Pulling up your reasoning statistics right now...',
                '🔍 Running a full system verification check...'
            ];
            
            examples.forEach((example, index) => {
                console.log(`\n${index + 1}. "${example}"`);
                handler.detectExecutionIntents(example).forEach(action => {
                    console.log(`   → Would execute: ${action.command}`);
                });
            });
            break;
            
        default:
            console.log(`
🤖📨 CLAUDE RESPONSE HANDLER

Usage:
  node claude-response-handler.js [action]

Actions:
  test [response]    - Test response processing
  monitor            - Monitor for Claude responses
  trigger <response> - Manually trigger a response
  examples           - Show example responses

Examples:
  node claude-response-handler.js test "Starting up Jarvis for you!"
  node claude-response-handler.js monitor
  node claude-response-handler.js examples

This processes Claude responses and automatically executes detected commands.
            `);
    }
}