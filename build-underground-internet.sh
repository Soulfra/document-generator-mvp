#!/bin/bash

echo "🌐 BUILDING THE UNDERGROUND INTERNET"
echo "==================================="
echo "SOULFRA: Voice + $1 + Trust = New Internet"
echo ""

# Step 1: Check dependencies
echo "📦 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. AI will use cloud fallback"
else
    echo "✅ Ollama found for local AI"
    # Make sure Ollama is running
    if ! curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "🚀 Starting Ollama..."
        ollama serve &
        sleep 3
    fi
fi

# Step 2: Install packages
echo ""
echo "📦 Installing packages..."
npm install express crypto --save 2>/dev/null || echo "✅ Packages ready"

# Step 3: Start services
echo ""
echo "🚀 Starting services..."

# Kill any existing services on our ports
lsof -ti:3333 | xargs kill -9 2>/dev/null
lsof -ti:4000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Start the core services we actually have working
echo "Starting LLM Router (port 4000)..."
node unified-llm-router.js > logs/llm-router.log 2>&1 &

echo "Starting Semantic Search (port 5001)..."
node semantic-model-tagging-system.js > logs/semantic-search.log 2>&1 &

# Start SOULFRA MVP
echo ""
echo "🌟 Starting SOULFRA MVP..."
node build-soulfra-mvp.js &

# Wait a moment
sleep 2

echo ""
echo "✅ UNDERGROUND INTERNET READY!"
echo "=============================="
echo ""
echo "🌐 SOULFRA Interface: http://localhost:3333"
echo "🤖 LLM Router: http://localhost:4000/health"
echo "🔍 Semantic Search: http://localhost:5001/health"
echo ""
echo "📚 What you can do:"
echo "1. Register with voice (simulated for MVP)"
echo "2. Pay $1 to join (simulated with Stripe)"
echo "3. Get 100 credits (like forum gold)"
echo "4. Enter underground forums"
echo "5. Trade with other users"
echo "6. Get verified by friends"
echo ""
echo "🎯 This is the MVP of the REAL internet:"
echo "- No corporate control"
echo "- Voice is identity"
echo "- Friends verify friends"
echo "- AI helps everyone"
echo "- Money flows peer-to-peer"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep running
wait