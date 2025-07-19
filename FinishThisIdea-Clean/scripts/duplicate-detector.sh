#!/bin/bash
# duplicate-detector.sh - Real-time duplicate file monitoring and prevention

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUPLICATE_DB="$PROJECT_ROOT/.duplicate-tracking/duplicates.db"
HASH_CACHE="$PROJECT_ROOT/.duplicate-tracking/hashes.cache"

# Create tracking directory
mkdir -p "$(dirname "$DUPLICATE_DB")"

# Function to calculate file hash
calculate_hash() {
    local file="$1"
    if command -v md5sum >/dev/null 2>&1; then
        md5sum "$file" | cut -d' ' -f1
    elif command -v md5 >/dev/null 2>&1; then
        md5 -q "$file"
    else
        # Fallback to shasum
        shasum -a 256 "$file" | cut -d' ' -f1
    fi
}

# Find all duplicates in project
find_duplicates() {
    echo -e "${BLUE}Scanning for duplicate files...${NC}"
    
    local temp_hashes=$(mktemp)
    local duplicates_found=0
    
    # Find all files (excluding common directories)
    find "$PROJECT_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/.next/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" \
        -not -path "*/.duplicate-tracking/*" \
        -not -path "*/.agent-*/*" \
        -not -name "*.log" \
        -not -name ".DS_Store" | while read -r file; do
        
        # Skip binary files
        if file "$file" | grep -q "text"; then
            hash=$(calculate_hash "$file")
            echo "$hash $file" >> "$temp_hashes"
        fi
    done
    
    # Sort and find duplicates
    sort "$temp_hashes" | awk '{
        if ($1 == prev_hash) {
            if (!printed_prev) {
                print prev_file
                printed_prev = 1
            }
            print $0
            dup_count++
        } else {
            printed_prev = 0
        }
        prev_hash = $1
        prev_file = $0
    } END {
        if (dup_count > 0) {
            print "\n" dup_count " duplicate groups found"
        }
    }' > "$DUPLICATE_DB"
    
    # Display results
    if [ -s "$DUPLICATE_DB" ]; then
        echo -e "${RED}Duplicates found:${NC}"
        echo
        
        local current_hash=""
        while IFS=' ' read -r hash filepath; do
            if [ "$current_hash" != "$hash" ]; then
                if [ -n "$current_hash" ]; then
                    echo  # New line between groups
                fi
                echo -e "${YELLOW}Duplicate group (hash: ${hash:0:8}...):${NC}"
                current_hash="$hash"
            fi
            echo "  - ${filepath#$PROJECT_ROOT/}"
        done < "$DUPLICATE_DB"
        
        duplicates_found=1
    else
        echo -e "${GREEN}No duplicates found!${NC}"
    fi
    
    rm -f "$temp_hashes"
    return $duplicates_found
}

# Check for content similarity (not just exact duplicates)
find_similar_files() {
    echo -e "${BLUE}Checking for similar files...${NC}"
    
    # Find files with similar names
    find "$PROJECT_ROOT" -type f -name "*.md" -o -name "*.ts" -o -name "*.js" | \
        sed 's/.*\///' | sort | uniq -d | while read -r filename; do
        
        echo -e "${YELLOW}Files with same name: $filename${NC}"
        find "$PROJECT_ROOT" -name "$filename" -type f | while read -r filepath; do
            echo "  - ${filepath#$PROJECT_ROOT/}"
        done
        echo
    done
    
    # Check for similar documentation files
    local doc_files=$(find "$PROJECT_ROOT/docs" -name "*.md" 2>/dev/null | sort)
    if [ -n "$doc_files" ]; then
        echo -e "${BLUE}Checking documentation consistency...${NC}"
        
        # Look for similar titles
        for file in $doc_files; do
            title=$(grep -m1 "^# " "$file" 2>/dev/null | sed 's/^# //')
            if [ -n "$title" ]; then
                similar=$(grep -l "^# $title$" $doc_files | grep -v "$file")
                if [ -n "$similar" ]; then
                    echo -e "${YELLOW}Duplicate title '$title' found in:${NC}"
                    echo "  - ${file#$PROJECT_ROOT/}"
                    echo "$similar" | while read -r dup; do
                        echo "  - ${dup#$PROJECT_ROOT/}"
                    done
                    echo
                fi
            fi
        done
    fi
}

# Auto-fix duplicates
auto_fix_duplicates() {
    if [ ! -s "$DUPLICATE_DB" ]; then
        echo -e "${GREEN}No duplicates to fix${NC}"
        return
    fi
    
    echo -e "${BLUE}Auto-fixing duplicates...${NC}"
    
    local current_hash=""
    local primary_file=""
    local files_to_remove=()
    
    while IFS=' ' read -r hash filepath; do
        if [ "$current_hash" != "$hash" ]; then
            # New group - first file becomes primary
            current_hash="$hash"
            primary_file="$filepath"
        else
            # Duplicate - determine which to keep
            local primary_date=$(stat -f "%m" "$primary_file" 2>/dev/null || stat -c "%Y" "$primary_file")
            local current_date=$(stat -f "%m" "$filepath" 2>/dev/null || stat -c "%Y" "$filepath")
            
            if [ "$current_date" -gt "$primary_date" ]; then
                # Current file is newer, make it primary
                files_to_remove+=("$primary_file")
                primary_file="$filepath"
            else
                # Primary is newer or same age
                files_to_remove+=("$filepath")
            fi
        fi
    done < "$DUPLICATE_DB"
    
    # Confirm removal
    if [ ${#files_to_remove[@]} -gt 0 ]; then
        echo -e "${YELLOW}Files to be removed:${NC}"
        for file in "${files_to_remove[@]}"; do
            echo "  - ${file#$PROJECT_ROOT/}"
        done
        
        echo
        read -p "Remove these duplicate files? (y/N) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for file in "${files_to_remove[@]}"; do
                rm -f "$file"
                echo -e "${GREEN}Removed: ${file#$PROJECT_ROOT/}${NC}"
            done
            
            # Clear duplicate database
            > "$DUPLICATE_DB"
        fi
    fi
}

# Monitor mode - watch for new duplicates
monitor_mode() {
    echo -e "${BLUE}Starting duplicate monitoring...${NC}"
    echo "Press Ctrl+C to stop"
    echo
    
    # Initial scan
    find_duplicates
    
    # Create hash cache
    find "$PROJECT_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -name "*.log" | while read -r file; do
        if file "$file" | grep -q "text"; then
            hash=$(calculate_hash "$file")
            echo "$hash $file"
        fi
    done > "$HASH_CACHE"
    
    # Monitor for changes
    if command -v fswatch >/dev/null 2>&1; then
        # Use fswatch if available
        fswatch -o "$PROJECT_ROOT" --exclude "node_modules" --exclude ".git" | while read num; do
            echo -e "${YELLOW}Change detected, checking for duplicates...${NC}"
            find_duplicates
        done
    else
        # Fallback to polling
        while true; do
            sleep 10
            
            # Check for new files
            local new_count=$(find "$PROJECT_ROOT" -type f -newer "$HASH_CACHE" 2>/dev/null | wc -l)
            if [ "$new_count" -gt 0 ]; then
                echo -e "${YELLOW}$new_count file(s) changed, checking for duplicates...${NC}"
                find_duplicates
                
                # Update cache
                find "$PROJECT_ROOT" -type f \
                    -not -path "*/node_modules/*" \
                    -not -path "*/.git/*" \
                    -not -name "*.log" | while read -r file; do
                    if file "$file" | grep -q "text"; then
                        hash=$(calculate_hash "$file")
                        echo "$hash $file"
                    fi
                done > "$HASH_CACHE"
            fi
        done
    fi
}

# Generate duplicate report
generate_report() {
    echo -e "${BLUE}=== Duplicate Detection Report ===${NC}"
    echo "Generated: $(date)"
    echo
    
    # Run detection
    find_duplicates >/dev/null
    
    if [ -s "$DUPLICATE_DB" ]; then
        # Count duplicates
        local dup_groups=$(awk '{print $1}' "$DUPLICATE_DB" | sort -u | wc -l)
        local total_dups=$(wc -l < "$DUPLICATE_DB")
        local wasted_space=0
        
        # Calculate wasted space
        while IFS=' ' read -r hash filepath; do
            if [ -f "$filepath" ]; then
                size=$(stat -f "%z" "$filepath" 2>/dev/null || stat -c "%s" "$filepath")
                wasted_space=$((wasted_space + size))
            fi
        done < "$DUPLICATE_DB"
        
        # Subtract size of one file per group (keeping one)
        # This is approximate
        wasted_space=$((wasted_space * (dup_groups - 1) / dup_groups))
        
        echo -e "${RED}Duplicate Summary:${NC}"
        echo "  Duplicate groups: $dup_groups"
        echo "  Total duplicate files: $total_dups"
        echo "  Wasted space: $(numfmt --to=iec-i --suffix=B $wasted_space 2>/dev/null || echo "${wasted_space} bytes")"
        echo
        
        # Show worst offenders
        echo -e "${YELLOW}Most duplicated files:${NC}"
        awk '{print $1}' "$DUPLICATE_DB" | sort | uniq -c | sort -rn | head -5 | while read count hash; do
            echo "  $count copies:"
            grep "^$hash " "$DUPLICATE_DB" | head -1 | while IFS=' ' read -r h filepath; do
                echo "    $(basename "$filepath")"
            done
        done
    else
        echo -e "${GREEN}No duplicates found!${NC}"
    fi
    
    echo
    
    # Check for similar files too
    find_similar_files
}

# Main command handling
case "${1:-}" in
    "scan")
        find_duplicates
        ;;
    "fix")
        find_duplicates
        auto_fix_duplicates
        ;;
    "similar")
        find_similar_files
        ;;
    "monitor")
        monitor_mode
        ;;
    "report")
        generate_report
        ;;
    "clean")
        # Clean tracking files
        rm -rf "$(dirname "$DUPLICATE_DB")"
        echo -e "${GREEN}Duplicate tracking cleaned${NC}"
        ;;
    *)
        echo -e "${BLUE}Duplicate Detector for FinishThisIdea${NC}"
        echo
        echo "Usage: $0 <command>"
        echo
        echo "Commands:"
        echo "  scan      Scan for duplicate files"
        echo "  fix       Auto-fix duplicates (interactive)"
        echo "  similar   Find files with similar names/content"
        echo "  monitor   Real-time monitoring mode"
        echo "  report    Generate detailed report"
        echo "  clean     Clean tracking database"
        echo
        exit 1
        ;;
esac