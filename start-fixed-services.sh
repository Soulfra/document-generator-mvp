#!/bin/bash

echo "🚀 Starting Fixed Document Processing Services"
echo "==========================================="

# Kill any existing empire API on port 8090
echo "🛑 Stopping existing services..."
lsof -ti:8090 | xargs kill -9 2>/dev/null || true
lsof -ti:8091 | xargs kill -9 2>/dev/null || true

# Start the fixed empire API bridge
echo "🏰 Starting fixed Empire API Bridge on port 8090..."
node empire-api-bridge-fixed.js &
EMPIRE_PID=$!

# Give it time to start
sleep 2

# Start the document processing fix service
echo "🔧 Starting Document Processing Fix service on port 8091..."
node fix-document-processing-flow.js &
FIX_PID=$!

# Give services time to initialize
sleep 3

echo ""
echo "✅ Services started!"
echo "  - Empire API Bridge (fixed): http://localhost:8090"
echo "  - Document Processing Fix: http://localhost:8091"
echo ""
echo "PIDs:"
echo "  - Empire API: $EMPIRE_PID"
echo "  - Fix Service: $FIX_PID"
echo ""
echo "To stop services: kill $EMPIRE_PID $FIX_PID"
echo ""

# Run integration test to verify fix
echo "🧪 Running integration test to verify fix..."
sleep 2

node full-system-integration-test.js

# Keep script running
wait