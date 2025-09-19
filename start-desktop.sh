#!/bin/bash

# Desktop Interface Launcher
# Simple startup script for non-technical users

echo "🚀 Starting Document Generator Desktop Interface..."
echo ""

# Check if we're in the right directory
if [ ! -f "ONE-BUTTON.html" ]; then
    echo "❌ Error: Please run this script from the Document-Generator directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from: https://nodejs.org/"
    echo "   Or use Homebrew: brew install node"
    exit 1
fi

# Check if Electron is available, install if needed
if ! command -v electron &> /dev/null && [ ! -d "node_modules/electron" ]; then
    echo "📦 Installing Electron for desktop interface..."
    npm install electron
fi

echo "🤖 Starting Agent Interface Bridge..."
# Start the agent bridge in the background
node agent-interface-bridge.js &
BRIDGE_PID=$!
echo "   Agent API running on http://localhost:9999"

echo ""
echo "🎯 Opening Agent Command Center..."
echo ""
echo "💡 What you can do:"
echo "   • Drag and drop ANY document to delegate to agents"
echo "   • Click DELEGATE to activate your AI agent network"
echo "   • Use the agent control panel for monitoring"
echo "   • System tray icon for always-on access"
echo ""

# Try Electron first (full desktop app), fallback to browser
if [ -d "node_modules/electron" ] || command -v electron &> /dev/null; then
    echo "🖥️  Opening in desktop mode (Electron)..."
    npm run desktop
else
    echo "🌐 Opening in browser mode..."
    
    # Try different ways to open the HTML file
    if command -v open &> /dev/null; then
        open ONE-BUTTON.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open ONE-BUTTON.html
    elif command -v start &> /dev/null; then
        start ONE-BUTTON.html
    else
        echo "📄 Please open ONE-BUTTON.html in your web browser"
        echo "   File location: $(pwd)/ONE-BUTTON.html"
    fi
fi

echo ""
echo "✅ Agent Command Center launched!"
echo "📌 Look for the system tray icon for quick access"
echo "🤖 Agent API running on http://localhost:9999"
echo ""

# Setup cleanup on exit
cleanup() {
    echo "🛑 Stopping Agent Interface Bridge..."
    if [ ! -z "$BRIDGE_PID" ]; then
        kill $BRIDGE_PID 2>/dev/null
    fi
}

trap cleanup EXIT
echo "Press Ctrl+C to stop all services"
wait