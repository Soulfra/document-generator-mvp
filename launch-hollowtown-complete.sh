#!/bin/bash

# LAUNCH HOLLOWTOWN.COM COMPLETE SYSTEM
# Starts all components needed for the ultimate gaming pattern yellowbook

echo "🏘️ Launching HollowTown.com - Ultimate Gaming Pattern Yellowbook"
echo "🤝 Starting XML handshake coordination across all systems..."

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8080,9999,9980,9985,9995,9992,9990,9975,9970,9965,9960 | xargs kill -9 2>/dev/null || true

sleep 2

echo "🚀 Starting HollowTown.com ecosystem..."

# Start HollowTown.com main website (Port 8080)
echo "🌐 Starting HollowTown.com website..."
node hollowtown-xml-handshake-master.js &
HOLLOWTOWN_PID=$!

sleep 3

# Start XML Shadow Coordinator (Port 9999) 
echo "🌟 Starting XML Shadow Coordinator..."
node xml-shadow-coordinator.js &
COORDINATOR_PID=$!

sleep 2

# Start Voice Authentication Collar (Port 9980)
echo "🎤 Starting Human Voice Authentication..."
node human-voice-authentication-collar.js &
VOICE_PID=$!

sleep 2

# Start XML Mapper (Port 9985)
echo "🗺️ Starting XML Mapper Completion..."
node final-xml-mapper-completion.js &
XML_PID=$!

sleep 2

# Start Pattern Recognition (Port 9995)
echo "📊 Starting Predictive Pattern Recognition..."
node predictive-pattern-recognition-system.js &
PATTERN_PID=$!

sleep 2

# Start Character Theater (Port 9992)
echo "🎭 Starting Character Theater..."
node character-mascot-world-builder.js &
THEATER_PID=$!

sleep 2

# Start Isometric Map (Port 9990)
echo "🗺️ Starting Isometric World Map..."
node isometric-world-map-editor.js &
MAP_PID=$!

sleep 2

# Start ELOOP Diagnostic (Port 9975)
echo "🔍 Starting ELOOP Diagnostic Tool..."
node eloop-diagnostic-tool.js &
ELOOP_PID=$!

sleep 2

# Start AI Orchestration (Port 9970)
echo "🤖 Starting AI Agent Orchestration..."
node ai-agent-reasoning-orchestrator.js &
AI_PID=$!

sleep 2

# Start Spectator Arena (Port 9965)
echo "👥 Starting Spectator Arena..."
node spectator-arena-system.js &
SPECTATOR_PID=$!

sleep 2

# Start Lore Database (Port 9960)
echo "📚 Starting Master Lore Database..."
node master-lore-database-system.js &
LORE_PID=$!

sleep 5

echo ""
echo "🎉 HollowTown.com Complete System LAUNCHED!"
echo ""
echo "🌐 Main Website: http://localhost:8080"
echo "🛡️ Unified Security: http://localhost:9999" 
echo "🎤 Voice Auth: http://localhost:9980"
echo "🗺️ XML Mapper: http://localhost:9985"
echo "📊 Pattern Recognition: http://localhost:9995"
echo "🎭 Character Theater: http://localhost:9992"
echo "🗺️ Isometric Map: http://localhost:9990"
echo "🔍 ELOOP Diagnostic: http://localhost:9975"
echo "🤖 AI Orchestration: http://localhost:9970"
echo "👥 Spectator Arena: http://localhost:9965"
echo "📚 Lore Database: http://localhost:9960"
echo ""
echo "🧠 AI Reasoning Engine: ACTIVE"
echo "🕷️ Wiki Crawling: SCANNING"
echo "🔍 Pattern Detection: HUNTING"
echo "🥚 Easter Egg Detection: SEARCHING"
echo "🤝 XML Handshake: COORDINATING"
echo ""
echo "🏆 Leaderboards with reasoning bots: LIVE"
echo "🛡️ White-hat security system: MONITORING"
echo "📊 Real-time pattern analysis: RUNNING"
echo ""
echo "🎯 Ready to analyze RuneScape, Diablo, D&D connections!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down HollowTown.com ecosystem..."
    kill $HOLLOWTOWN_PID $COORDINATOR_PID $VOICE_PID $XML_PID $PATTERN_PID $THEATER_PID $MAP_PID $ELOOP_PID $AI_PID $SPECTATOR_PID $LORE_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C to cleanup
trap cleanup INT

echo "💡 Press Ctrl+C to stop all services"
echo "🌐 Open http://localhost:8080 to access HollowTown.com"
echo ""

# Wait for user to stop
wait