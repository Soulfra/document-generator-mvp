#!/usr/bin/env node

/**
 * Document Generator Master Build Orchestrator
 * Coordinates building and deployment of all system components
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

class BuildOrchestrator {
    constructor() {
        this.rootDir = __dirname;
        this.components = {
            'core': {
                path: '.',
                packageJson: './package.json',
                buildCommand: 'npm run setup',
                priority: 1
            },
            'web-interface': {
                path: './web-interface',
                packageJson: './web-interface/package.json',
                buildCommand: 'npm run build',
                priority: 2
            },
            'extension': {
                path: './web-interface/extension',
                packageJson: './web-interface/package.json', // Extension uses web-interface deps
                buildCommand: 'npm run build:extension',
                priority: 3
            }
        };
        
        this.config = {
            environment: process.env.NODE_ENV || 'development',
            parallel: process.env.BUILD_PARALLEL !== 'false',
            skipTests: process.env.SKIP_TESTS === 'true',
            verbose: process.env.VERBOSE === 'true'
        };
        
        this.buildStatus = new Map();
        this.startTime = Date.now();
    }
    
    async build(options = {}) {
        console.log(chalk.blue.bold('🚀 Document Generator Unified Build System'));
        console.log(chalk.gray(`Environment: ${this.config.environment}`));
        console.log(chalk.gray(`Parallel: ${this.config.parallel}`));
        console.log('─'.repeat(60));
        
        try {
            // Phase 1: Validate environment
            await this.validateEnvironment();
            
            // Phase 2: Resolve dependencies
            await this.resolveDependencies();
            
            // Phase 3: Build components
            await this.buildComponents(options);
            
            // Phase 4: Generate manifests
            await this.generateManifests();
            
            // Phase 5: Package for deployment
            await this.packageForDeployment();
            
            // Phase 6: Run tests (if not skipped)
            if (!this.config.skipTests) {
                await this.runTests();
            }
            
            this.printBuildSummary();
            
        } catch (error) {
            console.error(chalk.red.bold('❌ Build failed:'), error.message);
            if (this.config.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
    
    async validateEnvironment() {
        this.log('🔍 Validating environment...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        const requiredVersion = '18.0.0';
        if (!this.isVersionValid(nodeVersion.slice(1), requiredVersion)) {
            throw new Error(`Node.js ${requiredVersion}+ required, found ${nodeVersion}`);
        }
        
        // Check npm
        try {
            execSync('npm --version', { stdio: 'pipe' });
        } catch (error) {
            throw new Error('npm is required but not found');
        }
        
        // Check Docker (if needed)
        if (this.config.environment === 'production') {
            try {
                execSync('docker --version', { stdio: 'pipe' });
            } catch (error) {
                console.warn(chalk.yellow('⚠️  Docker not found - skipping containerization'));
            }
        }
        
        // Check required directories
        const requiredDirs = ['web-interface', 'web-interface/extension'];
        for (const dir of requiredDirs) {
            if (!fs.existsSync(path.join(this.rootDir, dir))) {
                throw new Error(`Required directory not found: ${dir}`);
            }
        }
        
        this.log('✅ Environment validation passed');
    }
    
    async resolveDependencies() {
        this.log('📦 Resolving dependencies...');
        
        // Read all package.json files
        const packages = {};
        for (const [name, component] of Object.entries(this.components)) {
            if (fs.existsSync(component.packageJson)) {
                packages[name] = JSON.parse(fs.readFileSync(component.packageJson, 'utf8'));
            }
        }
        
        // Check for conflicts
        const dependencyConflicts = this.findDependencyConflicts(packages);
        if (dependencyConflicts.length > 0) {
            console.warn(chalk.yellow('⚠️  Dependency conflicts detected:'));
            dependencyConflicts.forEach(conflict => {
                console.warn(chalk.yellow(`  - ${conflict.package}: ${conflict.versions.join(' vs ')}`));
            });
        }
        
        // Install dependencies for each component
        for (const [name, component] of Object.entries(this.components)) {
            if (fs.existsSync(component.packageJson)) {
                await this.installDependencies(name, component);
            }
        }
        
        this.log('✅ Dependencies resolved');
    }
    
    async buildComponents(options) {
        this.log('🔨 Building components...');
        
        // Sort components by priority
        const sortedComponents = Object.entries(this.components)
            .sort(([,a], [,b]) => a.priority - b.priority);
        
        if (this.config.parallel && !options.sequential) {
            // Build components in parallel (within priority groups)
            const priorityGroups = this.groupByPriority(sortedComponents);
            
            for (const group of priorityGroups) {
                await Promise.all(group.map(([name, component]) => 
                    this.buildComponent(name, component)
                ));
            }
        } else {
            // Build components sequentially
            for (const [name, component] of sortedComponents) {
                await this.buildComponent(name, component);
            }
        }
        
        this.log('✅ All components built successfully');
    }
    
    async buildComponent(name, component) {
        const startTime = Date.now();
        this.log(`🔧 Building ${name}...`);
        
        try {
            // Set up environment
            const env = {
                ...process.env,
                NODE_ENV: this.config.environment,
                BUILD_TARGET: name
            };
            
            // Handle special build commands
            let buildCommand = component.buildCommand;
            
            if (name === 'extension') {
                // Extension needs special handling
                buildCommand = this.getExtensionBuildCommand();
            }
            
            // Execute build
            await this.execCommand(buildCommand, {
                cwd: path.join(this.rootDir, component.path),
                env: env
            });
            
            const duration = Date.now() - startTime;
            this.buildStatus.set(name, { success: true, duration });
            this.log(`✅ ${name} built successfully (${duration}ms)`);
            
        } catch (error) {
            this.buildStatus.set(name, { success: false, error: error.message });
            throw new Error(`Failed to build ${name}: ${error.message}`);
        }
    }
    
    async generateManifests() {
        this.log('📋 Generating manifests...');
        
        // Generate Chrome extension manifest
        await this.generateExtensionManifest();
        
        // Generate deployment manifests
        await this.generateDeploymentManifests();
        
        // Generate documentation manifests
        await this.generateDocumentationManifest();
        
        this.log('✅ Manifests generated');
    }
    
    async generateExtensionManifest() {
        const manifestPath = path.join(this.rootDir, 'web-interface/extension/manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Dynamic configuration based on environment
        if (this.config.environment === 'development') {
            manifest.name = `${manifest.name} (Dev)`;
            manifest.version = `${manifest.version}.${Date.now()}`;
        }
        
        // Add permissions based on configuration
        const config = await this.loadUserConfig();
        if (config.platforms) {
            const permissions = this.generatePermissionsFromPlatforms(config.platforms);
            manifest.permissions = [...new Set([...manifest.permissions, ...permissions])];
        }
        
        // Write updated manifest
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        this.log('📋 Extension manifest updated');
    }
    
    async packageForDeployment() {
        this.log('📦 Packaging for deployment...');
        
        const deployDir = path.join(this.rootDir, 'dist');
        if (!fs.existsSync(deployDir)) {
            fs.mkdirSync(deployDir, { recursive: true });
        }
        
        // Package extension
        await this.packageExtension(deployDir);
        
        // Package web interface
        await this.packageWebInterface(deployDir);
        
        // Package Docker images (if in production)
        if (this.config.environment === 'production') {
            await this.packageDockerImages(deployDir);
        }
        
        this.log('✅ Packaging complete');
    }
    
    async runTests() {
        this.log('🧪 Running tests...');
        
        try {
            // Run unit tests
            await this.execCommand('npm test', { cwd: this.rootDir });
            
            // Run integration tests
            await this.execCommand('npm run test:integration', { 
                cwd: path.join(this.rootDir, 'web-interface') 
            });
            
            // Run extension tests
            await this.runExtensionTests();
            
            this.log('✅ All tests passed');
            
        } catch (error) {
            console.warn(chalk.yellow('⚠️  Some tests failed - check logs for details'));
            if (this.config.environment === 'production') {
                throw new Error('Tests must pass in production builds');
            }
        }
    }
    
    // Utility methods
    
    getExtensionBuildCommand() {
        // Create webpack config for extension if it doesn't exist
        const webpackConfigPath = path.join(this.rootDir, 'web-interface/webpack.extension.js');
        
        if (!fs.existsSync(webpackConfigPath)) {
            this.createExtensionWebpackConfig();
        }
        
        return 'npx webpack --config webpack.extension.js';
    }
    
    createExtensionWebpackConfig() {
        const webpackConfig = `
const path = require('path');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: {
        background: './extension/background.js',
        content: './extension/content/universal-content-detector.js'
    },
    output: {
        path: path.resolve(__dirname, 'extension/dist'),
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    plugins: [],
    devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false
};
        `;
        
        fs.writeFileSync(
            path.join(this.rootDir, 'web-interface/webpack.extension.js'), 
            webpackConfig.trim()
        );
    }
    
    async installDependencies(name, component) {
        this.log(`📦 Installing dependencies for ${name}...`);
        
        try {
            await this.execCommand('npm ci', {
                cwd: path.join(this.rootDir, component.path)
            });
        } catch (error) {
            // Fallback to npm install
            await this.execCommand('npm install', {
                cwd: path.join(this.rootDir, component.path)
            });
        }
    }
    
    findDependencyConflicts(packages) {
        const conflicts = [];
        const allDeps = {};
        
        // Collect all dependencies
        for (const [name, pkg] of Object.entries(packages)) {
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            for (const [depName, version] of Object.entries(deps)) {
                if (!allDeps[depName]) {
                    allDeps[depName] = [];
                }
                allDeps[depName].push({ package: name, version });
            }
        }
        
        // Find conflicts
        for (const [depName, versions] of Object.entries(allDeps)) {
            const uniqueVersions = [...new Set(versions.map(v => v.version))];
            if (uniqueVersions.length > 1) {
                conflicts.push({
                    package: depName,
                    versions: uniqueVersions
                });
            }
        }
        
        return conflicts;
    }
    
    groupByPriority(components) {
        const groups = {};
        for (const [name, component] of components) {
            if (!groups[component.priority]) {
                groups[component.priority] = [];
            }
            groups[component.priority].push([name, component]);
        }
        
        return Object.keys(groups)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(priority => groups[priority]);
    }
    
    async execCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn('sh', ['-c', command], {
                stdio: this.config.verbose ? 'inherit' : 'pipe',
                ...options
            });
            
            let output = '';
            if (!this.config.verbose) {
                child.stdout?.on('data', (data) => output += data);
                child.stderr?.on('data', (data) => output += data);
            }
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Command failed with code ${code}: ${command}\n${output}`));
                }
            });
        });
    }
    
    isVersionValid(current, required) {
        const currentParts = current.split('.').map(Number);
        const requiredParts = required.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const requiredPart = requiredParts[i] || 0;
            
            if (currentPart > requiredPart) return true;
            if (currentPart < requiredPart) return false;
        }
        
        return true;
    }
    
    async loadUserConfig() {
        const configPath = path.join(this.rootDir, 'config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return {};
    }
    
    generatePermissionsFromPlatforms(platforms) {
        const platformPermissions = {
            youtube: ['*://*.youtube.com/*', '*://*.googleapis.com/*'],
            reddit: ['*://*.reddit.com/*'],
            twitter: ['*://*.twitter.com/*', '*://*.x.com/*'],
            discord: ['*://*.discord.com/*'],
            telegram: ['*://*.telegram.org/*']
        };
        
        return platforms.flatMap(platform => platformPermissions[platform] || []);
    }
    
    async packageExtension(deployDir) {
        const extensionDir = path.join(this.rootDir, 'web-interface/extension');
        const packagePath = path.join(deployDir, 'extension.zip');
        
        await this.execCommand(`cd "${extensionDir}" && zip -r "${packagePath}" . -x "node_modules/*" "*.log"`);
        this.log('📦 Extension packaged');
    }
    
    async packageWebInterface(deployDir) {
        const webDir = path.join(this.rootDir, 'web-interface/.next');
        const packagePath = path.join(deployDir, 'web-interface.tar.gz');
        
        if (fs.existsSync(webDir)) {
            await this.execCommand(`cd "${webDir}" && tar -czf "${packagePath}" .`);
            this.log('📦 Web interface packaged');
        }
    }
    
    async packageDockerImages(deployDir) {
        try {
            await this.execCommand('docker-compose build', { cwd: this.rootDir });
            await this.execCommand(`docker save document-generator > ${deployDir}/docker-images.tar`);
            this.log('📦 Docker images packaged');
        } catch (error) {
            console.warn(chalk.yellow('⚠️  Docker packaging failed - skipping'));
        }
    }
    
    async runExtensionTests() {
        // Create basic extension test if it doesn't exist
        const testDir = path.join(this.rootDir, 'web-interface/extension/tests');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
            
            const basicTest = `
// Basic extension test
describe('Extension', () => {
    test('manifest is valid', () => {
        const manifest = require('../manifest.json');
        expect(manifest.manifest_version).toBe(3);
        expect(manifest.name).toBeDefined();
        expect(manifest.version).toBeDefined();
    });
});
            `;
            
            fs.writeFileSync(path.join(testDir, 'basic.test.js'), basicTest.trim());
        }
        
        await this.execCommand('npx jest extension/tests', {
            cwd: path.join(this.rootDir, 'web-interface')
        });
    }
    
    async generateDeploymentManifests() {
        const deploymentManifest = {
            version: this.getVersion(),
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            components: Object.keys(this.components),
            deployment: {
                web: {
                    type: 'nextjs',
                    port: 3000,
                    env: ['NODE_ENV', 'DATABASE_URL']
                },
                extension: {
                    type: 'chrome-extension',
                    version: this.getExtensionVersion()
                },
                services: {
                    postgres: { port: 5432 },
                    redis: { port: 6379 },
                    ollama: { port: 11434 }
                }
            }
        };
        
        fs.writeFileSync(
            path.join(this.rootDir, 'deployment-manifest.json'),
            JSON.stringify(deploymentManifest, null, 2)
        );
    }
    
    async generateDocumentationManifest() {
        const docs = {
            components: [],
            apis: [],
            deployment: [],
            usage: []
        };
        
        // Scan for documentation
        const docFiles = this.findDocumentationFiles();
        
        docs.components = docFiles.filter(f => f.includes('README') || f.includes('COMPONENT'));
        docs.apis = docFiles.filter(f => f.includes('API') || f.includes('api'));
        docs.deployment = docFiles.filter(f => f.includes('DEPLOY') || f.includes('deploy'));
        docs.usage = docFiles.filter(f => f.includes('USAGE') || f.includes('GUIDE'));
        
        fs.writeFileSync(
            path.join(this.rootDir, 'documentation-manifest.json'),
            JSON.stringify(docs, null, 2)
        );
    }
    
    findDocumentationFiles() {
        const files = [];
        const scanDir = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDir(fullPath);
                } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.txt'))) {
                    files.push(fullPath.replace(this.rootDir, '.'));
                }
            }
        };
        
        scanDir(this.rootDir);
        return files;
    }
    
    getVersion() {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
        return pkg.version;
    }
    
    getExtensionVersion() {
        const manifest = JSON.parse(fs.readFileSync(
            path.join(this.rootDir, 'web-interface/extension/manifest.json'), 
            'utf8'
        ));
        return manifest.version;
    }
    
    printBuildSummary() {
        const totalTime = Date.now() - this.startTime;
        
        console.log('\n' + '═'.repeat(60));
        console.log(chalk.green.bold('✅ Build completed successfully!'));
        console.log('═'.repeat(60));
        
        console.log(chalk.blue.bold('📊 Build Summary:'));
        console.log(chalk.gray(`Total time: ${totalTime}ms`));
        console.log(chalk.gray(`Environment: ${this.config.environment}`));
        
        console.log('\n📦 Components:');
        for (const [name, status] of this.buildStatus) {
            if (status.success) {
                console.log(chalk.green(`  ✅ ${name} (${status.duration}ms)`));
            } else {
                console.log(chalk.red(`  ❌ ${name} - ${status.error}`));
            }
        }
        
        console.log('\n🚀 Next steps:');
        console.log('  1. Deploy with: npm run deploy');
        console.log('  2. Test with: npm run test:e2e');
        console.log('  3. Monitor with: npm run monitor');
        
        console.log('\n📁 Output files:');
        console.log('  - dist/extension.zip (Chrome extension)');
        console.log('  - dist/web-interface.tar.gz (Web app)');
        console.log('  - deployment-manifest.json (Deployment config)');
        console.log('  - documentation-manifest.json (Docs index)');
        
        console.log('\n' + '═'.repeat(60));
    }
    
    log(message) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(chalk.gray(`[${timestamp}]`), message);
    }
}

// CLI interface
if (require.main === module) {
    const orchestrator = new BuildOrchestrator();
    
    const args = process.argv.slice(2);
    const options = {
        sequential: args.includes('--sequential'),
        skipTests: args.includes('--skip-tests'),
        verbose: args.includes('--verbose')
    };
    
    orchestrator.build(options).catch(error => {
        console.error(chalk.red.bold('Build failed:'), error.message);
        process.exit(1);
    });
}

module.exports = BuildOrchestrator;