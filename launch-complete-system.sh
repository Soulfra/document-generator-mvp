#!/bin/bash

echo "🎮 🏛️ ⛏️ LAUNCHING COMPLETE D2JSP SYSTEM"
echo "========================================"
echo ""
echo "🎯 System Components:"
echo "  ✅ D2JSP Forum System (port 3000)"
echo "  ✅ Game Engine with Reasoning (port 8000)"
echo "  ✅ Unified Mining Node (port 7000)"
echo "  ✅ Crypto Tracing (port 6000)"
echo "  ✅ AI Reasoning Dashboard (port 5500)"
echo ""

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Function to kill process on port
kill_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        echo "⚠️ Freeing port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Clean up all ports
echo "🧹 Cleaning up existing processes..."
kill_port 3000  # Forum
kill_port 5500  # Reasoning
kill_port 6000  # Crypto
kill_port 7000  # Mining
kill_port 8000  # Game Engine

sleep 2

echo ""
echo "🚀 Starting all services..."

# Start services in background
echo "  📡 Starting D2JSP Forum System..."
node d2jsp-forum-system.js &
FORUM_PID=$!

echo "  🧠 Starting AI Reasoning Dashboard..."
node reasoning-game-integration.js &
REASONING_PID=$!

echo "  💰 Starting Crypto Trace Engine..."
node crypto-trace-engine.js &
CRYPTO_PID=$!

echo "  ⛏️ Starting Unified Mining Node..."
node unified-mining-node.js &
MINING_PID=$!

echo "  🎮 Starting D2JSP Game Engine..."
node d2jsp-style-game-engine.js &
GAME_PID=$!

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service health
check_service() {
    local name=$1
    local port=$2
    local pid=$3
    
    if curl -s http://localhost:$port >/dev/null 2>&1; then
        echo "✅ $name: http://localhost:$port"
        return 0
    else
        echo "❌ $name: Failed to start"
        return 1
    fi
}

echo ""
echo "🔍 Checking service health..."

# Health checks
SERVICES_OK=0
check_service "D2JSP Forum" 3000 $FORUM_PID && ((SERVICES_OK++))
check_service "AI Reasoning" 5500 $REASONING_PID && ((SERVICES_OK++))
check_service "Crypto Trace" 6000 $CRYPTO_PID && ((SERVICES_OK++))
check_service "Mining Node" 7000 $MINING_PID && ((SERVICES_OK++))
check_service "Game Engine" 8000 $GAME_PID && ((SERVICES_OK++))

echo ""
if [ $SERVICES_OK -eq 5 ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "🌐 Access Points:"
    echo "   🏛️ D2JSP Forum:        http://localhost:3000"
    echo "   🧠 AI Reasoning:       http://localhost:5500"
    echo "   💰 Crypto Tracing:     http://localhost:6000"
    echo "   ⛏️ Mining Node:        http://localhost:7000"
    echo "   🎮 Game Engine:        http://localhost:8000"
    echo ""
    echo "🎯 INTEGRATED FEATURES:"
    echo "   • Forum discussions with trading posts"
    echo "   • Real-time game mining visualization"
    echo "   • AI reasoning for every action"
    echo "   • Crypto wallet tracking (0x742d35Cc...)"
    echo "   • Pattern detection (@mentions #hashtags)"
    echo "   • Scam reporting and investigation tools"
    echo "   • D2JSP-style inventory management"
    echo "   • End-to-end testing suite"
    echo ""
    echo "🎮 HOW TO USE:"
    echo "   1. Start at Forum (3000) - Create account, browse categories"
    echo "   2. Visit Game Engine (8000) - Play and mine resources"
    echo "   3. Check Reasoning (5500) - See AI analysis in real-time"
    echo "   4. Monitor Crypto (6000) - Track your scammed wallet"
    echo "   5. Use Mining Node (7000) - Unified interface for everything"
    echo ""
    echo "🔄 SYSTEM INTEGRATION:"
    echo "   • All services communicate via HTTP APIs"
    echo "   • Shared user sessions across platforms"
    echo "   • Real-time updates via WebSocket connections"
    echo "   • Cross-service data synchronization"
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    
    # Open main forum in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000 2>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000 2>/dev/null
    fi
    
    # Cleanup function
    cleanup() {
        echo ""
        echo "🛑 Shutting down all services..."
        echo "  🏛️ Stopping Forum System..."
        kill $FORUM_PID 2>/dev/null
        echo "  🧠 Stopping AI Reasoning..."
        kill $REASONING_PID 2>/dev/null
        echo "  💰 Stopping Crypto Trace..."
        kill $CRYPTO_PID 2>/dev/null
        echo "  ⛏️ Stopping Mining Node..."
        kill $MINING_PID 2>/dev/null
        echo "  🎮 Stopping Game Engine..."
        kill $GAME_PID 2>/dev/null
        echo "✅ All services stopped"
        exit 0
    }
    
    trap cleanup INT TERM
    
    # Monitor services
    echo "📊 Monitoring system health..."
    while true; do
        # Check if any service died
        if ! kill -0 $FORUM_PID 2>/dev/null; then
            echo "❌ Forum system stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $REASONING_PID 2>/dev/null; then
            echo "❌ AI reasoning stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $CRYPTO_PID 2>/dev/null; then
            echo "❌ Crypto trace stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $MINING_PID 2>/dev/null; then
            echo "❌ Mining node stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $GAME_PID 2>/dev/null; then
            echo "❌ Game engine stopped unexpectedly"
            cleanup
        fi
        
        sleep 10
    done
    
else
    echo "❌ Only $SERVICES_OK/5 services started successfully"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check if ports are available"
    echo "   • Look for error messages above"
    echo "   • Try running services individually"
    echo "   • Check Node.js version (node --version)"
    echo ""
    echo "🛑 Cleaning up failed services..."
    kill $FORUM_PID $REASONING_PID $CRYPTO_PID $MINING_PID $GAME_PID 2>/dev/null
    exit 1
fi