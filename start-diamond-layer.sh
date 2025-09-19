#!/bin/bash

# 💎 DIAMOND LAYER STARTUP SCRIPT
# One command to rule them all

echo "💎 Starting Diamond Layer Multiverse System..."
echo "============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws sqlite3 crypto
fi

# Create necessary directories
mkdir -p data/realities data/snapshots data/backups logs

# Start the launcher
echo "🚀 Launching Diamond Layer..."
echo ""
node diamond-layer-launcher.js

# If launcher exits, show message
echo ""
echo "💎 Diamond Layer has been shut down."
echo "Run './start-diamond-layer.sh' to start again."