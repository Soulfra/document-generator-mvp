#!/bin/bash

# System Monitor for FinishThisIdea
# Ensures all services are running and healthy

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Log function
log() {
    local level=$1
    shift
    echo -e "${!level}[$level]${NC} $*"
    
    # Also log to file
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*" >> logs/system/monitor.log 2>/dev/null || true
}

# Check if a process is running
check_process() {
    local name=$1
    local pattern=$2
    
    if pgrep -f "$pattern" > /dev/null; then
        log GREEN "✓ $name is running"
        return 0
    else
        log RED "✗ $name is not running"
        return 1
    fi
}

# Check if a port is listening
check_port() {
    local name=$1
    local port=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log GREEN "✓ $name is listening on port $port"
        return 0
    else
        log RED "✗ $name is not listening on port $port"
        return 1
    fi
}

# Check directory exists
check_directory() {
    local name=$1
    local path=$2
    
    if [ -d "$path" ]; then
        log GREEN "✓ $name directory exists"
        return 0
    else
        log RED "✗ $name directory missing: $path"
        return 1
    fi
}

# Check file exists
check_file() {
    local name=$1
    local path=$2
    
    if [ -f "$path" ]; then
        log GREEN "✓ $name file exists"
        return 0
    else
        log RED "✗ $name file missing: $path"
        return 1
    fi
}

# Main monitoring function
monitor_system() {
    log BLUE "=== FinishThisIdea System Monitor ==="
    log BLUE "Time: $(date)"
    echo ""
    
    local all_good=true
    
    # Check critical directories
    log BLUE "Checking directories..."
    check_directory "Logs" "logs" || all_good=false
    check_directory "Memory" ".memory" || all_good=false
    check_directory "MCP" ".mcp" || all_good=false
    check_directory "Source" "src" || all_good=false
    echo ""
    
    # Check critical files
    log BLUE "Checking configuration files..."
    check_file "Package.json" "package.json" || all_good=false
    check_file "MCP Server" ".mcp/server.js" || all_good=false
    check_file "Memory State" ".memory/project-state.json" || all_good=false
    echo ""
    
    # Check processes
    log BLUE "Checking processes..."
    check_process "Dashboard" "dashboard/server.js" || {
        log YELLOW "  → Starting dashboard..."
        ./scripts/start-dashboard.sh > /dev/null 2>&1 &
    }
    
    # Check if any agents are running
    if pgrep -f "agent-.*-[0-9]+" > /dev/null; then
        local agent_count=$(pgrep -f "agent-.*-[0-9]+" | wc -l)
        log GREEN "✓ $agent_count agent(s) running"
    else
        log YELLOW "✓ No agents currently running"
    fi
    echo ""
    
    # Check ports
    log BLUE "Checking ports..."
    check_port "Dashboard" 3333 || all_good=false
    echo ""
    
    # Check git status
    log BLUE "Checking git status..."
    local branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    local modified=$(git status --porcelain | wc -l)
    log GREEN "✓ Current branch: $branch"
    if [ $modified -gt 0 ]; then
        log YELLOW "⚠ $modified uncommitted changes"
    else
        log GREEN "✓ Working directory clean"
    fi
    
    # Check worktrees
    local worktree_count=$(git worktree list | wc -l)
    log GREEN "✓ $worktree_count worktree(s) active"
    echo ""
    
    # Check memory system
    log BLUE "Checking memory system..."
    if [ -f ".memory/project-state.json" ]; then
        local last_update=$(stat -f %m ".memory/project-state.json" 2>/dev/null || stat -c %Y ".memory/project-state.json" 2>/dev/null || echo 0)
        local current_time=$(date +%s)
        local age=$((current_time - last_update))
        
        if [ $age -lt 3600 ]; then
            log GREEN "✓ Memory updated $(($age / 60)) minutes ago"
        else
            log YELLOW "⚠ Memory last updated $(($age / 3600)) hours ago"
        fi
    fi
    echo ""
    
    # Check MCP integration
    log BLUE "Checking MCP integration..."
    if [ -f "$HOME/.config/claude/mcp.json" ]; then
        if grep -q "finishthisidea" "$HOME/.config/claude/mcp.json"; then
            log GREEN "✓ MCP configured for Claude"
        else
            log RED "✗ MCP not configured for this project"
            all_good=false
        fi
    else
        log RED "✗ MCP config not found"
        all_good=false
    fi
    echo ""
    
    # Check recent logs for errors
    log BLUE "Checking recent errors..."
    if [ -f "logs/system/error.log" ]; then
        local recent_errors=$(tail -100 logs/system/error.log 2>/dev/null | grep -c "error" || echo 0)
        if [ $recent_errors -gt 0 ]; then
            log YELLOW "⚠ $recent_errors recent errors in logs"
        else
            log GREEN "✓ No recent errors"
        fi
    else
        log GREEN "✓ No error log yet"
    fi
    echo ""
    
    # Summary
    log BLUE "=== Summary ==="
    if $all_good; then
        log GREEN "✅ All systems operational"
    else
        log RED "❌ Some systems need attention"
    fi
    echo ""
}

# Health check mode
health_check() {
    # Simple health check that returns exit code
    local healthy=0
    
    check_directory "Logs" "logs" > /dev/null 2>&1 || healthy=1
    check_directory "Memory" ".memory" > /dev/null 2>&1 || healthy=1
    check_port "Dashboard" 3333 > /dev/null 2>&1 || healthy=1
    
    exit $healthy
}

# Watch mode
watch_mode() {
    while true; do
        clear
        monitor_system
        echo -e "\n${BLUE}Refreshing in 30 seconds... (Ctrl+C to stop)${NC}"
        sleep 30
    done
}

# Main execution
case "${1:-monitor}" in
    "monitor")
        monitor_system
        ;;
    "health")
        health_check
        ;;
    "watch")
        watch_mode
        ;;
    *)
        echo "Usage: $0 [monitor|health|watch]"
        echo "  monitor - Run system check once (default)"
        echo "  health  - Quick health check (returns exit code)"
        echo "  watch   - Continuous monitoring mode"
        exit 1
        ;;
esac