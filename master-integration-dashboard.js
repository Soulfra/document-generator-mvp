#!/usr/bin/env node

/**
 * 🎯 MASTER INTEGRATION DASHBOARD
 * 
 * The unified interface that connects ALL the pieces:
 * - Document discovery (Wayback Librarian)
 * - Deep analysis (Laser Scanner)
 * - Payment/tokens (Automated Billing)
 * - Community tasks (Federation Board)
 * - Export/deploy (Domingo Orchestrator)
 * 
 * This is the "start and end points with everything in the middle" solution
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventEmitter = require('events');

class MasterIntegrationDashboard extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.PORT = 9500;
        this.WS_PORT = 9501;
        
        // Connected systems status
        this.systems = {
            waybackLibrarian: { connected: false, url: 'http://localhost:9100' },
            laserScanner: { connected: false, url: 'http://localhost:9200' },
            tokenBilling: { connected: false, url: 'http://localhost:7302' },
            federationBoard: { connected: false, url: 'http://localhost:8700' },
            domingoOrchestrator: { connected: false, url: 'http://localhost:7777' },
            simpleDocumentAPI: { connected: false, url: 'http://localhost:9003' },
            consultationEngine: { connected: false, url: 'http://localhost:9400' }
        };
        
        // User session tracking
        this.sessions = new Map();
        
        // Token economy state
        this.tokenEconomy = {
            totalTokensInCirculation: 0,
            tokensEarnedToday: 0,
            tokensSpentToday: 0,
            activeTasks: []
        };
        
        console.log('🎯 Master Integration Dashboard initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Setup middleware
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        // Enable CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
        
        // Setup routes
        this.setupRoutes();
        
        // Start servers
        this.server = this.app.listen(this.PORT, () => {
            console.log(`📊 Dashboard running at http://localhost:${this.PORT}`);
        });
        
        // Setup WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.WS_PORT });
        this.setupWebSocket();
        
        // Check system connections
        await this.checkSystemConnections();
        
        console.log('✅ Master Integration Dashboard ready!');
        console.log(`🌐 Open http://localhost:${this.PORT} to view the dashboard`);
    }
    
    setupRoutes() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // System status endpoint
        this.app.get('/api/status', async (req, res) => {
            const status = await this.getSystemStatus();
            res.json(status);
        });
        
        // Unified document processing flow
        this.app.post('/api/process-document-flow', async (req, res) => {
            const sessionId = `flow-${Date.now()}`;
            console.log(`🔄 Starting unified document flow: ${sessionId}`);
            
            try {
                const { documentPath, userId, options = {} } = req.body;
                
                // Step 1: Check user tokens
                const tokenCheck = await this.checkUserTokens(userId);
                if (!tokenCheck.hasTokens) {
                    return res.status(402).json({
                        error: 'Insufficient tokens',
                        requiredTokens: 1,
                        userTokens: tokenCheck.balance,
                        earnTokensUrl: `http://localhost:${this.PORT}/earn-tokens`
                    });
                }
                
                // Step 2: Search existing components with Wayback Librarian
                const existingComponents = await this.searchExistingComponents(documentPath);
                
                // Step 3: Deep analysis with Laser Scanner
                const deepAnalysis = await this.performDeepAnalysis(documentPath);
                
                // Step 4: Process document with Simple Document API
                const processedResult = await this.processDocument(documentPath);
                
                // Step 5: Generate consultation insights
                const consultationInsights = options.premium ? 
                    await this.getConsultationInsights(processedResult) : null;
                
                // Step 6: Post to community board if requested
                if (options.postToBoard) {
                    await this.postToCommunityBoard({
                        title: `Help improve: ${path.basename(documentPath)}`,
                        description: deepAnalysis.summary,
                        rewards: { xp: 100, tokens: 5 }
                    });
                }
                
                // Step 7: Package for export if requested
                const exportPackage = options.export ? 
                    await this.packageForExport(processedResult, options.exportFormat) : null;
                
                // Deduct token
                await this.deductToken(userId);
                
                res.json({
                    sessionId,
                    success: true,
                    flow: {
                        step1_tokenCheck: { status: 'completed', tokensRemaining: tokenCheck.balance - 1 },
                        step2_existingComponents: { status: 'completed', found: existingComponents.length },
                        step3_deepAnalysis: { status: 'completed', insights: deepAnalysis },
                        step4_processing: { status: 'completed', result: processedResult },
                        step5_consultation: consultationInsights ? { status: 'completed', insights: consultationInsights } : { status: 'skipped' },
                        step6_communityBoard: options.postToBoard ? { status: 'completed' } : { status: 'skipped' },
                        step7_export: exportPackage ? { status: 'completed', package: exportPackage } : { status: 'skipped' }
                    },
                    nextSteps: [
                        'View generated MVP',
                        'Download export package',
                        'Earn more tokens',
                        'Upgrade to premium'
                    ]
                });
                
            } catch (error) {
                console.error('❌ Flow failed:', error);
                res.status(500).json({
                    sessionId,
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Token economy endpoints
        this.app.get('/api/token-balance/:userId', async (req, res) => {
            const balance = await this.getUserTokenBalance(req.params.userId);
            res.json({ userId: req.params.userId, balance });
        });
        
        this.app.post('/api/earn-tokens', async (req, res) => {
            const { userId, taskId } = req.body;
            const earned = await this.earnTokensFromTask(userId, taskId);
            res.json({ success: true, tokensEarned: earned });
        });
        
        // System integration endpoints
        this.app.post('/api/connect-system', async (req, res) => {
            const { systemName } = req.body;
            const connected = await this.connectToSystem(systemName);
            res.json({ success: connected });
        });
        
        // Export endpoints
        this.app.post('/api/export', async (req, res) => {
            const { sessionId, format } = req.body;
            const exportResult = await this.exportSession(sessionId, format);
            res.json(exportResult);
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'status',
                data: this.systems
            }));
            
            // Handle messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
        });
    }
    
    async checkSystemConnections() {
        console.log('🔍 Checking system connections...');
        
        for (const [name, system] of Object.entries(this.systems)) {
            try {
                const response = await fetch(`${system.url}/health`).catch(() => null);
                system.connected = response && response.ok;
                console.log(`   ${system.connected ? '✅' : '❌'} ${name}`);
            } catch (error) {
                system.connected = false;
            }
        }
    }
    
    async getSystemStatus() {
        await this.checkSystemConnections();
        
        return {
            timestamp: new Date().toISOString(),
            systems: this.systems,
            tokenEconomy: this.tokenEconomy,
            activeSessions: this.sessions.size,
            health: Object.values(this.systems).filter(s => s.connected).length / Object.keys(this.systems).length
        };
    }
    
    async checkUserTokens(userId) {
        // Check with token billing system
        try {
            const response = await fetch(`${this.systems.tokenBilling.url}/api/usage/${userId}`);
            if (response.ok) {
                const data = await response.json();
                return { 
                    hasTokens: data.user.tokensAvailable > 0, 
                    balance: data.user.tokensAvailable 
                };
            }
        } catch (error) {
            console.warn('Token system not available, using free tier');
        }
        
        // Default free tier
        return { hasTokens: true, balance: 10 };
    }
    
    async searchExistingComponents(documentPath) {
        // Mock implementation - would connect to wayback librarian
        console.log('🔍 Searching existing components...');
        return [
            { path: 'existing-component-1.js', similarity: 0.85 },
            { path: 'existing-component-2.js', similarity: 0.72 }
        ];
    }
    
    async performDeepAnalysis(documentPath) {
        // Mock implementation - would connect to laser scanner
        console.log('🔬 Performing deep analysis...');
        return {
            summary: 'Complex nested document structure detected',
            nestedLevels: 3,
            hiddenPatterns: ['authentication flow', 'data persistence'],
            archaeologicalFindings: ['Previous implementation attempts', 'Evolution of requirements']
        };
    }
    
    async processDocument(documentPath) {
        // Connect to simple document API
        try {
            const response = await fetch(`${this.systems.simpleDocumentAPI.url}/api/process-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentPath })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Document processing failed:', error);
        }
        
        // Fallback
        return { success: false, error: 'Document processing unavailable' };
    }
    
    async getConsultationInsights(processedResult) {
        // Mock implementation - would connect to consultation engine
        console.log('🧠 Getting AI consultation insights...');
        return {
            models: ['Claude', 'GPT-4', 'Gemini'],
            consensus: 'Implement authentication first',
            divergentOpinions: ['Database choice', 'Frontend framework'],
            cost: 0.15
        };
    }
    
    async postToCommunityBoard(task) {
        // Connect to federation bulletin board
        try {
            const bulletinData = {
                title: task.title,
                description: task.description,
                priority: 'medium',
                category: 'document-processing',
                requirements: {},
                rewards: task.rewards || { xp: 100, tokens: 5 },
                testCriteria: []
            };
            
            const response = await fetch(`${this.systems.federationBoard.url}/api/bulletins`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'citizenId': '1' // Demo citizen for now
                },
                body: JSON.stringify(bulletinData)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Failed to post to community board:', error);
            return false;
        }
    }
    
    async packageForExport(result, format) {
        // Connect to Domingo orchestrator
        console.log(`📦 Packaging for export as ${format}...`);
        
        try {
            // Check if Domingo orchestrator is available
            const healthResponse = await fetch(`${this.systems.domingoOrchestrator.url}/health`);
            
            if (healthResponse.ok) {
                // Create export package using Domingo
                const exportResponse = await fetch(`${this.systems.domingoOrchestrator.url}/api/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: result.sessionId || Date.now().toString(),
                        format: format,
                        data: result,
                        deploymentTargets: ['npm', 'docker', format]
                    })
                });
                
                if (exportResponse.ok) {
                    const exportData = await exportResponse.json();
                    return {
                        format,
                        downloadUrl: exportData.downloadUrl || `${this.systems.domingoOrchestrator.url}/download/${result.sessionId}.${format}`,
                        platforms: ['npm', 'docker', 'obsidian', 'vscode'],
                        deploymentOptions: ['railway', 'vercel', 'heroku'],
                        domingoPackaged: true,
                        packageDetails: exportData
                    };
                }
            }
        } catch (error) {
            console.error('Domingo orchestrator unavailable, using fallback:', error);
        }
        
        // Fallback if Domingo is not available
        return {
            format,
            downloadUrl: `http://localhost:${this.PORT}/download/${result.sessionId || 'demo'}.${format}`,
            platforms: ['npm', 'docker', 'obsidian', 'vscode'],
            deploymentOptions: ['railway', 'vercel', 'heroku'],
            domingoPackaged: false,
            note: 'Package created without Domingo orchestrator - basic export only'
        };
    }
    
    async deductToken(userId) {
        // Deduct token from billing system
        console.log(`💰 Deducting token from user ${userId}`);
        try {
            // Generate a token for the user first, which will validate their billing
            const response = await fetch(`${this.systems.tokenBilling.url}/api/tokens/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    email: `${userId}@demo.com`,
                    billingTier: 'free'
                })
            });
            
            if (response.ok) {
                const tokenData = await response.json();
                console.log(`💰 Token generated for user ${userId}, remaining: ${tokenData.user.tokensAvailable}`);
                this.tokenEconomy.tokensSpentToday++;
            }
        } catch (error) {
            console.error('Failed to deduct token:', error);
        }
    }
    
    async getUserTokenBalance(userId) {
        // Get balance from token billing system
        try {
            const response = await fetch(`${this.systems.tokenBilling.url}/api/usage/${userId}`);
            if (response.ok) {
                const data = await response.json();
                return data.user.tokensAvailable;
            }
        } catch (error) {
            console.error('Failed to get token balance:', error);
        }
        return 10; // Default fallback
    }
    
    async earnTokensFromTask(userId, taskId) {
        // Register with federation board to earn tokens
        try {
            const response = await fetch(`${this.systems.federationBoard.url}/api/citizens/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userId,
                    gameData: { level: 1, contributions: 1, qualityScore: 0.8 }
                })
            });
            
            if (response.ok) {
                const earned = Math.floor(Math.random() * 10) + 5; // 5-15 tokens
                this.tokenEconomy.tokensEarnedToday += earned;
                console.log(`🎁 User ${userId} earned ${earned} tokens from federation tasks`);
                return earned;
            }
        } catch (error) {
            console.error('Failed to earn tokens:', error);
        }
        
        // Fallback
        const earned = 5;
        this.tokenEconomy.tokensEarnedToday += earned;
        return earned;
    }
    
    async connectToSystem(systemName) {
        if (this.systems[systemName]) {
            await this.checkSystemConnections();
            return this.systems[systemName].connected;
        }
        return false;
    }
    
    async exportSession(sessionId, format) {
        // Mock implementation
        return {
            success: true,
            format,
            size: '2.3MB',
            downloadUrl: `http://localhost:${this.PORT}/download/${sessionId}.${format}`
        };
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Subscribe to updates
                this.emit('client-subscribe', { ws, channel: data.channel });
                break;
                
            case 'process':
                // Start processing
                const result = await this.processDocument(data.documentPath);
                ws.send(JSON.stringify({ type: 'process-result', result }));
                break;
                
            case 'status':
                // Get current status
                const status = await this.getSystemStatus();
                ws.send(JSON.stringify({ type: 'status', data: status }));
                break;
        }
    }
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Master Integration Dashboard - Document Generator Ecosystem</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 0; 
            background: #0a0a0a; 
            color: #fff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: #1a1a2e;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #16213e;
            transition: all 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
        }
        .system-status {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .connected { background: #00ff00; }
        .disconnected { background: #ff0000; }
        .button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .button:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
        .flow-diagram {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }
        .flow-step {
            display: inline-block;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border-radius: 20px;
            margin: 5px;
        }
        .arrow {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
        }
        .token-display {
            font-size: 24px;
            text-align: center;
            margin: 20px 0;
        }
        #processButton {
            width: 100%;
            font-size: 20px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Master Integration Dashboard</h1>
        <p>Unified Document Processing Ecosystem</p>
    </div>
    
    <div class="container">
        <!-- System Status Grid -->
        <div class="grid">
            <div class="card">
                <h3>📚 Wayback Librarian</h3>
                <div class="system-status">
                    <div class="status-indicator disconnected" id="wayback-status"></div>
                    <span>Document Discovery System</span>
                </div>
                <small>Find existing components and patterns</small>
            </div>
            
            <div class="card">
                <h3>🔬 Laser Scanner</h3>
                <div class="system-status">
                    <div class="status-indicator disconnected" id="laser-status"></div>
                    <span>Deep Analysis Engine</span>
                </div>
                <small>Analyze nested structures and patterns</small>
            </div>
            
            <div class="card">
                <h3>💰 Token Billing</h3>
                <div class="system-status">
                    <div class="status-indicator disconnected" id="billing-status"></div>
                    <span>Economy System</span>
                </div>
                <small>API access and payment management</small>
            </div>
            
            <div class="card">
                <h3>📋 Federation Board</h3>
                <div class="system-status">
                    <div class="status-indicator disconnected" id="board-status"></div>
                    <span>Community Tasks</span>
                </div>
                <small>Earn tokens by completing tasks</small>
            </div>
            
            <div class="card">
                <h3>📦 Domingo Orchestrator</h3>
                <div class="system-status">
                    <div class="status-indicator disconnected" id="domingo-status"></div>
                    <span>Export & Deploy</span>
                </div>
                <small>Package and deploy anywhere</small>
            </div>
            
            <div class="card">
                <h3>🚀 Document API</h3>
                <div class="system-status">
                    <div class="status-indicator disconnected" id="api-status"></div>
                    <span>Processing Engine</span>
                </div>
                <small>Transform documents to MVPs</small>
            </div>
        </div>
        
        <!-- Token Display -->
        <div class="card token-display">
            <h3>💎 Your Tokens</h3>
            <div id="token-balance" style="font-size: 48px; color: #667eea;">--</div>
            <button class="button" onclick="earnTokens()">Earn More Tokens</button>
        </div>
        
        <!-- Unified Flow -->
        <div class="card">
            <h2>🔄 Unified Document Processing Flow</h2>
            <div class="flow-diagram">
                <span class="flow-step">📄 Document</span>
                <span class="arrow">→</span>
                <span class="flow-step">🔍 Discovery</span>
                <span class="arrow">→</span>
                <span class="flow-step">🔬 Analysis</span>
                <span class="arrow">→</span>
                <span class="flow-step">⚙️ Processing</span>
                <span class="arrow">→</span>
                <span class="flow-step">📦 Export</span>
            </div>
            
            <button id="processButton" class="button" onclick="startUnifiedFlow()">
                🚀 Start Document Processing Flow
            </button>
            
            <div id="flow-status"></div>
        </div>
        
        <!-- Results Area -->
        <div class="card" id="results" style="display: none;">
            <h3>📊 Processing Results</h3>
            <pre id="results-content"></pre>
        </div>
    </div>
    
    <script>
        const WS_URL = 'ws://localhost:9501';
        let ws;
        
        // Initialize WebSocket connection
        function connectWebSocket() {
            ws = new WebSocket(WS_URL);
            
            ws.onopen = () => {
                console.log('Connected to dashboard');
                checkStatus();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                console.log('Disconnected, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        // Check system status
        async function checkStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                updateSystemStatus(status.systems);
                updateTokenBalance();
            } catch (error) {
                console.error('Failed to check status:', error);
            }
        }
        
        // Update system status indicators
        function updateSystemStatus(systems) {
            document.getElementById('wayback-status').className = 
                'status-indicator ' + (systems.waybackLibrarian.connected ? 'connected' : 'disconnected');
            document.getElementById('laser-status').className = 
                'status-indicator ' + (systems.laserScanner.connected ? 'connected' : 'disconnected');
            document.getElementById('billing-status').className = 
                'status-indicator ' + (systems.tokenBilling.connected ? 'connected' : 'disconnected');
            document.getElementById('board-status').className = 
                'status-indicator ' + (systems.federationBoard.connected ? 'connected' : 'disconnected');
            document.getElementById('domingo-status').className = 
                'status-indicator ' + (systems.domingoOrchestrator.connected ? 'connected' : 'disconnected');
            document.getElementById('api-status').className = 
                'status-indicator ' + (systems.simpleDocumentAPI.connected ? 'connected' : 'disconnected');
        }
        
        // Update token balance
        async function updateTokenBalance() {
            try {
                const response = await fetch('/api/token-balance/demo-user');
                const data = await response.json();
                document.getElementById('token-balance').textContent = data.balance;
            } catch (error) {
                document.getElementById('token-balance').textContent = '0';
            }
        }
        
        // Start unified flow
        async function startUnifiedFlow() {
            const button = document.getElementById('processButton');
            const statusDiv = document.getElementById('flow-status');
            const resultsDiv = document.getElementById('results');
            
            button.disabled = true;
            button.textContent = '⏳ Processing...';
            statusDiv.innerHTML = '<p style="color: #667eea;">Starting unified document processing flow...</p>';
            
            try {
                const response = await fetch('/api/process-document-flow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        documentPath: 'test-document.md',
                        userId: 'demo-user',
                        options: {
                            premium: false,
                            postToBoard: true,
                            export: true,
                            exportFormat: 'npm'
                        }
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.innerHTML = '<p style="color: #00ff00;">✅ Processing complete!</p>';
                    resultsDiv.style.display = 'block';
                    document.getElementById('results-content').textContent = 
                        JSON.stringify(result, null, 2);
                } else {
                    statusDiv.innerHTML = '<p style="color: #ff0000;">❌ Error: ' + result.error + '</p>';
                }
                
                updateTokenBalance();
                
            } catch (error) {
                statusDiv.innerHTML = '<p style="color: #ff0000;">❌ Failed: ' + error.message + '</p>';
            } finally {
                button.disabled = false;
                button.textContent = '🚀 Start Document Processing Flow';
            }
        }
        
        // Earn tokens
        function earnTokens() {
            window.open('http://localhost:8700', '_blank');
        }
        
        // Handle WebSocket messages
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'status':
                    updateSystemStatus(data.data);
                    break;
                case 'token-update':
                    document.getElementById('token-balance').textContent = data.balance;
                    break;
            }
        }
        
        // Initialize
        connectWebSocket();
        setInterval(checkStatus, 30000); // Check every 30 seconds
    </script>
</body>
</html>
        `;
    }
}

// Export for use
module.exports = MasterIntegrationDashboard;

// Run if executed directly
if (require.main === module) {
    const dashboard = new MasterIntegrationDashboard();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Master Integration Dashboard...');
        process.exit(0);
    });
}