#!/usr/bin/env node

/**
 * 🧪 ECONOMY INTEGRATION TEST
 * 
 * Tests the complete token economy flow:
 * 1. Token Billing System (port 7302)
 * 2. Federation Bulletin Board (port 8700)
 * 3. Master Integration Dashboard (port 9500)
 * 4. Domingo Orchestrator (port 7777)
 */

const http = require('http');

class EconomyIntegrationTest {
    constructor() {
        this.services = {
            tokenBilling: { url: 'http://localhost:7302', status: 'unknown' },
            federationBoard: { url: 'http://localhost:8700', status: 'unknown' },
            masterDashboard: { url: 'http://localhost:9500', status: 'unknown' },
            domingoOrchestrator: { url: 'http://localhost:7777', status: 'unknown' }
        };
        
        this.testResults = [];
        this.testUser = 'test-user-' + Date.now();
    }
    
    async runAllTests() {
        console.log('🧪 Starting Economy Integration Tests...\n');
        
        // Phase 1: Service Health Checks
        await this.testServiceHealth();
        
        // Phase 2: Token Economy Flow
        await this.testTokenEconomyFlow();
        
        // Phase 3: Federation Integration
        await this.testFederationIntegration();
        
        // Phase 4: Export Integration
        await this.testExportIntegration();
        
        // Phase 5: End-to-End Integration
        await this.testEndToEndFlow();
        
        // Report Results
        this.generateReport();
    }
    
    async testServiceHealth() {
        console.log('🔍 Phase 1: Service Health Checks');
        console.log('================================\n');
        
        for (const [name, service] of Object.entries(this.services)) {
            try {
                const response = await this.makeRequest(service.url + '/health', 'GET');
                if (response.status === 200) {
                    service.status = 'healthy';
                    console.log(`✅ ${name}: HEALTHY`);
                    this.testResults.push({ 
                        test: `${name}_health`, 
                        status: 'pass', 
                        details: 'Service responding' 
                    });
                } else {
                    service.status = 'unhealthy';
                    console.log(`⚠️ ${name}: UNHEALTHY (status: ${response.status})`);
                    this.testResults.push({ 
                        test: `${name}_health`, 
                        status: 'fail', 
                        details: `HTTP ${response.status}` 
                    });
                }
            } catch (error) {
                service.status = 'offline';
                console.log(`❌ ${name}: OFFLINE (${error.code || error.message})`);
                this.testResults.push({ 
                    test: `${name}_health`, 
                    status: 'fail', 
                    details: error.code || error.message 
                });
            }
        }
        
        console.log();
    }
    
    async testTokenEconomyFlow() {
        console.log('💰 Phase 2: Token Economy Flow');
        console.log('==============================\n');
        
        if (this.services.tokenBilling.status !== 'healthy') {
            console.log('⚠️ Skipping token tests - service offline\n');
            return;
        }
        
        try {
            // Test 1: Generate token
            console.log('📝 Test 1: Generate token for user');
            const tokenResponse = await this.makeRequest(
                this.services.tokenBilling.url + '/api/tokens/generate',
                'POST',
                {
                    userId: this.testUser,
                    email: `${this.testUser}@test.com`,
                    billingTier: 'free'
                }
            );
            
            if (tokenResponse.data.success) {
                console.log(`✅ Token generated: ${tokenResponse.data.user.tokensAvailable} tokens available`);
                this.testResults.push({ 
                    test: 'token_generation', 
                    status: 'pass', 
                    details: `${tokenResponse.data.user.tokensAvailable} tokens` 
                });
            } else {
                console.log(`❌ Token generation failed: ${tokenResponse.data.error}`);
                this.testResults.push({ 
                    test: 'token_generation', 
                    status: 'fail', 
                    details: tokenResponse.data.error 
                });
            }
            
            // Test 2: Check usage
            console.log('📊 Test 2: Check user usage');
            const usageResponse = await this.makeRequest(
                this.services.tokenBilling.url + `/api/usage/${this.testUser}`,
                'GET'
            );
            
            if (usageResponse.data.user) {
                console.log(`✅ Usage data retrieved: Tier ${usageResponse.data.user.billingTier}`);
                this.testResults.push({ 
                    test: 'usage_check', 
                    status: 'pass', 
                    details: `Tier: ${usageResponse.data.user.billingTier}` 
                });
            } else {
                console.log(`❌ Usage check failed`);
                this.testResults.push({ 
                    test: 'usage_check', 
                    status: 'fail', 
                    details: 'No usage data' 
                });
            }
            
        } catch (error) {
            console.log(`❌ Token economy tests failed: ${error.message}`);
            this.testResults.push({ 
                test: 'token_economy', 
                status: 'fail', 
                details: error.message 
            });
        }
        
        console.log();
    }
    
    async testFederationIntegration() {
        console.log('🏛️ Phase 3: Federation Integration');
        console.log('=================================\n');
        
        if (this.services.federationBoard.status !== 'healthy') {
            console.log('⚠️ Skipping federation tests - service offline\n');
            return;
        }
        
        try {
            // Test 1: Register citizen
            console.log('📝 Test 1: Register federation citizen');
            const citizenResponse = await this.makeRequest(
                this.services.federationBoard.url + '/api/citizens/register',
                'POST',
                {
                    username: this.testUser,
                    gameData: { level: 5, contributions: 2, qualityScore: 0.8 }
                }
            );
            
            if (citizenResponse.data.success) {
                console.log(`✅ Citizen registered: ${citizenResponse.data.citizen.citizenship_level} level`);
                this.testResults.push({ 
                    test: 'citizen_registration', 
                    status: 'pass', 
                    details: citizenResponse.data.citizen.citizenship_level 
                });
            } else {
                console.log(`❌ Citizen registration failed`);
                this.testResults.push({ 
                    test: 'citizen_registration', 
                    status: 'fail', 
                    details: 'Registration failed' 
                });
            }
            
            // Test 2: Get federation stats
            console.log('📊 Test 2: Get federation statistics');
            const statsResponse = await this.makeRequest(
                this.services.federationBoard.url + '/api/federation/stats',
                'GET'
            );
            
            if (statsResponse.data.success) {
                console.log(`✅ Stats retrieved: ${statsResponse.data.stats.total_citizens} citizens`);
                this.testResults.push({ 
                    test: 'federation_stats', 
                    status: 'pass', 
                    details: `${statsResponse.data.stats.total_citizens} citizens` 
                });
            } else {
                console.log(`❌ Stats retrieval failed`);
                this.testResults.push({ 
                    test: 'federation_stats', 
                    status: 'fail', 
                    details: 'No stats data' 
                });
            }
            
        } catch (error) {
            console.log(`❌ Federation tests failed: ${error.message}`);
            this.testResults.push({ 
                test: 'federation_integration', 
                status: 'fail', 
                details: error.message 
            });
        }
        
        console.log();
    }
    
    async testExportIntegration() {
        console.log('📦 Phase 4: Export Integration');
        console.log('=============================\n');
        
        if (this.services.domingoOrchestrator.status !== 'healthy') {
            console.log('⚠️ Skipping export tests - service offline\n');
            return;
        }
        
        try {
            // Test Domingo status
            console.log('📝 Test: Check Domingo orchestrator status');
            const statusResponse = await this.makeRequest(
                this.services.domingoOrchestrator.url + '/api/system-status',
                'GET'
            );
            
            if (statusResponse.status === 200) {
                console.log(`✅ Domingo orchestrator ready for exports`);
                this.testResults.push({ 
                    test: 'domingo_ready', 
                    status: 'pass', 
                    details: 'Ready for exports' 
                });
            } else {
                console.log(`❌ Domingo orchestrator not ready`);
                this.testResults.push({ 
                    test: 'domingo_ready', 
                    status: 'fail', 
                    details: 'Not ready' 
                });
            }
            
        } catch (error) {
            console.log(`❌ Export tests failed: ${error.message}`);
            this.testResults.push({ 
                test: 'export_integration', 
                status: 'fail', 
                details: error.message 
            });
        }
        
        console.log();
    }
    
    async testEndToEndFlow() {
        console.log('🔄 Phase 5: End-to-End Integration');
        console.log('=================================\n');
        
        if (this.services.masterDashboard.status !== 'healthy') {
            console.log('⚠️ Skipping E2E tests - master dashboard offline\n');
            return;
        }
        
        try {
            // Test full document processing flow
            console.log('📝 Test: Full document processing flow');
            const flowResponse = await this.makeRequest(
                this.services.masterDashboard.url + '/api/process-document-flow',
                'POST',
                {
                    documentPath: 'test-integration-document.md',
                    userId: this.testUser,
                    options: {
                        premium: false,
                        postToBoard: true,
                        export: true,
                        exportFormat: 'npm'
                    }
                }
            );
            
            if (flowResponse.data.success) {
                console.log(`✅ E2E flow completed successfully`);
                console.log(`   - Steps completed: ${Object.keys(flowResponse.data.flow).length}`);
                console.log(`   - Export package: ${flowResponse.data.flow.step7_export?.status || 'N/A'}`);
                
                this.testResults.push({ 
                    test: 'end_to_end_flow', 
                    status: 'pass', 
                    details: `${Object.keys(flowResponse.data.flow).length} steps completed` 
                });
            } else {
                console.log(`❌ E2E flow failed: ${flowResponse.data.error}`);
                this.testResults.push({ 
                    test: 'end_to_end_flow', 
                    status: 'fail', 
                    details: flowResponse.data.error 
                });
            }
            
            // Test token balance after flow
            if (this.services.tokenBilling.status === 'healthy') {
                console.log('💰 Test: Token balance after processing');
                const balanceResponse = await this.makeRequest(
                    this.services.masterDashboard.url + `/api/token-balance/${this.testUser}`,
                    'GET'
                );
                
                if (balanceResponse.data.balance !== undefined) {
                    console.log(`✅ Token balance updated: ${balanceResponse.data.balance} remaining`);
                    this.testResults.push({ 
                        test: 'token_consumption', 
                        status: 'pass', 
                        details: `${balanceResponse.data.balance} tokens remaining` 
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ E2E tests failed: ${error.message}`);
            this.testResults.push({ 
                test: 'end_to_end', 
                status: 'fail', 
                details: error.message 
            });
        }
        
        console.log();
    }
    
    generateReport() {
        console.log('📊 INTEGRATION TEST REPORT');
        console.log('=========================\n');
        
        const passed = this.testResults.filter(r => r.status === 'pass').length;
        const failed = this.testResults.filter(r => r.status === 'fail').length;
        const total = this.testResults.length;
        
        console.log(`📈 Summary: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)\n`);
        
        // Services status
        console.log('🔧 Service Status:');
        Object.entries(this.services).forEach(([name, service]) => {
            const icon = service.status === 'healthy' ? '✅' : 
                         service.status === 'unhealthy' ? '⚠️' : '❌';
            console.log(`   ${icon} ${name}: ${service.status.toUpperCase()}`);
        });
        
        console.log('\n🧪 Test Results:');
        this.testResults.forEach(result => {
            const icon = result.status === 'pass' ? '✅' : '❌';
            console.log(`   ${icon} ${result.test}: ${result.details}`);
        });
        
        // Integration readiness
        const healthyServices = Object.values(this.services).filter(s => s.status === 'healthy').length;
        const totalServices = Object.keys(this.services).length;
        
        console.log(`\n🎯 Integration Readiness: ${healthyServices}/${totalServices} services online`);
        
        if (healthyServices === totalServices && passed > failed) {
            console.log('🚀 SYSTEM READY: All services connected and economy integrated!');
        } else if (healthyServices >= totalServices * 0.75) {
            console.log('⚠️ PARTIAL INTEGRATION: Most services working, some issues detected');
        } else {
            console.log('❌ INTEGRATION ISSUES: Multiple services offline or failing');
        }
        
        // Next steps
        console.log('\n📝 Next Steps:');
        if (this.services.tokenBilling.status !== 'healthy') {
            console.log('   1. Start Token Billing System: node automated-token-billing-system.js');
        }
        if (this.services.federationBoard.status !== 'healthy') {
            console.log('   2. Start Federation Board: node federation-bulletin-board.js');
        }
        if (this.services.domingoOrchestrator.status !== 'healthy') {
            console.log('   3. Start Domingo Orchestrator: node domingo-package.js');
        }
        if (this.services.masterDashboard.status !== 'healthy') {
            console.log('   4. Start Master Dashboard: node master-integration-dashboard.js');
        }
        
        console.log('   5. Open http://localhost:9500 to access unified interface');
        console.log('   6. Test document processing flow end-to-end');
        
        console.log('\n🎉 Economy integration testing complete!');
    }
    
    // Helper method for making HTTP requests
    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                method,
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: responseData });
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new EconomyIntegrationTest();
    
    console.log(`
🧪 ECONOMY INTEGRATION TEST SUITE
=================================

Testing the complete Document Generator token economy:
• Token Billing System (automated-token-billing-system.js)
• Federation Bulletin Board (federation-bulletin-board.js)  
• Master Integration Dashboard (master-integration-dashboard.js)
• Domingo Orchestrator (domingo-package.js)

Starting tests...
`);
    
    tester.runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = EconomyIntegrationTest;