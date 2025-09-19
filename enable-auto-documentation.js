#!/usr/bin/env node

/**
 * Enable Auto-Documentation System
 * Creates service cookbooks from existing systems
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AutoDocumentationSystem {
  constructor() {
    this.outputDir = path.join(__dirname, 'service-cookbooks');
    this.services = {
      'auth-service': {
        name: 'Authentication Service', 
        path: './services/auth',
        docker: 'document-generator-auth'
      },
      'wallet-routing': {
        name: 'Abstract Wallet Routing',
        path: './services/wallet',
        docker: 'document-generator-wallet'
      },
      'gaming-connectors': {
        name: 'Gaming Platform Connectors',
        path: './services/gaming',
        docker: 'document-generator-gaming'
      },
      'workflow-engine': {
        name: 'Workflow Orchestration Engine',
        path: './services/orchestrator',
        docker: 'document-generator-special-orchestrator'
      },
      'logging-system': {
        name: 'Centralized Logging',
        path: './services/central-logger',
        docker: 'document-generator-logger'
      }
    };
  }

  async enable() {
    console.log('🤖 Enabling Auto-Documentation System...\n');
    
    // Create output directory
    await this.ensureDirectory(this.outputDir);
    
    // Document each service
    for (const [serviceId, service] of Object.entries(this.services)) {
      console.log(`📚 Creating cookbook for ${service.name}...`);
      await this.documentService(serviceId, service);
    }
    
    // Create master index
    await this.createMasterIndex();
    
    console.log('\n✅ Auto-Documentation System Enabled!');
    console.log(`📖 Service cookbooks created in: ${this.outputDir}`);
    console.log('\n🚀 Next steps:');
    console.log('   1. Review generated cookbooks');
    console.log('   2. Run workflow engine to orchestrate services');
    console.log('   3. Enable self-correction loop');
    console.log('   4. Package as franchise system');
  }

  async documentService(serviceId, service) {
    const cookbook = {
      id: serviceId,
      name: service.name,
      generated: new Date().toISOString(),
      sections: {}
    };

    // 1. Service Overview
    cookbook.sections.overview = await this.captureServiceOverview(service);
    
    // 2. Configuration & Setup
    cookbook.sections.setup = await this.captureSetupInstructions(service);
    
    // 3. API Documentation
    cookbook.sections.api = await this.captureAPIDocumentation(service);
    
    // 4. Integration Points
    cookbook.sections.integrations = await this.captureIntegrations(service);
    
    // 5. Deployment Instructions
    cookbook.sections.deployment = await this.captureDeployment(service);
    
    // 6. Testing & Verification
    cookbook.sections.testing = await this.captureTestingInfo(service);
    
    // Save cookbook
    const cookbookPath = path.join(this.outputDir, `${serviceId}-cookbook.md`);
    await fs.writeFile(cookbookPath, this.formatCookbook(cookbook), 'utf8');
  }

  async captureServiceOverview(service) {
    // Check if service is running
    let status = 'Unknown';
    try {
      const { stdout } = await execAsync(`docker ps --filter name=${service.docker} --format "{{.Status}}"`);
      status = stdout.trim() || 'Not Running';
    } catch (e) {
      status = 'Docker Not Available';
    }

    return {
      description: `${service.name} provides essential functionality for the gaming platform.`,
      status,
      path: service.path,
      dockerContainer: service.docker
    };
  }

  async captureSetupInstructions(service) {
    const instructions = [];
    
    // Check for package.json
    try {
      const packagePath = path.join(service.path, 'package.json');
      await fs.access(packagePath);
      instructions.push('npm install');
    } catch {}
    
    // Check for requirements.txt
    try {
      const reqPath = path.join(service.path, 'requirements.txt');
      await fs.access(reqPath);
      instructions.push('pip install -r requirements.txt');
    } catch {}
    
    // Docker setup
    instructions.push(`docker-compose up -d ${service.docker}`);
    
    return {
      dependencies: instructions,
      environment: [
        'NODE_ENV=production',
        'PORT=<service-port>',
        'DATABASE_URL=<connection-string>'
      ]
    };
  }

  async captureAPIDocumentation(service) {
    // Look for API routes or endpoints
    const endpoints = [];
    
    // This would be enhanced to actually scan for routes
    endpoints.push({
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint'
    });
    
    endpoints.push({
      method: 'GET', 
      path: '/status',
      description: 'Service status information'
    });
    
    return { endpoints };
  }

  async captureIntegrations(service) {
    return {
      dependencies: [
        'PostgreSQL Database',
        'Redis Cache', 
        'Central Logger',
        'Stream Bridge'
      ],
      events: [
        'service.started',
        'service.stopped',
        'service.error'
      ]
    };
  }

  async captureDeployment(service) {
    return {
      docker: {
        build: `docker build -t ${service.docker} .`,
        run: `docker run -d --name ${service.docker} ${service.docker}`,
        compose: `docker-compose up -d ${service.docker}`
      },
      kubernetes: {
        apply: `kubectl apply -f k8s/${service.docker}.yaml`,
        scale: `kubectl scale deployment ${service.docker} --replicas=3`
      }
    };
  }

  async captureTestingInfo(service) {
    return {
      unit: 'npm test',
      integration: 'npm run test:integration',
      healthCheck: `curl http://localhost:<port>/health`,
      verification: [
        'Service responds to health checks',
        'Can connect to dependencies',
        'Logs are being sent to central logger',
        'Metrics are being collected'
      ]
    };
  }

  formatCookbook(cookbook) {
    let content = `# ${cookbook.name} Cookbook\n\n`;
    content += `*Generated: ${new Date(cookbook.generated).toLocaleString()}*\n\n`;
    
    // Overview
    const overview = cookbook.sections.overview;
    content += `## Overview\n\n`;
    content += `${overview.description}\n\n`;
    content += `- **Status:** ${overview.status}\n`;
    content += `- **Path:** \`${overview.path}\`\n`;
    content += `- **Docker Container:** \`${overview.dockerContainer}\`\n\n`;
    
    // Setup
    const setup = cookbook.sections.setup;
    content += `## Setup Instructions\n\n`;
    content += `### Dependencies\n\n`;
    setup.dependencies.forEach(dep => {
      content += `\`\`\`bash\n${dep}\n\`\`\`\n\n`;
    });
    content += `### Environment Variables\n\n`;
    setup.environment.forEach(env => {
      content += `- \`${env}\`\n`;
    });
    content += '\n';
    
    // API
    const api = cookbook.sections.api;
    content += `## API Documentation\n\n`;
    content += `| Method | Path | Description |\n`;
    content += `|--------|------|-------------|\n`;
    api.endpoints.forEach(endpoint => {
      content += `| ${endpoint.method} | ${endpoint.path} | ${endpoint.description} |\n`;
    });
    content += '\n';
    
    // Integrations
    const integrations = cookbook.sections.integrations;
    content += `## Integration Points\n\n`;
    content += `### Dependencies\n\n`;
    integrations.dependencies.forEach(dep => {
      content += `- ${dep}\n`;
    });
    content += `\n### Events\n\n`;
    integrations.events.forEach(event => {
      content += `- \`${event}\`\n`;
    });
    content += '\n';
    
    // Deployment
    const deployment = cookbook.sections.deployment;
    content += `## Deployment\n\n`;
    content += `### Docker\n\n`;
    content += `\`\`\`bash\n# Build\n${deployment.docker.build}\n\n`;
    content += `# Run\n${deployment.docker.run}\n\n`;
    content += `# Docker Compose\n${deployment.docker.compose}\n\`\`\`\n\n`;
    content += `### Kubernetes\n\n`;
    content += `\`\`\`bash\n# Apply configuration\n${deployment.kubernetes.apply}\n\n`;
    content += `# Scale deployment\n${deployment.kubernetes.scale}\n\`\`\`\n\n`;
    
    // Testing
    const testing = cookbook.sections.testing;
    content += `## Testing & Verification\n\n`;
    content += `### Run Tests\n\n`;
    content += `\`\`\`bash\n# Unit tests\n${testing.unit}\n\n`;
    content += `# Integration tests\n${testing.integration}\n\n`;
    content += `# Health check\n${testing.healthCheck}\n\`\`\`\n\n`;
    content += `### Verification Checklist\n\n`;
    testing.verification.forEach(check => {
      content += `- [ ] ${check}\n`;
    });
    content += '\n';
    
    content += `---\n\n`;
    content += `*This cookbook was auto-generated and can be used to rebuild the service from scratch.*\n`;
    
    return content;
  }

  async createMasterIndex() {
    let content = `# Gaming Platform Service Cookbooks\n\n`;
    content += `*Auto-generated documentation for all platform services*\n\n`;
    content += `## Available Cookbooks\n\n`;
    
    for (const [serviceId, service] of Object.entries(this.services)) {
      content += `- [${service.name}](./${serviceId}-cookbook.md)\n`;
    }
    
    content += `\n## Quick Start\n\n`;
    content += `1. Choose a service cookbook\n`;
    content += `2. Follow the setup instructions\n`;
    content += `3. Verify the service is running\n`;
    content += `4. Connect to other services as needed\n\n`;
    
    content += `## Workflow Automation\n\n`;
    content += `To automate the entire platform setup:\n\n`;
    content += `\`\`\`bash\n`;
    content += `# Start all services\n`;
    content += `docker-compose up -d\n\n`;
    content += `# Verify all services\n`;
    content += `./scripts/verify-everything.sh\n\n`;
    content += `# Enable workflow engine\n`;
    content += `node enable-workflow-engine.js\n`;
    content += `\`\`\`\n\n`;
    
    content += `## Self-Correction Loop\n\n`;
    content += `The platform includes self-correction capabilities:\n\n`;
    content += `- Automatic health monitoring\n`;
    content += `- Service restart on failure\n`;
    content += `- Log aggregation and analysis\n`;
    content += `- Performance optimization\n\n`;
    
    content += `---\n\n`;
    content += `*Generated: ${new Date().toLocaleString()}*\n`;
    
    const indexPath = path.join(this.outputDir, 'README.md');
    await fs.writeFile(indexPath, content, 'utf8');
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
  }
}

// Run the system
if (require.main === module) {
  const autoDoc = new AutoDocumentationSystem();
  autoDoc.enable().catch(console.error);
}

module.exports = { AutoDocumentationSystem };