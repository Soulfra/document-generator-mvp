#!/bin/bash
# STARTUP-MASTER.sh - Actually start everything properly

echo "🚀 MASTER STARTUP PROCESS"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill any existing processes first
echo "🔪 Killing existing processes..."
pkill -f "node.*AGENT"
pkill -f "node.*CONSENSUS"
pkill -f "node.*DUAL"
pkill -f "node.*MORYTANIA"
pkill -f "node.*EYEBALL"
sleep 2

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check if required dependencies exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install ws 2>/dev/null || {
        echo -e "${YELLOW}⚠️ npm install failed, continuing anyway...${NC}"
    }
fi

echo ""
echo "🎯 STARTING 4-AGENT CONSENSUS SYSTEM"
echo "====================================="

# Start the 4-agent consensus system
if [ -f "FOUR-AGENT-CONSENSUS-SYSTEM.js" ]; then
    echo "🤖 Starting 4-agent consensus system..."
    node FOUR-AGENT-CONSENSUS-SYSTEM.js &
    CONSENSUS_PID=$!
    echo $CONSENSUS_PID > .consensus.pid
    echo -e "${GREEN}✅ 4-Agent Consensus started (PID: $CONSENSUS_PID)${NC}"
    sleep 3
else
    echo -e "${RED}❌ FOUR-AGENT-CONSENSUS-SYSTEM.js not found${NC}"
    exit 1
fi

# Wait a bit for the consensus system to initialize
echo "⏳ Waiting for consensus system to initialize..."
sleep 5

# Check if consensus system is actually running
if curl -s --connect-timeout 5 "http://localhost:6666" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Consensus system is responding on port 6666${NC}"
else
    echo -e "${YELLOW}⚠️ Consensus system not responding yet, continuing...${NC}"
fi

echo ""
echo "🎮 OPTIONAL: START ADDITIONAL SYSTEMS"
echo "======================================"

# Ask user what else to start
echo "Do you want to start additional systems? (y/n)"
read -t 10 -r additional_systems
additional_systems=${additional_systems:-n}

if [[ $additional_systems =~ ^[Yy]$ ]]; then
    echo ""
    echo "🤖 Starting Agent Swarm Accounts System..."
    if [ -f "AGENT-SWARM-ACCOUNTS-SYSTEM.js" ]; then
        node AGENT-SWARM-ACCOUNTS-SYSTEM.js &
        SWARM_PID=$!
        echo $SWARM_PID > .swarm.pid
        echo -e "${GREEN}✅ Agent Swarm started (PID: $SWARM_PID)${NC}"
        sleep 2
    fi
    
    echo ""
    echo "💰 Starting Dual Economy P-Money System..."
    if [ -f "DUAL-ECONOMY-P-MONEY-SYSTEM.js" ]; then
        node DUAL-ECONOMY-P-MONEY-SYSTEM.js &
        ECONOMY_PID=$!
        echo $ECONOMY_PID > .economy.pid
        echo -e "${GREEN}✅ Dual Economy started (PID: $ECONOMY_PID)${NC}"
        sleep 2
    fi
    
    echo ""
    echo "🏰 Starting Morytania-D2JSP-Habbo System..."
    if [ -f "MORYTANIA-D2JSP-HABBO-HANDSHAKE.js" ]; then
        node MORYTANIA-D2JSP-HABBO-HANDSHAKE.js &
        MORYTANIA_PID=$!
        echo $MORYTANIA_PID > .morytania.pid
        echo -e "${GREEN}✅ Morytania system started (PID: $MORYTANIA_PID)${NC}"
        sleep 2
    fi
fi

echo ""
echo "📊 SYSTEM STATUS CHECK"
echo "====================="

# Check all running systems
services=(
    "4-Agent Consensus:6666"
    "Agent Swarm:5555"
    "Dual Economy:4444"
    "Morytania System:3333"
    "Eyeball Overseer:1313"
    "Search System:2020"
)

echo "Checking system availability..."
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s --connect-timeout 3 "http://localhost:$port" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ $name (port $port)${NC}"
    else
        echo -e "   ${RED}❌ $name (port $port)${NC}"
    fi
done

echo ""
echo "🌐 AVAILABLE INTERFACES"
echo "======================="
echo -e "${BLUE}🤖 4-Agent Consensus:${NC}     http://localhost:6666"
echo -e "${BLUE}👥 Agent Swarm:${NC}           http://localhost:5555"
echo -e "${BLUE}💰 Dual Economy:${NC}          http://localhost:4444"
echo -e "${BLUE}🏰 Morytania System:${NC}      http://localhost:3333"
echo -e "${BLUE}👁️ Eyeball Overseer:${NC}      http://localhost:1313"
echo -e "${BLUE}🔍 Search System:${NC}         http://localhost:2020"

echo ""
echo "📡 WEBSOCKET CONNECTIONS"
echo "========================"
echo -e "${BLUE}🤖 Consensus WebSocket:${NC}   ws://localhost:6667"
echo -e "${BLUE}👥 Swarm WebSocket:${NC}       ws://localhost:5556"
echo -e "${BLUE}💰 Economy WebSocket:${NC}     ws://localhost:4445"
echo -e "${BLUE}🏰 Morytania WebSocket:${NC}   ws://localhost:3334"

echo ""
echo "🎯 QUICK ACTIONS"
echo "==============="
echo "View 4-Agent Consensus:  curl http://localhost:6666"
echo "Stop all systems:        ./STOP-ALL.sh"
echo "View running processes:  ps aux | grep node"
echo "Kill specific system:    kill \$(cat .consensus.pid)"

echo ""
echo "📝 PROCESS IDs"
echo "=============="
[ -f .consensus.pid ] && echo "Consensus System: $(cat .consensus.pid)"
[ -f .swarm.pid ] && echo "Agent Swarm: $(cat .swarm.pid)"
[ -f .economy.pid ] && echo "Dual Economy: $(cat .economy.pid)"
[ -f .morytania.pid ] && echo "Morytania System: $(cat .morytania.pid)"

echo ""
echo -e "${GREEN}🎉 STARTUP COMPLETE!${NC}"
echo "=============================="
echo ""
echo "🎯 PRIMARY SYSTEM: 4-Agent Consensus at http://localhost:6666"
echo "💬 Watch agents FlipperAlpha, FlipperBeta, DecisionEngine, LedgerChecker work together"
echo "🔄 They flip coins → validate → decide → verify → establish rules"
echo ""
echo "Press Ctrl+C to stop monitoring, or run './STOP-ALL.sh' to stop everything"

# Create stop script
cat > STOP-ALL.sh << 'EOF'
#!/bin/bash
echo "🛑 STOPPING ALL SYSTEMS"
echo "======================="

# Kill processes by PID files
[ -f .consensus.pid ] && kill $(cat .consensus.pid) 2>/dev/null && echo "✅ Stopped Consensus System"
[ -f .swarm.pid ] && kill $(cat .swarm.pid) 2>/dev/null && echo "✅ Stopped Agent Swarm"
[ -f .economy.pid ] && kill $(cat .economy.pid) 2>/dev/null && echo "✅ Stopped Dual Economy"
[ -f .morytania.pid ] && kill $(cat .morytania.pid) 2>/dev/null && echo "✅ Stopped Morytania System"

# Kill any remaining node processes
pkill -f "node.*AGENT" 2>/dev/null
pkill -f "node.*CONSENSUS" 2>/dev/null
pkill -f "node.*DUAL" 2>/dev/null
pkill -f "node.*MORYTANIA" 2>/dev/null

# Clean up PID files
rm -f .consensus.pid .swarm.pid .economy.pid .morytania.pid

echo ""
echo "🎯 All systems stopped!"
EOF

chmod +x STOP-ALL.sh

# Monitor the consensus system
echo ""
echo "📊 MONITORING 4-AGENT CONSENSUS SYSTEM"
echo "======================================"
echo "Watching consensus rounds and agent communication..."
echo "(Press Ctrl+C to stop monitoring)"

# Monitor function
monitor_consensus() {
    while true; do
        if [ -f .consensus.pid ] && kill -0 $(cat .consensus.pid) 2>/dev/null; then
            echo "$(date +'%H:%M:%S') - Consensus system running (PID: $(cat .consensus.pid))"
            
            # Try to get status from the API
            if curl -s --connect-timeout 2 "http://localhost:6666/workflow" > /dev/null 2>&1; then
                echo "   📡 API responding normally"
            fi
        else
            echo -e "${RED}$(date +'%H:%M:%S') - Consensus system not responding${NC}"
        fi
        
        sleep 10
    done
}

# Set up signal handling
trap 'echo ""; echo "🛑 Monitoring stopped. Systems still running."; echo "Run ./STOP-ALL.sh to stop all systems."; exit 0' INT

# Start monitoring
monitor_consensus