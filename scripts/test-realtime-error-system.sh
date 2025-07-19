#!/bin/bash

# Real-time Error System Integration Test
# Tests the complete Phase 2 real-time error detection and analysis workflow

set -e  # Exit on any error

echo "🧪 Testing Real-time Error Analysis System"
echo "=========================================="

# Configuration
TEST_PROJECT_DIR="./test-realtime-project"
AI_API_SERVER="http://localhost:3001"
MCP_SERVER="http://localhost:3333"
WEBSOCKET_PORT="3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    ((TOTAL_TESTS++))
    echo -n "  Testing $test_name... "
    
    if output=$(eval "$test_command" 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$output" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✅ PASSED${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC} (unexpected output)"
            echo "    Expected pattern: $expected_pattern"
            echo "    Got: $(echo "$output" | head -1)"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED${NC} (command failed)"
        echo "    Error: $(echo "$output" | head -1)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Setup test project
setup_test_project() {
    echo "📁 Setting up test project..."
    
    # Create test directory
    rm -rf "$TEST_PROJECT_DIR"
    mkdir -p "$TEST_PROJECT_DIR/src/components"
    mkdir -p "$TEST_PROJECT_DIR/src/utils"
    
    # Create test files with intentional errors
    cat > "$TEST_PROJECT_DIR/src/components/ErrorComponent.jsx" << 'EOF'
import React from 'react';

const ErrorComponent = ({ data }) => {
  // This will cause a TypeError: Cannot read properties of undefined
  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.items.map(item => item.name)}</p>
    </div>
  );
};

export default ErrorComponent;
EOF

    cat > "$TEST_PROJECT_DIR/src/utils/helpers.js" << 'EOF'
// This file has various intentional errors

// ReferenceError: undefinedVariable is not defined
export function processData(input) {
  return undefinedVariable.process(input);
}

// SyntaxError: missing closing brace
export function formatData(data) {
  return {
    formatted: true,
    data: data
  // Missing closing brace
EOF

    cat > "$TEST_PROJECT_DIR/src/components/GoodComponent.jsx" << 'EOF'
import React from 'react';

const GoodComponent = ({ data = {} }) => {
  const { title = 'Default Title', items = [] } = data;
  
  return (
    <div>
      <h1>{title}</h1>
      {items.length > 0 && (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item?.name || 'Unknown'}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoodComponent;
EOF

    echo "✅ Test project created at: $TEST_PROJECT_DIR"
}

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up test resources..."
    
    # Stop any active file watching sessions
    if [ ! -z "$WATCH_SESSION_ID" ]; then
        curl -s -X POST "$AI_API_SERVER/api/file-watching/stop" \
            -H 'Content-Type: application/json' \
            -d "{\"sessionId\":\"$WATCH_SESSION_ID\"}" > /dev/null
    fi
    
    # Remove test project
    rm -rf "$TEST_PROJECT_DIR"
    
    echo "✅ Cleanup completed"
}

# Set up cleanup trap
trap cleanup EXIT

echo
echo "📋 Phase 1: Environment Setup"
echo "=============================="

# Test 1: Check if services are running
run_test "AI API Server health" \
    "curl -s $AI_API_SERVER/health" \
    "healthy"

run_test "MCP Server health" \
    "curl -s $MCP_SERVER/health" \
    "healthy"

# Test 2: Setup test project
setup_test_project

echo
echo "👁️ Phase 2: File Watching Service"
echo "=================================="

# Test 3: Start file watching
WATCH_RESPONSE=$(curl -s -X POST "$AI_API_SERVER/api/file-watching/start" \
    -H 'Content-Type: application/json' \
    -d "{
        \"paths\": [\"$TEST_PROJECT_DIR\"],
        \"patterns\": [\".js\", \".jsx\", \".ts\", \".tsx\"],
        \"debounceMs\": 500,
        \"enableErrorExtraction\": true,
        \"autoAnalyzeThreshold\": 2,
        \"excludeNodeModules\": true
    }")

WATCH_SESSION_ID=$(echo "$WATCH_RESPONSE" | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)

run_test "Start file watching" \
    "echo '$WATCH_RESPONSE'" \
    "success.*true"

if [ ! -z "$WATCH_SESSION_ID" ]; then
    echo "    📊 Watch Session ID: $WATCH_SESSION_ID"
fi

# Test 4: Check watch status
run_test "Get watch status" \
    "curl -s $AI_API_SERVER/api/file-watching/status" \
    "activeSessions.*1"

# Test 5: Get specific session status
run_test "Get session status" \
    "curl -s $AI_API_SERVER/api/file-watching/sessions/$WATCH_SESSION_ID" \
    "isActive.*true"

echo
echo "🔄 Phase 3: Real-time Error Detection"
echo "====================================="

# Wait a moment for file watching to detect the existing files
sleep 2

# Test 6: Check if errors were detected in existing files
run_test "Check initial error detection" \
    "curl -s '$AI_API_SERVER/api/file-watching/analyses?sessionId=$WATCH_SESSION_ID'" \
    "analyses"

# Test 7: Create a new file with errors to trigger real-time detection
cat > "$TEST_PROJECT_DIR/src/components/NewErrorComponent.jsx" << 'EOF'
import React from 'react';

const NewErrorComponent = () => {
  // This will cause an error
  const data = null;
  
  return (
    <div>
      <h1>{data.title}</h1>
    </div>
  );
};

export default NewErrorComponent;
EOF

echo "📝 Created new file with errors, waiting for detection..."
sleep 3

# Test 8: Check if new file was detected and analyzed
run_test "Check new file detection" \
    "curl -s '$AI_API_SERVER/api/file-watching/analyses?sessionId=$WATCH_SESSION_ID&limit=1'" \
    "NewErrorComponent"

echo
echo "🤖 Phase 4: AI Analysis Integration"
echo "==================================="

# Test 9: Test MCP file watching tools
run_test "MCP start file watching" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"start_file_watching\",\"arguments\":{\"paths\":[\"$TEST_PROJECT_DIR/src\"]}}'" \
    "success.*true"

# Test 10: Test MCP watch status
run_test "MCP get watch status" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"get_watch_status\",\"arguments\":{}}'" \
    "activeSessions"

# Test 11: Test MCP get realtime analyses
run_test "MCP get realtime analyses" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"get_realtime_analyses\",\"arguments\":{\"limit\":5}}'" \
    "analyses"

echo
echo "⚙️ Phase 5: Configuration Management"
echo "===================================="

# Test 12: Update detector configuration
run_test "Update detector config" \
    "curl -s -X POST $AI_API_SERVER/api/file-watching/detector/config -H 'Content-Type: application/json' -d '{\"autoAnalyzeThreshold\":1,\"enableProactiveSuggestions\":true}'" \
    "success.*true"

# Test 13: Test MCP config update
run_test "MCP update detector config" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"update_detector_config\",\"arguments\":{\"enableAIAnalysis\":true,\"maxAnalysesPerMinute\":20}}'" \
    "success.*true"

echo
echo "📏 Phase 6: Error Detection Rules"
echo "================================="

# Test 14: Get detection rules
run_test "Get detection rules" \
    "curl -s $AI_API_SERVER/api/file-watching/rules" \
    "rules"

# Test 15: Create new detection rule
run_test "Create detection rule" \
    "curl -s -X POST $AI_API_SERVER/api/file-watching/rules -H 'Content-Type: application/json' -d '{\"name\":\"Custom Error Rule\",\"description\":\"Detects custom errors\",\"pattern\":\"CustomError.*\",\"errorType\":\"CustomError\"}'" \
    "success.*true"

echo
echo "🔄 Phase 7: File Modification Test"
echo "=================================="

# Test 16: Modify a file to trigger real-time analysis
echo "📝 Modifying file to trigger real-time analysis..."

cat >> "$TEST_PROJECT_DIR/src/components/ErrorComponent.jsx" << 'EOF'

// Adding another error
const anotherFunction = () => {
  return undefinedVar.someMethod();
};
EOF

sleep 3

# Test 17: Check if modification was detected
run_test "Check file modification detection" \
    "curl -s '$AI_API_SERVER/api/file-watching/analyses?sessionId=$WATCH_SESSION_ID&limit=3'" \
    "ErrorComponent"

echo
echo "📊 Phase 8: System Statistics"
echo "============================="

# Test 18: Get comprehensive system status
echo "📈 System Statistics:"

STATUS_RESPONSE=$(curl -s "$AI_API_SERVER/api/file-watching/status")
echo "$STATUS_RESPONSE" | grep -o '"activeSessions":[0-9]*' | echo "    Active Sessions: $(cut -d':' -f2)"

ANALYSES_RESPONSE=$(curl -s "$AI_API_SERVER/api/file-watching/analyses?limit=100")
TOTAL_ANALYSES=$(echo "$ANALYSES_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "    Total Analyses: $TOTAL_ANALYSES"

TRIGGERED_COUNT=$(echo "$ANALYSES_RESPONSE" | grep -o '"triggeredAnalysis":true' | wc -l)
echo "    Auto-triggered Analyses: $TRIGGERED_COUNT"

echo
echo "🧹 Phase 9: Cleanup"
echo "==================="

# Test 19: Stop file watching
run_test "Stop file watching" \
    "curl -s -X POST $AI_API_SERVER/api/file-watching/stop -H 'Content-Type: application/json' -d '{\"sessionId\":\"$WATCH_SESSION_ID\"}'" \
    "success.*true"

# Test 20: Verify watching stopped
run_test "Verify watching stopped" \
    "curl -s $AI_API_SERVER/api/file-watching/sessions/$WATCH_SESSION_ID" \
    "isActive.*false"

echo
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed! Real-time error analysis system is working correctly.${NC}"
    echo
    echo "🚀 Next Steps:"
    echo "1. The real-time system is ready for production use"
    echo "2. Claude Code CLI can now use MCP tools for live error analysis"
    echo "3. WebSocket integration provides real-time notifications"
    echo "4. System automatically detects and analyzes errors as you code"
    echo
    echo "💡 Usage Examples:"
    echo "• start_file_watching: Begin monitoring project files"
    echo "• get_watch_status: Check active monitoring sessions"
    echo "• get_realtime_analyses: View recent error detections"
    echo "• update_detector_config: Adjust analysis sensitivity"
    exit 0
else
    echo -e "\n⚠️ ${YELLOW}Some tests failed. Please check the real-time system integration.${NC}"
    echo
    echo "🔍 Troubleshooting:"
    echo "1. Ensure all services are running (AI API, MCP server)"
    echo "2. Check database connectivity and schema"
    echo "3. Verify file permissions for test project directory"
    echo "4. Review service logs for detailed error information"
    exit 1
fi