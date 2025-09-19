#!/bin/bash

echo "📱 PHONE CONNECTION SETUP"
echo "========================"
echo ""

# Get local IP address
echo "🔍 Finding your local IP address..."
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    # Try alternative method for different systems
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null)
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not automatically detect IP address"
    echo "   Run 'ifconfig' or 'ip addr' to find your local IP"
    echo ""
else
    echo "✅ Your local IP address: $LOCAL_IP"
    echo ""
    echo "📱 TO CONNECT YOUR PHONE:"
    echo "  1. Connect phone to same WiFi network as this computer"
    echo "  2. Open browser on phone"
    echo "  3. Go to: http://$LOCAL_IP:8090/"
    echo ""
    echo "🎮 PHONE ACCESS POINTS:"
    echo "  • Main Game: http://$LOCAL_IP:8090/"
    echo "  • Digital Archaeology: http://$LOCAL_IP:8090/archaeology"
    echo "  • Achievements: http://$LOCAL_IP:8090/achievements"
    echo "  • 3D Games: http://$LOCAL_IP:8090/3d"
    echo ""
fi

echo "🔐 SECURITY NOTE:"
echo "  • This runs on your local network only"
echo "  • No external connections required"
echo "  • No tracking or data collection"
echo "  • Everything stays on your devices"
echo ""

echo "🎯 WHAT TO TRY FIRST:"
echo "  1. Visit the Digital Archaeology system"
echo "  2. Plan an expedition to GeoCities ruins"
echo "  3. Try the universal morse code encoder"
echo "  4. Build structures to unlock achievements"
echo "  5. Explore the 3D games (fog of war is fun!)"
echo ""

echo "✨ This is your personal digital archaeology platform!"
echo "   Like having morse code for the entire internet 🏛️"