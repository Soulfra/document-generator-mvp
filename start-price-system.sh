#!/bin/bash

# Start Price System - Connects all existing components
# This script starts the price aggregation system in the correct order

echo "🚀 Starting Complete Price System..."
echo "=================================="

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "crypto-data-aggregator.js" 2>/dev/null
pkill -f "flask-price-api.py" 2>/dev/null
pkill -f "data-fetcher/index.js" 2>/dev/null
pkill -f "dashboard-integration-bridge.js" 2>/dev/null
sleep 2

# 1. Start crypto-data-aggregator (WebSocket on 47003)
echo ""
echo "1️⃣ Starting Crypto Data Aggregator..."
echo "   • Multi-source price aggregation"
echo "   • WebSocket server on port 47003"
node crypto-data-aggregator.js > logs/crypto-aggregator.log 2>&1 &
AGGREGATOR_PID=$!
echo "   ✅ Started (PID: $AGGREGATOR_PID)"
sleep 3

# 2. Start Flask API wrapper (REST API on 5000)
echo ""
echo "2️⃣ Starting Flask Price API..."
echo "   • REST API wrapper on port 5000"
echo "   • Connects to WebSocket aggregator"
python3 flask-price-api.py > logs/flask-api.log 2>&1 &
FLASK_PID=$!
echo "   ✅ Started (PID: $FLASK_PID)"
sleep 3

# 3. Start data-fetcher service (backward compatibility on 3011)
echo ""
echo "3️⃣ Starting Data Fetcher Service..."
echo "   • API on port 3011"
echo "   • WebSocket on port 3010"
cd services/data-fetcher && node index.js > ../../logs/data-fetcher.log 2>&1 &
FETCHER_PID=$!
cd ../..
echo "   ✅ Started (PID: $FETCHER_PID)"
sleep 2

# 4. Start dashboard integration bridge (on 3012)
echo ""
echo "4️⃣ Starting Dashboard Integration Bridge..."
echo "   • Bridge API on port 3012"
echo "   • Connects 569 dashboards to real prices"
node dashboard-integration-bridge.js > logs/bridge.log 2>&1 &
BRIDGE_PID=$!
echo "   ✅ Started (PID: $BRIDGE_PID)"
sleep 2

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs for stop script
echo "AGGREGATOR_PID=$AGGREGATOR_PID" > .price-system.pids
echo "FLASK_PID=$FLASK_PID" >> .price-system.pids
echo "FETCHER_PID=$FETCHER_PID" >> .price-system.pids
echo "BRIDGE_PID=$BRIDGE_PID" >> .price-system.pids

# Test connections
echo ""
echo "🔍 Testing connections..."
sleep 3

# Test Flask API
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    echo "   ✅ Flask API is healthy"
else
    echo "   ❌ Flask API not responding"
fi

# Test data fetcher
if curl -s http://localhost:3011/health | grep -q "healthy"; then
    echo "   ✅ Data Fetcher is healthy"
else
    echo "   ❌ Data Fetcher not responding"
fi

# Test bridge
if curl -s http://localhost:3012/health | grep -q "healthy"; then
    echo "   ✅ Integration Bridge is healthy"
else
    echo "   ❌ Integration Bridge not responding"
fi

# Show current prices
echo ""
echo "📊 Current Prices:"
curl -s http://localhost:5000/api/dashboard/summary | python3 -m json.tool | grep -E "(btc|eth|scythe|tbow)" | head -4

echo ""
echo "✨ Price System Started Successfully!"
echo ""
echo "📡 Available endpoints:"
echo "   • WebSocket aggregator: ws://localhost:47003"
echo "   • Flask REST API: http://localhost:5000"
echo "   • Data Fetcher: http://localhost:3011"
echo "   • Dashboard Bridge: http://localhost:3012"
echo ""
echo "📊 View prices:"
echo "   • System Dashboard: http://localhost:8080/system-dashboard.html"
echo "   • Live Display: http://localhost:8080/live-price-display.html"
echo ""
echo "📝 Logs available in ./logs/"
echo ""
echo "To stop all services: ./stop-price-system.sh"