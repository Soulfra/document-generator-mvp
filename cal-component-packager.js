#!/usr/bin/env node
/**
 * 📦🚀 CAL COMPONENT PACKAGER
 * 
 * Creates deployable packages from identified buildable components
 * Supports frontend, backend, and integrated packages
 * 
 * Features:
 * - Automated package creation from component analysis
 * - Frontend/backend separation and integration
 * - Dependency resolution and bundling
 * - Docker containerization and deployment configs
 * - Documentation generation
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { execSync } = require('child_process');
const CalKnowledgeProcessor = require('./cal-knowledge-processor.js');

class CalComponentPackager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            outputPath: config.outputPath || './generated-packages',
            enableDockerization: config.enableDockerization !== false,
            enableDocumentation: config.enableDocumentation !== false,
            enableTesting: config.enableTesting !== false,
            packageRegistry: config.packageRegistry || 'local',
            compressionEnabled: config.compressionEnabled !== false,
            ...config
        };
        
        // Core components
        this.knowledgeProcessor = new CalKnowledgeProcessor(config);
        this.templateEngine = new PackageTemplateEngine();
        this.dependencyBundler = new DependencyBundler();
        this.deploymentGenerator = new DeploymentGenerator();
        
        // Package tracking
        this.createdPackages = new Map();
        this.packageDependencies = new Map();
        this.packageMetadata = new Map();
        
        // Statistics
        this.stats = {
            packagesCreated: 0,
            frontendPackages: 0,
            backendPackages: 0,
            integratedPackages: 0,
            dockerContainers: 0,
            totalSize: 0,
            lastRun: null
        };
        
        console.log('📦 CAL Component Packager initialized');
    }
    
    /**
     * Initialize the component packager
     */
    async initialize() {
        console.log('🔄 Initializing Component Packager...');
        
        try {
            // Initialize knowledge processor
            await this.knowledgeProcessor.initialize();
            
            // Create output directory
            await fs.mkdir(this.config.outputPath, { recursive: true });
            
            console.log('✅ Component Packager ready!');
            console.log(`📁 Output path: ${this.config.outputPath}`);
            
            this.emit('ready', this.stats);
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize Component Packager:', error);
            throw error;
        }
    }
    
    /**
     * Create package from component ID
     */
    async createPackage(componentId, options = {}) {
        console.log(`📦 Creating package for component: ${componentId}`);
        
        const component = this.knowledgeProcessor.getComponent(componentId);
        if (!component) {
            throw new Error(`Component ${componentId} not found`);
        }
        
        const packageConfig = {
            id: componentId,
            name: this.generatePackageName(component),
            version: options.version || '1.0.0',
            type: this.determinePackageType(component),
            ...options
        };
        
        try {
            // Create package directory structure
            const packagePath = await this.createPackageStructure(packageConfig);
            
            // Copy and process component files
            await this.processComponentFiles(component, packagePath);
            
            // Generate package.json and metadata
            await this.generatePackageManifest(component, packagePath, packageConfig);
            
            // Bundle dependencies
            if (this.config.enableDependencyBundling !== false) {
                await this.bundleDependencies(component, packagePath);
            }
            
            // Generate deployment configuration
            if (this.config.enableDockerization) {
                await this.generateDeploymentConfig(component, packagePath, packageConfig);
            }
            
            // Generate documentation
            if (this.config.enableDocumentation) {
                await this.generatePackageDocumentation(component, packagePath);
            }
            
            // Create tests
            if (this.config.enableTesting) {
                await this.generatePackageTests(component, packagePath);
            }
            
            // Package and compress if enabled
            let finalPackage = packagePath;
            if (this.config.compressionEnabled) {
                finalPackage = await this.compressPackage(packagePath, packageConfig);
            }
            
            // Register created package
            const packageInfo = {
                id: componentId,
                name: packageConfig.name,
                version: packageConfig.version,
                type: packageConfig.type,
                path: finalPackage,
                component,
                created: new Date(),
                metadata: packageConfig
            };
            
            this.createdPackages.set(componentId, packageInfo);
            this.updateStats(packageInfo);
            
            console.log(`✅ Package created: ${packageInfo.name} at ${finalPackage}`);
            
            this.emit('package_created', packageInfo);
            
            return packageInfo;
            
        } catch (error) {
            console.error(`❌ Failed to create package for ${componentId}:`, error);
            throw error;
        }
    }
    
    /**
     * Create integrated package from multiple components
     */
    async createIntegratedPackage(componentIds, options = {}) {
        console.log(`🔗 Creating integrated package from ${componentIds.length} components`);
        
        const components = componentIds.map(id => {
            const comp = this.knowledgeProcessor.getComponent(id);
            if (!comp) throw new Error(`Component ${id} not found`);
            return comp;
        });
        
        const packageConfig = {
            id: `integrated-${componentIds.join('-')}`,
            name: options.name || this.generateIntegratedPackageName(components),
            version: options.version || '1.0.0',
            type: 'integrated',
            components: componentIds,
            ...options
        };
        
        try {
            // Check compatibility
            await this.validateComponentCompatibility(components);
            
            // Create integrated package structure
            const packagePath = await this.createIntegratedPackageStructure(packageConfig);
            
            // Process all component files with integration
            for (const component of components) {
                await this.processIntegratedComponentFiles(component, packagePath, packageConfig);
            }
            
            // Generate integrated manifest
            await this.generateIntegratedManifest(components, packagePath, packageConfig);
            
            // Create integration layer
            await this.generateIntegrationLayer(components, packagePath);
            
            // Handle shared dependencies
            await this.resolveSharedDependencies(components, packagePath);
            
            // Generate deployment config for integrated system
            if (this.config.enableDockerization) {
                await this.generateIntegratedDeploymentConfig(components, packagePath, packageConfig);
            }
            
            // Generate integrated documentation
            if (this.config.enableDocumentation) {
                await this.generateIntegratedDocumentation(components, packagePath);
            }
            
            let finalPackage = packagePath;
            if (this.config.compressionEnabled) {
                finalPackage = await this.compressPackage(packagePath, packageConfig);
            }
            
            const packageInfo = {
                id: packageConfig.id,
                name: packageConfig.name,
                version: packageConfig.version,
                type: 'integrated',
                path: finalPackage,
                components,
                componentIds,
                created: new Date(),
                metadata: packageConfig
            };
            
            this.createdPackages.set(packageConfig.id, packageInfo);
            this.stats.integratedPackages++;
            
            console.log(`✅ Integrated package created: ${packageInfo.name}`);
            
            this.emit('integrated_package_created', packageInfo);
            
            return packageInfo;
            
        } catch (error) {
            console.error('❌ Failed to create integrated package:', error);
            throw error;
        }
    }
    
    /**
     * Auto-package all buildable components
     */
    async autoPackageAll(options = {}) {
        console.log('🚀 Auto-packaging all buildable components...');
        
        const components = this.knowledgeProcessor.getBuildableComponents();
        const recommendations = this.knowledgeProcessor.getBuildRecommendations();
        
        const createdPackages = [];
        
        try {
            // Create standalone packages for high-confidence components
            for (const component of components) {
                if (component.confidence >= 0.8) {
                    const packageInfo = await this.createPackage(component.id, options);
                    createdPackages.push(packageInfo);
                }
            }
            
            // Create integrated packages from recommendations
            if (options.includeIntegrations !== false) {
                const integrationRecommendations = recommendations.filter(r => r.type === 'integration');
                
                for (const recommendation of integrationRecommendations.slice(0, 5)) {
                    try {
                        const packageInfo = await this.createIntegratedPackage(
                            recommendation.components,
                            { ...options, name: `integrated-${recommendation.components.join('-')}` }
                        );
                        createdPackages.push(packageInfo);
                    } catch (error) {
                        console.warn(`⚠️  Skipped integration ${recommendation.components.join('-')}:`, error.message);
                    }
                }
            }
            
            console.log(`✅ Auto-packaging complete: ${createdPackages.length} packages created`);
            
            this.emit('auto_package_complete', {
                packages: createdPackages,
                totalPackages: createdPackages.length
            });
            
            return createdPackages;
            
        } catch (error) {
            console.error('❌ Auto-packaging failed:', error);
            throw error;
        }
    }
    
    /**
     * Create package directory structure
     */
    async createPackageStructure(packageConfig) {
        const packagePath = path.join(this.config.outputPath, packageConfig.name);
        
        // Create main directories
        const dirs = [
            packagePath,
            path.join(packagePath, 'src'),
            path.join(packagePath, 'docs'),
            path.join(packagePath, 'tests'),
            path.join(packagePath, 'config'),
            path.join(packagePath, 'scripts')
        ];
        
        // Add type-specific directories
        if (packageConfig.type === 'frontend' || packageConfig.type === 'integrated') {
            dirs.push(
                path.join(packagePath, 'public'),
                path.join(packagePath, 'assets')
            );
        }
        
        if (packageConfig.type === 'backend' || packageConfig.type === 'integrated') {
            dirs.push(
                path.join(packagePath, 'routes'),
                path.join(packagePath, 'middleware'),
                path.join(packagePath, 'services')
            );
        }
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        return packagePath;
    }
    
    /**
     * Create integrated package structure
     */
    async createIntegratedPackageStructure(packageConfig) {
        const packagePath = path.join(this.config.outputPath, packageConfig.name);
        
        const dirs = [
            packagePath,
            path.join(packagePath, 'frontend'),
            path.join(packagePath, 'backend'),
            path.join(packagePath, 'shared'),
            path.join(packagePath, 'config'),
            path.join(packagePath, 'docs'),
            path.join(packagePath, 'tests'),
            path.join(packagePath, 'deployment'),
            path.join(packagePath, 'scripts')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        return packagePath;
    }
    
    /**
     * Process component files into package
     */
    async processComponentFiles(component, packagePath) {
        console.log(`📄 Processing ${component.files.length} files for ${component.name}`);
        
        for (const file of component.files) {
            try {
                const sourceContent = await fs.readFile(file.path, 'utf-8');
                const processedContent = await this.processFileContent(sourceContent, file, component);
                
                const targetPath = this.getTargetFilePath(file, packagePath, component);
                await fs.mkdir(path.dirname(targetPath), { recursive: true });
                await fs.writeFile(targetPath, processedContent);
                
            } catch (error) {
                console.warn(`⚠️  Could not process file ${file.name}:`, error.message);
            }
        }
    }
    
    /**
     * Process file content (transform imports, etc.)
     */
    async processFileContent(content, file, component) {
        let processed = content;
        
        // Transform relative imports to package-local imports
        processed = processed.replace(
            /require\(['"`](\.\/.+?)['"`]\)/g, 
            (match, importPath) => {
                const resolvedPath = this.resolvePackageImport(importPath, file, component);
                return `require('${resolvedPath}')`;
            }
        );
        
        // Transform ES6 imports
        processed = processed.replace(
            /import.*from\s+['"`](\.\/.+?)['"`]/g,
            (match, importPath) => {
                const resolvedPath = this.resolvePackageImport(importPath, file, component);
                return match.replace(importPath, resolvedPath);
            }
        );
        
        // Add package header comment
        const header = `/**\n * Generated by CAL Component Packager\n * Component: ${component.name}\n * Generated: ${new Date().toISOString()}\n */\n\n`;
        processed = header + processed;
        
        return processed;
    }
    
    /**
     * Get target file path in package
     */
    getTargetFilePath(file, packagePath, component) {
        const ext = path.extname(file.name);
        let targetDir = 'src';
        
        // Organize by file type
        if (file.name.includes('test') || file.name.includes('spec')) {
            targetDir = 'tests';
        } else if (ext === '.html' || ext === '.css') {
            targetDir = 'public';
        } else if (file.name.includes('config')) {
            targetDir = 'config';
        } else if (file.name.includes('route')) {
            targetDir = 'routes';
        } else if (file.name.includes('middleware')) {
            targetDir = 'middleware';
        } else if (file.name.includes('service')) {
            targetDir = 'services';
        }
        
        return path.join(packagePath, targetDir, file.name);
    }
    
    /**
     * Generate package.json manifest
     */
    async generatePackageManifest(component, packagePath, packageConfig) {
        const manifest = {
            name: packageConfig.name,
            version: packageConfig.version,
            description: component.description,
            main: this.getMainEntryPoint(component),
            type: packageConfig.type,
            scripts: this.generatePackageScripts(component, packageConfig),
            dependencies: await this.collectPackageDependencies(component),
            devDependencies: this.getDevDependencies(packageConfig),
            keywords: this.generateKeywords(component),
            author: 'CAL Component Packager',
            license: 'MIT',
            calMetadata: {
                componentId: component.id,
                sourceFiles: component.files.length,
                confidence: component.confidence,
                categories: component.metadata.categories,
                generated: new Date().toISOString()
            }
        };
        
        await fs.writeFile(
            path.join(packagePath, 'package.json'),
            JSON.stringify(manifest, null, 2)
        );
    }
    
    /**
     * Generate deployment configuration
     */
    async generateDeploymentConfig(component, packagePath, packageConfig) {
        if (packageConfig.type === 'frontend') {
            await this.generateFrontendDeployment(component, packagePath);
        } else if (packageConfig.type === 'backend') {
            await this.generateBackendDeployment(component, packagePath);
        } else {
            await this.generateGenericDeployment(component, packagePath);
        }
    }
    
    /**
     * Generate Dockerfile for backend services
     */
    async generateBackendDeployment(component, packagePath) {
        const dockerfile = `# Generated by CAL Component Packager
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "src/index.js"]
`;

        await fs.writeFile(path.join(packagePath, 'Dockerfile'), dockerfile);
        
        // Docker compose for easy deployment
        const dockerCompose = `version: '3.8'
services:
  ${component.id}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`;
        
        await fs.writeFile(path.join(packagePath, 'docker-compose.yml'), dockerCompose);
        
        this.stats.dockerContainers++;
    }
    
    /**
     * Generate package documentation
     */
    async generatePackageDocumentation(component, packagePath) {
        const readme = `# ${component.name}

${component.description}

## Overview

This package was automatically generated by the CAL Component Packager from ${component.files.length} source files with ${Math.round(component.confidence * 100)}% confidence.

## Installation

\`\`\`bash
npm install ${component.id}
\`\`\`

## Usage

\`\`\`javascript
const ${this.toCamelCase(component.id)} = require('${component.id}');

// Your code here
\`\`\`

## API Documentation

[Auto-generated API docs will be here]

## Files Included

${component.files.map(f => `- ${f.name} (${f.category})`).join('\n')}

## Dependencies

${component.dependencies.map(d => `- ${d.module}`).join('\n')}

## Generated Information

- **Component ID**: ${component.id}
- **Confidence**: ${Math.round(component.confidence * 100)}%
- **Source Categories**: ${component.metadata.categories.join(', ')}
- **Generated**: ${new Date().toISOString()}

---

*Generated by CAL Component Packager*
`;

        await fs.writeFile(path.join(packagePath, 'README.md'), readme);
        
        // Generate API documentation if it's a backend service
        if (component.type === 'api' || component.packaging.backend) {
            await this.generateAPIDocumentation(component, packagePath);
        }
    }
    
    /**
     * Compress package into distributable archive
     */
    async compressPackage(packagePath, packageConfig) {
        const archivePath = `${packagePath}.tar.gz`;
        
        try {
            // Use tar command to create compressed archive
            execSync(`tar -czf "${archivePath}" -C "${path.dirname(packagePath)}" "${path.basename(packagePath)}"`, {
                stdio: 'pipe'
            });
            
            const stats = await fs.stat(archivePath);
            this.stats.totalSize += stats.size;
            
            console.log(`📦 Package compressed: ${path.basename(archivePath)} (${Math.round(stats.size / 1024)}KB)`);
            
            return archivePath;
        } catch (error) {
            console.warn('⚠️  Could not compress package, returning uncompressed:', error.message);
            return packagePath;
        }
    }
    
    /**
     * Utility functions
     */
    generatePackageName(component) {
        return component.id.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    }
    
    generateIntegratedPackageName(components) {
        const names = components.map(c => c.name.split('-')[0]).slice(0, 2);
        return `integrated-${names.join('-')}`.toLowerCase();
    }
    
    determinePackageType(component) {
        if (component.packaging.frontend && !component.packaging.backend) {
            return 'frontend';
        } else if (component.packaging.backend && !component.packaging.frontend) {
            return 'backend';
        } else if (component.packaging.frontend && component.packaging.backend) {
            return 'fullstack';
        } else {
            return 'library';
        }
    }
    
    getMainEntryPoint(component) {
        // Look for likely main files
        const mainCandidates = ['index.js', 'app.js', 'server.js', 'main.js'];
        
        for (const candidate of mainCandidates) {
            if (component.files.some(f => f.name === candidate)) {
                return `src/${candidate}`;
            }
        }
        
        // Default to first JS file
        const jsFile = component.files.find(f => f.name.endsWith('.js'));
        return jsFile ? `src/${jsFile.name}` : 'src/index.js';
    }
    
    generatePackageScripts(component, packageConfig) {
        const scripts = {
            start: 'node src/index.js',
            dev: 'nodemon src/index.js',
            test: 'npm run test:unit',
            'test:unit': 'jest',
            lint: 'eslint src/',
            build: 'echo "Build complete"'
        };
        
        if (packageConfig.type === 'frontend') {
            scripts.build = 'npm run build:assets';
            scripts['build:assets'] = 'webpack --mode=production';
            scripts.serve = 'http-server public/';
        }
        
        return scripts;
    }
    
    async collectPackageDependencies(component) {
        const dependencies = {};
        
        // Add commonly needed dependencies based on component type
        if (component.packaging.backend) {
            dependencies.express = '^4.18.0';
            dependencies.cors = '^2.8.5';
        }
        
        if (component.packaging.database) {
            dependencies.sqlite3 = '^5.1.0';
        }
        
        // Add dependencies from component analysis
        for (const dep of component.dependencies) {
            if (!dep.isLocal && !dep.module.startsWith('node:')) {
                dependencies[dep.module] = 'latest';
            }
        }
        
        return dependencies;
    }
    
    getDevDependencies(packageConfig) {
        return {
            jest: '^29.0.0',
            eslint: '^8.0.0',
            nodemon: '^2.0.0'
        };
    }
    
    generateKeywords(component) {
        const keywords = [
            component.type,
            'cal-generated',
            'component-packager'
        ];
        
        keywords.push(...component.metadata.categories.map(cat => 
            cat.replace(/^\d+-/, '').toLowerCase()
        ));
        
        return [...new Set(keywords)];
    }
    
    resolvePackageImport(importPath, file, component) {
        // For now, just clean up the path - more sophisticated resolution could be added
        return importPath.replace(/^\.\//, './src/');
    }
    
    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }
    
    updateStats(packageInfo) {
        this.stats.packagesCreated++;
        
        if (packageInfo.type === 'frontend') {
            this.stats.frontendPackages++;
        } else if (packageInfo.type === 'backend') {
            this.stats.backendPackages++;
        }
        
        this.stats.lastRun = new Date();
    }
    
    // Placeholder methods for complex operations
    async validateComponentCompatibility(components) {
        // Implementation would check for conflicts
        return true;
    }
    
    async processIntegratedComponentFiles(component, packagePath, packageConfig) {
        // Would process files with integration context
    }
    
    async generateIntegratedManifest(components, packagePath, packageConfig) {
        // Would create integrated package.json
    }
    
    async generateIntegrationLayer(components, packagePath) {
        // Would create integration middleware/glue code
    }
    
    async resolveSharedDependencies(components, packagePath) {
        // Would handle shared dependencies
    }
    
    async generateIntegratedDeploymentConfig(components, packagePath, packageConfig) {
        // Would create multi-service deployment
    }
    
    async generateIntegratedDocumentation(components, packagePath) {
        // Would create integrated system docs
    }
    
    async bundleDependencies(component, packagePath) {
        // Would bundle/resolve dependencies
    }
    
    async generatePackageTests(component, packagePath) {
        // Would generate basic tests
    }
    
    async generateAPIDocumentation(component, packagePath) {
        // Would generate API docs
    }
    
    async generateFrontendDeployment(component, packagePath) {
        // Would generate frontend deployment config
    }
    
    async generateGenericDeployment(component, packagePath) {
        // Would generate generic deployment config
    }
    
    /**
     * Get all created packages
     */
    getCreatedPackages() {
        return Array.from(this.createdPackages.values());
    }
    
    /**
     * Get package by ID
     */
    getPackage(packageId) {
        return this.createdPackages.get(packageId);
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            packagesInMemory: this.createdPackages.size
        };
    }
}

/**
 * Helper classes (placeholder implementations)
 */
class PackageTemplateEngine {
    constructor() {
        this.templates = new Map();
    }
}

class DependencyBundler {
    constructor() {
        this.bundles = new Map();
    }
}

class DeploymentGenerator {
    constructor() {
        this.configs = new Map();
    }
}

// CLI interface
if (require.main === module) {
    const packager = new CalComponentPackager();
    
    packager.initialize()
        .then(async () => {
            const args = process.argv.slice(2);
            
            if (args.includes('--auto')) {
                console.log('🚀 Running auto-packaging...');
                const packages = await packager.autoPackageAll();
                console.log(`\n✅ Created ${packages.length} packages:`);
                packages.forEach(pkg => {
                    console.log(`  - ${pkg.name} (${pkg.type})`);
                });
            } else if (args.includes('--list')) {
                const components = packager.knowledgeProcessor.getBuildableComponents();
                console.log('\n📋 Available components for packaging:');
                components.forEach((comp, i) => {
                    console.log(`${i + 1}. ${comp.name} (${comp.files.length} files, ${Math.round(comp.confidence * 100)}% confidence)`);
                });
            } else if (args[0] && !args[0].startsWith('--')) {
                const componentId = args[0];
                console.log(`📦 Creating package for: ${componentId}`);
                const packageInfo = await packager.createPackage(componentId);
                console.log(`✅ Package created: ${packageInfo.name} at ${packageInfo.path}`);
            } else {
                console.log(`
📦 CAL Component Packager

Usage: node cal-component-packager.js [options] [component-id]

Options:
  --auto        Auto-package all buildable components
  --list        List available components
  
Examples:
  node cal-component-packager.js --auto
  node cal-component-packager.js api-service
  node cal-component-packager.js --list

Current Status:
  Output: ${packager.config.outputPath}
  Dockerization: ${packager.config.enableDockerization ? 'enabled' : 'disabled'}
  Documentation: ${packager.config.enableDocumentation ? 'enabled' : 'disabled'}
                `);
            }
        })
        .catch(console.error);
}

module.exports = CalComponentPackager;