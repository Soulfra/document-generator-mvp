#!/bin/bash
echo "🛑 STOPPING ALL SYSTEMS"
echo "======================="

# Kill processes by PID files
[ -f .consensus.pid ] && kill $(cat .consensus.pid) 2>/dev/null && echo "✅ Stopped Consensus System"
[ -f .swarm.pid ] && kill $(cat .swarm.pid) 2>/dev/null && echo "✅ Stopped Agent Swarm"
[ -f .economy.pid ] && kill $(cat .economy.pid) 2>/dev/null && echo "✅ Stopped Dual Economy"
[ -f .morytania.pid ] && kill $(cat .morytania.pid) 2>/dev/null && echo "✅ Stopped Morytania System"

# Kill any remaining node processes
pkill -f "node.*AGENT" 2>/dev/null
pkill -f "node.*CONSENSUS" 2>/dev/null
pkill -f "node.*DUAL" 2>/dev/null
pkill -f "node.*MORYTANIA" 2>/dev/null

# Clean up PID files
rm -f .consensus.pid .swarm.pid .economy.pid .morytania.pid

echo ""
echo "🎯 All systems stopped!"
