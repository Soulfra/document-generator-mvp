#!/bin/bash

echo "🚀 STARTING SIMPLE DOCUMENT TO WEBSITE GENERATOR"
echo "================================================"
echo ""
echo "✨ This is what you ACTUALLY wanted:"
echo "   1. Upload document"
echo "   2. Get working website"
echo "   3. Done in 60 seconds"
echo ""

# Check if archiver is installed
if ! node -e "require('archiver')" 2>/dev/null; then
  echo "📦 Installing required dependencies..."
  npm install --package-lock=false express multer archiver
  echo ""
fi

echo "🌐 Starting server on http://localhost:3000"
echo ""
echo "👉 OPEN YOUR BROWSER TO: http://localhost:3000"
echo ""
echo "📄 Upload any document and get a working website!"
echo "   • Business plans → Professional SaaS landing page"
echo "   • Resumes → Portfolio websites"
echo "   • Blog posts → Content websites"
echo "   • Product ideas → E-commerce stores"
echo ""

node simple-document-to-website.js