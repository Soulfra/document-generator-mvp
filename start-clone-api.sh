#!/bin/bash

# 🚀 CLONE API QUICK START SCRIPT
# Starts the Clone Unified API and shows how to use it

echo "🧬 CLONE UNIFIED API LAUNCHER"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if required modules are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install express cors helmet express-rate-limit express-validator jsonwebtoken swagger-ui-express axios
fi

# Start the API server
echo ""
echo "🚀 Starting Clone Unified API..."
echo "================================"

node services/clone-unified-api.js &
API_PID=$!

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 3

# Check if API is running
if curl -s http://localhost:3100/api/v1/health > /dev/null; then
    echo "✅ API is running!"
    echo ""
    echo "📚 API Documentation: http://localhost:3100/api-docs"
    echo "🏥 Health Check: http://localhost:3100/api/v1/health"
    echo ""
    echo "🔑 Example Authentication:"
    echo "   Use the JWT tokens shown in the API startup logs"
    echo ""
    echo "📡 Example API Calls:"
    echo ""
    echo "1️⃣ Create a clone:"
    echo '   curl -X POST http://localhost:3100/api/v1/clone/create \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '\''{"idea":{"name":"My Awesome Idea","value":100}}'\'"'
    echo ""
    echo "2️⃣ Invoke a clone:"
    echo '   curl -X POST http://localhost:3100/api/v1/clone/CLONE_ID/invoke \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '\''{"type":"method_execution"}'\'"'
    echo ""
    echo "3️⃣ Check earnings:"
    echo '   curl http://localhost:3100/api/v1/user/earnings \
     -H "Authorization: Bearer YOUR_TOKEN"'
    echo ""
    echo "🎮 Run the demo client:"
    echo "   node demo-clone-api-client.js"
    echo ""
    echo "Press Ctrl+C to stop the API server"
    
    # Keep the script running
    wait $API_PID
else
    echo "❌ Failed to start API"
    kill $API_PID 2>/dev/null
    exit 1
fi