#!/usr/bin/env node

/**
 * SIMPLE WORKING EMPIRE DEMO
 * Actually functional themed games that work
 */

const http = require('http');
const WebSocket = require('ws');
const EmpirePortManager = require('./empire-port-manager');

class SimpleWorkingEmpireDemo {
  constructor(theme = 'cannabis-tycoon', portConfig = null) {
    this.theme = theme;
    this.portManager = new EmpirePortManager();
    this.ports = portConfig || { main: 7001, websocket: 7002 };
    
    // Game state
    this.gameState = {
      theme: theme,
      players: new Map(),
      gameTime: Date.now(),
      resources: this.getThemeResources(theme),
      actions: [],
      revenue: 0,
      version: '1.0.0'
    };

    this.server = null;
    this.wsServer = null;
  }

  getThemeResources(theme) {
    const themeData = {
      'cannabis-tycoon': {
        currency: 'credits',
        resources: ['seeds', 'soil', 'water', 'equipment', 'licenses'],
        buildings: ['greenhouse', 'dispensary', 'lab', 'warehouse'],
        products: ['indica', 'sativa', 'hybrid', 'edibles', 'oils'],
        challenges: ['legal_compliance', 'market_demand', 'competition']
      },
      'space-exploration': {
        currency: 'energy_credits',
        resources: ['fuel', 'ore', 'crew', 'technology', 'dilithium'],
        buildings: ['starbase', 'mining_station', 'research_lab', 'shipyard'],
        products: ['starships', 'weapons', 'shields', 'sensors'],
        challenges: ['alien_contact', 'space_storms', 'resource_scarcity']
      },
      'galactic-federation': {
        currency: 'federation_credits',
        resources: ['diplomats', 'ships', 'trade_goods', 'intel'],
        buildings: ['embassy', 'spaceport', 'council_chamber', 'communications'],
        products: ['treaties', 'trade_routes', 'peace_accords'],
        challenges: ['political_tensions', 'trade_disputes', 'military_threats']
      }
    };

    return themeData[theme] || themeData['cannabis-tycoon'];
  }

  async start() {
    console.log(`🎮 Starting ${this.theme} empire demo on ports ${this.ports.main}/${this.ports.websocket}`);

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    // Create WebSocket server
    this.wsServer = new WebSocket.Server({ port: this.ports.websocket });
    this.wsServer.on('connection', (ws) => {
      this.handleWebSocketConnection(ws);
    });

    // Start HTTP server
    this.server.listen(this.ports.main, () => {
      console.log(`✅ ${this.theme} HTTP server listening on port ${this.ports.main}`);
      console.log(`🌐 Access at: http://localhost:${this.ports.main}`);
      console.log(`📡 WebSocket on port ${this.ports.websocket}`);
    });

    // Start game simulation
    this.startGameSimulation();

    return {
      theme: this.theme,
      ports: this.ports,
      accessUrl: `http://localhost:${this.ports.main}`,
      status: 'running'
    };
  }

  handleHttpRequest(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${this.ports.main}`);

    switch (url.pathname) {
      case '/':
        this.serveGameInterface(res);
        break;
      case '/api/status':
        this.serveGameStatus(res);
        break;
      case '/api/action':
        this.handleGameAction(req, res);
        break;
      case '/api/stats':
        this.serveGameStats(res);
        break;
      default:
        res.writeHead(404);
        res.end('Not found');
    }
  }

  serveGameInterface(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 ${this.theme.toUpperCase()} EMPIRE</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: monospace; background: #0a0a0a; color: #00ff00; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #111; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .action-btn { background: #003300; color: #00ff00; border: 1px solid #00ff00; padding: 10px; cursor: pointer; }
        .action-btn:hover { background: #005500; }
        .resources { display: flex; flex-wrap: wrap; gap: 15px; }
        .resource { background: #002200; padding: 10px; border-radius: 3px; }
        .log { background: #111; height: 200px; overflow-y: scroll; padding: 10px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ ${this.theme.toUpperCase()} EMPIRE</h1>
        <div class="status">
            <h3>📊 Empire Status</h3>
            <div id="status">Loading...</div>
        </div>
        
        <div class="status">
            <h3>💰 Resources</h3>
            <div class="resources" id="resources">Loading...</div>
        </div>

        <div class="status">
            <h3>🎮 Actions</h3>
            <div class="actions">
                ${this.gameState.resources.buildings.map(building => 
                    `<button class="action-btn" onclick="takeAction('build_${building}')">Build ${building}</button>`
                ).join('')}
                ${this.gameState.resources.products.map(product => 
                    `<button class="action-btn" onclick="takeAction('produce_${product}')">Make ${product}</button>`
                ).join('')}
            </div>
        </div>

        <div class="status">
            <h3>📜 Game Log</h3>
            <div class="log" id="log">
                Welcome to ${this.theme} empire!<br>
                Your empire is ready to grow...<br>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.ports.websocket}');
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                updateInterface(data);
            };
            ws.onopen = () => addLog('🔗 Connected to empire server');
            ws.onclose = () => addLog('📴 Disconnected from server');
        }

        function updateInterface(data) {
            if (data.type === 'status') {
                document.getElementById('status').innerHTML = \`
                    <div>⏰ Game Time: \${new Date(data.gameTime).toLocaleTimeString()}</div>
                    <div>💵 Revenue: $\${data.revenue}</div>
                    <div>👥 Players: \${data.playerCount}</div>
                    <div>⚡ Actions: \${data.actionCount}</div>
                \`;
            } else if (data.type === 'log') {
                addLog(data.message);
            }
        }

        function addLog(message) {
            const log = document.getElementById('log');
            log.innerHTML += message + '<br>';
            log.scrollTop = log.scrollHeight;
        }

        function takeAction(action) {
            fetch('/api/action', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action, timestamp: Date.now()})
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    addLog(\`✅ \${data.message}\`);
                } else {
                    addLog(\`❌ \${data.error}\`);
                }
            });
        }

        // Auto-update stats
        setInterval(() => {
            fetch('/api/stats').then(r => r.json()).then(data => {
                updateInterface({type: 'status', ...data});
            });
        }, 2000);

        // Connect WebSocket
        connectWebSocket();
        
        // Initial load
        takeAction('start_empire');
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveGameStatus(res) {
    const status = {
      theme: this.theme,
      uptime: Date.now() - this.gameState.gameTime,
      players: this.gameState.players.size,
      actions: this.gameState.actions.length,
      revenue: this.gameState.revenue,
      status: 'running'
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }

  serveGameStats(res) {
    const stats = {
      gameTime: this.gameState.gameTime,
      revenue: this.gameState.revenue,
      playerCount: this.gameState.players.size,
      actionCount: this.gameState.actions.length,
      theme: this.theme
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }

  handleGameAction(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const result = this.processGameAction(data.action);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  processGameAction(action) {
    const actionTime = Date.now();
    
    // Log the action
    this.gameState.actions.push({
      action,
      timestamp: actionTime,
      id: Math.random().toString(36).substr(2, 9)
    });

    // Process based on action type
    if (action.startsWith('build_')) {
      const building = action.replace('build_', '');
      this.gameState.revenue += 10;
      return {
        success: true,
        message: `Built ${building}! +$10 revenue`,
        revenue: this.gameState.revenue
      };
    } else if (action.startsWith('produce_')) {
      const product = action.replace('produce_', '');
      this.gameState.revenue += 5;
      return {
        success: true,
        message: `Produced ${product}! +$5 revenue`,
        revenue: this.gameState.revenue
      };
    } else if (action === 'start_empire') {
      return {
        success: true,
        message: `Welcome to ${this.theme} empire! Start building to earn revenue.`,
        revenue: this.gameState.revenue
      };
    }

    return {
      success: false,
      error: 'Unknown action'
    };
  }

  handleWebSocketConnection(ws) {
    console.log(`📡 New WebSocket connection to ${this.theme}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      theme: this.theme,
      message: `Connected to ${this.theme} empire!`
    }));

    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        // Handle WebSocket actions here
      } catch (error) {
        console.log('WebSocket error:', error);
      }
    });
  }

  startGameSimulation() {
    // Send periodic updates via WebSocket
    setInterval(() => {
      if (this.wsServer.clients.size > 0) {
        const update = {
          type: 'status',
          gameTime: Date.now(),
          revenue: this.gameState.revenue,
          playerCount: this.gameState.players.size,
          actionCount: this.gameState.actions.length
        };

        this.wsServer.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
          }
        });
      }
    }, 5000);

    // Simulate empire activity
    setInterval(() => {
      // Add some automatic empire activity
      if (Math.random() > 0.7) {
        this.gameState.revenue += Math.floor(Math.random() * 3);
        
        if (this.wsServer.clients.size > 0) {
          const logMessage = {
            type: 'log',
            message: `🏛️ Empire generated $${Math.floor(Math.random() * 3)} automatically`
          };

          this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(logMessage));
            }
          });
        }
      }
    }, 10000);
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.wsServer) {
      this.wsServer.close();
    }
    console.log(`🛑 ${this.theme} empire stopped`);
  }
}

// Auto-start if run directly
if (require.main === module) {
  const theme = process.argv[2] || 'cannabis-tycoon';
  const demo = new SimpleWorkingEmpireDemo(theme);
  
  demo.start().then(info => {
    console.log(`🎮 ${info.theme} empire running at ${info.accessUrl}`);
  }).catch(console.error);

  // Handle shutdown
  process.on('SIGINT', () => {
    demo.stop();
    process.exit(0);
  });
}

module.exports = SimpleWorkingEmpireDemo;