#!/bin/bash

# Git Worktree Manager for Document Generator
# Simplifies worktree management and provides easy switching between development environments

WORKTREE_DIR="worktrees"
MAIN_DIR="/Users/matthewmauer/Desktop/Document-Generator"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to list all worktrees
list_worktrees() {
    print_info "Current Git Worktrees:"
    git worktree list
}

# Function to create a new feature worktree
create_feature() {
    if [ -z "$1" ]; then
        print_error "Please provide a feature name"
        echo "Usage: $0 create-feature <feature-name>"
        exit 1
    fi
    
    FEATURE_NAME="$1"
    BRANCH_NAME="feature-$FEATURE_NAME"
    WORKTREE_PATH="$WORKTREE_DIR/$BRANCH_NAME"
    
    print_info "Creating feature worktree: $BRANCH_NAME"
    
    # Create the worktree
    git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
    
    if [ $? -eq 0 ]; then
        print_success "Feature worktree created: $WORKTREE_PATH"
        print_info "To start working: cd $WORKTREE_PATH"
        
        # Create a development guide for this feature
        cat > "$WORKTREE_PATH/FEATURE-DEVELOPMENT.md" << EOF
# Feature Development: $FEATURE_NAME

This worktree is dedicated to developing the **$FEATURE_NAME** feature.

## Development Environment
- **Branch**: $BRANCH_NAME
- **Worktree Path**: $WORKTREE_PATH
- **Base Branch**: main ($(git rev-parse --short main))

## Quick Commands
\`\`\`bash
# Navigate to this worktree
cd $WORKTREE_PATH

# Run Document Generator services
docker-compose up -d

# Test your changes
npm test

# Build and verify
npm run build
\`\`\`

## When Ready to Merge
1. Commit your changes: \`git add . && git commit -m "feat: $FEATURE_NAME implementation"\`
2. Push to remote: \`git push -u origin $BRANCH_NAME\`
3. Create Pull Request targeting \`main\` branch
4. After merge, cleanup: \`../worktree-manager.sh remove $BRANCH_NAME\`

## Shared Resources
- Docker services are shared across all worktrees
- Database changes should be backwards compatible
- Test data is isolated per worktree

Created: $(date)
EOF
        
        print_success "Created development guide: $WORKTREE_PATH/FEATURE-DEVELOPMENT.md"
    else
        print_error "Failed to create feature worktree"
        exit 1
    fi
}

# Function to remove a worktree
remove_worktree() {
    if [ -z "$1" ]; then
        print_error "Please provide a worktree name"
        echo "Usage: $0 remove <worktree-name>"
        exit 1
    fi
    
    WORKTREE_NAME="$1"
    WORKTREE_PATH="$WORKTREE_DIR/$WORKTREE_NAME"
    
    if [ ! -d "$WORKTREE_PATH" ]; then
        print_error "Worktree not found: $WORKTREE_PATH"
        exit 1
    fi
    
    print_warning "Are you sure you want to remove worktree: $WORKTREE_NAME? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        # Check if worktree has uncommitted changes
        cd "$WORKTREE_PATH" || exit 1
        if ! git diff --quiet || ! git diff --cached --quiet; then
            print_warning "Worktree has uncommitted changes. Continue anyway? (y/N)"
            read -r confirm
            if [[ ! "$confirm" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                print_info "Removal cancelled"
                exit 0
            fi
        fi
        
        cd "$MAIN_DIR" || exit 1
        git worktree remove "$WORKTREE_PATH" --force
        
        # Also remove the branch if it exists
        if git show-ref --verify --quiet "refs/heads/$WORKTREE_NAME"; then
            print_info "Removing branch: $WORKTREE_NAME"
            git branch -D "$WORKTREE_NAME"
        fi
        
        print_success "Worktree removed: $WORKTREE_NAME"
    else
        print_info "Removal cancelled"
    fi
}

# Function to switch to a worktree (via cd hint)
switch_to() {
    if [ -z "$1" ]; then
        print_error "Please provide a worktree name"
        echo "Usage: $0 switch <worktree-name>"
        exit 1
    fi
    
    WORKTREE_NAME="$1"
    
    # Check if it's a direct worktree name
    if [ -d "$WORKTREE_DIR/$WORKTREE_NAME" ]; then
        WORKTREE_PATH="$WORKTREE_DIR/$WORKTREE_NAME"
    # Check if it's main
    elif [ "$WORKTREE_NAME" = "main" ]; then
        WORKTREE_PATH="$MAIN_DIR"
    else
        print_error "Worktree not found: $WORKTREE_NAME"
        print_info "Available worktrees:"
        git worktree list
        exit 1
    fi
    
    print_success "To switch to $WORKTREE_NAME worktree, run:"
    echo "cd $WORKTREE_PATH"
}

# Function to show worktree status
status() {
    print_info "Document Generator Worktree Status"
    echo
    
    print_info "All Worktrees:"
    git worktree list
    echo
    
    print_info "Current Location: $(pwd)"
    
    # Check if we're in a worktree
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$CURRENT_BRANCH" ]; then
        print_info "Current Branch: $CURRENT_BRANCH"
        
        # Show status of current worktree
        if [ -n "$(git status --porcelain)" ]; then
            print_warning "Current worktree has uncommitted changes:"
            git status --short
        else
            print_success "Current worktree is clean"
        fi
    fi
}

# Function to sync shared configs
sync_configs() {
    print_info "Syncing shared configurations across worktrees..."
    
    SHARED_FILES=(
        "package.json"
        "docker-compose.yml"
        ".env.example"
        "CLAUDE.md"
    )
    
    for worktree_path in "$WORKTREE_DIR"/*; do
        if [ -d "$worktree_path" ]; then
            worktree_name=$(basename "$worktree_path")
            print_info "Syncing to: $worktree_name"
            
            for file in "${SHARED_FILES[@]}"; do
                if [ -f "$MAIN_DIR/$file" ] && [ -f "$worktree_path/$file" ]; then
                    # Only sync if files are different
                    if ! cmp -s "$MAIN_DIR/$file" "$worktree_path/$file"; then
                        cp "$MAIN_DIR/$file" "$worktree_path/$file"
                        print_success "  Synced: $file"
                    fi
                fi
            done
        fi
    done
    
    print_success "Configuration sync completed"
}

# Main script logic
case "$1" in
    "list"|"ls")
        list_worktrees
        ;;
    "create-feature"|"feature")
        create_feature "$2"
        ;;
    "remove"|"rm")
        remove_worktree "$2"
        ;;
    "switch"|"cd")
        switch_to "$2"
        ;;
    "status"|"st")
        status
        ;;
    "sync")
        sync_configs
        ;;
    "help"|"--help"|"-h"|"")
        echo "Git Worktree Manager for Document Generator"
        echo
        echo "Usage: $0 <command> [arguments]"
        echo
        echo "Commands:"
        echo "  list, ls                 List all worktrees"
        echo "  create-feature <name>    Create new feature worktree"
        echo "  remove <name>            Remove a worktree"
        echo "  switch <name>            Show command to switch to worktree"
        echo "  status, st               Show worktree status"
        echo "  sync                     Sync shared configs across worktrees"
        echo "  help                     Show this help"
        echo
        echo "Examples:"
        echo "  $0 create-feature pdf-parser"
        echo "  $0 switch experimental"
        echo "  $0 remove feature-pdf-parser"
        echo
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac