#!/bin/bash
# Test the REAL drag & drop interface

echo "🧪 TESTING DRAG & DROP INTERFACE"
echo "================================"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules/express" ]; then
    echo "📦 Installing dependencies..."
    npm install express multer node-fetch
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting drag & drop server..."
echo ""

# Run the server
node real-drag-drop.js