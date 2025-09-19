#!/bin/bash

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

sudo cp -r soulfra-deployments/soulfra_ai/* /var/www/soulfra_ai/
sudo chown -R www-data:www-data /var/www/soulfra_ai/
sudo cp -r soulfra-deployments/soulfra_io/* /var/www/soulfra_io/
sudo chown -R www-data:www-data /var/www/soulfra_io/
sudo cp -r soulfra-deployments/soulfra_com/* /var/www/soulfra_com/
sudo chown -R www-data:www-data /var/www/soulfra_com/
sudo cp -r soulfra-deployments/soulfra_org/* /var/www/soulfra_org/
sudo chown -R www-data:www-data /var/www/soulfra_org/

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
    echo "  • https://www.soulfra.ai"
    echo "  • https://www.soulfra.io"
    echo "  • https://www.soulfra.com"
    echo "  • https://www.soulfra.org"
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
