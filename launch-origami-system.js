#!/usr/bin/env node

/**
 * ORIGAMI SYSTEM LAUNCHER
 * 
 * Launches the complete dual-mirror origami system with WebSocket broadcasting.
 * This demonstrates the full integration working together:
 * - Dual-mirror data processing
 * - Harmonic bot detection 
 * - Real-time WebSocket broadcasting
 * - Grand Exchange chat monitoring simulation
 */

const OrigamiWebSocketBroadcaster = require('./origami-websocket-broadcaster.js');
const { spawn } = require('child_process');
const path = require('path');

class OrigamiSystemLauncher {
    constructor() {
        this.broadcaster = null;
        this.isRunning = false;
        this.simulationInterval = null;
        
        console.log('🚀 Origami System Launcher');
        console.log('🪞📡 Starting complete dual-mirror origami system...\n');
    }
    
    async start() {
        try {
            // 1. Start WebSocket broadcaster
            console.log('📡 Starting WebSocket broadcaster...');
            this.broadcaster = new OrigamiWebSocketBroadcaster({
                port: 8081,
                enableBotAlerts: true,
                enableOrigamiStates: true,
                enableHarmonicAnalysis: true,
                enableGameIntegration: true
            });
            
            // 2. Set up event logging
            this.setupEventLogging();
            
            // 3. Wait for server to be ready
            await this.waitForServer();
            
            // 4. Start simulation
            this.startSimulation();
            
            // 5. Open monitoring interface
            this.openMonitoringInterface();
            
            this.isRunning = true;
            console.log('\n✅ Origami system fully operational!');
            console.log('📊 Monitoring interface: http://localhost:8081 (WebSocket)');
            console.log('📱 Open origami-websocket-client-demo.html in browser for live monitoring');
            console.log('🎮 Grand Exchange chat simulation running...');
            console.log('\nPress Ctrl+C to stop');
            
        } catch (error) {
            console.error('❌ Failed to start origami system:', error);
            process.exit(1);
        }
    }
    
    setupEventLogging() {
        // Log bot detections
        this.broadcaster.botDetector.on('bot:detected', (alert) => {
            console.log(`🚨 BOT DETECTED: ${(alert.probability * 100).toFixed(1)}% confidence`);
            console.log(`   ID: ${alert.id}`);
            console.log(`   Reasons: ${alert.reasons.join(', ')}`);
            console.log(`   Severity: ${alert.severity.toUpperCase()}\n`);
        });
        
        // Log origami processing
        this.broadcaster.origamiProcessor.on('mirrors:processed', (result) => {
            console.log(`📐 ORIGAMI PROCESSED: ${result.dataId}`);
            console.log(`   User Mirror Coherence: ${result.mirrors.userResult.coherenceScore.toFixed(3)}`);
            console.log(`   Admin Mirror Coherence: ${result.mirrors.adminResult.coherenceScore.toFixed(3)}`);
            console.log(`   Validation Score: ${result.validation.validationScore.toFixed(3)}`);
            console.log(`   Bot Probability: ${(result.validation.botProbability * 100).toFixed(1)}%\n`);
        });
        
        // Log WebSocket connections
        this.broadcaster.on('client:connected', (info) => {
            console.log(`📱 Client connected: ${info.clientId} (${info.activeConnections} active)`);
        });
        
        this.broadcaster.on('client:disconnected', (info) => {
            console.log(`📱 Client disconnected: ${info.clientId} (duration: ${(info.duration / 1000).toFixed(1)}s)`);
        });
    }
    
    async waitForServer() {
        return new Promise((resolve) => {
            // Simple check - wait for WebSocket server to be ready
            setTimeout(resolve, 2000);
        });
    }
    
    startSimulation() {
        console.log('🎮 Starting Grand Exchange chat simulation...\n');
        
        // Simulate various chat messages
        const chatMessages = [
            // Normal trading messages
            { player: 'TraderJoe42', message: 'Selling dragon bones 1200 each', type: 'normal' },
            { player: 'RunescapePro', message: 'WTB barrows gloves any stats?', type: 'normal' },
            { player: 'IronMiner99', message: 'Finally got my rune pickaxe! So happy :)', type: 'normal' },
            
            // Bot-like messages
            { player: 'GoldSeller123', message: 'cheap gold cheap gold cheap gold visit website.com', type: 'bot' },
            { player: 'AutoBot777', message: 'buy buy buy buy buy buy click here now', type: 'bot' },
            { player: 'SpamBot1', message: 'BEST PRICES BEST PRICES BEST PRICES GUARANTEED', type: 'bot' },
            
            // Suspicious but not clearly bot
            { player: 'QuickTrader', message: 'fast trade fast trade meet ge w301', type: 'suspicious' },
            { player: 'EasyMoney', message: 'making bank making bank easy money method', type: 'suspicious' },
            
            // More natural messages
            { player: 'CasualGamer', message: 'Anyone know if dragon claws are worth it for bossing?', type: 'normal' },
            { player: 'QuestMaster', message: 'Just finished Recipe for Disaster, such a long quest lol', type: 'normal' },
            { player: 'PKer2007', message: 'Got cleaned at the arena again... time to rebuild', type: 'normal' }
        ];
        
        let messageIndex = 0;
        
        // Send initial batch
        this.sendChatBatch(chatMessages, 5);
        
        // Continue simulation
        this.simulationInterval = setInterval(() => {
            // Rotate through messages
            const message = chatMessages[messageIndex % chatMessages.length];
            messageIndex++;
            
            // Sometimes send multiple messages at once (like a busy GE)
            const batchSize = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 1;
            this.sendChatBatch(chatMessages, batchSize);
            
        }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds
    }
    
    async sendChatBatch(messages, batchSize) {
        for (let i = 0; i < batchSize; i++) {
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            // Add some variation to player names
            const playerName = message.player + (Math.random() < 0.1 ? Math.floor(Math.random() * 100) : '');
            
            await this.broadcaster.processGrandExchangeChat({
                player: playerName,
                message: message.message,
                timestamp: Date.now(),
                world: 301 + Math.floor(Math.random() * 20), // Random world 301-320
                messageType: message.type
            });
            
            // Small delay between batch messages
            if (i < batchSize - 1) {
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            }
        }
    }
    
    openMonitoringInterface() {
        const clientPath = path.join(__dirname, 'origami-websocket-client-demo.html');
        
        console.log(`📱 To monitor live data, open: ${clientPath}`);
        console.log('📊 Or run: python -m http.server 8080 and visit http://localhost:8080/origami-websocket-client-demo.html');
        
        // Try to open in default browser (cross-platform)
        const opener = process.platform === 'darwin' ? 'open' : 
                      process.platform === 'win32' ? 'start' : 'xdg-open';
        
        try {
            spawn(opener, [clientPath], { detached: true, stdio: 'ignore' });
        } catch (error) {
            // Silently fail - user can open manually
        }
    }
    
    stop() {
        console.log('\n🛑 Stopping origami system...');
        
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        
        if (this.broadcaster && this.broadcaster.wss) {
            this.broadcaster.wss.close();
        }
        
        this.isRunning = false;
        console.log('✅ Origami system stopped');
    }
    
    showStats() {
        if (!this.broadcaster) return;
        
        const stats = this.broadcaster.getStats();
        console.log('\n📊 SYSTEM STATISTICS:');
        console.log(`   Connected Clients: ${stats.connectedClients}`);
        console.log(`   Messages Sent: ${stats.messagesSent}`);
        console.log(`   Data Streams Processed: ${stats.dataStreamsProcessed}`);
        console.log(`   Bots Detected: ${stats.botsDetected}`);
        console.log(`   Origami States Tracked: ${stats.origamiStatesTracked}`);
        console.log(`   Active Rooms: ${stats.activeRooms}`);
        console.log(`   Uptime: ${(stats.uptime / 60).toFixed(1)} minutes`);
        console.log(`   Memory Usage: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB\n`);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received shutdown signal...');
    if (launcher) {
        launcher.stop();
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    if (launcher) {
        launcher.stop();
    }
    process.exit(1);
});

// Main execution
const launcher = new OrigamiSystemLauncher();

// Show stats every 30 seconds
setInterval(() => {
    if (launcher.isRunning) {
        launcher.showStats();
    }
}, 30000);

// Start the system
launcher.start().catch((error) => {
    console.error('❌ Failed to start launcher:', error);
    process.exit(1);
});

// Export for programmatic use
module.exports = OrigamiSystemLauncher;