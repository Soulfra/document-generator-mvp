#!/bin/bash

echo "
🌐 STARTING NON-TECHNICAL USER PORTAL 🌐
======================================

This portal allows users to:
✅ Sign in with GitHub (no coding needed)
✅ Upload documents via drag & drop
✅ Generate complete apps automatically
✅ Deploy with one click
✅ Build wikis, docs, or prove concepts

No command line or technical knowledge required!
"

# Make sure we have the required dependencies
echo "📦 Checking dependencies..."
npm list express > /dev/null 2>&1 || npm install express

# Check if Complete Project Pipeline is running
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Complete Project Pipeline already running on port 8888"
else
    echo "🚀 Starting Complete Project Pipeline..."
    PORT=8888 node COMPLETE-PROJECT-PIPELINE.js start > pipeline.log 2>&1 &
    sleep 3
fi

# Check which port to use for portal
PORT=3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is in use, trying 3333..."
    PORT=3333
fi

# Start the portal server
echo "🌐 Starting Portal Server on port $PORT..."
PORT=$PORT node portal-server.js &
PORTAL_PID=$!

sleep 2

echo "
✅ PORTAL IS READY! ✅
===================

🌐 Visit: http://localhost:$PORT/portal

What you can do:
1. Click 'Sign in with GitHub' (simulated for demo)
2. Upload any document (business plan, chat log, etc.)
3. Select what type of app you want
4. Click 'Generate My App'
5. Download or deploy your app

Try demo mode without signing in:
http://localhost:$PORT/portal/demo

Press Ctrl+C to stop the portal.
"

# Keep the script running
wait $PORTAL_PID