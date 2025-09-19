#!/bin/bash

# 🏴‍☠️ SHIP SYSTEMS STARTUP SCRIPT
# Starts the unified assistant with ship template bridge

echo "🏴‍☠️ Starting Ship Systems Integration..."
echo ""
echo "   This will start:"
echo "   - Unified Assistant (port 8888)"
echo "   - Ship Template Bridge (port 7770)"
echo "   - WebSocket connections"
echo "   - Real-time ship updates"
echo ""

# Start Ship Template Bridge first
echo "🚢 Starting Ship Template Bridge..."
node SHIP-TEMPLATE-BRIDGE.js &
SHIP_PID=$!

# Wait a moment for ship bridge to initialize
sleep 2

# Start Unified Assistant
echo "🎯 Starting Unified Assistant..."
node UNIFIED-ASSISTANT-ORCHESTRATOR.js &
ASSISTANT_PID=$!

echo ""
echo "✅ All systems started!"
echo ""
echo "🌐 Access Points:"
echo "   - Unified Assistant: http://localhost:8888"
echo "   - Ship Dashboard: http://localhost:7770"
echo "   - Ship API: http://localhost:7770/api/ships"
echo ""
echo "🏴‍☠️ Example Queries:"
echo '   "@ship show me pirate sloop"'
echo '   "@ship build frigate with speed sails"'
echo '   "@ship compare galleon vs destroyer"'
echo '   "Find the fastest pirate ship"'
echo ""
echo "Press Ctrl+C to stop all systems"

# Wait for interrupt
wait $SHIP_PID $ASSISTANT_PID