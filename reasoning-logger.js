#!/usr/bin/env node

/**
 * 🧠📝 REASONING LOGGER
 * ====================
 * Clean JSONL logger that integrates with your development workflow
 * Captures reasoning without polluting your files
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class ReasoningLogger {
    constructor() {
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.logPath = path.join(this.vizDir, 'logs');
        this.sessionId = this.generateSessionId();
        this.buffer = [];
        this.flushInterval = null;
        
        this.init();
    }
    
    async init() {
        await fs.mkdir(this.logPath, { recursive: true });
        
        // Auto-flush buffer every 5 seconds
        this.flushInterval = setInterval(() => {
            this.flush();
        }, 5000);
        
        // Cleanup on exit
        process.on('exit', () => this.flush());
        process.on('SIGINT', () => {
            this.flush();
            process.exit(0);
        });
    }
    
    // Main logging methods
    thought(text, category = 'general') {
        return this.log('thought', text, { category });
    }
    
    action(text, target = null) {
        return this.log('action', text, { target });
    }
    
    exploration(text, area = null) {
        return this.log('exploration', text, { area });
    }
    
    reasoning(text, context = null) {
        return this.log('reasoning', text, { context });
    }
    
    emotion(text, intensity = 'medium') {
        return this.log('emotion', text, { intensity });
    }
    
    discovery(text, significance = 'medium') {
        return this.log('discovery', text, { significance });
    }
    
    system(text, level = 'info') {
        return this.log('system', text, { level });
    }
    
    // Core logging function
    log(type, text, metadata = {}) {
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            session: this.sessionId,
            type,
            text: text.trim(),
            metadata: {
                ...metadata,
                process: process.pid,
                cwd: process.cwd(),
                node_version: process.version
            },
            _schema: {
                version: '1.0',
                format: 'reasoning-stream-jsonl'
            }
        };
        
        this.buffer.push(entry);
        
        // Also output to console with color coding
        this.colorLog(entry);
        
        return entry;
    }
    
    colorLog(entry) {
        const colors = {
            thought: '\x1b[36m',    // Cyan
            action: '\x1b[31m',     // Red
            exploration: '\x1b[35m', // Magenta
            reasoning: '\x1b[34m',   // Blue
            emotion: '\x1b[33m',     // Yellow
            discovery: '\x1b[32m',   // Green
            system: '\x1b[37m',      // White
            reset: '\x1b[0m'
        };
        
        const color = colors[entry.type] || colors.reset;
        const time = new Date(entry.timestamp).toLocaleTimeString();
        
        console.log(`${color}[${time}] ${entry.type.toUpperCase()}: ${entry.text}${colors.reset}`);
    }
    
    async flush() {
        if (this.buffer.length === 0) return;
        
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logPath, `${today}.jsonl`);
        
        const entries = this.buffer.splice(0);
        const jsonlContent = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
        
        try {
            await fs.appendFile(logFile, jsonlContent);
        } catch (error) {
            console.error('Failed to write log:', error);
            // Put entries back if write failed
            this.buffer.unshift(...entries);
        }
    }
    
    generateSessionId() {
        const date = new Date().toISOString().split('T')[0];
        const random = Math.random().toString(36).substr(2, 6);
        return `${date}-${random}`;
    }
    
    // Convenience methods for different contexts
    
    // For development workflow
    dev(text) {
        return this.system(text, 'dev');
    }
    
    debug(text) {
        return this.system(text, 'debug');
    }
    
    error(text, error = null) {
        return this.system(text, 'error', { error: error?.message });
    }
    
    // For AI conversations
    userMessage(text) {
        return this.log('user_message', text, { role: 'user' });
    }
    
    aiResponse(text, ai = 'assistant') {
        return this.log('ai_response', text, { role: 'assistant', ai });
    }
    
    // For terminal/tmux integration
    terminalCommand(command, output = null) {
        return this.log('terminal', command, { type: 'command', output });
    }
    
    terminalOutput(output, command = null) {
        return this.log('terminal', output, { type: 'output', command });
    }
    
    // For file operations
    fileRead(filepath, purpose = null) {
        return this.log('file_operation', `Reading ${filepath}`, { 
            operation: 'read', 
            filepath, 
            purpose 
        });
    }
    
    fileWrite(filepath, purpose = null) {
        return this.log('file_operation', `Writing ${filepath}`, { 
            operation: 'write', 
            filepath, 
            purpose 
        });
    }
    
    // For web browsing/exploration
    pageVisit(url, purpose = null) {
        return this.exploration(`Visiting ${url}`, { url, purpose });
    }
    
    elementClick(element, page = null) {
        return this.action(`Clicking ${element}`, { element, page });
    }
    
    // Analytics
    async getStats() {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logPath, `${today}.jsonl`);
        
        try {
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.trim().split('\n');
            const entries = lines.map(line => JSON.parse(line));
            
            const stats = {
                total: entries.length,
                session: this.sessionId,
                types: {},
                firstEntry: entries[0]?.timestamp,
                lastEntry: entries[entries.length - 1]?.timestamp
            };
            
            entries.forEach(entry => {
                stats.types[entry.type] = (stats.types[entry.type] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            return { total: 0, session: this.sessionId };
        }
    }
    
    // Export session
    async exportSession(format = 'jsonl') {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logPath, `${today}.jsonl`);
        
        try {
            const content = await fs.readFile(logFile, 'utf8');
            
            if (format === 'markdown') {
                return this.jsonlToMarkdown(content);
            }
            
            return content;
        } catch (error) {
            return null;
        }
    }
    
    jsonlToMarkdown(jsonlContent) {
        const lines = jsonlContent.trim().split('\n');
        let markdown = `# Reasoning Session - ${this.sessionId}\n\n`;
        
        lines.forEach(line => {
            const entry = JSON.parse(line);
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const emoji = {
                thought: '💭',
                action: '🔴',
                exploration: '🟣',
                reasoning: '🔵',
                emotion: '🟡',
                discovery: '🟢',
                system: '⚙️'
            }[entry.type] || '📝';
            
            markdown += `## ${emoji} ${entry.type} - ${time}\n\n${entry.text}\n\n`;
            
            if (entry.metadata && Object.keys(entry.metadata).length > 0) {
                markdown += `*Metadata: ${JSON.stringify(entry.metadata)}*\n\n`;
            }
            
            markdown += '---\n\n';
        });
        
        return markdown;
    }
}

// Create global logger instance
const logger = new ReasoningLogger();

// Export for use in other modules
module.exports = logger;

// CLI usage
if (require.main === module) {
    const [,, command, ...args] = process.argv;
    
    switch (command) {
        case 'stats':
            logger.getStats().then(stats => {
                console.log('\n📊 Session Stats:');
                console.log(`Session: ${stats.session}`);
                console.log(`Total entries: ${stats.total}`);
                console.log('Types:', stats.types);
                console.log(`Duration: ${stats.firstEntry} - ${stats.lastEntry}`);
            });
            break;
        
        case 'export':
            const format = args[0] || 'jsonl';
            logger.exportSession(format).then(content => {
                if (content) {
                    console.log(content);
                } else {
                    console.log('No session data found');
                }
            });
            break;
        
        case 'thought':
            logger.thought(args.join(' '));
            break;
        
        case 'action':
            logger.action(args.join(' '));
            break;
        
        case 'explore':
            logger.exploration(args.join(' '));
            break;
        
        default:
            console.log(`
🧠📝 REASONING LOGGER

Usage:
  node reasoning-logger.js thought "I'm thinking about..."
  node reasoning-logger.js action "Clicking submit button"
  node reasoning-logger.js explore "Looking for the menu"
  node reasoning-logger.js stats
  node reasoning-logger.js export [markdown|jsonl]

Integration:
  const logger = require('./reasoning-logger');
  logger.thought("This is my reasoning");
  logger.action("Clicking button");
  logger.exploration("Browsing page");

All data stored in .reasoning-viz/logs/ (isolated from your project)
            `);
    }
}