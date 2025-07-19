#!/bin/bash

# Sovereign Agents System Validation Script
# Verifies system configuration without starting services

echo "🎭 Sovereign Agents System Validation"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VALIDATION_PASSED=0
VALIDATION_FAILED=0

# Function to check files/directories
validate_item() {
    local path=$1
    local description=$2
    local type=${3:-"file"}
    
    if [ "$type" = "dir" ]; then
        if [ -d "$path" ]; then
            echo -e "${GREEN}✅${NC} $description"
            ((VALIDATION_PASSED++))
        else
            echo -e "${RED}❌${NC} $description (missing directory: $path)"
            ((VALIDATION_FAILED++))
        fi
    else
        if [ -f "$path" ]; then
            echo -e "${GREEN}✅${NC} $description"
            ((VALIDATION_PASSED++))
        else
            echo -e "${RED}❌${NC} $description (missing file: $path)"
            ((VALIDATION_FAILED++))
        fi
    fi
}

# Function to check file contents
validate_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅${NC} $description"
        ((VALIDATION_PASSED++))
    else
        echo -e "${RED}❌${NC} $description"
        ((VALIDATION_FAILED++))
    fi
}

echo ""
echo "📁 Core File Structure Validation"
echo "================================"

# Check main configuration files
validate_item "docker-compose.yml" "Docker Compose configuration"
validate_item "services/sovereign-agents" "Sovereign Agents service directory" "dir"
validate_item "services/sovereign-agents/Dockerfile" "Sovereign Agents Dockerfile"
validate_item "services/sovereign-agents/package.json" "Sovereign Agents package.json"
validate_item "services/sovereign-agents/src/index.js" "Main service entry point"

echo ""
echo "🤖 Agent System Validation"
echo "=========================="

# Check core agent files
validate_item "services/sovereign-agents/src/services/SovereignAgent.js" "Core Agent class"
validate_item "services/sovereign-agents/src/services/SovereignAgentWorker.js" "Agent Worker (child process)"
validate_item "services/sovereign-agents/src/services/HumanConductorInterface.js" "Human Conductor Interface"
validate_item "services/sovereign-agents/src/services/SovereignOrchestrationDatabase.js" "SQLite Database layer"
validate_item "services/sovereign-agents/src/services/FileBasedDatabase.js" "JSON fallback database"
validate_item "services/sovereign-agents/src/services/DocumentAgentBridge.js" "Document pipeline bridge"

echo ""
echo "🐳 Docker Configuration Validation"
echo "=================================="

# Check Docker Compose configuration
validate_content "docker-compose.yml" "sovereign-agents:" "Sovereign Agents service defined"
validate_content "docker-compose.yml" "8085:8085" "Port 8085 configured"
validate_content "docker-compose.yml" "sovereign_data:" "Persistent data volume"
validate_content "docker-compose.yml" "healthcheck:" "Health checks configured"

echo ""
echo "🎼 Default Agent Configuration Validation"  
echo "========================================"

# Check default agent initialization
validate_content "services/sovereign-agents/src/index.js" "DocumentAnalyzer_Prime" "DocumentAnalyzer_Prime agent configured"
validate_content "services/sovereign-agents/src/index.js" "TemplateSelector_Alpha" "TemplateSelector_Alpha agent configured"
validate_content "services/sovereign-agents/src/index.js" "CodeGenerator_Beta" "CodeGenerator_Beta agent configured"
validate_content "services/sovereign-agents/src/index.js" "initializeDefaultAgents" "Default agent initialization function"

echo ""
echo "📡 API Endpoint Validation"
echo "=========================="

# Check API route definitions
validate_content "services/sovereign-agents/src/index.js" "/health" "Health endpoint defined"
validate_content "services/sovereign-agents/src/index.js" "/api/sovereign/agents" "Agent management endpoints"
validate_content "services/sovereign-agents/src/index.js" "/api/sovereign/process-document" "Document processing endpoint"
validate_content "services/sovereign-agents/src/index.js" "/api/sovereign/conductor" "Conductor interface endpoints"

echo ""
echo "🔄 WebSocket Configuration Validation"
echo "====================================="

# Check WebSocket setup
validate_content "services/sovereign-agents/src/index.js" "WebSocket" "WebSocket server configured"
validate_content "services/sovereign-agents/src/index.js" "ws.on.*message" "WebSocket message handling"

echo ""
echo "🧪 Testing Infrastructure Validation"
echo "==================================="

# Check testing files
validate_item "LIVE_TEST_EXECUTION.md" "Comprehensive testing guide"
validate_item "LIVE_TEST_REPORT.md" "Live test execution report"
validate_item "quick-test.sh" "Quick validation script"
validate_item "test-sovereign-integration.sh" "Integration test script"
validate_item "test-api-endpoints.sh" "API endpoint test script"

echo ""
echo "📚 Documentation Validation"
echo "==========================="

# Check documentation
validate_item "services/sovereign-agents/README.md" "Service documentation"
validate_item "LIVE_TESTING_GUIDE.md" "Live testing guide"
validate_item "SYSTEM_READY_CONFIRMATION.md" "System ready confirmation"
validate_item "SOVEREIGN_AGENTS_INTEGRATION_COMPLETE.md" "Integration summary"

echo ""
echo "🎯 System Readiness Check"
echo "========================"

# Check for required commands
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅${NC} Docker is installed"
    ((VALIDATION_PASSED++))
else
    echo -e "${RED}❌${NC} Docker is not installed"
    ((VALIDATION_FAILED++))
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅${NC} Docker Compose is installed"
    ((VALIDATION_PASSED++))
else
    echo -e "${RED}❌${NC} Docker Compose is not installed"
    ((VALIDATION_FAILED++))
fi

if command -v curl &> /dev/null; then
    echo -e "${GREEN}✅${NC} curl is available for testing"
    ((VALIDATION_PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} curl not available (install for API testing)"
fi

if command -v jq &> /dev/null; then
    echo -e "${GREEN}✅${NC} jq is available for JSON parsing"
    ((VALIDATION_PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} jq not available (install for better JSON output)"
fi

echo ""
echo "📊 Validation Results"
echo "===================="
echo -e "Validations Passed: ${GREEN}$VALIDATION_PASSED${NC}"
echo -e "Validations Failed: ${RED}$VALIDATION_FAILED${NC}"

if [ $VALIDATION_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 SYSTEM VALIDATION COMPLETE!${NC}"
    echo -e "${GREEN}Your Sovereign Agents System is properly configured and ready for testing.${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Start the system: docker-compose up -d"
    echo "2. Run live tests: ./quick-test.sh"
    echo "3. Follow testing guide: open LIVE_TEST_EXECUTION.md"
    echo ""
    echo -e "${BLUE}Your sovereign agents await your command!${NC} 🎭✨"
else
    echo ""
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo "Please fix the missing files/configurations above before testing."
fi

exit $VALIDATION_FAILED