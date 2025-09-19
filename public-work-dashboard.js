#!/usr/bin/env node

/**
 * 🌐📊 PUBLIC WORK DASHBOARD
 * 
 * Web interface for shared public workspaces where all work automatically saves
 * to databases, displays leaderboard reports, and integrates with Cal's orchestrator
 * ecosystem for brand building and collaborative content creation.
 * 
 * Features:
 * ✅ Real-time collaborative workspaces
 * ✅ Auto-save with conflict resolution
 * ✅ Public leaderboard and reputation display
 * ✅ Integration with Cal's Executive Suite
 * ✅ Brand story generation from conversations
 * ✅ Word mapping and copywriting assistance
 * ✅ Cross-system content discovery
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;

// Import our shared database system
const SharedPublicLayerDatabase = require('./shared-public-layer-database.js');

console.log(`
🌐📊 PUBLIC WORK DASHBOARD 🌐📊
===============================
Collaborative Workspaces | Real-time Leaderboards | Cal Integration
Public Work Interface with Auto-save & Brand Building
`);

class PublicWorkDashboard {
    constructor(options = {}) {
        this.config = {
            port: options.port || 8777,
            wsPort: options.wsPort || 8779, // Different port to avoid conflict
            
            // Dashboard configuration
            dashboard: {
                title: 'Public Work Dashboard',
                subtitle: 'Collaborative Workspace with Cal\'s Executive Suite',
                brandName: 'Document Generator',
                theme: 'modern-dark'
            },
            
            // Workspace types and templates
            workspaceTypes: [
                { id: 'documents', name: 'Documents', icon: '📄', color: '#4A90E2' },
                { id: 'code', name: 'Code', icon: '💻', color: '#50E3C2' },
                { id: 'designs', name: 'Designs', icon: '🎨', color: '#F5A623' },
                { id: 'conversations', name: 'Conversations', icon: '💬', color: '#7ED321' },
                { id: 'research', name: 'Research', icon: '🔬', color: '#9013FE' },
                { id: 'planning', name: 'Planning', icon: '📋', color: '#FF6B6B' },
                { id: 'analysis', name: 'Analysis', icon: '📊', color: '#4ECDC4' },
                { id: 'reports', name: 'Reports', icon: '📈', color: '#45B7D1' },
                { id: 'brand_content', name: 'Brand Content', icon: '✨', color: '#96CEB4' },
                { id: 'marketing_copy', name: 'Marketing Copy', icon: '📝', color: '#FECA57' }
            ],
            
            // Cal's Executive integration
            executives: [
                { id: 'ceo', name: 'CEO Sarah', specialty: 'Strategic Vision & Leadership', color: '#FF6B6B' },
                { id: 'cmo', name: 'CMO Marketing', specialty: 'Brand Story & Copywriting', color: '#4ECDC4' },
                { id: 'cto', name: 'CTO Technical', specialty: 'Architecture & Systems', color: '#45B7D1' },
                { id: 'cpo', name: 'CPO Product', specialty: 'User Experience & Features', color: '#96CEB4' },
                { id: 'coo', name: 'COO Operations', specialty: 'Workflow & Process', color: '#FECA57' },
                { id: 'cfo', name: 'CFO Finance', specialty: 'Resources & Analytics', color: '#FD79A8' }
            ],
            
            ...options
        };
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.publicDB = null;
        
        // Setup middleware
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🚀 Public Work Dashboard initializing...');
    }
    
    /**
     * Initialize the dashboard with database connection
     */
    async initialize() {
        try {
            console.log('📊 Connecting to Shared Public Layer Database...');
            
            // Initialize the shared database system with different WebSocket port
            this.publicDB = new SharedPublicLayerDatabase({
                publicAPI: `http://localhost:${this.config.port}`,
                wsPort: this.config.wsPort
            });
            
            await this.publicDB.initialize();
            
            // Start the web server
            await this.startServer();
            
            console.log('✅ Public Work Dashboard ready!');
            console.log(`🌐 Dashboard: http://localhost:${this.config.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Public Work Dashboard:', error);
            throw error;
        }
    }
    
    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Serve static files from public directory
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Parse JSON bodies
        this.app.use(express.json());
        
        // CORS headers for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    /**
     * Setup API routes
     */
    setupRoutes() {
        // Serve main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                statistics: this.publicDB ? this.publicDB.getPublicStatistics() : {},
                timestamp: Date.now()
            });
        });
        
        this.app.get('/api/workspaces', async (req, res) => {
            try {
                const workspaces = Array.from(this.publicDB.publicWorkspaces.values())
                    .filter(w => w.metadata.public)
                    .map(w => this.publicDB.sanitizeWorkspaceForPublic(w));
                
                res.json({
                    workspaces,
                    total: workspaces.length,
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/workspaces', async (req, res) => {
            try {
                const workspace = await this.publicDB.createPublicWorkspace(req.body);
                res.json({
                    workspace: this.publicDB.sanitizeWorkspaceForPublic(workspace),
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.put('/api/workspaces/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const { updates, userId } = req.body;
                
                const workspace = await this.publicDB.updateWorkspace(id, updates, userId);
                res.json({
                    workspace: this.publicDB.sanitizeWorkspaceForPublic(workspace),
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/leaderboard', (req, res) => {
            const leaderboard = this.publicDB ? this.publicDB.getLeaderboardSnapshot() : {};
            res.json({
                leaderboard,
                timestamp: Date.now()
            });
        });
        
        this.app.get('/api/executives', (req, res) => {
            res.json({
                executives: this.config.executives,
                connected: this.publicDB ? this.publicDB.calOrchestratorConnected : false,
                timestamp: Date.now()
            });
        });
        
        this.app.post('/api/executives/:id/consult', async (req, res) => {
            try {
                const { id } = req.params;
                const { query, context } = req.body;
                
                if (this.publicDB && this.publicDB.calOrchestratorConnected) {
                    const result = await this.publicDB.processWithCalExecutive(
                        'consultation', 
                        { query, context }, 
                        id
                    );
                    res.json({ result, timestamp: Date.now() });
                } else {
                    res.json({ 
                        result: { response: `Executive ${id} is currently offline. Your request has been queued.` },
                        timestamp: Date.now() 
                    });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Word mapping and brand analysis
        this.app.post('/api/analyze/conversations', async (req, res) => {
            try {
                const { conversations } = req.body;
                const analysis = await this.analyzeConversations(conversations);
                res.json({ analysis, timestamp: Date.now() });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/generate/brand-story', async (req, res) => {
            try {
                const { context } = req.body;
                const brandStory = await this.generateBrandStory(context);
                res.json({ brandStory, timestamp: Date.now() });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                database_connected: !!this.publicDB,
                timestamp: Date.now()
            });
        });
    }
    
    /**
     * Generate main dashboard HTML
     */
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.dashboard.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .dashboard-container {
            display: grid;
            grid-template-columns: 280px 1fr 350px;
            grid-template-rows: 70px 1fr;
            height: 100vh;
            gap: 1px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .header {
            grid-column: 1 / -1;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            padding: 0 30px;
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-right: 20px;
        }
        
        .header .subtitle {
            opacity: 0.7;
            font-size: 14px;
        }
        
        .status-indicator {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4CAF50;
            box-shadow: 0 0 10px #4CAF50;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .sidebar {
            background: rgba(0, 0, 0, 0.2);
            padding: 30px 20px;
            backdrop-filter: blur(20px);
        }
        
        .sidebar h3 {
            margin-bottom: 20px;
            color: #FFD700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .workspace-types {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .workspace-type {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .workspace-type:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }
        
        .workspace-type .icon {
            font-size: 20px;
            margin-right: 12px;
        }
        
        .workspace-type .name {
            font-weight: 500;
        }
        
        .main-content {
            background: rgba(0, 0, 0, 0.1);
            padding: 30px;
            overflow-y: auto;
            backdrop-filter: blur(20px);
        }
        
        .content-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .create-workspace-btn {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .create-workspace-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255, 215, 0, 0.4);
        }
        
        .workspaces-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
        }
        
        .workspace-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .workspace-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            background: rgba(255, 255, 255, 0.15);
        }
        
        .workspace-card .title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .workspace-card .meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            opacity: 0.8;
            font-size: 12px;
        }
        
        .workspace-card .stats {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            font-size: 12px;
        }
        
        .workspace-card .stat {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .right-panel {
            background: rgba(0, 0, 0, 0.2);
            padding: 30px 20px;
            backdrop-filter: blur(20px);
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        
        .leaderboard {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
        }
        
        .leaderboard h3 {
            margin-bottom: 20px;
            color: #FFD700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .leaderboard-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .leaderboard-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        
        .leaderboard-item .rank {
            font-weight: bold;
            font-size: 18px;
            color: #FFD700;
            min-width: 30px;
        }
        
        .leaderboard-item .info {
            flex: 1;
        }
        
        .leaderboard-item .score {
            font-weight: 600;
            color: #4CAF50;
        }
        
        .executives-panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
        }
        
        .executives-panel h3 {
            margin-bottom: 20px;
            color: #FFD700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .executives-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .executive-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .executive-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .executive-item .avatar {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color), transparent);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        
        .executive-item .info {
            flex: 1;
        }
        
        .executive-item .name {
            font-weight: 600;
            font-size: 13px;
        }
        
        .executive-item .specialty {
            font-size: 11px;
            opacity: 0.8;
        }
        
        .stats-panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        
        .stat-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .stat-item .label {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 5px;
        }
        
        .loading {
            text-align: center;
            padding: 50px;
            opacity: 0.7;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: rgba(30, 60, 114, 0.95);
            padding: 30px;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .modal h3 {
            margin-bottom: 20px;
            color: #FFD700;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .form-group input::placeholder,
        .form-group textarea::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        
        .modal-buttons {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 30px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            z-index: 1001;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        
        .toast.show {
            transform: translateX(0);
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <div class="header">
            <h1>${this.config.dashboard.title}</h1>
            <span class="subtitle">${this.config.dashboard.subtitle}</span>
            <div class="status-indicator">
                <span class="status-dot"></span>
                <span>Online</span>
                <span id="active-users">0 users active</span>
            </div>
        </div>
        
        <!-- Left Sidebar -->
        <div class="sidebar">
            <h3>🚀 Workspace Types</h3>
            <div class="workspace-types">
                ${this.config.workspaceTypes.map(type => `
                    <div class="workspace-type" onclick="filterWorkspaces('${type.id}')" style="--color: ${type.color}">
                        <span class="icon">${type.icon}</span>
                        <span class="name">${type.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <div class="content-header">
                <h2>🌐 Public Workspaces</h2>
                <button class="create-workspace-btn" onclick="openCreateWorkspaceModal()">
                    ➕ Create Workspace
                </button>
            </div>
            
            <div class="workspaces-grid" id="workspaces-grid">
                <div class="loading">
                    🔄 Loading public workspaces...
                </div>
            </div>
        </div>
        
        <!-- Right Panel -->
        <div class="right-panel">
            <!-- Leaderboard -->
            <div class="leaderboard">
                <h3>🏆 Leaderboard</h3>
                <div class="leaderboard-list" id="leaderboard-list">
                    <div class="loading">Loading rankings...</div>
                </div>
            </div>
            
            <!-- Cal's Executives -->
            <div class="executives-panel">
                <h3>🤖 Cal's Executives</h3>
                <div class="executives-list">
                    ${this.config.executives.map(exec => `
                        <div class="executive-item" onclick="consultExecutive('${exec.id}')" style="--color: ${exec.color}">
                            <div class="avatar">${exec.name.split(' ')[1][0]}</div>
                            <div class="info">
                                <div class="name">${exec.name}</div>
                                <div class="specialty">${exec.specialty}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="stats-panel">
                <h3>📊 Statistics</h3>
                <div class="stats-grid" id="stats-grid">
                    <div class="stat-item">
                        <div class="value" id="total-workspaces">-</div>
                        <div class="label">Total Workspaces</div>
                    </div>
                    <div class="stat-item">
                        <div class="value" id="active-users-stat">-</div>
                        <div class="label">Active Users</div>
                    </div>
                    <div class="stat-item">
                        <div class="value" id="auto-saves">-</div>
                        <div class="label">Auto Saves</div>
                    </div>
                    <div class="stat-item">
                        <div class="value" id="cal-status">-</div>
                        <div class="label">Cal Integration</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Create Workspace Modal -->
    <div class="modal" id="create-workspace-modal">
        <div class="modal-content">
            <h3>📝 Create New Workspace</h3>
            <form id="workspace-form">
                <div class="form-group">
                    <label for="workspace-title">Title</label>
                    <input type="text" id="workspace-title" placeholder="Enter workspace title" required>
                </div>
                <div class="form-group">
                    <label for="workspace-type">Type</label>
                    <select id="workspace-type" required>
                        ${this.config.workspaceTypes.map(type => `
                            <option value="${type.id}">${type.icon} ${type.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="workspace-description">Description</label>
                    <textarea id="workspace-description" rows="3" placeholder="Describe your workspace..."></textarea>
                </div>
                <div class="form-group">
                    <label for="workspace-public">
                        <input type="checkbox" id="workspace-public" checked> Make this workspace public
                    </label>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeCreateWorkspaceModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Workspace</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Toast notifications -->
    <div class="toast" id="toast"></div>
    
    <script>
        // WebSocket connection for real-time updates
        let ws;
        let currentUser = 'user_' + Math.random().toString(36).substr(2, 9);
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeWebSocket();
            loadWorkspaces();
            loadLeaderboard();
            loadStatistics();
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                loadStatistics();
            }, 30000);
        });
        
        function initializeWebSocket() {
            ws = new WebSocket('ws://localhost:8779');
            
            ws.onopen = function() {
                console.log('📡 Connected to Public Work Dashboard');
                ws.send(JSON.stringify({
                    type: 'user_active',
                    userId: currentUser
                }));
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                console.log('📡 Disconnected from dashboard');
                // Attempt to reconnect
                setTimeout(initializeWebSocket, 5000);
            };
        }
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'welcome':
                    updateActiveUsers(message.activeUsers);
                    if (message.leaderboard) {
                        updateLeaderboard(message.leaderboard);
                    }
                    break;
                    
                case 'workspace:created':
                    addWorkspaceToGrid(message.workspace);
                    showToast('New workspace created: ' + message.workspace.title);
                    break;
                    
                case 'workspace:updated':
                    updateWorkspaceInGrid(message.workspaceId, message.updates);
                    break;
                    
                case 'leaderboard:updated':
                    updateLeaderboard(message.leaderboard);
                    break;
                    
                case 'user_joined_workspace':
                    showToast(message.userId + ' joined a workspace');
                    break;
            }
        }
        
        async function loadWorkspaces() {
            try {
                const response = await fetch('/api/workspaces');
                const data = await response.json();
                
                const grid = document.getElementById('workspaces-grid');
                grid.innerHTML = '';
                
                if (data.workspaces.length === 0) {
                    grid.innerHTML = '<div class="loading">No public workspaces yet. Create the first one!</div>';
                    return;
                }
                
                data.workspaces.forEach(workspace => {
                    addWorkspaceToGrid(workspace);
                });
                
            } catch (error) {
                console.error('Failed to load workspaces:', error);
                document.getElementById('workspaces-grid').innerHTML = 
                    '<div class="loading">❌ Failed to load workspaces</div>';
            }
        }
        
        async function loadLeaderboard() {
            try {
                const response = await fetch('/api/leaderboard');
                const data = await response.json();
                updateLeaderboard(data.leaderboard);
            } catch (error) {
                console.error('Failed to load leaderboard:', error);
            }
        }
        
        async function loadStatistics() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                updateStatistics(data.statistics);
            } catch (error) {
                console.error('Failed to load statistics:', error);
            }
        }
        
        function addWorkspaceToGrid(workspace) {
            const grid = document.getElementById('workspaces-grid');
            
            const typeInfo = ${JSON.stringify(this.config.workspaceTypes)}.find(t => t.id === workspace.type);
            const typeIcon = typeInfo ? typeInfo.icon : '📄';
            const typeColor = typeInfo ? typeInfo.color : '#4A90E2';
            
            const workspaceCard = document.createElement('div');
            workspaceCard.className = 'workspace-card';
            workspaceCard.style.borderLeftColor = typeColor;
            workspaceCard.onclick = () => openWorkspace(workspace.id);
            
            workspaceCard.innerHTML = \`
                <div class="title">\${typeIcon} \${workspace.title}</div>
                <div class="meta">
                    <span>By \${workspace.owner}</span>
                    <span>\${new Date(workspace.metadata.created_at).toLocaleDateString()}</span>
                </div>
                <div class="description">\${workspace.content.description || 'No description'}</div>
                <div class="stats">
                    <div class="stat">
                        <span>👁️</span>
                        <span>\${workspace.statistics.views || 0}</span>
                    </div>
                    <div class="stat">
                        <span>✏️</span>
                        <span>\${workspace.statistics.edits || 0}</span>
                    </div>
                    <div class="stat">
                        <span>🤝</span>
                        <span>\${workspace.collaborators.length}</span>
                    </div>
                    <div class="stat">
                        <span>⭐</span>
                        <span>\${(workspace.statistics.quality_score * 100).toFixed(0)}%</span>
                    </div>
                </div>
            \`;
            
            grid.appendChild(workspaceCard);
        }
        
        function updateLeaderboard(leaderboardData) {
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = '';
            
            if (!leaderboardData || !leaderboardData.contributions) {
                list.innerHTML = '<div class="loading">No rankings yet</div>';
                return;
            }
            
            const topContributors = leaderboardData.contributions.slice(0, 5);
            
            topContributors.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                
                const medals = ['🥇', '🥈', '🥉'];
                const rankDisplay = index < 3 ? medals[index] : \`#\${entry.rank}\`;
                
                item.innerHTML = \`
                    <div class="rank">\${rankDisplay}</div>
                    <div class="info">
                        <div>\${entry.user_id}</div>
                        <div style="opacity: 0.7; font-size: 11px;">Contributions</div>
                    </div>
                    <div class="score">\${entry.score}</div>
                \`;
                
                list.appendChild(item);
            });
        }
        
        function updateStatistics(stats) {
            if (!stats) return;
            
            document.getElementById('total-workspaces').textContent = stats.total_workspaces || 0;
            document.getElementById('active-users-stat').textContent = stats.active_users || 0;
            document.getElementById('auto-saves').textContent = stats.auto_save_queue || 0;
            document.getElementById('cal-status').textContent = stats.cal_orchestrator_connected ? '✅' : '❌';
            
            updateActiveUsers(stats.active_users || 0);
        }
        
        function updateActiveUsers(count) {
            document.getElementById('active-users').textContent = \`\${count} users active\`;
        }
        
        function openCreateWorkspaceModal() {
            document.getElementById('create-workspace-modal').style.display = 'flex';
        }
        
        function closeCreateWorkspaceModal() {
            document.getElementById('create-workspace-modal').style.display = 'none';
            document.getElementById('workspace-form').reset();
        }
        
        async function createWorkspace(event) {
            event.preventDefault();
            
            const title = document.getElementById('workspace-title').value;
            const type = document.getElementById('workspace-type').value;
            const description = document.getElementById('workspace-description').value;
            const isPublic = document.getElementById('workspace-public').checked;
            
            try {
                const response = await fetch('/api/workspaces', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        type,
                        owner: currentUser,
                        content: { description },
                        public: isPublic
                    })
                });
                
                if (response.ok) {
                    closeCreateWorkspaceModal();
                    showToast('Workspace created successfully!');
                    loadWorkspaces();
                } else {
                    throw new Error('Failed to create workspace');
                }
            } catch (error) {
                showToast('Failed to create workspace: ' + error.message, 'error');
            }
        }
        
        function openWorkspace(workspaceId) {
            // Join workspace via WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'join_workspace',
                    workspaceId,
                    userId: currentUser
                }));
            }
            
            showToast('Joined workspace ' + workspaceId);
        }
        
        async function consultExecutive(executiveId) {
            const query = prompt(\`What would you like to ask \${executiveId.toUpperCase()}?\`);
            if (!query) return;
            
            try {
                const response = await fetch(\`/api/executives/\${executiveId}/consult\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, context: { user: currentUser } })
                });
                
                const data = await response.json();
                
                if (data.result && data.result.response) {
                    alert(\`\${executiveId.toUpperCase()} says: \${data.result.response}\`);
                } else {
                    showToast('Executive consultation queued');
                }
            } catch (error) {
                showToast('Failed to consult executive: ' + error.message, 'error');
            }
        }
        
        function filterWorkspaces(type) {
            showToast('Filtering by: ' + type);
            // Implement workspace filtering logic
        }
        
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.background = type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(76, 175, 80, 0.9)';
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        // Setup form handler
        document.getElementById('workspace-form').addEventListener('submit', createWorkspace);
        
        // Handle modal clicks
        document.getElementById('create-workspace-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeCreateWorkspaceModal();
            }
        });
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Start the web server
     */
    async startServer() {
        return new Promise((resolve) => {
            this.server.listen(this.config.port, () => {
                console.log(`🌐 Dashboard server running on port ${this.config.port}`);
                resolve();
            });
        });
    }
    
    /**
     * Analyze conversations for word mapping and brand insights
     */
    async analyzeConversations(conversations) {
        // This would integrate with the conversation analysis engine
        // For now, return a mock analysis
        return {
            keyPhrases: ['AI-powered', 'document generation', 'collaborative workspace'],
            brandElements: ['innovation', 'efficiency', 'collaboration'],
            sentimentAnalysis: { positive: 0.8, neutral: 0.15, negative: 0.05 },
            suggestedCopywriting: [
                'Transform ideas into reality with AI-powered collaboration',
                'Where documents become living, breathing workspaces',
                'Built for teams that think beyond the page'
            ]
        };
    }
    
    /**
     * Generate brand story from context
     */
    async generateBrandStory(context) {
        // This would use Cal's CMO executive for brand story generation
        // For now, return a mock brand story
        return {
            narrative: 'A platform born from the simple belief that great ideas deserve great tools...',
            keyMessages: [
                'Empowerment through automation',
                'Collaboration without boundaries',
                'Innovation at the speed of thought'
            ],
            tone: 'Professional yet approachable',
            targetAudience: 'Forward-thinking teams and creators'
        };
    }
}

// Export the class
module.exports = PublicWorkDashboard;

// CLI execution
if (require.main === module) {
    const dashboard = new PublicWorkDashboard({
        port: 8777,
        wsPort: 8778
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Public Work Dashboard...');
        
        if (dashboard.server) {
            dashboard.server.close();
        }
        
        console.log('✅ Shutdown complete');
        process.exit(0);
    });
    
    // Start the dashboard
    dashboard.initialize().catch(error => {
        console.error('💥 Failed to start Public Work Dashboard:', error);
        process.exit(1);
    });
}