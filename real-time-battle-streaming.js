#!/usr/bin/env node

/**
 * ⚔️📡🎮 REAL-TIME BATTLE STREAMING SYSTEM
 * WebSocket-based system that connects RuneScape aggro mechanics with web dashboard
 * Streams live battle data, movement, and combat events to connected clients
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const RuneScapeAggroSystem = require('./runescape-aggro-system.js');
const BossSubmissionAPI = require('./boss-submission-api.js');
const KingdomAuthoritySystem = require('./kingdom-authority-system.js');

class RealTimeBattleStreaming extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.wsPort = options.wsPort || 8081;
        this.httpPort = options.httpPort || 4200;
        
        // WebSocket server for real-time streaming
        this.wss = null;
        this.connectedClients = new Map();
        
        // Battle management
        this.activeBattles = new Map();
        this.battleQueue = [];
        this.aggroSystem = null;
        this.bossAPI = null;
        
        // Streaming configuration
        this.streamConfig = {
            tickRate: 100,        // Send updates every 100ms (10fps)
            maxClients: 1000,     // Maximum concurrent viewers
            battleDuration: 300,  // 5 minutes max per battle
            autoQueue: true       // Automatically start new battles
        };
        
        // Battle statistics
        this.stats = {
            totalBattles: 0,
            activeViewers: 0,
            totalViewTime: 0,
            popularBosses: new Map()
        };
        
        console.log('⚔️📡 Real-Time Battle Streaming initialized');
    }
    
    async initialize() {
        try {
            // Initialize RuneScape aggro system
            this.aggroSystem = new RuneScapeAggroSystem(100, 100);
            
            // Initialize Boss API
            this.bossAPI = new BossSubmissionAPI();
            await this.bossAPI.start();
            
            // Set up WebSocket server
            this.setupWebSocketServer();
            
            // Connect aggro system events to streaming
            this.connectAggroEvents();
            
            // Start automatic battle queue
            if (this.streamConfig.autoQueue) {
                this.startBattleQueue();
            }
            
            console.log(`📡 Battle streaming ready on ws://localhost:${this.wsPort}`);
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize battle streaming:', error);
            throw error;
        }
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({
            port: this.wsPort,
            maxPayload: 1024 * 1024 // 1MB max payload
        });
        
        this.wss.on('connection', (ws, request) => {
            const clientId = this.generateClientId();
            const clientIP = request.socket.remoteAddress;
            
            console.log(`📱 Client connected: ${clientId} from ${clientIP}`);
            
            // Store client connection
            this.connectedClients.set(clientId, {
                ws: ws,
                id: clientId,
                ip: clientIP,
                connectedAt: Date.now(),
                subscriptions: new Set(),
                viewingBattle: null
            });
            
            this.stats.activeViewers++;
            
            // Handle client messages
            ws.on('message', (data) => {
                this.handleClientMessage(clientId, data);
            });
            
            // Handle client disconnect
            ws.on('close', () => {
                console.log(`📱 Client disconnected: ${clientId}`);
                this.connectedClients.delete(clientId);
                this.stats.activeViewers--;
            });
            
            // Send welcome message with available battles
            this.sendToClient(clientId, {
                type: 'welcome',
                clientId: clientId,
                availableBattles: Array.from(this.activeBattles.keys()),
                stats: this.getPublicStats()
            });
        });
        
        console.log(`📡 WebSocket server listening on port ${this.wsPort}`);
    }
    
    handleClientMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.connectedClients.get(clientId);
            
            if (!client) return;
            
            switch (message.type) {
                case 'subscribe_battle':
                    this.subscribeToBattle(clientId, message.battleId);
                    break;
                    
                case 'unsubscribe_battle':
                    this.unsubscribeFromBattle(clientId, message.battleId);
                    break;
                    
                case 'request_battle_list':
                    this.sendBattleList(clientId);
                    break;
                    
                case 'start_battle':
                    this.startCustomBattle(clientId, message.bossId, message.options);
                    break;
                    
                case 'create_quest':
                    this.createQuestForBattle(clientId, message.battleId, message.bossId, message.userId, message.questTypes);
                    break;
                    
                case 'submit_prediction':
                    this.submitBattlePrediction(clientId, message.questId, message.objectiveId, message.userId, message.prediction);
                    break;
                    
                case 'get_battle_history':
                    this.sendBattleHistory(clientId, message.bossId);
                    break;
                    
                default:
                    console.warn(`📱 Unknown message type from ${clientId}: ${message.type}`);
            }
        } catch (error) {
            console.error(`📱 Error handling message from ${clientId}:`, error);
        }
    }
    
    subscribeToBattle(clientId, battleId) {
        const client = this.connectedClients.get(clientId);
        const battle = this.activeBattles.get(battleId);
        
        if (!client || !battle) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Battle not found'
            });
            return;
        }
        
        client.subscriptions.add(battleId);
        client.viewingBattle = battleId;
        battle.viewers++;
        
        // Send battle state immediately
        this.sendToClient(clientId, {
            type: 'battle_state',
            battleId: battleId,
            state: this.getBattleState(battleId)
        });
        
        console.log(`👁️ Client ${clientId} subscribed to battle ${battleId}`);
    }
    
    unsubscribeFromBattle(clientId, battleId) {
        const client = this.connectedClients.get(clientId);
        const battle = this.activeBattles.get(battleId);
        
        if (client) {
            client.subscriptions.delete(battleId);
            if (client.viewingBattle === battleId) {
                client.viewingBattle = null;
            }
        }
        
        if (battle) {
            battle.viewers = Math.max(0, battle.viewers - 1);
        }
        
        console.log(`👁️ Client ${clientId} unsubscribed from battle ${battleId}`);
    }
    
    connectAggroEvents() {
        // Stream combat hits
        this.aggroSystem.on('combat_hit', (event) => {
            this.broadcastBattleEvent('combat_hit', {
                attacker: this.sanitizeEntityForStream(event.attacker),
                target: this.sanitizeEntityForStream(event.target),
                damage: event.damage,
                hitChance: event.hitChance,
                timestamp: Date.now()
            });
        });
        
        // Stream combat misses
        this.aggroSystem.on('combat_miss', (event) => {
            this.broadcastBattleEvent('combat_miss', {
                attacker: this.sanitizeEntityForStream(event.attacker),
                target: this.sanitizeEntityForStream(event.target),
                hitChance: event.hitChance,
                timestamp: Date.now()
            });
        });
        
        // Stream entity movement
        this.aggroSystem.on('entity_moved', (event) => {
            this.broadcastBattleEvent('entity_moved', {
                entity: this.sanitizeEntityForStream(event.entity),
                newX: event.newX,
                newY: event.newY,
                stepsTaken: event.stepsTaken,
                timestamp: Date.now()
            });
        });
        
        // Stream entity deaths
        this.aggroSystem.on('entity_death', (event) => {
            this.broadcastBattleEvent('entity_death', {
                deceased: this.sanitizeEntityForStream(event.deceased),
                killer: this.sanitizeEntityForStream(event.killer),
                timestamp: Date.now()
            });
            
            // End battle if boss or all players dead
            this.checkBattleEndConditions(event);
        });
        
        // Stream entity additions
        this.aggroSystem.on('entity_added', (entity) => {
            this.broadcastBattleEvent('entity_added', {
                entity: this.sanitizeEntityForStream(entity),
                timestamp: Date.now()
            });
        });
    }
    
    sanitizeEntityForStream(entity) {
        return {
            id: entity.id,
            name: entity.name || entity.id,
            type: entity.type,
            level: entity.level,
            health: entity.health,
            maxHealth: entity.maxHealth,
            x: entity.x,
            y: entity.y,
            size: entity.size,
            combatState: entity.combatState,
            target: entity.target
        };
    }
    
    broadcastBattleEvent(eventType, eventData) {
        // Find which battle this event belongs to
        const battleId = this.findBattleForEvent(eventData);
        if (!battleId) return;
        
        const message = {
            type: 'battle_event',
            battleId: battleId,
            eventType: eventType,
            data: eventData
        };
        
        // Send to all clients subscribed to this battle
        this.connectedClients.forEach((client, clientId) => {
            if (client.subscriptions.has(battleId)) {
                this.sendToClient(clientId, message);
            }
        });
    }
    
    findBattleForEvent(eventData) {
        // For now, assume all events belong to the active battle
        // In a multi-battle system, this would check entity battleId
        const activeBattles = Array.from(this.activeBattles.keys());
        return activeBattles.length > 0 ? activeBattles[0] : null;
    }
    
    async startCustomBattle(clientId, bossId, options = {}) {
        try {
            // Get boss from API
            const boss = this.bossAPI.getBoss(bossId);
            if (!boss) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Boss not found'
                });
                return;
            }
            
            const battleId = this.generateBattleId();
            
            // Create battle instance
            const battle = {
                id: battleId,
                bossId: bossId,
                boss: boss,
                startTime: Date.now(),
                viewers: 0,
                status: 'starting',
                participants: [],
                events: []
            };
            
            this.activeBattles.set(battleId, battle);
            
            // Clear existing entities
            const existingEntities = Array.from(this.aggroSystem.entities.keys());
            existingEntities.forEach(id => {
                this.aggroSystem.removeEntity(id);
            });
            
            // Add boss to aggro system
            const bossEntity = this.aggroSystem.addEntity(`boss_${bossId}`, {
                name: boss.name,
                type: 'monster',
                x: 50,
                y: 50,
                level: boss.level,
                health: boss.health,
                maxHealth: boss.maxHealth || boss.health,
                damage: boss.damage,
                defense: boss.defense,
                size: boss.size || 2,
                abilities: boss.abilities || [],
                aggroRange: 15,
                aggressive: true,
                moveSpeed: 1,
                attackSpeed: boss.attackSpeed || 4000
            });
            
            battle.participants.push(bossEntity.id);
            
            // Add AI player opponents
            const numOpponents = options.opponents || 3;
            for (let i = 0; i < numOpponents; i++) {
                const playerEntity = this.aggroSystem.addEntity(`ai_player_${i}`, {
                    name: `AI Fighter ${i + 1}`,
                    type: 'player',
                    x: 30 + (i * 10),
                    y: 30 + (i * 5),
                    level: 25 + Math.floor(Math.random() * 20),
                    health: 100,
                    maxHealth: 100,
                    damage: 20,
                    defense: 10,
                    size: 1,
                    aggressive: false,
                    moveSpeed: 1,
                    attackSpeed: 3000
                });
                
                battle.participants.push(playerEntity.id);
            }
            
            battle.status = 'active';
            this.stats.totalBattles++;
            
            // Notify all clients of new battle
            this.broadcastToAll({
                type: 'battle_started',
                battle: {
                    id: battleId,
                    bossName: boss.name,
                    bossLevel: boss.level,
                    participants: battle.participants.length,
                    startTime: battle.startTime
                }
            });
            
            // Auto-end battle after max duration
            setTimeout(() => {
                if (this.activeBattles.has(battleId)) {
                    this.endBattle(battleId, 'timeout');
                }
            }, this.streamConfig.battleDuration * 1000);
            
            console.log(`⚔️ Started battle ${battleId}: ${boss.name} vs ${numOpponents} AI fighters`);
            
        } catch (error) {
            console.error('❌ Failed to start battle:', error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Failed to start battle'
            });
        }
    }
    
    checkBattleEndConditions(deathEvent) {
        const activeBattles = Array.from(this.activeBattles.values());
        
        activeBattles.forEach(battle => {
            if (battle.status !== 'active') return;
            
            const aliveEntities = battle.participants.filter(participantId => {
                const entity = this.aggroSystem.entities.get(participantId);
                return entity && entity.health > 0;
            });
            
            const aliveBosses = aliveEntities.filter(id => id.startsWith('boss_'));
            const alivePlayers = aliveEntities.filter(id => id.startsWith('ai_player_'));
            
            if (aliveBosses.length === 0) {
                this.endBattle(battle.id, 'players_won');
            } else if (alivePlayers.length === 0) {
                this.endBattle(battle.id, 'boss_won');
            }
        });
    }
    
    endBattle(battleId, reason) {
        const battle = this.activeBattles.get(battleId);
        if (!battle) return;
        
        battle.status = 'ended';
        battle.endTime = Date.now();
        battle.duration = battle.endTime - battle.startTime;
        battle.endReason = reason;
        
        // Record battle result in boss API
        const winnerId = reason === 'boss_won' ? `boss_${battle.bossId}` : 'players';
        this.bossAPI.app.emit('battleCompleted', {
            bossId: battle.bossId,
            winnerId: winnerId,
            battleData: {
                duration: battle.duration / 1000, // seconds
                viewers: battle.viewers,
                events: battle.events.length
            }
        });
        
        // Notify viewers
        this.broadcastBattleEvent('battle_ended', {
            battleId: battleId,
            reason: reason,
            duration: battle.duration,
            winner: winnerId
        });
        
        // Clean up after 30 seconds
        setTimeout(() => {
            this.activeBattles.delete(battleId);
        }, 30000);
        
        console.log(`⚔️ Battle ${battleId} ended: ${reason} (${battle.duration / 1000}s)`);
    }
    
    startBattleQueue() {
        setInterval(async () => {
            // If no active battles and we have approved bosses
            if (this.activeBattles.size === 0) {
                const approvedBosses = this.bossAPI.getApprovedBosses();
                if (approvedBosses.length > 0) {
                    const randomBoss = approvedBosses[Math.floor(Math.random() * approvedBosses.length)];
                    await this.startCustomBattle('system', randomBoss.id, { opponents: 3 });
                }
            }
        }, 30000); // Check every 30 seconds
        
        console.log('⚔️ Auto battle queue started');
    }
    
    getBattleState(battleId) {
        const battle = this.activeBattles.get(battleId);
        if (!battle) return null;
        
        const entities = battle.participants.map(id => {
            const entity = this.aggroSystem.entities.get(id);
            return entity ? this.sanitizeEntityForStream(entity) : null;
        }).filter(Boolean);
        
        return {
            id: battleId,
            status: battle.status,
            boss: battle.boss.name,
            startTime: battle.startTime,
            duration: Date.now() - battle.startTime,
            viewers: battle.viewers,
            entities: entities,
            gridSize: {
                width: this.aggroSystem.gridWidth,
                height: this.aggroSystem.gridHeight
            }
        };
    }
    
    sendBattleList(clientId) {
        const battles = Array.from(this.activeBattles.values()).map(battle => ({
            id: battle.id,
            bossName: battle.boss.name,
            status: battle.status,
            viewers: battle.viewers,
            duration: Date.now() - battle.startTime,
            participants: battle.participants.length
        }));
        
        this.sendToClient(clientId, {
            type: 'battle_list',
            battles: battles
        });
    }
    
    sendBattleHistory(clientId, bossId) {
        // Get battle history from boss API
        const boss = this.bossAPI.getBoss(bossId);
        if (!boss) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Boss not found'
            });
            return;
        }
        
        this.sendToClient(clientId, {
            type: 'battle_history',
            bossId: bossId,
            history: {
                totalBattles: boss.battles,
                wins: boss.wins,
                losses: boss.losses,
                winRate: boss.battles > 0 ? (boss.wins / boss.battles * 100).toFixed(1) : 0,
                rating: boss.rating
            }
        });
    }
    
    sendToClient(clientId, message) {
        const client = this.connectedClients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`📱 Failed to send message to ${clientId}:`, error);
            }
        }
    }
    
    broadcastToAll(message) {
        this.connectedClients.forEach((client, clientId) => {
            this.sendToClient(clientId, message);
        });
    }
    
    getPublicStats() {
        return {
            totalBattles: this.stats.totalBattles,
            activeBattles: this.activeBattles.size,
            activeViewers: this.stats.activeViewers,
            availableBosses: this.bossAPI.getApprovedBosses().length
        };
    }
    
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateBattleId() {
        return 'battle_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    createQuestForBattle(clientId, battleId, bossId, userId, questTypes) {
        try {
            // Forward to boss API's kingdom system
            const quest = this.bossAPI.kingdomSystem.createQuest(
                battleId, 
                { bossId, participants: [] }, 
                questTypes || ['BATTLE_OUTCOME', 'BATTLE_DURATION'], 
                userId
            );
            
            // Broadcast quest creation to all clients
            this.broadcastToAll({
                type: 'quest_created',
                quest: {
                    id: quest.id,
                    battleId: quest.battleId,
                    objectives: quest.objectives,
                    creator: this.bossAPI.kingdomSystem.getUser(userId)?.name,
                    deadline: quest.votingDeadline
                }
            });
            
            this.sendToClient(clientId, {
                type: 'quest_created_success',
                questId: quest.id
            });
            
        } catch (error) {
            console.error('Failed to create quest:', error);
            this.sendToClient(clientId, {
                type: 'error',
                message: `Failed to create quest: ${error.message}`
            });
        }
    }
    
    submitBattlePrediction(clientId, questId, objectiveId, userId, prediction) {
        try {
            const success = this.bossAPI.kingdomSystem.submitPrediction(questId, objectiveId, userId, prediction);
            
            if (success) {
                // Broadcast prediction submission (without revealing the prediction)
                const user = this.bossAPI.kingdomSystem.getUser(userId);
                
                this.broadcastToAll({
                    type: 'prediction_submitted',
                    questId: questId,
                    objectiveId: objectiveId,
                    userName: user?.name || userId,
                    userAuthority: user?.authority.title || 'Unknown'
                });
                
                this.sendToClient(clientId, {
                    type: 'prediction_success',
                    message: 'Prediction submitted successfully'
                });
            }
            
        } catch (error) {
            console.error('Failed to submit prediction:', error);
            this.sendToClient(clientId, {
                type: 'error',
                message: `Failed to submit prediction: ${error.message}`
            });
        }
    }
    
    async stop() {
        console.log('📡 Stopping battle streaming system...');
        
        // Close all WebSocket connections
        this.connectedClients.forEach((client) => {
            client.ws.close();
        });
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Stop boss API
        if (this.bossAPI) {
            await this.bossAPI.stop();
        }
        
        console.log('📡 Battle streaming system stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const streaming = new RealTimeBattleStreaming();
    
    streaming.initialize().then(() => {
        console.log('⚔️📡 Real-Time Battle Streaming is ready!');
        console.log(`🌐 WebSocket: ws://localhost:${streaming.wsPort}`);
        console.log(`🔗 Boss API: http://localhost:${streaming.httpPort}`);
        console.log('\n⚔️ Auto-starting battles with available bosses...');
    }).catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n⚔️ Shutting down battle streaming...');
        await streaming.stop();
        process.exit(0);
    });
}

module.exports = RealTimeBattleStreaming;