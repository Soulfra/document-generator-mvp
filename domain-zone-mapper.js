#!/usr/bin/env node

/**
 * 🌐 DOMAIN ZONE MAPPER
 * Maps real domains to game zones with branding and functionality
 * Generates zone-specific configs from DOMAIN-REGISTRY.json
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

class DomainZoneMapper {
    constructor() {
        this.registryPath = path.join(__dirname, 'DOMAIN-REGISTRY.json');
        this.registry = null;
        this.generatedConfigs = new Map();
        
        console.log('🌐 DOMAIN ZONE MAPPER INITIALIZED');
        console.log('📋 Loading domain registry...\n');
    }

    /**
     * Load and validate the domain registry
     */
    loadRegistry() {
        try {
            const registryData = fs.readFileSync(this.registryPath, 'utf8');
            this.registry = JSON.parse(registryData);
            
            console.log(`✅ Loaded registry with ${Object.keys(this.registry.domains).length} domains`);
            
            // Validate required fields
            this.validateRegistry();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to load domain registry:', error.message);
            return false;
        }
    }

    /**
     * Validate registry structure
     */
    validateRegistry() {
        if (!this.registry.domains) {
            throw new Error('Registry missing domains configuration');
        }

        for (const [domain, config] of Object.entries(this.registry.domains)) {
            if (!config.zone || !config.branding || !config.functionality) {
                throw new Error(`Domain ${domain} missing required configuration`);
            }
        }

        console.log('✅ Registry validation passed');
    }

    /**
     * Generate zone-specific configuration for a domain
     */
    generateZoneConfig(domain, domainConfig) {
        const zoneConfig = {
            domain,
            zone: domainConfig.zone,
            branding: domainConfig.branding,
            functionality: domainConfig.functionality,
            routing: domainConfig.routing,
            
            // Add zone-specific game mechanics
            gameMechanics: this.getZoneGameMechanics(domainConfig.zone.type),
            
            // Add cross-domain portal configuration
            portals: this.generatePortalConfig(domain, domainConfig.routing.crossDomainPortals),
            
            // Add IRC-style channel routing
            channels: this.generateChannelConfig(domainConfig.functionality.chatChannels),
            
            // Add deployment-specific settings
            deployment: this.generateDeploymentConfig(domain)
        };

        return zoneConfig;
    }

    /**
     * Get game mechanics based on zone type
     */
    getZoneGameMechanics(zoneType) {
        const mechanics = {
            'boss-room': {
                interactions: ['executive-decisions', 'resource-allocation', 'strategic-planning'],
                powerups: ['insight-boost', 'productivity-multiplier', 'network-expansion'],
                challenges: ['quarterly-goals', 'market-disruption', 'team-coordination'],
                rewards: ['reputation-points', 'influence-tokens', 'access-privileges']
            },
            'trading-floor': {
                interactions: ['market-trading', 'agent-negotiation', 'blockchain-mining'],
                powerups: ['market-insight', 'trade-multiplier', 'agent-alliance'],
                challenges: ['market-volatility', 'agent-competition', 'economic-crisis'],
                rewards: ['p-money', 'trading-reputation', 'market-influence']
            },
            'collaborative-lab': {
                interactions: ['team-building', 'creative-challenges', 'world-construction'],
                powerups: ['creativity-boost', 'collaboration-multiplier', 'innovation-spark'],
                challenges: ['design-contests', 'group-projects', 'deadline-pressure'],
                rewards: ['creation-points', 'collaboration-badges', 'featured-builds']
            }
        };

        return mechanics[zoneType] || mechanics['boss-room'];
    }

    /**
     * Generate portal configuration for cross-domain navigation
     */
    generatePortalConfig(currentDomain, targetDomains) {
        return targetDomains.map(targetDomain => {
            const targetConfig = this.registry.domains[targetDomain];
            
            return {
                targetDomain,
                targetZone: targetConfig?.zone?.name || 'Unknown Zone',
                portalType: this.getPortalType(currentDomain, targetDomain),
                transitionUrl: `https://${targetDomain}${targetConfig?.routing?.mainEndpoint || '/'}`,
                requiresAuth: targetConfig?.functionality?.accessLevel === 'member'
            };
        });
    }

    /**
     * Determine portal type based on domain relationship
     */
    getPortalType(fromDomain, toDomain) {
        // Logic to determine portal visual style based on domain types
        const fromType = this.registry.domains[fromDomain]?.zone?.type;
        const toType = this.registry.domains[toDomain]?.zone?.type;
        
        if (fromType === 'boss-room' && toType === 'trading-floor') return 'elevator-down';
        if (fromType === 'trading-floor' && toType === 'boss-room') return 'elevator-up';
        if (toType === 'collaborative-lab') return 'teleporter';
        
        return 'standard-portal';
    }

    /**
     * Generate IRC-style channel configuration
     */
    generateChannelConfig(channels) {
        return channels.map(channel => ({
            name: channel,
            type: channel.startsWith('#') ? 'public' : 'private',
            crossDomain: this.registry.crossDomainConfig.ircStyle.crossDomainChannels[channel] ? true : false,
            bridged: this.registry.crossDomainConfig.ircStyle.bridging
        }));
    }

    /**
     * Generate deployment-specific configuration
     */
    generateDeploymentConfig(domain) {
        const deploymentConfig = this.registry.deploymentConfig;
        let platform = 'vercel'; // default
        
        // Determine platform based on registry
        if (deploymentConfig.platforms.vercel.domains.includes(domain)) {
            platform = 'vercel';
        } else if (deploymentConfig.platforms.railway.domains.includes(domain)) {
            platform = 'railway';
        }

        return {
            platform,
            environmentDetection: deploymentConfig.unified.environmentDetection,
            assetPath: `./assets/domains/${domain.replace(/\./g, '-')}`,
            configFile: deploymentConfig.platforms[platform].config
        };
    }

    /**
     * Generate all zone configurations
     */
    generateAllConfigs() {
        console.log('🏗️ Generating zone configurations...\n');
        
        for (const [domain, domainConfig] of Object.entries(this.registry.domains)) {
            console.log(`📍 Processing domain: ${domain}`);
            console.log(`   Zone Type: ${domainConfig.zone.type}`);
            console.log(`   Zone Name: ${domainConfig.zone.name}`);
            
            const zoneConfig = this.generateZoneConfig(domain, domainConfig);
            this.generatedConfigs.set(domain, zoneConfig);
            
            // Save individual zone config file
            const configPath = path.join(__dirname, `zones/${domain.replace(/\./g, '-')}-config.json`);
            this.ensureDirectoryExists(path.dirname(configPath));
            fs.writeFileSync(configPath, JSON.stringify(zoneConfig, null, 2));
            
            console.log(`   ✅ Config saved: ${configPath}\n`);
        }

        // Generate master zone routing file
        this.generateMasterRouting();
        
        console.log('🎉 All zone configurations generated successfully!');
    }

    /**
     * Generate master routing configuration
     */
    generateMasterRouting() {
        const masterRouting = {
            zones: Object.fromEntries(this.generatedConfigs),
            crossDomainConfig: this.registry.crossDomainConfig,
            deploymentConfig: this.registry.deploymentConfig,
            generatedAt: new Date().toISOString()
        };

        const routingPath = path.join(__dirname, 'MASTER-ZONE-ROUTING.json');
        fs.writeFileSync(routingPath, JSON.stringify(masterRouting, null, 2));
        
        console.log(`📋 Master routing saved: ${routingPath}`);
    }

    /**
     * Ensure directory exists
     */
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Start the zone mapper server for real-time configuration
     */
    startConfigServer(port = 7500) {
        const app = express();
        app.use(express.json());

        // Get zone config for specific domain
        app.get('/zone/:domain', (req, res) => {
            const domain = req.params.domain;
            const config = this.generatedConfigs.get(domain);
            
            if (!config) {
                return res.status(404).json({ error: 'Domain not found' });
            }
            
            res.json(config);
        });

        // Get all zones
        app.get('/zones', (req, res) => {
            res.json(Object.fromEntries(this.generatedConfigs));
        });

        // Health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                domains: Array.from(this.generatedConfigs.keys()),
                lastGenerated: new Date().toISOString()
            });
        });

        app.listen(port, () => {
            console.log(`\n🌐 Domain Zone Mapper Server running on port ${port}`);
            console.log(`📍 Zone configs: http://localhost:${port}/zones`);
            console.log(`🏥 Health check: http://localhost:${port}/health`);
        });
    }

    /**
     * Run the complete mapping process
     */
    async run() {
        if (!this.loadRegistry()) {
            process.exit(1);
        }

        this.generateAllConfigs();
        this.startConfigServer();
    }
}

// Run if called directly
if (require.main === module) {
    const mapper = new DomainZoneMapper();
    mapper.run().catch(console.error);
}

module.exports = DomainZoneMapper;