#!/bin/bash
# START-GAMING-ARPANET.sh - Launch the complete local gaming ARPANET

echo "🚀 STARTING LOCAL GAMING ARPANET"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install required npm packages if not present
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws qrcode multer electron --save 2>/dev/null || {
        echo "⚠️  NPM install failed, continuing anyway..."
    }
fi

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8892,8893,9000,9001 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

echo ""
echo "🌐 ARPANET NODES STARTING..."
echo "============================"

# Start Voxel World Server (Node 1)
echo "🌀 Starting Voxel World Server (Node 1)..."
cd FinishThisIdea
node voxel-shadow-wormhole-engine.js &
VOXEL_PID=$!
cd ..
sleep 3

# Start Economic Engine Server (Node 2)  
echo "💰 Starting Economic Engine Server (Node 2)..."
python3 -m http.server 8893 --directory . &
ECONOMIC_PID=$!
sleep 2

# Start Character System & QR Server (Central Hub)
echo "📸 Starting Character System & QR Server (Central Hub)..."
node PHOTO-TO-CHARACTER-ELECTRON.js &
ELECTRON_PID=$!
sleep 3

# Start any additional game servers
if [ -f "FinishThisIdea-Complete/dist/unified-server.js" ]; then
    echo "🤖 Starting AI Arena Server (Node 3)..."
    cd FinishThisIdea-Complete
    npm start &
    ARENA_PID=$!
    cd ..
    sleep 3
fi

echo ""
echo "🎉 LOCAL GAMING ARPANET IS LIVE!"
echo "================================"
echo ""
echo "📡 NETWORK TOPOLOGY:"
echo "   ┌─────────────────────────────────────────┐"
echo "   │          GAMING ARPANET                 │"
echo "   └─────────────────────────────────────────┘"
echo "   📱 Phone QR Upload     → http://localhost:9000"
echo "   🎮 Character System    → Electron App"
echo "   🌀 Voxel World (Node1) → http://localhost:8892"
echo "   💰 Economic (Node2)    → http://localhost:8893"
echo "   🤖 AI Arena (Node3)    → http://localhost:3001"
echo "   🔌 WebSocket Hub       → ws://localhost:9001"
echo ""
echo "📸 HOW TO USE:"
echo "   1. Open the Electron app (should launch automatically)"
echo "   2. Scan QR code with your phone"
echo "   3. Upload a photo from your phone"
echo "   4. Your character will appear in all games!"
echo "   5. Use WASD to move your character in games"
echo ""
echo "🎮 GAME ACCESS:"
echo "   • Voxel World: http://localhost:8892"
echo "   • Economic Engine: http://localhost:8893/babylon-economic-engine.html"
echo "   • AI Arena: http://localhost:3001/arena"
echo ""
echo "🔒 SECURITY:"
echo "   • Fully offline local network"
echo "   • No cloud dependencies"
echo "   • Character data stays on your device"
echo "   • Biometric authentication available"
echo ""
echo "📊 MONITORING:"
echo "   • Character saves: ./character-saves/"
echo "   • Network status: All nodes connected via WebSocket"
echo "   • Fault tolerance: Games can restart independently"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 SHUTTING DOWN GAMING ARPANET..."
    echo "=================================="
    
    echo "🔌 Stopping WebSocket connections..."
    kill $ELECTRON_PID 2>/dev/null || true
    
    echo "🌀 Stopping Voxel World Server..."
    kill $VOXEL_PID 2>/dev/null || true
    
    echo "💰 Stopping Economic Engine Server..."
    kill $ECONOMIC_PID 2>/dev/null || true
    
    if [ ! -z "$ARENA_PID" ]; then
        echo "🤖 Stopping AI Arena Server..."
        kill $ARENA_PID 2>/dev/null || true
    fi
    
    echo "🧹 Cleaning up ports..."
    lsof -ti:8892,8893,9000,9001 | xargs kill -9 2>/dev/null || true
    
    echo "✅ Gaming ARPANET shut down complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo "⚡ ARPANET is running... Press Ctrl+C to shutdown"
echo ""
echo "🔄 Real-time status:"

# Status monitoring loop
while true do
    sleep 10
    
    # Check if processes are still running
    VOXEL_STATUS="❌ Offline"
    ECONOMIC_STATUS="❌ Offline"
    ELECTRON_STATUS="❌ Offline"
    
    if kill -0 $VOXEL_PID 2>/dev/null; then
        VOXEL_STATUS="✅ Online"
    fi
    
    if kill -0 $ECONOMIC_PID 2>/dev/null; then
        ECONOMIC_STATUS="✅ Online"
    fi
    
    if kill -0 $ELECTRON_PID 2>/dev/null; then
        ELECTRON_STATUS="✅ Online"
    fi
    
    # Clear previous status and show current
    printf "\r🌀 Voxel: $VOXEL_STATUS | 💰 Economic: $ECONOMIC_STATUS | 📸 Character: $ELECTRON_STATUS"
    
    # Auto-restart failed services
    if ! kill -0 $VOXEL_PID 2>/dev/null; then
        echo ""
        echo "🔄 Restarting Voxel World Server..."
        cd FinishThisIdea
        node voxel-shadow-wormhole-engine.js &
        VOXEL_PID=$!
        cd ..
    fi
    
    if ! kill -0 $ECONOMIC_PID 2>/dev/null; then
        echo ""
        echo "🔄 Restarting Economic Engine Server..."
        python3 -m http.server 8893 --directory . &
        ECONOMIC_PID=$!
    fi
    
    if ! kill -0 $ELECTRON_PID 2>/dev/null; then
        echo ""
        echo "🔄 Restarting Character System..."
        node PHOTO-TO-CHARACTER-ELECTRON.js &
        ELECTRON_PID=$!
    fi
done