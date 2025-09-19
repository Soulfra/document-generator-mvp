#!/bin/bash

# 🔥 MAX EVERYTHING - Full content generation to broadcast pipeline
# Watch content flow: Generation → JSONL → XML → Live Broadcast

echo "🔥 MAXING EVERYTHING OUT"
echo "========================"

# Start the essential trinity first
echo "⚡ Starting Core Systems..."

# 1. Dynamic XML Mapper
echo "🗺️  Starting Dynamic XML Mapper..."
node dynamic-xml-mapper.js &
sleep 2

# 2. Enhanced Game Server
echo "🎮 Starting Enhanced Game Server..."
node working-enhanced-game.js &
sleep 2

# 3. XML Broadcast Layer
echo "📡 Starting XML Broadcast Layer..."
node xml-broadcast-layer.js &
sleep 2

# 4. Content Generation Pipeline (NEW!)
echo "🔥 Starting Content Generation Pipeline..."
node content-generation-pipeline.js &
sleep 2

# Give everything time to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Test all systems
echo ""
echo "🧪 Testing All Systems..."
echo "========================"

# Test game
if curl -s http://localhost:8899 >/dev/null; then
    echo "✅ Game Server: LIVE (port 8899)"
else
    echo "❌ Game Server: DOWN"
fi

# Test XML broadcast
if curl -s http://localhost:8877/api/health >/dev/null; then
    echo "✅ XML Broadcast: LIVE (port 8877)"
else
    echo "❌ XML Broadcast: DOWN"
fi

# Test content pipeline
if curl -s http://localhost:5678 >/dev/null; then
    echo "✅ Content Pipeline: LIVE (port 5678)"
else
    echo "❌ Content Pipeline: DOWN"
fi

# Start automatic content generation
echo ""
echo "🚀 Starting Automatic Content Generation..."
curl -X POST http://localhost:5678/api/generate/start \
    -H "Content-Type: application/json" \
    -d '{"type":"mixed","rate":5,"duration":0,"targets":["jsonl","xml","websocket"]}' \
    2>/dev/null | grep -q "success" && echo "✅ Content generation started at 5 events/sec" || echo "❌ Failed to start generation"

echo ""
echo "🎯 SYSTEM MAXED OUT!"
echo "===================="
echo ""
echo "📊 Live Dashboards:"
echo "   • Content Pipeline: http://localhost:5678"
echo "   • Game Client: http://localhost:8899"
echo "   • XML Broadcast: http://localhost:8877"
echo ""
echo "📡 Real-time Streams:"
echo "   • WebSocket: ws://localhost:5679"
echo "   • JSONL Stream: http://localhost:5678/api/stream/jsonl"
echo "   • XML Feed: http://localhost:8877/feeds/world.xml"
echo ""
echo "🔥 Content Flow:"
echo "   1. Generated → http://localhost:5678 (watch live)"
echo "   2. Stored → ./content-stream.jsonl"
echo "   3. Broadcast → XML feeds at :8877"
echo "   4. Visualized → Game at :8899"
echo ""
echo "⚡ Quick Commands:"
echo "   • View JSONL: tail -f content-stream.jsonl"
echo "   • Stop generation: curl -X POST http://localhost:5678/api/generate/stop/all"
echo "   • View stats: curl http://localhost:5678/api/stats | jq"
echo ""
echo "🎮 YOU ARE NOW WATCHING CONTENT FLOW THROUGH THE ENTIRE SYSTEM!"
echo "Open http://localhost:5678 to see everything happening LIVE!"