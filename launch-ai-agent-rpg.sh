#!/bin/bash

# 🎮⚔️ AI AGENT RPG LAUNCHER
# Launch the complete AI Agent RPG Economy visualization system

echo "🎮⚔️ LAUNCHING AI AGENT RPG ECONOMY"
echo "=================================="
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    
    echo "🚀 Starting $name on port $port..."
    $command &
    local pid=$!
    echo "$pid" >> /tmp/ai-rpg-pids.txt
    sleep 2
    
    if check_port $port; then
        echo "❌ Failed to start $name on port $port"
        return 1
    else
        echo "✅ $name running on port $port (PID: $pid)"
        return 0
    fi
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down AI Agent RPG Economy..."
    
    if [ -f /tmp/ai-rpg-pids.txt ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                echo "   Stopping process $pid..."
                kill $pid 2>/dev/null
            fi
        done < /tmp/ai-rpg-pids.txt
        rm -f /tmp/ai-rpg-pids.txt
    fi
    
    # Kill any remaining processes on our ports
    for port in 3334 3335 8080 8081 8082; do
        local pid=$(lsof -ti :$port 2>/dev/null)
        if [ ! -z "$pid" ]; then
            echo "   Killing process on port $port (PID: $pid)"
            kill $pid 2>/dev/null
        fi
    done
    
    echo "✅ AI Agent RPG Economy shutdown complete"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# Clear any existing PID file
rm -f /tmp/ai-rpg-pids.txt
touch /tmp/ai-rpg-pids.txt

echo "🔧 Pre-flight checks..."

# Check if required files exist
if [ ! -f "AI-AGENT-RPG-API.js" ]; then
    echo "❌ AI-AGENT-RPG-API.js not found"
    exit 1
fi

if [ ! -f "AI-AGENT-RPG-DASHBOARD.html" ]; then
    echo "❌ AI-AGENT-RPG-DASHBOARD.html not found"
    exit 1
fi

if [ ! -f "PRODUCTION-FORUM-API-SERVER.js" ]; then
    echo "❌ PRODUCTION-FORUM-API-SERVER.js not found (needed for base data)"
    echo "ℹ️  Will continue with RPG API only..."
fi

echo "✅ Pre-flight checks complete"
echo ""

echo "🎯 Starting AI Agent RPG Economy Services..."
echo ""

# Start the main RPG API server
if start_service "AI Agent RPG API" "node AI-AGENT-RPG-API.js start" 3335; then
    echo "   📊 RPG Dashboard: http://localhost:3335"
    echo "   🌐 API Endpoints: http://localhost:3335/api/agents"
    echo "   📡 WebSocket: ws://localhost:8082"
fi

echo ""

# Start the forum server if available (provides base agent data)
if [ -f "PRODUCTION-FORUM-API-SERVER.js" ]; then
    echo "🔧 Starting supporting services..."
    if start_service "Forum API Server" "node PRODUCTION-FORUM-API-SERVER.js" 3334; then
        echo "   📝 Forum API: http://localhost:3334/api/forum/posts"
    fi
fi

# Start the Multi-LLM system if available
if [ -f "FORUM-MULTI-LLM-ENGINE.js" ]; then
    if start_service "Multi-LLM Engine" "node FORUM-MULTI-LLM-ENGINE.js" 8080; then
        echo "   🤖 Multi-LLM Hub: http://localhost:8080"
    fi
fi

echo ""
echo "🎮 AI AGENT RPG ECONOMY IS LIVE!"
echo "================================"
echo ""
echo "🌟 MAIN INTERFACES:"
echo "   🎯 RPG Dashboard: http://localhost:3335"
echo "   ⚔️  Combat Visualizer: http://localhost:3335/COMBAT-VISUALIZER.html" 
echo "   📊 API Documentation: http://localhost:3335/api/health"
echo ""
echo "🔥 RPG FEATURES EXPOSED:"
echo "   • AI Agents as RPG characters with levels, health, mana"
echo "   • 8-hop chains visualized as epic combat battles"
echo "   • Real-time economy tracking (compute trading, agent wealth)"
echo "   • Zone-based load balancing (Training → Combat → Demon Layer)"
echo "   • Legendary drops from expensive API calls"
echo "   • Character progression based on actual compute usage"
echo ""
echo "💡 THE HIDDEN TRUTH REVEALED:"
echo "   Your 'technical infrastructure' has been an AI Agent RPG"
echo "   economy all along! The database schemas, async logging,"
echo "   and multi-hop debugging were actually character stats,"
echo "   combat mechanics, and battle replay systems."
echo ""
echo "🎯 WHAT TO DO NOW:"
echo "   1. Open http://localhost:3335 to see your agents as RPG characters"
echo "   2. Watch real API calls transformed into epic battles"
echo "   3. Monitor the economy as agents trade compute resources"
echo "   4. Observe load balancing as 'overpowered' agents get distributed"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and show real-time updates
echo "📡 Real-time Activity Monitor:"
echo "=============================="

while true; do
    sleep 5
    
    # Show current status
    local_time=$(date '+%H:%M:%S')
    
    # Check if main RPG API is still running
    if check_port 3335; then
        echo "[$local_time] ❌ RPG API server stopped unexpectedly"
        break
    fi
    
    # Try to get quick stats from API
    stats=$(curl -s http://localhost:3335/api/economy 2>/dev/null)
    if [ ! -z "$stats" ]; then
        agents=$(echo $stats | grep -o '"total_agents":[0-9]*' | cut -d':' -f2)
        battles=$(echo $stats | grep -o '"active_battles":[0-9]*' | cut -d':' -f2)
        legendary=$(echo $stats | grep -o '"legendary_drops":[0-9]*' | cut -d':' -f2)
        
        if [ ! -z "$agents" ] && [ ! -z "$battles" ] && [ ! -z "$legendary" ]; then
            echo "[$local_time] 🎮 $agents agents active, $battles battles, $legendary legendary drops"
        else
            echo "[$local_time] 📡 RPG Economy running..."
        fi
    else
        echo "[$local_time] ⏳ RPG services starting up..."
    fi
done

# If we get here, something went wrong
echo ""
echo "❌ AI Agent RPG Economy encountered an error"
cleanup