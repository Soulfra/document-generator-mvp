#!/usr/bin/env node

/**
 * 🎯 LAYER SDK ORCHESTRATOR
 * 
 * Creates SDK for each layer/tier in our system
 * Prevents rebuilding by using existing components
 * Maps dependencies and provides clear integration paths
 */

const fs = require('fs').promises;
const path = require('path');
const VersionManager = require('./version-manager');
const SystemIndexMapper = require('./SYSTEM-INDEX-MAPPER');

class LayerSDKOrchestrator {
    constructor() {
        this.versionManager = new VersionManager();
        this.indexMapper = new SystemIndexMapper();
        
        // Define our system layers
        this.layers = {
            tier1: {
                name: 'Application Layer',
                components: ['dashboards', 'web interfaces', 'mobile apps'],
                existingFiles: [
                    'dashboard.html',
                    'ai-economy-dashboard.html',
                    'business-management-interface.html'
                ],
                sdk: {
                    name: 'app-layer-sdk',
                    exports: ['UI components', 'dashboard widgets', 'auth flows']
                }
            },
            
            tier2: {
                name: 'Business Logic Layer',
                components: ['accounting', 'billing', 'employment', 'analytics'],
                existingFiles: [
                    'business-accounting-system.js',
                    'usage-billing-engine.js',
                    'agent-employment-system.js',
                    'tax-intelligence-engine.js'
                ],
                sdk: {
                    name: 'business-layer-sdk',
                    exports: ['billing API', 'accounting services', 'tax calculations']
                }
            },
            
            tier3: {
                name: 'Platform Services Layer',
                components: ['authentication', 'verification', 'API routing'],
                existingFiles: [
                    'auth-foundation-system.js',
                    'platform-verification-extension.js',
                    'universal-api-adapter.js'
                ],
                sdk: {
                    name: 'platform-layer-sdk',
                    exports: ['auth client', 'verification service', 'API client']
                }
            },
            
            tier4: {
                name: 'Infrastructure Layer',
                components: ['storage', 'messaging', 'distributed systems'],
                existingFiles: [
                    'unified-substrate-query-engine.js',
                    'cross-substrate-verifier.js',
                    'sovereign-database-bridge.js'
                ],
                sdk: {
                    name: 'infra-layer-sdk',
                    exports: ['storage client', 'query builder', 'substrate adapter']
                }
            },
            
            tier5: {
                name: 'Core System Layer',
                components: ['versioning', 'documentation', 'system management'],
                existingFiles: [
                    'version-manager.js',
                    'scripts/generate-ard.js',
                    'SYSTEM-INDEX-MAPPER.js'
                ],
                sdk: {
                    name: 'core-layer-sdk',
                    exports: ['version control', 'ARD generator', 'system mapper']
                }
            }
        };
        
        // Existing SDK patterns we've already built
        this.existingPatterns = {
            stripe: {
                pattern: 'stripe-agent-attribution-handler.js',
                features: ['webhook handling', 'payment processing', 'subscription management'],
                canReuseFor: ['billing', 'payments', 'subscriptions']
            },
            
            auth: {
                pattern: 'auth-foundation-system.js',
                features: ['user management', 'session handling', 'token generation'],
                canReuseFor: ['authentication', 'authorization', 'user accounts']
            },
            
            api: {
                pattern: 'universal-api-adapter.js',
                features: ['REST', 'GraphQL', 'gRPC', 'WebSocket'],
                canReuseFor: ['api clients', 'service communication', 'data fetching']
            }
        };
    }
    
    async generateLayerSDK(layerId) {
        const layer = this.layers[layerId];
        if (!layer) {
            throw new Error(`Unknown layer: ${layerId}`);
        }
        
        console.log(`\n🎯 Generating SDK for ${layer.name}...`);
        
        // Check what we already have
        const existingComponents = await this.findExistingComponents(layer);
        
        // Generate SDK structure
        const sdk = {
            name: layer.sdk.name,
            version: await this.getVersionFromManager(),
            layer: layerId,
            description: `SDK for ${layer.name}`,
            
            // Reuse existing components
            components: existingComponents.map(comp => ({
                source: comp.file,
                exports: comp.exports,
                reusePattern: comp.pattern
            })),
            
            // API definition
            api: this.generateLayerAPI(layer, existingComponents),
            
            // Dependencies on other layers
            dependencies: this.getLayerDependencies(layerId),
            
            // Export structure
            exports: layer.sdk.exports,
            
            // Integration examples
            examples: this.generateIntegrationExamples(layer)
        };
        
        // Generate actual SDK files
        await this.writeSDKFiles(sdk);
        
        return sdk;
    }
    
    async findExistingComponents(layer) {
        const components = [];
        
        for (const file of layer.existingFiles) {
            try {
                // Check if file exists
                await fs.access(file);
                
                // Analyze exports
                const exports = await this.analyzeFileExports(file);
                
                // Find matching pattern
                const pattern = this.findMatchingPattern(file);
                
                components.push({
                    file,
                    exports,
                    pattern: pattern ? pattern.pattern : null,
                    canReuse: pattern ? pattern.canReuseFor : []
                });
            } catch (error) {
                console.log(`  ⚠️  ${file} not found, will need to implement`);
            }
        }
        
        return components;
    }
    
    async analyzeFileExports(file) {
        try {
            const content = await fs.readFile(file, 'utf8');
            
            // Simple export analysis
            const exports = [];
            
            // Check for module.exports
            if (content.includes('module.exports')) {
                const match = content.match(/module\.exports\s*=\s*(\w+)/);
                if (match) exports.push(match[1]);
            }
            
            // Check for class definitions
            const classMatches = content.matchAll(/class\s+(\w+)/g);
            for (const match of classMatches) {
                exports.push(match[1]);
            }
            
            // Check for function exports
            const funcMatches = content.matchAll(/exports\.(\w+)\s*=/g);
            for (const match of funcMatches) {
                exports.push(match[1]);
            }
            
            return exports;
        } catch (error) {
            return [];
        }
    }
    
    findMatchingPattern(file) {
        for (const [name, pattern] of Object.entries(this.existingPatterns)) {
            if (file.includes(name) || pattern.pattern === file) {
                return pattern;
            }
        }
        return null;
    }
    
    generateLayerAPI(layer, components) {
        const api = {
            endpoints: [],
            services: [],
            models: []
        };
        
        // Generate based on layer type
        switch (layer.name) {
            case 'Application Layer':
                api.endpoints.push(
                    { path: '/dashboard', method: 'GET', returns: 'DashboardData' },
                    { path: '/widgets', method: 'GET', returns: 'Widget[]' }
                );
                api.services.push('DashboardService', 'WidgetService');
                api.models.push('DashboardData', 'Widget');
                break;
                
            case 'Business Logic Layer':
                api.endpoints.push(
                    { path: '/billing/invoice', method: 'POST', returns: 'Invoice' },
                    { path: '/accounting/report', method: 'GET', returns: 'Report' }
                );
                api.services.push('BillingService', 'AccountingService');
                api.models.push('Invoice', 'Report', 'Transaction');
                break;
                
            case 'Platform Services Layer':
                api.endpoints.push(
                    { path: '/auth/login', method: 'POST', returns: 'AuthToken' },
                    { path: '/verify', method: 'GET', returns: 'VerificationResult' }
                );
                api.services.push('AuthService', 'VerificationService');
                api.models.push('User', 'AuthToken', 'Session');
                break;
        }
        
        return api;
    }
    
    getLayerDependencies(layerId) {
        const dependencies = {
            tier1: ['tier2', 'tier3'], // App depends on Business and Platform
            tier2: ['tier3', 'tier4'], // Business depends on Platform and Infra
            tier3: ['tier4'],          // Platform depends on Infrastructure
            tier4: ['tier5'],          // Infrastructure depends on Core
            tier5: []                  // Core has no dependencies
        };
        
        return dependencies[layerId] || [];
    }
    
    generateIntegrationExamples(layer) {
        const examples = [];
        
        // Generate TypeScript example
        examples.push({
            language: 'typescript',
            code: `
import { ${layer.sdk.name} } from '@document-generator/${layer.sdk.name}';

// Initialize the SDK
const sdk = new ${layer.sdk.name}({
    apiKey: process.env.API_KEY,
    environment: 'production'
});

// Example usage
async function example() {
    ${this.generateExampleCode(layer)}
}
`
        });
        
        return examples;
    }
    
    generateExampleCode(layer) {
        switch (layer.name) {
            case 'Application Layer':
                return `const dashboard = await sdk.dashboard.getData();
    const widgets = await sdk.widgets.list();
    console.log('Dashboard:', dashboard);`;
    
            case 'Business Logic Layer':
                return `const invoice = await sdk.billing.createInvoice({
        amount: 100,
        description: 'Service charge'
    });
    console.log('Invoice:', invoice);`;
    
            case 'Platform Services Layer':
                return `const token = await sdk.auth.login({
        email: 'user@example.com',
        password: 'secure123'
    });
    console.log('Auth token:', token);`;
    
            default:
                return '// Add your code here';
        }
    }
    
    async getVersionFromManager() {
        try {
            await this.versionManager.initialize();
            return this.versionManager.currentVersion.version;
        } catch (error) {
            return '1.0.0';
        }
    }
    
    async writeSDKFiles(sdk) {
        const sdkDir = path.join('sdks', sdk.name);
        
        // Create directory structure
        await fs.mkdir(sdkDir, { recursive: true });
        await fs.mkdir(path.join(sdkDir, 'src'), { recursive: true });
        await fs.mkdir(path.join(sdkDir, 'examples'), { recursive: true });
        
        // Write package.json
        const packageJson = {
            name: `@document-generator/${sdk.name}`,
            version: sdk.version,
            description: sdk.description,
            main: 'src/index.js',
            types: 'src/index.d.ts',
            scripts: {
                build: 'tsc',
                test: 'jest'
            },
            dependencies: sdk.dependencies.reduce((deps, layerId) => {
                const depLayer = this.layers[layerId];
                deps[`@document-generator/${depLayer.sdk.name}`] = sdk.version;
                return deps;
            }, {})
        };
        
        await fs.writeFile(
            path.join(sdkDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        
        // Write main SDK file
        const indexContent = this.generateSDKIndex(sdk);
        await fs.writeFile(path.join(sdkDir, 'src', 'index.js'), indexContent);
        
        // Write examples
        for (const [i, example] of sdk.examples.entries()) {
            await fs.writeFile(
                path.join(sdkDir, 'examples', `example${i + 1}.${example.language}`),
                example.code
            );
        }
        
        // Write README
        const readme = this.generateSDKReadme(sdk);
        await fs.writeFile(path.join(sdkDir, 'README.md'), readme);
        
        console.log(`✅ SDK written to ${sdkDir}/`);
    }
    
    generateSDKIndex(sdk) {
        return `/**
 * ${sdk.name} - ${sdk.description}
 * Version: ${sdk.version}
 * Layer: ${sdk.layer}
 */

${sdk.components.map(comp => 
    `const ${path.basename(comp.source, '.js')} = require('../../${comp.source}');`
).join('\n')}

class ${this.toPascalCase(sdk.name)} {
    constructor(config = {}) {
        this.config = config;
        ${sdk.components.map(comp => 
            `this.${this.toCamelCase(path.basename(comp.source, '.js'))} = new ${path.basename(comp.source, '.js')}(config);`
        ).join('\n        ')}
    }
    
    ${sdk.api.services.map(service => `
    get ${this.toCamelCase(service)}() {
        return this.${this.toCamelCase(service)};
    }`).join('\n    ')}
}

module.exports = ${this.toPascalCase(sdk.name)};
`;
    }
    
    generateSDKReadme(sdk) {
        return `# ${sdk.name}

${sdk.description}

## Installation

\`\`\`bash
npm install @document-generator/${sdk.name}
\`\`\`

## Usage

\`\`\`javascript
${sdk.examples[0].code}
\`\`\`

## API Reference

### Endpoints
${sdk.api.endpoints.map(ep => 
    `- \`${ep.method} ${ep.path}\` - Returns \`${ep.returns}\``
).join('\n')}

### Services
${sdk.api.services.map(service => `- ${service}`).join('\n')}

### Models
${sdk.api.models.map(model => `- ${model}`).join('\n')}

## Dependencies
${sdk.dependencies.map(dep => `- ${this.layers[dep].sdk.name}`).join('\n')}

## Components
This SDK reuses the following existing components:
${sdk.components.map(comp => `- ${comp.source}`).join('\n')}
`;
    }
    
    toPascalCase(str) {
        return str.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
    }
    
    toCamelCase(str) {
        const pascal = this.toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
    
    async generateAllLayerSDKs() {
        console.log('🎯 Generating SDKs for all layers...\n');
        
        const results = [];
        
        for (const layerId of Object.keys(this.layers)) {
            try {
                const sdk = await this.generateLayerSDK(layerId);
                results.push({ layerId, sdk, success: true });
            } catch (error) {
                results.push({ layerId, error: error.message, success: false });
            }
        }
        
        // Generate dependency graph
        await this.generateDependencyGraph(results);
        
        return results;
    }
    
    async generateDependencyGraph(results) {
        const mermaid = `
graph TD
    %% Layer SDKs
    ${results.filter(r => r.success).map(r => 
        `${r.layerId}[${r.sdk.name}]`
    ).join('\n    ')}
    
    %% Dependencies
    ${Object.entries(this.layers).map(([layerId, layer]) => 
        this.getLayerDependencies(layerId).map(dep => 
            `${layerId} --> ${dep}`
        ).join('\n    ')
    ).join('\n    ')}
    
    %% Styling
    classDef app fill:#ff6b6b,stroke:#333,stroke-width:2px;
    classDef business fill:#4ecdc4,stroke:#333,stroke-width:2px;
    classDef platform fill:#45b7d1,stroke:#333,stroke-width:2px;
    classDef infra fill:#96ceb4,stroke:#333,stroke-width:2px;
    classDef core fill:#dfe6e9,stroke:#333,stroke-width:2px;
    
    class tier1 app;
    class tier2 business;
    class tier3 platform;
    class tier4 infra;
    class tier5 core;
`;
        
        await fs.writeFile('sdk-dependency-graph.mmd', mermaid);
        console.log('\n📊 Dependency graph written to sdk-dependency-graph.mmd');
    }
}

// CLI Interface
if (require.main === module) {
    const orchestrator = new LayerSDKOrchestrator();
    
    const command = process.argv[2];
    const layer = process.argv[3];
    
    switch (command) {
        case 'generate':
            if (layer) {
                orchestrator.generateLayerSDK(layer)
                    .then(sdk => console.log('\n✅ SDK generated successfully'))
                    .catch(err => console.error('❌ Error:', err.message));
            } else {
                orchestrator.generateAllLayerSDKs()
                    .then(results => {
                        console.log('\n📊 SDK Generation Summary:');
                        results.forEach(r => {
                            console.log(`  ${r.layerId}: ${r.success ? '✅' : '❌'} ${r.success ? r.sdk.name : r.error}`);
                        });
                    });
            }
            break;
            
        case 'list':
            console.log('\n📚 Available Layers:');
            Object.entries(orchestrator.layers).forEach(([id, layer]) => {
                console.log(`\n${id}: ${layer.name}`);
                console.log(`  SDK: ${layer.sdk.name}`);
                console.log(`  Components: ${layer.components.join(', ')}`);
            });
            break;
            
        case 'check':
            console.log('\n🔍 Checking existing patterns...');
            Object.entries(orchestrator.existingPatterns).forEach(([name, pattern]) => {
                console.log(`\n${name}:`);
                console.log(`  Pattern: ${pattern.pattern}`);
                console.log(`  Can reuse for: ${pattern.canReuseFor.join(', ')}`);
            });
            break;
            
        default:
            console.log('Usage: node LAYER-SDK-ORCHESTRATOR.js [command] [layer]');
            console.log('Commands:');
            console.log('  generate [layer] - Generate SDK for specific layer or all layers');
            console.log('  list            - List all available layers');
            console.log('  check           - Check existing patterns we can reuse');
    }
}

module.exports = LayerSDKOrchestrator;