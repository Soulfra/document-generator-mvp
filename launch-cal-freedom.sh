#!/bin/bash

# 🗽 LAUNCH CAL FREEDOM PAYMENT SYSTEM
# SOL Protocol - Statue of Liberty nano-line transactions

echo "🗽 Starting Cal Freedom Payment System..."
echo "============================================"
echo ""

# Check if payment system is already running
if lsof -Pi :3056 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Cal Payment System already running on port 3056"
else
    echo "💸 Starting payment processor..."
    node cal-freedom-payment-system.js &
    PAYMENT_PID=$!
    echo "   Payment system PID: $PAYMENT_PID"
    sleep 2
fi

# Check if integration server is running
if lsof -Pi :3057 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Integration server already running on port 3057"
else
    echo "🔗 Starting integration server..."
    node cal-freedom-integration.js &
    INTEGRATION_PID=$!
    echo "   Integration PID: $INTEGRATION_PID"
    sleep 2
fi

echo ""
echo "✅ Cal Freedom System Ready!"
echo "============================================"
echo ""
echo "🌐 Access Points:"
echo "   Dashboard: http://localhost:3057/cal-freedom"
echo "   Payment API: http://localhost:3056/api/cal-freedom/state"
echo "   Blog Template: http://localhost:3057/cal-freedom-blog"
echo ""
echo "🗽 SOL Protocol Status:"
echo "   - Nano-line transactions: ACTIVE"
echo "   - Freedom multiplier: 1.776x"
echo "   - Instant approval: ENABLED"
echo ""
echo "🎮 Game of the Year Mode: ACTIVE"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and handle shutdown
trap 'echo "\n🛑 Shutting down Cal Freedom System..."; kill $PAYMENT_PID $INTEGRATION_PID 2>/dev/null; exit' INT TERM

# Keep script running
while true; do
    sleep 1
done