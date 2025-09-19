#!/bin/bash

# START LIVE DEMO ENVIRONMENT
# Interactive playground showcasing the complete character system

echo "🎮 Starting Live Demo Environment..."

# Set environment variables
export NODE_ENV="${NODE_ENV:-demo}"
export DB_HOST="${DB_HOST:-localhost}"
export DB_USER="${DB_USER:-root}"
export DB_PASSWORD="${DB_PASSWORD:-}"
export DB_NAME="${DB_NAME:-economic_engine}"

echo "📊 Database: $DB_HOST/$DB_NAME"
echo "🎪 Mode: Interactive Demo"

# Check dependencies
echo "🔍 Checking dependencies..."

# Check database
node -e "
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: '$DB_HOST',
    user: '$DB_USER',
    password: '$DB_PASSWORD',
    database: '$DB_NAME'
});
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Database connection successful');
        connection.end();
    }
});
" || {
    echo "❌ Database connection failed"
    exit 1
}

# Check for required services
echo "🔍 Checking required services..."

REQUIRED_SERVICES=(
    "42001:Character API"
    "42002:QR Auth"
    "42006:Claude API"
    "42007:Overlay System"
    "42009:Monitoring"
    "42010:Verification"
    "42012:Cost Analytics"
    "42014:Blockchain"
    "42016:Streaming"
)

MISSING_SERVICES=0

for service in "${REQUIRED_SERVICES[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
        echo "✅ $name (port $port)"
    else
        echo "⚠️ $name (port $port) - not running"
        ((MISSING_SERVICES++))
    fi
done

if [ $MISSING_SERVICES -gt 0 ]; then
    echo ""
    echo "⚠️ $MISSING_SERVICES services are not running"
    echo "📝 Demo will work with limited functionality"
    echo "💡 To start all services, run: ./start-all-services.sh"
    echo ""
fi

# Start the demo environment
echo "🚀 Starting Live Demo Environment..."
echo ""
echo "🎪 Interactive Playground: http://localhost:42018/playground"
echo "📺 Demo Theater: http://localhost:42018/theater"  
echo "🎮 Main Dashboard: http://localhost:42018"
echo "🔌 WebSocket: ws://localhost:42019"
echo ""
echo "🎭 Available Demo Scenarios:"
echo "   • Character Registration Demo"
echo "   • Interactive Chat Demo"
echo "   • Claude API Integration"
echo "   • RuneLite-Style Overlays"
echo "   • Complete System Demo"
echo "   • Verification & Proof Generation"
echo ""
echo "🎯 Interactive Features:"
echo "   • Real-time character creation"
echo "   • Live symbol parsing (@, #, !, ?)"
echo "   • Claude query testing"
echo "   • Overlay demonstrations"
echo "   • Cost tracking visualization"
echo "   • Blockchain proof generation"
echo ""

# Create logs directory
mkdir -p logs

# Start with auto-restart
while true; do
    echo "▶️ Starting live demo environment (PID: $$)..."
    node live-demo-environment.js 2>&1 | tee logs/demo-$(date +%Y%m%d-%H%M%S).log
    
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "✅ Live demo environment shut down gracefully"
        break
    else
        echo "❌ Live demo environment crashed (exit code: $exit_code)"
        echo "🔄 Restarting in 5 seconds..."
        sleep 5
    fi
done