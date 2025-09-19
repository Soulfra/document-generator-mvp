#!/usr/bin/env node

/**
 * FORMULA ENGINE - Internal Building Recipes System
 * 
 * Advanced formula system for building software internally using
 * discovered OSS packages. Creates recipes, manages dependencies,
 * and provides building workflows.
 * 
 * Features:
 * - Recipe creation from discovered packages
 * - Dependency resolution and management
 * - Build pipeline generation
 * - Template-based formula construction
 * - Version compatibility checking
 * - Automated testing workflows
 * - Deployment recipe generation
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

console.log(`
🔨 FORMULA ENGINE - BUILDING RECIPES 🔨
======================================
📋 Recipe creation & management
🔗 Dependency resolution system
🏗️ Build pipeline generation
📦 Package compatibility checking
🚀 Deployment workflow creation
`);

class FormulaEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 8778,
            formulaDbPath: options.formulaDbPath || './formula-engine.db',
            recipesPath: options.recipesPath || './recipes',
            templatesPath: options.templatesPath || './formula-templates',
            maxRecipeComplexity: options.maxRecipeComplexity || 10,
            ...options
        };
        
        // Formula system state
        this.state = {
            formulas: new Map(),
            recipes: new Map(),
            templates: new Map(),
            buildPipelines: new Map(),
            dependencies: new Map(),
            compatibilityMatrix: new Map()
        };
        
        // Recipe templates for different types of projects
        this.recipeTemplates = {
            'web-app': {
                name: 'Web Application Recipe',
                description: 'Build a complete web application',
                required: ['frontend-framework', 'backend-server', 'database'],
                optional: ['ui-library', 'state-management', 'testing-framework'],
                steps: [
                    'setup-project-structure',
                    'install-dependencies',
                    'configure-build-tools',
                    'setup-development-server',
                    'configure-testing',
                    'setup-deployment'
                ]
            },
            'api-service': {
                name: 'API Service Recipe',
                description: 'Build a RESTful API service',
                required: ['web-framework', 'database', 'validation'],
                optional: ['authentication', 'documentation', 'monitoring'],
                steps: [
                    'setup-server-framework',
                    'configure-database',
                    'setup-api-routes',
                    'add-validation',
                    'configure-testing',
                    'setup-deployment'
                ]
            },
            'cli-tool': {
                name: 'CLI Tool Recipe',
                description: 'Build a command-line tool',
                required: ['cli-framework', 'argument-parser'],
                optional: ['config-management', 'logging', 'testing'],
                steps: [
                    'setup-cli-structure',
                    'configure-argument-parsing',
                    'implement-commands',
                    'add-configuration',
                    'setup-packaging',
                    'create-installation'
                ]
            },
            'library': {
                name: 'Library Recipe',
                description: 'Build a reusable library',
                required: ['build-tools', 'testing-framework'],
                optional: ['documentation', 'typescript', 'bundler'],
                steps: [
                    'setup-library-structure',
                    'configure-build-tools',
                    'setup-testing',
                    'configure-documentation',
                    'setup-publishing',
                    'create-examples'
                ]
            },
            'desktop-app': {
                name: 'Desktop Application Recipe',
                description: 'Build a desktop application',
                required: ['desktop-framework', 'ui-framework'],
                optional: ['native-modules', 'auto-updater', 'installer'],
                steps: [
                    'setup-electron-app',
                    'configure-ui-framework',
                    'setup-main-process',
                    'configure-packaging',
                    'setup-auto-updater',
                    'create-installers'
                ]
            }
        };
        
        // Build pipeline templates
        this.pipelineTemplates = {
            'basic': {
                stages: ['install', 'build', 'test', 'package'],
                parallel: false
            },
            'advanced': {
                stages: ['install', 'lint', 'build', 'test', 'security-scan', 'package', 'deploy'],
                parallel: true,
                parallelStages: [['lint', 'security-scan'], ['test']]
            },
            'microservice': {
                stages: ['install', 'build', 'test', 'docker-build', 'deploy-staging', 'integration-test', 'deploy-production'],
                parallel: true,
                parallelStages: [['build', 'test'], ['docker-build']]
            }
        };
        
        this.app = express();
        this.db = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Formula Engine...');
        
        try {
            // Setup database
            await this.setupDatabase();
            
            // Load existing data
            await this.loadFormulaData();
            
            // Setup directory structure
            await this.setupDirectories();
            
            // Load templates
            await this.loadTemplates();
            
            // Setup HTTP server
            await this.setupServer();
            
            console.log('✅ Formula Engine initialized!');
            console.log(`🌐 Formula API: http://localhost:${this.config.port}`);
            console.log(`📋 Loaded ${this.state.templates.size} templates`);
            
            this.emit('formula_engine_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Formula Engine:', error);
            throw error;
        }
    }
    
    /**
     * Setup SQLite database for formula persistence
     */
    async setupDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.formulaDbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const createTables = `
                    CREATE TABLE IF NOT EXISTS formulas (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        type TEXT NOT NULL,
                        version TEXT DEFAULT '1.0.0',
                        created_at INTEGER,
                        updated_at INTEGER,
                        formula_data TEXT NOT NULL,
                        dependencies TEXT,
                        build_steps TEXT,
                        status TEXT DEFAULT 'draft'
                    );
                    
                    CREATE TABLE IF NOT EXISTS recipes (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        template_type TEXT NOT NULL,
                        created_at INTEGER,
                        packages TEXT NOT NULL,
                        configuration TEXT,
                        build_pipeline TEXT,
                        status TEXT DEFAULT 'active'
                    );
                    
                    CREATE TABLE IF NOT EXISTS build_pipelines (
                        id TEXT PRIMARY KEY,
                        recipe_id TEXT NOT NULL,
                        pipeline_data TEXT NOT NULL,
                        created_at INTEGER,
                        last_run INTEGER,
                        status TEXT DEFAULT 'ready',
                        FOREIGN KEY (recipe_id) REFERENCES recipes (id)
                    );
                    
                    CREATE TABLE IF NOT EXISTS dependency_matrix (
                        id TEXT PRIMARY KEY,
                        package_a TEXT NOT NULL,
                        package_b TEXT NOT NULL,
                        compatibility TEXT NOT NULL,
                        version_range TEXT,
                        notes TEXT,
                        tested_at INTEGER
                    );
                    
                    CREATE TABLE IF NOT EXISTS build_history (
                        id TEXT PRIMARY KEY,
                        recipe_id TEXT NOT NULL,
                        pipeline_id TEXT NOT NULL,
                        started_at INTEGER,
                        completed_at INTEGER,
                        status TEXT NOT NULL,
                        logs TEXT,
                        artifacts TEXT,
                        FOREIGN KEY (recipe_id) REFERENCES recipes (id),
                        FOREIGN KEY (pipeline_id) REFERENCES build_pipelines (id)
                    );
                `;
                
                this.db.exec(createTables, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
    
    /**
     * Load existing formula data from database
     */
    async loadFormulaData() {
        return new Promise((resolve, reject) => {
            // Load formulas
            this.db.all('SELECT * FROM formulas', (err, formulas) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                formulas.forEach(formula => {
                    this.state.formulas.set(formula.id, {
                        ...formula,
                        formula_data: JSON.parse(formula.formula_data),
                        dependencies: formula.dependencies ? JSON.parse(formula.dependencies) : [],
                        build_steps: formula.build_steps ? JSON.parse(formula.build_steps) : []
                    });
                });
                
                // Load recipes
                this.db.all('SELECT * FROM recipes', (err, recipes) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    recipes.forEach(recipe => {
                        this.state.recipes.set(recipe.id, {
                            ...recipe,
                            packages: JSON.parse(recipe.packages),
                            configuration: recipe.configuration ? JSON.parse(recipe.configuration) : {},
                            build_pipeline: recipe.build_pipeline ? JSON.parse(recipe.build_pipeline) : {}
                        });
                    });
                    
                    console.log(`📚 Loaded ${this.state.formulas.size} formulas and ${this.state.recipes.size} recipes`);
                    resolve();
                });
            });
        });
    }
    
    /**
     * Setup directory structure
     */
    async setupDirectories() {
        const dirs = [
            this.config.recipesPath,
            this.config.templatesPath,
            path.join(this.config.recipesPath, 'generated'),
            path.join(this.config.recipesPath, 'builds'),
            path.join(this.config.recipesPath, 'artifacts')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    /**
     * Load recipe templates
     */
    async loadTemplates() {
        // Load built-in templates
        for (const [id, template] of Object.entries(this.recipeTemplates)) {
            this.state.templates.set(id, template);
        }
        
        // Load custom templates from filesystem
        try {
            const templateFiles = await fs.readdir(this.config.templatesPath);
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    const templatePath = path.join(this.config.templatesPath, file);
                    const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
                    const templateId = path.basename(file, '.json');
                    this.state.templates.set(templateId, templateData);
                }
            }
        } catch (error) {
            console.log('📁 No custom templates found');
        }
    }
    
    /**
     * Setup HTTP server
     */
    async setupServer() {
        this.app.use(express.json());
        
        // Formula management endpoints
        this.app.get('/api/formulas', (req, res) => {
            res.json(Array.from(this.state.formulas.values()));
        });
        
        this.app.post('/api/formulas/create', async (req, res) => {
            try {
                const formula = await this.createFormula(req.body);
                res.json(formula);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.get('/api/recipes', (req, res) => {
            res.json(Array.from(this.state.recipes.values()));
        });
        
        this.app.post('/api/recipes/create', async (req, res) => {
            try {
                const recipe = await this.createRecipe(req.body);
                res.json(recipe);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.post('/api/recipes/:id/build', async (req, res) => {
            try {
                const result = await this.buildRecipe(req.params.id, req.body);
                res.json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.get('/api/templates', (req, res) => {
            res.json(Array.from(this.state.templates.entries()).map(([id, template]) => ({
                id,
                ...template
            })));
        });
        
        this.app.post('/api/analyze-packages', async (req, res) => {
            try {
                const analysis = await this.analyzePackageCompatibility(req.body.packages);
                res.json(analysis);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        this.app.get('/api/dashboard', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`🌐 Formula Engine server running on port ${this.config.port}`);
        });
    }
    
    /**
     * Create a new formula
     */
    async createFormula(formulaData) {
        const formulaId = crypto.randomUUID();
        
        const formula = {
            id: formulaId,
            name: formulaData.name,
            description: formulaData.description || '',
            type: formulaData.type || 'custom',
            version: formulaData.version || '1.0.0',
            created_at: Date.now(),
            updated_at: Date.now(),
            formula_data: formulaData.formula_data || {},
            dependencies: formulaData.dependencies || [],
            build_steps: formulaData.build_steps || [],
            status: 'draft'
        };
        
        // Validate formula
        await this.validateFormula(formula);
        
        // Save to database
        await this.saveFormula(formula);
        
        // Save to filesystem
        await this.saveFormulaFile(formula);
        
        this.state.formulas.set(formulaId, formula);
        
        console.log(`🔨 Created formula: ${formula.name}`);
        this.emit('formula_created', formula);
        
        return formula;
    }
    
    /**
     * Create a new recipe from packages and template
     */
    async createRecipe(recipeData) {
        const recipeId = crypto.randomUUID();
        
        const template = this.state.templates.get(recipeData.template_type);
        if (!template) {
            throw new Error(`Unknown template type: ${recipeData.template_type}`);
        }
        
        // Analyze package compatibility
        const compatibility = await this.analyzePackageCompatibility(recipeData.packages);
        if (!compatibility.compatible) {
            throw new Error(`Package compatibility issues: ${compatibility.issues.join(', ')}`);
        }
        
        // Generate configuration based on template and packages
        const configuration = await this.generateRecipeConfiguration(template, recipeData.packages);
        
        // Create build pipeline
        const buildPipeline = await this.createBuildPipeline(template, recipeData.packages);
        
        const recipe = {
            id: recipeId,
            name: recipeData.name,
            description: recipeData.description || `${template.name} with ${recipeData.packages.length} packages`,
            template_type: recipeData.template_type,
            created_at: Date.now(),
            packages: recipeData.packages,
            configuration: configuration,
            build_pipeline: buildPipeline,
            status: 'active'
        };
        
        // Save to database
        await this.saveRecipe(recipe);
        
        // Generate recipe files
        await this.generateRecipeFiles(recipe);
        
        this.state.recipes.set(recipeId, recipe);
        
        console.log(`📋 Created recipe: ${recipe.name}`);
        this.emit('recipe_created', recipe);
        
        return recipe;
    }
    
    /**
     * Analyze package compatibility
     */
    async analyzePackageCompatibility(packages) {
        const analysis = {
            compatible: true,
            issues: [],
            recommendations: [],
            matrix: new Map()
        };
        
        // Check each package pair for compatibility
        for (let i = 0; i < packages.length; i++) {
            for (let j = i + 1; j < packages.length; j++) {
                const pkgA = packages[i];
                const pkgB = packages[j];
                
                const compatibility = await this.checkPackagePairCompatibility(pkgA, pkgB);
                analysis.matrix.set(`${pkgA.name}-${pkgB.name}`, compatibility);
                
                if (!compatibility.compatible) {
                    analysis.compatible = false;
                    analysis.issues.push(`${pkgA.name} incompatible with ${pkgB.name}: ${compatibility.reason}`);
                }
                
                if (compatibility.recommendation) {
                    analysis.recommendations.push(compatibility.recommendation);
                }
            }
        }
        
        // Check for common compatibility patterns
        await this.checkCommonCompatibilityPatterns(packages, analysis);
        
        return analysis;
    }
    
    /**
     * Check compatibility between two packages
     */
    async checkPackagePairCompatibility(pkgA, pkgB) {
        // Check database for known compatibility
        const known = await this.getKnownCompatibility(pkgA.name, pkgB.name);
        if (known) {
            return known;
        }
        
        // Analyze based on package metadata
        const compatibility = {
            compatible: true,
            confidence: 0.5,
            reason: null,
            recommendation: null
        };
        
        // Check for conflicting dependencies
        if (this.hasConflictingDependencies(pkgA, pkgB)) {
            compatibility.compatible = false;
            compatibility.reason = 'Conflicting dependencies detected';
            compatibility.confidence = 0.9;
        }
        
        // Check for framework conflicts
        if (this.hasFrameworkConflicts(pkgA, pkgB)) {
            compatibility.compatible = false;
            compatibility.reason = 'Framework conflicts detected';
            compatibility.confidence = 0.8;
        }
        
        // Check version compatibility
        const versionCompat = this.checkVersionCompatibility(pkgA, pkgB);
        if (!versionCompat.compatible) {
            compatibility.compatible = false;
            compatibility.reason = versionCompat.reason;
            compatibility.confidence = 0.7;
        }
        
        // Store in database for future reference
        await this.storeCompatibilityResult(pkgA.name, pkgB.name, compatibility);
        
        return compatibility;
    }
    
    /**
     * Generate recipe configuration
     */
    async generateRecipeConfiguration(template, packages) {
        const config = {
            name: `Generated ${template.name}`,
            template: template.name,
            packages: {},
            buildSettings: {},
            deploymentSettings: {},
            environment: {}
        };
        
        // Configure packages based on their roles
        packages.forEach(pkg => {
            const role = this.determinePackageRole(pkg, template);
            config.packages[role] = {
                name: pkg.name,
                version: pkg.version,
                source: pkg.source,
                configuration: this.getPackageConfiguration(pkg, role)
            };
        });
        
        // Generate build settings
        config.buildSettings = this.generateBuildSettings(template, packages);
        
        // Generate deployment settings
        config.deploymentSettings = this.generateDeploymentSettings(template, packages);
        
        // Set environment variables
        config.environment = this.generateEnvironmentConfig(packages);
        
        return config;
    }
    
    /**
     * Create build pipeline for recipe
     */
    async createBuildPipeline(template, packages) {
        const pipelineId = crypto.randomUUID();
        
        // Determine pipeline complexity based on packages
        const complexity = this.calculatePipelineComplexity(packages);
        const pipelineType = complexity > 5 ? 'advanced' : 'basic';
        
        const pipelineTemplate = this.pipelineTemplates[pipelineType];
        
        const pipeline = {
            id: pipelineId,
            type: pipelineType,
            stages: [],
            environment: {},
            artifacts: [],
            notifications: []
        };
        
        // Generate stages based on template and packages
        for (const stageName of pipelineTemplate.stages) {
            const stage = await this.generatePipelineStage(stageName, template, packages);
            pipeline.stages.push(stage);
        }
        
        // Configure parallel execution if supported
        if (pipelineTemplate.parallel && pipelineTemplate.parallelStages) {
            pipeline.parallelStages = pipelineTemplate.parallelStages;
        }
        
        // Save pipeline to database
        await this.saveBuildPipeline(pipeline);
        
        return pipeline;
    }
    
    /**
     * Generate pipeline stage
     */
    async generatePipelineStage(stageName, template, packages) {
        const stage = {
            name: stageName,
            commands: [],
            environment: {},
            artifacts: [],
            condition: null
        };
        
        switch (stageName) {
            case 'install':
                stage.commands = this.generateInstallCommands(packages);
                break;
                
            case 'build':
                stage.commands = this.generateBuildCommands(template, packages);
                break;
                
            case 'test':
                stage.commands = this.generateTestCommands(packages);
                break;
                
            case 'lint':
                stage.commands = this.generateLintCommands(packages);
                break;
                
            case 'security-scan':
                stage.commands = this.generateSecurityCommands(packages);
                break;
                
            case 'package':
                stage.commands = this.generatePackageCommands(template);
                stage.artifacts = ['dist/', 'build/', '*.tgz'];
                break;
                
            case 'docker-build':
                stage.commands = this.generateDockerCommands(template, packages);
                stage.artifacts = ['Dockerfile', 'docker-compose.yml'];
                break;
                
            case 'deploy':
                stage.commands = this.generateDeployCommands(template);
                break;
        }
        
        return stage;
    }
    
    /**
     * Build a recipe
     */
    async buildRecipe(recipeId, buildOptions = {}) {
        const recipe = this.state.recipes.get(recipeId);
        if (!recipe) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }
        
        const buildId = crypto.randomUUID();
        const build = {
            id: buildId,
            recipe_id: recipeId,
            started_at: Date.now(),
            status: 'running',
            logs: [],
            artifacts: [],
            options: buildOptions
        };
        
        console.log(`🏗️ Starting build for recipe: ${recipe.name}`);
        this.emit('build_started', { recipe, build });
        
        try {
            // Execute build pipeline
            await this.executeBuildPipeline(recipe, build);
            
            build.status = 'success';
            build.completed_at = Date.now();
            
            console.log(`✅ Build completed: ${recipe.name}`);
            this.emit('build_completed', { recipe, build });
            
        } catch (error) {
            build.status = 'failed';
            build.completed_at = Date.now();
            build.error = error.message;
            
            console.error(`❌ Build failed: ${recipe.name} - ${error.message}`);
            this.emit('build_failed', { recipe, build, error });
        }
        
        // Save build history
        await this.saveBuildHistory(build);
        
        return build;
    }
    
    /**
     * Execute build pipeline
     */
    async executeBuildPipeline(recipe, build) {
        const pipeline = recipe.build_pipeline;
        
        for (const stage of pipeline.stages) {
            build.logs.push(`📍 Starting stage: ${stage.name}`);
            
            try {
                await this.executeStage(stage, recipe, build);
                build.logs.push(`✅ Stage completed: ${stage.name}`);
            } catch (error) {
                build.logs.push(`❌ Stage failed: ${stage.name} - ${error.message}`);
                throw error;
            }
        }
    }
    
    /**
     * Execute a single pipeline stage
     */
    async executeStage(stage, recipe, build) {
        for (const command of stage.commands) {
            build.logs.push(`🔧 Executing: ${command}`);
            
            // Simulate command execution
            await this.delay(Math.random() * 2000 + 500);
            
            // Simulate occasional failures
            if (Math.random() < 0.05) { // 5% failure rate
                throw new Error(`Command failed: ${command}`);
            }
            
            build.logs.push(`✓ Command completed: ${command}`);
        }
        
        // Collect artifacts if specified
        if (stage.artifacts && stage.artifacts.length > 0) {
            build.artifacts.push(...stage.artifacts);
            build.logs.push(`📦 Artifacts collected: ${stage.artifacts.join(', ')}`);
        }
    }
    
    // Command generation methods
    
    generateInstallCommands(packages) {
        const commands = ['# Package installation'];
        
        packages.forEach(pkg => {
            if (pkg.source === 'npm') {
                commands.push(`npm install ${pkg.name}@${pkg.version}`);
            } else if (pkg.source === 'github') {
                commands.push(`npm install ${pkg.metadata?.url || pkg.name}`);
            }
        });
        
        return commands;
    }
    
    generateBuildCommands(template, packages) {
        const commands = ['# Build commands'];
        
        if (template.name.includes('Web Application')) {
            commands.push('npm run build');
        } else if (template.name.includes('API Service')) {
            commands.push('npm run compile', 'npm run build');
        } else if (template.name.includes('CLI Tool')) {
            commands.push('npm run build', 'chmod +x dist/cli');
        }
        
        return commands;
    }
    
    generateTestCommands(packages) {
        return [
            '# Test commands',
            'npm run test',
            'npm run test:coverage'
        ];
    }
    
    generateLintCommands(packages) {
        return [
            '# Linting commands',
            'npm run lint',
            'npm run format:check'
        ];
    }
    
    generateSecurityCommands(packages) {
        return [
            '# Security scanning',
            'npm audit',
            'npm audit fix'
        ];
    }
    
    generatePackageCommands(template) {
        return [
            '# Packaging commands',
            'npm pack',
            'tar -czf app.tar.gz dist/'
        ];
    }
    
    generateDockerCommands(template, packages) {
        return [
            '# Docker build',
            'docker build -t app:latest .',
            'docker tag app:latest app:$(git rev-parse --short HEAD)'
        ];
    }
    
    generateDeployCommands(template) {
        return [
            '# Deployment commands',
            'echo "Deploying application..."',
            'echo "Deployment complete!"'
        ];
    }
    
    // Utility methods
    
    determinePackageRole(pkg, template) {
        const keywords = pkg.metadata?.keywords || [];
        const description = (pkg.description || '').toLowerCase();
        
        if (keywords.includes('framework') || description.includes('framework')) {
            return 'framework';
        } else if (keywords.includes('database') || description.includes('database')) {
            return 'database';
        } else if (keywords.includes('ui') || description.includes('ui')) {
            return 'ui-library';
        } else if (keywords.includes('testing') || description.includes('test')) {
            return 'testing-framework';
        }
        
        return 'utility';
    }
    
    getPackageConfiguration(pkg, role) {
        const configs = {
            'framework': { main: true, priority: 'high' },
            'database': { connection: 'auto', migrations: true },
            'ui-library': { theme: 'default', components: 'all' },
            'testing-framework': { coverage: true, watch: false },
            'utility': { optional: true }
        };
        
        return configs[role] || { optional: true };
    }
    
    generateBuildSettings(template, packages) {
        return {
            target: 'production',
            minify: true,
            sourceMaps: false,
            optimization: true
        };
    }
    
    generateDeploymentSettings(template, packages) {
        return {
            platform: 'docker',
            replicas: 1,
            healthCheck: '/health',
            port: 3000
        };
    }
    
    generateEnvironmentConfig(packages) {
        return {
            NODE_ENV: 'production',
            PORT: '3000',
            PACKAGES_COUNT: packages.length.toString()
        };
    }
    
    calculatePipelineComplexity(packages) {
        let complexity = packages.length;
        
        packages.forEach(pkg => {
            if (pkg.source === 'github') complexity += 1;
            if (pkg.metadata?.keywords?.includes('framework')) complexity += 2;
            if (pkg.metadata?.keywords?.includes('database')) complexity += 1;
        });
        
        return complexity;
    }
    
    hasConflictingDependencies(pkgA, pkgB) {
        // Simplified conflict detection
        const conflictingPairs = [
            ['react', 'vue'],
            ['angular', 'react'],
            ['express', 'koa'],
            ['jest', 'mocha']
        ];
        
        return conflictingPairs.some(([a, b]) => 
            (pkgA.name.includes(a) && pkgB.name.includes(b)) ||
            (pkgA.name.includes(b) && pkgB.name.includes(a))
        );
    }
    
    hasFrameworkConflicts(pkgA, pkgB) {
        const frameworks = ['react', 'vue', 'angular', 'svelte'];
        const aFramework = frameworks.find(f => pkgA.name.includes(f));
        const bFramework = frameworks.find(f => pkgB.name.includes(f));
        
        return aFramework && bFramework && aFramework !== bFramework;
    }
    
    checkVersionCompatibility(pkgA, pkgB) {
        // Simplified version compatibility check
        return { compatible: true, reason: null };
    }
    
    async checkCommonCompatibilityPatterns(packages, analysis) {
        // Check for common incompatibility patterns
        const reactPackages = packages.filter(p => p.name.includes('react'));
        const vuePackages = packages.filter(p => p.name.includes('vue'));
        
        if (reactPackages.length > 0 && vuePackages.length > 0) {
            analysis.compatible = false;
            analysis.issues.push('Cannot mix React and Vue packages in same project');
        }
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Database operations
    
    async saveFormula(formula) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO formulas (id, name, description, type, version, created_at, updated_at, formula_data, dependencies, build_steps, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [formula.id, formula.name, formula.description, formula.type, formula.version, formula.created_at, formula.updated_at, JSON.stringify(formula.formula_data), JSON.stringify(formula.dependencies), JSON.stringify(formula.build_steps), formula.status],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async saveRecipe(recipe) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO recipes (id, name, description, template_type, created_at, packages, configuration, build_pipeline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [recipe.id, recipe.name, recipe.description, recipe.template_type, recipe.created_at, JSON.stringify(recipe.packages), JSON.stringify(recipe.configuration), JSON.stringify(recipe.build_pipeline), recipe.status],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async saveBuildPipeline(pipeline) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO build_pipelines (id, recipe_id, pipeline_data, created_at, status) VALUES (?, ?, ?, ?, ?)',
                [pipeline.id, '', JSON.stringify(pipeline), Date.now(), 'ready'],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async saveBuildHistory(build) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO build_history (id, recipe_id, pipeline_id, started_at, completed_at, status, logs, artifacts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [build.id, build.recipe_id, '', build.started_at, build.completed_at, build.status, JSON.stringify(build.logs), JSON.stringify(build.artifacts)],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async storeCompatibilityResult(pkgA, pkgB, compatibility) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO dependency_matrix (id, package_a, package_b, compatibility, notes, tested_at) VALUES (?, ?, ?, ?, ?, ?)',
                [`${pkgA}-${pkgB}`, pkgA, pkgB, compatibility.compatible ? 'compatible' : 'incompatible', compatibility.reason, Date.now()],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    async getKnownCompatibility(pkgA, pkgB) {
        return new Promise((resolve) => {
            this.db.get(
                'SELECT * FROM dependency_matrix WHERE (package_a = ? AND package_b = ?) OR (package_a = ? AND package_b = ?)',
                [pkgA, pkgB, pkgB, pkgA],
                (err, row) => {
                    if (err || !row) {
                        resolve(null);
                    } else {
                        resolve({
                            compatible: row.compatibility === 'compatible',
                            confidence: 0.9,
                            reason: row.notes,
                            cached: true
                        });
                    }
                }
            );
        });
    }
    
    async validateFormula(formula) {
        // Basic validation
        if (!formula.name) {
            throw new Error('Formula name is required');
        }
        
        if (!formula.formula_data) {
            throw new Error('Formula data is required');
        }
    }
    
    async saveFormulaFile(formula) {
        const formulaPath = path.join(this.config.recipesPath, 'generated', `${formula.name}.json`);
        await fs.writeFile(formulaPath, JSON.stringify(formula, null, 2));
    }
    
    async generateRecipeFiles(recipe) {
        const recipePath = path.join(this.config.recipesPath, recipe.id);
        await fs.mkdir(recipePath, { recursive: true });
        
        // Generate package.json
        const packageJson = {
            name: recipe.name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: recipe.description,
            dependencies: {},
            scripts: {
                build: 'npm run build:all',
                test: 'npm run test:all',
                start: 'node dist/index.js'
            }
        };
        
        recipe.packages.forEach(pkg => {
            packageJson.dependencies[pkg.name] = pkg.version;
        });
        
        await fs.writeFile(
            path.join(recipePath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        
        // Generate README
        const readme = `# ${recipe.name}

${recipe.description}

## Generated Recipe

This project was generated using the Formula Engine.

### Packages Used
${recipe.packages.map(pkg => `- ${pkg.name}@${pkg.version} (${pkg.source})`).join('\n')}

### Build Pipeline
${recipe.build_pipeline.stages.map(stage => `- ${stage.name}`).join('\n')}

### Getting Started

\`\`\`bash
npm install
npm run build
npm test
\`\`\`
`;
        
        await fs.writeFile(path.join(recipePath, 'README.md'), readme);
    }
    
    /**
     * Generate formula dashboard HTML
     */
    generateDashboard() {
        const formulas = Array.from(this.state.formulas.values());
        const recipes = Array.from(this.state.recipes.values());
        const templates = Array.from(this.state.templates.entries());
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>🔨 Formula Engine Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #ff6b35;
            margin-bottom: 10px;
        }
        
        .section {
            background: rgba(255,255,255,0.05);
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .item {
            background: rgba(255,255,255,0.1);
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ff6b35;
        }
        
        .template-item {
            background: rgba(255,255,255,0.1);
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f7931e;
        }
        
        .btn {
            background: #ff6b35;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        
        .btn:hover {
            background: #f7931e;
        }
        
        .btn-secondary {
            background: #666;
        }
        
        .btn-secondary:hover {
            background: #777;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔨 Formula Engine Dashboard</h1>
        <p>Internal Building Recipes & Formula System</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${formulas.length}</div>
            <div>Formulas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${recipes.length}</div>
            <div>Recipes</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${templates.length}</div>
            <div>Templates</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${this.state.buildPipelines.size}</div>
            <div>Build Pipelines</div>
        </div>
    </div>
    
    <div class="section">
        <h2>📋 Recipe Templates</h2>
        ${templates.map(([id, template]) => `
            <div class="template-item">
                <strong>${template.name}</strong><br>
                ${template.description}<br>
                <small>Required: ${template.required?.join(', ') || 'None'}</small><br>
                <button class="btn" onclick="createRecipe('${id}')">Use Template</button>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>🔨 Recent Formulas</h2>
        ${formulas.slice(-5).map(formula => `
            <div class="item">
                <strong>${formula.name}</strong> (v${formula.version})<br>
                ${formula.description}<br>
                Status: ${formula.status}<br>
                <small>Created: ${new Date(formula.created_at).toLocaleString()}</small>
            </div>
        `).join('')}
        ${formulas.length === 0 ? '<p>No formulas created yet.</p>' : ''}
    </div>
    
    <div class="section">
        <h2>📦 Active Recipes</h2>
        ${recipes.slice(-5).map(recipe => `
            <div class="item">
                <strong>${recipe.name}</strong><br>
                Template: ${recipe.template_type}<br>
                Packages: ${recipe.packages.length}<br>
                <small>Created: ${new Date(recipe.created_at).toLocaleString()}</small><br>
                <button class="btn" onclick="buildRecipe('${recipe.id}')">Build</button>
                <button class="btn btn-secondary" onclick="viewRecipe('${recipe.id}')">View</button>
            </div>
        `).join('')}
        ${recipes.length === 0 ? '<p>No recipes created yet.</p>' : ''}
    </div>
    
    <div class="section">
        <h2>🛠️ Actions</h2>
        <button class="btn" onclick="showCreateFormula()">Create Formula</button>
        <button class="btn" onclick="showAnalyzePackages()">Analyze Packages</button>
        <button class="btn" onclick="refreshData()">Refresh</button>
    </div>
    
    <script>
        async function createRecipe(templateType) {
            const name = prompt('Recipe name:');
            if (!name) return;
            
            // This would normally show a package selection interface
            const packages = [
                { name: 'express', version: '4.18.0', source: 'npm' },
                { name: 'react', version: '18.0.0', source: 'npm' }
            ];
            
            try {
                const response = await fetch('/api/recipes/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        template_type: templateType,
                        packages: packages
                    })
                });
                
                if (response.ok) {
                    alert('Recipe created successfully!');
                    location.reload();
                } else {
                    const error = await response.json();
                    alert(\`Failed to create recipe: \${error.error}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        async function buildRecipe(recipeId) {
            try {
                const response = await fetch(\`/api/recipes/\${recipeId}/build\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                
                if (response.ok) {
                    const build = await response.json();
                    alert(\`Build started: \${build.id}\`);
                } else {
                    const error = await response.json();
                    alert(\`Failed to start build: \${error.error}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        function viewRecipe(recipeId) {
            window.open(\`/api/recipes\`, '_blank');
        }
        
        function showCreateFormula() {
            alert('Formula creation interface would open here');
        }
        
        function showAnalyzePackages() {
            alert('Package analysis interface would open here');
        }
        
        function refreshData() {
            location.reload();
        }
        
        // Auto-refresh every 60 seconds
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>`;
    }
}

// Export for integration with Electron app
module.exports = FormulaEngine;

// Run standalone if called directly
if (require.main === module) {
    const formulaEngine = new FormulaEngine({ port: 8778 });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Formula Engine...');
        if (formulaEngine.db) {
            formulaEngine.db.close();
        }
        process.exit(0);
    });
}