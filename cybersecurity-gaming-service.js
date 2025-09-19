#!/usr/bin/env node

/**
 * 🎮🛡️ CYBERSECURITY GAMING SERVICE
 * Main integration service that connects the cybersecurity gaming ecosystem
 * with the existing Document Generator platform infrastructure
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const Redis = require('ioredis');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Gaming System Imports
const CybersecurityShieldsLayer = require('./cybersecurity-shields-layer');
const SecurityGamingIntegration = require('./security-gaming-integration');
const TokenEnergyManager = require('./token-energy-manager');

// Platform Integration Imports
const characterDatabase = require('./character-database-integration');
const bashSystemIntegration = require('./bash-system-integration');

class CybersecurityGamingService {
    constructor(config = {}) {
        this.config = {
            port: process.env.GAMING_SERVICE_PORT || 9800,
            
            // Database configuration (using existing PostgreSQL)
            database: {
                host: process.env.POSTGRES_HOST || 'localhost',
                port: process.env.POSTGRES_PORT || 5432,
                database: process.env.POSTGRES_DB || 'document_generator',
                user: process.env.POSTGRES_USER || 'user',
                password: process.env.POSTGRES_PASSWORD || 'password',
                ssl: process.env.NODE_ENV === 'production'
            },
            
            // Redis configuration (using existing Redis)
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null
            },
            
            // AI Services integration
            aiServices: {
                localOllama: process.env.OLLAMA_URL || 'http://localhost:11434',
                aiApiService: process.env.AI_API_SERVICE_URL || 'http://localhost:3001',
                templateProcessor: process.env.TEMPLATE_PROCESSOR_URL || 'http://localhost:3000'
            },
            
            // Character system integration
            characterSystem: {
                enabled: true,
                characters: [
                    'ralph', 'alice', 'bob', 'charlie', 
                    'diana', 'eve', 'frank'
                ]
            },
            
            // Gaming system configuration
            gaming: {
                maxPlayersPerGame: 50,
                gameSessionTimeout: 1800000, // 30 minutes
                challengeRefreshRate: 300000, // 5 minutes
                realTimeUpdates: true
            },
            
            ...config
        };
        
        // Core services
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Database connections
        this.db = null;
        this.redis = null;
        
        // Gaming system components
        this.shieldsLayer = null;
        this.gamingIntegration = null;
        this.tokenManager = null;
        
        // Platform integration
        this.characterDB = null;
        this.bashSystem = null;
        
        // Game state management
        this.gameState = {
            activePlayers: new Map(),
            activeGames: new Map(),
            playerSessions: new Map(),
            challengeQueue: [],
            leaderboards: new Map(),
            serverStats: {
                startTime: Date.now(),
                totalGamesPlayed: 0,
                totalPlayersServed: 0,
                totalTokensEarned: 0
            }
        };
        
        // WebSocket connections
        this.wsConnections = new Set();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎮🛡️ Initializing Cybersecurity Gaming Service...');
        
        try {
            // Initialize database connections
            await this.initializeDatabaseConnections();
            
            // Initialize gaming systems
            await this.initializeGamingSystems();
            
            // Initialize platform integrations
            await this.initializePlatformIntegrations();
            
            // Setup Express middleware and routes
            this.setupExpressApp();
            
            // Setup WebSocket handlers
            this.setupWebSocketHandlers();
            
            // Initialize database schema
            await this.initializeDatabaseSchema();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            // Start the server
            await this.startServer();
            
            console.log('✅ Cybersecurity Gaming Service ready!');
            this.logServiceStatus();
            
        } catch (error) {
            console.error('❌ Failed to initialize Cybersecurity Gaming Service:', error);
            throw error;
        }
    }
    
    async initializeDatabaseConnections() {
        console.log('🔗 Connecting to existing platform databases...');
        
        // PostgreSQL connection (using existing database)
        this.db = new Pool(this.config.database);
        
        // Test database connection
        const dbTest = await this.db.query('SELECT NOW()');
        console.log(`✅ PostgreSQL connected: ${dbTest.rows[0].now}`);
        
        // Redis connection (using existing Redis)
        this.redis = new Redis(this.config.redis);
        
        // Test Redis connection
        await this.redis.ping();
        console.log('✅ Redis connected');
    }
    
    async initializeGamingSystems() {
        console.log('🎮 Initializing gaming systems...');
        
        // Initialize cybersecurity shields layer
        this.shieldsLayer = new CybersecurityShieldsLayer({
            database: this.db,
            redis: this.redis
        });
        
        // Initialize security gaming integration
        this.gamingIntegration = new SecurityGamingIntegration({
            database: this.db,
            redis: this.redis,
            shieldsLayer: this.shieldsLayer
        });
        
        // Initialize token energy manager
        this.tokenManager = new TokenEnergyManager({
            database: this.db,
            redis: this.redis,
            dollarLayer: { enabled: true, realWorldValue: false }
        });
        
        // Connect gaming systems together
        this.connectGamingSystems();
        
        console.log('✅ Gaming systems initialized');
    }
    
    connectGamingSystems() {
        // Connect shields layer with token manager
        this.shieldsLayer.on('tokens_earned', (data) => {
            this.tokenManager.earnTokens(data.tokenType, data.amount, data.reason);
        });
        
        this.shieldsLayer.on('energy_consumed', (data) => {
            this.tokenManager.useEnergy(data.amount, data.purpose);
        });
        
        // Connect gaming integration with shields layer
        this.gamingIntegration.on('boss_defeated', (data) => {
            this.shieldsLayer.earnTokens('meme_token', 5, 'boss_defeated');
        });
        
        this.gamingIntegration.on('player_level_up', (data) => {
            this.tokenManager.state.player.level = data.newLevel;
        });
        
        // Connect token manager with gaming events
        this.tokenManager.on('economic_event_started', (data) => {
            this.broadcastToAll({
                type: 'economic_event',
                event: data
            });
        });
    }
    
    async initializePlatformIntegrations() {
        console.log('🔗 Initializing platform integrations...');
        
        // Character database integration
        if (this.config.characterSystem.enabled) {
            this.characterDB = characterDatabase;
            
            // Setup character-based gaming mentors
            for (const characterName of this.config.characterSystem.characters) {
                await this.setupCharacterMentor(characterName);
            }
        }
        
        // Bash system integration for orchestration
        this.bashSystem = bashSystemIntegration;
        
        console.log('✅ Platform integrations ready');
    }
    
    async setupCharacterMentor(characterName) {
        const character = {
            name: characterName,
            role: 'cybersecurity_mentor',
            specialization: this.getCharacterSpecialization(characterName),
            gameContext: {
                challengesCreated: 0,
                playersHelped: 0,
                expertiseLevel: Math.floor(Math.random() * 5) + 1
            }
        };
        
        // Store character in game context
        await this.redis.set(
            `gaming:character:${characterName}`,
            JSON.stringify(character),
            'EX',
            86400 // 24 hours
        );
    }
    
    getCharacterSpecialization(characterName) {
        const specializations = {
            'ralph': 'network_security',
            'alice': 'cryptography',
            'bob': 'malware_analysis',
            'charlie': 'incident_response',
            'diana': 'threat_hunting',
            'eve': 'social_engineering',
            'frank': 'digital_forensics'
        };
        return specializations[characterName] || 'general_security';
    }
    
    setupExpressApp() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Rate limiting (following existing pattern)
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use('/api/', limiter);
        
        // Health check endpoint (following existing pattern)
        this.app.get('/health', (req, res) => {
            res.json({
                service: 'cybersecurity-gaming',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.gameState.serverStats.startTime,
                connections: this.wsConnections.size,
                activePlayers: this.gameState.activePlayers.size,
                activeGames: this.gameState.activeGames.size
            });
        });
        
        // API Routes
        this.setupAPIRoutes();
        
        // Static files for game interface
        this.app.use('/gaming', express.static('public/gaming'));
        
        console.log('🌐 Express app configured');
    }
    
    setupAPIRoutes() {
        const router = express.Router();
        
        // Game state endpoints
        router.get('/games/state', this.handleGetGameState.bind(this));
        router.post('/games/start', this.handleStartGame.bind(this));
        router.post('/games/:gameId/join', this.handleJoinGame.bind(this));
        router.post('/games/:gameId/leave', this.handleLeaveGame.bind(this));
        
        // Player endpoints
        router.get('/players/:playerId', this.handleGetPlayer.bind(this));
        router.post('/players/:playerId/action', this.handlePlayerAction.bind(this));
        router.get('/players/:playerId/stats', this.handleGetPlayerStats.bind(this));
        
        // Challenge endpoints
        router.get('/challenges', this.handleGetChallenges.bind(this));
        router.post('/challenges/:challengeId/attempt', this.handleAttemptChallenge.bind(this));
        router.get('/challenges/:challengeId/hint', this.handleGetHint.bind(this));
        
        // Token & Economy endpoints
        router.get('/economy/player/:playerId', this.handleGetPlayerEconomy.bind(this));
        router.post('/economy/plugins/activate', this.handleActivatePlugin.bind(this));
        router.post('/economy/specials/use', this.handleUseSpecial.bind(this));
        
        // Leaderboard endpoints
        router.get('/leaderboards/:type', this.handleGetLeaderboard.bind(this));
        
        // Character mentor endpoints
        router.get('/mentors', this.handleGetMentors.bind(this));
        router.post('/mentors/:characterName/consult', this.handleConsultMentor.bind(this));
        
        // Analytics endpoints (integrating with existing analytics)
        router.get('/analytics/overview', this.handleGetAnalytics.bind(this));
        router.get('/analytics/player/:playerId', this.handleGetPlayerAnalytics.bind(this));
        
        this.app.use('/api', router);
    }
    
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            
            const playerId = this.extractPlayerIdFromRequest(req);
            ws.playerId = playerId;
            
            this.wsConnections.add(ws);
            
            // Send initial game state
            ws.send(JSON.stringify({
                type: 'connection_established',
                playerId,
                gameState: this.getPublicGameState(),
                timestamp: Date.now()
            }));
            
            // Message handlers
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                this.handlePlayerDisconnect(playerId);
                console.log(`🔌 WebSocket connection closed for player ${playerId}`);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        
        console.log('🔌 WebSocket server configured');
    }
    
    async initializeDatabaseSchema() {
        console.log('📊 Setting up gaming database schema...');
        
        try {
            // Gaming tables (extending existing schema)
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS gaming_players (
                    id SERIAL PRIMARY KEY,
                    player_id VARCHAR(100) UNIQUE NOT NULL,
                    username VARCHAR(50),
                    email VARCHAR(100),
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    tokens JSONB DEFAULT '{}',
                    achievements JSONB DEFAULT '[]',
                    game_stats JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS gaming_sessions (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(100) UNIQUE NOT NULL,
                    player_id VARCHAR(100) REFERENCES gaming_players(player_id),
                    game_type VARCHAR(50),
                    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_time TIMESTAMP,
                    score INTEGER DEFAULT 0,
                    tokens_earned JSONB DEFAULT '{}',
                    achievements_unlocked JSONB DEFAULT '[]',
                    session_data JSONB DEFAULT '{}'
                )
            `);
            
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS gaming_challenges (
                    id SERIAL PRIMARY KEY,
                    challenge_id VARCHAR(100) UNIQUE NOT NULL,
                    title VARCHAR(200),
                    description TEXT,
                    category VARCHAR(50),
                    difficulty VARCHAR(20),
                    mentor_character VARCHAR(50),
                    challenge_data JSONB,
                    solution_data JSONB,
                    reward_tokens JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS gaming_leaderboards (
                    id SERIAL PRIMARY KEY,
                    player_id VARCHAR(100) REFERENCES gaming_players(player_id),
                    category VARCHAR(50),
                    score INTEGER,
                    rank INTEGER,
                    period VARCHAR(20), -- daily, weekly, monthly, all_time
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create indexes for performance
            await this.db.query('CREATE INDEX IF NOT EXISTS idx_gaming_players_player_id ON gaming_players(player_id)');
            await this.db.query('CREATE INDEX IF NOT EXISTS idx_gaming_sessions_player_id ON gaming_sessions(player_id)');
            await this.db.query('CREATE INDEX IF NOT EXISTS idx_gaming_leaderboards_category ON gaming_leaderboards(category, rank)');
            
            console.log('✅ Database schema initialized');
            
        } catch (error) {
            console.error('❌ Database schema setup failed:', error);
            throw error;
        }
    }
    
    startBackgroundProcesses() {
        console.log('⚙️ Starting background processes...');
        
        // Challenge generation and refresh
        setInterval(() => {
            this.refreshChallenges();
        }, this.config.gaming.challengeRefreshRate);
        
        // Leaderboard updates
        setInterval(() => {
            this.updateLeaderboards();
        }, 60000); // Every minute
        
        // Session cleanup
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 300000); // Every 5 minutes
        
        // Stats broadcasting
        setInterval(() => {
            this.broadcastServerStats();
        }, 30000); // Every 30 seconds
        
        console.log('✅ Background processes started');
    }
    
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🚀 Cybersecurity Gaming Service running on port ${this.config.port}`);
                    resolve();
                }
            });
        });
    }
    
    // ==================== API HANDLERS ====================
    
    async handleGetGameState(req, res) {
        try {
            const gameState = {
                ...this.getPublicGameState(),
                playerSpecific: req.query.playerId ? await this.getPlayerState(req.query.playerId) : null
            };
            
            res.json(gameState);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleStartGame(req, res) {
        try {
            const { playerId, gameType = 'cybersecurity_challenge' } = req.body;
            
            const game = await this.startNewGame(playerId, gameType);
            
            res.json({
                success: true,
                gameId: game.id,
                game
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleJoinGame(req, res) {
        try {
            const { gameId } = req.params;
            const { playerId } = req.body;
            
            const result = await this.addPlayerToGame(gameId, playerId);
            
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetPlayerEconomy(req, res) {
        try {
            const { playerId } = req.params;
            
            const economy = {
                tokens: this.tokenManager.getPlayerState().tokens,
                energy: this.tokenManager.getPlayerState().energy,
                plugins: this.tokenManager.getAvailablePlugins(),
                specials: this.tokenManager.getAvailableSpecials(),
                activeEvents: this.tokenManager.getActiveEvents()
            };
            
            res.json(economy);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleActivatePlugin(req, res) {
        try {
            const { pluginType, playerId } = req.body;
            
            const pluginId = this.tokenManager.activatePlugin(pluginType);
            
            res.json({
                success: !!pluginId,
                pluginId,
                message: pluginId ? 'Plugin activated' : 'Failed to activate plugin'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetMentors(req, res) {
        try {
            const mentors = [];
            
            for (const characterName of this.config.characterSystem.characters) {
                const characterData = await this.redis.get(`gaming:character:${characterName}`);
                if (characterData) {
                    mentors.push(JSON.parse(characterData));
                }
            }
            
            res.json(mentors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleConsultMentor(req, res) {
        try {
            const { characterName } = req.params;
            const { question, context } = req.body;
            
            const advice = await this.getMentorAdvice(characterName, question, context);
            
            res.json(advice);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // ==================== WEBSOCKET HANDLERS ====================
    
    handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join_game':
                    this.handleWSJoinGame(ws, data);
                    break;
                case 'player_action':
                    this.handleWSPlayerAction(ws, data);
                    break;
                case 'chat_message':
                    this.handleWSChatMessage(ws, data);
                    break;
                case 'use_plugin':
                    this.handleWSUsePlugin(ws, data);
                    break;
                case 'challenge_attempt':
                    this.handleWSChallengeAttempt(ws, data);
                    break;
                default:
                    console.warn('Unknown WebSocket message type:', data.type);
            }
        } catch (error) {
            console.error('WebSocket message handling error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    }
    
    // ==================== GAME LOGIC ====================
    
    async startNewGame(playerId, gameType) {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const game = {
            id: gameId,
            type: gameType,
            players: [playerId],
            startTime: Date.now(),
            status: 'active',
            challenges: await this.generateGameChallenges(gameType),
            leaderboard: new Map(),
            events: []
        };
        
        this.gameState.activeGames.set(gameId, game);
        this.gameState.serverStats.totalGamesPlayed++;
        
        // Broadcast game start
        this.broadcastToAll({
            type: 'game_started',
            gameId,
            gameType,
            playersCount: 1
        });
        
        return game;
    }
    
    async generateGameChallenges(gameType) {
        const challenges = [];
        
        // Generate different types of cybersecurity challenges
        const challengeTypes = [
            'vulnerability_identification',
            'malware_analysis',
            'network_forensics',
            'cryptography_puzzle',
            'social_engineering_defense',
            'incident_response'
        ];
        
        for (let i = 0; i < 5; i++) {
            const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
            const challenge = await this.createChallenge(type, i + 1);
            challenges.push(challenge);
        }
        
        return challenges;
    }
    
    async createChallenge(type, difficulty) {
        // This would integrate with the AI services to generate dynamic challenges
        const challenge = {
            id: `challenge_${Date.now()}_${type}`,
            type,
            difficulty,
            title: this.getChallengeTitle(type, difficulty),
            description: await this.generateChallengeDescription(type, difficulty),
            mentor: this.assignMentorToChallenge(type),
            rewards: this.calculateChallengeRewards(difficulty),
            timeLimit: 300000 + (difficulty * 60000), // 5 minutes + 1 min per difficulty
            attempts: 0,
            solved: false
        };
        
        return challenge;
    }
    
    // ==================== UTILITY METHODS ====================
    
    getPublicGameState() {
        return {
            serverInfo: {
                uptime: Date.now() - this.gameState.serverStats.startTime,
                totalPlayers: this.gameState.activePlayers.size,
                totalGames: this.gameState.activeGames.size
            },
            economics: {
                activeEvents: this.tokenManager.getActiveEvents(),
                serverStats: this.tokenManager.getEconomicStats()
            },
            leaderboards: Object.fromEntries(this.gameState.leaderboards)
        };
    }
    
    broadcastToAll(message) {
        const messageString = JSON.stringify(message);
        for (const ws of this.wsConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageString);
            }
        }
    }
    
    extractPlayerIdFromRequest(req) {
        // Extract from query params or generate anonymous ID
        const url = new URL(req.url, `http://${req.headers.host}`);
        return url.searchParams.get('playerId') || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    
    logServiceStatus() {
        console.log('\n🎮🛡️ CYBERSECURITY GAMING SERVICE STATUS:');
        console.log('==========================================');
        console.log(`🚀 Server: http://localhost:${this.config.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.config.port}`);
        console.log(`📊 Database: Connected to ${this.config.database.database}`);
        console.log(`🔴 Redis: Connected to ${this.config.redis.host}:${this.config.redis.port}`);
        console.log(`🎮 Active Games: ${this.gameState.activeGames.size}`);
        console.log(`👥 Active Players: ${this.gameState.activePlayers.size}`);
        console.log(`🔌 WebSocket Connections: ${this.wsConnections.size}`);
        console.log(`🎯 Characters Available: ${this.config.characterSystem.characters.length}`);
        console.log('==========================================\n');
    }
    
    // Placeholder methods to be implemented
    async refreshChallenges() { /* Implementation */ }
    async updateLeaderboards() { /* Implementation */ }
    async cleanupInactiveSessions() { /* Implementation */ }
    async broadcastServerStats() { /* Implementation */ }
    async getPlayerState(playerId) { /* Implementation */ }
    async addPlayerToGame(gameId, playerId) { /* Implementation */ }
    async getMentorAdvice(characterName, question, context) { /* Implementation */ }
    getChallengeTitle(type, difficulty) { return `${type} Challenge Level ${difficulty}`; }
    async generateChallengeDescription(type, difficulty) { return `A challenging ${type} scenario`; }
    assignMentorToChallenge(type) { return this.config.characterSystem.characters[0]; }
    calculateChallengeRewards(difficulty) { return { database_token: difficulty * 10 }; }
    handlePlayerDisconnect(playerId) { /* Implementation */ }
    handleWSJoinGame(ws, data) { /* Implementation */ }
    handleWSPlayerAction(ws, data) { /* Implementation */ }
    handleWSChatMessage(ws, data) { /* Implementation */ }
    handleWSUsePlugin(ws, data) { /* Implementation */ }
    handleWSChallengeAttempt(ws, data) { /* Implementation */ }
}

module.exports = CybersecurityGamingService;

// CLI usage
if (require.main === module) {
    const service = new CybersecurityGamingService();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 Shutting down Cybersecurity Gaming Service...');
        service.server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });
}