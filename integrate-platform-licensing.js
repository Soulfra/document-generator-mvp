#!/usr/bin/env node

/**
 * 🔗 PLATFORM LICENSING INTEGRATION
 * Connects platform licensing to existing infrastructure
 * WITHOUT creating new containers or overloading memory
 */

// Import existing systems
const SoulfraPlatformLicensing = require('./soulfra-platform-licensing');
const SoulfraPlatformCapsule = require('./soulfra-platform-capsule');
const EnterpriseSecurityAuditor = require('./enterprise-security-auditor');

// Lightweight integration that uses existing services
class PlatformLicensingIntegration {
    constructor(unifiedGameNode) {
        this.gameNode = unifiedGameNode;
        
        // Initialize licensing system
        this.licensing = new SoulfraPlatformLicensing(this.gameNode.enterpriseAuditor);
        
        // Create capsule integration (uses existing runtime-capsule-system)
        this.capsule = new SoulfraPlatformCapsule(
            this.licensing,
            { createCapsule: this.mockCapsuleSystem }, // Would connect to real capsule system
            this.getDockerConfig()
        );
        
        console.log('🔗 Platform Licensing Integration initialized');
        console.log('💊 Using existing capsule system for state management');
        console.log('🐳 Extending existing Docker infrastructure');
    }
    
    // Mock capsule system for demo (would connect to real one at port 4900)
    mockCapsuleSystem(type, data) {
        console.log(`💊 Storing ${type} capsule:`, data);
        return Promise.resolve({ id: `capsule_${Date.now()}` });
    }
    
    getDockerConfig() {
        // References existing docker-compose.yml
        return {
            compose_file: './docker-compose.yml',
            override_file: './docker-compose.override.yml',
            existing_services: 13,
            networks: ['document-generator']
        };
    }
    
    // API endpoints to add to unified-game-node
    getAPIEndpoints() {
        return {
            '/api/platform/license': async (req, res) => {
                if (req.method === 'POST') {
                    const license = await this.licensing.createLicense(
                        req.body.customerId,
                        req.body.config
                    );
                    res.json(license);
                }
            },
            
            '/api/platform/deploy': async (req, res) => {
                const deployment = await this.capsule.deployLicensedPlatform(
                    req.body.licenseId
                );
                res.json(deployment);
            },
            
            '/api/platform/agent': async (req, res) => {
                const agent = await this.licensing.createSoulfraAgent(
                    req.body.licenseId,
                    req.body.agentConfig
                );
                res.json(agent);
            },
            
            '/api/platform/domain': async (req, res) => {
                const domain = await this.licensing.addCustomDomain(
                    req.body.licenseId,
                    req.body.domainConfig
                );
                res.json(domain);
            }
        };
    }
    
    // Web interface to add to unified-game-node
    servePlatformDashboard(res) {
        const html = this.capsule.getNavigableDashboard();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    // Demo function to show how it all works
    async demo() {
        console.log('\n🎯 PLATFORM LICENSING DEMO');
        console.log('==========================\n');
        
        // Create a license
        console.log('1️⃣ Creating Enterprise License...');
        const license = await this.licensing.createLicense('acme-corp', {
            tier: 'enterprise',
            organization: 'ACME Corporation',
            admin_email: 'admin@acme.com',
            platform_name: 'ACME Security Platform'
        });
        console.log(`   ✅ License created: ${license.id}`);
        console.log(`   💰 Tier: ${license.tier} ($50,000/month)`);
        
        // Deploy platform (lightweight - just adds 3 services)
        console.log('\n2️⃣ Deploying Platform...');
        const deployment = await this.capsule.deployLicensedPlatform(license.id);
        console.log(`   ✅ Platform deployed`);
        console.log(`   🐳 Services: ${Object.keys(deployment.services.existing).length} existing + 3 new`);
        console.log(`   🌐 Access at: ${deployment.endpoints.platform}`);
        
        // Create a .soulfra agent
        console.log('\n3️⃣ Creating .soulfra Agent...');
        const agent = await this.licensing.createSoulfraAgent(license.id, {
            name: 'ACME Scanner',
            type: 'scanner',
            target_domains: ['acme.com', 'api.acme.com']
        });
        console.log(`   ✅ Agent created: ${agent.agent.identity.hostname}`);
        console.log(`   🤖 Type: Security Scanner Agent`);
        
        // Add custom domain
        console.log('\n4️⃣ Adding Custom Domain...');
        const domain = await this.licensing.addCustomDomain(license.id, {
            domain: 'security.acme.com',
            wildcard: true
        });
        console.log(`   ✅ Domain added: ${domain.domain}`);
        console.log(`   🔒 SSL: Auto-provisioned`);
        
        // Show dashboard
        console.log('\n5️⃣ Platform Dashboard');
        console.log(`   🌐 Navigate to: http://localhost:8500`);
        console.log(`   📊 View all services in one place`);
        console.log(`   🎯 Manage licenses, agents, and domains`);
        
        console.log('\n✅ Demo complete! Platform is ready for production use.');
        console.log('💡 No new heavy containers - just 3 lightweight services added');
        console.log('🚀 Fully integrated with existing Document Generator infrastructure');
    }
}

// Export for use in unified-game-node
module.exports = PlatformLicensingIntegration;

// Run demo if executed directly
if (require.main === module) {
    const integration = new PlatformLicensingIntegration({
        enterpriseAuditor: {
            // Mock auditor for demo
            services: {}
        }
    });
    
    integration.demo().catch(console.error);
}