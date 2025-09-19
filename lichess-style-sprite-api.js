#!/usr/bin/env node

/**
 * Lichess-Style Sprite API
 * 
 * Implements ND-JSON streaming, OAuth-style tokens, and real-time sprite generation
 * Just like Lichess streams chess moves!
 */

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
require('dotenv').config();

class LichessSpriteAPI {
    constructor() {
        this.app = express();
        this.port = process.env.API_PORT || 3007;
        this.wsPort = process.env.WS_PORT || 3008;
        
        // Token storage (in production, use database)
        this.tokens = new Map();
        this.activeGenerations = new Map();
        
        // Statistics
        this.stats = {
            totalGenerated: 0,
            activeUsers: 0,
            totalApiCalls: 0
        };
        
        this.setupServer();
        this.setupWebSocket();
    }
    
    setupServer() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // OAuth-style endpoints
        this.app.post('/oauth/token', this.generateToken.bind(this));
        this.app.get('/api/account', this.authenticate.bind(this), this.getAccount.bind(this));
        
        // Lichess-style streaming endpoints
        this.app.get('/api/stream/sprite/:id', this.streamSpriteGeneration.bind(this));
        this.app.post('/api/sprite', this.authenticate.bind(this), this.createSprite.bind(this));
        this.app.get('/api/sprite/:id', this.getSprite.bind(this));
        
        // Draft system like Lichess blogs
        this.app.post('/api/sprite/draft', this.authenticate.bind(this), this.createDraft.bind(this));
        this.app.get('/api/sprite/draft/:id', this.authenticate.bind(this), this.getDraft.bind(this));
        this.app.post('/api/sprite/draft/:id/publish', this.authenticate.bind(this), this.publishDraft.bind(this));
        
        // User status endpoint
        this.app.get('/api/users/status', this.getUsersStatus.bind(this));
        
        // Interactive API documentation
        this.app.get('/api', this.serveAPIDocs.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            const userId = this.generateId();
            console.log(`🔌 WebSocket client connected: ${userId}`);
            
            ws.userId = userId;
            ws.isAlive = true;
            
            ws.on('pong', () => ws.isAlive = true);
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 WebSocket client disconnected: ${userId}`);
            });
            
            // Send initial connection success
            ws.send(JSON.stringify({
                type: 'connected',
                userId: userId,
                timestamp: new Date().toISOString()
            }));
        });
        
        // Heartbeat to keep connections alive
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) return ws.terminate();
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
        
        this.wss.on('close', () => clearInterval(interval));
    }
    
    // OAuth-style token generation
    generateToken(req, res) {
        const token = this.generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year like Lichess
        
        const tokenData = {
            token,
            createdAt: new Date(),
            expiresAt,
            usage: 0
        };
        
        this.tokens.set(token, tokenData);
        
        res.json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: 365 * 24 * 60 * 60, // seconds
            scope: 'sprite:read sprite:write'
        });
    }
    
    // Authentication middleware
    authenticate(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization' });
        }
        
        const token = authHeader.substring(7);
        const tokenData = this.tokens.get(token);
        
        if (!tokenData || new Date() > tokenData.expiresAt) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        tokenData.usage++;
        req.user = { token, ...tokenData };
        next();
    }
    
    // Stream sprite generation using ND-JSON
    async streamSpriteGeneration(req, res) {
        const spriteId = req.params.id;
        const generation = this.activeGenerations.get(spriteId);
        
        if (!generation) {
            return res.status(404).json({ error: 'Generation not found' });
        }
        
        // Set headers for streaming
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send initial event
        res.write(JSON.stringify({
            type: 'start',
            id: spriteId,
            prompt: generation.prompt,
            timestamp: new Date().toISOString()
        }) + '\n');
        
        // Simulate generation steps
        const steps = [
            { type: 'analyzing', message: 'Analyzing prompt...', progress: 0.1 },
            { type: 'preparing', message: 'Preparing AI model...', progress: 0.3 },
            { type: 'generating', message: 'Generating sprite...', progress: 0.6 },
            { type: 'processing', message: 'Processing image...', progress: 0.8 },
            { type: 'finalizing', message: 'Finalizing sprite...', progress: 0.95 }
        ];
        
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            res.write(JSON.stringify({
                ...step,
                id: spriteId,
                timestamp: new Date().toISOString()
            }) + '\n');
        }
        
        // Final result
        const result = await this.generateActualSprite(generation.prompt);
        generation.result = result;
        
        res.write(JSON.stringify({
            type: 'complete',
            id: spriteId,
            result: result,
            timestamp: new Date().toISOString()
        }) + '\n');
        
        res.end();
    }
    
    // Create sprite with streaming
    async createSprite(req, res) {
        const { prompt, stream = true } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        const spriteId = this.generateId();
        const generation = {
            id: spriteId,
            prompt,
            userId: req.user.token,
            createdAt: new Date(),
            status: 'pending'
        };
        
        this.activeGenerations.set(spriteId, generation);
        this.stats.totalApiCalls++;
        
        if (stream) {
            // Return stream URL
            res.json({
                id: spriteId,
                stream: `/api/stream/sprite/${spriteId}`,
                created: generation.createdAt
            });
        } else {
            // Generate synchronously
            const result = await this.generateActualSprite(prompt);
            generation.result = result;
            generation.status = 'complete';
            
            res.json({
                id: spriteId,
                result,
                created: generation.createdAt
            });
        }
    }
    
    // Draft system
    async createDraft(req, res) {
        const draft = {
            id: this.generateId(),
            userId: req.user.token,
            sprites: [],
            metadata: req.body.metadata || {},
            createdAt: new Date(),
            status: 'draft'
        };
        
        // Store draft (in production, use database)
        await fs.writeFile(
            path.join('drafts', `${draft.id}.json`),
            JSON.stringify(draft, null, 2)
        );
        
        res.json(draft);
    }
    
    // WebSocket message handler
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'generate':
                await this.handleWSGenerate(ws, data);
                break;
                
            case 'subscribe':
                // Subscribe to sprite generation updates
                ws.subscribedSprite = data.spriteId;
                break;
                
            case 'status':
                ws.send(JSON.stringify({
                    type: 'status',
                    stats: this.stats,
                    activeGenerations: this.activeGenerations.size
                }));
                break;
        }
    }
    
    async handleWSGenerate(ws, data) {
        const spriteId = this.generateId();
        
        // Send generation started
        ws.send(JSON.stringify({
            type: 'generation_started',
            id: spriteId,
            prompt: data.prompt
        }));
        
        // Simulate progressive updates
        const updates = [
            { progress: 0.25, status: 'Analyzing prompt' },
            { progress: 0.5, status: 'Generating with AI' },
            { progress: 0.75, status: 'Processing image' },
            { progress: 1.0, status: 'Complete' }
        ];
        
        for (const update of updates) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            ws.send(JSON.stringify({
                type: 'generation_progress',
                id: spriteId,
                ...update
            }));
        }
        
        // Generate actual sprite
        const result = await this.generateActualSprite(data.prompt);
        
        ws.send(JSON.stringify({
            type: 'generation_complete',
            id: spriteId,
            result
        }));
    }
    
    // Generate actual sprite (simplified for demo)
    async generateActualSprite(prompt) {
        const timestamp = Date.now();
        const filename = `sprite_${timestamp}.svg`;
        
        // Create simple SVG
        const svg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
            <rect width="128" height="128" fill="#667eea"/>
            <text x="64" y="64" text-anchor="middle" fill="white" font-size="14">
                ${prompt.substring(0, 10)}
            </text>
        </svg>`;
        
        await fs.mkdir('generated_sprites', { recursive: true });
        await fs.writeFile(path.join('generated_sprites', filename), svg);
        
        this.stats.totalGenerated++;
        
        return {
            url: `/generated_sprites/${filename}`,
            prompt,
            timestamp,
            service: 'demo'
        };
    }
    
    // Helper methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    generateSecureToken() {
        return crypto.randomBytes(32).toString('base64url');
    }
    
    // Missing method implementations
    async getAccount(req, res) {
        res.json({
            id: req.user.token.substring(0, 8),
            username: `user_${req.user.token.substring(0, 8)}`,
            createdAt: req.user.createdAt,
            usage: req.user.usage,
            tokensRemaining: 1000000
        });
    }
    
    async getSprite(req, res) {
        const generation = this.activeGenerations.get(req.params.id);
        if (!generation) {
            return res.status(404).json({ error: 'Sprite not found' });
        }
        res.json(generation);
    }
    
    async getDraft(req, res) {
        try {
            const draft = await fs.readFile(
                path.join('drafts', `${req.params.id}.json`),
                'utf8'
            );
            res.json(JSON.parse(draft));
        } catch (error) {
            res.status(404).json({ error: 'Draft not found' });
        }
    }
    
    async publishDraft(req, res) {
        res.json({ 
            message: 'Draft published',
            id: req.params.id,
            publishedAt: new Date()
        });
    }
    
    getUsersStatus(req, res) {
        res.json({
            online: this.wss?.clients?.size || 0,
            totalUsers: this.tokens.size,
            activeGenerations: this.activeGenerations.size
        });
    }
    
    // Serve API documentation
    serveAPIDocs(req, res) {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sprite API - Lichess Style</title>
                <style>
                    body { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
                    .endpoint { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 8px; }
                    .method { display: inline-block; padding: 5px 10px; border-radius: 4px; color: white; }
                    .GET { background: #61affe; }
                    .POST { background: #49cc90; }
                    code { background: #e8e8e8; padding: 2px 5px; border-radius: 3px; }
                    .collapsible { cursor: pointer; user-select: none; }
                    .content { display: none; padding: 10px 0; }
                    .active + .content { display: block; }
                </style>
            </head>
            <body>
                <h1>🎨 Sprite API Documentation</h1>
                <p>Lichess-style streaming API for AI sprite generation</p>
                
                <div class="endpoint">
                    <h3 class="collapsible">
                        <span class="method POST">POST</span> 
                        /oauth/token - Generate Access Token
                    </h3>
                    <div class="content">
                        <p>Generate a long-lived access token (1 year)</p>
                        <pre>curl -X POST http://localhost:${this.port}/oauth/token</pre>
                    </div>
                </div>
                
                <div class="endpoint">
                    <h3 class="collapsible">
                        <span class="method POST">POST</span> 
                        /api/sprite - Create Sprite
                    </h3>
                    <div class="content">
                        <p>Generate a new sprite with optional streaming</p>
                        <pre>curl -X POST http://localhost:${this.port}/api/sprite \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "pixel art dragon", "stream": true}'</pre>
                    </div>
                </div>
                
                <div class="endpoint">
                    <h3 class="collapsible">
                        <span class="method GET">GET</span> 
                        /api/stream/sprite/:id - Stream Generation
                    </h3>
                    <div class="content">
                        <p>Stream sprite generation progress using ND-JSON</p>
                        <pre>curl http://localhost:${this.port}/api/stream/sprite/SPRITE_ID</pre>
                    </div>
                </div>
                
                <h2>WebSocket API</h2>
                <p>Connect to ws://localhost:${this.wsPort} for real-time updates</p>
                
                <script>
                    document.querySelectorAll('.collapsible').forEach(el => {
                        el.addEventListener('click', () => {
                            el.classList.toggle('active');
                        });
                    });
                </script>
            </body>
            </html>
        `);
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🎮 Lichess-style Sprite API running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server on ws://localhost:${this.wsPort}`);
            console.log(`📚 API documentation at http://localhost:${this.port}/api`);
        });
    }
}

// Create directories
fs.mkdir('drafts', { recursive: true }).catch(() => {});

// Start server
const api = new LichessSpriteAPI();
api.start();