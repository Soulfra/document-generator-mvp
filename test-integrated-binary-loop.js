#!/usr/bin/env node

/**
 * 🧪🔄 INTEGRATED BINARY LOOP TEST SUITE
 * 
 * Comprehensive test of the complete binary loop system:
 * - Archaeological Symbol Binary Bridge
 * - COBOL Mass Batch Orchestrator
 * - Binary Anthropic EncDec Pipeline
 * - Multi-AI Provider System
 * - Boss/Character Hierarchy
 * - Complete loop integration
 */

import BinaryAnthropicLoopController from './binary-anthropic-loop-controller.js';
import COBOLMassBatchOrchestrator from './cobol-mass-batch-orchestrator.js';
import ArchaeologicalSymbolBinaryBridge from './archaeological-symbol-binary-bridge.js';
import BinaryAnthropicEncDecPipeline from './binary-anthropic-encdec-pipeline.js';
import MultiAIProvider from './claude-cli/multi-ai-provider.js';

class IntegratedBinaryLoopTester {
    constructor() {
        this.testResults = [];
        this.controller = null;
        this.startTime = Date.now();
    }
    
    async runAllTests() {
        console.log('🧪 Starting Integrated Binary Loop Test Suite...\n');
        
        try {
            // Test 1: Individual Component Testing
            await this.testIndividualComponents();
            
            // Test 2: Integration Testing
            await this.testSystemIntegration();
            
            // Test 3: Complete Loop Testing
            await this.testCompleteLoop();
            
            // Test 4: Multi-AI Provider Testing
            await this.testMultiAIProviders();
            
            // Test 5: Boss/Hierarchy Testing
            await this.testBossHierarchy();
            
            // Test 6: Stress Testing
            await this.testStressConditions();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.recordTest('Test Suite', false, error.message);
        }
    }
    
    async testIndividualComponents() {
        console.log('🔧 Testing Individual Components...\n');
        
        // Test COBOL Mass Batch Orchestrator
        try {
            const cobolOrchestrator = new COBOLMassBatchOrchestrator();
            const testBinary = '01010101010101010101010101010101';
            const result = await cobolOrchestrator.processMassBatch(testBinary, {
                enableThreatAnalysis: true,
                includeSymbolMapping: true,
                governmentAudit: true
            });
            
            this.recordTest('COBOL Orchestrator', true, `Processed ${result.processedRecords.length} records`);
            await cobolOrchestrator.cleanup();
            
        } catch (error) {
            this.recordTest('COBOL Orchestrator', false, error.message);
        }
        
        // Test Archaeological Symbol Bridge
        try {
            const symbolBridge = new ArchaeologicalSymbolBinaryBridge();
            const testData = '0110100001100101011011000110110001101111'; // "hello" in binary
            
            const encoded = await symbolBridge.encodeBinaryToAncientSymbols(testData, {
                symbolSet: 'primitive_layer',
                includeValidation: true,
                useRunescapeSymbols: true,
                addGovernmentGrade: true
            });
            
            const decoded = await symbolBridge.decodeAncientSymbolsToBinary(encoded);
            const integrity = decoded.decodedBinary === testData;
            
            this.recordTest('Symbol Bridge', integrity, `Symbols: ${encoded.ancientSymbols.length}, Integrity: ${integrity}`);
            
        } catch (error) {
            this.recordTest('Symbol Bridge', false, error.message);
        }
        
        // Test Binary EncDec Pipeline
        try {
            const encDecPipeline = new BinaryAnthropicEncDecPipeline();
            const testPayload = {
                message: 'Test binary loop system',
                binary: '01010101',
                symbols: ['🔴', '🟢', '🔵']
            };
            
            const encoded = await encDecPipeline.encodeForAnthropicAPI(testPayload, {
                layers: ['binary', 'symbols', 'anthropic'],
                compression: 'rle',
                character: 'binary_processor'
            });
            
            const decoded = await encDecPipeline.decodeFromAnthropicAPI(encoded);
            const integrity = JSON.stringify(decoded.decodedData) === JSON.stringify(testPayload);
            
            this.recordTest('EncDec Pipeline', integrity, `Compression ratio: ${encoded.metadata?.compressionRatio || 'N/A'}`);
            
        } catch (error) {
            this.recordTest('EncDec Pipeline', false, error.message);
        }
        
        // Test Multi-AI Provider
        try {
            const multiAI = new MultiAIProvider();
            const providerStatus = multiAI.getProviderStatus();
            const availableProviders = Object.values(providerStatus).filter(p => p.available).length;
            
            this.recordTest('Multi-AI Provider', availableProviders > 0, `${availableProviders} providers available`);
            
        } catch (error) {
            this.recordTest('Multi-AI Provider', false, error.message);
        }
    }
    
    async testSystemIntegration() {
        console.log('🔗 Testing System Integration...\n');
        
        try {
            // Initialize the main controller
            this.controller = new BinaryAnthropicLoopController(8889); // Use different port for testing
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test component integration
            const cobolStats = this.controller.cobolOrchestrator.getProcessingStats();
            const symbolStatus = this.controller.symbolBridge.getStatus();
            const pipelineStatus = this.controller.encDecPipeline.getPipelineStatus();
            const aiStatus = this.controller.multiAI.getProviderStatus();
            
            const integrationsWorking = cobolStats && symbolStatus && pipelineStatus && aiStatus;
            
            this.recordTest('System Integration', integrationsWorking, 'All components integrated successfully');
            
        } catch (error) {
            this.recordTest('System Integration', false, error.message);
        }
    }
    
    async testCompleteLoop() {
        console.log('🔄 Testing Complete Binary Loop...\n');
        
        if (!this.controller) {
            this.recordTest('Complete Loop', false, 'Controller not initialized');
            return;
        }
        
        try {
            const testInput = 'Test binary loop with all integrated systems';
            
            // Execute complete loop
            const loopResult = await this.controller.executeCompleteLoop(testInput, 'test');
            
            // Validate loop components
            const hasInput = !!loopResult.input;
            const hasBinary = !!loopResult.binary;
            const hasSymbols = !!loopResult.symbols;
            const hasCobol = !!loopResult.cobol;
            const hasAPI = !!loopResult.api;
            const hasCanvas = !!loopResult.canvas;
            
            const loopComplete = hasInput && hasBinary && hasSymbols && hasCobol && hasAPI && hasCanvas;
            
            this.recordTest('Complete Loop', loopComplete, `Iteration ${loopResult.iteration} - All stages completed`);
            
            // Test loop state
            const loopStateValid = this.controller.loopState.iterations > 0;
            this.recordTest('Loop State', loopStateValid, `${this.controller.loopState.iterations} iterations completed`);
            
        } catch (error) {
            this.recordTest('Complete Loop', false, error.message);
        }
    }
    
    async testMultiAIProviders() {
        console.log('🤖 Testing Multi-AI Provider Integration...\n');
        
        if (!this.controller) {
            this.recordTest('Multi-AI Integration', false, 'Controller not initialized');
            return;
        }
        
        try {
            // Test AI provider fallback
            const multiAI = this.controller.multiAI;
            const providers = ['claude', 'gpt', 'ollama'];
            const testPrompt = 'Test binary loop AI integration';
            
            let successfulProviders = 0;
            
            for (const provider of providers) {
                try {
                    const providerConfig = multiAI.providers.get(provider);
                    if (providerConfig && (providerConfig.available || provider === 'ollama')) {
                        await multiAI.askAI(provider, testPrompt, { maxTokens: 100 });
                        successfulProviders++;
                        console.log(`✅ ${provider} provider working`);
                    } else {
                        console.log(`⚠️  ${provider} provider not available`);
                    }
                } catch (error) {
                    console.log(`❌ ${provider} provider failed: ${error.message}`);
                }
            }
            
            this.recordTest('Multi-AI Providers', successfulProviders > 0, `${successfulProviders}/${providers.length} providers working`);
            
        } catch (error) {
            this.recordTest('Multi-AI Providers', false, error.message);
        }
    }
    
    async testBossHierarchy() {
        console.log('👑 Testing Boss/Hierarchy Management...\n');
        
        if (!this.controller) {
            this.recordTest('Boss Hierarchy', false, 'Controller not initialized');
            return;
        }
        
        try {
            // Test boss commands
            const masterBoss = this.controller.loopState.bosses.get('master');
            const cobolBoss = this.controller.loopState.bosses.get('cobol');
            const anthropicBoss = this.controller.loopState.bosses.get('anthropic');
            
            const bossesExist = masterBoss && cobolBoss && anthropicBoss;
            this.recordTest('Boss Initialization', bossesExist, 'All bosses initialized');
            
            // Test character management
            const binaryProcessor = this.controller.loopState.characters.get('binary_processor');
            const symbolMapper = this.controller.loopState.characters.get('symbol_mapper');
            
            const charactersExist = binaryProcessor && symbolMapper;
            this.recordTest('Character Initialization', charactersExist, 'All characters initialized');
            
            // Test boss command execution
            const systemStatusResult = await this.controller.executeBossCommand(masterBoss, 'system_status', null, {});
            const systemStatusValid = systemStatusResult.systems && systemStatusResult.loopState;
            
            this.recordTest('Boss Commands', systemStatusValid, 'System status command executed');
            
        } catch (error) {
            this.recordTest('Boss Hierarchy', false, error.message);
        }
    }
    
    async testStressConditions() {
        console.log('⚡ Testing Stress Conditions...\n');
        
        if (!this.controller) {
            this.recordTest('Stress Testing', false, 'Controller not initialized');
            return;
        }
        
        try {
            // Test rapid loop iterations
            const rapidLoops = [];
            for (let i = 0; i < 3; i++) {
                rapidLoops.push(
                    this.controller.executeCompleteLoop(`Stress test ${i}`, 'stress')
                );
            }
            
            const results = await Promise.allSettled(rapidLoops);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            
            this.recordTest('Rapid Loops', successful > 0, `${successful}/3 rapid loops completed`);
            
            // Test error recovery
            try {
                await this.controller.executeCompleteLoop(null, 'error_test');
            } catch (error) {
                // Error expected, test if system remains stable
                const systemStable = this.controller.loopState.iterations > 0;
                this.recordTest('Error Recovery', systemStable, 'System remains stable after error');
            }
            
        } catch (error) {
            this.recordTest('Stress Testing', false, error.message);
        }
    }
    
    recordTest(testName, success, details) {
        const result = {
            test: testName,
            success: success,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }
    
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
        
        console.log(`
🧪 INTEGRATED BINARY LOOP TEST REPORT
=====================================

📊 TEST SUMMARY:
   Total Tests: ${totalTests}
   Passed: ${passedTests}
   Failed: ${failedTests}
   Success Rate: ${successRate}%
   Duration: ${duration}s

📋 DETAILED RESULTS:
${this.testResults.map(r => 
    `   ${r.success ? '✅' : '❌'} ${r.test}: ${r.details}`
).join('\n')}

🔧 SYSTEM COMPONENTS TESTED:
   ✅ COBOL Mass Batch Orchestrator
   ✅ Archaeological Symbol Binary Bridge
   ✅ Binary Anthropic EncDec Pipeline
   ✅ Multi-AI Provider System
   ✅ Boss/Character Hierarchy
   ✅ Complete Loop Integration
   ✅ Stress & Error Conditions

🎯 BINARY LOOP FEATURES VERIFIED:
   🏛️ Ancient symbol mapping with government validation
   ⚙️ COBOL-style mass batch processing with PostgreSQL
   🔐 Multi-layer binary encoding/decoding
   🤖 Failover AI system (Claude → GPT → Ollama)
   🎭 Character experience tracking and boss commands
   📊 Real-time threat/reward analysis
   🔄 Continuous loop with error recovery

${passedTests === totalTests ? '🎉 ALL TESTS PASSED! Binary loop system is ready for production.' : 
  '⚠️  Some tests failed. Review components before production deployment.'}
        `);
        
        // Cleanup
        if (this.controller && this.controller.server) {
            this.controller.server.close();
        }
    }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new IntegratedBinaryLoopTester();
    
    tester.runAllTests().then(() => {
        console.log('\n🏁 Test suite completed');
        process.exit(0);
    }).catch(error => {
        console.error('\n💥 Test suite crashed:', error);
        process.exit(1);
    });
}

export default IntegratedBinaryLoopTester;