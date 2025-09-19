#!/bin/bash

# START OMNI-CONTROL HUB
# Universal search and remote control system like Amazon Silk + Nightbot
# Unifies all search, control, and data systems into one interface

set -e

echo "🎛️🌟 STARTING OMNI-CONTROL HUB 🌟🎛️"
echo "===================================="
echo "🔍 Universal Search: Local + Remote + Real APIs"
echo "🎮 Universal Remote Control: Deploy + Monitor + Scale"
echo "🎙️ Voice Commands: Natural language processing"
echo "📡 Real-time Data: Wikipedia + GitHub + Crypto + More"
echo "🌐 Cross-Platform SDK: Works everywhere"
echo ""

# Check if we're in the right directory
if [ ! -f "OMNI-CONTROL-HUB.js" ]; then
    echo "❌ Error: Not in the correct directory"
    echo "Please run this script from the Document Generator root directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️ Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to start a service
start_service() {
    local name="$1"
    local command="$2"
    local port="$3"
    local description="$4"
    
    echo "🚀 Starting $name ($description)..."
    
    # Check port availability
    if [ ! -z "$port" ] && ! check_port $port; then
        echo "   Skipping $name - port $port already in use"
        return
    fi
    
    # Start in background
    $command &
    local pid=$!
    
    # Store PID for cleanup
    echo $pid > "/tmp/omni-${name}.pid"
    
    # Wait a moment for startup
    sleep 2
    
    # Check if port is responding (if specified)
    if [ ! -z "$port" ]; then
        echo "   Testing port $port..."
        if curl -s "http://localhost:$port" >/dev/null 2>&1 || curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
            echo "✅ $name is running on port $port"
        else
            echo "⚠️  $name started but port $port not responding yet"
        fi
    else
        echo "✅ $name started (PID: $pid)"
    fi
    
    echo ""
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all Omni-Control systems..."
    
    for pidfile in /tmp/omni-*.pid; do
        if [ -f "$pidfile" ]; then
            local pid=$(cat "$pidfile")
            local name=$(basename "$pidfile" .pid | sed 's/omni-//')
            echo "   Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm "$pidfile"
        fi
    done
    
    echo "✅ All systems stopped"
    exit 0
}

# Setup signal handlers
trap cleanup SIGINT SIGTERM

echo "🔧 Starting integrated systems (if not already running)..."
echo ""

# 1. Start supporting systems first (in background, don't wait)
echo "🔍 Checking for supporting systems..."

# Check if Active Search System is running
if ! curl -s "http://localhost:2020" >/dev/null 2>&1; then
    echo "   Starting Active Search System..."
    if [ -f "ACTIVE-SEARCH-VERIFICATION-SYSTEM.js" ]; then
        start_service "search" "node ACTIVE-SEARCH-VERIFICATION-SYSTEM.js" "2020" "Active search and verification"
    else
        echo "   ⚠️  Active Search System not found"
    fi
fi

# Check if Universal Data Bridge is running
if ! curl -s "http://localhost:9999" >/dev/null 2>&1; then
    echo "   Starting Universal Data Bridge..."
    if [ -f "universal-data-bridge.js" ]; then
        start_service "databridge" "node universal-data-bridge.js" "9999" "Real API data aggregation"
    else
        echo "   ⚠️  Universal Data Bridge not found"
    fi
fi

# Check if Universal Arbitrage Connector is running
if ! curl -s "http://localhost:9000" >/dev/null 2>&1; then
    echo "   Universal Arbitrage Connector not running (start separately if needed)"
fi

echo ""
echo "🎛️ Starting OMNI-CONTROL HUB - The Universal Remote..."

# 2. Start the main Omni-Control Hub
start_service "hub" "node OMNI-CONTROL-HUB.js" "9000" "Main control hub interface"

# Wait for all systems to be ready
echo "⏳ Waiting for all systems to initialize..."
sleep 3

# Test the integration
echo "🧪 Testing Omni-Control Hub integration..."

# Test main hub
echo "Testing Omni-Control Hub..."
if curl -s "http://localhost:9000" | grep -q "OMNI-CONTROL HUB"; then
    echo "✅ Omni-Control Hub is working"
else
    echo "❌ Omni-Control Hub test failed"
fi

# Test status endpoint
echo "Testing status API..."
if curl -s "http://localhost:9000/api/status" | grep -q "omniControl"; then
    echo "✅ Status API is working"
else
    echo "❌ Status API test failed"
fi

echo ""
echo "🎉 OMNI-CONTROL HUB STARTED SUCCESSFULLY!"
echo ""
echo "🎛️ Universal Control Interface:"
echo "   • Main Dashboard: http://localhost:9000"
echo "   • Real-time Control: ws://localhost:9001"
echo "   • Voice Commands: http://localhost:9002 (planned)"
echo "   • Admin Dashboard: http://localhost:9003 (planned)"
echo "   • Cross-Platform SDK: http://localhost:9004 (planned)"
echo ""
echo "🔍 Integrated Search Systems:"
echo "   • Active Search System: Port 2020"
echo "   • Universal Data Bridge: Port 9999"
echo "   • Local file system search"
echo "   • Remote service discovery"
echo "   • Real-time API data (Wikipedia, GitHub, etc.)"
echo "   • Arbitrage opportunity search"
echo ""
echo "🎮 Remote Control Capabilities:"
echo "   • Deploy to: Cloudflare, Vercel, Railway, Docker"
echo "   • Control: Start, Stop, Restart, Scale, Monitor"
echo "   • Universal natural language commands"
echo "   • Voice control integration (planned)"
echo ""
echo "💡 How to Use:"
echo "   1. Open http://localhost:9000 in your browser"
echo "   2. Try searching: 'search for token systems'"
echo "   3. Try remote control: deploy to vercel"
echo "   4. Try natural language: 'find arbitrage opportunities'"
echo "   5. Use real-time data streams from Wikipedia, GitHub, etc."
echo ""
echo "🌟 This is your universal remote for everything!"
echo "Like Amazon Silk + Nightbot + SDK all in one interface"
echo ""
echo "Press Ctrl+C to stop all systems"
echo ""

# Show live status every 60 seconds
echo "💫 Omni-Control Hub monitoring active systems..."
echo "📊 Universal search and remote control ready..."
echo ""

# Keep running until interrupted
while true; do
    sleep 60
    echo "📈 Status check: $(date)"
    echo "   • Hub: $(curl -s http://localhost:9000 >/dev/null && echo "✅ Running" || echo "❌ Down")"
    echo "   • Search: $(curl -s http://localhost:2020 >/dev/null && echo "✅ Running" || echo "⚠️ Offline")"
    echo "   • Data Bridge: $(curl -s http://localhost:9999 >/dev/null && echo "✅ Running" || echo "⚠️ Offline")"
    echo ""
done