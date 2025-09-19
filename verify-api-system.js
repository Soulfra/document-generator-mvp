#!/usr/bin/env node

/**
 * 🔍 API SYSTEM VERIFICATION SCRIPT
 * 
 * Tests the entire API debugging system with and without API keys
 * Verifies fallback mechanisms, error handling, and Ollama integration
 */

const axios = require('axios');
const colors = require('colors/safe');

class APISystemVerifier {
    constructor() {
        this.baseUrl = 'http://localhost:9500';
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }
    
    async runAllTests() {
        console.log(colors.bold.cyan('\n🔍 API System Verification Starting...\n'));
        
        // Check if service is running
        await this.testServiceRunning();
        
        // Check system status
        await this.testSystemStatus();
        
        // Test Ollama availability
        await this.testOllamaAvailability();
        
        // Test with small payload
        await this.testSmallPayload();
        
        // Test with large payload (previously causing 413 errors)
        await this.testLargePayload();
        
        // Test provider fallback
        await this.testProviderFallback();
        
        // Test error handling
        await this.testErrorHandling();
        
        // Display results
        this.displayResults();
    }
    
    async testServiceRunning() {
        const testName = 'Service Running';
        try {
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            if (response.data.status === 'healthy') {
                this.recordSuccess(testName, 'Service is healthy');
            } else {
                this.recordFailure(testName, 'Service returned unhealthy status');
            }
        } catch (error) {
            this.recordFailure(testName, `Service not accessible: ${error.message}`);
        }
    }
    
    async testSystemStatus() {
        const testName = 'System Status';
        try {
            const response = await axios.get(`${this.baseUrl}/api/status`);
            const data = response.data;
            
            console.log(colors.yellow(`\n📊 System Status:`));
            console.log(`  • Total Providers: ${data.systemHealth.totalProviders}`);
            console.log(`  • Healthy Providers: ${data.systemHealth.healthyProviders}`);
            console.log(`  • System Status: ${data.systemHealth.status}`);
            
            // Check for API keys
            const hasApiKeys = data.providers.some(p => 
                p.status === 'healthy' && p.id !== 'ollama'
            );
            
            if (!hasApiKeys) {
                console.log(colors.yellow('  ⚠️  No cloud API providers configured (missing API keys)'));
            }
            
            // Check Ollama
            const ollama = data.providers.find(p => p.id === 'ollama');
            if (ollama) {
                console.log(`  • Ollama Status: ${ollama.status}`);
            }
            
            this.recordSuccess(testName, 'Status endpoint working');
        } catch (error) {
            this.recordFailure(testName, `Status check failed: ${error.message}`);
        }
    }
    
    async testOllamaAvailability() {
        const testName = 'Ollama Availability';
        try {
            const response = await axios.get('http://localhost:11434/api/tags');
            const models = response.data.models || [];
            
            if (models.length > 0) {
                this.recordSuccess(testName, `Ollama running with ${models.length} models`);
                console.log(colors.green(`\n✅ Available Ollama models:`));
                models.slice(0, 5).forEach(m => console.log(`    • ${m.name}`));
            } else {
                this.recordFailure(testName, 'Ollama running but no models available');
            }
        } catch (error) {
            this.recordFailure(testName, 'Ollama not available - tests will use cloud APIs only');
        }
    }
    
    async testSmallPayload() {
        const testName = 'Small Payload Test';
        try {
            const response = await axios.post(`${this.baseUrl}/api/test`, {
                prompt: 'Say hello',
                taskType: 'general'
            });
            
            if (response.data.success && response.data.response) {
                this.recordSuccess(testName, `Provider ${response.data.provider} responded`);
            } else {
                this.recordFailure(testName, 'Invalid response format');
            }
        } catch (error) {
            this.recordFailure(testName, `Request failed: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async testLargePayload() {
        const testName = 'Large Payload Test (150KB)';
        try {
            const largeText = 'x'.repeat(150000); // 150KB
            const response = await axios.post(`${this.baseUrl}/api/test`, {
                prompt: `Process this text: ${largeText}`,
                taskType: 'general'
            });
            
            this.recordSuccess(testName, '150KB payload accepted (413 error fixed)');
        } catch (error) {
            if (error.response?.status === 413) {
                this.recordFailure(testName, '413 Payload Too Large - body parser limits not increased');
            } else {
                this.recordFailure(testName, `Request failed: ${error.response?.data?.error || error.message}`);
            }
        }
    }
    
    async testProviderFallback() {
        const testName = 'Provider Fallback';
        try {
            // Force a provider that will fail
            const response = await axios.post(`${this.baseUrl}/api/test`, {
                prompt: 'Test fallback mechanism',
                taskType: 'general',
                preferredProvider: 'nonexistent'
            });
            
            if (response.data.handoffHistory && response.data.handoffHistory.length > 0) {
                const history = response.data.handoffHistory[0];
                this.recordSuccess(testName, 
                    `Fallback worked - used ${response.data.provider} after ${history.attempts} attempts`
                );
            } else {
                this.recordSuccess(testName, `Request handled by ${response.data.provider}`);
            }
        } catch (error) {
            if (error.response?.data?.handoffHistory) {
                this.recordFailure(testName, 
                    `All providers failed after ${error.response.data.handoffHistory[0].attempts} attempts`
                );
            } else {
                this.recordFailure(testName, `Fallback test failed: ${error.message}`);
            }
        }
    }
    
    async testErrorHandling() {
        const testName = 'Error Handling';
        try {
            // Test with invalid provider
            await axios.post(`${this.baseUrl}/api/test/invalid-provider`, {
                prompt: 'Test error handling'
            });
            
            this.recordFailure(testName, 'Should have returned an error for invalid provider');
        } catch (error) {
            if (error.response && error.response.status >= 400) {
                this.recordSuccess(testName, 'Proper error response for invalid provider');
            } else {
                this.recordFailure(testName, `Unexpected error: ${error.message}`);
            }
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
        
        if (this.results.failed > 0) {
            console.log(colors.yellow('\n⚠️  Failed Tests:'));
            this.results.tests
                .filter(t => !t.passed)
                .forEach(t => console.log(colors.red(`    • ${t.name}: ${t.message}`)));
        }
        
        const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
        console.log(colors.bold(`\n📈 Success Rate: ${successRate}%\n`));
        
        // Recommendations
        if (this.results.failed === 0) {
            console.log(colors.green.bold('🎉 All tests passed! System is working properly.'));
        } else {
            console.log(colors.yellow.bold('💡 Recommendations:'));
            console.log('   1. Check if the AI debugging dashboard is running on port 9500');
            console.log('   2. Ensure Ollama is running if you want local AI support');
            console.log('   3. Add API keys to .env file for cloud provider support');
            console.log('   4. Check the dashboard logs for detailed error information');
        }
    }
}

// Run verification
async function main() {
    const verifier = new APISystemVerifier();
    
    try {
        await verifier.runAllTests();
    } catch (error) {
        console.error(colors.red(`\n❌ Verification failed: ${error.message}`));
        console.log(colors.yellow('\nMake sure the AI debugging dashboard is running:'));
        console.log('  ./launch-ai-debugging-dashboard.sh');
    }
}

// Check if colors module is available
try {
    require('colors/safe');
} catch {
    console.log('Installing required dependency: colors');
    require('child_process').execSync('npm install colors', { stdio: 'inherit' });
}

main().catch(console.error);