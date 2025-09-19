#!/bin/bash
# Auto-deploy script
echo "🚀 Deploying MAaaS to production..."

# Deploy to Vercel (if vercel CLI available)
if command -v vercel &> /dev/null; then
    vercel --prod
    echo "✅ Deployed to Vercel"
else
    echo "⚠️  Vercel CLI not found - deploy manually"
    echo "📁 Files ready in ./public/"
fi

# Set up domain
echo "🌐 Configure domain: maas.soulfra.com"
echo "📊 Add analytics: Google Analytics or Plausible"
        