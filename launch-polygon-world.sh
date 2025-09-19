#!/bin/bash

# 🌐🎮 POLYGON WORLD LAUNCHER
# Starts the unified polygon companion world query system

echo "🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮"
echo "🎮 LAUNCHING POLYGON WORLD SYSTEM 🎮"
echo "🌐 Multi-World Orchestration Platform 🌐"
echo "🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if required dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws graphql express-graphql cors
fi

# Kill any existing processes on our ports
echo "🔧 Cleaning up existing processes..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:9999 | xargs kill -9 2>/dev/null || true
lsof -ti:9003 | xargs kill -9 2>/dev/null || true

# Start the systems
echo ""
echo "🚀 Starting Polygon World Systems..."
echo ""

# Start the main Polygon World Query API (port 1337)
echo "🌐 Starting Polygon World Query API on port 1337..."
node polygon-world-query-api.js &
QUERY_PID=$!

# Give it a moment to start
sleep 2

# Display access information
echo ""
echo "✅ POLYGON WORLD SYSTEM LAUNCHED!"
echo ""
echo "🌐 Access Points:"
echo "  📡 Main API: http://localhost:1337"
echo "  📊 GraphQL: http://localhost:1337/graphql"
echo "  💻 Developer Dashboard: http://localhost:1337/dashboard"
echo "  🔌 WebSocket: ws://localhost:1337"
echo ""
echo "🎮 Quick Start:"
echo "  1. Open the dashboard: http://localhost:1337/dashboard"
echo "  2. Create a new world using the UI"
echo "  3. Use GraphQL playground for queries"
echo "  4. Connect via WebSocket for real-time updates"
echo ""
echo "📚 API Examples:"
echo "  Create World: POST http://localhost:1337/api/worlds"
echo "  List Worlds: GET http://localhost:1337/api/worlds"
echo "  Fork World: POST http://localhost:1337/api/1337/fork-world"
echo ""
echo "🛑 To stop: Press Ctrl+C or run ./stop-polygon-world.sh"
echo ""

# Keep the script running and handle shutdown
trap 'echo ""; echo "🛑 Shutting down Polygon World System..."; kill $QUERY_PID 2>/dev/null; exit' INT TERM

# Wait for the process
wait $QUERY_PID