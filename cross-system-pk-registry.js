#!/usr/bin/env node

/**
 * 🔑🎮 CROSS-SYSTEM PK REGISTRY
 * 
 * Maps all "public keys" (PK) across asymmetric systems
 * PK = Public Key / Player Killer / Penalty Kill metaphors
 * 
 * Shares public information while keeping private implementation hidden:
 * - Shadow aliases (public function names)
 * - Ring access levels (public hierarchy)
 * - Event types (public messages)
 * - Platform identities (public profiles)
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CrossSystemPKRegistry extends EventEmitter {
    constructor() {
        super();
        
        // Registry of all public keys (PK) across systems
        this.pkRegistry = new Map();
        
        // Shadow alias mappings (public function names)
        this.shadowAliases = new Map();
        
        // Ring hierarchy (public access levels)
        this.ringHierarchy = {
            0: { name: 'Public Ring', access: 'read-only', trust: 0.1 },
            1: { name: 'Verified Ring', access: 'basic-write', trust: 0.3 },
            2: { name: 'Trusted Ring', access: 'extended', trust: 0.5 },
            3: { name: 'Elite Ring', access: 'privileged', trust: 0.7 },
            4: { name: 'Core Ring', access: 'admin', trust: 0.85 },
            5: { name: 'Inner Ring', access: 'system', trust: 0.95 },
            6: { name: 'Master Ring', access: 'root', trust: 1.0 }
        };
        
        // Event transformation rules (public message types)
        this.eventTransformations = new Map();
        
        // Platform identity mappings (public profiles)
        this.platformIdentities = new Map();
        
        // Domain registry integration
        this.domainRegistry = null;
        
        // Gaming metaphors for PK
        this.pkMetaphors = {
            osrs: {
                wilderness: 'cross-system-boundary',
                combat_level: 'ring-access-level',
                pk_skull: 'public-key-exposed',
                protect_item: 'private-key-hidden',
                teleblock: 'access-denied',
                safezone: 'symmetric-encryption'
            },
            nhl: {
                penalty_kill: 'asymmetric-defense',
                power_play: 'privileged-access',
                even_strength: 'normal-operations',
                short_handed: 'limited-access',
                goalie_pulled: 'all-access-exposed'
            }
        };
        
        console.log('🔑 Cross-System PK Registry initializing...');
        this.init();
    }
    
    async init() {
        await this.loadDomainRegistry();
        await this.discoverShadowAliases();
        await this.mapRingCommunication();
        await this.registerEventTypes();
        await this.indexPlatformIdentities();
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🔑🎮 CROSS-SYSTEM PK REGISTRY ACTIVE                ║
║                                                              ║
║  Shadow Aliases: ${this.shadowAliases.size.toString().padStart(11)}                      ║
║  Ring Levels: ${Object.keys(this.ringHierarchy).length.toString().padStart(14)}                      ║
║  Event Types: ${this.eventTransformations.size.toString().padStart(14)}                      ║
║  Platform IDs: ${this.platformIdentities.size.toString().padStart(13)}                      ║
║                                                              ║
║  PK Mode: Asymmetric (Public Info / Private Implementation) ║
╚══════════════════════════════════════════════════════════════╝`);
        
        this.emit('ready');
    }
    
    async loadDomainRegistry() {
        try {
            const registryPath = path.join(__dirname, 'DOMAIN-REGISTRY.json');
            const registryData = await fs.readFile(registryPath, 'utf8');
            this.domainRegistry = JSON.parse(registryData);
            
            // Extract public routing information
            for (const [domain, config] of Object.entries(this.domainRegistry.domains || {})) {
                const pk = {
                    domain,
                    zone: config.zone?.type || 'unknown',
                    publicEndpoints: {
                        main: config.routing?.mainEndpoint,
                        api: config.routing?.apiPath,
                        websocket: config.routing?.websocket
                    },
                    crossDomainPortals: config.routing?.crossDomainPortals || [],
                    publicFeatures: config.functionality?.features || [],
                    accessLevel: config.functionality?.accessLevel || 'private'
                };
                
                this.registerPK('domain', domain, pk);
            }
            
            console.log(`✅ Loaded ${Object.keys(this.domainRegistry.domains || {}).length} domains`);
        } catch (error) {
            console.warn('⚠️ Could not load domain registry:', error.message);
            this.domainRegistry = { domains: {} };
        }
    }
    
    async discoverShadowAliases() {
        console.log('🔍 Discovering shadow aliases...');
        
        // Standard AI provider shadow aliases
        const providers = ['claude', 'cursor', 'ollama', 'openai', 'local'];
        const functions = ['complete', 'generate', 'embed', 'analyze', 'reason', 'code', 'chat', 'vision'];
        
        for (const provider of providers) {
            for (const func of functions) {
                const alias = `shadow:${provider}:${func}`;
                const pk = {
                    alias,
                    provider,
                    function: func,
                    public: true,
                    requiresAuth: provider !== 'local',
                    costPerCall: this.getProviderCost(provider),
                    capabilities: this.getProviderCapabilities(provider, func)
                };
                
                this.shadowAliases.set(alias, pk);
                this.registerPK('shadow-alias', alias, pk);
            }
        }
        
        // Crypto arbitrage shadow aliases
        const cryptoAliases = [
            'shadow:arbitrage:detect',
            'shadow:arbitrage:execute',
            'shadow:arbitrage:monitor',
            'shadow:trading:place-order',
            'shadow:trading:cancel-order',
            'shadow:alerts:discord',
            'shadow:alerts:telegram'
        ];
        
        for (const alias of cryptoAliases) {
            const [, category, action] = alias.split(':');
            const pk = {
                alias,
                category,
                action,
                public: true,
                requiresAuth: true,
                riskLevel: category === 'trading' ? 'high' : 'medium'
            };
            
            this.shadowAliases.set(alias, pk);
            this.registerPK('shadow-alias', alias, pk);
        }
        
        console.log(`✅ Discovered ${this.shadowAliases.size} shadow aliases`);
    }
    
    async mapRingCommunication() {
        console.log('🗺️ Mapping ring communication patterns...');
        
        // Public ring communication rules
        const ringRules = [
            // Downward communication (public)
            { from: 6, to: 5, type: 'command', public: true },
            { from: 5, to: 4, type: 'directive', public: true },
            { from: 4, to: 3, type: 'instruction', public: true },
            { from: 3, to: 2, type: 'guidance', public: true },
            { from: 2, to: 1, type: 'advice', public: true },
            { from: 1, to: 0, type: 'broadcast', public: true },
            
            // Upward communication (restricted)
            { from: 0, to: 1, type: 'request', public: false },
            { from: 1, to: 2, type: 'proposal', public: false },
            { from: 2, to: 3, type: 'recommendation', public: false },
            { from: 3, to: 4, type: 'report', public: false },
            { from: 4, to: 5, type: 'analysis', public: false },
            { from: 5, to: 6, type: 'insight', public: false },
            
            // Lateral communication (peer-to-peer)
            { from: 'any', to: 'same', type: 'sync', public: true }
        ];
        
        for (const rule of ringRules) {
            const pk = {
                fromRing: rule.from,
                toRing: rule.to,
                messageType: rule.type,
                isPublic: rule.public,
                trustRequired: this.calculateTrustRequired(rule),
                primeInterval: this.getPrimeInterval(rule.from)
            };
            
            const key = `ring:${rule.from}-${rule.to}:${rule.type}`;
            this.registerPK('ring-communication', key, pk);
        }
        
        console.log(`✅ Mapped ${ringRules.length} ring communication patterns`);
    }
    
    async registerEventTypes() {
        console.log('📡 Registering public event types...');
        
        // Public event types that can be broadcast
        const eventTypes = [
            // Crypto events
            { type: 'arbitrage:detected', public: true, transformations: ['minimal', 'detailed', 'full'] },
            { type: 'arbitrage:executed', public: false, transformations: ['success', 'masked'] },
            { type: 'price:update', public: true, transformations: ['ticker', 'ohlcv', 'depth'] },
            { type: 'alert:triggered', public: true, transformations: ['summary', 'notification'] },
            
            // System events
            { type: 'system:health', public: true, transformations: ['status', 'metrics'] },
            { type: 'auth:attempt', public: false, transformations: ['logged', 'anonymized'] },
            { type: 'ring:promotion', public: true, transformations: ['announcement', 'ceremony'] },
            { type: 'pk:registered', public: true, transformations: ['basic', 'extended'] },
            
            // Gaming events
            { type: 'player:killed', public: true, transformations: ['broadcast', 'leaderboard'] },
            { type: 'penalty:applied', public: true, transformations: ['announcement', 'stats'] },
            { type: 'achievement:unlocked', public: true, transformations: ['notification', 'showcase'] }
        ];
        
        for (const event of eventTypes) {
            const pk = {
                eventType: event.type,
                isPublic: event.public,
                transformations: event.transformations,
                defaultTransformation: event.transformations[0],
                routingRules: this.getEventRoutingRules(event.type)
            };
            
            this.eventTransformations.set(event.type, pk);
            this.registerPK('event-type', event.type, pk);
        }
        
        console.log(`✅ Registered ${eventTypes.length} event types`);
    }
    
    async indexPlatformIdentities() {
        console.log('🎭 Indexing platform identities...');
        
        // Public platform profiles used for trust
        const platforms = [
            { name: 'github', weight: 0.3, verifiable: true },
            { name: 'spotify', weight: 0.2, verifiable: true },
            { name: 'apple', weight: 0.25, verifiable: true },
            { name: 'discord', weight: 0.15, verifiable: true },
            { name: 'telegram', weight: 0.1, verifiable: true },
            { name: 'twitter', weight: 0.2, verifiable: false },
            { name: 'reddit', weight: 0.15, verifiable: false }
        ];
        
        for (const platform of platforms) {
            const pk = {
                platform: platform.name,
                trustWeight: platform.weight,
                verifiable: platform.verifiable,
                publicProfile: true,
                authEndpoint: `auth:${platform.name}`,
                requiredFields: this.getPlatformRequiredFields(platform.name)
            };
            
            this.platformIdentities.set(platform.name, pk);
            this.registerPK('platform-identity', platform.name, pk);
        }
        
        console.log(`✅ Indexed ${platforms.length} platform identities`);
    }
    
    registerPK(category, identifier, publicData) {
        const pkEntry = {
            category,
            identifier,
            publicData,
            registeredAt: Date.now(),
            hash: this.generatePKHash(category, identifier, publicData)
        };
        
        const key = `${category}:${identifier}`;
        this.pkRegistry.set(key, pkEntry);
        
        this.emit('pk:registered', {
            category,
            identifier,
            isPublic: true,
            hash: pkEntry.hash
        });
    }
    
    generatePKHash(category, identifier, data) {
        const content = JSON.stringify({ category, identifier, data });
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
    
    getProviderCost(provider) {
        const costs = {
            claude: 0.000015,
            openai: 0.00003,
            cursor: 0,
            ollama: 0,
            local: 0
        };
        return costs[provider] || 0;
    }
    
    getProviderCapabilities(provider, func) {
        const capabilities = {
            claude: ['reasoning', 'analysis', 'code', 'vision', 'long-context'],
            cursor: ['code', 'refactor', 'debug', 'completion'],
            ollama: ['code', 'chat', 'embeddings', 'reasoning'],
            openai: ['reasoning', 'functions', 'vision', 'code', 'audio'],
            local: ['code', 'simple-tasks']
        };
        
        return capabilities[provider] || [];
    }
    
    calculateTrustRequired(rule) {
        if (rule.public) return 0;
        
        const fromRing = typeof rule.from === 'number' ? rule.from : 0;
        const toRing = typeof rule.to === 'number' ? rule.to : 0;
        
        // Higher trust required for upward communication
        if (fromRing < toRing) {
            return this.ringHierarchy[toRing]?.trust || 0.5;
        }
        
        return this.ringHierarchy[fromRing]?.trust || 0.1;
    }
    
    getPrimeInterval(ring) {
        const primes = [2, 3, 5, 7, 11, 13, 17];
        return primes[ring] || 19;
    }
    
    getEventRoutingRules(eventType) {
        const [category] = eventType.split(':');
        
        const rules = {
            arbitrage: { minRing: 2, broadcast: true, persistence: true },
            price: { minRing: 0, broadcast: true, persistence: false },
            alert: { minRing: 1, broadcast: true, persistence: true },
            system: { minRing: 3, broadcast: false, persistence: true },
            auth: { minRing: 4, broadcast: false, persistence: true },
            ring: { minRing: 2, broadcast: true, persistence: true },
            pk: { minRing: 0, broadcast: true, persistence: false },
            player: { minRing: 0, broadcast: true, persistence: true },
            penalty: { minRing: 1, broadcast: true, persistence: true },
            achievement: { minRing: 0, broadcast: true, persistence: true }
        };
        
        return rules[category] || { minRing: 1, broadcast: false, persistence: false };
    }
    
    getPlatformRequiredFields(platform) {
        const fields = {
            github: ['username', 'id', 'avatar_url'],
            spotify: ['id', 'display_name', 'email'],
            apple: ['sub', 'email', 'email_verified'],
            discord: ['id', 'username', 'discriminator'],
            telegram: ['id', 'username', 'first_name'],
            twitter: ['id', 'username', 'verified'],
            reddit: ['id', 'name', 'created_utc']
        };
        
        return fields[platform] || ['id'];
    }
    
    // Public API for querying PK information
    async queryPK(category, identifier) {
        const key = `${category}:${identifier}`;
        const pk = this.pkRegistry.get(key);
        
        if (!pk) {
            return null;
        }
        
        // Return only public data
        return {
            category: pk.category,
            identifier: pk.identifier,
            publicData: pk.publicData,
            hash: pk.hash,
            isPublic: true
        };
    }
    
    async getAllPKsByCategory(category) {
        const pks = [];
        
        for (const [key, pk] of this.pkRegistry) {
            if (pk.category === category) {
                pks.push({
                    identifier: pk.identifier,
                    publicData: pk.publicData,
                    hash: pk.hash
                });
            }
        }
        
        return pks;
    }
    
    async resolveShadowAlias(alias) {
        return this.shadowAliases.get(alias);
    }
    
    async getRingAccess(ringLevel) {
        return this.ringHierarchy[ringLevel] || null;
    }
    
    async getEventTransformation(eventType, targetRing = 0) {
        const event = this.eventTransformations.get(eventType);
        if (!event) return null;
        
        // Select transformation based on target ring level
        const transformationIndex = Math.min(targetRing, event.transformations.length - 1);
        return {
            eventType,
            transformation: event.transformations[transformationIndex],
            isPublic: event.isPublic,
            routingRules: event.routingRules
        };
    }
    
    async verifyPlatformIdentity(platform, profileData) {
        const platformConfig = this.platformIdentities.get(platform);
        if (!platformConfig) return { verified: false, reason: 'Unknown platform' };
        
        // Check required fields
        for (const field of platformConfig.requiredFields) {
            if (!profileData[field]) {
                return { verified: false, reason: `Missing required field: ${field}` };
            }
        }
        
        return {
            verified: true,
            trustWeight: platformConfig.trustWeight,
            platform,
            publicProfile: profileData
        };
    }
    
    // Gaming metaphor methods
    isInWilderness(identifier) {
        // Check if operating in cross-system boundary (PK zone)
        const pk = this.pkRegistry.get(identifier);
        return pk && pk.publicData.requiresAuth;
    }
    
    getCombatLevel(identifier) {
        // Get ring access level (combat level in OSRS terms)
        const pk = this.pkRegistry.get(identifier);
        if (!pk) return 0;
        
        if (pk.category === 'ring-communication') {
            return pk.publicData.fromRing || 0;
        }
        
        return 0;
    }
    
    isPKSkull(identifier) {
        // Check if public key is exposed (skulled in wilderness)
        const pk = this.pkRegistry.get(identifier);
        return pk && pk.publicData.isPublic;
    }
    
    // API endpoints
    async createAPIRoutes(app) {
        // Query PK information
        app.get('/api/pk/:category/:identifier', async (req, res) => {
            const { category, identifier } = req.params;
            const pk = await this.queryPK(category, identifier);
            
            if (pk) {
                res.json(pk);
            } else {
                res.status(404).json({ error: 'PK not found' });
            }
        });
        
        // List all PKs by category
        app.get('/api/pk/:category', async (req, res) => {
            const { category } = req.params;
            const pks = await this.getAllPKsByCategory(category);
            res.json({ category, count: pks.length, pks });
        });
        
        // Resolve shadow alias
        app.get('/api/shadow/:provider/:function', async (req, res) => {
            const { provider, function: func } = req.params;
            const alias = `shadow:${provider}:${func}`;
            const resolved = await this.resolveShadowAlias(alias);
            
            if (resolved) {
                res.json(resolved);
            } else {
                res.status(404).json({ error: 'Shadow alias not found' });
            }
        });
        
        // Get ring access information
        app.get('/api/ring/:level', async (req, res) => {
            const level = parseInt(req.params.level);
            const access = await this.getRingAccess(level);
            
            if (access) {
                res.json({ ring: level, ...access });
            } else {
                res.status(404).json({ error: 'Invalid ring level' });
            }
        });
        
        // Verify platform identity
        app.post('/api/verify/:platform', async (req, res) => {
            const { platform } = req.params;
            const result = await this.verifyPlatformIdentity(platform, req.body);
            res.json(result);
        });
        
        console.log('🛣️ PK Registry API routes created');
    }
}

module.exports = CrossSystemPKRegistry;