#!/usr/bin/env node

/**
 * 🎮 DYNAMIC GAME API REGISTRY
 * Like RuneScape's API but for ALL games and services
 * Dynamically register and route to any game/service endpoint
 */

const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { Pool } = require('pg');
const Redis = require('ioredis');

class DynamicGameAPIRegistry {
    constructor() {
        this.app = express();
        this.port = process.env.DYNAMIC_API_PORT || 4455;
        this.upload = multer({ dest: 'uploads/' });
        
        // Game registry
        this.games = new Map();
        this.endpoints = new Map();
        this.contentTypeHandlers = new Map();
        
        // Service connections
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator'
        });
        
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        });
        
        // Character system integration
        this.characterAPI = {
            url: process.env.CHARACTER_API || 'http://localhost:3001',
            enabled: true
        };
        
        // Initialize core handlers
        this.initializeContentHandlers();
        this.registerCoreGames();
        this.setupDynamicRoutes();
        
        console.log('🎮 DYNAMIC GAME API REGISTRY INITIALIZED');
        console.log(`🌐 Dynamic endpoint: http://localhost:${this.port}/api/:gameId/*`);
    }
    
    /**
     * Initialize content type handlers
     */
    initializeContentHandlers() {
        // JSON handler (default)
        this.contentTypeHandlers.set('application/json', async (data) => {
            return typeof data === 'string' ? JSON.parse(data) : data;
        });
        
        // Form data handler
        this.contentTypeHandlers.set('multipart/form-data', async (data) => {
            return data; // Already parsed by multer
        });
        
        // PDF handler
        this.contentTypeHandlers.set('application/pdf', async (data) => {
            // Could integrate with PDF parsing service
            return { type: 'pdf', data: data.toString('base64') };
        });
        
        // Plain text handler
        this.contentTypeHandlers.set('text/plain', async (data) => {
            return { text: data.toString() };
        });
        
        // Binary handler
        this.contentTypeHandlers.set('application/octet-stream', async (data) => {
            return { type: 'binary', size: data.length, data: data.toString('base64') };
        });
        
        // Custom game data formats
        this.contentTypeHandlers.set('application/x-runescape', async (data) => {
            return this.parseRuneScapeData(data);
        });
        
        this.contentTypeHandlers.set('application/x-shiprekt', async (data) => {
            return this.parseShipRektData(data);
        });
    }
    
    /**
     * Register a new game/service
     */
    registerGame(gameId, config) {
        console.log(`🎯 Registering game: ${gameId}`);
        
        this.games.set(gameId, {
            id: gameId,
            name: config.name,
            description: config.description,
            apiBase: config.apiBase,
            endpoints: config.endpoints || {},
            contentTypes: config.contentTypes || ['application/json'],
            transformers: config.transformers || {},
            metadata: config.metadata || {},
            active: config.active !== false
        });
        
        // Register endpoints for discovery
        Object.keys(config.endpoints).forEach(endpoint => {
            const endpointKey = `${gameId}/${endpoint}`;
            this.endpoints.set(endpointKey, {
                gameId,
                endpoint,
                handler: config.endpoints[endpoint],
                description: config.endpoints[endpoint].description || ''
            });
        });
        
        // Store in database for persistence
        this.persistGameRegistration(gameId, config);
    }
    
    /**
     * Register core games and services
     */
    async registerCoreGames() {
        // ShipRekt Game
        this.registerGame('shiprekt', {
            name: 'ShipRekt Pirate Game',
            description: 'Convert documents into pirate trading games',
            apiBase: 'http://localhost:8889',
            endpoints: {
                'create-from-doc': {
                    description: 'Create game from document',
                    handler: async (params, contentType) => {
                        const doc = await this.handleContentType(params.body, contentType);
                        return this.createShipRektGame(doc);
                    }
                },
                'player-stats': {
                    description: 'Get player statistics',
                    handler: async (params) => {
                        return this.getShipRektPlayerStats(params.playerId);
                    }
                },
                'leaderboard': {
                    description: 'Get game leaderboard',
                    handler: async () => {
                        return this.getShipRektLeaderboard();
                    }
                }
            },
            contentTypes: ['application/json', 'multipart/form-data', 'text/plain']
        });
        
        // RuneScape Integration
        this.registerGame('runescape', {
            name: 'RuneScape/OSRS Integration',
            description: 'RuneScape API integration',
            apiBase: 'https://secure.runescape.com',
            endpoints: {
                'grand-exchange': {
                    description: 'Get Grand Exchange prices',
                    handler: async (params) => {
                        return this.getGrandExchangePrice(params.itemId);
                    }
                },
                'hiscores': {
                    description: 'Get player hiscores',
                    handler: async (params) => {
                        return this.getRuneScapeHiscores(params.player);
                    }
                },
                'collection-log': {
                    description: 'Get collection log data',
                    handler: async (params) => {
                        return this.getCollectionLog(params.player);
                    }
                }
            }
        });
        
        // Document to MVP
        this.registerGame('document-mvp', {
            name: 'Document to MVP Generator',
            description: 'Transform documents into working MVPs',
            apiBase: 'http://localhost:3001',
            endpoints: {
                'analyze': {
                    description: 'Analyze document with AI characters',
                    handler: async (params, contentType) => {
                        const doc = await this.handleContentType(params.body, contentType);
                        return this.analyzeWithCharacters(doc);
                    }
                },
                'generate': {
                    description: 'Generate MVP from document',
                    handler: async (params, contentType) => {
                        const doc = await this.handleContentType(params.body, contentType);
                        return this.generateMVP(doc, params.options);
                    }
                },
                'status': {
                    description: 'Check MVP generation status',
                    handler: async (params) => {
                        return this.getMVPStatus(params.jobId);
                    }
                }
            },
            contentTypes: ['application/json', 'application/pdf', 'text/plain', 'multipart/form-data']
        });
        
        // Character AI System
        this.registerGame('characters', {
            name: 'AI Character System',
            description: 'Character-driven AI processing',
            apiBase: 'http://localhost:3001',
            endpoints: {
                'consult': {
                    description: 'Consult AI character',
                    handler: async (params) => {
                        return this.consultCharacter(params.character, params.question);
                    }
                },
                'collaborate': {
                    description: 'Multi-character collaboration',
                    handler: async (params) => {
                        return this.characterCollaboration(params.characters, params.task);
                    }
                }
            }
        });
    }
    
    /**
     * Setup dynamic routing
     */
    setupDynamicRoutes() {
        this.app.use(express.json());
        this.app.use(express.raw({ type: '*/*', limit: '50mb' }));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'dynamic-game-api-registry',
                games: Array.from(this.games.keys()),
                timestamp: new Date().toISOString()
            });
        });
        
        // API Discovery endpoint
        this.app.get('/api/discover', (req, res) => {
            const discovery = {};
            
            this.games.forEach((game, gameId) => {
                discovery[gameId] = {
                    name: game.name,
                    description: game.description,
                    endpoints: Object.keys(game.endpoints).map(ep => ({
                        path: `/api/${gameId}/${ep}`,
                        description: game.endpoints[ep].description || ep
                    })),
                    contentTypes: game.contentTypes
                };
            });
            
            res.json(discovery);
        });
        
        // List all games
        this.app.get('/api/games', async (req, res) => {
            const games = Array.from(this.games.values()).filter(g => g.active);
            res.json({ games });
        });
        
        // Dynamic game routing - THE MAGIC HAPPENS HERE
        this.app.all('/api/:gameId/*', async (req, res) => {
            const { gameId } = req.params;
            const endpoint = req.params[0];
            const contentType = req.headers['content-type'] || 'application/json';
            
            try {
                // Check if game exists
                const game = this.games.get(gameId);
                if (!game) {
                    return res.status(404).json({ 
                        error: `Game '${gameId}' not found`,
                        availableGames: Array.from(this.games.keys())
                    });
                }
                
                // Check if endpoint exists
                const handler = game.endpoints[endpoint];
                if (!handler) {
                    return res.status(404).json({ 
                        error: `Endpoint '${endpoint}' not found for game '${gameId}'`,
                        availableEndpoints: Object.keys(game.endpoints)
                    });
                }
                
                // Check content type support
                if (!game.contentTypes.includes(contentType.split(';')[0])) {
                    return res.status(415).json({
                        error: `Content type '${contentType}' not supported`,
                        supportedTypes: game.contentTypes
                    });
                }
                
                // Execute the handler
                const params = {
                    body: req.body,
                    query: req.query,
                    params: req.params,
                    headers: req.headers,
                    ...req.query // Spread query params for easy access
                };
                
                const result = await handler.handler(params, contentType);
                
                // Log the request
                await this.logAPIRequest(gameId, endpoint, params, result);
                
                res.json({
                    success: true,
                    game: gameId,
                    endpoint: endpoint,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`Error in ${gameId}/${endpoint}:`, error);
                res.status(500).json({ 
                    error: error.message,
                    game: gameId,
                    endpoint: endpoint
                });
            }
        });
        
        // Start the server
        this.app.listen(this.port, () => {
            console.log(`🚀 Dynamic Game API Registry running on http://localhost:${this.port}`);
            console.log(`📡 Try: http://localhost:${this.port}/api/discover`);
        });
    }
    
    /**
     * Handle different content types
     */
    async handleContentType(data, contentType) {
        const handler = this.contentTypeHandlers.get(contentType.split(';')[0]);
        if (handler) {
            return handler(data);
        }
        return data; // Default passthrough
    }
    
    /**
     * Game-specific implementations
     */
    async createShipRektGame(doc) {
        // Integrate with document-to-shiprekt-game.js
        try {
            const response = await axios.post('http://localhost:8889/generate-game', {
                document: doc,
                gameMode: 'auto'
            });
            return response.data;
        } catch (error) {
            // Fallback implementation
            return {
                gameId: `shiprekt_${Date.now()}`,
                status: 'created',
                document: doc,
                gameUrl: `http://localhost:8889/game/${Date.now()}`
            };
        }
    }
    
    async analyzeWithCharacters(doc) {
        try {
            const response = await axios.post(`${this.characterAPI.url}/api/cal-compare/consult`, {
                expertType: 'technical-architecture',
                question: `Analyze this document and suggest how to build it: ${JSON.stringify(doc)}`
            });
            return response.data;
        } catch (error) {
            return { error: 'Character API unavailable', fallback: true };
        }
    }
    
    async generateMVP(doc, options = {}) {
        // Create a job for MVP generation
        const jobId = `mvp_${Date.now()}`;
        
        // Store job in database
        await this.db.query(
            'INSERT INTO mvp_jobs (id, document, options, status, created_at) VALUES ($1, $2, $3, $4, $5)',
            [jobId, JSON.stringify(doc), JSON.stringify(options), 'processing', new Date()]
        );
        
        // Process async
        this.processMVPGeneration(jobId, doc, options);
        
        return {
            jobId,
            status: 'processing',
            message: 'MVP generation started',
            checkStatusUrl: `/api/document-mvp/status?jobId=${jobId}`
        };
    }
    
    async processMVPGeneration(jobId, doc, options) {
        // This would integrate with your character system
        // For now, simulate the process
        setTimeout(async () => {
            await this.db.query(
                'UPDATE mvp_jobs SET status = $1, completed_at = $2 WHERE id = $3',
                ['completed', new Date(), jobId]
            );
        }, 5000);
    }
    
    /**
     * Persistence and logging
     */
    async persistGameRegistration(gameId, config) {
        try {
            await this.db.query(
                'INSERT INTO game_registry (game_id, config, created_at) VALUES ($1, $2, $3) ON CONFLICT (game_id) DO UPDATE SET config = $2, updated_at = $3',
                [gameId, JSON.stringify(config), new Date()]
            );
        } catch (error) {
            console.error('Failed to persist game registration:', error);
        }
    }
    
    async logAPIRequest(gameId, endpoint, params, result) {
        try {
            await this.db.query(
                'INSERT INTO api_requests (game_id, endpoint, params, result, created_at) VALUES ($1, $2, $3, $4, $5)',
                [gameId, endpoint, JSON.stringify(params), JSON.stringify(result), new Date()]
            );
            
            // Also cache in Redis for fast access
            const key = `api:${gameId}:${endpoint}:${Date.now()}`;
            await this.redis.setex(key, 3600, JSON.stringify({ params, result }));
        } catch (error) {
            console.error('Failed to log API request:', error);
        }
    }
    
    // Placeholder methods for external integrations
    async getGrandExchangePrice(itemId) {
        // Would integrate with real OSRS API
        return { itemId, price: Math.floor(Math.random() * 10000), cached: true };
    }
    
    async getRuneScapeHiscores(player) {
        return { player, skills: {}, cached: true };
    }
    
    async getCollectionLog(player) {
        return { player, entries: [], cached: true };
    }
    
    async getShipRektPlayerStats(playerId) {
        return { playerId, level: 1, gold: 100, ships: [] };
    }
    
    async getShipRektLeaderboard() {
        return { leaderboard: [], lastUpdated: new Date() };
    }
    
    async consultCharacter(character, question) {
        return { character, response: 'Character response placeholder', cached: true };
    }
    
    async characterCollaboration(characters, task) {
        return { characters, task, result: 'Collaboration result placeholder' };
    }
    
    async getMVPStatus(jobId) {
        const result = await this.db.query('SELECT * FROM mvp_jobs WHERE id = $1', [jobId]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return { error: 'Job not found' };
    }
    
    parseRuneScapeData(data) {
        // Custom RuneScape data format parser
        return { type: 'runescape', parsed: true, data };
    }
    
    parseShipRektData(data) {
        // Custom ShipRekt data format parser
        return { type: 'shiprekt', parsed: true, data };
    }
}

// Start the registry if run directly
if (require.main === module) {
    const registry = new DynamicGameAPIRegistry();
    
    // Example: Register a custom game dynamically
    setTimeout(() => {
        console.log('\n📝 Example: Registering custom game...');
        registry.registerGame('my-custom-game', {
            name: 'My Custom Game',
            description: 'A dynamically registered game',
            endpoints: {
                'test': {
                    description: 'Test endpoint',
                    handler: async (params) => {
                        return { message: 'Hello from custom game!', params };
                    }
                }
            }
        });
        console.log('✅ Custom game registered! Try: http://localhost:4455/api/my-custom-game/test');
    }, 2000);
}

module.exports = DynamicGameAPIRegistry;