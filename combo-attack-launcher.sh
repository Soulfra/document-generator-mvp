#!/bin/bash

# 🎮 COMBO ATTACK LAUNCHER
# Start all systems for controller-based web interaction
# Integrates gamepad, optimization, canvas, and vault

echo "
🎮 COMBO ATTACK SYSTEM LAUNCHER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Starting integrated gaming systems...
"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Function to start a service
start_service() {
    local name=$1
    local script=$2
    local port=$3
    
    echo -e "${BLUE}Starting $name...${NC}"
    
    # Check if port is already in use
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $port is already in use, skipping $name${NC}"
    else
        # Start the service in background
        node "$script" > "logs/${name}.log" 2>&1 &
        local pid=$!
        echo $pid > "pids/${name}.pid"
        
        # Wait a moment for service to start
        sleep 2
        
        # Check if service started successfully
        if ps -p $pid > /dev/null; then
            echo -e "${GREEN}✅ $name started (PID: $pid, Port: $port)${NC}"
        else
            echo -e "${RED}❌ Failed to start $name${NC}"
            cat "logs/${name}.log" | tail -20
        fi
    fi
}

# Create necessary directories
mkdir -p logs pids

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install express ws sqlite3 crypto axios bcrypt jsonwebtoken
fi

echo -e "\n${GREEN}🚀 Launching Combo Attack Systems...${NC}\n"

# 1. Start Gamepad Combo System
start_service "gamepad-combo" "gamepad-combo-system.js" 7779

# 2. Start ASIC Optimization Engine
start_service "asic-optimization" "asic-optimization-engine.js" 0

# 3. Start Domain Vault System
start_service "domain-vault" "domain-vault-system.js" 7782

# 4. Start Collaboration WebSocket Server (for canvas)
echo -e "${BLUE}Starting Canvas Collaboration Server...${NC}"
cat > canvas-collab-server.js << 'EOF'
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7781 });

const peers = new Map();

console.log('🎨 Canvas Collaboration Server started on port 7781');

wss.on('connection', (ws) => {
    const peerId = Math.random().toString(36).substring(2, 15);
    
    peers.set(peerId, {
        id: peerId,
        ws: ws,
        name: `User ${peerId.substring(0, 4)}`
    });
    
    // Notify all peers
    broadcast({
        type: 'peerJoined',
        peer: { id: peerId, name: peers.get(peerId).name }
    }, peerId);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Add sender info
            data.peerId = peerId;
            
            // Broadcast to all other peers
            broadcast(data, peerId);
        } catch (error) {
            console.error('Message error:', error);
        }
    });
    
    ws.on('close', () => {
        peers.delete(peerId);
        broadcast({ type: 'peerLeft', peerId }, peerId);
    });
});

function broadcast(data, excludePeerId = null) {
    const message = JSON.stringify(data);
    
    peers.forEach((peer, id) => {
        if (id !== excludePeerId && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(message);
        }
    });
}
EOF

start_service "canvas-collab" "canvas-collab-server.js" 7781

# 5. Start unified web interface
echo -e "\n${BLUE}Creating Unified Interface...${NC}"
cat > combo-attack-interface.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Combo Attack Control Center</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
        }
        .header {
            background: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff);
            padding: 20px;
            text-align: center;
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
            margin-top: 20px;
        }
        .card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s;
        }
        .card:hover {
            border-color: #00ff88;
            transform: translateY(-2px);
        }
        .status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status.active { background: #00ff88; }
        .status.inactive { background: #ff3333; }
        .button {
            background: #3a86ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
        }
        .button:hover {
            background: #2a76ef;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 15px;
        }
        .stat {
            background: #2a2a2a;
            padding: 10px;
            border-radius: 4px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Combo Attack Control Center</h1>
        <p>Controller-based web interaction with AI optimization</p>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h2>🎮 Gamepad System</h2>
                <p><span class="status active"></span>Active on port 7779</p>
                <div class="stats">
                    <div class="stat">
                        <div>Combos</div>
                        <div class="stat-value" id="combo-count">0</div>
                    </div>
                    <div class="stat">
                        <div>APM</div>
                        <div class="stat-value" id="apm">0</div>
                    </div>
                </div>
                <a href="http://localhost:7779" class="button">Open Dashboard</a>
            </div>
            
            <div class="card">
                <h2>⚡ ASIC Optimization</h2>
                <p><span class="status active"></span>Mining patterns</p>
                <div class="stats">
                    <div class="stat">
                        <div>Hash Rate</div>
                        <div class="stat-value" id="hashrate">0 H/s</div>
                    </div>
                    <div class="stat">
                        <div>Patterns</div>
                        <div class="stat-value" id="patterns">0</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>🎨 AI Canvas</h2>
                <p><span class="status active"></span>Collaborative drawing</p>
                <div class="stats">
                    <div class="stat">
                        <div>Peers</div>
                        <div class="stat-value" id="peers">0</div>
                    </div>
                    <div class="stat">
                        <div>Layers</div>
                        <div class="stat-value">3</div>
                    </div>
                </div>
                <a href="collaborative-ai-canvas.html" class="button" target="_blank">Open Canvas</a>
            </div>
            
            <div class="card">
                <h2>🏰 Domain Vault</h2>
                <p><span class="status active"></span>Secure storage</p>
                <div class="stats">
                    <div class="stat">
                        <div>Domains</div>
                        <div class="stat-value" id="domains">300+</div>
                    </div>
                    <div class="stat">
                        <div>Versions</div>
                        <div class="stat-value" id="versions">0</div>
                    </div>
                </div>
                <a href="http://localhost:7782/vault/stats" class="button">Vault Stats</a>
            </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
            <h3>🕹️ Connect Your Controller</h3>
            <p>Press any button on your gamepad to begin</p>
            <div id="gamepad-status" style="margin-top: 20px; font-size: 18px;">
                Waiting for gamepad...
            </div>
        </div>
    </div>
    
    <script>
        // Monitor gamepad connection
        window.addEventListener('gamepadconnected', (e) => {
            document.getElementById('gamepad-status').innerHTML = 
                '✅ ' + e.gamepad.id + ' connected!';
        });
        
        // Connect to WebSocket for live stats
        const ws = new WebSocket('ws://localhost:7780');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'combo') {
                const count = document.getElementById('combo-count');
                count.textContent = parseInt(count.textContent) + 1;
            }
        };
        
        // Periodic updates
        setInterval(() => {
            // Update stats via API calls
            fetch('http://localhost:7782/vault/stats')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('domains').textContent = data.vaults?.length || '0';
                    document.getElementById('versions').textContent = data.stats?.totalVersions || '0';
                })
                .catch(() => {});
        }, 5000);
    </script>
</body>
</html>
EOF

# 6. Open the interface
echo -e "\n${GREEN}✨ All systems launched!${NC}\n"

echo "🎮 COMBO ATTACK SYSTEMS ACTIVE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Gamepad Combo System:     http://localhost:7779
• WebSocket Stream:         ws://localhost:7780
• Canvas Collaboration:     ws://localhost:7781
• Domain Vault API:         http://localhost:7782
• AI Canvas Interface:      file://$(pwd)/collaborative-ai-canvas.html
• Control Center:           file://$(pwd)/combo-attack-interface.html

📋 Available Combos:
  • Prayer Flick: RB, RB
  • DPS Rotation: X, Y, B, RT
  • Special Attack: LT, RT, RT
  • Dodge Roll: A, A

🎨 To collaborate:
  1. Open the AI Canvas
  2. Share the URL with others
  3. Draw together with AI assistance

🏰 To use vault:
  curl -X POST http://localhost:7782/vault/create \\
    -H 'Content-Type: application/json' \\
    -d '{\"domain\":\"example.com\",\"files\":{\"index.html\":\"<h1>Hello</h1>\"}}'
"

# Open control center in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "combo-attack-interface.html"
fi

# Monitor logs
echo -e "\n${YELLOW}📊 Monitoring services (press Ctrl+C to stop all)...${NC}\n"

# Trap to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping all services...${NC}"
    
    for pidfile in pids/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if ps -p $pid > /dev/null; then
                kill $pid 2>/dev/null
                echo -e "${RED}Stopped process $pid${NC}"
            fi
            rm "$pidfile"
        fi
    done
    
    # Clean up temporary files
    rm -f canvas-collab-server.js
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Keep script running and show logs
tail -f logs/*.log 2>/dev/null || true