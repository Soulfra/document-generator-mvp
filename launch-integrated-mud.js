#!/usr/bin/env node

/**
 * 🎮⚔️ INTEGRATED MUD LAUNCHER
 * Starts the Revenue MUD with full boss battle and economy integration
 */

const RevenueMUDEngine = require('./revenue-mud-engine.js');
const StreamingMonetizationLayer = require('./streaming-monetization-layer.js');

async function launchIntegratedSystem() {
    console.log('🚀 Launching Integrated MUD System...\n');
    
    try {
        // Initialize MUD Engine
        const mudEngine = new RevenueMUDEngine();
        
        // Initialize Streaming Layer
        const streamLayer = new StreamingMonetizationLayer(mudEngine);
        
        // Store reference for boss integration
        mudEngine.streamingData.streamingLayer = streamLayer;
        
        // Start MUD (this will initialize boss integration)
        await mudEngine.start();
        
        // Start streaming layer
        streamLayer.start();
        
        console.log(`
⚔️🎮💰 COMPLETE SYSTEM ONLINE! 💰🎮⚔️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 GAME ACCESS:
   • MUD Game: http://localhost:3030
   • Web Interface: http://localhost:3030
   • WebSocket: ws://localhost:3030

🎬 STREAMING INTEGRATION:
   • Streaming Server: http://localhost:8888
   • Revenue Counter: http://localhost:8888/overlay/revenue_counter
   • Chat Integration: http://localhost:8888/overlay/viewer_chat
   • Donation Alerts: http://localhost:8888/overlay/donation_alerts

⚔️ BOSS BATTLES:
   • Automatic boss spawns in special rooms
   • Multi-currency rewards (bits/tokens/coins/shards)
   • Viewer participation via chat commands
   • Loot drops with rarity system (common → mythic)

🎮 GAME COMMANDS:
   • Basic: move, look, talk, help
   • Combat: join, attack, boss, flee
   • Economy: wallet, exchange, take
   • Social: say, emacs, stream

💬 VIEWER COMMANDS:
   • !cheer <bits> - Boost player damage
   • !heal - Heal random player
   • !sabotage - Weaken boss
   • !buff - Boost all players

🗺️ BOSS LOCATIONS:
   • 🐛 Debug Chamber (northeast from spawn)
   • ⚡ Repository Core (east from debug chamber)
   • 💻 Terminal Nexus (north from repository)
   • 🛡️ Cal's Shrine (west from terminal nexus)

🎯 HOW TO TRIGGER BOSSES:
   • Explore boss rooms frequently
   • Use 'emacs' commands (15% chance)
   • Use 'debug' commands (25% chance)
   • General activity in boss rooms

Perfect for streaming developer content with audience participation!
        `);
        
    } catch (error) {
        console.error('❌ Failed to launch integrated system:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down integrated system...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
    process.exit(1);
});

// Launch the system
launchIntegratedSystem();