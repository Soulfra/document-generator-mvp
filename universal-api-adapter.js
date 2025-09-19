#!/usr/bin/env node

/**
 * 🌐 UNIVERSAL API ADAPTER
 * 
 * Provides unified API access across all protocols:
 * - REST (Express, Fastify, Koa)
 * - GraphQL (Apollo, GraphQL Yoga)
 * - gRPC (Protocol Buffers)
 * - WebSocket (Socket.io, ws)
 * - WebRTC (P2P data channels)
 * - MQTT (IoT messaging)
 * - JSON-RPC (Ethereum, Bitcoin)
 * 
 * Works on ANY platform, ANY language, ANY format.
 */

const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const { EventEmitter } = require('events');
const PlatformAbstractionLayer = require('./platform-abstraction-layer');
const UniversalLanguageProcessor = require('./universal-language-processor');
const PlatformVerificationExtension = require('./platform-verification-extension');

class UniversalAPIAdapter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Core systems
        this.pal = new PlatformAbstractionLayer();
        this.languageProcessor = new UniversalLanguageProcessor();
        this.verifier = new PlatformVerificationExtension();
        
        // Configuration
        this.config = {
            // Ports
            restPort: config.restPort || 3000,
            graphqlPort: config.graphqlPort || 4000,
            grpcPort: config.grpcPort || 50051,
            wsPort: config.wsPort || 8080,
            webrtcPort: config.webrtcPort || 8081,
            mqttPort: config.mqttPort || 1883,
            
            // Features
            enableREST: config.enableREST !== false,
            enableGraphQL: config.enableGraphQL !== false,
            enableGRPC: config.enableGRPC !== false,
            enableWebSocket: config.enableWebSocket !== false,
            enableWebRTC: config.enableWebRTC !== false,
            enableMQTT: config.enableMQTT !== false,
            enableJSONRPC: config.enableJSONRPC !== false,
            
            // Security
            cors: config.cors || { origin: '*' },
            rateLimit: config.rateLimit || { windowMs: 60000, max: 100 },
            authentication: config.authentication || 'optional',
            
            ...config
        };
        
        // Protocol adapters
        this.adapters = new Map();
        this.handlers = new Map();
        
        // Unified data model
        this.dataModel = {
            Query: {},
            Mutation: {},
            Subscription: {},
            RPCs: {},
            Events: {}
        };
        
        // Metrics
        this.metrics = {
            requests: { rest: 0, graphql: 0, grpc: 0, ws: 0, mqtt: 0 },
            errors: { rest: 0, graphql: 0, grpc: 0, ws: 0, mqtt: 0 },
            latency: { rest: [], graphql: [], grpc: [], ws: [], mqtt: [] }
        };
        
        console.log('🌐 Universal API Adapter initializing...');
        console.log(`   Platform: ${this.pal.getPlatform().name}`);
        console.log(`   Protocols: ${this.getEnabledProtocols().join(', ')}`);
    }
    
    /**
     * Initialize all protocol adapters
     */
    async initialize() {
        console.log('\n🚀 Starting Universal API Adapter...');
        
        try {
            // Initialize enabled protocols
            if (this.config.enableREST) await this.initializeREST();
            if (this.config.enableGraphQL) await this.initializeGraphQL();
            if (this.config.enableGRPC) await this.initializeGRPC();
            if (this.config.enableWebSocket) await this.initializeWebSocket();
            if (this.config.enableWebRTC) await this.initializeWebRTC();
            if (this.config.enableMQTT) await this.initializeMQTT();
            if (this.config.enableJSONRPC) await this.initializeJSONRPC();
            
            console.log('✅ All protocols initialized successfully!');
            
            // Start health check endpoint
            this.startHealthCheck();
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * REST API Initialization
     */
    async initializeREST() {
        console.log('   📡 Initializing REST API...');
        
        const app = express();
        
        // Middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // CORS
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', this.config.cors.origin);
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Platform detection middleware
        app.use((req, res, next) => {
            req.platform = this.detectPlatformFromRequest(req);
            req.language = this.detectLanguageFromRequest(req);
            next();
        });
        
        // Universal endpoint handler
        app.all('/api/*', async (req, res) => {
            const startTime = Date.now();
            
            try {
                // Extract endpoint and method
                const endpoint = req.path.replace('/api/', '');
                const method = req.method.toLowerCase();
                
                // Find handler
                const handler = this.findHandler('rest', endpoint, method);
                if (!handler) {
                    return res.status(404).json({ error: 'Endpoint not found' });
                }
                
                // Verify platform if required
                if (this.config.authentication === 'required') {
                    const verification = await this.verifyRequest(req);
                    if (!verification.verified) {
                        return res.status(401).json({ error: 'Verification failed' });
                    }
                }
                
                // Execute handler
                const result = await handler({
                    body: req.body,
                    query: req.query,
                    headers: req.headers,
                    params: req.params,
                    platform: req.platform,
                    language: req.language
                });
                
                // Track metrics
                this.trackMetric('rest', Date.now() - startTime);
                
                // Send response
                res.json(result);
                
            } catch (error) {
                this.trackError('rest', error);
                res.status(500).json({ 
                    error: error.message,
                    platform: req.platform
                });
            }
        });
        
        // Start server
        app.listen(this.config.restPort, () => {
            console.log(`      ✓ REST API listening on port ${this.config.restPort}`);
        });
        
        this.adapters.set('rest', app);
    }
    
    /**
     * GraphQL API Initialization
     */
    async initializeGraphQL() {
        console.log('   🔷 Initializing GraphQL API...');
        
        // Dynamic schema generation
        const typeDefs = gql`
            type Platform {
                name: String!
                version: String!
                environment: String!
            }
            
            type VerificationResult {
                verified: Boolean!
                confidence: Float!
                platform: String!
                fingerprint: String
            }
            
            type Query {
                platform: Platform!
                verify(data: String!): VerificationResult!
                health: String!
            }
            
            type Mutation {
                process(input: String!, platform: String): String!
            }
            
            type Subscription {
                events(filter: String): String!
            }
        `;
        
        // Resolvers
        const resolvers = {
            Query: {
                platform: () => this.pal.getPlatform(),
                verify: async (_, { data }) => {
                    const result = await this.verifier.verifyPlatform(JSON.parse(data));
                    return result;
                },
                health: () => 'OK',
                ...this.dataModel.Query
            },
            Mutation: {
                process: async (_, { input, platform }) => {
                    const handler = this.findHandler('graphql', 'process', 'mutation');
                    if (handler) {
                        return await handler({ input, platform });
                    }
                    return 'No handler found';
                },
                ...this.dataModel.Mutation
            },
            Subscription: {
                events: {
                    subscribe: () => this.createEventStream(),
                    ...this.dataModel.Subscription
                }
            }
        };
        
        // Create Apollo Server
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            context: async ({ req }) => ({
                platform: this.detectPlatformFromRequest(req),
                language: this.detectLanguageFromRequest(req)
            })
        });
        
        const app = express();
        await server.start();
        server.applyMiddleware({ app, path: '/graphql' });
        
        app.listen(this.config.graphqlPort, () => {
            console.log(`      ✓ GraphQL API listening on port ${this.config.graphqlPort}`);
        });
        
        this.adapters.set('graphql', server);
    }
    
    /**
     * gRPC API Initialization
     */
    async initializeGRPC() {
        console.log('   🔌 Initializing gRPC API...');
        
        // Proto definition
        const protoPath = __dirname + '/universal-api.proto';
        
        // Create proto file if it doesn't exist
        await this.createProtoFile(protoPath);
        
        const packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });
        
        const proto = grpc.loadPackageDefinition(packageDefinition).universal;
        
        // Create server
        const server = new grpc.Server();
        
        // Add services
        server.addService(proto.UniversalAPI.service, {
            Process: async (call, callback) => {
                try {
                    const handler = this.findHandler('grpc', 'process', 'unary');
                    if (handler) {
                        const result = await handler(call.request);
                        callback(null, result);
                    } else {
                        callback(new Error('Handler not found'));
                    }
                } catch (error) {
                    callback(error);
                }
            },
            Stream: async (call) => {
                const handler = this.findHandler('grpc', 'stream', 'stream');
                if (handler) {
                    handler(call);
                }
            }
        });
        
        // Start server
        server.bindAsync(
            `0.0.0.0:${this.config.grpcPort}`,
            grpc.ServerCredentials.createInsecure(),
            (err, port) => {
                if (err) {
                    console.error('gRPC failed to start:', err);
                } else {
                    server.start();
                    console.log(`      ✓ gRPC API listening on port ${port}`);
                }
            }
        );
        
        this.adapters.set('grpc', server);
    }
    
    /**
     * WebSocket API Initialization
     */
    async initializeWebSocket() {
        console.log('   🔗 Initializing WebSocket API...');
        
        const wss = new WebSocket.Server({ port: this.config.wsPort });
        
        wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const platform = this.detectPlatformFromRequest(req);
            
            console.log(`      📱 WebSocket client connected: ${clientId} (${platform.name})`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                platform,
                timestamp: new Date().toISOString()
            }));
            
            // Handle messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    const handler = this.findHandler('websocket', data.type, 'message');
                    
                    if (handler) {
                        const result = await handler({
                            ...data,
                            clientId,
                            platform
                        });
                        
                        ws.send(JSON.stringify({
                            type: 'response',
                            id: data.id,
                            result
                        }));
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log(`      📴 WebSocket client disconnected: ${clientId}`);
            });
        });
        
        console.log(`      ✓ WebSocket API listening on port ${this.config.wsPort}`);
        
        this.adapters.set('websocket', wss);
    }
    
    /**
     * WebRTC Data Channel Support
     */
    async initializeWebRTC() {
        console.log('   🎥 Initializing WebRTC support...');
        
        // WebRTC signaling server
        const signalingServer = new WebSocket.Server({ port: this.config.webrtcPort });
        
        const peers = new Map();
        
        signalingServer.on('connection', (ws) => {
            const peerId = this.generateClientId();
            peers.set(peerId, ws);
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'offer':
                    case 'answer':
                    case 'ice-candidate':
                        // Forward to target peer
                        const targetPeer = peers.get(data.targetId);
                        if (targetPeer) {
                            targetPeer.send(JSON.stringify({
                                ...data,
                                peerId
                            }));
                        }
                        break;
                }
            });
            
            ws.on('close', () => {
                peers.delete(peerId);
            });
        });
        
        console.log(`      ✓ WebRTC signaling on port ${this.config.webrtcPort}`);
        
        this.adapters.set('webrtc', signalingServer);
    }
    
    /**
     * MQTT API Initialization
     */
    async initializeMQTT() {
        console.log('   📶 Initializing MQTT API...');
        
        // For demo, connect to a broker instead of running one
        const client = mqtt.connect(`mqtt://localhost:${this.config.mqttPort}`);
        
        client.on('connect', () => {
            console.log('      ✓ MQTT connected');
            
            // Subscribe to universal topics
            client.subscribe('universal/+/request');
            client.subscribe('universal/+/command');
        });
        
        client.on('message', async (topic, message) => {
            try {
                const parts = topic.split('/');
                const platform = parts[1];
                const type = parts[2];
                
                const data = JSON.parse(message);
                const handler = this.findHandler('mqtt', type, 'message');
                
                if (handler) {
                    const result = await handler({
                        ...data,
                        platform,
                        topic
                    });
                    
                    // Publish response
                    client.publish(
                        `universal/${platform}/response`,
                        JSON.stringify(result)
                    );
                }
            } catch (error) {
                console.error('MQTT error:', error);
            }
        });
        
        this.adapters.set('mqtt', client);
    }
    
    /**
     * JSON-RPC Support
     */
    async initializeJSONRPC() {
        console.log('   🔮 Initializing JSON-RPC support...');
        
        // Add JSON-RPC endpoint to REST server
        const app = this.adapters.get('rest');
        if (!app) return;
        
        app.post('/jsonrpc', async (req, res) => {
            try {
                const { jsonrpc, method, params, id } = req.body;
                
                if (jsonrpc !== '2.0') {
                    return res.json({
                        jsonrpc: '2.0',
                        error: { code: -32600, message: 'Invalid Request' },
                        id
                    });
                }
                
                const handler = this.findHandler('jsonrpc', method, 'call');
                if (!handler) {
                    return res.json({
                        jsonrpc: '2.0',
                        error: { code: -32601, message: 'Method not found' },
                        id
                    });
                }
                
                const result = await handler(params);
                
                res.json({
                    jsonrpc: '2.0',
                    result,
                    id
                });
                
            } catch (error) {
                res.json({
                    jsonrpc: '2.0',
                    error: { code: -32603, message: error.message },
                    id: req.body.id
                });
            }
        });
        
        console.log('      ✓ JSON-RPC endpoint ready at /jsonrpc');
    }
    
    /**
     * Register universal handler
     */
    registerHandler(protocol, endpoint, method, handler) {
        const key = `${protocol}:${endpoint}:${method}`;
        this.handlers.set(key, handler);
        
        console.log(`   📌 Registered handler: ${key}`);
        
        // Update data model for GraphQL
        if (protocol === 'graphql') {
            if (method === 'query') {
                this.dataModel.Query[endpoint] = handler;
            } else if (method === 'mutation') {
                this.dataModel.Mutation[endpoint] = handler;
            }
        }
    }
    
    /**
     * Find handler for request
     */
    findHandler(protocol, endpoint, method) {
        // Direct match
        let key = `${protocol}:${endpoint}:${method}`;
        if (this.handlers.has(key)) {
            return this.handlers.get(key);
        }
        
        // Wildcard match
        key = `*:${endpoint}:${method}`;
        if (this.handlers.has(key)) {
            return this.handlers.get(key);
        }
        
        // Protocol wildcard
        key = `${protocol}:*:${method}`;
        if (this.handlers.has(key)) {
            return this.handlers.get(key);
        }
        
        // Universal handler
        key = `*:*:*`;
        return this.handlers.get(key);
    }
    
    /**
     * Platform detection from request
     */
    detectPlatformFromRequest(req) {
        if (!req) return this.pal.getPlatform();
        
        const userAgent = req.headers['user-agent'] || '';
        
        // iOS detection
        if (userAgent.match(/iPhone|iPad|iPod/)) {
            return { name: 'ios', environment: 'mobile', version: '15.0' };
        }
        
        // Android detection
        if (userAgent.match(/Android/)) {
            return { name: 'android', environment: 'mobile', version: '12.0' };
        }
        
        // Desktop detection
        if (userAgent.match(/Windows/)) {
            return { name: 'windows', environment: 'desktop', version: '11' };
        }
        
        if (userAgent.match(/Mac/)) {
            return { name: 'macos', environment: 'desktop', version: '12.0' };
        }
        
        if (userAgent.match(/Linux/)) {
            return { name: 'linux', environment: 'desktop', version: 'ubuntu' };
        }
        
        // Default to web
        return { name: 'web', environment: 'browser', version: 'modern' };
    }
    
    /**
     * Language detection from request
     */
    async detectLanguageFromRequest(req) {
        if (!req) return { language: 'en', confidence: 1.0 };
        
        // Check Accept-Language header
        const acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
            const primary = acceptLanguage.split(',')[0].split('-')[0];
            return { language: primary, confidence: 0.9 };
        }
        
        // Check content for language
        if (req.body && req.body.text) {
            return await this.languageProcessor.detectLanguage(req.body.text);
        }
        
        return { language: 'en', confidence: 0.5 };
    }
    
    /**
     * Request verification
     */
    async verifyRequest(req) {
        const platform = req.platform;
        const data = {
            platform: platform.name,
            headers: req.headers,
            ip: req.ip,
            ...req.body
        };
        
        return await this.verifier.verifyPlatform(data);
    }
    
    /**
     * Create proto file
     */
    async createProtoFile(path) {
        const fs = require('fs').promises;
        
        const protoContent = `
syntax = "proto3";

package universal;

service UniversalAPI {
    rpc Process (Request) returns (Response) {}
    rpc Stream (Request) returns (stream Response) {}
}

message Request {
    string id = 1;
    string method = 2;
    string data = 3;
    map<string, string> metadata = 4;
}

message Response {
    string id = 1;
    bool success = 2;
    string data = 3;
    string error = 4;
    map<string, string> metadata = 5;
}
        `;
        
        try {
            await fs.writeFile(path, protoContent);
        } catch (error) {
            // File might already exist
        }
    }
    
    /**
     * Start health check endpoint
     */
    startHealthCheck() {
        const app = this.adapters.get('rest');
        if (!app) return;
        
        app.get('/health', (req, res) => {
            const protocols = {};
            
            for (const [name, adapter] of this.adapters) {
                protocols[name] = {
                    active: true,
                    requests: this.metrics.requests[name] || 0,
                    errors: this.metrics.errors[name] || 0,
                    avgLatency: this.calculateAvgLatency(name)
                };
            }
            
            res.json({
                status: 'healthy',
                platform: this.pal.getPlatform(),
                protocols,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            });
        });
    }
    
    /**
     * Metrics tracking
     */
    trackMetric(protocol, latency) {
        this.metrics.requests[protocol]++;
        this.metrics.latency[protocol].push(latency);
        
        // Keep only last 100 latencies
        if (this.metrics.latency[protocol].length > 100) {
            this.metrics.latency[protocol].shift();
        }
    }
    
    trackError(protocol, error) {
        this.metrics.errors[protocol]++;
        console.error(`${protocol} error:`, error);
    }
    
    calculateAvgLatency(protocol) {
        const latencies = this.metrics.latency[protocol] || [];
        if (latencies.length === 0) return 0;
        
        const sum = latencies.reduce((a, b) => a + b, 0);
        return Math.round(sum / latencies.length);
    }
    
    /**
     * Event stream for subscriptions
     */
    createEventStream() {
        const { PubSub } = require('graphql-subscriptions');
        const pubsub = new PubSub();
        
        // Emit events from all protocols
        this.on('event', (data) => {
            pubsub.publish('UNIVERSAL_EVENT', { events: JSON.stringify(data) });
        });
        
        return pubsub.asyncIterator(['UNIVERSAL_EVENT']);
    }
    
    /**
     * Generate client ID
     */
    generateClientId() {
        return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get enabled protocols
     */
    getEnabledProtocols() {
        const protocols = [];
        if (this.config.enableREST) protocols.push('REST');
        if (this.config.enableGraphQL) protocols.push('GraphQL');
        if (this.config.enableGRPC) protocols.push('gRPC');
        if (this.config.enableWebSocket) protocols.push('WebSocket');
        if (this.config.enableWebRTC) protocols.push('WebRTC');
        if (this.config.enableMQTT) protocols.push('MQTT');
        if (this.config.enableJSONRPC) protocols.push('JSON-RPC');
        return protocols;
    }
    
    /**
     * Broadcast message to all connected clients
     */
    broadcast(message, protocol = null) {
        const data = JSON.stringify(message);
        
        // WebSocket broadcast
        if (!protocol || protocol === 'websocket') {
            const wss = this.adapters.get('websocket');
            if (wss) {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            }
        }
        
        // MQTT broadcast
        if (!protocol || protocol === 'mqtt') {
            const mqtt = this.adapters.get('mqtt');
            if (mqtt) {
                mqtt.publish('universal/broadcast', data);
            }
        }
        
        // Emit for GraphQL subscriptions
        this.emit('event', message);
    }
}

// Export for use
module.exports = UniversalAPIAdapter;

// Run demo if executed directly
if (require.main === module) {
    (async () => {
        const adapter = new UniversalAPIAdapter({
            // Enable all protocols for demo
            enableREST: true,
            enableGraphQL: true,
            enableGRPC: true,
            enableWebSocket: true,
            enableWebRTC: false, // Requires additional setup
            enableMQTT: false,   // Requires MQTT broker
            enableJSONRPC: true
        });
        
        console.log('\n🌐 Universal API Adapter Demo');
        console.log('=============================\n');
        
        // Register some universal handlers
        adapter.registerHandler('*', 'echo', '*', async (data) => {
            return { echo: data, timestamp: new Date().toISOString() };
        });
        
        adapter.registerHandler('*', 'platform', '*', async (data) => {
            return adapter.pal.getPlatform();
        });
        
        adapter.registerHandler('*', 'verify', '*', async (data) => {
            return await adapter.verifier.verifyPlatform(data);
        });
        
        adapter.registerHandler('*', 'translate', '*', async (data) => {
            if (data.text && data.targetLanguage) {
                return await adapter.languageProcessor.translate(
                    data.text,
                    data.targetLanguage,
                    data.sourceLanguage
                );
            }
            return { error: 'Missing text or targetLanguage' };
        });
        
        // Initialize all protocols
        await adapter.initialize();
        
        console.log('\n📋 Available Endpoints:');
        console.log('   REST API:');
        console.log(`      GET  http://localhost:${adapter.config.restPort}/health`);
        console.log(`      POST http://localhost:${adapter.config.restPort}/api/echo`);
        console.log(`      POST http://localhost:${adapter.config.restPort}/api/verify`);
        console.log(`      POST http://localhost:${adapter.config.restPort}/jsonrpc`);
        console.log('');
        console.log('   GraphQL:');
        console.log(`      http://localhost:${adapter.config.graphqlPort}/graphql`);
        console.log('');
        console.log('   WebSocket:');
        console.log(`      ws://localhost:${adapter.config.wsPort}`);
        console.log('');
        console.log('   gRPC:');
        console.log(`      localhost:${adapter.config.grpcPort}`);
        console.log('');
        console.log('🚀 Universal API Adapter is ready!');
        console.log('   Works on ANY platform, ANY language, ANY format!');
    })();
}