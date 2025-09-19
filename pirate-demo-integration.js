#!/usr/bin/env node

/**
 * 🏴‍☠️ PIRATE STORYTELLING ENGINE DEMO
 * 
 * Demonstrates integration with existing components:
 * - RuneScape Lore Mapper
 * - Storytelling Engine
 * - Cross Reference Engine
 * - Magic Cleanup Wizard
 */

import PirateStorytellingEngine from './pirate-storytelling-engine.js';

async function demonstratePirateIntegration() {
    console.log('🏴‍☠️ PIRATE STORYTELLING ENGINE INTEGRATION DEMO\n');
    
    const pirateEngine = new PirateStorytellingEngine();
    
    // Wait for initialization
    await new Promise(resolve => {
        pirateEngine.on('world:initialized', () => {
            console.log('✅ Pirate world initialized successfully!\n');
            resolve();
        });
    });
    
    console.log('🔍 RUNESCAPE PATTERN ADAPTATION:');
    console.log('   SOTE Crystal Seeds → Cursed Doubloons (treasure integrity)');
    console.log('   Elven Navigation → Sea Chart Reading (safe passages)');
    console.log('   Mourner Deception → Navy Infiltration (identity detection)');
    console.log('   Temple Puzzles → X Marks the Spot (riddle solving)');
    console.log('   Infernal Challenges → Kraken Trials (boss mechanics)\n');
    
    // Generate sample wiki learning data
    const mockWikiData = {
        quests: [
            {
                name: 'Song of the Elves',
                stages: ['Introduction', 'Investigation', 'Temple Puzzles', 'Boss Fight', 'Resolution'],
                rewards: ['Crystal equipment', 'Access to Prifddinas'],
                requirements: { combat: 70, questing: 50 },
                dialogue: 'Greetings, adventurer. The time has come to reclaim our homeland.'
            }
        ],
        npcs: [
            {
                name: 'Arianwyn',
                dialogue: 'The corruption spreads, but hope remains. Will ye help us?',
                personality: 'wise_mentor'
            }
        ],
        items: [
            {
                name: 'Crystal Seed',
                rarity: 'rare',
                effects: ['Data integrity', 'Corruption protection'],
                examine_text: 'A perfect crystal that maintains its form',
                quest_item: true
            }
        ]
    };
    
    console.log('📚 WIKI LEARNING DEMONSTRATION:');
    await pirateEngine.learnFromWiki(mockWikiData);
    
    console.log('\n🎮 QUEST GENERATION USING LEARNED PATTERNS:');
    
    // Generate different types of quests
    const treasureQuest = await pirateEngine.generatePirateQuest('treasure_hunt');
    const combatQuest = await pirateEngine.generatePirateQuest('naval_combat');
    const legendaryQuest = await pirateEngine.generatePirateQuest('legendary_treasure');
    
    console.log('\n📜 Generated Quests:');
    console.log(`   1. ${treasureQuest.name} (${treasureQuest.type})`);
    console.log(`      Difficulty: ${treasureQuest.difficulty}/5`);
    console.log(`      Stages: ${treasureQuest.stages.length}`);
    console.log(`      Rewards: ${treasureQuest.rewards.items.map(i => i.name).join(', ')}`);
    
    console.log(`   2. ${combatQuest.name} (${combatQuest.type})`);
    console.log(`      Mechanics: ${combatQuest.mechanics.combat.special_attacks}`);
    
    console.log(`   3. ${legendaryQuest.name} (${legendaryQuest.type})`);
    console.log(`      Special: ${legendaryQuest.specialMechanics?.crystalSeedEquivalent.name}`);
    
    console.log('\n⚔️ WORLD EVENT SYSTEM:');
    const event = await pirateEngine.createDynamicWorldEvent();
    console.log(`   Event: ${event.description}`);
    console.log(`   Duration: ${event.duration / 60000} minutes`);
    console.log(`   Story Impact: ${event.effects.storyHook}`);
    
    console.log('\n⛵ SHIP CREATION WITH PERSONALITY:');
    const ships = [
        pirateEngine.createShip({ name: 'Cursed Revenge', type: 'frigate', captain: 'player' }),
        pirateEngine.createShip({ name: 'Swift Fortune', type: 'sloop', captain: 'AI' }),
        pirateEngine.createShip({ name: 'Ghost Maiden', type: 'brigantine', captain: 'phantom' })
    ];
    
    ships.forEach(ship => {
        console.log(`   ${ship.name} (${ship.type})`);
        console.log(`     Personality: ${ship.personality.join(', ')}`);
        console.log(`     Special: ${ship.cursed ? 'Cursed' : ''} ${ship.treasureMap ? 'Has Hidden Map' : ''}`);
        console.log(`     Abilities: ${ship.specialAbilities.join(', ')}`);
    });
    
    console.log('\n🔗 COMPONENT INTEGRATION EXAMPLES:');
    console.log('   📊 CrossReferenceEngine: Connect related treasure quests');
    console.log('   🧙‍♂️ MagicCleanupWizard: Organize generated quest content');
    console.log('   🏛️ RuneScapeLoreMapper: Adapt trap patterns for naval hazards');
    console.log('   📖 StorytellingEngine: Enhance narratives with pirate themes');
    
    console.log('\n🎯 ADAPTIVE MECHANICS SHOWCASE:');
    console.log('   RuneScape Prayer → Sea Shanties (combat buffs)');
    console.log('   RuneScape Agility → Rigging Climbing (ship navigation)');
    console.log('   RuneScape Thieving → Tavern Pickpocketing (information gathering)');
    console.log('   RuneScape Construction → Ship Building (vessel customization)');
    console.log('   NEW: Sailing Skill → Advanced Navigation & Sea Mastery');
    
    console.log('\n🌊 FINAL SYSTEM REPORT:');
    const report = await pirateEngine.generateStorytellingReport();
    
    console.log(`   Total Seas: ${report.worldState.seas} (each with unique properties)`);
    console.log(`   Total Islands: ${report.worldState.islands} (procedurally generated)`);
    console.log(`   Active Factions: ${report.worldState.activeFactions} (dynamic relationships)`);
    console.log(`   Legendary Characters: ${report.characters.total} (with deep backstories)`);
    console.log(`   Generated Quests: ${report.quests.total} (RuneScape-inspired mechanics)`);
    console.log(`   Player Ships: ${report.ships.playerOwned} (with unique personalities)`);
    
    if (report.currentSaga) {
        console.log(`   Current Saga: "${report.currentSaga.title}"`);
        console.log(`     Chapters: ${report.currentSaga.chapters}`);
        console.log(`     Player Choices: ${report.currentSaga.playerChoices}`);
    }
    
    console.log('\n🏴‍☠️ PIRATE ENGINE CAPABILITIES:');
    console.log('   ✅ Learns from RuneScape wiki data');
    console.log('   ✅ Adapts SOTE/Infernal mechanics to pirate themes');
    console.log('   ✅ Generates dynamic quests with moral choices');
    console.log('   ✅ Creates living world with faction relationships');
    console.log('   ✅ Integrates with existing component database');
    console.log('   ✅ Produces ships with unique personalities');
    console.log('   ✅ Manages ongoing sagas with player impact');
    console.log('   ✅ Creates temporal world events');
    
    console.log('\n⚓ Ready to build an entire pirate game from your existing components!');
    console.log('🦜 The parrot approves: "Squawk! This be worthy of Davy Jones himself!"');
}

// Run the demonstration
demonstratePirateIntegration().catch(console.error);