#!/usr/bin/env node

/**
 * Header/Footer Decoder Engine with RNG Content Scrambling
 * Decodes encrypted headers and footers while using RNG for middle content
 * Integrates with computational tick engine for anomaly-based rate adjustment
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;

class HeaderFooterDecoder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Decoding configuration
            headerLength: 64,          // Standard header length in bytes
            footerLength: 64,          // Standard footer length in bytes
            encryptionAlgorithm: 'aes-256-gcm',
            keyRotationInterval: 300000, // 5 minutes
            
            // RNG configuration
            rngSeed: Date.now(),
            rngAlgorithm: 'mt19937',   // Mersenne Twister
            scrambleIntensity: 0.75,   // How much to scramble middle content
            
            // Tick rate configuration
            baseTickRate: 100,         // Base 100ms tick rate (60/1000)
            anomalyThreshold: 0.3,     // Threshold for anomaly detection
            maxRateMultiplier: 10.0,   // Maximum speed up
            minRateMultiplier: 0.1,    // Maximum slow down
            
            // Safety controls
            emergencyStop: true,       // Enable ctrl+c + enter emergency stop
            maxProcessingTime: 30000,  // Max 30 seconds per decode operation
            
            ...config
        };
        
        // Decoder state
        this.decoderState = {
            // Encryption keys
            currentKey: null,
            keyHistory: new Map(),
            keyRotationTimer: null,
            
            // RNG state
            rngGenerator: null,
            scramblePattern: new Map(),
            
            // Tick rate state
            currentTickRate: this.config.baseTickRate,
            rateMultiplier: 1.0,
            anomalyHistory: [],
            lastRateAdjustment: Date.now(),
            
            // Decoding statistics
            totalDecoded: 0,
            successfulDecodes: 0,
            failedDecodes: 0,
            anomaliesDetected: 0,
            averageDecodeTime: 0,
            
            // Emergency controls
            emergencyStopActive: false,
            processingOperations: new Set()
        };
        
        // Data stream buffers
        this.streamBuffers = {
            incoming: Buffer.alloc(0),
            headerBuffer: Buffer.alloc(0),
            footerBuffer: Buffer.alloc(0),
            middleContent: Buffer.alloc(0),
            processed: Buffer.alloc(0)
        };
        
        // Anomaly detection patterns
        this.anomalyPatterns = {
            // Network anomalies
            suddenTrafficSpike: { threshold: 10.0, weight: 0.8 },
            unusualPacketSizes: { threshold: 2.0, weight: 0.6 },
            encryptionFailures: { threshold: 0.05, weight: 0.9 },
            
            // Content anomalies
            headerCorruption: { threshold: 0.01, weight: 1.0 },
            footerMismatch: { threshold: 0.01, weight: 1.0 },
            rngPatternBreak: { threshold: 0.2, weight: 0.7 },
            
            // Timing anomalies
            tickRateDeviation: { threshold: 0.5, weight: 0.8 },
            processingDelays: { threshold: 2.0, weight: 0.6 },
            systemLatency: { threshold: 1.5, weight: 0.5 }
        };
        
        console.log('🔐 Header/Footer Decoder Engine initializing...');
        console.log(`📊 Base tick rate: ${this.config.baseTickRate}ms`);
        console.log(`🎲 RNG algorithm: ${this.config.rngAlgorithm}`);
        console.log(`⚡ Anomaly threshold: ${this.config.anomalyThreshold}`);
        
        this.initializeDecoder();
    }
    
    /**
     * Initialize the decoder engine
     */
    async initializeDecoder() {
        try {
            // Initialize encryption keys
            await this.initializeEncryption();
            
            // Setup RNG generator
            this.initializeRNG();
            
            // Setup emergency controls
            this.setupEmergencyControls();
            
            // Start key rotation
            this.startKeyRotation();
            
            // Setup tick rate monitoring
            this.startTickRateMonitoring();
            
            console.log('✅ Header/Footer Decoder ready');
            console.log(`🔑 Encryption: ${this.config.encryptionAlgorithm}`);
            console.log(`🎲 RNG seed: ${this.config.rngSeed}`);
            console.log(`⏰ Tick rate: ${this.decoderState.currentTickRate}ms`);
            
            this.emit('decoder_initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize decoder:', error);
            throw error;
        }
    }
    
    /**
     * Initialize encryption system
     */
    async initializeEncryption() {
        // Generate initial encryption key
        this.decoderState.currentKey = crypto.randomBytes(32);
        
        // Store key with timestamp
        const keyId = crypto.createHash('sha256')
            .update(this.decoderState.currentKey)
            .digest('hex')
            .substring(0, 16);
        
        this.decoderState.keyHistory.set(keyId, {
            key: this.decoderState.currentKey,
            created: Date.now(),
            used: 0,
            successful: 0
        });
        
        console.log(`🔑 Initial encryption key generated: ${keyId}`);
    }
    
    /**
     * Initialize RNG generator
     */
    initializeRNG() {
        // Initialize Mersenne Twister-based RNG
        this.decoderState.rngGenerator = {
            seed: this.config.rngSeed,
            state: new Array(624),
            index: 0
        };
        
        // Seed the generator
        this.seedRNG(this.config.rngSeed);
        
        console.log(`🎲 RNG initialized with seed: ${this.config.rngSeed}`);
    }
    
    /**
     * Seed the RNG generator
     */
    seedRNG(seed) {
        const rng = this.decoderState.rngGenerator;
        rng.state[0] = seed;
        
        for (let i = 1; i < 624; i++) {
            rng.state[i] = (1812433253 * (rng.state[i - 1] ^ (rng.state[i - 1] >>> 30)) + i) >>> 0;
        }
        
        rng.index = 0;
    }
    
    /**
     * Generate next random number
     */
    nextRandom() {
        const rng = this.decoderState.rngGenerator;
        
        if (rng.index >= 624) {
            this.generateNumbers();
        }
        
        let y = rng.state[rng.index];
        y ^= y >>> 11;
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= y >>> 18;
        
        rng.index++;
        return y >>> 0;
    }
    
    /**
     * Generate new batch of random numbers
     */
    generateNumbers() {
        const rng = this.decoderState.rngGenerator;
        
        for (let i = 0; i < 624; i++) {
            const y = (rng.state[i] & 0x80000000) + (rng.state[(i + 1) % 624] & 0x7fffffff);
            rng.state[i] = rng.state[(i + 397) % 624] ^ (y >>> 1);
            
            if (y % 2 !== 0) {
                rng.state[i] ^= 0x9908b0df;
            }
        }
        
        rng.index = 0;
    }
    
    /**
     * Setup emergency controls
     */
    setupEmergencyControls() {
        if (this.config.emergencyStop) {
            // Setup ctrl+c + enter emergency stop
            process.on('SIGINT', () => {
                console.log('\n🚨 Emergency stop signal received!');
                this.triggerEmergencyStop();
            });
            
            // Setup stdin for enter key detection
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
                process.stdin.on('data', (data) => {
                    // Check for ctrl+c (0x03) followed by enter (0x0d)
                    if (data.length >= 2 && data[0] === 0x03 && data[1] === 0x0d) {
                        console.log('\n🚨 Emergency stop: ctrl+c + enter detected!');
                        this.triggerEmergencyStop();
                    }
                });
            }
        }
        
        console.log('🚨 Emergency controls active (ctrl+c + enter)');
    }
    
    /**
     * Trigger emergency stop
     */
    triggerEmergencyStop() {
        this.decoderState.emergencyStopActive = true;
        
        // Stop all processing operations
        this.decoderState.processingOperations.forEach(operationId => {
            console.log(`🛑 Stopping operation: ${operationId}`);
        });
        
        this.decoderState.processingOperations.clear();
        
        // Reset tick rate to safe level
        this.decoderState.currentTickRate = this.config.baseTickRate;
        this.decoderState.rateMultiplier = 1.0;
        
        this.emit('emergency_stop', {
            timestamp: Date.now(),
            reason: 'manual_trigger',
            activeOperations: this.decoderState.processingOperations.size
        });
        
        console.log('🛑 Emergency stop completed - all operations halted');
    }
    
    /**
     * Start key rotation timer
     */
    startKeyRotation() {
        this.decoderState.keyRotationTimer = setInterval(() => {
            this.rotateEncryptionKey();
        }, this.config.keyRotationInterval);
        
        console.log(`🔄 Key rotation scheduled every ${this.config.keyRotationInterval / 1000} seconds`);
    }
    
    /**
     * Rotate encryption key
     */
    rotateEncryptionKey() {
        const oldKey = this.decoderState.currentKey;
        const newKey = crypto.randomBytes(32);
        
        // Generate new key ID
        const newKeyId = crypto.createHash('sha256')
            .update(newKey)
            .digest('hex')
            .substring(0, 16);
        
        // Store new key
        this.decoderState.keyHistory.set(newKeyId, {
            key: newKey,
            created: Date.now(),
            used: 0,
            successful: 0
        });
        
        // Update current key
        this.decoderState.currentKey = newKey;
        
        // Clean up old keys (keep last 10)
        if (this.decoderState.keyHistory.size > 10) {
            const oldestKey = Array.from(this.decoderState.keyHistory.keys())[0];
            this.decoderState.keyHistory.delete(oldestKey);
        }
        
        console.log(`🔄 Encryption key rotated: ${newKeyId}`);
        
        this.emit('key_rotated', {
            newKeyId,
            timestamp: Date.now(),
            totalKeys: this.decoderState.keyHistory.size
        });
    }
    
    /**
     * Start tick rate monitoring
     */
    startTickRateMonitoring() {
        setInterval(() => {
            this.adjustTickRateBasedOnAnomalies();
        }, 1000); // Check every second
        
        console.log('⏰ Tick rate monitoring active');
    }
    
    /**
     * Main decoding function
     */
    async decodeHeaderFooterStream(inputData, options = {}) {
        if (this.decoderState.emergencyStopActive) {
            throw new Error('Emergency stop active - decoding halted');
        }
        
        const operationId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            this.decoderState.processingOperations.add(operationId);
            
            console.log(`🔐 Starting decode operation: ${operationId}`);
            
            // Parse input data into header, middle, footer
            const sections = await this.parseDataSections(inputData);
            
            // Decode header
            const decodedHeader = await this.decodeHeader(sections.header);
            
            // Decode footer
            const decodedFooter = await this.decodeFooter(sections.footer);
            
            // Process middle content with RNG
            const processedMiddle = await this.processMiddleContent(sections.middle, decodedHeader);
            
            // Verify integrity
            const integrity = this.verifyIntegrity(decodedHeader, processedMiddle, decodedFooter);
            
            if (!integrity.valid) {
                throw new Error(`Integrity check failed: ${integrity.reason}`);
            }
            
            // Update statistics
            this.decoderState.totalDecoded++;
            this.decoderState.successfulDecodes++;
            
            const processingTime = Date.now() - startTime;
            this.updateAverageDecodeTime(processingTime);
            
            console.log(`✅ Decode operation completed: ${operationId} (${processingTime}ms)`);
            
            const result = {
                operationId,
                header: decodedHeader,
                content: processedMiddle,
                footer: decodedFooter,
                integrity,
                processingTime,
                tickRate: this.decoderState.currentTickRate,
                anomalies: this.detectAnomalies(sections, processingTime)
            };
            
            this.emit('decode_completed', result);
            return result;
            
        } catch (error) {
            this.decoderState.failedDecodes++;
            console.error(`❌ Decode operation failed: ${operationId}`, error);
            
            this.emit('decode_failed', {
                operationId,
                error: error.message,
                processingTime: Date.now() - startTime
            });
            
            throw error;
            
        } finally {
            this.decoderState.processingOperations.delete(operationId);
        }
    }
    
    /**
     * Parse data into header, middle, footer sections
     */
    async parseDataSections(inputData) {
        const buffer = Buffer.isBuffer(inputData) ? inputData : Buffer.from(inputData);
        
        if (buffer.length < this.config.headerLength + this.config.footerLength) {
            throw new Error('Input data too small for header/footer extraction');
        }
        
        const sections = {
            header: buffer.slice(0, this.config.headerLength),
            footer: buffer.slice(-this.config.footerLength),
            middle: buffer.slice(this.config.headerLength, -this.config.footerLength)
        };
        
        console.log(`📊 Parsed sections: header(${sections.header.length}), middle(${sections.middle.length}), footer(${sections.footer.length})`);
        
        return sections;
    }
    
    /**
     * Decode header section
     */
    async decodeHeader(headerBuffer) {
        const keyData = this.decoderState.keyHistory.get(
            Array.from(this.decoderState.keyHistory.keys())[0]
        );
        
        if (!keyData) {
            throw new Error('No encryption key available');
        }
        
        try {
            // Extract IV and auth tag from header
            const iv = headerBuffer.slice(0, 12);
            const authTag = headerBuffer.slice(-16);
            const encryptedData = headerBuffer.slice(12, -16);
            
            // Decrypt header
            const decipher = crypto.createDecipherGCM(this.config.encryptionAlgorithm, keyData.key);
            decipher.setIV(iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            keyData.used++;
            keyData.successful++;
            
            const headerData = JSON.parse(decrypted.toString());
            
            console.log(`🔓 Header decoded successfully: ${Object.keys(headerData).length} fields`);
            
            return headerData;
            
        } catch (error) {
            console.error('❌ Header decoding failed:', error);
            throw new Error(`Header decoding failed: ${error.message}`);
        }
    }
    
    /**
     * Decode footer section
     */
    async decodeFooter(footerBuffer) {
        // Similar to header decoding but with footer-specific logic
        try {
            const keyData = this.decoderState.keyHistory.get(
                Array.from(this.decoderState.keyHistory.keys())[0]
            );
            
            const iv = footerBuffer.slice(0, 12);
            const authTag = footerBuffer.slice(-16);
            const encryptedData = footerBuffer.slice(12, -16);
            
            const decipher = crypto.createDecipherGCM(this.config.encryptionAlgorithm, keyData.key);
            decipher.setIV(iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            const footerData = JSON.parse(decrypted.toString());
            
            console.log(`🔓 Footer decoded successfully: ${Object.keys(footerData).length} fields`);
            
            return footerData;
            
        } catch (error) {
            console.error('❌ Footer decoding failed:', error);
            throw new Error(`Footer decoding failed: ${error.message}`);
        }
    }
    
    /**
     * Process middle content with RNG scrambling
     */
    async processMiddleContent(middleBuffer, headerData) {
        console.log(`🎲 Processing middle content with RNG (${middleBuffer.length} bytes)`);
        
        // Generate scramble pattern based on header data
        const pattern = this.generateScramblePattern(middleBuffer.length, headerData);
        
        // Apply RNG-based processing
        const processed = Buffer.alloc(middleBuffer.length);
        
        for (let i = 0; i < middleBuffer.length; i++) {
            const scrambleValue = pattern[i % pattern.length];
            
            if (Math.random() < this.config.scrambleIntensity) {
                // Apply RNG scrambling
                const rngValue = this.nextRandom() & 0xFF;
                processed[i] = middleBuffer[i] ^ scrambleValue ^ rngValue;
            } else {
                // Keep original value
                processed[i] = middleBuffer[i];
            }
        }
        
        console.log(`🎲 Middle content processed with ${(this.config.scrambleIntensity * 100).toFixed(1)}% scrambling`);
        
        return processed;
    }
    
    /**
     * Generate scramble pattern
     */
    generateScramblePattern(length, headerData) {
        const pattern = new Array(Math.min(length, 1024)); // Max 1KB pattern
        
        // Use header data to seed pattern
        const seed = headerData.timestamp || Date.now();
        this.seedRNG(seed);
        
        for (let i = 0; i < pattern.length; i++) {
            pattern[i] = this.nextRandom() & 0xFF;
        }
        
        return pattern;
    }
    
    /**
     * Verify data integrity
     */
    verifyIntegrity(header, content, footer) {
        try {
            // Check header-footer consistency
            if (header.timestamp && footer.timestamp) {
                const timeDiff = Math.abs(header.timestamp - footer.timestamp);
                if (timeDiff > 1000) { // More than 1 second difference
                    return {
                        valid: false,
                        reason: 'Header-footer timestamp mismatch'
                    };
                }
            }
            
            // Check content length consistency
            if (header.contentLength && header.contentLength !== content.length) {
                return {
                    valid: false,
                    reason: 'Content length mismatch'
                };
            }
            
            // Calculate content checksum
            const contentHash = crypto.createHash('sha256').update(content).digest('hex');
            if (footer.contentHash && footer.contentHash !== contentHash) {
                return {
                    valid: false,
                    reason: 'Content hash mismatch'
                };
            }
            
            return { valid: true };
            
        } catch (error) {
            return {
                valid: false,
                reason: `Integrity check error: ${error.message}`
            };
        }
    }
    
    /**
     * Detect anomalies in the decoded data
     */
    detectAnomalies(sections, processingTime) {
        const anomalies = [];
        
        // Check processing time anomaly
        if (processingTime > this.decoderState.averageDecodeTime * 2) {
            anomalies.push({
                type: 'processing_delay',
                severity: 'medium',
                value: processingTime,
                threshold: this.decoderState.averageDecodeTime * 2
            });
        }
        
        // Check section size anomalies
        const expectedMiddleSize = sections.header.length + sections.footer.length;
        if (sections.middle.length < expectedMiddleSize * 0.1) {
            anomalies.push({
                type: 'suspicious_content_size',
                severity: 'high',
                value: sections.middle.length,
                threshold: expectedMiddleSize * 0.1
            });
        }
        
        // Update anomaly history
        this.decoderState.anomalyHistory.push({
            timestamp: Date.now(),
            count: anomalies.length,
            types: anomalies.map(a => a.type)
        });
        
        // Keep only last 100 anomaly records
        if (this.decoderState.anomalyHistory.length > 100) {
            this.decoderState.anomalyHistory.shift();
        }
        
        if (anomalies.length > 0) {
            this.decoderState.anomaliesDetected += anomalies.length;
            console.log(`⚠️ Detected ${anomalies.length} anomalies`);
        }
        
        return anomalies;
    }
    
    /**
     * Adjust tick rate based on detected anomalies
     */
    adjustTickRateBasedOnAnomalies() {
        const recentAnomalies = this.decoderState.anomalyHistory
            .filter(a => Date.now() - a.timestamp < 60000) // Last minute
            .reduce((sum, a) => sum + a.count, 0);
        
        const anomalyRate = recentAnomalies / 60; // Anomalies per second
        
        let newMultiplier = 1.0;
        
        if (anomalyRate > this.config.anomalyThreshold) {
            // High anomaly rate - slow down
            newMultiplier = Math.max(
                this.config.minRateMultiplier,
                1.0 - (anomalyRate * 0.5)
            );
            
            console.log(`⬇️ Slowing down tick rate due to anomalies: ${anomalyRate.toFixed(2)}/s`);
            
        } else if (anomalyRate < this.config.anomalyThreshold * 0.1) {
            // Low anomaly rate - speed up
            newMultiplier = Math.min(
                this.config.maxRateMultiplier,
                1.0 + (1.0 - anomalyRate)
            );
            
            console.log(`⬆️ Speeding up tick rate due to low anomalies: ${anomalyRate.toFixed(2)}/s`);
        }
        
        // Update tick rate if multiplier changed significantly
        if (Math.abs(newMultiplier - this.decoderState.rateMultiplier) > 0.1) {
            this.decoderState.rateMultiplier = newMultiplier;
            this.decoderState.currentTickRate = Math.round(
                this.config.baseTickRate / newMultiplier
            );
            
            this.decoderState.lastRateAdjustment = Date.now();
            
            this.emit('tick_rate_adjusted', {
                multiplier: newMultiplier,
                tickRate: this.decoderState.currentTickRate,
                anomalyRate,
                timestamp: Date.now()
            });
            
            console.log(`⏰ Tick rate adjusted: ${this.decoderState.currentTickRate}ms (${newMultiplier.toFixed(2)}x)`);
        }
    }
    
    /**
     * Update average decode time
     */
    updateAverageDecodeTime(newTime) {
        if (this.decoderState.averageDecodeTime === 0) {
            this.decoderState.averageDecodeTime = newTime;
        } else {
            // Exponential moving average
            this.decoderState.averageDecodeTime = 
                (this.decoderState.averageDecodeTime * 0.9) + (newTime * 0.1);
        }
    }
    
    /**
     * Get decoder status
     */
    getDecoderStatus() {
        return {
            status: this.decoderState.emergencyStopActive ? 'emergency_stop' : 'active',
            statistics: {
                totalDecoded: this.decoderState.totalDecoded,
                successfulDecodes: this.decoderState.successfulDecodes,
                failedDecodes: this.decoderState.failedDecodes,
                successRate: this.decoderState.totalDecoded > 0 ? 
                    (this.decoderState.successfulDecodes / this.decoderState.totalDecoded) * 100 : 0,
                averageDecodeTime: this.decoderState.averageDecodeTime,
                anomaliesDetected: this.decoderState.anomaliesDetected
            },
            tickRate: {
                current: this.decoderState.currentTickRate,
                base: this.config.baseTickRate,
                multiplier: this.decoderState.rateMultiplier,
                lastAdjustment: this.decoderState.lastRateAdjustment
            },
            encryption: {
                currentKeyAge: Date.now() - (Array.from(this.decoderState.keyHistory.values())[0]?.created || Date.now()),
                totalKeys: this.decoderState.keyHistory.size,
                nextRotation: this.config.keyRotationInterval - 
                    (Date.now() - (Array.from(this.decoderState.keyHistory.values())[0]?.created || Date.now()))
            },
            operations: {
                active: this.decoderState.processingOperations.size,
                emergencyStop: this.decoderState.emergencyStopActive
            }
        };
    }
    
    /**
     * Create test data for demonstration
     */
    async createTestData() {
        const headerData = {
            timestamp: Date.now(),
            version: '1.0',
            contentLength: 1000,
            encryption: 'aes-256-gcm'
        };
        
        const footerData = {
            timestamp: Date.now(),
            contentHash: crypto.createHash('sha256').update('test content').digest('hex'),
            checksum: 'valid'
        };
        
        // Encrypt header
        const headerIv = crypto.randomBytes(12);
        const headerCipher = crypto.createCipherGCM(this.config.encryptionAlgorithm, this.decoderState.currentKey);
        headerCipher.setIV(headerIv);
        
        let encryptedHeader = headerCipher.update(JSON.stringify(headerData));
        encryptedHeader = Buffer.concat([encryptedHeader, headerCipher.final()]);
        const headerAuthTag = headerCipher.getAuthTag();
        
        const header = Buffer.concat([headerIv, encryptedHeader, headerAuthTag]);
        
        // Encrypt footer
        const footerIv = crypto.randomBytes(12);
        const footerCipher = crypto.createCipherGCM(this.config.encryptionAlgorithm, this.decoderState.currentKey);
        footerCipher.setIV(footerIv);
        
        let encryptedFooter = footerCipher.update(JSON.stringify(footerData));
        encryptedFooter = Buffer.concat([encryptedFooter, footerCipher.final()]);
        const footerAuthTag = footerCipher.getAuthTag();
        
        const footer = Buffer.concat([footerIv, encryptedFooter, footerAuthTag]);
        
        // Create middle content
        const middle = crypto.randomBytes(1000);
        
        // Combine all sections
        const testData = Buffer.concat([header, middle, footer]);
        
        return testData;
    }
}

// Export for use in other modules
module.exports = HeaderFooterDecoder;

// If run directly, start the decoder with test data
if (require.main === module) {
    console.log('🔐 STARTING HEADER/FOOTER DECODER ENGINE');
    console.log('========================================');
    
    const decoder = new HeaderFooterDecoder();
    
    // Demo with test data
    setTimeout(async () => {
        try {
            console.log('\n🧪 Creating test data...');
            const testData = await decoder.createTestData();
            
            console.log('\n🔐 Testing decode operation...');
            const result = await decoder.decodeHeaderFooterStream(testData);
            
            console.log('\n✅ Test completed successfully!');
            console.log('📊 Decoder Status:');
            const status = decoder.getDecoderStatus();
            console.log(JSON.stringify(status, null, 2));
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    }, 2000);
    
    // Status reporting
    setInterval(() => {
        const status = decoder.getDecoderStatus();
        console.log('\n📊 DECODER STATUS:');
        console.log(`   Status: ${status.status}`);
        console.log(`   Decoded: ${status.statistics.totalDecoded} (${status.statistics.successRate.toFixed(1)}% success)`);
        console.log(`   Tick Rate: ${status.tickRate.current}ms (${status.tickRate.multiplier.toFixed(2)}x)`);
        console.log(`   Anomalies: ${status.statistics.anomaliesDetected}`);
        console.log(`   Active Operations: ${status.operations.active}`);
    }, 10000);
    
    console.log('\n🎮 FEATURES:');
    console.log('   ✅ Header/Footer encryption with AES-256-GCM');
    console.log('   ✅ RNG-based middle content scrambling');
    console.log('   ✅ Dynamic tick rate adjustment based on anomalies');
    console.log('   ✅ Emergency stop controls (ctrl+c + enter)');
    console.log('   ✅ Automatic key rotation every 5 minutes');
    console.log('   ✅ Real-time anomaly detection');
    console.log('   ✅ Integrity verification');
    console.log('\n🔐 Ready for secure decoding!');
}