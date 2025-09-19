#!/usr/bin/env node

/**
 * TEST GAMING AI INTEGRATION
 * Verifies that gaming data flows to AI training backend
 */

const axios = require('axios');
const colors = require('colors');

class GamingAIIntegrationTest {
    constructor() {
        this.endpoints = {
            aiDebugDashboard: 'http://localhost:9500',
            carrotRL: 'http://localhost:9900',
            gamingAIBridge: 'http://localhost:9901',
            debugGame: 'http://localhost:8500',
            gachaToken: 'http://localhost:7300',
            masterGaming: 'http://localhost:8800'
        };
        
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }
    
    async runTests() {
        console.log(colors.bold.cyan('\n🎮 Gaming AI Integration Test Suite\n'));
        
        // Test 1: Check AI Debug Dashboard
        await this.testService('AI Debug Dashboard', this.endpoints.aiDebugDashboard + '/api/status');
        
        // Test 2: Check Gaming AI Bridge
        await this.testService('Gaming AI Bridge', this.endpoints.gamingAIBridge + '/health');
        
        // Test 3: Simulate game event
        await this.testGameEvent();
        
        // Test 3: Check if Carrot RL received data
        await this.testCarrotRLIntegration();
        
        // Test 4: Test Ollama integration
        await this.testOllamaProcessing();
        
        // Display results
        this.displayResults();
    }
    
    async testService(name, url) {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            this.recordSuccess(name, 'Service is running');
            return true;
        } catch (error) {
            this.recordFailure(name, `Service not accessible: ${error.code || error.message}`);
            return false;
        }
    }
    
    async testGameEvent() {
        const testName = 'Game Event Processing';
        try {
            // Simulate a game event
            const gameEvent = {
                type: 'bug_fixed',
                playerId: 'test-player-123',
                bugType: 'memory_leak',
                fixTime: 45.2,
                reward: 500,
                timestamp: new Date().toISOString()
            };
            
            // Send to AI debug dashboard
            const response = await axios.post(
                `${this.endpoints.aiDebugDashboard}/api/test`,
                {
                    prompt: `Process game event: Player fixed ${gameEvent.bugType} in ${gameEvent.fixTime} seconds`,
                    metadata: gameEvent,
                    taskType: 'game-analysis'
                }
            );
            
            if (response.data.success) {
                this.recordSuccess(testName, `Game event processed by ${response.data.provider}`);
            } else {
                this.recordFailure(testName, 'Game event processing failed');
            }
        } catch (error) {
            this.recordFailure(testName, `Error: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async testCarrotRLIntegration() {
        const testName = 'Carrot RL Integration';
        try {
            // Check if Carrot RL system is accessible
            const response = await axios.get(`${this.endpoints.carrotRL}/api/status`, {
                timeout: 5000
            });
            
            if (response.data) {
                this.recordSuccess(testName, 'Carrot RL system is accessible');
                
                // Test sending performance data
                const performanceData = {
                    service: 'debug-game',
                    metric: 'player_engagement',
                    value: 0.85,
                    timestamp: Date.now()
                };
                
                await axios.post(`${this.endpoints.gamingAIBridge}/api/performance`, performanceData);
                this.recordSuccess(testName + ' - Data Flow', 'Performance data sent successfully');
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                this.recordFailure(testName, 'Carrot RL not running on port 9900');
            } else {
                this.recordFailure(testName, `Error: ${error.message}`);
            }
        }
    }
    
    async testOllamaProcessing() {
        const testName = 'Ollama AI Processing';
        try {
            // Use the AI debug dashboard to test Ollama
            const response = await axios.post(
                `${this.endpoints.gamingAIBridge}/api/test/ollama`,
                {
                    prompt: 'Generate a reward message for a player who fixed 5 bugs',
                    temperature: 0.7
                }
            );
            
            if (response.data.success) {
                this.recordSuccess(testName, 'Ollama processed game-related prompt');
                console.log(colors.gray(`   Response preview: ${response.data.response.substring(0, 100)}...`));
            } else {
                this.recordFailure(testName, 'Ollama processing failed');
            }
        } catch (error) {
            this.recordFailure(testName, `Error: ${error.response?.data?.error || error.message}`);
        }
    }
    
    recordSuccess(testName, message) {
        this.results.passed++;
        this.results.tests.push({ name: testName, passed: true, message });
        console.log(colors.green(`✅ ${testName}: ${message}`));
    }
    
    recordFailure(testName, message) {
        this.results.failed++;
        this.results.tests.push({ name: testName, passed: false, message });
        console.log(colors.red(`❌ ${testName}: ${message}`));
    }
    
    displayResults() {
        console.log(colors.bold.cyan('\n📊 Test Results Summary\n'));
        console.log(colors.green(`  ✅ Passed: ${this.results.passed}`));
        console.log(colors.red(`  ❌ Failed: ${this.results.failed}`));
        console.log(`  📋 Total Tests: ${this.results.tests.length}`);
        
        const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
        console.log(colors.bold(`\n📈 Success Rate: ${successRate}%\n`));
        
        // Next steps
        console.log(colors.yellow.bold('🚀 Next Steps:'));
        if (this.results.failed > 0) {
            console.log('   1. Start missing services:');
            console.log('      - Carrot RL: node carrot-reinforcement-learning-system.js');
            console.log('      - Debug Game: node debug-game-visualizer.js');
            console.log('   2. Check service logs for errors');
            console.log('   3. Verify port availability');
        } else {
            console.log('   1. Gaming → AI integration is working!');
            console.log('   2. Start your games to begin training');
            console.log('   3. Monitor the AI debugging dashboard');
            console.log('   4. Check Carrot RL rewards');
        }
    }
}

// Run tests
async function main() {
    const tester = new GamingAIIntegrationTest();
    
    try {
        await tester.runTests();
    } catch (error) {
        console.error(colors.red(`\n❌ Test suite failed: ${error.message}`));
    }
}

// Check if colors module is available
const checkDependencies = async () => {
    try {
        require('colors');
    } catch {
        console.log('Installing required dependency: colors');
        require('child_process').execSync('npm install colors', { stdio: 'inherit' });
    }
};

checkDependencies().then(() => {
    main().catch(console.error);
});