#!/usr/bin/env node

/**
 * 🔍🔗 CAL INTEGRATED SEARCH
 * 
 * Unified search interface that combines:
 * - CAL Context Discovery Bridge (code search)
 * - Runtime Capsule System (historical data)
 * - Filesystem Abstraction (multi-backend search)
 * - MDX Export (documentation generation)
 * - PHP Forum Integration (team collaboration)
 * 
 * This is the master search system that ties everything together!
 */

const express = require('express');
const CALContextCapsuleBridge = require('./cal-context-capsule-bridge.js');
const CALFilesystemAbstraction = require('./cal-filesystem-abstraction.js');
const CALContextMDXExporter = require('./cal-context-mdx-exporter.js');
const EventEmitter = require('events');

class CALIntegratedSearch extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Server settings
            port: config.port || 7890,
            
            // Component settings
            enableCapsules: config.enableCapsules !== false,
            enableFilesystem: config.enableFilesystem !== false,
            enableMDXExport: config.enableMDXExport !== false,
            enablePHPForum: config.enablePHPForum || false,
            
            // Integration URLs
            capsuleSystemUrl: config.capsuleSystemUrl || 'http://localhost:4900',
            phpForumUrl: config.phpForumUrl || 'http://localhost:7777',
            calSecureOSUrl: config.calSecureOSUrl || 'http://localhost:8890',
            
            // Search settings
            maxResults: config.maxResults || 50,
            searchTimeout: config.searchTimeout || 30000,
            
            // Export settings
            autoExport: config.autoExport || false,
            exportFormats: config.exportFormats || ['mdx'],
            
            ...config
        };
        
        // Initialize components
        this.app = express();
        this.components = {
            contextCapsuleBridge: null,
            filesystem: null,
            mdxExporter: null
        };
        
        // Search history and cache
        this.searchHistory = [];
        this.searchCache = new Map();
        
        // Statistics
        this.stats = {
            totalSearches: 0,
            componentsUsed: {},
            exportCount: 0,
            averageSearchTime: 0
        };
        
        console.log('🔍🔗 CAL Integrated Search System initializing...');
    }
    
    async initialize() {
        console.log('🚀 Starting Integrated Search System...');
        
        // Setup Express server
        this.setupServer();
        
        // Initialize components
        await this.initializeComponents();
        
        // Start server
        this.app.listen(this.config.port, () => {
            console.log(`✅ CAL Integrated Search running on http://localhost:${this.config.port}`);
            console.log('📊 Dashboard: http://localhost:' + this.config.port);
        });
    }
    
    async initializeComponents() {
        // Initialize Context Capsule Bridge
        if (this.config.enableCapsules) {
            try {
                this.components.contextCapsuleBridge = new CALContextCapsuleBridge({
                    capsuleSystemUrl: this.config.capsuleSystemUrl,
                    autoCapsule: false
                });
                await this.components.contextCapsuleBridge.initialize();
                console.log('✅ Context Capsule Bridge initialized');
            } catch (error) {
                console.warn('⚠️ Context Capsule Bridge initialization failed:', error.message);
            }
        }
        
        // Initialize Filesystem Abstraction
        if (this.config.enableFilesystem) {
            try {
                this.components.filesystem = new CALFilesystemAbstraction({
                    backends: {
                        local: { enabled: true },
                        obsidianVault: { enabled: true },
                        calSecureOS: { enabled: this.config.enableCalSecureOS || false }
                    }
                });
                await this.components.filesystem.initialize();
                console.log('✅ Filesystem Abstraction initialized');
            } catch (error) {
                console.warn('⚠️ Filesystem Abstraction initialization failed:', error.message);
            }
        }
        
        // Initialize MDX Exporter
        if (this.config.enableMDXExport) {
            try {
                this.components.mdxExporter = new CALContextMDXExporter({
                    enableCapsules: this.config.enableCapsules
                });
                await this.components.mdxExporter.initialize();
                console.log('✅ MDX Exporter initialized');
            } catch (error) {
                console.warn('⚠️ MDX Exporter initialization failed:', error.message);
            }
        }
    }
    
    setupServer() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname + '/public'));
        
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Integrated search endpoint
        this.app.post('/api/search', async (req, res) => {
            try {
                const result = await this.performIntegratedSearch(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Search history
        this.app.get('/api/history', (req, res) => {
            res.json(this.searchHistory.slice(-50));
        });
        
        // Export endpoint
        this.app.post('/api/export', async (req, res) => {
            try {
                const result = await this.exportSearchResults(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Component status
        this.app.get('/api/status', (req, res) => {
            res.json(this.getComponentStatus());
        });
        
        // Statistics
        this.app.get('/api/stats', (req, res) => {
            res.json(this.getStatistics());
        });
    }
    
    /**
     * Main integrated search method
     */
    async performIntegratedSearch(searchRequest) {
        const startTime = Date.now();
        const searchId = this.generateSearchId();
        
        console.log(`🔍 Integrated search: "${searchRequest.query}"`);
        
        this.stats.totalSearches++;
        
        const search = {
            id: searchId,
            query: searchRequest.query,
            options: searchRequest.options || {},
            timestamp: new Date().toISOString(),
            components: searchRequest.components || ['all']
        };
        
        // Check cache
        const cacheKey = this.getCacheKey(search);
        if (this.searchCache.has(cacheKey)) {
            console.log('📋 Returning cached results');
            return this.searchCache.get(cacheKey);
        }
        
        // Perform parallel searches across components
        const searchPromises = [];
        
        // Context search (code + TODOs)
        if (this.shouldUseComponent('context', search.components)) {
            searchPromises.push(this.searchContext(search));
        }
        
        // Capsule search (historical data)
        if (this.shouldUseComponent('capsules', search.components)) {
            searchPromises.push(this.searchCapsules(search));
        }
        
        // Filesystem search
        if (this.shouldUseComponent('filesystem', search.components)) {
            searchPromises.push(this.searchFilesystem(search));
        }
        
        // Wait for all searches with timeout
        const results = await Promise.race([
            Promise.all(searchPromises),
            this.timeout(this.config.searchTimeout)
        ]);
        
        // Merge and rank results
        const mergedResults = this.mergeSearchResults(results);
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        // Build response
        const response = {
            searchId,
            query: search.query,
            timestamp: search.timestamp,
            executionTime,
            results: mergedResults,
            stats: {
                totalResults: mergedResults.totalCount,
                componentsSearched: results.length,
                codeSnippets: mergedResults.codeSnippets?.length || 0,
                todos: mergedResults.todos?.length || 0,
                files: mergedResults.files?.length || 0,
                capsules: mergedResults.capsules?.length || 0
            },
            export: {
                available: this.config.enableMDXExport,
                formats: this.config.exportFormats
            }
        };
        
        // Cache results
        this.searchCache.set(cacheKey, response);
        setTimeout(() => this.searchCache.delete(cacheKey), 300000); // 5 min cache
        
        // Add to history
        this.searchHistory.push({
            id: searchId,
            query: search.query,
            timestamp: search.timestamp,
            executionTime,
            resultCount: mergedResults.totalCount
        });
        
        // Auto-export if enabled
        if (this.config.autoExport) {
            this.exportSearchResults({ searchId, results: mergedResults });
        }
        
        // Update statistics
        this.updateStatistics(executionTime);
        
        console.log(`✅ Search completed in ${executionTime}ms`);
        
        return response;
    }
    
    /**
     * Component search methods
     */
    
    async searchContext(search) {
        if (!this.components.contextCapsuleBridge) {
            return { component: 'context', error: 'Not initialized' };
        }
        
        try {
            const result = await this.components.contextCapsuleBridge.searchWithCapsule(
                search.query,
                search.options
            );
            
            this.stats.componentsUsed.context = (this.stats.componentsUsed.context || 0) + 1;
            
            return {
                component: 'context',
                codeSnippets: result.codeSnippets,
                todos: result.todos,
                suggestions: result.suggestions,
                capsuleId: result.capsuleId
            };
        } catch (error) {
            return { component: 'context', error: error.message };
        }
    }
    
    async searchCapsules(search) {
        if (!this.components.contextCapsuleBridge) {
            return { component: 'capsules', error: 'Not initialized' };
        }
        
        try {
            const history = await this.components.contextCapsuleBridge.queryContextHistory(
                search.query,
                search.options.timeRange || '24h'
            );
            
            this.stats.componentsUsed.capsules = (this.stats.componentsUsed.capsules || 0) + 1;
            
            return {
                component: 'capsules',
                capsules: history.capsules || [],
                timeRange: history.timeRange
            };
        } catch (error) {
            return { component: 'capsules', error: error.message };
        }
    }
    
    async searchFilesystem(search) {
        if (!this.components.filesystem) {
            return { component: 'filesystem', error: 'Not initialized' };
        }
        
        try {
            // Search for files matching query
            const files = await this.components.filesystem.list('/', {
                recursive: true,
                pattern: `*${search.query}*`
            });
            
            this.stats.componentsUsed.filesystem = (this.stats.componentsUsed.filesystem || 0) + 1;
            
            return {
                component: 'filesystem',
                files: files.slice(0, this.config.maxResults)
            };
        } catch (error) {
            return { component: 'filesystem', error: error.message };
        }
    }
    
    /**
     * Result merging and ranking
     */
    
    mergeSearchResults(componentResults) {
        const merged = {
            codeSnippets: [],
            todos: [],
            files: [],
            capsules: [],
            suggestions: [],
            errors: [],
            totalCount: 0
        };
        
        for (const result of componentResults) {
            if (result.error) {
                merged.errors.push({
                    component: result.component,
                    error: result.error
                });
                continue;
            }
            
            if (result.codeSnippets) {
                merged.codeSnippets.push(...result.codeSnippets);
            }
            
            if (result.todos) {
                merged.todos.push(...result.todos);
            }
            
            if (result.files) {
                merged.files.push(...result.files);
            }
            
            if (result.capsules) {
                merged.capsules.push(...result.capsules);
            }
            
            if (result.suggestions) {
                merged.suggestions.push(...result.suggestions);
            }
        }
        
        // Sort by relevance
        merged.codeSnippets.sort((a, b) => b.relevance - a.relevance);
        merged.todos.sort((a, b) => b.relevance - a.relevance);
        
        // Calculate total
        merged.totalCount = 
            merged.codeSnippets.length + 
            merged.todos.length + 
            merged.files.length + 
            merged.capsules.length;
        
        return merged;
    }
    
    /**
     * Export search results
     */
    async exportSearchResults(exportRequest) {
        if (!this.components.mdxExporter) {
            throw new Error('MDX Exporter not initialized');
        }
        
        const { searchId, query, results, format = 'mdx' } = exportRequest;
        
        console.log(`📄 Exporting search results for: ${query || searchId}`);
        
        // If we have results, use them; otherwise fetch from history
        let exportData = results;
        if (!exportData && searchId) {
            const historical = this.searchHistory.find(s => s.id === searchId);
            if (historical) {
                exportData = historical.results;
            }
        }
        
        if (!exportData) {
            throw new Error('No results to export');
        }
        
        // Perform export
        const exportResult = await this.components.mdxExporter.exportSearchContext(
            query || 'Historical Search',
            { formats: [format] }
        );
        
        this.stats.exportCount++;
        
        return {
            success: true,
            exportPath: exportResult.mdxPath,
            format
        };
    }
    
    /**
     * Helper methods
     */
    
    shouldUseComponent(component, requestedComponents) {
        if (requestedComponents.includes('all')) return true;
        return requestedComponents.includes(component);
    }
    
    generateSearchId() {
        return `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    getCacheKey(search) {
        return `${search.query}-${JSON.stringify(search.options)}-${search.components.join(',')}`;
    }
    
    timeout(ms) {
        return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Search timeout')), ms)
        );
    }
    
    updateStatistics(executionTime) {
        const totalTime = this.stats.averageSearchTime * (this.stats.totalSearches - 1) + executionTime;
        this.stats.averageSearchTime = Math.round(totalTime / this.stats.totalSearches);
    }
    
    getComponentStatus() {
        return {
            contextCapsuleBridge: !!this.components.contextCapsuleBridge,
            filesystem: !!this.components.filesystem,
            mdxExporter: !!this.components.mdxExporter,
            capsuleSystem: this.config.enableCapsules,
            phpForum: this.config.enablePHPForum
        };
    }
    
    getStatistics() {
        const componentStats = {};
        
        if (this.components.contextCapsuleBridge) {
            componentStats.contextBridge = this.components.contextCapsuleBridge.getStats();
        }
        
        if (this.components.filesystem) {
            componentStats.filesystem = this.components.filesystem.getStats();
        }
        
        if (this.components.mdxExporter) {
            componentStats.mdxExporter = this.components.mdxExporter.getStats();
        }
        
        return {
            search: this.stats,
            components: componentStats,
            cache: {
                size: this.searchCache.size,
                historyLength: this.searchHistory.length
            }
        };
    }
    
    generateDashboard() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAL Integrated Search</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #0a0a0a;
            color: #e0e0e0;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 1px solid #333;
        }
        h1 {
            margin: 0;
            font-size: 3em;
            background: linear-gradient(45deg, #00ff88, #0088ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .search-box {
            margin: 40px auto;
            max-width: 800px;
        }
        input[type="text"] {
            width: 100%;
            padding: 20px;
            font-size: 18px;
            background: #1a1a1a;
            border: 2px solid #333;
            color: #fff;
            border-radius: 10px;
            outline: none;
        }
        input[type="text"]:focus {
            border-color: #0088ff;
            box-shadow: 0 0 20px rgba(0, 136, 255, 0.3);
        }
        .options {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .option {
            background: #1a1a1a;
            padding: 15px 25px;
            border-radius: 8px;
            border: 1px solid #333;
            cursor: pointer;
            transition: all 0.3s;
        }
        .option:hover {
            border-color: #0088ff;
            transform: translateY(-2px);
        }
        .option.active {
            background: #0088ff;
            color: #fff;
        }
        .results {
            margin-top: 40px;
        }
        .result-section {
            background: #1a1a1a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            border: 1px solid #333;
        }
        .result-section h3 {
            margin-top: 0;
            color: #0088ff;
        }
        .code-snippet {
            background: #0a0a0a;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        .todo-item {
            padding: 10px;
            margin: 5px 0;
            border-left: 3px solid #ff8800;
            background: rgba(255, 136, 0, 0.1);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .stat-card {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #333;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #00ff88;
        }
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2em;
            color: #666;
        }
        .export-button {
            background: linear-gradient(45deg, #00ff88, #0088ff);
            color: #000;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .export-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 CAL Integrated Search</h1>
            <p>Unified search across code, TODOs, capsules, and filesystems</p>
        </header>
        
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search for code, TODOs, patterns..." />
            
            <div class="options">
                <label class="option active">
                    <input type="checkbox" checked data-component="context"> Code & TODOs
                </label>
                <label class="option active">
                    <input type="checkbox" checked data-component="capsules"> Historical Data
                </label>
                <label class="option active">
                    <input type="checkbox" checked data-component="filesystem"> Files
                </label>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="totalSearches">0</div>
                <div>Total Searches</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="avgTime">0ms</div>
                <div>Avg Search Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="cacheSize">0</div>
                <div>Cached Results</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="exports">0</div>
                <div>Exports Created</div>
            </div>
        </div>
        
        <div id="results" class="results"></div>
    </div>
    
    <script>
        let currentSearchId = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            updateStats();
            
            // Search on Enter
            document.getElementById('searchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            // Update stats every 5 seconds
            setInterval(updateStats, 5000);
        });
        
        async function performSearch() {
            const query = document.getElementById('searchInput').value;
            if (!query) return;
            
            const components = [];
            document.querySelectorAll('.option input:checked').forEach(cb => {
                components.push(cb.dataset.component);
            });
            
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="loading">🔍 Searching...</div>';
            
            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, components })
                });
                
                const data = await response.json();
                currentSearchId = data.searchId;
                displayResults(data);
                updateStats();
                
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Search failed: ' + error.message + '</div>';
            }
        }
        
        function displayResults(data) {
            const resultsDiv = document.getElementById('results');
            let html = '';
            
            // Search metadata
            html += \`<div class="result-section">
                <h3>Search Results</h3>
                <p>Query: <strong>\${data.query}</strong></p>
                <p>Execution Time: <strong>\${data.executionTime}ms</strong></p>
                <p>Total Results: <strong>\${data.stats.totalResults}</strong></p>
                \${data.export.available ? '<button class="export-button" onclick="exportResults()">Export as MDX</button>' : ''}
            </div>\`;
            
            // Code snippets
            if (data.results.codeSnippets && data.results.codeSnippets.length > 0) {
                html += '<div class="result-section"><h3>Code Snippets</h3>';
                data.results.codeSnippets.slice(0, 5).forEach(snippet => {
                    html += \`<div class="code-snippet">
                        <strong>\${snippet.file}:\${snippet.lineNumber}</strong>
                        <pre>\${escapeHtml(snippet.matchedLine)}</pre>
                    </div>\`;
                });
                html += '</div>';
            }
            
            // TODOs
            if (data.results.todos && data.results.todos.length > 0) {
                html += '<div class="result-section"><h3>Related TODOs</h3>';
                data.results.todos.slice(0, 10).forEach(todo => {
                    html += \`<div class="todo-item">
                        <strong>[\${todo.type}]</strong> \${escapeHtml(todo.content)}
                        <br><small>\${todo.file}:\${todo.line}</small>
                    </div>\`;
                });
                html += '</div>';
            }
            
            // Files
            if (data.results.files && data.results.files.length > 0) {
                html += '<div class="result-section"><h3>Files</h3><ul>';
                data.results.files.slice(0, 10).forEach(file => {
                    html += \`<li>\${file}</li>\`;
                });
                html += '</ul></div>';
            }
            
            resultsDiv.innerHTML = html;
        }
        
        async function exportResults() {
            if (!currentSearchId) return;
            
            try {
                const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ searchId: currentSearchId })
                });
                
                const data = await response.json();
                alert('Export created: ' + data.exportPath);
                updateStats();
                
            } catch (error) {
                alert('Export failed: ' + error.message);
            }
        }
        
        async function updateStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalSearches').textContent = stats.search.totalSearches;
                document.getElementById('avgTime').textContent = stats.search.averageSearchTime + 'ms';
                document.getElementById('cacheSize').textContent = stats.cache.size;
                document.getElementById('exports').textContent = stats.search.exportCount;
                
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }
        
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }
    </script>
</body>
</html>`;
    }
}

module.exports = CALIntegratedSearch;

// Run the integrated search system
if (require.main === module) {
    const searchSystem = new CALIntegratedSearch({
        enableCapsules: true,
        enableFilesystem: true,
        enableMDXExport: true,
        autoExport: false
    });
    
    searchSystem.initialize().catch(console.error);
}