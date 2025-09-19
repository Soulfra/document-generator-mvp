#!/usr/bin/env node

/**
 * Simple test script to verify Sunbiz integration works
 * This bypasses the complex PropTech backend and tests directly
 */

// For now, let's create a simple HTTP test instead of importing the complex service
const https = require('https');
const http = require('http');

console.log('🧪 Testing Sunbiz Integration Directly\n');
console.log('This test bypasses the complex PropTech system and tests the core Sunbiz functionality.\n');

async function testSunbizDirect() {
    const testDocuments = [
        'P20000090915', // ANTHROPIC PBC
        'L21000245843', // OPENAI OPCO, LLC  
        'P98000055991'  // GOOGLE LLC
    ];

    console.log('🔍 Testing with known document numbers...\n');

    for (const docNumber of testDocuments) {
        try {
            console.log(`\n📋 Testing: ${docNumber}`);
            console.log('=' .repeat(50));

            const searchResults = await enhancedSunbizService.searchBusinesses({
                search_type: 'document_number',
                search_term: docNumber
            });

            if (searchResults && searchResults.results.length > 0) {
                const business = searchResults.results[0];
                
                console.log('✅ SUCCESS!');
                console.log(`📊 Business Name: ${business.name}`);
                console.log(`📄 Document #: ${business.document_number}`);
                console.log(`📈 Status: ${business.status}`);
                
                // Display addresses
                if (business.principal_address) {
                    const addr = business.principal_address;
                    console.log(`📍 Principal Address: ${addr.address_1}, ${addr.city}, ${addr.state} ${addr.zip}`);
                }
                
                if (business.registered_agent_name && business.registered_agent_address) {
                    const addr = business.registered_agent_address;
                    console.log(`🏛️  Registered Agent: ${business.registered_agent_name}`);
                    console.log(`   Address: ${addr.address_1}, ${addr.city}, ${addr.state} ${addr.zip}`);
                }
                
                if (business.mailing_address) {
                    const addr = business.mailing_address;
                    console.log(`✉️  Mailing Address: ${addr.address_1}, ${addr.city}, ${addr.state} ${addr.zip}`);
                }
                
            } else {
                console.log('❌ No results found');
            }

        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }
}

async function testYourBusiness() {
    console.log('\n\n🎯 Ready to Test YOUR Business!');
    console.log('=' .repeat(60));
    
    // Get command line argument
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const yourQuery = args[0];
        console.log(`\n🔍 Testing your query: "${yourQuery}"`);
        
        try {
            // Determine search type
            let searchType = 'name';
            if (/^[A-Z]\d+/.test(yourQuery)) {
                searchType = 'document_number';
            }
            
            const searchResults = await enhancedSunbizService.searchBusinesses({
                search_type: searchType,
                search_term: yourQuery
            });

            if (searchResults && searchResults.results.length > 0) {
                console.log(`\n✅ Found ${searchResults.results.length} result(s)!\n`);
                
                searchResults.results.forEach((business, index) => {
                    console.log(`--- Result ${index + 1} ---`);
                    console.log(`📊 Business: ${business.name}`);
                    console.log(`📄 Document: ${business.document_number}`);
                    console.log(`📈 Status: ${business.status}`);
                    
                    if (business.principal_address) {
                        const addr = business.principal_address;
                        console.log(`📍 Address: ${addr.address_1}, ${addr.city}, ${addr.state} ${addr.zip}`);
                    }
                    console.log('');
                });
                
            } else {
                console.log('❌ No results found for your query');
                console.log('\nTry:');
                console.log('- A different spelling of the business name');
                console.log('- The exact document number (e.g., P20000012345)');
                console.log('- Just part of the business name');
            }

        } catch (error) {
            console.log(`❌ ERROR testing your business: ${error.message}`);
        }
    } else {
        console.log('\n💡 To test your business, run:');
        console.log(`   ./test-sunbiz-simple.js "P20000012345"`);
        console.log(`   ./test-sunbiz-simple.js "Your Business Name"`);
    }
}

// Run the tests
async function runAll() {
    try {
        await testSunbizDirect();
        await testYourBusiness();
        
        console.log('\n\n✨ Test Complete!');
        console.log('\nNext steps:');
        console.log('1. If tests passed: The Sunbiz integration works! 🎉');
        console.log('2. You can use this data in the enhanced demo');
        console.log('3. Test your own business with: ./test-sunbiz-simple.js "YOUR_DOCUMENT_NUMBER"');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\nThis might mean:');
        console.log('- The Sunbiz service is not available');
        console.log('- Network connectivity issues');  
        console.log('- The business registration service needs configuration');
    }
}

runAll();