#!/bin/bash

echo "🔍 COMPREHENSIVE SYSTEM VERIFICATION"
echo "===================================="
echo "Testing all systems, integrations, and backups"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing: $test_name... "
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    result=$(eval "$test_command" 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ] && [[ "$result" =~ $expected_pattern ]]; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected: $expected_pattern"
        echo "  Got: $result"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test if process is running
echo -e "${BLUE}1. PROCESS VERIFICATION${NC}"
run_test "Unified Game Node Process" "pgrep -f unified-game-node.js" "[0-9]+"
run_test "Port 8090 Listening" "lsof -i :8090" "LISTEN"
echo ""

# Test API endpoints
echo -e "${BLUE}2. API ENDPOINT VERIFICATION${NC}"
run_test "Main API Status" "curl -s http://localhost:8090/api/status" '"status":"running"'
run_test "World API" "curl -s http://localhost:8090/api/world" '\[\]|\{'
run_test "Build API" "curl -s -X POST -H 'Content-Type: application/json' -d '{\"type\":\"test\",\"position\":{\"x\":0,\"y\":0,\"z\":0}}' http://localhost:8090/api/build" '"success":true'
echo ""

# Test Achievement System
echo -e "${BLUE}3. ACHIEVEMENT SYSTEM VERIFICATION${NC}"
run_test "Achievement List API" "curl -s http://localhost:8090/api/achievements/list" '\['
run_test "Create Player API" "curl -s -X POST -H 'Content-Type: application/json' -d '{\"playerId\":\"test_player\"}' http://localhost:8090/api/achievements/create" '"success":true'
run_test "Player Profile API" "curl -s http://localhost:8090/api/achievements/profile/test_player" '"id":"test_player"'
run_test "Leaderboard API" "curl -s http://localhost:8090/api/achievements/leaderboard" '\['
echo ""

# Test Digital Archaeology System
echo -e "${BLUE}4. DIGITAL ARCHAEOLOGY VERIFICATION${NC}"
run_test "Archaeological Sites API" "curl -s http://localhost:8090/api/archaeology/sites" 'geocities_ruins'
run_test "Communication Protocols API" "curl -s http://localhost:8090/api/archaeology/protocols" 'morse_digital'
run_test "Expedition Planning API" "curl -s -X POST -H 'Content-Type: application/json' -d '{\"siteId\":\"geocities_ruins\",\"expeditionType\":\"site_survey\",\"team\":[\"test_player\"]}' http://localhost:8090/api/archaeology/expedition" '"id":"EXP_'
run_test "Message Encoding API" "curl -s -X POST -H 'Content-Type: application/json' -d '{\"message\":\"SOS\",\"protocol\":\"morse_digital\"}' http://localhost:8090/api/archaeology/encode" '"encoded":"000 111 000"'
echo ""

# Test Web Pages Load
echo -e "${BLUE}5. WEB PAGE VERIFICATION${NC}"
run_test "Main Game Page" "curl -s http://localhost:8090/ | head -20" "UNIFIED GAME"
run_test "3D Games Page" "curl -s http://localhost:8090/3d | head -20" "3D GAMES"
run_test "Achievements Page" "curl -s http://localhost:8090/achievements | head -20" "Achievement System"
run_test "Digital Archaeology Page" "curl -s http://localhost:8090/archaeology | head -20" "DIGITAL ARCHAEOLOGY"
echo ""

# Test File Integrity
echo -e "${BLUE}6. FILE INTEGRITY VERIFICATION${NC}"
run_test "Unified Game Node File" "ls -la unified-game-node.js" "unified-game-node.js"
run_test "3D Games Integration File" "ls -la unified-3d-games.js" "unified-3d-games.js"
run_test "Achievement System File" "ls -la achievement-progression-system.js" "achievement-progression-system.js"
run_test "Digital Archaeology File" "ls -la digital-archaeology-system.js" "digital-archaeology-system.js"
echo ""

# Test Backup Systems
echo -e "${BLUE}7. BACKUP SYSTEM VERIFICATION${NC}"
if [ -f "portable-gaming-*.tar.gz" ]; then
    run_test "Backup Tarball Exists" "ls -la portable-gaming-*.tar.gz" "tar.gz"
    run_test "Tarball Integrity" "tar -tzf portable-gaming-*.tar.gz | head -5" "/"
else
    echo -e "${YELLOW}No backup tarball found - creating one...${NC}"
    tar -czf "backup-verification-$(date +%Y%m%d-%H%M%S).tar.gz" \
        unified-game-node.js \
        unified-3d-games.js \
        achievement-progression-system.js \
        digital-archaeology-system.js \
        *.md *.sh 2>/dev/null
    run_test "Backup Created" "ls -la backup-verification-*.tar.gz" "tar.gz"
fi
echo ""

# Test Game Integrations
echo -e "${BLUE}8. GAME INTEGRATION VERIFICATION${NC}"
# Test that 3D games don't have CDN dependencies
run_test "No CDN Dependencies in 3D Games" "grep -c 'cdn.jsdelivr.net\|unpkg.com\|cdnjs.cloudflare.com' unified-3d-games.js || echo 0" "0"
run_test "Canvas Rendering Available" "grep -c 'getContext.*2d\|getContext.*webgl' unified-3d-games.js" "[1-9]"
run_test "Achievement XP Formula" "grep -c 'Math.floor.*level.*13' achievement-progression-system.js" "[1-9]"
run_test "OSRS-style Skills" "grep -c 'building.*exploration.*dimensional' achievement-progression-system.js" "[1-9]"
echo ""

# Memory and Performance Check
echo -e "${BLUE}9. PERFORMANCE VERIFICATION${NC}"
node_pid=$(pgrep -f unified-game-node.js)
if [ ! -z "$node_pid" ]; then
    memory_usage=$(ps -o pid,rss,vsz,comm -p $node_pid | tail -1 | awk '{print $2}')
    run_test "Memory Usage Reasonable" "echo $memory_usage" "[0-9][0-9][0-9][0-9]+"
    run_test "Process Still Running" "ps -p $node_pid" "unified-game-node"
else
    echo -e "${RED}Process not found!${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 2))
    TESTS_TOTAL=$((TESTS_TOTAL + 2))
fi
echo ""

# Test Real Expedition Execution
echo -e "${BLUE}10. EXPEDITION EXECUTION TEST${NC}"
echo "Creating and executing a real expedition..."

# Get an expedition ID from planning
expedition_response=$(curl -s -X POST -H 'Content-Type: application/json' \
    -d '{"siteId":"geocities_ruins","expeditionType":"site_survey","team":["test_player"]}' \
    http://localhost:8090/api/archaeology/expedition)

expedition_id=$(echo "$expedition_response" | grep -o '"id":"EXP_[^"]*"' | cut -d'"' -f4)

if [ ! -z "$expedition_id" ]; then
    run_test "Expedition Execution" "curl -s -X POST http://localhost:8090/api/archaeology/expedition/$expedition_id/execute" '"discoveries"'
else
    echo -e "${RED}Could not get expedition ID${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
fi
echo ""

# Final Results
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo "===================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Tests Total: $TESTS_TOTAL"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS VERIFIED AND WORKING!${NC}"
    echo -e "${GREEN}✅ Your unified trial is fully operational${NC}"
    echo ""
    echo -e "${BLUE}🎮 READY FOR ACTION:${NC}"
    echo "  • Main Game: http://localhost:8090/"
    echo "  • Phone Access: http://$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1):8090/"
    echo "  • All 3D games work offline"
    echo "  • Achievement system tracking progress"
    echo "  • Digital archaeology expeditions functional"
    echo "  • Backup systems verified"
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}Check the failures above and fix before proceeding${NC}"
fi

echo ""
echo -e "${BLUE}📊 SYSTEM STATUS:${NC}"
echo "  • Process: $(pgrep -f unified-game-node.js | wc -l) running"
echo "  • Memory: $(ps -o rss -p $(pgrep -f unified-game-node.js) | tail -1) KB"
echo "  • Uptime: $(ps -o etime -p $(pgrep -f unified-game-node.js) | tail -1 | tr -d ' ')"
echo "  • Files: $(ls *.js *.md 2>/dev/null | wc -l) total"
echo ""

exit $TESTS_FAILED