#!/usr/bin/env node

/**
 * SCHEMA REGISTRY - Catalogs and organizes all existing schema systems
 * 
 * Provides unified access to:
 * - Bitmap and visual formatting schemas
 * - Soulfra login/abstract systems 
 * - Cross-language integration schemas (Solidity, Flask, Rust)
 * - Citation and billing schemas
 * - Tier-based documentation schemas
 * - Newline/color/formatting specifications
 */

const fs = require('fs');
const path = require('path');
const { getResourceManager } = require('./resource-manager');

class SchemaRegistry {
    constructor(options = {}) {
        this.baseDir = options.baseDir || __dirname;
        this.resourceManager = getResourceManager();
        
        this.schemas = new Map();
        this.categories = new Map();
        this.indexCache = new Map();
        
        // Schema categories from our research
        this.initializeCategories();
        
        console.log('📋 Schema Registry initializing...');
    }
    
    initializeCategories() {
        this.categories.set('bitmap_visual', {
            name: 'Bitmap & Visual Formatting',
            description: 'Pixel-level specifications, color systems, newline-aware schemas',
            patterns: ['bitmap', 'visual', 'color', 'pixel', 'format'],
            priority: 'high',
            specifications: {
                colors: {
                    success: '#00ff88',   // Green for pass/success
                    error: '#ff4444',     // Red for fail/error
                    warning: '#ffaa00',   // Yellow for warning
                    info: '#00aaff',      // Blue for info
                    neutral: '#888888'    // Gray for neutral
                },
                newlineHandling: {
                    preserveFormatting: true,
                    tickerTapeCompatible: true,
                    ocrFriendly: true
                },
                accessibility: {
                    colorBlindSupport: true,
                    highContrast: true,
                    textAlternatives: true
                }
            }
        });
        
        this.categories.set('soulfra_auth', {
            name: 'Soulfra Authentication Systems',
            description: '700+ Soulfra components with abstract login patterns',
            patterns: ['soulfra', 'auth', 'login', 'abstract', 'mvp'],
            priority: 'high',
            components: {
                'os-soulfra-auth': 'Core authentication layer',
                'soulfra-mvp': 'MVP implementation directory',
                'abstract-auth': 'Abstract authentication patterns',
                'trust-tier': 'Trust-based tier middleware'
            }
        });
        
        this.categories.set('cross_language', {
            name: 'Cross-Language Integration',
            description: 'Solidity, Flask, Rust, JavaScript bridges',
            patterns: ['cross-language', 'bridge', 'adapter', 'integration'],
            priority: 'high',
            languages: {
                solidity: {
                    contracts: ['AbstractBootSequence', 'AbstractDropletSystem', 'BitMaps'],
                    features: ['OpenZeppelin', 'CrossChain', 'EVM optimization']
                },
                flask: {
                    services: ['ai-os-clean Python services'],
                    features: ['REST API', 'ML integration']
                },
                rust: {
                    adapters: ['Performance-critical adapters'],
                    features: ['Memory safety', 'Speed optimization']
                },
                javascript: {
                    orchestration: ['Node.js coordination systems'],
                    features: ['Event-driven', 'Real-time']
                }
            }
        });
        
        this.categories.set('tier_documentation', {
            name: 'Tier-Based Documentation',
            description: 'Tier 3→2→1 architecture with dot-file system',
            patterns: ['tier', 'dot-file', 'documentation', 'symlink'],
            priority: 'high',
            structure: {
                tier3: 'Meta-Documentation (permanent, git-tracked)',
                tier2: 'Working Services (regeneratable)',
                tier1: 'Generated Output (ephemeral)',
                dotFiles: ['.tier3', '.tier2', '.tier1', '.quest', '.cal', '.layer']
            }
        });
        
        this.categories.set('citation_billing', {
            name: 'Citation & Billing Systems',
            description: 'Academic citations and usage-based billing',
            patterns: ['citation', 'bill', 'stripe', 'academic', 'reference'],
            priority: 'medium',
            features: {
                academic: 'Academic-style references',
                blockchain: 'Blockchain-based verification',
                automated: 'Auto-generated bill systems',
                compliance: 'FinCEN and tax compliance'
            }
        });
    }
    
    async scanForSchemas() {
        console.log('🔍 Scanning for existing schemas...');
        
        const discovered = {
            bitmap_visual: await this.findBitmapSchemas(),
            soulfra_auth: await this.findSoulfraSchemas(),
            cross_language: await this.findCrossLanguageSchemas(),
            tier_documentation: await this.findTierSchemas(),
            citation_billing: await this.findCitationSchemas()
        };
        
        // Register all discovered schemas
        for (const [category, schemas] of Object.entries(discovered)) {
            for (const schema of schemas) {
                this.registerSchema(category, schema);
            }
        }
        
        console.log(`✅ Discovered ${this.schemas.size} schemas across ${this.categories.size} categories`);
        return discovered;
    }
    
    async findBitmapSchemas() {
        const bitmapFiles = [
            'BITMAP-VERIFICATION-SPECS.md',
            'docs/BITMAP-ANALYSIS-MANUAL.md', 
            'BITMAP-STATE-COMPRESSION.md',
            'BitmapGenerator.js',
            'BitmapVisualizer.js',
            'musical-bitmap-generator.js'
        ];
        
        const found = [];
        for (const file of bitmapFiles) {
            const fullPath = path.join(this.baseDir, file);
            if (await this.fileExists(fullPath)) {
                found.push({
                    name: path.basename(file, path.extname(file)),
                    path: fullPath,
                    type: 'bitmap_specification',
                    features: ['visual_formatting', 'color_schemes', 'newline_handling'],
                    lastModified: await this.getLastModified(fullPath)
                });
            }
        }
        
        return found;
    }
    
    async findSoulfraSchemas() {
        const soulfraPatterns = [
            'web-interface/os-ard-components/os-soulfra-*',
            'soulfra-mvp*',
            '*soulfra*auth*',
            'SOULFRA-SYSTEM-INVENTORY.md'
        ];
        
        const found = [];
        
        // Search for Soulfra component directories
        try {
            const webInterfaceDir = path.join(this.baseDir, 'web-interface/os-ard-components');
            if (await this.fileExists(webInterfaceDir)) {
                const files = await fs.promises.readdir(webInterfaceDir);
                const soulfraFiles = files.filter(f => f.startsWith('os-soulfra-'));
                
                for (const file of soulfraFiles) {
                    found.push({
                        name: file,
                        path: path.join(webInterfaceDir, file),
                        type: 'soulfra_component',
                        features: ['authentication', 'abstract_patterns', 'mvp_ready']
                    });
                }
            }
        } catch (error) {
            // Directory might not exist, that's OK
        }
        
        return found;
    }
    
    async findCrossLanguageSchemas() {
        const crossLanguageFiles = [
            'docs/CROSS-LANGUAGE-TEST-SPEC.md',
            'utp-orchestrator/test/end-to-end/cross-language-test.js',
            'contracts/*.sol',
            'ai-os-clean/**/*.py'
        ];
        
        const found = [];
        
        // Look for specific integration files
        const specificFiles = [
            'docs/CROSS-LANGUAGE-TEST-SPEC.md',
            'utp-orchestrator/test/end-to-end/cross-language-test.js'
        ];
        
        for (const file of specificFiles) {
            const fullPath = path.join(this.baseDir, file);
            if (await this.fileExists(fullPath)) {
                found.push({
                    name: path.basename(file, path.extname(file)),
                    path: fullPath,
                    type: 'cross_language_bridge',
                    features: ['multi_language', 'testing', 'integration']
                });
            }
        }
        
        return found;
    }
    
    async findTierSchemas() {
        const tierFiles = [
            'tier-3/dot-file-specifications/DOT-FILE-ARCHITECTURE.md',
            'tier-3/dot-files/*.layer',
            'FinishThisIdea/docs/AUTO_DOCUMENTATION_GUIDE.md'
        ];
        
        const found = [];
        
        for (const pattern of tierFiles) {
            if (pattern.includes('*')) {
                // Handle wildcard patterns
                continue;
            }
            
            const fullPath = path.join(this.baseDir, pattern);
            if (await this.fileExists(fullPath)) {
                found.push({
                    name: path.basename(pattern, path.extname(pattern)),
                    path: fullPath,
                    type: 'tier_specification',
                    features: ['documentation', 'symlinks', 'git_integration']
                });
            }
        }
        
        return found;
    }
    
    async findCitationSchemas() {
        const citationFiles = [
            'FinishThisIdea/DOC-FRAMEWORK/soulfra-mvp/dist/billing/',
            'docs/*citation*',
            'docs/*billing*'
        ];
        
        const found = [];
        // Implementation for citation schema discovery
        return found;
    }
    
    registerSchema(category, schema) {
        const id = `${category}_${schema.name}_${Date.now()}`;
        
        this.schemas.set(id, {
            id,
            category,
            ...schema,
            registered: Date.now()
        });
        
        // Update category index
        if (!this.indexCache.has(category)) {
            this.indexCache.set(category, []);
        }
        this.indexCache.get(category).push(id);
    }
    
    getSchemasByCategory(category) {
        const ids = this.indexCache.get(category) || [];
        return ids.map(id => this.schemas.get(id)).filter(Boolean);
    }
    
    getSchema(id) {
        return this.schemas.get(id);
    }
    
    searchSchemas(query) {
        const results = [];
        
        for (const [id, schema] of this.schemas) {
            const searchable = [
                schema.name,
                schema.type,
                schema.category,
                ...(schema.features || [])
            ].join(' ').toLowerCase();
            
            if (searchable.includes(query.toLowerCase())) {
                results.push(schema);
            }
        }
        
        return results;
    }
    
    generateSchemaIndex() {
        const index = {
            summary: {
                totalSchemas: this.schemas.size,
                categories: this.categories.size,
                lastScan: new Date().toISOString()
            },
            categories: {},
            quickReference: {}
        };
        
        // Build category breakdown
        for (const [categoryName, categoryInfo] of this.categories) {
            const schemas = this.getSchemasByCategory(categoryName);
            index.categories[categoryName] = {
                ...categoryInfo,
                schemaCount: schemas.length,
                schemas: schemas.map(s => ({
                    name: s.name,
                    type: s.type,
                    path: s.path,
                    features: s.features
                }))
            };
        }
        
        // Build quick reference for common patterns
        index.quickReference = {
            'Red/Green Colors': 'bitmap_visual category - color specifications',
            'Newline Handling': 'bitmap_visual category - formatting specs',
            'Soulfra Auth': 'soulfra_auth category - 700+ components',
            'Solidity Contracts': 'cross_language category - smart contracts',
            'Dot Files': 'tier_documentation category - .tier3/.layer files',
            'Citations': 'citation_billing category - academic references'
        };
        
        return index;
    }
    
    exportSchemaRegistry(format = 'json') {
        const index = this.generateSchemaIndex();
        
        switch (format) {
            case 'json':
                return JSON.stringify(index, null, 2);
            case 'markdown':
                return this.generateMarkdownIndex(index);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    
    generateMarkdownIndex(index) {
        let md = '# Schema Registry Index\n\n';
        md += `Generated: ${index.summary.lastScan}\n`;
        md += `Total Schemas: ${index.summary.totalSchemas}\n\n`;
        
        for (const [categoryName, categoryData] of Object.entries(index.categories)) {
            md += `## ${categoryData.name}\n\n`;
            md += `${categoryData.description}\n\n`;
            md += `**Schemas Found:** ${categoryData.schemaCount}\n\n`;
            
            if (categoryData.schemas.length > 0) {
                md += '### Discovered Schemas\n\n';
                for (const schema of categoryData.schemas) {
                    md += `- **${schema.name}** (${schema.type})\n`;
                    md += `  - Path: \`${schema.path}\`\n`;
                    md += `  - Features: ${schema.features.join(', ')}\n\n`;
                }
            }
        }
        
        md += '## Quick Reference\n\n';
        for (const [key, value] of Object.entries(index.quickReference)) {
            md += `- **${key}**: ${value}\n`;
        }
        
        return md;
    }
    
    // Utility methods
    async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async getLastModified(filePath) {
        try {
            const stats = await fs.promises.stat(filePath);
            return stats.mtime;
        } catch {
            return null;
        }
    }
}

// CLI interface
if (require.main === module) {
    const registry = new SchemaRegistry();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'scan':
            console.log('🔍 Scanning for schemas...');
            registry.scanForSchemas().then(discovered => {
                console.log('\n📋 Discovery Results:');
                for (const [category, schemas] of Object.entries(discovered)) {
                    console.log(`  ${category}: ${schemas.length} schemas`);
                }
            });
            break;
            
        case 'index':
            registry.scanForSchemas().then(() => {
                const format = process.argv[3] || 'json';
                console.log(registry.exportSchemaRegistry(format));
            });
            break;
            
        case 'search':
            const query = process.argv[3];
            if (!query) {
                console.log('Usage: node schema-registry.js search <query>');
                process.exit(1);
            }
            
            registry.scanForSchemas().then(() => {
                const results = registry.searchSchemas(query);
                console.log(`Found ${results.length} schemas matching "${query}":`);
                results.forEach(schema => {
                    console.log(`  - ${schema.name} (${schema.category})`);
                });
            });
            break;
            
        default:
            console.log('Schema Registry - Organize and catalog existing schemas');
            console.log('');
            console.log('Commands:');
            console.log('  scan     - Scan for existing schemas');
            console.log('  index    - Generate schema index (json|markdown)');
            console.log('  search   - Search schemas by keyword');
            console.log('');
            console.log('Features:');
            console.log('  📊 Catalogs bitmap/visual formatting schemas');
            console.log('  🔐 Organizes 700+ Soulfra authentication components');
            console.log('  🔗 Maps cross-language integration bridges');
            console.log('  📚 Indexes tier-based documentation systems');
            console.log('  💰 Tracks citation and billing schemas');
    }
}

module.exports = { SchemaRegistry };