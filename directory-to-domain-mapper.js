#!/usr/bin/env node

/**
 * 📁 DIRECTORY TO DOMAIN MAPPER
 * 
 * Maps file system directories to game world domains
 * Automatically generates educational worlds from project structures
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class DirectoryToDomainMapper extends EventEmitter {
    constructor(portRegistry, entityRegistry) {
        super();
        
        this.portRegistry = portRegistry;
        this.entityRegistry = entityRegistry;
        this.mapperId = `DIRDOMAIN-${Date.now()}`;
        
        // Domain mapping configuration
        this.domainConfig = {
            // Top-level directory mappings
            topLevelDomains: {
                'src': 'source.world',
                'lib': 'library.world',
                'test': 'testing.world',
                'docs': 'documentation.world',
                'api': 'api.world',
                'services': 'services.world',
                'components': 'components.world',
                'models': 'models.world',
                'controllers': 'controllers.world',
                'views': 'views.world',
                'public': 'public.world',
                'config': 'configuration.world',
                'scripts': 'automation.world',
                'build': 'build.world',
                'dist': 'distribution.world'
            },
            
            // File extension hierarchy (from high-level to low-level)
            extensionHierarchy: [
                { level: 1, extensions: ['.md', '.txt', '.doc'], type: 'documentation' },
                { level: 2, extensions: ['.java', '.cs', '.py'], type: 'high-level' },
                { level: 3, extensions: ['.mjs', '.tsx', '.ts'], type: 'modern-js' },
                { level: 4, extensions: ['.js', '.php', '.rb'], type: 'scripting' },
                { level: 5, extensions: ['.cpp', '.c', '.h'], type: 'systems' },
                { level: 6, extensions: ['.wasm', '.asm', '.s'], type: 'assembly' }
            ],
            
            // Educational content mapping
            educationalTopics: {
                'auth': 'Authentication & Security',
                'database': 'Database Design & Management',
                'api': 'API Design & REST Principles',
                'test': 'Testing & Quality Assurance',
                'deploy': 'Deployment & DevOps',
                'ui': 'User Interface Design',
                'algorithm': 'Algorithms & Data Structures',
                'crypto': 'Cryptography & Security',
                'network': 'Networking & Protocols',
                'performance': 'Performance Optimization'
            }
        };
        
        // Mapping statistics
        this.stats = {
            directoriesScanned: 0,
            filesProcessed: 0,
            domainsGenerated: 0,
            educationalContentCreated: 0,
            portAllocations: new Map()
        };
        
        // Domain cache
        this.domainCache = new Map();
        this.worldGenerationQueue = [];
    }
    
    /**
     * Map directory to domain and generate world
     */
    async mapDirectoryToDomain(directoryPath, options = {}) {
        console.log(`📁 Mapping directory to domain: ${directoryPath}`);
        
        try {
            // Analyze directory structure
            const analysis = await this.analyzeDirectory(directoryPath);
            
            // Generate domain name
            const domainName = this.generateDomainName(directoryPath, analysis);
            
            // Allocate port
            const port = await this.allocatePort(domainName, analysis.complexity);
            
            // Create world specification
            const worldSpec = await this.createWorldSpecification(
                directoryPath,
                domainName,
                port,
                analysis
            );
            
            // Register world with port registry
            const world = await this.registerWorld(worldSpec);
            
            // Generate educational content
            const content = await this.generateEducationalContent(analysis);
            
            // Store mapping
            this.domainCache.set(directoryPath, {
                domain: domainName,
                port: port,
                worldId: world.id,
                analysis: analysis,
                content: content,
                generated: Date.now()
            });
            
            console.log(`✅ Mapped to domain: ${domainName} (Port ${port})`);
            
            this.emit('domain:mapped', {
                directory: directoryPath,
                domain: domainName,
                port: port,
                world: world
            });
            
            return {
                domain: domainName,
                port: port,
                world: world,
                content: content
            };
            
        } catch (error) {
            console.error('Error mapping directory:', error);
            throw error;
        }
    }
    
    /**
     * Analyze directory structure
     */
    async analyzeDirectory(directoryPath, depth = 0, maxDepth = 5) {
        const analysis = {
            path: directoryPath,
            name: path.basename(directoryPath),
            files: [],
            subdirectories: [],
            technologies: new Set(),
            patterns: new Set(),
            complexity: 0,
            educationalValue: 0,
            fileTypes: new Map()
        };
        
        if (depth > maxDepth) return analysis;
        
        try {
            const items = await fs.readdir(directoryPath);
            
            for (const item of items) {
                const itemPath = path.join(directoryPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory() && !this.shouldIgnoreDirectory(item)) {
                    analysis.subdirectories.push(item);
                    
                    // Recursive analysis
                    const subAnalysis = await this.analyzeDirectory(
                        itemPath,
                        depth + 1,
                        maxDepth
                    );
                    
                    // Merge findings
                    subAnalysis.technologies.forEach(tech => analysis.technologies.add(tech));
                    subAnalysis.patterns.forEach(pattern => analysis.patterns.add(pattern));
                    analysis.complexity += subAnalysis.complexity * 0.5;
                    
                } else if (stats.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    analysis.files.push({
                        name: item,
                        extension: ext,
                        size: stats.size
                    });
                    
                    // Track file types
                    analysis.fileTypes.set(
                        ext,
                        (analysis.fileTypes.get(ext) || 0) + 1
                    );
                    
                    // Detect technologies
                    this.detectTechnology(item, analysis.technologies);
                    
                    // Detect patterns
                    this.detectPatterns(item, analysis.patterns);
                }
            }
            
            // Calculate complexity
            analysis.complexity = this.calculateComplexity(analysis);
            
            // Calculate educational value
            analysis.educationalValue = this.calculateEducationalValue(analysis);
            
            // Update statistics
            this.stats.directoriesScanned++;
            this.stats.filesProcessed += analysis.files.length;
            
        } catch (error) {
            console.error(`Error analyzing directory ${directoryPath}:`, error);
        }
        
        return analysis;
    }
    
    /**
     * Generate domain name from directory
     */
    generateDomainName(directoryPath, analysis) {
        const baseName = path.basename(directoryPath).toLowerCase();
        
        // Check for top-level domain mapping
        if (this.domainConfig.topLevelDomains[baseName]) {
            return this.domainConfig.topLevelDomains[baseName];
        }
        
        // Generate based on content
        const primaryTech = Array.from(analysis.technologies)[0] || 'general';
        const category = this.categorizeDirectory(analysis);
        
        // Create domain name
        const domainParts = [];
        
        if (category) domainParts.push(category);
        domainParts.push(baseName.replace(/[^a-z0-9]/g, '-'));
        domainParts.push('world');
        
        return domainParts.join('.');
    }
    
    /**
     * Allocate port for domain
     */
    async allocatePort(domainName, complexity) {
        // Determine port range based on complexity
        let portRange;
        if (complexity < 3) {
            portRange = [1000, 1999]; // Foundation
        } else if (complexity < 6) {
            portRange = [2000, 2999]; // Intermediate
        } else if (complexity < 8) {
            portRange = [3000, 3999]; // Advanced
        } else {
            portRange = [4000, 4999]; // Expert
        }
        
        // Find available port
        for (let port = portRange[0]; port <= portRange[1]; port++) {
            if (!this.stats.portAllocations.has(port)) {
                this.stats.portAllocations.set(port, domainName);
                return port;
            }
        }
        
        // Fallback to dynamic range
        return 5000 + Math.floor(Math.random() * 1000);
    }
    
    /**
     * Create world specification
     */
    async createWorldSpecification(directoryPath, domainName, port, analysis) {
        const worldSpec = {
            id: `WORLD-${crypto.randomBytes(8).toString('hex')}`,
            port: port,
            domain: domainName,
            name: this.generateWorldName(directoryPath, analysis),
            description: this.generateWorldDescription(analysis),
            
            // Educational content
            topic: this.determineEducationalTopic(analysis),
            skills: this.extractSkills(analysis),
            difficulty: Math.floor(analysis.complexity),
            
            // World properties
            type: this.categorizeDirectory(analysis),
            technologies: Array.from(analysis.technologies),
            patterns: Array.from(analysis.patterns),
            
            // Game mechanics
            challenges: this.generateChallenges(analysis),
            rewards: this.calculateRewards(analysis),
            hiddenOpportunities: Math.floor(analysis.educationalValue / 2),
            
            // Visual theme
            theme: this.generateTheme(analysis),
            
            // Source mapping
            sourceDirectory: directoryPath,
            fileCount: analysis.files.length,
            subdirectoryCount: analysis.subdirectories.length,
            
            // Metadata
            generated: Date.now(),
            generator: this.mapperId
        };
        
        return worldSpec;
    }
    
    /**
     * Register world with port registry
     */
    async registerWorld(worldSpec) {
        if (this.portRegistry && this.portRegistry.registerWorld) {
            return await this.portRegistry.registerWorld(worldSpec.port, worldSpec);
        }
        
        // Fallback registration
        this.stats.domainsGenerated++;
        
        // Register with entity registry if available
        if (this.entityRegistry) {
            const worldEntity = this.entityRegistry.registerEntity('world', worldSpec.id, {
                name: worldSpec.name,
                description: worldSpec.description,
                tags: [...worldSpec.technologies, worldSpec.type],
                properties: {
                    port: worldSpec.port,
                    domain: worldSpec.domain,
                    difficulty: worldSpec.difficulty
                }
            });
            
            worldSpec.universalId = worldEntity.universalId;
        }
        
        return worldSpec;
    }
    
    /**
     * Generate educational content from analysis
     */
    async generateEducationalContent(analysis) {
        const content = {
            lessons: [],
            challenges: [],
            resources: [],
            mvpTemplates: []
        };
        
        // Generate lessons based on file types
        for (const [ext, count] of analysis.fileTypes) {
            const level = this.getExtensionLevel(ext);
            if (level) {
                content.lessons.push({
                    id: `LESSON-${ext.substring(1)}-${Date.now()}`,
                    title: `Working with ${ext} files`,
                    description: `Learn about ${level.type} development with ${ext} files`,
                    difficulty: level.level,
                    xpReward: level.level * 100,
                    content: this.generateLessonContent(ext, level.type)
                });
            }
        }
        
        // Generate challenges based on patterns
        for (const pattern of analysis.patterns) {
            content.challenges.push({
                id: `CHALLENGE-${pattern}-${Date.now()}`,
                title: `Master the ${pattern} pattern`,
                description: `Implement and understand the ${pattern} design pattern`,
                difficulty: analysis.complexity,
                xpReward: Math.floor(analysis.complexity * 150),
                type: 'implementation'
            });
        }
        
        // Generate MVP templates based on structure
        if (analysis.technologies.size > 2) {
            content.mvpTemplates.push({
                id: `MVP-${analysis.name}-${Date.now()}`,
                name: `${analysis.name} Clone`,
                description: `Build a simplified version of ${analysis.name}`,
                technologies: Array.from(analysis.technologies),
                estimatedTime: Math.ceil(analysis.complexity * 2) + ' hours',
                difficulty: analysis.complexity
            });
        }
        
        // Add resources
        content.resources = this.generateResources(analysis);
        
        this.stats.educationalContentCreated += 
            content.lessons.length + 
            content.challenges.length + 
            content.mvpTemplates.length;
        
        return content;
    }
    
    /**
     * Batch process directory tree
     */
    async mapDirectoryTree(rootPath, options = {}) {
        console.log(`🌳 Mapping entire directory tree: ${rootPath}`);
        
        const results = [];
        const queue = [rootPath];
        const processed = new Set();
        
        while (queue.length > 0) {
            const currentPath = queue.shift();
            
            if (processed.has(currentPath)) continue;
            processed.add(currentPath);
            
            try {
                // Map current directory
                const mapping = await this.mapDirectoryToDomain(currentPath, options);
                results.push(mapping);
                
                // Add subdirectories to queue
                const items = await fs.readdir(currentPath);
                for (const item of items) {
                    const itemPath = path.join(currentPath, item);
                    const stats = await fs.stat(itemPath);
                    
                    if (stats.isDirectory() && !this.shouldIgnoreDirectory(item)) {
                        queue.push(itemPath);
                    }
                }
                
                // Rate limiting
                if (options.rateLimit) {
                    await new Promise(resolve => setTimeout(resolve, options.rateLimit));
                }
                
            } catch (error) {
                console.error(`Error processing ${currentPath}:`, error);
            }
        }
        
        console.log(`✅ Mapped ${results.length} directories to domains`);
        
        return results;
    }
    
    /**
     * Generate interactive world map
     */
    generateWorldMap() {
        const map = {
            domains: Array.from(this.domainCache.values()),
            connections: this.findConnections(),
            statistics: this.getStatistics(),
            generated: Date.now()
        };
        
        return map;
    }
    
    /**
     * Helper methods
     */
    
    shouldIgnoreDirectory(name) {
        const ignorePatterns = [
            'node_modules', '.git', '.vscode', '.idea',
            'dist', 'build', 'coverage', '__pycache__',
            '.cache', '.temp', '.tmp'
        ];
        return ignorePatterns.includes(name);
    }
    
    detectTechnology(filename, technologies) {
        const techMap = {
            'package.json': 'nodejs',
            'pom.xml': 'java',
            'requirements.txt': 'python',
            'Gemfile': 'ruby',
            'composer.json': 'php',
            'Cargo.toml': 'rust',
            'go.mod': 'golang',
            '.csproj': 'csharp',
            'CMakeLists.txt': 'cpp'
        };
        
        if (techMap[filename]) {
            technologies.add(techMap[filename]);
        }
        
        // Extension-based detection
        const ext = path.extname(filename).toLowerCase();
        const extTechMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.rb': 'ruby',
            '.php': 'php',
            '.rs': 'rust',
            '.go': 'golang',
            '.cs': 'csharp'
        };
        
        if (extTechMap[ext]) {
            technologies.add(extTechMap[ext]);
        }
    }
    
    detectPatterns(filename, patterns) {
        const patternMap = {
            'controller': 'mvc',
            'model': 'mvc',
            'view': 'mvc',
            'service': 'service-layer',
            'repository': 'repository',
            'factory': 'factory',
            'observer': 'observer',
            'singleton': 'singleton',
            'adapter': 'adapter',
            'decorator': 'decorator'
        };
        
        const lower = filename.toLowerCase();
        for (const [key, pattern] of Object.entries(patternMap)) {
            if (lower.includes(key)) {
                patterns.add(pattern);
            }
        }
    }
    
    calculateComplexity(analysis) {
        let complexity = 0;
        
        // File count factor
        complexity += Math.log10(analysis.files.length + 1);
        
        // Directory depth factor
        complexity += analysis.subdirectories.length * 0.5;
        
        // Technology diversity factor
        complexity += analysis.technologies.size * 0.8;
        
        // Pattern complexity factor
        complexity += analysis.patterns.size * 1.2;
        
        // File type diversity
        complexity += analysis.fileTypes.size * 0.3;
        
        return Math.min(10, Math.max(1, complexity));
    }
    
    calculateEducationalValue(analysis) {
        let value = 0;
        
        // Technology learning value
        value += analysis.technologies.size * 100;
        
        // Pattern learning value
        value += analysis.patterns.size * 150;
        
        // Code example value
        value += Math.min(analysis.files.length * 10, 500);
        
        // Complexity bonus
        value += analysis.complexity * 50;
        
        return Math.floor(value);
    }
    
    categorizeDirectory(analysis) {
        // Check for common directory patterns
        const name = analysis.name.toLowerCase();
        
        if (name.includes('test')) return 'testing';
        if (name.includes('doc')) return 'documentation';
        if (name.includes('api')) return 'api';
        if (name.includes('auth')) return 'security';
        if (name.includes('db') || name.includes('data')) return 'database';
        if (name.includes('ui') || name.includes('view')) return 'frontend';
        if (name.includes('service')) return 'backend';
        if (name.includes('util') || name.includes('helper')) return 'utilities';
        
        // Technology-based categorization
        if (analysis.technologies.has('nodejs')) return 'nodejs';
        if (analysis.technologies.has('python')) return 'python';
        if (analysis.technologies.has('java')) return 'java';
        
        return 'general';
    }
    
    generateWorldName(directoryPath, analysis) {
        const baseName = path.basename(directoryPath);
        const category = this.categorizeDirectory(analysis);
        
        const prefixes = {
            'testing': 'Testing Grounds of',
            'documentation': 'Library of',
            'api': 'Gateway to',
            'security': 'Fortress of',
            'database': 'Data Realm of',
            'frontend': 'Visual Kingdom of',
            'backend': 'Engine Room of',
            'utilities': 'Workshop of'
        };
        
        const prefix = prefixes[category] || 'Domain of';
        return `${prefix} ${baseName}`;
    }
    
    generateWorldDescription(analysis) {
        const techList = Array.from(analysis.technologies).slice(0, 3).join(', ');
        const fileCount = analysis.files.length;
        const complexity = Math.floor(analysis.complexity);
        
        return `A ${complexity}/10 complexity world featuring ${techList || 'various technologies'}. ` +
               `Explore ${fileCount} files and master ${analysis.patterns.size} design patterns.`;
    }
    
    determineEducationalTopic(analysis) {
        const category = this.categorizeDirectory(analysis);
        
        return this.domainConfig.educationalTopics[category] || 
               `${category.charAt(0).toUpperCase() + category.slice(1)} Development`;
    }
    
    extractSkills(analysis) {
        const skills = [];
        
        // Technology skills
        for (const tech of analysis.technologies) {
            skills.push(`${tech}_basics`);
        }
        
        // Pattern skills
        for (const pattern of analysis.patterns) {
            skills.push(`pattern_${pattern}`);
        }
        
        // General skills based on file types
        if (analysis.fileTypes.has('.test.js') || analysis.fileTypes.has('.spec.js')) {
            skills.push('unit_testing');
        }
        
        if (analysis.fileTypes.has('.md')) {
            skills.push('documentation');
        }
        
        return skills.slice(0, 10); // Limit to 10 skills
    }
    
    generateChallenges(analysis) {
        const challenges = [];
        
        // File type challenges
        for (const [ext, count] of analysis.fileTypes) {
            if (count >= 3) {
                challenges.push(`understand_${ext.substring(1)}_files`);
            }
        }
        
        // Pattern challenges
        for (const pattern of analysis.patterns) {
            challenges.push(`implement_${pattern}_pattern`);
        }
        
        // Technology challenges
        for (const tech of analysis.technologies) {
            challenges.push(`master_${tech}_basics`);
        }
        
        return challenges.slice(0, 5); // Limit to 5 challenges
    }
    
    calculateRewards(analysis) {
        return {
            xp: Math.floor(analysis.educationalValue),
            coins: Math.floor(analysis.educationalValue / 10),
            cards: Math.ceil(analysis.complexity / 2)
        };
    }
    
    generateTheme(analysis) {
        const themes = {
            'nodejs': { primary: '#68A063', secondary: '#333333' },
            'python': { primary: '#3776AB', secondary: '#FFD43B' },
            'java': { primary: '#007396', secondary: '#ED8B00' },
            'javascript': { primary: '#F7DF1E', secondary: '#000000' },
            'typescript': { primary: '#3178C6', secondary: '#FFFFFF' },
            'cpp': { primary: '#00599C', secondary: '#FFFFFF' },
            'ruby': { primary: '#CC342D', secondary: '#000000' },
            'php': { primary: '#777BB4', secondary: '#000000' },
            'rust': { primary: '#000000', secondary: '#CE422B' },
            'golang': { primary: '#00ADD8', secondary: '#000000' }
        };
        
        const primaryTech = Array.from(analysis.technologies)[0];
        return themes[primaryTech] || { primary: '#4A90E2', secondary: '#FFFFFF' };
    }
    
    getExtensionLevel(ext) {
        for (const level of this.domainConfig.extensionHierarchy) {
            if (level.extensions.includes(ext)) {
                return level;
            }
        }
        return null;
    }
    
    generateLessonContent(ext, type) {
        return `Learn about ${type} development using ${ext} files. ` +
               `This lesson covers best practices, common patterns, and real-world examples.`;
    }
    
    generateResources(analysis) {
        const resources = [];
        
        if (analysis.files.some(f => f.name === 'README.md')) {
            resources.push({
                type: 'documentation',
                name: 'Project README',
                description: 'Official project documentation'
            });
        }
        
        if (analysis.technologies.size > 0) {
            resources.push({
                type: 'reference',
                name: `${Array.from(analysis.technologies)[0]} Documentation`,
                description: 'Official language/framework documentation'
            });
        }
        
        return resources;
    }
    
    findConnections() {
        const connections = [];
        const domains = Array.from(this.domainCache.values());
        
        for (let i = 0; i < domains.length; i++) {
            for (let j = i + 1; j < domains.length; j++) {
                const similarity = this.calculateSimilarity(
                    domains[i].analysis,
                    domains[j].analysis
                );
                
                if (similarity > 0.5) {
                    connections.push({
                        from: domains[i].domain,
                        to: domains[j].domain,
                        strength: similarity,
                        type: 'technology'
                    });
                }
            }
        }
        
        return connections;
    }
    
    calculateSimilarity(analysis1, analysis2) {
        const tech1 = analysis1.technologies;
        const tech2 = analysis2.technologies;
        
        const intersection = new Set([...tech1].filter(x => tech2.has(x)));
        const union = new Set([...tech1, ...tech2]);
        
        return intersection.size / union.size;
    }
    
    getStatistics() {
        return {
            ...this.stats,
            portAllocations: Object.fromEntries(this.stats.portAllocations),
            averageComplexity: this.calculateAverageComplexity(),
            topTechnologies: this.getTopTechnologies(),
            coveragePercentage: this.calculateCoverage()
        };
    }
    
    calculateAverageComplexity() {
        const domains = Array.from(this.domainCache.values());
        if (domains.length === 0) return 0;
        
        const total = domains.reduce((sum, d) => sum + d.analysis.complexity, 0);
        return total / domains.length;
    }
    
    getTopTechnologies() {
        const techCount = new Map();
        
        for (const domain of this.domainCache.values()) {
            for (const tech of domain.analysis.technologies) {
                techCount.set(tech, (techCount.get(tech) || 0) + 1);
            }
        }
        
        return Array.from(techCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }
    
    calculateCoverage() {
        const usedPorts = this.stats.portAllocations.size;
        const totalPorts = 9000; // 1000-9999
        return (usedPorts / totalPorts) * 100;
    }
}

module.exports = DirectoryToDomainMapper;

// CLI Demo
if (require.main === module) {
    async function demo() {
        console.log('\n📁 DIRECTORY TO DOMAIN MAPPER DEMO\n');
        
        const mapper = new DirectoryToDomainMapper();
        
        // Map current directory
        console.log('📂 Mapping current directory...\n');
        
        try {
            const result = await mapper.mapDirectoryToDomain(process.cwd());
            
            console.log('\n📊 Mapping Result:');
            console.log(`  Domain: ${result.domain}`);
            console.log(`  Port: ${result.port}`);
            console.log(`  World: ${result.world.name}`);
            console.log(`  Topic: ${result.world.topic}`);
            console.log(`  Difficulty: ${result.world.difficulty}/10`);
            console.log(`  Technologies: ${result.world.technologies.join(', ')}`);
            
            console.log('\n📚 Educational Content:');
            console.log(`  Lessons: ${result.content.lessons.length}`);
            console.log(`  Challenges: ${result.content.challenges.length}`);
            console.log(`  MVP Templates: ${result.content.mvpTemplates.length}`);
            
            console.log('\n🎮 Game Rewards:');
            console.log(`  XP: ${result.world.rewards.xp}`);
            console.log(`  Coins: ${result.world.rewards.coins}`);
            console.log(`  Cards: ${result.world.rewards.cards}`);
            
            // Generate world map
            console.log('\n🗺️ Generating world map...');
            const worldMap = mapper.generateWorldMap();
            console.log(`  Total domains: ${worldMap.domains.length}`);
            console.log(`  Connections: ${worldMap.connections.length}`);
            
            console.log('\n📊 Statistics:');
            const stats = mapper.getStatistics();
            console.log(JSON.stringify(stats, null, 2));
            
        } catch (error) {
            console.error('Error during demo:', error);
        }
    }
    
    demo().catch(console.error);
}