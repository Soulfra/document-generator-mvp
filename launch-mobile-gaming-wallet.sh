#!/bin/bash

# Launch Mobile Gaming Wallet Platform
# D2JSP-style mobile gaming with integrated crypto wallet

echo "📱🎮💳 LAUNCHING MOBILE GAMING WALLET PLATFORM"
echo "============================================="
echo ""
echo "🎯 Platform Features:"
echo "   • Mobile-optimized Electron app"
echo "   • D2JSP-style game with drag-drop inventory"
echo "   • Integrated crypto wallet (ETH, BTC, GAME)"
echo "   • Biometric authentication"
echo "   • Billion dollar treasure economy"
echo "   • PWA support for mobile web"
echo ""

# Check if Electron is installed
if ! command -v electron &> /dev/null; then
    echo "❌ Electron not found. Installing..."
    npm install electron --save-dev
fi

# Check for mobile preload script
if [ ! -f "mobile-preload.js" ]; then
    echo "❌ Mobile preload script missing!"
    exit 1
fi

# Check for mobile interface
if [ ! -f "mobile-gaming-interface.html" ]; then
    echo "❌ Mobile gaming interface missing!"
    exit 1
fi

# Kill any existing instances
echo "🧹 Cleaning up existing processes..."
pkill -f "electron.*mobile-gaming-wallet" || true

# Start the mobile gaming wallet
echo "🚀 Starting Mobile Gaming Wallet..."
echo ""

# Run with Electron
if [ -f "node_modules/.bin/electron" ]; then
    # Use local electron
    node_modules/.bin/electron mobile-gaming-wallet.js
else
    # Use global electron
    electron mobile-gaming-wallet.js
fi