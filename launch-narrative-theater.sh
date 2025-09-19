#!/bin/bash

# 🎭🎪 XML NARRATIVE THEATER LAUNCHER
# ==================================
# Launches the complete narrative theater experience

set -e

echo "🎭🎪 XML NARRATIVE THEATER LAUNCHER"
echo "=================================="
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

# Check if five-layer system is running
REQUIRED_PORTS=(8091 8094 8097 8098)
system_running=true

for port in "${REQUIRED_PORTS[@]}"; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "   ✅ Port $port active (Layer system)"
    else
        echo "   ❌ Port $port not active"
        system_running=false
    fi
done

# Check if XML viewer is running
if lsof -i :8099 > /dev/null 2>&1; then
    echo "   ✅ Port 8099 active (XML Viewer)"
    viewer_running=true
else
    echo "   ❌ Port 8099 not active (XML Viewer)"
    viewer_running=false
fi

echo ""

# Start missing components
if [[ "$system_running" != true ]]; then
    echo "🚀 Starting five-layer system..."
    if [[ -f "./launch-five-layer-system.sh" ]]; then
        ./launch-five-layer-system.sh &
        echo "   ⏳ Waiting for system initialization..."
        sleep 15
    else
        echo "❌ launch-five-layer-system.sh not found!"
        exit 1
    fi
fi

if [[ "$viewer_running" != true ]]; then
    echo "🚀 Starting XML viewer..."
    if [[ -f "./launch-xml-viewer.sh" ]]; then
        ./launch-xml-viewer.sh &
        echo "   ⏳ Waiting for viewer initialization..."
        sleep 10
    else
        echo "❌ launch-xml-viewer.sh not found!"
        exit 1
    fi
fi

echo ""
echo "🎭 Starting XML Narrative Theater..."

# Check for theater file
if [[ ! -f "xml-narrative-theater.js" ]]; then
    echo "❌ xml-narrative-theater.js not found!"
    exit 1
fi

# Start the theater
mkdir -p .reasoning-viz/logs
nohup node xml-narrative-theater.js > .reasoning-viz/logs/narrative-theater.log 2>&1 &
THEATER_PID=$!
echo $THEATER_PID > .reasoning-viz/logs/narrative-theater.pid

echo "   ✅ Narrative Theater started (PID: $THEATER_PID)"
echo "   ⏳ Waiting for theater to open..."

# Wait for theater to be ready
max_attempts=10
attempt=1
while [[ $attempt -le $max_attempts ]]; do
    if lsof -i :8100 > /dev/null 2>&1; then
        echo "   🎭 Theater is ready on port 8100!"
        break
    else
        echo "   ⏳ Attempt $attempt/$max_attempts - waiting for port 8100..."
        sleep 2
        ((attempt++))
    fi
done

echo ""
echo "🌐 Opening the theater..."

# Function to open browser
open_browser() {
    local url=$1
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url" || sensible-browser "$url" || firefox "$url"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        start "$url"
    else
        echo "   ⚠️  Could not auto-open browser. Please manually open: $url"
    fi
}

# Open the theater
sleep 2
open_browser "http://localhost:8100"

echo ""
echo "🎉 XML NARRATIVE THEATER IS OPEN!"
echo "=================================="
echo ""
echo "🎭 THE GREATEST SHOW IN CYBERSPACE"
echo "=================================="
echo "Theater URL:       http://localhost:8100"
echo "Theater Logs:      tail -f .reasoning-viz/logs/narrative-theater.log"
echo ""
echo "🎯 PERSPECTIVES"
echo "==============="
echo "1️⃣  Claw Machine - Grab XML data from above like a carnival game"
echo "2️⃣  TV Pixels - Watch the story unfold on a retro pixel display"
echo "3️⃣  Whip Vectors - Crack through data with dynamic vector paths"
echo ""
echo "🎪 NARRATOR PERSONALITIES"
echo "========================="
echo "🎭 Dramatic Showboat - Maximum theatrical presentation"
echo "🕵️ Noir Detective - Dark and mysterious storytelling"
echo "🎡 Carnival Barker - High-energy circus atmosphere"
echo "☯️ Zen Master - Peaceful contemplative narration"
echo "🎮 Game Show Host - Exciting competitive commentary"
echo ""
echo "🎚️ FEATURES"
echo "============"
echo "• Showboat Level (1-10) - Control the drama intensity"
echo "• Live Commentary - Real-time narrative generation"
echo "• Audience Participation - Add your own comments"
echo "• Visual Effects - Particles, glows, and animations"
echo "• Story Recording - Capture the narrative for playback"
echo ""
echo "🎮 CONTROLS"
echo "==========="
echo "Keyboard Shortcuts:"
echo "  1 - Switch to Claw Machine"
echo "  2 - Switch to TV Pixels"
echo "  3 - Switch to Whip Vectors"
echo "  Space - Pause/Resume"
echo "  + - Increase showboat level"
echo "  - - Decrease showboat level"
echo ""
echo "🎬 WHAT YOU'LL SEE"
echo "=================="
echo "Watch as XML data flows are transformed into epic narratives!"
echo ""
echo "• Data flows become character movements"
echo "• Handshakes become dramatic meetings"
echo "• Errors become conflicts to overcome"
echo "• Consensus becomes triumphant resolutions"
echo "• Each tier is a character with personality"
echo "• Layers are personified as grand entities"
echo ""
echo "The story unfolds in real-time, painting the picture from"
echo "the inside out while commenting from above - just like"
echo "watching through a claw machine, television, or whip!"
echo ""
echo "🛠️ MANAGEMENT"
echo "============="
echo "Stop theater:      kill $(cat .reasoning-viz/logs/narrative-theater.pid)"
echo "Theater logs:      tail -f .reasoning-viz/logs/narrative-theater.log"
echo "System status:     ./system-status.sh"
echo ""
echo "🎪 THE SHOW HAS BEGUN! Enjoy the spectacle! 🎭"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🎭 Closing the theater..."
    
    if [[ -f ".reasoning-viz/logs/narrative-theater.pid" ]]; then
        pid=$(cat ".reasoning-viz/logs/narrative-theater.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   🛑 Stopping theater (PID: $pid)"
            kill "$pid"
        fi
        rm -f ".reasoning-viz/logs/narrative-theater.pid"
    fi
    
    echo "   ✅ Theater closed. Thank you for attending!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Monitor theater
echo "🎭 Theater is running. Press Ctrl+C to close."
echo ""

while true; do
    sleep 30
    
    if ! lsof -i :8100 > /dev/null 2>&1; then
        echo "⚠️  $(date): Theater appears to be down"
        echo "   Attempting restart..."
        
        nohup node xml-narrative-theater.js > .reasoning-viz/logs/narrative-theater.log 2>&1 &
        THEATER_PID=$!
        echo $THEATER_PID > .reasoning-viz/logs/narrative-theater.pid
        
        sleep 5
        
        if lsof -i :8100 > /dev/null 2>&1; then
            echo "   ✅ Theater reopened successfully"
        else
            echo "   ❌ Failed to reopen theater"
        fi
    fi
done