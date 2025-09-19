#!/usr/bin/env node

/**
 * 🚀 LAUNCH PUBLIC DASHBOARD
 * 
 * Simplified launcher for the Public Work Dashboard that runs independently
 * with its own database layer and WebSocket connections.
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log(`
🚀 LAUNCHING PUBLIC DASHBOARD 🚀
===============================
Standalone Public Work Interface
`);

class StandalonePublicDashboard {
    constructor() {
        this.config = {
            port: 8777,
            wsPort: 8779
        };
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.wsServer = null;
        
        // Mock data
        this.workspaces = new Map();
        this.users = new Map();
        this.leaderboard = {
            contributions: [
                { user_id: 'user_123', score: 25, rank: 1 },
                { user_id: 'user_456', score: 18, rank: 2 },
                { user_id: 'user_789', score: 12, rank: 3 }
            ]
        };
        
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
        
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                statistics: {
                    total_workspaces: this.workspaces.size,
                    active_users: this.users.size,
                    auto_save_queue: 0,
                    cal_orchestrator_connected: false
                },
                timestamp: Date.now()
            });
        });
        
        this.app.get('/api/workspaces', (req, res) => {
            const workspaces = Array.from(this.workspaces.values());
            res.json({
                workspaces,
                total: workspaces.length,
                timestamp: Date.now()
            });
        });
        
        this.app.post('/api/workspaces', (req, res) => {
            const workspace = {
                id: crypto.randomUUID(),
                ...req.body,
                metadata: {
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    version: 1,
                    public: true
                },
                statistics: {
                    views: 0,
                    edits: 0,
                    collaborations: 0,
                    quality_score: 0.5
                },
                collaborators: []
            };
            
            this.workspaces.set(workspace.id, workspace);
            
            // Broadcast to WebSocket clients
            this.broadcast({
                type: 'workspace:created',
                workspace,
                timestamp: Date.now()
            });
            
            res.json({
                workspace,
                timestamp: Date.now()
            });
        });
        
        this.app.get('/api/leaderboard', (req, res) => {
            res.json({
                leaderboard: this.leaderboard,
                timestamp: Date.now()
            });
        });
        
        this.app.get('/api/executives', (req, res) => {
            res.json({
                executives: [
                    { id: 'ceo', name: 'CEO Sarah', specialty: 'Strategic Vision & Leadership', color: '#FF6B6B' },
                    { id: 'cmo', name: 'CMO Marketing', specialty: 'Brand Story & Copywriting', color: '#4ECDC4' },
                    { id: 'cto', name: 'CTO Technical', specialty: 'Architecture & Systems', color: '#45B7D1' }
                ],
                connected: false,
                timestamp: Date.now()
            });
        });
        
        this.app.post('/api/executives/:id/consult', (req, res) => {
            const { id } = req.params;
            const { query } = req.body;
            
            res.json({ 
                result: { 
                    response: `${id.toUpperCase()} says: Thanks for your question "${query}". I'm currently offline but your request has been noted.` 
                },
                timestamp: Date.now() 
            });
        });
        
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: Date.now()
            });
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            console.log('📱 Client connected to dashboard');
            
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId: crypto.randomUUID(),
                leaderboard: this.leaderboard,
                activeUsers: this.users.size,
                timestamp: Date.now()
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('📱 Client disconnected');
            });
        });
        
        console.log(`📡 WebSocket server running on ws://localhost:${this.config.wsPort}`);
    }
    
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'user_active':
                this.users.set(message.userId, { timestamp: Date.now() });
                break;
                
            case 'join_workspace':
                ws.send(JSON.stringify({
                    type: 'workspace:data',
                    workspace: this.workspaces.get(message.workspaceId) || { title: 'Workspace not found' },
                    timestamp: Date.now()
                }));
                break;
        }
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 Public Work Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        
        .dashboard-container {
            display: grid;
            grid-template-columns: 280px 1fr 350px;
            grid-template-rows: 70px 1fr;
            height: 100vh;
            gap: 1px;
        }
        
        .header {
            grid-column: 1 / -1;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            padding: 0 30px;
            backdrop-filter: blur(20px);
        }
        
        .header h1 { font-size: 24px; font-weight: 700; margin-right: 20px; }
        .header .subtitle { opacity: 0.7; font-size: 14px; }
        
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
        
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        .sidebar, .main-content, .right-panel {
            background: rgba(0, 0, 0, 0.2);
            padding: 30px 20px;
            backdrop-filter: blur(20px);
            overflow-y: auto;
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
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .workspace-type:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
        
        .workspace-type .icon { font-size: 20px; margin-right: 12px; }
        .workspace-type .name { font-weight: 500; }
        
        .create-workspace-btn {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
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
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .workspace-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }
        
        .workspace-card .title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .workspace-card .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            opacity: 0.8;
            font-size: 12px;
        }
        
        .leaderboard, .executives-panel, .stats-panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .leaderboard h3, .executives-panel h3, .stats-panel h3 {
            color: #FFD700;
            margin-bottom: 15px;
        }
        
        .leaderboard-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin-bottom: 10px;
        }
        
        .leaderboard-item .rank {
            font-weight: bold;
            font-size: 18px;
            color: #FFD700;
            min-width: 30px;
        }
        
        .executive-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 8px;
            transition: all 0.3s ease;
        }
        
        .executive-item:hover { background: rgba(255, 255, 255, 0.1); }
        
        .executive-item .avatar {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: #4CAF50;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
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
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
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
        
        .modal-buttons {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1001;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        
        .toast.show { transform: translateX(0); }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <div class="header">
            <h1>🌐 Public Work Dashboard</h1>
            <span class="subtitle">Collaborative Workspace with Cal's Executive Suite</span>
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
                <div class="workspace-type" onclick="filterWorkspaces('documents')">
                    <span class="icon">📄</span>
                    <span class="name">Documents</span>
                </div>
                <div class="workspace-type" onclick="filterWorkspaces('code')">
                    <span class="icon">💻</span>
                    <span class="name">Code</span>
                </div>
                <div class="workspace-type" onclick="filterWorkspaces('designs')">
                    <span class="icon">🎨</span>
                    <span class="name">Designs</span>
                </div>
                <div class="workspace-type" onclick="filterWorkspaces('conversations')">
                    <span class="icon">💬</span>
                    <span class="name">Conversations</span>
                </div>
                <div class="workspace-type" onclick="filterWorkspaces('brand_content')">
                    <span class="icon">✨</span>
                    <span class="name">Brand Content</span>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <button class="create-workspace-btn" onclick="openCreateWorkspaceModal()">
                ➕ Create Public Workspace
            </button>
            
            <div class="workspaces-grid" id="workspaces-grid">
                <div class="loading">🔄 Loading public workspaces...</div>
            </div>
        </div>
        
        <!-- Right Panel -->
        <div class="right-panel">
            <!-- Leaderboard -->
            <div class="leaderboard">
                <h3>🏆 Leaderboard</h3>
                <div id="leaderboard-list">
                    <div class="leaderboard-item">
                        <div class="rank">🥇</div>
                        <div class="info">
                            <div>user_123</div>
                            <div style="opacity: 0.7; font-size: 11px;">Contributions</div>
                        </div>
                        <div style="color: #4CAF50; font-weight: bold;">25</div>
                    </div>
                    <div class="leaderboard-item">
                        <div class="rank">🥈</div>
                        <div class="info">
                            <div>user_456</div>
                            <div style="opacity: 0.7; font-size: 11px;">Contributions</div>
                        </div>
                        <div style="color: #4CAF50; font-weight: bold;">18</div>
                    </div>
                    <div class="leaderboard-item">
                        <div class="rank">🥉</div>
                        <div class="info">
                            <div>user_789</div>
                            <div style="opacity: 0.7; font-size: 11px;">Contributions</div>
                        </div>
                        <div style="color: #4CAF50; font-weight: bold;">12</div>
                    </div>
                </div>
            </div>
            
            <!-- Cal's Executives -->
            <div class="executives-panel">
                <h3>🤖 Cal's Executives</h3>
                <div class="executives-list">
                    <div class="executive-item" onclick="consultExecutive('ceo')">
                        <div class="avatar">S</div>
                        <div class="info">
                            <div class="name">CEO Sarah</div>
                            <div style="font-size: 11px; opacity: 0.8;">Strategic Vision & Leadership</div>
                        </div>
                    </div>
                    <div class="executive-item" onclick="consultExecutive('cmo')">
                        <div class="avatar">M</div>
                        <div class="info">
                            <div class="name">CMO Marketing</div>
                            <div style="font-size: 11px; opacity: 0.8;">Brand Story & Copywriting</div>
                        </div>
                    </div>
                    <div class="executive-item" onclick="consultExecutive('cto')">
                        <div class="avatar">T</div>
                        <div class="info">
                            <div class="name">CTO Technical</div>
                            <div style="font-size: 11px; opacity: 0.8;">Architecture & Systems</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="stats-panel">
                <h3>📊 Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="value" id="total-workspaces">0</div>
                        <div class="label">Total Workspaces</div>
                    </div>
                    <div class="stat-item">
                        <div class="value" id="active-users-stat">0</div>
                        <div class="label">Active Users</div>
                    </div>
                    <div class="stat-item">
                        <div class="value" id="auto-saves">0</div>
                        <div class="label">Auto Saves</div>
                    </div>
                    <div class="stat-item">
                        <div class="value" id="cal-status">❌</div>
                        <div class="label">Cal Integration</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Create Workspace Modal -->
    <div class="modal" id="create-workspace-modal">
        <div class="modal-content">
            <h3>📝 Create New Public Workspace</h3>
            <form id="workspace-form">
                <div class="form-group">
                    <label for="workspace-title">Title</label>
                    <input type="text" id="workspace-title" placeholder="Enter workspace title" required>
                </div>
                <div class="form-group">
                    <label for="workspace-type">Type</label>
                    <select id="workspace-type" required>
                        <option value="documents">📄 Documents</option>
                        <option value="code">💻 Code</option>
                        <option value="designs">🎨 Designs</option>
                        <option value="conversations">💬 Conversations</option>
                        <option value="brand_content">✨ Brand Content</option>
                        <option value="marketing_copy">📝 Marketing Copy</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="workspace-description">Description</label>
                    <textarea id="workspace-description" rows="3" placeholder="Describe your workspace..."></textarea>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeCreateWorkspaceModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Workspace</button>
                </div>
            </form>
        </div>
    </div>
    
    <div class="toast" id="toast"></div>
    
    <script>
        let ws;
        let currentUser = 'user_' + Math.random().toString(36).substr(2, 9);
        
        document.addEventListener('DOMContentLoaded', function() {
            initializeWebSocket();
            loadWorkspaces();
            loadStatistics();
            setInterval(loadStatistics, 30000);
        });
        
        function initializeWebSocket() {
            ws = new WebSocket('ws://localhost:8779');
            
            ws.onopen = function() {
                console.log('📡 Connected to Public Work Dashboard');
                ws.send(JSON.stringify({ type: 'user_active', userId: currentUser }));
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                console.log('📡 Disconnected from dashboard');
                setTimeout(initializeWebSocket, 5000);
            };
        }
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'welcome':
                    updateActiveUsers(message.activeUsers);
                    break;
                case 'workspace:created':
                    addWorkspaceToGrid(message.workspace);
                    showToast('New workspace created: ' + message.workspace.title);
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
                    grid.innerHTML = '<div style="text-align: center; opacity: 0.7; padding: 50px;">No public workspaces yet. Create the first one! 🚀</div>';
                    return;
                }
                
                data.workspaces.forEach(workspace => addWorkspaceToGrid(workspace));
            } catch (error) {
                console.error('Failed to load workspaces:', error);
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
            const typeIcons = {
                documents: '📄',
                code: '💻',
                designs: '🎨',
                conversations: '💬',
                brand_content: '✨',
                marketing_copy: '📝'
            };
            
            const workspaceCard = document.createElement('div');
            workspaceCard.className = 'workspace-card';
            
            workspaceCard.innerHTML = \`
                <div class="title">\${typeIcons[workspace.type] || '📄'} \${workspace.title}</div>
                <div class="meta">
                    <span>By \${workspace.owner}</span>
                    <span>\${new Date(workspace.metadata.created_at).toLocaleDateString()}</span>
                </div>
                <div>\${workspace.content?.description || 'No description'}</div>
            \`;
            
            grid.appendChild(workspaceCard);
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
            
            try {
                const response = await fetch('/api/workspaces', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        type,
                        owner: currentUser,
                        content: { description }
                    })
                });
                
                if (response.ok) {
                    closeCreateWorkspaceModal();
                    showToast('Workspace created successfully! 🎉');
                    loadWorkspaces();
                } else {
                    throw new Error('Failed to create workspace');
                }
            } catch (error) {
                showToast('Failed to create workspace: ' + error.message, 'error');
            }
        }
        
        async function consultExecutive(executiveId) {
            const query = prompt(\`What would you like to ask \${executiveId.toUpperCase()}?\`);
            if (!query) return;
            
            try {
                const response = await fetch(\`/api/executives/\${executiveId}/consult\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const data = await response.json();
                alert(data.result.response);
            } catch (error) {
                showToast('Failed to consult executive: ' + error.message, 'error');
            }
        }
        
        function filterWorkspaces(type) {
            showToast('Filtering by: ' + type);
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
        
        document.getElementById('workspace-form').addEventListener('submit', createWorkspace);
        
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
    
    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.config.port, () => {
                console.log(`🌐 Dashboard server running on http://localhost:${this.config.port}`);
                console.log(`📡 WebSocket server running on ws://localhost:${this.config.wsPort}`);
                console.log('✅ Standalone Public Dashboard ready!');
                resolve();
            });
        });
    }
}

// Create and start the dashboard
const dashboard = new StandalonePublicDashboard();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Public Dashboard...');
    process.exit(0);
});

dashboard.start().catch(error => {
    console.error('💥 Failed to start dashboard:', error);
    process.exit(1);
});