#!/usr/bin/env bash

# Document Generator - One Command Setup Script
# This script sets up the entire Document Generator system

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    else
        print_success "$1 is installed"
        return 0
    fi
}

# Main setup process
print_header "Document Generator Setup"
echo "This script will set up the complete Document Generator system"
echo "Including: Template Processor, AI Services, and Platform Hub"
echo ""

# Step 1: Check prerequisites
print_header "Step 1: Checking Prerequisites"

MISSING_DEPS=0

if ! check_command "docker"; then
    MISSING_DEPS=1
    echo "  Install Docker from: https://docs.docker.com/get-docker/"
fi

if ! check_command "docker-compose"; then
    MISSING_DEPS=1
    echo "  Install Docker Compose from: https://docs.docker.com/compose/install/"
fi

if ! check_command "node"; then
    MISSING_DEPS=1
    echo "  Install Node.js 18+ from: https://nodejs.org/"
fi

if ! check_command "npm"; then
    MISSING_DEPS=1
    echo "  npm should come with Node.js"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing required dependencies. Please install them and run this script again."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

print_success "All prerequisites met!"

# Step 2: Setup environment
print_header "Step 2: Setting Up Environment"

if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_success "Created .env file"
    echo ""
    print_warning "Please edit .env file and add your API keys:"
    echo "  - ANTHROPIC_API_KEY (optional, for Claude AI)"
    echo "  - OPENAI_API_KEY (optional, for GPT)"
    echo "  - STRIPE_SECRET_KEY (optional, for payments)"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
else
    print_success ".env file exists"
fi

# Step 3: Create necessary directories
print_header "Step 3: Creating Directory Structure"

directories=(
    "templates"
    "monitoring/prometheus"
    "monitoring/grafana/dashboards"
    "monitoring/grafana/datasources"
    "nginx/ssl"
    "scripts"
    "mcp/tools"
    "mcp/prompts"
    "mcp/resources"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    else
        print_success "Directory exists: $dir"
    fi
done

# Step 4: Pull Docker images
print_header "Step 4: Pulling Docker Images"

echo "Pulling required Docker images..."
docker-compose pull

# Step 5: Start infrastructure services
print_header "Step 5: Starting Infrastructure Services"

echo "Starting PostgreSQL, Redis, MinIO, and Ollama..."
docker-compose up -d postgres redis minio ollama

echo "Waiting for services to be healthy..."
sleep 10

# Check service health
services=("postgres" "redis" "minio" "ollama")
for service in "${services[@]}"; do
    if docker-compose ps | grep -q "document-generator-$service.*healthy"; then
        print_success "$service is healthy"
    else
        print_warning "$service may not be ready yet"
    fi
done

# Step 6: Setup MinIO bucket
print_header "Step 6: Setting Up MinIO Storage"

echo "Creating MinIO bucket..."
docker-compose exec -T minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123 || true
docker-compose exec -T minio mc mb myminio/document-generator-uploads --ignore-existing || true
print_success "MinIO bucket created"

# Step 7: Pull Ollama models
print_header "Step 7: Installing AI Models"

echo "Pulling Ollama models (this may take a while)..."
models=("codellama:7b" "mistral" "llama2" "phi")

for model in "${models[@]}"; do
    echo "Pulling $model..."
    docker exec document-generator-ollama ollama pull $model || print_warning "Failed to pull $model"
done

# Step 8: Setup monitoring
print_header "Step 8: Setting Up Monitoring"

# Create Prometheus config if not exists
if [ ! -f monitoring/prometheus.yml ]; then
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'template-processor'
    static_configs:
      - targets: ['template-processor:3000']
  
  - job_name: 'ai-api'
    static_configs:
      - targets: ['ai-api:3001']
  
  - job_name: 'analytics'
    static_configs:
      - targets: ['analytics:3002']
  
  - job_name: 'platform-hub'
    static_configs:
      - targets: ['platform-hub:8080']
EOF
    print_success "Created Prometheus configuration"
fi

# Create Grafana datasource config
if [ ! -f monitoring/grafana/datasources/prometheus.yml ]; then
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
    print_success "Created Grafana datasource configuration"
fi

# Step 9: Build and start application services
print_header "Step 9: Building Application Services"

echo "Building services (this may take a few minutes)..."
docker-compose build

echo "Starting all services..."
docker-compose up -d

# Step 10: Health check
print_header "Step 10: Verifying Installation"

echo "Waiting for services to start..."
sleep 30

# Check all services
print_success "Checking service health..."

urls=(
    "http://localhost:3000/health|Template Processor"
    "http://localhost:3001/health|AI API Service"
    "http://localhost:3002/health|Analytics Service"
    "http://localhost:8080|Platform Hub"
    "http://localhost:9001|MinIO Console"
    "http://localhost:3003|Grafana"
    "http://localhost:9090|Prometheus"
)

for url_info in "${urls[@]}"; do
    IFS='|' read -r url name <<< "$url_info"
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302"; then
        print_success "$name is accessible at $url"
    else
        print_warning "$name may not be ready at $url"
    fi
done

# Step 11: Create helpful scripts
print_header "Step 11: Creating Helper Scripts"

# Create document-to-mvp.sh
cat > scripts/document-to-mvp.sh << 'EOF'
#!/bin/bash
# Convert a document to MVP

if [ -z "$1" ]; then
    echo "Usage: $0 <document-path>"
    exit 1
fi

curl -X POST http://localhost:3000/api/process-document \
  -H "Content-Type: multipart/form-data" \
  -F "document=@$1" \
  -F "exportFormats=docker,pdf,markdown"
EOF
chmod +x scripts/document-to-mvp.sh

# Create status script
cat > scripts/status.sh << 'EOF'
#!/bin/bash
echo "Document Generator Status"
echo "========================"
docker-compose ps
echo ""
echo "Service URLs:"
echo "- Template Processor: http://localhost:3000"
echo "- AI API: http://localhost:3001"
echo "- Analytics: http://localhost:3002"
echo "- Platform Hub: http://localhost:8080"
echo "- MinIO: http://localhost:9001 (minioadmin/minioadmin123)"
echo "- Grafana: http://localhost:3003 (admin/admin)"
echo "- Prometheus: http://localhost:9090"
EOF
chmod +x scripts/status.sh

print_success "Created helper scripts in scripts/"

# Final summary
print_header "🎉 Setup Complete!"

echo "Document Generator is now running!"
echo ""
echo "Access the services at:"
echo "  - Platform Hub: http://localhost:8080"
echo "  - Template Processor: http://localhost:3000/template-demo"
echo "  - AI Chat: http://localhost:8080/chat/ai-chat.html"
echo "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
echo "  - Grafana: http://localhost:3003 (admin/admin)"
echo ""
echo "Quick start:"
echo "  1. Visit http://localhost:8080 to access the platform"
echo "  2. Try processing a document: ./scripts/document-to-mvp.sh sample.md"
echo "  3. Check status: ./scripts/status.sh"
echo ""
echo "To stop all services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""
print_success "Happy document processing! 🚀"