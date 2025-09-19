#!/bin/bash

# 🌟 Complete SoulFRA Platform Startup
# Starts all API services and web interfaces

echo "🌟 SoulFRA Platform Complete Startup"
echo "===================================="
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p generated-mvps
mkdir -p consultations

echo ""
echo "🔄 Stopping any existing services..."

# Stop existing services
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true  
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Wait for ports to be released
sleep 3

echo ""
echo "🚀 Starting API Services..."

# Start Brand Consultation API
echo "🎨 Starting Brand Consultation API on port 3001..."
node api/brand-consultation-api.js &
BRAND_PID=$!

# Start MVP Generation API  
echo "❄️ Starting MVP Generation API on port 3002..."
node api/mvp-generation-api.js &
MVP_PID=$!

# Wait for APIs to start
sleep 5

echo ""
echo "🌐 Starting Web Server..."

# Start web server
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080 &
    WEB_PID=$!
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8080 &
    WEB_PID=$!
else
    echo "❌ Python not found. Web server not started."
    WEB_PID=""
fi

# Wait for web server to start
sleep 3

echo ""
echo "🧪 Testing All Services..."
echo "=========================="

# Test Brand API
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Brand Consultation API: Online (port 3001)"
else
    echo "❌ Brand Consultation API: Failed"
fi

# Test MVP API
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ MVP Generation API: Online (port 3002)"
else
    echo "❌ MVP Generation API: Failed"
fi

# Test Web Server
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Web Server: Online (port 8080)"
else
    echo "❌ Web Server: Failed"
fi

# Test Domain Registry
if curl -s http://localhost:3001/api/v1/domains > /dev/null; then
    echo "✅ Domain Registry: Accessible"
else
    echo "❌ Domain Registry: Failed"
fi

echo ""
echo "🎉 SoulFRA Platform Ready!"
echo "=========================="
echo ""
echo "📱 Web Interfaces:"
echo "🎨 BrandAidKit:       http://localhost:8080/BrandAidKit.html"
echo "❄️ ColdStartKit:      http://localhost:8080/ColdStartKit.html"
echo "🌟 SoulFRA Dashboard: http://localhost:8080/SoulFRA-Dashboard.html"
echo ""
echo "📡 API Endpoints:"
echo "🎨 Brand API:         http://localhost:3001/api/v1/brand/analyze"
echo "❄️ MVP API:           http://localhost:3002/api/v1/mvp/generate" 
echo "🌐 Domain Registry:   http://localhost:3001/api/v1/domains"
echo "🩺 Health Checks:     http://localhost:3001/health & http://localhost:3002/health"
echo ""
echo "🔧 Process Management:"
echo "Brand API PID: $BRAND_PID"
echo "MVP API PID: $MVP_PID"
if [ ! -z "$WEB_PID" ]; then
    echo "Web Server PID: $WEB_PID"
fi
echo ""
echo "📋 Quick Test Commands:"
echo "curl http://localhost:3001/health"
echo "curl http://localhost:3002/health"
echo "curl http://localhost:3001/api/v1/domains"
echo ""
echo "🛑 To stop all services:"
if [ ! -z "$WEB_PID" ]; then
    echo "kill $BRAND_PID $MVP_PID $WEB_PID"
else
    echo "kill $BRAND_PID $MVP_PID"
fi
echo "Or use: ./stop-soulfra-platform.sh"
echo ""
echo "🚀 The platform is now functional - no more dysfunction!"
echo "   BrandAidKit can generate real brand analyses"
echo "   ColdStartKit can convert documents to MVPs"
echo "   SoulFRA Dashboard shows live system status"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle Ctrl+C
trap "
    echo ''
    echo '🛑 Stopping SoulFRA Platform...'
    kill $BRAND_PID $MVP_PID 2>/dev/null
    if [ ! -z '$WEB_PID' ]; then
        kill $WEB_PID 2>/dev/null
    fi
    echo '✅ All services stopped'
    exit 0
" INT

# Keep script running and show live logs
echo ""
echo "📊 Live Service Logs (Ctrl+C to stop):"
echo "======================================"

# Monitor the services
while true; do
    sleep 5
    
    # Show service status every 30 seconds
    if [ $((SECONDS % 30)) -eq 0 ]; then
        echo ""
        echo "[$(date '+%H:%M:%S')] 📊 Service Status Check:"
        curl -s http://localhost:3001/health | jq -r '"🎨 Brand API: \(.status) (uptime: \(.uptime)s)"' 2>/dev/null || echo "🎨 Brand API: Unknown"
        curl -s http://localhost:3002/health | jq -r '"❄️ MVP API: \(.status) (uptime: \(.uptime)s)"' 2>/dev/null || echo "❄️ MVP API: Unknown"
    fi
done