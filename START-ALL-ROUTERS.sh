#!/bin/bash
# START-ALL-ROUTERS.sh - Master orchestration script for D&D-style web design

echo "🎲 STARTING DUNGEON MASTER WEB DESIGN SYSTEM"
echo "=============================================="
echo ""

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    
    echo "🚀 Starting $name on port $port..."
    
    # Start service in background
    $command &
    local pid=$!
    
    # Give it time to start
    sleep 2
    
    # Check if it's running
    if kill -0 $pid 2>/dev/null; then
        echo "✅ $name started successfully (PID: $pid)"
        echo $pid >> .router_pids
    else
        echo "❌ Failed to start $name"
    fi
}

# Clean up old PIDs file
rm -f .router_pids

echo "🔍 Checking ports..."
check_port 6666 # MCP Connector
check_port 6667 # MCP WebSocket
check_port 7777 # Dungeon Master
check_port 7778 # DM WebSocket
check_port 7001 # HTML Master
check_port 7002 # CSS Mage
check_port 7003 # JS Wizard
check_port 7004 # Design Paladin
check_port 7005 # SEO Rogue
check_port 7006 # DB Cleric

echo ""
echo "🎯 Starting all routers..."

# Start MCP Connector
start_service "MCP Connector" "node MCP-CONNECTOR.js" 6666

# Start Dungeon Master
start_service "Dungeon Master" "node DUNGEON-MASTER-ROUTER.js" 7777

# Start Agent Economy Forum
start_service "Agent Economy Forum" "node AGENT-ECONOMY-FORUM.js" 8080

# Start Agent Blockchain
start_service "Agent Blockchain" "node AGENT-BLOCKCHAIN.js" 8082

# Start Sphinx Documentation Generator
start_service "Sphinx Documentation" "node SPHINX-DOC-GENERATOR.js" 9000

# Start Cal Riven Assistant
start_service "Cal Riven Assistant" "node CAL-RIVEN-ASSISTANT.js" 9999

# Start Cal Riven 3D Workspace
start_service "Cal Riven 3D Workspace" "node CAL-RIVEN-3D-WORKSPACE.js" 8888

# Start Comprehensive System Verification
start_service "System Verification" "node COMPREHENSIVE-SYSTEM-VERIFICATION.js" 7999

# Wait for services to stabilize
echo ""
echo "⏳ Waiting for services to stabilize..."
sleep 5

echo ""
echo "🌐 SYSTEM STATUS"
echo "=================="
echo ""
echo "🏰 Dungeon Master Dashboard: http://localhost:7777"
echo "🔌 MCP Connector: http://localhost:6666"
echo "🔐 Agent Economy Forum: http://localhost:8080"
echo "⛓️ Agent Blockchain: ws://localhost:8082"
echo "📚 Sphinx Documentation: http://localhost:9000"
echo "🤖 Cal Riven Assistant: http://localhost:9999"
echo "👁️ Cal Riven 3D Workspace: http://localhost:8888"
echo "🔍 System Verification: http://localhost:7999"
echo "🗺️ Sitemaster Dashboard: file://$(pwd)/SITEMASTER-DASHBOARD.html"
echo "🎨 Layer Rider Pi: file://$(pwd)/LAYER-RIDER-PI.html"
echo "🌍 3D API World: file://$(pwd)/3D-API-WORLD.html"
echo ""
echo "📡 WebSocket Connections:"
echo "   MCP: ws://localhost:6667"
echo "   Dungeon Master: ws://localhost:7778"
echo "   Agent Economy: ws://localhost:8081"
echo "   Blockchain: ws://localhost:8082"
echo "   Documentation: ws://localhost:9001"
echo "   Cal Riven Assistant: ws://localhost:9998"
echo "   Cal Riven 3D Workspace: ws://localhost:8889"
echo ""

echo "⚔️  AGENT ROUTERS:"
echo "   HTML Master: http://localhost:7001"
echo "   CSS Mage: http://localhost:7002"
echo "   JS Wizard: http://localhost:7003"
echo "   Design Paladin: http://localhost:7004"
echo "   SEO Rogue: http://localhost:7005"
echo "   DB Cleric: http://localhost:7006"
echo ""

echo "🎮 QUICK ACTIONS:"
echo "   Open All Dashboards: ./open-dashboards.sh"
echo "   Stop All Services: ./stop-routers.sh"
echo "   View Logs: tail -f *.log"
echo ""

# Create helper scripts
cat > stop-routers.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping all routers..."

if [ -f .router_pids ]; then
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            echo "🔪 Killing process $pid"
            kill $pid
        fi
    done < .router_pids
    rm -f .router_pids
else
    echo "No PID file found, killing by port..."
    pkill -f "MCP-CONNECTOR.js"
    pkill -f "DUNGEON-MASTER-ROUTER.js"
fi

echo "✅ All routers stopped"
EOF

cat > open-dashboards.sh << 'EOF'
#!/bin/bash
echo "🌐 Opening all dashboards..."

# Check if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:7777  # Dungeon Master
    open http://localhost:6666  # MCP Connector
    open "file://$(pwd)/LAYER-RIDER-PI.html"
    open "file://$(pwd)/3D-API-WORLD.html"
else
    echo "Manual URLs:"
    echo "http://localhost:7777"
    echo "http://localhost:6666"
    echo "file://$(pwd)/LAYER-RIDER-PI.html"
    echo "file://$(pwd)/3D-API-WORLD.html"
fi
EOF

chmod +x stop-routers.sh open-dashboards.sh

echo "🎉 SYSTEM READY!"
echo ""
echo "The Dungeon Master is now orchestrating web design like D&D!"
echo "Watch the 3D visualization to see reasoning agents at work."
echo "Use Layer Rider to see code layers being generated in real-time."
echo ""
echo "💡 TIP: The visualization shows ACTUAL reasoning from the DM,"
echo "    not just pretty graphics. Each packet represents real decisions!"
echo ""
echo "Press Ctrl+C to monitor, or run './stop-routers.sh' to stop all services."
echo ""

# Keep script running to monitor
trap 'echo ""; echo "🛑 Stopping all services..."; ./stop-routers.sh; exit 0' INT

# Monitor the services
echo "📊 Monitoring services... (Press Ctrl+C to stop)"
while true; do
    sleep 10
    if [ -f .router_pids ]; then
        running=0
        total=$(wc -l < .router_pids)
        
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                ((running++))
            fi
        done < .router_pids
        
        echo "$(date +'%H:%M:%S') - Services running: $running/$total"
    fi
done