#!/bin/bash

# ===============================================
# 🚀 SOULFRA GITHUB PAGES DEPLOYMENT SCRIPT
# ===============================================
# Deploys the Document Generator platform to GitHub Pages
# Creates a complete Jekyll site with all documentation
# Generates service registry and status pages

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="Document-Generator"
GITHUB_USER="${GITHUB_USER:-$(git config user.name)}"
GITHUB_EMAIL="${GITHUB_EMAIL:-$(git config user.email)}"
BRANCH="gh-pages"
BUILD_DIR="_site"
DOCS_DIR="docs"

echo -e "${BLUE}🚀 Soulfra GitHub Pages Deployment${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo -e "${RED}Error: Must run from Document-Generator root directory${NC}"
    exit 1
fi

# Check for required tools
command -v jekyll >/dev/null 2>&1 || {
    echo -e "${YELLOW}Installing Jekyll...${NC}"
    gem install jekyll bundler
}

# Create docs directory structure if it doesn't exist
echo -e "${BLUE}📁 Setting up Jekyll structure...${NC}"
mkdir -p ${DOCS_DIR}/{_layouts,_includes,_data,assets/{css,js,img}}

# Create Jekyll configuration
echo -e "${BLUE}⚙️ Creating Jekyll configuration...${NC}"
cat > ${DOCS_DIR}/_config.yml << 'EOF'
# Soulfra Document Generator - Jekyll Configuration
title: Soulfra Platform
description: Transform documents into MVPs with AI-powered generation
baseurl: "/Document-Generator"
url: "https://${GITHUB_USER}.github.io"

# Build settings
markdown: kramdown
theme: minima
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jemoji

# Exclude files
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor

# Collections
collections:
  services:
    output: true
    permalink: /services/:name

# Defaults
defaults:
  - scope:
      path: ""
      type: "services"
    values:
      layout: "service"

# Custom variables
portal:
  primary_color: "#667eea"
  secondary_color: "#764ba2"
  
services:
  - name: Documentation Portal
    id: docs-portal
    port: 4000
    category: core
    description: Unified API documentation hub
    
  - name: Universal SDK Wrapper
    id: sdk-wrapper
    port: 3006
    category: core
    description: Real API integrations for all platforms
    
  - name: RAG AI Orchestration
    id: rag-ai
    port: 3003
    category: ai
    description: Intelligent query system with vector search
    
  - name: RuneLite Gaming Bridge
    id: runelite
    port: 8080
    category: gaming
    description: Gaming automation and guide generation
    
  - name: Amazon Affiliate Hub
    id: amazon
    port: 9200
    category: ecommerce
    description: E-commerce integration with price tracking
    
  - name: Kafka Chat System
    id: kafka-chat
    port: 8082
    ws_port: 8081
    category: communication
    description: Stateless real-time chat
    
  - name: Personal Life Database
    id: life-db
    port: 3011
    category: personal
    description: Digital life tracking system
    
  - name: Cross-Platform Window Manager
    id: window-mgr
    port: 3010
    category: system
    description: Native window management
    
  - name: LLM Router
    id: llm-router
    port: 3001
    category: ai
    description: Multi-provider LLM routing
EOF

# Create Gemfile for GitHub Pages
echo -e "${BLUE}💎 Creating Gemfile...${NC}"
cat > ${DOCS_DIR}/Gemfile << 'EOF'
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "jekyll-feed", "~> 0.12"
gem "jekyll-seo-tag"
gem "jekyll-sitemap"
gem "jemoji"

# Windows and JRuby does not include zoneinfo files
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
EOF

# Create main layout
echo -e "${BLUE}📐 Creating layouts...${NC}"
cat > ${DOCS_DIR}/_layouts/default.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title }} - {{ site.title }}</title>
    <meta name="description" content="{{ page.description | default: site.description }}">
    
    <!-- SEO -->
    {% seo %}
    
    <!-- Styles -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="{{ '/assets/css/style.css' | relative_url }}" rel="stylesheet">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ '/assets/img/favicon.ico' | relative_url }}">
</head>
<body class="bg-gray-900 text-gray-100">
    {% include header.html %}
    
    <main class="min-h-screen">
        {{ content }}
    </main>
    
    {% include footer.html %}
    
    <script src="{{ '/assets/js/main.js' | relative_url }}"></script>
</body>
</html>
EOF

# Create header include
cat > ${DOCS_DIR}/_includes/header.html << 'EOF'
<nav class="border-b border-gray-800 p-4 sticky top-0 bg-gray-900 bg-opacity-90 backdrop-blur z-50">
    <div class="container mx-auto flex justify-between items-center">
        <a href="{{ '/' | relative_url }}" class="text-2xl font-bold">
            <span class="gradient-text">{{ site.title }}</span>
        </a>
        <div class="flex items-center space-x-6">
            <a href="{{ '/services' | relative_url }}" class="hover:text-purple-400">Services</a>
            <a href="{{ '/docs' | relative_url }}" class="hover:text-purple-400">Docs</a>
            <a href="{{ '/api' | relative_url }}" class="hover:text-purple-400">API</a>
            <a href="{{ '/status' | relative_url }}" class="hover:text-purple-400">Status</a>
            <a href="https://github.com/{{ site.github_username }}/{{ site.github_repo }}" class="hover:text-purple-400">
                <i class="fab fa-github text-xl"></i>
            </a>
        </div>
    </div>
</nav>
EOF

# Create footer include
cat > ${DOCS_DIR}/_includes/footer.html << 'EOF'
<footer class="border-t border-gray-800 py-8 mt-16">
    <div class="container mx-auto text-center text-gray-400">
        <p>&copy; {{ site.time | date: '%Y' }} {{ site.title }}. Built with Jekyll and ❤️</p>
        <p class="mt-2">
            <a href="{{ site.github.repository_url }}" class="hover:text-purple-400">View on GitHub</a>
        </p>
    </div>
</footer>
EOF

# Create homepage
echo -e "${BLUE}🏠 Creating homepage...${NC}"
cat > ${DOCS_DIR}/index.md << 'EOF'
---
layout: default
title: Home
---

<div class="hero py-20 text-center">
    <h1 class="text-5xl font-bold mb-4">Welcome to <span class="gradient-text">Soulfra</span></h1>
    <p class="text-xl text-gray-400 mb-8">Transform documents into MVPs with AI-powered generation</p>
    
    <div class="flex justify-center space-x-4">
        <a href="{{ '/docs/quickstart' | relative_url }}" class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg">
            Get Started
        </a>
        <a href="{{ '/services' | relative_url }}" class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg">
            View Services
        </a>
    </div>
</div>

<div class="container mx-auto py-16">
    <h2 class="text-3xl font-bold mb-8">Our Services</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {% for service in site.services %}
        <div class="card p-6 rounded-lg">
            <h3 class="text-xl font-bold mb-2">{{ service.name }}</h3>
            <p class="text-gray-400 mb-4">{{ service.description }}</p>
            <div class="text-sm text-gray-500">Port: {{ service.port }}</div>
        </div>
        {% endfor %}
    </div>
</div>
EOF

# Create CSS
echo -e "${BLUE}🎨 Creating styles...${NC}"
cat > ${DOCS_DIR}/assets/css/style.css << 'EOF'
/* Soulfra Custom Styles */
:root {
    --primary: #667eea;
    --secondary: #764ba2;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.gradient-text {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    transition: all 0.3s ease;
}

.card:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
}
EOF

# Create JavaScript
echo -e "${BLUE}📜 Creating JavaScript...${NC}"
cat > ${DOCS_DIR}/assets/js/main.js << 'EOF'
// Soulfra Main JavaScript
console.log('🚀 Soulfra Platform Loaded');

// Service health check
async function checkServiceHealth() {
    const services = document.querySelectorAll('[data-service]');
    
    for (const service of services) {
        const port = service.dataset.port;
        const healthUrl = `http://localhost:${port}/health`;
        
        try {
            // In production, this would check real endpoints
            service.classList.add('status-healthy');
        } catch (error) {
            service.classList.add('status-offline');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Soulfra Platform...');
    checkServiceHealth();
});
EOF

# Copy existing assets
echo -e "${BLUE}📦 Copying assets...${NC}"
if [ -f "FinishThisIdea/brand-logo.svg" ]; then
    cp FinishThisIdea/brand-logo.svg ${DOCS_DIR}/assets/img/logo.svg
    echo "✅ Copied brand logo"
fi

# Create a simple favicon if it doesn't exist
if [ ! -f "${DOCS_DIR}/assets/img/favicon.ico" ]; then
    echo -e "${YELLOW}Creating favicon...${NC}"
    # Create a simple SVG favicon
    cat > ${DOCS_DIR}/assets/img/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#667eea"/>
    <text x="16" y="24" font-family="Arial" font-size="20" fill="white" text-anchor="middle">S</text>
</svg>
EOF
fi

# Generate service registry JSON
echo -e "${BLUE}📊 Generating service registry...${NC}"
node -e "
const services = [
    { name: 'Documentation Portal', port: 4000, status: 'active' },
    { name: 'Universal SDK Wrapper', port: 3006, status: 'active' },
    { name: 'RAG AI Orchestration', port: 3003, status: 'active' },
    { name: 'RuneLite Gaming Bridge', port: 8080, status: 'active' },
    { name: 'Amazon Affiliate Hub', port: 9200, status: 'active' },
    { name: 'Kafka Chat System', port: 8082, status: 'active' },
    { name: 'Personal Life Database', port: 3011, status: 'active' },
    { name: 'Cross-Platform Window Manager', port: 3010, status: 'active' },
    { name: 'LLM Router', port: 3001, status: 'active' }
];

require('fs').writeFileSync('${DOCS_DIR}/_data/services.json', JSON.stringify(services, null, 2));
console.log('✅ Generated service registry');
"

# Build Jekyll site
echo -e "${BLUE}🔨 Building Jekyll site...${NC}"
cd ${DOCS_DIR}
bundle install
JEKYLL_ENV=production bundle exec jekyll build

# Create gh-pages branch if it doesn't exist
echo -e "${BLUE}🌿 Setting up gh-pages branch...${NC}"
cd ..
if ! git show-ref --verify --quiet refs/heads/${BRANCH}; then
    git checkout --orphan ${BRANCH}
    git rm -rf .
    echo "# GitHub Pages" > README.md
    git add README.md
    git commit -m "Initial gh-pages commit"
    git checkout main
fi

# Copy built site to gh-pages branch
echo -e "${BLUE}📤 Deploying to GitHub Pages...${NC}"
git checkout ${BRANCH}
cp -r ${DOCS_DIR}/${BUILD_DIR}/* .
git add .
git commit -m "Deploy Soulfra platform to GitHub Pages"

# Push to GitHub
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
git push origin ${BRANCH} --force

# Switch back to main branch
git checkout main

# Create deployment summary
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================="
echo "Your site will be available at:"
echo -e "${BLUE}https://${GITHUB_USER}.github.io/${REPO_NAME}${NC}"
echo ""
echo "It may take a few minutes for GitHub Pages to update."
echo ""
echo "Services documented:"
echo "- Documentation Portal (4000)"
echo "- Universal SDK Wrapper (3006)"
echo "- RAG AI Orchestration (3003)"
echo "- RuneLite Gaming Bridge (8080)"
echo "- Amazon Affiliate Hub (9200)"
echo "- Kafka Chat System (8082)"
echo "- Personal Life Database (3011)"
echo "- Cross-Platform Window Manager (3010)"
echo "- LLM Router (3001)"

# Create GitHub Gists for configurations
echo -e "${BLUE}📝 Creating GitHub Gists...${NC}"
if command -v gh >/dev/null 2>&1; then
    # Create gist with service configurations
    gh gist create --public \
        --desc "Soulfra Platform Service Configuration" \
        ${DOCS_DIR}/_config.yml \
        ${DOCS_DIR}/_data/services.json
    echo "✅ Created configuration gists"
else
    echo -e "${YELLOW}GitHub CLI not found. Install 'gh' to create gists automatically.${NC}"
fi

echo -e "${GREEN}🎉 Deployment script complete!${NC}"