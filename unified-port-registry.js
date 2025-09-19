#!/usr/bin/env node

/**
 * 🌐 UNIFIED PORT REGISTRY SYSTEM
 * 
 * Maps 1000 ports to educational game worlds with domain routing
 * Implements the "infinity-1 collapse to zero" pattern
 * 
 * Port Allocation:
 * - 1000-1999: Foundation Worlds (basic concepts)
 * - 2000-2999: Intermediate Worlds (applied learning)
 * - 3000-3999: Advanced Worlds (complex systems)
 * - 4000-4999: Specialty Worlds (niche topics)
 * - 5000-5999: Challenge Worlds (competitions)
 * - 6000-6999: Social Worlds (collaboration)
 * - 7000-7999: Creative Worlds (content creation)
 * - 8000-8999: Economic Worlds (trading/markets)
 * - 9000-9998: Master Worlds (teaching others)
 * - 9999: The Nexus (central hub - collapse point)
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UnifiedPortRegistry extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.registryId = `REGISTRY-${Date.now()}`;
        
        // Port world categories
        this.worldCategories = {
            foundation: { range: [1000, 1999], name: 'Foundation Worlds', difficulty: 'beginner' },
            intermediate: { range: [2000, 2999], name: 'Intermediate Worlds', difficulty: 'intermediate' },
            advanced: { range: [3000, 3999], name: 'Advanced Worlds', difficulty: 'advanced' },
            specialty: { range: [4000, 4999], name: 'Specialty Worlds', difficulty: 'expert' },
            challenge: { range: [5000, 5999], name: 'Challenge Worlds', difficulty: 'competitive' },
            social: { range: [6000, 6999], name: 'Social Worlds', difficulty: 'collaborative' },
            creative: { range: [7000, 7999], name: 'Creative Worlds', difficulty: 'artistic' },
            economic: { range: [8000, 8999], name: 'Economic Worlds', difficulty: 'strategic' },
            master: { range: [9000, 9998], name: 'Master Worlds', difficulty: 'teacher' },
            nexus: { range: [9999, 9999], name: 'The Nexus', difficulty: 'infinite' }
        };
        
        // Registry state
        this.portWorlds = new Map(); // port -> world configuration
        this.domainMappings = new Map(); // domain -> port
        this.activePlayers = new Map(); // playerId -> current port
        this.worldConnections = new Map(); // port -> connected ports
        
        // Educational content mapping
        this.educationalContent = {
            // Foundation topics (1000-1999)
            1000: { topic: 'Hello World', skills: ['basic-programming', 'syntax'] },
            1001: { topic: 'Variables & Types', skills: ['data-types', 'memory'] },
            1002: { topic: 'Control Flow', skills: ['conditionals', 'loops'] },
            1003: { topic: 'Functions', skills: ['modularity', 'parameters'] },
            1004: { topic: 'Arrays & Lists', skills: ['data-structures', 'iteration'] },
            1005: { topic: 'Objects & Classes', skills: ['oop', 'encapsulation'] },
            
            // Intermediate topics (2000-2999)
            2000: { topic: 'Web Scraping Ethics', skills: ['ethics', 'legal'] },
            2001: { topic: 'API Integration', skills: ['http', 'rest'] },
            2002: { topic: 'Database Design', skills: ['sql', 'normalization'] },
            2003: { topic: 'Security Basics', skills: ['encryption', 'auth'] },
            
            // Advanced topics (3000-3999)
            3000: { topic: 'MEV Discovery', skills: ['defi', 'arbitrage'] },
            3001: { topic: 'Machine Learning', skills: ['ai', 'models'] },
            3002: { topic: 'Distributed Systems', skills: ['consensus', 'scaling'] },
            
            // Economic worlds (8000-8999)
            8000: { topic: 'Market Making', skills: ['liquidity', 'trading'] },
            8001: { topic: 'Game Theory', skills: ['strategy', 'nash-equilibrium'] },
            
            // The Nexus
            9999: { topic: 'Universal Knowledge', skills: ['all', 'mastery'] }
        };
        
        // World generation templates
        this.worldTemplates = {
            programming: ['syntax-city', 'variable-valley', 'function-fortress'],
            security: ['crypto-castle', 'firewall-forest', 'vulnerability-village'],
            economics: ['market-metropolis', 'arbitrage-archipelago', 'defi-dominion'],
            creative: ['pixel-paradise', 'music-mountains', 'story-sanctum']
        };
        
        // Initialize registry
        this.initialize();
    }
    
    async initialize() {
        console.log('🌐 Initializing Unified Port Registry...');
        console.log(`📍 Total worlds: 1000 (ports 1000-9999)`);
        console.log(`🏛️ Categories: ${Object.keys(this.worldCategories).length}`);
        
        // Generate initial world mappings
        await this.generateWorldMappings();
        
        // Create world connections (portals between worlds)
        await this.createWorldConnections();
        
        // Initialize domain routing
        await this.setupDomainRouting();
        
        console.log('✅ Port Registry initialized!');
        this.emit('registry:ready', {
            totalWorlds: this.portWorlds.size,
            categories: Object.keys(this.worldCategories)
        });
    }
    
    /**
     * Generate world mappings for all ports
     */
    async generateWorldMappings() {
        console.log('🗺️ Generating world mappings...');
        
        for (const [category, config] of Object.entries(this.worldCategories)) {
            const [startPort, endPort] = config.range;
            
            for (let port = startPort; port <= endPort; port++) {
                const world = await this.generateWorld(port, category, config);
                this.portWorlds.set(port, world);
                
                // Create domain mapping
                const domain = `world${port}.educational.game`;
                this.domainMappings.set(domain, port);
            }
        }
        
        console.log(`✅ Generated ${this.portWorlds.size} world mappings`);
    }
    
    /**
     * Generate a specific world configuration
     */
    async generateWorld(port, category, categoryConfig) {
        const educationalContent = this.educationalContent[port] || {
            topic: `World ${port} Knowledge`,
            skills: ['general', 'exploration']
        };
        
        // Generate unique world characteristics
        const worldSeed = crypto.createHash('sha256').update(`${port}`).digest('hex');
        const worldType = this.selectWorldType(category);
        
        return {
            port,
            category,
            name: this.generateWorldName(port, category),
            domain: `world${port}.educational.game`,
            
            // Educational content
            topic: educationalContent.topic,
            skills: educationalContent.skills,
            difficulty: categoryConfig.difficulty,
            
            // World characteristics
            type: worldType,
            theme: this.selectTheme(worldSeed),
            size: this.calculateWorldSize(port),
            
            // Game mechanics
            objectives: this.generateObjectives(port, category),
            challenges: this.generateChallenges(categoryConfig.difficulty),
            rewards: this.generateRewards(port),
            
            // Connections
            portals: [], // Will be populated by createWorldConnections
            prerequisites: this.calculatePrerequisites(port),
            
            // State
            created: Date.now(),
            active: true,
            players: 0,
            completions: 0,
            
            // Special properties
            isMevWorld: category === 'economic' || port >= 8000,
            hasInjuryMechanics: category !== 'foundation',
            allowsPvp: category === 'challenge' || category === 'economic',
            
            // Content generation
            canGenerateCards: true,
            canGenerateMvps: port >= 3000,
            supportsUserContent: port >= 7000
        };
    }
    
    /**
     * Create connections between worlds (portals)
     */
    async createWorldConnections() {
        console.log('🌉 Creating world connections...');
        
        // Each world connects to:
        // 1. Adjacent worlds in same category
        // 2. Corresponding worlds in next category
        // 3. Special connections based on content
        
        for (const [port, world] of this.portWorlds) {
            const connections = new Set();
            
            // Adjacent worlds
            if (this.portWorlds.has(port - 1) && this.isSameCategory(port, port - 1)) {
                connections.add(port - 1);
            }
            if (this.portWorlds.has(port + 1) && this.isSameCategory(port, port + 1)) {
                connections.add(port + 1);
            }
            
            // Next category progression
            const nextCategoryPort = port + 1000;
            if (this.portWorlds.has(nextCategoryPort)) {
                connections.add(nextCategoryPort);
            }
            
            // All worlds connect to The Nexus
            if (port !== 9999) {
                connections.add(9999);
            }
            
            // The Nexus connects to all category starts
            if (port === 9999) {
                [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].forEach(p => {
                    connections.add(p);
                });
            }
            
            world.portals = Array.from(connections);
            this.worldConnections.set(port, connections);
        }
        
        console.log('✅ World connections established');
    }
    
    /**
     * Setup domain routing for web access
     */
    async setupDomainRouting() {
        console.log('🌐 Setting up domain routing...');
        
        // Create routing table
        this.routingTable = {
            'educational.game': 9999, // Main domain -> The Nexus
            'api.educational.game': 9998, // API endpoint
            'admin.educational.game': 9997, // Admin panel
        };
        
        // Add world-specific routes
        for (const [domain, port] of this.domainMappings) {
            this.routingTable[domain] = port;
        }
        
        console.log(`✅ Domain routing configured for ${Object.keys(this.routingTable).length} domains`);
    }
    
    /**
     * Register a player entering a world
     */
    async enterWorld(playerId, port) {
        const world = this.portWorlds.get(port);
        if (!world) {
            throw new Error(`World ${port} does not exist`);
        }
        
        // Check prerequisites
        const meetsPrereqs = await this.checkPrerequisites(playerId, world.prerequisites);
        if (!meetsPrereqs) {
            throw new Error(`Player does not meet prerequisites for world ${port}`);
        }
        
        // Update player location
        const previousPort = this.activePlayers.get(playerId);
        this.activePlayers.set(playerId, port);
        
        // Update world stats
        world.players++;
        
        console.log(`🎮 Player ${playerId} entered world ${port} (${world.name})`);
        
        this.emit('player:entered-world', {
            playerId,
            port,
            worldName: world.name,
            previousPort
        });
        
        return {
            world,
            availableActions: this.getAvailableActions(world),
            objectives: world.objectives,
            portals: world.portals
        };
    }
    
    /**
     * Generate educational content from text
     */
    async generateContentFromText(text, outputType = 'card') {
        console.log(`📝 Generating ${outputType} from text...`);
        
        const contentId = crypto.randomBytes(8).toString('hex');
        
        switch (outputType) {
            case 'card':
                return this.generateTradingCard(text, contentId);
            
            case 'world':
                return this.generateMiniWorld(text, contentId);
            
            case 'challenge':
                return this.generateChallenge(text, contentId);
            
            case 'mvp':
                return this.generateMvpSpec(text, contentId);
            
            default:
                throw new Error(`Unknown output type: ${outputType}`);
        }
    }
    
    /**
     * Generate a trading card from text
     */
    async generateTradingCard(text, cardId) {
        // Extract key concepts
        const concepts = this.extractConcepts(text);
        const rarity = this.calculateRarity(concepts);
        
        return {
            id: `CARD-${cardId}`,
            type: 'trading-card',
            name: this.generateCardName(concepts),
            description: text.slice(0, 200),
            
            // Card properties
            rarity,
            power: Math.floor(Math.random() * 100) + rarity * 10,
            defense: Math.floor(Math.random() * 100) + rarity * 5,
            
            // Educational value
            skills: concepts.skills || ['general'],
            unlocks: concepts.unlocks || [],
            
            // Trading properties
            tradeable: true,
            value: rarity * 100,
            
            // Visual
            image: `card-${cardId}.png`, // Would be generated
            borderColor: this.getRarityColor(rarity),
            
            created: Date.now()
        };
    }
    
    /**
     * Check if player can travel between worlds
     */
    async canTravel(playerId, fromPort, toPort) {
        const fromWorld = this.portWorlds.get(fromPort);
        const toWorld = this.portWorlds.get(toPort);
        
        if (!fromWorld || !toWorld) return false;
        
        // Check if worlds are connected
        if (!fromWorld.portals.includes(toPort)) return false;
        
        // Check prerequisites
        return this.checkPrerequisites(playerId, toWorld.prerequisites);
    }
    
    /**
     * Get world status and statistics
     */
    getWorldStatus(port) {
        const world = this.portWorlds.get(port);
        if (!world) return null;
        
        return {
            ...world,
            currentPlayers: Array.from(this.activePlayers.entries())
                .filter(([_, p]) => p === port)
                .map(([playerId]) => playerId),
            connectionStatus: {
                incoming: Array.from(this.portWorlds.values())
                    .filter(w => w.portals.includes(port))
                    .map(w => w.port),
                outgoing: world.portals
            }
        };
    }
    
    /**
     * Get registry overview
     */
    getRegistryOverview() {
        const overview = {
            totalWorlds: this.portWorlds.size,
            activePlayers: this.activePlayers.size,
            categories: {},
            popularWorlds: [],
            recentActivity: []
        };
        
        // Category statistics
        for (const [category, config] of Object.entries(this.worldCategories)) {
            const [start, end] = config.range;
            const worlds = Array.from(this.portWorlds.values())
                .filter(w => w.port >= start && w.port <= end);
            
            overview.categories[category] = {
                name: config.name,
                worldCount: worlds.length,
                totalPlayers: worlds.reduce((sum, w) => sum + w.players, 0),
                totalCompletions: worlds.reduce((sum, w) => sum + w.completions, 0)
            };
        }
        
        // Most popular worlds
        overview.popularWorlds = Array.from(this.portWorlds.values())
            .sort((a, b) => b.players - a.players)
            .slice(0, 10)
            .map(w => ({
                port: w.port,
                name: w.name,
                players: w.players,
                topic: w.topic
            }));
        
        return overview;
    }
    
    // Helper methods
    
    generateWorldName(port, category) {
        const prefixes = {
            foundation: ['Learning', 'Discovery', 'Basic'],
            intermediate: ['Advanced', 'Applied', 'Practical'],
            advanced: ['Master', 'Expert', 'Complex'],
            specialty: ['Unique', 'Special', 'Rare'],
            challenge: ['Arena', 'Battle', 'Competition'],
            social: ['Community', 'Collaborative', 'Team'],
            creative: ['Artist', 'Creator', 'Design'],
            economic: ['Market', 'Trade', 'Finance'],
            master: ['Sage', 'Mentor', 'Guide'],
            nexus: ['Central', 'Universal', 'Infinite']
        };
        
        const suffixes = ['Haven', 'Realm', 'Domain', 'Sphere', 'Zone'];
        const prefix = prefixes[category][port % prefixes[category].length];
        const suffix = suffixes[port % suffixes.length];
        
        return `${prefix} ${suffix} ${port}`;
    }
    
    selectWorldType(category) {
        const types = {
            foundation: 'tutorial',
            intermediate: 'practice',
            advanced: 'challenge',
            specialty: 'unique',
            challenge: 'pvp',
            social: 'multiplayer',
            creative: 'sandbox',
            economic: 'trading',
            master: 'teaching',
            nexus: 'hub'
        };
        
        return types[category] || 'standard';
    }
    
    selectTheme(seed) {
        const themes = [
            'cyberpunk', 'fantasy', 'sci-fi', 'steampunk',
            'nature', 'abstract', 'retro', 'minimalist'
        ];
        
        const index = parseInt(seed.substring(0, 2), 16) % themes.length;
        return themes[index];
    }
    
    calculateWorldSize(port) {
        // Higher ports have larger worlds
        const baseSize = 100;
        const scaleFactor = Math.floor(port / 1000);
        return baseSize * (1 + scaleFactor * 0.5);
    }
    
    generateObjectives(port, category) {
        const baseObjectives = [
            'Complete tutorial',
            'Collect 10 knowledge points',
            'Solve 3 puzzles'
        ];
        
        if (category === 'challenge') {
            baseObjectives.push('Win 5 battles', 'Achieve top 10 ranking');
        }
        
        if (category === 'economic') {
            baseObjectives.push('Make 1000 profit', 'Complete 10 trades');
        }
        
        return baseObjectives;
    }
    
    generateChallenges(difficulty) {
        const challenges = {
            beginner: ['Basic puzzle', 'Simple quiz', 'Tutorial completion'],
            intermediate: ['Timed challenge', 'Code debugging', 'Pattern recognition'],
            advanced: ['Complex algorithm', 'System design', 'Security audit'],
            expert: ['Research project', 'Novel solution', 'Teach others']
        };
        
        return challenges[difficulty] || challenges.beginner;
    }
    
    generateRewards(port) {
        return {
            xp: 100 * Math.ceil(port / 1000),
            coins: 50 * Math.ceil(port / 1000),
            items: [`Badge-${port}`, `Title-World${port}Master`],
            unlocks: port < 9000 ? [`World-${port + 1}`, `World-${port + 1000}`] : []
        };
    }
    
    calculatePrerequisites(port) {
        const prereqs = [];
        
        // Foundation worlds have no prerequisites
        if (port >= 1000 && port < 2000) return prereqs;
        
        // Other worlds require previous category completion
        const categoryStart = Math.floor(port / 1000) * 1000;
        if (categoryStart > 1000) {
            prereqs.push({
                type: 'world_completion',
                worldPort: categoryStart - 1000,
                description: `Complete a Foundation world`
            });
        }
        
        // Higher worlds may have skill requirements
        if (port >= 3000) {
            prereqs.push({
                type: 'skill_level',
                skill: 'programming',
                level: Math.floor(port / 1000),
                description: `Programming level ${Math.floor(port / 1000)}`
            });
        }
        
        return prereqs;
    }
    
    isSameCategory(port1, port2) {
        return Math.floor(port1 / 1000) === Math.floor(port2 / 1000);
    }
    
    async checkPrerequisites(playerId, prerequisites) {
        // In a real implementation, check player's achievements
        // For now, return true for testing
        return true;
    }
    
    getAvailableActions(world) {
        const actions = ['explore', 'learn', 'practice'];
        
        if (world.allowsPvp) actions.push('battle');
        if (world.canGenerateCards) actions.push('create-card');
        if (world.supportsUserContent) actions.push('build');
        
        return actions;
    }
    
    extractConcepts(text) {
        // Simple concept extraction - in production, use NLP
        const keywords = text.toLowerCase().split(/\s+/);
        return {
            skills: keywords.filter(w => w.length > 4).slice(0, 3),
            unlocks: []
        };
    }
    
    calculateRarity(concepts) {
        // 1 = common, 5 = legendary
        const rarityScore = concepts.skills.length + Math.floor(Math.random() * 3);
        return Math.min(5, Math.max(1, rarityScore));
    }
    
    getRarityColor(rarity) {
        const colors = ['#gray', '#green', '#blue', '#purple', '#gold'];
        return colors[rarity - 1] || '#gray';
    }
    
    generateCardName(concepts) {
        const adjectives = ['Ancient', 'Mystic', 'Digital', 'Quantum', 'Cyber'];
        const nouns = ['Knowledge', 'Wisdom', 'Power', 'Secret', 'Code'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adj} ${noun}`;
    }
    
    generateMiniWorld(text, worldId) {
        return {
            id: `MINIWORLD-${worldId}`,
            type: 'mini-world',
            description: text,
            size: 10, // Small procedural world
            generated: Date.now()
        };
    }
    
    generateChallenge(text, challengeId) {
        return {
            id: `CHALLENGE-${challengeId}`,
            type: 'challenge',
            description: text,
            difficulty: 'dynamic',
            rewards: { xp: 100, coins: 50 },
            generated: Date.now()
        };
    }
    
    generateMvpSpec(text, mvpId) {
        return {
            id: `MVP-${mvpId}`,
            type: 'mvp-specification',
            description: text,
            components: ['frontend', 'backend', 'database'],
            estimatedTime: '30 minutes',
            generated: Date.now()
        };
    }
}

module.exports = UnifiedPortRegistry;

// CLI Demo
if (require.main === module) {
    const registry = new UnifiedPortRegistry();
    
    registry.on('registry:ready', async (info) => {
        console.log('\n🌐 UNIFIED PORT REGISTRY READY!');
        console.log(`📊 Total worlds: ${info.totalWorlds}`);
        console.log(`📁 Categories: ${info.categories.join(', ')}`);
        
        // Demo: Show some worlds
        console.log('\n🎮 Sample Worlds:');
        [1000, 2000, 3000, 8000, 9999].forEach(port => {
            const world = registry.getWorldStatus(port);
            console.log(`  Port ${port}: ${world.name} - ${world.topic}`);
        });
        
        // Demo: Enter a world
        console.log('\n🎯 Demo: Player entering world 1000...');
        const entry = await registry.enterWorld('player-123', 1000);
        console.log(`  ✅ Entered ${entry.world.name}`);
        console.log(`  📍 Available actions: ${entry.availableActions.join(', ')}`);
        console.log(`  🌉 Portal connections: ${entry.portals.join(', ')}`);
        
        // Demo: Generate content
        console.log('\n📝 Demo: Generating trading card...');
        const card = await registry.generateContentFromText(
            'A powerful spell that teaches JavaScript async/await patterns',
            'card'
        );
        console.log(`  ✅ Generated: ${card.name} (Rarity: ${card.rarity})`);
        
        // Show overview
        console.log('\n📊 Registry Overview:');
        const overview = registry.getRegistryOverview();
        console.log(JSON.stringify(overview, null, 2));
    });
}