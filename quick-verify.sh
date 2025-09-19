#!/bin/bash

# QUICK VERIFICATION SCRIPT
# Fast way to verify the system is working

echo "🔍 QUICK SYSTEM VERIFICATION"
echo "=========================="
echo

# Check services
echo "1️⃣ Checking services..."
HEALTH=$(curl -s http://localhost:4444/api/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Gateway is running"
    POSTGRES=$(echo $HEALTH | jq -r '.services.postgres')
    REDIS=$(echo $HEALTH | jq -r '.services.redis')
    BRIDGE=$(echo $HEALTH | jq -r '.services.bridge')
    
    [ "$POSTGRES" = "true" ] && echo "✅ PostgreSQL connected" || echo "❌ PostgreSQL not connected"
    [ "$REDIS" = "true" ] && echo "✅ Redis connected" || echo "❌ Redis not connected"
    [ "$BRIDGE" = "true" ] && echo "✅ Bridge connected" || echo "❌ Bridge not connected"
else
    echo "❌ Gateway not responding"
    echo "Run: ./empire-system-manager.sh start"
    exit 1
fi

# Check empire systems
echo
echo "2️⃣ Checking empire systems..."
SYSTEMS=$(curl -s http://localhost:3333/api/systems 2>/dev/null | jq -r '.totalFiles // 0')
if [ "$SYSTEMS" -gt 0 ]; then
    echo "✅ Found $SYSTEMS empire systems"
else
    echo "❌ No empire systems found"
fi

# Quick functionality test
echo
echo "3️⃣ Testing core functionality..."

# Create test user
USER=$(curl -s -X POST http://localhost:4444/api/users \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"quick_test_$$\",\"email\":\"quick@test.com\"}" 2>/dev/null)

if [ $? -eq 0 ]; then
    USER_ID=$(echo $USER | jq -r '.user.id // 0')
    if [ "$USER_ID" -gt 0 ]; then
        echo "✅ User creation works (ID: $USER_ID)"
        
        # Create test document
        DOC=$(curl -s -X POST http://localhost:4444/api/documents \
            -H "Content-Type: application/json" \
            -d "{\"userId\":$USER_ID,\"title\":\"Quick Test\",\"content\":\"Test content\",\"docType\":\"test\"}" 2>/dev/null)
        
        DOC_ID=$(echo $DOC | jq -r '.document.id // 0')
        [ "$DOC_ID" -gt 0 ] && echo "✅ Document creation works (ID: $DOC_ID)" || echo "❌ Document creation failed"
    else
        echo "❌ User creation failed"
    fi
else
    echo "❌ API not responding"
fi

# Check revenue
echo
echo "4️⃣ Checking revenue system..."
REVENUE=$(curl -s http://localhost:4444/api/revenue/summary 2>/dev/null | jq -r '.totalRevenue // 0')
echo "💰 Total revenue tracked: \$$REVENUE"

# Performance check
echo
echo "5️⃣ Quick performance check..."
START=$(date +%s%N)
curl -s http://localhost:4444/api/health > /dev/null 2>&1
END=$(date +%s%N)
ELAPSED=$(( ($END - $START) / 1000000 ))
echo "⚡ API response time: ${ELAPSED}ms"

# Summary
echo
echo "📊 SUMMARY"
echo "=========="
if [ "$POSTGRES" = "true" ] && [ "$REDIS" = "true" ] && [ "$BRIDGE" = "true" ] && [ "$USER_ID" -gt 0 ]; then
    echo "✅ System is WORKING!"
    echo
    echo "🌐 Access Points:"
    echo "   Dashboard: http://localhost:4444/"
    echo "   Mobile Games: http://localhost:4444/real-mobile-game-platform.html"
    echo "   Audit Firm: http://localhost:4444/real-audit-firm.html"
    echo
    echo "📝 Next Steps:"
    echo "   1. Deploy with: ./deploy-production.sh"
    echo "   2. Add QR sharing: node create-qr-sharing.js"
    echo "   3. Archive old files: ./cleanup-vortex.sh"
else
    echo "⚠️  System has issues - check failed items above"
fi