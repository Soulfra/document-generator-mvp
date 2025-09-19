#!/bin/bash

# START WITH AUTO-RECOVERY
# This script starts all services with automatic loot drop recovery

echo "🎮 STARTING DOCUMENT GENERATOR WITH AUTO-RECOVERY SYSTEM"
echo "========================================================"
echo ""
echo "🎯 Loot Drop System: Automatic fixes will be applied when issues occur"
echo "🎲 Drop Rates: Common 80%, Uncommon 50%, Rare 30%, Epic 10%, Legendary 5%"
echo ""

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    OPEN_CMD="open"
else
    echo "🐧 Detected Linux"
    OPEN_CMD="xdg-open"
fi

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p data/{emergency-system,critical-alerts,human-loop-queue,notification-history,emergency-backups}
mkdir -p integrations bridges
mkdir -p logs

# Function to check Docker
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check if essential services are available
check_services() {
    echo "🔍 Checking essential services..."
    
    # Check PostgreSQL
    if ! docker-compose ps postgres | grep -q "Up"; then
        echo "🚀 Starting PostgreSQL..."
        docker-compose up -d postgres
        sleep 5
    fi
    
    # Check Redis
    if ! docker-compose ps redis | grep -q "Up"; then
        echo "🚀 Starting Redis..."
        docker-compose up -d redis
        sleep 3
    fi
    
    echo "✅ Essential services ready"
}

# Create a combined log viewer script
cat > view-logs.sh << 'EOF'
#!/bin/bash
echo "📊 Viewing system logs..."
echo "========================"
echo ""
echo "Use these commands:"
echo "  tail -f logs/orchestrator.log    # Router orchestration"
echo "  tail -f logs/emergency.log       # Emergency alerts"
echo "  tail -f logs/loot-drops.log      # Applied fixes"
echo "  tail -f logs/flow.log            # Data flow"
echo ""
echo "Or view all: tail -f logs/*.log"
EOF
chmod +x view-logs.sh

# Create emergency test script
cat > test-emergency.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Emergency Loot Drop System..."

# Simulate memory exhaustion
curl -X POST http://localhost:8090/simulate-emergency \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RESOURCE_EXHAUSTION",
    "details": {
      "memory": 99,
      "cpu": 85
    }
  }'

echo ""
echo "Check logs/loot-drops.log to see applied fixes!"
EOF
chmod +x test-emergency.sh

# Main startup sequence
echo ""
echo "🚀 STARTING SERVICES WITH AUTO-RECOVERY"
echo "======================================="

# Check Docker
check_docker

# Check essential services
check_services

# Start the unified router orchestrator
echo ""
echo "🎯 Starting Unified Router Orchestrator..."
echo "(This will manage all 24+ services with proper coordination)"
echo ""

# Redirect logs
node unified-router-orchestrator.js > logs/orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
echo "✅ Orchestrator started (PID: $ORCHESTRATOR_PID)"

# Wait for orchestrator to initialize
echo "⏳ Waiting for services to start..."
sleep 10

# Check orchestrator status
echo ""
echo "📊 Checking system status..."
curl -s http://localhost:7000/status | jq '.' 2>/dev/null || echo "Status API not ready yet"

echo ""
echo "🌐 SYSTEM READY!"
echo "================"
echo ""
echo "📊 Dashboards:"
echo "   Orchestrator Status: http://localhost:7000/status"
echo "   Flow Monitor: http://localhost:8091"
echo "   Dungeon Master: http://localhost:7777"
echo "   Agent Economy: http://localhost:8080"
echo "   Emergency System: http://localhost:8090"
echo ""
echo "🛠️ Management Commands:"
echo "   ./view-logs.sh         - View system logs"
echo "   ./test-emergency.sh    - Test loot drop system"
echo "   ./stop-all.sh          - Stop all services"
echo ""
echo "🎮 Auto-Recovery Active:"
echo "   • Memory exhaustion → Memory cleaner potions"
echo "   • Port conflicts → Port rebalancers"
echo "   • Router issues → Orchestration harmony"
echo "   • Database errors → Connection refreshers"
echo "   • Auth failures → Token regenerators"
echo ""
echo "💡 TIP: When emergencies occur, check logs/loot-drops.log to see"
echo "        which fixes were automatically applied!"
echo ""

# Create stop script
cat > stop-all.sh << EOF
#!/bin/bash
echo "🛑 Stopping all services..."

# Kill orchestrator
if [ -n "$ORCHESTRATOR_PID" ]; then
    kill $ORCHESTRATOR_PID 2>/dev/null
fi

# Kill any remaining node processes
pkill -f "unified-router-orchestrator"
pkill -f "emergency-loot-drop"
pkill -f "emergency-notification"

# Stop Docker services
docker-compose down

echo "✅ All services stopped"
EOF
chmod +x stop-all.sh

# Open dashboards
if command -v $OPEN_CMD &> /dev/null; then
    echo "Opening dashboards..."
    sleep 3
    $OPEN_CMD http://localhost:8091 2>/dev/null &  # Flow Monitor
    $OPEN_CMD http://localhost:7000/status 2>/dev/null &  # Orchestrator Status
fi

# Keep script running
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Handle shutdown
trap 'echo ""; echo "Shutting down..."; ./stop-all.sh; exit 0' INT TERM

# Monitor orchestrator
tail -f logs/orchestrator.log 2>/dev/null || while true; do sleep 10; done