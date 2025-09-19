#!/bin/bash

# 🛑 Stop Complete SoulFRA Platform

echo "🛑 Stopping SoulFRA Platform..."
echo "==============================="

echo "🔄 Stopping Brand Consultation API (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   No process found on port 3001"

echo "🔄 Stopping MVP Generation API (port 3002)..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "   No process found on port 3002"

echo "🔄 Stopping Web Server (port 8080)..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "   No process found on port 8080"

# Also kill by process name
echo "🔄 Stopping any remaining processes..."
pkill -f "brand-consultation-api.js" 2>/dev/null || true
pkill -f "mvp-generation-api.js" 2>/dev/null || true
pkill -f "python.*http.server" 2>/dev/null || true
pkill -f "python.*SimpleHTTPServer" 2>/dev/null || true

echo ""
echo "✅ SoulFRA Platform Stopped"
echo "=========================="
echo "All services have been terminated:"
echo "🎨 Brand Consultation API"
echo "❄️ MVP Generation API" 
echo "🌐 Web Server"
echo ""
echo "🚀 To restart: ./start-soulfra-platform.sh"