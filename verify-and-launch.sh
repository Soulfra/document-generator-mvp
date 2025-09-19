#!/bin/bash

echo "🔍 ⛏️ VERIFYING AND LAUNCHING UNIFIED MINING NODE"
echo "==============================================="
echo ""

# Function to check if Node.js is available
check_nodejs() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js found: $NODE_VERSION"
        return 0
    else
        echo "❌ Node.js not found"
        return 1
    fi
}

# Function to test basic functionality
test_basic_functionality() {
    echo "🧪 Testing basic Node.js functionality..."
    
    node -e "
        const http = require('http');
        const https = require('https');
        console.log('✅ HTTP/HTTPS modules available');
        
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update('test').digest('hex');
        console.log('✅ Crypto module working');
        
        const fs = require('fs');
        console.log('✅ File system module available');
        
        console.log('✅ All core modules functional');
    "
}

# Function to verify web connectivity
test_web_connectivity() {
    echo "🌐 Testing web connectivity..."
    
    node -e "
        const https = require('https');
        
        const req = https.get('https://api.github.com/zen', (res) => {
            console.log('✅ Web connectivity working (status: ' + res.statusCode + ')');
            process.exit(0);
        });
        
        req.on('error', (error) => {
            console.log('⚠️ Web connectivity limited: ' + error.message);
            console.log('   (This is OK - the system will work without internet)');
            process.exit(0);
        });
        
        req.setTimeout(5000, () => {
            console.log('⚠️ Web request timeout (this is OK)');
            process.exit(0);
        });
    "
}

# Function to run the verification script
run_verification() {
    if [ -f "verify-integration-working.js" ]; then
        echo "🔍 Running integration verification..."
        node verify-integration-working.js
        echo ""
    else
        echo "⚠️ Integration verification script not found (skipping)"
    fi
}

# Function to launch the unified node
launch_unified_node() {
    echo "⛏️ Launching Unified Mining Node..."
    echo ""
    
    # Kill any existing processes on port 7000
    if lsof -i:7000 >/dev/null 2>&1; then
        echo "⚠️ Port 7000 in use, freeing it..."
        lsof -ti:7000 | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    # Launch the node
    node unified-mining-node.js &
    NODE_PID=$!
    
    # Wait a moment for startup
    sleep 3
    
    # Test if it's running
    if curl -s http://localhost:7000/api/status >/dev/null 2>&1; then
        echo "✅ Unified Mining Node is running!"
        echo ""
        echo "🌐 Open in browser: http://localhost:7000"
        echo ""
        echo "🎮 Features available:"
        echo "   • Real-time game mining simulation"
        echo "   • AI reasoning for every action"
        echo "   • Crypto wallet tracking"
        echo "   • Pattern detection (@mentions, #hashtags)"
        echo "   • Web fetching (built-in, no dependencies)"
        echo ""
        echo "🛑 Press Ctrl+C to stop"
        
        # Open browser if possible
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open http://localhost:7000 2>/dev/null
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open http://localhost:7000 2>/dev/null
        fi
        
        # Wait for user to stop
        trap "echo ''; echo '🛑 Stopping Unified Mining Node...'; kill $NODE_PID 2>/dev/null; exit 0" INT
        wait $NODE_PID
        
    else
        echo "❌ Failed to start Unified Mining Node"
        kill $NODE_PID 2>/dev/null
        exit 1
    fi
}

# Main execution
echo "🔍 Step 1: Checking prerequisites..."
if ! check_nodejs; then
    echo ""
    echo "❌ ERROR: Node.js is required but not found"
    echo ""
    echo "💡 To install Node.js:"
    echo "   macOS: brew install node"
    echo "   Ubuntu: sudo apt install nodejs npm"
    echo "   Windows: Download from https://nodejs.org"
    echo ""
    exit 1
fi

echo ""
echo "🧪 Step 2: Testing basic functionality..."
test_basic_functionality

echo ""
echo "🌐 Step 3: Testing web connectivity..."
test_web_connectivity

echo ""
echo "🔍 Step 4: Running verification (if available)..."
run_verification

echo ""
echo "⛏️ Step 5: Launching Unified Mining Node..."
launch_unified_node