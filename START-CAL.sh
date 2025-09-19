#!/bin/bash

echo "🎮 STARTING CAL CENTRAL COMMAND 🎮"
echo "================================="
echo ""
echo "This will start the REAL dashboard that actually works!"
echo ""

# Kill any existing instance on port 7777
lsof -ti:7777 | xargs kill -9 2>/dev/null

# Make sure we have WebSocket support
if ! npm list ws >/dev/null 2>&1; then
    echo "📦 Installing WebSocket support..."
    npm install ws
fi

# Start Cal Central Command
echo "🚀 Starting Cal Central Command on port 7777..."
node cal-central-command.js &
CAL_PID=$!

echo ""
echo "✅ Cal Central Command is running!"
echo ""
echo "🌐 Open http://localhost:7777 in your browser"
echo ""
echo "Features:"
echo "  - See ALL running services (Docker + Node)"
echo "  - View real logs"
echo "  - Restart services with one click"
echo "  - Apply AI-learned fixes"
echo "  - Cal's sarcastic commentary"
echo ""
echo "Press Ctrl+C to stop"

# Keep the script running
wait $CAL_PID