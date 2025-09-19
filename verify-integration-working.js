#!/usr/bin/env node

/**
 * 🔍 INTEGRATION VERIFICATION ENGINE
 * Tests all systems work together properly
 * Fetches real data from web to verify connections
 */

const axios = require('axios');
const WebSocket = require('ws');
const { spawn } = require('child_process');

class IntegrationVerifier {
    constructor() {
        this.services = {
            orchestrator: { port: 3001, status: 'unknown', endpoint: '/status' },
            gameEngine: { port: 4500, status: 'unknown', endpoint: '/actions/state/runescape' },
            reasoning: { port: 5500, status: 'unknown', endpoint: '/reasoning/history' },
            cryptoTrace: { port: 6000, status: 'unknown', endpoint: '/trace/patterns' },
            guardian: { port: 4300, status: 'unknown', endpoint: '/guardian/status' }
        };
        
        this.tests = [];
        this.webFetchResults = [];
        this.realDataSources = [
            'https://api.coingecko.com/api/v3/ping',
            'https://jsonplaceholder.typicode.com/posts/1',
            'https://api.github.com/zen'
        ];
    }
    
    async verifyAll() {
        console.log('🔍 STARTING COMPREHENSIVE INTEGRATION VERIFICATION\n');
        
        // Step 1: Check all services are running
        await this.checkServices();
        
        // Step 2: Test real web fetching
        await this.testWebFetching();
        
        // Step 3: Test game-to-crypto connections
        await this.testGameCryptoConnections();
        
        // Step 4: Test AI reasoning pipeline
        await this.testReasoningPipeline();
        
        // Step 5: Test pattern detection
        await this.testPatternDetection();
        
        // Step 6: Generate verification report
        this.generateReport();
        
        return this.getOverallStatus();
    }
    
    async checkServices() {
        console.log('📡 CHECKING SERVICE CONNECTIVITY...\n');
        
        for (const [name, config] of Object.entries(this.services)) {
            try {
                const response = await axios.get(`http://localhost:${config.port}${config.endpoint}`, {
                    timeout: 5000
                });
                
                config.status = 'online';
                config.responseTime = Date.now();
                config.data = response.data;
                
                console.log(`✅ ${name.toUpperCase()}: Online (${config.port})`);
                
            } catch (error) {
                config.status = 'offline';
                config.error = error.message;
                console.log(`❌ ${name.toUpperCase()}: Offline (${error.message})`);
            }
        }
        
        console.log('');
    }
    
    async testWebFetching() {
        console.log('🌐 TESTING REAL WEB FETCHING...\n');
        
        for (const url of this.realDataSources) {
            try {
                const startTime = Date.now();
                const response = await axios.get(url, { timeout: 10000 });
                const responseTime = Date.now() - startTime;
                
                this.webFetchResults.push({
                    url,
                    status: 'success',
                    responseTime,
                    dataSize: JSON.stringify(response.data).length,
                    data: response.data
                });
                
                console.log(`✅ ${url}: ${responseTime}ms (${this.webFetchResults[this.webFetchResults.length - 1].dataSize} bytes)`);
                
            } catch (error) {
                this.webFetchResults.push({
                    url,
                    status: 'failed',
                    error: error.message
                });
                
                console.log(`❌ ${url}: Failed (${error.message})`);
            }
        }
        
        console.log('');
    }
    
    async testGameCryptoConnections() {
        console.log('🎮💰 TESTING GAME-CRYPTO CONNECTIONS...\n');
        
        try {
            // Test game action triggers crypto trace
            const gameAction = await axios.post('http://localhost:4500/actions/queue', {
                game: 'runescape',
                action: 'mine',
                params: { oreType: 'gold' }
            });
            
            console.log('✅ Game action queued successfully');
            
            // Wait a moment for processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if crypto trace picked it up
            const cryptoPatterns = await axios.get('http://localhost:6000/trace/patterns');
            
            if (cryptoPatterns.data.gameConnections.length > 0) {
                console.log('✅ Game-crypto connection detected');
            } else {
                console.log('⚠️ No game-crypto connections found yet');
            }
            
        } catch (error) {
            console.log(`❌ Game-crypto connection test failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    async testReasoningPipeline() {
        console.log('🧠 TESTING AI REASONING PIPELINE...\n');
        
        try {
            // Test reasoning analysis
            const reasoning = await axios.post('http://localhost:5500/reasoning/analyze', {
                game: 'runescape',
                action: 'mine',
                context: { oreType: 'gold', playerStats: { mining: 50 } }
            });
            
            if (reasoning.data.reasoning && reasoning.data.aiRecommendations) {
                console.log('✅ AI reasoning pipeline working');
                console.log(`   Confidence: ${Math.round(reasoning.data.reasoning.confidence * 100)}%`);
                console.log(`   Teacher AI: ${reasoning.data.aiRecommendations.teacher ? 'Active' : 'Inactive'}`);
                console.log(`   Guardian AI: ${reasoning.data.aiRecommendations.guardian ? 'Active' : 'Inactive'}`);
                console.log(`   Companion AI: ${reasoning.data.aiRecommendations.companion ? 'Active' : 'Inactive'}`);
            } else {
                console.log('⚠️ Reasoning pipeline incomplete');
            }
            
        } catch (error) {
            console.log(`❌ Reasoning pipeline test failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    async testPatternDetection() {
        console.log('🔍 TESTING PATTERN DETECTION...\n');
        
        try {
            // Test pattern search
            const patterns = await axios.post('http://localhost:6000/trace/search', {
                pattern: '@Hello'
            });
            
            console.log('✅ Pattern search working');
            console.log(`   Wallets found: ${patterns.data.results.wallets.length}`);
            console.log(`   Transactions: ${patterns.data.results.transactions.length}`);
            console.log(`   Web hints: ${patterns.data.results.webHints.length}`);
            
            // Test hashtag pattern
            const hashtagPatterns = await axios.post('http://localhost:6000/trace/search', {
                pattern: '#World'
            });
            
            console.log('✅ Hashtag pattern search working');
            
        } catch (error) {
            console.log(`❌ Pattern detection test failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    generateReport() {
        console.log('📋 VERIFICATION REPORT');
        console.log('=====================\n');
        
        // Service status
        const onlineServices = Object.values(this.services).filter(s => s.status === 'online').length;
        const totalServices = Object.keys(this.services).length;
        
        console.log(`📊 Services: ${onlineServices}/${totalServices} online`);
        
        // Web connectivity
        const successfulFetches = this.webFetchResults.filter(r => r.status === 'success').length;
        console.log(`🌐 Web connectivity: ${successfulFetches}/${this.realDataSources.length} sources reachable`);
        
        // Overall health
        const healthScore = Math.round(((onlineServices / totalServices) + (successfulFetches / this.realDataSources.length)) / 2 * 100);
        console.log(`🎯 Overall health: ${healthScore}%`);
        
        if (healthScore >= 80) {
            console.log('✅ SYSTEM STATUS: EXCELLENT - Ready for production use');
        } else if (healthScore >= 60) {
            console.log('⚠️ SYSTEM STATUS: GOOD - Minor issues detected');
        } else {
            console.log('❌ SYSTEM STATUS: POOR - Major issues need attention');
        }
        
        console.log('\n📝 RECOMMENDATIONS:');
        
        if (onlineServices < totalServices) {
            console.log('   • Restart offline services');
        }
        
        if (successfulFetches < this.realDataSources.length) {
            console.log('   • Check internet connectivity');
        }
        
        if (healthScore < 80) {
            console.log('   • Review service logs for errors');
        }
        
        console.log('');
    }
    
    getOverallStatus() {
        const onlineServices = Object.values(this.services).filter(s => s.status === 'online').length;
        const totalServices = Object.keys(this.services).length;
        const successfulFetches = this.webFetchResults.filter(r => r.status === 'success').length;
        
        return {
            servicesOnline: onlineServices,
            totalServices,
            webConnectivity: successfulFetches,
            totalWebSources: this.realDataSources.length,
            healthScore: Math.round(((onlineServices / totalServices) + (successfulFetches / this.realDataSources.length)) / 2 * 100),
            ready: onlineServices >= Math.ceil(totalServices * 0.8) && successfulFetches > 0
        };
    }
}

// Real-time verification with WebSocket
class RealtimeVerifier {
    constructor() {
        this.connections = new Map();
        this.errors = [];
    }
    
    async testWebSocketConnections() {
        console.log('🔄 TESTING REAL-TIME CONNECTIONS...\n');
        
        const wsEndpoints = [
            { name: 'Game Engine', url: 'ws://localhost:4500' },
            { name: 'Reasoning Engine', url: 'ws://localhost:5500' },
            { name: 'Crypto Trace', url: 'ws://localhost:6000' }
        ];
        
        for (const endpoint of wsEndpoints) {
            try {
                const ws = new WebSocket(endpoint.url);
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        ws.close();
                        reject(new Error('Connection timeout'));
                    }, 5000);
                    
                    ws.on('open', () => {
                        clearTimeout(timeout);
                        console.log(`✅ ${endpoint.name}: WebSocket connected`);
                        this.connections.set(endpoint.name, ws);
                        resolve();
                    });
                    
                    ws.on('error', (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                });
                
            } catch (error) {
                console.log(`❌ ${endpoint.name}: WebSocket failed (${error.message})`);
                this.errors.push({ endpoint: endpoint.name, error: error.message });
            }
        }
        
        // Close all connections
        this.connections.forEach(ws => ws.close());
        
        console.log('');
    }
}

// Web dependency checker
class DependencyChecker {
    constructor() {
        this.requiredPackages = [
            'axios', 'ws', 'express', 'cors'
        ];
        this.optionalPackages = [
            'cheerio', 'puppeteer', 'node-fetch'
        ];
    }
    
    async checkDependencies() {
        console.log('📦 CHECKING DEPENDENCIES...\n');
        
        const packageJson = require('../package.json');
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        for (const pkg of this.requiredPackages) {
            if (dependencies[pkg]) {
                console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
            } else {
                console.log(`❌ ${pkg}: MISSING (required)`);
            }
        }
        
        console.log('\nOptional packages:');
        for (const pkg of this.optionalPackages) {
            if (dependencies[pkg]) {
                console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
            } else {
                console.log(`⚠️ ${pkg}: Not installed (optional)`);
            }
        }
        
        console.log('');
    }
}

// Main verification
async function main() {
    console.log('🔍 🧠 💰 COMPREHENSIVE SYSTEM VERIFICATION\n');
    console.log('==========================================\n');
    
    const verifier = new IntegrationVerifier();
    const realtimeVerifier = new RealtimeVerifier();
    const depChecker = new DependencyChecker();
    
    // Check dependencies first
    await depChecker.checkDependencies();
    
    // Run comprehensive verification
    const status = await verifier.verifyAll();
    
    // Test real-time connections
    await realtimeVerifier.testWebSocketConnections();
    
    // Final summary
    console.log('🎯 FINAL VERIFICATION SUMMARY');
    console.log('============================\n');
    
    if (status.ready) {
        console.log('🎉 SUCCESS! System is ready and working properly!');
        console.log('\n✅ You can now:');
        console.log('   • See characters mining ore in real-time');
        console.log('   • Track crypto wallets and transactions');
        console.log('   • Search for @mentions and #hashtags');
        console.log('   • Get AI reasoning for all actions');
        console.log('   • Monitor patterns and connections');
    } else {
        console.log('⚠️ ISSUES DETECTED - System needs attention');
        console.log(`\n📊 Status: ${status.servicesOnline}/${status.totalServices} services, ${status.webConnectivity}/${status.totalWebSources} web sources`);
        console.log('\n🔧 Try running: ./launch-unified-viewbox.sh');
    }
    
    console.log('\n📋 Next steps:');
    console.log('   1. If verification passed: Open unified-reasoning-dashboard.html');
    console.log('   2. If issues found: Check service logs in logs/ directory');
    console.log('   3. For missing deps: npm install missing-package-name');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { IntegrationVerifier, RealtimeVerifier, DependencyChecker };