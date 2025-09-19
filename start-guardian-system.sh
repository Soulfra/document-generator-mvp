#!/bin/bash
# START GUARDIAN SYSTEM
# Launches the integrated Guardian approval system with real database connections

set -e  # Exit on error

echo "🛡️ Starting Cal Guardian Integrated System..."
echo "============================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️ PostgreSQL is not running. Attempting to start..."
    
    # Try different methods to start PostgreSQL
    if command -v brew &> /dev/null; then
        echo "🍺 Starting PostgreSQL with Homebrew..."
        brew services start postgresql || echo "⚠️ Could not start PostgreSQL with brew"
    elif command -v systemctl &> /dev/null; then
        echo "🐧 Starting PostgreSQL with systemctl..."
        sudo systemctl start postgresql || echo "⚠️ Could not start PostgreSQL with systemctl"
    else
        echo "❌ Could not start PostgreSQL automatically"
        echo "   Please start PostgreSQL manually and try again"
        exit 1
    fi
    
    # Wait a moment for PostgreSQL to start
    sleep 3
    
    # Check again
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "❌ PostgreSQL is still not responding"
        echo "   Please check your PostgreSQL installation and configuration"
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"

# Set environment variables if not already set
export POSTGRES_HOST=${POSTGRES_HOST:-localhost}
export POSTGRES_PORT=${POSTGRES_PORT:-5432}
export POSTGRES_DB=${POSTGRES_DB:-document_generator}
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}
export GUARDIAN_PORT=${GUARDIAN_PORT:-9400}
export GUARDIAN_WS_PORT=${GUARDIAN_WS_PORT:-8082}
export GUARDIAN_BRANDS=${GUARDIAN_BRANDS:-"deathtodata.com,soulfra.ai"}

echo "📊 Environment Configuration:"
echo "   Database: ${POSTGRES_USER}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
echo "   Guardian Port: ${GUARDIAN_PORT}"
echo "   WebSocket Port: ${GUARDIAN_WS_PORT}"
echo "   Protected Brands: ${GUARDIAN_BRANDS}"
echo ""

# Check if Guardian files exist
REQUIRED_FILES=(
    "CAL-GUARDIAN-DATABASE-ADAPTER.js"
    "CAL-GUARDIAN-INTEGRATED-SYSTEM.js"
    "CAL-GUARDIAN-REAL-DASHBOARD.html"
    "DomainSpecificAPIKeyManager.js"
    "AGENT-ECONOMY-FORUM.js"
)

echo "🔍 Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file not found: $file"
        echo "   Please ensure all Guardian system files are present"
        exit 1
    fi
done
echo "✅ All required files found"

# Install Node.js dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Checking Node.js dependencies..."
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        echo "📥 Installing dependencies..."
        npm install
    fi
    echo "✅ Dependencies ready"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping Guardian System..."
    if [ ! -z "$GUARDIAN_PID" ]; then
        kill $GUARDIAN_PID 2>/dev/null || true
    fi
    echo "✅ Guardian System stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Guardian Integrated System..."
echo ""

# Start the Guardian system
node CAL-GUARDIAN-INTEGRATED-SYSTEM.js 2>&1 | tee logs/guardian-$(date +%Y%m%d-%H%M%S).log &
GUARDIAN_PID=$!

# Wait a moment for the system to start
sleep 3

# Check if the system is running
if ! kill -0 $GUARDIAN_PID 2>/dev/null; then
    echo "❌ Guardian System failed to start"
    echo "   Check the log file in logs/ directory for details"
    exit 1
fi

echo "✅ Guardian System is running!"
echo ""
echo "🎯 ACCESS POINTS:"
echo "   📊 Guardian Dashboard: http://localhost:${GUARDIAN_PORT}"
echo "   🔌 WebSocket API: ws://localhost:${GUARDIAN_WS_PORT}"
echo "   🏥 Health Check: http://localhost:${GUARDIAN_PORT}/api/health"
echo "   📈 System Stats: http://localhost:${GUARDIAN_PORT}/api/guardian/stats"
echo ""
echo "🧪 TEST COMMANDS:"
echo "   # Create test approval"
echo "   curl -X POST http://localhost:${GUARDIAN_PORT}/api/guardian/test"
echo ""
echo "   # Check system health"
echo "   curl http://localhost:${GUARDIAN_PORT}/api/health"
echo ""
echo "   # Get pending approvals"
echo "   curl http://localhost:${GUARDIAN_PORT}/api/guardian/approvals"
echo ""
echo "🎉 Your pricing accuracy problems are solved!"
echo "   Multi-source verification, human-in-the-loop approval, and cost optimization are now active"
echo ""
echo "💡 Click on different brands in the dashboard to switch between deathtodata.com and soulfra.ai"
echo "🖱️ The dashboard provides a '5 year old userface' where you can easily click brands/websites"
echo ""
echo "Press Ctrl+C to stop the Guardian System"

# Wait for the Guardian system process
wait $GUARDIAN_PID