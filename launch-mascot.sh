#!/bin/bash

# 🎮 LAUNCH CHARACTER MASCOT SYSTEM
# =================================
# Natural movement with bird/mammal mechanics

echo "🎮 CHARACTER MASCOT SYSTEM"
echo "========================="
echo ""
echo "🎨 INITIALIZING HIGH-QUALITY CHARACTER..."
echo ""
echo "✨ FEATURES:"
echo "   • Smooth vector-like graphics"
echo "   • Natural bird/mammal movement"
echo "   • Non-blocky fluid animations"
echo "   • Breathing and life-like mechanics"
echo "   • Speech bubbles like The Sims"
echo "   • Customizable colors and style"
echo ""
echo "🦊 MOVEMENT STYLES:"
echo "   • Bird-like: Wing flapping, hopping"
echo "   • Mammal-like: Tail wagging, smooth stride"
echo "   • Hybrid: Best of both worlds"
echo ""
echo "🎯 INTERACTIONS:"
echo "   • Click anywhere to walk"
echo "   • Wave, Jump, Dance buttons"
echo "   • Adjustable walk speed"
echo "   • Smoothness control"
echo "   • Color customization"
echo ""

# Check if Python is available for simple HTTP server
if command -v python3 >/dev/null 2>&1; then
    echo "🚀 Starting character system..."
    
    # Start simple HTTP server
    cd "$(dirname "$0")"
    python3 -m http.server 8181 &
    SERVER_PID=$!
    
    sleep 2
    
    echo ""
    echo "✅ Character Mascot System started!"
    echo ""
    echo "🌐 VIEW YOUR MASCOT: http://localhost:8181/character-mascot-system.html"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening mascot viewer..."
        open http://localhost:8181/character-mascot-system.html
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening mascot viewer..."
        xdg-open http://localhost:8181/character-mascot-system.html
    else
        echo "📱 Manually visit: http://localhost:8181/character-mascot-system.html"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $SERVER_PID"
    echo ""
    echo "🎮 Your mascot is ready to explore!"
    echo ""
    
    # Keep script running
    echo "🔄 Mascot system running... Press Ctrl+C to stop"
    trap "echo ''; echo '🛑 Stopping mascot system...'; kill $SERVER_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $SERVER_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Mascot system stopped"
else
    echo "❌ Python3 not found. Opening file directly..."
    
    # Try to open the HTML file directly
    if command -v open >/dev/null 2>&1; then
        open character-mascot-system.html
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open character-mascot-system.html
    else
        echo "📱 Please open character-mascot-system.html in your browser"
    fi
fi