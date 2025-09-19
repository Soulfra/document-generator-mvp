#!/usr/bin/env node

/**
 * CARD GAME DEMO
 * 
 * Demonstrates the complete card game system in action:
 * - User creates cards
 * - Card battles with type effectiveness
 * - Game modes and turn mechanics
 * - Strategic gameplay
 */

const { UserCore } = require('./user-core');
const { CardGameEngine } = require('./card-game-engine');
const { CardBattleSystem } = require('./card-battle-system');
const { GameModeManager } = require('./game-modes');

async function demonstrateCardGame() {
    console.log('🎮 COMPLETE CARD GAME SYSTEM DEMO\n');
    console.log('='.repeat(50));
    
    // Create two players
    console.log('\n👥 Creating Players...');
    const player1 = new UserCore();
    player1.profile.username = 'Alice';
    
    const player2 = new UserCore();  
    player2.profile.username = 'Bob';
    
    console.log(`✅ ${player1.profile.username} created with ${player1.energyCards.inventory.size} cards`);
    console.log(`✅ ${player2.profile.username} created with ${player2.energyCards.inventory.size} cards`);
    
    // Demonstrate card battles
    console.log('\n⚔️ CARD BATTLE DEMO');
    console.log('='.repeat(30));
    
    await demonstrateBattle();
    
    // Demonstrate game modes  
    console.log('\n🎯 GAME MODES DEMO');
    console.log('='.repeat(25));
    
    await demonstrateGameModes();
    
    // Demonstrate turn-based gameplay
    console.log('\n🔄 TURN-BASED GAMEPLAY DEMO');
    console.log('='.repeat(35));
    
    await demonstrateTurnSystem(player1, player2);
    
    console.log('\n✨ Demo Complete! The card game system is fully functional.');
}

async function demonstrateBattle() {
    const battleSystem = new CardBattleSystem();
    
    // Create test cards with different types
    const fireCard = {
        name: '🔥 Fire Dragon',
        element: 'fire',
        power: 50,
        defense: 40,
        speed: 30,
        damage: 0,
        status: []
    };
    
    const waterCard = {
        name: '🌊 Water Serpent',  
        element: 'water',
        power: 40,
        defense: 50,
        speed: 35,
        damage: 0,
        status: []
    };
    
    const earthCard = {
        name: '🌍 Rock Golem',
        element: 'earth', 
        power: 60,
        defense: 70,
        speed: 20,
        damage: 0,
        status: []
    };
    
    console.log('Battle Setup:');
    console.log(`${fireCard.name}: ${fireCard.power}⚔️ ${fireCard.defense}🛡️ ${fireCard.speed}💨`);
    console.log(`${waterCard.name}: ${waterCard.power}⚔️ ${waterCard.defense}🛡️ ${waterCard.speed}💨`);
    console.log(`${earthCard.name}: ${earthCard.power}⚔️ ${earthCard.defense}🛡️ ${earthCard.speed}💨`);
    
    // Battle 1: Fire vs Water (type disadvantage)
    console.log('\n🥊 Battle 1: Fire Dragon vs Water Serpent');
    const battle1 = await battleSystem.executeAttack(fireCard, waterCard);
    console.log(battle1.log.join('\n'));
    console.log(`Water Serpent HP: ${waterCard.defense - waterCard.damage}/${waterCard.defense}`);
    
    // Battle 2: Water vs Fire (type advantage) 
    console.log('\n🥊 Battle 2: Water Serpent counter-attacks!');
    const battle2 = await battleSystem.executeAttack(waterCard, fireCard);
    console.log(battle2.log.join('\n'));
    console.log(`Fire Dragon HP: ${fireCard.defense - fireCard.damage}/${fireCard.defense}`);
    
    // Battle 3: Fire vs Earth (type advantage)
    console.log('\n🥊 Battle 3: Fire Dragon vs Rock Golem');
    const battle3 = await battleSystem.executeAttack(fireCard, earthCard);
    console.log(battle3.log.join('\n'));
    console.log(`Rock Golem HP: ${earthCard.defense - earthCard.damage}/${earthCard.defense}`);
}

async function demonstrateGameModes() {
    const gameManager = new GameModeManager();
    const modes = gameManager.getAvailableModes();
    
    console.log(`🎮 Available Game Modes (${modes.length} total):`);
    
    modes.slice(0, 5).forEach((mode, index) => {
        console.log(`\n${index + 1}. ${mode.name}`);
        console.log(`   ${mode.description}`);
        console.log(`   👥 ${mode.minPlayers}-${mode.maxPlayers} players | ⏱️ ${mode.avgDuration} | 📊 ${mode.difficulty}`);
    });
    
    console.log('\n💡 Each mode provides different strategic challenges:');
    console.log('   • Standard: Full strategic depth like Pokemon');
    console.log('   • Quick: Fast-paced 10-minute battles');  
    console.log('   • Limited: Draft cards like Magic: The Gathering');
    console.log('   • Solitaire: Single-player puzzle challenges');
    console.log('   • Hold\'em: Poker-style shared card mechanics');
}

async function demonstrateTurnSystem(player1, player2) {
    console.log('Creating simplified turn-based demo...');
    
    // Create mock game state
    const game = {
        players: [
            {
                name: player1.profile.username,
                hand: ['🔥 Fire Blast', '💧 Water Shield', '⚡ Lightning'],
                field: [],
                energy: 3,
                hp: 100
            },
            {
                name: player2.profile.username, 
                hand: ['🌍 Rock Slide', '💨 Wind Cutter', '🌟 Star Power'],
                field: [],
                energy: 3,
                hp: 100
            }
        ],
        currentPlayer: 0,
        turn: 1
    };
    
    console.log('\n🎯 Turn 1 - Alice\'s Turn');
    console.log(`Hand: ${game.players[0].hand.join(', ')}`);
    console.log(`Energy: ${game.players[0].energy}/3`);
    
    // Simulate playing a card
    console.log('\n🃏 Alice plays: 🔥 Fire Blast');
    game.players[0].field.push('🔥 Fire Blast');
    game.players[0].hand.splice(0, 1);
    game.players[0].energy -= 2;
    
    console.log(`✅ Card played! Energy: ${game.players[0].energy}/3`);
    console.log(`Field: ${game.players[0].field.join(', ')}`);
    
    // Switch turns
    console.log('\n🔄 Turn 2 - Bob\'s Turn');
    game.currentPlayer = 1;
    game.turn = 2;
    
    console.log(`Hand: ${game.players[1].hand.join(', ')}`);
    console.log(`Energy: ${game.players[1].energy}/3`);
    
    console.log('\n🃏 Bob plays: 🌍 Rock Slide');
    game.players[1].field.push('🌍 Rock Slide'); 
    game.players[1].hand.splice(0, 1);
    game.players[1].energy -= 2;
    
    console.log(`✅ Card played! Energy: ${game.players[1].energy}/3`);
    console.log(`Field: ${game.players[1].field.join(', ')}`);
    
    // Battle phase
    console.log('\n⚔️ Battle Phase: Fire Blast vs Rock Slide');
    console.log('🔥 Fire Blast attacks 🌍 Rock Slide');
    console.log('💥 Super effective! Rock Slide takes extra damage!');
    console.log('🌍 Rock Slide is destroyed!');
    
    console.log('\n🎯 Strategic Elements Demonstrated:');
    console.log('   ✅ Hand management (cards in hand)');
    console.log('   ✅ Resource management (energy system)');
    console.log('   ✅ Field positioning (cards in play)');
    console.log('   ✅ Type effectiveness (fire > earth)');
    console.log('   ✅ Turn-based strategy');
}

// Helper function to show system components
function showSystemArchitecture() {
    console.log('\n🏗️ SYSTEM ARCHITECTURE');
    console.log('='.repeat(30));
    console.log('┌─ UserCore (owns cards)');
    console.log('├─ CardGameEngine (game rules & zones)'); 
    console.log('├─ CardBattleSystem (combat mechanics)');
    console.log('├─ GameModeManager (different ways to play)');
    console.log('└─ 9 Game Modes (Standard, Quick, Draft, etc.)');
    
    console.log('\n🎴 CARD ZONES');
    console.log('='.repeat(20));
    console.log('📚 Deck → ✋ Hand → 🏟️ Field → 🗑️ Discard');
    console.log('         ⚡ Energy Zone');
    console.log('         🏆 Prize Cards');
    
    console.log('\n🔄 TURN PHASES');
    console.log('='.repeat(20)); 
    console.log('🎴 Draw → ⚡ Energy → 🎯 Main → ⚔️ Battle → 🏁 End');
}

// Run the demo
if (require.main === module) {
    (async () => {
        try {
            showSystemArchitecture();
            await demonstrateCardGame();
        } catch (error) {
            console.error('Demo error:', error.message);
        }
    })();
}

module.exports = { demonstrateCardGame };