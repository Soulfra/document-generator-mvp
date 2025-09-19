#!/usr/bin/env node
/**
 * 🧠🔍 CAL KNOWLEDGE PROCESSOR
 * 
 * Analyzes the organized vault categories and identifies buildable components
 * Uses pattern recognition to find related files that can work together
 * 
 * Features:
 * - Deep analysis of file relationships and dependencies
 * - Pattern recognition for buildable component groups  
 * - Automatic dependency resolution and packaging suggestions
 * - Integration scoring for component compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const CalVaultReader = require('./cal-vault-reader.js');

class CalKnowledgeProcessor extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            vaultPath: config.vaultPath || './ObsidianVault',
            minComponentSize: config.minComponentSize || 3, // Minimum files for a component
            maxComponentSize: config.maxComponentSize || 50, // Maximum files for maintainability
            confidenceThreshold: config.confidenceThreshold || 0.7,
            enableDeepAnalysis: config.enableDeepAnalysis !== false,
            enableDependencyResolution: config.enableDependencyResolution !== false,
            ...config
        };
        
        // Core analysis engines
        this.vaultReader = new CalVaultReader(config);
        this.patternEngine = new ComponentPatternEngine();
        this.dependencyResolver = new DependencyResolver();
        this.compatibilityScorer = new CompatibilityScorer();
        
        // Knowledge base
        this.buildableComponents = new Map();
        this.componentPatterns = new Map();
        this.dependencyGraph = new Map();
        this.buildScores = new Map();
        
        // Analysis cache
        this.analysisCache = new Map();
        this.lastAnalysis = null;
        
        // Statistics
        this.stats = {
            componentsFound: 0,
            patternsIdentified: 0,
            dependenciesResolved: 0,
            buildablePackages: 0,
            analysisTime: 0,
            lastRun: null
        };
        
        console.log('🧠 CAL Knowledge Processor initialized');
    }
    
    /**
     * Initialize the knowledge processor
     */
    async initialize() {
        console.log('🔄 Initializing Knowledge Processor...');
        
        try {
            // Initialize vault reader
            await this.vaultReader.initialize();
            
            // Run initial analysis
            await this.runFullAnalysis();
            
            console.log('✅ Knowledge Processor ready!');
            console.log(`📊 Found ${this.stats.componentsFound} buildable components`);
            
            this.emit('ready', this.stats);
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize Knowledge Processor:', error);
            throw error;
        }
    }
    
    /**
     * Run complete analysis of vault contents
     */
    async runFullAnalysis() {
        const startTime = Date.now();
        console.log('🔬 Running full knowledge analysis...');
        
        try {
            // Step 1: Pattern Recognition
            await this.identifyComponentPatterns();
            
            // Step 2: Dependency Analysis
            if (this.config.enableDependencyResolution) {
                await this.analyzeDependencies();
            }
            
            // Step 3: Build Component Groups
            await this.buildComponentGroups();
            
            // Step 4: Score Build Compatibility
            await this.scoreBuildCompatibility();
            
            // Step 5: Generate Build Recommendations
            await this.generateBuildRecommendations();
            
            this.stats.analysisTime = Date.now() - startTime;
            this.stats.lastRun = new Date();
            this.lastAnalysis = new Date();
            
            console.log(`✅ Analysis complete in ${this.stats.analysisTime}ms`);
            console.log(`🎯 Found ${this.buildableComponents.size} buildable components`);
            
            this.emit('analysis_complete', {
                components: this.buildableComponents.size,
                patterns: this.componentPatterns.size,
                analysisTime: this.stats.analysisTime
            });
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw error;
        }
    }
    
    /**
     * Identify component patterns across categories
     */
    async identifyComponentPatterns() {
        console.log('🔍 Identifying component patterns...');
        
        const patterns = [
            // API Service Patterns
            {
                name: 'api-service',
                description: 'Complete API service with endpoints and middleware',
                patterns: [
                    /.*api.*server.*\.js$/i,
                    /.*routes.*\.js$/i,
                    /.*middleware.*\.js$/i,
                    /.*controller.*\.js$/i
                ],
                requiredFiles: ['server', 'routes'],
                optionalFiles: ['middleware', 'controller', 'validation'],
                categories: ['01-Core-Systems', '05-Integrations']
            },
            
            // Authentication System Pattern
            {
                name: 'auth-system',
                description: 'Authentication and authorization system',
                patterns: [
                    /.*auth.*\.js$/i,
                    /.*login.*\.js$/i,
                    /.*security.*\.js$/i,
                    /.*permission.*\.js$/i,
                    /.*oauth.*\.js$/i
                ],
                requiredFiles: ['auth'],
                optionalFiles: ['middleware', 'routes', 'validation'],
                categories: ['01-Core-Systems', '05-Integrations']
            },
            
            // Database System Pattern
            {
                name: 'database-system', 
                description: 'Database management and data access layer',
                patterns: [
                    /.*database.*\.js$/i,
                    /.*db.*\.js$/i,
                    /.*schema.*\.(js|sql)$/i,
                    /.*migration.*\.(js|sql)$/i,
                    /.*model.*\.js$/i
                ],
                requiredFiles: ['database'],
                optionalFiles: ['schema', 'migration', 'model'],
                categories: ['01-Core-Systems']
            },
            
            // Frontend Dashboard Pattern
            {
                name: 'frontend-dashboard',
                description: 'Complete frontend dashboard with UI components',
                patterns: [
                    /.*dashboard.*\.html$/i,
                    /.*interface.*\.html$/i,
                    /.*ui.*\.html$/i,
                    /.*frontend.*\.html$/i,
                    /.*admin.*\.html$/i
                ],
                requiredFiles: ['dashboard'],
                optionalFiles: ['styles', 'scripts', 'components'],
                categories: ['01-Core-Systems', '02-Documentation']
            },
            
            // Gaming System Pattern
            {
                name: 'gaming-system',
                description: 'Gaming mechanics and character systems',
                patterns: [
                    /.*game.*\.js$/i,
                    /.*character.*\.js$/i,
                    /.*player.*\.js$/i,
                    /.*gaming.*\.js$/i,
                    /.*npc.*\.js$/i
                ],
                requiredFiles: ['game'],
                optionalFiles: ['character', 'player', 'npc', 'mechanics'],
                categories: ['07-Gaming-Systems', '01-Core-Systems']
            },
            
            // Generator/Orchestrator Pattern
            {
                name: 'generator-system',
                description: 'Code generation and orchestration system',
                patterns: [
                    /.*generator.*\.js$/i,
                    /.*orchestrator.*\.js$/i,
                    /.*router.*\.js$/i,
                    /.*engine.*\.js$/i
                ],
                requiredFiles: ['generator'],
                optionalFiles: ['orchestrator', 'router', 'template'],
                categories: ['04-Generators', '01-Core-Systems']
            },
            
            // AI/LLM Integration Pattern
            {
                name: 'ai-integration',
                description: 'AI and LLM integration services',
                patterns: [
                    /.*ai.*\.js$/i,
                    /.*llm.*\.js$/i,
                    /.*gpt.*\.js$/i,
                    /.*claude.*\.js$/i,
                    /.*anthropic.*\.js$/i,
                    /.*reasoning.*\.js$/i
                ],
                requiredFiles: ['ai'],
                optionalFiles: ['reasoning', 'integration', 'adapter'],
                categories: ['09-AI-Systems', '01-Core-Systems']
            },
            
            // Blockchain/Crypto Pattern
            {
                name: 'blockchain-system',
                description: 'Blockchain and cryptocurrency systems',
                patterns: [
                    /.*blockchain.*\.js$/i,
                    /.*crypto.*\.js$/i,
                    /.*wallet.*\.js$/i,
                    /.*token.*\.js$/i,
                    /.*chain.*\.js$/i
                ],
                requiredFiles: ['blockchain'],
                optionalFiles: ['wallet', 'crypto', 'token'],
                categories: ['08-Blockchain-Crypto', '01-Core-Systems']
            }
        ];
        
        // Analyze each pattern
        for (const pattern of patterns) {
            const matches = await this.findPatternMatches(pattern);
            if (matches.length >= this.config.minComponentSize) {
                this.componentPatterns.set(pattern.name, {
                    ...pattern,
                    matches,
                    confidence: this.calculatePatternConfidence(pattern, matches),
                    buildable: matches.length >= pattern.requiredFiles.length
                });
            }
        }
        
        this.stats.patternsIdentified = this.componentPatterns.size;
        console.log(`✅ Identified ${this.stats.patternsIdentified} component patterns`);
    }
    
    /**
     * Find files matching a specific pattern
     */
    async findPatternMatches(pattern) {
        const matches = [];
        
        // Search in specified categories
        for (const categoryName of pattern.categories) {
            const categoryQuery = await this.vaultReader.query(`category:${categoryName}`);
            
            for (const file of categoryQuery.files) {
                // Check if file matches any of the pattern regexes
                const matchesPattern = pattern.patterns.some(regex => regex.test(file.name));
                
                if (matchesPattern) {
                    matches.push({
                        ...file,
                        patternMatch: this.getPatternMatchType(file.name, pattern),
                        required: this.isRequiredFile(file.name, pattern),
                        category: categoryName
                    });
                }
            }
        }
        
        return matches;
    }
    
    /**
     * Determine what type of pattern match this is
     */
    getPatternMatchType(fileName, pattern) {
        for (const required of pattern.requiredFiles) {
            if (fileName.toLowerCase().includes(required)) {
                return 'required';
            }
        }
        
        for (const optional of pattern.optionalFiles) {
            if (fileName.toLowerCase().includes(optional)) {
                return 'optional';
            }
        }
        
        return 'supporting';
    }
    
    /**
     * Check if this is a required file for the pattern
     */
    isRequiredFile(fileName, pattern) {
        return pattern.requiredFiles.some(required => 
            fileName.toLowerCase().includes(required.toLowerCase())
        );
    }
    
    /**
     * Calculate confidence score for pattern matches
     */
    calculatePatternConfidence(pattern, matches) {
        let score = 0;
        
        // Required files present
        const requiredMatches = matches.filter(m => m.required);
        const requiredRatio = requiredMatches.length / pattern.requiredFiles.length;
        score += requiredRatio * 0.6;
        
        // Optional files present
        const optionalMatches = matches.filter(m => m.patternMatch === 'optional');
        const optionalRatio = optionalMatches.length / Math.max(pattern.optionalFiles.length, 1);
        score += optionalRatio * 0.3;
        
        // Total file count bonus
        const sizeScore = Math.min(matches.length / 10, 1);
        score += sizeScore * 0.1;
        
        return Math.min(score, 1.0);
    }
    
    /**
     * Analyze dependencies between components
     */
    async analyzeDependencies() {
        console.log('🔗 Analyzing component dependencies...');
        
        let dependenciesFound = 0;
        
        for (const [patternName, patternData] of this.componentPatterns) {
            const dependencies = [];
            
            // Analyze file imports and requires
            for (const file of patternData.matches) {
                try {
                    if (file.type === 'javascript' || file.type === 'typescript') {
                        const fileDeps = await this.analyzeJavaScriptDependencies(file);
                        dependencies.push(...fileDeps);
                    }
                } catch (error) {
                    // Skip files we can't read
                }
            }
            
            // Group and dedupe dependencies
            const uniqueDeps = this.groupDependencies(dependencies);
            this.dependencyGraph.set(patternName, uniqueDeps);
            dependenciesFound += uniqueDeps.length;
        }
        
        this.stats.dependenciesResolved = dependenciesFound;
        console.log(`✅ Analyzed ${dependenciesFound} dependencies`);
    }
    
    /**
     * Analyze JavaScript file dependencies
     */
    async analyzeJavaScriptDependencies(file) {
        try {
            const content = await fs.readFile(file.path, 'utf-8');
            const dependencies = [];
            
            // Find require() statements
            const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
            for (const match of requireMatches) {
                const [, dep] = match.match(/require\(['"`]([^'"`]+)['"`]\)/);
                dependencies.push({ type: 'require', module: dep, file: file.name });
            }
            
            // Find import statements
            const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
            for (const match of importMatches) {
                const [, dep] = match.match(/import.*from\s+['"`]([^'"`]+)['"`]/);
                dependencies.push({ type: 'import', module: dep, file: file.name });
            }
            
            // Find dynamic imports
            const dynamicMatches = content.match(/import\(['"`]([^'"`]+)['"`]\)/g) || [];
            for (const match of dynamicMatches) {
                const [, dep] = match.match(/import\(['"`]([^'"`]+)['"`]\)/);
                dependencies.push({ type: 'dynamic', module: dep, file: file.name });
            }
            
            return dependencies;
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Group and dedupe dependencies
     */
    groupDependencies(dependencies) {
        const grouped = new Map();
        
        for (const dep of dependencies) {
            const key = dep.module;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    module: dep.module,
                    type: dep.type,
                    usedBy: [],
                    isLocal: dep.module.startsWith('./') || dep.module.startsWith('../')
                });
            }
            
            grouped.get(key).usedBy.push(dep.file);
        }
        
        return Array.from(grouped.values());
    }
    
    /**
     * Build component groups from patterns
     */
    async buildComponentGroups() {
        console.log('🏗️  Building component groups...');
        
        for (const [patternName, patternData] of this.componentPatterns) {
            if (patternData.buildable && patternData.confidence >= this.config.confidenceThreshold) {
                
                const component = {
                    id: patternName,
                    name: patternData.name,
                    description: patternData.description,
                    type: patternName.split('-')[0], // e.g., 'api' from 'api-service'
                    files: patternData.matches,
                    dependencies: this.dependencyGraph.get(patternName) || [],
                    confidence: patternData.confidence,
                    buildable: true,
                    packaging: {
                        frontend: this.hasUIComponents(patternData.matches),
                        backend: this.hasBackendComponents(patternData.matches),
                        database: this.hasDatabaseComponents(patternData.matches),
                        deployment: this.hasDeploymentConfig(patternData.matches)
                    },
                    metadata: {
                        fileCount: patternData.matches.length,
                        totalSize: patternData.matches.reduce((sum, f) => sum + (f.size || 0), 0),
                        categories: [...new Set(patternData.matches.map(f => f.category))],
                        created: new Date()
                    }
                };
                
                this.buildableComponents.set(patternName, component);
            }
        }
        
        this.stats.componentsFound = this.buildableComponents.size;
        console.log(`✅ Built ${this.stats.componentsFound} component groups`);
    }
    
    /**
     * Score build compatibility between components
     */
    async scoreBuildCompatibility() {
        console.log('🎯 Scoring build compatibility...');
        
        const components = Array.from(this.buildableComponents.values());
        
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                const compA = components[i];
                const compB = components[j];
                
                const compatibility = this.calculateCompatibility(compA, compB);
                const scoreKey = `${compA.id}-${compB.id}`;
                
                this.buildScores.set(scoreKey, {
                    componentA: compA.id,
                    componentB: compB.id,
                    compatibility,
                    canIntegrate: compatibility > 0.5,
                    sharedDependencies: this.findSharedDependencies(compA, compB),
                    conflictingFiles: this.findConflictingFiles(compA, compB)
                });
            }
        }
        
        console.log(`✅ Scored ${this.buildScores.size} component combinations`);
    }
    
    /**
     * Calculate compatibility between two components
     */
    calculateCompatibility(compA, compB) {
        let score = 0;
        
        // Type compatibility
        if (this.areTypesCompatible(compA.type, compB.type)) {
            score += 0.3;
        }
        
        // Shared dependencies
        const sharedDeps = this.findSharedDependencies(compA, compB);
        score += Math.min(sharedDeps.length * 0.1, 0.3);
        
        // Category overlap
        const sharedCategories = compA.metadata.categories.filter(cat => 
            compB.metadata.categories.includes(cat)
        );
        score += Math.min(sharedCategories.length * 0.1, 0.2);
        
        // File conflicts (negative score)
        const conflicts = this.findConflictingFiles(compA, compB);
        score -= conflicts.length * 0.1;
        
        // Size compatibility (not too different)
        const sizeDiff = Math.abs(compA.files.length - compB.files.length);
        const sizeCompatibility = 1 - (sizeDiff / Math.max(compA.files.length, compB.files.length));
        score += sizeCompatibility * 0.2;
        
        return Math.max(0, Math.min(score, 1));
    }
    
    /**
     * Check if component types are compatible
     */
    areTypesCompatible(typeA, typeB) {
        const compatibilityMatrix = {
            'api': ['frontend', 'database', 'auth'],
            'frontend': ['api', 'auth'],
            'database': ['api', 'auth'],
            'auth': ['api', 'frontend', 'database'],
            'gaming': ['api', 'frontend', 'ai'],
            'ai': ['api', 'gaming', 'generator'],
            'generator': ['ai', 'api']
        };
        
        return compatibilityMatrix[typeA]?.includes(typeB) || false;
    }
    
    /**
     * Find shared dependencies between components
     */
    findSharedDependencies(compA, compB) {
        const depsA = new Set(compA.dependencies.map(d => d.module));
        const depsB = new Set(compB.dependencies.map(d => d.module));
        
        return Array.from(depsA).filter(dep => depsB.has(dep));
    }
    
    /**
     * Find conflicting files between components
     */
    findConflictingFiles(compA, compB) {
        const filesA = new Set(compA.files.map(f => f.name));
        const filesB = new Set(compB.files.map(f => f.name));
        
        return Array.from(filesA).filter(file => filesB.has(file));
    }
    
    /**
     * Generate build recommendations
     */
    async generateBuildRecommendations() {
        console.log('💡 Generating build recommendations...');
        
        const recommendations = [];
        
        // High-confidence standalone components
        for (const [id, component] of this.buildableComponents) {
            if (component.confidence >= 0.8) {
                recommendations.push({
                    type: 'standalone',
                    priority: 'high',
                    component: id,
                    description: `Build ${component.name} as standalone package`,
                    reasoning: `High confidence (${Math.round(component.confidence * 100)}%) with ${component.files.length} files`,
                    files: component.files.length,
                    effort: this.estimateEffort(component)
                });
            }
        }
        
        // Compatible component combinations
        for (const [scoreKey, score] of this.buildScores) {
            if (score.compatibility >= 0.7 && score.canIntegrate) {
                const compA = this.buildableComponents.get(score.componentA);
                const compB = this.buildableComponents.get(score.componentB);
                
                recommendations.push({
                    type: 'integration',
                    priority: 'medium',
                    components: [score.componentA, score.componentB],
                    description: `Integrate ${compA.name} with ${compB.name}`,
                    reasoning: `High compatibility (${Math.round(score.compatibility * 100)}%)`,
                    compatibility: score.compatibility,
                    sharedDependencies: score.sharedDependencies.length,
                    effort: this.estimateIntegrationEffort(compA, compB)
                });
            }
        }
        
        // Sort by priority and confidence
        recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Secondary sort by confidence/compatibility
            const scoreA = a.component ? this.buildableComponents.get(a.component)?.confidence || 0 : a.compatibility || 0;
            const scoreB = b.component ? this.buildableComponents.get(b.component)?.confidence || 0 : b.compatibility || 0;
            
            return scoreB - scoreA;
        });
        
        this.buildRecommendations = recommendations.slice(0, 20); // Top 20 recommendations
        this.stats.buildablePackages = this.buildRecommendations.length;
        
        console.log(`✅ Generated ${this.buildRecommendations.length} build recommendations`);
    }
    
    /**
     * Estimate effort for building a component
     */
    estimateEffort(component) {
        const baseEffort = component.files.length * 0.5; // Base effort per file
        const complexityMultiplier = component.dependencies.length * 0.1; // Dependency complexity
        const sizeMultiplier = component.metadata.totalSize / (1024 * 1024); // Size in MB
        
        const effort = baseEffort + complexityMultiplier + sizeMultiplier;
        
        if (effort < 5) return 'low';
        if (effort < 15) return 'medium';
        return 'high';
    }
    
    /**
     * Estimate effort for integrating two components
     */
    estimateIntegrationEffort(compA, compB) {
        const individualEffortA = this.estimateEffort(compA);
        const individualEffortB = this.estimateEffort(compB);
        
        const effortValues = { 'low': 1, 'medium': 2, 'high': 3 };
        const totalEffort = effortValues[individualEffortA] + effortValues[individualEffortB];
        
        // Integration adds complexity
        const integrationEffort = totalEffort + 1;
        
        if (integrationEffort <= 3) return 'medium';
        if (integrationEffort <= 5) return 'high';
        return 'very high';
    }
    
    /**
     * Check for different component types
     */
    hasUIComponents(files) {
        return files.some(f => f.name.endsWith('.html') || f.name.includes('dashboard') || f.name.includes('interface'));
    }
    
    hasBackendComponents(files) {
        return files.some(f => f.name.includes('server') || f.name.includes('api') || f.name.includes('service'));
    }
    
    hasDatabaseComponents(files) {
        return files.some(f => f.name.includes('database') || f.name.includes('db') || f.name.includes('schema'));
    }
    
    hasDeploymentConfig(files) {
        return files.some(f => f.name.includes('docker') || f.name.includes('deploy') || f.name.includes('config'));
    }
    
    /**
     * Get buildable components
     */
    getBuildableComponents() {
        return Array.from(this.buildableComponents.values());
    }
    
    /**
     * Get build recommendations
     */
    getBuildRecommendations() {
        return this.buildRecommendations || [];
    }
    
    /**
     * Get component by ID
     */
    getComponent(componentId) {
        return this.buildableComponents.get(componentId);
    }
    
    /**
     * Get compatible components for a given component
     */
    getCompatibleComponents(componentId) {
        const compatible = [];
        
        for (const [scoreKey, score] of this.buildScores) {
            if (score.canIntegrate && (score.componentA === componentId || score.componentB === componentId)) {
                const otherId = score.componentA === componentId ? score.componentB : score.componentA;
                const otherComponent = this.buildableComponents.get(otherId);
                
                if (otherComponent) {
                    compatible.push({
                        component: otherComponent,
                        compatibility: score.compatibility,
                        sharedDependencies: score.sharedDependencies
                    });
                }
            }
        }
        
        return compatible.sort((a, b) => b.compatibility - a.compatibility);
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.analysisCache.size,
            uptime: this.lastAnalysis ? Date.now() - this.lastAnalysis.getTime() : 0
        };
    }
}

/**
 * Component Pattern Engine - helper class for pattern recognition
 */
class ComponentPatternEngine {
    constructor() {
        this.patterns = new Map();
    }
}

/**
 * Dependency Resolver - helper class for dependency analysis
 */
class DependencyResolver {
    constructor() {
        this.dependencies = new Map();
    }
}

/**
 * Compatibility Scorer - helper class for compatibility scoring
 */
class CompatibilityScorer {
    constructor() {
        this.scores = new Map();
    }
}

// CLI interface
if (require.main === module) {
    const processor = new CalKnowledgeProcessor();
    
    processor.initialize()
        .then(() => {
            const args = process.argv.slice(2);
            
            if (args.includes('--components')) {
                console.log('\n🏗️  Buildable Components:');
                const components = processor.getBuildableComponents();
                components.forEach((comp, i) => {
                    console.log(`${i + 1}. ${comp.name} (${comp.files.length} files, ${Math.round(comp.confidence * 100)}% confidence)`);
                });
            }
            
            if (args.includes('--recommendations')) {
                console.log('\n💡 Build Recommendations:');
                const recommendations = processor.getBuildRecommendations();
                recommendations.slice(0, 10).forEach((rec, i) => {
                    console.log(`${i + 1}. ${rec.description} (${rec.priority} priority, ${rec.effort} effort)`);
                });
            }
            
            if (args.includes('--stats')) {
                console.log('\n📊 Knowledge Processor Stats:');
                const stats = processor.getStats();
                console.log(`Components found: ${stats.componentsFound}`);
                console.log(`Patterns identified: ${stats.patternsIdentified}`);
                console.log(`Dependencies resolved: ${stats.dependenciesResolved}`);
                console.log(`Buildable packages: ${stats.buildablePackages}`);
                console.log(`Analysis time: ${stats.analysisTime}ms`);
            }
            
            if (args.length === 0) {
                console.log(`
🧠 CAL Knowledge Processor

Usage: node cal-knowledge-processor.js [options]

Options:
  --components       Show all buildable components
  --recommendations  Show build recommendations  
  --stats           Show analysis statistics

Current Status:
  Components: ${processor.stats.componentsFound}
  Patterns: ${processor.stats.patternsIdentified}
  Packages: ${processor.stats.buildablePackages}
                `);
            }
        })
        .catch(console.error);
}

module.exports = CalKnowledgeProcessor;