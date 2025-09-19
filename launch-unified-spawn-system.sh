#!/bin/bash

# LAUNCH UNIFIED SPAWN SYSTEM
# This connects all the pieces together!

echo "🌟 LAUNCHING UNIFIED EVENT SPAWN SYSTEM 🌟"
echo "=========================================="
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Using SQLite fallback"
fi

if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis not found. Using in-memory cache"
fi

# Install npm packages if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws pg redis crypto multer
fi

# Create database if needed
if command -v psql &> /dev/null; then
    echo "📊 Setting up PostgreSQL database..."
    createdb unified_spawn 2>/dev/null || echo "Database already exists"
fi

# Start Redis if available
if command -v redis-server &> /dev/null; then
    echo "🔴 Starting Redis..."
    redis-server --daemonize yes
fi

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:7654 | xargs kill -9 2>/dev/null || true
lsof -ti:7655 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:9999 | xargs kill -9 2>/dev/null || true
lsof -ti:9998 | xargs kill -9 2>/dev/null || true

sleep 1

# Start subsystems in order
echo ""
echo "🚀 Starting subsystems..."
echo ""

# 1. Start Hooks System
echo "🪝 Starting Flag Mode Hooks..."
node flag-mode-hooks.js &
HOOKS_PID=$!
sleep 1

# 2. Start Port Manager
echo "🔌 Starting Empire Port Manager..."
node empire-port-manager.js &
PORT_PID=$!
sleep 1

# 3. Start Bus-Mirror Synergy
echo "🚌 Starting Bus-Mirror Synergy..."
node bus-mirror-synergy.js &
BUS_PID=$!
sleep 1

# 4. Start Corner Character Spawning
echo "🎭 Starting Corner Character Spawning..."
node corner-character-spawning-system.js &
SPAWN_PID=$!
sleep 1

# 5. Start Monero Genesis Explorer (RNG)
echo "🎲 Starting RNG System..."
node monero-genesis-explorer.js &
RNG_PID=$!
sleep 1

# 6. Start Unified Orchestrator
echo "🌟 Starting Unified Event Spawn Orchestrator..."
node unified-event-spawn-orchestrator.js &
ORCHESTRATOR_PID=$!
sleep 2

# Save PIDs for cleanup
echo $HOOKS_PID > .hooks_pid
echo $PORT_PID > .port_pid
echo $BUS_PID > .bus_pid
echo $SPAWN_PID > .spawn_pid
echo $RNG_PID > .rng_pid
echo $ORCHESTRATOR_PID > .orchestrator_pid

# Check if everything started
sleep 2
if kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
    echo ""
    echo "✅ ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "🎮 Access Points:"
    echo "   📊 Main Dashboard: http://localhost:9999/status"
    echo "   🎭 Visual Interface: open unified-spawn-dashboard.html"
    echo "   🌐 WebSocket: ws://localhost:9998"
    echo "   🎨 Character System: http://localhost:7654"
    echo ""
    echo "🎯 Test Commands:"
    echo "   - Click 'Simulate Boss Death' in the dashboard"
    echo "   - Watch entities spawn from corners"
    echo "   - Hover over entities for menus"
    echo "   - Everything auto-saves to database"
    echo ""
    echo "📝 To stop: ./stop-unified-spawn.sh"
    echo ""
    
    # Open dashboard in browser
    if command -v open &> /dev/null; then
        open unified-spawn-dashboard.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open unified-spawn-dashboard.html
    fi
    
    # Keep script running
    echo "Press Ctrl+C to stop all services..."
    wait
else
    echo "❌ Failed to start orchestrator!"
    echo "Check the logs for errors"
    
    # Cleanup
    kill $HOOKS_PID $PORT_PID $BUS_PID $SPAWN_PID $RNG_PID 2>/dev/null
    exit 1
fi