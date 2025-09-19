#!/usr/bin/env node

/**
 * 🎮 GAME PERSISTENCE SERVICE
 * 
 * Handles saving and loading game state to/from PostgreSQL database
 * Tracks player progress, world modifications, and AI behavior
 */

const { Pool } = require('pg');
const EventEmitter = require('events');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class GamePersistenceService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Database configuration
        this.pool = new Pool({
            connectionString: config.databaseUrl || process.env.DATABASE_URL || 
                'postgresql://postgres:postgres@localhost:5432/document_generator',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        // Auto-save configuration
        this.autoSaveInterval = config.autoSaveInterval || 30000; // 30 seconds
        this.autoSaveTimer = null;
        
        // Cache for frequently accessed data
        this.cache = {
            sessions: new Map(),
            players: new Map(),
            agents: new Map()
        };
        
        // Performance tracking
        this.stats = {
            saves: 0,
            loads: 0,
            errors: 0,
            avgSaveTime: 0,
            avgLoadTime: 0
        };
    }
    
    /**
     * Initialize the service
     */
    async init() {
        console.log('🎮 Initializing Game Persistence Service...');
        
        try {
            // Test database connection
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            
            console.log('✅ Database connection established');
            
            // Load active sessions into cache
            await this.loadActiveSessions();
            
            console.log('✅ Game Persistence Service initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize persistence service:', error);
            throw error;
        }
    }
    
    /**
     * Create a new game session
     */
    async createGameSession(options = {}) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                INSERT INTO game_sessions (session_name, game_mode, world_seed, metadata)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [
                options.sessionName || 'New Game',
                options.gameMode || 'survival',
                options.worldSeed || Math.floor(Math.random() * 1000000),
                JSON.stringify(options.metadata || {})
            ]);
            
            const session = result.rows[0];
            this.cache.sessions.set(session.id, session);
            
            console.log(`📝 Created game session: ${session.id}`);
            this.emit('session-created', session);
            
            return session;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get or create player
     */
    async getOrCreatePlayer(username, displayName) {
        const client = await this.pool.connect();
        
        try {
            // Try to get existing player
            let result = await client.query(
                'SELECT * FROM players WHERE username = $1',
                [username]
            );
            
            if (result.rows.length > 0) {
                // Update last login
                await client.query(
                    'UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [result.rows[0].id]
                );
                return result.rows[0];
            }
            
            // Create new player
            result = await client.query(`
                INSERT INTO players (username, display_name)
                VALUES ($1, $2)
                RETURNING *
            `, [username, displayName || username]);
            
            const player = result.rows[0];
            this.cache.players.set(player.id, player);
            
            console.log(`👤 Created player: ${player.username}`);
            this.emit('player-created', player);
            
            return player;
        } finally {
            client.release();
        }
    }
    
    /**
     * Save player progress
     */
    async savePlayerProgress(playerId, sessionId, progressData) {
        const startTime = Date.now();
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO player_progress 
                (player_id, session_id, position, rotation, health, hunger, 
                 experience, level, inventory, hotbar, achievements, stats)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (player_id, session_id)
                DO UPDATE SET
                    position = $3,
                    rotation = $4,
                    health = $5,
                    hunger = $6,
                    experience = $7,
                    level = $8,
                    inventory = $9,
                    hotbar = $10,
                    achievements = $11,
                    stats = $12,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                playerId,
                sessionId,
                JSON.stringify(progressData.position),
                JSON.stringify(progressData.rotation),
                progressData.health,
                progressData.hunger,
                progressData.experience,
                progressData.level,
                JSON.stringify(progressData.inventory),
                JSON.stringify(progressData.hotbar),
                JSON.stringify(progressData.achievements || []),
                JSON.stringify(progressData.stats || {})
            ]);
            
            // Update session last saved time
            await client.query(
                'UPDATE game_sessions SET last_saved = CURRENT_TIMESTAMP WHERE id = $1',
                [sessionId]
            );
            
            const saveTime = Date.now() - startTime;
            this.updateStats('save', saveTime);
            
            this.emit('progress-saved', { playerId, sessionId, saveTime });
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Load player progress
     */
    async loadPlayerProgress(playerId, sessionId) {
        const startTime = Date.now();
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                SELECT * FROM player_progress 
                WHERE player_id = $1 AND session_id = $2
            `, [playerId, sessionId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const loadTime = Date.now() - startTime;
            this.updateStats('load', loadTime);
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }
    
    /**
     * Save world chunk
     */
    async saveWorldChunk(sessionId, chunkX, chunkZ, chunkData) {
        const client = await this.pool.connect();
        
        try {
            // Compress chunk data
            const compressedData = await gzip(JSON.stringify(chunkData));
            
            await client.query(`
                INSERT INTO world_chunks (session_id, chunk_x, chunk_z, chunk_data)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (session_id, chunk_x, chunk_z)
                DO UPDATE SET
                    chunk_data = $4,
                    last_modified = CURRENT_TIMESTAMP,
                    version = world_chunks.version + 1
            `, [sessionId, chunkX, chunkZ, compressedData]);
            
            this.emit('chunk-saved', { sessionId, chunkX, chunkZ });
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Load world chunk
     */
    async loadWorldChunk(sessionId, chunkX, chunkZ) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                SELECT chunk_data FROM world_chunks
                WHERE session_id = $1 AND chunk_x = $2 AND chunk_z = $3
            `, [sessionId, chunkX, chunkZ]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            // Decompress chunk data
            const decompressed = await gunzip(result.rows[0].chunk_data);
            return JSON.parse(decompressed.toString());
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Log block modification
     */
    async logBlockModification(sessionId, playerId, x, y, z, oldBlock, newBlock, action) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO block_modifications 
                (session_id, player_id, world_x, world_y, world_z, 
                 old_block_type, new_block_type, action)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [sessionId, playerId, x, y, z, oldBlock, newBlock, action]);
            
            this.emit('block-modified', { sessionId, playerId, x, y, z, action });
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Save AI agent state
     */
    async saveAIAgent(agent) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                INSERT INTO ai_agents 
                (id, session_id, agent_name, agent_type, personality, position, 
                 rotation, current_behavior, current_goal, inventory, skills, 
                 relationships, health, energy)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id)
                DO UPDATE SET
                    position = $6,
                    rotation = $7,
                    current_behavior = $8,
                    current_goal = $9,
                    inventory = $10,
                    skills = $11,
                    relationships = $12,
                    health = $13,
                    energy = $14,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `, [
                agent.id,
                agent.sessionId,
                agent.name,
                agent.type || 'npc',
                agent.personality?.type || 'friendly',
                JSON.stringify(agent.position),
                JSON.stringify(agent.rotation),
                agent.currentBehavior,
                JSON.stringify(agent.currentGoal),
                JSON.stringify(agent.inventory || []),
                JSON.stringify(agent.skills || {}),
                JSON.stringify(agent.relationships || {}),
                agent.health || 100,
                agent.energy || 100
            ]);
            
            this.cache.agents.set(agent.id, result.rows[0]);
            this.emit('agent-saved', agent);
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Log AI behavior
     */
    async logAIBehavior(agentId, sessionId, behaviorType, action, details, position) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO ai_behavior_logs 
                (agent_id, session_id, behavior_type, action, details, position)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                agentId,
                sessionId,
                behaviorType,
                action,
                JSON.stringify(details || {}),
                JSON.stringify(position)
            ]);
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Save AI conversation
     */
    async saveAIConversation(sessionId, agent1Id, agent2Id, playerId, message, emotion, context) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO ai_conversations 
                (session_id, agent1_id, agent2_id, player_id, message, emotion, context)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                sessionId,
                agent1Id,
                agent2Id,
                playerId,
                message,
                emotion,
                JSON.stringify(context || {})
            ]);
            
            this.emit('conversation-saved', { sessionId, message });
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Log chat message
     */
    async logChatMessage(sessionId, playerId, messageType, message, metadata) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO chat_logs 
                (session_id, player_id, message_type, message, metadata)
                VALUES ($1, $2, $3, $4, $5)
            `, [sessionId, playerId, messageType, message, JSON.stringify(metadata || {})]);
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Log game event
     */
    async logGameEvent(sessionId, playerId, eventType, eventData) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO game_events 
                (session_id, player_id, event_type, event_data)
                VALUES ($1, $2, $3, $4)
            `, [sessionId, playerId, eventType, JSON.stringify(eventData)]);
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Log performance metric
     */
    async logPerformanceMetric(sessionId, metricType, value, metadata) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                INSERT INTO performance_metrics 
                (session_id, metric_type, value, metadata)
                VALUES ($1, $2, $3, $4)
            `, [sessionId, metricType, value, JSON.stringify(metadata || {})]);
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Get active game statistics
     */
    async getActiveGameStats() {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query('SELECT * FROM active_game_stats');
            return result.rows;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get AI behavior summary
     */
    async getAIBehaviorSummary() {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query('SELECT * FROM ai_behavior_summary');
            return result.rows;
        } finally {
            client.release();
        }
    }
    
    /**
     * Load active sessions into cache
     */
    async loadActiveSessions() {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM game_sessions WHERE is_active = true'
            );
            
            result.rows.forEach(session => {
                this.cache.sessions.set(session.id, session);
            });
            
            console.log(`📂 Loaded ${result.rows.length} active sessions`);
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Start auto-save timer
     */
    startAutoSave(gameEngine) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(async () => {
            try {
                await this.performAutoSave(gameEngine);
            } catch (error) {
                console.error('Auto-save error:', error);
                this.stats.errors++;
            }
        }, this.autoSaveInterval);
        
        console.log(`⏰ Auto-save started (every ${this.autoSaveInterval / 1000}s)`);
    }
    
    /**
     * Perform auto-save
     */
    async performAutoSave(gameEngine) {
        const startTime = Date.now();
        
        // Save player progress
        if (gameEngine.player && gameEngine.currentSession) {
            await this.savePlayerProgress(
                gameEngine.player.id,
                gameEngine.currentSession.id,
                gameEngine.player.getProgressData()
            );
        }
        
        // Save modified chunks
        if (gameEngine.world && gameEngine.modifiedChunks) {
            for (const chunkKey of gameEngine.modifiedChunks) {
                const [x, z] = chunkKey.split(',').map(Number);
                const chunk = gameEngine.world.getChunk(x, z);
                if (chunk) {
                    await this.saveWorldChunk(
                        gameEngine.currentSession.id,
                        x, z,
                        chunk.serialize()
                    );
                }
            }
            gameEngine.modifiedChunks.clear();
        }
        
        // Save AI agents
        if (gameEngine.aiAgents) {
            for (const agent of gameEngine.aiAgents.values()) {
                await this.saveAIAgent(agent);
            }
        }
        
        const saveTime = Date.now() - startTime;
        console.log(`💾 Auto-save complete (${saveTime}ms)`);
        
        this.emit('auto-save-complete', { saveTime });
    }
    
    /**
     * Update statistics
     */
    updateStats(operation, time) {
        if (operation === 'save') {
            this.stats.saves++;
            this.stats.avgSaveTime = 
                (this.stats.avgSaveTime * (this.stats.saves - 1) + time) / this.stats.saves;
        } else if (operation === 'load') {
            this.stats.loads++;
            this.stats.avgLoadTime = 
                (this.stats.avgLoadTime * (this.stats.loads - 1) + time) / this.stats.loads;
        }
    }
    
    /**
     * Cleanup and close connections
     */
    async cleanup() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        await this.pool.end();
        console.log('🔚 Game Persistence Service shut down');
    }
}

// Export for use in games
module.exports = GamePersistenceService;

// Example usage
if (require.main === module) {
    const service = new GamePersistenceService();
    
    service.init().then(async () => {
        console.log('🎮 Game Persistence Service Test');
        console.log('================================');
        
        // Create test session
        const session = await service.createGameSession({
            sessionName: 'Test World',
            gameMode: 'survival',
            metadata: { difficulty: 'normal' }
        });
        
        console.log('Created session:', session.id);
        
        // Get stats
        const stats = await service.getActiveGameStats();
        console.log('Active games:', stats);
        
        // Cleanup
        await service.cleanup();
    }).catch(console.error);
}