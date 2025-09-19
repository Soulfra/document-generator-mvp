#!/usr/bin/env node

/**
 * 🤖💬 CLAUDE INTERACTIVE TERMINAL
 * 
 * Multi-AI Collaboration Terminal with Visual Canvas
 * - Interactive Claude conversation mode
 * - Multi-AI orchestration support
 * - Agent-to-agent communication
 * - Web-based collaborative canvas
 * - Real-time collaboration with multiple AI instances
 */

import { askClaude } from './claude-cli/claude-api.js';
import MultiAIProvider from './claude-cli/multi-ai-provider.js';
import readline from 'readline';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

class ClaudeInteractiveTerminal {
    constructor() {
        this.rl = null;
        this.conversationHistory = [];
        this.sessionStartTime = Date.now();
        this.totalTokens = 0;
        this.activeCollaboration = null;
        this.canvasUrl = null;
        this.currentProvider = 'claude';
        
        // Initialize Multi-AI Provider system
        this.multiAI = new MultiAIProvider();
        this.aiProviders = this.multiAI.providers;
    }
    
    
    showAvailableProviders() {
        console.log('\n🤖 AVAILABLE AI PROVIDERS:');
        for (const [key, provider] of this.aiProviders) {
            const status = provider.available ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${provider.name}`);
            if (provider.available && provider.models) {
                console.log(`     Models: ${Object.keys(provider.models).join(', ')}`);
            }
        }
        console.log('');
    }
    
    async start() {
        this.showWelcome();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '🤖 You: '
        });
        
        // Check if canvas collaboration is available
        await this.checkCanvasAvailability();
        
        this.rl.prompt();
        
        this.rl.on('line', async (input) => {
            const trimmed = input.trim();
            
            if (trimmed === '') {
                this.rl.prompt();
                return;
            }
            
            // Handle special commands
            if (await this.handleCommand(trimmed)) {
                this.rl.prompt();
                return;
            }
            
            // Regular conversation
            await this.processConversation(trimmed);
            this.rl.prompt();
        });
        
        this.rl.on('close', () => {
            this.showGoodbye();
            process.exit(0);
        });
    }
    
    showWelcome() {
        console.log(`
🤖💬 CLAUDE INTERACTIVE TERMINAL
===============================

Welcome to the multi-AI collaboration terminal!

COMMANDS:
  /help          - Show this help
  /providers     - List available AI providers  
  /switch <ai>   - Switch to different AI (claude, gpt, ollama)
  /collab        - Start multi-AI collaboration
  /agent <from> <to> <message> - Agent-to-agent communication
  /canvas        - Open collaborative canvas
  /history       - Show conversation history
  /save          - Save conversation
  /clear         - Clear conversation history
  /stats         - Show session statistics
  /exit          - Exit terminal

MULTI-AI COLLABORATION:
  Type your message and multiple AIs will work together
  Different AIs use separate API keys for independent responses
  Visual canvas available for collaborative building

Ready for AI collaboration! 🚀
        `);
    }
    
    async handleCommand(input) {
        if (!input.startsWith('/')) return false;
        
        const [command, ...args] = input.slice(1).split(' ');
        
        switch (command) {
            case 'help':
                this.showWelcome();
                return true;
                
            case 'providers':
                this.showAvailableProviders();
                return true;
                
            case 'switch':
                await this.switchAIProvider(args[0]);
                return true;
                
            case 'collab':
                await this.startCollaboration();
                return true;
                
            case 'agent':
                await this.handleAgentCommunication(args);
                return true;
                
            case 'canvas':
                await this.openCanvas();
                return true;
                
            case 'history':
                this.showHistory();
                return true;
                
            case 'save':
                this.saveConversation(args[0]);
                return true;
                
            case 'clear':
                this.clearHistory();
                return true;
                
            case 'stats':
                this.showStats();
                return true;
                
            case 'exit':
                this.rl.close();
                return true;
                
            default:
                console.log(`❌ Unknown command: /${command}. Type /help for available commands.`);
                return true;
        }
    }
    
    async processConversation(input) {
        const timestamp = new Date().toISOString();
        
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: input,
            timestamp,
            provider: 'human'
        });
        
        console.log('\n🤖 Claude is thinking...\n');
        
        try {
            // If collaboration mode is active, get responses from multiple AIs
            if (this.activeCollaboration) {
                await this.processCollaborativeResponse(input);
            } else {
                // Single AI response
                await this.processSingleResponse(input);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            
            // Suggest fallback options
            if (error.message.includes('API key')) {
                console.log('\n💡 Try:');
                console.log('  - Set ANTHROPIC_API_KEY environment variable');
                console.log('  - Use /switch ollama for local AI');
                console.log('  - Add API key to .env file');
            }
        }
    }
    
    async processSingleResponse(input) {
        const response = await this.multiAI.askAI(this.currentProvider, input, {
            maxTokens: 4096
        });
        
        const providerName = this.aiProviders.get(this.currentProvider).name;
        console.log(`💬 ${providerName}:`, response);
        console.log('');
        
        // Add response to history
        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            provider: this.currentProvider
        });
        
        this.totalTokens += this.estimateTokens(input + response);
    }
    
    async processCollaborativeResponse(input) {
        const availableProviders = Array.from(this.aiProviders.keys())
            .filter(key => this.aiProviders.get(key).available);
            
        const result = await this.multiAI.collaborativeResponse(input, availableProviders, {
            maxTokens: 2048
        });
        
        // Display responses
        result.responses.forEach(({ name, response }) => {
            console.log(`💬 ${name}:`, response);
            console.log('');
        });
        
        // Add all responses to history
        result.responses.forEach(({ provider, name, response }) => {
            this.conversationHistory.push({
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString(),
                provider,
                ai: name
            });
        });
        
        // Show any errors
        if (result.errors.length > 0) {
            console.log('⚠️  Some AIs were unavailable:');
            result.errors.forEach(({ provider, error }) => {
                console.log(`   ${provider}: ${error}`);
            });
            console.log('');
        }
    }
    
    
    async switchAIProvider(provider) {
        if (!provider) {
            console.log('❌ Please specify a provider: claude, gpt, or ollama');
            return;
        }
        
        if (!this.aiProviders.has(provider)) {
            console.log(`❌ Unknown provider: ${provider}`);
            this.showAvailableProviders();
            return;
        }
        
        const providerInfo = this.aiProviders.get(provider);
        if (!providerInfo.available) {
            console.log(`❌ ${providerInfo.name} is not available (missing API key)`);
            return;
        }
        
        this.currentProvider = provider;
        console.log(`✅ Switched to ${providerInfo.name}`);
        console.log(`   Current model: ${providerInfo.defaultModel}`);
        
        // Turn off collaboration mode when switching
        this.activeCollaboration = null;
    }
    
    async startCollaboration() {
        console.log('🤝 Starting multi-AI collaboration mode...');
        
        const availableProviders = Array.from(this.aiProviders.entries())
            .filter(([key, provider]) => provider.available);
            
        if (availableProviders.length < 2) {
            console.log('❌ Need at least 2 AI providers for collaboration');
            console.log('💡 Set up additional API keys in environment variables');
            return;
        }
        
        this.activeCollaboration = {
            providers: availableProviders.map(([key]) => key),
            startTime: Date.now()
        };
        
        console.log(`✅ Collaboration mode active with ${availableProviders.length} AIs:`);
        availableProviders.forEach(([key, provider]) => {
            console.log(`   🤖 ${provider.name}`);
        });
        console.log('');
        console.log('💡 Type your message and all AIs will respond collaboratively');
        console.log('💡 Use /collab again to disable collaboration mode');
    }
    
    async handleAgentCommunication(args) {
        if (args.length < 3) {
            console.log('❌ Usage: /agent <sender> <receiver> <message>');
            console.log('Example: /agent claude gpt "Can you help me analyze this code?"');
            return;
        }
        
        const sender = args[0];
        const receiver = args[1];
        const message = args.slice(2).join(' ');
        
        if (!this.aiProviders.has(sender)) {
            console.log(`❌ Unknown sender AI: ${sender}`);
            this.showAvailableProviders();
            return;
        }
        
        if (!this.aiProviders.has(receiver)) {
            console.log(`❌ Unknown receiver AI: ${receiver}`);
            this.showAvailableProviders();
            return;
        }
        
        const senderInfo = this.aiProviders.get(sender);
        const receiverInfo = this.aiProviders.get(receiver);
        
        if (!receiverInfo.available) {
            console.log(`❌ ${receiverInfo.name} is not available (missing API key)`);
            return;
        }
        
        try {
            console.log(`🤖➡️🤖 ${senderInfo.name} → ${receiverInfo.name}`);
            console.log(`📝 Message: "${message}"`);
            console.log('');
            
            const result = await this.multiAI.agentToAgentCommunication(sender, receiver, message, {
                conversationContext: this.conversationHistory.slice(-5) // Last 5 messages for context
            });
            
            console.log(`💬 ${receiverInfo.name} responds:`);
            console.log(result.response);
            console.log('');
            
            // Add agent communication to history
            this.conversationHistory.push({
                role: 'agent-communication',
                content: `${senderInfo.name} → ${receiverInfo.name}: "${message}" | Response: "${result.response}"`,
                timestamp: result.timestamp,
                sender,
                receiver,
                originalMessage: message,
                response: result.response
            });
            
            console.log('✅ Agent-to-agent communication complete');
            
        } catch (error) {
            console.error('❌ Agent communication failed:', error.message);
        }
    }
    
    async checkCanvasAvailability() {
        // Check if canvas service is running
        try {
            const response = await fetch('http://localhost:9000/api/ai-status');
            if (response.ok) {
                this.canvasUrl = 'http://localhost:9000';
                console.log('🎨 Collaborative canvas available at:', this.canvasUrl);
            } else {
                console.log('⚠️  Canvas server not responding');
            }
        } catch (error) {
            console.log('⚠️  Collaborative canvas not available - start with: node claude-canvas-server.js');
            this.canvasUrl = 'http://localhost:9000'; // Set anyway for manual access
        }
    }
    
    async openCanvas() {
        if (!this.canvasUrl) {
            console.log('❌ Collaborative canvas not available');
            console.log('💡 Start the canvas service first');
            return;
        }
        
        console.log('🎨 Opening collaborative canvas...');
        console.log(`🌐 Canvas URL: ${this.canvasUrl}`);
        
        // Try to open in browser
        try {
            const { platform } = process;
            let command;
            
            if (platform === 'darwin') command = 'open';
            else if (platform === 'win32') command = 'start';
            else command = 'xdg-open';
            
            spawn(command, [this.canvasUrl], { detached: true });
            console.log('✅ Canvas opened in browser');
        } catch (error) {
            console.log('⚠️  Could not auto-open browser. Please visit:', this.canvasUrl);
        }
    }
    
    showHistory() {
        if (this.conversationHistory.length === 0) {
            console.log('📝 No conversation history yet');
            return;
        }
        
        console.log('📝 CONVERSATION HISTORY:');
        console.log('========================');
        
        this.conversationHistory.forEach((entry, index) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const role = entry.role === 'user' ? '👤 You' : `🤖 ${entry.ai || entry.provider}`;
            console.log(`\\n[${time}] ${role}:`);
            console.log(entry.content);
        });
        console.log('');
    }
    
    saveConversation(filename) {
        const name = filename || `conversation_${Date.now()}.json`;
        const data = {
            sessionInfo: {
                startTime: this.sessionStartTime,
                endTime: Date.now(),
                totalMessages: this.conversationHistory.length,
                totalTokens: this.totalTokens
            },
            conversation: this.conversationHistory
        };
        
        try {
            writeFileSync(name, JSON.stringify(data, null, 2));
            console.log(`✅ Conversation saved to: ${name}`);
        } catch (error) {
            console.error('❌ Failed to save conversation:', error.message);
        }
    }
    
    clearHistory() {
        this.conversationHistory = [];
        console.log('✅ Conversation history cleared');
    }
    
    showStats() {
        const duration = Date.now() - this.sessionStartTime;
        const minutes = Math.floor(duration / 60000);
        const messageCount = this.conversationHistory.length;
        const userMessages = this.conversationHistory.filter(m => m.role === 'user').length;
        const aiMessages = this.conversationHistory.filter(m => m.role === 'assistant').length;
        
        console.log('📊 SESSION STATISTICS:');
        console.log('======================');
        console.log(`⏱️  Session duration: ${minutes} minutes`);
        console.log(`💬 Total messages: ${messageCount}`);
        console.log(`👤 Your messages: ${userMessages}`);
        console.log(`🤖 AI responses: ${aiMessages}`);
        console.log(`🔢 Estimated tokens: ${this.totalTokens}`);
        
        if (this.activeCollaboration) {
            console.log(`🤝 Collaboration: Active (${this.activeCollaboration.providers.length} AIs)`);
        }
        console.log('');
    }
    
    estimateTokens(text) {
        // Rough token estimation (1 token ≈ 4 characters)
        return Math.ceil(text.length / 4);
    }
    
    showGoodbye() {
        const duration = Date.now() - this.sessionStartTime;
        const minutes = Math.floor(duration / 60000);
        
        console.log(`\\n👋 Session ended after ${minutes} minutes`);
        console.log(`💬 Total messages: ${this.conversationHistory.length}`);
        console.log('🤖 Thanks for using Claude Interactive Terminal!');
        console.log('✨ See you next time!\\n');
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const terminal = new ClaudeInteractiveTerminal();
    
    // Handle process signals
    process.on('SIGINT', () => {
        console.log('\\n\\n🛑 Received interrupt signal');
        terminal.rl?.close();
    });
    
    process.on('SIGTERM', () => {
        console.log('\\n\\n🛑 Received termination signal');
        terminal.rl?.close();
    });
    
    // Start the terminal
    terminal.start().catch(error => {
        console.error('❌ Failed to start terminal:', error);
        process.exit(1);
    });
}

export default ClaudeInteractiveTerminal;