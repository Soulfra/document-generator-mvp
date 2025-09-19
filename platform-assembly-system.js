#!/usr/bin/env node

/**
 * 🏗️ PLATFORM ASSEMBLY & AUTO-DEPLOYMENT SYSTEM
 * Orchestrates platform building and deployment for Bob the Builder
 * Takes templates, components, and user requirements → Working deployed platform
 */

require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { WebSocketServer } = require('ws');

class PlatformAssemblySystem {
    constructor(config = {}) {
        this.config = {
            workingDir: config.workingDir || './generated-platforms',
            templatesDir: config.templatesDir || './web-interface/templates',
            deployments: {
                railway: { enabled: true, timeout: 300000 },
                vercel: { enabled: true, timeout: 180000 },
                docker: { enabled: true, timeout: 120000 },
                github: { enabled: true, timeout: 60000 }
            },
            wsPort: config.wsPort || 9001,
            ...config
        };
        
        // Assembly state tracking
        this.activeBuilds = new Map();
        this.buildQueue = [];
        this.templateCache = new Map();
        this.componentRegistry = new Map();
        
        // WebSocket for real-time updates
        this.wss = null;
        this.db = null;
        
        console.log('🏗️ Platform Assembly System initializing...');
    }
    
    async init() {
        // Initialize database for build tracking
        await this.initDatabase();
        
        // Setup WebSocket server for real-time updates
        this.wss = new WebSocketServer({ port: this.config.wsPort });
        this.wss.on('connection', (ws) => this.handleWebSocket(ws));
        
        // Load templates and components
        await this.loadTemplates();
        await this.loadComponents();
        
        // Ensure working directory exists
        await fs.mkdir(this.config.workingDir, { recursive: true });
        
        console.log(`🏗️ Platform Assembly System ready on ws://localhost:${this.config.wsPort}`);
        console.log(`📁 Working directory: ${this.config.workingDir}`);
        console.log(`📋 Loaded ${this.templateCache.size} templates, ${this.componentRegistry.size} components`);
        
        return this;
    }
    
    async initDatabase() {
        this.db = new sqlite3.Database('./platform-builds.db');
        
        await new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS platform_builds (
                    build_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    platform_name TEXT,
                    template_id TEXT,
                    components TEXT,
                    status TEXT DEFAULT 'queued',
                    progress INTEGER DEFAULT 0,
                    error_message TEXT,
                    github_repo TEXT,
                    deployed_urls TEXT,
                    cost_estimate REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS deployment_logs (
                    log_id TEXT PRIMARY KEY,
                    build_id TEXT,
                    deployment_type TEXT,
                    status TEXT,
                    url TEXT,
                    logs TEXT,
                    duration INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (build_id) REFERENCES platform_builds(build_id)
                );
                
                CREATE TABLE IF NOT EXISTS component_usage (
                    usage_id TEXT PRIMARY KEY,
                    build_id TEXT,
                    component_name TEXT,
                    version TEXT,
                    configuration TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (build_id) REFERENCES platform_builds(build_id)
                );
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('💾 Build tracking database initialized');
    }
    
    async loadTemplates() {
        try {
            // Load template library
            const templateLibraryPath = path.join(this.config.templatesDir, 'template-library.js');
            if (await this.fileExists(templateLibraryPath)) {
                delete require.cache[require.resolve(templateLibraryPath)];
                const { templateLibrary } = require(templateLibraryPath);
                
                Object.entries(templateLibrary).forEach(([id, template]) => {
                    this.templateCache.set(id, template);
                });
                
                console.log(`📋 Loaded ${this.templateCache.size} platform templates`);
            }
        } catch (error) {
            console.error('❌ Failed to load templates:', error);
        }
    }
    
    async loadComponents() {
        try {
            // Load component graph system
            const componentGraphPath = './component-graph-simple.js';
            if (await this.fileExists(componentGraphPath)) {
                delete require.cache[require.resolve(componentGraphPath)];
                const ComponentGraph = require(componentGraphPath);
                const componentGraph = new ComponentGraph();
                
                // Register all available components
                const componentTypes = [
                    'auth', 'database', 'api', 'frontend', 'payment', 'storage',
                    'analytics', 'monitoring', 'cdn', 'search', 'notification',
                    'queue', 'cache', 'logging', 'security', 'testing'
                ];
                
                componentTypes.forEach(type => {
                    this.componentRegistry.set(type, {
                        type,
                        versions: ['latest', '1.0.0'],
                        dependencies: componentGraph.getDependencies(type),
                        configs: this.getComponentConfigs(type)
                    });
                });
                
                console.log(`🔧 Registered ${this.componentRegistry.size} component types`);
            }
        } catch (error) {
            console.error('❌ Failed to load components:', error);
        }
    }
    
    // Main platform assembly method
    async assemblePlatform(buildRequest) {
        const buildId = this.generateBuildId();
        const {
            userId,
            platformName,
            templateId,
            userRequirements,
            deploymentTargets = ['github', 'railway'],
            storyMode = false
        } = buildRequest;
        
        console.log(`🏗️ Starting platform assembly: ${buildId}`);
        console.log(`📝 Template: ${templateId}, Platform: ${platformName}`);
        
        // Create build record
        await this.createBuildRecord(buildId, buildRequest);
        
        // Add to build queue
        this.buildQueue.push(buildId);
        
        // Start assembly process
        this.processBuild(buildId).catch(error => {
            console.error(`❌ Build ${buildId} failed:`, error);
            this.updateBuildStatus(buildId, 'failed', error.message);
        });
        
        return {
            buildId,
            status: 'queued',
            platformName,
            estimatedTime: this.estimateBuildTime(templateId),
            websocketUrl: `ws://localhost:${this.config.wsPort}`
        };
    }
    
    async processBuild(buildId) {
        const build = await this.getBuildRecord(buildId);
        if (!build) {
            throw new Error(`Build ${buildId} not found`);
        }
        
        this.activeBuilds.set(buildId, { status: 'building', progress: 0 });
        this.updateBuildStatus(buildId, 'building', null, 5);
        this.broadcastUpdate(buildId, { status: 'building', progress: 5, message: 'Preparing build environment...' });
        
        try {
            // Step 1: Setup build environment
            const buildDir = await this.setupBuildEnvironment(buildId, build);
            this.updateProgress(buildId, 15);
            
            // Step 2: Generate platform structure
            await this.generatePlatformStructure(buildId, build, buildDir);
            this.updateProgress(buildId, 30);
            
            // Step 3: Assemble components
            await this.assembleComponents(buildId, build, buildDir);
            this.updateProgress(buildId, 50);
            
            // Step 4: Configure integrations
            await this.configureIntegrations(buildId, build, buildDir);
            this.updateProgress(buildId, 65);
            
            // Step 5: Generate configuration files
            await this.generateConfigFiles(buildId, build, buildDir);
            this.updateProgress(buildId, 75);
            
            // Step 6: Create GitHub repository
            const repoUrl = await this.createGitHubRepo(buildId, build, buildDir);
            this.updateProgress(buildId, 85);
            
            // Step 7: Deploy to targets
            const deployedUrls = await this.deployToTargets(buildId, build, buildDir);
            this.updateProgress(buildId, 100);
            
            // Complete build
            await this.completeBuild(buildId, repoUrl, deployedUrls);
            
            console.log(`✅ Platform assembly complete: ${buildId}`);
            console.log(`🚀 Deployed URLs:`, deployedUrls);
            
            return {
                buildId,
                status: 'completed',
                repoUrl,
                deployedUrls,
                buildDir
            };
            
        } catch (error) {
            console.error(`❌ Build failed: ${buildId}:`, error);
            await this.updateBuildStatus(buildId, 'failed', error.message);
            throw error;
        } finally {
            this.activeBuilds.delete(buildId);
        }
    }
    
    async setupBuildEnvironment(buildId, build) {
        const buildDir = path.join(this.config.workingDir, buildId);
        await fs.mkdir(buildDir, { recursive: true });
        
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 15, 
            message: 'Build environment ready',
            buildDir
        });
        
        return buildDir;
    }
    
    async generatePlatformStructure(buildId, build, buildDir) {
        const template = this.templateCache.get(build.template_id);
        if (!template) {
            throw new Error(`Template ${build.template_id} not found`);
        }
        
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 30, 
            message: `Generating ${template.name} platform structure...`
        });
        
        // Create standard platform structure
        const dirs = [
            'src', 'src/components', 'src/pages', 'src/api', 'src/utils',
            'public', 'config', 'docs', 'tests', 'scripts'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(path.join(buildDir, dir), { recursive: true });
        }
        
        // Generate package.json
        const packageJson = this.generatePackageJson(build, template);
        await fs.writeFile(
            path.join(buildDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        
        // Generate README.md
        const readme = this.generateReadme(build, template);
        await fs.writeFile(path.join(buildDir, 'README.md'), readme);
        
        console.log(`📁 Platform structure generated for ${build.platform_name}`);
    }
    
    async assembleComponents(buildId, build, buildDir) {
        const components = JSON.parse(build.components || '[]');
        const template = this.templateCache.get(build.template_id);
        
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 50, 
            message: `Assembling ${components.length} components...`
        });
        
        // Get required components from template
        const requiredComponents = template.components || {};
        
        // Generate frontend components
        if (requiredComponents.frontend) {
            await this.generateFrontendComponents(buildDir, requiredComponents.frontend, build);
        }
        
        // Generate backend API
        if (requiredComponents.backend) {
            await this.generateBackendAPI(buildDir, requiredComponents.backend, build);
        }
        
        // Generate database schema
        if (requiredComponents.database) {
            await this.generateDatabaseSchema(buildDir, requiredComponents.database, build);
        }
        
        // Record component usage
        for (const component of components) {
            await this.recordComponentUsage(buildId, component);
        }
        
        console.log(`🔧 Components assembled for ${build.platform_name}`);
    }
    
    async configureIntegrations(buildId, build, buildDir) {
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 65, 
            message: 'Configuring integrations...'
        });
        
        // Generate .env template
        const envTemplate = this.generateEnvTemplate(build);
        await fs.writeFile(path.join(buildDir, '.env.example'), envTemplate);
        
        // Generate Docker configuration
        const dockerfile = this.generateDockerfile(build);
        await fs.writeFile(path.join(buildDir, 'Dockerfile'), dockerfile);
        
        const dockerCompose = this.generateDockerCompose(build);
        await fs.writeFile(path.join(buildDir, 'docker-compose.yml'), dockerCompose);
        
        console.log(`⚙️ Integrations configured for ${build.platform_name}`);
    }
    
    async generateConfigFiles(buildId, build, buildDir) {
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 75, 
            message: 'Generating configuration files...'
        });
        
        // Generate deployment configs
        const configs = {
            'vercel.json': this.generateVercelConfig(build),
            'railway.toml': this.generateRailwayConfig(build),
            '.github/workflows/deploy.yml': this.generateGitHubActions(build)
        };
        
        for (const [filename, content] of Object.entries(configs)) {
            const filePath = path.join(buildDir, filename);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content);
        }
        
        console.log(`📄 Configuration files generated for ${build.platform_name}`);
    }
    
    async createGitHubRepo(buildId, build, buildDir) {
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 85, 
            message: 'Creating GitHub repository...'
        });
        
        const repoName = `${build.platform_name.toLowerCase().replace(/\s+/g, '-')}-${buildId.slice(-8)}`;
        
        try {
            // Initialize git repo
            await this.execCommand('git init', { cwd: buildDir });
            await this.execCommand('git add .', { cwd: buildDir });
            await this.execCommand(`git commit -m "Initial platform setup - Generated by Bob the Builder 🤖"`, { cwd: buildDir });
            
            // Create GitHub repo if GitHub CLI is available
            try {
                await this.execCommand(`gh repo create ${repoName} --public --source=. --push`, { cwd: buildDir });
                const repoUrl = `https://github.com/${process.env.GITHUB_USERNAME || 'user'}/${repoName}`;
                
                console.log(`📦 GitHub repository created: ${repoUrl}`);
                return repoUrl;
            } catch (ghError) {
                console.log('⚠️ GitHub CLI not available, created local git repo only');
                return `local:${buildDir}`;
            }
        } catch (error) {
            console.error('❌ Failed to create git repository:', error);
            return null;
        }
    }
    
    async deployToTargets(buildId, build, buildDir) {
        const deployedUrls = {};
        const targets = JSON.parse(build.deployment_targets || '["github"]');
        
        this.broadcastUpdate(buildId, { 
            status: 'building', 
            progress: 90, 
            message: `Deploying to ${targets.length} targets...`
        });
        
        for (const target of targets) {
            if (!this.config.deployments[target]?.enabled) {
                console.log(`⏭️ Skipping ${target} deployment (disabled)`);
                continue;
            }
            
            try {
                const url = await this.deployToTarget(buildId, build, buildDir, target);
                if (url) {
                    deployedUrls[target] = url;
                    await this.recordDeployment(buildId, target, 'success', url);
                }
            } catch (error) {
                console.error(`❌ ${target} deployment failed:`, error);
                await this.recordDeployment(buildId, target, 'failed', null, error.message);
            }
        }
        
        return deployedUrls;
    }
    
    async deployToTarget(buildId, build, buildDir, target) {
        const timeout = this.config.deployments[target].timeout;
        
        switch (target) {
            case 'railway':
                return this.deployToRailway(buildDir, build, timeout);
            case 'vercel':
                return this.deployToVercel(buildDir, build, timeout);
            case 'docker':
                return this.deployToDocker(buildDir, build, timeout);
            default:
                console.log(`⚠️ Unknown deployment target: ${target}`);
                return null;
        }
    }
    
    async deployToRailway(buildDir, build, timeout) {
        try {
            const result = await this.execCommand('railway login --browserless', { cwd: buildDir, timeout });
            await this.execCommand('railway init', { cwd: buildDir, timeout });
            await this.execCommand('railway up', { cwd: buildDir, timeout });
            
            // Get deployment URL
            const urlResult = await this.execCommand('railway status --json', { cwd: buildDir });
            const status = JSON.parse(urlResult.stdout);
            return status.deployments?.[0]?.url || 'https://railway.app';
        } catch (error) {
            console.error('Railway deployment failed:', error);
            throw error;
        }
    }
    
    async deployToVercel(buildDir, build, timeout) {
        try {
            const result = await this.execCommand(`vercel --prod --yes --name=${build.platform_name}`, { 
                cwd: buildDir, 
                timeout 
            });
            
            // Extract URL from output
            const output = result.stdout;
            const urlMatch = output.match(/https:\/\/[^\s]+/);
            return urlMatch ? urlMatch[0] : 'https://vercel.app';
        } catch (error) {
            console.error('Vercel deployment failed:', error);
            throw error;
        }
    }
    
    async deployToDocker(buildDir, build, timeout) {
        try {
            const imageName = `${build.platform_name.toLowerCase()}:latest`;
            await this.execCommand(`docker build -t ${imageName} .`, { cwd: buildDir, timeout });
            await this.execCommand(`docker run -d -p 3000:3000 --name ${build.platform_name} ${imageName}`, { 
                cwd: buildDir, 
                timeout 
            });
            
            return 'http://localhost:3000';
        } catch (error) {
            console.error('Docker deployment failed:', error);
            throw error;
        }
    }
    
    // Generate platform files
    generatePackageJson(build, template) {
        return {
            name: build.platform_name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: `Generated ${template.name} platform`,
            main: 'src/index.js',
            scripts: {
                start: 'node src/index.js',
                dev: 'nodemon src/index.js',
                test: 'jest',
                build: 'npm run build:client && npm run build:server',
                'build:client': 'react-scripts build',
                'build:server': 'node scripts/build-server.js'
            },
            dependencies: this.getTemplateDependencies(template),
            devDependencies: {
                nodemon: '^2.0.0',
                jest: '^29.0.0'
            },
            engines: {
                node: '>=16.0.0'
            }
        };
    }
    
    generateReadme(build, template) {
        return `# ${build.platform_name}

A ${template.name} platform generated by Bob the Builder 🤖

## Features

${template.components.features?.map(f => `- ${f}`).join('\n') || '- Custom platform features'}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy
npm run deploy
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`env
DATABASE_URL=your_database_url
API_KEY=your_api_key
\`\`\`

## Documentation

- [User Guide](./docs/user-guide.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## Support

Generated with ❤️ by Bob the Builder
`;
    }
    
    generateEnvTemplate(build) {
        return `# ${build.platform_name} Environment Configuration

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# API Keys
API_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_key
OPENAI_API_KEY=sk-your-openai-key

# Deployment
NODE_ENV=development
PORT=3000
`;
    }
    
    generateDockerfile(build) {
        return `FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`;
    }
    
    generateDockerCompose(build) {
        return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/${build.platform_name}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: ${build.platform_name}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`;
    }
    
    // Utility methods
    generateBuildId() {
        return `build_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    estimateBuildTime(templateId) {
        const template = this.templateCache.get(templateId);
        if (!template) return '5-10 minutes';
        
        const timeMap = {
            simple: '3-5 minutes',
            moderate: '5-10 minutes',
            complex: '10-15 minutes'
        };
        
        return timeMap[template.complexity] || '5-10 minutes';
    }
    
    getTemplateDependencies(template) {
        const baseDeps = {
            express: '^4.18.0',
            cors: '^2.8.5',
            dotenv: '^16.0.0'
        };
        
        const frameworks = template.components?.frontend || [];
        const backend = template.components?.backend || [];
        
        // Add framework-specific dependencies
        if (frameworks.includes('React')) {
            Object.assign(baseDeps, {
                react: '^18.0.0',
                'react-dom': '^18.0.0',
                'react-scripts': '^5.0.0'
            });
        }
        
        if (frameworks.includes('Vue.js')) {
            Object.assign(baseDeps, {
                vue: '^3.0.0',
                '@vitejs/plugin-vue': '^4.0.0',
                vite: '^4.0.0'
            });
        }
        
        if (backend.includes('Stripe')) {
            baseDeps.stripe = '^11.0.0';
        }
        
        return baseDeps;
    }
    
    getComponentConfigs(type) {
        const configs = {
            auth: {
                providers: ['local', 'google', 'github'],
                jwt: true,
                sessions: true
            },
            database: {
                types: ['postgresql', 'mongodb', 'mysql'],
                migrations: true,
                seeds: true
            },
            payment: {
                providers: ['stripe', 'paypal'],
                webhooks: true,
                subscriptions: true
            }
        };
        
        return configs[type] || {};
    }
    
    async execCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 30000;
            const child = exec(command, { 
                cwd: options.cwd || process.cwd(),
                timeout 
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    // Database operations
    async createBuildRecord(buildId, buildRequest) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO platform_builds 
                (build_id, user_id, platform_name, template_id, components, deployment_targets)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                buildId,
                buildRequest.userId,
                buildRequest.platformName,
                buildRequest.templateId,
                JSON.stringify(buildRequest.components || []),
                JSON.stringify(buildRequest.deploymentTargets || ['github'])
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async getBuildRecord(buildId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM platform_builds WHERE build_id = ?', [buildId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    async updateBuildStatus(buildId, status, errorMessage = null, progress = null) {
        return new Promise((resolve, reject) => {
            let sql = 'UPDATE platform_builds SET status = ?, updated_at = CURRENT_TIMESTAMP';
            const params = [status];
            
            if (errorMessage) {
                sql += ', error_message = ?';
                params.push(errorMessage);
            }
            
            if (progress !== null) {
                sql += ', progress = ?';
                params.push(progress);
            }
            
            sql += ' WHERE build_id = ?';
            params.push(buildId);
            
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
    
    async completeBuild(buildId, repoUrl, deployedUrls) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE platform_builds 
                SET status = 'completed', github_repo = ?, deployed_urls = ?, progress = 100, updated_at = CURRENT_TIMESTAMP
                WHERE build_id = ?
            `, [repoUrl, JSON.stringify(deployedUrls), buildId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
    
    async recordDeployment(buildId, type, status, url, logs = null) {
        const logId = `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO deployment_logs (log_id, build_id, deployment_type, status, url, logs)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [logId, buildId, type, status, url, logs], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async recordComponentUsage(buildId, component) {
        const usageId = `usage_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO component_usage (usage_id, build_id, component_name, version, configuration)
                VALUES (?, ?, ?, ?, ?)
            `, [
                usageId,
                buildId,
                component.name || component,
                component.version || 'latest',
                JSON.stringify(component.config || {})
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    updateProgress(buildId, progress) {
        this.updateBuildStatus(buildId, 'building', null, progress);
        this.broadcastUpdate(buildId, { status: 'building', progress });
    }
    
    // WebSocket handling
    handleWebSocket(ws) {
        console.log('📡 Assembly client connected');
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                await this.handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('WebSocket error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('📡 Assembly client disconnected');
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            activeBuilds: Array.from(this.activeBuilds.keys()),
            queueLength: this.buildQueue.length,
            timestamp: new Date()
        }));
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'get_build_status':
                if (data.buildId) {
                    const build = await this.getBuildRecord(data.buildId);
                    const activeStatus = this.activeBuilds.get(data.buildId);
                    
                    ws.send(JSON.stringify({
                        type: 'build_status',
                        buildId: data.buildId,
                        status: build?.status || 'not_found',
                        progress: build?.progress || 0,
                        active: !!activeStatus,
                        errorMessage: build?.error_message
                    }));
                }
                break;
                
            case 'list_builds':
                // TODO: Get user's builds
                ws.send(JSON.stringify({
                    type: 'builds_list',
                    builds: []
                }));
                break;
        }
    }
    
    broadcastUpdate(buildId, update) {
        const message = JSON.stringify({
            type: 'build_update',
            buildId,
            ...update,
            timestamp: new Date()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }
    
    // File generation methods
    async generateFrontendComponents(buildDir, frontendStack, build) {
        // Generate basic React/Vue components based on template
        const srcDir = path.join(buildDir, 'src', 'components');
        
        if (frontendStack.includes('React')) {
            await this.generateReactComponents(srcDir, build);
        } else if (frontendStack.includes('Vue.js')) {
            await this.generateVueComponents(srcDir, build);
        }
    }
    
    async generateReactComponents(srcDir, build) {
        const components = [
            { name: 'App', content: this.getReactAppComponent(build) },
            { name: 'Header', content: this.getReactHeaderComponent(build) },
            { name: 'Dashboard', content: this.getReactDashboardComponent(build) }
        ];
        
        for (const component of components) {
            await fs.writeFile(
                path.join(srcDir, `${component.name}.jsx`),
                component.content
            );
        }
    }
    
    async generateBackendAPI(buildDir, backendStack, build) {
        const apiDir = path.join(buildDir, 'src', 'api');
        
        // Generate Express.js API endpoints
        const routes = [
            { name: 'index', content: this.getExpressIndexRoute(build) },
            { name: 'auth', content: this.getExpressAuthRoute(build) },
            { name: 'users', content: this.getExpressUsersRoute(build) }
        ];
        
        for (const route of routes) {
            await fs.writeFile(
                path.join(apiDir, `${route.name}.js`),
                route.content
            );
        }
        
        // Generate main server file
        const serverContent = this.getExpressServerFile(build);
        await fs.writeFile(path.join(buildDir, 'src', 'index.js'), serverContent);
    }
    
    async generateDatabaseSchema(buildDir, databaseStack, build) {
        const configDir = path.join(buildDir, 'config');
        
        if (databaseStack.includes('PostgreSQL')) {
            const schema = this.generatePostgreSQLSchema(build);
            await fs.writeFile(path.join(configDir, 'schema.sql'), schema);
        }
    }
    
    // Component generation helpers
    getReactAppComponent(build) {
        return `import React from 'react';
import Header from './Header';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header title="${build.platform_name}" />
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
`;
    }
    
    getReactHeaderComponent(build) {
        return `import React from 'react';

function Header({ title }) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <nav>
        <a href="#dashboard">Dashboard</a>
        <a href="#profile">Profile</a>
      </nav>
    </header>
  );
}

export default Header;
`;
    }
    
    getReactDashboardComponent(build) {
        return `import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h2>Welcome to ${build.platform_name}</h2>
      {data ? (
        <div className="dashboard-content">
          {/* Dashboard content here */}
          <p>Platform is ready!</p>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}

export default Dashboard;
`;
    }
    
    getExpressServerFile(build) {
        return `const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./api/auth');
const usersRoutes = require('./api/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Dashboard API
app.get('/api/dashboard', (req, res) => {
  res.json({
    message: 'Welcome to ${build.platform_name}',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: '${build.platform_name}' });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(\`🚀 ${build.platform_name} running on port \${PORT}\`);
});

module.exports = app;
`;
    }
    
    generateVercelConfig(build) {
        return JSON.stringify({
            version: 2,
            name: build.platform_name.toLowerCase().replace(/\s+/g, '-'),
            builds: [
                {
                    src: 'src/index.js',
                    use: '@vercel/node'
                }
            ],
            routes: [
                {
                    src: '/api/(.*)',
                    dest: '/src/index.js'
                },
                {
                    src: '/(.*)',
                    dest: '/public/$1'
                }
            ]
        }, null, 2);
    }
    
    generateRailwayConfig(build) {
        return `[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"

[environment]
NODE_ENV = "production"
`;
    }
    
    generateGitHubActions(build) {
        return `name: Deploy ${build.platform_name}

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
`;
    }
    
    // Add remaining generator methods...
    getExpressIndexRoute(build) {
        return `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${build.platform_name} API',
    version: '1.0.0',
    endpoints: ['/auth', '/users', '/dashboard']
  });
});

module.exports = router;
`;
    }
    
    getExpressAuthRoute(build) {
        return `const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // TODO: Implement authentication
  res.json({
    message: 'Login endpoint',
    user: { email },
    token: 'jwt-token-here'
  });
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  
  // TODO: Implement user registration
  res.json({
    message: 'Registration endpoint',
    user: { email, name }
  });
});

module.exports = router;
`;
    }
    
    getExpressUsersRoute(build) {
        return `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // TODO: Get users from database
  res.json({
    users: [],
    total: 0
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Get user by ID
  res.json({
    user: { id, name: 'Sample User' }
  });
});

module.exports = router;
`;
    }
    
    generatePostgreSQLSchema(build) {
        return `-- ${build.platform_name} Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
`;
    }
}

module.exports = PlatformAssemblySystem;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🏗️ PLATFORM ASSEMBLY & AUTO-DEPLOYMENT DEMO');
        console.log('===============================================\n');
        
        const assemblySystem = new PlatformAssemblySystem({
            workingDir: './demo-platforms',
            wsPort: 9001
        });
        
        await assemblySystem.init();
        
        // Demo platform build
        const buildRequest = {
            userId: 'demo-user-123',
            platformName: 'My Awesome SaaS',
            templateId: 'saas-subscription-platform',
            userRequirements: {
                features: ['user-management', 'billing', 'analytics'],
                complexity: 'moderate'
            },
            deploymentTargets: ['github', 'docker'],
            storyMode: true
        };
        
        console.log('🚀 Starting demo platform assembly...');
        const result = await assemblySystem.assemblePlatform(buildRequest);
        
        console.log('\n✅ Demo assembly initiated:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n📡 Monitor progress at:');
        console.log(`   WebSocket: ws://localhost:9001`);
        console.log(`   Build ID: ${result.buildId}`);
        
        console.log('\n🎯 Platform Assembly System ready for production!');
    };
    
    demo().catch(console.error);
}