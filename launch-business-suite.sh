#!/bin/bash

echo "🚀 LAUNCHING UNIFIED BUSINESS SUITE"
echo "==================================="
echo ""

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:3013 | xargs kill -9 2>/dev/null
lsof -ti:3014 | xargs kill -9 2>/dev/null
lsof -ti:3015 | xargs kill -9 2>/dev/null
lsof -ti:7777 | xargs kill -9 2>/dev/null

sleep 2

# Start all services
echo "📊 Starting Business Accounting System (Port 3013)..."
node business-accounting-system.js > accounting.log 2>&1 &
ACCOUNTING_PID=$!

echo "🧮 Starting Tax Intelligence Engine (Port 3014)..."
node tax-intelligence-engine.js > tax.log 2>&1 &
TAX_PID=$!

echo "💳 Starting Wallet Address Manager (Port 3015)..."
node wallet-address-manager-simple.js > wallet.log 2>&1 &
WALLET_PID=$!

echo "📱 Starting QR Tax Tracker (Port 7777)..."
node QR-HANDSHAKE-TAX-TRACKER.js > qr.log 2>&1 &
QR_PID=$!

sleep 3

# Check if services are running
echo ""
echo "✅ CHECKING SERVICE STATUS:"
echo "=========================="

curl -s http://localhost:3013/health > /dev/null && echo "✓ Accounting System: http://localhost:3013" || echo "✗ Accounting System failed to start"
curl -s http://localhost:3014/health > /dev/null && echo "✓ Tax Intelligence: http://localhost:3014" || echo "✗ Tax Intelligence failed to start"
curl -s http://localhost:3015/health > /dev/null && echo "✓ Wallet Manager: http://localhost:3015" || echo "✗ Wallet Manager failed to start"
curl -s http://localhost:7777/status > /dev/null && echo "✓ QR Tax Tracker: http://localhost:7777" || echo "✗ QR Tax Tracker failed to start"

echo ""
echo "🎯 UNIFIED DASHBOARD:"
echo "===================="
echo "Open unified-business-dashboard.html in your browser"
echo "Or visit: file://$PWD/unified-business-dashboard.html"
echo ""

# Open dashboard in browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open unified-business-dashboard.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open unified-business-dashboard.html
fi

echo "📝 Process IDs saved for cleanup:"
echo "Accounting: $ACCOUNTING_PID"
echo "Tax: $TAX_PID"
echo "Wallet: $WALLET_PID"
echo "QR: $QR_PID"

# Create stop script
cat > stop-business-suite.sh << EOF
#!/bin/bash
echo "Stopping Business Suite..."
kill $ACCOUNTING_PID $TAX_PID $WALLET_PID $QR_PID 2>/dev/null
lsof -ti:3013,3014,3015,7777 | xargs kill -9 2>/dev/null
echo "✅ All services stopped"
EOF

chmod +x stop-business-suite.sh

echo ""
echo "To stop all services, run: ./stop-business-suite.sh"
echo ""
echo "🎉 Business Suite is ready!"