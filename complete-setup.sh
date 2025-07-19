#!/bin/bash

# COMPLETE SETUP - Environment, Dependencies, and Testing

echo "🚀 DOCUMENT GENERATOR - COMPLETE SETUP"
echo "======================================"
echo ""

# Step 1: Create environment
echo "📋 Step 1: Setting up environment..."
node setup-environment.js

echo ""
echo "📋 Step 2: Installing dependencies..."
npm install

echo ""
echo "📋 Step 3: Running minimal test..."
node minimal-test.js

echo ""
echo "📋 Step 4: Checking connections..."
node tier-connector.js

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo ""
echo "1. Start Character System:"
echo "   node character-system-max.js"
echo ""
echo "2. Start Web Interface:"
echo "   node execute-character-system.js"
echo "   → Open http://localhost:8888"
echo ""
echo "3. Test Everything:"
echo "   node test-it-now.js"
echo ""
echo "4. View All Connections:"
echo "   node connect-everything.js"
echo ""
echo "💡 TIP: If you get errors, check:"
echo "   - .env file exists"
echo "   - node_modules installed"
echo "   - Ollama running (optional)"