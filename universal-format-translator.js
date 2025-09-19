#!/usr/bin/env node

/**
 * Universal Format Translator
 * Bidirectional translation between XML, JSON, YAML, HTML, Python, JS, TS, and more
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const { parseScript } = require('esprima');
const { generate } = require('escodegen');
const ts = require('typescript');

class UniversalFormatTranslator {
    constructor() {
        this.translators = new Map();
        this.semanticCache = new Map();
        this.initializeTranslators();
    }

    initializeTranslators() {
        // Register all translation handlers
        this.registerTranslator('json', 'xml', this.jsonToXml.bind(this));
        this.registerTranslator('xml', 'json', this.xmlToJson.bind(this));
        this.registerTranslator('json', 'yaml', this.jsonToYaml.bind(this));
        this.registerTranslator('yaml', 'json', this.yamlToJson.bind(this));
        this.registerTranslator('json', 'python', this.jsonToPython.bind(this));
        this.registerTranslator('python', 'json', this.pythonToJson.bind(this));
        this.registerTranslator('javascript', 'typescript', this.jsToTs.bind(this));
        this.registerTranslator('typescript', 'javascript', this.tsToJs.bind(this));
        this.registerTranslator('json', 'html', this.jsonToHtml.bind(this));
        this.registerTranslator('html', 'json', this.htmlToJson.bind(this));
        
        console.log('✅ Universal Format Translator initialized with', this.translators.size, 'translation paths');
    }

    registerTranslator(from, to, handler) {
        const key = `${from}->${to}`;
        this.translators.set(key, handler);
    }

    async translate(content, fromFormat, toFormat) {
        console.log(`🔄 Translating from ${fromFormat} to ${toFormat}`);
        
        // Direct translation if available
        const directKey = `${fromFormat}->${toFormat}`;
        if (this.translators.has(directKey)) {
            return await this.translators.get(directKey)(content);
        }
        
        // Try to find a path through JSON (universal intermediate format)
        const toJsonKey = `${fromFormat}->json`;
        const fromJsonKey = `json->${toFormat}`;
        
        if (this.translators.has(toJsonKey) && this.translators.has(fromJsonKey)) {
            console.log('  📍 Using JSON as intermediate format');
            const jsonIntermediate = await this.translators.get(toJsonKey)(content);
            return await this.translators.get(fromJsonKey)(jsonIntermediate);
        }
        
        throw new Error(`No translation path found from ${fromFormat} to ${toFormat}`);
    }

    // JSON <-> XML
    async jsonToXml(jsonContent) {
        const obj = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        const builder = new xml2js.Builder({
            rootName: 'root',
            renderOpts: { pretty: true, indent: '  ' }
        });
        return builder.buildObject(obj);
    }

    async xmlToJson(xmlContent) {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlContent);
        return JSON.stringify(result, null, 2);
    }

    // JSON <-> YAML
    async jsonToYaml(jsonContent) {
        const obj = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        return yaml.dump(obj, { indent: 2 });
    }

    async yamlToJson(yamlContent) {
        const obj = yaml.load(yamlContent);
        return JSON.stringify(obj, null, 2);
    }

    // JSON <-> Python
    async jsonToPython(jsonContent) {
        const obj = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        return this.objectToPython(obj);
    }

    objectToPython(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        
        if (obj === null) return 'None';
        if (typeof obj === 'boolean') return obj ? 'True' : 'False';
        if (typeof obj === 'number') return obj.toString();
        if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            const items = obj.map(item => this.objectToPython(item, indent + 4));
            return `[\n${spaces}    ${items.join(`,\n${spaces}    `)}\n${spaces}]`;
        }
        
        if (typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0) return '{}';
            const items = entries.map(([key, value]) => 
                `'${key}': ${this.objectToPython(value, indent + 4)}`
            );
            return `{\n${spaces}    ${items.join(`,\n${spaces}    `)}\n${spaces}}`;
        }
        
        return str(obj);
    }

    async pythonToJson(pythonContent) {
        // Basic Python data structure to JSON
        // This is simplified - real implementation would need proper Python parsing
        let content = pythonContent
            .replace(/None/g, 'null')
            .replace(/True/g, 'true')
            .replace(/False/g, 'false')
            .replace(/'/g, '"');
        
        // Try to extract data structure
        const dataMatch = content.match(/(?:data|config|result)\s*=\s*({[\s\S]*}|\[[\s\S]*\])/);
        if (dataMatch) {
            content = dataMatch[1];
        }
        
        try {
            const parsed = JSON.parse(content);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            throw new Error('Could not parse Python data structure: ' + e.message);
        }
    }

    // JavaScript <-> TypeScript
    async jsToTs(jsContent) {
        // Add type annotations based on usage
        const ast = parseScript(jsContent, { range: true, comment: true });
        
        // Simple type inference
        let tsContent = jsContent;
        
        // Add basic type annotations
        tsContent = tsContent.replace(/function\s+(\w+)\s*\((.*?)\)/g, (match, name, params) => {
            // Infer return type as any for now
            return `function ${name}(${params}): any`;
        });
        
        // Convert var to let/const
        tsContent = tsContent.replace(/\bvar\s+/g, 'let ');
        
        // Add interface for objects
        const objectMatches = tsContent.match(/const\s+(\w+)\s*=\s*{[^}]+}/g);
        if (objectMatches) {
            objectMatches.forEach(match => {
                const varName = match.match(/const\s+(\w+)/)[1];
                const interfaceName = varName.charAt(0).toUpperCase() + varName.slice(1) + 'Type';
                tsContent = `interface ${interfaceName} ${match.substring(match.indexOf('{'))}\n\n` + tsContent;
            });
        }
        
        return tsContent;
    }

    async tsToJs(tsContent) {
        // Compile TypeScript to JavaScript
        const result = ts.transpileModule(tsContent, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2017,
                removeComments: false
            }
        });
        
        return result.outputText;
    }

    // JSON <-> HTML
    async jsonToHtml(jsonContent) {
        const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Data View</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .json-key { color: #0066cc; font-weight: bold; }
        .json-value { color: #008800; }
        .json-object { margin-left: 20px; }
        .collapsible { cursor: pointer; user-select: none; }
        .collapsible:before { content: '▼ '; }
        .collapsed:before { content: '▶ '; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <h1>Data Visualization</h1>
    <div id="json-viewer">${this.jsonToHtmlElement(data)}</div>
    <script>
        document.querySelectorAll('.collapsible').forEach(elem => {
            elem.addEventListener('click', function() {
                this.classList.toggle('collapsed');
                this.nextElementSibling.classList.toggle('hidden');
            });
        });
    </script>
</body>
</html>`;
        
        return html;
    }

    jsonToHtmlElement(obj, key = '') {
        if (obj === null) return '<span class="json-value">null</span>';
        if (typeof obj !== 'object') return `<span class="json-value">${obj}</span>`;
        
        let html = '';
        if (key) html += `<span class="json-key">${key}:</span> `;
        
        if (Array.isArray(obj)) {
            html += '<span class="collapsible">Array</span>';
            html += '<div class="json-object">';
            obj.forEach((item, index) => {
                html += `<div>${this.jsonToHtmlElement(item, `[${index}]`)}</div>`;
            });
            html += '</div>';
        } else {
            html += '<span class="collapsible">Object</span>';
            html += '<div class="json-object">';
            for (const [k, v] of Object.entries(obj)) {
                html += `<div>${this.jsonToHtmlElement(v, k)}</div>`;
            }
            html += '</div>';
        }
        
        return html;
    }

    async htmlToJson(htmlContent) {
        // Extract JSON from HTML data attributes or script tags
        const scriptMatch = htmlContent.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            return scriptMatch[1].trim();
        }
        
        // Extract from data attributes
        const dataMatch = htmlContent.match(/data-json='([^']+)'/);
        if (dataMatch) {
            return JSON.stringify(JSON.parse(dataMatch[1]), null, 2);
        }
        
        // Try to extract structured data from HTML
        const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
        const h1Match = htmlContent.match(/<h1>([^<]+)<\/h1>/);
        const pMatches = [...htmlContent.matchAll(/<p>([^<]+)<\/p>/g)];
        
        const extracted = {
            title: titleMatch ? titleMatch[1] : null,
            heading: h1Match ? h1Match[1] : null,
            paragraphs: pMatches.map(m => m[1])
        };
        
        return JSON.stringify(extracted, null, 2);
    }

    // Auto-detect format
    async detectFormat(content) {
        const trimmed = content.trim();
        
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
        if (trimmed.startsWith('<')) return trimmed.includes('<!DOCTYPE') ? 'html' : 'xml';
        if (trimmed.match(/^---\s*$/m)) return 'yaml';
        if (trimmed.includes('function') || trimmed.includes('const') || trimmed.includes('let')) {
            return trimmed.includes(': ') && trimmed.includes('interface') ? 'typescript' : 'javascript';
        }
        if (trimmed.includes('def ') || trimmed.includes('import ')) return 'python';
        
        return 'unknown';
    }

    // Semantic understanding helper
    async extractSemanticMeaning(content, format) {
        const key = `${format}:${content.substring(0, 100)}`;
        
        if (this.semanticCache.has(key)) {
            return this.semanticCache.get(key);
        }
        
        let semantic = {
            format,
            dataType: 'unknown',
            structure: 'unknown',
            purpose: 'unknown'
        };
        
        try {
            // Convert to JSON for analysis
            let jsonData;
            if (format === 'json') {
                jsonData = JSON.parse(content);
            } else {
                jsonData = JSON.parse(await this.translate(content, format, 'json'));
            }
            
            // Analyze structure
            if (Array.isArray(jsonData)) {
                semantic.dataType = 'array';
                semantic.structure = `Array of ${jsonData.length} items`;
            } else if (typeof jsonData === 'object') {
                semantic.dataType = 'object';
                semantic.structure = `Object with keys: ${Object.keys(jsonData).join(', ')}`;
            }
            
            // Guess purpose based on keys
            const keys = Object.keys(jsonData).join(' ').toLowerCase();
            if (keys.includes('config')) semantic.purpose = 'configuration';
            else if (keys.includes('user') || keys.includes('profile')) semantic.purpose = 'user-data';
            else if (keys.includes('api') || keys.includes('endpoint')) semantic.purpose = 'api-definition';
            else if (keys.includes('test') || keys.includes('spec')) semantic.purpose = 'testing';
            
        } catch (e) {
            // Could not analyze
        }
        
        this.semanticCache.set(key, semantic);
        return semantic;
    }
}

// Export for use in other modules
module.exports = UniversalFormatTranslator;

// Run if called directly
if (require.main === module) {
    const translator = new UniversalFormatTranslator();
    
    // Example usage
    const examples = async () => {
        console.log('\n🧪 Testing Universal Format Translator\n');
        
        // Test JSON to XML
        const jsonData = {
            user: {
                name: 'Test User',
                roles: ['admin', 'developer'],
                settings: {
                    theme: 'dark',
                    notifications: true
                }
            }
        };
        
        console.log('📝 Original JSON:');
        console.log(JSON.stringify(jsonData, null, 2));
        
        console.log('\n📄 Converted to XML:');
        const xml = await translator.translate(JSON.stringify(jsonData), 'json', 'xml');
        console.log(xml);
        
        console.log('\n📊 Converted to YAML:');
        const yaml = await translator.translate(JSON.stringify(jsonData), 'json', 'yaml');
        console.log(yaml);
        
        console.log('\n🐍 Converted to Python:');
        const python = await translator.translate(JSON.stringify(jsonData), 'json', 'python');
        console.log(python);
        
        console.log('\n🌐 Converted to HTML:');
        const html = await translator.translate(JSON.stringify(jsonData), 'json', 'html');
        console.log(html.substring(0, 500) + '...');
    };
    
    examples().catch(console.error);
}