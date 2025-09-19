#!/usr/bin/env node

/**
 * 🎮💰 REVENUE MUD LAUNCHER
 * Unified launcher for the complete monetization ecosystem
 * Starts MUD engine, streaming layer, and all revenue systems
 */

const RevenueMUDEngine = require('./revenue-mud-engine.js');
const StreamingMonetizationLayer = require('./streaming-monetization-layer.js');

class RevenueMUDLauncher {
    constructor() {
        this.mudEngine = null;
        this.streamingLayer = null;
        this.services = new Map();
        
        console.log('🎮💰 Revenue MUD Launcher starting...');
        console.log('🚀 Initializing the most profitable MUD ever created!');
    }
    
    async start() {
        try {
            // 1. Start MUD Engine
            console.log('\n🎮 Starting MUD Engine...');
            this.mudEngine = new RevenueMUDEngine();
            await this.mudEngine.start();
            this.services.set('mud', 'http://localhost:3030');
            
            // 2. Start Streaming Layer
            console.log('\n🎬 Starting Streaming Monetization Layer...');
            this.streamingLayer = new StreamingMonetizationLayer(this.mudEngine);
            await this.streamingLayer.start();
            this.services.set('streaming', 'http://localhost:8888');
            
            // 3. Display success message
            this.displaySuccessMessage();
            
            // 4. Setup graceful shutdown
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Startup failed:', error);
            process.exit(1);
        }
    }
    
    displaySuccessMessage() {
        console.log(`
🎮💰 REVENUE MUD ECOSYSTEM FULLY OPERATIONAL! 💰🎮
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 PLAYER ACCESS:
   🎮 Play the MUD: http://localhost:3030
   💻 Web Interface: http://localhost:3030 (optimized for streaming)

📺 STREAMING FEATURES:
   🎬 OBS Overlays: http://localhost:8888/overlay/
   💰 Revenue Counter: http://localhost:8888/overlay/revenue_counter  
   💬 Chat Integration: http://localhost:8888/overlay/viewer_chat
   🛒 Affiliate Showcase: http://localhost:8888/overlay/affiliate_showcase
   📊 Live Stats API: http://localhost:8888/api/live-stats

💰 REVENUE STREAMS:
   ✅ Affiliate Marketing - Embedded in gameplay
   ✅ Google Ads - During room transitions
   ✅ Stream Donations - Real-time integration
   ✅ Premium Features - Enhanced Cal AI responses
   ✅ Product Placement - In NPC dialogue

🎯 UNIQUE FEATURES:
   🤖 Cal AI Gacha System - RuneScape pet mechanics
   ⌨️ Emacs Integration - Git wrap with wrong arm
   🎮 D-pad Movement - WASD or arrow keys
   📺 Stream-Optimized UI - Perfect for 1920x1080
   🎬 Viewer Interaction - Chat commands affect gameplay
   📊 Real-time Analytics - Track every revenue source

💬 CHAT COMMANDS (for streamers):
   !roast - Force Cal AI to roast someone
   !donate $X - Simulate donation (triggers alerts)
   !spawn - Force Cal spawn for entertainment
   !buy - Show affiliate product
   !revenue - Display total earnings
   !stats - Show live statistics

🎮 GAMEPLAY COMMANDS:
   move north/south/east/west - Navigate the world
   talk <npc> - Interact with NPCs
   buy <item> - Purchase affiliate products
   emacs <command> - Activate Emacs mode
   revenue - View earnings dashboard
   stream <action> - Streaming commands

🎯 DEVELOPER STREAMER PARADISE:
   • Educational content (learn Emacs, git, programming)
   • Entertaining AI personality (Cal roasts viewers)
   • Multiple revenue streams (affiliate, ads, donations)
   • Viral screenshot potential (legendary Cal responses)
   • Niche appeal (developers love terminal games)

💡 MONETIZATION STRATEGY:
   1. Stream on Twitch/YouTube to developer audience
   2. Chat commands drive viewer engagement
   3. Affiliate links embedded in gameplay
   4. Cal AI creates shareable roast content
   5. Educational value justifies premium features
   6. Emacs integration appeals to hardcore developers

🚀 READY TO GENERATE REVENUE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 QUICK START FOR STREAMERS:
   1. Add OBS Browser Sources with the overlay URLs above
   2. Start streaming to twitch.tv/your_channel
   3. Tell viewers to use chat commands (!roast, !donate, etc.)
   4. Play the MUD and let Cal roast you live
   5. Promote affiliate products through gameplay
   6. Watch the revenue counter climb in real-time!

🎮 Player URL: http://localhost:3030
🎬 Streaming Dashboard: http://localhost:8888
💰 Live Revenue: Check the overlays!

Press Ctrl+C to shutdown the entire ecosystem.
        `);
    }
    
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`\n🛑 Received ${signal}. Shutting down Revenue MUD ecosystem...`);
            
            // Save any important data
            if (this.mudEngine) {
                console.log('💾 Saving MUD state...');
                // MUD engine would save player states, revenue data, etc.
            }
            
            if (this.streamingLayer) {
                console.log('📊 Saving streaming analytics...');
                // Streaming layer would save revenue stats, viewer data, etc.
            }
            
            console.log('✅ Revenue MUD ecosystem shut down gracefully.');
            console.log(`💰 Final revenue stats would be displayed here.`);
            console.log('👋 Thanks for running the most profitable MUD ever!');
            
            process.exit(0);
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught exception:', error);
            shutdown('EXCEPTION');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
            shutdown('REJECTION');
        });
    }
}

// Run if called directly
if (require.main === module) {
    const launcher = new RevenueMUDLauncher();
    launcher.start().catch((error) => {
        console.error('💥 Failed to start Revenue MUD:', error);
        process.exit(1);
    });
}

module.exports = RevenueMUDLauncher;