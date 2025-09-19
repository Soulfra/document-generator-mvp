#!/usr/bin/env node

/**
 * Creative Workflow Bridge
 * 
 * Monitors your creative workspace and automatically routes work through CAL pipeline
 * when you hit "agree/send" or make specific file changes.
 * 
 * This is the bridge between your creative work and the technical CAL system.
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const http = require('http');

class CreativeWorkflowBridge {
    constructor() {
        this.config = {
            // Ports for CAL services
            calMasterPort: 3336,
            authGatewayPort: 9998,
            bridgePort: 8083,
            
            // Watched directories and files
            watchPaths: [
                './creative-workspace/',
                './ObsidianVault/',
                './pixel-art/',
                './documents/',
                './ideas/',
                './*.md',
                './*.txt',
                './*.json',
                './*.png',
                './*.jpg',
                './*.jpeg',
                './*.gif',
                './*.svg'
            ],
            
            // Trigger patterns that mean "send this through CAL"
            triggerPatterns: [
                /\b(agree|send|submit|process|build|deploy)\b/i,
                /\b(cal|CAL)\s+(this|build|process|make|create)\b/i,
                /\b(ready|done|finished|complete)\b.*\b(send|submit)\b/i,
                /#cal-process/i,
                /#cal-build/i,
                /#ready-to-send/i
            ],
            
            // File types and their processing routes
            contentRoutes: {
                images: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'webp'],
                documents: ['md', 'txt', 'doc', 'docx', 'pdf'],
                code: ['js', 'ts', 'py', 'html', 'css', 'json', 'yaml', 'yml'],
                ideas: ['md', 'txt'],
                configs: ['json', 'yml', 'yaml', 'toml', 'ini']
            }
        };
        
        this.watchers = [];
        this.wsClients = [];
        this.pendingWork = new Map();
        this.processingQueue = [];
        this.isRunning = false;
        
        this.setupWebSocketServer();
        this.createWorkspaceDirectories();
    }
    
    async start() {
        console.log('🌉 CREATIVE WORKFLOW BRIDGE STARTING');
        console.log('=====================================');
        console.log('');
        console.log('🎨 Monitoring your creative workspace...');
        console.log('📁 Watching directories:');
        this.config.watchPaths.forEach(p => console.log(`   ${p}`));
        console.log('');
        console.log('🔍 Looking for trigger patterns:');
        console.log('   • "agree", "send", "submit", "process"');
        console.log('   • "CAL build this", "CAL process", etc.');
        console.log('   • "#cal-process", "#cal-build"');
        console.log('   • "ready to send", "finished - submit"');
        console.log('');
        
        this.isRunning = true;
        this.startFileWatching();
        this.startProcessingLoop();
        
        console.log('✅ Creative Workflow Bridge is ready!');
        console.log('');
        console.log('💡 Usage:');
        console.log('1. Work on your creative projects (pixel art, docs, code)');
        console.log('2. When ready, add "agree" or "send" to your file/commit message');
        console.log('3. Save the file → Bridge detects it → Routes through CAL!');
        console.log('');
        console.log(`🌐 WebSocket server running on ws://localhost:${this.config.bridgePort}`);
        console.log(`📡 Ready to connect to CAL Master at http://localhost:${this.config.calMasterPort}`);
        console.log('');
    }
    
    createWorkspaceDirectories() {
        const dirs = [
            './creative-workspace',
            './creative-workspace/pixel-art',
            './creative-workspace/documents', 
            './creative-workspace/ideas',
            './creative-workspace/code-projects',
            './creative-workspace/configs'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
        
        // Create README for the workspace
        const readmePath = './creative-workspace/README.md';
        if (!fs.existsSync(readmePath)) {
            fs.writeFileSync(readmePath, `# Creative Workspace

This is your creative workspace monitored by the Creative Workflow Bridge.

## How it works:

1. **Create your work** in any subdirectory
2. **Add trigger words** when you're ready to process:
   - "agree" - Send through CAL pipeline
   - "send" - Process with CAL
   - "CAL build this" - Build with CAL
   - "#cal-process" - Tag for processing
3. **Save the file** - Bridge detects and routes automatically!

## Directories:

- \`pixel-art/\` - Images, artwork, graphics
- \`documents/\` - Text files, markdown, documentation  
- \`ideas/\` - Brainstorming, notes, concepts
- \`code-projects/\` - Code, scripts, configurations
- \`configs/\` - Configuration files

## Examples:

\`\`\`markdown
# My Amazing Game Idea

This is a revolutionary gaming concept...

## Features
- Real-time multiplayer
- AI-driven NPCs
- Blockchain integration

*Ready to build - CAL process this!*
\`\`\`

\`\`\`txt
Project: E-commerce Platform

Main features needed:
1. User authentication
2. Product catalog
3. Shopping cart
4. Payment processing

Status: Design complete - agree to move to development
\`\`\`
`);
        }
    }
    
    setupWebSocketServer() {
        const server = http.createServer();
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection to Creative Bridge');
            this.wsClients.push(ws);
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    isRunning: this.isRunning,
                    watchedPaths: this.config.watchPaths,
                    pendingWork: this.pendingWork.size,
                    queueLength: this.processingQueue.length
                }
            }));
            
            ws.on('close', () => {
                this.wsClients = this.wsClients.filter(client => client !== ws);
            });
        });
        
        server.listen(this.config.bridgePort, () => {
            console.log(`🌐 Creative Bridge WebSocket server listening on port ${this.config.bridgePort}`);
        });
    }
    
    startFileWatching() {
        console.log('👁️ Starting file system watchers...');
        
        this.config.watchPaths.forEach(watchPath => {
            const watcher = chokidar.watch(watchPath, {
                ignored: [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/dist/**',
                    '**/build/**',
                    '**/.DS_Store',
                    '**/Thumbs.db'
                ],
                persistent: true,
                awaitWriteFinish: {
                    stabilityThreshold: 1000,
                    pollInterval: 100
                }
            });
            
            watcher
                .on('add', (filePath) => this.handleFileChange('add', filePath))
                .on('change', (filePath) => this.handleFileChange('change', filePath))
                .on('unlink', (filePath) => this.handleFileChange('delete', filePath));
                
            this.watchers.push(watcher);
        });
    }
    
    async handleFileChange(event, filePath) {
        console.log(`📂 File ${event}: ${filePath}`);
        
        try {
            // Skip if file doesn't exist (for delete events or temp files)
            if (event !== 'delete' && !fs.existsSync(filePath)) {
                return;
            }
            
            // Skip if it's a directory
            if (event !== 'delete' && fs.statSync(filePath).isDirectory()) {
                return;
            }
            
            const fileInfo = {
                path: filePath,
                event: event,
                timestamp: new Date(),
                extension: path.extname(filePath).slice(1).toLowerCase(),
                basename: path.basename(filePath),
                dirname: path.dirname(filePath)
            };
            
            // Read file content if it exists
            if (event !== 'delete') {
                try {
                    if (this.isTextFile(fileInfo.extension)) {
                        fileInfo.content = fs.readFileSync(filePath, 'utf-8');
                        fileInfo.size = fileInfo.content.length;
                    } else {
                        const stats = fs.statSync(filePath);
                        fileInfo.size = stats.size;
                        fileInfo.content = null; // Binary file
                    }
                } catch (err) {
                    console.log(`⚠️ Could not read file content: ${err.message}`);
                    return;
                }
            }
            
            // Check if this change should trigger CAL processing
            const shouldProcess = this.shouldProcessFile(fileInfo);
            
            if (shouldProcess) {
                console.log('🚀 TRIGGER DETECTED! Adding to processing queue...');
                this.addToProcessingQueue(fileInfo, shouldProcess);
            }
            
            // Broadcast to WebSocket clients
            this.broadcastToClients({
                type: 'file-change',
                data: {
                    ...fileInfo,
                    shouldProcess,
                    content: fileInfo.content ? fileInfo.content.slice(0, 200) + '...' : null // Truncate for WS
                }
            });
            
        } catch (error) {
            console.error(`❌ Error handling file change: ${error.message}`);
        }
    }
    
    shouldProcessFile(fileInfo) {
        // Check if file was deleted
        if (fileInfo.event === 'delete') {
            return false;
        }
        
        // Check if file content contains trigger patterns
        if (fileInfo.content) {
            for (const pattern of this.config.triggerPatterns) {
                if (pattern.test(fileInfo.content)) {
                    return {
                        reason: 'content-trigger',
                        pattern: pattern.toString(),
                        match: fileInfo.content.match(pattern)?.[0]
                    };
                }
            }
        }
        
        // Check if filename contains trigger words
        const filename = fileInfo.basename.toLowerCase();
        if (/\b(ready|final|complete|send|submit|deploy)\b/.test(filename)) {
            return {
                reason: 'filename-trigger',
                match: filename
            };
        }
        
        // Check if it's in a special directory that auto-processes
        if (fileInfo.dirname.includes('cal-auto') || fileInfo.dirname.includes('ready-to-send')) {
            return {
                reason: 'directory-trigger',
                directory: fileInfo.dirname
            };
        }
        
        return false;
    }
    
    addToProcessingQueue(fileInfo, triggerInfo) {
        const workItem = {
            id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileInfo,
            triggerInfo,
            addedAt: new Date(),
            status: 'pending',
            contentType: this.determineContentType(fileInfo),
            processingRoute: this.determineProcessingRoute(fileInfo)
        };
        
        this.processingQueue.push(workItem);
        this.pendingWork.set(workItem.id, workItem);
        
        console.log(`📋 Added to queue: ${workItem.id}`);
        console.log(`   Content Type: ${workItem.contentType}`);
        console.log(`   Route: ${workItem.processingRoute}`);
        console.log(`   Trigger: ${triggerInfo.reason} - ${triggerInfo.match}`);
    }
    
    determineContentType(fileInfo) {
        const ext = fileInfo.extension;
        
        if (this.config.contentRoutes.images.includes(ext)) return 'image';
        if (this.config.contentRoutes.documents.includes(ext)) return 'document';  
        if (this.config.contentRoutes.code.includes(ext)) return 'code';
        if (this.config.contentRoutes.configs.includes(ext)) return 'config';
        
        // Content-based detection
        if (fileInfo.content) {
            if (fileInfo.content.includes('business plan') || fileInfo.content.includes('market analysis')) {
                return 'business-plan';
            }
            if (fileInfo.content.includes('API') || fileInfo.content.includes('endpoint')) {
                return 'api-spec';
            }
            if (fileInfo.content.includes('user story') || fileInfo.content.includes('requirements')) {
                return 'requirements';
            }
        }
        
        return 'unknown';
    }
    
    determineProcessingRoute(fileInfo) {
        const contentType = this.determineContentType(fileInfo);
        
        const routes = {
            'image': 'visual-processor',
            'document': 'document-analyzer', 
            'business-plan': 'mvp-generator',
            'api-spec': 'api-generator',
            'requirements': 'template-matcher',
            'code': 'code-analyzer',
            'config': 'config-processor',
            'unknown': 'general-processor'
        };
        
        return routes[contentType] || 'general-processor';
    }
    
    async startProcessingLoop() {
        console.log('🔄 Starting processing loop...');
        
        setInterval(async () => {
            if (this.processingQueue.length > 0) {
                const workItem = this.processingQueue.shift();
                await this.processWorkItem(workItem);
            }
        }, 2000); // Process queue every 2 seconds
    }
    
    async processWorkItem(workItem) {
        console.log(`🔧 Processing work item: ${workItem.id}`);
        console.log(`   File: ${workItem.fileInfo.path}`);
        console.log(`   Type: ${workItem.contentType}`);
        console.log(`   Route: ${workItem.processingRoute}`);
        
        try {
            workItem.status = 'processing';
            workItem.startedAt = new Date();
            
            // Send to appropriate CAL service based on processing route
            const result = await this.sendToCAL(workItem);
            
            workItem.status = 'completed';
            workItem.completedAt = new Date();
            workItem.result = result;
            
            console.log(`✅ Work item completed: ${workItem.id}`);
            
            // Broadcast completion
            this.broadcastToClients({
                type: 'work-completed',
                data: workItem
            });
            
        } catch (error) {
            console.error(`❌ Error processing work item ${workItem.id}:`, error.message);
            
            workItem.status = 'failed';
            workItem.error = error.message;
            workItem.failedAt = new Date();
            
            this.broadcastToClients({
                type: 'work-failed',
                data: workItem
            });
        }
    }
    
    async sendToCAL(workItem) {
        console.log(`📡 Sending to CAL Master Orchestrator...`);
        
        // Prepare payload for CAL
        const calPayload = {
            workItemId: workItem.id,
            contentType: workItem.contentType,
            processingRoute: workItem.processingRoute,
            file: {
                path: workItem.fileInfo.path,
                name: workItem.fileInfo.basename,
                extension: workItem.fileInfo.extension,
                size: workItem.fileInfo.size,
                content: workItem.fileInfo.content
            },
            trigger: workItem.triggerInfo,
            requestedAt: new Date(),
            source: 'creative-workflow-bridge'
        };
        
        try {
            // Send HTTP request to CAL Master Orchestrator
            const response = await this.makeHTTPRequest({
                method: 'POST',
                hostname: 'localhost',
                port: this.config.calMasterPort,
                path: '/api/process-creative-work',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Bridge-Source': 'creative-workflow-bridge'
                }
            }, JSON.stringify(calPayload));
            
            console.log(`📨 CAL response: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                return JSON.parse(response.body);
            } else {
                throw new Error(`CAL returned status ${response.statusCode}: ${response.body}`);
            }
            
        } catch (error) {
            // Fallback: Save to queue file for later processing
            console.log(`⚠️ CAL unavailable, saving to local queue: ${error.message}`);
            
            const queueFile = './creative-bridge-queue.json';
            let queue = [];
            
            if (fs.existsSync(queueFile)) {
                queue = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
            }
            
            queue.push(calPayload);
            fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
            
            return {
                status: 'queued-for-later',
                queuedAt: new Date(),
                message: 'CAL unavailable, queued for processing when available'
            };
        }
    }
    
    makeHTTPRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body }));
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('Request timeout')));
            
            if (data) req.write(data);
            req.end();
        });
    }
    
    broadcastToClients(message) {
        const data = JSON.stringify(message);
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    isTextFile(extension) {
        const textExtensions = ['md', 'txt', 'json', 'js', 'ts', 'html', 'css', 'yaml', 'yml', 'toml', 'ini', 'py', 'sh', 'bash'];
        return textExtensions.includes(extension);
    }
    
    async stop() {
        console.log('🛑 Stopping Creative Workflow Bridge...');
        
        this.isRunning = false;
        
        // Close file watchers
        this.watchers.forEach(watcher => watcher.close());
        
        // Close WebSocket server
        this.wss.close();
        
        // Close WebSocket clients
        this.wsClients.forEach(client => client.close());
        
        console.log('✅ Creative Workflow Bridge stopped');
    }
    
    // CLI interface
    showStatus() {
        console.log('');
        console.log('🌉 CREATIVE WORKFLOW BRIDGE STATUS');
        console.log('================================');
        console.log(`Running: ${this.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`Watched paths: ${this.config.watchPaths.length}`);
        console.log(`Connected clients: ${this.wsClients.length}`);
        console.log(`Pending work items: ${this.pendingWork.size}`);
        console.log(`Queue length: ${this.processingQueue.length}`);
        console.log('');
        
        if (this.pendingWork.size > 0) {
            console.log('📋 Recent work items:');
            Array.from(this.pendingWork.values()).slice(-5).forEach(item => {
                console.log(`   ${item.id} - ${item.fileInfo.basename} (${item.status})`);
            });
            console.log('');
        }
    }
}

// CLI interface
if (require.main === module) {
    const bridge = new CreativeWorkflowBridge();
    
    const command = process.argv[2];
    
    if (command === 'status') {
        bridge.showStatus();
        process.exit(0);
    }
    
    if (command === 'test') {
        console.log('🧪 Testing Creative Workflow Bridge...');
        
        // Create a test file with trigger
        const testFile = './creative-workspace/test-idea.md';
        const testContent = `# Test Idea

This is a test idea for the Creative Workflow Bridge.

## Features needed:
- File monitoring
- Pattern detection
- CAL integration

Status: Ready to test - CAL process this!
`;
        
        fs.writeFileSync(testFile, testContent);
        console.log(`✅ Created test file: ${testFile}`);
        console.log('   Contains trigger: "CAL process this!"');
        console.log('   Bridge should detect this and add to queue');
        
        process.exit(0);
    }
    
    // Default: Start the bridge
    bridge.start().catch(error => {
        console.error('❌ Failed to start Creative Workflow Bridge:', error);
        process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received interrupt signal');
        await bridge.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received terminate signal');
        await bridge.stop();
        process.exit(0);
    });
}

module.exports = CreativeWorkflowBridge;