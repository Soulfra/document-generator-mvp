#!/usr/bin/env node

/**
 * 🎭 ENHANCED TEMPLATE REGISTRY - PHASE 1.1 IMPLEMENTATION
 * 
 * Consolidates 43+ template files into unified registry system
 * Maps all existing templates to 5 core types with dependency tracking
 * Provides categorization, validation, and template generation capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

// Import the base registry
const UnifiedTemplateRegistry = require('./unified-template-registry.js');

class EnhancedTemplateRegistry extends UnifiedTemplateRegistry {
    constructor() {
        super();
        
        // Template file mapping and metadata
        this.templateFiles = new Map();
        this.templateCategories = new Map();
        this.templateDependencies = new Map();
        this.templateVersions = new Map();
        this.templateMetadata = new Map();
        
        // Initialize template discovery and mapping
        this.initializeTemplateMapping();
        
        console.log('🎭 Enhanced Template Registry initialized');
    }
    
    // Initialize template file discovery and categorization
    async initializeTemplateMapping() {
        console.log('🔍 Discovering and mapping template files...');
        
        // Define template file patterns and their classifications
        const templateMappings = {
            // Data Transform Templates
            'dataTransform': [
                'template-processor.log',
                'template-matcher-ai.js',
                'template-matching-engine.js',
                'cal-template-matcher.js',
                'unified-template-registry.js',
                'mvp_template_strategy.md',
                'template-package-document.js',
                'template-integration-orchestrator.js',
                'document-to-*',
                'chat-to-*',
                'voice-to-*',
                '*-converter.js',
                '*-transformer.js',
                '*-processor.js'
            ],
            
            // Resource Management Templates  
            'resourceManagement': [
                'template-dependencies.js',
                'advanced-template-dependency-mapper.js',
                'template-action-system.js',
                'resource-*',
                'bucket-*',
                'health-*',
                'energy-*',
                'quota-*',
                'rate-limit*'
            ],
            
            // Competition Templates
            'competition': [
                'template-bash-execution.js',
                'execute-decision-template.js',
                'tournament-*',
                'battle-*',
                'arena-*',
                'competition-*',
                'versus-*',
                'ranking-*'
            ],
            
            // Status Templates  
            'status': [
                'template-layer-bash.js',
                'template-action-system.js',
                'template-wrapper.js',
                'status-*',
                'state-*',
                'transition-*',
                'effect-*',
                'potion-*',
                'color-*'
            ],
            
            // Instance Templates
            'instance': [
                'template-system-manager.js',
                'template-builder-system.js',
                'template-registry.json',
                'decentralized-guardian-template.js',
                'meta-template-layer.js',
                'decision-template-layer.js',
                'remote-template-layer.js',
                'world-*',
                'room-*',
                'instance-*',
                'environment-*',
                'zone-*'
            ]
        };
        
        // Discover and categorize template files
        await this.discoverTemplateFiles(templateMappings);
        
        // Build dependency graph
        await this.buildDependencyGraph();
        
        // Validate template consistency
        await this.validateTemplateConsistency();
        
        console.log('✅ Template mapping complete');
        this.printDiscoveryStats();
    }
    
    // Discover template files and categorize them
    async discoverTemplateFiles(mappings) {
        const baseDir = '/Users/matthewmauer/Desktop/Document-Generator';
        
        try {
            const files = await this.getAllFiles(baseDir);
            
            for (const file of files) {
                const relativePath = path.relative(baseDir, file);
                const filename = path.basename(file);
                
                // Skip node_modules and other ignored directories
                if (this.shouldIgnoreFile(relativePath)) continue;
                
                // Try to categorize the file
                const category = this.categorizeTemplateFile(filename, mappings);
                if (category) {
                    await this.registerTemplateFile(file, category);
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Error during template discovery:', error.message);
        }
    }
    
    // Get all files recursively
    async getAllFiles(dirPath, arrayOfFiles = []) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                try {
                    const stat = await fs.stat(fullPath);
                    if (stat.isDirectory()) {
                        if (!this.shouldIgnoreDirectory(file)) {
                            arrayOfFiles = await this.getAllFiles(fullPath, arrayOfFiles);
                        }
                    } else {
                        arrayOfFiles.push(fullPath);
                    }
                } catch (err) {
                    // Skip files we can't read
                    continue;
                }
            }
            
        } catch (error) {
            // Skip directories we can't read
        }
        
        return arrayOfFiles;
    }
    
    // Check if file should be ignored
    shouldIgnoreFile(relativePath) {
        const ignorePatterns = [
            'node_modules',
            '.git',
            'coverage',
            'dist',
            'build',
            '.backup',
            'temp-',
            'verification-report-',
            'logs/',
            'uploads/'
        ];
        
        return ignorePatterns.some(pattern => relativePath.includes(pattern));
    }
    
    // Check if directory should be ignored
    shouldIgnoreDirectory(dirName) {
        const ignoreDirs = [
            'node_modules',
            '.git',
            'coverage',
            'dist', 
            'build',
            'temp',
            'logs',
            'uploads'
        ];
        
        return ignoreDirs.includes(dirName);
    }
    
    // Categorize a template file based on patterns
    categorizeTemplateFile(filename, mappings) {
        for (const [category, patterns] of Object.entries(mappings)) {
            for (const pattern of patterns) {
                if (this.matchesPattern(filename, pattern)) {
                    return category;
                }
            }
        }
        return null;
    }
    
    // Check if filename matches pattern
    matchesPattern(filename, pattern) {
        // Convert glob-like pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
            .replace(/\./g, '\\.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filename);
    }
    
    // Register a template file with metadata
    async registerTemplateFile(filePath, category) {
        const filename = path.basename(filePath);
        const templateId = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 8);
        
        try {
            const stats = await fs.stat(filePath);
            
            const metadata = {
                id: templateId,
                path: filePath,
                filename: filename,
                category: category,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                type: this.inferTemplateType(filename),
                language: this.inferLanguage(filename),
                complexity: await this.assessComplexity(filePath),
                dependencies: []
            };
            
            this.templateFiles.set(templateId, metadata);
            
            // Add to category index
            if (!this.templateCategories.has(category)) {
                this.templateCategories.set(category, []);
            }
            this.templateCategories.get(category).push(templateId);
            
            // Store metadata
            this.templateMetadata.set(templateId, metadata);
            
        } catch (error) {
            console.warn(`⚠️ Error registering template ${filename}:`, error.message);
        }
    }
    
    // Infer template type from filename
    inferTemplateType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const name = filename.toLowerCase();
        
        if (ext === '.md') return 'documentation';
        if (ext === '.json') return 'configuration';
        if (ext === '.sql') return 'database';
        if (ext === '.html') return 'interface';
        if (ext === '.js') return 'service';
        if (ext === '.ts') return 'service';
        if (ext === '.sh') return 'script';
        if (ext === '.yml' || ext === '.yaml') return 'deployment';
        
        if (name.includes('docker')) return 'deployment';
        if (name.includes('template')) return 'template';
        if (name.includes('schema')) return 'database';
        if (name.includes('dashboard')) return 'interface';
        
        return 'unknown';
    }
    
    // Infer programming language
    inferLanguage(filename) {
        const ext = path.extname(filename).toLowerCase();
        
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript', 
            '.py': 'python',
            '.go': 'golang',
            '.rs': 'rust',
            '.java': 'java',
            '.sql': 'sql',
            '.html': 'html',
            '.css': 'css',
            '.sh': 'bash',
            '.md': 'markdown',
            '.json': 'json',
            '.yml': 'yaml',
            '.yaml': 'yaml'
        };
        
        return langMap[ext] || 'unknown';
    }
    
    // Assess template complexity by analyzing file
    async assessComplexity(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\\n').length;
            const size = content.length;
            
            // Simple complexity heuristic
            if (lines > 1000 || size > 50000) return 'high';
            if (lines > 500 || size > 25000) return 'medium';
            if (lines > 100 || size > 5000) return 'low';
            return 'minimal';
            
        } catch (error) {
            return 'unknown';
        }
    }
    
    // Build dependency graph between templates
    async buildDependencyGraph() {
        console.log('🔗 Building template dependency graph...');
        
        for (const [templateId, metadata] of this.templateFiles.entries()) {
            try {
                const dependencies = await this.extractDependencies(metadata.path);
                this.templateDependencies.set(templateId, dependencies);
                metadata.dependencies = dependencies;
                
            } catch (error) {
                console.warn(`⚠️ Error extracting dependencies for ${metadata.filename}`);
            }
        }
    }
    
    // Extract dependencies from template file
    async extractDependencies(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const dependencies = [];
            
            // Look for common dependency patterns
            const patterns = [
                /require\\(['\"](.*?)['\"]\\)/g,
                /import.*from\\s+['\"](.*?)['\"]\\s*;?/g,
                /\\#include\\s+['\"<](.*?)['\">]/g,
                /@import\\s+['\"](.*?)['\"]\\s*;?/g
            ];
            
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const dep = match[1];
                    if (dep && !dep.startsWith('.') && !dependencies.includes(dep)) {
                        dependencies.push(dep);
                    }
                }
            }
            
            return dependencies;
            
        } catch (error) {
            return [];
        }
    }
    
    // Validate template consistency
    async validateTemplateConsistency() {
        console.log('✅ Validating template consistency...');
        
        const issues = [];
        
        // Check for naming conflicts
        const nameGroups = new Map();
        for (const [id, metadata] of this.templateFiles.entries()) {
            const baseName = metadata.filename.replace(/\\.[^.]+$/, '');
            if (!nameGroups.has(baseName)) {
                nameGroups.set(baseName, []);
            }
            nameGroups.get(baseName).push(metadata);
        }
        
        // Report conflicts
        for (const [name, templates] of nameGroups.entries()) {
            if (templates.length > 1) {
                issues.push({
                    type: 'naming_conflict',
                    name: name,
                    count: templates.length,
                    files: templates.map(t => t.path)
                });
            }
        }
        
        // Check for circular dependencies
        for (const [templateId, deps] of this.templateDependencies.entries()) {
            if (this.hasCircularDependency(templateId, deps)) {
                const metadata = this.templateFiles.get(templateId);
                issues.push({
                    type: 'circular_dependency',
                    template: metadata.filename,
                    dependencies: deps
                });
            }
        }
        
        // Report issues
        if (issues.length > 0) {
            console.warn(`⚠️ Found ${issues.length} template consistency issues:`);
            issues.forEach((issue, i) => {
                console.warn(`   ${i+1}. ${issue.type}: ${issue.name || issue.template}`);
            });
        }
        
        return issues;
    }
    
    // Check for circular dependencies (simplified check)
    hasCircularDependency(templateId, dependencies, visited = new Set()) {
        if (visited.has(templateId)) {
            return true;
        }
        
        visited.add(templateId);
        
        for (const dep of dependencies) {
            const depTemplate = this.findTemplateByName(dep);
            if (depTemplate) {
                const depDeps = this.templateDependencies.get(depTemplate.id) || [];
                if (this.hasCircularDependency(depTemplate.id, depDeps, new Set(visited))) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Find template by filename
    findTemplateByName(name) {
        for (const [id, metadata] of this.templateFiles.entries()) {
            if (metadata.filename.includes(name)) {
                return { id, ...metadata };
            }
        }
        return null;
    }
    
    // Print discovery statistics
    printDiscoveryStats() {
        console.log('\\n📊 Template Discovery Statistics:');
        console.log(`   Total Templates Found: ${this.templateFiles.size}`);
        
        console.log('   Templates by Category:');
        for (const [category, templateIds] of this.templateCategories.entries()) {
            console.log(`     ${category}: ${templateIds.length} templates`);
        }
        
        console.log('   Templates by Type:');
        const typeCount = new Map();
        for (const metadata of this.templateFiles.values()) {
            const type = metadata.type;
            typeCount.set(type, (typeCount.get(type) || 0) + 1);
        }
        for (const [type, count] of typeCount.entries()) {
            console.log(`     ${type}: ${count} templates`);
        }
        
        console.log('   Templates by Language:');
        const langCount = new Map();
        for (const metadata of this.templateFiles.values()) {
            const lang = metadata.language;
            langCount.set(lang, (langCount.get(lang) || 0) + 1);
        }
        for (const [lang, count] of langCount.entries()) {
            console.log(`     ${lang}: ${count} templates`);
        }
    }
    
    // Enhanced template creation with file-based templates
    createSystemFromFile(templatePath, config = {}) {
        // Find template file
        const template = this.findTemplateByPath(templatePath);
        if (!template) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        
        console.log(`🎭 Creating system from template: ${template.filename}`);
        
        // Create system using appropriate core template type
        return this.createSystem(template.category, {
            ...config,
            templateFile: template.path,
            templateType: template.type,
            language: template.language,
            complexity: template.complexity
        });
    }
    
    // Find template by file path
    findTemplateByPath(searchPath) {
        for (const metadata of this.templateFiles.values()) {
            if (metadata.path === searchPath || metadata.path.endsWith(searchPath)) {
                return metadata;
            }
        }
        return null;
    }
    
    // Generate new template from existing one
    async generateTemplateVariant(sourceTemplateId, variantConfig) {
        const sourceTemplate = this.templateFiles.get(sourceTemplateId);
        if (!sourceTemplate) {
            throw new Error(`Source template not found: ${sourceTemplateId}`);
        }
        
        console.log(`🔄 Generating variant of ${sourceTemplate.filename}`);
        
        try {
            const sourceContent = await fs.readFile(sourceTemplate.path, 'utf8');
            
            // Apply variable substitutions
            let generatedContent = sourceContent;
            for (const [key, value] of Object.entries(variantConfig.variables || {})) {
                const pattern = new RegExp(`{{${key}}}`, 'g');
                generatedContent = generatedContent.replace(pattern, value);
            }
            
            // Generate new filename
            const newFilename = variantConfig.name || 
                sourceTemplate.filename.replace(/\\.(\\w+)$/, `_${Date.now()}.$1`);
            
            const newPath = path.join(path.dirname(sourceTemplate.path), newFilename);
            
            // Write generated template
            await fs.writeFile(newPath, generatedContent);
            
            // Register the new template
            await this.registerTemplateFile(newPath, sourceTemplate.category);
            
            console.log(`✅ Generated template variant: ${newFilename}`);
            
            return {
                path: newPath,
                content: generatedContent,
                sourceTemplate: sourceTemplate.filename
            };
            
        } catch (error) {
            throw new Error(`Failed to generate template variant: ${error.message}`);
        }
    }
    
    // Get template recommendations based on criteria  
    getTemplateRecommendations(criteria = {}) {
        const recommendations = [];
        
        for (const [id, metadata] of this.templateFiles.entries()) {
            let score = 0;
            
            // Category match
            if (criteria.category && metadata.category === criteria.category) {
                score += 50;
            }
            
            // Type match
            if (criteria.type && metadata.type === criteria.type) {
                score += 30;
            }
            
            // Language match
            if (criteria.language && metadata.language === criteria.language) {
                score += 20;
            }
            
            // Complexity preference
            if (criteria.complexity) {
                const complexities = ['minimal', 'low', 'medium', 'high'];
                const targetIndex = complexities.indexOf(criteria.complexity);
                const templateIndex = complexities.indexOf(metadata.complexity);
                if (targetIndex >= 0 && templateIndex >= 0) {
                    score += Math.max(0, 10 - Math.abs(targetIndex - templateIndex) * 3);
                }
            }
            
            // Recent modification bonus
            const daysSinceModified = (Date.now() - metadata.modified.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified < 30) {
                score += 10;
            }
            
            if (score > 0) {
                recommendations.push({
                    template: metadata,
                    score,
                    reasons: this.getRecommendationReasons(metadata, criteria, score)
                });
            }
        }
        
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10 recommendations
    }
    
    // Get reasons for recommendation
    getRecommendationReasons(template, criteria, score) {
        const reasons = [];
        
        if (criteria.category === template.category) {
            reasons.push(`Matches ${criteria.category} category`);
        }
        if (criteria.type === template.type) {
            reasons.push(`Matches ${criteria.type} type`);
        }
        if (criteria.language === template.language) {
            reasons.push(`Uses ${criteria.language} language`);
        }
        if (criteria.complexity === template.complexity) {
            reasons.push(`Matches ${criteria.complexity} complexity`);
        }
        
        return reasons;
    }
    
    // Export template registry data
    async exportRegistry(outputPath) {
        const registryData = {
            version: '1.1.0',
            generated: new Date().toISOString(),
            totalTemplates: this.templateFiles.size,
            categories: Object.fromEntries(this.templateCategories),
            templates: Object.fromEntries(
                Array.from(this.templateFiles.entries()).map(([id, metadata]) => [
                    id, {
                        ...metadata,
                        dependencies: this.templateDependencies.get(id) || []
                    }
                ])
            ),
            statistics: this.getEnhancedStats()
        };
        
        await fs.writeFile(outputPath, JSON.stringify(registryData, null, 2));
        console.log(`📋 Registry exported to ${outputPath}`);
        
        return registryData;
    }
    
    // Get enhanced statistics
    getEnhancedStats() {
        const stats = this.getStats();
        
        // Add template-specific stats
        stats.templateFiles = {
            total: this.templateFiles.size,
            byCategory: Object.fromEntries(
                Array.from(this.templateCategories.entries())
                .map(([cat, templates]) => [cat, templates.length])
            ),
            byType: {},
            byLanguage: {},
            byComplexity: {}
        };
        
        // Calculate type, language, and complexity distributions
        for (const metadata of this.templateFiles.values()) {
            stats.templateFiles.byType[metadata.type] = 
                (stats.templateFiles.byType[metadata.type] || 0) + 1;
            
            stats.templateFiles.byLanguage[metadata.language] = 
                (stats.templateFiles.byLanguage[metadata.language] || 0) + 1;
            
            stats.templateFiles.byComplexity[metadata.complexity] = 
                (stats.templateFiles.byComplexity[metadata.complexity] || 0) + 1;
        }
        
        return stats;
    }
}

// Export enhanced registry
module.exports = EnhancedTemplateRegistry;

// CLI Demo
if (require.main === module) {
    async function runDemo() {
        console.log('\\n🎭 ENHANCED TEMPLATE REGISTRY - PHASE 1.1 DEMO\\n');
        
        const registry = new EnhancedTemplateRegistry();
        
        // Wait for template discovery to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\\n🔍 Template Discovery Results:');
        registry.printDiscoveryStats();
        
        console.log('\\n💡 Template Recommendations for JavaScript Services:');
        const recommendations = registry.getTemplateRecommendations({
            category: 'dataTransform',
            language: 'javascript',
            type: 'service'
        });
        
        recommendations.slice(0, 3).forEach((rec, i) => {
            console.log(`   ${i+1}. ${rec.template.filename} (score: ${rec.score})`);
            console.log(`      ${rec.reasons.join(', ')}`);
        });
        
        console.log('\\n📋 Exporting registry...');
        await registry.exportRegistry('./template-registry-enhanced.json');
        
        console.log('\\n✅ Enhanced Template Registry demo complete!\\n');
    }
    
    runDemo().catch(console.error);
}