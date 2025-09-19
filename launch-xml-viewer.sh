#!/bin/bash

# 🗺️👁️ XML MAPPING VIEWER LAUNCHER
# =================================
# Launches the XML Mapping Viewer alongside the five-layer system

set -e

echo "🗺️👁️ XML MAPPING VIEWER LAUNCHER"
echo "================================="
echo ""

# Check if five-layer system is running
echo "🔍 Checking five-layer system status..."
REQUIRED_PORTS=(8091 8094 8097 8098)
system_running=true

for port in "${REQUIRED_PORTS[@]}"; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "   ✅ Port $port active"
    else
        echo "   ❌ Port $port not active"
        system_running=false
    fi
done

if [[ "$system_running" != true ]]; then
    echo ""
    echo "⚠️  Five-layer system not fully running!"
    echo "🚀 Starting five-layer system first..."
    echo ""
    
    if [[ -f "./launch-five-layer-system.sh" ]]; then
        ./launch-five-layer-system.sh &
        SYSTEM_PID=$!
        echo "   ⏳ Waiting for system to initialize..."
        sleep 10
    else
        echo "❌ launch-five-layer-system.sh not found!"
        exit 1
    fi
fi

echo ""
echo "🗺️ Starting XML Mapping Viewer..."

# Check for required files
if [[ ! -f "xml-mapping-viewer.js" ]]; then
    echo "❌ xml-mapping-viewer.js not found!"
    exit 1
fi

# Start the viewer
nohup node xml-mapping-viewer.js > .reasoning-viz/logs/xml-viewer.log 2>&1 &
VIEWER_PID=$!
echo $VIEWER_PID > .reasoning-viz/logs/xml-viewer.pid

echo "   ✅ XML Mapping Viewer started (PID: $VIEWER_PID)"
echo "   ⏳ Waiting for viewer to initialize..."

# Wait for viewer to be ready
max_attempts=10
attempt=1
while [[ $attempt -le $max_attempts ]]; do
    if lsof -i :8099 > /dev/null 2>&1; then
        echo "   🟢 Viewer ready on port 8099"
        break
    else
        echo "   ⏳ Attempt $attempt/$max_attempts - waiting for port 8099..."
        sleep 2
        ((attempt++))
    fi
done

if [[ $attempt -gt $max_attempts ]]; then
    echo "   ⚠️  Viewer may not be fully ready"
fi

echo ""
echo "🌐 Opening XML Mapping Viewer..."

# Function to open browser
open_browser() {
    local url=$1
    
    # Detect OS and open browser accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$url" || sensible-browser "$url" || firefox "$url" || google-chrome "$url"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        start "$url"
    else
        echo "   ⚠️  Could not auto-open browser. Please manually open: $url"
    fi
}

# Open the viewer
sleep 2
open_browser "http://localhost:8099"

echo ""
echo "🎉 XML MAPPING VIEWER LAUNCHED!"
echo "==============================="
echo ""
echo "🗺️ VIEWER ACCESS"
echo "================"
echo "Web Interface:     http://localhost:8099"
echo "WebSocket:         ws://localhost:8099/xml-viewer"
echo "Viewer Logs:       tail -f .reasoning-viz/logs/xml-viewer.log"
echo ""
echo "🎮 FEATURES"
echo "==========="
echo "✅ Real-time XML flow visualization between all 5 layers"
echo "✅ Interactive canvas showing data flow patterns"
echo "✅ Live telemetry metrics (TPS, BPS, Latency)"
echo "✅ Per-tier health monitoring"
echo "✅ Flow recording and snapshot capabilities"
echo "✅ Performance metrics dashboard"
echo ""
echo "🎯 VIEWER CONTROLS"
echo "=================="
echo "⏸️  Pause/Resume - Stop/start visualization"
echo "⏺️  Record - Capture flow data for analysis"
echo "📸  Snapshot - Save current visualization as image"
echo "🗑️  Clear - Reset the flow console"
echo ""
echo "📊 MONITORING"
echo "============="
echo "The viewer shows:"
echo "- Layer connectivity status (green = connected)"
echo "- Real-time data flows between layers"
echo "- XML tier health indicators"
echo "- Transaction and bandwidth metrics"
echo "- Error rates and telemetry data"
echo ""
echo "🛠️ MANAGEMENT"
echo "============="
echo "Stop viewer:       kill $(cat .reasoning-viz/logs/xml-viewer.pid)"
echo "Viewer status:     node xml-mapping-viewer.js status"
echo "System status:     ./system-status.sh"
echo ""
echo "🔄 The XML Mapping Viewer is now monitoring all five layers!"
echo "   Watch the real-time flow of XML data through the architecture."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down XML Mapping Viewer..."
    
    if [[ -f ".reasoning-viz/logs/xml-viewer.pid" ]]; then
        pid=$(cat ".reasoning-viz/logs/xml-viewer.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   🛑 Stopping viewer (PID: $pid)"
            kill "$pid"
        fi
        rm -f ".reasoning-viz/logs/xml-viewer.pid"
    fi
    
    echo "   ✅ Viewer stopped"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Keep script running for monitoring
echo "🔄 Viewer monitoring active. Press Ctrl+C to stop."
echo ""

# Monitor viewer health
while true; do
    sleep 30
    
    if ! lsof -i :8099 > /dev/null 2>&1; then
        echo "⚠️  $(date): XML Mapping Viewer appears to be down"
        echo "   Attempting restart..."
        
        nohup node xml-mapping-viewer.js > .reasoning-viz/logs/xml-viewer.log 2>&1 &
        VIEWER_PID=$!
        echo $VIEWER_PID > .reasoning-viz/logs/xml-viewer.pid
        
        sleep 5
        
        if lsof -i :8099 > /dev/null 2>&1; then
            echo "   ✅ Viewer restarted successfully"
        else
            echo "   ❌ Failed to restart viewer"
        fi
    fi
done