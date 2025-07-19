#!/bin/bash

# Test All Connections - Document Generator
echo "🔗 DOCUMENT GENERATOR CONNECTION TESTER"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_file() {
    if [ -f "$2" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $1 missing at $2${NC}"
        ((FAILED++))
    fi
}

# Test all core files
echo "📋 Testing Core Files..."
echo "======================="
test_file "CLI Interface" "./cli.js"
test_file "Web Interface" "./web-interface.js"
test_file "Character System" "./character-system-max.js"
test_file "Execute Character" "./execute-character-system.js"
test_file "Master Orchestrator" "./master-orchestrator.js"
test_file "Final Executor" "./final-executor.js"

echo ""
echo "📋 Testing Layer Files..."
echo "========================"
test_file "Integration Layer" "./integration-layer.js"
test_file "Mesh Layer" "./mesh-layer.js"
test_file "Tool Layer" "./tool-layer.js"
test_file "Runtime Layer" "./runtime-layer.js"
test_file "Economy Layer" "./economy-layer.js"
test_file "Git Layer" "./git-layer.js"

echo ""
echo "📋 Testing FinishThisIdea Tiers..."
echo "=================================="
test_file "Tier 3 Symlinks" "./FinishThisIdea/tier-3-symlink-manager.js"
test_file "Tier 4 Substrate" "./FinishThisIdea/tier-4-substrate-manager.js"
test_file "Tier 4 Service Mesh" "./FinishThisIdea/tier-4-service-mesh.js"
test_file "Tier 5 Universal" "./FinishThisIdea/tier-5-universal-interface.js"

echo ""
echo "📋 Testing Support Scripts..."
echo "============================="
test_file "Quick Deploy" "./quick-deploy.sh"
test_file "Memory Saver" "./symlink-memory-saver.js"
test_file "Launch Script" "./launch.js"
test_file "Tier Connector" "./tier-connector.js"

# Summary
echo ""
echo "📊 TEST RESULTS"
echo "==============="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "📊 Total: $TOTAL"

if [ $FAILED -eq 0 ]; then
    RATE="100"
else
    RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)
fi
echo ""
echo "🎯 Success Rate: ${RATE}%"

# Test Node.js availability
echo ""
echo "🔧 Testing Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION available${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
fi

# Quick character test
echo ""
echo "🎭 Quick Character Test..."
if [ -f "./character-system-max.js" ]; then
    echo "Running character test..."
    node -e "
        try {
            const CharacterSystem = require('./character-system-max.js');
            const chars = new CharacterSystem();
            console.log('✅ Character system loads successfully');
            console.log('✅ Created ' + chars.characters.size + ' characters');
            process.exit(0);
        } catch (e) {
            console.error('❌ Character system error:', e.message);
            process.exit(1);
        }
    "
fi

# Manual commands
echo ""
echo "🚀 QUICK START COMMANDS"
echo "======================="
echo ""
echo "1️⃣  Minimal Memory Mode:"
echo "   node launch.js"
echo ""
echo "2️⃣  Character System Only:"
echo "   node character-system-max.js"
echo ""
echo "3️⃣  Web Interface:"
echo "   node execute-character-system.js"
echo "   → Open http://localhost:8888"
echo ""
echo "4️⃣  Full System:"
echo "   node final-executor.js"
echo ""
echo "5️⃣  Test Tier Connections:"
echo "   node tier-connector.js"
echo ""
echo "6️⃣  Run Connection Tests:"
echo "   node test-all-connections.js"
echo ""

# Interactive menu
echo "💡 What would you like to do?"
echo ""
echo "1. Start Character System"
echo "2. Start Web Interface"
echo "3. Run Full Test Suite"
echo "4. View Tier Map"
echo "5. Exit"
echo ""
read -p "Select option (1-5): " choice

case $choice in
    1)
        echo "🎭 Starting Character System..."
        node character-system-max.js
        ;;
    2)
        echo "🌐 Starting Web Interface..."
        node execute-character-system.js
        ;;
    3)
        echo "🧪 Running Full Test Suite..."
        node test-all-connections.js
        ;;
    4)
        echo "🗺️ Showing Tier Map..."
        node tier-connector.js
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option. Run script again."
        ;;
esac