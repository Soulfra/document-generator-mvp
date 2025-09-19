#!/bin/bash

# Document Generator - Quick Production Start Script
# One-command setup for production deployment

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Document Generator Production Setup${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    else
        log_success "Docker found: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    else
        log_success "Docker Compose found: $(docker-compose --version)"
    fi
    
    # Check Node.js (optional for development)
    if command -v node &> /dev/null; then
        log_success "Node.js found: $(node --version)"
    else
        log_warning "Node.js not found (optional for runtime)"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    else
        log_success "Git found: $(git --version)"
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again."
        exit 1
    fi
    
    log_success "All prerequisites satisfied!"
    echo ""
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            log_info "Creating .env from .env.example..."
            cp .env.example .env
            log_warning "Please edit .env and add your API keys!"
            
            # Prompt for essential keys
            read -p "Enter your Anthropic API key (or press Enter to skip): " anthropic_key
            if [ ! -z "$anthropic_key" ]; then
                sed -i.bak "s/your_anthropic_key_here/$anthropic_key/" .env
            fi
            
            read -p "Enter your OpenAI API key (or press Enter to skip): " openai_key
            if [ ! -z "$openai_key" ]; then
                sed -i.bak "s/your_openai_key_here/$openai_key/" .env
            fi
            
            # Generate secure passwords
            log_info "Generating secure passwords..."
            postgres_pass=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            jwt_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
            session_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
            
            sed -i.bak "s/your_secure_password_here/$postgres_pass/" .env
            sed -i.bak "s/your_jwt_secret_here/$jwt_secret/" .env
            sed -i.bak "s/your_session_secret_here/$session_secret/" .env
            
            # Clean up backup files
            rm -f .env.bak
            
            log_success "Environment file created!"
        else
            log_error ".env.example not found!"
            exit 1
        fi
    else
        log_success "Environment file already exists"
    fi
    
    # Create required directories
    log_info "Creating required directories..."
    mkdir -p data/postgres data/redis data/minio logs
    log_success "Directories created"
    echo ""
}

# Check Docker daemon
check_docker_daemon() {
    log_info "Checking Docker daemon..."
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running!"
        log_info "Please start Docker and try again."
        exit 1
    fi
    
    log_success "Docker daemon is running"
    echo ""
}

# Build and start services
start_services() {
    log_info "Building and starting services..."
    
    # Stop any existing services
    if [ "$(docker-compose ps -q)" ]; then
        log_info "Stopping existing services..."
        docker-compose down
    fi
    
    # Build images
    log_info "Building Docker images (this may take a few minutes)..."
    docker-compose build
    
    # Start services
    log_info "Starting all services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to initialize..."
    sleep 10
    
    log_success "All services started!"
    echo ""
}

# Initialize database
initialize_database() {
    log_info "Initializing database..."
    
    # Wait for PostgreSQL to be ready
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U docgen &> /dev/null; then
            log_success "PostgreSQL is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for PostgreSQL... ($attempt/$max_attempts)"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL failed to start"
        exit 1
    fi
    
    # Run database schema
    if [ -f schema.sql ]; then
        log_info "Applying database schema..."
        docker-compose exec -T postgres psql -U docgen -d document_generator < schema.sql
        log_success "Database schema applied"
    else
        log_warning "schema.sql not found, skipping database initialization"
    fi
    
    echo ""
}

# Pull Ollama models
setup_ollama() {
    log_info "Setting up Ollama models..."
    
    # Wait for Ollama to be ready
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            log_success "Ollama is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for Ollama... ($attempt/$max_attempts)"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_warning "Ollama failed to start, skipping model download"
        return
    fi
    
    # Pull required models
    log_info "Pulling required Ollama models (this may take a while)..."
    
    models=("codellama:7b" "mistral" "llama2")
    for model in "${models[@]}"; do
        log_info "Pulling $model..."
        if docker exec document-generator-ollama ollama pull $model; then
            log_success "$model pulled successfully"
        else
            log_warning "Failed to pull $model, continuing..."
        fi
    done
    
    echo ""
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    services=(
        "http://localhost:8080/health:Platform Hub"
        "http://localhost:3001/health:AI API Service"
        "http://localhost:3002/health:Analytics Service"
        "http://localhost:8080/api/characters/status:Character System"
    )
    
    local all_healthy=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service"
        
        if curl -s -f "$url" &> /dev/null; then
            log_success "$name is healthy"
        else
            log_warning "$name is not responding"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy!"
    else
        log_warning "Some services are not responding. Check logs with: docker-compose logs"
    fi
    
    echo ""
}

# Display access information
display_access_info() {
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}🎉 Document Generator is Ready!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo ""
    echo "Access the following services:"
    echo ""
    echo -e "${BLUE}Main Services:${NC}"
    echo "  • Platform Hub: http://localhost:8080"
    echo "  • Template Processor: http://localhost:3000"
    echo "  • AI API Service: http://localhost:3001"
    echo "  • Analytics Dashboard: http://localhost:3002"
    echo ""
    echo -e "${BLUE}Infrastructure:${NC}"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo "  • MinIO Console: http://localhost:9001"
    echo "  • Ollama API: http://localhost:11434"
    echo ""
    echo -e "${BLUE}Quick Commands:${NC}"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart services: docker-compose restart"
    echo "  • View status: docker-compose ps"
    echo ""
    echo -e "${BLUE}Test the system:${NC}"
    echo "  curl http://localhost:8080/api/characters/alice/process \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"task\": \"design_system\", \"document\": \"Test content\"}'"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Review production-setup.md for detailed configuration"
    echo "  2. Check character-integration-guide.md for API usage"
    echo "  3. Run tests with: npm test"
    echo "  4. Monitor logs: docker-compose logs -f"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    check_docker_daemon
    setup_environment
    start_services
    initialize_database
    setup_ollama
    run_health_checks
    display_access_info
}

# Run main function
main

# Exit successfully
exit 0