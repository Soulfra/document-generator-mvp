#!/usr/bin/env node

/**
 * 🆔🧬 CHARACTER IDENTITY SYSTEM - TIN Network & Lineage Tracking
 * 
 * Universal character identification like SSN for gaming
 * Tracks lineage, deaths, achievements, and cross-game identity
 * Integrates with deployment orchestrator and leaderboard systems
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class CharacterIdentitySystem extends EventEmitter {
    constructor() {
        super();
        
        this.db = null;
        this.tinRegistry = new Map();
        this.lineageTree = new Map();
        this.deathRegistry = new Map();
        this.reputationEngine = new ReputationEngine();
        
        // TIN generation configuration
        this.tinConfig = {
            prefix: 'TIN',
            length: 9,
            format: 'TIN-ABC123', // 3 letters + 3 numbers
            checksum: true
        };
        
        console.log('🆔 Character Identity System initializing...');
        this.init();
    }
    
    async init() {
        await this.setupDatabase();
        await this.loadExistingCharacters();
        this.startPeriodicMaintenance();
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                🆔 CHARACTER IDENTITY SYSTEM ACTIVE           ║
║                                                              ║
║  Universal TIN Registry for Gaming                          ║
║                                                              ║
║  🔢 TIN Format: TIN-ABC123                                  ║
║  🧬 Lineage Tracking: Parent-child relationships           ║
║  💀 Death Registry: Speedrun failure analysis              ║
║  🏆 Reputation Engine: Cross-game achievements             ║
║  📊 Active Characters: ${this.tinRegistry.size.toString().padStart(8)}                      ║
╚══════════════════════════════════════════════════════════════╝`);
    }
    
    async setupDatabase() {
        const dbPath = path.join(__dirname, 'data', 'character-identity.db');
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        
        this.db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        // Create character registry table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS characters (
                tin TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_tin TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                status TEXT DEFAULT 'active',
                game_type TEXT,
                metadata TEXT,
                FOREIGN KEY (parent_tin) REFERENCES characters (tin)
            )
        `);
        
        // Create death registry table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS deaths (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tin TEXT NOT NULL,
                game_type TEXT NOT NULL,
                cause TEXT NOT NULL,
                level INTEGER,
                time_alive INTEGER,
                location TEXT,
                timestamp INTEGER NOT NULL,
                run_id TEXT,
                metadata TEXT,
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create achievements table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tin TEXT NOT NULL,
                achievement_type TEXT NOT NULL,
                achievement_name TEXT NOT NULL,
                game_type TEXT,
                value REAL,
                timestamp INTEGER NOT NULL,
                metadata TEXT,
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create reputation scores table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS reputation (
                tin TEXT PRIMARY KEY,
                trust_score REAL DEFAULT 50.0,
                skill_score REAL DEFAULT 0.0,
                social_score REAL DEFAULT 0.0,
                achievement_score REAL DEFAULT 0.0,
                total_score REAL DEFAULT 50.0,
                rank_tier TEXT DEFAULT 'bronze',
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create lineage tracking table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS lineage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ancestor_tin TEXT NOT NULL,
                descendant_tin TEXT NOT NULL,
                relationship_type TEXT NOT NULL,
                generation INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (ancestor_tin) REFERENCES characters (tin),
                FOREIGN KEY (descendant_tin) REFERENCES characters (tin)
            )
        `);
        
        // Create cross-game identity table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS cross_game_identity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tin TEXT NOT NULL,
                game_type TEXT NOT NULL,
                game_id TEXT,
                username TEXT,
                level INTEGER DEFAULT 1,
                play_time INTEGER DEFAULT 0,
                last_active INTEGER,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create indexes for performance
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_characters_name ON characters (name);
            CREATE INDEX IF NOT EXISTS idx_characters_parent ON characters (parent_tin);
            CREATE INDEX IF NOT EXISTS idx_deaths_tin ON deaths (tin);
            CREATE INDEX IF NOT EXISTS idx_deaths_game ON deaths (game_type);
            CREATE INDEX IF NOT EXISTS idx_achievements_tin ON achievements (tin);
            CREATE INDEX IF NOT EXISTS idx_lineage_descendant ON lineage (descendant_tin);
            CREATE INDEX IF NOT EXISTS idx_cross_game_tin ON cross_game_identity (tin);
        `);
        
        console.log('🗄️ Character identity database initialized');
    }
    
    async loadExistingCharacters() {
        const characters = await this.db.all('SELECT * FROM characters');
        
        for (const character of characters) {
            this.tinRegistry.set(character.tin, {
                tin: character.tin,
                name: character.name,
                parentTIN: character.parent_tin,
                created: new Date(character.created_at),
                updated: new Date(character.updated_at),
                status: character.status,
                gameType: character.game_type,
                metadata: character.metadata ? JSON.parse(character.metadata) : {}
            });
        }
        
        console.log(`📚 Loaded ${characters.length} existing characters`);
    }
    
    async registerCharacter(characterData) {
        const {
            name,
            parentTIN = null,
            gameType = 'general',
            metadata = {}
        } = characterData;
        
        // Generate unique TIN
        const tin = await this.generateTIN();
        
        // Validate parent TIN if provided
        if (parentTIN && !this.tinRegistry.has(parentTIN)) {
            throw new Error(`Parent TIN not found: ${parentTIN}`);
        }
        
        const character = {
            tin,
            name,
            parentTIN,
            created: new Date(),
            updated: new Date(),
            status: 'active',
            gameType,
            metadata
        };
        
        // Insert into database
        await this.db.run(`
            INSERT INTO characters (tin, name, parent_tin, created_at, updated_at, status, game_type, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tin,
            name,
            parentTIN,
            character.created.getTime(),
            character.updated.getTime(),
            character.status,
            gameType,
            JSON.stringify(metadata)
        ]);
        
        // Add to memory registry
        this.tinRegistry.set(tin, character);
        
        // Initialize reputation
        await this.reputationEngine.initializeReputation(tin);
        
        // Track lineage if has parent
        if (parentTIN) {
            await this.trackLineage(parentTIN, tin, 'child');
        }
        
        // Create cross-game identity
        await this.createCrossGameIdentity(tin, gameType, name);
        
        this.emit('characterRegistered', character);
        
        console.log(`👤 Character registered: ${name} (${tin})`);
        
        return character;
    }
    
    async generateTIN() {
        let tin;
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            // Generate format: TIN-ABC123
            const letters = this.generateRandomLetters(3);
            const numbers = this.generateRandomNumbers(3);
            tin = `${this.tinConfig.prefix}-${letters}${numbers}`;
            
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error('Unable to generate unique TIN after maximum attempts');
            }
        } while (this.tinRegistry.has(tin) || await this.tinExistsInDB(tin));
        
        return tin;
    }
    
    generateRandomLetters(length) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += letters[Math.floor(Math.random() * letters.length)];
        }
        return result;
    }
    
    generateRandomNumbers(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }
    
    async tinExistsInDB(tin) {
        const result = await this.db.get('SELECT tin FROM characters WHERE tin = ?', [tin]);
        return !!result;
    }
    
    async getCharacter(tin) {
        // Check memory first
        if (this.tinRegistry.has(tin)) {
            return this.tinRegistry.get(tin);
        }
        
        // Check database
        const character = await this.db.get('SELECT * FROM characters WHERE tin = ?', [tin]);
        if (!character) {
            return null;
        }
        
        const characterData = {
            tin: character.tin,
            name: character.name,
            parentTIN: character.parent_tin,
            created: new Date(character.created_at),
            updated: new Date(character.updated_at),
            status: character.status,
            gameType: character.game_type,
            metadata: character.metadata ? JSON.parse(character.metadata) : {}
        };
        
        // Cache in memory
        this.tinRegistry.set(tin, characterData);
        
        return characterData;
    }
    
    async recordDeath(deathData) {
        const {
            tin,
            gameType,
            cause,
            level = 1,
            timeAlive = 0,
            location = 'unknown',
            runId = null,
            metadata = {}
        } = deathData;
        
        // Validate character exists
        const character = await this.getCharacter(tin);
        if (!character) {
            throw new Error(`Character not found: ${tin}`);
        }
        
        const death = {
            tin,
            gameType,
            cause,
            level,
            timeAlive,
            location,
            runId,
            timestamp: Date.now(),
            metadata
        };
        
        // Insert into database
        await this.db.run(`
            INSERT INTO deaths (tin, game_type, cause, level, time_alive, location, timestamp, run_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tin,
            gameType,
            cause,
            level,
            timeAlive,
            location,
            death.timestamp,
            runId,
            JSON.stringify(metadata)
        ]);
        
        // Update reputation based on death
        await this.reputationEngine.processDeath(tin, death);
        
        this.emit('characterDeath', death);
        
        console.log(`💀 Death recorded: ${character.name} (${tin}) - ${cause}`);
        
        return death;
    }
    
    async awardAchievement(achievementData) {
        const {
            tin,
            achievementType,
            achievementName,
            gameType = 'general',
            value = 1,
            metadata = {}
        } = achievementData;
        
        // Validate character exists
        const character = await this.getCharacter(tin);
        if (!character) {
            throw new Error(`Character not found: ${tin}`);
        }
        
        const achievement = {
            tin,
            achievementType,
            achievementName,
            gameType,
            value,
            timestamp: Date.now(),
            metadata
        };
        
        // Insert into database
        await this.db.run(`
            INSERT INTO achievements (tin, achievement_type, achievement_name, game_type, value, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            tin,
            achievementType,
            achievementName,
            gameType,
            value,
            achievement.timestamp,
            JSON.stringify(metadata)
        ]);
        
        // Update reputation based on achievement
        await this.reputationEngine.processAchievement(tin, achievement);
        
        this.emit('achievementAwarded', achievement);
        
        console.log(`🏆 Achievement awarded: ${character.name} (${tin}) - ${achievementName}`);
        
        return achievement;
    }
    
    async trackLineage(ancestorTIN, descendantTIN, relationshipType = 'child') {
        // Calculate generation
        const generation = await this.calculateGeneration(ancestorTIN) + 1;
        
        await this.db.run(`
            INSERT INTO lineage (ancestor_tin, descendant_tin, relationship_type, generation, created_at)
            VALUES (?, ?, ?, ?, ?)
        `, [
            ancestorTIN,
            descendantTIN,
            relationshipType,
            generation,
            Date.now()
        ]);
        
        console.log(`🧬 Lineage tracked: ${ancestorTIN} -> ${descendantTIN} (Gen ${generation})`);
    }
    
    async calculateGeneration(tin) {
        const result = await this.db.get(`
            SELECT MAX(generation) as max_gen 
            FROM lineage 
            WHERE descendant_tin = ?
        `, [tin]);
        
        return result?.max_gen || 0;
    }
    
    async getLineage(tin, depth = 3) {
        // Get descendants
        const descendants = await this.db.all(`
            SELECT l.*, c.name 
            FROM lineage l 
            JOIN characters c ON l.descendant_tin = c.tin 
            WHERE l.ancestor_tin = ? AND l.generation <= ?
            ORDER BY l.generation, l.created_at
        `, [tin, depth]);
        
        // Get ancestors
        const ancestors = await this.db.all(`
            SELECT l.*, c.name 
            FROM lineage l 
            JOIN characters c ON l.ancestor_tin = c.tin 
            WHERE l.descendant_tin = ? AND l.generation <= ?
            ORDER BY l.generation DESC
        `, [tin, depth]);
        
        return {
            character: await this.getCharacter(tin),
            descendants,
            ancestors
        };
    }
    
    async createCrossGameIdentity(tin, gameType, username) {
        await this.db.run(`
            INSERT INTO cross_game_identity (tin, game_type, username, last_active)
            VALUES (?, ?, ?, ?)
        `, [
            tin,
            gameType,
            username,
            Date.now()
        ]);
        
        console.log(`🎮 Cross-game identity created: ${tin} in ${gameType}`);
    }
    
    async updateCrossGameProgress(tin, gameType, progressData) {
        const {
            level = null,
            playTime = null,
            gameId = null
        } = progressData;
        
        const updates = [];
        const values = [];
        
        if (level !== null) {
            updates.push('level = ?');
            values.push(level);
        }
        
        if (playTime !== null) {
            updates.push('play_time = play_time + ?');
            values.push(playTime);
        }
        
        if (gameId !== null) {
            updates.push('game_id = ?');
            values.push(gameId);
        }
        
        updates.push('last_active = ?');
        values.push(Date.now());
        
        values.push(tin, gameType);
        
        await this.db.run(`
            UPDATE cross_game_identity 
            SET ${updates.join(', ')}
            WHERE tin = ? AND game_type = ?
        `, values);
        
        console.log(`📊 Progress updated: ${tin} in ${gameType}`);
    }
    
    async getCharacterStats(tin) {
        const character = await this.getCharacter(tin);
        if (!character) {
            throw new Error(`Character not found: ${tin}`);
        }
        
        // Get death count by game type
        const deaths = await this.db.all(`
            SELECT game_type, COUNT(*) as count, AVG(level) as avg_level, AVG(time_alive) as avg_time
            FROM deaths 
            WHERE tin = ? 
            GROUP BY game_type
        `, [tin]);
        
        // Get achievement count
        const achievements = await this.db.all(`
            SELECT achievement_type, COUNT(*) as count, SUM(value) as total_value
            FROM achievements 
            WHERE tin = ? 
            GROUP BY achievement_type
        `, [tin]);
        
        // Get reputation
        const reputation = await this.db.get(`
            SELECT * FROM reputation WHERE tin = ?
        `, [tin]);
        
        // Get cross-game identities
        const crossGameIdentities = await this.db.all(`
            SELECT * FROM cross_game_identity WHERE tin = ?
        `, [tin]);
        
        // Get lineage info
        const childrenCount = await this.db.get(`
            SELECT COUNT(*) as count FROM lineage WHERE ancestor_tin = ?
        `, [tin]);
        
        const generation = await this.calculateGeneration(tin);
        
        return {
            character,
            stats: {
                deaths: deaths.reduce((acc, d) => {
                    acc[d.game_type] = {
                        count: d.count,
                        avgLevel: Math.round(d.avg_level || 0),
                        avgTimeAlive: Math.round(d.avg_time || 0)
                    };
                    return acc;
                }, {}),
                achievements: achievements.reduce((acc, a) => {
                    acc[a.achievement_type] = {
                        count: a.count,
                        totalValue: a.total_value || 0
                    };
                    return acc;
                }, {}),
                reputation: reputation || { total_score: 50, rank_tier: 'bronze' },
                crossGameProgress: crossGameIdentities,
                lineage: {
                    generation,
                    childrenCount: childrenCount.count
                }
            }
        };
    }
    
    async searchCharacters(query) {
        const characters = await this.db.all(`
            SELECT * FROM characters 
            WHERE name LIKE ? OR tin LIKE ?
            LIMIT 50
        `, [`%${query}%`, `%${query}%`]);
        
        return characters.map(c => ({
            tin: c.tin,
            name: c.name,
            gameType: c.game_type,
            status: c.status,
            created: new Date(c.created_at)
        }));
    }
    
    async getLeaderboards(gameType = null, metric = 'reputation') {
        let query = '';
        let params = [];
        
        switch (metric) {
            case 'reputation':
                query = `
                    SELECT c.tin, c.name, r.total_score, r.rank_tier
                    FROM characters c
                    JOIN reputation r ON c.tin = r.tin
                    ${gameType ? 'WHERE c.game_type = ?' : ''}
                    ORDER BY r.total_score DESC
                    LIMIT 100
                `;
                if (gameType) params.push(gameType);
                break;
                
            case 'achievements':
                query = `
                    SELECT c.tin, c.name, COUNT(a.id) as achievement_count, SUM(a.value) as total_value
                    FROM characters c
                    LEFT JOIN achievements a ON c.tin = a.tin
                    ${gameType ? 'WHERE c.game_type = ?' : ''}
                    GROUP BY c.tin, c.name
                    ORDER BY total_value DESC, achievement_count DESC
                    LIMIT 100
                `;
                if (gameType) params.push(gameType);
                break;
                
            case 'survival':
                query = `
                    SELECT c.tin, c.name, 
                           COALESCE(d.death_count, 0) as death_count,
                           COALESCE(d.max_level, 0) as max_level,
                           COALESCE(d.max_time_alive, 0) as max_time_alive
                    FROM characters c
                    LEFT JOIN (
                        SELECT tin, COUNT(*) as death_count, 
                               MAX(level) as max_level, 
                               MAX(time_alive) as max_time_alive
                        FROM deaths 
                        ${gameType ? 'WHERE game_type = ?' : ''}
                        GROUP BY tin
                    ) d ON c.tin = d.tin
                    ORDER BY d.max_level DESC, d.max_time_alive DESC, d.death_count ASC
                    LIMIT 100
                `;
                if (gameType) params.push(gameType);
                break;
        }
        
        return await this.db.all(query, params);
    }
    
    startPeriodicMaintenance() {
        // Update reputation scores every hour
        setInterval(async () => {
            await this.reputationEngine.recalculateAllReputations();
        }, 60 * 60 * 1000);
        
        // Clean up old data daily
        setInterval(async () => {
            await this.cleanupOldData();
        }, 24 * 60 * 60 * 1000);
    }
    
    async cleanupOldData() {
        // Archive deaths older than 1 year
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        
        const archivedDeaths = await this.db.run(`
            DELETE FROM deaths 
            WHERE timestamp < ? AND tin NOT IN (
                SELECT DISTINCT tin FROM deaths 
                WHERE timestamp >= ?
            )
        `, [oneYearAgo, oneYearAgo]);
        
        if (archivedDeaths.changes > 0) {
            console.log(`🗄️ Archived ${archivedDeaths.changes} old death records`);
        }
    }
    
    // Integration methods
    async getCharacterForDeployment(tin) {
        const character = await this.getCharacter(tin);
        if (!character) {
            throw new Error(`Character not found for deployment: ${tin}`);
        }
        
        const stats = await this.getCharacterStats(tin);
        
        return {
            ...character,
            ...stats
        };
    }
    
    async createCharacterForSpeedrun(name, gameType, parentTIN = null) {
        return await this.registerCharacter({
            name,
            gameType,
            parentTIN,
            metadata: {
                purpose: 'speedrun',
                created_for: gameType
            }
        });
    }
}

// Reputation Engine for cross-game scoring
class ReputationEngine {
    constructor() {
        this.scoreWeights = {
            achievements: 0.4,
            survival: 0.3,
            social: 0.2,
            consistency: 0.1
        };
        
        this.tierThresholds = {
            bronze: 0,
            silver: 100,
            gold: 250,
            platinum: 500,
            diamond: 1000,
            master: 2000,
            grandmaster: 5000
        };
    }
    
    async initializeReputation(tin) {
        const db = require('./character-identity-system').db;
        
        await db.run(`
            INSERT INTO reputation (tin, updated_at)
            VALUES (?, ?)
        `, [tin, Date.now()]);
        
        console.log(`⭐ Reputation initialized for ${tin}`);
    }
    
    async processAchievement(tin, achievement) {
        // Calculate achievement score based on type and value
        let scoreIncrease = 0;
        
        switch (achievement.achievementType) {
            case 'speedrun_completion':
                scoreIncrease = achievement.value * 10; // 10 points per completion
                break;
            case 'no_death_run':
                scoreIncrease = 50; // Bonus for no deaths
                break;
            case 'first_place':
                scoreIncrease = 100; // Big bonus for winning
                break;
            case 'personal_best':
                scoreIncrease = 25; // Personal improvement
                break;
            default:
                scoreIncrease = achievement.value * 5;
        }
        
        await this.updateScore(tin, 'achievement_score', scoreIncrease);
    }
    
    async processDeath(tin, death) {
        // Penalize death but reward survival time
        const survivalBonus = Math.min(death.timeAlive / 1000 / 60, 30); // Max 30 points for 30+ minutes
        const levelBonus = death.level * 2; // 2 points per level reached
        const deathPenalty = -10; // Small penalty for dying
        
        const totalChange = survivalBonus + levelBonus + deathPenalty;
        
        await this.updateScore(tin, 'skill_score', totalChange);
    }
    
    async updateScore(tin, scoreType, change) {
        const db = require('./character-identity-system').db;
        
        await db.run(`
            UPDATE reputation 
            SET ${scoreType} = ${scoreType} + ?,
                updated_at = ?
            WHERE tin = ?
        `, [change, Date.now(), tin]);
        
        // Recalculate total score and tier
        await this.recalculateReputation(tin);
    }
    
    async recalculateReputation(tin) {
        const db = require('./character-identity-system').db;
        
        const scores = await db.get(`
            SELECT * FROM reputation WHERE tin = ?
        `, [tin]);
        
        if (!scores) return;
        
        // Calculate weighted total
        const totalScore = Math.max(0,
            scores.trust_score * 0.2 +
            scores.skill_score * 0.3 +
            scores.social_score * 0.2 +
            scores.achievement_score * 0.3
        );
        
        // Determine tier
        const tier = this.calculateTier(totalScore);
        
        await db.run(`
            UPDATE reputation 
            SET total_score = ?, rank_tier = ?, updated_at = ?
            WHERE tin = ?
        `, [totalScore, tier, Date.now(), tin]);
    }
    
    calculateTier(score) {
        if (score >= this.tierThresholds.grandmaster) return 'grandmaster';
        if (score >= this.tierThresholds.master) return 'master';
        if (score >= this.tierThresholds.diamond) return 'diamond';
        if (score >= this.tierThresholds.platinum) return 'platinum';
        if (score >= this.tierThresholds.gold) return 'gold';
        if (score >= this.tierThresholds.silver) return 'silver';
        return 'bronze';
    }
    
    async recalculateAllReputations() {
        const db = require('./character-identity-system').db;
        
        const allCharacters = await db.all(`
            SELECT tin FROM reputation
        `);
        
        for (const character of allCharacters) {
            await this.recalculateReputation(character.tin);
        }
        
        console.log(`⭐ Recalculated reputation for ${allCharacters.length} characters`);
    }
}

module.exports = { CharacterIdentitySystem, ReputationEngine };

// Run if called directly
if (require.main === module) {
    const identitySystem = new CharacterIdentitySystem();
    
    // Example usage after startup
    setTimeout(async () => {
        console.log('\n🧪 Running example character registration...');
        
        try {
            // Register a parent character
            const parent = await identitySystem.registerCharacter({
                name: 'SpeedRunner_Master',
                gameType: 'chess-speedrun'
            });
            
            console.log(`✅ Parent character created: ${parent.name} (${parent.tin})`);
            
            // Register a child character
            const child = await identitySystem.registerCharacter({
                name: 'SpeedRunner_Apprentice',
                gameType: 'chess-speedrun',
                parentTIN: parent.tin
            });
            
            console.log(`✅ Child character created: ${child.name} (${child.tin})`);
            
            // Record an achievement
            await identitySystem.awardAchievement({
                tin: parent.tin,
                achievementType: 'speedrun_completion',
                achievementName: 'First Chess Victory',
                gameType: 'chess-speedrun',
                value: 1
            });
            
            // Record a death
            await identitySystem.recordDeath({
                tin: child.tin,
                gameType: 'chess-speedrun',
                cause: 'Timeout',
                level: 5,
                timeAlive: 300000, // 5 minutes
                location: 'Chess Arena'
            });
            
            // Get character stats
            const stats = await identitySystem.getCharacterStats(parent.tin);
            console.log(`📊 Parent stats:`, stats.stats.reputation);
            
            // Get leaderboard
            const leaderboard = await identitySystem.getLeaderboards('chess-speedrun', 'reputation');
            console.log(`🏆 Top characters:`, leaderboard.slice(0, 3));
            
        } catch (error) {
            console.error(`❌ Example failed:`, error.message);
        }
    }, 2000);
}