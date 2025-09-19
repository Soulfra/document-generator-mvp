#!/bin/bash

echo "🎵 STARTING GROOVE LAYER SYSTEM"
echo "=============================="

# Kill any existing processes on these ports
echo "🔄 Cleaning up existing processes..."
lsof -ti:48022 | xargs kill -9 2>/dev/null || true
lsof -ti:48023 | xargs kill -9 2>/dev/null || true

# Start the groove layer system in background
echo "🎶 Starting Groove Layer System (port 48022)..."
node groove-layer-system.js &
GROOVE_PID=$!

# Wait a moment for groove system to start
sleep 3

# Start the web DJ integration system in background  
echo "🎧 Starting Web DJ Integration System (port 48023)..."
node web-dj-integration-system.js &
DJ_PID=$!

# Wait for systems to initialize
sleep 5

echo ""
echo "✅ GROOVE LAYER SYSTEM ACTIVE"
echo "============================="
echo "🎵 Groove Layer API: http://localhost:48022"
echo "🎧 DJ Integration API: http://localhost:48023"
echo ""
echo "🌐 INTERFACES AVAILABLE:"
echo "📊 Groove Visualizer: file://$(pwd)/groove-visualization-interface.html"
echo "🎵 DJ Interface: file://$(pwd)/collaborative-dj-interface.html"
echo ""
echo "🎯 QUICK ACCESS:"
echo "open groove-visualization-interface.html"
echo "open collaborative-dj-interface.html"
echo ""

# Open interfaces automatically
if command -v open >/dev/null 2>&1; then
    echo "🚀 Opening interfaces automatically..."
    open groove-visualization-interface.html
    sleep 2
    open collaborative-dj-interface.html
else
    echo "💡 Manually open the HTML files in your browser"
fi

echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap 'echo "🛑 Stopping groove systems..."; kill $GROOVE_PID $DJ_PID 2>/dev/null; exit' INT
wait