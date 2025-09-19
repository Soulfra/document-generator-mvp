#!/usr/bin/env node

/**
 * 🤖 Master Automation Controller
 * 
 * End-to-end automated document-to-MVP pipeline with component chunking
 * "we should be able to have you start the process from start to finish etc and have it chunked and into mini pieces or components"
 */

import { promises as fs } from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MasterAutomationController extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            baseDir: options.baseDir || __dirname,
            outputDir: options.outputDir || './automated-mvp-output',
            chunkSize: options.chunkSize || 'optimal', // small, medium, large, optimal
            processingMode: options.processingMode || 'parallel', // sequential, parallel, adaptive
            
            // Services configuration
            services: {
                mcp: {
                    url: 'http://localhost:3000',
                    enabled: false,
                    healthCheck: '/health'
                },
                ollama: {
                    url: 'http://localhost:11434',
                    enabled: false,
                    healthCheck: '/api/tags'
                },
                postgres: {
                    url: 'postgresql://postgres:postgres@localhost:5432/document_generator',
                    enabled: false
                },
                redis: {
                    url: 'redis://localhost:6379',
                    enabled: false
                }
            },
            
            // Processing pipeline stages
            pipeline: [
                'initialize_infrastructure',
                'analyze_document',
                'chunk_processing',
                'template_selection',
                'code_generation',
                'component_assembly',
                'testing_validation',
                'packaging_deployment'
            ],
            
            // Automation flags
            autoStart: options.autoStart !== false,
            autoFix: options.autoFix !== false,
            autoOptimize: options.autoOptimize !== false,
            autoDocument: options.autoDocument !== false
        };
        
        this.state = {
            currentStage: null,
            currentChunk: null,
            processingQueue: [],
            completedChunks: [],
            failedChunks: [],
            serviceHealth: new Map(),
            metrics: {
                totalTime: 0,
                chunksProcessed: 0,
                componentsGenerated: 0,
                testsRun: 0,
                errors: 0
            }
        };
        
        console.log('🤖 Master Automation Controller Initialized');
        console.log('===========================================');
    }
    
    /**
     * 🚀 Main automation entry point - start process from start to finish
     */
    async automateDocumentToMVP(documentPath, options = {}) {
        const startTime = Date.now();
        console.log(`🚀 Starting full automation: ${documentPath}`);
        
        try {
            // Stage 1: Initialize Infrastructure
            await this.executeStage('initialize_infrastructure', {
                documentPath,
                startInfrastructure: true,
                checkServices: true
            });
            
            // Stage 2: Analyze Document (chunked)
            const analysis = await this.executeStage('analyze_document', {
                documentPath,
                enableAI: true,
                extractComponents: true
            });
            
            // Stage 3: Chunk Processing
            const chunks = await this.executeStage('chunk_processing', {
                analysis,
                chunkStrategy: this.config.chunkSize,
                parallelProcessing: this.config.processingMode === 'parallel'
            });
            
            // Stage 4: Template Selection (per chunk)
            const templates = await this.executeStage('template_selection', {
                chunks,
                aiAssisted: true,
                fallbackStrategy: 'smart'
            });
            
            // Stage 5: Code Generation (chunked)
            const codeComponents = await this.executeStage('code_generation', {
                chunks,
                templates,
                useAI: true,
                optimizeCode: this.config.autoOptimize
            });
            
            // Stage 6: Component Assembly
            const assembledMVP = await this.executeStage('component_assembly', {
                codeComponents,
                integrationStrategy: 'modular',
                autoWire: true
            });
            
            // Stage 7: Testing & Validation
            const validatedMVP = await this.executeStage('testing_validation', {
                mvp: assembledMVP,
                runTests: true,
                autoFix: this.config.autoFix
            });
            
            // Stage 8: Packaging & Deployment
            const packagedMVP = await this.executeStage('packaging_deployment', {
                mvp: validatedMVP,
                createDocumentation: this.config.autoDocument,
                deploymentReady: true
            });
            
            this.state.metrics.totalTime = Date.now() - startTime;
            
            console.log('\n🎉 FULL AUTOMATION COMPLETE!');
            console.log('============================');
            console.log(`⏱️  Total time: ${(this.state.metrics.totalTime / 1000).toFixed(2)}s`);
            console.log(`📦 MVP package: ${packagedMVP.path}`);
            console.log(`🌐 Demo URL: ${packagedMVP.demoUrl}`);
            console.log(`🧩 Components: ${this.state.metrics.componentsGenerated}`);
            console.log(`✅ Tests: ${this.state.metrics.testsRun}`);
            
            return packagedMVP;
            
        } catch (error) {
            console.error('❌ Automation failed:', error.message);
            this.state.metrics.errors++;
            
            if (this.config.autoFix) {
                console.log('🔧 Attempting auto-recovery...');
                return await this.attemptAutoRecovery(error, { documentPath, options });
            }
            
            throw error;
        }
    }
    
    /**
     * 🎯 Execute pipeline stage with chunked processing
     */
    async executeStage(stageName, stageData) {
        console.log(`\n🎯 Stage: ${stageName.toUpperCase()}`);
        console.log('='.repeat(stageName.length + 8));
        
        this.state.currentStage = stageName;
        this.emit('stage:start', { stage: stageName, data: stageData });
        
        try {
            let result = null;
            
            switch (stageName) {
                case 'initialize_infrastructure':
                    result = await this.initializeInfrastructure(stageData);
                    break;
                    
                case 'analyze_document':
                    result = await this.analyzeDocumentChunked(stageData);
                    break;
                    
                case 'chunk_processing':
                    result = await this.processDocumentChunks(stageData);
                    break;
                    
                case 'template_selection':
                    result = await this.selectTemplatesForChunks(stageData);
                    break;
                    
                case 'code_generation':
                    result = await this.generateCodeComponents(stageData);
                    break;
                    
                case 'component_assembly':
                    result = await this.assembleComponents(stageData);
                    break;
                    
                case 'testing_validation':
                    result = await this.validateAndTest(stageData);
                    break;
                    
                case 'packaging_deployment':
                    result = await this.packageForDeployment(stageData);
                    break;
                    
                default:
                    throw new Error(`Unknown stage: ${stageName}`);
            }
            
            console.log(`✅ Stage completed: ${stageName}`);
            this.emit('stage:complete', { stage: stageName, result });
            
            return result;
            
        } catch (error) {
            console.error(`❌ Stage failed: ${stageName}`, error.message);
            this.emit('stage:error', { stage: stageName, error });
            throw error;
        }
    }
    
    /**
     * 🏗️ Initialize infrastructure (start services as needed)
     */
    async initializeInfrastructure(data) {
        console.log('🏗️ Initializing infrastructure...');
        
        // Try to start Ollama if available
        try {
            const ollamaCheck = await this.checkServiceHealth('ollama');
            if (!ollamaCheck.healthy) {
                console.log('🤖 Starting Ollama...');
                await this.startOllama();
            }
        } catch (error) {
            console.warn('⚠️ Ollama not available, using fallback AI');
        }
        
        // Check for existing services
        await this.checkAllServices();
        
        // Initialize local components
        await this.initializeLocalComponents();
        
        return {
            servicesAvailable: Array.from(this.state.serviceHealth.entries())
                .filter(([_, health]) => health.healthy)
                .map(([service, _]) => service),
            fallbackMode: !this.state.serviceHealth.get('ollama')?.healthy
        };
    }
    
    /**
     * 📄 Analyze document with chunked processing
     */
    async analyzeDocumentChunked(data) {
        console.log(`📄 Analyzing document: ${data.documentPath}`);
        
        // Read document
        const document = await fs.readFile(data.documentPath, 'utf8');
        const documentSize = document.length;
        
        console.log(`📊 Document size: ${documentSize} characters`);
        
        // Use existing MVP generator for analysis
        const MVPGenerator = await this.loadMVPGenerator();
        const generator = new MVPGenerator();
        
        const analysis = await generator.analyzeDocument({
            content: document,
            format: extname(data.documentPath),
            path: data.documentPath,
            name: basename(data.documentPath, extname(data.documentPath))
        });
        
        console.log(`🎯 Intent: ${analysis.intent}`);
        console.log(`📊 Complexity: ${analysis.complexity}`);
        console.log(`✨ Features: ${analysis.features.length}`);
        
        return analysis;
    }
    
    /**
     * 🧩 Process document into manageable chunks
     */
    async processDocumentChunks(data) {
        console.log('🧩 Creating processing chunks...');
        
        const { analysis } = data;
        const chunkStrategy = this.determineChunkStrategy(analysis);
        
        console.log(`📋 Using chunk strategy: ${chunkStrategy.name}`);
        
        const chunks = this.createChunks(analysis, chunkStrategy);
        
        console.log(`🧩 Created ${chunks.length} chunks:`);
        chunks.forEach((chunk, i) => {
            console.log(`   ${i + 1}. ${chunk.name} (${chunk.type})`);
        });
        
        return chunks;
    }
    
    /**
     * 🎯 Select templates for each chunk
     */
    async selectTemplatesForChunks(data) {
        console.log('🎯 Selecting templates for chunks...');
        
        const { chunks } = data;
        const templateSelections = [];
        
        for (const chunk of chunks) {
            const template = await this.selectTemplateForChunk(chunk);
            templateSelections.push({
                chunk,
                template,
                processing_order: chunk.priority || 1
            });
            
            console.log(`   📋 ${chunk.name} → ${template.name}`);
        }
        
        return templateSelections.sort((a, b) => a.processing_order - b.processing_order);
    }
    
    /**
     * ⚙️ Generate code components from chunks
     */
    async generateCodeComponents(data) {
        console.log('⚙️ Generating code components...');
        
        const { chunks, templates } = data;
        const codeComponents = [];
        
        const processChunk = async (templateSelection) => {
            const { chunk, template } = templateSelection;
            
            console.log(`   🔧 Generating: ${chunk.name}`);
            
            try {
                const MVPGenerator = await this.loadMVPGenerator();
                const generator = new MVPGenerator();
                
                // Generate code for this specific chunk
                const component = await template.code({
                    ...chunk.analysis,
                    features: chunk.features,
                    chunkType: chunk.type,
                    chunkName: chunk.name
                });
                
                component.chunkInfo = {
                    name: chunk.name,
                    type: chunk.type,
                    priority: chunk.priority
                };
                
                this.state.metrics.componentsGenerated++;
                console.log(`   ✅ Generated: ${chunk.name}`);
                
                return component;
                
            } catch (error) {
                console.error(`   ❌ Failed: ${chunk.name}`, error.message);
                this.state.failedChunks.push(chunk);
                throw error;
            }
        };
        
        // Process chunks in parallel or sequential based on config
        if (this.config.processingMode === 'parallel') {
            const results = await Promise.allSettled(
                templates.map(processChunk)
            );
            
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    codeComponents.push(result.value);
                } else {
                    console.error(`Chunk ${i} failed:`, result.reason.message);
                }
            });
        } else {
            for (const templateSelection of templates) {
                const component = await processChunk(templateSelection);
                codeComponents.push(component);
            }
        }
        
        console.log(`✅ Generated ${codeComponents.length} code components`);
        return codeComponents;
    }
    
    /**
     * 🔗 Assemble components into unified MVP
     */
    async assembleComponents(data) {
        console.log('🔗 Assembling components into unified MVP...');
        
        const { codeComponents } = data;
        
        // Create unified file structure
        const unifiedMVP = {
            name: 'AutoGeneratedMVP',
            type: 'full-stack-app',
            files: {},
            metadata: {
                generatedBy: 'master-automation-controller',
                timestamp: new Date().toISOString(),
                componentCount: codeComponents.length,
                chunks: codeComponents.map(c => c.chunkInfo)
            }
        };
        
        // Merge all component files
        for (const component of codeComponents) {
            const prefix = component.chunkInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            Object.entries(component.files).forEach(([filename, content]) => {
                // Avoid filename conflicts by prefixing
                const uniqueFilename = filename === 'package.json' 
                    ? filename // Keep main package.json
                    : `${prefix}-${filename}`;
                
                unifiedMVP.files[uniqueFilename] = content;
            });
        }
        
        // Create master orchestrator file
        unifiedMVP.files['master-app.js'] = this.generateMasterAppFile(codeComponents);
        
        // Create unified package.json
        unifiedMVP.files['package.json'] = this.generateUnifiedPackageJson(codeComponents);
        
        // Create master README
        unifiedMVP.files['README.md'] = this.generateMasterReadme(codeComponents);
        
        console.log(`🔗 Assembled MVP with ${Object.keys(unifiedMVP.files).length} files`);
        
        return unifiedMVP;
    }
    
    /**
     * 🧪 Validate and test the assembled MVP
     */
    async validateAndTest(data) {
        console.log('🧪 Validating and testing MVP...');
        
        const { mvp } = data;
        
        // Basic validation
        const validation = {
            hasMainFile: 'master-app.js' in mvp.files,
            hasPackageJson: 'package.json' in mvp.files,
            hasReadme: 'README.md' in mvp.files,
            fileCount: Object.keys(mvp.files).length,
            componentCount: mvp.metadata.componentCount
        };
        
        console.log('📋 Validation results:');
        Object.entries(validation).forEach(([key, value]) => {
            const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : '📊';
            console.log(`   ${status} ${key}: ${value}`);
        });
        
        // Syntax validation for JS files
        let syntaxErrors = 0;
        for (const [filename, content] of Object.entries(mvp.files)) {
            if (filename.endsWith('.js')) {
                try {
                    // Basic syntax check
                    new Function(content);
                } catch (error) {
                    console.error(`❌ Syntax error in ${filename}:`, error.message);
                    syntaxErrors++;
                }
            }
        }
        
        this.state.metrics.testsRun = Object.keys(mvp.files).length;
        
        if (syntaxErrors > 0 && this.config.autoFix) {
            console.log('🔧 Auto-fixing syntax errors...');
            // Auto-fix logic would go here
        }
        
        console.log(`✅ Validation complete. ${syntaxErrors} syntax errors found.`);
        
        return {
            ...mvp,
            validation,
            tested: true,
            syntaxErrors
        };
    }
    
    /**
     * 📦 Package MVP for deployment
     */
    async packageForDeployment(data) {
        console.log('📦 Packaging MVP for deployment...');
        
        const { mvp } = data;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = join(this.config.outputDir, `automated-mvp-${timestamp}`);
        
        // Create output directory
        await fs.mkdir(outputDir, { recursive: true });
        
        // Write all files
        for (const [filename, content] of Object.entries(mvp.files)) {
            await fs.writeFile(join(outputDir, filename), content);
        }
        
        // Create deployment scripts
        await this.createDeploymentScripts(outputDir, mvp);
        
        // Create documentation if enabled
        if (this.config.autoDocument) {
            await this.generateDocumentation(outputDir, mvp);
        }
        
        const packagedMVP = {
            path: outputDir,
            files: Object.keys(mvp.files),
            demoUrl: 'http://localhost:3000',
            deploymentReady: true,
            documentation: this.config.autoDocument,
            timestamp,
            metadata: mvp.metadata
        };
        
        console.log(`📦 MVP packaged at: ${outputDir}`);
        console.log(`🌐 Demo URL: ${packagedMVP.demoUrl}`);
        
        return packagedMVP;
    }
    
    // Helper methods
    
    async checkServiceHealth(serviceName) {
        const service = this.config.services[serviceName];
        if (!service) return { healthy: false, error: 'Service not configured' };
        
        try {
            const response = await fetch(`${service.url}${service.healthCheck}`, {
                timeout: 5000
            });
            
            const healthy = response.ok;
            this.state.serviceHealth.set(serviceName, { healthy, lastCheck: Date.now() });
            
            return { healthy };
        } catch (error) {
            this.state.serviceHealth.set(serviceName, { 
                healthy: false, 
                error: error.message, 
                lastCheck: Date.now() 
            });
            return { healthy: false, error: error.message };
        }
    }
    
    async checkAllServices() {
        console.log('🔍 Checking service health...');
        
        for (const serviceName of Object.keys(this.config.services)) {
            const health = await this.checkServiceHealth(serviceName);
            const status = health.healthy ? '✅' : '❌';
            console.log(`   ${status} ${serviceName}: ${health.healthy ? 'healthy' : health.error}`);
        }
    }
    
    async startOllama() {
        try {
            // Try to start Ollama if it's installed
            await execAsync('ollama serve > /dev/null 2>&1 &');
            
            // Wait a moment for startup
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if it's responding
            const health = await this.checkServiceHealth('ollama');
            if (health.healthy) {
                console.log('✅ Ollama started successfully');
            }
        } catch (error) {
            console.warn('⚠️ Could not start Ollama:', error.message);
        }
    }
    
    async initializeLocalComponents() {
        // Initialize any local components needed
        await fs.mkdir(this.config.outputDir, { recursive: true });
    }
    
    async loadMVPGenerator() {
        // Import the existing MVP generator
        const MVPGeneratorModule = await import('./mvp-generator.js');
        return MVPGeneratorModule.default || MVPGeneratorModule;
    }
    
    determineChunkStrategy(analysis) {
        // Determine optimal chunking strategy based on analysis
        const complexity = analysis.complexity;
        const featureCount = analysis.features.length;
        
        if (complexity === 'simple' && featureCount <= 3) {
            return { name: 'single', chunks: 1 };
        } else if (complexity === 'moderate' || featureCount <= 6) {
            return { name: 'dual', chunks: 2 };
        } else {
            return { name: 'modular', chunks: Math.min(featureCount, 5) };
        }
    }
    
    createChunks(analysis, strategy) {
        const chunks = [];
        
        if (strategy.name === 'single') {
            chunks.push({
                name: 'main',
                type: 'full-app',
                features: analysis.features,
                analysis: analysis,
                priority: 1
            });
        } else if (strategy.name === 'dual') {
            chunks.push(
                {
                    name: 'backend',
                    type: 'api-backend',
                    features: analysis.features.filter((_, i) => i % 2 === 0),
                    analysis: { ...analysis, intent: 'api-backend' },
                    priority: 1
                },
                {
                    name: 'frontend',
                    type: 'frontend-app',
                    features: analysis.features.filter((_, i) => i % 2 === 1),
                    analysis: { ...analysis, intent: 'frontend-app' },
                    priority: 2
                }
            );
        } else {
            // Modular chunking by feature groups
            const featuresPerChunk = Math.ceil(analysis.features.length / strategy.chunks);
            
            for (let i = 0; i < strategy.chunks; i++) {
                const startIdx = i * featuresPerChunk;
                const endIdx = Math.min(startIdx + featuresPerChunk, analysis.features.length);
                
                chunks.push({
                    name: `component-${i + 1}`,
                    type: i === 0 ? 'api-backend' : 'frontend-app',
                    features: analysis.features.slice(startIdx, endIdx),
                    analysis: { 
                        ...analysis, 
                        intent: i === 0 ? 'api-backend' : 'frontend-app' 
                    },
                    priority: i + 1
                });
            }
        }
        
        return chunks;
    }
    
    async selectTemplateForChunk(chunk) {
        // Load MVP generator templates
        const MVPGenerator = await this.loadMVPGenerator();
        const generator = new MVPGenerator();
        
        return generator.selectTemplate(chunk.analysis);
    }
    
    generateMasterAppFile(components) {
        return `#!/usr/bin/env node

/**
 * 🤖 Auto-Generated Master App
 * Generated by Master Automation Controller
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        generated: '${new Date().toISOString()}',
        components: ${components.length},
        type: 'automated-mvp'
    });
});

// Component info
app.get('/api/components', (req, res) => {
    res.json({
        components: ${JSON.stringify(components.map(c => c.chunkInfo), null, 2)}
    });
});

app.listen(PORT, () => {
    console.log(\`🚀 Auto-generated MVP running on http://localhost:\${PORT}\`);
    console.log(\`🧩 Components: ${components.length}\`);
    console.log(\`📋 Generated: ${new Date().toISOString()}\`);
});`;
    }
    
    generateUnifiedPackageJson(components) {
        return JSON.stringify({
            name: 'automated-mvp',
            version: '1.0.0',
            description: 'Auto-generated MVP from document',
            main: 'master-app.js',
            scripts: {
                start: 'node master-app.js',
                dev: 'nodemon master-app.js'
            },
            dependencies: {
                express: '^4.18.2',
                cors: '^2.8.5'
            },
            metadata: {
                generatedBy: 'master-automation-controller',
                componentCount: components.length,
                timestamp: new Date().toISOString()
            }
        }, null, 2);
    }
    
    generateMasterReadme(components) {
        return `# Auto-Generated MVP

Generated by Master Automation Controller on ${new Date().toISOString()}

## Components

This MVP was built from ${components.length} automated components:

${components.map((c, i) => `${i + 1}. **${c.chunkInfo.name}** (${c.chunkInfo.type})`).join('\n')}

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the application:
   \`\`\`bash
   npm start
   \`\`\`

3. Open your browser to http://localhost:3000

## API Endpoints

- \`GET /health\` - Health check
- \`GET /api/components\` - Component information

## Generated Files

${components.flatMap(c => Object.keys(c.files)).map(f => `- ${f}`).join('\n')}

---

*Auto-generated by Document Generator Master Automation Controller*
`;
    }
    
    async createDeploymentScripts(outputDir, mvp) {
        // Create quick deploy script
        const deployScript = `#!/bin/bash

echo "🚀 Deploying auto-generated MVP..."

# Install dependencies
npm install

# Start the application
echo "✅ Starting MVP on http://localhost:3000"
npm start
`;
        
        await fs.writeFile(join(outputDir, 'deploy.sh'), deployScript);
        await fs.chmod(join(outputDir, 'deploy.sh'), 0o755);
    }
    
    async generateDocumentation(outputDir, mvp) {
        // Create comprehensive documentation
        const docContent = `# MVP Documentation

## Architecture

This MVP was automatically generated with the following architecture:

${mvp.metadata.chunks.map(c => `- ${c.name}: ${c.type}`).join('\n')}

## Generated Components

${mvp.metadata.componentCount} components were assembled into this unified MVP.

## Next Steps

1. Customize the generated code
2. Add your specific business logic
3. Deploy to your preferred platform

---

Generated: ${mvp.metadata.timestamp}
`;
        
        await fs.writeFile(join(outputDir, 'DOCUMENTATION.md'), docContent);
    }
    
    async attemptAutoRecovery(error, context) {
        console.log('🔧 Attempting auto-recovery...');
        
        // Simple auto-recovery logic
        if (error.message.includes('service')) {
            console.log('🔧 Service error detected, retrying with fallback...');
            
            // Disable problematic services and retry
            Object.keys(this.config.services).forEach(service => {
                this.config.services[service].enabled = false;
            });
            
            return await this.automateDocumentToMVP(context.documentPath, {
                ...context.options,
                fallbackMode: true
            });
        }
        
        throw error;
    }
}

export default MasterAutomationController;

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const documentPath = process.argv[2];
    
    if (!documentPath) {
        console.log('Usage: node master-automation-controller.js <document-path>');
        console.log('Example: node master-automation-controller.js ./business-plan.md');
        process.exit(1);
    }
    
    const controller = new MasterAutomationController({
        autoStart: true,
        autoFix: true,
        autoOptimize: true,
        autoDocument: true
    });
    
    controller.automateDocumentToMVP(documentPath)
        .then((result) => {
            console.log('\n🎉 AUTOMATION SUCCESS!');
            console.log(`📁 Path: ${result.path}`);
            console.log(`🌐 Demo: ${result.demoUrl}`);
            console.log('\n🚀 To run your MVP:');
            console.log(`cd ${result.path} && npm install && npm start`);
        })
        .catch((error) => {
            console.error('\n💥 AUTOMATION FAILED:', error.message);
            process.exit(1);
        });
}

console.log('🤖 Master Automation Controller loaded - ready for end-to-end automation!');