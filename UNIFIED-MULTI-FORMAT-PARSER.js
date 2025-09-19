#!/usr/bin/env node

/**
 * 📄 UNIFIED MULTI-FORMAT PARSER
 * 
 * A "normal" parser that just works - no shell games, no over-engineering.
 * Handles the formats you actually need: Markdown, HTML, React, Vue, TypeScript, etc.
 * 
 * Inspired by Speechify's simple approach: detect format → parse content → return results
 * Implements "backwards to forwards" pattern: simple detection → complex analysis
 */

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const { parse: parseHtml } = require('node-html-parser');

class UnifiedMultiFormatParser {
    constructor(options = {}) {
        this.config = {
            // Simple format detection patterns
            formatDetection: {
                markdown: ['.md', '.markdown', '.mdown'],
                html: ['.html', '.htm'],
                react: ['.jsx', '.tsx'],
                vue: ['.vue'],
                typescript: ['.ts', '.tsx'],
                javascript: ['.js', '.jsx'],
                css: ['.css', '.scss', '.sass', '.less'],
                json: ['.json'],
                yaml: ['.yml', '.yaml'],
                xml: ['.xml'],
                text: ['.txt']
            },
            
            // Parsing options
            parsingOptions: {
                extractMetadata: options.extractMetadata !== false,
                preserveWhitespace: options.preserveWhitespace || false,
                includeLineNumbers: options.includeLineNumbers || false,
                maxFileSize: options.maxFileSize || 50 * 1024 * 1024, // 50MB
                encoding: options.encoding || 'utf8'
            },
            
            // Output preferences
            outputFormat: options.outputFormat || 'structured',
            includeRawContent: options.includeRawContent !== false,
            
            ...options
        };
        
        // Parser state
        this.parsingStats = {
            filesProcessed: 0,
            formatsDetected: new Map(),
            processingTime: 0,
            errors: []
        };
        
        // Initialize format-specific parsers
        this.initializeParsers();
    }
    
    /**
     * Initialize format-specific parsing functions
     */
    initializeParsers() {
        this.parsers = {
            markdown: this.parseMarkdown.bind(this),
            html: this.parseHtml.bind(this),
            react: this.parseReact.bind(this),
            vue: this.parseVue.bind(this),
            typescript: this.parseTypeScript.bind(this),
            javascript: this.parseJavaScript.bind(this),
            css: this.parseCss.bind(this),
            json: this.parseJson.bind(this),
            yaml: this.parseYaml.bind(this),
            xml: this.parseXml.bind(this),
            text: this.parseText.bind(this)
        };
    }
    
    /**
     * Main parsing function - detect format and parse accordingly
     */
    async parse(input, options = {}) {
        const startTime = Date.now();
        
        try {
            // Handle different input types
            let content, format, filename;
            
            if (typeof input === 'string') {
                if (await this.isFilePath(input)) {
                    // File path
                    content = await fs.readFile(input, this.config.parsingOptions.encoding);
                    filename = path.basename(input);
                    format = this.detectFormatFromFilename(filename);
                } else {
                    // Raw content string
                    content = input;
                    format = this.detectFormatFromContent(content);
                    filename = options.filename || 'content.txt';
                }
            } else if (input.buffer && input.originalname) {
                // Express multer file object
                content = input.buffer.toString(this.config.parsingOptions.encoding);
                filename = input.originalname;
                format = this.detectFormatFromFilename(filename);
            } else {
                throw new Error('Invalid input type. Expected file path, content string, or file object.');
            }
            
            // Validate file size
            if (content.length > this.config.parsingOptions.maxFileSize) {
                throw new Error(`File too large. Max size: ${this.config.parsingOptions.maxFileSize} bytes`);
            }
            
            // Parse using appropriate parser
            const parser = this.parsers[format];
            if (!parser) {
                throw new Error(`No parser available for format: ${format}`);
            }
            
            const result = await parser(content, { filename, ...options });
            
            // Add metadata
            const parsingTime = Date.now() - startTime;
            this.updateStats(format, parsingTime);
            
            return {
                format,
                filename,
                metadata: {
                    fileSize: content.length,
                    parsingTime,
                    linesCount: content.split('\n').length,
                    wordsCount: this.countWords(content),
                    charactersCount: content.length
                },
                content: result,
                rawContent: this.config.includeRawContent ? content : undefined,
                success: true
            };
            
        } catch (error) {
            this.parsingStats.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                input: typeof input === 'string' ? input.slice(0, 100) + '...' : 'file object'
            });
            
            return {
                success: false,
                error: error.message,
                format: 'unknown',
                content: null
            };
        }
    }
    
    /**
     * Parse multiple files in batch
     */
    async parseBatch(inputs, options = {}) {
        const results = [];
        const concurrent = options.concurrent || 5;
        
        // Process in chunks to avoid overwhelming the system
        for (let i = 0; i < inputs.length; i += concurrent) {
            const chunk = inputs.slice(i, i + concurrent);
            const chunkResults = await Promise.all(
                chunk.map(input => this.parse(input, options))
            );
            results.push(...chunkResults);
        }
        
        return {
            totalFiles: inputs.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
    
    /**
     * Detect format from filename
     */
    detectFormatFromFilename(filename) {
        const ext = path.extname(filename).toLowerCase();
        
        for (const [format, extensions] of Object.entries(this.config.formatDetection)) {
            if (extensions.includes(ext)) {
                return format;
            }
        }
        
        return 'text'; // Default fallback
    }
    
    /**
     * Detect format from content analysis
     */
    detectFormatFromContent(content) {
        const trimmed = content.trim();
        
        // JSON detection
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch {}
        }
        
        // HTML detection
        if (trimmed.includes('<!DOCTYPE html>') || 
            /<html[^>]*>/i.test(trimmed) ||
            /<\/html>/i.test(trimmed)) {
            return 'html';
        }
        
        // Vue component detection
        if (trimmed.includes('<template>') && trimmed.includes('<script>')) {
            return 'vue';
        }
        
        // React/JSX detection
        if (content.includes('import React') || 
            content.includes('from \'react\'') ||
            /export\s+default\s+function\s+\w+\s*\(/.test(content)) {
            return 'react';
        }
        
        // Markdown detection
        if (/^#{1,6}\s/.test(trimmed) || 
            /^\*\s|\d+\.\s/m.test(content) ||
            /\[.*\]\(.*\)/.test(content)) {
            return 'markdown';
        }
        
        // YAML detection
        if (/^---\s*$/.test(trimmed) || 
            /^\w+:\s*[\w\-]/.test(trimmed)) {
            return 'yaml';
        }
        
        // XML detection
        if (trimmed.startsWith('<?xml') || 
            /<\w+[^>]*>.*<\/\w+>/s.test(trimmed)) {
            return 'xml';
        }
        
        // CSS detection
        if (/\{[^}]*\}/.test(content) && 
            /[\w\-#\.]+\s*\{/.test(content)) {
            return 'css';
        }
        
        return 'text';
    }
    
    /**
     * Parse Markdown content
     */
    async parseMarkdown(content, options = {}) {
        const tokens = marked.lexer(content);
        const html = marked(content);
        
        return {
            type: 'markdown',
            html,
            tokens,
            headings: this.extractMarkdownHeadings(tokens),
            links: this.extractMarkdownLinks(tokens),
            codeBlocks: this.extractCodeBlocks(tokens),
            metadata: this.extractMarkdownMetadata(content)
        };
    }
    
    /**
     * Parse HTML content
     */
    async parseHtml(content, options = {}) {
        const root = parseHtml(content);
        
        return {
            type: 'html',
            title: root.querySelector('title')?.text || '',
            headings: this.extractHtmlHeadings(root),
            links: this.extractHtmlLinks(root),
            scripts: this.extractHtmlScripts(root),
            styles: this.extractHtmlStyles(root),
            forms: this.extractHtmlForms(root),
            images: this.extractHtmlImages(root),
            structure: this.analyzeHtmlStructure(root)
        };
    }
    
    /**
     * Parse React/JSX content
     */
    async parseReact(content, options = {}) {
        try {
            // Basic React component analysis without full AST parsing
            const imports = this.extractImports(content);
            const exports = this.extractExports(content);
            const functions = this.extractFunctions(content);
            const jsxElements = this.extractJsxElements(content);
            const hooks = this.extractReactHooks(content);
            
            return {
                type: 'react',
                imports,
                exports,
                functions,
                jsxElements,
                hooks,
                props: this.extractReactProps(content),
                state: this.extractReactState(content)
            };
        } catch (error) {
            return {
                type: 'react',
                error: error.message,
                rawAnalysis: this.basicCodeAnalysis(content)
            };
        }
    }
    
    /**
     * Parse Vue component
     */
    async parseVue(content, options = {}) {
        const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        
        return {
            type: 'vue',
            template: templateMatch ? templateMatch[1].trim() : '',
            script: scriptMatch ? scriptMatch[1].trim() : '',
            style: styleMatch ? styleMatch[1].trim() : '',
            props: this.extractVueProps(content),
            data: this.extractVueData(content),
            methods: this.extractVueMethods(content),
            computed: this.extractVueComputed(content)
        };
    }
    
    /**
     * Parse TypeScript content
     */
    async parseTypeScript(content, options = {}) {
        return {
            type: 'typescript',
            interfaces: this.extractTypeScriptInterfaces(content),
            types: this.extractTypeScriptTypes(content),
            classes: this.extractClasses(content),
            functions: this.extractFunctions(content),
            imports: this.extractImports(content),
            exports: this.extractExports(content),
            generics: this.extractGenerics(content)
        };
    }
    
    /**
     * Parse JavaScript content
     */
    async parseJavaScript(content, options = {}) {
        return {
            type: 'javascript',
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            imports: this.extractImports(content),
            exports: this.extractExports(content),
            variables: this.extractVariables(content),
            comments: this.extractComments(content)
        };
    }
    
    /**
     * Parse CSS content
     */
    async parseCss(content, options = {}) {
        return {
            type: 'css',
            selectors: this.extractCssSelectors(content),
            rules: this.extractCssRules(content),
            media: this.extractMediaQueries(content),
            keyframes: this.extractKeyframes(content),
            variables: this.extractCssVariables(content),
            imports: this.extractCssImports(content)
        };
    }
    
    /**
     * Parse JSON content
     */
    async parseJson(content, options = {}) {
        try {
            const parsed = JSON.parse(content);
            return {
                type: 'json',
                data: parsed,
                schema: this.analyzeJsonSchema(parsed),
                depth: this.calculateJsonDepth(parsed),
                keys: this.extractJsonKeys(parsed)
            };
        } catch (error) {
            return {
                type: 'json',
                error: error.message,
                validationErrors: this.validateJsonSyntax(content)
            };
        }
    }
    
    /**
     * Parse YAML content
     */
    async parseYaml(content, options = {}) {
        try {
            const yaml = require('js-yaml');
            const parsed = yaml.load(content);
            
            return {
                type: 'yaml',
                data: parsed,
                structure: this.analyzeYamlStructure(parsed),
                keys: this.extractYamlKeys(content)
            };
        } catch (error) {
            return {
                type: 'yaml',
                error: error.message,
                validationErrors: this.validateYamlSyntax(content)
            };
        }
    }
    
    /**
     * Parse XML content
     */
    async parseXml(content, options = {}) {
        return {
            type: 'xml',
            elements: this.extractXmlElements(content),
            attributes: this.extractXmlAttributes(content),
            namespaces: this.extractXmlNamespaces(content),
            structure: this.analyzeXmlStructure(content)
        };
    }
    
    /**
     * Parse plain text content
     */
    async parseText(content, options = {}) {
        return {
            type: 'text',
            paragraphs: content.split('\n\n').filter(p => p.trim()),
            sentences: this.extractSentences(content),
            keywords: this.extractKeywords(content),
            statistics: {
                lines: content.split('\n').length,
                words: this.countWords(content),
                characters: content.length,
                paragraphs: content.split('\n\n').length
            }
        };
    }
    
    // Utility methods for extraction
    
    extractMarkdownHeadings(tokens) {
        return tokens.filter(token => token.type === 'heading')
                   .map(token => ({
                       level: token.depth,
                       text: token.text
                   }));
    }
    
    extractMarkdownLinks(tokens) {
        const links = [];
        const walkTokens = (tokens) => {
            tokens.forEach(token => {
                if (token.type === 'link') {
                    links.push({
                        text: token.text,
                        href: token.href,
                        title: token.title
                    });
                }
                if (token.tokens) {
                    walkTokens(token.tokens);
                }
            });
        };
        walkTokens(tokens);
        return links;
    }
    
    extractCodeBlocks(tokens) {
        return tokens.filter(token => token.type === 'code')
                   .map(token => ({
                       language: token.lang,
                       code: token.text
                   }));
    }
    
    extractMarkdownMetadata(content) {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontMatterMatch) {
            try {
                const yaml = require('js-yaml');
                return yaml.load(frontMatterMatch[1]);
            } catch (error) {
                return { frontMatterError: error.message };
            }
        }
        return {};
    }
    
    extractHtmlHeadings(root) {
        const headings = [];
        for (let i = 1; i <= 6; i++) {
            root.querySelectorAll(`h${i}`).forEach(heading => {
                headings.push({
                    level: i,
                    text: heading.text,
                    id: heading.getAttribute('id')
                });
            });
        }
        return headings;
    }
    
    extractHtmlLinks(root) {
        return root.querySelectorAll('a').map(link => ({
            text: link.text,
            href: link.getAttribute('href'),
            title: link.getAttribute('title')
        }));
    }
    
    extractHtmlScripts(root) {
        return root.querySelectorAll('script').map(script => ({
            src: script.getAttribute('src'),
            type: script.getAttribute('type'),
            content: script.innerHTML
        }));
    }
    
    extractHtmlStyles(root) {
        return root.querySelectorAll('style, link[rel="stylesheet"]').map(style => ({
            href: style.getAttribute('href'),
            content: style.innerHTML
        }));
    }
    
    extractHtmlForms(root) {
        return root.querySelectorAll('form').map(form => ({
            action: form.getAttribute('action'),
            method: form.getAttribute('method'),
            fields: form.querySelectorAll('input, select, textarea').map(field => ({
                name: field.getAttribute('name'),
                type: field.getAttribute('type'),
                required: field.hasAttribute('required')
            }))
        }));
    }
    
    extractHtmlImages(root) {
        return root.querySelectorAll('img').map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title')
        }));
    }
    
    analyzeHtmlStructure(root) {
        return {
            hasDoctype: root.toString().includes('<!DOCTYPE'),
            hasHtml: !!root.querySelector('html'),
            hasHead: !!root.querySelector('head'),
            hasBody: !!root.querySelector('body'),
            metaTags: root.querySelectorAll('meta').length,
            semanticElements: root.querySelectorAll('main, section, article, aside, header, footer, nav').length
        };
    }
    
    extractImports(content) {
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
        const imports = [];
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push({
                statement: match[0],
                source: match[1]
            });
        }
        
        return imports;
    }
    
    extractExports(content) {
        const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
        const exports = [];
        let match;
        
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push({
                name: match[1],
                statement: match[0]
            });
        }
        
        return exports;
    }
    
    extractFunctions(content) {
        const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*\{|function))/g;
        const functions = [];
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push({
                name: match[1] || match[2],
                statement: match[0]
            });
        }
        
        return functions;
    }
    
    extractJsxElements(content) {
        const jsxRegex = /<(\w+)(?:\s+[^>]*)?(?:\/>|>[\s\S]*?<\/\1>)/g;
        const elements = [];
        let match;
        
        while ((match = jsxRegex.exec(content)) !== null) {
            elements.push({
                tag: match[1],
                fullMatch: match[0]
            });
        }
        
        return elements;
    }
    
    extractReactHooks(content) {
        const hookRegex = /use\w+\(/g;
        const hooks = [];
        let match;
        
        while ((match = hookRegex.exec(content)) !== null) {
            hooks.push(match[0].slice(0, -1)); // Remove the opening parenthesis
        }
        
        return [...new Set(hooks)]; // Remove duplicates
    }
    
    extractReactProps(content) {
        const propsRegex = /\bprops\.(\w+)/g;
        const props = [];
        let match;
        
        while ((match = propsRegex.exec(content)) !== null) {
            props.push(match[1]);
        }
        
        return [...new Set(props)];
    }
    
    extractReactState(content) {
        const stateRegex = /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g;
        const states = [];
        let match;
        
        while ((match = stateRegex.exec(content)) !== null) {
            states.push(match[1]);
        }
        
        return states;
    }
    
    extractVueProps(content) {
        const propsMatch = content.match(/props:\s*\[([^\]]+)\]|props:\s*\{([^}]+)\}/);
        if (propsMatch) {
            const propsStr = propsMatch[1] || propsMatch[2];
            return propsStr.split(',').map(prop => prop.trim().replace(/['"]/g, ''));
        }
        return [];
    }
    
    extractVueData(content) {
        const dataMatch = content.match(/data\s*\(\)\s*\{[^}]*return\s*\{([^}]+)\}/);
        if (dataMatch) {
            return dataMatch[1].split(',').map(item => item.split(':')[0].trim());
        }
        return [];
    }
    
    extractVueMethods(content) {
        const methodsMatch = content.match(/methods:\s*\{([^}]+)\}/);
        if (methodsMatch) {
            const methodRegex = /(\w+)\s*\(/g;
            const methods = [];
            let match;
            
            while ((match = methodRegex.exec(methodsMatch[1])) !== null) {
                methods.push(match[1]);
            }
            
            return methods;
        }
        return [];
    }
    
    extractVueComputed(content) {
        const computedMatch = content.match(/computed:\s*\{([^}]+)\}/);
        if (computedMatch) {
            const computedRegex = /(\w+)\s*\(/g;
            const computed = [];
            let match;
            
            while ((match = computedRegex.exec(computedMatch[1])) !== null) {
                computed.push(match[1]);
            }
            
            return computed;
        }
        return [];
    }
    
    extractTypeScriptInterfaces(content) {
        const interfaceRegex = /interface\s+(\w+)\s*\{/g;
        const interfaces = [];
        let match;
        
        while ((match = interfaceRegex.exec(content)) !== null) {
            interfaces.push(match[1]);
        }
        
        return interfaces;
    }
    
    extractTypeScriptTypes(content) {
        const typeRegex = /type\s+(\w+)\s*=/g;
        const types = [];
        let match;
        
        while ((match = typeRegex.exec(content)) !== null) {
            types.push(match[1]);
        }
        
        return types;
    }
    
    extractClasses(content) {
        const classRegex = /class\s+(\w+)/g;
        const classes = [];
        let match;
        
        while ((match = classRegex.exec(content)) !== null) {
            classes.push(match[1]);
        }
        
        return classes;
    }
    
    extractGenerics(content) {
        const genericRegex = /<([A-Z]\w*(?:\s*,\s*[A-Z]\w*)*)>/g;
        const generics = [];
        let match;
        
        while ((match = genericRegex.exec(content)) !== null) {
            generics.push(match[1]);
        }
        
        return [...new Set(generics)];
    }
    
    extractVariables(content) {
        const varRegex = /(?:const|let|var)\s+(\w+)/g;
        const variables = [];
        let match;
        
        while ((match = varRegex.exec(content)) !== null) {
            variables.push(match[1]);
        }
        
        return variables;
    }
    
    extractComments(content) {
        const singleLineRegex = /\/\/.*$/gm;
        const multiLineRegex = /\/\*[\s\S]*?\*\//g;
        
        const singleLine = [...content.matchAll(singleLineRegex)].map(match => match[0]);
        const multiLine = [...content.matchAll(multiLineRegex)].map(match => match[0]);
        
        return {
            singleLine,
            multiLine,
            total: singleLine.length + multiLine.length
        };
    }
    
    extractCssSelectors(content) {
        const selectorRegex = /([^{}]+)\s*\{/g;
        const selectors = [];
        let match;
        
        while ((match = selectorRegex.exec(content)) !== null) {
            selectors.push(match[1].trim());
        }
        
        return selectors;
    }
    
    extractCssRules(content) {
        const ruleRegex = /([^{}]+)\s*\{([^}]+)\}/g;
        const rules = [];
        let match;
        
        while ((match = ruleRegex.exec(content)) !== null) {
            rules.push({
                selector: match[1].trim(),
                properties: match[2].trim().split(';').filter(prop => prop.trim())
            });
        }
        
        return rules;
    }
    
    extractMediaQueries(content) {
        const mediaRegex = /@media\s+([^{]+)\s*\{/g;
        const media = [];
        let match;
        
        while ((match = mediaRegex.exec(content)) !== null) {
            media.push(match[1].trim());
        }
        
        return media;
    }
    
    extractKeyframes(content) {
        const keyframesRegex = /@keyframes\s+(\w+)/g;
        const keyframes = [];
        let match;
        
        while ((match = keyframesRegex.exec(content)) !== null) {
            keyframes.push(match[1]);
        }
        
        return keyframes;
    }
    
    extractCssVariables(content) {
        const varRegex = /--[\w-]+/g;
        const variables = [];
        let match;
        
        while ((match = varRegex.exec(content)) !== null) {
            variables.push(match[0]);
        }
        
        return [...new Set(variables)];
    }
    
    extractCssImports(content) {
        const importRegex = /@import\s+['"`]([^'"`]+)['"`]/g;
        const imports = [];
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }
    
    analyzeJsonSchema(data, depth = 0) {
        if (depth > 10) return 'max_depth_reached';
        
        if (Array.isArray(data)) {
            return {
                type: 'array',
                length: data.length,
                itemTypes: [...new Set(data.map(item => typeof item))]
            };
        }
        
        if (typeof data === 'object' && data !== null) {
            const schema = { type: 'object', properties: {} };
            
            for (const [key, value] of Object.entries(data)) {
                schema.properties[key] = this.analyzeJsonSchema(value, depth + 1);
            }
            
            return schema;
        }
        
        return { type: typeof data };
    }
    
    calculateJsonDepth(data, currentDepth = 0) {
        if (typeof data !== 'object' || data === null) {
            return currentDepth;
        }
        
        let maxDepth = currentDepth;
        
        for (const value of Object.values(data)) {
            const depth = this.calculateJsonDepth(value, currentDepth + 1);
            maxDepth = Math.max(maxDepth, depth);
        }
        
        return maxDepth;
    }
    
    extractJsonKeys(data, prefix = '') {
        const keys = [];
        
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            for (const [key, value] of Object.entries(data)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                keys.push(fullKey);
                
                if (typeof value === 'object' && value !== null) {
                    keys.push(...this.extractJsonKeys(value, fullKey));
                }
            }
        }
        
        return keys;
    }
    
    validateJsonSyntax(content) {
        const errors = [];
        
        // Check for common JSON errors
        if (content.includes("'")) {
            errors.push('Single quotes not allowed in JSON');
        }
        
        if (/,(\s*[}\]])/.test(content)) {
            errors.push('Trailing commas not allowed');
        }
        
        return errors;
    }
    
    analyzeYamlStructure(data) {
        return {
            type: typeof data,
            hasArrays: this.hasArrays(data),
            hasObjects: this.hasObjects(data),
            maxDepth: this.calculateJsonDepth(data)
        };
    }
    
    extractYamlKeys(content) {
        const lines = content.split('\n');
        const keys = [];
        
        for (const line of lines) {
            const match = line.match(/^(\s*)([^:\s]+):/);
            if (match) {
                keys.push(match[2]);
            }
        }
        
        return keys;
    }
    
    validateYamlSyntax(content) {
        const errors = [];
        
        // Basic YAML syntax checks
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('\t')) {
                errors.push(`Line ${i + 1}: Tabs not allowed in YAML`);
            }
        }
        
        return errors;
    }
    
    extractXmlElements(content) {
        const elementRegex = /<(\w+)(?:\s+[^>]*)?(?:\/>|>[\s\S]*?<\/\1>)/g;
        const elements = [];
        let match;
        
        while ((match = elementRegex.exec(content)) !== null) {
            elements.push(match[1]);
        }
        
        return [...new Set(elements)];
    }
    
    extractXmlAttributes(content) {
        const attrRegex = /(\w+)=['"`]([^'"`]*)['"`]/g;
        const attributes = [];
        let match;
        
        while ((match = attrRegex.exec(content)) !== null) {
            attributes.push({
                name: match[1],
                value: match[2]
            });
        }
        
        return attributes;
    }
    
    extractXmlNamespaces(content) {
        const nsRegex = /xmlns:?(\w*?)=['"`]([^'"`]*)['"`]/g;
        const namespaces = [];
        let match;
        
        while ((match = nsRegex.exec(content)) !== null) {
            namespaces.push({
                prefix: match[1] || 'default',
                uri: match[2]
            });
        }
        
        return namespaces;
    }
    
    analyzeXmlStructure(content) {
        return {
            hasXmlDeclaration: content.trim().startsWith('<?xml'),
            rootElements: (content.match(/<\w+[^>]*>/g) || []).length,
            totalElements: (content.match(/<\w+/g) || []).length,
            hasNamespaces: content.includes('xmlns')
        };
    }
    
    extractSentences(content) {
        return content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    }
    
    extractKeywords(content) {
        const words = content.toLowerCase()
                           .replace(/[^\w\s]/g, ' ')
                           .split(/\s+/)
                           .filter(word => word.length > 3);
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 20)
                    .map(([word, count]) => ({ word, count }));
    }
    
    basicCodeAnalysis(content) {
        return {
            lines: content.split('\n').length,
            functions: (content.match(/function\s+\w+/g) || []).length,
            classes: (content.match(/class\s+\w+/g) || []).length,
            imports: (content.match(/import\s+/g) || []).length,
            exports: (content.match(/export\s+/g) || []).length
        };
    }
    
    // Utility methods
    
    async isFilePath(input) {
        try {
            await fs.access(input);
            return true;
        } catch {
            return false;
        }
    }
    
    countWords(content) {
        return content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    hasArrays(data) {
        if (Array.isArray(data)) return true;
        if (typeof data === 'object' && data !== null) {
            return Object.values(data).some(value => this.hasArrays(value));
        }
        return false;
    }
    
    hasObjects(data) {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            return true;
        }
        if (Array.isArray(data)) {
            return data.some(item => this.hasObjects(item));
        }
        if (typeof data === 'object' && data !== null) {
            return Object.values(data).some(value => this.hasObjects(value));
        }
        return false;
    }
    
    updateStats(format, parsingTime) {
        this.parsingStats.filesProcessed++;
        this.parsingStats.processingTime += parsingTime;
        
        const count = this.parsingStats.formatsDetected.get(format) || 0;
        this.parsingStats.formatsDetected.set(format, count + 1);
    }
    
    getStats() {
        return {
            ...this.parsingStats,
            formatsDetected: Object.fromEntries(this.parsingStats.formatsDetected),
            averageProcessingTime: this.parsingStats.filesProcessed > 0 
                ? this.parsingStats.processingTime / this.parsingStats.filesProcessed 
                : 0
        };
    }
    
    reset() {
        this.parsingStats = {
            filesProcessed: 0,
            formatsDetected: new Map(),
            processingTime: 0,
            errors: []
        };
    }
}

module.exports = UnifiedMultiFormatParser;

// CLI usage
if (require.main === module) {
    const parser = new UnifiedMultiFormatParser();
    
    // Demo parsing different formats
    const demoContent = {
        markdown: '# Hello World\n\nThis is **markdown** content with [links](https://example.com).',
        react: `import React from 'react';
export default function Component({ title }) {
    const [count, setCount] = useState(0);
    return <div>{title}: {count}</div>;
}`,
        vue: `<template>
    <div>{{ message }}</div>
</template>
<script>
export default {
    data() {
        return { message: 'Hello Vue!' }
    }
}
</script>`,
        json: '{"name": "test", "version": "1.0.0", "dependencies": {"react": "^18.0.0"}}',
        css: `.button { background: blue; color: white; } @media (max-width: 768px) { .button { width: 100%; } }`
    };
    
    console.log('🔄 Unified Multi-Format Parser Demo\n');
    
    Object.entries(demoContent).forEach(async ([format, content]) => {
        console.log(`\n📄 Parsing ${format.toUpperCase()}:`);
        const result = await parser.parse(content, { filename: `demo.${format}` });
        
        if (result.success) {
            console.log(`✅ Successfully parsed ${format}`);
            console.log(`📊 Lines: ${result.metadata.linesCount}, Words: ${result.metadata.wordsCount}`);
            console.log(`⏱️ Processing time: ${result.metadata.parsingTime}ms`);
            
            // Show format-specific insights
            if (result.content.headings) {
                console.log(`📋 Headings found: ${result.content.headings.length}`);
            }
            if (result.content.functions) {
                console.log(`🔧 Functions found: ${result.content.functions.length}`);
            }
            if (result.content.selectors) {
                console.log(`🎨 CSS selectors: ${result.content.selectors.length}`);
            }
        } else {
            console.log(`❌ Failed to parse ${format}: ${result.error}`);
        }
    });
    
    // Show final stats
    setTimeout(() => {
        console.log('\n📊 Final Stats:', parser.getStats());
    }, 1000);
}