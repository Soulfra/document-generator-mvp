#!/bin/bash

# LAUNCH LIVE TRADING PLATFORM
# Starts the real functional trading platform with live APIs

set -e

echo "🚀 LAUNCHING LIVE TRADING PLATFORM"
echo "=================================="
echo "🎯 Real APIs: OSRS Wiki, CoinGecko, WoW Token"
echo "💰 Functional trading with profit calculations"
echo "📊 Portfolio management and alerts"
echo "🔗 Integration with Unified Economy system"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "live-trading-api-connector.js" ]; then
    echo "❌ live-trading-api-connector.js not found. Please run from the correct directory."
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install express ws cors axios || {
        echo "⚠️ npm install failed, trying with basic requires..."
    }
fi

# Check if your Unified Economy is running
echo "🔍 Checking for Unified Economy system..."
if [ -f "UNIFIED-API-ECONOMY-INTEGRATION.js" ]; then
    echo "✅ Found Unified Economy integration"
else
    echo "⚠️ Unified Economy integration not found - running in standalone mode"
fi

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3050 | xargs kill -9 2>/dev/null || true
lsof -ti:8083 | xargs kill -9 2>/dev/null || true

# Start the live trading platform
echo "🚀 Starting Live Trading Platform..."
echo ""

# Test API connections first
echo "🧪 Testing API connections..."
node live-trading-api-connector.js test-apis

echo ""
echo "🎯 Starting main platform..."

# Start in background and show the output
node live-trading-api-connector.js start &
PLATFORM_PID=$!

# Wait a moment for startup
sleep 3

# Check if it started successfully
if kill -0 $PLATFORM_PID 2>/dev/null; then
    echo ""
    echo "✅ LIVE TRADING PLATFORM STARTED SUCCESSFULLY!"
    echo ""
    echo "🔗 Access Points:"
    echo "   📊 Trading Interface: http://localhost:3050"
    echo "   🔌 WebSocket Feed: ws://localhost:8083"
    echo "   📡 API Status: http://localhost:3050/api/status"
    echo "   💰 Live Prices: http://localhost:3050/api/prices/osrs"
    echo ""
    echo "🎮 Features:"
    echo "   🎯 Real price feeds from OSRS Wiki, CoinGecko"
    echo "   💰 Live profit calculations and margin analysis"
    echo "   📊 Portfolio management with real-time P&L"
    echo "   🔔 Price alerts and notifications"
    echo "   🎮 Multi-mode interface (Gaming/Crypto/Business)"
    echo "   🔗 Integration with your Unified Economy system"
    echo ""
    echo "💡 Quick Test Commands:"
    echo "   curl http://localhost:3050/api/status"
    echo "   curl http://localhost:3050/api/prices/crypto"
    echo "   curl http://localhost:3050/api/search?q=bitcoin"
    echo ""
    echo "🎯 This is a FUNCTIONAL trading platform!"
    echo "   You can make real trading decisions with live API data"
    echo "   Search across all markets for arbitrage opportunities"
    echo "   Calculate actual profit margins for merching/flipping"
    echo ""
    echo "Press Ctrl+C to stop the platform"
    
    # Show live logs
    wait $PLATFORM_PID
else
    echo "❌ Failed to start the platform"
    exit 1
fi