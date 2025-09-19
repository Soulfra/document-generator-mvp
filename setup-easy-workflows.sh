#!/bin/bash

# 🚀 Setup Easy Workflows
# Makes all the workflow and automation systems easy to use

echo "🚀 SETTING UP EASY WORKFLOWS"
echo "============================"
echo "Making Document Generator workflows dead simple..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the Document Generator root directory"
    exit 1
fi

# Make scripts executable
print_info "Making workflow scripts executable..."
chmod +x workflow-runner.js
chmod +x MasterDiscoveryOrchestrator.js
chmod +x UnifiedSimilarityEngine.js 
chmod +x KnowledgeGraphVisualizer.js
chmod +x easy.js
chmod +x setup-easy-workflows.sh

# Check for required dependencies
print_info "Checking dependencies..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Install required npm packages if not present
print_info "Installing required npm packages..."

# Check if js-yaml is installed (required for workflow definitions)
if ! npm list js-yaml &> /dev/null; then
    npm install js-yaml
    print_status "Installed js-yaml for workflow definitions"
fi

# Check if natural is installed (required for similarity engine)
if ! npm list natural &> /dev/null; then
    npm install natural
    print_status "Installed natural for text processing"
fi

# Create workflow directories
print_info "Creating workflow directories..."
mkdir -p workflows
mkdir -p workflow-logs
mkdir -p graph-visualizations
mkdir -p graph-templates
mkdir -p .discovery-cache

print_status "Created workflow directories"

# Create npm scripts shortcuts in package.json
print_info "Adding npm script shortcuts..."

# Check if package.json exists
if [ -f "package.json" ]; then
    # Add scripts using node
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = pkg.scripts || {};
        
        // Add easy workflow scripts
        pkg.scripts['easy'] = 'node easy.js';
        pkg.scripts['workflow'] = 'node workflow-runner.js';
        pkg.scripts['discover'] = 'node MasterDiscoveryOrchestrator.js';
        pkg.scripts['similarity'] = 'node UnifiedSimilarityEngine.js';
        pkg.scripts['visualize'] = 'node KnowledgeGraphVisualizer.js';
        
        // Add convenience shortcuts
        pkg.scripts['setup'] = 'node easy.js setup';
        pkg.scripts['test-all'] = 'node easy.js test';
        pkg.scripts['deploy'] = 'node easy.js deploy';
        pkg.scripts['status'] = 'node easy.js status';
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Added npm script shortcuts');
    "
else
    print_warning "package.json not found, skipping npm script creation"
fi

# Test that everything works
print_info "Testing workflow system..."

# Test workflow runner initialization
if node workflow-runner.js help &> /dev/null; then
    print_status "Workflow Runner is working"
else
    print_error "Workflow Runner failed to initialize"
fi

# Test easy interface
if node easy.js help &> /dev/null; then
    print_status "Easy interface is working"
else
    print_error "Easy interface failed to initialize"
fi

# Create alias suggestions
print_info "Creating shell aliases..."

# Create alias file
cat > easy-aliases.sh << 'EOF'
#!/bin/bash
# 🚀 Document Generator Easy Aliases
# Add these to your ~/.bashrc or ~/.zshrc for super easy access

alias easy="node easy.js"
alias workflow="node workflow-runner.js" 
alias discover="node MasterDiscoveryOrchestrator.js"

# Super quick shortcuts
alias dg-setup="node easy.js setup"
alias dg-test="node easy.js test"
alias dg-deploy="node easy.js deploy"
alias dg-status="node easy.js status"
alias dg-find="node easy.js find"
alias dg-debug="node easy.js debug"

# Document processing
alias doc2mvp="node easy.js doc"

echo "🎯 Document Generator aliases loaded!"
echo "Try: easy setup, dg-test, doc2mvp ./mydoc.md"
EOF

chmod +x easy-aliases.sh
print_status "Created easy-aliases.sh (source this file to add shortcuts to your shell)"

# Show final status and usage
echo ""
echo "🎉 EASY WORKFLOWS SETUP COMPLETE!"
echo "================================="
echo ""
echo "🚀 Quick Start:"
echo "   node easy.js setup              # Complete system setup"
echo "   node easy.js test               # Run all tests"
echo "   node easy.js doc ./mydoc.md     # Process document to MVP"
echo "   node easy.js status             # Check system health"
echo ""
echo "📋 All Available Commands:"
echo "   node easy.js help               # Show all commands"
echo ""
echo "🔧 Alternative Usage (with npm):"
echo "   npm run easy setup              # Same as above but with npm"
echo "   npm run test-all                # Run comprehensive tests"
echo "   npm run deploy                  # Deploy to production"
echo ""
echo "⚡ Super Quick Aliases (optional):"
echo "   source ./easy-aliases.sh        # Add shell aliases"
echo "   easy setup                      # Use 'easy' instead of 'node easy.js'"
echo ""
echo "📚 What you now have:"
echo "   ✅ Unified Workflow Runner with 5+ built-in workflows"
echo "   ✅ Master Discovery Orchestrator with 6 similarity algorithms"
echo "   ✅ Knowledge Graph Visualizer with interactive exports"
echo "   ✅ Dead-simple 'easy' command interface"
echo "   ✅ Integration with all 100+ existing scripts"
echo "   ✅ Real-time service monitoring via ObsidianVault"
echo ""
echo "💡 Next Steps:"
echo "   1. Run: node easy.js setup"
echo "   2. Try: node easy.js find \"authentication\""
echo "   3. Test: node easy.js doc ./your-document.md"
echo ""
echo "🎯 Everything is now EASY!"