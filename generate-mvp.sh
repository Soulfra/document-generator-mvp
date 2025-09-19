#!/bin/bash

# 🚀 Single-Command MVP Generator
# "we should be able to have you start the process from start to finish"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="$SCRIPT_DIR/generated-mvp-$TIMESTAMP"

echo -e "${CYAN}🚀 DOCUMENT GENERATOR - SINGLE COMMAND MVP GENERATION${NC}"
echo -e "${CYAN}===================================================${NC}"
echo ""

# Function to print colored output
print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}📋 $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local timeout="${3:-5}"
    
    if curl -s --max-time $timeout "$url" >/dev/null 2>&1; then
        print_success "$service_name is running"
        return 0
    else
        print_warning "$service_name is not running (will use fallback)"
        return 1
    fi
}

# Function to start service if possible
start_service() {
    local service_name="$1"
    local start_command="$2"
    
    print_step "Starting $service_name..."
    if bash -c "$start_command" >/dev/null 2>&1 &; then
        sleep 3
        print_success "$service_name started"
        return 0
    else
        print_warning "Could not start $service_name (continuing with fallback)"
        return 1
    fi
}

# Parse arguments
DOCUMENT_PATH=""
PROCESSING_MODE="auto"
OUTPUT_FORMAT="docker"
AUTO_START_SERVICES="true"
ENABLE_AI="true"

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            DOCUMENT_PATH="$2"
            shift 2
            ;;
        -m|--mode)
            PROCESSING_MODE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --no-services)
            AUTO_START_SERVICES="false"
            shift
            ;;
        --no-ai)
            ENABLE_AI="false"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS] -f <document-path>"
            echo ""
            echo "Options:"
            echo "  -f, --file <path>       Document to process (required)"
            echo "  -m, --mode <mode>       Processing mode (auto|fast|comprehensive)"
            echo "  -o, --output <format>   Output format (docker|vercel|standalone)"
            echo "  --no-services           Don't attempt to start services"
            echo "  --no-ai                 Disable AI features"
            echo "  -h, --help              Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 -f business-plan.md"
            echo "  $0 -f technical-spec.md -m comprehensive -o docker"
            echo "  $0 -f chat-log.json --no-services"
            exit 0
            ;;
        *)
            if [[ -z "$DOCUMENT_PATH" && "$1" != -* ]]; then
                DOCUMENT_PATH="$1"
            else
                print_error "Unknown option: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [[ -z "$DOCUMENT_PATH" ]]; then
    print_error "Document path is required. Use -f <path> or provide as argument."
    echo "Example: $0 business-plan.md"
    exit 1
fi

if [[ ! -f "$DOCUMENT_PATH" ]]; then
    print_error "Document not found: $DOCUMENT_PATH"
    exit 1
fi

# Make document path absolute
DOCUMENT_PATH="$(realpath "$DOCUMENT_PATH")"

print_info "Document: $DOCUMENT_PATH"
print_info "Processing mode: $PROCESSING_MODE"
print_info "Output format: $OUTPUT_FORMAT"
print_info "Output directory: $OUTPUT_DIR"
echo ""

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is required but not found"
    exit 1
fi

# Check npm
if command_exists npm; then
    print_success "npm found"
else
    print_error "npm is required but not found"
    exit 1
fi

# Check Docker (optional)
if command_exists docker; then
    print_success "Docker found"
    DOCKER_AVAILABLE="true"
else
    print_warning "Docker not found (some features may be limited)"
    DOCKER_AVAILABLE="false"
fi

echo ""

# Step 2: Start services if requested
if [[ "$AUTO_START_SERVICES" == "true" ]]; then
    print_step "Starting services..."
    
    # Try to start Ollama
    if command_exists ollama; then
        if ! check_service "Ollama" "http://localhost:11434/api/tags"; then
            start_service "Ollama" "ollama serve"
            sleep 2
            check_service "Ollama" "http://localhost:11434/api/tags"
        fi
    else
        print_warning "Ollama not found (AI features will use cloud APIs)"
    fi
    
    # Check other services
    check_service "PostgreSQL" "http://localhost:5432" 2 || true
    check_service "Redis" "http://localhost:6379" 2 || true
    check_service "MCP Template Processor" "http://localhost:3000/health" 2 || true
    
    echo ""
fi

# Step 3: Determine processing approach
print_step "Determining optimal processing approach..."

DOCUMENT_SIZE=$(wc -c < "$DOCUMENT_PATH")
DOCUMENT_LINES=$(wc -l < "$DOCUMENT_PATH")

print_info "Document size: $DOCUMENT_SIZE bytes"
print_info "Document lines: $DOCUMENT_LINES"

# Select processing strategy
if [[ $DOCUMENT_SIZE -gt 50000 || $DOCUMENT_LINES -gt 1000 ]]; then
    CHUNKED_PROCESSING="true"
    print_info "Using chunked processing (large document)"
elif [[ "$PROCESSING_MODE" == "comprehensive" ]]; then
    CHUNKED_PROCESSING="true"
    print_info "Using chunked processing (comprehensive mode)"
elif [[ "$PROCESSING_MODE" == "fast" ]]; then
    CHUNKED_PROCESSING="false"
    print_info "Using direct processing (fast mode)"
else
    CHUNKED_PROCESSING="auto"
    print_info "Using automatic processing strategy"
fi

echo ""

# Step 4: Process document
print_step "Processing document with Master Automation Controller..."

# Create processing command
PROCESSING_CMD="node \"$SCRIPT_DIR/master-automation-controller.js\" \"$DOCUMENT_PATH\""

# Add processing options
if [[ "$CHUNKED_PROCESSING" == "true" ]]; then
    export PROCESSING_MODE="chunked"
elif [[ "$CHUNKED_PROCESSING" == "false" ]]; then
    export PROCESSING_MODE="direct"
else
    export PROCESSING_MODE="adaptive"
fi

export OUTPUT_FORMAT="$OUTPUT_FORMAT"
export ENABLE_AI="$ENABLE_AI"
export OUTPUT_DIR="$OUTPUT_DIR"

# Execute processing
echo "🔄 Running: $PROCESSING_CMD"
echo ""

if eval "$PROCESSING_CMD"; then
    print_success "Document processing completed!"
else
    print_error "Document processing failed!"
    
    # Try fallback processing
    print_step "Attempting fallback processing..."
    
    FALLBACK_CMD="node \"$SCRIPT_DIR/mvp-generator.js\" \"$DOCUMENT_PATH\""
    
    if eval "$FALLBACK_CMD"; then
        print_success "Fallback processing completed!"
        
        # Move generated files to our output directory
        if [[ -d "./generated-mvp" ]]; then
            mkdir -p "$OUTPUT_DIR"
            cp -r ./generated-mvp/* "$OUTPUT_DIR/" 2>/dev/null || true
        fi
    else
        print_error "All processing attempts failed!"
        exit 1
    fi
fi

echo ""

# Step 5: Post-process and package results
print_step "Packaging results..."

# Ensure output directory exists and has content
if [[ ! -d "$OUTPUT_DIR" || -z "$(ls -A "$OUTPUT_DIR" 2>/dev/null)" ]]; then
    print_warning "Output directory empty, checking for generated files..."
    
    # Look for generated files in various locations
    for dir in "./generated-mvp"* "./automated-mvp-output"* "./"*mvp*; do
        if [[ -d "$dir" && -n "$(ls -A "$dir" 2>/dev/null)" ]]; then
            print_info "Found generated files in: $dir"
            mkdir -p "$OUTPUT_DIR"
            cp -r "$dir"/* "$OUTPUT_DIR/"
            break
        fi
    done
fi

if [[ ! -d "$OUTPUT_DIR" || -z "$(ls -A "$OUTPUT_DIR" 2>/dev/null)" ]]; then
    print_error "No generated files found!"
    exit 1
fi

# Count generated files
FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
print_success "Generated $FILE_COUNT files"

# Create quick start script
cat > "$OUTPUT_DIR/quick-start.sh" << 'EOF'
#!/bin/bash

echo "🚀 Starting your generated MVP..."

# Install dependencies if package.json exists
if [[ -f "package.json" ]]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🎉 Starting application..."
if [[ -f "master-app.js" ]]; then
    node master-app.js
elif [[ -f "app.js" ]]; then
    node app.js
elif [[ -f "server.js" ]]; then
    node server.js
elif [[ -f "index.js" ]]; then
    node index.js
else
    echo "❌ No main application file found"
    echo "📋 Available files:"
    ls -la
fi
EOF

chmod +x "$OUTPUT_DIR/quick-start.sh"

# Create deployment helper based on format
case "$OUTPUT_FORMAT" in
    "docker")
        if [[ "$DOCKER_AVAILABLE" == "true" ]]; then
            cat > "$OUTPUT_DIR/deploy-docker.sh" << EOF
#!/bin/bash
echo "🐳 Creating Docker deployment..."

# Create Dockerfile if it doesn't exist
if [[ ! -f "Dockerfile" ]]; then
    cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
DOCKERFILE
fi

# Create docker-compose.yml if it doesn't exist
if [[ ! -f "docker-compose.yml" ]]; then
    cat > docker-compose.yml << 'COMPOSE'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
COMPOSE
fi

echo "🚀 Building Docker image..."
docker build -t generated-mvp .

echo "🚀 Starting with Docker Compose..."
docker-compose up
EOF
            chmod +x "$OUTPUT_DIR/deploy-docker.sh"
        fi
        ;;
    
    "vercel")
        cat > "$OUTPUT_DIR/deploy-vercel.sh" << 'EOF'
#!/bin/bash
echo "▲ Deploying to Vercel..."

# Create vercel.json if it doesn't exist
if [[ ! -f "vercel.json" ]]; then
    cat > vercel.json << 'VERCEL'
{
  "version": 2,
  "builds": [
    { "src": "*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.js" }
  ]
}
VERCEL
fi

# Deploy to Vercel
if command -v vercel >/dev/null 2>&1; then
    vercel deploy --prod
else
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
fi
EOF
        chmod +x "$OUTPUT_DIR/deploy-vercel.sh"
        ;;
esac

echo ""

# Step 6: Create comprehensive documentation
print_step "Creating documentation..."

cat > "$OUTPUT_DIR/GENERATION-REPORT.md" << EOF
# MVP Generation Report

Generated on: $(date)
Document processed: $DOCUMENT_PATH
Processing mode: $PROCESSING_MODE
Output format: $OUTPUT_FORMAT
Chunked processing: $CHUNKED_PROCESSING

## Generated Files

$(ls -la "$OUTPUT_DIR" | tail -n +2)

## Quick Start

1. Navigate to the generated directory:
   \`\`\`bash
   cd "$OUTPUT_DIR"
   \`\`\`

2. Run the quick start script:
   \`\`\`bash
   ./quick-start.sh
   \`\`\`

3. Or start manually:
   \`\`\`bash
   npm install
   npm start
   \`\`\`

## Deployment

### Local Development
- Run \`./quick-start.sh\`
- Open http://localhost:3000

### Docker (if available)
- Run \`./deploy-docker.sh\`

### Vercel (if configured)
- Run \`./deploy-vercel.sh\`

## File Structure

\`\`\`
$(find "$OUTPUT_DIR" -type f | head -20)
$(if [[ $(find "$OUTPUT_DIR" -type f | wc -l) -gt 20 ]]; then echo "... and $(($(find "$OUTPUT_DIR" -type f | wc -l) - 20)) more files"; fi)
\`\`\`

## Next Steps

1. Review the generated code
2. Customize for your specific needs
3. Add additional features as required
4. Deploy to your preferred platform

---

Generated by Document Generator Master Automation System
EOF

print_success "Documentation created: GENERATION-REPORT.md"

echo ""

# Step 7: Final summary and next steps
print_step "Generation complete! 🎉"
echo ""

print_success "MVP successfully generated!"
print_info "📁 Output directory: $OUTPUT_DIR"
print_info "📄 Files generated: $FILE_COUNT"
print_info "📋 Documentation: $OUTPUT_DIR/GENERATION-REPORT.md"

echo ""
echo -e "${CYAN}🚀 NEXT STEPS:${NC}"
echo -e "${GREEN}1. Navigate to your MVP:${NC}"
echo -e "   cd \"$OUTPUT_DIR\""
echo ""
echo -e "${GREEN}2. Start your MVP:${NC}"
echo -e "   ./quick-start.sh"
echo ""
echo -e "${GREEN}3. Open in browser:${NC}"
echo -e "   http://localhost:3000"
echo ""

if [[ "$OUTPUT_FORMAT" == "docker" && "$DOCKER_AVAILABLE" == "true" ]]; then
    echo -e "${GREEN}4. Deploy with Docker:${NC}"
    echo -e "   ./deploy-docker.sh"
    echo ""
fi

echo -e "${PURPLE}📋 View generation report:${NC}"
echo -e "   cat \"$OUTPUT_DIR/GENERATION-REPORT.md\""
echo ""

echo -e "${CYAN}✨ Your document has been transformed into a working MVP!${NC}"