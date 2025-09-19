// 🌌 REALITY INSTANCE MANAGER - Parallel Database Universe Controller
// Each reality is a complete database instance with its own rules, physics, and entities

const sqlite3 = require('sqlite3').verbose();
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class RealityInstanceManager extends EventEmitter {
    constructor(diamondLayer) {
        super();
        this.diamondLayer = diamondLayer;
        this.realities = new Map();
        this.templates = new Map();
        this.activeConnections = new Map();
        this.initializeManager();
    }

    async initializeManager() {
        console.log('🌌 Reality Instance Manager initializing...');
        
        // Create realities directory
        await this.ensureDirectory('data/realities');
        
        // Load reality templates
        this.loadRealityTemplates();
        
        // Initialize reality sync engine
        this.startRealitySyncEngine();
        
        // Set up reality health monitoring
        this.startHealthMonitoring();
    }

    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error('Directory creation error:', error);
        }
    }

    loadRealityTemplates() {
        // Cannabis Empire Template
        this.templates.set('cannabis_empire', {
            name: 'Cannabis Empire',
            theme: 'business_tycoon',
            schema: {
                businesses: `
                    CREATE TABLE businesses (
                        id TEXT PRIMARY KEY,
                        owner_id TEXT,
                        name TEXT,
                        type TEXT,
                        location TEXT,
                        revenue REAL DEFAULT 0,
                        reputation INTEGER DEFAULT 50,
                        employees INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`,
                products: `
                    CREATE TABLE products (
                        id TEXT PRIMARY KEY,
                        business_id TEXT,
                        name TEXT,
                        strain TEXT,
                        thc_level REAL,
                        price REAL,
                        quality INTEGER,
                        stock INTEGER DEFAULT 0
                    )`,
                transactions: `
                    CREATE TABLE transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        buyer_id TEXT,
                        seller_id TEXT,
                        product_id TEXT,
                        amount INTEGER,
                        price REAL,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`,
                regulations: `
                    CREATE TABLE regulations (
                        id TEXT PRIMARY KEY,
                        jurisdiction TEXT,
                        rule_type TEXT,
                        description TEXT,
                        penalty REAL,
                        active BOOLEAN DEFAULT true
                    )`
            },
            rules: {
                physics: 'economic',
                currency: 'THC_COINS',
                startingCapital: 10000,
                marketVolatility: 0.3,
                regulationFrequency: 'weekly'
            },
            npcs: [
                { type: 'regulator', name: 'DEA Agent Smith', behavior: 'strict' },
                { type: 'supplier', name: 'Grower Joe', behavior: 'friendly' },
                { type: 'competitor', name: 'Big Pharma Corp', behavior: 'aggressive' }
            ]
        });

        // Space Federation Template
        this.templates.set('space_federation', {
            name: 'Galactic Federation',
            theme: 'space_exploration',
            schema: {
                star_systems: `
                    CREATE TABLE star_systems (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        coordinates TEXT,
                        star_type TEXT,
                        planets INTEGER,
                        owner_faction TEXT,
                        resources TEXT,
                        discovered_by TEXT,
                        discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`,
                spaceships: `
                    CREATE TABLE spaceships (
                        id TEXT PRIMARY KEY,
                        owner_id TEXT,
                        name TEXT,
                        class TEXT,
                        hull_integrity REAL DEFAULT 100,
                        fuel REAL DEFAULT 100,
                        cargo_capacity INTEGER,
                        weapons TEXT,
                        current_system TEXT,
                        position TEXT
                    )`,
                federations: `
                    CREATE TABLE federations (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        leader_id TEXT,
                        members TEXT,
                        treasury REAL DEFAULT 0,
                        reputation INTEGER DEFAULT 0,
                        home_system TEXT,
                        founded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`,
                wormholes: `
                    CREATE TABLE wormholes (
                        id TEXT PRIMARY KEY,
                        system_a TEXT,
                        system_b TEXT,
                        stability REAL DEFAULT 1.0,
                        discovered BOOLEAN DEFAULT false,
                        toll_price REAL DEFAULT 0
                    )`
            },
            rules: {
                physics: 'relativistic',
                fuelConsumption: true,
                combatSystem: 'real_time',
                diplomacy: 'complex',
                exploration: 'fog_of_war'
            },
            npcs: [
                { type: 'alien_trader', name: 'Zyx\'tor', behavior: 'mysterious' },
                { type: 'pirate', name: 'Black Nebula Raiders', behavior: 'hostile' },
                { type: 'scientist', name: 'Dr. Nova', behavior: 'helpful' }
            ]
        });

        // Underwater Civilization Template
        this.templates.set('depths_civilization', {
            name: 'Abyssal Depths',
            theme: 'underwater_kingdom',
            schema: {
                depth_zones: `
                    CREATE TABLE depth_zones (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        depth_meters INTEGER,
                        pressure REAL,
                        temperature REAL,
                        light_level REAL,
                        discovered BOOLEAN DEFAULT false,
                        anomalies TEXT
                    )`,
                submarines: `
                    CREATE TABLE submarines (
                        id TEXT PRIMARY KEY,
                        owner_id TEXT,
                        name TEXT,
                        hull_strength REAL,
                        max_depth INTEGER,
                        oxygen REAL DEFAULT 100,
                        power REAL DEFAULT 100,
                        sonar_range INTEGER,
                        current_depth INTEGER DEFAULT 0,
                        position TEXT
                    )`,
                sea_creatures: `
                    CREATE TABLE sea_creatures (
                        id TEXT PRIMARY KEY,
                        species TEXT,
                        size TEXT,
                        hostility REAL,
                        rarity TEXT,
                        depth_range TEXT,
                        abilities TEXT,
                        discovered BOOLEAN DEFAULT false
                    )`,
                ancient_ruins: `
                    CREATE TABLE ancient_ruins (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        depth INTEGER,
                        coordinates TEXT,
                        civilization TEXT,
                        artifacts TEXT,
                        guardian_id TEXT,
                        explored BOOLEAN DEFAULT false
                    )`
            },
            rules: {
                physics: 'underwater',
                oxygenManagement: true,
                pressureDamage: true,
                bioluminescence: true,
                sonarVision: true
            },
            npcs: [
                { type: 'mermaid_guide', name: 'Aquaria', behavior: 'helpful' },
                { type: 'kraken', name: 'The Ancient One', behavior: 'territorial' },
                { type: 'submarine_trader', name: 'Captain Nemo', behavior: 'neutral' }
            ]
        });

        // Fantasy RPG Template
        this.templates.set('fantasy_realm', {
            name: 'Mystic Realms',
            theme: 'fantasy_adventure',
            schema: {
                characters: `
                    CREATE TABLE characters (
                        id TEXT PRIMARY KEY,
                        player_id TEXT,
                        name TEXT,
                        class TEXT,
                        level INTEGER DEFAULT 1,
                        experience INTEGER DEFAULT 0,
                        health INTEGER DEFAULT 100,
                        mana INTEGER DEFAULT 100,
                        strength INTEGER DEFAULT 10,
                        intelligence INTEGER DEFAULT 10,
                        agility INTEGER DEFAULT 10,
                        inventory TEXT,
                        equipment TEXT,
                        skills TEXT,
                        position TEXT
                    )`,
                quests: `
                    CREATE TABLE quests (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        description TEXT,
                        giver_npc TEXT,
                        objectives TEXT,
                        rewards TEXT,
                        required_level INTEGER,
                        completed_by TEXT
                    )`,
                dungeons: `
                    CREATE TABLE dungeons (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        difficulty TEXT,
                        floors INTEGER,
                        boss_id TEXT,
                        loot_table TEXT,
                        cleared_by TEXT,
                        respawn_time INTEGER
                    )`,
                magic_items: `
                    CREATE TABLE magic_items (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        type TEXT,
                        rarity TEXT,
                        stats TEXT,
                        special_effects TEXT,
                        owner_id TEXT,
                        bound BOOLEAN DEFAULT false
                    )`
            },
            rules: {
                physics: 'magic',
                combatSystem: 'turn_based',
                levelCap: 100,
                deathPenalty: 'experience_loss',
                pvp: true,
                guilds: true
            },
            npcs: [
                { type: 'quest_giver', name: 'Elder Sage', behavior: 'wise' },
                { type: 'shopkeeper', name: 'Grizelda', behavior: 'greedy' },
                { type: 'boss', name: 'Dark Lord Mortis', behavior: 'evil' }
            ]
        });

        // Cyberpunk Metropolis Template
        this.templates.set('cyberpunk_city', {
            name: 'Neo Tokyo 2185',
            theme: 'cyberpunk_dystopia',
            schema: {
                augmentations: `
                    CREATE TABLE augmentations (
                        id TEXT PRIMARY KEY,
                        owner_id TEXT,
                        type TEXT,
                        manufacturer TEXT,
                        version TEXT,
                        integrity REAL DEFAULT 100,
                        hacked BOOLEAN DEFAULT false,
                        abilities TEXT
                    )`,
                corporations: `
                    CREATE TABLE corporations (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        sector TEXT,
                        market_cap REAL,
                        reputation INTEGER,
                        illegal_ops INTEGER DEFAULT 0,
                        ceo_id TEXT,
                        headquarters TEXT
                    )`,
                netrunning: `
                    CREATE TABLE netrunning (
                        id TEXT PRIMARY KEY,
                        hacker_id TEXT,
                        target_system TEXT,
                        ice_level INTEGER,
                        data_stolen TEXT,
                        trace_level REAL DEFAULT 0,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`,
                black_market: `
                    CREATE TABLE black_market (
                        id TEXT PRIMARY KEY,
                        item_type TEXT,
                        seller_id TEXT,
                        price REAL,
                        heat_level INTEGER,
                        quality TEXT,
                        available BOOLEAN DEFAULT true
                    )`
            },
            rules: {
                physics: 'augmented',
                hacking: true,
                policeHeat: true,
                augmentationLimit: 10,
                dataEconomy: true
            },
            npcs: [
                { type: 'fixer', name: 'Johnny Chrome', behavior: 'shady' },
                { type: 'corp_exec', name: 'Ms. Tanaka', behavior: 'ruthless' },
                { type: 'ai_entity', name: 'GHOST', behavior: 'enigmatic' }
            ]
        });
    }

    async createRealityInstance(templateId, customConfig = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const realityId = `reality_${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const dbPath = path.join('data', 'realities', `${realityId}.db`);
        
        // Create database instance
        const db = new sqlite3.Database(dbPath);
        
        // Initialize schema
        await this.initializeRealitySchema(db, template.schema);
        
        // Create reality instance object
        const reality = {
            id: realityId,
            templateId,
            name: customConfig.name || template.name,
            theme: template.theme,
            db,
            dbPath,
            rules: { ...template.rules, ...customConfig.rules },
            entities: new Map(),
            activeUsers: new Set(),
            lastActivity: new Date(),
            statistics: {
                totalEntities: 0,
                activeConnections: 0,
                transactionCount: 0,
                uptime: 0
            }
        };

        // Initialize NPCs
        await this.spawnNPCs(reality, template.npcs);
        
        // Store reality
        this.realities.set(realityId, reality);
        
        // Register with diamond layer
        if (this.diamondLayer) {
            await this.diamondLayer.createNewReality({
                id: realityId,
                ...reality
            });
        }
        
        this.emit('reality_created', reality);
        
        return reality;
    }

    async initializeRealitySchema(db, schema) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Core tables every reality needs
                db.run(`
                    CREATE TABLE IF NOT EXISTS reality_metadata (
                        key TEXT PRIMARY KEY,
                        value TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS entity_positions (
                        entity_id TEXT PRIMARY KEY,
                        x REAL,
                        y REAL,
                        z REAL,
                        rotation TEXT,
                        velocity TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS entity_interactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        actor_id TEXT,
                        target_id TEXT,
                        action TEXT,
                        result TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS chat_messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sender_id TEXT,
                        channel TEXT,
                        message TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Create template-specific tables
                Object.entries(schema).forEach(([tableName, createSQL]) => {
                    db.run(createSQL, (err) => {
                        if (err) console.error(`Error creating table ${tableName}:`, err);
                    });
                });

                resolve();
            });
        });
    }

    async spawnNPCs(reality, npcTemplates) {
        for (const npcTemplate of npcTemplates) {
            const npcId = `npc_${npcTemplate.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            
            // Create NPC entity
            const npc = {
                id: npcId,
                type: 'NPC',
                name: npcTemplate.name,
                behavior: npcTemplate.behavior,
                position: this.generateRandomPosition(reality.theme),
                state: 'IDLE',
                dialogue: this.generateNPCDialogue(npcTemplate.type, npcTemplate.behavior)
            };
            
            // Store in reality
            reality.entities.set(npcId, npc);
            
            // Store in database
            reality.db.run(
                "INSERT INTO entity_positions (entity_id, x, y, z) VALUES (?, ?, ?, ?)",
                [npcId, npc.position.x, npc.position.y, npc.position.z]
            );
            
            // Start NPC behavior loop
            this.startNPCBehavior(reality, npc);
        }
    }

    generateRandomPosition(theme) {
        switch (theme) {
            case 'underwater_kingdom':
                return {
                    x: Math.random() * 1000 - 500,
                    y: -Math.random() * 5000, // Negative for depth
                    z: Math.random() * 1000 - 500
                };
            case 'space_exploration':
                return {
                    x: Math.random() * 10000 - 5000,
                    y: Math.random() * 10000 - 5000,
                    z: Math.random() * 10000 - 5000
                };
            default:
                return {
                    x: Math.random() * 1000 - 500,
                    y: 0,
                    z: Math.random() * 1000 - 500
                };
        }
    }

    generateNPCDialogue(npcType, behavior) {
        const dialogues = {
            regulator: {
                strict: [
                    "Your papers, please. Everything must be in order.",
                    "I'll be watching your operation closely.",
                    "One violation and we shut you down."
                ],
                friendly: [
                    "Just making sure everyone's following the rules!",
                    "Keep up the good work, stay compliant!",
                    "Let me know if you need help with regulations."
                ]
            },
            trader: {
                greedy: [
                    "Best prices in the galaxy... for me!",
                    "Supply and demand, friend. Mostly demand.",
                    "This'll cost ya, but it's worth it... maybe."
                ],
                helpful: [
                    "I've got just what you need!",
                    "Fair prices, quality goods!",
                    "Let me help you find the perfect item."
                ]
            },
            quest_giver: {
                wise: [
                    "The path ahead is treacherous, but rewarding.",
                    "Only the brave shall succeed in this task.",
                    "Your destiny awaits, young adventurer."
                ],
                mysterious: [
                    "Things are not always as they seem...",
                    "The shadows hold many secrets.",
                    "Are you prepared for what lies ahead?"
                ]
            }
        };

        return dialogues[npcType]?.[behavior] || ["Hello there!"];
    }

    startNPCBehavior(reality, npc) {
        // Simple NPC behavior loop
        const behaviorInterval = setInterval(() => {
            if (!this.realities.has(reality.id)) {
                clearInterval(behaviorInterval);
                return;
            }

            // Random movement
            if (Math.random() < 0.3) {
                npc.position.x += (Math.random() - 0.5) * 10;
                npc.position.z += (Math.random() - 0.5) * 10;
                
                // Update position in database
                reality.db.run(
                    "UPDATE entity_positions SET x = ?, z = ? WHERE entity_id = ?",
                    [npc.position.x, npc.position.z, npc.id]
                );
            }

            // Random state changes
            if (Math.random() < 0.1) {
                const states = ['IDLE', 'WALKING', 'TALKING', 'WORKING'];
                npc.state = states[Math.floor(Math.random() * states.length)];
            }

            // Emit NPC update
            this.emit('npc_update', { realityId: reality.id, npc });
        }, 5000); // Update every 5 seconds
    }

    async loadRealityInstance(realityId) {
        const reality = this.realities.get(realityId);
        if (!reality) {
            throw new Error(`Reality ${realityId} not found`);
        }

        // Load entities from database
        return new Promise((resolve) => {
            reality.db.all(
                "SELECT * FROM entity_positions",
                (err, entities) => {
                    if (!err && entities) {
                        entities.forEach(entity => {
                            reality.entities.set(entity.entity_id, {
                                id: entity.entity_id,
                                position: { x: entity.x, y: entity.y, z: entity.z }
                            });
                        });
                    }
                    
                    reality.statistics.totalEntities = reality.entities.size;
                    resolve(reality);
                }
            );
        });
    }

    async transferEntity(entityId, sourceRealityId, targetRealityId, transferRules = {}) {
        const sourceReality = this.realities.get(sourceRealityId);
        const targetReality = this.realities.get(targetRealityId);
        
        if (!sourceReality || !targetReality) {
            throw new Error('Invalid reality IDs');
        }

        const entity = sourceReality.entities.get(entityId);
        if (!entity) {
            throw new Error('Entity not found in source reality');
        }

        // Apply transformation rules based on reality themes
        const transformedEntity = this.transformEntityForReality(
            entity,
            sourceReality.theme,
            targetReality.theme,
            transferRules
        );

        // Remove from source
        sourceReality.entities.delete(entityId);
        sourceReality.db.run("DELETE FROM entity_positions WHERE entity_id = ?", [entityId]);

        // Add to target
        targetReality.entities.set(entityId, transformedEntity);
        targetReality.db.run(
            "INSERT INTO entity_positions (entity_id, x, y, z) VALUES (?, ?, ?, ?)",
            [entityId, transformedEntity.position.x, transformedEntity.position.y, transformedEntity.position.z]
        );

        this.emit('entity_transferred', {
            entityId,
            sourceRealityId,
            targetRealityId,
            transformations: transformedEntity.transformations
        });

        return transformedEntity;
    }

    transformEntityForReality(entity, sourceTheme, targetTheme, rules) {
        const transformed = { ...entity, transformations: [] };

        // Theme-based transformations
        if (sourceTheme === 'fantasy_adventure' && targetTheme === 'cyberpunk_dystopia') {
            // Magic items become tech augmentations
            if (entity.equipment?.staff) {
                transformed.equipment.neural_implant = {
                    name: `Techno-${entity.equipment.staff.name}`,
                    type: 'augmentation'
                };
                transformed.transformations.push('Magic staff → Neural implant');
            }
        } else if (sourceTheme === 'space_exploration' && targetTheme === 'underwater_kingdom') {
            // Spaceship becomes submarine
            if (entity.type === 'spaceship') {
                transformed.type = 'submarine';
                transformed.position.y = -1000; // Put underwater
                transformed.transformations.push('Spaceship → Submarine');
            }
        }

        // Apply custom transformation rules
        if (rules.preserveStats) {
            transformed.stats = entity.stats;
        }

        if (rules.resetPosition) {
            transformed.position = this.generateRandomPosition(targetTheme);
        }

        return transformed;
    }

    async cloneReality(sourceRealityId, newName) {
        const sourceReality = this.realities.get(sourceRealityId);
        if (!sourceReality) {
            throw new Error('Source reality not found');
        }

        // Create new reality with same template
        const newReality = await this.createRealityInstance(sourceReality.templateId, {
            name: newName
        });

        // Copy all data from source
        await this.copyRealityData(sourceReality, newReality);

        return newReality;
    }

    async copyRealityData(source, target) {
        return new Promise((resolve) => {
            source.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                if (err) {
                    console.error('Error copying reality data:', err);
                    resolve();
                    return;
                }

                tables.forEach(table => {
                    if (table.name !== 'sqlite_sequence') {
                        source.db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
                            if (!err && rows.length > 0) {
                                const columns = Object.keys(rows[0]);
                                const placeholders = columns.map(() => '?').join(',');
                                const insertSQL = `INSERT INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`;
                                
                                rows.forEach(row => {
                                    const values = columns.map(col => row[col]);
                                    target.db.run(insertSQL, values);
                                });
                            }
                        });
                    }
                });

                resolve();
            });
        });
    }

    async mergeRealities(realityIds, newName) {
        if (realityIds.length < 2) {
            throw new Error('Need at least 2 realities to merge');
        }

        // Create new merged reality
        const mergedReality = await this.createRealityInstance('merged', {
            name: newName,
            rules: {
                physics: 'hybrid',
                multiverse: true
            }
        });

        // Merge entities from all realities
        for (const realityId of realityIds) {
            const reality = this.realities.get(realityId);
            if (reality) {
                reality.entities.forEach((entity, entityId) => {
                    // Add reality prefix to avoid ID conflicts
                    const mergedEntityId = `${reality.theme}_${entityId}`;
                    mergedReality.entities.set(mergedEntityId, {
                        ...entity,
                        originalReality: realityId,
                        id: mergedEntityId
                    });
                });
            }
        }

        this.emit('realities_merged', {
            sourceRealities: realityIds,
            mergedReality: mergedReality.id
        });

        return mergedReality;
    }

    startRealitySyncEngine() {
        // Periodic sync between related realities
        setInterval(() => {
            this.realities.forEach((reality, realityId) => {
                // Update statistics
                reality.statistics.activeConnections = reality.activeUsers.size;
                reality.statistics.uptime = Date.now() - reality.lastActivity;
                
                // Check for cross-reality events
                this.checkCrossRealityEvents(reality);
            });
        }, 5000);
    }

    checkCrossRealityEvents(reality) {
        // Check if any entities should appear in multiple realities
        reality.entities.forEach((entity, entityId) => {
            if (entity.multiversal && entity.echoRealities) {
                entity.echoRealities.forEach(echoRealityId => {
                    const echoReality = this.realities.get(echoRealityId);
                    if (echoReality && !echoReality.entities.has(entityId)) {
                        // Create echo of entity in other reality
                        echoReality.entities.set(entityId, {
                            ...entity,
                            isEcho: true,
                            sourceReality: reality.id
                        });
                    }
                });
            }
        });
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.realities.forEach((reality, realityId) => {
                // Check database health
                reality.db.get("SELECT COUNT(*) as count FROM entity_positions", (err, result) => {
                    if (err) {
                        console.error(`Reality ${realityId} database error:`, err);
                        this.emit('reality_unhealthy', { realityId, error: err });
                    }
                });

                // Check for inactive realities
                const inactiveTime = Date.now() - reality.lastActivity;
                if (inactiveTime > 3600000 && reality.activeUsers.size === 0) { // 1 hour
                    this.emit('reality_inactive', { realityId, inactiveTime });
                }
            });
        }, 30000); // Every 30 seconds
    }

    async saveRealitySnapshot(realityId) {
        const reality = this.realities.get(realityId);
        if (!reality) {
            throw new Error('Reality not found');
        }

        const snapshot = {
            id: realityId,
            timestamp: new Date(),
            entities: Array.from(reality.entities.entries()),
            statistics: reality.statistics,
            metadata: {
                name: reality.name,
                theme: reality.theme,
                rules: reality.rules
            }
        };

        const snapshotPath = path.join('data', 'snapshots', `${realityId}_${Date.now()}.json`);
        await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

        return snapshotPath;
    }

    async restoreRealitySnapshot(snapshotPath) {
        const snapshotData = await fs.readFile(snapshotPath, 'utf-8');
        const snapshot = JSON.parse(snapshotData);

        // Create new reality from snapshot
        const restoredReality = await this.createRealityInstance(snapshot.metadata.theme, {
            name: `${snapshot.metadata.name} (Restored)`,
            rules: snapshot.metadata.rules
        });

        // Restore entities
        snapshot.entities.forEach(([entityId, entity]) => {
            restoredReality.entities.set(entityId, entity);
        });

        return restoredReality;
    }

    getRealityStatus(realityId) {
        const reality = this.realities.get(realityId);
        if (!reality) {
            return null;
        }

        return {
            id: realityId,
            name: reality.name,
            theme: reality.theme,
            active: true,
            statistics: reality.statistics,
            entityCount: reality.entities.size,
            activeUsers: reality.activeUsers.size,
            health: 'healthy' // Could be more sophisticated
        };
    }

    getAllRealitiesStatus() {
        const statuses = [];
        this.realities.forEach((reality, realityId) => {
            statuses.push(this.getRealityStatus(realityId));
        });
        return statuses;
    }
}

module.exports = RealityInstanceManager;