/**
 * Internal Search Engine
 * Unified search across all storage locations, documents, and services
 * Connects to your existing Document Generator infrastructure
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
const Redis = require('redis');

class InternalSearchEngine {
    constructor() {
        this.app = express();
        this.port = 3333; // Search engine port
        
        // Database connections
        this.postgres = new Client({
            host: 'localhost',
            port: 5432,
            database: 'document_generator',
            user: 'postgres',
            password: 'postgres'
        });
        
        this.redis = null; // Will connect on startup
        
        // Search index
        this.searchIndex = {
            documents: new Map(),
            services: new Map(),
            configurations: new Map(),
            keywordIndex: new Map(),
            lastUpdated: null
        };
        
        // Storage locations to search
        this.searchPaths = [
            {
                name: 'project-root',
                path: process.cwd(),
                type: 'filesystem',
                priority: 'high'
            },
            {
                name: 'user-uploads',
                path: '/tmp/document-uploads',
                type: 'docker-volume',
                priority: 'high'
            },
            {
                name: 'user-processing', 
                path: '/tmp/document-processing',
                type: 'docker-volume',
                priority: 'medium'
            },
            {
                name: 'user-outputs',
                path: '/tmp/document-outputs',
                type: 'docker-volume',
                priority: 'high'
            }
        ];
        
        // Document types to index
        this.indexableTypes = [
            '.md', '.txt', '.json', '.yml', '.yaml', '.html', '.xml',
            '.js', '.ts', '.py', '.rs', '.go', '.sql',
            '.pdf', '.doc', '.docx', '.csv'
        ];
        
        this.setupExpress();
    }
    
    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(path.join(__dirname, 'search-ui')));
        
        // Search endpoints
        this.app.get('/api/search', this.handleSearch.bind(this));
        this.app.get('/api/search/suggest', this.handleSuggestions.bind(this));
        this.app.get('/api/documents/:id', this.handleGetDocument.bind(this));
        this.app.post('/api/index/rebuild', this.handleRebuildIndex.bind(this));
        this.app.get('/api/index/status', this.handleIndexStatus.bind(this));
        
        // Integration endpoints
        this.app.get('/api/services/status', this.handleServicesStatus.bind(this));
        this.app.get('/api/widget/search', this.handleWidgetSearch.bind(this));
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date(),
                version: '1.0.0',
                searchIndex: {
                    documents: this.searchIndex.documents.size,
                    lastUpdated: this.searchIndex.lastUpdated
                }
            });
        });
        
        // Serve search interface
        this.app.get('/', (req, res) => {
            res.send(this.generateSearchInterface());
        });
    }
    
    async start() {
        try {
            // Connect to Redis for caching
            this.redis = Redis.createClient({
                host: 'localhost',
                port: 6379
            });
            
            await this.redis.connect().catch(() => {
                console.log('⚠️  Redis not available, continuing without caching');
                this.redis = null;
            });
            
            // Connect to PostgreSQL for metadata storage
            await this.postgres.connect().catch(() => {
                console.log('⚠️  PostgreSQL not available, using file-only search');
            });
            
            // Build initial search index
            await this.buildSearchIndex();
            
            // Start HTTP server
            this.app.listen(this.port, () => {
                console.log(`🔍 Internal Search Engine running at http://localhost:${this.port}`);
                console.log(`📊 Search API available at http://localhost:${this.port}/api/search`);
                console.log(`🌐 Search Interface: http://localhost:${this.port}`);
            });
            
            // Auto-rebuild index every 5 minutes
            setInterval(() => {
                this.buildSearchIndex();
            }, 5 * 60 * 1000);
            
        } catch (error) {
            console.error('❌ Failed to start search engine:', error);
            throw error;
        }
    }
    
    async buildSearchIndex() {
        console.log('🔨 Building search index...');
        const startTime = Date.now();
        
        try {
            // Clear existing index
            this.searchIndex.documents.clear();
            this.searchIndex.keywordIndex.clear();
            
            // Index each search path
            for (const searchPath of this.searchPaths) {
                await this.indexPath(searchPath);
            }
            
            // Index services and configurations
            await this.indexServicesAndConfigs();
            
            // Build keyword index
            this.buildKeywordIndex();
            
            this.searchIndex.lastUpdated = new Date();
            const duration = Date.now() - startTime;
            
            console.log(`✅ Search index built: ${this.searchIndex.documents.size} documents in ${duration}ms`);
            
        } catch (error) {
            console.error('❌ Failed to build search index:', error);
        }
    }
    
    async indexPath(searchPath) {
        try {
            await fs.access(searchPath.path);
            await this.scanDirectory(searchPath.path, searchPath);
        } catch (error) {
            // Path doesn't exist, skip
            console.log(`⚠️  Path not available: ${searchPath.path}`);
        }
    }
    
    async scanDirectory(dirPath, searchPath, depth = 0) {
        if (depth > 5) return; // Limit recursion depth
        
        try {
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                if (entry.startsWith('.') || ['node_modules', 'dist', 'build'].includes(entry)) {
                    continue;
                }
                
                const fullPath = path.join(dirPath, entry);
                
                try {
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        await this.scanDirectory(fullPath, searchPath, depth + 1);
                    } else if (stats.isFile()) {
                        await this.indexFile(fullPath, searchPath, stats);
                    }
                } catch (error) {
                    // Skip files we can't access
                    continue;
                }
            }
        } catch (error) {
            // Skip directories we can't access
        }
    }
    
    async indexFile(filePath, searchPath, stats) {
        const fileName = path.basename(filePath);
        const extension = path.extname(fileName).toLowerCase();
        const relativePath = path.relative(searchPath.path, filePath);
        
        // Check if file should be indexed
        const shouldIndex = 
            this.indexableTypes.includes(extension) ||
            this.isImportantFile(fileName);
        
        if (!shouldIndex) return;
        
        const docId = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 12);
        
        const document = {
            id: docId,
            name: fileName,
            path: filePath,
            relativePath: relativePath,
            source: searchPath.name,
            sourceType: searchPath.type,
            extension: extension,
            size: stats.size,
            modified: stats.mtime,
            priority: this.getFilePriority(fileName, searchPath.priority),
            content: null,
            keywords: [],
            searchableText: ''
        };
        
        // Read content for text files
        if (this.isTextFile(extension) && stats.size < 1024 * 1024) { // Max 1MB
            try {
                const content = await fs.readFile(filePath, 'utf8');
                document.content = content.length > 5000 ? content.slice(0, 5000) + '...' : content;
                document.keywords = this.extractKeywords(content, fileName);
                document.searchableText = `${fileName} ${relativePath} ${content} ${document.keywords.join(' ')}`.toLowerCase();
            } catch (error) {
                // Binary or unreadable file
                document.searchableText = `${fileName} ${relativePath}`.toLowerCase();
            }
        } else {
            document.searchableText = `${fileName} ${relativePath}`.toLowerCase();
        }
        
        this.searchIndex.documents.set(docId, document);
    }
    
    isImportantFile(fileName) {
        const importantFiles = [
            'package.json', 'docker-compose.yml', '.env', 'README.md', 'CLAUDE.md',
            'index.js', 'app.js', 'server.js'
        ];
        
        return importantFiles.includes(fileName) || 
               fileName.toLowerCase().includes('readme') ||
               fileName.includes('config') ||
               fileName.includes('setup');
    }
    
    isTextFile(extension) {
        return ['.md', '.txt', '.json', '.yml', '.yaml', '.js', '.ts', '.html', '.xml', '.css', '.sql'].includes(extension);
    }
    
    getFilePriority(fileName, sourcePriority) {
        const priorities = { 'high': 3, 'medium': 2, 'low': 1 };
        let basePriority = priorities[sourcePriority] || 1;
        
        // Boost priority for important files
        if (fileName === 'package.json' || fileName === 'docker-compose.yml' || fileName === 'CLAUDE.md') {
            basePriority += 2;
        } else if (fileName.toLowerCase().includes('readme') || fileName.includes('config')) {
            basePriority += 1;
        }
        
        return Math.min(basePriority, 5);
    }
    
    extractKeywords(content, fileName) {
        const keywords = new Set();
        
        // Important technical keywords
        const techKeywords = [
            'api', 'port', 'service', 'docker', 'database', 'redis', 'postgres',
            'widget', 'character', 'movement', 'ai', 'claude', 'openai', 'ollama',
            'auth', 'login', 'token', 'jwt', 'oauth', 'server', 'client',
            'endpoint', 'route', 'middleware', 'config', 'environment'
        ];
        
        const textToSearch = `${fileName} ${content}`.toLowerCase();
        
        for (const keyword of techKeywords) {
            if (textToSearch.includes(keyword)) {
                keywords.add(keyword);
            }
        }
        
        // Extract ports
        const portMatches = content.match(/(?:port|PORT)[:\s=]*(\d+)|:(\d{4,5})/g);
        if (portMatches) {
            for (const match of portMatches) {
                const numbers = match.match(/\d+/);
                if (numbers && parseInt(numbers[0]) > 1000) {
                    keywords.add(`port-${numbers[0]}`);
                }
            }
        }
        
        // Extract URLs
        const urlMatches = content.match(/https?:\/\/[^\s\)]+/g);
        if (urlMatches) {
            keywords.add('external-url');
        }
        
        return Array.from(keywords);
    }
    
    async indexServicesAndConfigs() {
        // Index known services from service discovery
        const serviceDiscoveryPath = path.join(process.cwd(), 'service-discovery-data.json');
        
        try {
            const serviceData = JSON.parse(await fs.readFile(serviceDiscoveryPath, 'utf8'));
            
            for (const service of serviceData.services || []) {
                const serviceId = `service_${service.file.replace(/[^a-zA-Z0-9]/g, '_')}`;
                
                this.searchIndex.services.set(serviceId, {
                    id: serviceId,
                    type: 'service',
                    name: service.file,
                    category: service.type,
                    ports: service.ports || [],
                    apis: service.apis || [],
                    frameworks: service.frameworks || [],
                    searchableText: `${service.file} ${service.type} ${service.ports?.join(' ')} ${service.frameworks?.join(' ')}`.toLowerCase()
                });
            }
            
        } catch (error) {
            // Service discovery data not available
        }
    }
    
    buildKeywordIndex() {
        // Build reverse index for fast keyword searches
        for (const [docId, document] of this.searchIndex.documents.entries()) {
            for (const keyword of document.keywords) {
                if (!this.searchIndex.keywordIndex.has(keyword)) {
                    this.searchIndex.keywordIndex.set(keyword, []);
                }
                this.searchIndex.keywordIndex.get(keyword).push(docId);
            }
        }
    }
    
    async handleSearch(req, res) {
        const { q: query, limit = 20, offset = 0, type, source } = req.query;
        
        if (!query || query.length < 2) {
            return res.json({
                results: [],
                total: 0,
                query: query,
                suggestions: this.getPopularSearches()
            });
        }
        
        try {
            const results = await this.performSearch(query, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                type,
                source
            });
            
            // Cache results in Redis if available
            if (this.redis) {
                const cacheKey = `search:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;
                await this.redis.setEx(cacheKey, 300, JSON.stringify(results)); // 5 min cache
            }
            
            res.json(results);
            
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
    
    async performSearch(query, options = {}) {
        const queryLower = query.toLowerCase();
        const results = [];
        const { limit = 20, offset = 0 } = options;
        
        // Search documents
        for (const [docId, document] of this.searchIndex.documents.entries()) {
            let relevance = 0;
            const reasons = [];
            
            // Exact filename match - highest relevance
            if (document.name.toLowerCase() === queryLower) {
                relevance += 10;
                reasons.push('exact filename match');
            } else if (document.name.toLowerCase().includes(queryLower)) {
                relevance += 5;
                reasons.push('filename match');
            }
            
            // Path match
            if (document.relativePath.toLowerCase().includes(queryLower)) {
                relevance += 3;
                reasons.push('path match');
            }
            
            // Keyword match
            if (document.keywords.some(k => k.includes(queryLower))) {
                relevance += 4;
                reasons.push('keyword match');
            }
            
            // Content match
            if (document.searchableText.includes(queryLower)) {
                relevance += 2;
                reasons.push('content match');
            }
            
            // Priority boost
            relevance += document.priority;
            
            if (relevance > 0) {
                results.push({
                    ...document,
                    relevance,
                    reasons,
                    type: 'document'
                });
            }
        }
        
        // Search services
        for (const [serviceId, service] of this.searchIndex.services.entries()) {
            if (service.searchableText.includes(queryLower)) {
                results.push({
                    ...service,
                    relevance: 3,
                    reasons: ['service match'],
                    type: 'service'
                });
            }
        }
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        // Apply pagination
        const paginatedResults = results.slice(offset, offset + limit);
        
        return {
            results: paginatedResults,
            total: results.length,
            query: query,
            pagination: {
                limit,
                offset,
                hasMore: offset + limit < results.length
            },
            searchStats: {
                documentsSearched: this.searchIndex.documents.size,
                servicesSearched: this.searchIndex.services.size,
                lastIndexUpdate: this.searchIndex.lastUpdated
            }
        };
    }
    
    async handleSuggestions(req, res) {
        const { q } = req.query;
        
        const suggestions = [];
        
        if (q && q.length > 1) {
            const queryLower = q.toLowerCase();
            
            // Suggest from keywords
            for (const keyword of this.searchIndex.keywordIndex.keys()) {
                if (keyword.includes(queryLower) && suggestions.length < 10) {
                    suggestions.push({
                        text: keyword,
                        type: 'keyword',
                        count: this.searchIndex.keywordIndex.get(keyword).length
                    });
                }
            }
            
            // Suggest from popular searches
            const popular = this.getPopularSearches();
            for (const search of popular) {
                if (search.toLowerCase().includes(queryLower) && suggestions.length < 10) {
                    suggestions.push({
                        text: search,
                        type: 'popular'
                    });
                }
            }
        }
        
        res.json({ suggestions });
    }
    
    getPopularSearches() {
        return [
            'docker-compose', 'package.json', 'README', 'CLAUDE',
            'widget', 'character', 'service', 'api',
            'config', 'setup', 'launch', 'port',
            'database', 'redis', 'postgres'
        ];
    }
    
    async handleGetDocument(req, res) {
        const { id } = req.params;
        
        const document = this.searchIndex.documents.get(id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        try {
            // Return full document with content
            let fullContent = document.content;
            
            // If content was truncated, read full file
            if (document.content && document.content.endsWith('...')) {
                try {
                    fullContent = await fs.readFile(document.path, 'utf8');
                } catch (error) {
                    // Use cached content
                }
            }
            
            res.json({
                ...document,
                content: fullContent,
                fullPath: document.path
            });
            
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve document' });
        }
    }
    
    async handleRebuildIndex(req, res) {
        try {
            await this.buildSearchIndex();
            res.json({
                success: true,
                documentsIndexed: this.searchIndex.documents.size,
                lastUpdated: this.searchIndex.lastUpdated
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to rebuild index' });
        }
    }
    
    async handleIndexStatus(req, res) {
        res.json({
            documents: this.searchIndex.documents.size,
            services: this.searchIndex.services.size,
            keywords: this.searchIndex.keywordIndex.size,
            lastUpdated: this.searchIndex.lastUpdated,
            storage: {
                projectRoot: this.searchPaths.find(p => p.name === 'project-root'),
                userUploads: this.searchPaths.find(p => p.name === 'user-uploads'),
                userProcessing: this.searchPaths.find(p => p.name === 'user-processing'),
                userOutputs: this.searchPaths.find(p => p.name === 'user-outputs')
            }
        });
    }
    
    async handleServicesStatus(req, res) {
        // Check status of known services
        const services = [];
        
        // Test known ports from your ecosystem
        const knownServices = [
            { name: 'Flask Backend', port: 5000, url: 'http://localhost:5000/api/status' },
            { name: 'MCP Template Processor', port: 3000, url: 'http://localhost:3000' },
            { name: 'AI API Service', port: 3001, url: 'http://localhost:3001' },
            { name: 'Unified Bridge API', port: 4000, url: 'http://localhost:4000/api' },
            { name: 'Character Movement', port: 8090, url: 'http://localhost:8090' },
            { name: 'Widget Integration', port: 8091, url: 'http://localhost:8091' }
        ];
        
        for (const service of knownServices) {
            try {
                const isRunning = await this.testServiceConnection(service.port);
                services.push({
                    ...service,
                    status: isRunning ? 'running' : 'stopped',
                    searchable: isRunning
                });
            } catch (error) {
                services.push({
                    ...service,
                    status: 'unknown',
                    searchable: false
                });
            }
        }
        
        res.json({ services });
    }
    
    async testServiceConnection(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            socket.setTimeout(1000);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }
    
    async handleWidgetSearch(req, res) {
        // Special endpoint for widget integration
        const { q, context } = req.query;
        
        const results = await this.performSearch(q, { limit: 5 });
        
        // Format results for widget consumption
        const widgetResults = results.results.map(result => ({
            id: result.id,
            title: result.name,
            summary: result.content ? result.content.slice(0, 100) + '...' : 'No preview available',
            type: result.type,
            relevance: result.relevance,
            path: result.relativePath || result.path,
            canMorphTo: result.extension === '.md' || result.extension === '.html'
        }));
        
        res.json({
            query: q,
            results: widgetResults,
            total: results.total,
            context: context
        });
    }
    
    generateSearchInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Internal Search Engine</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .search-box { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .search-input { width: 100%; padding: 15px; font-size: 18px; border: 2px solid #ddd; border-radius: 8px; }
        .search-input:focus { outline: none; border-color: #007AFF; }
        .search-stats { text-align: center; color: #666; margin-top: 10px; }
        .results { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .result { padding: 20px; border-bottom: 1px solid #eee; }
        .result:last-child { border-bottom: none; }
        .result-title { font-size: 18px; font-weight: bold; color: #007AFF; margin-bottom: 5px; }
        .result-path { color: #666; font-size: 14px; margin-bottom: 8px; }
        .result-preview { color: #333; line-height: 1.4; }
        .result-meta { margin-top: 10px; }
        .result-tag { display: inline-block; background: #007AFF; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; }
        .no-results { text-align: center; padding: 40px; color: #666; }
        .popular-searches { margin-top: 20px; }
        .popular-searches h3 { margin-bottom: 10px; }
        .popular-tag { display: inline-block; background: #e0e0e0; color: #333; padding: 5px 10px; border-radius: 15px; font-size: 14px; margin: 3px; cursor: pointer; }
        .popular-tag:hover { background: #007AFF; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Internal Search Engine</h1>
            <p>Search across all documents, services, and configurations</p>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search documents, services, configurations..." id="searchInput">
            <div class="search-stats" id="searchStats">
                Ready to search • Indexed documents will appear here
            </div>
            
            <div class="popular-searches">
                <h3>Popular Searches:</h3>
                <span class="popular-tag" onclick="performSearch('docker-compose')">docker-compose</span>
                <span class="popular-tag" onclick="performSearch('CLAUDE')">CLAUDE</span>
                <span class="popular-tag" onclick="performSearch('widget')">widget</span>
                <span class="popular-tag" onclick="performSearch('service')">service</span>
                <span class="popular-tag" onclick="performSearch('api')">api</span>
                <span class="popular-tag" onclick="performSearch('config')">config</span>
                <span class="popular-tag" onclick="performSearch('port')">port</span>
                <span class="popular-tag" onclick="performSearch('database')">database</span>
            </div>
        </div>
        
        <div class="results" id="results">
            <div class="no-results">
                <h3>Welcome to your Internal Search Engine!</h3>
                <p>Start typing to search across all your documents and services.</p>
                <br>
                <p><strong>What you can search:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>Project files and documentation</li>
                    <li>Configuration files and settings</li>
                    <li>Running services and APIs</li>
                    <li>Docker volumes and user data</li>
                </ul>
            </div>
        </div>
    </div>
    
    <script>
        const searchInput = document.getElementById('searchInput');
        const searchStats = document.getElementById('searchStats');
        const results = document.getElementById('results');
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                showWelcome();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
        
        async function performSearch(query) {
            searchInput.value = query;
            searchStats.textContent = 'Searching...';
            
            try {
                const response = await fetch('/api/search?q=' + encodeURIComponent(query));
                const data = await response.json();
                
                displayResults(data);
            } catch (error) {
                console.error('Search failed:', error);
                searchStats.textContent = 'Search failed';
            }
        }
        
        function displayResults(data) {
            const { results, total, query, searchStats: stats } = data;
            
            searchStats.innerHTML = \`
                Found <strong>\${total}</strong> results for "\${query}" • 
                \${stats.documentsSearched} documents indexed
            \`;
            
            if (results.length === 0) {
                results.innerHTML = \`
                    <div class="no-results">
                        <h3>No results found for "\${query}"</h3>
                        <p>Try different keywords or check our popular searches above.</p>
                    </div>
                \`;
                return;
            }
            
            results.innerHTML = results.map(result => \`
                <div class="result">
                    <div class="result-title">\${result.name}</div>
                    <div class="result-path">\${result.relativePath || result.path}</div>
                    \${result.content ? \`<div class="result-preview">\${result.content.substring(0, 200)}...</div>\` : ''}
                    <div class="result-meta">
                        <span class="result-tag">\${result.type}</span>
                        <span class="result-tag">\${result.source || 'local'}</span>
                        <span class="result-tag">relevance: \${result.relevance}</span>
                        \${result.keywords ? result.keywords.slice(0, 3).map(k => \`<span class="result-tag">\${k}</span>\`).join('') : ''}
                    </div>
                </div>
            \`).join('');
        }
        
        function showWelcome() {
            searchStats.textContent = 'Ready to search • Type to find documents and services';
            results.innerHTML = \`
                <div class="no-results">
                    <h3>Welcome to your Internal Search Engine!</h3>
                    <p>Start typing to search across all your documents and services.</p>
                    <br>
                    <p><strong>What you can search:</strong></p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Project files and documentation</li>
                        <li>Configuration files and settings</li>
                        <li>Running services and APIs</li>
                        <li>Docker volumes and user data</li>
                    </ul>
                </div>
            \`;
        }
        
        // Load index status on page load
        fetch('/api/index/status')
            .then(response => response.json())
            .then(data => {
                searchStats.innerHTML = \`
                    Ready to search • <strong>\${data.documents}</strong> documents indexed • 
                    <strong>\${data.services}</strong> services • 
                    Last updated: \${new Date(data.lastUpdated).toLocaleTimeString()}
                \`;
            })
            .catch(() => {
                searchStats.textContent = 'Search engine starting up...';
            });
    </script>
</body>
</html>`;
    }
}

// Start the search engine if run directly
if (require.main === module) {
    const searchEngine = new InternalSearchEngine();
    
    searchEngine.start()
        .then(() => {
            console.log('🎉 Internal Search Engine is ready!');
            console.log('💡 This connects to your existing Document Generator infrastructure');
            console.log('🔗 Widget integration available at /api/widget/search');
        })
        .catch(error => {
            console.error('❌ Failed to start search engine:', error);
            process.exit(1);
        });
}

module.exports = InternalSearchEngine;