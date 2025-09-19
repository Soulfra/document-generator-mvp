#!/bin/bash

# 🎮⚔️ 4.5D COMMANDER WORLD LAUNCHER

echo "🎮⚔️ 4.5D COMMANDER WORLD"
echo "========================"
echo ""
echo "🎯 CONTROLS:"
echo "  • WASD: Move around"
echo "  • Mouse: Look around (click to capture)"
echo "  • Space: Jump"
echo "  • Shift: Sprint"
echo "  • Q/E: Strafe"
echo "  • R/F: Up/Down (drone mode)"
echo "  • C: Cycle camera modes"
echo ""
echo "📷 CAMERA MODES:"
echo "  • Third Person"
echo "  • Drone View"
echo "  • First Person"
echo "  • RTS Top-Down"
echo ""
echo "⚔️ SPAWN UNITS:"
echo "  • 🔍 Scraper (50 resources)"
echo "  • ✅ Validator (75 resources)"
echo "  • 👥 Duo (100 resources)"
echo "  • 🏰 Tower (200 resources)"
echo "  • 🚁 Drone (150 resources)"
echo ""
echo "🚀 Launching 4.5D World..."
echo ""

# Check if the HTML file exists
if [ ! -f "4.5d-commander-world.html" ]; then
    echo "❌ 4.5d-commander-world.html not found!"
    exit 1
fi

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open 4.5d-commander-world.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open 4.5d-commander-world.html
    elif command -v firefox > /dev/null; then
        firefox 4.5d-commander-world.html
    elif command -v google-chrome > /dev/null; then
        google-chrome 4.5d-commander-world.html
    else
        echo "Please open 4.5d-commander-world.html in your browser"
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start 4.5d-commander-world.html
else
    echo "Please open 4.5d-commander-world.html in your browser"
fi

echo "✨ Happy commanding in 4.5D!"