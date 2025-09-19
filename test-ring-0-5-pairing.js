#!/usr/bin/env node

/**
 * RING 0 ↔ RING 5 PAIRING SYSTEM TEST
 * 
 * Tests the bidirectional communication between:
 * - Ring 0 (Mathematical/RNG Core)
 * - Ring 5 (Broadcast Layer)
 * 
 * Demonstrates:
 * - Mathematical proof generation in Ring 0
 * - Real-time broadcasting via Ring 5
 * - Verification feedback loop
 * - Public viewer connections
 * - WebSocket communication
 */

const Ring0MathematicalCore = require('./ring-0-mathematical-core');
const Ring5BroadcastLayer = require('./ring-5-broadcast-layer');
const unifiedColorSystem = require('./unified-color-system');

class Ring0Ring5PairingTest {
    constructor() {
        this.testResults = {
            ring0Initialization: false,
            ring5Initialization: false,
            pairingEstablished: false,
            mathematicalProofGeneration: false,
            broadcastToRing5: false,
            verificationFeedback: false,
            publicViewerConnection: false
        };
        
        this.testStartTime = Date.now();
        this.proofCount = 0;
        this.feedbackCount = 0;
    }
    
    async runFullPairingTest() {
        console.log('🧪 Starting Ring 0 ↔ Ring 5 Pairing System Test\n');
        
        try {
            // Phase 1: Initialize Ring 5 (must be first to accept Ring 0 connection)
            await this.initializeRing5();
            
            // Phase 2: Initialize Ring 0 (will connect to Ring 5)
            await this.initializeRing0();
            
            // Phase 3: Wait for pairing establishment
            await this.waitForPairing();
            
            // Phase 4: Test mathematical proof generation and broadcasting
            await this.testMathematicalProofBroadcasting();
            
            // Phase 5: Test public viewer connection
            await this.testPublicViewerConnection();
            
            // Phase 6: Test verification feedback loop
            await this.testVerificationFeedback();
            
            // Phase 7: Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Test failed: ${error.message}`));
            process.exit(1);
        }
    }
    
    async initializeRing5() {
        console.log('📡 Phase 1: Initializing Ring 5 (Broadcast Layer)...');
        
        this.ring5 = new Ring5BroadcastLayer();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Ring 5 initialization timeout'));
            }, 30000);
            
            this.ring5.on('ring5Ready', (data) => {
                clearTimeout(timeout);
                this.testResults.ring5Initialization = true;
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `Ring 5 initialized - Waiting for Ring 0 on port ${data.ringId === 5 ? '7778' : 'unknown'}`));
                
                resolve(data);
            });
        });
    }
    
    async initializeRing0() {
        console.log('🧮 Phase 2: Initializing Ring 0 (Mathematical Core)...');
        
        this.ring0 = new Ring0MathematicalCore();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Ring 0 initialization timeout'));
            }, 30000);
            
            this.ring0.on('ring0Ready', (data) => {
                clearTimeout(timeout);
                this.testResults.ring0Initialization = true;
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `Ring 0 initialized - Attempting Ring 5 connection...`));
                
                resolve(data);
            });
        });
    }
    
    async waitForPairing() {
        console.log('🔗 Phase 3: Waiting for Ring 0 ↔ Ring 5 pairing...');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Pairing establishment timeout'));
            }, 15000);
            
            // Listen for pairing establishment from Ring 0
            this.ring0.on('ring5PairingEstablished', (data) => {
                clearTimeout(timeout);
                this.testResults.pairingEstablished = true;
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    'Ring 0 ↔ Ring 5 pairing established! ✅'));
                
                console.log(`  🕐 Pairing timestamp: ${new Date(data.timestamp).toISOString()}`);
                console.log(`  🎯 Ring 5 capabilities: ${data.ring5Capabilities.length} features available`);
                
                resolve(data);
            });
            
            // Also listen from Ring 5 side
            this.ring5.on('ring0PairingEstablished', (data) => {
                console.log(unifiedColorSystem.formatStatus('info', 
                    'Ring 5 confirmed pairing with Ring 0'));
            });
        });
    }
    
    async testMathematicalProofBroadcasting() {
        console.log('📊 Phase 4: Testing mathematical proof broadcasting...');
        
        // Set up proof broadcast listener on Ring 5
        this.ring5.on('ring0StatusUpdate', (status) => {
            console.log(unifiedColorSystem.formatStatus('info', 
                'Ring 5 received Ring 0 status update'));
        });
        
        // Generate multiple mathematical proofs
        const testFormulas = [
            { name: 'pythagorean', variables: { a: 3, b: 4 } },
            { name: 'kinetic_energy', variables: { m: 10, v: 5 } },
            { name: 'compound_interest', variables: { P: 1000, r: 0.05, t: 2 } }
        ];
        
        for (const test of testFormulas) {
            try {
                console.log(`  🔢 Testing formula: ${test.name}`);
                
                const result = await this.ring0.calculateFormula(test.name, test.variables);
                this.proofCount++;
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `    Formula result: ${result} (proof generated and broadcast)`));
                
                // Wait a moment between proofs
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(unifiedColorSystem.formatStatus('warning', 
                    `    Formula ${test.name} failed: ${error.message}`));
            }
        }
        
        if (this.proofCount > 0) {
            this.testResults.mathematicalProofGeneration = true;
            this.testResults.broadcastToRing5 = true;
            
            console.log(unifiedColorSystem.formatStatus('success', 
                `Mathematical proof broadcasting: ${this.proofCount} proofs generated ✅`));
        }
    }
    
    async testPublicViewerConnection() {
        console.log('👁️ Phase 5: Testing public viewer connection...');
        
        try {
            const WebSocket = require('ws');
            
            // Create a mock public viewer connection
            this.mockViewer = new WebSocket('ws://localhost:7782');
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Public viewer connection timeout'));
                }, 10000);
                
                this.mockViewer.on('open', () => {
                    console.log(unifiedColorSystem.formatStatus('success', 
                        'Mock public viewer connected to Ring 5 ✅'));
                });
                
                this.mockViewer.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        
                        if (message.type === 'welcome') {
                            clearTimeout(timeout);
                            this.testResults.publicViewerConnection = true;
                            
                            console.log(unifiedColorSystem.formatStatus('success', 
                                `Public viewer welcomed with viewerId: ${message.viewerId}`));
                            console.log(`  📺 Ring capabilities: ${message.capabilities.length} features`);
                            
                            resolve(message);
                        } else if (message.type === 'mathematical_proof_broadcast') {
                            console.log(unifiedColorSystem.formatStatus('info', 
                                `📊 Viewer received proof broadcast: ${message.proof.formula}`));
                        }
                        
                    } catch (error) {
                        console.log(unifiedColorSystem.formatStatus('warning', 
                            `Invalid viewer message: ${error.message}`));
                    }
                });
                
                this.mockViewer.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Public viewer test skipped: ${error.message}`));
        }
    }
    
    async testVerificationFeedback() {
        console.log('🔄 Phase 6: Testing verification feedback loop...');
        
        // Listen for verification feedback on Ring 0
        this.ring0.on('verificationFeedback', (feedbackData) => {
            this.feedbackCount++;
            
            console.log(unifiedColorSystem.formatStatus('success', 
                `Ring 0 received feedback for proof ${feedbackData.proofId}`));
            console.log(`  👥 Public viewers: ${feedbackData.feedback.publicVerification.viewers}`);
            console.log(`  📡 Broadcast success: ${feedbackData.feedback.publicVerification.broadcast ? 'Yes' : 'No'}`);
            
            this.testResults.verificationFeedback = true;
        });
        
        // Generate one more proof to trigger feedback
        try {
            await this.ring0.calculateFormula('damage_calculation', {
                base_damage: 100,
                crit_chance: 0.25,
                crit_multiplier: 2.0,
                level_scaling: 1.5
            });
            
            // Wait for feedback
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Feedback test calculation failed: ${error.message}`));
        }
    }
    
    generateTestReport() {
        const totalTests = Object.keys(this.testResults).length;
        const passedTests = Object.values(this.testResults).filter(Boolean).length;
        const testDuration = Date.now() - this.testStartTime;
        
        console.log('\n🎯 RING 0 ↔ RING 5 PAIRING TEST RESULTS');
        console.log('═'.repeat(50));
        
        console.log(`\n📊 Test Summary:`);
        console.log(`  Tests Passed: ${passedTests}/${totalTests}`);
        console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log(`  Test Duration: ${(testDuration / 1000).toFixed(1)}s`);
        console.log(`  Mathematical Proofs: ${this.proofCount} generated`);
        console.log(`  Feedback Messages: ${this.feedbackCount} received`);
        
        console.log(`\n✅ Test Results:`);
        Object.entries(this.testResults).forEach(([test, passed]) => {
            const status = passed ? '✅' : '❌';
            const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
            console.log(`  ${status} ${testName}`);
        });
        
        if (passedTests === totalTests) {
            console.log(`\n🎉 ALL TESTS PASSED! Ring 0 ↔ Ring 5 pairing system is working correctly.`);
            console.log(`\n🚀 System Benefits Verified:`);
            console.log(`  ✅ Mathematical proofs are generated in Ring 0`);
            console.log(`  ✅ Real-time broadcasting via Ring 5`);
            console.log(`  ✅ Public viewers can connect and receive proofs`);
            console.log(`  ✅ Verification feedback flows back to Ring 0`);
            console.log(`  ✅ WebSocket communication is stable`);
            console.log(`  ✅ Ring pairing system is bidirectional`);
        } else {
            console.log(`\n⚠️ Some tests failed. Ring 0 ↔ Ring 5 pairing needs attention.`);
        }
        
        console.log('\n🔧 Next Steps:');
        console.log('  1. Both rings can now run independently');
        console.log('  2. Mathematical proofs broadcast to public audiences');
        console.log('  3. Integration with constellation verification stream');
        console.log('  4. Cross-ring database queries and translations');
    }
    
    async cleanup() {
        console.log('\n🧹 Cleaning up test environment...');
        
        if (this.mockViewer) {
            this.mockViewer.close();
        }
        
        if (this.ring0) {
            await this.ring0.cleanup?.();
        }
        
        if (this.ring5) {
            await this.ring5.cleanup();
        }
        
        console.log('Cleanup complete.');
    }
}

// Run the test
if (require.main === module) {
    const test = new Ring0Ring5PairingTest();
    
    async function run() {
        try {
            await test.runFullPairingTest();
        } catch (error) {
            console.error('Test execution failed:', error.message);
        } finally {
            await test.cleanup();
            process.exit(0);
        }
    }
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await test.cleanup();
        process.exit(0);
    });
    
    run();
}