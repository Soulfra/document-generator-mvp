#!/bin/bash
echo "🚀 Starting Document Generator - Production Mode"
echo "==============================================="

# Build and start containers
echo "📦 Building containers..."
docker-compose build

echo "🚀 Starting production services..."
docker-compose up -d

echo ""
echo "✅ Production environment started"
echo "🔗 Flask API: http://localhost:5000"
echo "📊 Services: All containerized"
echo "🔒 Data isolation: Enabled"
echo "💰 Payment tracking: Active"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Stop with: docker-compose down"
