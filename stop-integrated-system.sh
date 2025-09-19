#!/bin/bash
echo "🛑 Stopping integrated system..."

# Kill processes from PID file
if [ -f .integrated_system_pids ]; then
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping process $pid"
            kill $pid
        fi
    done < .integrated_system_pids
    rm -f .integrated_system_pids
fi

# Also kill by name as backup
pkill -f 'node.*character-database'
pkill -f 'node.*carrot-reinforcement'
pkill -f 'node.*learning-chain'
pkill -f 'node.*bash-system'
pkill -f 'node.*unified-api'

# Stop Docker services
echo "Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"
