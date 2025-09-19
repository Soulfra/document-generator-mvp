#!/bin/bash

# 🌐⚔️ SANDBOX METAVERSE LAUNCHER

echo "🌐⚔️ SANDBOX METAVERSE LAUNCHER"
echo "==============================="
echo ""
echo "This is your own GTA/Roblox/Minecraft-style world!"
echo ""
echo "🎮 FEATURES:"
echo "  • Open world with procedural terrain"
echo "  • Build mode (like Minecraft/Fortnite)"
echo "  • Spawn vehicles and NPCs"
echo "  • Multiplayer support"
echo "  • Chat system"
echo "  • 5 game modes (Explore/Build/Combat/Vehicle/Fly)"
echo "  • Persistent world (saves your builds)"
echo "  • Integration with duo verification systems"
echo ""
echo "🎯 CONTROLS:"
echo "  • WASD: Move"
echo "  • Mouse: Look (click to capture)"
echo "  • Space: Jump"
echo "  • B: Toggle build mode"
echo "  • T: Open chat"
echo "  • I: Inventory"
echo "  • 1-5: Switch game modes"
echo "  • C: Change camera (in 4.5D world)"
echo ""

# Function to check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is required but not installed"
        echo "Please install Python 3 from https://python.org"
        exit 1
    fi
}

# Function to install Python dependencies
install_deps() {
    echo "📦 Installing Python dependencies..."
    pip3 install --user websockets asyncio aiohttp >/dev/null 2>&1 || {
        echo "⚠️ Some dependencies may need manual installation"
    }
}

# Main menu
show_menu() {
    echo "🎮 LAUNCH OPTIONS:"
    echo "=================="
    echo "1) 🌐 Launch Sandbox Metaverse (Full Experience)"
    echo "2) 🎮 Launch 4.5D Commander World (Original)"
    echo "3) 🖥️ Start Backend Server Only"
    echo "4) 🚀 Launch Everything (World + Backend)"
    echo "5) 📊 View Duo System Status"
    echo "6) ❌ Exit"
    echo ""
    echo -n "Choose option (1-6): "
}

# Launch metaverse
launch_metaverse() {
    echo "🌐 Launching Sandbox Metaverse..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open sandbox-metaverse-world.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open sandbox-metaverse-world.html 2>/dev/null || firefox sandbox-metaverse-world.html
    else
        start sandbox-metaverse-world.html
    fi
    
    echo "✅ Metaverse launched in browser!"
    echo ""
    echo "💡 TIP: For multiplayer, also start the backend server (option 3)"
}

# Launch 4.5D world
launch_45d() {
    echo "🎮 Launching 4.5D Commander World..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open 4.5d-commander-world.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open 4.5d-commander-world.html 2>/dev/null || firefox 4.5d-commander-world.html
    else
        start 4.5d-commander-world.html
    fi
    
    echo "✅ 4.5D World launched!"
}

# Start backend
start_backend() {
    echo "🖥️ Starting backend server..."
    echo ""
    echo "The backend provides:"
    echo "  • Multiplayer sync"
    echo "  • World persistence"
    echo "  • Duo system integration"
    echo "  • Real-time events"
    echo ""
    
    # Check if backend is already running
    if lsof -i:8765 >/dev/null 2>&1; then
        echo "⚠️ Backend already running on port 8765"
        echo "Kill existing process? (y/n): "
        read -r answer
        if [[ "$answer" == "y" ]]; then
            kill $(lsof -t -i:8765) 2>/dev/null
            sleep 1
        else
            return
        fi
    fi
    
    # Start backend
    python3 metaverse-backend.py &
    BACKEND_PID=$!
    
    echo "✅ Backend started (PID: $BACKEND_PID)"
    echo "📡 WebSocket server: ws://localhost:8765"
    echo ""
    echo "Press Enter to return to menu (backend continues running)..."
    read -r
}

# Launch everything
launch_all() {
    echo "🚀 Launching complete metaverse experience..."
    echo ""
    
    # Start backend first
    echo "1️⃣ Starting backend server..."
    python3 metaverse-backend.py &
    BACKEND_PID=$!
    sleep 2
    
    # Launch metaverse
    echo "2️⃣ Launching metaverse world..."
    launch_metaverse
    
    echo ""
    echo "✅ Everything is running!"
    echo "   • Backend PID: $BACKEND_PID"
    echo "   • WebSocket: ws://localhost:8765"
    echo ""
    echo "To stop backend: kill $BACKEND_PID"
}

# View duo status
view_duo_status() {
    echo "📊 Checking duo systems..."
    if [ -f "view-spawned-systems.py" ]; then
        python3 view-spawned-systems.py
    else
        echo "❌ Duo status viewer not found"
    fi
    echo ""
    echo "Press Enter to continue..."
    read -r
}

# Main execution
main() {
    check_python
    install_deps
    
    while true; do
        clear
        echo "🌐⚔️ SANDBOX METAVERSE SYSTEM"
        echo "============================="
        echo ""
        show_menu
        read -r choice
        
        case $choice in
            1)
                launch_metaverse
                ;;
            2)
                launch_45d
                ;;
            3)
                start_backend
                ;;
            4)
                launch_all
                ;;
            5)
                view_duo_status
                ;;
            6)
                echo "👋 Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid choice. Please try again."
                sleep 1
                ;;
        esac
    done
}

# Cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    # Kill any backend processes we started
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
}

trap cleanup EXIT

# Check if we have the required files
if [ ! -f "sandbox-metaverse-world.html" ]; then
    echo "❌ sandbox-metaverse-world.html not found!"
    echo "Make sure you're in the correct directory"
    exit 1
fi

# Run main
main