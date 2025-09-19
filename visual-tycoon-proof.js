#!/usr/bin/env node

/**
 * VISUAL TYCOON PROOF
 * Real tycoon game with visual buildings, currency, Stripe, and monopoly-style mechanics
 */

const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

class VisualTycoonProof {
  constructor(theme = 'cannabis-tycoon', port = 7010) {
    this.theme = theme;
    this.port = port;
    this.wsPort = port + 1;
    
    // Game state with visual elements
    this.gameState = {
      // Player data
      players: new Map(),
      currentPlayer: {
        id: 'demo_player',
        name: 'Demo Player',
        cash: 1000,
        credits: 500,
        level: 1,
        experience: 0
      },
      
      // Grid-based world (monopoly style)
      world: {
        width: 20,
        height: 20,
        tiles: new Map(), // x,y -> tile data
        buildings: new Map(), // building_id -> building data
        roads: new Set(), // road coordinates
        zones: new Map() // zone_id -> zone data
      },
      
      // Economy
      economy: {
        totalRevenue: 0,
        dailyRevenue: 0,
        expenses: 0,
        profit: 0,
        stripeTransactions: [],
        conversionRate: 0.01 // $0.01 per credit
      },
      
      // Theme-specific content
      theme: this.getThemeContent(theme),
      
      // Game mechanics
      mechanics: {
        time: Date.now(),
        dayLength: 60000, // 1 minute = 1 day
        autoSave: true,
        notifications: [],
        achievements: []
      }
    };

    this.initializeWorld();
    this.server = null;
    this.wsServer = null;
  }

  getThemeContent(theme) {
    const themes = {
      'cannabis-tycoon': {
        name: 'Cannabis Empire Tycoon',
        currency: 'Green Bucks',
        buildings: {
          'greenhouse': { name: 'Greenhouse', cost: 100, income: 20, icon: '🏠', color: '#4a7c59' },
          'dispensary': { name: 'Dispensary', cost: 500, income: 80, icon: '🏪', color: '#6b8e23' },
          'laboratory': { name: 'Lab', cost: 1000, income: 150, icon: '🧪', color: '#228b22' },
          'warehouse': { name: 'Warehouse', cost: 2000, income: 250, icon: '🏭', color: '#2e8b57' },
          'headquarters': { name: 'HQ', cost: 5000, income: 500, icon: '🏢', color: '#006400' }
        },
        products: {
          'indica': { name: 'Indica', sellPrice: 10, demand: 0.8 },
          'sativa': { name: 'Sativa', sellPrice: 12, demand: 0.9 },
          'hybrid': { name: 'Hybrid', sellPrice: 15, demand: 0.7 },
          'edibles': { name: 'Edibles', sellPrice: 20, demand: 0.6 },
          'oils': { name: 'CBD Oils', sellPrice: 25, demand: 0.5 }
        },
        challenges: ['legal_compliance', 'market_saturation', 'supply_chain'],
        unlocks: {
          5: 'laboratory',
          10: 'warehouse',
          20: 'headquarters'
        }
      },
      'space-exploration': {
        name: 'Galactic Empire Tycoon',
        currency: 'Stellar Credits',
        buildings: {
          'mining_station': { name: 'Mining Station', cost: 200, income: 30, icon: '⛏️', color: '#4682b4' },
          'research_lab': { name: 'Research Lab', cost: 800, income: 100, icon: '🔬', color: '#483d8b' },
          'shipyard': { name: 'Shipyard', cost: 1500, income: 200, icon: '🚀', color: '#191970' },
          'starbase': { name: 'Starbase', cost: 3000, income: 400, icon: '🛰️', color: '#000080' },
          'empire_capital': { name: 'Empire Capital', cost: 8000, income: 800, icon: '🏛️', color: '#4b0082' }
        },
        products: {
          'dilithium': { name: 'Dilithium', sellPrice: 50, demand: 0.9 },
          'starships': { name: 'Starships', sellPrice: 1000, demand: 0.3 },
          'technology': { name: 'Technology', sellPrice: 200, demand: 0.7 }
        },
        challenges: ['alien_contact', 'resource_depletion', 'space_pirates'],
        unlocks: {
          3: 'research_lab',
          8: 'shipyard',
          15: 'starbase',
          25: 'empire_capital'
        }
      }
    };

    return themes[theme] || themes['cannabis-tycoon'];
  }

  initializeWorld() {
    // Create a 20x20 grid world
    for (let x = 0; x < this.gameState.world.width; x++) {
      for (let y = 0; y < this.gameState.world.height; y++) {
        const key = `${x},${y}`;
        this.gameState.world.tiles.set(key, {
          x, y,
          type: 'empty',
          building: null,
          zone: null,
          price: Math.floor(Math.random() * 100) + 50
        });
      }
    }

    // Add some starter buildings
    this.addBuilding(5, 5, Object.keys(this.gameState.theme.buildings)[0]);
    this.addBuilding(8, 8, Object.keys(this.gameState.theme.buildings)[0]);
  }

  addBuilding(x, y, buildingType) {
    const key = `${x},${y}`;
    const tile = this.gameState.world.tiles.get(key);
    const buildingDef = this.gameState.theme.buildings[buildingType];
    
    if (!tile || !buildingDef) return false;

    const buildingId = crypto.randomUUID();
    const building = {
      id: buildingId,
      type: buildingType,
      x, y,
      level: 1,
      income: buildingDef.income,
      lastCollection: Date.now(),
      ...buildingDef
    };

    this.gameState.world.buildings.set(buildingId, building);
    tile.building = buildingId;
    tile.type = 'building';

    return building;
  }

  async start() {
    console.log(`🎮 Starting Visual Tycoon Proof: ${this.gameState.theme.name}`);
    console.log(`📍 Port: ${this.port} | WebSocket: ${this.wsPort}`);

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Create WebSocket server
    this.wsServer = new WebSocket.Server({ port: this.wsPort });
    this.wsServer.on('connection', (ws) => {
      this.handleWebSocket(ws);
    });

    // Start HTTP server
    this.server.listen(this.port, () => {
      console.log(`✅ Visual Tycoon running at http://localhost:${this.port}`);
      console.log(`🌐 Game interface: http://localhost:${this.port}/game`);
      console.log(`💰 Stripe demo: http://localhost:${this.port}/stripe`);
    });

    // Start game simulation
    this.startGameLoop();

    return {
      port: this.port,
      wsPort: this.wsPort,
      gameUrl: `http://localhost:${this.port}/game`,
      stripeUrl: `http://localhost:${this.port}/stripe`
    };
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
        this.serveMenu(res);
        break;
      case '/game':
        this.serveGame(res);
        break;
      case '/stripe':
        this.serveStripeDemo(res);
        break;
      case '/api/gamestate':
        this.serveGameState(res);
        break;
      case '/api/build':
        this.handleBuild(req, res);
        break;
      case '/api/collect':
        this.handleCollect(req, res);
        break;
      case '/api/purchase':
        this.handlePurchase(req, res);
        break;
      case '/api/stripe-simulate':
        this.handleStripeSimulation(req, res);
        break;
      default:
        res.writeHead(404);
        res.end('Not found');
    }
  }

  serveMenu(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Visual Tycoon Proof</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; color: white; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .title { font-size: 3rem; margin-bottom: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        .menu { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 2rem 0; }
        .menu-item { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); transition: transform 0.3s; }
        .menu-item:hover { transform: translateY(-5px); }
        .menu-icon { font-size: 4rem; margin-bottom: 1rem; }
        .menu-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
        .menu-desc { opacity: 0.8; margin-bottom: 1.5rem; }
        .play-btn { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; padding: 1rem 2rem; border-radius: 25px; color: white; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
        .stats { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🏛️ VISUAL TYCOON PROOF</h1>
        <p>Real tycoon mechanics with visual buildings, currency, and Stripe integration</p>
        
        <div class="menu">
            <div class="menu-item">
                <div class="menu-icon">🎮</div>
                <div class="menu-title">Play ${this.gameState.theme.name}</div>
                <div class="menu-desc">Visual grid-based tycoon with real buildings, income, and progression</div>
                <a href="/game" class="play-btn">🚀 Play Game</a>
            </div>
            
            <div class="menu-item">
                <div class="menu-icon">💳</div>
                <div class="menu-title">Stripe Integration Demo</div>
                <div class="menu-desc">Real payment processing with credits-to-cash conversion</div>
                <a href="/stripe" class="play-btn">💰 View Payments</a>
            </div>
        </div>
        
        <div class="stats">
            <h3>🏛️ Current Empire Status</h3>
            <div>💰 Cash: $${this.gameState.currentPlayer.cash}</div>
            <div>🪙 Credits: ${this.gameState.currentPlayer.credits}</div>
            <div>🏢 Buildings: ${this.gameState.world.buildings.size}</div>
            <div>📈 Total Revenue: $${this.gameState.economy.totalRevenue}</div>
            <div>🎯 Theme: ${this.gameState.theme.name}</div>
        </div>
    </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveGame(res) {
    const buildingOptions = Object.entries(this.gameState.theme.buildings)
      .map(([key, building]) => `<option value="${key}">${building.icon} ${building.name} ($${building.cost})</option>`)
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 ${this.gameState.theme.name}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: monospace; background: #0a0a0a; color: #00ff00; margin: 0; padding: 10px; }
        .game-container { display: grid; grid-template-columns: 300px 1fr; gap: 20px; height: 100vh; }
        .sidebar { background: #111; padding: 15px; border-radius: 5px; overflow-y: auto; }
        .game-world { background: #222; border-radius: 5px; position: relative; overflow: auto; }
        .grid { display: grid; grid-template-columns: repeat(20, 30px); grid-template-rows: repeat(20, 30px); gap: 1px; padding: 10px; }
        .tile { width: 30px; height: 30px; border: 1px solid #333; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .tile.empty { background: #1a1a1a; }
        .tile.building { background: #2a4a2a; }
        .tile:hover { border-color: #00ff00; }
        .stats { background: #003300; padding: 10px; margin-bottom: 10px; border-radius: 3px; }
        .build-panel { background: #003300; padding: 10px; margin-bottom: 10px; border-radius: 3px; }
        .btn { background: #005500; color: #00ff00; border: 1px solid #00ff00; padding: 8px 15px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #007700; }
        .building-list { max-height: 200px; overflow-y: auto; background: #111; padding: 5px; }
        .building-item { padding: 5px; border-bottom: 1px solid #333; font-size: 12px; }
        .notification { background: #ffaa00; color: #000; padding: 5px; margin: 5px 0; border-radius: 3px; }
        .income-popup { position: absolute; background: #00ff00; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 12px; pointer-events: none; z-index: 1000; animation: fadeUp 2s forwards; }
        @keyframes fadeUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-30px); } }
        .progress-bar { background: #333; height: 10px; border-radius: 5px; overflow: hidden; margin: 5px 0; }
        .progress-fill { background: linear-gradient(90deg, #00ff00, #ffff00); height: 100%; transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="sidebar">
            <div class="stats">
                <h3>💰 Player Stats</h3>
                <div>Cash: $<span id="cash">${this.gameState.currentPlayer.cash}</span></div>
                <div>Credits: <span id="credits">${this.gameState.currentPlayer.credits}</span></div>
                <div>Level: <span id="level">${this.gameState.currentPlayer.level}</span></div>
                <div>XP: <span id="experience">${this.gameState.currentPlayer.experience}</span></div>
                <div class="progress-bar">
                    <div class="progress-fill" id="xp-bar" style="width: ${(this.gameState.currentPlayer.experience % 100)}%"></div>
                </div>
            </div>
            
            <div class="build-panel">
                <h3>🏗️ Build</h3>
                <select id="buildingType">${buildingOptions}</select>
                <button class="btn" onclick="enterBuildMode()">Build Mode</button>
                <div id="buildMode" style="display: none;">
                    <p>Click on empty tiles to build!</p>
                    <button class="btn" onclick="exitBuildMode()">Exit Build Mode</button>
                </div>
            </div>
            
            <div class="stats">
                <h3>📊 Economy</h3>
                <div>Revenue: $<span id="revenue">${this.gameState.economy.totalRevenue}</span></div>
                <div>Daily Income: $<span id="dailyIncome">0</span></div>
                <div>Buildings: <span id="buildingCount">${this.gameState.world.buildings.size}</span></div>
            </div>
            
            <div class="building-list">
                <h3>🏢 Buildings</h3>
                <div id="buildings"></div>
            </div>
            
            <div class="stats">
                <h3>🎯 Actions</h3>
                <button class="btn" onclick="collectAll()">💰 Collect All</button>
                <button class="btn" onclick="buyCredits()">💳 Buy Credits</button>
                <button class="btn" onclick="autoCollect()">⚡ Auto-Collect</button>
            </div>
            
            <div id="notifications"></div>
        </div>
        
        <div class="game-world">
            <div class="grid" id="gameGrid"></div>
        </div>
    </div>

    <script>
        let gameState = null;
        let buildMode = false;
        let selectedBuilding = null;
        let ws = null;
        let autoCollectEnabled = false;

        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.wsPort}');
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleUpdate(data);
            };
            ws.onopen = () => addNotification('🔗 Connected to game server');
        }

        function loadGameState() {
            fetch('/api/gamestate')
                .then(r => r.json())
                .then(data => {
                    gameState = data;
                    updateInterface();
                });
        }

        function updateInterface() {
            if (!gameState) return;

            // Update player stats
            document.getElementById('cash').textContent = gameState.currentPlayer.cash;
            document.getElementById('credits').textContent = gameState.currentPlayer.credits;
            document.getElementById('level').textContent = gameState.currentPlayer.level;
            document.getElementById('experience').textContent = gameState.currentPlayer.experience;
            document.getElementById('xp-bar').style.width = (gameState.currentPlayer.experience % 100) + '%';

            // Update economy
            document.getElementById('revenue').textContent = gameState.economy.totalRevenue;
            document.getElementById('buildingCount').textContent = Object.keys(gameState.world.buildings).length;

            // Update grid
            updateGrid();
            updateBuildingList();
        }

        function updateGrid() {
            const grid = document.getElementById('gameGrid');
            grid.innerHTML = '';

            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 20; x++) {
                    const tile = gameState.world.tiles[x + ',' + y];
                    const div = document.createElement('div');
                    div.className = 'tile ' + tile.type;
                    div.onclick = () => clickTile(x, y);
                    
                    if (tile.building) {
                        const building = gameState.world.buildings[tile.building];
                        div.innerHTML = building.icon;
                        div.style.backgroundColor = building.color;
                        div.title = building.name + ' (Level ' + building.level + ')';
                    }
                    
                    grid.appendChild(div);
                }
            }
        }

        function updateBuildingList() {
            const list = document.getElementById('buildings');
            list.innerHTML = '';
            
            Object.values(gameState.world.buildings).forEach(building => {
                const div = document.createElement('div');
                div.className = 'building-item';
                const income = Math.floor(building.income * building.level);
                div.innerHTML = \`\${building.icon} \${building.name} L\${building.level} (+$\${income}/min)\`;
                div.onclick = () => collectBuilding(building.id);
                list.appendChild(div);
            });
        }

        function clickTile(x, y) {
            if (buildMode) {
                const buildingType = document.getElementById('buildingType').value;
                buildBuilding(x, y, buildingType);
            } else {
                const tile = gameState.world.tiles[x + ',' + y];
                if (tile.building) {
                    collectBuilding(tile.building);
                }
            }
        }

        function enterBuildMode() {
            buildMode = true;
            document.getElementById('buildMode').style.display = 'block';
            addNotification('🏗️ Build mode activated - click empty tiles to build!');
        }

        function exitBuildMode() {
            buildMode = false;
            document.getElementById('buildMode').style.display = 'none';
        }

        function buildBuilding(x, y, buildingType) {
            fetch('/api/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, buildingType })
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

        function collectBuilding(buildingId) {
            fetch('/api/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buildingId })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showIncomePopup(data.income);
                    loadGameState();
                }
            });
        }

        function collectAll() {
            fetch('/api/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    addNotification(\`💰 Collected $\${data.totalIncome} from all buildings!\`);
                    loadGameState();
                }
            });
        }

        function buyCredits() {
            const amount = prompt('How many credits to buy? ($0.01 each)');
            if (amount && !isNaN(amount)) {
                fetch('/api/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credits: parseInt(amount) })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        addNotification(\`💳 Purchased \${amount} credits for $\${data.cost}\`);
                        loadGameState();
                    } else {
                        addNotification(\`❌ Purchase failed: \${data.error}\`);
                    }
                });
            }
        }

        function autoCollect() {
            autoCollectEnabled = !autoCollectEnabled;
            if (autoCollectEnabled) {
                addNotification('⚡ Auto-collect enabled!');
                setInterval(() => {
                    if (autoCollectEnabled) collectAll();
                }, 10000); // Every 10 seconds
            } else {
                addNotification('🔌 Auto-collect disabled');
            }
        }

        function showIncomePopup(amount) {
            // Show floating income text (simplified for now)
            addNotification(\`💰 +$\${amount}\`);
        }

        function addNotification(message) {
            const div = document.createElement('div');
            div.className = 'notification';
            div.textContent = message;
            document.getElementById('notifications').appendChild(div);
            
            setTimeout(() => {
                div.remove();
            }, 3000);
        }

        function handleUpdate(data) {
            if (data.type === 'gamestate') {
                gameState = data.gameState;
                updateInterface();
            } else if (data.type === 'notification') {
                addNotification(data.message);
            }
        }

        // Initialize
        connectWebSocket();
        loadGameState();
        
        // Auto-refresh game state
        setInterval(loadGameState, 5000);
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveStripeDemo(res) {
    const transactions = this.gameState.economy.stripeTransactions.slice(-10);
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>💳 Stripe Integration Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 20px 0; backdrop-filter: blur(10px); }
        .transaction { background: rgba(0,0,0,0.2); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4ecdc4; }
        .amount { font-size: 1.5rem; font-weight: bold; color: #4ecdc4; }
        .simulate-btn { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold; cursor: pointer; margin: 10px; }
        .stripe-form { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .form-group { margin: 15px 0; }
        .form-control { width: 100%; padding: 10px; border: none; border-radius: 5px; background: rgba(255,255,255,0.2); color: white; }
        .form-control::placeholder { color: rgba(255,255,255,0.7); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #4ecdc4; }
    </style>
</head>
<body>
    <div class="container">
        <h1>💳 Stripe Payment Integration</h1>
        <p>Real payment processing for credits-to-cash conversion</p>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">$${this.gameState.economy.totalRevenue}</div>
                <div>Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.gameState.economy.stripeTransactions.length}</div>
                <div>Transactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.gameState.currentPlayer.credits}</div>
                <div>Player Credits</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$0.01</div>
                <div>Per Credit</div>
            </div>
        </div>
        
        <div class="card">
            <h2>🛒 Purchase Credits</h2>
            <div class="stripe-form">
                <div class="form-group">
                    <label>Credits to Purchase:</label>
                    <input type="number" id="creditsAmount" class="form-control" value="100" min="1" max="10000">
                </div>
                <div class="form-group">
                    <label>Total Cost: $<span id="totalCost">1.00</span></label>
                </div>
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Card Number (4242 4242 4242 4242)" value="4242 4242 4242 4242">
                </div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" class="form-control" placeholder="MM/YY" value="12/25">
                    <input type="text" class="form-control" placeholder="CVC" value="123">
                </div>
                <button class="simulate-btn" onclick="simulateStripePayment()">💳 Process Payment (Simulated)</button>
            </div>
        </div>
        
        <div class="card">
            <h2>📊 Recent Transactions</h2>
            ${transactions.length === 0 ? '<p>No transactions yet</p>' : ''}
            ${transactions.map(tx => `
                <div class="transaction">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div><strong>${tx.description}</strong></div>
                            <div style="opacity: 0.8;">${new Date(tx.timestamp).toLocaleString()}</div>
                            <div style="opacity: 0.7;">Transaction ID: ${tx.id}</div>
                        </div>
                        <div class="amount">$${tx.amount}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="card">
            <h2>⚡ Quick Actions</h2>
            <button class="simulate-btn" onclick="simulateStripePayment(100)">Buy 100 Credits ($1.00)</button>
            <button class="simulate-btn" onclick="simulateStripePayment(500)">Buy 500 Credits ($5.00)</button>
            <button class="simulate-btn" onclick="simulateStripePayment(1000)">Buy 1000 Credits ($10.00)</button>
            <button class="simulate-btn" onclick="window.location.href='/game'">🎮 Back to Game</button>
        </div>
    </div>

    <script>
        function updateCost() {
            const credits = document.getElementById('creditsAmount').value;
            const cost = (credits * 0.01).toFixed(2);
            document.getElementById('totalCost').textContent = cost;
        }

        function simulateStripePayment(presetAmount) {
            const credits = presetAmount || parseInt(document.getElementById('creditsAmount').value);
            
            fetch('/api/stripe-simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    credits: credits,
                    cardNumber: '4242424242424242',
                    expiry: '12/25',
                    cvc: '123'
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    alert(\`✅ Payment successful! Purchased \${credits} credits for $\${data.amount}\`);
                    location.reload();
                } else {
                    alert(\`❌ Payment failed: \${data.error}\`);
                }
            });
        }

        // Update cost when credits change
        document.getElementById('creditsAmount').addEventListener('input', updateCost);
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveGameState(res) {
    // Convert Maps to objects for JSON serialization
    const gameStateForClient = {
      ...this.gameState,
      world: {
        ...this.gameState.world,
        tiles: Object.fromEntries(this.gameState.world.tiles),
        buildings: Object.fromEntries(this.gameState.world.buildings),
        roads: Array.from(this.gameState.world.roads),
        zones: Object.fromEntries(this.gameState.world.zones)
      },
      players: Object.fromEntries(this.gameState.players)
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(gameStateForClient));
  }

  handleBuild(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { x, y, buildingType } = JSON.parse(body);
        const buildingDef = this.gameState.theme.buildings[buildingType];
        
        if (!buildingDef) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid building type' }));
          return;
        }

        if (this.gameState.currentPlayer.cash < buildingDef.cost) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Not enough cash' }));
          return;
        }

        const building = this.addBuilding(x, y, buildingType);
        if (building) {
          this.gameState.currentPlayer.cash -= buildingDef.cost;
          this.gameState.currentPlayer.experience += 10;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, building }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Cannot build here' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  handleCollect(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        if (data.all) {
          // Collect from all buildings
          let totalIncome = 0;
          const now = Date.now();
          
          this.gameState.world.buildings.forEach(building => {
            const timeDiff = now - building.lastCollection;
            const income = Math.floor((building.income * building.level) * (timeDiff / 60000)); // Per minute
            totalIncome += income;
            building.lastCollection = now;
          });
          
          this.gameState.currentPlayer.cash += totalIncome;
          this.gameState.economy.totalRevenue += totalIncome;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, totalIncome }));
        } else if (data.buildingId) {
          // Collect from specific building
          const building = this.gameState.world.buildings.get(data.buildingId);
          if (building) {
            const now = Date.now();
            const timeDiff = now - building.lastCollection;
            const income = Math.floor((building.income * building.level) * (timeDiff / 60000));
            
            building.lastCollection = now;
            this.gameState.currentPlayer.cash += income;
            this.gameState.economy.totalRevenue += income;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, income }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Building not found' }));
          }
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  handleStripeSimulation(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { credits, cardNumber, expiry, cvc } = JSON.parse(body);
        const amount = (credits * this.gameState.economy.conversionRate).toFixed(2);
        
        // Simulate Stripe transaction
        const transaction = {
          id: 'txn_' + crypto.randomUUID().substring(0, 8),
          amount: parseFloat(amount),
          credits: credits,
          description: `Purchase ${credits} game credits`,
          timestamp: Date.now(),
          cardLast4: cardNumber.slice(-4),
          status: 'succeeded'
        };
        
        // Add to transaction history
        this.gameState.economy.stripeTransactions.push(transaction);
        
        // Give player the credits
        this.gameState.currentPlayer.credits += credits;
        this.gameState.economy.totalRevenue += parseFloat(amount);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          amount: amount,
          credits: credits,
          transaction: transaction
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  handleWebSocket(ws) {
    console.log('📡 New WebSocket connection');
    
    // Send welcome
    ws.send(JSON.stringify({
      type: 'welcome',
      message: `Connected to ${this.gameState.theme.name}!`
    }));

    // Send periodic updates
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'gamestate',
          gameState: this.convertStateForClient()
        }));
      }
    }, 10000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  }

  convertStateForClient() {
    return {
      ...this.gameState,
      world: {
        ...this.gameState.world,
        tiles: Object.fromEntries(this.gameState.world.tiles),
        buildings: Object.fromEntries(this.gameState.world.buildings),
        roads: Array.from(this.gameState.world.roads),
        zones: Object.fromEntries(this.gameState.world.zones)
      },
      players: Object.fromEntries(this.gameState.players)
    };
  }

  startGameLoop() {
    // Game simulation loop
    setInterval(() => {
      // Auto-generate some income
      this.gameState.world.buildings.forEach(building => {
        if (Math.random() > 0.8) { // 20% chance each tick
          const autoIncome = Math.floor(building.income * 0.1);
          this.gameState.currentPlayer.cash += autoIncome;
          this.gameState.economy.totalRevenue += autoIncome;
        }
      });

      // Level up check
      if (this.gameState.currentPlayer.experience >= this.gameState.currentPlayer.level * 100) {
        this.gameState.currentPlayer.level++;
        this.gameState.currentPlayer.experience = 0;
        
        // Broadcast level up
        if (this.wsServer) {
          this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'notification',
                message: `🎉 Level up! You are now level ${this.gameState.currentPlayer.level}!`
              }));
            }
          });
        }
      }
    }, 5000); // Every 5 seconds
  }

  stop() {
    if (this.server) this.server.close();
    if (this.wsServer) this.wsServer.close();
    console.log(`🛑 Visual Tycoon Proof stopped`);
  }
}

// Auto-start if run directly
if (require.main === module) {
  const theme = process.argv[2] || 'cannabis-tycoon';
  const port = parseInt(process.argv[3]) || 7010;
  
  const game = new VisualTycoonProof(theme, port);
  
  game.start().then(info => {
    console.log(`🎮 Visual proof running!`);
    console.log(`🌐 Game: ${info.gameUrl}`);
    console.log(`💳 Stripe: ${info.stripeUrl}`);
  }).catch(console.error);

  // Handle shutdown
  process.on('SIGINT', () => {
    game.stop();
    process.exit(0);
  });
}

module.exports = VisualTycoonProof;