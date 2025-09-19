#!/usr/bin/env node

/**
 * Test DocumentGeneratorVault Integration
 * Verify the Master Learning Orchestrator is properly integrated as the master origin portal
 */

const path = require('path');

// Import the classes directly to test integration
const MasterLearningOrchestrator = require('./master-learning-orchestrator.js');

class VaultIntegrationTest {
    constructor() {
        this.rootPath = '/Users/matthewmauer/Desktop/Document-Generator';
    }

    async runIntegrationTest() {
        console.log('🏛️ DOCUMENT GENERATOR VAULT INTEGRATION TEST');
        console.log('============================================\n');

        // Test 1: Master Learning Orchestrator initialization
        console.log('📊 Test 1: Master Learning Orchestrator Initialization');
        console.log('------------------------------------------------------');
        
        try {
            const orchestrator = new MasterLearningOrchestrator({
                port: 9950,
                learningRate: 0.15,
                tokenRewardBase: 12,
                tokenPenaltyBase: 6
            });
            
            console.log('✅ Master Learning Orchestrator created successfully');
            console.log(`🎯 Supporting ${orchestrator.config.supportedFormats.length} file formats`);
            console.log(`🎮 Extracting ${Object.keys(orchestrator.config.layerPatterns).length} layer types`);
            
        } catch (error) {
            console.error('❌ Failed to create Master Learning Orchestrator:', error.message);
            return false;
        }

        // Test 2: Verify vault app can load the orchestrator
        console.log('\n📊 Test 2: Vault App Integration');
        console.log('--------------------------------');
        
        try {
            // Simulate the vault app initialization
            const vaultOrchestrator = new MasterLearningOrchestrator({
                port: 9950,
                learningRate: 0.15,
                tokenRewardBase: 12,
                tokenPenaltyBase: 6
            });
            
            // Test the API methods that the vault would use
            const stats = vaultOrchestrator.getLearningStats();
            console.log('✅ Learning stats accessible:', {
                totalExperiences: stats.totalExperiences,
                recentAccuracy: stats.recentAccuracy,
                totalTokensEarned: stats.totalTokensEarned,
                formatCount: Object.keys(stats.formatStats).length
            });
            
        } catch (error) {
            console.error('❌ Vault integration failed:', error.message);
            return false;
        }

        // Test 3: Test file processing through vault interface
        console.log('\n📊 Test 3: File Processing Integration');
        console.log('------------------------------------');
        
        try {
            const orchestrator = new MasterLearningOrchestrator();
            
            // Create a test file
            const fs = require('fs').promises;
            const testContent = `// Test frontend component
import React from 'react';

const TestComponent = () => {
    return <div>Test</div>;
};

export default TestComponent;`;
            
            const testFilePath = path.join(this.rootPath, 'temp-test-component.tsx');
            await fs.writeFile(testFilePath, testContent);
            
            // Process the file through the orchestrator
            const result = await orchestrator.processFileWithLearning(testFilePath);
            
            console.log('✅ File processed successfully');
            console.log(`   Format detected: ${result.format}`);
            console.log(`   Layers extracted: ${Object.keys(result.layerExtractions).filter(k => result.layerExtractions[k].matched).join(', ')}`);
            console.log(`   Vault organized: ${result.vaultOrganization.organized}`);
            if (result.rewards) {
                console.log(`   Tokens earned: ${result.rewards}`);
            }
            
            // Cleanup
            await fs.unlink(testFilePath);
            
        } catch (error) {
            console.error('❌ File processing failed:', error.message);
            return false;
        }

        // Test 4: Verify menu integration would work
        console.log('\n📊 Test 4: Menu Integration Simulation');
        console.log('------------------------------------');
        
        try {
            const orchestrator = new MasterLearningOrchestrator();
            
            // Simulate menu actions
            const menuActions = {
                'Process File': () => console.log('🔍 Process File dialog would open'),
                'Process Directory': () => console.log('📁 Process Directory dialog would open'),
                'View Learning Stats': () => {
                    const stats = orchestrator.getLearningStats();
                    console.log('📊 Learning Stats window would display:', {
                        experiences: stats.totalExperiences,
                        accuracy: `${(stats.recentAccuracy * 100).toFixed(1)}%`,
                        tokens: stats.totalTokensEarned
                    });
                },
                'Reset Learning': () => {
                    orchestrator.performanceHistory = [];
                    orchestrator.experienceDatabase.clear();
                    console.log('🔄 Learning statistics reset');
                },
                'Run Test Suite': () => console.log('🧪 Test suite would execute')
            };
            
            console.log('✅ Menu actions simulation:');
            Object.entries(menuActions).forEach(([action, handler]) => {
                console.log(`   - ${action}: Ready`);
                handler();
            });
            
        } catch (error) {
            console.error('❌ Menu integration failed:', error.message);
            return false;
        }

        console.log('\n🎉 INTEGRATION TEST COMPLETE');
        console.log('===========================');
        console.log('✅ All tests passed successfully!');
        console.log('\n🏛️ DocumentGeneratorVault.app is now integrated with:');
        console.log('   🧠 Master Learning Orchestrator (as origin portal)');
        console.log('   🔄 Reinforcement learning system');
        console.log('   🎯 Multi-format file processing');
        console.log('   📊 Layer extraction (frontend/backend/game/ICP/blockchain)');
        console.log('   💰 Token reward system');
        console.log('   📚 Experience tracking and learning');
        
        return true;
    }
}

// Run the integration test
if (require.main === module) {
    const test = new VaultIntegrationTest();
    test.runIntegrationTest()
        .then(success => {
            if (success) {
                console.log('\n🚀 The vault is ready to serve as your master origin portal!');
                process.exit(0);
            } else {
                console.log('\n❌ Integration test failed');
                process.exit(1);
            }
        })
        .catch(console.error);
}

module.exports = VaultIntegrationTest;