#!/usr/bin/env node

/**
 * 🏰 EMPIRE DATABASE MANAGER
 * Unified database abstraction layer for the entire empire gaming system
 * Handles entities, actions, content generation, gamepad combos, and LLM integration
 */

const { Pool } = require('pg');
const EventEmitter = require('events');
const crypto = require('crypto');

class EmpireDatabaseManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.version = '1.0.0';
        
        // Database connection
        this.pool = new Pool({
            host: config.host || process.env.POSTGRES_HOST || 'localhost',
            port: config.port || process.env.POSTGRES_PORT || 5432,
            database: config.database || process.env.POSTGRES_DB || 'empire_game_world',
            user: config.user || process.env.POSTGRES_USER || 'postgres',
            password: config.password || process.env.POSTGRES_PASSWORD || 'postgres',
            max: config.maxConnections || 20,
            idleTimeoutMillis: config.idleTimeout || 30000,
            connectionTimeoutMillis: config.connectionTimeout || 2000,
        });
        
        // Gaming elements
        this.gameElements = {
            entity: '🏰',
            action: '⚡',
            success: '✅',
            failure: '❌',
            level_up: '⬆️',
            achievement: '🏆',
            carrots: '🥕',
            health: '💚',
            death: '💀',
            respawn: '🔄'
        };
        
        // Cache for frequently accessed data
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 60000; // 1 minute
        
        console.log(`${this.gameElements.entity} Empire Database Manager v${this.version} initialized`);
        this.initializeDatabase();
    }
    
    async initializeDatabase() {
        try {
            // Test connection
            const client = await this.pool.connect();
            const result = await client.query('SELECT version()');
            console.log(`${this.gameElements.success} Connected to PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
            client.release();
            
            // Setup database listeners for real-time updates
            this.setupDatabaseListeners();
            
        } catch (error) {
            console.error(`${this.gameElements.failure} Database connection failed:`, error.message);
            throw error;
        }
    }
    
    async setupDatabaseListeners() {
        // Listen for entity changes
        const client = await this.pool.connect();
        
        client.query('LISTEN entity_updated');
        client.query('LISTEN action_logged');
        client.query('LISTEN achievement_unlocked');
        
        client.on('notification', (notification) => {
            const { channel, payload } = notification;
            
            try {
                const data = JSON.parse(payload || '{}');
                this.emit(channel, data);
                
                // Clear relevant cache entries
                this.invalidateCache(channel, data);
                
            } catch (error) {
                console.warn('Invalid notification payload:', payload);
            }
        });
        
        console.log(`${this.gameElements.entity} Database listeners activated`);
    }
    
    // ================================================
    // 🏰 ENTITY MANAGEMENT
    // ================================================
    
    async createEntity(entityData) {
        const client = await this.pool.connect();
        
        try {
            const {
                entity_type,
                name,
                display_name = name,
                current_zone = 'spawn',
                level = 1,
                health = 100.0,
                properties = {},
                capabilities = []
            } = entityData;
            
            const query = `
                INSERT INTO empire_entities (
                    entity_type, name, display_name, current_zone, 
                    level, health, properties, capabilities
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;
            
            const values = [
                entity_type, name, display_name, current_zone,
                level, health, JSON.stringify(properties), JSON.stringify(capabilities)
            ];
            
            const result = await client.query(query, values);
            const entity = result.rows[0];
            
            console.log(`${this.gameElements.entity} Entity created: ${entity.display_name} (${entity.id})`);
            
            // Log the creation action
            await this.logAction({
                actor_entity_id: entity.id,
                action_type: 'entity_created',
                action_data: { entity_type, initial_properties: properties },
                success: true,
                experience_gained: 10
            });
            
            this.emit('entity_created', entity);
            return entity;
            
        } finally {
            client.release();
        }
    }
    
    async getEntity(entityId) {
        // Check cache first
        const cacheKey = `entity:${entityId}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        const client = await this.pool.connect();
        
        try {
            const query = 'SELECT * FROM empire_entities WHERE id = $1';
            const result = await client.query(query, [entityId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const entity = result.rows[0];
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: entity,
                timestamp: Date.now()
            });
            
            return entity;
            
        } finally {
            client.release();
        }
    }
    
    async updateEntity(entityId, updates) {
        const client = await this.pool.connect();
        
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            
            // Build dynamic update query
            Object.entries(updates).forEach(([key, value]) => {
                setParts.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            });
            
            if (setParts.length === 0) {
                throw new Error('No updates provided');
            }
            
            // Always update the updated_at timestamp
            setParts.push(`updated_at = NOW()`);
            
            const query = `
                UPDATE empire_entities 
                SET ${setParts.join(', ')} 
                WHERE id = $${paramIndex} 
                RETURNING *
            `;
            
            values.push(entityId);
            
            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Entity ${entityId} not found`);
            }
            
            const entity = result.rows[0];
            
            // Clear cache
            this.cache.delete(`entity:${entityId}`);
            
            // Log the update action
            await this.logAction({
                actor_entity_id: entityId,
                action_type: 'entity_updated',
                action_data: { updates },
                success: true
            });
            
            this.emit('entity_updated', entity);
            return entity;
            
        } finally {
            client.release();
        }
    }
    
    async searchEntities(filters = {}) {
        const client = await this.pool.connect();
        
        try {
            let query = 'SELECT * FROM empire_entities WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            
            // Build dynamic WHERE clause
            if (filters.entity_type) {
                query += ` AND entity_type = $${paramIndex}`;
                values.push(filters.entity_type);
                paramIndex++;
            }
            
            if (filters.current_zone) {
                query += ` AND current_zone = $${paramIndex}`;
                values.push(filters.current_zone);
                paramIndex++;
            }
            
            if (filters.status) {
                query += ` AND status = $${paramIndex}`;
                values.push(filters.status);
                paramIndex++;
            }
            
            if (filters.min_level) {
                query += ` AND level >= $${paramIndex}`;
                values.push(filters.min_level);
                paramIndex++;
            }
            
            if (filters.name_search) {
                query += ` AND (name ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex})`;
                values.push(`%${filters.name_search}%`);
                paramIndex++;
            }
            
            // Add ordering
            query += ' ORDER BY ';
            if (filters.order_by) {
                query += `${filters.order_by} ${filters.order_direction || 'ASC'}`;
            } else {
                query += 'created_at DESC';
            }
            
            // Add limit
            if (filters.limit) {
                query += ` LIMIT $${paramIndex}`;
                values.push(filters.limit);
                paramIndex++;
            }
            
            const result = await client.query(query, values);
            return result.rows;
            
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // ⚡ ACTION LOGGING
    // ================================================
    
    async logAction(actionData) {
        const client = await this.pool.connect();
        
        try {
            const {
                actor_entity_id,
                action_type,
                target_entity_id = null,
                action_data = {},
                result = {},
                success = true,
                error_message = null,
                carrots_changed = 0,
                experience_gained = 0,
                achievements_unlocked = [],
                trigger_source = null,
                duration_ms = 0
            } = actionData;
            
            const query = `
                INSERT INTO empire_actions (
                    actor_entity_id, action_type, target_entity_id, action_data, result,
                    success, error_message, carrots_changed, experience_gained, 
                    achievements_unlocked, trigger_source, duration_ms
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
                RETURNING *
            `;
            
            const values = [
                actor_entity_id, action_type, target_entity_id,
                JSON.stringify(action_data), JSON.stringify(result),
                success, error_message, carrots_changed, experience_gained,
                JSON.stringify(achievements_unlocked), trigger_source, duration_ms
            ];
            
            const actionResult = await client.query(query, values);
            const action = actionResult.rows[0];
            
            console.log(`${this.gameElements.action} Action logged: ${action_type} by ${actor_entity_id}`);
            
            // Process achievements if any were unlocked
            for (const achievementCode of achievements_unlocked) {
                await this.unlockAchievement(actor_entity_id, achievementCode, action.id);
            }
            
            this.emit('action_logged', action);
            return action;
            
        } finally {
            client.release();
        }
    }
    
    async getActionHistory(entityId, options = {}) {
        const client = await this.pool.connect();
        
        try {
            const {
                action_type = null,
                limit = 100,
                offset = 0,
                include_targets = false
            } = options;
            
            let query = `
                SELECT a.*, 
                       e1.name as actor_name,
                       e1.display_name as actor_display_name
            `;
            
            if (include_targets) {
                query += `, e2.name as target_name, e2.display_name as target_display_name`;
            }
            
            query += `
                FROM empire_actions a
                JOIN empire_entities e1 ON a.actor_entity_id = e1.id
            `;
            
            if (include_targets) {
                query += ` LEFT JOIN empire_entities e2 ON a.target_entity_id = e2.id`;
            }
            
            query += ` WHERE a.actor_entity_id = $1`;
            
            const values = [entityId];
            let paramIndex = 2;
            
            if (action_type) {
                query += ` AND a.action_type = $${paramIndex}`;
                values.push(action_type);
                paramIndex++;
            }
            
            query += ` ORDER BY a.timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            values.push(limit, offset);
            
            const result = await client.query(query, values);
            return result.rows;
            
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // 🎁 CONTENT GENERATION
    // ================================================
    
    async requestContentGeneration(requestData) {
        const client = await this.pool.connect();
        
        try {
            const {
                requester_entity_id,
                generation_type,
                category = 'general',
                rarity = 'common',
                trigger_source,
                trigger_data = {},
                domain_context = null,
                combo_pattern = null,
                assigned_llm = 'ollama/codellama'
            } = requestData;
            
            const query = `
                INSERT INTO content_generations (
                    requester_entity_id, generation_type, category, rarity,
                    trigger_source, trigger_data, domain_context, combo_pattern, assigned_llm
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *
            `;
            
            const values = [
                requester_entity_id, generation_type, category, rarity,
                trigger_source, JSON.stringify(trigger_data), domain_context, combo_pattern, assigned_llm
            ];
            
            const result = await client.query(query, values);
            const generation = result.rows[0];
            
            console.log(`${this.gameElements.entity} Content generation requested: ${generation_type} (${generation.id})`);
            
            // Log the action
            await this.logAction({
                actor_entity_id: requester_entity_id,
                action_type: 'content_generation_requested',
                action_data: { generation_type, category, rarity, trigger_source },
                success: true,
                experience_gained: 5
            });
            
            this.emit('content_generation_requested', generation);
            return generation;
            
        } finally {
            client.release();
        }
    }
    
    async completeContentGeneration(generationId, completionData) {
        const client = await this.pool.connect();
        
        try {
            const {
                generated_content,
                content_quality_score = 0.5,
                processing_time_ms = 0,
                token_count = 0,
                cost_estimate = 0,
                carrots_rewarded = 0,
                status = 'completed'
            } = completionData;
            
            const query = `
                UPDATE content_generations 
                SET 
                    generated_content = $1,
                    content_quality_score = $2,
                    processing_time_ms = $3,
                    token_count = $4,
                    cost_estimate = $5,
                    carrots_rewarded = $6,
                    status = $7,
                    completed_at = NOW()
                WHERE id = $8 
                RETURNING *
            `;
            
            const values = [
                generated_content, content_quality_score, processing_time_ms,
                token_count, cost_estimate, carrots_rewarded, status, generationId
            ];
            
            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Content generation ${generationId} not found`);
            }
            
            const generation = result.rows[0];
            
            // Award carrots to the requester
            if (carrots_rewarded > 0) {
                await this.updateEntity(generation.requester_entity_id, {
                    carrots: `carrots + ${carrots_rewarded}`
                });
            }
            
            // Log completion action
            await this.logAction({
                actor_entity_id: generation.requester_entity_id,
                action_type: 'content_generation_completed',
                action_data: { 
                    generation_id: generationId,
                    quality_score: content_quality_score,
                    processing_time_ms 
                },
                success: true,
                carrots_changed: carrots_rewarded,
                experience_gained: Math.floor(content_quality_score * 50)
            });
            
            console.log(`${this.gameElements.success} Content generation completed: ${generationId}`);
            
            this.emit('content_generation_completed', generation);
            return generation;
            
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // 🎮 GAMEPAD COMBO SYSTEM
    // ================================================
    
    async executeGamepadCombo(executionData) {
        const client = await this.pool.connect();
        
        try {
            const {
                combo_name,
                executor_entity_id,
                timing_accuracy = 1.0,
                button_timings = {},
                success = true,
                action_result = {},
                rewards_earned = {},
                session_id = null,
                controller_type = 'xbox'
            } = executionData;
            
            // Get the combo definition
            const comboQuery = 'SELECT * FROM gamepad_combos WHERE combo_name = $1';
            const comboResult = await client.query(comboQuery, [combo_name]);
            
            if (comboResult.rows.length === 0) {
                throw new Error(`Gamepad combo '${combo_name}' not found`);
            }
            
            const combo = comboResult.rows[0];
            
            // Check requirements (level, achievements, cooldown)
            const executor = await this.getEntity(executor_entity_id);
            if (!executor) {
                throw new Error(`Executor entity ${executor_entity_id} not found`);
            }
            
            if (executor.level < combo.required_level) {
                throw new Error(`Executor level ${executor.level} insufficient (required: ${combo.required_level})`);
            }
            
            // Record the execution
            const executionQuery = `
                INSERT INTO gamepad_executions (
                    combo_id, executor_entity_id, timing_accuracy, button_timings,
                    success, action_result, rewards_earned, session_id, controller_type
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *
            `;
            
            const executionValues = [
                combo.id, executor_entity_id, timing_accuracy, JSON.stringify(button_timings),
                success, JSON.stringify(action_result), JSON.stringify(rewards_earned),
                session_id, controller_type
            ];
            
            const executionResult = await client.query(executionQuery, executionValues);
            const execution = executionResult.rows[0];
            
            // Update combo statistics
            await client.query(`
                UPDATE gamepad_combos 
                SET 
                    use_count = use_count + 1,
                    success_rate = (success_rate * use_count + $1::decimal) / (use_count + 1),
                    last_used = NOW()
                WHERE id = $2
            `, [success ? 1 : 0, combo.id]);
            
            // Calculate rewards
            let carrots_earned = success ? combo.carrots_reward : 0;
            let exp_earned = success ? combo.experience_reward : 0;
            
            // Accuracy bonus
            if (timing_accuracy > 0.9) {
                carrots_earned = Math.floor(carrots_earned * 1.2);
                exp_earned = Math.floor(exp_earned * 1.2);
            }
            
            // Log the combo execution action
            await this.logAction({
                actor_entity_id: executor_entity_id,
                action_type: 'gamepad_combo_executed',
                action_data: {
                    combo_name,
                    button_pattern: combo.button_pattern,
                    timing_accuracy,
                    controller_type
                },
                result: action_result,
                success,
                carrots_changed: carrots_earned,
                experience_gained: exp_earned,
                trigger_source: 'gamepad'
            });
            
            console.log(`${this.gameElements.action} Gamepad combo executed: ${combo_name} by ${executor.display_name}`);
            
            this.emit('gamepad_combo_executed', {
                execution,
                combo,
                executor,
                rewards: { carrots: carrots_earned, experience: exp_earned }
            });
            
            return {
                execution,
                combo,
                rewards: { carrots: carrots_earned, experience: exp_earned }
            };
            
        } finally {
            client.release();
        }
    }
    
    async registerGamepadCombo(comboData) {
        const client = await this.pool.connect();
        
        try {
            const {
                combo_name,
                button_pattern,
                action_type,
                action_parameters = {},
                required_level = 1,
                carrots_reward = 0,
                experience_reward = 0,
                rarity = 'common'
            } = comboData;
            
            const query = `
                INSERT INTO gamepad_combos (
                    combo_name, button_pattern, action_type, action_parameters,
                    required_level, carrots_reward, experience_reward, rarity
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;
            
            const values = [
                combo_name, JSON.stringify(button_pattern), action_type, JSON.stringify(action_parameters),
                required_level, carrots_reward, experience_reward, rarity
            ];
            
            const result = await client.query(query, values);
            const combo = result.rows[0];
            
            console.log(`${this.gameElements.entity} Gamepad combo registered: ${combo_name}`);
            
            this.emit('gamepad_combo_registered', combo);
            return combo;
            
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // 🏆 ACHIEVEMENT SYSTEM
    // ================================================
    
    async unlockAchievement(entityId, achievementCode, triggerActionId = null) {
        const client = await this.pool.connect();
        
        try {
            // Check if already unlocked
            const existingQuery = `
                SELECT * FROM user_achievements 
                WHERE entity_id = $1 AND achievement_id = (
                    SELECT id FROM achievements WHERE achievement_code = $2
                )
            `;
            
            const existing = await client.query(existingQuery, [entityId, achievementCode]);
            
            if (existing.rows.length > 0) {
                return existing.rows[0]; // Already unlocked
            }
            
            // Get achievement details
            const achievementQuery = 'SELECT * FROM achievements WHERE achievement_code = $1';
            const achievementResult = await client.query(achievementQuery, [achievementCode]);
            
            if (achievementResult.rows.length === 0) {
                throw new Error(`Achievement '${achievementCode}' not found`);
            }
            
            const achievement = achievementResult.rows[0];
            
            // Unlock the achievement
            const unlockQuery = `
                INSERT INTO user_achievements (
                    entity_id, achievement_id, unlock_method, trigger_action_id
                ) 
                VALUES ($1, $2, 'automatic', $3) 
                RETURNING *
            `;
            
            const unlockResult = await client.query(unlockQuery, [entityId, achievement.id, triggerActionId]);
            const unlock = unlockResult.rows[0];
            
            // Update achievement statistics
            await client.query(`
                UPDATE achievements 
                SET 
                    unlock_count = unlock_count + 1,
                    first_unlocked_by = COALESCE(first_unlocked_by, $2),
                    first_unlocked_at = COALESCE(first_unlocked_at, NOW())
                WHERE id = $1
            `, [achievement.id, entityId]);
            
            // Award rewards
            if (achievement.carrots_reward > 0 || achievement.experience_reward > 0) {
                await this.updateEntity(entityId, {
                    carrots: `carrots + ${achievement.carrots_reward}`,
                    experience: `experience + ${achievement.experience_reward}`
                });
            }
            
            console.log(`${this.gameElements.achievement} Achievement unlocked: ${achievement.name} by ${entityId}`);
            
            this.emit('achievement_unlocked', {
                unlock,
                achievement,
                entity_id: entityId
            });
            
            return unlock;
            
        } finally {
            client.release();
        }
    }
    
    async getUserAchievements(entityId) {
        const client = await this.pool.connect();
        
        try {
            const query = `
                SELECT 
                    ua.*,
                    a.achievement_code,
                    a.name,
                    a.description,
                    a.category,
                    a.points_value,
                    a.icon_emoji,
                    a.rarity
                FROM user_achievements ua
                JOIN achievements a ON ua.achievement_id = a.id
                WHERE ua.entity_id = $1
                ORDER BY ua.unlocked_at DESC
            `;
            
            const result = await client.query(query, [entityId]);
            return result.rows;
            
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // 📊 STATISTICS AND METRICS
    // ================================================
    
    async getEmpireStatistics() {
        const client = await this.pool.connect();
        
        try {
            const statsQuery = `
                SELECT 
                    COUNT(*) FILTER (WHERE entity_type = 'domain') as total_domains,
                    COUNT(*) FILTER (WHERE entity_type = 'service') as total_services,
                    COUNT(*) FILTER (WHERE entity_type = 'user') as total_users,
                    COUNT(*) FILTER (WHERE entity_type = 'npc') as total_npcs,
                    SUM(carrots) as total_carrots_circulation,
                    AVG(health) as average_entity_health,
                    COUNT(*) FILTER (WHERE status = 'active') as active_entities,
                    COUNT(*) FILTER (WHERE status = 'dead') as dead_entities,
                    COUNT(*) FILTER (WHERE level >= 10) as high_level_entities
                FROM empire_entities;
                
                SELECT COUNT(*) as total_actions FROM empire_actions;
                
                SELECT COUNT(*) as total_content_generations FROM content_generations;
                
                SELECT COUNT(*) as total_combo_executions FROM gamepad_executions;
                
                SELECT COUNT(*) as total_achievements_unlocked FROM user_achievements;
            `;
            
            const result = await client.query(statsQuery);
            
            // Combine all statistics
            const stats = {
                entities: result[0].rows[0],
                actions: result[1].rows[0].total_actions,
                content_generations: result[2].rows[0].total_content_generations,
                combo_executions: result[3].rows[0].total_combo_executions,
                achievements_unlocked: result[4].rows[0].total_achievements_unlocked,
                timestamp: new Date().toISOString()
            };
            
            return stats;
            
        } finally {
            client.release();
        }
    }
    
    async recordMetric(metricType, value, context = {}) {
        const client = await this.pool.connect();
        
        try {
            const query = `
                INSERT INTO empire_metrics (
                    metric_type, metric_value, measurement_context, aggregation_period
                ) 
                VALUES ($1, $2, $3, 'instant')
            `;
            
            await client.query(query, [metricType, value, JSON.stringify(context)]);
            
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // 🔧 UTILITY METHODS
    // ================================================
    
    invalidateCache(channel, data) {
        // Clear cache based on notification type
        switch (channel) {
            case 'entity_updated':
                if (data.entity_id) {
                    this.cache.delete(`entity:${data.entity_id}`);
                }
                break;
            
            case 'action_logged':
                // Clear action history cache if we had one
                break;
        }
    }
    
    async healthCheck() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT 1');
            client.release();
            
            return {
                status: 'healthy',
                database: 'connected',
                pool_size: this.pool.totalCount,
                idle_connections: this.pool.idleCount,
                cache_size: this.cache.size
            };
            
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    
    async close() {
        await this.pool.end();
        console.log(`${this.gameElements.entity} Empire Database Manager disconnected`);
    }
}

module.exports = EmpireDatabaseManager;

// CLI usage
if (require.main === module) {
    const db = new EmpireDatabaseManager();
    
    // Example usage
    const demo = async () => {
        try {
            console.log('🎮 Empire Database Manager Demo');
            
            // Create a test entity
            const entity = await db.createEntity({
                entity_type: 'user',
                name: 'test_player',
                display_name: 'Test Player',
                level: 5
            });
            
            // Log an action
            await db.logAction({
                actor_entity_id: entity.id,
                action_type: 'demo_action',
                action_data: { demo: true },
                success: true,
                carrots_changed: 10,
                experience_gained: 25
            });
            
            // Execute a gamepad combo
            await db.executeGamepadCombo({
                combo_name: 'content_gacha',
                executor_entity_id: entity.id,
                timing_accuracy: 0.95,
                success: true
            });
            
            // Get statistics
            const stats = await db.getEmpireStatistics();
            console.log('Empire Statistics:', stats);
            
            console.log('✅ Demo completed successfully');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        } finally {
            await db.close();
        }
    };
    
    demo();
}