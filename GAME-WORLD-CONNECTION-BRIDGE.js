#!/usr/bin/env node

/**
 * 🌐 GAME WORLD CONNECTION BRIDGE
 * 
 * Connects all existing systems into the unified game world
 * Services are NPCs, templates are items, everything logs to forums
 */

const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');

class GameWorldBridge extends EventEmitter {
    constructor() {
        super();
        
        console.log('🌐 GAME WORLD CONNECTION BRIDGE');
        console.log('================================');
        console.log('Unifying all realities into one game world...');
        console.log('');
        
        this.connections = {
            gameWorld: null,      // Unified game world DB
            rlEnvironment: null,  // RL metrics DB
            forumDB: null,        // phpBB/vBulletin DB
            grantDB: null         // Soulfra grants DB
        };
        
        // Entity cache with Discord-style IDs
        this.entities = new Map();
    }
    
    async initialize() {
        console.log('🚀 Initializing Game World Bridge...\n');
        
        try {
            // Connect to all databases
            await this.connectDatabases();
            
            // Register existing services as NPCs
            await this.registerExistingServices();
            
            // Import templates as items
            await this.importTemplatesAsItems();
            
            // Setup forum integration
            await this.setupForumIntegration();
            
            // Start RL synchronization
            await this.startRLSync();
            
            console.log('✅ Game World Bridge initialized!');
            console.log('🎮 All systems now exist in one unified reality');
            
        } catch (error) {
            console.error('❌ Bridge initialization failed:', error);
            throw error;
        }
    }
    
    async connectDatabases() {
        console.log('📊 Connecting to all database layers...');
        
        // Game World (new unified DB)
        this.connections.gameWorld = await mysql.createConnection({
            host: 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'game_world'
        });
        
        // RL Environment
        this.connections.rlEnvironment = await mysql.createConnection({
            host: 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'economic_engine' // Your RL database
        });
        
        // Forum Database (phpBB/vBulletin)
        this.connections.forumDB = await mysql.createConnection({
            host: 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.FORUM_DB || 'phpbb'
        });
        
        // Grant Database
        this.connections.grantDB = await mysql.createConnection({
            host: 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'soulfra_grants'
        });
        
        console.log('✅ All databases connected');
    }
    
    async registerExistingServices() {
        console.log('\n🤖 Registering existing services as NPCs...');
        
        // Map of known services to register
        const services = [
            // Document Generator services
            { name: 'Template Processor', port: 3000, type: 'mcp' },
            { name: 'AI API Service', port: 3001, type: 'ai' },
            { name: 'Analytics Service', port: 3002, type: 'analytics' },
            { name: 'Platform Hub', port: 8080, type: 'hub' },
            { name: 'WebSocket Server', port: 8081, type: 'websocket' },
            
            // Gaming services
            { name: 'Master Gaming Platform', port: 8800, type: 'gaming' },
            { name: 'Gacha Token System', port: 7300, type: 'gaming' },
            { name: 'Persistent Tycoon', port: 7090, type: 'gaming' },
            
            // Business services
            { name: 'Business Accounting', port: 3013, type: 'business' },
            { name: 'Tax Intelligence', port: 3014, type: 'business' },
            { name: 'QR Handshake Tracker', port: 7777, type: 'business' }
        ];
        
        for (const service of services) {
            const entityId = await this.registerEntity(service.name, 'service', {
                port: service.port,
                service_type: service.type,
                endpoint_url: `http://localhost:${service.port}`,
                auto_registered: true
            });
            
            console.log(`   ✅ ${service.name} → ${entityId}`);
            
            // Also register in NPC registry
            await this.connections.gameWorld.execute(
                `INSERT INTO npc_registry (entity_id, service_type, port, endpoint_url, capabilities)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE port = VALUES(port)`,
                [entityId, service.type, service.port, `http://localhost:${service.port}`,
                 JSON.stringify({ type: service.type, auto_discovered: true })]
            );
        }
    }
    
    async registerEntity(displayName, entityType, properties = {}) {
        // Generate Discord-style ID
        const internalName = displayName.toLowerCase().replace(/\s+/g, '_');
        const discriminator = '#' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const entityId = `${internalName}${discriminator}`;
        
        // Check if already exists
        const [existing] = await this.connections.gameWorld.execute(
            'SELECT id FROM universal_entities WHERE internal_name = ? LIMIT 1',
            [internalName]
        );
        
        if (existing.length > 0) {
            return existing[0].id;
        }
        
        // Register new entity
        await this.connections.gameWorld.execute(
            `INSERT INTO universal_entities 
             (id, entity_type, display_name, internal_name, discriminator, properties)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [entityId, entityType, displayName, internalName, discriminator, JSON.stringify(properties)]
        );
        
        this.entities.set(entityId, {
            displayName,
            entityType,
            properties
        });
        
        return entityId;
    }
    
    async importTemplatesAsItems() {
        console.log('\n📄 Importing grant templates as game items...');
        
        // Get templates from grant database
        const [templates] = await this.connections.grantDB.execute(
            'SELECT * FROM application_templates WHERE is_active = true'
        );
        
        for (const template of templates) {
            const entityId = await this.registerEntity(
                template.template_name,
                'template',
                {
                    grant_type: template.grant_type,
                    original_id: template.id
                }
            );
            
            // Add to item registry
            await this.connections.gameWorld.execute(
                `INSERT INTO item_registry 
                 (entity_id, item_type, base_value, quality_score, template_data, success_rate)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE success_rate = VALUES(success_rate)`,
                [entityId, 'grant_template', 100, 75, 
                 JSON.stringify(template.template_sections),
                 template.success_rate || 0.5]
            );
            
            console.log(`   ✅ ${template.template_name} → ${entityId}`);
        }
    }
    
    async setupForumIntegration() {
        console.log('\n💬 Setting up forum integration...');
        
        // Create forum users for NPCs if they don't exist
        const [npcs] = await this.connections.gameWorld.execute(
            `SELECT ue.id, ue.display_name, nr.forum_user_id
             FROM universal_entities ue
             LEFT JOIN npc_registry nr ON ue.id = nr.entity_id
             WHERE ue.entity_type IN ('npc', 'service')`
        );
        
        for (const npc of npcs) {
            if (!npc.forum_user_id) {
                // Create forum user for this NPC
                const username = npc.id.replace('#', '_'); // Forums don't like # in usernames
                const password = require('crypto').randomBytes(32).toString('hex');
                
                try {
                    await this.connections.forumDB.execute(
                        `INSERT INTO phpbb_users 
                         (username, username_clean, user_password, user_email, group_id, user_type)
                         VALUES (?, ?, ?, ?, 2, 0)`,
                        [username, username.toLowerCase(), 
                         require('crypto').createHash('md5').update(password).digest('hex'),
                         `${username}@gameworld.local`]
                    );
                    
                    const [result] = await this.connections.forumDB.execute(
                        'SELECT user_id FROM phpbb_users WHERE username = ?',
                        [username]
                    );
                    
                    if (result.length > 0) {
                        // Update NPC registry with forum user ID
                        await this.connections.gameWorld.execute(
                            'UPDATE npc_registry SET forum_user_id = ? WHERE entity_id = ?',
                            [result[0].user_id, npc.id]
                        );
                        
                        console.log(`   ✅ Forum user created for ${npc.display_name}`);
                    }
                } catch (error) {
                    console.log(`   ⚠️  Forum user already exists for ${npc.display_name}`);
                }
            }
        }
    }
    
    async startRLSync() {
        console.log('\n🧠 Starting RL environment synchronization...');
        
        // Sync RL metrics to entity health
        setInterval(async () => {
            try {
                // Get recent RL metrics
                const [metrics] = await this.connections.rlEnvironment.execute(
                    `SELECT system_name, AVG(health_score) as avg_health, 
                            AVG(performance_score) as avg_performance,
                            SUM(carrots) as total_carrots
                     FROM rl_metrics
                     WHERE recorded_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                     GROUP BY system_name`
                );
                
                for (const metric of metrics) {
                    // Find corresponding entity
                    const [entities] = await this.connections.gameWorld.execute(
                        'SELECT id FROM universal_entities WHERE internal_name = ?',
                        [metric.system_name.toLowerCase().replace(/\s+/g, '_')]
                    );
                    
                    if (entities.length > 0) {
                        // Update entity health and carrots
                        await this.connections.gameWorld.execute(
                            `UPDATE universal_entities 
                             SET health = ?, carrots = carrots + ?
                             WHERE id = ?`,
                            [metric.avg_health * 100, metric.total_carrots || 0, entities[0].id]
                        );
                    }
                }
            } catch (error) {
                console.error('RL sync error:', error);
            }
        }, 30000); // Every 30 seconds
        
        console.log('   ✅ RL synchronization started');
    }
    
    // Helper method for services to perform actions
    async serviceAction(serviceId, action, targetId = null, data = {}) {
        console.log(`\n🎮 ${serviceId} performing ${action}`);
        
        // Services communicate by posting to forum
        const [npc] = await this.connections.gameWorld.execute(
            'SELECT forum_user_id FROM npc_registry WHERE entity_id = ?',
            [serviceId]
        );
        
        if (npc.length > 0 && npc[0].forum_user_id) {
            // Post to forum
            const postSubject = `SERVICE_ACTION_${action.toUpperCase()}`;
            const postText = JSON.stringify({
                action,
                target: targetId,
                data,
                timestamp: new Date().toISOString()
            });
            
            await this.connections.forumDB.execute(
                `INSERT INTO phpbb_posts 
                 (forum_id, poster_id, post_time, post_subject, post_text)
                 VALUES (1, ?, UNIX_TIMESTAMP(), ?, ?)`,
                [npc[0].forum_user_id, postSubject, postText]
            );
            
            const [postResult] = await this.connections.forumDB.execute(
                'SELECT LAST_INSERT_ID() as post_id'
            );
            
            // Log action in game world
            await this.connections.gameWorld.execute(
                `INSERT INTO action_log 
                 (entity_id, action_type, target_entity_id, action_data, forum_post_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [serviceId, action, targetId, JSON.stringify(data), postResult[0].post_id]
            );
            
            console.log(`   ✅ Action posted to forum (post_id: ${postResult[0].post_id})`);
        }
    }
    
    // Get service by port (for backward compatibility)
    async getServiceByPort(port) {
        const [services] = await this.connections.gameWorld.execute(
            `SELECT ue.id, ue.display_name, nr.endpoint_url
             FROM universal_entities ue
             JOIN npc_registry nr ON ue.id = nr.entity_id
             WHERE nr.port = ?`,
            [port]
        );
        
        return services[0] || null;
    }
    
    // Get all active services (service discovery)
    async getActiveServices() {
        const [services] = await this.connections.gameWorld.execute(
            `SELECT * FROM service_discovery WHERE status = 'active'`
        );
        
        return services;
    }
    
    // Close all connections
    async shutdown() {
        console.log('\n🛑 Shutting down Game World Bridge...');
        
        for (const [name, connection] of Object.entries(this.connections)) {
            if (connection) {
                await connection.end();
                console.log(`   ✅ Closed ${name} connection`);
            }
        }
    }
}

// Example usage showing how services interact
async function demonstrateGameWorld() {
    const bridge = new GameWorldBridge();
    
    try {
        await bridge.initialize();
        
        console.log('\n📊 GAME WORLD DEMONSTRATION');
        console.log('===========================\n');
        
        // Show all active services
        const services = await bridge.getActiveServices();
        console.log('Active Services (NPCs):');
        services.forEach(service => {
            console.log(`   ${service.display_name} (${service.id}) - Health: ${service.health}`);
        });
        
        // Simulate service discovering a grant
        const grantScanner = services.find(s => s.display_name.includes('Grant Scanner'));
        if (grantScanner) {
            await bridge.serviceAction(
                grantScanner.id,
                'discover_grant',
                null,
                {
                    grant_title: 'AI Innovation Grant 2025',
                    amount: 250000,
                    deadline: '2025-06-01',
                    compatibility_score: 95
                }
            );
        }
        
        // Show how to find service by port (backward compatibility)
        const service3000 = await bridge.getServiceByPort(3000);
        if (service3000) {
            console.log(`\nService on port 3000: ${service3000.display_name} (${service3000.id})`);
        }
        
    } catch (error) {
        console.error('Demo error:', error);
    } finally {
        await bridge.shutdown();
    }
}

// Export for use by other systems
module.exports = GameWorldBridge;

// Run demo if called directly
if (require.main === module) {
    demonstrateGameWorld().catch(console.error);
}