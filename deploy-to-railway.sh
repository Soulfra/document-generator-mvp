#!/bin/bash
# Railway Deployment Script

echo "🚀 Deploying Document Generator Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Navigate to backend directory
cd backend

# Initialize Railway project if needed
if [ ! -f "railway.json" ]; then
    echo "📋 Initializing Railway project..."
    railway init document-generator-backend
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your backend will be available at: https://document-generator-backend.up.railway.app"
echo "🔗 Update your frontend to use this URL for API calls"
