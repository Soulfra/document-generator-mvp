/**
 * Domain Product Name Registry
 * 
 * Maps product/tool names to actual domains and handles both internal tool names
 * and external domain registrations. This allows the system to work with both
 * conceptual product names and real domain names seamlessly.
 * 
 * "should these be product or tool names? i mean i feel like the cloud deployment 
 * is all part of the orchestrations tool layer"
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class DomainProductNameRegistry extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            defaultTLD: options.defaultTLD || '.app',
            platformDomain: options.platformDomain || 'platform.app',
            reservedPrefixes: options.reservedPrefixes || ['api', 'admin', 'app', 'www'],
            ...options
        };
        
        // Registry mappings
        this.productToDomainsMap = new Map();
        this.domainToProductMap = new Map();
        this.toolRegistry = new Map();
        this.orchestrationLayers = new Map();
        
        // Reserved and system domains
        this.reservedDomains = new Set([
            'platform.app',
            'api.platform.app',
            'admin.platform.app',
            'docs.platform.app',
            'chapter7.platform.app'
        ]);
        
        // Pre-populate with existing tools and products
        this.initializeRegistry();
        
        console.log('🌐 Domain Product Name Registry initialized');
    }
    
    /**
     * Initialize registry with known tools and products
     */
    initializeRegistry() {
        // Orchestration tool layer mappings
        this.registerOrchestrationTool('exit-hatch', {
            description: 'Exit Hatch Orchestration Layer',
            domains: ['exit-hatch.platform.app', 'resources.platform.app'],
            type: 'orchestration',
            layer: 'tool'
        });
        
        this.registerOrchestrationTool('chapter7-billing', {
            description: 'Chapter 7 Billing Receipt System',
            domains: ['billing.platform.app', 'receipts.platform.app', 'chapter7.platform.app'],
            type: 'billing',
            layer: 'companion'
        });
        
        this.registerOrchestrationTool('hook-system', {
            description: 'Hook System Connector',
            domains: ['hooks.platform.app', 'connect.platform.app'],
            type: 'integration',
            layer: 'tool'
        });
        
        this.registerOrchestrationTool('api-tiers', {
            description: 'API Permission Tier Management',
            domains: ['api.platform.app', 'tiers.platform.app'],
            type: 'security',
            layer: '5w+h'
        });
        
        // Product name mappings
        this.registerProduct('Document Generator', {
            domains: ['docgen.app', 'document-generator.app'],
            subdomains: ['api', 'docs', 'dashboard'],
            brandProtected: true
        });
        
        this.registerProduct('FinishThisIdea', {
            domains: ['finishthisidea.com', 'finishthisidea.app'],
            subdomains: ['app', 'api', 'community'],
            brandProtected: true
        });
        
        this.registerProduct('Cal Riven System', {
            domains: ['cal-riven.platform.app', 'calriven.ai'],
            subdomains: ['reasoning', 'learn', 'play'],
            brandProtected: false
        });
        
        this.registerProduct('Soulfra', {
            domains: ['soulfra.io', 'soulfra.platform.app'],
            subdomains: ['vault', 'agent', 'forum'],
            brandProtected: true
        });
        
        console.log(`📦 Initialized with ${this.productToDomainsMap.size} products`);
        console.log(`🔧 Initialized with ${this.toolRegistry.size} orchestration tools`);
    }
    
    /**
     * Register an orchestration tool
     */
    registerOrchestrationTool(toolName, config) {
        const tool = {
            name: toolName,
            ...config,
            registered: new Date(),
            id: crypto.randomUUID()
        };
        
        this.toolRegistry.set(toolName, tool);
        
        // Map domains to tool
        config.domains.forEach(domain => {
            this.domainToProductMap.set(domain, {
                type: 'tool',
                name: toolName,
                layer: config.layer
            });
        });
        
        // Track orchestration layers
        if (!this.orchestrationLayers.has(config.layer)) {
            this.orchestrationLayers.set(config.layer, []);
        }
        this.orchestrationLayers.get(config.layer).push(toolName);
        
        this.emit('tool:registered', tool);
    }
    
    /**
     * Register a product with its domain mappings
     */
    registerProduct(productName, config) {
        const product = {
            name: productName,
            domains: config.domains || [],
            subdomains: config.subdomains || [],
            brandProtected: config.brandProtected !== false,
            registered: new Date(),
            id: crypto.randomUUID()
        };
        
        this.productToDomainsMap.set(productName, product);
        
        // Map domains to product
        config.domains.forEach(domain => {
            this.domainToProductMap.set(domain, {
                type: 'product',
                name: productName,
                brandProtected: product.brandProtected
            });
            
            // Also register subdomains
            config.subdomains.forEach(subdomain => {
                const fullDomain = `${subdomain}.${domain}`;
                this.domainToProductMap.set(fullDomain, {
                    type: 'product',
                    name: productName,
                    brandProtected: product.brandProtected,
                    isSubdomain: true
                });
            });
        });
        
        this.emit('product:registered', product);
    }
    
    /**
     * Resolve a name to domains (could be product or tool name)
     */
    resolveToDomains(name) {
        // Check if it's already a domain
        if (this.isDomain(name)) {
            return {
                type: 'domain',
                primary: name,
                alternates: [],
                owner: this.domainToProductMap.get(name)
            };
        }
        
        // Check products
        const product = this.productToDomainsMap.get(name);
        if (product) {
            return {
                type: 'product',
                primary: product.domains[0],
                alternates: product.domains.slice(1),
                subdomains: product.subdomains,
                brandProtected: product.brandProtected
            };
        }
        
        // Check tools
        const tool = this.toolRegistry.get(name);
        if (tool) {
            return {
                type: 'tool',
                primary: tool.domains[0],
                alternates: tool.domains.slice(1),
                layer: tool.layer,
                description: tool.description
            };
        }
        
        // Generate suggestions for unknown names
        return this.generateDomainSuggestions(name);
    }
    
    /**
     * Generate domain suggestions for a new name
     */
    generateDomainSuggestions(name) {
        const sanitized = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        const suggestions = {
            type: 'suggestions',
            primary: `${sanitized}${this.config.defaultTLD}`,
            alternates: [
                `${sanitized}.platform.app`,
                `${sanitized}.io`,
                `${sanitized}.com`,
                `${sanitized}-app.com`
            ],
            subdomains: ['app', 'api', 'dashboard', 'docs'],
            platformSubdomain: `${sanitized}.${this.config.platformDomain}`
        };
        
        // Check availability
        suggestions.available = this.checkAvailability(suggestions.primary);
        suggestions.conflicts = this.findConflicts(sanitized);
        
        return suggestions;
    }
    
    /**
     * Check if a domain is available (not already registered)
     */
    checkAvailability(domain) {
        return !this.domainToProductMap.has(domain) && 
               !this.reservedDomains.has(domain);
    }
    
    /**
     * Find potential conflicts with existing names
     */
    findConflicts(name) {
        const conflicts = [];
        
        // Check products
        for (const [productName, product] of this.productToDomainsMap) {
            if (this.isSimilar(name, productName.toLowerCase())) {
                conflicts.push({
                    type: 'product',
                    name: productName,
                    similarity: this.calculateSimilarity(name, productName.toLowerCase()),
                    brandProtected: product.brandProtected
                });
            }
        }
        
        // Check tools
        for (const [toolName, tool] of this.toolRegistry) {
            if (this.isSimilar(name, toolName)) {
                conflicts.push({
                    type: 'tool',
                    name: toolName,
                    similarity: this.calculateSimilarity(name, toolName),
                    layer: tool.layer
                });
            }
        }
        
        return conflicts.sort((a, b) => b.similarity - a.similarity);
    }
    
    /**
     * Map a domain to deployment configuration
     */
    mapDomainToDeployment(domain, deploymentId, config = {}) {
        const mapping = {
            domain,
            deploymentId,
            type: config.type || 'custom',
            ssl: config.ssl !== false,
            created: new Date(),
            config
        };
        
        // Determine if it's a subdomain on platform
        if (domain.endsWith(this.config.platformDomain)) {
            mapping.type = 'platform-subdomain';
            mapping.ssl = 'wildcard'; // Use platform wildcard cert
        }
        
        this.domainToProductMap.set(domain, {
            ...this.domainToProductMap.get(domain),
            deploymentId,
            mapping
        });
        
        this.emit('domain:mapped', mapping);
        
        return mapping;
    }
    
    /**
     * Get all domains for an orchestration layer
     */
    getLayerDomains(layer) {
        const tools = this.orchestrationLayers.get(layer) || [];
        const domains = [];
        
        tools.forEach(toolName => {
            const tool = this.toolRegistry.get(toolName);
            if (tool) {
                domains.push(...tool.domains);
            }
        });
        
        return domains;
    }
    
    /**
     * Get deployment info for a domain
     */
    getDeploymentInfo(domain) {
        const info = this.domainToProductMap.get(domain);
        
        if (!info) {
            return null;
        }
        
        return {
            domain,
            ...info,
            isReserved: this.reservedDomains.has(domain),
            isAvailable: !info.deploymentId && !this.reservedDomains.has(domain)
        };
    }
    
    /**
     * Reserve a domain for future use
     */
    reserveDomain(domain, reason) {
        if (this.domainToProductMap.has(domain)) {
            throw new Error(`Domain ${domain} is already registered`);
        }
        
        this.reservedDomains.add(domain);
        
        this.domainToProductMap.set(domain, {
            type: 'reserved',
            reason,
            reserved: new Date()
        });
        
        this.emit('domain:reserved', { domain, reason });
    }
    
    /**
     * Generate a report of all registrations
     */
    generateReport() {
        const report = {
            timestamp: new Date(),
            summary: {
                totalProducts: this.productToDomainsMap.size,
                totalTools: this.toolRegistry.size,
                totalDomains: this.domainToProductMap.size,
                reservedDomains: this.reservedDomains.size,
                orchestrationLayers: this.orchestrationLayers.size
            },
            products: [],
            tools: [],
            layers: {}
        };
        
        // Products
        for (const [name, product] of this.productToDomainsMap) {
            report.products.push({
                name,
                domains: product.domains.length,
                brandProtected: product.brandProtected
            });
        }
        
        // Tools
        for (const [name, tool] of this.toolRegistry) {
            report.tools.push({
                name,
                layer: tool.layer,
                domains: tool.domains.length,
                type: tool.type
            });
        }
        
        // Layers
        for (const [layer, tools] of this.orchestrationLayers) {
            report.layers[layer] = {
                tools: tools.length,
                domains: this.getLayerDomains(layer).length
            };
        }
        
        return report;
    }
    
    // Utility methods
    isDomain(str) {
        return str.includes('.') && !str.includes(' ');
    }
    
    isSimilar(str1, str2) {
        return this.calculateSimilarity(str1, str2) > 0.7;
    }
    
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.getEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    getEditDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

// Example usage and testing
const registry = new DomainProductNameRegistry();

// Test various name resolutions
console.log('\n🧪 Testing Domain Product Name Registry\n');

// Test 1: Resolve known product
console.log('Test 1: Known Product');
const docgenResult = registry.resolveToDomains('Document Generator');
console.log('Result:', docgenResult);

// Test 2: Resolve tool name
console.log('\nTest 2: Tool Name');
const exitHatchResult = registry.resolveToDomains('exit-hatch');
console.log('Result:', exitHatchResult);

// Test 3: Resolve actual domain
console.log('\nTest 3: Actual Domain');
const domainResult = registry.resolveToDomains('api.platform.app');
console.log('Result:', domainResult);

// Test 4: Generate suggestions for new name
console.log('\nTest 4: New Product Name');
const newProductResult = registry.resolveToDomains('Super Cool Analytics Tool');
console.log('Result:', newProductResult);

// Test 5: Map domain to deployment
console.log('\nTest 5: Domain Deployment Mapping');
const mapping = registry.mapDomainToDeployment(
    'analytics.platform.app',
    'deployment-789',
    { type: 'platform-subdomain' }
);
console.log('Mapping:', mapping);

// Test 6: Get orchestration layer domains
console.log('\nTest 6: Orchestration Layer Domains');
const toolLayerDomains = registry.getLayerDomains('tool');
console.log('Tool Layer Domains:', toolLayerDomains);

// Generate report
console.log('\n📊 Registry Report:');
const report = registry.generateReport();
console.log(JSON.stringify(report, null, 2));

// Register a new product
registry.registerProduct('TechFlow Solutions', {
    domains: ['techflow.app', 'techflow-solutions.com'],
    subdomains: ['app', 'api', 'dashboard'],
    brandProtected: true
});

// Register a new tool
registry.registerOrchestrationTool('quantum-processor', {
    description: 'Quantum Processing Orchestration Layer',
    domains: ['quantum.platform.app', 'qpu.platform.app'],
    type: 'processing',
    layer: 'tool'
});

module.exports = {
    DomainProductNameRegistry,
    registry
};

console.log('\n🌐 Domain Product Name Registry Ready!');
console.log('✅ Maps product/tool names to domains');
console.log('✅ Handles internal tools and external products');
console.log('✅ Generates domain suggestions');
console.log('✅ Tracks orchestration layers');
console.log('✅ Manages domain deployment mappings');
console.log('✅ Conflict detection and brand protection');