#!/usr/bin/env node

// 🔏📄 SOUL XML ATTESTATION SERVICE
// Cryptographic attestation and verification service for Soul of Soulfra system
// Provides XML-based proof-of-life, signature verification, and compliance attestation

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');
const WebSocket = require('ws');

class SoulXMLAttestationService {
    constructor(port = 9600) {
        this.port = port;
        this.wsPort = port + 1;
        
        // Cryptographic keys for attestation
        this.masterKeys = this.generateMasterKeys();
        
        // Attestation registry
        this.attestations = new Map();
        this.verificationLog = new Map();
        this.proofOfLifeSignatures = new Map();
        
        // WebSocket connections for real-time attestation
        this.wsConnections = new Set();
        
        // Service configuration
        this.config = {
            attestationInterval: 300000, // 5 minutes
            maxAttestationAge: 3600000,  // 1 hour
            signatureAlgorithm: 'ed25519',
            hashFunction: 'sha256',
            xmlNamespace: 'http://soulfra.org/attestation/v1'
        };
        
        console.log('🔏📄 Soul XML Attestation Service initializing...');
        this.initializeService();
    }
    
    async initializeService() {
        console.log('🚀 Setting up XML attestation service...');
        
        try {
            // Initialize HTTP server
            this.setupHTTPServer();
            
            // Initialize WebSocket server
            this.setupWebSocketServer();
            
            // Setup automated proof-of-life generation
            this.setupProofOfLifeGeneration();
            
            // Setup attestation cleanup
            this.setupAttestationCleanup();
            
            // Load existing attestations
            this.loadExistingAttestations();
            
            console.log('✅ Soul XML Attestation Service ready');
            console.log(`🌐 HTTP Server: http://localhost:${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
            
        } catch (error) {
            console.error('🚨 Attestation service initialization failed:', error);
            throw error;
        }
    }
    
    generateMasterKeys() {
        console.log('🔐 Generating master attestation keys...');
        
        const keyPair = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        // Generate additional keys for different attestation types
        const soulKeys = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        const handshakeKeys = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        return {
            master: keyPair,
            soul: soulKeys,
            handshake: handshakeKeys
        };
    }
    
    setupHTTPServer() {
        console.log('🌐 Setting up HTTP attestation server...');
        
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            this.handleHTTPRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`✅ HTTP server listening on port ${this.port}`);
        });
    }
    
    setupWebSocketServer() {
        console.log('📡 Setting up WebSocket attestation server...');
        
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 New WebSocket connection for attestation');
            
            this.wsConnections.add(ws);
            
            // Send initial attestation status
            ws.send(JSON.stringify({
                type: 'attestation_status',
                data: {
                    totalAttestations: this.attestations.size,
                    activeProofOfLife: this.proofOfLifeSignatures.size,
                    timestamp: Date.now()
                }
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid JSON message'
                    }));
                }
            });
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                console.log('📱 WebSocket connection closed');
            });
        });
        
        console.log(`✅ WebSocket server listening on port ${this.wsPort}`);
    }
    
    async handleHTTPRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const path = url.pathname;
        const method = req.method;
        
        console.log(`🌐 ${method} ${path}`);
        
        try {
            if (path === '/' && method === 'GET') {
                this.handleDashboard(req, res);
            
            } else if (path === '/api/attest' && method === 'POST') {
                await this.handleCreateAttestation(req, res);
            
            } else if (path.startsWith('/api/verify/') && method === 'GET') {
                const soulId = path.split('/')[3];
                this.handleVerifyAttestation(req, res, soulId);
            
            } else if (path === '/api/proof-of-life' && method === 'GET') {
                this.handleProofOfLife(req, res);
            
            } else if (path === '/api/attestations' && method === 'GET') {
                this.handleListAttestations(req, res);
            
            } else if (path === '/api/status' && method === 'GET') {
                this.handleServiceStatus(req, res);
            
            } else if (path === '/api/keys/public' && method === 'GET') {
                this.handlePublicKeys(req, res);
            
            } else {
                this.handleNotFound(req, res);
            }
            
        } catch (error) {
            console.error('🚨 HTTP request error:', error);
            this.handleError(req, res, error);
        }
    }
    
    handleDashboard(req, res) {
        const dashboard = `
<!DOCTYPE html>
<html>
<head>
    <title>🔏 Soul XML Attestation Service</title>
    <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff00; margin: 20px; }
        .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #333; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #2a2a2a; }
        .status { color: #00ff00; }
        .error { color: #ff4444; }
        .warning { color: #ffaa00; }
        pre { background: #2a2a2a; padding: 10px; overflow-x: auto; }
        a { color: #00aaff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔏📄 Soul XML Attestation Service</h1>
        <p>Cryptographic attestation and verification for Soul of Soulfra system</p>
    </div>
    
    <div class="section">
        <h2>📊 Service Metrics</h2>
        <div class="metric">
            <strong>Total Attestations:</strong> ${this.attestations.size}
        </div>
        <div class="metric">
            <strong>Active Proof-of-Life:</strong> ${this.proofOfLifeSignatures.size}
        </div>
        <div class="metric">
            <strong>WebSocket Connections:</strong> ${this.wsConnections.size}
        </div>
        <div class="metric">
            <strong>Verification Requests:</strong> ${this.verificationLog.size}
        </div>
    </div>
    
    <div class="section">
        <h2>🔗 API Endpoints</h2>
        <ul>
            <li><a href="/api/status">GET /api/status</a> - Service status</li>
            <li><a href="/api/attestations">GET /api/attestations</a> - List all attestations</li>
            <li><a href="/api/proof-of-life">GET /api/proof-of-life</a> - Current proof-of-life</li>
            <li><a href="/api/keys/public">GET /api/keys/public</a> - Public keys for verification</li>
            <li>POST /api/attest - Create new attestation</li>
            <li>GET /api/verify/{soulId} - Verify soul attestation</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📡 WebSocket Interface</h2>
        <p>Connect to <code>ws://localhost:${this.wsPort}</code> for real-time attestation updates</p>
        <p>Message types: attestation_created, proof_of_life_updated, verification_requested</p>
    </div>
    
    <div class="section">
        <h2>🔐 Cryptographic Configuration</h2>
        <pre>Algorithm: ${this.config.signatureAlgorithm}
Hash Function: ${this.config.hashFunction}
Attestation Interval: ${this.config.attestationInterval / 1000}s
Max Attestation Age: ${this.config.maxAttestationAge / 1000}s
XML Namespace: ${this.config.xmlNamespace}</pre>
    </div>
    
    <script>
        // Auto-refresh dashboard
        setTimeout(() => location.reload(), 30000);
        
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Attestation update:', data);
        };
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async handleCreateAttestation(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const attestation = await this.createAttestation(data);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    attestation: {
                        id: attestation.id,
                        soulId: attestation.soulId,
                        signature: attestation.signature.substring(0, 32) + '...',
                        createdAt: attestation.createdAt
                    }
                }));
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });
    }
    
    async createAttestation(soulData) {
        console.log(`🔏 Creating attestation for soul: ${soulData.soulId || 'unknown'}`);
        
        // Validate required fields
        if (!soulData.soulId || !soulData.name || !soulData.archetype) {
            throw new Error('Missing required soul data fields');
        }
        
        // Generate attestation ID
        const attestationId = crypto.randomUUID();
        
        // Create attestation data
        const attestationData = {
            id: attestationId,
            soulId: soulData.soulId,
            name: soulData.name,
            archetype: soulData.archetype,
            powerLevel: soulData.powerLevel || 0,
            tierLevel: soulData.tierLevel || 1,
            generation: soulData.generation || 0,
            handshakeStatus: soulData.handshakeStatus || 'pending',
            licenseCompliance: soulData.licenseCompliance || 0,
            agreementsSigned: soulData.agreementsSigned || 0,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.config.maxAttestationAge
        };
        
        // Generate XML document
        const xmlDocument = this.generateXMLAttestation(attestationData);
        
        // Create cryptographic signature
        const signature = this.signAttestation(attestationData);
        
        // Create full attestation record
        const attestation = {
            ...attestationData,
            xmlDocument,
            signature,
            publicKey: this.masterKeys.soul.publicKey,
            createdAt: Date.now(),
            verified: true
        };
        
        // Store attestation
        this.attestations.set(attestationId, attestation);
        
        // Update proof-of-life
        this.proofOfLifeSignatures.set(soulData.soulId, {
            attestationId,
            signature,
            timestamp: Date.now()
        });
        
        // Broadcast to WebSocket clients
        this.broadcastWebSocket({
            type: 'attestation_created',
            data: {
                attestationId,
                soulId: soulData.soulId,
                soulName: soulData.name,
                timestamp: Date.now()
            }
        });
        
        console.log(`✅ Attestation created: ${attestationId}`);
        console.log(`  👤 Soul: ${soulData.name} (${soulData.archetype})`);
        console.log(`  🔏 Signature: ${signature.substring(0, 16)}...`);
        
        return attestation;
    }
    
    generateXMLAttestation(data) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<soul-attestation xmlns="${this.config.xmlNamespace}" version="1.0">
  <metadata>
    <attestation-id>${data.id}</attestation-id>
    <timestamp>${new Date(data.timestamp).toISOString()}</timestamp>
    <expires-at>${new Date(data.expiresAt).toISOString()}</expires-at>
    <license>SOULFRA-1.0</license>
    <compliance>CC-BY-SA-4.0</compliance>
  </metadata>
  
  <soul-identity>
    <soul-id>${data.soulId}</soul-id>
    <name><![CDATA[${data.name}]]></name>
    <archetype>${data.archetype}</archetype>
    <generation>${data.generation}</generation>
  </soul-identity>
  
  <soul-metrics>
    <power-level>${data.powerLevel}</power-level>
    <tier-level>${data.tierLevel}</tier-level>
    <evolution-stage>${data.archetype}</evolution-stage>
  </soul-metrics>
  
  <handshake-status>
    <status>${data.handshakeStatus}</status>
    <license-compliance>${data.licenseCompliance}</license-compliance>
    <agreements-signed>${data.agreementsSigned}</agreements-signed>
  </handshake-status>
  
  <proof-of-life>
    <last-activity>${data.timestamp}</last-activity>
    <verification-endpoint>http://localhost:${this.port}/api/verify/${data.soulId}</verification-endpoint>
    <websocket-endpoint>ws://localhost:${this.wsPort}</websocket-endpoint>
  </proof-of-life>
  
  <cryptographic-proof>
    <algorithm>${this.config.signatureAlgorithm}</algorithm>
    <hash-function>${this.config.hashFunction}</hash-function>
    <public-key-endpoint>http://localhost:${this.port}/api/keys/public</public-key-endpoint>
  </cryptographic-proof>
</soul-attestation>`;
    }
    
    signAttestation(data) {
        // Create canonical representation for signing
        const canonicalData = {
            id: data.id,
            soulId: data.soulId,
            name: data.name,
            archetype: data.archetype,
            powerLevel: data.powerLevel,
            tierLevel: data.tierLevel,
            timestamp: data.timestamp
        };
        
        const content = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
        const signature = crypto.sign(this.config.hashFunction, Buffer.from(content), this.masterKeys.soul.privateKey);
        
        return signature.toString('base64');
    }
    
    verifyAttestation(attestationId, signature) {
        const attestation = this.attestations.get(attestationId);
        if (!attestation) return false;
        
        try {
            const canonicalData = {
                id: attestation.id,
                soulId: attestation.soulId,
                name: attestation.name,
                archetype: attestation.archetype,
                powerLevel: attestation.powerLevel,
                tierLevel: attestation.tierLevel,
                timestamp: attestation.timestamp
            };
            
            const content = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
            return crypto.verify(
                this.config.hashFunction, 
                Buffer.from(content), 
                this.masterKeys.soul.publicKey, 
                Buffer.from(signature, 'base64')
            );
            
        } catch (error) {
            console.error('🚨 Verification error:', error);
            return false;
        }
    }
    
    handleVerifyAttestation(req, res, soulId) {
        console.log(`🔍 Verifying attestation for soul: ${soulId}`);
        
        // Find attestation for soul
        let attestation = null;
        for (const [id, att] of this.attestations) {
            if (att.soulId === soulId) {
                attestation = att;
                break;
            }
        }
        
        if (!attestation) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Attestation not found for soul',
                soulId
            }));
            return;
        }
        
        // Check if attestation is expired
        const isExpired = Date.now() > attestation.expiresAt;
        
        // Verify signature
        const isValid = this.verifyAttestation(attestation.id, attestation.signature);
        
        // Get proof-of-life status
        const proofOfLife = this.proofOfLifeSignatures.get(soulId);
        
        // Log verification request
        this.verificationLog.set(`${soulId}-${Date.now()}`, {
            soulId,
            attestationId: attestation.id,
            requestTime: Date.now(),
            isValid,
            isExpired
        });
        
        const verificationResult = {
            success: true,
            soulId,
            attestation: {
                id: attestation.id,
                name: attestation.name,
                archetype: attestation.archetype,
                powerLevel: attestation.powerLevel,
                tierLevel: attestation.tierLevel,
                handshakeStatus: attestation.handshakeStatus,
                createdAt: attestation.createdAt,
                expiresAt: attestation.expiresAt
            },
            verification: {
                isValid,
                isExpired,
                signatureAlgorithm: this.config.signatureAlgorithm,
                verifiedAt: Date.now()
            },
            proofOfLife: proofOfLife ? {
                lastUpdate: proofOfLife.timestamp,
                isRecent: (Date.now() - proofOfLife.timestamp) < this.config.attestationInterval
            } : null,
            xmlDocument: attestation.xmlDocument
        };
        
        // Broadcast verification to WebSocket clients
        this.broadcastWebSocket({
            type: 'verification_requested',
            data: {
                soulId,
                attestationId: attestation.id,
                isValid,
                timestamp: Date.now()
            }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(verificationResult));
        
        console.log(`✅ Verification complete: ${soulId} (valid: ${isValid}, expired: ${isExpired})`);
    }
    
    handleProofOfLife(req, res) {
        const proofOfLifeData = Array.from(this.proofOfLifeSignatures.entries()).map(([soulId, data]) => ({
            soulId,
            attestationId: data.attestationId,
            lastUpdate: data.timestamp,
            isRecent: (Date.now() - data.timestamp) < this.config.attestationInterval
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            proofOfLife: proofOfLifeData,
            totalSouls: proofOfLifeData.length,
            activeSouls: proofOfLifeData.filter(p => p.isRecent).length,
            lastGenerated: Math.max(...proofOfLifeData.map(p => p.lastUpdate), 0)
        }));
    }
    
    handleListAttestations(req, res) {
        const attestationsList = Array.from(this.attestations.values()).map(att => ({
            id: att.id,
            soulId: att.soulId,
            name: att.name,
            archetype: att.archetype,
            powerLevel: att.powerLevel,
            tierLevel: att.tierLevel,
            handshakeStatus: att.handshakeStatus,
            createdAt: att.createdAt,
            expiresAt: att.expiresAt,
            isExpired: Date.now() > att.expiresAt
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            attestations: attestationsList,
            total: attestationsList.length,
            active: attestationsList.filter(a => !a.isExpired).length
        }));
    }
    
    handleServiceStatus(req, res) {
        const status = {
            service: 'Soul XML Attestation Service',
            version: '1.0.0',
            status: 'operational',
            timestamp: Date.now(),
            uptime: process.uptime(),
            metrics: {
                totalAttestations: this.attestations.size,
                activeProofOfLife: this.proofOfLifeSignatures.size,
                verificationRequests: this.verificationLog.size,
                webSocketConnections: this.wsConnections.size
            },
            configuration: this.config,
            endpoints: {
                http: `http://localhost:${this.port}`,
                websocket: `ws://localhost:${this.wsPort}`
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    handlePublicKeys(req, res) {
        const publicKeys = {
            master: this.masterKeys.master.publicKey,
            soul: this.masterKeys.soul.publicKey,
            handshake: this.masterKeys.handshake.publicKey,
            algorithms: {
                signature: this.config.signatureAlgorithm,
                hash: this.config.hashFunction
            },
            usage: {
                master: 'Service-level attestations and system integrity',
                soul: 'Soul attestations and proof-of-life signatures',
                handshake: 'Handshake agreement verification'
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(publicKeys));
    }
    
    handleNotFound(req, res) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
            availableEndpoints: [
                'GET /',
                'GET /api/status',
                'GET /api/attestations',
                'GET /api/proof-of-life',
                'GET /api/keys/public',
                'POST /api/attest',
                'GET /api/verify/{soulId}'
            ]
        }));
    }
    
    handleError(req, res, error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: 'Internal server error',
            message: error.message
        }));
    }
    
    setupProofOfLifeGeneration() {
        console.log('💓 Setting up automated proof-of-life generation...');
        
        setInterval(() => {
            this.generateSystemProofOfLife();
        }, this.config.attestationInterval);
        
        console.log(`✅ Proof-of-life generation active (every ${this.config.attestationInterval / 1000}s)`);
    }
    
    generateSystemProofOfLife() {
        console.log('💓 Generating system proof-of-life...');
        
        const systemProof = {
            timestamp: Date.now(),
            totalAttestations: this.attestations.size,
            activeProofOfLife: this.proofOfLifeSignatures.size,
            serviceUptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
        
        // Sign system proof-of-life
        const signature = crypto.sign(
            this.config.hashFunction,
            Buffer.from(JSON.stringify(systemProof)),
            this.masterKeys.master.privateKey
        );
        
        // Broadcast to WebSocket clients
        this.broadcastWebSocket({
            type: 'proof_of_life_updated',
            data: {
                ...systemProof,
                signature: signature.toString('base64').substring(0, 32) + '...'
            }
        });
        
        console.log(`💓 System proof-of-life generated (${this.proofOfLifeSignatures.size} active souls)`);
    }
    
    setupAttestationCleanup() {
        console.log('🧹 Setting up attestation cleanup...');
        
        setInterval(() => {
            this.cleanupExpiredAttestations();
        }, this.config.attestationInterval);
        
        console.log('✅ Attestation cleanup active');
    }
    
    cleanupExpiredAttestations() {
        console.log('🧹 Cleaning up expired attestations...');
        
        let cleanedCount = 0;
        const now = Date.now();
        
        for (const [id, attestation] of this.attestations) {
            if (now > attestation.expiresAt) {
                this.attestations.delete(id);
                cleanedCount++;
            }
        }
        
        // Cleanup old verification logs
        for (const [id, log] of this.verificationLog) {
            if (now - log.requestTime > this.config.maxAttestationAge) {
                this.verificationLog.delete(id);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired attestations`);
        }
    }
    
    loadExistingAttestations() {
        console.log('📂 Loading existing attestations...');
        
        const attestationFile = path.join(__dirname, 'soul-attestations.json');
        
        if (fs.existsSync(attestationFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(attestationFile, 'utf8'));
                
                for (const attestation of data.attestations || []) {
                    if (Date.now() < attestation.expiresAt) {
                        this.attestations.set(attestation.id, attestation);
                        
                        if (attestation.soulId) {
                            this.proofOfLifeSignatures.set(attestation.soulId, {
                                attestationId: attestation.id,
                                signature: attestation.signature,
                                timestamp: attestation.createdAt
                            });
                        }
                    }
                }
                
                console.log(`📂 Loaded ${this.attestations.size} existing attestations`);
                
            } catch (error) {
                console.log('⚠️ Failed to load existing attestations:', error.message);
            }
        }
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe_attestations':
                ws.send(JSON.stringify({
                    type: 'subscription_confirmed',
                    data: { type: 'attestations' }
                }));
                break;
                
            case 'request_proof_of_life':
                const proofOfLife = Array.from(this.proofOfLifeSignatures.entries()).map(([soulId, data]) => ({
                    soulId,
                    lastUpdate: data.timestamp,
                    isRecent: (Date.now() - data.timestamp) < this.config.attestationInterval
                }));
                
                ws.send(JSON.stringify({
                    type: 'proof_of_life_response',
                    data: proofOfLife
                }));
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    }
    
    broadcastWebSocket(message) {
        const messageStr = JSON.stringify(message);
        
        for (const ws of this.wsConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        }
    }
    
    saveAttestations() {
        console.log('💾 Saving attestations to disk...');
        
        const attestationData = {
            timestamp: Date.now(),
            version: '1.0.0',
            attestations: Array.from(this.attestations.values()),
            proofOfLife: Array.from(this.proofOfLifeSignatures.entries()).map(([soulId, data]) => ({
                soulId,
                ...data
            }))
        };
        
        const attestationFile = path.join(__dirname, 'soul-attestations.json');
        fs.writeFileSync(attestationFile, JSON.stringify(attestationData, null, 2));
        
        console.log(`💾 Saved ${this.attestations.size} attestations to disk`);
    }
    
    shutdown() {
        console.log('🛑 Shutting down Soul XML Attestation Service...');
        
        // Save attestations
        this.saveAttestations();
        
        // Close WebSocket connections
        for (const ws of this.wsConnections) {
            ws.close(1000, 'Service shutting down');
        }
        
        // Close servers
        this.server.close();
        this.wss.close();
        
        console.log('✅ Soul XML Attestation Service shutdown complete');
    }
}

if (require.main === module) {
    const service = new SoulXMLAttestationService();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Received SIGINT, shutting down gracefully...');
        service.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\\n🛑 Received SIGTERM, shutting down gracefully...');
        service.shutdown();
        process.exit(0);
    });
}

module.exports = SoulXMLAttestationService;