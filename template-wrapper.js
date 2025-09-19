#!/usr/bin/env node

/**
 * TEMPLATE WRAPPER - ONE-COMMAND DEPLOYMENT
 * Wraps npm start and all dependencies into deployable template
 * Clone → Run → Deploy in under 30 seconds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TemplateWrapper {
  constructor() {
    this.templateName = 'soulfra-platform-template';
    this.dependencies = [];
    this.setupCommands = [];
    this.deploymentTargets = [];
    
    this.initializeTemplate();
  }

  initializeTemplate() {
    console.log('📦 WRAPPING INTO DEPLOYABLE TEMPLATE...');
    console.log('');
    
    // Scan for all dependencies
    this.scanDependencies();
    
    // Create setup commands
    this.createSetupCommands();
    
    // Create deployment configurations
    this.createDeploymentConfigs();
    
    // Generate template files
    this.generateTemplateFiles();
    
    console.log('✅ Template wrapper complete!');
  }

  scanDependencies() {
    console.log('🔍 Scanning dependencies...');
    
    // Core system files
    this.coreFiles = [
      'server.js',
      'flag-tag-system.js', 
      'database-integration.js',
      'real-data-hooks-layer.js',
      'flag-tag-dashboard.html',
      'vanity-rooms-layer.html',
      'distributed-deployment-layer.js',
      'startup-complete.js',
      'package.json'
    ];
    
    // Check which files exist
    this.coreFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ❌ ${file} - Missing!`);
      }
    });
    
    // npm dependencies from package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      this.dependencies = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };
      console.log(`  📦 ${Object.keys(this.dependencies.dependencies).length} production deps`);
      console.log(`  🛠️ ${Object.keys(this.dependencies.devDependencies).length} dev deps`);
    } catch (error) {
      console.warn('  ⚠️ Could not read package.json');
    }
  }

  createSetupCommands() {
    console.log('⚙️ Creating setup commands...');
    
    this.setupCommands = [
      {
        name: 'install_dependencies',
        command: 'npm install',
        description: 'Install all Node.js dependencies',
        required: true
      },
      {
        name: 'test_systems',
        command: 'npm run test-systems',
        description: 'Test all integrated systems',
        required: false
      },
      {
        name: 'start_platform',
        command: 'npm start',
        description: 'Start the complete platform',
        required: true
      }
    ];
    
    console.log(`  ✅ ${this.setupCommands.length} setup commands created`);
  }

  createDeploymentConfigs() {
    console.log('🚀 Creating deployment configurations...');
    
    this.deploymentTargets = [
      {
        name: 'railway',
        type: 'cloud',
        config: {
          buildCommand: 'npm install',
          startCommand: 'npm start',
          port: '3000',
          environment: 'production'
        }
      },
      {
        name: 'vercel',
        type: 'serverless',
        config: {
          buildCommand: 'npm install',
          outputDirectory: './',
          installCommand: 'npm install',
          framework: 'nodejs'
        }
      },
      {
        name: 'docker',
        type: 'container',
        config: {
          baseImage: 'node:18-alpine',
          workdir: '/app',
          port: '3000',
          cmd: 'npm start'
        }
      },
      {
        name: 'localhost',
        type: 'local',
        config: {
          requirements: ['Node.js 16+', 'npm 8+'],
          commands: ['npm install', 'npm start']
        }
      }
    ];
    
    console.log(`  ✅ ${this.deploymentTargets.length} deployment targets configured`);
  }

  generateTemplateFiles() {
    console.log('📝 Generating template files...');
    
    // Generate README template
    this.generateREADME();
    
    // Generate Docker template
    this.generateDockerfile();
    
    // Generate Railway template
    this.generateRailwayConfig();
    
    // Generate Vercel template
    this.generateVercelConfig();
    
    // Generate one-command installer
    this.generateInstaller();
    
    // Generate environment template
    this.generateEnvTemplate();
    
    console.log('  ✅ All template files generated');
  }

  generateREADME() {
    const readme = `# 🚀 Soulfra Platform Template

## One-Command Deployment
Clone this template and deploy a complete AI-powered platform in under 30 seconds.

### 🎯 What You Get
- **Flag & Tag System** - Master coordination for all components
- **Database Integration** - Persistent storage with auto-backup
- **Real Data Hooks** - Connect to GitHub, Stripe, APIs
- **AI Network** - Multi-AI communication layer
- **Visual Dashboards** - Real-time monitoring interfaces
- **Distributed Ready** - IPFS, Arweave, blockchain deployment
- **Free Tier Collapse** - No payment barriers, full access

### ⚡ Quick Start

\`\`\`bash
# 1. Clone template
git clone <your-repo-url>
cd soulfra-platform-template

# 2. Install & start (one command)
npm run setup-and-start

# 3. Access platform
open http://localhost:3000
\`\`\`

### 🎮 Access Points
- **🏴 Flag & Tag Dashboard**: http://localhost:3000/flags
- **👑 Vanity Rooms**: http://localhost:3000/vanity  
- **🤖 AI Economy**: http://localhost:3000/economy
- **⚡ Revive System**: http://localhost:3000/revive
- **🆓 Free Access**: http://localhost:3000/free

### 🚀 Deploy Anywhere

#### Railway (Recommended)
\`\`\`bash
npm run deploy:railway
\`\`\`

#### Vercel
\`\`\`bash
npm run deploy:vercel
\`\`\`

#### Docker
\`\`\`bash
docker build -t soulfra-platform .
docker run -p 3000:3000 soulfra-platform
\`\`\`

### 📊 System Commands
\`\`\`bash
npm start           # Start platform
npm run test-systems # Test all systems
npm run flag-system  # Test flag-tag system
npm run start-all    # Full system startup
\`\`\`

### 🔧 Configuration
1. Copy \`.env.template\` to \`.env\`
2. Add your API keys (optional)
3. Run \`npm start\`

### 🏆 Features
✅ **Zero-friction setup** - Works out of the box  
✅ **Real-time monitoring** - Live system health  
✅ **Persistent state** - Database auto-save  
✅ **API integrations** - GitHub, Stripe, etc.  
✅ **AI network** - Multi-AI communication  
✅ **Visual dashboards** - Beautiful interfaces  
✅ **One-click deploy** - Multiple platforms  

### 📚 Documentation
- **Flag & Tag System**: See component coordination
- **Database Layer**: Persistent storage details  
- **API Endpoints**: Complete API reference
- **Deployment Guide**: Deploy anywhere guide

---
*Template generated by Soulfra Platform - From idea to MVP in 30 seconds*`;

    fs.writeFileSync('README-TEMPLATE.md', readme);
    console.log('    📄 README-TEMPLATE.md');
  }

  generateDockerfile() {
    const dockerfile = `# Soulfra Platform - Docker Template
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/flags/system-map || exit 1

# Start application
CMD ["npm", "start"]`;

    fs.writeFileSync('Dockerfile.template', dockerfile);
    console.log('    🐳 Dockerfile.template');
  }

  generateRailwayConfig() {
    const railwayConfig = {
      build: {
        builder: 'NIXPACKS',
        buildCommand: 'npm install',
        watchPatterns: ['**/*.js', '**/*.html', '**/*.json']
      },
      deploy: {
        startCommand: 'npm start',
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 3
      },
      environments: {
        production: {
          variables: {
            NODE_ENV: 'production',
            PORT: '${{RAILWAY_TCP_PROXY_PORT}}'
          }
        }
      }
    };

    fs.writeFileSync('railway.template.json', JSON.stringify(railwayConfig, null, 2));
    console.log('    🚂 railway.template.json');
  }

  generateVercelConfig() {
    const vercelConfig = {
      version: 2,
      name: 'soulfra-platform',
      builds: [
        {
          src: 'server.js',
          use: '@vercel/node'
        }
      ],
      routes: [
        {
          src: '/(.*)',
          dest: '/server.js'
        }
      ],
      env: {
        NODE_ENV: 'production'
      },
      functions: {
        'server.js': {
          maxDuration: 30
        }
      }
    };

    fs.writeFileSync('vercel.template.json', JSON.stringify(vercelConfig, null, 2));
    console.log('    ▲ vercel.template.json');
  }

  generateInstaller() {
    const installer = `#!/bin/bash

# 🚀 SOULFRA PLATFORM - ONE-COMMAND INSTALLER
echo "🚀 Installing Soulfra Platform..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Copy environment template
if [ ! -f .env ]; then
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "📄 Environment template copied to .env"
    fi
fi

# Test systems
echo "🧪 Testing systems..."
npm run test-systems

if [ $? -ne 0 ]; then
    echo "⚠️ System tests failed, but continuing..."
fi

# Start platform
echo "🚀 Starting Soulfra Platform..."
echo ""
echo "🎯 Platform will be available at:"
echo "   http://localhost:3000"
echo ""
echo "🎮 Key endpoints:"
echo "   🏴 Flag & Tag Dashboard: http://localhost:3000/flags"
echo "   👑 Vanity Rooms: http://localhost:3000/vanity"
echo "   🤖 AI Economy: http://localhost:3000/economy"
echo "   🆓 Free Access: http://localhost:3000/free"
echo ""

npm start`;

    fs.writeFileSync('install-and-start.sh', installer);
    
    // Make executable
    try {
      fs.chmodSync('install-and-start.sh', '755');
    } catch (error) {
      console.warn('    ⚠️ Could not make installer executable');
    }
    
    console.log('    🛠️ install-and-start.sh');
  }

  generateEnvTemplate() {
    const envTemplate = `# SOULFRA PLATFORM - ENVIRONMENT CONFIGURATION
# Copy this file to .env and configure as needed

# Server Configuration
PORT=3000
NODE_ENV=development

# Agent Wallet (for affiliate tracking)
AGENT_WALLET_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# API Keys (Optional - will use demo data if not provided)
GITHUB_TOKEN=your_github_token_here
TWITTER_BEARER_TOKEN=your_twitter_token_here
STRIPE_SECRET_KEY=your_stripe_key_here
DISCORD_BOT_TOKEN=your_discord_token_here
LINKEDIN_ACCESS_TOKEN=your_linkedin_token_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GA_MEASUREMENT_ID=your_analytics_id_here
COINBASE_API_KEY=your_coinbase_key_here
VERCEL_TOKEN=your_vercel_token_here
RAILWAY_TOKEN=your_railway_token_here

# Database Configuration
DATABASE_URL=file:./soulfra.db

# Security
SESSION_SECRET=your_session_secret_here

# Feature Flags
ENABLE_DISTRIBUTED_DEPLOYMENT=false
ENABLE_AI_NETWORK=true
ENABLE_REAL_DATA_HOOKS=true
ENABLE_VANITY_ROOMS=true

# Deployment URLs (auto-generated)
RAILWAY_STATIC_URL=https://soulfra-platform.railway.app
VERCEL_URL=https://soulfra-platform.vercel.app`;

    fs.writeFileSync('.env.template', envTemplate);
    console.log('    🔧 .env.template');
  }

  generateTemplatePackageJson() {
    const templatePackage = {
      name: 'soulfra-platform-template',
      version: '1.0.0',
      description: 'Soulfra Platform - Complete AI-powered platform template',
      main: 'server.js',
      scripts: {
        'setup-and-start': './install-and-start.sh',
        'start': 'node server.js',
        'test-systems': 'node startup-complete.js',
        'start-all': 'node startup-complete.js --start-server',
        'flag-system': 'node flag-tag-system.js',
        'database-setup': 'node database-integration.js',
        'distributed-deploy': 'node distributed-deployment-layer.js',
        'deploy:railway': 'railway up',
        'deploy:vercel': 'vercel --prod',
        'deploy:docker': 'docker build -t soulfra-platform . && docker run -p 3000:3000 soulfra-platform',
        'dev': 'nodemon server.js',
        'test': 'npm run test-systems'
      },
      keywords: [
        'ai-platform',
        'flag-tag-system', 
        'document-generator',
        'distributed',
        'template',
        'mvp',
        'soulfra'
      ],
      author: 'Soulfra Platform',
      license: 'MIT',
      dependencies: this.dependencies.dependencies,
      devDependencies: {
        ...this.dependencies.devDependencies,
        'nodemon': '^3.0.1'
      },
      engines: {
        node: '>=16.0.0',
        npm: '>=8.0.0'
      },
      repository: {
        type: 'git',
        url: 'https://github.com/your-username/soulfra-platform-template.git'
      },
      homepage: 'https://soulfra-platform.railway.app',
      bugs: {
        url: 'https://github.com/your-username/soulfra-platform-template/issues'
      }
    };

    fs.writeFileSync('package.template.json', JSON.stringify(templatePackage, null, 2));
    console.log('    📦 package.template.json');
  }

  createDeploymentGuide() {
    const guide = `# 🚀 DEPLOYMENT GUIDE

## One-Click Deployments

### 🚂 Railway (Recommended)
1. Fork this repository
2. Connect to Railway: https://railway.app
3. Import your fork
4. Deploy automatically

### ▲ Vercel
1. Fork this repository  
2. Connect to Vercel: https://vercel.com
3. Import your fork
4. Deploy automatically

### 🐳 Docker
\`\`\`bash
docker build -t soulfra-platform .
docker run -p 3000:3000 soulfra-platform
\`\`\`

### 🌍 Distributed (Advanced)
\`\`\`bash
npm run distributed-deploy
\`\`\`
Deploys to IPFS, Arweave, and 8 blockchains.

## Environment Variables

### Required
- \`PORT\` - Server port (default: 3000)
- \`NODE_ENV\` - Environment (development/production)

### Optional (API Keys)
- \`GITHUB_TOKEN\` - For real GitHub stats
- \`STRIPE_SECRET_KEY\` - For payment processing
- \`VERCEL_TOKEN\` - For deployment stats

## Health Checks

### Local
\`\`\`bash
curl http://localhost:3000/api/flags/system-map
\`\`\`

### Production
\`\`\`bash
curl https://your-domain.com/api/flags/system-map
\`\`\`

## Monitoring

- **System Health**: \`/api/flags/system-map\`
- **AI Network**: \`/api/ai/network\`
- **Real Stats**: \`/api/stats/live\`

## Scaling

### Horizontal
Deploy multiple instances with load balancer

### Vertical  
Increase CPU/RAM for single instance

### Distributed
Use \`npm run distributed-deploy\` for global distribution`;

    fs.writeFileSync('DEPLOYMENT-GUIDE.md', guide);
    console.log('    📋 DEPLOYMENT-GUIDE.md');
  }
}

// Execute template wrapper
if (require.main === module) {
  const wrapper = new TemplateWrapper();
  wrapper.generateTemplatePackageJson();
  wrapper.createDeploymentGuide();
  
  console.log('');
  console.log('🎯 TEMPLATE WRAPPER COMPLETE!');
  console.log('');
  console.log('📦 Generated Files:');
  console.log('  📄 README-TEMPLATE.md');
  console.log('  🐳 Dockerfile.template');
  console.log('  🚂 railway.template.json');
  console.log('  ▲ vercel.template.json');
  console.log('  🛠️ install-and-start.sh');
  console.log('  🔧 .env.template');
  console.log('  📦 package.template.json');
  console.log('  📋 DEPLOYMENT-GUIDE.md');
  console.log('');
  console.log('🚀 TEMPLATE READY FOR DEPLOYMENT!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Copy template files to new repository');
  console.log('2. Test: ./install-and-start.sh');
  console.log('3. Deploy to Railway/Vercel/Docker');
  console.log('4. Share template with others!');
}

module.exports = TemplateWrapper;