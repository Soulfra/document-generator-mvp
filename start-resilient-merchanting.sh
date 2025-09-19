#!/bin/bash

# 🛡️ START RESILIENT MERCHANTING PLATFORM
# Launches the OSRS merchanting system with resilient API handling

echo "🛡️ STARTING RESILIENT MERCHANTING PLATFORM"
echo "========================================="
echo ""

# Check dependencies
echo "📋 Checking dependencies..."

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check Redis
if ! docker ps | grep -q redis; then
    echo "🔄 Starting Redis..."
    docker run -d --name redis-merchanting -p 6379:6379 redis:alpine
    sleep 2
fi

# Check PostgreSQL
if ! docker ps | grep -q postgres; then
    echo "🔄 Starting PostgreSQL..."
    docker run -d --name postgres-merchanting \
        -e POSTGRES_PASSWORD=merchanting \
        -e POSTGRES_DB=osrs_merchanting \
        -p 5432:5432 \
        postgres:alpine
    sleep 5
fi

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama not running. AI features will use cloud fallbacks."
    echo "   To install: https://ollama.ai"
else
    echo "✅ Ollama detected"
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start services in tmux sessions
tmux new-session -d -s merchanting

# Window 1: Market Data Collector
tmux new-window -t merchanting:1 -n 'DataCollector'
tmux send-keys -t merchanting:1 'node market-data-collector.js' Enter

# Window 2: Budget Optimization Engine
tmux new-window -t merchanting:2 -n 'BudgetEngine'
tmux send-keys -t merchanting:2 'node budget-optimization-engine.js' Enter

# Window 3: Multi-Strategy Trading System
tmux new-window -t merchanting:3 -n 'TradingSystem'
tmux send-keys -t merchanting:3 'node multi-strategy-trading-system.js' Enter

# Window 4: OSRS Merchanting Platform (main API)
tmux new-window -t merchanting:4 -n 'Platform'
tmux send-keys -t merchanting:4 'node osrs-merchanting-platform.js' Enter

# Window 5: Automated Market Stats Engine
tmux new-window -t merchanting:5 -n 'StatsEngine'
tmux send-keys -t merchanting:5 'node automated-market-stats-engine.js' Enter

# Window 6: Proactive Error Prevention
tmux new-window -t merchanting:6 -n 'ErrorPrevention'
tmux send-keys -t merchanting:6 'node proactive-error-prevention.js' Enter

sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📡 Service Endpoints:"
echo "   • Merchanting API: http://localhost:8888"
echo "   • WebSocket: ws://localhost:8889"
echo "   • Stats Engine: http://localhost:7000"
echo "   • Stats Dashboard: http://localhost:7000/dashboard"
echo "   • Health Check: http://localhost:8888/api/debug/health"
echo ""
echo "🛡️ Resilient Features Active:"
echo "   • Retry with exponential backoff"
echo "   • Circuit breaker protection"
echo "   • Automatic cache fallback"
echo "   • Request queuing for recovery"
echo "   • Real-time health monitoring"
echo ""
echo "📝 Commands:"
echo "   • View logs: tmux attach -t merchanting"
echo "   • Switch windows: Ctrl+B then window number"
echo "   • Detach: Ctrl+B then D"
echo "   • Stop all: ./stop-merchanting.sh"
echo ""
echo "🧪 Test resilience:"
echo "   node test-resilient-api.js"
echo ""
echo "💰 Happy merchanting! The system will 'roll through' any API errors!"