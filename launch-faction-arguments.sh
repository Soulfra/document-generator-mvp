#!/bin/bash

# 🗣️ LAUNCH FOUR FACTIONS ARGUMENT SYSTEM
# ======================================
# Watch as factions argue about HollowTown.com

echo "🗣️ LAUNCHING FOUR FACTIONS ARGUMENT SYSTEM"
echo "=========================================="
echo ""
echo "🏛️ PREPARING THE DEBATE ARENA..."
echo ""

# Check if port 9999 is available
if lsof -Pi :9999 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 9999 is already in use. Stopping existing service..."
    kill $(lsof -t -i:9999) 2>/dev/null || true
    sleep 2
fi

echo "👥 THE FOUR FACTIONS:"
echo "   🤖 AI Agent Collective - 'Centralized intelligence'"
echo "   🗺️ XML Mapping Guild - 'Perfect data structure'"
echo "   🏗️ System Architecture Council - 'Robust infrastructure'"
echo "   ⚡ Loop Breaker Alliance - 'Prevent infinite loops'"
echo ""

echo "💬 THEY'RE ARGUING ABOUT:"
echo "   • Control of HollowTown.com YellowBook"
echo "   • Everyone's lineage and genetic capsules"
echo "   • Soulfra records and resonance"
echo "   • The Collection Rulebook enforcement"
echo ""

echo "🚀 Starting argument system..."
node four-factions-argument-system.js &
ARGUMENT_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $ARGUMENT_PID > /dev/null; then
    echo ""
    echo "✅ Four Factions Argument System started successfully!"
    echo ""
    echo "🌐 VIEW THE ARGUMENTS: http://localhost:9999"
    echo "📜 XML RULEBOOK SAVED: collection-rulebook.xml"
    echo ""
    echo "🎯 FEATURES:"
    echo "   • Live faction arguments and debates"
    echo "   • Complete lineage tracking for all entities"
    echo "   • Genetic capsule DNA sequences"
    echo "   • Soulfra resonance measurements"
    echo "   • Collection rulebook enforcement"
    echo "   • Real-time argument simulation"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening argument viewer..."
        open http://localhost:9999
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening argument viewer..."
        xdg-open http://localhost:9999
    else
        echo "📱 Manually visit: http://localhost:9999"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $ARGUMENT_PID"
    echo ""
    echo "🗣️ Let the arguments begin!"
    echo ""
    
    # Keep script running to monitor
    echo "🔄 Monitoring faction arguments... Press Ctrl+C to stop"
    trap "echo ''; echo '🛑 Stopping argument system...'; kill $ARGUMENT_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $ARGUMENT_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Argument system stopped unexpectedly"
else
    echo "❌ Failed to start Four Factions Argument System"
    exit 1
fi