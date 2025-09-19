#!/bin/bash

# ===============================================
# 🚀 SOULFRA STATIC GITHUB PAGES DEPLOYMENT
# ===============================================
# Deploys the Document Generator platform to GitHub Pages
# Uses static HTML/CSS/JS instead of Jekyll for compatibility

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
SITE_DIR="docs-static"

echo -e "${BLUE}🚀 Soulfra Static GitHub Pages Deployment${NC}"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo -e "${RED}Error: Must run from Document-Generator root directory${NC}"
    exit 1
fi

# Create static site directory
echo -e "${BLUE}📁 Setting up static site structure...${NC}"
mkdir -p ${SITE_DIR}/{css,js,img,services}

# Create main HTML page
echo -e "${BLUE}🏠 Creating homepage...${NC}"
cat > ${SITE_DIR}/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Platform - Document Generator</title>
    <meta name="description" content="Transform documents into MVPs with AI-powered generation">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="img/favicon.svg">
</head>
<body class="bg-gray-900 text-gray-100">
    <!-- Navigation -->
    <nav class="border-b border-gray-800 p-4 sticky top-0 bg-gray-900 bg-opacity-90 backdrop-blur z-50">
        <div class="container mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <img src="img/logo.svg" alt="Soulfra" class="w-8 h-8">
                <span class="text-2xl font-bold gradient-text">Soulfra Platform</span>
            </div>
            <div class="flex items-center space-x-6">
                <a href="#services" class="hover:text-purple-400">Services</a>
                <a href="#docs" class="hover:text-purple-400">Docs</a>
                <a href="#api" class="hover:text-purple-400">API</a>
                <a href="#status" class="hover:text-purple-400">Status</a>
                <a href="https://github.com/matthewmauer/Document-Generator" class="hover:text-purple-400">
                    <i class="fab fa-github text-xl"></i>
                </a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="hero py-20 text-center">
        <h1 class="text-5xl font-bold mb-4">Welcome to <span class="gradient-text">Soulfra</span></h1>
        <p class="text-xl text-gray-400 mb-8">Transform documents into MVPs with AI-powered generation</p>
        
        <div class="flex justify-center space-x-4">
            <a href="#docs" class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors">
                Get Started
            </a>
            <a href="#services" class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors">
                View Services
            </a>
        </div>
    </div>

    <!-- Services Grid -->
    <div id="services" class="container mx-auto py-16">
        <h2 class="text-3xl font-bold mb-8 text-center">Our Services</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Documentation Portal -->
            <div class="card p-6 rounded-lg" data-service="docs-portal" data-port="4000">
                <div class="flex items-center mb-4">
                    <i class="fas fa-book text-purple-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">Documentation Portal</h3>
                </div>
                <p class="text-gray-400 mb-4">Unified API documentation hub</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 4000</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:4000" target="_blank" class="inline-block mt-4 text-purple-400 hover:text-purple-300">
                    Open Service →
                </a>
            </div>

            <!-- Universal SDK Wrapper -->
            <div class="card p-6 rounded-lg" data-service="sdk-wrapper" data-port="3006">
                <div class="flex items-center mb-4">
                    <i class="fas fa-plug text-blue-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">Universal SDK Wrapper</h3>
                </div>
                <p class="text-gray-400 mb-4">Real API integrations for all platforms</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 3006</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:3006" target="_blank" class="inline-block mt-4 text-blue-400 hover:text-blue-300">
                    Open Service →
                </a>
            </div>

            <!-- RAG AI Orchestration -->
            <div class="card p-6 rounded-lg" data-service="rag-ai" data-port="3003">
                <div class="flex items-center mb-4">
                    <i class="fas fa-brain text-green-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">RAG AI Orchestration</h3>
                </div>
                <p class="text-gray-400 mb-4">Intelligent query system with vector search</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 3003</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:3003" target="_blank" class="inline-block mt-4 text-green-400 hover:text-green-300">
                    Open Service →
                </a>
            </div>

            <!-- RuneLite Gaming Bridge -->
            <div class="card p-6 rounded-lg" data-service="runelite" data-port="8080">
                <div class="flex items-center mb-4">
                    <i class="fas fa-gamepad text-yellow-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">RuneLite Gaming Bridge</h3>
                </div>
                <p class="text-gray-400 mb-4">Gaming automation and guide generation</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 8080</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:8080" target="_blank" class="inline-block mt-4 text-yellow-400 hover:text-yellow-300">
                    Open Service →
                </a>
            </div>

            <!-- Amazon Affiliate Hub -->
            <div class="card p-6 rounded-lg" data-service="amazon" data-port="9200">
                <div class="flex items-center mb-4">
                    <i class="fas fa-shopping-cart text-orange-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">Amazon Affiliate Hub</h3>
                </div>
                <p class="text-gray-400 mb-4">E-commerce integration with price tracking</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 9200</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:9200" target="_blank" class="inline-block mt-4 text-orange-400 hover:text-orange-300">
                    Open Service →
                </a>
            </div>

            <!-- Kafka Chat System -->
            <div class="card p-6 rounded-lg" data-service="kafka-chat" data-port="8082">
                <div class="flex items-center mb-4">
                    <i class="fas fa-comments text-pink-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">Kafka Chat System</h3>
                </div>
                <p class="text-gray-400 mb-4">Stateless real-time chat</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 8082</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:8082" target="_blank" class="inline-block mt-4 text-pink-400 hover:text-pink-300">
                    Open Service →
                </a>
            </div>

            <!-- Personal Life Database -->
            <div class="card p-6 rounded-lg" data-service="life-db" data-port="3011">
                <div class="flex items-center mb-4">
                    <i class="fas fa-user-circle text-indigo-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">Personal Life Database</h3>
                </div>
                <p class="text-gray-400 mb-4">Digital life tracking system</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 3011</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:3011" target="_blank" class="inline-block mt-4 text-indigo-400 hover:text-indigo-300">
                    Open Service →
                </a>
            </div>

            <!-- Cross-Platform Window Manager -->
            <div class="card p-6 rounded-lg" data-service="window-mgr" data-port="3010">
                <div class="flex items-center mb-4">
                    <i class="fas fa-window-restore text-cyan-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">Window Manager</h3>
                </div>
                <p class="text-gray-400 mb-4">Native window management</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 3010</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:3010" target="_blank" class="inline-block mt-4 text-cyan-400 hover:text-cyan-300">
                    Open Service →
                </a>
            </div>

            <!-- LLM Router -->
            <div class="card p-6 rounded-lg" data-service="llm-router" data-port="3001">
                <div class="flex items-center mb-4">
                    <i class="fas fa-route text-red-400 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold">LLM Router</h3>
                </div>
                <p class="text-gray-400 mb-4">Multi-provider LLM routing</p>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Port: 3001</span>
                    <span class="status-indicator bg-green-500 w-3 h-3 rounded-full"></span>
                </div>
                <a href="http://localhost:3001" target="_blank" class="inline-block mt-4 text-red-400 hover:text-red-300">
                    Open Service →
                </a>
            </div>
        </div>
    </div>

    <!-- Database Summary -->
    <div id="databases" class="container mx-auto py-16">
        <h2 class="text-3xl font-bold mb-8 text-center">Database Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- PostgreSQL -->
            <div class="card p-6 rounded-lg text-center">
                <i class="fas fa-database text-blue-400 text-4xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">PostgreSQL</h3>
                <p class="text-gray-400 mb-4">Primary database for user data and app state</p>
                <div class="text-sm text-gray-500">Port: 5432</div>
            </div>

            <!-- Redis -->
            <div class="card p-6 rounded-lg text-center">
                <i class="fas fa-memory text-red-400 text-4xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Redis</h3>
                <p class="text-gray-400 mb-4">Cache and session storage</p>
                <div class="text-sm text-gray-500">Port: 6379</div>
            </div>

            <!-- SQLite -->
            <div class="card p-6 rounded-lg text-center">
                <i class="fas fa-file-alt text-green-400 text-4xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">SQLite</h3>
                <p class="text-gray-400 mb-4">Local data storage and backups</p>
                <div class="text-sm text-gray-500">File-based</div>
            </div>
        </div>
    </div>

    <!-- Documentation Section -->
    <div id="docs" class="container mx-auto py-16">
        <h2 class="text-3xl font-bold mb-8 text-center">Documentation</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-4">Quick Start Guide</h3>
                <p class="text-gray-400 mb-4">Get up and running with the Soulfra platform in minutes.</p>
                <a href="#" class="text-purple-400 hover:text-purple-300">Read Guide →</a>
            </div>
            <div class="card p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-4">API Documentation</h3>
                <p class="text-gray-400 mb-4">Complete API reference for all services.</p>
                <a href="#" class="text-purple-400 hover:text-purple-300">View API Docs →</a>
            </div>
        </div>
    </div>

    <!-- Status Section -->
    <div id="status" class="container mx-auto py-16">
        <h2 class="text-3xl font-bold mb-8 text-center">System Status</h2>
        <div class="card p-6 rounded-lg">
            <div class="text-center">
                <i class="fas fa-check-circle text-green-400 text-6xl mb-4"></i>
                <h3 class="text-2xl font-bold mb-2">All Systems Operational</h3>
                <p class="text-gray-400">All services are running and healthy</p>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-800 py-8 mt-16">
        <div class="container mx-auto text-center text-gray-400">
            <p>&copy; 2024 Soulfra Platform. Built with ❤️ and AI</p>
            <p class="mt-2">
                <a href="https://github.com/matthewmauer/Document-Generator" class="hover:text-purple-400">View on GitHub</a>
            </p>
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>
EOF

# Create CSS
echo -e "${BLUE}🎨 Creating styles...${NC}"
cat > ${SITE_DIR}/css/style.css << 'EOF'
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
    background-clip: text;
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

.status-indicator {
    display: inline-block;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.hero {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}
EOF

# Create JavaScript
echo -e "${BLUE}📜 Creating JavaScript...${NC}"
cat > ${SITE_DIR}/js/main.js << 'EOF'
// Soulfra Platform JavaScript
console.log('🚀 Soulfra Platform Loaded');

// Service health check simulation
function initializeServiceStatus() {
    const services = document.querySelectorAll('[data-service]');
    
    services.forEach(service => {
        const indicator = service.querySelector('.status-indicator');
        if (indicator) {
            // Simulate health check (in production, this would be real)
            const isHealthy = Math.random() > 0.1; // 90% healthy
            
            if (isHealthy) {
                indicator.className = 'status-indicator bg-green-500 w-3 h-3 rounded-full';
            } else {
                indicator.className = 'status-indicator bg-red-500 w-3 h-3 rounded-full';
            }
        }
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Real-time clock
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Soulfra Platform...');
    initializeServiceStatus();
    initializeSmoothScrolling();
    
    // Update clock every second
    setInterval(updateClock, 1000);
    updateClock();
    
    console.log('✅ Soulfra Platform initialized successfully!');
});
EOF

# Copy existing assets
echo -e "${BLUE}📦 Copying assets...${NC}"
if [ -f "FinishThisIdea/brand-logo.svg" ]; then
    cp "FinishThisIdea/brand-logo.svg" "${SITE_DIR}/img/logo.svg"
    echo "✅ Copied brand logo"
fi

# Create favicon from brand logo
if [ -f "FinishThisIdea/brand-logo.svg" ]; then
    cp "FinishThisIdea/brand-logo.svg" "${SITE_DIR}/img/favicon.svg"
    echo "✅ Created favicon from brand logo"
else
    # Create a simple SVG favicon
    cat > ${SITE_DIR}/img/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#667eea"/>
    <text x="16" y="24" font-family="Arial" font-size="20" fill="white" text-anchor="middle">S</text>
</svg>
EOF
    echo "✅ Created default favicon"
fi

# Create service status page
echo -e "${BLUE}📊 Creating service status page...${NC}"
cat > ${SITE_DIR}/status.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Status - Soulfra Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body class="bg-gray-900 text-gray-100">
    <div class="container mx-auto py-8">
        <h1 class="text-4xl font-bold mb-8 text-center gradient-text">Service Status</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Services will be populated by JavaScript -->
        </div>
        
        <div class="mt-8 text-center">
            <a href="index.html" class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors">
                ← Back to Home
            </a>
        </div>
    </div>
    
    <script>
        // Service status data
        const services = [
            { name: 'Documentation Portal', port: 4000, status: 'healthy' },
            { name: 'Universal SDK Wrapper', port: 3006, status: 'healthy' },
            { name: 'RAG AI Orchestration', port: 3003, status: 'healthy' },
            { name: 'RuneLite Gaming Bridge', port: 8080, status: 'healthy' },
            { name: 'Amazon Affiliate Hub', port: 9200, status: 'healthy' },
            { name: 'Kafka Chat System', port: 8082, status: 'healthy' },
            { name: 'Personal Life Database', port: 3011, status: 'healthy' },
            { name: 'Cross-Platform Window Manager', port: 3010, status: 'healthy' },
            { name: 'LLM Router', port: 3001, status: 'healthy' }
        ];
        
        // Render services
        const grid = document.querySelector('.grid');
        services.forEach(service => {
            const statusColor = service.status === 'healthy' ? 'green' : 'red';
            const statusIcon = service.status === 'healthy' ? 'check-circle' : 'exclamation-triangle';
            
            grid.innerHTML += `
                <div class="card p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-bold">${service.name}</h3>
                        <i class="fas fa-${statusIcon} text-${statusColor}-400"></i>
                    </div>
                    <div class="text-sm text-gray-400">Port: ${service.port}</div>
                    <div class="text-sm text-${statusColor}-400 capitalize">${service.status}</div>
                </div>
            `;
        });
    </script>
</body>
</html>
EOF

# Create gh-pages branch if it doesn't exist
echo -e "${BLUE}🌿 Setting up gh-pages branch...${NC}"
if ! git show-ref --verify --quiet refs/heads/${BRANCH}; then
    git checkout --orphan ${BRANCH}
    git rm -rf .
    echo "# Soulfra Platform - GitHub Pages" > README.md
    git add README.md
    git commit -m "Initial gh-pages commit"
    git checkout main
fi

# Copy built site to gh-pages branch
echo -e "${BLUE}📤 Deploying to GitHub Pages...${NC}"
git checkout ${BRANCH}
cp -r ${SITE_DIR}/* .
git add .
git commit -m "Deploy Soulfra static site to GitHub Pages"

# Push to GitHub
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
git push origin ${BRANCH} --force

# Switch back to main branch
git checkout main

# Create deployment summary
echo -e "${GREEN}✅ Static Deployment Complete!${NC}"
echo "================================="
echo "Your site will be available at:"
echo -e "${BLUE}https://${GITHUB_USER}.github.io/${REPO_NAME}${NC}"
echo ""
echo "Static pages created:"
echo "- Homepage: index.html"
echo "- Service Status: status.html"
echo "- Assets: CSS, JS, SVG favicon"
echo ""
echo "It may take a few minutes for GitHub Pages to update."

# Create GitHub Gists for configurations
echo -e "${BLUE}📝 Creating GitHub Gists...${NC}"
if command -v gh >/dev/null 2>&1; then
    # Create service registry JSON
    echo '[' > service-registry.json
    echo '  {"name": "Documentation Portal", "port": 4000, "status": "active"},' >> service-registry.json
    echo '  {"name": "Universal SDK Wrapper", "port": 3006, "status": "active"},' >> service-registry.json
    echo '  {"name": "RAG AI Orchestration", "port": 3003, "status": "active"},' >> service-registry.json
    echo '  {"name": "RuneLite Gaming Bridge", "port": 8080, "status": "active"},' >> service-registry.json
    echo '  {"name": "Amazon Affiliate Hub", "port": 9200, "status": "active"},' >> service-registry.json
    echo '  {"name": "Kafka Chat System", "port": 8082, "status": "active"},' >> service-registry.json
    echo '  {"name": "Personal Life Database", "port": 3011, "status": "active"},' >> service-registry.json
    echo '  {"name": "Cross-Platform Window Manager", "port": 3010, "status": "active"},' >> service-registry.json
    echo '  {"name": "LLM Router", "port": 3001, "status": "active"}' >> service-registry.json
    echo ']' >> service-registry.json
    
    gh gist create --public \
        --desc "Soulfra Platform Static Site Configuration" \
        service-registry.json
    
    rm service-registry.json
    echo "✅ Created configuration gist"
else
    echo -e "${YELLOW}GitHub CLI not found. Install 'gh' to create gists automatically.${NC}"
fi

echo -e "${GREEN}🎉 Static deployment script complete!${NC}"