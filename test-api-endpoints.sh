#!/bin/bash

# API Endpoint Testing Script for Sovereign Agents
# Quick validation of all REST endpoints

echo "🔗 Testing Sovereign Agent API Endpoints"
echo "========================================"

BASE_URL="http://localhost:8085"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test function
test_api() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract body (all but last line)
    body=$(echo "$response" | head -n -1)
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✅ $status_code${NC}"
        echo "   Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body" | head -c 100)..."
    else
        echo -e "${RED}❌ $status_code${NC}"
        echo "   Error: $body"
    fi
    echo ""
}

echo "1. Health and Status Endpoints"
echo "=============================="

test_api "GET" "/health" "Service health check"

test_api "GET" "/api/sovereign/agents" "List all agents"

test_api "GET" "/api/sovereign/conductor/pending" "Get pending approvals"

echo ""
echo "2. Agent Management Endpoints"
echo "============================="

# Create a new agent
agent_data='{
  "name": "TestAgent_Alpha",
  "personality": {
    "creativity": 0.8,
    "analytical": 0.7,
    "collaborative": 0.9
  },
  "capabilities": {
    "testing": true,
    "reasoning": true
  },
  "autonomyLevel": 6
}'

test_api "POST" "/api/sovereign/agents" "Create new agent" "$agent_data"

echo ""
echo "3. Document Processing Endpoints"
echo "==============================="

# Test document processing
doc_data='{
  "documentContent": "# Test Document\n\nThis is a test document for MVP generation.\n\n## Features Needed\n- User authentication\n- Data management\n- API endpoints\n\n## Target\nBuild a simple SaaS application for small businesses.",
  "documentType": "markdown",
  "userId": "test-user-123"
}'

test_api "POST" "/api/sovereign/process-document" "Process test document" "$doc_data"

echo ""
echo "4. Conductor Action Endpoints"
echo "============================="

# Note: These would normally require valid session IDs from actual reasoning sessions
echo "Note: Conductor actions require valid session IDs from active reasoning sessions"

echo ""
echo "5. Real-time Features"
echo "===================="

echo "WebSocket endpoint available at: ws://localhost:8085"
echo "Test with: wscat -c ws://localhost:8085"
echo ""

echo "🎯 Manual Testing Commands:"
echo "=========================="
echo ""
echo "# Get agent details (replace AGENT_ID with actual ID)"
echo "curl -s http://localhost:8085/api/sovereign/agents/AGENT_ID | jq"
echo ""
echo "# Send task to agent (replace AGENT_ID with actual ID)"
echo 'curl -X POST http://localhost:8085/api/sovereign/agents/AGENT_ID/tasks \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"description": "Analyze this test requirement", "context": {"type": "test"}}'"'"
echo ""
echo "# Monitor with WebSocket (if wscat installed):"
echo 'echo '"'"'{"type":"subscribe","agentId":"all"}'"'"' | wscat -c ws://localhost:8085'
echo ""

echo "📊 Dashboard URLs:"
echo "=================="
echo "Sovereign Agents API: http://localhost:8085"
echo "Template Processor:   http://localhost:3000 (if running)"
echo "Platform Hub:         http://localhost:8080 (if running)"
echo "Analytics:            http://localhost:3002 (if running)"
echo ""

echo "Done! Check the responses above for any errors."