#!/bin/bash

echo "🌐 Launching Meta-System Verification & Reasoning Overlay"
echo "========================================================"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "🔍 Checking for required dependencies..."
REQUIRED_PACKAGES=("ws" "sqlite3" "diff")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if [ ! -d "node_modules/$package" ]; then
        MISSING_PACKAGES+=($package)
    fi
done

if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
    echo "📥 Installing missing packages: ${MISSING_PACKAGES[*]}"
    npm install ${MISSING_PACKAGES[*]} --save
fi

echo ""
echo "🧠 Starting Meta-System Verification Components..."
echo ""

# Start the reasoning layer bridge
echo "1️⃣ Starting Reasoning Layer Bridge (WebSocket on port 3007)..."
node reasoning-layer-bridge.js &
BRIDGE_PID=$!

# Wait for bridge to initialize
sleep 3

# Check if we can open the overlay in a browser
if command -v open &> /dev/null; then
    echo "2️⃣ Opening Meta-Verification Overlay..."
    open meta-verification-overlay.html
elif command -v xdg-open &> /dev/null; then
    echo "2️⃣ Opening Meta-Verification Overlay..."
    xdg-open meta-verification-overlay.html
else
    echo "2️⃣ Meta-Verification Overlay available at:"
    echo "   file://$(pwd)/meta-verification-overlay.html"
fi

echo ""
echo "✅ Meta-System Verification is now running!"
echo ""
echo "🎯 What you can do:"
echo "   • Open the overlay in your browser to see real-time verification"
echo "   • Switch between dungeon (low-level) and sky (high-level) views"
echo "   • Navigate through the 5 system layers"
echo "   • Run verification tests with the 'RUN' button"
echo "   • Watch live reasoning streams"
echo ""
echo "🔧 Controls:"
echo "   • Ctrl+V: Run verification"
echo "   • Ctrl+R: Toggle reasoning stream"
echo "   • Ctrl+H: Toggle overlay"
echo ""
echo "📡 Services:"
echo "   • Reasoning Bridge: ws://localhost:3007"
echo "   • Overlay Interface: file://${PWD}/meta-verification-overlay.html"
echo ""

# Create a simple status checker
echo "📊 System Status:"
echo "   Bridge PID: $BRIDGE_PID"

# Check if the WebSocket is responding
sleep 2
if lsof -Pi :3007 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ Reasoning Bridge: Online"
else
    echo "   ❌ Reasoning Bridge: Failed to start"
fi

echo ""
echo "🎮 Demo Commands:"
echo "   # Test the backwards engineering system"
echo "   node backwards-engineering-system.js"
echo ""
echo "   # Test the interactive questioning"
echo "   node interactive-questioning-system.js"
echo ""
echo "   # Test document comparison"
echo "   node document-comparison-engine.js"
echo ""
echo "   # Test full integration"
echo "   node meta-system-integrator.js"
echo ""

# Keep the bridge running and show logs
echo "🔍 Live Reasoning Bridge Logs:"
echo "==============================="
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for the bridge process
wait $BRIDGE_PID