#!/bin/bash

# 🎨 CAL BRAND INTEGRATION LAUNCHER SCRIPT
# Launches the complete brand integration system with all services

echo "🎨 CAL Brand Integration System"
echo "==============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "launch-cal-brand-integration.js" ]; then
    echo "❌ launch-cal-brand-integration.js not found"
    echo "Please run this script from the Document Generator root directory"
    exit 1
fi

echo "🔍 Checking system requirements..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install express node-fetch
fi

# Check if Cultural Brand Generator exists and is executable
if [ -f "cultural-brand-generator.js" ]; then
    echo "✅ Cultural Brand Generator found"
else
    echo "⚠️ Cultural Brand Generator not found - will run in mock mode"
fi

# Check for required files
REQUIRED_FILES=(
    "cal-brand-commands.js"
    "brand-ranking-interface.html" 
    "database-brand-extensions.sql"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        MISSING_FILES=true
    fi
done

if [ "$MISSING_FILES" = true ]; then
    echo "❌ Some required files are missing"
    echo "Please ensure all brand integration files are present"
    exit 1
fi

echo ""
echo "🚀 Launching CAL Brand Integration System..."
echo ""

# Launch the integration system
node launch-cal-brand-integration.js

echo ""
echo "👋 CAL Brand Integration System shutdown complete"