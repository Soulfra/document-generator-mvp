#!/bin/bash

# 🚀 DOCUMENT GENERATOR START SCRIPT
# One command to start everything

echo "🚀 DOCUMENT GENERATOR"
echo "📄 Document → Brain → Live App"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Parse arguments
MODE="full"
while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quick)
            MODE="quick"
            shift
            ;;
        -b|--brain)
            MODE="brain"
            shift
            ;;
        -d|--demo)
            MODE="demo"
            shift
            ;;
        -e|--electron)
            MODE="electron"
            shift
            ;;
        -p|--pwa)
            MODE="pwa"
            shift
            ;;
        -h|--help)
            echo "Usage: ./start.sh [options]"
            echo ""
            echo "Options:"
            echo "  -q, --quick    Quick start (brain + error bash only)"
            echo "  -b, --brain    Start brain service only"
            echo "  -d, --demo     Start demo mode"
            echo "  -e, --electron Start in Electron desktop app"
            echo "  -p, --pwa      Start as Progressive Web App"
            echo "  -h, --help     Show this help"
            echo ""
            echo "Default: Start all services (full mode)"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Start the system
if [ "$MODE" = "electron" ]; then
    echo "⚡ Starting in Electron mode..."
    cp package.electron.json package.json
    npm run electron-dev
elif [ "$MODE" = "pwa" ]; then
    echo "🌐 Starting as Progressive Web App..."
    npm start &
    sleep 3
    if command -v open &> /dev/null; then
        open http://localhost:3001
    else
        echo "Please open http://localhost:3001 in your browser"
    fi
    wait
else
    echo "🏗️  Starting in $MODE mode..."
    node build.js --mode $MODE
fi