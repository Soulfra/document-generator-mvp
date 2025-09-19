#!/bin/bash

# Stop Polygon World System

echo "🛑 Stopping Polygon World System..."

# Kill processes on known ports
lsof -ti:1337 | xargs kill -9 2>/dev/null && echo "✅ Stopped Query API (port 1337)" || echo "⚠️ Query API not running"
lsof -ti:9999 | xargs kill -9 2>/dev/null && echo "✅ Stopped Companion System (port 9999)" || echo "⚠️ Companion System not running"
lsof -ti:9003 | xargs kill -9 2>/dev/null && echo "✅ Stopped Pixel World (port 9003)" || echo "⚠️ Pixel World not running"

echo ""
echo "✅ Polygon World System stopped"