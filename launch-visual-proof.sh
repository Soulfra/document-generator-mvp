#!/bin/bash

echo "🎮 LAUNCHING VISUAL GAME ACTION PROOF SYSTEM"
echo "==========================================="
echo ""
echo "This will show you ACTUAL game characters performing actions!"
echo "You'll see RuneScape characters mining ore, Minecraft blocks breaking, etc."
echo ""

# Function to check if port is in use
check_port() {
    if lsof -i:$1 >/dev/null 2>&1; then
        echo "⚠️  Port $1 is in use. Attempting to free it..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

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

echo ""
echo "🚀 Starting core services..."
echo ""

# Start services in background with proper error handling
echo "1️⃣ Starting Orchestrator..."
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

echo "7️⃣ Starting Game Action Engine (NEW)..."
node game-action-engine.js > logs/action-engine.log 2>&1 &
PIDS+=($!)
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "🎮 OPENING VISUAL INTERFACES:"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Open the visual interfaces
echo "Opening Game Action Visualizer..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "file://$PWD/game-action-visualizer.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "file://$PWD/game-action-visualizer.html"
fi

echo "Opening Working Dashboard..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "file://$PWD/working-dashboard.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "file://$PWD/working-dashboard.html"
fi

echo ""
echo "🎮 VISUAL PROOF SYSTEM READY!"
echo "============================="
echo ""
echo "👀 WHAT YOU SHOULD SEE:"
echo "   ⛏️ RuneScape character actively mining ore"
echo "   📦 Ore appearing in inventory with counts"
echo "   ✨ XP drops showing +35, +65, +80 XP"
echo "   🟫 Minecraft blocks being broken"
echo "   💰 Currency accumulating in real-time"
echo ""
echo "🔧 CONTROLS:"
echo "   - Click game buttons to switch between games"
echo "   - Watch the action log for real-time events"
echo "   - Check API status lights (should be green)"
echo ""
echo "📊 SERVICES RUNNING:"
echo "   http://localhost:3001 - Orchestrator"
echo "   http://localhost:3006 - Groove Layer" 
echo "   http://localhost:4009 - Game Engine"
echo "   http://localhost:4300 - Guardian Layer"
echo "   http://localhost:4500 - Action Engine (NEW)"
echo ""
echo "🛑 To stop all services: Press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    for pid in ${PIDS[@]}; do
        kill $pid 2>/dev/null
    done
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Keep script running and show logs
echo "📜 Monitoring services (Press Ctrl+C to stop)..."
echo ""

# Monitor loop
while true; do
    # Check if services are still running
    for i in ${!PIDS[@]}; do
        if ! kill -0 ${PIDS[$i]} 2>/dev/null; then
            echo "⚠️  Service with PID ${PIDS[$i]} has stopped"
            unset PIDS[$i]
        fi
    done
    
    # Show recent action logs
    if [ -f logs/action-engine.log ]; then
        echo "🎮 Recent game actions:"
        tail -n 5 logs/action-engine.log | grep -E "(mine|break|XP|ore)" || true
        echo ""
    fi
    
    sleep 5
done