// integrated-ai-model-testing-demo.js - Demonstration of integrated AI model testing
// Shows how new models are evaluated, ranked, and integrated into the platform

const fetch = require('node-fetch');

console.log(`
🚀 INTEGRATED AI MODEL TESTING DEMO 🚀
Demonstrates the complete AI model evaluation pipeline
From registration → testing → ranking → platform integration
`);

class IntegratedAIModelTestingDemo {
    constructor() {
        this.services = {
            evaluation: 'http://localhost:9700',
            playerHistory: 'http://localhost:9699',
            tokenEconomy: 'http://localhost:9495'
        };
        
        this.testModels = [
            {
                name: 'SuperCoder-v2',
                provider: 'TechCorp',
                version: '2.1.0',
                context_length: 8192,
                capabilities: ['code_generation', 'system_design', 'debugging'],
                cost_per_1k_tokens: 0.008,
                claimed_specialization: 'Programming and architecture'
            },
            {
                name: 'CreativeAI-Pro',
                provider: 'InnovateLabs',
                version: '1.5.2',
                context_length: 4096,
                capabilities: ['creative_writing', 'problem_solving', 'communication'],
                cost_per_1k_tokens: 0.012,
                claimed_specialization: 'Creative problem solving'
            },
            {
                name: 'EfficiencyBot',
                provider: 'OptimizeInc',
                version: '3.0.0',
                context_length: 2048,
                capabilities: ['fast_responses', 'low_cost', 'basic_reasoning'],
                cost_per_1k_tokens: 0.001,
                claimed_specialization: 'High-speed, low-cost processing'
            }
        ];
    }
    
    async runCompleteDemo() {
        console.log('🎬 Starting complete AI model testing demonstration...\n');
        
        try {
            // Step 1: Check if services are running
            await this.checkServices();
            
            // Step 2: Register and evaluate test models
            const evaluationResults = [];
            for (const model of this.testModels) {
                console.log(`\n📝 Testing model: ${model.name}`);
                const result = await this.testSingleModel(model);
                evaluationResults.push(result);
            }
            
            // Step 3: Show rankings and analysis
            await this.showRankingsAnalysis();
            
            // Step 4: Demonstrate integration with player system
            await this.demonstratePlayerIntegration();
            
            // Step 5: Show token economy integration
            await this.demonstrateTokenEconomyIntegration();
            
            console.log('\n🎉 Demo completed! All systems integrated successfully.');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            console.log('\n💡 Make sure all services are running:');
            console.log('   npm run ai-evaluation');
            console.log('   npm run player-history');
            console.log('   npm run token-economy');
        }
    }
    
    async checkServices() {
        console.log('🔍 Checking service availability...');
        
        for (const [name, url] of Object.entries(this.services)) {
            try {
                const response = await fetch(`${url}/api/rankings`, { method: 'GET' });
                if (response.ok) {
                    console.log(`✅ ${name} service: ONLINE`);
                } else {
                    console.log(`⚠️ ${name} service: RESPONDING (status: ${response.status})`);
                }
            } catch (error) {
                console.log(`❌ ${name} service: OFFLINE`);
            }
        }
        
        await this.delay(1000);
    }
    
    async testSingleModel(modelInfo) {
        console.log(`   🧪 Registering ${modelInfo.name} for evaluation...`);
        
        try {
            // Register model
            const registerResponse = await fetch(`${this.services.evaluation}/api/models/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modelInfo)
            });
            
            if (!registerResponse.ok) {
                throw new Error(`Registration failed: ${registerResponse.statusText}`);
            }
            
            const { modelId } = await registerResponse.json();
            console.log(`   📋 Model registered with ID: ${modelId}`);
            
            // Wait for evaluation to complete (simulated)
            console.log(`   ⏳ Running evaluation puzzles...`);
            await this.delay(3000); // Simulate evaluation time
            
            // Get evaluation results
            const evaluationResponse = await fetch(`${this.services.evaluation}/api/models/${modelId}/evaluation`);
            const evaluationData = await evaluationResponse.json();
            
            // Get admission status
            const admissionResponse = await fetch(`${this.services.evaluation}/api/models/${modelId}/admission`);
            const admissionData = await admissionResponse.json();
            
            console.log(`   📊 Evaluation complete!`);
            console.log(`      Overall Score: ${evaluationData.model_info.overall_score?.toFixed(3) || 'N/A'}`);
            console.log(`      Efficiency Score: ${evaluationData.model_info.efficiency_score?.toFixed(3) || 'N/A'}`);
            console.log(`      Tier: ${evaluationData.model_info.tier || 'N/A'}`);
            console.log(`      Admission Status: ${admissionData.status}`);
            
            return {
                modelId,
                modelInfo,
                evaluation: evaluationData,
                admission: admissionData
            };
            
        } catch (error) {
            console.log(`   ❌ Error testing ${modelInfo.name}: ${error.message}`);
            return { modelInfo, error: error.message };
        }
    }
    
    async showRankingsAnalysis() {
        console.log('\n📈 CURRENT AI MODEL RANKINGS');
        console.log('================================');
        
        try {
            const response = await fetch(`${this.services.evaluation}/api/rankings`);
            const rankings = await response.json();
            
            console.log(`Rank | Model Name           | Provider      | Tier      | Score | Efficiency | Cost/1k`);
            console.log(`-----|---------------------|---------------|-----------|-------|------------|--------`);
            
            rankings.slice(0, 10).forEach(model => {
                const rank = model.rank.toString().padEnd(4);
                const name = (model.name || 'Unknown').substring(0, 19).padEnd(19);
                const provider = (model.provider || 'Unknown').substring(0, 13).padEnd(13);
                const tier = (model.tier || 'N/A').padEnd(9);
                const score = (model.overall_score?.toFixed(3) || 'N/A').padEnd(5);
                const efficiency = (model.efficiency_score?.toFixed(3) || 'N/A').padEnd(10);
                const cost = (model.cost_per_1k_tokens !== undefined ? `$${model.cost_per_1k_tokens.toFixed(4)}` : 'N/A').padEnd(7);
                
                console.log(`${rank} | ${name} | ${provider} | ${tier} | ${score} | ${efficiency} | ${cost}`);
            });
            
            // Analysis
            console.log('\n🔍 RANKING ANALYSIS:');
            
            const tiers = rankings.reduce((acc, model) => {
                acc[model.tier] = (acc[model.tier] || 0) + 1;
                return acc;
            }, {});
            
            console.log('   Tier Distribution:');
            Object.entries(tiers).forEach(([tier, count]) => {
                console.log(`     ${tier}: ${count} models`);
            });
            
            const avgCost = rankings
                .filter(m => m.cost_per_1k_tokens !== undefined)
                .reduce((sum, m) => sum + m.cost_per_1k_tokens, 0) / rankings.length;
            
            console.log(`   Average Cost: $${avgCost.toFixed(4)} per 1k tokens`);
            
            const topPerformer = rankings[0];
            if (topPerformer) {
                console.log(`   🏆 Top Performer: ${topPerformer.name} (${topPerformer.tier} tier)`);
            }
            
        } catch (error) {
            console.log(`❌ Could not fetch rankings: ${error.message}`);
        }
    }
    
    async demonstratePlayerIntegration() {
        console.log('\n👤 PLAYER MERIT SYSTEM INTEGRATION');
        console.log('==================================');
        
        // Simulate a player designing a system and discussing AI models
        const testConversations = [
            {
                playerId: 'player_architect_001',
                conversation: {
                    content: 'I think we should use a microservice architecture with the new SuperCoder-v2 model for our code generation service. The distributed approach would allow us to scale each service independently, and the model\'s high efficiency score makes it cost-effective for production.',
                    context: 'system_design',
                    participants: ['player_architect_001', 'ai_model_discussion']
                }
            },
            {
                playerId: 'player_junior_002', 
                conversation: {
                    content: 'Can someone help me understand why EfficiencyBot scored lower on creativity? It seems fast and cheap.',
                    context: 'learning',
                    participants: ['player_junior_002', 'community_help']
                }
            }
        ];
        
        for (const testCase of testConversations) {
            try {
                console.log(`\n💬 Recording conversation from ${testCase.playerId}:`);
                console.log(`   "${testCase.conversation.content.substring(0, 80)}..."`);
                
                const response = await fetch(`${this.services.playerHistory}/api/conversation/record`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testCase)
                });
                
                if (response.ok) {
                    const analysis = await response.json();
                    console.log(`   📊 Analysis: Technical Depth: ${analysis.technical_depth}, System Thinking: ${analysis.system_thinking}`);
                } else {
                    console.log(`   ⚠️ Could not record conversation`);
                }
                
                // Check player progression
                const progressResponse = await fetch(`${this.services.playerHistory}/api/player/${testCase.playerId}/progression`);
                if (progressResponse.ok) {
                    const progress = await progressResponse.json();
                    console.log(`   🎯 Player Level: ${progress.currentLevel}, Competency: ${progress.overallCompetency.toFixed(2)}`);
                    console.log(`   🤖 AI Agents: ${progress.aiAgents}/${progress.aiAgentLimit}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
    }
    
    async demonstrateTokenEconomyIntegration() {
        console.log('\n💰 TOKEN ECONOMY INTEGRATION');
        console.log('============================');
        
        // Show how AI model performance affects token rewards
        console.log('🔄 AI Model Performance → Token Rewards:');
        console.log('   Elite Tier Models: 150% token rewards for usage');
        console.log('   Premium Tier Models: 125% token rewards');
        console.log('   Standard Tier Models: 100% token rewards');
        console.log('   Basic Tier Models: 75% token rewards');
        console.log('   Experimental Models: 50% token rewards');
        
        console.log('\n🎲 Model-Based Gacha Mechanics:');
        console.log('   Using Elite models improves gacha luck by 20%');
        console.log('   Using Basic models reduces gacha luck by 10%');
        console.log('   Model diversity bonus: +5% luck per unique model tier used');
        
        try {
            // Get economy snapshot
            const economyResponse = await fetch(`${this.services.tokenEconomy}/economy/snapshot`);
            if (economyResponse.ok) {
                const economy = await economyResponse.json();
                console.log('\n📊 Current Token Economy:');
                console.log(`   Total Supply: ${economy.totalSupply?.toLocaleString() || 'N/A'} DGAI`);
                console.log(`   Circulating: ${economy.circulatingSupply?.toLocaleString() || 'N/A'} DGAI`);
                console.log(`   Active Pools: ${economy.pools?.length || 0}`);
            }
        } catch (error) {
            console.log(`   ⚠️ Could not fetch economy data: ${error.message}`);
        }
        
        console.log('\n🧮 AI Model Cost-Benefit Analysis:');
        console.log('   Example: Using SuperCoder-v2 (Elite tier)');
        console.log('     Cost: 8 DGAI tokens per 1k tokens');
        console.log('     Reward Multiplier: 1.5x');
        console.log('     Net Effect: Higher upfront cost, but better rewards and gacha luck');
        console.log('     Best For: Complex programming tasks, system architecture');
        
        console.log('\n   Example: Using EfficiencyBot (Basic tier)');
        console.log('     Cost: 1 DGAI token per 1k tokens');
        console.log('     Reward Multiplier: 0.75x');
        console.log('     Net Effect: Very cheap, but lower rewards');
        console.log('     Best For: Simple tasks, bulk processing');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use
module.exports = IntegratedAIModelTestingDemo;

// If run directly, run the demo
if (require.main === module) {
    const demo = new IntegratedAIModelTestingDemo();
    demo.runCompleteDemo();
}