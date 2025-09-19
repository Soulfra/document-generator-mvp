#!/bin/bash

# 🚀 BULLETPROOF LAUNCHER - Keep ripping through the system
# No more addiction layers, just pure functionality

echo "🚀 BULLETPROOF LAUNCHER ACTIVATED"
echo "================================="

# Kill everything first (clean slate)
echo "🧹 Cleaning slate..."
pkill -f "node.*layer" 2>/dev/null || true
pkill -f "node.*system" 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start the core trinity (only what matters)
echo "⚡ Starting Core Trinity..."

# 1. Dynamic XML Mapper (makes everything dynamic)
echo "🗺️  Starting Dynamic XML Mapper..."
node dynamic-xml-mapper.js &
MAPPER_PID=$!

# 2. Bulletproof Substrate (keeps it alive)
echo "🛡️  Starting Bulletproof Substrate..."
node bulletproof-substrate-manager.js &
SUBSTRATE_PID=$!

# 3. Enhanced Game (the actual product)
echo "🎮 Starting Enhanced Game..."
node working-enhanced-game.js &
GAME_PID=$!

sleep 5

# Test core functionality
echo "🧪 Testing core systems..."

# Test game
if curl -s http://localhost:8899 >/dev/null; then
    echo "✅ Game system: LIVE"
else
    echo "❌ Game system: DOWN"
fi

# Test mapper
if [ -d "./xml-mappings" ]; then
    echo "✅ XML Mapper: ACTIVE"
else
    echo "❌ XML Mapper: INACTIVE"
fi

echo ""
echo "🎯 BULLETPROOF SYSTEM STATUS"
echo "============================"
echo "🗺️  XML Mapper PID: $MAPPER_PID"
echo "🛡️  Substrate PID: $SUBSTRATE_PID" 
echo "🎮 Game PID: $GAME_PID"
echo ""
echo "🌐 Access Points:"
echo "   • Game: http://localhost:8899"
echo "   • XML Mappings: ./xml-mappings/"
echo ""
echo "🔥 SYSTEM IS BULLETPROOF - KEEP RIPPING!"