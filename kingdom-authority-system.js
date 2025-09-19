#!/usr/bin/env node

/**
 * 👑⚔️🏰 KINGDOM AUTHORITY SYSTEM
 * Reddit-style hierarchical authority system where boss creators become kingdom rulers
 * Implements reputation, authority levels, and democratic validation mechanisms
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class KingdomAuthoritySystem extends EventEmitter {
    constructor() {
        super();
        
        // User database with authority levels
        this.users = new Map();
        this.kingdoms = new Map(); // Boss ID -> Kingdom data
        this.quests = new Map(); // Battle ID -> Quest data
        this.votes = new Map(); // Vote ID -> Vote data
        this.reputationHistory = new Map(); // User ID -> History array
        
        // Authority hierarchy (based on existing color system)
        this.authorityLevels = {
            'EXILE': {
                color: '#8B0000', // Dark red
                minReputation: -Infinity,
                maxReputation: -100,
                title: 'Exiled',
                permissions: [],
                rangeMultiplier: 0.1,
                trustLevel: 0.0,
                voteWeight: 0,
                revenueShare: 0.0
            },
            'PEASANT': {
                color: '#FF0000', // Red (existing)
                minReputation: -99,
                maxReputation: -1,
                title: 'Peasant',
                permissions: ['view'],
                rangeMultiplier: 0.5,
                trustLevel: 0.1,
                voteWeight: 0.5,
                revenueShare: 0.0
            },
            'CITIZEN': {
                color: '#0000FF', // Blue (existing - new users)
                minReputation: 0,
                maxReputation: 99,
                title: 'Citizen',
                permissions: ['view', 'predict', 'chat'],
                rangeMultiplier: 0.6,
                trustLevel: 0.5,
                voteWeight: 1.0,
                revenueShare: 0.02
            },
            'MERCHANT': {
                color: '#FFFF00', // Yellow (existing - away/caution)
                minReputation: 100,
                maxReputation: 299,
                title: 'Merchant',
                permissions: ['view', 'predict', 'chat', 'trade'],
                rangeMultiplier: 0.8,
                trustLevel: 0.7,
                voteWeight: 1.5,
                revenueShare: 0.03
            },
            'KNIGHT': {
                color: '#00FF00', // Green (existing - online/trusted)
                minReputation: 300,
                maxReputation: 699,
                title: 'Knight',
                permissions: ['view', 'predict', 'chat', 'trade', 'validate', 'moderate_battles'],
                rangeMultiplier: 1.0,
                trustLevel: 0.9,
                voteWeight: 2.0,
                revenueShare: 0.05
            },
            'LORD': {
                color: '#800080', // Purple (existing - premium)
                minReputation: 700,
                maxReputation: 1499,
                title: 'Lord/Lady',
                permissions: ['view', 'predict', 'chat', 'trade', 'validate', 'moderate_battles', 'create_quests', 'appoint_knights'],
                rangeMultiplier: 1.5,
                trustLevel: 1.0,
                voteWeight: 3.0,
                revenueShare: 0.08
            },
            'KING': {
                color: '#000000', // Black (existing - epoch/admin)
                minReputation: 1500,
                maxReputation: Infinity,
                title: 'King/Queen',
                permissions: ['view', 'predict', 'chat', 'trade', 'validate', 'moderate_battles', 'create_quests', 'appoint_knights', 'admin', 'rule_kingdom'],
                rangeMultiplier: 3.0,
                trustLevel: 1.0,
                voteWeight: 5.0,
                revenueShare: 0.15
            }
        };
        
        // Quest types and objectives
        this.questTypes = {
            'BATTLE_OUTCOME': {
                name: 'Predict Battle Winner',
                description: 'Predict which side will win the battle',
                reputationReward: 10,
                reputationPenalty: -5,
                options: ['boss', 'players', 'draw']
            },
            'BATTLE_DURATION': {
                name: 'Predict Battle Length',
                description: 'Predict how long the battle will last',
                reputationReward: 8,
                reputationPenalty: -3,
                tolerance: 30 // seconds
            },
            'DAMAGE_DEALER': {
                name: 'Predict Top Damage Dealer',
                description: 'Who will deal the most damage?',
                reputationReward: 12,
                reputationPenalty: -6
            },
            'FIRST_DEATH': {
                name: 'Predict First Death',
                description: 'Which entity will die first?',
                reputationReward: 15,
                reputationPenalty: -8
            },
            'KINGDOM_JUDGMENT': {
                name: 'Kingdom Fairness Vote',
                description: 'Was this battle fair and accurate?',
                reputationReward: 5,
                reputationPenalty: -2,
                options: ['fair', 'unfair', 'needs_review']
            }
        };
        
        // Democratic validation settings
        this.validationConfig = {
            minimumVoters: 3,        // Minimum voters for consensus
            consensusThreshold: 0.6, // 60% agreement needed
            voteTimeWindow: 300000,  // 5 minutes to vote
            expertWeightMultiplier: 2.0, // Knights+ votes count more
            autoResolveTime: 600000  // 10 minutes max voting time
        };
        
        console.log('👑 Kingdom Authority System initialized');
        this.initializeSystemUsers();
    }
    
    initializeSystemUsers() {
        // Create system admin user
        this.createUser('system', {
            name: 'System Administrator',
            reputation: 10000,
            isSystem: true,
            kingdomsRuled: [],
            achievements: ['system_admin'],
            joinedAt: Date.now()
        });
        
        console.log('👑 System users initialized');
    }
    
    // User Management
    createUser(userId, userData = {}) {
        const user = {
            id: userId,
            name: userData.name || userId,
            reputation: userData.reputation || 0,
            totalVotes: 0,
            correctVotes: 0,
            accuracy: 0.0,
            kingdomsRuled: userData.kingdomsRuled || [],
            kingdomsServed: [], // Kingdoms where user has roles
            achievements: userData.achievements || [],
            createdAt: userData.joinedAt || Date.now(),
            lastActive: Date.now(),
            isSystem: userData.isSystem || false,
            
            // Derived authority properties
            authority: this.calculateAuthority(userData.reputation || 0),
            color: null,
            permissions: [],
            voteWeight: 0,
            trustLevel: 0,
            rangeMultiplier: 0
        };
        
        this.updateUserAuthority(user);
        this.users.set(userId, user);
        
        // Initialize reputation history
        this.reputationHistory.set(userId, [{
            timestamp: Date.now(),
            change: userData.reputation || 0,
            reason: 'account_created',
            reputation: userData.reputation || 0
        }]);
        
        this.emit('user_created', user);
        console.log(`👤 User created: ${user.name} (${user.authority.title})`);
        
        return user;
    }
    
    getUser(userId) {
        return this.users.get(userId);
    }
    
    updateUserAuthority(user) {
        const authority = this.calculateAuthority(user.reputation);
        
        user.authority = authority;
        user.color = authority.color;
        user.permissions = [...authority.permissions];
        user.voteWeight = authority.voteWeight;
        user.trustLevel = authority.trustLevel;
        user.rangeMultiplier = authority.rangeMultiplier;
        
        return user;
    }
    
    calculateAuthority(reputation) {
        for (const [level, config] of Object.entries(this.authorityLevels)) {
            if (reputation >= config.minReputation && reputation <= config.maxReputation) {
                return {
                    level: level,
                    ...config
                };
            }
        }
        
        // Default to CITIZEN if somehow outside ranges
        return {
            level: 'CITIZEN',
            ...this.authorityLevels.CITIZEN
        };
    }
    
    // Kingdom Management
    createKingdom(bossId, bossData, creatorId) {
        const creator = this.getUser(creatorId);
        if (!creator) {
            throw new Error('Creator user not found');
        }
        
        const kingdom = {
            id: bossId,
            name: bossData.name + ' Kingdom',
            bossId: bossId,
            boss: bossData,
            ruler: creatorId,
            founded: Date.now(),
            
            // Kingdom stats
            totalBattles: 0,
            totalRevenue: 0,
            totalQuests: 0,
            popularity: 0,
            
            // Kingdom hierarchy
            court: {
                ruler: creatorId,
                lords: [], // Appointed by ruler
                knights: [], // Appointed by lords/ruler
                bannedUsers: []
            },
            
            // Kingdom rules and settings
            rules: {
                questCreationRights: 'LORD', // Minimum authority to create quests
                moderationRights: 'KNIGHT',
                battleApprovalRequired: false,
                customRevenueShares: {}, // Custom shares for specific users
                kingdomTax: 0.05 // 5% kingdom tax on all activities
            },
            
            // Active quests and events
            activeQuests: [],
            completedQuests: [],
            kingdomEvents: []
        };
        
        this.kingdoms.set(bossId, kingdom);
        
        // Add kingdom to creator's ruled kingdoms
        creator.kingdomsRuled.push(bossId);
        
        // Grant ruler bonus reputation
        this.addReputation(creatorId, 50, 'kingdom_founded', `Founded ${kingdom.name}`);
        
        this.emit('kingdom_created', kingdom, creator);
        console.log(`🏰 Kingdom created: ${kingdom.name} ruled by ${creator.name}`);
        
        return kingdom;
    }
    
    getKingdom(kingdomId) {
        return this.kingdoms.get(kingdomId);
    }
    
    appointToPosition(kingdomId, userId, position, appointedBy) {
        const kingdom = this.kingdoms.get(kingdomId);
        const user = this.users.get(userId);
        const appointer = this.users.get(appointedBy);
        
        if (!kingdom || !user || !appointer) {
            throw new Error('Kingdom, user, or appointer not found');
        }
        
        // Check appointment permissions
        if (!this.canAppoint(appointer, position, kingdom)) {
            throw new Error(`${appointer.name} cannot appoint to position ${position}`);
        }
        
        // Add to kingdom court
        if (position === 'LORD' && !kingdom.court.lords.includes(userId)) {
            kingdom.court.lords.push(userId);
            user.kingdomsServed.push({
                kingdomId: kingdomId,
                position: 'LORD',
                appointedBy: appointedBy,
                appointedAt: Date.now()
            });
            
            this.addReputation(userId, 25, 'appointed_lord', `Appointed Lord of ${kingdom.name}`);
            
        } else if (position === 'KNIGHT' && !kingdom.court.knights.includes(userId)) {
            kingdom.court.knights.push(userId);
            user.kingdomsServed.push({
                kingdomId: kingdomId,
                position: 'KNIGHT',
                appointedBy: appointedBy,
                appointedAt: Date.now()
            });
            
            this.addReputation(userId, 15, 'appointed_knight', `Appointed Knight of ${kingdom.name}`);
        }
        
        this.emit('position_appointed', kingdom, user, position, appointer);
        console.log(`⚔️ ${user.name} appointed as ${position} of ${kingdom.name} by ${appointer.name}`);
        
        return true;
    }
    
    canAppoint(appointer, position, kingdom) {
        // Ruler can appoint anyone
        if (kingdom.ruler === appointer.id) {
            return true;
        }
        
        // Lords can appoint knights
        if (position === 'KNIGHT' && kingdom.court.lords.includes(appointer.id)) {
            return true;
        }
        
        // System admin can do anything
        if (appointer.isSystem) {
            return true;
        }
        
        return false;
    }
    
    // Quest System
    createQuest(battleId, battleData, questTypes, creatorId) {
        const creator = this.getUser(creatorId);
        if (!creator) {
            throw new Error('Quest creator not found');
        }
        
        const quest = {
            id: this.generateQuestId(),
            battleId: battleId,
            battleData: battleData,
            creator: creatorId,
            kingdomId: battleData.bossId,
            createdAt: Date.now(),
            
            // Quest objectives
            objectives: questTypes.map(type => ({
                id: this.generateObjectiveId(),
                type: type,
                config: this.questTypes[type],
                predictions: new Map(), // userId -> prediction
                result: null,
                resolved: false
            })),
            
            // Participation tracking
            participants: new Set(),
            totalPredictions: 0,
            
            // Status
            status: 'ACTIVE', // ACTIVE, VOTING, RESOLVED, DISPUTED
            votingDeadline: Date.now() + this.validationConfig.voteTimeWindow,
            autoResolveAt: Date.now() + this.validationConfig.autoResolveTime
        };
        
        this.quests.set(quest.id, quest);
        
        // Add to kingdom
        const kingdom = this.kingdoms.get(battleData.bossId);
        if (kingdom) {
            kingdom.activeQuests.push(quest.id);
            kingdom.totalQuests++;
        }
        
        this.emit('quest_created', quest, creator);
        console.log(`📜 Quest created: ${quest.id} by ${creator.name} for battle ${battleId}`);
        
        return quest;
    }
    
    submitPrediction(questId, objectiveId, userId, prediction) {
        const quest = this.quests.get(questId);
        const user = this.users.get(userId);
        
        if (!quest || !user) {
            throw new Error('Quest or user not found');
        }
        
        if (quest.status !== 'ACTIVE') {
            throw new Error('Quest is not accepting predictions');
        }
        
        // Find objective
        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) {
            throw new Error('Objective not found');
        }
        
        // Check if user can predict
        if (!user.permissions.includes('predict')) {
            throw new Error('User does not have prediction permissions');
        }
        
        // Store prediction
        objective.predictions.set(userId, {
            prediction: prediction,
            timestamp: Date.now(),
            userAuthority: user.authority.level
        });
        
        quest.participants.add(userId);
        quest.totalPredictions++;
        
        this.emit('prediction_submitted', quest, objective, user, prediction);
        console.log(`🔮 Prediction submitted: ${user.name} -> ${prediction} for ${objective.type}`);
        
        return true;
    }
    
    // Battle Resolution and Validation
    resolveBattle(battleId, battleResults) {
        // Find all quests for this battle
        const battleQuests = Array.from(this.quests.values())
            .filter(quest => quest.battleId === battleId);
        
        console.log(`⚔️ Resolving ${battleQuests.length} quests for battle ${battleId}`);
        
        battleQuests.forEach(quest => {
            this.resolveQuest(quest.id, battleResults);
        });
        
        return battleQuests;
    }
    
    resolveQuest(questId, battleResults) {
        const quest = this.quests.get(questId);
        if (!quest) {
            throw new Error('Quest not found');
        }
        
        quest.status = 'VOTING';
        const correctAnswers = this.calculateCorrectAnswers(quest.objectives, battleResults);
        
        // Score all predictions
        quest.objectives.forEach(objective => {
            const correctAnswer = correctAnswers[objective.type];
            objective.result = correctAnswer;
            objective.resolved = true;
            
            // Score each prediction
            objective.predictions.forEach((predictionData, userId) => {
                const isCorrect = this.isPredictionCorrect(
                    predictionData.prediction, 
                    correctAnswer, 
                    objective.type
                );
                
                const user = this.users.get(userId);
                if (user) {
                    user.totalVotes++;
                    if (isCorrect) {
                        user.correctVotes++;
                        this.addReputation(userId, objective.config.reputationReward, 
                            'correct_prediction', `Correct ${objective.type} prediction`);
                    } else {
                        this.addReputation(userId, objective.config.reputationPenalty, 
                            'incorrect_prediction', `Incorrect ${objective.type} prediction`);
                    }
                    
                    // Update accuracy
                    user.accuracy = user.correctVotes / user.totalVotes;
                    this.updateUserAuthority(user);
                }
            });
        });
        
        quest.status = 'RESOLVED';
        
        // Move to kingdom completed quests
        const kingdom = this.kingdoms.get(quest.kingdomId);
        if (kingdom) {
            kingdom.activeQuests = kingdom.activeQuests.filter(id => id !== questId);
            kingdom.completedQuests.push(questId);
        }
        
        this.emit('quest_resolved', quest, correctAnswers);
        console.log(`📜 Quest resolved: ${questId}`);
        
        return quest;
    }
    
    calculateCorrectAnswers(objectives, battleResults) {
        const answers = {};
        
        objectives.forEach(objective => {
            switch (objective.type) {
                case 'BATTLE_OUTCOME':
                    answers[objective.type] = battleResults.winner || 'draw';
                    break;
                case 'BATTLE_DURATION':
                    answers[objective.type] = battleResults.duration || 0;
                    break;
                case 'DAMAGE_DEALER':
                    answers[objective.type] = battleResults.topDamageDealer || 'unknown';
                    break;
                case 'FIRST_DEATH':
                    answers[objective.type] = battleResults.firstDeath || 'unknown';
                    break;
                case 'KINGDOM_JUDGMENT':
                    // This requires community voting - handled separately
                    answers[objective.type] = 'pending_vote';
                    break;
            }
        });
        
        return answers;
    }
    
    isPredictionCorrect(prediction, correctAnswer, objectiveType) {
        switch (objectiveType) {
            case 'BATTLE_DURATION':
                const tolerance = this.questTypes[objectiveType].tolerance;
                return Math.abs(prediction - correctAnswer) <= tolerance;
            default:
                return prediction === correctAnswer;
        }
    }
    
    // Reputation System
    addReputation(userId, amount, reason, details = '') {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const oldReputation = user.reputation;
        user.reputation += amount;
        
        // Record in history
        const history = this.reputationHistory.get(userId) || [];
        history.push({
            timestamp: Date.now(),
            change: amount,
            reason: reason,
            details: details,
            reputation: user.reputation
        });
        this.reputationHistory.set(userId, history);
        
        // Check for authority level change
        const oldAuthority = user.authority.level;
        this.updateUserAuthority(user);
        
        if (user.authority.level !== oldAuthority) {
            this.emit('authority_changed', user, oldAuthority, user.authority.level);
            console.log(`👑 ${user.name} promoted from ${oldAuthority} to ${user.authority.level}!`);
            
            // Grant promotion bonus
            if (this.getAuthorityRank(user.authority.level) > this.getAuthorityRank(oldAuthority)) {
                this.addReputation(userId, 25, 'promotion_bonus', `Promoted to ${user.authority.title}`);
            }
        }
        
        this.emit('reputation_changed', user, amount, reason, details);
        console.log(`📊 ${user.name}: ${oldReputation} -> ${user.reputation} (${amount >= 0 ? '+' : ''}${amount}) [${reason}]`);
        
        return user;
    }
    
    getAuthorityRank(level) {
        const ranks = {
            'EXILE': 0,
            'PEASANT': 1,
            'CITIZEN': 2,
            'MERCHANT': 3,
            'KNIGHT': 4,
            'LORD': 5,
            'KING': 6
        };
        return ranks[level] || 0;
    }
    
    // Democratic Validation System
    createCommunityVote(questId, objectiveId, question, options) {
        const vote = {
            id: this.generateVoteId(),
            questId: questId,
            objectiveId: objectiveId,
            question: question,
            options: options,
            createdAt: Date.now(),
            deadline: Date.now() + this.validationConfig.voteTimeWindow,
            
            // Voting data
            votes: new Map(), // userId -> option
            totalVotes: 0,
            weightedVotes: new Map(), // option -> weighted total
            
            // Status
            status: 'ACTIVE', // ACTIVE, RESOLVED
            result: null,
            consensus: false
        };
        
        this.votes.set(vote.id, vote);
        
        this.emit('community_vote_created', vote);
        console.log(`🗳️ Community vote created: ${question}`);
        
        return vote;
    }
    
    submitVote(voteId, userId, option) {
        const vote = this.votes.get(voteId);
        const user = this.users.get(userId);
        
        if (!vote || !user) {
            throw new Error('Vote or user not found');
        }
        
        if (vote.status !== 'ACTIVE' || Date.now() > vote.deadline) {
            throw new Error('Voting is closed');
        }
        
        if (!user.permissions.includes('validate')) {
            throw new Error('User does not have voting permissions');
        }
        
        // Record vote
        vote.votes.set(userId, {
            option: option,
            timestamp: Date.now(),
            weight: user.voteWeight
        });
        
        vote.totalVotes++;
        
        // Update weighted totals
        if (!vote.weightedVotes.has(option)) {
            vote.weightedVotes.set(option, 0);
        }
        vote.weightedVotes.set(option, vote.weightedVotes.get(option) + user.voteWeight);
        
        this.emit('vote_submitted', vote, user, option);
        console.log(`🗳️ Vote submitted: ${user.name} -> ${option}`);
        
        // Check if we can resolve early
        if (vote.totalVotes >= this.validationConfig.minimumVoters) {
            this.checkVoteConsensus(voteId);
        }
        
        return true;
    }
    
    checkVoteConsensus(voteId) {
        const vote = this.votes.get(voteId);
        if (!vote) return false;
        
        const totalWeight = Array.from(vote.weightedVotes.values())
            .reduce((sum, weight) => sum + weight, 0);
        
        // Find the leading option
        let leadingOption = null;
        let leadingWeight = 0;
        
        vote.weightedVotes.forEach((weight, option) => {
            if (weight > leadingWeight) {
                leadingWeight = weight;
                leadingOption = option;
            }
        });
        
        // Check consensus threshold
        const consensusRatio = leadingWeight / totalWeight;
        if (consensusRatio >= this.validationConfig.consensusThreshold) {
            this.resolveVote(voteId, leadingOption, true);
            return true;
        }
        
        return false;
    }
    
    resolveVote(voteId, result, consensus) {
        const vote = this.votes.get(voteId);
        if (!vote) return;
        
        vote.status = 'RESOLVED';
        vote.result = result;
        vote.consensus = consensus;
        
        this.emit('vote_resolved', vote);
        console.log(`🗳️ Vote resolved: ${result} (consensus: ${consensus})`);
        
        return vote;
    }
    
    // Utility functions
    generateQuestId() {
        return 'quest_' + crypto.randomBytes(6).toString('hex');
    }
    
    generateObjectiveId() {
        return 'obj_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateVoteId() {
        return 'vote_' + crypto.randomBytes(6).toString('hex');
    }
    
    // API Methods
    getUserKingdoms(userId) {
        const user = this.users.get(userId);
        if (!user) return { ruled: [], served: [] };
        
        const ruled = user.kingdomsRuled.map(id => this.kingdoms.get(id)).filter(Boolean);
        const served = user.kingdomsServed.map(service => ({
            ...service,
            kingdom: this.kingdoms.get(service.kingdomId)
        }));
        
        return { ruled, served };
    }
    
    getKingdomLeaderboard() {
        return Array.from(this.kingdoms.values())
            .sort((a, b) => (b.totalRevenue + b.popularity) - (a.totalRevenue + a.popularity))
            .slice(0, 10)
            .map(kingdom => ({
                id: kingdom.id,
                name: kingdom.name,
                ruler: this.users.get(kingdom.ruler)?.name,
                totalBattles: kingdom.totalBattles,
                totalRevenue: kingdom.totalRevenue,
                popularity: kingdom.popularity
            }));
    }
    
    getAuthorityLeaderboard() {
        return Array.from(this.users.values())
            .filter(user => !user.isSystem)
            .sort((a, b) => b.reputation - a.reputation)
            .slice(0, 20)
            .map(user => ({
                id: user.id,
                name: user.name,
                authority: user.authority.title,
                reputation: user.reputation,
                accuracy: (user.accuracy * 100).toFixed(1),
                kingdomsRuled: user.kingdomsRuled.length
            }));
    }
    
    getSystemStats() {
        const users = Array.from(this.users.values()).filter(u => !u.isSystem);
        const kingdoms = Array.from(this.kingdoms.values());
        const quests = Array.from(this.quests.values());
        
        return {
            totalUsers: users.length,
            totalKingdoms: kingdoms.length,
            totalQuests: quests.length,
            activeQuests: quests.filter(q => q.status === 'ACTIVE').length,
            authorityDistribution: this.getAuthorityDistribution(users),
            averageReputation: users.reduce((sum, u) => sum + u.reputation, 0) / users.length,
            totalRevenue: kingdoms.reduce((sum, k) => sum + k.totalRevenue, 0)
        };
    }
    
    getAuthorityDistribution(users) {
        const distribution = {};
        Object.keys(this.authorityLevels).forEach(level => {
            distribution[level] = 0;
        });
        
        users.forEach(user => {
            distribution[user.authority.level]++;
        });
        
        return distribution;
    }
}

// Auto-start if run directly
if (require.main === module) {
    console.log('👑⚔️🏰 Kingdom Authority System Demo');
    console.log('===================================\n');
    
    const kingdomSystem = new KingdomAuthoritySystem();
    
    // Create demo users
    console.log('👤 Creating demo users...\n');
    
    const alice = kingdomSystem.createUser('alice', {
        name: 'Alice the Bold',
        reputation: 50
    });
    
    const bob = kingdomSystem.createUser('bob', {
        name: 'Bob the Wise',
        reputation: 350
    });
    
    const charlie = kingdomSystem.createUser('charlie', {
        name: 'Charlie the Great',
        reputation: 800
    });
    
    // Create demo kingdom
    console.log('🏰 Creating demo kingdom...\n');
    
    const dragonKingdom = kingdomSystem.createKingdom('dragon_boss_123', {
        name: 'Ancient Dragon',
        level: 100,
        health: 5000
    }, 'alice');
    
    // Appoint positions
    console.log('⚔️ Making appointments...\n');
    
    kingdomSystem.appointToPosition('dragon_boss_123', 'charlie', 'LORD', 'alice');
    kingdomSystem.appointToPosition('dragon_boss_123', 'bob', 'KNIGHT', 'charlie');
    
    // Create demo quest
    console.log('📜 Creating demo quest...\n');
    
    const quest = kingdomSystem.createQuest('battle_456', {
        bossId: 'dragon_boss_123',
        duration: 120,
        participants: ['dragon', 'ai_fighter_1', 'ai_fighter_2']
    }, ['BATTLE_OUTCOME', 'BATTLE_DURATION'], 'alice');
    
    // Submit predictions
    console.log('🔮 Submitting predictions...\n');
    
    const objective1 = quest.objectives[0];
    const objective2 = quest.objectives[1];
    
    kingdomSystem.submitPrediction(quest.id, objective1.id, 'alice', 'boss');
    kingdomSystem.submitPrediction(quest.id, objective1.id, 'bob', 'players');
    kingdomSystem.submitPrediction(quest.id, objective1.id, 'charlie', 'boss');
    
    kingdomSystem.submitPrediction(quest.id, objective2.id, 'alice', 115);
    kingdomSystem.submitPrediction(quest.id, objective2.id, 'bob', 130);
    kingdomSystem.submitPrediction(quest.id, objective2.id, 'charlie', 110);
    
    // Resolve battle
    console.log('⚔️ Resolving battle...\n');
    
    kingdomSystem.resolveBattle('battle_456', {
        winner: 'boss',
        duration: 118,
        topDamageDealer: 'dragon',
        firstDeath: 'ai_fighter_1'
    });
    
    // Show final stats
    console.log('📊 Final System Stats:');
    console.log(kingdomSystem.getSystemStats());
    
    console.log('\n🏆 Authority Leaderboard:');
    console.table(kingdomSystem.getAuthorityLeaderboard());
    
    console.log('\n🏰 Kingdom Leaderboard:');
    console.table(kingdomSystem.getKingdomLeaderboard());
}

module.exports = KingdomAuthoritySystem;