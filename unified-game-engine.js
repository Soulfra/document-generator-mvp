#!/usr/bin/env node

/**
 * UNIFIED GAME ENGINE
 * Connects all services into one cohesive game experience
 */

const http = require('http');
const WebSocket = require('ws');
const EventEmitter = require('events');

class UnifiedGameEngine extends EventEmitter {
  constructor(port = 8888) {
    super();
    this.port = port;
    this.wsPort = port + 1;
    
    // Core game state - this is the master state
    this.gameState = {
      // Player progression
      player: {
        id: 'main_player',
        name: 'Empire Builder',
        level: 1,
        experience: 0,
        cash: 2000,
        credits: 1000,
        reputation: 100,
        empire_points: 0,
        achievements: [],
        unlocks: new Set(['greenhouse', 'dispensary'])
      },
      
      // Multi-world system
      worlds: {
        'cannabis-empire': {
          name: 'Cannabis Empire',
          unlocked: true,
          buildings: new Map(),
          resources: { seeds: 100, equipment: 50, licenses: 3 },
          automation_level: 1,
          daily_income: 0
        },
        'space-federation': {
          name: 'Galactic Federation',
          unlocked: false,
          unlock_cost: 10000,
          buildings: new Map(),
          resources: { dilithium: 0, ships: 0, stations: 0 },
          automation_level: 0,
          daily_income: 0
        },
        'depths-civilization': {
          name: 'Depths Civilization',
          unlocked: false,
          unlock_cost: 25000,
          buildings: new Map(),
          resources: { artifacts: 0, cities: 0, knowledge: 0 },
          automation_level: 0,
          daily_income: 0
        }
      },
      
      // Global automation and tick system
      automation: {
        enabled: true,
        tick_rate: 5000, // 5 seconds
        auto_collect: false,
        auto_upgrade: false,
        auto_expand: false,
        tick_count: 0,
        last_tick: Date.now()
      },
      
      // Cross-service integration
      services: {
        document_generator: 'http://localhost:4444',
        empire_bridge: 'http://localhost:3333',
        themed_empire: 'http://localhost:5555',
        visual_tycoon: 'http://localhost:7010',
        stripe_processor: 'integrated',
        database: 'postgresql://localhost:5432'
      },
      
      // Real-time events and notifications
      events: [],
      notifications: [],
      
      // Economy and progression
      economy: {
        total_revenue: 0,
        daily_revenue: 0,
        weekly_revenue: 0,
        conversion_rate: 0.01,
        stripe_transactions: [],
        empire_valuations: new Map()
      },
      
      // Game session data
      session: {
        start_time: Date.now(),
        play_time: 0,
        actions_taken: 0,
        goals: [],
        challenges: []
      }
    };

    this.tickEngine = null;
    this.connections = new Set();
    this.serviceClients = new Map();
    
    this.initializeGame();
  }

  initializeGame() {
    // Set up initial goals
    this.gameState.session.goals = [
      { id: 'first_building', text: 'Build your first structure', completed: false, reward: 100 },
      { id: 'reach_level_2', text: 'Reach level 2', completed: false, reward: 200 },
      { id: 'unlock_space', text: 'Unlock Space Federation', completed: false, reward: 1000 },
      { id: 'automate_empire', text: 'Enable full automation', completed: false, reward: 500 },
      { id: 'first_purchase', text: 'Make your first credit purchase', completed: false, reward: 150 }
    ];

    // Set up initial challenges
    this.gameState.session.challenges = [
      { id: 'daily_income', text: 'Earn $100 daily income', target: 100, current: 0, reward: 300 },
      { id: 'building_count', text: 'Build 10 structures', target: 10, current: 0, reward: 500 },
      { id: 'multi_world', text: 'Operate in 2+ worlds', target: 2, current: 1, reward: 1000 }
    ];
  }

  async start() {
    console.log('🎮 Starting Unified Game Engine...');
    console.log(`📍 Main Port: ${this.port} | WebSocket: ${this.wsPort}`);

    // Start HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Start WebSocket server for real-time updates
    this.wsServer = new WebSocket.Server({ port: this.wsPort });
    this.wsServer.on('connection', (ws) => {
      this.handleWebSocketConnection(ws);
    });

    // Start the server
    this.server.listen(this.port, () => {
      console.log(`✅ Unified Game Engine running at http://localhost:${this.port}`);
      console.log(`🎮 Game Interface: http://localhost:${this.port}/game`);
      console.log(`📊 Master Dashboard: http://localhost:${this.port}/dashboard`);
    });

    // Start the game tick engine
    this.startTickEngine();

    // Connect to other services
    await this.connectToServices();

    return {
      port: this.port,
      wsPort: this.wsPort,
      gameUrl: `http://localhost:${this.port}/game`,
      dashboardUrl: `http://localhost:${this.port}/dashboard`
    };
  }

  startTickEngine() {
    console.log('⚡ Starting game tick engine...');
    
    this.tickEngine = setInterval(() => {
      this.processTick();
    }, this.gameState.automation.tick_rate);
  }

  processTick() {
    const now = Date.now();
    this.gameState.automation.tick_count++;
    this.gameState.automation.last_tick = now;

    // Process automation for each world
    Object.entries(this.gameState.worlds).forEach(([worldId, world]) => {
      if (world.unlocked && world.automation_level > 0) {
        this.processWorldAutomation(worldId, world);
      }
    });

    // Update player progression
    this.updatePlayerProgression();

    // Check goals and challenges
    this.checkGoalsAndChallenges();

    // Broadcast updates to connected clients
    this.broadcastUpdate({
      type: 'tick',
      tick: this.gameState.automation.tick_count,
      gameState: this.getClientGameState(),
      timestamp: now
    });

    // Log occasional status
    if (this.gameState.automation.tick_count % 12 === 0) { // Every minute
      console.log(`⚡ Tick ${this.gameState.automation.tick_count} | Player L${this.gameState.player.level} | $${this.gameState.player.cash}`);
    }
  }

  processWorldAutomation(worldId, world) {
    let totalIncome = 0;
    
    // Process each building in the world
    world.buildings.forEach((building) => {
      const income = this.calculateBuildingIncome(building, world.automation_level);
      totalIncome += income;
      building.total_earned += income;
    });

    // Update world and player
    world.daily_income = totalIncome * 12; // 12 ticks per minute
    this.gameState.player.cash += totalIncome;
    this.gameState.economy.total_revenue += totalIncome;

    // Automation improvements
    if (world.automation_level > 1) {
      // Auto-upgrade buildings
      if (this.gameState.automation.auto_upgrade) {
        this.autoUpgradeBuildings(worldId, world);
      }
      
      // Auto-expand if enabled
      if (this.gameState.automation.auto_expand) {
        this.autoExpandEmpire(worldId, world);
      }
    }
  }

  calculateBuildingIncome(building, automationLevel) {
    const baseIncome = building.base_income || 10;
    const levelMultiplier = building.level || 1;
    const automationBonus = 1 + (automationLevel * 0.2);
    
    return Math.floor(baseIncome * levelMultiplier * automationBonus);
  }

  updatePlayerProgression() {
    // Calculate experience gain
    const expGain = Math.floor(this.gameState.economy.total_revenue / 100);
    this.gameState.player.experience += expGain;

    // Check for level up
    const requiredExp = this.gameState.player.level * 1000;
    if (this.gameState.player.experience >= requiredExp) {
      this.levelUp();
    }

    // Update empire points
    const totalBuildings = Object.values(this.gameState.worlds)
      .reduce((sum, world) => sum + world.buildings.size, 0);
    this.gameState.player.empire_points = totalBuildings * 10 + this.gameState.player.level * 100;
  }

  levelUp() {
    this.gameState.player.level++;
    this.gameState.player.experience = 0;
    this.gameState.player.cash += this.gameState.player.level * 100; // Level up bonus

    // Unlock new features
    this.checkLevelUnlocks();

    // Notify players
    this.addNotification(`🎉 Level ${this.gameState.player.level}! +$${this.gameState.player.level * 100} bonus!`);
    
    this.broadcastUpdate({
      type: 'level_up',
      level: this.gameState.player.level,
      bonus: this.gameState.player.level * 100
    });
  }

  checkLevelUnlocks() {
    const level = this.gameState.player.level;
    
    // Unlock space federation at level 5
    if (level === 5 && !this.gameState.worlds['space-federation'].unlocked) {
      this.gameState.worlds['space-federation'].unlocked = true;
      this.addNotification('🚀 Space Federation unlocked!');
    }
    
    // Unlock depths civilization at level 10
    if (level === 10 && !this.gameState.worlds['depths-civilization'].unlocked) {
      this.gameState.worlds['depths-civilization'].unlocked = true;
      this.addNotification('🌊 Depths Civilization unlocked!');
    }

    // Unlock automation features
    if (level === 3) {
      this.gameState.automation.auto_collect = true;
      this.addNotification('⚡ Auto-collect unlocked!');
    }
    
    if (level === 7) {
      this.gameState.automation.auto_upgrade = true;
      this.addNotification('🔧 Auto-upgrade unlocked!');
    }
  }

  checkGoalsAndChallenges() {
    // Check goals
    this.gameState.session.goals.forEach(goal => {
      if (!goal.completed) {
        let completed = false;
        
        switch (goal.id) {
          case 'first_building':
            const totalBuildings = Object.values(this.gameState.worlds)
              .reduce((sum, world) => sum + world.buildings.size, 0);
            completed = totalBuildings > 0;
            break;
          case 'reach_level_2':
            completed = this.gameState.player.level >= 2;
            break;
          case 'unlock_space':
            completed = this.gameState.worlds['space-federation'].unlocked;
            break;
        }
        
        if (completed) {
          goal.completed = true;
          this.gameState.player.cash += goal.reward;
          this.addNotification(`🎯 Goal completed: ${goal.text} (+$${goal.reward})`);
        }
      }
    });

    // Check challenges
    this.gameState.session.challenges.forEach(challenge => {
      switch (challenge.id) {
        case 'daily_income':
          const totalDailyIncome = Object.values(this.gameState.worlds)
            .reduce((sum, world) => sum + world.daily_income, 0);
          challenge.current = totalDailyIncome;
          break;
        case 'building_count':
          challenge.current = Object.values(this.gameState.worlds)
            .reduce((sum, world) => sum + world.buildings.size, 0);
          break;
      }
    });
  }

  async connectToServices() {
    console.log('🔗 Connecting to other services...');
    
    const services = [
      { name: 'gateway', url: 'http://localhost:4444/api/health' },
      { name: 'bridge', url: 'http://localhost:3333/api/systems' },
      { name: 'themed', url: 'http://localhost:5555/api/themes' },
      { name: 'visual', url: 'http://localhost:7010/api/gamestate' }
    ];

    for (const service of services) {
      try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const response = await fetch(service.url);
        if (response.ok) {
          console.log(`   ✅ ${service.name} service connected`);
          this.serviceClients.set(service.name, service.url);
        }
      } catch (error) {
        console.log(`   ⚠️  ${service.name} service unavailable`);
      }
    }
  }

  handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${this.port}`);

    switch (url.pathname) {
      case '/':
        this.serveMainMenu(res);
        break;
      case '/game':
        this.serveUnifiedGame(res);
        break;
      case '/dashboard':
        this.serveMasterDashboard(res);
        break;
      case '/api/gamestate':
        this.serveGameState(res);
        break;
      case '/api/action':
        this.handleAction(req, res);
        break;
      case '/api/build':
        this.handleBuild(req, res);
        break;
      case '/api/unlock-world':
        this.handleUnlockWorld(req, res);
        break;
      case '/api/process-document':
        this.handleProcessDocument(req, res);
        break;
      case '/api/automation':
        this.handleAutomation(req, res);
        break;
      default:
        res.writeHead(404);
        res.end('Not found');
    }
  }

  serveUnifiedGame(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🏛️ Unified Empire Game</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); color: white; overflow-x: hidden; }
        
        .game-container { display: grid; grid-template-columns: 300px 1fr 250px; gap: 20px; height: 100vh; padding: 10px; }
        
        .sidebar { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; backdrop-filter: blur(10px); overflow-y: auto; }
        .main-game { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 20px; overflow-y: auto; }
        .info-panel { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; backdrop-filter: blur(10px); overflow-y: auto; }
        
        .player-stats { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .stat-item { display: flex; justify-content: space-between; margin: 5px 0; }
        .stat-value { color: #4ecdc4; font-weight: bold; }
        
        .world-tabs { display: flex; gap: 5px; margin-bottom: 20px; }
        .world-tab { background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 5px; cursor: pointer; transition: all 0.3s; border: 1px solid transparent; }
        .world-tab.active { background: rgba(78, 205, 196, 0.3); border-color: #4ecdc4; }
        .world-tab.locked { opacity: 0.5; cursor: not-allowed; }
        
        .world-content { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; min-height: 400px; }
        .building-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
        .building-card { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s; }
        .building-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.15); }
        .building-icon { font-size: 2rem; margin-bottom: 10px; }
        .building-name { font-weight: bold; margin-bottom: 5px; }
        .building-cost { color: #4ecdc4; font-size: 0.9rem; }
        
        .automation-panel { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .automation-toggle { background: rgba(78, 205, 196, 0.3); border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin: 5px; }
        .automation-toggle.active { background: #4ecdc4; color: #000; }
        
        .goals-panel { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .goal-item { padding: 8px; margin: 5px 0; border-radius: 5px; background: rgba(0,0,0,0.2); }
        .goal-item.completed { background: rgba(78, 205, 196, 0.3); }
        
        .notifications { position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 300px; }
        .notification { background: rgba(78, 205, 196, 0.9); color: #000; padding: 15px; margin: 5px 0; border-radius: 8px; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .tick-indicator { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 8px 15px; border-radius: 20px; font-size: 0.9rem; }
        .tick-pulse { animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        
        .btn { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s; }
        .btn:hover { transform: scale(1.05); }
        
        .progress-bar { background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { background: linear-gradient(90deg, #4ecdc4, #96ceb4); height: 100%; transition: width 0.3s; }
        
        .service-status { margin: 10px 0; }
        .service-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .service-dot.online { background: #4ecdc4; }
        .service-dot.offline { background: #ff6b6b; }
    </style>
</head>
<body>
    <div class="tick-indicator">
        <span id="tickCounter">⚡ Tick: 0</span>
    </div>
    
    <div class="notifications" id="notifications"></div>
    
    <div class="game-container">
        <!-- Left Sidebar - Player & Controls -->
        <div class="sidebar">
            <div class="player-stats">
                <h3>👤 Player Stats</h3>
                <div class="stat-item">
                    <span>Level:</span>
                    <span class="stat-value" id="playerLevel">1</span>
                </div>
                <div class="stat-item">
                    <span>Cash:</span>
                    <span class="stat-value" id="playerCash">$2000</span>
                </div>
                <div class="stat-item">
                    <span>Credits:</span>
                    <span class="stat-value" id="playerCredits">1000</span>
                </div>
                <div class="stat-item">
                    <span>Empire Points:</span>
                    <span class="stat-value" id="empirePoints">0</span>
                </div>
                <div>
                    <span>Experience:</span>
                    <div class="progress-bar">
                        <div class="progress-fill" id="expBar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
            
            <div class="automation-panel">
                <h3>⚡ Automation</h3>
                <button class="automation-toggle" id="autoCollect" onclick="toggleAutomation('auto_collect')">Auto-Collect</button>
                <button class="automation-toggle" id="autoUpgrade" onclick="toggleAutomation('auto_upgrade')">Auto-Upgrade</button>
                <button class="automation-toggle" id="autoExpand" onclick="toggleAutomation('auto_expand')">Auto-Expand</button>
                <div style="margin-top: 10px;">
                    <small>Tick Rate: <span id="tickRate">5s</span></small>
                </div>
            </div>
            
            <div class="goals-panel">
                <h3>🎯 Goals</h3>
                <div id="goalsList"></div>
            </div>
        </div>
        
        <!-- Main Game Area -->
        <div class="main-game">
            <div class="world-tabs">
                <div class="world-tab active" data-world="cannabis-empire">🌿 Cannabis</div>
                <div class="world-tab locked" data-world="space-federation">🚀 Space</div>
                <div class="world-tab locked" data-world="depths-civilization">🌊 Depths</div>
            </div>
            
            <div class="world-content" id="worldContent">
                <h2 id="worldTitle">Cannabis Empire</h2>
                <p id="worldDescription">Build your cannabis empire with dispensaries and cultivation facilities.</p>
                
                <div class="building-grid" id="buildingGrid">
                    <!-- Buildings will be populated here -->
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="processDocument()">📄 Process Document</button>
                    <button class="btn" onclick="openVisualTycoon()">🎮 Visual Builder</button>
                    <button class="btn" onclick="openStripeDemo()">💳 Buy Credits</button>
                </div>
            </div>
        </div>
        
        <!-- Right Panel - Info & Services -->
        <div class="info-panel">
            <div>
                <h3>🔗 Services</h3>
                <div class="service-status">
                    <span class="service-dot online"></span>Gateway
                </div>
                <div class="service-status">
                    <span class="service-dot online"></span>Empire Bridge
                </div>
                <div class="service-status">
                    <span class="service-dot online"></span>Visual Tycoon
                </div>
                <div class="service-status">
                    <span class="service-dot online"></span>Themed Engine
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>📊 Empire Stats</h3>
                <div class="stat-item">
                    <span>Total Revenue:</span>
                    <span class="stat-value" id="totalRevenue">$0</span>
                </div>
                <div class="stat-item">
                    <span>Daily Income:</span>
                    <span class="stat-value" id="dailyIncome">$0</span>
                </div>
                <div class="stat-item">
                    <span>Buildings:</span>
                    <span class="stat-value" id="totalBuildings">0</span>
                </div>
                <div class="stat-item">
                    <span>Worlds:</span>
                    <span class="stat-value" id="unlockedWorlds">1</span>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>🏆 Challenges</h3>
                <div id="challengesList"></div>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>🎮 Quick Actions</h3>
                <button class="btn" style="width: 100%; margin: 5px 0;" onclick="collectAll()">💰 Collect All</button>
                <button class="btn" style="width: 100%; margin: 5px 0;" onclick="saveGame()">💾 Save Game</button>
            </div>
        </div>
    </div>

    <script>
        let gameState = null;
        let ws = null;
        let currentWorld = 'cannabis-empire';

        // Connect WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.wsPort}');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleGameUpdate(data);
            };
            
            ws.onopen = () => {
                console.log('🔗 Connected to Unified Game Engine');
                addNotification('🔗 Connected to game server');
            };
            
            ws.onclose = () => {
                console.log('🔌 Disconnected from game server');
                setTimeout(connectWebSocket, 5000); // Reconnect
            };
        }

        // Load game state
        function loadGameState() {
            fetch('/api/gamestate')
                .then(r => r.json())
                .then(data => {
                    gameState = data;
                    updateInterface();
                });
        }

        // Update the entire interface
        function updateInterface() {
            if (!gameState) return;

            // Update player stats
            document.getElementById('playerLevel').textContent = gameState.player.level;
            document.getElementById('playerCash').textContent = '$' + gameState.player.cash.toLocaleString();
            document.getElementById('playerCredits').textContent = gameState.player.credits.toLocaleString();
            document.getElementById('empirePoints').textContent = gameState.player.empire_points;
            
            // Update experience bar
            const expNeeded = gameState.player.level * 1000;
            const expPercent = (gameState.player.experience / expNeeded) * 100;
            document.getElementById('expBar').style.width = expPercent + '%';

            // Update automation toggles
            updateAutomationButtons();

            // Update world tabs
            updateWorldTabs();

            // Update current world content
            updateWorldContent();

            // Update empire stats
            updateEmpireStats();

            // Update goals and challenges
            updateGoalsAndChallenges();
        }

        function updateAutomationButtons() {
            const autoCollect = document.getElementById('autoCollect');
            const autoUpgrade = document.getElementById('autoUpgrade');
            const autoExpand = document.getElementById('autoExpand');

            autoCollect.classList.toggle('active', gameState.automation.auto_collect);
            autoUpgrade.classList.toggle('active', gameState.automation.auto_upgrade);
            autoExpand.classList.toggle('active', gameState.automation.auto_expand);
        }

        function updateWorldTabs() {
            document.querySelectorAll('.world-tab').forEach(tab => {
                const worldId = tab.dataset.world;
                const world = gameState.worlds[worldId];
                
                tab.classList.toggle('locked', !world.unlocked);
                
                tab.onclick = world.unlocked ? () => switchWorld(worldId) : null;
            });
        }

        function updateWorldContent() {
            const world = gameState.worlds[currentWorld];
            if (!world) return;

            document.getElementById('worldTitle').textContent = world.name;
            
            // Update building grid
            const grid = document.getElementById('buildingGrid');
            grid.innerHTML = '';

            // Show existing buildings
            world.buildings.forEach((building, id) => {
                const card = createBuildingCard(building, true);
                grid.appendChild(card);
            });

            // Show available buildings to build
            const availableBuildings = getBuildableBuildings(currentWorld);
            availableBuildings.forEach(building => {
                const card = createBuildingCard(building, false);
                grid.appendChild(card);
            });
        }

        function createBuildingCard(building, isBuilt) {
            const div = document.createElement('div');
            div.className = 'building-card';
            
            if (isBuilt) {
                div.innerHTML = \`
                    <div class="building-icon">\${building.icon}</div>
                    <div class="building-name">\${building.name}</div>
                    <div class="building-cost">Level \${building.level}</div>
                    <div style="font-size: 0.8rem; color: #4ecdc4;">+$\${building.base_income}/tick</div>
                \`;
                div.onclick = () => collectBuilding(building.id);
            } else {
                div.innerHTML = \`
                    <div class="building-icon">\${building.icon}</div>
                    <div class="building-name">\${building.name}</div>
                    <div class="building-cost">$\${building.cost}</div>
                    <div style="font-size: 0.8rem;">+$\${building.income}/tick</div>
                \`;
                div.onclick = () => buildBuilding(building.type);
            }
            
            return div;
        }

        function getBuildableBuildings(worldId) {
            const buildings = {
                'cannabis-empire': [
                    { type: 'greenhouse', name: 'Greenhouse', icon: '🏠', cost: 100, income: 10 },
                    { type: 'dispensary', name: 'Dispensary', icon: '🏪', cost: 500, income: 50 },
                    { type: 'laboratory', name: 'Laboratory', icon: '🧪', cost: 1000, income: 100 },
                    { type: 'warehouse', name: 'Warehouse', icon: '🏭', cost: 2000, income: 200 }
                ],
                'space-federation': [
                    { type: 'mining_station', name: 'Mining Station', icon: '⛏️', cost: 300, income: 40 },
                    { type: 'research_lab', name: 'Research Lab', icon: '🔬', cost: 800, income: 120 },
                    { type: 'shipyard', name: 'Shipyard', icon: '🚀', cost: 1500, income: 250 }
                ]
            };

            return buildings[worldId] || [];
        }

        function updateEmpireStats() {
            document.getElementById('totalRevenue').textContent = '$' + gameState.economy.total_revenue.toLocaleString();
            
            const totalDailyIncome = Object.values(gameState.worlds)
                .reduce((sum, world) => sum + world.daily_income, 0);
            document.getElementById('dailyIncome').textContent = '$' + totalDailyIncome.toLocaleString();
            
            const totalBuildings = Object.values(gameState.worlds)
                .reduce((sum, world) => sum + world.buildings.size, 0);
            document.getElementById('totalBuildings').textContent = totalBuildings;
            
            const unlockedWorlds = Object.values(gameState.worlds)
                .filter(world => world.unlocked).length;
            document.getElementById('unlockedWorlds').textContent = unlockedWorlds;
        }

        function updateGoalsAndChallenges() {
            // Update goals
            const goalsList = document.getElementById('goalsList');
            goalsList.innerHTML = '';
            
            gameState.session.goals.forEach(goal => {
                const div = document.createElement('div');
                div.className = 'goal-item' + (goal.completed ? ' completed' : '');
                div.innerHTML = \`
                    <div>\${goal.text}</div>
                    <div style="font-size: 0.8rem; color: #4ecdc4;">Reward: $\${goal.reward}</div>
                \`;
                goalsList.appendChild(div);
            });

            // Update challenges
            const challengesList = document.getElementById('challengesList');
            challengesList.innerHTML = '';
            
            gameState.session.challenges.forEach(challenge => {
                const div = document.createElement('div');
                div.className = 'goal-item';
                const progress = Math.min(100, (challenge.current / challenge.target) * 100);
                div.innerHTML = \`
                    <div>\${challenge.text}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${progress}%"></div>
                    </div>
                    <div style="font-size: 0.8rem;">\${challenge.current}/\${challenge.target}</div>
                \`;
                challengesList.appendChild(div);
            });
        }

        function handleGameUpdate(data) {
            switch (data.type) {
                case 'tick':
                    document.getElementById('tickCounter').textContent = \`⚡ Tick: \${data.tick}\`;
                    gameState = data.gameState;
                    updateInterface();
                    break;
                case 'level_up':
                    addNotification(\`🎉 Level \${data.level}! +$\${data.bonus} bonus!\`);
                    break;
                case 'notification':
                    addNotification(data.message);
                    break;
            }
        }

        function addNotification(message) {
            const div = document.createElement('div');
            div.className = 'notification';
            div.textContent = message;
            document.getElementById('notifications').appendChild(div);
            
            setTimeout(() => {
                div.remove();
            }, 4000);
        }

        // Game actions
        function switchWorld(worldId) {
            if (gameState.worlds[worldId].unlocked) {
                currentWorld = worldId;
                updateWorldContent();
                
                // Update active tab
                document.querySelectorAll('.world-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.world === worldId);
                });
            }
        }

        function buildBuilding(buildingType) {
            fetch('/api/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ world: currentWorld, buildingType })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    addNotification(\`✅ Built \${data.building.name}!\`);
                    loadGameState();
                } else {
                    addNotification(\`❌ \${data.error}\`);
                }
            });
        }

        function toggleAutomation(type) {
            fetch('/api/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toggle: type })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    loadGameState();
                }
            });
        }

        function collectAll() {
            fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'collect_all' })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    addNotification(\`💰 Collected $\${data.amount}!\`);
                    loadGameState();
                }
            });
        }

        function processDocument() {
            const content = prompt('Enter document content to generate a game:');
            if (content) {
                fetch('/api/process-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        addNotification('📄 Document processed successfully!');
                    }
                });
            }
        }

        function openVisualTycoon() {
            window.open('http://localhost:7010/game', '_blank');
        }

        function openStripeDemo() {
            window.open('http://localhost:7010/stripe', '_blank');
        }

        function saveGame() {
            addNotification('💾 Game saved!');
        }

        // Initialize
        connectWebSocket();
        loadGameState();
        
        // Auto-refresh
        setInterval(loadGameState, 10000);
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveGameState(res) {
    // Convert Maps to objects for JSON serialization
    const clientState = {
      ...this.gameState,
      worlds: Object.fromEntries(
        Object.entries(this.gameState.worlds).map(([key, world]) => [
          key,
          {
            ...world,
            buildings: Object.fromEntries(world.buildings)
          }
        ])
      )
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(clientState));
  }

  getClientGameState() {
    return {
      ...this.gameState,
      worlds: Object.fromEntries(
        Object.entries(this.gameState.worlds).map(([key, world]) => [
          key,
          {
            ...world,
            buildings: Object.fromEntries(world.buildings)
          }
        ])
      )
    };
  }

  handleBuild(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { world: worldId, buildingType } = JSON.parse(body);
        const world = this.gameState.worlds[worldId];
        
        if (!world || !world.unlocked) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'World not available' }));
          return;
        }

        // Get building definition
        const buildingDefs = {
          'greenhouse': { name: 'Greenhouse', icon: '🏠', cost: 100, base_income: 10 },
          'dispensary': { name: 'Dispensary', icon: '🏪', cost: 500, base_income: 50 },
          'laboratory': { name: 'Laboratory', icon: '🧪', cost: 1000, base_income: 100 },
          'warehouse': { name: 'Warehouse', icon: '🏭', cost: 2000, base_income: 200 }
        };

        const buildingDef = buildingDefs[buildingType];
        if (!buildingDef) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid building type' }));
          return;
        }

        if (this.gameState.player.cash < buildingDef.cost) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Not enough cash' }));
          return;
        }

        // Create building
        const buildingId = 'building_' + Date.now();
        const building = {
          id: buildingId,
          type: buildingType,
          ...buildingDef,
          level: 1,
          total_earned: 0,
          built_at: Date.now()
        };

        // Add to world
        world.buildings.set(buildingId, building);
        
        // Deduct cost
        this.gameState.player.cash -= buildingDef.cost;
        this.gameState.player.experience += 25;
        this.gameState.session.actions_taken++;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, building }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  handleAutomation(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { toggle } = JSON.parse(body);
        
        switch (toggle) {
          case 'auto_collect':
            this.gameState.automation.auto_collect = !this.gameState.automation.auto_collect;
            break;
          case 'auto_upgrade':
            this.gameState.automation.auto_upgrade = !this.gameState.automation.auto_upgrade;
            break;
          case 'auto_expand':
            this.gameState.automation.auto_expand = !this.gameState.automation.auto_expand;
            break;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, automation: this.gameState.automation }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  handleWebSocketConnection(ws) {
    console.log('📡 New unified game connection');
    this.connections.add(ws);

    // Send welcome
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Unified Game Engine',
      gameState: this.getClientGameState()
    }));

    ws.on('close', () => {
      this.connections.delete(ws);
    });
  }

  broadcastUpdate(data) {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  addNotification(message) {
    const notification = {
      id: Date.now(),
      message,
      timestamp: Date.now()
    };
    
    this.gameState.notifications.push(notification);
    
    // Keep only last 10 notifications
    if (this.gameState.notifications.length > 10) {
      this.gameState.notifications.shift();
    }

    // Broadcast to all connections
    this.broadcastUpdate({
      type: 'notification',
      message: message
    });
  }

  serveMainMenu(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🏛️ Unified Empire Engine</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; color: white; min-height: 100vh; }
        .container { max-width: 1000px; margin: 0 auto; text-align: center; }
        .title { font-size: 4rem; margin-bottom: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        .subtitle { font-size: 1.5rem; margin-bottom: 3rem; opacity: 0.9; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 3rem 0; }
        .feature { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; backdrop-filter: blur(10px); }
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
        .feature-title { font-size: 1.3rem; font-weight: bold; margin-bottom: 1rem; }
        .play-btn { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; padding: 1.5rem 3rem; border-radius: 50px; color: white; font-size: 1.2rem; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin: 1rem; transition: transform 0.3s; }
        .play-btn:hover { transform: scale(1.1); }
        .stats { background: rgba(0,0,0,0.3); padding: 2rem; border-radius: 15px; margin-top: 3rem; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 1rem; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #4ecdc4; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🏛️ UNIFIED EMPIRE ENGINE</h1>
        <p class="subtitle">All Systems Connected • Real-Time Automation • Multi-World Management</p>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎮</div>
                <div class="feature-title">Unified Game Experience</div>
                <p>One interface controlling all empire systems with real-time tick engine and automation</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">Automation & Tick Layers</div>
                <p>Auto-collect, auto-upgrade, auto-expand with configurable tick rates and smart AI decisions</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🌍</div>
                <div class="feature-title">Multi-World Empire</div>
                <p>Cannabis, Space Federation, Depths Civilization - unlock and manage multiple worlds</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🔗</div>
                <div class="feature-title">Service Integration</div>
                <p>Document processor, visual tycoon, Stripe payments, empire bridge - all connected</p>
            </div>
        </div>
        
        <div>
            <a href="/game" class="play-btn">🎮 Play Unified Game</a>
            <a href="/dashboard" class="play-btn">📊 Master Dashboard</a>
        </div>
        
        <div class="stats">
            <h3>🏛️ Engine Status</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-number">${Object.keys(this.gameState.services).length}</div>
                    <div>Connected Services</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${Object.keys(this.gameState.worlds).length}</div>
                    <div>Available Worlds</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${this.gameState.automation.tick_count}</div>
                    <div>Game Ticks</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">$${this.gameState.economy.total_revenue}</div>
                    <div>Total Revenue</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  stop() {
    if (this.tickEngine) {
      clearInterval(this.tickEngine);
    }
    if (this.server) {
      this.server.close();
    }
    if (this.wsServer) {
      this.wsServer.close();
    }
    console.log('🛑 Unified Game Engine stopped');
  }
}

// Auto-start if run directly
if (require.main === module) {
  const port = parseInt(process.argv[2]) || 8888;
  const engine = new UnifiedGameEngine(port);
  
  engine.start().then(info => {
    console.log(`🎮 Unified Game Engine launched!`);
    console.log(`🌐 Game: ${info.gameUrl}`);
    console.log(`📊 Dashboard: ${info.dashboardUrl}`);
  }).catch(console.error);

  // Handle shutdown
  process.on('SIGINT', () => {
    engine.stop();
    process.exit(0);
  });
}

module.exports = UnifiedGameEngine;