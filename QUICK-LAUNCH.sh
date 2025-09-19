#!/bin/bash

echo "🚀 QUICK LAUNCHER"
echo "================"
echo "🧽 SpongeBob says: 'I'm ready!'"
echo "🏗️ Bob says: 'Let's build!'"
echo ""

echo "🎮 Starting gaming engine..."
node WORKING-GAMING-ENGINE.js &
GAMING_PID=$!

sleep 3

echo "👁️ Starting character interface..."
node SPEEDRUN-LEGAL-MCP-CHARACTER.js &
CHARACTER_PID=$!

sleep 3

echo "🤝 Starting handshake layer..."
node handshake-agreement-layer.js &
HANDSHAKE_PID=$!

sleep 2

echo "🔗 Starting system connector..."
node CONNECT-ALL-SYSTEMS.js &
CONNECTOR_PID=$!

echo ""
echo "✅ All systems started!"
echo "🎮 Game: http://localhost:7777/game"
echo "👁️ Character: http://localhost:6969/character"
echo ""
echo "Press Ctrl+C to stop all systems"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping all systems..."; kill $GAMING_PID $CHARACTER_PID $HANDSHAKE_PID $CONNECTOR_PID 2>/dev/null; exit 0' INT

# Keep script running
wait
