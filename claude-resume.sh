#!/bin/bash

# 🔄 Claude CLI WASM Error Resume Script
# =====================================
# Quick recovery from WASM errors with context preservation

echo "🔄 Claude CLI WASM Error Recovery"
echo "=================================="

# Save current context
CONTEXT_DIR=".claude-recovery-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$CONTEXT_DIR"

echo "💾 Saving current context..."

# Save important files
for file in CLAUDE.md package.json .env README.md *.md; do
    if [[ -f "$file" ]]; then
        cp "$file" "$CONTEXT_DIR/" 2>/dev/null
        echo "   ✅ Saved: $file"
    fi
done

# Clean up memory-hogging files
echo "🧹 Cleaning up memory issues..."

# Remove large chat logs
find . -name "*.html" -size +50M -delete 2>/dev/null && echo "   ✅ Large HTML files removed"

# Clear temp files
rm -f *.tmp .*.tmp temp-*.* 2>/dev/null && echo "   ✅ Temp files cleared"

# Clear Node.js cache
rm -rf node_modules/.cache 2>/dev/null && echo "   ✅ Node cache cleared"

# Kill any stuck processes
echo "🛑 Stopping stuck processes..."
pkill -f "claude-code" 2>/dev/null && echo "   ✅ Claude processes stopped"

# Clear system caches that might cause WASM issues
echo "🔧 Clearing system caches..."
rm -rf ~/.cache/anthropic ~/.cache/claude /tmp/claude-* /tmp/v8-compile-cache* 2>/dev/null && echo "   ✅ System caches cleared"

# Force garbage collection if possible
if command -v node >/dev/null 2>&1; then
    node -e "if (global.gc) global.gc(); console.log('   ✅ Garbage collection forced');" --expose-gc 2>/dev/null || echo "   ⚠️  GC not available"
fi

echo ""
echo "✅ Recovery Complete!"
echo "===================="
echo "📍 Context saved to: $CONTEXT_DIR"
echo "💾 Working directory: $(pwd)"
echo "🕐 Recovery time: $(date)"
echo ""
echo "💡 Now you can safely restart Claude CLI:"
echo "   claude"
echo ""
echo "🔄 Or if you want to continue from where you left off:"
echo "   1. Start Claude CLI: claude"
echo "   2. Reference your saved context in: $CONTEXT_DIR"
echo "   3. Continue your work"
echo ""

# Create a quick reference file
cat > claude-recovery-info.md << EOF
# Claude CLI Recovery Info

**Recovery Date:** $(date)
**Working Directory:** $(pwd)
**Context Backup:** $CONTEXT_DIR

## What was cleaned up:
- Large HTML files (>50MB) removed
- Temporary files cleared
- Node.js cache cleared
- Claude processes stopped
- System caches cleared

## Next Steps:
1. Restart Claude CLI with: \`claude\`
2. Reference your context files from: $CONTEXT_DIR
3. Continue your work

## Files Backed Up:
$(ls -la "$CONTEXT_DIR" 2>/dev/null | grep -v '^total' | grep -v '^d' | awk '{print "- " $9}' || echo "- No files backed up")

## Memory Usage After Cleanup:
$(free -h 2>/dev/null || vm_stat | head -5 || echo "Memory info not available")
EOF

echo "📄 Recovery info saved to: claude-recovery-info.md"
echo ""
echo "🚀 Ready to restart Claude CLI!"