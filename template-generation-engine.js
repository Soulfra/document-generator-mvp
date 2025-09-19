#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 🏭 TEMPLATE GENERATION ENGINE
 * Phase 1.3 of Template Consolidation Plan
 * 
 * Builds parameterized template system with:
 * - Variable substitution and validation
 * - Template composition and inheritance
 * - Dynamic parameter injection
 * - Type safety and schema validation
 * - Built-in documentation generation
 */

class TemplateGenerationEngine {
    constructor() {
        this.templates = new Map();
        this.validators = new Map();
        this.transformers = new Map();
        this.generatedCache = new Map();
        this.initializeEngine();
    }

    async initializeEngine() {
        console.log('🏭 Initializing Template Generation Engine...');
        
        // Load consolidated template registry
        await this.loadTemplateRegistry();
        
        // Set up built-in validators
        this.setupValidators();
        
        // Set up built-in transformers
        this.setupTransformers();
        
        console.log(`✅ Template Generation Engine initialized with ${this.templates.size} templates`);
    }

    async loadTemplateRegistry() {
        try {
            const registryPath = path.join(__dirname, 'template-registry-consolidated.json');
            const registryData = await fs.readFile(registryPath, 'utf8');
            const registry = JSON.parse(registryData);
            
            // Load each template type
            Object.entries(registry.consolidatedSystems).forEach(([type, system]) => {
                this.templates.set(type, {
                    ...system,
                    parameters: this.extractParameters(system),
                    schema: this.generateSchema(system)
                });
            });
            
            console.log(`📦 Loaded ${this.templates.size} template types from registry`);
        } catch (error) {
            console.error('❌ Error loading template registry:', error.message);
            // Initialize with empty registry if file not found
        }
    }

    extractParameters(template) {
        const parameters = new Set();
        const content = JSON.stringify(template);
        
        // Find all {{variable}} patterns
        const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
        if (variableMatches) {
            variableMatches.forEach(match => {
                const variable = match.replace(/\{\{|\}\}/g, '').trim();
                parameters.add(variable);
            });
        }
        
        // Find all ${variable} patterns
        const jsVariableMatches = content.match(/\$\{([^}]+)\}/g);
        if (jsVariableMatches) {
            jsVariableMatches.forEach(match => {
                const variable = match.replace(/\$\{|\}/g, '').trim();
                parameters.add(variable);
            });
        }
        
        return Array.from(parameters);
    }

    generateSchema(template) {
        const parameters = this.extractParameters(template);
        const schema = {
            type: 'object',
            properties: {},
            required: []
        };
        
        parameters.forEach(param => {
            // Infer type from parameter name patterns
            let type = 'string';
            let required = true;
            
            if (param.includes('port') || param.includes('count') || param.includes('id')) {
                type = 'integer';
            } else if (param.includes('enabled') || param.includes('active')) {
                type = 'boolean';
            } else if (param.includes('config') || param.includes('metadata')) {
                type = 'object';
            } else if (param.includes('list') || param.includes('array')) {
                type = 'array';
            }
            
            if (param.includes('optional') || param.endsWith('?')) {
                required = false;
            }
            
            schema.properties[param] = { type };
            if (required) {
                schema.required.push(param);
            }
        });
        
        return schema;
    }

    setupValidators() {
        // String validators
        this.validators.set('string', (value) => typeof value === 'string');
        this.validators.set('string.notEmpty', (value) => typeof value === 'string' && value.length > 0);
        this.validators.set('string.alphanumeric', (value) => /^[a-zA-Z0-9]+$/.test(value));
        this.validators.set('string.slug', (value) => /^[a-z0-9-]+$/.test(value));
        
        // Number validators
        this.validators.set('integer', (value) => Number.isInteger(value));
        this.validators.set('integer.positive', (value) => Number.isInteger(value) && value > 0);
        this.validators.set('port', (value) => Number.isInteger(value) && value >= 1000 && value <= 65535);
        
        // Boolean validators
        this.validators.set('boolean', (value) => typeof value === 'boolean');
        
        // Object validators
        this.validators.set('object', (value) => typeof value === 'object' && value !== null);
        this.validators.set('array', (value) => Array.isArray(value));
        
        // Domain-specific validators
        this.validators.set('serviceName', (value) => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(value));
        this.validators.set('componentType', (value) => ['dataTransform', 'resourceManagement', 'competition', 'status', 'instance'].includes(value));
    }

    setupTransformers() {
        // String transformers
        this.transformers.set('uppercase', (value) => String(value).toUpperCase());
        this.transformers.set('lowercase', (value) => String(value).toLowerCase());
        this.transformers.set('camelCase', (value) => this.toCamelCase(String(value)));
        this.transformers.set('kebabCase', (value) => this.toKebabCase(String(value)));
        this.transformers.set('snakeCase', (value) => this.toSnakeCase(String(value)));
        
        // Utility transformers
        this.transformers.set('timestamp', () => new Date().toISOString());
        this.transformers.set('uuid', () => crypto.randomUUID());
        this.transformers.set('hash', (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8));
        
        // Template-specific transformers
        this.transformers.set('portRange', (base) => parseInt(base) + Math.floor(Math.random() * 1000));
        this.transformers.set('resourceAllocation', (type) => {
            const allocations = {
                'dataTransform': { cpu: 30, memory: 300 },
                'resourceManagement': { cpu: 25, memory: 250 },
                'competition': { cpu: 40, memory: 400 },
                'status': { cpu: 15, memory: 150 },
                'instance': { cpu: 35, memory: 350 }
            };
            return allocations[type] || { cpu: 20, memory: 200 };
        });
    }

    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    toKebabCase(str) {
        return str.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase());
    }

    toSnakeCase(str) {
        return str.replace(/[A-Z]/g, (match) => '_' + match.toLowerCase());
    }

    /**
     * Generate a new component/service from template
     */
    async generate(templateType, parameters, options = {}) {
        const template = this.templates.get(templateType);
        if (!template) {
            throw new Error(`Template type '${templateType}' not found`);
        }

        console.log(`🔨 Generating ${templateType} component with parameters:`, parameters);

        // Validate parameters
        const validation = this.validateParameters(parameters, template.schema);
        if (!validation.valid) {
            throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
        }

        // Apply transformers to parameters
        const transformedParameters = await this.applyTransformers(parameters, options.transforms || {});

        // Generate component
        const generated = await this.processTemplate(template, transformedParameters, options);

        // Cache generated result
        const cacheKey = this.generateCacheKey(templateType, transformedParameters);
        this.generatedCache.set(cacheKey, generated);

        return generated;
    }

    validateParameters(parameters, schema) {
        const errors = [];

        // Handle missing or malformed schema
        if (!schema || !schema.properties) {
            console.warn('⚠️ No schema provided for validation, skipping...');
            return { valid: true, errors: [] };
        }

        // Check required parameters
        if (schema.required && Array.isArray(schema.required)) {
            schema.required.forEach(param => {
                if (!(param in parameters)) {
                    errors.push(`Missing required parameter: ${param}`);
                }
            });
        }

        // Validate parameter types
        Object.entries(parameters).forEach(([key, value]) => {
            const propSchema = schema.properties[key];
            if (propSchema) {
                const validator = this.validators.get(propSchema.type);
                if (validator && !validator(value)) {
                    errors.push(`Invalid type for parameter '${key}': expected ${propSchema.type}`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async applyTransformers(parameters, transforms) {
        const transformed = { ...parameters };

        for (const [param, transformList] of Object.entries(transforms)) {
            if (param in transformed) {
                let value = transformed[param];
                
                // Apply each transform in sequence
                for (const transformName of transformList) {
                    const transformer = this.transformers.get(transformName);
                    if (transformer) {
                        value = await transformer(value);
                    }
                }
                
                transformed[param] = value;
            }
        }

        return transformed;
    }

    async processTemplate(template, parameters, options) {
        const generated = {
            metadata: {
                templateType: template.type,
                generatedAt: new Date().toISOString(),
                parameters,
                version: template.version || '1.0.0'
            },
            files: {},
            configuration: {},
            documentation: ''
        };

        // Process each file in template
        if (template.files) {
            for (const [filename, fileTemplate] of Object.entries(template.files)) {
                const processedContent = this.substituteVariables(fileTemplate, parameters);
                const processedFilename = this.substituteVariables(filename, parameters);
                
                generated.files[processedFilename] = processedContent;
            }
        }

        // Process configuration
        if (template.configuration) {
            generated.configuration = this.substituteVariables(template.configuration, parameters);
        }

        // Generate documentation
        generated.documentation = this.generateDocumentation(template, parameters);

        // Apply post-processing if specified
        if (options.postProcess) {
            return await options.postProcess(generated);
        }

        return generated;
    }

    substituteVariables(content, parameters) {
        if (typeof content === 'string') {
            let processed = content;
            
            // Replace {{variable}} patterns
            processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
                const key = variable.trim();
                return parameters[key] !== undefined ? parameters[key] : match;
            });
            
            // Replace ${variable} patterns
            processed = processed.replace(/\$\{([^}]+)\}/g, (match, variable) => {
                const key = variable.trim();
                return parameters[key] !== undefined ? parameters[key] : match;
            });
            
            return processed;
        } else if (typeof content === 'object' && content !== null) {
            if (Array.isArray(content)) {
                return content.map(item => this.substituteVariables(item, parameters));
            } else {
                const processed = {};
                for (const [key, value] of Object.entries(content)) {
                    const processedKey = this.substituteVariables(key, parameters);
                    processed[processedKey] = this.substituteVariables(value, parameters);
                }
                return processed;
            }
        }
        
        return content;
    }

    generateDocumentation(template, parameters) {
        const docs = [];
        
        docs.push(`# ${parameters.name || template.type} Component`);
        docs.push('');
        docs.push(`Generated from template: ${template.type}`);
        docs.push(`Generated at: ${new Date().toISOString()}`);
        docs.push('');
        
        if (template.description) {
            docs.push(`## Description`);
            docs.push(template.description);
            docs.push('');
        }
        
        docs.push(`## Parameters`);
        Object.entries(parameters).forEach(([key, value]) => {
            docs.push(`- **${key}**: ${JSON.stringify(value)}`);
        });
        docs.push('');
        
        if (template.features) {
            docs.push(`## Features`);
            template.features.forEach(feature => {
                docs.push(`- ${feature}`);
            });
            docs.push('');
        }
        
        return docs.join('\n');
    }

    generateCacheKey(templateType, parameters) {
        const content = templateType + JSON.stringify(parameters);
        return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * Template composition - combine multiple templates
     */
    async compose(templateSpecs, options = {}) {
        console.log(`🔗 Composing ${templateSpecs.length} templates...`);
        
        const composedResults = [];
        
        for (const spec of templateSpecs) {
            const result = await this.generate(spec.template, spec.parameters, spec.options || {});
            composedResults.push(result);
        }
        
        // Merge results based on composition strategy
        const strategy = options.strategy || 'merge';
        
        switch (strategy) {
            case 'merge':
                return this.mergeResults(composedResults);
            case 'layer':
                return this.layerResults(composedResults);
            case 'separate':
                return composedResults;
            default:
                return composedResults;
        }
    }

    mergeResults(results) {
        const merged = {
            metadata: {
                composedAt: new Date().toISOString(),
                components: results.map(r => r.metadata.templateType)
            },
            files: {},
            configuration: {},
            documentation: ''
        };
        
        // Merge files
        results.forEach(result => {
            Object.assign(merged.files, result.files);
        });
        
        // Merge configurations
        results.forEach(result => {
            Object.assign(merged.configuration, result.configuration);
        });
        
        // Combine documentation
        merged.documentation = results.map(r => r.documentation).join('\n\n---\n\n');
        
        return merged;
    }

    layerResults(results) {
        // Layer results in dependency order
        return {
            layers: results,
            metadata: {
                layeredAt: new Date().toISOString(),
                totalLayers: results.length
            }
        };
    }

    /**
     * Template inheritance - extend existing templates
     */
    async extend(baseTemplate, extensionSpec) {
        const base = this.templates.get(baseTemplate);
        if (!base) {
            throw new Error(`Base template '${baseTemplate}' not found`);
        }
        
        const extended = {
            ...base,
            ...extensionSpec,
            type: extensionSpec.type || `${baseTemplate}_extended`,
            parent: baseTemplate,
            version: extensionSpec.version || '1.0.0'
        };
        
        // Merge parameters and schema
        extended.parameters = [...base.parameters, ...(extensionSpec.parameters || [])];
        extended.schema = this.mergeSchemas(base.schema, extensionSpec.schema || {});
        
        // Register extended template
        this.templates.set(extended.type, extended);
        
        console.log(`📋 Extended template '${baseTemplate}' to '${extended.type}'`);
        return extended.type;
    }

    mergeSchemas(baseSchema, extensionSchema) {
        return {
            type: 'object',
            properties: {
                ...baseSchema.properties,
                ...extensionSchema.properties
            },
            required: [
                ...baseSchema.required,
                ...(extensionSchema.required || [])
            ]
        };
    }

    /**
     * Batch generation for multiple components
     */
    async generateBatch(specifications) {
        console.log(`🏭 Starting batch generation of ${specifications.length} components...`);
        
        const results = [];
        const errors = [];
        
        for (const spec of specifications) {
            try {
                const result = await this.generate(spec.template, spec.parameters, spec.options);
                results.push({
                    ...result,
                    specification: spec
                });
            } catch (error) {
                errors.push({
                    specification: spec,
                    error: error.message
                });
            }
        }
        
        return {
            successful: results,
            failed: errors,
            summary: {
                total: specifications.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    /**
     * Export generated templates to files
     */
    async exportGenerated(generated, outputDir) {
        const outputPath = path.resolve(outputDir);
        
        // Create output directory
        await fs.mkdir(outputPath, { recursive: true });
        
        // Write files
        for (const [filename, content] of Object.entries(generated.files)) {
            const filePath = path.join(outputPath, filename);
            const fileDir = path.dirname(filePath);
            
            await fs.mkdir(fileDir, { recursive: true });
            await fs.writeFile(filePath, content, 'utf8');
        }
        
        // Write configuration
        if (generated.configuration && Object.keys(generated.configuration).length > 0) {
            await fs.writeFile(
                path.join(outputPath, 'config.json'),
                JSON.stringify(generated.configuration, null, 2),
                'utf8'
            );
        }
        
        // Write documentation
        if (generated.documentation) {
            await fs.writeFile(
                path.join(outputPath, 'README.md'),
                generated.documentation,
                'utf8'
            );
        }
        
        // Write metadata
        await fs.writeFile(
            path.join(outputPath, '.generated.json'),
            JSON.stringify(generated.metadata, null, 2),
            'utf8'
        );
        
        console.log(`📁 Exported generated files to ${outputPath}`);
        return outputPath;
    }

    /**
     * CLI interface for template generation
     */
    static async runCLI(args) {
        const engine = new TemplateGenerationEngine();
        await engine.initializeEngine();
        
        const command = args[0];
        
        switch (command) {
            case 'generate':
                return await engine.handleGenerateCommand(args.slice(1));
            case 'list':
                return engine.handleListCommand();
            case 'compose':
                return await engine.handleComposeCommand(args.slice(1));
            case 'extend':
                return await engine.handleExtendCommand(args.slice(1));
            default:
                console.log('Usage: template-generation-engine.js <command> [options]');
                console.log('Commands:');
                console.log('  generate <type> <params.json> [output-dir]');
                console.log('  list');
                console.log('  compose <specs.json> [output-dir]');
                console.log('  extend <base> <extension.json>');
        }
    }

    async handleGenerateCommand(args) {
        const [templateType, paramsFile, outputDir] = args;
        
        if (!templateType || !paramsFile) {
            throw new Error('Usage: generate <type> <params.json> [output-dir]');
        }
        
        const params = JSON.parse(await fs.readFile(paramsFile, 'utf8'));
        const generated = await this.generate(templateType, params);
        
        if (outputDir) {
            await this.exportGenerated(generated, outputDir);
        }
        
        return generated;
    }

    handleListCommand() {
        console.log('Available Templates:');
        this.templates.forEach((template, type) => {
            console.log(`  ${type}: ${template.parameters.length} parameters`);
        });
    }

    async handleComposeCommand(args) {
        const [specsFile, outputDir] = args;
        
        if (!specsFile) {
            throw new Error('Usage: compose <specs.json> [output-dir]');
        }
        
        const specs = JSON.parse(await fs.readFile(specsFile, 'utf8'));
        const composed = await this.compose(specs.templates, specs.options);
        
        if (outputDir) {
            await this.exportGenerated(composed, outputDir);
        }
        
        return composed;
    }

    async handleExtendCommand(args) {
        const [baseTemplate, extensionFile] = args;
        
        if (!baseTemplate || !extensionFile) {
            throw new Error('Usage: extend <base> <extension.json>');
        }
        
        const extension = JSON.parse(await fs.readFile(extensionFile, 'utf8'));
        const extendedType = await this.extend(baseTemplate, extension);
        
        console.log(`Extended template created: ${extendedType}`);
        return extendedType;
    }
}

// CLI execution
if (require.main === module) {
    TemplateGenerationEngine.runCLI(process.argv.slice(2))
        .then(result => {
            if (result && typeof result === 'object') {
                console.log(JSON.stringify(result, null, 2));
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}

module.exports = TemplateGenerationEngine;