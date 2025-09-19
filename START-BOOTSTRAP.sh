#!/bin/bash

echo "🔄 STARTING CAL BOOTSTRAP SYSTEM 🔄"
echo "=================================="
echo ""
echo "This will start the self-bootstrapping system where Cal can restart himself!"
echo ""

# Kill any existing instance on port 9999
lsof -ti:9999 | xargs kill -9 2>/dev/null

# Start Cal Bootstrap System
echo "🚀 Starting Cal Bootstrap System on port 9999..."
node cal-bootstrap-system.js &
BOOTSTRAP_PID=$!

echo ""
echo "✅ Cal Bootstrap System is running!"
echo ""
echo "🌐 Open http://localhost:9999 in your browser"
echo ""
echo "Features:"
echo "  - Avatar-based command system with hex colors"
echo "  - External API verification with select codes"
echo "  - Domingo character for system resets"
echo "  - Full system introspection and restart"
echo "  - Unix-style system recovery"
echo ""
echo "Avatar Commands:"
echo "  🔧 System: status, restart, verify"
echo "  🧠 Brain: reason, query, memory" 
echo "  🔐 Auth: login, verify, pentest"
echo "  🌩️ Storm: weather, grants, build"
echo "  🎭 Domingo: reset, heal, toys"
echo ""
echo "Press Ctrl+C to stop"

# Keep the script running
wait $BOOTSTRAP_PID