#!/usr/bin/env node
/**
 * 🛡️📡 CAL GUARDIAN PROOF API
 * Real-time proof system with cryptographic signatures for Guardian decisions
 * Provides verifiable proof that the Guardian system is working with real data
 */

const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');
const CalGuardianDatabaseAdapter = require('./CAL-GUARDIAN-DATABASE-ADAPTER.js');

class CalGuardianProofAPI {
    constructor(config = {}) {
        this.config = {
            port: process.env.GUARDIAN_PROOF_PORT || 9450,
            wsPort: process.env.GUARDIAN_PROOF_WS_PORT || 9451,
            dbAdapter: null,
            signingKey: null,
            publicKey: null,
            chainFile: './.guardian-proof-chain.json',
            ...config
        };
        
        // Proof chain state
        this.proofChain = [];
        this.genesisBlock = null;
        this.currentBlock = null;
        
        // Real-time metrics
        this.metrics = {
            totalProofs: 0,
            totalApprovals: 0,
            totalRejections: 0,
            totalCorrections: 0,
            averageResponseTime: 0,
            accuracyRate: 0,
            startTime: new Date(),
            lastProofTime: null
        };
        
        // WebSocket connections for streaming
        this.wsConnections = new Map();
        
        console.log('🛡️📡 Guardian Proof API initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Generate or load cryptographic keys
            await this.initializeCryptography();
            
            // Initialize database adapter
            this.config.dbAdapter = new CalGuardianDatabaseAdapter();
            await this.waitForAdapter();
            
            // Load existing proof chain
            await this.loadProofChain();
            
            // Start HTTP API server
            this.startHttpServer();
            
            // Start WebSocket streaming server
            this.startWebSocketServer();
            
            // Subscribe to Guardian events
            this.subscribeToGuardianEvents();
            
            console.log('✅ Guardian Proof API initialized');
            console.log(`🔑 Public Key: ${this.config.publicKey.substring(0, 64)}...`);
            console.log(`📊 API: http://localhost:${this.config.port}`);
            console.log(`📡 Stream: ws://localhost:${this.config.wsPort}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Guardian Proof API:', error.message);
            throw error;
        }
    }
    
    async waitForAdapter() {
        while (!this.config.dbAdapter.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // ==================== CRYPTOGRAPHY ====================
    
    async initializeCryptography() {
        try {
            // Try to load existing keys
            const fs = require('fs').promises;
            const keyPath = './.guardian-proof-keys.json';
            
            try {
                const keyData = await fs.readFile(keyPath, 'utf8');
                const keys = JSON.parse(keyData);
                this.config.signingKey = keys.signingKey;
                this.config.publicKey = keys.publicKey;
                console.log('🔑 Loaded existing Guardian proof keys');
            } catch (error) {
                // Generate new key pair
                const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                    modulusLength: 2048,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem'
                    }
                });
                
                this.config.signingKey = privateKey;
                this.config.publicKey = publicKey;
                
                // Save keys
                await fs.writeFile(keyPath, JSON.stringify({
                    signingKey: privateKey,
                    publicKey: publicKey,
                    generated: new Date().toISOString()
                }, null, 2));
                
                console.log('🔑 Generated new Guardian proof keys');
            }
        } catch (error) {
            console.error('❌ Cryptography initialization failed:', error.message);
            throw error;
        }
    }
    
    // ==================== PROOF CHAIN ====================
    
    async loadProofChain() {
        try {
            const fs = require('fs').promises;
            const chainData = await fs.readFile(this.config.chainFile, 'utf8');
            const chain = JSON.parse(chainData);
            
            this.proofChain = chain.blocks || [];
            this.genesisBlock = chain.genesis;
            this.currentBlock = this.proofChain[this.proofChain.length - 1] || this.genesisBlock;
            
            console.log(`📜 Loaded proof chain with ${this.proofChain.length} blocks`);
        } catch (error) {
            // Create genesis block
            await this.createGenesisBlock();
        }
    }
    
    async createGenesisBlock() {
        this.genesisBlock = {
            index: 0,
            timestamp: new Date().toISOString(),
            type: 'genesis',
            data: {
                message: 'Guardian Proof Chain Genesis Block',
                guardianAgent: this.config.dbAdapter.guardianAgent,
                publicKey: this.config.publicKey
            },
            previousHash: '0',
            hash: null,
            signature: null
        };
        
        // Calculate hash and sign
        this.genesisBlock.hash = this.calculateHash(this.genesisBlock);
        this.genesisBlock.signature = this.signBlock(this.genesisBlock);
        
        this.currentBlock = this.genesisBlock;
        this.proofChain = [this.genesisBlock];
        
        await this.saveProofChain();
        console.log('🌟 Created Genesis block for Guardian proof chain');
    }
    
    calculateHash(block) {
        const data = {
            index: block.index,
            timestamp: block.timestamp,
            type: block.type,
            data: block.data,
            previousHash: block.previousHash
        };
        
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    signBlock(block) {
        const sign = crypto.createSign('SHA256');
        sign.update(block.hash);
        sign.end();
        return sign.sign(this.config.signingKey, 'hex');
    }
    
    verifySignature(block, publicKey = this.config.publicKey) {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(block.hash);
            verify.end();
            return verify.verify(publicKey, block.signature, 'hex');
        } catch (error) {
            return false;
        }
    }
    
    async createProofBlock(type, data) {
        const newBlock = {
            index: this.currentBlock.index + 1,
            timestamp: new Date().toISOString(),
            type: type,
            data: data,
            previousHash: this.currentBlock.hash,
            hash: null,
            signature: null
        };
        
        // Calculate hash and sign
        newBlock.hash = this.calculateHash(newBlock);
        newBlock.signature = this.signBlock(newBlock);
        
        // Add to chain
        this.proofChain.push(newBlock);
        this.currentBlock = newBlock;
        
        // Update metrics
        this.metrics.totalProofs++;
        this.metrics.lastProofTime = new Date();
        
        // Save chain
        await this.saveProofChain();
        
        // Broadcast to WebSocket clients
        this.broadcastProof(newBlock);
        
        return newBlock;
    }
    
    async saveProofChain() {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(this.config.chainFile, JSON.stringify({
                genesis: this.genesisBlock,
                blocks: this.proofChain,
                metrics: this.metrics,
                lastUpdated: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            console.error('❌ Failed to save proof chain:', error.message);
        }
    }
    
    // ==================== GUARDIAN EVENT SUBSCRIPTION ====================
    
    subscribeToGuardianEvents() {
        // Connect to Guardian WebSocket
        const guardianWs = new WebSocket(`ws://localhost:${this.config.dbAdapter.wsPort}`);
        
        guardianWs.on('open', () => {
            console.log('🔌 Connected to Guardian event stream');
            guardianWs.send(JSON.stringify({
                type: 'subscribe',
                channel: 'all'
            }));
        });
        
        guardianWs.on('message', async (data) => {
            try {
                const event = JSON.parse(data);
                await this.handleGuardianEvent(event);
            } catch (error) {
                console.error('❌ Guardian event error:', error.message);
            }
        });
        
        guardianWs.on('close', () => {
            console.log('🔌 Guardian connection closed, reconnecting...');
            setTimeout(() => this.subscribeToGuardianEvents(), 3000);
        });
    }
    
    async handleGuardianEvent(event) {
        switch (event.type) {
            case 'approval_requested':
                await this.createProofBlock('approval_requested', {
                    approvalId: event.approvalId,
                    brand: event.brand,
                    priority: event.priority,
                    requestTime: event.timestamp,
                    data: event.data
                });
                break;
                
            case 'approval_updated':
                const proofData = {
                    approvalId: event.approvalId,
                    status: event.status,
                    resolvedBy: event.resolvedBy,
                    responseTime: new Date() - new Date(event.timestamp),
                    response: event.response
                };
                
                await this.createProofBlock(`approval_${event.status}`, proofData);
                
                // Update metrics
                if (event.status === 'approved') {
                    this.metrics.totalApprovals++;
                } else if (event.status === 'rejected') {
                    this.metrics.totalRejections++;
                } else if (event.status === 'corrected') {
                    this.metrics.totalCorrections++;
                }
                
                break;
        }
    }
    
    // ==================== HTTP API SERVER ====================
    
    startHttpServer() {
        const server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            this.handleHttpRequest(req, res);
        });
        
        server.listen(this.config.port, () => {
            console.log(`📊 Guardian Proof API running on http://localhost:${this.config.port}`);
        });
    }
    
    async handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        
        try {
            if (path === '/api/guardian/proof/latest') {
                await this.serveLatestProof(res);
            } else if (path === '/api/guardian/proof/chain') {
                await this.serveProofChain(res, url.searchParams);
            } else if (path.startsWith('/api/guardian/proof/block/')) {
                const blockIndex = parseInt(path.split('/').pop());
                await this.serveProofBlock(res, blockIndex);
            } else if (path.startsWith('/api/guardian/verify/')) {
                const approvalId = path.split('/').pop();
                await this.verifyApproval(res, approvalId);
            } else if (path === '/api/guardian/proof/metrics') {
                await this.serveMetrics(res);
            } else if (path === '/api/guardian/proof/public-key') {
                await this.servePublicKey(res);
            } else if (path === '/api/guardian/proof/health') {
                await this.serveHealth(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('Request handling error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async serveLatestProof(res) {
        const latestBlock = this.currentBlock;
        const verified = this.verifySignature(latestBlock);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            block: latestBlock,
            verified,
            chainLength: this.proofChain.length,
            timestamp: new Date().toISOString()
        }, null, 2));
    }
    
    async serveProofChain(res, params) {
        const limit = parseInt(params.get('limit')) || 100;
        const offset = parseInt(params.get('offset')) || 0;
        
        const blocks = this.proofChain.slice(offset, offset + limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            genesis: this.genesisBlock,
            blocks,
            total: this.proofChain.length,
            limit,
            offset,
            verified: blocks.every(block => this.verifySignature(block))
        }, null, 2));
    }
    
    async serveProofBlock(res, blockIndex) {
        const block = this.proofChain[blockIndex];
        
        if (!block) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Block not found' }));
            return;
        }
        
        const verified = this.verifySignature(block);
        const previousBlock = blockIndex > 0 ? this.proofChain[blockIndex - 1] : this.genesisBlock;
        const hashValid = block.previousHash === previousBlock.hash;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            block,
            verified,
            hashValid,
            previousBlock: {
                index: previousBlock.index,
                hash: previousBlock.hash
            }
        }, null, 2));
    }
    
    async verifyApproval(res, approvalId) {
        // Find all blocks related to this approval
        const relatedBlocks = this.proofChain.filter(block => 
            block.data && block.data.approvalId === approvalId
        );
        
        // Get approval from database
        const approval = await this.config.dbAdapter.getApprovalRequest(approvalId);
        
        const verification = {
            approvalId,
            exists: !!approval,
            proofBlocks: relatedBlocks.length,
            blocks: relatedBlocks.map(block => ({
                index: block.index,
                type: block.type,
                timestamp: block.timestamp,
                hash: block.hash,
                verified: this.verifySignature(block)
            })),
            approval: approval ? {
                status: approval.status,
                brand: approval.brand,
                priority: approval.priority,
                created_at: approval.created_at,
                resolved_at: approval.resolved_at
            } : null,
            cryptographicallyVerified: relatedBlocks.every(block => this.verifySignature(block))
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(verification, null, 2));
    }
    
    async serveMetrics(res) {
        const uptime = Date.now() - this.metrics.startTime.getTime();
        const avgResponseTime = this.metrics.totalProofs > 0 
            ? this.metrics.averageResponseTime / this.metrics.totalProofs 
            : 0;
        
        const accuracyRate = this.metrics.totalApprovals + this.metrics.totalRejections > 0
            ? (this.metrics.totalApprovals / (this.metrics.totalApprovals + this.metrics.totalRejections)) * 100
            : 0;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ...this.metrics,
            uptime,
            avgResponseTime,
            accuracyRate: accuracyRate.toFixed(2) + '%',
            proofsPerHour: (this.metrics.totalProofs / (uptime / 3600000)).toFixed(2),
            currentChainLength: this.proofChain.length
        }, null, 2));
    }
    
    async servePublicKey(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            publicKey: this.config.publicKey,
            algorithm: 'RSA-SHA256',
            purpose: 'Guardian Proof Chain Verification',
            notice: 'Use this public key to independently verify Guardian proof signatures'
        }, null, 2));
    }
    
    async serveHealth(res) {
        const health = {
            status: 'healthy',
            proofChain: {
                length: this.proofChain.length,
                lastBlock: this.currentBlock.index,
                lastProof: this.metrics.lastProofTime
            },
            connections: {
                database: this.config.dbAdapter.initialized,
                websocket: this.wsConnections.size
            },
            uptime: Date.now() - this.metrics.startTime.getTime()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
    }
    
    // ==================== WEBSOCKET STREAMING ====================
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.config.wsPort });
        
        wss.on('connection', (ws, req) => {
            const connectionId = crypto.randomUUID();
            const clientInfo = {
                id: connectionId,
                ws,
                connectedAt: new Date(),
                ip: req.socket.remoteAddress,
                subscriptions: new Set(['all'])
            };
            
            this.wsConnections.set(connectionId, clientInfo);
            console.log(`📡 New proof stream client connected: ${connectionId}`);
            
            // Send welcome message with current state
            ws.send(JSON.stringify({
                type: 'welcome',
                connectionId,
                currentBlock: {
                    index: this.currentBlock.index,
                    hash: this.currentBlock.hash,
                    timestamp: this.currentBlock.timestamp
                },
                chainLength: this.proofChain.length,
                metrics: this.metrics,
                publicKey: this.config.publicKey
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(connectionId, data);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error.message);
                }
            });
            
            ws.on('close', () => {
                this.wsConnections.delete(connectionId);
                console.log(`📡 Proof stream client disconnected: ${connectionId}`);
            });
        });
        
        console.log(`📡 Guardian Proof WebSocket streaming on ws://localhost:${this.config.wsPort}`);
    }
    
    handleWebSocketMessage(connectionId, data) {
        const client = this.wsConnections.get(connectionId);
        if (!client) return;
        
        switch (data.type) {
            case 'subscribe':
                if (data.channel) {
                    client.subscriptions.add(data.channel);
                }
                break;
                
            case 'unsubscribe':
                if (data.channel) {
                    client.subscriptions.delete(data.channel);
                }
                break;
                
            case 'get_chain':
                const limit = data.limit || 100;
                const blocks = this.proofChain.slice(-limit);
                client.ws.send(JSON.stringify({
                    type: 'chain_data',
                    blocks,
                    total: this.proofChain.length
                }));
                break;
        }
    }
    
    broadcastProof(block) {
        const message = JSON.stringify({
            type: 'new_proof',
            block,
            chainLength: this.proofChain.length,
            verified: this.verifySignature(block),
            timestamp: new Date().toISOString()
        });
        
        this.wsConnections.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                if (client.subscriptions.has('all') || 
                    client.subscriptions.has(block.type) ||
                    (block.data.brand && client.subscriptions.has(block.data.brand))) {
                    client.ws.send(message);
                }
            }
        });
    }
    
    // ==================== CLEANUP ====================
    
    async close() {
        console.log('🛡️ Closing Guardian Proof API...');
        
        // Save final state
        await this.saveProofChain();
        
        // Close WebSocket connections
        this.wsConnections.forEach((client) => {
            client.ws.close();
        });
        
        console.log('✅ Guardian Proof API closed');
    }
}

// Export for use in other modules
module.exports = CalGuardianProofAPI;

// CLI testing
if (require.main === module) {
    const proofAPI = new CalGuardianProofAPI();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await proofAPI.close();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await proofAPI.close();
        process.exit(0);
    });
}