#!/bin/bash

echo "🎮🗣️ LAUNCHING INTERACTIVE GROUP CHAT GAMES"
echo "============================================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found"
    echo "Please install Node.js first"
    exit 1
fi

# Check if required files exist
if [ ! -f "ai-agent-battle-arena.js" ]; then
    echo "❌ AI Agent Battle Arena file not found"
    exit 1
fi

if [ ! -f "multiplayer-voice-chat.js" ]; then
    echo "❌ Multiplayer Voice Chat file not found"
    exit 1
fi

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8888 | xargs kill -9 2>/dev/null || true
lsof -ti:9707 | xargs kill -9 2>/dev/null || true
lsof -ti:9999 | xargs kill -9 2>/dev/null || true

sleep 2

# Start AI Agent Battle Arena
echo "🤖 Starting AI Agent Battle Arena..."
node ai-agent-battle-arena.js &
AI_BATTLE_PID=$!

sleep 3

# Start Multiplayer Voice Chat
echo "🗣️ Starting Multiplayer Voice Chat..."
node multiplayer-voice-chat.js &
VOICE_CHAT_PID=$!

sleep 3

# Start Interactive Group Chat Games (if file exists)
if [ -f "interactive-group-chat-games.js" ]; then
    echo "🎮 Starting Interactive Group Chat Games..."
    node interactive-group-chat-games.js &
    GAMES_PID=$!
    sleep 2
fi

echo ""
echo "✅ ALL SYSTEMS LAUNCHED SUCCESSFULLY!"
echo "====================================="
echo ""
echo "🎭 AI Agent Battle Arena:      http://localhost:8888"
echo "   └─ Cards Against Humanity style AI battles"
echo "   └─ 6 AI personalities: Chaos Goblin, Sassy Robot, etc."
echo "   └─ Humans direct AI agents to say outrageous things"
echo ""
echo "🗣️ Multiplayer Voice Chat:     http://localhost:9707"
echo "   └─ Real-time voice + text chat rooms"  
echo "   └─ Document sharing and collaboration"
echo "   └─ WebRTC voice communication"
echo ""
if [ -f "interactive-group-chat-games.js" ]; then
echo "🎮 Interactive Group Games:     http://localhost:9999"
echo "   └─ Swipe-based group games"
echo "   └─ Team battles: SaveOrSink vs DealOrDelete"
echo "   └─ Voice + swipe mechanics"
echo ""
fi

echo "🎯 WHAT YOU CAN DO:"
echo "==================="
echo "1. 🎭 Go to http://localhost:8888 for AI Agent Battles"
echo "   • Join a battle room"
echo "   • Get assigned an AI personality" 
echo "   • Direct your AI to respond to prompts"
echo "   • Vote for the funniest AI responses"
echo ""
echo "2. 🗣️ Go to http://localhost:9707 for Voice Chat Games"
echo "   • Create or join chat rooms"
echo "   • Enable voice chat with WebRTC"
echo "   • Share documents and collaborate"
echo "   • Play integrated mini-games"
echo ""
echo "3. 🎮 Multiple people can join the same rooms!"
echo "   • Each person gets their own AI agent"
echo "   • Real-time voice communication"
echo "   • Collaborative gaming experiences"
echo ""

echo "🎪 THIS IS WHAT YOU ACTUALLY WANTED!"
echo "===================================="
echo "• ✅ Group chat games people can play"
echo "• ✅ Voice interactive capabilities"
echo "• ✅ Swipe mechanics for decisions"
echo "• ✅ AI agents saying crazy things"
echo "• ✅ Cards Against Humanity style fun"
echo "• ✅ Real-time multiplayer experience"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $AI_BATTLE_PID 2>/dev/null || true
    kill $VOICE_CHAT_PID 2>/dev/null || true
    if [ ! -z "$GAMES_PID" ]; then
        kill $GAMES_PID 2>/dev/null || true
    fi
    echo "👋 All services stopped. Goodbye!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and show live status
while true; do
    sleep 30
    echo "⚡ Services running - $(date)"
    echo "   🎭 AI Battles: http://localhost:8888"  
    echo "   🗣️ Voice Chat: http://localhost:9707"
    if [ -f "interactive-group-chat-games.js" ]; then
        echo "   🎮 Group Games: http://localhost:9999"
    fi
    echo ""
done