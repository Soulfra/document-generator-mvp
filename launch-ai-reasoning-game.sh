#!/bin/bash

echo "🧠 AI REASONING GAME - REAL BACKEND LAUNCHER 🧠"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Kill any existing processes
echo "🔧 Cleaning up old processes..."
pkill -f "ai-reasoning-game-backend.py" 2>/dev/null
pkill -f "AI-REASONING-ANIMATION-STUDIO.js" 2>/dev/null
sleep 1

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements-game.txt --quiet

echo ""
echo "🚀 LAUNCHING SERVICES:"
echo "====================="
echo ""

# Start Flask backend
echo "1️⃣ Starting Flask Game Backend (Port 6789)..."
python3 ai-reasoning-game-backend.py &
FLASK_PID=$!
echo "   ✅ Flask backend started (PID: $FLASK_PID)"

sleep 3

# Start the original AI Studio on different port
echo ""
echo "2️⃣ Starting AI Animation Studio (Port 8765)..."
node AI-REASONING-ANIMATION-STUDIO.js > ai-studio.log 2>&1 &
NODE_PID=$!
echo "   ✅ AI Studio started (PID: $NODE_PID)"

echo ""
echo "=============================================="
echo "🎮 GAME IS READY!"
echo ""
echo "📍 Access Points:"
echo "   • Flask Game Backend: http://localhost:6789"
echo "   • AI Animation Studio: http://localhost:8765"
echo ""
echo "🎯 Flask Game Features (REAL):"
echo "   • SQLite database with persistent state"
echo "   • Real AI agents with different reasoning styles"
echo "   • 4 interactive game zones with ASCII art"
echo "   • WebSocket real-time updates"
echo "   • Blockchain-like state saving"
echo "   • Player intervention system"
echo ""
echo "🎮 How to Play:"
echo "   1. Open http://localhost:6789 in your browser"
echo "   2. Watch AI agents reason in real-time"
echo "   3. Click 'Trigger Event' to intervene"
echo "   4. Save game states to blockchain"
echo "   5. Agents move between zones automatically"
echo ""
echo "📊 Database:"
echo "   • SQLite database: ai_reasoning_game.db"
echo "   • Tables: game_zones, ai_agents, reasoning_events, game_states"
echo ""
echo "🔗 Smart Contract:"
echo "   • Solidity contract: AIReasoningGame.sol"
echo "   • Deploy to any EVM chain for on-chain persistence"
echo ""
echo "🛑 To stop all services:"
echo "   kill $FLASK_PID $NODE_PID"
echo ""
echo "=============================================="
echo "✨ The AI agents are now thinking and affecting the game world!"

# Keep script running
echo ""
echo "Press Ctrl+C to stop all services..."
trap "kill $FLASK_PID $NODE_PID 2>/dev/null; echo 'Services stopped.'; exit" INT
wait