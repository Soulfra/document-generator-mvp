#!/usr/bin/env node

/**
 * SIMULATE GAME ACTIVITY
 * Demonstrates how games train AI in the background
 */

const axios = require('axios');

const gameEvents = [
    { type: 'bug_fixed', bugType: 'memory_leak', fixTime: 23.5, reward: 500 },
    { type: 'bug_fixed', bugType: 'css_broken', fixTime: 15.2, reward: 300 },
    { type: 'level_completed', level: 1, score: 8500, time: 120 },
    { type: 'achievement_unlocked', achievement: 'Bug Squasher', points: 1000 },
    { type: 'bug_fixed', bugType: 'api_timeout', fixTime: 45.8, reward: 750 },
    { type: 'level_completed', level: 2, score: 12500, time: 180 },
    { type: 'bug_fixed', bugType: 'null_pointer', fixTime: 18.3, reward: 400 },
    { type: 'achievement_unlocked', achievement: 'Speed Demon', points: 2000 }
];

const players = ['alice_gamer', 'bob_dev', 'charlie_tester', 'dana_pro'];

async function simulateGameActivity() {
    console.log('🎮 Starting game simulation...');
    console.log('🧠 Training AI with player actions...\n');
    
    for (let i = 0; i < 20; i++) {
        const event = gameEvents[Math.floor(Math.random() * gameEvents.length)];
        const player = players[Math.floor(Math.random() * players.length)];
        
        const gameEvent = {
            ...event,
            playerId: player,
            sessionId: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
        };
        
        try {
            // Send to Gaming AI Bridge
            await axios.post('http://localhost:9901/game-event', gameEvent);
            
            console.log(`✅ ${player} - ${event.type}: ${JSON.stringify(event).substring(0, 50)}...`);
            
            // Random delay between events
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        } catch (error) {
            console.error('❌ Failed to send event:', error.message);
        }
    }
    
    // Check training status
    console.log('\n📊 Checking training results...\n');
    
    try {
        const status = await axios.get('http://localhost:9901/training-status');
        console.log('Training Metrics:', JSON.stringify(status.data.metrics, null, 2));
        console.log('\nTop Contributors:');
        status.data.topContributors.forEach((contributor, index) => {
            console.log(`${index + 1}. ${contributor.playerId}: ${contributor.learningContribution.toFixed(2)} contribution points`);
        });
    } catch (error) {
        console.error('Failed to get training status:', error.message);
    }
}

simulateGameActivity().catch(console.error);