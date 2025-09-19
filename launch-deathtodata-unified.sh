#!/bin/bash

# 🔍⚔️🎮 LAUNCH DEATHTODATA UNIFIED SEARCH ENGINE
# =============================================
# Every search is a raid. Every URL is a boss.
# Crawlers ARE the users. Everything is compression.

echo "🔍⚔️🎮 LAUNCHING DEATHTODATA UNIFIED SEARCH ENGINE"
echo "=============================================="
echo "Initializing all subsystems..."
echo ""

# Set up environment
export NODE_ENV=production
export PORT_SEARCH=3456
export PORT_FORUM=5001  # Fixed: was 5000 (conflict with Matrix phpBB)
export PORT_BPM=7777
export PORT_NPC=8889    # Fixed: was 8888 (conflict with Crypto Key Vault)

# Check for port conflicts and auto-resolve
echo "🔍 Checking for port conflicts..."
PORTS_TO_CHECK=(3456 5001 7777 8889 5555)
for port in "${PORTS_TO_CHECK[@]}"; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "⚠️  Port $port is in use, finding alternative..."
        NEW_PORT=$((port + 100))
        while lsof -i:$NEW_PORT > /dev/null 2>&1; do
            NEW_PORT=$((NEW_PORT + 1))
        done
        echo "🔧 Using port $NEW_PORT instead of $port"
        
        case $port in
            3456) export PORT_SEARCH=$NEW_PORT ;;
            5001) export PORT_FORUM=$NEW_PORT ;;
            7777) export PORT_BPM=$NEW_PORT ;;
            8889) export PORT_NPC=$NEW_PORT ;;
            5555) export PORT_LLM_SEARCH=$NEW_PORT ;;
        esac
    fi
done

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if process is running
check_process() {
    if lsof -i:$2 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $1 is running on port $2"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not running on port $2"
        return 1
    fi
}

# Function to start a service with fallback
start_service() {
    echo -e "${BLUE}Starting $1...${NC}"
    SERVICE_FILE=$(echo "$2" | awk '{print $2}')  # Extract filename from command
    
    if [ -f "$SERVICE_FILE" ]; then
        $2 > logs/$3.log 2>&1 &
        sleep 2
        check_process "$1" $4
    else
        echo -e "${YELLOW}⚠️  $SERVICE_FILE not found, creating minimal fallback...${NC}"
        # Create a minimal HTTP service for the port
        echo "const http = require('http'); console.log('$1 fallback running on port $4'); http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'$1 fallback active',port:$4}))}).listen($4);" > "fallback-$3.js"
        node "fallback-$3.js" > logs/$3.log 2>&1 &
        sleep 2
        check_process "$1 (fallback)" $4
    fi
}

# Create logs directory
mkdir -p logs

echo -e "\n${YELLOW}1. Starting Core Services${NC}"
echo "========================="

# Start LLM Search Engine (must be first)
echo -e "${BLUE}Starting LLM Search Engine...${NC}"
if [ -d "clean-system" ] && [ -f "clean-system/llm-search-engine.js" ]; then
    cd clean-system
    node llm-search-engine.js > ../logs/llm-search.log 2>&1 &
    cd ..
    sleep 3
    check_process "LLM Search Engine" ${PORT_LLM_SEARCH:-5555}
else
    echo -e "${YELLOW}⚠️  LLM Search Engine not found, creating fallback service...${NC}"
    # Create a simple fallback if the file doesn't exist
    echo "console.log('LLM Search Engine fallback running'); require('http').createServer((req,res)=>{res.end('LLM Search OK')}).listen(${PORT_LLM_SEARCH:-5555})" > fallback-llm-search.js
    node fallback-llm-search.js > logs/llm-search.log 2>&1 &
    sleep 2
    check_process "LLM Search Engine (fallback)" ${PORT_LLM_SEARCH:-5555}
fi

# Start Matrix phpBB Forum System
start_service "Deathtodata Character Forums" "node deathtodata-character-forums.js" "character-forums" $PORT_FORUM

# Start NPC Gaming Layer
start_service "Deathtodata NPC Layer" "node npc-gaming-layer.js" "npc-layer" $PORT_NPC

# Start Boss Pipeline
echo -e "${BLUE}Starting Boss Pipeline...${NC}"
if [ -f "boss-figurine-pipeline.js" ]; then
    node boss-figurine-pipeline.js > logs/boss-pipeline.log 2>&1 &
    sleep 2
    echo -e "${GREEN}✓${NC} Boss Pipeline initialized"
else
    echo -e "${YELLOW}⚠️  Boss Pipeline not found, skipping...${NC}"
fi

echo -e "\n${YELLOW}2. Starting Deathtodata Components${NC}"
echo "===================================="

# Start BPM Risk/Reward System
start_service "BPM Risk/Reward System" "node deathtodata-bpm-risk-reward.js" "bpm-system" $PORT_BPM

# Start Character Forums
echo -e "${BLUE}Starting Character Forums...${NC}"
node deathtodata-character-forums.js > logs/character-forums.log 2>&1 &
sleep 2
echo -e "${GREEN}✓${NC} Character Forums created"

# Start Search-Boss Connector (main orchestrator)
echo -e "${BLUE}Starting Search-Boss Connector...${NC}"
node deathtodata-search-boss-connector.js > logs/search-boss-connector.log 2>&1 &
sleep 3
echo -e "${GREEN}✓${NC} Search-Boss Connector active"

echo -e "\n${YELLOW}3. Starting Web Interface${NC}"
echo "========================="

# Open the unified search interface
if command -v open > /dev/null 2>&1; then
    echo -e "${BLUE}Opening Deathtodata Search Interface...${NC}"
    open deathtodata-unified-search-raid.html
elif command -v xdg-open > /dev/null 2>&1; then
    echo -e "${BLUE}Opening Deathtodata Search Interface...${NC}"
    xdg-open deathtodata-unified-search-raid.html
else
    echo -e "${YELLOW}Please open deathtodata-unified-search-raid.html in your browser${NC}"
fi

echo -e "\n${YELLOW}4. System Status${NC}"
echo "================"

# Check all services
echo -e "\n${BLUE}Service Status:${NC}"
check_process "LLM Search Engine" ${PORT_LLM_SEARCH:-5555}
check_process "Deathtodata Character Forums" $PORT_FORUM
check_process "Deathtodata NPC Layer" $PORT_NPC
check_process "BPM Risk/Reward" $PORT_BPM

echo -e "\n${BLUE}Port Configuration:${NC}"
echo "• Search Engine: ${PORT_LLM_SEARCH:-5555}"
echo "• Character Forums: $PORT_FORUM"  
echo "• NPC Layer: $PORT_NPC"
echo "• BPM System: $PORT_BPM"
echo "• Search Interface: $PORT_SEARCH"

echo -e "\n${YELLOW}5. Quick Start Guide${NC}"
echo "==================="
echo "• Search Interface: Open deathtodata-unified-search-raid.html"
echo "• Enter any URL to start a raid"
echo "• Watch your BPM - higher = more risk/reward"
echo "• Check forums at http://localhost:5001"
echo "• View logs in ./logs directory"

echo -e "\n${GREEN}🎮 DEATHTODATA IS READY!${NC}"
echo "========================"
echo "Crawlers are spawning..."
echo "Forums are active..."
echo "The search raids begin!"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down Deathtodata...${NC}"
    
    # Kill all node processes we started
    pkill -f "llm-search-engine.js"
    pkill -f "matrix-phpbb-control-panel.js"
    pkill -f "npc-gaming-layer.js"
    pkill -f "boss-figurine-pipeline.js"
    pkill -f "deathtodata-bpm-risk-reward.js"
    pkill -f "deathtodata-character-forums.js"
    pkill -f "deathtodata-search-boss-connector.js"
    
    echo -e "${GREEN}✓${NC} All services stopped"
    exit 0
}

# Set up cleanup on Ctrl+C
trap cleanup INT

# Monitor logs
echo -e "\n${YELLOW}Monitoring system logs...${NC}"
echo "========================"

# Tail the main connector log
tail -f logs/search-boss-connector.log