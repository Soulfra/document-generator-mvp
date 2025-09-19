#!/bin/bash

echo "🔥 LOCALHOST VERIFICATION SCRIPT"
echo "================================"
echo ""

# Function to test HTTP endpoints
test_http() {
    local url=$1
    local name=$2
    echo -n "Testing $name ($url)... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Function to test WebSocket endpoints
test_websocket() {
    local host=$1
    local port=$2
    local name=$3
    echo -n "Testing $name (ws://$host:$port)... "
    
    # Use timeout and nc to test WebSocket port
    if timeout 3 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Function to test file existence
test_file() {
    local file=$1
    local name=$2
    echo -n "Testing $name ($file)... "
    
    if [ -f "$file" ]; then
        echo "✅ OK"
        return 0
    else
        echo "❌ MISSING"
        return 1
    fi
}

# Function to test symlinks
test_symlink() {
    local link=$1
    local name=$2
    echo -n "Testing $name ($link)... "
    
    if [ -L "$link" ] && [ -e "$link" ]; then
        echo "✅ OK"
        return 0
    else
        echo "❌ BROKEN"
        return 1
    fi
}

echo "🐍 FLASK BACKEND VERIFICATION"
echo "============================="
test_http "http://localhost:5001/api/status" "Flask API Status"
test_http "http://localhost:5001/" "Flask Web Interface"

echo ""
echo "🤖 AGENT SERVICES VERIFICATION"
echo "==============================="
test_websocket "localhost" "47004" "Universal Aggregator (kisuke)"
test_websocket "localhost" "47003" "Crypto Aggregator (conductor)"
test_websocket "localhost" "48000" "Differential Games (tunnel)"

echo ""
echo "🔗 SYMLINK FEDERATION VERIFICATION"
echo "==================================="
test_symlink "symlinks/kisuke-templates" "Kisuke Templates"
test_symlink "symlinks/conductor-services" "Conductor Services"
test_symlink "symlinks/tunnel-mcp" "Tunnel MCP"
test_symlink "symlinks/vibevault-worktrees" "Vibevault Worktrees"
test_symlink "symlinks/flask-api" "Flask API"

echo ""
echo "📝 TEMPLATE SYSTEM VERIFICATION"
echo "================================"
test_file "template-registry.json" "Template Registry"
test_file "setup-template-symlinks.sh" "Symlink Setup Script"

echo ""
echo "🏛️ FEDERATION SYSTEM VERIFICATION"
echo "=================================="
test_file "federation-verification-report.json" "Federation Report"
test_file "FEDERATION-STATUS.md" "Federation Status"
test_file "federation-verification-engine.js" "Federation Engine"

echo ""
echo "📚 DOCUMENTATION VERIFICATION"
echo "=============================="
test_file "CLAUDE.md" "Project Instructions"
test_file "CLAUDE.ai-services.md" "AI Services Guide"
test_file "CLAUDE.document-parser.md" "Document Parser Guide"
test_file "FINAL-SETUP-SUMMARY.md" "Setup Summary"
test_file "GIT-WORKFLOW.md" "Git Workflow"
test_file "SYSTEM-STATUS.md" "System Status"

echo ""
echo "🖥️ ELECTRON INTERFACE VERIFICATION"
echo "===================================="
test_file "working-desktop.html" "Working Desktop Interface"
test_file "simple-electron.js" "Electron Launcher"
test_file "electron-unified-app.js" "Unified Electron App"
test_file "universal-terminal.html" "Universal Terminal"
test_file "crypto-differential-terminal.html" "Crypto Terminal"

echo ""
echo "🚀 DEPLOYMENT VERIFICATION"
echo "=========================="
test_file "docker-compose.yml" "Docker Compose"
test_file "start-development.sh" "Development Launcher"
test_file "start-production.sh" "Production Launcher"
test_file "deploy-oss-github.sh" "OSS Deployment"
test_file "deploy-private-secure.sh" "Private Deployment"

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================="

# Count results
total_tests=25
echo "Total tests: $total_tests"

# Quick Flask test
echo ""
echo "🔍 QUICK FLASK DATA ISOLATION TEST"
echo "==================================="

if curl -s "http://localhost:5001/api/status" | grep -q "data_isolation.*enabled"; then
    echo "✅ Data isolation: ENABLED"
else
    echo "❌ Data isolation: NOT VERIFIED"
fi

if curl -s "http://localhost:5001/api/status" | grep -q "payment_tracking.*active"; then
    echo "✅ Payment tracking: ACTIVE"
else
    echo "❌ Payment tracking: NOT VERIFIED"
fi

echo ""
echo "🎯 LOCALHOST VERIFICATION COMPLETE"
echo "=================================="
echo ""
echo "📋 Quick Start Commands:"
echo "   Flask Backend:     http://localhost:5001"
echo "   Electron Interface: npm run electron-simple"
echo "   Federation Status:  cat FEDERATION-STATUS.md"
echo "   Full Verification:  node federation-verification-engine.js"
echo ""
echo "🔥 Visual Dashboard:   file://$(pwd)/localhost-verification-dashboard.html"
echo ""