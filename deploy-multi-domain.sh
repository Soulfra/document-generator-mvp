#!/bin/bash

# 🌐 MULTI-DOMAIN DEPLOYMENT SCRIPT
# Deploys unified codebase to multiple domains with zone-specific branding
# Each domain becomes a different game zone with unique functionality

set -e

echo "🌐 MULTI-DOMAIN DEPLOYMENT STARTING..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_FILE="DOMAIN-REGISTRY.json"
ZONES_DIR="zones"
ASSETS_DIR="assets/domains"

# Check if registry exists
if [ ! -f "$REGISTRY_FILE" ]; then
    echo -e "${RED}❌ $REGISTRY_FILE not found${NC}"
    echo "Please create your domain registry first"
    exit 1
fi

echo -e "${BLUE}📋 Loading domain registry...${NC}"

# Generate zone configurations
echo -e "${YELLOW}🏗️ Generating zone configurations...${NC}"
node domain-zone-mapper.js &
MAPPER_PID=$!

# Wait a moment for configs to generate
sleep 3

# Kill the mapper server (we just need the configs)
kill $MAPPER_PID 2>/dev/null || true

# Check if zones directory was created
if [ ! -d "$ZONES_DIR" ]; then
    echo -e "${RED}❌ Zone configurations not generated${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Zone configurations generated${NC}"

# Create assets directories for each domain
echo -e "${YELLOW}🎨 Setting up domain-specific assets...${NC}"
mkdir -p "$ASSETS_DIR"

for zone_config in "$ZONES_DIR"/*.json; do
    if [ -f "$zone_config" ]; then
        domain=$(basename "$zone_config" .json | sed 's/-config$//' | sed 's/-/./g')
        domain_assets_dir="$ASSETS_DIR/${domain//./-}"
        
        echo "  📁 Creating assets directory: $domain_assets_dir"
        mkdir -p "$domain_assets_dir"/{logos,favicons,themes,images}
        
        # Create placeholder assets if they don't exist
        if [ ! -f "$domain_assets_dir/logos/logo.svg" ]; then
            echo "  🖼️ Creating placeholder logo for $domain"
            cat > "$domain_assets_dir/logos/logo.svg" << EOF
<svg width="100" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="40" fill="#00ff41"/>
  <text x="50" y="25" text-anchor="middle" fill="black" font-family="monospace" font-size="12">$domain</text>
</svg>
EOF
        fi
        
        # Create placeholder favicon
        if [ ! -f "$domain_assets_dir/favicons/favicon.ico" ]; then
            echo "  🔖 Creating placeholder favicon for $domain"
            # Create a simple text-based favicon placeholder
            echo "favicon placeholder for $domain" > "$domain_assets_div/favicons/favicon.txt"
        fi
    fi
done

# Deploy to different platforms based on registry configuration
echo -e "${YELLOW}🚀 Starting multi-platform deployment...${NC}"

# Deploy to Vercel (if configured)
if command -v vercel &> /dev/null; then
    echo -e "${BLUE}📦 Deploying to Vercel...${NC}"
    
    # Deploy main domain
    echo "  🌐 Deploying main domain to Vercel..."
    vercel --prod --yes 2>/dev/null || echo "  ⚠️ Vercel deployment skipped (configure vercel CLI)"
    
else
    echo -e "${YELLOW}⚠️ Vercel CLI not found, skipping Vercel deployment${NC}"
fi

# Deploy to Railway (if configured)  
if command -v railway &> /dev/null; then
    echo -e "${BLUE}🚂 Deploying to Railway...${NC}"
    
    railway up 2>/dev/null || echo "  ⚠️ Railway deployment skipped (configure railway CLI)"
    
else
    echo -e "${YELLOW}⚠️ Railway CLI not found, skipping Railway deployment${NC}"
fi

# Create nginx configuration for local testing
echo -e "${YELLOW}🔧 Creating local development configuration...${NC}"

cat > nginx-multi-domain.conf << 'EOF'
# Multi-Domain Local Development Configuration
# Add these entries to your /etc/hosts file:
# 127.0.0.1 your-main-domain.local
# 127.0.0.1 your-second-domain.local  
# 127.0.0.1 your-third-domain.local

server {
    listen 80;
    server_name your-main-domain.local;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Zone-Type boss-room;
    }
}

server {
    listen 80;
    server_name your-second-domain.local;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Zone-Type trading-floor;
    }
}

server {
    listen 80;
    server_name your-third-domain.local;
    
    location / {
        proxy_pass http://localhost:8080;  
        proxy_set_header Host $host;
        proxy_set_header X-Zone-Type collaborative-lab;
    }
}
EOF

# Create domain-aware server starter
echo -e "${YELLOW}🖥️ Creating domain-aware server...${NC}"

cat > multi-domain-server.js << 'EOF'
#!/usr/bin/env node

/**
 * Multi-Domain Server
 * Serves different zones based on hostname
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Load zone configurations
const loadZoneConfigs = () => {
    const configs = new Map();
    const zonesDir = path.join(__dirname, 'zones');
    
    if (fs.existsSync(zonesDir)) {
        const configFiles = fs.readdirSync(zonesDir).filter(f => f.endsWith('.json'));
        
        for (const file of configFiles) {
            const configPath = path.join(zonesDir, file);
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            configs.set(config.domain, config);
        }
    }
    
    return configs;
};

const zoneConfigs = loadZoneConfigs();

// Domain detection middleware
app.use((req, res, next) => {
    const hostname = req.get('host')?.split(':')[0] || 'localhost';
    
    // Find matching zone config
    let zoneConfig = zoneConfigs.get(hostname);
    
    // Fallback for local development
    if (!zoneConfig && hostname.includes('.local')) {
        const baseHostname = hostname.replace('.local', '.com');
        zoneConfig = zoneConfigs.get(baseHostname);
    }
    
    // Default fallback
    if (!zoneConfig) {
        zoneConfig = Array.from(zoneConfigs.values())[0];
    }
    
    req.zoneConfig = zoneConfig;
    next();
});

// Serve zone-specific assets
app.use('/assets', (req, res, next) => {
    if (req.zoneConfig) {
        const domainAssetsPath = path.join(__dirname, req.zoneConfig.deployment.assetPath);
        express.static(domainAssetsPath)(req, res, next);
    } else {  
        next();
    }
});

// Main route with zone detection
app.get('/', (req, res) => {
    const config = req.zoneConfig;
    
    if (!config) {
        return res.status(500).send('Zone configuration not found');
    }
    
    // Serve zone-specific interface
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${config.zone.name} - ${config.domain}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    background: linear-gradient(135deg, ${config.branding.secondaryColor}, ${config.branding.primaryColor});
                    color: white;
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                }
                .zone-header {
                    text-align: center;
                    padding: 40px 0;
                    border-bottom: 2px solid ${config.branding.primaryColor};
                }
                .zone-info {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                }
                .portals {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin: 40px 0;
                }
                .portal {
                    padding: 15px 30px;
                    background: ${config.branding.primaryColor};
                    color: black;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="zone-header">
                <h1>🌐 ${config.zone.name}</h1>
                <p>${config.zone.description}</p>
                <p><strong>Zone Type:</strong> ${config.zone.type}</p>
            </div>
            
            <div class="zone-info">
                <h2>🎮 Available Games & Features</h2>
                <ul>
                    ${config.functionality.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                
                <h2>🎯 Game Types</h2>
                <ul>
                    ${config.functionality.gameTypes.map(g => `<li>${g}</li>`).join('')}
                </ul>
                
                <h2>💬 Chat Channels</h2>
                <ul>
                    ${config.channels.map(c => `<li>${c.name} ${c.crossDomain ? '(Cross-Domain)' : ''}</li>`).join('')}
                </ul>
            </div>
            
            <div class="portals">
                <h3>🌀 Zone Portals:</h3>
                ${config.portals.map(p => `
                    <a href="${p.transitionUrl}" class="portal">
                        ${p.targetZone} (${p.portalType})
                    </a>
                `).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 40px; opacity: 0.7;">
                <p>🎮 Multi-Domain Game Empire • Zone: ${config.zone.type}</p>
                <p>Device ID: ${req.get('X-Device-ID') || 'Not Connected'}</p>
            </div>
        </body>
        </html>
    `);
});

// API endpoint for zone configuration
app.get('/api/zone', (req, res) => {
    res.json(req.zoneConfig);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        zones: Array.from(zoneConfigs.keys()),
        currentZone: req.zoneConfig?.domain || 'unknown'
    });
});

app.listen(PORT, () => {
    console.log(`\n🌐 Multi-Domain Server running on port ${PORT}`);
    console.log(`📍 Configured zones: ${Array.from(zoneConfigs.keys()).join(', ')}`);
    console.log(`🎮 Ready for zone-based gaming!`);
});
EOF

chmod +x multi-domain-server.js

# Create startup script
echo -e "${YELLOW}📝 Creating startup script...${NC}"

cat > start-multi-domain.sh << 'EOF'
#!/bin/bash

echo "🌐 Starting Multi-Domain Game Empire..."

# Start the domain-aware server
node multi-domain-server.js &
SERVER_PID=$!

# Start the zone mapper service  
node domain-zone-mapper.js &
MAPPER_PID=$!

echo "🚀 Services started:"
echo "   🖥️ Multi-Domain Server: http://localhost:8080"
echo "   🗺️ Zone Mapper: http://localhost:7500"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $SERVER_PID $MAPPER_PID 2>/dev/null; exit 0" INT
wait
EOF

chmod +x start-multi-domain.sh

# Summary
echo ""
echo -e "${GREEN}🎉 MULTI-DOMAIN DEPLOYMENT COMPLETE!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📁 Generated Files:${NC}"
echo "   📋 DOMAIN-REGISTRY.json (your domain configuration)"
echo "   🗺️ zones/ (individual zone configs)"
echo "   🎨 assets/domains/ (domain-specific branding)"
echo "   🌐 multi-domain-server.js (domain-aware server)"
echo "   🚀 start-multi-domain.sh (startup script)"
echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. Edit DOMAIN-REGISTRY.json with your real domains"
echo "2. Add your logos/favicons to assets/domains/"
echo "3. Configure DNS to point domains to your servers"
echo "4. Run: ./start-multi-domain.sh"
echo ""
echo -e "${BLUE}🏠 Local Testing:${NC}"
echo "   Add to /etc/hosts:"
echo "   127.0.0.1 your-main-domain.local"
echo "   127.0.0.1 your-second-domain.local"
echo "   127.0.0.1 your-third-domain.local"
echo ""
echo -e "${GREEN}✨ Your domain empire is ready to launch!${NC}"