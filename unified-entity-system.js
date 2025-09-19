// 🆔 UNIFIED ENTITY SYSTEM - Discord-Style Universal Identity Registry
// Every entity exists across all realities with a unique discriminator system

const EventEmitter = require('events');
const crypto = require('crypto');

class UnifiedEntitySystem extends EventEmitter {
    constructor(diamondLayer) {
        super();
        this.diamondLayer = diamondLayer;
        this.entities = new Map();
        this.discriminators = new Map();
        this.shadows = new Map(); // Entity shadows across realities
        this.relationships = new Map(); // Entity connections
        this.initializeSystem();
    }

    initializeSystem() {
        console.log('🆔 Unified Entity System initializing...');
        
        // Initialize discriminator pool
        this.initializeDiscriminatorPool();
        
        // Start entity heartbeat system
        this.startHeartbeatMonitor();
        
        // Initialize relationship graph
        this.initializeRelationshipGraph();
    }

    initializeDiscriminatorPool() {
        // Pre-generate discriminator pools for each entity type
        const entityTypes = [
            'PLAYER', 'NPC', 'SERVICE', 'ITEM', 'LOCATION', 
            'VEHICLE', 'BUILDING', 'CREATURE', 'AI_AGENT', 'SYSTEM'
        ];

        entityTypes.forEach(type => {
            this.discriminators.set(type, {
                used: new Set(),
                available: this.generateDiscriminatorRange(0, 9999)
            });
        });
    }

    generateDiscriminatorRange(start, end) {
        const range = [];
        for (let i = start; i <= end; i++) {
            range.push(String(i).padStart(4, '0'));
        }
        return range;
    }

    createEntity(config) {
        const {
            type = 'PLAYER',
            name,
            homeReality,
            metadata = {},
            capabilities = [],
            permissions = []
        } = config;

        // Generate unique entity ID with discriminator
        const discriminator = this.getNextDiscriminator(type);
        const baseId = this.generateBaseId(name, type);
        const entityId = `${baseId}#${discriminator}`;

        // Create entity object
        const entity = {
            id: entityId,
            baseId,
            discriminator,
            type,
            name,
            displayName: `${name}#${discriminator}`,
            homeReality,
            currentRealities: [homeReality],
            metadata: {
                ...metadata,
                created: new Date(),
                lastSeen: new Date(),
                totalPlaytime: 0
            },
            capabilities: new Set(capabilities),
            permissions: new Set(permissions),
            state: {
                online: false,
                status: 'IDLE',
                activity: null
            },
            stats: this.initializeEntityStats(type),
            inventory: new Map(),
            achievements: new Set(),
            shadowPositions: new Map() // Position in each reality
        };

        // Store entity
        this.entities.set(entityId, entity);

        // Create initial shadow in home reality
        this.createEntityShadow(entityId, homeReality, {
            position: { x: 0, y: 0, z: 0 },
            state: 'SPAWNING'
        });

        // Initialize relationships
        this.relationships.set(entityId, {
            friends: new Set(),
            enemies: new Set(),
            guild: null,
            faction: null,
            contracts: new Map(),
            reputation: new Map()
        });

        // Emit creation event
        this.emit('entity_created', entity);

        // Register with diamond layer
        if (this.diamondLayer) {
            this.diamondLayer.createUniversalEntity({
                ...config,
                id: entityId
            });
        }

        return entity;
    }

    generateBaseId(name, type) {
        // Clean name for ID generation
        const cleanName = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
        
        return `${type.toLowerCase()}_${cleanName}`;
    }

    getNextDiscriminator(type) {
        const pool = this.discriminators.get(type);
        if (!pool || pool.available.length === 0) {
            throw new Error(`No discriminators available for type ${type}`);
        }

        const discriminator = pool.available.shift();
        pool.used.add(discriminator);
        
        return discriminator;
    }

    initializeEntityStats(type) {
        const baseStats = {
            level: 1,
            experience: 0,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100
        };

        // Type-specific stats
        const typeStats = {
            PLAYER: {
                ...baseStats,
                strength: 10,
                intelligence: 10,
                agility: 10,
                charisma: 10,
                luck: 10,
                karma: 0
            },
            NPC: {
                ...baseStats,
                aggression: 5,
                helpfulness: 5,
                merchantSkill: 5
            },
            CREATURE: {
                ...baseStats,
                ferocity: 5,
                tameable: false,
                rarity: 'common'
            },
            AI_AGENT: {
                ...baseStats,
                processingPower: 100,
                memoryCapacity: 1000,
                learningRate: 0.1
            },
            SERVICE: {
                uptime: 100,
                requestsHandled: 0,
                errorRate: 0,
                responseTime: 0
            }
        };

        return typeStats[type] || baseStats;
    }

    createEntityShadow(entityId, realityId, shadowData) {
        const shadows = this.shadows.get(entityId) || new Map();
        
        shadows.set(realityId, {
            realityId,
            position: shadowData.position || { x: 0, y: 0, z: 0 },
            rotation: shadowData.rotation || { x: 0, y: 0, z: 0 },
            scale: shadowData.scale || { x: 1, y: 1, z: 1 },
            state: shadowData.state || 'IDLE',
            visible: shadowData.visible !== false,
            lastUpdate: new Date(),
            localData: {} // Reality-specific data
        });

        this.shadows.set(entityId, shadows);

        // Update entity's current realities
        const entity = this.entities.get(entityId);
        if (entity && !entity.currentRealities.includes(realityId)) {
            entity.currentRealities.push(realityId);
        }

        this.emit('shadow_created', { entityId, realityId, shadow: shadows.get(realityId) });
    }

    updateEntityShadow(entityId, realityId, updates) {
        const shadows = this.shadows.get(entityId);
        if (!shadows) return;

        const shadow = shadows.get(realityId);
        if (!shadow) return;

        // Update shadow properties
        Object.assign(shadow, updates, {
            lastUpdate: new Date()
        });

        // Emit update event
        this.emit('shadow_updated', { entityId, realityId, updates });

        // Check for cross-reality effects
        this.checkCrossRealityEffects(entityId, realityId, updates);
    }

    checkCrossRealityEffects(entityId, realityId, updates) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        // If entity has multiversal capability, mirror certain changes
        if (entity.capabilities.has('MULTIVERSAL')) {
            if (updates.state === 'COMBAT') {
                // Enter combat state in all realities
                entity.currentRealities.forEach(rId => {
                    if (rId !== realityId) {
                        this.updateEntityShadow(entityId, rId, { state: 'ALERT' });
                    }
                });
            }
        }

        // If entity has quantum capability, exist in superposition
        if (entity.capabilities.has('QUANTUM')) {
            // Create probability shadows in nearby realities
            this.createQuantumShadows(entityId, realityId);
        }
    }

    createQuantumShadows(entityId, originReality) {
        // Complex quantum shadow creation logic
        // This would create probabilistic shadows in adjacent realities
        console.log(`Creating quantum shadows for ${entityId} from ${originReality}`);
    }

    transferEntity(entityId, targetRealityId, options = {}) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            throw new Error('Entity not found');
        }

        const {
            maintainShadow = true,
            transferInventory = true,
            resetPosition = false
        } = options;

        // Get current shadow
        const currentShadows = this.shadows.get(entityId);
        const currentReality = entity.currentRealities[0];
        const currentShadow = currentShadows?.get(currentReality);

        // Create or update shadow in target reality
        const targetPosition = resetPosition 
            ? { x: 0, y: 0, z: 0 } 
            : currentShadow?.position || { x: 0, y: 0, z: 0 };

        this.createEntityShadow(entityId, targetRealityId, {
            position: targetPosition,
            state: 'ARRIVING'
        });

        // Update entity's primary reality
        if (!maintainShadow) {
            // Remove from current reality
            entity.currentRealities = entity.currentRealities.filter(r => r !== currentReality);
            currentShadows?.delete(currentReality);
        }

        // Add to target reality if not already there
        if (!entity.currentRealities.includes(targetRealityId)) {
            entity.currentRealities.push(targetRealityId);
        }

        // Handle inventory transfer
        if (transferInventory) {
            this.transferEntityInventory(entityId, currentReality, targetRealityId);
        }

        // Update entity state
        entity.metadata.lastTransfer = new Date();
        entity.metadata.transferCount = (entity.metadata.transferCount || 0) + 1;

        // Emit transfer event
        this.emit('entity_transferred', {
            entityId,
            from: currentReality,
            to: targetRealityId,
            timestamp: new Date()
        });

        return entity;
    }

    transferEntityInventory(entityId, sourceReality, targetReality) {
        const entity = this.entities.get(entityId);
        if (!entity || !entity.inventory) return;

        // Apply reality-specific transformation rules
        entity.inventory.forEach((item, itemId) => {
            const transformedItem = this.transformItem(item, sourceReality, targetReality);
            entity.inventory.set(itemId, transformedItem);
        });
    }

    transformItem(item, sourceReality, targetReality) {
        // Item transformation logic based on reality rules
        const transformed = { ...item };

        // Example transformations
        if (sourceReality.includes('fantasy') && targetReality.includes('scifi')) {
            if (item.type === 'sword') {
                transformed.type = 'energy_blade';
                transformed.name = `Plasma ${item.name}`;
            }
        }

        return transformed;
    }

    createRelationship(entityId1, entityId2, relationshipType, metadata = {}) {
        const relations1 = this.relationships.get(entityId1);
        const relations2 = this.relationships.get(entityId2);

        if (!relations1 || !relations2) {
            throw new Error('One or both entities not found');
        }

        const relationship = {
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: relationshipType,
            entities: [entityId1, entityId2],
            created: new Date(),
            strength: 50, // 0-100
            metadata
        };

        // Update relationship maps
        switch (relationshipType) {
            case 'FRIEND':
                relations1.friends.add(entityId2);
                relations2.friends.add(entityId1);
                break;
            case 'ENEMY':
                relations1.enemies.add(entityId2);
                relations2.enemies.add(entityId1);
                break;
            case 'CONTRACT':
                relations1.contracts.set(entityId2, relationship);
                relations2.contracts.set(entityId1, relationship);
                break;
        }

        this.emit('relationship_created', relationship);
        return relationship;
    }

    updateEntityReputation(entityId, faction, change) {
        const relations = this.relationships.get(entityId);
        if (!relations) return;

        const currentRep = relations.reputation.get(faction) || 0;
        const newRep = Math.max(-100, Math.min(100, currentRep + change));
        
        relations.reputation.set(faction, newRep);

        // Check for reputation thresholds
        if (newRep >= 80 && currentRep < 80) {
            this.emit('reputation_milestone', {
                entityId,
                faction,
                milestone: 'EXALTED',
                reputation: newRep
            });
        } else if (newRep <= -80 && currentRep > -80) {
            this.emit('reputation_milestone', {
                entityId,
                faction,
                milestone: 'HOSTILE',
                reputation: newRep
            });
        }
    }

    searchEntities(query) {
        const results = [];
        
        // Search by name#discriminator
        if (query.includes('#')) {
            const [name, disc] = query.split('#');
            this.entities.forEach((entity, id) => {
                if (entity.name.toLowerCase().includes(name.toLowerCase()) &&
                    entity.discriminator === disc) {
                    results.push(entity);
                }
            });
        } else {
            // Search by partial name
            this.entities.forEach((entity, id) => {
                if (entity.name.toLowerCase().includes(query.toLowerCase()) ||
                    entity.displayName.toLowerCase().includes(query.toLowerCase())) {
                    results.push(entity);
                }
            });
        }

        return results;
    }

    getEntityByDiscriminator(name, discriminator) {
        for (const [id, entity] of this.entities) {
            if (entity.name === name && entity.discriminator === discriminator) {
                return entity;
            }
        }
        return null;
    }

    mergeEntities(entityId1, entityId2) {
        const entity1 = this.entities.get(entityId1);
        const entity2 = this.entities.get(entityId2);

        if (!entity1 || !entity2) {
            throw new Error('One or both entities not found');
        }

        // Create merged entity
        const mergedEntity = {
            ...entity1,
            id: `merged_${entityId1}_${entityId2}`,
            name: `${entity1.name}+${entity2.name}`,
            displayName: `${entity1.name}+${entity2.name}#0000`,
            discriminator: '0000', // Special merged discriminator
            metadata: {
                ...entity1.metadata,
                mergedFrom: [entityId1, entityId2],
                mergedAt: new Date()
            },
            stats: this.mergeStats(entity1.stats, entity2.stats),
            capabilities: new Set([...entity1.capabilities, ...entity2.capabilities]),
            permissions: new Set([...entity1.permissions, ...entity2.permissions]),
            currentRealities: [...new Set([...entity1.currentRealities, ...entity2.currentRealities])]
        };

        // Merge inventories
        mergedEntity.inventory = new Map([...entity1.inventory, ...entity2.inventory]);

        // Merge relationships
        const relations1 = this.relationships.get(entityId1);
        const relations2 = this.relationships.get(entityId2);
        
        this.relationships.set(mergedEntity.id, {
            friends: new Set([...relations1.friends, ...relations2.friends]),
            enemies: new Set([...relations1.enemies, ...relations2.enemies]),
            guild: relations1.guild || relations2.guild,
            faction: relations1.faction || relations2.faction,
            contracts: new Map([...relations1.contracts, ...relations2.contracts]),
            reputation: this.mergeReputations(relations1.reputation, relations2.reputation)
        });

        // Store merged entity
        this.entities.set(mergedEntity.id, mergedEntity);

        // Remove original entities
        this.entities.delete(entityId1);
        this.entities.delete(entityId2);

        this.emit('entities_merged', {
            original: [entityId1, entityId2],
            merged: mergedEntity.id
        });

        return mergedEntity;
    }

    mergeStats(stats1, stats2) {
        const merged = {};
        const allKeys = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);
        
        allKeys.forEach(key => {
            const val1 = stats1[key] || 0;
            const val2 = stats2[key] || 0;
            
            // Average numeric values
            if (typeof val1 === 'number' && typeof val2 === 'number') {
                merged[key] = Math.round((val1 + val2) / 2);
            } else {
                merged[key] = val1 || val2;
            }
        });

        return merged;
    }

    mergeReputations(rep1, rep2) {
        const merged = new Map();
        const allFactions = new Set([...rep1.keys(), ...rep2.keys()]);
        
        allFactions.forEach(faction => {
            const val1 = rep1.get(faction) || 0;
            const val2 = rep2.get(faction) || 0;
            merged.set(faction, Math.round((val1 + val2) / 2));
        });

        return merged;
    }

    splitEntity(entityId, splitConfig) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            throw new Error('Entity not found');
        }

        const { splits = 2, preserveOriginal = false } = splitConfig;
        const splitEntities = [];

        for (let i = 0; i < splits; i++) {
            const splitEntity = {
                ...entity,
                id: `${entity.baseId}_split${i}#${this.getNextDiscriminator(entity.type)}`,
                name: `${entity.name} (Split ${i + 1})`,
                metadata: {
                    ...entity.metadata,
                    splitFrom: entityId,
                    splitIndex: i,
                    splitAt: new Date()
                },
                stats: this.splitStats(entity.stats, splits),
                inventory: this.splitInventory(entity.inventory, splits, i)
            };

            this.entities.set(splitEntity.id, splitEntity);
            splitEntities.push(splitEntity);
        }

        if (!preserveOriginal) {
            this.entities.delete(entityId);
        }

        this.emit('entity_split', {
            original: entityId,
            splits: splitEntities.map(e => e.id)
        });

        return splitEntities;
    }

    splitStats(stats, splits) {
        const split = {};
        Object.entries(stats).forEach(([key, value]) => {
            if (typeof value === 'number') {
                split[key] = Math.floor(value / splits);
            } else {
                split[key] = value;
            }
        });
        return split;
    }

    splitInventory(inventory, splits, index) {
        const items = Array.from(inventory.entries());
        const itemsPerSplit = Math.floor(items.length / splits);
        const startIdx = index * itemsPerSplit;
        const endIdx = index === splits - 1 ? items.length : startIdx + itemsPerSplit;
        
        return new Map(items.slice(startIdx, endIdx));
    }

    grantCapability(entityId, capability) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.capabilities.add(capability);

        // Special handling for certain capabilities
        if (capability === 'FLIGHT') {
            // Update all shadows to allow Y-axis movement
            const shadows = this.shadows.get(entityId);
            shadows?.forEach(shadow => {
                shadow.canFly = true;
            });
        }

        this.emit('capability_granted', { entityId, capability });
    }

    revokeCapability(entityId, capability) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.capabilities.delete(capability);
        this.emit('capability_revoked', { entityId, capability });
    }

    startHeartbeatMonitor() {
        setInterval(() => {
            const now = new Date();
            
            this.entities.forEach((entity, entityId) => {
                // Check last seen time
                const lastSeenMs = now - entity.metadata.lastSeen;
                
                if (lastSeenMs > 300000 && entity.state.online) { // 5 minutes
                    entity.state.online = false;
                    entity.state.status = 'OFFLINE';
                    this.emit('entity_offline', { entityId });
                }

                // Update playtime for online entities
                if (entity.state.online) {
                    entity.metadata.totalPlaytime += 5; // Add 5 seconds
                }
            });
        }, 5000); // Every 5 seconds
    }

    updateEntityActivity(entityId, activity) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.state.activity = activity;
        entity.metadata.lastSeen = new Date();
        entity.state.online = true;

        this.emit('entity_activity', { entityId, activity });
    }

    getEntityFullProfile(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) return null;

        const shadows = this.shadows.get(entityId);
        const relationships = this.relationships.get(entityId);

        return {
            ...entity,
            shadows: shadows ? Array.from(shadows.entries()) : [],
            relationships: relationships ? {
                friends: Array.from(relationships.friends),
                enemies: Array.from(relationships.enemies),
                contracts: Array.from(relationships.contracts.entries()),
                reputation: Array.from(relationships.reputation.entries())
            } : null
        };
    }

    exportEntityData(entityId) {
        const profile = this.getEntityFullProfile(entityId);
        if (!profile) return null;

        return {
            version: '1.0',
            exported: new Date(),
            entity: profile,
            checksum: this.generateChecksum(profile)
        };
    }

    importEntityData(exportData) {
        if (!this.verifyChecksum(exportData)) {
            throw new Error('Invalid entity data checksum');
        }

        const { entity } = exportData;
        
        // Check if discriminator is available
        const pool = this.discriminators.get(entity.type);
        if (pool.used.has(entity.discriminator)) {
            // Assign new discriminator
            entity.discriminator = this.getNextDiscriminator(entity.type);
            entity.id = `${entity.baseId}#${entity.discriminator}`;
            entity.displayName = `${entity.name}#${entity.discriminator}`;
        }

        // Import entity
        this.entities.set(entity.id, entity);

        // Import shadows
        if (entity.shadows) {
            this.shadows.set(entity.id, new Map(entity.shadows));
        }

        // Import relationships
        if (entity.relationships) {
            this.relationships.set(entity.id, {
                friends: new Set(entity.relationships.friends),
                enemies: new Set(entity.relationships.enemies),
                contracts: new Map(entity.relationships.contracts),
                reputation: new Map(entity.relationships.reputation),
                guild: entity.relationships.guild,
                faction: entity.relationships.faction
            });
        }

        this.emit('entity_imported', { entityId: entity.id });
        return entity;
    }

    generateChecksum(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    verifyChecksum(exportData) {
        const { entity, checksum } = exportData;
        const calculatedChecksum = this.generateChecksum(entity);
        return calculatedChecksum === checksum;
    }

    initializeRelationshipGraph() {
        // This could be expanded to use a proper graph database
        // For now, we'll use the in-memory relationship maps
        console.log('Relationship graph initialized');
    }

    findShortestPath(entityId1, entityId2) {
        // Dijkstra's algorithm to find shortest relationship path
        // This is a simplified version
        const visited = new Set();
        const queue = [{ id: entityId1, path: [entityId1] }];

        while (queue.length > 0) {
            const { id, path } = queue.shift();
            
            if (id === entityId2) {
                return path;
            }

            if (visited.has(id)) continue;
            visited.add(id);

            const relations = this.relationships.get(id);
            if (relations) {
                relations.friends.forEach(friendId => {
                    if (!visited.has(friendId)) {
                        queue.push({ id: friendId, path: [...path, friendId] });
                    }
                });
            }
        }

        return null; // No path found
    }

    calculateSocialInfluence(entityId) {
        const relations = this.relationships.get(entityId);
        if (!relations) return 0;

        let influence = 0;
        
        // Friends contribute positive influence
        influence += relations.friends.size * 10;
        
        // Contracts show business influence
        influence += relations.contracts.size * 20;
        
        // Reputation affects influence
        relations.reputation.forEach((rep, faction) => {
            influence += Math.abs(rep) * 0.5;
        });

        return influence;
    }
}

module.exports = UnifiedEntitySystem;