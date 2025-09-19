#!/bin/bash

echo "🔍 DEPLOYMENT VERIFICATION SCRIPT"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL (local or production)
BASE_URL="${1:-http://localhost:8888}"

echo "Testing endpoints at: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Testing $description ($endpoint)... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
        return 1
    fi
}

# Test all endpoints
echo "📡 Testing API Endpoints:"
test_endpoint "/" "Main API"
test_endpoint "/api/status" "Status Endpoint"
test_endpoint "/voxel" "3D Voxel Interface"
test_endpoint "/squash" "4.5D Squash Processor"
test_endpoint "/mvp" "MVP Compactor"
test_endpoint "/wormhole" "Wormhole PWA Merger"
test_endpoint "/login" "Soulfra Login"
test_endpoint "/manifest.json" "PWA Manifest"

echo ""
echo "📊 Checking API Status:"
status_response=$(curl -s "$BASE_URL/api/status")
if [ $? -eq 0 ]; then
    echo "$status_response" | jq '.' 2>/dev/null || echo "$status_response"
else
    echo -e "${RED}Failed to fetch status${NC}"
fi

echo ""
echo "🚀 Testing Document Processing:"
# Create a test file
echo "Test document content" > test-doc.txt

# Test file upload (if endpoint exists)
if curl -s "$BASE_URL/api/process-document" > /dev/null 2>&1; then
    echo "Document processing endpoint available"
else
    echo -e "${YELLOW}Document processing endpoint not configured${NC}"
fi

# Clean up
rm -f test-doc.txt

echo ""
echo "🌐 Checking Production Deployments:"

# Check Railway
echo -n "Railway deployment... "
if curl -s -o /dev/null -w "%{http_code}" "https://document-generator.railway.app" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Live${NC}"
else
    echo -e "${YELLOW}⚠ Not deployed yet${NC}"
fi

# Check Vercel
echo -n "Vercel deployment... "
if curl -s -o /dev/null -w "%{http_code}" "https://document-generator.vercel.app" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Live${NC}"
else
    echo -e "${YELLOW}⚠ Not deployed yet${NC}"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Railway: ./deploy-to-railway.sh"
echo "2. Deploy to Vercel: ./deploy-to-vercel.sh"
echo "3. Configure DNS: ./deploy-dns-wormhole.sh"
echo "4. Set environment variables in production"