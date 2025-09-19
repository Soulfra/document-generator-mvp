#!/usr/bin/env node

/**
 * 🔐📦 SECURE PACKET GENERATOR
 * 
 * Voice-encrypted game packets for the bootstrap economy.
 * Each packet is secured by voice signature, not face tracking.
 * Works offline like QR codes, contains economic transactions.
 * 
 * Like electrical circuits - packets flow through defined channels.
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const QRCode = require('qrcode');

console.log(`
🔐📦 SECURE PACKET GENERATOR 🔐📦
===================================
Voice-Encrypted Economic Packets
No Surveillance | Offline-Capable
`);

class SecurePacketGenerator extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            packetVersion: '1.0.0',
            maxPacketSize: 8192,  // 8KB max
            compressionLevel: 6,
            encryption: {
                algorithm: 'aes-256-gcm',
                saltLength: 32,
                tagLength: 16,
                iterations: 100000
            },
            voiceSignature: {
                minLength: 64,
                hashAlgorithm: 'sha3-256'
            },
            offlineCapability: {
                qrDensity: 'high',
                redundancy: 0.3,  // 30% error correction
                chunkSize: 2048   // For large packets
            }
        };
        
        // Packet types (like electrical wire colors)
        this.packetTypes = {
            ECONOMY: { color: '#FFD700', priority: 1 },      // Gold - economic transactions
            AUTH: { color: '#00FF00', priority: 2 },         // Green - authentication
            RESOURCE: { color: '#0080FF', priority: 3 },     // Blue - resource transfers
            MESSAGE: { color: '#FFFFFF', priority: 4 },      // White - communications
            CONTROL: { color: '#FF0000', priority: 5 },      // Red - control signals
            SYNC: { color: '#FF00FF', priority: 6 }          // Magenta - synchronization
        };
        
        // Packet routing table (like electrical circuit paths)
        this.routingTable = new Map();
        
        // Packet queue for offline storage
        this.offlineQueue = [];
        
        // Voice signature cache
        this.voiceSignatures = new Map();
        
        // Packet statistics
        this.stats = {
            generated: 0,
            encrypted: 0,
            transmitted: 0,
            qrGenerated: 0,
            offlineStored: 0,
            errors: 0
        };
        
        console.log('🔐 Secure Packet Generator initialized');
        console.log(`📦 ${Object.keys(this.packetTypes).length} packet types configured`);
    }
    
    /**
     * Generate a secure packet from voice signature
     */
    async generatePacket(voiceSignature, data, type = 'ECONOMY') {
        try {
            // Validate voice signature
            if (!this.validateVoiceSignature(voiceSignature)) {
                throw new Error('Invalid voice signature');
            }
            
            // Create packet structure
            const packet = {
                id: this.generatePacketId(),
                version: this.config.packetVersion,
                type,
                timestamp: Date.now(),
                ttl: 3600000, // 1 hour time-to-live
                routing: {
                    source: this.hashVoice(voiceSignature),
                    destination: data.destination || 'broadcast',
                    hops: [],
                    maxHops: 10
                },
                payload: data,
                signature: null,
                checksum: null
            };
            
            // Sign packet with voice
            packet.signature = await this.signWithVoice(packet, voiceSignature);
            
            // Calculate checksum
            packet.checksum = this.calculateChecksum(packet);
            
            // Encrypt if needed
            const encryptedPacket = await this.encryptPacket(packet, voiceSignature);
            
            // Update statistics
            this.stats.generated++;
            
            // Emit event
            this.emit('packet_generated', {
                id: packet.id,
                type: packet.type,
                size: JSON.stringify(encryptedPacket).length
            });
            
            console.log(`📦 Generated ${type} packet: ${packet.id.substring(0, 8)}...`);
            
            return encryptedPacket;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Packet generation failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Create QR code for offline packet transmission
     */
    async generateQRPacket(packet, options = {}) {
        try {
            // Compress packet for QR encoding
            const compressed = this.compressPacket(packet);
            
            // Check if packet fits in single QR
            if (compressed.length <= this.config.offlineCapability.chunkSize) {
                // Single QR code
                const qrData = await QRCode.toDataURL(compressed, {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    quality: 0.92,
                    margin: 1,
                    color: {
                        dark: this.packetTypes[packet.type]?.color || '#000000',
                        light: '#FFFFFF'
                    },
                    width: options.size || 512
                });
                
                this.stats.qrGenerated++;
                
                console.log(`📱 Generated QR packet (${compressed.length} bytes)`);
                
                return {
                    type: 'single',
                    data: qrData,
                    size: compressed.length,
                    chunks: 1
                };
                
            } else {
                // Multi-part QR codes for large packets
                const chunks = this.chunkPacket(compressed);
                const qrCodes = [];
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunkData = {
                        id: packet.id,
                        part: i + 1,
                        total: chunks.length,
                        data: chunks[i]
                    };
                    
                    const qr = await QRCode.toDataURL(JSON.stringify(chunkData), {
                        errorCorrectionLevel: 'H',
                        width: options.size || 512
                    });
                    
                    qrCodes.push(qr);
                }
                
                this.stats.qrGenerated += chunks.length;
                
                console.log(`📱 Generated multi-part QR packet (${chunks.length} parts)`);
                
                return {
                    type: 'multi',
                    data: qrCodes,
                    size: compressed.length,
                    chunks: chunks.length
                };
            }
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ QR generation failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Encrypt packet with voice-derived key
     */
    async encryptPacket(packet, voiceSignature) {
        try {
            // Derive encryption key from voice
            const key = await this.deriveKeyFromVoice(voiceSignature);
            
            // Generate IV
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipheriv(
                this.config.encryption.algorithm,
                key,
                iv
            );
            
            // Encrypt packet data
            const packetJson = JSON.stringify(packet);
            const encrypted = Buffer.concat([
                cipher.update(packetJson, 'utf8'),
                cipher.final()
            ]);
            
            // Get auth tag
            const authTag = cipher.getAuthTag();
            
            // Combine into encrypted packet
            const encryptedPacket = {
                encrypted: true,
                algorithm: this.config.encryption.algorithm,
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                data: encrypted.toString('base64'),
                voiceHash: this.hashVoice(voiceSignature).substring(0, 16)
            };
            
            this.stats.encrypted++;
            
            return encryptedPacket;
            
        } catch (error) {
            console.error('❌ Encryption failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Decrypt packet with voice signature
     */
    async decryptPacket(encryptedPacket, voiceSignature) {
        try {
            // Verify voice hash matches
            const voiceHash = this.hashVoice(voiceSignature).substring(0, 16);
            if (voiceHash !== encryptedPacket.voiceHash) {
                throw new Error('Voice signature mismatch');
            }
            
            // Derive decryption key
            const key = await this.deriveKeyFromVoice(voiceSignature);
            
            // Create decipher
            const decipher = crypto.createDecipheriv(
                encryptedPacket.algorithm,
                key,
                Buffer.from(encryptedPacket.iv, 'base64')
            );
            
            // Set auth tag
            decipher.setAuthTag(Buffer.from(encryptedPacket.authTag, 'base64'));
            
            // Decrypt
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encryptedPacket.data, 'base64')),
                decipher.final()
            ]);
            
            // Parse packet
            const packet = JSON.parse(decrypted.toString('utf8'));
            
            // Verify checksum
            if (!this.verifyChecksum(packet)) {
                throw new Error('Packet checksum verification failed');
            }
            
            return packet;
            
        } catch (error) {
            console.error('❌ Decryption failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Store packet for offline transmission
     */
    storeOfflinePacket(packet) {
        // Add to offline queue
        this.offlineQueue.push({
            packet,
            stored: Date.now(),
            attempts: 0
        });
        
        // Limit queue size
        if (this.offlineQueue.length > 1000) {
            this.offlineQueue.shift(); // Remove oldest
        }
        
        this.stats.offlineStored++;
        
        console.log(`💾 Stored packet offline (queue: ${this.offlineQueue.length})`);
        
        return true;
    }
    
    /**
     * Process offline packet queue
     */
    async processOfflineQueue() {
        const processed = [];
        
        for (const item of this.offlineQueue) {
            try {
                // Check if packet expired
                if (Date.now() - item.packet.timestamp > item.packet.ttl) {
                    processed.push(item);
                    continue;
                }
                
                // Try to transmit
                const transmitted = await this.transmitPacket(item.packet);
                
                if (transmitted) {
                    processed.push(item);
                    this.stats.transmitted++;
                } else {
                    item.attempts++;
                }
                
            } catch (error) {
                console.error(`❌ Failed to process offline packet: ${error.message}`);
                item.attempts++;
            }
        }
        
        // Remove processed packets
        this.offlineQueue = this.offlineQueue.filter(item => !processed.includes(item));
        
        console.log(`📤 Processed ${processed.length} offline packets`);
        
        return processed.length;
    }
    
    /**
     * Voice signature utilities
     */
    validateVoiceSignature(signature) {
        if (!signature || typeof signature !== 'string') {
            return false;
        }
        
        if (signature.length < this.config.voiceSignature.minLength) {
            return false;
        }
        
        // Check for AI-generated patterns
        const entropy = this.calculateEntropy(signature);
        if (entropy < 3.5) { // Too uniform, likely AI
            console.warn('⚠️ Low entropy voice signature detected');
            return false;
        }
        
        return true;
    }
    
    hashVoice(voiceSignature) {
        const hash = crypto.createHash(this.config.voiceSignature.hashAlgorithm);
        hash.update(voiceSignature);
        return hash.digest('hex');
    }
    
    async deriveKeyFromVoice(voiceSignature) {
        const salt = crypto.createHash('sha256')
            .update('packet-encryption-salt')
            .digest();
        
        return crypto.pbkdf2Sync(
            voiceSignature,
            salt,
            this.config.encryption.iterations,
            32, // 256 bits
            'sha256'
        );
    }
    
    async signWithVoice(packet, voiceSignature) {
        const signData = JSON.stringify({
            id: packet.id,
            type: packet.type,
            timestamp: packet.timestamp,
            payload: packet.payload
        });
        
        const hmac = crypto.createHmac('sha256', voiceSignature);
        hmac.update(signData);
        
        return hmac.digest('hex');
    }
    
    /**
     * Packet utilities
     */
    generatePacketId() {
        return `PKT-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    }
    
    calculateChecksum(packet) {
        const data = JSON.stringify({
            id: packet.id,
            type: packet.type,
            payload: packet.payload,
            signature: packet.signature
        });
        
        return crypto.createHash('md5').update(data).digest('hex');
    }
    
    verifyChecksum(packet) {
        const calculated = this.calculateChecksum(packet);
        return calculated === packet.checksum;
    }
    
    compressPacket(packet) {
        // Simple JSON compression (in production, use zlib)
        const json = JSON.stringify(packet);
        
        // Remove whitespace
        const compressed = json.replace(/\s+/g, '');
        
        // Base64 encode
        return Buffer.from(compressed).toString('base64');
    }
    
    chunkPacket(data) {
        const chunks = [];
        const chunkSize = this.config.offlineCapability.chunkSize;
        
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
        }
        
        return chunks;
    }
    
    calculateEntropy(str) {
        const freq = {};
        for (const char of str) {
            freq[char] = (freq[char] || 0) + 1;
        }
        
        let entropy = 0;
        const len = str.length;
        
        for (const count of Object.values(freq)) {
            const p = count / len;
            entropy -= p * Math.log2(p);
        }
        
        return entropy;
    }
    
    /**
     * Packet transmission (stub - implement based on transport)
     */
    async transmitPacket(packet) {
        // This would implement actual transmission logic
        // For now, just emit an event
        this.emit('packet_transmitted', packet);
        return true;
    }
    
    /**
     * Create specialized packet types
     */
    createEconomyPacket(voiceSignature, transaction) {
        return this.generatePacket(voiceSignature, {
            action: 'economy_transaction',
            transaction: {
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                resource: transaction.resource,
                timestamp: Date.now()
            }
        }, 'ECONOMY');
    }
    
    createAuthPacket(voiceSignature, authData) {
        return this.generatePacket(voiceSignature, {
            action: 'authenticate',
            auth: {
                voiceHash: this.hashVoice(voiceSignature),
                timestamp: Date.now(),
                challenge: authData.challenge,
                response: authData.response
            }
        }, 'AUTH');
    }
    
    createResourcePacket(voiceSignature, resourceData) {
        return this.generatePacket(voiceSignature, {
            action: 'resource_transfer',
            resource: {
                type: resourceData.type,
                amount: resourceData.amount,
                from: resourceData.from,
                to: resourceData.to,
                metadata: resourceData.metadata
            }
        }, 'RESOURCE');
    }
    
    createSyncPacket(voiceSignature, syncData) {
        return this.generatePacket(voiceSignature, {
            action: 'synchronize',
            sync: {
                component: syncData.component,
                state: syncData.state,
                timestamp: Date.now(),
                sequence: syncData.sequence
            }
        }, 'SYNC');
    }
    
    /**
     * Get packet generator statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            offlineQueueSize: this.offlineQueue.length,
            voiceSignatures: this.voiceSignatures.size,
            successRate: this.stats.generated > 0 
                ? ((this.stats.transmitted / this.stats.generated) * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * Example: Generate sample packets for testing
     */
    async generateExamplePackets() {
        console.log('\n📦 Generating example packets...\n');
        
        // Create mock voice signature
        const mockVoice = crypto.randomBytes(64).toString('hex');
        
        // 1. Economy packet
        const economyPacket = await this.createEconomyPacket(mockVoice, {
            from: 'voice-wallet-001',
            to: 'bucket-factory',
            amount: 100,
            resource: 'buckets'
        });
        
        console.log('💰 Economy Packet:', {
            id: economyPacket.data ? 'encrypted' : economyPacket.id,
            size: JSON.stringify(economyPacket).length + ' bytes'
        });
        
        // 2. Generate QR for offline transmission
        const qrPacket = await this.generateQRPacket(economyPacket);
        console.log(`📱 QR Generated: ${qrPacket.type} (${qrPacket.chunks} chunk(s))`);
        
        // 3. Auth packet
        const authPacket = await this.createAuthPacket(mockVoice, {
            challenge: 'prove-humanity-' + Date.now(),
            response: 'voice-pattern-verified'
        });
        
        console.log('🔐 Auth Packet:', {
            id: authPacket.data ? 'encrypted' : authPacket.id,
            voiceHash: authPacket.voiceHash
        });
        
        // 4. Store offline
        this.storeOfflinePacket(economyPacket);
        
        // 5. Show statistics
        console.log('\n📊 Packet Statistics:');
        console.log(this.getStatistics());
        
        return {
            economy: economyPacket,
            auth: authPacket,
            qr: qrPacket
        };
    }
}

// Export for use as module
module.exports = SecurePacketGenerator;

// Run demo if called directly
if (require.main === module) {
    console.log('🎮 Running Secure Packet Generator Demo...\n');
    
    const generator = new SecurePacketGenerator();
    
    // Listen to events
    generator.on('packet_generated', (data) => {
        console.log(`📡 Event: Packet generated - ${data.type} (${data.size} bytes)`);
    });
    
    generator.on('packet_transmitted', (packet) => {
        console.log(`📤 Event: Packet transmitted - ${packet.id}`);
    });
    
    // Run example
    (async () => {
        try {
            const examples = await generator.generateExamplePackets();
            
            console.log('\n✅ Demo complete!');
            console.log('🔐 Voice-encrypted packets ready for game economy');
            console.log('📱 QR codes enable offline transactions');
            console.log('🚫 No face tracking required!');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    })();
}