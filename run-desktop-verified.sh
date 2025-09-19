#!/bin/bash

# Document Generator Desktop Environment with Full Verification
# Runs the complete stack with Winamp-style media player and blamechain

echo "🖥️ DOCUMENT GENERATOR DESKTOP ENVIRONMENT"
echo "========================================"
echo "🎵 Winamp-style streaming media player"
echo "⛓️ Blamechain verification system" 
echo "📊 Real-time service monitoring"
echo "🌈 Color-coded streaming"
echo "📱 QR code generation"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker not found - some features will be limited"
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    
    # Kill all spawned processes
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    
    if [ ! -z "$STREAMING_PID" ]; then
        kill $STREAMING_PID 2>/dev/null
    fi
    
    if [ ! -z "$DESKTOP_PID" ]; then
        kill $DESKTOP_PID 2>/dev/null
    fi
    
    if [ ! -z "$ELECTRON_PID" ]; then
        kill $ELECTRON_PID 2>/dev/null
    fi
    
    # Stop Docker if we started it
    if [ "$DOCKER_STARTED" = "true" ]; then
        docker-compose down 2>/dev/null
    fi
    
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM EXIT

# Start services
echo "🚀 Starting services..."

# 1. Check if Docker services are needed
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "1️⃣ Starting Docker services..."
    docker-compose up -d postgres redis minio 2>/dev/null
    DOCKER_STARTED=true
    sleep 5
else
    echo "1️⃣ Skipping Docker services (Docker not available)"
    DOCKER_STARTED=false
fi

# 2. Start main server
echo "2️⃣ Starting Document Generator server..."
node server.js &
SERVER_PID=$!
sleep 3

# Check if server started
if ! lsof -i :3001 > /dev/null 2>&1; then
    echo "❌ Server failed to start on port 3001"
    exit 1
fi
echo "✅ Server running on port 3001"

# 3. Start streaming system
echo "3️⃣ Starting integrated streaming system..."
node integrated-streaming-system.js &
STREAMING_PID=$!
sleep 2

# Check if streaming started
if ! lsof -i :8917 > /dev/null 2>&1; then
    echo "⚠️ Streaming system may not be running"
fi

# 4. Start desktop integration (blamechain)
echo "4️⃣ Starting desktop integration service..."
node desktop-integration.js &
DESKTOP_PID=$!
sleep 2

# Check if desktop integration started
if ! lsof -i :47000 > /dev/null 2>&1; then
    echo "⚠️ Desktop integration may not be running"
fi

# 5. Start Electron with desktop environment
echo "5️⃣ Starting Chrome native desktop app..."
echo ""
echo "🖥️ DESKTOP ENVIRONMENT READY!"
echo "================================"
echo "✅ Main server: http://localhost:3001"
echo "✅ Streaming API: http://localhost:8917"
echo "✅ Blamechain API: http://localhost:47000"
echo "✅ WebSocket: ws://localhost:8918"
echo ""
echo "🎮 Desktop Features:"
echo "  • Stream Player - Control Rust/Solidity/Docker/Flask streams"
echo "  • Blamechain - View all system actions in blockchain"
echo "  • Monitor - Real-time service status"
echo "  • Verify - Run full system verification"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run Electron
npm run electron-chrome

# If Electron exits, keep services running
echo ""
echo "Electron closed. Services still running."
echo "Press Ctrl+C to stop all services"

# Wait forever
while true; do
    sleep 1
done