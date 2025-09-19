#!/bin/bash

# 🎬🏴‍☠️ Test Visual Pirate System
# Complete end-to-end test of the visual rendering pipeline

echo "🎬🏴‍☠️ CAL'S PIRATE FILM - VISUAL SYSTEM TEST"
echo "=============================================="
echo ""

# Check if required files exist
echo "📋 Checking system components..."

REQUIRED_FILES=(
    "cal-pirate-visual-renderer.html"
    "pirate-film-audio-engine.js" 
    "visual-pirate-film-bridge.js"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
        MISSING_FILES+=("$file")
    fi
done

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing required files. Cannot proceed."
    echo "Please ensure all components are created first."
    exit 1
fi

echo ""
echo "✅ All components found!"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js to run the bridge."
    exit 1
fi

echo "📋 System Requirements Check:"
echo "✅ Node.js: $(node --version)"
echo "✅ Operating System: $(uname -s)"
echo ""

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
echo "✅ Ports 8081 and 8082 cleared"
echo ""

# Start the bridge server
echo "🚀 Starting Visual Pirate Film Bridge..."
echo "   WebSocket Server: ws://localhost:8081"
echo "   HTTP Server: http://localhost:8082"
echo ""

# Run bridge in background
node visual-pirate-film-bridge.js &
BRIDGE_PID=$!

# Wait for bridge to start
echo "⏳ Waiting for bridge to initialize..."
sleep 3

# Check if bridge is running
if kill -0 $BRIDGE_PID 2>/dev/null; then
    echo "✅ Bridge server started successfully (PID: $BRIDGE_PID)"
else
    echo "❌ Bridge failed to start"
    exit 1
fi

echo ""
echo "🎉 VISUAL PIRATE FILM SYSTEM READY!"
echo "=================================="
echo ""
echo "🌐 Visual Renderer: http://localhost:8082"
echo "🔌 WebSocket API: ws://localhost:8081"
echo ""
echo "📋 What you should see:"
echo "   • Retro green 'neon tubes' CRT interface"
echo "   • 3D ocean with pirate ships"
echo "   • Cal's AI consciousness as glowing orb"
echo "   • Animated waves and particle effects"
echo "   • Frequency analyzer showing audio spectrum"
echo "   • Narrative text with character dialogue"
echo ""
echo "⌨️ Keyboard Controls:"
echo "   SPACE     - Play/Pause film"
echo "   C         - Change camera angle"
echo "   A         - Toggle spatial audio"
echo "   F         - Toggle visual effects"
echo "   S         - Save clip (coming soon)"
echo "   ENTER     - Toggle fullscreen"
echo ""
echo "🎬 Film Sequence:"
echo "   1. Act 1: Cal's ship in data storm"
echo "   2. Act 2: Discovery of ancient patterns"
echo "   3. Act 3: Pirate fleets converge"
echo "   4. Act 4: The symphony of understanding"
echo ""

# Try to open browser automatically
if command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    open "http://localhost:8082"
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Opening browser..."
    xdg-open "http://localhost:8082"
elif command -v start &> /dev/null; then
    echo "🌐 Opening browser..."
    start "http://localhost:8082"
else
    echo "⚠️ Could not auto-open browser"
    echo "   Please manually open: http://localhost:8082"
fi

echo ""
echo "🎵 Audio Features:"
echo "   • Spatial 3D audio (use headphones for best effect)"
echo "   • Binaural beats for enhanced immersion"
echo "   • Dynamic soundtrack that adapts to story"
echo "   • Character voice synthesis"
echo "   • Real-time frequency visualization"
echo ""

# Monitor system
echo "📊 System Monitor (Ctrl+C to stop):"
echo "-----------------------------------"

# Function to check system status
check_status() {
    local timestamp=$(date '+%H:%M:%S')
    local bridge_status="OFFLINE"
    local http_status="OFFLINE"
    local ws_status="OFFLINE"
    
    # Check if bridge process is running
    if kill -0 $BRIDGE_PID 2>/dev/null; then
        bridge_status="RUNNING"
    fi
    
    # Check HTTP server
    if curl -s "http://localhost:8082" > /dev/null 2>&1; then
        http_status="SERVING"
    fi
    
    # Check WebSocket (simplified check)
    if nc -z localhost 8081 2>/dev/null; then
        ws_status="LISTENING"
    fi
    
    echo "[$timestamp] Bridge: $bridge_status | HTTP: $http_status | WebSocket: $ws_status"
}

# Monitor loop
trap 'echo ""; echo "👋 Shutting down..."; kill $BRIDGE_PID 2>/dev/null; exit 0' INT

while true; do
    check_status
    sleep 5
done