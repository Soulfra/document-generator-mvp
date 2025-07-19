#!/bin/bash

echo "🔥 BASH FORWARD - READY TO GO! 🔥"
echo ""
echo "Choose your interface:"
echo ""
echo "1. 🌐 Localhost Web Interface (recommended)"
echo "   Interactive dashboard at http://localhost:3333"
echo "   WebSocket terminal for live commands"
echo ""
echo "2. 📺 Full TMUX Setup" 
echo "   Multiple terminal windows"
echo "   Ralph zone, Charlie zone, systems, dev"
echo ""
echo "3. 🚀 Just run a quick demo"
echo "   See the whole system in action"
echo ""
echo "4. ⚡ Individual component"
echo "   Pick a specific system to run"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Starting localhost web interface..."
        echo "Opening http://localhost:3333 in 3 seconds..."
        echo "You can type commands directly in the web terminal!"
        echo ""
        sleep 3
        # Try to open browser (macOS/Linux compatible)
        if command -v open &> /dev/null; then
            open http://localhost:3333 &
        elif command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3333 &
        fi
        npm run localhost
        ;;
    2)
        echo ""
        echo "📺 Starting full TMUX setup..."
        ./start-bash-tmux.sh
        ;;
    3)
        echo ""
        echo "🚀 Running complete system demo..."
        echo "This will show all components in action!"
        echo ""
        npm run ultimate-demo
        ;;
    4)
        echo ""
        echo "⚡ Available components:"
        echo "  ralph           - Ralph chaos test"
        echo "  charlie         - Charlie protection"
        echo "  trinity         - Trinity authentication"
        echo "  shadow          - Shadow testing"
        echo "  templates       - Template actions"
        echo "  mirror-git      - Quantum operations"
        echo "  remote          - Remote crash mapping"
        echo "  ultimate        - Ultimate mode"
        echo ""
        read -p "Enter component name: " component
        
        if [ ! -z "$component" ]; then
            echo ""
            echo "🎯 Running: npm run $component"
            npm run "$component"
        else
            echo "No component specified, running localhost interface..."
            npm run localhost
        fi
        ;;
    *)
        echo ""
        echo "Invalid choice, starting localhost interface by default..."
        npm run localhost
        ;;
esac