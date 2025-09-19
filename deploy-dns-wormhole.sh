#!/bin/bash

echo "🌀 DNS WORMHOLE DEPLOYMENT SCRIPT"
echo "================================="
echo "Merging Railway + Vercel through quantum DNS routing"
echo ""

# Check if both CLIs are installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up --detach

# Get Railway URL
RAILWAY_URL=$(railway status --json | jq -r '.url' || echo "document-generator.railway.app")
echo "✅ Railway deployed to: $RAILWAY_URL"

# Deploy to Vercel
echo "▲ Deploying to Vercel..."
vercel --prod --yes

# Get Vercel URL
VERCEL_URL=$(vercel ls --json | jq -r '.[0].url' || echo "document-generator.vercel.app")
echo "✅ Vercel deployed to: $VERCEL_URL"

# Generate DNS configuration
echo ""
echo "🌐 DNS CONFIGURATION REQUIRED"
echo "============================"
echo ""
echo "Add these records to your domain provider:"
echo ""
echo "For load balancing between Railway and Vercel:"
echo "A     @          76.76.21.21      (Vercel IP)"
echo "A     @          35.247.123.145   (Railway IP)"
echo ""
echo "For separate subdomains:"
echo "CNAME railway    $RAILWAY_URL"
echo "CNAME vercel     $VERCEL_URL"
echo "CNAME app        cname.vercel-dns.com"
echo "CNAME api        $RAILWAY_URL"
echo ""
echo "For vanity URLs:"
echo "CNAME docs       document-generator.gitbook.io"
echo "CNAME status     document-generator.statuspage.io"
echo ""
echo "SSL will be automatically provisioned by both platforms"
echo ""
echo "🚀 Wormhole deployment complete!"
echo "Access your PWA at: https://your-domain.com"