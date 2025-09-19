#!/usr/bin/env node

/**
 * 🎮 MASTER INTEGRATION LAUNCHER
 * Centralized control system for Shadow Layer Search + Game Integration
 * 
 * This is the unified command center that brings together:
 * - Shadow Layer Search System (character-driven file indexing)
 * - Cookbook Recipe Organizer (actionable game recipes)  
 * - Addictive Game Integration Bridge (ships, pools, judges, partners)
 * 
 * Everything organized into chapters and books like the user requested.
 */

const express = require('express');
const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

class MasterIntegrationLauncher {
  constructor() {
    this.app = express();
    this.port = 8888;
    this.services = new Map();
    this.gameState = {
      playersOnline: 0,
      activeShips: 0,
      liquidityPools: {},
      judgeScores: {},
      partnerAlliances: []
    };
    
    // Database for persistence
    this.dbPath = path.join(__dirname, 'master-integration.db');
    this.db = null;
    
    // WebSocket for real-time updates
    this.wss = null;
    
    this.setupMiddleware();
    this.initializeDatabase();
    this.setupRoutes();
    this.setupWebSocket();
  }
    
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  async initializeDatabase() {
    this.db = new sqlite3.Database(this.dbPath);
    
    // Create master integration tables
    const schema = `
      CREATE TABLE IF NOT EXISTS service_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT UNIQUE NOT NULL,
        service_type TEXT NOT NULL,
        port INTEGER,
        status TEXT DEFAULT 'stopped',
        pid INTEGER,
        last_heartbeat DATETIME,
        start_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_character TEXT NOT NULL,
        session_type TEXT NOT NULL, -- 'search', 'recipe', 'exploration'
        session_data TEXT, -- JSON
        score INTEGER DEFAULT 0,
        carrots_earned INTEGER DEFAULT 0,
        knowledge_gained TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME
      );
      
      CREATE TABLE IF NOT EXISTS cookbook_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_name TEXT NOT NULL,
        chapter_type TEXT NOT NULL, -- 'infrastructure', 'exploration', 'trading'
        recipes TEXT, -- JSON array of recipe IDs
        character_affinity TEXT, -- which character specializes in this
        difficulty_level INTEGER DEFAULT 1,
        unlocked_by TEXT, -- requirements to unlock
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_data TEXT, -- JSON
        character_involved TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: 8889 });
    
    this.wss.on('connection', (ws) => {
      console.log('🎮 New player connected to Master Integration');
      
      // Send current game state
      ws.send(JSON.stringify({
        type: 'game_state',
        data: this.gameState
      }));
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🎮 Player disconnected from Master Integration');
      });
    });
  }

  async handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'start_search_session':
        await this.startSearchSession(data.character, ws);
        break;
      case 'create_recipe':
        await this.createRecipe(data.recipeData, ws);
        break;
      case 'launch_ship':
        await this.launchShip(data.shipType, data.character, ws);
        break;
      case 'join_pool':
        await this.joinLiquidityPool(data.poolType, data.character, ws);
        break;
    }
  }
    
  setupRoutes() {
    // 🎮 MAIN DASHBOARD
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // 🔍 SHADOW LAYER SEARCH INTEGRATION
    this.app.post('/api/search', async (req, res) => {
      try {
        const { query, character, sortBy } = req.body;
        const results = await this.performShadowSearch(query, character, sortBy);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 📚 COOKBOOK RECIPE ENDPOINTS
    this.app.get('/api/cookbook', async (req, res) => {
      try {
        const cookbook = await this.getCookbook();
        res.json(cookbook);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/cookbook/recipe', async (req, res) => {
      try {
        const recipe = await this.createRecipeFromSearch(req.body);
        res.json(recipe);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎮 GAME INTEGRATION ENDPOINTS
    this.app.get('/api/game/state', (req, res) => {
      res.json(this.gameState);
    });

    this.app.post('/api/game/action', async (req, res) => {
      try {
        const result = await this.performGameAction(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🚀 SERVICE MANAGEMENT
    this.app.get('/api/services', async (req, res) => {
      const services = await this.getServiceStatus();
      res.json(services);
    });

    this.app.post('/api/services/:serviceName/start', async (req, res) => {
      try {
        const result = await this.startService(req.params.serviceName);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/services/:serviceName/stop', async (req, res) => {
      try {
        const result = await this.stopService(req.params.serviceName);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 📊 ANALYTICS AND MONITORING
    this.app.get('/api/analytics', async (req, res) => {
      try {
        const analytics = await this.getAnalytics();
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async performShadowSearch(query, character, sortBy) {
    // Integrate with shadow-layer-search-system.js
    const searchService = this.services.get('shadow-search');
    
    if (!searchService || searchService.status !== 'running') {
      await this.startService('shadow-search');
    }

    // Forward request to shadow search system
    const response = await fetch(`http://localhost:3333/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, character, sortBy })
    });

    const results = await response.json();
    
    // Log search session for game mechanics
    await this.logGameEvent('shadow_search', {
      character,
      query,
      resultsCount: results.results?.length || 0,
      sortBy
    });

    return results;
  }

  async createRecipeFromSearch(searchResults) {
    // Integrate with cookbook-recipe-organizer.js
    const cookbookService = this.services.get('cookbook-organizer');
    
    if (!cookbookService || cookbookService.status !== 'running') {
      await this.startService('cookbook-organizer');
    }

    const response = await fetch(`http://localhost:4444/create-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchResults)
    });

    const recipe = await response.json();
    
    // Store in cookbook database
    await this.storeRecipeInCookbook(recipe);
    
    return recipe;
  }

  async performGameAction(actionData) {
    // Integrate with addictive-game-integration-bridge.js
    const gameService = this.services.get('game-bridge');
    
    if (!gameService || gameService.status !== 'running') {
      await this.startService('game-bridge');
    }

    const response = await fetch(`http://localhost:5555/game-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionData)
    });

    const result = await response.json();
    
    // Update game state
    this.updateGameState(result);
    
    // Broadcast to connected clients
    this.broadcastGameUpdate(result);
    
    return result;
  }

  async startService(serviceName) {
    const serviceConfigs = {
      'shadow-search': {
        script: './shadow-layer-search-system.js',
        port: 3333,
        type: 'search_engine'
      },
      'cookbook-organizer': {
        script: './cookbook-recipe-organizer.js',
        port: 4444,
        type: 'recipe_system'
      },
      'game-bridge': {
        script: './addictive-game-integration-bridge.js',
        port: 5555,
        type: 'game_system'
      }
    };

    const config = serviceConfigs[serviceName];
    if (!config) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Check if already running
    const existing = this.services.get(serviceName);
    if (existing && existing.status === 'running') {
      return { status: 'already_running', service: serviceName };
    }

    // Start the service
    const child = fork(config.script, [], {
      cwd: __dirname,
      env: { ...process.env, PORT: config.port }
    });

    // Track the service
    this.services.set(serviceName, {
      name: serviceName,
      process: child,
      pid: child.pid,
      port: config.port,
      type: config.type,
      status: 'starting',
      startTime: new Date()
    });

    // Update database
    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO service_registry 
         (service_name, service_type, port, status, pid, start_count) 
         VALUES (?, ?, ?, 'starting', ?, COALESCE((SELECT start_count FROM service_registry WHERE service_name = ?) + 1, 1))`,
        [serviceName, config.type, config.port, child.pid, serviceName],
        (err) => err ? reject(err) : resolve()
      );
    });

    // Handle process events
    child.on('message', (message) => {
      if (message.type === 'ready') {
        const service = this.services.get(serviceName);
        service.status = 'running';
        
        this.db.run(
          `UPDATE service_registry SET status = 'running', last_heartbeat = CURRENT_TIMESTAMP WHERE service_name = ?`,
          [serviceName]
        );
        
        console.log(`✅ ${serviceName} service started on port ${config.port}`);
      }
    });

    child.on('exit', (code) => {
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'stopped';
        this.db.run(
          `UPDATE service_registry SET status = 'stopped' WHERE service_name = ?`,
          [serviceName]
        );
      }
      console.log(`❌ ${serviceName} service exited with code ${code}`);
    });

    return { status: 'starting', service: serviceName, pid: child.pid };
  }
    
  async stopService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service || service.status === 'stopped') {
      return { status: 'not_running', service: serviceName };
    }

    // Kill the process
    service.process.kill();
    service.status = 'stopping';

    // Update database
    await new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE service_registry SET status = 'stopped' WHERE service_name = ?`,
        [serviceName],
        (err) => err ? reject(err) : resolve()
      );
    });

    this.services.delete(serviceName);
    
    return { status: 'stopped', service: serviceName };
  }

  async getServiceStatus() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM service_registry ORDER BY created_at DESC`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getCookbook() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM cookbook_chapters ORDER BY difficulty_level, created_at`, (err, rows) => {
        if (err) reject(err);
        else {
          const cookbook = {
            chapters: rows.map(row => ({
              ...row,
              recipes: JSON.parse(row.recipes || '[]')
            })),
            totalChapters: rows.length,
            unlockedChapters: rows.filter(r => !r.unlocked_by).length
          };
          resolve(cookbook);
        }
      });
    });
  }

  async storeRecipeInCookbook(recipe) {
    const chapterName = `${recipe.gameElements?.ships?.[0] || 'General'} Operations`;
    const chapterType = recipe.character?.role || 'general';
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR IGNORE INTO cookbook_chapters 
         (chapter_name, chapter_type, recipes, character_affinity, difficulty_level) 
         VALUES (?, ?, ?, ?, ?)`,
        [chapterName, chapterType, JSON.stringify([recipe.id]), recipe.character?.name, recipe.complexity || 1],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  async logGameEvent(eventType, eventData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO system_events (event_type, event_data, character_involved) VALUES (?, ?, ?)`,
        [eventType, JSON.stringify(eventData), eventData.character],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  updateGameState(gameResult) {
    if (gameResult.playersOnline !== undefined) {
      this.gameState.playersOnline = gameResult.playersOnline;
    }
    if (gameResult.shipsLaunched !== undefined) {
      this.gameState.activeShips = gameResult.shipsLaunched;
    }
    if (gameResult.poolUpdates) {
      Object.assign(this.gameState.liquidityPools, gameResult.poolUpdates);
    }
  }

  broadcastGameUpdate(update) {
    const message = JSON.stringify({
      type: 'game_update',
      data: update,
      timestamp: new Date().toISOString()
    });

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async getAnalytics() {
    const [services, sessions, events] = await Promise.all([
      this.getServiceStatus(),
      this.getGameSessions(),
      this.getRecentEvents()
    ]);

    return {
      services: {
        total: services.length,
        running: services.filter(s => s.status === 'running').length,
        stopped: services.filter(s => s.status === 'stopped').length
      },
      gameplay: {
        totalSessions: sessions.length,
        activeSessionsToday: sessions.filter(s => 
          new Date(s.started_at).toDateString() === new Date().toDateString()
        ).length,
        averageScore: sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length || 0
      },
      events: {
        recentCount: events.length,
        topEventTypes: this.getTopEventTypes(events)
      }
    };
  }

  async getGameSessions() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM game_sessions ORDER BY started_at DESC LIMIT 100`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getRecentEvents() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM system_events WHERE timestamp > datetime('now', '-24 hours') ORDER BY timestamp DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getTopEventTypes(events) {
    const counts = {};
    events.forEach(event => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }
    
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Master Integration Command Center</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff41;
            margin: 0;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .panel {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
        }
        .panel h3 { margin-top: 0; color: #00ff41; text-shadow: 0 0 10px #00ff41; }
        .service-status { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin: 10px 0;
            padding: 10px;
            background: rgba(0, 255, 65, 0.05);
            border-radius: 5px;
        }
        .status-running { color: #00ff41; }
        .status-stopped { color: #ff4444; }
        button {
            background: linear-gradient(45deg, #00ff41, #00cc33);
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover { transform: scale(1.05); box-shadow: 0 0 15px rgba(0, 255, 65, 0.8); }
        .game-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .stat-card {
            background: rgba(0, 255, 65, 0.08);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #00ff41; }
        .stat-label { font-size: 0.9em; opacity: 0.8; }
        #gameUpdates { 
            height: 200px; 
            overflow-y: auto; 
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            font-size: 0.9em;
        }
        .search-box {
            width: 100%;
            padding: 10px;
            background: rgba(0, 255, 65, 0.1);
            border: 1px solid #00ff41;
            border-radius: 5px;
            color: #00ff41;
            margin-bottom: 10px;
        }
        .character-selector {
            display: flex;
            gap: 10px;
            margin: 10px 0;
            flex-wrap: wrap;
        }
        .character-btn {
            padding: 5px 10px;
            font-size: 0.8em;
            background: rgba(0, 255, 65, 0.2);
            border: 1px solid #00ff41;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 MASTER INTEGRATION COMMAND CENTER</h1>
            <p>Shadow Layer Search + Cookbook Recipes + Addictive Game Integration</p>
        </div>
        
        <div class="grid">
            <!-- Service Management Panel -->
            <div class="panel">
                <h3>🚀 Service Registry</h3>
                <div id="servicesPanel">
                    <div class="service-status">
                        <span>Shadow Search Engine</span>
                        <span class="status-stopped">●</span>
                        <button onclick="startService('shadow-search')">Start</button>
                    </div>
                    <div class="service-status">
                        <span>Cookbook Organizer</span>
                        <span class="status-stopped">●</span>
                        <button onclick="startService('cookbook-organizer')">Start</button>
                    </div>
                    <div class="service-status">
                        <span>Game Integration Bridge</span>
                        <span class="status-stopped">●</span>
                        <button onclick="startService('game-bridge')">Start</button>
                    </div>
                </div>
                <button onclick="startAllServices()" style="width: 100%; margin-top: 15px;">🚀 Launch All Systems</button>
            </div>

            <!-- Shadow Search Panel -->
            <div class="panel">
                <h3>🔍 Shadow Layer Search</h3>
                <input type="text" id="searchQuery" class="search-box" placeholder="Search project files and documents...">
                <div class="character-selector">
                    <button class="character-btn" onclick="setCharacter('cal')">📊 Cal</button>
                    <button class="character-btn" onclick="setCharacter('arty')">🎨 Arty</button>
                    <button class="character-btn" onclick="setCharacter('ralph')">⚔️ Ralph</button>
                    <button class="character-btn" onclick="setCharacter('vera')">🔬 Vera</button>
                    <button class="character-btn" onclick="setCharacter('paulo')">💼 Paulo</button>
                    <button class="character-btn" onclick="setCharacter('nash')">🎭 Nash</button>
                </div>
                <select id="sortBy" style="width: 100%; padding: 5px; margin-bottom: 10px;">
                    <option value="relevance">Sort by Relevance</option>
                    <option value="new">Sort by New</option>
                    <option value="controversial">Sort by Controversial</option>
                    <option value="trending">Sort by Trending</option>
                </select>
                <button onclick="performSearch()" style="width: 100%;">🔍 Search Shadow Layer</button>
                <div id="searchResults" style="margin-top: 15px; height: 150px; overflow-y: auto;"></div>
            </div>

            <!-- Game State Panel -->
            <div class="panel">
                <h3>🎮 Game State Monitor</h3>
                <div class="game-stats">
                    <div class="stat-card">
                        <div class="stat-number" id="playersOnline">0</div>
                        <div class="stat-label">Players Online</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="activeShips">0</div>
                        <div class="stat-label">Active Ships</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="liquidityTotal">0</div>
                        <div class="stat-label">Total Liquidity</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="judgeScore">0</div>
                        <div class="stat-label">Judge Score</div>
                    </div>
                </div>
                <button onclick="launchExplorerShip()" style="width: 100%; margin-top: 15px;">🚢 Launch Explorer Ship</button>
            </div>

            <!-- Cookbook Panel -->
            <div class="panel">
                <h3>📚 Cookbook & Recipes</h3>
                <div id="cookbookChapters"></div>
                <button onclick="generateRecipe()" style="width: 100%; margin-top: 15px;">📝 Generate New Recipe</button>
            </div>

            <!-- Live Updates Panel -->
            <div class="panel">
                <h3>📡 Live System Updates</h3>
                <div id="gameUpdates"></div>
            </div>

            <!-- Analytics Panel -->
            <div class="panel">
                <h3>📊 System Analytics</h3>
                <div id="analyticsPanel"></div>
                <button onclick="refreshAnalytics()" style="width: 100%; margin-top: 15px;">🔄 Refresh Analytics</button>
            </div>
        </div>
    </div>

    <script>
        let selectedCharacter = 'cal';
        let ws = null;

        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:8889');
            
            ws.onopen = () => {
                console.log('Connected to Master Integration WebSocket');
                addUpdate('🔗 Connected to Master Integration System');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('Disconnected from WebSocket');
                addUpdate('❌ Disconnected from Master Integration System');
                setTimeout(initWebSocket, 5000); // Reconnect after 5 seconds
            };
        }

        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'game_state':
                    updateGameState(data.data);
                    break;
                case 'game_update':
                    addUpdate(\`🎮 \${JSON.stringify(data.data)}\`);
                    updateGameState(data.data);
                    break;
                case 'search_result':
                    displaySearchResults(data.data);
                    break;
            }
        }

        function updateGameState(state) {
            document.getElementById('playersOnline').textContent = state.playersOnline || 0;
            document.getElementById('activeShips').textContent = state.activeShips || 0;
            document.getElementById('liquidityTotal').textContent = Object.keys(state.liquidityPools || {}).length;
            document.getElementById('judgeScore').textContent = Object.keys(state.judgeScores || {}).length;
        }

        function addUpdate(message) {
            const updatesDiv = document.getElementById('gameUpdates');
            const timestamp = new Date().toLocaleTimeString();
            updatesDiv.innerHTML += \`<div>[\${timestamp}] \${message}</div>\`;
            updatesDiv.scrollTop = updatesDiv.scrollHeight;
        }

        async function startService(serviceName) {
            try {
                const response = await fetch(\`/api/services/\${serviceName}/start\`, {
                    method: 'POST'
                });
                const result = await response.json();
                addUpdate(\`🚀 Starting \${serviceName}: \${result.status}\`);
                setTimeout(refreshServices, 1000);
            } catch (error) {
                addUpdate(\`❌ Error starting \${serviceName}: \${error.message}\`);
            }
        }

        async function startAllServices() {
            const services = ['shadow-search', 'cookbook-organizer', 'game-bridge'];
            for (const service of services) {
                await startService(service);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        function setCharacter(character) {
            selectedCharacter = character;
            document.querySelectorAll('.character-btn').forEach(btn => {
                btn.style.background = 'rgba(0, 255, 65, 0.2)';
            });
            event.target.style.background = 'rgba(0, 255, 65, 0.5)';
            addUpdate(\`👤 Selected character: \${character}\`);
        }

        async function performSearch() {
            const query = document.getElementById('searchQuery').value;
            const sortBy = document.getElementById('sortBy').value;
            
            if (!query.trim()) {
                addUpdate('❌ Please enter a search query');
                return;
            }

            try {
                addUpdate(\`🔍 Searching with \${selectedCharacter} for: \${query}\`);
                
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, character: selectedCharacter, sortBy })
                });
                
                const results = await response.json();
                displaySearchResults(results);
                addUpdate(\`✅ Found \${results.results?.length || 0} results\`);
            } catch (error) {
                addUpdate(\`❌ Search error: \${error.message}\`);
            }
        }

        function displaySearchResults(results) {
            const resultsDiv = document.getElementById('searchResults');
            if (results.results && results.results.length > 0) {
                resultsDiv.innerHTML = results.results.slice(0, 5).map(result => 
                    \`<div style="margin: 5px 0; padding: 5px; background: rgba(0,255,65,0.1); border-radius: 3px;">
                        <strong>\${result.file}</strong><br>
                        <small>\${result.affinity}: \${result.score}/10</small>
                    </div>\`
                ).join('');
            } else {
                resultsDiv.innerHTML = '<div>No results found</div>';
            }
        }

        async function launchExplorerShip() {
            try {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'launch_ship',
                        shipType: 'explorer',
                        character: selectedCharacter
                    }));
                    addUpdate(\`🚢 \${selectedCharacter} launched an Explorer Ship!\`);
                }
            } catch (error) {
                addUpdate(\`❌ Ship launch error: \${error.message}\`);
            }
        }

        async function generateRecipe() {
            try {
                addUpdate('📝 Generating new recipe...');
                // This would integrate with cookbook system
                setTimeout(() => {
                    addUpdate(\`📚 New recipe generated for \${selectedCharacter}\`);
                }, 1000);
            } catch (error) {
                addUpdate(\`❌ Recipe generation error: \${error.message}\`);
            }
        }

        async function refreshServices() {
            try {
                const response = await fetch('/api/services');
                const services = await response.json();
                updateServicesPanel(services);
            } catch (error) {
                console.error('Error refreshing services:', error);
            }
        }

        async function refreshAnalytics() {
            try {
                const response = await fetch('/api/analytics');
                const analytics = await response.json();
                updateAnalyticsPanel(analytics);
                addUpdate('📊 Analytics refreshed');
            } catch (error) {
                addUpdate(\`❌ Analytics error: \${error.message}\`);
            }
        }

        function updateServicesPanel(services) {
            // Update service status indicators
            services.forEach(service => {
                const statusSpan = document.querySelector(\`[data-service="\${service.service_name}"] .status\`);
                if (statusSpan) {
                    statusSpan.className = service.status === 'running' ? 'status-running' : 'status-stopped';
                    statusSpan.textContent = '●';
                }
            });
        }

        function updateAnalyticsPanel(analytics) {
            const panel = document.getElementById('analyticsPanel');
            panel.innerHTML = \`
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; color: #00ff41;">\${analytics.services.running}</div>
                        <div style="font-size: 0.8em;">Running Services</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; color: #00ff41;">\${analytics.gameplay.totalSessions}</div>
                        <div style="font-size: 0.8em;">Total Sessions</div>
                    </div>
                </div>
            \`;
        }

        // Initialize everything
        document.addEventListener('DOMContentLoaded', () => {
            initWebSocket();
            refreshServices();
            refreshAnalytics();
            addUpdate('🎮 Master Integration Command Center initialized');
        });
    </script>
</body>
</html>
    `;
  }
    
  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`
🎮 MASTER INTEGRATION LAUNCHER STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Command Center: http://localhost:${this.port}
🔌 WebSocket: ws://localhost:8889
📊 Game State: http://localhost:${this.port}/api/game/state
🔍 Search API: http://localhost:${this.port}/api/search
📚 Cookbook API: http://localhost:${this.port}/api/cookbook
🚀 Services API: http://localhost:${this.port}/api/services

🎯 READY TO LAUNCH:
• Shadow Layer Search System (port 3333)
• Cookbook Recipe Organizer (port 4444)  
• Addictive Game Integration Bridge (port 5555)

🎮 THE GAME BEGINS... KNOWLEDGE IS POWER!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        resolve();
      });
    });
  }
}

// Start the Master Integration Launcher
if (require.main === module) {
  const launcher = new MasterIntegrationLauncher();
  launcher.start().catch(console.error);
}

module.exports = MasterIntegrationLauncher;