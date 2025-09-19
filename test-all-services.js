#!/usr/bin/env node

/**
 * 🧪 SERVICE TESTER - Test all gaming services and routes
 * 
 * Tests each service individually and reports what's working vs broken
 */

const http = require('http');

class ServiceTester {
    constructor() {
        this.services = new Map([
            ['Master Router', 'http://localhost:5555'],
            ['Gaming Engine', 'http://localhost:8888'],
            ['Character Theater', 'http://localhost:9950'],
            ['Auth Service', 'http://localhost:6666'],
            ['Spatial Router', 'http://localhost:8800'],
            ['Gaming Port Router', 'http://localhost:9999'],
            ['System Screamer', 'http://localhost:4444'],
            ['Auth Gateway', 'http://localhost:7700']
        ]);
        
        this.routes = new Map([
            ['Master Router /game', 'http://localhost:5555/game'],
            ['Master Router /character', 'http://localhost:5555/character'],
            ['Master Router /chat', 'http://localhost:5555/chat'],
            ['Gaming Engine /api/status', 'http://localhost:8888/api/status'],
            ['Auth /api/verify', 'http://localhost:6666/api/verify']
        ]);
    }
    
    async testAll() {
        console.log('🧪 TESTING ALL GAMING SERVICES...');
        console.log('=====================================');
        
        // Test basic service availability
        console.log('\n📡 SERVICE AVAILABILITY:');
        for (const [name, url] of this.services) {
            await this.testService(name, url);
        }
        
        // Test specific routes
        console.log('\n🛣️  ROUTE TESTING:');
        for (const [name, url] of this.routes) {
            await this.testRoute(name, url);
        }
        
        // Test authentication flow
        console.log('\n🔐 AUTHENTICATION TESTING:');
        await this.testAuthFlow();
        
        console.log('\n📊 ROUTING DIAGNOSIS:');
        await this.diagnoseRouting();
    }
    
    async testService(name, url) {
        try {
            const response = await this.fetchWithTimeout(url, 3000);
            const statusIcon = response.ok ? '✅' : '❌';
            const statusCode = response.status;
            
            console.log(`${statusIcon} ${name.padEnd(20)} - ${statusCode} (${url})`);
            
            if (!response.ok) {
                const text = await response.text();
                console.log(`   Error: ${text.substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`❌ ${name.padEnd(20)} - UNREACHABLE (${error.message})`);
        }
    }
    
    async testRoute(name, url) {
        try {
            const response = await this.fetchWithTimeout(url, 3000);
            const statusIcon = response.ok ? '✅' : '⚠️';
            
            console.log(`${statusIcon} ${name.padEnd(30)} - ${response.status}`);
            
            if (!response.ok && response.status !== 404) {
                const text = await response.text();
                console.log(`   Response: ${text.substring(0, 80)}...`);
            }
            
        } catch (error) {
            console.log(`❌ ${name.padEnd(30)} - ERROR: ${error.message}`);
        }
    }
    
    async testAuthFlow() {
        try {
            // Test login
            const loginResponse = await fetch('http://localhost:6666/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'alice', password: 'password' })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('✅ Login successful - Token: ' + loginData.token.substring(0, 16) + '...');
                
                // Test token verification
                const verifyResponse = await fetch('http://localhost:6666/api/verify', {
                    headers: { 'Authorization': `Bearer ${loginData.token}` }
                });
                
                if (verifyResponse.ok) {
                    console.log('✅ Token verification successful');
                } else {
                    console.log('❌ Token verification failed');
                }
                
                return loginData.token;
            } else {
                console.log('❌ Login failed');
            }
        } catch (error) {
            console.log('❌ Auth flow error:', error.message);
        }
        
        return null;
    }
    
    async diagnoseRouting() {
        console.log('\n🔍 ROUTING DIAGNOSIS:');
        
        // Check if master router can reach services
        const masterServices = [
            { name: 'gaming-engine', port: 8888 },
            { name: 'character-theater', port: 9950 },
            { name: 'spatial-router', port: 8800 }
        ];
        
        for (const service of masterServices) {
            try {
                const response = await this.fetchWithTimeout(`http://localhost:${service.port}`, 2000);
                const status = response.ok ? '✅ HEALTHY' : '⚠️ RESPONDING BUT ERROR';
                console.log(`   ${service.name.padEnd(20)} → ${status}`);
            } catch (error) {
                console.log(`   ${service.name.padEnd(20)} → ❌ UNREACHABLE`);
            }
        }
        
        // Test routing logic
        console.log('\n🛠️  ROUTING LOGIC TEST:');
        
        try {
            const masterRouterResponse = await fetch('http://localhost:5555');
            const masterData = await masterRouterResponse.json();
            
            console.log('Master Router Status:');
            console.log(`   Healthy Services: ${masterData.system.healthyServices}/${masterData.system.totalServices}`);
            console.log(`   Active Users: ${masterData.system.activeUsers}`);
            console.log(`   Total Requests: ${masterData.system.totalRequests}`);
            
        } catch (error) {
            console.log('❌ Could not get master router status');
        }
    }
    
    async fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'ServiceTester/1.0' }
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new ServiceTester();
    tester.testAll().then(() => {
        console.log('\n🏁 Testing complete!');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Testing failed:', error);
        process.exit(1);
    });
}

module.exports = ServiceTester;