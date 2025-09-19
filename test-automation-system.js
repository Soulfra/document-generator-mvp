#!/usr/bin/env node

/**
 * Test script for the AI automation system
 * 
 * Validates that all components are working correctly
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, execSync } = require('child_process');

class AutomationSystemTester {
    constructor() {
        this.testResults = [];
        this.failedTests = 0;
        this.passedTests = 0;
    }
    
    async runAllTests() {
        console.log('🧪 Testing AI Automation System');
        console.log('================================\n');
        
        // Test each component
        await this.testOllama();
        await this.testGitOrchestrator();
        await this.testCodeTransformer();
        await this.testSmartTagging();
        await this.testWorkflowTemplates();
        await this.testIntegrationHub();
        
        // Print summary
        this.printSummary();
    }
    
    async test(name, fn) {
        console.log(`\n📋 Testing: ${name}`);
        console.log('-'.repeat(40));
        
        try {
            await fn();
            this.passedTests++;
            this.testResults.push({ name, status: 'PASSED', error: null });
            console.log(`✅ ${name}: PASSED`);
        } catch (error) {
            this.failedTests++;
            this.testResults.push({ name, status: 'FAILED', error: error.message });
            console.error(`❌ ${name}: FAILED`);
            console.error(`   Error: ${error.message}`);
        }
    }
    
    async testOllama() {
        await this.test('Ollama Connectivity', async () => {
            const response = await fetch('http://localhost:11434/api/tags');
            if (!response.ok) {
                throw new Error('Ollama is not running or accessible');
            }
            
            const data = await response.json();
            console.log(`   Found ${data.models?.length || 0} models`);
            
            // Check for required models
            const requiredModels = ['codellama:7b'];
            const modelNames = data.models?.map(m => m.name) || [];
            
            for (const required of requiredModels) {
                if (!modelNames.some(name => name.includes(required))) {
                    throw new Error(`Required model ${required} not found`);
                }
            }
        });
    }
    
    async testGitOrchestrator() {
        await this.test('AI Git Orchestrator', async () => {
            // Check if file exists
            const filePath = path.join(__dirname, 'ai-git-orchestrator.js');
            await fs.access(filePath);
            
            // Test dry run
            const output = execSync('node ai-git-orchestrator.js --dry-run', {
                encoding: 'utf8',
                timeout: 5000
            });
            
            if (!output.includes('AI Git Orchestrator')) {
                throw new Error('Git orchestrator not starting correctly');
            }
            
            console.log('   Git orchestrator initialized successfully');
        });
    }
    
    async testCodeTransformer() {
        await this.test('Code Transformer Pipeline', async () => {
            // Create test file
            const testFile = path.join(__dirname, 'test-transform.js');
            const testCode = `
function x(a, b) {
    var res = a + b;
    return res;
}
            `.trim();
            
            await fs.writeFile(testFile, testCode);
            
            try {
                // Test transformation
                const output = execSync(
                    `node code-transformer-pipeline.js ${testFile} --dry-run`,
                    { encoding: 'utf8', timeout: 10000 }
                );
                
                console.log('   Code transformer executed successfully');
                
            } finally {
                // Cleanup
                await fs.unlink(testFile).catch(() => {});
            }
        });
    }
    
    async testSmartTagging() {
        await this.test('Smart Tagging System', async () => {
            // Test analysis
            const output = execSync('node smart-tagging-system.js analyze', {
                encoding: 'utf8',
                timeout: 10000
            });
            
            if (!output.includes('Analyzing repository')) {
                throw new Error('Smart tagging analysis not working');
            }
            
            console.log('   Repository analysis completed');
        });
    }
    
    async testWorkflowTemplates() {
        await this.test('Workflow Templates', async () => {
            // Check templates directory
            const templatesDir = path.join(__dirname, 'workflow-templates');
            const files = await fs.readdir(templatesDir);
            
            const expectedTemplates = [
                'feature-development.yml',
                'bug-fix.yml',
                'refactor.yml',
                'documentation.yml',
                'release.yml'
            ];
            
            for (const template of expectedTemplates) {
                if (!files.includes(template)) {
                    throw new Error(`Missing template: ${template}`);
                }
            }
            
            console.log(`   Found ${files.length} workflow templates`);
            
            // Test workflow orchestrator
            const output = execSync('node workflow-orchestrator.js list', {
                encoding: 'utf8',
                timeout: 5000
            });
            
            if (!output.includes('Available Workflow Templates')) {
                throw new Error('Workflow orchestrator not listing templates');
            }
        });
    }
    
    async testIntegrationHub() {
        await this.test('Integration Hub API', async () => {
            // Try to check if Integration Hub would start
            const hubPath = path.join(__dirname, 'integration-hub.js');
            await fs.access(hubPath);
            
            console.log('   Integration Hub file exists and is accessible');
            
            // Note: We don't actually start the hub as it would block
            // In a real test, you'd start it in a subprocess and test the API
        });
    }
    
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        
        console.log(`\nTotal Tests: ${this.passedTests + this.failedTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        
        if (this.failedTests > 0) {
            console.log('\n🔴 Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => {
                    console.log(`   - ${r.name}`);
                    console.log(`     Error: ${r.error}`);
                });
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (this.failedTests === 0) {
            console.log('🎉 All tests passed! The automation system is ready to use.');
            console.log('\nNext steps:');
            console.log('1. Start the Integration Hub: node integration-hub.js');
            console.log('2. Open dashboard: http://localhost:8888/dashboard');
            console.log('3. Try a workflow: node workflow-orchestrator.js run feature-development feature_name=test');
        } else {
            console.log('⚠️  Some tests failed. Please fix the issues before using the system.');
            console.log('\nCommon fixes:');
            console.log('- Ensure Ollama is running: docker start ollama');
            console.log('- Pull required models: ollama pull codellama:7b');
            console.log('- Check file permissions and paths');
            console.log('- Ensure all dependencies are installed: npm install');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new AutomationSystemTester();
    
    tester.runAllTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = AutomationSystemTester;