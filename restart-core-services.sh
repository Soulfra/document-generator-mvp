#!/bin/bash

echo "🔄 Restarting core services for integration fix..."

# Kill existing processes on key ports
echo "  🛑 Stopping existing services..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8888 | xargs kill -9 2>/dev/null || true
lsof -ti:8899 | xargs kill -9 2>/dev/null || true

sleep 2

echo "  🚀 Starting patched services..."

# Start temporary auth service
node temp-auth-service.js &
echo "    ✅ Temporary auth service started (port 8899)"

# Start patched AI API service
node services/real-ai-api.js &
echo "    ✅ Patched AI API service started (port 3001)"

# Start system bus
node SYSTEM-BUS-INTEGRATION-FIX.js &
echo "    ✅ System bus started (port 8899)"

sleep 3

echo ""
echo "✅ Core services restarted with integration fixes!"
echo "📍 System Bus Dashboard: http://localhost:8899"
echo "🔍 Test the integration: curl -X POST http://localhost:8899/api/test-flow"
echo ""
