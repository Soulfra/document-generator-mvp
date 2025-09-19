#!/bin/bash
echo "🔒 Deploying private data components..."

# Switch to private branch
git checkout private-data

# Copy private components only
cp -r private-components/* .
cp -r flask-backend .
cp docker-compose.yml docker-compose.private.yml

# Commit private components
git add .
git commit -m "Private: user data protection and payment tracking"

echo "✅ Private components secured"
echo "🔒 Push to private remote only"
