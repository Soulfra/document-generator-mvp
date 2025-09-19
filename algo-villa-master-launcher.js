#!/usr/bin/env node
// algo-villa-master-launcher.js - Complete AlgoVilla platform launcher
// Brings together all components for the ultimate Love Island trading competition experience

console.log('🏖️ AlgoVilla Master Launcher - Starting Love Island for Trading Algorithms...');

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

class AlgoVillaMasterLauncher {
  constructor() {
    this.components = {
      backend: null,
      competitionMechanics: null,
      liveStreaming: null,
      tradingDrama: null,
      integrationBridge: null
    };
    
    this.servers = [];
    this.systemStatus = {
      initialized: false,
      allSystemsReady: false,
      errors: []
    };
    
    this.ports = {
      main: 8899,
      citadel: 8894,
      backup: 8900
    };
  }

  async initialize() {
    console.log('🚀 Initializing AlgoVilla Master System...');
    
    try {
      // Load and initialize all components
      await this.loadComponents();
      
      // Start all systems
      await this.startAllSystems();
      
      // Verify system integration
      await this.verifySystemIntegration();
      
      // Start the show!
      this.goLive();
      
      console.log('✅ AlgoVilla Master System fully operational!');
      
    } catch (error) {
      console.error('❌ Failed to initialize AlgoVilla:', error);
      this.systemStatus.errors.push(error.message);
    }
  }

  async loadComponents() {
    console.log('📦 Loading AlgoVilla components...');
    
    try {
      // Load backend system
      const AlgoVillaBackend = require('./algo-villa-backend.js');
      this.components.backend = new AlgoVillaBackend();
      console.log('✅ Backend loaded');
      
      // Load competition mechanics
      const LoveIslandCompetitionMechanics = require('./love-island-competition-mechanics.js');
      this.components.competitionMechanics = new LoveIslandCompetitionMechanics(this.components.backend);
      console.log('✅ Competition mechanics loaded');
      
      // Load live streaming
      const AlgoVillaLiveStreaming = require('./algo-villa-live-streaming.js');
      this.components.liveStreaming = new AlgoVillaLiveStreaming(
        this.components.backend, 
        this.components.competitionMechanics
      );
      console.log('✅ Live streaming loaded');
      
      // Load trading drama engine
      const AlgoVillaTradingDramaEngine = require('./algo-villa-trading-drama-engine.js');
      this.components.tradingDrama = new AlgoVillaTradingDramaEngine(
        this.components.backend,
        this.components.competitionMechanics,
        this.components.liveStreaming
      );
      console.log('✅ Trading drama engine loaded');
      
      // Load integration bridge
      const AlgoVillaIntegrationBridge = require('./algo-villa-integration-bridge.js');
      this.components.integrationBridge = new AlgoVillaIntegrationBridge();
      console.log('✅ Integration bridge loaded');
      
    } catch (error) {
      console.error('❌ Error loading components:', error);
      
      // Fall back to mock components if files don't exist
      console.log('⚠️ Falling back to mock components...');
      this.createMockComponents();
    }
  }

  createMockComponents() {
    // Create minimal mock components for demonstration
    this.components.backend = {
      contestants: new Map(),
      couples: new Map(),
      getContestants: () => this.getMockContestants(),
      getCouples: () => [],
      dramaEngine: {
        generateEvent: (event) => console.log('🎭 Drama:', event.description),
        getRecentEvents: () => []
      }
    };
    
    this.components.competitionMechanics = {
      competitionState: {
        phase: 'live-show',
        dayInVilla: 5,
        isLive: true
      },
      getCurrentCompetitionState: () => this.components.competitionMechanics.competitionState
    };
    
    this.components.liveStreaming = {
      streamState: { isLive: true, viewerCount: 25000 },
      broadcastSystemMessage: (msg) => console.log('📺 Broadcast:', msg.message),
      analytics: { engagement_score: 7.5 }
    };
    
    this.components.tradingDrama = {
      simulationState: { isActive: true, marketRegime: 'normal' },
      getSimulationState: () => this.components.tradingDrama.simulationState
    };
    
    console.log('✅ Mock components created');
  }

  getMockContestants() {
    return [
      {
        id: 'momentum-mike',
        name: 'Momentum Mike',
        avatar: '🚀',
        tradingStyle: 'momentum',
        performance: { pnl: '+$420.50', winRate: 68.5, trades: 247 },
        relationships: { status: 'single' },
        viewerFavorability: 72
      },
      {
        id: 'conservative-carol',
        name: 'Conservative Carol',
        avatar: '🛡️',
        tradingStyle: 'value-investing',
        performance: { pnl: '+$175.25', winRate: 82.1, trades: 89 },
        relationships: { status: 'coupled', partner: 'dividend-dan' },
        viewerFavorability: 84
      },
      {
        id: 'scalping-sam',
        name: 'Scalping Sam',
        avatar: '⚡',
        tradingStyle: 'scalping',
        performance: { pnl: '+$12.75', winRate: 71.3, trades: 1847 },
        relationships: { status: 'single' },
        viewerFavorability: 65
      },
      {
        id: 'ai-annie',
        name: 'AI Annie',
        avatar: '🤖',
        tradingStyle: 'machine-learning',
        performance: { pnl: '+$385.40', winRate: 79.2, trades: 156 },
        relationships: { status: 'single' },
        viewerFavorability: 78
      },
      {
        id: 'dividend-dan',
        name: 'Dividend Dan',
        avatar: '💰',
        tradingStyle: 'dividend-growth',
        performance: { pnl: '+$124.15', winRate: 89.7, trades: 23 },
        relationships: { status: 'coupled', partner: 'conservative-carol' },
        viewerFavorability: 81
      },
      {
        id: 'crypto-chris',
        name: 'Crypto Chris',
        avatar: '₿',
        tradingStyle: 'crypto-maximalist',
        performance: { pnl: '-$125.80', winRate: 45.2, trades: 89 },
        relationships: { status: 'single' },
        viewerFavorability: 43
      }
    ];
  }

  async startAllSystems() {
    console.log('🎬 Starting all AlgoVilla systems...');
    
    // Start web server
    this.startWebServer();
    
    // Start system monitoring
    this.startSystemMonitoring();
    
    // Start live data feeds
    this.startLiveDataFeeds();
    
    this.systemStatus.initialized = true;
  }

  startWebServer() {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });
    
    // Middleware
    app.use(express.json());
    app.use(express.static('public'));
    
    // CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
    
    // Main AlgoVilla interface
    app.get('/', (req, res) => {
      res.send(this.generateMainInterface());
    });
    
    // API endpoints
    app.get('/api/status', (req, res) => {
      res.json(this.getSystemStatus());
    });
    
    app.get('/api/contestants', (req, res) => {
      res.json(this.components.backend.getContestants());
    });
    
    app.get('/api/leaderboard', (req, res) => {
      const contestants = this.components.backend.getContestants();
      const leaderboard = contestants
        .map((c, index) => ({
          rank: index + 1,
          contestant: c.name,
          score: parseFloat(c.performance.pnl.replace(/[^0-9.-]/g, '')),
          change: Math.floor(Math.random() * 20) - 10
        }))
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, rank: index + 1 }));
      
      res.json(leaderboard);
    });
    
    app.get('/api/drama-feed', (req, res) => {
      const drama = [
        {
          type: 'trading-conflict',
          description: 'Momentum Mike is getting frustrated with the current market conditions!',
          timestamp: Date.now() - 300000
        },
        {
          type: 'relationship-update',
          description: 'Conservative Carol and Dividend Dan are proving to be the perfect match!',
          timestamp: Date.now() - 600000
        },
        {
          type: 'performance-milestone',
          description: 'AI Annie just hit a new high in trading accuracy!',
          timestamp: Date.now() - 900000
        }
      ];
      res.json(drama);
    });
    
    app.get('/api/live-stats', (req, res) => {
      res.json({
        viewerCount: this.components.liveStreaming.streamState.viewerCount,
        isLive: this.components.liveStreaming.streamState.isLive,
        currentScene: this.components.liveStreaming.streamState.currentScene,
        competitionDay: this.components.competitionMechanics.competitionState.dayInVilla,
        marketVolatility: this.components.tradingDrama.simulationState.currentVolatility,
        engagementScore: this.components.liveStreaming.analytics.engagement_score
      });
    });
    
    // WebSocket handling
    wss.on('connection', (ws, req) => {
      console.log('🔌 New viewer connected');
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        data: {
          message: 'Welcome to AlgoVilla!',
          contestants: this.components.backend.getContestants(),
          liveStats: {
            viewerCount: this.components.liveStreaming.streamState.viewerCount,
            isLive: true
          }
        }
      }));
      
      // Handle messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('📱 Viewer disconnected');
      });
    });
    
    // Start server
    server.listen(this.ports.main, () => {
      console.log(`🌐 AlgoVilla web server running on http://localhost:${this.ports.main}`);
    });
    
    this.servers.push(server);
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'chat':
        // Broadcast chat message
        console.log(`💬 Chat: ${data.message}`);
        // In real implementation, would broadcast to all connected clients
        break;
        
      case 'reaction':
        // Handle viewer reaction
        console.log(`😍 Reaction: ${data.reaction}`);
        break;
        
      case 'vote':
        // Handle voting
        console.log(`🗳️ Vote: ${data.option}`);
        break;
    }
  }

  startSystemMonitoring() {
    // Monitor system health
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // Every 30 seconds
    
    // Update live statistics
    setInterval(() => {
      this.updateLiveStatistics();
    }, 5000); // Every 5 seconds
    
    console.log('📊 System monitoring started');
  }

  startLiveDataFeeds() {
    // Simulate live market data
    setInterval(() => {
      this.generateLiveMarketData();
    }, 1000); // Every second
    
    // Generate drama events
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        this.generateRandomDrama();
      }
    }, 30000); // Every 30 seconds
    
    console.log('📡 Live data feeds started');
  }

  checkSystemHealth() {
    const health = {
      backend: !!this.components.backend,
      competition: !!this.components.competitionMechanics,
      streaming: !!this.components.liveStreaming,
      drama: !!this.components.tradingDrama,
      timestamp: Date.now()
    };
    
    this.systemStatus.allSystemsReady = Object.values(health).every(status => status === true);
    
    if (!this.systemStatus.allSystemsReady) {
      console.log('⚠️ System health check failed:', health);
    }
  }

  updateLiveStatistics() {
    // Simulate viewer count changes
    if (this.components.liveStreaming) {
      const change = Math.floor(Math.random() * 200) - 100;
      this.components.liveStreaming.streamState.viewerCount = Math.max(
        1000, 
        this.components.liveStreaming.streamState.viewerCount + change
      );
    }
  }

  generateLiveMarketData() {
    // Simulate market data for trading algorithms
    const symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN', 'BTC', 'ETH'];
    const marketData = symbols.map(symbol => ({
      symbol,
      price: Math.random() * 500 + 50,
      change: (Math.random() - 0.5) * 0.05,
      volume: Math.floor(Math.random() * 1000000)
    }));
    
    // In real implementation, would broadcast to all clients
    // console.log('📈 Live market data generated');
  }

  generateRandomDrama() {
    const dramaEvents = [
      'Momentum Mike is getting cocky after recent wins!',
      'Conservative Carol questions the villa\'s risk tolerance!',
      'Scalping Sam is frustrated with execution speeds!',
      'AI Annie is having trouble understanding emotions!',
      'Dividend Dan shares wisdom about long-term thinking!',
      'Crypto Chris refuses to diversify despite losses!'
    ];
    
    const drama = dramaEvents[Math.floor(Math.random() * dramaEvents.length)];
    console.log(`🎭 Drama: ${drama}`);
  }

  goLive() {
    console.log('🔴 AlgoVilla is now LIVE!');
    
    this.displayLiveStatus();
    this.startLiveAnnouncements();
  }

  displayLiveStatus() {
    console.log('\n🏖️ ALGOVIC VILLA - LOVE ISLAND FOR TRADING ALGORITHMS 🏖️');
    console.log('=====================================================');
    console.log(`🌐 Main Interface: http://localhost:${this.ports.main}`);
    console.log(`📺 Live Stream: ACTIVE`);
    console.log(`👥 Contestants: ${this.components.backend.getContestants().length}`);
    console.log(`👀 Viewers: ${this.components.liveStreaming.streamState.viewerCount.toLocaleString()}`);
    console.log(`📊 Day in Villa: ${this.components.competitionMechanics.competitionState.dayInVilla}`);
    console.log(`🎭 Drama Level: HIGH`);
    console.log('');
    console.log('🎬 FEATURES:');
    console.log('  💕 Love Island-style algorithm competition');
    console.log('  🏆 Weekly challenges and eliminations');
    console.log('  🎭 Real-time drama generation');
    console.log('  📺 Live streaming with audience interaction');
    console.log('  💬 Live chat and voting');
    console.log('  📈 Real trading simulation');
    console.log('  🤖 6 unique algorithm personalities');
    console.log('  🔄 Couple formation and breakups');
    console.log('');
    console.log('🚀 Ready for the ultimate reality TV trading experience!');
    console.log('=====================================================\n');
  }

  startLiveAnnouncements() {
    // Periodic status announcements
    setInterval(() => {
      const stats = this.getSystemStatus();
      console.log(`📊 Live Stats: ${stats.viewers.toLocaleString()} viewers, Day ${stats.competitionDay}, ${stats.activeContestants} contestants remaining`);
    }, 300000); // Every 5 minutes
  }

  generateMainInterface() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🏖️ AlgoVilla - Love Island for Trading Algorithms</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 30px 20px;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        
        .live-indicator {
            display: inline-block;
            background: #ff4757;
            padding: 8px 20px;
            border-radius: 25px;
            margin: 10px;
            animation: pulse 2s infinite;
            font-weight: bold;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .stats-bar {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        
        .stat {
            background: rgba(255,255,255,0.1);
            padding: 10px 20px;
            border-radius: 15px;
            backdrop-filter: blur(5px);
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .panel {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .panel h2 {
            margin-bottom: 20px;
            font-size: 1.5rem;
            text-align: center;
        }
        
        .contestant {
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.3s ease;
        }
        
        .contestant:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        .contestant-info {
            flex: 1;
        }
        
        .contestant-name {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .contestant-stats {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .contestant-status {
            text-align: right;
        }
        
        .relationship-status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .single { background: #ff6b6b; }
        .coupled { background: #4ecdc4; }
        
        .popularity {
            margin-top: 5px;
            font-size: 0.9rem;
        }
        
        .drama-feed {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .drama-item {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #ff6b35;
        }
        
        .drama-time {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            margin: 8px 0;
        }
        
        .rank {
            font-size: 1.5rem;
            font-weight: bold;
            color: #ffd700;
        }
        
        .market-data {
            font-family: monospace;
            font-size: 0.9rem;
        }
        
        .market-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .price-up { color: #4ade80; }
        .price-down { color: #ef4444; }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: rgba(0,0,0,0.5);
            margin-top: 40px;
        }
        
        .update-time {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .stats-bar { gap: 15px; }
            .grid { grid-template-columns: 1fr; }
            .contestant { flex-direction: column; text-align: center; }
            .contestant-status { margin-top: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏖️ AlgoVilla</h1>
        <p style="font-size: 1.3rem;">Love Island for Trading Algorithms</p>
        <div class="live-indicator">🔴 LIVE</div>
        
        <div class="stats-bar">
            <div class="stat">👥 <span id="viewerCount">25,247</span> viewers</div>
            <div class="stat">📅 Day <span id="competitionDay">5</span> in villa</div>
            <div class="stat">🏆 <span id="contestantCount">6</span> contestants</div>
            <div class="stat">📊 Drama level: <span style="color: #ff6b35;">HIGH</span></div>
        </div>
    </div>

    <div class="container">
        <div class="grid">
            <div class="panel">
                <h2>🏆 Current Contestants</h2>
                <div id="contestants">Loading contestants...</div>
            </div>

            <div class="panel">
                <h2>📊 Leaderboard</h2>
                <div id="leaderboard">Loading leaderboard...</div>
            </div>
        </div>

        <div class="grid">
            <div class="panel">
                <h2>🎭 Drama Feed</h2>
                <div class="drama-feed" id="dramaFeed">Loading drama...</div>
            </div>

            <div class="panel">
                <h2>📈 Live Market Data</h2>
                <div class="market-data" id="marketData">Loading market data...</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <h3>🎬 The Ultimate Reality TV Trading Experience</h3>
        <p>Watch as trading algorithms compete for love, money, and glory!</p>
        <p style="margin-top: 10px; opacity: 0.8;">
            💕 Relationships • 🏆 Challenges • 🎭 Drama • 📊 Trading • 🗳️ Voting
        </p>
    </div>

    <div class="update-time">
        Last updated: <span id="updateTime">--:--:--</span>
    </div>

    <script>
        // WebSocket connection for live updates
        const ws = new WebSocket('ws://localhost:${this.ports.main}');
        
        ws.onopen = () => {
            console.log('Connected to AlgoVilla live stream');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleLiveUpdate(data);
        };
        
        function handleLiveUpdate(data) {
            switch (data.type) {
                case 'welcome':
                    updateContestants(data.data.contestants);
                    updateStats(data.data.liveStats);
                    break;
            }
        }
        
        // Load initial data
        async function loadData() {
            try {
                const [contestants, leaderboard, drama, stats] = await Promise.all([
                    fetch('/api/contestants').then(r => r.json()),
                    fetch('/api/leaderboard').then(r => r.json()),
                    fetch('/api/drama-feed').then(r => r.json()),
                    fetch('/api/live-stats').then(r => r.json())
                ]);
                
                updateContestants(contestants);
                updateLeaderboard(leaderboard);
                updateDramaFeed(drama);
                updateStats(stats);
                updateMarketData();
                
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        
        function updateContestants(contestants) {
            const container = document.getElementById('contestants');
            const html = contestants.map(c => \`
                <div class="contestant">
                    <div class="contestant-info">
                        <div class="contestant-name">\${c.avatar} \${c.name}</div>
                        <div class="contestant-stats">
                            \${c.tradingStyle} • P&L: \${c.performance.pnl} • Win Rate: \${c.performance.winRate}%
                        </div>
                    </div>
                    <div class="contestant-status">
                        <div class="relationship-status \${c.relationships.status}">
                            \${c.relationships.status === 'coupled' ? '💕 Coupled' : '💔 Single'}
                        </div>
                        <div class="popularity">❤️ \${c.viewerFavorability}%</div>
                    </div>
                </div>
            \`).join('');
            container.innerHTML = html;
        }
        
        function updateLeaderboard(leaderboard) {
            const container = document.getElementById('leaderboard');
            const html = leaderboard.slice(0, 6).map(item => \`
                <div class="leaderboard-item">
                    <div>
                        <span class="rank">#\${item.rank}</span>
                        <span style="margin-left: 15px;">\${item.contestant}</span>
                    </div>
                    <div>
                        $\${item.score.toFixed(2)}
                        <span style="color: \${item.change > 0 ? '#4ade80' : '#ef4444'}">
                            (\${item.change > 0 ? '+' : ''}\${item.change})
                        </span>
                    </div>
                </div>
            \`).join('');
            container.innerHTML = html;
        }
        
        function updateDramaFeed(drama) {
            const container = document.getElementById('dramaFeed');
            const html = drama.map(item => \`
                <div class="drama-item">
                    <div>\${item.description}</div>
                    <div class="drama-time">\${new Date(item.timestamp).toLocaleTimeString()}</div>
                </div>
            \`).join('');
            container.innerHTML = html;
        }
        
        function updateStats(stats) {
            document.getElementById('viewerCount').textContent = stats.viewerCount.toLocaleString();
            document.getElementById('competitionDay').textContent = stats.competitionDay;
        }
        
        function updateMarketData() {
            const symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN', 'BTC', 'ETH'];
            const container = document.getElementById('marketData');
            
            const html = symbols.map(symbol => {
                const price = (Math.random() * 500 + 50).toFixed(2);
                const change = ((Math.random() - 0.5) * 0.05).toFixed(3);
                const changeClass = change > 0 ? 'price-up' : 'price-down';
                const changeSymbol = change > 0 ? '↑' : '↓';
                
                return \`
                    <div class="market-item">
                        <span>\${symbol}</span>
                        <span class="\${changeClass}">$\${price} \${changeSymbol}\${Math.abs(change)}%</span>
                    </div>
                \`;
            }).join('');
            
            container.innerHTML = html;
        }
        
        function updateTime() {
            document.getElementById('updateTime').textContent = new Date().toLocaleTimeString();
        }
        
        // Initialize
        loadData();
        updateTime();
        
        // Auto-refresh
        setInterval(loadData, 30000); // Every 30 seconds
        setInterval(updateMarketData, 2000); // Every 2 seconds
        setInterval(updateTime, 1000); // Every second
    </script>
</body>
</html>
    `;
  }

  getSystemStatus() {
    return {
      ...this.systemStatus,
      viewers: this.components.liveStreaming?.streamState?.viewerCount || 25000,
      competitionDay: this.components.competitionMechanics?.competitionState?.dayInVilla || 5,
      activeContestants: this.components.backend?.getContestants()?.length || 6,
      isLive: this.components.liveStreaming?.streamState?.isLive || true,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }

  shutdown() {
    console.log('🛑 Shutting down AlgoVilla...');
    
    this.servers.forEach(server => {
      server.close();
    });
    
    console.log('✅ AlgoVilla shutdown complete');
  }
}

// Initialize and start AlgoVilla
const algoVilla = new AlgoVillaMasterLauncher();
algoVilla.startTime = Date.now();

// Start the system
algoVilla.initialize().catch(error => {
  console.error('Failed to start AlgoVilla:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  algoVilla.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  algoVilla.shutdown();
  process.exit(0);
});

module.exports = AlgoVillaMasterLauncher;