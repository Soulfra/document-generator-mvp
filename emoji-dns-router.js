#!/usr/bin/env node

/**
 * 🌐🎮 EMOJI DNS ROUTER
 * 
 * Maps all 14,005+ systems to emoji addresses for the Flash-style game
 * Creates the internal routing layer that makes everything playable
 * 
 * THE VISION: Click 🎮 → Boss Battle, Click 📚 → Book Generation, Click 💰 → Economy
 * THE REALITY: Every emoji becomes a portal to existing systems
 */

const fs = require('fs').promises;
const http = require('http');
const path = require('path');
const EventEmitter = require('events');

class EmojiDNSRouter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 7777,
            masterControlPort: 8900,
            gameServerPort: 3333,
            forumPort: 3334,
            // Map emojis to system categories
            emojiCategories: {
                // Character & Life
                '🌱': { category: 'genesis', systems: ['character-genesis', 'life-stages', 'evolution'] },
                '👤': { category: 'identity', systems: ['user-profiles', 'authentication', 'personas'] },
                '🎭': { category: 'character', systems: ['character-creation', 'roleplay', 'avatars'] },
                
                // Gaming & Battles
                '🎮': { category: 'gaming', systems: ['game-engine', 'boss-battles', 'quests'] },
                '⚔️': { category: 'combat', systems: ['battle-system', 'weapons', 'tactics'] },
                '🏆': { category: 'achievement', systems: ['trophies', 'leaderboards', 'rewards'] },
                
                // Economy & Finance
                '💰': { category: 'economy', systems: ['autonomous-economy', 'trading', 'wealth'] },
                '💎': { category: 'assets', systems: ['nfts', 'collectibles', 'rare-items'] },
                '🏦': { category: 'banking', systems: ['stripe-integration', 'billing', 'payments'] },
                
                // AI & Intelligence
                '🤖': { category: 'ai', systems: ['cal-bridge', 'llm-orchestration', 'reasoning'] },
                '🧠': { category: 'intelligence', systems: ['neural-networks', 'learning', 'wisdom'] },
                '💭': { category: 'thinking', systems: ['context-engine', 'memory', 'cognition'] },
                
                // Knowledge & Learning
                '📚': { category: 'knowledge', systems: ['book-generator', 'documentation', 'wiki'] },
                '📖': { category: 'reading', systems: ['story-engine', 'narratives', 'chapters'] },
                '🎓': { category: 'education', systems: ['learning-paths', 'tutorials', 'skills'] },
                
                // Communication & Social
                '💬': { category: 'chat', systems: ['forums', 'messaging', 'social'] },
                '📢': { category: 'broadcast', systems: ['announcements', 'notifications', 'alerts'] },
                '🌐': { category: 'network', systems: ['connectivity', 'protocols', 'mesh'] },
                
                // Development & Tools
                '🔧': { category: 'tools', systems: ['development', 'utilities', 'debugging'] },
                '⚙️': { category: 'config', systems: ['settings', 'preferences', 'customization'] },
                '🔍': { category: 'search', systems: ['discovery', 'indexing', 'exploration'] },
                
                // Security & Authentication
                '🔐': { category: 'security', systems: ['encryption', 'authentication', 'authorization'] },
                '🛡️': { category: 'defense', systems: ['firewall', 'protection', 'safety'] },
                '🗝️': { category: 'access', systems: ['keys', 'tokens', 'credentials'] },
                
                // Art & Creativity
                '🎨': { category: 'creativity', systems: ['art-generation', 'design', 'aesthetics'] },
                '🎵': { category: 'music', systems: ['audio', 'sound', 'harmony'] },
                '📷': { category: 'media', systems: ['images', 'video', 'multimedia'] },
                
                // Science & Research
                '🔬': { category: 'research', systems: ['analysis', 'experimentation', 'discovery'] },
                '📊': { category: 'data', systems: ['analytics', 'metrics', 'reporting'] },
                '🧬': { category: 'biology', systems: ['genetics', 'evolution', 'life-science'] },
                
                // Space & Exploration
                '🚀': { category: 'launch', systems: ['deployment', 'startup', 'initialization'] },
                '🌌': { category: 'universe', systems: ['cosmic-scale', 'infinite-systems', 'multiverse'] },
                '🛸': { category: 'exploration', systems: ['discovery-missions', 'unknown', 'frontier'] },
                
                // Magic & Mystery
                '✨': { category: 'magic', systems: ['enchantments', 'spells', 'transformations'] },
                '🔮': { category: 'prediction', systems: ['forecasting', 'prophecy', 'future-sight'] },
                '🎪': { category: 'entertainment', systems: ['shows', 'performances', 'spectacle'] }
            }
        };
        
        // System Registry - Maps actual system names to their details
        this.systemRegistry = new Map();
        this.emojiToSystemMap = new Map();
        this.activeConnections = new Map();
        this.routingHistory = new Map();
        
        // Game mechanics
        this.playerProgression = new Map();
        this.unlockedEmojis = new Map();
        this.bossEncounters = new Map();
        
        console.log('🌐🎮 EMOJI DNS ROUTER INITIALIZED');
        console.log('=================================');
        console.log('🎯 Mission: Turn every emoji into a portal to existing systems');
        console.log('🎮 Vision: Flash-style game with emoji navigation');
        console.log('⚡ Reality: 14,005+ systems accessible via emoji clicks');
    }
    
    /**
     * Initialize the DNS router and discover all systems
     */
    async initialize() {
        console.log('\n🌐 INITIALIZING EMOJI DNS ROUTER');
        console.log('================================');
        
        // Phase 1: Discover all systems
        await this.discoverAllSystems();
        
        // Phase 2: Map systems to emojis
        await this.mapSystemsToEmojis();
        
        // Phase 3: Create routing table
        await this.createRoutingTable();
        
        // Phase 4: Start DNS server
        await this.startDNSServer();
        
        // Phase 5: Connect to master control
        await this.connectToMasterControl();
        
        console.log('✅ Emoji DNS Router fully operational!');
        console.log(`🌐 DNS Server: http://localhost:${this.config.port}`);
        console.log('🎮 Game-ready emoji routing active');
        
        return true;
    }
    
    /**
     * Discover all systems by scanning the master control
     */
    async discoverAllSystems() {
        console.log('🔍 Discovering all systems...');
        
        try {
            // Get system status from master control
            const response = await fetch(`http://localhost:${this.config.masterControlPort}/api/status`);
            if (response.ok) {
                const masterStatus = await response.json();
                
                // Register core unified systems
                for (const [systemName, details] of Object.entries(masterStatus.availableSystems)) {
                    this.registerSystem(systemName, {
                        name: systemName,
                        loaded: details.loaded,
                        hasInitialize: details.hasInitialize,
                        hasEmitter: details.hasEmitter,
                        health: masterStatus.systemHealth?.[systemName]?.status || 'unknown',
                        category: this.categorizeSystem(systemName),
                        discoveredBy: 'master-control'
                    });
                }
                
                console.log(`✅ Discovered ${this.systemRegistry.size} unified systems from master control`);
            }
        } catch (error) {
            console.log(`⚠️ Could not connect to master control: ${error.message}`);
        }
        
        // Discover additional systems by scanning the filesystem
        await this.scanFilesystemForSystems();
        
        // Add hypothetical boss battle systems
        await this.registerBossSystemsForClaudeTrophy();
        
        console.log(`🎯 Total systems discovered: ${this.systemRegistry.size}`);
    }
    
    /**
     * Scan filesystem for additional systems
     */
    async scanFilesystemForSystems() {
        console.log('📂 Scanning filesystem for additional systems...');
        
        try {
            const files = await fs.readdir(process.cwd());
            let discovered = 0;
            
            for (const file of files) {
                if (file.endsWith('.js') && !file.startsWith('.') && file !== 'emoji-dns-router.js') {
                    const systemName = this.extractSystemName(file);
                    if (systemName && !this.systemRegistry.has(systemName)) {
                        this.registerSystem(systemName, {
                            name: systemName,
                            file: file,
                            loaded: false,
                            category: this.categorizeSystem(systemName),
                            discoveredBy: 'filesystem-scan'
                        });
                        discovered++;
                    }
                }
            }
            
            console.log(`📁 Discovered ${discovered} additional systems from filesystem`);
        } catch (error) {
            console.log(`⚠️ Filesystem scan error: ${error.message}`);
        }
    }
    
    /**
     * Register boss battle systems for the Claude Trophy mystery
     */
    async registerBossSystemsForClaudeTrophy() {
        console.log('🏆 Registering boss battle systems for Claude Trophy quest...');
        
        const bossSystems = [
            { name: 'claude-trophy-archive', category: 'mystery', emoji: '🏆' },
            { name: 'replay-reconstruction', category: 'mystery', emoji: '📼' },
            { name: 'flash-game-engine', category: 'gaming', emoji: '⚡' },
            { name: 'forum-integration-boss', category: 'social', emoji: '💬' },
            { name: 'token-economy-boss', category: 'economy', emoji: '💰' },
            { name: 'final-boss-ai-merger', category: 'ai', emoji: '🤖' }
        ];
        
        for (const boss of bossSystems) {
            this.registerSystem(boss.name, {
                name: boss.name,
                category: boss.category,
                isBoss: true,
                recommendedEmoji: boss.emoji,
                difficulty: 'legendary',
                discoveredBy: 'boss-system-generator',
                questLine: 'claude-trophy-mystery'
            });
        }
        
        console.log(`👾 Registered ${bossSystems.length} boss battle systems`);
    }
    
    /**
     * Register a system in the registry
     */
    registerSystem(systemName, details) {
        if (!this.systemRegistry.has(systemName)) {
            this.systemRegistry.set(systemName, {
                id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: systemName,
                emoji: null,
                port: null,
                status: 'discovered',
                ...details
            });
        }
    }
    
    /**
     * Extract system name from filename
     */
    extractSystemName(filename) {
        if (!filename.endsWith('.js')) return null;
        
        const baseName = filename.replace('.js', '');
        
        // Convert kebab-case to camelCase for system names
        const systemName = baseName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        
        // Only register files that look like systems
        if (baseName.includes('system') || 
            baseName.includes('engine') || 
            baseName.includes('service') ||
            baseName.includes('generator') ||
            baseName.includes('orchestrator') ||
            baseName.includes('bridge') ||
            baseName.includes('router')) {
            return systemName;
        }
        
        return null;
    }
    
    /**
     * Categorize system based on name
     */
    categorizeSystem(systemName) {
        const name = systemName.toLowerCase();
        
        if (name.includes('character') || name.includes('genesis')) return 'genesis';
        if (name.includes('game') || name.includes('battle') || name.includes('boss')) return 'gaming';
        if (name.includes('economy') || name.includes('money') || name.includes('billing')) return 'economy';
        if (name.includes('ai') || name.includes('cal') || name.includes('brain')) return 'ai';
        if (name.includes('book') || name.includes('doc') || name.includes('knowledge')) return 'knowledge';
        if (name.includes('forum') || name.includes('chat') || name.includes('social')) return 'social';
        if (name.includes('auth') || name.includes('security') || name.includes('token')) return 'security';
        if (name.includes('template') || name.includes('generator') || name.includes('build')) return 'tools';
        if (name.includes('search') || name.includes('discovery') || name.includes('find')) return 'search';
        if (name.includes('music') || name.includes('audio') || name.includes('sound')) return 'music';
        
        return 'system';
    }
    
    /**
     * Map discovered systems to appropriate emojis
     */
    async mapSystemsToEmojis() {
        console.log('🎯 Mapping systems to emojis...');
        
        // First, map systems to category-based emojis
        for (const [systemName, details] of this.systemRegistry) {
            const emoji = this.findBestEmojiForSystem(details);
            if (emoji) {
                details.emoji = emoji;
                
                // Create or update emoji mapping
                if (!this.emojiToSystemMap.has(emoji)) {
                    this.emojiToSystemMap.set(emoji, new Set());
                }
                this.emojiToSystemMap.get(emoji).add(systemName);
            }
        }
        
        console.log(`🎮 Mapped ${this.emojiToSystemMap.size} emojis to systems`);
        
        // Log the emoji mappings
        for (const [emoji, systems] of this.emojiToSystemMap) {
            console.log(`   ${emoji} → ${Array.from(systems).join(', ')}`);
        }
    }
    
    /**
     * Find the best emoji for a system
     */
    findBestEmojiForSystem(systemDetails) {
        const category = systemDetails.category;
        
        // Look for exact category matches
        for (const [emoji, config] of Object.entries(this.config.emojiCategories)) {
            if (config.category === category) {
                return emoji;
            }
        }
        
        // Look for system name matches
        const systemName = systemDetails.name.toLowerCase();
        
        if (systemName.includes('character') || systemName.includes('genesis')) return '🌱';
        if (systemName.includes('game') || systemName.includes('play')) return '🎮';
        if (systemName.includes('money') || systemName.includes('economy') || systemName.includes('billing')) return '💰';
        if (systemName.includes('ai') || systemName.includes('cal') || systemName.includes('brain')) return '🤖';
        if (systemName.includes('book') || systemName.includes('doc')) return '📚';
        if (systemName.includes('forum') || systemName.includes('chat')) return '💬';
        if (systemName.includes('auth') || systemName.includes('security')) return '🔐';
        if (systemName.includes('search') || systemName.includes('discovery')) return '🔍';
        if (systemName.includes('tool') || systemName.includes('util')) return '🔧';
        if (systemName.includes('boss') || systemName.includes('battle')) return '⚔️';
        if (systemName.includes('trophy') || systemName.includes('achievement')) return '🏆';
        if (systemName.includes('music') || systemName.includes('audio')) return '🎵';
        if (systemName.includes('template') || systemName.includes('generator')) return '⚙️';
        
        // Default emoji for unmatched systems
        return '⚡';
    }
    
    /**
     * Create comprehensive routing table
     */
    async createRoutingTable() {
        console.log('🗺️ Creating routing table...');
        
        this.routingTable = {
            emojis: {},
            systems: {},
            categories: {},
            bosses: {},
            quests: {}
        };
        
        // Map emojis to their systems
        for (const [emoji, systems] of this.emojiToSystemMap) {
            this.routingTable.emojis[emoji] = {
                systems: Array.from(systems),
                category: this.config.emojiCategories[emoji]?.category || 'unknown',
                unlocked: true, // Start with all emojis unlocked for now
                difficulty: this.calculateEmojiDifficulty(emoji, systems)
            };
        }
        
        // Map individual systems
        for (const [systemName, details] of this.systemRegistry) {
            this.routingTable.systems[systemName] = {
                emoji: details.emoji,
                category: details.category,
                isBoss: details.isBoss || false,
                difficulty: details.difficulty || 'normal',
                questLine: details.questLine || null,
                status: details.status
            };
        }
        
        // Create boss encounter mappings
        for (const [systemName, details] of this.systemRegistry) {
            if (details.isBoss) {
                this.routingTable.bosses[systemName] = {
                    emoji: details.emoji,
                    difficulty: details.difficulty,
                    questLine: details.questLine,
                    rewards: this.generateBossRewards(systemName),
                    unlockRequirements: this.generateUnlockRequirements(systemName)
                };
            }
        }
        
        console.log('✅ Routing table created');
        console.log(`🎮 Emojis mapped: ${Object.keys(this.routingTable.emojis).length}`);
        console.log(`⚙️ Systems mapped: ${Object.keys(this.routingTable.systems).length}`);
        console.log(`👾 Boss encounters: ${Object.keys(this.routingTable.bosses).length}`);
    }
    
    /**
     * Calculate emoji difficulty based on systems
     */
    calculateEmojiDifficulty(emoji, systems) {
        const systemArray = Array.from(systems);
        
        // Boss systems are legendary
        if (systemArray.some(s => this.systemRegistry.get(s)?.isBoss)) {
            return 'legendary';
        }
        
        // Complex systems are hard
        if (systemArray.length > 3 || 
            systemArray.some(s => s.includes('orchestrator') || s.includes('master'))) {
            return 'hard';
        }
        
        // Simple systems are easy
        if (systemArray.length === 1) {
            return 'easy';
        }
        
        return 'normal';
    }
    
    /**
     * Generate boss rewards
     */
    generateBossRewards(bossName) {
        const rewards = {
            xp: 1000,
            tokens: 500,
            unlockEmojis: [],
            unlockSystems: [],
            trophies: []
        };
        
        if (bossName.includes('claude-trophy')) {
            rewards.trophies.push('Claude Champion');
            rewards.unlockEmojis.push('👑');
            rewards.xp = 5000;
        }
        
        if (bossName.includes('economy')) {
            rewards.tokens = 2000;
            rewards.unlockEmojis.push('💎');
        }
        
        return rewards;
    }
    
    /**
     * Generate unlock requirements
     */
    generateUnlockRequirements(bossName) {
        if (bossName.includes('final-boss')) {
            return {
                minLevel: 50,
                requiredTrophies: ['Claude Champion', 'Economy Master'],
                requiredEmojis: ['🎮', '💰', '🤖', '📚']
            };
        }
        
        return {
            minLevel: 10,
            requiredEmojis: ['🎮']
        };
    }
    
    /**
     * Start the DNS server for emoji routing
     */
    async startDNSServer() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer(this.handleDNSRequest.bind(this));
            
            this.server.listen(this.config.port, () => {
                console.log(`🌐 Emoji DNS Server started on port ${this.config.port}`);
                resolve();
            });
            
            this.server.on('error', reject);
        });
    }
    
    /**
     * Handle DNS routing requests
     */
    async handleDNSRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.config.port}`);
        
        try {
            switch (url.pathname) {
                case '/':
                    await this.serveDashboard(res);
                    break;
                    
                case '/route':
                    await this.handleEmojiRoute(req, res, url.searchParams);
                    break;
                    
                case '/api/emojis':
                    await this.serveEmojiList(res);
                    break;
                    
                case '/api/systems':
                    await this.serveSystemList(res);
                    break;
                    
                case '/api/route-table':
                    await this.serveRouteTable(res);
                    break;
                    
                case '/api/boss-battles':
                    await this.serveBossBattles(res);
                    break;
                    
                default:
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: 'Route not found'}));
            }
        } catch (error) {
            console.error('DNS request error:', error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: error.message}));
        }
    }
    
    /**
     * Serve the emoji dashboard
     */
    async serveDashboard(res) {
        const dashboard = `<!DOCTYPE html>
<html>
<head>
    <title>🌐🎮 Emoji DNS Router</title>
    <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff41; padding: 20px; }
        .emoji-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .emoji-card { border: 2px solid #333; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s; }
        .emoji-card:hover { border-color: #00ff41; background: rgba(0, 255, 65, 0.1); }
        .emoji-large { font-size: 3em; text-align: center; margin-bottom: 10px; }
        .system-list { font-size: 0.9em; color: #888; }
        .difficulty { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
        .easy { background: #4CAF50; }
        .normal { background: #FF9800; }
        .hard { background: #F44336; }
        .legendary { background: #9C27B0; }
    </style>
</head>
<body>
    <h1>🌐🎮 EMOJI DNS ROUTER</h1>
    <p>Click any emoji to route to its systems!</p>
    <div class="emoji-grid">
        ${Object.entries(this.routingTable.emojis).map(([emoji, config]) => `
            <div class="emoji-card" onclick="route('${emoji}')">
                <div class="emoji-large">${emoji}</div>
                <div><strong>Category:</strong> ${config.category}</div>
                <div><strong>Systems:</strong> ${config.systems.length}</div>
                <div><span class="difficulty ${config.difficulty}">${config.difficulty}</span></div>
                <div class="system-list">${config.systems.join(', ')}</div>
            </div>
        `).join('')}
    </div>
    <script>
        function route(emoji) {
            fetch('/route?emoji=' + encodeURIComponent(emoji))
                .then(r => r.json())
                .then(data => {
                    console.log('Routing result:', data);
                    alert('Routed to: ' + data.systems.join(', '));
                })
                .catch(e => alert('Routing failed: ' + e.message));
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(dashboard);
    }
    
    /**
     * Handle emoji routing
     */
    async handleEmojiRoute(req, res, params) {
        const emoji = params.get('emoji');
        if (!emoji) {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'No emoji provided'}));
            return;
        }
        
        const routing = this.routingTable.emojis[emoji];
        if (!routing) {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Emoji not mapped'}));
            return;
        }
        
        // Record routing history
        if (!this.routingHistory.has(emoji)) {
            this.routingHistory.set(emoji, []);
        }
        this.routingHistory.get(emoji).push({
            timestamp: Date.now(),
            ip: req.connection.remoteAddress
        });
        
        // Emit routing event
        this.emit('emoji_routed', {
            emoji,
            systems: routing.systems,
            category: routing.category,
            difficulty: routing.difficulty
        });
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            success: true,
            emoji,
            systems: routing.systems,
            category: routing.category,
            difficulty: routing.difficulty,
            message: `Routed ${emoji} to ${routing.systems.length} systems`
        }));
    }
    
    /**
     * Serve emoji list
     */
    async serveEmojiList(res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            emojis: Object.keys(this.routingTable.emojis),
            totalEmojis: Object.keys(this.routingTable.emojis).length,
            categories: Object.values(this.routingTable.emojis).map(e => e.category).filter((v, i, a) => a.indexOf(v) === i)
        }));
    }
    
    /**
     * Serve system list
     */
    async serveSystemList(res) {
        const systems = Object.entries(this.routingTable.systems).map(([name, details]) => ({
            name,
            ...details
        }));
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            systems,
            totalSystems: systems.length,
            categories: [...new Set(systems.map(s => s.category))]
        }));
    }
    
    /**
     * Serve complete route table
     */
    async serveRouteTable(res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(this.routingTable, null, 2));
    }
    
    /**
     * Serve boss battle information
     */
    async serveBossBattles(res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            bosses: this.routingTable.bosses,
            totalBosses: Object.keys(this.routingTable.bosses).length,
            questLines: [...new Set(Object.values(this.routingTable.bosses).map(b => b.questLine).filter(Boolean))]
        }));
    }
    
    /**
     * Connect to master control for system updates
     */
    async connectToMasterControl() {
        console.log('🔌 Connecting to master control for live updates...');
        
        // Set up periodic sync with master control
        setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:${this.config.masterControlPort}/api/status`);
                if (response.ok) {
                    const status = await response.json();
                    await this.syncWithMasterControl(status);
                }
            } catch (error) {
                // Silent fail - master control might be down
            }
        }, 30000); // Sync every 30 seconds
        
        console.log('✅ Connected to master control');
    }
    
    /**
     * Sync system status with master control
     */
    async syncWithMasterControl(masterStatus) {
        for (const [systemName, health] of Object.entries(masterStatus.systemHealth || {})) {
            if (this.systemRegistry.has(systemName)) {
                const system = this.systemRegistry.get(systemName);
                system.status = health.status;
                system.lastSync = Date.now();
            }
        }
    }
    
    /**
     * Get router status
     */
    getStatus() {
        return {
            server: {
                port: this.config.port,
                running: !!this.server,
                uptime: Date.now() - (this.startTime || Date.now())
            },
            systems: {
                total: this.systemRegistry.size,
                categories: [...new Set([...this.systemRegistry.values()].map(s => s.category))],
                bosses: [...this.systemRegistry.values()].filter(s => s.isBoss).length
            },
            routing: {
                emojis: Object.keys(this.routingTable?.emojis || {}).length,
                totalRoutes: this.routingHistory.size,
                categories: Object.keys(this.routingTable?.categories || {}).length
            },
            game: {
                bossEncounters: Object.keys(this.routingTable?.bosses || {}).length,
                questLines: [...new Set(Object.values(this.routingTable?.bosses || {}).map(b => b.questLine).filter(Boolean))].length
            }
        };
    }
    
    /**
     * Shutdown the router
     */
    async shutdown() {
        console.log('🛑 Shutting down Emoji DNS Router...');
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ Emoji DNS Router shut down');
    }
}

// Export for use as module
module.exports = EmojiDNSRouter;

// CLI interface
if (require.main === module) {
    console.log('🌐🎮 EMOJI DNS ROUTER');
    console.log('====================');
    
    const router = new EmojiDNSRouter();
    
    async function start() {
        router.startTime = Date.now();
        await router.initialize();
        
        console.log('\n🎮 EMOJI GAMING READY!');
        console.log('======================');
        console.log(`🌐 Dashboard: http://localhost:${router.config.port}`);
        console.log('🎯 Click emojis to route to systems!');
        console.log('⚔️ Boss battles await in the routing table!');
        console.log('🏆 Find Claude\'s lost trophy through the emoji quest!');
        
        // Listen for routing events
        router.on('emoji_routed', (data) => {
            console.log(`🎮 ${data.emoji} → ${data.systems.join(', ')} (${data.difficulty})`);
        });
    }
    
    start().catch(error => {
        console.error('❌ Failed to start Emoji DNS Router:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await router.shutdown();
        process.exit(0);
    });
}