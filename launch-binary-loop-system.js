#!/usr/bin/env node

/**
 * 🚀🔄 BINARY LOOP SYSTEM LAUNCHER
 * 
 * One-command launcher for the complete integrated binary loop system
 */

import BinaryAnthropicLoopController from './binary-anthropic-loop-controller.js';

async function launchBinaryLoopSystem() {
    console.log(`
🚀🔄 LAUNCHING INTEGRATED BINARY LOOP SYSTEM
===========================================

Starting complete system with:
  🏛️ Archaeological Symbol Binary Bridge
  ⚙️ COBOL Mass Batch Orchestrator
  🔐 Binary Anthropic EncDec Pipeline
  🤖 Multi-AI Provider System
  👑 Boss/Character Hierarchy
  🎨 Canvas Drag & Drop Interface

Please wait while all systems initialize...
    `);
    
    try {
        // Create and start the controller
        const controller = new BinaryAnthropicLoopController(8888);
        
        // Start the server
        await controller.startServer();
        
        console.log(`
🎯 SYSTEM READY FOR BINARY LOOP OPERATIONS!

Quick Start Guide:
1. Open http://localhost:8888 in your browser
2. Drag & drop files or click buttons to start loops
3. Use boss commands to control the system
4. Watch characters gain experience through processing
5. Monitor real-time binary loop visualization

System Features Available:
  ✅ Complete binary loop processing
  ✅ Archaeological symbol encoding/decoding
  ✅ COBOL mass batch orchestration
  ✅ Multi-AI provider failover (Claude/GPT/Ollama)
  ✅ Boss hierarchy management
  ✅ Character experience tracking
  ✅ Real-time canvas visualization
  ✅ Government-grade audit trails
  ✅ Reptilian brain threat analysis

Press Ctrl+C to stop the system.
        `);
        
        // Graceful shutdown handler
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 Shutting down Binary Loop System...');
            
            try {
                // Cleanup COBOL orchestrator
                await controller.cobolOrchestrator.cleanup();
                console.log('✅ COBOL orchestrator cleaned up');
                
                // Close server
                if (controller.server) {
                    controller.server.close();
                    console.log('✅ HTTP server closed');
                }
                
                console.log('✅ Binary Loop System shutdown complete');
                process.exit(0);
                
            } catch (error) {
                console.error('❌ Error during shutdown:', error.message);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to launch Binary Loop System:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Ensure PostgreSQL is running (for COBOL orchestrator)');
        console.error('2. Check that port 8888 is available');
        console.error('3. Verify API keys are set in .env file');
        console.error('4. Run individual component tests first');
        
        process.exit(1);
    }
}

// Launch if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    launchBinaryLoopSystem();
}

export default launchBinaryLoopSystem;