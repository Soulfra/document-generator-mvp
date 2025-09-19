#!/bin/bash

# 🌐 Start Simple Web Server for SoulFRA Interfaces

echo "🌐 Starting SoulFRA Web Server..."
echo "================================"

# Kill existing server on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 1

# Start Python HTTP server (works on both Python 2 and 3)
if command -v python3 &> /dev/null; then
    echo "🚀 Starting Python 3 HTTP server on port 8080..."
    python3 -m http.server 8080 &
    SERVER_PID=$!
elif command -v python &> /dev/null; then
    echo "🚀 Starting Python 2 HTTP server on port 8080..."
    python -m SimpleHTTPServer 8080 &
    SERVER_PID=$!
else
    echo "❌ Python not found. Please install Python to serve the web interfaces."
    exit 1
fi

# Wait a moment for server to start
sleep 2

echo ""
echo "🌟 SoulFRA Web Server Ready!"
echo "============================"
echo "🎨 BrandAidKit:       http://localhost:8080/BrandAidKit.html"
echo "❄️ ColdStartKit:      http://localhost:8080/ColdStartKit.html" 
echo "🌟 SoulFRA Dashboard: http://localhost:8080/SoulFRA-Dashboard.html"
echo ""
echo "Server PID: $SERVER_PID"
echo "To stop: kill $SERVER_PID"
echo ""
echo "Press Ctrl+C to stop the web server"

# Handle Ctrl+C
trap "echo ''; echo '🛑 Stopping web server...'; kill $SERVER_PID 2>/dev/null; echo '✅ Web server stopped'; exit 0" INT

# Keep script running
while true; do
    sleep 1
done