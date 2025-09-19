#!/bin/bash

# 🛑 Stop SoulFRA API Services

echo "🛑 Stopping SoulFRA API Services..."
echo "=================================="

# Kill processes on ports 3001 and 3002
echo "🔄 Stopping Brand Consultation API (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   No process found on port 3001"

echo "🔄 Stopping MVP Generation API (port 3002)..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "   No process found on port 3002"

# Also kill by process name if they exist
pkill -f "brand-consultation-api.js" 2>/dev/null || true
pkill -f "mvp-generation-api.js" 2>/dev/null || true

echo ""
echo "✅ All API services stopped"
echo "=========================="