#!/bin/bash

# Document Generator - WASM-Protected Startup Script
# Addresses Claude Code CLI WASM runtime errors

set -e

echo "🚀 Starting Document Generator with WASM Protection..."

# Initialize WASM error handler first
echo "🛡️  Initializing WASM Error Handler..."
node wasm-error-handler.js &
WASM_HANDLER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    kill $WASM_HANDLER_PID 2>/dev/null || true
    docker-compose down || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Set environment variables for WASM stability
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"
export WASM_BINARY_FILE=""
export DISABLE_WASM_STACK_TRACES=1

# Check if docker-compose.yml is valid
echo "🔍 Validating Docker Compose configuration..."
docker-compose config > /dev/null || {
    echo "❌ Docker Compose configuration invalid"
    exit 1
}

# Start services in stages to avoid WASM conflicts
echo "📊 Starting infrastructure services..."
docker-compose up -d postgres redis minio

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
for service in postgres redis minio; do
    if ! docker-compose ps $service | grep -q "healthy\|Up"; then
        echo "❌ Service $service is not healthy"
        docker-compose logs $service
        exit 1
    fi
done

echo "🤖 Starting AI services..."
docker-compose up -d ollama

# Wait for Ollama to initialize
echo "⏳ Waiting for Ollama to start..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is ready"
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Ollama failed to start within timeout"
    docker-compose logs ollama
    exit 1
fi

echo "🔄 Starting core services..."
docker-compose up -d template-processor ai-api

# Wait for core services
echo "⏳ Waiting for core services..."
sleep 15

# Check core service health
for service in template-processor ai-api; do
    port=$(docker-compose port $service | cut -d: -f2 2>/dev/null || echo "")
    if [ -n "$port" ]; then
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            echo "✅ $service is ready on port $port"
        else
            echo "⚠️  $service health check failed on port $port"
            docker-compose logs --tail=20 $service
        fi
    fi
done

echo "🌐 Starting remaining services..."
docker-compose up -d

echo "📋 Service Status:"
docker-compose ps

echo "🎯 Available Services:"
echo "  📝 Template Processor: http://localhost:3000"
echo "  🤖 AI API Service: http://localhost:3001" 
echo "  📊 Analytics: http://localhost:3002"
echo "  🎮 Platform Hub: http://localhost:8080"
echo "  🔮 Ollama: http://localhost:11434"
echo "  💾 PostgreSQL: localhost:5432"
echo "  🔄 Redis: localhost:6379"
echo "  📦 MinIO: http://localhost:9000"

echo "✅ Document Generator started successfully with WASM protection!"
echo "🛡️  WASM Error Handler running in background (PID: $WASM_HANDLER_PID)"

# Wait for user interrupt
echo "Press Ctrl+C to stop all services..."
wait $WASM_HANDLER_PID