#!/bin/bash

# 🎮 START SKILL SYSTEM - Quick launcher for RuneScape-inspired skill dashboard

echo "🎮 Starting RuneScape-Inspired Skill System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install skill engine dependencies
if [ ! -d "packages/skill-engine/node_modules" ]; then
    echo "📦 Installing skill engine dependencies..."
    cd packages/skill-engine && npm install && cd ../..
fi

# Apply database schema if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "🗄️ Checking database schema..."
    psql -U postgres -h localhost -p 5432 -f EMPIRE-SKILLS-SCHEMA.sql 2>/dev/null || echo "⚠️  Database not available, using local storage"
fi

# Start the skill server
echo "
🌐 Launching skill dashboard server..."
echo "🗺️ Navigate to: http://localhost:3333"
echo "
🎮 Press Ctrl+C to stop the server"
echo "================================================"

npm run skill:server