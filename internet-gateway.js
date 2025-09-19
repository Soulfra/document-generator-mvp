#!/usr/bin/env node

/**
 * INTERNET GATEWAY SERVICE
 * Proxy for external API calls with rate limiting, caching, and API key management
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const NetworkService = require('./network-service');
const crypto = require('crypto');

class InternetGateway {
    constructor(options = {}) {
        this.config = {
            port: options.port || 6666,
            cacheTimeout: options.cacheTimeout || 300, // 5 minutes
            maxCacheSize: options.maxCacheSize || 1000,
            rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute
            rateLimitMax: options.rateLimitMax || 100,
            ...options
        };
        
        // Initialize components
        this.networkService = new NetworkService();
        this.cache = new NodeCache({
            stdTTL: this.config.cacheTimeout,
            maxKeys: this.config.maxCacheSize,
            useClones: false
        });
        
        // API key storage (in production, use secure storage)
        this.apiKeys = new Map();
        this.loadApiKeys();
        
        // Request statistics
        this.stats = {
            requests: 0,
            cached: 0,
            external: 0,
            errors: 0,
            rateLimited: 0
        };
        
        // Express app
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🌐 Internet Gateway initialized');
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security
        this.app.use(helmet());
        this.app.use(cors());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: this.config.rateLimitWindow,
            max: this.config.rateLimitMax,
            message: {
                error: 'Too many requests',
                retryAfter: Math.ceil(this.config.rateLimitWindow / 1000)
            },
            onLimitReached: () => {
                this.stats.rateLimited++;
            }
        });
        this.app.use('/proxy', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            this.stats.requests++;
            console.log(`🌐 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'internet-gateway',
                uptime: process.uptime(),
                stats: this.stats,
                cache: {
                    keys: this.cache.keys().length,
                    stats: this.cache.getStats()
                }
            });
        });
        
        // API key management
        this.app.post('/api-keys/:service', (req, res) => {
            const { service } = req.params;
            const { apiKey, config = {} } = req.body;
            
            if (!apiKey) {
                return res.status(400).json({ error: 'API key required' });
            }
            
            this.setApiKey(service, apiKey, config);
            res.json({ success: true, message: `API key set for ${service}` });
        });
        
        this.app.get('/api-keys', (req, res) => {
            const keys = Array.from(this.apiKeys.keys());
            res.json({ services: keys });
        });
        
        // Generic proxy endpoint
        this.app.all('/proxy/*', async (req, res) => {
            try {
                const result = await this.proxyRequest(req);
                res.status(result.status || 200).json(result.data);
            } catch (error) {
                this.stats.errors++;
                res.status(500).json({
                    error: error.message,
                    service: 'internet-gateway'
                });
            }
        });
        
        // Service-specific endpoints
        
        // OpenAI
        this.app.post('/openai/*', async (req, res) => {
            const path = req.params[0];
            const result = await this.callOpenAI(path, req.body, req.method);
            res.status(result.status || 200).json(result.data);
        });
        
        // Anthropic
        this.app.post('/anthropic/*', async (req, res) => {
            const path = req.params[0];
            const result = await this.callAnthropic(path, req.body, req.method);
            res.status(result.status || 200).json(result.data);
        });
        
        // GitHub API
        this.app.all('/github/*', async (req, res) => {
            const path = req.params[0];
            const result = await this.callGitHub(path, req.body, req.method);
            res.status(result.status || 200).json(result.data);
        });
        
        // Google APIs
        this.app.all('/google/*', async (req, res) => {
            const path = req.params[0];
            const result = await this.callGoogle(path, req.body, req.method);
            res.status(result.status || 200).json(result.data);
        });
        
        // Statistics
        this.app.get('/stats', (req, res) => {
            res.json({
                ...this.stats,
                cache: this.cache.getStats(),
                uptime: process.uptime()
            });
        });
        
        // Cache management
        this.app.delete('/cache/:key?', (req, res) => {
            const { key } = req.params;
            
            if (key) {
                this.cache.del(key);
                res.json({ message: `Cache key ${key} deleted` });
            } else {
                this.cache.flushAll();
                res.json({ message: 'All cache cleared' });
            }
        });
    }

    /**
     * Generic proxy request handler
     */
    async proxyRequest(req) {
        const url = req.originalUrl.replace('/proxy/', '');
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        
        // Check cache
        const cacheKey = this.generateCacheKey(req.method, fullUrl, req.body);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            this.stats.cached++;
            console.log(`💾 Cache hit: ${fullUrl}`);
            return cached;
        }
        
        // Make external request
        this.stats.external++;
        
        const options = {
            method: req.method,
            url: fullUrl,
            headers: { ...req.headers },
            data: req.body
        };
        
        // Remove hop-by-hop headers
        delete options.headers.host;
        delete options.headers['content-length'];
        delete options.headers.connection;
        
        const result = await this.networkService.request(options);
        
        // Cache successful responses for GET requests
        if (req.method === 'GET' && result.success) {
            this.cache.set(cacheKey, result, this.config.cacheTimeout);
        }
        
        return result;
    }

    /**
     * OpenAI API calls
     */
    async callOpenAI(path, data, method = 'POST') {
        const apiKey = this.getApiKey('openai');
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        
        const url = `https://api.openai.com/v1/${path}`;
        
        return this.networkService.request({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            data
        });
    }

    /**
     * Anthropic API calls
     */
    async callAnthropic(path, data, method = 'POST') {
        const apiKey = this.getApiKey('anthropic');
        if (!apiKey) {
            throw new Error('Anthropic API key not configured');
        }
        
        const url = `https://api.anthropic.com/v1/${path}`;
        
        return this.networkService.request({
            method,
            url,
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            data
        });
    }

    /**
     * GitHub API calls
     */
    async callGitHub(path, data, method = 'GET') {
        const apiKey = this.getApiKey('github');
        const url = `https://api.github.com/${path}`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'DocumentGenerator/1.0.0'
        };
        
        if (apiKey) {
            headers['Authorization'] = `token ${apiKey}`;
        }
        
        return this.networkService.request({
            method,
            url,
            headers,
            data
        });
    }

    /**
     * Google APIs calls
     */
    async callGoogle(path, data, method = 'GET') {
        const apiKey = this.getApiKey('google');
        if (!apiKey) {
            throw new Error('Google API key not configured');
        }
        
        const url = `https://www.googleapis.com/${path}`;
        
        return this.networkService.request({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            data
        });
    }

    /**
     * Set API key for service
     */
    setApiKey(service, apiKey, config = {}) {
        this.apiKeys.set(service.toLowerCase(), {
            key: apiKey,
            config,
            setAt: new Date()
        });
        
        console.log(`🔑 API key set for ${service}`);
        this.saveApiKeys();
    }

    /**
     * Get API key for service
     */
    getApiKey(service) {
        const keyData = this.apiKeys.get(service.toLowerCase());
        return keyData?.key;
    }

    /**
     * Generate cache key
     */
    generateCacheKey(method, url, body) {
        const hash = crypto.createHash('md5')
            .update(`${method}:${url}:${JSON.stringify(body || {})}`)
            .digest('hex');
        return `req:${hash}`;
    }

    /**
     * Load API keys from environment or file
     */
    loadApiKeys() {
        // Load from environment variables
        const envKeys = {
            openai: process.env.OPENAI_API_KEY,
            anthropic: process.env.ANTHROPIC_API_KEY,
            github: process.env.GITHUB_TOKEN,
            google: process.env.GOOGLE_API_KEY
        };
        
        for (const [service, key] of Object.entries(envKeys)) {
            if (key) {
                this.setApiKey(service, key);
            }
        }
        
        console.log(`🔑 Loaded ${this.apiKeys.size} API keys from environment`);
    }

    /**
     * Save API keys (in production, use encrypted storage)
     */
    saveApiKeys() {
        // In a real implementation, this would save to encrypted storage
        // For now, just log that keys are configured
        console.log(`🔑 ${this.apiKeys.size} API keys configured`);
    }

    /**
     * Start the gateway
     */
    start() {
        this.app.listen(this.config.port, () => {
            console.log(`🌐 Internet Gateway running on port ${this.config.port}`);
            
            // Log configured services
            if (this.apiKeys.size > 0) {
                console.log('🔑 Configured API keys for:', Array.from(this.apiKeys.keys()).join(', '));
            }
            
            // Periodic stats
            setInterval(() => {
                console.log('📊 Gateway Stats:', this.stats);
            }, 300000); // Every 5 minutes
        });
    }
}

// Export for use as module
module.exports = InternetGateway;

// Run as standalone service if called directly
if (require.main === module) {
    const gateway = new InternetGateway({
        port: process.env.GATEWAY_PORT || 6666
    });
    
    gateway.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Internet Gateway...');
        process.exit(0);
    });
}