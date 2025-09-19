#!/bin/bash

echo "🎵 COMPLETE GROOVE LAYER LAUNCH"
echo "==============================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Install required dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing required Node.js packages..."
    npm install express ws axios cheerio 2>/dev/null || {
        echo "⚠️ npm install failed, continuing anyway..."
    }
fi

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:48022 | xargs kill -9 2>/dev/null || true  
lsof -ti:48023 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo "🚀 STARTING ALL GROOVE SERVICES..."
echo ""

# Start the groove layer system
echo "🎶 Starting Groove Layer System (Backend)..."
node groove-layer-system.js > groove-layer.log 2>&1 &
GROOVE_PID=$!
echo "   Process ID: $GROOVE_PID"
echo "   Log: tail -f groove-layer.log"

sleep 3

# Start the DJ integration system  
echo "🎧 Starting DJ Integration System (Backend)..."
node web-dj-integration-system.js > dj-integration.log 2>&1 &
DJ_PID=$!
echo "   Process ID: $DJ_PID"
echo "   Log: tail -f dj-integration.log"

sleep 3

# Start the web server
echo "🌐 Starting Web Server (Frontend)..."
node groove-web-server.js > web-server.log 2>&1 &
WEB_PID=$!
echo "   Process ID: $WEB_PID"
echo "   Log: tail -f web-server.log"

sleep 5

echo ""
echo "✅ ALL GROOVE SERVICES ACTIVE!"
echo "============================="
echo ""
echo "🌐 WEB INTERFACES:"
echo "   🎵 Main Groove: http://localhost:8080"
echo "   🎧 DJ Interface: http://localhost:8080/dj"
echo "   🔍 System Health: http://localhost:8080/api/health"
echo ""
echo "🔌 BACKEND APIS:"
echo "   🎶 Groove Layer: http://localhost:48022"
echo "   🎧 DJ Integration: http://localhost:48023" 
echo ""
echo "📱 PWA FEATURES:"
echo "   📋 Manifest: http://localhost:8080/manifest.json"
echo "   ⚙️ Service Worker: Available for offline use"
echo ""
echo "📊 LOGS:"
echo "   🎶 Groove Layer: tail -f groove-layer.log"
echo "   🎧 DJ Integration: tail -f dj-integration.log"
echo "   🌐 Web Server: tail -f web-server.log"
echo ""

# Test if services are responding
echo "🧪 TESTING SERVICES..."
sleep 2

# Test web server
if curl -sf http://localhost:8080/api/health > /dev/null; then
    echo "   ✅ Web Server: Responding"
else
    echo "   ❌ Web Server: Not responding"
fi

# Test groove layer
if curl -sf http://localhost:48022/health > /dev/null; then
    echo "   ✅ Groove Layer: Responding"  
else
    echo "   ❌ Groove Layer: Not responding"
fi

# Test DJ integration
if curl -sf http://localhost:48023/health > /dev/null; then
    echo "   ✅ DJ Integration: Responding"
else
    echo "   ❌ DJ Integration: Not responding"
fi

echo ""
echo "🎯 READY TO GROOVE!"
echo ""
echo "   👉 Open: http://localhost:8080"
echo ""

# Auto-open browser if available
if command -v open >/dev/null 2>&1; then
    echo "🚀 Opening browser automatically..."
    sleep 2
    open http://localhost:8080
elif command -v xdg-open >/dev/null 2>&1; then
    echo "🚀 Opening browser automatically..."
    sleep 2
    xdg-open http://localhost:8080
else
    echo "💡 Please open http://localhost:8080 in your browser"
fi

echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Create cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all groove services..."
    kill $GROOVE_PID $DJ_PID $WEB_PID 2>/dev/null
    sleep 2
    echo "🔄 Cleanup complete"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Wait for user interrupt
echo "🎵 Groove system running... (Ctrl+C to stop)"
wait