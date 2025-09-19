#!/bin/bash
echo "🌐 Starting Enhanced Economy Hub..."

# Add hosts entries if they don't exist
if ! grep -q "trading.localhost" /etc/hosts 2>/dev/null; then
    echo "Adding hosts entries (requires sudo)..."
    echo "127.0.0.1 trading.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 game.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 tycoon.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 api.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 admin.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 reasoning.localhost" | sudo tee -a /etc/hosts
fi

# Start the hub
echo "Starting Enhanced Economy Hub..."
node enhanced-economy-hub.js