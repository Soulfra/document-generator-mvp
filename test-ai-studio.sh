#!/bin/bash

echo "🧪 Testing AI Reasoning Animation Studio..."
echo "==========================================="
echo ""

# Test if service is running
echo "1️⃣ Checking if service is running..."
STATUS=$(curl -s http://localhost:8765/api/studio/status)
if [ $? -eq 0 ]; then
    echo "✅ Service is running"
    echo "   Response: $STATUS"
else
    echo "❌ Service is not responding"
    exit 1
fi

echo ""
echo "2️⃣ Testing all endpoints..."
echo ""

# Test each endpoint
for TEST_TYPE in internal websocket empire database; do
    echo "Testing $TEST_TYPE..."
    RESPONSE=$(curl -s -X POST http://localhost:8765/api/test-connection \
        -H "Content-Type: application/json" \
        -d "{\"testType\":\"$TEST_TYPE\",\"serviceName\":\"$TEST_TYPE\"}")
    
    SUCCESS=$(echo $RESPONSE | grep -o '"success":true')
    if [ ! -z "$SUCCESS" ]; then
        echo "✅ $TEST_TYPE test passed"
    else
        echo "❌ $TEST_TYPE test failed"
        echo "   Response: $RESPONSE"
    fi
done

echo ""
echo "3️⃣ Checking log file..."
if [ -f "ai-studio-connection-tests.log" ]; then
    echo "✅ Log file exists"
    echo "   Last 3 entries:"
    tail -3 ai-studio-connection-tests.log | sed 's/^/   /'
else
    echo "❌ Log file not found"
fi

echo ""
echo "=========================================="
echo "🎯 To test in browser:"
echo "   1. Open http://localhost:8765"
echo "   2. Look for the 'Connection Status' section"
echo "   3. Click each test button"
echo "   4. Check browser console (F12) for debug logs"
echo ""
echo "✅ Testing complete!"