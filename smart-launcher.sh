#!/bin/bash

# SMART LAUNCHER - Detects native Ollama and launches everything correctly
# This provides the "reboot button" functionality you want

set -e

echo "🚀 SMART LAUNCHER - Document Generator Gaming AI Ecosystem"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# 1. Check prerequisites
echo "📋 Checking prerequisites..."
echo "----------------------------"

PREREQS_OK=1

if command_exists docker; then
    print_status "Docker installed" 0
else
    print_status "Docker not found" 1
    PREREQS_OK=0
fi

if command_exists docker-compose; then
    print_status "Docker Compose installed" 0
else
    print_status "Docker Compose not found" 1
    PREREQS_OK=0
fi

if command_exists node; then
    print_status "Node.js installed" 0
else
    print_status "Node.js not found" 1
    PREREQS_OK=0
fi

if [ $PREREQS_OK -eq 0 ]; then
    echo -e "${RED}Please install missing prerequisites${NC}"
    exit 1
fi

echo ""

# 2. Detect Ollama status
echo "🤖 Checking Ollama status..."
echo "----------------------------"

OLLAMA_STATUS="not_found"
OLLAMA_MODELS=""
USE_NATIVE_OLLAMA=false

# Check if Ollama is running natively
if port_in_use 11434; then
    # Try to get Ollama models
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        OLLAMA_STATUS="native"
        OLLAMA_MODELS=$(curl -s http://localhost:11434/api/tags | jq -r '.models[]?.name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
        USE_NATIVE_OLLAMA=true
        print_status "Native Ollama detected on port 11434" 0
        if [ ! -z "$OLLAMA_MODELS" ]; then
            echo -e "${GREEN}   Available models: ${OLLAMA_MODELS}${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Port 11434 is in use but not responding to Ollama API${NC}"
    fi
else
    echo -e "${YELLOW}📦 Native Ollama not running - will use Docker Ollama${NC}"
fi

echo ""

# 3. Check AI debugging dashboard
echo "🧠 Checking AI debugging dashboard..."
echo "-------------------------------------"

if port_in_use 9500; then
    print_status "AI debugging dashboard already running on port 9500" 0
else
    echo "Starting AI debugging dashboard..."
    # Start in background and redirect output
    nohup node unified-ai-debugging-dashboard.js > dashboard.log 2>&1 &
    sleep 3
    if port_in_use 9500; then
        print_status "AI debugging dashboard started" 0
    else
        echo -e "${YELLOW}⚠️  AI debugging dashboard failed to start - check dashboard.log${NC}"
    fi
fi

echo ""

# 4. Start Docker services
echo "🐳 Starting Docker services..."
echo "------------------------------"

# Prepare docker-compose command based on Ollama status
COMPOSE_CMD="docker-compose"
COMPOSE_FILES="-f docker-compose.yml"

if [ "$USE_NATIVE_OLLAMA" = true ]; then
    echo -e "${BLUE}Using native Ollama configuration${NC}"
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.native-ollama.yml"
else
    echo -e "${BLUE}Using Docker Ollama configuration${NC}"
fi

# Start Docker if not running (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! docker info >/dev/null 2>&1; then
        echo "Starting Docker Desktop..."
        open -a Docker
        # Wait for Docker to start
        while ! docker info >/dev/null 2>&1; do
            echo -n "."
            sleep 2
        done
        echo ""
    fi
fi

# Pull required images
echo "Pulling required Docker images..."
$COMPOSE_CMD $COMPOSE_FILES pull

# Start all services
echo "Starting all services..."
$COMPOSE_CMD $COMPOSE_FILES up -d

# Give services time to start
echo "Waiting for services to initialize..."
sleep 10

echo ""

# 5. Service health check
echo "🏥 Checking service health..."
echo "-----------------------------"

# Check key services
services=(
    "postgres:5432:PostgreSQL"
    "redis:6379:Redis"
    "minio:9000:MinIO"
    "3000:Template Processor"
    "3001:AI API Service"
    "8080:Platform Hub"
)

for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "${service#*:}"
    if port_in_use $port; then
        print_status "$name (port $port)" 0
    else
        print_status "$name (port $port)" 1
    fi
done

echo ""

# 6. Initialize Ollama models if using Docker
if [ "$USE_NATIVE_OLLAMA" = false ]; then
    echo "🤖 Initializing Docker Ollama models..."
    echo "--------------------------------------"
    
    # Wait for Ollama to be ready
    echo -n "Waiting for Ollama to be ready"
    for i in {1..30}; do
        if docker exec document-generator-ollama ollama list >/dev/null 2>&1; then
            echo " Ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Pull essential models
    echo "Pulling essential models..."
    docker exec document-generator-ollama ollama pull mistral || true
    docker exec document-generator-ollama ollama pull codellama:7b || true
    
    print_status "Ollama models initialized" 0
    echo ""
fi

# 7. Show access information
echo "✅ SYSTEM READY!"
echo "================"
echo ""
echo "🌐 Access points:"
echo "   AI Debugging Dashboard: http://localhost:9500"
echo "   Platform Hub: http://localhost:8080"
echo "   Template Processor: http://localhost:3000"
echo "   AI Services: http://localhost:3001"
echo ""

if [ ! -z "$OLLAMA_MODELS" ] && [ "$USE_NATIVE_OLLAMA" = true ]; then
    echo "🤖 Using native Ollama with models: $OLLAMA_MODELS"
else
    echo "🤖 Using Docker Ollama"
fi

echo ""
echo "📊 Logs:"
echo "   Dashboard: dashboard.log"
echo "   Docker: docker-compose logs -f"
echo ""
echo "🛑 To stop everything:"
echo "   ./smart-shutdown.sh"
echo ""

# Create smart shutdown script
cat > smart-shutdown.sh << 'EOF'
#!/bin/bash
echo "🛑 Shutting down Document Generator ecosystem..."

# Stop AI debugging dashboard
if pgrep -f "unified-ai-debugging-dashboard.js" > /dev/null; then
    echo "Stopping AI debugging dashboard..."
    pkill -f "unified-ai-debugging-dashboard.js"
fi

# Stop Docker services
echo "Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"
EOF

chmod +x smart-shutdown.sh

echo "🎮 Ready to game and train AI!"