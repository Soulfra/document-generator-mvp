#!/usr/bin/env node

/**
 * Vibecode Franchise Generator
 * Enables anyone to launch their own vibecoded gaming platform
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class VibecodeFranchiseGenerator {
  constructor() {
    this.franchiseDir = path.join(__dirname, 'franchises');
    this.cookbooksDir = path.join(__dirname, 'service-cookbooks');
    this.templateDir = path.join(__dirname, 'franchise-templates');
    
    // Available franchise packages
    this.packages = {
      starter: {
        name: 'Starter Package',
        price: 99,
        features: ['Basic Auth', 'Simple Forums', 'Custom Domain'],
        services: ['auth-service', 'logging-system'],
        vibecodePrefix: 'STARTER'
      },
      gaming: {
        name: 'Gaming Platform',
        price: 499,
        features: ['Full Gaming Platform', 'All Integrations', 'Wallet Routing', '100+ Agents'],
        services: ['auth-service', 'wallet-routing', 'gaming-connectors', 'workflow-engine', 'logging-system'],
        vibecodePrefix: 'GAMING'
      },
      enterprise: {
        name: 'Enterprise Suite',
        price: 1999,
        features: ['Everything', 'White Label', 'Custom Integrations', 'Premium Support'],
        services: ['auth-service', 'wallet-routing', 'gaming-connectors', 'workflow-engine', 'logging-system'],
        vibecodePrefix: 'ENTERPRISE'
      }
    };
    
    // Vibecode registry
    this.vibecodeRegistry = new Map();
    this.loadVibecodesRegistry();
  }

  async generateFranchise(options = {}) {
    console.log('🎯 Generating Vibecode Franchise...\n');
    
    const config = await this.collectFranchiseConfig(options);
    const vibecode = await this.generateVibecode(config);
    
    console.log(`✨ Your vibecode: ${vibecode}\n`);
    
    // Create franchise directory
    const franchiseId = `${config.packageType}-${vibecode.toLowerCase()}`;
    const franchisePath = path.join(this.franchiseDir, franchiseId);
    await this.ensureDirectory(franchisePath);
    
    // Generate franchise
    await this.createFranchiseStructure(franchisePath, config, vibecode);
    await this.generateDockerCompose(franchisePath, config);
    await this.generateEnvironmentFiles(franchisePath, config, vibecode);
    await this.generateDeploymentScripts(franchisePath, config, vibecode);
    await this.generateFranchiseDocumentation(franchisePath, config, vibecode);
    
    // Save franchise config
    await this.saveFranchiseConfig(franchisePath, { config, vibecode });
    
    console.log(`🚀 Franchise generated successfully!`);
    console.log(`📁 Location: ${franchisePath}`);
    console.log(`🌐 Your vibecode: ${vibecode}`);
    console.log(`💻 Quick start: cd ${franchiseId} && ./launch-franchise.sh`);
    
    return { franchiseId, vibecode, path: franchisePath };
  }

  async collectFranchiseConfig(options) {
    return {
      packageType: options.package || 'gaming',
      businessName: options.businessName || 'My Gaming Platform',
      domain: options.domain || `${options.businessName || 'mygaming'}.vibecoded.com`,
      ownerName: options.ownerName || 'Franchise Owner',
      ownerEmail: options.ownerEmail || 'owner@example.com',
      features: options.features || [],
      customizations: options.customizations || {}
    };
  }

  async generateVibecode(config) {
    const pkg = this.packages[config.packageType];
    const prefix = pkg.vibecodePrefix;
    
    // Generate unique suffix
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    let vibecode;
    let attempts = 0;
    
    do {
      const suffix = `${timestamp}-${random}${attempts ? `-${attempts}` : ''}`;
      vibecode = `${prefix}-${suffix}`;
      attempts++;
    } while (this.vibecodeRegistry.has(vibecode) && attempts < 10);
    
    // Register the vibecode
    this.vibecodeRegistry.set(vibecode, {
      packageType: config.packageType,
      businessName: config.businessName,
      domain: config.domain,
      createdAt: new Date().toISOString()
    });
    
    await this.saveVibecodesRegistry();
    
    return vibecode;
  }

  async createFranchiseStructure(franchisePath, config, vibecode) {
    const pkg = this.packages[config.packageType];
    
    console.log('🏗️ Creating franchise structure...');
    
    // Create directory structure
    const dirs = [
      'services',
      'config',
      'scripts',
      'logs',
      'data',
      'backup',
      'docs'
    ];
    
    for (const dir of dirs) {
      await this.ensureDirectory(path.join(franchisePath, dir));
    }
    
    // Copy service configurations for this package
    for (const serviceId of pkg.services) {
      const serviceDir = path.join(franchisePath, 'services', serviceId);
      await this.ensureDirectory(serviceDir);
      
      // Copy service cookbook as configuration
      const cookbookPath = path.join(this.cookbooksDir, `${serviceId}-cookbook.md`);
      try {
        const cookbook = await fs.readFile(cookbookPath, 'utf8');
        await fs.writeFile(path.join(serviceDir, 'README.md'), cookbook);
        
        // Generate service-specific configuration
        await this.generateServiceConfig(serviceDir, serviceId, config, vibecode);
      } catch (error) {
        console.warn(`⚠️ Could not copy cookbook for ${serviceId}:`, error.message);
      }
    }
  }

  async generateServiceConfig(serviceDir, serviceId, config, vibecode) {
    const serviceConfig = {
      vibecode,
      serviceName: serviceId,
      domain: config.domain,
      businessName: config.businessName,
      environment: 'production',
      ports: this.getServicePorts(serviceId),
      dependencies: this.getServiceDependencies(serviceId),
      healthCheck: {
        endpoint: '/health',
        interval: '30s',
        timeout: '10s',
        retries: 3
      }
    };
    
    await fs.writeFile(
      path.join(serviceDir, 'config.json'),
      JSON.stringify(serviceConfig, null, 2)
    );
  }

  getServicePorts(serviceId) {
    const portMap = {
      'auth-service': { main: 3001, health: 3011 },
      'wallet-routing': { main: 3002, health: 3012 },
      'gaming-connectors': { main: 3003, health: 3013 },
      'workflow-engine': { main: 3004, health: 3014 },
      'logging-system': { main: 9999, health: 9989 }
    };
    
    return portMap[serviceId] || { main: 3000, health: 3010 };
  }

  getServiceDependencies(serviceId) {
    const depMap = {
      'auth-service': ['postgres', 'redis'],
      'wallet-routing': ['postgres', 'redis'],
      'gaming-connectors': ['postgres', 'redis', 'auth-service'],
      'workflow-engine': ['postgres', 'redis', 'auth-service'],
      'logging-system': ['redis']
    };
    
    return depMap[serviceId] || [];
  }

  async generateDockerCompose(franchisePath, config) {
    const pkg = this.packages[config.packageType];
    
    console.log('🐳 Generating Docker Compose configuration...');
    
    const compose = {
      version: '3.8',
      services: {},
      networks: {
        [`${config.businessName.toLowerCase().replace(/\s+/g, '-')}-network`]: {
          driver: 'bridge'
        }
      },
      volumes: {
        postgres_data: {},
        redis_data: {},
        logs_data: {}
      }
    };
    
    // Add infrastructure services
    compose.services.postgres = {
      image: 'postgres:14',
      environment: {
        POSTGRES_DB: config.businessName.toLowerCase().replace(/\s+/g, '_'),
        POSTGRES_USER: 'franchise_user',
        POSTGRES_PASSWORD: 'franchise_password_' + crypto.randomBytes(4).toString('hex')
      },
      volumes: ['postgres_data:/var/lib/postgresql/data'],
      networks: [Object.keys(compose.networks)[0]],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U franchise_user'],
        interval: '30s',
        timeout: '10s',
        retries: 3
      }
    };
    
    compose.services.redis = {
      image: 'redis:7-alpine',
      volumes: ['redis_data:/data'],
      networks: [Object.keys(compose.networks)[0]],
      healthcheck: {
        test: ['CMD', 'redis-cli', 'ping'],
        interval: '30s',
        timeout: '10s',
        retries: 3
      }
    };
    
    // Add package services
    for (const serviceId of pkg.services) {
      const ports = this.getServicePorts(serviceId);
      
      compose.services[serviceId.replace('-', '_')] = {
        build: `./services/${serviceId}`,
        environment: {
          NODE_ENV: 'production',
          PORT: ports.main,
          HEALTH_PORT: ports.health,
          DATABASE_URL: 'postgresql://franchise_user:franchise_password_${POSTGRES_PASSWORD_SUFFIX}@postgres:5432/${DATABASE_NAME}',
          REDIS_URL: 'redis://redis:6379',
          VIBECODE: '${VIBECODE}',
          BUSINESS_NAME: config.businessName,
          DOMAIN: config.domain
        },
        ports: [
          `${ports.main}:${ports.main}`,
          `${ports.health}:${ports.health}`
        ],
        depends_on: ['postgres', 'redis'],
        networks: [Object.keys(compose.networks)[0]],
        healthcheck: {
          test: [`CMD`, `curl`, `-f`, `http://localhost:${ports.health}/health`],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '40s'
        },
        restart: 'unless-stopped'
      };
    }
    
    const yamlContent = this.objectToYaml(compose);
    await fs.writeFile(path.join(franchisePath, 'docker-compose.yml'), yamlContent);
  }

  async generateEnvironmentFiles(franchisePath, config, vibecode) {
    console.log('⚙️ Generating environment files...');
    
    const envContent = `# ${config.businessName} Franchise Environment
# Vibecode: ${vibecode}

VIBECODE=${vibecode}
BUSINESS_NAME="${config.businessName}"
DOMAIN=${config.domain}
ENVIRONMENT=production

# Database
DATABASE_NAME=${config.businessName.toLowerCase().replace(/\s+/g, '_')}
POSTGRES_PASSWORD_SUFFIX=${crypto.randomBytes(4).toString('hex')}

# Security
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}

# Features
PACKAGE_TYPE=${config.packageType}
FRANCHISE_OWNER="${config.ownerName}"
FRANCHISE_EMAIL=${config.ownerEmail}

# Generated
CREATED_AT=${new Date().toISOString()}
FRANCHISE_ID=${config.packageType}-${vibecode.toLowerCase()}
`;

    await fs.writeFile(path.join(franchisePath, '.env'), envContent);
    await fs.writeFile(path.join(franchisePath, '.env.example'), envContent.replace(/=.*/g, '='));
  }

  async generateDeploymentScripts(franchisePath, config, vibecode) {
    console.log('📜 Generating deployment scripts...');
    
    // Launch script
    const launchScript = `#!/bin/bash

echo "🚀 Launching ${config.businessName} Franchise (${vibecode})"
echo "=================================================="

# Load environment
source .env

# Create network if it doesn't exist
docker network create ${config.businessName.toLowerCase().replace(/\s+/g, '-')}-network 2>/dev/null || true

# Pull latest images
echo "📥 Pulling Docker images..."
docker-compose pull

# Build services
echo "🏗️ Building services..."
docker-compose build

# Start services
echo "▶️ Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🩺 Checking service health..."
docker-compose ps

echo ""
echo "✅ Franchise launched successfully!"
echo "🌐 Your platform: https://${config.domain}"
echo "🔑 Vibecode: ${vibecode}"
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS"
echo "2. Set up SSL certificates"
echo "3. Customize your platform"
echo ""
echo "To stop: ./stop-franchise.sh"
echo "To update: ./update-franchise.sh"
`;

    // Stop script
    const stopScript = `#!/bin/bash

echo "🛑 Stopping ${config.businessName} Franchise (${vibecode})"

# Stop services
docker-compose down

echo "✅ Franchise stopped"
`;

    // Update script
    const updateScript = `#!/bin/bash

echo "🔄 Updating ${config.businessName} Franchise (${vibecode})"

# Pull latest cookbooks and rebuild
git pull origin main 2>/dev/null || echo "⚠️ Git not configured"

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Franchise updated"
`;

    await fs.writeFile(path.join(franchisePath, 'launch-franchise.sh'), launchScript);
    await fs.writeFile(path.join(franchisePath, 'stop-franchise.sh'), stopScript);
    await fs.writeFile(path.join(franchisePath, 'update-franchise.sh'), updateScript);
    
    // Make scripts executable
    await execAsync(`chmod +x ${path.join(franchisePath, '*.sh')}`);
  }

  async generateFranchiseDocumentation(franchisePath, config, vibecode) {
    console.log('📚 Generating franchise documentation...');
    
    const pkg = this.packages[config.packageType];
    
    let readme = `# ${config.businessName} - Vibecoded Gaming Platform\n\n`;
    readme += `**Vibecode:** \`${vibecode}\`  \n`;
    readme += `**Package:** ${pkg.name}  \n`;
    readme += `**Domain:** ${config.domain}  \n`;
    readme += `**Owner:** ${config.ownerName}  \n\n`;
    
    readme += `## Quick Start\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `# Launch your franchise\n`;
    readme += `./launch-franchise.sh\n\n`;
    readme += `# Your platform will be available at:\n`;
    readme += `# https://${config.domain}\n`;
    readme += `\`\`\`\n\n`;
    
    readme += `## Package Features\n\n`;
    pkg.features.forEach(feature => {
      readme += `- ✅ ${feature}\n`;
    });
    readme += '\n';
    
    readme += `## Included Services\n\n`;
    pkg.services.forEach(service => {
      readme += `- **${service}** - See \`services/${service}/README.md\`\n`;
    });
    readme += '\n';
    
    readme += `## Management Commands\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `# Start franchise\n`;
    readme += `./launch-franchise.sh\n\n`;
    readme += `# Stop franchise\n`;
    readme += `./stop-franchise.sh\n\n`;
    readme += `# Update franchise\n`;
    readme += `./update-franchise.sh\n\n`;
    readme += `# View logs\n`;
    readme += `docker-compose logs -f\n\n`;
    readme += `# Check status\n`;
    readme += `docker-compose ps\n`;
    readme += `\`\`\`\n\n`;
    
    readme += `## Customization\n\n`;
    readme += `1. **Branding**: Edit \`config/branding.json\`\n`;
    readme += `2. **Features**: Modify service configurations in \`services/\`\n`;
    readme += `3. **Domain**: Update \`.env\` and DNS settings\n`;
    readme += `4. **Integrations**: Add API keys in service configs\n\n`;
    
    readme += `## Support\n\n`;
    readme += `- **Vibecode**: \`${vibecode}\`\n`;
    readme += `- **Package**: ${pkg.name}\n`;
    readme += `- **Documentation**: Check \`docs/\` folder\n`;
    readme += `- **Service Cookbooks**: Each service has detailed setup instructions\n\n`;
    
    readme += `## Franchise Network\n\n`;
    readme += `This franchise is part of the Vibecoded gaming platform network.  \n`;
    readme += `All franchises share the same core technology while maintaining independence.\n\n`;
    
    readme += `---\n\n`;
    readme += `*Generated: ${new Date().toLocaleString()}*  \n`;
    readme += `*Vibecode Franchise System v1.0*\n`;
    
    await fs.writeFile(path.join(franchisePath, 'README.md'), readme);
  }

  async saveFranchiseConfig(franchisePath, data) {
    const configPath = path.join(franchisePath, 'franchise-config.json');
    await fs.writeFile(configPath, JSON.stringify(data, null, 2));
  }

  async loadVibecodesRegistry() {
    const registryPath = path.join(__dirname, 'vibecode-registry.json');
    try {
      const content = await fs.readFile(registryPath, 'utf8');
      const data = JSON.parse(content);
      this.vibecodeRegistry = new Map(Object.entries(data));
    } catch (error) {
      // Registry doesn't exist yet, start fresh
      this.vibecodeRegistry = new Map();
    }
  }

  async saveVibecodesRegistry() {
    const registryPath = path.join(__dirname, 'vibecode-registry.json');
    const data = Object.fromEntries(this.vibecodeRegistry);
    await fs.writeFile(registryPath, JSON.stringify(data, null, 2));
  }

  objectToYaml(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}:\n`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.objectToYaml(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
  }

  // CLI interface
  async runCLI() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }
    
    const config = {
      package: this.getArg(args, '--package') || 'gaming',
      businessName: this.getArg(args, '--name') || 'My Gaming Platform',
      domain: this.getArg(args, '--domain'),
      ownerName: this.getArg(args, '--owner') || 'Franchise Owner',
      ownerEmail: this.getArg(args, '--email') || 'owner@example.com'
    };
    
    // Set default domain if not provided
    if (!config.domain) {
      const slug = config.businessName.toLowerCase().replace(/\s+/g, '');
      config.domain = `${slug}.vibecoded.com`;
    }
    
    try {
      const result = await this.generateFranchise(config);
      console.log(`\n🎉 Franchise "${config.businessName}" created successfully!`);
      console.log(`💎 Vibecode: ${result.vibecode}`);
      console.log(`📁 Location: ${result.path}`);
      console.log(`\n🚀 To launch: cd ${result.franchiseId} && ./launch-franchise.sh`);
    } catch (error) {
      console.error('❌ Error creating franchise:', error.message);
      process.exit(1);
    }
  }

  getArg(args, flag) {
    const index = args.indexOf(flag);
    return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
  }

  showHelp() {
    console.log(`
🎯 Vibecode Franchise Generator

Usage:
  node vibecode-franchise-generator.js [options]

Options:
  --package <type>     Package type: starter, gaming, enterprise (default: gaming)
  --name <name>        Business name (default: "My Gaming Platform")
  --domain <domain>    Custom domain (default: auto-generated)
  --owner <name>       Owner name (default: "Franchise Owner")
  --email <email>      Owner email (default: "owner@example.com")
  --help, -h           Show this help

Examples:
  # Create a gaming platform franchise
  node vibecode-franchise-generator.js --name "Epic Gaming Hub" --owner "John Doe"
  
  # Create an enterprise franchise with custom domain
  node vibecode-franchise-generator.js --package enterprise --name "GameCorp" --domain "games.mycorp.com"

Packages:
  starter     - Basic auth and forums ($99)
  gaming      - Full gaming platform ($499)
  enterprise  - Everything + white label ($1999)
`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const generator = new VibecodeFranchiseGenerator();
  generator.runCLI().catch(console.error);
}

module.exports = { VibecodeFranchiseGenerator };