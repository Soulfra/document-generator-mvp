#!/usr/bin/env node

/**
 * 🎰 WELCOME GACHA INTEGRATION SERVICE
 * Connects the ultimate welcome experience to real gacha rewards
 * Manages tokens, achievements, and progression for new users
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs').promises;

class WelcomeGachaIntegration {
    constructor(port = 42013) {
        this.port = port;
        this.app = express();
        this.app.use(express.json());
        
        // Welcome reward configurations
        this.welcomeRewards = {
            giftBox: {
                tokens: 1000,
                agents: ['Starter_Pro', 'Welcome_Helper'],
                badges: ['Founders_Badge'],
                description: 'Founders Welcome Package'
            },
            gachaBox: {
                tokens: 5000,
                agents: ['QuantumStrategist', 'CodeMaster_Elite'],
                badges: ['Lucky_Puller'],
                description: 'Legendary Agent Pull'
            },
            oceanBox: {
                tokens: 2000,
                territories: ['Pacific_Northwest'],
                artifacts: ['Explorer_Compass', 'Ocean_Chart'],
                badges: ['Ocean_Explorer'],
                description: 'Territory Discovery Package'
            },
            tournamentBox: {
                tokens: 3000,
                cash: 3000,
                agents: ['Tournament_Champion'],
                badges: ['Victory_Crown'],
                description: 'Championship Victory Rewards'
            },
            secretBox: {
                tokens: 10000,
                agents: ['VIP_Agent', 'Secret_Operative'],
                badges: ['VIP_Status', 'Secret_Keeper'],
                specialAccess: ['admin_panel', 'secret_features'],
                description: 'VIP Secret Package'
            },
            appleBox: {
                tokens: 1500,
                passes: ['NIL_Contract', 'VIP_Access'],
                badges: ['Tech_Integrated'],
                description: 'Apple Ecosystem Integration'
            }
        };

        // Secret codes and their rewards
        this.secretCodes = {
            'DARK_SIDE_OF_THE_OCEAN': {
                tokens: 2500,
                agents: ['Pink_Floyd_Prism'],
                badges: ['Music_Lover'],
                specialEffect: 'prism_power'
            },
            'TRIANGLE_SPECTRUM_AUTH': {
                tokens: 1500,
                badges: ['Spectrum_Master'],
                specialEffect: 'rainbow_boost'
            },
            'BREWERS_BINARY': {
                tokens: 2000,
                agents: ['Team_Captain'],
                badges: ['MLB_Legend']
            },
            'AMERICA_250': {
                tokens: 2500,
                badges: ['Patriot', 'Anniversary_Founder'],
                specialEffect: 'fireworks'
            },
            'KONAMI_CODE': {
                tokens: 5000,
                agents: ['Developer_Mode'],
                badges: ['Code_Master', 'Easter_Egg_Hunter'],
                specialAccess: ['developer_tools']
            }
        };

        // Achievement tracking
        this.achievements = {
            'FIRST_VISIT': { name: 'Welcome Explorer', tokens: 500 },
            'ALL_BOXES_OPENED': { name: 'Completionist', tokens: 2000 },
            'SECRET_HUNTER': { name: 'Secret Hunter', tokens: 1000 },
            'PERFECT_TIMING': { name: 'Perfect Timing', tokens: 1500 },
            'SOCIAL_SHARER': { name: 'Community Builder', tokens: 750 }
        };

        this.initializeDatabase();
        this.setupRoutes();
        this.startServer();
    }

    initializeDatabase() {
        this.db = new sqlite3.Database('welcome_gacha.db');
        
        this.db.serialize(() => {
            // User progress table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS user_progress (
                    user_id TEXT PRIMARY KEY,
                    session_id TEXT,
                    total_tokens INTEGER DEFAULT 0,
                    total_agents INTEGER DEFAULT 0,
                    boxes_opened TEXT DEFAULT '[]',
                    secrets_unlocked TEXT DEFAULT '[]',
                    achievements TEXT DEFAULT '[]',
                    first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completion_status TEXT DEFAULT 'in_progress'
                )
            `);

            // Rewards history
            this.db.run(`
                CREATE TABLE IF NOT EXISTS reward_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    reward_type TEXT,
                    reward_data TEXT,
                    tokens_awarded INTEGER DEFAULT 0,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Gacha pulls and results
            this.db.run(`
                CREATE TABLE IF NOT EXISTS gacha_pulls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    pull_type TEXT,
                    agent_received TEXT,
                    rarity TEXT,
                    special_effects TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('🎰 Welcome Gacha database initialized');
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'welcome-gacha-integration',
                activeUsers: 'tracking...'
            });
        });

        // Initialize new user session
        this.app.post('/welcome/start', async (req, res) => {
            await this.handleWelcomeStart(req, res);
        });

        // Process box opening rewards
        this.app.post('/welcome/open-box', async (req, res) => {
            await this.handleBoxOpen(req, res);
        });

        // Process secret code entry
        this.app.post('/welcome/secret-code', async (req, res) => {
            await this.handleSecretCode(req, res);
        });

        // Special event triggers
        this.app.post('/welcome/special-event', async (req, res) => {
            await this.handleSpecialEvent(req, res);
        });

        // Get user progress
        this.app.get('/welcome/progress/:userId', async (req, res) => {
            await this.handleGetProgress(req, res);
        });

        // Complete welcome journey
        this.app.post('/welcome/complete', async (req, res) => {
            await this.handleWelcomeComplete(req, res);
        });

        // Gacha pull mechanics
        this.app.post('/gacha/pull', async (req, res) => {
            await this.handleGachaPull(req, res);
        });

        // Achievement checking
        this.app.post('/achievements/check', async (req, res) => {
            await this.handleAchievementCheck(req, res);
        });
    }

    async handleWelcomeStart(req, res) {
        const { userAgent, referrer, timestamp } = req.body;
        const userId = this.generateUserId();
        const sessionId = crypto.randomBytes(16).toString('hex');

        try {
            // Create new user progress record
            await this.runQuery(
                `INSERT INTO user_progress (user_id, session_id, first_visit) VALUES (?, ?, ?)`,
                [userId, sessionId, new Date().toISOString()]
            );

            // Award first visit achievement
            const firstVisitReward = await this.awardAchievement(userId, 'FIRST_VISIT');

            res.json({
                success: true,
                userId,
                sessionId,
                message: 'Welcome to the NIL Sports Agency!',
                welcomeReward: {
                    tokens: firstVisitReward.tokens,
                    message: 'First time visitor bonus!',
                    specialStatus: 'founders_circle'
                },
                availableBoxes: Object.keys(this.welcomeRewards),
                totalPossibleRewards: this.calculateTotalPossibleRewards()
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleBoxOpen(req, res) {
        const { userId, boxType, timestamp } = req.body;

        try {
            // Get user progress
            const progress = await this.getUserProgress(userId);
            const boxesOpened = JSON.parse(progress.boxes_opened || '[]');

            // Check if box already opened
            if (boxesOpened.includes(boxType)) {
                return res.json({
                    success: false,
                    message: 'Box already opened!',
                    alreadyOpened: true
                });
            }

            // Get box rewards
            const boxRewards = this.welcomeRewards[boxType];
            if (!boxRewards) {
                return res.status(400).json({ error: 'Invalid box type' });
            }

            // Process rewards
            const rewards = await this.processBoxRewards(userId, boxType, boxRewards);

            // Update user progress
            boxesOpened.push(boxType);
            await this.updateUserProgress(userId, {
                boxes_opened: JSON.stringify(boxesOpened),
                total_tokens: progress.total_tokens + rewards.tokensAwarded,
                total_agents: progress.total_agents + rewards.agentsAwarded
            });

            // Record reward history
            await this.recordRewardHistory(userId, 'box_open', boxType, rewards);

            // Check for completion achievement
            if (boxesOpened.length === Object.keys(this.welcomeRewards).length) {
                const completionReward = await this.awardAchievement(userId, 'ALL_BOXES_OPENED');
                rewards.bonusTokens = completionReward.tokens;
                rewards.completionBonus = true;
            }

            res.json({
                success: true,
                boxType,
                rewards,
                progress: {
                    boxesOpened: boxesOpened.length,
                    totalBoxes: Object.keys(this.welcomeRewards).length,
                    totalTokens: progress.total_tokens + rewards.tokensAwarded
                },
                specialEffects: this.generateSpecialEffects(boxType)
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleSecretCode(req, res) {
        const { userId, secretCode, timestamp } = req.body;

        try {
            const code = secretCode.toUpperCase().trim();
            const codeRewards = this.secretCodes[code];

            if (!codeRewards) {
                return res.json({
                    success: false,
                    message: 'Invalid secret code',
                    hint: 'Try famous band names or gaming references...'
                });
            }

            // Check if already used
            const progress = await this.getUserProgress(userId);
            const secretsUnlocked = JSON.parse(progress.secrets_unlocked || '[]');

            if (secretsUnlocked.includes(code)) {
                return res.json({
                    success: false,
                    message: 'Secret code already used!',
                    alreadyUsed: true
                });
            }

            // Process secret code rewards
            const rewards = await this.processSecretCodeRewards(userId, code, codeRewards);

            // Update progress
            secretsUnlocked.push(code);
            await this.updateUserProgress(userId, {
                secrets_unlocked: JSON.stringify(secretsUnlocked),
                total_tokens: progress.total_tokens + rewards.tokensAwarded
            });

            // Award secret hunter achievement
            if (secretsUnlocked.length >= 3) {
                const secretHunterReward = await this.awardAchievement(userId, 'SECRET_HUNTER');
                rewards.bonusTokens = secretHunterReward.tokens;
            }

            res.json({
                success: true,
                secretCode: code,
                rewards,
                specialEffect: codeRewards.specialEffect,
                secretsFound: secretsUnlocked.length,
                totalSecrets: Object.keys(this.secretCodes).length
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleSpecialEvent(req, res) {
        const { userId, eventType, eventData } = req.body;

        try {
            let rewards = { tokens: 0, message: '' };

            switch (eventType) {
                case 'wave_click':
                    rewards = await this.processWaveClick(userId, eventData);
                    break;
                case 'konami_code':
                    rewards = await this.processKonamiCode(userId);
                    break;
                case 'anniversary_click':
                    rewards = await this.processAnniversaryBonus(userId);
                    break;
                case 'fireworks_trigger':
                    rewards = await this.processFireworksBonus(userId);
                    break;
                default:
                    return res.status(400).json({ error: 'Unknown event type' });
            }

            res.json({
                success: true,
                eventType,
                rewards,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleGachaPull(req, res) {
        const { userId, pullType = 'standard' } = req.body;

        try {
            // Generate gacha result
            const gachaResult = this.generateGachaResult(pullType);

            // Record the pull
            await this.runQuery(
                `INSERT INTO gacha_pulls (user_id, pull_type, agent_received, rarity, special_effects) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, pullType, gachaResult.agent, gachaResult.rarity, JSON.stringify(gachaResult.effects)]
            );

            // Update user progress
            const progress = await this.getUserProgress(userId);
            await this.updateUserProgress(userId, {
                total_tokens: progress.total_tokens - gachaResult.cost,
                total_agents: progress.total_agents + 1
            });

            res.json({
                success: true,
                gachaResult,
                remainingTokens: progress.total_tokens - gachaResult.cost
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleGetProgress(req, res) {
        const { userId } = req.params;

        try {
            const progress = await this.getUserProgress(userId);
            
            res.json({
                success: true,
                progress: {
                    userId,
                    totalTokens: progress.total_tokens,
                    totalAgents: progress.total_agents,
                    boxesOpened: JSON.parse(progress.boxes_opened || '[]'),
                    secretsUnlocked: JSON.parse(progress.secrets_unlocked || '[]'),
                    achievements: JSON.parse(progress.achievements || '[]'),
                    completionStatus: progress.completion_status,
                    firstVisit: progress.first_visit,
                    lastActivity: progress.last_activity
                }
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleWelcomeComplete(req, res) {
        const { userId, shareAction, socialPlatform } = req.body;

        try {
            const progress = await this.getUserProgress(userId);
            
            // Calculate completion bonus
            const completionBonus = this.calculateCompletionBonus(progress);

            // Award social sharing bonus if applicable
            let sharingBonus = 0;
            if (shareAction) {
                const socialReward = await this.awardAchievement(userId, 'SOCIAL_SHARER');
                sharingBonus = socialReward.tokens;
            }

            // Update completion status
            await this.updateUserProgress(userId, {
                completion_status: 'completed',
                total_tokens: progress.total_tokens + completionBonus + sharingBonus
            });

            // Generate completion certificate
            const certificate = this.generateCompletionCertificate(userId, progress);

            res.json({
                success: true,
                completionBonus,
                sharingBonus,
                totalRewardsEarned: progress.total_tokens + completionBonus + sharingBonus,
                certificate,
                nextSteps: [
                    'Visit your personalized dashboard',
                    'Start your first tournament',
                    'Explore agent marketplace',
                    'Join the community'
                ]
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Helper methods
    generateUserId() {
        return 'USER_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    async processBoxRewards(userId, boxType, boxRewards) {
        const rewards = {
            tokensAwarded: boxRewards.tokens || 0,
            agentsAwarded: (boxRewards.agents || []).length,
            agents: boxRewards.agents || [],
            badges: boxRewards.badges || [],
            territories: boxRewards.territories || [],
            artifacts: boxRewards.artifacts || [],
            specialAccess: boxRewards.specialAccess || [],
            description: boxRewards.description
        };

        return rewards;
    }

    async processSecretCodeRewards(userId, code, codeRewards) {
        const rewards = {
            tokensAwarded: codeRewards.tokens || 0,
            agents: codeRewards.agents || [],
            badges: codeRewards.badges || [],
            specialEffect: codeRewards.specialEffect,
            specialAccess: codeRewards.specialAccess || []
        };

        return rewards;
    }

    generateGachaResult(pullType) {
        const rarities = {
            common: { weight: 60, agents: ['Basic_Helper', 'Standard_Worker'], tokens: 0 },
            rare: { weight: 30, agents: ['Skilled_Professional', 'Advanced_Helper'], tokens: 100 },
            epic: { weight: 8, agents: ['Expert_Strategist', 'Elite_Performer'], tokens: 500 },
            legendary: { weight: 2, agents: ['QuantumStrategist', 'CodeMaster_Elite'], tokens: 2000 }
        };

        // Weighted random selection
        const totalWeight = Object.values(rarities).reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [rarity, data] of Object.entries(rarities)) {
            random -= data.weight;
            if (random <= 0) {
                const agent = data.agents[Math.floor(Math.random() * data.agents.length)];
                return {
                    agent,
                    rarity,
                    effects: rarity === 'legendary' ? ['rainbow', 'fireworks'] : [],
                    cost: pullType === 'premium' ? 100 : 50,
                    bonusTokens: data.tokens
                };
            }
        }
    }

    generateSpecialEffects(boxType) {
        const effects = {
            giftBox: ['confetti', 'golden_shower'],
            gachaBox: ['slot_machine', 'rainbow'],
            oceanBox: ['wave_splash', 'treasure_sparkle'],
            tournamentBox: ['victory_fanfare', 'trophy_shine'],
            secretBox: ['mystery_glow', 'portal_effect'],
            appleBox: ['tech_pulse', 'hologram']
        };

        return effects[boxType] || ['sparkle'];
    }

    async awardAchievement(userId, achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return { tokens: 0 };

        const progress = await this.getUserProgress(userId);
        const achievements = JSON.parse(progress.achievements || '[]');

        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            await this.updateUserProgress(userId, {
                achievements: JSON.stringify(achievements),
                total_tokens: progress.total_tokens + achievement.tokens
            });

            await this.recordRewardHistory(userId, 'achievement', achievementId, achievement);
        }

        return achievement;
    }

    calculateTotalPossibleRewards() {
        let total = 0;
        
        // Box rewards
        for (const rewards of Object.values(this.welcomeRewards)) {
            total += rewards.tokens || 0;
        }
        
        // Secret code rewards
        for (const rewards of Object.values(this.secretCodes)) {
            total += rewards.tokens || 0;
        }
        
        // Achievement rewards
        for (const achievement of Object.values(this.achievements)) {
            total += achievement.tokens || 0;
        }

        return total;
    }

    calculateCompletionBonus(progress) {
        const boxesOpened = JSON.parse(progress.boxes_opened || '[]').length;
        const secretsUnlocked = JSON.parse(progress.secrets_unlocked || '[]').length;
        const achievements = JSON.parse(progress.achievements || '[]').length;

        // Exponential bonus for completion
        return (boxesOpened * 500) + (secretsUnlocked * 300) + (achievements * 200);
    }

    generateCompletionCertificate(userId, progress) {
        return {
            certificateId: crypto.randomBytes(8).toString('hex').toUpperCase(),
            userId,
            completionDate: new Date().toISOString(),
            totalTokensEarned: progress.total_tokens,
            totalAgentsUnlocked: progress.total_agents,
            achievementsEarned: JSON.parse(progress.achievements || '[]').length,
            founderStatus: 'verified',
            specialRank: 'Founding Explorer'
        };
    }

    // Database helpers
    async getUserProgress(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM user_progress WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                }
            );
        });
    }

    async updateUserProgress(userId, updates) {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), new Date().toISOString(), userId];
        
        return this.runQuery(
            `UPDATE user_progress SET ${setClause}, last_activity = ? WHERE user_id = ?`,
            values
        );
    }

    async recordRewardHistory(userId, rewardType, rewardData, rewardDetails) {
        return this.runQuery(
            `INSERT INTO reward_history (user_id, reward_type, reward_data, tokens_awarded) 
             VALUES (?, ?, ?, ?)`,
            [userId, rewardType, JSON.stringify(rewardData), rewardDetails.tokens || rewardDetails.tokensAwarded || 0]
        );
    }

    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    async startServer() {
        this.app.listen(this.port, () => {
            console.log(`🎰 Welcome Gacha Integration running on http://localhost:${this.port}`);
            console.log('🎁 Features:');
            console.log('   • Real-time reward processing');
            console.log('   • Achievement tracking');
            console.log('   • Secret code validation');
            console.log('   • Gacha mechanics');
            console.log('   • Progress persistence');
            console.log('   • Completion certificates');
        });
    }
}

// Start the service
const welcomeGacha = new WelcomeGachaIntegration();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🎰 Shutting down Welcome Gacha Integration...');
    process.exit(0);
});

module.exports = WelcomeGachaIntegration;