#!/usr/bin/env node

/**
 * 🔍 DEBUG ROUTER - Figure out what the fuck is wrong with routing
 */

const http = require('http');

async function debugRouter() {
    console.log('🔍 DEBUGGING ROUTER ISSUES...');
    console.log('=====================================\n');
    
    // Test direct services
    console.log('📡 TESTING DIRECT SERVICES:');
    
    const tests = [
        { name: 'Gaming Engine API', url: 'http://localhost:8888/api/status' },
        { name: 'Gaming Engine Root', url: 'http://localhost:8888/' },
        { name: 'Character Theater', url: 'http://localhost:9950/' },
        { name: 'Master Router Root', url: 'http://localhost:5555/' },
        { name: 'Master Router /game', url: 'http://localhost:5555/game' },
        { name: 'Master Router /api', url: 'http://localhost:5555/api' }
    ];
    
    for (const test of tests) {
        try {
            const response = await fetch(test.url, { timeout: 3000 });
            const contentType = response.headers.get('content-type') || 'unknown';
            const text = await response.text();
            
            console.log(`${response.ok ? '✅' : '❌'} ${test.name}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Type: ${contentType}`);
            console.log(`   Response: ${text.substring(0, 100).replace(/\s+/g, ' ')}...`);
            console.log('');
            
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}\n`);
        }
    }
    
    // Test routing logic
    console.log('🛣️  TESTING ROUTING LOGIC:');
    
    try {
        const response = await fetch('http://localhost:5555', { timeout: 3000 });
        const text = await response.text();
        
        if (text.includes('Master Gaming Router')) {
            console.log('✅ Master router is responding with status page');
            
            // Look for service info
            if (text.includes('gaming-engine')) {
                console.log('✅ Gaming engine is registered');
            } else {
                console.log('❌ Gaming engine NOT registered');
            }
            
            if (text.includes('character-theater')) {
                console.log('✅ Character theater is registered');
            } else {
                console.log('❌ Character theater NOT registered');
            }
            
        } else {
            console.log('❌ Master router returning unexpected content');
            console.log('First 200 chars:', text.substring(0, 200));
        }
        
    } catch (error) {
        console.log('❌ Could not test master router:', error.message);
    }
    
    console.log('\n🔧 DIAGNOSIS:');
    console.log('The router might be:');
    console.log('1. Serving static files instead of proxying');
    console.log('2. Not properly registering services');
    console.log('3. Missing proxy functionality');
    console.log('4. Routing to wrong endpoints');
}

debugRouter().then(() => {
    console.log('\n🏁 Debug complete!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
});