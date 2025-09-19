#!/usr/bin/env node

/**
 * 🔌 OMNI-CONTROL SDK 🔌
 * Cross-platform SDK for universal search and remote control
 * Like Amazon Silk browser engine + Nightbot API + Universal SDK
 * 
 * Works on: Web, Node.js, Mobile, Desktop, IoT, Embedded systems
 */

class OmniControlSDK {
    constructor(config = {}) {
        this.config = {
            hubUrl: config.hubUrl || 'http://localhost:9000',
            wsUrl: config.wsUrl || 'ws://localhost:9001',
            apiKey: config.apiKey || null,
            timeout: config.timeout || 30000,
            retries: config.retries || 3,
            enableCache: config.enableCache !== false,
            enableRealtimeUpdates: config.enableRealtimeUpdates !== false,
            ...config
        };

        this.cache = new Map();
        this.ws = null;
        this.connected = false;
        this.eventHandlers = new Map();
        this.requestQueue = [];
        this.isInitialized = false;

        // Auto-detect environment
        this.environment = this.detectEnvironment();
        
        this.initialize();
    }

    detectEnvironment() {
        // Detect if running in browser, Node.js, React Native, etc.
        if (typeof window !== 'undefined' && window.document) {
            return 'browser';
        } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            return 'nodejs';
        } else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
            return 'react-native';
        } else {
            return 'unknown';
        }
    }

    async initialize() {
        console.log('🔌 Initializing Omni-Control SDK...');
        console.log(`   Environment: ${this.environment}`);
        console.log(`   Hub URL: ${this.config.hubUrl}`);
        
        try {
            // Test connection to hub
            await this.testConnection();
            
            // Setup real-time connection if enabled
            if (this.config.enableRealtimeUpdates) {
                await this.connectWebSocket();
            }
            
            this.isInitialized = true;
            console.log('✅ Omni-Control SDK initialized');
            
            this.emit('initialized', { environment: this.environment });
            
        } catch (error) {
            console.error('❌ SDK initialization failed:', error.message);
            this.emit('error', { type: 'initialization', error: error.message });
        }
    }

    async testConnection() {
        try {
            const response = await this.makeRequest('GET', '/api/status');
            if (response.omniControl !== 'online') {
                throw new Error('Hub not online');
            }
            this.connected = true;
            return response;
        } catch (error) {
            this.connected = false;
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    async connectWebSocket() {
        if (this.environment === 'browser' && typeof WebSocket !== 'undefined') {
            try {
                this.ws = new WebSocket(this.config.wsUrl);
                
                this.ws.onopen = () => {
                    console.log('📡 Real-time connection established');
                    this.emit('connected');
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleRealtimeMessage(data);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('📡 Real-time connection closed');
                    this.emit('disconnected');
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.emit('error', { type: 'websocket', error: error.message });
                };
                
            } catch (error) {
                console.warn('WebSocket connection failed:', error.message);
            }
        } else if (this.environment === 'nodejs') {
            // Use ws library for Node.js
            try {
                const WebSocket = require('ws');
                this.ws = new WebSocket(this.config.wsUrl);
                // Setup similar handlers...
            } catch (error) {
                console.warn('Node.js WebSocket setup failed:', error.message);
            }
        }
    }

    // UNIVERSAL SEARCH API
    async search(query, options = {}) {
        console.log(`🔍 SDK Search: "${query}"`);
        
        const searchOptions = {
            query,
            sources: options.sources || 'all',
            filters: options.filters || {},
            userId: options.userId || 'sdk-user',
            cache: options.cache !== false,
            ...options
        };

        // Check cache first
        if (this.config.enableCache && searchOptions.cache) {
            const cacheKey = `search:${JSON.stringify(searchOptions)}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
                console.log('📋 Returning cached search results');
                return cached.data;
            }
        }

        try {
            const response = await this.makeRequest('POST', '/api/search', searchOptions);
            
            // Cache successful results
            if (this.config.enableCache && response.success) {
                const cacheKey = `search:${JSON.stringify(searchOptions)}`;
                this.cache.set(cacheKey, {
                    data: response,
                    timestamp: Date.now()
                });
            }
            
            return response;
            
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    // UNIVERSAL REMOTE CONTROL API
    async control(action, target, params = {}) {
        console.log(`🎮 SDK Control: ${action} on ${target}`);
        
        const controlRequest = {
            action,
            target,
            params,
            userId: params.userId || 'sdk-user'
        };

        try {
            const response = await this.makeRequest('POST', '/api/control', controlRequest);
            return response;
        } catch (error) {
            console.error('Remote control failed:', error);
            throw error;
        }
    }

    // DEPLOYMENT API
    async deploy(package, environments, config = {}) {
        console.log(`🚀 SDK Deploy: ${package} to ${environments}`);
        
        const deployRequest = {
            package,
            environments: Array.isArray(environments) ? environments : [environments],
            config,
            userId: config.userId || 'sdk-user'
        };

        try {
            const response = await this.makeRequest('POST', '/api/deploy', deployRequest);
            return response;
        } catch (error) {
            console.error('Deployment failed:', error);
            throw error;
        }
    }

    // NATURAL LANGUAGE COMMAND API
    async command(naturalLanguage, options = {}) {
        console.log(`💬 SDK Command: "${naturalLanguage}"`);
        
        const commandRequest = {
            command: naturalLanguage,
            userId: options.userId || 'sdk-user'
        };

        try {
            const response = await this.makeRequest('POST', '/api/command', commandRequest);
            return response;
        } catch (error) {
            console.error('Command processing failed:', error);
            throw error;
        }
    }

    // REAL-TIME DATA STREAM API
    async stream(type, options = {}) {
        console.log(`📡 SDK Stream: ${type}`);
        
        const streamOptions = {
            source: options.source || 'auto',
            filters: options.filters || {}
        };

        try {
            const response = await this.makeRequest('GET', `/api/stream/${type}`, null, streamOptions);
            return response;
        } catch (error) {
            console.error('Data stream failed:', error);
            throw error;
        }
    }

    // CONVENIENCE METHODS
    
    // Search shortcuts
    async searchFiles(query, options = {}) {
        return this.search(query, { ...options, sources: ['local'] });
    }

    async searchAPIs(query, options = {}) {
        return this.search(query, { ...options, sources: ['realtime'] });
    }

    async searchArbitrage(query, options = {}) {
        return this.search(query, { ...options, sources: ['arbitrage'] });
    }

    // Control shortcuts
    async start(service, options = {}) {
        return this.control('start', service, options);
    }

    async stop(service, options = {}) {
        return this.control('stop', service, options);
    }

    async restart(service, options = {}) {
        return this.control('restart', service, options);
    }

    async monitor(service, options = {}) {
        return this.control('monitor', service, options);
    }

    // Deployment shortcuts
    async deployToVercel(package, config = {}) {
        return this.deploy(package, 'vercel', config);
    }

    async deployToCloudflare(package, config = {}) {
        return this.deploy(package, 'cloudflare', config);
    }

    async deployToRailway(package, config = {}) {
        return this.deploy(package, 'railway', config);
    }

    async deployEverywhere(package, config = {}) {
        return this.deploy(package, ['vercel', 'cloudflare', 'railway'], config);
    }

    // Data stream shortcuts
    async getWikipediaData(query, options = {}) {
        return this.stream('wikipedia', { ...options, filters: { query } });
    }

    async getGitHubData(query, options = {}) {
        return this.stream('github', { ...options, filters: { query } });
    }

    async getCryptoData(symbol, options = {}) {
        return this.stream('crypto', { ...options, filters: { symbol } });
    }

    async getArbitrageOpportunities(filters = {}) {
        return this.stream('arbitrage', { filters });
    }

    // REAL-TIME METHODS

    onRealtimeUpdate(handler) {
        this.on('realtime', handler);
    }

    onError(handler) {
        this.on('error', handler);
    }

    onConnected(handler) {
        this.on('connected', handler);
    }

    onDisconnected(handler) {
        this.on('disconnected', handler);
    }

    // Send real-time message
    sendRealtimeMessage(type, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type,
                ...data,
                timestamp: Date.now()
            }));
        } else {
            console.warn('WebSocket not connected');
        }
    }

    // UTILITY METHODS

    async makeRequest(method, endpoint, body = null, params = null) {
        const url = new URL(endpoint, this.config.hubUrl);
        
        // Add query parameters
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                url.searchParams.append(key, value);
            }
        }

        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `OmniControlSDK/${this.environment}`
            }
        };

        // Add API key if configured
        if (this.config.apiKey) {
            requestOptions.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        // Add body for POST/PUT requests
        if (body && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(body);
        }

        // Retry logic
        let lastError;
        for (let attempt = 1; attempt <= this.config.retries; attempt++) {
            try {
                let response;
                
                // Use appropriate fetch method based on environment
                if (this.environment === 'browser' && typeof fetch !== 'undefined') {
                    response = await fetch(url.toString(), requestOptions);
                } else if (this.environment === 'nodejs') {
                    const axios = require('axios');
                    const axiosConfig = {
                        method,
                        url: url.toString(),
                        headers: requestOptions.headers,
                        timeout: this.config.timeout
                    };
                    if (body) axiosConfig.data = body;
                    
                    const axiosResponse = await axios(axiosConfig);
                    response = {
                        ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
                        status: axiosResponse.status,
                        json: async () => axiosResponse.data,
                        text: async () => JSON.stringify(axiosResponse.data)
                    };
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.json();

            } catch (error) {
                lastError = error;
                console.warn(`Request attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.config.retries) {
                    await this.sleep(1000 * attempt); // Exponential backoff
                }
            }
        }

        throw lastError;
    }

    handleRealtimeMessage(data) {
        console.log('📡 Real-time message:', data.type);
        this.emit('realtime', data);
        
        // Handle specific message types
        switch (data.type) {
            case 'search_results':
                this.emit('search_update', data);
                break;
            case 'control_result':
                this.emit('control_update', data);
                break;
            case 'stream_data':
                this.emit('stream_update', data);
                break;
            case 'system_status':
                this.emit('status_update', data);
                break;
        }
    }

    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Status and info methods
    isConnected() {
        return this.connected && this.isInitialized;
    }

    getStatus() {
        return {
            connected: this.connected,
            initialized: this.isInitialized,
            environment: this.environment,
            hubUrl: this.config.hubUrl,
            realtimeEnabled: this.config.enableRealtimeUpdates,
            cacheEnabled: this.config.enableCache,
            cacheSize: this.cache.size
        };
    }

    // Cleanup
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.isInitialized = false;
        this.cache.clear();
        this.eventHandlers.clear();
        console.log('🔌 SDK disconnected');
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = OmniControlSDK;
} else if (typeof window !== 'undefined') {
    // Browser
    window.OmniControlSDK = OmniControlSDK;
}

// Usage examples and testing
if (require.main === module) {
    async function testSDK() {
        console.log('🧪 Testing Omni-Control SDK...');
        
        const sdk = new OmniControlSDK({
            hubUrl: 'http://localhost:9000',
            enableRealtimeUpdates: true
        });

        // Wait for initialization
        sdk.on('initialized', async () => {
            console.log('🎉 SDK initialized, running tests...');

            // Test universal search
            try {
                const searchResults = await sdk.search('arbitrage opportunities');
                console.log('🔍 Search results:', searchResults.totalResults, 'found');
            } catch (error) {
                console.error('Search test failed:', error.message);
            }

            // Test natural language commands
            try {
                const commandResult = await sdk.command('find all token systems');
                console.log('💬 Command result:', commandResult.interpretation);
            } catch (error) {
                console.error('Command test failed:', error.message);
            }

            // Test data streams
            try {
                const streamData = await sdk.stream('wikipedia', { filters: { query: 'blockchain' } });
                console.log('📡 Stream data received');
            } catch (error) {
                console.error('Stream test failed:', error.message);
            }

            console.log('✅ SDK tests completed');
        });

        sdk.on('error', (error) => {
            console.error('SDK Error:', error);
        });
    }

    testSDK().catch(console.error);
}