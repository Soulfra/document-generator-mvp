#!/bin/bash
echo "🛑 Stopping Remote CALOs System..."

# Kill services
if [ -f pids/calos-server.pid ]; then
    kill $(cat pids/calos-server.pid) 2>/dev/null
    rm pids/calos-server.pid
fi

if [ -f pids/chat-processor.pid ]; then
    kill $(cat pids/chat-processor.pid) 2>/dev/null
    rm pids/chat-processor.pid
fi

if [ -f pids/ngrok-calos.pid ]; then
    kill $(cat pids/ngrok-calos.pid) 2>/dev/null
    rm pids/ngrok-calos.pid
fi

# Kill any remaining ngrok processes
pkill -f "ngrok http 8892" 2>/dev/null

echo "✅ Remote CALOs System stopped"
