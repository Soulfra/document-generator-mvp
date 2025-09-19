const UniversalHttpClient = require('./universal-http-client');

async function testHttpClient() {
    console.log('🧪 Testing Universal HTTP Client...\n');
    
    // Test 1: Basic GET request
    try {
        console.log('Test 1: GET request to local service');
        const response = await UniversalHttpClient.get('http://localhost:1503/');
        console.log('✅ Status:', response.status);
        const data = await response.json();
        console.log('✅ Response:', JSON.stringify(data, null, 2).slice(0, 200) + '...\n');
    } catch (err) {
        console.error('❌ Test 1 failed:', err.message, '\n');
    }
    
    // Test 2: POST request with body
    try {
        console.log('Test 2: POST request with body');
        const response = await UniversalHttpClient.post(
            'http://localhost:1503/auth/login',
            { username: 'test', password: 'test123' }
        );
        console.log('✅ Status:', response.status);
        const data = await response.json();
        console.log('✅ Response:', data, '\n');
    } catch (err) {
        console.error('❌ Test 2 failed:', err.message, '\n');
    }
    
    // Test 3: Test the global fetch polyfill
    try {
        console.log('Test 3: Using global fetch');
        const response = await fetch('http://localhost:1500/status');
        console.log('✅ Status:', response.status);
        const data = await response.json();
        console.log('✅ Response:', data, '\n');
    } catch (err) {
        console.error('❌ Test 3 failed:', err.message, '\n');
    }
    
    console.log('🧪 Tests completed!');
}

// Run tests
testHttpClient();