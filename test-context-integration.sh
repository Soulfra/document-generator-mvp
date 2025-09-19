#!/bin/bash

# TEST CONTEXT INTEGRATION
# Shows how the database context engine and wrapper work together

echo "🧠 TESTING CONTEXT ENGINE INTEGRATION 🧠"
echo ""

# Test 1: Database Context Engine
echo "=== TEST 1: Database Context Engine ==="
echo "Searching through domains and services..."
node database-context-engine.js search "roi prediction"
echo ""

echo "Graph traversal from soulfra.com..."
node database-context-engine.js graph "domain:soulfra.com" 2
echo ""

# Test 2: Universal Context Wrapper
echo -e "\n=== TEST 2: Universal Context Wrapper ==="
echo "Wrapping soulfra.com with full context..."
node universal-context-wrapper.js wrap domain soulfra.com
echo ""

echo "Listing all contexts and connections..."
node universal-context-wrapper.js list
echo ""

# Test 3: Integration Demo
echo -e "\n=== TEST 3: Full Integration Demo ==="
echo "Running database context demo..."
node database-context-engine.js demo
echo ""

echo "Running wrapper demo..."
node universal-context-wrapper.js demo
echo ""

echo "✅ Context integration test complete!"
echo ""
echo "Key Points:"
echo "1. Database Context Engine - Search, graph, and SQL through your data"
echo "2. Universal Context Wrapper - Proper context management, not just tarballs"
echo "3. Real connections between domains, services, and schemas"
echo "4. Integration with existing learning pipeline and reasoning engine"