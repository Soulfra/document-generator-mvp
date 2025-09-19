#!/bin/bash

# START PERSONALIZATION SYSTEM
# Launches all AI orchestration and personalization components

set -e  # Exit on any error

echo "🚀 Starting AI Orchestration Personalization System..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check for existing AI router
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ AI Router already running on port 3000"
else
    echo "⚠️  AI Router not detected. Please start it first:"
    echo "   ./start-unified-system.sh"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down personalization system..."
    if [ ! -z "$CONTEXT_PID" ]; then
        kill $CONTEXT_PID 2>/dev/null || true
    fi
    if [ ! -z "$RAYTRACER_PID" ]; then
        kill $RAYTRACER_PID 2>/dev/null || true
    fi
    if [ ! -z "$ORCHESTRATOR_PID" ]; then
        kill $ORCHESTRATOR_PID 2>/dev/null || true
    fi
    if [ ! -z "$PERSONALIZER_PID" ]; then
        kill $PERSONALIZER_PID 2>/dev/null || true
    fi
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Context Matrix Engine
echo ""
echo "🧮 Starting Context Matrix Engine..."
node context-matrix-engine.js &
CONTEXT_PID=$!
echo "Context Matrix Engine PID: $CONTEXT_PID"

# Wait for initialization
sleep 3

# Start Ray Tracing Router
echo ""
echo "🌟 Starting Ray Tracing Router..."
node ray-tracing-router.js &
RAYTRACER_PID=$!
echo "Ray Tracing Router PID: $RAYTRACER_PID"

# Wait for initialization
sleep 3

# Start Personalization Orchestrator
echo ""
echo "🎯 Starting Personalization Orchestrator..."
node personalization-orchestrator.js &
ORCHESTRATOR_PID=$!
echo "Personalization Orchestrator PID: $ORCHESTRATOR_PID"

# Wait for initialization
sleep 3

# Start Dynamic Content Personalizer
echo ""
echo "🎨 Starting Dynamic Content Personalizer..."
node dynamic-content-personalizer.js &
PERSONALIZER_PID=$!
echo "Dynamic Content Personalizer PID: $PERSONALIZER_PID"

# Wait for all services to initialize
sleep 5

echo ""
echo "🎉 Personalization System is ready!"
echo "=================================================="
echo "📊 Context Matrix Engine:      Active"
echo "🌟 Ray Tracer Visualization:   http://localhost:8888"
echo "🎯 Orchestrator API:           http://localhost:4000"
echo "🔧 Orchestrator Health:        http://localhost:4000/health"
echo ""
echo "🧪 Test the system:"
echo '  curl -X POST http://localhost:4000/personalize \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"userId": "test", "content": {"type": "email", "data": {"subject": "Hello"}}}'"'"
echo ""
echo "📝 View logs:"
echo "  tail -f logs/personalization-orchestrator.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================================="

# Keep script running
wait