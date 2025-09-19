#!/usr/bin/env node

/**
 * 🌐 UNIVERSAL API CLIENT FRAMEWORK
 * Octokit-style unified client for chaining GitHub, Discord, Stripe, AWS, etc.
 * Single authentication system for your entire 300-domain empire
 */

const axios = require('axios');
const EventEmitter = require('events');
const crypto = require('crypto');

class UniversalAPIClient extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.version = '1.0.0';
        this.userAgent = config.userAgent || `EmpireAPIClient/${this.version}`;
        
        // Empire services configuration
        this.empireServices = {
            auth: config.authService || 'http://localhost:7775',
            gateway: config.gateway || 'http://localhost:8000',
            cache: config.cacheService || 'http://localhost:7776'
        };
        
        // API client registry - Octokit-style modular approach
        this.clients = {
            github: null,
            discord: null,
            stripe: null,
            aws: null,
            google: null,
            twitter: null,
            slack: null,
            spotify: null,
            youtube: null,
            twitch: null
        };
        
        // Authentication tokens storage
        this.tokens = {
            empire: null,      // Your empire auth
            github: null,      // GitHub personal access token
            discord: null,     // Discord bot token
            stripe: null,      // Stripe secret key
            aws: null,         // AWS credentials
            google: null,      // Google OAuth token
            twitter: null,     // Twitter API v2 bearer token
            slack: null,       // Slack bot token
            spotify: null,     // Spotify access token
            youtube: null,     // YouTube API key
            twitch: null       // Twitch client credentials
        };
        
        // Rate limiting and retry configuration
        this.rateLimits = new Map();
        this.retryConfig = {
            retries: 3,
            backoff: 'exponential',
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 30000
        };
        
        // Request statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitHits: 0,
            byService: {},
            startTime: Date.now()
        };
        
        // Gaming elements for API interactions
        this.gameElements = {
            api_call: '📡',
            success: '✅',
            failure: '❌',
            rate_limit: '⏰',
            retry: '🔄',
            cache_hit: '🎯'
        };
        
        console.log('🌐 Universal API Client Framework initializing...');
        this.initializeClients();
    }
    
    // Initialize all API clients
    async initializeClients() {
        // Empire Authentication
        if (this.tokens.empire) {
            await this.initializeEmpireClient();
        }
        
        // GitHub Client (Octokit-style)
        if (this.tokens.github) {
            this.clients.github = this.createGitHubClient();
        }
        
        // Discord Client
        if (this.tokens.discord) {
            this.clients.discord = this.createDiscordClient();
        }
        
        // Stripe Client
        if (this.tokens.stripe) {
            this.clients.stripe = this.createStripeClient();
        }
        
        // AWS Client
        if (this.tokens.aws) {
            this.clients.aws = this.createAWSClient();
        }
        
        // Add other clients as needed
        this.setupUniversalMethods();
        
        console.log('🚀 Universal API Client ready with', Object.keys(this.clients).filter(k => this.clients[k]).length, 'active clients');
    }
    
    // Empire Authentication Integration
    async authenticate(empireCredentials) {
        try {
            console.log('🔑 Authenticating with Empire...');
            
            const response = await axios.post(`${this.empireServices.auth}/auth/login`, {
                ...empireCredentials,
                source: 'universal-api-client'
            });
            
            if (response.data.success !== false) {
                this.tokens.empire = response.data.tokens.accessToken;
                this.emit('authenticated', response.data.user);
                
                console.log(`${this.gameElements.success} Empire authentication successful`);
                return {
                    success: true,
                    user: response.data.user,
                    tokens: response.data.tokens
                };
            }
            
        } catch (error) {
            console.error(`${this.gameElements.failure} Empire authentication failed:`, error.message);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }
    
    // Set API tokens for different services
    setToken(service, token, options = {}) {
        this.tokens[service] = token;
        
        // Reinitialize the specific client
        switch (service) {
            case 'github':
                this.clients.github = this.createGitHubClient();
                break;
            case 'discord':
                this.clients.discord = this.createDiscordClient();
                break;
            case 'stripe':
                this.clients.stripe = this.createStripeClient();
                break;
            case 'aws':
                this.clients.aws = this.createAWSClient();
                break;
            // Add other services
        }
        
        console.log(`${this.gameElements.success} ${service} client configured`);
    }
    
    // GitHub Client (Octokit-inspired)
    createGitHubClient() {
        const baseURL = 'https://api.github.com';
        
        return {
            // Repository operations
            repos: {
                get: (owner, repo) => this.apiCall('github', 'GET', `/repos/${owner}/${repo}`, null, baseURL),
                list: (username) => this.apiCall('github', 'GET', `/users/${username}/repos`, null, baseURL),
                create: (data) => this.apiCall('github', 'POST', '/user/repos', data, baseURL),
                update: (owner, repo, data) => this.apiCall('github', 'PATCH', `/repos/${owner}/${repo}`, data, baseURL),
                delete: (owner, repo) => this.apiCall('github', 'DELETE', `/repos/${owner}/${repo}`, null, baseURL),
                
                // Contents
                getContent: (owner, repo, path) => this.apiCall('github', 'GET', `/repos/${owner}/${repo}/contents/${path}`, null, baseURL),
                createFile: (owner, repo, path, data) => this.apiCall('github', 'PUT', `/repos/${owner}/${repo}/contents/${path}`, data, baseURL),
                
                // Issues
                listIssues: (owner, repo) => this.apiCall('github', 'GET', `/repos/${owner}/${repo}/issues`, null, baseURL),
                createIssue: (owner, repo, data) => this.apiCall('github', 'POST', `/repos/${owner}/${repo}/issues`, data, baseURL),
                
                // Pull requests
                listPulls: (owner, repo) => this.apiCall('github', 'GET', `/repos/${owner}/${repo}/pulls`, null, baseURL),
                createPull: (owner, repo, data) => this.apiCall('github', 'POST', `/repos/${owner}/${repo}/pulls`, data, baseURL)
            },
            
            // User operations
            users: {
                get: (username) => this.apiCall('github', 'GET', `/users/${username}`, null, baseURL),
                getAuthenticated: () => this.apiCall('github', 'GET', '/user', null, baseURL)
            },
            
            // Organization operations
            orgs: {
                get: (org) => this.apiCall('github', 'GET', `/orgs/${org}`, null, baseURL),
                listRepos: (org) => this.apiCall('github', 'GET', `/orgs/${org}/repos`, null, baseURL)
            },
            
            // Search
            search: {
                repos: (query) => this.apiCall('github', 'GET', `/search/repositories?q=${encodeURIComponent(query)}`, null, baseURL),
                users: (query) => this.apiCall('github', 'GET', `/search/users?q=${encodeURIComponent(query)}`, null, baseURL)
            }
        };
    }
    
    // Discord Client
    createDiscordClient() {
        const baseURL = 'https://discord.com/api/v10';
        
        return {
            // Guild operations
            guilds: {
                get: (guildId) => this.apiCall('discord', 'GET', `/guilds/${guildId}`, null, baseURL),
                list: () => this.apiCall('discord', 'GET', '/users/@me/guilds', null, baseURL),
                create: (data) => this.apiCall('discord', 'POST', '/guilds', data, baseURL)
            },
            
            // Channel operations
            channels: {
                get: (channelId) => this.apiCall('discord', 'GET', `/channels/${channelId}`, null, baseURL),
                create: (guildId, data) => this.apiCall('discord', 'POST', `/guilds/${guildId}/channels`, data, baseURL),
                sendMessage: (channelId, data) => this.apiCall('discord', 'POST', `/channels/${channelId}/messages`, data, baseURL),
                getMessages: (channelId) => this.apiCall('discord', 'GET', `/channels/${channelId}/messages`, null, baseURL)
            },
            
            // User operations
            users: {
                me: () => this.apiCall('discord', 'GET', '/users/@me', null, baseURL),
                get: (userId) => this.apiCall('discord', 'GET', `/users/${userId}`, null, baseURL)
            }
        };
    }
    
    // Stripe Client
    createStripeClient() {
        const baseURL = 'https://api.stripe.com/v1';
        
        return {
            // Customer operations
            customers: {
                create: (data) => this.apiCall('stripe', 'POST', '/customers', data, baseURL),
                get: (customerId) => this.apiCall('stripe', 'GET', `/customers/${customerId}`, null, baseURL),
                update: (customerId, data) => this.apiCall('stripe', 'POST', `/customers/${customerId}`, data, baseURL),
                list: () => this.apiCall('stripe', 'GET', '/customers', null, baseURL)
            },
            
            // Payment operations
            paymentIntents: {
                create: (data) => this.apiCall('stripe', 'POST', '/payment_intents', data, baseURL),
                get: (paymentIntentId) => this.apiCall('stripe', 'GET', `/payment_intents/${paymentIntentId}`, null, baseURL),
                confirm: (paymentIntentId, data) => this.apiCall('stripe', 'POST', `/payment_intents/${paymentIntentId}/confirm`, data, baseURL)
            },
            
            // Subscription operations
            subscriptions: {
                create: (data) => this.apiCall('stripe', 'POST', '/subscriptions', data, baseURL),
                get: (subscriptionId) => this.apiCall('stripe', 'GET', `/subscriptions/${subscriptionId}`, null, baseURL),
                update: (subscriptionId, data) => this.apiCall('stripe', 'POST', `/subscriptions/${subscriptionId}`, data, baseURL),
                cancel: (subscriptionId) => this.apiCall('stripe', 'DELETE', `/subscriptions/${subscriptionId}`, null, baseURL)
            },
            
            // Product operations
            products: {
                create: (data) => this.apiCall('stripe', 'POST', '/products', data, baseURL),
                list: () => this.apiCall('stripe', 'GET', '/products', null, baseURL)
            }
        };
    }
    
    // AWS Client (simplified)
    createAWSClient() {
        return {
            // S3 operations
            s3: {
                listBuckets: () => this.apiCall('aws', 'GET', '/s3/buckets'),
                getBucket: (bucket) => this.apiCall('aws', 'GET', `/s3/buckets/${bucket}`),
                putObject: (bucket, key, data) => this.apiCall('aws', 'PUT', `/s3/buckets/${bucket}/objects/${key}`, data),
                getObject: (bucket, key) => this.apiCall('aws', 'GET', `/s3/buckets/${bucket}/objects/${key}`)
            },
            
            // Lambda operations
            lambda: {
                listFunctions: () => this.apiCall('aws', 'GET', '/lambda/functions'),
                invoke: (functionName, payload) => this.apiCall('aws', 'POST', `/lambda/functions/${functionName}/invoke`, payload)
            }
        };
    }
    
    // Universal API call method with retry, rate limiting, and caching
    async apiCall(service, method, path, data = null, baseURL = null) {
        const startTime = Date.now();
        const requestId = crypto.randomBytes(8).toString('hex');
        
        // Update statistics
        this.stats.totalRequests++;
        if (!this.stats.byService[service]) {
            this.stats.byService[service] = { requests: 0, successes: 0, failures: 0 };
        }
        this.stats.byService[service].requests++;
        
        console.log(`${this.gameElements.api_call} [${requestId}] ${service.toUpperCase()} ${method} ${path}`);
        
        try {
            // Check rate limits
            await this.checkRateLimit(service);
            
            // Check cache first
            const cacheKey = this.generateCacheKey(service, method, path, data);
            const cached = await this.getCachedResponse(cacheKey);
            if (cached) {
                console.log(`${this.gameElements.cache_hit} [${requestId}] Cache hit for ${service} request`);
                return cached;
            }
            
            // Prepare request
            const config = this.prepareRequest(service, method, path, data, baseURL);
            
            // Execute with retry logic
            const response = await this.executeWithRetry(config, service, requestId);
            
            // Update rate limit info
            this.updateRateLimit(service, response.headers);
            
            // Cache successful responses (if GET request)
            if (method === 'GET' && response.data) {
                await this.cacheResponse(cacheKey, response.data);
            }
            
            // Update statistics
            this.stats.successfulRequests++;
            this.stats.byService[service].successes++;
            
            const duration = Date.now() - startTime;
            console.log(`${this.gameElements.success} [${requestId}] ${service} request completed (${duration}ms)`);
            
            this.emit('requestComplete', {
                service,
                method,
                path,
                duration,
                success: true
            });
            
            return response.data;
            
        } catch (error) {
            // Update statistics
            this.stats.failedRequests++;
            this.stats.byService[service].failures++;
            
            const duration = Date.now() - startTime;
            console.error(`${this.gameElements.failure} [${requestId}] ${service} request failed (${duration}ms):`, error.message);
            
            this.emit('requestError', {
                service,
                method,
                path,
                duration,
                error: error.message
            });
            
            throw error;
        }
    }
    
    // Prepare request configuration
    prepareRequest(service, method, path, data, baseURL) {
        const config = {
            method,
            url: baseURL ? `${baseURL}${path}` : path,
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
        
        // Add authentication headers
        switch (service) {
            case 'github':
                config.headers.Authorization = `token ${this.tokens.github}`;
                break;
            case 'discord':
                config.headers.Authorization = `Bot ${this.tokens.discord}`;
                break;
            case 'stripe':
                config.headers.Authorization = `Bearer ${this.tokens.stripe}`;
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                if (data) {
                    config.data = new URLSearchParams(data).toString();
                }
                break;
            case 'empire':
                if (this.tokens.empire) {
                    config.headers.Authorization = `Bearer ${this.tokens.empire}`;
                }
                break;
        }
        
        // Add data for non-Stripe requests
        if (data && service !== 'stripe') {
            config.data = data;
        }
        
        return config;
    }
    
    // Execute request with retry logic
    async executeWithRetry(config, service, requestId) {
        let attempt = 1;
        const maxAttempts = this.retryConfig.retries + 1;
        
        while (attempt <= maxAttempts) {
            try {
                const response = await axios(config);
                return response;
                
            } catch (error) {
                if (error.response?.status === 429) {
                    // Rate limit hit
                    this.stats.rateLimitHits++;
                    const retryAfter = parseInt(error.response.headers['retry-after'] || '60') * 1000;
                    
                    console.warn(`${this.gameElements.rate_limit} [${requestId}] Rate limit hit for ${service}, waiting ${retryAfter}ms`);
                    
                    if (attempt < maxAttempts) {
                        await this.sleep(retryAfter);
                        attempt++;
                        continue;
                    }
                }
                
                if (attempt < maxAttempts && this.isRetryableError(error)) {
                    const delay = this.calculateBackoff(attempt);
                    console.warn(`${this.gameElements.retry} [${requestId}] Retry ${attempt}/${maxAttempts} for ${service} after ${delay}ms`);
                    
                    await this.sleep(delay);
                    attempt++;
                    continue;
                }
                
                throw error;
            }
        }
    }
    
    // Rate limiting
    async checkRateLimit(service) {
        const rateLimit = this.rateLimits.get(service);
        if (!rateLimit) return;
        
        const now = Date.now();
        if (now < rateLimit.resetTime) {
            const waitTime = rateLimit.resetTime - now;
            console.warn(`${this.gameElements.rate_limit} Rate limit for ${service}, waiting ${waitTime}ms`);
            await this.sleep(waitTime);
        }
    }
    
    updateRateLimit(service, headers) {
        const remaining = parseInt(headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining']);
        const reset = parseInt(headers['x-ratelimit-reset'] || headers['x-rate-limit-reset']);
        
        if (remaining !== undefined && reset !== undefined) {
            this.rateLimits.set(service, {
                remaining,
                resetTime: reset * 1000
            });
        }
    }
    
    // Caching
    generateCacheKey(service, method, path, data) {
        const hash = crypto.createHash('md5')
            .update(`${service}:${method}:${path}:${JSON.stringify(data || {})}`)
            .digest('hex');
        return `api_cache:${hash}`;
    }
    
    async getCachedResponse(key) {
        try {
            const response = await axios.get(`${this.empireServices.cache}/api/cache/${encodeURIComponent(key)}`);
            if (response.data.cached) {
                return JSON.parse(response.data.content);
            }
        } catch (error) {
            // Cache miss or error, continue with actual request
        }
        return null;
    }
    
    async cacheResponse(key, data, ttl = 300) {
        try {
            await axios.post(`${this.empireServices.cache}/api/cache`, {
                key,
                data: JSON.stringify(data),
                ttl
            });
        } catch (error) {
            console.warn('Failed to cache response:', error.message);
        }
    }
    
    // Utility methods
    isRetryableError(error) {
        const retryableCodes = [408, 500, 502, 503, 504];
        return retryableCodes.includes(error.response?.status);
    }
    
    calculateBackoff(attempt) {
        const { factor, minTimeout, maxTimeout } = this.retryConfig;
        const delay = Math.min(minTimeout * Math.pow(factor, attempt - 1), maxTimeout);
        return delay + Math.random() * 1000; // Add jitter
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Universal methods that work across all services
    setupUniversalMethods() {
        // Universal search across all services
        this.search = async (query, services = null) => {
            const searchServices = services || Object.keys(this.clients).filter(k => this.clients[k]);
            const results = {};
            
            const searchPromises = searchServices.map(async (service) => {
                try {
                    switch (service) {
                        case 'github':
                            if (this.clients.github) {
                                results[service] = await this.clients.github.search.repos(query);
                            }
                            break;
                        // Add other service searches
                    }
                } catch (error) {
                    results[service] = { error: error.message };
                }
            });
            
            await Promise.all(searchPromises);
            return results;
        };
        
        // Universal user profile
        this.getUserProfile = async (services = null) => {
            const profileServices = services || Object.keys(this.clients).filter(k => this.clients[k]);
            const profiles = {};
            
            const profilePromises = profileServices.map(async (service) => {
                try {
                    switch (service) {
                        case 'github':
                            if (this.clients.github) {
                                profiles[service] = await this.clients.github.users.getAuthenticated();
                            }
                            break;
                        case 'discord':
                            if (this.clients.discord) {
                                profiles[service] = await this.clients.discord.users.me();
                            }
                            break;
                        // Add other services
                    }
                } catch (error) {
                    profiles[service] = { error: error.message };
                }
            });
            
            await Promise.all(profilePromises);
            return profiles;
        };
        
        // Universal stats
        this.getStats = () => {
            return {
                ...this.stats,
                uptime: Date.now() - this.stats.startTime,
                activeClients: Object.keys(this.clients).filter(k => this.clients[k]).length,
                rateLimits: Object.fromEntries(this.rateLimits)
            };
        };
        
        // Content Generation Integration
        this.generateContent = async (options = {}) => {
            try {
                const response = await this.apiCall('empire', 'POST', '/api/content/generate', {
                    type: options.type || 'quick',
                    rarity: options.rarity || 'common',
                    category: options.category || 'general',
                    source: 'universal-api-client'
                }, 'http://localhost:7777');
                
                console.log(`${this.gameElements.api_call} Content generation requested`);
                return response;
                
            } catch (error) {
                console.error(`${this.gameElements.failure} Content generation failed:`, error.message);
                throw error;
            }
        };
        
        this.gachaContent = async (rarity = 'random') => {
            return this.generateContent({
                type: 'gacha',
                rarity,
                category: 'premium'
            });
        };
    }
    
    // Health check for all services
    async healthCheck() {
        const health = {};
        const services = Object.keys(this.clients).filter(k => this.clients[k]);
        
        const healthPromises = services.map(async (service) => {
            try {
                const startTime = Date.now();
                
                switch (service) {
                    case 'github':
                        await this.clients.github.users.getAuthenticated();
                        break;
                    case 'discord':
                        await this.clients.discord.users.me();
                        break;
                    // Add other service health checks
                }
                
                health[service] = {
                    status: 'healthy',
                    responseTime: Date.now() - startTime
                };
                
            } catch (error) {
                health[service] = {
                    status: 'unhealthy',
                    error: error.message
                };
            }
        });
        
        await Promise.all(healthPromises);
        return health;
    }
    
    // Chain multiple API calls (workflow automation)
    async chain(operations) {
        const results = [];
        
        for (const operation of operations) {
            try {
                const result = await this.executeOperation(operation, results);
                results.push({
                    operation: operation.name || 'unnamed',
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    operation: operation.name || 'unnamed',
                    success: false,
                    error: error.message
                });
                
                if (operation.required !== false) {
                    throw new Error(`Required operation '${operation.name}' failed: ${error.message}`);
                }
            }
        }
        
        return results;
    }
    
    async executeOperation(operation, previousResults) {
        const { service, method, params } = operation;
        const client = this.clients[service];
        
        if (!client) {
            throw new Error(`Service '${service}' is not configured`);
        }
        
        // Resolve parameters from previous results
        const resolvedParams = this.resolveParams(params, previousResults);
        
        // Execute the operation
        return await this.executeNestedMethod(client, method.split('.'), resolvedParams);
    }
    
    executeNestedMethod(obj, methodPath, params) {
        let current = obj;
        for (const prop of methodPath) {
            current = current[prop];
            if (!current) {
                throw new Error(`Method ${methodPath.join('.')} not found`);
            }
        }
        
        if (typeof current !== 'function') {
            throw new Error(`${methodPath.join('.')} is not a function`);
        }
        
        return Array.isArray(params) ? current(...params) : current(params);
    }
    
    resolveParams(params, previousResults) {
        if (typeof params === 'string' && params.startsWith('$')) {
            // Reference to previous result
            const [, index, path] = params.match(/\$(\d+)\.(.+)/) || [, params.slice(1), ''];
            const result = previousResults[parseInt(index)];
            return path ? this.getNestedValue(result.result, path) : result.result;
        }
        
        if (Array.isArray(params)) {
            return params.map(p => this.resolveParams(p, previousResults));
        }
        
        if (typeof params === 'object' && params !== null) {
            const resolved = {};
            for (const [key, value] of Object.entries(params)) {
                resolved[key] = this.resolveParams(value, previousResults);
            }
            return resolved;
        }
        
        return params;
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, prop) => current?.[prop], obj);
    }
}

// Export the universal client
module.exports = UniversalAPIClient;

// CLI usage example
if (require.main === module) {
    const client = new UniversalAPIClient();
    
    // Example: Chain GitHub and Discord operations
    const exampleChain = async () => {
        try {
            // Configure tokens (in production, use environment variables)
            client.setToken('github', process.env.GITHUB_TOKEN);
            client.setToken('discord', process.env.DISCORD_TOKEN);
            
            // Chain operations
            const results = await client.chain([
                {
                    name: 'get-user-repos',
                    service: 'github',
                    method: 'repos.list',
                    params: ['username']
                },
                {
                    name: 'send-discord-notification',
                    service: 'discord',
                    method: 'channels.sendMessage',
                    params: ['channelId', {
                        content: `Found $0.length repositories for user!`
                    }]
                }
            ]);
            
            console.log('Chain results:', results);
            
        } catch (error) {
            console.error('Chain failed:', error);
        }
    };
    
    // Run example
    exampleChain();
    
    console.log(`
🌐 UNIVERSAL API CLIENT FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Octokit-style unified client for all APIs
🔗 Chain GitHub, Discord, Stripe, AWS & more
🎮 Gaming-enhanced with achievements & stats
🏰 Integrated with your 300-domain empire

Example usage:
  const client = new UniversalAPIClient();
  client.setToken('github', 'your_token');
  const repos = await client.clients.github.repos.list('username');
    `);
}