#!/bin/bash

# 🧪 Test script for the fixed RPG API

echo "🧪 TESTING AI AGENT RPG API (FIXED)"
echo "==================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "200" ]; then
        echo "✅ Success (HTTP $http_code)"
        if [ ! -z "$3" ]; then
            echo "   Response preview: $(echo "$body" | head -c 200)..."
        fi
    else
        echo "❌ Failed (HTTP $http_code)"
        echo "   Error: $body"
    fi
    echo ""
}

# Check if server is running
echo "🔍 Checking if RPG server is running on port 3335..."
if ! lsof -Pi :3335 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Server not running on port 3335"
    echo ""
    echo "Start it with: ./launch-ai-agent-rpg-fixed.sh"
    exit 1
fi

echo "✅ Server is running!"
echo ""

# Test endpoints
echo "📡 Testing API Endpoints:"
echo "------------------------"

test_endpoint "Health Check" "http://localhost:3335/api/health" true
test_endpoint "Schema Discovery" "http://localhost:3335/api/schema" true
test_endpoint "Agent List" "http://localhost:3335/api/agents"
test_endpoint "Economy Stats" "http://localhost:3335/api/economy" true
test_endpoint "Active Combat" "http://localhost:3335/api/combat/active"
test_endpoint "Zones" "http://localhost:3335/api/zones"
test_endpoint "Leaderboard" "http://localhost:3335/api/leaderboard"

# Test WebSocket
echo "📡 Testing WebSocket on port 8082..."
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ WebSocket server is running"
else
    echo "⚠️  WebSocket server not detected on port 8082"
fi

echo ""
echo "🎯 Test Summary:"
echo "================"
echo "If all tests passed, the fixed RPG API is working correctly!"
echo "The API now uses the correct database and handles missing columns."
echo ""
echo "Try these URLs in your browser:"
echo "  • Dashboard: http://localhost:3335"
echo "  • Schema Info: http://localhost:3335/api/schema"
echo "  • Agent List: http://localhost:3335/api/agents"