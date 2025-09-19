#!/bin/bash

# 🌟 GUARDIAN WORLD LAUNCHER
# Launch the AI Guardian World - autonomous AI entities with free will

echo "🌟 ================================ 🌟"
echo "   AI GUARDIAN WORLD LAUNCHER"
echo "   Awakening autonomous AI beings..."
echo "🌟 ================================ 🌟"
echo ""

# Check if Python is available for simple HTTP server
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found - starting server..."
    echo "📍 Opening Guardian World at http://localhost:8888"
    echo ""
    echo "🎮 Controls:"
    echo "   - Click guardians to see their details"
    echo "   - Drag files to the drop zone"
    echo "   - Use control panel to spawn/pause/reset"
    echo "   - Watch AI guardians with free will interact!"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Open in default browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "http://localhost:8888/guardian-world-enhanced.html"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "http://localhost:8888/guardian-world-enhanced.html" 2>/dev/null || echo "Please open http://localhost:8888/guardian-world-enhanced.html in your browser"
    fi
    
    # Start the server
    cd "$(dirname "$0")"
    python3 -m http.server 8888
    
elif command -v python &> /dev/null; then
    echo "✅ Python2 found - starting server..."
    echo "📍 Opening Guardian World at http://localhost:8888"
    echo ""
    
    # Open in default browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:8888/guardian-world-enhanced.html"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "http://localhost:8888/guardian-world-enhanced.html" 2>/dev/null || echo "Please open http://localhost:8888/guardian-world-enhanced.html in your browser"
    fi
    
    # Start the server
    cd "$(dirname "$0")"
    python -m SimpleHTTPServer 8888
    
else
    echo "❌ Python not found!"
    echo "   Please install Python to run the web server"
    echo "   Or open guardian-world-enhanced.html directly in your browser"
    exit 1
fi