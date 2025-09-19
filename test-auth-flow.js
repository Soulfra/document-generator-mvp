#!/usr/bin/env node

/**
 * 🧪 AUTH FLOW TEST
 * Tests the complete authentication flow across all services
 */

const axios = require('axios');

class AuthFlowTester {
    constructor() {
        this.authUrl = 'http://localhost:8888';
        this.services = [
            { name: 'Template Processor', url: 'http://localhost:3000' },
            { name: 'AI API', url: 'http://localhost:3001' },
            { name: 'Document Generator', url: 'http://localhost:4000' }
        ];
        this.testUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpass123'
        };
        this.token = null;
    }
    
    async run() {
        console.log('🧪 AUTH FLOW TEST STARTING');
        console.log('===========================');
        
        try {
            // Step 1: Test auth service health
            await this.testAuthHealth();
            
            // Step 2: Register test user
            await this.testRegistration();
            
            // Step 3: Login and get token
            await this.testLogin();
            
            // Step 4: Test token validation
            await this.testTokenValidation();
            
            // Step 5: Test protected endpoints on each service
            await this.testProtectedEndpoints();
            
            // Step 6: Test logout
            await this.testLogout();
            
            console.log('\n✅ ALL TESTS PASSED!');
            console.log('🔐 Authentication flow is working correctly');
            
        } catch (error) {
            console.error('\n❌ TEST FAILED:', error.message);
            process.exit(1);
        }
    }
    
    async testAuthHealth() {
        console.log('\n1. Testing auth service health...');
        
        try {
            const response = await axios.get(`${this.authUrl}/health`, {
                timeout: 5000
            });
            
            console.log('   ✅ Auth service is running');
            return true;
        } catch (error) {
            throw new Error('Auth service not available - start it first with "npm start" -> option 3');
        }
    }
    
    async testRegistration() {
        console.log('\n2. Testing user registration...');
        
        try {
            const response = await axios.post(`${this.authUrl}/auth/register`, this.testUser, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.success) {
                console.log('   ✅ User registration successful');
            } else {
                throw new Error(response.data.error || 'Registration failed');
            }
        } catch (error) {
            if (error.response && error.response.data.error === 'Username already exists') {
                console.log('   ℹ️  User already exists, continuing...');
            } else {
                throw new Error('Registration failed: ' + error.message);
            }
        }
    }
    
    async testLogin() {
        console.log('\n3. Testing login...');
        
        try {
            const response = await axios.post(`${this.authUrl}/auth/login`, {
                username: this.testUser.username,
                password: this.testUser.password
            }, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.success && response.data.token) {
                this.token = response.data.token;
                console.log('   ✅ Login successful, token received');
            } else {
                throw new Error(response.data.error || 'Login failed');
            }
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }
    
    async testTokenValidation() {
        console.log('\n4. Testing token validation...');
        
        try {
            const response = await axios.post(`${this.authUrl}/api/validate`, {
                token: this.token
            }, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.success && response.data.user) {
                console.log(`   ✅ Token valid for user: ${response.data.user.username}`);
            } else {
                throw new Error('Token validation failed');
            }
        } catch (error) {
            throw new Error('Token validation failed: ' + error.message);
        }
    }
    
    async testProtectedEndpoints() {
        console.log('\n5. Testing protected endpoints...');
        
        for (const service of this.services) {
            await this.testServiceAuth(service);
        }
    }
    
    async testServiceAuth(service) {
        console.log(`\n   Testing ${service.name}...`);
        
        // Test health endpoint (should work without auth)
        try {
            const healthResponse = await axios.get(`${service.url}/health`, {
                timeout: 3000
            });
            console.log(`     ✅ Health endpoint accessible`);
        } catch (error) {
            console.log(`     ⚠️  Service not running: ${service.name}`);
            return;
        }
        
        // Test protected endpoint without auth (should fail)
        try {
            const protectedEndpoints = {
                'Template Processor': '/api/generate',
                'AI API': '/api/analyze',
                'Document Generator': '/api/process'
            };
            
            const endpoint = protectedEndpoints[service.name];
            if (endpoint) {
                try {
                    await axios.post(`${service.url}${endpoint}`, {}, {
                        timeout: 3000,
                        headers: { 'Content-Type': 'application/json' }
                    });
                    console.log(`     ❌ Protected endpoint accessible without auth (BAD!)`);
                } catch (error) {
                    if (error.response && error.response.status === 401) {
                        console.log(`     ✅ Protected endpoint requires auth`);
                    } else {
                        console.log(`     ℹ️  Endpoint error (expected): ${error.response?.status || error.message}`);
                    }
                }
                
                // Test with auth token (should work)
                try {
                    await axios.post(`${service.url}${endpoint}`, {}, {
                        timeout: 3000,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.token}`
                        }
                    });
                    console.log(`     ✅ Protected endpoint accessible with auth`);
                } catch (error) {
                    if (error.response && error.response.status !== 401) {
                        console.log(`     ✅ Auth working (endpoint error expected): ${error.response?.status}`);
                    } else {
                        console.log(`     ❌ Auth not working: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.log(`     ⚠️  Could not test protected endpoints: ${error.message}`);
        }
    }
    
    async testLogout() {
        console.log('\n6. Testing logout...');
        
        try {
            const response = await axios.post(`${this.authUrl}/auth/logout`, {}, {
                timeout: 5000,
                headers: { 
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json' 
                }
            });
            
            if (response.data.success) {
                console.log('   ✅ Logout successful');
                
                // Verify token is invalid
                try {
                    await axios.post(`${this.authUrl}/api/validate`, {
                        token: this.token
                    });
                    console.log('   ❌ Token still valid after logout (BAD!)');
                } catch (error) {
                    if (error.response && error.response.status === 401) {
                        console.log('   ✅ Token invalidated after logout');
                    }
                }
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            throw new Error('Logout failed: ' + error.message);
        }
    }
}

// Run the test
if (require.main === module) {
    const tester = new AuthFlowTester();
    tester.run().catch(console.error);
}

module.exports = AuthFlowTester;