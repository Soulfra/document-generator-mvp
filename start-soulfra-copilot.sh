#!/bin/bash

# 🚀 SOULFRA COPILOT SERVICE LAUNCHER
# Starts the multi-persona AI assistant for remote control

echo "
╔══════════════════════════════════════════════════════════════╗
║                 🤖 SOULFRA COPILOT LAUNCHER                  ║
║                                                              ║
║  Starting Multi-Persona AI Assistant...                     ║
║                                                              ║
║  Personas: COPILOT | ROUGHSPARKS | SATOSHI                  ║
║  Port: 3007                                                  ║
║  Remote Interface: http://localhost:3007/remote             ║
╚══════════════════════════════════════════════════════════════╝
"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if required dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express cors ws
fi

# Create a simple package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📄 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "soulfra-copilot",
  "version": "1.0.0",
  "description": "Multi-persona AI assistant for Soulfra remote control",
  "main": "soulfra-copilot-service.js",
  "scripts": {
    "start": "node soulfra-copilot-service.js",
    "dev": "node soulfra-copilot-service.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "ws": "^8.13.0"
  }
}
EOF
fi

# Install dependencies if package.json was just created
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start the copilot service
echo "🚀 Starting Soulfra Copilot Service..."
echo ""
echo "🔗 Service URL: http://localhost:3007"
echo "🎮 Remote Interface: http://localhost:3007/remote" 
echo "📡 WebSocket: ws://localhost:3007"
echo ""
echo "Press Ctrl+C to stop the service"
echo "=========================="

# Run the service
node soulfra-copilot-service.js