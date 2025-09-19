#!/usr/bin/env node

/**
 * 🔒 API OBFUSCATION RELAY
 * Central API proxy that obfuscates user platform API calls
 * Routes all traffic through our infrastructure for usage billing & analytics
 */

require('dotenv').config();

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const url = require('url');
const { WebSocketServer } = require('ws');

class APIObfuscationRelay {
    constructor(config = {}) {
        this.config = {
            port: config.port || 4000,
            wsPort: config.wsPort || 4001,
            relayDomain: config.relayDomain || process.env.RELAY_DOMAIN || 'api.yourdomain.com',
            rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
            rateLimitMax: config.rateLimitMax || 1000,
            billingEnabled: config.billingEnabled !== false,
            ...config
        };
        
        // API routing table - maps platform IDs to their real API endpoints
        this.routingTable = new Map();
        
        // Rate limiting buckets
        this.rateLimitBuckets = new Map();
        
        // Active platform proxies
        this.platformProxies = new Map();
        
        // Usage tracking
        this.usageStats = new Map();
        
        // Supported API providers with routing configs
        this.apiProviders = {
            'stripe': {
                baseUrl: 'https://api.stripe.com',
                authHeader: 'Authorization',
                costPerCall: 0.01,
                supportedEndpoints: ['/v1/customers', '/v1/charges', '/v1/subscriptions', '/v1/payment_intents']
            },
            'coinapi': {
                baseUrl: 'https://rest.coinapi.io',
                authHeader: 'X-CoinAPI-Key',
                costPerCall: 0.005,
                supportedEndpoints: ['/v1/exchangerate', '/v1/ohlcv', '/v1/trades']
            },
            'amadeus': {
                baseUrl: 'https://api.amadeus.com',
                authHeader: 'Authorization',
                costPerCall: 0.02,
                supportedEndpoints: ['/v2/shopping/flight-offers', '/v1/reference-data/locations']
            },
            'openai': {
                baseUrl: 'https://api.openai.com',
                authHeader: 'Authorization',
                costPerCall: 0.03,
                supportedEndpoints: ['/v1/completions', '/v1/chat/completions', '/v1/images/generations']
            },
            'anthropic': {
                baseUrl: 'https://api.anthropic.com',
                authHeader: 'x-api-key',
                costPerCall: 0.025,
                supportedEndpoints: ['/v1/messages']
            },
            'github': {
                baseUrl: 'https://api.github.com',
                authHeader: 'Authorization',
                costPerCall: 0.001,
                supportedEndpoints: ['/repos', '/users', '/orgs']
            },
            'discord': {
                baseUrl: 'https://discord.com/api/v10',
                authHeader: 'Authorization',
                costPerCall: 0.001,
                supportedEndpoints: ['/channels', '/guilds', '/users/@me']
            }
        };
        
        this.db = null;
        this.server = null;
        this.wss = null;
        
        console.log('🔒 API Obfuscation Relay initializing...');
        console.log(`🌐 Relay domain: ${this.config.relayDomain}`);
        console.log(`📊 Supporting ${Object.keys(this.apiProviders).length} API providers`);
    }
    
    async init() {
        // Connect to database
        this.db = new sqlite3.Database('./economic-engine.db');
        await this.createRelayTables();
        
        // Start HTTP relay server
        this.server = http.createServer((req, res) => this.handleRelayRequest(req, res));
        
        // Start WebSocket for real-time monitoring
        this.wss = new WebSocketServer({ port: this.config.wsPort });
        this.wss.on('connection', (ws) => this.handleWebSocket(ws));
        
        // Start cleanup tasks
        this.startCleanupTasks();
        
        return new Promise((resolve) => {
            this.server.listen(this.config.port, () => {
                console.log(`🔒 API Obfuscation Relay: http://localhost:${this.config.port}`);
                console.log(`📡 Relay WebSocket: ws://localhost:${this.config.wsPort}`);
                console.log('✅ Ready to obfuscate and relay API calls');
                resolve();
            });
        });
    }
    
    async createRelayTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS platform_api_configs (
                config_id TEXT PRIMARY KEY,
                platform_id TEXT UNIQUE,
                user_id TEXT,
                obfuscated_url TEXT,
                api_providers TEXT,
                rate_limit INTEGER DEFAULT 1000,
                billing_enabled INTEGER DEFAULT 1,
                total_calls INTEGER DEFAULT 0,
                total_cost REAL DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS api_call_logs (
                log_id TEXT PRIMARY KEY,
                platform_id TEXT,
                user_id TEXT,
                provider TEXT,
                endpoint TEXT,
                method TEXT,
                status_code INTEGER,
                response_time INTEGER,
                cost REAL,
                bytes_transferred INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (platform_id) REFERENCES platform_api_configs(platform_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS usage_billing (
                billing_id TEXT PRIMARY KEY,
                platform_id TEXT,
                user_id TEXT,
                billing_period TEXT,
                api_calls INTEGER DEFAULT 0,
                total_cost REAL DEFAULT 0,
                data_transferred INTEGER DEFAULT 0,
                peak_rps INTEGER DEFAULT 0,
                billing_status TEXT DEFAULT 'pending',
                stripe_invoice_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (platform_id) REFERENCES platform_api_configs(platform_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS relay_analytics (
                analytics_id TEXT PRIMARY KEY,
                platform_id TEXT,
                date TEXT,
                total_calls INTEGER DEFAULT 0,
                successful_calls INTEGER DEFAULT 0,
                failed_calls INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0,
                total_cost REAL DEFAULT 0,
                unique_ips INTEGER DEFAULT 0,
                top_endpoints TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const sql of tables) {
            await this.runQuery(sql);
        }
        
        console.log('✅ API relay database tables created');
    }
    
    // Main API relay handler
    async handleRelayRequest(req, res) {
        const startTime = Date.now();
        const clientIP = req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        try {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Platform-ID');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Parse URL to extract platform ID and target
            const parsedUrl = url.parse(req.url, true);
            const pathParts = parsedUrl.pathname.split('/').filter(p => p);
            
            // URL format: /api/{platform_id}/{provider}/{endpoint}
            if (pathParts.length < 3 || pathParts[0] !== 'api') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Invalid API relay URL format',
                    expected: '/api/{platform_id}/{provider}/{endpoint}'
                }));
                return;
            }
            
            const platformId = pathParts[1];
            const provider = pathParts[2];
            const endpoint = '/' + pathParts.slice(3).join('/');
            
            // Get platform config
            const platformConfig = await this.getPlatformConfig(platformId);
            if (!platformConfig) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Platform not found or inactive' }));
                return;
            }
            
            // Check rate limiting
            const rateLimitResult = await this.checkRateLimit(platformId, clientIP);
            if (!rateLimitResult.allowed) {
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Rate limit exceeded',
                    resetTime: rateLimitResult.resetTime
                }));
                return;
            }
            
            // Validate provider and endpoint
            if (!this.apiProviders[provider]) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Unsupported API provider',
                    supported: Object.keys(this.apiProviders)
                }));
                return;
            }
            
            const providerConfig = this.apiProviders[provider];
            const isEndpointSupported = providerConfig.supportedEndpoints.some(ep => 
                endpoint.startsWith(ep)
            );
            
            if (!isEndpointSupported) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Unsupported endpoint for provider',
                    supported: providerConfig.supportedEndpoints
                }));
                return;
            }
            
            // Relay the API call
            const relayResult = await this.relayAPICall(
                platformConfig,
                provider,
                endpoint,
                req.method,
                req.headers,
                req
            );
            
            const responseTime = Date.now() - startTime;
            
            // Log the API call
            await this.logAPICall({
                platformId,
                userId: platformConfig.user_id,
                provider,
                endpoint,
                method: req.method,
                statusCode: relayResult.statusCode,
                responseTime,
                cost: providerConfig.costPerCall,
                bytesTransferred: relayResult.responseSize,
                ipAddress: clientIP,
                userAgent
            });
            
            // Update platform usage
            await this.updatePlatformUsage(platformId, providerConfig.costPerCall);
            
            // Send response
            res.writeHead(relayResult.statusCode, relayResult.headers);
            res.end(relayResult.body);
            
            // Broadcast real-time analytics
            this.broadcastUsageUpdate({
                platformId,
                provider,
                endpoint,
                responseTime,
                success: relayResult.statusCode < 400
            });
            
        } catch (error) {
            console.error('❌ Relay error:', error);
            
            const responseTime = Date.now() - startTime;
            
            // Log error
            await this.logAPICall({
                platformId: 'unknown',
                userId: 'unknown',
                provider: 'unknown',
                endpoint: req.url,
                method: req.method,
                statusCode: 500,
                responseTime,
                cost: 0,
                bytesTransferred: 0,
                ipAddress: clientIP,
                userAgent
            });
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal relay error' }));
        }
    }
    
    async relayAPICall(platformConfig, provider, endpoint, method, headers, requestStream) {
        return new Promise((resolve, reject) => {
            const providerConfig = this.apiProviders[provider];
            const targetUrl = new URL(endpoint, providerConfig.baseUrl);
            
            // Prepare headers - remove platform-specific headers and add provider auth
            const relayHeaders = { ...headers };
            delete relayHeaders['x-platform-id'];
            delete relayHeaders['host'];
            
            // Get API credentials from platform config
            const apiProviders = JSON.parse(platformConfig.api_providers || '{}');
            const providerCreds = apiProviders[provider];
            
            if (providerCreds && providerCreds.apiKey) {
                relayHeaders[providerConfig.authHeader] = 
                    provider === 'stripe' ? `Bearer ${providerCreds.apiKey}` :
                    provider === 'openai' ? `Bearer ${providerCreds.apiKey}` :
                    provider === 'anthropic' ? providerCreds.apiKey :
                    provider === 'github' ? `Bearer ${providerCreds.apiKey}` :
                    provider === 'discord' ? `Bot ${providerCreds.apiKey}` :
                    providerCreds.apiKey;
            }
            
            const options = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
                path: targetUrl.pathname + targetUrl.search,
                method: method,
                headers: relayHeaders
            };
            
            const protocol = targetUrl.protocol === 'https:' ? https : http;
            
            const proxyReq = protocol.request(options, (proxyRes) => {
                let responseBody = '';
                let responseSize = 0;
                
                proxyRes.on('data', (chunk) => {
                    responseBody += chunk;
                    responseSize += chunk.length;
                });
                
                proxyRes.on('end', () => {
                    resolve({
                        statusCode: proxyRes.statusCode,
                        headers: proxyRes.headers,
                        body: responseBody,
                        responseSize
                    });
                });
            });
            
            proxyReq.on('error', (error) => {
                console.error(`Proxy error for ${provider}:`, error);
                resolve({
                    statusCode: 502,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Upstream API error', provider }),
                    responseSize: 0
                });
            });
            
            // Timeout handling
            proxyReq.setTimeout(30000, () => {
                proxyReq.destroy();
                resolve({
                    statusCode: 504,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'API timeout', provider }),
                    responseSize: 0
                });
            });
            
            // Pipe request body
            requestStream.pipe(proxyReq);
        });
    }
    
    // Platform management
    async createPlatformProxy(platformId, userId, apiProviders, options = {}) {
        const configId = this.generateId('config');
        const obfuscatedUrl = `${this.config.relayDomain}/api/${platformId}`;
        
        const sql = `
            INSERT INTO platform_api_configs 
            (config_id, platform_id, user_id, obfuscated_url, api_providers, rate_limit, billing_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.runQuery(sql, [
            configId,
            platformId,
            userId,
            obfuscatedUrl,
            JSON.stringify(apiProviders),
            options.rateLimit || 1000,
            options.billingEnabled !== false ? 1 : 0
        ]);
        
        console.log(`🔒 Created API proxy for platform: ${platformId}`);
        console.log(`🌐 Obfuscated URL: ${obfuscatedUrl}`);
        
        return {
            configId,
            platformId,
            obfuscatedUrl,
            supportedProviders: Object.keys(this.apiProviders),
            rateLimit: options.rateLimit || 1000
        };
    }
    
    async updatePlatformCredentials(platformId, provider, credentials) {
        const config = await this.getPlatformConfig(platformId);
        if (!config) {
            throw new Error('Platform not found');
        }
        
        const apiProviders = JSON.parse(config.api_providers || '{}');
        apiProviders[provider] = credentials;
        
        await this.runQuery(`
            UPDATE platform_api_configs 
            SET api_providers = ?, last_used = CURRENT_TIMESTAMP
            WHERE platform_id = ?
        `, [JSON.stringify(apiProviders), platformId]);
        
        console.log(`🔑 Updated ${provider} credentials for platform: ${platformId}`);
        
        return { success: true, provider, platformId };
    }
    
    // Rate limiting
    async checkRateLimit(platformId, clientIP) {
        const key = `${platformId}:${clientIP}`;
        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        
        if (!this.rateLimitBuckets.has(key)) {
            this.rateLimitBuckets.set(key, []);
        }
        
        const bucket = this.rateLimitBuckets.get(key);
        
        // Remove old entries
        while (bucket.length > 0 && bucket[0] < windowStart) {
            bucket.shift();
        }
        
        // Check limit
        if (bucket.length >= this.config.rateLimitMax) {
            return { 
                allowed: false, 
                resetTime: bucket[0] + this.config.rateLimitWindow 
            };
        }
        
        // Add current request
        bucket.push(now);
        
        return { allowed: true };
    }
    
    // Analytics and billing
    async logAPICall(callData) {
        const logId = this.generateId('log');
        
        const sql = `
            INSERT INTO api_call_logs 
            (log_id, platform_id, user_id, provider, endpoint, method, status_code, 
             response_time, cost, bytes_transferred, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.runQuery(sql, [
            logId,
            callData.platformId,
            callData.userId,
            callData.provider,
            callData.endpoint,
            callData.method,
            callData.statusCode,
            callData.responseTime,
            callData.cost,
            callData.bytesTransferred,
            callData.ipAddress,
            callData.userAgent
        ]);
        
        return logId;
    }
    
    async updatePlatformUsage(platformId, cost) {
        await this.runQuery(`
            UPDATE platform_api_configs 
            SET total_calls = total_calls + 1, 
                total_cost = total_cost + ?, 
                last_used = CURRENT_TIMESTAMP
            WHERE platform_id = ?
        `, [cost, platformId]);
    }
    
    async generateUsageBill(platformId, billingPeriod = 'monthly') {
        const sql = `
            SELECT 
                COUNT(*) as api_calls,
                SUM(cost) as total_cost,
                SUM(bytes_transferred) as data_transferred,
                COUNT(DISTINCT ip_address) as unique_users,
                AVG(response_time) as avg_response_time
            FROM api_call_logs 
            WHERE platform_id = ? 
            AND timestamp >= datetime('now', '-1 month')
        `;
        
        const usage = await this.runQuery(sql, [platformId]);
        const usageData = usage[0];
        
        // Create billing record
        const billingId = this.generateId('billing');
        
        await this.runQuery(`
            INSERT INTO usage_billing 
            (billing_id, platform_id, billing_period, api_calls, total_cost, data_transferred)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            billingId,
            platformId,
            billingPeriod,
            usageData.api_calls,
            usageData.total_cost,
            usageData.data_transferred
        ]);
        
        return {
            billingId,
            platformId,
            period: billingPeriod,
            usage: usageData,
            billAmount: Math.max(1, usageData.total_cost), // Minimum $1
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };
    }
    
    // WebSocket for real-time monitoring
    handleWebSocket(ws) {
        console.log('📡 Relay monitoring client connected');
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                await this.handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('WebSocket error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('📡 Relay monitoring client disconnected');
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'relay_connected',
            supportedProviders: Object.keys(this.apiProviders),
            timestamp: new Date()
        }));
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'get_platform_stats':
                if (data.platformId) {
                    const stats = await this.getPlatformStats(data.platformId);
                    ws.send(JSON.stringify({
                        type: 'platform_stats',
                        platformId: data.platformId,
                        stats
                    }));
                }
                break;
                
            case 'get_real_time_usage':
                const usage = await this.getRealTimeUsage();
                ws.send(JSON.stringify({
                    type: 'real_time_usage',
                    usage
                }));
                break;
        }
    }
    
    broadcastUsageUpdate(update) {
        const message = JSON.stringify({
            type: 'usage_update',
            ...update,
            timestamp: new Date()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }
    
    // Utility methods
    async getPlatformConfig(platformId) {
        const sql = 'SELECT * FROM platform_api_configs WHERE platform_id = ? AND status = "active"';
        const result = await this.runQuery(sql, [platformId]);
        return result[0];
    }
    
    async getPlatformStats(platformId) {
        const sql = `
            SELECT 
                COUNT(*) as total_calls,
                COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_calls,
                AVG(response_time) as avg_response_time,
                SUM(cost) as total_cost,
                SUM(bytes_transferred) as total_data
            FROM api_call_logs 
            WHERE platform_id = ?
            AND timestamp >= datetime('now', '-24 hours')
        `;
        
        const result = await this.runQuery(sql, [platformId]);
        return result[0];
    }
    
    async getRealTimeUsage() {
        const sql = `
            SELECT 
                provider,
                COUNT(*) as calls,
                AVG(response_time) as avg_response_time,
                SUM(cost) as total_cost
            FROM api_call_logs 
            WHERE timestamp >= datetime('now', '-1 hour')
            GROUP BY provider
        `;
        
        return await this.runQuery(sql);
    }
    
    startCleanupTasks() {
        // Clean up old rate limit buckets every 5 minutes
        setInterval(() => {
            const now = Date.now();
            const cutoff = now - (this.config.rateLimitWindow * 2);
            
            for (const [key, bucket] of this.rateLimitBuckets.entries()) {
                if (bucket.length === 0 || bucket[bucket.length - 1] < cutoff) {
                    this.rateLimitBuckets.delete(key);
                }
            }
        }, 5 * 60 * 1000);
        
        // Generate daily analytics every 24 hours
        setInterval(async () => {
            await this.generateDailyAnalytics();
        }, 24 * 60 * 60 * 1000);
        
        console.log('⏰ Cleanup tasks scheduled');
    }
    
    async generateDailyAnalytics() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        const platforms = await this.runQuery('SELECT DISTINCT platform_id FROM api_call_logs');
        
        for (const platform of platforms) {
            const sql = `
                SELECT 
                    COUNT(*) as total_calls,
                    COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_calls,
                    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_calls,
                    AVG(response_time) as avg_response_time,
                    SUM(cost) as total_cost,
                    COUNT(DISTINCT ip_address) as unique_ips
                FROM api_call_logs 
                WHERE platform_id = ? 
                AND date(timestamp) = ?
            `;
            
            const stats = await this.runQuery(sql, [platform.platform_id, dateStr]);
            const dailyStats = stats[0];
            
            if (dailyStats.total_calls > 0) {
                await this.runQuery(`
                    INSERT OR REPLACE INTO relay_analytics 
                    (analytics_id, platform_id, date, total_calls, successful_calls, failed_calls, 
                     avg_response_time, total_cost, unique_ips)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    this.generateId('analytics'),
                    platform.platform_id,
                    dateStr,
                    dailyStats.total_calls,
                    dailyStats.successful_calls,
                    dailyStats.failed_calls,
                    dailyStats.avg_response_time,
                    dailyStats.total_cost,
                    dailyStats.unique_ips
                ]);
            }
        }
        
        console.log(`📊 Daily analytics generated for ${platforms.length} platforms`);
    }
    
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.toUpperCase().trim().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }
}

module.exports = APIObfuscationRelay;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🔒 API OBFUSCATION RELAY DEMO');
        console.log('==============================\n');
        
        const relay = new APIObfuscationRelay({
            port: 4000,
            wsPort: 4001
        });
        
        await relay.init();
        
        // Demo: Create platform proxy
        const platformProxy = await relay.createPlatformProxy(
            'demo_platform_123',
            'demo_user_456',
            {
                stripe: { apiKey: 'sk_test_demo123' },
                openai: { apiKey: 'sk-demo456' },
                coinapi: { apiKey: 'demo789' }
            },
            { rateLimit: 500 }
        );
        
        console.log('🔒 Demo platform proxy created:');
        console.log(JSON.stringify(platformProxy, null, 2));
        
        // Demo: Generate usage bill
        setTimeout(async () => {
            const bill = await relay.generateUsageBill('demo_platform_123');
            console.log('\n💰 Demo usage bill:');
            console.log(JSON.stringify(bill, null, 2));
        }, 2000);
        
        console.log('\n✅ API Obfuscation Relay demo complete!');
        console.log('🌐 Try making API calls to: http://localhost:4000/api/demo_platform_123/stripe/v1/customers');
        console.log('📊 Real-time monitoring: ws://localhost:4001');
    };
    
    demo().catch(console.error);
}