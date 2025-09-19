#!/usr/bin/env node

/**
 * TOURNAMENT INTEGRATION TEST
 * Demonstrates full integration with quest journal, card rituals, and Claude API
 */

const TournamentAIRouter = require('./tournament-ai-router');
const TournamentQuestBridge = require('./tournament-quest-bridge');
const TournamentClaudeIntegration = require('./tournament-claude-integration');
const AIUnit = require('./ai-unit');

async function runIntegrationTest() {
    console.log('🧪 Tournament AI System Integration Test\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Initialize systems
        console.log('\n1️⃣  Initializing Systems...');
        
        const integration = new TournamentClaudeIntegration({
            dbConfig: {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'economic_engine'
            }
        });
        
        await integration.initialize();
        console.log('✅ Tournament-Claude integration ready');
        
        // 2. Create test character
        const characterId = 1; // Using existing character or create new
        console.log(`\n2️⃣  Using Character ID: ${characterId}`);
        
        // 3. Run tournament query
        console.log('\n3️⃣  Running Tournament Query...');
        const query = "What is the best approach to solve complex AI problems where multiple solutions compete?";
        
        const result = await integration.processTournamentQuery(
            query,
            'tournament',
            { 
                useTournament: true,
                bracketSize: 8
            },
            characterId
        );
        
        // 4. Display tournament results
        console.log('\n4️⃣  Tournament Results:');
        console.log('=' .repeat(60));
        
        console.log(`🏆 Winner: ${result.winner.name}`);
        console.log(`🎯 Approach: ${result.winner.approach}`);
        console.log(`💪 Confidence: ${(result.winner.confidence * 100).toFixed(1)}%`);
        console.log(`📦 Knowledge Items: ${result.winner.inventory.length}`);
        console.log(`⏱️  Duration: ${result.duration}ms`);
        console.log(`🥊 Rounds: ${result.rounds}`);
        console.log(`👥 Participants: ${result.participants}`);
        
        // 5. Show quest integration
        if (result.questIntegration) {
            console.log('\n5️⃣  Quest Integration:');
            console.log('=' .repeat(60));
            
            const quest = result.questIntegration.quest;
            console.log(`📜 Quest: ${quest.quest_name}`);
            console.log(`📝 Description: ${quest.quest_description}`);
            console.log(`✅ Status: ${quest.status}`);
            console.log(`🎁 Rewards: ${JSON.stringify(JSON.parse(quest.rewards))}`);
            
            if (result.questIntegration.achievements.length > 0) {
                console.log(`\n🏅 Achievements Unlocked:`);
                result.questIntegration.achievements.forEach(achievement => {
                    console.log(`  - ${achievement.name}: ${achievement.description}`);
                });
            }
        }
        
        // 6. Show inventory breakdown
        console.log('\n6️⃣  Winner\'s Inventory Analysis:');
        console.log('=' .repeat(60));
        
        const inventoryBreakdown = {
            defeated: 0,
            insights: 0,
            knowledge: 0,
            other: 0
        };
        
        result.winner.inventory.forEach(([key, value]) => {
            if (key.startsWith('eliminated-') || key.startsWith('defeated-')) {
                inventoryBreakdown.defeated++;
            } else if (key.includes('insight')) {
                inventoryBreakdown.insights++;
            } else if (key.includes('knowledge')) {
                inventoryBreakdown.knowledge++;
            } else {
                inventoryBreakdown.other++;
            }
        });
        
        console.log(`💀 Defeated Units: ${inventoryBreakdown.defeated}`);
        console.log(`💡 Insights: ${inventoryBreakdown.insights}`);
        console.log(`📚 Knowledge Items: ${inventoryBreakdown.knowledge}`);
        console.log(`📦 Other Items: ${inventoryBreakdown.other}`);
        console.log(`📊 Total: ${result.winner.inventory.length}`);
        
        // 7. Show defeated units
        console.log('\n7️⃣  Defeated Units:');
        console.log('=' .repeat(60));
        
        result.winner.inventory.forEach(([key, value]) => {
            if (key.startsWith('eliminated-')) {
                console.log(`❌ ${value.name} (${value.approach}) - ${value.rounds} rounds survived`);
            }
        });
        
        // 8. Test symbol-based tournament
        console.log('\n8️⃣  Testing Symbol-Based Tournament...');
        const symbolQuery = "!execute tournament @collaborative #strategy ?best-approach";
        
        const symbolResult = await integration.createSymbolTournament(
            symbolQuery,
            ['!', '@', '#', '?'],
            characterId
        );
        
        console.log(`\n✅ Symbol tournament complete!`);
        console.log(`   Winner: ${symbolResult.winner.name}`);
        console.log(`   Symbols processed: !, @, #, ?`);
        
        // 9. Show tournament statistics
        console.log('\n9️⃣  Tournament Statistics:');
        console.log('=' .repeat(60));
        
        const stats = integration.tournamentRouter.getStatistics();
        console.log(`📊 Total Tournaments: ${stats.tournamentsRun}`);
        console.log(`🥊 Total Rounds: ${stats.totalRounds}`);
        console.log(`⏱️  Average Round Time: ${Math.round(stats.averageRoundTime)}ms`);
        
        if (stats.winnerDistribution.length > 0) {
            console.log(`\n🏆 Winner Distribution:`);
            stats.winnerDistribution.forEach(dist => {
                console.log(`   ${dist.approach}: ${dist.count} wins (${dist.percentage}%)`);
            });
        }
        
        // 10. Test individual AI units
        console.log('\n🔟 Testing Individual AI Units:');
        console.log('=' .repeat(60));
        
        const testUnit = new AIUnit({
            name: 'Test Champion',
            approach: 'synthesis'
        });
        
        const unitResponse = await testUnit.processQuery(
            "How do we integrate multiple AI approaches?"
        );
        
        console.log(`\n${testUnit.name} Response:`);
        console.log(unitResponse.content);
        console.log(`\nConfidence: ${(unitResponse.confidence * 100).toFixed(1)}%`);
        console.log(`Metadata: ${JSON.stringify(unitResponse.metadata)}`);
        
        console.log('\n✅ Integration test complete!');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error);
        console.error(error.stack);
    }
}

// Run test
if (require.main === module) {
    runIntegrationTest()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}