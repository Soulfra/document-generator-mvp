#!/bin/bash
# cleanup.sh - Remove duplicates and organize files according to S+ tier standards

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

echo -e "${BLUE}=== FinishThisIdea Cleanup Script ===${NC}"
echo -e "${BLUE}Enforcing S+ Tier Standards${NC}"
echo

# Change to project root
cd "$PROJECT_ROOT"

# Function to log actions
log_action() {
    echo -e "${GREEN}[CLEAN]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Find and handle duplicate README files
echo -e "${YELLOW}Checking for duplicate README files...${NC}"
DUPLICATE_READMES=$(find . -name "README*.md" -o -name "readme*.md" | grep -v node_modules | grep -v ".git")

if [ -n "$DUPLICATE_READMES" ]; then
    echo "Found README files:"
    echo "$DUPLICATE_READMES" | while read -r file; do
        echo "  - $file"
    done
    
    # Keep only the essential README files
    ALLOWED_READMES=(
        "./README.md"
        "./docs/README.md"
        "./templates/base-service/README.md"
        "./src/orchestration/browser-llm/README.md"
    )
    
    echo "$DUPLICATE_READMES" | while read -r file; do
        if [[ ! " ${ALLOWED_READMES[@]} " =~ " ${file} " ]]; then
            if [[ -f "$file" ]]; then
                # Check if it's a directory-specific README
                dir_name=$(dirname "$file")
                base_name=$(basename "$file")
                
                if [[ "$base_name" == "README.md" && "$dir_name" != "." ]]; then
                    # It's a subdirectory README - check if it has unique content
                    if [[ -f "$dir_name/../README.md" ]]; then
                        # Parent has README too - this might be duplicate
                        log_warning "Potential duplicate README: $file"
                        # Don't auto-delete, just warn
                    fi
                else
                    # Non-standard README name
                    log_warning "Non-standard README name: $file"
                fi
            fi
        fi
    done
fi

# 2. Clean up temporary and backup files
echo -e "${YELLOW}Removing temporary and backup files...${NC}"
TEMP_PATTERNS=(
    "*.tmp"
    "*.temp"
    "*.bak"
    "*.backup"
    "*.old"
    "*.swp"
    "*.swo"
    "*~"
    ".DS_Store"
    "Thumbs.db"
)

for pattern in "${TEMP_PATTERNS[@]}"; do
    find . -name "$pattern" -type f -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null && \
        log_action "Removed $pattern files" || true
done

# 3. Check for duplicate markdown files with same content
echo -e "${YELLOW}Checking for duplicate markdown files by content...${NC}"
# Use md5 on macOS, md5sum on Linux
if command -v md5sum >/dev/null 2>&1; then
    MD5_CMD="md5sum"
else
    MD5_CMD="md5 -r"
fi

find . -name "*.md" -type f -not -path "./node_modules/*" -not -path "./.git/*" -exec $MD5_CMD {} \; | \
    sort | awk '{print $1}' | uniq -d | while read -r checksum; do
    log_warning "Found files with duplicate content (checksum: $checksum)"
done

# 4. Organize untracked files
echo -e "${YELLOW}Checking for untracked files...${NC}"
UNTRACKED_COUNT=$(git ls-files --others --exclude-standard | wc -l)
if [ "$UNTRACKED_COUNT" -gt 0 ]; then
    log_warning "Found $UNTRACKED_COUNT untracked files"
    
    # Create a report of untracked files by type
    echo -e "\nUntracked files by type:"
    git ls-files --others --exclude-standard | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -10
fi

# 5. Check for files that should be in .gitignore
echo -e "${YELLOW}Checking for files that should be ignored...${NC}"
SHOULD_IGNORE=(
    "node_modules"
    ".env"
    "*.log"
    "dist"
    "build"
    "coverage"
    ".nyc_output"
    "*.sqlite"
    "*.db"
)

for pattern in "${SHOULD_IGNORE[@]}"; do
    if git ls-files --others --exclude-standard | grep -q "$pattern"; then
        log_warning "Found unignored files matching: $pattern"
    fi
done

# 6. Check for TODO/FIXME/XXX in code
echo -e "${YELLOW}Checking for TODO/FIXME/XXX markers...${NC}"
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . 2>/dev/null | wc -l || echo "0")

if [ "$TODO_COUNT" -gt 0 ]; then
    log_warning "Found $TODO_COUNT TODO/FIXME/XXX markers in code"
    echo "Run 'grep -r \"TODO\|FIXME\|XXX\" --include=\"*.ts\" --include=\"*.js\" .' to see them"
fi

# 7. Check directory structure compliance
echo -e "${YELLOW}Validating directory structure...${NC}"
REQUIRED_DIRS=(
    ".claude"
    ".mcp"
    "docs"
    "scripts"
    "src"
    "templates"
    "worktrees"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        log_error "Missing required directory: $dir"
    else
        log_action "✓ Found required directory: $dir"
    fi
done

# 8. Check for deeply nested directories (more than 3 levels)
echo -e "${YELLOW}Checking for deep nesting...${NC}"
find . -type d -not -path "./node_modules/*" -not -path "./.git/*" | \
    awk -F/ 'NF > 5 {print NF-1 " levels: " $0}' | sort -nr | head -5 | while read -r line; do
    log_warning "Deep nesting: $line"
done

# 9. Update memory system with cleanup results
echo -e "${YELLOW}Updating memory system...${NC}"
CLEANUP_DATE=$(date +"%Y-%m-%d %H:%M:%S")
cat >> .claude/memory.md << EOF

## Cleanup Run - $CLEANUP_DATE
- Untracked files: $UNTRACKED_COUNT
- TODO markers found: $TODO_COUNT
- Temporary files removed: Yes
- Structure validated: Yes
EOF
log_action "Memory system updated"

# 10. Generate cleanup report
echo -e "\n${BLUE}=== Cleanup Summary ===${NC}"
echo "Untracked files: $UNTRACKED_COUNT"
echo "TODO markers: $TODO_COUNT"
echo "Directory structure: Validated"
echo "Memory updated: ✓"

# Check if we're in a clean state
if [ "$UNTRACKED_COUNT" -eq 0 ] && [ "$TODO_COUNT" -eq 0 ]; then
    echo -e "\n${GREEN}✨ Project meets S+ tier standards!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some issues remain - review warnings above${NC}"
    exit 1
fi