#!/usr/bin/env node
const TemplateGenerationEngine = require('./template-generation-engine');
const fs = require('fs').promises;
const path = require('path');

/**
 * 🎬 TEMPLATE GENERATION ENGINE DEMO
 * Demonstrates Phase 1.3 capabilities with real template consolidation
 */

async function runDemo() {
    console.log('🎬 Starting Template Generation Engine Demo...');
    
    try {
        // Initialize engine
        const engine = new TemplateGenerationEngine();
        await engine.initializeEngine();
        
        // Demo 1: Create a custom dataTransform template
        console.log('\n📋 Demo 1: Creating Custom DataTransform Template');
        const customTemplate = {
            type: 'custom_dataTransform',
            description: 'AI-powered document to MVP transformer',
            parameters: ['projectName', 'inputType', 'outputFramework', 'aiModel', 'deployTarget'],
            schema: {
                type: 'object',
                properties: {
                    projectName: { type: 'string' },
                    inputType: { type: 'string', enum: ['markdown', 'pdf', 'json', 'chat'] },
                    outputFramework: { type: 'string', enum: ['react', 'vue', 'express', 'fastapi'] },
                    aiModel: { type: 'string', enum: ['gpt-4', 'claude-3', 'ollama'] },
                    deployTarget: { type: 'string', enum: ['vercel', 'netlify', 'docker', 'aws'] }
                },
                required: ['projectName', 'inputType', 'outputFramework']
            },
            files: {
                '{{projectName}}/package.json': JSON.stringify({
                    name: '{{projectName}}',
                    version: '1.0.0',
                    description: 'Generated MVP from {{inputType}}',
                    main: 'index.js',
                    scripts: {
                        start: 'node index.js',
                        build: 'npm run build:{{outputFramework}}',
                        deploy: 'npm run deploy:{{deployTarget}}'
                    },
                    dependencies: {
                        '{{outputFramework}}': 'latest'
                    }
                }, null, 2),
                '{{projectName}}/src/main.js': `// {{projectName}} Main Application\n// Generated from {{inputType}} using {{aiModel}}\n// Framework: {{outputFramework}}\n\nconst app = require('./app');\nconst config = require('./config');\n\napp.listen(config.PORT, () => {\n  console.log('{{projectName}} running on port', config.PORT);\n});`,
                '{{projectName}}/src/config.js': `module.exports = {\n  PORT: process.env.PORT || 3000,\n  AI_MODEL: '{{aiModel}}',\n  INPUT_TYPE: '{{inputType}}',\n  OUTPUT_FRAMEWORK: '{{outputFramework}}',\n  DEPLOY_TARGET: '{{deployTarget}}'\n};`,
                '{{projectName}}/README.md': `# {{projectName}}\n\nGenerated MVP from {{inputType}} input.\n\n## Features\n- Framework: {{outputFramework}}\n- AI Model: {{aiModel}}\n- Deploy Target: {{deployTarget}}\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm start\n\`\`\``,
                '{{projectName}}/docker-compose.yml': `version: '3.8'\nservices:\n  {{projectName}}:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n      - AI_MODEL={{aiModel}}`
            },
            configuration: {
                deployment: {
                    target: '{{deployTarget}}',
                    framework: '{{outputFramework}}'
                },
                ai: {
                    model: '{{aiModel}}',
                    inputProcessor: '{{inputType}}'
                },
                features: {
                    documentParsing: true,
                    aiGeneration: true,
                    autoDeployment: '{{deployTarget}}' !== 'docker'
                }
            }
        };
        
        // Register the custom template
        engine.templates.set('custom_dataTransform', customTemplate);
        
        // Demo 2: Generate with parameters
        console.log('\n🔨 Demo 2: Generating Component with Parameters');
        const params = {
            projectName: 'ai-business-analyzer',
            inputType: 'pdf',
            outputFramework: 'react',
            aiModel: 'claude-3',
            deployTarget: 'vercel'
        };
        
        const generated = await engine.generate('custom_dataTransform', params);
        console.log('Generated component:', {
            files: Object.keys(generated.files).length,
            hasConfig: Object.keys(generated.configuration).length > 0,
            hasDocumentation: generated.documentation.length > 0
        });
        
        // Demo 3: Export to filesystem
        console.log('\n📁 Demo 3: Exporting to Filesystem');
        const outputDir = path.join(__dirname, 'generated-demo', params.projectName);
        await engine.exportGenerated(generated, outputDir);
        console.log(`✅ Files exported to: ${outputDir}`);
        
        // Demo 4: Template composition
        console.log('\n🔗 Demo 4: Template Composition');
        
        // Create a monitoring template
        const monitoringTemplate = {
            type: 'monitoring_status',
            description: 'System monitoring and health checks',
            parameters: ['serviceName', 'port', 'metrics'],
            schema: {
                type: 'object',
                properties: {
                    serviceName: { type: 'string' },
                    port: { type: 'integer' },
                    metrics: { type: 'array' }
                },
                required: ['serviceName', 'port']
            },
            files: {
                '{{serviceName}}-monitor.js': `const monitor = {\n  service: '{{serviceName}}',\n  port: {{port}},\n  metrics: {{metrics}},\n  \n  check() {\n    return { status: 'healthy', metrics: this.metrics };\n  }\n};\n\nmodule.exports = monitor;`
            }
        };
        
        engine.templates.set('monitoring_status', monitoringTemplate);
        
        // Compose multiple templates
        const compositionSpecs = [
            {
                template: 'custom_dataTransform',
                parameters: {
                    projectName: 'composed-app',
                    inputType: 'json',
                    outputFramework: 'express',
                    aiModel: 'gpt-4'
                }
            },
            {
                template: 'monitoring_status',
                parameters: {
                    serviceName: 'composed-app-monitor',
                    port: 8080,
                    metrics: ['cpu', 'memory', 'requests']
                }
            }
        ];
        
        const composed = await engine.compose(compositionSpecs, { strategy: 'merge' });
        console.log('Composed result:', {
            totalFiles: Object.keys(composed.files).length,
            components: composed.metadata.components
        });
        
        // Demo 5: Parameter transformation
        console.log('\n🔄 Demo 5: Parameter Transformations');
        const transformParams = {
            projectName: 'Transform-Test-Project',
            inputType: 'markdown',
            outputFramework: 'vue'
        };
        
        const transforms = {
            projectName: ['lowercase', 'kebabCase'],
            inputType: ['uppercase']
        };
        
        const transformedGenerated = await engine.generate('custom_dataTransform', transformParams, { transforms });
        console.log('Parameter transformations applied successfully');
        
        // Demo 6: Template extension
        console.log('\n📋 Demo 6: Template Extension');
        const aiExtension = {
            type: 'ai_enhanced_dataTransform',
            description: 'AI-enhanced data transformation with ML capabilities',
            parameters: ['mlModel', 'trainingData', 'accuracy'],
            files: {
                '{{projectName}}/src/ai-processor.js': `const aiProcessor = {\n  model: '{{mlModel}}',\n  trainingData: '{{trainingData}}',\n  requiredAccuracy: {{accuracy}},\n  \n  async process(input) {\n    // AI processing logic\n    return await this.enhance(input);\n  }\n};\n\nmodule.exports = aiProcessor;`
            }
        };
        
        const extendedType = await engine.extend('custom_dataTransform', aiExtension);
        console.log(`✅ Extended template created: ${extendedType}`);
        
        // Demo 7: Batch generation
        console.log('\n🏭 Demo 7: Batch Generation');
        const batchSpecs = [
            {
                template: 'custom_dataTransform',
                parameters: { projectName: 'batch-project-1', inputType: 'pdf', outputFramework: 'react' }
            },
            {
                template: 'custom_dataTransform',
                parameters: { projectName: 'batch-project-2', inputType: 'json', outputFramework: 'vue' }
            },
            {
                template: extendedType,
                parameters: {
                    projectName: 'batch-ai-project',
                    inputType: 'chat',
                    outputFramework: 'express',
                    mlModel: 'transformer',
                    trainingData: 'conversations.json',
                    accuracy: 0.95
                }
            }
        ];
        
        const batchResults = await engine.generateBatch(batchSpecs);
        console.log('Batch generation results:', batchResults.summary);
        
        // Demo 8: Generate consolidated template report
        console.log('\n📊 Demo 8: Template System Report');
        const report = {
            totalTemplates: engine.templates.size,
            customTemplates: Array.from(engine.templates.keys()).filter(k => k.includes('custom') || k.includes('enhanced')),
            validators: engine.validators.size,
            transformers: engine.transformers.size,
            cacheEntries: engine.generatedCache.size
        };
        
        console.log('Template System Report:', report);
        
        // Export comprehensive demo results
        const demoSummary = {
            phase: 'PHASE_1_3_COMPLETE',
            generatedAt: new Date().toISOString(),
            capabilities: [
                'Parameter validation with JSON Schema',
                'Variable substitution ({{}} and ${} patterns)',
                'Template composition and merging',
                'Template inheritance and extension',
                'Parameter transformations (camelCase, kebabCase, etc.)',
                'Batch generation with error handling',
                'File system export with directory structure',
                'Built-in documentation generation',
                'Configuration management',
                'Caching and optimization'
            ],
            demonstrations: [
                'Custom template creation',
                'Component generation with parameters',
                'Filesystem export',
                'Template composition',
                'Parameter transformations', 
                'Template extension',
                'Batch generation',
                'System reporting'
            ],
            nextSteps: [
                'Integration with existing template registry',
                'Quest system integration for template discovery',
                'Web interface for template management',
                'Template marketplace and sharing',
                'Automated testing and validation'
            ],
            report
        };
        
        await fs.writeFile(
            path.join(__dirname, 'phase-1-3-completion-report.json'),
            JSON.stringify(demoSummary, null, 2),
            'utf8'
        );
        
        console.log('\n🎉 Template Generation Engine Demo Complete!');
        console.log('📋 Phase 1.3 capabilities fully demonstrated');
        console.log('📁 Results exported to generated-demo/ and phase-1-3-completion-report.json');
        
    } catch (error) {
        console.error('❌ Demo error:', error.message);
        console.error(error.stack);
    }
}

// Run demo if called directly
if (require.main === module) {
    runDemo()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = { runDemo };