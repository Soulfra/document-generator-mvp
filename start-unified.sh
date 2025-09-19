#!/bin/bash

# Document Generator Unified Launcher
# Supports: Electron, PWA, Web Server, and Development modes

echo "🚀 Document Generator Launcher"
echo "Transform any document into a working MVP in < 30 minutes"
echo ""

# Default mode
MODE=${1:-electron}

case $MODE in
  electron)
    echo "⚡ Starting in Electron mode..."
    # Copy electron package.json
    cp package.electron.json package.json
    npm run electron-dev
    ;;
    
  electron-prod)
    echo "📦 Starting Electron in production mode..."
    cp package.electron.json package.json
    npm run electron
    ;;
    
  pwa)
    echo "🌐 Starting as Progressive Web App..."
    # Start the server
    npm start &
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
    
    # Wait for server to start
    sleep 3
    
    # Open in browser
    if command -v open &> /dev/null; then
      open http://localhost:3001
    elif command -v xdg-open &> /dev/null; then
      xdg-open http://localhost:3001
    else
      echo "Please open http://localhost:3001 in your browser"
    fi
    
    # Wait for user to stop
    echo "Press Ctrl+C to stop..."
    wait $SERVER_PID
    ;;
    
  server)
    echo "🖥️ Starting web server only..."
    npm start
    ;;
    
  dev)
    echo "🔧 Starting in development mode..."
    npm run dev
    ;;
    
  complex)
    echo "🧠 Starting complex 66-layer Electron app..."
    cp package.electron.json package.json
    # Update main to use electron-main.js
    sed -i.bak 's/"main": "electron\/main.js"/"main": "electron-main.js"/' package.json
    npm run electron-dev
    ;;
    
  help)
    echo "Usage: ./start.sh [mode]"
    echo ""
    echo "Available modes:"
    echo "  electron      - Start in Electron desktop app (default)"
    echo "  electron-prod - Start Electron in production mode"
    echo "  pwa          - Start as Progressive Web App in browser"
    echo "  server       - Start web server only"
    echo "  dev          - Start in development mode"
    echo "  complex      - Start complex 66-layer Electron app"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./start.sh              # Start Electron (default)"
    echo "  ./start.sh pwa          # Start as PWA"
    echo "  ./start.sh server       # Start server only"
    ;;
    
  *)
    echo "❌ Unknown mode: $MODE"
    echo "Run './start.sh help' for available options"
    exit 1
    ;;
esac