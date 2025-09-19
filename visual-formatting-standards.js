#!/usr/bin/env node

/**
 * VISUAL FORMATTING STANDARDS
 * 
 * Standardizes newline/color/bitmap handling across all systems
 * Integrates with Solidity, Flask, Rust, and JavaScript components
 * Provides repeatable patterns for citations and documentation
 */

const { SchemaRegistry } = require('./schema-registry');
const { getResourceManager } = require('./resource-manager');

class VisualFormattingStandards {
    constructor(options = {}) {
        this.resourceManager = getResourceManager();
        this.schemaRegistry = new SchemaRegistry();
        
        // Standard color palette with accessibility support
        this.colors = {
            // Primary status colors (high contrast, color-blind friendly)
            success: {
                hex: '#00ff88',
                rgb: [0, 255, 136],
                name: 'success-green',
                description: 'Pass/success state',
                accessibility: {
                    contrast: 'high',
                    colorBlindSafe: true,
                    textColor: '#000000'
                }
            },
            error: {
                hex: '#ff4444', 
                rgb: [255, 68, 68],
                name: 'error-red',
                description: 'Fail/error state',
                accessibility: {
                    contrast: 'high',
                    colorBlindSafe: true,
                    textColor: '#ffffff'
                }
            },
            warning: {
                hex: '#ffaa00',
                rgb: [255, 170, 0],
                name: 'warning-orange',
                description: 'Warning/caution state',
                accessibility: {
                    contrast: 'high',
                    colorBlindSafe: true,
                    textColor: '#000000'
                }
            },
            info: {
                hex: '#00aaff',
                rgb: [0, 170, 255],
                name: 'info-blue',
                description: 'Information/neutral state',
                accessibility: {
                    contrast: 'high',
                    colorBlindSafe: true,
                    textColor: '#000000'
                }
            },
            // Special Soulfra colors
            soulfra: {
                hex: '#9400d3',
                rgb: [148, 0, 211],
                name: 'soulfra-purple',
                description: 'Soulfra brand color',
                accessibility: {
                    contrast: 'high',
                    colorBlindSafe: false,
                    textColor: '#ffffff'
                }
            },
            // Shadow/stealth colors
            shadow: {
                hex: '#1a1a1a',
                rgb: [26, 26, 26],
                name: 'shadow-dark',
                description: 'Shadow agent/stealth mode',
                accessibility: {
                    contrast: 'low',
                    colorBlindSafe: true,
                    textColor: '#ffffff'
                }
            }
        };
        
        // Newline handling patterns
        this.newlinePatterns = {
            // Preserve all formatting for documentation
            preserve: {
                name: 'preserve-formatting',
                description: 'Maintain all original newlines and spacing',
                pattern: /(\r\n|\n|\r)/g,
                replacement: '$1',
                usage: ['documentation', 'code-blocks', 'ascii-art']
            },
            // Normalize for cross-platform compatibility  
            normalize: {
                name: 'normalize-newlines',
                description: 'Convert all newlines to \\n',
                pattern: /\r\n|\r/g,
                replacement: '\n',
                usage: ['cross-platform', 'json', 'database']
            },
            // Ticker tape compatible (single line with separators)
            tickerTape: {
                name: 'ticker-tape',
                description: 'Convert newlines to separators for streaming',
                pattern: /\r\n|\n|\r/g,
                replacement: ' | ',
                usage: ['streaming', 'logs', 'status-updates']
            },
            // OCR friendly (preserve line structure)
            ocrFriendly: {
                name: 'ocr-friendly',
                description: 'Structure for optical character recognition',
                pattern: /(\r\n|\n|\r){2,}/g,
                replacement: '\n\n',
                usage: ['ocr', 'pdf-generation', 'printed-output']
            }
        };
        
        // Bitmap specifications
        this.bitmapSpecs = {
            // Standard 8x8 bitmap for icons
            icon8x8: {
                width: 8,
                height: 8,
                format: 'binary',
                description: 'Standard icon bitmap',
                usage: ['agent-visualization', 'status-indicators']
            },
            // Larger 16x16 for complex visuals
            display16x16: {
                width: 16,
                height: 16,
                format: 'rgba',
                description: 'Display bitmap with color',
                usage: ['ui-elements', 'game-sprites']
            },
            // Million Dollar Pixel style compression
            mdpCompression: {
                name: 'million-dollar-pixel',
                description: 'Extreme compression for blockchain storage',
                maxSize: 1000000, // 1MB limit
                compression: 'lossless',
                usage: ['blockchain', 'nft', 'permanent-storage']
            }
        };
        
        console.log('🎨 Visual Formatting Standards initialized');
    }
    
    // Color utilities
    getColor(colorName, format = 'hex') {
        const color = this.colors[colorName];
        if (!color) {
            throw new Error(`Unknown color: ${colorName}`);
        }
        
        switch (format) {
            case 'hex':
                return color.hex;
            case 'rgb':
                return color.rgb;
            case 'css':
                return `rgb(${color.rgb.join(', ')})`;
            case 'object':
                return color;
            default:
                return color.hex;
        }
    }
    
    // Generate CSS color variables
    generateCSSVariables() {
        let css = ':root {\n';
        
        for (const [name, color] of Object.entries(this.colors)) {
            css += `  --color-${color.name}: ${color.hex};\n`;
            css += `  --color-${color.name}-text: ${color.accessibility.textColor};\n`;
        }
        
        css += '}\n\n';
        
        // Add utility classes
        css += '/* Utility classes for consistent coloring */\n';
        for (const [name, color] of Object.entries(this.colors)) {
            css += `.${color.name} {\n`;
            css += `  color: var(--color-${color.name});\n`;
            css += '}\n';
            
            css += `.bg-${color.name} {\n`;
            css += `  background-color: var(--color-${color.name});\n`;
            css += `  color: var(--color-${color.name}-text);\n`;
            css += '}\n\n';
        }
        
        return css;
    }
    
    // Newline handling
    processNewlines(text, patternName = 'normalize') {
        const pattern = this.newlinePatterns[patternName];
        if (!pattern) {
            throw new Error(`Unknown newline pattern: ${patternName}`);
        }
        
        return text.replace(pattern.pattern, pattern.replacement);
    }
    
    // Smart newline detection and conversion
    smartNewlineConversion(text, targetContext) {
        // Detect current newline style
        const hasCarriageReturn = text.includes('\r\n');
        const hasMixedNewlines = text.includes('\r') || text.includes('\n');
        
        let recommendedPattern;
        
        switch (targetContext) {
            case 'web':
            case 'json':
            case 'api':
                recommendedPattern = 'normalize';
                break;
                
            case 'documentation':
            case 'markdown':
            case 'readme':
                recommendedPattern = 'preserve';
                break;
                
            case 'logging':
            case 'streaming':
            case 'ticker':
                recommendedPattern = 'tickerTape';
                break;
                
            case 'pdf':
            case 'print':
            case 'ocr':
                recommendedPattern = 'ocrFriendly';
                break;
                
            default:
                recommendedPattern = 'normalize';
        }
        
        return {
            originalStyle: hasCarriageReturn ? 'crlf' : (hasMixedNewlines ? 'mixed' : 'lf'),
            recommendedPattern,
            converted: this.processNewlines(text, recommendedPattern)
        };
    }
    
    // Bitmap generation and validation
    generateBitmap(data, spec = 'icon8x8') {
        const bitmapSpec = this.bitmapSpecs[spec];
        if (!bitmapSpec) {
            throw new Error(`Unknown bitmap spec: ${spec}`);
        }
        
        const { width, height, format } = bitmapSpec;
        
        if (format === 'binary') {
            return this.generateBinaryBitmap(data, width, height);
        } else if (format === 'rgba') {
            return this.generateRGBABitmap(data, width, height);
        }
    }
    
    generateBinaryBitmap(data, width, height) {
        const bitmap = Array(height).fill().map(() => Array(width).fill(0));
        
        // Convert data to bitmap pattern
        if (typeof data === 'string') {
            // Use string hash to generate pattern
            const hash = this.simpleHash(data);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    bitmap[y][x] = (hash >> (index % 32)) & 1;
                }
            }
        } else if (Array.isArray(data)) {
            // Use provided array data
            for (let y = 0; y < height && y < data.length; y++) {
                for (let x = 0; x < width && x < data[y].length; x++) {
                    bitmap[y][x] = data[y][x] ? 1 : 0;
                }
            }
        }
        
        return {
            data: bitmap,
            width,
            height,
            format: 'binary',
            hash: this.generateBitmapHash(bitmap)
        };
    }
    
    generateRGBABitmap(data, width, height) {
        // Implementation for RGBA bitmaps
        const bitmap = Array(height).fill().map(() => 
            Array(width).fill().map(() => ({ r: 0, g: 0, b: 0, a: 255 }))
        );
        
        return {
            data: bitmap,
            width,
            height,
            format: 'rgba',
            hash: this.generateBitmapHash(bitmap)
        };
    }
    
    // Solidity integration - generate bitmap as bytes
    bitmapToSolidityBytes(bitmap) {
        if (bitmap.format !== 'binary') {
            throw new Error('Only binary bitmaps can be converted to Solidity bytes');
        }
        
        const flatBits = bitmap.data.flat();
        const bytes = [];
        
        // Pack bits into bytes (8 bits per byte)
        for (let i = 0; i < flatBits.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8 && i + j < flatBits.length; j++) {
                if (flatBits[i + j]) {
                    byte |= (1 << (7 - j));
                }
            }
            bytes.push(byte);
        }
        
        // Convert to Solidity bytes format
        const hexBytes = bytes.map(b => '0x' + b.toString(16).padStart(2, '0'));
        return `bytes(${JSON.stringify(hexBytes.join(''))})`;
    }
    
    // Citation formatting with proper newlines and colors
    generateCitation(data, style = 'academic') {
        const { title, authors, date, url, type } = data;
        
        let citation = '';
        
        switch (style) {
            case 'academic':
                citation = `${authors.join(', ')}. (${date}). *${title}*`;
                if (url) citation += `. Retrieved from ${url}`;
                break;
                
            case 'blockchain':
                const hash = this.simpleHash(JSON.stringify(data));
                citation = `[${title}] by ${authors.join(', ')} (${date})`;
                citation += `\nHash: ${hash.toString(16)}`;
                if (url) citation += `\nURL: ${url}`;
                break;
                
            case 'technical':
                citation = `${title}\n`;
                citation += `Authors: ${authors.join(', ')}\n`;
                citation += `Date: ${date}\n`;
                if (url) citation += `Reference: ${url}\n`;
                break;
        }
        
        return this.processNewlines(citation, 'preserve');
    }
    
    // Bill formatting with consistent styling
    generateBill(data) {
        const { invoiceNumber, date, items, total, customer } = data;
        
        let bill = `INVOICE #${invoiceNumber}\n`;
        bill += `Date: ${date}\n`;
        bill += `Customer: ${customer}\n\n`;
        
        bill += 'ITEMS:\n';
        bill += '─'.repeat(50) + '\n';
        
        for (const item of items) {
            bill += `${item.description.padEnd(30)} $${item.amount.toFixed(2)}\n`;
        }
        
        bill += '─'.repeat(50) + '\n';
        bill += `TOTAL: $${total.toFixed(2)}\n`;
        
        return this.processNewlines(bill, 'preserve');
    }
    
    // Export format specifications
    exportSpecifications(format = 'json') {
        const specs = {
            colors: this.colors,
            newlinePatterns: this.newlinePatterns,
            bitmapSpecs: this.bitmapSpecs,
            version: '1.0.0',
            lastUpdated: new Date().toISOString()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(specs, null, 2);
            case 'css':
                return this.generateCSSVariables();
            case 'solidity':
                return this.generateSolidityConstants();
            case 'rust':
                return this.generateRustConstants();
            case 'python':
                return this.generatePythonConstants();
            default:
                return specs;
        }
    }
    
    generateSolidityConstants() {
        let solidity = '// SPDX-License-Identifier: MIT\n';
        solidity += 'pragma solidity ^0.8.0;\n\n';
        solidity += 'library VisualFormattingConstants {\n';
        
        // Color constants
        for (const [name, color] of Object.entries(this.colors)) {
            const rgb = color.rgb;
            const packed = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
            solidity += `    uint24 constant ${name.toUpperCase()}_COLOR = 0x${packed.toString(16).padStart(6, '0')};\n`;
        }
        
        solidity += '}\n';
        return solidity;
    }
    
    generateRustConstants() {
        let rust = '// Visual Formatting Constants for Rust\n\n';
        rust += 'pub struct VisualColors;\n\n';
        rust += 'impl VisualColors {\n';
        
        for (const [name, color] of Object.entries(this.colors)) {
            rust += `    pub const ${name.toUpperCase()}: (u8, u8, u8) = (${color.rgb.join(', ')});\n`;
        }
        
        rust += '}\n';
        return rust;
    }
    
    generatePythonConstants() {
        let python = '# Visual Formatting Constants for Python\n\n';
        python += 'class VisualColors:\n';
        
        for (const [name, color] of Object.entries(this.colors)) {
            python += `    ${name.upper()} = "${color.hex}"\n`;
            python += `    ${name.upper()}_RGB = (${color.rgb.join(', ')})\n`;
        }
        
        return python;
    }
    
    // Utility methods
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    generateBitmapHash(bitmap) {
        const flatData = Array.isArray(bitmap[0]) ? bitmap.flat() : bitmap;
        const str = flatData.join('');
        return this.simpleHash(str).toString(16);
    }
}

// CLI interface
if (require.main === module) {
    const formatter = new VisualFormattingStandards();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'colors':
            console.log('🎨 Available Colors:');
            for (const [name, color] of Object.entries(formatter.colors)) {
                console.log(`  ${name}: ${color.hex} (${color.description})`);
            }
            break;
            
        case 'css':
            console.log(formatter.generateCSSVariables());
            break;
            
        case 'solidity':
            console.log(formatter.generateSolidityConstants());
            break;
            
        case 'export':
            const format = process.argv[3] || 'json';
            console.log(formatter.exportSpecifications(format));
            break;
            
        case 'test-bitmap':
            const bitmap = formatter.generateBitmap('test', 'icon8x8');
            console.log('Generated bitmap:', bitmap);
            console.log('Solidity bytes:', formatter.bitmapToSolidityBytes(bitmap));
            break;
            
        case 'test-citation':
            const citation = formatter.generateCitation({
                title: 'Visual Formatting Standards',
                authors: ['System Designer'],
                date: '2025-08-15',
                url: 'https://github.com/example/visual-standards',
                type: 'technical'
            }, 'academic');
            console.log('Generated citation:', citation);
            break;
            
        default:
            console.log('Visual Formatting Standards');
            console.log('');
            console.log('Commands:');
            console.log('  colors      - Show available colors');
            console.log('  css         - Generate CSS variables');
            console.log('  solidity    - Generate Solidity constants');
            console.log('  export      - Export specs (json|css|solidity|rust|python)');
            console.log('  test-bitmap - Test bitmap generation');
            console.log('  test-citation - Test citation formatting');
            console.log('');
            console.log('Features:');
            console.log('  🎨 Standardized color palette with accessibility');
            console.log('  📝 Smart newline handling for different contexts');
            console.log('  🖼️ Bitmap generation and validation');
            console.log('  🔗 Cross-language constant generation');
            console.log('  📋 Citation and bill formatting');
    }
}

module.exports = { VisualFormattingStandards };