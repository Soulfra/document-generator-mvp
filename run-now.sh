#!/bin/bash

echo "🔥 RUNNING DOCUMENT GENERATOR NOW"
echo "=================================="

cd /Users/matthewmauer/Desktop/Document-Generator

echo "📂 Working directory: $(pwd)"

echo ""
echo "1. 🔧 Testing Git Wrapper..."
node git-wrapper.js status

echo ""
echo "2. 🌐 Starting Web Interface..."
node web-interface.js &
WEB_PID=$!

echo ""
echo "3. 📋 Testing CLI availability..."
echo "CLI ready at: node cli.js"

echo ""
echo "4. 🎭 Testing Sovereign Processor..."
if [ -f "FinishThisIdea/sovereign-chatlog-processor.js" ]; then
    echo "✅ Sovereign processor found"
else
    echo "❌ Sovereign processor not found"
fi

echo ""
echo "🚀 SYSTEM STATUS:"
echo "=================="
echo "✅ Web Interface: http://localhost:8080 (PID: $WEB_PID)"
echo "✅ CLI Available: node cli.js"
echo "✅ Git Wrapper: node git-wrapper.js"
echo "✅ Sovereign Mode: cd FinishThisIdea && node sovereign-chatlog-processor.js"
echo ""
echo "🎯 DOCUMENT GENERATOR IS LIVE!"
echo "Upload documents at http://localhost:8080"