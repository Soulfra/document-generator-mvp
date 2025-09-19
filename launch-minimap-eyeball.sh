#!/bin/bash

# 👁️🗺️ LAUNCH MINIMAP EYEBALL SYSTEM
# ===================================
# Visual command center that builds reality based on where you look

echo "👁️🗺️ MINIMAP EYEBALL SYSTEM"
echo "==========================="
echo ""
echo "👁️ Visual Command Center Features:"
echo "   • Real-time eye tracking simulation"
echo "   • Dynamic screen building based on focus"
echo "   • Interactive minimap with system zones"
echo "   • Progressive element construction"
echo "   • Build history and eye movement tracking"
echo ""

# Check if port 3333 is available
if lsof -Pi :3333 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3333 is already in use. Stopping existing service..."
    kill $(lsof -t -i:3333) 2>/dev/null || true
    sleep 2
fi

echo "🗺️ MINIMAP ZONES:"
echo "   • Centipede OS - Snake/line architecture system"
echo "   • Infinite Layers - Multi-layer system browser"
echo "   • Matrix Game - HollowTown game interface"
echo "   • HollowTown - Internet yellowbook directory"
echo "   • Blamechain - Accountability blockchain"
echo "   • Voxel MCP - 3D context storage system"
echo "   • Photography - Image processing pipeline"
echo "   • ZK Proofs - Zero-knowledge cryptography"
echo "   • Cloud Drive - Google Drive integration"
echo "   • AI Agents - Multi-agent system"
echo "   • XML Mapper - Schema mapping system"
echo ""

echo "👁️ EYE TRACKING FEATURES:"
echo "   • Natural eye movement simulation"
echo "   • Pupil tracking within eyeball bounds"
echo "   • Focus intensity calculation"
echo "   • Blinking animation"
echo "   • Movement history recording"
echo ""

echo "🔨 SCREEN BUILDING SYSTEM:"
echo "   • Progressive element construction"
echo "   • Layout-based positioning (horizontal, vertical, grid, 3D)"
echo "   • Interactive elements with click handlers"
echo "   • Build queue management"
echo "   • Construction templates for each system"
echo ""

echo "⚡ DYNAMIC FEATURES:"
echo "   • Eye focuses → Screen builds"
echo "   • High focus intensity → Starts construction"
echo "   • Each zone has unique build template"
echo "   • Elements appear with smooth animations"
echo "   • Real-time build progress tracking"
echo ""

echo "🚀 Launching Minimap Eyeball System..."
node minimap-eyeball-system.js &
EYEBALL_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $EYEBALL_PID > /dev/null; then
    echo ""
    echo "✅ Minimap Eyeball System started successfully!"
    echo ""
    echo "👁️ VISUAL INTERFACE: http://localhost:3333"
    echo ""
    echo "🎯 HOW IT WORKS:"
    echo "   1. Watch the eyeball move naturally around the minimap"
    echo "   2. When it focuses on a zone, the main screen starts building"
    echo "   3. Elements appear progressively based on system templates"
    echo "   4. Click zones to manually focus the eye"
    echo "   5. Interact with built elements to trigger actions"
    echo ""
    echo "📊 INTERFACE LAYOUT:"
    echo "   • Left Panel: Minimap with eyeball and zones"
    echo "   • Eye Status: Current state and focus information"
    echo "   • Build Status: Active construction progress"
    echo "   • Control Panel: Manual eye control buttons"
    echo "   • Main Screen: Dynamic canvas where systems build"
    echo ""
    echo "🎮 INTERACTIVE CONTROLS:"
    echo "   • Center Eye - Reset eyeball to center position"
    echo "   • Clear Canvas - Remove all built elements"
    echo "   • Toggle Tracking - Enable/disable eye movement"
    echo "   • Random Focus - Randomly focus on a zone"
    echo ""
    echo "👁️ EYE STATES:"
    echo "   • Scanning - Looking around for interesting zones"
    echo "   • Focusing - Concentrating on a specific area"
    echo "   • Building - Actively constructing screen elements"
    echo "   • Creating - High-intensity creation mode"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening minimap eyeball interface..."
        open http://localhost:3333
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening minimap eyeball interface..."
        xdg-open http://localhost:3333
    else
        echo "📱 Manually visit: http://localhost:3333"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $EYEBALL_PID"
    echo ""
    echo "👁️ The eye sees all, builds all, creates reality..."
    echo ""
    
    # Keep script running
    echo "🔄 Minimap eyeball running... Press Ctrl+C to stop"
    trap "echo ''; echo '👁️ Closing the eye...'; kill $EYEBALL_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $EYEBALL_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Minimap eyeball system stopped"
else
    echo "❌ Failed to launch Minimap Eyeball System"
    exit 1
fi