#!/usr/bin/env node

/**
 * 🏷️ UNIVERSAL ENTITY REGISTRY
 * 
 * UPC-style IDs for all entities across the platform
 * Tracks relationships, discoveries, and cross-world connections
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class UniversalEntityRegistry extends EventEmitter {
    constructor() {
        super();
        
        this.registryId = `UER-${Date.now()}`;
        
        // Entity type prefixes (UPC-style)
        this.typePrefixes = {
            // Core entities (000-099)
            'system': '000',
            'world': '001',
            'portal': '002',
            
            // Player entities (100-199)
            'player': '100',
            'npc': '101',
            'ai-agent': '102',
            
            // Content entities (200-299)
            'lesson': '200',
            'challenge': '201',
            'quest': '202',
            'achievement': '203',
            'card': '204',
            'mvp': '205',
            
            // Item entities (300-399)
            'item': '300',
            'weapon': '301',
            'armor': '302',
            'consumable': '303',
            'key': '304',
            'artifact': '305',
            
            // Economic entities (400-499)
            'currency': '400',
            'trade': '401',
            'market': '402',
            'opportunity': '403',
            'contract': '404',
            
            // Knowledge entities (500-599)
            'skill': '500',
            'concept': '501',
            'theory': '502',
            'discovery': '503',
            'patent': '504',
            
            // Social entities (600-699)
            'guild': '600',
            'team': '601',
            'alliance': '602',
            'relationship': '603',
            
            // Location entities (700-799)
            'location': '700',
            'building': '701',
            'landmark': '702',
            'territory': '703',
            
            // Event entities (800-899)
            'event': '800',
            'competition': '801',
            'ceremony': '802',
            'disaster': '803',
            
            // Meta entities (900-999)
            'composite': '900',
            'template': '901',
            'blueprint': '902',
            'algorithm': '903'
        };
        
        // Registry storage
        this.entities = new Map(); // universalId -> Entity
        this.typeIndex = new Map(); // entityType -> Set<universalId>
        this.relationships = new Map(); // universalId -> Relationship[]
        this.discoveries = new Map(); // universalId -> Discovery[]
        
        // Relationship types
        this.relationshipTypes = {
            'parent-child': { bidirectional: false },
            'sibling': { bidirectional: true },
            'friend': { bidirectional: true },
            'enemy': { bidirectional: true },
            'teacher-student': { bidirectional: false },
            'owner': { bidirectional: false },
            'member': { bidirectional: false },
            'creator': { bidirectional: false },
            'derivative': { bidirectional: false },
            'inspiration': { bidirectional: false },
            'competitor': { bidirectional: true },
            'partner': { bidirectional: true },
            'prerequisite': { bidirectional: false },
            'unlocks': { bidirectional: false }
        };
        
        // Statistics
        this.stats = {
            totalEntities: 0,
            totalRelationships: 0,
            totalDiscoveries: 0,
            entitiesByType: new Map(),
            mostConnectedEntities: [],
            recentActivity: []
        };
        
        console.log('🏷️ Universal Entity Registry initialized');
    }
    
    /**
     * Register a new entity
     */
    registerEntity(entityType, identifier, metadata = {}) {
        if (!this.typePrefixes[entityType]) {
            throw new Error(`Unknown entity type: ${entityType}`);
        }
        
        const universalId = this.generateUniversalId(entityType, identifier);
        
        // Check if already exists
        if (this.entities.has(universalId)) {
            console.warn(`Entity already exists: ${universalId}`);
            return this.entities.get(universalId);
        }
        
        const entity = {
            universalId,
            entityType,
            identifier,
            
            // Core metadata
            name: metadata.name || identifier,
            description: metadata.description || '',
            tags: metadata.tags || [],
            
            // Timestamps
            created: Date.now(),
            modified: Date.now(),
            accessed: Date.now(),
            
            // Properties
            properties: metadata.properties || {},
            
            // State
            active: true,
            visibility: metadata.visibility || 'public',
            version: 1,
            
            // Statistics
            accessCount: 0,
            relationshipCount: 0,
            discoveryCount: 0,
            
            // Validation
            verified: metadata.verified || false,
            verifiedBy: metadata.verifiedBy || null,
            verifiedAt: metadata.verifiedAt || null,
            
            // Cross-world presence
            worldPresence: metadata.worldPresence || []
        };
        
        // Store entity
        this.entities.set(universalId, entity);
        
        // Update type index
        if (!this.typeIndex.has(entityType)) {
            this.typeIndex.set(entityType, new Set());
        }
        this.typeIndex.get(entityType).add(universalId);
        
        // Initialize relationship storage
        this.relationships.set(universalId, []);
        
        // Update statistics
        this.stats.totalEntities++;
        this.stats.entitiesByType.set(
            entityType,
            (this.stats.entitiesByType.get(entityType) || 0) + 1
        );
        
        // Log activity
        this.logActivity('entity_registered', { universalId, entityType });
        
        console.log(`✅ Registered entity: ${universalId} (${entityType})`);
        
        this.emit('entity:registered', entity);
        
        return entity;
    }
    
    /**
     * Create relationship between entities
     */
    createRelationship(fromId, toId, relationshipType, metadata = {}) {
        if (!this.entities.has(fromId) || !this.entities.has(toId)) {
            throw new Error('One or both entities do not exist');
        }
        
        if (!this.relationshipTypes[relationshipType]) {
            throw new Error(`Unknown relationship type: ${relationshipType}`);
        }
        
        const relationship = {
            id: `REL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            from: fromId,
            to: toId,
            type: relationshipType,
            
            // Metadata
            strength: metadata.strength || 1.0,
            context: metadata.context || {},
            
            // Timestamps
            created: Date.now(),
            modified: Date.now(),
            
            // State
            active: true,
            mutual: this.relationshipTypes[relationshipType].bidirectional
        };
        
        // Store relationship
        this.relationships.get(fromId).push(relationship);
        
        // If bidirectional, create reverse relationship
        if (relationship.mutual) {
            const reverseRel = {
                ...relationship,
                id: `${relationship.id}-R`,
                from: toId,
                to: fromId
            };
            this.relationships.get(toId).push(reverseRel);
        }
        
        // Update entity stats
        const fromEntity = this.entities.get(fromId);
        const toEntity = this.entities.get(toId);
        fromEntity.relationshipCount++;
        toEntity.relationshipCount++;
        
        // Update global stats
        this.stats.totalRelationships++;
        
        // Log activity
        this.logActivity('relationship_created', {
            from: fromId,
            to: toId,
            type: relationshipType
        });
        
        console.log(`🔗 Created relationship: ${fromId} -[${relationshipType}]-> ${toId}`);
        
        this.emit('relationship:created', relationship);
        
        return relationship;
    }
    
    /**
     * Record entity discovery
     */
    recordDiscovery(entityId, discoveredBy, context = {}) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }
        
        const discovery = {
            id: `DISC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            entityId,
            discoveredBy,
            
            // Discovery context
            method: context.method || 'exploration',
            location: context.location || null,
            worldPort: context.worldPort || null,
            
            // Timestamps
            discoveredAt: Date.now(),
            
            // Value
            significance: context.significance || 'normal',
            rewards: context.rewards || {},
            
            // Verification
            verified: false,
            verifiedBy: null,
            verifiedAt: null
        };
        
        // Store discovery
        if (!this.discoveries.has(entityId)) {
            this.discoveries.set(entityId, []);
        }
        this.discoveries.get(entityId).push(discovery);
        
        // Update entity stats
        const entity = this.entities.get(entityId);
        entity.discoveryCount++;
        entity.modified = Date.now();
        
        // Update global stats
        this.stats.totalDiscoveries++;
        
        // Log activity
        this.logActivity('entity_discovered', {
            entityId,
            discoveredBy,
            method: discovery.method
        });
        
        console.log(`🔍 Discovery recorded: ${discoveredBy} found ${entityId}`);
        
        this.emit('discovery:recorded', discovery);
        
        return discovery;
    }
    
    /**
     * Query entities by criteria
     */
    queryEntities(criteria = {}) {
        let results = Array.from(this.entities.values());
        
        // Filter by type
        if (criteria.type) {
            results = results.filter(e => e.entityType === criteria.type);
        }
        
        // Filter by tags
        if (criteria.tags && criteria.tags.length > 0) {
            results = results.filter(e => 
                criteria.tags.some(tag => e.tags.includes(tag))
            );
        }
        
        // Filter by world presence
        if (criteria.worldPort) {
            results = results.filter(e => 
                e.worldPresence.includes(criteria.worldPort)
            );
        }
        
        // Filter by verification status
        if (criteria.verified !== undefined) {
            results = results.filter(e => e.verified === criteria.verified);
        }
        
        // Filter by activity
        if (criteria.activeSince) {
            results = results.filter(e => e.accessed > criteria.activeSince);
        }
        
        // Sort results
        if (criteria.sortBy) {
            results.sort((a, b) => {
                switch (criteria.sortBy) {
                    case 'created':
                        return b.created - a.created;
                    case 'modified':
                        return b.modified - a.modified;
                    case 'relationships':
                        return b.relationshipCount - a.relationshipCount;
                    case 'discoveries':
                        return b.discoveryCount - a.discoveryCount;
                    case 'access':
                        return b.accessCount - a.accessCount;
                    default:
                        return 0;
                }
            });
        }
        
        // Limit results
        if (criteria.limit) {
            results = results.slice(0, criteria.limit);
        }
        
        return results;
    }
    
    /**
     * Get entity relationships
     */
    getRelationships(entityId, options = {}) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }
        
        let relationships = this.relationships.get(entityId) || [];
        
        // Filter by type
        if (options.type) {
            relationships = relationships.filter(r => r.type === options.type);
        }
        
        // Filter by direction
        if (options.direction === 'outgoing') {
            relationships = relationships.filter(r => r.from === entityId);
        } else if (options.direction === 'incoming') {
            relationships = relationships.filter(r => r.to === entityId);
        }
        
        // Include entity data
        if (options.includeEntities) {
            relationships = relationships.map(r => ({
                ...r,
                fromEntity: this.entities.get(r.from),
                toEntity: this.entities.get(r.to)
            }));
        }
        
        return relationships;
    }
    
    /**
     * Find shortest path between entities
     */
    findPath(fromId, toId, maxDepth = 6) {
        if (!this.entities.has(fromId) || !this.entities.has(toId)) {
            throw new Error('One or both entities do not exist');
        }
        
        if (fromId === toId) return [fromId];
        
        const visited = new Set();
        const queue = [[fromId]];
        
        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];
            
            if (path.length > maxDepth) continue;
            
            if (visited.has(current)) continue;
            visited.add(current);
            
            const relationships = this.relationships.get(current) || [];
            
            for (const rel of relationships) {
                const next = rel.to;
                
                if (next === toId) {
                    return [...path, toId];
                }
                
                if (!visited.has(next)) {
                    queue.push([...path, next]);
                }
            }
        }
        
        return null; // No path found
    }
    
    /**
     * Calculate entity influence score
     */
    calculateInfluence(entityId) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }
        
        const entity = this.entities.get(entityId);
        const relationships = this.relationships.get(entityId) || [];
        
        // Base score from entity properties
        let score = 0;
        score += entity.accessCount * 0.1;
        score += entity.relationshipCount * 1.0;
        score += entity.discoveryCount * 2.0;
        score += entity.verified ? 10 : 0;
        
        // Relationship influence
        let relationshipScore = 0;
        for (const rel of relationships) {
            const otherEntity = this.entities.get(rel.to);
            if (otherEntity) {
                relationshipScore += (otherEntity.relationshipCount * 0.1) * rel.strength;
            }
        }
        
        score += relationshipScore;
        
        // Time decay factor
        const ageInDays = (Date.now() - entity.created) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.exp(-ageInDays / 365); // Decay over a year
        
        return Math.round(score * (0.5 + 0.5 * decayFactor));
    }
    
    /**
     * Merge duplicate entities
     */
    async mergeEntities(primaryId, secondaryId) {
        if (!this.entities.has(primaryId) || !this.entities.has(secondaryId)) {
            throw new Error('One or both entities do not exist');
        }
        
        const primary = this.entities.get(primaryId);
        const secondary = this.entities.get(secondaryId);
        
        // Merge properties
        primary.tags = [...new Set([...primary.tags, ...secondary.tags])];
        primary.worldPresence = [...new Set([...primary.worldPresence, ...secondary.worldPresence])];
        primary.accessCount += secondary.accessCount;
        primary.relationshipCount += secondary.relationshipCount;
        primary.discoveryCount += secondary.discoveryCount;
        
        // Merge relationships
        const secondaryRels = this.relationships.get(secondaryId) || [];
        for (const rel of secondaryRels) {
            // Update relationship to point to primary
            if (rel.from === secondaryId) rel.from = primaryId;
            if (rel.to === secondaryId) rel.to = primaryId;
            
            // Add to primary's relationships
            this.relationships.get(primaryId).push(rel);
        }
        
        // Merge discoveries
        const secondaryDisc = this.discoveries.get(secondaryId) || [];
        if (!this.discoveries.has(primaryId)) {
            this.discoveries.set(primaryId, []);
        }
        this.discoveries.get(primaryId).push(...secondaryDisc);
        
        // Remove secondary entity
        this.entities.delete(secondaryId);
        this.typeIndex.get(secondary.entityType).delete(secondaryId);
        this.relationships.delete(secondaryId);
        this.discoveries.delete(secondaryId);
        
        // Update stats
        this.stats.totalEntities--;
        
        console.log(`🔀 Merged entity ${secondaryId} into ${primaryId}`);
        
        this.emit('entity:merged', { primary: primaryId, secondary: secondaryId });
        
        return primary;
    }
    
    /**
     * Generate universal ID
     */
    generateUniversalId(entityType, identifier) {
        const prefix = this.typePrefixes[entityType];
        
        // Create stable hash from identifier
        const hash = crypto.createHash('sha256')
            .update(`${entityType}:${identifier}`)
            .digest('hex')
            .substring(0, 8);
        
        // Calculate checksum
        const checksumInput = `${prefix}${hash}`;
        const checksum = checksumInput
            .split('')
            .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 10;
        
        return `${prefix}-${hash.toUpperCase()}-${checksum}`;
    }
    
    /**
     * Verify entity
     */
    verifyEntity(entityId, verifierId) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            throw new Error(`Entity ${entityId} does not exist`);
        }
        
        entity.verified = true;
        entity.verifiedBy = verifierId;
        entity.verifiedAt = Date.now();
        entity.modified = Date.now();
        
        console.log(`✅ Entity verified: ${entityId} by ${verifierId}`);
        
        this.emit('entity:verified', { entityId, verifierId });
        
        return entity;
    }
    
    /**
     * Access entity (updates access stats)
     */
    accessEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            throw new Error(`Entity ${entityId} does not exist`);
        }
        
        entity.accessed = Date.now();
        entity.accessCount++;
        
        return entity;
    }
    
    /**
     * Get registry statistics
     */
    getStatistics() {
        // Calculate most connected entities
        const connectionScores = Array.from(this.entities.values())
            .map(e => ({ id: e.universalId, score: e.relationshipCount }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        this.stats.mostConnectedEntities = connectionScores;
        
        return {
            ...this.stats,
            entitiesByType: Object.fromEntries(this.stats.entitiesByType),
            recentActivity: this.stats.recentActivity.slice(-50)
        };
    }
    
    /**
     * Log activity
     */
    logActivity(action, details) {
        const activity = {
            action,
            details,
            timestamp: Date.now()
        };
        
        this.stats.recentActivity.push(activity);
        
        // Keep only recent activities
        if (this.stats.recentActivity.length > 1000) {
            this.stats.recentActivity = this.stats.recentActivity.slice(-1000);
        }
    }
    
    /**
     * Export registry data
     */
    exportData(options = {}) {
        const data = {
            metadata: {
                registryId: this.registryId,
                exported: Date.now(),
                version: '1.0.0'
            },
            statistics: this.getStatistics()
        };
        
        if (options.includeEntities) {
            data.entities = Array.from(this.entities.values());
        }
        
        if (options.includeRelationships) {
            data.relationships = Object.fromEntries(
                Array.from(this.relationships.entries())
            );
        }
        
        if (options.includeDiscoveries) {
            data.discoveries = Object.fromEntries(
                Array.from(this.discoveries.entries())
            );
        }
        
        return data;
    }
}

module.exports = UniversalEntityRegistry;

// CLI Demo
if (require.main === module) {
    const registry = new UniversalEntityRegistry();
    
    console.log('\n🏷️ UNIVERSAL ENTITY REGISTRY DEMO\n');
    
    // Register some entities
    const player1 = registry.registerEntity('player', 'alice-123', {
        name: 'Alice',
        tags: ['beginner', 'coder'],
        worldPresence: [1000, 1001, 2000]
    });
    
    const world1000 = registry.registerEntity('world', 'world-1000', {
        name: 'Foundation World 1000',
        tags: ['tutorial', 'programming']
    });
    
    const lesson1 = registry.registerEntity('lesson', 'hello-world', {
        name: 'Hello World Lesson',
        tags: ['basic', 'programming']
    });
    
    const achievement1 = registry.registerEntity('achievement', 'first-steps', {
        name: 'First Steps',
        tags: ['beginner', 'milestone']
    });
    
    console.log('\n🔗 Creating relationships...');
    
    // Create relationships
    registry.createRelationship(player1.universalId, world1000.universalId, 'member');
    registry.createRelationship(lesson1.universalId, world1000.universalId, 'member');
    registry.createRelationship(player1.universalId, lesson1.universalId, 'owner');
    registry.createRelationship(achievement1.universalId, player1.universalId, 'unlocks');
    
    console.log('\n🔍 Recording discovery...');
    
    // Record discovery
    const discovery = registry.recordDiscovery(achievement1.universalId, player1.universalId, {
        method: 'lesson_completion',
        worldPort: 1000,
        significance: 'normal'
    });
    
    console.log('\n📊 Query examples:');
    
    // Query entities
    const playerEntities = registry.queryEntities({ type: 'player' });
    console.log(`  Players: ${playerEntities.length}`);
    
    const tutorialContent = registry.queryEntities({ tags: ['tutorial'] });
    console.log(`  Tutorial content: ${tutorialContent.length}`);
    
    console.log('\n🛤️ Finding path...');
    
    // Find path between entities
    const path = registry.findPath(lesson1.universalId, achievement1.universalId);
    console.log(`  Path: ${path ? path.join(' -> ') : 'No path found'}`);
    
    console.log('\n📈 Calculating influence...');
    
    // Calculate influence
    const influence = registry.calculateInfluence(player1.universalId);
    console.log(`  Alice's influence score: ${influence}`);
    
    console.log('\n📊 Registry Statistics:');
    const stats = registry.getStatistics();
    console.log(JSON.stringify(stats, null, 2));
}