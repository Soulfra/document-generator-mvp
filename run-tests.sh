#!/bin/bash

# Sovereign Agents System - Live Testing Script
# Execute this script to start and test your sovereign agents

set -e  # Exit on any error

echo "🎭 Starting Sovereign Agents System - Live Testing"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Start your digital orchestra
echo -e "${BLUE}Step 1: Starting Docker services...${NC}"
cd /Users/matthewmauer/Desktop/Document-Generator
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker services started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start Docker services${NC}"
    exit 1
fi

# 2. Wait for initialization
echo -e "${BLUE}Step 2: Waiting for services to initialize (90 seconds)...${NC}"
sleep 90
echo -e "${GREEN}✅ Initialization wait complete${NC}"

# 3. Test your agents are alive
echo -e "${BLUE}Step 3: Testing Sovereign Agents health...${NC}"
health_response=$(curl -s http://localhost:8085/health)

if [[ $health_response == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Sovereign Agents are healthy${NC}"
    echo "Response: $health_response"
else
    echo -e "${RED}❌ Sovereign Agents health check failed${NC}"
    echo "Response: $health_response"
    echo "Checking logs..."
    docker-compose logs sovereign-agents --tail=10
fi

echo ""
echo -e "${BLUE}Step 4: Listing all sovereign agents...${NC}"
agents_response=$(curl -s http://localhost:8085/api/sovereign/agents)

if [[ $agents_response == *"success"* ]]; then
    echo -e "${GREEN}✅ Agents list retrieved successfully${NC}"
    if command -v jq &> /dev/null; then
        echo "$agents_response" | jq
    else
        echo "$agents_response"
    fi
else
    echo -e "${RED}❌ Failed to retrieve agents list${NC}"
    echo "Response: $agents_response"
fi

# 4. Process your first document
echo ""
echo -e "${BLUE}Step 5: Processing test document...${NC}"
doc_response=$(curl -s -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "# SaaS Idea: Smart Task Manager\n\nBuild an AI-powered task management system with intelligent prioritization, team collaboration, and automated scheduling.\n\nTarget: Remote teams\nPricing: $15/user/month",
    "documentType": "markdown",
    "userId": "conductor-first-test"
  }')

if [[ $doc_response == *"success"* ]]; then
    echo -e "${GREEN}✅ Document processing initiated successfully${NC}"
    if command -v jq &> /dev/null; then
        echo "$doc_response" | jq
    else
        echo "$doc_response"
    fi
else
    echo -e "${RED}❌ Document processing failed${NC}"
    echo "Response: $doc_response"
fi

echo ""
echo "🎼 Additional Testing Commands:"
echo "=============================="
echo ""
echo "# Monitor WebSocket (if wscat installed):"
echo "wscat -c ws://localhost:8085"
echo ""
echo "# Check conductor pending approvals:"
echo "curl http://localhost:8085/api/sovereign/conductor/pending"
echo ""
echo "# View detailed agent information:"
echo "curl -s http://localhost:8085/api/sovereign/agents | jq '.agents[] | {name, status, personality, autonomyLevel}'"
echo ""
echo "# Check service status:"
echo "docker-compose ps"
echo ""
echo "# View logs:"
echo "docker-compose logs sovereign-agents --tail=20"

echo ""
echo -e "${GREEN}🎭 Your Sovereign Agents System is now live!${NC}"
echo -e "${YELLOW}Your digital orchestra awaits your conductor's baton!${NC} 🎼✨"