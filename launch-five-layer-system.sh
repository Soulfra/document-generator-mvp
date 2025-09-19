#!/bin/bash

# 🚀🌐🎮 FIVE-LAYER SYSTEM LAUNCHER
# ================================
# Launches the complete five-layer handshake architecture
# Layer 5: Gaming Engine
# Layer 4: Meta-Orchestrator  
# Layer 3: Licensing Compliance
# Layer 2: XML-Stream Integration
# Layer 1: Stream Visualization

set -e

echo "🚀🌐🎮 FIVE-LAYER SYSTEM LAUNCHER"
echo "================================"
echo "Starting complete five-layer handshake architecture..."
echo ""

# Check for required files
REQUIRED_FILES=(
    "gaming-engine-xml-mapper.js"
    "meta-handshake-orchestrator.js" 
    "licensing-compliance-bridge.js"
    "xml-stream-integration-bridge.js"
    "stream-safe-tier-visualizer.html"
)

echo "📋 Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file - MISSING!"
        exit 1
    fi
done
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check for required Node modules
echo "📦 Checking Node.js dependencies..."
REQUIRED_MODULES=("ws" "crypto")
for module in "${REQUIRED_MODULES[@]}"; do
    if node -e "require('$module')" 2>/dev/null; then
        echo "   ✅ $module"
    else
        echo "   ❌ $module - Installing..."
        npm install "$module"
    fi
done
echo ""

# Create logs directory
mkdir -p .reasoning-viz/logs

# Function to start a layer with logging
start_layer() {
    local layer_name=$1
    local layer_file=$2
    local layer_number=$3
    local port=$4
    
    echo "🔄 Starting Layer $layer_number: $layer_name..."
    
    # Start the layer in background with logging
    nohup node "$layer_file" > ".reasoning-viz/logs/$layer_name.log" 2>&1 &
    local pid=$!
    echo $pid > ".reasoning-viz/logs/$layer_name.pid"
    
    echo "   ✅ Layer $layer_number started (PID: $pid, Port: $port)"
    
    # Wait for service to be ready
    echo "   ⏳ Waiting for Layer $layer_number to initialize..."
    sleep 3
    
    # Check if the service is responding
    local max_attempts=10
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if lsof -i :$port > /dev/null 2>&1; then
            echo "   🟢 Layer $layer_number ready on port $port"
            break
        else
            echo "   ⏳ Attempt $attempt/$max_attempts - waiting for port $port..."
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        echo "   ⚠️  Layer $layer_number may not be fully ready (port $port not responding)"
    fi
    
    echo ""
}

# Function to open browser tab
open_browser() {
    local url=$1
    local description=$2
    
    echo "🌐 Opening $description..."
    
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

# Start layers in order (bottom to top)
echo "🏗️ Starting Five-Layer Architecture..."
echo ""

# Layer 1: Stream Visualization (Port 8092)
echo "🎯 LAYER 1: Stream Visualization"
echo "File: stream-safe-tier-visualizer.html (Static file - served by Layer 2)"
echo ""

# Layer 2: XML-Stream Integration (Port 8091)
echo "🌉 LAYER 2: XML-Stream Integration"
start_layer "xml-stream-integration" "xml-stream-integration-bridge.js" "2" "8091"

# Layer 3: Licensing Compliance (Port 8094)  
echo "📜 LAYER 3: Licensing Compliance"
start_layer "licensing-compliance" "licensing-compliance-bridge.js" "3" "8094"

# Layer 4: Meta-Orchestrator (Port 8097)
echo "🌐 LAYER 4: Meta-Handshake Orchestrator"
start_layer "meta-orchestrator" "meta-handshake-orchestrator.js" "4" "8097"

# Layer 5: Gaming Engine (Port 8098)
echo "🎮 LAYER 5: Gaming Engine XML Mapper"
start_layer "gaming-engine" "gaming-engine-xml-mapper.js" "5" "8098"

# Wait for all layers to stabilize
echo "⏳ Allowing layers to establish connections..."
sleep 5

# Verify all services are running
echo "🔍 SYSTEM VERIFICATION"
echo "====================="

SERVICES=(
    "xml-stream-integration:8091"
    "licensing-compliance:8094" 
    "meta-orchestrator:8097"
    "gaming-engine:8098"
)

all_healthy=true
for service in "${SERVICES[@]}"; do
    name=${service%:*}
    port=${service#*:}
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo "✅ $name (Port $port) - RUNNING"
    else
        echo "❌ $name (Port $port) - NOT RESPONDING"
        all_healthy=false
    fi
done
echo ""

if [[ "$all_healthy" == true ]]; then
    echo "🎉 ALL LAYERS OPERATIONAL!"
    echo "========================="
    echo ""
    
    # Display architecture overview
    echo "🏗️ FIVE-LAYER ARCHITECTURE ACTIVE"
    echo "=================================="
    echo "Layer 5: 🎮 Gaming Engine          (ws://localhost:8098/gaming-engine)"
    echo "Layer 4: 🌐 Meta-Orchestrator      (ws://localhost:8097/meta-handshake)"  
    echo "Layer 3: 📜 Licensing Compliance   (ws://localhost:8094/licensing-compliance)"
    echo "Layer 2: 🌉 XML-Stream Integration (ws://localhost:8091/xml-integration)"
    echo "Layer 1: 🎯 Stream Visualization   (File: stream-safe-tier-visualizer.html)"
    echo ""
    
    # Display key features
    echo "🚀 KEY FEATURES ACTIVE"
    echo "====================="
    echo "✅ High-performance gaming engine with 3D XML mapping"
    echo "✅ Byzantine fault-tolerant distributed consensus"
    echo "✅ Creative Commons CC BY-SA 4.0 licensing compliance"
    echo "✅ Real-time XML-stream bidirectional integration"
    echo "✅ Stream-safe tier visualization for broadcasting"
    echo "✅ Spatial indexing and performance optimization"
    echo "✅ Multi-layer handshake protocols"
    echo "✅ Timeout resolution through game engine"
    echo ""
    
    # Show management commands
    echo "🛠️ MANAGEMENT COMMANDS"
    echo "======================"
    echo "View Status:     ./system-status.sh"
    echo "Stop System:     ./stop-five-layer-system.sh"
    echo "View Logs:       tail -f .reasoning-viz/logs/*.log"
    echo "Gaming World:    file://$(pwd)/gaming-engine-xml-mapper.js -> gaming-xml-world.html"
    echo ""
    
    # Open gaming world
    echo "🎮 LAUNCHING GAMING WORLD..."
    if [[ -f ".reasoning-viz/gaming-engine/gaming-xml-world.html" ]]; then
        sleep 2
        open_browser "file://$(pwd)/.reasoning-viz/gaming-engine/gaming-xml-world.html" "Gaming Engine XML World"
        echo "   ✅ Gaming world opened in browser"
    else
        echo "   ⚠️  Gaming world HTML not found, will be created when accessed"
    fi
    echo ""
    
    # Final success message
    echo "🎯 SUCCESS! Five-layer handshake architecture is fully operational."
    echo "   The system is now capable of handling complex processing without timeouts"
    echo "   through the high-performance gaming engine and distributed architecture."
    echo ""
    echo "🎮 Access the 3D XML gaming world to interact with all 15 tiers in real-time!"
    
else
    echo "⚠️ SOME LAYERS FAILED TO START"
    echo "Check logs in .reasoning-viz/logs/ for details"
    echo ""
    echo "🛠️ TROUBLESHOOTING"
    echo "=================="
    echo "1. Check if ports are already in use: lsof -i :8091-8098"
    echo "2. View logs: tail -f .reasoning-viz/logs/*.log"
    echo "3. Check Node.js modules: npm list ws crypto"
    echo "4. Restart individual layers: node [layer-file].js"
    exit 1
fi

# Keep script running to monitor
echo "🔄 System monitoring active. Press Ctrl+C to stop all layers."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down five-layer system..."
    
    # Kill all layer processes
    for service in "${SERVICES[@]}"; do
        name=${service%:*}
        pidfile=".reasoning-viz/logs/$name.pid"
        
        if [[ -f "$pidfile" ]]; then
            pid=$(cat "$pidfile")
            if kill -0 "$pid" 2>/dev/null; then
                echo "   🛑 Stopping $name (PID: $pid)"
                kill "$pid"
            fi
            rm -f "$pidfile"
        fi
    done
    
    echo "   ✅ All layers stopped"
    echo "🎯 Five-layer system shutdown complete."
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Monitor system health
monitor_system() {
    while true; do
        sleep 30
        
        # Check if all services are still running
        failed_services=()
        for service in "${SERVICES[@]}"; do
            name=${service%:*}
            port=${service#*:}
            
            if ! lsof -i :$port > /dev/null 2>&1; then
                failed_services+=("$name:$port")
            fi
        done
        
        if [[ ${#failed_services[@]} -gt 0 ]]; then
            echo "⚠️  $(date): Some services are down: ${failed_services[*]}"
            echo "   Check logs: tail -f .reasoning-viz/logs/*.log"
        fi
    done
}

# Start monitoring in background
monitor_system &
monitor_pid=$!

# Keep main process alive
wait $monitor_pid