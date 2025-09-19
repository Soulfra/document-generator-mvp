#!/usr/bin/env node

/**
 * ⚔️👹📝 BOSS SUBMISSION API
 * RESTful API for users to submit, validate, and manage custom bosses
 * RuneScape-inspired combat system with tile-based mechanics
 */

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const KingdomAuthoritySystem = require('./kingdom-authority-system.js');

class BossSubmissionAPI extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 4200;
        
        // Boss database (in production, use PostgreSQL/MongoDB)
        this.bossDatabase = new Map();
        this.userDatabase = new Map();
        this.battleStats = new Map();
        
        // Kingdom Authority System
        this.kingdomSystem = new KingdomAuthoritySystem();
        
        // Boss validation rules
        this.validation = {
            name: {
                minLength: 3,
                maxLength: 50,
                pattern: /^[a-zA-Z0-9\s\-_.'!]+$/
            },
            level: { min: 1, max: 999 },
            health: { min: 10, max: 100000 },
            damage: { min: 1, max: 5000 },
            defense: { min: 0, max: 1000 },
            abilities: { maxCount: 10, maxNameLength: 30 },
            size: { min: 1, max: 5 }, // tile size (1x1 to 5x5)
            description: { maxLength: 500 }
        };
        
        // Boss template library
        this.templates = new Map([
            ['basic', {
                name: 'Basic Enemy',
                level: 5,
                health: 100,
                maxHealth: 100,
                damage: 15,
                defense: 5,
                size: 1,
                abilities: ['basic_attack'],
                aggroRange: 10,
                moveSpeed: 1,
                attackSpeed: 4000, // milliseconds between attacks
                lootTable: ['bronze_sword', 'healing_potion'],
                difficulty: 'EASY'
            }],
            ['warrior', {
                name: 'Fierce Warrior',
                level: 25,
                health: 500,
                maxHealth: 500,
                damage: 45,
                defense: 20,
                size: 2,
                abilities: ['slash_attack', 'shield_bash', 'war_cry'],
                aggroRange: 12,
                moveSpeed: 1,
                attackSpeed: 3000,
                lootTable: ['steel_sword', 'warrior_helm', 'gold_coins'],
                difficulty: 'MEDIUM'
            }],
            ['dragon', {
                name: 'Ancient Dragon',
                level: 100,
                health: 5000,
                maxHealth: 5000,
                damage: 200,
                defense: 100,
                size: 4,
                abilities: ['dragon_breath', 'tail_sweep', 'wing_buffet', 'roar'],
                aggroRange: 15,
                moveSpeed: 2,
                attackSpeed: 6000,
                lootTable: ['dragon_scale', 'legendary_treasure', 'ancient_artifact'],
                difficulty: 'LEGENDARY'
            }]
        ]);
        
        // Revenue tracking
        this.revenueSystem = {
            creatorShare: 0.70, // 70% to boss creator
            platformShare: 0.25, // 25% to platform
            hostShare: 0.05     // 5% to server host
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupFileUpload();
        
        console.log('⚔️👹📝 Boss Submission API initialized');
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // CORS for web dashboard
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📝 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
        
        // Rate limiting (simple implementation)
        this.rateLimiter = new Map();
        this.app.use((req, res, next) => {
            const clientIP = req.ip;
            const now = Date.now();
            const windowStart = now - 60000; // 1 minute window
            
            if (!this.rateLimiter.has(clientIP)) {
                this.rateLimiter.set(clientIP, []);
            }
            
            const requests = this.rateLimiter.get(clientIP);
            // Remove old requests
            const recentRequests = requests.filter(time => time > windowStart);
            
            if (recentRequests.length >= 100) { // 100 requests per minute
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded. Please slow down.'
                });
            }
            
            recentRequests.push(now);
            this.rateLimiter.set(clientIP, recentRequests);
            next();
        });
    }
    
    setupFileUpload() {
        // Configure multer for boss asset uploads
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = './uploads/boss-assets';
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });
        
        this.upload = multer({
            storage: storage,
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
                files: 10 // max 10 files per boss
            },
            fileFilter: (req, file, cb) => {
                // Allow images and audio files
                if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only image and audio files are allowed'));
                }
            }
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                service: 'Boss Submission API',
                uptime: process.uptime(),
                bosses: this.bossDatabase.size,
                battles: this.battleStats.size
            });
        });
        
        // Get boss templates
        this.app.get('/api/templates', (req, res) => {
            const templates = Array.from(this.templates.entries()).map(([id, template]) => ({
                id,
                ...template
            }));
            
            res.json({
                success: true,
                templates: templates
            });
        });
        
        // Submit new boss
        this.app.post('/api/bosses/submit', this.upload.array('assets', 10), async (req, res) => {
            try {
                const bossData = req.body;
                const uploadedFiles = req.files || [];
                
                // Validate boss data
                const validation = this.validateBossData(bossData);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: 'Boss validation failed',
                        details: validation.errors
                    });
                }
                
                // Create unique boss ID
                const bossId = this.generateBossId();
                
                // Process uploaded assets
                const assets = await this.processUploadedAssets(uploadedFiles, bossId);
                
                // Create boss record
                const boss = {
                    id: bossId,
                    ...bossData,
                    assets: assets,
                    creator: bossData.creator || 'anonymous',
                    createdAt: new Date().toISOString(),
                    status: 'pending_approval',
                    battles: 0,
                    wins: 0,
                    losses: 0,
                    revenue: 0,
                    rating: 0,
                    downloads: 0
                };
                
                // Store boss
                this.bossDatabase.set(bossId, boss);
                
                // Auto-approve for now (in production, implement approval workflow)
                boss.status = 'approved';
                boss.approvedAt = new Date().toISOString();
                
                // Create or get user in kingdom system
                let creator = this.kingdomSystem.getUser(boss.creator);
                if (!creator) {
                    creator = this.kingdomSystem.createUser(boss.creator, {
                        name: boss.creator,
                        reputation: 0
                    });
                }
                
                // Create kingdom for this boss
                const kingdom = this.kingdomSystem.createKingdom(bossId, boss, boss.creator);
                boss.kingdomId = kingdom.id;
                
                console.log(`⚔️ New boss submitted: ${boss.name} (${bossId}) by ${boss.creator}`);
                
                // Emit event for real-time updates
                this.emit('boss_submitted', boss);
                
                res.json({
                    success: true,
                    message: 'Boss submitted successfully',
                    boss: {
                        id: bossId,
                        name: boss.name,
                        status: boss.status,
                        createdAt: boss.createdAt
                    }
                });
                
            } catch (error) {
                console.error('Boss submission error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to submit boss',
                    details: error.message
                });
            }
        });
        
        // Get all approved bosses
        this.app.get('/api/bosses', (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sortBy = req.query.sortBy || 'createdAt';
            const difficulty = req.query.difficulty;
            const creator = req.query.creator;
            
            let bosses = Array.from(this.bossDatabase.values())
                .filter(boss => boss.status === 'approved');
            
            // Filter by difficulty
            if (difficulty) {
                bosses = bosses.filter(boss => boss.difficulty === difficulty.toUpperCase());
            }
            
            // Filter by creator
            if (creator) {
                bosses = bosses.filter(boss => boss.creator === creator);
            }
            
            // Sort
            bosses.sort((a, b) => {
                switch (sortBy) {
                    case 'battles':
                        return b.battles - a.battles;
                    case 'rating':
                        return b.rating - a.rating;
                    case 'revenue':
                        return b.revenue - a.revenue;
                    default:
                        return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });
            
            // Paginate
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedBosses = bosses.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                bosses: paginatedBosses,
                pagination: {
                    page: page,
                    limit: limit,
                    total: bosses.length,
                    pages: Math.ceil(bosses.length / limit)
                }
            });
        });
        
        // Get specific boss
        this.app.get('/api/bosses/:id', (req, res) => {
            const bossId = req.params.id;
            const boss = this.bossDatabase.get(bossId);
            
            if (!boss) {
                return res.status(404).json({
                    success: false,
                    error: 'Boss not found'
                });
            }
            
            res.json({
                success: true,
                boss: boss
            });
        });
        
        // Update boss (creator only)
        this.app.put('/api/bosses/:id', async (req, res) => {
            const bossId = req.params.id;
            const updates = req.body;
            const boss = this.bossDatabase.get(bossId);
            
            if (!boss) {
                return res.status(404).json({
                    success: false,
                    error: 'Boss not found'
                });
            }
            
            // Validate ownership (in production, use proper auth)
            if (updates.creator && updates.creator !== boss.creator) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to modify this boss'
                });
            }
            
            // Validate updates
            const validation = this.validateBossData({ ...boss, ...updates });
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Boss validation failed',
                    details: validation.errors
                });
            }
            
            // Apply updates
            const updatedBoss = { ...boss, ...updates, updatedAt: new Date().toISOString() };
            this.bossDatabase.set(bossId, updatedBoss);
            
            console.log(`⚔️ Boss updated: ${updatedBoss.name} (${bossId})`);
            
            this.emit('boss_updated', updatedBoss);
            
            res.json({
                success: true,
                message: 'Boss updated successfully',
                boss: updatedBoss
            });
        });
        
        // Delete boss (creator only)
        this.app.delete('/api/bosses/:id', (req, res) => {
            const bossId = req.params.id;
            const boss = this.bossDatabase.get(bossId);
            
            if (!boss) {
                return res.status(404).json({
                    success: false,
                    error: 'Boss not found'
                });
            }
            
            // Soft delete (mark as deleted instead of removing)
            boss.status = 'deleted';
            boss.deletedAt = new Date().toISOString();
            
            console.log(`⚔️ Boss deleted: ${boss.name} (${bossId})`);
            
            this.emit('boss_deleted', boss);
            
            res.json({
                success: true,
                message: 'Boss deleted successfully'
            });
        });
        
        // Record battle results
        this.app.post('/api/battles/result', (req, res) => {
            const { bossId, winnerId, battleData } = req.body;
            
            const boss = this.bossDatabase.get(bossId);
            if (!boss) {
                return res.status(404).json({
                    success: false,
                    error: 'Boss not found'
                });
            }
            
            // Update battle statistics
            boss.battles++;
            if (winnerId === bossId) {
                boss.wins++;
            } else {
                boss.losses++;
            }
            
            // Calculate new rating (simple ELO-like system)
            const winRate = boss.wins / boss.battles;
            boss.rating = Math.round(winRate * 100);
            
            // Record battle in stats
            const battleId = this.generateBattleId();
            this.battleStats.set(battleId, {
                id: battleId,
                bossId: bossId,
                winnerId: winnerId,
                battleData: battleData,
                timestamp: new Date().toISOString()
            });
            
            // Calculate revenue (mock calculation)
            const battleRevenue = this.calculateBattleRevenue(battleData);
            boss.revenue += battleRevenue * this.revenueSystem.creatorShare;
            
            // Update kingdom stats
            const kingdom = this.kingdomSystem.getKingdom(bossId);
            if (kingdom) {
                kingdom.totalBattles++;
                kingdom.totalRevenue += battleRevenue * this.revenueSystem.creatorShare;
                
                // Resolve any active quests for this battle
                const resolvedQuests = this.kingdomSystem.resolveBattle(battleId, {
                    winner: winnerId,
                    duration: battleData.duration || 60,
                    topDamageDealer: battleData.topDamageDealer || 'unknown',
                    firstDeath: battleData.firstDeath || 'unknown',
                    totalDamage: battleData.totalDamage || 0
                });
                
                console.log(`📜 Resolved ${resolvedQuests.length} quests for battle ${battleId}`);
            }
            
            console.log(`⚔️ Battle result recorded: ${boss.name} - Win Rate: ${(winRate * 100).toFixed(1)}%`);
            
            this.emit('battle_completed', {
                bossId: bossId,
                battleId: battleId,
                winnerId: winnerId,
                revenue: battleRevenue
            });
            
            res.json({
                success: true,
                message: 'Battle result recorded',
                boss: {
                    id: bossId,
                    battles: boss.battles,
                    wins: boss.wins,
                    losses: boss.losses,
                    rating: boss.rating,
                    revenue: boss.revenue
                }
            });
        });
        
        // Get battle statistics
        this.app.get('/api/battles/stats/:bossId', (req, res) => {
            const bossId = req.params.bossId;
            const boss = this.bossDatabase.get(bossId);
            
            if (!boss) {
                return res.status(404).json({
                    success: false,
                    error: 'Boss not found'
                });
            }
            
            // Get recent battles
            const recentBattles = Array.from(this.battleStats.values())
                .filter(battle => battle.bossId === bossId)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);
            
            res.json({
                success: true,
                stats: {
                    bossId: bossId,
                    name: boss.name,
                    battles: boss.battles,
                    wins: boss.wins,
                    losses: boss.losses,
                    winRate: boss.battles > 0 ? (boss.wins / boss.battles * 100).toFixed(1) : 0,
                    rating: boss.rating,
                    revenue: boss.revenue,
                    recentBattles: recentBattles
                }
            });
        });
        
        // Get leaderboards
        this.app.get('/api/leaderboards', (req, res) => {
            const type = req.query.type || 'rating';
            const limit = parseInt(req.query.limit) || 10;
            
            let bosses = Array.from(this.bossDatabase.values())
                .filter(boss => boss.status === 'approved' && boss.battles > 0);
            
            // Sort by requested type
            switch (type) {
                case 'battles':
                    bosses.sort((a, b) => b.battles - a.battles);
                    break;
                case 'revenue':
                    bosses.sort((a, b) => b.revenue - a.revenue);
                    break;
                case 'winrate':
                    bosses.sort((a, b) => (b.wins / b.battles) - (a.wins / a.battles));
                    break;
                default: // rating
                    bosses.sort((a, b) => b.rating - a.rating);
            }
            
            const leaderboard = bosses.slice(0, limit).map((boss, index) => ({
                rank: index + 1,
                id: boss.id,
                name: boss.name,
                creator: boss.creator,
                level: boss.level,
                battles: boss.battles,
                wins: boss.wins,
                losses: boss.losses,
                winRate: boss.battles > 0 ? (boss.wins / boss.battles * 100).toFixed(1) : 0,
                rating: boss.rating,
                revenue: boss.revenue.toFixed(2)
            }));
            
            res.json({
                success: true,
                leaderboard: leaderboard,
                type: type
            });
        });
        
        // Kingdom Authority System API endpoints
        
        // Get user profile with authority info
        this.app.get('/api/users/:userId', (req, res) => {
            const userId = req.params.userId;
            const user = this.kingdomSystem.getUser(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const kingdoms = this.kingdomSystem.getUserKingdoms(userId);
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    authority: user.authority,
                    reputation: user.reputation,
                    accuracy: (user.accuracy * 100).toFixed(1),
                    totalVotes: user.totalVotes,
                    correctVotes: user.correctVotes,
                    kingdomsRuled: kingdoms.ruled.length,
                    kingdomsServed: kingdoms.served.length,
                    achievements: user.achievements
                }
            });
        });
        
        // Create or get user (for login/registration)
        this.app.post('/api/users/login', (req, res) => {
            const { userId, name } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID required'
                });
            }
            
            let user = this.kingdomSystem.getUser(userId);
            if (!user) {
                user = this.kingdomSystem.createUser(userId, {
                    name: name || userId,
                    reputation: 0
                });
            }
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    authority: user.authority,
                    reputation: user.reputation,
                    isNewUser: !this.kingdomSystem.getUser(userId)
                }
            });
        });
        
        // Get kingdom details
        this.app.get('/api/kingdoms/:kingdomId', (req, res) => {
            const kingdomId = req.params.kingdomId;
            const kingdom = this.kingdomSystem.getKingdom(kingdomId);
            
            if (!kingdom) {
                return res.status(404).json({
                    success: false,
                    error: 'Kingdom not found'
                });
            }
            
            // Get court member details
            const court = {
                ruler: this.kingdomSystem.getUser(kingdom.court.ruler),
                lords: kingdom.court.lords.map(id => this.kingdomSystem.getUser(id)).filter(Boolean),
                knights: kingdom.court.knights.map(id => this.kingdomSystem.getUser(id)).filter(Boolean)
            };
            
            res.json({
                success: true,
                kingdom: {
                    id: kingdom.id,
                    name: kingdom.name,
                    boss: kingdom.boss,
                    founded: kingdom.founded,
                    court: court,
                    stats: {
                        totalBattles: kingdom.totalBattles,
                        totalRevenue: kingdom.totalRevenue,
                        totalQuests: kingdom.totalQuests,
                        popularity: kingdom.popularity
                    },
                    activeQuests: kingdom.activeQuests.length,
                    completedQuests: kingdom.completedQuests.length
                }
            });
        });
        
        // Create quest for upcoming battle
        this.app.post('/api/quests/create', (req, res) => {
            const { battleId, bossId, creatorId, questTypes } = req.body;
            
            try {
                const creator = this.kingdomSystem.getUser(creatorId);
                if (!creator) {
                    return res.status(404).json({
                        success: false,
                        error: 'Creator not found'
                    });
                }
                
                if (!creator.permissions.includes('create_quests') && 
                    !creator.permissions.includes('moderate_battles')) {
                    return res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions to create quests'
                    });
                }
                
                const battleData = { bossId, participants: [] };
                const quest = this.kingdomSystem.createQuest(
                    battleId, 
                    battleData, 
                    questTypes || ['BATTLE_OUTCOME', 'BATTLE_DURATION'], 
                    creatorId
                );
                
                res.json({
                    success: true,
                    quest: {
                        id: quest.id,
                        battleId: quest.battleId,
                        objectives: quest.objectives,
                        status: quest.status,
                        createdAt: quest.createdAt
                    }
                });
                
            } catch (error) {
                console.error('Quest creation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Submit prediction for quest
        this.app.post('/api/quests/:questId/predict', (req, res) => {
            const { questId } = req.params;
            const { objectiveId, userId, prediction } = req.body;
            
            try {
                const success = this.kingdomSystem.submitPrediction(questId, objectiveId, userId, prediction);
                
                res.json({
                    success: success,
                    message: 'Prediction submitted successfully'
                });
                
            } catch (error) {
                console.error('Prediction submission error:', error);
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get quest details
        this.app.get('/api/quests/:questId', (req, res) => {
            const questId = req.params.questId;
            const quest = this.kingdomSystem.quests.get(questId);
            
            if (!quest) {
                return res.status(404).json({
                    success: false,
                    error: 'Quest not found'
                });
            }
            
            res.json({
                success: true,
                quest: {
                    id: quest.id,
                    battleId: quest.battleId,
                    creator: this.kingdomSystem.getUser(quest.creator)?.name,
                    status: quest.status,
                    objectives: quest.objectives.map(obj => ({
                        id: obj.id,
                        type: obj.type,
                        config: obj.config,
                        totalPredictions: obj.predictions.size,
                        resolved: obj.resolved,
                        result: obj.result
                    })),
                    totalParticipants: quest.participants.size,
                    votingDeadline: quest.votingDeadline
                }
            });
        });
        
        // Get authority leaderboard
        this.app.get('/api/leaderboards/authority', (req, res) => {
            const leaderboard = this.kingdomSystem.getAuthorityLeaderboard();
            
            res.json({
                success: true,
                leaderboard: leaderboard
            });
        });
        
        // Get kingdom leaderboard
        this.app.get('/api/leaderboards/kingdoms', (req, res) => {
            const leaderboard = this.kingdomSystem.getKingdomLeaderboard();
            
            res.json({
                success: true,
                leaderboard: leaderboard
            });
        });
        
        // Get system stats including authority distribution
        this.app.get('/api/system/stats', (req, res) => {
            const stats = this.kingdomSystem.getSystemStats();
            
            res.json({
                success: true,
                stats: stats
            });
        });
        
        // Serve uploaded assets
        this.app.use('/assets', express.static('./uploads/boss-assets'));
    }
    
    validateBossData(data) {
        const errors = [];
        
        // Name validation
        if (!data.name || data.name.length < this.validation.name.minLength) {
            errors.push(`Name must be at least ${this.validation.name.minLength} characters`);
        }
        if (data.name && data.name.length > this.validation.name.maxLength) {
            errors.push(`Name must be no more than ${this.validation.name.maxLength} characters`);
        }
        if (data.name && !this.validation.name.pattern.test(data.name)) {
            errors.push('Name contains invalid characters');
        }
        
        // Level validation
        const level = parseInt(data.level);
        if (isNaN(level) || level < this.validation.level.min || level > this.validation.level.max) {
            errors.push(`Level must be between ${this.validation.level.min} and ${this.validation.level.max}`);
        }
        
        // Health validation
        const health = parseInt(data.health);
        if (isNaN(health) || health < this.validation.health.min || health > this.validation.health.max) {
            errors.push(`Health must be between ${this.validation.health.min} and ${this.validation.health.max}`);
        }
        
        // Damage validation
        const damage = parseInt(data.damage);
        if (isNaN(damage) || damage < this.validation.damage.min || damage > this.validation.damage.max) {
            errors.push(`Damage must be between ${this.validation.damage.min} and ${this.validation.damage.max}`);
        }
        
        // Defense validation
        const defense = parseInt(data.defense);
        if (isNaN(defense) || defense < this.validation.defense.min || defense > this.validation.defense.max) {
            errors.push(`Defense must be between ${this.validation.defense.min} and ${this.validation.defense.max}`);
        }
        
        // Size validation (for tile-based positioning)
        const size = parseInt(data.size);
        if (isNaN(size) || size < this.validation.size.min || size > this.validation.size.max) {
            errors.push(`Size must be between ${this.validation.size.min} and ${this.validation.size.max} tiles`);
        }
        
        // Abilities validation
        if (data.abilities) {
            if (Array.isArray(data.abilities)) {
                if (data.abilities.length > this.validation.abilities.maxCount) {
                    errors.push(`Maximum ${this.validation.abilities.maxCount} abilities allowed`);
                }
                data.abilities.forEach((ability, index) => {
                    if (typeof ability === 'string' && ability.length > this.validation.abilities.maxNameLength) {
                        errors.push(`Ability ${index + 1} name too long`);
                    }
                });
            } else {
                errors.push('Abilities must be an array');
            }
        }
        
        // Description validation
        if (data.description && data.description.length > this.validation.description.maxLength) {
            errors.push(`Description must be no more than ${this.validation.description.maxLength} characters`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    async processUploadedAssets(files, bossId) {
        const assets = {
            images: [],
            sounds: []
        };
        
        for (const file of files) {
            const assetInfo = {
                filename: file.filename,
                originalName: file.originalname,
                path: `/assets/${file.filename}`,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            
            if (file.mimetype.startsWith('image/')) {
                assets.images.push(assetInfo);
            } else if (file.mimetype.startsWith('audio/')) {
                assets.sounds.push(assetInfo);
            }
        }
        
        return assets;
    }
    
    calculateBattleRevenue(battleData) {
        // Mock revenue calculation based on battle duration, viewers, etc.
        const basePayout = 0.10; // $0.10 base
        const durationBonus = Math.min((battleData.duration || 60) / 60 * 0.05, 0.50); // up to $0.50 for long battles
        const viewerBonus = Math.min((battleData.viewers || 1) * 0.01, 1.00); // up to $1.00 for popular battles
        
        return basePayout + durationBonus + viewerBonus;
    }
    
    generateBossId() {
        return 'boss_' + crypto.randomBytes(8).toString('hex');
    }
    
    generateBattleId() {
        return 'battle_' + crypto.randomBytes(8).toString('hex');
    }
    
    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`⚔️ Boss Submission API running on port ${this.port}`);
                console.log(`📝 Submit bosses at: http://localhost:${this.port}/api/bosses/submit`);
                console.log(`👀 View bosses at: http://localhost:${this.port}/api/bosses`);
                console.log(`📊 Leaderboards at: http://localhost:${this.port}/api/leaderboards`);
                resolve(this);
            });
        });
    }
    
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('⚔️ Boss Submission API stopped');
                    resolve();
                });
            });
        }
    }
    
    // Public API for integration with other systems
    getAllBosses() {
        return Array.from(this.bossDatabase.values());
    }
    
    getBoss(bossId) {
        return this.bossDatabase.get(bossId);
    }
    
    getApprovedBosses() {
        return Array.from(this.bossDatabase.values())
            .filter(boss => boss.status === 'approved');
    }
    
    getBossByCreator(creator) {
        return Array.from(this.bossDatabase.values())
            .filter(boss => boss.creator === creator);
    }
}

// Auto-start if run directly
if (require.main === module) {
    const api = new BossSubmissionAPI();
    api.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n⚔️ Shutting down Boss Submission API...');
        await api.stop();
        process.exit(0);
    });
    
    // Add some sample bosses for testing
    setTimeout(() => {
        console.log('\n⚔️ Adding sample bosses...');
        
        api.templates.forEach((template, id) => {
            const sampleBoss = {
                ...template,
                creator: 'system',
                description: `A ${template.difficulty.toLowerCase()} boss perfect for testing combat mechanics.`
            };
            
            const bossId = api.generateBossId();
            api.bossDatabase.set(bossId, {
                id: bossId,
                ...sampleBoss,
                createdAt: new Date().toISOString(),
                status: 'approved',
                battles: Math.floor(Math.random() * 100),
                wins: Math.floor(Math.random() * 50),
                losses: Math.floor(Math.random() * 50),
                revenue: Math.random() * 1000,
                rating: Math.floor(Math.random() * 100),
                downloads: Math.floor(Math.random() * 1000),
                assets: { images: [], sounds: [] }
            });
            
            console.log(`  ✅ Added sample boss: ${template.name} (${bossId})`);
        });
    }, 1000);
}

module.exports = BossSubmissionAPI;