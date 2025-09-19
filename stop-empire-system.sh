#!/bin/bash

# 🛑 EMPIRE SYSTEM STOPPER
# Gracefully shutdown all empire services

echo "🛑 STOPPING DEATHTODATA EMPIRE SYSTEM..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find and kill empire processes
echo "🔍 Finding empire processes..."

# Kill by process name patterns
pkill -f "deathtodata-auth-gateway" && echo "✅ DeathToData Gateway stopped"
pkill -f "universal-sso-auth-system" && echo "✅ SSO Auth System stopped"

# Kill by port (backup method)
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Port 8000 cleared"
lsof -ti:7775 | xargs kill -9 2>/dev/null && echo "✅ Port 7775 cleared"

sleep 2

# Check if processes are still running
if pgrep -f "deathtodata-auth-gateway" > /dev/null; then
    echo "⚠️  Gateway still running, force killing..."
    pkill -9 -f "deathtodata-auth-gateway"
fi

if pgrep -f "universal-sso-auth-system" > /dev/null; then
    echo "⚠️  SSO Auth still running, force killing..."
    pkill -9 -f "universal-sso-auth-system"
fi

echo ""
echo "🧹 CLEANUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All empire services stopped"
echo "✅ Ports 7775 and 8000 are now free"
echo "✅ Database files remain intact"
echo ""
echo "🔄 TO RESTART THE EMPIRE:"
echo "   ./launch-empire-system.sh"
echo ""
echo "🏰 The empire awaits your return..."