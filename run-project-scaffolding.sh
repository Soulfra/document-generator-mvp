#!/bin/bash

# 🏗️ PROJECT SCAFFOLDING EXECUTION SCRIPT
# 
# This script runs the comprehensive project scaffolding to organize
# all documents in the Document-Generator project into the unified vault.

set -e

echo "🏗️ DOCUMENT GENERATOR PROJECT SCAFFOLDING"
echo "========================================"
echo ""

# Change to project directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
echo "📁 Project root: $PROJECT_ROOT"

# Set up environment
export DOCUMENT_ENCRYPTION_KEY="${DOCUMENT_ENCRYPTION_KEY:-scaffold-default-key-2025}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install axios 2>/dev/null || true
fi

# Create unified vault directory
VAULT_PATH="$PROJECT_ROOT/unified-vault"
echo "🗂️ Vault path: $VAULT_PATH"

# Run the scaffolding process
echo ""
echo "🚀 Starting comprehensive project scaffolding..."
echo "This will process all documents and organize them into buckets."
echo ""

# Run with parameters: project_root vault_path batch_size
node scaffold-entire-project.js "$PROJECT_ROOT" "$VAULT_PATH" 25

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SCAFFOLDING COMPLETE!"
    echo ""
    echo "📁 Your organized documents are now in: $VAULT_PATH"
    echo "📊 Check the summary report: $VAULT_PATH/SCAFFOLDING-SUMMARY.md"
    echo "📋 Detailed report: $VAULT_PATH/.metadata/scaffolding-report.json"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Review the bucket organization"
    echo "   2. Check encrypted documents"
    echo "   3. Verify tag assignments"
    echo "   4. Run: ls -la $VAULT_PATH/ to see structure"
    echo ""
else
    echo ""
    echo "❌ SCAFFOLDING FAILED!"
    echo "Check the error messages above for details."
    exit 1
fi