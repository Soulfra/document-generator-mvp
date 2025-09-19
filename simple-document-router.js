#!/usr/bin/env node
/**
 * 🎯 SIMPLE DOCUMENT ROUTER
 * 
 * One entry point to rule them all. No more architectural inception.
 * Takes input, routes to the RIGHT generator, returns output.
 */

const fs = require('fs').promises;
const path = require('path');

class SimpleDocumentRouter {
    constructor() {
        // Map of actual working generators (not theoretical ones)
        this.generators = {
            // Document to MVP (original functionality)
            'mvp': {
                handler: './mvp-generator.js',
                description: 'Generate MVP from business document',
                exists: false
            },
            
            // MCP Template Processor (already built)
            'template': {
                handler: './mcp/template-processor',
                description: 'Process MCP templates',
                exists: false
            },
            
            // Plugin Generator (just created)
            'plugin': {
                handler: './universal-plugin-generator/index.js',
                description: 'Generate plugins for multiple platforms',
                exists: false
            },
            
            // Document Parser
            'parse': {
                handler: './FinishThisIdea/document-parser.js',
                description: 'Parse and analyze documents',
                exists: false
            }
        };
        
        this.checkAvailableGenerators();
    }
    
    async checkAvailableGenerators() {
        // Check which generators actually exist
        for (const [type, config] of Object.entries(this.generators)) {
            try {
                await fs.access(config.handler);
                config.exists = true;
                console.log(`✅ ${type}: ${config.description}`);
            } catch {
                console.log(`❌ ${type}: Not found at ${config.handler}`);
            }
        }
    }
    
    async route(input, type = 'mvp', options = {}) {
        console.log(`\n🎯 Routing to ${type} generator...`);
        
        // Check if generator exists
        const generator = this.generators[type];
        if (!generator) {
            throw new Error(`Unknown generator type: ${type}. Available: ${Object.keys(this.generators).join(', ')}`);
        }
        
        if (!generator.exists) {
            throw new Error(`Generator ${type} not found at ${generator.handler}`);
        }
        
        // Load and execute the generator
        try {
            const GeneratorClass = require(generator.handler);
            
            // Handle different export styles
            if (typeof GeneratorClass === 'function') {
                // Constructor function
                const instance = new GeneratorClass();
                if (instance.generate) {
                    return await instance.generate(input, options);
                } else if (instance.process) {
                    return await instance.process(input, options);
                }
            } else if (GeneratorClass.generate) {
                // Object with generate method
                return await GeneratorClass.generate(input, options);
            } else if (GeneratorClass.process) {
                // Object with process method
                return await GeneratorClass.process(input, options);
            }
            
            throw new Error(`Generator ${type} doesn't have a generate() or process() method`);
            
        } catch (error) {
            console.error(`❌ Failed to execute ${type} generator:`, error.message);
            throw error;
        }
    }
    
    async processFile(filePath, type = 'mvp', options = {}) {
        console.log(`📄 Processing file: ${filePath}`);
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return await this.route(content, type, options);
        } catch (error) {
            console.error('❌ Failed to process file:', error.message);
            throw error;
        }
    }
    
    listAvailable() {
        console.log('\n📋 Available Generators:\n');
        
        for (const [type, config] of Object.entries(this.generators)) {
            const status = config.exists ? '✅' : '❌';
            console.log(`${status} ${type.padEnd(10)} - ${config.description}`);
        }
        
        console.log('\n📝 Usage Examples:');
        console.log('  node simple-document-router.js "Create a note-taking app" plugin');
        console.log('  node simple-document-router.js business-plan.md mvp');
        console.log('  node simple-document-router.js spec.json template\n');
    }
}

// Simple CLI interface
if (require.main === module) {
    const router = new SimpleDocumentRouter();
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help') {
        console.log(`
🎯 Simple Document Router

Usage: node simple-document-router.js [input] [type] [options]

Arguments:
  input    Text string or file path
  type     Generator type (mvp, template, plugin, parse)
  options  Additional options as key=value pairs

Examples:
  node simple-document-router.js "Create a chat app" mvp
  node simple-document-router.js business-plan.md mvp
  node simple-document-router.js "Note-taking plugin" plugin platforms=obsidian,vscode
        `);
        
        router.listAvailable();
        process.exit(0);
    }
    
    const input = args[0];
    const type = args[1] || 'mvp';
    const options = {};
    
    // Parse options
    for (let i = 2; i < args.length; i++) {
        const [key, value] = args[i].split('=');
        if (value) {
            options[key] = value.includes(',') ? value.split(',') : value;
        }
    }
    
    // Check if input is a file
    fs.access(input)
        .then(() => router.processFile(input, type, options))
        .catch(() => router.route(input, type, options))
        .then(result => {
            console.log('\n✅ Success!');
            console.log('Result:', result);
        })
        .catch(error => {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        });
}

module.exports = SimpleDocumentRouter;