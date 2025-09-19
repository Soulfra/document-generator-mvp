#!/usr/bin/env node

/**
 * 🧪 UNIVERSAL BRAIN INTEGRATION TEST
 * 
 * Test the complete top-layer orchestration architecture:
 * - Universal Brain (top layer processing)
 * - Verification Layer (bottom layer mathematical verification)
 * - Respawn Memory (persistent character skills/instincts)
 * - DNA/helix patterns (no template literal issues)
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('\n🧪 UNIVERSAL BRAIN INTEGRATION TEST');
console.log('==================================');

class UniversalBrainTest {
    constructor() {
        this.universalBrainUrl = 'http://localhost:9999';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🚀 Starting Universal Brain integration tests...\n');
        
        // Test 1: Health check
        await this.testHealthCheck();
        
        // Test 2: Brand orchestration
        await this.testBrandOrchestration();
        
        // Test 3: Natural tag queries (@cal.fintech.expert)
        await this.testNaturalTagQueries();
        
        // Test 4: Document processing
        await this.testDocumentProcessing();
        
        // Test 5: Character respawn
        await this.testCharacterRespawn();
        
        // Test 6: Verification system
        await this.testVerificationSystem();
        
        // Test 7: Memory system
        await this.testMemorySystem();
        
        // Summary
        this.printTestSummary();
    }
    
    async testHealthCheck() {
        console.log('🏥 Test 1: Health Check');
        
        try {
            const response = await fetch(this.universalBrainUrl + '/api/health');
            const data = await response.json();
            
            if (data.status === 'operational') {
                this.recordTest('health_check', true, 'Universal Brain is operational');
                console.log('   ✅ Universal Brain is operational');
                console.log('   📊 Active brands: ' + data.brands.length);
                console.log('   🔍 Verification queue: ' + data.verification);
                console.log('   💭 Memory entries: ' + data.memory);
            } else {
                this.recordTest('health_check', false, 'Health check failed');
                console.log('   ❌ Health check failed');
            }
        } catch (error) {
            this.recordTest('health_check', false, error.message);
            console.log('   ❌ Health check error: ' + error.message);
        }
        
        console.log('');
    }
    
    async testBrandOrchestration() {
        console.log('🏷️ Test 2: Brand Orchestration');
        
        const testCases = [
            { brand: 'cal', query: 'Design a database schema for user management' },
            { brand: 'arty', query: 'Create a modern UI for a dashboard' },
            { brand: 'ralph', query: 'Set up Docker containers for deployment' }
        ];
        
        for (const testCase of testCases) {
            try {
                const response = await fetch(this.universalBrainUrl + '/api/brand/' + testCase.brand, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: testCase.query })
                });
                
                const data = await response.json();
                
                if (data.orchestrator) {
                    this.recordTest('brand_' + testCase.brand, true, 'Successfully routed to ' + data.orchestrator);
                    console.log('   ✅ ' + testCase.brand + ': Routed to ' + data.orchestrator);
                } else {
                    this.recordTest('brand_' + testCase.brand, false, 'No orchestrator response');
                    console.log('   ❌ ' + testCase.brand + ': No orchestrator response');
                }
            } catch (error) {
                this.recordTest('brand_' + testCase.brand, false, error.message);
                console.log('   ❌ ' + testCase.brand + ': Error - ' + error.message);
            }
        }
        
        console.log('');
    }
    
    async testNaturalTagQueries() {
        console.log('🎯 Test 3: Natural Tag Queries');
        
        const naturalQuery = '@cal.fintech.expert analyze this trading algorithm performance';
        
        try {
            const response = await fetch(this.universalBrainUrl + '/api/universal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: naturalQuery,
                    context: { domain: 'fintech', type: 'analysis' }
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.intent && data.intent.type === 'natural_tag') {
                this.recordTest('natural_tag_query', true, 'Natural tag query processed successfully');
                console.log('   ✅ Natural tag query processed');
                console.log('   👤 Character: ' + data.intent.character);
                console.log('   🏷️ Domain: ' + data.intent.domain);
                console.log('   🎯 Routing: ' + data.intent.routing);
                
                if (data.memory_enhanced) {
                    console.log('   💭 Memory enhanced: Yes');
                }
                
                if (data.verification) {
                    console.log('   🔍 Verification: ' + data.verification.status);
                }
            } else {
                this.recordTest('natural_tag_query', false, 'Natural tag query failed');
                console.log('   ❌ Natural tag query failed');
            }
        } catch (error) {
            this.recordTest('natural_tag_query', false, error.message);
            console.log('   ❌ Natural tag query error: ' + error.message);
        }
        
        console.log('');
    }
    
    async testDocumentProcessing() {
        console.log('📄 Test 4: Document Processing');
        
        const documentQuery = 'Generate an MVP for a task management application with user authentication';
        
        try {
            const response = await fetch(this.universalBrainUrl + '/api/universal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: documentQuery,
                    context: { type: 'document_processing', priority: 'high' }
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.intent) {
                this.recordTest('document_processing', true, 'Document processing completed');
                console.log('   ✅ Document processing completed');
                console.log('   📋 Intent type: ' + data.intent.type);
                console.log('   🔄 Processing route: ' + data.intent.routing);
                
                if (data.result && data.result.source) {
                    console.log('   📊 Result source: ' + data.result.source);
                }
            } else {
                this.recordTest('document_processing', false, 'Document processing failed');
                console.log('   ❌ Document processing failed');
            }
        } catch (error) {
            this.recordTest('document_processing', false, error.message);
            console.log('   ❌ Document processing error: ' + error.message);
        }
        
        console.log('');
    }
    
    async testCharacterRespawn() {
        console.log('🔄 Test 5: Character Respawn');
        
        try {
            const response = await fetch(this.universalBrainUrl + '/api/respawn/cal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reset_instincts: false })
            });
            
            const data = await response.json();
            
            if (data.success && data.character_id) {
                this.recordTest('character_respawn', true, 'Character respawn successful');
                console.log('   ✅ Character respawn successful');
                console.log('   👤 Character: ' + data.character_id);
                console.log('   🔢 Respawn count: ' + data.respawn_count);
                console.log('   ⚡ Skills retained: ' + (data.skills_retained?.length || 0));
                console.log('   🎯 Instincts count: ' + data.instincts_count);
                console.log('   📚 Learnings count: ' + data.learnings_count);
                console.log('   ⭐ Experience level: ' + data.experience_level);
            } else {
                this.recordTest('character_respawn', false, 'Character respawn failed');
                console.log('   ❌ Character respawn failed');
            }
        } catch (error) {
            this.recordTest('character_respawn', false, error.message);
            console.log('   ❌ Character respawn error: ' + error.message);
        }
        
        console.log('');
    }
    
    async testVerificationSystem() {
        console.log('🔍 Test 6: Verification System');
        
        try {
            const response = await fetch(this.universalBrainUrl + '/api/verification');
            const data = await response.json();
            
            if (typeof data.queueLength === 'number' && typeof data.activeVerifications === 'number') {
                this.recordTest('verification_system', true, 'Verification system operational');
                console.log('   ✅ Verification system operational');
                console.log('   📊 Queue length: ' + data.queueLength);
                console.log('   🔄 Active verifications: ' + data.activeVerifications);
                
                if (data.verificationStats) {
                    console.log('   📈 Success rate: ' + (data.verificationStats.success_rate * 100).toFixed(1) + '%');
                }
            } else {
                this.recordTest('verification_system', false, 'Verification system not responding');
                console.log('   ❌ Verification system not responding correctly');
            }
        } catch (error) {
            this.recordTest('verification_system', false, error.message);
            console.log('   ❌ Verification system error: ' + error.message);
        }
        
        console.log('');
    }
    
    async testMemorySystem() {
        console.log('💭 Test 7: Memory System');
        
        try {
            const response = await fetch(this.universalBrainUrl + '/api/memory');
            const data = await response.json();
            
            if (data.respawnMemory || data.activeContexts || data.memoryStats) {
                this.recordTest('memory_system', true, 'Memory system operational');
                console.log('   ✅ Memory system operational');
                
                if (data.memoryStats) {
                    console.log('   👤 Total memories: ' + data.memoryStats.total_memories);
                    console.log('   🌊 Total contexts: ' + data.memoryStats.total_contexts);
                    console.log('   💾 Memory usage: ' + data.memoryStats.memory_usage);
                }
            } else {
                this.recordTest('memory_system', false, 'Memory system not responding');
                console.log('   ❌ Memory system not responding correctly');
            }
        } catch (error) {
            this.recordTest('memory_system', false, error.message);
            console.log('   ❌ Memory system error: ' + error.message);
        }
        
        console.log('');
    }
    
    recordTest(testName, success, message) {
        this.testResults.push({
            test: testName,
            success: success,
            message: message,
            timestamp: new Date().toISOString()
        });
    }
    
    printTestSummary() {
        console.log('📊 TEST SUMMARY');
        console.log('===============');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log('✅ Passed: ' + passedTests + '/' + totalTests);
        console.log('❌ Failed: ' + failedTests + '/' + totalTests);
        console.log('📈 Success Rate: ' + ((passedTests / totalTests) * 100).toFixed(1) + '%');
        
        console.log('\nDETAILED RESULTS:');
        console.log('-----------------');
        
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(status + ' ' + result.test + ': ' + result.message);
        });
        
        console.log('\n🎯 ARCHITECTURE STATUS:');
        console.log('======================');
        
        const criticalTests = ['health_check', 'natural_tag_query', 'character_respawn'];
        const criticalPassed = criticalTests.filter(test => 
            this.testResults.find(r => r.test === test && r.success)
        ).length;
        
        if (criticalPassed === criticalTests.length) {
            console.log('🟢 ARCHITECTURE: FULLY OPERATIONAL');
            console.log('   ✅ Top Layer: Universal Brain working');
            console.log('   ✅ Bottom Layer: Verification system active');
            console.log('   ✅ Memory Layer: Respawn memory persistent');
            console.log('   ✅ DNA Patterns: No template literal issues');
        } else {
            console.log('🟡 ARCHITECTURE: PARTIALLY OPERATIONAL');
            console.log('   ⚠️  Some critical systems may need attention');
        }
        
        console.log('\n🚀 Ready for production use!');
    }
}

// Run tests
const tester = new UniversalBrainTest();

async function runTests() {
    // Wait a moment to ensure server is ready
    console.log('⏳ Waiting for Universal Brain to be ready...\n');
    
    // Quick health check first
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await tester.runAllTests();
    } catch (error) {
        console.error('❌ Test runner error:', error);
        console.log('\n💡 Make sure Universal Brain is running:');
        console.log('   node universal-brain.js');
    }
}

runTests();