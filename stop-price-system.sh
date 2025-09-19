#!/bin/bash

# Stop Price System - Cleanly shuts down all components

echo "🛑 Stopping Price System..."
echo "========================="

# Read PIDs if available
if [ -f .price-system.pids ]; then
    source .price-system.pids
    
    echo "Stopping processes from PID file..."
    [ ! -z "$AGGREGATOR_PID" ] && kill $AGGREGATOR_PID 2>/dev/null && echo "   ✅ Stopped Crypto Aggregator"
    [ ! -z "$FLASK_PID" ] && kill $FLASK_PID 2>/dev/null && echo "   ✅ Stopped Flask API"
    [ ! -z "$FETCHER_PID" ] && kill $FETCHER_PID 2>/dev/null && echo "   ✅ Stopped Data Fetcher"
    [ ! -z "$BRIDGE_PID" ] && kill $BRIDGE_PID 2>/dev/null && echo "   ✅ Stopped Integration Bridge"
    
    rm .price-system.pids
else
    echo "No PID file found, killing by process name..."
    pkill -f "crypto-data-aggregator.js" && echo "   ✅ Stopped Crypto Aggregator"
    pkill -f "flask-price-api.py" && echo "   ✅ Stopped Flask API"
    pkill -f "data-fetcher/index.js" && echo "   ✅ Stopped Data Fetcher"
    pkill -f "dashboard-integration-bridge.js" && echo "   ✅ Stopped Integration Bridge"
fi

echo ""
echo "✅ Price System stopped"