#!/bin/bash

# 🎮 LAUNCH ENHANCED 3D GAME WITH AI
# Starts the complete playable 3D game system

echo "🎮 LAUNCHING ENHANCED 3D GAME SYSTEM"
echo "==================================="
echo ""

# Check if necessary files exist
echo "📁 Checking game files..."

FILES=(
    "unified-3d-game-engine.js"
    "enhanced-ai-behavior-system.js"
    "enhanced-3d-game-launcher.html"
    "unified-3d-game-with-ai.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "🚀 Starting game server..."

# Start simple HTTP server
python3 -m http.server 8888 &
SERVER_PID=$!

echo "✅ Server started on port 8888 (PID: $SERVER_PID)"
echo ""

# Give server time to start
sleep 2

# Open game launcher
echo "🌐 Opening Enhanced 3D Game Launcher..."
if command -v open &> /dev/null; then
    open "http://localhost:8888/enhanced-3d-game-launcher.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8888/enhanced-3d-game-launcher.html"
else
    echo "Please open: http://localhost:8888/enhanced-3d-game-launcher.html"
fi

echo ""
echo "🎮 GAME FEATURES:"
echo "=================="
echo "✅ Voxel-based 3D world (Minecraft-style)"
echo "✅ Real physics engine with gravity"
echo "✅ Mining and building mechanics"
echo "✅ Inventory system with hotbar"
echo "✅ AI NPCs with pathfinding (no more spinning!)"
echo "✅ Context-aware NPC dialogue"
echo "✅ Multiple game modes (Survival, Creative, etc.)"
echo "✅ Document-to-game transformation"
echo ""
echo "🎮 CONTROLS:"
echo "============"
echo "WASD - Move"
echo "Space - Jump"
echo "Mouse - Look around"
echo "Left Click - Mine blocks"
echo "Right Click - Place blocks"
echo "1-9 - Select hotbar items"
echo "E - Inventory (coming soon)"
echo "T - Chat (coming soon)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for interrupt
trap "echo ''; echo '🛑 Stopping server...'; kill $SERVER_PID 2>/dev/null; exit" INT

# Keep script running
while true; do
    sleep 1
done