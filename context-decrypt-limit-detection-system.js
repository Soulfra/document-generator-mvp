// context-decrypt-limit-detection-system.js - Context Limit Detection & Decrypt System
// Detects when hitting context limits, shows visual indicators, uses bcrypt for decrypt
// First decrypt layer for everything else in the system

const { EventEmitter } = require('events');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const zlib = require('zlib');

console.log(`
🔐 CONTEXT DECRYPT & LIMIT DETECTION SYSTEM 🔐
Detects context/memory limits with visual color indicators
Uses bcrypt as first decrypt dependency for everything
Compresses and encrypts context when limits hit
Auto-decrypt system for session recovery
`);

class ContextDecryptLimitDetectionSystem extends EventEmitter {
    constructor() {
        super();
        
        // Context limit configuration
        this.contextLimits = {
            // Memory limits (in MB)
            memory: {
                warning: 500,    // Yellow warning
                critical: 750,   // Orange critical  
                emergency: 1000  // Red emergency decrypt
            },
            
            // Token/conversation limits
            tokens: {
                warning: 50000,   // Yellow warning
                critical: 75000,  // Orange critical
                emergency: 100000 // Red emergency decrypt
            },
            
            // Process limits
            processes: {
                warning: 30,     // Yellow warning
                critical: 45,    // Orange critical
                emergency: 60    // Red emergency decrypt
            },
            
            // Layer count limits
            layers: {
                warning: 50,     // Yellow warning
                critical: 70,    // Orange critical  
                emergency: 85    // Red emergency decrypt
            }
        };
        
        // Visual color indicators
        this.colorStates = {
            normal: {
                color: '#00ff88',    // Green
                background: '#0a0a0a',
                status: 'NORMAL'
            },
            warning: {
                color: '#ffff00',    // Yellow
                background: '#2a2a00', 
                status: 'WARNING'
            },
            critical: {
                color: '#ff8800',    // Orange
                background: '#2a1a00',
                status: 'CRITICAL'
            },
            emergency: {
                color: '#ff0000',    // Red
                background: '#2a0000',
                status: 'EMERGENCY'
            },
            decrypt: {
                color: '#ff00ff',    // Magenta
                background: '#2a002a',
                status: 'DECRYPTING'
            }
        };
        
        // bcrypt configuration for first decrypt layer
        this.bcryptConfig = {
            saltRounds: 12,
            masterSalt: '$2b$12$Context.Decrypt.Master.Salt.Here',
            contextKey: 'DGAI_CONTEXT_DECRYPT_2025',
            compressionLevel: 9
        };
        
        // Current system state
        this.currentState = {
            level: 'normal',
            memory_usage: 0,
            token_count: 0,
            process_count: 0,
            layer_count: 74, // We're at layer 74 now
            last_check: Date.now(),
            decrypt_active: false
        };
        
        // Encrypted context storage
        this.encryptedContexts = new Map();
        this.decryptedSessions = new Map();
        
        // Monitoring intervals
        this.monitoringInterval = null;
        this.colorUpdateInterval = null;
        
        console.log('🔐 Context Decrypt & Limit Detection System initializing...');
        this.initializeSystem();
    }
    
    async initializeSystem() {
        // Setup bcrypt for context encryption
        await this.setupBcryptDecryption();
        
        // Start context monitoring
        this.startContextMonitoring();
        
        // Start color state updates
        this.startColorStateUpdates();
        
        // Setup emergency decrypt triggers
        this.setupEmergencyDecryptTriggers();
        
        console.log('🔐 Context Decrypt System ready!');
        console.log(`🎨 Current State: ${this.currentState.level.toUpperCase()}`);
        console.log(`🧠 Layer Count: ${this.currentState.layer_count}`);
    }
    
    async setupBcryptDecryption() {
        console.log('🔐 Setting up bcrypt decryption system...');
        
        // Generate master hash for context encryption
        this.masterHash = await bcrypt.hash(this.bcryptConfig.contextKey, this.bcryptConfig.saltRounds);
        
        // Create context encryption methods
        this.contextCrypto = {
            encrypt: async (data) => {
                try {
                    // 1. Stringify and compress data
                    const jsonData = JSON.stringify(data);
                    const compressed = zlib.gzipSync(jsonData, { level: this.bcryptConfig.compressionLevel });
                    
                    // 2. Create encryption key from bcrypt hash
                    const encryptionKey = crypto.scryptSync(this.masterHash, 'context-salt', 32);
                    
                    // 3. Encrypt compressed data
                    const iv = crypto.randomBytes(16);
                    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
                    
                    let encrypted = cipher.update(compressed);
                    encrypted = Buffer.concat([encrypted, cipher.final()]);
                    
                    // 4. Return encrypted package
                    return {
                        iv: iv.toString('hex'),
                        data: encrypted.toString('hex'),
                        compressed_size: compressed.length,
                        original_size: jsonData.length,
                        timestamp: Date.now()
                    };
                } catch (error) {
                    console.error('❌ Context encryption failed:', error.message);
                    throw error;
                }
            },
            
            decrypt: async (encryptedPackage) => {
                try {
                    // 1. Recreate encryption key
                    const encryptionKey = crypto.scryptSync(this.masterHash, 'context-salt', 32);
                    
                    // 2. Decrypt data
                    const iv = Buffer.from(encryptedPackage.iv, 'hex');
                    const encryptedData = Buffer.from(encryptedPackage.data, 'hex');
                    
                    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
                    let decrypted = decipher.update(encryptedData);
                    decrypted = Buffer.concat([decrypted, decipher.final()]);
                    
                    // 3. Decompress data
                    const decompressed = zlib.gunzipSync(decrypted);
                    
                    // 4. Parse JSON
                    const originalData = JSON.parse(decompressed.toString());
                    
                    console.log(`🔓 Context decrypted: ${encryptedPackage.original_size} bytes recovered`);
                    return originalData;
                } catch (error) {
                    console.error('❌ Context decryption failed:', error.message);
                    throw error;
                }
            }
        };
        
        console.log('🔐 bcrypt decryption system ready');
    }
    
    startContextMonitoring() {
        console.log('👁️ Starting context limit monitoring...');
        
        this.monitoringInterval = setInterval(() => {
            this.checkContextLimits();
        }, 5000); // Check every 5 seconds
        
        // Initial check
        this.checkContextLimits();
    }
    
    checkContextLimits() {
        // Get current system metrics
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        // Update current state
        this.currentState.memory_usage = heapUsedMB;
        this.currentState.process_count = this.getProcessCount();
        this.currentState.token_count = this.estimateTokenCount();
        this.currentState.last_check = Date.now();
        
        // Determine limit level
        const newLevel = this.determineLimitLevel();
        
        if (newLevel !== this.currentState.level) {
            this.handleLevelChange(this.currentState.level, newLevel);
            this.currentState.level = newLevel;
        }
        
        // Emit monitoring update
        this.emit('context_monitoring', {
            ...this.currentState,
            color_state: this.colorStates[this.currentState.level]
        });
    }
    
    determineLimitLevel() {
        const { memory_usage, token_count, process_count, layer_count } = this.currentState;
        
        // Check for emergency level (any metric)
        if (memory_usage >= this.contextLimits.memory.emergency ||
            token_count >= this.contextLimits.tokens.emergency ||
            process_count >= this.contextLimits.processes.emergency ||
            layer_count >= this.contextLimits.layers.emergency) {
            return 'emergency';
        }
        
        // Check for critical level (any metric)
        if (memory_usage >= this.contextLimits.memory.critical ||
            token_count >= this.contextLimits.tokens.critical ||
            process_count >= this.contextLimits.processes.critical ||
            layer_count >= this.contextLimits.layers.critical) {
            return 'critical';
        }
        
        // Check for warning level (any metric)
        if (memory_usage >= this.contextLimits.memory.warning ||
            token_count >= this.contextLimits.tokens.warning ||
            process_count >= this.contextLimits.processes.warning ||
            layer_count >= this.contextLimits.layers.warning) {
            return 'warning';
        }
        
        return 'normal';
    }
    
    handleLevelChange(oldLevel, newLevel) {
        console.log(`🚨 Context limit level changed: ${oldLevel.toUpperCase()} → ${newLevel.toUpperCase()}`);
        
        const colorState = this.colorStates[newLevel];
        console.log(`🎨 Color state: ${colorState.status} (${colorState.color})`);
        
        // Handle specific level changes
        switch (newLevel) {
            case 'warning':
                this.handleWarningLevel();
                break;
            case 'critical':
                this.handleCriticalLevel();
                break;
            case 'emergency':
                this.handleEmergencyLevel();
                break;
            case 'normal':
                this.handleNormalLevel();
                break;
        }
        
        // Emit level change event
        this.emit('level_changed', {
            old_level: oldLevel,
            new_level: newLevel,
            color_state: colorState,
            timestamp: Date.now()
        });
    }
    
    handleWarningLevel() {
        console.log('⚠️ WARNING: Approaching context limits');
        console.log('💡 Consider: Optimize memory usage, reduce active processes');
    }
    
    handleCriticalLevel() {
        console.log('🚨 CRITICAL: Context limits nearly exceeded');
        console.log('💡 Consider: Encrypt non-essential context, reduce layer count');
        
        // Start preparing for potential decrypt
        this.prepareForDecrypt();
    }
    
    async handleEmergencyLevel() {
        console.log('🔥 EMERGENCY: Context limits exceeded - triggering decrypt');
        
        // Trigger emergency context encryption
        await this.triggerEmergencyDecrypt();
    }
    
    handleNormalLevel() {
        console.log('✅ NORMAL: Context within safe limits');
        
        // Restore any encrypted context if needed
        this.restoreEncryptedContext();
    }
    
    async prepareForDecrypt() {
        console.log('🔐 Preparing for context decrypt...');
        
        // Identify non-essential context for encryption
        const contextToEncrypt = this.identifyEncryptableContext();
        
        if (contextToEncrypt.length > 0) {
            console.log(`📦 Identified ${contextToEncrypt.length} items for potential encryption`);
        }
    }
    
    async triggerEmergencyDecrypt() {
        console.log('🔥 EMERGENCY DECRYPT TRIGGERED');
        
        this.currentState.level = 'decrypt';
        this.currentState.decrypt_active = true;
        
        try {
            // 1. Identify and encrypt large context chunks
            const contextToEncrypt = this.identifyEncryptableContext();
            
            for (const contextItem of contextToEncrypt) {
                const encryptedItem = await this.contextCrypto.encrypt(contextItem.data);
                
                this.encryptedContexts.set(contextItem.id, {
                    ...encryptedItem,
                    metadata: contextItem.metadata,
                    type: contextItem.type
                });
                
                console.log(`🔐 Encrypted context item: ${contextItem.id} (${encryptedItem.original_size} → ${encryptedItem.compressed_size} bytes)`);
            }
            
            // 2. Force garbage collection
            if (global.gc) {
                global.gc();
                console.log('🧹 Forced garbage collection');
            }
            
            // 3. Emit decrypt completion
            this.emit('emergency_decrypt_complete', {
                items_encrypted: contextToEncrypt.length,
                memory_freed: this.calculateMemoryFreed(),
                timestamp: Date.now()
            });
            
            console.log('✅ Emergency decrypt completed');
            
        } catch (error) {
            console.error('❌ Emergency decrypt failed:', error.message);
        } finally {
            this.currentState.decrypt_active = false;
        }
    }
    
    identifyEncryptableContext() {
        // Mock implementation - in real system this would identify large context chunks
        const encryptableItems = [
            {
                id: 'layer_definitions',
                type: 'system_config',
                data: { layers: Array(74).fill(null).map((_, i) => ({ id: i, status: 'active' })) },
                metadata: { size: 50000, importance: 'low' }
            },
            {
                id: 'process_history',
                type: 'execution_log',
                data: { logs: Array(1000).fill('log entry') },
                metadata: { size: 30000, importance: 'medium' }
            },
            {
                id: 'api_responses',
                type: 'cache_data',
                data: { responses: Array(500).fill('cached response') },
                metadata: { size: 25000, importance: 'low' }
            }
        ];
        
        // Sort by size (largest first) and filter by importance
        return encryptableItems
            .filter(item => item.metadata.importance !== 'high')
            .sort((a, b) => b.metadata.size - a.metadata.size);
    }
    
    async restoreEncryptedContext() {
        if (this.encryptedContexts.size === 0) return;
        
        console.log(`🔓 Restoring ${this.encryptedContexts.size} encrypted context items...`);
        
        for (const [itemId, encryptedItem] of this.encryptedContexts) {
            try {
                const decryptedData = await this.contextCrypto.decrypt(encryptedItem);
                
                this.decryptedSessions.set(itemId, {
                    data: decryptedData,
                    metadata: encryptedItem.metadata,
                    restored_at: Date.now()
                });
                
                console.log(`🔓 Restored context item: ${itemId}`);
            } catch (error) {
                console.error(`❌ Failed to restore context item ${itemId}:`, error.message);
            }
        }
        
        // Clear encrypted storage after restoration
        this.encryptedContexts.clear();
    }
    
    startColorStateUpdates() {
        console.log('🎨 Starting color state updates...');
        
        this.colorUpdateInterval = setInterval(() => {
            this.updateVisualIndicators();
        }, 2000); // Update colors every 2 seconds
    }
    
    updateVisualIndicators() {
        const colorState = this.colorStates[this.currentState.level];
        
        // Emit color update for UI systems
        this.emit('color_update', {
            level: this.currentState.level,
            color: colorState.color,
            background: colorState.background,
            status: colorState.status,
            metrics: {
                memory: this.currentState.memory_usage,
                tokens: this.currentState.token_count,
                processes: this.currentState.process_count,
                layers: this.currentState.layer_count
            }
        });
    }
    
    setupEmergencyDecryptTriggers() {
        // Setup additional emergency triggers
        process.on('warning', (warning) => {
            if (warning.name === 'MaxListenersExceededWarning') {
                console.log('⚠️ MaxListeners warning detected - potential context limit issue');
                this.currentState.process_count += 5; // Artificial bump to trigger check
            }
        });
        
        // Memory pressure detection
        if (process.env.NODE_ENV !== 'production') {
            setInterval(() => {
                const memUsage = process.memoryUsage();
                if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
                    console.log('🧠 High memory pressure detected');
                    this.handleCriticalLevel();
                }
            }, 10000);
        }
    }
    
    // Utility methods
    getProcessCount() {
        // Mock process count - in real system would count actual processes
        return Math.floor(Math.random() * 40) + this.currentState.layer_count;
    }
    
    estimateTokenCount() {
        // Mock token estimation - in real system would count conversation tokens
        return Math.floor(Math.random() * 20000) + (this.currentState.layer_count * 1000);
    }
    
    calculateMemoryFreed() {
        // Mock memory calculation
        return this.encryptedContexts.size * 15000; // Estimated bytes freed per item
    }
    
    // API Methods
    getContextStatus() {
        return {
            current_state: this.currentState,
            color_state: this.colorStates[this.currentState.level],
            limits: this.contextLimits,
            encrypted_items: this.encryptedContexts.size,
            decrypted_sessions: this.decryptedSessions.size,
            bcrypt_ready: !!this.masterHash
        };
    }
    
    async manualDecrypt(itemId) {
        if (!this.encryptedContexts.has(itemId)) {
            throw new Error(`Encrypted item ${itemId} not found`);
        }
        
        const encryptedItem = this.encryptedContexts.get(itemId);
        const decryptedData = await this.contextCrypto.decrypt(encryptedItem);
        
        return {
            item_id: itemId,
            data: decryptedData,
            metadata: encryptedItem.metadata,
            decrypted_at: Date.now()
        };
    }
    
    async manualEncrypt(itemId, data) {
        const encryptedData = await this.contextCrypto.encrypt(data);
        
        this.encryptedContexts.set(itemId, {
            ...encryptedData,
            metadata: { manual_encrypt: true, item_id: itemId },
            type: 'manual'
        });
        
        return {
            item_id: itemId,
            encrypted_size: encryptedData.data.length,
            compression_ratio: encryptedData.compressed_size / encryptedData.original_size,
            encrypted_at: Date.now()
        };
    }
    
    cleanup() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.colorUpdateInterval) {
            clearInterval(this.colorUpdateInterval);
        }
        
        console.log('🧹 Context Decrypt System cleanup completed');
    }
}

// Export for use
module.exports = ContextDecryptLimitDetectionSystem;

// If run directly, start the service
if (require.main === module) {
    console.log('🔐 Starting Context Decrypt & Limit Detection System...');
    
    const contextSystem = new ContextDecryptLimitDetectionSystem();
    
    // Set up Express API
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 9704;
    
    app.use(express.json());
    
    // Get context status
    app.get('/api/context/status', (req, res) => {
        const status = contextSystem.getContextStatus();
        res.json(status);
    });
    
    // Manual decrypt item
    app.post('/api/context/decrypt/:itemId', async (req, res) => {
        try {
            const result = await contextSystem.manualDecrypt(req.params.itemId);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Manual encrypt data
    app.post('/api/context/encrypt', async (req, res) => {
        try {
            const { itemId, data } = req.body;
            const result = await contextSystem.manualEncrypt(itemId, data);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Get encrypted items list
    app.get('/api/context/encrypted', (req, res) => {
        const items = Array.from(contextSystem.encryptedContexts.entries()).map(([id, item]) => ({
            id,
            type: item.type,
            metadata: item.metadata,
            encrypted_size: item.data.length,
            original_size: item.original_size,
            compression_ratio: item.compressed_size / item.original_size
        }));
        
        res.json({ encrypted_items: items });
    });
    
    // Force emergency decrypt
    app.post('/api/context/emergency-decrypt', async (req, res) => {
        try {
            await contextSystem.triggerEmergencyDecrypt();
            res.json({ success: true, message: 'Emergency decrypt triggered' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.listen(port, () => {
        console.log(`🔐 Context Decrypt system running on port ${port}`);
        console.log(`📊 Status: GET http://localhost:${port}/api/context/status`);
        console.log(`🔓 Decrypt: POST http://localhost:${port}/api/context/decrypt/:itemId`);
        console.log(`🔐 Encrypt: POST http://localhost:${port}/api/context/encrypt`);
        console.log(`🚨 Emergency: POST http://localhost:${port}/api/context/emergency-decrypt`);
    });
    
    // Cleanup on exit
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Context Decrypt System...');
        contextSystem.cleanup();
        process.exit(0);
    });
}