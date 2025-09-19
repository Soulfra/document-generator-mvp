#!/usr/bin/env node

// 🏥⚡ QUICK HEALTH CHECK
// Fast verification that everything is running properly
// Use this for quick status checks

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

class QuickHealthCheck {
    constructor() {
        this.checks = [];
        this.results = {};
        
        console.log('🏥⚡ QUICK HEALTH CHECK STARTING...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    async runQuickCheck() {
        const startTime = Date.now();
        
        // Quick file existence check
        await this.checkFiles();
        
        // Quick service availability check
        await this.checkServices();
        
        // Quick functionality test
        await this.quickFunctionTest();
        
        const duration = Date.now() - startTime;
        this.generateQuickReport(duration);
    }
    
    async checkFiles() {
        console.log('📁 Checking files...');
        
        const criticalFiles = [
            'deep-tier-api-router.js',
            'jarvis-deep-tier-hud.js'
        ];
        
        let filesOk = 0;
        for (const file of criticalFiles) {
            const exists = fs.existsSync(file);
            this.results[`file_${file}`] = exists ? '✅' : '❌';
            if (exists) filesOk++;
            
            console.log(`  ${this.results[`file_${file}`]} ${file}`);
        }
        
        this.results.filesStatus = filesOk === criticalFiles.length ? 'all_good' : 'missing_files';
    }
    
    async checkServices() {
        console.log('🚀 Checking services...');
        
        const services = [
            { name: 'Deep Tier Router', port: 9200, key: 'deepTierRouter' },
            { name: 'JARVIS HUD', port: 9300, key: 'jarvisHUD' },
            { name: 'JARVIS WebSocket', port: 9301, key: 'jarvisWS', type: 'ws' }
        ];
        
        for (const service of services) {
            try {
                if (service.type === 'ws') {
                    const result = await this.quickWSTest(service.port);
                    this.results[service.key] = result ? '✅' : '❌';
                } else {
                    const result = await this.quickHTTPTest(service.port);
                    this.results[service.key] = result ? '✅' : '❌';
                }
                console.log(`  ${this.results[service.key]} ${service.name} (${service.port})`);
            } catch (error) {
                this.results[service.key] = '❌';
                console.log(`  ❌ ${service.name} - ${error.message}`);
            }
        }
    }
    
    async quickHTTPTest(port) {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}`, (res) => {
                resolve(res.statusCode < 400);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(2000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }
    
    async quickWSTest(port) {
        return new Promise((resolve) => {
            const ws = new WebSocket(`ws://localhost:${port}`);
            
            ws.on('open', () => {
                ws.close();
                resolve(true);
            });
            
            ws.on('error', () => resolve(false));
            
            setTimeout(() => {
                if (ws.readyState !== WebSocket.CLOSED) {
                    ws.terminate();
                }
                resolve(false);
            }, 2000);
        });
    }
    
    async quickFunctionTest() {
        console.log('🔧 Quick function test...');
        
        try {
            // Test tier calculation API
            const testResult = await this.testTierAPI();
            this.results.tierAPI = testResult ? '✅' : '❌';
            console.log(`  ${this.results.tierAPI} Tier calculation API`);
        } catch (error) {
            this.results.tierAPI = '❌';
            console.log(`  ❌ Tier API - ${error.message}`);
        }
    }
    
    async testTierAPI() {
        return new Promise((resolve) => {
            const postData = JSON.stringify({
                userId: 'health_check',
                metrics: { systemsBuilt: 5 }
            });
            
            const options = {
                hostname: 'localhost',
                port: 9200,
                path: '/api/calculate-tier',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(!!response.tier);
                    } catch (e) {
                        resolve(false);
                    }
                });
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
            
            req.write(postData);
            req.end();
        });
    }
    
    generateQuickReport(duration) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏥 QUICK HEALTH CHECK RESULTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Count successes
        const total = Object.keys(this.results).length;
        const successes = Object.values(this.results).filter(r => r === '✅').length;
        const healthPercentage = Math.round((successes / total) * 100);
        
        // Overall status
        let overallStatus;
        let statusEmoji;
        
        if (healthPercentage >= 90) {
            overallStatus = 'EXCELLENT';
            statusEmoji = '🟢';
        } else if (healthPercentage >= 70) {
            overallStatus = 'GOOD';
            statusEmoji = '🟡';
        } else if (healthPercentage >= 50) {
            overallStatus = 'DEGRADED';
            statusEmoji = '🟠';
        } else {
            overallStatus = 'CRITICAL';
            statusEmoji = '🔴';
        }
        
        console.log(`${statusEmoji} OVERALL: ${overallStatus} (${healthPercentage}%)`);
        console.log(`⏱️ Check completed in ${duration}ms`);
        console.log();
        
        // Service status summary
        console.log('🚀 SERVICES:');
        console.log(`  ${this.results.deepTierRouter || '❓'} Deep Tier Router (9200)`);
        console.log(`  ${this.results.jarvisHUD || '❓'} JARVIS HUD (9300)`);
        console.log(`  ${this.results.jarvisWS || '❓'} JARVIS WebSocket (9301)`);
        console.log(`  ${this.results.tierAPI || '❓'} Tier API Functionality`);
        console.log();
        
        // Quick access URLs
        if (this.results.deepTierRouter === '✅' || this.results.jarvisHUD === '✅') {
            console.log('🌐 QUICK ACCESS:');
            if (this.results.deepTierRouter === '✅') {
                console.log('  🌊 Deep Tier Router: http://localhost:9200');
            }
            if (this.results.jarvisHUD === '✅') {
                console.log('  🤖 JARVIS HUD: http://localhost:9300');
            }
            console.log();
        }
        
        // Recommendations
        console.log('💡 RECOMMENDATIONS:');
        if (overallStatus === 'EXCELLENT') {
            console.log('  🎉 All systems operational!');
            console.log('  🚀 Ready for production use');
        } else {
            console.log('  🔧 Some issues detected:');
            
            if (this.results.deepTierRouter === '❌') {
                console.log('    • Start Deep Tier Router: node deep-tier-api-router.js');
            }
            if (this.results.jarvisHUD === '❌') {
                console.log('    • Start JARVIS HUD: node jarvis-deep-tier-hud.js');
            }
            if (this.results.tierAPI === '❌') {
                console.log('    • Check API functionality and dependencies');
            }
            
            console.log('    • Run full verification: node verify-deep-tier-system.js');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        return overallStatus;
    }
}

// Command line execution
if (require.main === module) {
    const healthCheck = new QuickHealthCheck();
    
    healthCheck.runQuickCheck()
        .then(() => {
            console.log('✅ Quick health check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('🚨 Health check failed:', error);
            process.exit(1);
        });
}

module.exports = QuickHealthCheck;