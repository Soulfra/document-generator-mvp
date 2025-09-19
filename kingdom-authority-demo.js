#!/usr/bin/env node

/**
 * 👑⚔️🏰 KINGDOM AUTHORITY SYSTEM DEMO
 * Comprehensive demonstration of the Reddit-style hierarchical authority system
 * Shows kingdom creation, quest predictions, reputation changes, and democratic validation
 */

const BossSubmissionAPI = require('./boss-submission-api.js');

class KingdomAuthorityDemo {
    constructor() {
        this.api = null;
        this.kingdomSystem = null;
        this.users = [];
        this.kingdoms = [];
        this.quests = [];
    }
    
    async initialize() {
        console.log('👑⚔️🏰 Kingdom Authority System Demo');
        console.log('=====================================\n');
        
        // Initialize the API (which includes the kingdom system)
        this.api = new BossSubmissionAPI();
        await this.api.start();
        
        this.kingdomSystem = this.api.kingdomSystem;
        
        console.log('✅ Boss Submission API and Kingdom System initialized\n');
    }
    
    async runDemo() {
        await this.createDemoUsers();
        await this.createDemoKingdoms();
        await this.createDemoBosses();
        await this.simulateBattleWithQuests();
        await this.showAuthorityProgression();
        await this.demonstrateDemocraticValidation();
        await this.showFinalStats();
    }
    
    async createDemoUsers() {
        console.log('👤 Creating demo users with different starting reputations...\n');
        
        const userData = [
            { id: 'alice_the_bold', name: 'Alice the Bold', reputation: 50 },
            { id: 'bob_the_wise', name: 'Bob the Wise', reputation: 350 },
            { id: 'charlie_great', name: 'Charlie the Great', reputation: 800 },
            { id: 'diana_dragon', name: 'Diana Dragonslayer', reputation: 150 },
            { id: 'eve_expert', name: 'Eve the Expert', reputation: 25 },
            { id: 'frank_fighter', name: 'Frank the Fighter', reputation: -50 },
            { id: 'grace_guardian', name: 'Grace the Guardian', reputation: 1200 }
        ];
        
        for (const data of userData) {
            const user = this.kingdomSystem.createUser(data.id, data);
            this.users.push(user);
            
            console.log(`  👤 ${user.name}: ${user.reputation} reputation → ${user.authority.title} (${user.authority.color})`);
        }
        
        console.log(`\n✅ Created ${this.users.length} demo users\n`);
    }
    
    async createDemoKingdoms() {
        console.log('🏰 Creating demo kingdoms (bosses become kingdoms)...\n');
        
        // Alice creates a dragon kingdom
        const dragonBoss = {
            name: 'Ancient Fire Dragon',
            level: 100,
            health: 5000,
            damage: 200,
            defense: 100
        };
        
        const dragonKingdom = this.kingdomSystem.createKingdom('dragon_boss_001', dragonBoss, 'alice_the_bold');
        this.kingdoms.push(dragonKingdom);
        
        // Charlie creates a demon kingdom  
        const demonBoss = {
            name: 'Shadow Demon Lord',
            level: 85,
            health: 3500,
            damage: 180,
            defense: 75
        };
        
        const demonKingdom = this.kingdomSystem.createKingdom('demon_boss_002', demonBoss, 'charlie_great');
        this.kingdoms.push(demonKingdom);
        
        // Grace creates an undead kingdom
        const undeadBoss = {
            name: 'Lich King Overlord',
            level: 120,
            health: 6000,
            damage: 250,
            defense: 120
        };
        
        const undeadKingdom = this.kingdomSystem.createKingdom('undead_boss_003', undeadBoss, 'grace_guardian');
        this.kingdoms.push(undeadKingdom);
        
        console.log('  🏰 Dragon Kingdom ruled by Alice the Bold');
        console.log('  🏰 Demon Kingdom ruled by Charlie the Great'); 
        console.log('  🏰 Undead Kingdom ruled by Grace the Guardian');
        
        // Make appointments in kingdoms
        console.log('\n⚔️ Making kingdom appointments...\n');
        
        // Charlie (Lord) can appoint knights in Dragon Kingdom
        this.kingdomSystem.appointToPosition('dragon_boss_001', 'charlie_great', 'LORD', 'alice_the_bold');
        this.kingdomSystem.appointToPosition('dragon_boss_001', 'bob_the_wise', 'KNIGHT', 'charlie_great');
        this.kingdomSystem.appointToPosition('dragon_boss_001', 'diana_dragon', 'KNIGHT', 'alice_the_bold');
        
        console.log('  ⚔️ Charlie appointed as Lord of Dragon Kingdom');
        console.log('  ⚔️ Bob appointed as Knight of Dragon Kingdom');
        console.log('  ⚔️ Diana appointed as Knight of Dragon Kingdom');
        
        console.log('\n✅ Kingdoms established with hierarchies\n');
    }
    
    async createDemoBosses() {
        console.log('👹 Simulating boss submissions through API...\n');
        
        // Simulate API calls to create bosses (which creates kingdoms)
        const bossSubmissions = [
            {
                name: 'Giant Spider Queen',
                level: 45,
                health: 800,
                damage: 60,
                defense: 25,
                creator: 'eve_expert',
                description: 'A massive spider with venomous fangs'
            },
            {
                name: 'Ice Elemental',
                level: 70,
                health: 2000,
                damage: 120,
                defense: 80,
                creator: 'diana_dragon',
                description: 'Frozen creature from the northern wastes'
            }
        ];
        
        for (const bossData of bossSubmissions) {
            // This would normally be done through HTTP POST, but we'll call directly
            const bossId = this.api.generateBossId();
            const boss = {
                id: bossId,
                ...bossData,
                assets: { images: [], sounds: [] },
                createdAt: new Date().toISOString(),
                status: 'approved',
                battles: 0,
                wins: 0,
                losses: 0,
                revenue: 0,
                rating: 0
            };
            
            this.api.bossDatabase.set(bossId, boss);
            
            // Create kingdom
            const kingdom = this.kingdomSystem.createKingdom(bossId, boss, bossData.creator);
            this.kingdoms.push(kingdom);
            
            console.log(`  👹 ${boss.name} kingdom created by ${bossData.creator}`);
        }
        
        console.log('\n✅ Additional bosses/kingdoms created\n');
    }
    
    async simulateBattleWithQuests() {
        console.log('⚔️📜 Simulating battle with quest predictions...\n');
        
        const battleId = 'demo_battle_001';
        const dragonKingdom = this.kingdoms[0]; // Dragon kingdom
        
        // Create a quest for the upcoming battle
        const quest = this.kingdomSystem.createQuest(
            battleId,
            { bossId: dragonKingdom.id, participants: ['dragon', 'ai_fighter_1', 'ai_fighter_2', 'ai_fighter_3'] },
            ['BATTLE_OUTCOME', 'BATTLE_DURATION', 'FIRST_DEATH'],
            'alice_the_bold' // Alice creates the quest for her kingdom
        );
        
        this.quests.push(quest);
        
        console.log(`  📜 Quest created: ${quest.id} by Alice the Bold`);
        console.log(`  📜 Objectives: Battle Outcome, Battle Duration, First Death`);
        
        // Users make predictions
        console.log('\n🔮 Users making predictions...\n');
        
        const objective1 = quest.objectives[0]; // BATTLE_OUTCOME
        const objective2 = quest.objectives[1]; // BATTLE_DURATION  
        const objective3 = quest.objectives[2]; // FIRST_DEATH
        
        // Simulate predictions from different users
        const predictions = [
            { user: 'alice_the_bold', obj1: 'boss', obj2: 125, obj3: 'ai_fighter_1' },
            { user: 'bob_the_wise', obj1: 'players', obj2: 140, obj3: 'ai_fighter_2' },
            { user: 'charlie_great', obj1: 'boss', obj2: 115, obj3: 'ai_fighter_3' },
            { user: 'diana_dragon', obj1: 'boss', obj2: 130, obj3: 'ai_fighter_1' },
            { user: 'eve_expert', obj1: 'players', obj2: 160, obj3: 'ai_fighter_2' },
            { user: 'frank_fighter', obj1: 'draw', obj2: 200, obj3: 'dragon' }
        ];
        
        for (const pred of predictions) {
            try {
                this.kingdomSystem.submitPrediction(quest.id, objective1.id, pred.user, pred.obj1);
                this.kingdomSystem.submitPrediction(quest.id, objective2.id, pred.user, pred.obj2);
                this.kingdomSystem.submitPrediction(quest.id, objective3.id, pred.user, pred.obj3);
                
                const user = this.kingdomSystem.getUser(pred.user);
                console.log(`  🔮 ${user.name} (${user.authority.title}): Winner=${pred.obj1}, Duration=${pred.obj2}s, FirstDeath=${pred.obj3}`);
            } catch (error) {
                console.log(`  ❌ ${pred.user} couldn't predict: ${error.message}`);
            }
        }
        
        console.log('\n⚔️ Simulating battle resolution...\n');
        
        // Simulate battle results
        const battleResults = {
            winner: 'boss',           // Dragon wins
            duration: 118,           // Battle lasted 118 seconds  
            topDamageDealer: 'dragon',
            firstDeath: 'ai_fighter_1', // First AI fighter died first
            totalDamage: 2500
        };
        
        // Resolve the quest
        const resolvedQuest = this.kingdomSystem.resolveQuest(quest.id, battleResults);
        
        console.log(`  ⚔️ Battle resolved: Dragon wins in ${battleResults.duration} seconds`);
        console.log(`  💀 First death: ${battleResults.firstDeath}`);
        console.log(`  📜 Quest resolved with reputation changes`);
        
        console.log('\n✅ Battle and quest completed\n');
    }
    
    async showAuthorityProgression() {
        console.log('📊 Authority progression after quest resolution...\n');
        
        // Show how users' reputations and authorities changed
        console.log('User Status After Quest:');
        console.log('========================');
        
        this.users.forEach(user => {
            const updatedUser = this.kingdomSystem.getUser(user.id);
            const history = this.kingdomSystem.reputationHistory.get(user.id) || [];
            const recentChanges = history.slice(-3); // Last 3 changes
            
            console.log(`\n👤 ${updatedUser.name}:`);
            console.log(`   Authority: ${updatedUser.authority.title} (${updatedUser.authority.color})`);
            console.log(`   Reputation: ${updatedUser.reputation} (was ${user.reputation})`);
            console.log(`   Accuracy: ${(updatedUser.accuracy * 100).toFixed(1)}% (${updatedUser.correctVotes}/${updatedUser.totalVotes})`);
            console.log(`   Vote Weight: ${updatedUser.voteWeight}`);
            console.log(`   Permissions: ${updatedUser.permissions.join(', ')}`);
            
            if (recentChanges.length > 0) {
                console.log('   Recent Changes:');
                recentChanges.forEach(change => {
                    const sign = change.change >= 0 ? '+' : '';
                    console.log(`     ${sign}${change.change} - ${change.reason}: ${change.details}`);
                });
            }
        });
        
        console.log('\n✅ Authority progression analysis complete\n');
    }
    
    async demonstrateDemocraticValidation() {
        console.log('🗳️ Demonstrating democratic validation system...\n');
        
        // Create a community vote about battle fairness
        const vote = this.kingdomSystem.createCommunityVote(
            this.quests[0].id,
            'fairness_vote',
            'Was the Dragon vs AI Fighters battle fair and accurate?',
            ['fair', 'unfair', 'needs_review']
        );
        
        console.log(`  🗳️ Community vote created: "${vote.question}"`);
        console.log(`  🗳️ Options: ${vote.options.join(', ')}`);
        console.log(`  🗳️ Voting deadline: ${new Date(vote.deadline).toLocaleTimeString()}`);
        
        // Users vote based on their authority levels
        console.log('\n🗳️ Users casting votes (weighted by authority)...\n');
        
        const voteChoices = [
            { user: 'alice_the_bold', choice: 'fair' },
            { user: 'bob_the_wise', choice: 'fair' },
            { user: 'charlie_great', choice: 'fair' },
            { user: 'diana_dragon', choice: 'unfair' },
            { user: 'eve_expert', choice: 'fair' },
            { user: 'grace_guardian', choice: 'fair' }
        ];
        
        for (const { user, choice } of voteChoices) {
            try {
                this.kingdomSystem.submitVote(vote.id, user, choice);
                const userData = this.kingdomSystem.getUser(user);
                console.log(`  🗳️ ${userData.name} (${userData.authority.title}, weight: ${userData.voteWeight}) votes: ${choice}`);
            } catch (error) {
                console.log(`  ❌ ${user} couldn't vote: ${error.message}`);
            }
        }
        
        // Check consensus
        const consensus = this.kingdomSystem.checkVoteConsensus(vote.id);
        const finalVote = this.kingdomSystem.votes.get(vote.id);
        
        console.log('\n📊 Vote Results:');
        console.log('================');
        console.log(`Total Votes: ${finalVote.totalVotes}`);
        console.log('Weighted Results:');
        
        finalVote.weightedVotes.forEach((weight, option) => {
            const percentage = ((weight / Array.from(finalVote.weightedVotes.values()).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            console.log(`  ${option}: ${weight} votes (${percentage}%)`);
        });
        
        console.log(`\nConsensus Reached: ${consensus ? 'YES' : 'NO'}`);
        console.log(`Final Result: ${finalVote.result || 'No consensus'}`);
        
        console.log('\n✅ Democratic validation demonstration complete\n');
    }
    
    async showFinalStats() {
        console.log('📊 Final Kingdom Authority System Statistics\n');
        console.log('===========================================\n');
        
        // System stats
        const systemStats = this.kingdomSystem.getSystemStats();
        console.log('System Overview:');
        console.log(`  Total Users: ${systemStats.totalUsers}`);
        console.log(`  Total Kingdoms: ${systemStats.totalKingdoms}`);
        console.log(`  Total Quests: ${systemStats.totalQuests}`);
        console.log(`  Active Quests: ${systemStats.activeQuests}`);
        console.log(`  Average Reputation: ${systemStats.averageReputation.toFixed(1)}`);
        console.log(`  Total Revenue: $${systemStats.totalRevenue.toFixed(2)}`);
        
        console.log('\nAuthority Distribution:');
        Object.entries(systemStats.authorityDistribution).forEach(([level, count]) => {
            if (count > 0) {
                const config = this.kingdomSystem.authorityLevels[level];
                console.log(`  ${config.title}: ${count} users (${config.color})`);
            }
        });
        
        // Authority leaderboard
        console.log('\n🏆 Authority Leaderboard:');
        console.log('=======================');
        const authorityLeaderboard = this.kingdomSystem.getAuthorityLeaderboard();
        authorityLeaderboard.slice(0, 5).forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.name} - ${entry.authority} (${entry.reputation} rep, ${entry.accuracy}% accuracy)`);
        });
        
        // Kingdom leaderboard
        console.log('\n🏰 Kingdom Leaderboard:');
        console.log('=====================');
        const kingdomLeaderboard = this.kingdomSystem.getKingdomLeaderboard();
        kingdomLeaderboard.slice(0, 5).forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.name} - Ruled by ${entry.ruler} (${entry.totalBattles} battles, $${entry.totalRevenue.toFixed(2)} revenue)`);
        });
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('\n💡 Key Features Demonstrated:');
        console.log('  ✅ Hierarchical authority system (Exile → King)');
        console.log('  ✅ Kingdom creation and management');
        console.log('  ✅ Quest system with battle predictions'); 
        console.log('  ✅ Reputation-based authority progression');
        console.log('  ✅ Democratic validation with weighted voting');
        console.log('  ✅ Revenue sharing and kingdom economics');
        console.log('  ✅ Reddit-style community governance');
        
        console.log('\n⚔️ The Kingdom Authority System is ready for production!');
    }
    
    async cleanup() {
        if (this.api) {
            await this.api.stop();
        }
    }
}

// Auto-run demo
if (require.main === module) {
    const demo = new KingdomAuthorityDemo();
    
    demo.initialize()
        .then(() => demo.runDemo())
        .then(() => demo.cleanup())
        .catch(error => {
            console.error('❌ Demo failed:', error);
            demo.cleanup();
            process.exit(1);
        });
}

module.exports = KingdomAuthorityDemo;