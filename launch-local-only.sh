#!/bin/bash

# Local-only launcher for Mobile Idle Tycoon
# NO external API calls, NO service dependencies

echo "🏴‍☠️ LAUNCHING PIRATE ISLANDS CLASH - LOCAL EDITION 🏴‍☠️"
echo "=================================================="
echo "✅ NO API KEYS REQUIRED"
echo "✅ NO EXTERNAL SERVICES"
echo "✅ RUNS COMPLETELY OFFLINE"
echo ""

# Set local-only environment
export LOCAL_ONLY_MODE=true
export SKIP_API_CHECKS=true
export USE_LOCAL_SPRITES=true
export DISABLE_EXTERNAL_AUTH=true

# Create necessary directories
mkdir -p public/icons
mkdir -p save-data
mkdir -p local-cache

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Install Node.js from https://nodejs.org/"
    exit 1
fi

echo "📦 Checking local dependencies..."

# Install minimal dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing local dependencies..."
    npm install --no-audit --no-fund express ws 2>/dev/null || {
        echo "⚠️  npm install failed, but continuing anyway..."
    }
fi

# Create a simple local server wrapper
cat > local-server.js << 'EOF'
const SimpleConnector = require('./simple-connector.js');
const MobileIdleTycoon = require('./mobile-idle-tycoon.js');
const express = require('express');
const path = require('path');

console.log('🏴‍☠️ Starting LOCAL ONLY server...\n');

// Initialize with simple connector
const connector = new SimpleConnector();
const game = new MobileIdleTycoon();

// Connect systems locally
connector.connectSystems(game);

// Apply local config
const localConfig = connector.generateLocalConfig();
game.idleMechanics.resourceCap = localConfig.resources.caps.gold;

// Start local game loop
connector.createLocalGameLoop(game);

// Simple Express server
const app = express();
const port = 7779; // Different port to avoid conflicts

app.use(express.json());
app.use(express.static('public'));

// Serve the game HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mobile-idle-tycoon.html'));
});

// Basic API endpoints
app.get('/api/game/state', (req, res) => {
    res.json(game.getGameState());
});

app.post('/api/building/create', (req, res) => {
    try {
        const { type, x, y, islandId } = req.body;
        const building = game.createBuilding(type, x, y, islandId);
        res.json(building);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/building/:id/collect', (req, res) => {
    try {
        const collected = game.collectResources(req.params.id);
        res.json({ collected });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`
🎮 LOCAL GAME SERVER RUNNING!
============================
🏴‍☠️ Play at: http://localhost:${port}
📱 Mobile: Use your computer's IP:${port}
💾 Saves: ./save-data/
🎨 Graphics: Local emoji sprites

Features:
✅ Full game functionality
✅ Offline progression
✅ Local saves
✅ No external dependencies

Press Ctrl+C to stop
`);
});
EOF

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:7779 | xargs kill -9 2>/dev/null || true
lsof -ti:7778 | xargs kill -9 2>/dev/null || true

# Start the local server
echo ""
echo "🚀 Starting local game server..."
echo "================================"

node local-server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Try to open in browser
if command -v open &> /dev/null; then
    open "http://localhost:7779"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:7779"
else
    echo "📱 Open http://localhost:7779 in your browser"
fi

echo ""
echo "🏴‍☠️ Game is running locally!"
echo "Press Ctrl+C to stop"
echo ""

# Keep script running and handle cleanup
trap "echo ''; echo '🛑 Stopping local server...'; kill $SERVER_PID 2>/dev/null; rm -f local-server.js; exit" INT TERM

wait $SERVER_PID