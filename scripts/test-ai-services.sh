#!/bin/bash

# Test AI services connectivity and performance
# Usage: ./test-ai-services.sh

set -e

echo "🤖 Testing AI Services"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test a service
test_service() {
    local service_name="$1"
    local test_url="$2"
    local test_data="$3"
    
    echo -n "Testing $service_name... "
    
    start_time=$(date +%s.%N)
    
    if response=$(curl -s -X POST "$test_url" \
        -H "Content-Type: application/json" \
        -d "$test_data" 2>/dev/null); then
        
        end_time=$(date +%s.%N)
        duration=$(echo "$end_time - $start_time" | bc)
        
        if echo "$response" | grep -q "error"; then
            echo -e "${RED}FAILED${NC}"
            echo "  Error: $(echo "$response" | grep -o '"error":"[^"]*' | cut -d'"' -f4)"
            ((TESTS_FAILED++))
        else
            echo -e "${GREEN}PASSED${NC} (${duration}s)"
            ((TESTS_PASSED++))
        fi
    else
        echo -e "${RED}FAILED${NC} (Connection error)"
        ((TESTS_FAILED++))
    fi
}

# Test Ollama
echo "1. Testing Ollama (Local AI)"
echo "----------------------------"

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "${GREEN}✓${NC} Ollama is running"
    
    # List available models
    echo "Available models:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*' | cut -d'"' -f4 | sed 's/^/  - /'
    
    # Test generation
    test_service "Ollama Generation" \
        "http://localhost:11434/api/generate" \
        '{"model":"mistral","prompt":"Write a hello world function in Python","stream":false}'
else
    echo -e "${RED}✗${NC} Ollama is not running"
    ((TESTS_FAILED++))
fi

echo ""

# Test Template Processor AI
echo "2. Testing Template Processor AI Service"
echo "---------------------------------------"

test_service "Template AI Analysis" \
    "http://localhost:3000/api/test-ai" \
    '{"text":"Create a mobile app for food delivery","service":"ollama"}'

echo ""

# Test AI API Service
echo "3. Testing AI API Service"
echo "------------------------"

test_service "Code Analysis" \
    "http://localhost:3001/ai/analyze" \
    '{"code":"function hello() { console.log(\"Hello World\"); }","language":"javascript"}'

test_service "Code Cleanup" \
    "http://localhost:3001/ai/cleanup" \
    '{"code":"function hello(){console.log(\"Hello World\");}","language":"javascript"}'

echo ""

# Test Cloud AI Services (if configured)
echo "4. Testing Cloud AI Services"
echo "---------------------------"

# Check if API keys are configured
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    test_service "Claude AI" \
        "http://localhost:3001/ai/analyze" \
        '{"code":"print(\"Hello World\")","language":"python","provider":"anthropic"}'
else
    echo -e "${YELLOW}⚠${NC} Anthropic API key not configured"
fi

if [ ! -z "$OPENAI_API_KEY" ]; then
    test_service "OpenAI GPT" \
        "http://localhost:3001/ai/analyze" \
        '{"code":"print(\"Hello World\")","language":"python","provider":"openai"}'
else
    echo -e "${YELLOW}⚠${NC} OpenAI API key not configured"
fi

echo ""

# Performance comparison
echo "5. Performance Comparison"
echo "------------------------"

echo "Testing response times for code generation..."

# Test prompt
PROMPT='{"prompt":"Generate a REST API endpoint for user registration with email validation","language":"typescript"}'

# Ollama
echo -n "Ollama (local): "
start=$(date +%s.%N)
curl -s -X POST http://localhost:3001/ai/generate \
    -H "Content-Type: application/json" \
    -d "$(echo $PROMPT | jq '. + {provider: "ollama"}')" > /dev/null
end=$(date +%s.%N)
ollama_time=$(echo "$end - $start" | bc)
echo "${ollama_time}s"

# Claude (if available)
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo -n "Claude AI: "
    start=$(date +%s.%N)
    curl -s -X POST http://localhost:3001/ai/generate \
        -H "Content-Type: application/json" \
        -d "$(echo $PROMPT | jq '. + {provider: "anthropic"}')" > /dev/null
    end=$(date +%s.%N)
    claude_time=$(echo "$end - $start" | bc)
    echo "${claude_time}s"
fi

# OpenAI (if available)
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo -n "OpenAI GPT: "
    start=$(date +%s.%N)
    curl -s -X POST http://localhost:3001/ai/generate \
        -H "Content-Type: application/json" \
        -d "$(echo $PROMPT | jq '. + {provider: "openai"}')" > /dev/null
    end=$(date +%s.%N)
    openai_time=$(echo "$end - $start" | bc)
    echo "${openai_time}s"
fi

echo ""

# Cost estimation
echo "6. Cost Estimation (per 1000 requests)"
echo "-------------------------------------"
echo "Ollama (local): $0.00"
[ ! -z "$ANTHROPIC_API_KEY" ] && echo "Claude AI: ~$15.00"
[ ! -z "$OPENAI_API_KEY" ] && echo "OpenAI GPT-4: ~$30.00"

echo ""

# Summary
echo "Test Summary"
echo "============"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All AI services are working correctly!${NC}"
else
    echo -e "\n${RED}❌ Some AI services have issues. Check the errors above.${NC}"
fi

echo ""
echo "Recommendations:"
echo "- For cost efficiency, use Ollama for most tasks"
echo "- Use Claude/GPT for complex code generation only"
echo "- Enable caching to reduce API calls"
echo "- Monitor usage at http://localhost:3002/analytics"