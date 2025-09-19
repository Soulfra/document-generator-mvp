#!/usr/bin/env node

/**
 * FACTION-BASED ACCESS CONTROL
 * User permissions as faction membership
 * Role-based access as faction ranks
 * Security clearance as faction reputation
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class FactionAccessControl extends EventEmitter {
    constructor() {
        super();
        
        // Faction registry
        this.factions = new Map();
        
        // User memberships
        this.userMemberships = new Map();
        
        // Resource permissions
        this.resourcePermissions = new Map();
        
        // Faction relationships
        this.factionRelationships = new Map();
        
        // Initialize core factions
        this.initializeCoreFactions();
    }
    
    initializeCoreFactions() {
        console.log('🏰 INITIALIZING FACTION-BASED ACCESS CONTROL');
        
        // Blood Farmers Guild - Data cultivation faction
        this.createFaction('blood_farmers', {
            name: 'Blood Farmers Guild',
            description: 'Cultivators of pure data streams',
            color: '#8B0000',
            symbol: '🩸',
            ranks: [
                { name: 'Seedling', level: 0, reputation: 0, permissions: ['read_public'] },
                { name: 'Harvester', level: 1, reputation: 100, permissions: ['read_public', 'write_public', 'read_crops'] },
                { name: 'Cultivator', level: 2, reputation: 500, permissions: ['read_public', 'write_public', 'read_crops', 'write_crops', 'cleanse_data'] },
                { name: 'Blood Lord', level: 3, reputation: 1000, permissions: ['read_public', 'write_public', 'read_crops', 'write_crops', 'cleanse_data', 'create_diamonds'] },
                { name: 'Vampire Elder', level: 4, reputation: 5000, permissions: ['*'] }
            ],
            resources: {
                'data_streams': { base_access: 'Harvester', description: 'Raw data flows' },
                'cleansing_pools': { base_access: 'Cultivator', description: 'Data purification systems' },
                'blood_vaults': { base_access: 'Blood Lord', description: 'Secure data storage' },
                'diamond_forge': { base_access: 'Blood Lord', description: 'Value extraction systems' }
            },
            rivals: ['tech_purists'],
            allies: ['desert_wanderers']
        });
        
        // Desert Wanderers - Timing and synchronization faction
        this.createFaction('desert_wanderers', {
            name: 'Desert Wanderers Coalition',
            description: 'Masters of distributed timing',
            color: '#F4A460',
            symbol: '🏜️',
            ranks: [
                { name: 'Nomad', level: 0, reputation: 0, permissions: ['read_public'] },
                { name: 'Guide', level: 1, reputation: 150, permissions: ['read_public', 'read_timing', 'basic_sync'] },
                { name: 'Pathfinder', level: 2, reputation: 600, permissions: ['read_public', 'read_timing', 'basic_sync', 'distributed_sync', 'cache_access'] },
                { name: 'Oasis Keeper', level: 3, reputation: 1200, permissions: ['read_public', 'read_timing', 'basic_sync', 'distributed_sync', 'cache_access', 'resource_management'] },
                { name: 'Desert Sultan', level: 4, reputation: 6000, permissions: ['*'] }
            ],
            resources: {
                'timing_oasis': { base_access: 'Guide', description: 'Synchronization points' },
                'water_cache': { base_access: 'Pathfinder', description: 'Resource caching systems' },
                'caravan_routes': { base_access: 'Pathfinder', description: 'Distribution networks' },
                'sultan_palace': { base_access: 'Desert Sultan', description: 'Central command' }
            },
            rivals: ['speed_demons'],
            allies: ['blood_farmers', 'fitness_council']
        });
        
        // Presidential Fitness Council - Performance optimization faction
        this.createFaction('fitness_council', {
            name: 'Presidential Fitness Council',
            description: 'Benchmarkers of system excellence',
            color: '#FFD700',
            symbol: '🏅',
            ranks: [
                { name: 'Participant', level: 0, reputation: 0, permissions: ['read_public'] },
                { name: 'Bronze Medal', level: 1, reputation: 200, permissions: ['read_public', 'read_metrics', 'basic_profiling'] },
                { name: 'Silver Medal', level: 2, reputation: 700, permissions: ['read_public', 'read_metrics', 'basic_profiling', 'advanced_profiling', 'optimization_tools'] },
                { name: 'Gold Medal', level: 3, reputation: 1500, permissions: ['read_public', 'read_metrics', 'basic_profiling', 'advanced_profiling', 'optimization_tools', 'system_tuning'] },
                { name: 'Presidential', level: 4, reputation: 7000, permissions: ['*'] }
            ],
            resources: {
                'fitness_center': { base_access: 'Participant', description: 'Basic testing facilities' },
                'training_grounds': { base_access: 'Bronze Medal', description: 'Performance training' },
                'olympic_pool': { base_access: 'Silver Medal', description: 'Advanced optimization' },
                'presidential_suite': { base_access: 'Presidential', description: 'Ultimate performance' }
            },
            rivals: ['chaos_guild'],
            allies: ['desert_wanderers']
        });
        
        // Tech Purists - Traditional security faction (rivals to Blood Farmers)
        this.createFaction('tech_purists', {
            name: 'Tech Purist Order',
            description: 'Guardians of traditional security',
            color: '#4169E1',
            symbol: '🔒',
            ranks: [
                { name: 'Initiate', level: 0, reputation: 0, permissions: ['read_public'] },
                { name: 'Guardian', level: 1, reputation: 250, permissions: ['read_public', 'write_public', 'basic_security'] },
                { name: 'Enforcer', level: 2, reputation: 800, permissions: ['read_public', 'write_public', 'basic_security', 'advanced_security', 'audit_logs'] },
                { name: 'Architect', level: 3, reputation: 2000, permissions: ['read_public', 'write_public', 'basic_security', 'advanced_security', 'audit_logs', 'system_design'] },
                { name: 'Grand Master', level: 4, reputation: 8000, permissions: ['*'] }
            ],
            resources: {
                'firewall_fortress': { base_access: 'Guardian', description: 'Network defenses' },
                'encryption_vault': { base_access: 'Enforcer', description: 'Cryptographic systems' },
                'audit_tower': { base_access: 'Enforcer', description: 'Security monitoring' },
                'master_keys': { base_access: 'Grand Master', description: 'Root access' }
            },
            rivals: ['blood_farmers', 'chaos_guild'],
            allies: ['speed_demons']
        });
        
        // Set up faction relationships
        this.initializeFactionRelationships();
        
        console.log('🏰 Factions initialized:', this.factions.size);
    }
    
    /**
     * Create a new faction
     */
    createFaction(factionId, config) {
        const faction = {
            id: factionId,
            ...config,
            members: new Set(),
            totalReputation: 0,
            createdAt: Date.now()
        };
        
        this.factions.set(factionId, faction);
        console.log(`${config.symbol} Created faction: ${config.name}`);
        
        // Initialize faction relationships
        this.factionRelationships.set(factionId, {
            allies: new Set(config.allies || []),
            rivals: new Set(config.rivals || []),
            neutral: new Set()
        });
        
        return faction;
    }
    
    /**
     * Initialize faction relationships
     */
    initializeFactionRelationships() {
        // Set mutual relationships
        for (const [factionId, faction] of this.factions) {
            const relations = this.factionRelationships.get(factionId);
            
            // Ensure allies are mutual
            for (const allyId of faction.allies || []) {
                const allyRelations = this.factionRelationships.get(allyId);
                if (allyRelations) {
                    allyRelations.allies.add(factionId);
                }
            }
            
            // Ensure rivals are mutual
            for (const rivalId of faction.rivals || []) {
                const rivalRelations = this.factionRelationships.get(rivalId);
                if (rivalRelations) {
                    rivalRelations.rivals.add(factionId);
                }
            }
        }
    }
    
    /**
     * Register a user with initial faction
     */
    async registerUser(userId, initialFaction = 'blood_farmers') {
        console.log(`\n👤 REGISTERING USER: ${userId}`);
        
        const faction = this.factions.get(initialFaction);
        if (!faction) {
            throw new Error(`Faction ${initialFaction} not found`);
        }
        
        // Create user membership record
        const membership = {
            userId,
            factions: new Map(),
            primaryFaction: initialFaction,
            achievements: new Set(),
            joinedAt: Date.now()
        };
        
        // Add to initial faction
        membership.factions.set(initialFaction, {
            faction: initialFaction,
            rank: 0,
            reputation: 0,
            joinedAt: Date.now(),
            contributions: []
        });
        
        // Add user to faction members
        faction.members.add(userId);
        
        // Store membership
        this.userMemberships.set(userId, membership);
        
        console.log(`✅ User ${userId} joined ${faction.name} as ${faction.ranks[0].name}`);
        
        // Emit event
        this.emit('user_joined_faction', { userId, faction: initialFaction });
        
        return membership;
    }
    
    /**
     * Check if user has permission to access resource
     */
    async checkAccess(userId, resource, action = 'read') {
        console.log(`\n🔐 ACCESS CHECK: ${userId} → ${resource} (${action})`);
        
        const membership = this.userMemberships.get(userId);
        if (!membership) {
            console.log('❌ Access denied: User not registered');
            return { allowed: false, reason: 'User not registered' };
        }
        
        // Check each faction membership
        for (const [factionId, userFactionData] of membership.factions) {
            const faction = this.factions.get(factionId);
            const rank = faction.ranks[userFactionData.rank];
            
            // Check direct permissions
            const permission = `${action}_${resource}`;
            if (rank.permissions.includes(permission) || rank.permissions.includes('*')) {
                console.log(`✅ Access granted via ${faction.name} (${rank.name})`);
                return {
                    allowed: true,
                    faction: factionId,
                    rank: rank.name,
                    method: 'direct_permission'
                };
            }
            
            // Check faction resources
            const factionResource = faction.resources[resource];
            if (factionResource) {
                const requiredRank = faction.ranks.findIndex(r => r.name === factionResource.base_access);
                if (userFactionData.rank >= requiredRank) {
                    console.log(`✅ Access granted via ${faction.name} faction resource`);
                    return {
                        allowed: true,
                        faction: factionId,
                        rank: rank.name,
                        method: 'faction_resource'
                    };
                }
            }
            
            // Check allied faction resources
            const relations = this.factionRelationships.get(factionId);
            for (const allyId of relations.allies) {
                const allyFaction = this.factions.get(allyId);
                const allyResource = allyFaction.resources[resource];
                if (allyResource && userFactionData.reputation >= 500) {
                    console.log(`✅ Access granted via allied faction ${allyFaction.name}`);
                    return {
                        allowed: true,
                        faction: factionId,
                        rank: rank.name,
                        method: 'allied_faction',
                        ally: allyId
                    };
                }
            }
        }
        
        console.log('❌ Access denied: Insufficient permissions');
        return { allowed: false, reason: 'Insufficient permissions' };
    }
    
    /**
     * Grant reputation to user in faction
     */
    async grantReputation(userId, factionId, amount, reason = '') {
        const membership = this.userMemberships.get(userId);
        if (!membership) return;
        
        const userFactionData = membership.factions.get(factionId);
        if (!userFactionData) {
            // User not in faction, create minimal membership
            membership.factions.set(factionId, {
                faction: factionId,
                rank: 0,
                reputation: 0,
                joinedAt: Date.now(),
                contributions: []
            });
        }
        
        const faction = this.factions.get(factionId);
        const factionData = membership.factions.get(factionId);
        
        // Update reputation
        const oldRep = factionData.reputation;
        factionData.reputation += amount;
        faction.totalReputation += amount;
        
        // Record contribution
        factionData.contributions.push({
            amount,
            reason,
            timestamp: Date.now()
        });
        
        console.log(`\n💫 REPUTATION GRANTED: ${userId} gains ${amount} with ${faction.name}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   New total: ${factionData.reputation}`);
        
        // Check for rank up
        const oldRank = factionData.rank;
        for (let i = faction.ranks.length - 1; i >= 0; i--) {
            if (factionData.reputation >= faction.ranks[i].reputation) {
                if (i > oldRank) {
                    factionData.rank = i;
                    console.log(`\n🎉 RANK UP! ${userId} is now ${faction.ranks[i].name} in ${faction.name}`);
                    
                    // Emit rank up event
                    this.emit('user_ranked_up', {
                        userId,
                        faction: factionId,
                        oldRank: faction.ranks[oldRank].name,
                        newRank: faction.ranks[i].name
                    });
                }
                break;
            }
        }
        
        // Check for achievements
        await this.checkAchievements(userId, factionId);
        
        return factionData;
    }
    
    /**
     * Create faction war/alliance
     */
    async declareFactionRelation(faction1Id, faction2Id, relationType) {
        const validRelations = ['ally', 'rival', 'neutral'];
        if (!validRelations.includes(relationType)) {
            throw new Error(`Invalid relation type: ${relationType}`);
        }
        
        const faction1 = this.factions.get(faction1Id);
        const faction2 = this.factions.get(faction2Id);
        
        if (!faction1 || !faction2) {
            throw new Error('One or both factions not found');
        }
        
        console.log(`\n⚔️  FACTION RELATION DECLARED`);
        console.log(`   ${faction1.name} → ${relationType} → ${faction2.name}`);
        
        // Update relationships
        const relations1 = this.factionRelationships.get(faction1Id);
        const relations2 = this.factionRelationships.get(faction2Id);
        
        // Remove from all relation sets
        relations1.allies.delete(faction2Id);
        relations1.rivals.delete(faction2Id);
        relations1.neutral.delete(faction2Id);
        relations2.allies.delete(faction1Id);
        relations2.rivals.delete(faction1Id);
        relations2.neutral.delete(faction1Id);
        
        // Add to appropriate set
        if (relationType === 'ally') {
            relations1.allies.add(faction2Id);
            relations2.allies.add(faction1Id);
            console.log(`   🤝 Alliance formed!`);
        } else if (relationType === 'rival') {
            relations1.rivals.add(faction2Id);
            relations2.rivals.add(faction1Id);
            console.log(`   ⚔️  War declared!`);
        } else {
            relations1.neutral.add(faction2Id);
            relations2.neutral.add(faction1Id);
            console.log(`   😐 Neutrality established`);
        }
        
        // Emit event
        this.emit('faction_relation_changed', {
            faction1: faction1Id,
            faction2: faction2Id,
            relation: relationType
        });
    }
    
    /**
     * Check for faction-based achievements
     */
    async checkAchievements(userId, factionId) {
        const membership = this.userMemberships.get(userId);
        const faction = this.factions.get(factionId);
        const factionData = membership.factions.get(factionId);
        
        // Multi-faction member
        if (membership.factions.size >= 3 && !membership.achievements.has('diplomat')) {
            membership.achievements.add('diplomat');
            console.log(`\n🏆 ACHIEVEMENT UNLOCKED: Diplomat (Member of 3+ factions)`);
        }
        
        // High rank achievement
        if (factionData.rank >= 3 && !membership.achievements.has('faction_elite')) {
            membership.achievements.add('faction_elite');
            console.log(`\n🏆 ACHIEVEMENT UNLOCKED: Faction Elite (Reached high rank)`);
        }
        
        // Reputation milestone
        if (factionData.reputation >= 5000 && !membership.achievements.has('legendary_reputation')) {
            membership.achievements.add('legendary_reputation');
            console.log(`\n🏆 ACHIEVEMENT UNLOCKED: Legendary Reputation (5000+ in one faction)`);
        }
    }
    
    /**
     * Get user faction status
     */
    getUserFactionStatus(userId) {
        const membership = this.userMemberships.get(userId);
        if (!membership) return null;
        
        const status = {
            userId,
            primaryFaction: membership.primaryFaction,
            factions: [],
            achievements: Array.from(membership.achievements),
            totalReputation: 0
        };
        
        for (const [factionId, factionData] of membership.factions) {
            const faction = this.factions.get(factionId);
            const rank = faction.ranks[factionData.rank];
            
            status.factions.push({
                faction: faction.name,
                rank: rank.name,
                reputation: factionData.reputation,
                permissions: rank.permissions,
                joinedAt: factionData.joinedAt
            });
            
            status.totalReputation += factionData.reputation;
        }
        
        return status;
    }
    
    /**
     * Get faction leaderboard
     */
    getFactionLeaderboard(factionId) {
        const faction = this.factions.get(factionId);
        if (!faction) return null;
        
        const members = [];
        
        for (const userId of faction.members) {
            const membership = this.userMemberships.get(userId);
            const factionData = membership.factions.get(factionId);
            
            members.push({
                userId,
                rank: faction.ranks[factionData.rank].name,
                reputation: factionData.reputation,
                contributions: factionData.contributions.length
            });
        }
        
        // Sort by reputation
        members.sort((a, b) => b.reputation - a.reputation);
        
        return {
            faction: faction.name,
            totalMembers: faction.members.size,
            totalReputation: faction.totalReputation,
            topMembers: members.slice(0, 10),
            allies: Array.from(this.factionRelationships.get(factionId).allies),
            rivals: Array.from(this.factionRelationships.get(factionId).rivals)
        };
    }
}

// Export for use in other systems
module.exports = FactionAccessControl;

// Demo functionality
if (require.main === module) {
    async function runDemo() {
        console.log('🎮 FACTION ACCESS CONTROL DEMO\n');
        
        const fac = new FactionAccessControl();
        
        // Register users
        await fac.registerUser('alice', 'blood_farmers');
        await fac.registerUser('bob', 'desert_wanderers');
        await fac.registerUser('charlie', 'fitness_council');
        await fac.registerUser('eve', 'tech_purists');
        
        // Grant reputation
        await fac.grantReputation('alice', 'blood_farmers', 150, 'First harvest');
        await fac.grantReputation('alice', 'blood_farmers', 400, 'Major cleansing');
        await fac.grantReputation('bob', 'desert_wanderers', 700, 'Perfect synchronization');
        
        // Test access control
        console.log('\n🔐 ACCESS CONTROL TESTS:');
        
        await fac.checkAccess('alice', 'data_streams');
        await fac.checkAccess('alice', 'cleansing_pools');
        await fac.checkAccess('alice', 'timing_oasis'); // Allied faction resource
        await fac.checkAccess('bob', 'caravan_routes');
        await fac.checkAccess('eve', 'blood_vaults'); // Rival faction resource
        
        // Declare faction war
        await fac.declareFactionRelation('blood_farmers', 'tech_purists', 'rival');
        
        // Show faction status
        console.log('\n📊 USER FACTION STATUS:');
        console.log(JSON.stringify(fac.getUserFactionStatus('alice'), null, 2));
        
        // Show faction leaderboard
        console.log('\n🏆 BLOOD FARMERS LEADERBOARD:');
        console.log(JSON.stringify(fac.getFactionLeaderboard('blood_farmers'), null, 2));
        
        console.log('\n✨ Faction system demonstration complete!');
    }
    
    runDemo().catch(console.error);
}