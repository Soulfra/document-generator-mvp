#!/bin/bash

# Run Document Generator in Chrome Native Mode
# This gives you a desktop app feel with Chrome running localhost

echo "🚀 Document Generator - Chrome Native Mode"
echo "========================================="
echo ""

# Check if setup has been run
if [ ! -f "preload-chrome.js" ] || [ ! -f "electron-chrome-native.js" ]; then
    echo "⚠️ First time setup required..."
    ./setup-chrome-native.sh
    echo ""
fi

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found!"
    echo "This file is required to run the Document Generator."
    exit 1
fi

# Run the Chrome native app
echo "🌐 Starting Chrome Native Electron app..."
echo "📍 Server will run on http://localhost:3001"
echo "✅ Human verification required on startup"
echo ""
echo "Features:"
echo "  • Native desktop window with Chrome embedded"
echo "  • Full Document Generator running on localhost"
echo "  • Chrome DevTools available (View → Toggle Developer Tools)"
echo "  • All navigation stays within the app"
echo ""

npm run electron-chrome