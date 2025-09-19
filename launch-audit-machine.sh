#!/bin/bash

echo "🔬 LAUNCHING NASA-GRADE AUDIT MACHINE"
echo "===================================="
echo ""
echo "Starting audit machine boss system..."

# Start the audit machine backend
node audit-machine-boss-system.js &
AUDIT_PID=$!

echo "✅ Audit machine started (PID: $AUDIT_PID)"
echo ""

# Give it a moment to initialize
sleep 2

# Open the web interface
echo "🌐 Opening audit machine interface..."
if command -v open &> /dev/null; then
    # macOS
    open audit-machine-web-interface.html
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open audit-machine-web-interface.html
elif command -v start &> /dev/null; then
    # Windows
    start audit-machine-web-interface.html
else
    echo "⚠️  Please open audit-machine-web-interface.html in your browser"
fi

echo ""
echo "🚀 AUDIT MACHINE READY!"
echo ""
echo "📍 Interface Features:"
echo "   • NASA-grade telemetry monitoring"
echo "   • 4 mandatory audit bosses to defeat"
echo "   • Petroleum-style fuel flow visualization"
echo "   • Pattern discovery engine"
echo "   • Immutable audit trail"
echo ""
echo "⚠️  IMPORTANT: You CANNOT bypass the audits!"
echo "   Each boss must be defeated to proceed."
echo ""
echo "Press Ctrl+C to shutdown the audit machine"
echo ""

# Wait for the backend process
wait $AUDIT_PID