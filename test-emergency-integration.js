/**
 * Emergency Recovery System Integration Test
 * 
 * Tests the complete integration of:
 * - PGP authentication
 * - UPC/QR tracking  
 * - Emergency recovery
 * - Key interchange
 * - Leak detection
 * - Custom identifier generation
 */

const EmergencyRecoverySystem = require('./emergency-recovery-system');
const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');

class EmergencyIntegrationTest {
    constructor() {
        this.baseUrl = 'http://localhost:9911';
        this.wsUrl = 'ws://localhost:9912';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🧪 Starting Emergency Recovery System Integration Tests\n');
        
        // Start the emergency recovery system
        this.system = new EmergencyRecoverySystem();
        await this.system.start();
        
        // Give it a moment to fully initialize
        await this.sleep(2000);
        
        // Run test suite
        await this.testHealthCheck();
        await this.testEmergencyActivation();
        await this.testKeyInterchange();
        await this.testLeakDetection();
        await this.testIdentifierGeneration();
        await this.testWebSocketMonitoring();
        await this.testTamperDetection();
        await this.testLegacyCompatibility();
        
        // Print results
        this.printResults();
        
        // Cleanup
        await this.system.stop();
    }
    
    async testHealthCheck() {
        console.log('📋 Testing health check...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            
            this.addResult('Health Check', 'PASS', {
                status: response.data.status,
                components: response.data.components
            });
            
        } catch (error) {
            this.addResult('Health Check', 'FAIL', error.message);
        }
    }
    
    async testEmergencyActivation() {
        console.log('🚨 Testing emergency activation...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/emergency/activate`, {
                userId: 'test-user-123',
                reason: 'Suspected account compromise',
                authMethod: 'pgp'
            });
            
            this.addResult('Emergency Activation', 'PASS', {
                sessionId: response.data.sessionId,
                availableMethods: response.data.availableMethods
            });
            
            this.testSessionId = response.data.sessionId;
            
        } catch (error) {
            this.addResult('Emergency Activation', 'FAIL', error.message);
        }
    }
    
    async testKeyInterchange() {
        console.log('🔑 Testing key interchange...');
        
        try {
            // Generate test keys
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            
            const agentId = 'test-agent-001';
            const signature = this.signData(agentId, privateKey);
            
            const response = await axios.post(`${this.baseUrl}/keys/interchange`, {
                agentId,
                currentKey: publicKey,
                newKey: publicKey, // For testing
                signature
            });
            
            this.addResult('Key Interchange', 'PASS', {
                newKeyId: response.data.newKeyId,
                identifiers: response.data.identifiers
            });
            
        } catch (error) {
            this.addResult('Key Interchange', 'FAIL', error.response?.data || error.message);
        }
    }
    
    async testLeakDetection() {
        console.log('🔍 Testing leak detection...');
        
        try {
            // Test with a known test key (not a real leaked key)
            const testKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890test
-----END PUBLIC KEY-----`;
            
            const response = await axios.post(`${this.baseUrl}/security/check-leak`, {
                keyType: 'pgp',
                keyData: testKey,
                checkSource: 'standard'
            });
            
            this.addResult('Leak Detection', 'PASS', {
                checked: response.data.checked,
                compromised: response.data.compromised
            });
            
        } catch (error) {
            this.addResult('Leak Detection', 'FAIL', error.message);
        }
    }
    
    async testIdentifierGeneration() {
        console.log('🏷️ Testing identifier generation...');
        
        const identifierTypes = ['upc', 'qr', 'rfid', 'bluetooth', 'universal'];
        
        for (const type of identifierTypes) {
            try {
                const response = await axios.post(`${this.baseUrl}/identifier/generate`, {
                    type,
                    ownerId: 'test-owner-123',
                    metadata: { purpose: 'integration-test' },
                    legacyCompatible: true
                });
                
                this.addResult(`${type.toUpperCase()} Generation`, 'PASS', {
                    identifier: response.data.identifier,
                    scannable: response.data.scannable
                });
                
                // Test legacy compatibility
                if (response.data.identifier.legacyFormats) {
                    this.addResult(`${type.toUpperCase()} Legacy`, 'PASS', {
                        formats: Object.keys(response.data.identifier.legacyFormats)
                    });
                }
                
            } catch (error) {
                this.addResult(`${type.toUpperCase()} Generation`, 'FAIL', error.message);
            }
        }
    }
    
    async testWebSocketMonitoring() {
        console.log('🔌 Testing WebSocket monitoring...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket(this.wsUrl);
            
            ws.on('open', () => {
                // Send authentication
                ws.send(JSON.stringify({
                    type: 'authenticate',
                    data: { token: 'test-token' }
                }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                
                if (message.type === 'connected') {
                    this.addResult('WebSocket Connection', 'PASS', {
                        sessionId: message.sessionId,
                        status: message.status
                    });
                    
                    // Test monitoring
                    ws.send(JSON.stringify({
                        type: 'monitor',
                        data: { events: ['emergency', 'tamper', 'leak'] }
                    }));
                    
                    setTimeout(() => {
                        ws.close();
                        resolve();
                    }, 1000);
                }
            });
            
            ws.on('error', (error) => {
                this.addResult('WebSocket Connection', 'FAIL', error.message);
                resolve();
            });
        });
    }
    
    async testTamperDetection() {
        console.log('🛡️ Testing tamper detection...');
        
        try {
            // Report a test tamper event
            const response = await axios.post(`${this.baseUrl}/tamper/report`, {
                resourceType: 'config',
                resourceId: 'test-config.json',
                tamperType: 'unauthorized_modification',
                details: 'Test tamper event'
            });
            
            this.addResult('Tamper Reporting', 'PASS', response.data);
            
            // Get tamper history
            const history = await axios.get(`${this.baseUrl}/tamper/history`);
            
            this.addResult('Tamper History', 'PASS', {
                events: history.data.length
            });
            
        } catch (error) {
            this.addResult('Tamper Detection', 'FAIL', error.message);
        }
    }
    
    async testLegacyCompatibility() {
        console.log('📟 Testing legacy hardware compatibility...');
        
        try {
            // Generate a universal identifier
            const genResponse = await axios.post(`${this.baseUrl}/identifier/generate`, {
                type: 'universal',
                ownerId: 'legacy-test',
                metadata: { device: 'legacy-scanner' },
                legacyCompatible: true
            });
            
            const universalId = genResponse.data.identifier;
            
            // Test legacy format retrieval
            const legacyResponse = await axios.get(
                `${this.baseUrl}/identifier/legacy-compatible/${universalId.uid}`
            );
            
            this.addResult('Legacy Compatibility', 'PASS', {
                supportedFormats: Object.keys(legacyResponse.data.formats),
                protocols: legacyResponse.data.protocols
            });
            
        } catch (error) {
            this.addResult('Legacy Compatibility', 'FAIL', error.message);
        }
    }
    
    // Helper methods
    
    signData(data, privateKey) {
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        return sign.sign(privateKey, 'hex');
    }
    
    addResult(test, status, details) {
        this.testResults.push({ test, status, details });
        console.log(`  ${status === 'PASS' ? '✅' : '❌'} ${test}`);
    }
    
    printResults() {
        console.log('\n📊 Test Results Summary\n');
        console.log('='.repeat(80));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        this.testResults.forEach(result => {
            console.log(`\n${result.status === 'PASS' ? '✅' : '❌'} ${result.test}`);
            if (result.details) {
                console.log('   Details:', JSON.stringify(result.details, null, 2));
            }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\nTotal Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed} (${((passed/this.testResults.length)*100).toFixed(1)}%)`);
        console.log(`Failed: ${failed} (${((failed/this.testResults.length)*100).toFixed(1)}%)`);
        console.log('\n' + '='.repeat(80));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests
if (require.main === module) {
    const tester = new EmergencyIntegrationTest();
    
    tester.runAllTests()
        .then(() => {
            console.log('\n✅ Integration tests completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Integration tests failed:', error);
            process.exit(1);
        });
}

module.exports = EmergencyIntegrationTest;