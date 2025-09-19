#!/bin/bash

# 🚀 Start Multiplayer Collaboration & Economy Ecosystem
# This script launches the complete multiplayer system with memory optimization

echo "🌟 Starting Multiplayer Ecosystem..."
echo "=================================="
echo ""

# Check if running in Docker or standalone
if [ -f /.dockerenv ]; then
    echo "🐳 Running in Docker environment"
    # Docker compose commands
    docker-compose --profile multiplayer up -d
else
    echo "🖥️ Running in standalone mode"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install ws better-sqlite3 canvas dockerode
    fi
    
    # Set memory limits
    export NODE_OPTIONS="--max-old-space-size=512"
    
    # Launch the ecosystem
    node multiplayer-ecosystem-launcher.js start
fi

echo ""
echo "✅ Multiplayer Ecosystem is starting!"
echo ""
echo "📍 Service URLs:"
echo "   - Multiplayer Hub: ws://localhost:8888"
echo "   - Health Dashboard: http://localhost:8888/health"
echo "   - Unix Database: /tmp/unix-db-socket"
echo ""
echo "🎮 Your theme island ecosystem is ready for collaboration!"
echo ""
echo "💡 Tips:"
echo "   - Check status: ./start-multiplayer.sh status"
echo "   - View logs: docker-compose logs -f multiplayer-hub"
echo "   - Stop services: docker-compose --profile multiplayer down"
echo ""