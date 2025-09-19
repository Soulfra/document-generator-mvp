#!/bin/bash
echo "🛑 Stopping Document Generator..."

if [ -f .dashboard.pid ]; then
    kill $(cat .dashboard.pid) 2>/dev/null
    rm -f .dashboard.pid
    echo "✅ Dashboard server stopped"
fi

echo "✅ Services stopped!"
echo "💡 Docker containers are still running for data persistence"
echo "   To stop Docker containers: docker-compose down"
