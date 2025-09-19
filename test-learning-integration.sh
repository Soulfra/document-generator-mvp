#!/bin/bash

# TEST LEARNING INTEGRATION
# Tests the pipeline submission process

echo "🧠 TESTING LEARNING PIPELINE INTEGRATION 🧠"
echo ""

# Check if simple-site exists
if [ ! -d "simple-site" ]; then
  echo "❌ Error: simple-site directory not found"
  echo "The simple site should have been created in previous steps"
  exit 1
fi

# Check if unified pipeline is running
echo "🔍 Checking if unified pipeline is available on port 8000..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ Unified pipeline is running"
else
  echo "⚠️  Unified pipeline not detected on port 8000"
  echo "   The script will use mock processing mode"
fi

# Run the submission
echo ""
echo "🚀 Submitting simple site to learning pipeline..."
node submit-to-learning-pipeline.js

# Check results
echo ""
echo "📁 Checking generated files..."

if [ -d "learning-results" ]; then
  echo "✅ Learning results directory created"
  ls -la learning-results/
fi

if [ -f "LEARNING-NOTES.md" ]; then
  echo "✅ Learning notes created"
  echo ""
  echo "📄 Learning notes preview:"
  head -20 LEARNING-NOTES.md
fi

if [ -d "simple-site-optimized" ]; then
  echo ""
  echo "✅ Optimized version created"
  ls -la simple-site-optimized/
fi

echo ""
echo "🎯 Integration test complete!"
echo ""
echo "Next steps:"
echo "1. Review LEARNING-NOTES.md for extracted patterns"
echo "2. Check learning-results/ for detailed analysis"
echo "3. Review simple-site-optimized/ for suggested improvements"
echo "4. If pipeline was running, check git branch for committed notes"