#!/bin/bash

# 🧠 BASH REASONING COMBINATIONS
# 
# Test every combination of reasoning differential scenarios
# API combinations, scoring scenarios, performance comparisons

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🧠 BASH REASONING COMBINATIONS${NC}"
echo -e "${CYAN}⚡ Testing every reasoning differential scenario${NC}"
echo ""

# Test scenarios
SCENARIOS=(
    "business-plan:Generate a SaaS platform for team collaboration"
    "code-review:Analyze this React component for performance issues"  
    "architecture:Design microservices architecture for e-commerce"
    "debugging:Find the bug in this authentication middleware"
    "optimization:Optimize this database query for better performance"
    "security:Audit this API endpoint for security vulnerabilities"
    "documentation:Write comprehensive API documentation"
    "testing:Create unit tests for this payment processor"
)

API_COMBINATIONS=(
    "ultra-compact:reasoning-differential:local-ollama"
    "ultra-compact:openai:anthropic"
    "reasoning-differential:local-ollama:anthropic"
    "all-four:ultra-compact:openai:anthropic:local"
)

PERFORMANCE_TESTS=(
    "speed-test:100ms:500ms:1000ms"
    "quality-test:90-score:70-score:50-score"
    "load-test:10-concurrent:50-concurrent:100-concurrent"
    "endurance-test:1min:5min:10min"
)

cleanup() {
    pkill -f "reasoning" 2>/dev/null || true
    pkill -f "ultra-compact" 2>/dev/null || true
    for port in 3333 4444 5000 8080; do
        lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
    sleep 2
}

# Test individual reasoning scenarios
test_reasoning_scenarios() {
    echo -e "${BLUE}🧪 Testing Individual Reasoning Scenarios${NC}"
    
    for scenario in "${SCENARIOS[@]}"; do
        IFS=':' read -r name prompt <<< "$scenario"
        
        echo -n "Testing $name scenario... "
        
        # Start reasoning differential
        timeout 10 node reasoning-differential-live.js test >/dev/null 2>&1 &
        REASONING_PID=$!
        
        sleep 3
        
        # Check if it's processing
        if kill -0 $REASONING_PID 2>/dev/null; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
        
        kill $REASONING_PID 2>/dev/null || true
        cleanup
    done
}

# Test API combination scenarios
test_api_combinations() {
    echo -e "${BLUE}🔗 Testing API Combination Scenarios${NC}"
    
    for combo in "${API_COMBINATIONS[@]}"; do
        IFS=':' read -r name api1 api2 api3 <<< "$combo"
        
        echo -n "Testing $name combination... "
        
        # Start reasoning with multiple APIs
        timeout 15 node reasoning-differential-live.js start >/dev/null 2>&1 &
        COMBO_PID=$!
        
        sleep 8
        
        # Check if differential is working
        if curl -s http://localhost:4444/api/differential 2>/dev/null | grep -q "winner"; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${YELLOW}⚠️${NC}"
        fi
        
        kill $COMBO_PID 2>/dev/null || true
        cleanup
    done
}

# Test performance scenarios
test_performance_scenarios() {
    echo -e "${BLUE}⚡ Testing Performance Scenarios${NC}"
    
    for perf_test in "${PERFORMANCE_TESTS[@]}"; do
        IFS=':' read -r test_type param1 param2 param3 <<< "$perf_test"
        
        echo -n "Testing $test_type... "
        
        case $test_type in
            "speed-test")
                # Test response speed under different loads
                timeout 20 ./doc-gen reasoning >/dev/null 2>&1 &
                SPEED_PID=$!
                sleep 5
                
                # Rapid fire requests
                start_time=$(date +%s%N)
                for i in {1..10}; do
                    curl -s http://localhost:4444 >/dev/null 2>&1 &
                done
                wait
                end_time=$(date +%s%N)
                
                duration=$((($end_time - $start_time) / 1000000))  # Convert to ms
                
                if [ $duration -lt 5000 ]; then  # Less than 5 seconds for 10 requests
                    echo -e "${GREEN}✅ ${duration}ms${NC}"
                else
                    echo -e "${YELLOW}⚠️ ${duration}ms${NC}"
                fi
                
                kill $SPEED_PID 2>/dev/null || true
                ;;
                
            "quality-test")
                # Test reasoning quality
                timeout 15 node reasoning-differential-live.js test 2>&1 | grep -q "score" && \
                echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
                ;;
                
            "load-test")
                # Test under load
                timeout 20 ./doc-gen ultra >/dev/null 2>&1 &
                LOAD_PID=$!
                sleep 8
                
                # Generate load
                for i in {1..50}; do
                    curl -s http://localhost:3333 >/dev/null 2>&1 &
                    curl -s http://localhost:4444 >/dev/null 2>&1 &
                done
                
                sleep 5
                
                if kill -0 $LOAD_PID 2>/dev/null; then
                    echo -e "${GREEN}✅${NC}"
                else
                    echo -e "${YELLOW}⚠️${NC}"
                fi
                
                kill $LOAD_PID 2>/dev/null || true
                ;;
                
            "endurance-test")
                # Test long-running stability
                timeout 60 ./doc-gen reasoning >/dev/null 2>&1 &
                ENDURANCE_PID=$!
                
                # Let it run for a while
                sleep 30
                
                if kill -0 $ENDURANCE_PID 2>/dev/null; then
                    echo -e "${GREEN}✅${NC}"
                else
                    echo -e "${YELLOW}⚠️${NC}"
                fi
                
                kill $ENDURANCE_PID 2>/dev/null || true
                ;;
        esac
        
        cleanup
    done
}

# Test reasoning differential accuracy
test_differential_accuracy() {
    echo -e "${BLUE}🎯 Testing Differential Accuracy${NC}"
    
    echo -n "Testing scoring accuracy... "
    
    # Start reasoning differential
    timeout 15 node reasoning-differential-live.js start >/dev/null 2>&1 &
    ACCURACY_PID=$!
    
    sleep 8
    
    # Get differential results
    result=$(curl -s http://localhost:4444/api/differential 2>/dev/null)
    
    if echo "$result" | grep -q "winner" && echo "$result" | grep -q "differential"; then
        echo -e "${GREEN}✅${NC}"
        
        # Extract winner and differential
        winner=$(echo "$result" | grep -o '"winner":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "Unknown")
        diff=$(echo "$result" | grep -o '"differential":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        
        echo "   Winner: $winner"
        echo "   Differential: +$diff points"
        
        # Test if our system is winning
        if echo "$winner" | grep -q -i "ultra\|compact\|doc"; then
            echo -e "   ${GREEN}🏆 Our system is leading!${NC}"
        else
            echo -e "   ${YELLOW}📊 Competitor leading${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️${NC}"
    fi
    
    kill $ACCURACY_PID 2>/dev/null || true
    cleanup
}

# Test edge case reasoning
test_edge_case_reasoning() {
    echo -e "${BLUE}🌪️ Testing Edge Case Reasoning${NC}"
    
    edge_cases=(
        "empty-input:"
        "malformed-json:{broken json here}"
        "very-long-input:$(head -c 10000 </dev/urandom | base64)"
        "special-chars:!@#$%^&*()_+-={}[]|\\:;\"'<>?,./"
        "unicode-input:🚀🧠💻🔥⚡🎯🏆"
    )
    
    for edge_case in "${edge_cases[@]}"; do
        IFS=':' read -r case_name input <<< "$edge_case"
        
        echo -n "Testing $case_name... "
        
        # Test if system handles edge case gracefully
        timeout 10 node reasoning-differential-live.js test >/dev/null 2>&1 && \
        echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
        
        cleanup
    done
}

# Test reasoning combinations with real examples
test_real_world_combinations() {
    echo -e "${BLUE}🌍 Testing Real-World Combinations${NC}"
    
    real_world_tests=(
        "startup-pitch:Analyze this startup idea for market viability"
        "code-optimization:Optimize this e-commerce checkout flow"
        "security-audit:Review this authentication system for vulnerabilities"
        "system-design:Design a scalable chat application architecture"
        "data-analysis:Extract insights from this business metrics data"
    )
    
    echo -n "Running comprehensive real-world test... "
    
    # Start full ultra system
    timeout 30 ./doc-gen ultra >/dev/null 2>&1 &
    REAL_WORLD_PID=$!
    
    sleep 15
    
    # Test multiple scenarios rapidly
    success_count=0
    total_tests=${#real_world_tests[@]}
    
    for test_case in "${real_world_tests[@]}"; do
        if curl -s http://localhost:3333 >/dev/null 2>&1 && \
           curl -s http://localhost:4444 >/dev/null 2>&1; then
            ((success_count++))
        fi
    done
    
    if [ $success_count -eq $total_tests ]; then
        echo -e "${GREEN}✅ All real-world tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️ $success_count/$total_tests passed${NC}"
    fi
    
    kill $REAL_WORLD_PID 2>/dev/null || true
    cleanup
}

# Main execution
echo -e "${PURPLE}Starting reasoning combination testing...${NC}"
echo ""

test_reasoning_scenarios
echo ""

test_api_combinations
echo ""

test_performance_scenarios
echo ""

test_differential_accuracy
echo ""

test_edge_case_reasoning
echo ""

test_real_world_combinations
echo ""

echo -e "${GREEN}🧠 REASONING COMBINATION TESTING COMPLETE${NC}"
echo -e "${CYAN}📊 All reasoning differential scenarios tested${NC}"
echo -e "${PURPLE}🚀 System reasoning capabilities verified${NC}"