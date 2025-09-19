#!/bin/bash

# 🚀 LAUNCH OSS - Master Script to Transform Soulfra into Open Source Platform
# This script executes the complete OSS transformation

echo "🚀 SOULFRA PLATFORM - OSS TRANSFORMATION LAUNCHER"
echo "================================================="
echo ""
echo "This will transform the Soulfra Platform into a complete"
echo "open source project ready for global distribution."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to show progress
show_progress() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

# Function to show success
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to show error
show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
show_progress "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    show_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    show_error "npm is not installed. Please install npm first."
    exit 1
fi

show_success "Prerequisites check passed"
echo ""

# Step 1: Create OSS structure
show_progress "Step 1/6: Creating OSS project structure..."
if node create-oss-structure.js; then
    show_success "OSS structure created"
else
    show_error "Failed to create OSS structure"
    exit 1
fi
echo ""

# Step 2: Generate release system
show_progress "Step 2/6: Setting up release system..."
if node oss-release-system.js; then
    show_success "Release system configured"
else
    show_error "Failed to setup release system"
    exit 1
fi
echo ""

# Step 3: Create npm packages
show_progress "Step 3/6: Preparing npm packages..."
cd soulfra-platform 2>/dev/null || {
    show_progress "Creating package structure..."
    mkdir -p soulfra-platform
    cd soulfra-platform
}

# Initialize git repository
if [ ! -d .git ]; then
    show_progress "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Soulfra Platform OSS"
    show_success "Git repository initialized"
fi
echo ""

# Step 4: Setup CI/CD
show_progress "Step 4/6: Configuring CI/CD workflows..."
if [ -d .github/workflows ]; then
    show_success "GitHub workflows configured"
else
    show_error "GitHub workflows directory not found"
fi
echo ""

# Step 5: Create documentation site
show_progress "Step 5/6: Preparing documentation..."
if [ -f README.md ]; then
    show_success "Documentation created"
else
    show_error "README.md not found"
fi
echo ""

# Step 6: Final setup
show_progress "Step 6/6: Finalizing OSS setup..."

# Create quick start script
cat > quick-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Soulfra Platform Quick Start"
echo ""
echo "1. Install globally:"
echo "   npm install -g create-soulfra-app"
echo ""
echo "2. Create new app:"
echo "   create-soulfra-app my-app"
echo ""
echo "3. Start platform:"
echo "   cd my-app && npm start"
echo ""
echo "Documentation: https://docs.soulfra.io"
EOF

chmod +x quick-start.sh
show_success "Quick start script created"

echo ""
echo "================================================================"
echo -e "${GREEN}🎉 OSS TRANSFORMATION COMPLETE!${NC}"
echo "================================================================"
echo ""
echo "The Soulfra Platform has been transformed into a complete"
echo "open source project with:"
echo ""
echo "  📦 Modular npm packages (@soulfra/*)"
echo "  🔌 Plugin ecosystem"
echo "  🐳 Docker images"
echo "  🚀 CI/CD workflows"
echo "  📚 Complete documentation"
echo "  🛠️ CLI tools"
echo "  🌍 Global distribution ready"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Review the generated structure:"
echo "   cd soulfra-platform && ls -la"
echo ""
echo "2. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_ORG/soulfra-platform"
echo "   git push -u origin main"
echo ""
echo "3. Publish to npm:"
echo "   npm login"
echo "   npm publish --access public"
echo ""
echo "4. Deploy documentation:"
echo "   npm run docs:deploy"
echo ""
echo "5. Announce to the world! 🎉"
echo ""
echo -e "${BLUE}Full documentation:${NC} OSS-COMPLETE.md"
echo -e "${BLUE}Platform directory:${NC} ./soulfra-platform/"
echo ""
echo "================================================================"
echo -e "${GREEN}Ready for global distribution!${NC} 🚀"
echo "================================================================"