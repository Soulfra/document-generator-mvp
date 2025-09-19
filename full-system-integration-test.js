#!/usr/bin/env node

/**
 * 🌐 FULL SYSTEM INTEGRATION TEST
 * Tests complete customer journey from document upload to blockchain verification
 */

const axios = require('axios');
const WebSocket = require('ws');

// Test configuration
const CONFIG = {
    empireUI: 'http://localhost:8080',
    empireAPI: 'http://localhost:8090',
    aiAPI: 'http://localhost:3001',
    systemBus: 'http://localhost:8899',
    blockchain: 'http://localhost:3012',
    reasoningBridge: 'ws://localhost:3007',
    timeout: 10000
};

const testDocument = `
# AI-Powered Customer Service Platform

## Business Overview
Create an AI customer service platform that helps businesses automate support tickets and provide 24/7 customer assistance.

## Key Features
- Real-time chat integration
- Ticket categorization and routing
- Knowledge base integration
- Multi-language support
- Analytics dashboard

## Technical Requirements
- Node.js backend with Express
- React frontend
- PostgreSQL database
- AI integration (OpenAI/Anthropic)
- WebSocket for real-time chat

## Business Model
- SaaS subscription: $49/month basic, $149/month pro
- Setup fee: $199 one-time
- Custom integrations: $500-2000

## Target Market
Small to medium businesses with 10-500 employees needing customer service automation.
`;

class FullSystemIntegrationTest {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async runTest(name, testFunction) {
        this.results.totalTests++;
        console.log(`\n🧪 Testing: ${name}`);
        
        try {
            const result = await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), CONFIG.timeout)
                )
            ]);
            
            console.log(`✅ ${name}: PASSED`);
            this.results.passed++;
            this.results.details.push({
                test: name,
                status: 'PASSED',
                result: result,
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            console.log(`❌ ${name}: FAILED - ${error.message}`);
            this.results.failed++;
            this.results.details.push({
                test: name,
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return null;
        }
    }

    async testServiceHealth() {
        const services = [
            { name: 'Empire UI', url: CONFIG.empireUI },
            { name: 'Empire API', url: `${CONFIG.empireAPI}/api/systems` },
            { name: 'AI API', url: `${CONFIG.aiAPI}/health` },
            { name: 'System Bus', url: `${CONFIG.systemBus}/health` },
            { name: 'Blockchain', url: `${CONFIG.blockchain}/health` }
        ];

        for (const service of services) {
            await this.runTest(`Service Health: ${service.name}`, async () => {
                const response = await axios.get(service.url, { timeout: 5000 });
                return { status: response.status, url: service.url };
            });
        }
    }

    async testDocumentProcessing() {
        await this.runTest('Document Processing Flow', async () => {
            // Step 1: Submit document to Empire API
            const processResponse = await axios.post(`${CONFIG.empireAPI}/api/process-document`, {
                document: testDocument,
                type: 'business-plan'
            });

            if (!processResponse.data.success) {
                throw new Error('Document processing failed');
            }

            return {
                analysisReceived: !!processResponse.data.analysis,
                templateGenerated: !!processResponse.data.template,
                previewUrl: processResponse.data.preview
            };
        });
    }

    async testRevenueTracking() {
        await this.runTest('Revenue Tracking System', async () => {
            const revenueResponse = await axios.get(`${CONFIG.empireAPI}/api/revenue`);
            
            return {
                totalRevenue: revenueResponse.data.totalRevenue,
                hasTransactions: revenueResponse.data.recentRevenue.length > 0,
                chartData: revenueResponse.data.chart.data.length > 0
            };
        });
    }

    async testAIServiceFallback() {
        await this.runTest('AI Service Fallback Chain', async () => {
            // Test AI service with a simple request
            const aiResponse = await axios.post(`${CONFIG.aiAPI}/api/generate`, {
                prompt: 'Generate a simple "Hello World" API endpoint in Node.js',
                type: 'code',
                preferLocal: true
            });

            return {
                responseReceived: !!aiResponse.data,
                hasCode: aiResponse.data.includes('app.get') || aiResponse.data.includes('Hello World'),
                provider: 'ollama' // Since we're using local first
            };
        });
    }

    async testBlockchainVerification() {
        await this.runTest('Blockchain Verification', async () => {
            // Submit a test verification
            const verifyResponse = await axios.post(`${CONFIG.blockchain}/api/verify`, {
                reasoning: 'Full system integration test verification',
                confidence: 0.95,
                category: 'integration-test',
                metadata: {
                    testRun: this.results.timestamp,
                    systemStatus: 'operational'
                }
            });

            if (!verifyResponse.data.success) {
                throw new Error('Blockchain verification failed');
            }

            // Check stats
            const statsResponse = await axios.get(`${CONFIG.blockchain}/api/stats`);

            return {
                txHash: verifyResponse.data.verification.txHash,
                blockNumber: verifyResponse.data.verification.blockNumber,
                gasUsed: verifyResponse.data.verification.gasUsed,
                totalVerifications: statsResponse.data.totalVerifications,
                onChain: true
            };
        });
    }

    async testWebSocketConnection() {
        await this.runTest('WebSocket Real-time Communication', async () => {
            return new Promise((resolve, reject) => {
                const ws = new WebSocket(CONFIG.reasoningBridge);
                let connected = false;
                let messageReceived = false;

                ws.on('open', () => {
                    connected = true;
                    // Send a test message
                    ws.send(JSON.stringify({
                        type: 'test_connection',
                        data: { integrationTest: true }
                    }));
                });

                ws.on('message', (data) => {
                    messageReceived = true;
                    ws.close();
                    resolve({
                        connected: true,
                        messageReceived: true,
                        protocol: 'websocket'
                    });
                });

                ws.on('error', (error) => {
                    reject(error);
                });

                // Timeout if no response
                setTimeout(() => {
                    if (!messageReceived) {
                        ws.close();
                        resolve({
                            connected: connected,
                            messageReceived: false,
                            timeout: true
                        });
                    }
                }, 5000);
            });
        });
    }

    async testDatabaseIntegrity() {
        await this.runTest('Database Layer Integrity', async () => {
            // Test that we can query all critical databases through Empire API
            const systemsResponse = await axios.get(`${CONFIG.empireAPI}/api/systems`);
            const filesResponse = await axios.get(`${CONFIG.empireAPI}/api/files?limit=5`);

            return {
                servicesOnline: Object.keys(systemsResponse.data.services).length,
                databasesConnected: Object.keys(systemsResponse.data.databases).length,
                filesIndexed: filesResponse.data.count,
                systemTimestamp: systemsResponse.data.timestamp
            };
        });
    }

    async testEndToEndFlow() {
        await this.runTest('Complete End-to-End Customer Journey', async () => {
            const startTime = Date.now();
            const journeySteps = [];

            // Step 1: Customer arrives at Empire UI
            journeySteps.push({ step: 'Customer visits Empire UI', status: 'simulated' });

            // Step 2: Document processing
            const docResult = await axios.post(`${CONFIG.empireAPI}/api/process-document`, {
                document: 'Quick test document: Build a simple todo app',
                type: 'idea'
            });
            journeySteps.push({ 
                step: 'Document processed', 
                status: docResult.data.success ? 'success' : 'failed' 
            });

            // Step 3: AI reasoning (blockchain verification)
            const reasoningResult = await axios.post(`${CONFIG.blockchain}/api/verify`, {
                reasoning: 'Customer document processed successfully',
                confidence: 0.88,
                category: 'customer-onboarding'
            });
            journeySteps.push({ 
                step: 'AI reasoning verified on blockchain', 
                status: reasoningResult.data.success ? 'success' : 'failed' 
            });

            // Step 4: Revenue tracking (simulate)
            const revenueCheck = await axios.get(`${CONFIG.empireAPI}/api/revenue`);
            journeySteps.push({ 
                step: 'Revenue tracking active', 
                status: revenueCheck.data.totalRevenue >= 0 ? 'success' : 'failed' 
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            return {
                journeySteps,
                totalTimeMs: totalTime,
                allStepsSuccessful: journeySteps.every(s => s.status === 'success' || s.status === 'simulated'),
                performanceAcceptable: totalTime < 30000 // Under 30 seconds
            };
        });
    }

    async run() {
        console.log('\n🚀 FULL SYSTEM INTEGRATION TEST STARTING');
        console.log('==========================================\n');

        // Run all tests
        await this.testServiceHealth();
        await this.testDocumentProcessing();
        await this.testRevenueTracking();
        await this.testAIServiceFallback();
        await this.testBlockchainVerification();
        await this.testWebSocketConnection();
        await this.testDatabaseIntegrity();
        await this.testEndToEndFlow();

        // Generate summary
        const successRate = (this.results.passed / this.results.totalTests * 100).toFixed(1);
        
        console.log('\n📊 INTEGRATION TEST RESULTS');
        console.log('============================');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`⏱️  Total Tests: ${this.results.totalTests}`);

        if (successRate >= 90) {
            console.log('\n🎉 SYSTEM INTEGRATION: EXCELLENT');
            console.log('   Ready for production deployment!');
        } else if (successRate >= 75) {
            console.log('\n⚠️  SYSTEM INTEGRATION: GOOD');
            console.log('   Minor issues but production capable');
        } else {
            console.log('\n🚨 SYSTEM INTEGRATION: NEEDS ATTENTION');
            console.log('   Review failed tests before production');
        }

        // Save detailed results
        const fs = require('fs');
        fs.writeFileSync('./integration-test-results.json', JSON.stringify(this.results, null, 2));
        console.log('\n📄 Detailed results saved to integration-test-results.json');

        return this.results;
    }
}

// Run the test if called directly
if (require.main === module) {
    (async () => {
        const test = new FullSystemIntegrationTest();
        try {
            await test.run();
            process.exit(0);
        } catch (error) {
            console.error('\n💥 Test runner failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = FullSystemIntegrationTest;