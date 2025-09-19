#!/usr/bin/env node

/**
 * Simple config generator for subdomain routing
 */

const fs = require('fs').promises;

async function generateConfigs() {
    console.log('🌐 Generating subdomain configurations...');
    
    // Create public directory if it doesn't exist
    try {
        await fs.mkdir('./public', { recursive: true });
    } catch (e) {}
    
    // Nginx config
    const nginxConfig = `# Nginx configuration for Enhanced Economy Hub subdomains
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://localhost:9800;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name trading.localhost;
    
    location / {
        proxy_pass http://localhost:9800;
        proxy_set_header Host trading.localhost;
        proxy_set_header X-Subdomain trading;
    }
}

server {
    listen 80;
    server_name game.localhost;
    
    location / {
        proxy_pass http://localhost:9800;
        proxy_set_header Host game.localhost;
        proxy_set_header X-Subdomain game;
    }
}`;
    
    await fs.writeFile('./nginx-subdomain-config.conf', nginxConfig);
    
    // Hosts file entries
    const hostsEntries = `# Add to /etc/hosts for local development
127.0.0.1    localhost
127.0.0.1    trading.localhost
127.0.0.1    game.localhost
127.0.0.1    tycoon.localhost
127.0.0.1    api.localhost
127.0.0.1    admin.localhost
127.0.0.1    reasoning.localhost`;
    
    await fs.writeFile('./hosts-entries.txt', hostsEntries);
    
    // Startup script
    const startupScript = `#!/bin/bash
echo "🌐 Starting Enhanced Economy Hub..."

# Add hosts entries if they don't exist
if ! grep -q "trading.localhost" /etc/hosts 2>/dev/null; then
    echo "Adding hosts entries (requires sudo)..."
    echo "127.0.0.1 trading.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 game.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 tycoon.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 api.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 admin.localhost" | sudo tee -a /etc/hosts
    echo "127.0.0.1 reasoning.localhost" | sudo tee -a /etc/hosts
fi

# Start the hub
echo "Starting Enhanced Economy Hub..."
node enhanced-economy-hub.js`;
    
    await fs.writeFile('./start-subdomain-hub.sh', startupScript);
    
    // Make script executable
    try {
        await fs.chmod('./start-subdomain-hub.sh', 0o755);
    } catch (e) {}
    
    console.log('✅ Configuration files generated:');
    console.log('  - nginx-subdomain-config.conf');
    console.log('  - hosts-entries.txt');
    console.log('  - start-subdomain-hub.sh');
    console.log('');
    console.log('🚀 Ready to start middle-out system!');
}

generateConfigs().catch(console.error);