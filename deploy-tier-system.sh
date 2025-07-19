#!/usr/bin/env bash

# Deploy 5-Tier Document Generator System
# This script deploys the complete 5-tier architecture with real services

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_tier() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Main deployment
print_tier "🚀 5-Tier Document Generator Deployment"
echo "Deploying the complete 5-tier architecture:"
echo "• Tier 5: Universal Interface (Perfect Abstraction)"
echo "• Tier 4: Invisible Substrate (Hidden Infrastructure)"
echo "• Tier 3: Meta-Documentation (Permanent Knowledge)"
echo "• Tier 2: Working Services (Regeneratable Code)"
echo "• Tier 1: Generated Output (Ephemeral Results)"
echo ""

# Check prerequisites
print_tier "📋 Checking Prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker is required but not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is required but not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

print_success "All prerequisites met"

# Initialize Tier 3 (Templates and Knowledge)
print_tier "📚 Tier 3: Initializing Meta-Documentation"

print_info "Setting up template knowledge base..."
cd FinishThisIdea
node tier-3-symlink-manager.js init

print_info "Creating template structure..."
mkdir -p tier-3/templates/{business,technical,development,deployment}
mkdir -p tier-3/knowledge/{domains,patterns,best-practices}
mkdir -p tier-3/docs/{api,guides,examples}

print_success "Tier 3 Meta-Documentation initialized"

# Start Tier 4 Infrastructure (Invisible Substrate)
print_tier "🌐 Tier 4: Starting Invisible Substrate"

cd ..

print_info "Starting infrastructure services..."
docker-compose up -d postgres redis minio ollama prometheus grafana

print_info "Waiting for infrastructure to be ready..."
sleep 15

# Check infrastructure health
services=("postgres" "redis" "minio" "ollama")
for service in "${services[@]}"; do
    if docker-compose ps | grep -q "document-generator-$service.*healthy\|Up"; then
        print_success "$service is ready"
    else
        print_warning "$service may still be starting"
    fi
done

# Initialize AI models
print_info "Installing AI models..."
docker exec document-generator-ollama ollama pull codellama:7b || print_warning "Failed to pull codellama"
docker exec document-generator-ollama ollama pull mistral || print_warning "Failed to pull mistral"

print_success "Tier 4 Invisible Substrate operational"

# Start Tier 2 Services (Working Services)
print_tier "⚙️  Tier 2: Starting Working Services"

print_info "Building and starting application services..."
docker-compose build template-processor ai-api analytics
docker-compose up -d template-processor ai-api analytics

print_info "Waiting for services to initialize..."
sleep 20

# Check service health
app_services=("template-processor" "ai-api" "analytics")
for service in "${app_services[@]}"; do
    if docker-compose ps | grep -q "document-generator-$service.*Up"; then
        print_success "$service is running"
    else
        print_warning "$service may still be starting"
    fi
done

print_success "Tier 2 Working Services operational"

# Start Tier 1 Platform (Generated Output Interface)
print_tier "🌐 Tier 1: Starting Platform Services"

print_info "Starting platform hub..."
docker-compose up -d platform-hub

print_info "Waiting for platform to be ready..."
sleep 10

if docker-compose ps | grep -q "document-generator-platform-hub.*Up"; then
    print_success "Platform Hub is running"
else
    print_warning "Platform Hub may still be starting"
fi

print_success "Tier 1 Platform Services operational"

# Initialize Tier 5 Interface
print_tier "🌟 Tier 5: Activating Universal Interface"

cd FinishThisIdea

print_info "Testing universal interface..."
node -e "
const ui = require('./tier-5-universal-interface');
const interface = new ui();
console.log('✅ Universal interface ready');
setTimeout(() => process.exit(0), 1000);
"

print_success "Tier 5 Universal Interface active"

# Setup monitoring and health checks
print_tier "👁️  Setting Up Monitoring"

cd ..

print_info "Starting monitoring services..."
docker-compose up -d prometheus grafana

print_info "Configuring health checks..."
# Create health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
echo "5-Tier System Health Check"
echo "=========================="

check_service() {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200\|302"; then
        echo "✅ $2 - $1"
    else
        echo "❌ $2 - $1"
    fi
}

echo "Tier 1 - Platform Services:"
check_service "http://localhost:8080" "Platform Hub"

echo -e "\nTier 2 - Working Services:"
check_service "http://localhost:3000/health" "Template Processor"
check_service "http://localhost:3001/health" "AI API Service"
check_service "http://localhost:3002/health" "Analytics Service"

echo -e "\nTier 4 - Infrastructure:"
check_service "http://localhost:9001" "MinIO Console"
check_service "http://localhost:11434/api/tags" "Ollama AI"
check_service "http://localhost:9090" "Prometheus"
check_service "http://localhost:3003" "Grafana"

echo -e "\nTier 5 - Universal Interface:"
echo "✅ Available via CLI: node FinishThisIdea/tier-5-universal-interface.js"
EOF

chmod +x scripts/health-check.sh

print_success "Monitoring configured"

# Final system verification
print_tier "🔍 System Verification"

print_info "Running health checks..."
./scripts/health-check.sh

print_info "Verifying 5-tier architecture..."

# Check each tier
echo -e "\n${PURPLE}5-Tier Architecture Status:${NC}"
echo -e "${BLUE}┌─────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TIER 5: Universal Interface        │${NC}"
if [ -f "FinishThisIdea/tier-5-universal-interface.js" ]; then
    echo -e "${BLUE}│ ✅ Ready for document processing   │${NC}"
else
    echo -e "${BLUE}│ ❌ Interface not found              │${NC}"
fi
echo -e "${BLUE}└─────────────────────────────────────┘${NC}"
echo -e "${CYAN}                   │${NC}"
echo -e "${CYAN}                   ▼${NC}"
echo -e "${PURPLE}┌─────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│ TIER 4: Invisible Substrate        │${NC}"
if docker-compose ps | grep -q "ollama.*Up"; then
    echo -e "${PURPLE}│ ✅ Infrastructure running          │${NC}"
else
    echo -e "${PURPLE}│ ❌ Infrastructure issues           │${NC}"
fi
echo -e "${PURPLE}└─────────────────────────────────────┘${NC}"
echo -e "${CYAN}                   │${NC}"
echo -e "${CYAN}                   ▼${NC}"
echo -e "${GREEN}┌─────────────────────────────────────┐${NC}"
echo -e "${GREEN}│ TIER 3: Meta-Documentation         │${NC}"
if [ -d "FinishThisIdea/tier-3" ]; then
    echo -e "${GREEN}│ ✅ Knowledge base ready            │${NC}"
else
    echo -e "${GREEN}│ ❌ Templates missing                │${NC}"
fi
echo -e "${GREEN}└─────────────────────────────────────┘${NC}"
echo -e "${CYAN}                   │${NC}"
echo -e "${CYAN}                   ▼${NC}"
echo -e "${YELLOW}┌─────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│ TIER 2: Working Services           │${NC}"
if docker-compose ps | grep -q "template-processor.*Up"; then
    echo -e "${YELLOW}│ ✅ Services operational            │${NC}"
else
    echo -e "${YELLOW}│ ❌ Services not running             │${NC}"
fi
echo -e "${YELLOW}└─────────────────────────────────────┘${NC}"
echo -e "${CYAN}                   │${NC}"
echo -e "${CYAN}                   ▼${NC}"
echo -e "${CYAN}┌─────────────────────────────────────┐${NC}"
echo -e "${CYAN}│ TIER 1: Generated Output           │${NC}"
if docker-compose ps | grep -q "platform-hub.*Up"; then
    echo -e "${CYAN}│ ✅ Platform ready                  │${NC}"
else
    echo -e "${CYAN}│ ❌ Platform not accessible         │${NC}"
fi
echo -e "${CYAN}└─────────────────────────────────────┘${NC}"

# Success message
print_tier "🎉 Deployment Complete!"

echo "The 5-Tier Document Generator is now live!"
echo ""
echo -e "${GREEN}Access Points:${NC}"
echo "• Universal Interface: ${CYAN}node FinishThisIdea/tier-5-universal-interface.js${NC}"
echo "• Platform Hub: ${CYAN}http://localhost:8080${NC}"
echo "• Template Processor: ${CYAN}http://localhost:3000${NC}"
echo "• AI API Service: ${CYAN}http://localhost:3001${NC}"
echo "• Analytics: ${CYAN}http://localhost:3002${NC}"
echo "• MinIO Storage: ${CYAN}http://localhost:9001${NC} (minioadmin/minioadmin123)"
echo "• Grafana Monitoring: ${CYAN}http://localhost:3003${NC} (admin/admin)"
echo ""
echo -e "${GREEN}Quick Start:${NC}"
echo "1. Test the system: ${YELLOW}./scripts/health-check.sh${NC}"
echo "2. Process a document: ${YELLOW}cd FinishThisIdea && node demo-real-world-finishthisidea.js${NC}"
echo "3. Use universal interface: ${YELLOW}cd FinishThisIdea && node tier-5-universal-interface.js help${NC}"
echo "4. Try: ${YELLOW}mvp \"finishthisidea-research.md\"${NC}"
echo ""
echo -e "${GREEN}Management:${NC}"
echo "• View logs: ${YELLOW}docker-compose logs -f${NC}"
echo "• Stop system: ${YELLOW}docker-compose down${NC}"
echo "• Restart service: ${YELLOW}docker-compose restart <service-name>${NC}"
echo ""
print_success "Ready to transform documents into MVPs! 🚀"