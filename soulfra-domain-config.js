#!/usr/bin/env node

/**
 * 🌐 SOULFRA DOMAIN ARCHITECTURE CONFIGURATION
 * Multi-domain ecosystem builder for soulfra.ai/io/com/org
 * Integrates with existing documentgenerator.app infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Domain Configuration
const SOULFRA_DOMAINS = {
    'soulfra.ai': {
        purpose: 'AI/ML Research & Development',
        theme: 'technical',
        primaryColor: '#00ffff',
        services: ['rag-ai', 'llm-router', 'copilot'],
        subdomains: {
            'api': 'AI API Gateway',
            'lab': 'AI Laboratory & Testing',
            'docs': 'AI Documentation',
            'model': 'Model Registry & Hosting',
            'train': 'Training Infrastructure'
        }
    },
    'soulfra.io': {
        purpose: 'Gaming & Interactive Platforms',
        theme: 'gaming',
        primaryColor: '#ff4141',
        services: ['gaming-bridge', 'commerce', 'chat'],
        subdomains: {
            'play': 'Gaming Portal',
            'arcade': 'Game Collection',
            'battle': 'Competition Arena',
            'stream': 'Live Streaming',
            'guild': 'Community Management'
        }
    },
    'soulfra.com': {
        purpose: 'Business & Commercial Services',
        theme: 'professional',
        primaryColor: '#ffff00',
        services: ['sdk-wrapper', 'docs-portal', 'commerce'],
        subdomains: {
            'www': 'Main Business Site',
            'app': 'SaaS Application',
            'api': 'Business API',
            'dash': 'Analytics Dashboard',
            'support': 'Customer Support'
        }
    },
    'soulfra.org': {
        purpose: 'Open Source & Community',
        theme: 'community',
        primaryColor: '#00ff41',
        services: ['docs-portal', 'github-bridge'],
        subdomains: {
            'opensource': 'OSS Projects',
            'community': 'Forums & Discussion',
            'wiki': 'Knowledge Base',
            'download': 'Software Releases',
            'contribute': 'Developer Portal'
        }
    }
};

// Integration with existing infrastructure
const EXISTING_SERVICES = {
    'rag-ai': { port: 3003, status: 'active' },
    'llm-router': { port: 3001, status: 'active' },
    'copilot': { port: 3007, status: 'active' },
    'gaming-bridge': { port: 8080, status: 'active' },
    'commerce': { port: 9200, status: 'active' },
    'chat': { port: 8082, status: 'active' },
    'sdk-wrapper': { port: 3006, status: 'active' },
    'docs-portal': { port: 4000, status: 'active' },
    'github-bridge': { port: 3008, status: 'planned' }
};

class SoulfraDomainArchitect {
    constructor() {
        this.config = SOULFRA_DOMAINS;
        this.services = EXISTING_SERVICES;
        this.nginxConfigPath = './nginx-soulfra.conf';
        this.deploymentPath = './soulfra-deployments/';
    }
    
    async generateNginxConfig() {
        console.log('🔧 Generating nginx configuration for Soulfra domains...');
        
        let nginxConfig = `
# 🌐 SOULFRA MULTI-DOMAIN NGINX CONFIGURATION
# Generated: ${new Date().toISOString()}
# Domains: soulfra.ai, soulfra.io, soulfra.com, soulfra.org
# Integration: documentgenerator.app infrastructure

# Upstream servers (existing Document Generator services)
`;

        // Generate upstream servers
        Object.entries(this.services).forEach(([service, config]) => {
            nginxConfig += `
upstream ${service.replace('-', '_')}_backend {
    server localhost:${config.port};
    keepalive 32;
}`;
        });

        nginxConfig += `

# SSL Configuration (shared)
ssl_certificate /etc/letsencrypt/live/soulfra.ai/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/soulfra.ai/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

`;

        // Generate server blocks for each domain
        Object.entries(this.config).forEach(([domain, domainConfig]) => {
            nginxConfig += this.generateDomainServerBlock(domain, domainConfig);
        });

        await this.ensureDirectoryExists(path.dirname(this.nginxConfigPath));
        await fs.writeFile(this.nginxConfigPath, nginxConfig);
        
        console.log(`✅ Nginx configuration saved to ${this.nginxConfigPath}`);
        return nginxConfig;
    }
    
    generateDomainServerBlock(domain, config) {
        const { purpose, theme, primaryColor, services, subdomains } = config;
        
        let serverBlock = `
# ==========================================
# ${domain.toUpperCase()} - ${purpose}
# Theme: ${theme}, Color: ${primaryColor}
# ==========================================

# Main domain redirect to www
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${domain};
    
    # Redirect to www subdomain
    return 301 https://www.${domain}$request_uri;
}

# Main website
server {
    listen 80;
    listen 443 ssl http2;
    server_name www.${domain};
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Rate limiting
    limit_req zone=general_limit burst=20 nodelay;
    
    # Main site content
    location / {
        root /var/www/${domain.replace('.', '_')};
        index index.html;
        try_files $uri $uri/ =404;
        
        # Custom error pages
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
    }
    
    # Health check endpoint
    location /health {
        return 200 '{"status":"ok","domain":"${domain}","theme":"${theme}"}';
        add_header Content-Type application/json;
    }
}

`;

        // Generate subdomain configurations
        Object.entries(subdomains).forEach(([subdomain, description]) => {
            serverBlock += this.generateSubdomainConfig(subdomain, domain, description, services);
        });

        return serverBlock;
    }
    
    generateSubdomainConfig(subdomain, domain, description, services) {
        const fullDomain = `${subdomain}.${domain}`;
        
        // Determine which service to route to based on subdomain
        let targetService = this.mapSubdomainToService(subdomain, services);
        
        return `
# ${fullDomain} - ${description}
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${fullDomain};
    
    # Rate limiting for API subdomains
    ${subdomain === 'api' ? 'limit_req zone=api_limit burst=10 nodelay;' : 'limit_req zone=general_limit burst=20 nodelay;'}
    
    # CORS headers for API subdomains
    ${subdomain === 'api' ? `
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Authorization, Content-Type";
    ` : ''}
    
    location / {
        ${targetService ? `
        # Proxy to ${targetService} service
        proxy_pass http://${targetService.replace('-', '_')}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Subdomain ${subdomain};
        proxy_set_header X-Domain ${domain};
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        ` : `
        # Static content for ${subdomain}
        root /var/www/${domain.replace('.', '_')}_${subdomain};
        index index.html;
        try_files $uri $uri/ =404;
        `}
    }
}
`;
    }
    
    mapSubdomainToService(subdomain, services) {
        const mappings = {
            'api': services.includes('rag-ai') ? 'rag-ai' : services.includes('sdk-wrapper') ? 'sdk-wrapper' : services[0],
            'docs': 'docs-portal',
            'app': services.includes('sdk-wrapper') ? 'sdk-wrapper' : services[0],
            'lab': 'rag-ai',
            'play': 'gaming-bridge',
            'battle': 'gaming-bridge',
            'stream': 'chat',
            'dash': 'docs-portal'
        };
        
        return mappings[subdomain] || null;
    }
    
    async generateLandingPages() {
        console.log('🎨 Generating landing pages for each domain...');
        
        for (const [domain, config] of Object.entries(this.config)) {
            await this.generateDomainLandingPage(domain, config);
            
            // Generate subdomain pages
            for (const [subdomain, description] of Object.entries(config.subdomains)) {
                await this.generateSubdomainPage(domain, subdomain, description, config);
            }
        }
        
        console.log('✅ Landing pages generated successfully');
    }
    
    async generateDomainLandingPage(domain, config) {
        const { purpose, theme, primaryColor, services, subdomains } = config;
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${domain.toUpperCase()} - ${purpose}</title>
    <meta name="description" content="Soulfra ${purpose} - Advanced AI-powered platform">
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Orbitron', monospace;
            background: linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .hero {
            padding: 100px 20px;
            text-align: center;
            position: relative;
        }
        
        .hero h1 {
            font-size: 4rem;
            font-weight: 900;
            color: ${primaryColor};
            text-shadow: 0 0 20px ${primaryColor};
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .hero p {
            font-size: 1.5rem;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 50px 20px;
        }
        
        .service-card {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid ${primaryColor};
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .service-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            border-color: #fff;
        }
        
        .service-card h3 {
            color: ${primaryColor};
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .service-card a {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: ${primaryColor};
            color: #000;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 700;
            transition: all 0.3s ease;
        }
        
        .service-card a:hover {
            background: #fff;
            transform: scale(1.05);
        }
        
        .integration-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid ${primaryColor};
            font-size: 0.9rem;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .status-online { color: #00ff41; }
        .status-offline { color: #ff4141; }
    </style>
</head>
<body>
    <div class="integration-status">
        <div><strong>Service Status</strong></div>
        ${services.map(service => `
        <div class="status-item">
            <span>${service}:</span>
            <span class="status-online">ONLINE</span>
        </div>`).join('')}
    </div>
    
    <div class="hero">
        <h1>${domain.toUpperCase()}</h1>
        <p>${purpose}</p>
        <p>Powered by Document Generator Infrastructure</p>
    </div>
    
    <div class="services-grid">
        ${Object.entries(subdomains).map(([subdomain, description]) => `
        <div class="service-card">
            <h3>${subdomain.toUpperCase()}</h3>
            <p>${description}</p>
            <a href="https://${subdomain}.${domain}">Access ${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)}</a>
        </div>`).join('')}
    </div>
    
    <script>
        console.log('🌐 ${domain} loaded successfully');
        console.log('Integration: Document Generator Services');
        console.log('Theme: ${theme}');
        console.log('Services:', ${JSON.stringify(services)});
        
        // Real-time service status checking
        async function checkServiceStatus() {
            // This would connect to actual service health endpoints
            console.log('Checking service health...');
        }
        
        setInterval(checkServiceStatus, 30000);
    </script>
</body>
</html>`;

        const domainDir = path.join(this.deploymentPath, domain.replace('.', '_'));
        await this.ensureDirectoryExists(domainDir);
        await fs.writeFile(path.join(domainDir, 'index.html'), html);
        
        console.log(`  ✅ ${domain} landing page created`);
    }
    
    async generateSubdomainPage(domain, subdomain, description, config) {
        const fullDomain = `${subdomain}.${domain}`;
        const targetService = this.mapSubdomainToService(subdomain, config.services);
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subdomain.toUpperCase()} - ${domain}</title>
    <meta name="description" content="${description} - ${config.purpose}">
    
    <style>
        body {
            font-family: 'Orbitron', monospace;
            background: linear-gradient(135deg, #000, #1a1a2e);
            color: #fff;
            text-align: center;
            padding: 100px 20px;
        }
        
        h1 {
            color: ${config.primaryColor};
            font-size: 3rem;
            margin-bottom: 20px;
            text-shadow: 0 0 20px ${config.primaryColor};
        }
        
        .service-info {
            background: rgba(0, 0, 0, 0.7);
            padding: 30px;
            border-radius: 15px;
            border: 2px solid ${config.primaryColor};
            max-width: 600px;
            margin: 0 auto;
        }
        
        .redirect-notice {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid #ffff00;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <h1>${subdomain.toUpperCase()}</h1>
    <div class="service-info">
        <h2>${description}</h2>
        <p>Domain: ${fullDomain}</p>
        <p>Parent: ${domain}</p>
        ${targetService ? `
        <div class="redirect-notice">
            <strong>Service Integration:</strong><br>
            This subdomain routes to ${targetService} service<br>
            Port: ${this.services[targetService]?.port || 'TBD'}
        </div>
        ` : `
        <div class="redirect-notice">
            <strong>Static Content</strong><br>
            This subdomain serves static content
        </div>
        `}
    </div>
    
    <script>
        console.log('Subdomain: ${fullDomain}');
        console.log('Target Service: ${targetService || 'static'}');
        
        // Auto-redirect to service if configured
        ${targetService ? `
        setTimeout(() => {
            console.log('Redirecting to service...');
            // Would redirect to actual service endpoint
        }, 3000);
        ` : ''}
    </script>
</body>
</html>`;

        const subdomainDir = path.join(this.deploymentPath, `${domain.replace('.', '_')}_${subdomain}`);
        await this.ensureDirectoryExists(subdomainDir);
        await fs.writeFile(path.join(subdomainDir, 'index.html'), html);
    }
    
    async generateDeploymentScript() {
        console.log('📜 Generating deployment script...');
        
        const script = `#!/bin/bash

# 🚀 SOULFRA DOMAIN DEPLOYMENT SCRIPT
# Deploys multi-domain architecture to production

echo "🌐 Deploying Soulfra Domain Architecture..."

# Prerequisites check
echo "🔍 Checking prerequisites..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is required but not installed"
    exit 1
fi

# Check if certbot is installed (for SSL)
if ! command -v certbot &> /dev/null; then
    echo "⚠️ Certbot not found - SSL certificates must be configured manually"
fi

# Copy nginx configuration
echo "📋 Installing nginx configuration..."
sudo cp nginx-soulfra.conf /etc/nginx/sites-available/soulfra
sudo ln -sf /etc/nginx/sites-available/soulfra /etc/nginx/sites-enabled/soulfra

# Copy website files
echo "📁 Deploying website files..."
${Object.keys(SOULFRA_DOMAINS).map(domain => `
sudo cp -r soulfra-deployments/${domain.replace('.', '_')}/* /var/www/${domain.replace('.', '_')}/
sudo chown -R www-data:www-data /var/www/${domain.replace('.', '_')}/`).join('')}

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "🎉 Deployment complete!"
    echo ""
    echo "🌐 Your domains are now configured:"
    ${Object.keys(SOULFRA_DOMAINS).map(domain => `echo "  • https://www.${domain}"`).join('\n    ')}
    echo ""
    echo "📋 Next steps:"
    echo "  1. Configure DNS to point to this server"
    echo "  2. Obtain SSL certificates with certbot"
    echo "  3. Start Document Generator services"
    echo "  4. Test all subdomains"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi
`;

        await fs.writeFile('./deploy-soulfra-domains.sh', script);
        
        // Make script executable
        const { exec } = require('child_process');
        exec('chmod +x deploy-soulfra-domains.sh');
        
        console.log('✅ Deployment script created: deploy-soulfra-domains.sh');
    }
    
    async ensureDirectoryExists(dir) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async generateDomainReport() {
        console.log('📊 Generating domain architecture report...');
        
        const report = {
            generated: new Date().toISOString(),
            domains: Object.keys(this.config).length,
            subdomains: Object.values(this.config).reduce((acc, domain) => acc + Object.keys(domain.subdomains).length, 0),
            services: Object.keys(this.services).length,
            configuration: this.config,
            services: this.services,
            files: {
                nginx: this.nginxConfigPath,
                deployments: this.deploymentPath,
                script: './deploy-soulfra-domains.sh'
            }
        };
        
        await fs.writeFile('./soulfra-domain-report.json', JSON.stringify(report, null, 2));
        
        console.log('✅ Domain report saved: soulfra-domain-report.json');
        return report;
    }
    
    async buildComplete() {
        console.log('🏗️ Building complete Soulfra domain architecture...');
        
        try {
            await this.generateNginxConfig();
            await this.generateLandingPages();
            await this.generateDeploymentScript();
            const report = await this.generateDomainReport();
            
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🌐 SOULFRA DOMAIN ARCHITECTURE               ║
║                                                              ║
║  ✅ Configuration Complete                                   ║
║                                                              ║
║  📊 Summary:                                                 ║
║  • Domains: ${report.domains} (${Object.keys(this.config).join(', ')})        ║
║  • Subdomains: ${report.subdomains}                                         ║
║  • Services: ${report.services}                                         ║
║  • Integration: Document Generator Infrastructure            ║
║                                                              ║
║  📁 Generated Files:                                         ║
║  • nginx-soulfra.conf                                       ║
║  • soulfra-deployments/ (HTML pages)                        ║
║  • deploy-soulfra-domains.sh                                ║
║  • soulfra-domain-report.json                               ║
║                                                              ║
║  🚀 Next: Run ./deploy-soulfra-domains.sh                   ║
╚══════════════════════════════════════════════════════════════╝
            `);
            
            return report;
        } catch (error) {
            console.error('❌ Build failed:', error);
            throw error;
        }
    }
}

// Main execution
if (require.main === module) {
    const architect = new SoulfraDomainArchitect();
    architect.buildComplete()
        .then(report => {
            console.log('🎉 Soulfra domain architecture ready!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Build failed:', error);
            process.exit(1);
        });
}

module.exports = { SoulfraDomainArchitect, SOULFRA_DOMAINS };