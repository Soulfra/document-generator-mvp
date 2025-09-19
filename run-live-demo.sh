#!/bin/bash

# LIVE DEMO LAUNCHER
# Actually runs the fucking thing

echo "🚀 LAUNCHING LIVE 4D VECTORIZED WORLD DEMO"
echo "=========================================="

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 Opening on macOS..."
    open LIVE-4D-VECTORIZED-WORLD.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Opening on Linux..."
    xdg-open LIVE-4D-VECTORIZED-WORLD.html
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "🪟 Opening on Windows..."
    start LIVE-4D-VECTORIZED-WORLD.html
else
    echo "❓ Unknown OS, trying generic open..."
    python3 -m webbrowser LIVE-4D-VECTORIZED-WORLD.html
fi

echo ""
echo "✅ DEMO LAUNCHED!"
echo ""
echo "🎮 CONTROLS:"
echo "  🔴 Click the red button to activate components"
echo "  ⌨️  Spacebar also activates the button"
echo "  🖱️  Click component cells to toggle them"
echo "  📊 Click CONSOLE to see live activity"
echo "  🔄 Double-click button for EMERGENCY MODE"
echo ""
echo "🌌 FEATURES:"
echo "  ✅ Real 3D visualization with Three.js"
echo "  ✅ 4D vector space representation"  
echo "  ✅ Live component interaction"
echo "  ✅ Million-dollar-homepage style grid"
echo "  ✅ Real-time data simulation"
echo "  ✅ Minimap navigation"
echo "  ✅ Console logging"
echo ""
echo "🎯 WHAT IT DOES:"
echo "  🕷️ Simulates grant scraping"
echo "  🗣️  Processes multiple languages"
echo "  🌐 Crawls web APIs"
echo "  🎮 Shows all our components in 3D space"
echo "  📊 Tracks everything in real-time"
echo ""
echo "This is the ACTUAL WORKING DEMO of our entire system!"

# Start a simple Python server if requested
if [[ "$1" == "--server" ]]; then
    echo ""
    echo "🌐 Starting local server on port 8000..."
    echo "Open http://localhost:8000/LIVE-4D-VECTORIZED-WORLD.html"
    python3 -m http.server 8000
fi