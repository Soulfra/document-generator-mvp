#!/bin/bash

# 🤝✅ LAUNCH HANDSHAKE VERIFIER SYSTEM
# =====================================
# Tests all handshakes and shows what's actually working

echo "🤝✅ HANDSHAKE VERIFIER SYSTEM"
echo "=============================="
echo ""
echo "🔍 System Health Dashboard Features:"
echo "   • Scans all your systems for online status"
echo "   • Tests handshake protocols between systems"
echo "   • Real-time monitoring with alerts"
echo "   • Smart recommendations for fixes"
echo "   • Integration verification"
echo ""

# Check if port 5555 is available
if lsof -Pi :5555 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5555 is already in use. Stopping existing service..."
    kill $(lsof -t -i:5555) 2>/dev/null || true
    sleep 2
fi

echo "🖥️ SYSTEMS TO VERIFY:"
echo "   • Centipede OS (port 2222)"
echo "   • Minimap Eyeball (port 3333)"  
echo "   • Collection Log (port 4444)"
echo "   • Infinite Layers (port 11111)"
echo "   • Matrix Game (port 8888)"
echo "   • HollowTown (port 8888)"
echo ""

echo "🤝 HANDSHAKE TESTS:"
echo "   • Lost User: 'I'm lost, what should I do?' → expects suggestions"
echo "   • Build Request: 'Build something cool' → expects build recommendations"
echo "   • Eye Focus: 'Focus on centipede zone' → expects focus confirmation"
echo "   • Segment Process: '/api/process/head' → expects processing result"
echo "   • Layer Navigation: '/api/layers' → expects layer data"
echo "   • Matrix Integration: '/api/levels' → expects game level data"
echo ""

echo "📊 VERIFICATION FEATURES:"
echo "   • System online/offline detection"
echo "   • Handshake success/failure analysis"
echo "   • Response time measurement"
echo "   • Integration gap identification"
echo "   • Real-time health monitoring"
echo ""

echo "⚡ MONITORING CAPABILITIES:"
echo "   • Scans every 10 seconds automatically"
echo "   • Alerts when systems go up/down"
echo "   • Tracks handshake success rates"
echo "   • Provides smart recommendations"
echo "   • Live dashboard updates"
echo ""

echo "🚀 Launching Handshake Verifier..."
node handshake-verifier.js &
VERIFIER_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $VERIFIER_PID > /dev/null; then
    echo ""
    echo "✅ Handshake Verifier started successfully!"
    echo ""
    echo "🤝 VERIFICATION DASHBOARD: http://localhost:5555"
    echo ""
    echo "📊 WHAT YOU'LL SEE:"
    echo "   • Real-time system status (online/offline)"
    echo "   • Handshake test results with success rates"
    echo "   • Smart recommendations for fixing issues"
    echo "   • Live monitoring alerts"
    echo "   • Integration health overview"
    echo ""
    echo "🎯 DASHBOARD SECTIONS:"
    echo "   • Health Overview: Overall system health metrics"
    echo "   • System Cards: Individual system status and ports"
    echo "   • Handshake Tests: Detailed test results and responses"
    echo "   • Recommendations: AI-generated action items"
    echo "   • Live Monitoring: Real-time alerts and updates"
    echo ""
    echo "🔧 INTERACTIVE CONTROLS:"
    echo "   • Rescan Systems - Check all systems again"
    echo "   • Retest Handshakes - Run all handshake tests"
    echo "   • Pause Monitoring - Stop real-time monitoring"
    echo "   • Clear Alerts - Remove alert notifications"
    echo ""
    echo "🚨 ALERT TYPES:"
    echo "   • System Down: When a system goes offline"
    echo "   • System Up: When a system comes back online"
    echo "   • Handshake Failure: When integration breaks"
    echo "   • Performance Issues: Slow response times"
    echo ""
    echo "💡 SMART RECOMMENDATIONS:"
    echo "   • Critical: Offline systems that need starting"
    echo "   • Warning: Poor handshake health (< 70%)"
    echo "   • Improvement: Integration opportunities"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening handshake verifier dashboard..."
        open http://localhost:5555
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening handshake verifier dashboard..."
        xdg-open http://localhost:5555
    else
        echo "📱 Manually visit: http://localhost:5555"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $VERIFIER_PID"
    echo ""
    echo "🤝 Verifying all handshakes and monitoring system health..."
    echo ""
    
    # Keep script running
    echo "🔄 Handshake verifier running... Press Ctrl+C to stop"
    trap "echo ''; echo '🤝 Stopping handshake verification...'; kill $VERIFIER_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $VERIFIER_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Handshake verifier stopped"
else
    echo "❌ Failed to launch Handshake Verifier System"
    exit 1
fi