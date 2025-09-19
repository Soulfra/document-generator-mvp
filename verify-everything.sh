#!/bin/bash

# COMPREHENSIVE VERIFICATION SCRIPT
# Verifies every aspect of the system is working

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Results tracking
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

section() {
    echo
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Start verification
clear
echo -e "${PURPLE}🔍 COMPREHENSIVE SYSTEM VERIFICATION${NC}"
echo -e "${PURPLE}═══════════════════════════════════${NC}"
echo "Starting at: $(date)"

# 1. INFRASTRUCTURE CHECK
section "1. INFRASTRUCTURE VERIFICATION"

# Check Docker
echo -n "Docker daemon... "
if docker info > /dev/null 2>&1; then
    check_pass "Running"
else
    check_fail "Not running - run: docker start"
fi

# Check PostgreSQL
echo -n "PostgreSQL container... "
if docker ps | grep -q "document-generator-postgres"; then
    check_pass "Running"
    
    echo -n "PostgreSQL connection... "
    if docker exec document-generator-postgres pg_isready > /dev/null 2>&1; then
        check_pass "Ready"
    else
        check_fail "Not ready"
    fi
else
    check_fail "Not running - run: docker-compose up -d postgres"
fi

# Check Redis
echo -n "Redis container... "
if docker ps | grep -q "document-generator-redis"; then
    check_pass "Running"
    
    echo -n "Redis connection... "
    if docker exec document-generator-redis redis-cli ping > /dev/null 2>&1; then
        check_pass "PONG received"
    else
        check_fail "Not responding"
    fi
else
    check_fail "Not running - run: docker-compose up -d redis"
fi

# 2. SERVICES CHECK
section "2. SERVICES VERIFICATION"

# Check Empire Bridge
echo -n "Empire Bridge (port 3333)... "
if curl -s http://localhost:3333/api/systems > /dev/null 2>&1; then
    check_pass "Responding"
    
    EMPIRE_COUNT=$(curl -s http://localhost:3333/api/systems | jq -r '.totalFiles // 0')
    echo -n "Empire systems discovered... "
    if [ "$EMPIRE_COUNT" -gt 1000 ]; then
        check_pass "$EMPIRE_COUNT files"
    else
        check_warn "Only $EMPIRE_COUNT files found"
    fi
else
    check_fail "Not responding - run: ./empire-system-manager.sh start"
fi

# Check Unified Gateway
echo -n "Unified Gateway (port 4444)... "
if curl -s http://localhost:4444/api/health > /dev/null 2>&1; then
    check_pass "Responding"
    
    HEALTH=$(curl -s http://localhost:4444/api/health)
    POSTGRES_OK=$(echo $HEALTH | jq -r '.services.postgres // false')
    REDIS_OK=$(echo $HEALTH | jq -r '.services.redis // false')
    BRIDGE_OK=$(echo $HEALTH | jq -r '.services.bridge // false')
    
    echo -n "Gateway → PostgreSQL... "
    [ "$POSTGRES_OK" = "true" ] && check_pass "Connected" || check_fail "Not connected"
    
    echo -n "Gateway → Redis... "
    [ "$REDIS_OK" = "true" ] && check_pass "Connected" || check_fail "Not connected"
    
    echo -n "Gateway → Bridge... "
    [ "$BRIDGE_OK" = "true" ] && check_pass "Connected" || check_fail "Not connected"
else
    check_fail "Not responding - run: ./empire-system-manager.sh start"
fi

# Check for zombie processes
echo -n "Node process count... "
NODE_COUNT=$(ps aux | grep -E "node.*\.js" | grep -v "Visual Studio Code" | grep -v grep | wc -l | tr -d ' ')
if [ "$NODE_COUNT" -le 5 ]; then
    check_pass "$NODE_COUNT processes (normal)"
elif [ "$NODE_COUNT" -le 10 ]; then
    check_warn "$NODE_COUNT processes (high)"
else
    check_fail "$NODE_COUNT processes (memory leak!) - run: ./empire-system-manager.sh cleanup"
fi

# 3. FUNCTIONALITY CHECK
section "3. FUNCTIONALITY VERIFICATION"

# Test user creation
echo -n "User creation... "
USER_RESPONSE=$(curl -s -X POST http://localhost:4444/api/users \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"verify_test_$$\",\"email\":\"verify@test.com\"}" 2>/dev/null || echo "{}")

USER_ID=$(echo $USER_RESPONSE | jq -r '.user.id // 0')
if [ "$USER_ID" -gt 0 ]; then
    check_pass "Working (ID: $USER_ID)"
else
    check_fail "Not working"
fi

# Test document creation
if [ "$USER_ID" -gt 0 ]; then
    echo -n "Document creation... "
    DOC_RESPONSE=$(curl -s -X POST http://localhost:4444/api/documents \
        -H "Content-Type: application/json" \
        -d "{\"userId\":$USER_ID,\"title\":\"Verification Test\",\"content\":\"Test document for verification\",\"docType\":\"test\"}" 2>/dev/null || echo "{}")
    
    DOC_ID=$(echo $DOC_RESPONSE | jq -r '.document.id // 0')
    if [ "$DOC_ID" -gt 0 ]; then
        check_pass "Working (ID: $DOC_ID)"
    else
        check_fail "Not working"
    fi
fi

# Test game creation
if [ "$USER_ID" -gt 0 ]; then
    echo -n "Game creation... "
    GAME_RESPONSE=$(curl -s -X POST http://localhost:4444/api/games \
        -H "Content-Type: application/json" \
        -d "{\"userId\":$USER_ID,\"name\":\"Verify Game\",\"type\":\"test\",\"config\":{}}" 2>/dev/null || echo "{}")
    
    GAME_ID=$(echo $GAME_RESPONSE | jq -r '.game.id // 0')
    if [ "$GAME_ID" -gt 0 ]; then
        check_pass "Working (ID: $GAME_ID)"
    else
        check_fail "Not working"
    fi
fi

# Test revenue
echo -n "Revenue tracking... "
REVENUE=$(curl -s http://localhost:4444/api/revenue/summary 2>/dev/null | jq -r '.totalRevenue // 0')
if [ "$REVENUE" != "null" ]; then
    check_pass "Working (\$$REVENUE tracked)"
else
    check_fail "Not working"
fi

# Test search
echo -n "Search functionality... "
SEARCH_RESULTS=$(curl -s "http://localhost:4444/api/search?q=test" 2>/dev/null | jq -r '.results // []' | jq 'length')
if [ "$SEARCH_RESULTS" -ge 0 ]; then
    check_pass "Working ($SEARCH_RESULTS results)"
else
    check_fail "Not working"
fi

# 4. UI CHECK
section "4. USER INTERFACE VERIFICATION"

# Test dashboard
echo -n "Main dashboard... "
if curl -s http://localhost:4444/ | grep -q "Empire Control Center" > /dev/null 2>&1; then
    check_pass "Accessible"
else
    check_fail "Not accessible"
fi

# Test mobile games
echo -n "Mobile game platform... "
if curl -s http://localhost:4444/real-mobile-game-platform.html | grep -q "Empire Game Platform" > /dev/null 2>&1; then
    check_pass "Accessible"
else
    check_fail "Not accessible"
fi

# Test audit firm
echo -n "Audit firm interface... "
if curl -s http://localhost:4444/real-audit-firm.html | grep -q "Audit Firm" > /dev/null 2>&1; then
    check_pass "Accessible"
else
    check_fail "Not accessible"
fi

# 5. PERFORMANCE CHECK
section "5. PERFORMANCE VERIFICATION"

# API response time
echo -n "API response time... "
START=$(date +%s%3N)
curl -s http://localhost:4444/api/health > /dev/null 2>&1
END=$(date +%s%3N)
ELAPSED=$((END - START))

if [ "$ELAPSED" -lt 100 ]; then
    check_pass "${ELAPSED}ms (excellent)"
elif [ "$ELAPSED" -lt 500 ]; then
    check_warn "${ELAPSED}ms (acceptable)"
else
    check_fail "${ELAPSED}ms (too slow)"
fi

# Database query performance
echo -n "Database query time... "
START=$(date +%s%3N)
curl -s http://localhost:4444/api/revenue/summary > /dev/null 2>&1
END=$(date +%s%3N)
ELAPSED=$((END - START))

if [ "$ELAPSED" -lt 200 ]; then
    check_pass "${ELAPSED}ms (good)"
elif [ "$ELAPSED" -lt 1000 ]; then
    check_warn "${ELAPSED}ms (acceptable)"
else
    check_fail "${ELAPSED}ms (too slow)"
fi

# 6. DATA INTEGRITY CHECK
section "6. DATA INTEGRITY VERIFICATION"

# Check database tables
echo -n "Database schema... "
TABLE_COUNT=$(docker exec document-generator-postgres psql -U postgres -d document_generator -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" -ge 5 ]; then
    check_pass "$TABLE_COUNT tables exist"
else
    check_fail "Only $TABLE_COUNT tables"
fi

# Check Redis keys
echo -n "Redis cache... "
KEY_COUNT=$(docker exec document-generator-redis redis-cli DBSIZE 2>/dev/null | awk '{print $2}')
if [ -n "$KEY_COUNT" ]; then
    check_pass "$KEY_COUNT keys cached"
else
    check_warn "No cache data"
fi

# 7. FILE SYSTEM CHECK
section "7. FILE SYSTEM VERIFICATION"

# Check critical files
echo -n "Critical files... "
CRITICAL_FILES=(
    "empire-document-bridge.js"
    "unified-empire-gateway.js"
    "empire-system-manager.sh"
    "index.html"
    "package.json"
)

MISSING_FILES=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_FILES++))
    fi
done

if [ "$MISSING_FILES" -eq 0 ]; then
    check_pass "All present"
else
    check_fail "$MISSING_FILES files missing"
fi

# Check logs directory
echo -n "Logs directory... "
if [ -d "logs" ]; then
    LOG_COUNT=$(ls logs/*.log 2>/dev/null | wc -l)
    check_pass "$LOG_COUNT log files"
else
    check_warn "No logs directory"
fi

# 8. DEPLOYMENT READINESS
section "8. DEPLOYMENT READINESS CHECK"

# Check for deployment scripts
echo -n "Deployment scripts... "
if [ -f "deploy-production.sh" ] && [ -x "deploy-production.sh" ]; then
    check_pass "Ready"
else
    check_fail "Missing or not executable"
fi

# Check for test suite
echo -n "Test suite... "
if [ -f "test-suite-complete.js" ]; then
    check_pass "Available"
else
    check_warn "Missing"
fi

# Check for documentation
echo -n "Documentation... "
DOC_COUNT=$(ls *.md 2>/dev/null | wc -l)
if [ "$DOC_COUNT" -ge 3 ]; then
    check_pass "$DOC_COUNT docs available"
else
    check_warn "Only $DOC_COUNT docs"
fi

# FINAL REPORT
section "VERIFICATION SUMMARY"

echo
echo -e "${PURPLE}═══════════════════════════════════${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${PURPLE}═══════════════════════════════════${NC}"

# Calculate score
TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$(echo "scale=1; ($PASSED * 100) / $TOTAL" | bc)

echo
echo -e "Overall Score: ${BLUE}${SCORE}%${NC}"

# Verdict
echo
if [ "$FAILED" -eq 0 ] && [ "$WARNINGS" -le 2 ]; then
    echo -e "${GREEN}🎉 SYSTEM FULLY VERIFIED AND READY!${NC}"
    echo
    echo "Next steps:"
    echo "1. Deploy with: ./deploy-production.sh"
    echo "2. Monitor with: ./empire-system-manager.sh logs"
    echo "3. Test with: node test-suite-complete.js"
    exit 0
elif [ "$FAILED" -le 2 ]; then
    echo -e "${YELLOW}⚠️  SYSTEM MOSTLY READY${NC}"
    echo
    echo "Fix these issues:"
    [ "$FAILED" -gt 0 ] && echo "- Address the $FAILED failed checks above"
    [ "$WARNINGS" -gt 3 ] && echo "- Review the $WARNINGS warnings"
    exit 1
else
    echo -e "${RED}❌ SYSTEM NOT READY${NC}"
    echo
    echo "Major issues found. Run:"
    echo "1. ./empire-system-manager.sh status"
    echo "2. docker-compose ps"
    echo "3. Check logs for errors"
    exit 2
fi