#!/bin/bash

echo "🚀 Starting Visualization Demo"
echo "=============================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Start the core algo trading layer (this has the main charts)
echo "📈 Starting Algo Trading Layer with Charts..."
node algo-trading-unified-layer.js &
ALGO_PID=$!

# Wait for it to start
sleep 3

# Start the master dashboard
echo "🎯 Starting Master Dashboard..."
node unified-trading-visualization-launcher.js &
LAUNCHER_PID=$!

# Wait for both to start
sleep 5

echo ""
echo "✅ VISUALIZATION DEMO READY!"
echo ""
echo "🎯 Master Dashboard: http://localhost:10000"
echo "📈 Algo Trading Charts: http://localhost:9997"
echo "🌐 WebSocket Feed: ws://localhost:9998"
echo ""
echo "⌨️  Agility Shortcuts Available:"
echo "   Ctrl+1-3: Switch Chart Views"
echo "   Ctrl+B/S: Quick Buy/Sell"
echo "   Alt+C/T/G/R: Navigate Components"
echo ""
echo "🔍 The charts and graphing components are now visible!"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $ALGO_PID 2>/dev/null
    kill $LAUNCHER_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait