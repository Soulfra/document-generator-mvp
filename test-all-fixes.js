#!/usr/bin/env node

/**
 * 🧪 TEST ALL FIXES INTEGRATION 🧪
 * 
 * Tests all the fixes working together as documented in SOULFRA-FIXES-DOCUMENTATION.md
 */

const axios = require('axios');

async function testAllFixes() {
    console.log('🧪 Testing All Fixes Integration...\n');
    
    const tests = [
        {
            name: 'Document Processing',
            test: async () => {
                const response = await axios.post('http://localhost:8090/api/process-document', {
                    document: 'Build a game',
                    type: 'idea'
                });
                return response.data.success;
            }
        },
        {
            name: 'AI Service',
            test: async () => {
                const response = await axios.post('http://localhost:3001/api/generate', {
                    prompt: 'Hello World',
                    type: 'code'
                });
                return typeof response.data === 'string';
            }
        },
        {
            name: 'Customer Journey',
            test: async () => {
                // First process document
                await axios.post('http://localhost:8090/api/process-document', {
                    document: 'Test document'
                });
                
                // Then verify on blockchain
                const response = await axios.post('http://localhost:3012/api/verify', {
                    reasoning: 'Journey test'
                });
                
                return response.data.success;
            }
        }
    ];
    
    let passed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.test();
            if (result) {
                console.log(`✅ ${test.name}: PASSED`);
                passed++;
            } else {
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }
    
    console.log(`\n📊 Integration Results: ${passed}/${tests.length} tests passed`);
    return passed === tests.length;
}

// Run if called directly
if (require.main === module) {
    testAllFixes().catch(console.error);
}

module.exports = testAllFixes;