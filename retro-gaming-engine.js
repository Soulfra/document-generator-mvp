#!/usr/bin/env node

/**
 * 🕹️ UNIFIED RETRO GAMING ENGINE
 * Classic Arcade (Pong/Atari/C64) + Modern AI + Thought-to-Directory Generation
 * Unifies all existing systems into a nostalgic arcade experience
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();

// Configuration
const CONFIG = {
    port: process.env.RETRO_PORT || 3013,
    host: process.env.RETRO_HOST || 'localhost',
    wsPort: process.env.RETRO_WS_PORT || 3014,
    
    // Existing service ports
    services: {
        weather: process.env.WEATHER_SERVICE || 'http://localhost:3011',
        facilities: process.env.FACILITIES_SERVICE || 'http://localhost:3012',
        virtualPhone: process.env.PHONE_SERVICE || 'http://localhost:3010',
        copilot: process.env.COPILOT_SERVICE || 'http://localhost:3007',
        d2d: process.env.D2D_SERVICE || 'http://localhost:3009'
    },
    
    // Retro gaming aesthetics
    graphics: {
        colors: {
            primary: '#00ff41',      // Matrix green
            secondary: '#00ffff',    // Cyan
            warning: '#ffff00',      // Yellow  
            danger: '#ff4141',       // Red
            background: '#000000',   // Black
            text: '#ffffff'          // White
        },
        fonts: {
            primary: 'VT323',        // Classic terminal
            secondary: 'Orbitron',   // Futuristic
            monospace: 'JetBrains Mono'
        },
        sounds: {
            blip: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEA...',
            pong: 'retro_pong.wav',
            coin: 'retro_coin.wav',
            powerup: 'retro_powerup.wav'
        }
    },
    
    // 007 Vault Grid (7×8 = 56 zones)
    grid: {
        rows: 7,
        cols: 8,
        totalZones: 56
    },
    
    // Classic games configuration
    games: {
        pong: { enabled: true, ai: true, weather: true },
        asteroids: { enabled: true, areaCode: true, facilities: true },
        tetris: { enabled: true, facilities: true, weather: true },
        spaceInvaders: { enabled: true, phone: true, qr: true },
        maze: { enabled: true, ai: true, directory: true },
        rogue: { enabled: true, vault: true, exploration: true }
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('retro-assets'));

// Retro Gaming Engine Core
class RetroGamingEngine {
    constructor() {
        this.games = new Map();
        this.activeGame = null;
        this.thoughtProcessor = null;
        this.directoryGenerator = null;
        this.vaultGrid = null;
        this.gameHistory = [];
        this.aiPersonas = ['COPILOT', 'ROUGHSPARKS', 'SATOSHI'];
        this.currentPersona = 'COPILOT';
        this.systemConnections = new Map();
        
        this.initializeEngine();
    }
    
    async initializeEngine() {
        console.log('🕹️ Initializing Retro Gaming Engine...');
        
        // Initialize core components
        await this.initializeVaultGrid();
        await this.initializeClassicGames();
        await this.initializeThoughtProcessor();
        await this.initializeDirectoryGenerator();
        await this.connectExistingSystems();
        
        console.log('✅ Retro Gaming Engine ready!');
    }
    
    async initializeVaultGrid() {
        console.log('🎯 Initializing 007 Vault Grid (7×8)...');
        
        // Define the 7×8 grid layout
        this.vaultGrid = {
            dimensions: { rows: 7, cols: 8 },
            zones: {},
            layout: [
                // Row 1: Core Systems
                ['AI', 'PHONE', 'WTHR', 'FACL', 'AREA', 'GAME', 'DOCS', 'API'],
                // Row 2: AI Personas & Features
                ['COPA', 'RUFF', 'SATO', 'VAULT', 'QR', 'AR', 'STRM', 'AFFL'],
                // Row 3: Classic Games
                ['PONG', 'ASTR', 'TETRIS', 'INVAD', 'MAZE', 'ROGUE', 'RPG', 'SIMUL'],
                // Row 4: Directory System
                ['DIR', 'LINK', 'TREE', 'LIST', 'SRCH', 'TAGS', 'CAT', 'ARCH'],
                // Row 5: Area Codes
                ['415', '212', '310', '713', '404', '206', '617', '305'],
                // Row 6: Facilities
                ['TENNIS', 'PICK', 'PARK', 'REC', 'COURT', 'POOL', 'GYM', 'TRACK'],
                // Row 7: Weather States
                ['SUNNY', 'RAIN', 'SNOW', 'WIND', 'HOT', 'COLD', 'STORM', 'FOG']
            ]
        };
        
        // Initialize each zone with metadata
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 8; col++) {
                const zoneId = `${row}_${col}`;
                const zoneName = this.vaultGrid.layout[row][col];
                
                this.vaultGrid.zones[zoneId] = {
                    id: zoneId,
                    name: zoneName,
                    row: row,
                    col: col,
                    type: this.getZoneType(row),
                    active: false,
                    data: {},
                    lastAccessed: null,
                    accessCount: 0,
                    connections: []
                };
            }
        }
        
        console.log(`🎯 Grid initialized: ${Object.keys(this.vaultGrid.zones).length} zones`);
    }
    
    getZoneType(row) {
        const types = [
            'core_systems',     // Row 0
            'ai_features',      // Row 1  
            'classic_games',    // Row 2
            'directory_system', // Row 3
            'area_codes',       // Row 4
            'facilities',       // Row 5
            'weather_states'    // Row 6
        ];
        
        return types[row] || 'unknown';
    }
    
    async initializeClassicGames() {
        console.log('🎮 Initializing Classic Games...');
        
        // Pong with AI personas
        this.games.set('pong', {
            name: 'AI Pong Arena',
            type: 'classic_arcade',
            description: 'Classic Pong with AI personas as opponents',
            mechanics: {
                aiOpponent: true,
                weatherPhysics: true,
                areaCodeTargeting: true,
                personas: this.aiPersonas
            },
            controls: ['up', 'down', 'pause'],
            status: 'ready'
        });
        
        // Asteroids with Area Codes
        this.games.set('asteroids', {
            name: 'Area Code Asteroids',
            type: 'classic_arcade',
            description: 'Asteroids representing area codes, facilities as power-ups',
            mechanics: {
                areaCodeAsteroids: true,
                facilityPowerUps: true,
                weatherEffects: true,
                realWorldData: true
            },
            controls: ['rotate_left', 'rotate_right', 'thrust', 'fire'],
            status: 'ready'
        });
        
        // Tetris with Facilities
        this.games.set('tetris', {
            name: 'Facility Tetris',
            type: 'classic_puzzle',
            description: 'Tetris blocks are real facilities, weather affects drop speed',
            mechanics: {
                facilityBlocks: true,
                weatherSpeed: true,
                areaCodeLevels: true,
                realTimeData: true
            },
            controls: ['left', 'right', 'rotate', 'drop'],
            status: 'ready'
        });
        
        // Space Invaders with Phone Numbers
        this.games.set('space_invaders', {
            name: 'Phone Number Invaders',
            type: 'classic_arcade', 
            description: 'Phone numbers as invaders, QR codes as shields',
            mechanics: {
                phoneInvaders: true,
                qrShields: true,
                virtualPhoneControl: true,
                aiPersonaBonus: true
            },
            controls: ['left', 'right', 'fire', 'phone_special'],
            status: 'ready'
        });
        
        // Directory Maze
        this.games.set('maze', {
            name: 'Directory Maze Explorer',
            type: 'classic_adventure',
            description: 'Navigate through AI-generated directory structures',
            mechanics: {
                thoughtGeneration: true,
                aiDirectories: true,
                craigslistStyle: true,
                vaultExploration: true
            },
            controls: ['up', 'down', 'left', 'right', 'interact'],
            status: 'ready'
        });
        
        console.log(`🎮 ${this.games.size} classic games initialized`);
    }
    
    async initializeThoughtProcessor() {
        console.log('🧠 Initializing Thought Processor...');
        
        this.thoughtProcessor = {
            // Natural language processing
            parseThought: async (input) => {
                console.log(`🧠 Processing thought: "${input}"`);
                
                // Extract intent, entities, and structure
                const analysis = {
                    originalInput: input,
                    intent: await this.classifyIntent(input),
                    entities: await this.extractEntities(input),
                    structure: await this.analyzeStructure(input),
                    gameRelevance: await this.assessGameRelevance(input),
                    directoryPattern: await this.generateDirectoryPattern(input)
                };
                
                return analysis;
            },
            
            // Convert thoughts to game actions
            thoughtToGame: async (thought) => {
                const analysis = await this.thoughtProcessor.parseThought(thought);
                
                if (analysis.gameRelevance > 0.7) {
                    return this.convertToGameAction(analysis);
                } else {
                    return this.convertToDirectoryAction(analysis);
                }
            }
        };
        
        console.log('🧠 Thought processor ready');
    }
    
    async classifyIntent(input) {
        // Simple intent classification (would use AI in production)
        const intents = {
            gaming: ['play', 'game', 'pong', 'tetris', 'arcade'],
            directory: ['organize', 'create', 'folder', 'file', 'list'],
            weather: ['weather', 'rain', 'sun', 'storm', 'forecast'],
            facility: ['tennis', 'court', 'park', 'gym', 'facility'],
            navigation: ['go', 'find', 'search', 'locate', 'area code']
        };
        
        const lowerInput = input.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(intents)) {
            for (const keyword of keywords) {
                if (lowerInput.includes(keyword)) {
                    return intent;
                }
            }
        }
        
        return 'general';
    }
    
    async extractEntities(input) {
        // Extract entities like area codes, game names, weather terms
        const entities = {
            areaCodes: input.match(/\b\d{3}\b/g) || [],
            gameNames: [],
            weatherTerms: [],
            facilityTypes: [],
            coordinates: []
        };
        
        // Game name extraction
        const gameNames = ['pong', 'tetris', 'asteroids', 'space invaders', 'maze'];
        gameNames.forEach(game => {
            if (input.toLowerCase().includes(game)) {
                entities.gameNames.push(game);
            }
        });
        
        // Weather terms
        const weatherTerms = ['sunny', 'rain', 'snow', 'storm', 'wind', 'hot', 'cold'];
        weatherTerms.forEach(term => {
            if (input.toLowerCase().includes(term)) {
                entities.weatherTerms.push(term);
            }
        });
        
        return entities;
    }
    
    async analyzeStructure(input) {
        // Analyze if input suggests a hierarchical structure
        const hasHierarchy = input.includes('/') || input.includes('->') || input.includes('under');
        const hasListing = input.includes('list') || input.includes('directory');
        const hasCategories = input.includes('category') || input.includes('group');
        
        return {
            hierarchical: hasHierarchy,
            listing: hasListing,
            categorical: hasCategories,
            complexity: this.assessComplexity(input)
        };
    }
    
    assessComplexity(input) {
        const words = input.split(' ').length;
        if (words < 5) return 'simple';
        if (words < 15) return 'moderate';
        return 'complex';
    }
    
    async assessGameRelevance(input) {
        // Score 0-1 how relevant input is to gaming
        const gameKeywords = ['play', 'game', 'score', 'level', 'arcade', 'pong', 'tetris'];
        const lowerInput = input.toLowerCase();
        
        let score = 0;
        gameKeywords.forEach(keyword => {
            if (lowerInput.includes(keyword)) score += 0.2;
        });
        
        return Math.min(score, 1.0);
    }
    
    async generateDirectoryPattern(input) {
        // Generate a directory structure pattern from the input
        const analysis = await this.extractEntities(input);
        const structure = await this.analyzeStructure(input);
        
        if (structure.hierarchical) {
            return this.generateHierarchicalPattern(input, analysis);
        } else if (structure.listing) {
            return this.generateListingPattern(input, analysis);
        } else {
            return this.generateSimplePattern(input, analysis);
        }
    }
    
    generateHierarchicalPattern(input, analysis) {
        // Create nested directory structure
        const pattern = {
            type: 'hierarchical',
            root: this.extractRootConcept(input),
            branches: this.extractBranches(input),
            leaves: this.extractLeaves(analysis)
        };
        
        return pattern;
    }
    
    generateListingPattern(input, analysis) {
        // Create flat listing like Craigslist
        const pattern = {
            type: 'listing',
            category: this.extractCategory(input),
            items: this.extractItems(input, analysis),
            metadata: this.extractMetadata(analysis)
        };
        
        return pattern;
    }
    
    generateSimplePattern(input, analysis) {
        // Create simple organization
        const pattern = {
            type: 'simple',
            concept: input.trim(),
            entities: analysis,
            suggestedStructure: this.suggestStructure(input)
        };
        
        return pattern;
    }
    
    extractRootConcept(input) {
        // Extract the main concept from input
        const words = input.split(' ');
        return words.find(word => word.length > 3) || 'general';
    }
    
    extractBranches(input) {
        // Find logical sub-categories
        return ['main', 'sub1', 'sub2']; // Simplified
    }
    
    extractLeaves(analysis) {
        // Create leaf nodes from entities
        return Object.values(analysis).flat();
    }
    
    extractCategory(input) {
        // Determine Craigslist-style category
        if (input.toLowerCase().includes('tennis')) return 'sports';
        if (input.toLowerCase().includes('weather')) return 'weather';
        if (input.toLowerCase().includes('game')) return 'gaming';
        return 'general';
    }
    
    extractItems(input, analysis) {
        // Extract individual items for listing
        const items = [];
        
        if (analysis.areaCodes.length > 0) {
            items.push(...analysis.areaCodes.map(code => ({ type: 'area_code', value: code })));
        }
        
        if (analysis.gameNames.length > 0) {
            items.push(...analysis.gameNames.map(game => ({ type: 'game', value: game })));
        }
        
        return items;
    }
    
    extractMetadata(analysis) {
        return {
            entityCount: Object.values(analysis).flat().length,
            categories: Object.keys(analysis),
            complexity: 'simple'
        };
    }
    
    suggestStructure(input) {
        // Suggest how to organize this input
        return {
            recommended: 'flat_listing',
            alternatives: ['hierarchical', 'tagged'],
            reasoning: 'Input appears simple and suitable for flat organization'
        };
    }
    
    async initializeDirectoryGenerator() {
        console.log('📁 Initializing Directory Generator...');
        
        this.directoryGenerator = {
            // Generate actual directory structures
            generateFromThought: async (thought) => {
                const analysis = await this.thoughtProcessor.parseThought(thought);
                const pattern = analysis.directoryPattern;
                
                return this.createDirectoryStructure(pattern);
            },
            
            // Create Craigslist-style listings
            generateListing: async (items, category) => {
                return this.createCraigslistListing(items, category);
            },
            
            // Generate RTF-style documents
            generateRTF: async (content) => {
                return this.createRTFDocument(content);
            }
        };
        
        console.log('📁 Directory generator ready');
    }
    
    async createDirectoryStructure(pattern) {
        const structure = {
            id: crypto.randomBytes(16).toString('hex'),
            type: pattern.type,
            created: new Date().toISOString(),
            structure: {},
            files: [],
            metadata: pattern
        };
        
        switch (pattern.type) {
            case 'hierarchical':
                structure.structure = await this.buildHierarchy(pattern);
                break;
            case 'listing':
                structure.structure = await this.buildListing(pattern);
                break;
            case 'simple':
                structure.structure = await this.buildSimple(pattern);
                break;
        }
        
        return structure;
    }
    
    async buildHierarchy(pattern) {
        const hierarchy = {
            [pattern.root]: {
                type: 'directory',
                children: {}
            }
        };
        
        pattern.branches.forEach(branch => {
            hierarchy[pattern.root].children[branch] = {
                type: 'directory',
                children: {}
            };
            
            pattern.leaves.forEach((leaf, index) => {
                if (index % pattern.branches.length === pattern.branches.indexOf(branch)) {
                    hierarchy[pattern.root].children[branch].children[leaf] = {
                        type: 'file',
                        content: `Content for ${leaf}`
                    };
                }
            });
        });
        
        return hierarchy;
    }
    
    async buildListing(pattern) {
        const listing = {
            category: pattern.category,
            items: pattern.items.map(item => ({
                id: crypto.randomBytes(8).toString('hex'),
                title: `${item.type}: ${item.value}`,
                description: `Auto-generated from thought processing`,
                type: item.type,
                value: item.value,
                created: new Date().toISOString(),
                links: this.generateLinks(item)
            })),
            metadata: pattern.metadata
        };
        
        return listing;
    }
    
    async buildSimple(pattern) {
        return {
            concept: pattern.concept,
            structure: pattern.suggestedStructure,
            entities: pattern.entities,
            files: [
                {
                    name: `${pattern.concept.replace(/\s+/g, '_')}.md`,
                    content: this.generateMarkdownContent(pattern)
                }
            ]
        };
    }
    
    generateLinks(item) {
        const links = [];
        
        if (item.type === 'area_code') {
            links.push({
                text: 'View Weather',
                url: `/api/weather/area-code/${item.value}`
            });
            links.push({
                text: 'Find Facilities',
                url: `/api/facilities/area-code/${item.value}`
            });
        }
        
        if (item.type === 'game') {
            links.push({
                text: 'Play Game',
                url: `/games/${item.value}`
            });
        }
        
        return links;
    }
    
    generateMarkdownContent(pattern) {
        return `# ${pattern.concept}

Generated from thought: "${pattern.concept}"

## Entities Found
${JSON.stringify(pattern.entities, null, 2)}

## Suggested Structure
${JSON.stringify(pattern.suggestedStructure, null, 2)}

Created: ${new Date().toISOString()}
`;
    }
    
    async createCraigslistListing(items, category) {
        const listing = {
            id: crypto.randomBytes(16).toString('hex'),
            category: category,
            title: `${category.toUpperCase()} LISTINGS`,
            items: items.map(item => ({
                id: crypto.randomBytes(8).toString('hex'),
                title: item.title || item.name || 'Untitled',
                description: item.description || 'No description',
                location: item.location || 'Location TBD',
                price: item.price || 'Free',
                posted: new Date().toISOString(),
                contact: item.contact || 'Contact via system',
                images: item.images || [],
                category: category
            })),
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        return listing;
    }
    
    async createRTFDocument(content) {
        // Generate RTF format document
        const rtf = {
            header: '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}',
            content: content.replace(/\n/g, '\\par '),
            footer: '}'
        };
        
        return rtf.header + rtf.content + rtf.footer;
    }
    
    async connectExistingSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Test connections to all existing services
        for (const [name, url] of Object.entries(CONFIG.services)) {
            try {
                const response = await fetch(`${url}/health`);
                if (response.ok) {
                    this.systemConnections.set(name, {
                        status: 'connected',
                        url: url,
                        lastCheck: Date.now(),
                        responseTime: Date.now() - performance.now()
                    });
                    console.log(`✅ ${name}: Connected`);
                } else {
                    this.systemConnections.set(name, {
                        status: 'error',
                        url: url,
                        lastCheck: Date.now(),
                        error: `HTTP ${response.status}`
                    });
                    console.log(`❌ ${name}: Error ${response.status}`);
                }
            } catch (error) {
                this.systemConnections.set(name, {
                    status: 'disconnected',
                    url: url,
                    lastCheck: Date.now(),
                    error: error.message
                });
                console.log(`⚠️ ${name}: Disconnected`);
            }
        }
        
        console.log(`🔗 ${this.systemConnections.size} systems checked`);
    }
    
    // Game mechanics
    async startGame(gameId, options = {}) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }
        
        this.activeGame = {
            id: gameId,
            ...game,
            startTime: Date.now(),
            options: options,
            state: this.initializeGameState(gameId, options)
        };
        
        console.log(`🎮 Started game: ${game.name}`);
        return this.activeGame;
    }
    
    initializeGameState(gameId, options) {
        const baseState = {
            gameId: gameId,
            score: 0,
            level: 1,
            lives: 3,
            paused: false,
            gameOver: false
        };
        
        switch (gameId) {
            case 'pong':
                return {
                    ...baseState,
                    paddle1: { y: 250, speed: 5 },
                    paddle2: { y: 250, speed: 5 },
                    ball: { x: 400, y: 250, dx: 5, dy: 3 },
                    aiPersona: options.persona || 'COPILOT'
                };
                
            case 'asteroids':
                return {
                    ...baseState,
                    ship: { x: 400, y: 300, angle: 0, thrust: 0 },
                    asteroids: this.generateAreaCodeAsteroids(options.areaCode),
                    facilities: this.generateFacilityPowerUps()
                };
                
            case 'tetris':
                return {
                    ...baseState,
                    grid: Array(20).fill().map(() => Array(10).fill(0)),
                    currentPiece: this.generateFacilityPiece(),
                    nextPiece: this.generateFacilityPiece(),
                    dropSpeed: this.calculateWeatherSpeed()
                };
                
            default:
                return baseState;
        }
    }
    
    generateAreaCodeAsteroids(areaCode) {
        // Generate asteroids based on area codes
        const asteroids = [];
        const areaCodes = areaCode ? [areaCode] : ['415', '212', '310', '713'];
        
        areaCodes.forEach((code, index) => {
            asteroids.push({
                id: `asteroid_${code}`,
                areaCode: code,
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: Math.random() * 50 + 20,
                rotation: 0,
                rotationSpeed: Math.random() * 5,
                velocity: { dx: Math.random() * 4 - 2, dy: Math.random() * 4 - 2 }
            });
        });
        
        return asteroids;
    }
    
    generateFacilityPowerUps() {
        // Generate power-ups based on real facilities
        return [
            { type: 'tennis_court', x: 100, y: 100, power: 'speed_boost' },
            { type: 'park', x: 300, y: 200, power: 'extra_life' },
            { type: 'gym', x: 500, y: 150, power: 'shield' }
        ];
    }
    
    generateFacilityPiece() {
        // Generate Tetris pieces representing facilities
        const facilityTypes = ['tennis', 'park', 'gym', 'pool'];
        const type = facilityTypes[Math.floor(Math.random() * facilityTypes.length)];
        
        return {
            type: type,
            shape: this.getFacilityShape(type),
            color: this.getFacilityColor(type),
            x: 4,
            y: 0
        };
    }
    
    getFacilityShape(type) {
        // Different Tetris shapes for different facility types
        const shapes = {
            tennis: [[1, 1], [1, 1]], // Square court
            park: [[1, 1, 1, 1]], // Long green space
            gym: [[1, 1, 1], [0, 1, 0]], // T-shape
            pool: [[1, 1, 1], [1, 0, 1]] // U-shape
        };
        
        return shapes[type] || [[1]];
    }
    
    getFacilityColor(type) {
        const colors = {
            tennis: '#00ff41', // Green
            park: '#41ff00',   // Bright green
            gym: '#ff4141',    // Red
            pool: '#0041ff'    // Blue
        };
        
        return colors[type] || '#ffffff';
    }
    
    async calculateWeatherSpeed() {
        // Get weather data and calculate Tetris drop speed
        try {
            const response = await fetch(`${CONFIG.services.weather}/api/weather/current/37.7749/-122.4194`);
            const weather = await response.json();
            
            if (weather && weather.windSpeed) {
                // Wind affects drop speed
                return Math.max(100, 500 - (weather.windSpeed * 10));
            }
        } catch (error) {
            console.error('Weather speed calculation error:', error);
        }
        
        return 500; // Default speed
    }
    
    // Process thoughts into game actions or directories
    async processThought(thought, options = {}) {
        console.log(`🧠 Processing thought: "${thought}"`);
        
        const analysis = await this.thoughtProcessor.parseThought(thought);
        
        if (analysis.gameRelevance > 0.7) {
            // Gaming-related thought
            return this.processGameThought(analysis, options);
        } else {
            // Directory/organization thought
            return this.processDirectoryThought(analysis, options);
        }
    }
    
    async processGameThought(analysis, options) {
        // Convert thought to game action
        const gameAction = {
            type: 'game_action',
            intent: analysis.intent,
            entities: analysis.entities,
            action: this.determineGameAction(analysis),
            timestamp: Date.now()
        };
        
        // If a game is requested, start it
        if (analysis.entities.gameNames.length > 0) {
            const gameId = analysis.entities.gameNames[0].replace(' ', '_');
            if (this.games.has(gameId)) {
                gameAction.gameStarted = await this.startGame(gameId, options);
            }
        }
        
        return gameAction;
    }
    
    async processDirectoryThought(analysis, options) {
        // Convert thought to directory structure
        const directoryResult = {
            type: 'directory_generation',
            intent: analysis.intent,
            structure: await this.directoryGenerator.generateFromThought(analysis.originalInput),
            craigslistListing: null,
            rtfDocument: null,
            timestamp: Date.now()
        };
        
        // Generate Craigslist-style listing if appropriate
        if (analysis.structure.listing) {
            directoryResult.craigslistListing = await this.directoryGenerator.generateListing(
                analysis.directoryPattern.items,
                analysis.directoryPattern.category
            );
        }
        
        // Generate RTF document if requested
        if (options.generateRTF) {
            directoryResult.rtfDocument = await this.directoryGenerator.generateRTF(
                JSON.stringify(directoryResult.structure, null, 2)
            );
        }
        
        return directoryResult;
    }
    
    determineGameAction(analysis) {
        // Map thought analysis to specific game actions
        if (analysis.intent === 'gaming') {
            if (analysis.originalInput.toLowerCase().includes('play')) {
                return 'start_game';
            } else if (analysis.originalInput.toLowerCase().includes('pause')) {
                return 'pause_game';
            } else if (analysis.originalInput.toLowerCase().includes('score')) {
                return 'show_score';
            }
        }
        
        return 'show_games';
    }
    
    // Vault Grid Access
    accessVaultZone(row, col) {
        const zoneId = `${row}_${col}`;
        const zone = this.vaultGrid.zones[zoneId];
        
        if (!zone) {
            throw new Error(`Invalid vault zone: ${zoneId}`);
        }
        
        zone.lastAccessed = Date.now();
        zone.accessCount++;
        zone.active = true;
        
        // Generate zone-specific data
        return this.generateZoneData(zone);
    }
    
    generateZoneData(zone) {
        const data = {
            zone: zone,
            realTimeData: {},
            gameIntegration: {},
            connections: []
        };
        
        switch (zone.type) {
            case 'core_systems':
                data.realTimeData = this.getCoreSystemData(zone.name);
                break;
            case 'ai_features':
                data.realTimeData = this.getAIFeatureData(zone.name);
                break;
            case 'classic_games':
                data.gameIntegration = this.getGameData(zone.name);
                break;
            case 'area_codes':
                data.realTimeData = this.getAreaCodeData(zone.name);
                break;
            case 'facilities':
                data.realTimeData = this.getFacilityData(zone.name);
                break;
            case 'weather_states':
                data.realTimeData = this.getWeatherData(zone.name);
                break;
        }
        
        return data;
    }
    
    getCoreSystemData(systemName) {
        const connection = this.systemConnections.get(systemName.toLowerCase());
        return {
            status: connection?.status || 'unknown',
            lastCheck: connection?.lastCheck || null,
            url: connection?.url || null
        };
    }
    
    getAIFeatureData(featureName) {
        // Return AI persona or feature-specific data
        return {
            persona: featureName.includes('COPA') ? 'COPILOT' : 
                    featureName.includes('RUFF') ? 'ROUGHSPARKS' :
                    featureName.includes('SATO') ? 'SATOSHI' : 'UNKNOWN',
            active: this.currentPersona === featureName,
            capabilities: this.getPersonaCapabilities(featureName)
        };
    }
    
    getPersonaCapabilities(persona) {
        const capabilities = {
            'COPA': ['technical_assistance', 'code_generation', 'problem_solving'],
            'RUFF': ['direct_action', 'enforcement', 'quick_execution'],
            'SATO': ['strategic_thinking', 'long_term_planning', 'wisdom']
        };
        
        return capabilities[persona] || [];
    }
    
    getGameData(gameName) {
        const game = this.games.get(gameName.toLowerCase());
        return {
            available: !!game,
            status: game?.status || 'unknown',
            mechanics: game?.mechanics || {},
            controls: game?.controls || []
        };
    }
    
    async getAreaCodeData(areaCode) {
        try {
            // Try to get real area code data
            const response = await fetch(`${CONFIG.services.facilities}/api/facilities/area-code/${areaCode}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    areaCode: areaCode,
                    facilities: data.facilities?.length || 0,
                    hasWeather: true
                };
            }
        } catch (error) {
            console.error('Area code data error:', error);
        }
        
        return {
            areaCode: areaCode,
            facilities: 0,
            hasWeather: false
        };
    }
    
    async getFacilityData(facilityType) {
        try {
            // Get facility data from the facilities service
            const response = await fetch(`${CONFIG.services.facilities}/api/facilities/search/37.7749/-122.4194?types=${facilityType}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    type: facilityType,
                    count: data.facilities?.length || 0,
                    weatherIntegrated: true
                };
            }
        } catch (error) {
            console.error('Facility data error:', error);
        }
        
        return {
            type: facilityType,
            count: 0,
            weatherIntegrated: false
        };
    }
    
    async getWeatherData(weatherState) {
        try {
            // Get weather data
            const response = await fetch(`${CONFIG.services.weather}/api/weather/current/37.7749/-122.4194`);
            if (response.ok) {
                const data = await response.json();
                return {
                    state: weatherState,
                    current: data.description || 'unknown',
                    matches: data.description?.toLowerCase().includes(weatherState.toLowerCase()) || false
                };
            }
        } catch (error) {
            console.error('Weather data error:', error);
        }
        
        return {
            state: weatherState,
            current: 'unknown',
            matches: false
        };
    }
    
    // Get system status
    getSystemStatus() {
        return {
            engine: 'operational',
            games: this.games.size,
            activeGame: this.activeGame?.id || null,
            vaultGrid: {
                zones: Object.keys(this.vaultGrid.zones).length,
                active: Object.values(this.vaultGrid.zones).filter(z => z.active).length
            },
            connections: Array.from(this.systemConnections.entries()).map(([name, conn]) => ({
                name,
                status: conn.status
            })),
            currentPersona: this.currentPersona,
            uptime: process.uptime()
        };
    }
}

const retroEngine = new RetroGamingEngine();

// API Endpoints

// Health check
app.get('/health', (req, res) => {
    res.json(retroEngine.getSystemStatus());
});

// Process thought input
app.post('/api/thought', async (req, res) => {
    const { thought, options = {} } = req.body;
    
    try {
        const result = await retroEngine.processThought(thought, options);
        res.json(result);
    } catch (error) {
        console.error('Thought processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Access vault grid zone
app.get('/api/vault/:row/:col', async (req, res) => {
    const { row, col } = req.params;
    
    try {
        const zoneData = retroEngine.accessVaultZone(parseInt(row), parseInt(col));
        res.json(zoneData);
    } catch (error) {
        console.error('Vault access error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get vault grid layout
app.get('/api/vault/grid', (req, res) => {
    res.json({
        dimensions: retroEngine.vaultGrid.dimensions,
        layout: retroEngine.vaultGrid.layout,
        zones: Object.keys(retroEngine.vaultGrid.zones).length
    });
});

// Start a game
app.post('/api/games/:gameId/start', async (req, res) => {
    const { gameId } = req.params;
    const { options = {} } = req.body;
    
    try {
        const game = await retroEngine.startGame(gameId, options);
        res.json(game);
    } catch (error) {
        console.error('Game start error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available games
app.get('/api/games', (req, res) => {
    const games = Array.from(retroEngine.games.entries()).map(([id, game]) => ({
        id,
        ...game
    }));
    
    res.json({ games });
});

// Get current game state
app.get('/api/games/current', (req, res) => {
    res.json({
        activeGame: retroEngine.activeGame,
        hasActiveGame: !!retroEngine.activeGame
    });
});

// Switch AI persona
app.post('/api/persona/:persona', (req, res) => {
    const { persona } = req.params;
    
    if (retroEngine.aiPersonas.includes(persona.toUpperCase())) {
        retroEngine.currentPersona = persona.toUpperCase();
        res.json({
            success: true,
            currentPersona: retroEngine.currentPersona,
            availablePersonas: retroEngine.aiPersonas
        });
    } else {
        res.status(400).json({
            error: 'Invalid persona',
            availablePersonas: retroEngine.aiPersonas
        });
    }
});

// Generate directory from thought
app.post('/api/directory/generate', async (req, res) => {
    const { thought, style = 'auto' } = req.body;
    
    try {
        const result = await retroEngine.directoryGenerator.generateFromThought(thought);
        res.json(result);
    } catch (error) {
        console.error('Directory generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate Craigslist-style listing
app.post('/api/craigslist/generate', async (req, res) => {
    const { items, category } = req.body;
    
    try {
        const listing = await retroEngine.directoryGenerator.generateListing(items, category);
        res.json(listing);
    } catch (error) {
        console.error('Craigslist generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(CONFIG.port, CONFIG.host, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🕹️ UNIFIED RETRO GAMING ENGINE                 ║
║                                                              ║
║  Classic Arcade + Modern AI + Directory Generation          ║
║                                                              ║
║  🌐 Server: http://${CONFIG.host}:${CONFIG.port}                             ║
║  🎮 Games: Pong, Asteroids, Tetris, Space Invaders         ║
║  🧠 AI: COPILOT, ROUGHSPARKS, SATOSHI personas             ║
║  📁 Auto-Directory: Thought → Structure generation          ║
║                                                              ║
║  007 Vault Grid (7×8):                                      ║
║  • Row 1: Core Systems (AI, PHONE, WTHR, FACL...)          ║
║  • Row 2: AI Features (COPA, RUFF, SATO, VAULT...)         ║
║  • Row 3: Classic Games (PONG, ASTR, TETRIS...)            ║
║  • Row 4: Directory System (DIR, LINK, TREE...)            ║
║  • Row 5: Area Codes (415, 212, 310, 713...)               ║
║  • Row 6: Facilities (TENNIS, PICK, PARK...)               ║
║  • Row 7: Weather States (SUNNY, RAIN, SNOW...)            ║
║                                                              ║
║  Features:                                                   ║
║  • Thought → Directory/Game generation                      ║
║  • Real-world data integration                              ║
║  • Classic arcade aesthetics                                ║
║  • Craigslist-style listing generation                      ║
║  • 007 vault-style grid navigation                          ║
║  • AI persona switching                                     ║
║                                                              ║
║  API Endpoints:                                              ║
║  • POST /api/thought (process thoughts)                     ║
║  • GET /api/vault/:row/:col (access grid)                   ║
║  • POST /api/games/:id/start (start games)                  ║
║  • POST /api/directory/generate (create directories)        ║
║  • POST /api/craigslist/generate (create listings)          ║
║                                                              ║
║  Status: Retro gaming engine operational                    ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, retroEngine, RetroGamingEngine, CONFIG };