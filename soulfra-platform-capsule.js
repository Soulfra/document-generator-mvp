#!/usr/bin/env node

/**
 * 🌟💊 SOULFRA PLATFORM CAPSULE
 * Lightweight integration layer that connects platform licensing
 * to existing runtime capsule and docker infrastructure
 */

class SoulfraPlatformCapsule {
    constructor(licensing, capsuleSystem, dockerConfig) {
        this.licensing = licensing;
        this.capsuleSystem = capsuleSystem;
        this.dockerConfig = dockerConfig;
        
        // Connect to existing infrastructure
        this.existingServices = {
            mcp: 'http://localhost:3000',         // Template processor
            aiApi: 'http://localhost:3001',       // AI services
            flask: 'http://localhost:5000',       // Backend
            postgres: 'postgresql://localhost:5432',
            redis: 'redis://localhost:6379',
            minio: 'http://localhost:9000',       // S3 storage
            ollama: 'http://localhost:11434',    // Local AI
            grafana: 'http://localhost:3003',    // Monitoring
            capsules: 'http://localhost:4900'    // Runtime capsules
        };
        
        // Platform deployment manifest - extends existing docker-compose
        this.platformManifest = {
            // Additional services for platform licensing
            additionalServices: {
                'platform-controller': {
                    build: './platform-controller',
                    ports: ['8500:8500'],
                    environment: {
                        LICENSING_ENABLED: 'true',
                        CAPSULE_INTEGRATION: 'true'
                    },
                    depends_on: ['redis', 'postgres']
                },
                'agent-registry': {
                    build: './agent-registry',
                    ports: ['8501:8501'],
                    environment: {
                        SOULFRA_AGENTS: 'enabled'
                    }
                },
                'domain-router': {
                    image: 'traefik:v2.10',
                    ports: ['80:80', '443:443', '8080:8080'],
                    volumes: [
                        './traefik.yml:/etc/traefik/traefik.yml',
                        '/var/run/docker.sock:/var/run/docker.sock'
                    ]
                }
            }
        };
    }
    
    async deployLicensedPlatform(licenseId) {
        const license = this.licensing.licenses.get(licenseId);
        if (!license) throw new Error('Invalid license');
        
        console.log(`💊 Deploying platform using existing infrastructure`);
        console.log(`🐳 Extending docker-compose with platform services`);
        
        // Store deployment config in capsule system
        await this.capsuleSystem.createCapsule('platform-deployment', {
            licenseId,
            tier: license.tier,
            organization: license.organization,
            deployment: {
                base_services: Object.keys(this.existingServices),
                platform_services: Object.keys(this.platformManifest.additionalServices),
                total_containers: Object.keys(this.existingServices).length + 3
            }
        });
        
        // Generate minimal deployment script
        const deploymentScript = `#!/bin/bash
# Soulfra Platform Deployment
# Uses existing Document Generator infrastructure

echo "🌟 Deploying Soulfra Platform for ${license.organization}"

# Check existing services
docker-compose ps

# Add platform services to existing stack
cat >> docker-compose.override.yml << EOF
version: '3.8'

services:
  platform-controller:
    build: ./platform-controller
    container_name: soulfra-platform-controller
    ports:
      - "8500:8500"
    environment:
      - LICENSE_ID=${licenseId}
      - TIER=${license.tier}
    networks:
      - document-generator
    depends_on:
      - redis
      - postgres

  agent-registry:
    build: ./agent-registry
    container_name: soulfra-agent-registry
    ports:
      - "8501:8501"
    networks:
      - document-generator
      
  domain-router:
    image: traefik:v2.10
    container_name: soulfra-domain-router
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./traefik.yml:/etc/traefik/traefik.yml
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - document-generator
EOF

# Start platform services
docker-compose up -d platform-controller agent-registry domain-router

echo "✅ Platform deployed! Access at http://localhost:8500"
`;
        
        return {
            deploymentScript,
            services: {
                existing: this.existingServices,
                platform: this.platformManifest.additionalServices
            },
            endpoints: {
                platform: 'http://localhost:8500',
                agents: 'http://localhost:8501',
                domains: 'http://localhost:80'
            }
        };
    }
    
    async createSoulfraAgentCapsule(agentConfig) {
        // Lightweight agent that runs in existing infrastructure
        const agent = {
            id: `agent_${Date.now()}`,
            type: agentConfig.type,
            // Agent runs as a simple service connecting to existing APIs
            runtime: 'nodejs',
            dependencies: ['axios', 'ws'],
            
            // Simple agent script
            script: `
const axios = require('axios');
const WebSocket = require('ws');

// Connect to existing services
const services = ${JSON.stringify(this.existingServices)};

// Agent logic
async function runAgent() {
    console.log('🤖 Soulfra Agent: ${agentConfig.name}');
    
    // Connect to MCP for templates
    const templates = await axios.get(services.mcp + '/templates');
    
    // Connect to AI API
    const ai = await axios.post(services.aiApi + '/completions', {
        prompt: 'Security scan for ${agentConfig.target}'
    });
    
    // Store results in capsule
    await axios.post(services.capsules + '/capsule', {
        type: 'agent-scan',
        data: { templates: templates.data, ai: ai.data }
    });
}

setInterval(runAgent, ${agentConfig.interval || 60000});
`
        };
        
        // Store agent config in capsule
        await this.capsuleSystem.createCapsule('soulfra-agent', agent);
        
        return agent;
    }
    
    async setupCustomDomain(domain) {
        // Simple Traefik configuration for custom domains
        const traefikConfig = `
# Traefik configuration for ${domain}
http:
  routers:
    ${domain.replace(/\./g, '-')}:
      rule: "Host(\`${domain}\`)"
      service: platform-controller
      tls:
        certResolver: letsencrypt
        
  services:
    platform-controller:
      loadBalancer:
        servers:
          - url: "http://platform-controller:8500"
`;
        
        return {
            domain,
            config: traefikConfig,
            dns: {
                instructions: `Point ${domain} to your server IP`,
                verification: `curl https://${domain}/api/verify`
            }
        };
    }
    
    getNavigableDashboard() {
        // Simple HTML dashboard that connects everything
        return `<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Platform Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .service { 
            display: inline-block; 
            margin: 10px; 
            padding: 20px; 
            border: 2px solid #3498db; 
            border-radius: 10px;
            text-align: center;
        }
        .service h3 { margin: 0 0 10px 0; }
        .status { 
            display: inline-block; 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            margin-left: 5px;
        }
        .online { background: #2ecc71; }
        .offline { background: #e74c3c; }
    </style>
</head>
<body>
    <h1>🌟 Soulfra Platform Dashboard</h1>
    
    <h2>Core Services</h2>
    <div class="services">
        <div class="service">
            <h3>Template Processor</h3>
            <a href="http://localhost:3000" target="_blank">MCP Templates</a>
            <span class="status online"></span>
        </div>
        
        <div class="service">
            <h3>AI Services</h3>
            <a href="http://localhost:3001" target="_blank">AI API</a>
            <span class="status online"></span>
        </div>
        
        <div class="service">
            <h3>Security Auditor</h3>
            <a href="http://localhost:8090/enterprise-audit" target="_blank">Enterprise Audit</a>
            <span class="status online"></span>
        </div>
        
        <div class="service">
            <h3>Monitoring</h3>
            <a href="http://localhost:3003" target="_blank">Grafana</a>
            <span class="status online"></span>
        </div>
    </div>
    
    <h2>Platform Services</h2>
    <div class="services">
        <div class="service">
            <h3>Platform Controller</h3>
            <a href="http://localhost:8500" target="_blank">Control Panel</a>
            <span class="status online"></span>
        </div>
        
        <div class="service">
            <h3>Agent Registry</h3>
            <a href="http://localhost:8501" target="_blank">Agents</a>
            <span class="status online"></span>
        </div>
        
        <div class="service">
            <h3>Domain Router</h3>
            <a href="http://localhost:8080" target="_blank">Traefik</a>
            <span class="status online"></span>
        </div>
    </div>
    
    <h2>Quick Actions</h2>
    <button onclick="window.open('http://localhost:8500/license/new')">Create License</button>
    <button onclick="window.open('http://localhost:8501/agent/deploy')">Deploy Agent</button>
    <button onclick="window.open('http://localhost:8080/domain/add')">Add Domain</button>
    
    <script>
        // Check service status
        const services = [
            { url: 'http://localhost:3000', element: 0 },
            { url: 'http://localhost:3001', element: 1 },
            { url: 'http://localhost:8090', element: 2 },
            { url: 'http://localhost:3003', element: 3 },
            { url: 'http://localhost:8500', element: 4 },
            { url: 'http://localhost:8501', element: 5 },
            { url: 'http://localhost:8080', element: 6 }
        ];
        
        services.forEach(service => {
            fetch(service.url + '/health', { mode: 'no-cors' })
                .then(() => {
                    document.querySelectorAll('.status')[service.element].className = 'status online';
                })
                .catch(() => {
                    document.querySelectorAll('.status')[service.element].className = 'status offline';
                });
        });
    </script>
</body>
</html>`;
    }
}

// Export lightweight integration
module.exports = SoulfraPlatformCapsule;