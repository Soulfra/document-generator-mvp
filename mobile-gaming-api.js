#!/usr/bin/env node

/**
 * 📱 MOBILE GAMING API SERVER
 * D2JSP-style mobile gaming platform as web API
 * Integrates with character database and unified systems
 */

const express = require('express');
const crypto = require('crypto');
const EventEmitter = require('events');

class MobileGamingAPI extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.port = 9500;
    
    // Game state
    this.players = new Map();
    this.gameState = {
      activeUsers: 0,
      totalGames: 0,
      revenue: 0,
      treasures: new Map()
    };
    
    // D2JSP-style inventory system
    this.inventory = {
      grid: Array(10).fill().map(() => Array(4).fill(null)),
      items: new Map()
    };
    
    // Wallet system
    this.wallets = new Map();
    
    // Economy system
    this.economy = {
      treasures: new Map(),
      trades: [],
      marketValue: 1000000000 // $1B
    };
    
    console.log('📱 MOBILE GAMING API INITIALIZING');
    console.log('D2JSP-style platform with crypto wallet integration');
    
    this.setupExpress();
    this.initializeGameData();
  }
  
  setupExpress() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'mobile-gaming-api',
        port: this.port,
        activeUsers: this.gameState.activeUsers,
        totalGames: this.gameState.totalGames,
        features: [
          'D2JSP-style gaming',
          'Crypto wallet integration',
          'Treasure hunting',
          'Character integration',
          'Mobile-optimized'
        ]
      });
    });
    
    // Game state endpoint
    this.app.get('/api/game/state', (req, res) => {
      res.json({
        gameState: this.gameState,
        inventory: {
          grid: this.inventory.grid,
          items: Array.from(this.inventory.items.entries())
        },
        playerCount: this.players.size
      });
    });
    
    // Wallet operations
    this.app.get('/api/wallet/balance', (req, res) => {
      const { userId = 'default' } = req.query;
      const wallet = this.getOrCreateWallet(userId);
      
      res.json({
        balance: wallet.balance,
        address: wallet.address,
        transactions: wallet.transactions.slice(-10)
      });
    });
    
    this.app.post('/api/wallet/send', (req, res) => {
      const { userId = 'default', to, amount, currency = 'GAME' } = req.body;
      const wallet = this.getOrCreateWallet(userId);
      
      if (wallet.balance[currency] >= amount) {
        wallet.balance[currency] -= amount;
        wallet.transactions.push({
          type: 'send',
          to,
          amount,
          currency,
          timestamp: Date.now(),
          txHash: crypto.randomUUID()
        });
        
        res.json({
          success: true,
          txHash: wallet.transactions[wallet.transactions.length - 1].txHash,
          newBalance: wallet.balance[currency]
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        });
      }
    });
    
    // Inventory operations
    this.app.get('/api/inventory', (req, res) => {
      res.json({
        grid: this.inventory.grid,
        items: Array.from(this.inventory.items.entries()),
        gridSize: { rows: 10, cols: 4 }
      });
    });
    
    this.app.post('/api/inventory/move', (req, res) => {
      const { from, to, itemId } = req.body;
      
      // Validate positions
      if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
        return res.status(400).json({ success: false, error: 'Invalid position' });
      }
      
      // Check if target slot is empty
      if (this.inventory.grid[to.row][to.col] === null) {
        this.inventory.grid[from.row][from.col] = null;
        this.inventory.grid[to.row][to.col] = itemId;
        
        res.json({ success: true, grid: this.inventory.grid });
      } else {
        res.status(400).json({ success: false, error: 'Target slot occupied' });
      }
    });
    
    // Mining operations
    this.app.post('/api/mine', (req, res) => {
      const { oreType = 'iron' } = req.body;
      const ores = {
        iron: { xp: 35, chance: 0.8, value: 10 },
        gold: { xp: 65, chance: 0.5, value: 25 },
        diamond: { xp: 150, chance: 0.1, value: 100 }
      };
      
      const ore = ores[oreType] || ores.iron;
      
      if (Math.random() < ore.chance) {
        const reward = {
          success: true,
          ore: oreType,
          xp: ore.xp,
          value: ore.value,
          timestamp: Date.now()
        };
        
        this.gameState.totalGames++;
        this.gameState.revenue += ore.value;
        
        res.json(reward);
      } else {
        res.json({
          success: false,
          message: 'Mining failed',
          ore: oreType
        });
      }
    });
    
    // Treasure hunting
    this.app.get('/api/treasures', (req, res) => {
      const availableTreasures = Array.from(this.economy.treasures.values())
        .filter(t => !t.discovered)
        .map(t => ({
          id: t.id,
          type: t.type,
          hint: t.location.hint,
          value: t.value,
          rarity: t.rarity
        }));
      
      res.json({
        treasures: availableTreasures,
        totalValue: this.economy.marketValue,
        found: Array.from(this.economy.treasures.values()).filter(t => t.discovered).length
      });
    });
    
    this.app.post('/api/treasures/:id/hunt', (req, res) => {
      const { id } = req.params;
      const treasure = this.economy.treasures.get(id);
      
      if (!treasure) {
        return res.status(404).json({ success: false, error: 'Treasure not found' });
      }
      
      if (treasure.discovered) {
        return res.status(400).json({ success: false, error: 'Treasure already discovered' });
      }
      
      // Simple discovery chance based on rarity
      const discoveryChance = treasure.rarity * 10; // Convert to percentage
      
      if (Math.random() < discoveryChance) {
        treasure.discovered = true;
        treasure.discoveredAt = Date.now();
        
        this.gameState.revenue += treasure.value;
        
        res.json({
          success: true,
          treasure: {
            type: treasure.type,
            value: treasure.value,
            location: treasure.location
          },
          message: `Found ${treasure.type}! Worth ${treasure.value} gold!`
        });
      } else {
        res.json({
          success: false,
          message: 'Search unsuccessful. Keep looking!',
          hint: treasure.location.hint
        });
      }
    });
    
    // Trading system
    this.app.post('/api/trade', (req, res) => {
      const { fromUserId = 'default', toUserId, items, goldAmount } = req.body;
      
      const trade = {
        id: crypto.randomUUID(),
        from: fromUserId,
        to: toUserId,
        items: items || [],
        gold: goldAmount || 0,
        timestamp: Date.now(),
        status: 'completed'
      };
      
      this.economy.trades.push(trade);
      
      res.json({
        success: true,
        trade,
        message: 'Trade completed!'
      });
    });
    
    // Economy stats
    this.app.get('/api/economy/stats', (req, res) => {
      const stats = {
        marketValue: this.economy.marketValue,
        totalTrades: this.economy.trades.length,
        treasuresFound: Array.from(this.economy.treasures.values()).filter(t => t.discovered).length,
        totalTreasures: this.economy.treasures.size,
        totalRevenue: this.gameState.revenue,
        activeUsers: this.gameState.activeUsers,
        totalGames: this.gameState.totalGames
      };
      
      res.json(stats);
    });
    
    // Biometric authentication simulation
    this.app.post('/api/auth/biometric', (req, res) => {
      const { type, data } = req.body;
      
      // Simulate different auth types
      const authResults = {
        voice: { confidence: 0.95, method: 'voice_recognition' },
        fingerprint: { confidence: 0.98, method: 'fingerprint_scan' },
        face: { confidence: 0.92, method: 'facial_recognition' },
        pattern: { confidence: 0.87, method: 'pattern_unlock' }
      };
      
      const result = authResults[type] || authResults.pattern;
      
      res.json({
        success: true,
        authenticated: result.confidence > 0.8,
        confidence: result.confidence,
        method: result.method,
        userId: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16)
      });
    });
    
    // Character integration
    this.app.post('/api/character/action', async (req, res) => {
      const { character, action, params } = req.body;
      
      try {
        // Try to integrate with character database system
        const characterResponse = await this.integrateWithCharacterSystem(character, action, params);
        
        res.json({
          success: true,
          character,
          action,
          result: characterResponse,
          integrated: true
        });
      } catch (error) {
        // Fallback to local processing
        res.json({
          success: true,
          character,
          action,
          result: this.processCharacterActionLocally(character, action, params),
          integrated: false,
          note: 'Processed locally - character system unavailable'
        });
      }
    });
    
    // Game dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateGameDashboard());
    });
  }
  
  initializeGameData() {
    console.log('🎮 Initializing game data...');
    
    // Create starting inventory items
    const startingItems = [
      { id: 'sword_1', type: 'weapon', name: 'Iron Sword', damage: [10, 15], rarity: 'common' },
      { id: 'armor_1', type: 'armor', name: 'Leather Armor', defense: 25, rarity: 'common' },
      { id: 'potion_1', type: 'consumable', name: 'Health Potion', healing: 50, rarity: 'common' },
      { id: 'gem_1', type: 'valuable', name: 'Ruby', value: 500, rarity: 'rare' }
    ];
    
    startingItems.forEach((item, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      this.inventory.grid[row][col] = item.id;
      this.inventory.items.set(item.id, item);
    });
    
    // Generate treasure locations
    this.generateTreasures();
    
    console.log('✅ Game data initialized');
  }
  
  generateTreasures() {
    const treasureTypes = [
      { type: 'One Piece', value: 100000000, rarity: 0.001, hint: 'The ultimate treasure awaits...' },
      { type: 'Devil Fruit', value: 50000000, rarity: 0.005, hint: 'Power beyond imagination...' },
      { type: 'Ancient Weapon', value: 25000000, rarity: 0.01, hint: 'Weapons of mass destruction...' },
      { type: 'Road Poneglyph', value: 10000000, rarity: 0.02, hint: 'The path to Laugh Tale...' },
      { type: 'Rare Ore Vein', value: 1000000, rarity: 0.05, hint: 'Precious metals await mining...' },
      { type: 'Lost Artifact', value: 500000, rarity: 0.1, hint: 'Ancient civilizations left clues...' }
    ];
    
    treasureTypes.forEach(treasure => {
      const id = crypto.randomUUID();
      this.economy.treasures.set(id, {
        ...treasure,
        id,
        discovered: false,
        location: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          hint: treasure.hint
        }
      });
    });
    
    console.log(`💰 Generated ${this.economy.treasures.size} treasure locations`);
  }
  
  getOrCreateWallet(userId) {
    if (!this.wallets.has(userId)) {
      const privateKey = crypto.randomBytes(32).toString('hex');
      const address = '0x' + crypto.createHash('sha256')
        .update(privateKey)
        .digest('hex')
        .slice(0, 40);
      
      this.wallets.set(userId, {
        id: userId,
        address,
        privateKey: this.encryptPrivateKey(privateKey),
        balance: { ETH: 0, BTC: 0, GAME: 1000 },
        transactions: [],
        created: Date.now()
      });
    }
    
    return this.wallets.get(userId);
  }
  
  encryptPrivateKey(privateKey) {
    const cipher = crypto.createCipher('aes256', 'mobile-gaming-key');
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  isValidPosition(pos) {
    return pos && 
           typeof pos.row === 'number' && 
           typeof pos.col === 'number' &&
           pos.row >= 0 && pos.row < 10 &&
           pos.col >= 0 && pos.col < 4;
  }
  
  async integrateWithCharacterSystem(character, action, params) {
    // Try to call character database system
    const axios = require('axios');
    
    const response = await axios.post(`http://localhost:9902/api/characters/${character}/database/${action}`, {
      ...params,
      source: 'mobile-gaming',
      timestamp: Date.now()
    });
    
    return response.data;
  }
  
  processCharacterActionLocally(character, action, params) {
    // Local fallback processing
    const actions = {
      search: { result: 'Found interesting pattern', xp: 15 },
      mine: { result: 'Mined valuable ore', xp: 25 },
      trade: { result: 'Completed successful trade', xp: 20 },
      explore: { result: 'Discovered new area', xp: 30 }
    };
    
    const actionResult = actions[action] || actions.explore;
    
    return {
      ...actionResult,
      character,
      processed: 'locally',
      timestamp: Date.now()
    };
  }
  
  generateGameDashboard() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>📱 Mobile Gaming Platform</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            margin: 0; 
            padding: 20px; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; text-shadow: 0 0 20px rgba(255,255,255,0.5); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: rgba(255, 255, 255, 0.1); 
            border-radius: 15px; 
            padding: 20px; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card h3 { color: #ffeb3b; margin-top: 0; }
        .button { 
            background: linear-gradient(45deg, #2196F3, #21CBF3); 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 25px; 
            cursor: pointer; 
            margin: 5px; 
            font-size: 14px;
            transition: transform 0.2s;
        }
        .button:hover { transform: scale(1.05); }
        .inventory { 
            display: grid; 
            grid-template-columns: repeat(4, 50px); 
            gap: 5px; 
            margin-top: 10px; 
        }
        .slot { 
            width: 50px; 
            height: 50px; 
            border: 2px solid #ccc; 
            border-radius: 5px; 
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        .slot.occupied { background: rgba(255, 215, 0, 0.3); border-color: gold; }
        .stats { display: flex; justify-content: space-around; text-align: center; }
        .stat { padding: 10px; }
        .stat-number { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .console { 
            background: rgba(0,0,0,0.8); 
            padding: 15px; 
            border-radius: 10px; 
            font-family: monospace; 
            max-height: 200px; 
            overflow-y: auto; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 Mobile Gaming Platform</h1>
            <p>D2JSP-style gaming • Crypto wallet • Treasure hunting • Character integration</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number" id="active-users">${this.gameState.activeUsers}</div>
                <div>Active Users</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="total-games">${this.gameState.totalGames}</div>
                <div>Games Played</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="revenue">$${(this.gameState.revenue / 1000).toFixed(1)}K</div>
                <div>Revenue</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="treasures">${this.economy.treasures.size}</div>
                <div>Treasures</div>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🎮 Game Controls</h3>
                <button class="button" onclick="mine('iron')">⛏️ Mine Iron</button>
                <button class="button" onclick="mine('gold')">🏅 Mine Gold</button>
                <button class="button" onclick="mine('diamond')">💎 Mine Diamond</button>
                <button class="button" onclick="huntTreasure()">🗺️ Hunt Treasure</button>
            </div>
            
            <div class="card">
                <h3>💰 Wallet</h3>
                <div id="wallet-info">Loading...</div>
                <button class="button" onclick="refreshWallet()">🔄 Refresh</button>
                <button class="button" onclick="sendTransaction()">💸 Send</button>
            </div>
            
            <div class="card">
                <h3>🎒 Inventory</h3>
                <div class="inventory" id="inventory-grid">
                    ${this.generateInventoryGrid()}
                </div>
            </div>
            
            <div class="card">
                <h3>🏆 Treasures</h3>
                <div id="treasure-list">Loading...</div>
                <button class="button" onclick="refreshTreasures()">🔄 Refresh</button>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h3>📊 API Endpoints</h3>
            <div style="font-family: monospace; font-size: 12px;">
                GET /api/game/state - Game state<br>
                GET /api/wallet/balance - Wallet balance<br>
                POST /api/mine - Mining operations<br>
                GET /api/treasures - Available treasures<br>
                POST /api/character/action - Character actions
            </div>
        </div>
        
        <div class="console" id="console">
            <div style="color: #4CAF50;">📱 Mobile Gaming Platform Console</div>
            <div>Platform ready for mobile gaming!</div>
        </div>
    </div>
    
    <script>
        function log(message) {
            const console = document.getElementById('console');
            const timestamp = new Date().toLocaleTimeString();
            console.innerHTML += \`<div>[\${timestamp}] \${message}</div>\`;
            console.scrollTop = console.scrollHeight;
        }
        
        async function mine(oreType) {
            log(\`⛏️ Mining \${oreType}...\`);
            try {
                const response = await fetch('/api/mine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oreType })
                });
                const result = await response.json();
                
                if (result.success) {
                    log(\`✅ Found \${result.ore}! +\${result.xp} XP, \${result.value} gold\`);
                    updateStats();
                } else {
                    log(\`❌ Mining failed: \${result.message}\`);
                }
            } catch (error) {
                log('❌ Mining error: ' + error.message);
            }
        }
        
        async function huntTreasure() {
            log('🗺️ Searching for treasures...');
            try {
                const response = await fetch('/api/treasures');
                const data = await response.json();
                
                if (data.treasures.length > 0) {
                    const treasure = data.treasures[0];
                    log(\`🏴‍☠️ Found treasure: \${treasure.type} (Value: \${treasure.value})\`);
                    
                    // Attempt to hunt it
                    const huntResponse = await fetch(\`/api/treasures/\${treasure.id}/hunt\`, {
                        method: 'POST'
                    });
                    const huntResult = await huntResponse.json();
                    
                    if (huntResult.success) {
                        log(\`🎉 \${huntResult.message}\`);
                    } else {
                        log(\`🔍 \${huntResult.message}\`);
                    }
                } else {
                    log('🏴‍☠️ No treasures available');
                }
            } catch (error) {
                log('❌ Treasure hunting error: ' + error.message);
            }
        }
        
        async function refreshWallet() {
            try {
                const response = await fetch('/api/wallet/balance');
                const wallet = await response.json();
                
                document.getElementById('wallet-info').innerHTML = \`
                    <div>ETH: \${wallet.balance.ETH}</div>
                    <div>BTC: \${wallet.balance.BTC}</div>
                    <div>GAME: \${wallet.balance.GAME}</div>
                    <div style="font-size: 10px; margin-top: 5px;">
                        Address: \${wallet.address.slice(0, 10)}...
                    </div>
                \`;
                
                log('💰 Wallet refreshed');
            } catch (error) {
                log('❌ Wallet error: ' + error.message);
            }
        }
        
        async function refreshTreasures() {
            try {
                const response = await fetch('/api/treasures');
                const data = await response.json();
                
                const treasureList = data.treasures.slice(0, 3).map(t => \`
                    <div style="padding: 5px; background: rgba(255,215,0,0.2); margin: 2px 0; border-radius: 3px; font-size: 12px;">
                        \${t.type} - \${t.value} gold
                    </div>
                \`).join('');
                
                document.getElementById('treasure-list').innerHTML = treasureList || '<div>No treasures available</div>';
                
                log(\`🗺️ Found \${data.treasures.length} treasures\`);
            } catch (error) {
                log('❌ Treasure refresh error: ' + error.message);
            }
        }
        
        async function updateStats() {
            try {
                const response = await fetch('/api/economy/stats');
                const stats = await response.json();
                
                document.getElementById('active-users').textContent = stats.activeUsers;
                document.getElementById('total-games').textContent = stats.totalGames;
                document.getElementById('revenue').textContent = '$' + (stats.totalRevenue / 1000).toFixed(1) + 'K';
                document.getElementById('treasures').textContent = stats.totalTreasures;
            } catch (error) {
                log('❌ Stats update error: ' + error.message);
            }
        }
        
        // Initialize
        refreshWallet();
        refreshTreasures();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            updateStats();
            refreshTreasures();
        }, 30000);
        
        log('🚀 Mobile Gaming Platform initialized!');
    </script>
</body>
</html>`;
  }
  
  generateInventoryGrid() {
    let html = '';
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 4; col++) {
        const itemId = this.inventory.grid[row][col];
        const isOccupied = itemId !== null;
        const item = isOccupied ? this.inventory.items.get(itemId) : null;
        
        html += `<div class="slot ${isOccupied ? 'occupied' : ''}" title="${item ? item.name : 'Empty'}">
          ${item ? item.name.charAt(0) : ''}
        </div>`;
      }
    }
    return html;
  }
  
  async start() {
    const server = this.app.listen(this.port, () => {
      console.log(`
📱 MOBILE GAMING API PLATFORM ACTIVE! 📱
═══════════════════════════════════════
🎮 Gaming API: http://localhost:${this.port}
📊 Dashboard: http://localhost:${this.port}
💰 Wallet API: http://localhost:${this.port}/api/wallet/*
🎒 Inventory: http://localhost:${this.port}/api/inventory/*

🚀 Features:
  • D2JSP-style inventory system
  • Crypto wallet integration (ETH, BTC, GAME)
  • Treasure hunting with billion-dollar economy
  • Mining system with XP progression
  • Character integration with database system
  • Mobile-optimized API endpoints
  • Real-time trading system

Ready for mobile gaming integration!
      `);
    });
    
    return server;
  }
}

// Export
module.exports = MobileGamingAPI;

// Run if called directly
if (require.main === module) {
  const gamingAPI = new MobileGamingAPI();
  gamingAPI.start().catch(console.error);
}