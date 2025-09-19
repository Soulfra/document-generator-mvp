#!/bin/bash

# 🧠🟢 FULL BODY INTEGRATION - Brain + Green Suit + Vector Replay
# Everything flows through the Librarian, Storyteller, and Reasoning Engine

echo "🧠🟢 FULL BODY INTEGRATION SYSTEM"
echo "================================="

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "intelligence-brain" 2>/dev/null || true
pkill -f "green-suit" 2>/dev/null || true
pkill -f "content-generation" 2>/dev/null || true

# Start the core intelligence layers
echo ""
echo "🧠 Starting Intelligence Brain Layer..."
node intelligence-brain-layer.js &
BRAIN_PID=$!
sleep 2

echo "🟢 Starting Green Suit Symlink Mapper..."
node green-suit-symlink-mapper.js &
SUIT_PID=$!
sleep 3

echo "🔥 Starting Content Generation Pipeline..."
node content-generation-pipeline.js &
PIPELINE_PID=$!
sleep 2

echo "📡 Starting XML Broadcast Layer..."
node xml-broadcast-layer.js &
BROADCAST_PID=$!
sleep 2

echo "🎮 Starting Enhanced Game Server..."
node working-enhanced-game.js &
GAME_PID=$!
sleep 2

# Give everything time to connect
echo ""
echo "⏳ Waiting for neural connections to form..."
sleep 5

# Test the integration
echo ""
echo "🧪 Testing Full Body Integration..."
echo "==================================="

# Test brain processing
echo "Testing brain processing..."
TEST_INPUT='{"type":"combat","player":"Hero_1","target":"Dragon","damage":150,"critical":true}'

BRAIN_RESPONSE=$(curl -s -X POST http://localhost:6789/api/body/brain/reasoning \
    -H "Content-Type: application/json" \
    -d "{\"data\":$TEST_INPUT,\"replay\":true}" 2>/dev/null || echo '{"error":"Brain not responding"}')

if echo "$BRAIN_RESPONSE" | grep -q "success"; then
    echo "✅ Brain reasoning: ACTIVE"
else
    echo "❌ Brain reasoning: OFFLINE"
fi

# Test content flow
echo ""
echo "Testing content generation flow..."
CONTENT_RESPONSE=$(curl -s -X POST http://localhost:5678/api/generate/start \
    -H "Content-Type: application/json" \
    -d '{"type":"mixed","rate":3,"duration":10,"targets":["jsonl","websocket"]}' 2>/dev/null || echo '{}')

if echo "$CONTENT_RESPONSE" | grep -q "success"; then
    echo "✅ Content generation: FLOWING"
else
    echo "❌ Content generation: BLOCKED"
fi

# Show the architecture
echo ""
echo "🏗️  FULL ARCHITECTURE MAP"
echo "========================"
echo ""
echo "📥 INPUT LAYER:"
echo "   • Content Generation (5678) → JSONL stream"
echo "   • Game Events (8899) → Binary protocol"
echo "   • External APIs → XML feeds"
echo ""
echo "🧠 INTELLIGENCE LAYER:"
echo "   • Librarian: Catalogs and retrieves all knowledge"
echo "   • Storyteller: Creates narratives from data"
echo "   • Reasoning: Makes decisions and connections"
echo "   • Memory: Short-term, long-term, working"
echo ""
echo "🟢 GREEN SUIT MAPPING:"
echo "   • Brain → Intelligence functions"
echo "   • Eyes → Visualization & perception"
echo "   • Ears → Listening & monitoring"
echo "   • Hands → Actions & operations"
echo "   • Heart → Core persistence & mining"
echo "   • Spine → Orchestration & signals"
echo ""
echo "📤 OUTPUT LAYER:"
echo "   • XML Broadcast (8877) → RSS/ATOM feeds"
echo "   • WebSocket (5679) → Real-time stream"
echo "   • Game Visualization (8899) → Interactive display"
echo ""
echo "🔄 VECTOR REPLAY:"
echo "   • Every action recorded as vector"
echo "   • Full replay capability"
echo "   • Time-based reconstruction"
echo ""
echo "📊 ACCESS POINTS:"
echo "   • Brain Dashboard: http://localhost:6789"
echo "   • Content Pipeline: http://localhost:5678"
echo "   • Game Client: http://localhost:8899"
echo "   • XML Feeds: http://localhost:8877"
echo ""
echo "🎯 SYSTEM STATUS:"
echo "   • Brain PID: $BRAIN_PID"
echo "   • Green Suit PID: $SUIT_PID"
echo "   • Pipeline PID: $PIPELINE_PID"
echo "   • Broadcast PID: $BROADCAST_PID"
echo "   • Game PID: $GAME_PID"
echo ""
echo "🧠🟢 FULL BODY INTEGRATION COMPLETE!"
echo ""
echo "Try these commands:"
echo "   • curl -X POST http://localhost:6789/api/body/brain/storyteller -d '{\"data\":{\"test\":true}}'"
echo "   • curl http://localhost:6789/api/body/state"
echo "   • tail -f content-stream.jsonl | jq ."
echo ""
echo "The entire system is now thinking, reasoning, and creating narratives!"