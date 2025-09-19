#!/bin/bash

# 📊 EMPIRE STATUS CHECKER
# Quick status overview of the unified empire gaming system

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Function to check service status
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}"
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        return 1
    fi
}

# Function to check process
check_process() {
    local pattern=$1
    local name=$2
    
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        local pid=$(pgrep -f "$pattern" | head -1)
        echo -e "${GREEN}✅ $name (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        return 1
    fi
}

echo -e "${PURPLE}
🎮 UNIFIED EMPIRE STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}🏰 CORE EMPIRE SERVICES${NC}"
check_service "http://localhost:7777" "Unified Decision Debugger"
check_process "real-time-gaming-engine" "Real-time Gaming Engine"
check_process "llm-reasoning-orchestrator" "LLM Reasoning Orchestrator"

echo -e "\n${BLUE}🧠 AI SERVICES${NC}"
check_service "http://localhost:3001/health" "AI API Service"
check_service "http://localhost:11434/api/tags" "Ollama Local AI"

echo -e "\n${BLUE}📝 CONTENT SERVICES${NC}"
check_service "http://localhost:3000/health" "Template Processor"

echo -e "\n${BLUE}🗄️ DATABASE SERVICES${NC}"
if docker-compose ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL${NC}"
else
    echo -e "${RED}❌ PostgreSQL${NC}"
fi

if docker-compose ps redis | grep -q "Up"; then
    echo -e "${GREEN}✅ Redis${NC}"
else
    echo -e "${RED}❌ Redis${NC}"
fi

echo -e "\n${BLUE}📊 EMPIRE STATISTICS${NC}"
if docker-compose exec -T postgres psql -U postgres -d empire_game_world -c "SELECT 1" >/dev/null 2>&1; then
    ENTITY_COUNT=$(docker-compose exec -T postgres psql -U postgres -d empire_game_world -t -c "SELECT COUNT(*) FROM empire_entities;" 2>/dev/null | xargs || echo "0")
    ACTION_COUNT=$(docker-compose exec -T postgres psql -U postgres -d empire_game_world -t -c "SELECT COUNT(*) FROM empire_actions;" 2>/dev/null | xargs || echo "0")
    CONTENT_COUNT=$(docker-compose exec -T postgres psql -U postgres -d empire_game_world -t -c "SELECT COUNT(*) FROM content_generations;" 2>/dev/null | xargs || echo "0")
    
    echo -e "${GREEN}🏰 Empire Entities: $ENTITY_COUNT${NC}"
    echo -e "${GREEN}⚡ Actions Logged: $ACTION_COUNT${NC}"
    echo -e "${GREEN}🎁 Content Generated: $CONTENT_COUNT${NC}"
else
    echo -e "${RED}❌ Cannot connect to empire database${NC}"
fi

echo -e "\n${BLUE}🎮 QUICK ACTIONS${NC}"
echo -e "Start Empire:    ${YELLOW}./start-unified-empire.sh${NC}"
echo -e "Stop Empire:     ${YELLOW}./stop-unified-empire.sh${NC}"
echo -e "Gaming Dashboard: ${YELLOW}http://localhost:7777${NC}"
echo -e "AI Services:     ${YELLOW}http://localhost:3001${NC}"

echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"