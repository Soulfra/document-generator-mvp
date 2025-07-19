#!/bin/bash
# validate-mcp.sh - Test MCP functionality and validate integration

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== MCP Validation Script ===${NC}"
echo -e "${BLUE}Testing Model Context Protocol Integration${NC}"
echo

# Change to project root
cd "$PROJECT_ROOT"

# Function to log results
log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_fail() {
    echo -e "${RED}[✗]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    if eval "$test_command" > /dev/null 2>&1; then
        log_success "PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        log_fail "FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Check MCP configuration exists
echo -e "${YELLOW}1. Checking MCP configuration...${NC}"
run_test "MCP config exists" "[ -f .mcp/config.json ]"
run_test "MCP server exists" "[ -f .mcp/server.js ]"
run_test "Prompts directory exists" "[ -d .mcp/prompts ]"
run_test "Tools directory exists" "[ -d .mcp/tools ]"

# 2. Validate MCP configuration
echo -e "\n${YELLOW}2. Validating MCP configuration...${NC}"
if [ -f .mcp/config.json ]; then
    # Check if config is valid JSON
    if node -e "JSON.parse(require('fs').readFileSync('.mcp/config.json'))" 2>/dev/null; then
        log_success "Valid JSON configuration"
        ((TESTS_PASSED++))
        
        # Extract key configuration values
        MCP_SERVER_CMD=$(node -p "JSON.parse(require('fs').readFileSync('.mcp/config.json')).mcpServers?.finishthisidea?.command || 'not found'")
        PREFERRED_MODEL=$(node -p "JSON.parse(require('fs').readFileSync('.mcp/config.json')).models?.preferred || 'not found'")
        
        log_info "Server command: $MCP_SERVER_CMD"
        log_info "Preferred model: $PREFERRED_MODEL"
    else
        log_fail "Invalid JSON in config.json"
        ((TESTS_FAILED++))
    fi
fi

# 3. Check MCP server functionality
echo -e "\n${YELLOW}3. Testing MCP server...${NC}"
if [ -f .mcp/server.js ]; then
    # Test if server can be loaded
    if node -e "require('./.mcp/server.js')" 2>/dev/null; then
        log_success "Server module loads correctly"
        ((TESTS_PASSED++))
    else
        log_fail "Server module has errors"
        ((TESTS_FAILED++))
        node -e "require('./.mcp/server.js')" 2>&1 | head -5
    fi
    
    # Check for required exports
    run_test "Server exports handlers" "node -e \"const s = require('./.mcp/server.js'); if (!s.name || !s.version) throw new Error('Missing exports')\""
fi

# 4. Check for prompts
echo -e "\n${YELLOW}4. Checking prompt templates...${NC}"
if [ -d .mcp/prompts ]; then
    PROMPT_COUNT=$(find .mcp/prompts -name "*.md" -o -name "*.txt" 2>/dev/null | wc -l)
    if [ "$PROMPT_COUNT" -gt 0 ]; then
        log_success "Found $PROMPT_COUNT prompt templates"
        ((TESTS_PASSED++))
        find .mcp/prompts -name "*.md" -o -name "*.txt" | head -5 | while read -r prompt; do
            log_info "  - $(basename "$prompt")"
        done
    else
        log_warning "No prompt templates found"
    fi
fi

# 5. Check for tools
echo -e "\n${YELLOW}5. Checking custom tools...${NC}"
if [ -d .mcp/tools ]; then
    TOOL_COUNT=$(find .mcp/tools -name "*.js" -o -name "*.ts" 2>/dev/null | wc -l)
    if [ "$TOOL_COUNT" -gt 0 ]; then
        log_success "Found $TOOL_COUNT custom tools"
        ((TESTS_PASSED++))
        find .mcp/tools -name "*.js" -o -name "*.ts" | head -5 | while read -r tool; do
            log_info "  - $(basename "$tool")"
        done
    else
        log_warning "No custom tools found"
    fi
fi

# 6. Test Claude Code integration
echo -e "\n${YELLOW}6. Testing Claude Code integration...${NC}"

# Check for Claude Code config directory
CLAUDE_CONFIG_DIR=""
if [ -d "$HOME/.config/claude" ]; then
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
elif [ -d "$HOME/Library/Application Support/Claude" ]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
fi

if [ -n "$CLAUDE_CONFIG_DIR" ]; then
    log_info "Claude config directory: $CLAUDE_CONFIG_DIR"
    
    # Check if our project is configured
    if [ -f "$CLAUDE_CONFIG_DIR/config.json" ]; then
        if grep -q "finishthisidea" "$CLAUDE_CONFIG_DIR/config.json" 2>/dev/null; then
            log_success "Project configured in Claude Code"
            ((TESTS_PASSED++))
        else
            log_warning "Project not found in Claude Code config"
            log_info "Run: ./setup-mcp.sh to configure"
        fi
    fi
else
    log_warning "Claude Code config directory not found"
    log_info "Make sure Claude Code is installed"
fi

# 7. Test memory integration
echo -e "\n${YELLOW}7. Testing memory system integration...${NC}"
run_test "Memory directory exists" "[ -d .claude ]"
run_test "Memory files readable" "[ -r .claude/memory.md ] && [ -r .claude/context.md ]"

# Check if MCP can access memory
if [ -f .mcp/server.js ]; then
    # Simple test to see if server references .claude directory
    if grep -q "\.claude" .mcp/server.js 2>/dev/null; then
        log_success "MCP server integrates with memory system"
        ((TESTS_PASSED++))
    else
        log_warning "MCP server doesn't reference memory system"
    fi
fi

# 8. Test rules integration
echo -e "\n${YELLOW}8. Testing rules integration...${NC}"
if [ -f .mcp/config.json ]; then
    RULES_DIR=$(node -p "JSON.parse(require('fs').readFileSync('.mcp/config.json')).rules?.codeStyle?.replace('.rules/', '') ? '.rules' : ''" 2>/dev/null)
    if [ "$RULES_DIR" = ".rules" ] && [ -d .rules ]; then
        log_success "Rules directory configured"
        ((TESTS_PASSED++))
        
        # Check for rule files
        for rule_file in "code-standards.md" "project-rules.md" "git-workflow.md"; do
            run_test "Rule file: $rule_file" "[ -f .rules/$rule_file ]"
        done
    else
        log_warning "Rules directory not properly configured"
    fi
fi

# 9. Generate test report
echo -e "\n${BLUE}=== MCP Validation Summary ===${NC}"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ "$TOTAL_TESTS" -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo "Success rate: $SUCCESS_RATE%"
fi

# 10. Recommendations
echo -e "\n${BLUE}=== Recommendations ===${NC}"
if [ "$TESTS_FAILED" -gt 0 ]; then
    log_warning "Some tests failed. Run the following to fix:"
    echo "  1. Ensure MCP SDK is installed: npm install @modelcontextprotocol/sdk"
    echo "  2. Run setup script: ./setup-mcp.sh"
    echo "  3. Create missing directories: mkdir -p .mcp/prompts .mcp/tools .rules"
    echo "  4. Check server.js for syntax errors"
else
    log_success "MCP validation passed! Your setup is ready."
fi

# Update memory with validation results
cat >> .claude/memory.md << EOF

## MCP Validation - $(date +"%Y-%m-%d %H:%M:%S")
- Tests passed: $TESTS_PASSED/$TOTAL_TESTS
- Integration status: $([ "$TESTS_FAILED" -eq 0 ] && echo "Ready" || echo "Needs fixes")
EOF

# Exit with appropriate code
[ "$TESTS_FAILED" -eq 0 ] && exit 0 || exit 1