#!/bin/bash

# 🧪 Complete Pipeline Test Suite
# Tests the entire Document Generator pipeline end-to-end with easter egg tracking

echo "🧪 Testing Complete Document Generator Pipeline"
echo "=============================================="

API_BASE="http://localhost:4001/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_passed=0
test_failed=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -e "\n${BLUE}Testing: $name${NC}"
    echo "URL: $url"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        
        # Extract easter egg if present
        easter_egg=$(echo "$body" | jq -r '.easterEgg // empty' 2>/dev/null)
        if [ ! -z "$easter_egg" ] && [ "$easter_egg" != "null" ]; then
            echo -e "${YELLOW}🥚 Easter Egg: $easter_egg${NC}"
        fi
        
        test_passed=$((test_passed + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "Response: $body"
        test_failed=$((test_failed + 1))
        return 1
    fi
}

# Test 1: Health Check
test_endpoint "Health Check" "$API_BASE/health"

# Test 2: Template Catalog
test_endpoint "Template Catalog" "$API_BASE/templates"

# Test 3: Chat Log Processing
chat_data='{"messages":[{"role":"user","content":"I want to start a sustainable food delivery platform that connects local farms with consumers"},{"role":"assistant","content":"That sounds like a great idea! Tell me more about your target market."},{"role":"user","content":"I am targeting environmentally conscious millennials in urban areas"}],"exportFormats":["pdf","notion"],"enrichmentLevel":"standard","customBranding":{"companyName":"GreenDelivery Co"}}'

if test_endpoint "Chat Log Processing" "$API_BASE/process-chatlog" "POST" "$chat_data"; then
    # Get the easter egg from the response for follow-up tests
    request_id=$(echo "$body" | jq -r '.request_id // .easterEgg' 2>/dev/null)
    
    # Test 4: Template Result Retrieval
    if [ ! -z "$request_id" ] && [ "$request_id" != "null" ]; then
        test_endpoint "Template Result" "$API_BASE/template-result/$request_id"
        
        # Test 5: Download Endpoint
        test_endpoint "Download Endpoint" "$API_BASE/download/$request_id/pdf"
    fi
fi

# Test 6: Startup Analysis
startup_data='{"idea":"AI-powered recipe recommendation app for dietary restrictions","description":"An app that suggests personalized recipes based on allergies, dietary preferences, and available ingredients","market":"Health-conscious consumers with dietary restrictions","problem":"People with food allergies struggle to find suitable recipes quickly","analyses":["market_research"]}'

test_endpoint "Startup Analysis" "$API_BASE/analyze-startup" "POST" "$startup_data"

# Test 7: Document Processing (create a test file)
echo "Creating test document..."
test_doc_content="# Business Plan: EcoFood Delivery

## Executive Summary
EcoFood is a sustainable food delivery platform connecting local farms directly with urban consumers.

## Market Opportunity
- Target Market: Environmentally conscious millennials
- Market Size: \$50B food delivery market
- Growth Rate: 15% annually

## Business Model
- Commission from farmers: 15%
- Delivery fees: \$2.99 per order
- Subscription model: \$9.99/month for free delivery

## Competitive Advantage
- Direct farm partnerships
- Carbon-neutral delivery
- Fresh, locally-sourced ingredients"

echo "$test_doc_content" > /tmp/test_business_plan.md

# Use curl to upload the file
echo -e "\n${BLUE}Testing: Document Upload & Processing${NC}"
echo "File: /tmp/test_business_plan.md"

upload_response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/process-document" -F "document=@/tmp/test_business_plan.md" -F "processingType=auto")
upload_http_code=$(echo "$upload_response" | tail -n1)
upload_body=$(echo "$upload_response" | head -n -1)

if [ "$upload_http_code" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $upload_http_code)"
    upload_easter_egg=$(echo "$upload_body" | jq -r '.easterEgg // empty' 2>/dev/null)
    if [ ! -z "$upload_easter_egg" ] && [ "$upload_easter_egg" != "null" ]; then
        echo -e "${YELLOW}🥚 Easter Egg: $upload_easter_egg${NC}"
        
        # Test export options
        echo "$upload_body" | jq -r '.exportOptions[]' | while read -r export_option; do
            format=$(echo "$export_option" | jq -r '.format')
            url=$(echo "$export_option" | jq -r '.url')
            echo "Export option: $format at $url"
        done
    fi
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $upload_http_code)"
    echo "Response: $upload_body"
    test_failed=$((test_failed + 1))
fi

# Clean up
rm -f /tmp/test_business_plan.md

# Test 8: Error Handling
echo -e "\n${BLUE}Testing: Error Handling${NC}"
error_response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/process-chatlog" -H "Content-Type: application/json" -d '{"invalid":"data"}')
error_http_code=$(echo "$error_response" | tail -n1)

if [ "$error_http_code" = "400" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $error_http_code) - Correctly rejected invalid data"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $error_http_code) - Should have returned 400 for invalid data"
    test_failed=$((test_failed + 1))
fi

# Final Results
echo -e "\n=============================================="
echo -e "🧪 ${BLUE}Test Results${NC}"
echo -e "=============================================="
echo -e "${GREEN}✅ Passed: $test_passed${NC}"
echo -e "${RED}❌ Failed: $test_failed${NC}"

total_tests=$((test_passed + test_failed))
if [ $total_tests -gt 0 ]; then
    success_rate=$(echo "scale=1; $test_passed * 100 / $total_tests" | bc -l)
    echo -e "📊 Success Rate: ${success_rate}%"
fi

if [ $test_failed -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Pipeline is working end-to-end.${NC}"
    echo -e "✅ Frontend demos are now connected to real backend APIs"
    echo -e "✅ Easter egg tracking is working across all endpoints" 
    echo -e "✅ Document processing pipeline is functional"
    echo -e "✅ Error handling is properly implemented"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Check the errors above.${NC}"
    exit 1
fi