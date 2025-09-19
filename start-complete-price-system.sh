#!/bin/bash

# Complete Price System Startup Script
# Starts all price-related services with proper database integration

echo "🚀 Starting Complete Price System with Database Integration..."
echo "====================================================="

# Create logs directory
mkdir -p logs

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "crypto-data-aggregator.js" 2>/dev/null
pkill -f "flask-price-api.py" 2>/dev/null
pkill -f "data-fetcher/index.js" 2>/dev/null
pkill -f "dashboard-integration-bridge.js" 2>/dev/null
pkill -f "manual-fetch-api.js" 2>/dev/null
sleep 2

# Check if Redis is running
echo ""
echo "🔍 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running!"
    echo "   Please start Redis with: redis-server"
    exit 1
else
    echo "✅ Redis is running"
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "   Please start PostgreSQL or run: docker-compose up -d postgres"
    exit 1
else
    echo "✅ PostgreSQL is running"
fi

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

# 5. Start manual fetch API (on 3013)
echo ""
echo "5️⃣ Starting Manual Fetch API..."
echo "   • Manual fetch endpoints on port 3013"
echo "   • Rate limiting and cost tracking"
echo "   • Redis caching + PostgreSQL storage"
node manual-fetch-api.js > logs/manual-fetch.log 2>&1 &
MANUAL_PID=$!
echo "   ✅ Started (PID: $MANUAL_PID)"
sleep 3

# Save PIDs for stop script
echo "AGGREGATOR_PID=$AGGREGATOR_PID" > .price-system.pids
echo "FLASK_PID=$FLASK_PID" >> .price-system.pids
echo "FETCHER_PID=$FETCHER_PID" >> .price-system.pids
echo "BRIDGE_PID=$BRIDGE_PID" >> .price-system.pids
echo "MANUAL_PID=$MANUAL_PID" >> .price-system.pids

# Test connections
echo ""
echo "🔍 Testing all services..."
sleep 3

ALL_HEALTHY=true

# Test Flask API
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    echo "   ✅ Flask API is healthy"
else
    echo "   ❌ Flask API not responding"
    ALL_HEALTHY=false
fi

# Test data fetcher
if curl -s http://localhost:3011/health | grep -q "healthy"; then
    echo "   ✅ Data Fetcher is healthy"
else
    echo "   ❌ Data Fetcher not responding"
    ALL_HEALTHY=false
fi

# Test bridge
if curl -s http://localhost:3012/health | grep -q "healthy"; then
    echo "   ✅ Integration Bridge is healthy"
else
    echo "   ❌ Integration Bridge not responding"
    ALL_HEALTHY=false
fi

# Test manual fetch API
if curl -s http://localhost:3013/health | grep -q "healthy"; then
    echo "   ✅ Manual Fetch API is healthy"
    # Show cache stats
    CACHE_STATS=$(curl -s http://localhost:3013/health | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Cache: {data.get('cache_stats', {}).get('total_keys', 0)} keys\")")
    echo "      $CACHE_STATS"
else
    echo "   ❌ Manual Fetch API not responding"
    ALL_HEALTHY=false
fi

# Show current prices
if [ "$ALL_HEALTHY" = true ]; then
    echo ""
    echo "📊 Fetching current prices..."
    sleep 2
    
    # Try to get prices from Flask API
    PRICES=$(curl -s http://localhost:5000/api/dashboard/summary 2>/dev/null)
    if [ $? -eq 0 ] && [ ! -z "$PRICES" ]; then
        echo "$PRICES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"   BTC: {data['crypto']['btc']}\")
    print(f\"   ETH: {data['crypto']['eth']}\")
    print(f\"   Scythe: {data['gaming']['scythe']}\")
    print(f\"   T-bow: {data['gaming']['tbow']}\")
except:
    print('   (Prices loading...)')
"
    else
        echo "   (Waiting for prices to load...)"
    fi
fi

echo ""
echo "✨ Complete Price System Started!"
echo ""
echo "📡 Service Endpoints:"
echo "   • WebSocket Aggregator: ws://localhost:47003"
echo "   • Flask REST API: http://localhost:5000"
echo "   • Data Fetcher: http://localhost:3011"
echo "   • Dashboard Bridge: http://localhost:3012"
echo "   • Manual Fetch API: http://localhost:3013"
echo ""
echo "💾 Data Storage:"
echo "   • Redis Cache: localhost:6379 (fast access)"
echo "   • PostgreSQL: localhost:5432 (historical data)"
echo ""
echo "📊 Dashboards:"
echo "   • System Dashboard: http://localhost:8080/system-dashboard.html"
echo "   • Live Display: http://localhost:8080/live-price-display.html"
echo "   • Manual fetch buttons available on dashboards"
echo ""
echo "💰 API Costs: $0.00/month (all FREE tier APIs)"
echo ""
echo "📝 Logs: ./logs/"
echo "🛑 Stop: ./stop-price-system.sh"
echo ""

if [ "$ALL_HEALTHY" = false ]; then
    echo "⚠️  Warning: Some services failed to start properly"
    echo "   Check logs for details: tail -f logs/*.log"
fi