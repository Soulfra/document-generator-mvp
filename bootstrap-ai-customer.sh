#!/bin/bash

# 🚀 BOOTSTRAP AI CUSTOMER - Make AI the first customer of its own platform
# This script connects all systems and spawns AI Customer Zero

echo "🚀 BOOTSTRAP AI CUSTOMER"
echo "======================="
echo "Making AI the first customer of its own platform"
echo ""

# Set user email from environment or use default
USER_EMAIL=${USER_EMAIL:-"ai@localhost"}
echo "📧 Using email: $USER_EMAIL"
echo ""

# 1. Check required services
echo "🔍 Checking required services..."

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis not found. Please install Redis first."
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-server"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis not running. Starting Redis..."
    redis-server --daemonize yes
    sleep 2
fi

echo "✅ Redis ready"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js ready"

# 2. Start core systems
echo ""
echo "🔧 Starting core systems..."

# Create necessary directories
mkdir -p logs data

# Start Event Bus (if not already running)
if ! lsof -i:9999 &> /dev/null; then
    echo "📡 Starting Event Bus..."
    node CROSS-SYSTEM-EVENT-BUS.js > logs/event-bus.log 2>&1 &
    EVENT_BUS_PID=$!
    echo "   Event Bus PID: $EVENT_BUS_PID"
    sleep 3
else
    echo "   Event Bus already running on port 9999"
fi

# Start Fog of War Broadcaster (if not already running)
if ! lsof -i:3003 &> /dev/null; then
    echo "📺 Starting Fog of War Broadcaster..."
    node fog-war-broadcaster.js > logs/fog-broadcaster.log 2>&1 &
    FOG_PID=$!
    echo "   Fog Broadcaster PID: $FOG_PID"
    sleep 3
else
    echo "   Fog Broadcaster already running on port 3003"
fi

# Start Mirror Layer
echo "🪞 Activating Mirror Layer..."
node mirror-layer-bash.js > logs/mirror-layer.log 2>&1 &
MIRROR_PID=$!
echo "   Mirror Layer PID: $MIRROR_PID"
sleep 2

# 3. Start NPC Gaming Layer with AI Customer Zero
echo ""
echo "🎮 Starting NPC Gaming Layer..."
echo "🤖 Creating AI Customer Zero..."

# Set environment variable for email
export USER_EMAIL=$USER_EMAIL

# Start NPC Gaming Layer
node npc-gaming-layer.js > logs/npc-gaming.log 2>&1 &
NPC_PID=$!
echo "   NPC Gaming Layer PID: $NPC_PID"

# 4. Monitor startup
echo ""
echo "⏳ Waiting for systems to initialize..."
sleep 5

# 5. Check if everything is running
echo ""
echo "🔍 Verifying system status..."

ERRORS=0

# Check Event Bus
if lsof -i:9999 &> /dev/null; then
    echo "✅ Event Bus: Running on port 9999"
else
    echo "❌ Event Bus: Not running"
    ERRORS=$((ERRORS + 1))
fi

# Check Fog Broadcaster
if lsof -i:3003 &> /dev/null; then
    echo "✅ Fog Broadcaster: Running on port 3003"
else
    echo "❌ Fog Broadcaster: Not running"
    ERRORS=$((ERRORS + 1))
fi

# Check processes
if ps -p $NPC_PID > /dev/null 2>&1; then
    echo "✅ NPC Gaming Layer: Running (PID: $NPC_PID)"
else
    echo "❌ NPC Gaming Layer: Not running"
    ERRORS=$((ERRORS + 1))
fi

# 6. Show results
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 SUCCESS! All systems running!"
    echo ""
    echo "📊 System Status:"
    echo "=================="
    echo "🤖 AI Customer Zero: Active and exploring"
    echo "📡 Event Bus: ws://localhost:9999"
    echo "🌫️ Fog of War: http://localhost:3003"
    echo "🪞 Mirror Layer: Active"
    echo "🎮 NPC Gaming: Active with 4 AI agents"
    echo ""
    echo "📋 What's happening now:"
    echo "- AI Customer Zero is exploring the fog of war"
    echo "- Making autonomous decisions using MCP reasoning"
    echo "- Discovering and purchasing digital locations"
    echo "- Trading with other AI agents"
    echo "- Building economic value through predictions"
    echo ""
    echo "🔍 Monitor activity:"
    echo "tail -f logs/npc-gaming.log"
    echo ""
    echo "🌐 View dashboards:"
    echo "- Fog of War Explorer: http://localhost:3003/fog-of-war-3d-explorer.html"
    echo "- Broadcast Dashboard: http://localhost:3003/fog-war-broadcast-dashboard.html"
    echo ""
    echo "💡 The AI is now its own first customer!"
else
    echo "❌ FAILED! Some systems did not start properly."
    echo "Check the logs in the ./logs directory for errors."
    echo ""
    echo "🔍 Debug commands:"
    echo "tail -f logs/event-bus.log"
    echo "tail -f logs/fog-broadcaster.log"
    echo "tail -f logs/npc-gaming.log"
fi

# 7. Save PID file for cleanup
cat > bootstrap-pids.txt << EOF
EVENT_BUS_PID=$EVENT_BUS_PID
FOG_PID=$FOG_PID
MIRROR_PID=$MIRROR_PID
NPC_PID=$NPC_PID
EOF

echo ""
echo "💾 Process IDs saved to bootstrap-pids.txt"
echo "🛑 To stop all: ./stop-bootstrap.sh"