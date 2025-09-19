#!/bin/bash

# ⚔️📡🎮 BOSS BATTLE SYSTEM LAUNCHER
# Quick start script for the complete boss submission and battle streaming system

echo "⚔️📡🎮 Boss Battle System Launcher"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting Boss Battle System components..."
echo ""

# Function to start a service in the background
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    
    echo "🔧 Starting $service_name on port $port..."
    
    # Kill existing process on port if running
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Start the service
    $command &
    local pid=$!
    echo "  ✅ $service_name started (PID: $pid)"
    
    # Store PID for cleanup
    echo $pid >> /tmp/boss-battle-pids.tmp
}

# Create PID file for cleanup
rm -f /tmp/boss-battle-pids.tmp
touch /tmp/boss-battle-pids.tmp

echo "Starting core services:"
echo ""

# Start Boss Submission API (port 4200)
start_service "Boss Submission API" "node boss-submission-api.js" 4200

# Start Real-Time Battle Streaming (port 8081 WebSocket, uses API on 4200)
start_service "Battle Streaming Server" "node real-time-battle-streaming.js" 8081

# Wait for services to initialize
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check if services are running
echo ""
echo "🔍 Checking service status..."

check_service() {
    local name=$1
    local port=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "  ✅ $name is running on port $port"
        return 0
    else
        echo "  ❌ $name failed to start on port $port"
        return 1
    fi
}

services_ok=true

if ! check_service "Boss Submission API" 4200; then
    services_ok=false
fi

if ! check_service "Battle Streaming WebSocket" 8081; then
    services_ok=false
fi

echo ""

if [ "$services_ok" = true ]; then
    echo "🎉 All services are running successfully!"
    echo ""
    echo "📍 Service URLs:"
    echo "  🔗 Boss Submission API: http://localhost:4200"
    echo "  🔗 Boss API Health: http://localhost:4200/health"
    echo "  🔗 Boss Templates: http://localhost:4200/api/templates"
    echo "  🔗 Boss Gallery: http://localhost:4200/api/bosses"
    echo "  🔗 Leaderboards: http://localhost:4200/api/leaderboards"
    echo "  📡 Battle Stream WebSocket: ws://localhost:8081"
    echo ""
    echo "🌐 Open the web dashboard:"
    echo "  file://$(pwd)/boss-battle-dashboard.html"
    echo ""
    
    # Try to open the dashboard automatically
    if command -v open &> /dev/null; then
        echo "🚀 Opening dashboard in your default browser..."
        open "boss-battle-dashboard.html"
    elif command -v xdg-open &> /dev/null; then
        echo "🚀 Opening dashboard in your default browser..."
        xdg-open "boss-battle-dashboard.html"
    else
        echo "💡 Manually open boss-battle-dashboard.html in your browser"
    fi
    
    echo ""
    echo "⚔️ System Features:"
    echo "  • Submit custom bosses with validation"
    echo "  • RuneScape-style tile-based combat (10-tile aggro)"
    echo "  • Real-time battle streaming via WebSocket"
    echo "  • Live battle viewer with grid visualization"
    echo "  • AI agents automatically fight submitted bosses"
    echo "  • Boss leaderboards and statistics"
    echo "  • Revenue sharing system for boss creators"
    echo ""
    echo "👑 Kingdom Authority Features:"
    echo "  • Reddit-style hierarchical authority (Exile → King)"
    echo "  • Kingdom creation when bosses are submitted"
    echo "  • Quest system with battle predictions"
    echo "  • Reputation-based authority progression"
    echo "  • Democratic validation with weighted voting"
    echo "  • Cross-kingdom interactions and politics"
    echo ""
    echo "🎮 How to Use:"
    echo "  1. Open the web dashboard"
    echo "  2. Create a boss using the form or templates (becomes your kingdom)"
    echo "  3. Click 'Connect to Stream' to watch live battles"
    echo "  4. Create quests to predict battle outcomes"
    echo "  5. Make predictions to gain/lose reputation and authority"
    echo "  6. Vote on battle fairness to participate in democratic validation"
    echo "  7. Build your kingdom's reputation and appoint knights/lords"
    echo ""
    echo "🧪 To run the full Kingdom Authority demo:"
    echo "  node kingdom-authority-demo.js"
    echo ""
    echo "⏹️  To stop all services, press Ctrl+C"
    
    # Handle cleanup on exit
    cleanup() {
        echo ""
        echo "🛑 Stopping Boss Battle System..."
        
        if [ -f /tmp/boss-battle-pids.tmp ]; then
            while IFS= read -r pid; do
                if [ -n "$pid" ]; then
                    echo "  🔪 Killing process $pid"
                    kill -9 "$pid" 2>/dev/null || true
                fi
            done < /tmp/boss-battle-pids.tmp
            rm -f /tmp/boss-battle-pids.tmp
        fi
        
        # Kill any remaining processes on our ports
        lsof -ti:4200 | xargs kill -9 2>/dev/null || true
        lsof -ti:8081 | xargs kill -9 2>/dev/null || true
        
        echo "✅ All services stopped"
        exit 0
    }
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    # Wait for user to stop
    echo "Press Ctrl+C to stop all services..."
    while true; do
        sleep 1
    done
    
else
    echo "❌ Some services failed to start. Check the logs above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  • Make sure ports 4200 and 8081 are available"
    echo "  • Check if Node.js dependencies are installed: npm install"
    echo "  • Verify the files exist: boss-submission-api.js, real-time-battle-streaming.js"
    echo "  • Check the console output above for specific errors"
    
    # Clean up any started services
    if [ -f /tmp/boss-battle-pids.tmp ]; then
        echo ""
        echo "🧹 Cleaning up partially started services..."
        while IFS= read -r pid; do
            if [ -n "$pid" ]; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        done < /tmp/boss-battle-pids.tmp
        rm -f /tmp/boss-battle-pids.tmp
    fi
    
    exit 1
fi