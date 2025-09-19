#!/usr/bin/env node

/**
 * 🧪 TEST NEWSLETTER INTEGRATION
 * 
 * Simple test to verify integration with existing family platform services
 * Tests connections without requiring external dependencies
 */

const axios = require('axios');

class NewsletterIntegrationTest {
    constructor() {
        this.services = {
            familyPlatform: 'http://localhost:7000',
            familyAPI: 'http://localhost:7002', 
            phpbbForum: 'http://localhost:7777',
            billingAPI: 'http://localhost:10000',
            democraticKarma: 'http://localhost:9200'
        };
        
        this.results = {};
    }
    
    async testAllServices() {
        console.log('🧪 Testing connections to existing family platform services...\n');
        
        for (const [serviceName, url] of Object.entries(this.services)) {
            await this.testService(serviceName, url);
        }
        
        this.generateReport();
    }
    
    async testService(serviceName, url) {
        try {
            console.log(`🔍 Testing ${serviceName} at ${url}...`);
            
            // Try health endpoint first
            const healthResponse = await this.tryEndpoint(url + '/health');
            if (healthResponse.success) {
                this.results[serviceName] = {
                    status: 'CONNECTED',
                    url: url,
                    health: healthResponse.data,
                    integration: 'READY'
                };
                console.log(`✅ ${serviceName}: CONNECTED`);
                return;
            }
            
            // Try root endpoint
            const rootResponse = await this.tryEndpoint(url);
            if (rootResponse.success) {
                this.results[serviceName] = {
                    status: 'CONNECTED',
                    url: url,
                    response: 'Root endpoint responsive',
                    integration: 'READY'
                };
                console.log(`✅ ${serviceName}: CONNECTED (root)`);
                return;
            }
            
            // Service not responding
            this.results[serviceName] = {
                status: 'OFFLINE',
                url: url,
                error: 'Service not responding',
                integration: 'WILL_WORK_OFFLINE'
            };
            console.log(`⚠️ ${serviceName}: OFFLINE (will work offline)`);
            
        } catch (error) {
            this.results[serviceName] = {
                status: 'ERROR',
                url: url,
                error: error.message,
                integration: 'NEEDS_INVESTIGATION'
            };
            console.log(`❌ ${serviceName}: ERROR - ${error.message}`);
        }
    }
    
    async tryEndpoint(url) {
        try {
            const response = await axios.get(url, { 
                timeout: 3000,
                validateStatus: () => true // Accept any status code
            });
            
            return {
                success: true,
                status: response.status,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    generateReport() {
        console.log('\n📊 NEWSLETTER INTEGRATION REPORT');
        console.log('=====================================\n');
        
        const connectedServices = Object.values(this.results).filter(r => r.status === 'CONNECTED').length;
        const totalServices = Object.keys(this.results).length;
        
        console.log(`🔗 Services Connected: ${connectedServices}/${totalServices}`);
        console.log(`📰 Newsletter Integration Status: ${this.determineIntegrationStatus()}\n`);
        
        // Service details
        for (const [serviceName, result] of Object.entries(this.results)) {
            const statusIcon = result.status === 'CONNECTED' ? '✅' : 
                             result.status === 'OFFLINE' ? '⚠️' : '❌';
            
            console.log(`${statusIcon} ${serviceName.toUpperCase()}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   Integration: ${result.integration}`);
            
            if (result.health) {
                console.log(`   Health: ${JSON.stringify(result.health, null, 2).substring(0, 100)}...`);
            }
            
            console.log('');
        }
        
        // Integration recommendations
        this.generateRecommendations();
    }
    
    determineIntegrationStatus() {
        const connectedServices = Object.values(this.results).filter(r => r.status === 'CONNECTED').length;
        
        if (connectedServices >= 3) return 'EXCELLENT - Ready for full integration';
        if (connectedServices >= 1) return 'GOOD - Partial integration possible';
        return 'BASIC - Newsletter will work standalone';
    }
    
    generateRecommendations() {
        console.log('🎯 INTEGRATION RECOMMENDATIONS');
        console.log('===============================\n');
        
        const connectedServices = Object.values(this.results).filter(r => r.status === 'CONNECTED');
        const offlineServices = Object.values(this.results).filter(r => r.status === 'OFFLINE');
        
        if (connectedServices.length > 0) {
            console.log('✅ READY TO INTEGRATE:');
            connectedServices.forEach(service => {
                const serviceName = Object.keys(this.results).find(key => this.results[key] === service);
                console.log(`   • ${serviceName} - Newsletter can connect immediately`);
            });
            console.log('');
        }
        
        if (offlineServices.length > 0) {
            console.log('📋 OFFLINE SERVICES (Newsletter will work without these):');
            offlineServices.forEach(service => {
                const serviceName = Object.keys(this.results).find(key => this.results[key] === service);
                console.log(`   • ${serviceName} - Start service to enable full integration`);
            });
            console.log('');
        }
        
        console.log('🚀 NEXT STEPS:');
        console.log('   1. Start the Newsletter Bridge Service (port 3000)');
        console.log('   2. Test newsletter generation for a sample family');
        console.log('   3. Connect available services for enhanced features');
        console.log('   4. Start offline services as needed for full functionality\n');
        
        console.log('💡 FAMILY NEWSLETTER VISION:');
        console.log('   The "Mauer Moo\'s" digital newsletter will work with whatever');
        console.log('   services are available and gracefully enhance as more services come online!');
    }
}

// Run the test
async function main() {
    console.log('🌉 Newsletter-Family Platform Integration Test');
    console.log('===============================================\n');
    
    const tester = new NewsletterIntegrationTest();
    await tester.testAllServices();
}

if (require.main === module) {
    main().catch(console.error);
}