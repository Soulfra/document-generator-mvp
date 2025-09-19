#!/bin/bash
echo "🛑 Stopping all routers..."

if [ -f .router_pids ]; then
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            echo "🔪 Killing process $pid"
            kill $pid
        fi
    done < .router_pids
    rm -f .router_pids
else
    echo "No PID file found, killing by port..."
    pkill -f "MCP-CONNECTOR.js"
    pkill -f "DUNGEON-MASTER-ROUTER.js"
fi

echo "✅ All routers stopped"
