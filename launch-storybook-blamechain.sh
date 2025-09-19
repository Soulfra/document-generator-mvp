#!/bin/bash

# 📚⛓️ LAUNCH STORYBOOK BLAMECHAIN SYSTEM
# =======================================
# Blamechain IS the storybook - Web compliant bot swarm spawning

echo "📚⛓️ STORYBOOK BLAMECHAIN SYSTEM"
echo "================================"
echo ""
echo "🧠 Revolutionary Concept:"
echo "   • Blamechain IS the storybook"
echo "   • Every action becomes narrative history"
echo "   • Accountability through storytelling"
echo "   • Bot swarms spawn 4 at a time per player"
echo "   • 100% web compliant observation only"
echo ""

# Check if port 7777 is available
if lsof -Pi :7777 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 7777 is already in use. Stopping existing service..."
    kill $(lsof -t -i:7777) 2>/dev/null || true
    sleep 2
fi

echo "📚 ARCHIVE INTEGRATION:"
echo "   • Archive.is - Eternal story preservation"
echo "   • Archive.org - Wayback machine integration"  
echo "   • Wikipedia - Read-only knowledge access"
echo "   • ICANN - Full compliance monitoring"
echo "   • Robots.txt - Respectful observation"
echo ""

echo "🤖 BOT SWARM SYSTEM:"
echo "   • 4 bots spawn per player automatically"
echo "   • Stealth Observers (95% antidetection)"
echo "   • World Architects (80% antidetection)"
echo "   • Story Chroniclers (70% antidetection)"
echo "   • Archive Crawlers (85% antidetection)"
echo "   • Compliance Checkers (95% antidetection)"
echo ""

echo "👁️ MINIMAP BRAIN INTEGRATION:"
echo "   • Eyeball swarms manage bot deployment"
echo "   • World building based on player spawns"
echo "   • Adaptive environment generation"
echo "   • Real-time world testing and simulation"
echo ""

echo "🌐 WEB COMPLIANCE FRAMEWORK:"
echo "   • Observation only - no data modification"
echo "   • Respect all robots.txt files"
echo "   • Honor rate limits and privacy policies"
echo "   • ICANN compliant operations"
echo "   • Archive.is style preservation"
echo "   • Wiki-style read-only access"
echo ""

echo "⛓️ STORYBOOK BLAMECHAIN FEATURES:"
echo "   • Every action recorded as narrative"
echo "   • Accountability through storytelling"
echo "   • Immutable story preservation"
echo "   • Cross-referenced archive links"
echo "   • Compliance verification in each block"
echo ""

echo "🎮 PLAYER SPAWNING SYSTEM:"
echo "   • Each player gets their own world"
echo "   • 4-bot swarm automatically assigned"
echo "   • World built according to player preferences"
echo "   • Story threads created for each world"
echo "   • All actions recorded in storybook"
echo ""

echo "🚀 Launching Storybook Blamechain System..."
node storybook-blamechain-system.js &
STORYBOOK_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $STORYBOOK_PID > /dev/null; then
    echo ""
    echo "✅ Storybook Blamechain System started successfully!"
    echo ""
    echo "📚 STORYBOOK INTERFACE: http://localhost:7777"
    echo ""
    echo "🎯 WHAT YOU'LL SEE:"
    echo "   • Living Chronicle: Real-time story blocks being mined"
    echo "   • Player Spawning: Button to create new players with worlds"
    echo "   • Active Worlds: All currently running player worlds"
    echo "   • Bot Swarms: 4-bot teams with antidetection levels"
    echo "   • Compliance Status: Full web compliance verification"
    echo "   • Archive Status: External preservation tracking"
    echo ""
    echo "📖 STORY BLOCK STRUCTURE:"
    echo "   • Genesis Block: 'The Beginning of All Stories'"
    echo "   • Action Chronicles: Real actions woven into narrative"
    echo "   • World Creation Stories: New worlds becoming reality"
    echo "   • Bot Deployment Tales: Digital helpers materializing"
    echo "   • Archive Preservation: Knowledge saved for eternity"
    echo ""
    echo "🤖 BOT SWARM ACTIVITIES:"
    echo "   • Stealth Observers: Archive verification, compliance monitoring"
    echo "   • World Architects: Terrain generation, physics calibration"
    echo "   • Story Chroniclers: Narrative weaving, character development"
    echo "   • All recorded as story actions in the blamechain"
    echo ""
    echo "🌍 WORLD BUILDING PROCESS:"
    echo "   1. Player spawns → World ID generated"
    echo "   2. 4-bot swarm assigned → Antidetection profiles created"
    echo "   3. Environment generated → Based on player preferences"
    echo "   4. Story thread started → All actions recorded"
    echo "   5. World evolves → According to bot activities"
    echo ""
    echo "⚡ REAL-TIME FEATURES:"
    echo "   • Live story block mining"
    echo "   • Bot swarm status monitoring"
    echo "   • Archive compliance tracking"
    echo "   • Player world simulation"
    echo "   • Antidetection level display"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening storybook blamechain interface..."
        open http://localhost:7777
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening storybook blamechain interface..."
        xdg-open http://localhost:7777
    else
        echo "📱 Manually visit: http://localhost:7777"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $STORYBOOK_PID"
    echo ""
    echo "📚 The living chronicle begins its eternal recording..."
    echo ""
    
    # Keep script running
    echo "🔄 Storybook blamechain running... Press Ctrl+C to stop"
    trap "echo ''; echo '📚 Closing the storybook...'; kill $STORYBOOK_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $STORYBOOK_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Storybook blamechain system stopped"
else
    echo "❌ Failed to launch Storybook Blamechain System"
    exit 1
fi