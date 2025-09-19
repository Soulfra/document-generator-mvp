#!/bin/bash

# 🏪 Start N8N Automation Marketplace
# Launch complete marketplace system with all dependencies

echo "🏪 Starting N8N Automation Marketplace..."

# Set environment variables
export MARKETPLACE_ENCRYPTION_KEY=$(openssl rand -hex 32)
export NODE_ENV=development

# Create public directory if it doesn't exist
mkdir -p public

# Check if required services are running
echo "🔍 Checking required services..."

# Check if n8n-api-bridge is running on port 8001
if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "⚠️  N8N API Bridge not running on port 8001"
    echo "   Starting n8n-api-bridge.js..."
    node n8n-api-bridge.js &
    sleep 2
fi

# Check if template marketplace is running on port 3000
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  Template marketplace not running on port 3000"
    echo "   You may need to start the template service manually"
fi

# Check if component marketplace is running on port 8002
if ! curl -s http://localhost:8002/health > /dev/null 2>&1; then
    echo "⚠️  Component marketplace not running on port 8002"
    echo "   You may need to start the component service manually"
fi

echo ""
echo "🚀 Starting N8N Automation Marketplace Converter..."

# Start the marketplace converter
node n8n-automation-marketplace-converter.js &
MARKETPLACE_PID=$!

# Wait a moment for the service to start
sleep 3

# Check if the service started successfully
if curl -s http://localhost:8090/health > /dev/null 2>&1; then
    echo "✅ Marketplace started successfully!"
    echo ""
    echo "🌐 Marketplace URLs:"
    echo "   • Frontend: http://localhost:8090/marketplace.html"
    echo "   • API: http://localhost:8090/api/packages"
    echo "   • Health: http://localhost:8090/health"
    echo ""
    echo "📦 Available Package Types:"
    echo "   • Document Processing Suite ($149)"
    echo "   • AI Character & Customer Management ($199)"
    echo "   • Business Intelligence Automation ($299)"
    echo ""
    echo "💡 API Integration:"
    echo "   • Convert documents: POST /api/convert/document"
    echo "   • Generate workflows: POST /api/workflows/generate"
    echo "   • Purchase packages: POST /api/packages/:id/purchase"
    echo ""
    echo "📊 Analytics Dashboard:"
    echo "   • Sales data: GET /api/sales/analytics"
    echo "   • Revenue tracking available"
    echo ""
    echo "🔐 Security Features:"
    echo "   • Encrypted API key storage"
    echo "   • License validation"
    echo "   • Secure package distribution"
    echo ""
    echo "Press Ctrl+C to stop the marketplace"
    
    # Open the marketplace in browser (optional)
    # Uncomment the next line if you want auto-open
    # open http://localhost:8090/marketplace.html
    
else
    echo "❌ Failed to start marketplace service"
    exit 1
fi

# Keep the script running and handle cleanup
trap cleanup EXIT

cleanup() {
    echo ""
    echo "🛑 Shutting down N8N Automation Marketplace..."
    
    if [ ! -z "$MARKETPLACE_PID" ]; then
        kill $MARKETPLACE_PID 2>/dev/null
    fi
    
    echo "✅ Marketplace stopped"
}

# Wait for the marketplace process
wait $MARKETPLACE_PID