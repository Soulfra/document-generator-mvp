#!/usr/bin/env node

/**
 * Unified Data Processor
 * Handles JSONL, YAML, JSON, CSV, XML, Markdown and other data formats
 * Converts everything into a unified structure for Executive OS processing
 */

import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import EventEmitter from 'events';
import yaml from 'js-yaml';
import csv from 'csv-parser';
import xml2js from 'xml2js';
import { createHash } from 'crypto';

export class UnifiedDataProcessor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
            chunkSize: config.chunkSize || 1024 * 1024, // 1MB chunks
            supportedFormats: config.supportedFormats || [
                'json', 'jsonl', 'yaml', 'yml', 'csv', 'xml', 'md', 'txt', 'log'
            ],
            outputFormat: config.outputFormat || 'unified_json',
            validateData: config.validateData !== false,
            preserveOriginal: config.preserveOriginal !== false,
            enableStreaming: config.enableStreaming !== false,
            ...config
        };

        this.processors = new Map();
        this.formatDetectors = new Map();
        this.dataCache = new Map();
        this.processingQueue = [];
        this.activeJobs = new Map();
        
        this.initializeProcessors();
        this.initializeFormatDetectors();
        this.startProcessingQueue();
    }

    initializeProcessors() {
        // JSON Processor
        this.processors.set('json', {
            parse: async (data, options = {}) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    return this.unifyStructure(parsed, 'json', options);
                } catch (error) {
                    throw new Error(`JSON parse error: ${error.message}`);
                }
            },
            
            stream: (options = {}) => {
                return new Transform({
                    objectMode: true,
                    transform(chunk, encoding, callback) {
                        try {
                            const parsed = JSON.parse(chunk.toString());
                            const unified = this.unifyStructure(parsed, 'json', options);
                            callback(null, unified);
                        } catch (error) {
                            callback(error);
                        }
                    }
                });
            },
            
            validate: (data) => {
                try {
                    JSON.parse(data.toString());
                    return { valid: true };
                } catch (error) {
                    return { valid: false, error: error.message };
                }
            }
        });

        // JSONL (JSON Lines) Processor
        this.processors.set('jsonl', {
            parse: async (data, options = {}) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                const results = [];
                
                for (const [index, line] of lines.entries()) {
                    try {
                        const parsed = JSON.parse(line);
                        const unified = this.unifyStructure(parsed, 'jsonl', { ...options, lineNumber: index + 1 });
                        results.push(unified);
                    } catch (error) {
                        if (options.strictMode) {
                            throw new Error(`JSONL parse error at line ${index + 1}: ${error.message}`);
                        } else {
                            console.warn(`Skipping invalid JSONL line ${index + 1}: ${error.message}`);
                        }
                    }
                }
                
                return {
                    type: 'jsonl_collection',
                    count: results.length,
                    items: results,
                    metadata: {
                        totalLines: lines.length,
                        validLines: results.length,
                        format: 'jsonl'
                    }
                };
            },
            
            stream: (options = {}) => {
                let lineNumber = 0;
                return new Transform({
                    objectMode: true,
                    transform(chunk, encoding, callback) {
                        const lines = chunk.toString().split('\n');
                        const results = [];
                        
                        for (const line of lines) {
                            if (line.trim()) {
                                lineNumber++;
                                try {
                                    const parsed = JSON.parse(line);
                                    const unified = this.unifyStructure(parsed, 'jsonl', { 
                                        ...options, 
                                        lineNumber 
                                    });
                                    results.push(unified);
                                } catch (error) {
                                    if (!options.skipErrors) {
                                        callback(new Error(`JSONL error at line ${lineNumber}: ${error.message}`));
                                        return;
                                    }
                                }
                            }
                        }
                        
                        callback(null, results);
                    }
                });
            },
            
            validate: (data) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                const errors = [];
                
                lines.forEach((line, index) => {
                    try {
                        JSON.parse(line);
                    } catch (error) {
                        errors.push(`Line ${index + 1}: ${error.message}`);
                    }
                });
                
                return {
                    valid: errors.length === 0,
                    errors: errors,
                    totalLines: lines.length,
                    validLines: lines.length - errors.length
                };
            }
        });

        // YAML Processor
        this.processors.set('yaml', {
            parse: async (data, options = {}) => {
                try {
                    const parsed = yaml.load(data.toString(), {
                        schema: yaml.DEFAULT_SCHEMA,
                        onWarning: (warning) => console.warn('YAML warning:', warning)
                    });
                    return this.unifyStructure(parsed, 'yaml', options);
                } catch (error) {
                    throw new Error(`YAML parse error: ${error.message}`);
                }
            },
            
            validate: (data) => {
                try {
                    yaml.load(data.toString());
                    return { valid: true };
                } catch (error) {
                    return { valid: false, error: error.message };
                }
            }
        });

        // CSV Processor
        this.processors.set('csv', {
            parse: async (data, options = {}) => {
                return new Promise((resolve, reject) => {
                    const results = [];
                    const csvOptions = {
                        headers: options.headers !== false,
                        separator: options.separator || ',',
                        skipEmptyLines: true,
                        ...options.csvOptions
                    };
                    
                    const stream = require('stream');
                    const readable = new stream.Readable();
                    readable.push(data.toString());
                    readable.push(null);
                    
                    readable
                        .pipe(csv(csvOptions))
                        .on('data', (row) => {
                            const unified = this.unifyStructure(row, 'csv', {
                                ...options,
                                rowNumber: results.length + 1
                            });
                            results.push(unified);
                        })
                        .on('end', () => {
                            resolve({
                                type: 'csv_collection',
                                count: results.length,
                                items: results,
                                metadata: {
                                    format: 'csv',
                                    headers: csvOptions.headers
                                }
                            });
                        })
                        .on('error', reject);
                });
            },
            
            validate: (data) => {
                // Basic CSV validation - check for consistent column counts
                const lines = data.toString().split('\n').filter(line => line.trim());
                if (lines.length === 0) return { valid: false, error: 'Empty CSV' };
                
                const firstLineColumns = lines[0].split(',').length;
                const inconsistentLines = [];
                
                lines.forEach((line, index) => {
                    const columns = line.split(',').length;
                    if (columns !== firstLineColumns) {
                        inconsistentLines.push(index + 1);
                    }
                });
                
                return {
                    valid: inconsistentLines.length === 0,
                    warnings: inconsistentLines.length > 0 ? 
                        [`Inconsistent column counts at lines: ${inconsistentLines.join(', ')}`] : [],
                    totalLines: lines.length,
                    expectedColumns: firstLineColumns
                };
            }
        });

        // XML Processor
        this.processors.set('xml', {
            parse: async (data, options = {}) => {
                try {
                    const parser = new xml2js.Parser({
                        explicitArray: false,
                        ignoreAttrs: options.ignoreAttributes || false,
                        mergeAttrs: options.mergeAttributes || false,
                        explicitRoot: options.explicitRoot !== false
                    });
                    
                    const parsed = await parser.parseStringPromise(data.toString());
                    return this.unifyStructure(parsed, 'xml', options);
                } catch (error) {
                    throw new Error(`XML parse error: ${error.message}`);
                }
            },
            
            validate: (data) => {
                try {
                    const parser = new xml2js.Parser();
                    parser.parseStringPromise(data.toString());
                    return { valid: true };
                } catch (error) {
                    return { valid: false, error: error.message };
                }
            }
        });

        // Markdown Processor
        this.processors.set('md', {
            parse: async (data, options = {}) => {
                const content = data.toString();
                const structure = this.parseMarkdownStructure(content);
                return this.unifyStructure(structure, 'markdown', options);
            },
            
            validate: (data) => {
                // Markdown is generally always valid, but we can check for common issues
                const content = data.toString();
                const warnings = [];
                
                // Check for malformed headers
                const malformedHeaders = content.match(/^#{7,}/gm);
                if (malformedHeaders) {
                    warnings.push('Headers with more than 6 # characters found');
                }
                
                // Check for unclosed code blocks
                const codeBlocks = content.match(/```/g);
                if (codeBlocks && codeBlocks.length % 2 !== 0) {
                    warnings.push('Unclosed code blocks detected');
                }
                
                return {
                    valid: true,
                    warnings: warnings
                };
            }
        });

        // Plain Text/Log Processor
        this.processors.set('txt', {
            parse: async (data, options = {}) => {
                const content = data.toString();
                const structure = this.parseTextStructure(content, options);
                return this.unifyStructure(structure, 'text', options);
            },
            
            validate: (data) => {
                return { valid: true, encoding: this.detectEncoding(data) };
            }
        });

        // Log File Processor
        this.processors.set('log', {
            parse: async (data, options = {}) => {
                const content = data.toString();
                const structure = this.parseLogStructure(content, options);
                return this.unifyStructure(structure, 'log', options);
            },
            
            validate: (data) => {
                const content = data.toString();
                const lines = content.split('\n');
                const patterns = [
                    /^\d{4}-\d{2}-\d{2}/, // Date pattern
                    /^\[\d{2}:\d{2}:\d{2}\]/, // Time pattern
                    /(ERROR|WARN|INFO|DEBUG)/, // Log level pattern
                ];
                
                let matchedLines = 0;
                lines.forEach(line => {
                    if (patterns.some(pattern => pattern.test(line))) {
                        matchedLines++;
                    }
                });
                
                const logLikelihood = matchedLines / lines.length;
                
                return {
                    valid: true,
                    logLikelihood: logLikelihood,
                    confidence: logLikelihood > 0.5 ? 'high' : 'low'
                };
            }
        });
    }

    initializeFormatDetectors() {
        this.formatDetectors.set('extension', (filePath) => {
            const ext = path.extname(filePath).toLowerCase().slice(1);
            return this.config.supportedFormats.includes(ext) ? ext : null;
        });

        this.formatDetectors.set('content', (data) => {
            const content = data.toString().trim();
            
            // JSON detection
            if ((content.startsWith('{') && content.endsWith('}')) || 
                (content.startsWith('[') && content.endsWith(']'))) {
                try {
                    JSON.parse(content);
                    return 'json';
                } catch {}
            }
            
            // JSONL detection
            if (content.includes('\n') && content.split('\n').every(line => {
                if (!line.trim()) return true;
                try {
                    JSON.parse(line);
                    return true;
                } catch {
                    return false;
                }
            })) {
                return 'jsonl';
            }
            
            // YAML detection
            if (content.includes('---') || content.match(/^[a-zA-Z_][a-zA-Z0-9_]*:\s/m)) {
                try {
                    yaml.load(content);
                    return 'yaml';
                } catch {}
            }
            
            // XML detection
            if (content.startsWith('<?xml') || (content.startsWith('<') && content.endsWith('>'))) {
                return 'xml';
            }
            
            // CSV detection
            if (content.includes(',') && content.split('\n').length > 1) {
                const lines = content.split('\n').filter(line => line.trim());
                const firstLineCommas = (lines[0].match(/,/g) || []).length;
                if (firstLineCommas > 0 && lines.slice(1, 5).every(line => 
                    Math.abs((line.match(/,/g) || []).length - firstLineCommas) <= 1
                )) {
                    return 'csv';
                }
            }
            
            // Markdown detection
            if (content.match(/^#{1,6}\s/m) || content.includes('```') || content.includes('**')) {
                return 'md';
            }
            
            // Log detection
            if (content.match(/^\d{4}-\d{2}-\d{2}/m) || content.match(/\[(ERROR|WARN|INFO|DEBUG)\]/)) {
                return 'log';
            }
            
            // Default to text
            return 'txt';
        });

        this.formatDetectors.set('magic_bytes', (data) => {
            const bytes = new Uint8Array(data.slice(0, 16));
            
            // XML with BOM
            if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
                const text = data.slice(3).toString();
                if (text.trim().startsWith('<?xml')) return 'xml';
            }
            
            // Other magic byte detections can be added here
            return null;
        });
    }

    async detectFormat(input, filename = null) {
        let detectedFormat = null;
        
        // Try filename extension first
        if (filename) {
            detectedFormat = this.formatDetectors.get('extension')(filename);
            if (detectedFormat) {
                console.log(`Format detected by extension: ${detectedFormat}`);
                return detectedFormat;
            }
        }
        
        // Try magic bytes
        if (Buffer.isBuffer(input)) {
            detectedFormat = this.formatDetectors.get('magic_bytes')(input);
            if (detectedFormat) {
                console.log(`Format detected by magic bytes: ${detectedFormat}`);
                return detectedFormat;
            }
        }
        
        // Try content analysis
        detectedFormat = this.formatDetectors.get('content')(input);
        console.log(`Format detected by content analysis: ${detectedFormat}`);
        
        return detectedFormat || 'txt';
    }

    unifyStructure(data, sourceFormat, options = {}) {
        const unified = {
            id: this.generateId(data),
            type: 'unified_data',
            source_format: sourceFormat,
            timestamp: Date.now(),
            metadata: {
                processed_by: 'UnifiedDataProcessor',
                version: '1.0.0',
                options: options,
                ...options.metadata
            },
            content: null,
            structure: null,
            relationships: [],
            tags: [],
            quality_score: 1.0
        };

        // Analyze and structure the data based on its type
        if (Array.isArray(data)) {
            unified.structure = {
                type: 'array',
                length: data.length,
                item_types: this.analyzeArrayTypes(data),
                schema: this.inferArraySchema(data)
            };
            unified.content = data.map((item, index) => ({
                index: index,
                data: item,
                type: typeof item,
                id: this.generateId(item, index)
            }));
        } else if (typeof data === 'object' && data !== null) {
            unified.structure = {
                type: 'object',
                keys: Object.keys(data),
                schema: this.inferObjectSchema(data),
                depth: this.calculateObjectDepth(data)
            };
            unified.content = this.flattenObject(data);
        } else {
            unified.structure = {
                type: 'primitive',
                data_type: typeof data,
                length: data.toString().length
            };
            unified.content = data;
        }

        // Add format-specific enhancements
        unified.relationships = this.findRelationships(unified.content, sourceFormat);
        unified.tags = this.generateTags(unified.content, sourceFormat);
        unified.quality_score = this.calculateQualityScore(unified, sourceFormat);

        return unified;
    }

    analyzeArrayTypes(array) {
        const types = new Map();
        array.forEach(item => {
            const type = Array.isArray(item) ? 'array' : typeof item;
            types.set(type, (types.get(type) || 0) + 1);
        });
        return Object.fromEntries(types);
    }

    inferArraySchema(array) {
        if (array.length === 0) return null;
        
        const sample = array.slice(0, 10); // Sample first 10 items
        const schemas = sample.map(item => this.inferItemSchema(item));
        
        // Find common schema patterns
        return this.mergeSchemas(schemas);
    }

    inferObjectSchema(obj) {
        const schema = {};
        for (const [key, value] of Object.entries(obj)) {
            schema[key] = this.inferItemSchema(value);
        }
        return schema;
    }

    inferItemSchema(item) {
        if (item === null) return { type: 'null' };
        if (Array.isArray(item)) return { type: 'array', items: this.inferArraySchema(item) };
        if (typeof item === 'object') return { type: 'object', properties: this.inferObjectSchema(item) };
        
        const type = typeof item;
        const schema = { type };
        
        if (type === 'string') {
            schema.format = this.detectStringFormat(item);
            schema.length = item.length;
        } else if (type === 'number') {
            schema.format = Number.isInteger(item) ? 'integer' : 'float';
            schema.range = { min: item, max: item };
        }
        
        return schema;
    }

    detectStringFormat(str) {
        // Email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return 'email';
        
        // URL
        if (/^https?:\/\//.test(str)) return 'url';
        
        // Date/Time
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return 'date';
        if (/^\d{2}:\d{2}:\d{2}/.test(str)) return 'time';
        if (Date.parse(str)) return 'datetime';
        
        // UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return 'uuid';
        
        // Phone
        if (/^\+?[\d\s\-\(\)]+$/.test(str) && str.replace(/\D/g, '').length >= 10) return 'phone';
        
        // JSON
        if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
            try {
                JSON.parse(str);
                return 'json';
            } catch {}
        }
        
        return 'text';
    }

    calculateObjectDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        
        let maxDepth = currentDepth;
        for (const value of Object.values(obj)) {
            if (typeof value === 'object' && value !== null) {
                maxDepth = Math.max(maxDepth, this.calculateObjectDepth(value, currentDepth + 1));
            }
        }
        
        return maxDepth;
    }

    flattenObject(obj, prefix = '', result = {}) {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.flattenObject(value, newKey, result);
            } else {
                result[newKey] = {
                    value: value,
                    type: Array.isArray(value) ? 'array' : typeof value,
                    path: newKey.split('.'),
                    id: this.generateId(value, newKey)
                };
            }
        }
        
        return result;
    }

    findRelationships(content, sourceFormat) {
        const relationships = [];
        
        if (typeof content === 'object' && content !== null) {
            // Look for ID references
            for (const [key, item] of Object.entries(content)) {
                if (item.value && typeof item.value === 'string') {
                    // Foreign key relationships
                    if (key.toLowerCase().includes('id') && key !== 'id') {
                        relationships.push({
                            type: 'foreign_key',
                            from: key,
                            to: item.value,
                            confidence: 0.8
                        });
                    }
                    
                    // Email relationships
                    if (item.value.includes('@')) {
                        relationships.push({
                            type: 'email_reference',
                            field: key,
                            value: item.value,
                            confidence: 0.9
                        });
                    }
                }
            }
        }
        
        return relationships;
    }

    generateTags(content, sourceFormat) {
        const tags = [sourceFormat];
        
        if (typeof content === 'object' && content !== null) {
            const keys = Object.keys(content);
            
            // Add domain-specific tags based on common field names
            if (keys.some(key => ['user', 'username', 'email'].includes(key.toLowerCase()))) {
                tags.push('user_data');
            }
            
            if (keys.some(key => ['price', 'cost', 'amount', 'currency'].includes(key.toLowerCase()))) {
                tags.push('financial_data');
            }
            
            if (keys.some(key => ['timestamp', 'date', 'created_at', 'updated_at'].includes(key.toLowerCase()))) {
                tags.push('temporal_data');
            }
            
            if (keys.some(key => ['lat', 'lon', 'latitude', 'longitude', 'address'].includes(key.toLowerCase()))) {
                tags.push('location_data');
            }
        }
        
        return [...new Set(tags)]; // Remove duplicates
    }

    calculateQualityScore(unified, sourceFormat) {
        let score = 1.0;
        
        // Penalize for missing required fields
        if (!unified.content) score -= 0.3;
        if (!unified.structure) score -= 0.2;
        
        // Bonus for rich structure
        if (unified.structure && unified.structure.schema) score += 0.1;
        if (unified.relationships.length > 0) score += 0.1;
        if (unified.tags.length > 1) score += 0.05;
        
        // Format-specific adjustments
        switch (sourceFormat) {
            case 'json':
            case 'yaml':
                score += 0.1; // Well-structured formats
                break;
            case 'csv':
                score += 0.05; // Structured but limited
                break;
            case 'txt':
                score -= 0.1; // Unstructured
                break;
        }
        
        return Math.max(0.0, Math.min(1.0, score));
    }

    parseMarkdownStructure(content) {
        const structure = {
            headings: [],
            codeBlocks: [],
            links: [],
            images: [],
            lists: [],
            tables: [],
            content: content
        };

        const lines = content.split('\n');
        let currentSection = null;
        let inCodeBlock = false;
        let codeBlockStart = -1;

        lines.forEach((line, index) => {
            // Headings
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const title = headingMatch[2];
                const heading = {
                    level: level,
                    title: title,
                    line: index + 1,
                    id: this.generateId(title)
                };
                structure.headings.push(heading);
                currentSection = heading;
            }

            // Code blocks
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeBlockStart = index;
                } else {
                    inCodeBlock = false;
                    structure.codeBlocks.push({
                        language: lines[codeBlockStart].slice(3) || 'text',
                        content: lines.slice(codeBlockStart + 1, index).join('\n'),
                        startLine: codeBlockStart + 1,
                        endLine: index + 1
                    });
                }
            }

            // Links
            const linkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
            if (linkMatches) {
                linkMatches.forEach(match => {
                    const [, text, url] = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
                    structure.links.push({
                        text: text,
                        url: url,
                        line: index + 1,
                        section: currentSection?.title
                    });
                });
            }

            // Images
            const imageMatches = line.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
            if (imageMatches) {
                imageMatches.forEach(match => {
                    const [, alt, src] = match.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                    structure.images.push({
                        alt: alt,
                        src: src,
                        line: index + 1,
                        section: currentSection?.title
                    });
                });
            }

            // Lists
            if (line.match(/^\s*[\*\-\+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
                if (!structure.lists.find(list => list.startLine === index + 1)) {
                    structure.lists.push({
                        type: line.match(/^\s*\d+\.\s+/) ? 'ordered' : 'unordered',
                        startLine: index + 1,
                        section: currentSection?.title
                    });
                }
            }
        });

        return structure;
    }

    parseTextStructure(content, options = {}) {
        const structure = {
            lines: content.split('\n').length,
            words: content.split(/\s+/).filter(word => word.length > 0).length,
            characters: content.length,
            paragraphs: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            sentences: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
            content: content
        };

        // Detect patterns
        const patterns = {
            emails: content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
            urls: content.match(/https?:\/\/[^\s]+/g) || [],
            phones: content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [],
            dates: content.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g) || []
        };

        structure.patterns = patterns;
        structure.entities = Object.values(patterns).flat().length;

        return structure;
    }

    parseLogStructure(content, options = {}) {
        const lines = content.split('\n').filter(line => line.trim());
        const structure = {
            totalLines: lines.length,
            entries: [],
            levels: new Map(),
            timeRange: { start: null, end: null },
            content: content
        };

        const logPatterns = [
            // Standard log format: [TIMESTAMP] [LEVEL] MESSAGE
            /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)$/,
            // Common log format: TIMESTAMP LEVEL MESSAGE
            /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\s]*)\s+(ERROR|WARN|INFO|DEBUG|TRACE)\s+(.+)$/i,
            // Syslog format
            /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^:]+):\s*(.+)$/
        ];

        lines.forEach((line, index) => {
            let parsed = null;

            for (const pattern of logPatterns) {
                const match = line.match(pattern);
                if (match) {
                    parsed = {
                        lineNumber: index + 1,
                        timestamp: match[1],
                        level: match[2],
                        message: match[3] || match[4] || '',
                        raw: line
                    };
                    break;
                }
            }

            if (parsed) {
                structure.entries.push(parsed);
                
                // Count levels
                const level = parsed.level.toUpperCase();
                structure.levels.set(level, (structure.levels.get(level) || 0) + 1);
                
                // Track time range
                const timestamp = new Date(parsed.timestamp);
                if (!isNaN(timestamp.getTime())) {
                    if (!structure.timeRange.start || timestamp < structure.timeRange.start) {
                        structure.timeRange.start = timestamp;
                    }
                    if (!structure.timeRange.end || timestamp > structure.timeRange.end) {
                        structure.timeRange.end = timestamp;
                    }
                }
            }
        });

        structure.parsedLines = structure.entries.length;
        structure.parseRate = structure.entries.length / structure.totalLines;
        structure.levels = Object.fromEntries(structure.levels);

        return structure;
    }

    detectEncoding(data) {
        // Simple encoding detection
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        
        // Check for BOM
        if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return 'utf8';
        }
        
        if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
            return 'utf16le';
        }
        
        if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
            return 'utf16be';
        }
        
        // Default to UTF-8
        return 'utf8';
    }

    generateId(data, context = '') {
        const hash = createHash('sha256');
        hash.update(JSON.stringify(data) + context + Date.now());
        return hash.digest('hex').slice(0, 16);
    }

    mergeSchemas(schemas) {
        // Simplified schema merging - in production, this would be more sophisticated
        if (schemas.length === 0) return null;
        if (schemas.length === 1) return schemas[0];
        
        const merged = { type: 'mixed', variants: schemas };
        
        // If all schemas have the same type, merge them
        const types = [...new Set(schemas.map(s => s.type))];
        if (types.length === 1) {
            merged.type = types[0];
            
            if (types[0] === 'object') {
                merged.properties = {};
                schemas.forEach(schema => {
                    if (schema.properties) {
                        Object.assign(merged.properties, schema.properties);
                    }
                });
            }
        }
        
        return merged;
    }

    async processFile(filePath, options = {}) {
        try {
            console.log(`🔍 Processing file: ${filePath}`);
            
            // Check file size
            const stats = await fs.stat(filePath);
            if (stats.size > this.config.maxFileSize) {
                throw new Error(`File too large: ${stats.size} bytes (max: ${this.config.maxFileSize})`);
            }
            
            // Detect format
            const format = await this.detectFormat(null, filePath);
            console.log(`📝 Detected format: ${format}`);
            
            // Choose processing strategy
            if (this.config.enableStreaming && stats.size > this.config.chunkSize) {
                return await this.processFileStream(filePath, format, options);
            } else {
                return await this.processFileBuffer(filePath, format, options);
            }
            
        } catch (error) {
            console.error(`❌ Error processing file ${filePath}:`, error);
            throw error;
        }
    }

    async processFileBuffer(filePath, format, options = {}) {
        const data = await fs.readFile(filePath);
        
        // Validate if required
        if (this.config.validateData) {
            const processor = this.processors.get(format);
            if (processor && processor.validate) {
                const validation = processor.validate(data);
                if (!validation.valid) {
                    throw new Error(`Validation failed: ${validation.error || validation.errors?.join(', ')}`);
                }
                console.log('✅ Validation passed');
            }
        }
        
        // Process the data
        const processor = this.processors.get(format);
        if (!processor) {
            throw new Error(`No processor available for format: ${format}`);
        }
        
        const result = await processor.parse(data, options);
        
        // Add file metadata
        result.file_metadata = {
            path: filePath,
            size: data.length,
            format: format,
            processed_at: new Date().toISOString()
        };
        
        this.emit('file_processed', { filePath, format, result });
        return result;
    }

    async processFileStream(filePath, format, options = {}) {
        console.log(`🌊 Using streaming for large file: ${filePath}`);
        
        const processor = this.processors.get(format);
        if (!processor || !processor.stream) {
            // Fall back to buffer processing
            return await this.processFileBuffer(filePath, format, options);
        }
        
        const results = [];
        const readStream = createReadStream(filePath, { highWaterMark: this.config.chunkSize });
        const transformStream = processor.stream(options);
        
        await pipeline(
            readStream,
            transformStream,
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    if (Array.isArray(chunk)) {
                        results.push(...chunk);
                    } else {
                        results.push(chunk);
                    }
                    callback();
                }
            })
        );
        
        const result = {
            type: 'streamed_collection',
            count: results.length,
            items: results,
            file_metadata: {
                path: filePath,
                format: format,
                processed_at: new Date().toISOString(),
                streaming: true
            }
        };
        
        this.emit('file_processed', { filePath, format, result });
        return result;
    }

    async processData(data, format = null, options = {}) {
        // Auto-detect format if not provided
        if (!format) {
            format = await this.detectFormat(data);
        }
        
        console.log(`🔍 Processing data as format: ${format}`);
        
        // Validate if required
        if (this.config.validateData) {
            const processor = this.processors.get(format);
            if (processor && processor.validate) {
                const validation = processor.validate(data);
                if (!validation.valid) {
                    console.warn('⚠️ Validation warnings:', validation);
                    if (validation.errors) {
                        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }
                }
            }
        }
        
        // Process the data
        const processor = this.processors.get(format);
        if (!processor) {
            throw new Error(`No processor available for format: ${format}`);
        }
        
        const result = await processor.parse(data, options);
        
        // Add processing metadata
        result.processing_metadata = {
            format: format,
            processed_at: new Date().toISOString(),
            processor_version: '1.0.0'
        };
        
        this.emit('data_processed', { format, result });
        return result;
    }

    async convertFormat(data, sourceFormat, targetFormat, options = {}) {
        console.log(`🔄 Converting ${sourceFormat} → ${targetFormat}`);
        
        // First, parse the source data
        const unified = await this.processData(data, sourceFormat, options);
        
        // Then convert to target format
        return await this.exportFormat(unified, targetFormat, options);
    }

    async exportFormat(unifiedData, targetFormat, options = {}) {
        const exporters = {
            'json': (data) => JSON.stringify(data, null, options.indent || 2),
            'yaml': (data) => yaml.dump(data, { indent: options.indent || 2 }),
            'csv': (data) => this.exportToCSV(data, options),
            'xml': (data) => this.exportToXML(data, options),
            'unified_json': (data) => JSON.stringify(data, null, 2)
        };
        
        const exporter = exporters[targetFormat];
        if (!exporter) {
            throw new Error(`No exporter available for format: ${targetFormat}`);
        }
        
        return exporter(unifiedData);
    }

    exportToCSV(data, options = {}) {
        // Convert unified data to CSV
        let rows = [];
        
        if (data.content && Array.isArray(data.content)) {
            // Extract headers
            const headers = new Set();
            data.content.forEach(item => {
                if (item.data && typeof item.data === 'object') {
                    Object.keys(item.data).forEach(key => headers.add(key));
                }
            });
            
            const headerArray = Array.from(headers);
            rows.push(headerArray.join(','));
            
            // Convert data rows
            data.content.forEach(item => {
                if (item.data && typeof item.data === 'object') {
                    const row = headerArray.map(header => {
                        const value = item.data[header];
                        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                    });
                    rows.push(row.join(','));
                }
            });
        }
        
        return rows.join('\n');
    }

    exportToXML(data, options = {}) {
        const builder = new xml2js.Builder({
            rootName: options.rootName || 'data',
            headless: options.headless || false
        });
        
        return builder.buildObject(data);
    }

    startProcessingQueue() {
        setInterval(() => {
            if (this.processingQueue.length > 0 && this.activeJobs.size < 5) {
                const job = this.processingQueue.shift();
                this.executeJob(job);
            }
        }, 100);
    }

    async executeJob(job) {
        const jobId = this.generateId(job);
        this.activeJobs.set(jobId, job);
        
        try {
            job.startTime = Date.now();
            const result = await job.execute();
            job.endTime = Date.now();
            job.duration = job.endTime - job.startTime;
            job.status = 'completed';
            job.result = result;
            
            this.emit('job_completed', job);
        } catch (error) {
            job.endTime = Date.now();
            job.duration = job.endTime - job.startTime;
            job.status = 'failed';
            job.error = error.message;
            
            this.emit('job_failed', job);
        } finally {
            this.activeJobs.delete(jobId);
        }
    }

    queueProcessing(data, format, options = {}) {
        const job = {
            id: this.generateId({ data, format, options }),
            type: 'data_processing',
            data: data,
            format: format,
            options: options,
            status: 'queued',
            createdAt: Date.now(),
            execute: async () => {
                return await this.processData(data, format, options);
            }
        };
        
        this.processingQueue.push(job);
        this.emit('job_queued', job);
        
        return job.id;
    }

    // API integration methods
    handleDataProcessingAPI(method, path, params = {}, body = null) {
        try {
            switch (`${method} ${path}`) {
                case 'POST /api/data/process':
                    if (!body.data) throw new Error('Data required');
                    return this.processData(body.data, body.format, body.options || {});
                
                case 'POST /api/data/file':
                    if (!body.filePath) throw new Error('File path required');
                    return this.processFile(body.filePath, body.options || {});
                
                case 'POST /api/data/convert':
                    if (!body.data || !body.sourceFormat || !body.targetFormat) {
                        throw new Error('Data, sourceFormat, and targetFormat required');
                    }
                    return this.convertFormat(body.data, body.sourceFormat, body.targetFormat, body.options || {});
                
                case 'POST /api/data/queue':
                    if (!body.data) throw new Error('Data required');
                    return { jobId: this.queueProcessing(body.data, body.format, body.options || {}) };
                
                case 'GET /api/data/formats':
                    return {
                        supported: this.config.supportedFormats,
                        processors: Array.from(this.processors.keys())
                    };
                
                case 'GET /api/data/status':
                    return {
                        queueLength: this.processingQueue.length,
                        activeJobs: this.activeJobs.size,
                        config: this.config
                    };
                
                default:
                    throw new Error(`Unknown endpoint: ${method} ${path}`);
            }
        } catch (error) {
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    getSystemStatus() {
        return {
            supported_formats: this.config.supportedFormats,
            active_processors: Array.from(this.processors.keys()),
            queue_length: this.processingQueue.length,
            active_jobs: this.activeJobs.size,
            cache_size: this.dataCache.size,
            config: this.config
        };
    }
}

// Example usage and testing
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔄 Starting Unified Data Processor...');
    
    const processor = new UnifiedDataProcessor({
        validateData: true,
        enableStreaming: true
    });
    
    // Test different data formats
    const testData = {
        json: { "users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}] },
        jsonl: '{"id": 1, "name": "John"}\n{"id": 2, "name": "Jane"}\n{"id": 3, "name": "Bob"}',
        yaml: 'users:\n  - id: 1\n    name: John\n  - id: 2\n    name: Jane',
        csv: 'id,name,email\n1,John,john@test.com\n2,Jane,jane@test.com',
        markdown: '# Users\n\n- John (ID: 1)\n- Jane (ID: 2)\n\n```json\n{"users": true}\n```'
    };
    
    // Test each format
    Object.entries(testData).forEach(async ([format, data]) => {
        try {
            console.log(`\n🧪 Testing ${format.toUpperCase()} processing:`);
            const result = await processor.processData(data, format);
            console.log(`✅ ${format} processed successfully`);
            console.log(`📊 Quality score: ${result.quality_score}`);
            console.log(`🏷️ Tags: ${result.tags.join(', ')}`);
        } catch (error) {
            console.error(`❌ ${format} processing failed:`, error.message);
        }
    });
    
    processor.on('data_processed', ({ format, result }) => {
        console.log(`📈 Event: ${format} data processed with quality score ${result.quality_score}`);
    });
    
    console.log('\n📊 System Status:', processor.getSystemStatus());
}

export default UnifiedDataProcessor;