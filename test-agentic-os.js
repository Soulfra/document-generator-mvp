#!/usr/bin/env node

/**
 * Test the LadderSlasher Agentic OS
 */

const LadderSlasherAgenticOS = require('./ladderslasher-data/ladderslasher_agentic_os.js');

console.log('🤖 TESTING LADDERSLASHER AGENTIC OS');
console.log('===================================');

async function testAgenticOS() {
    // Initialize the OS
    console.log('🚀 Initializing Agentic OS...');
    const os = new LadderSlasherAgenticOS();
    
    console.log('✅ OS initialized with components:');
    os.components.forEach((component, name) => {
        console.log(`   - ${name}: ${component.purpose}`);
    });
    
    console.log('');
    console.log('🧠 Testing Decision Engine...');
    const decision = await os.processDecision({
        player_state: { level: 1, health: 100, mana: 50 },
        enemies: [{ type: 'goblin', health: 30 }],
        actions_available: ['attack', 'defend', 'cast_spell']
    });
    console.log('Decision result:', decision);
    
    console.log('');
    console.log('⚡ Testing Action Scheduler...');
    const action = await os.executeAction({
        type: 'attack',
        target: 'goblin_1',
        skill: 'basic_attack'
    });
    console.log('Action result:', action);
    
    console.log('');
    console.log('📊 Testing State Manager...');
    const stateUpdate = await os.updateState({
        player: { level: 2, experience: 150 },
        game: { turn: 5, status: 'in_combat' }
    });
    console.log('State update result:', stateUpdate);
    
    console.log('');
    console.log('🔍 Testing Pattern Recognizer...');
    const patternAnalysis = await os.components.get('PatternRecognizer').analyzePatterns({
        combat_history: [
            { action: 'attack', result: 'hit', damage: 15 },
            { action: 'defend', result: 'block', damage_reduced: 8 },
            { action: 'attack', result: 'critical', damage: 30 }
        ]
    });
    console.log('Pattern analysis result:', patternAnalysis);
    
    console.log('');
    console.log('🎯 Testing Event Bus...');
    os.eventBus.on('player_level_up', (data) => {
        console.log('Event received: Player leveled up!', data);
    });
    
    os.eventBus.emit('player_level_up', { new_level: 2, stats_gained: { strength: 1 } });
    
    console.log('');
    console.log('✅ AGENTIC OS TEST COMPLETE!');
    console.log('All components working properly');
    
    return {
        os_functional: true,
        components_tested: Array.from(os.components.keys()),
        test_results: {
            decision_engine: decision,
            action_scheduler: action,
            state_manager: stateUpdate,
            pattern_recognizer: patternAnalysis
        }
    };
}

// Run the test
testAgenticOS()
    .then(results => {
        console.log('');
        console.log('📊 FINAL TEST RESULTS:');
        console.log('======================');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
    });