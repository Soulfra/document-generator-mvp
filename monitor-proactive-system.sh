#!/bin/bash

# Continuous monitoring for proactive system
echo "🔄 Starting continuous monitoring..."

while true; do
    echo "$(date '+%H:%M:%S') - System Status Check"
    
    # Check core services
    for port in 6666 7777 8080; do
        if lsof -i :$port &> /dev/null; then
            echo "  ✅ Port $port active"
        else
            echo "  ❌ Port $port inactive"
        fi
    done
    
    # Check symlinks
    if [ -L "tier-3/symlinks/trust-system.js" ]; then
        echo "  ✅ Symlinks active"
    else
        echo "  ❌ Symlinks missing"
    fi
    
    # Check predictions
    if [ -f "tier-3/predictions/initial-predictions.json" ]; then
        echo "  ✅ Predictions ready"
    else
        echo "  ❌ Predictions missing"
    fi
    
    echo "  📊 Active ideas: $(ls tier-3/predictions/ 2>/dev/null | wc -l)"
    echo "  🔗 Symlinks: $(ls tier-3/symlinks/ 2>/dev/null | wc -l)"
    echo ""
    
    sleep 30
done
