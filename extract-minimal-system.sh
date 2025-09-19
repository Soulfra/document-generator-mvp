#!/bin/bash

# EXTRACT MINIMAL SYSTEM
# Creates a clean minimal version with only what's needed

echo "🎯 EXTRACTING MINIMAL CLEAN SYSTEM"
echo "================================="

# Create clean directory
CLEAN_DIR="../Document-Generator-Clean"
echo "📁 Creating clean system at: $CLEAN_DIR"

# Remove if exists
rm -rf "$CLEAN_DIR" 2>/dev/null
mkdir -p "$CLEAN_DIR"

# Copy only critical files (no node_modules)
echo "📋 Copying critical files..."

# Core files
cp cli.js "$CLEAN_DIR/" 2>/dev/null
cp connect-and-test-all.js "$CLEAN_DIR/" 2>/dev/null
cp character-system-max.js "$CLEAN_DIR/" 2>/dev/null
cp final-executor.js "$CLEAN_DIR/" 2>/dev/null

# System files
cp -f *orchestrator*.js "$CLEAN_DIR/" 2>/dev/null
cp -f *executor*.js "$CLEAN_DIR/" 2>/dev/null
cp -f *wrapper*.js "$CLEAN_DIR/" 2>/dev/null

# HTML files
cp -f *.html "$CLEAN_DIR/" 2>/dev/null

# Config files
cp -f package*.json "$CLEAN_DIR/" 2>/dev/null
cp -f CLAUDE*.md "$CLEAN_DIR/" 2>/dev/null
cp -f *.sh "$CLEAN_DIR/" 2>/dev/null

# OSS Integration
cp -rf oss-integration-layer "$CLEAN_DIR/" 2>/dev/null

# Create minimal package.json
cat > "$CLEAN_DIR/package.json" << 'EOF'
{
  "name": "document-generator-clean",
  "version": "1.0.0",
  "description": "Document Generator - Clean Minimal System",
  "main": "cli.js",
  "scripts": {
    "start": "node cli.js",
    "test": "node connect-and-test-all.js --test",
    "character": "node character-system-max.js",
    "execute": "node final-executor.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.13.0",
    "socket.io": "^4.6.2",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
EOF

# Count what we extracted
echo -e "\n📊 EXTRACTION COMPLETE:"
echo "   JS files: $(find "$CLEAN_DIR" -name "*.js" -type f | wc -l)"
echo "   HTML files: $(find "$CLEAN_DIR" -name "*.html" -type f | wc -l)"
echo "   Total size: $(du -sh "$CLEAN_DIR" | cut -f1)"

echo -e "\n✅ CLEAN SYSTEM READY!"
echo "====================="
echo "📁 Location: $CLEAN_DIR"
echo ""
echo "To use the clean system:"
echo "  cd $CLEAN_DIR"
echo "  npm install"
echo "  node connect-and-test-all.js"
echo ""
echo "Original system preserved at current location"