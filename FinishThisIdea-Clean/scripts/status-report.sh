#!/bin/bash
# status-report.sh - Show comprehensive status of the FinishThisIdea project

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${MAGENTA}=== FinishThisIdea Status Report ===${NC}"
echo -e "Generated: $(date)"
echo

# Documentation Progress
echo -e "${CYAN}📚 Documentation Progress:${NC}"
total_docs=80
completed_docs=$(find "$PROJECT_ROOT/docs" -name "*.md" | wc -l | tr -d ' ')
remaining_docs=$((total_docs - completed_docs))
progress=$((completed_docs * 100 / total_docs))

echo -e "  Completed: ${GREEN}$completed_docs/$total_docs${NC} (${progress}%)"
echo -e "  Remaining: ${YELLOW}$remaining_docs files${NC}"

# Progress bar
echo -n "  Progress: ["
for i in {1..50}; do
    if [ $i -le $((progress / 2)) ]; then
        printf "${GREEN}█${NC}"
    else
        printf "░"
    fi
done
printf "]\n\n"

# Breakdown by section
echo -e "${CYAN}📁 Documentation Breakdown:${NC}"
for dir in "$PROJECT_ROOT/docs"/*; do
    if [ -d "$dir" ]; then
        section=$(basename "$dir")
        count=$(find "$dir" -name "*.md" | wc -l | tr -d ' ')
        echo -e "  $section: $count files"
    fi
done
echo

# Recent Activity
echo -e "${CYAN}📊 Recent Activity:${NC}"
echo -e "  Last 5 documentation commits:"
cd "$PROJECT_ROOT"
git log --oneline -n 5 --grep="docs:" 2>/dev/null | sed 's/^/    /' || echo "    No documentation commits yet"
echo

# Automation Status
echo -e "${CYAN}🤖 Automation Status:${NC}"
if [ -f ".husky/post-commit" ]; then
    echo -e "  ${GREEN}✓${NC} Post-commit hooks installed"
else
    echo -e "  ${RED}✗${NC} Post-commit hooks not installed"
fi

if [ -f ".mcp/config.json" ]; then
    echo -e "  ${GREEN}✓${NC} MCP configuration found"
else
    echo -e "  ${YELLOW}!${NC} MCP configuration missing"
fi

if pgrep -f "dashboard/server.js" > /dev/null; then
    echo -e "  ${GREEN}✓${NC} Dashboard running at http://localhost:3333"
else
    echo -e "  ${YELLOW}!${NC} Dashboard not running (run: node dashboard/server.js)"
fi
echo

# Remaining Tasks
echo -e "${CYAN}📝 Remaining Documentation Tasks:${NC}"
echo -e "  ${YELLOW}Integration Guides (6 remaining):${NC}"
echo "    - docker-integration.md"
echo "    - kubernetes-integration.md"
echo "    - slack-integration.md"
echo "    - jira-integration.md"
echo "    - monitoring-integration.md"
echo "    - database-integration.md"
echo
echo -e "  ${YELLOW}Operations Docs (10 remaining):${NC}"
echo "    - All 10 operations documents need to be created"
echo
echo -e "  ${YELLOW}Troubleshooting Docs (9 remaining):${NC}"
echo "    - All 9 troubleshooting documents need to be created"
echo

# Quick Actions
echo -e "${CYAN}⚡ Quick Actions:${NC}"
echo "  1. Create next doc:     ./scripts/agent-coordinator.sh assign <task>"
echo "  2. Check duplicates:    ./scripts/duplicate-detector.sh scan"
echo "  3. View dashboard:      open http://localhost:3333"
echo "  4. Monitor agents:      ./scripts/agent-coordinator.sh monitor"
echo "  5. Generate report:     ./scripts/agent-coordinator.sh report"
echo

# Next Steps
echo -e "${CYAN}🎯 Recommended Next Steps:${NC}"
echo "  1. Continue creating documentation (26 files remaining)"
echo "  2. Set up CI/CD integration for automated testing"
echo "  3. Create MCP tools for remaining categories"
echo "  4. Implement WebSocket updates for real-time dashboard"
echo "  5. Test multi-agent system with actual AI models"
echo

echo -e "${GREEN}✨ Keep up the great work! You're 67% done!${NC}"