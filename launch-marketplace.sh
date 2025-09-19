#!/bin/bash

# 🚀 LAUNCH AI AGENT MARKETPLACE
# Complete platform launch script

echo "🚀 LAUNCHING AI AGENT MARKETPLACE PLATFORM"
echo "==========================================="
echo ""

# Check if core services are running
echo "🔍 Checking core services..."

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Check essential services
CORE_SERVICES=("3000:Template Processor" "3001:AI API" "8888:Auth Service" "11434:Ollama")
MISSING_SERVICES=()

for service in "${CORE_SERVICES[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if check_port $port; then
        echo "  ✅ $name (port $port) - Running"
    else
        echo "  ❌ $name (port $port) - Not running"
        MISSING_SERVICES+=("$name")
    fi
done

# Start missing services if needed
if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
    echo ""
    echo "🚀 Starting missing services..."
    
    # Start Template Processor if needed
    if ! check_port 3000; then
        echo "  📄 Starting Template Processor..."
        cd mcp 2>/dev/null && npm start > /dev/null 2>&1 &
        sleep 2
    fi
    
    # Start AI API if needed  
    if ! check_port 3001; then
        echo "  🤖 Starting AI API Service..."
        node services/real-ai-api.js > /dev/null 2>&1 &
        sleep 2
    fi
    
    # Start temp auth if main auth not available
    if ! check_port 8888; then
        echo "  🔐 Starting Temporary Auth Service..."
        node temp-auth-service.js > /dev/null 2>&1 &
        sleep 2
    fi
    
    echo "  ⏳ Waiting for services to initialize..."
    sleep 5
fi

# Install node-fetch if not available (needed for marketplace integration)
if ! node -e "require('node-fetch')" 2>/dev/null; then
    echo "📦 Installing required dependencies..."
    npm install node-fetch 2>/dev/null || echo "  ⚠️ Could not install node-fetch automatically"
fi

# Start Marketplace Integration Service
echo ""
echo "🏪 Starting Marketplace Integration Service..."
node marketplace-integration.js &
MARKETPLACE_PID=$!

# Wait for marketplace to start
sleep 3

# Check if marketplace started successfully
if check_port 8080; then
    echo "  ✅ Marketplace Integration Service started (PID: $MARKETPLACE_PID)"
else
    echo "  ❌ Failed to start Marketplace Integration Service"
    exit 1
fi

echo ""
echo "🎉 AI AGENT MARKETPLACE PLATFORM LAUNCHED!"
echo "=========================================="
echo ""
echo "🌐 MAIN PLATFORM:"
echo "   Marketplace: http://localhost:8080"
echo "   Gaming Agents: http://localhost:8080/gaming"
echo "   Sign Up: http://localhost:8080/signup"
echo ""
echo "🔧 EXISTING SERVICES:"
echo "   Template Processor: http://localhost:3000"
echo "   AI API Service: http://localhost:3001" 
echo "   Auth Service: http://localhost:8888"
echo ""
echo "📊 PLATFORM FEATURES:"
echo "   ✅ 150+ AI Agents Available"
echo "   ✅ Gaming-focused agents for speedruns & creation"
echo "   ✅ Real-time job monitoring"
echo "   ✅ Token-based billing system"
echo "   ✅ Easy onboarding for gamers"
echo "   ✅ Document-to-website generation"
echo "   ✅ Agent employment with 1099 tracking"
echo ""
echo "🎯 READY FOR USERS:"
echo "   👥 Onboard gamers and developers"
echo "   💰 Generate revenue from agent work"
echo "   🤖 Showcase your AI operating system"
echo "   📈 Scale to enterprise customers"
echo ""
echo "🔄 TO STOP THE PLATFORM:"
echo "   Press Ctrl+C or run: pkill -f marketplace-integration"
echo ""

# Keep script running to monitor
trap 'echo ""; echo "🛑 Stopping Marketplace Platform..."; kill $MARKETPLACE_PID 2>/dev/null; exit 0' INT

echo "📊 Platform Status Monitor (Ctrl+C to stop):"
echo "============================================="

# Simple monitoring loop
while true; do
    # Check if marketplace is still running
    if ! kill -0 $MARKETPLACE_PID 2>/dev/null; then
        echo "❌ Marketplace service stopped unexpectedly"
        break
    fi
    
    # Show timestamp and basic status
    TIMESTAMP=$(date '+%H:%M:%S')
    ACTIVE_CONNECTIONS=$(lsof -i :8080 2>/dev/null | wc -l)
    echo "[$TIMESTAMP] 🟢 Platform Online | Active Connections: $ACTIVE_CONNECTIONS"
    
    sleep 30
done