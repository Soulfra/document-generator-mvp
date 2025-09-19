#!/usr/bin/env node

/**
 * QUEST ENGINE - OSS Discovery & Formula System
 * 
 * Gamified system for discovering open source software and building
 * internal formulas. Integrates with the existing Electron app's
 * 66-layer system to provide self-contained OSS discovery.
 * 
 * Features:
 * - Quest-based OSS discovery (GitHub, npm, PyPI, etc.)
 * - Achievement system for software exploration
 * - Formula generation for discovered packages
 * - Version tracking and update quests
 * - Internal building recipes
 * - Controlled internet access through API layers
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

console.log(`
🎮 QUEST ENGINE - OSS DISCOVERY 🎮
================================
🏆 Achievement-based software discovery
📦 OSS package exploration quests
🔨 Formula generation system  
🌐 Controlled internet access
📊 Progress tracking & rewards
`);

class QuestEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 8777,
            questDbPath: options.questDbPath || './quest-engine.db',
            formulaPath: options.formulaPath || './formulas',
            maxConcurrentQuests: options.maxConcurrentQuests || 5,
            questCooldown: options.questCooldown || 30000, // 30 seconds
            ...options
        };
        
        // Quest system state
        this.state = {
            activeQuests: new Map(),
            completedQuests: new Map(),
            discoveredPackages: new Map(),
            formulas: new Map(),
            achievements: new Map(),
            playerLevel: 1,
            experience: 0
        };
        
        // Quest types and their parameters
        this.questTypes = {
            'github_explore': {
                name: 'GitHub Repository Explorer',
                description: 'Discover new GitHub repositories',
                xpReward: 100,
                difficulty: 'easy',
                cooldown: 60000,
                targets: ['javascript', 'python', 'rust', 'go', 'typescript']
            },
            'npm_discovery': {
                name: 'NPM Package Hunter',
                description: 'Find and analyze npm packages',
                xpReward: 150,
                difficulty: 'medium',
                cooldown: 120000,
                targets: ['frameworks', 'utilities', 'build-tools', 'testing']
            },
            'version_tracker': {
                name: 'Version Update Detective',
                description: 'Track version updates for discovered packages',
                xpReward: 75,
                difficulty: 'easy',
                cooldown: 30000,
                targets: ['semver', 'changelog', 'releases']
            },
            'formula_creator': {
                name: 'Formula Architect',
                description: 'Create building formulas from discovered packages',
                xpReward: 200,
                difficulty: 'hard',
                cooldown: 300000,
                targets: ['integration', 'build', 'test', 'deploy']
            },
            'vulnerability_scout': {
                name: 'Security Vulnerability Scout',
                description: 'Scan for security issues in discovered packages',
                xpReward: 250,
                difficulty: 'hard',
                cooldown: 180000,
                targets: ['cve', 'audit', 'security']
            }
        };
        
        // Achievement definitions
        this.achievements = {
            'first_discovery': { name: 'First Discovery', description: 'Discover your first OSS package', xp: 50 },
            'package_master': { name: 'Package Master', description: 'Discover 100 packages', xp: 500 },
            'formula_chef': { name: 'Formula Chef', description: 'Create 10 formulas', xp: 300 },
            'security_expert': { name: 'Security Expert', description: 'Find 5 vulnerabilities', xp: 750 },
            'version_ninja': { name: 'Version Ninja', description: 'Track 50 version updates', xp: 400 },
            'github_explorer': { name: 'GitHub Explorer', description: 'Explore 25 GitHub repos', xp: 200 },
            'npm_hunter': { name: 'NPM Hunter', description: 'Discover 50 npm packages', xp: 350 }
        };
        
        this.app = express();
        this.db = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Quest Engine...');
        
        try {
            // Setup database
            await this.setupDatabase();
            
            // Load existing data
            await this.loadQuestData();
            
            // Setup HTTP server
            await this.setupServer();
            
            // Create formulas directory
            await this.setupFormulas();
            
            // Start quest system
            this.startQuestSystem();
            
            console.log('✅ Quest Engine initialized!');
            console.log(`🌐 Quest API: http://localhost:${this.config.port}`);
            console.log(`🎯 Player Level: ${this.state.playerLevel} (${this.state.experience} XP)`);
            
            this.emit('quest_engine_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Quest Engine:', error);
            throw error;
        }
    }
    
    /**
     * Setup SQLite database for quest persistence
     */
    async setupDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.questDbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Create tables
                const createTables = `
                    CREATE TABLE IF NOT EXISTS quests (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL,
                        status TEXT NOT NULL,
                        target TEXT,
                        created_at INTEGER,
                        completed_at INTEGER,
                        xp_reward INTEGER,
                        result TEXT
                    );
                    
                    CREATE TABLE IF NOT EXISTS discovered_packages (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        source TEXT NOT NULL,
                        version TEXT,
                        description TEXT,
                        discovered_at INTEGER,
                        quest_id TEXT,
                        metadata TEXT
                    );
                    
                    CREATE TABLE IF NOT EXISTS formulas (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        formula_data TEXT NOT NULL,
                        created_at INTEGER,
                        packages TEXT,
                        build_steps TEXT
                    );
                    
                    CREATE TABLE IF NOT EXISTS achievements (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        unlocked_at INTEGER,
                        xp_awarded INTEGER
                    );
                    
                    CREATE TABLE IF NOT EXISTS player_stats (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );
                `;
                
                this.db.exec(createTables, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
    
    /**
     * Load existing quest data from database
     */
    async loadQuestData() {
        return new Promise((resolve, reject) => {
            // Load player stats
            this.db.all('SELECT * FROM player_stats', (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                rows.forEach(row => {
                    if (row.key === 'level') {
                        this.state.playerLevel = parseInt(row.value);
                    } else if (row.key === 'experience') {
                        this.state.experience = parseInt(row.value);
                    }
                });
                
                // Load active quests
                this.db.all('SELECT * FROM quests WHERE status = "active"', (err, quests) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    quests.forEach(quest => {
                        this.state.activeQuests.set(quest.id, {
                            ...quest,
                            created_at: new Date(quest.created_at),
                            result: quest.result ? JSON.parse(quest.result) : null
                        });
                    });
                    
                    console.log(`📚 Loaded ${this.state.activeQuests.size} active quests`);
                    resolve();
                });
            });
        });
    }
    
    /**
     * Setup HTTP server for quest management
     */
    async setupServer() {
        this.app.use(express.json());
        
        // Quest management endpoints
        this.app.get('/api/quests', (req, res) => {
            res.json({
                active: Array.from(this.state.activeQuests.values()),
                available: this.getAvailableQuests(),
                playerLevel: this.state.playerLevel,
                experience: this.state.experience
            });
        });
        
        this.app.post('/api/quests/start', async (req, res) => {
            try {
                const { questType, target } = req.body;
                const quest = await this.startQuest(questType, target);
                res.json(quest);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.get('/api/packages', (req, res) => {
            res.json(Array.from(this.state.discoveredPackages.values()));
        });
        
        this.app.get('/api/formulas', (req, res) => {
            res.json(Array.from(this.state.formulas.values()));
        });
        
        this.app.post('/api/formulas/create', async (req, res) => {
            try {
                const formula = await this.createFormula(req.body);
                res.json(formula);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.get('/api/achievements', (req, res) => {
            res.json(Array.from(this.state.achievements.values()));
        });
        
        this.app.get('/api/dashboard', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // OSS Discovery endpoints (controlled internet access)
        this.app.get('/api/discover/github/:query', async (req, res) => {
            try {
                const results = await this.discoverGitHubRepos(req.params.query);
                res.json(results);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/discover/npm/:query', async (req, res) => {
            try {
                const results = await this.discoverNpmPackages(req.params.query);
                res.json(results);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`🌐 Quest Engine server running on port ${this.config.port}`);
        });
    }
    
    /**
     * Setup formulas directory structure
     */
    async setupFormulas() {
        try {
            await fs.mkdir(this.config.formulaPath, { recursive: true });
            await fs.mkdir(path.join(this.config.formulaPath, 'build'), { recursive: true });
            await fs.mkdir(path.join(this.config.formulaPath, 'deploy'), { recursive: true });
            await fs.mkdir(path.join(this.config.formulaPath, 'test'), { recursive: true });
        } catch (error) {
            console.error('Failed to setup formulas directory:', error);
        }
    }
    
    /**
     * Start quest system background processes
     */
    startQuestSystem() {
        // Process active quests
        setInterval(async () => {
            await this.processActiveQuests();
        }, 10000); // Every 10 seconds
        
        // Check for achievements
        setInterval(async () => {
            await this.checkAchievements();
        }, 30000); // Every 30 seconds
        
        // Auto-generate new quests
        setInterval(async () => {
            await this.generateAutoQuests();
        }, 60000); // Every minute
    }
    
    /**
     * Start a new quest
     */
    async startQuest(questType, target = null) {
        if (!this.questTypes[questType]) {
            throw new Error(`Unknown quest type: ${questType}`);
        }
        
        if (this.state.activeQuests.size >= this.config.maxConcurrentQuests) {
            throw new Error('Maximum concurrent quests reached');
        }
        
        const questId = crypto.randomUUID();
        const questConfig = this.questTypes[questType];
        
        const quest = {
            id: questId,
            type: questType,
            status: 'active',
            target: target || this.selectRandomTarget(questConfig.targets),
            created_at: Date.now(),
            xp_reward: questConfig.xpReward,
            difficulty: questConfig.difficulty,
            description: questConfig.description,
            progress: 0
        };
        
        // Save to database
        await this.saveQuest(quest);
        
        // Add to active quests
        this.state.activeQuests.set(questId, quest);
        
        // Start quest execution
        this.executeQuest(quest);
        
        console.log(`🎯 Started quest: ${questConfig.name} (${questId})`);
        this.emit('quest_started', quest);
        
        return quest;
    }
    
    /**
     * Execute quest based on type
     */
    async executeQuest(quest) {
        try {
            switch (quest.type) {
                case 'github_explore':
                    await this.executeGitHubExploreQuest(quest);
                    break;
                case 'npm_discovery':
                    await this.executeNpmDiscoveryQuest(quest);
                    break;
                case 'version_tracker':
                    await this.executeVersionTrackerQuest(quest);
                    break;
                case 'formula_creator':
                    await this.executeFormulaCreatorQuest(quest);
                    break;
                case 'vulnerability_scout':
                    await this.executeVulnerabilityScoutQuest(quest);
                    break;
                default:
                    throw new Error(`Unknown quest type: ${quest.type}`);
            }
        } catch (error) {
            console.error(`❌ Quest ${quest.id} failed:`, error);
            await this.failQuest(quest.id, error.message);
        }
    }
    
    /**
     * GitHub exploration quest
     */
    async executeGitHubExploreQuest(quest) {
        console.log(`🔍 Exploring GitHub for ${quest.target}...`);
        
        // Simulate API call (in real implementation, would use controlled internet access)
        await this.delay(2000);
        
        const discoveredRepos = await this.discoverGitHubRepos(quest.target);
        
        // Process discovered repositories
        for (const repo of discoveredRepos) {
            await this.registerDiscoveredPackage({
                name: repo.name,
                source: 'github',
                version: repo.default_branch,
                description: repo.description,
                quest_id: quest.id,
                metadata: {
                    stars: repo.stargazers_count,
                    language: repo.language,
                    url: repo.html_url,
                    last_updated: repo.updated_at
                }
            });
        }
        
        await this.completeQuest(quest.id, {
            repositories: discoveredRepos.length,
            target: quest.target,
            discoveries: discoveredRepos.map(r => ({ name: r.name, stars: r.stargazers_count }))
        });
    }
    
    /**
     * NPM discovery quest
     */
    async executeNpmDiscoveryQuest(quest) {
        console.log(`📦 Discovering npm packages for ${quest.target}...`);
        
        await this.delay(3000);
        
        const discoveredPackages = await this.discoverNpmPackages(quest.target);
        
        for (const pkg of discoveredPackages) {
            await this.registerDiscoveredPackage({
                name: pkg.name,
                source: 'npm',
                version: pkg.version,
                description: pkg.description,
                quest_id: quest.id,
                metadata: {
                    downloads: pkg.downloads,
                    maintainers: pkg.maintainers,
                    keywords: pkg.keywords
                }
            });
        }
        
        await this.completeQuest(quest.id, {
            packages: discoveredPackages.length,
            target: quest.target,
            discoveries: discoveredPackages.map(p => ({ name: p.name, version: p.version }))
        });
    }
    
    /**
     * Version tracking quest
     */
    async executeVersionTrackerQuest(quest) {
        console.log(`📊 Tracking versions for discovered packages...`);
        
        await this.delay(1500);
        
        // Check versions of previously discovered packages
        const packages = Array.from(this.state.discoveredPackages.values());
        const updates = [];
        
        for (const pkg of packages.slice(0, 5)) { // Check first 5 packages
            const latestVersion = await this.checkLatestVersion(pkg);
            if (latestVersion && latestVersion !== pkg.version) {
                updates.push({
                    name: pkg.name,
                    oldVersion: pkg.version,
                    newVersion: latestVersion
                });
            }
        }
        
        await this.completeQuest(quest.id, {
            packagesChecked: packages.length,
            updatesFound: updates.length,
            updates: updates
        });
    }
    
    /**
     * Formula creation quest
     */
    async executeFormulaCreatorQuest(quest) {
        console.log(`🔨 Creating formula for ${quest.target}...`);
        
        await this.delay(4000);
        
        // Generate a formula from discovered packages
        const relevantPackages = Array.from(this.state.discoveredPackages.values())
            .filter(p => p.metadata && JSON.stringify(p.metadata).includes(quest.target))
            .slice(0, 3);
        
        if (relevantPackages.length > 0) {
            const formula = await this.generateFormula(quest.target, relevantPackages);
            await this.completeQuest(quest.id, {
                formulaGenerated: true,
                formulaId: formula.id,
                packagesUsed: relevantPackages.length
            });
        } else {
            await this.failQuest(quest.id, 'No relevant packages found for formula creation');
        }
    }
    
    /**
     * Vulnerability scanning quest
     */
    async executeVulnerabilityScoutQuest(quest) {
        console.log(`🛡️ Scanning for vulnerabilities...`);
        
        await this.delay(5000);
        
        // Simulate vulnerability scanning
        const packages = Array.from(this.state.discoveredPackages.values()).slice(0, 10);
        const vulnerabilities = [];
        
        for (const pkg of packages) {
            // Simulate finding vulnerabilities (10% chance)
            if (Math.random() < 0.1) {
                vulnerabilities.push({
                    package: pkg.name,
                    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                    description: 'Simulated vulnerability finding'
                });
            }
        }
        
        await this.completeQuest(quest.id, {
            packagesScanned: packages.length,
            vulnerabilitiesFound: vulnerabilities.length,
            vulnerabilities: vulnerabilities
        });
    }
    
    /**
     * Complete a quest and award XP
     */
    async completeQuest(questId, result) {
        const quest = this.state.activeQuests.get(questId);
        if (!quest) return;
        
        quest.status = 'completed';
        quest.completed_at = Date.now();
        quest.result = result;
        
        // Award XP
        this.state.experience += quest.xp_reward;
        await this.checkLevelUp();
        
        // Update database
        await this.updateQuest(quest);
        
        // Move to completed quests
        this.state.activeQuests.delete(questId);
        this.state.completedQuests.set(questId, quest);
        
        console.log(`✅ Quest completed: ${quest.type} (+${quest.xp_reward} XP)`);
        this.emit('quest_completed', quest);
        
        return quest;
    }
    
    /**
     * Register a discovered package
     */
    async registerDiscoveredPackage(packageData) {
        const packageId = crypto.randomUUID();
        const pkg = {
            id: packageId,
            ...packageData,
            discovered_at: Date.now()
        };
        
        this.state.discoveredPackages.set(packageId, pkg);
        
        // Save to database
        await this.saveDiscoveredPackage(pkg);
        
        console.log(`📦 Discovered package: ${pkg.name} (${pkg.source})`);
        this.emit('package_discovered', pkg);
        
        return pkg;
    }
    
    /**
     * Generate a formula from packages
     */
    async generateFormula(name, packages) {
        const formulaId = crypto.randomUUID();
        
        const formula = {
            id: formulaId,
            name: `${name}-formula`,
            description: `Auto-generated formula for ${name}`,
            created_at: Date.now(),
            packages: packages.map(p => p.name),
            build_steps: this.generateBuildSteps(packages),
            formula_data: {
                dependencies: packages.map(p => ({ name: p.name, version: p.version })),
                build_commands: [
                    'npm install',
                    'npm run build',
                    'npm test'
                ],
                deploy_commands: [
                    'docker build .',
                    'docker push'
                ]
            }
        };
        
        this.state.formulas.set(formulaId, formula);
        await this.saveFormula(formula);
        
        // Save formula file
        const formulaPath = path.join(this.config.formulaPath, `${formula.name}.json`);
        await fs.writeFile(formulaPath, JSON.stringify(formula, null, 2));
        
        console.log(`🔨 Generated formula: ${formula.name}`);
        this.emit('formula_created', formula);
        
        return formula;
    }
    
    /**
     * Generate build steps for packages
     */
    generateBuildSteps(packages) {
        const steps = ['# Auto-generated build steps'];
        
        packages.forEach(pkg => {
            if (pkg.source === 'npm') {
                steps.push(`npm install ${pkg.name}@${pkg.version}`);
            } else if (pkg.source === 'github') {
                steps.push(`git clone ${pkg.metadata?.url || pkg.name}`);
            }
        });
        
        steps.push('npm run build', 'npm test');
        return steps.join('\n');
    }
    
    /**
     * Check for level ups
     */
    async checkLevelUp() {
        const xpNeeded = this.state.playerLevel * 1000;
        if (this.state.experience >= xpNeeded) {
            this.state.playerLevel++;
            this.state.experience -= xpNeeded;
            
            console.log(`🎉 Level up! Now level ${this.state.playerLevel}`);
            this.emit('level_up', { level: this.state.playerLevel });
            
            await this.savePlayerStats();
        }
    }
    
    /**
     * Check for new achievements
     */
    async checkAchievements() {
        const stats = {
            discoveredPackages: this.state.discoveredPackages.size,
            completedQuests: this.state.completedQuests.size,
            formulas: this.state.formulas.size
        };
        
        // Check achievement conditions
        if (stats.discoveredPackages >= 1 && !this.state.achievements.has('first_discovery')) {
            await this.unlockAchievement('first_discovery');
        }
        
        if (stats.discoveredPackages >= 100 && !this.state.achievements.has('package_master')) {
            await this.unlockAchievement('package_master');
        }
        
        if (stats.formulas >= 10 && !this.state.achievements.has('formula_chef')) {
            await this.unlockAchievement('formula_chef');
        }
    }
    
    /**
     * Unlock achievement
     */
    async unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;
        
        const unlocked = {
            id: achievementId,
            ...achievement,
            unlocked_at: Date.now()
        };
        
        this.state.achievements.set(achievementId, unlocked);
        this.state.experience += achievement.xp;
        
        await this.saveAchievement(unlocked);
        await this.checkLevelUp();
        
        console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xp} XP)`);
        this.emit('achievement_unlocked', unlocked);
    }
    
    // Database operations
    
    async saveQuest(quest) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO quests (id, type, status, target, created_at, xp_reward) VALUES (?, ?, ?, ?, ?, ?)',
                [quest.id, quest.type, quest.status, quest.target, quest.created_at, quest.xp_reward],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async updateQuest(quest) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE quests SET status = ?, completed_at = ?, result = ? WHERE id = ?',
                [quest.status, quest.completed_at, JSON.stringify(quest.result), quest.id],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async saveDiscoveredPackage(pkg) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO discovered_packages (id, name, source, version, description, discovered_at, quest_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [pkg.id, pkg.name, pkg.source, pkg.version, pkg.description, pkg.discovered_at, pkg.quest_id, JSON.stringify(pkg.metadata)],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async saveFormula(formula) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO formulas (id, name, description, formula_data, created_at, packages, build_steps) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [formula.id, formula.name, formula.description, JSON.stringify(formula.formula_data), formula.created_at, JSON.stringify(formula.packages), formula.build_steps],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async saveAchievement(achievement) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO achievements (id, name, unlocked_at, xp_awarded) VALUES (?, ?, ?, ?)',
                [achievement.id, achievement.name, achievement.unlocked_at, achievement.xp],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async savePlayerStats() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('INSERT OR REPLACE INTO player_stats (key, value) VALUES (?, ?)', ['level', this.state.playerLevel.toString()]);
                this.db.run('INSERT OR REPLACE INTO player_stats (key, value) VALUES (?, ?)', ['experience', this.state.experience.toString()], (err) => {
                    err ? reject(err) : resolve();
                });
            });
        });
    }
    
    // Utility methods
    
    selectRandomTarget(targets) {
        return targets[Math.floor(Math.random() * targets.length)];
    }
    
    getAvailableQuests() {
        return Object.entries(this.questTypes).map(([id, quest]) => ({
            id,
            ...quest,
            available: this.state.activeQuests.size < this.config.maxConcurrentQuests
        }));
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Controlled internet access methods
     * These simulate API calls but would use actual controlled gateways
     */
    async discoverGitHubRepos(query) {
        // Simulate GitHub API response
        return [
            {
                name: `${query}-tool`,
                description: `A ${query} tool for developers`,
                stargazers_count: Math.floor(Math.random() * 1000),
                language: 'JavaScript',
                html_url: `https://github.com/user/${query}-tool`,
                updated_at: new Date().toISOString(),
                default_branch: 'main'
            },
            {
                name: `awesome-${query}`,
                description: `Awesome list of ${query} resources`,
                stargazers_count: Math.floor(Math.random() * 500),
                language: 'Markdown',
                html_url: `https://github.com/user/awesome-${query}`,
                updated_at: new Date().toISOString(),
                default_branch: 'master'
            }
        ];
    }
    
    async discoverNpmPackages(query) {
        // Simulate npm API response
        return [
            {
                name: `${query}-lib`,
                version: '1.0.0',
                description: `${query} library for Node.js`,
                downloads: Math.floor(Math.random() * 10000),
                maintainers: ['developer'],
                keywords: [query, 'library', 'nodejs']
            },
            {
                name: `@scope/${query}`,
                version: '2.1.0',
                description: `Scoped ${query} package`,
                downloads: Math.floor(Math.random() * 5000),
                maintainers: ['team'],
                keywords: [query, 'scoped', 'utility']
            }
        ];
    }
    
    async checkLatestVersion(pkg) {
        // Simulate version check
        if (pkg.source === 'npm') {
            const current = pkg.version.split('.').map(Number);
            current[2]++; // Increment patch version
            return current.join('.');
        }
        return null;
    }
    
    async failQuest(questId, reason) {
        const quest = this.state.activeQuests.get(questId);
        if (!quest) return;
        
        quest.status = 'failed';
        quest.completed_at = Date.now();
        quest.result = { error: reason };
        
        await this.updateQuest(quest);
        
        this.state.activeQuests.delete(questId);
        
        console.log(`❌ Quest failed: ${quest.type} - ${reason}`);
        this.emit('quest_failed', quest);
    }
    
    async processActiveQuests() {
        // Check for stuck quests and timeout handling
        for (const [questId, quest] of this.state.activeQuests) {
            const age = Date.now() - quest.created_at;
            if (age > 300000) { // 5 minutes timeout
                await this.failQuest(questId, 'Quest timeout');
            }
        }
    }
    
    async generateAutoQuests() {
        // Auto-generate new quests based on player level and activity
        if (this.state.activeQuests.size < 2 && Math.random() < 0.3) {
            const questTypes = Object.keys(this.questTypes);
            const randomQuest = questTypes[Math.floor(Math.random() * questTypes.length)];
            
            try {
                await this.startQuest(randomQuest);
                console.log(`🎯 Auto-generated quest: ${randomQuest}`);
            } catch (error) {
                // Ignore auto-quest generation failures
            }
        }
    }
    
    /**
     * Generate quest dashboard HTML
     */
    generateDashboard() {
        const activeQuests = Array.from(this.state.activeQuests.values());
        const recentDiscoveries = Array.from(this.state.discoveredPackages.values()).slice(-5);
        const achievements = Array.from(this.state.achievements.values());
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Quest Engine Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 10px;
        }
        
        .section {
            background: rgba(255,255,255,0.05);
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .quest-item {
            background: rgba(255,255,255,0.1);
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00ff88;
        }
        
        .discovery-item {
            background: rgba(255,255,255,0.1);
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
        
        .achievement {
            background: linear-gradient(45deg, #ffd700, #ffb347);
            color: #000;
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            font-weight: bold;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        
        .btn:hover {
            background: #764ba2;
        }
        
        .progress-bar {
            background: rgba(255,255,255,0.2);
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #00ff88, #00ccff);
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Quest Engine Dashboard</h1>
        <p>OSS Discovery & Formula Generation System</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${(this.state.experience / (this.state.playerLevel * 1000)) * 100}%"></div>
        </div>
        <p>Level ${this.state.playerLevel} • ${this.state.experience} XP</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${activeQuests.length}</div>
            <div>Active Quests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${this.state.discoveredPackages.size}</div>
            <div>Discovered Packages</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${this.state.formulas.size}</div>
            <div>Generated Formulas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${achievements.length}</div>
            <div>Achievements</div>
        </div>
    </div>
    
    <div class="section">
        <h2>🎯 Active Quests</h2>
        ${activeQuests.map(quest => `
            <div class="quest-item">
                <strong>${this.questTypes[quest.type]?.name || quest.type}</strong><br>
                Target: ${quest.target}<br>
                XP Reward: ${quest.xp_reward}<br>
                <small>Started: ${new Date(quest.created_at).toLocaleString()}</small>
            </div>
        `).join('')}
        ${activeQuests.length === 0 ? '<p>No active quests. Start a new quest to begin discovering!</p>' : ''}
    </div>
    
    <div class="section">
        <h2>📦 Recent Discoveries</h2>
        ${recentDiscoveries.map(pkg => `
            <div class="discovery-item">
                <span><strong>${pkg.name}</strong> (${pkg.source})</span>
                <span>${pkg.version}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>🏆 Achievements</h2>
        ${achievements.map(achievement => `
            <div class="achievement">
                ${achievement.name} - ${achievement.description} (+${achievement.xp} XP)
            </div>
        `).join('')}
        ${achievements.length === 0 ? '<p>No achievements yet. Complete quests to unlock achievements!</p>' : ''}
    </div>
    
    <div class="section">
        <h2>🎮 Quest Actions</h2>
        <button class="btn" onclick="startQuest('github_explore')">🔍 Explore GitHub</button>
        <button class="btn" onclick="startQuest('npm_discovery')">📦 Discover NPM</button>
        <button class="btn" onclick="startQuest('version_tracker')">📊 Track Versions</button>
        <button class="btn" onclick="startQuest('formula_creator')">🔨 Create Formula</button>
        <button class="btn" onclick="startQuest('vulnerability_scout')">🛡️ Security Scout</button>
    </div>
    
    <script>
        async function startQuest(questType) {
            try {
                const response = await fetch('/api/quests/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questType })
                });
                
                if (response.ok) {
                    const quest = await response.json();
                    alert(\`Quest started: \${quest.type}\`);
                    location.reload();
                } else {
                    const error = await response.json();
                    alert(\`Failed to start quest: \${error.error}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        // Auto-refresh dashboard every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
    }
}

// Export for integration with Electron app
module.exports = QuestEngine;

// Run standalone if called directly
if (require.main === module) {
    const questEngine = new QuestEngine({ port: 8777 });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Quest Engine...');
        if (questEngine.db) {
            questEngine.db.close();
        }
        process.exit(0);
    });
}