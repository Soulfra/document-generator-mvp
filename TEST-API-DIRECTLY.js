#!/usr/bin/env node

/**
 * 🧪 TEST API DIRECTLY
 * Direct API testing without assumptions
 */

const http = require('http');
const querystring = require('querystring');

class DirectAPITester {
    constructor() {
        this.host = 'localhost';
        this.port = 7090;
        this.token = null;
        
        this.runTests();
    }
    
    async runTests() {
        console.log('🧪 DIRECT API TESTING...\n');
        
        try {
            // Test the actual endpoints our service should have
            await this.testServiceRoot();
            await this.testRegisterEndpoint();
            await this.testLoginEndpoint();
            await this.testGameStateEndpoint();
            
            console.log('\n✅ DIRECT API TESTS COMPLETED');
        } catch (error) {
            console.error('\n❌ DIRECT API TEST FAILED:', error.message);
        }
    }
    
    async testServiceRoot() {
        console.log('1. Testing service root...');
        
        const response = await this.makeRequest('GET', '/');
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        
        if (response.statusCode === 200) {
            const isOurService = response.body.includes('WORKING PERSISTENT TYCOON') || 
                                 response.body.includes('Working Persistent Tycoon');
            console.log(`   Our Service: ${isOurService ? 'YES' : 'NO'}`);
            
            if (!isOurService) {
                console.log('   ⚠️  Different service is handling requests');
                console.log('   Response preview:', response.body.substring(0, 200));
            }
        }
    }
    
    async testRegisterEndpoint() {
        console.log('\n2. Testing /api/register endpoint...');
        
        const testUser = {
            username: 'directtest_' + Date.now(),
            email: 'directtest@example.com',
            password: 'testpass123'
        };
        
        try {
            const response = await this.makeRequest('POST', '/api/register', testUser);
            console.log(`   Status: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                console.log(`   Success: ${data.success}`);
                if (data.success) {
                    console.log(`   User ID: ${data.userId}`);
                    this.testUser = testUser;
                }
            } else {
                console.log('   Response:', response.body);
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }
    
    async testLoginEndpoint() {
        console.log('\n3. Testing /api/login endpoint...');
        
        if (!this.testUser) {
            console.log('   Skipped - no test user from registration');
            return;
        }
        
        try {
            const response = await this.makeRequest('POST', '/api/login', {
                username: this.testUser.username,
                password: this.testUser.password
            });
            
            console.log(`   Status: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                console.log(`   Success: ${data.success}`);
                if (data.success && data.token) {
                    console.log('   Token received: YES');
                    this.token = data.token;
                } else {
                    console.log('   Token received: NO');
                }
            } else {
                console.log('   Response:', response.body);
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }
    
    async testGameStateEndpoint() {
        console.log('\n4. Testing /api/gamestate endpoint...');
        
        if (!this.token) {
            console.log('   Skipped - no token from login');
            return;
        }
        
        try {
            const response = await this.makeRequest('GET', '/api/gamestate', null, {
                'Authorization': `Bearer ${this.token}`
            });
            
            console.log(`   Status: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                console.log('   Game state structure:');
                console.log(`     Player: ${data.player ? 'YES' : 'NO'}`);
                console.log(`     World: ${data.world ? 'YES' : 'NO'}`);
                
                if (data.player) {
                    console.log(`     Cash: $${data.player.cash}`);
                    console.log(`     Buildings: ${data.player.buildings}`);
                }
            } else {
                console.log('   Response:', response.body);
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }
    
    makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const postData = data ? JSON.stringify(data) : null;
            
            const options = {
                hostname: this.host,
                port: this.port,
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
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
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
}

new DirectAPITester();