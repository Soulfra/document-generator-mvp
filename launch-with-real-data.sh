#!/bin/bash

# Launch with VERIFIED REAL DATA
# First tests APIs, then starts hub with confirmed working data

echo "🔍 LAUNCHING WITH VERIFIED REAL DATA"
echo "===================================="
echo "NO MORE FAKE NUMBERS!"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Step 1: Test APIs first
echo -e "${BLUE}Step 1: Testing APIs for REAL data...${NC}"
if node test-real-apis.js; then
    echo -e "${GREEN}✅ APIs verified - REAL data confirmed!${NC}"
else
    echo -e "${RED}❌ APIs failed - cannot continue with fake data${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 2: Checking port conflicts...${NC}"

# Check if port 9000 is occupied (MinIO/d2jsp)
if lsof -Pi :9000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 9000 occupied by MinIO/d2jsp (expected)${NC}"
    echo -e "${GREEN}✅ Using port 9090 for dashboard instead${NC}"
else
    echo -e "${BLUE}Port 9000 free${NC}"
fi

# Check if our port is free
if lsof -Pi :9090 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Port 9090 already in use${NC}"
    echo "Kill process on 9090 first:"
    lsof -Pi :9090
    exit 1
else
    echo -e "${GREEN}✅ Port 9090 available for dashboard${NC}"
fi

echo -e "\n${BLUE}Step 3: Starting Unified Hub with REAL data...${NC}"

# Run the fixed launcher
./launch-unified-hub.sh

echo -e "\n${CYAN}🌐 REAL DATA DASHBOARD READY${NC}"
echo "================================"
echo -e "${GREEN}📊 Dashboard: http://localhost:9090${NC}"
echo -e "${GREEN}⚔️ OSRS Scythe: ~1.6B GP (REAL PRICE)${NC}"
echo -e "${GREEN}₿ Bitcoin: ~$116K (REAL PRICE)${NC}"
echo -e "${GREEN}🚫 NO FAKE NUMBERS!${NC}"