#!/usr/bin/env node

/**
 * SOULFRA UNIFIED LAUNCHER
 * One-time login with biometric authentication
 * Cross-device synchronization for gear, loot, and progress
 * "Like BeReal and Dropbox and Facebook combined"
 * Diffuses data for security, reassembles perfectly on demand
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

class SoulFRAUnifiedLauncher extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 8888; // Lucky eights for the unified launcher
        
        // Biometric authentication methods
        this.authMethods = {
            voice: {
                enabled: true,
                accuracy: 0.95,
                samples: 3,
                features: ['pitch', 'rhythm', 'timbre', 'cadence']
            },
            face: {
                enabled: true,
                accuracy: 0.98,
                models: ['face-api', 'tensorflow'],
                features: ['landmarks', 'descriptors', 'expressions']
            },
            fingerprint: {
                enabled: true,
                accuracy: 0.99,
                fallback: 'webauthn'
            },
            behavior: {
                enabled: true,
                patterns: ['typing', 'mouse', 'gamepad', 'touchscreen']
            }
        };
        
        // Cross-device synchronization
        this.deviceSync = {
            strategy: 'diffused-reassembly',
            shards: 7, // Split data into 7 pieces
            redundancy: 3, // Each piece stored in 3 locations
            encryption: 'aes-256-gcm',
            compression: 'zstd'
        };
        
        // Unified identity system
        this.identity = {
            core: {
                soulId: null, // Universal identifier
                biometrics: {},
                devices: new Map(),
                sessions: new Map()
            },
            gaming: {
                characters: new Map(),
                inventory: new Map(),
                achievements: new Map(),
                progression: {}
            },
            social: {
                connections: new Set(),
                reputation: {},
                trades: []
            }
        };
        
        // Data diffusion network
        this.diffusionNetwork = {
            nodes: [
                { type: 'primary', url: 'wss://soul1.fra.network' },
                { type: 'secondary', url: 'wss://soul2.fra.network' },
                { type: 'tertiary', url: 'wss://soul3.fra.network' },
                { type: 'edge', url: 'wss://edge1.fra.network' },
                { type: 'edge', url: 'wss://edge2.fra.network' },
                { type: 'backup', url: 'wss://backup.fra.network' },
                { type: 'quantum', url: 'wss://quantum.fra.network' }
            ],
            activeConnections: new Map()
        };
        
        // Initialize database
        this.initDatabase();
        
        // Device capabilities detection
        this.deviceCapabilities = {
            hasCamera: false,
            hasMicrophone: false,
            hasFingerprint: false,
            hasFaceID: false,
            hasTouchID: false,
            hasSecureEnclave: false
        };
        
        // Gear and loot management
        this.inventory = {
            weapons: new Map(),
            armor: new Map(),
            vehicles: new Map(),
            currency: new Map(),
            special: new Map(),
            quantum: new Map()
        };
        
        // Integration points
        this.integrations = {
            cal: { connected: false, endpoint: 'http://localhost:7777' },
            deathtodata: { connected: false, endpoint: 'http://localhost:8080' },
            blamechain: { connected: false, endpoint: 'http://localhost:9999' },
            gaming: { connected: false, endpoint: 'http://localhost:3333' }
        };
    }
    
    async initDatabase() {
        this.db = new sqlite3.Database('./soulfra-unified.db');
        
        // Create tables for unified system
        const schemas = [
            `CREATE TABLE IF NOT EXISTS identities (
                soul_id TEXT PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                biometric_hash TEXT,
                master_key_encrypted TEXT,
                settings JSON
            )`,
            
            `CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                soul_id TEXT,
                device_name TEXT,
                device_type TEXT,
                capabilities JSON,
                trust_score REAL DEFAULT 0.5,
                last_sync DATETIME,
                FOREIGN KEY (soul_id) REFERENCES identities(soul_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS biometrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                soul_id TEXT,
                type TEXT,
                encrypted_template TEXT,
                accuracy_score REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (soul_id) REFERENCES identities(soul_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS inventory_shards (
                shard_id TEXT PRIMARY KEY,
                soul_id TEXT,
                shard_index INTEGER,
                encrypted_data TEXT,
                checksum TEXT,
                node_location TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (soul_id) REFERENCES identities(soul_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                soul_id TEXT,
                operation TEXT,
                data JSON,
                priority INTEGER DEFAULT 5,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const schema of schemas) {
            await new Promise((resolve, reject) => {
                this.db.run(schema, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        console.log('✅ SoulFRA Unified database initialized');
    }
    
    /**
     * Biometric enrollment
     */
    async enrollBiometric(soulId, type, data) {
        console.log(`📸 Enrolling ${type} biometric for ${soulId}`);
        
        // Process biometric data based on type
        let processed;
        switch (type) {
            case 'voice':
                processed = await this.processVoiceBiometric(data);
                break;
            case 'face':
                processed = await this.processFaceBiometric(data);
                break;
            case 'fingerprint':
                processed = await this.processFingerprintBiometric(data);
                break;
            case 'behavior':
                processed = await this.processBehaviorBiometric(data);
                break;
            default:
                throw new Error(`Unknown biometric type: ${type}`);
        }
        
        // Encrypt and store template
        const encrypted = this.encryptBiometric(processed);
        
        await new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO biometrics (soul_id, type, encrypted_template, accuracy_score) 
                 VALUES (?, ?, ?, ?)`,
                [soulId, type, encrypted, processed.accuracy],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        this.emit('biometric_enrolled', { soulId, type });
        return { success: true, accuracy: processed.accuracy };
    }
    
    async processVoiceBiometric(audioData) {
        // Simulated voice processing
        // In production, use actual voice recognition libraries
        const features = {
            pitch: this.extractPitch(audioData),
            rhythm: this.extractRhythm(audioData),
            timbre: this.extractTimbre(audioData),
            cadence: this.extractCadence(audioData)
        };
        
        return {
            template: JSON.stringify(features),
            accuracy: 0.92 + Math.random() * 0.06 // 92-98% accuracy
        };
    }
    
    async processFaceBiometric(imageData) {
        // Simulated face processing
        // In production, use face-api.js or similar
        const features = {
            landmarks: this.extractFaceLandmarks(imageData),
            descriptors: this.extractFaceDescriptors(imageData),
            expressions: this.extractExpressions(imageData)
        };
        
        return {
            template: JSON.stringify(features),
            accuracy: 0.95 + Math.random() * 0.04 // 95-99% accuracy
        };
    }
    
    async processFingerprintBiometric(scanData) {
        // Simulated fingerprint processing
        // In production, use WebAuthn or device APIs
        return {
            template: crypto.createHash('sha256').update(scanData).digest('hex'),
            accuracy: 0.99
        };
    }
    
    async processBehaviorBiometric(behaviorData) {
        // Analyze typing patterns, mouse movements, etc.
        const patterns = {
            typingSpeed: behaviorData.typingSpeed || 0,
            mousePrecision: behaviorData.mousePrecision || 0,
            gamepadStyle: behaviorData.gamepadStyle || 'default',
            touchPressure: behaviorData.touchPressure || []
        };
        
        return {
            template: JSON.stringify(patterns),
            accuracy: 0.85 + Math.random() * 0.10 // 85-95% accuracy
        };
    }
    
    // Placeholder extraction methods
    extractPitch(audio) { return Math.random() * 1000; }
    extractRhythm(audio) { return Math.random(); }
    extractTimbre(audio) { return Array(10).fill(0).map(() => Math.random()); }
    extractCadence(audio) { return Math.random() * 100; }
    extractFaceLandmarks(image) { return Array(68).fill(0).map(() => ({ x: Math.random() * 100, y: Math.random() * 100 })); }
    extractFaceDescriptors(image) { return Array(128).fill(0).map(() => Math.random()); }
    extractExpressions(image) { return { happy: Math.random(), sad: Math.random(), neutral: Math.random() }; }
    
    encryptBiometric(data) {
        const key = crypto.scryptSync('soulfra-biometric-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return JSON.stringify({
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        });
    }
    
    /**
     * Unified login with biometric verification
     */
    async unifiedLogin(deviceId, biometricData) {
        console.log('🔐 Attempting unified login...');
        
        // Find existing identity or create new
        let soulId = await this.findIdentityByDevice(deviceId);
        
        if (!soulId) {
            // First time login - create new identity
            soulId = this.generateSoulId();
            await this.createIdentity(soulId);
            await this.registerDevice(soulId, deviceId);
        }
        
        // Verify biometric
        const verified = await this.verifyBiometric(soulId, biometricData);
        
        if (!verified.success) {
            return { 
                success: false, 
                error: 'Biometric verification failed',
                accuracy: verified.accuracy 
            };
        }
        
        // Create session
        const session = await this.createSession(soulId, deviceId);
        
        // Sync data from network
        await this.syncFromNetwork(soulId);
        
        // Load inventory and progress
        const gameData = await this.loadGameData(soulId);
        
        return {
            success: true,
            soulId,
            session,
            gameData,
            message: 'Welcome back to SoulFRA!'
        };
    }
    
    async verifyBiometric(soulId, biometricData) {
        // Get stored biometric templates
        const templates = await new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM biometrics WHERE soul_id = ?',
                [soulId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Try each biometric type
        for (const template of templates) {
            if (biometricData.type === template.type) {
                const accuracy = await this.compareBiometrics(
                    template.encrypted_template,
                    biometricData
                );
                
                if (accuracy > this.authMethods[template.type].accuracy) {
                    return { success: true, accuracy };
                }
            }
        }
        
        return { success: false, accuracy: 0 };
    }
    
    async compareBiometrics(encryptedTemplate, newData) {
        // Decrypt template and compare
        // In production, use proper biometric comparison algorithms
        return 0.90 + Math.random() * 0.09; // Simulated comparison
    }
    
    /**
     * Data diffusion and synchronization
     */
    async diffuseData(soulId, data) {
        console.log('🌐 Diffusing data across network...');
        
        // Split data into shards
        const shards = this.shardData(data);
        
        // Distribute shards across network
        const distribution = [];
        
        for (let i = 0; i < shards.length; i++) {
            const shard = shards[i];
            const nodes = this.selectNodes(i);
            
            for (const node of nodes) {
                const shardId = crypto.randomBytes(16).toString('hex');
                
                // Store shard reference
                await new Promise((resolve, reject) => {
                    this.db.run(
                        `INSERT INTO inventory_shards 
                         (shard_id, soul_id, shard_index, encrypted_data, checksum, node_location)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            shardId,
                            soulId,
                            i,
                            shard.encrypted,
                            shard.checksum,
                            node.url
                        ],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
                
                distribution.push({ shardId, node: node.url });
            }
        }
        
        this.emit('data_diffused', { soulId, shards: shards.length });
        return distribution;
    }
    
    shardData(data) {
        const json = JSON.stringify(data);
        const chunkSize = Math.ceil(json.length / this.deviceSync.shards);
        const shards = [];
        
        for (let i = 0; i < this.deviceSync.shards; i++) {
            const chunk = json.slice(i * chunkSize, (i + 1) * chunkSize);
            
            // Encrypt each shard
            const key = crypto.scryptSync(`shard-${i}`, 'soulfra', 32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.deviceSync.encryption, key, iv);
            
            let encrypted = cipher.update(chunk, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            shards.push({
                index: i,
                encrypted: encrypted + ':' + iv.toString('hex'),
                checksum: crypto.createHash('sha256').update(chunk).digest('hex')
            });
        }
        
        return shards;
    }
    
    selectNodes(shardIndex) {
        // Select nodes for redundancy
        const nodes = [];
        const nodeTypes = ['primary', 'secondary', 'edge'];
        
        for (let i = 0; i < this.deviceSync.redundancy; i++) {
            const nodeType = nodeTypes[i % nodeTypes.length];
            const availableNodes = this.diffusionNetwork.nodes.filter(n => n.type === nodeType);
            
            if (availableNodes.length > 0) {
                const node = availableNodes[shardIndex % availableNodes.length];
                nodes.push(node);
            }
        }
        
        return nodes;
    }
    
    async reassembleData(soulId) {
        console.log('🔄 Reassembling diffused data...');
        
        // Get all shards for user
        const shards = await new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM inventory_shards WHERE soul_id = ? ORDER BY shard_index`,
                [soulId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Group by shard index
        const shardGroups = {};
        shards.forEach(shard => {
            if (!shardGroups[shard.shard_index]) {
                shardGroups[shard.shard_index] = [];
            }
            shardGroups[shard.shard_index].push(shard);
        });
        
        // Reassemble data
        const chunks = [];
        
        for (let i = 0; i < this.deviceSync.shards; i++) {
            const group = shardGroups[i];
            if (!group || group.length === 0) {
                throw new Error(`Missing shard ${i}`);
            }
            
            // Use first available shard (could implement voting for integrity)
            const shard = group[0];
            const [encrypted, ivHex] = shard.encrypted_data.split(':');
            
            // Decrypt shard
            const key = crypto.scryptSync(`shard-${i}`, 'soulfra', 32);
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(this.deviceSync.encryption, key, iv);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            chunks.push(decrypted);
        }
        
        // Parse reassembled data
        const fullData = chunks.join('');
        return JSON.parse(fullData);
    }
    
    /**
     * Cross-device synchronization
     */
    async syncToDevice(soulId, targetDeviceId, data) {
        console.log(`📱 Syncing to device ${targetDeviceId}...`);
        
        // Add to sync queue
        await new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO sync_queue (soul_id, operation, data, priority)
                 VALUES (?, ?, ?, ?)`,
                [soulId, 'sync_to_device', JSON.stringify({ targetDeviceId, data }), 1],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Process sync
        await this.processSyncQueue(soulId);
        
        return { success: true, synced: true };
    }
    
    async processSyncQueue(soulId) {
        const items = await new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM sync_queue 
                 WHERE soul_id = ? AND status = 'pending'
                 ORDER BY priority, created_at`,
                [soulId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        for (const item of items) {
            try {
                await this.executeSyncOperation(item);
                
                // Mark as completed
                await new Promise((resolve, reject) => {
                    this.db.run(
                        `UPDATE sync_queue SET status = 'completed' WHERE id = ?`,
                        [item.id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            } catch (error) {
                console.error('Sync operation failed:', error);
                
                // Mark as failed
                await new Promise((resolve, reject) => {
                    this.db.run(
                        `UPDATE sync_queue SET status = 'failed' WHERE id = ?`,
                        [item.id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }
    }
    
    async executeSyncOperation(item) {
        const data = JSON.parse(item.data);
        
        switch (item.operation) {
            case 'sync_to_device':
                await this.sendToDevice(data.targetDeviceId, data.data);
                break;
            case 'sync_inventory':
                await this.syncInventory(item.soul_id);
                break;
            case 'sync_progress':
                await this.syncProgress(item.soul_id);
                break;
            default:
                console.warn(`Unknown sync operation: ${item.operation}`);
        }
    }
    
    /**
     * Inventory and game data management
     */
    async saveInventory(soulId, inventory) {
        console.log('💾 Saving inventory...');
        
        // Diffuse inventory data across network
        await this.diffuseData(soulId, {
            type: 'inventory',
            timestamp: Date.now(),
            data: inventory
        });
        
        // Update local cache
        this.identity.gaming.inventory.set(soulId, inventory);
        
        this.emit('inventory_saved', { soulId });
    }
    
    async loadGameData(soulId) {
        try {
            // Try to reassemble from network
            const diffusedData = await this.reassembleData(soulId);
            
            if (diffusedData && diffusedData.type === 'inventory') {
                return diffusedData.data;
            }
        } catch (error) {
            console.warn('Failed to reassemble data, using cache:', error.message);
        }
        
        // Fall back to local cache
        return this.identity.gaming.inventory.get(soulId) || {
            weapons: [],
            armor: [],
            vehicles: [],
            currency: { gold: 0, credits: 0, crypto: 0 },
            special: []
        };
    }
    
    /**
     * Integration with other systems
     */
    async connectToCAL() {
        console.log('🤖 Connecting to CAL MMORPG...');
        
        try {
            const ws = new WebSocket('ws://localhost:7778');
            
            ws.on('open', () => {
                console.log('✅ Connected to CAL MMORPG');
                this.integrations.cal.connected = true;
                this.integrations.cal.ws = ws;
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleCALMessage(message);
            });
            
            ws.on('error', (error) => {
                console.error('CAL connection error:', error);
                this.integrations.cal.connected = false;
            });
        } catch (error) {
            console.error('Failed to connect to CAL:', error);
        }
    }
    
    handleCALMessage(message) {
        switch (message.type) {
            case 'inventory_update':
                this.saveInventory(message.playerId, message.inventory);
                break;
            case 'achievement_unlocked':
                this.identity.gaming.achievements.set(
                    message.achievementId,
                    message.achievement
                );
                break;
            case 'player_data_request':
                // Send player data back to CAL
                const data = this.loadGameData(message.playerId);
                this.integrations.cal.ws.send(JSON.stringify({
                    type: 'player_data_response',
                    playerId: message.playerId,
                    data
                }));
                break;
        }
    }
    
    /**
     * Helper methods
     */
    generateSoulId() {
        // Generate unique soul ID with meaning
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        const soul = 'SOUL';
        
        return `${soul}-${timestamp}-${random}`;
    }
    
    async createIdentity(soulId) {
        const masterKey = crypto.randomBytes(32).toString('hex');
        const encryptedKey = this.encryptMasterKey(masterKey);
        
        await new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO identities (soul_id, master_key_encrypted, settings)
                 VALUES (?, ?, ?)`,
                [soulId, encryptedKey, JSON.stringify({ theme: 'quantum' })],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    async registerDevice(soulId, deviceId) {
        const capabilities = await this.detectDeviceCapabilities();
        
        await new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO devices (device_id, soul_id, device_name, device_type, capabilities)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    deviceId,
                    soulId,
                    this.getDeviceName(),
                    this.getDeviceType(),
                    JSON.stringify(capabilities)
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    async createSession(soulId, deviceId) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const token = this.generateJWT(soulId, deviceId);
        
        this.identity.core.sessions.set(sessionId, {
            soulId,
            deviceId,
            token,
            created: Date.now(),
            lastActivity: Date.now()
        });
        
        return { sessionId, token };
    }
    
    encryptMasterKey(key) {
        // Use hardware security if available
        if (this.deviceCapabilities.hasSecureEnclave) {
            return this.secureEnclaveEncrypt(key);
        }
        
        // Otherwise use standard encryption
        const cipher = crypto.createCipher('aes-256-gcm', 'soulfra-master');
        let encrypted = cipher.update(key, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    secureEnclaveEncrypt(data) {
        // Placeholder for hardware security
        // In production, use actual secure enclave APIs
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    async detectDeviceCapabilities() {
        // In a real implementation, this would check actual device capabilities
        return {
            hasCamera: true,
            hasMicrophone: true,
            hasFingerprint: Math.random() > 0.5,
            hasFaceID: Math.random() > 0.7,
            hasTouchID: Math.random() > 0.6,
            hasSecureEnclave: Math.random() > 0.8,
            platform: process.platform,
            arch: process.arch
        };
    }
    
    getDeviceName() {
        const names = ['Gaming Rig', 'Mobile Device', 'Laptop', 'Tablet', 'Console'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    getDeviceType() {
        const types = ['desktop', 'mobile', 'tablet', 'console', 'vr'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    generateJWT(soulId, deviceId) {
        // Simplified JWT generation
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = Buffer.from(JSON.stringify({
            soulId,
            deviceId,
            iat: Date.now(),
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        })).toString('base64');
        
        const signature = crypto
            .createHmac('sha256', 'soulfra-secret')
            .update(`${header}.${payload}`)
            .digest('base64');
        
        return `${header}.${payload}.${signature}`;
    }
    
    async findIdentityByDevice(deviceId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT soul_id FROM devices WHERE device_id = ?',
                [deviceId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.soul_id || null);
                }
            );
        });
    }
    
    async syncFromNetwork(soulId) {
        console.log('🔄 Syncing from network...');
        
        // Connect to diffusion nodes
        for (const node of this.diffusionNetwork.nodes) {
            try {
                await this.connectToNode(node);
            } catch (error) {
                console.warn(`Failed to connect to ${node.url}:`, error.message);
            }
        }
        
        // Request latest data
        this.emit('sync_requested', { soulId });
    }
    
    async connectToNode(node) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(node.url);
            
            ws.on('open', () => {
                this.diffusionNetwork.activeConnections.set(node.url, ws);
                resolve(ws);
            });
            
            ws.on('error', reject);
            
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
    }
    
    async sendToDevice(deviceId, data) {
        // Find device connection and send data
        // In production, this would use push notifications or WebSocket
        console.log(`Sending data to device ${deviceId}:`, data);
    }
    
    /**
     * Start the unified launcher server
     */
    async start() {
        // Setup Express routes
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // API endpoints
        this.app.post('/api/login', async (req, res) => {
            try {
                const result = await this.unifiedLogin(
                    req.body.deviceId,
                    req.body.biometric
                );
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/enroll', async (req, res) => {
            try {
                const result = await this.enrollBiometric(
                    req.body.soulId,
                    req.body.type,
                    req.body.data
                );
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/sync/:soulId', async (req, res) => {
            try {
                await this.syncFromNetwork(req.params.soulId);
                const data = await this.loadGameData(req.params.soulId);
                res.json({ success: true, data });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/save', async (req, res) => {
            try {
                await this.saveInventory(req.body.soulId, req.body.inventory);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Serve launcher interface
        this.app.get('/', (req, res) => {
            res.send(this.generateLauncherHTML());
        });
        
        // Start server
        this.app.listen(this.port, () => {
            console.log(`🚀 SoulFRA Unified Launcher running on http://localhost:${this.port}`);
            console.log('🔐 Biometric authentication enabled');
            console.log('🌐 Cross-device sync ready');
            console.log('🎮 Game integration active');
        });
        
        // Connect to other systems
        await this.connectToCAL();
        
        // Start sync processor
        setInterval(() => this.processPendingSyncs(), 5000);
    }
    
    async processPendingSyncs() {
        // Process any pending sync operations
        const souls = Array.from(this.identity.core.sessions.values())
            .map(s => s.soulId)
            .filter((v, i, a) => a.indexOf(v) === i); // Unique
        
        for (const soulId of souls) {
            await this.processSyncQueue(soulId);
        }
    }
    
    generateLauncherHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SoulFRA Unified Launcher - One Login, Every Device</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(135deg, #000428 0%, #004e92 100%);
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .launcher-container {
            background: rgba(0, 0, 0, 0.8);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        h1 {
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .tagline {
            text-align: center;
            margin-bottom: 40px;
            color: #888;
            font-size: 0.9em;
        }
        
        .biometric-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .biometric-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .biometric-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .biometric-btn.active {
            background: rgba(102, 126, 234, 0.2);
            border-color: #667eea;
        }
        
        .biometric-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .biometric-name {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .biometric-status {
            font-size: 0.8em;
            color: #888;
        }
        
        .login-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 20px;
        }
        
        .login-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .login-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .device-info {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .device-info h3 {
            margin-bottom: 10px;
            color: #667eea;
        }
        
        .device-list {
            font-size: 0.9em;
            line-height: 1.8;
        }
        
        .sync-status {
            text-align: center;
            padding: 20px;
            background: rgba(0, 255, 0, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 0, 0.3);
            margin-top: 20px;
            display: none;
        }
        
        .sync-status.active {
            display: block;
        }
        
        .recording-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff0000;
            padding: 10px 20px;
            border-radius: 20px;
            display: none;
            align-items: center;
            gap: 10px;
        }
        
        .recording-indicator.active {
            display: flex;
        }
        
        .recording-dot {
            width: 10px;
            height: 10px;
            background: #fff;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
        
        .face-capture {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #000;
            padding: 20px;
            border-radius: 20px;
            display: none;
            z-index: 1000;
        }
        
        .face-capture.active {
            display: block;
        }
        
        video {
            width: 320px;
            height: 240px;
            border-radius: 10px;
        }
        
        .integration-status {
            display: flex;
            justify-content: space-around;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .integration {
            text-align: center;
            font-size: 0.8em;
        }
        
        .integration-icon {
            width: 30px;
            height: 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 5px;
        }
        
        .integration.connected .integration-icon {
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid rgba(0, 255, 0, 0.5);
        }
    </style>
</head>
<body>
    <div class="launcher-container">
        <h1>SoulFRA</h1>
        <p class="tagline">One login, every device, all your gear</p>
        
        <div class="device-info">
            <h3>Connected Devices</h3>
            <div class="device-list" id="device-list">
                <div>🖥️ Gaming Desktop - Active</div>
                <div>📱 iPhone 15 Pro - Synced</div>
                <div>💻 MacBook Pro - Ready</div>
                <div>📱 Kyocera Flip - Authenticated</div>
            </div>
        </div>
        
        <div class="biometric-options">
            <div class="biometric-btn" onclick="selectBiometric('voice')">
                <div class="biometric-icon">🎤</div>
                <div class="biometric-name">Voice</div>
                <div class="biometric-status">Ready</div>
            </div>
            
            <div class="biometric-btn" onclick="selectBiometric('face')">
                <div class="biometric-icon">😊</div>
                <div class="biometric-name">Face</div>
                <div class="biometric-status">Available</div>
            </div>
            
            <div class="biometric-btn" onclick="selectBiometric('fingerprint')">
                <div class="biometric-icon">👆</div>
                <div class="biometric-name">Touch</div>
                <div class="biometric-status">Device Ready</div>
            </div>
            
            <div class="biometric-btn" onclick="selectBiometric('behavior')">
                <div class="biometric-icon">🎮</div>
                <div class="biometric-name">Behavior</div>
                <div class="biometric-status">Learning</div>
            </div>
        </div>
        
        <button class="login-btn" onclick="unifiedLogin()" id="login-btn">
            🔐 Unified Login
        </button>
        
        <div class="sync-status" id="sync-status">
            <div>✅ Synced across all devices</div>
            <div style="font-size: 0.8em; margin-top: 10px;">
                Last sync: Just now • Next auto-sync: 5 minutes
            </div>
        </div>
        
        <div class="integration-status">
            <div class="integration connected">
                <div class="integration-icon">🎮</div>
                <div>CAL MMORPG</div>
            </div>
            <div class="integration connected">
                <div class="integration-icon">💀</div>
                <div>DeathToData</div>
            </div>
            <div class="integration">
                <div class="integration-icon">⛓️</div>
                <div>BlameChain</div>
            </div>
            <div class="integration connected">
                <div class="integration-icon">🌐</div>
                <div>Gaming Hub</div>
            </div>
        </div>
    </div>
    
    <div class="recording-indicator" id="recording-indicator">
        <div class="recording-dot"></div>
        <span>Recording biometric...</span>
    </div>
    
    <div class="face-capture" id="face-capture">
        <video id="video" autoplay></video>
    </div>
    
    <script>
        let selectedBiometric = null;
        let deviceId = localStorage.getItem('soulfra-device-id') || generateDeviceId();
        
        function generateDeviceId() {
            const id = 'device-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('soulfra-device-id', id);
            return id;
        }
        
        function selectBiometric(type) {
            selectedBiometric = type;
            
            // Update UI
            document.querySelectorAll('.biometric-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
            
            // Enable login button
            document.getElementById('login-btn').disabled = false;
        }
        
        async function unifiedLogin() {
            if (!selectedBiometric) {
                alert('Please select a biometric method');
                return;
            }
            
            const loginBtn = document.getElementById('login-btn');
            loginBtn.disabled = true;
            loginBtn.textContent = '🔄 Authenticating...';
            
            try {
                // Capture biometric
                const biometricData = await captureBiometric(selectedBiometric);
                
                // Send to server
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId,
                        biometric: biometricData
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    loginBtn.textContent = '✅ Authenticated!';
                    document.getElementById('sync-status').classList.add('active');
                    
                    // Store session
                    localStorage.setItem('soulfra-session', result.session.token);
                    localStorage.setItem('soulfra-soul-id', result.soulId);
                    
                    // Redirect to game after delay
                    setTimeout(() => {
                        window.location.href = 'http://localhost:7777';
                    }, 2000);
                } else {
                    throw new Error(result.error || 'Authentication failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                loginBtn.textContent = '❌ Authentication Failed';
                setTimeout(() => {
                    loginBtn.disabled = false;
                    loginBtn.textContent = '🔐 Unified Login';
                }, 3000);
            }
        }
        
        async function captureBiometric(type) {
            const indicator = document.getElementById('recording-indicator');
            
            switch (type) {
                case 'voice':
                    return captureVoice();
                case 'face':
                    return captureFace();
                case 'fingerprint':
                    return captureFingerprint();
                case 'behavior':
                    return captureBehavior();
            }
        }
        
        async function captureVoice() {
            const indicator = document.getElementById('recording-indicator');
            indicator.classList.add('active');
            
            // Simulate voice capture
            return new Promise((resolve) => {
                setTimeout(() => {
                    indicator.classList.remove('active');
                    resolve({
                        type: 'voice',
                        data: 'simulated-voice-data-' + Math.random()
                    });
                }, 3000);
            });
        }
        
        async function captureFace() {
            const faceCapture = document.getElementById('face-capture');
            const video = document.getElementById('video');
            
            faceCapture.classList.add('active');
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                
                return new Promise((resolve) => {
                    setTimeout(() => {
                        // Capture frame
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.getContext('2d').drawImage(video, 0, 0);
                        
                        // Stop stream
                        stream.getTracks().forEach(track => track.stop());
                        faceCapture.classList.remove('active');
                        
                        resolve({
                            type: 'face',
                            data: canvas.toDataURL('image/jpeg')
                        });
                    }, 3000);
                });
            } catch (error) {
                console.error('Camera error:', error);
                faceCapture.classList.remove('active');
                
                // Fallback to simulated data
                return {
                    type: 'face',
                    data: 'simulated-face-data-' + Math.random()
                };
            }
        }
        
        async function captureFingerprint() {
            // Simulate fingerprint capture
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        type: 'fingerprint',
                        data: 'simulated-fingerprint-' + Math.random()
                    });
                }, 1000);
            });
        }
        
        async function captureBehavior() {
            // Capture typing/mouse patterns
            const patterns = {
                typingSpeed: Math.random() * 100 + 50,
                mousePrecision: Math.random(),
                gamepadStyle: 'aggressive',
                touchPressure: []
            };
            
            return {
                type: 'behavior',
                data: patterns
            };
        }
        
        // Check for existing session
        const existingSession = localStorage.getItem('soulfra-session');
        if (existingSession) {
            // Auto-login with stored session
            document.getElementById('login-btn').textContent = '✅ Session Active';
            document.getElementById('sync-status').classList.add('active');
        }
    </script>
</body>
</html>`;
    }
}

// Export for use in other systems
module.exports = SoulFRAUnifiedLauncher;

// Start if run directly
if (require.main === module) {
    const launcher = new SoulFRAUnifiedLauncher();
    launcher.start().catch(console.error);
}