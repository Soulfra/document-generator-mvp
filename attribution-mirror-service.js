#!/usr/bin/env node

/**
 * 🔄 ATTRIBUTION MIRROR SERVICE
 * Syncs agent purchase data across multiple layers with appropriate encryption
 * Stripe → Vercel → Local → Blockchain
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const stripe = require('stripe');

// Import existing systems
const SoulfraSecuritySystem = require('./SOULFRA-SECURITY-SYSTEM.js');
const DevicePermissionManager = require('./device-permission-manager.js');

class AttributionMirrorService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            syncInterval: config.syncInterval || 60000, // 1 minute
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 5000,
            encryptionLayers: {
                stripe: 'transport',
                vercel: 'partial',
                local: 'full',
                blockchain: 'hash_only'
            },
            ...config
        };
        
        // Security systems
        this.soulfra = new SoulfraSecuritySystem();
        this.deviceManager = new DevicePermissionManager();
        
        // Database connections
        this.databases = {
            local: null,
            vercel: null
        };
        
        // Sync state
        this.syncQueue = [];
        this.syncInProgress = false;
        this.lastSyncTime = null;
        
        // Layer handlers
        this.layerHandlers = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🔄 Initializing Attribution Mirror Service');
        
        // Initialize databases
        await this.initializeDatabases();
        
        // Register layer handlers
        this.registerLayerHandlers();
        
        // Start sync process
        this.startSyncProcess();
        
        console.log('✅ Mirror service initialized');
    }
    
    async initializeDatabases() {
        // Local database
        this.databases.local = new sqlite3.Database('./agent-attribution.db');
        
        // Vercel database
        if (process.env.VERCEL_DATABASE_URL) {
            this.databases.vercel = new Pool({
                connectionString: process.env.VERCEL_DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
        }
        
        // Create mirror tracking table
        await this.createMirrorTables();
    }
    
    async createMirrorTables() {
        const sql = `
            CREATE TABLE IF NOT EXISTS mirror_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attribution_id VARCHAR(255) NOT NULL,
                source_layer VARCHAR(50) NOT NULL,
                target_layer VARCHAR(50) NOT NULL,
                data TEXT NOT NULL,
                encryption_applied BOOLEAN DEFAULT FALSE,
                priority INTEGER DEFAULT 0,
                attempts INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP,
                
                INDEX idx_status (status),
                INDEX idx_attribution (attribution_id),
                INDEX idx_priority (priority DESC, created_at ASC)
            )
        `;
        
        await this.runQuery(this.databases.local, sql);
        
        // Create encryption map table
        const encryptionMapSql = `
            CREATE TABLE IF NOT EXISTS encryption_map (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attribution_id VARCHAR(255) NOT NULL,
                layer VARCHAR(50) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                encryption_method VARCHAR(50),
                is_encrypted BOOLEAN DEFAULT FALSE,
                is_hashed BOOLEAN DEFAULT FALSE,
                is_visible BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE(attribution_id, layer, field_name)
            )
        `;
        
        await this.runQuery(this.databases.local, encryptionMapSql);
    }
    
    registerLayerHandlers() {
        // Stripe → Local handler
        this.layerHandlers.set('stripe:local', {
            transform: this.transformStripeToLocal.bind(this),
            encrypt: this.encryptForLocal.bind(this),
            validate: this.validateLocalData.bind(this)
        });
        
        // Local → Vercel handler
        this.layerHandlers.set('local:vercel', {
            transform: this.transformLocalToVercel.bind(this),
            encrypt: this.encryptForVercel.bind(this),
            validate: this.validateVercelData.bind(this)
        });
        
        // Local → Blockchain handler
        this.layerHandlers.set('local:blockchain', {
            transform: this.transformLocalToBlockchain.bind(this),
            encrypt: this.hashForBlockchain.bind(this),
            validate: this.validateBlockchainData.bind(this)
        });
    }
    
    /**
     * Queue attribution for mirroring
     */
    async queueAttribution(attribution, sourceLayer = 'stripe') {
        console.log(`📥 Queueing attribution ${attribution.attribution_id} from ${sourceLayer}`);
        
        // Determine target layers based on source
        const targetLayers = this.getTargetLayers(sourceLayer);
        
        for (const targetLayer of targetLayers) {
            await this.addToQueue({
                attribution_id: attribution.attribution_id,
                source_layer: sourceLayer,
                target_layer: targetLayer,
                data: JSON.stringify(attribution),
                priority: this.calculatePriority(sourceLayer, targetLayer)
            });
        }
        
        // Trigger immediate sync if not in progress
        if (!this.syncInProgress) {
            this.processSyncQueue();
        }
    }
    
    getTargetLayers(sourceLayer) {
        const layerFlow = {
            'stripe': ['local'],
            'local': ['vercel', 'blockchain'],
            'vercel': [], // End point
            'blockchain': [] // End point
        };
        
        return layerFlow[sourceLayer] || [];
    }
    
    calculatePriority(sourceLayer, targetLayer) {
        // Higher priority for critical paths
        if (sourceLayer === 'stripe' && targetLayer === 'local') return 10;
        if (sourceLayer === 'local' && targetLayer === 'vercel') return 5;
        if (targetLayer === 'blockchain') return 1;
        return 0;
    }
    
    async addToQueue(item) {
        const sql = `
            INSERT INTO mirror_queue 
            (attribution_id, source_layer, target_layer, data, priority)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await this.runQuery(this.databases.local, sql, [
            item.attribution_id,
            item.source_layer,
            item.target_layer,
            item.data,
            item.priority
        ]);
        
        this.emit('queued', item);
    }
    
    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        console.log('🔄 Processing sync queue...');
        
        try {
            // Get pending items ordered by priority
            const items = await this.runQuery(
                this.databases.local,
                `SELECT * FROM mirror_queue 
                 WHERE status = 'pending' AND attempts < ?
                 ORDER BY priority DESC, created_at ASC
                 LIMIT 10`,
                [this.config.retryAttempts]
            );
            
            console.log(`📋 Found ${items.length} items to sync`);
            
            for (const item of items) {
                await this.processSyncItem(item);
            }
            
            this.lastSyncTime = new Date();
            
        } catch (error) {
            console.error('❌ Sync queue processing error:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async processSyncItem(item) {
        console.log(`🔄 Syncing ${item.attribution_id}: ${item.source_layer} → ${item.target_layer}`);
        
        const handlerKey = `${item.source_layer}:${item.target_layer}`;
        const handler = this.layerHandlers.get(handlerKey);
        
        if (!handler) {
            console.error(`❌ No handler for ${handlerKey}`);
            await this.updateQueueStatus(item.id, 'failed', 'No handler available');
            return;
        }
        
        try {
            // Parse data
            const data = JSON.parse(item.data);
            
            // Transform data for target layer
            const transformed = await handler.transform(data);
            
            // Apply encryption
            const encrypted = await handler.encrypt(transformed);
            
            // Validate before sending
            const isValid = await handler.validate(encrypted);
            if (!isValid) {
                throw new Error('Data validation failed');
            }
            
            // Send to target layer
            await this.sendToLayer(item.target_layer, encrypted);
            
            // Record encryption map
            await this.recordEncryptionMap(item.attribution_id, item.target_layer, encrypted);
            
            // Update queue status
            await this.updateQueueStatus(item.id, 'completed');
            
            // Log transparency
            await this.logMirrorTransparency(item.attribution_id, item.source_layer, item.target_layer, {
                fields_sent: Object.keys(encrypted),
                encryption_applied: true,
                timestamp: new Date()
            });
            
            console.log(`✅ Successfully mirrored to ${item.target_layer}`);
            this.emit('synced', { item, success: true });
            
        } catch (error) {
            console.error(`❌ Failed to sync to ${item.target_layer}:`, error);
            
            await this.updateQueueStatus(
                item.id, 
                item.attempts + 1 >= this.config.retryAttempts ? 'failed' : 'pending',
                error.message
            );
            
            // Increment attempts
            await this.runQuery(
                this.databases.local,
                'UPDATE mirror_queue SET attempts = attempts + 1 WHERE id = ?',
                [item.id]
            );
            
            this.emit('syncError', { item, error });
        }
    }
    
    /**
     * Layer-specific transformations
     */
    async transformStripeToLocal(stripeData) {
        // Full data for local storage
        return {
            ...stripeData,
            sync_source: 'stripe',
            sync_timestamp: new Date(),
            local_enrichments: {
                device_tracking: true,
                analytics_enabled: true,
                full_history: true
            }
        };
    }
    
    async transformLocalToVercel(localData) {
        // Sanitize for Vercel
        return {
            attribution_id: localData.attribution_id,
            payment_reference: localData.stripe_payment_id,
            agent_id: localData.agent_id,
            customer_hash: this.hashValue(localData.customer_id),
            amount: localData.amount,
            currency: localData.currency,
            timestamp: localData.purchase_timestamp,
            verification_hash: localData.public_verification_hash,
            // Remove sensitive fields
            // No device_id, ip_address, or email
        };
    }
    
    async transformLocalToBlockchain(localData) {
        // Minimal data for blockchain
        return {
            type: 'agent_attribution',
            attribution_id: localData.attribution_id,
            agent_id: localData.agent_id,
            timestamp: localData.purchase_timestamp,
            verification: localData.public_verification_hash
        };
    }
    
    /**
     * Encryption methods by layer
     */
    async encryptForLocal(data) {
        // Local gets full data but with encrypted sensitive fields
        const sensitive = {
            customer_email: data.customer_email_hash,
            ip_address: data.ip_address,
            device_fingerprint: data.device_fingerprint
        };
        
        const encrypted = await this.soulfra.encrypt(sensitive);
        
        return {
            ...data,
            encrypted_sensitive: encrypted,
            // Remove plain sensitive fields
            customer_email_hash: undefined,
            ip_address: undefined,
            device_fingerprint: undefined
        };
    }
    
    async encryptForVercel(data) {
        // Vercel gets partially encrypted data
        const toEncrypt = {
            device_id: data.device_id,
            customer_id: data.customer_id,
            internal_refs: data.internal_refs
        };
        
        const encrypted = await this.soulfra.encrypt(toEncrypt);
        
        return {
            ...data,
            encrypted_metadata: encrypted,
            // Remove encrypted fields from main object
            device_id: undefined,
            customer_id: undefined,
            internal_refs: undefined
        };
    }
    
    async hashForBlockchain(data) {
        // Blockchain gets hashed data only
        const toHash = JSON.stringify({
            ...data,
            salt: crypto.randomBytes(16).toString('hex')
        });
        
        return {
            ...data,
            content_hash: crypto.createHash('sha256').update(toHash).digest('hex')
        };
    }
    
    /**
     * Validation methods
     */
    async validateLocalData(data) {
        const required = ['attribution_id', 'agent_id', 'amount', 'purchase_timestamp'];
        return required.every(field => data[field] !== undefined);
    }
    
    async validateVercelData(data) {
        const required = ['attribution_id', 'payment_reference', 'agent_id', 'verification_hash'];
        const forbidden = ['device_id', 'ip_address', 'customer_email'];
        
        const hasRequired = required.every(field => data[field] !== undefined);
        const noForbidden = forbidden.every(field => data[field] === undefined);
        
        return hasRequired && noForbidden;
    }
    
    async validateBlockchainData(data) {
        const required = ['attribution_id', 'verification'];
        const maxSize = 1024; // 1KB max for blockchain
        
        const hasRequired = required.every(field => data[field] !== undefined);
        const sizeOk = JSON.stringify(data).length <= maxSize;
        
        return hasRequired && sizeOk;
    }
    
    /**
     * Send data to target layer
     */
    async sendToLayer(layer, data) {
        switch (layer) {
            case 'local':
                return this.saveToLocal(data);
            case 'vercel':
                return this.saveToVercel(data);
            case 'blockchain':
                return this.saveToBlockchain(data);
            default:
                throw new Error(`Unknown layer: ${layer}`);
        }
    }
    
    async saveToLocal(data) {
        // Implementation depends on your local schema
        console.log('💾 Saving to local database');
        // Already handled by attribution handler
    }
    
    async saveToVercel(data) {
        if (!this.databases.vercel) {
            throw new Error('Vercel database not configured');
        }
        
        const sql = `
            INSERT INTO agent_attributions_mirror (
                attribution_id, payment_reference, agent_id,
                customer_hash, amount, currency, timestamp,
                verification_hash, encrypted_metadata, mirror_timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (attribution_id) DO UPDATE SET
                mirror_timestamp = NOW()
        `;
        
        await this.databases.vercel.query(sql, [
            data.attribution_id,
            data.payment_reference,
            data.agent_id,
            data.customer_hash,
            data.amount,
            data.currency,
            data.timestamp,
            data.verification_hash,
            data.encrypted_metadata
        ]);
    }
    
    async saveToBlockchain(data) {
        // Simulate blockchain save
        // In production, this would use your blockchain integration
        console.log('⛓️ Recording to blockchain:', data.verification);
        
        const txHash = crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
        
        // Update local record with blockchain reference
        await this.runQuery(
            this.databases.local,
            'UPDATE agent_attributions SET blockchain_tx_hash = ? WHERE attribution_id = ?',
            [txHash, data.attribution_id]
        );
        
        return txHash;
    }
    
    /**
     * Record encryption mapping
     */
    async recordEncryptionMap(attributionId, layer, data) {
        const fields = Object.keys(data);
        
        for (const field of fields) {
            const isEncrypted = field.includes('encrypted') || field.includes('hash');
            const isHashed = field.includes('hash');
            const isVisible = !isEncrypted;
            
            const sql = `
                INSERT OR REPLACE INTO encryption_map
                (attribution_id, layer, field_name, encryption_method, is_encrypted, is_hashed, is_visible)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            await this.runQuery(this.databases.local, sql, [
                attributionId,
                layer,
                field,
                isEncrypted ? 'SOULFRA' : 'none',
                isEncrypted,
                isHashed,
                isVisible
            ]);
        }
    }
    
    /**
     * Transparency logging
     */
    async logMirrorTransparency(attributionId, sourceLayer, targetLayer, details) {
        const sql = `
            INSERT INTO transparency_log
            (attribution_id, action, layer, data_sent, data_visibility)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await this.runQuery(this.databases.local, sql, [
            attributionId,
            `mirror_${sourceLayer}_to_${targetLayer}`,
            targetLayer,
            JSON.stringify(details),
            JSON.stringify(this.getLayerVisibility(targetLayer))
        ]);
    }
    
    getLayerVisibility(layer) {
        const visibility = {
            local: ['all_fields'],
            vercel: ['payment_reference', 'agent_id', 'amount', 'verification_hash'],
            blockchain: ['verification_hash_only']
        };
        
        return visibility[layer] || [];
    }
    
    /**
     * Status updates
     */
    async updateQueueStatus(id, status, error = null) {
        const sql = `
            UPDATE mirror_queue 
            SET status = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await this.runQuery(this.databases.local, sql, [status, error, id]);
    }
    
    /**
     * Sync process management
     */
    startSyncProcess() {
        // Initial sync
        this.processSyncQueue();
        
        // Schedule periodic syncs
        this.syncInterval = setInterval(() => {
            this.processSyncQueue();
        }, this.config.syncInterval);
        
        console.log(`⏰ Sync scheduled every ${this.config.syncInterval / 1000} seconds`);
    }
    
    stopSyncProcess() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    /**
     * Get sync status
     */
    async getSyncStatus() {
        const stats = await this.runQuery(
            this.databases.local,
            `SELECT 
                status, 
                COUNT(*) as count,
                MIN(created_at) as oldest,
                MAX(processed_at) as newest
             FROM mirror_queue
             GROUP BY status`
        );
        
        const queueDepth = await this.runQuery(
            this.databases.local,
            `SELECT COUNT(*) as depth FROM mirror_queue WHERE status = 'pending'`
        );
        
        return {
            stats,
            queueDepth: queueDepth[0]?.depth || 0,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime
        };
    }
    
    /**
     * Manual sync trigger
     */
    async syncAttribution(attributionId) {
        console.log(`🔄 Manual sync requested for ${attributionId}`);
        
        // Get attribution from local
        const attribution = await this.runQuery(
            this.databases.local,
            'SELECT * FROM agent_attributions WHERE attribution_id = ?',
            [attributionId]
        );
        
        if (!attribution[0]) {
            throw new Error('Attribution not found');
        }
        
        // Queue for all target layers
        await this.queueAttribution(attribution[0], 'local');
        
        // Process immediately
        await this.processSyncQueue();
    }
    
    /**
     * Utilities
     */
    hashValue(value) {
        return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
    }
    
    runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            if (db.query) {
                // PostgreSQL
                db.query(sql, params, (err, result) => {
                    if (err) reject(err);
                    else resolve(result.rows);
                });
            } else {
                // SQLite
                if (sql.toUpperCase().startsWith('SELECT')) {
                    db.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                } else {
                    db.run(sql, params, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            }
        });
    }
    
    /**
     * Cleanup
     */
    async cleanup() {
        console.log('🧹 Cleaning up mirror service...');
        
        this.stopSyncProcess();
        
        if (this.databases.vercel) {
            await this.databases.vercel.end();
        }
        
        if (this.databases.local) {
            this.databases.local.close();
        }
    }
}

// Export for use
module.exports = AttributionMirrorService;

// Run standalone
if (require.main === module) {
    const service = new AttributionMirrorService();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down mirror service...');
        await service.cleanup();
        process.exit(0);
    });
    
    // Status endpoint
    const express = require('express');
    const app = express();
    
    app.get('/status', async (req, res) => {
        const status = await service.getSyncStatus();
        res.json(status);
    });
    
    app.post('/sync/:attributionId', async (req, res) => {
        try {
            await service.syncAttribution(req.params.attributionId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.listen(3457, () => {
        console.log('🔄 Mirror service API listening on port 3457');
    });
}