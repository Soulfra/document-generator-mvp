#!/usr/bin/env node

/**
 * 🧠📁 REASONING VIZ MANAGER
 * =========================
 * Clean, isolated visualization system that doesn't mess with your files
 * - JSONL standard logging format
 * - Terminal/tmux integration
 * - Markdown documentation support
 * - Complete isolation from project files
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const readline = require('readline');
const chokidar = require('chokidar');

class ReasoningVizManager {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Configuration
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.config = null;
        this.watchers = new Map();
        this.sessions = new Map();
        this.tmuxCapture = null;
        
        // JSONL stream buffers
        this.streamBuffers = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🧠📁 REASONING VIZ MANAGER');
        console.log('=========================');
        
        // Create isolated directory structure
        await this.setupIsolatedEnvironment();
        
        // Load configuration
        await this.loadConfig();
        
        // Setup server
        this.setupServer();
        
        // Setup capture systems
        await this.setupCaptureSystems();
        
        console.log('✅ Isolated visualization system ready');
        console.log(`📁 All files contained in: ${this.vizDir}`);
    }
    
    async setupIsolatedEnvironment() {
        // Create directory structure
        const dirs = [
            this.vizDir,
            path.join(this.vizDir, 'logs'),
            path.join(this.vizDir, 'captures'),
            path.join(this.vizDir, 'sessions'),
            path.join(this.vizDir, 'web'),
            path.join(this.vizDir, 'docs')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Create .gitignore to keep this isolated
        const gitignore = `
# Reasoning Viz - All contained here
*
!config.json
!README.md
        `.trim();
        
        await fs.writeFile(
            path.join(this.vizDir, '.gitignore'),
            gitignore
        );
        
        // Create README
        const readme = `
# Reasoning Visualization System

This directory contains all visualization data and is completely isolated from your project.

## Structure:
- \`logs/\` - JSONL formatted logs
- \`captures/\` - Screen/terminal captures  
- \`sessions/\` - Saved visualization sessions
- \`web/\` - Web interface files
- \`docs/\` - Generated documentation

## Usage:
\`\`\`bash
# Start visualization
node reasoning-viz-manager.js

# Watch specific file
node reasoning-viz-manager.js --watch path/to/file.log

# Capture tmux session
node reasoning-viz-manager.js --tmux session-name
\`\`\`

All data stays in this directory and won't interfere with your project.
        `.trim();
        
        await fs.writeFile(
            path.join(this.vizDir, 'README.md'),
            readme
        );
    }
    
    async loadConfig() {
        const configPath = path.join(this.vizDir, 'config.json');
        
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
        } catch (error) {
            // Use default config if not found
            this.config = {
                visualization: {
                    enabled: true,
                    port: 3006,
                    autoStart: false,
                    captureMode: 'jsonl'
                },
                paths: {
                    logs: path.join(this.vizDir, 'logs'),
                    captures: path.join(this.vizDir, 'captures'),
                    sessions: path.join(this.vizDir, 'sessions')
                }
            };
        }
    }
    
    setupServer() {
        this.app.use(express.json());
        
        // Serve static files from isolated web directory
        this.app.use(express.static(path.join(this.vizDir, 'web')));
        
        // API Routes
        this.app.post('/api/log', async (req, res) => {
            const entry = this.createJSONLEntry(req.body);
            await this.appendToLog(entry);
            this.broadcastEntry(entry);
            res.json({ success: true });
        });
        
        this.app.get('/api/sessions', async (req, res) => {
            const sessions = await this.listSessions();
            res.json(sessions);
        });
        
        this.app.post('/api/capture/terminal', async (req, res) => {
            const { command } = req.body;
            const capture = await this.captureTerminalOutput(command);
            res.json({ success: true, capture });
        });
        
        this.app.post('/api/capture/tmux', async (req, res) => {
            const { session, pane } = req.body;
            const capture = await this.captureTmuxPane(session, pane);
            res.json({ success: true, capture });
        });
        
        // WebSocket for live streaming
        this.wss.on('connection', (ws) => {
            console.log('🔌 Visualizer connected');
            
            ws.on('message', async (message) => {
                const data = JSON.parse(message);
                await this.handleVisualizerCommand(ws, data);
            });
            
            ws.on('close', () => {
                console.log('🔌 Visualizer disconnected');
            });
        });
    }
    
    async setupCaptureSystems() {
        // Watch for log files
        if (this.config.capture?.sources) {
            for (const source of this.config.capture.sources) {
                if (source.type === 'terminal' && source.watch) {
                    await this.setupLogWatcher(source.patterns);
                }
                
                if (source.type === 'tmux' && source.capturePane) {
                    await this.setupTmuxMonitor();
                }
            }
        }
    }
    
    async setupLogWatcher(patterns) {
        const watcher = chokidar.watch(patterns, {
            persistent: true,
            ignoreInitial: true,
            cwd: process.cwd(),
            ignored: this.config.paths.ignore
        });
        
        watcher.on('add', (path) => this.handleNewLogFile(path));
        watcher.on('change', (path) => this.handleLogChange(path));
        
        console.log(`👁️ Watching for log files: ${patterns}`);
    }
    
    async handleNewLogFile(filepath) {
        console.log(`📄 New log file detected: ${filepath}`);
        
        // Create a reader for this file
        const reader = readline.createInterface({
            input: require('fs').createReadStream(filepath),
            crlfDelay: Infinity
        });
        
        reader.on('line', (line) => {
            this.processLogLine(filepath, line);
        });
        
        this.watchers.set(filepath, reader);
    }
    
    async handleLogChange(filepath) {
        // Process new lines in changed file
        const reader = this.watchers.get(filepath);
        if (!reader) {
            await this.handleNewLogFile(filepath);
        }
    }
    
    processLogLine(source, line) {
        try {
            // Try to parse as JSONL
            const entry = JSON.parse(line);
            
            // Add source metadata
            entry._source = source;
            entry._captured = new Date().toISOString();
            
            // Broadcast to visualizers
            this.broadcastEntry(entry);
            
            // Save to our logs
            this.appendToLog(entry);
            
        } catch (error) {
            // Not JSON, create text entry
            const entry = this.createJSONLEntry({
                type: 'log',
                text: line,
                source: source
            });
            
            this.broadcastEntry(entry);
            this.appendToLog(entry);
        }
    }
    
    createJSONLEntry(data) {
        return {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: data.type || 'thought',
            ...data,
            _metadata: {
                version: '1.0',
                schema: 'reasoning-stream'
            }
        };
    }
    
    async appendToLog(entry) {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.config.paths.logs, `${today}.jsonl`);
        
        await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
    }
    
    broadcastEntry(entry) {
        const message = JSON.stringify({
            type: 'entry',
            data: entry
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    async captureTerminalOutput(command) {
        const captureId = Date.now().toString();
        const capturePath = path.join(this.config.paths.captures, `terminal-${captureId}.jsonl`);
        
        return new Promise((resolve, reject) => {
            const child = spawn(command, { shell: true });
            const output = [];
            
            child.stdout.on('data', (data) => {
                const entry = this.createJSONLEntry({
                    type: 'stdout',
                    text: data.toString(),
                    command,
                    stream: 'stdout'
                });
                
                output.push(entry);
                this.broadcastEntry(entry);
            });
            
            child.stderr.on('data', (data) => {
                const entry = this.createJSONLEntry({
                    type: 'stderr',
                    text: data.toString(),
                    command,
                    stream: 'stderr'
                });
                
                output.push(entry);
                this.broadcastEntry(entry);
            });
            
            child.on('close', async (code) => {
                // Save capture
                for (const entry of output) {
                    await fs.appendFile(capturePath, JSON.stringify(entry) + '\n');
                }
                
                resolve({
                    captureId,
                    command,
                    exitCode: code,
                    lines: output.length
                });
            });
        });
    }
    
    async captureTmuxPane(session, pane = '0') {
        return new Promise((resolve, reject) => {
            exec(`tmux capture-pane -t ${session}:${pane} -p`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                const lines = stdout.split('\n');
                const entries = lines.map(line => this.createJSONLEntry({
                    type: 'tmux',
                    text: line,
                    session,
                    pane
                }));
                
                // Broadcast all entries
                entries.forEach(entry => this.broadcastEntry(entry));
                
                resolve({
                    session,
                    pane,
                    lines: entries.length
                });
            });
        });
    }
    
    async setupTmuxMonitor() {
        // Monitor tmux sessions periodically
        setInterval(async () => {
            try {
                const { stdout } = await this.execCommand('tmux list-sessions -F "#{session_name}"');
                const sessions = stdout.trim().split('\n').filter(s => s);
                
                for (const session of sessions) {
                    if (!this.sessions.has(session)) {
                        console.log(`📺 New tmux session detected: ${session}`);
                        this.sessions.set(session, true);
                    }
                }
            } catch (error) {
                // tmux not running or no sessions
            }
        }, 5000);
    }
    
    async handleVisualizerCommand(ws, data) {
        switch (data.command) {
            case 'replay':
                await this.replaySession(ws, data.sessionId);
                break;
            
            case 'export':
                await this.exportSession(ws, data.format);
                break;
            
            case 'clear':
                await this.clearLogs();
                break;
        }
    }
    
    async listSessions() {
        const sessions = [];
        const sessionFiles = await fs.readdir(this.config.paths.sessions);
        
        for (const file of sessionFiles) {
            if (file.endsWith('.jsonl')) {
                const stats = await fs.stat(path.join(this.config.paths.sessions, file));
                sessions.push({
                    id: file.replace('.jsonl', ''),
                    created: stats.birthtime,
                    size: stats.size
                });
            }
        }
        
        return sessions;
    }
    
    async replaySession(ws, sessionId) {
        const sessionPath = path.join(this.config.paths.sessions, `${sessionId}.jsonl`);
        
        const reader = readline.createInterface({
            input: require('fs').createReadStream(sessionPath),
            crlfDelay: Infinity
        });
        
        for await (const line of reader) {
            const entry = JSON.parse(line);
            ws.send(JSON.stringify({
                type: 'replay',
                data: entry
            }));
            
            // Add delay for realistic playback
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    execCommand(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve({ stdout, stderr });
            });
        });
    }
    
    async generateMarkdownDocs() {
        const today = new Date().toISOString().split('T')[0];
        const logPath = path.join(this.config.paths.logs, `${today}.jsonl`);
        const docPath = path.join(this.vizDir, 'docs', `session-${today}.md`);
        
        let markdown = `# Reasoning Session - ${today}\n\n`;
        
        try {
            const content = await fs.readFile(logPath, 'utf8');
            const lines = content.trim().split('\n');
            
            for (const line of lines) {
                const entry = JSON.parse(line);
                markdown += this.entryToMarkdown(entry);
            }
            
            await fs.writeFile(docPath, markdown);
            console.log(`📝 Generated markdown: ${docPath}`);
        } catch (error) {
            console.error('Failed to generate docs:', error);
        }
    }
    
    entryToMarkdown(entry) {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        
        switch (entry.type) {
            case 'thought':
                return `### ${time} - Thought\n\n${entry.text}\n\n`;
            
            case 'action':
                return `### ${time} - Action 🔴\n\n> ${entry.text}\n\n`;
            
            case 'exploration':
                return `### ${time} - Exploration 🟣\n\n${entry.text}\n\n`;
            
            default:
                return `### ${time} - ${entry.type}\n\n\`\`\`\n${entry.text}\n\`\`\`\n\n`;
        }
    }
    
    start() {
        const port = this.config.visualization.port || 3006;
        
        this.server.listen(port, async () => {
            console.log('\n🧠📁 REASONING VIZ MANAGER ACTIVE');
            console.log('=================================');
            console.log(`📁 Isolated directory: ${this.vizDir}`);
            console.log(`🌐 Visualizer: http://localhost:${port}`);
            console.log(`📊 JSONL logs: ${this.config.paths.logs}`);
            console.log('');
            console.log('✅ Your project files are safe!');
            console.log('✅ All viz data contained in .reasoning-viz/');
            console.log('');
            console.log('📝 Commands:');
            console.log('   --watch <pattern>  Watch log files');
            console.log('   --tmux <session>   Capture tmux session');
            console.log('   --docs             Generate markdown docs');
            
            // Copy visualizer to isolated web directory
            await this.setupWebInterface();
        });
    }
    
    async setupWebInterface() {
        // Copy the visualizer HTML to our isolated directory
        const vizHtml = await fs.readFile(
            path.join(__dirname, 'reasoning-stream-visualizer.html'),
            'utf8'
        );
        
        // Modify to work with our JSONL system
        const modifiedHtml = vizHtml.replace(
            'localhost:3004',
            `localhost:${this.config.visualization.port}`
        );
        
        await fs.writeFile(
            path.join(this.vizDir, 'web', 'index.html'),
            modifiedHtml
        );
        
        console.log('🌐 Web interface ready in isolated directory');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const manager = new ReasoningVizManager();

if (args.includes('--docs')) {
    manager.generateMarkdownDocs();
} else {
    manager.start();
}

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down cleanly...');
    process.exit(0);
});