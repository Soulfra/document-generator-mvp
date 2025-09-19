#!/bin/bash

# CHARACTER SYSTEM STARTUP SCRIPT
echo "🎮 Starting Character System Components..."

# Start all services
node genetic-hash-allocator.js &
node character-api-server.js &
node character-qr-auth.js &
node character-command-interface.js &
node claude-query-api.js &
node overlay-system.js &

echo "✅ All services started!"
echo "🌐 Chat Interface: file://$(pwd)/character-chat-interface.html"
echo "🔐 QR Login: http://localhost:42002/qr-login"
echo "🤖 Claude API: http://localhost:42006/api/claude/docs"