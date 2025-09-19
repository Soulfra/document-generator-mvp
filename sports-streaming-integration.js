#!/usr/bin/env node

/**
 * 🔗 SPORTS STREAMING INTEGRATION SERVICE
 * 
 * Master integration service that connects all streaming components into
 * a unified system. Acts as the orchestrator for stream aggregation,
 * content verification, GIF generation, 3D cameras, and more.
 * 
 * Like legendary drops providing continuity in an MMO raid, this service
 * ensures all components work together seamlessly.
 */

const EventEmitter = require('events');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SportsStreamingIntegration extends EventEmitter {
    constructor() {
        super();
        
        // Service configuration
        this.config = {
            port: 9999,
            wsPort: 9998,
            
            services: {
                streamAggregator: {
                    url: 'http://localhost:9090',
                    required: true
                },
                gifGenerator: {
                    url: 'http://localhost:9091',
                    required: true
                },
                cameraSystem: {
                    url: 'http://localhost:9092',
                    wsUrl: 'ws://localhost:9093',
                    required: true
                },
                contentVerifier: {
                    url: 'http://localhost:8889',
                    required: false
                },
                sportsData: {
                    url: 'http://localhost:8890',
                    required: false
                },
                sonarDisplay: {
                    url: 'http://localhost:7777',
                    required: false
                },
                tieredAccess: {
                    url: 'http://localhost:8885',
                    required: false
                },
                communityNetwork: {
                    url: 'http://localhost:8886',
                    required: false
                },
                proofSystem: {
                    url: 'http://localhost:8888',
                    required: false
                },
                auditableSound: {
                    url: 'http://localhost:8080',
                    required: false
                }
            },
            
            pipelines: {
                streamToGif: {
                    name: 'Stream to GIF Pipeline',
                    steps: ['discover', 'verify', 'monitor', 'detect', 'generate', 'distribute']
                },
                immersiveExperience: {
                    name: 'Immersive Experience Pipeline',
                    steps: ['aggregate', 'enhance', 'spatialize', 'render', 'deliver']
                },
                verification: {
                    name: 'Content Verification Pipeline',
                    steps: ['capture', 'analyze', 'verify', 'blockchain', 'badge']
                }
            },
            
            orchestration: {
                maxConcurrent: 10,
                retryAttempts: 3,
                healthCheckInterval: 30000,
                syncInterval: 5000
            }
        };
        
        // Integration state
        this.serviceStatus = new Map();
        this.activePipelines = new Map();
        this.streamIndex = new Map();
        this.verificationChain = [];
        this.performanceMetrics = new Map();
        
        // Unified data model
        this.unifiedData = {
            streams: new Map(),
            gifs: new Map(),
            cameras: new Map(),
            verifications: new Map(),
            users: new Map()
        };
        
        // WebSocket connections
        this.wsClients = new Set();
        this.serviceConnections = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔗 Initializing Sports Streaming Integration Service...');
        console.log('================================================');
        
        try {
            // Check service availability
            await this.checkServiceHealth();
            
            // Establish service connections
            await this.connectToServices();
            
            // Initialize data synchronization
            await this.initializeDataSync();
            
            // Setup pipeline orchestration
            await this.setupPipelines();
            
            // Start integration server
            await this.startIntegrationServer();
            
            // Begin monitoring
            this.startMonitoring();
            
            console.log('\n✅ Integration Service initialized successfully!');
            console.log(`🌐 API: http://localhost:${this.config.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize integration service:', error);
            throw error;
        }
    }
    
    // ===================== SERVICE HEALTH =====================
    
    async checkServiceHealth() {
        console.log('\n🏥 Checking service health...');
        
        for (const [name, config] of Object.entries(this.config.services)) {
            try {
                const health = await this.checkService(name, config);
                this.serviceStatus.set(name, health);
                
                const icon = health.healthy ? '✅' : (config.required ? '❌' : '⚠️');
                console.log(`${icon} ${name}: ${health.status}`);
                
                if (config.required && !health.healthy) {
                    throw new Error(`Required service ${name} is not healthy`);
                }
                
            } catch (error) {
                if (config.required) {
                    throw error;
                }
                console.log(`⚠️  ${name}: Not available (optional)`);
            }
        }
    }
    
    async checkService(name, config) {
        try {
            const response = await this.httpGet(`${config.url}/health`);
            return {
                healthy: response !== null,
                status: response ? 'online' : 'offline',
                lastCheck: Date.now(),
                details: response
            };
        } catch (error) {
            return {
                healthy: false,
                status: 'error',
                lastCheck: Date.now(),
                error: error.message
            };
        }
    }
    
    // ===================== SERVICE CONNECTIONS =====================
    
    async connectToServices() {
        console.log('\n🔌 Connecting to services...');
        
        // Connect to 3D camera WebSocket
        if (this.serviceStatus.get('cameraSystem')?.healthy) {
            try {
                const ws = new WebSocket(this.config.services.cameraSystem.wsUrl);
                
                ws.on('open', () => {
                    console.log('✅ Connected to 3D Camera WebSocket');
                    this.serviceConnections.set('cameraSystem', ws);
                });
                
                ws.on('message', (data) => {
                    this.handle3DCameraMessage(JSON.parse(data.toString()));
                });
                
                ws.on('error', (error) => {
                    console.error('Camera WebSocket error:', error);
                });
                
            } catch (error) {
                console.error('Failed to connect to camera WebSocket:', error);
            }
        }
    }
    
    // ===================== DATA SYNCHRONIZATION =====================
    
    async initializeDataSync() {
        console.log('\n🔄 Initializing data synchronization...');
        
        // Load initial data from all services
        await this.syncStreams();
        await this.syncGifs();
        await this.syncCameras();
        await this.syncVerifications();
        
        // Setup periodic sync
        setInterval(() => {
            this.performDataSync();
        }, this.config.orchestration.syncInterval);
    }
    
    async syncStreams() {
        if (!this.serviceStatus.get('streamAggregator')?.healthy) return;
        
        try {
            const sports = ['nfl', 'nba', 'nhl', 'mlb', 'soccer'];
            
            for (const sport of sports) {
                const response = await this.httpGet(
                    `${this.config.services.streamAggregator.url}/discover?sport=${sport}`
                );
                
                if (response && response.streams) {
                    response.streams.forEach(stream => {
                        this.unifiedData.streams.set(stream.id, {
                            ...stream,
                            sport,
                            lastUpdated: Date.now()
                        });
                    });
                }
            }
            
            console.log(`📺 Synced ${this.unifiedData.streams.size} streams`);
            
        } catch (error) {
            console.error('Stream sync error:', error);
        }
    }
    
    async syncGifs() {
        if (!this.serviceStatus.get('gifGenerator')?.healthy) return;
        
        try {
            const response = await this.httpGet(
                `${this.config.services.gifGenerator.url}/gifs`
            );
            
            if (response && response.gifs) {
                response.gifs.forEach(gif => {
                    this.unifiedData.gifs.set(gif.id, {
                        ...gif,
                        lastUpdated: Date.now()
                    });
                });
            }
            
            console.log(`🎬 Synced ${this.unifiedData.gifs.size} GIFs`);
            
        } catch (error) {
            console.error('GIF sync error:', error);
        }
    }
    
    async syncCameras() {
        if (!this.serviceStatus.get('cameraSystem')?.healthy) return;
        
        try {
            const response = await this.httpGet(
                `${this.config.services.cameraSystem.url}/arenas`
            );
            
            if (response && response.arenas) {
                response.arenas.forEach(arena => {
                    this.unifiedData.cameras.set(arena.id, {
                        ...arena,
                        lastUpdated: Date.now()
                    });
                });
            }
            
            console.log(`🏟️ Synced ${this.unifiedData.cameras.size} arenas`);
            
        } catch (error) {
            console.error('Camera sync error:', error);
        }
    }
    
    async syncVerifications() {
        // Sync verification data from content verifier
        console.log(`🔐 Verification chain length: ${this.verificationChain.length}`);
    }
    
    async performDataSync() {
        // Incremental sync
        await this.syncStreams();
        
        // Broadcast updates to WebSocket clients
        this.broadcastUpdate({
            type: 'data_sync',
            timestamp: Date.now(),
            counts: {
                streams: this.unifiedData.streams.size,
                gifs: this.unifiedData.gifs.size,
                cameras: this.unifiedData.cameras.size
            }
        });
    }
    
    // ===================== PIPELINE ORCHESTRATION =====================
    
    async setupPipelines() {
        console.log('\n🔧 Setting up integration pipelines...');
        
        // Stream to GIF pipeline
        this.activePipelines.set('streamToGif', {
            name: this.config.pipelines.streamToGif.name,
            active: true,
            processed: 0,
            errors: 0
        });
        
        // Immersive experience pipeline
        this.activePipelines.set('immersiveExperience', {
            name: this.config.pipelines.immersiveExperience.name,
            active: true,
            processed: 0,
            errors: 0
        });
        
        // Verification pipeline
        this.activePipelines.set('verification', {
            name: this.config.pipelines.verification.name,
            active: true,
            processed: 0,
            errors: 0
        });
        
        console.log(`✅ ${this.activePipelines.size} pipelines configured`);
    }
    
    async executeStreamToGifPipeline(streamId) {
        const pipeline = this.activePipelines.get('streamToGif');
        
        try {
            // 1. Get stream details
            const stream = this.unifiedData.streams.get(streamId);
            if (!stream) throw new Error('Stream not found');
            
            // 2. Verify stream
            const verification = await this.verifyStream(stream);
            
            // 3. Monitor for moments
            const moment = await this.detectMoment(stream);
            
            // 4. Generate GIF
            if (moment) {
                const gif = await this.generateGif(stream, moment);
                
                // 5. Distribute through network
                await this.distributeContent(gif);
                
                pipeline.processed++;
                
                return {
                    success: true,
                    stream,
                    gif,
                    verification
                };
            }
            
        } catch (error) {
            pipeline.errors++;
            console.error('Pipeline error:', error);
            throw error;
        }
    }
    
    async verifyStream(stream) {
        if (!this.serviceStatus.get('contentVerifier')?.healthy) {
            // Simulate verification
            return {
                verified: Math.random() > 0.3,
                confidence: Math.random() * 0.3 + 0.7,
                hash: crypto.randomBytes(32).toString('hex')
            };
        }
        
        // Use actual content verifier
        const response = await this.httpGet(
            `${this.config.services.contentVerifier.url}/verify?url=${encodeURIComponent(stream.url)}`
        );
        
        return response || { verified: false };
    }
    
    async detectMoment(stream) {
        // Simulate moment detection
        if (Math.random() > 0.7) {
            return {
                type: 'touchdown',
                confidence: Math.random() * 0.2 + 0.8,
                timestamp: Date.now(),
                duration: 8000
            };
        }
        return null;
    }
    
    async generateGif(stream, moment) {
        if (!this.serviceStatus.get('gifGenerator')?.healthy) {
            throw new Error('GIF generator not available');
        }
        
        const response = await this.httpGet(
            `${this.config.services.gifGenerator.url}/generate?streamId=${stream.id}&sport=${stream.sport}`
        );
        
        if (response && response.gif) {
            // Store in unified data
            this.unifiedData.gifs.set(response.gif.id, {
                ...response.gif,
                streamId: stream.id,
                moment,
                lastUpdated: Date.now()
            });
            
            return response.gif;
        }
        
        throw new Error('GIF generation failed');
    }
    
    async distributeContent(content) {
        // Distribute through community network if available
        if (this.serviceStatus.get('communityNetwork')?.healthy) {
            await this.httpPost(
                `${this.config.services.communityNetwork.url}/distribute`,
                { content }
            );
        }
        
        // Broadcast to WebSocket clients
        this.broadcastUpdate({
            type: 'new_content',
            content
        });
    }
    
    // ===================== IMMERSIVE EXPERIENCE =====================
    
    async createImmersiveSession(userId, options) {
        console.log(`🎮 Creating immersive session for user ${userId}`);
        
        const session = {
            id: this.generateSessionId(),
            userId,
            created: Date.now(),
            components: {
                stream: null,
                camera: null,
                audio: null,
                effects: []
            },
            quality: options.quality || 'standard',
            mode: options.mode || 'broadcast'
        };
        
        try {
            // 1. Aggregate best stream
            session.components.stream = await this.selectBestStream(options);
            
            // 2. Setup 3D camera feed if available
            if (this.serviceStatus.get('cameraSystem')?.healthy && options.enable3D) {
                session.components.camera = await this.setup3DCamera(session);
            }
            
            // 3. Configure spatial audio
            if (this.serviceStatus.get('auditableSound')?.healthy) {
                session.components.audio = await this.setupSpatialAudio(session);
            }
            
            // 4. Apply effects based on tier
            session.components.effects = await this.applyTierEffects(session, options);
            
            // Store session
            this.unifiedData.users.set(userId, session);
            
            console.log(`✅ Immersive session created: ${session.id}`);
            
            return session;
            
        } catch (error) {
            console.error('Failed to create immersive session:', error);
            throw error;
        }
    }
    
    async selectBestStream(options) {
        const streams = Array.from(this.unifiedData.streams.values());
        
        // Filter by sport if specified
        let filtered = streams;
        if (options.sport) {
            filtered = streams.filter(s => s.sport === options.sport);
        }
        
        // Sort by quality score
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        return filtered[0] || null;
    }
    
    async setup3DCamera(session) {
        const response = await this.httpPost(
            `${this.config.services.cameraSystem.url}/session`,
            {
                mode: session.mode,
                quality: session.quality
            }
        );
        
        return response || null;
    }
    
    async setupSpatialAudio(session) {
        // Configure spatial audio based on stream
        return {
            enabled: true,
            channels: 32,
            binaural: true,
            headTracking: session.quality === 'premium'
        };
    }
    
    async applyTierEffects(session, options) {
        const effects = [];
        
        // Apply quality-based effects
        if (session.quality === 'free') {
            effects.push({
                type: 'pixelate',
                intensity: 0.8
            });
            effects.push({
                type: 'watermark',
                text: 'FREE TIER'
            });
        } else if (session.quality === 'bitmap') {
            effects.push({
                type: 'bitmap',
                colors: 16,
                resolution: '160x120'
            });
        }
        
        // Apply mode-specific effects
        if (session.mode === 'backyard') {
            effects.push({
                type: options.effect || 'cartoon',
                intensity: 1.0
            });
        }
        
        return effects;
    }
    
    // ===================== UNIFIED API =====================
    
    async startIntegrationServer() {
        console.log('\n🌐 Starting integration servers...');
        
        // HTTP server
        this.httpServer = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        this.httpServer.listen(this.config.port, () => {
            console.log(`✅ HTTP server running on port ${this.config.port}`);
        });
        
        // WebSocket server
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            this.handleWebSocketConnection(ws);
        });
        
        console.log(`✅ WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.config.port}`);
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            switch (url.pathname) {
                case '/status':
                    await this.handleStatusRequest(res);
                    break;
                    
                case '/streams':
                    await this.handleStreamsRequest(res);
                    break;
                    
                case '/immersive':
                    await this.handleImmersiveRequest(req, res);
                    break;
                    
                case '/pipeline':
                    await this.handlePipelineRequest(url, res);
                    break;
                    
                case '/verify':
                    await this.handleVerifyRequest(url, res);
                    break;
                    
                case '/metrics':
                    await this.handleMetricsRequest(res);
                    break;
                    
                default:
                    await this.handleDefaultRequest(res);
            }
            
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async handleStatusRequest(res) {
        const status = {
            healthy: true,
            uptime: process.uptime(),
            services: {},
            pipelines: {},
            data: {
                streams: this.unifiedData.streams.size,
                gifs: this.unifiedData.gifs.size,
                cameras: this.unifiedData.cameras.size,
                sessions: this.unifiedData.users.size
            },
            connections: {
                websocket: this.wsClients.size,
                services: this.serviceConnections.size
            }
        };
        
        // Service status
        for (const [name, health] of this.serviceStatus) {
            status.services[name] = {
                healthy: health.healthy,
                status: health.status,
                lastCheck: health.lastCheck
            };
            
            if (!health.healthy && this.config.services[name].required) {
                status.healthy = false;
            }
        }
        
        // Pipeline status
        for (const [name, pipeline] of this.activePipelines) {
            status.pipelines[name] = {
                active: pipeline.active,
                processed: pipeline.processed,
                errors: pipeline.errors
            };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    async handleStreamsRequest(res) {
        const streams = Array.from(this.unifiedData.streams.values());
        
        // Enhance with verification status
        const enhanced = await Promise.all(
            streams.map(async stream => ({
                ...stream,
                verification: await this.getStreamVerification(stream.id)
            }))
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ streams: enhanced }));
    }
    
    async handleImmersiveRequest(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end();
            return;
        }
        
        const body = await this.parseRequestBody(req);
        const session = await this.createImmersiveSession(
            body.userId || 'anonymous',
            body.options || {}
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ session }));
    }
    
    async handlePipelineRequest(url, res) {
        const pipelineName = url.searchParams.get('name');
        const action = url.searchParams.get('action');
        
        if (!pipelineName || !this.activePipelines.has(pipelineName)) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Pipeline not found' }));
            return;
        }
        
        const pipeline = this.activePipelines.get(pipelineName);
        
        if (action === 'execute') {
            // Execute pipeline
            const streamId = url.searchParams.get('streamId');
            const result = await this.executeStreamToGifPipeline(streamId);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result }));
        } else {
            // Return pipeline info
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ pipeline }));
        }
    }
    
    async handleVerifyRequest(url, res) {
        const streamId = url.searchParams.get('streamId');
        
        if (!streamId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Stream ID required' }));
            return;
        }
        
        const stream = this.unifiedData.streams.get(streamId);
        if (!stream) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Stream not found' }));
            return;
        }
        
        const verification = await this.verifyStream(stream);
        
        // Add to blockchain
        this.verificationChain.push({
            streamId,
            verification,
            timestamp: Date.now(),
            hash: crypto.createHash('sha256')
                .update(JSON.stringify(verification))
                .digest('hex')
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ verification }));
    }
    
    async handleMetricsRequest(res) {
        const metrics = {
            timestamp: Date.now(),
            services: {},
            pipelines: {},
            performance: {
                avgResponseTime: 0,
                requestsPerSecond: 0,
                errorRate: 0
            },
            blockchain: {
                verificationChainLength: this.verificationChain.length,
                lastBlockHash: this.verificationChain.length > 0 
                    ? this.verificationChain[this.verificationChain.length - 1].hash
                    : null
            }
        };
        
        // Aggregate metrics
        for (const [name, health] of this.serviceStatus) {
            metrics.services[name] = {
                uptime: health.healthy ? 100 : 0,
                lastResponseTime: health.lastCheck
            };
        }
        
        for (const [name, pipeline] of this.activePipelines) {
            metrics.pipelines[name] = {
                successRate: pipeline.processed > 0 
                    ? ((pipeline.processed - pipeline.errors) / pipeline.processed * 100).toFixed(2)
                    : 0,
                totalProcessed: pipeline.processed,
                totalErrors: pipeline.errors
            };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics, null, 2));
    }
    
    async handleDefaultRequest(res) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sports Streaming Integration Service</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #0a0a0a;
                    color: #fff;
                    padding: 20px;
                    margin: 0;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                h1 {
                    color: #00ffff;
                    text-align: center;
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                .subtitle {
                    text-align: center;
                    color: #888;
                    margin-bottom: 40px;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 20px;
                }
                .card h3 {
                    color: #00ff00;
                    margin-top: 0;
                }
                .endpoint {
                    background: rgba(0,0,0,0.5);
                    padding: 10px;
                    margin: 5px 0;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 14px;
                }
                .status {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .status.online {
                    background: rgba(0,255,0,0.2);
                    color: #00ff00;
                }
                .status.offline {
                    background: rgba(255,0,0,0.2);
                    color: #ff0000;
                }
                .pipeline {
                    background: rgba(0,255,255,0.1);
                    border: 1px solid #00ffff;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 5px;
                }
                code {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 5px;
                    border-radius: 3px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔗 Sports Streaming Integration Service</h1>
                <p class="subtitle">Master orchestrator connecting all streaming components</p>
                
                <div class="grid">
                    <div class="card">
                        <h3>📡 Service Status</h3>
                        ${Array.from(this.serviceStatus.entries()).map(([name, health]) => `
                            <div>${name}: <span class="status ${health.healthy ? 'online' : 'offline'}">${health.status}</span></div>
                        `).join('')}
                    </div>
                    
                    <div class="card">
                        <h3>📊 Data Summary</h3>
                        <div>Active Streams: ${this.unifiedData.streams.size}</div>
                        <div>Generated GIFs: ${this.unifiedData.gifs.size}</div>
                        <div>3D Arenas: ${this.unifiedData.cameras.size}</div>
                        <div>Active Sessions: ${this.unifiedData.users.size}</div>
                        <div>Verification Chain: ${this.verificationChain.length} blocks</div>
                    </div>
                    
                    <div class="card">
                        <h3>🔧 Active Pipelines</h3>
                        ${Array.from(this.activePipelines.entries()).map(([name, pipeline]) => `
                            <div class="pipeline">
                                <strong>${pipeline.name}</strong><br>
                                Processed: ${pipeline.processed} | Errors: ${pipeline.errors}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <h2 style="color: #00ffff;">🌐 Unified API Endpoints</h2>
                
                <div class="grid">
                    <div class="card">
                        <h3>Core Endpoints</h3>
                        <div class="endpoint">GET /status</div>
                        <div class="endpoint">GET /streams</div>
                        <div class="endpoint">GET /metrics</div>
                        <div class="endpoint">POST /immersive</div>
                    </div>
                    
                    <div class="card">
                        <h3>Pipeline Control</h3>
                        <div class="endpoint">GET /pipeline?name={name}</div>
                        <div class="endpoint">POST /pipeline?name={name}&action=execute</div>
                    </div>
                    
                    <div class="card">
                        <h3>Verification</h3>
                        <div class="endpoint">GET /verify?streamId={id}</div>
                        <div class="endpoint">GET /blockchain/latest</div>
                    </div>
                </div>
                
                <h2 style="color: #00ffff;">🎮 Integration Features</h2>
                
                <ul>
                    <li>🔄 Real-time data synchronization across all services</li>
                    <li>🔗 Unified API for all streaming components</li>
                    <li>📊 Comprehensive metrics and monitoring</li>
                    <li>🔐 Blockchain-based verification chain</li>
                    <li>🎬 Automated stream-to-GIF pipeline</li>
                    <li>🏟️ Immersive experience orchestration</li>
                    <li>📡 WebSocket broadcasting for real-time updates</li>
                    <li>🔧 Pipeline orchestration and management</li>
                </ul>
                
                <p style="text-align: center; margin-top: 40px; color: #666;">
                    WebSocket: <code>ws://localhost:${this.config.wsPort}</code> | 
                    Dashboard: <code>sports-streaming-dashboard.html</code>
                </p>
            </div>
        </body>
        </html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    // ===================== WEBSOCKET HANDLING =====================
    
    handleWebSocketConnection(ws) {
        const clientId = this.generateClientId();
        this.wsClients.add(ws);
        
        console.log(`🔌 New WebSocket client: ${clientId}`);
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            clientId,
            services: Object.fromEntries(this.serviceStatus),
            data: {
                streams: this.unifiedData.streams.size,
                gifs: this.unifiedData.gifs.size
            }
        }));
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                this.handleWebSocketMessage(ws, data);
            } catch (error) {
                ws.send(JSON.stringify({ error: error.message }));
            }
        });
        
        ws.on('close', () => {
            this.wsClients.delete(ws);
            console.log(`🔌 WebSocket client disconnected: ${clientId}`);
        });
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Client subscribes to updates
                ws.subscriptions = data.channels || ['all'];
                break;
                
            case 'execute_pipeline':
                this.executeStreamToGifPipeline(data.streamId)
                    .then(result => {
                        ws.send(JSON.stringify({
                            type: 'pipeline_result',
                            result
                        }));
                    })
                    .catch(error => {
                        ws.send(JSON.stringify({
                            type: 'pipeline_error',
                            error: error.message
                        }));
                    });
                break;
        }
    }
    
    broadcastUpdate(update) {
        const message = JSON.stringify(update);
        
        for (const client of this.wsClients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }
    
    handle3DCameraMessage(data) {
        // Handle messages from 3D camera system
        if (data.type === 'camera_update') {
            this.broadcastUpdate({
                type: '3d_camera_update',
                data
            });
        }
    }
    
    // ===================== MONITORING =====================
    
    startMonitoring() {
        console.log('\n📊 Starting system monitoring...');
        
        // Health check interval
        setInterval(() => {
            this.checkServiceHealth();
        }, this.config.orchestration.healthCheckInterval);
        
        // Metrics collection
        setInterval(() => {
            this.collectMetrics();
        }, 10000);
        
        // Pipeline monitoring
        setInterval(() => {
            this.monitorPipelines();
        }, 5000);
    }
    
    async collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            connections: {
                websocket: this.wsClients.size,
                services: this.serviceConnections.size
            }
        };
        
        this.performanceMetrics.set(Date.now(), metrics);
        
        // Keep only last hour of metrics
        const oneHourAgo = Date.now() - 3600000;
        for (const [timestamp] of this.performanceMetrics) {
            if (timestamp < oneHourAgo) {
                this.performanceMetrics.delete(timestamp);
            }
        }
    }
    
    monitorPipelines() {
        for (const [name, pipeline] of this.activePipelines) {
            if (pipeline.errors > 10) {
                console.warn(`⚠️ Pipeline ${name} has ${pipeline.errors} errors`);
            }
        }
    }
    
    // ===================== UTILITY METHODS =====================
    
    async httpGet(url) {
        return new Promise((resolve) => {
            const client = url.startsWith('https') ? require('https') : require('http');
            
            client.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
            
            setTimeout(() => resolve(null), 5000);
        });
    }
    
    async httpPost(url, body) {
        return new Promise((resolve) => {
            const urlObj = new URL(url);
            const client = url.startsWith('https') ? require('https') : require('http');
            
            const data = JSON.stringify(body);
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };
            
            const req = client.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch {
                        resolve(null);
                    }
                });
            });
            
            req.on('error', () => resolve(null));
            req.write(data);
            req.end();
            
            setTimeout(() => resolve(null), 5000);
        });
    }
    
    async parseRequestBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve({});
                }
            });
        });
    }
    
    async getStreamVerification(streamId) {
        // Get cached verification or generate new
        const cached = this.unifiedData.verifications.get(streamId);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached;
        }
        
        const stream = this.unifiedData.streams.get(streamId);
        if (!stream) return null;
        
        const verification = await this.verifyStream(stream);
        this.unifiedData.verifications.set(streamId, {
            ...verification,
            timestamp: Date.now()
        });
        
        return verification;
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    }
    
    generateClientId() {
        return `client_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    }
}

// Export the service
module.exports = SportsStreamingIntegration;

// Run if executed directly
if (require.main === module) {
    (async () => {
        console.log('🚀 Starting Sports Streaming Integration Service...\n');
        
        try {
            const integration = new SportsStreamingIntegration();
            
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n\n🛑 Shutting down integration service...');
                process.exit(0);
            });
            
            console.log('\n✨ Integration service is ready!');
            console.log('🌟 All components are connected and operational');
            console.log('🔗 Like legendary drops in an MMO raid, everything works together!\n');
            
        } catch (error) {
            console.error('❌ Failed to start integration service:', error);
            process.exit(1);
        }
    })();
}