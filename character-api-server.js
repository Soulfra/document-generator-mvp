#!/usr/bin/env node

/**
 * CHARACTER API SERVER
 * RESTful API for character registration and authentication
 * Connects everything together: registration, QR auth, genetic hashes
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Import our services
const CharacterRegistrationService = require('./character-registration-service');
const GeneticHashAllocator = require('./genetic-hash-allocator');

class CharacterAPIServer {
    constructor() {
        this.app = express();
        this.port = 42001;
        
        // Services
        this.registrationService = null;
        this.hashAllocator = null;
        this.dbPool = null;
        
        // Configuration
        this.config = {
            jwtSecret: process.env.JWT_SECRET || 'character-genetic-secret-' + uuidv4(),
            jwtExpiry: '30d',
            
            dbHost: process.env.DB_HOST || 'localhost',
            dbUser: process.env.DB_USER || 'root',
            dbPassword: process.env.DB_PASSWORD || '',
            dbName: process.env.DB_NAME || 'economic_engine',
            
            corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080']
        };
        
        console.log('🎮 Character API Server initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Setup middleware
            this.setupMiddleware();
            
            // Connect to database
            await this.connectDatabase();
            
            // Initialize services
            await this.initializeServices();
            
            // Setup routes
            this.setupRoutes();
            
            // Start server
            this.app.listen(this.port, () => {
                console.log(`🎮 Character API Server running on http://localhost:${this.port}`);
                console.log(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
            });
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error);
            process.exit(1);
        }
    }
    
    setupMiddleware() {
        // CORS
        this.app.use(cors({
            origin: this.config.corsOrigins,
            credentials: true
        }));
        
        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
        
        // Static files for QR codes
        this.app.use('/qr', express.static('public/qr'));
    }
    
    async connectDatabase() {
        this.dbPool = await mysql.createPool({
            host: this.config.dbHost,
            user: this.config.dbUser,
            password: this.config.dbPassword,
            database: this.config.dbName,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('📊 Database connected');
    }
    
    async initializeServices() {
        // Initialize registration service
        this.registrationService = new CharacterRegistrationService();
        await new Promise((resolve) => {
            this.registrationService.once('ready', resolve);
        });
        
        // Initialize hash allocator
        this.hashAllocator = new GeneticHashAllocator();
        await new Promise((resolve) => {
            this.hashAllocator.once('ready', resolve);
        });
        
        console.log('✅ All services initialized');
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Character API',
                timestamp: new Date().toISOString()
            });
        });
        
        // API documentation
        this.app.get('/api/docs', (req, res) => {
            res.json({
                version: '1.0.0',
                endpoints: {
                    registration: {
                        checkName: 'GET /api/character/check-name/:name',
                        getLineages: 'GET /api/character/lineages',
                        register: 'POST /api/character/register',
                        regenerateQR: 'POST /api/character/:id/regenerate-qr'
                    },
                    authentication: {
                        authenticateQR: 'POST /api/auth/qr',
                        verifyToken: 'GET /api/auth/verify',
                        logout: 'POST /api/auth/logout'
                    },
                    character: {
                        getProfile: 'GET /api/character/:id',
                        getMyCharacter: 'GET /api/character/me',
                        getLineage: 'GET /api/character/:id/lineage',
                        getActivity: 'GET /api/character/:id/activity'
                    },
                    stats: {
                        poolStats: 'GET /api/stats/pool',
                        registrationStats: 'GET /api/stats/registrations'
                    }
                }
            });
        });
        
        // Registration endpoints
        this.app.get('/api/character/check-name/:name', this.checkCharacterName.bind(this));
        this.app.get('/api/character/lineages', this.getAvailableLineages.bind(this));
        this.app.post('/api/character/register', this.registerCharacter.bind(this));
        this.app.post('/api/character/:id/regenerate-qr', this.authenticateToken.bind(this), this.regenerateQR.bind(this));
        
        // Authentication endpoints
        this.app.post('/api/auth/qr', this.authenticateWithQR.bind(this));
        this.app.get('/api/auth/verify', this.authenticateToken.bind(this), this.verifyAuth.bind(this));
        this.app.post('/api/auth/logout', this.authenticateToken.bind(this), this.logout.bind(this));
        
        // Character endpoints (protected)
        this.app.get('/api/character/me', this.authenticateToken.bind(this), this.getMyCharacter.bind(this));
        this.app.get('/api/character/:id', this.getCharacterProfile.bind(this));
        this.app.get('/api/character/:id/lineage', this.getCharacterLineage.bind(this));
        this.app.get('/api/character/:id/activity', this.authenticateToken.bind(this), this.getCharacterActivity.bind(this));
        
        // Stats endpoints
        this.app.get('/api/stats/pool', this.getPoolStats.bind(this));
        this.app.get('/api/stats/registrations', this.getRegistrationStats.bind(this));
        
        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('API Error:', error);
            res.status(error.status || 500).json({
                error: error.message || 'Internal server error',
                code: error.code || 'SERVER_ERROR'
            });
        });
    }
    
    // ===== REGISTRATION ENDPOINTS =====
    
    async checkCharacterName(req, res) {
        try {
            const { name } = req.params;
            const result = await this.registrationService.checkNameAvailability(name);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getAvailableLineages(req, res) {
        try {
            const lineages = await this.registrationService.getAvailableLineages();
            res.json({
                lineages,
                descriptions: {
                    WARRIOR: "Strong and brave, masters of combat",
                    SCHOLAR: "Wise and learned, seekers of knowledge",
                    ROGUE: "Swift and cunning, shadows in the night",
                    MAGE: "Mystical and powerful, wielders of magic"
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async registerCharacter(req, res) {
        try {
            const { characterName, lineagePreference } = req.body;
            const authHeader = req.headers.authorization;
            
            // Extract user ID from JWT if provided, otherwise create guest user
            let userId;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const decoded = jwt.verify(token, this.config.jwtSecret);
                    userId = decoded.userId;
                } catch (error) {
                    // Invalid token, create guest
                }
            }
            
            if (!userId) {
                // Create guest user
                const [result] = await this.dbPool.execute(
                    `INSERT INTO users (email, username, auth_provider, created_at) 
                     VALUES (?, ?, 'guest', NOW())`,
                    [
                        `guest_${Date.now()}@example.com`,
                        `guest_${Math.random().toString(36).substring(7)}`
                    ]
                );
                userId = result.insertId;
            }
            
            // Register character
            const result = await this.registrationService.registerCharacter(userId, characterName, {
                lineagePreference,
                deviceFingerprint: req.headers['x-device-fingerprint'],
                method: 'api'
            });
            
            // Generate JWT for the character
            const token = jwt.sign({
                userId,
                characterId: result.character.id,
                characterName: result.character.name,
                lineage: result.character.lineage
            }, this.config.jwtSecret, {
                expiresIn: this.config.jwtExpiry
            });
            
            res.json({
                ...result,
                token,
                expiresIn: this.config.jwtExpiry
            });
            
        } catch (error) {
            if (error.message.includes('already taken')) {
                res.status(409).json({ error: error.message, code: 'NAME_TAKEN' });
            } else if (error.message.includes('No genetic hashes')) {
                res.status(503).json({ error: 'No character slots available, please try again later', code: 'NO_HASHES' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    
    async regenerateQR(req, res) {
        try {
            const characterId = parseInt(req.params.id);
            
            // Verify ownership
            if (req.user.characterId !== characterId) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            // Generate new QR data
            const qrData = {
                v: 'v1.0',
                cn: req.user.characterName,
                gh: req.user.geneticHash?.substring(0, 8),
                id: uuidv4(),
                ts: Date.now()
            };
            
            const qrDataString = JSON.stringify(qrData);
            const qrCode = await QRCode.toDataURL(qrDataString, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                width: 512
            });
            
            // Update database
            await this.dbPool.execute(
                'UPDATE characters SET qr_code = ?, qr_data = ? WHERE id = ?',
                [qrCode, qrDataString, characterId]
            );
            
            res.json({
                success: true,
                qrCode,
                message: 'QR code regenerated successfully'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // ===== AUTHENTICATION ENDPOINTS =====
    
    async authenticateWithQR(req, res) {
        try {
            const { qrData } = req.body;
            const deviceFingerprint = req.headers['x-device-fingerprint'];
            
            const result = await this.registrationService.authenticateQR(qrData, deviceFingerprint);
            
            // Get user ID for JWT
            const [users] = await this.dbPool.execute(
                'SELECT user_id FROM characters WHERE id = ?',
                [result.character.id]
            );
            
            // Generate JWT
            const token = jwt.sign({
                userId: users[0].user_id,
                characterId: result.character.id,
                characterName: result.character.name,
                lineage: result.character.lineage
            }, this.config.jwtSecret, {
                expiresIn: this.config.jwtExpiry
            });
            
            res.json({
                ...result,
                token,
                expiresIn: this.config.jwtExpiry
            });
            
        } catch (error) {
            res.status(401).json({ error: error.message, code: 'INVALID_QR' });
        }
    }
    
    async verifyAuth(req, res) {
        // If we get here, token is valid (middleware checked it)
        res.json({
            valid: true,
            user: req.user,
            expiresAt: new Date(req.user.exp * 1000).toISOString()
        });
    }
    
    async logout(req, res) {
        try {
            // Invalidate the auth token
            await this.dbPool.execute(
                'UPDATE character_auth SET is_active = FALSE WHERE character_id = ? AND auth_token = ?',
                [req.user.characterId, req.headers['x-auth-token']]
            );
            
            // Log activity
            await this.dbPool.execute(
                'INSERT INTO character_activity (character_id, activity_type) VALUES (?, ?)',
                [req.user.characterId, 'logout']
            );
            
            res.json({ success: true, message: 'Logged out successfully' });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // ===== CHARACTER ENDPOINTS =====
    
    async getMyCharacter(req, res) {
        try {
            const [characters] = await this.dbPool.execute(
                `SELECT c.*, u.username, u.email 
                 FROM characters c 
                 JOIN users u ON c.user_id = u.id 
                 WHERE c.id = ?`,
                [req.user.characterId]
            );
            
            if (characters.length === 0) {
                return res.status(404).json({ error: 'Character not found' });
            }
            
            const character = characters[0];
            character.traits = JSON.parse(character.traits);
            character.stats = JSON.parse(character.stats);
            
            res.json({
                character: {
                    id: character.id,
                    name: character.character_name,
                    geneticHash: character.genetic_hash,
                    lineage: character.lineage,
                    generation: character.generation,
                    traits: character.traits,
                    stats: character.stats,
                    qualityScore: character.quality_score,
                    createdAt: character.created_at,
                    qrCode: character.qr_code
                },
                owner: {
                    username: character.username,
                    email: character.email
                }
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCharacterProfile(req, res) {
        try {
            const characterId = parseInt(req.params.id);
            
            const [characters] = await this.dbPool.execute(
                'SELECT character_name, lineage, generation, quality_score, created_at FROM characters WHERE id = ? AND is_active = TRUE',
                [characterId]
            );
            
            if (characters.length === 0) {
                return res.status(404).json({ error: 'Character not found' });
            }
            
            res.json({
                character: characters[0]
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCharacterLineage(req, res) {
        try {
            const characterId = parseInt(req.params.id);
            
            // Get character and parent
            const [characters] = await this.dbPool.execute(
                'SELECT character_name, genetic_hash, parent_hash, lineage, generation FROM characters WHERE id = ?',
                [characterId]
            );
            
            if (characters.length === 0) {
                return res.status(404).json({ error: 'Character not found' });
            }
            
            const character = characters[0];
            const lineage = {
                character: {
                    name: character.character_name,
                    hash: character.genetic_hash.substring(0, 8) + '...',
                    lineage: character.lineage,
                    generation: character.generation
                },
                ancestors: [],
                descendants: []
            };
            
            // Find parent if exists
            if (character.parent_hash) {
                const [parents] = await this.dbPool.execute(
                    'SELECT id, character_name, lineage, generation FROM characters WHERE genetic_hash = ?',
                    [character.parent_hash]
                );
                
                if (parents.length > 0) {
                    lineage.ancestors.push(parents[0]);
                }
            }
            
            // Find children
            const [children] = await this.dbPool.execute(
                'SELECT id, character_name, lineage, generation FROM characters WHERE parent_hash = ?',
                [character.genetic_hash]
            );
            
            lineage.descendants = children;
            
            res.json(lineage);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCharacterActivity(req, res) {
        try {
            const characterId = parseInt(req.params.id);
            const limit = parseInt(req.query.limit) || 50;
            
            // Verify ownership or public profile
            if (req.user.characterId !== characterId) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            const [activities] = await this.dbPool.execute(
                'SELECT activity_type, activity_data, created_at FROM character_activity WHERE character_id = ? ORDER BY created_at DESC LIMIT ?',
                [characterId, limit]
            );
            
            res.json({
                activities: activities.map(a => ({
                    type: a.activity_type,
                    data: JSON.parse(a.activity_data || '{}'),
                    timestamp: a.created_at
                }))
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // ===== STATS ENDPOINTS =====
    
    async getPoolStats(req, res) {
        try {
            const stats = await this.hashAllocator.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getRegistrationStats(req, res) {
        try {
            const [stats] = await this.dbPool.execute(
                `SELECT 
                    COUNT(*) as totalCharacters,
                    COUNT(DISTINCT user_id) as totalUsers,
                    lineage,
                    COUNT(*) as lineageCount
                 FROM characters
                 WHERE is_active = TRUE
                 GROUP BY lineage WITH ROLLUP`
            );
            
            const totalStats = stats.find(s => s.lineage === null);
            const lineageStats = stats.filter(s => s.lineage !== null);
            
            res.json({
                total: {
                    characters: totalStats?.totalCharacters || 0,
                    users: totalStats?.totalUsers || 0
                },
                byLineage: lineageStats.reduce((acc, stat) => {
                    acc[stat.lineage] = stat.lineageCount;
                    return acc;
                }, {}),
                recentRegistrations: [] // Could add time-based stats
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // ===== MIDDLEWARE =====
    
    async authenticateToken(req, res, next) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });
        }
        
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            
            // Get full character data
            const [characters] = await this.dbPool.execute(
                'SELECT genetic_hash FROM characters WHERE id = ?',
                [decoded.characterId]
            );
            
            if (characters.length > 0) {
                decoded.geneticHash = characters[0].genetic_hash;
            }
            
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            } else {
                res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
            }
        }
    }
}

// Start the server
const server = new CharacterAPIServer();

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n🎮 Character API Server shutting down...');
    
    if (server.registrationService) {
        await server.registrationService.shutdown();
    }
    
    if (server.hashAllocator) {
        await server.hashAllocator.shutdown();
    }
    
    if (server.dbPool) {
        await server.dbPool.end();
    }
    
    process.exit(0);
});

module.exports = CharacterAPIServer;