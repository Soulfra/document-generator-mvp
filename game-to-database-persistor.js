#!/usr/bin/env node

/**
 * 💾 GAME TO DATABASE PERSISTOR
 * 
 * Persists game events and outcomes back to databases
 * Completes the flow: API → Forum → Gaming → Database
 */

const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const EventEmitter = require('events');

class GameToDatabasePersistor extends EventEmitter {
    constructor() {
        super();
        
        // PostgreSQL for relational data
        this.pgClient = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator'
        });
        
        // MongoDB for document data
        this.mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
        this.mongoClient = null;
        this.mongodb = null;
        
        // Learning system integration
        this.rlSystem = require('./real-game-api-rl-system');
        
        // Achievement tracking
        this.achievements = new Map();
        
        // Statistics tracking
        this.stats = {
            totalEvents: 0,
            successfulEvents: 0,
            failedEvents: 0,
            totalExperience: 0,
            totalGold: 0
        };
        
        console.log('💾 Game to Database Persistor initialized');
    }
    
    async initialize() {
        // Initialize PostgreSQL tables
        await this.initializePostgresTables();
        
        // Connect to MongoDB
        await this.connectMongoDB();
        
        // Load achievements
        await this.loadAchievements();
        
        console.log('✅ Database persistor ready');
    }
    
    async initializePostgresTables() {
        const tables = [
            // Main game outcomes table
            `CREATE TABLE IF NOT EXISTS game_outcomes (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR(255) UNIQUE,
                event_type VARCHAR(100),
                event_data JSONB,
                outcome_data JSONB,
                success_rate FLOAT,
                completion_time INTEGER,
                timestamp TIMESTAMP DEFAULT NOW()
            )`,
            
            // Player statistics
            `CREATE TABLE IF NOT EXISTS player_stats (
                player_id VARCHAR(255) PRIMARY KEY,
                player_type VARCHAR(50),
                total_experience INTEGER DEFAULT 0,
                total_gold INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                quests_completed INTEGER DEFAULT 0,
                buildings_created INTEGER DEFAULT 0,
                dungeons_explored INTEGER DEFAULT 0,
                portals_connected INTEGER DEFAULT 0,
                bosses_defeated INTEGER DEFAULT 0,
                last_active TIMESTAMP DEFAULT NOW()
            )`,
            
            // Quest completions
            `CREATE TABLE IF NOT EXISTS quest_completions (
                id SERIAL PRIMARY KEY,
                quest_id VARCHAR(255),
                player_id VARCHAR(255),
                quest_name VARCHAR(255),
                objectives JSONB,
                rewards JSONB,
                start_time TIMESTAMP,
                completion_time TIMESTAMP,
                duration INTEGER,
                score INTEGER
            )`,
            
            // Item inventory
            `CREATE TABLE IF NOT EXISTS player_inventory (
                id SERIAL PRIMARY KEY,
                player_id VARCHAR(255),
                item_name VARCHAR(255),
                item_type VARCHAR(50),
                item_data JSONB,
                quantity INTEGER DEFAULT 1,
                acquired_from VARCHAR(255),
                acquired_at TIMESTAMP DEFAULT NOW()
            )`,
            
            // Achievement progress
            `CREATE TABLE IF NOT EXISTS achievement_progress (
                player_id VARCHAR(255),
                achievement_id VARCHAR(255),
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                PRIMARY KEY (player_id, achievement_id)
            )`
        ];
        
        for (const table of tables) {
            await this.pgClient.query(table);
        }
        
        console.log('✅ PostgreSQL tables initialized');
    }
    
    async connectMongoDB() {
        try {
            this.mongoClient = new MongoClient(this.mongoUrl);
            await this.mongoClient.connect();
            this.mongodb = this.mongoClient.db('game_persistence');
            
            // Create collections if they don't exist
            const collections = ['game_events', 'player_profiles', 'world_state', 'learning_data'];
            for (const collection of collections) {
                await this.mongodb.createCollection(collection).catch(() => {});
            }
            
            console.log('✅ MongoDB connected');
        } catch (error) {
            console.error('⚠️ MongoDB connection failed:', error.message);
            // Continue without MongoDB
        }
    }
    
    async loadAchievements() {
        // Define achievements
        const achievements = [
            {
                id: 'first_build',
                name: 'First Structure',
                description: 'Build your first structure',
                requirement: { type: 'buildings_created', count: 1 },
                rewards: { experience: 100, title: 'Builder' }
            },
            {
                id: 'dungeon_master',
                name: 'Dungeon Master',
                description: 'Explore 10 dungeons',
                requirement: { type: 'dungeons_explored', count: 10 },
                rewards: { experience: 500, title: 'Explorer' }
            },
            {
                id: 'portal_architect',
                name: 'Portal Architect',
                description: 'Connect 5 portals',
                requirement: { type: 'portals_connected', count: 5 },
                rewards: { experience: 300, title: 'Connector' }
            },
            {
                id: 'boss_slayer',
                name: 'Boss Slayer',
                description: 'Defeat your first boss',
                requirement: { type: 'bosses_defeated', count: 1 },
                rewards: { experience: 1000, title: 'Slayer' }
            },
            {
                id: 'quest_champion',
                name: 'Quest Champion',
                description: 'Complete 20 quests',
                requirement: { type: 'quests_completed', count: 20 },
                rewards: { experience: 2000, title: 'Champion' }
            }
        ];
        
        achievements.forEach(a => this.achievements.set(a.id, a));
        console.log(`✅ Loaded ${achievements.length} achievements`);
    }
    
    async persistGameEvent(gameEvent, outcome) {
        console.log(`💾 Persisting game event: ${gameEvent.type}`);
        
        try {
            // Start transaction
            await this.pgClient.query('BEGIN');
            
            // 1. Store in PostgreSQL for relational data
            const relationalId = await this.storeRelationalData(gameEvent, outcome);
            
            // 2. Store in MongoDB for document data
            const documentId = await this.storeDocumentData(gameEvent, outcome);
            
            // 3. Update player statistics
            await this.updatePlayerStats(gameEvent.player.id, gameEvent, outcome);
            
            // 4. Update quest completion if applicable
            if (outcome.questCompleted) {
                await this.storeQuestCompletion(gameEvent, outcome);
            }
            
            // 5. Store items gained
            if (outcome.itemsGained && outcome.itemsGained.length > 0) {
                await this.storeItemsGained(gameEvent.player.id, outcome.itemsGained, gameEvent.id);
            }
            
            // 6. Check and update achievements
            const newAchievements = await this.checkAchievements(gameEvent.player.id);
            
            // 7. Update learning patterns
            await this.updateLearningPatterns(gameEvent, outcome);
            
            // 8. Generate completion certificate
            const certificate = await this.generateCompletionCertificate(gameEvent, outcome, newAchievements);
            
            // Commit transaction
            await this.pgClient.query('COMMIT');
            
            // Update stats
            this.stats.totalEvents++;
            if (outcome.success) {
                this.stats.successfulEvents++;
            } else {
                this.stats.failedEvents++;
            }
            this.stats.totalExperience += outcome.experienceGained || 0;
            this.stats.totalGold += outcome.goldGained || 0;
            
            // Emit persistence complete event
            this.emit('persistence:complete', {
                gameEvent,
                outcome,
                certificate,
                newAchievements
            });
            
            console.log(`✅ Game event persisted successfully`);
            
            return {
                success: true,
                relationalId,
                documentId,
                certificate,
                newAchievements
            };
            
        } catch (error) {
            await this.pgClient.query('ROLLBACK');
            console.error('❌ Persistence failed:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async storeRelationalData(gameEvent, outcome) {
        // Calculate success rate
        const successRate = outcome.success ? 
            (outcome.score || 100) / 100 : 
            0;
        
        // Calculate completion time
        const completionTime = outcome.endTime - gameEvent.timestamp;
        
        // Store main outcome
        const result = await this.pgClient.query(`
            INSERT INTO game_outcomes 
            (event_id, event_type, event_data, outcome_data, success_rate, completion_time)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (event_id) DO UPDATE SET
                outcome_data = $4,
                success_rate = $5,
                completion_time = $6
            RETURNING id
        `, [
            gameEvent.id,
            gameEvent.type,
            JSON.stringify(gameEvent.data),
            JSON.stringify(outcome),
            successRate,
            completionTime
        ]);
        
        return result.rows[0].id;
    }
    
    async storeDocumentData(gameEvent, outcome) {
        if (!this.mongodb) return null;
        
        try {
            // Create comprehensive document
            const document = {
                _id: gameEvent.id,
                timestamp: new Date(gameEvent.timestamp),
                completedAt: new Date(outcome.endTime),
                
                // Event details
                event: {
                    type: gameEvent.type,
                    layer: gameEvent.layer,
                    complexity: gameEvent.data.complexity,
                    entities: gameEvent.data.entities,
                    actions: gameEvent.data.actions
                },
                
                // Player info
                player: gameEvent.player,
                
                // Visual data
                visuals: gameEvent.visuals,
                
                // Game-specific data
                gameData: this.extractGameSpecificData(gameEvent),
                
                // Outcome
                outcome: {
                    success: outcome.success,
                    score: outcome.score,
                    duration: outcome.endTime - gameEvent.timestamp,
                    experienceGained: outcome.experienceGained,
                    goldGained: outcome.goldGained,
                    itemsGained: outcome.itemsGained
                },
                
                // Learning data
                patterns: outcome.patterns || []
            };
            
            const result = await this.mongodb.collection('game_events').insertOne(document);
            return result.insertedId;
            
        } catch (error) {
            console.error('⚠️ MongoDB storage failed:', error.message);
            return null;
        }
    }
    
    extractGameSpecificData(gameEvent) {
        const data = {};
        
        if (gameEvent.building) data.building = gameEvent.building;
        if (gameEvent.dungeon) data.dungeon = gameEvent.dungeon;
        if (gameEvent.portals) data.portals = gameEvent.portals;
        if (gameEvent.boss) data.boss = gameEvent.boss;
        
        return data;
    }
    
    async updatePlayerStats(playerId, gameEvent, outcome) {
        // Prepare stat updates based on event type
        const updates = {
            total_experience: outcome.experienceGained || 0,
            total_gold: outcome.goldGained || 0
        };
        
        // Event-specific stat updates
        switch (gameEvent.type) {
            case 'BUILD_STRUCTURE':
                updates.buildings_created = 1;
                break;
            case 'EXPLORE_DUNGEON':
                updates.dungeons_explored = 1;
                break;
            case 'CONNECT_PORTALS':
                updates.portals_connected = 1;
                break;
            case 'BOSS_BATTLE':
                if (outcome.success) {
                    updates.bosses_defeated = 1;
                }
                break;
        }
        
        if (outcome.questCompleted) {
            updates.quests_completed = 1;
        }
        
        // Build update query
        const updateClauses = Object.entries(updates)
            .map(([field, value]) => `${field} = ${field} + ${value}`)
            .join(', ');
        
        // Update or insert player stats
        await this.pgClient.query(`
            INSERT INTO player_stats (player_id, player_type, ${Object.keys(updates).join(', ')})
            VALUES ($1, $2, ${Object.values(updates).join(', ')})
            ON CONFLICT (player_id) DO UPDATE SET
                ${updateClauses},
                last_active = NOW()
        `, [playerId, gameEvent.player.type]);
        
        // Calculate new level
        await this.calculatePlayerLevel(playerId);
    }
    
    async calculatePlayerLevel(playerId) {
        const stats = await this.pgClient.query(
            'SELECT total_experience FROM player_stats WHERE player_id = $1',
            [playerId]
        );
        
        if (stats.rows.length > 0) {
            const experience = stats.rows[0].total_experience;
            const newLevel = Math.floor(Math.sqrt(experience / 100)) + 1;
            
            await this.pgClient.query(
                'UPDATE player_stats SET level = $1 WHERE player_id = $2',
                [newLevel, playerId]
            );
        }
    }
    
    async storeQuestCompletion(gameEvent, outcome) {
        const duration = outcome.endTime - gameEvent.timestamp;
        const score = outcome.score || 100;
        
        await this.pgClient.query(`
            INSERT INTO quest_completions 
            (quest_id, player_id, quest_name, objectives, rewards, start_time, completion_time, duration, score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            gameEvent.questId,
            gameEvent.player.id,
            outcome.questName || `${gameEvent.type} Quest`,
            JSON.stringify(outcome.objectives || []),
            JSON.stringify(outcome.rewards || gameEvent.rewards),
            new Date(gameEvent.timestamp),
            new Date(outcome.endTime),
            duration,
            score
        ]);
    }
    
    async storeItemsGained(playerId, items, acquiredFrom) {
        for (const item of items) {
            await this.pgClient.query(`
                INSERT INTO player_inventory 
                (player_id, item_name, item_type, item_data, quantity, acquired_from)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                playerId,
                item.name,
                item.type || 'common',
                JSON.stringify(item),
                item.quantity || 1,
                acquiredFrom
            ]);
        }
    }
    
    async checkAchievements(playerId) {
        const newAchievements = [];
        
        // Get player stats
        const stats = await this.pgClient.query(
            'SELECT * FROM player_stats WHERE player_id = $1',
            [playerId]
        );
        
        if (stats.rows.length === 0) return newAchievements;
        
        const playerStats = stats.rows[0];
        
        // Check each achievement
        for (const [id, achievement] of this.achievements) {
            // Check if already completed
            const progress = await this.pgClient.query(
                'SELECT completed FROM achievement_progress WHERE player_id = $1 AND achievement_id = $2',
                [playerId, id]
            );
            
            if (progress.rows.length > 0 && progress.rows[0].completed) {
                continue;
            }
            
            // Check if requirement is met
            const statValue = playerStats[achievement.requirement.type] || 0;
            if (statValue >= achievement.requirement.count) {
                // Achievement unlocked!
                await this.pgClient.query(`
                    INSERT INTO achievement_progress 
                    (player_id, achievement_id, progress, completed, completed_at)
                    VALUES ($1, $2, $3, true, NOW())
                    ON CONFLICT (player_id, achievement_id) DO UPDATE SET
                        progress = $3,
                        completed = true,
                        completed_at = NOW()
                `, [playerId, id, statValue]);
                
                newAchievements.push(achievement);
                
                // Grant achievement rewards
                await this.grantAchievementRewards(playerId, achievement);
            }
        }
        
        return newAchievements;
    }
    
    async grantAchievementRewards(playerId, achievement) {
        if (achievement.rewards.experience) {
            await this.pgClient.query(
                'UPDATE player_stats SET total_experience = total_experience + $1 WHERE player_id = $2',
                [achievement.rewards.experience, playerId]
            );
        }
        
        if (achievement.rewards.title) {
            // Store title as special item
            await this.storeItemsGained(playerId, [{
                name: achievement.rewards.title,
                type: 'title',
                description: `Earned from: ${achievement.name}`
            }], `achievement_${achievement.id}`);
        }
    }
    
    async updateLearningPatterns(gameEvent, outcome) {
        try {
            // Send data to RL system
            await this.rlSystem.analyzeRLPattern('game_outcome', {
                eventType: gameEvent.type,
                eventLayer: gameEvent.layer,
                complexity: gameEvent.data.complexity,
                success: outcome.success,
                score: outcome.score,
                duration: outcome.endTime - gameEvent.timestamp,
                experienceGained: outcome.experienceGained,
                patterns: outcome.patterns
            });
        } catch (error) {
            console.log('⚠️ Learning system unavailable:', error.message);
        }
    }
    
    async generateCompletionCertificate(gameEvent, outcome, newAchievements) {
        const certificate = {
            id: `CERT_${gameEvent.id}`,
            timestamp: new Date().toISOString(),
            
            // Event summary
            event: {
                id: gameEvent.id,
                type: gameEvent.type,
                layer: gameEvent.layer,
                complexity: gameEvent.data.complexity
            },
            
            // Player info
            player: {
                id: gameEvent.player.id,
                type: gameEvent.player.type,
                level: gameEvent.player.level
            },
            
            // Results
            results: {
                success: outcome.success,
                score: outcome.score || 0,
                duration: outcome.endTime - gameEvent.timestamp,
                experienceGained: outcome.experienceGained || 0,
                goldGained: outcome.goldGained || 0,
                itemsGained: outcome.itemsGained?.length || 0
            },
            
            // Achievements unlocked
            achievementsUnlocked: newAchievements.map(a => ({
                name: a.name,
                description: a.description
            })),
            
            // Signature
            signature: this.generateSignature(gameEvent, outcome)
        };
        
        // Store certificate in MongoDB for rich querying
        if (this.mongodb) {
            await this.mongodb.collection('certificates').insertOne(certificate);
        }
        
        return certificate;
    }
    
    generateSignature(gameEvent, outcome) {
        const crypto = require('crypto');
        const data = `${gameEvent.id}:${outcome.success}:${outcome.endTime}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    // Query methods
    async getPlayerProfile(playerId) {
        const stats = await this.pgClient.query(
            'SELECT * FROM player_stats WHERE player_id = $1',
            [playerId]
        );
        
        const inventory = await this.pgClient.query(
            'SELECT * FROM player_inventory WHERE player_id = $1',
            [playerId]
        );
        
        const achievements = await this.pgClient.query(
            'SELECT * FROM achievement_progress WHERE player_id = $1 AND completed = true',
            [playerId]
        );
        
        const recentQuests = await this.pgClient.query(
            'SELECT * FROM quest_completions WHERE player_id = $1 ORDER BY completion_time DESC LIMIT 10',
            [playerId]
        );
        
        return {
            stats: stats.rows[0] || null,
            inventory: inventory.rows,
            achievements: achievements.rows,
            recentQuests: recentQuests.rows
        };
    }
    
    async getGameStatistics() {
        const totalPlayers = await this.pgClient.query(
            'SELECT COUNT(DISTINCT player_id) as count FROM player_stats'
        );
        
        const topPlayers = await this.pgClient.query(
            'SELECT * FROM player_stats ORDER BY total_experience DESC LIMIT 10'
        );
        
        const recentEvents = await this.pgClient.query(
            'SELECT * FROM game_outcomes ORDER BY timestamp DESC LIMIT 20'
        );
        
        return {
            systemStats: this.stats,
            totalPlayers: totalPlayers.rows[0].count,
            topPlayers: topPlayers.rows,
            recentEvents: recentEvents.rows
        };
    }
}

module.exports = GameToDatabasePersistor;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('💾 GAME TO DATABASE PERSISTOR DEMO');
        console.log('==================================\n');
        
        const persistor = new GameToDatabasePersistor();
        await persistor.initialize();
        
        // Test game event
        const testGameEvent = {
            id: 'EVENT_' + Date.now(),
            type: 'BUILD_STRUCTURE',
            layer: '3d',
            timestamp: Date.now(),
            questId: 'QUEST_BUILD_001',
            
            data: {
                complexity: 'high',
                entities: ['Tower', 'Bridge', 'Portal'],
                actions: ['design', 'construct', 'activate']
            },
            
            player: {
                id: 'demo-player',
                type: 'human',
                level: 5
            },
            
            rewards: {
                experience: 500,
                gold: 250,
                items: [{
                    name: 'Master Blueprint',
                    type: 'rare'
                }]
            },
            
            building: {
                type: 'Wizard Tower',
                materials: ['Stone', 'Crystal', 'Magic'],
                blueprint: { floors: 5, rooms: 12 }
            }
        };
        
        // Test outcome
        const testOutcome = {
            success: true,
            score: 95,
            endTime: Date.now() + 300000, // 5 minutes later
            experienceGained: 500,
            goldGained: 250,
            itemsGained: testGameEvent.rewards.items,
            questCompleted: true,
            questName: 'Tower Construction Quest',
            objectives: [
                { action: 'design', completed: true },
                { action: 'construct', completed: true },
                { action: 'activate', completed: true }
            ],
            patterns: ['efficient_building', 'resource_optimization']
        };
        
        // Persist the event
        const result = await persistor.persistGameEvent(testGameEvent, testOutcome);
        
        console.log('\n📊 Persistence Result:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📄 Certificate ID: ${result.certificate?.id}`);
        console.log(`🏆 New Achievements: ${result.newAchievements?.length || 0}`);
        
        if (result.newAchievements && result.newAchievements.length > 0) {
            console.log('\n🎯 Achievements Unlocked:');
            result.newAchievements.forEach(a => {
                console.log(`   🏅 ${a.name}: ${a.description}`);
            });
        }
        
        // Get player profile
        const profile = await persistor.getPlayerProfile('demo-player');
        console.log('\n👤 Player Profile:');
        console.log(`   Level: ${profile.stats?.level || 1}`);
        console.log(`   Experience: ${profile.stats?.total_experience || 0}`);
        console.log(`   Gold: ${profile.stats?.total_gold || 0}`);
        console.log(`   Inventory: ${profile.inventory.length} items`);
        
        // Get system statistics
        const systemStats = await persistor.getGameStatistics();
        console.log('\n📈 System Statistics:');
        console.log(`   Total Events: ${systemStats.systemStats.totalEvents}`);
        console.log(`   Success Rate: ${systemStats.systemStats.successfulEvents / systemStats.systemStats.totalEvents * 100}%`);
        console.log(`   Total Players: ${systemStats.totalPlayers}`);
        
        // Close connections
        await persistor.pgClient.end();
        if (persistor.mongoClient) {
            await persistor.mongoClient.close();
        }
    };
    
    demo().catch(console.error);
}