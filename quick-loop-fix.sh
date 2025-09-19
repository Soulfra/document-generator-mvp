#!/bin/bash

# 🚑 QUICK LOOP FIX
# =================
# Emergency loop breaker for immediate relief

echo "🚑 QUICK LOOP FIX ACTIVATED"
echo "=========================="

# Stop any running processes that might be in loops
echo "🛑 Stopping potentially looping processes..."

# Kill any node processes that might be stuck
pkill -f "node.*visual-reasoning"
pkill -f "node.*block-world"
pkill -f "node.*xml-schema"
pkill -f "node.*reality-"

echo "   ✅ Processes stopped"

# Clear any temporary files that might cause loops
echo "🗑️ Clearing temporary loop-causing files..."
rm -f .*.tmp
rm -f *.loop
rm -f loop-*.json

echo "   ✅ Temporary files cleared"

# Create loop prevention flag
echo "🔒 Creating loop prevention flags..."
touch .loop-prevention-active
echo "$(date): Loop breaker activated" > loop-breaker.log

echo "   ✅ Prevention flags set"

echo ""
echo "🎯 LOOP BREAK COMPLETE"
echo "====================="
echo "✅ Emergency loop breaking measures applied"
echo "🔄 Safe to restart your systems now"
echo "📝 Check loop-breaker.log for details"
echo ""
