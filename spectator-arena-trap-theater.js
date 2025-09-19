#!/usr/bin/env node

/**
 * 🎭 SPECTATOR ARENA TRAP THEATER
 * Watch others build their own trap-filled games in real-time
 * Like the Mime random event meets TzHaar Fight Pits meets Theodore Roosevelt's "Man in the Arena"
 * Includes claw machine and gacha mechanics for capturing other builders' creations
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const net = require('net');
const fs = require('fs');
const path = require('path');

class SpectatorArenaTrapTheater {
    constructor() {
        this.theaterId = crypto.randomUUID();
        this.port = null;
        this.wsPort = null;
        
        // Arena state
        this.arenaState = {
            id: this.theaterId,
            name: 'Spectator Arena Trap Theater',
            mode: 'OBSERVATION_MODE',
            
            // Active builders being watched
            builders: new Map(),
            
            // Spectator data
            spectators: new Map(),
            
            // Trap collections from other builders
            capturedTraps: new Map(),
            
            // Claw machine state
            clawMachine: {
                credits: 100,
                position: { x: 400, y: 300 },
                clawOpen: true,
                captureAttempts: 0,
                successRate: 0.3
            },
            
            // Gacha system
            gachaSystem: {
                pulls: 0,
                pityCounter: 0,
                rarityTiers: {
                    'LEGENDARY': 0.01,  // 1% - Complete boss layer systems
                    'EPIC': 0.05,       // 5% - Advanced trap mechanisms  
                    'RARE': 0.15,       // 15% - Complex traps
                    'COMMON': 0.79      // 79% - Basic traps
                },
                collection: new Map()
            }
        };
        
        // Theodore Roosevelt quote for inspiration
        this.arenaQuote = "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood...";
        
        // Mime show mechanics
        this.mimeShow = {
            currentAct: null,
            audience: new Map(),
            performances: [],
            emotes: ['wave', 'dance', 'cry', 'think', 'panic', 'cheer']
        };
        
        // Simulated builders (like NPCs building their own trap systems)
        this.simulatedBuilders = [
            {
                id: 'builder_dharok',
                name: 'DharokTheBuilder',
                style: 'aggressive',
                currentLayer: 'Smart Orchestrator',
                trapsBuilt: 0,
                specialty: 'hidden_mechanics'
            },
            {
                id: 'builder_ahrim',
                name: 'AhrimTheArchitect', 
                style: 'magical',
                currentLayer: 'XML Handshake',
                trapsBuilt: 0,
                specialty: 'data_siphons'
            },
            {
                id: 'builder_karil',
                name: 'KarilTheKoder',
                style: 'ranged',
                currentLayer: 'Creative Commons',
                trapsBuilt: 0,
                specialty: 'licensing_traps'
            },
            {
                id: 'builder_torag',
                name: 'ToragTheTinkerer',
                style: 'defensive',
                currentLayer: 'Bloomberg Terminal',
                trapsBuilt: 0,
                specialty: 'empire_traps'
            },
            {
                id: 'builder_verac',
                name: 'VeracTheVicious',
                style: 'piercing',
                currentLayer: 'Tycoon Empire',
                trapsBuilt: 0,
                specialty: 'power_escalation'
            },
            {
                id: 'builder_guthan',
                name: 'GuthanTheGlitcher',
                style: 'healing',
                currentLayer: 'Veil Piercing',
                trapsBuilt: 0,
                specialty: 'veil_traps'
            }
        ];
        
        // Theater viewing angles
        this.viewingAngles = {
            'OVERVIEW': { x: 0, y: 1000, z: 1000, rotation: -45 },
            'BUILDER_FOCUS': { x: 0, y: 500, z: 500, rotation: -30 },
            'TRAP_CLOSEUP': { x: 0, y: 200, z: 200, rotation: 0 },
            'ARENA_WIDE': { x: 0, y: 2000, z: 2000, rotation: -60 },
            'CLAW_MACHINE': { x: 400, y: 300, z: 100, rotation: -90 }
        };
        
        // Current camera position
        this.camera = { ...this.viewingAngles.OVERVIEW };
        
        console.log(`🎭 Spectator Arena Trap Theater initialized`);
        console.log(`🎪 Theater ID: ${this.theaterId}`);
        console.log(`👁️ Ready to observe builders in the arena`);
    }
    
    async initialize() {
        console.log('🎬 Initializing Spectator Arena Trap Theater...');
        
        // Allocate ports
        await this.allocatePorts();
        
        // Start theater server
        this.startTheaterServer();
        
        // Start WebSocket for live updates
        this.startSpectatorWebSocket();
        
        // Initialize simulated builders
        this.initializeSimulatedBuilders();
        
        // Start the show
        this.startTheaterShow();
        
        console.log('\\n✅ SPECTATOR ARENA TRAP THEATER OPERATIONAL!');
        console.log(`🎭 Theater Interface: http://localhost:${this.port}`);
        console.log(`📡 Live Updates: ws://localhost:${this.wsPort}`);
        console.log(`🎪 Watch builders create trap systems in real-time`);
        console.log(`🎰 Use gacha/claw machine to capture their creations`);
        
        return this;
    }
    
    async allocatePorts() {
        this.port = await this.findAvailablePort(9100);
        this.wsPort = await this.findAvailablePort(9101);
        console.log(`🎬 Allocated ports - HTTP: ${this.port}, WebSocket: ${this.wsPort}`);
    }
    
    async findAvailablePort(preferredPort) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(preferredPort, '127.0.0.1', () => {
                const port = server.address().port;
                server.close(() => resolve(port));
            });
            
            server.on('error', () => {
                this.findAvailablePort(preferredPort + 1).then(resolve);
            });
        });
    }
    
    initializeSimulatedBuilders() {
        console.log('🏗️ Initializing simulated builders...');
        
        for (const builder of this.simulatedBuilders) {
            this.arenaState.builders.set(builder.id, {
                ...builder,
                status: 'BUILDING',
                currentAction: 'Planning trap layout',
                progress: 0,
                trapsInProgress: [],
                completedTraps: [],
                buildSpeed: Math.random() * 2 + 1, // 1-3x speed
                creativity: Math.random() * 0.5 + 0.5 // 50-100% creativity
            });
            
            console.log(`  🏗️ ${builder.name} entered the arena`);
        }
    }
    
    startTheaterShow() {
        console.log('🎪 Starting the theater show...');
        
        // Main show loop - builders work on their trap systems
        setInterval(() => {
            this.updateBuilders();
            this.broadcastArenaState();
        }, 1000); // Update every second
        
        // Mime show performances
        setInterval(() => {
            this.performMimeAct();
        }, 30000); // New mime act every 30 seconds
        
        // Random events
        setInterval(() => {
            this.triggerRandomEvent();
        }, 60000); // Random event every minute
    }
    
    updateBuilders() {
        for (const [builderId, builder] of this.arenaState.builders) {
            // Update builder progress
            builder.progress += builder.buildSpeed * 2;
            
            // Builder state machine
            if (builder.progress >= 100) {
                // Complete current trap
                const trap = this.generateTrapForBuilder(builder);
                builder.completedTraps.push(trap);
                builder.trapsBuilt++;
                builder.progress = 0;
                
                // Update action
                const actions = [
                    'Designing new trap mechanism',
                    'Testing trap triggers',
                    'Adding obfuscation layers',
                    'Implementing boss mechanics',
                    'Creating trap variations',
                    'Debugging trap logic'
                ];
                builder.currentAction = actions[Math.floor(Math.random() * actions.length)];
                
                // Broadcast trap completion
                this.broadcastEvent({
                    type: 'trap_completed',
                    builder: builder.name,
                    trap: trap
                });
            }
            
            // Random builder interactions
            if (Math.random() < 0.05) {
                this.performBuilderInteraction(builder);
            }
        }
    }
    
    generateTrapForBuilder(builder) {
        const trapTypes = {
            'hidden_mechanics': ['Process Fork Bomb', 'Eval Injection', 'Memory Leak Spiral'],
            'data_siphons': ['Cookie Stealer', 'LocalStorage Miner', 'Session Hijacker'],
            'licensing_traps': ['Revenue Loop', 'Attribution Bomb', 'License Virus'],
            'empire_traps': ['Hostile Takeover', 'Market Crasher', 'Monopoly Lock'],
            'power_escalation': ['Tier Explosion', 'Power Multiplier', 'Control Amplifier'],
            'veil_traps': ['Reality Breach', 'Meta Loop', 'Dimension Shifter']
        };
        
        const possibleTraps = trapTypes[builder.specialty] || ['Generic Trap'];
        const trapName = possibleTraps[Math.floor(Math.random() * possibleTraps.length)];
        
        return {
            id: crypto.randomUUID(),
            name: trapName,
            builder: builder.name,
            type: builder.specialty,
            layer: builder.currentLayer,
            severity: this.calculateTrapRarity(),
            creativity: builder.creativity,
            timestamp: Date.now(),
            code: this.generateMockTrapCode(trapName)
        };
    }
    
    calculateTrapRarity() {
        const roll = Math.random();
        if (roll < 0.01) return 'LEGENDARY';
        if (roll < 0.06) return 'EPIC';
        if (roll < 0.21) return 'RARE';
        return 'COMMON';
    }
    
    generateMockTrapCode(trapName) {
        // Generate fake code snippets for visual effect
        const templates = [
            `function ${trapName.replace(/\s/g, '')}() {\n  // Malicious code here\n  while(true) { power *= 2; }\n}`,
            `const trap = new ${trapName.replace(/\s/g, '')}({\n  severity: 'EXTREME',\n  hidden: true\n});`,
            `setInterval(() => {\n  escalatePower();\n  breachReality();\n}, 100);`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    performBuilderInteraction(builder) {
        const interactions = [
            { action: 'waves at spectators', emote: 'wave' },
            { action: 'does victory dance', emote: 'dance' },
            { action: 'scratches head in confusion', emote: 'think' },
            { action: 'panics about a bug', emote: 'panic' },
            { action: 'cheers at successful trap', emote: 'cheer' }
        ];
        
        const interaction = interactions[Math.floor(Math.random() * interactions.length)];
        
        this.broadcastEvent({
            type: 'builder_interaction',
            builder: builder.name,
            action: interaction.action,
            emote: interaction.emote
        });
    }
    
    performMimeAct() {
        const acts = [
            {
                name: 'The Invisible Wall',
                description: 'Mime demonstrates the invisible barriers between layers',
                duration: 5000
            },
            {
                name: 'Trapped in a Box',
                description: 'Mime shows what it\'s like to be caught in a recursive trap',
                duration: 7000
            },
            {
                name: 'Pulling the Rope',
                description: 'Mime pulls spectators into the arena metaphorically',
                duration: 6000
            },
            {
                name: 'Walking Against Wind',
                description: 'Mime fights against the power escalation forces',
                duration: 8000
            }
        ];
        
        const act = acts[Math.floor(Math.random() * acts.length)];
        this.mimeShow.currentAct = act;
        
        this.broadcastEvent({
            type: 'mime_performance',
            act: act
        });
        
        setTimeout(() => {
            this.mimeShow.currentAct = null;
        }, act.duration);
    }
    
    triggerRandomEvent() {
        const events = [
            {
                type: 'trap_malfunction',
                description: 'A trap backfires on its builder!',
                effect: () => {
                    const builders = Array.from(this.arenaState.builders.values());
                    const victim = builders[Math.floor(Math.random() * builders.length)];
                    victim.progress = Math.max(0, victim.progress - 50);
                    return { victim: victim.name };
                }
            },
            {
                type: 'collaborative_build',
                description: 'Two builders team up!',
                effect: () => {
                    const builders = Array.from(this.arenaState.builders.values());
                    if (builders.length >= 2) {
                        const b1 = builders[Math.floor(Math.random() * builders.length)];
                        const b2 = builders[Math.floor(Math.random() * builders.length)];
                        if (b1.id !== b2.id) {
                            b1.buildSpeed *= 1.5;
                            b2.buildSpeed *= 1.5;
                            setTimeout(() => {
                                b1.buildSpeed /= 1.5;
                                b2.buildSpeed /= 1.5;
                            }, 30000);
                            return { team: [b1.name, b2.name] };
                        }
                    }
                    return null;
                }
            },
            {
                type: 'inspiration_strike',
                description: 'A builder has a breakthrough!',
                effect: () => {
                    const builders = Array.from(this.arenaState.builders.values());
                    const inspired = builders[Math.floor(Math.random() * builders.length)];
                    inspired.creativity = Math.min(1, inspired.creativity + 0.2);
                    return { builder: inspired.name };
                }
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        const result = event.effect();
        
        if (result) {
            this.broadcastEvent({
                type: 'random_event',
                event: event.type,
                description: event.description,
                details: result
            });
        }
    }
    
    // Claw machine mechanics
    attemptClawCapture(targetTrap) {
        const success = Math.random() < this.arenaState.clawMachine.successRate;
        
        if (success && this.arenaState.clawMachine.credits > 0) {
            this.arenaState.clawMachine.credits--;
            this.arenaState.clawMachine.captureAttempts++;
            
            // Add to captured collection
            this.arenaState.capturedTraps.set(targetTrap.id, {
                ...targetTrap,
                capturedAt: Date.now(),
                captureMethod: 'claw_machine'
            });
            
            return {
                success: true,
                trap: targetTrap,
                creditsRemaining: this.arenaState.clawMachine.credits
            };
        }
        
        this.arenaState.clawMachine.credits--;
        return {
            success: false,
            creditsRemaining: this.arenaState.clawMachine.credits
        };
    }
    
    // Gacha system
    performGachaPull() {
        this.arenaState.gachaSystem.pulls++;
        this.arenaState.gachaSystem.pityCounter++;
        
        // Pity system - guaranteed epic+ after 50 pulls
        let roll = Math.random();
        if (this.arenaState.gachaSystem.pityCounter >= 50) {
            roll = Math.min(roll, 0.05); // Force epic or better
            this.arenaState.gachaSystem.pityCounter = 0;
        }
        
        // Determine rarity
        let rarity = 'COMMON';
        if (roll < 0.01) rarity = 'LEGENDARY';
        else if (roll < 0.06) rarity = 'EPIC';
        else if (roll < 0.21) rarity = 'RARE';
        
        // Get random trap from builders
        const allTraps = [];
        for (const builder of this.arenaState.builders.values()) {
            allTraps.push(...builder.completedTraps);
        }
        
        if (allTraps.length === 0) {
            return { error: 'No traps available yet' };
        }
        
        // Filter by rarity
        const matchingTraps = allTraps.filter(t => t.severity === rarity);
        const selectedTrap = matchingTraps.length > 0 
            ? matchingTraps[Math.floor(Math.random() * matchingTraps.length)]
            : allTraps[Math.floor(Math.random() * allTraps.length)];
        
        // Add to collection
        const gachaResult = {
            ...selectedTrap,
            id: crypto.randomUUID(),
            rarity: rarity,
            pulledAt: Date.now(),
            pullNumber: this.arenaState.gachaSystem.pulls
        };
        
        this.arenaState.gachaSystem.collection.set(gachaResult.id, gachaResult);
        
        return {
            success: true,
            pull: gachaResult,
            totalPulls: this.arenaState.gachaSystem.pulls
        };
    }
    
    broadcastArenaState() {
        this.broadcast({
            type: 'arena_update',
            builders: Array.from(this.arenaState.builders.values()).map(b => ({
                id: b.id,
                name: b.name,
                progress: b.progress,
                action: b.currentAction,
                trapsBuilt: b.trapsBuilt,
                layer: b.currentLayer
            })),
            clawMachine: this.arenaState.clawMachine,
            spectators: this.arenaState.spectators.size,
            camera: this.camera
        });
    }
    
    broadcastEvent(event) {
        this.broadcast({
            type: 'event',
            ...event,
            timestamp: Date.now()
        });
    }
    
    broadcast(message) {
        if (this.wss) {
            const data = JSON.stringify(message);
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(data);
                }
            });
        }
    }
    
    startTheaterServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.method === 'GET' && req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getTheaterHTML());
            } else if (req.method === 'POST' && req.url === '/claw-capture') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const { trapId } = JSON.parse(body);
                    const result = this.attemptClawCapture(trapId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
            } else if (req.method === 'POST' && req.url === '/gacha-pull') {
                const result = this.performGachaPull();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else if (req.method === 'GET' && req.url === '/collection') {
                const collection = {
                    captured: Array.from(this.arenaState.capturedTraps.values()),
                    gacha: Array.from(this.arenaState.gachaSystem.collection.values())
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(collection));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🎭 Theater server listening on http://localhost:${this.port}`);
        });
    }
    
    startSpectatorWebSocket() {
        this.wss = new WebSocketServer({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            const spectatorId = crypto.randomUUID();
            this.arenaState.spectators.set(spectatorId, {
                id: spectatorId,
                joinedAt: Date.now()
            });
            
            console.log(`👁️ New spectator joined: ${spectatorId}`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                spectatorId: spectatorId,
                quote: this.arenaQuote
            }));
            
            // Handle spectator actions
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'change_camera':
                        this.camera = { ...this.viewingAngles[data.angle] };
                        break;
                    
                    case 'emote':
                        this.broadcastEvent({
                            type: 'spectator_emote',
                            spectatorId: spectatorId,
                            emote: data.emote
                        });
                        break;
                    
                    case 'cheer_builder':
                        const builder = this.arenaState.builders.get(data.builderId);
                        if (builder) {
                            builder.buildSpeed *= 1.1; // Temporary speed boost
                            setTimeout(() => {
                                builder.buildSpeed /= 1.1;
                            }, 10000);
                        }
                        break;
                }
            });
            
            ws.on('close', () => {
                this.arenaState.spectators.delete(spectatorId);
                console.log(`👁️ Spectator left: ${spectatorId}`);
            });
        });
        
        console.log(`📡 Spectator WebSocket listening on ws://localhost:${this.wsPort}`);
    }
    
    getTheaterHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎭 Spectator Arena Trap Theater</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #fff;
            font-family: 'Arial', sans-serif;
            overflow: hidden;
        }
        
        #arena {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(ellipse at center, #1a1a2e 0%, #000 100%);
        }
        
        .builder-workspace {
            position: absolute;
            width: 200px;
            height: 150px;
            border: 2px solid #444;
            border-radius: 10px;
            background: rgba(20, 20, 40, 0.8);
            padding: 10px;
            transition: all 0.3s;
        }
        
        .builder-workspace:hover {
            border-color: #00ff00;
            transform: scale(1.05);
            z-index: 100;
        }
        
        .builder-name {
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 5px;
        }
        
        .builder-progress {
            width: 100%;
            height: 20px;
            background: #333;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff00, #ffff00);
            transition: width 0.3s;
        }
        
        .trap-display {
            position: absolute;
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff0000;
            border-radius: 5px;
            padding: 5px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .trap-display:hover {
            background: rgba(255, 0, 0, 0.3);
            transform: scale(1.1);
            z-index: 1000;
        }
        
        .controls {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #666;
            border-radius: 10px;
            padding: 20px;
            z-index: 1000;
        }
        
        .camera-controls {
            margin-bottom: 20px;
        }
        
        .camera-btn {
            background: #333;
            color: #fff;
            border: 1px solid #666;
            padding: 10px 15px;
            margin: 5px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.2s;
        }
        
        .camera-btn:hover {
            background: #555;
            border-color: #00ff00;
        }
        
        .camera-btn.active {
            background: #00ff00;
            color: #000;
        }
        
        #quote-display {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            max-width: 600px;
            text-align: center;
            font-style: italic;
            color: #999;
            padding: 20px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
        }
        
        #mime-stage {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid #fff;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
        }
        
        #mime-stage.active {
            display: block;
            animation: fadeIn 0.5s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .claw-machine {
            position: fixed;
            right: 20px;
            top: 20px;
            width: 300px;
            height: 400px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
            border: 3px solid #333;
            border-radius: 10px;
            padding: 20px;
            z-index: 1000;
        }
        
        .claw {
            position: absolute;
            width: 50px;
            height: 50px;
            background: #ffd93d;
            border-radius: 50%;
            left: 50%;
            transform: translateX(-50%);
            transition: all 0.5s;
        }
        
        .claw::after {
            content: '🤏';
            font-size: 30px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .gacha-machine {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 250px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: 3px solid #333;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            z-index: 1000;
        }
        
        .gacha-button {
            background: #ffd93d;
            color: #000;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 50px;
            transition: all 0.3s;
            margin-top: 10px;
        }
        
        .gacha-button:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px #ffd93d;
        }
        
        .event-log {
            position: fixed;
            left: 20px;
            bottom: 20px;
            width: 300px;
            max-height: 200px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #666;
            border-radius: 10px;
            padding: 10px;
            font-size: 12px;
        }
        
        .event-item {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #00ff00;
            padding-left: 10px;
        }
        
        .spectator-count {
            position: fixed;
            top: 10px;
            right: 350px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 20px;
            border: 1px solid #666;
        }
        
        .collection-viewer {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 800px;
            height: 80%;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #666;
            border-radius: 20px;
            padding: 20px;
            display: none;
            overflow-y: auto;
            z-index: 2000;
        }
        
        .collection-viewer.active {
            display: block;
        }
        
        .rarity-LEGENDARY {
            color: #ff6b6b;
            text-shadow: 0 0 10px #ff6b6b;
        }
        
        .rarity-EPIC {
            color: #a855f7;
            text-shadow: 0 0 10px #a855f7;
        }
        
        .rarity-RARE {
            color: #3b82f6;
            text-shadow: 0 0 10px #3b82f6;
        }
        
        .rarity-COMMON {
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div id="arena">
        <!-- Builder workspaces will be dynamically created -->
    </div>
    
    <div class="controls">
        <h3>📷 Camera Controls</h3>
        <div class="camera-controls">
            <button class="camera-btn active" onclick="changeCamera('OVERVIEW')">Overview</button>
            <button class="camera-btn" onclick="changeCamera('BUILDER_FOCUS')">Builder Focus</button>
            <button class="camera-btn" onclick="changeCamera('TRAP_CLOSEUP')">Trap Closeup</button>
            <button class="camera-btn" onclick="changeCamera('ARENA_WIDE')">Arena Wide</button>
            <button class="camera-btn" onclick="changeCamera('CLAW_MACHINE')">Claw View</button>
        </div>
        
        <h3>🎭 Spectator Actions</h3>
        <button onclick="performEmote('wave')">👋 Wave</button>
        <button onclick="performEmote('cheer')">🎉 Cheer</button>
        <button onclick="performEmote('think')">🤔 Think</button>
        <button onclick="viewCollection()">📦 View Collection</button>
    </div>
    
    <div class="spectator-count">
        👁️ Spectators: <span id="spectatorCount">0</span>
    </div>
    
    <div class="claw-machine">
        <h3>🎯 Trap Claw Machine</h3>
        <div class="claw" id="claw"></div>
        <p>Credits: <span id="clawCredits">100</span></p>
        <p>Click on traps to capture!</p>
    </div>
    
    <div class="gacha-machine">
        <h3>🎰 Trap Gacha</h3>
        <p>Pulls: <span id="gachaPulls">0</span></p>
        <button class="gacha-button" onclick="performGachaPull()">
            PULL! (10 credits)
        </button>
    </div>
    
    <div id="mime-stage">
        <h2>🎭 Mime Performance</h2>
        <p id="mime-act-name"></p>
        <p id="mime-act-desc"></p>
    </div>
    
    <div id="quote-display">
        "It is not the critic who counts; not the man who points out how the strong man stumbles..."
    </div>
    
    <div class="event-log" id="eventLog">
        <h4>📜 Event Log</h4>
    </div>
    
    <div class="collection-viewer" id="collectionViewer">
        <h2>📦 Your Trap Collection</h2>
        <div id="collectionContent"></div>
        <button onclick="closeCollection()">Close</button>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let spectatorId = null;
        let currentCamera = 'OVERVIEW';
        
        // Builder workspace positions
        const builderPositions = {
            'builder_dharok': { x: 100, y: 100 },
            'builder_ahrim': { x: 350, y: 100 },
            'builder_karil': { x: 600, y: 100 },
            'builder_torag': { x: 100, y: 300 },
            'builder_verac': { x: 350, y: 300 },
            'builder_guthan': { x: 600, y: 300 }
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'welcome':
                    spectatorId = message.spectatorId;
                    console.log('Joined as spectator:', spectatorId);
                    break;
                
                case 'arena_update':
                    updateArena(message);
                    break;
                
                case 'event':
                    handleEvent(message);
                    break;
            }
        };
        
        function updateArena(data) {
            // Update spectator count
            document.getElementById('spectatorCount').textContent = data.spectators;
            
            // Update claw credits
            document.getElementById('clawCredits').textContent = data.clawMachine.credits;
            
            // Update builders
            data.builders.forEach(builder => {
                let workspace = document.getElementById('builder-' + builder.id);
                
                if (!workspace) {
                    workspace = createBuilderWorkspace(builder);
                    document.getElementById('arena').appendChild(workspace);
                }
                
                updateBuilderWorkspace(workspace, builder);
            });
        }
        
        function createBuilderWorkspace(builder) {
            const div = document.createElement('div');
            div.className = 'builder-workspace';
            div.id = 'builder-' + builder.id;
            
            const pos = builderPositions[builder.id] || { x: 0, y: 0 };
            div.style.left = pos.x + 'px';
            div.style.top = pos.y + 'px';
            
            div.innerHTML = \`
                <div class="builder-name">\${builder.name}</div>
                <div class="builder-action"></div>
                <div class="builder-progress">
                    <div class="progress-fill"></div>
                </div>
                <div>Traps Built: <span class="trap-count">0</span></div>
                <div>Layer: <span class="layer-name">\${builder.layer}</span></div>
            \`;
            
            div.onclick = () => cheerBuilder(builder.id);
            
            return div;
        }
        
        function updateBuilderWorkspace(workspace, builder) {
            workspace.querySelector('.builder-action').textContent = builder.action;
            workspace.querySelector('.progress-fill').style.width = builder.progress + '%';
            workspace.querySelector('.trap-count').textContent = builder.trapsBuilt;
        }
        
        function handleEvent(event) {
            const logEntry = document.createElement('div');
            logEntry.className = 'event-item';
            
            switch (event.type) {
                case 'trap_completed':
                    logEntry.innerHTML = \`<strong>\${event.builder}</strong> completed: <span class="rarity-\${event.trap.severity}">\${event.trap.name}</span>\`;
                    displayTrap(event.trap);
                    break;
                
                case 'mime_performance':
                    showMimeAct(event.act);
                    logEntry.textContent = '🎭 Mime performs: ' + event.act.name;
                    break;
                
                case 'builder_interaction':
                    logEntry.innerHTML = \`<strong>\${event.builder}</strong> \${event.action}\`;
                    break;
                
                case 'random_event':
                    logEntry.innerHTML = \`⚡ \${event.description}\`;
                    break;
            }
            
            const eventLog = document.getElementById('eventLog');
            eventLog.appendChild(logEntry);
            eventLog.scrollTop = eventLog.scrollHeight;
            
            // Limit log entries
            if (eventLog.children.length > 20) {
                eventLog.removeChild(eventLog.children[1]);
            }
        }
        
        function displayTrap(trap) {
            const trapDiv = document.createElement('div');
            trapDiv.className = 'trap-display';
            trapDiv.id = 'trap-' + trap.id;
            trapDiv.innerHTML = \`
                <strong class="rarity-\${trap.severity}">\${trap.name}</strong><br>
                by \${trap.builder}
            \`;
            
            // Random position near builder
            const builderPos = builderPositions['builder_' + trap.builder.toLowerCase().replace(/[^a-z]/g, '')] || { x: 400, y: 300 };
            trapDiv.style.left = (builderPos.x + Math.random() * 200 - 100) + 'px';
            trapDiv.style.top = (builderPos.y + Math.random() * 100 + 50) + 'px';
            
            trapDiv.onclick = () => attemptClawCapture(trap);
            
            document.getElementById('arena').appendChild(trapDiv);
            
            // Auto-remove after 30 seconds
            setTimeout(() => {
                trapDiv.remove();
            }, 30000);
        }
        
        function showMimeAct(act) {
            const stage = document.getElementById('mime-stage');
            document.getElementById('mime-act-name').textContent = act.name;
            document.getElementById('mime-act-desc').textContent = act.description;
            
            stage.classList.add('active');
            
            setTimeout(() => {
                stage.classList.remove('active');
            }, act.duration);
        }
        
        function changeCamera(angle) {
            currentCamera = angle;
            document.querySelectorAll('.camera-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            ws.send(JSON.stringify({
                type: 'change_camera',
                angle: angle
            }));
        }
        
        function performEmote(emote) {
            ws.send(JSON.stringify({
                type: 'emote',
                emote: emote
            }));
        }
        
        function cheerBuilder(builderId) {
            ws.send(JSON.stringify({
                type: 'cheer_builder',
                builderId: builderId
            }));
        }
        
        async function attemptClawCapture(trap) {
            const response = await fetch('/claw-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trapId: trap })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(\`🎯 Captured: \${trap.name}!\`);
                document.getElementById('trap-' + trap.id)?.remove();
            } else {
                alert('❌ Claw missed! Try again!');
            }
            
            document.getElementById('clawCredits').textContent = result.creditsRemaining;
        }
        
        async function performGachaPull() {
            const response = await fetch('/gacha-pull', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(\`🎰 You pulled a \${result.pull.rarity} trap: \${result.pull.name}!\`);
                document.getElementById('gachaPulls').textContent = result.totalPulls;
            } else {
                alert('❌ ' + (result.error || 'Gacha failed!'));
            }
        }
        
        async function viewCollection() {
            const response = await fetch('/collection');
            const collection = await response.json();
            
            const content = document.getElementById('collectionContent');
            content.innerHTML = '<h3>🎯 Claw Machine Captures</h3>';
            
            collection.captured.forEach(trap => {
                content.innerHTML += \`<div class="rarity-\${trap.severity}">\${trap.name} by \${trap.builder}</div>\`;
            });
            
            content.innerHTML += '<h3>🎰 Gacha Collection</h3>';
            
            collection.gacha.forEach(trap => {
                content.innerHTML += \`<div class="rarity-\${trap.rarity}">\${trap.name} (\${trap.rarity})</div>\`;
            });
            
            document.getElementById('collectionViewer').classList.add('active');
        }
        
        function closeCollection() {
            document.getElementById('collectionViewer').classList.remove('active');
        }
        
        // Initialize
        console.log('🎭 Welcome to the Spectator Arena Trap Theater!');
        console.log('👁️ Watch builders create traps in real-time');
        console.log('🎯 Use the claw machine or gacha to capture traps');
    </script>
</body>
</html>`;
    }
}

// Start if run directly
if (require.main === module) {
    const theater = new SpectatorArenaTrapTheater();
    
    theater.initialize().then(() => {
        console.log('\\n🎭 The show is about to begin!');
        console.log('🎪 Visit the theater to watch builders in action');
        console.log('🎯 Use claw machine and gacha to capture their traps');
    }).catch(error => {
        console.error('❌ Theater initialization failed:', error);
        process.exit(1);
    });
}

module.exports = SpectatorArenaTrapTheater;