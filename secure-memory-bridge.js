#!/usr/bin/env node

/**
 * 🌉 Secure Memory Bridge
 * 
 * Enables King and Queen to share memories across different encrypted systems.
 * Each system maintains its own encryption while the bridge provides secure translation.
 * 
 * Like a diplomatic translator who speaks both languages but keeps secrets safe!
 */

const WebSocket = require('ws');
const express = require('express');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const { EventEmitter } = require('events');

class SecureMemoryBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9996,
            wsPort: config.wsPort || 9995,
            tlsEnabled: config.tlsEnabled || false,
            ...config
        };
        
        // Memory vaults for each system
        this.memoryVaults = {
            king: {
                memories: new Map(),
                encryption: { algorithm: 'aes-256-gcm', key: null },
                lastSync: null,
                authorized: false
            },
            queen: {
                memories: new Map(),
                encryption: { algorithm: 'aes-256-gcm', key: null },
                lastSync: null,
                authorized: false
            },
            bridge: {
                sharedMemories: new Map(),
                translations: new Map(),
                syncQueue: []
            }
        };
        
        // Connection tracking
        this.connections = {
            king: null,
            queen: null,
            observers: new Set()
        };
        
        // Shared choreography patterns (encrypted)
        this.sharedChoreography = new Map();
        
        // Translation cache for performance
        this.translationCache = new Map();
        
        // Initialize express app
        this.app = express();
        this.app.use(express.json());
    }
    
    /**
     * Initialize the bridge
     */
    async initialize() {
        console.log('🌉 Initializing Secure Memory Bridge...');
        
        // Load encryption keys
        await this.loadEncryptionKeys();
        
        // Setup HTTP endpoints
        this.setupEndpoints();
        
        // Start HTTP server
        await this.startHTTPServer();
        
        // Setup WebSocket server
        await this.setupWebSocketServer();
        
        // Start memory sync engine
        this.startMemorySyncEngine();
        
        console.log('✅ Secure Memory Bridge initialized');
        console.log(`📡 HTTP API: http://localhost:${this.config.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
    }
    
    /**
     * Load encryption keys for each system
     */
    async loadEncryptionKeys() {
        // King's key
        const kingKeyPath = '.env.king.key';
        if (fs.existsSync(kingKeyPath)) {
            const keyHex = fs.readFileSync(kingKeyPath, 'utf8').trim();
            this.memoryVaults.king.encryption.key = Buffer.from(keyHex, 'hex');
            console.log('🔐 Loaded King encryption key');
        } else {
            // Generate new key
            this.memoryVaults.king.encryption.key = crypto.randomBytes(32);
            fs.writeFileSync(kingKeyPath, this.memoryVaults.king.encryption.key.toString('hex'));
            console.log('🔐 Generated new King encryption key');
        }
        
        // Queen's key
        const queenKeyPath = '.env.queen.key';
        if (fs.existsSync(queenKeyPath)) {
            const keyHex = fs.readFileSync(queenKeyPath, 'utf8').trim();
            this.memoryVaults.queen.encryption.key = Buffer.from(keyHex, 'hex');
            console.log('🔐 Loaded Queen encryption key');
        } else {
            // Generate new key
            this.memoryVaults.queen.encryption.key = crypto.randomBytes(32);
            fs.writeFileSync(queenKeyPath, this.memoryVaults.queen.encryption.key.toString('hex'));
            console.log('🔐 Generated new Queen encryption key');
        }
        
        // Bridge master key (for shared memories)
        const bridgeKeyPath = '.env.bridge.master.key';
        if (fs.existsSync(bridgeKeyPath)) {
            const keyHex = fs.readFileSync(bridgeKeyPath, 'utf8').trim();
            this.bridgeMasterKey = Buffer.from(keyHex, 'hex');
        } else {
            this.bridgeMasterKey = crypto.randomBytes(32);
            fs.writeFileSync(bridgeKeyPath, this.bridgeMasterKey.toString('hex'));
        }
    }
    
    /**
     * Setup HTTP endpoints
     */
    setupEndpoints() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'secure-memory-bridge',
                connections: {
                    king: this.connections.king ? 'connected' : 'disconnected',
                    queen: this.connections.queen ? 'connected' : 'disconnected',
                    observers: this.connections.observers.size
                },
                memoryStatus: this.getMemoryStatus()
            });
        });
        
        // Authorize system (exchange keys)
        this.app.post('/authorize/:system', (req, res) => {
            const system = req.params.system;
            const { publicKey, signature } = req.body;
            
            if (this.authorizeSystem(system, publicKey, signature)) {
                res.json({
                    authorized: true,
                    bridgePublicKey: this.getBridgePublicKey(),
                    sessionToken: this.generateSessionToken(system)
                });
            } else {
                res.status(401).json({ error: 'Authorization failed' });
            }
        });
        
        // Store memory (encrypted)
        this.app.post('/memory/:system', this.validateAuth, (req, res) => {
            const system = req.params.system;
            const { key, value, encrypted } = req.body;
            
            try {
                const memoryId = this.storeMemory(system, key, value, encrypted);
                res.json({ stored: true, memoryId });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Retrieve memory
        this.app.get('/memory/:system/:key', this.validateAuth, (req, res) => {
            const system = req.params.system;
            const key = req.params.key;
            
            try {
                const memory = this.retrieveMemory(system, key);
                res.json({ key, value: memory });
            } catch (error) {
                res.status(404).json({ error: 'Memory not found' });
            }
        });
        
        // Sync memories between systems
        this.app.post('/sync', this.validateAuth, (req, res) => {
            const { from, to, pattern } = req.body;
            
            try {
                const syncResult = this.syncMemories(from, to, pattern);
                res.json(syncResult);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Get shared choreography
        this.app.get('/choreography/:dance', (req, res) => {
            const dance = req.params.dance;
            const choreography = this.getSharedChoreography(dance);
            
            if (choreography) {
                res.json(choreography);
            } else {
                res.status(404).json({ error: 'Dance not found' });
            }
        });
    }
    
    /**
     * Validate authentication middleware
     */
    validateAuth(req, res, next) {
        const token = req.headers['x-session-token'];
        
        if (!token) {
            return res.status(401).json({ error: 'No session token' });
        }
        
        // Validate token (simplified for demo)
        // In production, use proper JWT or similar
        if (token.startsWith('king_') || token.startsWith('queen_')) {
            next();
        } else {
            res.status(401).json({ error: 'Invalid session token' });
        }
    }
    
    /**
     * Start HTTP server
     */
    async startHTTPServer() {
        return new Promise((resolve) => {
            this.httpServer = this.app.listen(this.config.port, () => {
                console.log(`🌐 HTTP server listening on port ${this.config.port}`);
                resolve();
            });
        });
    }
    
    /**
     * Setup WebSocket server for real-time sync
     */
    async setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });
            
            ws.on('close', () => {
                this.handleDisconnection(ws);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Connected to Secure Memory Bridge'
            }));
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'identify':
                this.identifyConnection(ws, data);
                break;
                
            case 'memory_update':
                this.handleMemoryUpdate(ws, data);
                break;
                
            case 'request_sync':
                this.handleSyncRequest(ws, data);
                break;
                
            case 'dance_memory':
                this.handleDanceMemory(ws, data);
                break;
                
            default:
                ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
    }
    
    /**
     * Identify connection (King or Queen)
     */
    identifyConnection(ws, data) {
        const { role, token } = data;
        
        if (role === 'king' && token && token.startsWith('king_')) {
            this.connections.king = ws;
            ws.role = 'king';
            ws.send(JSON.stringify({ 
                type: 'identified', 
                role: 'king',
                message: 'Welcome, Your Majesty 👑' 
            }));
        } else if (role === 'queen' && token && token.startsWith('queen_')) {
            this.connections.queen = ws;
            ws.role = 'queen';
            ws.send(JSON.stringify({ 
                type: 'identified', 
                role: 'queen',
                message: 'Welcome, Your Highness 👸' 
            }));
        } else if (role === 'observer') {
            this.connections.observers.add(ws);
            ws.role = 'observer';
            ws.send(JSON.stringify({ 
                type: 'identified', 
                role: 'observer',
                message: 'Welcome to the bridge 🌉' 
            }));
        }
    }
    
    /**
     * Handle memory update from King or Queen
     */
    handleMemoryUpdate(ws, data) {
        const { key, value, encrypted } = data;
        const system = ws.role;
        
        if (!system || system === 'observer') {
            ws.send(JSON.stringify({ error: 'Not authorized to update memory' }));
            return;
        }
        
        try {
            // Store in appropriate vault
            const vault = this.memoryVaults[system];
            
            if (encrypted) {
                // Already encrypted by sender
                vault.memories.set(key, { value, encrypted: true });
            } else {
                // Encrypt with system's key
                const encryptedValue = this.encrypt(value, vault.encryption.key);
                vault.memories.set(key, { value: encryptedValue, encrypted: true });
            }
            
            vault.lastSync = new Date();
            
            // Queue for sync
            this.memoryVaults.bridge.syncQueue.push({
                system,
                key,
                timestamp: new Date()
            });
            
            ws.send(JSON.stringify({
                type: 'memory_stored',
                key,
                success: true
            }));
            
            // Notify observers
            this.notifyObservers({
                type: 'memory_update',
                system,
                key,
                timestamp: new Date()
            });
            
        } catch (error) {
            ws.send(JSON.stringify({ 
                type: 'error',
                error: error.message 
            }));
        }
    }
    
    /**
     * Handle sync request
     */
    handleSyncRequest(ws, data) {
        const { target, pattern } = data;
        const source = ws.role;
        
        if (!source || source === 'observer') {
            ws.send(JSON.stringify({ error: 'Not authorized to sync' }));
            return;
        }
        
        try {
            const syncResult = this.syncMemories(source, target, pattern);
            
            ws.send(JSON.stringify({
                type: 'sync_complete',
                result: syncResult
            }));
            
            // Notify target system
            const targetWs = this.connections[target];
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                    type: 'memories_received',
                    from: source,
                    count: syncResult.synced
                }));
            }
            
        } catch (error) {
            ws.send(JSON.stringify({ 
                type: 'error',
                error: error.message 
            }));
        }
    }
    
    /**
     * Handle dance memory sharing
     */
    handleDanceMemory(ws, data) {
        const { dance, step, memory } = data;
        const system = ws.role;
        
        // Store dance memory
        const danceKey = `dance_${dance}_${step}`;
        this.handleMemoryUpdate(ws, {
            key: danceKey,
            value: memory,
            encrypted: false
        });
        
        // Share with partner
        const partner = system === 'king' ? 'queen' : 'king';
        const partnerWs = this.connections[partner];
        
        if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
            partnerWs.send(JSON.stringify({
                type: 'dance_memory_shared',
                dance,
                step,
                partnerMemory: this.translateDanceMemory(memory, system, partner)
            }));
        }
    }
    
    /**
     * Encrypt data
     */
    encrypt(data, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
        
        let encrypted = cipher.update(dataStr, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    
    /**
     * Decrypt data
     */
    decrypt(encryptedData, key) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    }
    
    /**
     * Sync memories between systems
     */
    syncMemories(from, to, pattern = '*') {
        const fromVault = this.memoryVaults[from];
        const toVault = this.memoryVaults[to];
        
        if (!fromVault || !toVault) {
            throw new Error('Invalid system specified');
        }
        
        let synced = 0;
        const errors = [];
        
        fromVault.memories.forEach((memory, key) => {
            // Check if key matches pattern
            if (pattern === '*' || key.includes(pattern)) {
                try {
                    // Decrypt from source
                    const decrypted = memory.encrypted
                        ? this.decrypt(memory.value, fromVault.encryption.key)
                        : memory.value;
                    
                    // Translate if needed
                    const translated = this.translateMemory(decrypted, from, to);
                    
                    // Encrypt for target
                    const encrypted = this.encrypt(translated, toVault.encryption.key);
                    
                    // Store in target
                    toVault.memories.set(key, { value: encrypted, encrypted: true });
                    synced++;
                    
                } catch (error) {
                    errors.push({ key, error: error.message });
                }
            }
        });
        
        return {
            from,
            to,
            synced,
            errors,
            timestamp: new Date()
        };
    }
    
    /**
     * Translate memory between systems
     */
    translateMemory(memory, from, to) {
        // Check cache first
        const cacheKey = `${from}_${to}_${JSON.stringify(memory)}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }
        
        let translated = memory;
        
        // Use COBOL translator if available
        if (global.COBOLDanceTranslator) {
            const translator = new global.COBOLDanceTranslator();
            
            if (from === 'king' && to === 'queen') {
                translated = translator.translateKingToQueen(memory);
            } else if (from === 'queen' && to === 'king') {
                translated = translator.translateQueenToKing(memory);
            }
        }
        
        // Cache translation
        this.translationCache.set(cacheKey, translated);
        
        return translated;
    }
    
    /**
     * Translate dance memory
     */
    translateDanceMemory(memory, from, to) {
        if (from === 'king' && to === 'queen') {
            // Technical to emotional
            return {
                feeling: memory.performance > 90 ? 'graceful' : 'clumsy',
                rhythm: memory.timing === 'precise' ? 'in-sync' : 'off-beat',
                joy: memory.success ? 'high' : 'low'
            };
        } else {
            // Emotional to technical
            return {
                performance: memory.joy === 'high' ? 95 : 60,
                timing: memory.rhythm === 'in-sync' ? 'precise' : 'delayed',
                success: memory.feeling === 'graceful'
            };
        }
    }
    
    /**
     * Store memory
     */
    storeMemory(system, key, value, encrypted = false) {
        const vault = this.memoryVaults[system];
        if (!vault) throw new Error('Invalid system');
        
        const memoryId = crypto.randomBytes(16).toString('hex');
        
        if (encrypted) {
            vault.memories.set(key, { value, encrypted: true, id: memoryId });
        } else {
            const encryptedValue = this.encrypt(value, vault.encryption.key);
            vault.memories.set(key, { value: encryptedValue, encrypted: true, id: memoryId });
        }
        
        return memoryId;
    }
    
    /**
     * Retrieve memory
     */
    retrieveMemory(system, key) {
        const vault = this.memoryVaults[system];
        if (!vault) throw new Error('Invalid system');
        
        const memory = vault.memories.get(key);
        if (!memory) throw new Error('Memory not found');
        
        if (memory.encrypted) {
            return this.decrypt(memory.value, vault.encryption.key);
        }
        
        return memory.value;
    }
    
    /**
     * Get memory status
     */
    getMemoryStatus() {
        const status = {};
        
        for (const [system, vault] of Object.entries(this.memoryVaults)) {
            if (system !== 'bridge') {
                status[system] = {
                    memories: vault.memories.size,
                    lastSync: vault.lastSync,
                    encrypted: true
                };
            }
        }
        
        status.bridge = {
            sharedMemories: this.memoryVaults.bridge.sharedMemories.size,
            syncQueueLength: this.memoryVaults.bridge.syncQueue.length,
            translationsCached: this.translationCache.size
        };
        
        return status;
    }
    
    /**
     * Authorize system
     */
    authorizeSystem(system, publicKey, signature) {
        // Simplified authorization
        // In production, verify signature with public key
        const vault = this.memoryVaults[system];
        if (vault) {
            vault.authorized = true;
            return true;
        }
        return false;
    }
    
    /**
     * Generate session token
     */
    generateSessionToken(system) {
        return `${system}_${crypto.randomBytes(32).toString('hex')}`;
    }
    
    /**
     * Get bridge public key
     */
    getBridgePublicKey() {
        // In production, use proper asymmetric keys
        return crypto.randomBytes(32).toString('hex');
    }
    
    /**
     * Get shared choreography
     */
    getSharedChoreography(dance) {
        return this.sharedChoreography.get(dance) || null;
    }
    
    /**
     * Handle disconnection
     */
    handleDisconnection(ws) {
        if (ws.role === 'king') {
            this.connections.king = null;
            console.log('👑 King disconnected');
        } else if (ws.role === 'queen') {
            this.connections.queen = null;
            console.log('👸 Queen disconnected');
        } else if (ws.role === 'observer') {
            this.connections.observers.delete(ws);
            console.log('👁️ Observer disconnected');
        }
    }
    
    /**
     * Notify observers
     */
    notifyObservers(event) {
        const message = JSON.stringify(event);
        this.connections.observers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    /**
     * Start memory sync engine
     */
    startMemorySyncEngine() {
        setInterval(() => {
            const queue = this.memoryVaults.bridge.syncQueue;
            
            while (queue.length > 0) {
                const item = queue.shift();
                
                // Process sync item
                const partnerSystem = item.system === 'king' ? 'queen' : 'king';
                
                try {
                    // Get memory from source
                    const memory = this.retrieveMemory(item.system, item.key);
                    
                    // Translate
                    const translated = this.translateMemory(memory, item.system, partnerSystem);
                    
                    // Store in partner
                    this.storeMemory(partnerSystem, item.key, translated);
                    
                    // Notify partner
                    const partnerWs = this.connections[partnerSystem];
                    if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
                        partnerWs.send(JSON.stringify({
                            type: 'memory_synced',
                            key: item.key,
                            from: item.system
                        }));
                    }
                    
                } catch (error) {
                    console.error(`Sync error for ${item.key}:`, error.message);
                }
            }
        }, 1000);
    }
}

// Export
module.exports = SecureMemoryBridge;

// Run if called directly
if (require.main === module) {
    const bridge = new SecureMemoryBridge();
    
    bridge.on('error', (error) => {
        console.error('Bridge error:', error);
    });
    
    bridge.initialize().catch(console.error);
}