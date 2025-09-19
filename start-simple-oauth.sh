#!/bin/bash

# 🚀 SIMPLE OAUTH SYSTEM LAUNCHER

echo "🚀 STARTING SIMPLIFIED OAUTH AUTHENTICATION SYSTEM"
echo "================================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 No .env file found. Creating from template..."
    cp .env.oauth.example .env
    echo "   ✅ Created .env file"
    echo "   ⚠️  Please add your OAuth credentials to .env"
    echo ""
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js first: https://nodejs.org"
    exit 1
fi

echo "🔍 Checking OAuth provider configuration..."
node -e "
const config = require('./oauth-providers.config.js');
const enabled = config.getEnabledProviders();
console.log('');
console.log('📋 Enabled OAuth Providers:');
Object.entries(enabled).forEach(([key, cfg]) => {
    console.log(\`   \${cfg.icon} \${cfg.name}\`);
});
console.log('');
"

echo "🌐 Starting services..."
echo ""

# Start simplified auth server
echo "1️⃣ Starting Simplified Auth Server..."
node unified-auth-server-simplified.js &
AUTH_PID=$!
echo "   ✅ Auth Server started (PID: $AUTH_PID)"
echo "   🔗 URL: http://localhost:3340"
echo ""

sleep 2

# Start OAuth-enabled GitHub wrapper if it exists
if [ -f github-desktop-wrapper-oauth.js ]; then
    echo "2️⃣ Starting OAuth GitHub Desktop Wrapper..."
    node github-desktop-wrapper-oauth.js &
    GITHUB_PID=$!
    echo "   ✅ GitHub Wrapper started (PID: $GITHUB_PID)"
    echo "   🔗 URL: http://localhost:3337"
else
    echo "2️⃣ GitHub wrapper not found (optional)"
fi

echo ""
echo "✨ SYSTEM READY!"
echo "================"
echo ""
echo "🎯 Quick Actions:"
echo "   • Setup OAuth providers: http://localhost:3340/setup"
echo "   • Login page: http://localhost:3340"
echo "   • GitHub Desktop (if configured): http://localhost:3337"
echo ""
echo "📚 Documentation:"
echo "   • Simple guide: OAUTH-SIMPLE-GUIDE.md"
echo "   • Provider config: oauth-providers.config.js"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $AUTH_PID 2>/dev/null
    [ ! -z "$GITHUB_PID" ] && kill $GITHUB_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up cleanup on Ctrl+C
trap cleanup INT

# Keep script running
wait