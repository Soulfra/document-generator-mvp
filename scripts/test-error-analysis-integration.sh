#!/bin/bash

# Test Error Analysis Integration
# This script tests the complete error analysis workflow:
# 1. Export errors from VibeCoding Vault
# 2. Analyze through MCP server
# 3. Test AI API endpoints
# 4. Verify database integration

set -e  # Exit on any error

echo "🧪 Testing Error Analysis Integration"
echo "=================================="

# Configuration
VAULT_PATH="./DOC-FRAMEWORK/soulfra-mvp/vibecoding-vault"
MCP_SERVER="http://localhost:3333"
AI_API_SERVER="http://localhost:3001"
TEST_OUTPUT_DIR="./test-results"

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
            echo "    Got: $output"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED${NC} (command failed)"
        echo "    Error: $output"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Create test output directory
mkdir -p "$TEST_OUTPUT_DIR"

echo
echo "📋 Phase 1: Environment Setup"
echo "=============================="

# Test 1: Check if services are running
run_test "MCP Server health" \
    "curl -s $MCP_SERVER/health" \
    "healthy"

run_test "AI API Server health" \
    "curl -s $AI_API_SERVER/health" \
    "healthy"

# Test 2: Check if VibeCoding Vault exists
if [ -d "$VAULT_PATH" ]; then
    echo "  ✅ VibeCoding Vault found at $VAULT_PATH"
else
    echo "  ⚠️ VibeCoding Vault not found, using mock data"
    VAULT_PATH="./test-mock-vault"
    mkdir -p "$VAULT_PATH/src/components"
    echo "// Mock error: Cannot read properties of undefined" > "$VAULT_PATH/src/components/TestComponent.jsx"
fi

echo
echo "📤 Phase 2: Error Export"
echo "========================"

# Test 3: Export errors from VibeCoding Vault
if [ -f "./scripts/export-vibecoding-errors.sh" ]; then
    run_test "Export VibeCoding errors" \
        "./scripts/export-vibecoding-errors.sh '$VAULT_PATH' '$TEST_OUTPUT_DIR' true" \
        "export-vibecoding-errors"
else
    echo "  ⚠️ Export script not found, creating mock export"
    cat > "$TEST_OUTPUT_DIR/mock-error-export.json" << 'EOF'
{
  "exportInfo": {
    "timestamp": "2025-01-01T12:00:00.000Z",
    "source": "Mock Export",
    "vaultPath": "./test-mock-vault"
  },
  "errors": [
    {
      "id": "1",
      "type": "TypeError",
      "message": "Cannot read properties of undefined (reading 'map')",
      "file": "./src/components/TestComponent.jsx",
      "line": 42,
      "severity": "error"
    }
  ],
  "summary": {
    "totalErrors": 1
  }
}
EOF
fi

# Find the exported error file
ERROR_EXPORT_FILE=$(find "$TEST_OUTPUT_DIR" -name "*error*.json" | head -1)
if [ -z "$ERROR_EXPORT_FILE" ]; then
    echo "  ❌ No error export file found"
    exit 1
else
    echo "  ✅ Error export file: $ERROR_EXPORT_FILE"
fi

echo
echo "🔧 Phase 3: MCP Server Integration"
echo "=================================="

# Test 4: List MCP tools
run_test "List MCP tools" \
    "curl -s -X POST $MCP_SERVER/list_tools" \
    "analyze_error_export"

# Test 5: Test MCP error analysis tool
run_test "MCP error analysis tool" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"analyze_error_export\",\"arguments\":{\"errorFilePath\":\"$ERROR_EXPORT_FILE\"}}'" \
    "success"

# Test 6: Test MCP export tool
run_test "MCP export tool" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"export_vibecoding_errors\",\"arguments\":{\"vaultPath\":\"$VAULT_PATH\"}}'" \
    "success"

echo
echo "🤖 Phase 4: AI API Integration"
echo "=============================="

# Test 7: Test AI API error analysis endpoint
run_test "AI API error analysis" \
    "curl -s -X POST $AI_API_SERVER/api/ai/analyze-errors -H 'Content-Type: application/json' -d '{\"errorFilePath\":\"$ERROR_EXPORT_FILE\"}'" \
    "success"

# Test 8: Test AI API error patterns endpoint
run_test "AI API error patterns" \
    "curl -s -X POST $AI_API_SERVER/api/ai/error-patterns -H 'Content-Type: application/json' -d '{\"errorSignature\":\"test\"}'" \
    "patterns"

# Test 9: Test AI API proactive suggestions
run_test "AI API proactive suggestions" \
    "curl -s -X POST $AI_API_SERVER/api/ai/suggest-proactive-fixes -H 'Content-Type: application/json' -d '{\"codebasePath\":\"$VAULT_PATH\"}'" \
    "suggestions"

# Test 10: Test AI API code generation
run_test "AI API code generation" \
    "curl -s -X POST $AI_API_SERVER/api/ai/generate -H 'Content-Type: application/json' -d '{\"prompt\":\"Create a simple React component\",\"language\":\"javascript\"}'" \
    "success"

echo
echo "🗄️ Phase 5: Database Integration"
echo "==============================="

# Test 11: Verify database schema (if accessible)
if command -v psql &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
    run_test "Database schema check" \
        "psql $DATABASE_URL -c \"\\dt error_patterns\"" \
        "error_patterns"
else
    echo "  ⚠️ Database not accessible for direct testing"
fi

echo
echo "🎯 Phase 6: End-to-End Workflow"
echo "==============================="

# Test 12: Complete workflow test
echo "  Running complete workflow test..."

# Step 1: Export errors
if ERROR_FILE=$(./scripts/export-vibecoding-errors.sh "$VAULT_PATH" "$TEST_OUTPUT_DIR" true 2>/dev/null | tail -1); then
    echo "    ✅ Step 1: Error export successful"
    
    # Step 2: Analyze through MCP
    if curl -s -X POST "$MCP_SERVER/call_tool" \
        -H 'Content-Type: application/json' \
        -d "{\"name\":\"analyze_error_export\",\"arguments\":{\"errorFilePath\":\"$ERROR_FILE\"}}" \
        | grep -q "success"; then
        echo "    ✅ Step 2: MCP analysis successful"
        
        # Step 3: Analyze through AI API
        if curl -s -X POST "$AI_API_SERVER/api/ai/analyze-errors" \
            -H 'Content-Type: application/json' \
            -d "{\"errorFilePath\":\"$ERROR_FILE\"}" \
            | grep -q "success"; then
            echo "    ✅ Step 3: AI API analysis successful"
            echo "  🎉 Complete workflow test PASSED"
            ((TESTS_PASSED++))
        else
            echo "    ❌ Step 3: AI API analysis failed"
            ((TESTS_FAILED++))
        fi
    else
        echo "    ❌ Step 2: MCP analysis failed"
        ((TESTS_FAILED++))
    fi
else
    echo "    ❌ Step 1: Error export failed"
    ((TESTS_FAILED++))
fi

((TOTAL_TESTS++))

echo
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed! Error analysis integration is working correctly.${NC}"
    echo
    echo "🚀 Next Steps:"
    echo "1. Start developing Phase 2 (auto-detection pipeline)"
    echo "2. Add WebSocket real-time notifications"
    echo "3. Create template-based fix generation"
    exit 0
else
    echo -e "\n⚠️ ${YELLOW}Some tests failed. Please check the integration.${NC}"
    echo
    echo "🔍 Troubleshooting:"
    echo "1. Ensure MCP server is running on port 3333"
    echo "2. Ensure AI API server is running on port 3001"
    echo "3. Check database connectivity"
    echo "4. Verify VibeCoding Vault path"
    exit 1
fi

# Clean up test files
echo
echo "🧹 Cleaning up test files..."
rm -rf "$TEST_OUTPUT_DIR"
if [ -d "./test-mock-vault" ]; then
    rm -rf "./test-mock-vault"
fi

echo "✅ Test completed!"