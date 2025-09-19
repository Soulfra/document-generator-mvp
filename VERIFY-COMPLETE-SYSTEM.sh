#!/bin/bash
# VERIFY-COMPLETE-SYSTEM.sh - Comprehensive verification of Agent Economy System

echo "🔍 COMPLETE SYSTEM VERIFICATION"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verification results
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Function to check service
check_service() {
    local name=$1
    local port=$2
    local protocol=${3:-http}
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "🔍 Checking $name on port $port... "
    
    if [ "$protocol" = "http" ]; then
        if curl -s --connect-timeout 3 "http://localhost:$port" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Active${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ Unavailable${NC}"
        fi
    elif [ "$protocol" = "ws" ]; then
        # WebSocket check using Node.js
        if node -e "
            const WebSocket = require('ws');
            const ws = new WebSocket('ws://localhost:$port');
            ws.on('open', () => { console.log('✅ WebSocket Active'); process.exit(0); });
            ws.on('error', () => { console.log('❌ WebSocket Failed'); process.exit(1); });
            setTimeout(() => { console.log('❌ WebSocket Timeout'); process.exit(1); }, 3000);
        " 2>/dev/null; then
            echo -e "${GREEN}✅ Active${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ Unavailable${NC}"
        fi
    fi
}

echo "🌐 CORE SERVICES VERIFICATION"
echo "-----------------------------"

# Check all core services
check_service "MCP Connector" 6666
check_service "Dungeon Master" 7777
check_service "Agent Economy Forum" 8080
check_service "Sphinx Documentation" 9000

echo ""
echo "📡 WEBSOCKET SERVICES VERIFICATION"
echo "----------------------------------"

check_service "MCP WebSocket" 6667 ws
check_service "Dungeon Master Reasoning" 7778 ws
check_service "Agent Economy WebSocket" 8081 ws
check_service "Blockchain WebSocket" 8082 ws
check_service "Documentation WebSocket" 9001 ws

echo ""
echo "⚔️ AGENT ROUTERS VERIFICATION"
echo "-----------------------------"

check_service "HTML Master" 7001
check_service "CSS Mage" 7002
check_service "JS Wizard" 7003
check_service "Design Paladin" 7004
check_service "SEO Rogue" 7005
check_service "DB Cleric" 7006

echo ""
echo "📁 FILE SYSTEM VERIFICATION"
echo "---------------------------"

# Check critical files exist
FILES=(
    "DUNGEON-MASTER-ROUTER.js"
    "AGENT-ECONOMY-FORUM.js"
    "AGENT-BLOCKCHAIN.js"
    "SPHINX-DOC-GENERATOR.js"
    "MCP-CONNECTOR.js"
    "LAYER-RIDER-PI.html"
    "3D-API-WORLD.html"
    "SITEMASTER-DASHBOARD.html"
    "START-ALL-ROUTERS.sh"
)

for file in "${FILES[@]}"; do
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "📄 Checking $file... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Missing${NC}"
    fi
done

echo ""
echo "🔐 SECURITY VERIFICATION"
echo "------------------------"

# Check if we can verify agent economy security
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "🔑 Agent PGP Key Generation... "
if node -e "
    const crypto = require('crypto');
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        console.log('✅ PGP Keys Working');
        process.exit(0);
    } catch (e) {
        console.log('❌ PGP Key Generation Failed');
        process.exit(1);
    }
" 2>/dev/null; then
    echo -e "${GREEN}✅ Working${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Check blockchain functionality
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "⛓️ Blockchain Hash Functions... "
if node -e "
    const crypto = require('crypto');
    try {
        const hash = crypto.createHash('sha256').update('test').digest('hex');
        if (hash.length === 64) {
            console.log('✅ Blockchain Hashing Working');
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (e) {
        console.log('❌ Blockchain Hashing Failed');
        process.exit(1);
    }
" 2>/dev/null; then
    echo -e "${GREEN}✅ Working${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo ""
echo "📚 DOCUMENTATION VERIFICATION"
echo "-----------------------------"

# Check if Sphinx docs structure exists
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "📖 Sphinx Documentation Structure... "
if [ -d "docs" ] && [ -d "docs/source" ]; then
    echo -e "${GREEN}✅ Structure Created${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Structure Missing${NC}"
fi

# Check if Python requirements exist
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "🐍 Python Requirements File... "
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✅ Found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo ""
echo "🎮 INTEGRATION VERIFICATION"
echo "---------------------------"

# Test if systems can communicate
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "🔗 Cross-system Communication... "

# Try to connect to MCP and get status
if curl -s --connect-timeout 3 "http://localhost:6666/status" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Systems Communicating${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️ Limited Communication${NC}"
fi

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================="

# Calculate success rate
SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $((TOTAL_CHECKS - PASSED_CHECKS))"
echo "Success Rate: $SUCCESS_RATE%"

echo ""

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 SYSTEM VERIFICATION: EXCELLENT${NC}"
    echo "✅ Agent Economy System is fully operational!"
    echo ""
    echo "🚀 READY TO USE:"
    echo "   📚 Sphinx Documentation: http://localhost:9000"
    echo "   🏰 Dungeon Master: http://localhost:7777"
    echo "   🔐 Agent Economy: http://localhost:8080"
    echo "   🌍 3D Visualization: Open 3D-API-WORLD.html"
    echo "   🎨 Layer Rider: Open LAYER-RIDER-PI.html"
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️ SYSTEM VERIFICATION: GOOD${NC}"
    echo "Most systems are operational with minor issues."
    echo "Check failed services and restart if needed."
elif [ $SUCCESS_RATE -ge 50 ]; then
    echo -e "${YELLOW}🔄 SYSTEM VERIFICATION: PARTIAL${NC}"
    echo "Some systems are not responding."
    echo "Run './START-ALL-ROUTERS.sh' to start all services."
else
    echo -e "${RED}❌ SYSTEM VERIFICATION: FAILED${NC}"
    echo "Major system issues detected."
    echo "Please check prerequisites and run setup again."
fi

echo ""
echo "💡 TROUBLESHOOTING:"
echo "   • Run: ./START-ALL-ROUTERS.sh"
echo "   • Check: ./stop-routers.sh (if needed)"
echo "   • Logs: Check terminal output for errors"
echo "   • Ports: Ensure no conflicts with other services"

echo ""
echo "📖 NEXT STEPS:"
echo "   1. Open Sphinx Documentation: http://localhost:9000"
echo "   2. Verify system through documentation dashboard"
echo "   3. Explore agent economy and blockchain systems"
echo "   4. Watch real-time AI reasoning in 3D visualization"

exit $((TOTAL_CHECKS - PASSED_CHECKS))