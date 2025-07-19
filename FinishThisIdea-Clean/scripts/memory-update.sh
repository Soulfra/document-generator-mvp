#!/bin/bash
# memory-update.sh - Updates project memory and state tracking

set -e

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_DIR="$PROJECT_ROOT/.memory"
STATE_FILE="$MEMORY_DIR/project-state.json"
HISTORY_FILE="$MEMORY_DIR/history.log"

# Create memory directory if it doesn't exist
mkdir -p "$MEMORY_DIR"

# Function to calculate project statistics
calculate_stats() {
    local total_files=$(find "$PROJECT_ROOT" -type f -name "*.ts" -o -name "*.js" -o -name "*.md" | wc -l)
    local src_files=$(find "$PROJECT_ROOT/src" -type f -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l || echo 0)
    local doc_files=$(find "$PROJECT_ROOT/docs" -name "*.md" 2>/dev/null | wc -l || echo 0)
    local test_files=$(find "$PROJECT_ROOT" -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l || echo 0)
    
    echo "{
        \"total_files\": $total_files,
        \"source_files\": $src_files,
        \"documentation_files\": $doc_files,
        \"test_files\": $test_files
    }"
}

# Function to get current git info
get_git_info() {
    local branch=$(git branch --show-current)
    local commit=$(git rev-parse HEAD)
    local author=$(git log -1 --pretty=format:'%an')
    local message=$(git log -1 --pretty=format:'%s')
    
    echo "{
        \"branch\": \"$branch\",
        \"commit\": \"$commit\",
        \"author\": \"$author\",
        \"message\": \"$message\"
    }"
}

# Function to get todo status
get_todo_status() {
    local todo_file="$PROJECT_ROOT/.todo/active-tasks.json"
    if [ -f "$todo_file" ]; then
        cat "$todo_file"
    else
        echo "[]"
    fi
}

# Update project state
update_state() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local stats=$(calculate_stats)
    local git_info=$(get_git_info)
    local todos=$(get_todo_status)
    
    # Create state object
    cat > "$STATE_FILE" <<EOF
{
    "timestamp": "$timestamp",
    "statistics": $stats,
    "git": $git_info,
    "active_todos": $todos,
    "documentation_progress": {
        "total": 80,
        "completed": $(find "$PROJECT_ROOT/docs" -name "*.md" | wc -l),
        "percentage": $(( $(find "$PROJECT_ROOT/docs" -name "*.md" | wc -l) * 100 / 80 ))
    }
}
EOF

    # Log to history
    echo "[$timestamp] State updated - Branch: $(git branch --show-current), Docs: $(find "$PROJECT_ROOT/docs" -name "*.md" | wc -l)/80" >> "$HISTORY_FILE"
}

# Main execution
echo "Updating project memory..."
update_state

# Create MCP-compatible memory file
if [ -d "$PROJECT_ROOT/.mcp" ]; then
    cp "$STATE_FILE" "$PROJECT_ROOT/.mcp/memory-state.json"
fi

# Update worktree memory if applicable
if [ -n "$GIT_WORK_TREE" ]; then
    echo "Worktree detected: $GIT_WORK_TREE" >> "$HISTORY_FILE"
fi

echo "Memory update complete"