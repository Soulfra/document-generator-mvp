#!/usr/bin/env node
// PACKET-INTEGRITY-TEST.js - Test packets for 100% cleanliness including voice/whisper

const crypto = require('crypto');

class PacketIntegrityTest {
    constructor() {
        this.tests = {
            passed: 0,
            failed: 0,
            results: []
        };
    }

    // Test packet integrity
    testPacketIntegrity(packet) {
        console.log('\n🔍 TESTING PACKET INTEGRITY...');
        
        const tests = [
            { name: 'Checksum Verification', fn: () => this.verifyChecksum(packet) },
            { name: 'Structure Validation', fn: () => this.validateStructure(packet) },
            { name: 'Corruption Detection', fn: () => this.detectCorruption(packet) },
            { name: 'Voice Pattern Analysis', fn: () => this.analyzeVoicePattern(packet) },
            { name: 'Timestamp Validation', fn: () => this.validateTimestamp(packet) },
            { name: 'Encryption Test', fn: () => this.testEncryption(packet) },
            { name: 'Size Limits', fn: () => this.checkSizeLimits(packet) },
            { name: 'Character Encoding', fn: () => this.validateEncoding(packet) }
        ];
        
        let allPassed = true;
        
        tests.forEach(test => {
            try {
                const result = test.fn();
                console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
                
                if (result) {
                    this.tests.passed++;
                } else {
                    this.tests.failed++;
                    allPassed = false;
                }
                
                this.tests.results.push({
                    test: test.name,
                    passed: result,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.log(`❌ ${test.name}: ERROR - ${error.message}`);
                this.tests.failed++;
                allPassed = false;
            }
        });
        
        return allPassed;
    }

    // Verify checksum
    verifyChecksum(packet) {
        if (!packet.data || !packet.checksum) return false;
        
        const calculated = crypto.createHash('sha256')
            .update(JSON.stringify(packet.data))
            .digest('hex')
            .substring(0, 16);
        
        return calculated === packet.checksum;
    }

    // Validate packet structure
    validateStructure(packet) {
        const required = ['id', 'from', 'to', 'timestamp', 'data'];
        return required.every(field => packet.hasOwnProperty(field));
    }

    // Detect corruption patterns
    detectCorruption(packet) {
        const corruptionPatterns = [
            /\x00/, // Null bytes
            /[\x01-\x08\x0B\x0C\x0E-\x1F]/, // Control characters
            /[^\x00-\x7F].*[^\x00-\x7F]/, // Invalid UTF-8
            /<script>/i, // XSS attempts
            /DROP TABLE/i, // SQL injection
            /\.\.\//  // Path traversal
        ];
        
        const dataStr = JSON.stringify(packet);
        return !corruptionPatterns.some(pattern => pattern.test(dataStr));
    }

    // Analyze voice patterns
    analyzeVoicePattern(packet) {
        if (!packet.voice) return true; // No voice data is valid
        
        const voice = packet.voice;
        
        // Check voice parameters
        if (voice.volume < 0 || voice.volume > 1) return false;
        if (voice.frequency && (voice.frequency < 20 || voice.frequency > 20000)) return false;
        
        // Check for vampire hiss pattern
        if (voice.pattern === 'vampire_hiss') {
            console.log('  🧛 Vampire voice detected!');
            return false; // Corrupted
        }
        
        return true;
    }

    // Validate timestamp
    validateTimestamp(packet) {
        const now = Date.now();
        const timestamp = packet.timestamp;
        
        // Check if timestamp is reasonable (within last hour and not in future)
        return timestamp > (now - 3600000) && timestamp <= now;
    }

    // Test encryption/decryption
    testEncryption(packet) {
        try {
            const key = crypto.scryptSync('test-key', 'salt', 32);
            const iv = crypto.randomBytes(16);
            
            // Encrypt
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let encrypted = cipher.update(JSON.stringify(packet.data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Decrypt
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            // Verify match
            return JSON.stringify(packet.data) === decrypted;
        } catch (error) {
            return false;
        }
    }

    // Check size limits
    checkSizeLimits(packet) {
        const packetSize = JSON.stringify(packet).length;
        const maxSize = 1048576; // 1MB
        
        return packetSize > 0 && packetSize < maxSize;
    }

    // Validate character encoding
    validateEncoding(packet) {
        try {
            const str = JSON.stringify(packet);
            const buffer = Buffer.from(str, 'utf8');
            const decoded = buffer.toString('utf8');
            return str === decoded;
        } catch (error) {
            return false;
        }
    }

    // Generate test report
    generateReport() {
        console.log('\n📊 INTEGRITY TEST REPORT');
        console.log('========================');
        console.log(`Total Tests: ${this.tests.passed + this.tests.failed}`);
        console.log(`✅ Passed: ${this.tests.passed}`);
        console.log(`❌ Failed: ${this.tests.failed}`);
        console.log(`Success Rate: ${((this.tests.passed / (this.tests.passed + this.tests.failed)) * 100).toFixed(2)}%`);
        
        if (this.tests.failed > 0) {
            console.log('\nFailed Tests:');
            this.tests.results
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.test}`));
        }
        
        return this.tests.failed === 0;
    }
}

// Test runner
if (require.main === module) {
    console.log('🧪 PACKET INTEGRITY TESTING SUITE');
    console.log('=================================');
    
    const tester = new PacketIntegrityTest();
    
    // Test 1: Clean packet
    console.log('\n📦 TEST 1: Clean Packet');
    const cleanPacket = {
        id: crypto.randomBytes(8).toString('hex'),
        from: 'terminal',
        to: 'electron',
        timestamp: Date.now(),
        data: { message: 'Hello World', type: 'greeting' },
        checksum: null
    };
    cleanPacket.checksum = crypto.createHash('sha256')
        .update(JSON.stringify(cleanPacket.data))
        .digest('hex')
        .substring(0, 16);
    
    tester.testPacketIntegrity(cleanPacket);
    
    // Test 2: Voice packet
    console.log('\n📦 TEST 2: Voice Packet');
    const voicePacket = {
        id: crypto.randomBytes(8).toString('hex'),
        from: 'phone',
        to: 'desktop',
        timestamp: Date.now(),
        data: { message: 'Voice test' },
        voice: { volume: 0.7, frequency: 440, pattern: 'normal' },
        checksum: null
    };
    voicePacket.checksum = crypto.createHash('sha256')
        .update(JSON.stringify(voicePacket.data))
        .digest('hex')
        .substring(0, 16);
    
    tester.testPacketIntegrity(voicePacket);
    
    // Test 3: Corrupted packet
    console.log('\n📦 TEST 3: Corrupted Packet');
    const corruptedPacket = {
        id: crypto.randomBytes(8).toString('hex'),
        from: 'unknown',
        to: 'victim',
        timestamp: Date.now() + 10000, // Future timestamp
        data: { message: 'DROP TABLE users;', type: 'attack' },
        voice: { volume: 0.4, frequency: 100, pattern: 'vampire_hiss' },
        checksum: 'wrong'
    };
    
    tester.testPacketIntegrity(corruptedPacket);
    
    // Final report
    console.log('\n' + '='.repeat(40));
    const clean = tester.generateReport();
    
    if (clean) {
        console.log('\n✅ SYSTEM IS 100% CLEAN!');
    } else {
        console.log('\n⚠️  CORRUPTION DETECTED - CLEANSING REQUIRED!');
    }
}

module.exports = PacketIntegrityTest;