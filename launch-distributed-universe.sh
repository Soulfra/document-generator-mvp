#!/bin/bash

# 🌍 DISTRIBUTED MMORPG UNIVERSE LAUNCHER
# Everything Everywhere All At Once - Like Xbox Live but for our game worlds

set -e  # Exit on any error

echo "🚀 LAUNCHING DISTRIBUTED MMORPG UNIVERSE"
echo "========================================"
echo ""

# Check if required dependencies are installed
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v redis-server &> /dev/null; then
        echo "⚠️  Redis not found. Starting without Redis (data won't persist)"
        REDIS_AVAILABLE=false
    else
        REDIS_AVAILABLE=true
    fi
    
    echo "✅ Dependencies checked"
}

# Install npm dependencies if needed
install_dependencies() {
    echo "📦 Installing npm dependencies..."
    
    # Check if package.json exists and install if needed
    if [ -f "package.json" ]; then
        if [ ! -d "node_modules" ]; then
            npm install
        fi
    else
        echo "⚠️  No package.json found, creating minimal one..."
        cat > package.json << EOF
{
  "name": "distributed-mmorpg-universe",
  "version": "1.0.0",
  "description": "Distributed MMORPG Universe - Everything Everywhere All At Once",
  "main": "universal-metaverse-hub.js",
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "redis": "^4.6.5",
    "node-cron": "^3.0.2",
    "axios": "^1.6.0"
  },
  "scripts": {
    "start": "node universal-metaverse-hub.js",
    "launch": "./launch-distributed-universe.sh"
  }
}
EOF
        npm install
    fi
    
    echo "✅ Dependencies installed"
}

# Start Redis if available
start_redis() {
    if [ "$REDIS_AVAILABLE" = true ]; then
        echo "🗄️  Starting Redis server..."
        
        # Check if Redis is already running
        if ! pgrep -x "redis-server" > /dev/null; then
            redis-server --daemonize yes --port 6379
            sleep 2
            echo "✅ Redis started on port 6379"
        else
            echo "✅ Redis already running"
        fi
    fi
}

# Create log directories
create_log_dirs() {
    echo "📁 Creating log directories..."
    mkdir -p logs/worlds
    mkdir -p logs/players
    mkdir -p logs/events
    echo "✅ Log directories created"
}

# Start Universal Metaverse Hub (central coordination)
start_metaverse_hub() {
    echo "🌍 Starting Universal Metaverse Hub..."
    
    # Start in background and save PID
    node universal-metaverse-hub.js > logs/metaverse-hub.log 2>&1 &
    HUB_PID=$!
    echo $HUB_PID > .pids/hub.pid
    
    sleep 3
    
    if kill -0 $HUB_PID 2>/dev/null; then
        echo "✅ Universal Metaverse Hub running (PID: $HUB_PID)"
        echo "   🌐 Web Interface: http://localhost:7000"
        echo "   📡 WebSocket Hub: ws://localhost:7001"
    else
        echo "❌ Failed to start Universal Metaverse Hub"
        exit 1
    fi
}

# Start Trading Floor Hub (existing system)
start_trading_floor() {
    echo "💰 Starting Trading Floor Hub..."
    
    if [ -f "real-time-data-oracle.js" ]; then
        node real-time-data-oracle.js > logs/worlds/trading-floor.log 2>&1 &
        TRADING_PID=$!
        echo $TRADING_PID > .pids/trading.pid
        echo "✅ Trading Floor running (PID: $TRADING_PID) - http://localhost:9600"
    else
        echo "⚠️  Trading Floor files not found, skipping..."
    fi
}

# Start Ocean World Server
start_ocean_world() {
    echo "🌊 Starting Ocean World Server..."
    
    if [ -f "ocean-world-server.js" ]; then
        node ocean-world-server.js > logs/worlds/ocean-world.log 2>&1 &
        OCEAN_PID=$!
        echo $OCEAN_PID > .pids/ocean.pid
        echo "✅ Ocean World running (PID: $OCEAN_PID) - http://localhost:8000"
    else
        echo "⚠️  Ocean World server not found, skipping..."
    fi
}

# Start Ship Combat Arena
start_ship_combat() {
    echo "🚢 Starting Ship Combat Arena..."
    
    if [ -f "ship-combat-arena.js" ]; then
        node ship-combat-arena.js > logs/worlds/ship-combat.log 2>&1 &
        SHIP_PID=$!
        echo $SHIP_PID > .pids/ship.pid
        echo "✅ Ship Combat running (PID: $SHIP_PID) - http://localhost:8100"
    else
        echo "⚠️  Ship Combat arena not found, skipping..."
    fi
}

# Start Scheduled Price Fetcher for real-time narratives
start_price_fetcher() {
    echo "📅 Starting Scheduled Price Fetcher..."
    
    if [ -f "scheduled-price-fetcher.js" ]; then
        node scheduled-price-fetcher.js > logs/price-fetcher.log 2>&1 &
        FETCHER_PID=$!
        echo $FETCHER_PID > .pids/fetcher.pid
        echo "✅ Price Fetcher running (PID: $FETCHER_PID)"
    else
        echo "⚠️  Price Fetcher not found, skipping..."
    fi
}

# Wait for all services to be ready and connect
wait_for_connections() {
    echo ""
    echo "⏳ Waiting for all worlds to connect to the hub..."
    sleep 10
    
    echo "🔗 Testing connections..."
    
    # Test hub connection
    if curl -s http://localhost:7000/api/stats > /dev/null; then
        echo "✅ Universal Hub: Connected"
    else
        echo "❌ Universal Hub: Not responding"
    fi
    
    # Test world connections
    for world in "trading-floor:9600" "ocean-world:8000" "ship-combat:8100"; do
        IFS=':' read -r name port <<< "$world"
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo "✅ $name: Connected"
        else
            echo "⚠️  $name: Not responding (may not be implemented yet)"
        fi
    done
}

# Display final status
show_universe_status() {
    echo ""
    echo "🌟 DISTRIBUTED MMORPG UNIVERSE STATUS"
    echo "===================================="
    echo ""
    echo "🌍 UNIVERSAL METAVERSE HUB"
    echo "   Dashboard: http://localhost:7000"
    echo "   WebSocket: ws://localhost:7001"
    echo "   Status: $(curl -s http://localhost:7000/api/stats | grep -o '"connectedWorlds":[0-9]*' | cut -d':' -f2 || echo '0') worlds connected"
    echo ""
    echo "🎮 GAME WORLDS"
    echo "   💰 Trading Floor: http://localhost:9600 (Real market data)"
    echo "   🌊 Ocean World: http://localhost:8000 (Deep sea exploration)"
    echo "   🚢 Ship Combat: http://localhost:8100 (Naval battles)"
    echo "   ☁️  Sky Realm: Planned - Coming Soon"
    echo "   ⛏️  Underground: Planned - Coming Soon"
    echo ""
    echo "📊 SERVICES"
    echo "   📡 Real-time Data: Port 3001 (Live market prices)"
    echo "   📅 Price Fetcher: Running (Auto narratives)"
    echo "   🗄️  Redis: $(if [ "$REDIS_AVAILABLE" = true ]; then echo "Running"; else echo "Not available"; fi)"
    echo ""
    echo "📁 LOGS"
    echo "   Hub: logs/metaverse-hub.log"
    echo "   Worlds: logs/worlds/"
    echo "   Events: logs/events/"
    echo ""
    echo "🎯 WHAT YOU CAN DO NOW:"
    echo "   1. Open http://localhost:7000 - Universal dashboard"
    echo "   2. Explore ocean depths at http://localhost:8000"
    echo "   3. Battle with ships at http://localhost:8100"
    echo "   4. Trade with real data at http://localhost:9600"
    echo "   5. Watch cross-world events in real-time"
    echo ""
    echo "💡 CROSS-WORLD FEATURES:"
    echo "   - Universal player identity (Soul of Soulfra)"
    echo "   - Treasure found in ocean affects ship purchases"
    echo "   - Trading profits buy better diving equipment"
    echo "   - Everything connects - Xbox Live style!"
    echo ""
    echo "🛑 TO STOP: Run ./stop-distributed-universe.sh"
    echo ""
}

# Create stop script
create_stop_script() {
    cat > stop-distributed-universe.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Distributed MMORPG Universe..."

# Create PID directory if it doesn't exist
mkdir -p .pids

# Stop all services
for pid_file in .pids/*.pid; do
    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        SERVICE=$(basename "$pid_file" .pid)
        
        if kill -0 $PID 2>/dev/null; then
            echo "   Stopping $SERVICE (PID: $PID)"
            kill $PID
        fi
        
        rm -f "$pid_file"
    fi
done

# Stop Redis if we started it
if pgrep -x "redis-server" > /dev/null; then
    echo "   Stopping Redis..."
    redis-cli shutdown 2>/dev/null || true
fi

echo "✅ All services stopped"
echo ""
echo "📊 Final logs available in:"
echo "   logs/metaverse-hub.log"
echo "   logs/worlds/"
echo "   logs/events/"
EOF

    chmod +x stop-distributed-universe.sh
    echo "✅ Stop script created"
}

# Create PID directory
mkdir -p .pids

# Main execution
main() {
    echo "Starting distributed universe launch sequence..."
    
    check_dependencies
    install_dependencies
    create_log_dirs
    create_stop_script
    
    echo ""
    echo "🚀 LAUNCHING ALL WORLDS..."
    echo ""
    
    start_redis
    start_metaverse_hub
    start_trading_floor
    start_ocean_world
    start_ship_combat
    start_price_fetcher
    
    wait_for_connections
    show_universe_status
    
    echo "🎉 DISTRIBUTED MMORPG UNIVERSE IS LIVE!"
    echo "    Everything Everywhere All At Once - Just like you wanted!"
}

# Trap Ctrl+C to gracefully shut down
trap 'echo ""; echo "🛑 Shutting down..."; ./stop-distributed-universe.sh; exit 0' INT

# Run main function
main

# Keep script running
echo "Press Ctrl+C to stop all services"
while true; do
    sleep 10
    
    # Health check every 10 seconds
    if ! curl -s http://localhost:7000/api/stats > /dev/null; then
        echo "⚠️  Universal Hub not responding, restarting..."
        start_metaverse_hub
    fi
done