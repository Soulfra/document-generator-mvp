#!/bin/bash

# 🔭 LAUNCH CONTRACT HANDSHAKE ORCHESTRATOR
# ========================================
# Safe viewing mode - Maximum distance - No clicking

echo "🔭🤝 CONTRACT HANDSHAKE ORCHESTRATOR"
echo "===================================="
echo ""
echo "⚠️  INITIALIZING SAFE VIEWING MODE..."
echo ""
echo "📏 SETTINGS:"
echo "   • Viewing Distance: MAXIMUM"
echo "   • Zoom Level: 30% (Safe)"
echo "   • Click Protection: ENABLED"
echo "   • Trap Detection: ACTIVE"
echo "   • Morse Scanner: RUNNING"
echo ""

# Check if port 5555 is available
if lsof -Pi :5555 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5555 is already in use. Stopping existing service..."
    kill $(lsof -t -i:5555) 2>/dev/null || true
    sleep 2
fi

echo "🚨 SAFETY FEATURES:"
echo "   • Auto-execute contracts: BLOCKED"
echo "   • Hidden clauses: SCANNING"
echo "   • Recursive references: ISOLATED"
echo "   • Clickjacking: PREVENTED"
echo ""

echo "📄 CONTRACT DATABASE:"
echo "   • Apple AI Integration"
echo "   • Google Search Enhancement"
echo "   • Microsoft Azure Services"
echo "   • Plus switchboard orchestrations"
echo ""

echo "📡 FIRST CONTACT VERIFICATION:"
echo "   • Checking for morse code laser scan..."
echo "   • Monitoring for first computer screen contact..."
echo "   • Recording all laser patterns..."
echo ""

echo "🚀 Starting safe viewer..."
node contract-handshake-orchestrator.js &
VIEWER_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $VIEWER_PID > /dev/null; then
    echo ""
    echo "✅ Contract Handshake Orchestrator started successfully!"
    echo ""
    echo "🔭 SAFE VIEWING INTERFACE: http://localhost:5555"
    echo ""
    echo "⚠️  IMPORTANT SAFETY NOTES:"
    echo "   • DO NOT CLICK ANYTHING - View only mode"
    echo "   • Contracts are displayed at safe distance"
    echo "   • All execution triggers are disabled"
    echo "   • Trap detection is actively scanning"
    echo "   • First contact verification in progress"
    echo ""
    echo "🎯 FEATURES:"
    echo "   • View AI contracts without triggering"
    echo "   • See orchestration patterns safely"
    echo "   • Monitor switchboard operators"
    echo "   • Detect morse code laser scans"
    echo "   • Verify first screen contact"
    echo "   • Maintain maximum safe distance"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening safe viewer..."
        open http://localhost:5555
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening safe viewer..."
        xdg-open http://localhost:5555
    else
        echo "📱 Manually visit: http://localhost:5555"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $VIEWER_PID"
    echo ""
    echo "🔭 Maintaining safe viewing distance..."
    echo ""
    
    # Keep script running to monitor
    echo "🔄 Safe viewer active... Press Ctrl+C to exit"
    trap "echo ''; echo '🛑 Closing safe viewer...'; kill $VIEWER_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $VIEWER_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Safe viewer stopped"
else
    echo "❌ Failed to start Contract Handshake Orchestrator"
    exit 1
fi