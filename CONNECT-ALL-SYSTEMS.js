#!/usr/bin/env node

/**
 * 🔗 CONNECT ALL SYSTEMS
 * 
 * Bob the Builder meets SpongeBob SquarePants
 * Connect handshake → MCP → XML → character → gaming engine
 */

const WebSocket = require('ws');
const http = require('http');

class SystemConnector {
    constructor() {
        this.systems = {
            gaming: { port: 7777, status: 'unknown' },
            character: { port: 6969, status: 'unknown' },
            handshake: { port: 48009, status: 'unknown' },
            mcp: { port: 3000, status: 'unknown' }
        };
        
        this.connections = new Map();
        this.routingTable = new Map();
        
        console.log('🔗 SYSTEM CONNECTOR - Bob the Builder Edition');
        console.log('===========================================');
        console.log('🏗️ "Can we fix it? YES WE CAN!"');
        console.log('🧽 SpongeBob-level cartoon physics enabled');
        console.log('');
        
        this.init();
    }
    
    async init() {
        console.log('🔍 Scanning for active systems...');
        
        // Check what's actually running
        await this.scanSystems();
        
        // Connect systems that are up
        await this.connectSystems();
        
        // Set up routing
        await this.setupRouting();
        
        // Start monitoring and fixing
        this.startMonitoring();
        
        console.log('');
        console.log('🎯 SYSTEM CONNECTION REPORT:');
        for (const [name, system] of Object.entries(this.systems)) {
            const emoji = system.status === 'connected' ? '✅' : 
                         system.status === 'running' ? '🟡' : '❌';
            console.log(`   ${emoji} ${name.padEnd(12)} : ${system.status} (port ${system.port})`);
        }
    }
    
    async scanSystems() {
        for (const [name, system] of Object.entries(this.systems)) {
            try {
                const response = await this.httpPing(system.port);
                system.status = response ? 'running' : 'down';
                console.log(`   🔍 ${name}: ${system.status}`);
            } catch (error) {
                system.status = 'down';
                console.log(`   💀 ${name}: down`);
            }
        }
    }
    
    async httpPing(port) {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/',
                method: 'GET',
                timeout: 1000
            }, (res) => {
                resolve(true);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }
    
    async connectSystems() {
        console.log('🔗 Connecting systems...');
        
        // Connect to gaming engine
        if (this.systems.gaming.status === 'running') {
            await this.connectToGaming();
        }
        
        // Connect to character interface
        if (this.systems.character.status === 'running') {
            await this.connectToCharacter();
        }
        
        // Connect to handshake system
        if (this.systems.handshake.status === 'running') {
            await this.connectToHandshake();
        }
        
        // Start our own systems if needed
        await this.startMissingSystems();
    }
    
    async connectToGaming() {
        try {
            const ws = new WebSocket('ws://localhost:7777');
            
            ws.on('open', () => {
                console.log('   ✅ Connected to gaming engine');
                this.systems.gaming.status = 'connected';
                this.connections.set('gaming', ws);
                
                // Send test message
                ws.send(JSON.stringify({
                    type: 'system_connect',
                    system: 'connector',
                    message: 'Bob the Builder connected!'
                }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.routeMessage('gaming', message);
            });
            
            ws.on('error', (error) => {
                console.log('   ⚠️ Gaming engine connection error:', error.message);
            });
            
        } catch (error) {
            console.log('   ❌ Failed to connect to gaming engine');
        }
    }
    
    async connectToCharacter() {
        try {
            const ws = new WebSocket('ws://localhost:6969');
            
            ws.on('open', () => {
                console.log('   ✅ Connected to character interface');
                this.systems.character.status = 'connected';
                this.connections.set('character', ws);
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.routeMessage('character', message);
            });
            
        } catch (error) {
            console.log('   ❌ Failed to connect to character interface');
        }
    }
    
    async connectToHandshake() {
        try {
            const ws = new WebSocket('ws://localhost:48010'); // WebSocket port
            
            ws.on('open', () => {
                console.log('   ✅ Connected to handshake system');
                this.systems.handshake.status = 'connected';
                this.connections.set('handshake', ws);
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.routeMessage('handshake', message);
            });
            
        } catch (error) {
            console.log('   ⚠️ Handshake WebSocket not available, using HTTP');
        }
    }
    
    async startMissingSystems() {
        console.log('🚀 Starting missing systems...');
        
        // If gaming engine isn't running, that's critical
        if (this.systems.gaming.status === 'down') {
            console.log('   🚨 Gaming engine is down - this is the main system!');
            console.log('     Run: node WORKING-GAMING-ENGINE.js');
        }
        
        // If character system isn't running, start embedded
        if (this.systems.character.status === 'down') {
            console.log('   🤖 Starting embedded character system...');
            await this.startEmbeddedCharacter();
        }
        
        // MCP system is optional for now
        if (this.systems.mcp.status === 'down') {
            console.log('   📋 MCP system offline (optional)');
        }
    }
    
    async startEmbeddedCharacter() {
        // Simple embedded character that can connect to other systems
        this.embeddedCharacter = {
            eyes: { scanning: false, focus: null },
            ears: { listening: false },
            face: { expression: 'building' },
            hands: { swiping: false, gesture: 'hammer' },
            status: 'building_systems'
        };
        
        console.log('   ✅ Embedded character active');
        this.systems.character.status = 'embedded';
    }
    
    setupRouting() {
        console.log('🚏 Setting up message routing...');
        
        // Gaming ↔ Character routing
        this.routingTable.set('gaming→character', (message) => {
            if (message.type === 'player_moved' || message.type === 'character_action') {
                this.sendToSystem('character', {
                    type: 'game_update',
                    data: message.data
                });
            }
        });
        
        this.routingTable.set('character→gaming', (message) => {
            if (message.type === 'character_state' || message.type === 'character_action') {
                this.sendToSystem('gaming', {
                    type: 'character_update',
                    data: message.data
                });
            }
        });
        
        // Handshake → All systems
        this.routingTable.set('handshake→all', (message) => {
            if (message.type === 'agreement_signed' || message.type === 'verification_complete') {
                this.broadcastToAll({
                    type: 'handshake_update',
                    data: message.data,
                    source: 'handshake'
                });
            }
        });
        
        console.log('   ✅ Routing table configured');
    }
    
    routeMessage(source, message) {
        // Route based on message type and source
        const routeKey = `${source}→character`;
        const route = this.routingTable.get(routeKey);
        
        if (route) {
            route(message);
        }
        
        // Also try broadcasting important messages
        if (this.isImportantMessage(message)) {
            this.broadcastToAll({
                ...message,
                source: source,
                routed_at: Date.now()
            });
        }
    }
    
    isImportantMessage(message) {
        const importantTypes = [
            'player_moved',
            'character_action',
            'system_error',
            'agreement_signed',
            'verification_complete',
            'world_changed'
        ];
        
        return importantTypes.includes(message.type);
    }
    
    sendToSystem(systemName, message) {
        const connection = this.connections.get(systemName);
        
        if (connection && connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(message));
        } else if (systemName === 'character' && this.systems.character.status === 'embedded') {
            // Handle embedded character
            this.handleEmbeddedCharacterMessage(message);
        } else {
            console.log(`   ⚠️ Cannot send to ${systemName}: not connected`);
        }
    }
    
    broadcastToAll(message) {
        for (const [systemName, connection] of this.connections) {
            if (connection.readyState === WebSocket.OPEN) {
                try {
                    connection.send(JSON.stringify({
                        ...message,
                        broadcast: true,
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.log(`   ⚠️ Broadcast to ${systemName} failed:`, error.message);
                }
            }
        }
    }
    
    handleEmbeddedCharacterMessage(message) {
        if (message.type === 'game_update' && message.data) {
            // Update embedded character based on game state
            if (message.data.position) {
                console.log(`   🤖 Character moved to: ${JSON.stringify(message.data.position)}`);
            }
            
            if (message.data.action) {
                console.log(`   🤖 Character action: ${message.data.action}`);
                
                // Update embedded character state
                switch (message.data.action) {
                    case 'eye_scan':
                        this.embeddedCharacter.eyes.scanning = true;
                        setTimeout(() => {
                            this.embeddedCharacter.eyes.scanning = false;
                        }, 2000);
                        break;
                    case 'ear_listen':
                        this.embeddedCharacter.ears.listening = !this.embeddedCharacter.ears.listening;
                        break;
                    case 'hand_gesture':
                        this.embeddedCharacter.hands.swiping = true;
                        this.embeddedCharacter.hands.gesture = message.data.params?.gesture || 'wave';
                        setTimeout(() => {
                            this.embeddedCharacter.hands.swiping = false;
                        }, 1000);
                        break;
                }
            }
        }
    }
    
    startMonitoring() {
        console.log('👁️ Starting system monitoring...');
        
        setInterval(() => {
            this.checkSystemHealth();
        }, 5000); // Check every 5 seconds
        
        setInterval(() => {
            this.printStatus();
        }, 15000); // Status report every 15 seconds
    }
    
    checkSystemHealth() {
        let connectedSystems = 0;
        let totalSystems = 0;
        
        for (const [name, system] of Object.entries(this.systems)) {
            totalSystems++;
            if (system.status === 'connected' || system.status === 'embedded') {
                connectedSystems++;
            }
        }
        
        // Check individual connections
        for (const [systemName, connection] of this.connections) {
            if (connection.readyState !== WebSocket.OPEN) {
                console.log(`   🚨 Lost connection to ${systemName}, attempting reconnect...`);
                this.attemptReconnect(systemName);
            }
        }
        
        // Bob the Builder encouragement
        if (connectedSystems === totalSystems) {
            // All systems go!
        } else if (connectedSystems > 0) {
            // Some systems working
        } else {
            console.log('   🚨 All systems down! Bob needs help!');
        }
    }
    
    async attemptReconnect(systemName) {
        console.log(`   🔧 Attempting to reconnect to ${systemName}...`);
        
        // Remove old connection
        this.connections.delete(systemName);
        
        // Try to reconnect based on system type
        switch (systemName) {
            case 'gaming':
                await this.connectToGaming();
                break;
            case 'character':
                await this.connectToCharacter();
                break;
            case 'handshake':
                await this.connectToHandshake();
                break;
        }
    }
    
    printStatus() {
        console.log('');
        console.log('🏗️ BOB THE BUILDER STATUS REPORT');
        console.log('================================');
        
        const now = new Date().toISOString().slice(11, 19);
        console.log(`🕐 Time: ${now}`);
        
        let healthyCount = 0;
        for (const [name, system] of Object.entries(this.systems)) {
            const emoji = system.status === 'connected' ? '✅' : 
                         system.status === 'embedded' ? '🤖' :
                         system.status === 'running' ? '🟡' : '❌';
            console.log(`   ${emoji} ${name.padEnd(12)} : ${system.status}`);
            
            if (system.status === 'connected' || system.status === 'embedded') {
                healthyCount++;
            }
        }
        
        const totalSystems = Object.keys(this.systems).length;
        console.log(`📊 System Health: ${healthyCount}/${totalSystems} systems operational`);
        
        // Bob the Builder commentary
        if (healthyCount === totalSystems) {
            console.log('🎉 "Can we fix it? YES WE CAN!" - All systems go!');
        } else if (healthyCount > totalSystems / 2) {
            console.log('🔧 "Keep building!" - Most systems operational');
        } else {
            console.log('🚧 "We can fix it!" - Need more systems online');
        }
        
        console.log('');
    }
    
    // SpongeBob-style debugging
    debugSpongeBob(message) {
        const spongeBobSays = [
            "I'm ready!",
            "I can do it!",
            "Aha! I see the problem!",
            "Patrick, look at this!",
            "Gary, meow meow!",
            "Barnacles!",
            "Tartar sauce!"
        ];
        
        const randomSaying = spongeBobSays[Math.floor(Math.random() * spongeBobSays.length)];
        console.log(`🧽 SpongeBob: "${randomSaying}" - ${message}`);
    }
}

// Start the connector
if (require.main === module) {
    console.log('🏗️ Starting Bob the Builder System Connector...');
    console.log('🧽 With SpongeBob-level enthusiasm!');
    console.log('');
    
    new SystemConnector();
}

module.exports = SystemConnector;