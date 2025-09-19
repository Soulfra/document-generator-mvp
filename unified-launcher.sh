#!/bin/bash

# 🚀 UNIFIED LAUNCHER - Using EXISTING infrastructure
# Finally! No more rebuilding what we already have!

set -e  # Exit on error

echo "🎮 UNIFIED DOCUMENT GENERATOR LAUNCHER"
echo "====================================="
echo "Using existing Master System Controller and all infrastructure"
echo ""

BASE_DIR="/Users/matthewmauer/Desktop/Document-Generator"
cd "$BASE_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start a service if not running
start_service() {
    local name=$1
    local port=$2
    local start_cmd=$3
    local working_dir=${4:-"."}
    
    if check_port $port; then
        echo -e "${GREEN}✅ $name already running on port $port${NC}"
    else
        echo -e "${YELLOW}🚀 Starting $name on port $port...${NC}"
        if [ "$working_dir" != "." ]; then
            (cd "$working_dir" && eval "$start_cmd") &
        else
            eval "$start_cmd" &
        fi
        sleep 2
        
        if check_port $port; then
            echo -e "${GREEN}✅ $name started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start $name${NC}"
        fi
    fi
}

# Function to check Docker service
check_docker_service() {
    local service_name=$1
    if docker ps --format "table {{.Names}}" | grep -q "$service_name"; then
        echo -e "${GREEN}✅ Docker service $service_name is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Docker service $service_name is not running${NC}"
        return 1
    fi
}

# Run service discovery first
echo "🔍 Running service discovery..."
node unified-service-discovery.js > discovery.log 2>&1 &
DISCOVERY_PID=$!

# Check if Master System Controller is running
echo ""
echo "🎮 Master System Controller Status..."
echo "-----------------------------------"
if check_port 9999; then
    echo -e "${GREEN}✅ Master System Controller already running on port 9999${NC}"
    echo "📊 Dashboard: http://localhost:9999"
else
    echo -e "${YELLOW}🚀 Starting Master System Controller...${NC}"
    node master-system-controller.js &
    sleep 3
    if check_port 9999; then
        echo -e "${GREEN}✅ Master System Controller started successfully${NC}"
        echo "📊 Dashboard: http://localhost:9999"
    else
        echo -e "${RED}❌ Failed to start Master System Controller${NC}"
    fi
fi

# Check Docker infrastructure
echo ""
echo "🐳 Docker Infrastructure Status..."
echo "---------------------------------"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start core infrastructure using existing Docker Compose
if [ -f "docker-compose.yml" ]; then
    echo "🚀 Starting infrastructure with existing docker-compose.yml..."
    docker-compose up -d postgres redis minio ollama > /dev/null 2>&1
    
    sleep 5
    
    # Check each service
    check_docker_service "document-generator-postgres"
    check_docker_service "document-generator-redis" 
    check_docker_service "document-generator-minio"
    check_docker_service "document-generator-ollama"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml not found, starting services manually...${NC}"
    
    # Start individual containers if needed
    if ! check_docker_service "postgres"; then
        echo "🚀 Starting PostgreSQL..."
        docker run -d --name postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=document_generator \
            -p 5432:5432 \
            postgres:13-alpine > /dev/null 2>&1
    fi
    
    if ! check_docker_service "redis"; then
        echo "🚀 Starting Redis..."
        docker run -d --name redis \
            -p 6379:6379 \
            redis:alpine > /dev/null 2>&1
    fi
    
    if ! check_docker_service "minio"; then
        echo "🚀 Starting MinIO..."
        docker run -d --name minio \
            -p 9000:9000 -p 9001:9001 \
            -e MINIO_ROOT_USER=minioadmin \
            -e MINIO_ROOT_PASSWORD=minioadmin123 \
            minio/minio server /data --console-address ":9001" > /dev/null 2>&1
    fi
fi

# Check for existing working services and start if needed
echo ""
echo "📦 Application Services Status..."
echo "--------------------------------"

# Template Processor (MCP) - port 3000
if [ -f "mcp/server.js" ]; then
    start_service "Template Processor (MCP)" 3000 \
        "node server.js" \
        "mcp"
elif [ -f "docgen-starter-kit/services/template-processor/index.js" ]; then
    start_service "Template Processor" 3000 \
        "node services/template-processor/index.js" \
        "docgen-starter-kit"
fi

# AI API Service - port 3001
if [ -f "FinishThisIdea/ai-api/index.js" ]; then
    start_service "AI API (FinishThisIdea)" 3001 \
        "node ai-api/index.js" \
        "FinishThisIdea"
elif [ -f "docgen-starter-kit/services/ai-api/index.js" ]; then
    start_service "AI API (Starter Kit)" 3001 \
        "node services/ai-api/index.js" \
        "docgen-starter-kit"
fi

# Analytics Service - port 3002
start_service "Analytics Service" 3002 \
    "node services/analytics/index.js" \
    "docgen-starter-kit"

# Document Parser - port 3003
start_service "Document Parser" 3003 \
    "node services/document-parser/index.js" \
    "docgen-starter-kit"

# CAL Compare System - port 4444 (existing)
if [ -f "FinishThisIdea/ai-os-clean/cal-compare-complete.js" ]; then
    start_service "CAL Compare System" 4444 \
        "API_PORT=4444 node cal-compare-complete.js" \
        "FinishThisIdea/ai-os-clean"
fi

# Platform Hub - port 8080
if [ -f "FinishThisIdea-Complete/index.js" ]; then
    start_service "Platform Hub (Complete)" 8080 \
        "node index.js" \
        "FinishThisIdea-Complete"
elif [ -f "docgen-starter-kit/services/web-interface/index.js" ]; then
    start_service "Web Interface" 8080 \
        "node services/web-interface/index.js" \
        "docgen-starter-kit"
fi

# Gaming Platform - port 8800
if [ -f "MASTER-GAMING-PLATFORM.js" ]; then
    start_service "Gaming Platform" 8800 \
        "node MASTER-GAMING-PLATFORM.js" \
        "."
fi

# Check for existing enterprise platforms
if [ -f "FinishThisIdea/enterprise-mvp-production-platform.js" ]; then
    echo -e "${BLUE}🏢 Enterprise Platform available: FinishThisIdea/enterprise-mvp-production-platform.js${NC}"
fi

# Check for AI ecosystems
if [ -f "FinishThisIdea/live-interaction-platform.js" ]; then
    echo -e "${BLUE}🤖 AI Ecosystem available: FinishThisIdea/live-interaction-platform.js${NC}"
fi

# Wait for discovery to complete
wait $DISCOVERY_PID 2>/dev/null || true

# Check Ollama specifically
echo ""
echo "🤖 AI Services Status..."
echo "------------------------"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama is running and responsive${NC}"
    # List available models
    MODELS=$(curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "Unable to list models")
    echo "📦 Available models: $MODELS"
else
    echo -e "${YELLOW}⚠️  Ollama not responding. Please start Ollama manually if needed.${NC}"
    echo "💡 Tip: brew services start ollama"
fi

# Show nginx configuration status
echo ""
echo "🌐 Nginx Configuration Status..."
echo "--------------------------------"
if [ -f "nginx.conf" ]; then
    echo -e "${GREEN}✅ Main nginx.conf found (documentgenerator.app routing)${NC}"
    echo "📍 Configure nginx to use this for production routing"
fi
if [ -f "nginx.gaming.conf" ]; then
    echo -e "${GREEN}✅ Gaming nginx.conf found (gaming platform routing)${NC}"
fi

# Display access URLs
echo ""
echo "🎯 ACCESS URLS"
echo "=============="
echo -e "${BLUE}🎮 Master Controller:     http://localhost:9999${NC}"
echo -e "${BLUE}📄 Template Processor:    http://localhost:3000${NC}"
echo -e "${BLUE}🤖 AI API:               http://localhost:3001${NC}"
echo -e "${BLUE}📊 Analytics:            http://localhost:3002${NC}"
echo -e "${BLUE}📋 Document Parser:       http://localhost:3003${NC}"
echo -e "${BLUE}🔍 CAL Compare:          http://localhost:4444${NC}"
echo -e "${BLUE}🌐 Platform Hub:         http://localhost:8080${NC}"
echo -e "${BLUE}🎮 Gaming Platform:      http://localhost:8800${NC}"
echo ""
echo "🐳 INFRASTRUCTURE"
echo "================="
echo -e "${BLUE}🗄️  PostgreSQL:          localhost:5432${NC}"
echo -e "${BLUE}⚡ Redis:               localhost:6379${NC}"
echo -e "${BLUE}📦 MinIO (S3):          http://localhost:9000${NC}"
echo -e "${BLUE}🎯 MinIO Console:       http://localhost:9001${NC}"
echo -e "${BLUE}🤖 Ollama:              http://localhost:11434${NC}"
echo ""

# Show existing launchers
if [ -d "FinishThisIdea" ]; then
    LAUNCHER_COUNT=$(find FinishThisIdea -name "launch-*.sh" | wc -l)
    if [ $LAUNCHER_COUNT -gt 0 ]; then
        echo "🚀 EXISTING LAUNCHERS FOUND"
        echo "==========================="
        echo -e "${GREEN}Found $LAUNCHER_COUNT existing launcher scripts in FinishThisIdea/${NC}"
        echo "Run 'ls FinishThisIdea/launch-*.sh' to see all available launchers"
        echo ""
    fi
fi

# Get system status from Master Controller
echo "📊 SYSTEM STATUS"
echo "================"
if check_port 9999; then
    curl -s http://localhost:9999/api/status | jq -r '.summary | "Total Services: \(.total)\nHealthy: \(.healthy)\nUnhealthy: \(.unhealthy)\nOffline: \(.offline)\nSystem Health: \(.healthPercentage)%"' 2>/dev/null || echo "⚠️  Master Controller not responding with status yet"
else
    echo "⚠️  Master Controller not available for status"
fi

echo ""
echo -e "${GREEN}✨ System ready! Visit http://localhost:9999 for the Master Control Dashboard${NC}"
echo ""
echo -e "${YELLOW}💡 TIPS:${NC}"
echo "• If services aren't healthy, click 'Fix Everything!' in the dashboard"
echo "• Use existing launchers in FinishThisIdea/ for specific platforms"
echo "• All your existing systems are preserved and integrated"
echo "• No more rebuilding - everything you built is connected!"