#!/bin/bash

echo "🎮 UNIFIED GAME LAUNCHER"
echo "======================="
echo ""

# Kill any existing instance
pkill -f "unified-game-node.js" 2>/dev/null

# Check if Ollama is installed
if command -v ollama > /dev/null; then
    echo "✅ Ollama found"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama already running"
    else
        echo "🚀 Starting Ollama..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
else
    echo "⚠️  Ollama not installed (optional - game works without it)"
    echo "   Install from: https://ollama.ai"
fi

echo ""
echo "🎮 Starting Unified Game Node..."
node unified-game-node.js &

sleep 2

echo ""
echo "🌍 GAME READY!"
echo "=============="
echo ""
echo "Open in browser: http://localhost:8090"
echo ""
echo "Features:"
echo "• Works completely offline"
echo "• No tracking or ads"
echo "• Optional LLM integration"
echo "• Simple world building"
echo ""
echo "Press Ctrl+C to stop"

# Keep script running
wait