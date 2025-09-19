#!/bin/bash

# Verify Unified System - Tests domain-based routing
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Document Generator - Unified System Verification${NC}"
echo "================================================"

# Check if running with nginx
check_nginx() {
    echo -e "\n${YELLOW}Checking Nginx status...${NC}"
    if command -v nginx &> /dev/null; then
        if pgrep -x "nginx" > /dev/null; then
            echo -e "${GREEN}✓ Nginx is running${NC}"
            return 0
        else
            echo -e "${RED}✗ Nginx is not running${NC}"
            echo "  Start with: sudo nginx"
            return 1
        fi
    else
        echo -e "${RED}✗ Nginx not installed${NC}"
        echo "  Install with: brew install nginx (macOS) or sudo apt install nginx (Linux)"
        return 1
    fi
}

# Check hosts file entries
check_hosts() {
    echo -e "\n${YELLOW}Checking hosts file entries...${NC}"
    local missing=0
    local domains=(
        "documentgenerator.app"
        "app.documentgenerator.app"
        "api.documentgenerator.app"
        "auth.documentgenerator.app"
        "game.documentgenerator.app"
        "monitor.documentgenerator.app"
    )
    
    for domain in "${domains[@]}"; do
        if grep -q "$domain" /etc/hosts; then
            echo -e "${GREEN}✓ $domain configured${NC}"
        else
            echo -e "${RED}✗ $domain missing from /etc/hosts${NC}"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -gt 0 ]; then
        echo -e "\n${YELLOW}Add missing entries to /etc/hosts:${NC}"
        echo "127.0.0.1 documentgenerator.app"
        echo "127.0.0.1 app.documentgenerator.app"
        echo "127.0.0.1 api.documentgenerator.app"
        echo "127.0.0.1 auth.documentgenerator.app"
        echo "127.0.0.1 game.documentgenerator.app"
        echo "127.0.0.1 monitor.documentgenerator.app"
    fi
    
    return $missing
}

# Test unified domain routing
test_domain_routing() {
    echo -e "\n${YELLOW}Testing domain routing...${NC}"
    
    # Test main domain
    echo -n "Testing http://documentgenerator.app... "
    if curl -s -o /dev/null -w "%{http_code}" "http://documentgenerator.app" | grep -q "200\|404"; then
        echo -e "${GREEN}✓ Accessible${NC}"
    else
        echo -e "${RED}✗ Not accessible${NC}"
    fi
    
    # Test subdomains
    local subdomains=("app" "api" "auth" "game" "monitor")
    for subdomain in "${subdomains[@]}"; do
        echo -n "Testing http://$subdomain.documentgenerator.app... "
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://$subdomain.documentgenerator.app" 2>/dev/null)
        if [[ "$response" =~ ^(200|302|404)$ ]]; then
            echo -e "${GREEN}✓ Routing works (HTTP $response)${NC}"
        else
            echo -e "${RED}✗ Not routing properly${NC}"
        fi
    done
}

# Test actual services through unified domain
test_services() {
    echo -e "\n${YELLOW}Testing services through unified domains...${NC}"
    
    # Test Platform Hub
    echo -n "Platform Hub (app.documentgenerator.app): "
    if curl -s "http://app.documentgenerator.app/health" | grep -q "ok\|healthy"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    # Test API endpoints
    echo -n "Template API (api.documentgenerator.app/templates): "
    local api_response=$(curl -s -o /dev/null -w "%{http_code}" "http://api.documentgenerator.app/templates")
    if [[ "$api_response" =~ ^(200|401|404)$ ]]; then
        echo -e "${GREEN}✓ API routing works${NC}"
    else
        echo -e "${RED}✗ API not accessible${NC}"
    fi
    
    # Test Auth Service
    echo -n "Auth Service (auth.documentgenerator.app): "
    if curl -s "http://auth.documentgenerator.app/health" | grep -q "ok\|healthy"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Check if service is running on port 3600${NC}"
    fi
}

# Check original ports (fallback)
check_original_ports() {
    echo -e "\n${YELLOW}Checking original service ports (fallback)...${NC}"
    
    local services=(
        "Platform Hub:8080"
        "Template Processor:3000"
        "AI API:3001"
        "Analytics:3002"
        "Unified Auth:3600"
        "Gaming Platform:8800"
        "System Monitor:9200"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        echo -n "$name (localhost:$port): "
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" | grep -q "200\|404"; then
            echo -e "${GREEN}✓ Running${NC}"
        else
            echo -e "${RED}✗ Not accessible${NC}"
        fi
    done
}

# Show unified URLs
show_unified_urls() {
    echo -e "\n${BLUE}📎 Unified System URLs:${NC}"
    echo "================================"
    echo "Main App:     http://app.documentgenerator.app"
    echo "API:          http://api.documentgenerator.app"
    echo "Auth:         http://auth.documentgenerator.app"
    echo "Gaming:       http://game.documentgenerator.app"
    echo "Monitor:      http://monitor.documentgenerator.app"
    echo ""
    echo "Room URLs:    http://[room-id].app.documentgenerator.app"
    echo "Example:      http://sarah.app.documentgenerator.app"
}

# Main execution
echo "Starting unified system verification..."

# Run checks
nginx_ok=0
hosts_ok=0

if check_nginx; then
    nginx_ok=1
fi

if check_hosts; then
    hosts_ok=0
else
    hosts_ok=1
fi

# Only test domain routing if nginx and hosts are configured
if [ $nginx_ok -eq 1 ] && [ $hosts_ok -eq 0 ]; then
    test_domain_routing
    test_services
else
    echo -e "\n${YELLOW}⚠ Skipping domain tests - configure nginx and hosts first${NC}"
fi

# Always check original ports
check_original_ports

# Show URLs
show_unified_urls

# Summary
echo -e "\n${BLUE}📊 Summary:${NC}"
if [ $nginx_ok -eq 1 ] && [ $hosts_ok -eq 0 ]; then
    echo -e "${GREEN}✓ Unified domain system is configured${NC}"
    echo "  Access your app at: http://app.documentgenerator.app"
else
    echo -e "${YELLOW}⚠ Unified domain system needs configuration${NC}"
    echo "  1. Configure /etc/hosts entries"
    echo "  2. Start nginx with the provided config"
    echo "  3. Run this script again to verify"
fi

echo -e "\n${BLUE}Current system uses multiple ports - unified domain provides cleaner URLs${NC}"