#!/bin/bash
# worktree-manager.sh - Simplified git worktree operations with S+ tier standards

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="../finishthisidea-worktrees"

# Change to project root
cd "$PROJECT_ROOT"

# Function to display usage
usage() {
    echo -e "${BLUE}Git Worktree Manager for FinishThisIdea${NC}"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  list                    List all worktrees"
    echo "  new <type> <name>       Create new worktree"
    echo "  sync <name>            Sync worktree with main"
    echo "  merge <name>           Merge worktree to main"
    echo "  remove <name>          Remove worktree"
    echo "  status                 Show status of all worktrees"
    echo "  clean                  Clean up merged worktrees"
    echo
    echo "Types for 'new' command:"
    echo "  feature   New feature development"
    echo "  docs      Documentation work"
    echo "  fix       Bug fixes"
    echo "  chore     Maintenance tasks"
    echo "  refactor  Code refactoring"
    echo
    echo "Examples:"
    echo "  $0 new feature ollama-integration"
    echo "  $0 new docs api-reference"
    echo "  $0 sync ollama-integration"
    echo "  $0 merge ollama-integration"
    echo
    exit 1
}

# Function to log messages
log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to update memory
update_memory() {
    local action="$1"
    local details="$2"
    
    cat >> .claude/memory.md << EOF

## Worktree Action - $(date +"%Y-%m-%d %H:%M:%S")
- Action: $action
- Details: $details
EOF
}

# Function to check git status
check_git_status() {
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_error "You have uncommitted changes. Please commit or stash them first."
        exit 1
    fi
}

# Command: list
cmd_list() {
    echo -e "${BLUE}=== Git Worktrees ===${NC}"
    git worktree list
}

# Command: new
cmd_new() {
    if [ $# -lt 2 ]; then
        log_error "Usage: $0 new <type> <name>"
        exit 1
    fi
    
    local type="$1"
    local name="$2"
    local branch_name=""
    local worktree_path=""
    
    # Validate type
    case "$type" in
        feature|docs|fix|chore|refactor)
            branch_name="$type/$name"
            worktree_path="$WORKTREE_BASE/$type-$name"
            ;;
        *)
            log_error "Invalid type: $type"
            echo "Valid types: feature, docs, fix, chore, refactor"
            exit 1
            ;;
    esac
    
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        log_error "Branch '$branch_name' already exists"
        exit 1
    fi
    
    # Create worktree directory if needed
    mkdir -p "$WORKTREE_BASE"
    
    echo -e "${BLUE}Creating worktree: $name${NC}"
    echo "Type: $type"
    echo "Branch: $branch_name"
    echo "Path: $worktree_path"
    
    # Create the worktree
    git worktree add -b "$branch_name" "$worktree_path"
    
    # Create setup script in worktree
    cat > "$worktree_path/.worktree-setup.sh" << 'SETUP_EOF'
#!/bin/bash
# Worktree setup script
echo "Setting up worktree environment..."

# Install dependencies if package.json exists
if [ -f package.json ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Copy environment file if needed
if [ -f ../.env.example ] && [ ! -f .env ]; then
    cp ../.env.example .env
    echo "Created .env from template"
fi

# Create necessary directories
mkdir -p logs temp

echo "Worktree setup complete!"
SETUP_EOF
    
    chmod +x "$worktree_path/.worktree-setup.sh"
    
    # Update memory
    update_memory "Created worktree" "$type/$name at $worktree_path"
    
    # Update context
    cat >> .claude/context.md << EOF

## Active Worktrees
- $type-$name: $(date +"%Y-%m-%d") - $branch_name
EOF
    
    log_success "Worktree created successfully!"
    echo
    echo "Next steps:"
    echo "  1. cd $worktree_path"
    echo "  2. ./.worktree-setup.sh"
    echo "  3. Start developing!"
}

# Command: sync
cmd_sync() {
    if [ $# -lt 1 ]; then
        log_error "Usage: $0 sync <name>"
        exit 1
    fi
    
    local name="$1"
    local worktree_path=""
    
    # Find the worktree
    worktree_path=$(git worktree list --porcelain | grep -B1 "branch refs/heads/[^/]*/$name" | grep "worktree" | cut -d' ' -f2 | head -1)
    
    if [ -z "$worktree_path" ]; then
        log_error "Worktree for '$name' not found"
        exit 1
    fi
    
    echo -e "${BLUE}Syncing worktree: $name${NC}"
    echo "Path: $worktree_path"
    
    # Save current directory
    CURRENT_DIR=$(pwd)
    
    # Change to worktree
    cd "$worktree_path"
    
    # Stash any changes
    if ! git diff-index --quiet HEAD --; then
        log_info "Stashing local changes..."
        git stash push -m "Auto-stash before sync $(date +%Y-%m-%d_%H:%M:%S)"
    fi
    
    # Fetch and rebase
    log_info "Fetching latest changes..."
    git fetch origin
    
    log_info "Rebasing on origin/main..."
    if git rebase origin/main; then
        log_success "Rebase successful"
        
        # Update memory
        cd "$CURRENT_DIR"
        update_memory "Synced worktree" "$name with main"
    else
        log_error "Rebase failed - resolve conflicts and run: git rebase --continue"
        cd "$CURRENT_DIR"
        exit 1
    fi
    
    # Pop stash if exists
    cd "$worktree_path"
    if git stash list | grep -q "Auto-stash before sync"; then
        log_info "Restoring local changes..."
        git stash pop
    fi
    
    cd "$CURRENT_DIR"
    log_success "Sync complete!"
}

# Command: merge
cmd_merge() {
    if [ $# -lt 1 ]; then
        log_error "Usage: $0 merge <name>"
        exit 1
    fi
    
    local name="$1"
    local branch_name=""
    
    # Find the branch
    branch_name=$(git branch -r | grep -o "[^/]*/$name$" | head -1)
    
    if [ -z "$branch_name" ]; then
        # Try local branches
        branch_name=$(git branch | grep -o "[^/]*/$name$" | head -1)
    fi
    
    if [ -z "$branch_name" ]; then
        log_error "Branch for '$name' not found"
        exit 1
    fi
    
    echo -e "${BLUE}Merging worktree: $name${NC}"
    echo "Branch: $branch_name"
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Switch to main if needed
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_info "Switching to main branch..."
        git checkout main
    fi
    
    # Pull latest main
    log_info "Updating main branch..."
    git pull origin main
    
    # Merge the feature branch
    log_info "Merging $branch_name..."
    if git merge --no-ff "$branch_name" -m "Merge $branch_name

- Completed work from worktree: $name
- Merged on: $(date +%Y-%m-%d)"; then
        log_success "Merge successful"
        
        # Push to remote
        log_info "Pushing to remote..."
        git push origin main
        
        # Update memory
        update_memory "Merged worktree" "$name ($branch_name) into main"
        
        echo
        echo "Next step: Remove the worktree with:"
        echo "  $0 remove $name"
    else
        log_error "Merge failed - resolve conflicts and commit"
        exit 1
    fi
}

# Command: remove
cmd_remove() {
    if [ $# -lt 1 ]; then
        log_error "Usage: $0 remove <name>"
        exit 1
    fi
    
    local name="$1"
    local worktree_path=""
    local branch_name=""
    
    # Find the worktree
    worktree_path=$(git worktree list --porcelain | grep -B1 "/$name" | grep "worktree" | cut -d' ' -f2 | grep "$name" | head -1)
    
    if [ -z "$worktree_path" ]; then
        log_error "Worktree for '$name' not found"
        exit 1
    fi
    
    # Get branch name
    cd "$worktree_path" 2>/dev/null && branch_name=$(git branch --show-current) && cd - > /dev/null
    
    echo -e "${BLUE}Removing worktree: $name${NC}"
    echo "Path: $worktree_path"
    echo "Branch: $branch_name"
    
    # Remove worktree
    log_info "Removing worktree..."
    git worktree remove "$worktree_path" --force
    
    # Ask about branch deletion
    echo
    read -p "Delete branch '$branch_name'? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Delete local branch
        git branch -D "$branch_name" 2>/dev/null || true
        
        # Delete remote branch
        git push origin --delete "$branch_name" 2>/dev/null || log_warning "Remote branch may already be deleted"
    fi
    
    # Update memory
    update_memory "Removed worktree" "$name (was at $worktree_path)"
    
    log_success "Worktree removed successfully!"
}

# Command: status
cmd_status() {
    echo -e "${BLUE}=== Worktree Status ===${NC}"
    echo
    
    # List all worktrees with details
    git worktree list --porcelain | while read -r line; do
        if [[ $line == worktree* ]]; then
            WORKTREE_PATH=$(echo "$line" | cut -d' ' -f2)
            
            # Skip if we can't read the next lines
            read -r HEAD_LINE
            read -r BRANCH_LINE
            
            if [ -n "$BRANCH_LINE" ]; then
                BRANCH=$(echo "$BRANCH_LINE" | cut -d' ' -f2 | sed 's|refs/heads/||')
                
                # Get worktree name from path
                WORKTREE_NAME=$(basename "$WORKTREE_PATH")
                
                echo -e "${CYAN}$WORKTREE_NAME${NC}"
                echo "  Path: $WORKTREE_PATH"
                echo "  Branch: $BRANCH"
                
                # Check if directory exists
                if [ -d "$WORKTREE_PATH" ]; then
                    # Get status
                    cd "$WORKTREE_PATH" 2>/dev/null && {
                        # Check how far behind main
                        BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
                        echo "  Behind main: $BEHIND commits"
                        
                        # Check for uncommitted changes
                        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
                            echo "  Status: Has uncommitted changes"
                        else
                            echo "  Status: Clean"
                        fi
                        cd - > /dev/null
                    }
                else
                    echo "  Status: Directory missing!"
                fi
                echo
            fi
        fi
    done
}

# Command: clean
cmd_clean() {
    echo -e "${BLUE}=== Cleaning Merged Worktrees ===${NC}"
    echo
    
    # Get list of merged branches
    MERGED_BRANCHES=$(git branch -r --merged main | grep -v main | sed 's/origin\///')
    
    if [ -z "$MERGED_BRANCHES" ]; then
        log_info "No merged branches found"
        return
    fi
    
    echo "Found merged branches:"
    echo "$MERGED_BRANCHES" | while read -r branch; do
        echo "  - $branch"
    done
    echo
    
    # Check each worktree
    git worktree list --porcelain | grep "branch refs/heads/" | while read -r line; do
        BRANCH=$(echo "$line" | sed 's/branch refs\/heads\///')
        
        # If branch is in merged list
        if echo "$MERGED_BRANCHES" | grep -q "^$BRANCH$"; then
            # Find worktree path
            WORKTREE_PATH=$(git worktree list --porcelain | grep -B2 "branch refs/heads/$BRANCH" | grep "worktree" | cut -d' ' -f2)
            
            if [ -n "$WORKTREE_PATH" ]; then
                echo "Removing merged worktree: $WORKTREE_PATH (branch: $BRANCH)"
                git worktree remove "$WORKTREE_PATH" --force
                
                # Delete the branch
                git branch -D "$BRANCH" 2>/dev/null || true
                git push origin --delete "$BRANCH" 2>/dev/null || true
            fi
        fi
    done
    
    # Prune worktree list
    git worktree prune
    
    log_success "Cleanup complete!"
}

# Main script logic
if [ $# -eq 0 ]; then
    usage
fi

COMMAND="$1"
shift

case "$COMMAND" in
    list)
        cmd_list "$@"
        ;;
    new)
        cmd_new "$@"
        ;;
    sync)
        cmd_sync "$@"
        ;;
    merge)
        cmd_merge "$@"
        ;;
    remove)
        cmd_remove "$@"
        ;;
    status)
        cmd_status "$@"
        ;;
    clean)
        cmd_clean "$@"
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        usage
        ;;
esac