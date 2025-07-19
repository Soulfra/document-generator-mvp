"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillionDollarGameService = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../utils/logger");
const ai_service_1 = require("../ai/ai.service");
const gamification_service_1 = require("../gamification/gamification.service");
const payment_service_1 = require("../payment/payment.service");
const webhook_service_1 = require("../webhook/webhook.service");
class BillionDollarGameService extends events_1.EventEmitter {
    prisma;
    aiService;
    gamificationService;
    paymentService;
    webhookService;
    players = new Map();
    agents = new Map();
    gameState;
    collectiveGoals = new Map();
    ENTRY_FEE = 100;
    TARGET_AMOUNT = 1000000000;
    SERVICE_FEE_PERCENTAGE = 2.5;
    MYSTERY_LAYERS = 7;
    QUANTUM_VARIANCE = 0.3;
    dailyCycleTimer;
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient();
        this.aiService = new ai_service_1.AIService();
        this.gamificationService = new gamification_service_1.GamificationService();
        this.paymentService = new payment_service_1.PaymentService();
        this.webhookService = new webhook_service_1.WebhookService();
        this.gameState = {
            totalCollected: 0,
            targetAmount: this.TARGET_AMOUNT,
            startDate: new Date(),
            currentPhase: 1,
            dailyGrowthRate: 0.01,
            activePlayerCount: 0,
            totalPlayerCount: 0,
            mysteryLayersUnlocked: 0,
            quantumMultiplier: 1.0,
            swarmIntelligenceBonus: 0,
            emergentBehaviors: []
        };
        this.initializeGame();
    }
    async initializeGame() {
        logger_1.logger.info('Initializing Billion Dollar Game');
        await this.loadGameState();
        this.initializeCollectiveGoals();
        this.startDailyCycle();
        this.initializeQuantumSystem();
    }
    async joinGame(userId, username, voiceBiometric) {
        try {
            const existingPlayer = Array.from(this.players.values()).find(p => p.userId === userId);
            if (existingPlayer) {
                throw new Error('Already playing the game');
            }
            const userProgress = await this.gamificationService.getUserProgress(userId);
            if (userProgress.tokens < this.ENTRY_FEE) {
                throw new Error('Insufficient tokens for entry fee');
            }
            const player = {
                id: `player-${crypto.randomBytes(8).toString('hex')}`,
                userId,
                username,
                voiceBiometricHash: voiceBiometric ? this.hashVoiceBiometric(voiceBiometric) : undefined,
                agentId: '',
                contributionAmount: this.ENTRY_FEE,
                equityPercentage: 0,
                dailyEarnings: 0,
                totalEarnings: 0,
                joinedAt: new Date(),
                lastActive: new Date(),
                multiplier: 1.0,
                mysteryLayer: 0,
                achievements: ['early_adopter']
            };
            const agent = await this.createAIAgent(player.id);
            player.agentId = agent.id;
            await this.gamificationService.trackAction(userId, 'tokens.spend', this.ENTRY_FEE);
            this.players.set(player.id, player);
            this.agents.set(agent.id, agent);
            this.gameState.totalPlayerCount++;
            this.gameState.activePlayerCount++;
            this.gameState.totalCollected += this.ENTRY_FEE;
            this.recalculateEquity();
            await this.gamificationService.trackAction(userId, 'game.billion.join');
            this.emit('player-joined', { player, agent });
            await this.webhookService.triggerEvent({
                id: `game-join-${Date.now()}`,
                type: 'game.player.joined',
                payload: { playerId: player.id, username, agentType: agent.type },
                timestamp: new Date(),
                source: 'billion-dollar-game',
                userId
            });
            logger_1.logger.info('Player joined Billion Dollar Game', {
                playerId: player.id,
                username,
                agentType: agent.type
            });
            return { player, agent, entryFee: this.ENTRY_FEE };
        }
        catch (error) {
            logger_1.logger.error('Error joining game', error);
            throw error;
        }
    }
    async createAIAgent(playerId) {
        const types = ['worker', 'trader', 'creator', 'gamer', 'social', 'educator'];
        const quantumChoice = Math.random() < 0.05;
        const agentType = quantumChoice ? 'quantum' : types[Math.floor(Math.random() * types.length)];
        const agent = {
            id: `agent-${crypto.randomBytes(8).toString('hex')}`,
            playerId,
            name: this.generateAgentName(agentType),
            type: agentType,
            level: 1,
            experience: 0,
            skills: this.generateInitialSkills(agentType),
            dailyOutput: this.calculateInitialOutput(agentType),
            totalOutput: 0,
            efficiency: 1.0,
            specialAbilities: this.generateSpecialAbilities(agentType),
            createdAt: new Date()
        };
        return agent;
    }
    async runDailyCycle() {
        logger_1.logger.info('Running daily cycle for Billion Dollar Game');
        const dailyResults = [];
        this.gameState.quantumMultiplier = 1.0 + (Math.random() - 0.5) * this.QUANTUM_VARIANCE;
        this.gameState.swarmIntelligenceBonus = Math.log10(this.gameState.activePlayerCount + 1) * 0.1;
        for (const [playerId, player] of this.players) {
            if (!this.isPlayerActive(player))
                continue;
            const agent = this.agents.get(player.agentId);
            if (!agent)
                continue;
            const result = await this.processPlayerDaily(player, agent);
            dailyResults.push(result);
            player.dailyEarnings = result.totalEarnings;
            player.totalEarnings += result.totalEarnings;
            player.lastActive = new Date();
            agent.experience += result.experienceGained;
            agent.totalOutput += result.totalEarnings;
            if (agent.experience >= this.getExperienceRequired(agent.level + 1)) {
                await this.levelUpAgent(agent);
            }
            this.gameState.totalCollected += result.totalEarnings;
        }
        await this.checkMysteryLayers();
        await this.checkCollectiveGoals();
        if (this.gameState.totalCollected >= this.gameState.targetAmount) {
            await this.completeGame();
        }
        this.updateGamePhase();
        this.emit('daily-cycle-complete', {
            date: new Date(),
            totalEarnings: dailyResults.reduce((sum, r) => sum + r.totalEarnings, 0),
            activePlayerCount: this.gameState.activePlayerCount,
            totalCollected: this.gameState.totalCollected,
            percentComplete: (this.gameState.totalCollected / this.gameState.targetAmount) * 100
        });
        await this.saveGameState();
    }
    async processPlayerDaily(player, agent) {
        const baseEarnings = agent.dailyOutput * agent.efficiency;
        const multiplierBonus = baseEarnings * (player.multiplier - 1);
        const swarmBonus = baseEarnings * this.gameState.swarmIntelligenceBonus;
        const quantumBonus = baseEarnings * (this.gameState.quantumMultiplier - 1);
        const mysteryBonus = player.mysteryLayer > 0
            ? baseEarnings * (player.mysteryLayer * 0.1) * Math.random()
            : 0;
        const totalEarnings = Math.floor(baseEarnings + multiplierBonus + swarmBonus + quantumBonus + mysteryBonus);
        const experienceGained = Math.floor(totalEarnings / 10);
        const achievements = [];
        if (totalEarnings > 10000)
            achievements.push('daily_champion');
        if (player.totalEarnings > 100000)
            achievements.push('centurion');
        if (agent.type === 'quantum' && quantumBonus > baseEarnings) {
            achievements.push('quantum_surge');
        }
        return {
            playerId: player.id,
            agentId: agent.id,
            baseEarnings,
            multiplierBonus,
            swarmBonus,
            quantumBonus,
            mysteryBonus,
            totalEarnings,
            experienceGained,
            achievements
        };
    }
    async levelUpAgent(agent) {
        agent.level++;
        agent.efficiency += 0.05;
        agent.dailyOutput *= 1.1;
        const primarySkill = this.getPrimarySkill(agent.type);
        agent.skills[primarySkill] += 5;
        if (Math.random() < 0.3) {
            const newAbility = this.generateNewAbility(agent.type, agent.level);
            if (newAbility && !agent.specialAbilities.includes(newAbility)) {
                agent.specialAbilities.push(newAbility);
            }
        }
        logger_1.logger.info('Agent leveled up', {
            agentId: agent.id,
            newLevel: agent.level,
            efficiency: agent.efficiency
        });
        this.emit('agent-level-up', { agent });
    }
    async checkMysteryLayers() {
        const progressPercentage = (this.gameState.totalCollected / this.gameState.targetAmount) * 100;
        const layersToUnlock = Math.floor(progressPercentage / (100 / this.MYSTERY_LAYERS));
        if (layersToUnlock > this.gameState.mysteryLayersUnlocked) {
            const newLayer = this.gameState.mysteryLayersUnlocked + 1;
            this.gameState.mysteryLayersUnlocked = newLayer;
            switch (newLayer) {
                case 1:
                    this.gameState.emergentBehaviors.push('collaborative_mining');
                    logger_1.logger.info('Mystery Layer 1 unlocked: Collaborative Mining');
                    break;
                case 2:
                    this.gameState.dailyGrowthRate *= 1.5;
                    logger_1.logger.info('Mystery Layer 2 unlocked: Accelerated Growth');
                    break;
                case 3:
                    this.gameState.emergentBehaviors.push('quantum_entanglement');
                    logger_1.logger.info('Mystery Layer 3 unlocked: Quantum Entanglement');
                    break;
                case 4:
                    this.gameState.emergentBehaviors.push('agent_communication');
                    logger_1.logger.info('Mystery Layer 4 unlocked: Agent Communication');
                    break;
                case 5:
                    this.gameState.emergentBehaviors.push('time_dilation');
                    logger_1.logger.info('Mystery Layer 5 unlocked: Time Dilation');
                    break;
                case 6:
                    this.gameState.emergentBehaviors.push('recursive_earnings');
                    logger_1.logger.info('Mystery Layer 6 unlocked: Recursive Earnings');
                    break;
                case 7:
                    this.gameState.emergentBehaviors.push('singularity_approaching');
                    logger_1.logger.info('Mystery Layer 7 unlocked: ???');
                    break;
            }
            const topPlayers = this.getTopPlayers(Math.ceil(this.players.size * 0.1));
            topPlayers.forEach(player => {
                player.mysteryLayer = newLayer;
            });
            this.emit('mystery-layer-unlocked', { layer: newLayer });
        }
    }
    async completeGame() {
        logger_1.logger.info('BILLION DOLLAR GAME COMPLETED!');
        const equityPool = 1000000;
        for (const player of this.players.values()) {
            const contributionRatio = player.totalEarnings / this.gameState.totalCollected;
            player.equityPercentage = contributionRatio * 100;
            const equityUnits = Math.floor(contributionRatio * equityPool);
            await this.gamificationService.trackAction(player.userId, 'game.billion.complete', equityUnits);
            await this.gamificationService.unlockAchievement(player.userId, 'billion_dollar_champion');
        }
        this.emit('game-completed', {
            totalCollected: this.gameState.totalCollected,
            playerCount: this.gameState.totalPlayerCount,
            duration: Date.now() - this.gameState.startDate.getTime(),
            topPlayers: this.getTopPlayers(10)
        });
        await this.webhookService.triggerEvent({
            id: `game-complete-${Date.now()}`,
            type: 'game.billion.completed',
            payload: {
                totalAmount: this.gameState.totalCollected,
                playerCount: this.gameState.totalPlayerCount,
                mysteryLayersUnlocked: this.gameState.mysteryLayersUnlocked
            },
            timestamp: new Date(),
            source: 'billion-dollar-game'
        });
    }
    initializeCollectiveGoals() {
        const goals = [
            {
                id: 'first-million',
                name: 'First Million',
                description: 'Collectively earn $1,000,000',
                targetAmount: 1000000,
                currentAmount: 0,
                reward: '2x multiplier for 24 hours',
                participants: []
            },
            {
                id: 'agent-army',
                name: 'Agent Army',
                description: 'Have 1000 active agents',
                targetAmount: 1000,
                currentAmount: this.agents.size,
                reward: 'Unlock special agent types',
                participants: []
            },
            {
                id: 'quantum-breakthrough',
                name: 'Quantum Breakthrough',
                description: '10 quantum agents reach level 10',
                targetAmount: 10,
                currentAmount: 0,
                reward: 'Quantum variance increased permanently',
                participants: []
            }
        ];
        goals.forEach(goal => this.collectiveGoals.set(goal.id, goal));
    }
    async checkCollectiveGoals() {
        for (const goal of this.collectiveGoals.values()) {
            if (goal.completedAt)
                continue;
            let progress = 0;
            switch (goal.id) {
                case 'first-million':
                    progress = this.gameState.totalCollected;
                    break;
                case 'agent-army':
                    progress = this.agents.size;
                    break;
                case 'quantum-breakthrough':
                    progress = Array.from(this.agents.values())
                        .filter(a => a.type === 'quantum' && a.level >= 10).length;
                    break;
            }
            goal.currentAmount = progress;
            if (progress >= goal.targetAmount) {
                goal.completedAt = new Date();
                await this.completeCollectiveGoal(goal);
            }
        }
    }
    async completeCollectiveGoal(goal) {
        logger_1.logger.info('Collective goal completed', { goalId: goal.id, name: goal.name });
        switch (goal.id) {
            case 'first-million':
                for (const player of this.players.values()) {
                    player.multiplier *= 2;
                    setTimeout(() => {
                        player.multiplier /= 2;
                    }, 24 * 60 * 60 * 1000);
                }
                break;
            case 'agent-army':
                this.gameState.emergentBehaviors.push('advanced_agent_types');
                break;
            case 'quantum-breakthrough':
                this.QUANTUM_VARIANCE *= 1.5;
                break;
        }
        this.emit('collective-goal-completed', { goal });
    }
    generateAgentName(type) {
        const prefixes = {
            worker: ['Efficient', 'Diligent', 'Productive'],
            trader: ['Sharp', 'Strategic', 'Analytical'],
            creator: ['Creative', 'Innovative', 'Artistic'],
            gamer: ['Skilled', 'Competitive', 'Elite'],
            social: ['Connected', 'Influential', 'Charismatic'],
            educator: ['Wise', 'Knowledgeable', 'Insightful'],
            quantum: ['Quantum', 'Entangled', 'Superposed']
        };
        const suffixes = ['Bot', 'Agent', 'AI', 'Mind', 'Entity', 'System'];
        const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const number = Math.floor(Math.random() * 9999);
        return `${prefix}${suffix}${number}`;
    }
    generateInitialSkills(type) {
        const baseSkills = {
            work: 10,
            trading: 10,
            creativity: 10,
            gaming: 10,
            social: 10,
            education: 10,
            quantum: 0
        };
        baseSkills[type === 'quantum' ? 'quantum' : type] = 30;
        Object.keys(baseSkills).forEach(skill => {
            baseSkills[skill] += Math.floor(Math.random() * 10);
        });
        return baseSkills;
    }
    calculateInitialOutput(type) {
        const baseOutputs = {
            worker: 100,
            trader: 150,
            creator: 120,
            gamer: 110,
            social: 130,
            educator: 115,
            quantum: 200
        };
        return baseOutputs[type] + Math.floor(Math.random() * 50);
    }
    generateSpecialAbilities(type) {
        const abilities = {
            worker: ['overtime_surge', 'efficiency_boost', 'task_automation'],
            trader: ['market_prediction', 'arbitrage_finder', 'risk_mitigation'],
            creator: ['viral_content', 'trend_setter', 'inspiration_burst'],
            gamer: ['combo_mastery', 'speedrun_tactics', 'meta_breaker'],
            social: ['network_expansion', 'influence_cascade', 'viral_spread'],
            educator: ['knowledge_synthesis', 'accelerated_learning', 'wisdom_sharing'],
            quantum: ['superposition', 'entanglement', 'probability_collapse']
        };
        const typeAbilities = abilities[type];
        const selectedAbility = typeAbilities[Math.floor(Math.random() * typeAbilities.length)];
        return [selectedAbility];
    }
    generateNewAbility(type, level) {
        const advancedAbilities = {
            worker: ['mega_production', 'zero_downtime', 'parallel_processing'],
            trader: ['quantum_trading', 'future_sight', 'market_manipulation'],
            creator: ['reality_warping', 'meme_lord', 'cultural_revolution'],
            gamer: ['god_mode', 'frame_perfect', 'exploit_master'],
            social: ['hive_mind', 'telepathic_link', 'mass_hypnosis'],
            educator: ['enlightenment', 'collective_consciousness', 'knowledge_download'],
            quantum: ['timeline_split', 'dimension_hop', 'causality_breach']
        };
        if (level < 5)
            return null;
        const available = advancedAbilities[type];
        return available[Math.floor(Math.random() * available.length)];
    }
    getPrimarySkill(type) {
        return type === 'quantum' ? 'quantum' : type;
    }
    isPlayerActive(player) {
        const daysSinceActive = (Date.now() - player.lastActive.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive < 7;
    }
    getExperienceRequired(level) {
        return level * level * 100;
    }
    updateGamePhase() {
        const progressPercentage = (this.gameState.totalCollected / this.gameState.targetAmount) * 100;
        if (progressPercentage >= 75 && this.gameState.currentPhase < 4) {
            this.gameState.currentPhase = 4;
            this.gameState.dailyGrowthRate = 0.05;
        }
        else if (progressPercentage >= 50 && this.gameState.currentPhase < 3) {
            this.gameState.currentPhase = 3;
            this.gameState.dailyGrowthRate = 0.03;
        }
        else if (progressPercentage >= 25 && this.gameState.currentPhase < 2) {
            this.gameState.currentPhase = 2;
            this.gameState.dailyGrowthRate = 0.02;
        }
    }
    hashVoiceBiometric(voice) {
        return crypto.createHash('sha256').update(voice).digest('hex');
    }
    recalculateEquity() {
        const totalContribution = Array.from(this.players.values())
            .reduce((sum, p) => sum + p.totalEarnings, 0);
        for (const player of this.players.values()) {
            player.equityPercentage = totalContribution > 0
                ? (player.totalEarnings / totalContribution) * 100
                : 0;
        }
    }
    getTopPlayers(count) {
        return Array.from(this.players.values())
            .sort((a, b) => b.totalEarnings - a.totalEarnings)
            .slice(0, count);
    }
    startDailyCycle() {
        this.runDailyCycle();
        const interval = process.env.NODE_ENV === 'development' ? 60000 : 24 * 60 * 60 * 1000;
        this.dailyCycleTimer = setInterval(() => this.runDailyCycle(), interval);
    }
    initializeQuantumSystem() {
        setInterval(() => {
            if (Math.random() < 0.01) {
                const quantumEvent = this.triggerQuantumEvent();
                this.emit('quantum-event', quantumEvent);
            }
        }, 60000);
    }
    triggerQuantumEvent() {
        const events = [
            {
                type: 'quantum_surge',
                effect: () => {
                    this.gameState.quantumMultiplier *= 2;
                    setTimeout(() => {
                        this.gameState.quantumMultiplier /= 2;
                    }, 3600000);
                },
                description: 'Quantum surge doubles all earnings for 1 hour'
            },
            {
                type: 'timeline_shift',
                effect: () => {
                    const luckyAgents = Array.from(this.agents.values())
                        .sort(() => Math.random() - 0.5)
                        .slice(0, Math.ceil(this.agents.size * 0.1));
                    luckyAgents.forEach(agent => {
                        agent.efficiency *= 1.5;
                    });
                },
                description: 'Timeline shift enhances 10% of agents'
            },
            {
                type: 'entanglement_cascade',
                effect: () => {
                    const agents = Array.from(this.agents.values());
                    for (let i = 0; i < agents.length - 1; i += 2) {
                        agents[i].dailyOutput += agents[i + 1].dailyOutput * 0.1;
                        agents[i + 1].dailyOutput += agents[i].dailyOutput * 0.1;
                    }
                },
                description: 'Quantum entanglement links agent pairs'
            }
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        event.effect();
        logger_1.logger.info('Quantum event triggered', { type: event.type });
        return event;
    }
    async loadGameState() {
        logger_1.logger.info('Loading game state');
    }
    async saveGameState() {
        logger_1.logger.debug('Saving game state');
    }
    getGameStats() {
        const progressPercentage = (this.gameState.totalCollected / this.gameState.targetAmount) * 100;
        return {
            totalCollected: this.gameState.totalCollected,
            targetAmount: this.gameState.targetAmount,
            progressPercentage,
            playerCount: this.gameState.totalPlayerCount,
            activePlayerCount: this.gameState.activePlayerCount,
            topPlayers: this.getTopPlayers(10).map(p => ({
                username: p.username,
                totalEarnings: p.totalEarnings,
                equityPercentage: p.equityPercentage
            })),
            currentPhase: this.gameState.currentPhase,
            mysteryLayersUnlocked: this.gameState.mysteryLayersUnlocked,
            collectiveGoals: Array.from(this.collectiveGoals.values()).map(g => ({
                name: g.name,
                progress: (g.currentAmount / g.targetAmount) * 100,
                completed: !!g.completedAt
            }))
        };
    }
    async getPlayerData(userId) {
        const player = Array.from(this.players.values()).find(p => p.userId === userId);
        if (!player)
            return { player: null, agent: null, rank: 0 };
        const agent = this.agents.get(player.agentId);
        const sortedPlayers = Array.from(this.players.values())
            .sort((a, b) => b.totalEarnings - a.totalEarnings);
        const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
        return { player, agent, rank };
    }
    stop() {
        if (this.dailyCycleTimer) {
            clearInterval(this.dailyCycleTimer);
        }
        logger_1.logger.info('Billion Dollar Game service stopped');
    }
}
exports.BillionDollarGameService = BillionDollarGameService;
//# sourceMappingURL=billion-dollar-game.service.js.map