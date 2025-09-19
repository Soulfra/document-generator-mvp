#!/usr/bin/env node

/**
 * 🔄 PHASE 3: EXECUTE REPRODUCIBILITY TEST 🔄
 * 
 * Runs comprehensive reproducibility tests on all fixes
 * to ensure consistent behavior across multiple runs
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const crypto = require('crypto');
const fs = require('fs').promises;

class ReproducibilityTestExecutor {
    constructor() {
        this.testId = crypto.randomBytes(8).toString('hex');
        this.results = {
            testId: this.testId,
            timestamp: new Date().toISOString(),
            runs: [],
            summary: {},
            reproducibilityScore: 0
        };
    }
    
    async execute() {
        console.log('🔄 PHASE 3: EXECUTING REPRODUCIBILITY TEST');
        console.log('==========================================');
        console.log(`Test ID: ${this.testId}`);
        console.log(`Target: All system fixes`);
        console.log('');
        
        try {
            // Run test suite multiple times
            await this.runMultipleIterations();
            
            // Analyze reproducibility
            await this.analyzeReproducibility();
            
            // Test service stability
            await this.testServiceStability();
            
            // Test response consistency
            await this.testResponseConsistency();
            
            // Generate final report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Reproducibility test error:', error);
            this.results.error = error.message;
        }
    }
    
    async runMultipleIterations() {
        console.log('🔁 Running multiple test iterations...\n');
        
        const iterations = 5;
        
        for (let i = 1; i <= iterations; i++) {
            console.log(`📊 Iteration ${i}/${iterations}`);
            
            const run = {
                iteration: i,
                startTime: new Date().toISOString(),
                tests: {},
                hash: null
            };
            
            // Kill and restart services for each iteration
            await this.restartServices();
            
            // Run integration tests
            const integrationResult = await this.runIntegrationTest();
            run.tests.integration = integrationResult;
            
            // Test each service individually
            run.tests.documentProcessing = await this.testDocumentProcessing();
            run.tests.aiService = await this.testAIService();
            run.tests.journeyService = await this.testJourneyService();
            
            // Generate hash of results
            run.hash = crypto.createHash('sha256')
                .update(JSON.stringify(run.tests))
                .digest('hex');
            
            run.endTime = new Date().toISOString();
            this.results.runs.push(run);
            
            console.log(`  ✅ Iteration ${i} complete (hash: ${run.hash.substring(0, 8)}...)\n`);
            
            // Wait between iterations
            if (i < iterations) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    async restartServices() {
        // Kill existing services
        try {
            await execAsync('pkill -f "fix-.*\\.js" || true');
            await execAsync('pkill -f "empire-api-bridge-fixed" || true');
        } catch (e) {}
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Start services again
        try {
            await execAsync('./start-all-fixes.sh > /dev/null 2>&1 &');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for startup
        } catch (error) {
            console.log('  ⚠️  Service restart warning:', error.message);
        }
    }
    
    async runIntegrationTest() {
        try {
            const { stdout } = await execAsync('node full-system-integration-test.js', {
                timeout: 30000
            });
            
            const passedMatch = stdout.match(/Passed:\s*(\d+)/);
            const failedMatch = stdout.match(/Failed:\s*(\d+)/);
            
            return {
                passed: passedMatch ? parseInt(passedMatch[1]) : 0,
                failed: failedMatch ? parseInt(failedMatch[1]) : 0,
                success: failedMatch && parseInt(failedMatch[1]) === 0
            };
        } catch (error) {
            return {
                passed: 0,
                failed: -1,
                success: false,
                error: error.message
            };
        }
    }
    
    async testDocumentProcessing() {
        try {
            const axios = require('axios');
            const testDocs = [
                'Build a todo app',
                'Create an API',
                'Design a website'
            ];
            
            const results = [];
            
            for (const doc of testDocs) {
                const response = await axios.post('http://localhost:8091/api/process-document', {
                    document: doc,
                    type: 'test'
                }, { timeout: 5000 });
                
                results.push({
                    input: doc,
                    success: response.data.success,
                    strategy: response.data.strategy
                });
            }
            
            return {
                success: results.every(r => r.success),
                results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async testAIService() {
        try {
            const axios = require('axios');
            const prompts = [
                'Generate Hello World',
                'Create a function',
                'Build an API endpoint'
            ];
            
            const results = [];
            
            for (const prompt of prompts) {
                const response = await axios.post('http://localhost:3001/api/generate', {
                    prompt,
                    type: 'code'
                }, { timeout: 5000 });
                
                results.push({
                    prompt,
                    isString: typeof response.data === 'string',
                    hasContent: response.data.length > 0
                });
            }
            
            return {
                success: results.every(r => r.isString && r.hasContent),
                results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async testJourneyService() {
        try {
            const axios = require('axios');
            
            // Test verification
            const verifyResponse = await axios.post('http://localhost:3012/api/verify', {
                reasoning: 'Test verification',
                confidence: 0.95
            }, { timeout: 5000 });
            
            // Test journey
            const journeyResponse = await axios.post('http://localhost:3012/api/simulate-journey', {
                customer: 'test-customer'
            }, { timeout: 5000 });
            
            return {
                success: verifyResponse.data.success && journeyResponse.data.success,
                verification: {
                    success: verifyResponse.data.success,
                    hasTxHash: !!verifyResponse.data.txHash
                },
                journey: {
                    success: journeyResponse.data.success,
                    steps: journeyResponse.data.journeySteps?.length || 0
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async analyzeReproducibility() {
        console.log('📊 Analyzing reproducibility...\n');
        
        // Check if all runs produced same results
        const hashes = this.results.runs.map(r => r.hash);
        const uniqueHashes = [...new Set(hashes)];
        
        this.results.summary.totalRuns = this.results.runs.length;
        this.results.summary.uniqueResults = uniqueHashes.length;
        this.results.summary.isFullyReproducible = uniqueHashes.length === 1;
        
        // Calculate reproducibility score
        const reproducibilityScore = ((this.results.runs.length - uniqueHashes.length + 1) / this.results.runs.length) * 100;
        this.results.reproducibilityScore = Math.round(reproducibilityScore);
        
        // Analyze service-level reproducibility
        const services = ['integration', 'documentProcessing', 'aiService', 'journeyService'];
        this.results.summary.serviceReproducibility = {};
        
        for (const service of services) {
            const serviceResults = this.results.runs.map(r => r.tests[service]?.success);
            const allSame = serviceResults.every(r => r === serviceResults[0]);
            this.results.summary.serviceReproducibility[service] = allSame;
        }
        
        console.log(`  📈 Reproducibility Score: ${this.results.reproducibilityScore}%`);
        console.log(`  📊 Unique Results: ${uniqueHashes.length}/${this.results.runs.length}`);
        console.log('');
    }
    
    async testServiceStability() {
        console.log('🏥 Testing service stability...\n');
        
        const axios = require('axios');
        const endpoints = [
            { name: 'Empire API', url: 'http://localhost:8090/api/systems' },
            { name: 'Document Processing', url: 'http://localhost:8091/health' },
            { name: 'AI Service', url: 'http://localhost:3001/health' },
            { name: 'Journey Service', url: 'http://localhost:3012/health' }
        ];
        
        this.results.serviceStability = [];
        
        for (const endpoint of endpoints) {
            let successCount = 0;
            const attempts = 10;
            
            console.log(`  Testing ${endpoint.name}...`);
            
            for (let i = 0; i < attempts; i++) {
                try {
                    await axios.get(endpoint.url, { timeout: 1000 });
                    successCount++;
                } catch (error) {
                    // Failed attempt
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const stability = (successCount / attempts) * 100;
            this.results.serviceStability.push({
                service: endpoint.name,
                stability: `${stability}%`,
                reliable: stability === 100
            });
            
            console.log(`    Stability: ${stability}% (${successCount}/${attempts})`);
        }
        
        console.log('');
    }
    
    async testResponseConsistency() {
        console.log('🔍 Testing response consistency...\n');
        
        const axios = require('axios');
        this.results.responseConsistency = {};
        
        // Test document processing consistency
        const testDoc = 'Build a simple app';
        const docResponses = [];
        
        for (let i = 0; i < 3; i++) {
            try {
                const response = await axios.post('http://localhost:8091/api/process-document', {
                    document: testDoc,
                    type: 'test'
                });
                docResponses.push(response.data.strategy);
            } catch (error) {
                docResponses.push('error');
            }
        }
        
        this.results.responseConsistency.documentProcessing = {
            consistent: docResponses.every(r => r === docResponses[0]),
            strategies: [...new Set(docResponses)]
        };
        
        // Test AI service consistency
        const testPrompt = 'Generate a simple function';
        const aiResponses = [];
        
        for (let i = 0; i < 3; i++) {
            try {
                const response = await axios.post('http://localhost:3001/api/generate', {
                    prompt: testPrompt,
                    type: 'code'
                });
                aiResponses.push(response.data.includes('function'));
            } catch (error) {
                aiResponses.push(false);
            }
        }
        
        this.results.responseConsistency.aiService = {
            consistent: aiResponses.every(r => r === aiResponses[0]),
            allValid: aiResponses.every(r => r === true)
        };
        
        console.log(`  📄 Document Processing: ${this.results.responseConsistency.documentProcessing.consistent ? '✅ Consistent' : '❌ Inconsistent'}`);
        console.log(`  🤖 AI Service: ${this.results.responseConsistency.aiService.consistent ? '✅ Consistent' : '❌ Inconsistent'}`);
        console.log('');
    }
    
    async generateReport() {
        console.log('📋 Generating reproducibility report...\n');
        
        // Save detailed results
        const reportPath = `./reproducibility-report-${this.testId}.json`;
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate summary
        const summary = `# 🔄 Reproducibility Test Report

**Test ID**: ${this.testId}  
**Date**: ${new Date().toLocaleString()}  
**Iterations**: ${this.results.runs.length}

## 📊 Overall Results

- **Reproducibility Score**: ${this.results.reproducibilityScore}%
- **Fully Reproducible**: ${this.results.summary.isFullyReproducible ? '✅ Yes' : '❌ No'}
- **Unique Results**: ${this.results.summary.uniqueResults}/${this.results.summary.totalRuns}

## 🏥 Service Stability

${this.results.serviceStability.map(s => 
    `- **${s.service}**: ${s.stability} ${s.reliable ? '✅' : '⚠️'}`
).join('\n')}

## 🔍 Response Consistency

- **Document Processing**: ${this.results.responseConsistency.documentProcessing.consistent ? '✅ Consistent' : '❌ Inconsistent'}
- **AI Service**: ${this.results.responseConsistency.aiService.consistent ? '✅ Consistent' : '❌ Inconsistent'}

## 📈 Service-Level Reproducibility

${Object.entries(this.results.summary.serviceReproducibility).map(([service, reproducible]) =>
    `- **${service}**: ${reproducible ? '✅ Reproducible' : '❌ Not Reproducible'}`
).join('\n')}

## 🔄 Run Details

${this.results.runs.map(r => `
### Run ${r.iteration}
- **Hash**: ${r.hash.substring(0, 16)}...
- **Integration**: ${r.tests.integration?.success ? '✅ Pass' : '❌ Fail'}
- **Document Processing**: ${r.tests.documentProcessing?.success ? '✅ Pass' : '❌ Fail'}
- **AI Service**: ${r.tests.aiService?.success ? '✅ Pass' : '❌ Fail'}
- **Journey Service**: ${r.tests.journeyService?.success ? '✅ Pass' : '❌ Fail'}
`).join('\n')}

## ✅ Conclusion

The system demonstrates ${this.results.reproducibilityScore >= 90 ? 'excellent' : this.results.reproducibilityScore >= 70 ? 'good' : 'moderate'} reproducibility with a score of ${this.results.reproducibilityScore}%.

${this.results.summary.isFullyReproducible ? 
    'All test runs produced identical results, indicating perfect reproducibility.' :
    `Some variations were observed across ${this.results.summary.uniqueResults} different result sets.`}
`;
        
        const summaryPath = `./reproducibility-summary-${this.testId}.md`;
        await fs.writeFile(summaryPath, summary);
        
        console.log('📊 REPRODUCIBILITY TEST SUMMARY');
        console.log('================================');
        console.log(`Reproducibility Score: ${this.results.reproducibilityScore}%`);
        console.log(`Fully Reproducible: ${this.results.summary.isFullyReproducible ? '✅ Yes' : '❌ No'}`);
        console.log(`Service Stability: ${this.results.serviceStability.every(s => s.reliable) ? '✅ All Stable' : '⚠️ Some Unstable'}`);
        console.log('');
        console.log(`Full report: ${reportPath}`);
        console.log(`Summary: ${summaryPath}`);
    }
}

// Run the test
if (require.main === module) {
    const executor = new ReproducibilityTestExecutor();
    executor.execute().catch(console.error);
}

module.exports = ReproducibilityTestExecutor;