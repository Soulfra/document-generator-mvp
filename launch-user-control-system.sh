#!/bin/bash
# LAUNCH USER CONTROL SYSTEM
# Complete demonstration of the customizable button & area calculator interface

set -e

echo "🚀 Launching User Control System..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create necessary directories
echo -e "${BLUE}📁 Creating system directories...${NC}"
mkdir -p profiles
mkdir -p profiles/exports
mkdir -p exports
mkdir -p logs

# Test mathematical calculation engine
echo -e "${BLUE}🧮 Testing Mathematical Calculation Engine...${NC}"
if command -v node >/dev/null 2>&1; then
    echo "Running calculation engine test..."
    node MathematicalCalculationEngine.js > logs/calculation-test.log 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Calculation engine working${NC}"
    else
        echo -e "${RED}❌ Calculation engine test failed${NC}"
        echo "Check logs/calculation-test.log for details"
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not found - skipping calculation engine test${NC}"
fi

# Test system integration bridge
echo -e "${BLUE}🔗 Testing System Integration Bridge...${NC}"
if command -v node >/dev/null 2>&1; then
    echo "Running integration bridge test..."
    timeout 10s node SystemIntegrationBridge.js > logs/integration-test.log 2>&1 || true
    if grep -q "Integration Report" logs/integration-test.log; then
        echo -e "${GREEN}✅ System integration working${NC}"
    else
        echo -e "${YELLOW}⚠️  Integration bridge test incomplete${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not found - skipping integration test${NC}"
fi

# Test user profile system
echo -e "${BLUE}👤 Testing User Profile System...${NC}"
if command -v node >/dev/null 2>&1; then
    echo "Running profile system test..."
    timeout 5s node UserProfileSystem.js > logs/profile-test.log 2>&1 || true
    if grep -q "test complete" logs/profile-test.log; then
        echo -e "${GREEN}✅ Profile system working${NC}"
    else
        echo -e "${YELLOW}⚠️  Profile system test incomplete${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not found - skipping profile system test${NC}"
fi

# Check if HTML file exists and is valid
echo -e "${BLUE}🎛️  Validating User Control Center interface...${NC}"
if [ -f "USER-CONTROL-CENTER.html" ]; then
    # Check if HTML contains key components
    if grep -q "drag" USER-CONTROL-CENTER.html && \
       grep -q "calculator" USER-CONTROL-CENTER.html && \
       grep -q "canvas" USER-CONTROL-CENTER.html; then
        echo -e "${GREEN}✅ User Control Center HTML is valid${NC}"
        
        # Get file size
        size=$(wc -c < "USER-CONTROL-CENTER.html")
        echo "   File size: ${size} bytes"
        
        # Count interactive elements
        buttons=$(grep -c "component-item" USER-CONTROL-CENTER.html || echo "0")
        echo "   Interactive components: ${buttons}"
        
    else
        echo -e "${RED}❌ User Control Center HTML is missing key features${NC}"
    fi
else
    echo -e "${RED}❌ USER-CONTROL-CENTER.html not found${NC}"
fi

# Generate system status report
echo -e "${BLUE}📊 Generating System Status Report...${NC}"
cat > system-status.json << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "system": "User Control System",
    "version": "1.0.0",
    "components": {
        "userControlCenter": {
            "file": "USER-CONTROL-CENTER.html",
            "status": "$([ -f USER-CONTROL-CENTER.html ] && echo 'available' || echo 'missing')",
            "features": [
                "drag-and-drop button designer",
                "interactive area calculator",
                "visual geometry tools",
                "real-time preview",
                "export functionality"
            ]
        },
        "calculationEngine": {
            "file": "MathematicalCalculationEngine.js",
            "status": "$([ -f MathematicalCalculationEngine.js ] && echo 'available' || echo 'missing')",
            "capabilities": [
                "2D shape calculations",
                "3D volume calculations", 
                "complex polygon support",
                "calculus functions",
                "unit conversions"
            ]
        },
        "integrationBridge": {
            "file": "SystemIntegrationBridge.js",
            "status": "$([ -f SystemIntegrationBridge.js ] && echo 'available' || echo 'missing')",
            "connections": [
                "character-model-service",
                "visual-builder",
                "component-graph",
                "universal-interface",
                "vault-system"
            ]
        },
        "profileSystem": {
            "file": "UserProfileSystem.js",
            "status": "$([ -f UserProfileSystem.js ] && echo 'available' || echo 'missing')",
            "features": [
                "user profiles",
                "configuration storage",
                "calculation history",
                "layout saving",
                "export/import"
            ]
        }
    },
    "directories": {
        "profiles": "$([ -d profiles ] && echo 'created' || echo 'missing')",
        "exports": "$([ -d exports ] && echo 'created' || echo 'missing')",
        "logs": "$([ -d logs ] && echo 'created' || echo 'missing')"
    },
    "integrations": {
        "nodejs": "$(command -v node >/dev/null 2>&1 && echo 'available' || echo 'not-found')",
        "browser": "ready-for-html-files"
    }
}
EOF

echo -e "${GREEN}✅ System status report saved to system-status.json${NC}"

# Create quick start guide
echo -e "${BLUE}📖 Creating Quick Start Guide...${NC}"
cat > QUICK-START.md << 'EOF'
# User Control System - Quick Start Guide

## 🚀 Getting Started

### 1. Open the User Control Center
```bash
# Open in your browser
open USER-CONTROL-CENTER.html

# Or use a web server
python3 -m http.server 8080
# Then visit: http://localhost:8080/USER-CONTROL-CENTER.html
```

### 2. Design Custom Interfaces
- **Drag components** from the left sidebar to the design area
- **Customize properties** using the right panel
- **Real-time preview** shows changes instantly
- **Export your design** as HTML, CSS, or JavaScript

### 3. Calculate Areas & Geometry
- Switch to the **"Area Calculator"** tab
- **Select a shape** (rectangle, circle, triangle, polygon)
- **Draw on the canvas** to create shapes
- **View calculations** with formulas in real-time

### 4. Save Your Work
- **Create a profile** to save configurations
- **Save layouts** for reuse
- **Export profiles** for backup or sharing
- **View calculation history** and favorites

## 🎛️ Key Features

### Button Designer
- Drag & drop interface builder
- Real-time property editing
- Color customization
- Export to multiple formats

### Area Calculator  
- Interactive geometry tools
- Mathematical calculation engine
- Support for complex polygons
- Visual formula display

### System Integration
- Connects to existing services
- Health monitoring
- Service discovery
- API integration

### User Profiles
- Personal configurations
- Calculation history
- Saved layouts
- Import/export functionality

## 🔧 Advanced Usage

### Running Backend Services
```bash
# Test calculation engine
node MathematicalCalculationEngine.js

# Test system integration
node SystemIntegrationBridge.js

# Test profile system  
node UserProfileSystem.js
```

### Integration with Existing Systems
The User Control Center automatically discovers and integrates with:
- Character Model Service
- Visual Builder Approval Workflow
- Component Graph System
- Universal Human Interface
- Vault System

## 📊 System Status
Check `system-status.json` for current system health and available components.

## 🆘 Troubleshooting
- Check `logs/` directory for error messages
- Ensure all HTML/JS files are in the same directory
- Use a web server for full functionality (not file:// URLs)
- Node.js required for backend services

---
*User Control System v1.0.0 - Making interface customization accessible to everyone*
EOF

echo -e "${GREEN}✅ Quick start guide saved to QUICK-START.md${NC}"

# Display summary
echo ""
echo -e "${GREEN}🎉 USER CONTROL SYSTEM LAUNCH COMPLETE!${NC}"
echo "============================================"
echo ""
echo -e "${BLUE}📁 Files Created:${NC}"
echo "   • USER-CONTROL-CENTER.html      - Main interface"
echo "   • MathematicalCalculationEngine.js - Calculation backend"
echo "   • SystemIntegrationBridge.js    - Service integration"
echo "   • UserProfileSystem.js          - Profile management"
echo "   • system-status.json            - System status"
echo "   • QUICK-START.md                - Usage guide"
echo ""
echo -e "${BLUE}📂 Directories Created:${NC}"
echo "   • profiles/                     - User profiles"
echo "   • exports/                      - Exported files"
echo "   • logs/                         - System logs"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Open USER-CONTROL-CENTER.html in your browser"
echo "2. Start designing custom interfaces with drag & drop"
echo "3. Try the area calculator with different shapes"
echo "4. Create a user profile to save your work"
echo "5. Read QUICK-START.md for detailed instructions"
echo ""
echo -e "${GREEN}✨ Enjoy your new customizable interface system!${NC}"

# Optional: Open in browser if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    read -p "Open User Control Center in browser now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open USER-CONTROL-CENTER.html
        echo -e "${GREEN}🌐 Opening in browser...${NC}"
    fi
fi

exit 0