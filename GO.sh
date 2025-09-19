#!/bin/bash
# 🚀 GO - THE ULTIMATE ONE-BUTTON SOLUTION
# This is it. The only command you need to remember.

echo "🚀 STARTING THE ONE-BUTTON INTERFACE..."
echo ""

# Kill any existing instances
pkill -f "one-button-launcher.js" 2>/dev/null || true
sleep 1

# Start the one-button launcher
node one-button-launcher.js &
LAUNCHER_PID=$!

# Wait for it to start
echo "⏳ Starting launcher..."
sleep 3

# Check if it started
if curl -s http://localhost:7777 > /dev/null; then
    echo "✅ One-button launcher ready!"
    echo ""
    echo "🎯 OPEN YOUR BROWSER TO:"
    echo "   http://localhost:7777"
    echo ""
    echo "🔥 CLICK THE BIG BUTTON TO START EVERYTHING!"
    echo ""
    echo "💡 That's it. One click starts your entire platform."
    echo ""
    
    # Open browser automatically
    if command -v open &> /dev/null; then
        open http://localhost:7777
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:7777
    fi
    
    # Keep script running
    echo "Press Ctrl+C to stop everything..."
    wait $LAUNCHER_PID
else
    echo "❌ Failed to start launcher"
    exit 1
fi