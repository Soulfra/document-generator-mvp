#!/bin/bash

# Test Universal Site Locally
# Demonstrates the universal site working for different domains

echo "🌐 TESTING UNIVERSAL SITE LOCALLY"
echo ""

SITE_DIR="universal-site"
PORT="8888"

# Check if site directory exists
if [ ! -d "$SITE_DIR" ]; then
    echo "❌ Error: $SITE_DIR directory not found"
    exit 1
fi

# Function to start local server
start_server() {
    echo "🚀 Starting local server on port $PORT..."
    cd "$SITE_DIR"
    
    # Try different server options
    if command -v python3 >/dev/null 2>&1; then
        echo "✅ Using Python 3 server"
        python3 -m http.server $PORT &
        SERVER_PID=$!
    elif command -v python >/dev/null 2>&1; then
        echo "✅ Using Python 2 server"
        python -m SimpleHTTPServer $PORT &
        SERVER_PID=$!
    elif command -v node >/dev/null 2>&1; then
        echo "✅ Using Node.js server"
        npx http-server -p $PORT &
        SERVER_PID=$!
    else
        echo "❌ No suitable server found. Please install Python or Node.js"
        exit 1
    fi
    
    cd ..
    
    # Wait for server to start
    sleep 2
    
    echo "Server PID: $SERVER_PID"
    echo ""
}

# Function to test different domains
test_domains() {
    echo "🧪 Testing different domain configurations:"
    echo ""
    
    DOMAINS=(
        "soulfra.com:Business Command Center"
        "deathtodata.com:Coding Adventure World" 
        "dealordelete.com:Decision Market Engine"
        "saveorsink.com:Survival Command"
        "cringeproof.com:Cringe Detection Arena"
        "finishthisidea.com:Idea Completion Factory"
    )
    
    for domain_info in "${DOMAINS[@]}"; do
        IFS=':' read -r domain description <<< "$domain_info"
        url="http://localhost:$PORT?domain=$domain"
        
        echo "🎯 Testing: $domain ($description)"
        echo "   URL: $url"
        
        # Test if server responds
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            echo "   ✅ Server responding"
        else
            echo "   ❌ Server not responding"
        fi
        
        echo ""
    done
}

# Function to show browser links
show_browser_links() {
    echo "🌐 Open these URLs in your browser to test different domains:"
    echo ""
    
    DOMAINS=(
        "soulfra.com:💼 Business Command Center (ROI & Analytics)"
        "deathtodata.com:⚔️ Coding Adventure World (Learning Quests)" 
        "dealordelete.com:🎯 Decision Market Engine (Trading & Deals)"
        "saveorsink.com:🚨 Survival Command (Rescue Operations)"
        "cringeproof.com:🛡️ Cringe Detection Arena (Multiplayer Games)"
        "finishthisidea.com:💡 Idea Completion Factory (MVP Generator)"
        "finishthisrepo.com:🔧 Repository Completion (Code Rescue)"
        "ipomyagent.com:📈 Agent IPO Platform (AI Stock Exchange)"
        "hollowtown.com:🏘️ Virtual Town Community (Social Hub)"
        "hookclinic.com:🔬 Hook Optimization Clinic (Engagement)"
    )
    
    for domain_info in "${DOMAINS[@]}"; do
        IFS=':' read -r domain description <<< "$domain_info"
        url="http://localhost:$PORT?domain=$domain"
        
        echo "$description"
        echo "→ $url"
        echo ""
    done
    
    echo "🔧 Default (localhost): http://localhost:$PORT"
    echo ""
}

# Function to cleanup
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo ""
        echo "🛑 Stopping server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        
        # Also kill any remaining python/node servers on the port
        pkill -f "python.*$PORT" 2>/dev/null || true
        pkill -f "http-server.*$PORT" 2>/dev/null || true
    fi
    echo "✅ Cleanup complete"
    exit 0
}

# Setup signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "This will test the universal site that works for ALL domains!"
    echo "Each domain gets different branding, features, and backend connections."
    echo ""
    
    # Start the server
    start_server
    
    # Test domains
    test_domains
    
    # Show browser links
    show_browser_links
    
    echo "🎮 Key Features to Test:"
    echo "• Different themes and colors for each domain"
    echo "• Domain-specific features and descriptions"
    echo "• Backend connection testing (will show as offline/demo mode)"
    echo "• Cross-domain functionality"
    echo "• Mobile PWA support"
    echo ""
    
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Keep server running
    wait $SERVER_PID
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [port]"
    echo ""
    echo "Test the universal site locally with domain switching"
    echo ""
    echo "Options:"
    echo "  port    Port number (default: $PORT)"
    echo ""
    echo "Example:"
    echo "  $0        # Use default port $PORT"
    echo "  $0 3000   # Use port 3000"
    exit 0
fi

# Use custom port if provided
if [ ! -z "$1" ]; then
    PORT="$1"
fi

# Run main function
main