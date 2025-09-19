#!/bin/bash

# 🎯 COMPONENT CONNECTION SWIPER LAUNCHER
# 
# Launches the visual component connection interface
# Combines micro-file-swiper with component discovery engine

echo "🎯 Starting Component Connection Swiper..."
echo "🔗 Visual interface for architectural decisions"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if required dependencies are available
echo "📦 Checking dependencies..."
if [ ! -f "COMPONENT-DISCOVERY-ENGINE.js" ]; then
    echo "❌ COMPONENT-DISCOVERY-ENGINE.js not found"
    exit 1
fi

# Install required packages if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
    echo "📦 Installing required dependencies..."
    npm init -y 2>/dev/null
    npm install express ws hammer 2>/dev/null
fi

echo "✅ Dependencies ready"
echo ""

# Start the swiper
echo "🚀 Launching Component Connection Swiper on http://localhost:3009"
echo ""
echo "Features:"
echo "  🔍 Discovery Mode: Find and analyze components"
echo "  🔗 Connection Mode: Decide component relationships"
echo "  📊 Layer Assignment: Grant → Game → Gaming layers"
echo ""
echo "Swipe Actions:"
echo "  ← Left: No connection needed"
echo "  → Right: Connect these components"
echo "  ↑ Up: Keep separate but in same layer"
echo "  ↓ Down: Assign to different layer"
echo ""
echo "Press Ctrl+C to stop"
echo ""

node component-connection-swiper.js