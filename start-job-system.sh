#!/bin/bash

# 🚀 Start Job Application System with Enhanced Anti-Bot Detection
# This script starts all required services for the job application system

echo "🎯 Starting Job Application System..."
echo "══════════════════════════════════════"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: No AI API keys found. The system will use demo mode."
    echo "   Set OPENAI_API_KEY or ANTHROPIC_API_KEY for full functionality."
    echo ""
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p mcp/logs mcp/exports mcp/uploads

# Pull required Ollama models if Ollama is running
echo "🤖 Checking Ollama models..."
if docker-compose ps | grep -q "ollama.*running"; then
    echo "   Pulling required models..."
    docker-compose exec -T ollama ollama pull mistral 2>/dev/null || true
    docker-compose exec -T ollama ollama pull codellama:7b 2>/dev/null || true
else
    echo "   Ollama not running yet, models will be pulled on first start"
fi

# Build the template processor with Puppeteer support
echo "🔨 Building template processor with Puppeteer support..."
docker-compose build template-processor

# Start core services first
echo "🚀 Starting core services..."
docker-compose up -d postgres redis minio ollama

# Wait for core services to be healthy
echo "⏳ Waiting for core services to be ready..."
sleep 10

# Start application services
echo "🌟 Starting application services..."
docker-compose up -d template-processor ai-api

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
echo ""

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "⚠️  $name is not responding yet (may still be starting)"
    fi
}

# Check each service
check_service "Template Processor" "http://localhost:3000/health"
check_service "AI API Service" "http://localhost:3001/health"
check_service "Ollama" "http://localhost:11434/api/tags"

echo ""
echo "══════════════════════════════════════"
echo "🎉 Job Application System is starting!"
echo ""
echo "📍 Access Points:"
echo "   • Web Interface: http://localhost:3000/job-demo"
echo "   • API Gateway: http://localhost:3000"
echo "   • WebSocket: ws://localhost:8081"
echo ""
echo "📝 Quick Test:"
echo "   1. Open http://localhost:3000/job-demo in your browser"
echo "   2. Enter a job URL or paste a job description"
echo "   3. Click 'Process Job Application'"
echo ""
echo "🔍 View Logs:"
echo "   docker-compose logs -f template-processor"
echo ""
echo "🛑 Stop Services:"
echo "   docker-compose down"
echo ""

# Optional: Open browser
if command -v open &> /dev/null; then
    echo "🌐 Opening web interface in browser..."
    sleep 2
    open "http://localhost:3000/job-demo"
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Opening web interface in browser..."
    sleep 2
    xdg-open "http://localhost:3000/job-demo"
fi