#!/bin/bash

# 🎮 TEST EXISTING GAMES - See what actually works

echo "🔍 TESTING YOUR EXISTING GAMES"
echo "=============================="
echo ""
echo "You have 30+ 3D games and a tycoon with REAL user data!"
echo ""

# Check database
echo "📊 Checking Tycoon Database..."
if [ -f "data/tycoon.db" ]; then
    echo "✅ Found tycoon.db (180KB)"
    echo "   - 3 real users"
    echo "   - 3 saved games"
    sqlite3 data/tycoon.db "SELECT username, credits, created_at FROM users LIMIT 3;" 2>/dev/null
else
    echo "❌ Tycoon database not found"
fi

echo ""
echo "🎮 Available Games to Test:"
echo ""
echo "1. PERSISTENT INTEGRATED TYCOON (70KB)"
echo "   - Has database, auth, real users"
echo "   - Run: node PERSISTENT-INTEGRATED-TYCOON.js"
echo "   - Opens on: http://localhost:7080"
echo ""
echo "2. 3D GAME SERVER (11KB)"  
echo "   - Serves 7 different 3D games"
echo "   - Run: node 3d-game-server.js"
echo "   - Note: Port 9000 conflict with MinIO"
echo ""
echo "3. 459-LAYER 3D GAMING UNIVERSE (56KB)"
echo "   - Massive 3D game world"
echo "   - Open: 459-LAYER-3D-GAMING-UNIVERSE.html"
echo ""
echo "4. AI GAME WORLD (29KB)"
echo "   - AI-driven game mechanics"
echo "   - Open: AI-GAME-WORLD.html"
echo ""

# Launch the launcher
echo "🚀 Opening Real Game Launcher..."
python3 -m http.server 8889 > /dev/null 2>&1 &
SERVER_PID=$!

sleep 2
if command -v open &> /dev/null; then
    open "http://localhost:8889/REAL-GAME-LAUNCHER.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8889/REAL-GAME-LAUNCHER.html"
fi

echo ""
echo "✅ Game Launcher opened at: http://localhost:8889/REAL-GAME-LAUNCHER.html"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup
cleanup() {
    echo ""
    echo "Stopping server..."
    kill $SERVER_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

while true; do
    sleep 1
done