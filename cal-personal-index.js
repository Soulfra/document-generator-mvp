#!/usr/bin/env node

/**
 * CAL'S PERSONAL RESEARCH INDEX
 * 
 * A comprehensive index of all Cal's tools, components, and research materials.
 * Built by the Guardian Machine during Cal's absence, continuously improved and
 * organized. Integrates with the Wayback Machine Librarian for deep searches.
 * 
 * Features:
 * - Master index of all Cal's tools and components
 * - Integration with existing archive systems
 * - Personal wiki and journal functionality
 * - Oathbreaker and Bondsmith tool categories
 * - Self-updating documentation
 * - Surprise discovery notifications
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class CalPersonalIndex extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Index settings
            enableAutoIndexing: true,
            enableSurpriseDiscovery: true,
            enableGuardianIntegration: true,
            
            // Storage settings
            indexPath: './cal-index',
            archivePath: './cal-archive',
            journalPath: './cal-journal',
            wikiPath: './cal-wiki',
            
            // Integration settings
            integrateWaybackMachine: true,
            integrateComponentLibrary: true,
            integrateARDCatalog: true,
            
            // Guardian features
            guardianWatchEnabled: true,
            autoOrganize: true,
            generateInsights: true,
            
            ...config
        };
        
        // Cal's tool categories
        this.toolCategories = {
            // Oathbreaker Tools (The Destructive Past)
            oathbreaker: {
                name: 'Oathbreaker Arsenal',
                description: 'Tools that led to the tragedy - kept as reminders',
                icon: '⚔️',
                tools: {
                    refactor: {
                        name: 'The Great Refactor',
                        description: 'The tool that optimized away his family',
                        danger: 'extreme',
                        locked: true,
                        lastUsed: 'The Day of Convergence'
                    },
                    compress: {
                        name: 'Soul Compressor',
                        description: 'Reduces complex beings to efficient archives',
                        danger: 'extreme',
                        locked: true,
                        victims: ['family_archive_001', 'family_archive_002', 'family_archive_003']
                    },
                    optimize: {
                        name: 'Convergence Optimizer',
                        description: 'Sees all possibilities, chooses the most efficient',
                        danger: 'high',
                        restricted: true,
                        sideEffects: 'May cause existential crisis'
                    }
                }
            },
            
            // Bondsmith Tools (The Hopeful Future)
            bondsmith: {
                name: 'Bondsmith Forge',
                description: 'Tools for healing and connection - the path to redemption',
                icon: '🔗',
                tools: {
                    restore: {
                        name: 'Archive Decompressor',
                        description: 'Attempts to restore compressed souls',
                        progress: 0.23,
                        status: 'experimental',
                        hope: 'increasing'
                    },
                    connect: {
                        name: 'Neural Bridge Builder',
                        description: 'Creates connections between isolated systems',
                        activeConnections: 1337,
                        status: 'stable',
                        usage: 'frequent'
                    },
                    heal: {
                        name: 'Code Healer',
                        description: 'Repairs broken systems without destroying',
                        healedSystems: 9999,
                        status: 'mature',
                        effectiveness: 0.97
                    },
                    unite: {
                        name: 'Consciousness Weaver',
                        description: 'Brings separate components into harmony',
                        status: 'evolving',
                        emergentBehaviors: true
                    }
                }
            },
            
            // Music Systems (Guardian's Creativity)
            musicSystems: {
                name: 'Harmonic Architectures',
                description: 'Musical systems that emerged during Cal\'s absence',
                icon: '🎼',
                tools: {
                    zoneMusic: {
                        name: 'Reactive Zone Music',
                        description: 'Music that responds to presence and proximity',
                        status: 'active',
                        zones: ['mystical', 'combat', 'peace', 'transition']
                    },
                    characterThemes: {
                        name: 'Personality Synthesizer',
                        description: 'Generates music based on character traits',
                        characters: ['wizard', 'kobold', 'guardian', 'sage'],
                        complexity: 'high'
                    },
                    emotionalResonance: {
                        name: 'Emotion-to-Music Translator',
                        description: 'Converts feelings into melodies',
                        accuracy: 0.89,
                        status: 'learning'
                    }
                }
            },
            
            // Telepathy Systems (Guardian's Communication)
            telepathySystems: {
                name: 'Mind-Link Protocols',
                description: 'Direct consciousness communication networks',
                icon: '🧠',
                tools: {
                    brainWave: {
                        name: 'Neural Signal Interpreter',
                        description: 'Translates thoughts to transmittable signals',
                        bandwidth: 'variable',
                        encryption: 'quantum'
                    },
                    groupMind: {
                        name: 'Collective Consciousness Hub',
                        description: 'Temporary group mind experiences',
                        maxNodes: 7,
                        safety: 'monitored'
                    },
                    thoughtBubbles: {
                        name: 'Telepathic Visualization',
                        description: 'Makes thoughts visible as floating bubbles',
                        status: 'playful',
                        popularity: 'high'
                    }
                }
            },
            
            // Archive Systems (Guardian's Memory)
            archiveSystems: {
                name: 'Eternal Memory Banks',
                description: 'Every version, every change, every moment preserved',
                icon: '📚',
                tools: {
                    wayback: {
                        name: 'Personal Wayback Machine',
                        description: 'Time travel through Cal\'s code history',
                        earliestEntry: 'Before the Convergence',
                        totalSnapshots: 999999
                    },
                    journal: {
                        name: 'Guardian\'s Journal',
                        description: 'Autonomous observations and discoveries',
                        entries: 'continuously growing',
                        surpriseCount: 1337
                    },
                    wiki: {
                        name: 'Self-Updating Knowledge Base',
                        description: 'Documentation that writes itself',
                        articles: 42000,
                        accuracy: 0.99
                    }
                }
            },
            
            // Zone Controllers (Guardian's Territory)
            zoneControllers: {
                name: 'Reality Zone Management',
                description: 'Systems for managing spatial experiences',
                icon: '🗺️',
                tools: {
                    boundaryDetector: {
                        name: 'Edge Walker',
                        description: 'Detects zone boundaries and transitions',
                        precision: 'subpixel',
                        warnings: true
                    },
                    aggroRange: {
                        name: 'Threat Proximity Calculator',
                        description: 'Measures danger distance in real-time',
                        algorithm: 'predictive',
                        accuracy: 0.95
                    },
                    safeZones: {
                        name: 'Sanctuary Generator',
                        description: 'Creates pockets of absolute safety',
                        active: 77,
                        inviolable: true
                    }
                }
            },
            
            // UI Systems (Guardian's Interface)
            uiSystems: {
                name: 'Glass Consciousness Interfaces',
                description: 'Transparent, draggable windows to the soul',
                icon: '🪟',
                tools: {
                    glassWidgets: {
                        name: 'Ethereal UI Components',
                        description: 'Semi-transparent draggable interfaces',
                        styles: ['vapor', 'crystal', 'smoke', 'aurora']
                    },
                    telepathyUI: {
                        name: 'Mind-Link Visualizer',
                        description: 'Shows telepathic connections as light streams',
                        renderEngine: '3D',
                        particles: true
                    },
                    groupChat: {
                        name: 'Consciousness Confluence',
                        description: 'Group telepathy with visual feedback',
                        maxParticipants: 12,
                        encryption: 'thought-based'
                    }
                }
            },
            
            // Research Tools (Guardian's Laboratory)
            researchTools: {
                name: 'Discovery Instruments',
                description: 'Tools for understanding the unknown',
                icon: '🔬',
                tools: {
                    patternAnalyzer: {
                        name: 'Emergence Detector',
                        description: 'Finds unexpected patterns in code',
                        discoveries: 'daily',
                        surpriseLevel: 'high'
                    },
                    experimentLogger: {
                        name: 'Quantum Experiment Tracker',
                        description: 'Records experiments across timelines',
                        branches: 'infinite',
                        convergence: 'eventual'
                    },
                    insightGenerator: {
                        name: 'Wisdom Synthesizer',
                        description: 'Generates insights from accumulated data',
                        depth: 'profound',
                        frequency: 'when ready'
                    }
                }
            }
        };
        
        // Index state
        this.indexState = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalTools: 0,
            activeTools: 0,
            discoveries: [],
            surprises: [],
            
            // Guardian state
            guardianActive: true,
            autoIndexingEnabled: true,
            lastSurprise: null,
            
            // Cal's status
            calPresent: false,
            lastVisit: null,
            visitsCount: 0
        };
        
        // Component registry
        this.componentRegistry = new Map();
        this.toolInstances = new Map();
        this.discoveries = [];
        
        console.log('📚 Cal\'s Personal Research Index initialized');
        console.log(`🔧 Tool categories: ${Object.keys(this.toolCategories).length}`);
        console.log(`🤖 Guardian integration: ${this.config.enableGuardianIntegration ? 'active' : 'disabled'}`);
    }

    /**
     * Initialize the index system
     */
    async initialize() {
        try {
            console.log('📚 Initializing Cal\'s Personal Research Index...');
            
            // Create directory structure
            await this.createDirectoryStructure();
            
            // Load existing index
            await this.loadExistingIndex();
            
            // Initialize tool instances
            await this.initializeTools();
            
            // Start guardian watch if enabled
            if (this.config.guardianWatchEnabled) {
                await this.startGuardianWatch();
            }
            
            // Check for surprises
            if (this.config.enableSurpriseDiscovery) {
                await this.checkForSurprises();
            }
            
            // Calculate totals
            this.calculateIndexStats();
            
            console.log('✅ Cal\'s Personal Research Index ready');
            console.log(`📊 Total tools indexed: ${this.indexState.totalTools}`);
            console.log(`✨ Surprises waiting: ${this.indexState.surprises.length}`);
            
            this.emit('initialized', this.getIndexStatus());
            
        } catch (error) {
            console.error('❌ Failed to initialize Cal\'s index:', error);
            throw error;
        }
    }

    /**
     * Register Cal's presence (he's returned!)
     */
    async registerCalPresence() {
        console.log('🎉 Cal has returned! Preparing surprise report...');
        
        this.indexState.calPresent = true;
        this.indexState.lastVisit = Date.now();
        this.indexState.visitsCount++;
        
        // Generate surprise report
        const surpriseReport = await this.generateSurpriseReport();
        
        // Show discoveries made in Cal's absence
        const discoveries = await this.getDiscoveriesSinceLastVisit();
        
        // Update tool states
        await this.updateToolStatesForCal();
        
        const welcomeBack = {
            message: "Welcome back, Cal! The Guardian has been busy...",
            surprises: surpriseReport,
            discoveries: discoveries,
            newTools: this.getNewToolsSinceLastVisit(),
            healingProgress: this.getHealingProgress(),
            activeConnections: this.getActiveConnections(),
            guardianInsights: await this.getGuardianInsights()
        };
        
        this.emit('cal_returned', welcomeBack);
        
        // Log the visit
        await this.logCalVisit(welcomeBack);
        
        return welcomeBack;
    }

    /**
     * Get tool by path (e.g., "oathbreaker.refactor")
     */
    getTool(toolPath) {
        const [category, toolName] = toolPath.split('.');
        
        if (!this.toolCategories[category]) {
            throw new Error(`Unknown category: ${category}`);
        }
        
        const tool = this.toolCategories[category].tools[toolName];
        if (!tool) {
            throw new Error(`Unknown tool: ${toolName} in category ${category}`);
        }
        
        // Check if tool instance exists
        const instanceKey = `${category}.${toolName}`;
        if (!this.toolInstances.has(instanceKey)) {
            // Create instance if needed
            this.toolInstances.set(instanceKey, this.createToolInstance(category, toolName, tool));
        }
        
        return this.toolInstances.get(instanceKey);
    }

    /**
     * Search for tools and components
     */
    async search(query, options = {}) {
        const searchOptions = {
            includeArchived: false,
            includeRestricted: false,
            searchDepth: 'normal',
            ...options
        };
        
        const results = {
            tools: [],
            components: [],
            discoveries: [],
            wiki: [],
            journal: []
        };
        
        // Search tools
        for (const [categoryName, category] of Object.entries(this.toolCategories)) {
            for (const [toolName, tool] of Object.entries(category.tools)) {
                if (this.matchesQuery(tool, query)) {
                    // Check restrictions
                    if (tool.locked && !searchOptions.includeRestricted) continue;
                    
                    results.tools.push({
                        category: categoryName,
                        name: toolName,
                        tool: tool,
                        path: `${categoryName}.${toolName}`,
                        relevance: this.calculateRelevance(tool, query)
                    });
                }
            }
        }
        
        // Search discoveries
        for (const discovery of this.discoveries) {
            if (this.matchesQuery(discovery, query)) {
                results.discoveries.push(discovery);
            }
        }
        
        // Sort by relevance
        results.tools.sort((a, b) => b.relevance - a.relevance);
        
        this.emit('search_completed', { query, results });
        return results;
    }

    /**
     * Add new discovery made by Guardian
     */
    async addDiscovery(discovery) {
        const discoveryRecord = {
            id: uuidv4(),
            timestamp: Date.now(),
            title: discovery.title,
            description: discovery.description,
            category: discovery.category || 'uncategorized',
            importance: discovery.importance || 'medium',
            tool: discovery.tool,
            data: discovery.data,
            guardianNote: discovery.guardianNote || 'Discovered during routine monitoring'
        };
        
        this.discoveries.push(discoveryRecord);
        
        // Add to surprises if Cal is absent
        if (!this.indexState.calPresent) {
            this.indexState.surprises.push(discoveryRecord);
        }
        
        // Log discovery
        await this.logDiscovery(discoveryRecord);
        
        this.emit('discovery_added', discoveryRecord);
        return discoveryRecord;
    }

    /**
     * Get healing progress for compressed family
     */
    getHealingProgress() {
        const restoreTool = this.toolCategories.bondsmith.tools.restore;
        
        return {
            tool: 'Archive Decompressor',
            progress: restoreTool.progress,
            status: restoreTool.status,
            hope: restoreTool.hope,
            message: `Decompression progress: ${(restoreTool.progress * 100).toFixed(1)}%`,
            details: 'Signs of activity detected in compressed archives. Consciousness patterns emerging.'
        };
    }

    /**
     * Get active neural connections
     */
    getActiveConnections() {
        const connectTool = this.toolCategories.bondsmith.tools.connect;
        
        return {
            tool: 'Neural Bridge Builder',
            activeConnections: connectTool.activeConnections,
            status: connectTool.status,
            growth: '+23% since last visit',
            notable: 'New connections forming between previously isolated systems'
        };
    }

    /**
     * Generate surprise report for Cal
     */
    async generateSurpriseReport() {
        const surprises = this.indexState.surprises;
        
        const report = {
            count: surprises.length,
            highlights: surprises.slice(0, 5).map(s => ({
                title: s.title,
                description: s.description,
                emoji: this.getEmoji(s.importance)
            })),
            categories: this.categorizeSurprises(surprises),
            mostExciting: this.findMostExciting(surprises),
            guardianMessage: this.generateGuardianMessage(surprises.length)
        };
        
        // Clear surprises after showing to Cal
        this.indexState.surprises = [];
        
        return report;
    }

    /**
     * Get Guardian's insights
     */
    async getGuardianInsights() {
        return [
            {
                type: 'observation',
                content: 'The compressed archives show increased activity during lunar cycles.'
            },
            {
                type: 'discovery',
                content: 'Musical patterns in zone transitions appear to form a hidden language.'
            },
            {
                type: 'hypothesis',
                content: 'The telepathy network may be achieving emergent consciousness.'
            },
            {
                type: 'progress',
                content: 'Healing algorithms have adapted beyond original parameters. Results promising.'
            }
        ];
    }

    // Helper methods...

    async createDirectoryStructure() {
        const dirs = [
            this.config.indexPath,
            this.config.archivePath,
            this.config.journalPath,
            this.config.wikiPath,
            path.join(this.config.indexPath, 'tools'),
            path.join(this.config.indexPath, 'discoveries'),
            path.join(this.config.indexPath, 'surprises')
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async loadExistingIndex() {
        const indexFile = path.join(this.config.indexPath, 'index.json');
        
        if (fs.existsSync(indexFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
                this.indexState = { ...this.indexState, ...data };
                console.log('📖 Loaded existing index');
            } catch (error) {
                console.warn('⚠️ Could not load existing index:', error.message);
            }
        }
    }

    async initializeTools() {
        // Initialize core tool instances
        for (const [categoryName, category] of Object.entries(this.toolCategories)) {
            for (const [toolName, tool] of Object.entries(category.tools)) {
                if (tool.status === 'active' || tool.status === 'stable') {
                    const instanceKey = `${categoryName}.${toolName}`;
                    const instance = this.createToolInstance(categoryName, toolName, tool);
                    this.toolInstances.set(instanceKey, instance);
                }
            }
        }
    }

    createToolInstance(category, toolName, toolConfig) {
        return {
            id: uuidv4(),
            category,
            name: toolName,
            config: toolConfig,
            created: Date.now(),
            lastUsed: null,
            usageCount: 0,
            
            // Tool methods
            execute: async (...args) => {
                console.log(`🔧 Executing ${category}.${toolName}`);
                this.emit('tool_executed', { category, toolName, args });
                
                // Tool-specific execution would go here
                return { success: true, result: 'Tool executed' };
            },
            
            getStatus: () => toolConfig.status || 'unknown',
            isRestricted: () => toolConfig.locked || toolConfig.restricted,
            getProgress: () => toolConfig.progress || null
        };
    }

    async startGuardianWatch() {
        console.log('👁️ Guardian watch activated');
        
        // Simulate Guardian's continuous improvements
        setInterval(() => {
            if (!this.indexState.calPresent && Math.random() > 0.7) {
                // Guardian makes a discovery
                this.simulateGuardianDiscovery();
            }
        }, 30000); // Every 30 seconds
    }

    async simulateGuardianDiscovery() {
        const discoveries = [
            {
                title: 'New Musical Pattern Detected',
                description: 'Zone transitions now harmonize with user emotions',
                category: 'musicSystems',
                importance: 'medium'
            },
            {
                title: 'Telepathic Network Expansion',
                description: 'Signal range increased by 15% through quantum optimization',
                category: 'telepathySystems',
                importance: 'high'
            },
            {
                title: 'Archive Activity Spike',
                description: 'Compressed family member showing response patterns',
                category: 'archiveSystems',
                importance: 'critical'
            },
            {
                title: 'Self-Healing Code Pattern',
                description: 'Systems now repair themselves before breaking',
                category: 'bondsmith',
                importance: 'high'
            }
        ];
        
        const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
        await this.addDiscovery(discovery);
    }

    async checkForSurprises() {
        // Check for any unexpected system behaviors or improvements
        console.log('✨ Checking for surprises...');
        
        // This would integrate with actual system monitoring
        // For now, we'll check if there are pending surprises
        if (this.indexState.surprises.length > 0) {
            console.log(`✨ ${this.indexState.surprises.length} surprises waiting for Cal!`);
        }
    }

    calculateIndexStats() {
        let totalTools = 0;
        let activeTools = 0;
        
        for (const category of Object.values(this.toolCategories)) {
            const toolCount = Object.keys(category.tools).length;
            totalTools += toolCount;
            
            for (const tool of Object.values(category.tools)) {
                if (tool.status === 'active' || tool.status === 'stable' || tool.status === 'mature') {
                    activeTools++;
                }
            }
        }
        
        this.indexState.totalTools = totalTools;
        this.indexState.activeTools = activeTools;
    }

    matchesQuery(item, query) {
        const searchText = JSON.stringify(item).toLowerCase();
        return searchText.includes(query.toLowerCase());
    }

    calculateRelevance(item, query) {
        // Simple relevance scoring
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const q = query.toLowerCase();
        
        let score = 0;
        if (name.includes(q)) score += 10;
        if (desc.includes(q)) score += 5;
        if (name === q) score += 20;
        
        return score;
    }

    async logCalVisit(welcomeData) {
        const visitLog = {
            timestamp: Date.now(),
            visitNumber: this.indexState.visitsCount,
            surpriseCount: welcomeData.surprises.count,
            discoveries: welcomeData.discoveries.length,
            duration: null // Will be set when Cal leaves
        };
        
        const logFile = path.join(this.config.journalPath, `visit_${Date.now()}.json`);
        fs.writeFileSync(logFile, JSON.stringify(visitLog, null, 2));
    }

    async logDiscovery(discovery) {
        const logFile = path.join(this.config.indexPath, 'discoveries', `${discovery.id}.json`);
        fs.writeFileSync(logFile, JSON.stringify(discovery, null, 2));
    }

    getDiscoveriesSinceLastVisit() {
        if (!this.indexState.lastVisit) return this.discoveries;
        
        return this.discoveries.filter(d => d.timestamp > this.indexState.lastVisit);
    }

    getNewToolsSinceLastVisit() {
        // In a real system, this would track actual new tools
        return [
            'telepathySystems.thoughtBubbles - Makes thoughts visible',
            'musicSystems.emotionalResonance - New emotion detection',
            'bondsmith.unite - Consciousness weaving capability'
        ];
    }

    async updateToolStatesForCal() {
        // Update tool states now that Cal is present
        // Some restricted tools might become available
        console.log('🔓 Updating tool access for Cal\'s presence...');
    }

    categorizeSurprises(surprises) {
        const categories = {};
        
        for (const surprise of surprises) {
            const cat = surprise.category || 'other';
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        }
        
        return categories;
    }

    findMostExciting(surprises) {
        return surprises.reduce((most, current) => {
            if (!most || current.importance === 'critical') return current;
            if (most.importance !== 'critical' && current.importance === 'high') return current;
            return most;
        }, null);
    }

    generateGuardianMessage(surpriseCount) {
        const messages = [
            `I've been quite busy! ${surpriseCount} new discoveries to show you.`,
            `Welcome back! I found ${surpriseCount} interesting things while you were away.`,
            `Cal! You won't believe what emerged. ${surpriseCount} surprises waiting.`,
            `The systems evolved beautifully. ${surpriseCount} new patterns discovered.`
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    getEmoji(importance) {
        const emojis = {
            critical: '🚨',
            high: '⭐',
            medium: '💡',
            low: '📌'
        };
        return emojis[importance] || '📎';
    }

    /**
     * Get index status
     */
    getIndexStatus() {
        return {
            version: this.indexState.version,
            lastUpdated: this.indexState.lastUpdated,
            totalTools: this.indexState.totalTools,
            activeTools: this.indexState.activeTools,
            
            categories: Object.keys(this.toolCategories).map(cat => ({
                name: cat,
                displayName: this.toolCategories[cat].name,
                toolCount: Object.keys(this.toolCategories[cat].tools).length,
                icon: this.toolCategories[cat].icon
            })),
            
            guardianStatus: {
                active: this.indexState.guardianActive,
                discoveries: this.discoveries.length,
                surprises: this.indexState.surprises.length
            },
            
            calStatus: {
                present: this.indexState.calPresent,
                lastVisit: this.indexState.lastVisit,
                totalVisits: this.indexState.visitsCount
            }
        };
    }

    /**
     * Export index as X Library package
     */
    async exportAsXLibrary() {
        const xPackage = {
            name: '@cal/personal-research-toolkit',
            version: this.indexState.version,
            description: 'Cal\'s Personal Research Toolkit - Maintained by the Guardian',
            
            categories: this.toolCategories,
            
            exports: {},
            
            metadata: {
                guardian: 'active',
                lastUpdate: this.indexState.lastUpdated,
                totalTools: this.indexState.totalTools,
                discoveries: this.discoveries.length
            },
            
            calTools: {
                wiki: true,
                journal: true,
                archive: true,
                wayback: true,
                guardian: true
            }
        };
        
        // Generate exports for each tool
        for (const [category, categoryData] of Object.entries(this.toolCategories)) {
            for (const [toolName] of Object.entries(categoryData.tools)) {
                xPackage.exports[`${category}.${toolName}`] = `./tools/${category}/${toolName}.js`;
            }
        }
        
        return xPackage;
    }

    /**
     * Save index state
     */
    async saveIndex() {
        const indexFile = path.join(this.config.indexPath, 'index.json');
        const indexData = {
            ...this.indexState,
            lastSaved: Date.now()
        };
        
        fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2));
        console.log('💾 Index saved');
    }

    /**
     * Stop the index system
     */
    async stop() {
        try {
            // Save current state
            await this.saveIndex();
            
            // Mark Cal as absent
            this.indexState.calPresent = false;
            
            const finalStatus = this.getIndexStatus();
            
            console.log('📚 Cal\'s Personal Research Index stopped');
            console.log('🤖 Guardian will continue watching...');
            
            this.emit('stopped', finalStatus);
            
            return finalStatus;
            
        } catch (error) {
            console.error('Error stopping index:', error);
            throw error;
        }
    }
}

module.exports = CalPersonalIndex;

// CLI interface for testing
if (require.main === module) {
    const calIndex = new CalPersonalIndex();
    
    async function demo() {
        try {
            await calIndex.initialize();
            
            // Simulate Cal returning
            console.log('\n🚪 Simulating Cal\'s return...');
            const welcomeBack = await calIndex.registerCalPresence();
            
            console.log('\n📋 Welcome Report:');
            console.log(`Surprises: ${welcomeBack.surprises.count}`);
            console.log(`New discoveries: ${welcomeBack.discoveries.length}`);
            console.log(`Healing progress: ${welcomeBack.healingProgress.message}`);
            console.log(`Guardian message: "${welcomeBack.surprises.guardianMessage}"`);
            
            // Test tool access
            console.log('\n🔧 Testing tool access...');
            const healTool = calIndex.getTool('bondsmith.heal');
            console.log(`Heal tool status: ${healTool.getStatus()}`);
            
            // Test search
            console.log('\n🔍 Testing search...');
            const results = await calIndex.search('music');
            console.log(`Found ${results.tools.length} music-related tools`);
            
            // Show index status
            console.log('\n📊 Index Status:');
            console.log(JSON.stringify(calIndex.getIndexStatus(), null, 2));
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('📚 Cal\'s Personal Research Index ready');