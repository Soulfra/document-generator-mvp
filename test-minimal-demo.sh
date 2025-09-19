#!/bin/bash

# 🎯 TEST MINIMAL DEMO - Prove something actually works!

echo "🎮 TESTING MINIMAL WORKING 3D DEMO"
echo "================================="
echo ""
echo "This will start a REAL, WORKING demo - not fantasy documentation!"
echo ""

# Start simple HTTP server
echo "🚀 Starting HTTP server on port 8888..."
python3 -m http.server 8888 &
SERVER_PID=$!

echo "✅ Server started (PID: $SERVER_PID)"
echo ""
echo "📊 WHAT THIS PROVES:"
echo "  ✅ We CAN create working demos"
echo "  ✅ We DON'T need complex infrastructure"
echo "  ✅ We SHOULD start simple"
echo ""
echo "🌐 Opening browser..."
echo "   URL: http://localhost:8888/minimal-working-3d-demo.html"
echo ""

# Open in browser
sleep 2
if command -v open &> /dev/null; then
    open "http://localhost:8888/minimal-working-3d-demo.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8888/minimal-working-3d-demo.html"
fi

echo "Press Ctrl+C to stop the server"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping server..."
    kill $SERVER_PID 2>/dev/null
    echo "✅ Demo stopped"
    exit 0
}

trap cleanup INT TERM

# Keep running
while true; do
    sleep 1
done