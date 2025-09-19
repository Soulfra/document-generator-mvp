#!/usr/bin/env node

/**
 * 🎯 EMOJI NAVIGATION SYSTEM 🎯
 * 
 * Maps all 167+ services to emoji categories with color-coded difficulty progression
 * Creates intuitive mobile-first navigation using emoji as universal language
 */

const fs = require('fs').promises;
const path = require('path');

class EmojiNavigationSystem {
    constructor(options = {}) {
        this.rootDir = options.rootDir || process.cwd();
        this.configPath = path.join(this.rootDir, 'emoji-navigation-config.json');
        
        // Core emoji categories mapping services by purpose
        this.emojiCategories = {
            '🎮': {
                name: 'Gaming & Interactive',
                description: 'Games, battles, and interactive experiences',
                color: '#FF6B6B',
                difficulty: 'Easy',
                services: [
                    'boss-battle-system.js',
                    'color-coded-education-system.js',
                    'chapter7-interactive-story-engine.js',
                    'interactive-questioning-system.js',
                    'shiprekt-mobile-pwa.html',
                    'mobile-gaming-wallet.js'
                ]
            },
            
            '🧠': {
                name: 'AI & Intelligence',
                description: 'AI services, LLM integration, and smart processing',
                color: '#4ECDC4',
                difficulty: 'Medium',
                services: [
                    'ai-reasoning-engine.js',
                    'llm-orchestration-service.js',
                    'file-categorization-ai.js',
                    'ai-error-debugger.js',
                    'personal-llm-usage-analyzer.js',
                    'cal-reasoning-engine.js'
                ]
            },
            
            '🔧': {
                name: 'System Tools',
                description: 'Infrastructure, plugins, and system management',
                color: '#45B7D1',
                difficulty: 'Hard',
                services: [
                    'dependency-singularity-engine.js',
                    'plugin-architecture-system.js',
                    'universal-brain.js',
                    'system-connector-stop-the-vortex.js',
                    'master-orchestrator.js',
                    'unified-orchestration-system.js'
                ]
            },
            
            '🛡️': {
                name: 'Security & Defense',
                description: 'Security scanning, protection, and monitoring',
                color: '#96CEB4',
                difficulty: 'Expert',
                services: [
                    'clarity-defense-system.js',
                    'security-scanner.js',
                    'auth-middleware-unified.js',
                    'token-verification-service.js',
                    'biometric-guardian-matrix-system.js'
                ]
            },
            
            '💰': {
                name: 'Finance & Economy',
                description: 'Crypto, trading, billing, and economic systems',
                color: '#FCEA2B',
                difficulty: 'Medium',
                services: [
                    'crypto-exchange-integrations.js',
                    'billing-integration.js',
                    'agent-economy-forum.js',
                    'stripe-integration.js',
                    'wallet-management.js'
                ]
            },
            
            '📊': {
                name: 'Analytics & Data',
                description: 'Analytics, reporting, and data processing',
                color: '#FF8A95',
                difficulty: 'Medium',
                services: [
                    'analytics-service.js',
                    'data-visualization.js',
                    'business-intelligence.js',
                    'usage-tracking.js',
                    'performance-monitor.js'
                ]
            },
            
            '🌐': {
                name: 'Web & Network',
                description: 'Web services, APIs, and network communication',
                color: '#B8860B',
                difficulty: 'Easy',
                services: [
                    'web-interface.js',
                    'api-gateway.js',
                    'websocket-server.js',
                    'http-server.js',
                    'network-manager.js'
                ]
            },
            
            '📱': {
                name: 'Mobile & PWA',
                description: 'Mobile apps, PWAs, and device integration',
                color: '#DDA0DD',
                difficulty: 'Medium',
                services: [
                    'mobile-app-unified-container.js',
                    'pwa-service-worker.js',
                    'mobile-optimization.js',
                    'device-integration.js'
                ]
            },
            
            '🎨': {
                name: 'UI & Design',
                description: 'User interfaces, theming, and visual components',
                color: '#20B2AA',
                difficulty: 'Easy',
                services: [
                    'ui-component-library.js',
                    'theme-system.js',
                    'color-system.js',
                    'design-tokens.js'
                ]
            },
            
            '📚': {
                name: 'Documentation',
                description: 'Documentation, guides, and knowledge management',
                color: '#CD853F',
                difficulty: 'Easy',
                services: [
                    'master-documentation-orchestrator.js',
                    'api-documentation.js',
                    'guide-generator.js',
                    'knowledge-base.js'
                ]
            },
            
            '🔍': {
                name: 'Search & Discovery',
                description: 'Search engines, discovery, and content finding',
                color: '#4169E1',
                difficulty: 'Medium',
                services: [
                    'search-service.js',
                    'content-discovery.js',
                    'semantic-search.js',
                    'recommendation-engine.js'
                ]
            },
            
            '⚡': {
                name: 'Performance',
                description: 'Optimization, caching, and performance tuning',
                color: '#FFD700',
                difficulty: 'Hard',
                services: [
                    'performance-optimizer.js',
                    'cache-manager.js',
                    'load-balancer.js',
                    'optimization-service.js'
                ]
            }
        };
        
        // Difficulty progression colors
        this.difficultyColors = {
            'Easy': '#6BCF7F',
            'Medium': '#FFD93D',
            'Hard': '#FF8A95',
            'Expert': '#B8860B'
        };
        
        // Service registry for mapping files to services
        this.serviceRegistry = new Map();
        this.reverseEmojiMap = new Map(); // Service -> Emoji
        
        console.log('🎯 Emoji Navigation System initializing...');
    }
    
    async initialize() {
        console.log('\n📂 Scanning services and building emoji map...');
        
        // Scan for all service files
        await this.scanServices();
        
        // Build reverse mapping
        this.buildReverseMappings();
        
        // Auto-categorize uncategorized services
        await this.autoCategorizeServices();
        
        // Save configuration
        await this.saveConfiguration();
        
        console.log('✅ Emoji navigation ready!');
    }
    
    async scanServices() {
        const serviceFiles = await this.findServiceFiles(this.rootDir);
        console.log(`   Found ${serviceFiles.length} service files`);
        
        for (const file of serviceFiles) {
            await this.analyzeService(file);
        }
        
        console.log(`   Analyzed ${this.serviceRegistry.size} services`);
    }
    
    async findServiceFiles(dir) {
        const serviceFiles = [];
        const extensions = ['.js', '.ts', '.py', '.html'];
        
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                // Skip common exclusions
                if (this.shouldSkipDirectory(item)) continue;
                
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    const subFiles = await this.findServiceFiles(fullPath);
                    serviceFiles.push(...subFiles);
                } else if (extensions.some(ext => item.endsWith(ext))) {
                    // Check if it's a service file
                    if (this.isServiceFile(item)) {
                        serviceFiles.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return serviceFiles;
    }
    
    shouldSkipDirectory(name) {
        const skipPatterns = [
            'node_modules', '.git', 'dist', 'build', '.cache', 
            'backup', 'archive', 'temp', '.next'
        ];
        return skipPatterns.some(pattern => name.includes(pattern));
    }
    
    isServiceFile(filename) {
        const serviceIndicators = [
            'service', 'server', 'api', 'engine', 'system', 'manager',
            'orchestrator', 'controller', 'handler', 'processor', 'gateway',
            'bridge', 'connector', 'integration', 'middleware', 'daemon',
            'worker', 'scheduler', 'monitor', 'analyzer', 'generator',
            'optimizer', 'builder', 'scanner', 'validator', 'authenticator'
        ];
        
        const nameLower = filename.toLowerCase();
        return serviceIndicators.some(indicator => nameLower.includes(indicator));
    }
    
    async analyzeService(filePath) {
        const relativePath = path.relative(this.rootDir, filePath);
        const filename = path.basename(filePath);
        const name = this.extractServiceName(filename);
        
        try {
            // Read file content for analysis
            const content = await fs.readFile(filePath, 'utf-8');
            
            const serviceInfo = {
                id: this.generateServiceId(name),
                name: name,
                filename: filename,
                path: relativePath,
                category: this.categorizeService(filename, content),
                description: this.extractDescription(content),
                complexity: this.analyzeComplexity(content),
                dependencies: this.extractDependencies(content),
                ports: this.extractPorts(content),
                isActive: this.checkIfActive(content),
                emoji: null, // Will be set during categorization
                color: null  // Will be set during categorization
            };
            
            this.serviceRegistry.set(serviceInfo.id, serviceInfo);
            
        } catch (error) {
            // Skip files we can't read
        }
    }
    
    extractServiceName(filename) {
        return filename
            .replace(/\.(js|ts|py|html)$/, '')
            .replace(/-/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    generateServiceId(name) {
        return name.toLowerCase().replace(/\s+/g, '-');
    }
    
    categorizeService(filename, content) {
        const nameLower = filename.toLowerCase();
        const contentLower = content.toLowerCase();
        
        // Gaming & Interactive
        if (this.matches(nameLower, ['game', 'battle', 'interactive', 'story', 'quest', 'color', 'education'])) {
            return '🎮';
        }
        
        // AI & Intelligence
        if (this.matches(nameLower + contentLower, ['ai', 'llm', 'reasoning', 'intelligence', 'machine', 'learning', 'neural'])) {
            return '🧠';
        }
        
        // System Tools
        if (this.matches(nameLower, ['system', 'orchestrator', 'engine', 'manager', 'tool', 'dependency', 'plugin', 'universal'])) {
            return '🔧';
        }
        
        // Security & Defense
        if (this.matches(nameLower + contentLower, ['security', 'auth', 'token', 'defense', 'scanner', 'guardian', 'protect'])) {
            return '🛡️';
        }
        
        // Finance & Economy
        if (this.matches(nameLower + contentLower, ['crypto', 'wallet', 'payment', 'billing', 'economy', 'trading', 'finance'])) {
            return '💰';
        }
        
        // Analytics & Data
        if (this.matches(nameLower + contentLower, ['analytics', 'data', 'monitor', 'track', 'report', 'metric', 'visualization'])) {
            return '📊';
        }
        
        // Web & Network
        if (this.matches(nameLower + contentLower, ['web', 'http', 'api', 'server', 'network', 'endpoint', 'route'])) {
            return '🌐';
        }
        
        // Mobile & PWA
        if (this.matches(nameLower + contentLower, ['mobile', 'pwa', 'device', 'touch', 'gesture', 'responsive'])) {
            return '📱';
        }
        
        // UI & Design
        if (this.matches(nameLower + contentLower, ['ui', 'component', 'theme', 'design', 'visual', 'interface', 'color'])) {
            return '🎨';
        }
        
        // Documentation
        if (this.matches(nameLower, ['doc', 'guide', 'manual', 'readme', 'knowledge', 'help'])) {
            return '📚';
        }
        
        // Search & Discovery
        if (this.matches(nameLower + contentLower, ['search', 'discovery', 'find', 'index', 'recommendation'])) {
            return '🔍';
        }
        
        // Performance
        if (this.matches(nameLower + contentLower, ['performance', 'optimize', 'cache', 'speed', 'load', 'balance'])) {
            return '⚡';
        }
        
        // Default to system tools
        return '🔧';
    }
    
    matches(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    extractDescription(content) {
        // Try to find description in comments
        const commentPatterns = [
            /\/\*\*?\s*\n?\s*\*?\s*(.+)/,
            /\/\/\s*(.+)/,
            /#\s*(.+)/,
            /\*\s*(.+)/
        ];
        
        for (const pattern of commentPatterns) {
            const match = content.match(pattern);
            if (match && match[1] && match[1].length > 10) {
                return match[1].trim().replace(/[*\/]/g, '').trim();
            }
        }
        
        // Extract from class names or function names
        const classMatch = content.match(/class\s+(\w+)/);
        if (classMatch) {
            return `${classMatch[1]} service implementation`;
        }
        
        return 'Service implementation';
    }
    
    analyzeComplexity(content) {
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>|def\s/g) || []).length;
        const classes = (content.match(/class\s/g) || []).length;
        const imports = (content.match(/import|require|from/g) || []).length;
        
        const complexityScore = lines + functions * 2 + classes * 3 + imports;
        
        if (complexityScore < 100) return 'Simple';
        if (complexityScore < 500) return 'Medium';
        if (complexityScore < 1000) return 'Complex';
        return 'Expert';
    }
    
    extractDependencies(content) {
        const dependencies = [];
        
        // ES6 imports
        const es6Imports = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
        dependencies.push(...es6Imports.map(i => i.match(/['"]([^'"]+)['"]/)[1]));
        
        // CommonJS requires
        const requires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
        dependencies.push(...requires.map(r => r.match(/['"]([^'"]+)['"]/)[1]));
        
        return [...new Set(dependencies)].slice(0, 10); // Limit to 10 most important
    }
    
    extractPorts(content) {
        const portMatches = content.match(/(?:port|PORT)\s*[:=]\s*(\d+)/g) || [];
        return portMatches.map(m => parseInt(m.match(/\d+/)[0]));
    }
    
    checkIfActive(content) {
        // Check for server startup patterns
        const activePatterns = [
            /listen\s*\(/,
            /createServer/,
            /app\.listen/,
            /server\.start/,
            /\.on\('connection'/
        ];
        
        return activePatterns.some(pattern => pattern.test(content));
    }
    
    buildReverseMappings() {
        // Map each service to its emoji category
        for (const [serviceId, service] of this.serviceRegistry) {
            this.reverseEmojiMap.set(serviceId, service.category);
            
            // Update service with emoji category info
            if (this.emojiCategories[service.category]) {
                service.emoji = service.category;
                service.color = this.emojiCategories[service.category].color;
                service.difficulty = this.emojiCategories[service.category].difficulty;
                
                // Add to category's services list if not already there
                const category = this.emojiCategories[service.category];
                if (!category.services.includes(service.filename)) {
                    category.services.push(service.filename);
                }
            }
        }
    }
    
    async autoCategorizeServices() {
        console.log('\n🤖 Auto-categorizing services by AI analysis...');
        
        const uncategorized = Array.from(this.serviceRegistry.values())
            .filter(service => !service.emoji);
        
        if (uncategorized.length > 0) {
            console.log(`   Found ${uncategorized.length} uncategorized services`);
            
            for (const service of uncategorized) {
                // Use simple heuristics for auto-categorization
                service.category = this.categorizeService(service.filename, service.description);
                service.emoji = service.category;
                
                if (this.emojiCategories[service.category]) {
                    service.color = this.emojiCategories[service.category].color;
                    service.difficulty = this.emojiCategories[service.category].difficulty;
                }
            }
        }
    }
    
    async saveConfiguration() {
        const config = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            totalServices: this.serviceRegistry.size,
            categories: this.emojiCategories,
            services: Object.fromEntries(this.serviceRegistry),
            statistics: this.generateStatistics()
        };
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
        console.log(`   Configuration saved to ${this.configPath}`);
    }
    
    generateStatistics() {
        const stats = {
            byCategory: {},
            byDifficulty: {},
            byComplexity: {},
            totalActive: 0
        };
        
        for (const service of this.serviceRegistry.values()) {
            // By category
            const emoji = service.emoji || '🔧';
            stats.byCategory[emoji] = (stats.byCategory[emoji] || 0) + 1;
            
            // By difficulty
            const difficulty = service.difficulty || 'Medium';
            stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
            
            // By complexity
            const complexity = service.complexity || 'Medium';
            stats.byComplexity[complexity] = (stats.byComplexity[complexity] || 0) + 1;
            
            // Active services
            if (service.isActive) {
                stats.totalActive++;
            }
        }
        
        return stats;
    }
    
    // API methods for mobile app integration
    getEmojiCategories() {
        return this.emojiCategories;
    }
    
    getServicesByEmoji(emoji) {
        return Array.from(this.serviceRegistry.values())
            .filter(service => service.emoji === emoji);
    }
    
    searchServices(query) {
        const queryLower = query.toLowerCase();
        return Array.from(this.serviceRegistry.values())
            .filter(service => 
                service.name.toLowerCase().includes(queryLower) ||
                service.description.toLowerCase().includes(queryLower) ||
                service.filename.toLowerCase().includes(queryLower)
            )
            .sort((a, b) => {
                // Sort by relevance
                const aScore = this.calculateRelevanceScore(a, queryLower);
                const bScore = this.calculateRelevanceScore(b, queryLower);
                return bScore - aScore;
            });
    }
    
    calculateRelevanceScore(service, query) {
        let score = 0;
        
        // Exact name match gets highest score
        if (service.name.toLowerCase() === query) score += 10;
        
        // Name contains query
        if (service.name.toLowerCase().includes(query)) score += 5;
        
        // Description contains query
        if (service.description.toLowerCase().includes(query)) score += 3;
        
        // Filename contains query
        if (service.filename.toLowerCase().includes(query)) score += 2;
        
        // Active services get bonus
        if (service.isActive) score += 1;
        
        return score;
    }
    
    getServiceRecommendations(userProfile) {
        const { level, favoriteColor, completedQuests } = userProfile;
        const recommendations = [];
        
        // Recommend based on user level
        const appropriateServices = Array.from(this.serviceRegistry.values())
            .filter(service => {
                const difficulty = service.difficulty || 'Medium';
                switch (difficulty) {
                    case 'Easy': return level >= 0;
                    case 'Medium': return level >= 2;
                    case 'Hard': return level >= 5;
                    case 'Expert': return level >= 8;
                    default: return true;
                }
            });
        
        // Get 3 recommendations from different categories
        const categories = [...new Set(appropriateServices.map(s => s.emoji))];
        
        for (const category of categories.slice(0, 3)) {
            const categoryServices = appropriateServices.filter(s => s.emoji === category);
            if (categoryServices.length > 0) {
                const recommended = categoryServices[Math.floor(Math.random() * categoryServices.length)];
                recommendations.push({
                    ...recommended,
                    reason: `Perfect for Level ${level} users`
                });
            }
        }
        
        return recommendations;
    }
    
    generateMobileNavigationJSON() {
        return {
            categories: Object.entries(this.emojiCategories).map(([emoji, category]) => ({
                emoji,
                name: category.name,
                description: category.description,
                color: category.color,
                difficulty: category.difficulty,
                serviceCount: this.getServicesByEmoji(emoji).length
            })),
            totalServices: this.serviceRegistry.size,
            difficultyColors: this.difficultyColors
        };
    }
}

// Export for use as module
module.exports = EmojiNavigationSystem;

// CLI interface
if (require.main === module) {
    const emojiNav = new EmojiNavigationSystem();
    
    console.log('🎯 EMOJI NAVIGATION SYSTEM');
    console.log('=========================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await emojiNav.initialize();
        
        switch (command) {
            case 'categories':
                console.log('\n📱 Emoji Categories:\n');
                Object.entries(emojiNav.emojiCategories).forEach(([emoji, category]) => {
                    console.log(`${emoji} ${category.name}`);
                    console.log(`   ${category.description}`);
                    console.log(`   Difficulty: ${category.difficulty} | Color: ${category.color}`);
                    console.log(`   Services: ${emojiNav.getServicesByEmoji(emoji).length}`);
                    console.log();
                });
                break;
                
            case 'search':
                if (args[0]) {
                    const results = emojiNav.searchServices(args[0]);
                    console.log(`\n🔍 Search results for "${args[0]}":\n`);
                    
                    results.slice(0, 10).forEach((service, index) => {
                        console.log(`${index + 1}. ${service.emoji} ${service.name}`);
                        console.log(`   ${service.description}`);
                        console.log(`   File: ${service.filename} | Difficulty: ${service.difficulty}`);
                        console.log();
                    });
                    
                    if (results.length === 0) {
                        console.log('No services found matching your query.');
                    }
                } else {
                    console.log('Usage: node emoji-navigation-system.js search <query>');
                }
                break;
                
            case 'services':
                if (args[0]) {
                    const services = emojiNav.getServicesByEmoji(args[0]);
                    console.log(`\n${args[0]} Services (${services.length}):\n`);
                    
                    services.forEach(service => {
                        console.log(`• ${service.name}`);
                        console.log(`  ${service.description}`);
                        console.log(`  File: ${service.filename}`);
                        if (service.ports.length > 0) {
                            console.log(`  Ports: ${service.ports.join(', ')}`);
                        }
                        console.log();
                    });
                } else {
                    console.log('Usage: node emoji-navigation-system.js services <emoji>');
                    console.log('Available emojis:', Object.keys(emojiNav.emojiCategories).join(' '));
                }
                break;
                
            case 'stats':
                const config = JSON.parse(await fs.readFile(emojiNav.configPath, 'utf-8'));
                console.log('\n📊 Navigation Statistics:\n');
                console.log(`Total Services: ${config.totalServices}`);
                console.log(`Categories: ${Object.keys(config.categories).length}`);
                console.log();
                
                console.log('Services by Category:');
                Object.entries(config.statistics.byCategory).forEach(([emoji, count]) => {
                    const category = config.categories[emoji];
                    console.log(`  ${emoji} ${category.name}: ${count}`);
                });
                
                console.log('\nServices by Difficulty:');
                Object.entries(config.statistics.byDifficulty).forEach(([difficulty, count]) => {
                    console.log(`  ${difficulty}: ${count}`);
                });
                break;
                
            default:
                console.log('Available commands:');
                console.log('  categories    - Show all emoji categories');
                console.log('  search <term> - Search services by name/description');
                console.log('  services <emoji> - Show services in category');
                console.log('  stats         - Show navigation statistics');
                console.log();
                console.log('Example: node emoji-navigation-system.js search "game"');
        }
    }
    
    run().catch(console.error);
}