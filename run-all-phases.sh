#!/bin/bash

# 🚀 Automated Phase 1-3 Verification Script
# Runs all phases sequentially with progress tracking

echo "🎯 Document Generator - Automated Phase 1-3 Verification"
echo "========================================================"
echo ""
echo "This script will run all 3 phases automatically."
echo "Total estimated time: 10-15 minutes"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="logs/verification_run_${TIMESTAMP}.log"

# Function to check if a command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 completed successfully${NC}"
        echo "✅ $1 completed successfully" >> "$LOG_FILE"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        echo "❌ $1 failed" >> "$LOG_FILE"
        echo "Check the log file: $LOG_FILE"
        exit 1
    fi
}

# Function to run a phase
run_phase() {
    local phase_num=$1
    local phase_name=$2
    local command=$3
    
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}PHASE $phase_num: $phase_name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "🕐 Starting at $(date +%H:%M:%S)"
    echo ""
    
    # Log phase start
    echo "=== PHASE $phase_num: $phase_name ===" >> "$LOG_FILE"
    echo "Started at $(date)" >> "$LOG_FILE"
    
    # Run the command
    eval "$command" 2>&1 | tee -a "$LOG_FILE"
    
    check_status "Phase $phase_num"
}

# Start verification
echo "📋 Starting verification run at $(date)"
echo "📁 Logging to: $LOG_FILE"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
node --version >> "$LOG_FILE" 2>&1
npm --version >> "$LOG_FILE" 2>&1

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Phase 1: Baseline Analysis
run_phase 1 "Baseline Analysis" "node soulfra-baseline-analysis.js"

# Wait a moment between phases
sleep 2

# Phase 2: Apply Fixes
# First, kill any existing services
echo "🛑 Stopping any existing services..."
pkill -f "fix-" 2>/dev/null || true
pkill -f "empire-api-bridge" 2>/dev/null || true
sleep 2

run_phase 2 "Apply Fixes & Integration Testing" "./start-all-fixes.sh"

# Phase 3: Verification & QR Generation
run_phase 3 "Documentation Testing" "node test-soulfra-fixes-documentation.js"
run_phase 3 "Reproducibility Testing" "node execute-reproducibility-test.js"
run_phase 3 "QR Code Generation" "node generate-phase3-qr-codes-fixed.js"

# Generate summary
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}VERIFICATION COMPLETE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for key output files
echo "📊 Checking generated files..."
echo ""

FILES_TO_CHECK=(
    "soulfra-baseline-results-*.json"
    "integration-test-results.json"
    "doc-test-report-*.json"
    "reproducibility-report-*.json"
    "phase3-qr-verification-*.html"
)

MISSING_FILES=0
for pattern in "${FILES_TO_CHECK[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        echo -e "${GREEN}✅ Found: $pattern${NC}"
    else
        echo -e "${RED}❌ Missing: $pattern${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""
if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}🎉 All verification files generated successfully!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open the QR verification page:"
    echo "   open phase3-qr-verification-*.html"
    echo ""
    echo "2. Review the completion report:"
    echo "   cat PHASE-3-COMPLETION-REPORT.md"
    echo ""
    echo "3. Check the full log:"
    echo "   cat $LOG_FILE"
else
    echo -e "${YELLOW}⚠️  Some files may be missing. Check the log for details.${NC}"
fi

echo ""
echo "✨ Verification completed at $(date)"
echo "📁 Full log available at: $LOG_FILE"

# Kill any remaining services
echo ""
echo "🛑 Cleaning up services..."
pkill -f "fix-" 2>/dev/null || true
pkill -f "empire-api-bridge" 2>/dev/null || true

echo ""
echo "✅ Done!"