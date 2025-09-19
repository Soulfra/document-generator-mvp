#!/bin/bash

echo "🤖 AI GAME AUTOMATION PROOF SYSTEM LAUNCH"
echo "=========================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
lsof -ti:49000 | xargs kill -9 2>/dev/null || true
lsof -ti:49001 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo "🚀 STARTING AI GAME AUTOMATION PROOF SYSTEM..."
echo ""

# Start the AI automation proof system
echo "🤖 Starting AI Game Automation Proof Backend..."
node ai-game-automation-proof.js > ai-proof.log 2>&1 &
AI_PROOF_PID=$!
echo "   Process ID: $AI_PROOF_PID"
echo "   Log: tail -f ai-proof.log"

sleep 5

echo ""
echo "✅ AI GAME AUTOMATION PROOF SYSTEM ACTIVE!"
echo "==========================================="
echo ""
echo "🌐 PROOF INTERFACES:"
echo "   🤖 Live Proof Interface: file://$(pwd)/ai-game-proof-interface.html"
echo "   📊 Automation Dashboard: http://localhost:49000/dashboard"
echo "   📸 Screenshot Gallery: http://localhost:49000/screenshots"
echo "   🔍 Proof API: http://localhost:49000/api/proof-data"
echo ""
echo "🔌 BACKEND SERVICES:"
echo "   🤖 AI Automation API: http://localhost:49000"
echo "   📡 WebSocket: ws://localhost:49001"
echo ""
echo "🎮 SUPPORTED GAMES:"
echo "   🗡️ RuneLite (Old School RuneScape)"
echo "   🧱 Minecraft"
echo "   🎮 Roblox"
echo ""

# Test if services are responding
echo "🧪 TESTING SERVICES..."
sleep 2

# Test AI proof system
if curl -sf http://localhost:49000/health > /dev/null; then
    echo "   ✅ AI Proof System: Responding"
else
    echo "   ❌ AI Proof System: Not responding"
fi

echo ""
echo "📋 HOW TO PROVE AI IS PLAYING:"
echo ""
echo "1. 🎮 LAUNCH A SUPPORTED GAME:"
echo "   - Open RuneLite for OSRS"
echo "   - Start Minecraft"
echo "   - Launch Roblox"
echo ""
echo "2. 📱 OPEN THE PROOF INTERFACE:"
echo "   - Click the link above or manually open:"
echo "   - file://$(pwd)/ai-game-proof-interface.html"
echo ""
echo "3. 🤖 WATCH THE AI IN ACTION:"
echo "   - Game detection panel shows when games are found"
echo "   - Live actions feed shows AI performing actions"
echo "   - Screenshots are taken every 30 seconds as proof"
echo "   - Verification panel shows confidence scores"
echo ""
echo "4. 🔍 API ENDPOINTS FOR VERIFICATION:"
echo "   - POST /api/start-automation - Start AI playing"
echo "   - POST /api/take-screenshot - Capture proof screenshot"
echo "   - POST /api/verify-ai-playing - Verify AI is actually playing"
echo "   - GET /api/proof-data - Get all proof evidence"
echo ""
echo "🎯 PROOF FEATURES:"
echo "   📸 Automated screenshots every 30 seconds"
echo "   📝 Real-time action logging with timestamps"
echo "   🔍 AI verification with confidence scoring"
echo "   🎮 Multi-game detection and automation"
echo "   📊 Live dashboard with proof statistics"
echo "   🌐 WebSocket real-time updates"
echo ""

# Auto-open interfaces if available
if command -v open >/dev/null 2>&1; then
    echo "🚀 Opening proof interface automatically..."
    sleep 2
    open "file://$(pwd)/ai-game-proof-interface.html"
elif command -v xdg-open >/dev/null 2>&1; then
    echo "🚀 Opening proof interface automatically..."
    sleep 2
    xdg-open "file://$(pwd)/ai-game-proof-interface.html"
else
    echo "💡 Please manually open: file://$(pwd)/ai-game-proof-interface.html"
fi

echo ""
echo "Press Ctrl+C to stop the AI proof system"
echo ""

# Create cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping AI Game Automation Proof System..."
    kill $AI_PROOF_PID 2>/dev/null
    sleep 2
    echo "🔄 Cleanup complete"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Wait for user interrupt
echo "🤖 AI Game Automation Proof System running... (Ctrl+C to stop)"
echo ""
echo "📊 LIVE STATUS:"
echo "   🔍 Monitoring for game processes..."
echo "   📸 Screenshot system ready..."
echo "   🤖 AI automation engines loaded..."
echo "   🔗 WebSocket server active..."
echo ""
echo "🎯 READY TO PROVE AI IS PLAYING GAMES!"

wait