#!/usr/bin/env node

/**
 * REPO ROUTER - Multi-Repository Website Orchestrator
 * 
 * Single-file system that connects multiple GitHub repositories to your website.
 * Acts as a router, transformer, and widget generator for distributed repo architecture.
 * 
 * Features:
 * - Git remote connector for multiple repositories
 * - Widget generator for embeddable repo content
 * - Domain expert routing (routes requests to appropriate repos)
 * - Array transformer for data format conversion
 * - Cross-repo communication API
 * - Auto-deploy webhook system
 * 
 * Usage:
 *   node repo-router.js --serve (start web server)
 *   node repo-router.js --deploy (deploy to production)
 *   node repo-router.js --sync (sync all connected repos)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');
const EventEmitter = require('events');

class RepoRouter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 3000,
            repoRegistryFile: options.repoRegistryFile || './repos.json',
            widgetDir: options.widgetDir || './widgets',
            apiDir: options.apiDir || './api',
            cacheDir: options.cacheDir || './cache',
            webhookSecret: options.webhookSecret || process.env.WEBHOOK_SECRET,
            githubToken: options.githubToken || process.env.GITHUB_TOKEN,
            domain: options.domain || 'localhost',
            ssl: options.ssl !== false,
            ...options
        };
        
        // Repository registry
        this.repos = new Map();
        this.domainExperts = new Map();
        this.widgets = new Map();
        this.apiEndpoints = new Map();
        
        // Cache system
        this.cache = new Map();
        this.cacheExpiry = new Map();
        
        // Load repository registry
        this.loadRepoRegistry();
        
        // Initialize directories
        this.initializeDirectories();
        
        console.log('🎛️  Repo Router initialized');
        console.log(`📁 Monitoring ${this.repos.size} repositories`);
    }
    
    /**
     * Load repository registry from JSON file
     */
    loadRepoRegistry() {
        try {
            if (fs.existsSync(this.config.repoRegistryFile)) {
                const registryData = JSON.parse(fs.readFileSync(this.config.repoRegistryFile, 'utf8'));
                
                for (const repoConfig of registryData.repositories || []) {
                    this.repos.set(repoConfig.name, {
                        ...repoConfig,
                        lastSync: null,
                        status: 'pending',
                        widgets: [],
                        apiEndpoints: []
                    });
                    
                    // Register domain expertise
                    if (repoConfig.domains) {
                        for (const domain of repoConfig.domains) {
                            this.domainExperts.set(domain, repoConfig.name);
                        }
                    }
                }
                
                console.log(`📋 Loaded ${this.repos.size} repositories from registry`);
            } else {
                // Create default registry
                this.createDefaultRegistry();
            }
        } catch (error) {
            console.error('❌ Failed to load repo registry:', error.message);
            this.createDefaultRegistry();
        }
    }
    
    /**
     * Create default repository registry
     */
    createDefaultRegistry() {
        const defaultRegistry = {
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            repositories: [
                {
                    name: "document-generator-simple",
                    url: "https://github.com/username/document-generator-simple.git",
                    branch: "main",
                    type: "service",
                    domains: ["document-processing", "mvp-generation"],
                    widgets: ["document-uploader", "mvp-preview"],
                    apiEndpoints: ["/api/upload", "/api/generate"],
                    description: "Simple document to MVP converter",
                    status: "active"
                },
                {
                    name: "ai-services-hub",
                    url: "https://github.com/username/ai-services-hub.git", 
                    branch: "main",
                    type: "service",
                    domains: ["ai", "llm", "chatbot"],
                    widgets: ["ai-chat", "model-selector"],
                    apiEndpoints: ["/api/chat", "/api/models"],
                    description: "AI services and LLM integration",
                    status: "active"
                },
                {
                    name: "business-dashboard",
                    url: "https://github.com/username/business-dashboard.git",
                    branch: "main", 
                    type: "frontend",
                    domains: ["analytics", "dashboard", "business"],
                    widgets: ["metrics-widget", "chart-widget"],
                    apiEndpoints: ["/api/analytics"],
                    description: "Business analytics dashboard",
                    status: "active"
                }
            ],
            routing: {
                defaultRoute: "document-generator-simple",
                expertRouting: true,
                fallbackBehavior: "proxy"
            },
            deployment: {
                autoSync: true,
                webhooksEnabled: true,
                caching: true
            }
        };
        
        fs.writeFileSync(this.config.repoRegistryFile, JSON.stringify(defaultRegistry, null, 2));
        console.log('📝 Created default repo registry');
        this.loadRepoRegistry();
    }
    
    /**
     * Initialize required directories
     */
    initializeDirectories() {
        const dirs = [
            this.config.widgetDir,
            this.config.apiDir, 
            this.config.cacheDir,
            './repos'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    
    /**
     * Sync all repositories
     */
    async syncAllRepos() {
        console.log('🔄 Syncing all repositories...');
        
        const syncPromises = Array.from(this.repos.keys()).map(repoName => 
            this.syncRepository(repoName)
        );
        
        const results = await Promise.allSettled(syncPromises);
        
        let successful = 0;
        let failed = 0;
        
        results.forEach((result, index) => {
            const repoName = Array.from(this.repos.keys())[index];
            if (result.status === 'fulfilled') {
                successful++;
                console.log(`✅ ${repoName}: synced successfully`);
            } else {
                failed++;
                console.error(`❌ ${repoName}: ${result.reason.message}`);
            }
        });
        
        console.log(`📊 Sync complete: ${successful} successful, ${failed} failed`);
        return { successful, failed };
    }
    
    /**
     * Sync individual repository
     */
    async syncRepository(repoName) {
        const repo = this.repos.get(repoName);
        if (!repo) {
            throw new Error(`Repository ${repoName} not found in registry`);
        }
        
        const repoDir = path.join('./repos', repoName);
        
        try {
            // Clone or update repository
            if (fs.existsSync(repoDir)) {
                console.log(`🔄 Updating ${repoName}...`);
                execSync(`cd ${repoDir} && git pull origin ${repo.branch}`, { stdio: 'pipe' });
            } else {
                console.log(`📥 Cloning ${repoName}...`);
                execSync(`git clone ${repo.url} ${repoDir}`, { stdio: 'pipe' });
                if (repo.branch !== 'main' && repo.branch !== 'master') {
                    execSync(`cd ${repoDir} && git checkout ${repo.branch}`, { stdio: 'pipe' });
                }
            }
            
            // Update repo status
            repo.lastSync = new Date().toISOString();
            repo.status = 'synced';
            
            // Generate widgets from repo
            await this.generateWidgets(repoName);
            
            // Register API endpoints
            await this.registerApiEndpoints(repoName);
            
            this.emit('repo:synced', { repoName, repo });
            
        } catch (error) {
            repo.status = 'error';
            repo.lastError = error.message;
            this.emit('repo:error', { repoName, error });
            throw error;
        }
    }
    
    /**
     * Generate embeddable widgets from repository content
     */
    async generateWidgets(repoName) {
        const repo = this.repos.get(repoName);
        const repoDir = path.join('./repos', repoName);
        
        if (!fs.existsSync(repoDir)) {
            return;
        }
        
        // Clear existing widgets for this repo
        repo.widgets = [];
        
        // Look for widget definitions or generate from content
        const widgetConfigPath = path.join(repoDir, 'widgets.json');
        let widgetConfigs = [];
        
        if (fs.existsSync(widgetConfigPath)) {
            // Use defined widgets
            widgetConfigs = JSON.parse(fs.readFileSync(widgetConfigPath, 'utf8')).widgets || [];
        } else {
            // Auto-generate widgets based on content
            widgetConfigs = await this.autoGenerateWidgets(repoName, repoDir);
        }
        
        // Generate widget files
        for (const widgetConfig of widgetConfigs) {
            const widgetId = `${repoName}-${widgetConfig.name}`;
            const widgetPath = path.join(this.config.widgetDir, `${widgetId}.js`);
            
            const widgetCode = this.generateWidgetCode(repoName, widgetConfig);
            fs.writeFileSync(widgetPath, widgetCode);
            
            repo.widgets.push({
                id: widgetId,
                name: widgetConfig.name,
                type: widgetConfig.type,
                path: widgetPath,
                embedUrl: `/widgets/${widgetId}.js`
            });
            
            this.widgets.set(widgetId, {
                repoName,
                config: widgetConfig,
                path: widgetPath
            });
        }
        
        console.log(`🎨 Generated ${repo.widgets.length} widgets for ${repoName}`);
    }
    
    /**
     * Auto-generate widgets based on repository content
     */
    async autoGenerateWidgets(repoName, repoDir) {
        const widgets = [];
        
        // Check for common widget patterns
        const patterns = [
            {
                name: 'readme-display',
                type: 'content',
                condition: () => fs.existsSync(path.join(repoDir, 'README.md')),
                source: 'README.md'
            },
            {
                name: 'demo-embed',
                type: 'interactive', 
                condition: () => fs.existsSync(path.join(repoDir, 'demo.html')),
                source: 'demo.html'
            },
            {
                name: 'api-explorer',
                type: 'api',
                condition: () => fs.existsSync(path.join(repoDir, 'openapi.json')),
                source: 'openapi.json'
            },
            {
                name: 'status-badge',
                type: 'badge',
                condition: () => true, // Always generate status badge
                source: null
            }
        ];
        
        for (const pattern of patterns) {
            if (pattern.condition()) {
                widgets.push({
                    name: pattern.name,
                    type: pattern.type,
                    source: pattern.source,
                    autoGenerated: true
                });
            }
        }
        
        return widgets;
    }
    
    /**
     * Generate embeddable widget JavaScript code
     */
    generateWidgetCode(repoName, widgetConfig) {
        const repo = this.repos.get(repoName);
        
        return `
(function() {
    'use strict';
    
    // Widget: ${repoName}-${widgetConfig.name}
    // Type: ${widgetConfig.type}
    // Auto-generated by Repo Router
    
    class ${this.capitalize(repoName)}${this.capitalize(widgetConfig.name)}Widget {
        constructor(container, options = {}) {
            this.container = typeof container === 'string' ? 
                document.querySelector(container) : container;
            this.options = {
                theme: 'auto',
                apiBase: '${this.config.domain}',
                repoName: '${repoName}',
                ...options
            };
            
            this.init();
        }
        
        init() {
            this.render();
            this.bindEvents();
            this.loadData();
        }
        
        render() {
            this.container.innerHTML = \`
                <div class="repo-widget ${repoName}-${widgetConfig.name}" data-theme="\${this.options.theme}">
                    <div class="widget-header">
                        <h3>${repo.description || repoName}</h3>
                        <a href="${repo.url}" target="_blank" class="repo-link">
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                            </svg>
                        </a>
                    </div>
                    <div class="widget-content" id="widget-content-${repoName}-${widgetConfig.name}">
                        <div class="loading">Loading ${widgetConfig.name}...</div>
                    </div>
                    <div class="widget-footer">
                        <small>Last updated: <span id="last-updated">-</span></small>
                    </div>
                </div>
            \`;
        }
        
        bindEvents() {
            // Add widget-specific event handling
        }
        
        async loadData() {
            try {
                const response = await fetch(\`/api/repos/\${this.options.repoName}/widget/\${widgetConfig.name}\`);
                const data = await response.json();
                this.updateContent(data);
            } catch (error) {
                console.error('Widget load error:', error);
                this.showError('Failed to load widget data');
            }
        }
        
        updateContent(data) {
            const contentEl = document.getElementById('widget-content-${repoName}-${widgetConfig.name}');
            const lastUpdatedEl = document.getElementById('last-updated');
            
            // Update content based on widget type
            ${this.generateWidgetTypeSpecificCode(widgetConfig.type)}
            
            lastUpdatedEl.textContent = new Date().toLocaleString();
        }
        
        showError(message) {
            const contentEl = document.getElementById('widget-content-${repoName}-${widgetConfig.name}');
            contentEl.innerHTML = \`<div class="error">\${message}</div>\`;
        }
    }
    
    // Auto-initialization
    window.addEventListener('DOMContentLoaded', function() {
        const containers = document.querySelectorAll('[data-repo-widget="${repoName}-${widgetConfig.name}"]');
        containers.forEach(container => {
            new ${this.capitalize(repoName)}${this.capitalize(widgetConfig.name)}Widget(container);
        });
    });
    
    // Export for manual initialization
    window.${this.capitalize(repoName)}${this.capitalize(widgetConfig.name)}Widget = ${this.capitalize(repoName)}${this.capitalize(widgetConfig.name)}Widget;
    
})();`;
    }
    
    /**
     * Generate widget type-specific content handling code
     */
    generateWidgetTypeSpecificCode(widgetType) {
        switch (widgetType) {
            case 'content':
                return `
                if (data.content) {
                    contentEl.innerHTML = data.content;
                }`;
                
            case 'interactive':
                return `
                if (data.html) {
                    contentEl.innerHTML = data.html;
                    // Execute any scripts
                    const scripts = contentEl.querySelectorAll('script');
                    scripts.forEach(script => {
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        script.parentNode.replaceChild(newScript, script);
                    });
                }`;
                
            case 'api':
                return `
                if (data.endpoints) {
                    const endpointsHtml = data.endpoints.map(endpoint => 
                        \`<div class="api-endpoint">
                            <span class="method \${endpoint.method.toLowerCase()}">\${endpoint.method}</span>
                            <span class="path">\${endpoint.path}</span>
                            <span class="description">\${endpoint.description}</span>
                        </div>\`
                    ).join('');
                    contentEl.innerHTML = endpointsHtml;
                }`;
                
            case 'badge':
                return `
                const status = data.status || 'unknown';
                const color = status === 'synced' ? 'green' : 
                             status === 'error' ? 'red' : 'orange';
                contentEl.innerHTML = \`
                    <div class="status-badge \${color}">
                        <span class="status-dot"></span>
                        \${status.toUpperCase()}
                    </div>
                \`;`;
                
            default:
                return `contentEl.innerHTML = JSON.stringify(data, null, 2);`;
        }
    }
    
    /**
     * Register API endpoints from repository
     */
    async registerApiEndpoints(repoName) {
        const repo = this.repos.get(repoName);
        const repoDir = path.join('./repos', repoName);
        
        // Clear existing endpoints for this repo
        repo.apiEndpoints = [];
        
        // Check for API definition files
        const apiFiles = [
            'openapi.json',
            'api.json', 
            'endpoints.json',
            'package.json' // Check for scripts that might indicate API endpoints
        ];
        
        for (const apiFile of apiFiles) {
            const apiPath = path.join(repoDir, apiFile);
            if (fs.existsSync(apiPath)) {
                try {
                    const apiData = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
                    await this.processApiDefinition(repoName, apiData, apiFile);
                } catch (error) {
                    console.warn(`⚠️  Failed to process ${apiFile} for ${repoName}:`, error.message);
                }
            }
        }
        
        console.log(`🔌 Registered ${repo.apiEndpoints.length} API endpoints for ${repoName}`);
    }
    
    /**
     * Process API definition and register endpoints
     */
    async processApiDefinition(repoName, apiData, sourceFile) {
        const repo = this.repos.get(repoName);
        
        // Handle different API definition formats
        let endpoints = [];
        
        if (sourceFile === 'openapi.json' && apiData.paths) {
            // OpenAPI/Swagger format
            for (const [path, methods] of Object.entries(apiData.paths)) {
                for (const [method, definition] of Object.entries(methods)) {
                    if (typeof definition === 'object') {
                        endpoints.push({
                            method: method.toUpperCase(),
                            path: `/api/repos/${repoName}${path}`,
                            originalPath: path,
                            description: definition.summary || definition.description || '',
                            repoName,
                            sourceFile
                        });
                    }
                }
            }
        } else if (apiData.endpoints) {
            // Custom endpoints format
            endpoints = apiData.endpoints.map(endpoint => ({
                ...endpoint,
                path: `/api/repos/${repoName}${endpoint.path}`,
                originalPath: endpoint.path,
                repoName,
                sourceFile
            }));
        } else if (sourceFile === 'package.json' && apiData.scripts) {
            // Infer from package.json scripts
            if (apiData.scripts.start || apiData.scripts.dev) {
                endpoints.push({
                    method: 'GET',
                    path: `/api/repos/${repoName}/`,
                    originalPath: '/',
                    description: 'Repository main endpoint',
                    repoName,
                    sourceFile
                });
            }
        }
        
        // Register endpoints
        for (const endpoint of endpoints) {
            const endpointId = `${repoName}:${endpoint.method}:${endpoint.originalPath}`;
            this.apiEndpoints.set(endpointId, endpoint);
            repo.apiEndpoints.push(endpoint);
        }
    }
    
    /**
     * Route request to appropriate repository based on domain expertise
     */
    routeByDomain(query) {
        // Simple keyword matching for domain routing
        const queryLower = query.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [domain, repoName] of this.domainExperts.entries()) {
            if (queryLower.includes(domain)) {
                const score = domain.length; // Longer domain matches are better
                if (score > bestScore) {
                    bestMatch = repoName;
                    bestScore = score;
                }
            }
        }
        
        return bestMatch || Array.from(this.repos.keys())[0]; // Default to first repo
    }
    
    /**
     * Transform data between different repository formats
     */
    transformData(data, fromFormat, toFormat) {
        // Array transformer functionality
        if (fromFormat === toFormat) {
            return data;
        }
        
        // Handle common transformations
        const transformations = {
            'json->yaml': (data) => this.jsonToYaml(data),
            'yaml->json': (data) => this.yamlToJson(data),
            'csv->json': (data) => this.csvToJson(data),
            'json->csv': (data) => this.jsonToCsv(data),
            'markdown->html': (data) => this.markdownToHtml(data),
            'html->markdown': (data) => this.htmlToMarkdown(data)
        };
        
        const transformKey = `${fromFormat}->${toFormat}`;
        const transformer = transformations[transformKey];
        
        if (transformer) {
            return transformer(data);
        } else {
            console.warn(`⚠️  No transformer found for ${transformKey}`);
            return data;
        }
    }
    
    /**
     * Start the web server
     */
    async startServer() {
        const express = require('express');
        const app = express();
        
        // Middleware
        app.use(express.json());
        app.use(express.static('public'));
        
        // Serve widgets
        app.use('/widgets', express.static(this.config.widgetDir));
        
        // API routes
        this.setupApiRoutes(app);
        
        // Widget embedding endpoint
        app.get('/embed/:widgetId', (req, res) => {
            const widgetId = req.params.widgetId;
            const widget = this.widgets.get(widgetId);
            
            if (!widget) {
                return res.status(404).json({ error: 'Widget not found' });
            }
            
            res.setHeader('Content-Type', 'text/html');
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${widgetId} Widget</title>
                    <style>
                        body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
                        .repo-widget { border: 1px solid #e1e4e8; border-radius: 6px; overflow: hidden; }
                        .widget-header { background: #f6f8fa; padding: 16px; border-bottom: 1px solid #e1e4e8; }
                        .widget-content { padding: 16px; }
                        .widget-footer { background: #f6f8fa; padding: 8px 16px; font-size: 12px; color: #586069; }
                        .loading { text-align: center; color: #586069; }
                        .error { color: #d73a49; text-align: center; }
                        .status-badge { display: inline-flex; align-items: center; gap: 4px; }
                        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                        .green .status-dot { background: #28a745; }
                        .red .status-dot { background: #dc3545; }
                        .orange .status-dot { background: #fd7e14; }
                    </style>
                </head>
                <body>
                    <div data-repo-widget="${widgetId}"></div>
                    <script src="/widgets/${widgetId}.js"></script>
                </body>
                </html>
            `);
        });
        
        // Start server
        app.listen(this.config.port, () => {
            console.log(`🌐 Repo Router server running on port ${this.config.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.config.port}/`);
            console.log(`🎨 Widgets: http://localhost:${this.config.port}/widgets/`);
            console.log(`🔌 API: http://localhost:${this.config.port}/api/`);
        });
        
        return app;
    }
    
    /**
     * Setup API routes for repo communication
     */
    setupApiRoutes(app) {
        // Repository status API
        app.get('/api/repos', (req, res) => {
            const repoList = Array.from(this.repos.entries()).map(([name, repo]) => ({
                name,
                description: repo.description,
                status: repo.status,
                lastSync: repo.lastSync,
                widgets: repo.widgets.length,
                apiEndpoints: repo.apiEndpoints.length,
                domains: repo.domains
            }));
            
            res.json({ repositories: repoList });
        });
        
        // Individual repo status
        app.get('/api/repos/:repoName', (req, res) => {
            const repo = this.repos.get(req.params.repoName);
            if (!repo) {
                return res.status(404).json({ error: 'Repository not found' });
            }
            res.json(repo);
        });
        
        // Sync repo endpoint
        app.post('/api/repos/:repoName/sync', async (req, res) => {
            try {
                await this.syncRepository(req.params.repoName);
                res.json({ success: true, message: 'Repository synced successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Widget data API
        app.get('/api/repos/:repoName/widget/:widgetName', (req, res) => {
            const { repoName, widgetName } = req.params;
            const widgetId = `${repoName}-${widgetName}`;
            const widget = this.widgets.get(widgetId);
            
            if (!widget) {
                return res.status(404).json({ error: 'Widget not found' });
            }
            
            // Generate widget-specific data
            const widgetData = this.generateWidgetData(repoName, widgetName);
            res.json(widgetData);
        });
        
        // Domain expert routing API
        app.get('/api/route', (req, res) => {
            const query = req.query.q || '';
            const recommendedRepo = this.routeByDomain(query);
            const repo = this.repos.get(recommendedRepo);
            
            res.json({
                query,
                recommendedRepository: recommendedRepo,
                confidence: 0.8, // TODO: Implement actual confidence scoring
                repository: repo ? {
                    name: recommendedRepo,
                    description: repo.description,
                    domains: repo.domains,
                    apiEndpoints: repo.apiEndpoints.map(e => e.path)
                } : null
            });
        });
        
        // Webhook endpoint for auto-deployment
        app.post('/webhook', (req, res) => {
            const signature = req.headers['x-hub-signature-256'];
            const payload = JSON.stringify(req.body);
            
            if (this.config.webhookSecret) {
                const expectedSignature = 'sha256=' + 
                    crypto.createHmac('sha256', this.config.webhookSecret)
                          .update(payload)
                          .digest('hex');
                
                if (signature !== expectedSignature) {
                    return res.status(401).json({ error: 'Invalid signature' });
                }
            }
            
            // Handle webhook
            this.handleWebhook(req.body);
            res.json({ success: true });
        });
    }
    
    /**
     * Generate widget-specific data
     */
    generateWidgetData(repoName, widgetName) {
        const repo = this.repos.get(repoName);
        const repoDir = path.join('./repos', repoName);
        
        switch (widgetName) {
            case 'readme-display':
                const readmePath = path.join(repoDir, 'README.md');
                if (fs.existsSync(readmePath)) {
                    const content = fs.readFileSync(readmePath, 'utf8');
                    return { 
                        content: this.markdownToHtml(content),
                        lastUpdated: repo.lastSync
                    };
                }
                break;
                
            case 'status-badge':
                return {
                    status: repo.status,
                    lastSync: repo.lastSync,
                    lastError: repo.lastError
                };
                
            case 'api-explorer':
                return {
                    endpoints: repo.apiEndpoints.map(endpoint => ({
                        method: endpoint.method,
                        path: endpoint.originalPath,
                        description: endpoint.description
                    }))
                };
                
            default:
                return { 
                    status: repo.status,
                    lastUpdated: repo.lastSync 
                };
        }
        
        return {};
    }
    
    /**
     * Handle webhook events
     */
    async handleWebhook(payload) {
        if (payload.action === 'push' && payload.repository) {
            const repoUrl = payload.repository.clone_url;
            
            // Find matching repository
            const matchingRepo = Array.from(this.repos.entries())
                .find(([name, repo]) => repo.url === repoUrl);
            
            if (matchingRepo) {
                const [repoName] = matchingRepo;
                console.log(`🔄 Webhook triggered for ${repoName}, syncing...`);
                
                try {
                    await this.syncRepository(repoName);
                    console.log(`✅ Auto-sync completed for ${repoName}`);
                } catch (error) {
                    console.error(`❌ Auto-sync failed for ${repoName}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Utility functions
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    
    markdownToHtml(markdown) {
        // Simple markdown to HTML conversion
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/\n/gim, '<br>');
    }
    
    htmlToMarkdown(html) {
        // Simple HTML to markdown conversion
        return html
            .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
            .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n') 
            .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
            .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
            .replace(/<em>(.*?)<\/em>/gim, '*$1*')
            .replace(/<code>(.*?)<\/code>/gim, '`$1`')
            .replace(/<br>/gim, '\n');
    }
    
    jsonToYaml(obj) {
        // Simple JSON to YAML conversion
        const yamlify = (obj, indent = 0) => {
            const spaces = '  '.repeat(indent);
            let result = '';
            
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null) {
                    result += `${spaces}${key}:\n${yamlify(value, indent + 1)}`;
                } else {
                    result += `${spaces}${key}: ${value}\n`;
                }
            }
            
            return result;
        };
        
        return yamlify(obj);
    }
    
    yamlToJson(yaml) {
        // Simple YAML to JSON conversion (basic implementation)
        const lines = yaml.split('\n').filter(line => line.trim());
        const result = {};
        
        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                const value = valueParts.join(':').trim();
                result[key.trim()] = value;
            }
        }
        
        return result;
    }
    
    csvToJson(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            data.push(row);
        }
        
        return data;
    }
    
    jsonToCsv(data) {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => 
            headers.map(header => row[header] || '').join(',')
        );
        
        return [csvHeaders, ...csvRows].join('\n');
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const router = new RepoRouter();
    
    if (args.includes('--serve')) {
        router.startServer();
    } else if (args.includes('--sync')) {
        router.syncAllRepos().then(() => {
            console.log('✅ Sync completed');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Sync failed:', error.message);
            process.exit(1);
        });
    } else if (args.includes('--deploy')) {
        console.log('🚀 Deployment functionality coming soon...');
        // TODO: Implement deployment logic
    } else {
        console.log('🎛️  Repo Router - Multi-Repository Website Orchestrator');
        console.log('');
        console.log('Usage:');
        console.log('  node repo-router.js --serve    Start web server');
        console.log('  node repo-router.js --sync     Sync all repositories');
        console.log('  node repo-router.js --deploy   Deploy to production');
        console.log('');
        console.log('Environment variables:');
        console.log('  GITHUB_TOKEN       GitHub personal access token');
        console.log('  WEBHOOK_SECRET     Secret for webhook verification');
    }
}

module.exports = RepoRouter;