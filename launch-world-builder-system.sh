#!/bin/bash

echo "🌍 UNIFIED WORLD BUILDER SYSTEM LAUNCHER"
echo "========================================"
echo ""

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "🚀 Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Start World Builder API
if lsof -ti:7777 > /dev/null 2>&1; then
    echo "✅ World Builder API already running on port 7777"
else
    echo "🏗️ Starting World Builder API..."
    node world-builder-api.js &
    sleep 2
fi

# Start Decision Table System
if lsof -ti:8888 > /dev/null 2>&1; then
    echo "✅ Decision Table System already running on port 8888"
else
    echo "🎲 Starting Decision Table System..."
    node decision-table-system.js &
    sleep 2
fi

# Start 3D Game Server
if lsof -ti:9000 > /dev/null 2>&1; then
    echo "✅ 3D Game Server already running on port 9000"
else
    echo "🎮 Starting 3D Game Server..."
    node 3d-game-server.js &
    sleep 2
fi

# Update the 3D server with new routes
echo ""
echo "📝 Adding new world builder routes..."

# Use curl to test the services
echo ""
echo "🔍 Testing services..."
echo ""

# Test World Builder API
if curl -s http://localhost:7777/api/capabilities > /dev/null; then
    echo "✅ World Builder API: http://localhost:7777"
else
    echo "❌ World Builder API not responding"
fi

# Test Decision Tables
if curl -s http://localhost:8888/api/rules/all > /dev/null; then
    echo "✅ Decision Tables: http://localhost:8888"
else
    echo "❌ Decision Table System not responding"
fi

echo ""
echo "🌍 WORLD BUILDER SYSTEM READY!"
echo "=============================="
echo ""
echo "🎮 Access Points:"
echo "  • Original Unified Sandbox: http://localhost:9000/unified"
echo "  • World Builder Sandbox: http://localhost:9000/world-builder"
echo "  • Test Ollama: http://localhost:9000/test-ollama"
echo "  • 3D Game Launcher: http://localhost:9000/"
echo ""
echo "🏗️ API Endpoints:"
echo "  • World Builder API: http://localhost:7777"
echo "  • Decision Tables: http://localhost:8888"
echo "  • Ollama LLM: http://localhost:11434"
echo ""
echo "💡 How it works:"
echo "  1. LLMs are autonomous builders in the world"
echo "  2. They consult decision tables for world rules"
echo "  3. They can create, modify, and destroy objects"
echo "  4. Click on LLMs to give them building requests"
echo "  5. Watch as they build the world together!"
echo ""
echo "🎲 The decision tables contain:"
echo "  • Building rules and constraints"
echo "  • Object interaction matrices"
echo "  • Emergent behavior patterns"
echo "  • World laws that govern creation"
echo ""