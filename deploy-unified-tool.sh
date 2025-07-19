#!/bin/bash

# DEPLOY UNIFIED CHARACTER TOOL
# Single deployment script for the unified character tool

echo "🛠️🎭 DEPLOYING UNIFIED CHARACTER TOOL 🎭🛠️"
echo ""

# Make the tool executable
chmod +x unified-character-tool.js

echo "✅ Made unified-character-tool.js executable"

# Test the tool
echo ""
echo "🧪 Testing unified character tool..."
echo ""

# Test main menu
echo "📋 Testing main menu..."
node unified-character-tool.js

echo ""
echo "✅ Main menu test complete"

echo ""
echo "🎭 Testing character chat..."
node unified-character-tool.js chat ralph "Let's bash through this deployment!"

echo ""
echo "✅ Character chat test complete"

echo ""
echo "🔍 Testing character search..."
node unified-character-tool.js search alice patterns system-flows

echo ""
echo "✅ Character search test complete"

echo ""
echo "⚡ Testing character execution..."
node unified-character-tool.js execute bob build documentation

echo ""
echo "✅ Character execution test complete"

echo ""
echo "📊 Testing status..."
node unified-character-tool.js status all

echo ""
echo "✅ Status test complete"

echo ""
echo "🎮 Testing demo..."
node unified-character-tool.js demo

echo ""
echo "✅ Demo test complete"

echo ""
echo "🎭 UNIFIED CHARACTER TOOL DEPLOYMENT COMPLETE!"
echo ""
echo "📋 USAGE EXAMPLES:"
echo "   node unified-character-tool.js                          # Show main menu"
echo "   node unified-character-tool.js chat ralph \"message\"     # Chat with Ralph"
echo "   node unified-character-tool.js execute alice analyze    # Execute Alice's analysis"
echo "   node unified-character-tool.js search charlie security  # Search with Charlie"
echo "   node unified-character-tool.js status all               # View all status"
echo "   node unified-character-tool.js demo                     # Run demonstration"
echo ""
echo "🎭 All 7 characters ready in one unified tool!"
echo "⚡ Ralph executes, others search and specialize!"