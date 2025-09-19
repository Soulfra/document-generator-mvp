#!/usr/bin/env node

/**
 * 🗺️ ZONE DATABASE MANAGER
 * Simplified database manager focused on zone operations
 * High-performance zone lookups and navigation
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class ZoneDatabaseManager {
    constructor(config = {}) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 5432,
            database: config.database || 'empire_zones',
            user: config.user || 'postgres',
            password: config.password || 'postgres',
            max: config.max || 20,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000
        };
        
        this.pool = null;
        this.isInitialized = false;
        
        console.log('🗺️ Zone Database Manager created');
    }
    
    async initialize() {
        try {
            // Create connection pool
            this.pool = new Pool(this.config);
            
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.isInitialized = true;
            console.log(`✅ Connected to zone database: ${this.config.database}`);
            
            // Initialize schema if needed
            await this.ensureSchema();
            
        } catch (error) {
            console.error('❌ Failed to initialize zone database:', error.message);
            throw error;
        }
    }
    
    async ensureSchema() {
        try {
            // Check if zones table exists
            const result = await this.pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'zones'
                );
            `);
            
            if (!result.rows[0].exists) {
                console.log('🔧 Creating zone schema...');
                const schemaPath = path.join(__dirname, 'EMPIRE-SIMPLIFIED-SCHEMA.sql');
                const schema = await fs.readFile(schemaPath, 'utf8');
                
                // Execute schema (skip database creation commands)
                const schemaCommands = schema
                    .split(';')
                    .filter(cmd => cmd.trim())
                    .filter(cmd => !cmd.includes('CREATE DATABASE'))
                    .filter(cmd => !cmd.includes('\\c empire_zones'));
                
                for (const command of schemaCommands) {
                    if (command.trim()) {
                        await this.pool.query(command);
                    }
                }
                
                console.log('✅ Zone schema created successfully');
            }
        } catch (error) {
            console.warn('⚠️ Schema initialization warning:', error.message);
        }
    }
    
    // ================================================
    // 🎯 ZONE OPERATIONS
    // ================================================
    
    async getAllZones() {
        const result = await this.pool.query(`
            SELECT 
                id, name, description, emoji, zone_type, color,
                actions, content_types, voice_prompts,
                domain_count, total_visits, active_entities,
                created_at, updated_at
            FROM zones 
            ORDER BY name
        `);
        
        return result.rows.map(zone => ({
            ...zone,
            actions: JSON.parse(zone.actions || '[]'),
            content_types: JSON.parse(zone.content_types || '[]'),
            voice_prompts: JSON.parse(zone.voice_prompts || '[]')
        }));
    }
    
    async getZone(zoneId) {
        const result = await this.pool.query(`
            SELECT 
                id, name, description, emoji, zone_type, color,
                actions, content_types, voice_prompts,
                domain_count, total_visits, active_entities,
                created_at, updated_at
            FROM zones 
            WHERE id = $1
        `, [zoneId]);
        
        if (result.rows.length === 0) return null;
        
        const zone = result.rows[0];
        return {
            ...zone,
            actions: JSON.parse(zone.actions || '[]'),
            content_types: JSON.parse(zone.content_types || '[]'),
            voice_prompts: JSON.parse(zone.voice_prompts || '[]')
        };
    }
    
    async getZoneByDomain(domain) {
        // Clean domain for lookup
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '').toLowerCase();
        
        const result = await this.pool.query(`
            SELECT z.*
            FROM zones z
            JOIN zone_domains zd ON z.id = zd.zone_id
            WHERE LOWER(zd.domain) LIKE $1 OR $1 LIKE LOWER(zd.domain)
            ORDER BY zd.confidence DESC
            LIMIT 1
        `, [`%${cleanDomain}%`]);
        
        if (result.rows.length === 0) {
            // Return mystery zone as fallback
            return this.getZone('mystery_zone');
        }
        
        const zone = result.rows[0];
        return {
            ...zone,
            actions: JSON.parse(zone.actions || '[]'),
            content_types: JSON.parse(zone.content_types || '[]'),
            voice_prompts: JSON.parse(zone.voice_prompts || '[]')
        };
    }
    
    async getZoneDomains(zoneId) {
        const result = await this.pool.query(`
            SELECT 
                id, domain, confidence, source, status,
                zone_role, zone_priority, visit_count,
                last_visited, discovered_at, updated_at
            FROM zone_domains 
            WHERE zone_id = $1 
            ORDER BY zone_priority ASC, confidence DESC
        `, [zoneId]);
        
        return result.rows;
    }
    
    async addDomainToZone(domain, zoneId, options = {}) {
        const {
            confidence = 1.0,
            source = 'manual',
            status = 'active',
            zone_role = 'member',
            zone_priority = 5
        } = options;
        
        const result = await this.pool.query(`
            INSERT INTO zone_domains (
                domain, zone_id, confidence, source, status,
                zone_role, zone_priority
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (domain) DO UPDATE SET
                zone_id = $2,
                confidence = $3,
                source = $4,
                status = $5,
                zone_role = $6,
                zone_priority = $7,
                updated_at = NOW()
            RETURNING *
        `, [domain, zoneId, confidence, source, status, zone_role, zone_priority]);
        
        return result.rows[0];
    }
    
    async bulkLoadDomains(domainMappings) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            for (const mapping of domainMappings) {
                await client.query(`
                    INSERT INTO zone_domains (
                        domain, zone_id, confidence, source, status
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (domain) DO UPDATE SET
                        zone_id = $2,
                        confidence = $3,
                        source = $4,
                        updated_at = NOW()
                `, [
                    mapping.domain,
                    mapping.zone_id,
                    mapping.confidence || 1.0,
                    mapping.source || 'zone_mapper',
                    mapping.status || 'active'
                ]);
            }
            
            await client.query('COMMIT');
            console.log(`✅ Bulk loaded ${domainMappings.length} domain mappings`);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    // ================================================
    // 👤 ENTITY OPERATIONS
    // ================================================
    
    async createEntity(entityData) {
        const {
            name,
            entity_type,
            current_zone = 'spawn',
            level = 1
        } = entityData;
        
        const result = await this.pool.query(`
            INSERT INTO entities (name, entity_type, current_zone, level)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [name, entity_type, current_zone, level]);
        
        return result.rows[0];
    }
    
    async getEntity(entityId) {
        const result = await this.pool.query(`
            SELECT 
                e.*,
                z.name as zone_name,
                z.emoji as zone_emoji
            FROM entities e
            JOIN zones z ON e.current_zone = z.id
            WHERE e.id = $1
        `, [entityId]);
        
        if (result.rows.length === 0) return null;
        
        const entity = result.rows[0];
        return {
            ...entity,
            zone_history: JSON.parse(entity.zone_history || '[]'),
            favorite_zones: JSON.parse(entity.favorite_zones || '[]'),
            zone_permissions: JSON.parse(entity.zone_permissions || '[]')
        };
    }
    
    async moveEntityToZone(entityId, zoneId) {
        const result = await this.pool.query(`
            UPDATE entities 
            SET 
                current_zone = $2,
                zone_history = (
                    COALESCE(zone_history, '[]'::jsonb) || 
                    jsonb_build_array(jsonb_build_object(
                        'zone', $2,
                        'timestamp', NOW()
                    ))
                ),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [entityId, zoneId]);
        
        if (result.rows.length > 0) {
            // Update zone active entity count
            await this.updateZoneEntityCount(zoneId);
        }
        
        return result.rows[0];
    }
    
    async updateZoneEntityCount(zoneId) {
        await this.pool.query(`
            UPDATE zones 
            SET 
                active_entities = (
                    SELECT COUNT(*) 
                    FROM entities 
                    WHERE current_zone = $1
                ),
                updated_at = NOW()
            WHERE id = $1
        `, [zoneId]);
    }
    
    // ================================================
    // 🎬 ACTION LOGGING
    // ================================================
    
    async logAction(actionData) {
        const {
            entity_id,
            zone_id,
            action_type,
            action_name,
            command_text,
            result_summary,
            trigger_source = 'unknown',
            session_id,
            user_agent,
            success = true,
            points_awarded = 0,
            experience_gained = 0,
            duration_ms = 0
        } = actionData;
        
        const result = await this.pool.query(`
            INSERT INTO zone_actions (
                entity_id, zone_id, action_type, action_name,
                command_text, result_summary, trigger_source,
                session_id, user_agent, success,
                points_awarded, experience_gained, duration_ms
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            entity_id, zone_id, action_type, action_name,
            command_text, result_summary, trigger_source,
            session_id, user_agent, success,
            points_awarded, experience_gained, duration_ms
        ]);
        
        return result.rows[0];
    }
    
    async logVoiceCommand(commandData) {
        const {
            entity_id,
            zone_id,
            command_text,
            intent,
            confidence,
            voice_verified = false,
            audio_fingerprint,
            response_text,
            action_taken,
            zone_changed,
            success = true,
            error_message
        } = commandData;
        
        const result = await this.pool.query(`
            INSERT INTO voice_commands (
                entity_id, zone_id, command_text, intent, confidence,
                voice_verified, audio_fingerprint, response_text,
                action_taken, zone_changed, success, error_message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            entity_id, zone_id, command_text, intent, confidence,
            voice_verified, audio_fingerprint, response_text,
            action_taken, zone_changed, success, error_message
        ]);
        
        return result.rows[0];
    }
    
    // ================================================
    // 🎨 CONTENT OPERATIONS
    // ================================================
    
    async createZoneContent(contentData) {
        const {
            zone_id,
            entity_id,
            content_type,
            title,
            content,
            trigger_command,
            generation_prompt,
            ai_model,
            quality_score
        } = contentData;
        
        const result = await this.pool.query(`
            INSERT INTO zone_content (
                zone_id, entity_id, content_type, title, content,
                trigger_command, generation_prompt, ai_model, quality_score
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            zone_id, entity_id, content_type, title, content,
            trigger_command, generation_prompt, ai_model, quality_score
        ]);
        
        return result.rows[0];
    }
    
    async getZoneContent(zoneId, limit = 10) {
        const result = await this.pool.query(`
            SELECT 
                zc.*,
                e.name as creator_name
            FROM zone_content zc
            LEFT JOIN entities e ON zc.entity_id = e.id
            WHERE zc.zone_id = $1 AND zc.status = 'active'
            ORDER BY zc.generated_at DESC
            LIMIT $2
        `, [zoneId, limit]);
        
        return result.rows;
    }
    
    // ================================================
    // 📊 ANALYTICS
    // ================================================
    
    async getZoneOverview() {
        const result = await this.pool.query(`
            SELECT * FROM zone_overview
        `);
        
        return result.rows;
    }
    
    async getEntityZoneSummary() {
        const result = await this.pool.query(`
            SELECT * FROM entity_zone_summary
        `);
        
        return result.rows;
    }
    
    async getZoneMetrics(zoneId, metricType = null, period = '1hour') {
        let query = `
            SELECT 
                metric_type,
                SUM(value) as total_value,
                AVG(value) as avg_value,
                COUNT(*) as measurement_count
            FROM zone_metrics 
            WHERE zone_id = $1
        `;
        
        const params = [zoneId];
        
        if (metricType) {
            query += ` AND metric_type = $2`;
            params.push(metricType);
        }
        
        if (period) {
            const interval = period === '1hour' ? '1 hour' : 
                           period === '1day' ? '1 day' : '1 hour';
            query += ` AND recorded_at > NOW() - INTERVAL '${interval}'`;
        }
        
        query += ` GROUP BY metric_type ORDER BY metric_type`;
        
        const result = await this.pool.query(query, params);
        return result.rows;
    }
    
    async recordZoneMetric(zoneId, metricType, value, period = 'instant') {
        await this.pool.query(`
            INSERT INTO zone_metrics (zone_id, metric_type, value, period)
            VALUES ($1, $2, $3, $4)
        `, [zoneId, metricType, value, period]);
    }
    
    // ================================================
    // 🔄 UTILITY FUNCTIONS
    // ================================================
    
    async getTopActiveZones(limit = 5) {
        const result = await this.pool.query(`
            SELECT 
                z.*,
                COALESCE(za.recent_actions, 0) as recent_actions
            FROM zones z
            LEFT JOIN (
                SELECT 
                    zone_id,
                    COUNT(*) as recent_actions
                FROM zone_actions 
                WHERE timestamp > NOW() - INTERVAL '1 hour'
                GROUP BY zone_id
            ) za ON z.id = za.zone_id
            ORDER BY za.recent_actions DESC, z.total_visits DESC
            LIMIT $1
        `, [limit]);
        
        return result.rows;
    }
    
    async searchZones(query) {
        const result = await this.pool.query(`
            SELECT 
                z.*,
                (
                    CASE 
                        WHEN LOWER(z.name) LIKE LOWER($1) THEN 3
                        WHEN LOWER(z.description) LIKE LOWER($1) THEN 2
                        WHEN LOWER(z.zone_type) LIKE LOWER($1) THEN 1
                        ELSE 0
                    END
                ) as relevance_score
            FROM zones z
            WHERE 
                LOWER(z.name) LIKE LOWER($1) OR
                LOWER(z.description) LIKE LOWER($1) OR
                LOWER(z.zone_type) LIKE LOWER($1)
            ORDER BY relevance_score DESC, z.name
        `, [`%${query}%`]);
        
        return result.rows;
    }
    
    async getHealthStatus() {
        const result = await this.pool.query(`
            SELECT 
                'zones' as component,
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE domain_count > 0) as active_count
            FROM zones
            
            UNION ALL
            
            SELECT 
                'domains' as component,
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE status = 'active') as active_count
            FROM zone_domains
            
            UNION ALL
            
            SELECT 
                'entities' as component,
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE last_action > NOW() - INTERVAL '1 day') as active_count
            FROM entities
        `);
        
        const healthData = {};
        result.rows.forEach(row => {
            healthData[row.component] = {
                total: parseInt(row.total_count),
                active: parseInt(row.active_count)
            };
        });
        
        return healthData;
    }
    
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Zone database connection closed');
        }
    }
}

module.exports = ZoneDatabaseManager;

// CLI usage
if (require.main === module) {
    async function testZoneDatabase() {
        const dbManager = new ZoneDatabaseManager();
        
        try {
            await dbManager.initialize();
            
            console.log('\n🧪 Testing Zone Database Manager...\n');
            
            // Test zone operations
            console.log('🎯 Testing zone operations:');
            const zones = await dbManager.getAllZones();
            console.log(`Found ${zones.length} zones`);
            
            // Test domain lookup
            console.log('\n🌐 Testing domain lookup:');
            const zone = await dbManager.getZoneByDomain('localhost:8080');
            console.log(`localhost:8080 → ${zone?.name || 'Not found'}`);
            
            // Test health status
            console.log('\n📊 Testing health status:');
            const health = await dbManager.getHealthStatus();
            console.log('Health:', health);
            
            console.log('\n✅ Zone Database Manager test complete');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            await dbManager.close();
        }
    }
    
    testZoneDatabase().catch(console.error);
}