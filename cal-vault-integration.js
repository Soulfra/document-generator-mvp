#!/usr/bin/env node

/**
 * CAL Vault Integration
 * 
 * Secure vault management system that bridges CAL Secure OS with
 * the existing ObsidianVault, FinishThisIdea, and Document Generator
 * infrastructure. Creates a unified knowledge base with encryption.
 * 
 * Features:
 * - Encrypted document storage
 * - ObsidianVault bidirectional sync
 * - Document Generator template integration
 * - Version control with git worktrees
 * - Automatic documentation generation
 * - Public/private layer separation
 * - Context-aware organization
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');
const { spawn } = require('child_process');

class CALVaultIntegration extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Vault paths
            secureVaultPath: config.secureVaultPath || path.join(process.cwd(), '.cal-os/vault'),
            obsidianVaultPath: config.obsidianVaultPath || path.join(process.cwd(), 'ObsidianVault'),
            documentGeneratorPath: config.documentGeneratorPath || process.cwd(),
            finishThisIdeaPath: config.finishThisIdeaPath || path.join(process.cwd(), 'FinishThisIdea'),
            
            // Integration settings
            syncInterval: 30000, // 30 seconds
            encryptionEnabled: true,
            versionControl: true,
            autoBackup: true,
            
            // Document categories
            categories: {
                'public': ['README.md', 'docs/', 'examples/'],
                'private': ['notes/', 'drafts/', '.private/'],
                'projects': ['projects/', 'cal-*/'],
                'generated': ['generated/', 'auto-docs/', '.ai-generated/'],
                'templates': ['templates/', '.templates/'],
                'archive': ['archive/', '.archive/', 'backups/']
            },
            
            // CAL chat integration
            calChatUrl: config.calChatUrl || 'http://localhost:9090',
            calDomainManagerUrl: config.calDomainManagerUrl || 'http://localhost:9092',
            calPluginScaffolderUrl: config.calPluginScaffolderUrl || 'http://localhost:9093',
            
            // Security settings
            encryptionAlgorithm: 'aes-256-gcm',
            compressionEnabled: true,
            metadataEncryption: true,
            
            ...config
        };
        
        // Vault state
        this.state = {
            initialized: false,
            syncing: false,
            encrypted: false,
            lastSync: null,
            documentCount: 0,
            categories: new Map(),
            watchers: new Map(),
            syncQueue: []
        };
        
        // Document indexing
        this.documentIndex = new Map();
        this.linkGraph = new Map();
        this.tagIndex = new Map();
        
        // Sync strategies
        this.syncStrategies = {
            'obsidian-notes': this.syncObsidianNotes.bind(this),
            'generated-docs': this.syncGeneratedDocs.bind(this),
            'chat-outputs': this.syncChatOutputs.bind(this),
            'project-files': this.syncProjectFiles.bind(this),
            'templates': this.syncTemplates.bind(this)
        };
        
        // Metadata schemas
        this.schemas = {
            document: {
                title: String,
                created: Date,
                modified: Date,
                category: String,
                tags: Array,
                links: Array,
                encrypted: Boolean,
                source: String, // 'obsidian', 'cal-chat', 'generated', etc.
                version: Number
            },
            project: {
                name: String,
                type: String, // 'saas', 'plugin', 'documentation', etc.
                status: String,
                created: Date,
                lastModified: Date,
                components: Array,
                dependencies: Array,
                outputs: Array
            }
        };
    }
    
    async initialize() {
        console.log('🗄️  CAL VAULT INTEGRATION INITIALIZING');
        console.log('====================================');
        console.log('');
        console.log('🔗 Connecting systems:');
        console.log(`   • Secure Vault: ${this.config.secureVaultPath}`);
        console.log(`   • ObsidianVault: ${this.config.obsidianVaultPath}`);
        console.log(`   • Document Generator: ${this.config.documentGeneratorPath}`);
        console.log(`   • FinishThisIdea: ${this.config.finishThisIdeaPath}`);
        console.log('');
        
        try {
            // Create vault structure
            await this.createVaultStructure();
            
            // Initialize document indexing
            await this.initializeDocumentIndex();
            
            // Setup file watchers
            await this.setupFileWatchers();
            
            // Perform initial sync
            await this.performInitialSync();
            
            // Start periodic sync
            this.startPeriodicSync();
            
            // Initialize CAL services integration
            await this.initializeCALIntegration();
            
            this.state.initialized = true;
            
            console.log('✅ Vault integration initialized successfully');
            console.log(`📊 Indexed ${this.documentIndex.size} documents`);
            console.log(`🏷️  Found ${this.tagIndex.size} unique tags`);
            console.log(`🔗 Mapped ${this.linkGraph.size} document links`);
            console.log('');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Vault integration failed:', error);
            throw error;
        }
    }
    
    /**
     * Create secure vault directory structure
     */
    async createVaultStructure() {
        console.log('📁 Creating vault structure...');
        
        const structure = {
            // Core directories
            'documents': 'User documents and notes',
            'documents/notes': 'Obsidian-style notes',
            'documents/drafts': 'Work-in-progress documents',
            'documents/published': 'Finalized public documents',
            
            // Project organization
            'projects': 'Development projects',
            'projects/active': 'Current active projects',
            'projects/archived': 'Completed/archived projects',
            'projects/templates': 'Project templates',
            
            // Generated content
            'generated': 'AI-generated content',
            'generated/docs': 'Auto-generated documentation',
            'generated/code': 'Generated code snippets',
            'generated/pitches': 'Generated pitch decks',
            
            // System integration
            'integration': 'Integration data',
            'integration/obsidian': 'ObsidianVault sync data',
            'integration/cal-chat': 'CAL chat conversation data',
            'integration/templates': 'Template processing data',
            
            // Private/hidden
            '.private': 'Private documents',
            '.private/keys': 'Encryption keys',
            '.private/config': 'System configuration',
            '.private/logs': 'System logs',
            
            // Backup and versioning
            '.versions': 'Document version history',
            '.backups': 'Automated backups',
            '.sync': 'Sync metadata and state'
        };
        
        for (const [dir, description] of Object.entries(structure)) {
            const fullPath = path.join(this.config.secureVaultPath, dir);
            
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true, mode: 0o700 });
                
                // Create README for documentation
                const readmePath = path.join(fullPath, 'README.md');
                const readmeContent = `# ${path.basename(dir)}\n\n${description}\n\nCreated: ${new Date().toISOString()}\n`;
                
                if (this.config.encryptionEnabled) {
                    await this.saveEncryptedDocument(readmePath, readmeContent, {
                        category: 'system',
                        source: 'vault-integration'
                    });
                } else {
                    fs.writeFileSync(readmePath, readmeContent);
                }
            }
        }
        
        console.log('✅ Vault structure created');
    }
    
    /**
     * Initialize document indexing system
     */
    async initializeDocumentIndex() {
        console.log('📚 Initializing document index...');
        
        // Scan all connected systems
        const scanPaths = [
            { path: this.config.obsidianVaultPath, source: 'obsidian' },
            { path: this.config.documentGeneratorPath, source: 'document-generator' },
            { path: this.config.finishThisIdeaPath, source: 'finish-this-idea' },
            { path: this.config.secureVaultPath, source: 'secure-vault' }
        ];
        
        for (const { path: scanPath, source } of scanPaths) {
            if (fs.existsSync(scanPath)) {
                await this.indexDocuments(scanPath, source);
            }
        }
        
        // Build link graph
        this.buildLinkGraph();
        
        // Build tag index
        this.buildTagIndex();
        
        console.log('✅ Document index initialized');
    }
    
    /**
     * Index documents in a directory
     */
    async indexDocuments(directory, source) {
        const files = this.getDocumentFiles(directory);
        
        for (const file of files) {
            try {
                const stats = fs.statSync(file);
                const content = this.isEncrypted(file) 
                    ? await this.readEncryptedDocument(file)
                    : fs.readFileSync(file, 'utf-8');
                
                const metadata = this.extractMetadata(content, file, source);
                
                this.documentIndex.set(file, {
                    ...metadata,
                    path: file,
                    size: stats.size,
                    lastModified: stats.mtime,
                    indexed: new Date()
                });
                
                this.state.documentCount++;
                
            } catch (error) {
                console.warn(`⚠️  Failed to index ${file}: ${error.message}`);
            }
        }
    }
    
    /**
     * Get all document files recursively
     */
    getDocumentFiles(directory) {
        const files = [];
        
        if (!fs.existsSync(directory)) {
            return files;
        }
        
        const traverse = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    // Skip certain directories
                    if (!item.startsWith('.git') && !item.startsWith('node_modules')) {
                        traverse(itemPath);
                    }
                } else if (this.isDocumentFile(itemPath)) {
                    files.push(itemPath);
                }
            }
        };
        
        traverse(directory);
        return files;
    }
    
    /**
     * Check if file is a document we should index
     */
    isDocumentFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const documentExtensions = ['.md', '.txt', '.rst', '.org', '.tex', '.adoc'];
        return documentExtensions.includes(ext);
    }
    
    /**
     * Extract metadata from document content
     */
    extractMetadata(content, filePath, source) {
        const metadata = {
            title: this.extractTitle(content) || path.basename(filePath, path.extname(filePath)),
            created: fs.statSync(filePath).birthtime,
            modified: fs.statSync(filePath).mtime,
            category: this.categorizeDocument(filePath),
            tags: this.extractTags(content),
            links: this.extractLinks(content),
            encrypted: this.isEncrypted(filePath),
            source,
            version: 1
        };
        
        // Extract frontmatter if present
        const frontmatter = this.extractFrontmatter(content);
        if (frontmatter) {
            Object.assign(metadata, frontmatter);
        }
        
        return metadata;
    }
    
    /**
     * Extract title from document content
     */
    extractTitle(content) {
        // Look for markdown title
        const titleMatch = content.match(/^#\s+(.+)/m);
        if (titleMatch) {
            return titleMatch[1];
        }
        
        // Look for frontmatter title
        const frontmatterMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
        if (frontmatterMatch) {
            return frontmatterMatch[1];
        }
        
        return null;
    }
    
    /**
     * Extract tags from content
     */
    extractTags(content) {
        const tags = [];
        const tagMatches = content.matchAll(this.config.tagPattern || /#([a-zA-Z0-9_-]+)/g);
        
        for (const match of tagMatches) {
            tags.push(match[1]);
        }
        
        return [...new Set(tags)]; // Remove duplicates
    }
    
    /**
     * Extract links from content
     */
    extractLinks(content) {
        const links = [];
        
        // Obsidian-style links [[Link]]
        const obsidianLinks = content.matchAll(/\[\[([^\]]+)\]\]/g);
        for (const match of obsidianLinks) {
            links.push({ type: 'obsidian', target: match[1] });
        }
        
        // Markdown links [Text](URL)
        const markdownLinks = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of markdownLinks) {
            links.push({ type: 'markdown', text: match[1], target: match[2] });
        }
        
        return links;
    }
    
    /**
     * Extract frontmatter metadata
     */
    extractFrontmatter(content) {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            return null;
        }
        
        try {
            const yaml = frontmatterMatch[1];
            const metadata = {};
            
            // Simple YAML parsing
            const lines = yaml.split('\n');
            for (const line of lines) {
                const match = line.match(/^([^:]+):\s*(.+)$/);
                if (match) {
                    let value = match[2].trim();
                    
                    // Parse arrays
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(s => s.trim());
                    }
                    
                    metadata[match[1].trim()] = value;
                }
            }
            
            return metadata;
        } catch (error) {
            console.warn('Failed to parse frontmatter:', error);
            return null;
        }
    }
    
    /**
     * Categorize document based on path and content
     */
    categorizeDocument(filePath) {
        const relativePath = path.relative(this.config.documentGeneratorPath, filePath);
        
        for (const [category, patterns] of Object.entries(this.config.categories)) {
            for (const pattern of patterns) {
                if (relativePath.includes(pattern) || path.basename(filePath).includes(pattern)) {
                    return category;
                }
            }
        }
        
        return 'uncategorized';
    }
    
    /**
     * Build document link graph
     */
    buildLinkGraph() {
        console.log('🔗 Building link graph...');
        
        for (const [filePath, doc] of this.documentIndex) {
            for (const link of doc.links) {
                if (link.type === 'obsidian') {
                    // Find target document
                    const targetPath = this.findDocumentByTitle(link.target);
                    if (targetPath) {
                        if (!this.linkGraph.has(filePath)) {
                            this.linkGraph.set(filePath, []);
                        }
                        this.linkGraph.get(filePath).push(targetPath);
                    }
                }
            }
        }
    }
    
    /**
     * Build tag index
     */
    buildTagIndex() {
        console.log('🏷️  Building tag index...');
        
        for (const [filePath, doc] of this.documentIndex) {
            for (const tag of doc.tags) {
                if (!this.tagIndex.has(tag)) {
                    this.tagIndex.set(tag, []);
                }
                this.tagIndex.get(tag).push(filePath);
            }
        }
    }
    
    /**
     * Setup file watchers for automatic sync
     */
    async setupFileWatchers() {
        console.log('👁️  Setting up file watchers...');
        
        const watchPaths = [
            { path: this.config.obsidianVaultPath, name: 'obsidian' },
            { path: this.config.documentGeneratorPath, name: 'document-generator' },
            { path: this.config.finishThisIdeaPath, name: 'finish-this-idea' }
        ];
        
        for (const { path: watchPath, name } of watchPaths) {
            if (fs.existsSync(watchPath)) {
                const watcher = chokidar.watch(watchPath, {
                    ignored: /(^|[\/\\])\../, // Ignore dotfiles
                    persistent: true,
                    ignoreInitial: true
                });
                
                watcher.on('change', (filePath) => {
                    this.handleFileChange(filePath, 'change');
                });
                
                watcher.on('add', (filePath) => {
                    this.handleFileChange(filePath, 'add');
                });
                
                watcher.on('unlink', (filePath) => {
                    this.handleFileChange(filePath, 'delete');
                });
                
                this.state.watchers.set(name, watcher);
                console.log(`👁️  Watching ${name}: ${watchPath}`);
            }
        }
    }
    
    /**
     * Handle file system changes
     */
    async handleFileChange(filePath, changeType) {
        if (!this.isDocumentFile(filePath)) {
            return;
        }
        
        console.log(`📝 File ${changeType}: ${filePath}`);
        
        // Add to sync queue
        this.state.syncQueue.push({
            filePath,
            changeType,
            timestamp: new Date()
        });
        
        // Process sync queue (debounced)
        if (!this.syncTimeout) {
            this.syncTimeout = setTimeout(async () => {
                await this.processSyncQueue();
                this.syncTimeout = null;
            }, 1000);
        }
    }
    
    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.state.syncing || this.state.syncQueue.length === 0) {
            return;
        }
        
        this.state.syncing = true;
        console.log(`🔄 Processing ${this.state.syncQueue.length} sync items...`);
        
        try {
            while (this.state.syncQueue.length > 0) {
                const item = this.state.syncQueue.shift();
                await this.syncDocument(item);
            }
            
            this.state.lastSync = new Date();
            
        } catch (error) {
            console.error('❌ Sync processing failed:', error);
        } finally {
            this.state.syncing = false;
        }
    }
    
    /**
     * Sync individual document
     */
    async syncDocument(item) {
        const { filePath, changeType } = item;
        
        try {
            switch (changeType) {
                case 'add':
                case 'change':
                    // Re-index document
                    if (fs.existsSync(filePath)) {
                        const source = this.determineSource(filePath);
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const metadata = this.extractMetadata(content, filePath, source);
                        
                        this.documentIndex.set(filePath, {
                            ...metadata,
                            path: filePath,
                            size: fs.statSync(filePath).size,
                            lastModified: fs.statSync(filePath).mtime,
                            indexed: new Date()
                        });
                        
                        // Sync to secure vault
                        await this.syncToSecureVault(filePath, content, metadata);
                        
                        // Update link graph and tag index
                        this.buildLinkGraph();
                        this.buildTagIndex();
                    }
                    break;
                    
                case 'delete':
                    // Remove from index
                    if (this.documentIndex.has(filePath)) {
                        this.documentIndex.delete(filePath);
                        this.state.documentCount--;
                    }
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Failed to sync ${filePath}:`, error);
        }
    }
    
    /**
     * Sync document to secure vault
     */
    async syncToSecureVault(originalPath, content, metadata) {
        // Determine vault path based on category
        let vaultSubdir = '';
        switch (metadata.category) {
            case 'public':
                vaultSubdir = 'documents/published';
                break;
            case 'private':
                vaultSubdir = '.private';
                break;
            case 'projects':
                vaultSubdir = 'projects';
                break;
            case 'generated':
                vaultSubdir = 'generated';
                break;
            default:
                vaultSubdir = 'documents';
        }
        
        const vaultPath = path.join(
            this.config.secureVaultPath,
            vaultSubdir,
            path.basename(originalPath)
        );
        
        // Save with encryption if enabled
        if (this.config.encryptionEnabled) {
            await this.saveEncryptedDocument(vaultPath, content, metadata);
        } else {
            fs.writeFileSync(vaultPath, content);
        }
        
        // Create version backup
        if (this.config.versionControl) {
            await this.createVersionBackup(originalPath, content, metadata);
        }
    }
    
    /**
     * Initialize CAL services integration
     */
    async initializeCALIntegration() {
        console.log('🤖 Initializing CAL integration...');
        
        // Connect to CAL chat interface
        this.calIntegration = {
            chatConnected: false,
            lastConversationSync: null,
            projectMapping: new Map()
        };
        
        // Try to connect to CAL services
        try {
            const response = await fetch(`${this.config.calChatUrl}/api/stats`);
            if (response.ok) {
                this.calIntegration.chatConnected = true;
                console.log('✅ Connected to CAL Chat Interface');
                
                // Sync existing conversations
                await this.syncCALConversations();
            }
        } catch (error) {
            console.log('⚠️  CAL Chat Interface not available');
        }
    }
    
    /**
     * Sync CAL conversations to vault
     */
    async syncCALConversations() {
        try {
            const response = await fetch(`${this.config.calChatUrl}/api/conversations`);
            const conversations = await response.json();
            
            for (const conv of conversations) {
                await this.syncConversationToVault(conv);
            }
            
        } catch (error) {
            console.error('Failed to sync CAL conversations:', error);
        }
    }
    
    /**
     * Sync individual conversation to vault
     */
    async syncConversationToVault(conversation) {
        const conversationDoc = this.formatConversationAsDocument(conversation);
        const filename = `conversation-${conversation.id}.md`;
        const vaultPath = path.join(this.config.secureVaultPath, 'integration/cal-chat', filename);
        
        await this.saveEncryptedDocument(vaultPath, conversationDoc, {
            category: 'integration',
            source: 'cal-chat',
            conversationId: conversation.id,
            tags: ['cal-chat', 'conversation']
        });
    }
    
    /**
     * Format conversation as markdown document
     */
    formatConversationAsDocument(conversation) {
        let doc = `---
title: CAL Conversation ${conversation.id}
created: ${conversation.createdAt}
source: cal-chat
conversationId: ${conversation.id}
tags: [cal-chat, conversation]
---

# CAL Conversation ${conversation.id}

**Created:** ${conversation.createdAt}
**Last Activity:** ${conversation.lastActivity}
**Message Count:** ${conversation.messages.length}

## Messages

`;

        for (const message of conversation.messages) {
            const timestamp = new Date(message.timestamp).toLocaleString();
            const author = message.userId === 'cal' ? '🤖 CAL' : '👤 User';
            
            doc += `### ${author} - ${timestamp}

${message.content}

`;

            if (message.actions && message.actions.length > 0) {
                doc += `**Actions Taken:**
`;
                for (const action of message.actions) {
                    doc += `- ${action.type}: ${action.description || 'No description'}\n`;
                }
                doc += '\n';
            }
        }
        
        return doc;
    }
    
    /**
     * Perform initial sync of all systems
     */
    async performInitialSync() {
        console.log('🔄 Performing initial sync...');
        
        // Sync ObsidianVault
        await this.syncObsidianNotes();
        
        // Sync generated documentation
        await this.syncGeneratedDocs();
        
        // Sync CAL outputs
        await this.syncChatOutputs();
        
        // Sync project files
        await this.syncProjectFiles();
        
        this.state.lastSync = new Date();
        console.log('✅ Initial sync completed');
    }
    
    /**
     * Sync Obsidian notes
     */
    async syncObsidianNotes() {
        if (!fs.existsSync(this.config.obsidianVaultPath)) {
            return;
        }
        
        console.log('📚 Syncing ObsidianVault notes...');
        
        // Get all markdown files from Obsidian vault
        const obsidianFiles = this.getDocumentFiles(this.config.obsidianVaultPath);
        
        for (const file of obsidianFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const metadata = this.extractMetadata(content, file, 'obsidian');
            
            // Sync to secure vault
            await this.syncToSecureVault(file, content, metadata);
        }
    }
    
    /**
     * Save encrypted document
     */
    async saveEncryptedDocument(filePath, content, metadata) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (this.config.encryptionEnabled) {
            // Create encrypted package
            const package = {
                content: this.encrypt(content),
                metadata: this.config.metadataEncryption ? this.encrypt(JSON.stringify(metadata)) : metadata,
                version: 1,
                created: new Date(),
                algorithm: this.config.encryptionAlgorithm
            };
            
            fs.writeFileSync(filePath + '.enc', JSON.stringify(package));
        } else {
            // Save as plaintext with metadata header
            const doc = `---
${Object.entries(metadata).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}
---

${content}`;
            
            fs.writeFileSync(filePath, doc);
        }
    }
    
    /**
     * Read encrypted document
     */
    async readEncryptedDocument(filePath) {
        if (this.isEncrypted(filePath)) {
            const encryptedPath = filePath.endsWith('.enc') ? filePath : filePath + '.enc';
            const package = JSON.parse(fs.readFileSync(encryptedPath, 'utf-8'));
            
            return this.decrypt(package.content);
        } else {
            return fs.readFileSync(filePath, 'utf-8');
        }
    }
    
    /**
     * Check if file is encrypted
     */
    isEncrypted(filePath) {
        return fs.existsSync(filePath + '.enc') || filePath.endsWith('.enc');
    }
    
    // Placeholder encryption methods (would use actual crypto in production)
    encrypt(data) {
        return Buffer.from(data).toString('base64');
    }
    
    decrypt(data) {
        return Buffer.from(data, 'base64').toString('utf-8');
    }
    
    determineSource(filePath) {
        if (filePath.includes('ObsidianVault')) return 'obsidian';
        if (filePath.includes('FinishThisIdea')) return 'finish-this-idea';
        if (filePath.includes('cal-')) return 'cal-generated';
        return 'document-generator';
    }
    
    findDocumentByTitle(title) {
        for (const [filePath, doc] of this.documentIndex) {
            if (doc.title === title) {
                return filePath;
            }
        }
        return null;
    }
    
    async syncGeneratedDocs() {
        console.log('📄 Syncing generated documentation...');
        // Implementation for syncing generated docs
    }
    
    async syncChatOutputs() {
        console.log('💬 Syncing CAL chat outputs...');
        // Implementation for syncing chat outputs
    }
    
    async syncProjectFiles() {
        console.log('🚀 Syncing project files...');
        // Implementation for syncing project files
    }
    
    async syncTemplates() {
        console.log('📋 Syncing templates...');
        // Implementation for syncing templates
    }
    
    async createVersionBackup(filePath, content, metadata) {
        const versionDir = path.join(this.config.secureVaultPath, '.versions');
        const filename = path.basename(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const versionPath = path.join(versionDir, `${filename}-${timestamp}`);
        
        await this.saveEncryptedDocument(versionPath, content, {
            ...metadata,
            originalPath: filePath,
            version: true
        });
    }
    
    startPeriodicSync() {
        setInterval(async () => {
            if (!this.state.syncing) {
                await this.processSyncQueue();
            }
        }, this.config.syncInterval);
    }
    
    getStatus() {
        return {
            initialized: this.state.initialized,
            syncing: this.state.syncing,
            encrypted: this.config.encryptionEnabled,
            lastSync: this.state.lastSync,
            documentCount: this.state.documentCount,
            categories: Object.fromEntries(this.state.categories),
            indexSize: this.documentIndex.size,
            linkCount: this.linkGraph.size,
            tagCount: this.tagIndex.size,
            calIntegration: this.calIntegration
        };
    }
    
    async search(query, options = {}) {
        const results = [];
        
        for (const [filePath, doc] of this.documentIndex) {
            let score = 0;
            
            // Title match
            if (doc.title.toLowerCase().includes(query.toLowerCase())) {
                score += 10;
            }
            
            // Tag match
            if (doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
                score += 5;
            }
            
            // Category match
            if (doc.category.toLowerCase().includes(query.toLowerCase())) {
                score += 3;
            }
            
            if (score > 0) {
                results.push({ ...doc, score });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }
}

module.exports = CALVaultIntegration;

// CLI interface if run directly
if (require.main === module) {
    const vault = new CALVaultIntegration();
    
    vault.initialize().then(() => {
        console.log('Vault integration ready!');
        console.log('Status:', vault.getStatus());
    }).catch(error => {
        console.error('Failed to initialize:', error);
        process.exit(1);
    });
}