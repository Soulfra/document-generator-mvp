#!/bin/bash

# 🎨 SoulFra AI Integration Startup Script

echo "🚀 Starting SoulFra AI Integration System..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Start the AI integration server in background
echo "🤖 Starting AI integration server..."
cd WORKING-MINIMAL-SYSTEM
node soulfra-ai-integration.js &
AI_PID=$!

echo "🎨 AI Integration Server started (PID: $AI_PID)"
echo "🔌 WebSocket servers:"
echo "   Conversation: ws://localhost:8091"  
echo "   SoulFra Editor: ws://localhost:8092"
echo ""
echo "📁 Open SOULFRA-SPRITE-EDITOR-V2-AI-ENHANCED.html in your browser"
echo ""
echo "💡 To test conversation-to-sprite generation:"
echo "   Send a message to ws://localhost:8091 with format:"
echo '   {"type": "conversation", "data": {"text": "I want a red dragon flying over a golden castle"}}'
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping AI integration server..."
    kill $AI_PID 2>/dev/null
    echo "✅ Shutdown complete"
    exit 0
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Wait for background process
wait $AI_PID
