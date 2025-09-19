#!/bin/bash

# 🎮 START CAL FORUM - Simple phpBB-style forum with Cal AI roaster
echo "🎮 Starting Cal's Gacha Roasting Forum..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill existing processes
pkill -f "cal-forum-server" 2>/dev/null
pkill -f "python.*3333" 2>/dev/null
pkill -f "http-server.*3333" 2>/dev/null

sleep 1

# Check if we have a simple HTTP server available
if command -v python3 &> /dev/null; then
    echo "🐍 Starting with Python HTTP server..."
    cd "/Users/matthewmauer/Desktop/Document-Generator"
    python3 -m http.server 3333 &
    SERVER_PID=$!
    echo "✅ Forum available at: http://localhost:3333/phpbb-cal-forum.html"
    
elif command -v http-server &> /dev/null; then
    echo "📡 Starting with http-server..."
    cd "/Users/matthewmauer/Desktop/Document-Generator"
    http-server -p 3333 &
    SERVER_PID=$!
    echo "✅ Forum available at: http://localhost:3333/phpbb-cal-forum.html"
    
else
    echo "❌ No HTTP server available. Install one with:"
    echo "   npm install -g http-server"
    echo "   or use Python 3"
    exit 1
fi

sleep 2

echo ""
echo "🎯 CAL'S GACHA ROASTING FORUM IS LIVE! 🎯"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Forum URL: http://localhost:3333/phpbb-cal-forum.html" 
echo ""
echo "🎰 FEATURES:"
echo "   • Classic phpBB 2005 forum style"
echo "   • Cal AI with RuneScape pet mechanics" 
echo "   • RNG/gacha random responses"
echo "   • ASCII art in every response"
echo "   • Screenshot-worthy roasts"
echo "   • Simple 2D pixel aesthetics"
echo ""
echo "📋 HOW TO USE:"
echo "   1. Visit the forum URL above"
echo "   2. Ask Cal anything in the post form"
echo "   3. Cal will randomly spawn and roast you"
echo "   4. Screenshot the best responses!"
echo "   5. Share on social media"
echo ""
echo "🎮 This is what you wanted - simple, fun, shareable!"
echo "📝 All conversations saved locally for chapter creation later"
echo ""
echo "🛑 TO STOP: Press Ctrl+C or run: kill $SERVER_PID"
echo ""

# Keep script running
trap "echo ''; echo '🛑 Shutting down Cal Forum...'; kill $SERVER_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo "🎮 Forum is running... Press Ctrl+C to stop"
echo "🌐 URL: http://localhost:3333/phpbb-cal-forum.html"

while true; do
    sleep 30
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Server died, restarting..."
        if command -v python3 &> /dev/null; then
            python3 -m http.server 3333 &
            SERVER_PID=$!
        fi
    fi
done