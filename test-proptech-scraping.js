#!/usr/bin/env node

/**
 * Test script to verify the proptech-vc-demo scraping functionality
 * Tests the complete flow from address input to data retrieval
 */

const http = require('http');

console.log('🧪 Testing PropTech VC Demo Scraping Functionality');
console.log('=================================================\n');

// Test configuration
const backendPort = process.env.PORT || 8000;
const testAddresses = [
    '123 Main Street, Miami, FL 33101',
    '456 Ocean Drive, Palm Beach, FL 33480',
    'Invalid Address Test',
    ''  // Empty address test
];

/**
 * Make HTTP request to test endpoint
 */
async function testAddressLookup(address) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔍 Testing address: "${address}"`);
        
        const encodedAddress = encodeURIComponent(address);
        const options = {
            hostname: 'localhost',
            port: backendPort,
            path: `/api/property-tax/lookup?address=${encodedAddress}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                
                try {
                    const result = JSON.parse(data);
                    
                    if (res.statusCode === 200) {
                        console.log('   ✅ Success!');
                        console.log(`   Property ID: ${result.property_id || 'N/A'}`);
                        console.log(`   Owner: ${result.owner_name || 'N/A'}`);
                        console.log(`   Assessed Value: $${result.assessed_value?.toLocaleString() || 'N/A'}`);
                    } else {
                        console.log(`   ⚠️  Error: ${result.error || 'Unknown error'}`);
                    }
                    
                    resolve({ status: res.statusCode, data: result });
                } catch (err) {
                    console.log(`   ❌ Failed to parse response: ${err.message}`);
                    resolve({ status: res.statusCode, error: err.message });
                }
            });
        });

        req.on('error', (err) => {
            console.log(`   ❌ Connection error: ${err.message}`);
            reject(err);
        });

        req.end();
    });
}

/**
 * Test the frontend demo page
 */
async function testFrontendDemo() {
    return new Promise((resolve) => {
        console.log('\n🌐 Testing frontend demo availability...');
        
        const options = {
            hostname: 'localhost',
            port: backendPort,
            path: '/property-fraud-detection-demo.html',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`   Frontend demo status: ${res.statusCode}`);
            
            if (res.statusCode === 200) {
                console.log('   ✅ Frontend demo is accessible');
            } else {
                console.log('   ⚠️  Frontend demo not accessible');
            }
            
            resolve(res.statusCode);
        });

        req.on('error', (err) => {
            console.log(`   ❌ Cannot reach frontend: ${err.message}`);
            resolve(null);
        });

        req.end();
    });
}

/**
 * Run all tests
 */
async function runTests() {
    // First check if backend is running
    try {
        console.log('🏃 Starting tests...\n');
        console.log(`📡 Testing backend on port ${backendPort}...`);
        
        // Test frontend availability
        await testFrontendDemo();
        
        // Test each address
        for (const address of testAddresses) {
            await testAddressLookup(address);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
        }
        
        console.log('\n\n✨ Testing complete!');
        console.log('\n📝 Summary:');
        console.log('- Backend server should be running on port ' + backendPort);
        console.log('- Frontend demo available at: http://localhost:' + backendPort + '/property-fraud-detection-demo.html');
        console.log('- API endpoint: /api/property-tax/lookup');
        console.log('\n💡 To fix issues:');
        console.log('1. Make sure the backend is running: cd proptech-vc-demo/backend && npm start');
        console.log('2. Check that all dependencies are installed: npm install');
        console.log('3. Verify environment variables are set correctly');
        console.log('4. Check the logs for any error messages');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        console.log('\n🔧 Make sure the backend server is running:');
        console.log('   cd proptech-vc-demo/backend');
        console.log('   npm install');
        console.log('   npm start\n');
    }
}

// Run the tests
runTests();