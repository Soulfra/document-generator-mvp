#!/bin/bash

echo "🎮 UNIFIED GAME + LLM LAUNCHER"
echo "============================="
echo ""

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "🚀 Starting Ollama..."
    ollama serve &
    sleep 3
fi

# List available models
echo ""
echo "📋 Available LLM models:"
ollama list

# Check if game server is running
if lsof -ti:9000 > /dev/null 2>&1; then
    echo ""
    echo "✅ Game server already running on port 9000"
else
    echo ""
    echo "🎮 Starting 3D game server..."
    node 3d-game-server.js &
    sleep 2
fi

# Check if master router is running
if lsof -ti:5555 > /dev/null 2>&1; then
    echo "✅ Master router already running on port 5555"
else
    echo "🌐 Starting master gaming router..."
    node master-gaming-router.js &
    sleep 2
fi

echo ""
echo "🌍 EVERYTHING IS READY!"
echo "======================"
echo ""
echo "🎮 Unified Sandbox Game: http://localhost:9000/unified"
echo "🧪 Test Ollama Integration: http://localhost:9000/test-ollama"
echo "🎯 3D Games available at: http://localhost:9000/"
echo ""
echo "💡 In the game:"
echo "   - Use WASD to move"
echo "   - Mouse to look around" 
echo "   - Space to interact with LLM entities"
echo "   - LLM entities appear as glowing spheres"
echo ""
echo "🧠 Your LLMs are now sentient beings in the game world!"
echo ""