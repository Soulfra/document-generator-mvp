#!/bin/bash

# ProactiveFixEngine Integration Test
# Tests the complete proactive analysis system for preventive suggestions

set -e  # Exit on any error

echo "💡 Testing ProactiveFixEngine Integration"
echo "========================================"

# Configuration
TEST_PROJECT_DIR="./test-proactive-project"
AI_API_SERVER="http://localhost:3001"
MCP_SERVER="http://localhost:3333"

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
    mkdir -p "$TEST_PROJECT_DIR/src/services"
    
    # Create test files with various code quality issues
    cat > "$TEST_PROJECT_DIR/src/components/PerformanceIssues.jsx" << 'EOF'
import React, { useState, useEffect } from 'react';

const PerformanceIssues = ({ items = [] }) => {
  const [processedItems, setProcessedItems] = useState([]);
  
  // Performance issue: inefficient loop in render
  const heavyComputation = (item) => {
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random() * item.value;
    }
    return result;
  };

  useEffect(() => {
    // Performance issue: unnecessary re-computation
    const processed = items.map(item => ({
      ...item,
      computed: heavyComputation(item)
    }));
    setProcessedItems(processed);
  }, [items]); // This will run on every render

  return (
    <div>
      {items.map((item, index) => (
        <div key={index}> {/* Performance issue: using index as key */}
          <h3>{item.name}</h3>
          <p>Value: {heavyComputation(item)}</p> {/* Performance issue: computation in render */}
        </div>
      ))}
    </div>
  );
};

export default PerformanceIssues;
EOF

    cat > "$TEST_PROJECT_DIR/src/components/SecurityIssues.jsx" << 'EOF'
import React, { useState } from 'react';

const SecurityIssues = ({ userInput, data }) => {
  const [content, setContent] = useState('');
  
  // Security issue: XSS vulnerability
  const renderUnsafeHTML = (html) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Security issue: No input validation
  const handleSubmit = (e) => {
    e.preventDefault();
    // Directly using user input without validation
    eval(userInput); // Security issue: eval usage
    localStorage.setItem('userdata', JSON.stringify(data)); // Security issue: storing sensitive data
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter code to execute"
        />
        <button type="submit">Execute</button>
      </form>
      
      {/* Security issue: rendering user input directly */}
      {renderUnsafeHTML(userInput)}
      
      {/* Security issue: displaying sensitive data */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default SecurityIssues;
EOF

    cat > "$TEST_PROJECT_DIR/src/utils/MaintainabilityIssues.js" << 'EOF'
// Maintainability issues: poor naming, no documentation, code duplication

export function a(x, y, z) {
  if (x > 0) {
    if (y > 0) {
      if (z > 0) {
        let result = 0;
        for (let i = 0; i < 100; i++) {
          result += x * y * z;
        }
        return result;
      } else {
        let result = 0;
        for (let i = 0; i < 100; i++) {
          result += x * y;
        }
        return result;
      }
    } else {
      let result = 0;
      for (let i = 0; i < 100; i++) {
        result += x;
      }
      return result;
    }
  } else {
    return 0;
  }
}

export function b(data) {
  // No error handling
  const result = data.map(item => {
    return {
      id: item.id,
      name: item.name,
      value: a(item.x, item.y, item.z)
    };
  });
  return result;
}

// Duplicate code
export function c(data) {
  const result = data.map(item => {
    return {
      id: item.id,
      name: item.name,
      value: a(item.x, item.y, item.z)
    };
  });
  return result;
}
EOF

    cat > "$TEST_PROJECT_DIR/src/services/BugProneCode.js" << 'EOF'
// Various potential bugs and edge cases

export class DataProcessor {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
  }

  // Bug: no null checking
  processData(data) {
    return data.items.map(item => {
      // Bug: potential undefined access
      if (item.type === 'special') {
        return this.processSpecialItem(item.metadata.details);
      }
      return this.processRegularItem(item);
    });
  }

  // Bug: race condition potential
  async fetchWithCache(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await fetch(`/api/data/${key}`);
    const data = await result.json();
    
    // Bug: no error handling for failed requests
    this.cache.set(key, data);
    return data;
  }

  // Bug: memory leak - event listener not removed
  setupEventListener() {
    document.addEventListener('click', (e) => {
      this.handleClick(e);
    });
  }

  // Bug: improper error handling
  handleClick(event) {
    try {
      const target = event.target;
      const data = JSON.parse(target.dataset.info);
      this.processData(data);
    } catch (error) {
      // Bug: swallowing errors
    }
  }
}

// Bug: no input validation
export function calculateScore(metrics) {
  return metrics.reduce((sum, metric) => {
    return sum + (metric.value * metric.weight);
  }, 0) / metrics.length;
}
EOF

    cat > "$TEST_PROJECT_DIR/src/components/BestPracticeViolations.jsx" << 'EOF'
import React from 'react';

// Best practice violations: no PropTypes, inconsistent naming

const bestPracticeViolations = (props) => {
  const [State, setState] = React.useState({}); // Bad: PascalCase for state
  
  // Bad: inline styles
  const inlineStyles = {
    color: 'red',
    fontSize: '16px',
    marginTop: '10px'
  };

  // Bad: no useCallback for event handlers
  const handleClick = (e) => {
    // Bad: directly mutating state
    State.clicked = true;
    setState(State);
  };

  // Bad: using var instead of const/let
  var items = props.items || [];

  // Bad: no key prop, complex logic in render
  return (
    <div>
      {items.map(item => {
        if (item.isActive) {
          if (item.hasPermission) {
            return (
              <div 
                style={inlineStyles}
                onClick={handleClick}
              >
                {item.name}
              </div>
            );
          }
        }
        return null;
      })}
    </div>
  );
};

export default bestPracticeViolations;
EOF

    echo "✅ Test project created at: $TEST_PROJECT_DIR"
}

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up test resources..."
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
echo "⚙️ Phase 2: ProactiveFixEngine Configuration"
echo "============================================="

# Test 3: Get default configuration
run_test "Get proactive config" \
    "curl -s $AI_API_SERVER/api/proactive-fix/config" \
    "enablePerformanceAnalysis.*true"

# Test 4: Update configuration
run_test "Update proactive config" \
    "curl -s -X POST $AI_API_SERVER/api/proactive-fix/config -H 'Content-Type: application/json' -d '{\"minConfidenceThreshold\":0.8,\"maxSuggestionsPerFile\":5}'" \
    "success.*true"

echo
echo "🔬 Phase 3: Single File Analysis"
echo "================================="

# Test 5: Analyze performance issues
PERF_ANALYSIS=$(curl -s -X POST "$AI_API_SERVER/api/proactive-fix/analyze" \
    -H 'Content-Type: application/json' \
    -d "{\"filePath\":\"$TEST_PROJECT_DIR/src/components/PerformanceIssues.jsx\",\"changeType\":\"created\"}")

run_test "Analyze performance issues" \
    "echo '$PERF_ANALYSIS'" \
    "success.*true"

ANALYSIS_ID=$(echo "$PERF_ANALYSIS" | grep -o '"analysisId":"[^"]*' | cut -d'"' -f4)
echo "    📊 Performance Analysis ID: $ANALYSIS_ID"

# Test 6: Analyze security issues
run_test "Analyze security issues" \
    "curl -s -X POST $AI_API_SERVER/api/proactive-fix/analyze -H 'Content-Type: application/json' -d '{\"filePath\":\"$TEST_PROJECT_DIR/src/components/SecurityIssues.jsx\"}'" \
    "success.*true"

# Test 7: Analyze maintainability issues
run_test "Analyze maintainability issues" \
    "curl -s -X POST $AI_API_SERVER/api/proactive-fix/analyze -H 'Content-Type: application/json' -d '{\"filePath\":\"$TEST_PROJECT_DIR/src/utils/MaintainabilityIssues.js\"}'" \
    "success.*true"

echo
echo "📦 Phase 4: Batch Analysis"
echo "=========================="

# Test 8: Batch analyze multiple files
BATCH_FILES="[\"$TEST_PROJECT_DIR/src/services/BugProneCode.js\",\"$TEST_PROJECT_DIR/src/components/BestPracticeViolations.jsx\"]"

run_test "Batch analyze files" \
    "curl -s -X POST $AI_API_SERVER/api/proactive-fix/analyze-batch -H 'Content-Type: application/json' -d '{\"filePaths\":$BATCH_FILES}'" \
    "success.*true"

echo
echo "📊 Phase 5: Analysis History and Stats"
echo "======================================"

# Test 9: Get analysis history
run_test "Get analysis history" \
    "curl -s $AI_API_SERVER/api/proactive-fix/history" \
    "success.*true"

# Test 10: Get system statistics
run_test "Get proactive stats" \
    "curl -s $AI_API_SERVER/api/proactive-fix/stats" \
    "totalAnalyses"

echo
echo "⏰ Phase 6: Queue Management"
echo "=========================="

# Test 11: Queue analysis
run_test "Queue proactive analysis" \
    "curl -s -X POST $AI_API_SERVER/api/proactive-fix/queue -H 'Content-Type: application/json' -d '{\"filePath\":\"$TEST_PROJECT_DIR/src/components/PerformanceIssues.jsx\"}'" \
    "success.*true"

# Wait for queued analysis
sleep 5

echo
echo "🔧 Phase 7: MCP Integration"
echo "=========================="

# Test 12: MCP analyze file proactively
run_test "MCP analyze file proactively" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"analyze_file_proactively\",\"arguments\":{\"filePath\":\"$TEST_PROJECT_DIR/src/components/PerformanceIssues.jsx\"}}'" \
    "success.*true"

# Test 13: MCP batch analyze
run_test "MCP batch analyze" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"analyze_batch_proactively\",\"arguments\":{\"filePaths\":$BATCH_FILES}}'" \
    "success.*true"

# Test 14: MCP get proactive config
run_test "MCP get proactive config" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"get_proactive_config\",\"arguments\":{}}'" \
    "success.*true"

# Test 15: MCP update proactive config
run_test "MCP update proactive config" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"update_proactive_config\",\"arguments\":{\"enableSecurityAnalysis\":true,\"minConfidenceThreshold\":0.7}}'" \
    "success.*true"

# Test 16: MCP get proactive history
run_test "MCP get proactive history" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"get_proactive_history\",\"arguments\":{\"limit\":10}}'" \
    "success.*true"

# Test 17: MCP get proactive stats
run_test "MCP get proactive stats" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"get_proactive_stats\",\"arguments\":{}}'" \
    "success.*true"

# Test 18: MCP queue proactive analysis
run_test "MCP queue proactive analysis" \
    "curl -s -X POST $MCP_SERVER/call_tool -H 'Content-Type: application/json' -d '{\"name\":\"queue_proactive_analysis\",\"arguments\":{\"filePath\":\"$TEST_PROJECT_DIR/src/utils/MaintainabilityIssues.js\"}}'" \
    "success.*true"

echo
echo "📈 Phase 8: System Integration"
echo "=============================="

# Test 19: Get analysis details
if [ ! -z "$ANALYSIS_ID" ]; then
    run_test "Get analysis details" \
        "curl -s $AI_API_SERVER/api/proactive-fix/analysis/$ANALYSIS_ID" \
        "success.*true"
fi

# Test 20: System health check
STATS_RESPONSE=$(curl -s "$AI_API_SERVER/api/proactive-fix/stats")
echo "📊 System Statistics:"
echo "$STATS_RESPONSE" | grep -o '"totalAnalyses":[0-9]*' | echo "    Total Analyses: $(cut -d':' -f2)"
echo "$STATS_RESPONSE" | grep -o '"totalSuggestions":[0-9]*' | echo "    Total Suggestions: $(cut -d':' -f2)"
echo "$STATS_RESPONSE" | grep -o '"averageHealthScore":[0-9]*' | echo "    Average Health Score: $(cut -d':' -f2)"

echo
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed! ProactiveFixEngine is working correctly.${NC}"
    echo
    echo "🚀 ProactiveFixEngine Features:"
    echo "• Performance analysis with optimization suggestions"
    echo "• Security vulnerability detection and remediation"
    echo "• Maintainability improvements and refactoring advice"
    echo "• Best practice validation and recommendations"
    echo "• Potential bug detection and prevention strategies"
    echo "• Batch analysis for multiple files"
    echo "• Real-time integration with file watching system"
    echo "• MCP tools for Claude Code CLI integration"
    echo "• Comprehensive statistics and history tracking"
    echo
    echo "💡 Usage Examples:"
    echo "• analyze_file_proactively: Get improvement suggestions for a file"
    echo "• analyze_batch_proactively: Analyze multiple files at once"
    echo "• update_proactive_config: Customize analysis settings"
    echo "• queue_proactive_analysis: Schedule analysis with debouncing"
    echo "• get_proactive_stats: Monitor system performance and metrics"
    exit 0
else
    echo -e "\n⚠️ ${YELLOW}Some tests failed. Please check the ProactiveFixEngine integration.${NC}"
    echo
    echo "🔍 Troubleshooting:"
    echo "1. Ensure all services are running (AI API, MCP server)"
    echo "2. Check AI model availability (Ollama, Claude, GPT-4)"
    echo "3. Verify database connectivity and schema"
    echo "4. Review service logs for detailed error information"
    echo "5. Check file permissions for test project directory"
    exit 1
fi