#!/bin/bash

# 🏰 EMPIRE SYSTEM LAUNCHER
# Complete authentication-gated gaming platform
# No free entry - users MUST login to deathtodata.com

echo "🏰 LAUNCHING DEATHTODATA EMPIRE SYSTEM..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "deathtodata-auth-gateway" || true
pkill -f "universal-sso-auth-system" || true
pkill -f "node.*8000" || true
pkill -f "node.*7775" || true

sleep 2

# Initialize database if it doesn't exist
if [ ! -f "empire-auth.db" ]; then
    echo "🗄️ Initializing empire database..."
    sqlite3 empire-auth.db < empire-auth.blockchain.sql
    echo "✅ Database initialized with .blockchain.sql schema"
fi

# Start Universal SSO Auth System (background service)
echo "🔐 Starting Universal SSO Authentication System..."
node universal-sso-auth-system.js &
SSO_PID=$!
echo "✅ SSO Auth running on port 7775 (PID: $SSO_PID)"

sleep 3

# Start DeathToData Auth Gateway (main empire entrance)
echo "🏰 Starting DeathToData Empire Gateway..."
node deathtodata-auth-gateway.js &
GATEWAY_PID=$!
echo "✅ Empire Gateway running on port 8000 (PID: $GATEWAY_PID)"

sleep 3

# Check if services are healthy
echo ""
echo "🔍 Checking service health..."

# Check SSO Auth
if curl -f -s http://localhost:7775/health > /dev/null; then
    echo "✅ SSO Auth System: HEALTHY"
else
    echo "❌ SSO Auth System: FAILED"
    exit 1
fi

# Check Empire Gateway
if curl -f -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Empire Gateway: HEALTHY"
else
    echo "❌ Empire Gateway: FAILED"  
    exit 1
fi

echo ""
echo "🎮 EMPIRE SYSTEM FULLY OPERATIONAL! 🎮"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 EMPIRE ACCESS POINTS:"
echo "   • Main Empire Portal: http://localhost:8000"
echo "   • Authentication Hub: http://localhost:7775/dashboard"
echo "   • Gaming Hub (after login): http://localhost:8000/gaming-hub"
echo "   • Pirate Adventure: http://localhost:8000/games/pirate-adventure"
echo ""
echo "🔒 SECURITY FEATURES:"
echo "   • NO FREE ENTRY - All users must authenticate"
echo "   • Old-school username/screenname system"
echo "   • JWT token-based sessions"
echo "   • Cross-domain empire authentication"
echo "   • Gaming achievements and progression"
echo ""
echo "📋 TO ACCESS THE EMPIRE:"
echo "   1. Visit http://localhost:8000"
echo "   2. Click 'Join the Empire' to register"
echo "   3. Use invite code: EMPIRE2024, DEATHTODATA, or SOULFRA300"
echo "   4. Login with username/password"
echo "   5. Access gaming hub and all empire services"
echo ""
echo "🎯 GAMING FEATURES:"
echo "   • Cal's Pirate Adventure (with proper ship scaling)"
echo "   • Death Search Engine (boss battles)"
echo "   • Ship Combat Arena"
echo "   • Achievement system"
echo "   • Empire level progression"
echo ""
echo "🛑 TO STOP THE EMPIRE:"
echo "   • Press Ctrl+C or run: ./stop-empire-system.sh"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Empire System..."
    kill $SSO_PID 2>/dev/null
    kill $GATEWAY_PID 2>/dev/null
    echo "✅ Empire system stopped"
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

echo "🎮 Empire is running... Press Ctrl+C to stop"
echo "🌐 Main portal: http://localhost:8000"

# Keep script running and show live stats
while true; do
    sleep 30
    
    # Show live stats every 30 seconds
    echo ""
    echo "📊 EMPIRE STATUS UPDATE - $(date)"
    
    # Check if services are still running
    if ps -p $SSO_PID > /dev/null; then
        echo "🔐 SSO Auth: RUNNING (PID: $SSO_PID)"
    else
        echo "❌ SSO Auth: STOPPED - Restarting..."
        node universal-sso-auth-system.js &
        SSO_PID=$!
    fi
    
    if ps -p $GATEWAY_PID > /dev/null; then
        echo "🏰 Gateway: RUNNING (PID: $GATEWAY_PID)"
    else
        echo "❌ Gateway: STOPPED - Restarting..."
        node deathtodata-auth-gateway.js &
        GATEWAY_PID=$!
    fi
    
    # Try to get stats from auth system
    AUTH_STATS=$(curl -s http://localhost:7775/auth/stats 2>/dev/null | head -1)
    if [ ! -z "$AUTH_STATS" ]; then
        echo "📈 Auth Stats Available"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
done