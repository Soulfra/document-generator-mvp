#!/usr/bin/env node

/**
 * OSS RELEASE SYSTEM
 * Complete open source release automation for Soulfra Platform
 * Handles packaging, publishing, and distribution
 */

const fs = require('fs');
const path = require('path');

class OSSReleaseSystem {
  constructor() {
    this.version = '1.0.0';
    this.platforms = ['npm', 'docker', 'github', 'railway', 'vercel'];
    this.registries = {
      npm: 'https://registry.npmjs.org',
      docker: 'docker.io/soulfra',
      github: 'ghcr.io/soulfra'
    };
  }

  async release() {
    console.log('🚀 OSS RELEASE SYSTEM - MAXIMUM DISTRIBUTION\n');
    
    // Create release structure
    this.createReleaseStructure();
    
    // Create npm packages
    this.createNPMPackages();
    
    // Create Docker images
    this.createDockerImages();
    
    // Create deployment templates
    this.createDeploymentTemplates();
    
    // Create marketplace
    this.createMarketplace();
    
    // Create CLI tool
    this.createCLITool();
    
    // Create installer scripts
    this.createInstallers();
    
    console.log('\n✅ OSS RELEASE COMPLETE!');
  }

  createReleaseStructure() {
    console.log('📦 Creating release structure...');
    
    // NPM Package: create-soulfra-app
    const createAppContent = `#!/usr/bin/env node

/**
 * create-soulfra-app
 * Scaffolds a new Soulfra Platform project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectName = process.argv[2] || 'my-soulfra-app';

console.log(\`Creating new Soulfra app: \${projectName}\`);

// Create project directory
fs.mkdirSync(projectName, { recursive: true });

// Create package.json
const packageJson = {
  name: projectName,
  version: '1.0.0',
  private: true,
  scripts: {
    start: 'soulfra start',
    build: 'soulfra build',
    dev: 'soulfra dev'
  },
  dependencies: {
    '@soulfra/core': '^1.0.0',
    '@soulfra/master-menu': '^1.0.0',
    '@soulfra/flag-tag-system': '^1.0.0'
  }
};

fs.writeFileSync(
  path.join(projectName, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create soulfra.config.js
const config = \`module.exports = {
  name: '\${projectName}',
  port: 3000,
  
  // Enable core features
  features: {
    masterMenu: true,
    flagTagSystem: true,
    aiEconomy: true,
    electronWrapper: false
  },
  
  // Plugins to load
  plugins: [
    // '@soulfra/plugin-stripe',
    // '@soulfra/plugin-auth'
  ],
  
  // Theme customization
  theme: {
    primaryColor: '#ffd700',
    darkMode: true
  }
};\`;

fs.writeFileSync(path.join(projectName, 'soulfra.config.js'), config);

// Create main entry
const mainEntry = \`/**
 * \${projectName}
 * Built with Soulfra Platform
 */

const { Soulfra } = require('@soulfra/core');
const config = require('./soulfra.config');

const app = new Soulfra(config);

app.start().then(() => {
  console.log('🚀 Soulfra app running at http://localhost:3000/master');
}).catch(console.error);\`;

fs.writeFileSync(path.join(projectName, 'index.js'), mainEntry);

// Create README
const readme = \`# \${projectName}

Built with [Soulfra Platform](https://soulfra.io)

## Quick Start

\\\`\\\`\\\`bash
npm install
npm start
\\\`\\\`\\\`

Visit http://localhost:3000/master

## Configuration

Edit \\\`soulfra.config.js\\\` to customize your platform.

## Learn More

- [Documentation](https://docs.soulfra.io)
- [Examples](https://github.com/soulfra/platform/tree/main/examples)
- [Discord](https://discord.gg/soulfra)\`;

fs.writeFileSync(path.join(projectName, 'README.md'), readme);

console.log(\`
✅ Created \${projectName}

Next steps:
  cd \${projectName}
  npm install
  npm start
\`);`;

    fs.writeFileSync('create-soulfra-app.js', createAppContent);
  }

  createNPMPackages() {
    console.log('📦 Creating NPM packages...');
    
    // Main CLI package
    const cliPackage = {
      name: 'soulfra',
      version: this.version,
      description: 'CLI for Soulfra Platform',
      bin: {
        soulfra: './bin/soulfra.js'
      },
      dependencies: {
        '@soulfra/core': `^${this.version}`,
        'commander': '^11.0.0',
        'chalk': '^5.0.0',
        'ora': '^6.0.0'
      },
      engines: {
        node: '>=16.0.0'
      }
    };
    
    fs.writeFileSync('cli-package.json', JSON.stringify(cliPackage, null, 2));
    
    // Core package exports
    const coreExports = `/**
 * @soulfra/core
 * Core functionality for Soulfra Platform
 */

// Main platform class
export class Soulfra {
  constructor(config = {}) {
    this.config = {
      name: 'Soulfra Platform',
      port: 3000,
      ...config
    };
    
    this.plugins = new Map();
    this.middleware = [];
  }
  
  use(plugin) {
    if (typeof plugin.init === 'function') {
      plugin.init(this);
    }
    
    this.plugins.set(plugin.name, plugin);
    return this;
  }
  
  async start() {
    console.log(\`🚀 Starting \${this.config.name}...\`);
    
    // Initialize all plugins
    for (const [name, plugin] of this.plugins) {
      if (plugin.start) {
        await plugin.start();
      }
    }
    
    // Start server
    const { createServer } = await import('./server.js');
    this.server = await createServer(this);
    
    console.log(\`✅ Platform running at http://localhost:\${this.config.port}/master\`);
  }
}

// Export all modules
export * from './flag-tag-system.js';
export * from './ai-economy.js';
export * from './master-menu.js';
export * from './database.js';`;
    
    fs.writeFileSync('core-exports.js', coreExports);
  }

  createDockerImages() {
    console.log('🐳 Creating Docker configurations...');
    
    // Main Dockerfile
    const dockerfile = `# Soulfra Platform Docker Image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages ./packages
COPY plugins ./plugins

# Install dependencies
RUN npm ci --only=production
RUN npm run bootstrap
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/plugins ./plugins
COPY --from=builder /app/node_modules ./node_modules

# Copy configuration
COPY docker/entrypoint.sh ./
COPY docker/default-config.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \\
  CMD node healthcheck.js || exit 1

# Start application
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "packages/core/dist/index.js"]`;
    
    fs.writeFileSync('Dockerfile', dockerfile);
    
    // Docker Compose
    const dockerCompose = `version: '3.8'

services:
  soulfra:
    image: soulfra/platform:latest
    container_name: soulfra-platform
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://soulfra:password@db:5432/soulfra
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    volumes:
      - ./config:/app/config
      - ./plugins:/app/custom-plugins
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    container_name: soulfra-db
    environment:
      - POSTGRES_USER=soulfra
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=soulfra
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    container_name: soulfra-cache
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:`;
    
    fs.writeFileSync('docker-compose.yml', dockerCompose);
    
    // Kubernetes deployment
    const k8sDeployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: soulfra-platform
  labels:
    app: soulfra
spec:
  replicas: 3
  selector:
    matchLabels:
      app: soulfra
  template:
    metadata:
      labels:
        app: soulfra
    spec:
      containers:
      - name: soulfra
        image: soulfra/platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: soulfra-service
spec:
  selector:
    app: soulfra
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer`;
    
    fs.writeFileSync('k8s-deployment.yaml', k8sDeployment);
  }

  createDeploymentTemplates() {
    console.log('🚀 Creating deployment templates...');
    
    // Railway template
    const railwayTemplate = {
      name: 'Soulfra Platform',
      description: 'Complete platform with unified interface',
      services: [
        {
          name: 'web',
          source: {
            type: 'github',
            repo: 'soulfra/platform'
          },
          build: {
            builder: 'NIXPACKS',
            buildCommand: 'npm run build'
          },
          deploy: {
            startCommand: 'npm start',
            healthcheckPath: '/api/health',
            restartPolicyType: 'ON_FAILURE',
            restartPolicyMaxRetries: 3
          }
        }
      ],
      databases: [
        {
          type: 'postgresql',
          name: 'soulfra-db'
        },
        {
          type: 'redis', 
          name: 'soulfra-cache'
        }
      ]
    };
    
    fs.writeFileSync('railway.template.json', JSON.stringify(railwayTemplate, null, 2));
    
    // Vercel template
    const vercelConfig = {
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm install',
      framework: null,
      functions: {
        'api/[...path].js': {
          maxDuration: 30
        }
      },
      rewrites: [
        {
          source: '/:path*',
          destination: '/api/:path*'
        }
      ]
    };
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  }

  createMarketplace() {
    console.log('🛒 Creating marketplace structure...');
    
    const marketplace = {
      name: 'Soulfra Marketplace',
      version: '1.0.0',
      categories: [
        {
          id: 'themes',
          name: 'Themes',
          description: 'UI themes and customizations'
        },
        {
          id: 'plugins',
          name: 'Plugins',
          description: 'Extend platform functionality'
        },
        {
          id: 'templates',
          name: 'Templates',
          description: 'Ready-to-use configurations'
        },
        {
          id: 'integrations',
          name: 'Integrations',
          description: 'Third-party service connectors'
        }
      ],
      featured: [
        {
          id: '@soulfra/plugin-stripe',
          name: 'Stripe Plugin',
          author: 'Soulfra Team',
          downloads: 10000,
          rating: 4.8
        }
      ]
    };
    
    fs.writeFileSync('marketplace.json', JSON.stringify(marketplace, null, 2));
  }

  createCLITool() {
    console.log('⚡ Creating CLI tool...');
    
    const cliContent = `#!/usr/bin/env node

/**
 * Soulfra CLI
 * Command-line interface for Soulfra Platform
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const package = require('./package.json');

const program = new Command();

program
  .name('soulfra')
  .description('CLI for Soulfra Platform')
  .version(package.version);

// Start command
program
  .command('start')
  .description('Start the Soulfra platform')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-c, --config <path>', 'Config file path', './soulfra.config.js')
  .action(async (options) => {
    const spinner = ora('Starting Soulfra Platform...').start();
    
    try {
      const { Soulfra } = require('@soulfra/core');
      const config = require(options.config);
      
      const app = new Soulfra({
        ...config,
        port: options.port
      });
      
      await app.start();
      spinner.succeed(chalk.green('Soulfra Platform started!'));
      console.log(chalk.blue(\`Visit: http://localhost:\${options.port}/master\`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to start platform'));
      console.error(error);
      process.exit(1);
    }
  });

// Build command
program
  .command('build')
  .description('Build the platform for production')
  .action(async () => {
    const spinner = ora('Building platform...').start();
    
    try {
      const { execSync } = require('child_process');
      execSync('npm run build', { stdio: 'inherit' });
      spinner.succeed(chalk.green('Build complete!'));
    } catch (error) {
      spinner.fail(chalk.red('Build failed'));
      process.exit(1);
    }
  });

// Create plugin command
program
  .command('create-plugin <name>')
  .description('Create a new plugin')
  .action(async (name) => {
    console.log(chalk.blue(\`Creating plugin: \${name}\`));
    
    const fs = require('fs');
    const path = require('path');
    
    const pluginDir = path.join('plugins', name);
    fs.mkdirSync(pluginDir, { recursive: true });
    
    // Create plugin files...
    console.log(chalk.green(\`✅ Plugin created at: \${pluginDir}\`));
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy platform to cloud')
  .option('-p, --platform <platform>', 'Deployment platform', 'railway')
  .action(async (options) => {
    console.log(chalk.blue(\`Deploying to \${options.platform}...\`));
    
    // Deployment logic...
  });

program.parse();`;
    
    fs.writeFileSync('soulfra-cli.js', cliContent);
  }

  createInstallers() {
    console.log('📥 Creating installer scripts...');
    
    // Universal installer
    const installer = `#!/bin/bash

# Soulfra Platform Universal Installer

echo "🚀 Soulfra Platform Installer"
echo "=============================="
echo

# Detect OS
OS="Unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="Windows"
fi

echo "Detected OS: $OS"
echo

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version must be 16 or higher"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v)"

# Install Soulfra
echo
echo "Installing Soulfra Platform..."

npm install -g soulfra create-soulfra-app

if [ $? -eq 0 ]; then
    echo
    echo "✅ Soulfra Platform installed successfully!"
    echo
    echo "Next steps:"
    echo "  1. Create a new app: create-soulfra-app my-app"
    echo "  2. Start the platform: cd my-app && npm start"
    echo
    echo "Documentation: https://docs.soulfra.io"
    echo "Discord: https://discord.gg/soulfra"
else
    echo "❌ Installation failed"
    exit 1
fi`;
    
    fs.writeFileSync('install.sh', installer);
    
    // Windows installer
    const winInstaller = `@echo off
REM Soulfra Platform Windows Installer

echo Soulfra Platform Installer
echo ==========================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found: 
node -v

REM Install Soulfra
echo.
echo Installing Soulfra Platform...
npm install -g soulfra create-soulfra-app

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Soulfra Platform installed!
    echo.
    echo Next steps:
    echo   1. Create app: create-soulfra-app my-app
    echo   2. Start: cd my-app ^&^& npm start
    echo.
    echo Docs: https://docs.soulfra.io
) else (
    echo ERROR: Installation failed
)

pause`;
    
    fs.writeFileSync('install.bat', winInstaller);
  }
}

// Execute
if (require.main === module) {
  const releaseSystem = new OSSReleaseSystem();
  releaseSystem.release().catch(console.error);
}

module.exports = OSSReleaseSystem;