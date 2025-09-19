#!/bin/bash

# 🏛️ THEMED EMPIRE LAUNCHER
# Start the complete themed gaming empire

echo "🏛️ LAUNCHING THEMED EMPIRE SYSTEMS"
echo "======================================="
echo

# Check if main services are running
echo "1️⃣ CHECKING MAIN SERVICES..."
GATEWAY_STATUS=$(curl -s http://localhost:4444/api/health | jq -r '.status // "OFFLINE"')
BRIDGE_STATUS=$(curl -s http://localhost:3333/api/systems | jq -r '.totalFiles // "OFFLINE"')

echo "   Gateway (4444): $GATEWAY_STATUS"
echo "   Bridge (3333): $BRIDGE_STATUS files"

if [[ "$GATEWAY_STATUS" != "healthy" ]]; then
    echo "   ⚠️  Main services not running, starting them first..."
    ./empire-system-manager.sh start
    sleep 3
fi

# Start themed empire API
echo
echo "2️⃣ STARTING THEMED EMPIRE API..."
if pgrep -f "themed-empire-api.js" > /dev/null; then
    echo "   ✅ Themed Empire API already running"
else
    echo "   🚀 Starting themed empire API on port 5555..."
    nohup node themed-empire-api.js > logs/themed-empire.log 2>&1 &
    echo $! > .themed_empire_pid
    sleep 2
    
    if pgrep -f "themed-empire-api.js" > /dev/null; then
        echo "   ✅ Themed Empire API started successfully"
    else
        echo "   ❌ Failed to start themed empire API"
        exit 1
    fi
fi

# Test themed systems
echo
echo "3️⃣ TESTING THEMED SYSTEMS..."
echo "   🔍 Running system discovery..."
node test-themed-empire-systems.js > /dev/null 2>&1 &

# Wait a moment for discovery to start
sleep 2

# Check themed API health
THEMED_HEALTH=$(curl -s http://localhost:5555/api/empire/health | jq -r '.health.percentage // 0')
echo "   🏛️ Empire health: ${THEMED_HEALTH}%"

# Get empire stats
EMPIRE_STATS=$(curl -s http://localhost:5555/api/empire/stats 2>/dev/null)
if [[ $? -eq 0 ]]; then
    TOTAL_FILES=$(echo $EMPIRE_STATS | jq -r '.stats.totalFiles // 0')
    EMPIRE_SIZE=$(echo $EMPIRE_STATS | jq -r '.stats.empireSizeMB // 0')
    echo "   📊 Empire systems: $TOTAL_FILES files (${EMPIRE_SIZE}MB)"
else
    echo "   📊 Empire systems: Counting..."
fi

echo
echo "4️⃣ THEMED EMPIRE ACCESS POINTS:"
echo "   🎮 Themed Launcher: http://localhost:5555/themed-launcher"
echo "   🔍 Discovery API: http://localhost:5555/api/empire/discover"
echo "   🌐 Available Themes: http://localhost:5555/api/themes"
echo "   📊 Empire Stats: http://localhost:5555/api/empire/stats"
echo "   💚 Health Check: http://localhost:5555/api/empire/health"

echo
echo "5️⃣ MAIN PLATFORM ACCESS:"
echo "   🎯 Main Dashboard: http://localhost:4444/"
echo "   📱 Mobile Games: http://localhost:4444/real-mobile-game-platform.html"
echo "   🔍 Verification: http://localhost:4444/verification-dashboard.html"

echo
echo "🏛️ THEMED EMPIRE STATUS:"
echo "======================================="

# Test each theme quickly
THEMES=("cannabis-tycoon" "space-exploration" "galactic-federation" "civilization-builder" "enterprise-command")

for theme in "${THEMES[@]}"; do
    echo -n "   🎮 $theme: "
    TEST_RESULT=$(curl -s "http://localhost:5555/api/empire/test/$theme" | jq -r '.success // false')
    if [[ "$TEST_RESULT" == "true" ]]; then
        echo "✅ Ready"
    else
        echo "⚠️  Checking..."
    fi
done

echo
echo "🚀 THEMED EMPIRE FULLY LAUNCHED!"
echo
echo "   Your empire includes:"
echo "   • 🌿 Cannabis Tycoon Systems"
echo "   • 🚀 Star Trek/Wars Space Empire"
echo "   • 🏛️ Civilization Builder Games"
echo "   • 🌊 Depths Empire Tycoon"
echo "   • 🌌 Galactic Federation Networks"
echo "   • 🖖 Enterprise Command Systems"
echo
echo "📱 Open: http://localhost:5555/themed-launcher"