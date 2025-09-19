#!/usr/bin/env node

/**
 * 🚀📡 PRODUCTION FORUM API SERVER
 * 
 * Real HTTP API server that integrates with the complete system:
 * - Forum posts and replies with RNG legendary responses
 * - Complete request tracing and ray tracing
 * - Integration with Service Bridge Layer and Event Bus
 * - Real database storage with SQLite
 * - Production-grade logging and monitoring
 * 
 * This is the "virtual machine" that makes everything work in production!
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;

class ProductionForumAPIServer {
    constructor() {
        this.serverId = `forum-api-${Date.now()}`;
        this.startTime = Date.now();
        this.port = 3334;
        
        // Request tracing
        this.requestTraces = new Map();
        this.activeRequests = 0;
        this.totalRequests = 0;
        
        // Database
        this.db = null;
        
        // External service connections
        this.serviceBridge = null;
        this.eventBus = null;
        
        // WebSocket clients for real-time updates
        this.wsClients = new Set();
        
        // RNG system for legendary responses
        this.responseRNG = {
            normal: 0.70,    // 70%
            rare: 0.25,      // 25%
            legendary: 0.05  // 5%
        };
        
        console.log('🚀📡 PRODUCTION FORUM API SERVER');
        console.log('===============================');
        console.log(`Server ID: ${this.serverId}`);
        console.log(`Port: ${this.port}`);
    }
    
    async initialize() {
        console.log('🔧 Initializing Production Forum API Server...');
        
        // Initialize database
        await this.initializeDatabase();
        
        // Set up Express app
        this.setupExpressApp();
        
        // Connect to Service Bridge Layer
        await this.connectToServiceBridge();
        
        // Connect to Event Bus
        await this.connectToEventBus();
        
        // Set up WebSocket server for real-time updates
        this.setupWebSocketServer();
        
        // Start HTTP server
        await this.startServer();
        
        console.log('✅ Production Forum API Server initialized');
        console.log('');
        this.printAPIEndpoints();
        
        return this;
    }
    
    async initializeDatabase() {
        console.log('🗄️ Setting up production database...');
        
        this.db = new sqlite3.Database('./production-forum.db');
        
        // Create tables with proper schema
        const tables = [
            `CREATE TABLE IF NOT EXISTS forum_posts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reply_count INTEGER DEFAULT 0,
                trace_id TEXT,
                request_ip TEXT,
                user_agent TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS forum_replies (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                content TEXT NOT NULL,
                rarity TEXT DEFAULT 'normal',
                character_assigned TEXT,
                gacha_result TEXT,
                processing_time INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                trace_id TEXT,
                FOREIGN KEY (post_id) REFERENCES forum_posts (id)
            )`,
            `CREATE TABLE IF NOT EXISTS request_traces (
                id TEXT PRIMARY KEY,
                request_type TEXT NOT NULL,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                duration INTEGER,
                steps TEXT,
                success BOOLEAN DEFAULT false,
                error_message TEXT,
                metadata TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                trace_id TEXT
            )`
        ];
        
        for (const table of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(table, err => err ? reject(err) : resolve());
            });
        }
        
        console.log('✅ Production database ready');
    }
    
    setupExpressApp() {
        console.log('⚙️ Setting up Express application...');
        
        this.app = express();
        
        // Middleware
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request tracing middleware
        this.app.use(this.requestTracingMiddleware.bind(this));
        
        // Routes
        this.setupAPIRoutes();
        
        console.log('✅ Express application configured');
    }
    
    requestTracingMiddleware(req, res, next) {
        // Create unique trace ID for this request
        const traceId = `trace-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
        req.traceId = traceId;
        
        this.activeRequests++;
        this.totalRequests++;
        
        // Start trace
        const trace = {
            id: traceId,
            method: req.method,
            url: req.url,
            startTime: Date.now(),
            steps: [],
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            success: false
        };
        
        this.requestTraces.set(traceId, trace);
        
        // Add step tracking method
        req.addTraceStep = (step, data = {}) => {
            trace.steps.push({
                step,
                timestamp: Date.now(),
                duration: Date.now() - trace.startTime,
                data
            });
            
            // Broadcast trace update in real-time
            this.broadcastTraceUpdate(trace);
        };
        
        req.addTraceStep('request_received', {
            method: req.method,
            url: req.url,
            headers: req.headers
        });
        
        // Override res.json to capture response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            trace.success = res.statusCode < 400;
            trace.endTime = Date.now();
            trace.duration = trace.endTime - trace.startTime;
            trace.responseData = data;
            
            req.addTraceStep('response_sent', {
                statusCode: res.statusCode,
                duration: trace.duration,
                success: trace.success
            });
            
            // Store trace in database
            this.storeTrace(trace);
            
            this.activeRequests--;
            
            return originalJson(data);
        };
        
        next();
    }
    
    setupAPIRoutes() {
        // Health check
        this.app.get('/api/health', this.handleHealthCheck.bind(this));
        
        // Forum routes
        this.app.post('/api/forum/post', this.handleCreatePost.bind(this));
        this.app.get('/api/forum/posts', this.handleGetPosts.bind(this));
        this.app.get('/api/forum/post/:postId', this.handleGetPost.bind(this));
        this.app.post('/api/forum/post/:postId/reply', this.handleCreateReply.bind(this));
        
        // Tracing routes
        this.app.get('/api/traces', this.handleGetTraces.bind(this));
        this.app.get('/api/trace/:traceId', this.handleGetTrace.bind(this));
        
        // System metrics
        this.app.get('/api/metrics', this.handleGetMetrics.bind(this));
        
        // Real-time dashboard
        this.app.get('/', this.handleDashboard.bind(this));
        
        console.log('✅ API routes configured');
    }
    
    async handleHealthCheck(req, res) {
        req.addTraceStep('health_check_start');
        
        // Check all system components
        const health = {
            server: {
                id: this.serverId,
                uptime: Date.now() - this.startTime,
                status: 'healthy'
            },
            database: await this.checkDatabaseHealth(),
            serviceBridge: this.serviceBridge ? 'connected' : 'disconnected',
            eventBus: this.eventBus ? 'connected' : 'disconnected',
            metrics: {
                activeRequests: this.activeRequests,
                totalRequests: this.totalRequests,
                wsClients: this.wsClients.size
            }
        };
        
        req.addTraceStep('health_check_complete', health);
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            health
        });
    }
    
    async checkDatabaseHealth() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get("SELECT 1", (err) => {
                    if (err) reject(err);
                    else resolve('healthy');
                });
            });
        } catch (error) {
            return 'error';
        }
    }
    
    async handleCreatePost(req, res) {
        req.addTraceStep('create_post_start', { body: req.body });
        
        try {
            const { username, content } = req.body;
            
            if (!username || !content) {
                req.addTraceStep('validation_failed', { error: 'Missing username or content' });
                return res.status(400).json({
                    success: false,
                    error: 'Username and content are required'
                });
            }
            
            // Generate post ID
            const postId = `post-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
            
            req.addTraceStep('validation_passed', { postId });
            
            // Store post in database
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT INTO forum_posts (id, username, content, trace_id, request_ip, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [postId, username, content, req.traceId, req.ip, req.get('User-Agent')],
                err => err ? reject(err) : resolve());
            });
            
            req.addTraceStep('post_stored', { postId });
            
            // Trigger Service Bridge Layer processing
            if (this.serviceBridge) {
                req.addTraceStep('triggering_service_bridge');
                
                // This will trigger the forum → gacha → character flow
                this.serviceBridge.simulateForumPost(username, content, {
                    postId,
                    traceId: req.traceId,
                    apiRequest: true
                });
                
                req.addTraceStep('service_bridge_triggered');
            }
            
            // Broadcast new post to WebSocket clients
            this.broadcastToClients({
                type: 'new_post',
                post: { id: postId, username, content, timestamp: new Date().toISOString() },
                traceId: req.traceId
            });
            
            req.addTraceStep('post_creation_complete');
            
            res.json({
                success: true,
                postId,
                traceId: req.traceId,
                message: 'Post created successfully'
            });
            
        } catch (error) {
            req.addTraceStep('create_post_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message,
                traceId: req.traceId
            });
        }
    }
    
    async handleGetPosts(req, res) {
        req.addTraceStep('get_posts_start');
        
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            
            // Get posts with reply counts
            const posts = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT p.*, 
                           COUNT(r.id) as reply_count,
                           GROUP_CONCAT(r.rarity) as reply_rarities
                    FROM forum_posts p
                    LEFT JOIN forum_replies r ON p.id = r.post_id
                    GROUP BY p.id
                    ORDER BY p.created_at DESC
                    LIMIT ? OFFSET ?
                `, [limit, offset], (err, rows) => {
                    err ? reject(err) : resolve(rows);
                });
            });
            
            // Get sample replies for each post
            for (const post of posts) {
                const replies = await new Promise((resolve, reject) => {
                    this.db.all(`
                        SELECT id, content, rarity, character_assigned, created_at
                        FROM forum_replies
                        WHERE post_id = ?
                        ORDER BY created_at DESC
                        LIMIT 3
                    `, [post.id], (err, rows) => {
                        err ? reject(err) : resolve(rows);
                    });
                });
                
                post.recent_replies = replies;
            }
            
            req.addTraceStep('posts_retrieved', { count: posts.length });
            
            res.json({
                success: true,
                posts,
                pagination: { limit, offset, count: posts.length }
            });
            
        } catch (error) {
            req.addTraceStep('get_posts_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleGetPost(req, res) {
        const postId = req.params.postId;
        req.addTraceStep('get_post_start', { postId });
        
        try {
            // Get post
            const post = await new Promise((resolve, reject) => {
                this.db.get(`
                    SELECT * FROM forum_posts WHERE id = ?
                `, [postId], (err, row) => {
                    err ? reject(err) : resolve(row);
                });
            });
            
            if (!post) {
                req.addTraceStep('post_not_found');
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }
            
            // Get all replies
            const replies = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT * FROM forum_replies
                    WHERE post_id = ?
                    ORDER BY created_at ASC
                `, [postId], (err, rows) => {
                    err ? reject(err) : resolve(rows);
                });
            });
            
            post.replies = replies;
            
            req.addTraceStep('post_retrieved', { 
                postId, 
                replyCount: replies.length,
                rarities: replies.map(r => r.rarity)
            });
            
            res.json({
                success: true,
                post
            });
            
        } catch (error) {
            req.addTraceStep('get_post_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleCreateReply(req, res) {
        const postId = req.params.postId;
        req.addTraceStep('create_reply_start', { postId, body: req.body });
        
        try {
            const { content } = req.body;
            
            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Content is required'
                });
            }
            
            // Check if post exists
            const post = await new Promise((resolve, reject) => {
                this.db.get("SELECT * FROM forum_posts WHERE id = ?", [postId], 
                    (err, row) => err ? reject(err) : resolve(row));
            });
            
            if (!post) {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }
            
            req.addTraceStep('post_exists', { postId });
            
            // Generate reply with RNG rarity
            const rarity = this.determineReplyRarity();
            const replyId = `reply-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
            
            req.addTraceStep('reply_rarity_determined', { rarity });
            
            // If using Service Bridge, this would trigger the full pipeline
            // For now, we'll create a direct reply with RNG enhancement
            const enhancedReply = await this.enhanceReplyWithRarity(content, rarity);
            
            req.addTraceStep('reply_enhanced', { 
                originalLength: content.length,
                enhancedLength: enhancedReply.content.length,
                rarity: enhancedReply.rarity
            });
            
            // Store reply in database
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT INTO forum_replies (id, post_id, content, rarity, processing_time, trace_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [replyId, postId, enhancedReply.content, enhancedReply.rarity, 
                    Date.now() - req.traceId.split('-')[1], req.traceId],
                err => err ? reject(err) : resolve());
            });
            
            req.addTraceStep('reply_stored');
            
            // Broadcast new reply
            this.broadcastToClients({
                type: 'new_reply',
                reply: {
                    id: replyId,
                    postId,
                    content: enhancedReply.content,
                    rarity: enhancedReply.rarity,
                    timestamp: new Date().toISOString()
                },
                traceId: req.traceId
            });
            
            res.json({
                success: true,
                replyId,
                rarity: enhancedReply.rarity,
                content: enhancedReply.content,
                traceId: req.traceId
            });
            
        } catch (error) {
            req.addTraceStep('create_reply_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    determineReplyRarity() {
        const roll = Math.random();
        
        if (roll < this.responseRNG.legendary) {
            return 'legendary';
        } else if (roll < this.responseRNG.legendary + this.responseRNG.rare) {
            return 'rare';
        } else {
            return 'normal';
        }
    }
    
    async enhanceReplyWithRarity(content, rarity) {
        switch (rarity) {
            case 'legendary':
                return {
                    content: this.createLegendaryReply(content),
                    rarity: 'legendary'
                };
                
            case 'rare':
                return {
                    content: this.createRareReply(content),
                    rarity: 'rare'
                };
                
            default:
                return {
                    content: this.createNormalReply(content),
                    rarity: 'normal'
                };
        }
    }
    
    createLegendaryReply(content) {
        const legendaryPrefixes = [
            "👑 ✨ LEGENDARY RESPONSE UNLOCKED ✨ 👑",
            "🌟 ULTRA RARE FORUM REPLY ACHIEVED 🌟",
            "⚡ MAXIMUM POWER RESPONSE ACTIVATED ⚡"
        ];
        
        const asciiArt = `
    ██╗     ███████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ██████╗ ██╗   ██╗
    ██║     ██╔════╝██╔════╝ ██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
    ██║     █████╗  ██║  ███╗█████╗  ██╔██╗ ██║██║  ██║███████║██████╔╝ ╚████╔╝ 
    ██║     ██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║██║  ██║██╔══██║██╔══██╗  ╚██╔╝  
    ███████╗███████╗╚██████╔╝███████╗██║ ╚████║██████╔╝██║  ██║██║  ██║   ██║   
    ╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
        `;
        
        return `${legendaryPrefixes[Math.floor(Math.random() * legendaryPrefixes.length)]}

${asciiArt}

${content}

🎊 Achievement Unlocked: Received Legendary Forum Reply! 🎊
🔥 This reply contains universe-shattering wisdom 🔥
📸 Screenshot this - you may never see another legendary reply!

✨ Legendary Reply Stats:
• Rarity: Ultra Rare (0.05% drop rate)
• Power Level: MAXIMUM
• Wisdom Multiplier: x100
• Screenshot Worthiness: INFINITE

👑 ✨ END LEGENDARY RESPONSE ✨ 👑`;
    }
    
    createRareReply(content) {
        const rarePrefixes = [
            "🔥 RARE RESPONSE ACTIVATED 🔥",
            "⭐ ENHANCED REPLY UNLOCKED ⭐",
            "💎 SPECIAL RESPONSE TRIGGERED 💎"
        ];
        
        return `${rarePrefixes[Math.floor(Math.random() * rarePrefixes.length)]}

${content}

✨ This is a rare response (25% chance)!
🎯 Enhanced with special formatting and extra insight
🔮 Your question triggered something special...`;
    }
    
    createNormalReply(content) {
        return content; // Normal replies are just the content
    }
    
    async handleGetTraces(req, res) {
        req.addTraceStep('get_traces_start');
        
        try {
            const limit = parseInt(req.query.limit) || 50;
            
            // Get recent traces
            const traces = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT * FROM request_traces
                    ORDER BY start_time DESC
                    LIMIT ?
                `, [limit], (err, rows) => {
                    err ? reject(err) : resolve(rows.map(row => ({
                        ...row,
                        steps: JSON.parse(row.steps || '[]'),
                        metadata: JSON.parse(row.metadata || '{}')
                    })));
                });
            });
            
            // Also include active traces
            const activeTraces = Array.from(this.requestTraces.values());
            
            req.addTraceStep('traces_retrieved', { 
                storedCount: traces.length,
                activeCount: activeTraces.length
            });
            
            res.json({
                success: true,
                traces: {
                    stored: traces,
                    active: activeTraces
                },
                summary: {
                    totalRequests: this.totalRequests,
                    activeRequests: this.activeRequests
                }
            });
            
        } catch (error) {
            req.addTraceStep('get_traces_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleGetTrace(req, res) {
        const traceId = req.params.traceId;
        req.addTraceStep('get_trace_start', { requestedTraceId: traceId });
        
        try {
            // Check active traces first
            let trace = this.requestTraces.get(traceId);
            
            if (!trace) {
                // Check database
                trace = await new Promise((resolve, reject) => {
                    this.db.get("SELECT * FROM request_traces WHERE id = ?", [traceId],
                        (err, row) => {
                            if (err) reject(err);
                            else if (row) {
                                resolve({
                                    ...row,
                                    steps: JSON.parse(row.steps || '[]'),
                                    metadata: JSON.parse(row.metadata || '{}')
                                });
                            } else {
                                resolve(null);
                            }
                        });
                });
            }
            
            if (!trace) {
                req.addTraceStep('trace_not_found');
                return res.status(404).json({
                    success: false,
                    error: 'Trace not found'
                });
            }
            
            req.addTraceStep('trace_retrieved', { traceId });
            
            res.json({
                success: true,
                trace
            });
            
        } catch (error) {
            req.addTraceStep('get_trace_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleGetMetrics(req, res) {
        req.addTraceStep('get_metrics_start');
        
        try {
            // System metrics
            const uptime = Date.now() - this.startTime;
            const memUsage = process.memoryUsage();
            
            // Database metrics
            const postCount = await new Promise((resolve, reject) => {
                this.db.get("SELECT COUNT(*) as count FROM forum_posts", 
                    (err, row) => err ? reject(err) : resolve(row.count));
            });
            
            const replyCount = await new Promise((resolve, reject) => {
                this.db.get("SELECT COUNT(*) as count FROM forum_replies", 
                    (err, row) => err ? reject(err) : resolve(row.count));
            });
            
            // Reply rarity distribution
            const rarityStats = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT rarity, COUNT(*) as count 
                    FROM forum_replies 
                    GROUP BY rarity
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.reduce((acc, row) => {
                        acc[row.rarity] = row.count;
                        return acc;
                    }, {}));
                });
            });
            
            const metrics = {
                server: {
                    id: this.serverId,
                    uptime,
                    totalRequests: this.totalRequests,
                    activeRequests: this.activeRequests,
                    wsClients: this.wsClients.size
                },
                memory: memUsage,
                database: {
                    posts: postCount,
                    replies: replyCount,
                    rarityDistribution: rarityStats
                },
                performance: {
                    avgResponseTime: this.calculateAverageResponseTime(),
                    successRate: this.calculateSuccessRate()
                }
            };
            
            req.addTraceStep('metrics_calculated', metrics);
            
            res.json({
                success: true,
                metrics,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            req.addTraceStep('get_metrics_error', { error: error.message });
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleDashboard(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Production Forum API - Real-time Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto; margin: 0; background: #1a1a1a; color: #fff; }
        .header { background: #2d3748; padding: 20px; border-bottom: 2px solid #4a5568; }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
        .panel { background: #2d3748; border-radius: 8px; padding: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #4a5568; border-radius: 4px; }
        .trace { font-family: monospace; background: #1a202c; padding: 10px; margin: 5px 0; border-radius: 4px; font-size: 12px; }
        .legendary { border-left: 4px solid #ffd700; }
        .rare { border-left: 4px solid #9f7aea; }
        .normal { border-left: 4px solid #48bb78; }
        .live { color: #68d391; }
        pre { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀📡 Production Forum API Server</h1>
        <p>Real-time dashboard showing live API requests, traces, and legendary replies</p>
    </div>
    
    <div class="container">
        <div class="panel">
            <h2>📊 Live Metrics</h2>
            <div id="metrics"></div>
        </div>
        
        <div class="panel">
            <h2>🔍 Request Traces</h2>
            <div id="traces"></div>
        </div>
        
        <div class="panel">
            <h2>📝 Recent Posts</h2>
            <div id="posts"></div>
        </div>
        
        <div class="panel">
            <h2>💎 Legendary Replies</h2>
            <div id="legendaries"></div>
        </div>
    </div>
    
    <script>
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:3334');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };
        
        function updateDashboard(data) {
            if (data.type === 'metrics') {
                document.getElementById('metrics').innerHTML = formatMetrics(data.metrics);
            } else if (data.type === 'trace_update') {
                updateTraces(data.trace);
            } else if (data.type === 'new_post') {
                updatePosts(data.post);
            } else if (data.type === 'new_reply') {
                updateReplies(data.reply);
            }
        }
        
        function formatMetrics(metrics) {
            return \`
                <div class="metric">🚀 Server: \${metrics.server.id}</div>
                <div class="metric">⏱️ Uptime: \${Math.round(metrics.server.uptime / 1000)}s</div>
                <div class="metric">📊 Total Requests: \${metrics.server.totalRequests}</div>
                <div class="metric live">🔥 Active Requests: \${metrics.server.activeRequests}</div>
                <div class="metric">🌐 WebSocket Clients: \${metrics.server.wsClients}</div>
                <div class="metric">📝 Posts: \${metrics.database?.posts || 0}</div>
                <div class="metric">💬 Replies: \${metrics.database?.replies || 0}</div>
            \`;
        }
        
        // Load initial data
        fetch('/api/metrics')
            .then(r => r.json())
            .then(data => updateDashboard({type: 'metrics', metrics: data.metrics}));
            
        fetch('/api/forum/posts?limit=5')
            .then(r => r.json())
            .then(data => {
                const postsHtml = data.posts.map(post => \`
                    <div class="trace">
                        <strong>\${post.username}</strong>: \${post.content.substring(0, 100)}...
                        <br><small>\${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                \`).join('');
                document.getElementById('posts').innerHTML = postsHtml;
            });
    </script>
</body>
</html>`;
        
        res.send(html);
    }
    
    async connectToServiceBridge() {
        console.log('🌉 Connecting to Service Bridge Layer...');
        
        try {
            const { ServiceBridgeLayer } = require('./SERVICE-BRIDGE-LAYER.js');
            this.serviceBridge = new ServiceBridgeLayer();
            await this.serviceBridge.initialize();
            
            // Listen for completed flows to create replies
            this.serviceBridge.on('flow:completed', this.handleServiceBridgeFlow.bind(this));
            
            console.log('✅ Connected to Service Bridge Layer');
        } catch (error) {
            console.log('⚠️ Service Bridge Layer not available:', error.message);
        }
    }
    
    async connectToEventBus() {
        console.log('⚡ Connecting to Event Bus...');
        
        try {
            const { RealTimeEventBus } = require('./REAL-TIME-EVENT-BUS.js');
            this.eventBus = new RealTimeEventBus();
            await this.eventBus.initialize();
            
            console.log('✅ Connected to Real-Time Event Bus');
        } catch (error) {
            console.log('⚠️ Event Bus not available:', error.message);
        }
    }
    
    async handleServiceBridgeFlow(flow) {
        console.log(`🎊 Flow completed: ${flow.id}`);
        
        try {
            // Find the original post that triggered this flow
            const originalRequest = flow.data?.forum;
            if (!originalRequest || !originalRequest.postId) return;
            
            // Determine rarity based on gacha result
            let rarity = 'normal';
            if (flow.data?.gacha?.legendary) {
                rarity = 'legendary';
            } else if (flow.data?.gacha?.critical) {
                rarity = 'rare';
            }
            
            // Create enhanced reply based on character result
            const characterResult = flow.finalResult;
            const replyContent = this.createServiceBridgeReply(characterResult, rarity);
            
            const replyId = `reply-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
            
            // Store reply in database
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT INTO forum_replies (id, post_id, content, rarity, character_assigned, gacha_result, processing_time, trace_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    replyId, 
                    originalRequest.postId, 
                    replyContent, 
                    rarity, 
                    characterResult.character,
                    JSON.stringify(flow.data?.gacha),
                    flow.duration,
                    flow.id
                ], err => err ? reject(err) : resolve());
            });
            
            // Broadcast new reply
            this.broadcastToClients({
                type: 'new_reply',
                reply: {
                    id: replyId,
                    postId: originalRequest.postId,
                    content: replyContent,
                    rarity: rarity,
                    character: characterResult.character,
                    processingTime: flow.duration,
                    timestamp: new Date().toISOString()
                },
                flowId: flow.id
            });
            
            console.log(`✅ Created ${rarity} reply from ${characterResult.character}`);
            
        } catch (error) {
            console.error('❌ Error handling service bridge flow:', error);
        }
    }
    
    createServiceBridgeReply(characterResult, rarity) {
        const baseReply = this.formatCharacterReply(characterResult);
        
        switch (rarity) {
            case 'legendary':
                return this.createLegendaryReply(baseReply);
            case 'rare':
                return this.createRareReply(baseReply);
            default:
                return baseReply;
        }
    }
    
    formatCharacterReply(characterResult) {
        const character = characterResult.character;
        const details = characterResult.details || {};
        
        switch (character) {
            case 'Cal':
                return `🧠 **Cal's System Analysis:**\n\n${details.analysis || 'Systematic approach recommended.'}\n\n**Recommendations:**\n${(details.recommendations || []).map(r => `• ${r}`).join('\n')}`;
                
            case 'Ralph':
                return `🔥 **Ralph's Test Results:**\n\n**Tests Run:** ${details.testsRun || 0}\n**Issues Found:** ${details.issuesFound || 0}\n\n**Verdict:** ${details.suggestion || 'Needs more testing!'}`;
                
            case 'Arty':
                return `✨ **Arty's Optimization Report:**\n\n**Aesthetic Score:** ${details.aestheticScore || 8}/10\n**Harmony Level:** ${details.harmonyLevel || 'good'}\n\n**Optimizations Applied:**\n${(details.optimizations || []).map(o => `• ${o}`).join('\n')}`;
                
            default:
                return 'Response processed successfully.';
        }
    }
    
    setupWebSocketServer() {
        console.log('🌐 Setting up WebSocket server...');
        
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            this.wsClients.add(ws);
            console.log(`📱 WebSocket client connected (${this.wsClients.size} total)`);
            
            // Send current metrics
            this.sendMetricsToClient(ws);
            
            ws.on('close', () => {
                this.wsClients.delete(ws);
                console.log(`📱 WebSocket client disconnected (${this.wsClients.size} total)`);
            });
        });
        
        // Send metrics every 5 seconds
        setInterval(() => {
            this.broadcastMetrics();
        }, 5000);
        
        console.log('✅ WebSocket server configured');
    }
    
    async startServer() {
        console.log('🚀 Starting HTTP server...');
        
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`✅ Production Forum API Server running on port ${this.port}`);
                resolve();
            });
        });
    }
    
    printAPIEndpoints() {
        console.log('🔗 API Endpoints:');
        console.log(`   📊 Dashboard:     http://localhost:${this.port}/`);
        console.log(`   🏥 Health:        GET  http://localhost:${this.port}/api/health`);
        console.log(`   📝 Create Post:   POST http://localhost:${this.port}/api/forum/post`);
        console.log(`   📖 Get Posts:     GET  http://localhost:${this.port}/api/forum/posts`);
        console.log(`   💬 Create Reply:  POST http://localhost:${this.port}/api/forum/post/:postId/reply`);
        console.log(`   🔍 Get Traces:    GET  http://localhost:${this.port}/api/traces`);
        console.log(`   📈 Get Metrics:   GET  http://localhost:${this.port}/api/metrics`);
        console.log(`   🌐 WebSocket:     ws://localhost:${this.port}`);
        console.log('');
        console.log('🎯 Test with:');
        console.log(`   curl -X POST http://localhost:${this.port}/api/forum/post \\`);
        console.log(`        -H "Content-Type: application/json" \\`);
        console.log(`        -d '{"username":"TestUser","content":"How do I optimize my React app?"}'`);
    }
    
    broadcastToClients(data) {
        const message = JSON.stringify(data);
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    broadcastTraceUpdate(trace) {
        this.broadcastToClients({
            type: 'trace_update',
            trace: trace
        });
    }
    
    async broadcastMetrics() {
        try {
            const metrics = await this.getCurrentMetrics();
            this.broadcastToClients({
                type: 'metrics',
                metrics: metrics
            });
        } catch (error) {
            console.error('Error broadcasting metrics:', error);
        }
    }
    
    async sendMetricsToClient(ws) {
        try {
            const metrics = await this.getCurrentMetrics();
            ws.send(JSON.stringify({
                type: 'metrics',
                metrics: metrics
            }));
        } catch (error) {
            console.error('Error sending metrics to client:', error);
        }
    }
    
    async getCurrentMetrics() {
        const uptime = Date.now() - this.startTime;
        const memUsage = process.memoryUsage();
        
        const postCount = await new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM forum_posts", 
                (err, row) => err ? reject(err) : resolve(row?.count || 0));
        }).catch(() => 0);
        
        const replyCount = await new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM forum_replies", 
                (err, row) => err ? reject(err) : resolve(row?.count || 0));
        }).catch(() => 0);
        
        return {
            server: {
                id: this.serverId,
                uptime,
                totalRequests: this.totalRequests,
                activeRequests: this.activeRequests,
                wsClients: this.wsClients.size
            },
            memory: memUsage,
            database: {
                posts: postCount,
                replies: replyCount
            }
        };
    }
    
    async storeTrace(trace) {
        try {
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT INTO request_traces (id, request_type, start_time, end_time, duration, steps, success, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    trace.id,
                    `${trace.method} ${trace.url}`,
                    new Date(trace.startTime).toISOString(),
                    trace.endTime ? new Date(trace.endTime).toISOString() : null,
                    trace.duration || null,
                    JSON.stringify(trace.steps),
                    trace.success,
                    JSON.stringify({
                        ip: trace.ip,
                        userAgent: trace.userAgent,
                        responseData: trace.responseData
                    })
                ], err => err ? reject(err) : resolve());
            });
        } catch (error) {
            console.error('Error storing trace:', error);
        }
    }
    
    calculateAverageResponseTime() {
        const traces = Array.from(this.requestTraces.values());
        if (traces.length === 0) return 0;
        
        const completedTraces = traces.filter(t => t.duration);
        if (completedTraces.length === 0) return 0;
        
        const total = completedTraces.reduce((sum, t) => sum + t.duration, 0);
        return Math.round(total / completedTraces.length);
    }
    
    calculateSuccessRate() {
        const traces = Array.from(this.requestTraces.values());
        if (traces.length === 0) return 100;
        
        const completedTraces = traces.filter(t => t.endTime);
        if (completedTraces.length === 0) return 100;
        
        const successful = completedTraces.filter(t => t.success).length;
        return Math.round((successful / completedTraces.length) * 100);
    }
}

// Export for use as module
module.exports = { ProductionForumAPIServer };

// CLI interface
if (require.main === module) {
    const server = new ProductionForumAPIServer();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
        case 'run':
        default:
            server.initialize()
                .then(() => {
                    console.log('🎊 Production Forum API Server is live!');
                    console.log('🔥 Making real API requests with legendary replies!');
                    console.log('📊 Real-time dashboard with complete observability!');
                    console.log('');
                    console.log('Press Ctrl+C to stop');
                    
                    // Keep running
                    process.on('SIGINT', () => {
                        console.log('\\n👋 Shutting down Production Forum API Server...');
                        process.exit(0);
                    });
                })
                .catch(console.error);
            break;
            
        case 'help':
            console.log(`
🚀📡 PRODUCTION FORUM API SERVER

Real HTTP API server with complete request tracing and legendary replies!

Commands:
  start  - Start the production API server
  run    - Alias for start

Examples:
  node PRODUCTION-FORUM-API-SERVER.js start

Features:
🔥 Real HTTP API endpoints (not just demos!)
🔍 Complete request tracing (ray tracing through all systems)
💎 RNG legendary replies (5% legendary, 25% rare, 70% normal)
📊 Real-time dashboard with live metrics
🌐 WebSocket updates for instant feedback
🗄️ SQLite database with full persistence
🌉 Integration with Service Bridge Layer
⚡ Event Bus connectivity for system-wide events

Test API:
  curl -X POST http://localhost:3333/api/forum/post \\
       -H "Content-Type: application/json" \\
       -d '{"username":"TestUser","content":"How do I optimize my app?"}'

This is your complete "virtual machine" in production!
            `);
    }
}