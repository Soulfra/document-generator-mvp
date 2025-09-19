#!/bin/bash

# STARTUP WITH DEPENDENCIES
# Starts services in correct dependency order with health checks

set -e

echo "🚀 STARTUP WITH DEPENDENCIES"
echo "============================"
echo "Starting services in correct dependency order..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to wait for service to be ready
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    echo -n "Waiting for $name to be ready"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo -e " ${GREEN}✅ Ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}❌ Timeout!${NC}"
    return 1
}

# Function to start service in background
start_service_bg() {
    local name=$1
    local command=$2
    local log_file=$3
    
    echo -e "${BLUE}Starting $name...${NC}"
    
    # Start service in background
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    echo "  PID: $pid, Log: $log_file"
    
    # Give it a moment to start
    sleep 3
}

# Phase 1: Check database health
echo "📋 Phase 1: Database Health Check"
echo "--------------------------------"

if node database-health-check.js; then
    echo -e "${GREEN}✅ All databases are healthy${NC}"
else
    echo -e "${RED}❌ Database health check failed${NC}"
    echo "Please ensure PostgreSQL and Redis are running:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    exit 1
fi

echo ""

# Phase 2: Start Core Infrastructure Services
echo "🏗️  Phase 2: Core Infrastructure"
echo "------------------------------"

# Master System Controller (central orchestration)
if ! curl -s -f http://localhost:9999/api/status >/dev/null 2>&1; then
    start_service_bg "Master System Controller" "node master-system-controller.js" "master-controller.log"
    wait_for_service "Master System Controller" "http://localhost:9999/api/status" 15
fi

echo ""

# Phase 3: Start AI Services
echo "🤖 Phase 3: AI Services"
echo "----------------------"

# AI Debug Dashboard
if ! curl -s -f http://localhost:9500/api/status >/dev/null 2>&1; then
    start_service_bg "AI Debug Dashboard" "node unified-ai-debugging-dashboard.js" "ai-debug-dashboard.log"
    wait_for_service "AI Debug Dashboard" "http://localhost:9500/api/status" 15
fi

echo ""

# Phase 4: Start Gaming Services
echo "🎮 Phase 4: Gaming Services"
echo "-------------------------"

# Gaming AI Bridge
if ! curl -s -f http://localhost:9901/health >/dev/null 2>&1; then
    start_service_bg "Gaming AI Bridge" "node gaming-ai-bridge.js" "gaming-ai-bridge.log"
    wait_for_service "Gaming AI Bridge" "http://localhost:9901/health" 15
fi

# Debug Game Visualizer
if ! curl -s -f http://localhost:8500/ >/dev/null 2>&1; then
    start_service_bg "Debug Game Visualizer" "node debug-game-visualizer.js" "debug-game.log"
    wait_for_service "Debug Game Visualizer" "http://localhost:8500/" 15
fi

# Carrot RL System
if ! curl -s -f http://localhost:9900/ >/dev/null 2>&1; then
    start_service_bg "Carrot RL System" "node carrot-reinforcement-learning-system.js" "carrot-rl.log"
    # Note: Carrot RL might not have a proper health endpoint, so give it time
    sleep 5
fi

echo ""

# Phase 5: Start Docker Services (if needed)
echo "🐳 Phase 5: Docker Services"
echo "-------------------------"

# Check if we need to start Docker services
if ! docker ps | grep -q document-generator; then
    echo "Starting Docker services..."
    
    # Use native Ollama configuration
    docker-compose -f docker-compose.yml -f docker-compose.native-ollama.yml up -d
    
    echo "Waiting for Docker services to be ready..."
    sleep 15
    
    # Wait for key Docker services
    wait_for_service "Template Processor" "http://localhost:3000/health" 30
    wait_for_service "Platform Hub" "http://localhost:8080/health" 30
else
    echo -e "${GREEN}✅ Docker services already running${NC}"
fi

echo ""

# Phase 6: Final System Check
echo "🏥 Phase 6: Final System Check"
echo "-----------------------------"

echo "Running final health check via Master System Controller..."

# Give Master Controller time to discover all services
sleep 5

# Fetch system status
if curl -s -f http://localhost:9999/api/status > system-status.json; then
    # Parse and display status
    node -e "
        const status = JSON.parse(require('fs').readFileSync('system-status.json', 'utf8'));
        console.log(\`📊 System Status Summary:\`);
        console.log(\`   Total Services: \${status.summary.total}\`);
        console.log(\`   Healthy: \${status.summary.healthy}\`);
        console.log(\`   Unhealthy: \${status.summary.unhealthy}\`);
        console.log(\`   Offline: \${status.summary.offline}\`);
        console.log(\`   Health: \${status.summary.healthPercentage}%\`);
        
        if (status.summary.healthPercentage >= 70) {
            console.log('\n✅ System is ready for use!');
        } else {
            console.log('\n⚠️  Some services need attention.');
        }
    "
    rm -f system-status.json
else
    echo -e "${YELLOW}⚠️  Could not get system status from Master Controller${NC}"
fi

echo ""

# Phase 7: Display Access Information
echo "🌐 ACCESS INFORMATION"
echo "===================="
echo ""
echo "🎮 Master System Controller: http://localhost:9999"
echo "   Your central dashboard for everything"
echo ""
echo "🧠 AI Debug Dashboard: http://localhost:9500"
echo "   AI services and debugging"
echo ""
echo "🎲 Debug Game Visualizer: http://localhost:8500"
echo "   Play the bug-fixing game (trains AI!)"
echo ""
echo "🔗 Gaming AI Bridge: http://localhost:9901/training-status"
echo "   See how games are training your AI"
echo ""
echo "📊 Platform Hub: http://localhost:8080"
echo "   Main application interface"
echo ""
echo "📄 Template Processor: http://localhost:3000"
echo "   Document generation service"
echo ""

echo "🎯 NEXT STEPS:"
echo "   1. Open Master System Controller: http://localhost:9999"
echo "   2. Check system health and fix any issues"
echo "   3. Start using your Document Generator!"
echo ""

echo "🛑 To stop everything:"
echo "   Run: ./smart-shutdown.sh"
echo ""

echo -e "${GREEN}🚀 Startup complete!${NC}"