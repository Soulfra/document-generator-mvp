#!/bin/bash

# 🏛️ GRAND EXCHANGE STARTUP SCRIPT
# 
# Launches the complete Grand Exchange Router ecosystem with:
# - ESPN & Spotify API integrations  
# - Habbo-style chat rooms with AI agents
# - Real-time trading engine
# - Web dashboard interface
# - CAL brand scanner integration

set -e

echo "🏛️ STARTING GRAND EXCHANGE ROUTER ECOSYSTEM"
echo "==========================================="
echo ""

# Change to project directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Set up environment
export NODE_ENV="${NODE_ENV:-development}"
export DOCUMENT_ENCRYPTION_KEY="${DOCUMENT_ENCRYPTION_KEY:-grand-exchange-2025}"

# Check for required environment variables
if [ -z "$ESPN_API_KEY" ]; then
    echo "⚠️  ESPN_API_KEY not set, using mock data"
    export ESPN_API_KEY="mock-key"
fi

if [ -z "$SPOTIFY_CLIENT_ID" ]; then
    echo "⚠️  SPOTIFY_CLIENT_ID not set, using mock data"
    export SPOTIFY_CLIENT_ID="mock-client-id"
    export SPOTIFY_CLIENT_SECRET="mock-client-secret"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install ws express axios
fi

# Create necessary directories
mkdir -p logs
mkdir -p data/trading
mkdir -p data/chat

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo "❌ Port $port is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking ports..."
check_port 9999 || { echo "Grand Exchange API port 9999 is busy"; exit 1; }
check_port 9998 || { echo "WebSocket port 9998 is busy"; exit 1; }

# Start the Grand Exchange Router
echo ""
echo "🚀 Starting Grand Exchange Router..."
node grand-exchange-router.js > logs/grand-exchange.log 2>&1 &
GE_PID=$!
echo "✅ Grand Exchange Router started (PID: $GE_PID)"

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 3

# Check if Grand Exchange is running
if ! kill -0 $GE_PID 2>/dev/null; then
    echo "❌ Grand Exchange Router failed to start"
    cat logs/grand-exchange.log
    exit 1
fi

# Start CAL Brand Scanner in background
echo "🎯 Starting CAL Brand Scanner..."
node cal-brand-scanner.js > logs/cal-scanner.log 2>&1 &
CAL_PID=$!
echo "✅ CAL Brand Scanner started (PID: $CAL_PID)"

# Open the dashboard in browser (if available)
if command -v open >/dev/null 2>&1; then
    echo "🌐 Opening dashboard in browser..."
    sleep 2
    open "grand-exchange-dashboard.html"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "grand-exchange-dashboard.html"
fi

echo ""
echo "✅ GRAND EXCHANGE ECOSYSTEM RUNNING!"
echo "===================================="
echo ""
echo "🔗 Services:"
echo "   API Server: http://localhost:9999"
echo "   WebSocket: ws://localhost:9998"
echo "   Dashboard: file://$PROJECT_ROOT/grand-exchange-dashboard.html"
echo ""
echo "📊 Trading Pairs Available:"
echo "   Sports: LAKERS/USD, MAHOMES/BTC, SUPERBOWL/ETH"
echo "   Music: TAYLOR/USD, DRAKE/ETH, VIBES/SOL"
echo "   Cross: HALFTIME/STREAMS, VIBES/TOUCHDOWNS"
echo ""
echo "💬 Chat Rooms:"
echo "   - Trading Floor (with AI agents)"
echo "   - Sports Lounge"
echo "   - Music Hall"
echo "   - Meme Dungeon"
echo ""
echo "🤖 Active AI Agents:"
echo "   - MaxProfit (Trading specialist)"
echo "   - VibeCheck (Music enthusiast)"
echo "   - SportsBot (Sports analyst)"
echo "   - MemeLord (Chaos agent)"
echo ""
echo "📚 Quick Commands:"
echo "   View logs: tail -f logs/grand-exchange.log"
echo "   Check health: curl http://localhost:9999/health"
echo "   Stop all: kill $GE_PID $CAL_PID"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Grand Exchange ecosystem..."
    
    # Kill processes
    kill $GE_PID 2>/dev/null || true
    kill $CAL_PID 2>/dev/null || true
    
    # Wait for processes to stop
    sleep 2
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait $GE_PID