#!/bin/bash

# 🎯 UNIFIED ASSISTANT STARTUP SCRIPT
# Starts the unified natural language assistant for all your needs

echo "🎯 Starting Unified Assistant Orchestrator..."
echo "   Natural language queries for:"
echo "   - @cal AI reasoning"
echo "   - @biz arbitrage opportunities" 
echo "   - OSRS merchant data"
echo "   - Token cost tracking"
echo "   - Wiki integration"
echo ""

# Check if Cal Riven is running (optional)
if lsof -i :9999 >/dev/null 2>&1; then
    echo "✅ Cal Riven Executive detected on port 9999"
else
    echo "⚠️  Cal Riven not running - starting in standalone mode"
fi

# Start the unified assistant
node UNIFIED-ASSISTANT-ORCHESTRATOR.js

# Alternative: Run with PM2 for production
# pm2 start UNIFIED-ASSISTANT-ORCHESTRATOR.js --name "unified-assistant"