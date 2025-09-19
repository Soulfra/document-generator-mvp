#!/bin/bash

# Deploy Universal Site to All Domains
# This script deploys the universal site to Vercel, Railway, and Cloudflare

set -e

echo "🚀 UNIVERSAL SITE DEPLOYMENT"
echo "Deploying to all domains: soulfra.com, deathtodata.com, dealordelete.com, etc."
echo ""

# Configuration
SITE_DIR="universal-site"
BUILD_DIR="dist"
TEMP_DIR="temp-deploy"

# Check if site directory exists
if [ ! -d "$SITE_DIR" ]; then
    echo "❌ Error: $SITE_DIR directory not found"
    exit 1
fi

# Function to deploy to Vercel
deploy_to_vercel() {
    echo "📦 Deploying to Vercel..."
    
    # Create vercel.json configuration
    cat > "$SITE_DIR/vercel.json" << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://document-generator-mvp.vercel.app/api/$1"
    }
  ]
}
EOF

    # Deploy to Vercel
    cd "$SITE_DIR"
    
    if command -v vercel >/dev/null 2>&1; then
        echo "✅ Vercel CLI found, deploying..."
        vercel --prod --yes
        
        # Deploy to custom domains if configured
        DOMAINS=("soulfra.com" "deathtodata.com" "dealordelete.com" "saveorsink.com")
        
        for domain in "${DOMAINS[@]}"; do
            echo "🌐 Setting up domain: $domain"
            vercel domains add "$domain" --yes || echo "⚠️ Domain $domain already exists or failed to add"
        done
        
    else
        echo "⚠️ Vercel CLI not found. Install with: npm i -g vercel"
    fi
    
    cd ..
}

# Function to deploy to Railway
deploy_to_railway() {
    echo "🚂 Preparing Railway deployment..."
    
    # Create railway.json
    cat > "$SITE_DIR/railway.json" << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "STATIC"
  },
  "deploy": {
    "startCommand": "echo 'Static site deployed'",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF

    # Create simple static file server for Railway
    cat > "$SITE_DIR/server.js" << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// SPA routing - send all requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Universal site running on port ${PORT}`);
});
EOF

    # Create package.json for Railway
    cat > "$SITE_DIR/package.json" << 'EOF'
{
  "name": "universal-gaming-platform",
  "version": "1.0.0",
  "description": "Universal gaming platform for all domains",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

    cd "$SITE_DIR"
    
    if command -v railway >/dev/null 2>&1; then
        echo "✅ Railway CLI found, deploying..."
        railway login --browserless || echo "⚠️ Railway login required"
        railway up --service universal-platform || railway up
        
        # Set custom domains
        DOMAINS=("cringeproof.com" "finishthisidea.com" "finishthisrepo.com" "ipomyagent.com" "hollowtown.com" "hookclinic.com")
        
        for domain in "${DOMAINS[@]}"; do
            echo "🌐 Setting up Railway domain: $domain"
            railway domain "$domain" || echo "⚠️ Domain $domain setup failed or already exists"
        done
        
    else
        echo "⚠️ Railway CLI not found. Install with: npm i -g @railway/cli"
    fi
    
    cd ..
}

# Function to create Cloudflare Workers
deploy_to_cloudflare() {
    echo "☁️ Preparing Cloudflare Workers deployment..."
    
    # Create wrangler.toml
    cat > "$SITE_DIR/wrangler.toml" << 'EOF'
name = "universal-platform"
main = "worker.js"
compatibility_date = "2023-12-01"

[site]
bucket = "."

[[routes]]
pattern = "soulfra.com/*"
zone_name = "soulfra.com"

[[routes]]
pattern = "deathtodata.com/*"
zone_name = "deathtodata.com"

[[routes]]
pattern = "dealordelete.com/*"
zone_name = "dealordelete.com"

[[routes]]
pattern = "saveorsink.com/*"
zone_name = "saveorsink.com"

[[routes]]
pattern = "cringeproof.com/*"
zone_name = "cringeproof.com"

[[routes]]
pattern = "finishthisidea.com/*"
zone_name = "finishthisidea.com"

[[routes]]
pattern = "finishthisrepo.com/*"
zone_name = "finishthisrepo.com"

[[routes]]
pattern = "ipomyagent.com/*"
zone_name = "ipomyagent.com"

[[routes]]
pattern = "hollowtown.com/*"
zone_name = "hollowtown.com"

[[routes]]
pattern = "hookclinic.com/*"
zone_name = "hookclinic.com"
EOF

    # Create Cloudflare Worker
    cat > "$SITE_DIR/worker.js" << 'EOF'
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const hostname = url.hostname;
        
        // Log request for debugging
        console.log(`Request to ${hostname}${url.pathname}`);
        
        // Handle API requests - proxy to backend
        if (url.pathname.startsWith('/api/')) {
            return handleAPIRequest(request, hostname);
        }
        
        // Serve static site
        try {
            // Try to get the requested file
            const assetResponse = await env.ASSETS.fetch(request);
            
            // If file exists, return it
            if (assetResponse.status === 200) {
                return assetResponse;
            }
            
            // If file doesn't exist, return index.html (SPA routing)
            const indexRequest = new Request(
                new URL('/index.html', request.url).toString(),
                request
            );
            
            return await env.ASSETS.fetch(indexRequest);
            
        } catch (error) {
            console.error('Error serving asset:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
};

async function handleAPIRequest(request, hostname) {
    // Map domains to backend services
    const backendMap = {
        'soulfra.com': 'cal-riven-service.soulfra-cal:80',
        'deathtodata.com': 'deathtodata-adventure-service:8080',
        'dealordelete.com': 'decision-market-service:7777',
        'saveorsink.com': 'rescue-prediction-service:8888',
        'cringeproof.com': 'cringe-detection-service:9999',
        'finishthisidea.com': 'idea-completion-service:4444',
        'finishthisrepo.com': 'repo-completion-service:5555',
        'ipomyagent.com': 'agent-ipo-service:6666',
        'hollowtown.com': 'hollowtown-service:2222',
        'hookclinic.com': 'hook-clinic-service:3333'
    };
    
    const backend = backendMap[hostname] || 'document-generator-mvp.vercel.app';
    const backendUrl = backend.startsWith('http') ? backend : `https://${backend}`;
    
    try {
        // Proxy the request to the appropriate backend
        const backendRequest = new Request(
            backendUrl + new URL(request.url).pathname + new URL(request.url).search,
            {
                method: request.method,
                headers: request.headers,
                body: request.body
            }
        );
        
        const response = await fetch(backendRequest);
        
        // Add CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: { ...Object.fromEntries(response.headers), ...corsHeaders }
        });
        
    } catch (error) {
        console.error('Backend proxy error:', error);
        return new Response(JSON.stringify({ 
            error: 'Backend service unavailable',
            service: backend,
            hostname 
        }), { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
EOF

    cd "$SITE_DIR"
    
    if command -v wrangler >/dev/null 2>&1; then
        echo "✅ Wrangler CLI found, deploying..."
        wrangler publish
    else
        echo "⚠️ Wrangler CLI not found. Install with: npm i -g wrangler"
    fi
    
    cd ..
}

# Function to test deployments
test_deployments() {
    echo "🧪 Testing deployments..."
    
    DOMAINS=("soulfra.com" "deathtodata.com" "dealordelete.com" "saveorsink.com")
    
    for domain in "${DOMAINS[@]}"; do
        echo "Testing https://$domain..."
        if curl -s -o /dev/null -w "%{http_code}" "https://$domain" | grep -q "200"; then
            echo "✅ $domain is responding"
        else
            echo "❌ $domain is not responding"
        fi
    done
}

# Main deployment process
main() {
    echo "🎯 Starting universal deployment process..."
    
    # Check dependencies
    echo "📋 Checking dependencies..."
    if ! command -v node >/dev/null 2>&1; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi
    
    echo "✅ Dependencies checked"
    
    # Deploy to each platform
    if [ "$1" = "vercel" ] || [ "$1" = "all" ] || [ -z "$1" ]; then
        deploy_to_vercel
        echo ""
    fi
    
    if [ "$1" = "railway" ] || [ "$1" = "all" ] || [ -z "$1" ]; then
        deploy_to_railway
        echo ""
    fi
    
    if [ "$1" = "cloudflare" ] || [ "$1" = "all" ] || [ -z "$1" ]; then
        deploy_to_cloudflare
        echo ""
    fi
    
    # Test deployments
    if [ "$2" = "test" ] || [ "$1" = "test" ]; then
        echo ""
        test_deployments
    fi
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "Your universal site should be available at:"
    echo "• https://soulfra.com (Business Command Center)"
    echo "• https://deathtodata.com (Coding Adventures)"
    echo "• https://dealordelete.com (Decision Markets)"
    echo "• https://saveorsink.com (Survival Command)"
    echo "• https://cringeproof.com (Cringe Detection)"
    echo "• https://finishthisidea.com (Idea Factory)"
    echo "• https://finishthisrepo.com (Repo Completion)"
    echo "• https://ipomyagent.com (Agent IPO)"
    echo "• https://hollowtown.com (Virtual Town)"
    echo "• https://hookclinic.com (Hook Optimization)"
    echo ""
    echo "🔧 To test locally:"
    echo "cd $SITE_DIR && python3 -m http.server 8080"
    echo "Then visit: http://localhost:8080?domain=soulfra.com"
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [platform] [test]"
    echo ""
    echo "Platforms:"
    echo "  all         Deploy to all platforms (default)"
    echo "  vercel      Deploy to Vercel only"
    echo "  railway     Deploy to Railway only"
    echo "  cloudflare  Deploy to Cloudflare Workers only"
    echo "  test        Test existing deployments"
    echo ""
    echo "Examples:"
    echo "  $0              # Deploy to all platforms"
    echo "  $0 vercel       # Deploy to Vercel only"
    echo "  $0 all test     # Deploy to all platforms and test"
    echo "  $0 test         # Test existing deployments"
    exit 0
fi

# Run main function
main "$@"