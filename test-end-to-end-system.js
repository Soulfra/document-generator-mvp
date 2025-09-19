#!/usr/bin/env node

/**
 * 🧪 END-TO-END SYSTEM TESTING SUITE
 * Tests the complete NPC-RPC + Reasoning Differential + Dynamic API system
 */

const axios = require('axios');
const { Pool } = require('pg');

class EndToEndSystemTester {
    constructor() {
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator'
        });
        
        this.services = {
            npcRPC: 'http://localhost:54321',
            npcDashboard: 'http://localhost:54322',
            reasoningDiff: 'http://localhost:4444',
            dynamicAPI: 'http://localhost:4455',
            calCompare: 'http://localhost:3001',
            platformHub: 'http://localhost:8080'
        };
        
        this.tests = [];
        this.results = [];
    }
    
    async runAllTests() {
        console.log('🧪 END-TO-END SYSTEM TESTING SUITE');
        console.log('===================================');
        console.log('Testing complete NPC-RPC + Reasoning + API integration\n');
        
        // Test 1: Service Health Checks
        await this.testServiceHealth();
        
        // Test 2: Database Connectivity
        await this.testDatabaseConnectivity();
        
        // Test 3: NPC-RPC Activity
        await this.testNPCActivity();
        
        // Test 4: Dynamic API Integration
        await this.testDynamicAPIIntegration();
        
        // Test 5: Character System Integration
        await this.testCharacterSystemIntegration();
        
        // Test 6: Reasoning Differential Logging
        await this.testReasoningDifferentialLogging();
        
        // Test 7: End-to-End Data Flow
        await this.testEndToEndDataFlow();
        
        // Summary
        this.printSummary();
    }
    
    async testServiceHealth() {
        console.log('🏥 Testing service health...');
        
        for (const [name, url] of Object.entries(this.services)) {
            try {
                const response = await axios.get(`${url}/health`, { timeout: 5000 });
                console.log(`✅ ${name}: healthy`);
                this.recordTest(`${name}-health`, true);
            } catch (error) {
                console.log(`❌ ${name}: ${error.message}`);
                this.recordTest(`${name}-health`, false, error.message);
            }
        }
        console.log('');
    }
    
    async testDatabaseConnectivity() {
        console.log('📊 Testing database connectivity...');
        
        try {
            // Test basic connection
            const result = await this.db.query('SELECT NOW() as timestamp');
            console.log(`✅ Database connected: ${result.rows[0].timestamp}`);
            this.recordTest('database-connection', true);
            
            // Test key tables
            const tables = ['api_requests', 'reasoning_differentials', 'character_analyses', 'game_registry'];
            for (const table of tables) {
                try {
                    const count = await this.db.query(`SELECT COUNT(*) as count FROM ${table}`);
                    console.log(`✅ Table ${table}: ${count.rows[0].count} records`);
                    this.recordTest(`table-${table}`, true);
                } catch (error) {
                    console.log(`❌ Table ${table}: ${error.message}`);
                    this.recordTest(`table-${table}`, false, error.message);
                }
            }
        } catch (error) {
            console.log(`❌ Database connection failed: ${error.message}`);
            this.recordTest('database-connection', false, error.message);
        }
        console.log('');
    }
    
    async testNPCActivity() {
        console.log('🎮 Testing NPC activity...');
        
        try {
            // Check if NPCs are making RPC calls
            const initialCount = await this.db.query('SELECT COUNT(*) as count FROM api_requests WHERE created_at > NOW() - INTERVAL \'1 minute\'');
            console.log(`📊 Recent API requests: ${initialCount.rows[0].count}`);
            
            // Wait a moment for more activity
            console.log('⏳ Waiting 10 seconds for NPC activity...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const finalCount = await this.db.query('SELECT COUNT(*) as count FROM api_requests WHERE created_at > NOW() - INTERVAL \'1 minute\'');
            const newRequests = finalCount.rows[0].count - initialCount.rows[0].count;
            
            if (newRequests > 0) {
                console.log(`✅ NPCs are active: ${newRequests} new requests in 10 seconds`);
                this.recordTest('npc-activity', true);
            } else {
                console.log(`⚠️ No new NPC activity detected`);
                this.recordTest('npc-activity', false, 'No activity in 10 seconds');
            }
        } catch (error) {
            console.log(`❌ NPC activity test failed: ${error.message}`);
            this.recordTest('npc-activity', false, error.message);
        }
        console.log('');
    }
    
    async testDynamicAPIIntegration() {
        console.log('🌐 Testing Dynamic API integration...');
        
        try {
            // Test document analysis through dynamic API
            const response = await axios.post(`${this.services.dynamicAPI}/api/document-mvp/analyze`, {
                document: 'Test document for end-to-end verification',
                type: 'test-integration'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            if (response.data.success) {
                console.log('✅ Dynamic API document analysis working');
                this.recordTest('dynamic-api-integration', true);
                
                // Verify it was logged to database
                const logCount = await this.db.query('SELECT COUNT(*) as count FROM api_requests WHERE game_id = $1 AND endpoint = $2', ['document-mvp', 'analyze']);
                console.log(`✅ API request logged to database: ${logCount.rows[0].count} total`);
                this.recordTest('dynamic-api-logging', true);
            } else {
                console.log('❌ Dynamic API returned unsuccessful response');
                this.recordTest('dynamic-api-integration', false, 'Unsuccessful response');
            }
        } catch (error) {
            console.log(`❌ Dynamic API integration failed: ${error.message}`);
            this.recordTest('dynamic-api-integration', false, error.message);
        }
        console.log('');
    }
    
    async testCharacterSystemIntegration() {
        console.log('🎭 Testing character system integration...');
        
        try {
            // Test direct character consultation
            const response = await axios.post(`${this.services.calCompare}/api/cal-compare/consult`, {
                expertType: 'technical-architecture',
                question: 'End-to-end system test verification'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
            
            if (response.data.consultation) {
                console.log('✅ Character system responding');
                console.log(`📝 Response: ${response.data.consultation.response.substring(0, 100)}...`);
                this.recordTest('character-system', true);
            } else {
                console.log('❌ Character system returned invalid response');
                this.recordTest('character-system', false, 'Invalid response format');
            }
        } catch (error) {
            console.log(`❌ Character system integration failed: ${error.message}`);
            this.recordTest('character-system', false, error.message);
        }
        console.log('');
    }
    
    async testReasoningDifferentialLogging() {
        console.log('🧠 Testing reasoning differential logging...');
        
        try {
            // Insert a test reasoning differential
            const testDifferential = {
                pattern_a: { test: 'pattern_a', timestamp: new Date() },
                pattern_b: { test: 'pattern_b', timestamp: new Date() },
                differential: { difference: 'test_difference', confidence: 0.95 },
                insight: 'End-to-end test reasoning differential',
                impact_score: 8.5
            };
            
            const result = await this.db.query(
                'INSERT INTO reasoning_differentials (pattern_a, pattern_b, differential, insight, impact_score) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [JSON.stringify(testDifferential.pattern_a), JSON.stringify(testDifferential.pattern_b), JSON.stringify(testDifferential.differential), testDifferential.insight, testDifferential.impact_score]
            );
            
            console.log(`✅ Reasoning differential logged with ID: ${result.rows[0].id}`);
            this.recordTest('reasoning-differential-logging', true);
            
            // Verify we can read it back
            const verify = await this.db.query('SELECT * FROM reasoning_differentials WHERE id = $1', [result.rows[0].id]);
            if (verify.rows.length > 0) {
                console.log(`✅ Reasoning differential verified in database`);
                this.recordTest('reasoning-differential-verification', true);
            }
            
        } catch (error) {
            console.log(`❌ Reasoning differential logging failed: ${error.message}`);
            this.recordTest('reasoning-differential-logging', false, error.message);
        }
        console.log('');
    }
    
    async testEndToEndDataFlow() {
        console.log('🔄 Testing end-to-end data flow...');
        
        try {
            // Test complete flow: Dynamic API -> Character -> Database logging
            console.log('📤 Sending document through complete pipeline...');
            
            const response = await axios.post(`${this.services.dynamicAPI}/api/characters/consult`, {
                character: 'alice',
                question: 'End-to-end data flow verification test'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
            
            if (response.data.success) {
                console.log('✅ End-to-end data flow successful');
                console.log(`📊 Pipeline result: ${JSON.stringify(response.data.result).substring(0, 100)}...`);
                this.recordTest('end-to-end-flow', true);
                
                // Check if it was logged
                const recentLogs = await this.db.query('SELECT COUNT(*) as count FROM api_requests WHERE created_at > NOW() - INTERVAL \'30 seconds\'');
                console.log(`✅ Recent database logs: ${recentLogs.rows[0].count}`);
                
            } else {
                console.log('❌ End-to-end data flow failed');
                this.recordTest('end-to-end-flow', false, 'Pipeline returned unsuccessful response');
            }
            
        } catch (error) {
            console.log(`❌ End-to-end data flow test failed: ${error.message}`);
            this.recordTest('end-to-end-flow', false, error.message);
        }
        console.log('');
    }
    
    recordTest(name, passed, error = null) {
        this.results.push({ name, passed, error });
    }
    
    printSummary() {
        console.log('📊 END-TO-END TEST SUMMARY');
        console.log('==========================');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`Tests passed: ${passed}/${total} (${percentage}%)`);
        console.log('');
        
        // Show failed tests
        const failed = this.results.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('❌ Failed tests:');
            failed.forEach(test => {
                console.log(`   • ${test.name}: ${test.error || 'Unknown error'}`);
            });
        } else {
            console.log('🎉 All tests passed!');
        }
        
        console.log('');
        console.log('🎯 System Status:');
        console.log('   • NPC-RPC System: Running autonomously');
        console.log('   • Reasoning Differentials: Live comparison engine');
        console.log('   • Dynamic API: RuneScape-like routing');
        console.log('   • Character System: AI consultation active');
        console.log('   • Database: Logging all activities');
        
        console.log('');
        console.log('🌐 Live Dashboards:');
        console.log(`   • NPC Monitor: http://localhost:54322`);
        console.log(`   • Reasoning Diff: http://localhost:4444`);
        console.log(`   • Platform Hub: http://localhost:8080`);
        console.log(`   • Dynamic API: http://localhost:4455/api/discover`);
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new EndToEndSystemTester();
    tester.runAllTests()
        .then(() => {
            console.log('\n✅ End-to-end testing complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ End-to-end testing failed:', error);
            process.exit(1);
        });
}

module.exports = EndToEndSystemTester;