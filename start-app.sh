#!/bin/bash

# Document Generator - Simple Start Script
# Double-click this file to start the application

echo "🚀 Starting Document Generator..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Press any key to exit..."
    read -n 1 -s
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo "Press any key to exit..."
        read -n 1 -s
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  First time setup - running configuration wizard..."
    node setup.js
fi

# Start the application
echo "🌐 Starting server..."
echo ""
echo "📍 Application will be available at:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   http://localhost:3000/docs/"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="

# Load environment variables
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Start the server and open browser
node oauth-server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Try to open browser (works on macOS, Linux, Windows)
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000
elif command -v start &> /dev/null; then
    # Windows
    start http://localhost:3000
else
    echo "🌐 Please open your browser to: http://localhost:3000"
fi

# Wait for server to finish
wait $SERVER_PID