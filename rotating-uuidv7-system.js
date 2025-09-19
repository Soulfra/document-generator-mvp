#!/usr/bin/env node

/**
 * 🔄 ROTATING UUIDv7 SYSTEM
 * 
 * Dynamic UUID generation with rotation capabilities
 * for enhanced security and temporal organization
 */

const crypto = require('crypto');

class RotatingUUIDv7System {
    constructor() {
        this.rotationInterval = 30000; // 30 seconds
        this.activeUUIDs = new Map();
        this.uuidHistory = new Map();
        this.rotationCallbacks = new Map();
        this.isRotating = false;
        
        console.log('🔄 ROTATING UUIDv7 SYSTEM');
        console.log('⚡ Dynamic UUID generation with temporal rotation');
        
        this.startRotationEngine();
    }
    
    /**
     * 🔄 Start Rotation Engine
     */
    startRotationEngine() {
        this.isRotating = true;
        
        setInterval(() => {
            this.performRotation();
        }, this.rotationInterval);
        
        console.log(`✅ Rotation engine started (${this.rotationInterval}ms intervals)`);
    }
    
    /**
     * 🆕 Generate UUIDv7
     */
    generateUUIDv7() {
        // Get current timestamp in milliseconds
        const timestamp = Date.now();
        
        // Convert timestamp to hex (48 bits)
        const timestampHex = timestamp.toString(16).padStart(12, '0');
        
        // Generate random data (80 bits)
        const randomBytes = crypto.randomBytes(10);
        const randomHex = randomBytes.toString('hex');
        
        // Set version (4 bits) and variant (2 bits)
        const version = '7'; // Version 7
        const variant = '8'; // Variant 10 (binary)
        
        // Construct UUIDv7
        const uuid = [
            timestampHex.substring(0, 8),  // time_high (32 bits)
            timestampHex.substring(8, 12), // time_mid (16 bits)
            version + timestampHex.substring(12, 15), // version + time_low (16 bits)
            variant + randomHex.substring(1, 4),      // variant + random (16 bits)
            randomHex.substring(4, 16)                // random (48 bits)
        ].join('-');
        
        return {
            uuid,
            timestamp,
            generated: new Date().toISOString(),
            rotationId: this.getCurrentRotationId()
        };
    }
    
    /**
     * 🔑 Create Rotating UUID Set
     */
    createRotatingUUIDSet(entityType, entityId, count = 3) {
        const setId = `${entityType}:${entityId}`;
        const uuidSet = {
            entityType,
            entityId,
            primary: null,
            alternates: [],
            rotationHistory: [],
            created: new Date().toISOString(),
            lastRotation: null,
            rotationCount: 0
        };
        
        // Generate primary UUID
        uuidSet.primary = this.generateUUIDv7();
        
        // Generate alternate UUIDs
        for (let i = 0; i < count - 1; i++) {
            uuidSet.alternates.push(this.generateUUIDv7());
        }
        
        this.activeUUIDs.set(setId, uuidSet);
        
        console.log(`🆕 Created rotating UUID set for ${setId}`);
        return uuidSet;
    }
    
    /**
     * 🔄 Perform Rotation
     */
    performRotation() {
        if (this.activeUUIDs.size === 0) return;
        
        const rotationId = this.generateRotationId();
        const rotatedCount = 0;
        
        console.log(`🔄 Starting rotation cycle: ${rotationId}`);
        
        for (const [setId, uuidSet] of this.activeUUIDs) {
            try {
                this.rotateUUIDSet(setId, uuidSet, rotationId);
            } catch (error) {
                console.error(`❌ Rotation failed for ${setId}:`, error);
            }
        }
        
        console.log(`✅ Rotation cycle completed: ${rotationId}`);
    }
    
    /**
     * 🔄 Rotate UUID Set
     */
    rotateUUIDSet(setId, uuidSet, rotationId) {
        // Store current primary in history
        if (uuidSet.primary) {
            uuidSet.rotationHistory.push({
                uuid: uuidSet.primary,
                rotatedAt: new Date().toISOString(),
                rotationId
            });
        }
        
        // Promote first alternate to primary
        if (uuidSet.alternates.length > 0) {
            uuidSet.primary = uuidSet.alternates.shift();
        } else {
            // Generate new primary if no alternates
            uuidSet.primary = this.generateUUIDv7();
        }
        
        // Generate new alternate to maintain count
        uuidSet.alternates.push(this.generateUUIDv7());
        
        // Limit rotation history
        if (uuidSet.rotationHistory.length > 10) {
            uuidSet.rotationHistory = uuidSet.rotationHistory.slice(-10);
        }
        
        uuidSet.lastRotation = new Date().toISOString();
        uuidSet.rotationCount++;
        
        // Call rotation callbacks
        this.notifyRotationCallbacks(setId, uuidSet, rotationId);
        
        console.log(`   🔄 Rotated ${setId} (count: ${uuidSet.rotationCount})`);
    }
    
    /**
     * 📞 Notify Rotation Callbacks
     */
    notifyRotationCallbacks(setId, uuidSet, rotationId) {
        if (this.rotationCallbacks.has(setId)) {
            const callback = this.rotationCallbacks.get(setId);
            try {
                callback({
                    setId,
                    newPrimary: uuidSet.primary,
                    rotationId,
                    rotationCount: uuidSet.rotationCount
                });
            } catch (error) {
                console.error(`❌ Rotation callback error for ${setId}:`, error);
            }
        }
    }
    
    /**
     * 🔍 Get Current UUID
     */
    getCurrentUUID(entityType, entityId) {
        const setId = `${entityType}:${entityId}`;
        const uuidSet = this.activeUUIDs.get(setId);
        
        if (!uuidSet) {
            // Create new set if it doesn't exist
            return this.createRotatingUUIDSet(entityType, entityId);
        }
        
        return uuidSet.primary;
    }
    
    /**
     * 📋 Get All UUIDs for Entity
     */
    getAllUUIDs(entityType, entityId) {
        const setId = `${entityType}:${entityId}`;
        const uuidSet = this.activeUUIDs.get(setId);
        
        if (!uuidSet) return null;
        
        return {
            primary: uuidSet.primary,
            alternates: uuidSet.alternates,
            history: uuidSet.rotationHistory.map(h => h.uuid)
        };
    }
    
    /**
     * 🔍 Verify UUID
     */
    verifyUUID(uuid, entityType = null, entityId = null) {
        // Check if UUID is valid format
        if (!this.isValidUUIDv7(uuid.uuid || uuid)) {
            return { valid: false, reason: 'Invalid UUIDv7 format' };
        }
        
        // If entity specified, check if UUID belongs to it
        if (entityType && entityId) {
            const setId = `${entityType}:${entityId}`;
            const uuidSet = this.activeUUIDs.get(setId);
            
            if (!uuidSet) {
                return { valid: false, reason: 'Entity not found' };
            }
            
            const uuidString = uuid.uuid || uuid;
            
            // Check primary
            if (uuidSet.primary.uuid === uuidString) {
                return { valid: true, type: 'primary', age: 'current' };
            }
            
            // Check alternates
            for (const alt of uuidSet.alternates) {
                if (alt.uuid === uuidString) {
                    return { valid: true, type: 'alternate', age: 'current' };
                }
            }
            
            // Check history
            for (const hist of uuidSet.rotationHistory) {
                if (hist.uuid.uuid === uuidString) {
                    return { valid: true, type: 'historical', age: hist.rotatedAt };
                }
            }
            
            return { valid: false, reason: 'UUID not found for entity' };
        }
        
        return { valid: true, type: 'format_valid' };
    }
    
    /**
     * ✅ Validate UUIDv7 Format
     */
    isValidUUIDv7(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    
    /**
     * 📅 Extract Timestamp from UUIDv7
     */
    extractTimestamp(uuid) {
        if (!this.isValidUUIDv7(uuid)) {
            throw new Error('Invalid UUIDv7 format');
        }
        
        const hex = uuid.replace(/-/g, '');
        const timestampHex = hex.substring(0, 12);
        const timestamp = parseInt(timestampHex, 16);
        
        return {
            timestamp,
            date: new Date(timestamp).toISOString(),
            age: Date.now() - timestamp
        };
    }
    
    /**
     * 🔗 Register Rotation Callback
     */
    onRotation(entityType, entityId, callback) {
        const setId = `${entityType}:${entityId}`;
        this.rotationCallbacks.set(setId, callback);
        
        console.log(`📞 Registered rotation callback for ${setId}`);
    }
    
    /**
     * 🚫 Unregister Rotation Callback
     */
    offRotation(entityType, entityId) {
        const setId = `${entityType}:${entityId}`;
        this.rotationCallbacks.delete(setId);
        
        console.log(`🚫 Unregistered rotation callback for ${setId}`);
    }
    
    /**
     * ⚙️ Configure Rotation
     */
    configureRotation(options = {}) {
        if (options.interval) {
            this.rotationInterval = options.interval;
            console.log(`⚙️ Rotation interval updated: ${this.rotationInterval}ms`);
        }
        
        if (options.restart) {
            this.stopRotation();
            this.startRotationEngine();
        }
    }
    
    /**
     * 🛑 Stop Rotation
     */
    stopRotation() {
        this.isRotating = false;
        console.log('🛑 Rotation engine stopped');
    }
    
    /**
     * 🆔 Generate Rotation ID
     */
    generateRotationId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `rot_${timestamp}_${random}`;
    }
    
    /**
     * 🆔 Get Current Rotation ID
     */
    getCurrentRotationId() {
        return this.currentRotationId || 'initial';
    }
    
    /**
     * 📊 Get System Statistics
     */
    getStatistics() {
        let totalRotations = 0;
        let oldestSet = null;
        let newestSet = null;
        
        for (const [setId, uuidSet] of this.activeUUIDs) {
            totalRotations += uuidSet.rotationCount;
            
            if (!oldestSet || uuidSet.created < oldestSet.created) {
                oldestSet = uuidSet;
            }
            
            if (!newestSet || uuidSet.created > newestSet.created) {
                newestSet = uuidSet;
            }
        }
        
        return {
            active_sets: this.activeUUIDs.size,
            total_rotations: totalRotations,
            rotation_interval: this.rotationInterval,
            is_rotating: this.isRotating,
            oldest_set: oldestSet?.entityType + ':' + oldestSet?.entityId,
            newest_set: newestSet?.entityType + ':' + newestSet?.entityId,
            callbacks_registered: this.rotationCallbacks.size
        };
    }
    
    /**
     * 📋 List All Active Sets
     */
    listActiveSets() {
        console.log('\n📋 ACTIVE UUID SETS:');
        
        for (const [setId, uuidSet] of this.activeUUIDs) {
            console.log(`   🆔 ${setId}:`);
            console.log(`      Primary: ${uuidSet.primary.uuid}`);
            console.log(`      Alternates: ${uuidSet.alternates.length}`);
            console.log(`      Rotations: ${uuidSet.rotationCount}`);
            console.log(`      Last Rotation: ${uuidSet.lastRotation || 'Never'}`);
        }
    }
    
    /**
     * 🧹 Cleanup Old Sets
     */
    cleanupOldSets(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const cutoff = Date.now() - maxAge;
        const toDelete = [];
        
        for (const [setId, uuidSet] of this.activeUUIDs) {
            const created = new Date(uuidSet.created).getTime();
            if (created < cutoff) {
                toDelete.push(setId);
            }
        }
        
        for (const setId of toDelete) {
            this.activeUUIDs.delete(setId);
            this.rotationCallbacks.delete(setId);
            console.log(`🧹 Cleaned up old UUID set: ${setId}`);
        }
        
        return toDelete.length;
    }
    
    /**
     * 💾 Export Sets
     */
    exportSets() {
        const export_data = {
            timestamp: new Date().toISOString(),
            rotation_interval: this.rotationInterval,
            sets: Array.from(this.activeUUIDs.entries())
        };
        
        return JSON.stringify(export_data, null, 2);
    }
    
    /**
     * 📥 Import Sets
     */
    importSets(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            this.activeUUIDs.clear();
            
            for (const [setId, uuidSet] of data.sets) {
                this.activeUUIDs.set(setId, uuidSet);
            }
            
            if (data.rotation_interval) {
                this.rotationInterval = data.rotation_interval;
            }
            
            console.log(`📥 Imported ${data.sets.length} UUID sets`);
            return true;
            
        } catch (error) {
            console.error('❌ Import failed:', error);
            return false;
        }
    }
}

// Export for integration
module.exports = RotatingUUIDv7System;

// Run if executed directly
if (require.main === module) {
    const uuidSystem = new RotatingUUIDv7System();
    
    // Demo usage
    console.log('\n🔄 DEMO: Creating rotating UUIDs...');
    
    // Create some UUID sets
    const userSet = uuidSystem.createRotatingUUIDSet('user', 'john_doe');
    const docSet = uuidSystem.createRotatingUUIDSet('document', 'business_plan_v1');
    
    console.log('\n📊 System Statistics:');
    console.log(JSON.stringify(uuidSystem.getStatistics(), null, 2));
    
    // Register callback
    uuidSystem.onRotation('user', 'john_doe', (event) => {
        console.log(`🔄 User UUID rotated: ${event.newPrimary.uuid}`);
    });
    
    // List sets
    uuidSystem.listActiveSets();
    
    console.log('\n🔄 Rotating UUIDv7 System is running!');
    console.log('UUIDs will rotate automatically every 30 seconds');
}