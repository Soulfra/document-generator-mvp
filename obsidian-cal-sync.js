#!/usr/bin/env node

/**
 * Obsidian CAL Sync
 * 
 * Real-time synchronization between Obsidian vault and CAL system.
 * Bridges note-taking workflow with AI-powered component generation.
 * 
 * Features:
 * - Real-time vault monitoring
 * - Bidirectional sync with CAL knowledge base
 * - Automatic component detection from notes
 * - Obsidian linking and tagging integration
 * - Build triggers from note content
 * - Component progress tracking in vault
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const http = require('http');
const WebSocket = require('ws');

class ObsidianCALSync {
    constructor() {
        this.config = {
            // Obsidian vault path
            vaultPath: './ObsidianVault',
            syncPort: 8084,
            wsPort: 8085,
            
            // CAL service endpoints
            calVaultReaderUrl: 'http://localhost:3337',
            calKnowledgeProcessorUrl: 'http://localhost:3338',
            calComponentPackagerUrl: 'http://localhost:3339',
            calMasterUrl: 'http://localhost:3336',
            
            // Sync settings
            debounceDelay: 1000,  // 1 second delay before processing changes
            maxFileSize: 10 * 1024 * 1024, // 10MB max file size
            syncIntervalMs: 30000, // 30 second full sync interval
            
            // Obsidian-specific patterns
            linkPattern: /\[\[([^\]]+)\]\]/g,
            tagPattern: /#([a-zA-Z0-9_-]+)/g,
            taskPattern: /^- \[([ x])\] (.+)$/gm,
            calloutPattern: /^> \[!(info|warning|error|success|note|tip|cal-build|cal-process)\]/gm,
            
            // File categories for sync
            syncCategories: [
                '01-Core-Systems',
                '02-Documentation', 
                '03-Templates',
                '04-Gaming-Components',
                '05-Business-Logic',
                '06-Creative-Assets',
                '07-Learning-Resources',
                '08-Integrations',
                '09-Configs',
                '10-Generated-Code',
                '11-Ideas-Concepts',
                '12-Active-Projects'
            ],
            
            // Build trigger patterns in notes
            buildTriggers: [
                /> \[!cal-build\]/i,
                /> \[!cal-process\]/i,
                /#cal-ready/i,
                /#build-this/i,
                /Status: ready.*build/i,
                /TODO:.*CAL build/i
            ]
        };
        
        this.fileWatcher = null;
        this.syncState = new Map(); // Track file sync states
        this.pendingChanges = new Map(); // Debounced changes
        this.linkGraph = new Map(); // Track note relationships
        this.componentMap = new Map(); // Track buildable components
        this.wsClients = [];
        this.isRunning = false;
        
        this.initializeVault();
        this.setupWebSocketServer();
    }
    
    async start() {
        console.log('🔄 OBSIDIAN CAL SYNC STARTING');
        console.log('=============================');
        console.log('');
        console.log(`📁 Vault Path: ${this.config.vaultPath}`);
        console.log(`🌐 Sync Port: ${this.config.syncPort}`);
        console.log(`📡 WebSocket Port: ${this.config.wsPort}`);
        console.log('');
        
        this.isRunning = true;
        
        // Start HTTP server for sync API
        this.startSyncServer();
        
        // Start file monitoring
        this.startFileWatcher();
        
        // Start periodic full sync
        this.startPeriodicSync();
        
        // Perform initial sync
        await this.performFullSync();
        
        console.log('✅ Obsidian CAL Sync ready!');
        console.log('');
        console.log('📋 Watching for:');
        console.log('   • Note changes and creations');
        console.log('   • Build triggers in content');
        console.log('   • Link graph updates');
        console.log('   • Component definitions');
        console.log('   • Task completions');
        console.log('');
    }
    
    initializeVault() {
        // Ensure vault directory exists
        if (!fs.existsSync(this.config.vaultPath)) {
            fs.mkdirSync(this.config.vaultPath, { recursive: true });
            console.log(`📁 Created vault directory: ${this.config.vaultPath}`);
        }
        
        // Ensure category directories exist
        this.config.syncCategories.forEach(category => {
            const categoryPath = path.join(this.config.vaultPath, category);
            if (!fs.existsSync(categoryPath)) {
                fs.mkdirSync(categoryPath, { recursive: true });
                console.log(`📂 Created category: ${category}`);
            }
        });
        
        // Create vault metadata file
        const metadataPath = path.join(this.config.vaultPath, '.obsidian');
        if (!fs.existsSync(metadataPath)) {
            fs.mkdirSync(metadataPath, { recursive: true });
            
            // Create basic Obsidian config
            const vaultConfig = {
                name: 'CAL Knowledge Vault',
                plugins: ['graph', 'backlink', 'daily-notes'],
                theme: 'obsidian',
                version: '1.0.0'
            };
            
            fs.writeFileSync(
                path.join(metadataPath, 'app.json'), 
                JSON.stringify(vaultConfig, null, 2)
            );
        }
        
        // Create CAL sync status note
        this.createSyncStatusNote();
    }
    
    createSyncStatusNote() {
        const statusNotePath = path.join(this.config.vaultPath, 'CAL-Sync-Status.md');
        
        const statusContent = `# CAL Sync Status

This note shows the current sync status between Obsidian and CAL.

## 🔄 Sync Configuration
- **Vault Path**: ${this.config.vaultPath}
- **Sync Port**: ${this.config.syncPort}
- **WebSocket Port**: ${this.config.wsPort}
- **Last Full Sync**: ${new Date().toISOString()}

## 📊 Statistics
- **Total Notes**: ${this.getTotalNoteCount()}
- **Buildable Components**: ${this.componentMap.size}
- **Active Links**: ${this.linkGraph.size}

## 🏗️ Build Triggers

Use these patterns in your notes to trigger CAL builds:

\`\`\`markdown
> [!cal-build]
> This component is ready to build

> [!cal-process] 
> Process this content with CAL

#cal-ready #build-this
Status: ready to build

TODO: CAL build this component
\`\`\`

## 📂 Sync Categories

${this.config.syncCategories.map(cat => `- [[${cat}/]]`).join('\n')}

## 🔗 Quick Links
- [[CAL-Component-Library]]
- [[CAL-Build-Queue]]
- [[CAL-Generated-Components]]

---
*This note is automatically updated by CAL Sync*
*Last updated: ${new Date().toLocaleString()}*
`;
        
        fs.writeFileSync(statusNotePath, statusContent);
    }
    
    setupWebSocketServer() {
        const wsServer = http.createServer();
        this.wss = new WebSocket.Server({ server: wsServer });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New Obsidian sync WebSocket connection');
            this.wsClients.push(ws);
            
            // Send current vault state
            ws.send(JSON.stringify({
                type: 'vault-state',
                data: {
                    totalNotes: this.getTotalNoteCount(),
                    buildableComponents: this.componentMap.size,
                    activeLinks: this.linkGraph.size,
                    lastSync: new Date()
                }
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, JSON.parse(message));
            });
            
            ws.on('close', () => {
                this.wsClients = this.wsClients.filter(client => client !== ws);
            });
        });
        
        wsServer.listen(this.config.wsPort, () => {
            console.log(`🌐 WebSocket server listening on port ${this.config.wsPort}`);
        });
    }
    
    startSyncServer() {
        this.server = http.createServer((req, res) => this.handleSyncRequest(req, res));
        
        this.server.listen(this.config.syncPort, () => {
            console.log(`📡 Sync server listening on port ${this.config.syncPort}`);
        });
    }
    
    startFileWatcher() {
        console.log('👁️ Starting vault file watcher...');
        
        this.fileWatcher = chokidar.watch(this.config.vaultPath, {
            ignored: [
                '**/.obsidian/**',
                '**/node_modules/**',
                '**/.git/**',
                '**/.DS_Store'
            ],
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100
            }
        });
        
        this.fileWatcher
            .on('add', (filePath) => this.handleFileChange('add', filePath))
            .on('change', (filePath) => this.handleFileChange('change', filePath))
            .on('unlink', (filePath) => this.handleFileChange('delete', filePath));
    }
    
    async handleFileChange(event, filePath) {
        // Skip non-markdown files for now
        if (!filePath.endsWith('.md')) return;
        
        console.log(`📄 File ${event}: ${path.relative(this.config.vaultPath, filePath)}`);
        
        // Debounce rapid changes
        if (this.pendingChanges.has(filePath)) {
            clearTimeout(this.pendingChanges.get(filePath));
        }
        
        this.pendingChanges.set(filePath, setTimeout(async () => {
            await this.processFileChange(event, filePath);
            this.pendingChanges.delete(filePath);
        }, this.config.debounceDelay));
    }
    
    async processFileChange(event, filePath) {
        try {
            const relativePath = path.relative(this.config.vaultPath, filePath);
            
            if (event === 'delete') {
                await this.handleFileDelete(filePath, relativePath);
                return;
            }
            
            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size > this.config.maxFileSize) {
                console.log(`⚠️ File too large, skipping: ${relativePath}`);
                return;
            }
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const fileInfo = {
                path: filePath,
                relativePath,
                content,
                size: stats.size,
                modified: stats.mtime,
                event
            };
            
            // Process the note
            await this.processNote(fileInfo);
            
            // Update sync state
            this.syncState.set(filePath, {
                lastSync: new Date(),
                checksum: this.calculateChecksum(content),
                processed: true
            });
            
            // Broadcast change
            this.broadcastToClients({
                type: 'note-changed',
                data: {
                    file: relativePath,
                    event,
                    timestamp: new Date()
                }
            });
            
        } catch (error) {
            console.error(`❌ Error processing file change: ${error.message}`);
        }
    }
    
    async processNote(fileInfo) {
        console.log(`🔍 Processing note: ${fileInfo.relativePath}`);
        
        // Extract metadata
        const metadata = this.extractNoteMetadata(fileInfo.content);
        
        // Update link graph
        this.updateLinkGraph(fileInfo, metadata.links);
        
        // Check for build triggers
        const buildTriggers = this.detectBuildTriggers(fileInfo.content);
        if (buildTriggers.length > 0) {
            console.log(`🚀 Build triggers detected in ${fileInfo.relativePath}`);
            await this.processBuildTriggers(fileInfo, buildTriggers);
        }
        
        // Check for component definitions
        const componentDef = this.detectComponentDefinition(fileInfo.content);
        if (componentDef) {
            console.log(`🧩 Component definition found: ${componentDef.name}`);
            this.componentMap.set(fileInfo.path, componentDef);
            await this.syncComponentWithCAL(fileInfo, componentDef);
        }
        
        // Update tasks
        const tasks = this.extractTasks(fileInfo.content);
        if (tasks.length > 0) {
            await this.syncTasksWithCAL(fileInfo, tasks);
        }
        
        // Send to CAL for knowledge processing
        await this.sendToCALKnowledge(fileInfo, metadata);
    }
    
    extractNoteMetadata(content) {
        const metadata = {
            links: [],
            tags: [],
            tasks: [],
            callouts: [],
            frontmatter: null
        };
        
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            try {
                // Simple YAML-like parsing
                const lines = frontmatterMatch[1].split('\n');
                metadata.frontmatter = {};
                lines.forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                        metadata.frontmatter[key.trim()] = valueParts.join(':').trim();
                    }
                });
            } catch (error) {
                console.log('⚠️ Error parsing frontmatter:', error.message);
            }
        }
        
        // Extract links
        let linkMatch;
        while ((linkMatch = this.config.linkPattern.exec(content)) !== null) {
            metadata.links.push(linkMatch[1]);
        }
        
        // Extract tags
        let tagMatch;
        while ((tagMatch = this.config.tagPattern.exec(content)) !== null) {
            metadata.tags.push(tagMatch[1]);
        }
        
        // Extract tasks
        let taskMatch;
        while ((taskMatch = this.config.taskPattern.exec(content)) !== null) {
            metadata.tasks.push({
                completed: taskMatch[1] === 'x',
                content: taskMatch[2]
            });
        }
        
        // Extract callouts
        let calloutMatch;
        while ((calloutMatch = this.config.calloutPattern.exec(content)) !== null) {
            metadata.callouts.push(calloutMatch[1]);
        }
        
        return metadata;
    }
    
    detectBuildTriggers(content) {
        const triggers = [];
        
        this.config.buildTriggers.forEach((pattern, index) => {
            if (pattern.test(content)) {
                triggers.push({
                    pattern: pattern.toString(),
                    match: content.match(pattern)?.[0],
                    priority: index === 0 || index === 1 ? 'high' : 'medium' // cal-build and cal-process are high priority
                });
            }
        });
        
        return triggers;
    }
    
    detectComponentDefinition(content) {
        // Look for component definition patterns
        const componentPatterns = [
            /^# Component: (.+)$/m,
            /^## Component Definition\n\n\*\*Name\*\*: (.+)$/m,
            /Component Name: (.+)$/m
        ];
        
        for (const pattern of componentPatterns) {
            const match = content.match(pattern);
            if (match) {
                return {
                    name: match[1].trim(),
                    type: this.detectComponentType(content),
                    description: this.extractDescription(content),
                    requirements: this.extractRequirements(content),
                    dependencies: this.extractDependencies(content)
                };
            }
        }
        
        return null;
    }
    
    detectComponentType(content) {
        const typePatterns = {
            'api-service': /API|endpoint|server|service/i,
            'ui-component': /component|interface|UI|frontend/i,
            'database': /database|schema|model|migration/i,
            'utility': /utility|helper|tool|function/i,
            'integration': /integration|connector|bridge|sync/i
        };
        
        for (const [type, pattern] of Object.entries(typePatterns)) {
            if (pattern.test(content)) return type;
        }
        
        return 'general';
    }
    
    extractDescription(content) {
        // Look for description patterns
        const descPatterns = [
            /## Description\n\n(.+?)(?=\n##|\n$)/s,
            /\*\*Description\*\*: (.+?)(?=\n\*\*|\n$)/s,
            /Description: (.+?)(?=\n|\n$)/s
        ];
        
        for (const pattern of descPatterns) {
            const match = content.match(pattern);
            if (match) return match[1].trim();
        }
        
        // Fallback to first paragraph
        const firstParagraph = content.split('\n\n')[1];
        return firstParagraph ? firstParagraph.replace(/\n/g, ' ').trim() : 'No description';
    }
    
    extractRequirements(content) {
        const reqSection = content.match(/## Requirements\n\n([\s\S]*?)(?=\n##|\n$)/s);
        if (reqSection) {
            return reqSection[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
                .map(line => line.replace(/^[-\d.]\s*/, '').trim());
        }
        return [];
    }
    
    extractDependencies(content) {
        const depSection = content.match(/## Dependencies\n\n([\s\S]*?)(?=\n##|\n$)/s);
        if (depSection) {
            return depSection[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
                .map(line => line.replace(/^[-\d.]\s*/, '').trim());
        }
        return [];
    }
    
    extractTasks(content) {
        const tasks = [];
        let taskMatch;
        
        const taskPattern = /^- \[([ x])\] (.+)$/gm;
        while ((taskMatch = taskPattern.exec(content)) !== null) {
            tasks.push({
                completed: taskMatch[1] === 'x',
                content: taskMatch[2],
                line: taskMatch.index
            });
        }
        
        return tasks;
    }
    
    updateLinkGraph(fileInfo, links) {
        const fileName = path.basename(fileInfo.path, '.md');
        
        // Update outgoing links
        this.linkGraph.set(fileInfo.path, {
            fileName,
            outgoingLinks: links,
            incomingLinks: this.getIncomingLinks(fileName),
            lastUpdated: new Date()
        });
        
        // Update incoming links for linked files
        links.forEach(linkedFile => {
            const linkedPath = this.findFileByName(linkedFile);
            if (linkedPath && this.linkGraph.has(linkedPath)) {
                const linkedData = this.linkGraph.get(linkedPath);
                if (!linkedData.incomingLinks.includes(fileName)) {
                    linkedData.incomingLinks.push(fileName);
                    this.linkGraph.set(linkedPath, linkedData);
                }
            }
        });
    }
    
    getIncomingLinks(fileName) {
        const incoming = [];
        
        for (const [filePath, linkData] of this.linkGraph.entries()) {
            if (linkData.outgoingLinks.includes(fileName)) {
                incoming.push(linkData.fileName);
            }
        }
        
        return incoming;
    }
    
    findFileByName(name) {
        // Find file path by name (without extension)
        const searchName = name.replace(/\.md$/, '');
        
        for (const filePath of this.syncState.keys()) {
            const baseName = path.basename(filePath, '.md');
            if (baseName === searchName) {
                return filePath;
            }
        }
        
        return null;
    }
    
    async processBuildTriggers(fileInfo, triggers) {
        console.log(`🚀 Processing ${triggers.length} build triggers for ${fileInfo.relativePath}`);
        
        for (const trigger of triggers) {
            try {
                await this.sendBuildRequest({
                    filePath: fileInfo.path,
                    relativePath: fileInfo.relativePath,
                    content: fileInfo.content,
                    trigger: trigger,
                    timestamp: new Date()
                });
                
                // Mark trigger as processed (add comment to note)
                await this.markTriggerProcessed(fileInfo.path, trigger);
                
            } catch (error) {
                console.error(`❌ Error processing build trigger: ${error.message}`);
            }
        }
    }
    
    async sendBuildRequest(buildData) {
        console.log(`📡 Sending build request to CAL...`);
        
        const payload = {
            source: 'obsidian-cal-sync',
            type: 'build-request',
            data: buildData
        };
        
        try {
            const response = await this.makeHTTPRequest({
                method: 'POST',
                hostname: 'localhost',
                port: 3336, // CAL Master port
                path: '/api/obsidian-build-request',
                headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify(payload));
            
            console.log(`📨 CAL build response: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                const result = JSON.parse(response.body);
                await this.updateNoteWithBuildStatus(buildData.filePath, result);
            }
            
        } catch (error) {
            console.error(`❌ Failed to send build request: ${error.message}`);
            
            // Queue for later retry
            this.queueFailedBuild(buildData, error.message);
        }
    }
    
    async syncComponentWithCAL(fileInfo, componentDef) {
        console.log(`🔄 Syncing component '${componentDef.name}' with CAL...`);
        
        const syncPayload = {
            source: 'obsidian-cal-sync',
            type: 'component-definition',
            data: {
                filePath: fileInfo.path,
                relativePath: fileInfo.relativePath,
                component: componentDef,
                content: fileInfo.content,
                lastModified: fileInfo.modified
            }
        };
        
        try {
            await this.makeHTTPRequest({
                method: 'POST',
                hostname: 'localhost',
                port: 3338, // CAL Knowledge Processor port
                path: '/api/sync-component',
                headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify(syncPayload));
            
            console.log(`✅ Component '${componentDef.name}' synced with CAL`);
            
        } catch (error) {
            console.error(`❌ Failed to sync component: ${error.message}`);
        }
    }
    
    async sendToCALKnowledge(fileInfo, metadata) {
        // Send note content to CAL knowledge processor for general analysis
        const knowledgePayload = {
            source: 'obsidian-cal-sync',
            type: 'knowledge-update',
            data: {
                filePath: fileInfo.path,
                relativePath: fileInfo.relativePath,
                content: fileInfo.content,
                metadata: metadata,
                category: this.getCategoryFromPath(fileInfo.relativePath),
                lastModified: fileInfo.modified
            }
        };
        
        try {
            await this.makeHTTPRequest({
                method: 'POST',
                hostname: 'localhost',
                port: 3338, // CAL Knowledge Processor port
                path: '/api/knowledge-update',
                headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify(knowledgePayload));
            
        } catch (error) {
            // Silently fail for knowledge updates (not critical)
            console.log(`⚠️ Knowledge sync failed for ${fileInfo.relativePath}: ${error.message}`);
        }
    }
    
    getCategoryFromPath(relativePath) {
        const pathParts = relativePath.split('/');
        return pathParts[0] || 'uncategorized';
    }
    
    async handleFileDelete(filePath, relativePath) {
        console.log(`🗑️ File deleted: ${relativePath}`);
        
        // Remove from sync state
        this.syncState.delete(filePath);
        
        // Remove from link graph
        this.linkGraph.delete(filePath);
        
        // Remove from component map
        this.componentMap.delete(filePath);
        
        // Notify CAL of deletion
        try {
            await this.makeHTTPRequest({
                method: 'DELETE',
                hostname: 'localhost',
                port: 3338,
                path: `/api/knowledge-delete?file=${encodeURIComponent(relativePath)}`,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.log(`⚠️ Failed to notify CAL of deletion: ${error.message}`);
        }
        
        // Broadcast deletion
        this.broadcastToClients({
            type: 'note-deleted',
            data: { file: relativePath, timestamp: new Date() }
        });
    }
    
    async performFullSync() {
        console.log('🔄 Performing full vault sync...');
        
        const startTime = Date.now();
        let syncedFiles = 0;
        
        try {
            // Get all markdown files in vault
            const allFiles = this.getAllMarkdownFiles(this.config.vaultPath);
            
            console.log(`📊 Found ${allFiles.length} notes to sync`);
            
            for (const filePath of allFiles) {
                try {
                    const stats = fs.statSync(filePath);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    
                    const fileInfo = {
                        path: filePath,
                        relativePath: path.relative(this.config.vaultPath, filePath),
                        content,
                        size: stats.size,
                        modified: stats.mtime,
                        event: 'sync'
                    };
                    
                    await this.processNote(fileInfo);
                    
                    this.syncState.set(filePath, {
                        lastSync: new Date(),
                        checksum: this.calculateChecksum(content),
                        processed: true
                    });
                    
                    syncedFiles++;
                    
                } catch (error) {
                    console.error(`❌ Error syncing ${filePath}: ${error.message}`);
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ Full sync completed: ${syncedFiles} files in ${duration}ms`);
            
            // Update status note
            this.createSyncStatusNote();
            
            // Broadcast sync completion
            this.broadcastToClients({
                type: 'full-sync-completed',
                data: {
                    syncedFiles,
                    duration,
                    timestamp: new Date()
                }
            });
            
        } catch (error) {
            console.error(`❌ Full sync failed: ${error.message}`);
        }
    }
    
    getAllMarkdownFiles(dirPath) {
        let files = [];
        
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                // Skip .obsidian directory
                if (entry.name === '.obsidian') continue;
                files = files.concat(this.getAllMarkdownFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }
    
    startPeriodicSync() {
        console.log(`⏰ Starting periodic sync every ${this.config.syncIntervalMs / 1000} seconds`);
        
        setInterval(async () => {
            if (this.isRunning) {
                await this.performFullSync();
            }
        }, this.config.syncIntervalMs);
    }
    
    calculateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    getTotalNoteCount() {
        if (!fs.existsSync(this.config.vaultPath)) return 0;
        return this.getAllMarkdownFiles(this.config.vaultPath).length;
    }
    
    async handleSyncRequest(req, res) {
        const url = require('url');
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        console.log(`📡 Sync API: ${req.method} ${path}`);
        
        try {
            if (path === '/api/sync/status') {
                await this.handleSyncStatus(req, res);
            } else if (path === '/api/sync/full') {
                await this.handleFullSyncRequest(req, res);
            } else if (path === '/api/sync/components') {
                await this.handleComponentsRequest(req, res);
            } else if (path === '/health') {
                this.sendResponse(res, 200, { status: 'healthy', service: 'obsidian-cal-sync' });
            } else {
                this.sendResponse(res, 404, { error: 'Endpoint not found' });
            }
        } catch (error) {
            console.error('❌ Sync API error:', error);
            this.sendResponse(res, 500, { error: 'Internal server error' });
        }
    }
    
    async handleSyncStatus(req, res) {
        const status = {
            isRunning: this.isRunning,
            vaultPath: this.config.vaultPath,
            totalNotes: this.getTotalNoteCount(),
            syncedNotes: this.syncState.size,
            buildableComponents: this.componentMap.size,
            activeLinks: this.linkGraph.size,
            lastFullSync: this.lastFullSync || null,
            connectedClients: this.wsClients.length
        };
        
        this.sendResponse(res, 200, status);
    }
    
    async handleFullSyncRequest(req, res) {
        console.log('📡 Full sync requested via API');
        
        // Start async full sync
        this.performFullSync().catch(error => {
            console.error('❌ API-triggered full sync failed:', error);
        });
        
        this.sendResponse(res, 200, { 
            message: 'Full sync started',
            timestamp: new Date()
        });
    }
    
    async handleComponentsRequest(req, res) {
        const components = Array.from(this.componentMap.entries()).map(([filePath, component]) => ({
            filePath: path.relative(this.config.vaultPath, filePath),
            ...component
        }));
        
        this.sendResponse(res, 200, { components });
    }
    
    broadcastToClients(message) {
        const data = JSON.stringify(message);
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    handleWebSocketMessage(ws, message) {
        const { type, data } = message;
        
        if (type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
        } else if (type === 'get-vault-state') {
            ws.send(JSON.stringify({
                type: 'vault-state',
                data: {
                    totalNotes: this.getTotalNoteCount(),
                    buildableComponents: this.componentMap.size,
                    activeLinks: this.linkGraph.size,
                    lastSync: new Date()
                }
            }));
        } else if (type === 'trigger-full-sync') {
            this.performFullSync().catch(error => {
                console.error('❌ WebSocket-triggered sync failed:', error);
            });
        }
    }
    
    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
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
    
    // CLI interface
    showStatus() {
        console.log('');
        console.log('🔄 OBSIDIAN CAL SYNC STATUS');
        console.log('===========================');
        console.log(`Running: ${this.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`Vault Path: ${this.config.vaultPath}`);
        console.log(`Total Notes: ${this.getTotalNoteCount()}`);
        console.log(`Synced Notes: ${this.syncState.size}`);
        console.log(`Buildable Components: ${this.componentMap.size}`);
        console.log(`Active Links: ${this.linkGraph.size}`);
        console.log(`WebSocket Clients: ${this.wsClients.length}`);
        console.log('');
        
        if (this.componentMap.size > 0) {
            console.log('🧩 Buildable Components:');
            Array.from(this.componentMap.entries()).slice(0, 5).forEach(([filePath, component]) => {
                const relativePath = path.relative(this.config.vaultPath, filePath);
                console.log(`   ${component.name} (${relativePath})`);
            });
            console.log('');
        }
    }
}

// CLI interface
if (require.main === module) {
    const sync = new ObsidianCALSync();
    
    const command = process.argv[2];
    
    if (command === 'status') {
        sync.showStatus();
        process.exit(0);
    }
    
    if (command === 'sync') {
        console.log('🔄 Performing one-time sync...');
        sync.performFullSync().then(() => {
            console.log('✅ Sync complete');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Sync failed:', error);
            process.exit(1);
        });
        return;
    }
    
    // Start the sync service
    sync.start().catch(error => {
        console.error('❌ Failed to start Obsidian CAL Sync:', error);
        process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Obsidian CAL Sync shutting down...');
        sync.isRunning = false;
        if (sync.fileWatcher) sync.fileWatcher.close();
        process.exit(0);
    });
}

module.exports = ObsidianCALSync;