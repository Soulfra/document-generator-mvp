#!/bin/bash

# 🚀🎨 STARSHIP CONSTRUCTION VIEWER LAUNCHER
# ==========================================
# Watch the AI build things - collaborate when it needs help

set -e

echo "🚀🎨 STARSHIP CONSTRUCTION VIEWER LAUNCHER"
echo "=========================================="
echo ""
echo "👁️ WATCH: AI navigating menus and building structures"
echo "🤝 COLLABORATE: Drag/drop elements and draw connections"
echo "🎨 CREATE: Help AI when it requests assistance"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js to continue."
    exit 1
fi
echo "   ✅ Node.js available"

# Check WebSocket module
if node -e "require('ws')" 2>/dev/null; then
    echo "   ✅ WebSocket module available"
else
    echo "   📦 Installing WebSocket module..."
    npm install ws
    if [[ $? -eq 0 ]]; then
        echo "   ✅ WebSocket module installed"
    else
        echo "   ❌ Failed to install WebSocket module"
        exit 1
    fi
fi

# Check for construction viewer file
if [[ ! -f "starship-construction-viewer.js" ]]; then
    echo "❌ starship-construction-viewer.js not found!"
    exit 1
fi
echo "   ✅ Construction viewer system found"

echo ""

# Create construction directories
echo "🏗️ Setting up construction workspace..."
mkdir -p .starship-construction/logs
mkdir -p .starship-construction/projects
mkdir -p .starship-construction/captures
echo "   ✅ Construction workspace ready"

echo ""
echo "🚀 LAUNCHING CONSTRUCTION VIEWER..."

# Start the construction viewer
nohup node starship-construction-viewer.js > .starship-construction/logs/construction-viewer.log 2>&1 &
VIEWER_PID=$!
echo $VIEWER_PID > .starship-construction/logs/construction-viewer.pid

echo "   🚀 Construction viewer started (PID: $VIEWER_PID)"
echo "   ⏳ Waiting for viewer systems to initialize..."

# Wait for viewer to be ready
max_attempts=15
attempt=1
viewer_ready=false

while [[ $attempt -le $max_attempts ]]; do
    if lsof -i :9100 > /dev/null 2>&1 && lsof -i :9101 > /dev/null 2>&1; then
        echo "   🎨 Construction viewer ready (ports 9100/9101)"
        viewer_ready=true
        break
    else
        echo "   ⏳ Attempt $attempt/$max_attempts - starting construction systems..."
        sleep 2
        ((attempt++))
    fi
done

if [[ "$viewer_ready" != true ]]; then
    echo "   ⚠️  Viewer may still be initializing..."
fi

echo ""
echo "🌐 Opening construction interface..."

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

# Open the construction viewer
sleep 3
open_browser "http://localhost:9100"

echo ""
echo "🎉 STARSHIP CONSTRUCTION VIEWER IS ACTIVE!"
echo "=========================================="
echo ""
echo "🚀 CONSTRUCTION INTERFACE"
echo "========================="
echo "Viewer URL:        http://localhost:9100"
echo "WebSocket:         ws://localhost:9101"
echo "Viewer Logs:       tail -f .starship-construction/logs/construction-viewer.log"
echo ""
echo "👁️ WHAT YOU'LL WATCH"
echo "===================="
echo "🤖 AI Behavior:"
echo "   • Navigating construction menus autonomously"
echo "   • Selecting tools and elements from interface"
echo "   • Placing satellites, stars, and structures"
echo "   • Drawing connections between elements"
echo "   • Requesting help when needed"
echo "   • Acknowledging your assistance"
echo ""
echo "🎨 AI Construction Elements:"
echo "   📡 Communication Satellites"
echo "   🛰️  Spy Satellites"
echo "   🌩️  Weather Satellites"
echo "   🧭 Navigation Satellites"
echo "   ⭐ Main Sequence Stars"
echo "   🔴 Red Giant Stars"
echo "   ⚪ White Dwarf Stars"
echo "   💫 Neutron Stars"
echo "   🏗️  Space Stations"
echo "   ⚫ Dyson Spheres"
echo "   🌀 Wormholes"
echo "   🔷 Quantum Gates"
echo ""
echo "🔗 Connection Types:"
echo "   📡 Communication Beams"
echo "   🫸 Tractor Beams"
echo "   ⚡ Energy Conduits"
echo "   🌀 Gravitational Fields"
echo ""
echo "🤝 HOW TO COLLABORATE"
echo "==================="
echo "🖱️  Mouse Interaction:"
echo "   • Your cursor appears as orange dot (👤)"
echo "   • AI cursor appears as blue dot (🤖)"
echo "   • Move mouse to show AI where you're looking"
echo ""
echo "🎯 Drag & Drop Elements:"
echo "   • Drag satellites/stars/structures from sidebar"
echo "   • Drop them on canvas to help AI build"
echo "   • AI will acknowledge your help"
echo ""
echo "🔗 Draw Connections:"
echo "   1. Click a connection type in sidebar (turns orange)"
echo "   2. Click first element on canvas"
echo "   3. Click second element to complete connection"
echo "   4. AI will see and use your connections"
echo ""
echo "🆘 Help AI When Requested:"
echo "   • Red \"AI Needs Help\" section appears when AI is stuck"
echo "   • Click \"Help AI\" button to assist"
echo "   • AI will thank you and continue building"
echo ""
echo "🎮 COLLABORATION FEATURES"
echo "========================"
echo "✅ Real-time cursor tracking (yours + AI's)"
echo "✅ Drag-and-drop construction elements"
echo "✅ Line drawing tools for connections"
echo "✅ Help request system when AI needs assistance"
echo "✅ AI acknowledgment of your contributions"
echo "✅ Shared construction workspace"
echo "✅ Live construction visualization"
echo ""
echo "🧠 AI CONSTRUCTION TASKS"
echo "======================="
echo "The AI works on autonomous construction tasks:"
echo ""
echo "📡 Communication Network:"
echo "   • Places communication satellites in orbital patterns"
echo "   • Connects them with communication beams"
echo "   • Tests signal coverage and optimization"
echo ""
echo "🌟 Solar System Design:"
echo "   • Places stars and orbital bodies"
echo "   • Creates gravitational connections"
echo "   • Builds space stations and infrastructure"
echo ""
echo "⚫ Megastructure Construction:"
echo "   • Designs Dyson spheres around stars"
echo "   • Creates energy collection and routing systems"
echo "   • Adds control stations and monitoring"
echo ""
echo "🎯 AI BEHAVIOR PATTERNS"
echo "======================"
echo "🤖 AI Thinking Cycle (every 2 seconds):"
echo "   • Analyzes current construction progress"
echo "   • Plans next steps and optimizations"
echo "   • Evaluates spatial relationships"
echo "   • Considers structural integrity"
echo ""
echo "⚡ AI Action Cycle (every 5 seconds):"
echo "   • Navigates construction menus"
echo "   • Places or moves construction elements"
echo "   • Creates connections between objects"
echo "   • Requests human help when needed"
echo ""
echo "💭 Current AI Thoughts Displayed:"
echo "   • \"Analyzing optimal satellite placement...\""
echo "   • \"Calculating orbital mechanics...\""
echo "   • \"Planning connection pathways...\""
echo "   • \"Optimizing spatial distribution...\""
echo ""
echo "🛠️ CONSTRUCTION VIEWER CONTROLS"
echo "==============================="
echo "Web Interface Elements:"
echo "   • Left panel: Main construction canvas"
echo "   • Right panel: Element toolbox and help system"
echo "   • Top bar: AI status and current task"
echo "   • Element grid: Drag-and-drop construction pieces"
echo ""
echo "Visual Indicators:"
echo "   • Blue glow: AI-created elements"
echo "   • Orange glow: Human-created elements"
echo "   • Dashed lines: Communication connections"
echo "   • Solid lines: Physical connections"
echo "   • Grid background: Construction workspace"
echo ""
echo "📊 REAL-TIME FEEDBACK"
echo "===================="
echo "🤖 AI Status Updates:"
echo "   • Current thought processes"
echo "   • Active construction task"
echo "   • Menu navigation actions"
echo "   • Help request notifications"
echo ""
echo "🎨 Visual Construction Feedback:"
echo "   • Elements appear as they're placed"
echo "   • Connections draw in real-time"
echo "   • Hover effects on interactive elements"
echo "   • Scale and glow effects for emphasis"
echo ""
echo "💬 AI Communication:"
echo "   • Thank you messages when you help"
echo "   • Acknowledgment of your contributions"
echo "   • Progress updates on construction tasks"
echo ""
echo "🛠️ MANAGEMENT & MONITORING"
echo "=========================="
echo "System Status:"
echo "   Check viewer:      curl http://localhost:9100/api/workspace"
echo "   Construction kit:  curl http://localhost:9100/api/construction-kit"
echo "   View logs:         tail -f .starship-construction/logs/construction-viewer.log"
echo "   Stop viewer:       kill \$(cat .starship-construction/logs/construction-viewer.pid)"
echo ""
echo "🎭 THE EXPERIENCE"
echo "================"
echo "You're about to watch an AI architect at work:"
echo ""
echo "• See the AI's cursor move across the screen"
echo "• Watch it navigate menus like a human would"
echo "• Observe it selecting tools and elements"
echo "• See constructions appear in real-time"
echo "• Get requests for help with complex tasks"
echo "• Collaborate by providing missing pieces"
echo "• Receive thanks and acknowledgment"
echo ""
echo "It's like pair programming with an AI architect -"
echo "you watch, you help when needed, you build together."
echo ""
echo "🔄 CONSTRUCTION VIEWER IS NOW ACTIVE"
echo "   AI is thinking and building autonomously"
echo "   You can collaborate by dragging/dropping elements"
echo "   Watch the magic happen in real-time!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 SHUTTING DOWN CONSTRUCTION VIEWER..."
    echo "======================================"
    
    if [[ -f ".starship-construction/logs/construction-viewer.pid" ]]; then
        pid=$(cat ".starship-construction/logs/construction-viewer.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   🚀 Stopping construction viewer (PID: $pid)"
            kill "$pid"
            
            sleep 3
            
            if kill -0 "$pid" 2>/dev/null; then
                echo "   ⚠️  Force stopping viewer"
                kill -9 "$pid"
            fi
        fi
        rm -f ".starship-construction/logs/construction-viewer.pid"
    fi
    
    echo "   🎨 Construction viewer stopped"
    echo "   💾 Construction projects saved"
    echo "   ✅ Shutdown complete"
    echo ""
    echo "Your collaborative constructions have been preserved!"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Monitor construction viewer
echo "🔄 Construction viewer monitoring active. Press Ctrl+C to stop."
echo ""

while true; do
    sleep 45  # Check every 45 seconds
    
    # Check if viewer is still running
    if ! lsof -i :9100 > /dev/null 2>&1 || ! lsof -i :9101 > /dev/null 2>&1; then
        echo "⚠️  $(date): Construction viewer appears offline - restarting..."
        
        # Restart the viewer
        nohup node starship-construction-viewer.js > .starship-construction/logs/construction-viewer.log 2>&1 &
        VIEWER_PID=$!
        echo $VIEWER_PID > .starship-construction/logs/construction-viewer.pid
        
        sleep 10
        
        if lsof -i :9100 > /dev/null 2>&1 && lsof -i :9101 > /dev/null 2>&1; then
            echo "   ✅ Construction viewer restored - AI continues building"
        else
            echo "   ❌ Restart failed - check logs"
        fi
    else
        echo "🎨 $(date): AI constructing autonomously - collaboration ready"
    fi
done