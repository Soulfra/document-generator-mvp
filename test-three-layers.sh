#!/bin/bash

# 🎯 TEST THREE LAYERS - See the pattern in action!

echo "🌊⚡🗺️ THREE-LAYER ARCHITECTURE TEST"
echo "===================================="
echo ""
echo "This demonstrates how:"
echo "1. RIGID APIs receive requests"
echo "2. FLUID state processes events"  
echo "3. MINIMAP shows limited view"
echo ""

# Check if demo is available
if [ ! -f "RIGID-FLUID-MINIMAP-DEMO.js" ]; then
    echo "❌ Demo file not found!"
    exit 1
fi

echo "🚀 Starting three-layer demo..."
echo ""

# Run the demo
echo "📡 Starting Rigid API Layer (Port 3337)..."
echo "🌊 Starting Fluid State Manager..."
echo "🗺️ Starting Minimap/MUD View..."
echo ""

node RIGID-FLUID-MINIMAP-DEMO.js &
DEMO_PID=$!

# Give it time to start
sleep 3

echo ""
echo "🧪 TESTING THE THREE LAYERS:"
echo "============================"
echo ""

echo "1️⃣ RIGID API TEST:"
echo "   Creating agent via unchanging API endpoint..."
echo ""
echo "   curl -X POST http://localhost:3337/api/agent/create"
echo "   -H 'Content-Type: application/json'"
echo "   -d '{\"name\": \"Test Assassin\"}'"
echo ""

# Test API call
curl -s -X POST http://localhost:3337/api/agent/create \
    -H "Content-Type: application/json" \
    -d '{"name": "Test Assassin"}' 2>/dev/null || echo "   (API not yet ready)"

echo ""
echo "2️⃣ FLUID STATE:"
echo "   The event flows through the blockchain-like state"
echo "   Everything is connected - agent creation affects:"
echo "   • Room population"
echo "   • Global stats"
echo "   • Economic metrics"
echo "   • Zone activity"
echo ""

echo "3️⃣ MINIMAP VIEW:"
echo "   But the MUD only shows:"
echo "   • 'A new agent appeared in spawn'"
echo "   • You can't see the global ripple effects!"
echo ""

echo "📊 PATTERN DEMONSTRATED:"
echo "======================="
echo "• API stayed rigid (same endpoint)"
echo "• State flowed everywhere (blockchain append)"
echo "• View showed limited info (just the room)"
echo ""

echo "🔍 Check the console output above to see:"
echo "• Blockchain event creation"
echo "• State flowing through system"
echo "• Limited MUD view updates"
echo ""

# Cleanup
echo "Press Ctrl+C to stop the demo"
echo ""

# Wait for interrupt
trap "kill $DEMO_PID 2>/dev/null; echo ''; echo '✅ Demo stopped'; exit 0" INT TERM

wait $DEMO_PID