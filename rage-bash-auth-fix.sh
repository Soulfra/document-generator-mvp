#!/bin/bash

# 🛡️⚔️ RAGE BASH AUTH FIX - WARRIOR SHIELD SLAM APPROACH ⚔️🛡️
# When API errors hit and confusion reigns, deploy the warrior's rage

echo "🛡️⚔️ WARRIOR SHIELD SLAM - API AUTH FIX"
echo "======================================"
echo "Deploying forceful approach to break through auth barriers..."
echo ""

# Save current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# PHASE 1: TURTLE SHELL DETECTION & BREAKING
echo "💥 PHASE 1: BREAKING DEFENSIVE LAYERS..."
echo "Checking for turtle shell defensive layers..."

# Run turtle shell detection
if [ -f "web-interface/turtle-shell-3pack-bash.js" ]; then
    node web-interface/turtle-shell-3pack-bash.js detect
    
    # If detection shows issues, deploy full bash
    echo "Deploying 3 PACK BASH to break through..."
    node web-interface/turtle-shell-3pack-bash.js bash
else
    echo "⚠️ Turtle shell bash system not found, continuing..."
fi

echo ""
echo "🔐 PHASE 2: FORCING AUTH SYSTEM RESTART..."
echo "Killing stuck auth processes..."

# Kill all auth-related processes
pkill -f "auth|Auth|AUTH" 2>/dev/null || true
pkill -f "deathtodata|soulfra" 2>/dev/null || true
pkill -f "middleware" 2>/dev/null || true

# Wait for processes to die
sleep 2

# Force load environment variables
echo "Loading environment variables..."
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "❌ .env file not found! Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "⚠️ Created .env from example - YOU NEED TO ADD API KEYS!"
    fi
fi

# Force export critical API keys (from your .env)
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-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}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-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}"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-sk-251cc3d0befc44e79e921f5ba21e0c5d}"

echo ""
echo "🚀 PHASE 3: STARTING SERVICES WITH RAGE..."

# Start auth middleware with force
if [ -f "auth-middleware-unified.js" ]; then
    echo "Starting unified auth middleware..."
    NODE_ENV=production node auth-middleware-unified.js &
    AUTH_PID=$!
    echo "Auth middleware started with PID: $AUTH_PID"
fi

# Start deathtodata-soulfra auth bridge
if [ -f "deathtodata-soulfra-auth-bridge.js" ]; then
    echo "Starting deathtodata-soulfra auth bridge..."
    NODE_ENV=production node deathtodata-soulfra-auth-bridge.js &
    BRIDGE_PID=$!
    echo "Auth bridge started with PID: $BRIDGE_PID"
fi

# Wait for services to initialize
sleep 3

echo ""
echo "🩺 PHASE 4: DOCTOR SYSTEM DIAGNOSIS..."
echo "Running bash-doctor-echo system to diagnose all problems..."

# Run bash doctor echo if available
if [ -f "bash-doctor-echo.js" ]; then
    node bash-doctor-echo.js
else
    echo "⚠️ Bash doctor echo not found, skipping diagnosis..."
fi

echo ""
echo "🚢 PHASE 5: LAUNCHING SHIP FLEET..."
echo "Starting ship fleet discovery..."

# Navigate to ship fleet interface
if [ -d "ship-fleet-interface" ]; then
    cd ship-fleet-interface
    
    # Run ship registry discovery
    if [ -f "ship-registry.js" ]; then
        echo "Discovering all systems and mapping to ships..."
        node ship-registry.js discover
    else
        echo "⚠️ Ship registry not found"
    fi
    
    cd ..
fi

echo ""
echo "🔍 PHASE 6: VERIFICATION..."
echo "Checking system status..."

# Check if services are running
echo ""
echo "Running services:"
ps aux | grep -E "(auth|Auth|deathtodata|soulfra|middleware)" | grep -v grep || echo "No auth services found running"

# Check if API keys are set
echo ""
echo "API Key Status:"
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ Anthropic API key is set (${#ANTHROPIC_API_KEY} chars)"
else
    echo "❌ Anthropic API key is NOT set"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI API key is set (${#OPENAI_API_KEY} chars)"
else
    echo "❌ OpenAI API key is NOT set"
fi

if [ -n "$DEEPSEEK_API_KEY" ]; then
    echo "✅ DeepSeek API key is set (${#DEEPSEEK_API_KEY} chars)"
else
    echo "❌ DeepSeek API key is NOT set"
fi

echo ""
echo "✅ RAGE BASH COMPLETE!"
echo "===================="
echo ""
echo "Next steps:"
echo "1. Check if auth services are responding"
echo "2. Test API endpoints with: curl http://localhost:8888/health"
echo "3. Continue with ship fleet interface development"
echo ""
echo "If issues persist, run: ./rage-bash-auth-fix.sh again with MORE RAGE! 💪"