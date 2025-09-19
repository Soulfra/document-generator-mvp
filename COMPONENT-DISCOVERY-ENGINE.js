#!/usr/bin/env node

/**
 * 🔍 COMPONENT DISCOVERY ENGINE
 * 
 * Finds existing functionality before rebuilding
 * Maps menu systems, versioning, and dependencies
 * Provides intelligent suggestions for component reuse
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').promises;

class ComponentDiscoveryEngine {
    constructor() {
        this.discoveryPatterns = {
            // Menu systems
            menus: {
                patterns: ['*menu*.js', '*dashboard*.html', '*interface*.html'],
                keywords: ['menu', 'navigation', 'dashboard', 'interface'],
                examples: {
                    'dashboard.html': 'Main system dashboard',
                    'business-management-interface.html': 'Business operations UI'
                }
            },
            
            // Version management
            versioning: {
                patterns: ['*version*.js', '*backup*.js', '*restore*.js'],
                keywords: ['version', 'backup', 'restore', 'snapshot'],
                examples: {
                    'version-manager.js': 'Complete version control system',
                    'VERSION.json': 'Current version metadata'
                }
            },
            
            // SDK/API patterns
            sdks: {
                patterns: ['*sdk*.js', '*api*.js', '*client*.js'],
                keywords: ['sdk', 'api', 'client', 'adapter'],
                examples: {
                    'universal-api-adapter.js': 'Multi-protocol API support',
                    'agent-key-substrate-mapper.js': 'API key management'
                }
            },
            
            // Billing/Accounting
            billing: {
                patterns: ['*billing*.js', '*accounting*.js', '*stripe*.js'],
                keywords: ['billing', 'invoice', 'payment', 'stripe'],
                examples: {
                    'usage-billing-engine.js': 'Usage-based billing system',
                    'business-accounting-system.js': 'QuickBooks-style accounting'
                }
            },
            
            // Authentication
            auth: {
                patterns: ['*auth*.js', '*login*.js', '*session*.js'],
                keywords: ['auth', 'login', 'session', 'token'],
                examples: {
                    'auth-foundation-system.js': 'Complete auth system',
                    'auth-dashboard-system.js': 'Auth management UI'
                }
            },
            
            // Templates/Generation
            templates: {
                patterns: ['*template*.js', '*generate*.js', '*scaffold*.js'],
                keywords: ['template', 'generate', 'scaffold', 'create'],
                examples: {
                    'scripts/generate-ard.js': 'Architecture decision records',
                    'CLAUDE.*.md': 'AI instruction templates'
                }
            }
        };
        
        this.componentCache = new Map();
        this.dependencyGraph = new Map();
    }
    
    async discoverComponents(searchQuery) {
        console.log(`🔍 Searching for: "${searchQuery}"...`);
        
        const results = {
            exact: [],
            similar: [],
            related: [],
            suggestions: []
        };
        
        // Search by patterns
        for (const [category, config] of Object.entries(this.discoveryPatterns)) {
            if (this.matchesCategory(searchQuery, config)) {
                console.log(`\n📁 Checking ${category} components...`);
                
                for (const pattern of config.patterns) {
                    const files = await this.findFiles(pattern);
                    
                    for (const file of files) {
                        const analysis = await this.analyzeComponent(file);
                        
                        if (this.matchesQuery(searchQuery, analysis)) {
                            results.exact.push({
                                file,
                                category,
                                analysis,
                                confidence: this.calculateConfidence(searchQuery, analysis)
                            });
                        } else if (this.isSimilar(searchQuery, analysis)) {
                            results.similar.push({
                                file,
                                category,
                                analysis,
                                confidence: this.calculateConfidence(searchQuery, analysis)
                            });
                        }
                    }
                }
                
                // Add examples as suggestions
                Object.entries(config.examples).forEach(([file, desc]) => {
                    results.suggestions.push({
                        file,
                        category,
                        description: desc,
                        reason: `Known ${category} component`
                    });
                });
            }
        }
        
        // Find related components through dependencies
        for (const component of [...results.exact, ...results.similar]) {
            const deps = await this.findDependencies(component.file);
            results.related.push(...deps);
        }
        
        return this.rankResults(results);
    }
    
    matchesCategory(query, config) {
        const queryLower = query.toLowerCase();
        return config.keywords.some(keyword => queryLower.includes(keyword));
    }
    
    async findFiles(pattern) {
        try {
            const files = await glob(pattern, {
                ignore: ['node_modules/**', 'dist/**', '.git/**']
            });
            return files;
        } catch (error) {
            return [];
        }
    }
    
    async analyzeComponent(file) {
        if (this.componentCache.has(file)) {
            return this.componentCache.get(file);
        }
        
        try {
            const content = await fs.readFile(file, 'utf8');
            
            const analysis = {
                file,
                type: path.extname(file),
                size: content.length,
                
                // Extract features
                features: this.extractFeatures(content),
                
                // Extract exports
                exports: this.extractExports(content),
                
                // Extract dependencies
                dependencies: this.extractDependencies(content),
                
                // Extract API endpoints
                endpoints: this.extractEndpoints(content),
                
                // Extract ports
                ports: this.extractPorts(content),
                
                // Extract class/function names
                components: this.extractComponents(content),
                
                // Check if it's already an SDK/reusable component
                isReusable: this.checkReusability(content)
            };
            
            this.componentCache.set(file, analysis);
            return analysis;
            
        } catch (error) {
            return { file, error: error.message };
        }
    }
    
    extractFeatures(content) {
        const features = [];
        
        // Look for feature comments
        const featureComments = content.matchAll(/\/\/\s*Features?:\s*([^\n]+)/gi);
        for (const match of featureComments) {
            features.push(...match[1].split(',').map(f => f.trim()));
        }
        
        // Look for common feature patterns
        const patterns = {
            'authentication': /auth|login|session|token/i,
            'billing': /billing|invoice|payment|stripe/i,
            'database': /database|query|sql|mongo/i,
            'api': /api|endpoint|route|rest|graphql/i,
            'versioning': /version|backup|restore|snapshot/i
        };
        
        for (const [feature, pattern] of Object.entries(patterns)) {
            if (pattern.test(content)) {
                features.push(feature);
            }
        }
        
        return [...new Set(features)];
    }
    
    extractExports(content) {
        const exports = [];
        
        // module.exports
        const moduleExports = content.match(/module\.exports\s*=\s*(\w+)/);
        if (moduleExports) exports.push(moduleExports[1]);
        
        // exports.X
        const namedExports = content.matchAll(/exports\.(\w+)\s*=/g);
        for (const match of namedExports) {
            exports.push(match[1]);
        }
        
        // ES6 exports
        const es6Exports = content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
        for (const match of es6Exports) {
            exports.push(match[1]);
        }
        
        return exports;
    }
    
    extractDependencies(content) {
        const deps = [];
        
        // require statements
        const requires = content.matchAll(/require\(['"`]([^'"`]+)['"`]\)/g);
        for (const match of requires) {
            deps.push(match[1]);
        }
        
        // import statements
        const imports = content.matchAll(/import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g);
        for (const match of imports) {
            deps.push(match[1]);
        }
        
        return deps.filter(dep => !dep.startsWith('.'));
    }
    
    extractEndpoints(content) {
        const endpoints = [];
        
        // Express routes
        const routes = content.matchAll(/app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
        for (const match of routes) {
            endpoints.push({ method: match[1].toUpperCase(), path: match[2] });
        }
        
        // API path strings
        const apiPaths = content.matchAll(/['"`](\/api\/[^'"`]+)['"`]/g);
        for (const match of apiPaths) {
            endpoints.push({ path: match[1] });
        }
        
        return endpoints;
    }
    
    extractPorts(content) {
        const ports = [];
        
        // Port assignments
        const portMatches = content.matchAll(/(?:port|PORT)\s*[=:]\s*(\d{4,5})/g);
        for (const match of portMatches) {
            ports.push(parseInt(match[1]));
        }
        
        // Listen calls
        const listenMatches = content.matchAll(/listen\((\d{4,5})/g);
        for (const match of listenMatches) {
            ports.push(parseInt(match[1]));
        }
        
        return [...new Set(ports)];
    }
    
    extractComponents(content) {
        const components = [];
        
        // Classes
        const classes = content.matchAll(/class\s+(\w+)/g);
        for (const match of classes) {
            components.push({ type: 'class', name: match[1] });
        }
        
        // Functions
        const functions = content.matchAll(/function\s+(\w+)/g);
        for (const match of functions) {
            components.push({ type: 'function', name: match[1] });
        }
        
        // Arrow functions assigned to const
        const arrows = content.matchAll(/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
        for (const match of arrows) {
            components.push({ type: 'arrow', name: match[1] });
        }
        
        return components;
    }
    
    checkReusability(content) {
        // Check if it's already designed as a reusable component
        const reusablePatterns = [
            /module\.exports/,
            /export\s+default/,
            /class\s+\w+/,
            /SDK|Client|Service|Manager|Handler/i
        ];
        
        return reusablePatterns.some(pattern => pattern.test(content));
    }
    
    matchesQuery(query, analysis) {
        const queryLower = query.toLowerCase();
        
        // Check filename
        if (analysis.file.toLowerCase().includes(queryLower)) return true;
        
        // Check features
        if (analysis.features.some(f => f.toLowerCase().includes(queryLower))) return true;
        
        // Check exports
        if (analysis.exports.some(e => e.toLowerCase().includes(queryLower))) return true;
        
        // Check components
        if (analysis.components.some(c => c.name.toLowerCase().includes(queryLower))) return true;
        
        return false;
    }
    
    isSimilar(query, analysis) {
        // Use a simple similarity check
        const queryWords = query.toLowerCase().split(/\W+/);
        const analysisText = [
            analysis.file,
            ...analysis.features,
            ...analysis.exports,
            ...analysis.components.map(c => c.name)
        ].join(' ').toLowerCase();
        
        return queryWords.some(word => analysisText.includes(word));
    }
    
    calculateConfidence(query, analysis) {
        let score = 0;
        const queryLower = query.toLowerCase();
        
        // Exact filename match
        if (path.basename(analysis.file).toLowerCase() === queryLower) score += 50;
        
        // Partial filename match
        if (analysis.file.toLowerCase().includes(queryLower)) score += 30;
        
        // Feature match
        score += analysis.features.filter(f => f.toLowerCase().includes(queryLower)).length * 20;
        
        // Export match
        score += analysis.exports.filter(e => e.toLowerCase().includes(queryLower)).length * 15;
        
        // Reusability bonus
        if (analysis.isReusable) score += 10;
        
        return Math.min(100, score);
    }
    
    async findDependencies(file) {
        const deps = [];
        
        try {
            const analysis = await this.analyzeComponent(file);
            
            for (const dep of analysis.dependencies) {
                if (dep.startsWith('./') || dep.startsWith('../')) {
                    // Local dependency
                    const depPath = path.resolve(path.dirname(file), dep);
                    const depFile = await this.resolveFile(depPath);
                    
                    if (depFile) {
                        deps.push({
                            file: depFile,
                            type: 'dependency',
                            from: file
                        });
                    }
                }
            }
        } catch (error) {
            // Ignore errors
        }
        
        return deps;
    }
    
    async resolveFile(filePath) {
        // Try different extensions
        const extensions = ['', '.js', '.ts', '.json', '/index.js'];
        
        for (const ext of extensions) {
            try {
                const fullPath = filePath + ext;
                await fs.access(fullPath);
                return fullPath;
            } catch {
                // Try next extension
            }
        }
        
        return null;
    }
    
    rankResults(results) {
        // Sort by confidence
        results.exact.sort((a, b) => b.confidence - a.confidence);
        results.similar.sort((a, b) => b.confidence - a.confidence);
        
        // Remove duplicates from related
        const seen = new Set([
            ...results.exact.map(r => r.file),
            ...results.similar.map(r => r.file)
        ]);
        
        results.related = results.related.filter(r => !seen.has(r.file));
        
        return results;
    }
    
    async generateReuseReport(results) {
        const report = {
            summary: {
                exactMatches: results.exact.length,
                similarComponents: results.similar.length,
                relatedComponents: results.related.length,
                suggestions: results.suggestions.length
            },
            
            recommendations: [],
            
            reuseStrategy: null
        };
        
        // Generate recommendations
        if (results.exact.length > 0) {
            const best = results.exact[0];
            report.recommendations.push({
                action: 'REUSE',
                component: best.file,
                confidence: best.confidence,
                reason: 'Exact match found for your query'
            });
            
            report.reuseStrategy = `
// Import and reuse existing component
const ${path.basename(best.file, '.js')} = require('./${best.file}');

// Use the existing functionality
${this.generateUsageExample(best.analysis)}
`;
        } else if (results.similar.length > 0) {
            const similar = results.similar[0];
            report.recommendations.push({
                action: 'EXTEND',
                component: similar.file,
                confidence: similar.confidence,
                reason: 'Similar component can be extended'
            });
            
            report.reuseStrategy = `
// Extend existing component
const Base${path.basename(similar.file, '.js')} = require('./${similar.file}');

class Extended${path.basename(similar.file, '.js')} extends Base${path.basename(similar.file, '.js')} {
    // Add your specific functionality here
}
`;
        } else {
            report.recommendations.push({
                action: 'CREATE',
                reason: 'No existing components match your needs',
                suggestions: results.suggestions
            });
        }
        
        return report;
    }
    
    generateUsageExample(analysis) {
        if (analysis.exports.length > 0) {
            const mainExport = analysis.exports[0];
            
            if (analysis.components.some(c => c.type === 'class')) {
                return `const instance = new ${mainExport}();
// Use instance methods`;
            } else {
                return `const result = ${mainExport}();
// Process result`;
            }
        }
        
        return '// Use the component as needed';
    }
    
    async showDiscoveryReport(query) {
        const results = await this.discoverComponents(query);
        const report = await this.generateReuseReport(results);
        
        console.log('\n📊 COMPONENT DISCOVERY REPORT');
        console.log('=============================');
        console.log(`Query: "${query}"`);
        console.log(`\nSummary:`);
        console.log(`  Exact matches: ${report.summary.exactMatches}`);
        console.log(`  Similar components: ${report.summary.similarComponents}`);
        console.log(`  Related components: ${report.summary.relatedComponents}`);
        
        if (results.exact.length > 0) {
            console.log('\n✅ Exact Matches:');
            results.exact.slice(0, 5).forEach(r => {
                console.log(`\n  ${r.file} (${r.confidence}% confidence)`);
                console.log(`    Category: ${r.category}`);
                console.log(`    Features: ${r.analysis.features.join(', ')}`);
                if (r.analysis.ports.length > 0) {
                    console.log(`    Ports: ${r.analysis.ports.join(', ')}`);
                }
            });
        }
        
        if (results.similar.length > 0) {
            console.log('\n🔄 Similar Components:');
            results.similar.slice(0, 3).forEach(r => {
                console.log(`\n  ${r.file} (${r.confidence}% confidence)`);
                console.log(`    Could be extended for your use case`);
            });
        }
        
        console.log('\n💡 Recommendation:');
        report.recommendations.forEach(rec => {
            console.log(`  Action: ${rec.action}`);
            if (rec.component) console.log(`  Component: ${rec.component}`);
            console.log(`  Reason: ${rec.reason}`);
        });
        
        if (report.reuseStrategy) {
            console.log('\n📝 Reuse Strategy:');
            console.log(report.reuseStrategy);
        }
    }
}

// CLI Interface
if (require.main === module) {
    const engine = new ComponentDiscoveryEngine();
    
    const command = process.argv[2];
    const query = process.argv.slice(3).join(' ');
    
    switch (command) {
        case 'find':
            if (!query) {
                console.log('Usage: node COMPONENT-DISCOVERY-ENGINE.js find <query>');
                console.log('Example: node COMPONENT-DISCOVERY-ENGINE.js find billing system');
            } else {
                engine.showDiscoveryReport(query);
            }
            break;
            
        case 'categories':
            console.log('\n📚 Discovery Categories:');
            Object.entries(engine.discoveryPatterns).forEach(([cat, config]) => {
                console.log(`\n${cat}:`);
                console.log(`  Keywords: ${config.keywords.join(', ')}`);
                console.log(`  Examples:`);
                Object.entries(config.examples).forEach(([file, desc]) => {
                    console.log(`    - ${file}: ${desc}`);
                });
            });
            break;
            
        case 'analyze':
            if (!query) {
                console.log('Usage: node COMPONENT-DISCOVERY-ENGINE.js analyze <file>');
            } else {
                engine.analyzeComponent(query).then(analysis => {
                    console.log('\n📋 Component Analysis:');
                    console.log(JSON.stringify(analysis, null, 2));
                });
            }
            break;
            
        default:
            console.log('🔍 Component Discovery Engine');
            console.log('============================');
            console.log('Commands:');
            console.log('  find <query>     - Find existing components matching query');
            console.log('  categories       - Show all discovery categories');
            console.log('  analyze <file>   - Analyze a specific file');
            console.log('\nExamples:');
            console.log('  node COMPONENT-DISCOVERY-ENGINE.js find menu system');
            console.log('  node COMPONENT-DISCOVERY-ENGINE.js find billing');
            console.log('  node COMPONENT-DISCOVERY-ENGINE.js find authentication sdk');
    }
}

module.exports = ComponentDiscoveryEngine;