#!/bin/bash
# agent-coordinator.sh - Multi-agent task distribution and coordination

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="$PROJECT_ROOT/../finishthisidea-worktrees"
AGENT_STATE_DIR="$PROJECT_ROOT/.agent-state"
LOCK_DIR="$PROJECT_ROOT/.agent-locks"

# Create necessary directories
mkdir -p "$AGENT_STATE_DIR" "$LOCK_DIR"

# Agent types - using case statement for compatibility
get_agent_type_name() {
    case "$1" in
        "docs") echo "Documentation Agent" ;;
        "test") echo "Test Generation Agent" ;;
        "cleanup") echo "Cleanup & Standards Agent" ;;
        "integration") echo "Integration Agent" ;;
        "review") echo "Review & Validation Agent" ;;
        *) echo "Unknown Agent" ;;
    esac
}

# Function to display usage
usage() {
    echo -e "${BLUE}Multi-Agent Coordinator for FinishThisIdea${NC}"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  status              Show status of all agents"
    echo "  assign <task>       Assign task to available agent"
    echo "  start <agent-type>  Start a specific agent type"
    echo "  stop <agent-id>     Stop a specific agent"
    echo "  list-tasks          List available tasks"
    echo "  monitor             Real-time monitoring dashboard"
    echo "  report              Generate progress report"
    echo "  demo                Demo with 3 agents"
    echo "  batch-docs [count]  Create multiple doc agents (default: 5)"
    echo "  auto-assign         Assign tasks to idle agents"
    echo "  merge-completed     Merge completed agent work"
    echo
    echo "Agent Types:"
    echo "  docs - Documentation Agent"
    echo "  test - Test Generation Agent"
    echo "  cleanup - Cleanup & Standards Agent"
    echo "  integration - Integration Agent"
    echo "  review - Review & Validation Agent"
    echo
    exit 1
}

# Get list of pending documentation tasks (checks if files actually exist)
get_pending_docs() {
    local pending=()
    local file=""
    
    # Integration guides - check if they actually exist
    local integration_files=(
        "docs/07-integrations/github-integration.md"
        "docs/07-integrations/vscode-integration.md"
        "docs/07-integrations/ci-cd-integration.md"
        "docs/07-integrations/docker-integration.md"
        "docs/07-integrations/kubernetes-integration.md"
        "docs/07-integrations/slack-integration.md"
        "docs/07-integrations/jira-integration.md"
        "docs/07-integrations/monitoring-integration.md"
        "docs/07-integrations/database-integration.md"
    )
    
    for file in "${integration_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            pending+=("$file")
        fi
    done
    
    # Operations docs - check if they actually exist
    local operations_files=(
        "docs/08-operations/monitoring.md"
        "docs/08-operations/logging.md"
        "docs/08-operations/backup-recovery.md"
        "docs/08-operations/scaling.md"
        "docs/08-operations/security-operations.md"
        "docs/08-operations/incident-response.md"
        "docs/08-operations/performance-tuning.md"
        "docs/08-operations/cost-optimization.md"
        "docs/08-operations/maintenance.md"
        "docs/08-operations/disaster-recovery.md"
    )
    
    for file in "${operations_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            pending+=("$file")
        fi
    done
    
    # Troubleshooting docs - check if they actually exist
    local troubleshooting_files=(
        "docs/09-troubleshooting/common-errors.md"
        "docs/09-troubleshooting/performance-issues.md"
        "docs/09-troubleshooting/integration-problems.md"
        "docs/09-troubleshooting/deployment-failures.md"
        "docs/09-troubleshooting/api-errors.md"
        "docs/09-troubleshooting/database-issues.md"
        "docs/09-troubleshooting/authentication-problems.md"
        "docs/09-troubleshooting/llm-failures.md"
        "docs/09-troubleshooting/debugging-guide.md"
    )
    
    for file in "${troubleshooting_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            pending+=("$file")
        fi
    done
    
    printf '%s\n' "${pending[@]}"
}

# Create agent instance
create_agent() {
    local agent_type=$1
    # Add microseconds and random number to ensure uniqueness
    local agent_id="agent-${agent_type}-$(date +%s)-${RANDOM}"
    local agent_dir="$WORKTREE_BASE/$agent_id"
    
    echo -e "${BLUE}Creating agent: $agent_id${NC}"
    
    # Create worktree for agent
    cd "$PROJECT_ROOT"
    git worktree add "$agent_dir" -b "agent/$agent_id" >/dev/null 2>&1
    
    # Create agent state file
    cat > "$AGENT_STATE_DIR/$agent_id.json" <<EOF
{
    "id": "$agent_id",
    "type": "$agent_type",
    "status": "idle",
    "worktree": "$agent_dir",
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "tasks_completed": 0,
    "current_task": null
}
EOF
    
    echo -e "${GREEN}✓ Agent created: $agent_id${NC}"
    echo "$agent_id"
}

# Assign task to agent
assign_task() {
    local agent_id=$1
    local task=$2
    local lock_file="$LOCK_DIR/$(basename "$task").lock"
    
    # Check if task is already locked
    if [ -f "$lock_file" ]; then
        echo -e "${YELLOW}Task already assigned to another agent${NC}"
        return 1
    fi
    
    # Create lock
    echo "$agent_id" > "$lock_file"
    
    # Update agent state
    local state_file="$AGENT_STATE_DIR/$agent_id.json"
    if [ -f "$state_file" ]; then
        # Update JSON (simplified - in real implementation use jq)
        # Use jq if available, otherwise use sed with proper escaping
        if command -v jq >/dev/null 2>&1; then
            local tmp_file="${state_file}.tmp"
            jq --arg task "$task" '.status = "working" | .current_task = $task' "$state_file" > "$tmp_file"
            mv "$tmp_file" "$state_file"
        else
            # Escape slashes in task path for sed
            local escaped_task=$(echo "$task" | sed 's/\//\\\//g')
            local tmp_file="${state_file}.tmp"
            sed 's/"status": "idle"/"status": "working"/' "$state_file" > "$tmp_file"
            mv "$tmp_file" "$state_file"
            sed "s/\"current_task\": null/\"current_task\": \"$escaped_task\"/" "$state_file" > "$tmp_file"
            mv "$tmp_file" "$state_file"
        fi
    fi
    
    echo -e "${GREEN}✓ Task assigned: $task → $agent_id${NC}"
}

# Agent work - Uses REAL content generation, NO STUBS!
agent_work() {
    local agent_id=$1
    local agent_type=$2
    local task=$3
    
    echo -e "${CYAN}[$agent_id] Starting work on: $task${NC}"
    
    # Navigate to agent's worktree
    local agent_dir="$WORKTREE_BASE/$agent_id"
    cd "$agent_dir"
    
    # Use the REAL content generator script
    export PROJECT_ROOT="$PROJECT_ROOT"
    
    # Call the real content generator
    if ! "$SCRIPT_DIR/agent-work-real.sh" "$agent_id" "$agent_type" "$task" "$agent_dir"; then
        echo -e "${RED}[$agent_id] Failed to generate real content for: $task${NC}"
        return 1
    fi
    
    # Verify content was generated and is not a stub
    local file_path="$agent_dir/$task"
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}[$agent_id] Error: No file generated${NC}"
        return 1
    fi
    
    # Check content quality
    local content_size=$(wc -c < "$file_path")
    if [ "$content_size" -lt 1000 ]; then
        echo -e "${RED}[$agent_id] Error: Content too small (${content_size} bytes)${NC}"
        return 1
    fi
    
    # Commit the work
    git add "$task"
    git commit -m "docs: add $(basename "$task") with real content via $agent_id" >/dev/null 2>&1
    
    # Release lock
    local lock_file="$LOCK_DIR/$(basename "$task").lock"
    rm -f "$lock_file"
    
    # Update agent state
    local state_file="$AGENT_STATE_DIR/$agent_id.json"
    # Use jq if available, otherwise use sed
    if command -v jq >/dev/null 2>&1; then
        local tmp_file="${state_file}.tmp"
        jq '.status = "idle" | .current_task = null | .tasks_completed += 1' "$state_file" > "$tmp_file"
        mv "$tmp_file" "$state_file"
    else
        local tmp_file="${state_file}.tmp"
        sed 's/"status": "working"/"status": "idle"/' "$state_file" > "$tmp_file"
        mv "$tmp_file" "$state_file"
        sed 's/"current_task": ".*"/"current_task": null/' "$state_file" > "$tmp_file"
        mv "$tmp_file" "$state_file"
    fi
    
    echo -e "${GREEN}[$agent_id] Completed with REAL content: $task${NC}"
}

# Show agent status
show_status() {
    echo -e "${BLUE}=== Agent Status ===${NC}"
    echo
    
    if [ -z "$(ls -A "$AGENT_STATE_DIR" 2>/dev/null)" ]; then
        echo -e "${YELLOW}No agents running${NC}"
        return
    fi
    
    for state_file in "$AGENT_STATE_DIR"/*.json; do
        if [ -f "$state_file" ]; then
            # Parse JSON (simplified)
            local agent_id=$(basename "$state_file" .json)
            local status=$(grep '"status"' "$state_file" | cut -d'"' -f4)
            local task=$(grep '"current_task"' "$state_file" | cut -d'"' -f4)
            local type=$(grep '"type"' "$state_file" | cut -d'"' -f4)
            
            echo -e "${CYAN}Agent: $agent_id${NC}"
            echo -e "  Type: $(get_agent_type_name "$type")"
            echo -e "  Status: $status"
            if [ "$task" != "null" ]; then
                echo -e "  Current Task: $task"
            fi
            echo
        fi
    done
    
    # Show task queue
    echo -e "${BLUE}=== Task Queue ===${NC}"
    local pending_count=$(get_pending_docs | wc -l)
    echo -e "Pending documentation tasks: ${YELLOW}$pending_count${NC}"
    
    # Show locks
    if [ -n "$(ls -A "$LOCK_DIR" 2>/dev/null)" ]; then
        echo
        echo -e "${BLUE}=== Active Locks ===${NC}"
        for lock in "$LOCK_DIR"/*.lock; do
            if [ -f "$lock" ]; then
                local task=$(basename "$lock" .lock)
                local agent=$(cat "$lock")
                echo -e "  $task → $agent"
            fi
        done
    fi
}

# List available tasks
list_tasks() {
    echo -e "${BLUE}=== Available Tasks ===${NC}"
    echo
    
    local tasks=($(get_pending_docs))
    local locked_tasks=()
    
    # Get locked tasks
    if [ -d "$LOCK_DIR" ]; then
        for lock in "$LOCK_DIR"/*.lock; do
            if [ -f "$lock" ]; then
                locked_tasks+=($(basename "$lock" .lock))
            fi
        done
    fi
    
    # Display tasks with status
    for task in "${tasks[@]}"; do
        local task_name=$(basename "$task")
        if [[ " ${locked_tasks[@]} " =~ " ${task_name} " ]]; then
            echo -e "${RED}[LOCKED]${NC} $task"
        else
            echo -e "${GREEN}[AVAILABLE]${NC} $task"
        fi
    done
    
    echo
    echo -e "Total tasks: ${#tasks[@]} (${GREEN}$(( ${#tasks[@]} - ${#locked_tasks[@]} )) available${NC}, ${RED}${#locked_tasks[@]} locked${NC})"
}

# Generate progress report
generate_report() {
    echo -e "${BLUE}=== FinishThisIdea Progress Report ===${NC}"
    echo -e "Generated: $(date)"
    echo
    
    # Documentation progress
    local total_docs=80  # Approximate total documentation files needed
    local completed_docs=$(find "$PROJECT_ROOT/docs" -name "*.md" | wc -l)
    local progress=$(( completed_docs * 100 / total_docs ))
    
    echo -e "${CYAN}Documentation Progress:${NC}"
    echo -e "  Completed: $completed_docs / $total_docs (${progress}%)"
    echo -e "  Progress: ["
    printf "  "
    for i in {1..50}; do
        if [ $i -le $(( progress / 2 )) ]; then
            printf "${GREEN}█${NC}"
        else
            printf "${GRAY}░${NC}"
        fi
    done
    printf "\n  ]\n"
    echo
    
    # Agent statistics
    if [ -n "$(ls -A "$AGENT_STATE_DIR" 2>/dev/null)" ]; then
        echo -e "${CYAN}Agent Statistics:${NC}"
        local total_agents=$(ls -1 "$AGENT_STATE_DIR"/*.json 2>/dev/null | wc -l)
        local working_agents=$(grep -l '"status": "working"' "$AGENT_STATE_DIR"/*.json 2>/dev/null | wc -l)
        echo -e "  Total Agents: $total_agents"
        echo -e "  Working: $working_agents"
        echo -e "  Idle: $(( total_agents - working_agents ))"
    fi
    
    echo
    echo -e "${CYAN}Recent Activity:${NC}"
    # Show last 5 commits from agent branches
    cd "$PROJECT_ROOT"
    git log --all --grep="agent-" --oneline -n 5 2>/dev/null || echo "  No agent activity yet"
}

# Main command handling
case "${1:-}" in
    "status")
        show_status
        ;;
    "assign")
        if [ -z "${2:-}" ]; then
            echo -e "${RED}Error: Task required${NC}"
            echo "Usage: $0 assign <task-path>"
            exit 1
        fi
        # Find an idle agent or create one
        idle_agent=$(grep -l '"status": "idle"' "$AGENT_STATE_DIR"/*.json 2>/dev/null | head -1)
        if [ -z "$idle_agent" ]; then
            echo -e "${YELLOW}No idle agents, creating new documentation agent${NC}"
            agent_id=$(create_agent "docs")
        else
            agent_id=$(basename "$idle_agent" .json)
        fi
        assign_task "$agent_id" "$2"
        ;;
    "start")
        if [ -z "${2:-}" ]; then
            echo -e "${RED}Error: Agent type required${NC}"
            echo "Available types: docs test cleanup integration review"
            exit 1
        fi
        create_agent "$2"
        ;;
    "stop")
        if [ -z "${2:-}" ]; then
            echo -e "${RED}Error: Agent ID required${NC}"
            exit 1
        fi
        # Remove agent state and worktree
        rm -f "$AGENT_STATE_DIR/${2}.json"
        cd "$PROJECT_ROOT"
        git worktree remove "$WORKTREE_BASE/$2" --force 2>/dev/null || true
        echo -e "${GREEN}Agent stopped: $2${NC}"
        ;;
    "list-tasks")
        list_tasks
        ;;
    "monitor")
        # Simple monitoring loop
        while true; do
            clear
            show_status
            echo
            echo -e "${GRAY}Refreshing every 5 seconds... (Ctrl+C to exit)${NC}"
            sleep 5
        done
        ;;
    "report")
        generate_report
        ;;
    "demo")
        # Demo mode - create agents and assign tasks
        echo -e "${MAGENTA}=== DEMO MODE ===${NC}"
        echo "Creating 3 documentation agents..."
        
        # Create agents
        agent1=$(create_agent "docs")
        agent2=$(create_agent "docs")
        agent3=$(create_agent "docs")
        
        # Get first 3 available tasks
        tasks=($(get_pending_docs | head -3))
        
        # Assign tasks
        assign_task "$agent1" "${tasks[0]}"
        assign_task "$agent2" "${tasks[1]}"
        assign_task "$agent3" "${tasks[2]}"
        
        # Simulate work
        echo
        echo "Simulating agent work..."
        agent_work "$agent1" "docs" "${tasks[0]}" &
        agent_work "$agent2" "docs" "${tasks[1]}" &
        agent_work "$agent3" "docs" "${tasks[2]}" &
        
        wait
        
        echo
        echo -e "${GREEN}Demo completed!${NC}"
        generate_report
        ;;
    "batch-docs")
        # Batch documentation creation
        count=${2:-5}
        echo -e "${MAGENTA}=== BATCH DOCUMENTATION MODE ===${NC}"
        echo "Creating $count documentation agents..."
        
        # Create agent pool
        agents=()
        for i in $(seq 1 $count); do
            agent=$(create_agent "docs")
            agents+=($agent)
            echo -e "${GREEN}Created agent $i/$count: $agent${NC}"
        done
        
        # Get all pending tasks
        tasks=($(get_pending_docs))
        task_count=${#tasks[@]}
        
        echo
        echo -e "${CYAN}Found $task_count pending documentation tasks${NC}"
        
        # Assign tasks to agents
        task_index=0
        for agent in "${agents[@]}"; do
            if [ $task_index -lt $task_count ]; then
                assign_task "$agent" "${tasks[$task_index]}"
                ((task_index++))
            fi
        done
        
        echo
        echo -e "${GREEN}Initial assignment complete!${NC}"
        echo "Agents will continue processing remaining tasks..."
        show_status
        ;;
    "auto-assign")
        # Auto-assign tasks to idle agents
        echo -e "${BLUE}Auto-assigning tasks to idle agents...${NC}"
        
        # Find idle agents
        idle_agents=()
        if [ -d "$AGENT_STATE_DIR" ]; then
            for state_file in "$AGENT_STATE_DIR"/*.json; do
                if [ -f "$state_file" ]; then
                    status=$(grep '"status"' "$state_file" | cut -d'"' -f4)
                    if [ "$status" = "idle" ]; then
                        agent_id=$(basename "$state_file" .json)
                        idle_agents+=($agent_id)
                    fi
                fi
            done
        fi
        
        if [ ${#idle_agents[@]} -eq 0 ]; then
            echo -e "${YELLOW}No idle agents found${NC}"
            exit 0
        fi
        
        echo "Found ${#idle_agents[@]} idle agents"
        
        # Get unassigned tasks
        tasks=($(get_pending_docs))
        assigned=0
        
        for agent in "${idle_agents[@]}"; do
            if [ $assigned -lt ${#tasks[@]} ]; then
                # Check if task is not locked
                task="${tasks[$assigned]}"
                lock_file="$LOCK_DIR/$(basename "$task").lock"
                if [ ! -f "$lock_file" ]; then
                    assign_task "$agent" "$task"
                    ((assigned++))
                fi
            fi
        done
        
        echo -e "${GREEN}Assigned $assigned tasks${NC}"
        ;;
    "merge-completed")
        # Merge completed agent work
        echo -e "${BLUE}Merging completed agent work...${NC}"
        
        if [ -d "$AGENT_STATE_DIR" ]; then
            for state_file in "$AGENT_STATE_DIR"/*.json; do
                if [ -f "$state_file" ]; then
                    agent_id=$(basename "$state_file" .json)
                    status=$(grep '"status"' "$state_file" | cut -d'"' -f4)
                    
                    if [ "$status" = "completed" ]; then
                        echo "Merging work from $agent_id..."
                        cd "$PROJECT_ROOT"
                        git merge "agent/$agent_id" --no-ff -m "docs: merge completed work from $agent_id"
                        
                        # Clean up
                        rm -f "$state_file"
                        git worktree remove "$WORKTREE_BASE/$agent_id" --force 2>/dev/null || true
                        
                        echo -e "${GREEN}✓ Merged and cleaned up $agent_id${NC}"
                    fi
                fi
            done
        fi
        ;;
    *)
        usage
        ;;
esac