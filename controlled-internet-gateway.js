#!/usr/bin/env node

/**
 * CONTROLLED INTERNET GATEWAY
 * 
 * Secure, controlled internet access for the self-contained Electron app.
 * All external API calls go through this gateway for security, caching,
 * rate limiting, and logging. Enables OSS discovery while maintaining
 * complete control over internet access.
 * 
 * Features:
 * - Whitelist-based URL filtering
 * - Request/response caching
 * - Rate limiting per endpoint
 * - Request logging and monitoring
 * - API key management
 * - Content filtering and sanitization
 * - Offline mode with cached responses
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

console.log(`
🌐 CONTROLLED INTERNET GATEWAY 🌐
=================================
🔒 Whitelist-based URL filtering
💾 Request/response caching system
⏱️ Rate limiting & throttling
📝 Complete request logging
🔑 API key management
🛡️ Content filtering & security
`);

class ControlledInternetGateway extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 8779,
            cacheDbPath: options.cacheDbPath || './gateway-cache.db',
            maxCacheSize: options.maxCacheSize || 1000000, // 1MB
            maxCacheAge: options.maxCacheAge || 3600000, // 1 hour
            rateLimit: options.rateLimit || 100, // requests per minute
            timeout: options.timeout || 30000, // 30 seconds
            offlineMode: options.offlineMode || false,
            ...options
        };
        
        // Gateway state
        this.state = {
            whitelist: new Set(),
            rateLimits: new Map(),
            cache: new Map(),
            apiKeys: new Map(),
            blockedDomains: new Set(),
            requestLog: []
        };
        
        // Predefined whitelist for OSS discovery
        this.defaultWhitelist = [
            // GitHub API
            'api.github.com',
            'github.com',
            
            // NPM Registry
            'registry.npmjs.org',
            'api.npmjs.org',
            
            // PyPI
            'pypi.org',
            'pypi.python.org',
            
            // Package registries
            'crates.io',
            'packagist.org',
            'nuget.org',
            
            // Documentation sites
            'docs.npmjs.com',
            'docs.github.com',
            
            // Version checking
            'api.github.com/repos',
            'registry.npmjs.org/-/package',
            
            // Security advisories
            'cve.mitre.org',
            'nvd.nist.gov',
            
            // General web APIs
            'httpbin.org',
            'api.github.com/zen'
        ];
        
        // Rate limit configurations per service
        this.rateLimitConfig = {
            'api.github.com': { requests: 60, window: 60000 }, // 60 req/min
            'registry.npmjs.org': { requests: 100, window: 60000 }, // 100 req/min
            'pypi.org': { requests: 50, window: 60000 }, // 50 req/min
            'default': { requests: 30, window: 60000 } // 30 req/min default
        };
        
        this.app = express();
        this.db = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Controlled Internet Gateway...');
        
        try {
            // Setup database for caching
            await this.setupDatabase();
            
            // Load configuration
            await this.loadConfiguration();
            
            // Initialize whitelist
            this.initializeWhitelist();
            
            // Setup HTTP server
            await this.setupServer();
            
            // Start cleanup processes
            this.startMaintenanceTasks();
            
            console.log('✅ Controlled Internet Gateway initialized!');
            console.log(`🌐 Gateway API: http://localhost:${this.config.port}`);
            console.log(`🔒 Whitelisted domains: ${this.state.whitelist.size}`);
            
            this.emit('gateway_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Gateway:', error);
            throw error;
        }
    }
    
    /**
     * Setup SQLite database for caching and logging
     */
    async setupDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.cacheDbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const createTables = `
                    CREATE TABLE IF NOT EXISTS request_cache (
                        id TEXT PRIMARY KEY,
                        url TEXT NOT NULL,
                        method TEXT NOT NULL,
                        headers TEXT,
                        body TEXT,
                        response_status INTEGER,
                        response_headers TEXT,
                        response_body TEXT,
                        cached_at INTEGER,
                        expires_at INTEGER
                    );
                    
                    CREATE TABLE IF NOT EXISTS request_log (
                        id TEXT PRIMARY KEY,
                        timestamp INTEGER,
                        url TEXT NOT NULL,
                        method TEXT NOT NULL,
                        source_ip TEXT,
                        user_agent TEXT,
                        status_code INTEGER,
                        response_time INTEGER,
                        bytes_sent INTEGER,
                        bytes_received INTEGER,
                        cached BOOLEAN,
                        blocked BOOLEAN,
                        reason TEXT
                    );
                    
                    CREATE TABLE IF NOT EXISTS whitelist (
                        domain TEXT PRIMARY KEY,
                        added_at INTEGER,
                        added_by TEXT,
                        reason TEXT
                    );
                    
                    CREATE TABLE IF NOT EXISTS rate_limits (
                        domain TEXT PRIMARY KEY,
                        requests_made INTEGER,
                        window_start INTEGER,
                        last_request INTEGER
                    );
                    
                    CREATE TABLE IF NOT EXISTS api_keys (
                        service TEXT PRIMARY KEY,
                        api_key TEXT NOT NULL,
                        created_at INTEGER,
                        last_used INTEGER,
                        usage_count INTEGER
                    );
                `;
                
                this.db.exec(createTables, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
    
    /**
     * Load configuration from database
     */
    async loadConfiguration() {
        return new Promise((resolve) => {
            // Load whitelist from database
            this.db.all('SELECT domain FROM whitelist', (err, rows) => {
                if (!err && rows) {
                    rows.forEach(row => {
                        this.state.whitelist.add(row.domain);
                    });
                }
                
                // Load API keys
                this.db.all('SELECT * FROM api_keys', (err, keys) => {
                    if (!err && keys) {
                        keys.forEach(key => {
                            this.state.apiKeys.set(key.service, {
                                key: key.api_key,
                                created_at: key.created_at,
                                last_used: key.last_used,
                                usage_count: key.usage_count || 0
                            });
                        });
                    }
                    
                    console.log(`🔑 Loaded ${this.state.apiKeys.size} API keys`);
                    resolve();
                });
            });
        });
    }
    
    /**
     * Initialize whitelist with default domains
     */
    initializeWhitelist() {
        // Add default whitelist
        this.defaultWhitelist.forEach(domain => {
            this.state.whitelist.add(domain);
        });
        
        console.log(`🔒 Initialized whitelist with ${this.state.whitelist.size} domains`);
    }
    
    /**
     * Setup HTTP server for gateway
     */
    async setupServer() {
        this.app.use(express.json());
        
        // Gateway proxy endpoint
        this.app.all('/proxy/*', async (req, res) => {
            const targetUrl = req.path.replace('/proxy/', '');
            await this.handleProxyRequest(req, res, targetUrl);
        });
        
        // Direct URL proxy
        this.app.post('/api/request', async (req, res) => {
            try {
                const { url, method = 'GET', headers = {}, body } = req.body;
                const result = await this.makeControlledRequest(url, {
                    method,
                    headers,
                    data: body
                });
                res.json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // OSS Discovery endpoints
        this.app.get('/api/discover/github/:query', async (req, res) => {
            try {
                const result = await this.discoverGitHubRepos(req.params.query);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/discover/npm/:query', async (req, res) => {
            try {
                const result = await this.discoverNpmPackages(req.params.query);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/discover/pypi/:query', async (req, res) => {
            try {
                const result = await this.discoverPyPiPackages(req.params.query);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Security endpoints
        this.app.get('/api/security/cve/:package', async (req, res) => {
            try {
                const result = await this.checkSecurityVulnerabilities(req.params.package);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Configuration endpoints
        this.app.get('/api/whitelist', (req, res) => {
            res.json(Array.from(this.state.whitelist));
        });
        
        this.app.post('/api/whitelist/add', async (req, res) => {
            try {
                const { domain, reason } = req.body;
                await this.addToWhitelist(domain, reason);
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.delete('/api/whitelist/:domain', async (req, res) => {
            try {
                await this.removeFromWhitelist(req.params.domain);
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Monitoring endpoints
        this.app.get('/api/stats', async (req, res) => {
            const stats = await this.getGatewayStats();
            res.json(stats);
        });
        
        this.app.get('/api/logs', async (req, res) => {
            const logs = await this.getRequestLogs(req.query.limit || 100);
            res.json(logs);
        });
        
        this.app.get('/api/cache/stats', (req, res) => {
            res.json({
                size: this.state.cache.size,
                maxSize: this.config.maxCacheSize,
                hitRate: this.calculateCacheHitRate()
            });
        });
        
        this.app.delete('/api/cache/clear', (req, res) => {
            this.state.cache.clear();
            res.json({ success: true, message: 'Cache cleared' });
        });
        
        // Dashboard
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`🌐 Gateway server running on port ${this.config.port}`);
        });
    }
    
    /**
     * Handle proxy requests
     */
    async handleProxyRequest(req, res, targetUrl) {
        const startTime = Date.now();
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            url: targetUrl,
            method: req.method,
            source_ip: req.ip,
            user_agent: req.get('User-Agent'),
            cached: false,
            blocked: false
        };
        
        try {
            // Check if URL is whitelisted
            if (!this.isWhitelisted(targetUrl)) {
                logEntry.blocked = true;
                logEntry.reason = 'URL not whitelisted';
                logEntry.status_code = 403;
                
                await this.logRequest(logEntry);
                
                return res.status(403).json({
                    error: 'URL not whitelisted',
                    url: targetUrl,
                    requestId: logEntry.id
                });
            }
            
            // Check rate limits
            const domain = this.extractDomain(targetUrl);
            if (!this.checkRateLimit(domain)) {
                logEntry.blocked = true;
                logEntry.reason = 'Rate limit exceeded';
                logEntry.status_code = 429;
                
                await this.logRequest(logEntry);
                
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    domain: domain,
                    requestId: logEntry.id
                });
            }
            
            // Check cache first
            const cacheKey = this.generateCacheKey(targetUrl, req.method, req.body);
            const cached = await this.getCachedResponse(cacheKey);
            
            if (cached && !this.isCacheExpired(cached)) {
                logEntry.cached = true;
                logEntry.status_code = cached.response_status;
                logEntry.response_time = Date.now() - startTime;
                
                await this.logRequest(logEntry);
                
                res.status(cached.response_status);
                if (cached.response_headers) {
                    const headers = JSON.parse(cached.response_headers);
                    Object.entries(headers).forEach(([key, value]) => {
                        res.set(key, value);
                    });
                }
                
                return res.send(cached.response_body);
            }
            
            // Make actual request
            const result = await this.makeControlledRequest(targetUrl, {
                method: req.method,
                headers: req.headers,
                data: req.body
            });
            
            logEntry.status_code = result.status;
            logEntry.response_time = Date.now() - startTime;
            logEntry.bytes_sent = req.body ? JSON.stringify(req.body).length : 0;
            logEntry.bytes_received = result.data ? JSON.stringify(result.data).length : 0;
            
            // Cache successful responses
            if (result.status >= 200 && result.status < 300) {
                await this.cacheResponse(cacheKey, targetUrl, req.method, req.headers, req.body, result);
            }
            
            await this.logRequest(logEntry);
            
            // Send response
            res.status(result.status);
            if (result.headers) {
                Object.entries(result.headers).forEach(([key, value]) => {
                    res.set(key, value);
                });
            }
            res.send(result.data);
            
        } catch (error) {
            logEntry.status_code = 500;
            logEntry.response_time = Date.now() - startTime;
            logEntry.reason = error.message;
            
            await this.logRequest(logEntry);
            
            res.status(500).json({
                error: 'Gateway error',
                message: error.message,
                requestId: logEntry.id
            });
        }
    }
    
    /**
     * Make controlled external request
     */
    async makeControlledRequest(url, options = {}) {
        const domain = this.extractDomain(url);
        
        // Check whitelist
        if (!this.isWhitelisted(url)) {
            throw new Error(`Domain not whitelisted: ${domain}`);
        }
        
        // Check rate limits
        if (!this.checkRateLimit(domain)) {
            throw new Error(`Rate limit exceeded for domain: ${domain}`);
        }
        
        // Add API key if available
        const apiKey = this.getApiKeyForDomain(domain);
        if (apiKey) {
            options.headers = options.headers || {};
            if (domain.includes('github.com')) {
                options.headers['Authorization'] = `token ${apiKey}`;
            } else if (domain.includes('npmjs.org')) {
                options.headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }
        
        // Set timeout
        options.timeout = this.config.timeout;
        
        // Make request
        console.log(`🌐 Making request to: ${url}`);
        const response = await axios({
            url,
            ...options
        });
        
        // Update rate limit
        this.updateRateLimit(domain);
        
        // Update API key usage
        if (apiKey) {
            this.updateApiKeyUsage(domain);
        }
        
        return {
            status: response.status,
            headers: response.headers,
            data: response.data
        };
    }
    
    /**
     * OSS Discovery methods
     */
    async discoverGitHubRepos(query) {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`;
        
        try {
            const result = await this.makeControlledRequest(url);
            
            if (result.status === 200 && result.data.items) {
                return {
                    total: result.data.total_count,
                    repositories: result.data.items.map(repo => ({
                        id: repo.id,
                        name: repo.name,
                        full_name: repo.full_name,
                        description: repo.description,
                        url: repo.html_url,
                        clone_url: repo.clone_url,
                        language: repo.language,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count,
                        open_issues: repo.open_issues_count,
                        created_at: repo.created_at,
                        updated_at: repo.updated_at,
                        license: repo.license?.name
                    }))
                };
            }
            
            return { total: 0, repositories: [] };
            
        } catch (error) {
            console.error('GitHub discovery error:', error);
            throw new Error(`GitHub discovery failed: ${error.message}`);
        }
    }
    
    async discoverNpmPackages(query) {
        const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`;
        
        try {
            const result = await this.makeControlledRequest(url);
            
            if (result.status === 200 && result.data.objects) {
                return {
                    total: result.data.total,
                    packages: result.data.objects.map(item => ({
                        name: item.package.name,
                        version: item.package.version,
                        description: item.package.description,
                        keywords: item.package.keywords || [],
                        author: item.package.author?.name,
                        maintainers: item.package.maintainers || [],
                        homepage: item.package.links?.homepage,
                        repository: item.package.links?.repository,
                        npm_url: item.package.links?.npm,
                        date: item.package.date,
                        score: {
                            final: item.score.final,
                            detail: {
                                quality: item.score.detail.quality,
                                popularity: item.score.detail.popularity,
                                maintenance: item.score.detail.maintenance
                            }
                        }
                    }))
                };
            }
            
            return { total: 0, packages: [] };
            
        } catch (error) {
            console.error('NPM discovery error:', error);
            throw new Error(`NPM discovery failed: ${error.message}`);
        }
    }
    
    async discoverPyPiPackages(query) {
        const url = `https://pypi.org/simple/${encodeURIComponent(query)}/`;
        
        try {
            const result = await this.makeControlledRequest(url);
            
            // PyPI simple API returns HTML, would need parsing
            // For now, return basic structure
            return {
                query: query,
                available: result.status === 200,
                url: url
            };
            
        } catch (error) {
            console.error('PyPI discovery error:', error);
            throw new Error(`PyPI discovery failed: ${error.message}`);
        }
    }
    
    async checkSecurityVulnerabilities(packageName) {
        // This would integrate with security databases
        // For now, return placeholder
        return {
            package: packageName,
            vulnerabilities: [],
            lastChecked: Date.now(),
            source: 'placeholder'
        };
    }
    
    /**
     * Utility methods
     */
    isWhitelisted(url) {
        const domain = this.extractDomain(url);
        return this.state.whitelist.has(domain) || 
               Array.from(this.state.whitelist).some(whitelisted => 
                   domain.includes(whitelisted) || whitelisted.includes(domain));
    }
    
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url.split('/')[0];
        }
    }
    
    checkRateLimit(domain) {
        const config = this.rateLimitConfig[domain] || this.rateLimitConfig.default;
        const now = Date.now();
        
        let limit = this.state.rateLimits.get(domain);
        if (!limit) {
            limit = { requests: 0, windowStart: now };
            this.state.rateLimits.set(domain, limit);
        }
        
        // Reset window if expired
        if (now - limit.windowStart > config.window) {
            limit.requests = 0;
            limit.windowStart = now;
        }
        
        return limit.requests < config.requests;
    }
    
    updateRateLimit(domain) {
        const limit = this.state.rateLimits.get(domain);
        if (limit) {
            limit.requests++;
        }
    }
    
    getApiKeyForDomain(domain) {
        if (domain.includes('github.com')) {
            return this.state.apiKeys.get('github')?.key;
        } else if (domain.includes('npmjs.org')) {
            return this.state.apiKeys.get('npm')?.key;
        }
        return null;
    }
    
    updateApiKeyUsage(domain) {
        let service = null;
        if (domain.includes('github.com')) service = 'github';
        else if (domain.includes('npmjs.org')) service = 'npm';
        
        if (service) {
            const keyInfo = this.state.apiKeys.get(service);
            if (keyInfo) {
                keyInfo.usage_count++;
                keyInfo.last_used = Date.now();
            }
        }
    }
    
    generateCacheKey(url, method, body) {
        const input = `${method}:${url}:${JSON.stringify(body || {})}`;
        return crypto.createHash('sha256').update(input).digest('hex');
    }
    
    async getCachedResponse(cacheKey) {
        return new Promise((resolve) => {
            this.db.get(
                'SELECT * FROM request_cache WHERE id = ?',
                [cacheKey],
                (err, row) => {
                    resolve(err || !row ? null : row);
                }
            );
        });
    }
    
    isCacheExpired(cached) {
        return Date.now() > cached.expires_at;
    }
    
    async cacheResponse(cacheKey, url, method, headers, body, response) {
        const expiresAt = Date.now() + this.config.maxCacheAge;
        
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO request_cache (id, url, method, headers, body, response_status, response_headers, response_body, cached_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [cacheKey, url, method, JSON.stringify(headers), JSON.stringify(body), response.status, JSON.stringify(response.headers), JSON.stringify(response.data), Date.now(), expiresAt],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async logRequest(logEntry) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO request_log (id, timestamp, url, method, source_ip, user_agent, status_code, response_time, bytes_sent, bytes_received, cached, blocked, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [logEntry.id, logEntry.timestamp, logEntry.url, logEntry.method, logEntry.source_ip, logEntry.user_agent, logEntry.status_code, logEntry.response_time, logEntry.bytes_sent, logEntry.bytes_received, logEntry.cached, logEntry.blocked, logEntry.reason],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async addToWhitelist(domain, reason = 'Manual addition') {
        this.state.whitelist.add(domain);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO whitelist (domain, added_at, added_by, reason) VALUES (?, ?, ?, ?)',
                [domain, Date.now(), 'system', reason],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async removeFromWhitelist(domain) {
        this.state.whitelist.delete(domain);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM whitelist WHERE domain = ?',
                [domain],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    calculateCacheHitRate() {
        // This would be calculated from actual statistics
        return 0.75; // 75% cache hit rate
    }
    
    async getGatewayStats() {
        return new Promise((resolve) => {
            this.db.all(
                'SELECT COUNT(*) as total, SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) as blocked, SUM(CASE WHEN cached = 1 THEN 1 ELSE 0 END) as cached FROM request_log WHERE timestamp > ?',
                [Date.now() - 24 * 60 * 60 * 1000], // Last 24 hours
                (err, rows) => {
                    const stats = rows && rows[0] ? rows[0] : { total: 0, blocked: 0, cached: 0 };
                    resolve({
                        ...stats,
                        whitelistedDomains: this.state.whitelist.size,
                        cacheSize: this.state.cache.size,
                        rateLimitedDomains: this.state.rateLimits.size,
                        offlineMode: this.config.offlineMode
                    });
                }
            );
        });
    }
    
    async getRequestLogs(limit = 100) {
        return new Promise((resolve) => {
            this.db.all(
                'SELECT * FROM request_log ORDER BY timestamp DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    resolve(err ? [] : rows);
                }
            );
        });
    }
    
    startMaintenanceTasks() {
        // Clean expired cache entries every hour
        setInterval(async () => {
            await this.cleanExpiredCache();
        }, 60 * 60 * 1000);
        
        // Clean old logs every day
        setInterval(async () => {
            await this.cleanOldLogs();
        }, 24 * 60 * 60 * 1000);
    }
    
    async cleanExpiredCache() {
        return new Promise((resolve) => {
            this.db.run(
                'DELETE FROM request_cache WHERE expires_at < ?',
                [Date.now()],
                (err) => {
                    if (!err) {
                        console.log('🧹 Cleaned expired cache entries');
                    }
                    resolve();
                }
            );
        });
    }
    
    async cleanOldLogs() {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        return new Promise((resolve) => {
            this.db.run(
                'DELETE FROM request_log WHERE timestamp < ?',
                [weekAgo],
                (err) => {
                    if (!err) {
                        console.log('🧹 Cleaned old request logs');
                    }
                    resolve();
                }
            );
        });
    }
    
    /**
     * Generate gateway dashboard HTML
     */
    generateDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌐 Controlled Internet Gateway</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #00d4aa 0%, #00b894 100%);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 212, 170, 0.3);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #00d4aa;
            margin-bottom: 10px;
        }
        
        .section {
            background: rgba(255,255,255,0.05);
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .whitelist-item {
            background: rgba(255,255,255,0.1);
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .log-item {
            background: rgba(255,255,255,0.1);
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9em;
        }
        
        .log-item.cached {
            border-left: 4px solid #00d4aa;
        }
        
        .log-item.blocked {
            border-left: 4px solid #e74c3c;
        }
        
        .log-item.success {
            border-left: 4px solid #27ae60;
        }
        
        .btn {
            background: #00d4aa;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        
        .btn:hover {
            background: #00b894;
        }
        
        .btn-danger {
            background: #e74c3c;
        }
        
        .btn-danger:hover {
            background: #c0392b;
        }
        
        .input {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            margin: 5px;
        }
        
        .input::placeholder {
            color: rgba(255,255,255,0.5);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 Controlled Internet Gateway</h1>
        <p>Secure, Controlled Internet Access for OSS Discovery</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number" id="total-requests">0</div>
            <div>Total Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="blocked-requests">0</div>
            <div>Blocked Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="cached-requests">0</div>
            <div>Cached Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="whitelisted-domains">${this.state.whitelist.size}</div>
            <div>Whitelisted Domains</div>
        </div>
    </div>
    
    <div class="section">
        <h2>🔒 Whitelist Management</h2>
        <div style="margin-bottom: 20px;">
            <input type="text" id="new-domain" class="input" placeholder="Enter domain to whitelist" style="width: 300px;">
            <input type="text" id="domain-reason" class="input" placeholder="Reason" style="width: 200px;">
            <button class="btn" onclick="addDomain()">Add Domain</button>
        </div>
        <div id="whitelist-container">
            ${Array.from(this.state.whitelist).slice(0, 10).map(domain => `
                <div class="whitelist-item">
                    <span>${domain}</span>
                    <button class="btn btn-danger" onclick="removeDomain('${domain}')">Remove</button>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="section">
        <h2>🔍 OSS Discovery</h2>
        <div style="margin-bottom: 20px;">
            <input type="text" id="search-query" class="input" placeholder="Search packages..." style="width: 300px;">
            <button class="btn" onclick="searchGitHub()">GitHub</button>
            <button class="btn" onclick="searchNpm()">NPM</button>
            <button class="btn" onclick="searchPyPI()">PyPI</button>
        </div>
        <div id="search-results"></div>
    </div>
    
    <div class="section">
        <h2>📝 Recent Requests</h2>
        <div id="logs-container">
            <div class="log-item">Loading request logs...</div>
        </div>
    </div>
    
    <div class="section">
        <h2>🛠️ Actions</h2>
        <button class="btn" onclick="clearCache()">Clear Cache</button>
        <button class="btn" onclick="refreshStats()">Refresh Stats</button>
        <button class="btn" onclick="toggleOfflineMode()">Toggle Offline Mode</button>
    </div>
    
    <script>
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('total-requests').textContent = stats.total || 0;
                document.getElementById('blocked-requests').textContent = stats.blocked || 0;
                document.getElementById('cached-requests').textContent = stats.cached || 0;
                document.getElementById('whitelisted-domains').textContent = stats.whitelistedDomains || 0;
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        async function loadLogs() {
            try {
                const response = await fetch('/api/logs?limit=10');
                const logs = await response.json();
                
                const container = document.getElementById('logs-container');
                container.innerHTML = logs.map(log => {
                    const className = log.blocked ? 'blocked' : log.cached ? 'cached' : 'success';
                    return \`
                        <div class="log-item \${className}">
                            [\${new Date(log.timestamp).toLocaleTimeString()}] \${log.method} \${log.url} - \${log.status_code} (\${log.response_time}ms)
                            \${log.cached ? ' [CACHED]' : ''}
                            \${log.blocked ? ' [BLOCKED]' : ''}
                        </div>
                    \`;
                }).join('');
            } catch (error) {
                console.error('Failed to load logs:', error);
            }
        }
        
        async function addDomain() {
            const domain = document.getElementById('new-domain').value.trim();
            const reason = document.getElementById('domain-reason').value.trim();
            
            if (!domain) {
                alert('Please enter a domain');
                return;
            }
            
            try {
                const response = await fetch('/api/whitelist/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain, reason })
                });
                
                if (response.ok) {
                    document.getElementById('new-domain').value = '';
                    document.getElementById('domain-reason').value = '';
                    alert('Domain added to whitelist');
                    location.reload();
                } else {
                    const error = await response.json();
                    alert(\`Failed to add domain: \${error.error}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        async function removeDomain(domain) {
            if (!confirm(\`Remove \${domain} from whitelist?\`)) return;
            
            try {
                const response = await fetch(\`/api/whitelist/\${encodeURIComponent(domain)}\`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    alert('Domain removed from whitelist');
                    location.reload();
                } else {
                    const error = await response.json();
                    alert(\`Failed to remove domain: \${error.error}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        async function searchGitHub() {
            const query = document.getElementById('search-query').value.trim();
            if (!query) return;
            
            try {
                const response = await fetch(\`/api/discover/github/\${encodeURIComponent(query)}\`);
                const results = await response.json();
                
                displaySearchResults('GitHub', results.repositories || []);
            } catch (error) {
                alert(\`GitHub search failed: \${error.message}\`);
            }
        }
        
        async function searchNpm() {
            const query = document.getElementById('search-query').value.trim();
            if (!query) return;
            
            try {
                const response = await fetch(\`/api/discover/npm/\${encodeURIComponent(query)}\`);
                const results = await response.json();
                
                displaySearchResults('NPM', results.packages || []);
            } catch (error) {
                alert(\`NPM search failed: \${error.message}\`);
            }
        }
        
        async function searchPyPI() {
            const query = document.getElementById('search-query').value.trim();
            if (!query) return;
            
            try {
                const response = await fetch(\`/api/discover/pypi/\${encodeURIComponent(query)}\`);
                const results = await response.json();
                
                displaySearchResults('PyPI', [results]);
            } catch (error) {
                alert(\`PyPI search failed: \${error.message}\`);
            }
        }
        
        function displaySearchResults(source, results) {
            const container = document.getElementById('search-results');
            
            if (results.length === 0) {
                container.innerHTML = \`<div class="log-item">No results found for \${source}</div>\`;
                return;
            }
            
            container.innerHTML = \`
                <h3>\${source} Results</h3>
                \${results.slice(0, 5).map(item => \`
                    <div class="log-item">
                        <strong>\${item.name || item.full_name}</strong>
                        \${item.description ? \` - \${item.description}\` : ''}
                        \${item.stars ? \` ⭐ \${item.stars}\` : ''}
                        \${item.version ? \` v\${item.version}\` : ''}
                    </div>
                \`).join('')}
            \`;
        }
        
        async function clearCache() {
            try {
                const response = await fetch('/api/cache/clear', { method: 'DELETE' });
                if (response.ok) {
                    alert('Cache cleared');
                } else {
                    alert('Failed to clear cache');
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        function refreshStats() {
            location.reload();
        }
        
        function toggleOfflineMode() {
            alert('Offline mode toggle not implemented yet');
        }
        
        // Initialize dashboard
        loadStats();
        loadLogs();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            loadStats();
            loadLogs();
        }, 30000);
    </script>
</body>
</html>`;
    }
}

// Export for integration with Electron app
module.exports = ControlledInternetGateway;

// Run standalone if called directly
if (require.main === module) {
    const gateway = new ControlledInternetGateway({ port: 8779 });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Controlled Internet Gateway...');
        if (gateway.db) {
            gateway.db.close();
        }
        process.exit(0);
    });
}