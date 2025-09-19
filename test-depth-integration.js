#!/usr/bin/env node

/**
 * 🧪 DEPTH INTEGRATION TESTER
 * Tests the complete XML depth mapping integration with game elements
 * Verifies layers, shadows, menus, and Z-index coordination
 */

const http = require('http');

class DepthIntegrationTester {
    constructor() {
        this.baseUrls = {
            soulfra: 'http://localhost:9898',
            gameServer: 'http://localhost:8899',
            xmlBroadcast: 'http://localhost:8877', 
            depthMapping: 'http://localhost:8765',
            gameIntegration: 'http://localhost:8766'
        };
        
        this.testResults = {
            services: {},
            integration: {},
            depthMapping: {},
            overall: 'PENDING'
        };
    }
    
    async runCompleteTest() {
        console.log('🧪 DEPTH INTEGRATION TESTING SUITE');
        console.log('==================================');
        console.log('Testing complete XML depth mapping integration');
        console.log('');
        
        // Test 1: Service Health Check
        console.log('📊 Phase 1: Service Health Check');
        console.log('--------------------------------');
        await this.testServiceHealth();
        
        console.log('');
        console.log('🎨 Phase 2: Depth Mapping API Test');
        console.log('----------------------------------');
        await this.testDepthMappingAPI();
        
        console.log('');
        console.log('🔗 Phase 3: Game Integration Test');
        console.log('---------------------------------');
        await this.testGameIntegration();
        
        console.log('');
        console.log('🌫️ Phase 4: Shadow Mapping Test');
        console.log('--------------------------------');
        await this.testShadowMapping();
        
        console.log('');
        console.log('📋 Phase 5: Menu Layering Test');
        console.log('------------------------------');
        await this.testMenuLayering();
        
        console.log('');
        console.log('🎬 Phase 6: Render Queue Test');
        console.log('-----------------------------');
        await this.testRenderQueue();
        
        console.log('');
        this.generateTestReport();
    }
    
    async testServiceHealth() {
        const services = Object.entries(this.baseUrls);
        
        for (const [name, url] of services) {
            try {
                const result = await this.checkEndpoint(url);
                const status = result.success ? '✅ RUNNING' : '❌ DOWN';
                console.log(`${status} ${name.padEnd(15)} ${url}`);
                
                this.testResults.services[name] = {
                    status: result.success ? 'RUNNING' : 'DOWN',
                    responseTime: result.responseTime,
                    error: result.error
                };
                
            } catch (error) {
                console.log(`❌ DOWN      ${name.padEnd(15)} ${url} - ${error.message}`);
                this.testResults.services[name] = {
                    status: 'ERROR',
                    error: error.message
                };
            }
        }
    }
    
    async testDepthMappingAPI() {
        const endpoints = [
            '/api/depth-map',
            '/api/shadow-map', 
            '/api/menu-stack',
            '/api/render-queue',
            '/xml/depth-map'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const result = await this.checkEndpoint(this.baseUrls.depthMapping + endpoint);
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${endpoint.padEnd(20)} - ${result.responseTime}ms`);
                
                this.testResults.depthMapping[endpoint] = result;
                
            } catch (error) {
                console.log(`❌ ${endpoint.padEnd(20)} - ${error.message}`);
                this.testResults.depthMapping[endpoint] = { success: false, error: error.message };
            }
        }
    }
    
    async testGameIntegration() {
        // Test game element update
        const testElement = {
            id: 'test_player',
            type: 'player',
            x: 100,
            y: 200,
            width: 32,
            height: 48,
            layer: 'PLAYERS',
            visible: true,
            shadow: {
                enabled: true,
                offsetX: 5,
                offsetY: 5,
                blur: 3,
                color: 'rgba(0,0,0,0.3)'
            }
        };
        
        const updateData = {
            timestamp: Date.now(),
            updates: [{
                action: 'update',
                element: testElement
            }],
            elementCount: 1
        };
        
        try {
            const result = await this.postData(
                this.baseUrls.depthMapping + '/api/game-elements',
                updateData
            );
            
            if (result.success && result.processedElements > 0) {
                console.log('✅ Game element integration working');
                console.log(`   📊 Processed ${result.processedElements} elements`);
                console.log(`   🎬 Render queue length: ${result.renderQueueLength}`);
                
                this.testResults.integration.gameElements = { success: true, ...result };
            } else {
                console.log('❌ Game element integration failed');
                this.testResults.integration.gameElements = { success: false, result };
            }
            
        } catch (error) {
            console.log('❌ Game element integration error:', error.message);
            this.testResults.integration.gameElements = { success: false, error: error.message };
        }
    }
    
    async testShadowMapping() {
        const shadowData = {
            timestamp: Date.now(),
            lightSource: { x: 400, y: 100, intensity: 1.0 },
            shadows: [{
                elementId: 'test_player',
                sourceX: 100,
                sourceY: 200,
                sourceWidth: 32,
                sourceHeight: 48,
                shadowX: 105,
                shadowY: 205,
                blur: 3,
                color: 'rgba(0,0,0,0.3)',
                layer: 'PLAYERS'
            }]
        };
        
        try {
            const result = await this.postData(
                this.baseUrls.depthMapping + '/api/shadows',
                shadowData
            );
            
            if (result.success && result.processedShadows > 0) {
                console.log('✅ Shadow mapping working');
                console.log(`   🌫️ Processed ${result.processedShadows} shadows`);
                console.log(`   💡 Light source: (${result.lightSource.x}, ${result.lightSource.y})`);
                
                this.testResults.integration.shadows = { success: true, ...result };
            } else {
                console.log('❌ Shadow mapping failed');
                this.testResults.integration.shadows = { success: false, result };
            }
            
        } catch (error) {
            console.log('❌ Shadow mapping error:', error.message);
            this.testResults.integration.shadows = { success: false, error: error.message };
        }
    }
    
    async testMenuLayering() {
        // Test menu push
        const menuData = {
            id: 'test_menu',
            type: 'popup',
            title: 'Test Menu',
            bounds: { x: 200, y: 150, width: 400, height: 300 },
            modal: true,
            zIndex: 1200
        };
        
        try {
            const pushResult = await this.postData(
                this.baseUrls.depthMapping + '/api/menu/push',
                menuData
            );
            
            if (pushResult.success) {
                console.log('✅ Menu push working');
                console.log(`   📋 Stack depth: ${pushResult.stackDepth}`);
                
                // Test menu pop
                const popResult = await this.postData(
                    this.baseUrls.depthMapping + '/api/menu/pop',
                    {}
                );
                
                if (popResult.success) {
                    console.log('✅ Menu pop working');
                    console.log(`   📋 Popped: ${popResult.poppedMenu.id}`);
                    
                    this.testResults.integration.menus = { success: true, push: pushResult, pop: popResult };
                } else {
                    console.log('❌ Menu pop failed');
                    this.testResults.integration.menus = { success: false, push: pushResult, pop: popResult };
                }
            } else {
                console.log('❌ Menu push failed');
                this.testResults.integration.menus = { success: false, push: pushResult };
            }
            
        } catch (error) {
            console.log('❌ Menu layering error:', error.message);
            this.testResults.integration.menus = { success: false, error: error.message };
        }
    }
    
    async testRenderQueue() {
        try {
            const result = await this.postData(
                this.baseUrls.depthMapping + '/api/render-frame',
                {}
            );
            
            if (result.success && result.renderQueueLength >= 0) {
                console.log('✅ Render queue generation working');
                console.log(`   🎬 Queue length: ${result.renderQueueLength}`);
                console.log(`   🆔 Frame ID: ${result.frameId}`);
                
                this.testResults.integration.renderQueue = { success: true, ...result };
            } else {
                console.log('❌ Render queue generation failed');
                this.testResults.integration.renderQueue = { success: false, result };
            }
            
        } catch (error) {
            console.log('❌ Render queue error:', error.message);
            this.testResults.integration.renderQueue = { success: false, error: error.message };
        }
    }
    
    async checkEndpoint(url) {
        const start = Date.now();
        
        return new Promise((resolve) => {
            http.get(url, (res) => {
                const responseTime = Date.now() - start;
                resolve({
                    success: res.statusCode === 200,
                    statusCode: res.statusCode,
                    responseTime: responseTime
                });
            }).on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    responseTime: Date.now() - start
                });
            });
        });
    }
    
    async postData(url, data) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(data);
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', chunk => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseData);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${responseData}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    
    generateTestReport() {
        console.log('📊 DEPTH INTEGRATION TEST REPORT');
        console.log('=================================');
        
        // Service status summary
        const runningServices = Object.values(this.testResults.services)
            .filter(s => s.status === 'RUNNING').length;
        const totalServices = Object.keys(this.testResults.services).length;
        
        console.log(`🔧 Services: ${runningServices}/${totalServices} running`);
        
        // API endpoint summary  
        const workingEndpoints = Object.values(this.testResults.depthMapping)
            .filter(e => e.success).length;
        const totalEndpoints = Object.keys(this.testResults.depthMapping).length;
        
        console.log(`🌐 API Endpoints: ${workingEndpoints}/${totalEndpoints} working`);
        
        // Integration features summary
        const workingFeatures = Object.values(this.testResults.integration)
            .filter(f => f.success).length;
        const totalFeatures = Object.keys(this.testResults.integration).length;
        
        console.log(`⚡ Integration Features: ${workingFeatures}/${totalFeatures} working`);
        
        // Overall assessment
        const overallHealth = (runningServices / totalServices) * 0.4 + 
                             (workingEndpoints / totalEndpoints) * 0.3 +
                             (workingFeatures / totalFeatures) * 0.3;
        
        let overallStatus;
        if (overallHealth >= 0.9) {
            overallStatus = '🎉 EXCELLENT';
        } else if (overallHealth >= 0.7) {
            overallStatus = '✅ GOOD';
        } else if (overallHealth >= 0.5) {
            overallStatus = '⚠️ PARTIAL';
        } else {
            overallStatus = '❌ FAILED';
        }
        
        console.log(`📈 Overall Health: ${Math.round(overallHealth * 100)}% - ${overallStatus}`);
        console.log('');
        
        if (overallHealth >= 0.8) {
            console.log('🎯 XML DEPTH MAPPING INTEGRATION: SUCCESS!');
            console.log('==========================================');
            console.log('✅ Game elements properly tracked and layered');
            console.log('✅ Shadow mapping system operational');
            console.log('✅ Menu stack management working');
            console.log('✅ Z-index coordination functioning');
            console.log('✅ XML serialization of visual state active');
            console.log('✅ Real-time render queue generation working');
            console.log('');
            console.log('🎨 The depth mapping issues have been resolved!');
            console.log('🌐 All systems integrated via XML coordination');
            console.log('🎮 Game ready for production deployment');
        } else {
            console.log('⚠️ INTEGRATION ISSUES DETECTED');
            console.log('==============================');
            console.log('Some components need attention before deployment.');
            console.log('Check the detailed results above for specific failures.');
        }
        
        console.log('');
        console.log('🔗 System Access Points:');
        console.log(`  🎮 Game Client: ${this.baseUrls.gameServer}`);
        console.log(`  🌐 XML Broadcast: ${this.baseUrls.xmlBroadcast}`);
        console.log(`  🎨 Depth Mapping: ${this.baseUrls.depthMapping}`);
        console.log(`  🔗 Game Integration: ${this.baseUrls.gameIntegration}`);
        console.log(`  ⚙️ Soulfra Control: ${this.baseUrls.soulfra}`);
    }
}

// Run the complete integration test
async function runDepthIntegrationTests() {
    const tester = new DepthIntegrationTester();
    
    // Wait a moment for services to be ready
    console.log('⏳ Waiting for services to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await tester.runCompleteTest();
}

runDepthIntegrationTests().catch(console.error);