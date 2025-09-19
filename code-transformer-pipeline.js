#!/usr/bin/env node

/**
 * Code Transformer Pipeline
 * 
 * AI-powered code transformation system that automatically improves code quality,
 * applies best practices, generates tests, and maintains documentation.
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class CodeTransformerPipeline extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            aiProvider: config.aiProvider || 'ollama',
            ollamaModel: config.ollamaModel || 'codellama:7b',
            transformations: config.transformations || [
                'improve-naming',
                'add-jsdoc',
                'optimize-logic',
                'add-error-handling',
                'generate-tests',
                'update-docs'
            ],
            testFramework: config.testFramework || 'jest',
            styleGuide: config.styleGuide || 'airbnb',
            maxConcurrent: config.maxConcurrent || 3,
            cacheResults: config.cacheResults !== false,
            dryRun: config.dryRun || false,
            ...config
        };
        
        this.transformCache = new Map();
        this.activeTransforms = new Map();
        this.transformQueue = [];
        this.isProcessing = false;
        
        // Transformation strategies
        this.strategies = {
            'improve-naming': this.improveNaming.bind(this),
            'add-jsdoc': this.addJSDoc.bind(this),
            'optimize-logic': this.optimizeLogic.bind(this),
            'add-error-handling': this.addErrorHandling.bind(this),
            'generate-tests': this.generateTests.bind(this),
            'update-docs': this.updateDocumentation.bind(this),
            'refactor-complex': this.refactorComplexCode.bind(this),
            'add-types': this.addTypeAnnotations.bind(this),
            'security-scan': this.securityScan.bind(this),
            'performance-optimize': this.performanceOptimize.bind(this)
        };
    }
    
    /**
     * Transform a single file
     */
    async transformFile(filePath, options = {}) {
        console.log(`🔄 Transforming: ${path.basename(filePath)}`);
        
        try {
            // Read file content
            const content = await fs.readFile(filePath, 'utf8');
            const fileHash = crypto.createHash('md5').update(content).digest('hex');
            
            // Check cache
            if (this.config.cacheResults && this.transformCache.has(fileHash)) {
                console.log('📋 Using cached transformation');
                return this.transformCache.get(fileHash);
            }
            
            // Parse the code
            const ast = await this.parseCode(content, filePath);
            if (!ast) {
                throw new Error('Failed to parse code');
            }
            
            // Apply transformations
            const transformations = options.transformations || this.config.transformations;
            let transformedCode = content;
            let transformedAST = ast;
            const results = {
                original: content,
                transformed: content,
                changes: [],
                metrics: {}
            };
            
            for (const transformation of transformations) {
                if (this.strategies[transformation]) {
                    const result = await this.strategies[transformation](
                        transformedCode,
                        transformedAST,
                        filePath
                    );
                    
                    if (result && result.code !== transformedCode) {
                        transformedCode = result.code;
                        transformedAST = result.ast || transformedAST;
                        results.changes.push({
                            type: transformation,
                            description: result.description || transformation,
                            changes: result.changes || []
                        });
                    }
                }
            }
            
            results.transformed = transformedCode;
            
            // Calculate metrics
            results.metrics = await this.calculateMetrics(content, transformedCode);
            
            // Cache result
            if (this.config.cacheResults) {
                this.transformCache.set(fileHash, results);
            }
            
            // Write back if not dry run
            if (!this.config.dryRun && results.changes.length > 0) {
                await fs.writeFile(filePath, transformedCode, 'utf8');
                console.log(`✅ Transformed ${filePath} with ${results.changes.length} improvements`);
            }
            
            this.emit('fileTransformed', { file: filePath, results });
            return results;
            
        } catch (error) {
            console.error(`❌ Transform failed for ${filePath}:`, error.message);
            this.emit('transformError', { file: filePath, error });
            throw error;
        }
    }
    
    /**
     * Transform multiple files
     */
    async transformFiles(files, options = {}) {
        console.log(`🚀 Transforming ${files.length} files...`);
        
        const results = [];
        const chunks = this.chunkArray(files, this.config.maxConcurrent);
        
        for (const chunk of chunks) {
            const chunkResults = await Promise.allSettled(
                chunk.map(file => this.transformFile(file, options))
            );
            
            results.push(...chunkResults.map((result, index) => ({
                file: chunk[index],
                success: result.status === 'fulfilled',
                result: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            })));
        }
        
        const successful = results.filter(r => r.success).length;
        console.log(`✅ Transformed ${successful}/${files.length} files`);
        
        this.emit('batchComplete', { results });
        return results;
    }
    
    /**
     * Parse code into AST
     */
    async parseCode(code, filePath) {
        try {
            const ext = path.extname(filePath);
            const isTypeScript = ['.ts', '.tsx'].includes(ext);
            const isJSX = ['.jsx', '.tsx'].includes(ext);
            
            const ast = parse(code, {
                sourceType: 'module',
                plugins: [
                    'jsx',
                    'typescript',
                    'decorators-legacy',
                    'classProperties',
                    'asyncGenerators',
                    'dynamicImport',
                    'optionalChaining',
                    'nullishCoalescingOperator'
                ]
            });
            
            return ast;
        } catch (error) {
            console.error('Parse error:', error.message);
            return null;
        }
    }
    
    /**
     * Improve variable and function naming
     */
    async improveNaming(code, ast, filePath) {
        console.log('🏷️  Improving naming conventions...');
        
        const namingSuggestions = [];
        let modified = false;
        
        traverse(ast, {
            Identifier(path) {
                const name = path.node.name;
                
                // Skip if it's a property key or already well-named
                if (path.isProperty() || this.isWellNamed(name)) {
                    return;
                }
                
                // Check for common bad patterns
                if (this.isPoorlyNamed(name)) {
                    namingSuggestions.push({
                        original: name,
                        line: path.node.loc?.start.line,
                        type: path.parent.type
                    });
                }
            }
        });
        
        // Use AI to suggest better names
        if (namingSuggestions.length > 0) {
            const suggestions = await this.askAIForNaming(code, namingSuggestions);
            
            if (suggestions && suggestions.length > 0) {
                // Apply naming improvements
                const updatedCode = await this.applyNamingChanges(code, suggestions);
                modified = updatedCode !== code;
                
                if (modified) {
                    return {
                        code: updatedCode,
                        ast: this.parseCode(updatedCode, filePath),
                        description: `Improved ${suggestions.length} variable/function names`,
                        changes: suggestions
                    };
                }
            }
        }
        
        return { code, ast };
    }
    
    /**
     * Add JSDoc comments
     */
    async addJSDoc(code, ast, filePath) {
        console.log('📝 Adding JSDoc comments...');
        
        const functionsNeedingDocs = [];
        
        traverse(ast, {
            FunctionDeclaration(path) {
                if (!this.hasJSDoc(path)) {
                    functionsNeedingDocs.push({
                        name: path.node.id?.name || 'anonymous',
                        params: path.node.params.map(p => this.getParamName(p)),
                        line: path.node.loc?.start.line,
                        code: generate(path.node).code
                    });
                }
            },
            
            ArrowFunctionExpression(path) {
                if (!this.hasJSDoc(path) && path.parent.type === 'VariableDeclarator') {
                    functionsNeedingDocs.push({
                        name: path.parent.id?.name || 'anonymous',
                        params: path.node.params.map(p => this.getParamName(p)),
                        line: path.node.loc?.start.line,
                        code: generate(path.node).code
                    });
                }
            },
            
            ClassMethod(path) {
                if (!this.hasJSDoc(path)) {
                    functionsNeedingDocs.push({
                        name: path.node.key?.name || 'anonymous',
                        params: path.node.params.map(p => this.getParamName(p)),
                        line: path.node.loc?.start.line,
                        code: generate(path.node).code,
                        isMethod: true,
                        className: path.parent.parent.id?.name
                    });
                }
            }
        });
        
        if (functionsNeedingDocs.length > 0) {
            const docs = await this.generateJSDocs(functionsNeedingDocs);
            
            if (docs && docs.length > 0) {
                const updatedCode = this.insertJSDocs(code, docs);
                
                return {
                    code: updatedCode,
                    ast: await this.parseCode(updatedCode, filePath),
                    description: `Added ${docs.length} JSDoc comments`,
                    changes: docs
                };
            }
        }
        
        return { code, ast };
    }
    
    /**
     * Add error handling
     */
    async addErrorHandling(code, ast, filePath) {
        console.log('🛡️  Adding error handling...');
        
        const vulnerableCode = [];
        
        traverse(ast, {
            // Find async functions without try-catch
            AsyncFunctionDeclaration(path) {
                if (!this.hasTryCatch(path)) {
                    vulnerableCode.push({
                        type: 'async-function',
                        name: path.node.id?.name,
                        line: path.node.loc?.start.line
                    });
                }
            },
            
            // Find promise chains without catch
            CallExpression(path) {
                if (this.isPromiseChain(path) && !this.hasPromiseCatch(path)) {
                    vulnerableCode.push({
                        type: 'promise-chain',
                        line: path.node.loc?.start.line
                    });
                }
            },
            
            // Find file operations without error handling
            MemberExpression(path) {
                if (this.isFileOperation(path) && !this.isInTryCatch(path)) {
                    vulnerableCode.push({
                        type: 'file-operation',
                        operation: path.node.property?.name,
                        line: path.node.loc?.start.line
                    });
                }
            }
        });
        
        if (vulnerableCode.length > 0) {
            const errorHandlingCode = await this.generateErrorHandling(code, vulnerableCode);
            
            if (errorHandlingCode && errorHandlingCode !== code) {
                return {
                    code: errorHandlingCode,
                    ast: await this.parseCode(errorHandlingCode, filePath),
                    description: `Added error handling to ${vulnerableCode.length} locations`,
                    changes: vulnerableCode
                };
            }
        }
        
        return { code, ast };
    }
    
    /**
     * Generate tests for code
     */
    async generateTests(code, ast, filePath) {
        console.log('🧪 Generating tests...');
        
        // Extract testable functions
        const testableFunctions = [];
        
        traverse(ast, {
            ExportNamedDeclaration(path) {
                if (path.node.declaration?.type === 'FunctionDeclaration') {
                    testableFunctions.push({
                        name: path.node.declaration.id?.name,
                        params: path.node.declaration.params.map(p => this.getParamName(p)),
                        isAsync: path.node.declaration.async,
                        code: generate(path.node.declaration).code
                    });
                }
            },
            
            ExportDefaultDeclaration(path) {
                if (path.node.declaration?.type === 'ClassDeclaration') {
                    const methods = [];
                    traverse(path.node, {
                        ClassMethod(methodPath) {
                            methods.push({
                                name: methodPath.node.key?.name,
                                params: methodPath.node.params.map(p => this.getParamName(p)),
                                isAsync: methodPath.node.async
                            });
                        }
                    }, path.scope, path);
                    
                    testableFunctions.push({
                        name: path.node.declaration.id?.name || 'default',
                        type: 'class',
                        methods
                    });
                }
            }
        });
        
        if (testableFunctions.length > 0) {
            const testCode = await this.generateTestCode(testableFunctions, filePath);
            
            if (testCode) {
                // Write test file
                const testFilePath = this.getTestFilePath(filePath);
                
                if (!this.config.dryRun) {
                    await fs.writeFile(testFilePath, testCode, 'utf8');
                }
                
                return {
                    code, // Original code unchanged
                    ast,
                    description: `Generated tests for ${testableFunctions.length} functions`,
                    changes: [{
                        type: 'test-file',
                        path: testFilePath,
                        functions: testableFunctions.length
                    }]
                };
            }
        }
        
        return { code, ast };
    }
    
    /**
     * Optimize logic and performance
     */
    async optimizeLogic(code, ast, filePath) {
        console.log('⚡ Optimizing logic...');
        
        const optimizations = [];
        
        traverse(ast, {
            // Detect inefficient array operations
            CallExpression(path) {
                if (this.isInefficientArrayOperation(path)) {
                    optimizations.push({
                        type: 'array-operation',
                        line: path.node.loc?.start.line,
                        current: generate(path.node).code
                    });
                }
            },
            
            // Detect repeated computations
            FunctionDeclaration(path) {
                const repeatedComputations = this.findRepeatedComputations(path);
                if (repeatedComputations.length > 0) {
                    optimizations.push({
                        type: 'repeated-computation',
                        function: path.node.id?.name,
                        occurrences: repeatedComputations.length
                    });
                }
            },
            
            // Detect unnecessary loops
            ForStatement(path) {
                if (this.canSimplifyLoop(path)) {
                    optimizations.push({
                        type: 'simplify-loop',
                        line: path.node.loc?.start.line
                    });
                }
            }
        });
        
        if (optimizations.length > 0) {
            const optimizedCode = await this.applyOptimizations(code, optimizations);
            
            if (optimizedCode && optimizedCode !== code) {
                return {
                    code: optimizedCode,
                    ast: await this.parseCode(optimizedCode, filePath),
                    description: `Applied ${optimizations.length} optimizations`,
                    changes: optimizations
                };
            }
        }
        
        return { code, ast };
    }
    
    /**
     * AI interaction methods
     */
    async askAIForNaming(code, suggestions) {
        const prompt = `Suggest better names for these poorly named variables/functions:
${suggestions.map(s => `- "${s.original}" (${s.type} at line ${s.line})`).join('\n')}

Context from code:
${code.slice(0, 1000)}

Provide suggestions in JSON format: [{"original": "x", "suggested": "userData", "reason": "more descriptive"}]`;
        
        try {
            const response = await this.callAI(prompt, 'naming-suggestions');
            return JSON.parse(response);
        } catch (error) {
            console.error('AI naming suggestion failed:', error);
            return null;
        }
    }
    
    async generateJSDocs(functions) {
        const prompt = `Generate JSDoc comments for these functions:
${functions.map(f => `
Function: ${f.name}
Parameters: ${f.params.join(', ')}
${f.isMethod ? `Class: ${f.className}` : ''}
Code snippet: ${f.code.slice(0, 200)}...
`).join('\n---\n')}

Return JSON array with: [{"function": "name", "jsdoc": "/** JSDoc here */", "line": lineNumber}]`;
        
        try {
            const response = await this.callAI(prompt, 'jsdoc-generation');
            return JSON.parse(response);
        } catch (error) {
            console.error('JSDoc generation failed:', error);
            return null;
        }
    }
    
    async generateTestCode(functions, filePath) {
        const fileName = path.basename(filePath, path.extname(filePath));
        
        const prompt = `Generate ${this.config.testFramework} tests for these functions:
${functions.map(f => {
    if (f.type === 'class') {
        return `Class: ${f.name} with methods: ${f.methods.map(m => m.name).join(', ')}`;
    }
    return `Function: ${f.name}(${f.params.join(', ')}) ${f.isAsync ? '[async]' : ''}`;
}).join('\n')}

File: ${fileName}
Import from: './${fileName}'

Generate complete test file with proper imports, describe blocks, and meaningful test cases.`;
        
        try {
            return await this.callAI(prompt, 'test-generation');
        } catch (error) {
            console.error('Test generation failed:', error);
            return null;
        }
    }
    
    async callAI(prompt, purpose) {
        if (this.config.dryRun) {
            return `// [DRY RUN] ${purpose} would be generated here`;
        }
        
        try {
            if (this.config.aiProvider === 'ollama') {
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: this.config.ollamaModel,
                        prompt,
                        stream: false,
                        options: {
                            temperature: 0.7,
                            top_p: 0.9
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Ollama API error: ${response.statusText}`);
                }
                
                const data = await response.json();
                return data.response.trim();
            }
            
            return null;
            
        } catch (error) {
            console.error(`AI request failed for ${purpose}:`, error.message);
            return null;
        }
    }
    
    /**
     * Helper methods
     */
    isWellNamed(name) {
        // Check if name follows good conventions
        return name.length > 2 && 
               !name.match(/^[a-z]$/) &&
               !name.match(/^temp|tmp|data|val|res|ret|arr|obj|str|num$/i) &&
               name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/);
    }
    
    isPoorlyNamed(name) {
        return name.match(/^[a-z]$/) ||
               name.match(/^(x|y|z|i|j|k|a|b|c|d|e|f|g)$/i) ||
               name.match(/^(temp|tmp|data|val|res|ret|arr|obj|str|num|foo|bar|baz)$/i);
    }
    
    hasJSDoc(path) {
        const comments = path.node.leadingComments || [];
        return comments.some(comment => comment.value.includes('*'));
    }
    
    hasTryCatch(path) {
        let hasTry = false;
        traverse(path.node, {
            TryStatement() {
                hasTry = true;
            }
        }, path.scope, path);
        return hasTry;
    }
    
    getParamName(param) {
        if (param.type === 'Identifier') return param.name;
        if (param.type === 'ObjectPattern') return 'options';
        if (param.type === 'ArrayPattern') return 'array';
        if (param.type === 'RestElement') return '...' + this.getParamName(param.argument);
        return 'param';
    }
    
    getTestFilePath(filePath) {
        const dir = path.dirname(filePath);
        const name = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        
        // Check for common test directory structures
        const testDir = dir.replace('/src', '/__tests__').replace('/lib', '/__tests__');
        
        return path.join(testDir, `${name}.test${ext}`);
    }
    
    calculateMetrics(original, transformed) {
        return {
            originalLines: original.split('\n').length,
            transformedLines: transformed.split('\n').length,
            originalSize: original.length,
            transformedSize: transformed.length,
            improvement: ((original.length - transformed.length) / original.length * 100).toFixed(2) + '%'
        };
    }
    
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    insertJSDocs(code, docs) {
        const lines = code.split('\n');
        const sortedDocs = docs.sort((a, b) => b.line - a.line);
        
        for (const doc of sortedDocs) {
            if (doc.line > 0 && doc.line <= lines.length) {
                // Insert JSDoc before the function
                lines.splice(doc.line - 1, 0, doc.jsdoc);
            }
        }
        
        return lines.join('\n');
    }
    
    // More helper methods for specific transformations...
    isInefficientArrayOperation(path) {
        // Detect patterns like .filter().map() that could be combined
        if (path.node.callee?.property?.name === 'map') {
            const object = path.node.callee.object;
            if (object?.callee?.property?.name === 'filter') {
                return true;
            }
        }
        return false;
    }
    
    findRepeatedComputations(path) {
        const computations = new Map();
        const repeated = [];
        
        traverse(path.node, {
            CallExpression(callPath) {
                const code = generate(callPath.node).code;
                if (computations.has(code)) {
                    repeated.push(code);
                } else {
                    computations.set(code, 1);
                }
            }
        }, path.scope, path);
        
        return repeated;
    }
    
    canSimplifyLoop(path) {
        // Check if loop can be replaced with array methods
        // This is a simplified check - real implementation would be more comprehensive
        return false;
    }
    
    isPromiseChain(path) {
        return path.node.callee?.property?.name === 'then';
    }
    
    hasPromiseCatch(path) {
        let current = path;
        while (current) {
            if (current.node.callee?.property?.name === 'catch') {
                return true;
            }
            current = current.parentPath;
        }
        return false;
    }
    
    isFileOperation(path) {
        const fsOps = ['readFile', 'writeFile', 'readdir', 'unlink', 'mkdir'];
        return path.node.property && fsOps.includes(path.node.property.name);
    }
    
    isInTryCatch(path) {
        let current = path;
        while (current) {
            if (current.node.type === 'TryStatement') {
                return true;
            }
            current = current.parentPath;
        }
        return false;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Code Transformer Pipeline

Usage:
  node code-transformer-pipeline.js <files...> [options]
  
Options:
  --dry-run              Preview changes without modifying files
  --transformations      Comma-separated list of transformations
  --test-framework       Test framework (jest, mocha, etc.)
  --style-guide         Style guide to follow
  
Available transformations:
  - improve-naming       Improve variable and function names
  - add-jsdoc           Add JSDoc comments
  - optimize-logic      Optimize code logic
  - add-error-handling  Add error handling
  - generate-tests      Generate test files
  - update-docs         Update documentation
        `);
        process.exit(0);
    }
    
    const files = args.filter(arg => !arg.startsWith('--'));
    const options = {
        dryRun: args.includes('--dry-run')
    };
    
    const transformer = new CodeTransformerPipeline(options);
    
    transformer.transformFiles(files).then(results => {
        const successful = results.filter(r => r.success).length;
        console.log(`\n✅ Transformation complete: ${successful}/${results.length} files`);
        
        if (options.dryRun) {
            console.log('\n[DRY RUN] No files were modified');
        }
    }).catch(error => {
        console.error('❌ Transformation failed:', error);
        process.exit(1);
    });
}

module.exports = CodeTransformerPipeline;