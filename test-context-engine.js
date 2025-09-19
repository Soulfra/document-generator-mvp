#!/usr/bin/env node

/**
 * 🧪 CONTEXT UNDERSTANDING ENGINE TEST
 * 
 * Test the unified context understanding system
 * and the Cal Blame Routing™ feature
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('\n🧪 CONTEXT UNDERSTANDING ENGINE TEST');
console.log('====================================');

class ContextEngineTest {
    constructor() {
        this.engineUrl = 'http://localhost:10000';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🚀 Starting Context Understanding Engine tests...\n');
        
        // Test 1: Non-technical language understanding
        await this.testNonTechnicalLanguage();
        
        // Test 2: Cal blame routing
        await this.testCalBlameRouting();
        
        // Test 3: Pattern recognition
        await this.testPatternRecognition();
        
        // Test 4: All layers working together
        await this.testAllLayers();
        
        // Test 5: Cal blame counter
        await this.testCalBlameCounter();
        
        // Summary
        this.printTestSummary();
    }
    
    async testNonTechnicalLanguage() {
        console.log('🔍 Test 1: Non-Technical Language Understanding');
        
        const testCases = [
            { query: "make it do the thing", expected: "execute_action" },
            { query: "the thingy that holds stuff is slow", expected: "optimize_performance" },
            { query: "idk what's wrong but it's broken", expected: "debug_issue" },
            { query: "can you make it look pretty?", expected: "improve_ui" }
        ];
        
        for (const testCase of testCases) {
            try {
                const response = await fetch(this.engineUrl + '/understand', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: testCase.query })
                });
                
                const data = await response.json();
                
                if (data.understood === testCase.expected) {
                    this.recordTest('non_tech_' + testCase.expected, true, 'Correctly understood: ' + testCase.query);
                    console.log('   ✅ "' + testCase.query + '" → ' + data.understood);
                } else {
                    this.recordTest('non_tech_' + testCase.expected, false, 'Misunderstood: ' + testCase.query);
                    console.log('   ❌ "' + testCase.query + '" → ' + data.understood + ' (expected ' + testCase.expected + ')');
                }
            } catch (error) {
                this.recordTest('non_tech_' + testCase.expected, false, error.message);
                console.log('   ❌ Error: ' + error.message);
            }
        }
        
        console.log('');
    }
    
    async testCalBlameRouting() {
        console.log('📊 Test 2: Cal Blame Routing');
        
        const blameQueries = [
            "the database is really slow",
            "something broke and I don't know what",
            "the system architecture seems wrong",
            "why is everything crashing?",
            "this SQL query isn't working"
        ];
        
        for (const query of blameQueries) {
            try {
                const response = await fetch(this.engineUrl + '/understand', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query })
                });
                
                const data = await response.json();
                
                if (data.routing_to_cal) {
                    this.recordTest('cal_blame', true, 'Cal blamed for: ' + query);
                    console.log('   ✅ Cal blamed: "' + query + '"');
                    console.log('      Reason: ' + data.routing_to_cal.reason);
                } else {
                    this.recordTest('cal_blame', false, 'Cal not blamed for: ' + query);
                    console.log('   ❌ Cal escaped blame: "' + query + '"');
                }
            } catch (error) {
                this.recordTest('cal_blame', false, error.message);
                console.log('   ❌ Error: ' + error.message);
            }
        }
        
        console.log('');
    }
    
    async testPatternRecognition() {
        console.log('🎯 Test 3: Pattern Recognition');
        
        const patterns = [
            { query: "it's like a filing cabinet for data", type: "metaphor" },
            { query: "make the button do the save thing", type: "natural_language" },
            { query: "idk how to explain but it's weird", type: "confusion" }
        ];
        
        for (const pattern of patterns) {
            try {
                const response = await fetch(this.engineUrl + '/understand', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: pattern.query })
                });
                
                const data = await response.json();
                
                if (data.technical_translation) {
                    this.recordTest('pattern_' + pattern.type, true, 'Pattern recognized');
                    console.log('   ✅ Pattern "' + pattern.type + '" recognized');
                    console.log('      Original: "' + pattern.query + '"');
                    console.log('      Technical: ' + data.technical_translation.substring(0, 50) + '...');
                } else {
                    this.recordTest('pattern_' + pattern.type, false, 'Pattern not recognized');
                    console.log('   ❌ Pattern "' + pattern.type + '" not recognized');
                }
            } catch (error) {
                this.recordTest('pattern_' + pattern.type, false, error.message);
                console.log('   ❌ Error: ' + error.message);
            }
        }
        
        console.log('');
    }
    
    async testAllLayers() {
        console.log('🌐 Test 4: All Layers Working Together');
        
        try {
            const response = await fetch(this.engineUrl + '/understand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: "help me understand why the database thingy is so slow",
                    context: { user_level: "beginner" }
                })
            });
            
            const data = await response.json();
            
            // Check all layers responded
            const checks = [
                { layer: 'Understanding', present: !!data.understood },
                { layer: 'Processing', present: !!data.action_taken },
                { layer: 'Education', present: !!data.learning_provided },
                { layer: 'Rewards', present: !!data.rewards_earned }
            ];
            
            let allLayersWorking = true;
            
            for (const check of checks) {
                if (check.present) {
                    console.log('   ✅ ' + check.layer + ' Layer: Active');
                } else {
                    console.log('   ❌ ' + check.layer + ' Layer: Missing');
                    allLayersWorking = false;
                }
            }
            
            this.recordTest('all_layers', allLayersWorking, 
                allLayersWorking ? 'All layers working' : 'Some layers missing');
            
            // Bonus: Check if Cal was blamed
            if (data.routing_to_cal) {
                console.log('   📊 Bonus: Cal was blamed! (' + data.routing_to_cal.reason + ')');
            }
            
        } catch (error) {
            this.recordTest('all_layers', false, error.message);
            console.log('   ❌ Error testing layers: ' + error.message);
        }
        
        console.log('');
    }
    
    async testCalBlameCounter() {
        console.log('🎮 Test 5: Cal Blame Counter');
        
        try {
            const response = await fetch(this.engineUrl + '/blame/cal');
            const data = await response.json();
            
            if (typeof data.times_blamed === 'number') {
                this.recordTest('blame_counter', true, 'Blame counter working');
                console.log('   ✅ Cal has been blamed ' + data.times_blamed + ' times');
                console.log('   📊 Cal\'s response: "' + data.cal_response + '"');
                
                if (data.recent_blames && data.recent_blames.length > 0) {
                    console.log('   📋 Recent blames:');
                    data.recent_blames.slice(-3).forEach(blame => {
                        console.log('      - ' + blame.reason);
                    });
                }
            } else {
                this.recordTest('blame_counter', false, 'Blame counter not working');
                console.log('   ❌ Blame counter not responding correctly');
            }
        } catch (error) {
            this.recordTest('blame_counter', false, error.message);
            console.log('   ❌ Error: ' + error.message);
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
        
        console.log('\n🎯 CONCLUSION:');
        console.log('==============');
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! The Context Understanding Engine is working perfectly!');
            console.log('📊 Cal has been successfully established as the go-to scapegoat.');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('👍 Most tests passed! The engine is mostly working.');
            console.log('📊 Cal blame routing could use some tuning.');
        } else {
            console.log('⚠️  Many tests failed. The engine needs attention.');
            console.log('📊 Ironically, this is probably Cal\'s fault.');
        }
    }
}

// Run tests
const tester = new ContextEngineTest();

async function runTests() {
    console.log('⏳ Waiting for Context Understanding Engine to be ready...\n');
    
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('❌ Test runner error:', error);
        console.log('\n💡 Make sure Context Understanding Engine is running:');
        console.log('   node context-understanding-engine.js');
    }
}

// Run the tests
runTests();