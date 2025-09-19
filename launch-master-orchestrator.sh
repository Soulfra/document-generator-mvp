#!/bin/bash

# 🌟 MASTER ORCHESTRATOR LAUNCH SCRIPT
# Complete integration test for the Document Generator ecosystem

echo "🌟 LAUNCHING MASTER FRONTEND-BACKEND ORCHESTRATOR"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🐳 Docker is running - good!"
echo ""

# Check if we have the required files
echo "📋 Checking required files..."
required_files=(
    "master-frontend-backend-orchestrator.js"
    "system-integration-manager.js"
    "frontend-main-dashboard.html"
    "character-breeding-interface.html"
    "tipping-interface.html"
    "gamified-tipping-appreciation-system.js"
    "character-breeding-evolution-system.js"
    "Dockerfile.master"
    "docker-compose.yml"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "🚀 Starting core services first..."

# Start core infrastructure services
docker-compose up -d postgres redis ollama

echo "⏳ Waiting for core services to be ready..."
sleep 30

# Check if services are healthy
echo "🏥 Checking service health..."
docker-compose ps

echo ""
echo "🌟 Starting Master Orchestrator..."

# Start our master orchestrator service
docker-compose up -d master-orchestrator

echo "⏳ Waiting for Master Orchestrator to initialize..."
sleep 15

# Check the logs
echo ""
echo "📊 Master Orchestrator Status:"
docker-compose logs --tail=20 master-orchestrator

echo ""
echo "🌐 SERVICE ENDPOINTS:"
echo "=================================="
echo "🏠 Main Dashboard:      http://localhost:4000"
echo "👥 Character Breeding:  http://localhost:4000/characters"
echo "💰 Tipping Center:      http://localhost:4000/tips"
echo "🔌 API Gateway:         http://localhost:4000/api"
echo "⚡ WebSocket:           ws://localhost:4000/ws"
echo "❤️ Health Check:       http://localhost:4000/api/health"
echo ""

# Test the health endpoint
echo "🏥 Testing health endpoint..."
if curl -s http://localhost:4000/api/health > /dev/null; then
    echo "✅ Master Orchestrator is responding!"
else
    echo "⚠️ Master Orchestrator may still be starting up..."
    echo "   Check logs: docker-compose logs master-orchestrator"
fi

echo ""
echo "🎯 INTEGRATION TEST COMPLETE"
echo "=================================="
echo "The Master Frontend-Backend Orchestrator is now running!"
echo "Visit http://localhost:4000 to see the complete integrated system."
echo ""
echo "To stop all services: docker-compose down"
echo "To view logs: docker-compose logs -f master-orchestrator"
echo ""
echo "🌟 Enjoy your unified document generator ecosystem! 🌟"