#!/bin/bash

# Start Observation Dashboard
# "Observing for now" - unified monitoring without interference

echo "🔍 Starting Unified Observation Dashboard..."
echo "================================================"
echo ""
echo "This dashboard monitors all subsystems:"
echo "  - Node Guardian Gateway (entry/exit guards)"
echo "  - XML Grant Handshake Mapper"
echo "  - Runtime Capsule System"
echo "  - phpBB Agent Control Panel"
echo "  - Community Petition System"
echo "  - Grant Scraper Network"
echo ""
echo "Philosophy: 'Observing for now, not going too crazy'"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws
fi

# Start the observation dashboard
echo "🚀 Launching dashboard..."
node unified-observation-dashboard.js &
DASHBOARD_PID=$!

echo ""
echo "✅ Dashboard running at: http://localhost:3100"
echo ""
echo "📊 Features:"
echo "  - Real-time traffic monitoring"
echo "  - Dependency flow visualization"
echo "  - Module usage tracking"
echo "  - System health indicators"
echo "  - WebSocket live updates"
echo ""
echo "Press Ctrl+C to stop observing..."

# Wait for user to stop
trap "echo ''; echo '🛑 Stopping observation...'; kill $DASHBOARD_PID 2>/dev/null; exit" INT TERM
wait $DASHBOARD_PID