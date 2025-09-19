#!/bin/bash

# Setup Chrome Native Document Generator
echo "🔧 Setting up Chrome Native Document Generator..."

# Create necessary symlinks if they don't exist
if [ ! -L "electron-chrome-native" ]; then
    ln -s electron-chrome-native.js electron-chrome-native
    echo "✅ Created electron-chrome-native symlink"
fi

# Ensure preload script is accessible
if [ ! -f "preload-chrome.js" ]; then
    echo "⚠️ preload-chrome.js not found!"
fi

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "⚠️ server.js not found! The app needs this to run."
    exit 1
fi

# Make sure electron is installed
if ! npm list electron > /dev/null 2>&1; then
    echo "📦 Installing Electron..."
    npm install electron --save-dev --legacy-peer-deps
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To run the Chrome Native app:"
echo "   npm run electron-chrome"
echo ""
echo "Or directly:"
echo "   npx electron electron-chrome-native.js"