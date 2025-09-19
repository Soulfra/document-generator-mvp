#!/bin/bash

# 📊 CHECK META-LEARNING SYSTEM STATUS
# 
# Shows the current status of all meta-learning components

echo "📊 META-LEARNING SYSTEM STATUS"
echo "=============================="
echo ""
echo "Timestamp: $(date)"
echo ""

# Function to check service status
check_service() {
    local name=$1
    local pid_file="logs/${name}.pid"
    local log_file="logs/${name}.log"
    
    echo "🔍 ${name}:"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "   ✅ Status: Running (PID: $pid)"
            
            # Get memory usage
            local mem=$(ps -o rss= -p $pid | awk '{print $1/1024 "MB"}')
            echo "   💾 Memory: $mem"
            
            # Get CPU usage
            local cpu=$(ps -o %cpu= -p $pid)
            echo "   🔥 CPU: ${cpu}%"
            
            # Check log file
            if [ -f "$log_file" ]; then
                local log_size=$(du -h "$log_file" | cut -f1)
                echo "   📝 Log size: $log_size"
                
                # Show last error if any
                local last_error=$(grep -i "error\|failed\|exception" "$log_file" | tail -1)
                if [ ! -z "$last_error" ]; then
                    echo "   ⚠️  Last error: ${last_error:0:80}..."
                fi
            fi
        else
            echo "   ❌ Status: Not running (stale PID file)"
            rm -f "$pid_file"
        fi
    else
        echo "   ❌ Status: Not running"
    fi
    
    echo ""
}

# Services to check
services=(
    "meta-learning-error-system"
    "error-knowledge-vault"
    "proactive-error-prevention"
    "claude-instruction-updater"
)

# Check each service
for service in "${services[@]}"; do
    check_service "$service"
done

# Check database files
echo "💾 Database Status:"
echo "==================="

if [ -f "meta-error-knowledge.db" ]; then
    size=$(du -h "meta-error-knowledge.db" | cut -f1)
    echo "✅ meta-error-knowledge.db: $size"
fi

if [ -f "error-patterns.db" ]; then
    size=$(du -h "error-patterns.db" | cut -f1)
    echo "✅ error-patterns.db: $size"
fi

if [ -f ".vault/error-knowledge/knowledge.db" ]; then
    size=$(du -h ".vault/error-knowledge/knowledge.db" | cut -f1)
    echo "✅ error-knowledge vault: $size"
fi

echo ""

# Check CLAUDE.md files
echo "📄 CLAUDE.md Files:"
echo "==================="

claude_files=(
    "CLAUDE.md"
    "CLAUDE.meta-lessons.md"
    "CLAUDE.ai-services.md"
    "CLAUDE.document-parser.md"
    "CLAUDE.template-processor.md"
)

for file in "${claude_files[@]}"; do
    if [ -f "$file" ]; then
        # Get last modified time
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
        else
            # Linux
            modified=$(stat -c "%y" "$file" | cut -d'.' -f1)
        fi
        echo "✅ $file - Last updated: $modified"
    else
        echo "❌ $file - Not found"
    fi
done

echo ""

# Quick statistics
echo "📊 Quick Statistics:"
echo "===================="

# Count error patterns if database exists
if [ -f "meta-error-knowledge.db" ]; then
    pattern_count=$(sqlite3 meta-error-knowledge.db "SELECT COUNT(*) FROM error_patterns;" 2>/dev/null || echo "0")
    echo "🔍 Error patterns tracked: $pattern_count"
fi

# Count active PIDs
active_services=0
for service in "${services[@]}"; do
    pid_file="logs/${service}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            ((active_services++))
        fi
    fi
done

echo "✅ Active services: $active_services / ${#services[@]}"
echo ""

# Show recent activity
echo "📋 Recent Activity:"
echo "==================="

if [ -d "logs" ]; then
    echo "Last 5 log entries across all services:"
    echo ""
    tail -n 5 logs/*.log 2>/dev/null | grep -v "==>" | grep -v "^$" | head -10 || echo "No recent activity found"
fi

echo ""
echo "💡 Tips:"
echo "- Run './start-meta-learning-system.sh' to start all services"
echo "- Run 'tail -f logs/*.log' to watch real-time logs"
echo "- Check '.vault/error-knowledge/exports/' for knowledge backups"