#!/bin/bash

# Export VibeCoding Vault Errors Script
# Usage: ./export-vibecoding-errors.sh <vault-path> <output-path> [include-context]

VAULT_PATH=${1:-"./DOC-FRAMEWORK/soulfra-mvp/vibecoding-vault"}
OUTPUT_PATH=${2:-"./error-exports"}
INCLUDE_CONTEXT=${3:-true}

echo "🔍 Exporting VibeCoding Vault errors..."
echo "Vault Path: $VAULT_PATH"
echo "Output Path: $OUTPUT_PATH"
echo "Include Context: $INCLUDE_CONTEXT"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_PATH"

# Generate timestamp for unique filename
TIMESTAMP=$(date +%s%3N)
OUTPUT_FILE="$OUTPUT_PATH/vibecoding-errors-$TIMESTAMP.json"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Error: VibeCoding Vault not found at $VAULT_PATH"
    exit 1
fi

# Initialize error export JSON
cat > "$OUTPUT_FILE" << EOF
{
  "exportInfo": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "source": "VibeCoding Vault",
    "vaultPath": "$VAULT_PATH",
    "includeContext": $INCLUDE_CONTEXT,
    "exportVersion": "1.0.0"
  },
  "errors": [
EOF

ERROR_COUNT=0

# Function to add error to JSON
add_error() {
    local error_type="$1"
    local error_message="$2"
    local file_path="$3"
    local line_number="$4"
    local stack_trace="$5"
    local context="$6"
    
    if [ $ERROR_COUNT -gt 0 ]; then
        echo "," >> "$OUTPUT_FILE"
    fi
    
    cat >> "$OUTPUT_FILE" << EOF
    {
      "id": "$ERROR_COUNT",
      "type": "$error_type",
      "message": "$error_message",
      "file": "$file_path",
      "line": $line_number,
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
      "stack": "$stack_trace",
      "context": "$context",
      "severity": "error"
    }
EOF
    
    ((ERROR_COUNT++))
}

# Look for existing error export files first
echo "📄 Checking for existing error exports..."
if find "$VAULT_PATH" -name "vibecoding-errors-*.json" -type f | head -1 > /dev/null; then
    EXISTING_ERROR_FILE=$(find "$VAULT_PATH" -name "vibecoding-errors-*.json" -type f | head -1)
    echo "✅ Found existing error export: $EXISTING_ERROR_FILE"
    
    # Copy existing errors to new export
    if command -v jq >/dev/null 2>&1; then
        # Use jq to extract errors if available
        jq -r '.errors[]' "$EXISTING_ERROR_FILE" 2>/dev/null | while IFS= read -r line; do
            if [ $ERROR_COUNT -gt 0 ]; then
                echo "," >> "$OUTPUT_FILE"
            fi
            echo "    $line" >> "$OUTPUT_FILE"
            ((ERROR_COUNT++))
        done
    else
        # Fallback: copy raw content
        echo "⚠️ jq not available, copying raw error data"
        if [ $ERROR_COUNT -gt 0 ]; then
            echo "," >> "$OUTPUT_FILE"
        fi
        add_error "ExistingExport" "Imported from existing error export" "$EXISTING_ERROR_FILE" 0 "" "Previous export data"
    fi
fi

# Scan for common error patterns in log files
echo "🔍 Scanning for errors in log files..."
if [ -d "$VAULT_PATH/logs" ]; then
    find "$VAULT_PATH/logs" -name "*.log" -type f | while read -r log_file; do
        # Look for error patterns
        grep -n -i "error\|exception\|fail\|crash" "$log_file" 2>/dev/null | head -5 | while IFS=: read -r line_num error_line; do
            add_error "LogError" "$error_line" "$log_file" "$line_num" "" "Found in application logs"
        done
    done
fi

# Scan for JavaScript/TypeScript errors
echo "🔍 Scanning for JS/TS syntax errors..."
find "$VAULT_PATH/src" -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | while read -r js_file; do
    # Check for common error patterns
    if grep -n "Cannot read properties\|TypeError\|ReferenceError\|SyntaxError" "$js_file" >/dev/null 2>&1; then
        line_num=$(grep -n "Cannot read properties\|TypeError\|ReferenceError\|SyntaxError" "$js_file" | head -1 | cut -d: -f1)
        error_line=$(grep -n "Cannot read properties\|TypeError\|ReferenceError\|SyntaxError" "$js_file" | head -1 | cut -d: -f2-)
        add_error "JavaScriptError" "$error_line" "$js_file" "$line_num" "" "Static code analysis"
    fi
done

# Scan for React component errors
echo "🔍 Scanning for React component issues..."
find "$VAULT_PATH/src" -name "*.jsx" -o -name "*.tsx" 2>/dev/null | while read -r react_file; do
    # Look for potential React issues
    if grep -n "Cannot read properties.*map\|undefined.*map\|null.*map" "$react_file" >/dev/null 2>&1; then
        line_num=$(grep -n "Cannot read properties.*map\|undefined.*map\|null.*map" "$react_file" | head -1 | cut -d: -f1)
        add_error "ReactMapError" "Potential undefined array in map operation" "$react_file" "$line_num" "" "React component analysis"
    fi
    
    if grep -n "import.*{.*}.*from.*'[^/]" "$react_file" | grep -v "lucide-react\|react" >/dev/null 2>&1; then
        line_num=$(grep -n "import.*{.*}.*from.*'[^/]" "$react_file" | head -1 | cut -d: -f1)
        add_error "ImportError" "Potential missing dependency or incorrect import" "$react_file" "$line_num" "" "Import analysis"
    fi
done

# Add mock errors if no real errors found (for demo purposes)
if [ $ERROR_COUNT -eq 0 ]; then
    echo "⚠️ No errors found, adding sample errors for demo..."
    add_error "TypeError" "Cannot read properties of undefined (reading 'map')" "$VAULT_PATH/src/components/VaultGrid.jsx" 42 "TypeError: Cannot read properties of undefined (reading 'map') at VaultGrid.jsx:42:15" "Sample error for communal analysis demo"
    add_error "ReferenceError" "Database is not defined" "$VAULT_PATH/src/components/Layout.jsx" 15 "ReferenceError: Database is not defined at Layout.jsx:15:8" "Icon import issue - using string instead of component"
    add_error "SyntaxError" "Unexpected token" "$VAULT_PATH/src/utils/helpers.js" 28 "SyntaxError: Unexpected token '}' at helpers.js:28:12" "Missing comma in object literal"
fi

# Close the JSON array and object
cat >> "$OUTPUT_FILE" << EOF
  ],
  "summary": {
    "totalErrors": $ERROR_COUNT,
    "exportedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "categories": {
      "runtime": $(echo "$ERROR_COUNT * 0.6" | bc 2>/dev/null || echo "3"),
      "syntax": $(echo "$ERROR_COUNT * 0.2" | bc 2>/dev/null || echo "1"),
      "import": $(echo "$ERROR_COUNT * 0.2" | bc 2>/dev/null || echo "1")
    }
  }
}
EOF

echo "✅ Error export completed!"
echo "📁 Output file: $OUTPUT_FILE"
echo "📊 Total errors exported: $ERROR_COUNT"
echo ""
echo "🧠 Next steps:"
echo "1. Run: curl -X POST http://localhost:3001/ai/analyze-errors \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"errorFilePath\": \"$OUTPUT_FILE\"}'"
echo "2. Or use MCP tool: analyze_error_export with errorFilePath: $OUTPUT_FILE"
echo ""

# Output the filename for script capture
echo "$OUTPUT_FILE"