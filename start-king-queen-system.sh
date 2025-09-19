#!/bin/bash

# 🤖👑 KING & QUEEN AI BUSINESS CO-FOUNDER SYSTEM LAUNCHER 👸🤖

echo "🤖👑 Starting King & Queen AI Business Co-Founder System 👸🤖"
echo "============================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Make the scripts executable
chmod +x ai-cofounder-spawn-orchestrator.js
chmod +x ai-agent-worker.js

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "ai-cofounder-spawn-orchestrator" || true
pkill -f "ai-agent-worker" || true

# Wait a moment for cleanup
sleep 2

# Start the AI Co-Founder Spawn Orchestrator
echo "🚀 Starting AI Co-Founder Spawn Orchestrator..."
node ai-cofounder-spawn-orchestrator.js &
ORCHESTRATOR_PID=$!

# Wait for orchestrator to start
sleep 3

# Check if orchestrator started successfully
if ! ps -p $ORCHESTRATOR_PID > /dev/null; then
    echo "❌ Failed to start AI Co-Founder Orchestrator"
    exit 1
fi

echo "✅ AI Co-Founder Orchestrator running (PID: $ORCHESTRATOR_PID)"

# Display connection information
echo ""
echo "🌐 System Ready!"
echo "=================="
echo "📊 Dashboard:     Open business-dashboard.html in your browser"
echo "🔗 API Server:    http://localhost:3001"
echo "📡 WebSocket:     ws://localhost:3002"
echo ""
echo "🤖 King & Queen Personas:"
echo "  👑 King Mode:    Strategic analysis, market intelligence, execution"
echo "  👸 Queen Mode:   Creative innovation, trend sensing, breakthroughs"
echo ""
echo "🌍 Deployment Zones:"
echo "  📊 soulfra.com:       Intelligence gathering"
echo "  💥 deathtodata.com:   Market disruption"
echo "  ✨ cringeproof.com:   Quality assurance"
echo "  💡 finishthisidea.com: Innovation discovery"
echo "  🚀 finishthisrepo.com: Execution & delivery"
echo "  💰 ipomyagent.com:    Monetization strategies"
echo ""
echo "🎮 Available Agent Types:"
echo "  👑 King Agents:  market-analyst, competitor-scout, financial-modeler, risk-assessor, strategy-executor"
echo "  👸 Queen Agents: trend-scout, innovation-hunter, creative-catalyst, opportunity-spotter, breakthrough-finder"
echo ""
echo "💡 Usage:"
echo "  1. Open business-dashboard.html in your browser"
echo "  2. Switch between King/Queen modes"
echo "  3. Click 'Generate Business' to spawn analysis teams"
echo "  4. Watch real-time agent activity in the data stream"
echo "  5. Agents will automatically find missions and earn tokens"
echo ""
echo "🔧 Advanced Usage:"
echo "  • Test API: curl http://localhost:3001/api/ai-cofounder/status"
echo "  • View agents: curl http://localhost:3001/api/ai-cofounder/agents"
echo "  • View bounties: curl http://localhost:3001/api/ai-cofounder/bounties"
echo ""

# Function to handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down King & Queen AI System..."
    kill $ORCHESTRATOR_PID 2>/dev/null || true
    pkill -f "ai-agent-worker" || true
    echo "✅ Shutdown complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🚀 System is running! Press Ctrl+C to stop."
echo "📱 Open business-dashboard.html in your browser to start commanding your AI army!"

# Keep script running
wait $ORCHESTRATOR_PID