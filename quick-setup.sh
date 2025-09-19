#!/bin/bash

# 🚀 QUICK SETUP SCRIPT
# Gets your AI Agent Marketplace running with minimal configuration

echo "🚀 AI AGENT MARKETPLACE - QUICK SETUP"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Running on macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Running on Linux"
else
    echo "⚠️ Unsupported OS: $OSTYPE"
fi

echo ""
echo "📋 Step 1: Checking prerequisites..."
echo "------------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js installed: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm installed: $(npm --version)"
else
    echo "❌ npm not found."
    exit 1
fi

# Check Docker (optional but recommended)
if command -v docker &> /dev/null; then
    echo "✅ Docker installed"
    if docker info &> /dev/null; then
        echo "✅ Docker is running"
    else
        echo "⚠️ Docker installed but not running"
        echo "   Start Docker Desktop or run: sudo systemctl start docker"
    fi
else
    echo "⚠️ Docker not installed (optional, but recommended for databases)"
fi

# Check Ollama (optional but recommended)
if command -v ollama &> /dev/null; then
    echo "✅ Ollama installed"
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo "✅ Ollama is running"
    else
        echo "⚠️ Ollama installed but not running"
        echo "   Run: ollama serve"
    fi
else
    echo "⚠️ Ollama not installed (optional, for local AI)"
    echo "   Install from: https://ollama.ai"
fi

echo ""
echo "📦 Step 2: Installing dependencies..."
echo "------------------------------------"

# Install required npm packages
echo "Installing core dependencies..."
npm install express cors axios dotenv 2>/dev/null || echo "⚠️ Some packages may already be installed"

echo "Installing additional dependencies..."
npm install colors ws socket.io form-data node-fetch 2>/dev/null || echo "⚠️ Some packages may already be installed"

echo ""
echo "🔑 Step 3: Setting up configuration..."
echo "--------------------------------------"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Basic Configuration
NODE_ENV=development
PORT=3000

# AI Services (add your keys here)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Database URLs (if using Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/document_generator
REDIS_URL=redis://localhost:6379

# Demo Mode (uses fallback AI)
DEMO_MODE=true
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🐳 Step 4: Starting basic services..."
echo "-------------------------------------"

# Start databases if Docker is available
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "Starting PostgreSQL..."
    docker run -d --name postgres-docgen -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:latest 2>/dev/null || echo "⚠️ PostgreSQL may already be running"
    
    echo "Starting Redis..."
    docker run -d --name redis-docgen -p 6379:6379 redis:latest 2>/dev/null || echo "⚠️ Redis may already be running"
    
    echo "Waiting for databases to start..."
    sleep 5
fi

# Download Ollama models if Ollama is running
if command -v ollama &> /dev/null && curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "Checking Ollama models..."
    if ! ollama list | grep -q "llama2"; then
        echo "Downloading llama2 model (this may take a few minutes)..."
        ollama pull llama2 &
        OLLAMA_PID=$!
    fi
fi

echo ""
echo "🚀 Step 5: Starting the marketplace..."
echo "-------------------------------------"

# Kill any existing services on our ports
echo "Cleaning up old processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Start services
echo "Starting AI API Service..."
node services/real-ai-api.js > logs/ai-api.log 2>&1 &
AI_PID=$!
echo "  Started with PID: $AI_PID"

sleep 2

echo "Starting Notification Service..."
node notification-service.js > logs/notification.log 2>&1 &
NOTIFY_PID=$!
echo "  Started with PID: $NOTIFY_PID"

sleep 2

echo "Starting Marketplace Platform..."
node marketplace-integration.js > logs/marketplace.log 2>&1 &
MARKET_PID=$!
echo "  Started with PID: $MARKET_PID"

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check if services are running
echo ""
echo "🔍 Checking service status..."
echo "-----------------------------"

if lsof -i :3001 &> /dev/null; then
    echo -e "${GREEN}✅ AI API Service running on port 3001${NC}"
else
    echo -e "${RED}❌ AI API Service failed to start${NC}"
fi

if lsof -i :8080 &> /dev/null; then
    echo -e "${GREEN}✅ Marketplace running on port 8080${NC}"
else
    echo -e "${RED}❌ Marketplace failed to start${NC}"
fi

if lsof -i :8081 &> /dev/null; then
    echo -e "${GREEN}✅ Notification Service running on port 8081${NC}"
else
    echo -e "${YELLOW}⚠️ Notification Service not running (optional)${NC}"
fi

# Wait for Ollama download if started
if [ ! -z "$OLLAMA_PID" ]; then
    echo ""
    echo "⏳ Waiting for Ollama model download..."
    wait $OLLAMA_PID
    echo "✅ Ollama model ready"
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "🌐 Your AI Agent Marketplace is ready at:"
echo "   ${GREEN}http://localhost:8080${NC}"
echo ""
echo "📊 Service URLs:"
echo "   Marketplace: http://localhost:8080"
echo "   AI API: http://localhost:3001"
echo "   Notifications: ws://localhost:8081"
echo ""
echo "🔑 Next Steps:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Click 'Get Started Free' to create an account"
echo "   3. Browse and hire AI agents"
echo "   4. Watch them work in real-time!"
echo ""
echo "💡 Tips:"
echo "   - Add OpenAI/Anthropic API keys to .env for better AI"
echo "   - Check logs/ directory for service logs"
echo "   - Run 'node system-diagnostic.js' to check system health"
echo ""
echo "🛑 To stop all services:"
echo "   kill $AI_PID $MARKET_PID $NOTIFY_PID"
echo "   OR"
echo "   pkill -f 'marketplace-integration|real-ai-api|notification-service'"
echo ""

# Save PIDs for easy stopping
echo "$AI_PID" > .ai-api.pid
echo "$MARKET_PID" > .marketplace.pid
echo "$NOTIFY_PID" > .notification.pid

echo "📝 Service PIDs saved to .*.pid files"
echo ""

# Create a stop script
cat > stop-marketplace.sh << EOF
#!/bin/bash
echo "🛑 Stopping AI Agent Marketplace..."

# Read PIDs
AI_PID=\$(cat .ai-api.pid 2>/dev/null)
MARKET_PID=\$(cat .marketplace.pid 2>/dev/null)
NOTIFY_PID=\$(cat .notification.pid 2>/dev/null)

# Kill processes
[ ! -z "\$AI_PID" ] && kill \$AI_PID 2>/dev/null && echo "Stopped AI API"
[ ! -z "\$MARKET_PID" ] && kill \$MARKET_PID 2>/dev/null && echo "Stopped Marketplace"
[ ! -z "\$NOTIFY_PID" ] && kill \$NOTIFY_PID 2>/dev/null && echo "Stopped Notifications"

# Clean up PID files
rm -f .*.pid

echo "✅ All services stopped"
EOF

chmod +x stop-marketplace.sh
echo "✅ Created stop-marketplace.sh script"

# Open browser automatically
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🌐 Opening marketplace in browser..."
    sleep 2
    open http://localhost:8080
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
fi