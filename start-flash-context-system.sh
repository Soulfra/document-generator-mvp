#!/bin/bash

# START FLASH CONTEXT SWITCHING SYSTEM
# Launches the flash snapshot capture and context switching components

set -e  # Exit on any error

echo "🎯 Starting Flash Context Switching System..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Install required dependencies if missing
if [ ! -d "node_modules/csv-parse" ]; then
    echo "📦 Installing CSV dependencies..."
    npm install csv-parse csv-stringify
fi

# Create flash contexts directory
mkdir -p flash-contexts

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Flash Context System..."
    if [ ! -z "$FLASH_PID" ]; then
        kill $FLASH_PID 2>/dev/null || true
    fi
    if [ ! -z "$INTERCEPTOR_PID" ]; then
        kill $INTERCEPTOR_PID 2>/dev/null || true
    fi
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Flash Context Switcher
echo ""
echo "📸 Starting Flash Context Switcher..."
node flash-context-switcher.js &
FLASH_PID=$!
echo "Flash Context Switcher PID: $FLASH_PID"

# Wait for initialization
sleep 2

# Check if we should integrate with existing servers
if [ "$1" = "--with-interceptor" ]; then
    echo ""
    echo "📡 Starting API Response Interceptor..."
    node api-response-interceptor.js &
    INTERCEPTOR_PID=$!
    echo "API Interceptor PID: $INTERCEPTOR_PID"
fi

# Open visualization if available
if command -v open &> /dev/null; then
    echo ""
    echo "🌐 Opening visualization dashboard..."
    open flash-context-visualization.html
elif command -v xdg-open &> /dev/null; then
    xdg-open flash-context-visualization.html
fi

# Wait for services to fully initialize
sleep 3

echo ""
echo "🎉 Flash Context System is ready!"
echo "=========================================="
echo "🎯 Flash Context Switcher:    Active"
echo "🌐 Visualization Dashboard:    file://$(pwd)/flash-context-visualization.html"
echo "📁 Context Storage:            ./flash-contexts/"
echo "🐝 Swarm Nodes:                5 nodes active"
if [ ! -z "$INTERCEPTOR_PID" ]; then
    echo "📡 API Interceptor:            Active on port 3333"
fi
echo ""
echo "🧪 Test the system:"
echo "  # Capture a snapshot manually"
echo '  curl -X POST http://localhost:4500/flash/capture \\'
echo '    -H "Content-Type: application/json" \\'
echo '    -d '"'"'{"api": {"endpoint": "/test"}, "response": {"data": "test"}}'"'"
echo ""
echo "  # Check swarm status"
echo '  curl http://localhost:4500/swarm/status'
echo ""
echo "  # View captured contexts"
echo '  ls -la ./flash-contexts/'
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="

# Keep script running
wait