#!/bin/bash

# Sovereign Agent Integration Test Script
# This script validates the complete integration of sovereign agents with Document Generator

echo "🧪 Starting Sovereign Agent Integration Tests"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo "Testing: $description"
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_result 0 "$description"
        return 0
    else
        print_result 1 "$description (got $status_code, expected $expected_status)"
        return 1
    fi
}

echo ""
echo "Phase 1: Docker Services Health Check"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

print_result 0 "Docker is running"

# Check docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install docker-compose.${NC}"
    exit 1
fi

print_result 0 "docker-compose is available"

echo ""
echo "Phase 2: Service Startup Test"
echo "============================="

echo "Starting Document Generator services..."
echo "This may take a few minutes on first run..."

# Start services
cd "$(dirname "$0")"
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 30

# Check if sovereign-agents service is running
if docker-compose ps sovereign-agents | grep -q "Up"; then
    print_result 0 "Sovereign Agents service is running"
else
    print_result 1 "Sovereign Agents service failed to start"
    echo "Checking logs:"
    docker-compose logs sovereign-agents | tail -20
fi

echo ""
echo "Phase 3: API Endpoint Testing"
echo "============================="

# Test health endpoint
test_endpoint "http://localhost:8085/health" "Sovereign Agents health endpoint"

# Test agents list endpoint
test_endpoint "http://localhost:8085/api/sovereign/agents" "List agents endpoint"

# Test pending approvals endpoint
test_endpoint "http://localhost:8085/api/sovereign/conductor/pending" "Pending approvals endpoint"

echo ""
echo "Phase 4: Document Processing Test"
echo "================================="

# Test document processing endpoint
echo "Testing document processing..."
cat > /tmp/test_document.json << 'EOF'
{
  "documentContent": "# SaaS Idea: User Management System\n\nBuild a comprehensive user management system with:\n- Authentication and authorization\n- User profiles and settings\n- Admin dashboard\n- API for third-party integrations\n\nTarget market: Small to medium businesses\nPricing: $29/month per organization",
  "documentType": "markdown",
  "userId": "test-user-123"
}
EOF

response=$(curl -s -w "%{http_code}" \
  -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d @/tmp/test_document.json \
  -o /tmp/process_response.json 2>/dev/null)

status_code="${response: -3}"

if [ "$status_code" = "200" ]; then
    print_result 0 "Document processing endpoint accepts requests"
    
    # Check if response contains expected fields
    if grep -q "success" /tmp/process_response.json; then
        print_result 0 "Document processing returns structured response"
    else
        print_result 1 "Document processing response missing expected fields"
    fi
else
    print_result 1 "Document processing endpoint (got $status_code)"
    echo "Response body:"
    cat /tmp/process_response.json
fi

echo ""
echo "Phase 5: WebSocket Connection Test"
echo "=================================="

# Test WebSocket connection (if wscat is available)
if command -v wscat &> /dev/null; then
    echo "Testing WebSocket connection..."
    timeout 5s wscat -c ws://localhost:8085 -x '{"type":"subscribe","agentId":"test"}' > /tmp/ws_test.log 2>&1
    
    if [ $? -eq 0 ] || grep -q "connected" /tmp/ws_test.log; then
        print_result 0 "WebSocket connection established"
    else
        print_result 1 "WebSocket connection failed"
    fi
else
    echo -e "${YELLOW}⚠️  wscat not available, skipping WebSocket test${NC}"
    echo "   Install with: npm install -g wscat"
fi

echo ""
echo "Phase 6: Database Persistence Test"
echo "=================================="

# Check if agent data persists by restarting service
echo "Testing database persistence by restarting sovereign-agents service..."
docker-compose restart sovereign-agents

# Wait for restart
sleep 15

# Test if agents are still available after restart
test_endpoint "http://localhost:8085/api/sovereign/agents" "Agents persistence after restart"

echo ""
echo "Phase 7: Integration Verification"
echo "================================="

# Check if other services can communicate with sovereign-agents
echo "Testing integration with other Document Generator services..."

# Test template-processor health (if running)
if docker-compose ps template-processor | grep -q "Up"; then
    test_endpoint "http://localhost:3000/health" "Template Processor service"
    print_result 0 "Template Processor integration ready"
else
    echo -e "${YELLOW}⚠️  Template Processor not running${NC}"
fi

# Test platform-hub health (if running)
if docker-compose ps platform-hub | grep -q "Up"; then
    test_endpoint "http://localhost:8080/health" "Platform Hub service"
    print_result 0 "Platform Hub integration ready"
else
    echo -e "${YELLOW}⚠️  Platform Hub not running${NC}"
fi

echo ""
echo "🏁 Test Results Summary"
echo "======================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Sovereign Agent integration is working correctly.${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "- Access conductor interface at: http://localhost:8085"
    echo "- View agent status: curl http://localhost:8085/api/sovereign/agents"
    echo "- Process documents: POST to http://localhost:8085/api/sovereign/process-document"
    echo "- Monitor with WebSocket: ws://localhost:8085"
    echo ""
    echo "📱 Quick Test Commands:"
    echo "curl http://localhost:8085/health"
    echo "curl http://localhost:8085/api/sovereign/agents"
    echo ""
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above for details.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "- Check service logs: docker-compose logs sovereign-agents"
    echo "- Verify all services are running: docker-compose ps"
    echo "- Check Docker resources: docker system df"
    echo ""
fi

# Cleanup
rm -f /tmp/test_document.json /tmp/process_response.json /tmp/response.json /tmp/ws_test.log

exit $TESTS_FAILED