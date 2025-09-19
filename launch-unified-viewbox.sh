#!/bin/bash

echo "🧠 💰 🎮 LAUNCHING UNIFIED REASONING VIEWBOX SYSTEM"
echo "=================================================="
echo ""
echo "This system combines:"
echo "  ✅ Real-time game visualization with reasoning overlay"
echo "  ✅ Multi-AI reasoning (Teacher/Guardian/Companion)"
echo "  ✅ Crypto trace engine for scam tracking"
echo "  ✅ Web crawler for @mentions and #hashtags"
echo "  ✅ Item-based reasoning analysis"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -i:$1 >/dev/null 2>&1; then
        echo "⚠️  Port $1 is in use. Attempting to free it..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p reasoning-symlinks
mkdir -p game-states/runescape
mkdir -p game-states/minecraft
mkdir -p game-states/roblox
mkdir -p crypto-traces
mkdir -p web-patterns

# Check and free ports
echo "🔧 Checking ports..."
check_port 3001  # Orchestrator
check_port 3005  # Hyper-dimensional
check_port 3006  # Groove layer
check_port 3008  # Trust system
check_port 4009  # Game engine
check_port 4200  # Classic Battle.net
check_port 4300  # Guardian layer
check_port 4500  # Game action engine
check_port 5002  # Flask API
check_port 5500  # Reasoning integration
check_port 6000  # Crypto trace engine

echo ""
echo "🚀 Starting all services..."
echo ""

# Array to store PIDs
PIDS=()

# Start core services
echo "1️⃣ Starting Broadcast Orchestrator..."
node broadcast-orchestrator.js > logs/orchestrator.log 2>&1 &
PIDS+=($!)
sleep 2

echo "2️⃣ Starting Hyper-Dimensional Wrapper..."
node hyper-dimensional-triple-wrapper.js > logs/hyper.log 2>&1 &
PIDS+=($!)
sleep 2

echo "3️⃣ Starting Groove Layer..."
node groove-layer-musical-sync.js > logs/groove.log 2>&1 &
PIDS+=($!)
sleep 2

echo "4️⃣ Starting Trust System..."
node anonymous-trust-handshake-db.js > logs/trust.log 2>&1 &
PIDS+=($!)
sleep 2

echo "5️⃣ Starting Game Integration Engine..."
node game-integration-engine.js > logs/game-engine.log 2>&1 &
PIDS+=($!)
sleep 2

echo "6️⃣ Starting Battle.net Guardian Layer..."
node battlenet-guardian-layer.js > logs/guardian.log 2>&1 &
PIDS+=($!)
sleep 2

echo "7️⃣ Starting Game Action Engine..."
node game-action-engine.js > logs/action-engine.log 2>&1 &
PIDS+=($!)
sleep 3

echo "8️⃣ Starting Reasoning Game Integration..."
node reasoning-game-integration.js > logs/reasoning.log 2>&1 &
PIDS+=($!)
sleep 3

echo "9️⃣ Starting Crypto Trace Engine..."
node crypto-trace-engine.js > logs/crypto-trace.log 2>&1 &
PIDS+=($!)
sleep 3

echo ""
echo "✅ All services started!"
echo ""

# Open the unified dashboard
echo "🌐 OPENING UNIFIED REASONING DASHBOARD..."
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "file://$PWD/unified-reasoning-dashboard.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "file://$PWD/unified-reasoning-dashboard.html"
fi

echo ""
echo "🧠 💰 🎮 UNIFIED VIEWBOX SYSTEM READY!"
echo "====================================="
echo ""
echo "🎯 MAIN VIEWBOX FEATURES:"
echo ""
echo "📺 CENTRAL DISPLAY:"
echo "   • Live game view with reasoning overlay"
echo "   • Real-time character actions (mining, breaking blocks)"
echo "   • Item hover analysis with reasoning"
echo ""
echo "🤖 AI REASONING PANELS:"
echo "   • Teacher AI: Learning tips and strategies"
echo "   • Guardian AI: Safety and threat assessment"
echo "   • Companion AI: Encouragement and support"
echo ""
echo "💰 CRYPTO TRACE FEATURES:"
echo "   • Track wallet: 0x742d35Cc6634C053..."
echo "   • Transaction pattern analysis"
echo "   • Scam detection alerts"
echo "   • Game economy connections"
echo ""
echo "🌐 WEB PATTERN SEARCH:"
echo "   • Finds @mentions and #hashtags"
echo "   • Searches for hints and connections"
echo "   • Links crypto patterns to game events"
echo ""
echo "🔍 REAL-TIME MONITORING:"
echo "   • Pattern detection counter"
echo "   • Live transaction stream"
echo "   • Suspicious activity alerts"
echo ""
echo "📊 SERVICE ENDPOINTS:"
echo "   http://localhost:4500 - Game Action Engine"
echo "   http://localhost:5500 - Reasoning Integration"
echo "   http://localhost:6000 - Crypto Trace Engine"
echo "   ws://localhost:6000  - Crypto WebSocket"
echo ""
echo "⚡ KEYBOARD SHORTCUTS:"
echo "   • Click 🌐 Web Crawler - Toggle web pattern search"
echo "   • Click 💰 Crypto Trace - Toggle crypto monitoring"
echo "   • Click 📦 Item Analysis - Toggle item reasoning"
echo "   • Click 🔍 Pattern Search - Toggle pattern detection"
echo ""
echo "🛑 To stop all services: Press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down unified system..."
    for pid in ${PIDS[@]}; do
        kill $pid 2>/dev/null
    done
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Monitor loop with enhanced status
echo "📜 Monitoring unified system (Press Ctrl+C to stop)..."
echo ""

while true; do
    # Check service health
    HEALTHY=0
    TOTAL=${#PIDS[@]}
    
    for pid in ${PIDS[@]}; do
        if kill -0 $pid 2>/dev/null; then
            ((HEALTHY++))
        fi
    done
    
    echo -ne "\r⚡ System Status: $HEALTHY/$TOTAL services | "
    
    # Check for patterns
    if [ -f logs/crypto-trace.log ]; then
        PATTERNS=$(grep -c "pattern" logs/crypto-trace.log 2>/dev/null || echo "0")
        echo -ne "Patterns: $PATTERNS | "
    fi
    
    # Check for crypto alerts
    if [ -f logs/crypto-trace.log ]; then
        ALERTS=$(grep -c "suspicious" logs/crypto-trace.log 2>/dev/null || echo "0")
        echo -ne "Alerts: $ALERTS | "
    fi
    
    # Show recent activity
    if [ -f logs/reasoning.log ]; then
        RECENT=$(tail -n 1 logs/reasoning.log 2>/dev/null | grep -oE "(mine|break|trace)" | head -1 || echo "idle")
        echo -ne "Activity: $RECENT"
    fi
    
    sleep 5
done