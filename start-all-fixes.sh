#!/bin/bash

echo "🚀 Starting All Document Generator Fixes"
echo "======================================="
echo ""

# Kill any existing services on our ports
echo "🛑 Stopping existing services..."
lsof -ti:8090 | xargs kill -9 2>/dev/null || true
lsof -ti:8091 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3012 | xargs kill -9 2>/dev/null || true

echo ""
echo "🔧 Starting fixed services..."
echo ""

# Start the fixed empire API bridge
echo "1️⃣  Starting Empire API Bridge (fixed) on port 8090..."
node empire-api-bridge-fixed.js &
EMPIRE_PID=$!
sleep 2

# Start the document processing fix service
echo "2️⃣  Starting Document Processing Fix on port 8091..."
node fix-document-processing-flow.js &
DOC_FIX_PID=$!
sleep 2

# Start the AI service fallback fix
echo "3️⃣  Starting AI Service Fallback Fix on port 3001..."
node fix-ai-service-fallback.js &
AI_FIX_PID=$!
sleep 2

# Start the end-to-end journey fix
echo "4️⃣  Starting End-to-End Journey Fix on port 3012..."
node fix-end-to-end-journey.js &
JOURNEY_PID=$!
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Service Endpoints:"
echo "  - Empire API Bridge: http://localhost:8090"
echo "  - Document Processing: http://localhost:8091"
echo "  - AI Service: http://localhost:3001"
echo "  - Blockchain/Journey: http://localhost:3012"
echo ""
echo "🔧 Process IDs:"
echo "  - Empire API: $EMPIRE_PID"
echo "  - Document Fix: $DOC_FIX_PID"
echo "  - AI Service: $AI_FIX_PID"
echo "  - Journey Fix: $JOURNEY_PID"
echo ""
echo "To stop all services: kill $EMPIRE_PID $DOC_FIX_PID $AI_FIX_PID $JOURNEY_PID"
echo ""

# Wait a moment for all services to fully initialize
sleep 2

# Run integration test to verify all fixes
echo "🧪 Running integration test to verify all fixes..."
echo "================================================"
echo ""

node full-system-integration-test.js

# Keep script running
echo ""
echo "Services will continue running. Press Ctrl+C to stop all services."
trap "kill $EMPIRE_PID $DOC_FIX_PID $AI_FIX_PID $JOURNEY_PID 2>/dev/null; exit" INT
wait