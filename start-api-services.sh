#!/bin/bash

# 🚀 SoulFRA API Services Startup Script
# Starts Brand Consultation API (port 3001) and MVP Generation API (port 3002)

echo "🌟 Starting SoulFRA API Services..."
echo "=================================="

# Create uploads directories
mkdir -p uploads
mkdir -p generated-mvps

# Kill existing processes on these ports
echo "🔄 Stopping existing services..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be released
sleep 2

# Start Brand Consultation API in background
echo "🎨 Starting Brand Consultation API on port 3001..."
node api/brand-consultation-api.js &
BRAND_PID=$!

# Wait a moment
sleep 2

# Start MVP Generation API in background
echo "❄️ Starting MVP Generation API on port 3002..."
node api/mvp-generation-api.js &
MVP_PID=$!

# Wait a moment for services to start
sleep 3

# Test if services are running
echo ""
echo "🧪 Testing API Services..."
echo "=========================="

# Test Brand API
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Brand Consultation API: Online"
else
    echo "❌ Brand Consultation API: Failed to start"
fi

# Test MVP API
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ MVP Generation API: Online"
else
    echo "❌ MVP Generation API: Failed to start"
fi

echo ""
echo "🌟 SoulFRA Services Ready!"
echo "========================"
echo "🎨 BrandAidKit:       http://localhost:8080/BrandAidKit.html"
echo "❄️ ColdStartKit:      http://localhost:8080/ColdStartKit.html" 
echo "🌟 SoulFRA Dashboard: http://localhost:8080/SoulFRA-Dashboard.html"
echo ""
echo "📡 API Endpoints:"
echo "🎨 Brand API Health:  http://localhost:3001/health"
echo "❄️ MVP API Health:    http://localhost:3002/health"
echo "🌐 Domain Registry:   http://localhost:3001/api/v1/domains"
echo ""
echo "Process IDs:"
echo "Brand API PID: $BRAND_PID"
echo "MVP API PID: $MVP_PID"
echo ""
echo "To stop services:"
echo "kill $BRAND_PID $MVP_PID"
echo ""
echo "Or use: ./stop-api-services.sh"
echo ""
echo "🚀 Ready to generate brands and MVPs!"

# Wait for user input to keep script running
echo "Press Ctrl+C to stop all services"
trap "echo ''; echo '🛑 Stopping services...'; kill $BRAND_PID $MVP_PID 2>/dev/null; echo '✅ Services stopped'; exit 0" INT

# Keep script running
while true; do
    sleep 1
done