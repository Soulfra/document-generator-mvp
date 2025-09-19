#!/bin/bash
#
# Document Generator Demo System Installer
# Complete installation and setup script for all distribution methods
#

echo "📦 DOCUMENT GENERATOR DEMO SYSTEM INSTALLER"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALLER_VERSION="1.0.0"
INSTALL_DIR="$HOME/document-generator-demo"
BACKUP_DIR="$HOME/document-generator-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$HOME/document-generator-install.log"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get OS information
get_os_info() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        PACKAGE_MANAGER="brew"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
        if command_exists apt-get; then
            PACKAGE_MANAGER="apt"
        elif command_exists yum; then
            PACKAGE_MANAGER="yum"
        elif command_exists pacman; then
            PACKAGE_MANAGER="pacman"
        else
            PACKAGE_MANAGER="unknown"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="Windows"
        PACKAGE_MANAGER="manual"
    else
        OS="Unknown"
        PACKAGE_MANAGER="manual"
    fi
}

# Function to install Node.js
install_nodejs() {
    log "${YELLOW}📦 Installing Node.js...${NC}"
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log "${GREEN}✅ Node.js already installed: $NODE_VERSION${NC}"
        return 0
    fi
    
    case $PACKAGE_MANAGER in
        "brew")
            brew install node
            ;;
        "apt")
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "yum")
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs npm
            ;;
        *)
            log "${RED}❌ Please install Node.js manually from https://nodejs.org/${NC}"
            return 1
            ;;
    esac
    
    if command_exists node; then
        log "${GREEN}✅ Node.js installed successfully${NC}"
        return 0
    else
        log "${RED}❌ Node.js installation failed${NC}"
        return 1
    fi
}

# Function to install Python
install_python() {
    log "${YELLOW}🐍 Installing Python 3...${NC}"
    
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
        log "${GREEN}✅ Python 3 already installed: $PYTHON_VERSION${NC}"
        return 0
    fi
    
    case $PACKAGE_MANAGER in
        "brew")
            brew install python@3.11
            ;;
        "apt")
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip
            ;;
        "yum")
            sudo yum install -y python3 python3-pip
            ;;
        *)
            log "${RED}❌ Please install Python 3 manually from https://python.org/${NC}"
            return 1
            ;;
    esac
    
    if command_exists python3; then
        log "${GREEN}✅ Python 3 installed successfully${NC}"
        return 0
    else
        log "${RED}❌ Python 3 installation failed${NC}"
        return 1
    fi
}

# Function to install FFmpeg
install_ffmpeg() {
    log "${YELLOW}🎬 Installing FFmpeg...${NC}"
    
    if command_exists ffmpeg; then
        log "${GREEN}✅ FFmpeg already installed${NC}"
        return 0
    fi
    
    case $PACKAGE_MANAGER in
        "brew")
            brew install ffmpeg
            ;;
        "apt")
            sudo apt-get install -y ffmpeg
            ;;
        "yum")
            sudo yum install -y ffmpeg
            ;;
        *)
            log "${YELLOW}⚠️ FFmpeg not installed - screen recording will be limited${NC}"
            return 1
            ;;
    esac
    
    if command_exists ffmpeg; then
        log "${GREEN}✅ FFmpeg installed successfully${NC}"
        return 0
    else
        log "${YELLOW}⚠️ FFmpeg installation failed - continuing without it${NC}"
        return 1
    fi
}

# Function to install ImageMagick
install_imagemagick() {
    log "${YELLOW}🖼️ Installing ImageMagick...${NC}"
    
    if command_exists convert; then
        log "${GREEN}✅ ImageMagick already installed${NC}"
        return 0
    fi
    
    case $PACKAGE_MANAGER in
        "brew")
            brew install imagemagick
            ;;
        "apt")
            sudo apt-get install -y imagemagick
            ;;
        "yum")
            sudo yum install -y ImageMagick
            ;;
        *)
            log "${YELLOW}⚠️ ImageMagick not installed - GIF processing will be limited${NC}"
            return 1
            ;;
    esac
    
    if command_exists convert; then
        log "${GREEN}✅ ImageMagick installed successfully${NC}"
        return 0
    else
        log "${YELLOW}⚠️ ImageMagick installation failed - continuing without it${NC}"
        return 1
    fi
}

# Function to install Node.js packages
install_node_packages() {
    log "${YELLOW}📦 Installing Node.js packages...${NC}"
    
    cd "$INSTALL_DIR" || return 1
    
    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        cat > package.json << 'EOF'
{
  "name": "document-generator-demo",
  "version": "1.0.0",
  "description": "Document Generator Demo System",
  "main": "unified-demo-hub.html",
  "dependencies": {
    "puppeteer": "^21.6.1",
    "ws": "^8.14.2",
    "axios": "^1.6.0",
    "csv-writer": "^1.6.0",
    "exceljs": "^4.4.0",
    "archiver": "^5.3.2"
  }
}
EOF
    fi
    
    npm install --production
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ Node.js packages installed successfully${NC}"
        return 0
    else
        log "${RED}❌ Node.js package installation failed${NC}"
        return 1
    fi
}

# Function to install Python packages
install_python_packages() {
    log "${YELLOW}🐍 Installing Python packages...${NC}"
    
    pip3 install flask flask-cors pandas xlsxwriter websocket-client
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ Python packages installed successfully${NC}"
        return 0
    else
        log "${RED}❌ Python package installation failed${NC}"
        return 1
    fi
}

# Function to setup directories
setup_directories() {
    log "${YELLOW}📁 Setting up directories...${NC}"
    
    # Create install directory
    if [ ! -d "$INSTALL_DIR" ]; then
        mkdir -p "$INSTALL_DIR"
        log "${GREEN}✅ Created install directory: $INSTALL_DIR${NC}"
    fi
    
    # Create subdirectories
    cd "$INSTALL_DIR" || return 1
    
    mkdir -p {logs,quick-demos,context-screenshots,demo-screenshots,distributions}
    
    log "${GREEN}✅ Directory structure created${NC}"
    return 0
}

# Function to copy demo system files
copy_demo_files() {
    log "${YELLOW}📋 Copying demo system files...${NC}"
    
    # List of essential files to copy
    local files=(
        "unified-demo-hub.html"
        "html5-presentation-engine.html"
        "demo-capture-studio.js"
        "quick-demo-generator.js"
        "context-switching-engine.js"
        "launch-demo-system.sh"
        "terms-of-service.html"
        "age-verification.html"
        "user-onboarding.html"
        "create-distribution-packages.js"
        "DEMO-SYSTEM-COMPLETE.md"
        "README.md"
    )
    
    local copied=0
    local total=${#files[@]}
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$INSTALL_DIR/"
            ((copied++))
            log "📄 Copied: $file"
        else
            log "${YELLOW}⚠️ File not found: $file${NC}"
        fi
    done
    
    log "${GREEN}✅ Copied $copied/$total demo system files${NC}"
    
    # Make scripts executable
    chmod +x "$INSTALL_DIR"/*.sh
    chmod +x "$INSTALL_DIR"/*.js
    
    return 0
}

# Function to create launcher scripts
create_launchers() {
    log "${YELLOW}🚀 Creating launcher scripts...${NC}"
    
    cd "$INSTALL_DIR" || return 1
    
    # Create main launcher
    cat > "start-demo-system.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Document Generator Demo System..."
echo "============================================="

cd "$(dirname "$0")"

# Check if services are already running
if ./launch-demo-system.sh status >/dev/null 2>&1; then
    echo "✅ Demo system is already running"
    echo "🌐 Opening unified demo hub..."
else
    echo "🎬 Starting demo services..."
    ./launch-demo-system.sh
    sleep 3
fi

# Open the main demo hub
if command -v open >/dev/null 2>&1; then
    open ./unified-demo-hub.html
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open ./unified-demo-hub.html
elif command -v start >/dev/null 2>&1; then
    start ./unified-demo-hub.html
else
    echo "📱 Please open ./unified-demo-hub.html in your browser"
fi

echo "✅ Demo system started!"
EOF
    
    # Create web launcher
    cat > "start-web-demo.sh" << 'EOF'
#!/bin/bash
echo "🌐 Starting Web Demo..."

cd "$(dirname "$0")"

# Open terms of service (start of user flow)
if command -v open >/dev/null 2>&1; then
    open ./terms-of-service.html
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open ./terms-of-service.html
elif command -v start >/dev/null 2>&1; then
    start ./terms-of-service.html
else
    echo "📱 Please open ./terms-of-service.html in your browser"
fi
EOF
    
    # Create presentation launcher
    cat > "start-presentation.sh" << 'EOF'
#!/bin/bash
echo "📺 Starting Presentation..."

cd "$(dirname "$0")"

if command -v open >/dev/null 2>&1; then
    open ./html5-presentation-engine.html
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open ./html5-presentation-engine.html
elif command -v start >/dev/null 2>&1; then
    start ./html5-presentation-engine.html
else
    echo "📱 Please open ./html5-presentation-engine.html in your browser"
fi
EOF
    
    # Create distribution generator
    cat > "create-distributions.sh" << 'EOF'
#!/bin/bash
echo "📦 Creating Distribution Packages..."

cd "$(dirname "$0")"

if command -v node >/dev/null 2>&1; then
    node create-distribution-packages.js
    echo "✅ Distribution packages created in ./distributions/"
else
    echo "❌ Node.js required for distribution creation"
    exit 1
fi
EOF
    
    # Make all scripts executable
    chmod +x *.sh
    
    log "${GREEN}✅ Launcher scripts created${NC}"
    return 0
}

# Function to create desktop entries (Linux)
create_desktop_entries() {
    if [ "$OS" != "Linux" ]; then
        return 0
    fi
    
    log "${YELLOW}🖥️ Creating desktop entries...${NC}"
    
    local desktop_dir="$HOME/.local/share/applications"
    mkdir -p "$desktop_dir"
    
    cat > "$desktop_dir/document-generator-demo.desktop" << EOF
[Desktop Entry]
Name=Document Generator Demo
Comment=Professional demo and presentation system
Exec=$INSTALL_DIR/start-demo-system.sh
Icon=applications-multimedia
Terminal=false
Type=Application
Categories=Office;Presentation;Development;
StartupNotify=true
EOF
    
    chmod +x "$desktop_dir/document-generator-demo.desktop"
    
    log "${GREEN}✅ Desktop entry created${NC}"
    return 0
}

# Function to run system tests
run_tests() {
    log "${YELLOW}🧪 Running system tests...${NC}"
    
    cd "$INSTALL_DIR" || return 1
    
    local tests_passed=0
    local tests_total=6
    
    # Test 1: Node.js availability
    if command_exists node; then
        log "${GREEN}✅ Test 1/6: Node.js available${NC}"
        ((tests_passed++))
    else
        log "${RED}❌ Test 1/6: Node.js not available${NC}"
    fi
    
    # Test 2: Python availability
    if command_exists python3; then
        log "${GREEN}✅ Test 2/6: Python 3 available${NC}"
        ((tests_passed++))
    else
        log "${RED}❌ Test 2/6: Python 3 not available${NC}"
    fi
    
    # Test 3: Essential files present
    if [ -f "unified-demo-hub.html" ] && [ -f "terms-of-service.html" ]; then
        log "${GREEN}✅ Test 3/6: Essential files present${NC}"
        ((tests_passed++))
    else
        log "${RED}❌ Test 3/6: Essential files missing${NC}"
    fi
    
    # Test 4: Scripts executable
    if [ -x "start-demo-system.sh" ]; then
        log "${GREEN}✅ Test 4/6: Scripts executable${NC}"
        ((tests_passed++))
    else
        log "${RED}❌ Test 4/6: Scripts not executable${NC}"
    fi
    
    # Test 5: Node packages (if Node.js available)
    if command_exists node && [ -d "node_modules" ]; then
        log "${GREEN}✅ Test 5/6: Node packages installed${NC}"
        ((tests_passed++))
    else
        log "${YELLOW}⚠️ Test 5/6: Node packages not fully installed${NC}"
    fi
    
    # Test 6: Directory structure
    if [ -d "logs" ] && [ -d "quick-demos" ]; then
        log "${GREEN}✅ Test 6/6: Directory structure correct${NC}"
        ((tests_passed++))
    else
        log "${RED}❌ Test 6/6: Directory structure incomplete${NC}"
    fi
    
    log "${CYAN}📊 Tests completed: $tests_passed/$tests_total passed${NC}"
    
    if [ $tests_passed -ge 4 ]; then
        log "${GREEN}✅ System tests passed - installation successful${NC}"
        return 0
    else
        log "${RED}❌ System tests failed - installation may be incomplete${NC}"
        return 1
    fi
}

# Function to show completion message
show_completion() {
    log ""
    log "${GREEN}🎉 INSTALLATION COMPLETE!${NC}"
    log "${GREEN}=========================${NC}"
    log ""
    log "${CYAN}📁 Installation Location:${NC} $INSTALL_DIR"
    log "${CYAN}📝 Installation Log:${NC} $LOG_FILE"
    log ""
    log "${CYAN}🚀 Quick Start Options:${NC}"
    log ""
    log "${YELLOW}For Full Demo System:${NC}"
    log "  cd '$INSTALL_DIR' && ./start-demo-system.sh"
    log ""
    log "${YELLOW}For Web Browser Only:${NC}"
    log "  cd '$INSTALL_DIR' && ./start-web-demo.sh"
    log ""
    log "${YELLOW}For Presentation Only:${NC}"
    log "  cd '$INSTALL_DIR' && ./start-presentation.sh"
    log ""
    log "${CYAN}📚 Documentation:${NC}"
    log "  - README.md - General information"
    log "  - DEMO-SYSTEM-COMPLETE.md - Complete system guide"
    log "  - terms-of-service.html - User agreement and age verification"
    log ""
    log "${CYAN}🎯 Main Entry Points:${NC}"
    log "  - Unified Demo Hub: unified-demo-hub.html"
    log "  - User Onboarding: terms-of-service.html"
    log "  - Direct Presentation: html5-presentation-engine.html"
    log ""
    
    if [ "$OS" = "Linux" ]; then
        log "${CYAN}🖥️ Desktop Integration:${NC}"
        log "  - Application menu: Document Generator Demo"
        log "  - Or run: gtk-launch document-generator-demo.desktop"
        log ""
    fi
    
    log "${BLUE}🌟 Enjoy the Document Generator Demo System!${NC}"
    log ""
}

# Main installation function
main() {
    log "${CYAN}📋 INSTALLATION STARTED${NC}"
    log "Installer Version: $INSTALLER_VERSION"
    log "Target Directory: $INSTALL_DIR"
    log "Log File: $LOG_FILE"
    log ""
    
    # Get OS information
    get_os_info
    log "${CYAN}🔍 Detected OS: $OS${NC}"
    log "${CYAN}📦 Package Manager: $PACKAGE_MANAGER${NC}"
    log ""
    
    # Check for existing installation
    if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/unified-demo-hub.html" ]; then
        log "${YELLOW}⚠️ Existing installation detected${NC}"
        read -p "Backup and continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "${YELLOW}📦 Creating backup...${NC}"
            cp -r "$INSTALL_DIR" "$BACKUP_DIR"
            log "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
        else
            log "${RED}❌ Installation cancelled${NC}"
            exit 1
        fi
    fi
    
    # Setup directories
    setup_directories || {
        log "${RED}❌ Failed to setup directories${NC}"
        exit 1
    }
    
    # Install system dependencies
    log "${CYAN}🔧 INSTALLING SYSTEM DEPENDENCIES${NC}"
    log "=================================="
    
    install_nodejs || {
        log "${RED}❌ Node.js installation required${NC}"
        exit 1
    }
    
    install_python || {
        log "${RED}❌ Python 3 installation required${NC}"
        exit 1
    }
    
    # Install optional dependencies
    install_ffmpeg
    install_imagemagick
    
    # Copy demo system files
    copy_demo_files || {
        log "${RED}❌ Failed to copy demo files${NC}"
        exit 1
    }
    
    # Install packages
    log ""
    log "${CYAN}📦 INSTALLING PACKAGES${NC}"
    log "======================"
    
    install_node_packages || {
        log "${YELLOW}⚠️ Node.js packages installation failed - some features may be limited${NC}"
    }
    
    install_python_packages || {
        log "${YELLOW}⚠️ Python packages installation failed - some features may be limited${NC}"
    }
    
    # Create launchers and desktop integration
    log ""
    log "${CYAN}🚀 CREATING LAUNCHERS${NC}"
    log "===================="
    
    create_launchers || {
        log "${RED}❌ Failed to create launchers${NC}"
        exit 1
    }
    
    create_desktop_entries
    
    # Run tests
    log ""
    log "${CYAN}🧪 RUNNING TESTS${NC}"
    log "==============="
    
    run_tests || {
        log "${YELLOW}⚠️ Some tests failed - installation may be incomplete${NC}"
    }
    
    # Show completion message
    show_completion
}

# Check if running as script
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    # Handle command line arguments
    case "${1:-install}" in
        "install"|"")
            main
            ;;
        "uninstall")
            log "${YELLOW}🗑️ Uninstalling Document Generator Demo System...${NC}"
            if [ -d "$INSTALL_DIR" ]; then
                rm -rf "$INSTALL_DIR"
                log "${GREEN}✅ Uninstalled successfully${NC}"
            else
                log "${YELLOW}⚠️ No installation found${NC}"
            fi
            ;;
        "test")
            if [ -d "$INSTALL_DIR" ]; then
                cd "$INSTALL_DIR"
                run_tests
            else
                log "${RED}❌ No installation found${NC}"
                exit 1
            fi
            ;;
        "help"|"--help"|"-h")
            echo "Document Generator Demo System Installer"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  install    - Install the demo system (default)"
            echo "  uninstall  - Remove the demo system"
            echo "  test       - Test existing installation"
            echo "  help       - Show this help message"
            echo ""
            ;;
        *)
            log "${RED}❌ Unknown command: $1${NC}"
            log "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
fi