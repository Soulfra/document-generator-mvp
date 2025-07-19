#!/bin/bash
# Document Generator Launcher
# Transform any document into a working MVP in < 30 minutes

echo "🚀 DOCUMENT GENERATOR LAUNCHER"
echo "📋 Transform any document into a working app!"
echo ""

# Check if executable exists
if [ ! -f "./dist/document-generator" ]; then
    echo "❌ Executable not found. Building..."
    ./collapse-all-to-exe.sh
fi

# Make sure it's executable
chmod +x ./dist/document-generator

# Launch the Document Generator
echo "🚀 Starting Document Generator..."
echo ""
echo "📝 Drop your documents here:"
echo "   • README files"
echo "   • Business plans" 
echo "   • Technical specs"
echo "   • Chat logs"
echo ""
echo "🎯 Access points will be available at:"
echo "   • Auto-Generator: http://localhost:6000"
echo "   • API Gateway: http://localhost:4000/api/v1"
echo "   • AI Diamond Finder: http://localhost:2112"
echo ""

# Run the executable
./dist/document-generator