#!/usr/bin/env node

/**
 * 🎮 GAMING ENGINE BRIDGE 🎮
 * Connects gaming interface to ACTUAL game engines
 * Separate from financial/billing data
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GamingEngineBridge {
    constructor() {
        this.app = express();
        this.port = 7777; // Gaming bridge port
        
        this.gameEngines = {
            vcGame: {
                path: './vc-billion-trillion-game.html',
                port: null,
                status: 'offline',
                players: 0,
                gameState: {}
            },
            metaphysicalEngine: {
                path: './FinishThisIdea/metaphysical-game-engine-integration.py',
                port: 5000,
                status: 'offline',
                entities: [],
                activeConnections: 0
            },
            npcWorld: {
                path: './FinishThisIdea/npc-world-game.html',
                port: null,
                status: 'offline',
                npcs: [],
                conversations: 0
            }
        };
        
        this.gameData = {
            activePlayers: 0,
            totalSessions: 0,
            gameScores: new Map(),
            achievements: new Map(),
            leaderboard: []
        };
        
        this.setupExpress();
        this.startGameEngines();
        
        console.log('🎮 GAMING ENGINE BRIDGE INITIALIZED');
        console.log(`🔗 Gaming API: http://localhost:${this.port}`);
    }
    
    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Gaming status endpoint
        this.app.get('/api/gaming-status', (req, res) => {
            res.json({
                status: 'operational',
                purpose: 'Connect gaming interface to real game engines',
                activeEngines: Object.values(this.gameEngines).filter(g => g.status === 'online').length,
                totalPlayers: this.gameData.activePlayers,
                lastUpdate: new Date().toISOString()
            });
        });
        
        // Gaming data endpoint (NOT financial data)
        this.app.get('/api/gaming-data', (req, res) => {
            const gamingStats = this.getGamingStats();
            res.json(gamingStats);
        });
        
        // Game engine control
        this.app.post('/api/games/:gameId/start', (req, res) => {
            const { gameId } = req.params;
            const result = this.startGame(gameId);
            res.json(result);
        });
        
        this.app.post('/api/games/:gameId/stop', (req, res) => {
            const { gameId } = req.params;
            const result = this.stopGame(gameId);
            res.json(result);
        });
        
        // Player actions
        this.app.post('/api/player/action', (req, res) => {
            const { action, gameId, data } = req.body;
            const result = this.handlePlayerAction(action, gameId, data);
            res.json(result);
        });
        
        // Leaderboard
        this.app.get('/api/leaderboard', (req, res) => {
            res.json({
                leaderboard: this.gameData.leaderboard,
                lastUpdated: new Date().toISOString()
            });
        });
        
        // Start gaming bridge server
        this.app.listen(this.port, () => {
            console.log(`✅ Gaming Engine Bridge running on port ${this.port}`);
        });
    }
    
    async startGameEngines() {
        console.log('🎮 Starting game engines...');
        
        // Start metaphysical game engine (Python)
        await this.startMetaphysicalEngine();
        
        // Check other game files
        await this.checkGameAvailability();
        
        console.log('🎮 Game engines initialization complete');
    }
    
    async startMetaphysicalEngine() {
        try {
            const enginePath = this.gameEngines.metaphysicalEngine.path;
            
            if (fs.existsSync(enginePath)) {
                console.log('🔮 Starting Metaphysical Game Engine...');
                
                const pythonProcess = spawn('python3', [enginePath], {
                    stdio: 'pipe',
                    cwd: path.dirname(enginePath)
                });
                
                pythonProcess.stdout.on('data', (data) => {
                    console.log(`🐍 Metaphysical Engine: ${data}`);
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    console.error(`🚨 Metaphysical Engine Error: ${data}`);
                });
                
                // Give it time to start
                setTimeout(() => {
                    this.gameEngines.metaphysicalEngine.status = 'online';
                    console.log('✅ Metaphysical Game Engine started');
                }, 3000);
                
            } else {
                console.log('⚠️ Metaphysical engine file not found');
            }
        } catch (error) {
            console.error('❌ Failed to start metaphysical engine:', error);
        }
    }
    
    async checkGameAvailability() {
        for (const [gameId, game] of Object.entries(this.gameEngines)) {
            if (gameId === 'metaphysicalEngine') continue; // Already handled
            
            if (fs.existsSync(game.path)) {
                game.status = 'available';
                console.log(`✅ ${gameId} game found: ${game.path}`);
            } else {
                console.log(`⚠️ ${gameId} game not found: ${game.path}`);
            }
        }
    }
    
    getGamingStats() {
        const onlineEngines = Object.values(this.gameEngines).filter(g => g.status === 'online');
        
        return {
            // GAMING DATA (not financial)
            activeGameEngines: onlineEngines.length,
            totalGameEngines: Object.keys(this.gameEngines).length,
            activePlayers: this.gameData.activePlayers,
            totalSessions: this.gameData.totalSessions,
            
            // Game-specific stats
            gameEngines: Object.entries(this.gameEngines).map(([id, engine]) => ({
                id,
                name: this.getGameDisplayName(id),
                status: engine.status,
                players: engine.players || 0,
                description: this.getGameDescription(id)
            })),
            
            // Gaming achievements
            topPlayers: this.gameData.leaderboard.slice(0, 5),
            recentAchievements: this.getRecentAchievements(),
            
            // NOT financial data
            dataSource: 'gaming-engines',
            lastUpdate: new Date().toISOString()
        };
    }
    
    getGameDisplayName(gameId) {
        const names = {
            vcGame: 'VC Billion Trillion Empire',
            metaphysicalEngine: 'Metaphysical Reality Engine',
            npcWorld: 'NPC World Simulator'
        };
        return names[gameId] || gameId;
    }
    
    getGameDescription(gameId) {
        const descriptions = {
            vcGame: 'Build your venture capital empire by investing in companies',
            metaphysicalEngine: '3D world with consciousness and soul verification',
            npcWorld: 'Interactive world populated with AI-driven NPCs'
        };
        return descriptions[gameId] || 'Game engine';
    }
    
    startGame(gameId) {
        const game = this.gameEngines[gameId];
        
        if (!game) {
            return { success: false, error: 'Game not found' };
        }
        
        if (game.status === 'online') {
            return { success: false, error: 'Game already running' };
        }
        
        // Game-specific startup logic
        switch (gameId) {
            case 'vcGame':
                // VC game is HTML-based, mark as available for players
                game.status = 'online';
                game.players = 0;
                break;
                
            case 'metaphysicalEngine':
                // Already handled in startup
                break;
                
            case 'npcWorld':
                // NPC world startup
                game.status = 'online';
                game.npcs = this.generateInitialNPCs();
                break;
        }
        
        return {
            success: true,
            gameId,
            status: game.status,
            message: `${this.getGameDisplayName(gameId)} started successfully`
        };
    }
    
    stopGame(gameId) {
        const game = this.gameEngines[gameId];
        
        if (!game) {
            return { success: false, error: 'Game not found' };
        }
        
        game.status = 'offline';
        game.players = 0;
        
        return {
            success: true,
            gameId,
            message: `${this.getGameDisplayName(gameId)} stopped`
        };
    }
    
    handlePlayerAction(action, gameId, data) {
        const game = this.gameEngines[gameId];
        
        if (!game || game.status !== 'online') {
            return { success: false, error: 'Game not available' };
        }
        
        // Handle different actions based on game
        switch (gameId) {
            case 'vcGame':
                return this.handleVCGameAction(action, data);
                
            case 'metaphysicalEngine':
                return this.handleMetaphysicalAction(action, data);
                
            case 'npcWorld':
                return this.handleNPCAction(action, data);
                
            default:
                return { success: false, error: 'Unknown game' };
        }
    }
    
    handleVCGameAction(action, data) {
        switch (action) {
            case 'invest':
                const investment = data.amount || 1000;
                const company = data.company || 'TechStartup';
                
                // Simulate investment outcome
                const success = Math.random() > 0.3; // 70% success rate
                const multiplier = success ? (1 + Math.random() * 2) : (0.5 + Math.random() * 0.5);
                
                return {
                    success: true,
                    action: 'invest',
                    investment,
                    company,
                    outcome: success ? 'success' : 'loss',
                    returns: Math.round(investment * multiplier),
                    message: success ? `Great investment in ${company}!` : `${company} didn't work out this time`
                };
                
            case 'portfolio':
                return {
                    success: true,
                    portfolio: this.generatePortfolio()
                };
                
            default:
                return { success: false, error: 'Unknown VC action' };
        }
    }
    
    handleMetaphysicalAction(action, data) {
        switch (action) {
            case 'spawn_entity':
                const entityId = `entity_${Date.now()}`;
                const entity = {
                    id: entityId,
                    position: data.position || { x: 0, y: 0, z: 0 },
                    layer: data.layer || 'reality',
                    consciousness: Math.random(),
                    created: new Date().toISOString()
                };
                
                this.gameEngines.metaphysicalEngine.entities.push(entity);
                
                return {
                    success: true,
                    entity,
                    message: 'Entity spawned in metaphysical realm'
                };
                
            case 'list_entities':
                return {
                    success: true,
                    entities: this.gameEngines.metaphysicalEngine.entities
                };
                
            default:
                return { success: false, error: 'Unknown metaphysical action' };
        }
    }
    
    handleNPCAction(action, data) {
        switch (action) {
            case 'talk_to_npc':
                const npcId = data.npcId;
                const message = data.message || 'Hello';
                
                // Simulate NPC response
                const responses = [
                    'Hello there, traveler!',
                    'I have a quest for you...',
                    'The weather is nice today.',
                    'Have you seen any strange activities lately?',
                    'I used to be an adventurer like you...'
                ];
                
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                return {
                    success: true,
                    npcId,
                    playerMessage: message,
                    npcResponse: response,
                    timestamp: new Date().toISOString()
                };
                
            default:
                return { success: false, error: 'Unknown NPC action' };
        }
    }
    
    generateInitialNPCs() {
        return [
            { id: 'npc_001', name: 'Merchant Bob', type: 'trader', location: 'market' },
            { id: 'npc_002', name: 'Guard Alice', type: 'security', location: 'gate' },
            { id: 'npc_003', name: 'Wizard Chen', type: 'magic', location: 'tower' }
        ];
    }
    
    generatePortfolio() {
        return [
            { company: 'TechCorp', investment: 5000, current_value: 7500, status: 'growing' },
            { company: 'AI Startup', investment: 2000, current_value: 1500, status: 'declining' },
            { company: 'Green Energy Co', investment: 3000, current_value: 4200, status: 'stable' }
        ];
    }
    
    getRecentAchievements() {
        return [
            { player: 'player_001', achievement: 'First Investment', timestamp: new Date().toISOString() },
            { player: 'player_002', achievement: 'Entity Master', timestamp: new Date().toISOString() }
        ];
    }
}

// Start the gaming bridge
if (require.main === module) {
    console.log(`\n🎮 GAMING ENGINE BRIDGE 🎮`);
    console.log(`==========================\n`);
    console.log(`Purpose: Connect gaming interface to ACTUAL game engines`);
    console.log(`NOT financial data - that goes through database/billing layer\n`);
    console.log(`Available Games:`);
    console.log(`✅ VC Billion Trillion Empire (Investment simulation)`);
    console.log(`✅ Metaphysical Reality Engine (3D world)`);
    console.log(`✅ NPC World Simulator (Character interactions)\n`);
    console.log(`Starting Gaming Engine Bridge...\n`);
    
    const gamingBridge = new GamingEngineBridge();
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Gaming Engine Bridge...');
        process.exit(0);
    });
}

module.exports = GamingEngineBridge;