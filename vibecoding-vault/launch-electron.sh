#!/bin/bash

echo "🚀 Launching Vibecoding Vault with Network Fixes..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run network connectivity test first
echo "🔍 Running network connectivity test..."
node test-network-connectivity.js
echo ""

# Set environment variables for better network debugging
export NODE_ENV=development
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_LOG_LEVEL=verbose

# Optional: Disable IPv6 if having issues
# export DISABLE_IPV6=1

# Optional: Set custom DNS servers
# export CUSTOM_DNS="8.8.8.8,1.1.1.1"

# Optional: Set proxy if behind corporate firewall
# export HTTP_PROXY="http://your-proxy:8080"
# export HTTPS_PROXY="http://your-proxy:8080"
# export NO_PROXY="localhost,127.0.0.1"

echo "🎮 Starting Electron app..."
echo "Press Ctrl+C to stop"
echo ""

# Start Electron with verbose logging
npm start -- --enable-logging --v=1