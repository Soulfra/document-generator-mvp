#!/usr/bin/env node

/**
 * 🧪 Direct Access Authentication Test
 * 
 * Test script to verify simple authentication works like public records lookup
 */

const http = require('http');

const BASE_URL = 'http://localhost:7001';

// Test API key authentication
async function testApiKeyAuth() {
    console.log('🧪 Testing API Key Authentication...');
    
    const testKeys = [
        'admin-key-12345',
        'portal-master-key', 
        'document-generator-key',
        'invalid-key'
    ];
    
    for (const apiKey of testKeys) {
        try {
            const result = await makeRequest('/access/login', 'POST', {
                apiKey: apiKey,
                username: 'test-user'
            });
            
            if (result.success) {
                console.log(`✅ ${apiKey}: Authentication successful`);
                
                // Test session verification
                const statusResult = await makeRequest('/access/status', 'GET', null, {
                    'Authorization': `Bearer ${result.sessionKey}`
                });
                
                if (statusResult.hasAccess) {
                    console.log(`   ✅ Session verification successful`);
                } else {
                    console.log(`   ❌ Session verification failed`);
                }
            } else {
                console.log(`❌ ${apiKey}: ${result.message}`);
            }
        } catch (error) {
            console.log(`❌ ${apiKey}: Request failed - ${error.message}`);
        }
    }
}

// Test admin bypass
async function testAdminBypass() {
    console.log('\n🚫 Testing Admin Bypass...');
    
    try {
        const result = await makeRequest('/access/admin', 'POST', {
            bypass: true
        });
        
        if (result.success) {
            console.log('✅ Admin bypass successful');
            
            // Test session verification
            const statusResult = await makeRequest('/access/status', 'GET', null, {
                'Authorization': `Bearer ${result.sessionKey}`
            });
            
            if (statusResult.hasAccess) {
                console.log('   ✅ Admin bypass session verification successful');
            } else {
                console.log('   ❌ Admin bypass session verification failed');
            }
        } else {
            console.log(`❌ Admin bypass failed: ${result.message}`);
        }
    } catch (error) {
        console.log(`❌ Admin bypass request failed: ${error.message}`);
    }
}

// Test health endpoint
async function testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...');
    
    try {
        const result = await makeRequest('/health', 'GET');
        
        if (result.status === 'healthy') {
            console.log('✅ Health check successful');
            console.log(`   Service: ${result.service}`);
            console.log(`   Bypass Mode: ${result.bypassMode}`);
        } else {
            console.log('❌ Health check failed');
        }
    } catch (error) {
        console.log(`❌ Health check request failed: ${error.message}`);
    }
}

// Test document access
async function testDocumentAccess(sessionKey) {
    console.log('\n📄 Testing Document Access...');
    
    try {
        const result = await makeRequest('/documents', 'GET', null, {
            'Authorization': `Bearer ${sessionKey}`
        });
        
        if (result.message === 'Document access granted') {
            console.log('✅ Document access successful');
            console.log(`   Access Type: ${result.access}`);
        } else {
            console.log('❌ Document access failed');
        }
    } catch (error) {
        console.log(`❌ Document access request failed: ${error.message}`);
    }
}

// Test portal access
async function testPortalAccess(sessionKey) {
    console.log('\n🌐 Testing Portal Access...');
    
    try {
        const response = await makeRawRequest('/portal', 'GET', null, {
            'Authorization': `Bearer ${sessionKey}`
        });
        
        if (response.statusCode === 200) {
            console.log('✅ Portal access successful');
        } else {
            console.log(`❌ Portal access failed: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ Portal access request failed: ${error.message}`);
    }
}

// Helper function to make HTTP requests
function makeRequest(path, method, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: 7001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

// Helper function to make raw HTTP requests
function makeRawRequest(path, method, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: 7001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: responseData
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

// Main test runner
async function runTests() {
    console.log('🔑 DIRECT ACCESS AUTHENTICATION TEST SUITE');
    console.log('==========================================\n');
    
    // Check if server is running
    try {
        await makeRequest('/health', 'GET');
    } catch (error) {
        console.log('❌ Direct access system is not running!');
        console.log('   Start it with: node direct-access-auth.js');
        process.exit(1);
    }
    
    await testHealthEndpoint();
    await testApiKeyAuth();
    await testAdminBypass();
    
    // Get a valid session for further tests
    try {
        const authResult = await makeRequest('/access/login', 'POST', {
            apiKey: 'admin-key-12345',
            username: 'test-user'
        });
        
        if (authResult.success) {
            await testDocumentAccess(authResult.sessionKey);
            await testPortalAccess(authResult.sessionKey);
        }
    } catch (error) {
        console.log('⚠️ Could not get session for additional tests');
    }
    
    console.log('\n🎉 Test suite completed!');
    console.log('💡 Direct access authentication works like GIS property lookup - simple and direct!');
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = { runTests };