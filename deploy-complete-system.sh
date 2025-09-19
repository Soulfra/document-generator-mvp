#!/bin/bash

# 🚀 COMPLETE SYSTEM DEPLOYMENT SCRIPT
# Deploy the full Document Generator ecosystem with Master Orchestrator

echo "🌟 DOCUMENT GENERATOR - COMPLETE SYSTEM DEPLOYMENT"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js is available"

# Check required files
print_status "Checking required files..."
required_files=(
    "master-frontend-backend-orchestrator.js"
    "system-integration-manager.js"
    "docker-compose.yml"
    "Dockerfile.master"
    "frontend-main-dashboard.html"
    "character-breeding-interface.html"
    "tipping-interface.html"
    "launch-master-orchestrator.sh"
    "test-complete-integration-master.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    print_error "Missing required files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

print_success "All required files present"

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    print_status "Creating .env file..."
    cat > .env << EOL
# Document Generator Environment Configuration
NODE_ENV=production
PORT=4000

# AI API Keys (optional - will use demo mode if not provided)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=document_generator
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Ollama Configuration
OLLAMA_HOST=ollama
OLLAMA_PORT=11434

# System Configuration
DEMO_MODE=true
TIPPING_SYSTEM_ENABLED=true
CHARACTER_BREEDING_ENABLED=true
WEBSOCKET_ENABLED=true
REAL_TIME_UPDATES=true
EOL
    print_success "Created .env file with default configuration"
else
    print_success ".env file already exists"
fi

# Install npm dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "Installing npm dependencies..."
    npm install
    if [[ $? -eq 0 ]]; then
        print_success "Dependencies installed"
    else
        print_warning "Failed to install dependencies - continuing anyway"
    fi
fi

# Build Docker images
print_status "Building Docker images..."
docker-compose build master-orchestrator
if [[ $? -eq 0 ]]; then
    print_success "Master orchestrator image built"
else
    print_error "Failed to build master orchestrator image"
    exit 1
fi

# Start core infrastructure
print_status "Starting core infrastructure services..."
docker-compose up -d postgres redis ollama

print_status "Waiting for core services to initialize..."
sleep 30

# Check if core services are healthy
print_status "Checking core service health..."

# Check PostgreSQL
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL may still be starting up"
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis may still be starting up"
fi

# Start master orchestrator
print_status "Starting Master Frontend-Backend Orchestrator..."
docker-compose up -d master-orchestrator

print_status "Waiting for master orchestrator to initialize..."
sleep 20

# Check master orchestrator health
print_status "Checking master orchestrator health..."
max_attempts=10
attempt=1

while [[ $attempt -le $max_attempts ]]; do
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        print_success "Master orchestrator is healthy!"
        break
    else
        print_status "Attempt $attempt/$max_attempts - waiting for master orchestrator..."
        sleep 5
        ((attempt++))
    fi
done

if [[ $attempt -gt $max_attempts ]]; then
    print_warning "Master orchestrator may still be starting up"
    print_status "Checking logs..."
    docker-compose logs --tail=10 master-orchestrator
fi

# Display deployment status
echo ""
echo "🎯 DEPLOYMENT STATUS"
echo "===================="

# Check all services
services=("postgres" "redis" "ollama" "master-orchestrator")
for service in "${services[@]}"; do
    if docker-compose ps | grep -q "$service.*Up"; then
        print_success "$service: Running"
    else
        print_error "$service: Not running"
    fi
done

echo ""
echo "🌐 SERVICE ENDPOINTS"
echo "==================="
echo "🏠 Main Dashboard:      http://localhost:4000"
echo "👥 Character Breeding:  http://localhost:4000/characters"
echo "💰 Tipping Center:      http://localhost:4000/tips"
echo "🔌 API Gateway:         http://localhost:4000/api"
echo "⚡ WebSocket:           ws://localhost:4000/ws"
echo "❤️ Health Check:       http://localhost:4000/api/health"
echo ""
echo "📊 Infrastructure:"
echo "🐘 PostgreSQL:         localhost:5432"
echo "📦 Redis:              localhost:6379"
echo "🤖 Ollama:             http://localhost:11434"
echo ""

# Offer to run integration tests
echo "🧪 INTEGRATION TESTING"
echo "======================"
read -p "Would you like to run the complete integration test? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running integration tests..."
    node test-complete-integration-master.js
    if [[ $? -eq 0 ]]; then
        print_success "All integration tests passed!"
    else
        print_warning "Some integration tests failed - check output above"
    fi
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo "The Document Generator Master Orchestrator is now running!"
echo ""
print_success "Visit http://localhost:4000 to start using the system"
echo ""
echo "📋 Useful Commands:"
echo "  - View logs:           docker-compose logs -f master-orchestrator"
echo "  - Stop services:       docker-compose down"
echo "  - Restart services:    docker-compose restart"
echo "  - Run tests:          node test-complete-integration-master.js"
echo ""
echo "🌟 Enjoy your unified document generator ecosystem! 🌟"