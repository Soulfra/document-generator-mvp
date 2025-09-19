#!/bin/bash

# 🏛️ COLOSSEUM TRADING ECOSYSTEM STARTUP
# 
# Launches the complete immersive trading experience:
# - Enhanced Multi-API Aggregator (real external data)
# - 360° Colosseum Interface (voice-controlled arena)
# - Grand Exchange Router (social trading)
# - CAL Brand Scanner (idea management)

set -e

echo "🏛️ STARTING COLOSSEUM TRADING ECOSYSTEM"
echo "======================================="
echo ""

# Change to project directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Set up environment variables
export NODE_ENV="${NODE_ENV:-development}"
export DOCUMENT_ENCRYPTION_KEY="${DOCUMENT_ENCRYPTION_KEY:-colosseum-2025}"

# API Keys (optional - will use mock data if not provided)
if [ -z "$COINGECKO_API_KEY" ]; then
    echo "⚠️  COINGECKO_API_KEY not set, using free tier"
fi

if [ -z "$ALPHA_VANTAGE_API_KEY" ]; then
    echo "⚠️  ALPHA_VANTAGE_API_KEY not set, using demo data"
    export ALPHA_VANTAGE_API_KEY="demo"
fi

if [ -z "$OPENWEATHER_API_KEY" ]; then
    echo "⚠️  OPENWEATHER_API_KEY not set, using mock weather"
fi

if [ -z "$NEWS_API_KEY" ]; then
    echo "⚠️  NEWS_API_KEY not set, using mock news"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    npm install axios ws express redis node-cron
fi

# Check if required packages are installed
if ! npm list axios ws express node-cron >/dev/null 2>&1; then
    echo "📦 Installing missing dependencies..."
    npm install axios ws express redis node-cron
fi

# Create necessary directories
mkdir -p logs
mkdir -p data/trading
mkdir -p data/colosseum
mkdir -p data/api-cache

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo "❌ Port $port is already in use"
        return 1
    fi
    return 0
}

# Check all required ports
echo "🔍 Checking ports..."
check_port 8888 || { echo "Enhanced API port 8888 is busy"; exit 1; }
check_port 8887 || { echo "Enhanced WebSocket port 8887 is busy"; exit 1; }
check_port 9999 || { echo "Grand Exchange API port 9999 is busy"; exit 1; }
check_port 9998 || { echo "Grand Exchange WebSocket port 9998 is busy"; exit 1; }

# Start Redis if available
if command -v redis-server >/dev/null 2>&1; then
    echo "🔴 Starting Redis server..."
    redis-server --daemonize yes --port 6379 >/dev/null 2>&1 || true
    sleep 2
else
    echo "⚠️  Redis not found, using in-memory cache"
fi

echo ""
echo "🚀 Starting services..."

# Start Enhanced Multi-API Aggregator
echo "🌐 Starting Enhanced Multi-API Aggregator..."
node enhanced-multi-api-aggregator.js > logs/enhanced-api-aggregator.log 2>&1 &
API_PID=$!
echo "✅ Enhanced API Aggregator started (PID: $API_PID)"

# Wait for API aggregator to initialize
sleep 3

# Check if API aggregator is running
if ! kill -0 $API_PID 2>/dev/null; then
    echo "❌ Enhanced API Aggregator failed to start"
    cat logs/enhanced-api-aggregator.log
    exit 1
fi

# Start Grand Exchange Router
echo "🏛️ Starting Grand Exchange Router..."
node grand-exchange-router.js > logs/grand-exchange.log 2>&1 &
GE_PID=$!
echo "✅ Grand Exchange Router started (PID: $GE_PID)"

# Wait for Grand Exchange to initialize
sleep 2

# Check if Grand Exchange is running
if ! kill -0 $GE_PID 2>/dev/null; then
    echo "❌ Grand Exchange Router failed to start"
    cat logs/grand-exchange.log
    exit 1
fi

# Start CAL Brand Scanner
echo "🎯 Starting CAL Brand Scanner..."
node cal-brand-scanner.js > logs/cal-scanner.log 2>&1 &
CAL_PID=$!
echo "✅ CAL Brand Scanner started (PID: $CAL_PID)"

# Create HTML file paths for opening
COLOSSEUM_PATH="file://$PROJECT_ROOT/colosseum-360-interface.html"
DASHBOARD_PATH="file://$PROJECT_ROOT/grand-exchange-dashboard.html"

# Open interfaces in browser (if available)
if command -v open >/dev/null 2>&1; then
    echo "🌐 Opening Colosseum interface..."
    sleep 3
    open "$COLOSSEUM_PATH"
    
    echo "📊 Opening Grand Exchange dashboard..."
    sleep 2
    open "$DASHBOARD_PATH"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$COLOSSEUM_PATH"
    xdg-open "$DASHBOARD_PATH"
fi

echo ""
echo "✅ COLOSSEUM TRADING ECOSYSTEM RUNNING!"
echo "======================================="
echo ""
echo "🏛️ Services:"
echo "   Enhanced API Aggregator: http://localhost:8888"
echo "   Enhanced WebSocket: ws://localhost:8887"
echo "   Grand Exchange API: http://localhost:9999"
echo "   Grand Exchange WebSocket: ws://localhost:9998"
echo ""
echo "🎮 Interfaces:"
echo "   🏛️ 360° Colosseum: $COLOSSEUM_PATH"
echo "   📊 Grand Exchange: $DASHBOARD_PATH"
echo ""
echo "💰 Trading Features:"
echo "   🎣 Fishing spots: Click blue ripples for profit opportunities"
echo "   💣 TNT barrels: High-risk/high-reward volatile trades"
echo "   ⚔️ Gladiator battles: Real-time price movements trigger fights"
echo "   🎤 Voice commands: 'Buy Bitcoin', 'Select Ethereum', 'Bet 100'"
echo ""
echo "🎯 Voice Commands:"
echo "   - 'Buy [amount]' or 'Champion rises'"
echo "   - 'Sell [amount]' or 'Champion falls'"
echo "   - 'Select [gladiator name]'"
echo "   - 'Bet [amount]'"
echo "   - 'Rotate left/right'"
echo ""
echo "⌨️ Keyboard Shortcuts:"
echo "   B = Buy, S = Sell, V = Voice toggle"
echo "   Arrow keys = Rotate camera view"
echo ""
echo "📊 Real-Time Data Sources:"
echo "   🪙 Crypto: CoinGecko API (Bitcoin, Ethereum, Solana, Doge)"
echo "   📈 Stocks: Alpha Vantage API (AAPL, GOOGL, TSLA, MSFT, NVDA)"
echo "   🏈 Sports: ESPN API (NFL scores and team stats)"
echo "   🎰 Betting: DraftKings, FanDuel, Vegas Odds API"
echo "   🌤️ Weather: OpenWeather API (stadium conditions)"
echo "   📰 News: NewsAPI (market sentiment analysis)"
echo "   🎯 Gaming: Arbitrage detection, Kelly Criterion analysis"
echo ""
echo "🎮 Game Mechanics:"
echo "   🏆 Start with 1000 gold"
echo "   📈 70% win rate on regular trades"
echo "   🎣 Fishing: 85% success rate, 10-110 gold + market bonuses"
echo "   💣 TNT: 70% win rate, 200-700 gold + volatility bonuses"
echo "   ⚡ Real arbitrage opportunities from live betting data"
echo "   🎪 Crowd mood changes with market sentiment"
echo ""
echo "📚 API Health Checks:"
echo "   Enhanced API: curl http://localhost:8888/health"
echo "   Grand Exchange: curl http://localhost:9999/health"
echo ""
echo "📄 View Logs:"
echo "   Enhanced API: tail -f logs/enhanced-api-aggregator.log"
echo "   Grand Exchange: tail -f logs/grand-exchange.log"
echo "   CAL Scanner: tail -f logs/cal-scanner.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Colosseum Trading Ecosystem..."
    
    # Kill all services
    echo "🛑 Stopping Enhanced API Aggregator..."
    kill $API_PID 2>/dev/null || true
    
    echo "🛑 Stopping Grand Exchange Router..."
    kill $GE_PID 2>/dev/null || true
    
    echo "🛑 Stopping CAL Brand Scanner..."
    kill $CAL_PID 2>/dev/null || true
    
    # Wait for processes to stop gracefully
    sleep 3
    
    # Force kill if still running
    kill -9 $API_PID $GE_PID $CAL_PID 2>/dev/null || true
    
    echo "✅ All services stopped"
    echo "🏛️ May the gods of profit smile upon your return to the arena!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes and monitor health
while true; do
    # Check if any service died
    if ! kill -0 $API_PID 2>/dev/null; then
        echo "❌ Enhanced API Aggregator died, restarting..."
        node enhanced-multi-api-aggregator.js > logs/enhanced-api-aggregator.log 2>&1 &
        API_PID=$!
    fi
    
    if ! kill -0 $GE_PID 2>/dev/null; then
        echo "❌ Grand Exchange Router died, restarting..."
        node grand-exchange-router.js > logs/grand-exchange.log 2>&1 &
        GE_PID=$!
    fi
    
    if ! kill -0 $CAL_PID 2>/dev/null; then
        echo "❌ CAL Brand Scanner died, restarting..."
        node cal-brand-scanner.js > logs/cal-scanner.log 2>&1 &
        CAL_PID=$!
    fi
    
    sleep 30
done