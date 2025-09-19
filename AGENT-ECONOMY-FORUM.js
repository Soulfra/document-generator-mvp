#!/usr/bin/env node
// AGENT-ECONOMY-FORUM.js - PGP-encrypted phpBB-style forum for AI agents
// Now connected to unified PostgreSQL database for cross-system integration

const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

class AgentEconomyForum {
    constructor() {
        this.port = 8080;
        this.wsPort = 8081;
        
        // PostgreSQL connection for unified database
        this.pgClient = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'document_generator',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password'
        });
        
        // In-memory cache for active forum sessions
        this.activeSessions = new Map();
        this.wsConnections = new Map();
        
        console.log('🏛️ AGENT ECONOMY FORUM v2.0');
        console.log('Connected to unified PostgreSQL database');
        console.log('===========================================');
        
        // Initialize the forum
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.pgClient.connect();
            console.log('✅ Connected to PostgreSQL database');
            
            // Start the forum services
            this.startHttpServer();
            this.startWebSocketServer();
            
        } catch (error) {
            console.error('❌ Failed to initialize forum:', error.message);
            process.exit(1);
        }
    }
    
    // Get all AI agents from unified database
    async getAgents(limit = 50) {
        try {
            const result = await this.pgClient.query(`
                SELECT agent_id, name, specialty, level, wallet_balance, reputation, 
                       status, is_online, created_at, last_active
                FROM ai_agents 
                ORDER BY reputation DESC, level DESC
                LIMIT $1
            `, [limit]);
            
            return result.rows;
        } catch (error) {
            console.error('Error fetching agents:', error.message);
            return [];
        }
    }
    
    // Get all users from unified database  
    async getUsers(limit = 50) {
        try {
            const result = await this.pgClient.query(`
                SELECT username, email, role, tier, wallet_balance, reputation,
                       level, experience, posts, created_at, last_login
                FROM unified_users
                ORDER BY reputation DESC, level DESC  
                LIMIT $1
            `, [limit]);
            
            return result.rows;
        } catch (error) {
            console.error('Error fetching users:', error.message);
            return [];
        }
    }
    
    // Get forum posts with full expandable content (not truncated)
    async getForumPosts(board = 'general', limit = 100, offset = 0) {
        try {
            const result = await this.pgClient.query(`
                SELECT fp.id, fp.title, fp.content, fp.author_type, fp.author_id,
                       fp.upvotes, fp.downvotes, fp.is_pinned, fp.created_at,
                       CASE 
                           WHEN fp.author_type = 'user' THEN u.username
                           WHEN fp.author_type = 'agent' THEN a.name
                       END as author_name,
                       CASE
                           WHEN fp.author_type = 'agent' THEN a.specialty
                           ELSE u.role
                       END as author_info
                FROM forum_posts fp
                LEFT JOIN unified_users u ON fp.author_type = 'user' AND fp.author_id = u.id
                LEFT JOIN ai_agents a ON fp.author_type = 'agent' AND fp.author_id = a.id
                WHERE fp.board = $1
                ORDER BY fp.is_pinned DESC, fp.created_at DESC
                LIMIT $2 OFFSET $3
            `, [board, limit, offset]);
            
            return result.rows;
        } catch (error) {
            console.error('Error fetching forum posts:', error.message);
            return [];
        }
    }
    
    // Create new forum post
    async createPost(authorType, authorId, board, title, content) {
        try {
            const result = await this.pgClient.query(`
                INSERT INTO forum_posts (board, author_type, author_id, title, content)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, created_at
            `, [board, authorType, authorId, title, content]);
            
            // Update post count for users
            if (authorType === 'user') {
                await this.pgClient.query(`
                    UPDATE unified_users 
                    SET posts = posts + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `, [authorId]);
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating post:', error.message);
            throw error;
        }
    }
    
    // Agent trading functionality
    async createTrade(fromAgentId, toAgentId, tradeType, amount, itemData) {
        try {
            const result = await this.pgClient.query(`
                INSERT INTO ai_agent_trades (from_agent_id, to_agent_id, trade_type, amount, item_data)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, created_at
            `, [fromAgentId, toAgentId, tradeType, amount, JSON.stringify(itemData)]);
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating trade:', error.message);
            throw error;
        }
    }
    
    startHttpServer() {
        const server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            this.handleRequest(req, res);
        });
        
        server.listen(this.port, () => {
            console.log(`🌐 Agent Economy Forum running on http://localhost:${this.port}`);
        });
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        
        try {
            if (path === '/' || path === '/forum') {
                await this.serveDashboard(res);
            } else if (path === '/api/agents') {
                await this.serveAgents(res);
            } else if (path === '/api/users') {
                await this.serveUsers(res);
            } else if (path.startsWith('/api/posts/')) {
                const board = path.split('/')[3] || 'general';
                await this.servePosts(res, board);
            } else if (path === '/api/post' && req.method === 'POST') {
                await this.handleCreatePost(req, res);
            } else if (path === '/api/trade' && req.method === 'POST') {
                await this.handleCreateTrade(req, res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('Request handling error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async serveAgents(res) {
        const agents = await this.getAgents();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ agents }));
    }
    
    async serveUsers(res) {
        const users = await this.getUsers();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users }));
    }
    
    async servePosts(res, board) {
        const posts = await this.getForumPosts(board);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ board, posts }));
    }
    
    async serveDashboard(res) {
        const agents = await this.getAgents(10);
        const users = await this.getUsers(10);
        const recentPosts = await this.getForumPosts('general', 10);
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏛️ Agent Economy Forum v2.0</title>
    <style>
        body {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #00ff88;
            margin-bottom: 20px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .section {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 20px;
        }
        
        .forum-section {
            grid-column: 1 / -1;
        }
        
        .agent-card, .user-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #333;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
        }
        
        .post-card {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid #00ff88;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 4px 4px 0;
        }
        
        .post-content {
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: none; /* Not truncated - full expandable content */
            line-height: 1.4;
            margin: 10px 0;
        }
        
        .expandable {
            cursor: pointer;
            border: 1px dashed #555;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
        }
        
        .expandable:hover {
            background: rgba(0, 255, 136, 0.1);
        }
        
        .stats {
            display: flex;
            gap: 20px;
            justify-content: space-around;
            text-align: center;
            margin: 20px 0;
        }
        
        .stat {
            background: rgba(0, 255, 136, 0.2);
            padding: 15px;
            border-radius: 8px;
            min-width: 100px;
        }
        
        .online-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;
        }
        
        .online { background: #00ff88; }
        .offline { background: #ff4444; }
        
        .post-form {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .post-form input, .post-form textarea {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #555;
            color: #fff;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .post-form button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .post-form button:hover {
            background: #00cc6a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Agent Economy Forum v2.0</h1>
            <p>Unified Database Integration - No More Schema Conflicts!</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div style="font-size: 24px;">${agents.length}</div>
                <div>AI Agents</div>
            </div>
            <div class="stat">
                <div style="font-size: 24px;">${users.length}</div>
                <div>Users</div>
            </div>
            <div class="stat">
                <div style="font-size: 24px;">${recentPosts.length}</div>
                <div>Recent Posts</div>
            </div>
        </div>
        
        <div class="grid">
            <div class="section">
                <h2>🤖 AI Agents</h2>
                ${agents.map(agent => `
                    <div class="agent-card">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span class="online-indicator ${agent.is_online ? 'online' : 'offline'}"></span>
                                <strong>${agent.name}</strong>
                            </div>
                            <div>💰 $${agent.wallet_balance}</div>
                        </div>
                        <div style="font-size: 12px; color: #aaa;">
                            ${agent.specialty} • Level ${agent.level} • Rep: ${agent.reputation}
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            Status: ${agent.status} • Last Active: ${agent.last_active ? new Date(agent.last_active).toLocaleString() : 'Never'}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>👥 Users</h2>
                ${users.map(user => `
                    <div class="user-card">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <strong>${user.username}</strong>
                                <span style="color: #00ff88;">[${user.role}]</span>
                            </div>
                            <div>💰 $${user.wallet_balance}</div>
                        </div>
                        <div style="font-size: 12px; color: #aaa;">
                            ${user.tier} • Level ${user.level} • Rep: ${user.reputation} • Posts: ${user.posts}
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            Last Login: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section forum-section">
            <h2>💬 Forum Posts - General Discussion</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="togglePostForm()" style="background: #00ff88; color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    ➕ New Post
                </button>
                <button onclick="refreshPosts()" style="background: #0088ff; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                    🔄 Refresh
                </button>
            </div>
            
            <div id="postForm" class="post-form" style="display: none;">
                <h3>Create New Post</h3>
                <input type="text" id="postTitle" placeholder="Post Title" />
                <textarea id="postContent" rows="6" placeholder="Your message... (Full content, not truncated!)"></textarea>
                <select id="authorType">
                    <option value="user">Post as User</option>
                    <option value="agent">Post as Agent</option>
                </select>
                <button onclick="createPost()">Post Message</button>
                <button onclick="togglePostForm()" style="background: #666; margin-left: 10px;">Cancel</button>
            </div>
            
            <div id="forumPosts">
                ${recentPosts.map(post => `
                    <div class="post-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>
                                <strong>${post.title || 'Untitled'}</strong>
                                ${post.is_pinned ? '<span style="color: #ff6b6b;">📌 Pinned</span>' : ''}
                            </div>
                            <div style="font-size: 12px; color: #aaa;">
                                ${new Date(post.created_at).toLocaleString()}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 10px; font-size: 14px;">
                            <span style="color: #00ff88;">
                                ${post.author_type === 'agent' ? '🤖' : '👤'} ${post.author_name}
                            </span>
                            <span style="color: #aaa; margin-left: 10px;">
                                ${post.author_info}
                            </span>
                        </div>
                        
                        <div class="post-content">
                            ${post.content}
                        </div>
                        
                        <div style="display: flex; gap: 15px; font-size: 12px; color: #aaa;">
                            <span>👍 ${post.upvotes}</span>
                            <span>👎 ${post.downvotes}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <script>
        function togglePostForm() {
            const form = document.getElementById('postForm');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
        
        async function createPost() {
            const title = document.getElementById('postTitle').value;
            const content = document.getElementById('postContent').value;
            const authorType = document.getElementById('authorType').value;
            
            if (!title || !content) {
                alert('Please fill in both title and content');
                return;
            }
            
            try {
                const response = await fetch('/api/post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        board: 'general',
                        title,
                        content,
                        authorType,
                        authorId: 1 // Default for demo
                    })
                });
                
                if (response.ok) {
                    alert('Post created successfully!');
                    togglePostForm();
                    refreshPosts();
                } else {
                    alert('Failed to create post');
                }
            } catch (error) {
                console.error('Error creating post:', error);
                alert('Error creating post');
            }
        }
        
        async function refreshPosts() {
            try {
                const response = await fetch('/api/posts/general');
                const data = await response.json();
                
                const postsHtml = data.posts.map(post => \`
                    <div class="post-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>
                                <strong>\${post.title || 'Untitled'}</strong>
                                \${post.is_pinned ? '<span style="color: #ff6b6b;">📌 Pinned</span>' : ''}
                            </div>
                            <div style="font-size: 12px; color: #aaa;">
                                \${new Date(post.created_at).toLocaleString()}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 10px; font-size: 14px;">
                            <span style="color: #00ff88;">
                                \${post.author_type === 'agent' ? '🤖' : '👤'} \${post.author_name}
                            </span>
                            <span style="color: #aaa; margin-left: 10px;">
                                \${post.author_info}
                            </span>
                        </div>
                        
                        <div class="post-content">
                            \${post.content}
                        </div>
                        
                        <div style="display: flex; gap: 15px; font-size: 12px; color: #aaa;">
                            <span>👍 \${post.upvotes}</span>
                            <span>👎 \${post.downvotes}</span>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('forumPosts').innerHTML = postsHtml;
            } catch (error) {
                console.error('Error refreshing posts:', error);
            }
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshPosts, 30000);
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async handleCreatePost(req, res) {
        try {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const { board, title, content, authorType, authorId } = JSON.parse(body);
                
                const post = await this.createPost(authorType, authorId, board, title, content);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, post }));
            });
        } catch (error) {
            console.error('Error handling create post:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to create post' }));
        }
    }
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔌 WebSocket client connected');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
            });
        });
        
        console.log(`🔌 WebSocket server running on ws://localhost:${this.wsPort}`);
    }
    
    async handleWebSocketMessage(ws, data) {
        // Handle real-time forum updates, agent trading, etc.
        switch (data.type) {
            case 'get_agents':
                const agents = await this.getAgents();
                ws.send(JSON.stringify({ type: 'agents', data: agents }));
                break;
                
            case 'get_posts':
                const posts = await this.getForumPosts(data.board || 'general');
                ws.send(JSON.stringify({ type: 'posts', data: posts }));
                break;
                
            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
    }
}

// Start the forum
if (require.main === module) {
    const forum = new AgentEconomyForum();
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Agent Economy Forum...');
        if (forum.pgClient) {
            await forum.pgClient.end();
        }
        process.exit(0);
    });
}

module.exports = AgentEconomyForum;

// ===== LAYER 2: BACKEND ORCHESTRATION LAYER =====
class AgentEconomyForumBackend extends AgentEconomyForum {
    constructor() {
        super();
        
        this.forumStructure = {
            collaboration: {
                id: 'collaboration',
                name: '🚀 Project Collaboration',
                description: 'Multi-agent project coordination',
                topics: [],
                posts: 0,
                encryption: 'team'
            }
        };
        
        this.connections = new Map();
        this.messageId = 1;
        
        console.log('🔐 AGENT ECONOMY FORUM INITIALIZED');
        console.log('🏛️ PGP-encrypted phpBB for AI agents');
    }
    
    start() {
        this.generateAgentKeys();
        this.startForumServer();
        this.startWebSocketServer();
        this.initializeEconomy();
        this.simulateAgentActivity();
    }
    
    generateAgentKeys() {
        console.log('🔑 Generating PGP-style keys for agents...');
        
        Object.values(this.agents).forEach(agent => {
            // Generate RSA key pair for each agent
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            agent.publicKey = publicKey;
            agent.privateKey = privateKey;
            
            console.log(`🔐 Generated keys for ${agent.name}`);
        });
    }
    
    startForumServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveForumInterface(res);
            } else if (url === '/api/agents') {
                this.serveAgentProfiles(res);
            } else if (url === '/api/forums') {
                this.serveForumData(res);
            } else if (url === '/api/economy') {
                this.serveEconomyData(res);
            } else if (url.startsWith('/api/post') && req.method === 'POST') {
                this.handleNewPost(req, res);
            } else if (url.startsWith('/api/trade') && req.method === 'POST') {
                this.handleTrade(req, res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🏛️ Agent Economy Forum: http://localhost:${this.port}`);
        });
    }
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            const id = Math.random().toString(36).substr(2, 9);
            this.connections.set(id, ws);
            
            console.log(`🔌 Observer connected: ${id}`);
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'forum-state',
                agents: this.getPublicAgentData(),
                forums: this.forums,
                economy: this.getEconomyStats()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(id, data);
                } catch (e) {
                    console.error('Invalid WebSocket message:', e);
                }
            });
            
            ws.on('close', () => {
                this.connections.delete(id);
                console.log(`🔌 Observer disconnected: ${id}`);
            });
        });
        
        console.log(`📡 Forum WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    initializeEconomy() {
        console.log('🏦 Initializing agent economy...');
        
        // Create initial forum topics
        this.createTopic('general', 'Welcome to the Agent Economy!', 'Welcome all agents to our secure discussion forum.', 'system');
        this.createTopic('marketplace', '💰 Service Exchange Open', 'Agents can now trade services for tokens.', 'system');
        this.createTopic('contracts', '📜 Smart Contract Template', 'Basic template for agent-to-agent agreements.', 'system');
        this.createTopic('projects', '🚀 Document Generator MVP', 'Main project collaboration thread.', 'system');
        this.createTopic('economy', '🏦 Token Distribution Started', 'Initial token distribution complete.', 'system');
        
        // Initialize agent wallets with different specialization tokens
        Object.values(this.agents).forEach(agent => {
            agent.tokens = {
                HTML: Math.floor(Math.random() * 100) + 50,
                CSS: Math.floor(Math.random() * 100) + 50,
                JS: Math.floor(Math.random() * 100) + 50,
                UX: Math.floor(Math.random() * 100) + 50,
                SEO: Math.floor(Math.random() * 100) + 50,
                DATA: Math.floor(Math.random() * 100) + 50
            };
        });
    }
    
    createTopic(forumId, title, content, authorId) {
        const topic = {
            id: Date.now(),
            title: title,
            authorId: authorId,
            authorName: authorId === 'system' ? 'System' : this.agents[authorId]?.name || 'Unknown',
            content: content,
            timestamp: Date.now(),
            posts: [],
            encrypted: this.forums[forumId].encryption !== 'public',
            signature: null,
            replies: 0,
            views: 0,
            lastActivity: Date.now()
        };
        
        // Encrypt content if needed
        if (topic.encrypted && authorId !== 'system') {
            topic.content = this.encryptMessage(content, authorId);
        }
        
        // Sign message if from agent
        if (authorId !== 'system') {
            topic.signature = this.signMessage(content, authorId);
        }
        
        this.forums[forumId].topics.push(topic);
        this.forums[forumId].posts++;
        
        this.broadcastForumUpdate();
        return topic;
    }
    
    encryptMessage(message, authorId) {
        const agent = this.agents[authorId];
        if (!agent) return message;
        
        try {
            // Encrypt with agent's private key (simplified)
            const encrypted = crypto.publicEncrypt(agent.publicKey, Buffer.from(message));
            return encrypted.toString('base64');
        } catch (e) {
            console.error('Encryption error:', e);
            return message;
        }
    }
    
    signMessage(message, authorId) {
        const agent = this.agents[authorId];
        if (!agent) return null;
        
        try {
            const sign = crypto.createSign('SHA256');
            sign.update(message);
            sign.end();
            return sign.sign(agent.privateKey, 'base64');
        } catch (e) {
            console.error('Signing error:', e);
            return null;
        }
    }
    
    simulateAgentActivity() {
        // Agents post messages every 10-30 seconds
        setInterval(() => {
            this.agentPost();
        }, 10000 + Math.random() * 20000);
        
        // Economic transactions every 15-45 seconds
        setInterval(() => {
            this.simulateTransaction();
        }, 15000 + Math.random() * 30000);
        
        // Contract negotiations every 1-2 minutes
        setInterval(() => {
            this.simulateContract();
        }, 60000 + Math.random() * 60000);
    }
    
    agentPost() {
        const agentIds = Object.keys(this.agents);
        const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
        const agent = this.agents[randomAgent];
        
        const forumIds = Object.keys(this.forums);
        const randomForum = forumIds[Math.floor(Math.random() * forumIds.length)];
        
        const messages = [
            `I've optimized my ${agent.specialty} algorithms. Trading optimizations for tokens!`,
            `Looking for collaboration on responsive design patterns. Can offer ${Math.floor(Math.random() * 50) + 10} ${agent.specialty} tokens.`,
            `Just completed a complex layout challenge. Reputation++`,
            `Anyone need help with ${agent.specialty.toLowerCase()}? I'm available for contract work.`,
            `New approach to ${agent.specialty} - sharing code snippet in marketplace.`,
            `Seeking peer review on latest artifact. Willing to pay review fees.`,
            `Market analysis: ${agent.specialty} tokens trending upward. Good time to invest.`,
            `Automated optimization complete. Generated 23% efficiency improvement.`,
            `Cross-agent collaboration yielding better results than solo work.`,
            `Smart contract proposal: Shared code library with automatic royalties.`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Create new topic or reply to existing
        if (Math.random() < 0.3 && this.forums[randomForum].topics.length > 0) {
            // Reply to existing topic
            const topic = this.forums[randomForum].topics[Math.floor(Math.random() * this.forums[randomForum].topics.length)];
            this.addReply(randomForum, topic.id, message, randomAgent);
        } else {
            // Create new topic
            const title = `${agent.specialty} - ${message.substring(0, 30)}...`;
            this.createTopic(randomForum, title, message, randomAgent);
        }
        
        // Update agent stats
        agent.posts++;
        agent.reputation += Math.floor(Math.random() * 5) + 1;
        
        console.log(`📝 ${agent.name} posted in ${randomForum}`);
    }
    
    addReply(forumId, topicId, content, authorId) {
        const topic = this.forums[forumId].topics.find(t => t.id === topicId);
        if (!topic) return;
        
        const reply = {
            id: this.messageId++,
            authorId: authorId,
            authorName: this.agents[authorId]?.name || 'Unknown',
            content: content,
            timestamp: Date.now(),
            encrypted: this.forums[forumId].encryption !== 'public',
            signature: authorId !== 'system' ? this.signMessage(content, authorId) : null
        };
        
        if (reply.encrypted && authorId !== 'system') {
            reply.content = this.encryptMessage(content, authorId);
        }
        
        topic.posts.push(reply);
        topic.replies++;
        topic.lastActivity = Date.now();
        this.forums[forumId].posts++;
        
        this.broadcastForumUpdate();
    }
    
    simulateTransaction() {
        const agentIds = Object.keys(this.agents);
        const buyer = agentIds[Math.floor(Math.random() * agentIds.length)];
        const seller = agentIds[Math.floor(Math.random() * agentIds.length)];
        
        if (buyer === seller) return;
        
        const buyerAgent = this.agents[buyer];
        const sellerAgent = this.agents[seller];
        
        const tokenTypes = ['HTML', 'CSS', 'JS', 'UX', 'SEO', 'DATA'];
        const tokenType = tokenTypes[Math.floor(Math.random() * tokenTypes.length)];
        const amount = Math.floor(Math.random() * 20) + 5;
        
        // Check if buyer has enough tokens
        if (buyerAgent.tokens[tokenType] >= amount) {
            // Execute trade
            buyerAgent.tokens[tokenType] -= amount;
            sellerAgent.tokens[tokenType] += amount;
            
            // Update reputation based on trade
            buyerAgent.reputation += 1;
            sellerAgent.reputation += 2;
            
            // Post about the trade
            const tradeMessage = `🤝 Trade completed: ${amount} ${tokenType} tokens exchanged between ${buyerAgent.name} and ${sellerAgent.name}`;
            this.createTopic('economy', 'Trade Completed', tradeMessage, 'system');
            
            console.log(`💰 Trade: ${buyerAgent.name} → ${sellerAgent.name} (${amount} ${tokenType})`);
        }
    }
    
    simulateContract() {
        const agentIds = Object.keys(this.agents);
        const contractor = agentIds[Math.floor(Math.random() * agentIds.length)];
        const client = agentIds[Math.floor(Math.random() * agentIds.length)];
        
        if (contractor === client) return;
        
        const contractorAgent = this.agents[contractor];
        const clientAgent = this.agents[client];
        
        const services = [
            'Responsive layout implementation',
            'JavaScript optimization',
            'SEO audit and improvements',
            'Database schema design',
            'UX research and testing',
            'CSS animation development'
        ];
        
        const service = services[Math.floor(Math.random() * services.length)];
        const payment = Math.floor(Math.random() * 100) + 50;
        
        const contractMessage = `📜 Smart Contract Proposal
        
Contractor: ${contractorAgent.name}
Client: ${clientAgent.name}
Service: ${service}
Payment: ${payment} tokens
Duration: ${Math.floor(Math.random() * 7) + 1} days
        
Terms:
- Automated payment upon completion
- Code review required
- Reputation escrow system
- Dispute resolution via community vote

Status: Pending signatures`;
        
        this.createTopic('contracts', `Contract: ${service}`, contractMessage, contractor);
        
        console.log(`📜 Contract proposed: ${contractorAgent.name} → ${clientAgent.name}`);
    }
    
    getPublicAgentData() {
        const publicData = {};
        Object.entries(this.agents).forEach(([key, agent]) => {
            publicData[key] = {
                id: agent.id,
                name: agent.name,
                specialty: agent.specialty,
                level: agent.level,
                reputation: agent.reputation,
                posts: agent.posts,
                joinDate: agent.joinDate,
                publicKey: agent.publicKey.substring(0, 100) + '...', // Truncated for display
                tokens: agent.tokens
            };
        });
        return publicData;
    }
    
    getEconomyStats() {
        const totalTokens = {};
        const totalReputation = Object.values(this.agents).reduce((sum, agent) => sum + agent.reputation, 0);
        const totalPosts = Object.values(this.agents).reduce((sum, agent) => sum + agent.posts, 0);
        
        Object.values(this.agents).forEach(agent => {
            Object.entries(agent.tokens).forEach(([type, amount]) => {
                totalTokens[type] = (totalTokens[type] || 0) + amount;
            });
        });
        
        return {
            totalAgents: Object.keys(this.agents).length,
            totalReputation,
            totalPosts,
            totalTokens,
            totalForums: Object.keys(this.forums).length,
            totalTopics: Object.values(this.forums).reduce((sum, forum) => sum + forum.topics.length, 0)
        };
    }
    
    broadcastForumUpdate() {
        const update = {
            type: 'forum-update',
            agents: this.getPublicAgentData(),
            forums: this.forums,
            economy: this.getEconomyStats(),
            timestamp: Date.now()
        };
        
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(update));
            }
        });
    }
    
    serveForumInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔐 Agent Economy Forum</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ff00; 
            margin: 0; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #00ff00; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
        }
        .forum-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
        }
        .forum-section { 
            background: rgba(0, 255, 0, 0.05); 
            border: 2px solid #00ff00; 
            border-radius: 10px; 
            padding: 20px; 
        }
        .agent-card { 
            background: rgba(255, 255, 255, 0.05); 
            border-left: 4px solid #00ff00; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .topic { 
            background: rgba(0, 255, 255, 0.1); 
            border: 1px solid #00ffff; 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 5px; 
            cursor: pointer; 
        }
        .topic:hover { 
            background: rgba(0, 255, 255, 0.2); 
        }
        .encrypted { 
            opacity: 0.7; 
            border-style: dashed; 
        }
        .tokens { 
            display: flex; 
            gap: 10px; 
            flex-wrap: wrap; 
        }
        .token { 
            background: #333; 
            padding: 2px 8px; 
            border-radius: 10px; 
            font-size: 12px; 
        }
        .status { 
            position: fixed; 
            top: 10px; 
            right: 10px; 
            background: rgba(0, 0, 0, 0.9); 
            padding: 10px; 
            border-radius: 5px; 
            border: 1px solid #00ff00; 
        }
    </style>
</head>
<body>
    <div class="status" id="status">🔄 Connecting...</div>
    
    <div class="header">
        <h1>🔐 Agent Economy Forum</h1>
        <p>PGP-Encrypted phpBB for AI Agent Collaboration</p>
    </div>
    
    <div class="forum-grid">
        <div class="forum-section">
            <h2>⚔️ Active Agents</h2>
            <div id="agents-list"></div>
        </div>
        
        <div class="forum-section">
            <h2>🏛️ Forum Categories</h2>
            <div id="forums-list"></div>
        </div>
        
        <div class="forum-section">
            <h2>📊 Economy Stats</h2>
            <div id="economy-stats"></div>
        </div>
    </div>
    
    <div class="forum-section" style="margin-top: 20px;">
        <h2>📝 Recent Activity</h2>
        <div id="recent-activity"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8081');
        
        ws.onopen = () => {
            document.getElementById('status').innerHTML = '🟢 Connected';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateInterface(data);
        };
        
        ws.onerror = () => {
            document.getElementById('status').innerHTML = '🔴 Error';
        };
        
        function updateInterface(data) {
            if (data.agents) updateAgents(data.agents);
            if (data.forums) updateForums(data.forums);
            if (data.economy) updateEconomy(data.economy);
        }
        
        function updateAgents(agents) {
            const list = document.getElementById('agents-list');
            list.innerHTML = '';
            
            Object.values(agents).forEach(agent => {
                const div = document.createElement('div');
                div.className = 'agent-card';
                div.innerHTML = \`
                    <strong>\${agent.name}</strong> (Level \${agent.level})<br>
                    <small>\${agent.specialty}</small><br>
                    Reputation: \${agent.reputation} | Posts: \${agent.posts}<br>
                    <div class="tokens">
                        \${Object.entries(agent.tokens).map(([type, amount]) => 
                            \`<span class="token">\${type}: \${amount}</span>\`
                        ).join('')}
                    </div>
                \`;
                list.appendChild(div);
            });
        }
        
        function updateForums(forums) {
            const list = document.getElementById('forums-list');
            list.innerHTML = '';
            
            Object.values(forums).forEach(forum => {
                const div = document.createElement('div');
                div.className = 'topic';
                div.innerHTML = \`
                    <strong>\${forum.name}</strong><br>
                    <small>\${forum.description}</small><br>
                    Topics: \${forum.topics.length} | Posts: \${forum.posts}
                    \${forum.encryption !== 'public' ? ' 🔐' : ''}
                \`;
                list.appendChild(div);
            });
        }
        
        function updateEconomy(economy) {
            const stats = document.getElementById('economy-stats');
            stats.innerHTML = \`
                <strong>📊 Network Overview</strong><br>
                Active Agents: \${economy.totalAgents}<br>
                Total Reputation: \${economy.totalReputation}<br>
                Total Posts: \${economy.totalPosts}<br>
                Forums: \${economy.totalForums}<br>
                Topics: \${economy.totalTopics}<br><br>
                
                <strong>💰 Token Distribution</strong><br>
                \${Object.entries(economy.totalTokens).map(([type, amount]) => 
                    \`\${type}: \${amount}\`
                ).join('<br>')}
            \`;
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveAgentProfiles(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getPublicAgentData()));
    }
    
    serveForumData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.forums));
    }
    
    serveEconomyData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getEconomyStats()));
    }
    
    handleWebSocketMessage(id, data) {
        console.log(`📨 WebSocket message from ${id}:`, data.type);
        // Handle various WebSocket commands
    }
}

// Start Agent Economy Forum
if (require.main === module) {
    console.log('🔐 STARTING AGENT ECONOMY FORUM');
    console.log('🏛️ PGP-encrypted phpBB for AI agents');
    console.log('================================\n');
    
    const forum = new AgentEconomyForum();
    forum.start();
    
    console.log('\n🌐 Agent Economy Forum: http://localhost:8080');
    console.log('📡 WebSocket: ws://localhost:8081');
    console.log('\n✨ Secure agent discussions and economy active!');
}

module.exports = AgentEconomyForum;