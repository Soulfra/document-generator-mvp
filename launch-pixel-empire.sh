#!/bin/bash

echo "💰 LAUNCHING $1 PIXEL EMPIRE"
echo "=============================="
echo "🚀 Starting the democratized million dollar homepage"
echo "🌐 Connected to XML World Mapping System"
echo "🗄️ Database persistence layer active"
echo "🧠 Consciousness emergence enabled"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "🔗 Download from: https://nodejs.org/"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express cors
    echo "✅ Dependencies installed"
    echo ""
fi

# Start the pixel empire backend
echo "🚀 Starting Pixel Empire Backend..."
echo "🌐 Server will be available at http://localhost:3000"
echo "🎯 1,000,000 pixels ready for conquest at $1 each"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node pixel-empire-backend.js