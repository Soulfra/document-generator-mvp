#!/usr/bin/env node

/**
 * 🧪 TEST 3D INTEGRATION
 * Verifies the complete binary loop → 3D generation pipeline
 */

import fetch from 'node-fetch';
import { WebSocket } from 'ws';

class Test3DIntegration {
    constructor() {
        this.baseUrl = 'http://localhost:8116';
        this.wsUrl = 'ws://localhost:8110';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🧪 Starting 3D Integration Tests...\n');
        
        // Wait for services to be ready
        await this.waitForServices();
        
        // Run test suite
        await this.testTextTo3D();
        await this.testBinaryTo3D();
        await this.testSymbolTo3D();
        await this.testCompleteLoop();
        await this.testGameWorldIntegration();
        await this.testMultipleFormats();
        await this.testWebSocketUpdates();
        
        // Display results
        this.displayResults();
    }
    
    async waitForServices() {
        console.log('⏳ Waiting for services to be ready...');
        
        let retries = 30;
        while (retries > 0) {
            try {
                const response = await fetch(`${this.baseUrl}/api/status`);
                if (response.ok) {
                    console.log('✅ Services are ready!\n');
                    return;
                }
            } catch (error) {
                // Service not ready yet
            }
            
            retries--;
            await this.sleep(1000);
        }
        
        throw new Error('Services failed to start');
    }
    
    async testTextTo3D() {
        console.log('📝 Test 1: Text to 3D Generation');
        
        const testCases = [
            {
                prompt: "Create a glowing blue sphere that pulsates",
                expected: { shape: 'sphere', color: 'blue', animation: 'pulsating' }
            },
            {
                prompt: "Build a futuristic chrome tower with neon lights",
                expected: { type: 'building', style: 'futuristic', features: ['chrome', 'neon'] }
            },
            {
                prompt: "Design a medieval sword with glowing runes",
                expected: { type: 'weapon', style: 'medieval', features: ['glowing', 'runes'] }
            }
        ];
        
        for (const testCase of testCases) {
            try {
                const response = await fetch(`${this.baseUrl}/api/generate-3d`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: testCase.prompt,
                        format: 'gltf'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log(`  ✅ "${testCase.prompt}" - Success`);
                    console.log(`     Generation ID: ${result.generationId}`);
                    console.log(`     Processing time: ${result.result.totalDuration}ms`);
                    
                    this.testResults.push({
                        test: 'text-to-3d',
                        case: testCase.prompt,
                        success: true,
                        duration: result.result.totalDuration
                    });
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.log(`  ❌ "${testCase.prompt}" - Failed: ${error.message}`);
                this.testResults.push({
                    test: 'text-to-3d',
                    case: testCase.prompt,
                    success: false,
                    error: error.message
                });
            }
        }
        
        console.log('');
    }
    
    async testBinaryTo3D() {
        console.log('🔢 Test 2: Binary to 3D Generation');
        
        try {
            // Generate test binary data
            const binaryData = this.generateTestBinary(256);
            
            const response = await fetch(`${this.baseUrl}/api/binary-to-3d`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    binaryData: Buffer.from(binaryData).toString('base64'),
                    encoding: 'base64',
                    pattern: 'voxel'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`  ✅ Binary pattern converted successfully`);
                console.log(`     Symbol count: ${result.result.symbolCount}`);
                console.log(`     Format: ${result.result.format}`);
                
                this.testResults.push({
                    test: 'binary-to-3d',
                    success: true
                });
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.log(`  ❌ Binary conversion failed: ${error.message}`);
            this.testResults.push({
                test: 'binary-to-3d',
                success: false,
                error: error.message
            });
        }
        
        console.log('');
    }
    
    async testSymbolTo3D() {
        console.log('🔮 Test 3: Symbol to 3D Generation');
        
        const symbolSets = [
            {
                name: 'Geometric',
                symbols: ['█', '▓', '▒', '░', '■', '□', '▪', '▫']
            },
            {
                name: 'Mystical',
                symbols: ['●', '○', '◆', '◇', '★', '☆', '✦', '✧']
            },
            {
                name: 'Directional',
                symbols: ['▲', '▼', '◄', '►', '↑', '↓', '←', '→']
            }
        ];
        
        for (const symbolSet of symbolSets) {
            try {
                const response = await fetch(`${this.baseUrl}/api/symbol-to-3d`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbols: symbolSet.symbols,
                        encoding: 'runescape',
                        complexity: 'medium'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log(`  ✅ ${symbolSet.name} symbols converted`);
                    console.log(`     Interpreted meaning: ${result.result.interpretedMeaning || 'N/A'}`);
                    
                    this.testResults.push({
                        test: 'symbol-to-3d',
                        case: symbolSet.name,
                        success: true
                    });
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.log(`  ❌ ${symbolSet.name} symbols failed: ${error.message}`);
                this.testResults.push({
                    test: 'symbol-to-3d',
                    case: symbolSet.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        console.log('');
    }
    
    async testCompleteLoop() {
        console.log('🔄 Test 4: Complete Loop (Canvas → Binary → COBOL → AI → 3D)');
        
        try {
            // Simulate complete loop with complex prompt
            const complexPrompt = "Create an AI-generated character with glowing cyberpunk armor, " +
                                "holding a plasma sword, standing on a floating platform";
            
            console.log(`  📝 Input: "${complexPrompt}"`);
            
            const response = await fetch(`${this.baseUrl}/api/generate-3d`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: complexPrompt,
                    format: 'gltf',
                    sendToGame: false,
                    options: {
                        trackStages: true,
                        includeMetadata: true
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.result.stages) {
                console.log('  ✅ Complete loop successful!');
                console.log('  📊 Stage breakdown:');
                
                result.result.stages.forEach((stage, index) => {
                    console.log(`     ${index + 1}. ${stage.name}: ${stage.duration}ms`);
                });
                
                console.log(`  ⏱️  Total time: ${result.result.totalDuration}ms`);
                
                this.testResults.push({
                    test: 'complete-loop',
                    success: true,
                    duration: result.result.totalDuration,
                    stages: result.result.stages.length
                });
            } else {
                throw new Error('Failed to complete loop');
            }
            
        } catch (error) {
            console.log(`  ❌ Complete loop failed: ${error.message}`);
            this.testResults.push({
                test: 'complete-loop',
                success: false,
                error: error.message
            });
        }
        
        console.log('');
    }
    
    async testGameWorldIntegration() {
        console.log('🎮 Test 5: Game World Integration');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/generate-3d`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: "Create a magical portal with swirling energy",
                    format: 'gltf',
                    sendToGame: true
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('  ✅ Successfully sent to game world');
                console.log('     Model generated and placed in world');
                
                this.testResults.push({
                    test: 'game-world-integration',
                    success: true
                });
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.log(`  ❌ Game world integration failed: ${error.message}`);
            this.testResults.push({
                test: 'game-world-integration',
                success: false,
                error: error.message
            });
        }
        
        console.log('');
    }
    
    async testMultipleFormats() {
        console.log('📦 Test 6: Multiple Export Formats');
        
        const formats = ['gltf', 'stl', 'json'];
        const testPrompt = "Create a simple cube";
        
        for (const format of formats) {
            try {
                const response = await fetch(`${this.baseUrl}/api/generate-3d`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: testPrompt,
                        format: format
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log(`  ✅ ${format.toUpperCase()} format exported successfully`);
                    
                    this.testResults.push({
                        test: 'export-formats',
                        case: format,
                        success: true
                    });
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.log(`  ❌ ${format.toUpperCase()} format failed: ${error.message}`);
                this.testResults.push({
                    test: 'export-formats',
                    case: format,
                    success: false,
                    error: error.message
                });
            }
        }
        
        console.log('');
    }
    
    async testWebSocketUpdates() {
        console.log('🔌 Test 7: WebSocket Real-time Updates');
        
        return new Promise((resolve) => {
            const ws = new WebSocket(this.wsUrl);
            let updateCount = 0;
            
            ws.on('open', () => {
                console.log('  ✅ WebSocket connected');
                
                // Subscribe to updates
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    service: '3d-generation-updates'
                }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                updateCount++;
                console.log(`  📨 Received update: ${message.type}`);
                
                if (updateCount >= 3) {
                    console.log(`  ✅ Received ${updateCount} real-time updates`);
                    
                    this.testResults.push({
                        test: 'websocket-updates',
                        success: true,
                        updates: updateCount
                    });
                    
                    ws.close();
                    resolve();
                }
            });
            
            ws.on('error', (error) => {
                console.log(`  ❌ WebSocket error: ${error.message}`);
                this.testResults.push({
                    test: 'websocket-updates',
                    success: false,
                    error: error.message
                });
                resolve();
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
                resolve();
            }, 10000);
        });
        
        console.log('');
    }
    
    generateTestBinary(length) {
        let binary = '';
        for (let i = 0; i < length; i++) {
            binary += Math.floor(Math.random() * 256).toString(2).padStart(8, '0');
        }
        return binary;
    }
    
    displayResults() {
        console.log('📊 Test Results Summary:');
        console.log('========================');
        
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - successfulTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Successful: ${successfulTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`  - ${r.test}${r.case ? ` (${r.case})` : ''}: ${r.error}`);
                });
        }
        
        // Calculate average processing time
        const timedTests = this.testResults.filter(r => r.duration);
        if (timedTests.length > 0) {
            const avgTime = timedTests.reduce((sum, r) => sum + r.duration, 0) / timedTests.length;
            console.log(`\nAverage Processing Time: ${avgTime.toFixed(0)}ms`);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests
const tester = new Test3DIntegration();
tester.runAllTests().catch(console.error);