#\!/bin/bash

echo "▲ Deploying to Vercel..."

# Check if vercel CLI is installed
if \! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with:"
    echo "npm install -g vercel"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Starting Vercel deployment..."
vercel --prod

echo "✅ Deployment complete\!"
echo "💡 Set your environment variables in Vercel dashboard:"
echo "  - AGENT_WALLET_ADDRESS"
echo "  - GOOGLE_CLIENT_ID"
echo "  - STRIPE_SECRET_KEY"
echo "  - ANTHROPIC_API_KEY"
echo "  - OPENAI_API_KEY"
