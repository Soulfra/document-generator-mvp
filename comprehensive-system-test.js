#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE SYSTEM TEST
 * Tests all critical functionality across the entire D2JSP mobile system
 */

const http = require('http');

class ComprehensiveSystemTest {
    constructor() {
        this.testResults = [];
        this.serviceStatuses = {};
        this.services = {
            forum: 3000,
            reasoning: 5500,
            crypto: 6000,
            mining: 7000,
            game: 8000,
            mobile: 9001
        };
    }
    
    async runAllTests() {
        console.log('🧪 COMPREHENSIVE SYSTEM TEST');
        console.log('============================\n');
        
        // Test 1: Service Health
        console.log('📡 Test 1: Service Health Check...');
        await this.testServiceHealth();
        
        // Test 2: API Endpoints
        console.log('\n🔌 Test 2: API Endpoint Tests...');
        await this.testAPIEndpoints();
        
        // Test 3: Mobile App Features
        console.log('\n📱 Test 3: Mobile App Features...');
        await this.testMobileFeatures(); 
        
        // Test 4: Crypto Wallet Functions
        console.log('\n💳 Test 4: Crypto Wallet Functions...');
        await this.testCryptoWallet();
        
        // Test 5: Game Engine Functions
        console.log('\n🎮 Test 5: Game Engine Functions...');
        await this.testGameEngine();
        
        // Test 6: Cross-Service Integration
        console.log('\n🔗 Test 6: Cross-Service Integration...');
        await this.testIntegration();
        
        // Test 7: PWA Features
        console.log('\n📱 Test 7: PWA Features...');
        await this.testPWAFeatures();
        
        // Generate final report
        console.log('\n📊 FINAL TEST REPORT');
        console.log('====================');
        this.generateReport();
        
        return this.getOverallScore();
    }
    
    async testServiceHealth() {
        for (const [name, port] of Object.entries(this.services)) {
            try {
                const response = await this.httpRequest(`http://localhost:${port}/`);
                const status = response.statusCode < 500 ? 'healthy' : 'degraded';
                
                this.serviceStatuses[name] = status;
                console.log(`  ✅ ${name.toUpperCase()}: ${status} (port ${port})`);
                this.addTestResult('Service Health', `${name} service`, 'pass');
                
            } catch (error) {
                this.serviceStatuses[name] = 'offline';
                console.log(`  ❌ ${name.toUpperCase()}: offline (port ${port})`);
                this.addTestResult('Service Health', `${name} service`, 'fail');
            }
        }
    }
    
    async testAPIEndpoints() {
        const endpoints = [
            { service: 'mobile', path: '/api/wallet', description: 'Mobile wallet API' },
            { service: 'mobile', path: '/api/mobile-sync', description: 'Mobile sync API' },
            { service: 'game', path: '/api/game-state', description: 'Game state API' },
            { service: 'mobile', path: '/pwa-manifest.json', description: 'PWA manifest' },
            { service: 'mobile', path: '/service-worker.js', description: 'Service worker' }
        ];
        
        for (const endpoint of endpoints) {
            const port = this.services[endpoint.service];
            
            if (this.serviceStatuses[endpoint.service] === 'offline') {
                console.log(`  ⏸️ ${endpoint.description}: Service offline`);
                this.addTestResult('API Endpoints', endpoint.description, 'skip');
                continue;
            }
            
            try {
                const response = await this.httpRequest(`http://localhost:${port}${endpoint.path}`);
                
                if (response.statusCode < 400) {
                    console.log(`  ✅ ${endpoint.description}: Working`);
                    this.addTestResult('API Endpoints', endpoint.description, 'pass');
                } else {
                    console.log(`  ⚠️ ${endpoint.description}: Error ${response.statusCode}`);
                    this.addTestResult('API Endpoints', endpoint.description, 'warning');
                }
            } catch (error) {
                console.log(`  ❌ ${endpoint.description}: Failed`);
                this.addTestResult('API Endpoints', endpoint.description, 'fail');
            }
        }
    }
    
    async testMobileFeatures() {
        if (this.serviceStatuses.mobile === 'offline') {
            console.log('  ⏸️ Mobile app offline - skipping mobile tests');
            return;
        }
        
        const features = [
            { path: '/', description: 'Mobile UI loads' },
            { path: '/api/wallet', description: 'Wallet data accessible' },
            { path: '/pwa-manifest.json', description: 'PWA manifest available' },
            { path: '/service-worker.js', description: 'Service worker available' }
        ];
        
        for (const feature of features) {
            try {
                const response = await this.httpRequest(`http://localhost:${this.services.mobile}${feature.path}`);
                
                if (response.statusCode === 200) {
                    console.log(`  ✅ ${feature.description}`);
                    this.addTestResult('Mobile Features', feature.description, 'pass');
                } else {
                    console.log(`  ⚠️ ${feature.description}: Status ${response.statusCode}`);
                    this.addTestResult('Mobile Features', feature.description, 'warning');
                }
            } catch (error) {
                console.log(`  ❌ ${feature.description}: Failed`);
                this.addTestResult('Mobile Features', feature.description, 'fail');
            }
        }
    }
    
    async testCryptoWallet() {
        if (this.serviceStatuses.mobile === 'offline') {
            console.log('  ⏸️ Mobile app offline - skipping wallet tests');
            return;
        }
        
        try {
            // Test wallet API
            const walletResponse = await this.httpRequest(`http://localhost:${this.services.mobile}/api/wallet`);
            
            if (walletResponse.statusCode === 200) {
                const walletData = JSON.parse(walletResponse.data);
                
                // Check wallet properties
                if (walletData.address) {
                    console.log(`  ✅ Wallet address generated: ${walletData.address.slice(0, 8)}...`);
                    this.addTestResult('Crypto Wallet', 'Wallet address generation', 'pass');
                } else {
                    console.log('  ❌ Wallet address missing');
                    this.addTestResult('Crypto Wallet', 'Wallet address generation', 'fail');
                }
                
                // Check tracked wallets
                if (walletData.trackedWallets && walletData.trackedWallets.length > 0) {
                    const scamWallet = walletData.trackedWallets.find(w => 
                        w.address.includes('0x742d35Cc'));
                    
                    if (scamWallet) {
                        console.log(`  ✅ Scammed wallet being tracked: ${scamWallet.address}`);
                        this.addTestResult('Crypto Wallet', 'Scammed wallet tracking', 'pass');
                    } else {
                        console.log('  ⚠️ Scammed wallet not found in tracking');
                        this.addTestResult('Crypto Wallet', 'Scammed wallet tracking', 'warning');
                    }
                } else {
                    console.log('  ❌ No tracked wallets found');
                    this.addTestResult('Crypto Wallet', 'Scammed wallet tracking', 'fail');
                }
                
                // Check wallet connectivity
                if (walletData.connected) {
                    console.log('  ✅ Wallet connection status: Connected');
                    this.addTestResult('Crypto Wallet', 'Wallet connectivity', 'pass');
                } else {
                    console.log('  ❌ Wallet not connected');
                    this.addTestResult('Crypto Wallet', 'Wallet connectivity', 'fail');
                }
                
            } else {
                console.log(`  ❌ Wallet API failed: Status ${walletResponse.statusCode}`);
                this.addTestResult('Crypto Wallet', 'Wallet API', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ Wallet test failed: ${error.message}`);
            this.addTestResult('Crypto Wallet', 'Wallet functionality', 'fail');
        }
    }
    
    async testGameEngine() {
        if (this.serviceStatuses.game === 'offline') {
            console.log('  ⏸️ Game engine offline - skipping game tests');
            return;
        }
        
        try {
            // Test game state API
            const gameResponse = await this.httpRequest(`http://localhost:${this.services.game}/api/game-state`);
            
            if (gameResponse.statusCode === 200) {
                const gameData = JSON.parse(gameResponse.data);
                
                // Check player data
                if (gameData.player && gameData.player.level) {
                    console.log(`  ✅ Player data loaded: Level ${gameData.player.level}`);
                    this.addTestResult('Game Engine', 'Player data', 'pass');
                } else {
                    console.log('  ❌ Player data missing');
                    this.addTestResult('Game Engine', 'Player data', 'fail');
                }
                
                // Check inventory system
                if (gameData.inventory && gameData.inventory.grid) {
                    console.log(`  ✅ Inventory system: ${gameData.inventory.grid.length} slots`);
                    this.addTestResult('Game Engine', 'Inventory system', 'pass');
                } else {
                    console.log('  ❌ Inventory system missing');
                    this.addTestResult('Game Engine', 'Inventory system', 'fail');
                }
                
                // Check equipment slots
                if (gameData.inventory.equipped) {
                    console.log('  ✅ Equipment system loaded');
                    this.addTestResult('Game Engine', 'Equipment system', 'pass');
                } else {
                    console.log('  ❌ Equipment system missing');
                    this.addTestResult('Game Engine', 'Equipment system', 'fail');
                }
                
            } else {
                console.log(`  ❌ Game API failed: Status ${gameResponse.statusCode}`);
                this.addTestResult('Game Engine', 'Game API', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ Game test failed: ${error.message}`);
            this.addTestResult('Game Engine', 'Game functionality', 'fail');
        }
    }
    
    async testIntegration() {
        if (this.serviceStatuses.mobile === 'offline') {
            console.log('  ⏸️ Mobile app offline - skipping integration tests');
            return;
        }
        
        try {
            // Test mobile sync (which integrates with all services)
            const syncResponse = await this.httpRequest(`http://localhost:${this.services.mobile}/api/mobile-sync`);
            
            if (syncResponse.statusCode === 200) {
                const syncData = JSON.parse(syncResponse.data);
                
                // Check if sync includes game data
                if (syncData.game) {
                    console.log('  ✅ Mobile-Game integration working');
                    this.addTestResult('Integration', 'Mobile-Game integration', 'pass');
                } else {
                    console.log('  ⚠️ Mobile-Game integration limited');
                    this.addTestResult('Integration', 'Mobile-Game integration', 'warning');
                }
                
                // Check sync timestamp
                if (syncData.timestamp) {
                    console.log('  ✅ Data synchronization working');
                    this.addTestResult('Integration', 'Data synchronization', 'pass');
                } else {
                    console.log('  ❌ Data synchronization failed');
                    this.addTestResult('Integration', 'Data synchronization', 'fail');
                }
                
            } else {
                console.log(`  ❌ Sync API failed: Status ${syncResponse.statusCode}`);
                this.addTestResult('Integration', 'Mobile sync', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ Integration test failed: ${error.message}`);
            this.addTestResult('Integration', 'Cross-service integration', 'fail');
        }
    }
    
    async testPWAFeatures() {
        if (this.serviceStatuses.mobile === 'offline') {
            console.log('  ⏸️ Mobile app offline - skipping PWA tests');
            return;
        }
        
        try {
            // Test PWA manifest
            const manifestResponse = await this.httpRequest(`http://localhost:${this.services.mobile}/pwa-manifest.json`);
            
            if (manifestResponse.statusCode === 200) {
                const manifest = JSON.parse(manifestResponse.data);
                
                if (manifest.name && manifest.icons) {
                    console.log(`  ✅ PWA Manifest: "${manifest.name}"`);
                    this.addTestResult('PWA Features', 'PWA manifest', 'pass');
                } else {
                    console.log('  ⚠️ PWA manifest incomplete');
                    this.addTestResult('PWA Features', 'PWA manifest', 'warning');
                }
            } else {
                console.log('  ❌ PWA manifest failed');
                this.addTestResult('PWA Features', 'PWA manifest', 'fail');
            }
            
            // Test service worker
            const swResponse = await this.httpRequest(`http://localhost:${this.services.mobile}/service-worker.js`);
            
            if (swResponse.statusCode === 200) {
                console.log('  ✅ Service Worker available');
                this.addTestResult('PWA Features', 'Service worker', 'pass');
            } else {
                console.log('  ❌ Service Worker failed');
                this.addTestResult('PWA Features', 'Service worker', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ PWA test failed: ${error.message}`);
            this.addTestResult('PWA Features', 'PWA functionality', 'fail');
        }
    }
    
    addTestResult(category, test, status) {
        this.testResults.push({ category, test, status });
    }
    
    generateReport() {
        const categories = {};
        
        // Group results by category
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { pass: 0, fail: 0, warning: 0, skip: 0, total: 0 };
            }
            categories[result.category][result.status]++;
            categories[result.category].total++;
        });
        
        // Print category summaries
        Object.entries(categories).forEach(([category, stats]) => {
            const passRate = Math.round((stats.pass / stats.total) * 100);
            console.log(`📊 ${category}: ${stats.pass}/${stats.total} passed (${passRate}%)`);
            
            if (stats.fail > 0) console.log(`   ❌ ${stats.fail} failed`);
            if (stats.warning > 0) console.log(`   ⚠️ ${stats.warning} warnings`);
            if (stats.skip > 0) console.log(`   ⏸️ ${stats.skip} skipped`);
        });
        
        // Overall health
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'pass').length;
        const overallScore = Math.round((passedTests / totalTests) * 100);
        
        console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallScore}%`);
        console.log(`   ✅ ${passedTests}/${totalTests} tests passed`);
        
        if (overallScore >= 90) {
            console.log('✨ EXCELLENT - System fully operational!');
        } else if (overallScore >= 75) {
            console.log('🎉 GOOD - System mostly working with minor issues');
        } else if (overallScore >= 50) {
            console.log('⚠️ FAIR - System functional but needs attention');
        } else {
            console.log('❌ POOR - Major issues need fixing');
        }
        
        // Service summary
        console.log('\n🌐 SERVICE STATUS:');
        Object.entries(this.serviceStatuses).forEach(([service, status]) => {
            const emoji = status === 'healthy' ? '✅' : 
                         status === 'degraded' ? '⚠️' : '❌';
            console.log(`   ${emoji} ${service.toUpperCase()}: ${status}`);
        });
    }
    
    getOverallScore() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'pass').length;
        return Math.round((passedTests / totalTests) * 100);
    }
    
    httpRequest(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const req = http.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }
}

// Main execution
async function main() {
    const tester = new ComprehensiveSystemTest();
    
    try {
        const score = await tester.runAllTests();
        
        console.log('\n🚀 VERIFICATION COMPLETE!');
        
        if (score >= 75) {
            console.log('🎉 System is ready for use!');
            process.exit(0);
        } else {
            console.log('⚠️ System needs attention before production use');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { ComprehensiveSystemTest };