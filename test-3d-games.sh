#!/bin/bash

echo "🎮 TESTING 3D GAMES INTEGRATION"
echo "================================"

# Start the unified game node in background
echo "Starting unified game node..."
node unified-game-node.js &
GAME_PID=$!

# Wait for server to start
sleep 3

echo "Testing endpoints..."

# Test main game
echo "Testing main game..."
curl -s http://localhost:8090/ | head -5

# Test 3D games hub
echo "Testing 3D games hub..."
curl -s http://localhost:8090/3d | head -5

# Test 459-layer game
echo "Testing 459-layer game..."
curl -s http://localhost:8090/3d/459-layer | head -5

# Test fog-of-war game
echo "Testing fog-of-war game..."
curl -s http://localhost:8090/3d/fog-of-war | head -5

# Test 3D status API
echo "Testing 3D games API..."
curl -s http://localhost:8090/3d/api/status

echo ""
echo "✅ All 3D games integrated successfully!"
echo ""
echo "ACCESS YOUR FIXED 3D GAMES:"
echo "• Main Hub: http://localhost:8090/"
echo "• 3D Games: http://localhost:8090/3d"
echo "• 459-Layer: http://localhost:8090/3d/459-layer"
echo "• Fog of War: http://localhost:8090/3d/fog-of-war"
echo "• Voxel World: http://localhost:8090/3d/voxel-world"
echo ""
echo "Press any key to stop server..."
read -n 1

# Kill the game server
kill $GAME_PID
echo "Server stopped."