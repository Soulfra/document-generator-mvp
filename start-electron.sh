#!/bin/bash

# Quick start Soulfra Platform in Electron

echo "⚡ Starting Soulfra Platform in Electron..."

# Install Electron if not present
if ! command -v npx &> /dev/null; then
    echo "Installing Electron..."
    npm install electron --save-dev
fi

# Copy Electron package.json
cp package.electron.json package.json

# Start in development mode
npm run electron-dev