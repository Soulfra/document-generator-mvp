#!/bin/bash

# Launch script for Mobile Idle Tycoon - Pirate Islands Clash
# Integrates with existing authentication and wallet systems

echo "🏴‍☠️ LAUNCHING PIRATE ISLANDS CLASH - MOBILE IDLE TYCOON 🏴‍☠️"
echo "=================================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if existing services are running
check_service() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ $service is running on port $port"
        return 0
    else
        echo "⚠️  $service is not running on port $port"
        return 1
    fi
}

echo ""
echo "Checking existing services..."
echo "-----------------------------"

# Check for required services
VAULT_RUNNING=$(check_service 8000 "Vault Service")
AUTH_RUNNING=$(check_service 3001 "Auth Service")
WALLET_RUNNING=$(check_service 8085 "Wallet Service")

# Set environment variables for integration
export ENABLE_WALLET_INTEGRATION=true
export ENABLE_QR_AUTH=true
export ENABLE_VAULT_STORAGE=true
export ONE_PIECE_ECONOMY_ENABLED=true
export SHIPREKT_ENGINE_ENABLED=true

# Create necessary directories
mkdir -p public/icons
mkdir -p public/screenshots
mkdir -p save-data

# Generate placeholder icons if they don't exist
if [ ! -f "public/icons/pirate-icon-192.png" ]; then
    echo "🎨 Creating placeholder icons..."
    # Create a simple SVG icon and convert it (requires imagemagick)
    cat > public/icons/pirate-icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#1a1a2e"/>
  <text x="96" y="96" font-size="120" text-anchor="middle" dominant-baseline="middle" fill="#FFD700">🏴‍☠️</text>
</svg>
EOF
    
    # Note: In production, you'd convert this SVG to PNG sizes
    echo "   (Note: Install imagemagick to generate PNG icons from SVG)"
fi

# Check for AI API keys
echo ""
echo "Checking AI Graphics Generation APIs..."
echo "--------------------------------------"

if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI API key found - DALL-E graphics enabled"
else
    echo "⚠️  No OpenAI API key - using fallback graphics"
fi

if [ ! -z "$STABLE_DIFFUSION_API_KEY" ]; then
    echo "✅ Stable Diffusion API key found"
else
    echo "⚠️  No Stable Diffusion API key"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install express ws crypto
fi

# Start the game server
echo ""
echo "🚀 Starting Mobile Idle Tycoon Server..."
echo "======================================="

# Launch with integration flags
node mobile-idle-tycoon.js --server \
    --wallet-integration \
    --qr-auth \
    --vault-storage \
    --one-piece-economy \
    --shiprekt-engine &

SERVER_PID=$!

# Wait for server to start
sleep 2

# Open in browser
if command -v open &> /dev/null; then
    open "http://localhost:7778/mobile-idle-tycoon.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:7778/mobile-idle-tycoon.html"
fi

echo ""
echo "🎮 Game Server Running!"
echo "======================"
echo "📱 Mobile Web: http://localhost:7778/mobile-idle-tycoon.html"
echo "🌐 API Server: http://localhost:7778/api"
echo "🔌 WebSocket: ws://localhost:7778"
echo ""
echo "📱 Mobile Access:"
echo "   - Open on your phone using your computer's IP address"
echo "   - Install as PWA for full mobile experience"
echo "   - Scan QR code for quick authentication"
echo ""
echo "🏴‍☠️ Features:"
echo "   ✅ Idle resource generation"
echo "   ✅ Clash-style base building"
echo "   ✅ One Piece themed progression"
echo "   ✅ AI-generated graphics (when API keys available)"
echo "   ✅ Offline progress calculation"
echo "   ✅ Cross-device wallet sync"
echo "   ✅ ShipRekt battle system"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep script running
wait $SERVER_PID