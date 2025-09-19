#!/bin/bash

# 🚀 SOULFRA PLATFORM - ONE-COMMAND INSTALLER
echo "🚀 Installing Soulfra Platform..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Copy environment template
if [ ! -f .env ]; then
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "📄 Environment template copied to .env"
    fi
fi

# Test systems
echo "🧪 Testing systems..."
npm run test-systems

if [ $? -ne 0 ]; then
    echo "⚠️ System tests failed, but continuing..."
fi

# Start platform
echo "🚀 Starting Soulfra Platform..."
echo ""
echo "🎯 Platform will be available at:"
echo "   http://localhost:3000"
echo ""
echo "🎮 Key endpoints:"
echo "   🏴 Flag & Tag Dashboard: http://localhost:3000/flags"
echo "   👑 Vanity Rooms: http://localhost:3000/vanity"
echo "   🤖 AI Economy: http://localhost:3000/economy"
echo "   🆓 Free Access: http://localhost:3000/free"
echo ""

npm start