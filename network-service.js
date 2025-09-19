#!/usr/bin/env node

/**
 * UNIFIED NETWORK SERVICE
 * Central HTTP/HTTPS client with retry logic, WebSocket management, and connection pooling
 * This service enables all other services to make internet requests
 */

const axios = require('axios');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const EventEmitter = require('events');
const { URL } = require('url');

class NetworkService extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            timeout: options.timeout || 30000,
            maxRedirects: options.maxRedirects || 5,
            userAgent: options.userAgent || 'DocumentGenerator/1.0.0',
            ...options
        };
        
        // Connection pools
        this.httpsAgent = new https.Agent({
            keepAlive: true,
            maxSockets: 50,
            maxFreeSockets: 10,
            timeout: 60000,
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        });
        
        this.httpAgent = new http.Agent({
            keepAlive: true,
            maxSockets: 50,
            maxFreeSockets: 10,
            timeout: 60000
        });
        
        // WebSocket connections
        this.websockets = new Map();
        
        // Request statistics
        this.stats = {
            requests: 0,
            successful: 0,
            failed: 0,
            retries: 0,
            activeWebSockets: 0
        };
        
        // Create axios instance with defaults
        this.client = axios.create({
            timeout: this.config.timeout,
            maxRedirects: this.config.maxRedirects,
            httpsAgent: this.httpsAgent,
            httpAgent: this.httpAgent,
            headers: {
                'User-Agent': this.config.userAgent
            },
            validateStatus: (status) => status < 500 // Don't throw on 4xx
        });
        
        this.setupInterceptors();
        
        console.log('🌐 Network Service initialized');
    }

    /**
     * Setup axios interceptors for logging and retry logic
     */
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                this.stats.requests++;
                this.emit('request', {
                    method: config.method,
                    url: config.url,
                    headers: config.headers
                });
                console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.stats.failed++;
                return Promise.reject(error);
            }
        );
        
        // Response interceptor with retry logic
        this.client.interceptors.response.use(
            (response) => {
                this.stats.successful++;
                this.emit('response', {
                    status: response.status,
                    url: response.config.url,
                    duration: Date.now() - response.config.metadata?.startTime
                });
                console.log(`✅ ${response.status} ${response.config.url}`);
                return response;
            },
            async (error) => {
                const config = error.config;
                
                // If no config or already retried max times, reject
                if (!config || config.__retryCount >= this.config.maxRetries) {
                    this.stats.failed++;
                    this.emit('error', error);
                    return Promise.reject(error);
                }
                
                // Increment retry count
                config.__retryCount = config.__retryCount || 0;
                config.__retryCount++;
                this.stats.retries++;
                
                // Calculate delay with exponential backoff
                const delay = this.config.retryDelay * Math.pow(2, config.__retryCount - 1);
                
                console.log(`🔄 Retry ${config.__retryCount}/${this.config.maxRetries} for ${config.url} after ${delay}ms`);
                
                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Add timestamp for tracking
                if (!config.metadata) config.metadata = {};
                config.metadata.startTime = Date.now();
                
                return this.client(config);
            }
        );
    }

    /**
     * Make HTTP request with automatic retry and error handling
     */
    async request(options) {
        // Normalize options
        if (typeof options === 'string') {
            options = { url: options };
        }
        
        // Add metadata
        options.metadata = {
            startTime: Date.now()
        };
        
        try {
            const response = await this.client(options);
            return {
                success: true,
                status: response.status,
                headers: response.headers,
                data: response.data,
                duration: Date.now() - options.metadata.startTime
            };
        } catch (error) {
            console.error(`❌ Request failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data,
                duration: Date.now() - options.metadata.startTime
            };
        }
    }

    /**
     * Convenience methods
     */
    async get(url, options = {}) {
        return this.request({ ...options, method: 'GET', url });
    }

    async post(url, data, options = {}) {
        return this.request({ ...options, method: 'POST', url, data });
    }

    async put(url, data, options = {}) {
        return this.request({ ...options, method: 'PUT', url, data });
    }

    async delete(url, options = {}) {
        return this.request({ ...options, method: 'DELETE', url });
    }

    async patch(url, data, options = {}) {
        return this.request({ ...options, method: 'PATCH', url, data });
    }

    /**
     * Create WebSocket connection
     */
    createWebSocket(url, options = {}) {
        const wsUrl = new URL(url);
        const wsKey = `${wsUrl.hostname}:${wsUrl.port || (wsUrl.protocol === 'wss:' ? 443 : 80)}${wsUrl.pathname}`;
        
        // Check if connection already exists
        if (this.websockets.has(wsKey)) {
            console.log(`♻️  Reusing WebSocket connection to ${wsKey}`);
            return this.websockets.get(wsKey);
        }
        
        console.log(`🔌 Creating WebSocket connection to ${url}`);
        
        const ws = new WebSocket(url, options);
        const wrapper = new EventEmitter();
        
        // Store connection
        this.websockets.set(wsKey, wrapper);
        this.stats.activeWebSockets++;
        
        // Forward events
        ws.on('open', () => {
            console.log(`✅ WebSocket connected to ${wsKey}`);
            wrapper.emit('open');
        });
        
        ws.on('message', (data) => {
            wrapper.emit('message', data);
        });
        
        ws.on('error', (error) => {
            console.error(`❌ WebSocket error for ${wsKey}:`, error.message);
            wrapper.emit('error', error);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed for ${wsKey}: ${code} ${reason}`);
            wrapper.emit('close', code, reason);
            this.websockets.delete(wsKey);
            this.stats.activeWebSockets--;
        });
        
        // Add send method
        wrapper.send = (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            } else {
                console.error(`Cannot send to ${wsKey}: WebSocket not open`);
            }
        };
        
        // Add close method
        wrapper.close = () => {
            ws.close();
        };
        
        // Store reference to underlying websocket
        wrapper.ws = ws;
        
        return wrapper;
    }

    /**
     * Check internet connectivity
     */
    async checkConnectivity() {
        const testUrls = [
            'https://www.google.com',
            'https://www.cloudflare.com',
            'https://www.github.com'
        ];
        
        console.log('🔍 Checking internet connectivity...');
        
        for (const url of testUrls) {
            try {
                const response = await this.get(url, {
                    timeout: 5000,
                    maxRedirects: 0
                });
                
                if (response.success) {
                    console.log('✅ Internet connection verified');
                    return true;
                }
            } catch (error) {
                // Continue to next URL
            }
        }
        
        console.error('❌ No internet connection detected');
        return false;
    }

    /**
     * Get network statistics
     */
    getStats() {
        return {
            ...this.stats,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: {
                https: Object.keys(this.httpsAgent.sockets).length,
                http: Object.keys(this.httpAgent.sockets).length,
                websockets: this.websockets.size
            }
        };
    }

    /**
     * Health check endpoint
     */
    async healthCheck() {
        const hasInternet = await this.checkConnectivity();
        const stats = this.getStats();
        
        return {
            status: hasInternet ? 'healthy' : 'degraded',
            hasInternet,
            stats,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Express/HTTP server for other services to use
     */
    createServer(port = 3333) {
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        
        // Health check
        app.get('/health', async (req, res) => {
            const health = await this.healthCheck();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });
        
        // Stats endpoint
        app.get('/stats', (req, res) => {
            res.json(this.getStats());
        });
        
        // Proxy endpoint for other services
        app.all('/proxy', async (req, res) => {
            const { url, method = 'GET', headers = {}, data } = req.body;
            
            if (!url) {
                return res.status(400).json({ error: 'URL required' });
            }
            
            try {
                const response = await this.request({
                    url,
                    method,
                    headers,
                    data
                });
                
                res.json(response);
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    code: error.code
                });
            }
        });
        
        // WebSocket proxy
        app.post('/websocket/create', (req, res) => {
            const { url, options = {} } = req.body;
            
            if (!url) {
                return res.status(400).json({ error: 'URL required' });
            }
            
            try {
                const ws = this.createWebSocket(url, options);
                const wsId = Date.now().toString();
                
                // Store for later reference
                this.websockets.set(wsId, ws);
                
                res.json({
                    success: true,
                    wsId,
                    message: 'WebSocket connection initiated'
                });
            } catch (error) {
                res.status(500).json({
                    error: error.message
                });
            }
        });
        
        app.listen(port, () => {
            console.log(`🌐 Network Service HTTP API running on port ${port}`);
        });
        
        return app;
    }
}

// Export for use as module
module.exports = NetworkService;

// Run as standalone service if called directly
if (require.main === module) {
    const service = new NetworkService({
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
    });
    
    // Create HTTP server
    service.createServer(process.env.NETWORK_SERVICE_PORT || 3333);
    
    // Log stats periodically
    setInterval(() => {
        const stats = service.getStats();
        console.log('📊 Network Stats:', {
            requests: stats.requests,
            successful: stats.successful,
            failed: stats.failed,
            activeWebSockets: stats.activeWebSockets
        });
    }, 60000); // Every minute
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Network Service...');
        
        // Close all websockets
        service.websockets.forEach(ws => {
            if (ws.close) ws.close();
        });
        
        // Destroy connection pools
        service.httpsAgent.destroy();
        service.httpAgent.destroy();
        
        process.exit(0);
    });
}