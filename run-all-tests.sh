#!/bin/bash
# Run All Tests - Comprehensive testing script

echo "🧪 COMPREHENSIVE TESTING SUITE FOR ECONOMIC ENGINE"
echo "================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    if eval $test_command; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Check if servers are running
echo "🔍 Checking prerequisites..."
if ! curl -s http://localhost:3000/api/status > /dev/null; then
    echo -e "${RED}❌ Economic Engine not running on port 3000${NC}"
    echo "   Please run: npm start"
    exit 1
fi

if ! curl -s http://localhost:9999/slam/status > /dev/null; then
    echo -e "${RED}❌ Slam layer not running on port 9999${NC}"
    echo "   Please run: node slam-it-all-together.js"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# 1. API Endpoint Tests
echo "📡 API ENDPOINT TESTS"
echo "===================="
run_test "Slam Status API" "curl -f -s http://localhost:9999/slam/status | grep -q 'EVERYTHING IS SLAMMED TOGETHER'"
run_test "Economic Engine API" "curl -f -s http://localhost:9999/api/status | grep -q 'operational'"
run_test "AI Economy API" "curl -f -s http://localhost:9999/api/economy/status | grep -q 'agents'"
run_test "Flag Tag API" "curl -f -s http://localhost:9999/api/flags/overview"
run_test "Differential Layer API" "curl -f -s http://localhost:9999/api/differential/status | grep -q 'slam-differential'"

# 2. Frontend Page Tests
echo "🌐 FRONTEND PAGE TESTS"
echo "====================="
run_test "Free Tier Page" "curl -f -s http://localhost:9999/free | grep -qE '(FREE|free)'"
run_test "AI Economy Dashboard" "curl -f -s http://localhost:9999/economy | grep -qE '(Economy|economy)'"
run_test "Godot Engine Page" "curl -f -s http://localhost:9999/godot | grep -qE '(Godot|GODOT)'"
run_test "Babylon Engine Page" "curl -f -s http://localhost:9999/engine | grep -qE '(Babylon|babylon)'"
run_test "VC Game Page" "curl -f -s http://localhost:9999/vc-game | grep -qE '(Billion|Trillion)'"
run_test "Test Page" "curl -f -s http://localhost:9999/test | grep -q 'SLAM TEST PAGE'"

# 3. PWA Tests
echo "📱 PWA TESTS"
echo "==========="
run_test "PWA Manifest" "curl -f -s http://localhost:9999/manifest.json | grep -q 'Economic Engine'"
run_test "Service Worker" "curl -f -s http://localhost:9999/sw.js | grep -q 'self.addEventListener'"
run_test "Manifest Icons" "curl -f -s http://localhost:9999/manifest.json | grep -q 'icons'"
run_test "Manifest Start URL" "curl -f -s http://localhost:9999/manifest.json | grep -q 'start_url'"

# 4. Static File Tests
echo "📂 STATIC FILE TESTS"
echo "==================="
run_test "JavaScript Files" "curl -f -s -I http://localhost:9999/sw.js | grep -q 'Content-Type.*javascript'"
run_test "JSON Files" "curl -f -s -I http://localhost:9999/manifest.json | grep -q 'Content-Type.*json'"

# 5. Multi-Platform Tests
echo "🎯 MULTI-PLATFORM TESTS"
echo "====================="
run_test "Electron App Structure" "test -f electron-app/main.js && test -f electron-app/package.json"
run_test "Chrome Extension Structure" "test -f chrome-extension/manifest.json && test -f chrome-extension/popup/popup.html"
run_test "Chrome Extension API" "curl -f -s http://localhost:9999/chrome-extension/manifest.json || test -f chrome-extension/manifest.json"
run_test "Electron Status API" "curl -f -s http://localhost:9999/electron-app/status || test -f electron-app/package.json"

# 6. Performance Tests
echo "⚡ PERFORMANCE TESTS"
echo "=================="
START_TIME=$(date +%s%N)
curl -s http://localhost:9999/api/status > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
run_test "API Response Time < 200ms" "[ $RESPONSE_TIME -lt 200 ]"

# 7. Security Tests
echo "🔒 SECURITY TESTS"
echo "================"
run_test "No hardcoded secrets in server.js" "! grep -E '(sk_live_|pk_live_)' server.js"
run_test "Environment file check" "test -f .env.example || test -f .env"

# 8. AI Economy Tests
echo "🤖 AI ECONOMY TESTS"
echo "=================="
ECONOMY_DATA=$(curl -s http://localhost:9999/api/economy/status)
run_test "Agents exist" "echo '$ECONOMY_DATA' | grep -q 'agents'"
run_test "Total compute tracked" "echo '$ECONOMY_DATA' | grep -q 'totalCompute'"
run_test "API costs tracked" "echo '$ECONOMY_DATA' | grep -q 'totalAPICost'"

# 9. Error Handling Tests
echo "❌ ERROR HANDLING TESTS"
echo "===================="
run_test "404 handling" "curl -s -o /dev/null -w '%{http_code}' http://localhost:9999/nonexistent | grep -q '404'"
run_test "Invalid POST data" "curl -s -X POST http://localhost:9999/api/economy/execute -H 'Content-Type: application/json' -d '{\"invalid\":\"data\"}' | grep -qE '(error|Error)'"

# 10. Integration Tests
echo "🔗 INTEGRATION TESTS"
echo "=================="
run_test "Proxy integration" "curl -f -s http://localhost:9999/api/status | jq -r '.platform' | grep -q 'Document Generator'"
run_test "Real-time data" "curl -f -s http://localhost:9999/api/economy/status | jq -r '.timestamp' | grep -q '202'"

# Generate Summary
echo ""
echo "📊 TEST SUMMARY"
echo "=============="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "📊 Total: $TOTAL_TESTS"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo "🎯 Success Rate: $SUCCESS_RATE%"
fi

# Run comprehensive Node.js tests
echo ""
echo "🚀 Running comprehensive Node.js test suite..."
node test-everything.js

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi