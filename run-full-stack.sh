#!/bin/bash

# Full Stack Document Generator with Streaming, QR Codes, and Blockchain
# Runs everything: Docker services, streaming system, and Chrome native app

echo "🚀 DOCUMENT GENERATOR FULL STACK"
echo "================================"
echo "✨ Color-coded streaming"
echo "📱 QR code generation"
echo "🦀 Rust compilation"
echo "💎 Solidity deployment"
echo "🐍 Flask APIs"
echo "🐳 Docker containers"
echo "🌐 Chrome native desktop"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

MODE=${1:-all}

case $MODE in
    docker)
        echo "🐳 Starting Docker services only..."
        docker-compose up -d
        echo ""
        echo "✅ Services running:"
        echo "  PostgreSQL: localhost:5432"
        echo "  Redis: localhost:6379"
        echo "  MinIO: localhost:9000 (console: localhost:9001)"
        echo "  Ollama: localhost:11434"
        echo "  Template Processor: localhost:3000"
        echo "  AI API: localhost:3001"
        echo "  Platform Hub: localhost:8080"
        echo "  Prometheus: localhost:9090"
        echo "  Grafana: localhost:3003"
        ;;
        
    streaming)
        echo "🌈 Starting streaming system only..."
        node integrated-streaming-system.js &
        STREAMING_PID=$!
        echo "Streaming system PID: $STREAMING_PID"
        echo ""
        echo "✅ Streaming services:"
        echo "  HTTP API: http://localhost:8917"
        echo "  WebSocket: ws://localhost:8918"
        echo ""
        echo "Press Ctrl+C to stop..."
        wait $STREAMING_PID
        ;;
        
    electron)
        echo "⚡ Starting Electron Chrome native only..."
        npm run electron-chrome
        ;;
        
    all)
        echo "🎯 Starting full stack..."
        echo ""
        
        # Start Docker services
        echo "1️⃣ Starting Docker services..."
        docker-compose up -d
        
        # Wait for services to be healthy
        echo "2️⃣ Waiting for services to be ready..."
        sleep 10
        
        # Check service health
        echo "3️⃣ Checking service health..."
        for service in postgres redis minio ollama; do
            if docker-compose ps $service | grep -q "healthy"; then
                echo "  ✅ $service is healthy"
            else
                echo "  ⚠️ $service may not be ready"
            fi
        done
        
        # Start streaming system
        echo "4️⃣ Starting streaming system..."
        node integrated-streaming-system.js &
        STREAMING_PID=$!
        sleep 3
        
        # Start Electron app
        echo "5️⃣ Starting Chrome native app..."
        npm run electron-chrome
        
        # Cleanup on exit
        echo ""
        echo "Shutting down..."
        kill $STREAMING_PID 2>/dev/null
        docker-compose down
        ;;
        
    stop)
        echo "🛑 Stopping all services..."
        pkill -f "node integrated-streaming-system.js"
        docker-compose down
        echo "✅ All services stopped"
        ;;
        
    logs)
        echo "📋 Showing Docker logs..."
        docker-compose logs -f
        ;;
        
    status)
        echo "📊 Service Status:"
        echo ""
        docker-compose ps
        echo ""
        
        # Check streaming system
        if pgrep -f "integrated-streaming-system.js" > /dev/null; then
            echo "✅ Streaming system is running"
        else
            echo "❌ Streaming system is not running"
        fi
        
        # Check ports
        echo ""
        echo "🔍 Port Status:"
        for port in 3000 3001 5432 6379 8080 8917 8918 9000 11434; do
            if lsof -i :$port > /dev/null 2>&1; then
                echo "  ✅ Port $port is in use"
            else
                echo "  ❌ Port $port is free"
            fi
        done
        ;;
        
    test)
        echo "🧪 Testing integrations..."
        echo ""
        
        # Test streaming WebSocket
        echo "Testing WebSocket connection..."
        node -e "
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:8918');
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            ws.send(JSON.stringify({ type: 'test', payload: { content: 'Hello' } }));
            setTimeout(() => process.exit(0), 1000);
        });
        ws.on('error', (e) => {
            console.log('❌ WebSocket error:', e.message);
            process.exit(1);
        });
        " || echo "❌ WebSocket test failed"
        
        # Test HTTP endpoints
        echo ""
        echo "Testing HTTP endpoints..."
        curl -s http://localhost:8917/stream/test > /dev/null && echo "✅ Streaming HTTP OK" || echo "❌ Streaming HTTP failed"
        curl -s http://localhost:3001/health > /dev/null && echo "✅ AI API OK" || echo "❌ AI API failed"
        ;;
        
    help)
        echo "Usage: ./run-full-stack.sh [mode]"
        echo ""
        echo "Modes:"
        echo "  all       - Start everything (default)"
        echo "  docker    - Start Docker services only"
        echo "  streaming - Start streaming system only"
        echo "  electron  - Start Electron app only"
        echo "  stop      - Stop all services"
        echo "  logs      - Show Docker logs"
        echo "  status    - Show service status"
        echo "  test      - Test integrations"
        echo "  help      - Show this help"
        ;;
        
    *)
        echo "Unknown mode: $MODE"
        echo "Run './run-full-stack.sh help' for options"
        exit 1
        ;;
esac