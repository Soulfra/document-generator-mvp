#!/bin/bash

# 🔍 QUICK SYSTEM CHECK
# Simple service discovery without complex bash arrays

echo "🔍 QUICK SYSTEM STATUS CHECK"
echo "=========================="
echo ""

# Check common ports and what's running
check_port() {
    local port=$1
    local name=$2
    
    if nc -z localhost "$port" 2>/dev/null; then
        # Try to get service info
        local response=$(curl -s -m 3 "http://localhost:$port" 2>/dev/null || echo "")
        local health_response=$(curl -s -m 3 "http://localhost:$port/health" 2>/dev/null || echo "")
        local api_health=$(curl -s -m 3 "http://localhost:$port/api/health" 2>/dev/null || echo "")
        
        # Determine service name from response
        local detected_name="$name"
        if echo "$response" | grep -q "title"; then
            detected_name=$(echo "$response" | sed -n 's/.*<title>\(.*\)<\/title>.*/\1/p' | head -1 | sed 's/[🚀📊🎮🔗]//')
        fi
        if echo "$health_response" | grep -q "service"; then
            detected_name=$(echo "$health_response" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
        fi
        
        echo "✅ Port $port: $detected_name"
        echo "   🌐 http://localhost:$port"
        
        # Show a snippet of what's actually there
        if [ -n "$response" ]; then
            local snippet=$(echo "$response" | head -c 100 | tr -d '\n')
            echo "   📄 Preview: ${snippet}..."
        fi
        echo ""
        
        return 0
    else
        echo "❌ Port $port: $name (OFFLINE)"
        return 1
    fi
}

echo "📊 INFRASTRUCTURE SERVICES:"
echo "==========================="
check_port 5432 "PostgreSQL Database"
check_port 6379 "Redis Cache"
check_port 9000 "MinIO Storage"
check_port 11434 "Ollama AI Models"

echo ""
echo "📄 DOCUMENT GENERATOR SERVICES:"
echo "==============================="
check_port 3000 "Template Processor (MCP)"
check_port 3001 "AI API Service"
check_port 3002 "Analytics Service"
check_port 8080 "Platform Hub"
check_port 8081 "WebSocket Server"

echo ""
echo "🎮 GAMING SERVICES:"
echo "=================="
check_port 8800 "Master Gaming Platform"
check_port 7300 "Gacha Token System"
check_port 7090 "Persistent Tycoon"
check_port 7200 "Security Layer"
check_port 7100 "Cheat Engine"
check_port 7301 "Gaming WebSocket"

echo ""
echo "🔗 INTEGRATION SERVICES:"
echo "========================"
check_port 3500 "Document-Gaming Bridge"
check_port 3600 "Unified Authentication"
check_port 9200 "System Monitor"
check_port 9999 "Service Discovery Engine"

echo ""
echo "🎯 SUMMARY:"
echo "==========="

# Count running services
running_count=0
total_count=0

# Define all expected services
services=(
    "5432:PostgreSQL Database"
    "6379:Redis Cache" 
    "9000:MinIO Storage"
    "11434:Ollama AI Models"
    "3000:Template Processor"
    "3001:AI API Service"
    "3002:Analytics Service"
    "8080:Platform Hub"
    "8081:WebSocket Server"
    "8800:Gaming Platform"
    "7300:Gacha System"
    "7090:Persistent Tycoon"
    "7200:Security Layer"
    "7100:Cheat Engine"
    "7301:Gaming WebSocket"
    "3500:Document Bridge"
    "3600:Unified Auth"
    "9200:System Monitor"
    "9999:Service Discovery"
)

for service in "${services[@]}"; do
    port=$(echo "$service" | cut -d: -f1)
    total_count=$((total_count + 1))
    
    if nc -z localhost "$port" 2>/dev/null; then
        running_count=$((running_count + 1))
    fi
done

echo "🟢 Services Running: $running_count"
echo "🔴 Services Offline: $((total_count - running_count))"
echo "📊 Total Services: $total_count"

health_percentage=$((running_count * 100 / total_count))
echo "💚 System Health: ${health_percentage}%"

if [ $health_percentage -ge 80 ]; then
    echo "✅ System is in excellent condition!"
elif [ $health_percentage -ge 60 ]; then
    echo "⚠️  System needs some attention"
else
    echo "❌ System requires immediate revival!"
fi

echo ""
echo "🚀 TO START SERVICES:"
echo "===================="
echo "./revive-system.sh start    # Start all services"
echo "./revive-system.sh resume   # Resume offline services"
echo "./revive-system.sh revive   # Fix unhealthy services"
echo ""