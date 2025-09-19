#!/bin/bash

echo "🌀🎮 Starting TRON PROTOCOL - Complete Self-Building Game Ecosystem"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express sqlite3 ws axios cheerio
fi

# Create directory structure
mkdir -p data
mkdir -p public
mkdir -p logs
mkdir -p conversations
mkdir -p chatlogs

echo ""
echo "🌀 TRON PROTOCOL STARTUP SEQUENCE"
echo "=================================="
echo ""

# Start all systems in background with tmux if available
if command -v tmux &> /dev/null; then
    echo "🚀 Starting systems in tmux sessions..."
    
    # Kill existing sessions if they exist
    tmux kill-session -t tron-universal 2>/dev/null || true
    tmux kill-session -t tron-games 2>/dev/null || true
    tmux kill-session -t tron-ai 2>/dev/null || true
    tmux kill-session -t tron-protocol 2>/dev/null || true
    
    # Start Universal Query Intelligence
    if [ -f "universal-query-intelligence.js" ]; then
        echo "🧠 Starting Universal Query Intelligence on port 3350..."
        tmux new-session -d -s tron-universal "node universal-query-intelligence.js"
        sleep 2
    fi
    
    # Start Self-Building Game Engine
    if [ -f "self-building-game-engine.js" ]; then
        echo "🎮 Starting Self-Building Game Engine on port 3400..."
        tmux new-session -d -s tron-games "node self-building-game-engine.js"
        sleep 2
    fi
    
    # Start AI Reasoning Game Backend
    if [ -f "ai-reasoning-game-backend.py" ]; then
        echo "🤖 Starting AI Reasoning Backend on port 6789..."
        if command -v python3 &> /dev/null; then
            tmux new-session -d -s tron-ai "python3 ai-reasoning-game-backend.py"
            sleep 2
        fi
    fi
    
    # Start Tron Protocol Integration
    echo "🌀 Starting Tron Protocol Integration on port 3401..."
    tmux new-session -d -s tron-protocol "node tron-protocol-integration.js"
    sleep 3
    
    echo ""
    echo "✅ TRON PROTOCOL ONLINE"
    echo "======================="
    echo ""
    echo "🌀 Master Hub:           http://localhost:3401"
    echo "🧠 Universal Query:      http://localhost:3350"
    echo "🎮 Game Engine:          http://localhost:3400"
    echo "🤖 AI Reasoning:         http://localhost:6789"
    echo ""
    echo "🎣 FISHING HOOKS (Top Level Access):"
    echo "  • runescape_query      - Look up RS players → generate games"
    echo "  • conversation_analyze - Parse chatlogs → extract game concepts"
    echo "  • database_sonar       - Scan all DBs → build data-driven games"
    echo "  • auto_game_build      - Instant game from any input"
    echo "  • system_integration   - Connect all existing systems"
    echo "  • ai_conversation      - Direct AI dialogue → game building"
    echo ""
    echo "🔐 AUTHENTICATION:"
    echo "  • 2FA Token (demo: 123456)"
    echo "  • Biometric (demo: demo_print)"
    echo "  • Voice Auth (demo: tron2025)"
    echo ""
    echo "📡 SONAR SYSTEM:"
    echo "  • Auto-discovers all databases"
    echo "  • Natural language queries"
    echo "  • Cross-system integration"
    echo ""
    echo "🎮 GAME ENGINE FEATURES:"
    echo "  • Analyzes your conversation logs"
    echo "  • Extracts game concepts automatically"
    echo "  • Builds playable games in real-time"
    echo "  • Like Tron - games build themselves!"
    echo ""
    echo "📱 TMUX SESSIONS:"
    echo "  tmux attach -t tron-universal   # Universal Query"
    echo "  tmux attach -t tron-games       # Game Engine"
    echo "  tmux attach -t tron-ai          # AI Reasoning"
    echo "  tmux attach -t tron-protocol    # Tron Protocol"
    echo ""
    echo "🛑 To stop all systems:"
    echo "  tmux kill-server"
    echo ""
    echo "🌀 TRON PROTOCOL IS LIVE - Games are building themselves!"
    
else
    # Fallback to direct execution
    echo "⚠️  tmux not available, starting in foreground..."
    echo "🌀 Starting Tron Protocol Integration..."
    node tron-protocol-integration.js
fi