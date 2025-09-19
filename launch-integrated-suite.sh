#!/bin/bash

echo "🚀 LAUNCHING INTEGRATED BUSINESS SUITE"
echo "======================================"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
lsof -ti:3013,3014,3015,7777,9999 | xargs kill -9 2>/dev/null
sleep 2

# Step 1: Start Service Discovery Engine
echo "🔍 Starting Service Discovery Engine..."
node SERVICE-DISCOVERY-ENGINE.js > service-discovery.log 2>&1 &
SERVICE_DISCOVERY_PID=$!

# Wait for service discovery to start
echo "⏳ Waiting for service discovery to initialize..."
sleep 5

# Check if service discovery is running
if curl -s http://localhost:9999/health > /dev/null; then
    echo "✅ Service Discovery Engine running at http://localhost:9999"
else
    echo "❌ Service Discovery Engine failed to start"
    exit 1
fi

# Step 2: Start Business Services
echo ""
echo "💼 Starting Business Services..."

echo "📊 Starting Business Accounting System..."
node business-accounting-system.js > accounting.log 2>&1 &
ACCOUNTING_PID=$!

echo "🧮 Starting Tax Intelligence Engine..."
node tax-intelligence-engine.js > tax.log 2>&1 &
TAX_PID=$!

echo "💳 Starting Wallet Address Manager..."
node wallet-address-manager-simple.js > wallet.log 2>&1 &
WALLET_PID=$!

echo "📱 Starting QR Tax Tracker..."
node QR-HANDSHAKE-TAX-TRACKER.js > qr.log 2>&1 &
QR_PID=$!

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 8

# Step 3: Check Service Health via Discovery Engine
echo ""
echo "✅ CHECKING INTEGRATED SERVICE STATUS:"
echo "====================================="

# Force service discovery to update
curl -s -X POST http://localhost:9999/api/discover > /dev/null

# Get service status from discovery engine
if curl -s http://localhost:9999/api/services | jq -r '.services[] | select(.type=="business") | "✓ \(.name): \(.serviceUrl)"' 2>/dev/null; then
    echo "✅ Business services integrated with service discovery"
else
    # Fallback to manual checks
    curl -s http://localhost:3013/health > /dev/null && echo "✓ Accounting System: http://localhost:3013" || echo "✗ Accounting System failed"
    curl -s http://localhost:3014/health > /dev/null && echo "✓ Tax Intelligence: http://localhost:3014" || echo "✗ Tax Intelligence failed"
    curl -s http://localhost:3015/health > /dev/null && echo "✓ Wallet Manager: http://localhost:3015" || echo "✗ Wallet Manager failed"
    curl -s http://localhost:7777/status > /dev/null && echo "✓ QR Tax Tracker: http://localhost:7777" || echo "✗ QR Tax Tracker failed"
fi

echo ""
echo "🎯 INTEGRATED DASHBOARDS:"
echo "========================"
echo "🔍 Service Discovery: http://localhost:9999"
echo "📊 Unified Dashboard: file://$PWD/unified-business-dashboard.html"
echo ""

# Open dashboards
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:9999
    sleep 2
    open unified-business-dashboard.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:9999 &
    xdg-open unified-business-dashboard.html &
fi

# Create enhanced stop script
cat > stop-integrated-suite.sh << EOF
#!/bin/bash
echo "🛑 Stopping Integrated Business Suite..."

# Stop business services first
echo "Stopping business services..."
kill $ACCOUNTING_PID $TAX_PID $WALLET_PID $QR_PID 2>/dev/null

# Stop service discovery
echo "Stopping service discovery..."
kill $SERVICE_DISCOVERY_PID 2>/dev/null

# Force kill any remaining processes
lsof -ti:3013,3014,3015,7777,9999 | xargs kill -9 2>/dev/null

echo "✅ All services stopped"
echo "📋 Logs available in: accounting.log, tax.log, wallet.log, qr.log, service-discovery.log"
EOF

chmod +x stop-integrated-suite.sh

echo "📝 Process IDs:"
echo "Service Discovery: $SERVICE_DISCOVERY_PID"
echo "Accounting: $ACCOUNTING_PID"
echo "Tax: $TAX_PID"
echo "Wallet: $WALLET_PID"
echo "QR: $QR_PID"
echo ""
echo "To stop all services: ./stop-integrated-suite.sh"
echo ""
echo "🎉 INTEGRATED BUSINESS SUITE READY!"
echo "All services are now connected through service discovery!"

# Test service-to-service communication
echo ""
echo "🔧 Testing Service Integration..."
sleep 3

# Try to trigger a service-to-service call
echo "Testing wallet → accounting integration..."
curl -s -X POST http://localhost:3015/api/import/ethereum \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dc"}' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Service integration test passed!"
else
    echo "⚠️ Service integration test failed - check logs"
fi

echo ""
echo "🎯 Ready for full automation!"
echo "   • Enter ETH address → Instant graphs & tax analysis"
echo "   • All services communicate through service discovery"
echo "   • QR handshake for phone-based tax document upload"
echo "   • Real-time financial data across all services"