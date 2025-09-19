#!/bin/bash

# 🎮🌐 LAUNCH UNIFIED MATRIX GAME
# ===============================
# The complete HollowTown experience with DOMINGO

echo "🎮🌐 UNIFIED MATRIX LAUNCHER"
echo "============================"
echo ""
echo "🎯 INITIALIZING THE FINAL BOSS: DOMINGO"
echo "📸 Picture Upload System: READY"
echo "📄 Contract Signing: ENABLED"
echo "👥 Group Live Watch: ACTIVE"
echo ""

# Check if port 8888 is available
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8888 is already in use. Using alternative port 8889..."
    sed -i '' 's/this.port = 8888/this.port = 8889/g' unified-matrix-launcher.js 2>/dev/null || sed -i 's/this.port = 8888/this.port = 8889/g' unified-matrix-launcher.js
    PORT=8889
else
    PORT=8888
fi

echo "🏰 THE 7 LEVELS TO DOMINGO:"
echo "   1. HollowTown Entry"
echo "   2. Faction Wars"
echo "   3. Tech Titan Tower"
echo "   4. Scanner Saga Depths"
echo "   5. Contract Crucible"
echo "   6. Character Creation"
echo "   7. The Final Integration → DOMINGO"
echo ""

echo "🔄 INTEGRATED SYSTEMS:"
echo "   • HollowTown YellowBook"
echo "   • Four Factions Arguments"
echo "   • Tech Titan Dial-Up"
echo "   • Website Scanner Saga"
echo "   • Contract Handshake"
echo "   • Agent Clan System"
echo "   • Character Mascot"
echo ""

echo "🚀 Launching unified matrix game..."
node unified-matrix-launcher.js &
GAME_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $GAME_PID > /dev/null; then
    echo ""
    echo "✅ Unified Matrix Game launched successfully!"
    echo ""
    echo "🎮 GAME INTERFACE: http://localhost:$PORT"
    echo ""
    echo "📋 EMBED ON YOUR WEBSITE:"
    echo '   <script src="http://localhost:'$PORT'/embed.js"></script>'
    echo '   <div id="hollowtown-game"></div>'
    echo ""
    echo "🎯 HOW TO PLAY:"
    echo "   1. Upload your picture (becomes your avatar)"
    echo "   2. Sign the contract to begin"
    echo "   3. Progress through 7 levels"
    echo "   4. Unite all XML workflows"
    echo "   5. Face DOMINGO - The Final Boss"
    echo ""
    echo "👥 LIVE FEATURES:"
    echo "   • Friends can watch your gameplay live"
    echo "   • Share link to invite viewers"
    echo "   • Real-time progress updates"
    echo "   • Group chat during gameplay"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening game interface..."
        open http://localhost:$PORT
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening game interface..."
        xdg-open http://localhost:$PORT
    else
        echo "📱 Manually visit: http://localhost:$PORT"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $GAME_PID"
    echo ""
    echo "🎮 The Matrix awaits your arrival..."
    echo ""
    
    # Keep script running
    echo "🔄 Game server running... Press Ctrl+C to stop"
    trap "echo ''; echo '🎮 Shutting down the Matrix...'; kill $GAME_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $GAME_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Matrix game stopped"
else
    echo "❌ Failed to launch Unified Matrix Game"
    exit 1
fi