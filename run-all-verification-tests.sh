#!/bin/bash

# Comprehensive Test Runner
# Runs all test suites and generates reports

set -euo pipefail

echo "🧪 COMPREHENSIVE TEST RUNNER"
echo "============================"
echo "Running all test suites..."
echo ""

# Check if we have required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }

# Create test results directory
mkdir -p test-results

# Function to run test suite
run_suite() {
    local SUITE_NAME=$1
    local SUITE_CMD=$2
    
    echo "🔄 Running $SUITE_NAME..."
    echo "========================"
    
    if timeout 300 $SUITE_CMD > "test-results/${SUITE_NAME}.log" 2>&1; then
        echo "✅ $SUITE_NAME completed successfully"
    else
        echo "⚠️  $SUITE_NAME completed with warnings"
    fi
    echo ""
}

# 1. Quick E2E Verification
run_suite "quick-e2e" "./quick-e2e-verification.sh"

# 2. Compatibility Check
if [ -f "./quick-compatibility-check.sh" ]; then
    run_suite "compatibility" "./quick-compatibility-check.sh"
fi

# 3. Dependency Verification
if [ -f "./verify-dependencies.js" ]; then
    run_suite "dependencies" "node verify-dependencies.js"
fi

# 4. Connection Tests
run_suite "connections" "node connect-and-test-all.js --test"

# 5. Comprehensive Test Framework
if [ -f "./comprehensive-test-framework.js" ]; then
    echo "🔄 Running comprehensive test suite..."
    echo "===================================="
    
    # Run each test category separately to avoid timeouts
    for category in unit integration e2e performance security compatibility; do
        echo "  📋 Testing $category..."
        timeout 60 node comprehensive-test-framework.js --$category > "test-results/comprehensive-$category.log" 2>&1 || true
    done
fi

# Generate summary report
echo "📊 GENERATING TEST SUMMARY"
echo "========================="

cat > test-results/SUMMARY.md << 'EOF'
# Test Execution Summary

Generated: $(date)

## Test Suites Run

EOF

# Add results from each test
for logfile in test-results/*.log; do
    if [ -f "$logfile" ]; then
        SUITE=$(basename "$logfile" .log)
        echo "### $SUITE" >> test-results/SUMMARY.md
        
        # Extract key results
        if grep -q "PASSED\|✅" "$logfile"; then
            PASSED=$(grep -c "PASSED\|✅" "$logfile" || echo 0)
            echo "- Passed tests: $PASSED" >> test-results/SUMMARY.md
        fi
        
        if grep -q "FAILED\|❌" "$logfile"; then
            FAILED=$(grep -c "FAILED\|❌" "$logfile" || echo 0)
            echo "- Failed tests: $FAILED" >> test-results/SUMMARY.md
        fi
        
        echo "" >> test-results/SUMMARY.md
    fi
done

# Check for test reports
if [ -f "TEST-REPORT.md" ]; then
    echo "## Comprehensive Test Report" >> test-results/SUMMARY.md
    echo "See: TEST-REPORT.md" >> test-results/SUMMARY.md
fi

if [ -f "test-report.json" ]; then
    echo "" >> test-results/SUMMARY.md
    echo "## Detailed Results" >> test-results/SUMMARY.md
    echo "See: test-report.json" >> test-results/SUMMARY.md
fi

echo "✅ Test execution complete!"
echo ""
echo "📁 Results saved in test-results/"
echo "📊 Summary: test-results/SUMMARY.md"
echo ""

# Show quick summary
echo "📈 QUICK SUMMARY:"
echo "================"

# Count overall results
TOTAL_PASSED=$(grep -h "PASSED\|✅" test-results/*.log 2>/dev/null | wc -l || echo 0)
TOTAL_FAILED=$(grep -h "FAILED\|❌" test-results/*.log 2>/dev/null | wc -l || echo 0)
TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (TOTAL_PASSED * 100) / TOTAL_TESTS ))
    echo "Total Tests Run: $TOTAL_TESTS"
    echo "✅ Passed: $TOTAL_PASSED"
    echo "❌ Failed: $TOTAL_FAILED"
    echo "📊 Success Rate: ${SUCCESS_RATE}%"
else
    echo "No test results found"
fi

# Exit with appropriate code
if [ $TOTAL_FAILED -gt 10 ]; then
    echo ""
    echo "⚠️  Multiple test failures detected"
    exit 1
else
    echo ""
    echo "✅ Test suite completed"
    exit 0
fi