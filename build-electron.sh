#!/bin/bash

# Build Soulfra Platform for all platforms

echo "🔨 Building Soulfra Platform for all platforms..."

# Install dependencies
npm install

# Install Electron dependencies
npm install electron electron-builder electron-packager --save-dev

# Copy package.json for Electron
cp package.electron.json package.json

# Create app icons (placeholder)
mkdir -p electron/assets
echo "📱 Add your app icons to electron/assets/"
echo "  • icon.icns (Mac)"
echo "  • icon.ico (Windows)" 
echo "  • icon.png (Linux)"

# Build for all platforms
echo "🚀 Building for all platforms..."
npm run build-all

echo "✅ Build complete! Check electron/dist/ for binaries"
echo ""
echo "📦 Available builds:"
ls -la electron/dist/