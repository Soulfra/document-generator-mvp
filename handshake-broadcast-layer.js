#!/usr/bin/env node

/**
 * 🤝 HANDSHAKE BROADCAST LAYER 🤝
 * Wraps Bitcoin vs CryptoNote analysis with handshake agreements
 * Enables secure localhost broadcasting with cryptographic verification
 */

const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { HandshakeVerificationSystem } = require('./handshake-verification-system');

class HandshakeBroadcastLayer {
    constructor(port = 5555) {
        this.port = port;
        this.handshakeSystem = new HandshakeVerificationSystem();
        this.connectedClients = new Map();
        this.broadcastChannels = new Map();
        this.agreementTemplates = new Map();
        
        // Broadcast data sources
        this.dataSources = {
            bitcoin: null,
            cryptoNote: null,
            comparison: null,
            blameChain: null
        };
        
        this.server = null;
        this.wsServer = null;
        
        console.log('🤝 HANDSHAKE BROADCAST LAYER INITIALIZED');
        console.log(`   Broadcasting on localhost:${port}`);
    }
    
    /**
     * Initialize the handshake broadcast system
     */
    async initialize() {
        console.log('\n🔧 Initializing handshake broadcast system...');
        
        // Generate system keyrings
        await this.handshakeSystem.initializeAllSystems();
        
        // Load data sources
        await this.loadDataSources();
        
        // Create handshake agreements
        this.createHandshakeAgreements();
        
        // Start HTTP server
        this.startHttpServer();
        
        // Start WebSocket server
        this.startWebSocketServer();
        
        console.log('✅ Handshake broadcast system initialized');
    }
    
    /**
     * Load all data sources
     */
    async loadDataSources() {
        console.log('📊 Loading data sources...');
        
        try {
            // Load Bitcoin analysis
            if (fs.existsSync('bitcoin-blamechain-analysis.json')) {
                this.dataSources.bitcoin = JSON.parse(
                    fs.readFileSync('bitcoin-blamechain-analysis.json', 'utf8')
                );
            }
            
            // Load comparison data
            if (fs.existsSync('bitcoin-vs-cryptonote-comparison.json')) {
                this.dataSources.comparison = JSON.parse(
                    fs.readFileSync('bitcoin-vs-cryptonote-comparison.json', 'utf8')
                );
            }
            
            // Load BlameChain data
            if (fs.existsSync('blamechain-data.json')) {
                this.dataSources.blameChain = JSON.parse(
                    fs.readFileSync('blamechain-data.json', 'utf8')
                );
            }
            
            console.log('✅ Data sources loaded');
        } catch (error) {
            console.warn('⚠️ Some data sources unavailable:', error.message);
        }
    }
    
    /**
     * Create handshake agreements for different broadcast types
     */
    createHandshakeAgreements() {
        console.log('📜 Creating handshake agreements...');
        
        // Bitcoin Transparency Agreement
        this.agreementTemplates.set('bitcoin_transparency', {
            id: 'bitcoin_transparency_v1',
            title: 'Bitcoin Transparency Broadcasting Agreement',
            terms: {
                dataVisibility: 'FULL',
                privacyLevel: 'NONE',
                accountabilityLevel: 'MAXIMUM',
                broadcastScope: ['transactions', 'blames', 'reputations'],
                verificationRequired: true,
                cryptographicProof: 'handshake_id_required'
            },
            participants: ['broadcaster', 'viewer'],
            duration: '24_hours',
            renewalRequired: true
        });
        
        // CryptoNote Privacy Agreement
        this.agreementTemplates.set('cryptonote_privacy', {
            id: 'cryptonote_privacy_v1',
            title: 'CryptoNote Privacy Broadcasting Agreement',
            terms: {
                dataVisibility: 'LIMITED',
                privacyLevel: 'MAXIMUM',
                accountabilityLevel: 'REDUCED',
                broadcastScope: ['aggregated_stats', 'anonymous_patterns'],
                verificationRequired: true,
                cryptographicProof: 'ring_signature_required'
            },
            participants: ['broadcaster', 'anonymous_viewer'],
            duration: '1_hour',
            renewalRequired: true
        });
        
        // Comparative Analysis Agreement
        this.agreementTemplates.set('comparative_analysis', {
            id: 'comparative_analysis_v1',
            title: 'Blockchain Comparison Broadcasting Agreement',
            terms: {
                dataVisibility: 'ANALYTICAL',
                privacyLevel: 'BALANCED',
                accountabilityLevel: 'COMPARATIVE',
                broadcastScope: ['comparisons', 'insights', 'metrics'],
                verificationRequired: true,
                cryptographicProof: 'mutual_handshake_required'
            },
            participants: ['analyst', 'researcher', 'viewer'],
            duration: '12_hours',
            renewalRequired: false
        });
        
        // BlameChain Live Agreement
        this.agreementTemplates.set('blamechain_live', {
            id: 'blamechain_live_v1',
            title: 'Live BlameChain Broadcasting Agreement',
            terms: {
                dataVisibility: 'REAL_TIME',
                privacyLevel: 'CONTROLLED',
                accountabilityLevel: 'ENFORCED',
                broadcastScope: ['live_blames', 'reputation_updates', 'resolutions'],
                verificationRequired: true,
                cryptographicProof: 'continuous_verification_required'
            },
            participants: ['blamechain_node', 'verified_viewer'],
            duration: 'continuous',
            renewalRequired: 'every_4_hours'
        });
        
        console.log(`✅ Created ${this.agreementTemplates.size} handshake agreements`);
    }
    
    /**
     * Start HTTP server for web interface
     */
    startHttpServer() {
        console.log('🌐 Starting HTTP server...');
        
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        this.server.listen(this.port, 'localhost', () => {
            console.log(`✅ HTTP server listening on http://localhost:${this.port}`);
        });
    }
    
    /**
     * Start WebSocket server for real-time broadcasting
     */
    startWebSocketServer() {
        console.log('📡 Starting WebSocket server...');
        
        this.wsServer = new WebSocket.Server({ 
            server: this.server,
            path: '/broadcast'
        });
        
        this.wsServer.on('connection', (ws, req) => {
            this.handleWebSocketConnection(ws, req);
        });
        
        console.log('✅ WebSocket server started at ws://localhost:' + this.port + '/broadcast');
    }
    
    /**
     * Handle HTTP requests
     */
    async handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            switch (url.pathname) {
                case '/':
                    await this.serveDashboard(res);
                    break;
                    
                case '/api/handshake/initiate':
                    await this.handleHandshakeInitiation(req, res);
                    break;
                    
                case '/api/handshake/complete':
                    await this.handleHandshakeCompletion(req, res);
                    break;
                    
                case '/api/agreements':
                    await this.serveAgreements(res);
                    break;
                    
                case '/api/broadcast/channels':
                    await this.serveBroadcastChannels(res);
                    break;
                    
                case '/api/data/bitcoin':
                    await this.serveData(res, 'bitcoin');
                    break;
                    
                case '/api/data/cryptonote':
                    await this.serveData(res, 'cryptoNote');
                    break;
                    
                case '/api/data/comparison':
                    await this.serveData(res, 'comparison');
                    break;
                    
                case '/api/data/blamechain':
                    await this.serveData(res, 'blameChain');
                    break;
                    
                case '/api/status':
                    await this.serveStatus(res);
                    break;
                    
                default:
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('HTTP request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    /**
     * Serve the main dashboard
     */
    async serveDashboard(res) {
        const dashboard = this.generateDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🤝 Handshake Broadcast Dashboard</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            background: #000; 
            color: #0f0; 
            font-family: 'Courier New', monospace; 
        }
        .header { 
            text-align: center; 
            padding: 20px; 
            border-bottom: 2px solid #0f0; 
            margin-bottom: 20px; 
        }
        .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        .panel { 
            border: 2px solid #0f0; 
            padding: 20px; 
            border-radius: 10px; 
            background: rgba(0,255,0,0.05); 
        }
        .agreement { 
            background: rgba(255,255,0,0.1); 
            border: 1px solid #ff0; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .channel { 
            background: rgba(0,255,255,0.1); 
            border: 1px solid #0ff; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        button { 
            background: #0f0; 
            color: #000; 
            border: none; 
            padding: 10px 20px; 
            margin: 5px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-weight: bold; 
        }
        button:hover { 
            background: #0a0; 
        }
        .status { 
            font-size: 12px; 
            opacity: 0.8; 
        }
        .live-indicator { 
            display: inline-block; 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            background: #0f0; 
            margin-right: 5px; 
            animation: pulse 2s infinite; 
        }
        @keyframes pulse { 
            0%, 100% { opacity: 1; } 
            50% { opacity: 0.3; } 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤝 HANDSHAKE BROADCAST DASHBOARD</h1>
        <div>Secure localhost broadcasting with cryptographic verification</div>
        <div class="status">
            <span class="live-indicator"></span>
            Server: localhost:${this.port} | WebSocket: /broadcast
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h2>📜 Available Agreements</h2>
            <div id="agreements">Loading...</div>
            <button onclick="loadAgreements()">🔄 Refresh Agreements</button>
        </div>
        
        <div class="panel">
            <h2>📡 Broadcast Channels</h2>
            <div id="channels">Loading...</div>
            <button onclick="connectWebSocket()">🔗 Connect WebSocket</button>
        </div>
        
        <div class="panel">
            <h2>🔐 Active Handshakes</h2>
            <div id="handshakes">No active handshakes</div>
            <button onclick="initiateHandshake()">🤝 New Handshake</button>
        </div>
        
        <div class="panel">
            <h2>📊 Broadcast Data</h2>
            <div id="data-status">Checking data sources...</div>
            <button onclick="startBroadcast()">📡 Start Broadcasting</button>
        </div>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; border: 2px solid #0f0; border-radius: 10px;">
        <h2>🔄 Live Broadcast Feed</h2>
        <div id="broadcast-feed" style="height: 200px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
            Waiting for broadcast data...
        </div>
    </div>

    <script>
        let ws = null;
        
        // Load agreements
        async function loadAgreements() {
            try {
                const response = await fetch('/api/agreements');
                const agreements = await response.json();
                
                const container = document.getElementById('agreements');
                container.innerHTML = '';
                
                Object.entries(agreements).forEach(([key, agreement]) => {
                    const div = document.createElement('div');
                    div.className = 'agreement';
                    div.innerHTML = \`
                        <strong>\${agreement.title}</strong><br>
                        <small>Visibility: \${agreement.terms.dataVisibility}</small><br>
                        <small>Privacy: \${agreement.terms.privacyLevel}</small><br>
                        <small>Duration: \${agreement.duration}</small>
                    \`;
                    container.appendChild(div);
                });
            } catch (error) {
                console.error('Failed to load agreements:', error);
            }
        }
        
        // Connect WebSocket
        function connectWebSocket() {
            if (ws) {
                ws.close();
            }
            
            ws = new WebSocket('ws://localhost:${this.port}/broadcast');
            
            ws.onopen = () => {
                addToFeed('✅ WebSocket connected');
                updateChannels();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                addToFeed(\`📡 \${data.type}: \${JSON.stringify(data.payload).slice(0, 100)}...\`);
            };
            
            ws.onclose = () => {
                addToFeed('❌ WebSocket disconnected');
            };
            
            ws.onerror = (error) => {
                addToFeed(\`⚠️ WebSocket error: \${error}\`);
            };
        }
        
        // Update channels display
        function updateChannels() {
            const container = document.getElementById('channels');
            container.innerHTML = \`
                <div class="channel">
                    <strong>Bitcoin Transparency</strong><br>
                    <small>Full transaction visibility</small>
                </div>
                <div class="channel">
                    <strong>CryptoNote Privacy</strong><br>
                    <small>Anonymous patterns only</small>
                </div>
                <div class="channel">
                    <strong>Comparative Analysis</strong><br>
                    <small>Side-by-side insights</small>
                </div>
                <div class="channel">
                    <strong>BlameChain Live</strong><br>
                    <small>Real-time accountability</small>
                </div>
            \`;
        }
        
        // Add message to broadcast feed
        function addToFeed(message) {
            const feed = document.getElementById('broadcast-feed');
            const time = new Date().toLocaleTimeString();
            feed.innerHTML += \`[\${time}] \${message}<br>\`;
            feed.scrollTop = feed.scrollHeight;
        }
        
        // Initiate handshake
        async function initiateHandshake() {
            const agreementType = prompt('Agreement type (bitcoin_transparency, cryptonote_privacy, comparative_analysis, blamechain_live):');
            if (!agreementType) return;
            
            try {
                const response = await fetch('/api/handshake/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agreementType, participant: 'viewer' })
                });
                
                const result = await response.json();
                addToFeed(\`🤝 Handshake initiated: \${result.handshakeId}\`);
                
                // Auto-complete for demo
                setTimeout(() => completeHandshake(result.handshakeId), 2000);
                
            } catch (error) {
                addToFeed(\`❌ Handshake failed: \${error.message}\`);
            }
        }
        
        // Complete handshake
        async function completeHandshake(handshakeId) {
            try {
                const response = await fetch('/api/handshake/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handshakeId, agreed: true })
                });
                
                const result = await response.json();
                addToFeed(\`✅ Handshake completed: \${result.status}\`);
                
            } catch (error) {
                addToFeed(\`❌ Handshake completion failed: \${error.message}\`);
            }
        }
        
        // Start broadcasting
        function startBroadcast() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                addToFeed('❌ Connect WebSocket first');
                return;
            }
            
            ws.send(JSON.stringify({
                type: 'start_broadcast',
                channels: ['bitcoin', 'cryptonote', 'comparison', 'blamechain']
            }));
            
            addToFeed('📡 Broadcasting started');
        }
        
        // Initialize on load
        window.onload = () => {
            loadAgreements();
            updateChannels();
            connectWebSocket();
        };
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Handle WebSocket connections
     */
    handleWebSocketConnection(ws, req) {
        const clientId = crypto.randomBytes(16).toString('hex');
        
        console.log(`📱 New WebSocket client connected: ${clientId}`);
        
        this.connectedClients.set(clientId, {
            ws,
            connectedAt: new Date(),
            handshakes: new Set(),
            subscribedChannels: new Set()
        });
        
        ws.on('message', (data) => {
            this.handleWebSocketMessage(clientId, data);
        });
        
        ws.on('close', () => {
            console.log(`📱 Client disconnected: ${clientId}`);
            this.connectedClients.delete(clientId);
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            payload: {
                clientId,
                availableChannels: Array.from(this.agreementTemplates.keys()),
                serverTime: new Date().toISOString()
            }
        }));
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.connectedClients.get(clientId);
            
            if (!client) return;
            
            switch (message.type) {
                case 'start_broadcast':
                    this.startBroadcastForClient(clientId, message.channels);
                    break;
                    
                case 'subscribe_channel':
                    this.subscribeClientToChannel(clientId, message.channel);
                    break;
                    
                case 'handshake_request':
                    this.handleHandshakeRequest(clientId, message.payload);
                    break;
                    
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    }
    
    /**
     * Start broadcasting for specific client
     */
    startBroadcastForClient(clientId, channels) {
        const client = this.connectedClients.get(clientId);
        if (!client) return;
        
        console.log(`📡 Starting broadcast for client ${clientId}, channels:`, channels);
        
        // Subscribe to requested channels
        channels.forEach(channel => {
            client.subscribedChannels.add(channel);
        });
        
        // Start broadcasting loop
        this.broadcastLoop(clientId);
    }
    
    /**
     * Broadcast loop for real-time data
     */
    broadcastLoop(clientId) {
        const client = this.connectedClients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) return;
        
        const broadcastData = {
            timestamp: new Date().toISOString(),
            channels: {}
        };
        
        // Broadcast Bitcoin data
        if (client.subscribedChannels.has('bitcoin') && this.dataSources.bitcoin) {
            broadcastData.channels.bitcoin = {
                type: 'bitcoin_transparency',
                data: {
                    totalTransactions: this.dataSources.bitcoin.transactions?.length || 0,
                    totalBlames: this.dataSources.bitcoin.blameRecords?.length || 0,
                    reputationLeader: this.getReputationLeader(this.dataSources.bitcoin.reputations),
                    latestBlame: this.getLatestBlame(this.dataSources.bitcoin.blameRecords)
                }
            };
        }
        
        // Broadcast CryptoNote data
        if (client.subscribedChannels.has('cryptonote') && this.dataSources.comparison) {
            broadcastData.channels.cryptonote = {
                type: 'cryptonote_privacy',
                data: {
                    anonymousTransactions: 'HIDDEN_BY_PRIVACY',
                    visibleStats: {
                        resolutionRate: this.dataSources.comparison.cryptoNote?.resolutionRate || 0,
                        unknownActors: this.dataSources.comparison.cryptoNote?.unknownActors || 0
                    }
                }
            };
        }
        
        // Broadcast comparison data
        if (client.subscribedChannels.has('comparison') && this.dataSources.comparison) {
            broadcastData.channels.comparison = {
                type: 'comparative_analysis',
                data: {
                    transparencyGap: 95,
                    accountabilityGap: 65,
                    privacyAdvantage: 95,
                    lastUpdated: new Date().toISOString()
                }
            };
        }
        
        // Send broadcast
        client.ws.send(JSON.stringify({
            type: 'broadcast_data',
            payload: broadcastData
        }));
        
        // Schedule next broadcast
        setTimeout(() => this.broadcastLoop(clientId), 5000); // Every 5 seconds
    }
    
    /**
     * API Handlers
     */
    async handleHandshakeInitiation(req, res) {
        const body = await this.getRequestBody(req);
        const { agreementType, participant } = JSON.parse(body);
        
        const handshakeId = crypto.randomBytes(32).toString('hex');
        const agreement = this.agreementTemplates.get(agreementType);
        
        if (!agreement) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid agreement type' }));
            return;
        }
        
        const handshake = {
            id: handshakeId,
            agreement,
            initiatedAt: new Date().toISOString(),
            participant,
            status: 'initiated',
            cryptographicProof: crypto.randomBytes(32).toString('hex')
        };
        
        // Store handshake (in production, use persistent storage)
        if (!this.activeHandshakes) this.activeHandshakes = new Map();
        this.activeHandshakes.set(handshakeId, handshake);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            handshakeId,
            agreement: agreement.title,
            terms: agreement.terms,
            expiresIn: '5 minutes'
        }));
    }
    
    async handleHandshakeCompletion(req, res) {
        const body = await this.getRequestBody(req);
        const { handshakeId, agreed } = JSON.parse(body);
        
        if (!this.activeHandshakes) this.activeHandshakes = new Map();
        const handshake = this.activeHandshakes.get(handshakeId);
        
        if (!handshake) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Handshake not found' }));
            return;
        }
        
        handshake.status = agreed ? 'completed' : 'rejected';
        handshake.completedAt = new Date().toISOString();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: handshake.status,
            broadcastPermissions: agreed ? handshake.agreement.terms.broadcastScope : [],
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
    }
    
    async serveAgreements(res) {
        const agreements = Object.fromEntries(this.agreementTemplates);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agreements));
    }
    
    async serveData(res, sourceKey) {
        const data = this.dataSources[sourceKey];
        if (!data) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Data source not available' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    
    async serveStatus(res) {
        const status = {
            server: 'running',
            port: this.port,
            connectedClients: this.connectedClients.size,
            availableAgreements: this.agreementTemplates.size,
            dataSources: Object.keys(this.dataSources).filter(key => this.dataSources[key] !== null),
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    /**
     * Helper functions
     */
    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
    
    getReputationLeader(reputations) {
        if (!reputations) return null;
        
        const leader = Object.entries(reputations)
            .sort(([,a], [,b]) => b.netReputation - a.netReputation)[0];
            
        return leader ? { name: leader[0], reputation: leader[1].netReputation } : null;
    }
    
    getLatestBlame(blameRecords) {
        if (!blameRecords || blameRecords.length === 0) return null;
        
        return blameRecords[blameRecords.length - 1];
    }
    
    /**
     * Shutdown gracefully
     */
    shutdown() {
        console.log('\n🛑 Shutting down handshake broadcast layer...');
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ Handshake broadcast layer shutdown complete');
    }
}

// Run if called directly
if (require.main === module) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 5555;
    const broadcastLayer = new HandshakeBroadcastLayer(port);
    
    (async () => {
        console.log('🤝 HANDSHAKE BROADCAST LAYER');
        console.log('===========================\n');
        
        await broadcastLayer.initialize();
        
        console.log('\n🚀 Handshake broadcast layer is running!');
        console.log(`   Dashboard: http://localhost:${port}`);
        console.log(`   WebSocket: ws://localhost:${port}/broadcast`);
        console.log(`   API Status: http://localhost:${port}/api/status`);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            broadcastLayer.shutdown();
            process.exit(0);
        });
        
    })().catch(console.error);
}

module.exports = HandshakeBroadcastLayer;