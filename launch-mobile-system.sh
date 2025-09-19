#!/bin/bash

echo "📱 💳 🎮 LAUNCHING COMPLETE MOBILE D2JSP SYSTEM"
echo "==============================================="
echo ""
echo "🎯 System Components:"
echo "  ✅ Mobile Wallet App (port 9001) - Main mobile interface"
echo "  ✅ D2JSP Forum System (port 3000) - Community & trading"
echo "  ✅ Game Engine with Reasoning (port 8000) - Interactive gameplay"
echo "  ✅ Unified Mining Node (port 7000) - Integrated mining"
echo "  ✅ Crypto Tracing (port 6000) - Wallet monitoring"
echo "  ✅ AI Reasoning Dashboard (port 5500) - AI analysis"
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
kill_port 9001  # Mobile App

sleep 2

echo ""
echo "🚀 Starting all services (mobile-first)..."

# Start backend services first
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

# Wait for backend services
echo "  ⏳ Waiting for backend services..."
sleep 5

# Start mobile app last (so it can connect to services)
echo "  📱 Starting Mobile Wallet App..."
node mobile-wallet-app.js &
MOBILE_PID=$!

# Wait for mobile app to start
echo ""
echo "⏳ Waiting for mobile app to initialize..."
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
check_service "Mobile Wallet App" 9001 $MOBILE_PID && ((SERVICES_OK++))

echo ""
if [ $SERVICES_OK -eq 6 ]; then
    echo "🎉 ALL MOBILE SYSTEMS OPERATIONAL!"
    echo ""
    echo "📱 PRIMARY ACCESS (Mobile-Optimized):"
    echo "   🌟 Mobile Wallet App:   http://localhost:9001"
    echo ""
    echo "🖥️ DESKTOP ACCESS (Full Features):"
    echo "   🏛️ D2JSP Forum:        http://localhost:3000"
    echo "   🧠 AI Reasoning:       http://localhost:5500"
    echo "   💰 Crypto Tracing:     http://localhost:6000"
    echo "   ⛏️ Mining Node:        http://localhost:7000"
    echo "   🎮 Game Engine:        http://localhost:8000"
    echo ""
    echo "📱 MOBILE FEATURES:"
    echo "   💳 Crypto Wallet Integration"
    echo "     • Send/receive cryptocurrency"
    echo "     • Track scammed wallet (0x742d35Cc...)"
    echo "     • Secure offline storage"
    echo "     • Export wallet functionality"
    echo ""
    echo "   ⛏️ Mobile Gaming"
    echo "     • Quick mining actions"
    echo "     • Real-time character stats"
    echo "     • Touch-friendly interface"
    echo "     • Inventory management"
    echo ""
    echo "   🏛️ Forum Access"
    echo "     • Browse trading posts"
    echo "     • Create new posts"
    echo "     • Mobile-optimized layout"
    echo "     • Real-time updates"
    echo ""
    echo "   🧠 AI Insights"
    echo "     • Teacher/Guardian/Companion AI"
    echo "     • Real-time reasoning display"
    echo "     • Confidence scoring"
    echo "     • Interactive AI chat"
    echo ""
    echo "   🔔 Push Notifications"
    echo "     • Trading alerts"
    echo "     • Mining completion"
    echo "     • Crypto movement alerts"
    echo "     • Forum replies"
    echo ""
    echo "   📡 Offline Capability"
    echo "     • Works without internet"
    echo "     • Local data caching"
    echo "     • Auto-sync when online"
    echo "     • Persistent wallet storage"
    echo ""
    echo "📱 MOBILE USAGE:"
    echo "   1. Open http://localhost:9001 on any device"
    echo "   2. Add to home screen for native app feel"
    echo "   3. Use tabs: Wallet | Game | Forum | AI | Settings"
    echo "   4. Tap actions for instant feedback"
    echo "   5. System auto-syncs every 30 seconds"
    echo ""
    echo "🔄 SYSTEM INTEGRATION:"
    echo "   • Mobile app proxies all backend services"
    echo "   • Cross-platform user sessions"
    echo "   • Real-time WebSocket connections"
    echo "   • Progressive Web App (PWA) ready"
    echo "   • Touch and swipe gestures"
    echo ""
    echo "🔐 SECURITY:"
    echo "   • Encrypted private key storage"
    echo "   • Secure wallet generation"
    echo "   • Safe transaction handling"
    echo "   • Anonymous crypto tracking"
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    
    # Open mobile app in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        echo "🚀 Opening mobile app in browser..."
        open http://localhost:9001 2>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:9001 2>/dev/null
    fi
    
    # Show QR code for mobile access (if available)
    if command -v qr >/dev/null 2>&1; then
        echo ""
        echo "📱 QR Code for mobile access:"
        echo "http://localhost:9001" | qr
    fi
    
    # Cleanup function
    cleanup() {
        echo ""
        echo "🛑 Shutting down all mobile systems..."
        echo "  📱 Stopping Mobile Wallet App..."
        kill $MOBILE_PID 2>/dev/null
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
        echo "✅ All mobile systems stopped"
        exit 0
    }
    
    trap cleanup INT TERM
    
    # Monitor services
    echo "📊 Monitoring mobile system health..."
    while true; do
        # Check if any service died
        if ! kill -0 $MOBILE_PID 2>/dev/null; then
            echo "❌ Mobile wallet app stopped unexpectedly"
            cleanup
        fi
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
    echo "❌ Only $SERVICES_OK/6 services started successfully"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check if ports are available"
    echo "   • Look for error messages above"
    echo "   • Try running services individually"
    echo "   • Check Node.js version (node --version)"
    echo "   • Ensure all files are present"
    echo ""
    echo "🛑 Cleaning up failed services..."
    kill $MOBILE_PID $FORUM_PID $REASONING_PID $CRYPTO_PID $MINING_PID $GAME_PID 2>/dev/null
    exit 1
fi