#!/bin/bash

# 🚀 Launch VC Demo - Brand Generation Platform
# This script starts the investor-ready demo interface

echo "🚀 Starting Brand Generation Platform Demo"
echo "=========================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express cors
fi

# Kill any existing demo processes
echo "🔄 Stopping any existing demo processes..."
pkill -f "vc-demo-backend" 2>/dev/null || true
sleep 2

# Start the demo backend
echo "🌟 Starting demo backend server..."
node vc-demo-backend.js &
BACKEND_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Demo backend started successfully (PID: $BACKEND_PID)"
    
    # Try to open in browser
    if command -v open &> /dev/null; then
        echo "🌐 Opening demo in browser..."
        open http://localhost:3001
    elif command -v xdg-open &> /dev/null; then
        echo "🌐 Opening demo in browser..."
        xdg-open http://localhost:3001
    else
        echo "🌐 Demo running at: http://localhost:3001"
        echo "   Open this URL in your browser to see the investor demo"
    fi
    
    echo ""
    echo "🎯 INVESTOR DEMO READY!"
    echo "======================="
    echo "Demo URL: http://localhost:3001"
    echo "API Health: http://localhost:3001/api/health"
    echo "Analytics: http://localhost:3001/api/analytics"
    echo ""
    echo "📋 Demo Features:"
    echo "• Complete brand generation in 30 minutes"
    echo "• Real-time progress tracking"
    echo "• 4 industry examples ready to go"
    echo "• Full business plan & website generation"
    echo "• Mobile-responsive design"
    echo ""
    echo "💡 Pro Tip for VCs:"
    echo "Try the 'Coffee Delivery' example for the best demo experience!"
    echo ""
    echo "Press Ctrl+C to stop the demo"
    
    # Keep script running and handle cleanup
    trap 'echo ""; echo "🛑 Stopping demo..."; kill $BACKEND_PID 2>/dev/null; exit 0' INT
    
    # Wait for the background process
    wait $BACKEND_PID
    
else
    echo "❌ Failed to start demo backend"
    echo "Check the console for error messages"
    exit 1
fi