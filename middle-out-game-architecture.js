#!/usr/bin/env node

/**
 * 🎮 Middle-Out Game Architecture
 * 
 * Creates the nested "middle out" gaming experience where:
 * 🏟️ BATTLE ARENA (Outer Ring) - Combat and competition
 *     ↓ watches ↓
 * 👥 AUDIENCE LAYER (Ring 2) - Spectators betting and reacting  
 *     ↓ watches ↓
 * 💃 KING/QUEEN DANCE (Core) - Conversation-driven performances
 *     ↓ generates ↓
 * 🎵 DATA FLOW - Music, colors, frequencies, database proofs
 * 
 * Each ring has different mechanics but all are interconnected through
 * conversation data flowing from the center outward.
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// Import our conversation and database systems  
const ConversationToDatabaseBridge = require('./conversation-to-database-bridge');
const ChatLogIngestionPipeline = require('./chat-log-ingestion-pipeline');
const UniversalBrandEngine = require('./universal-brand-engine');
const ColorStateProofEngine = require('./color-state-proof-engine');

class MiddleOutGameArchitecture extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Game configuration
            maxPlayers: config.maxPlayers || 100,
            audienceCapacity: config.audienceCapacity || 1000,
            battleArenaSize: config.battleArenaSize || 50,
            
            // Layer configuration
            coreRadius: config.coreRadius || 100,        // King/Queen dance area
            audienceRadius: config.audienceRadius || 300, // Audience ring
            battleRadius: config.battleRadius || 500,     // Battle arena
            
            // Game mechanics
            conversationToGameplay: config.conversationToGameplay !== false,
            realTimeBattles: config.realTimeBattles !== false,
            audienceBetting: config.audienceBetting || false,
            proofBasedRewards: config.proofBasedRewards !== false,
            
            // Economic system
            tokenEconomy: config.tokenEconomy || false,
            stakingMechanism: config.stakingMechanism || false,
            
            ...config
        };
        
        // Game state
        this.gameState = {
            // Core dance state
            kingQueenDance: {
                active: false,
                currentDancers: [],
                danceType: null,
                synchronization: 0,
                energy: 'medium',
                musicFrequency: 528,
                colorState: 'green'
            },
            
            // Audience layer state
            audience: {
                totalSpectators: 0,
                activeSpectators: new Map(),
                engagementLevel: 0,
                bets: new Map(),
                reactions: [],
                favoritePerformers: new Map()
            },
            
            // Battle arena state
            battleArena: {
                activeBattles: new Map(),
                fighters: new Map(),
                leaderboard: [],
                currentTournament: null,
                battleHistory: []
            },
            
            // Meta game state
            overallEnergy: 'medium',
            systemHealth: 'healthy',
            gameSession: crypto.randomBytes(8).toString('hex'),
            startTime: new Date(),
            totalEvents: 0
        };
        
        // Game systems
        this.conversationBridge = null;
        this.brandEngine = null;
        this.colorEngine = null;
        
        // Player registries
        this.players = new Map();
        this.spectators = new Map();
        this.fighters = new Map();
        
        // Event history for replay and analysis
        this.eventHistory = [];
        this.gameMetrics = {
            totalGamesPlayed: 0,
            totalConversationsProcessed: 0,
            totalBattles: 0,
            averageEngagement: 0,
            topPerformers: []
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize the middle-out game architecture
     */
    async initialize() {
        console.log('🎮 Initializing Middle-Out Game Architecture...');
        
        try {
            // Initialize conversation bridge for real data flow
            this.conversationBridge = new ConversationToDatabaseBridge({
                realtimeMode: true,
                verificationLevel: 'standard',
                autoProofGeneration: true
            });
            await this.conversationBridge.initialize();
            
            // Initialize brand engine for game aesthetics
            this.brandEngine = new UniversalBrandEngine({
                accessLevel: 'expert',
                enableVisuals: true,
                enableAudio: true
            });
            await this.brandEngine.initialize();
            
            // Initialize color engine for game state
            this.colorEngine = new ColorStateProofEngine({
                cycleInterval: 2000,
                proofThreshold: 75
            });
            this.colorEngine.start();
            
            // Set up event listeners between game layers
            this.setupGameEventListeners();
            
            // Initialize game mechanics
            this.initializeGameMechanics();
            
            this.initialized = true;
            console.log('✅ Middle-Out Game Architecture initialized');
            console.log(`🎯 Game session: ${this.gameState.gameSession}`);
            console.log(`🏟️ Arena capacity: ${this.config.maxPlayers} players, ${this.config.audienceCapacity} spectators`);
            
            this.emit('game_initialized', this.gameState);
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Set up event listeners between game layers
     */
    setupGameEventListeners() {
        // Listen to conversation events from the bridge
        this.conversationBridge.on('live_dance_event', (data) => {
            this.handleCoreDanceEvent(data);
        });
        
        this.conversationBridge.on('live_audience_event', (data) => {
            this.handleAudienceLayerEvent(data);
        });
        
        this.conversationBridge.on('live_battle_event', (data) => {
            this.handleBattleArenaEvent(data);
        });
        
        this.conversationBridge.on('live_color_change', (data) => {
            this.handleColorStateChange(data);
        });
        
        // Listen to color engine for game state changes
        this.colorEngine.on('state_change', (data) => {
            this.propagateStateChange(data);
        });
        
        this.colorEngine.on('proof_attempt', (data) => {
            this.handleProofReward(data);
        });
    }
    
    /**
     * Initialize game mechanics
     */
    initializeGameMechanics() {
        // Core dance mechanics
        this.coreMechanics = {
            danceTypes: {
                waltz: { syncBonus: 1.2, energyMod: 0.8, audienceAppeal: 'elegant' },
                tango: { syncBonus: 1.5, energyMod: 1.3, audienceAppeal: 'passionate' },
                salsa: { syncBonus: 1.1, energyMod: 1.5, audienceAppeal: 'energetic' },
                chaos: { syncBonus: 0.7, energyMod: 2.0, audienceAppeal: 'unpredictable' }
            },
            
            synchronizationRewards: {
                perfect: { points: 100, colorBonus: 'gold' },
                excellent: { points: 75, colorBonus: 'purple' },
                good: { points: 50, colorBonus: 'green' },
                poor: { points: 20, colorBonus: 'yellow' },
                critical: { points: 0, colorBonus: 'red' }
            }
        };
        
        // Audience mechanics
        this.audienceMechanics = {
            engagementFactors: {
                danceQuality: 0.4,
                conversationDepth: 0.3,
                battleExcitement: 0.2,
                systemHealth: 0.1
            },
            
            reactionTypes: {
                cheer: { energy: +2, probability: 0.4 },
                boo: { energy: -1, probability: 0.1 },
                gasp: { energy: +1, probability: 0.2 },
                applause: { energy: +3, probability: 0.3 }
            },
            
            bettingOdds: {
                waltz: 1.5,
                tango: 2.0,
                salsa: 1.8,
                chaos: 3.0
            }
        };
        
        // Battle arena mechanics
        this.battleMechanics = {
            battleTypes: {
                problem_solving: { 
                    duration: 300000, // 5 minutes
                    winCondition: 'first_solution',
                    skillRequired: 'technical'
                },
                debate: {
                    duration: 600000, // 10 minutes
                    winCondition: 'audience_vote',
                    skillRequired: 'persuasion'
                },
                collaboration: {
                    duration: 900000, // 15 minutes
                    winCondition: 'joint_achievement',
                    skillRequired: 'teamwork'
                }
            },
            
            rankingSystem: {
                novice: { minPoints: 0, maxPoints: 100 },
                intermediate: { minPoints: 100, maxPoints: 500 },
                expert: { minPoints: 500, maxPoints: 1000 },
                master: { minPoints: 1000, maxPoints: Infinity }
            }
        };
    }
    
    /**
     * Process conversation data through the game layers
     */
    async processConversationIntoGame(conversationData, metadata = {}) {
        console.log(`🎮 Processing conversation into game: ${metadata.source || 'unknown'}`);
        
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            // Process through conversation bridge first
            const verificationResult = await this.conversationBridge.processAndVerifyConversation(
                conversationData, 
                { ...metadata, gameSession: this.gameState.gameSession }
            );
            
            // Extract game events from verification
            const gameEvents = this.extractGameEvents(verificationResult);
            
            // Apply events to each game layer
            await this.applyEventsToCore(gameEvents.coreEvents);
            await this.applyEventsToAudience(gameEvents.audienceEvents);
            await this.applyEventsToBattleArena(gameEvents.battleEvents);
            
            // Update overall game state
            this.updateGameState(gameEvents);
            
            // Generate game rewards
            const rewards = this.calculateRewards(gameEvents, verificationResult);
            
            // Emit game update
            const gameUpdate = {
                gameSession: this.gameState.gameSession,
                timestamp: new Date(),
                conversationId: verificationResult.conversationId,
                gameEvents,
                rewards,
                newGameState: this.getGameState(),
                playerUpdates: this.getPlayerUpdates(gameEvents)
            };
            
            this.eventHistory.push(gameUpdate);
            this.gameMetrics.totalConversationsProcessed++;
            this.gameMetrics.totalGamesPlayed++;
            
            this.emit('game_update', gameUpdate);
            
            console.log(`🎮 Game update complete: ${gameEvents.totalEvents} events, ${rewards.totalRewards} rewards`);
            
            return gameUpdate;
            
        } catch (error) {
            console.error('❌ Game processing failed:', error);
            throw error;
        }
    }
    
    /**
     * Extract game events from verification result
     */
    extractGameEvents(verificationResult) {
        const coreEvents = [];
        const audienceEvents = [];
        const battleEvents = [];
        
        // Extract core dance events
        if (verificationResult.databaseVerification?.status === 'passed') {
            coreEvents.push({
                type: 'dance_performance',
                quality: verificationResult.proofVerification?.proofAttempt?.score || 50,
                synchronization: verificationResult.proofVerification?.colorState?.synchronization || 50,
                timestamp: new Date()
            });
        }
        
        // Extract audience events based on engagement
        const engagement = verificationResult.systemPerformance?.database || 80;
        audienceEvents.push({
            type: 'audience_engagement',
            level: this.mapEngagementLevel(engagement),
            spectatorCount: Math.floor(engagement / 10),
            timestamp: new Date()
        });
        
        // Extract battle events from verification challenges
        if (verificationResult.overallStatus === 'failed') {
            battleEvents.push({
                type: 'system_challenge',
                difficulty: 'high',
                challenger: 'system_error',
                timestamp: new Date()
            });
        } else if (verificationResult.overallStatus === 'partial') {
            battleEvents.push({
                type: 'technical_duel',
                difficulty: 'medium',
                challenger: 'data_inconsistency',
                timestamp: new Date()
            });
        }
        
        return {
            coreEvents,
            audienceEvents,
            battleEvents,
            totalEvents: coreEvents.length + audienceEvents.length + battleEvents.length
        };
    }
    
    /**
     * Apply events to core dance layer
     */
    async applyEventsToCore(coreEvents) {
        for (const event of coreEvents) {
            switch (event.type) {
                case 'dance_performance':
                    await this.handleDancePerformance(event);
                    break;
                case 'synchronization_change':
                    await this.handleSynchronizationChange(event);
                    break;
                case 'energy_shift':
                    await this.handleEnergyShift(event);
                    break;
            }
        }
    }
    
    /**
     * Apply events to audience layer
     */
    async applyEventsToAudience(audienceEvents) {
        for (const event of audienceEvents) {
            switch (event.type) {
                case 'audience_engagement':
                    await this.handleAudienceEngagement(event);
                    break;
                case 'spectator_join':
                    await this.handleSpectatorJoin(event);
                    break;
                case 'betting_activity':
                    await this.handleBettingActivity(event);
                    break;
            }
        }
    }
    
    /**
     * Apply events to battle arena
     */
    async applyEventsToBattleArena(battleEvents) {
        for (const event of battleEvents) {
            switch (event.type) {
                case 'system_challenge':
                    await this.handleSystemChallenge(event);
                    break;
                case 'technical_duel':
                    await this.handleTechnicalDuel(event);
                    break;
                case 'collaboration_quest':
                    await this.handleCollaborationQuest(event);
                    break;
            }
        }
    }
    
    /**
     * Core layer event handlers
     */
    async handleDancePerformance(event) {
        const danceType = this.determineDanceType(event.quality, event.synchronization);
        const mechanics = this.coreMechanics.danceTypes[danceType];
        
        this.gameState.kingQueenDance = {
            active: true,
            danceType,
            synchronization: event.synchronization,
            quality: event.quality,
            bonusMultiplier: mechanics.syncBonus,
            audienceAppeal: mechanics.audienceAppeal,
            timestamp: event.timestamp
        };
        
        // Update color state based on performance
        const colorState = this.performanceToColorState(event.quality);
        this.colorEngine.forceStateTransition(colorState, 'dance_performance');
        
        console.log(`💃 Dance performance: ${danceType} (quality: ${event.quality}%, sync: ${event.synchronization}%)`);
        
        this.emit('core_dance_event', this.gameState.kingQueenDance);
    }
    
    /**
     * Audience layer event handlers
     */
    async handleAudienceEngagement(event) {
        const newSpectators = event.spectatorCount;
        this.gameState.audience.totalSpectators += newSpectators;
        this.gameState.audience.engagementLevel = event.level;
        
        // Generate audience reactions
        const reactions = this.generateAudienceReactions(event.level, newSpectators);
        this.gameState.audience.reactions.push(...reactions);
        
        // Update betting odds if enabled
        if (this.config.audienceBetting) {
            this.updateBettingOdds(event);
        }
        
        console.log(`👥 Audience engagement: ${event.level} level, +${newSpectators} spectators`);
        
        this.emit('audience_engagement_event', {
            totalSpectators: this.gameState.audience.totalSpectators,
            engagementLevel: event.level,
            newReactions: reactions
        });
    }
    
    /**
     * Battle arena event handlers
     */
    async handleSystemChallenge(event) {
        const challengeId = crypto.randomBytes(4).toString('hex');
        
        const challenge = {
            id: challengeId,
            type: event.type,
            difficulty: event.difficulty,
            challenger: event.challenger,
            status: 'active',
            participants: [],
            startTime: event.timestamp,
            rewards: this.calculateChallengeRewards(event.difficulty)
        };
        
        this.gameState.battleArena.activeBattles.set(challengeId, challenge);
        
        console.log(`⚔️ System challenge started: ${event.challenger} (${event.difficulty})`);
        
        this.emit('battle_challenge_event', challenge);
        
        return challengeId;
    }
    
    /**
     * Player management
     */
    async registerPlayer(playerId, playerData) {
        const player = {
            id: playerId,
            name: playerData.name || `Player_${playerId.slice(0, 8)}`,
            type: playerData.type || 'participant', // participant, spectator, fighter
            joinTime: new Date(),
            stats: {
                totalGames: 0,
                totalRewards: 0,
                bestPerformance: 0,
                currentStreak: 0
            },
            location: this.assignPlayerLocation(playerData.type),
            status: 'active'
        };
        
        this.players.set(playerId, player);
        
        // Add to appropriate registry
        switch (player.type) {
            case 'spectator':
                this.spectators.set(playerId, player);
                break;
            case 'fighter':
                this.fighters.set(playerId, player);
                break;
        }
        
        console.log(`👤 Player registered: ${player.name} (${player.type})`);
        
        this.emit('player_registered', player);
        
        return player;
    }
    
    /**
     * Assign player to appropriate layer based on type
     */
    assignPlayerLocation(playerType) {
        switch (playerType) {
            case 'participant':
                return {
                    layer: 'core',
                    radius: this.config.coreRadius,
                    maxCapacity: 4 // King, Queen, and maybe observers
                };
            case 'spectator':
                return {
                    layer: 'audience',
                    radius: this.config.audienceRadius,
                    maxCapacity: this.config.audienceCapacity
                };
            case 'fighter':
                return {
                    layer: 'battle_arena',
                    radius: this.config.battleRadius,
                    maxCapacity: this.config.battleArenaSize
                };
            default:
                return {
                    layer: 'audience',
                    radius: this.config.audienceRadius,
                    maxCapacity: this.config.audienceCapacity
                };
        }
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        return {
            ...this.gameState,
            layerStats: {
                core: {
                    active: this.gameState.kingQueenDance.active,
                    participants: this.getLayerParticipants('core').length,
                    energy: this.gameState.kingQueenDance.energy
                },
                audience: {
                    spectators: this.gameState.audience.totalSpectators,
                    engagement: this.gameState.audience.engagementLevel,
                    activeBets: this.gameState.audience.bets.size
                },
                battleArena: {
                    activeBattles: this.gameState.battleArena.activeBattles.size,
                    fighters: this.fighters.size,
                    currentTournament: this.gameState.battleArena.currentTournament
                }
            },
            metrics: this.gameMetrics,
            systemHealth: this.determineSystemHealth()
        };
    }
    
    /**
     * Helper methods
     */
    determineDanceType(quality, synchronization) {
        if (quality > 90 && synchronization > 85) return 'waltz';
        if (quality > 70 && synchronization > 70) return 'tango';
        if (quality > 50 || synchronization > 50) return 'salsa';
        return 'chaos';
    }
    
    performanceToColorState(quality) {
        if (quality >= 90) return 'gold';
        if (quality >= 75) return 'purple';
        if (quality >= 50) return 'green';
        if (quality >= 25) return 'yellow';
        return 'red';
    }
    
    mapEngagementLevel(score) {
        if (score >= 90) return 'ecstatic';
        if (score >= 75) return 'excited';
        if (score >= 50) return 'interested';
        if (score >= 25) return 'bored';
        return 'leaving';
    }
    
    generateAudienceReactions(engagementLevel, count) {
        const reactions = [];
        const reactionTypes = Object.keys(this.audienceMechanics.reactionTypes);
        
        for (let i = 0; i < count; i++) {
            const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
            reactions.push({
                type: reactionType,
                intensity: this.mapEngagementToIntensity(engagementLevel),
                timestamp: new Date()
            });
        }
        
        return reactions;
    }
    
    calculateRewards(gameEvents, verificationResult) {
        let totalRewards = 0;
        const rewards = [];
        
        // Core dance rewards
        for (const event of gameEvents.coreEvents) {
            if (event.type === 'dance_performance') {
                const reward = Math.floor(event.quality * 2);
                rewards.push({ type: 'dance_performance', amount: reward });
                totalRewards += reward;
            }
        }
        
        // Proof verification rewards
        if (verificationResult.overallStatus === 'passed') {
            const proofReward = 100;
            rewards.push({ type: 'proof_verification', amount: proofReward });
            totalRewards += proofReward;
        }
        
        return { totalRewards, rewards };
    }
    
    getLayerParticipants(layer) {
        return Array.from(this.players.values()).filter(p => p.location.layer === layer);
    }
    
    determineSystemHealth() {
        const avgEngagement = this.gameState.audience.engagementLevel;
        const activeBattles = this.gameState.battleArena.activeBattles.size;
        const danceActive = this.gameState.kingQueenDance.active;
        
        if (danceActive && avgEngagement > 70 && activeBattles > 0) return 'excellent';
        if (danceActive && avgEngagement > 50) return 'good';
        if (avgEngagement > 30) return 'fair';
        return 'poor';
    }
}

// Export the game architecture
module.exports = MiddleOutGameArchitecture;

// Demo if run directly
if (require.main === module) {
    const game = new MiddleOutGameArchitecture({
        maxPlayers: 50,
        audienceCapacity: 500,
        audienceBetting: true,
        realTimeBattles: true
    });
    
    console.log('🎮 Middle-Out Game Architecture Demo\n');
    
    (async () => {
        try {
            await game.initialize();
            
            // Register demo players
            await game.registerPlayer('king_001', { name: 'TechnicalKing', type: 'participant' });
            await game.registerPlayer('queen_001', { name: 'HumanQueen', type: 'participant' });
            await game.registerPlayer('spec_001', { name: 'Spectator1', type: 'spectator' });
            await game.registerPlayer('fighter_001', { name: 'SystemSlayer', type: 'fighter' });
            
            // Simulate processing our conversation
            const demoConversation = `
Human: alright thats all looking good but then how do we verify its working with whats been happening in our conversations...
Assistant: I understand! You want to verify that all this complex architecture actually works with your real conversation data and build a game around the "middle out" concept.
Human: exactly! like how do we build games around it where people watch each other
Assistant: We can create nested layers - the core dance between King/Queen, audience watching them, and battle arena surrounding everything.
`;
            
            const gameResult = await game.processConversationIntoGame(demoConversation, {
                source: 'demo_conversation',
                timestamp: new Date()
            });
            
            console.log('🎮 Game processing result:');
            console.log(`- Events generated: ${gameResult.gameEvents.totalEvents}`);
            console.log(`- Rewards earned: ${gameResult.rewards.totalRewards}`);
            console.log(`- Game state: ${JSON.stringify(gameResult.newGameState.layerStats, null, 2)}`);
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    })();
}