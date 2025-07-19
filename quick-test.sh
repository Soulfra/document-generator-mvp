#!/bin/bash

# Quick Sovereign Agent System Test
# Run this after starting docker-compose up -d

echo "🎭 Quick Sovereign Agent Test"
echo "============================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test function
quick_test() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL ($response)${NC}"
        return 1
    fi
}

echo ""
echo "1. Service Health Checks"
echo "======================="

quick_test "http://localhost:8085/health" "Sovereign Agents"
quick_test "http://localhost:3000/health" "Template Processor" 
quick_test "http://localhost:3001/health" "AI API Service"
quick_test "http://localhost:8080/health" "Platform Hub"

echo ""
echo "2. Agent System Tests"
echo "===================="

# Test agent list
echo -n "Testing agent list... "
response=$(curl -s "http://localhost:8085/api/sovereign/agents" 2>/dev/null)
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "   Found agents: $(echo "$response" | grep -o '"name":"[^"]*"' | wc -l)"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Test document processing endpoint
echo -n "Testing document processing... "
response=$(curl -s -X POST "http://localhost:8085/api/sovereign/process-document" \
    -H "Content-Type: application/json" \
    -d '{"documentContent":"# Test","documentType":"markdown"}' 2>/dev/null)
    
if echo "$response" | grep -q -E "(success|processing|accepted)"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo ""
echo "3. Quick WebSocket Test"
echo "======================"

if command -v wscat &> /dev/null; then
    echo "Testing WebSocket connection..."
    timeout 3s wscat -c ws://localhost:8085 -x '{"type":"ping"}' >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ WebSocket OK${NC}"
    else
        echo -e "${RED}❌ WebSocket FAIL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  wscat not installed, skipping WebSocket test${NC}"
    echo "   Install with: npm install -g wscat"
fi

echo ""
echo "🎯 Manual Test Commands:"
echo "========================"
echo ""
echo "# View agents:"
echo "curl -s http://localhost:8085/api/sovereign/agents | jq"
echo ""
echo "# Process document:"
echo 'curl -X POST http://localhost:8085/api/sovereign/process-document \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"documentContent":"# My SaaS Idea...","documentType":"markdown"}'"'"
echo ""
echo "# Monitor WebSocket:"
echo "wscat -c ws://localhost:8085"
echo ""

echo "🚀 System Status: Ready for testing!"
echo "📱 Access at: http://localhost:8085"