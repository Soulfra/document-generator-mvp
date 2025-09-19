#!/bin/bash

echo "🎮 LAUNCHING D2JSP-STYLE GAME ENGINE"
echo "===================================="
echo ""
echo "Features:"
echo "  ✅ Layered graphics with shadows and depth"
echo "  ✅ Full drag-and-drop item management"
echo "  ✅ D2JSP-inspired inventory interface"
echo "  ✅ Equipment slots and character stats"
echo "  ✅ Item tooltips with detailed stats"
echo "  ✅ End-to-end testing suite"
echo "  ✅ XML-style item database mapping"
echo ""

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Kill existing process on port 8000
if lsof -i:8000 >/dev/null 2>&1; then
    echo "⚠️ Freeing port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "🚀 Starting D2JSP-Style Game Engine..."
echo ""

# Launch the game engine
node d2jsp-style-game-engine.js &
GAME_PID=$!

# Wait for startup
sleep 3

# Check if it's running
if curl -s http://localhost:8000/api/game-state >/dev/null 2>&1; then
    echo "✅ D2JSP-Style Game Engine is running!"
    echo ""
    echo "🌐 Game Interface: http://localhost:8000"
    echo ""
    echo "🎮 HOW TO USE:"
    echo "   1. View character stats in left panel"
    echo "   2. Drag and drop items in inventory grid"
    echo "   3. Hover over items to see tooltips"
    echo "   4. Equipment slots on the right for gear"
    echo "   5. Click 'Run Tests' to verify everything works"
    echo ""
    echo "🎯 DRAG & DROP FEATURES:"
    echo "   • Drag items between inventory slots"
    echo "   • Visual drop zones appear when dragging"
    echo "   • Items snap into place with animations"
    echo "   • Shadows and layered graphics for depth"
    echo ""
    echo "🧪 TESTING:"
    echo "   • Click 'Run Tests' button in interface"
    echo "   • Tests inventory, drag-drop, shadows, XML mapping"
    echo "   • End-to-end validation of all systems"
    echo ""
    echo "🛑 Press Ctrl+C to stop"
    
    # Open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:8000 2>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:8000 2>/dev/null
    fi
    
    # Cleanup function
    cleanup() {
        echo ""
        echo "🛑 Stopping D2JSP-Style Game Engine..."
        kill $GAME_PID 2>/dev/null
        echo "✅ Stopped"
        exit 0
    }
    
    trap cleanup INT TERM
    
    # Keep running
    echo "📊 Monitoring system..."
    while true; do
        if ! kill -0 $GAME_PID 2>/dev/null; then
            echo "❌ Game engine stopped unexpectedly"
            exit 1
        fi
        sleep 5
    done
    
else
    echo "❌ Failed to start D2JSP-Style Game Engine"
    kill $GAME_PID 2>/dev/null
    exit 1
fi