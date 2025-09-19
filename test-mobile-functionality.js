#!/usr/bin/env node

/**
 * 🧪 MOBILE FUNCTIONALITY TEST
 * Tests the mobile wallet app in isolation to verify all features work
 */

const { spawn } = require('child_process');
const http = require('http');

class MobileFunctionalityTest {
    constructor() {
        this.mobileProcess = null;
        this.testResults = [];
    }
    
    async runTests() {
        console.log('📱 MOBILE FUNCTIONALITY TEST');
        console.log('===========================\n');
        
        try {
            // Start mobile app
            console.log('🚀 Starting mobile wallet app...');
            await this.startMobileApp();
            
            // Wait for startup
            console.log('⏳ Waiting for app to initialize...');
            await this.sleep(6000);
            
            // Run tests
            await this.testWalletAPI();
            await this.testMobileUI();
            await this.testPWAFeatures();
            await this.testOfflineCapability();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        } finally {
            // Clean up
            await this.cleanup();
        }
    }
    
    async startMobileApp() {
        return new Promise((resolve, reject) => {
            this.mobileProcess = spawn('node', ['mobile-wallet-app.js'], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let output = '';
            this.mobileProcess.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('MOBILE WALLET APP OPERATIONAL!')) {
                    resolve();
                }
            });
            
            this.mobileProcess.stderr.on('data', (data) => {
                console.error('Mobile app error:', data.toString());
            });
            
            this.mobileProcess.on('error', reject);
            
            setTimeout(() => {
                if (this.mobileProcess && this.mobileProcess.pid) {
                    resolve(); // Assume it started even if we didn't see the message
                } else {
                    reject(new Error('Mobile app failed to start'));
                }
            }, 8000);
        });
    }
    
    async testWalletAPI() {
        console.log('💳 Testing wallet API...');
        
        try {
            const response = await this.httpRequest('http://localhost:9001/api/wallet');
            
            if (response.statusCode === 200) {
                const walletData = JSON.parse(response.data);
                
                if (walletData.address) {
                    console.log(`  ✅ Wallet address: ${walletData.address.slice(0, 12)}...`);
                    this.addResult('Wallet API', 'Address generation', 'pass');
                } else {
                    console.log('  ❌ No wallet address found');
                    this.addResult('Wallet API', 'Address generation', 'fail');
                }
                
                if (walletData.trackedWallets && walletData.trackedWallets.length > 0) {
                    const scamWallet = walletData.trackedWallets.find(w => 
                        w.address.includes('0x742d35Cc'));
                    
                    if (scamWallet) {
                        console.log(`  ✅ Scammed wallet tracked: ${scamWallet.address}`);
                        this.addResult('Wallet API', 'Scam wallet tracking', 'pass');
                    } else {
                        console.log('  ❌ Scammed wallet not tracked');
                        this.addResult('Wallet API', 'Scam wallet tracking', 'fail');
                    }
                } else {
                    console.log('  ❌ No tracked wallets');
                    this.addResult('Wallet API', 'Scam wallet tracking', 'fail');
                }
                
                if (typeof walletData.connected === 'boolean') {
                    console.log(`  ✅ Wallet connected: ${walletData.connected}`);
                    this.addResult('Wallet API', 'Connection status', 'pass');
                } else {
                    console.log('  ❌ Connection status missing');
                    this.addResult('Wallet API', 'Connection status', 'fail');
                }
                
            } else {
                console.log(`  ❌ Wallet API failed: ${response.statusCode}`);
                this.addResult('Wallet API', 'API response', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ Wallet API error: ${error.message}`);
            this.addResult('Wallet API', 'API accessibility', 'fail');
        }
    }
    
    async testMobileUI() {
        console.log('📱 Testing mobile UI...');
        
        try {
            const response = await this.httpRequest('http://localhost:9001/');
            
            if (response.statusCode === 200) {
                const html = response.data;
                
                // Check for mobile viewport
                if (html.includes('viewport')) {
                    console.log('  ✅ Mobile viewport configured');
                    this.addResult('Mobile UI', 'Viewport configuration', 'pass');
                } else {
                    console.log('  ❌ Mobile viewport missing');
                    this.addResult('Mobile UI', 'Viewport configuration', 'fail');
                }
                
                // Check for PWA features
                if (html.includes('manifest')) {
                    console.log('  ✅ PWA manifest linked');
                    this.addResult('Mobile UI', 'PWA manifest link', 'pass');
                } else {
                    console.log('  ❌ PWA manifest not linked');
                    this.addResult('Mobile UI', 'PWA manifest link', 'fail');
                }
                
                // Check for mobile-friendly design
                if (html.includes('touch') || html.includes('mobile')) {
                    console.log('  ✅ Mobile-optimized design');
                    this.addResult('Mobile UI', 'Mobile optimization', 'pass');
                } else {
                    console.log('  ⚠️ Limited mobile optimization');
                    this.addResult('Mobile UI', 'Mobile optimization', 'warning');
                }
                
                // Check for tab navigation
                if (html.includes('tab-nav') && html.includes('Wallet')) {
                    console.log('  ✅ Tab navigation present');
                    this.addResult('Mobile UI', 'Tab navigation', 'pass');
                } else {
                    console.log('  ❌ Tab navigation missing');
                    this.addResult('Mobile UI', 'Tab navigation', 'fail');
                }
                
            } else {
                console.log(`  ❌ Mobile UI failed: ${response.statusCode}`);
                this.addResult('Mobile UI', 'UI loading', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ Mobile UI error: ${error.message}`);
            this.addResult('Mobile UI', 'UI accessibility', 'fail');
        }
    }
    
    async testPWAFeatures() {
        console.log('🔧 Testing PWA features...');
        
        try {
            // Test manifest
            const manifestResponse = await this.httpRequest('http://localhost:9001/pwa-manifest.json');
            
            if (manifestResponse.statusCode === 200) {
                const manifest = JSON.parse(manifestResponse.data);
                
                if (manifest.name && manifest.icons) {
                    console.log(`  ✅ PWA manifest: "${manifest.name}"`);
                    this.addResult('PWA Features', 'PWA manifest', 'pass');
                } else {
                    console.log('  ⚠️ PWA manifest incomplete');
                    this.addResult('PWA Features', 'PWA manifest', 'warning');
                }
            } else {
                console.log('  ❌ PWA manifest failed');
                this.addResult('PWA Features', 'PWA manifest', 'fail');
            }
            
            // Test service worker
            const swResponse = await this.httpRequest('http://localhost:9001/service-worker.js');
            
            if (swResponse.statusCode === 200) {
                const sw = swResponse.data;
                
                if (sw.includes('cache') && sw.includes('offline')) {
                    console.log('  ✅ Service worker with offline support');
                    this.addResult('PWA Features', 'Service worker', 'pass');
                } else {
                    console.log('  ⚠️ Basic service worker');
                    this.addResult('PWA Features', 'Service worker', 'warning');
                }
            } else {
                console.log('  ❌ Service worker failed');
                this.addResult('PWA Features', 'Service worker', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ PWA features error: ${error.message}`);
            this.addResult('PWA Features', 'PWA functionality', 'fail');
        }
    }
    
    async testOfflineCapability() {
        console.log('📶 Testing offline capability...');
        
        try {
            // Test mobile sync (should work even if other services are offline)
            const syncResponse = await this.httpRequest('http://localhost:9001/api/mobile-sync');
            
            if (syncResponse.statusCode === 200) {
                const syncData = JSON.parse(syncResponse.data);
                
                if (syncData.timestamp) {
                    console.log('  ✅ Mobile sync working');
                    this.addResult('Offline Capability', 'Mobile sync', 'pass');
                } else {
                    console.log('  ⚠️ Mobile sync limited');
                    this.addResult('Offline Capability', 'Mobile sync', 'warning');
                }
                
                // Check if it handles offline services gracefully
                if (syncData.game && syncData.game.offline) {  
                    console.log('  ✅ Offline mode handled gracefully');
                    this.addResult('Offline Capability', 'Offline handling', 'pass');
                } else {
                    console.log('  ⚠️ Offline handling unclear');
                    this.addResult('Offline Capability', 'Offline handling', 'warning');
                }
                
            } else {
                console.log(`  ❌ Mobile sync failed: ${syncResponse.statusCode}`);
                this.addResult('Offline Capability', 'Mobile sync', 'fail');
            }
            
        } catch (error) {
            console.log(`  ❌ Offline capability error: ${error.message}`);
            this.addResult('Offline Capability', 'Offline functionality', 'fail');
        }
    }
    
    addResult(category, test, status) {
        this.testResults.push({ category, test, status });
    }
    
    generateReport() {
        console.log('\n📊 MOBILE TEST REPORT');
        console.log('=====================\n');
        
        const categories = {};
        
        // Group by category
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { pass: 0, fail: 0, warning: 0, total: 0 };
            }
            categories[result.category][result.status]++;
            categories[result.category].total++;
        });
        
        // Report by category
        Object.entries(categories).forEach(([category, stats]) => {
            const passRate = Math.round((stats.pass / stats.total) * 100);
            console.log(`📊 ${category}: ${stats.pass}/${stats.total} passed (${passRate}%)`);
        });
        
        // Overall score
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'pass').length;
        const overallScore = Math.round((passedTests / totalTests) * 100);
        
        console.log(`\\n🎯 MOBILE APP HEALTH: ${overallScore}%`);
        
        if (overallScore >= 80) {
            console.log('✨ EXCELLENT - Mobile app fully functional!');
            console.log('📱 Ready for mobile use and PWA installation');
        } else if (overallScore >= 60) {
            console.log('🎉 GOOD - Mobile app mostly working');
            console.log('📱 Can be used with minor limitations');
        } else {
            console.log('⚠️ NEEDS WORK - Mobile app has significant issues');
            console.log('📱 Requires fixes before mobile deployment');
        }
        
        // Key features summary
        console.log('\\n📱 KEY MOBILE FEATURES:');
        console.log('   💳 Crypto Wallet Integration');
        console.log('   📱 Mobile-Responsive Design');  
        console.log('   🔧 Progressive Web App (PWA)');
        console.log('   📶 Offline Capability');
        console.log('   🔄 Service Synchronization');
    }
    
    async cleanup() {
        if (this.mobileProcess) {
            console.log('\\n🧹 Cleaning up...');
            this.mobileProcess.kill('SIGTERM');
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    httpRequest(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const req = http.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                timeout: 8000
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
    const tester = new MobileFunctionalityTest();
    await tester.runTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MobileFunctionalityTest };