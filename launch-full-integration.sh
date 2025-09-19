#!/bin/bash

echo "🧠 🎮 LAUNCHING FULL REASONING GAME INTEGRATION SYSTEM"
echo "====================================================="
echo ""
echo "This system integrates:"
echo "  ✅ Visual game actions (characters mining ore)"
echo "  ✅ AI reasoning engine with decision making"
echo "  ✅ Differential symlinks for state tracking"
echo "  ✅ Human-in-the-loop approval system"
echo "  ✅ Teacher/Guardian/Companion AI layers"
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

echo ""
echo "🚀 Starting services in sequence..."
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

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 OPENING INTERFACES:"
echo ""

# Open the interfaces
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Opening Game Action Visualizer..."
    open "file://$PWD/game-action-visualizer.html"
    sleep 1
    
    echo "Opening Human Approval Interface..."
    open "file://$PWD/human-approval-interface.html"
    sleep 1
    
    echo "Opening Working Dashboard..."
    open "file://$PWD/working-dashboard.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "file://$PWD/game-action-visualizer.html"
    sleep 1
    xdg-open "file://$PWD/human-approval-interface.html"
    sleep 1
    xdg-open "file://$PWD/working-dashboard.html"
fi

echo ""
echo "🧠 🎮 FULL INTEGRATION SYSTEM READY!"
echo "===================================="
echo ""
echo "🎯 WHAT YOU CAN DO NOW:"
echo ""
echo "1️⃣ VISUAL GAME ACTIONS (game-action-visualizer.html):"
echo "   • Watch RuneScape character mining ore in real-time"
echo "   • See ore appearing in inventory with counts"
echo "   • Observe XP drops and animations"
echo ""
echo "2️⃣ HUMAN APPROVAL SYSTEM (human-approval-interface.html):"
echo "   • Review AI reasoning for each game action"
echo "   • Approve or reject actions with feedback"
echo "   • See Teacher/Guardian/Companion AI recommendations"
echo "   • Track decision history and symlinks"
echo ""
echo "3️⃣ AI REASONING FEATURES:"
echo "   • Every game action gets analyzed by reasoning engine"
echo "   • Confidence scores and risk assessments"
echo "   • Teacher AI provides learning tips"
echo "   • Guardian AI ensures safety"
echo "   • Companion AI offers encouragement"
echo ""
echo "4️⃣ DIFFERENTIAL SYMLINKS:"
echo "   • All decisions create symlinks in reasoning-symlinks/"
echo "   • Game states tracked in game-states/"
echo "   • Full audit trail of human approvals"
echo ""
echo "📊 SERVICE ENDPOINTS:"
echo "   http://localhost:4500 - Game Action Engine"
echo "   http://localhost:5500 - Reasoning Integration"
echo "   http://localhost:4300 - Guardian Layer"
echo "   http://localhost:3008 - Trust System"
echo ""
echo "🎮 HOW IT WORKS:"
echo "   1. Game actions appear in visualizer"
echo "   2. AI reasoning analyzes each action"
echo "   3. Human approval requested for important decisions"
echo "   4. Approved actions execute with visual feedback"
echo "   5. All decisions tracked via symlinks"
echo ""
echo "🛑 To stop all services: Press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    for pid in ${PIDS[@]}; do
        kill $pid 2>/dev/null
    done
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Monitor loop
echo "📜 Monitoring system (Press Ctrl+C to stop)..."
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
    
    echo -ne "\r⚡ System Status: $HEALTHY/$TOTAL services running"
    
    # Show recent reasoning activity
    if [ -f logs/reasoning.log ]; then
        RECENT=$(tail -n 1 logs/reasoning.log 2>/dev/null | grep -E "(reasoning|approval|AI)" || echo "")
        if [ ! -z "$RECENT" ]; then
            echo -e "\n📊 Recent: $RECENT"
        fi
    fi
    
    sleep 5
done