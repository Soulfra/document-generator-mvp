#!/bin/bash

echo "🚀 Launching Self-Organizing System"
echo "=================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check for required npm packages
echo "📦 Checking dependencies..."
REQUIRED_PACKAGES=("express" "ws" "sqlite3" "js-yaml" "xml2js" "esprima" "escodegen" "typescript")
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
echo "✅ Dependencies ready"
echo ""

# Check if other services are running that might conflict
echo "🔍 Checking for port conflicts..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 8080 is already in use. Stopping existing service..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 8081 is already in use. Stopping existing service..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo "🎭 Starting Self-Organizing System with Character Integration..."
echo ""

# Launch the integrated system
node integrate-self-organizing.js &
MAIN_PID=$!

# Wait a moment for the server to start
sleep 3

# Check if the process is running
if ps -p $MAIN_PID > /dev/null; then
    echo ""
    echo "✨ Self-Organizing System is running!"
    echo ""
    echo "📊 Dashboard: http://localhost:8080"
    echo "🔌 WebSocket: ws://localhost:8081"
    echo "🌐 API Endpoints:"
    echo "   - GET  /api/status"
    echo "   - POST /api/translate"
    echo "   - POST /api/task"
    echo "   - POST /api/approval/:id"
    echo "   - POST /api/debug"
    echo "   - GET  /api/suggestions"
    echo ""
    echo "🎭 Characters:"
    echo "   - Cal (System Orchestrator)"
    echo "   - Ralph (System Tester)"
    echo "   - Arty (System Healer)"
    echo "   - Claude (Human Interface)"
    echo ""
    echo "Press Ctrl+C to stop the system"
    echo ""
    
    # Keep the script running
    wait $MAIN_PID
else
    echo "❌ Failed to start Self-Organizing System"
    echo "Check the logs for errors"
    exit 1
fi