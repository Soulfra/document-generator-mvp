#!/bin/bash

# Start Ship Decoder System
echo "🚢 Starting Viking/Pirate Ship 3D Decoder System..."

# Kill any existing server on port 8116
lsof -ti:8116 | xargs kill -9 2>/dev/null

# Start the streaming server in background
echo "⚓ Starting streaming server on port 8116..."
node ship-streaming-server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Streaming server started successfully (PID: $SERVER_PID)"
    
    # Open the HTML interface
    echo "🌊 Opening 3D visualization interface..."
    open pirate-ship-3d-decoder.html
    
    echo ""
    echo "🎯 System Ready!"
    echo "- Decoder Interface: file://$(pwd)/pirate-ship-3d-decoder.html"
    echo "- Streaming Server: http://localhost:8116"
    echo "- WebSocket: ws://localhost:8116/stream"
    echo ""
    echo "📜 Example formats loaded - try decoding!"
    echo "🗣️ Click on crew members to interact"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    # Keep script running to maintain server
    wait $SERVER_PID
else
    echo "❌ Failed to start streaming server"
    echo "Check if port 8116 is already in use"
fi