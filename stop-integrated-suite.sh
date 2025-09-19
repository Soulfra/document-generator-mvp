#!/bin/bash
echo "🛑 Stopping Integrated Business Suite..."

# Stop business services first
echo "Stopping business services..."
kill 43974 43975 43976 43977 2>/dev/null

# Stop service discovery
echo "Stopping service discovery..."
kill 41921 2>/dev/null

# Force kill any remaining processes
lsof -ti:3013,3014,3015,7777,9999 | xargs kill -9 2>/dev/null

echo "✅ All services stopped"
echo "📋 Logs available in: accounting.log, tax.log, wallet.log, qr.log, service-discovery.log"
